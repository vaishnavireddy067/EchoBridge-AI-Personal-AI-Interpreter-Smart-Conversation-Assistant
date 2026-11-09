import re
from typing import Optional, Tuple
from langdetect import detect

SUPPORTED_LANGUAGES = {
    'auto': 'Auto Detect',
    'en': 'English',
    'te': 'Telugu (తెలుగు)',
    'hi': 'Hindi (हिन्दी)',
    'ta': 'Tamil (தமிழ்)',
    'kn': 'Kannada (ಕನ್ನಡ)',
    'ml': 'Malayalam (മലയാളം)',
    'mr': 'Marathi (मराठी)',
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

# Common Telugu Romanized keywords and grammatical suffixes
TELUGU_ROMANIZED_KEYWORDS = {
    'danyavadalu', 'dhanyavadalu', 'namaste', 'namaskaram', 'namaskaramu',
    'bagunnara', 'bagunara', 'ela', 'unnaru', 'unnav', 'unnam',
    'tinnara', 'tinara', 'tinnava', 'bhojanam', 'chesara', 'chesava',
    'chestunnav', 'chestunnaru', 'velthunnav', 'velthunnaru', 'vastadu',
    'vastundi', 'repu', 'ivvala', 'ninna', 'eppudu', 'ekkadiki',
    'atanu', 'aame', 'vaaru', 'manamu', 'meeru', 'subhodayam', 'subharatri',
    'shubhadinam', 'tvaraga', 'randi', 'chala', 'thanks', 'ra', 'andi', 'kuda',
    'kadha', 'le', 'mari', 'avunu', 'kadu', 'ledu', 'chustunna', 'chesanu',
    'ki', 'lo', 'unnanu', 'unna', 'avutunna', 'cheyyi', 'chesta', 'kavali',
    'nuvvu', 'chey'
}

# Common Hindi Romanized keywords
HINDI_ROMANIZED_KEYWORDS = {
    'namaste', 'namaskar', 'pranam', 'shukriya', 'dhanyawad', 'kaise', 'ho',
    'kya', 'haal', 'hai', 'aap', 'tum', 'kar', 'rahe', 'kahan', 'ja',
    'khana', 'khaya', 'theek', 'haan', 'nahi', 'bhai', 'yaar', 'bolo',
    'sunoji', 'kal', 'aayega', 'shubh', 'prabhat', 'ratri', 'mein', 'karo'
}

# English words commonly code-mixed in Tanglish, Hinglish, Tenglish
COMMON_ENGLISH_WORDS = {
    'meeting', 'office', 'late', 'please', 'wait', 'call', 'doctor', 'train',
    'bus', 'station', 'hospital', 'interview', 'time', 'urgent', 'ready',
    'project', 'message', 'work', 'problem', 'help', 'ticket', 'flight',
    'car', 'phone', 'bill', 'money', 'price', 'start', 'cancel', 'sir',
    'madam', 'boss', 'friend', 'okay', 'ok', 'today', 'tomorrow', 'fast'
}

TELUGU_MIX_GLUE = {
    'ki', 'lo', 'unnanu', 'unna', 'avutunna', 'avutundi', 'cheyyi', 'chesta',
    'chey', 'chesanu', 'vastunna', 'vastundi', 'kavali', 'leda', 'undhi',
    'undi', 'choodu', 'ippudu', 'gurinchi', 'cheppandi', 'ra'
}

HINDI_MIX_GLUE = {
    'mein', 'me', 'pe', 'par', 'ho', 'gaya', 'raha', 'rahi', 'karo', 'karna',
    'hoga', 'hai', 'tha', 'thi', 'chal', 'aao', 'bolo', 'dekh', 'mat', 'bhai'
}

TELUGU_INFORMAL_TOKENS = {'nuvvu', 'nuvva', 'tinava', 'chey', 'ra', 'నువ్వు', 'తిన్నావా', 'చెయ్'}
HINDI_INFORMAL_TOKENS = {'tu', 'tera', 'teri', 'tere', 'tum', 'तू', 'तुम'}

def detect_script(text: str) -> str:
    """Detect whether text contains Indic scripts or Latin alphabet."""
    for char in text:
        cp = ord(char)
        if 0x0C00 <= cp <= 0x0C7F:
            return 'te'  # Telugu
        if 0x0900 <= cp <= 0x097F:
            return 'hi'  # Devanagari (Hindi/Marathi)
        if 0x0B80 <= cp <= 0x0BFF:
            return 'ta'  # Tamil
        if 0x0C80 <= cp <= 0x0CFF:
            return 'kn'  # Kannada
        if 0x0D00 <= cp <= 0x0D7F:
            return 'ml'  # Malayalam
        if 0x0A80 <= cp <= 0x0AFF:
            return 'gu'  # Gujarati
        if 0x0980 <= cp <= 0x09FF:
            return 'bn'  # Bengali
    if bool(re.search(r'[a-zA-Z]', text)):
        return 'latin'
    return 'unknown'

def analyze_input(text: str, source_lang: Optional[str] = 'auto') -> dict:
    """
    Input Intelligence Layer:
    Determines script, Romanized Indian language, presence of conversational markers, and ambiguity.
    """
    cleaned = text.strip()
    script = detect_script(cleaned)
    tokens = [re.sub(r'[^\w]', '', w.lower()) for w in cleaned.split()]
    tokens = [t for t in tokens if t]

    is_romanized = False
    inferred_lang = source_lang if (source_lang and source_lang != 'auto') else None
    has_informal_marker = False
    informal_particle = None
    has_context_pronoun = False

    # Check for informal particles (e.g., 'ra' in Telugu, 'bhai'/'yaar' in Hindi)
    if 'ra' in tokens:
        has_informal_marker = True
        informal_particle = 'ra'
    elif 'bhai' in tokens or 'yaar' in tokens:
        has_informal_marker = True
        informal_particle = 'bhai'

    # Check for ambiguous third-person pronouns that benefit from conversation context
    pronouns = {'atanu', 'aame', 'vaaru', 'he', 'she', 'they', 'usne', 'woh', 'అతను', 'ఆమె', 'వారు'}
    if any(t in pronouns for t in tokens):
        has_context_pronoun = True

    # Code-Mixed Language Analysis (Tenglish / Hinglish / Tanglish)
    code_mixed = False
    code_mixed_type = None

    en_word_count = sum(1 for t in tokens if t in COMMON_ENGLISH_WORDS)
    te_word_count = sum(1 for t in tokens if t in TELUGU_ROMANIZED_KEYWORDS or t in TELUGU_MIX_GLUE)
    hi_word_count = sum(1 for t in tokens if t in HINDI_ROMANIZED_KEYWORDS or t in HINDI_MIX_GLUE)

    if en_word_count > 0 and te_word_count > 0:
        code_mixed = True
        code_mixed_type = "Tenglish (Telugu + English)"
        inferred_lang = 'te'
        is_romanized = True
    elif en_word_count > 0 and hi_word_count > 0:
        code_mixed = True
        code_mixed_type = "Hinglish (Hindi + English)"
        inferred_lang = 'hi'
        is_romanized = True

    # Politeness & Cultural Coach Analysis
    politeness_flag = False
    politeness_tip = None
    politeness_suggestion = None

    has_te_informal = any(t in TELUGU_INFORMAL_TOKENS for t in tokens)
    has_hi_informal = any(t in HINDI_INFORMAL_TOKENS for t in tokens)

    if has_te_informal:
        politeness_flag = True
        politeness_tip = "Informal address ('nuvvu' / 'ra' / 'తిన్నావా') detected. In professional, elder, or healthcare conversations, respectful 'meeru' (మీరు) or honorific 'andi' (అండి) is customary in Telugu culture."
        # Generate respectful alternative
        politeness_suggestion = cleaned.replace('nuvvu', 'meeru').replace('nuvva', 'meera').replace('chey', 'cheyandi').replace('tinava', 'tinnara')
    elif has_hi_informal:
        politeness_flag = True
        politeness_tip = "Casual address ('tu' / 'tum') detected. For elders, clients, or medical staff, respectful 'aap' (आप) with honorific '-ji' is standard etiquette in Indian culture."
        politeness_suggestion = cleaned.replace('tu', 'aap').replace('tum', 'aap').replace('tera', 'aapka').replace('teri', 'aapki')

    if script == 'latin':
        # Check against Romanized vocabulary sets
        te_matches = sum(1 for t in tokens if t in TELUGU_ROMANIZED_KEYWORDS)
        hi_matches = sum(1 for t in tokens if t in HINDI_ROMANIZED_KEYWORDS)

        if te_matches > 0 and te_matches >= hi_matches:
            is_romanized = True
            if not inferred_lang:
                inferred_lang = 'te'
        elif hi_matches > 0:
            is_romanized = True
            if not inferred_lang:
                inferred_lang = 'hi'
        else:
            # Fallback to langdetect if standard English/other Latin language
            if not inferred_lang:
                try:
                    inferred_lang = detect(cleaned)
                except Exception:
                    inferred_lang = 'en'
    elif script != 'unknown':
        inferred_lang = script
    else:
        inferred_lang = source_lang or 'auto'

    return {
        "text": cleaned,
        "script": script,
        "is_romanized": is_romanized,
        "inferred_lang": inferred_lang or 'auto',
        "has_informal_marker": has_informal_marker,
        "informal_particle": informal_particle,
        "has_context_pronoun": has_context_pronoun,
        "code_mixed": code_mixed,
        "code_mixed_type": code_mixed_type,
        "politeness_flag": politeness_flag,
        "politeness_tip": politeness_tip,
        "politeness_suggestion": politeness_suggestion,
        "tokens": tokens
    }

