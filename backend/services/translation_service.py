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
        'sources': [
            'hello', 'hello?', 'hello!', 'hi', 'hi!', 'hey', 'hey!', 
            'namaste', 'namaste!', 'namaskaram', 'namaskaramu', 'namaskar', 'pranam', 'pranamaalu', 'namasthe',
            'నమస్తే', 'నమస్తే!', 'నమస్కారం', 'నమస్కారము', 'హలో', 'హాయ్',
            'नमस्ते', 'नमस्ते!', 'प्रणाम', 'नमस्कार',
            'வணக்கம்', 'நமஸ்காரம்', 'ನಮಸ್ಕಾರ'
        ],
        'translations': {
            'en': 'Hello',
            'te': 'నమస్తే',
            'hi': 'नमस्ते',
            'ta': 'வணக்கம்',
            'kn': 'ನಮಸ್ಕಾರ',
            'es': 'Hola',
            'fr': 'Bonjour',
            'de': 'Hallo',
            'it': 'Ciao',
            'pt': 'Olá',
            'ru': 'Здравствуйте',
            'ja': 'こんにちは',
            'ar': 'مرحبا',
            'zh-CN': '你好'
        },
        'detected_code': 'te'
    },
    'did_you_eat': {
        'sources': [
            'did you eat', 'did you eat?', 'did you eat food', 'did you eat food?', 'did u eat', 'did u eat?', 'did uh ate', 'did uh eat',
            'have you eaten', 'have you eaten?', 'have you had food', 'have you had food?',
            'మీరు తిన్నారా', 'మీరు తిన్నారా?', 'తిన్నారా', 'తిన్నారా?', 'తిన్నావా', 'తిన్నావా?', 
            'tinnara', 'tinnara?', 'tinara', 'tinara?', 'tinnava', 'tinnava?', 'meeru tinnara', 'meeru tinnara?', 
            'nuvvu tinnava', 'nuvvu tinnava?', 'bhojanam chesara', 'bhojanam chesara?', 
            'khana khaya', 'khana khaya?', 'aapne khana khaya', 'aapne khana khaya?',
            'क्या आपने खाना खाया?', 'क्या आपने खाना खाया', 'खाना खाया?', 'खाना खाया', 'तुमने खाना खाया?',
            'சாப்பிட்டீர்களா?', 'சாப்பிட்டாயா?', 'ಊಟ ಆಯ್ತಾ?'
        ],
        'translations': {
            'en': 'Did you eat?',
            'te': 'తిన్నారా?',
            'hi': 'क्या आपने खाना खाया?',
            'ta': 'சாப்பிட்டீர்களா?',
            'kn': 'ಊಟ ಆಯ್ತಾ?',
            'es': '¿Comiste?',
            'fr': 'As-tu mangé ?',
            'de': 'Hast du gegessen?'
        },
        'detected_code': 'te'
    },
    'how_are_you': {
        'sources': [
            'how are you', 'how are you?', 'how r u', 'how r u?', 'how are you doing', 'how are you doing?', 'how do you do',
            'మీరు ఎలా ఉన్నారు', 'మీరు ఎలా ఉన్నారు?', 'నువ్వు ఎలా ఉన్నావు', 'నువ్వు ఎలా ఉన్నావు?', 'ఎలా ఉన్నారు', 'ఎలా ఉన్నారు?', 'ఎలా ఉన్నావు', 'ఎలా ఉన్నావు?', 'బాగున్నారా', 'బాగున్నారా?', 
            'meeru ela unnaru', 'meeru ela unnaru?', 'ela unnaru', 'ela unnaru?', 'elavunnaru', 'elavunnaru?', 'ela unnav', 'ela unnav?', 'bagunnara', 'bagunnara?', 'bagunara', 
            'kaise ho', 'kaise ho?', 'aap kaise ho', 'aap kaise ho?', 'aap kaise hain', 'aap kaise hain?', 'kya haal hai', 'kya haal hai?',
            'आप कैसे हैं?', 'आप कैसे हैं', 'आप कैसे हो?', 'आप कैसे हो', 'कैसे हो?', 'कैसे हो',
            'எப்படி இருக்கிறீர்கள்?', 'எப்படி இருக்கீங்க?', 'ಹೇಗಿದ್ದೀರಾ?', 'ನೀವು ಹೇಗಿದ್ದೀರಿ?', 'ನೀವು ಹೇಗಿದ್ದೀರಿ'
        ],
        'translations': {
            'en': 'How are you?',
            'te': 'మీరు ఎలా ఉన్నారు?',
            'hi': 'आप कैसे हैं?',
            'ta': 'எப்படி இருக்கிறீர்கள்?',
            'kn': 'ನೀವು ಹೇಗಿದ್ದೀರಿ?',
            'es': '¿Cómo estás?',
            'fr': 'Comment allez-vous ?',
            'de': 'Wie geht es Ihnen?'
        },
        'detected_code': 'te'
    },
    'thank_you': {
        'sources': [
            'thank you', 'thank you!', 'thank you.', 'thanks', 'thanks!', 'thank you so much', 'thanks a lot',
            'ధన్యవాదాలు', 'ధన్యవాదాలు?', 'ధన్యవాదాలు!', 'చాలా ధన్యవాదాలు', 'ధన్యవాదములు', 
            'danyavadalu', 'dhanyavadalu', 'chala danyavadalu', 'chala dhanyavadalu', 'chala thanks', 
            'shukriya', 'dhanyawad', 'dhanyavadaalu', 'धन्यवाद', 'शुक्रिया', 'बहुत धन्यवाद',
            'நன்றி', 'மிக்க நன்றி', 'ಧನ್ಯವಾದಗಳು'
        ],
        'translations': {
            'en': 'Thank you',
            'te': 'ధన్యవాదాలు',
            'hi': 'धन्यवाद',
            'ta': 'நன்றி',
            'kn': 'ಧನ್ಯವಾದಗಳು',
            'es': 'Gracias',
            'fr': 'Merci',
            'de': 'Danke'
        },
        'detected_code': 'te'
    },
    'what_is_your_name': {
        'sources': [
            'what is your name', 'what is your name?', "what's your name", "what's your name?",
            'నీ పేరు ఏమిటి', 'నీ పేరు ఏమిటి?', 'మీ పేరు ఏమిటి', 'మీ పేరు ఏమిటి?', 
            'nee peru emiti', 'nee peru emiti?', 'meeru evaru', 'meeru evaru?',
            'aapka naam kya hai', 'aapka naam kya hai?', 'tumhara naam kya hai', 'tumhara naam kya hai?',
            'आपका नाम क्या है?', 'आपका नाम क्या है', 'तुम्हारा नाम क्या है?'
        ],
        'translations': {
            'en': 'What is your name?',
            'te': 'మీ పేరు ఏమిటి?',
            'hi': 'आपका नाम क्या है?',
            'ta': 'உங்கள் பெயர் என்ன?',
            'kn': 'ನಿಮ್ಮ ಹೆಸರೇನು?',
            'es': '¿Cómo te llamas?',
            'fr': 'Comment vous appelez-vous ?',
            'de': 'Wie heißen Sie?'
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
        'sources': ['మీరు ఎక్కడికి వెళ్తున్నారు', 'మీరు ఎక్కడికి వెళ్తున్నారు?', 'ఎక్కడికి వెళ్తున్నావ్', 'ఎక్కడికి వెళ్తున్నావ్?', 'ఎక్కడికి వెళ్తున్నారు', 'ఎక్కడికి వెళ్తున్నారు?', 'ekkadiki velthunnav', 'ekkadiki velthunnaru', 'ekkadiki veltunnaru', 'meeru ekkadiki veltunnaru', 'meeru ekkadiki velthunnaru', 'kahan ja rahe ho', 'kahan ja rahe ho?', 'aap kahan ja rahe hain', 'aap kahan ja rahe hain?'],
        'translations': {
            'en': 'Where are you going?',
            'hi': 'आप कहाँ जा रहे हैं?',
            'es': '¿A dónde vas?',
            'fr': 'Où vas-tu ?',
            'te': 'ఎక్కడికి వెళ్తున్నారు?',
            'ta': 'எங்கே போகிறீர்கள்?',
            'kn': 'ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?'
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

    ENGLISH_PHRASES = {
        'hello', 'hi', 'hey', 'did you eat', 'did you eat food', 'have you eaten', 
        'have you had food', 'did u eat', 'did uh ate', 'did uh eat', 'how are you', 
        'how r u', 'how are you doing', 'how do you do', 'thank you', 'thanks', 
        'thank you so much', 'thanks a lot', 'what is your name', "what's your name",
        'what are you doing', 'where are you going', 'good morning', 'good night'
    }

    for intent, data in SEMANTIC_MEANINGS.items():
        for s in data['sources']:
            s_clean = s.lower().strip()
            s_no_punct = s_clean.strip(".,?!")
            if clean == s_clean or clean_no_punct == s_no_punct:
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
                elif s_no_punct in ENGLISH_PHRASES:
                    detected_code = 'en'
                    script = None
                elif clean_no_punct in POPULAR_ROMANIZED:
                    script, detected_code = POPULAR_ROMANIZED[clean_no_punct]
                else:
                    detected_code = data.get('detected_code', 'te')
                    script = data.get('translations', {}).get(detected_code)

                return trans, detected_code, script
    return None

def normalize_meaning_loanwords(trans_res: str, target_lang: str) -> str:
    """Ensure natural cultural meaning translation instead of loanword echoing."""
    if not trans_res:
        return trans_res
    clean = trans_res.strip().rstrip(".,?!")
    clean_lower = clean.lower()

    if target_lang == 'en':
        if clean_lower in ('namaste', 'namaskaram', 'namaskar', 'pranam', 'నమస్తే', 'నమస్కారం'):
            return 'Hello'
        if clean_lower in ('dhanyavadalu', 'danyavadalu', 'dhanyawad', 'shukriya', 'dhanyavadagalu', 'ధన్యవాదాలు'):
            return 'Thank you'
        if clean_lower in ('tinnara', 'tinara', 'khana khaya', 'tinnava', 'nuvvu tinnava', 'తిన్నారా?', 'తిన్నారా'):
            return 'Did you eat?'
        if clean_lower in ('bagunnara', 'ela unnaru', 'kaise ho', 'ela unnav', 'meeru ela unnaru', 'మీరు ఎలా ఉన్నారు?'):
            return 'How are you?'
        if clean_lower in ('nee peru emiti', 'aapka naam kya hai', 'మీ పేరు ఏమిటి?'):
            return 'What is your name?'

    elif target_lang == 'te':
        # Prevent English loanwords from showing in Telugu
        if clean_lower in ('hello', 'hi', 'hey', 'హలో', 'హలో.', 'హాయ్', 'హే'):
            return 'నమస్తే'
        if clean_lower in ('nuvvu tinnava?', 'nuvvu tinnava', 'నువ్వు తిన్నావా?', 'నువ్వు తిన్నావా', 'తిన్నావా?', 'తిన్నావా'):
            return 'తిన్నారా?'
        if clean_lower in ('thank you', 'thanks', 'థాంక్స్', 'థాంక్యూ'):
            return 'ధన్యవాదాలు'
        if clean_lower in ('how are you', 'how are you?', 'how do you do', 'ఎలా ఉన్నారు?'):
            return 'మీరు ఎలా ఉన్నారు?'

    elif target_lang == 'hi':
        if clean_lower in ('hello', 'hi', 'hey', 'हैलो', 'हेलो'):
            return 'नमस्ते'
        if clean_lower in ('thank you', 'thanks', 'थैंक्स', 'थैंक यू'):
            return 'धन्यवाद'
        if clean_lower in ('tumne khana khaya?', 'tumne khaya?', 'खाना खाया?'):
            return 'क्या आपने खाना खाया?'
        if clean_lower in ('kaise ho?', 'कैसे हो?'):
            return 'आप कैसे हैं?'

    return trans_res

