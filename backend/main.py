import asyncio
import os
import io
import json
import time
import re
import sqlite3
import urllib.request
import urllib.parse
import concurrent.futures
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langdetect import detect, DetectorFactory
from dotenv import load_dotenv
import pypdf
import docx
import speech_recognition as sr

from services.orchestrator import BhashoraOrchestrator, EchoBridgeOrchestrator
from services.language_service import SUPPORTED_LANGUAGES
from services.reply_service import generate_smart_replies

# Load environment variables (.env)
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
except Exception:
    openai_client = None

# Set deterministic seed for fallback detection
DetectorFactory.seed = 0

app = FastAPI(title="Bhashora AI Live Interpreter API", version="3.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite Database Setup
DB_PATH = os.path.join(os.path.dirname(__file__), "translations.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS translations (
            id TEXT PRIMARY KEY,
            original_text TEXT NOT NULL,
            translated_text TEXT NOT NULL,
            source_lang TEXT,
            detected_lang TEXT,
            detected_code TEXT,
            target_lang TEXT,
            transliterated_script TEXT,
            favorite INTEGER DEFAULT 0,
            latency_ms REAL DEFAULT 0,
            time_str TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            plan TEXT DEFAULT 'Pro Member',
            avatar TEXT
        )
    ''')
    cur.execute('SELECT COUNT(*) FROM users')
    if cur.fetchone()[0] == 0:
        cur.execute('''
            INSERT INTO users (id, name, email, plan, avatar)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            'usr_1',
            'Vaishnavi Anugu',
            'vaishnavi@example.com',
            'Pro Member',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
        ))
    else:
        cur.execute('''
            UPDATE users 
            SET name = 'Vaishnavi Anugu', email = 'vaishnavi@example.com' 
            WHERE name = 'John Doe' OR email = 'john@example.com'
        ''')
    conn.commit()
    conn.close()

init_db()

SUPPORTED_LANGUAGES = {
    'auto': 'Auto Detect',
    'en': 'English',
    'te': 'Telugu (తెలుగు)',
    'hi': 'Hindi (हिन्दी)',
    'ta': 'Tamil (தமிழ்)',
    'kn': 'Kannada (ಕನ್ನಡ)',
    'ml': 'Malayalam (മലയാളം)',
    'mr': 'Marathi (मరాఠీ)',
    'gu': 'Gujarati (ગુજરાતી)',
    'bn': 'Bengali (বাংলা)',
    'pa': 'Punjabi (ਪੰਜਾਬੀ)',
    'ur': 'Urdu (اردو)',
    'es': 'Spanish (Español)',
    'fr': 'French (Français)',
    'de': 'German (Deutsch)',
    'it': 'Italian (Italiano)',
    'pt': 'Portuguese (Português)',
    'ru': 'Russian (Русский)',
    'ja': 'Japanese (日本語)',
    'ko': 'Korean (한국어)',
    'zh-CN': 'Chinese (Simplified)',
    'ar': 'Arabic (العربية)',
    'tr': 'Turkish (Türkçe)',
    'nl': 'Dutch (Nederlands)',
    'pl': 'Polish (Polski)',
    'vi': 'Vietnamese (Tiếng Việt)',
    'id': 'Indonesian (Bahasa)',
    'th': 'Thai (ไทย)',
    'sv': 'Swedish (Svenska)',
    'el': 'Greek (Ελληνικά)',
    'fa': 'Persian (فارسی)',
    'he': 'Hebrew (עברית)',
    'uk': 'Ukrainian (Українська)',
}

# Popular Romanized phrases for immediate sub-10ms lookup
POPULAR_ROMANIZED = {
    'danyavadalu': ('ధన్యవాదాలు', 'te'),
    'dhanyavadalu': ('ధన్యవాదాలు', 'te'),
    'chala danyavadalu': ('చాలా ధన్యవాదాలు', 'te'),
    'chala dhanyavadalu': ('చాలా ధన్యవాదాలు', 'te'),
    'namaskaram': ('నమస్కారం', 'te'),
    'namaste': ('నమస్తే', 'te'),
    'bagunnara': ('బాగున్నారా?', 'te'),
    'bagunnara?': ('బాగున్నారా?', 'te'),
    'bagunara': ('బాగున్నారా?', 'te'),
    'nenu bagunnanu': ('నేను బాగున్నాను', 'te'),
    'ela unnaru': ('ఎలా ఉన్నారు?', 'te'),
    'ela unnaru?': ('ఎలా ఉన్నారు?', 'te'),
    'elavunnaru': ('ఎలా ఉన్నారు?', 'te'),
    'elavunnaru?': ('ఎలా ఉన్నారు?', 'te'),
    'tinnara': ('తిన్నారా?', 'te'),
    'tinnara?': ('తిన్నారా?', 'te'),
    'tinara': ('తిన్నారా?', 'te'),
    'tinara?': ('తిన్నారా?', 'te'),
    'tinnava': ('తిన్నావా?', 'te'),
    'tinnava?': ('తిన్నావా?', 'te'),
    'bhojanam chesara': ('భోజనం చేశారా?', 'te'),
    'bhojanam chesara?': ('భోజనం చేశారా?', 'te'),
    'em chestunnav': ('ఏం చేస్తున్నావ్?', 'te'),
    'em chestunnaru': ('ఏం చేస్తున్నారు?', 'te'),
    'ekkadiki velthunnav': ('ఎక్కడికి వెళ్తున్నావ్?', 'te'),
    'tvaraga randi': ('త్వరగా రండి', 'te'),
    'subhodayam': ('శుభోదయం', 'te'),
    'shubhodayam': ('శుభోదయం', 'te'),
    'subharatri': ('శుభరాత్రి', 'te'),
    'shubharatri': ('శుభరాత్రి', 'te'),
    'subhakankshalu': ('శుభాకాంక్షలు', 'te'),
    'chala thanks': ('చాలా థాంక్స్', 'te'),
    'badha padakandi': ('బాధపడకండి', 'te'),
    'alage': ('అలాగే', 'te'),
    'sare': ('సరే', 'te'),
    'avunu': ('అవును', 'te'),
    'ledu': ('లేదు', 'te'),
    'shukriya': ('शुक्रिया', 'hi'),
    'dhanyawad': ('धन्यवाद', 'hi'),
    'kaise ho': ('कैसे हो?', 'hi'),
    'kaise ho?': ('कैसे हो?', 'hi'),
    'aap kaise ho': ('आप कैसे हैं?', 'hi'),
    'kya kar rahe ho': ('क्या कर रहे हो?', 'hi'),
    'kahan ja rahe ho': ('कहाँ जा रहे हो?', 'hi'),
    'khana khaya': ('खाना खाया?', 'hi'),
    'khana khaya?': ('खाना खाया?', 'hi'),
    'kya haal hai': ('क्या हाल है?', 'hi'),
    'kya haal hai?': ('क्या हाल है?', 'hi'),
    'theek hai': ('ठीक है', 'hi'),
    'haan': ('हाँ', 'hi'),
    'nahi': ('नहीं', 'hi'),
}

# Semantic Intent Map: True Meaning Translation (NOT transliteration)
SEMANTIC_MEANINGS = {
    'greetings': {
        'sources': ['నమస్తే', 'నమస్కారం', 'నమస్కారము', 'హలో', 'namaste', 'namaskaram', 'namaskaramu', 'namaskar', 'pranam', 'pranamaalu', 'hello', 'hi'],
        'translations': {
            'en': 'Hello',
            'hi': 'नमस्ते',
            'te': 'నమస్కారం',
            'es': 'Hola',
            'fr': 'Bonjour',
            'de': 'Hallo',
            'it': 'Ciao',
            'pt': 'Olá',
            'ru': 'Здравствуйте',
            'ja': 'こんにちは',
            'ar': 'مرحبا',
            'zh-CN': '你好',
            'ta': 'வணக்கம்'
        },
        'detected_code': 'te'
    },
    'did_you_eat': {
        'sources': ['తిన్నారా', 'తిన్నారా?', 'తిన్నావా', 'తిన్నావా?', 'tinnara', 'tinnara?', 'tinara', 'tinara?', 'tinnava', 'tinnava?', 'bhojanam chesara', 'bhojanam chesara?', 'khana khaya', 'khana khaya?'],
        'translations': {
            'en': 'Did you eat?',
            'hi': 'क्या आपने खाना खाया?',
            'es': '¿Comiste?',
            'fr': 'As-tu mangé ?',
            'de': 'Hast du gegessen?',
            'te': 'తిన్నారా?',
            'ta': 'சாப்பிட்டீர்களா?'
        },
        'detected_code': 'te'
    },
    'how_are_you': {
        'sources': ['ఎలా ఉన్నారు', 'ఎలా ఉన్నారు?', 'ఎలా ఉన్నావు', 'ఎలా ఉన్నావు?', 'బాగున్నారా', 'బాగున్నారా?', 'ela unnaru', 'ela unnaru?', 'elavunnaru', 'elavunnaru?', 'ela unnav', 'bagunnara', 'bagunnara?', 'bagunara', 'kaise ho', 'kaise ho?', 'aap kaise ho', 'aap kaise ho?', 'kya haal hai', 'kya haal hai?'],
        'translations': {
            'en': 'How are you?',
            'hi': 'आप कैसे हैं?',
            'es': '¿Cómo estás?',
            'fr': 'Comment allez-vous ?',
            'de': 'Wie geht es Ihnen?',
            'te': 'ఎలా ఉన్నారు?',
            'ta': 'எப்படி இருக்கிறீர்கள்?'
        },
        'detected_code': 'te'
    },
    'thank_you': {
        'sources': ['ధన్యవాదాలు', 'ధన్యవాదాలు?', 'చాలా ధన్యవాదాలు', 'danyavadalu', 'dhanyavadalu', 'chala danyavadalu', 'chala dhanyavadalu', 'chala thanks', 'shukriya', 'dhanyawad', 'dhanyavadaalu'],
        'translations': {
            'en': 'Thank you',
            'hi': 'धन्यवाद',
            'es': 'Gracias',
            'fr': 'Merci',
            'de': 'Danke',
            'te': 'ధన్యవాదాలు',
            'ta': 'நன்றி'
        },
        'detected_code': 'te'
    },
    'what_are_you_doing': {
        'sources': ['ఏం చేస్తున్నావ్', 'ఏం చేస్తున్నారు', 'em chestunnav', 'em chestunnaru', 'kya kar rahe ho', 'kya kar rahe ho?'],
        'translations': {
            'en': 'What are you doing?',
            'hi': 'आप क्या कर रहे हैं?',
            'es': '¿Qué estás haciendo?',
            'fr': 'Que fais-tu ?',
            'de': 'Was machst du?',
            'te': 'ఏం చేస్తున్నారు?'
        },
        'detected_code': 'te'
    },
    'where_are_you_going': {
        'sources': ['ఎక్కడికి వెళ్తున్నావ్', 'ఎక్కడికి వెళ్తున్నారు', 'ekkadiki velthunnav', 'ekkadiki velthunnaru', 'kahan ja rahe ho', 'kahan ja rahe ho?'],
        'translations': {
            'en': 'Where are you going?',
            'hi': 'आप कहाँ जा रहे हैं?',
            'es': '¿A dónde vas?',
            'fr': 'Où vas-tu ?',
            'te': 'ఎక్కడికి వెళ్తున్నారు?'
        },
        'detected_code': 'te'
    },
    'good_morning': {
        'sources': ['శుభోదయం', 'subhodayam', 'shubhodayam', 'shubh prabhat'],
        'translations': {
            'en': 'Good morning',
            'hi': 'शुभ प्रभात',
            'es': 'Buenos días',
            'fr': 'Bonjour',
            'de': 'Guten Morgen',
            'te': 'శుభోదయం'
        },
        'detected_code': 'te'
    },
    'good_night': {
        'sources': ['శుభరాత్రి', 'subharatri', 'shubharatri', 'shubh ratri'],
        'translations': {
            'en': 'Good night',
            'hi': 'शुभ रात्रि',
            'es': 'Buenas noches',
            'fr': 'Bonne nuit',
            'de': 'Gute Nacht',
            'te': 'శుభరాత్రి'
        },
        'detected_code': 'te'
    }
}

def resolve_semantic_meaning(text: str, target_lang: str) -> Optional[tuple[str, str, Optional[str]]]:
    """Look up true semantic meaning rather than phonetic loanword transliteration."""
    clean = text.strip().lower()
    clean_no_punct = clean.strip(".,?!")
    for intent, data in SEMANTIC_MEANINGS.items():
        for s in data['sources']:
            if clean == s.lower() or clean_no_punct == s.lower().strip(".,?!"):
                trans = data['translations'].get(target_lang)
                if not trans:
                    base_en = data['translations'].get('en', '')
                    if base_en:
                        try:
                            trans, _ = query_gtx(base_en, sl='en', tl=target_lang)
                        except Exception:
                            trans = base_en
                    else:
                        trans = base_en
                
                # Determine detected code and script representation
                script = None
                if any('\u0c00' <= char <= '\u0c7f' for char in text):
                    detected_code = 'te'
                    script = text.strip()
                elif any('\u0900' <= char <= '\u097f' for char in text):
                    detected_code = 'hi'
                    script = text.strip()
                elif any('\u0b80' <= char <= '\u0bff' for char in text):
                    detected_code = 'ta'
                    script = text.strip()
                elif any('\u0c80' <= char <= '\u0cff' for char in text):
                    detected_code = 'kn'
                    script = text.strip()
                elif clean_no_punct in ('hello', 'hi', 'hey', 'good morning', 'good night', 'thank you', 'thanks', 'how are you'):
                    detected_code = 'en'
                    script = None
                elif clean_no_punct in POPULAR_ROMANIZED:
                    script, detected_code = POPULAR_ROMANIZED[clean_no_punct]
                else:
                    detected_code = data.get('detected_code', 'en')
                    script = data.get('translations', {}).get(detected_code)

                return trans, detected_code, script
    return None

TRANSLATION_CACHE = {}

class TranslateRequest(BaseModel):
    text: str
    source_lang: Optional[str] = 'auto'
    target_lang: str = 'en'
    tone: Optional[str] = 'default'
    scenario: Optional[str] = 'general'
    conversation_context: Optional[List[dict]] = None

class HistoryItemRequest(BaseModel):
    id: str
    original_text: str
    translated_text: str
    source_lang: Optional[str] = 'auto'
    detected_lang: Optional[str] = 'Auto'
    detected_code: Optional[str] = 'auto'
    target_lang: str = 'en'
    transliterated_script: Optional[str] = None
    favorite: Optional[bool] = False
    latency_ms: Optional[float] = 0
    time_str: Optional[str] = None

class ToneRequest(BaseModel):
    text: str
    source_lang: Optional[str] = 'auto'
    target_lang: str = 'en'
    tone: str

class ExplainRequest(BaseModel):
    text: str
    translated_text: str
    source_lang: str
    target_lang: str

class GrammarRequest(BaseModel):
    text: str
    lang: Optional[str] = 'auto'

class AlternativeRequest(BaseModel):
    text: str
    source_lang: Optional[str] = 'auto'
    target_lang: str = 'en'

class SuggestRepliesRequest(BaseModel):
    text: str
    target_lang: Optional[str] = 'en'
    context: Optional[List[dict]] = None
    scenario: Optional[str] = 'general'

class PronounceScoreRequest(BaseModel):
    reference_text: str
    spoken_attempt: str
    target_lang: Optional[str] = 'en'

def smart_translate_core(
    text: str,
    source_lang: str = 'auto',
    target_lang: str = 'en',
    tone: str = 'default',
    scenario: str = 'general',
    conversation_context: Optional[List[dict]] = None
) -> dict:
    """Invokes Bhashora Intelligent Orchestrator."""
    return BhashoraOrchestrator.process_translation(
        text=text,
        source_lang=source_lang,
        target_lang=target_lang,
        tone=tone,
        scenario=scenario,
        conversation_context=conversation_context
    )

def apply_tone_style(text: str, target_lang: str, tone: str) -> str:
    t = text.strip()
    if not t:
        return t

    if target_lang == 'en':
        if tone == 'formal':
            if not t.endswith('.'): t += '.'
            return f"I would like to convey that {t.lower()}" if not t.startswith("I") else t
        elif tone == 'casual':
            t = t.replace("do not", "don't").replace("cannot", "can't").replace("will not", "won't")
            return f"Hey, {t.lower()}" if not t.startswith("Hey") else t
        elif tone == 'professional':
            return f"Please note: {t}"
        elif tone == 'friendly':
            return f"{t} 😊"
        elif tone == 'concise':
            words = t.split()
            return " ".join(words[:12]) if len(words) > 12 else t
    elif target_lang == 'te':
        if tone == 'formal':
            return f"దయచేసి గమనించండి: {t}"
        elif tone == 'friendly':
            return f"{t} అండి"
    elif target_lang == 'hi':
        if tone == 'formal':
            return f"कृपया ध्यान दें: {t}"
        elif tone == 'friendly':
            return f"{t} जी"
    return t

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {
        "status": "Bhashora AI Live Interpreter Backend is running!",
        "version": "3.2.0",
        "supported_languages": len(SUPPORTED_LANGUAGES)
    }

@app.get("/api/languages")
def get_languages():
    return SUPPORTED_LANGUAGES

@app.get("/api/user")
def get_user_profile():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, plan, avatar FROM users LIMIT 1")
    row = cur.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "name": row[1], "email": row[2], "plan": row[3], "avatar": row[4]}
    return {
        "id": "usr_1",
        "name": "Vaishnavi Anugu",
        "email": "vaishnavi@example.com",
        "plan": "Pro Member",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
    }

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    plan: Optional[str] = None
    avatar: Optional[str] = None

@app.post("/api/user")
def update_user_profile(req: UserUpdateRequest):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, plan, avatar FROM users LIMIT 1")
    row = cur.fetchone()
    if row:
        new_name = req.name or row[1]
        new_email = req.email or row[2]
        new_plan = req.plan or row[3]
        new_avatar = req.avatar or row[4]
        cur.execute("UPDATE users SET name = ?, email = ?, plan = ?, avatar = ? WHERE id = ?",
                    (new_name, new_email, new_plan, new_avatar, row[0]))
    else:
        new_name = req.name or "Vaishnavi Anugu"
        new_email = req.email or "vaishnavi@example.com"
        new_plan = req.plan or "Pro Member"
        new_avatar = req.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
        cur.execute("INSERT INTO users (id, name, email, plan, avatar) VALUES ('usr_1', ?, ?, ?, ?)",
                    (new_name, new_email, new_plan, new_avatar))
    conn.commit()
    conn.close()
    return {"status": "success", "user": {"name": new_name, "email": new_email, "plan": new_plan, "avatar": new_avatar}}

@app.post("/api/translate")
def translate_endpoint(req: TranslateRequest):
    result = smart_translate_core(
        text=req.text,
        source_lang=req.source_lang,
        target_lang=req.target_lang,
        tone=req.tone or 'default',
        scenario=req.scenario or 'general',
        conversation_context=req.conversation_context
    )
    result["timestamp"] = int(time.time() * 1000)

    # Automatically persist to SQLite database
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        item_id = f"item_{int(time.time() * 1000)}"
        time_str = time.strftime("%I:%M %p")
        cur.execute('''
            INSERT OR REPLACE INTO translations 
            (id, original_text, translated_text, source_lang, detected_lang, detected_code, target_lang, transliterated_script, latency_ms, time_str)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item_id,
            result["original_text"],
            result["translated_text"],
            req.source_lang,
            result["detected_lang"],
            result["detected_code"],
            result["target_lang"],
            result["transliterated_script"],
            result["latency_ms"],
            time_str
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB Save Error] {e}")

    return result

# --- DATABASE & HISTORY ENDPOINTS ---

@app.get("/api/history")
def get_history(limit: int = 50):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM translations ORDER BY created_at DESC LIMIT ?', (limit,))
    rows = cur.fetchall()
    history = []
    for r in rows:
        history.append({
            "id": r["id"],
            "original_text": r["original_text"],
            "translated_text": r["translated_text"],
            "source_lang": r["source_lang"],
            "detected_lang": r["detected_lang"],
            "detected_code": r["detected_code"],
            "target_lang": r["target_lang"],
            "transliterated_script": r["transliterated_script"],
            "favorite": bool(r["favorite"]),
            "latency_ms": r["latency_ms"],
            "time": r["time_str"] or "Recently"
        })
    conn.close()
    return history

@app.delete("/api/history/{item_id}")
def delete_history_item(item_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM translations WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": item_id}

@app.delete("/api/history")
def clear_all_history():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('DELETE FROM translations')
    conn.commit()
    conn.close()
    return {"status": "cleared"}

@app.post("/api/history/{item_id}/toggle-favorite")
def toggle_favorite(item_id: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT favorite FROM translations WHERE id = ?', (item_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Translation not found")
    new_fav = 0 if row["favorite"] else 1
    cur.execute('UPDATE translations SET favorite = ? WHERE id = ?', (new_fav, item_id))
    conn.commit()
    conn.close()
    return {"id": item_id, "favorite": bool(new_fav)}

# --- HIGH-FIDELITY LIVE VOICE TTS AUDIO STREAM ENDPOINT ---
@app.get("/api/tts")
def text_to_speech_audio(text: str, lang: str = "en"):
    """
    High-fidelity native voice TTS endpoint.
    Streams native audio for Telugu, Kannada, Hindi, Tamil, English, and all languages.
    Completely eliminates browser-dependent missing language packs and synthesis cancellation.
    """
    cleaned = text.strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    tl = (lang or 'en').lower().split('-')[0]
    if lang.lower() == 'zh-cn' or lang.lower() == 'zh':
        tl = 'zh-CN'
    
    # Strip wrapping quotes
    if (cleaned.startswith('"') and cleaned.endswith('"')) or (cleaned.startswith("'") and cleaned.endswith("'")):
        cleaned = cleaned[1:-1].strip()

    try:
        url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" + urllib.parse.quote(tl) + "&q=" + urllib.parse.quote(cleaned)
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            audio_bytes = resp.read()
            
        return Response(content=audio_bytes, media_type="audio/mpeg", headers={
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": "inline"
        })
    except Exception as e:
        print(f"[TTS Audio Error] {e}")
        raise HTTPException(status_code=500, detail=f"TTS generation error: {str(e)}")

@app.get("/api/analytics")
def get_analytics():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT COUNT(*), AVG(latency_ms) FROM translations')
    count, avg_lat = cur.fetchone()
    count = count or 0
    avg_lat = round(avg_lat or 30.0, 1)

    cur.execute('SELECT COUNT(*) FROM translations WHERE favorite = 1')
    fav_count = cur.fetchone()[0] or 0

    # Calculate words translated
    cur.execute('SELECT original_text FROM translations')
    rows = cur.fetchall()
    total_words = sum([len(r["original_text"].split()) for r in rows]) if rows else 0

    # Language breakdown
    cur.execute('''
        SELECT detected_lang, target_lang, COUNT(*) as cnt 
        FROM translations 
        GROUP BY detected_lang, target_lang 
        ORDER BY cnt DESC LIMIT 5
    ''')
    pairs = cur.fetchall()
    pair_stats = [{"pair": f"{p['detected_lang'] or 'Source'} ⇄ {SUPPORTED_LANGUAGES.get(p['target_lang'], p['target_lang'])}", "count": p["cnt"]} for p in pairs]

    conn.close()
    return {
        "total_translations": count,
        "total_words": total_words,
        "average_latency_ms": avg_lat,
        "favorites_count": fav_count,
        "language_pairs": pair_stats
    }

# --- AI ENDPOINTS ---

@app.post("/api/ai/tone")
def tone_conversion_endpoint(req: ToneRequest):
    base_res = smart_translate_core(req.text, req.source_lang, req.target_lang, tone='default')
    base_trans = base_res["translated_text"]

    tones = {
        "formal": apply_tone_style(base_trans, req.target_lang, "formal"),
        "casual": apply_tone_style(base_trans, req.target_lang, "casual"),
        "professional": apply_tone_style(base_trans, req.target_lang, "professional"),
        "friendly": apply_tone_style(base_trans, req.target_lang, "friendly"),
        "concise": apply_tone_style(base_trans, req.target_lang, "concise"),
    }
    return {
        "original_text": req.text,
        "base_translation": base_trans,
        "selected_tone": req.tone,
        "translated_text": tones.get(req.tone, base_trans),
        "all_tones": tones,
        "target_lang": req.target_lang
    }

@app.post("/api/ai/alternatives")
def alternatives_endpoint(req: AlternativeRequest):
    base = smart_translate_core(req.text, req.source_lang, req.target_lang, tone='default')
    trans = base["translated_text"]

    alt1 = apply_tone_style(trans, req.target_lang, "formal")
    alt2 = apply_tone_style(trans, req.target_lang, "casual")
    alt3 = apply_tone_style(trans, req.target_lang, "friendly")

    return {
        "original_text": req.text,
        "primary_translation": trans,
        "alternatives": [
            {"tone": "Formal / Polite", "text": alt1, "tag": "Recommended for business & elders"},
            {"tone": "Casual / Natural", "text": alt2, "tag": "Great for friends & everyday chat"},
            {"tone": "Warm / Expressive", "text": alt3, "tag": "Social & friendly context"}
        ]
    }

@app.post("/api/ai/grammar")
def grammar_endpoint(req: GrammarRequest):
    text = req.text.strip()
    if not text:
        return {"original": "", "corrected": "", "has_corrections": False, "explanation": "Empty text"}

    words = text.split()
    corrected_words = []
    corrections_made = []

    for w in words:
        clean_w = w.lower().strip(".,?!")
        if clean_w in POPULAR_ROMANIZED:
            native, _ = POPULAR_ROMANIZED[clean_w]
            corrections_made.append(f"Romanized '{w}' recognized as '{native}'")
            corrected_words.append(w)
        else:
            corrected_words.append(w)

    corrected_text = " ".join(corrected_words)
    if corrected_text and corrected_text[0].islower():
        corrected_text = corrected_text[0].upper() + corrected_text[1:]
        corrections_made.append("Capitalized opening sentence")
    if corrected_text and corrected_text[-1] not in ('.', '?', '!'):
        corrected_text += '.'
        corrections_made.append("Added proper ending punctuation")

    return {
        "original_text": text,
        "corrected_text": corrected_text,
        "has_corrections": len(corrections_made) > 0,
        "corrections": corrections_made,
        "explanation": "Punctuation and capitalization normalized for fluent translation." if corrections_made else "Text is grammatically clean."
    }

@app.post("/api/ai/explain")
def explain_endpoint(req: ExplainRequest):
    orig = req.text.strip()
    trans = req.translated_text.strip()

    # Try OpenAI if configured
    if openai_client:
        try:
            prompt = f"Explain the translation of '{orig}' into '{trans}' ({SUPPORTED_LANGUAGES.get(req.target_lang, req.target_lang)}). Provide a brief pronunciation guide, formality level, and 3 key vocabulary words. Return JSON with keys: pronunciation, formality, cultural_note, and breakdown (list of objects with word and meaning)."
            chat_res = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an expert linguist. Respond only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            parsed = json.loads(chat_res.choices[0].message.content)
            parsed["original"] = orig
            parsed["translated"] = trans
            return parsed
        except Exception as e:
            print(f"[OpenAI Explain Fallback] {e}")

    words = orig.split()
    breakdown = []
    for w in words[:6]:
        clean_w = w.lower().strip(".,!?")
        breakdown.append({
            "word": w,
            "meaning": f"Core term in {SUPPORTED_LANGUAGES.get(req.source_lang, 'Source')}",
            "role": "Content word"
        })

    return {
        "original": orig,
        "translated": trans,
        "pronunciation": f"[{orig.lower()}]",
        "formality": "Neutral / Standard",
        "breakdown": breakdown,
        "cultural_note": f"Translated into {SUPPORTED_LANGUAGES.get(req.target_lang, req.target_lang)} with natural phrasing."
    }

@app.post("/api/ai/suggest-replies")
def suggest_replies_endpoint(req: SuggestRepliesRequest):
    """Headline Feature: Suggests 3 suitable context-aware replies for confident communication."""
    ctx_summary = None
    if req.context:
        ctx_summary = "\n".join([f"{c.get('speaker', 'User')}: {c.get('text', '')}" for c in req.context[-3:]])
    replies = generate_smart_replies(
        text=req.text,
        target_lang=req.target_lang or 'en',
        context_summary=ctx_summary,
        scenario=req.scenario or 'general'
    )
    return {
        "original_text": req.text,
        "target_lang": req.target_lang,
        "scenario": req.scenario or 'general',
        "replies": replies
    }

@app.post("/api/pronunciation/score")
def score_pronunciation_endpoint(req: PronounceScoreRequest):
    """Pronunciation Practice Coach: Analyzes spoken attempt vs target sentence."""
    import string
    ref = req.reference_text.strip().lower()
    attempt = req.spoken_attempt.strip().lower()

    clean_ref = "".join([c for c in ref if c not in string.punctuation])
    clean_attempt = "".join([c for c in attempt if c not in string.punctuation])

    ref_words = clean_ref.split()
    attempt_words = set(clean_attempt.split())

    if not ref_words:
        return {
            "score": 0,
            "grade": "Keep Practicing 🔄",
            "feedback": "Please speak the phrase clearly into the microphone.",
            "matched_words": []
        }

    matched_words = []
    matches = 0
    for w in ref_words:
        if w in attempt_words:
            matched_words.append({"word": w, "status": "correct"})
            matches += 1
        else:
            matched_words.append({"word": w, "status": "needs_practice"})

    accuracy = round((matches / max(len(ref_words), 1)) * 100)
    len_diff = abs(len(clean_ref) - len(clean_attempt))
    if len_diff > 12 and accuracy > 20:
        accuracy = max(10, accuracy - 15)

    if accuracy >= 85:
        grade = "Excellent ⭐⭐⭐"
        feedback = "Terrific pronunciation! Your speech matches native cadence."
    elif accuracy >= 60:
        grade = "Good ⭐⭐"
        feedback = "Clear and understandable. Practice the highlighted words to sound native."
    else:
        grade = "Keep Practicing 🔄"
        feedback = "Listen to the speaker audio again and repeat at a slightly slower pace."

    return {
        "score": accuracy,
        "grade": grade,
        "feedback": feedback,
        "reference": req.reference_text,
        "attempt": req.spoken_attempt,
        "matched_words": matched_words
    }

def score_stt_language_candidate(lang_code: str, text: str) -> float:
    if not text or not text.strip():
        return 0.0
    clean = text.strip().lower()
    words = clean.split()
    
    # 1. English evaluation
    if lang_code == 'en':
        eng_common = {
            'my', 'name', 'is', 'i', 'live', 'in', 'hello', 'hi', 'how', 'are', 'you',
            'want', 'to', 'go', 'home', 'the', 'a', 'an', 'this', 'that', 'we', 'they',
            'please', 'thank', 'thanks', 'good', 'morning', 'night', 'tired', 'because',
            'operate', 'on', 'numerical', 'data', 'not', 'raw', 'text', 'am', 'was', 'do',
            'can', 'help', 'need', 'me', 'what', 'where', 'when', 'why', 'fine', 'yes', 'no'
        }
        match_count = sum(1 for w in words if w.strip(".,?!") in eng_common)
        has_non_latin = any(ord(c) > 127 for c in clean)
        if has_non_latin:
            return 1.0
        return 15.0 + (match_count * 6.0)

    # 2. Telugu evaluation
    elif lang_code == 'te':
        has_telugu = any('\u0C00' <= c <= '\u0C7F' for c in text)
        if not has_telugu:
            return 0.0
        te_phonetic_english = {
            'మై', 'నేమ్', 'ఈజ్', 'ఇస్', 'ఐ', 'వాంట్', 'టు', 'గో', 'హోమ్',
            'ఆపరేట్', 'ఆన్', 'న్యూమరికల్', 'డాటా', 'డేటా', 'నాట్', 'రా', 'టెక్స్ట్',
            'బికాజ్', 'టైర్డ్', 'ప్లీజ్', 'థాంక్స్', 'థాంక్యూ', 'ఎస్', 'నో', 'గుడ్',
            'మార్నింగ్', 'నైట్', 'హాయ్', 'హలో'
        }
        phonetic_matches = sum(1 for w in words if any(p in w for p in te_phonetic_english))
        if phonetic_matches >= 2 or (len(words) <= 3 and phonetic_matches >= 1):
            return 1.0  # Heavy penalty: spoken English transcribed into Telugu characters
        
        te_genuine = {
            'పేరు', 'నేను', 'ఎలా', 'ఉన్నారు', 'ఉన్నాను', 'బాగున్నారా', 'చాలా',
            'ఇంటికి', 'వెళ్ళాలి', 'అండి', 'ధన్యవాదాలు', 'సహాయం', 'కావాలి', 'లేదు',
            'మీరు', 'ఏంటి', 'ఎక్కడ', 'ఎప్పుడు', 'బాగుంది'
        }
        genuine_matches = sum(1 for w in words if any(g in w for g in te_genuine))
        return 12.0 + (genuine_matches * 6.0)

    # 3. Hindi evaluation
    elif lang_code == 'hi':
        has_devanagari = any('\u0900' <= c <= '\u097F' for c in text)
        if not has_devanagari:
            return 0.0
        hi_phonetic = {'माय', 'नेम', 'इस', 'आई', 'लिव', 'इन', 'वांट', 'गो', 'होम'}
        if sum(1 for w in words if any(p in w for p in hi_phonetic)) >= 2:
            return 1.0
        hi_genuine = {
            'नाम', 'मेरा', 'मेरी', 'मेरे', 'है', 'हैं', 'हूँ', 'कैसे', 'कैसी',
            'घर', 'जाना', 'चाहिए', 'नमस्ते', 'धन्यवाद', 'मदद', 'आप', 'क्या', 'कहाँ'
        }
        genuine_matches = sum(1 for w in words if any(g in w for g in hi_genuine))
        return 12.0 + (genuine_matches * 6.0)

    # 4. Marathi evaluation
    elif lang_code == 'mr':
        has_devanagari = any('\u0900' <= c <= '\u097F' for c in text)
        if not has_devanagari:
            return 0.0
        mr_genuine = {
            'नाव', 'माझं', 'माझे', 'आहे', 'आहोत', 'कसा', 'कशी', 'घरी', 'नमस्कार',
            'धन्यवाद', 'राहते', 'राहतो', 'तुम्ही', 'काय', 'कुठे', 'नाही'
        }
        genuine_matches = sum(1 for w in words if any(g in w for g in mr_genuine))
        return 12.0 + (genuine_matches * 6.0)

    # 5. Tamil evaluation
    elif lang_code == 'ta':
        has_tamil = any('\u0B80' <= c <= '\u0BFF' for c in text)
        if not has_tamil:
            return 0.0
        ta_genuine = {'பெயர்', 'வணக்கம்', 'எப்படி', 'இருக்கிறீர்கள்', 'நன்றி', 'என்', 'நீங்கள்', 'வீட்டிற்கு'}
        matches = sum(1 for w in words if any(g in w for g in ta_genuine))
        return 12.0 + (matches * 6.0)

    # 6. Kannada evaluation
    elif lang_code == 'kn':
        has_kannada = any('\u0C80' <= c <= '\u0CFF' for c in text)
        if not has_kannada:
            return 0.0
        kn_genuine = {'ಹೆಸರು', 'ನನ್ನ', 'ಹೇಗಿದ್ದೀರಿ', 'ಮನೆಗೆ', 'ಹೋಗಬೇಕು', 'ಧನ್ಯವಾದಗಳು', 'ನೀವು', 'ಏನು'}
        matches = sum(1 for w in words if any(g in w for g in kn_genuine))
        return 12.0 + (matches * 6.0)

    return 5.0

def convert_to_wav_16k(audio_bytes: bytes) -> bytes:
    """Converts any browser audio (WebM, OGG, WAV, etc.) to 16kHz mono 16-bit WAV."""
    if not audio_bytes:
        return audio_bytes
    # If already a valid 16kHz mono WAV, return directly
    if audio_bytes.startswith(b"RIFF") and len(audio_bytes) > 44:
        try:
            with wave.open(io.BytesIO(audio_bytes), 'rb') as wf:
                if wf.getframerate() == 16000 and wf.getnchannels() == 1:
                    return audio_bytes
        except Exception:
            pass

    try:
        import imageio_ffmpeg, subprocess
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        proc = subprocess.Popen(
            [exe, "-y", "-i", "pipe:0", "-ar", "16000", "-ac", "1", "-f", "wav", "pipe:1"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        out, err = proc.communicate(input=audio_bytes)
        if proc.returncode == 0 and out and len(out) > 44:
            return out
    except Exception as e:
        print("convert_to_wav_16k notice:", e)

    return audio_bytes

@app.post("/api/stt")
async def speech_to_text_endpoint(
    audio: UploadFile = File(...),
    source_lang: Optional[str] = Form('auto')
):
    """
    Multilingual Speech-to-Text with True Automatic Language Identification.
    Identifies English, Telugu, Hindi, Marathi, Tamil, Kannada, and other languages.
    Never forces source text into Telugu!
    """
    audio_bytes = await audio.read()
    if not audio_bytes or len(audio_bytes) < 100:
        raise HTTPException(status_code=400, detail="Empty or truncated audio recording")

    wav_bytes = convert_to_wav_16k(audio_bytes)
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(io.BytesIO(wav_bytes)) as source:
            audio_data = recognizer.record(source)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Audio format error: {str(e)}")

    loc_map = {
        'en': 'en-US',
        'te': 'te-IN',
        'hi': 'hi-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'bn': 'bn-IN',
        'gu': 'gu-IN',
        'es': 'es-ES',
        'fr': 'fr-FR'
    }

    # 1. Explicit source language provided (not 'auto')
    if source_lang and source_lang != 'auto':
        target_loc = loc_map.get(source_lang, 'en-US')
        try:
            transcript = recognizer.recognize_google(audio_data, language=target_loc)
            return {
                "transcript": transcript.strip(),
                "detected_code": source_lang,
                "detected_lang": SUPPORTED_LANGUAGES.get(source_lang, source_lang),
                "confidence": 0.95
            }
        except Exception as e:
            return {
                "transcript": "",
                "detected_code": source_lang,
                "detected_lang": SUPPORTED_LANGUAGES.get(source_lang, source_lang),
                "error": str(e)
            }

    # 2. AUTO DETECT MODE: Probe supported candidate languages in parallel
    candidates = [
        ('en', 'en-US'),
        ('te', 'te-IN'),
        ('hi', 'hi-IN'),
        ('mr', 'mr-IN'),
        ('ta', 'ta-IN'),
        ('kn', 'kn-IN')
    ]

    candidate_results = {}
    def run_rec(c_code, c_loc):
        try:
            res = recognizer.recognize_google(audio_data, language=c_loc, show_all=True)
            if res and isinstance(res, dict) and 'alternative' in res and res['alternative']:
                top_text = res['alternative'][0].get('transcript', '')
                if top_text and top_text.strip():
                    return c_code, top_text.strip()
        except Exception:
            pass
        return c_code, None

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(run_rec, code, loc) for code, loc in candidates]
        for f in concurrent.futures.as_completed(futures):
            c_code, t_text = f.result()
            if t_text:
                candidate_results[c_code] = t_text

    if not candidate_results:
        # Fallback single English probe
        try:
            fallback_text = recognizer.recognize_google(audio_data, language='en-US')
            return {
                "transcript": fallback_text.strip(),
                "detected_code": "en",
                "detected_lang": "English",
                "confidence": 0.7
            }
        except Exception:
            return {
                "transcript": "",
                "detected_code": "en",
                "detected_lang": "English",
                "confidence": 0.0
            }

    # Score all candidate results
    best_code = 'en'
    best_score = -1.0
    best_transcript = ''

    for c_code, t_text in candidate_results.items():
        score = score_stt_language_candidate(c_code, t_text)
        if score > best_score:
            best_score = score
            best_code = c_code
            best_transcript = t_text

    return {
        "transcript": best_transcript,
        "detected_code": best_code,
        "detected_lang": SUPPORTED_LANGUAGES.get(best_code, best_code.upper()),
        "confidence": round(min(1.0, best_score / 30.0), 2),
        "candidates_evaluated": list(candidate_results.keys())
    }

@app.post("/api/document/translate")
async def document_translate_endpoint(
    file: UploadFile = File(...),
    source_lang: str = Form('auto'),
    target_lang: str = Form('en')
):
    contents = await file.read()
    filename = file.filename.lower()
    extracted_text = ""

    try:
        if filename.endswith(".txt") or filename.endswith(".md"):
            extracted_text = contents.decode("utf-8", errors="ignore")
        elif filename.endswith(".pdf"):
            pdf_reader = pypdf.PdfReader(io.BytesIO(contents))
            pages_text = []
            for p in pdf_reader.pages:
                pages_text.append(p.extract_text() or "")
            extracted_text = "\n\n".join(pages_text)
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(contents))
            extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text])
        else:
            extracted_text = contents.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read document: {str(e)}")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Document contains no readable text")

    paragraphs = [p.strip() for p in extracted_text.split("\n") if p.strip()]
    translated_paragraphs = []

    for para in paragraphs[:30]:
        if len(para) > 1000:
            para = para[:1000]
        res = smart_translate_core(para, source_lang=source_lang, target_lang=target_lang)
        translated_paragraphs.append({
            "original": para,
            "translated": res["translated_text"]
        })

    full_translated_text = "\n\n".join([p["translated"] for p in translated_paragraphs])

    return {
        "filename": file.filename,
        "total_paragraphs": len(translated_paragraphs),
        "source_lang": source_lang,
        "target_lang": target_lang,
        "paragraphs": translated_paragraphs,
        "full_translated_text": full_translated_text
    }

# --- WEBSOCKET FOR LIVE REAL-TIME TRANSLATION ---

@app.websocket("/ws/translate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            text_to_translate = data.get("text", "").strip()
            lang1 = data.get("lang1", "te")
            lang2 = data.get("lang2", "en")
            explicit_target = data.get("target_lang")
            explicit_source = data.get("source_lang", "auto")

            if not text_to_translate:
                continue

            if explicit_target:
                target_lang = explicit_target
                source_lang = explicit_source
            else:
                probe = smart_translate_core(text_to_translate, 'auto', lang1)
                detected = probe["detected_code"]
                if detected == lang2:
                    target_lang = lang1
                    source_lang = lang2
                elif detected == lang1:
                    target_lang = lang2
                    source_lang = lang1
                else:
                    target_lang = lang1 if detected != lang1 else lang2
                    source_lang = detected

            detected_name = SUPPORTED_LANGUAGES.get(source_lang, source_lang.upper())
            await websocket.send_json({
                "type": "status",
                "step": "language_detected",
                "lang": detected_name,
                "detected_code": source_lang
            })

            await websocket.send_json({
                "type": "status",
                "step": "translating",
                "source_lang": source_lang,
                "target_lang": target_lang
            })

            loop = asyncio.get_event_loop()
            res = await loop.run_in_executor(None, smart_translate_core, text_to_translate, source_lang, target_lang)

            await websocket.send_json({
                "type": "result",
                "original_text": text_to_translate,
                "translated_text": res["translated_text"],
                "detected_lang": res["detected_lang"],
                "detected_code": res["detected_code"],
                "target_lang": target_lang,
                "transliterated_script": res.get("transliterated_script"),
                "timestamp": int(time.time() * 1000)
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WebSocket Error] {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
