import os
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

try:
    from openai import OpenAI
    openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
except Exception:
    openai_client = None

def call_llm_translation(
    text: str,
    source_lang: str,
    target_lang: str,
    conversation_context: Optional[str] = None,
    tone: Optional[str] = 'default'
) -> Optional[Dict[str, Any]]:
    """
    Intelligent Path LLM Call:
    Invoked strictly for ambiguous, Romanized, contextual, or tone-sensitive queries.
    Returns structured JSON or None if OpenAI is unavailable/exhausted.
    """
    if not openai_client:
        return None

    system_instructions = (
        "You are EchoBridge AI, a smart multilingual interpreter and conversation assistant. "
        "Your task is to provide true MEANING-BASED translation, never simple phonetic transliteration. "
        "Intelligently interpret Romanized Indian languages (e.g., Telugu 'ela unnav ra' -> 'How are you, bro?', 'danyavadalu' -> 'Thank you'). "
        "If recent conversation context is provided, resolve pronouns (e.g. 'Atanu' referring to the person mentioned earlier). "
        "Respond ONLY with a valid JSON object with keys: "
        "'translated_text' (string), 'detected_code' (e.g. 'te', 'hi', 'en'), 'tone_detected' (string), 'notes' (string)."
    )

    prompt = f"Translate the following input into target language code '{target_lang}'.\n"
    if source_lang and source_lang != 'auto':
        prompt += f"Source language hint: {source_lang}\n"
    if tone and tone != 'default':
        prompt += f"Requested tone style: {tone}\n"
    if conversation_context:
        prompt += f"Recent conversation context:\n{conversation_context}\n"
    prompt += f"Input text: \"{text}\""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=250,
            response_format={"type": "json_object"},
            timeout=4.0
        )
        data = json.loads(response.choices[0].message.content)
        return {
            "translated_text": data.get("translated_text", "").strip(),
            "detected_code": data.get("detected_code", source_lang or "auto"),
            "tone_detected": data.get("tone_detected", tone or "neutral"),
            "notes": data.get("notes", "")
        }
    except Exception as e:
        # Graceful fallback: RateLimitError (429), Network timeout, etc.
        print(f"[LLM Service Notice] Fallback triggered: {type(e).__name__} - {str(e)[:100]}")
        return None
