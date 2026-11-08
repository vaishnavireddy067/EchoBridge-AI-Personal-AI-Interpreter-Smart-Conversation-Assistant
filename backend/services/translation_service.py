import urllib.request
import urllib.parse
import json
import re
from typing import Optional, Tuple

# Popular Romanized phrases for sub-10ms lookup
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
    'ela unnav': ('ఎలా ఉన్నావు?', 'te'),
    'ela unnav?': ('ఎలా ఉన్నావు?', 'te'),
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
    'nee peru emiti': ('నీ పేరు ఏమిటి?', 'te'),
    'nee peru emiti?': ('నీ పేరు ఏమిటి?', 'te'),
    'meeru ekkada untaru': ('మీరు ఎక్కడ ఉంటారు?', 'te'),
    'tvaraga randi': ('త్వరగా రండి', 'te'),
    'subhodayam': ('శుభోదయం', 'te'),
    'shubhodayam': ('శుభోదయం', 'te'),
    'subharatri': ('శుభరాత్రి', 'te'),
    'shubharatri': ('శుభరాత్రి', 'te'),
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
            'ta': 'வணக்கம்',
            'kn': 'ನಮಸ್ಕಾರ'
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
            'ta': 'சாப்பிட்டீர்களா?',
            'kn': 'ಊಟ ಆಯ್ತಾ?'
        },
        'detected_code': 'te'
    },
    'how_are_you': {
        'sources': ['ఎలా ఉన్నారు', 'ఎలా ఉన్నారు?', 'ఎలా ఉన్నావు', 'ఎలా ఉన్నావు?', 'బాగున్నారా', 'బాగున్నారా?', 'ela unnaru', 'ela unnaru?', 'elavunnaru', 'elavunnaru?', 'ela unnav', 'ela unnav?', 'bagunnara', 'bagunnara?', 'bagunara', 'kaise ho', 'kaise ho?', 'aap kaise ho', 'aap kaise ho?', 'kya haal hai', 'kya haal hai?'],
        'translations': {
            'en': 'How are you?',
            'hi': 'आप कैसे हैं?',
            'es': '¿Cómo estás?',
            'fr': 'Comment allez-vous ?',
            'de': 'Wie geht es Ihnen?',
            'te': 'ఎలా ఉన్నారు?',
            'ta': 'எப்படி இருக்கிறீர்கள்?',
            'kn': 'ಹೇಗಿದ್ದೀರಾ?'
        },
        'detected_code': 'te'
    },
    'thank_you': {
        'sources': ['ధన్యవాదాలు', 'ధన్యవాదాలు?', 'చాలా ధన్యవాదాలు', 'ధన్యవాదములు', 'danyavadalu', 'dhanyavadalu', 'chala danyavadalu', 'chala dhanyavadalu', 'chala thanks', 'shukriya', 'dhanyawad', 'dhanyavadaalu', 'ಧನ್ಯವಾದಗಳು', 'நன்றி'],
        'translations': {
            'en': 'Thank you',
            'hi': 'धन्यवाद',
            'es': 'Gracias',
            'fr': 'Merci',
            'de': 'Danke',
            'te': 'ధన్యవాదాలు',
            'ta': 'நன்றி',
            'kn': 'ಧನ್ಯವಾದಗಳು'
        },
        'detected_code': 'te'
    },
    'what_is_your_name': {
        'sources': ['నీ పేరు ఏమిటి', 'నీ పేరు ఏమిటి?', 'మీ పేరు ఏమిటి', 'మీ పేరు ఏమిటి?', 'nee peru emiti', 'nee peru emiti?', 'aapka naam kya hai', 'aapka naam kya hai?'],
        'translations': {
            'en': 'What is your name?',
            'hi': 'आपका नाम क्या है?',
            'es': '¿Cómo te llamas?',
            'fr': 'Comment vous appelez-vous ?',
            'de': 'Wie heißen Sie?',
            'te': 'మీ పేరు ఏమిటి?',
            'ta': 'உங்கள் பெயர் என்ன?'
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

def query_gtx(text: str, sl: str = 'auto', tl: str = 'en') -> Tuple[str, str]:
    """Execute direct low-latency neural translation query."""
    encoded_text = urllib.parse.quote(text.strip())
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={encoded_text}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        payload = json.loads(response.read().decode("utf-8"))
        translated_segments = []
        if payload and len(payload) > 0 and payload[0]:
            for item in payload[0]:
                if item and item[0]:
                    translated_segments.append(item[0])
        translated_text = "".join(translated_segments)
        detected_code = payload[2] if len(payload) > 2 and payload[2] else sl
        return translated_text, detected_code

def transliterate_romanized(text: str, target_lang: str = 'te') -> Optional[str]:
    """Transliterate Romanized letters to native Indic script using Google Input Tools."""
    url = f"https://inputtools.google.com/request?text={urllib.parse.quote(text)}&itc={target_lang}-t-i0-und&num=2"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            if data[0] == "SUCCESS" and len(data[1]) > 0 and len(data[1][0][1]) > 0:
                return data[1][0][1][0]
    except Exception as e:
        print(f"[Transliterate Error] {e}")
    return None

def resolve_semantic_meaning(text: str, target_lang: str) -> Optional[Tuple[str, str, Optional[str]]]:
    """Match input against curated intent dictionary for zero-shot sub-1ms meaning translation."""
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

                # Determine native script
                script = None
                if any('\u0c00' <= char <= '\u0c7f' for char in text):
                    script = text.strip()
                elif clean_no_punct in POPULAR_ROMANIZED:
                    script = POPULAR_ROMANIZED[clean_no_punct][0]
                elif data.get('translations', {}).get('te'):
                    script = data['translations']['te']

                return trans, data.get('detected_code', 'te'), script
    return None

def normalize_meaning_loanwords(trans_res: str, target_lang: str) -> str:
    """Ensure meaning translation instead of loanword echoing."""
    if target_lang != 'en':
        return trans_res

    clean = trans_res.strip().lower().rstrip(".,?!")
    if clean in ('namaste', 'namaskaram', 'namaskar', 'pranam'):
        return 'Hello'
    if clean in ('dhanyavadalu', 'danyavadalu', 'dhanyawad', 'shukriya', 'dhanyavadagalu'):
        return 'Thank you'
    if clean in ('tinnara', 'tinara', 'khana khaya', 'tinnava'):
        return 'Did you eat?'
    if clean in ('bagunnara', 'ela unnaru', 'kaise ho', 'ela unnav'):
        return 'How are you?'
    if clean in ('nee peru emiti', 'aapka naam kya hai'):
        return 'What is your name?'
    return trans_res
