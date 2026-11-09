import json
from typing import List, Dict, Optional
from .translation_service import query_gtx, resolve_semantic_meaning
from .llm_service import openai_client

CURATED_SMART_REPLIES = {
    'greetings': [
        {"reply": "Hello! Nice to meet you.", "tone": "Friendly"},
        {"reply": "Hi, how are you doing today?", "tone": "Casual"},
        {"reply": "Greetings! Hope you are having a wonderful day.", "tone": "Polite"}
    ],
    'did_you_eat': [
        {"reply": "Yes, I just had my meal. Did you eat?", "tone": "Affirmative"},
        {"reply": "Not yet, I will eat in a little while.", "tone": "Casual"},
        {"reply": "Yes, finished! Thank you for asking.", "tone": "Polite"}
    ],
    'how_are_you': [
        {"reply": "I am doing well, thank you! How about you?", "tone": "Polite"},
        {"reply": "Doing great! Hope everything is good on your end.", "tone": "Casual"},
        {"reply": "All good here, thanks for asking!", "tone": "Friendly"}
    ],
    'thank_you': [
        {"reply": "You are most welcome!", "tone": "Polite"},
        {"reply": "No problem at all, happy to help!", "tone": "Friendly"},
        {"reply": "Glad I could help. Anytime!", "tone": "Casual"}
    ],
    'what_are_you_doing': [
        {"reply": "Just finishing up some work right now.", "tone": "Casual"},
        {"reply": "Nothing much, just relaxing. What about you?", "tone": "Friendly"},
        {"reply": "A few tasks here. Let's catch up shortly!", "tone": "Polite"}
    ],
    'where_are_you_going': [
        {"reply": "Heading out for some errands, will be back soon.", "tone": "Casual"},
        {"reply": "On my way to the office right now.", "tone": "Direct"},
        {"reply": "Going to meet a friend nearby.", "tone": "Friendly"}
    ],
    'scenario_doctor': [
        {"reply": "Since when have you been having this pain or symptom?", "tone": "Clarification"},
        {"reply": "Is the discomfort sharp, dull, or throbbing?", "tone": "Diagnostic"},
        {"reply": "I will examine you and prescribe the proper medication.", "tone": "Clinical"}
    ],
    'scenario_travel': [
        {"reply": "Which platform or bay does this arrive at?", "tone": "Inquiry"},
        {"reply": "Is it running on scheduled time or delayed?", "tone": "Direct"},
        {"reply": "Where is the nearest ticket counter or assistance desk?", "tone": "Polite"}
    ],
    'scenario_emergency': [
        {"reply": "Please call an ambulance immediately!", "tone": "Urgent"},
        {"reply": "Stay calm, medical help is on the way right now.", "tone": "Reassuring"},
        {"reply": "Where is the nearest hospital emergency casualty?", "tone": "Critical"}
    ],
    'scenario_interview': [
        {"reply": "I have relevant experience and am excited to contribute.", "tone": "Professional"},
        {"reply": "Could you please elaborate on the core expectations?", "tone": "Clarification"},
        {"reply": "Thank you for the opportunity to discuss this role.", "tone": "Courteous"}
    ],
    'scenario_shopping': [
        {"reply": "What is the final best price you can offer?", "tone": "Bargaining"},
        {"reply": "Do you have this available in another size or color?", "tone": "Inquiry"},
        {"reply": "I will purchase this if you can offer a fair discount.", "tone": "Decisive"}
    ],
    'default': [
        {"reply": "Understood, thank you for sharing.", "tone": "Polite"},
        {"reply": "Yes, sounds good to me!", "tone": "Affirmative"},
        {"reply": "Could you tell me more about that?", "tone": "Inquisitive"}
    ]
}

def generate_smart_replies(
    text: str,
    target_lang: str = 'en',
    context_summary: Optional[str] = None,
    scenario: Optional[str] = 'general'
) -> List[Dict[str, str]]:
    """
    EchoBridge AI Smart Reply Generator:
    Suggests 3 context-aware replies in target_lang to facilitate seamless communication.
    Adapts according to scenario (doctor, travel, emergency, interview, shopping).
    """
    clean = text.strip().lower()
    scen = (scenario or 'general').lower()
    
    # 1. Try LLM if available and healthy
    if openai_client:
        try:
            prompt = (
                f"Given the incoming message '{text}' in context of scenario '{scen}', "
                f"suggest 3 natural, conversational, scenario-appropriate replies in language code '{target_lang}'. "
                f"Return ONLY valid JSON with key 'replies' containing an array of 3 objects with keys 'reply' (in {target_lang}) and 'tone'."
            )
            if context_summary:
                prompt += f"\nConversation context:\n{context_summary}"
                
            res = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an AI assistant that suggests short, natural, conversational replies. Respond only with JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=200,
                response_format={"type": "json_object"},
                timeout=3.0
            )
            data = json.loads(res.choices[0].message.content)
            if data.get("replies") and len(data["replies"]) > 0:
                return data["replies"][:3]
        except Exception:
            pass  # Fall back to semantic heuristics seamlessly

    # 2. Semantic Heuristic Fallback
    matched_category = 'default'
    if scen in ('doctor', 'medical', 'hospital'):
        matched_category = 'scenario_doctor'
    elif scen in ('travel', 'station', 'transit'):
        matched_category = 'scenario_travel'
    elif scen in ('emergency', 'sos'):
        matched_category = 'scenario_emergency'
    elif scen in ('interview', 'business', 'job'):
        matched_category = 'scenario_interview'
    elif scen in ('shopping', 'market', 'store'):
        matched_category = 'scenario_shopping'
    elif any(w in clean for w in ['hello', 'hi', 'namaste', 'namaskaram', 'నమస్తే', 'నమస్కారం']):
        matched_category = 'greetings'
    elif any(w in clean for w in ['eat', 'food', 'tinnara', 'tinnava', 'tinara', 'తిన్నారా', 'తిన్నావా', 'khana']):
        matched_category = 'did_you_eat'
    elif any(w in clean for w in ['how are you', 'bagunnara', 'ela unnaru', 'ela unnav', 'ఎలా ఉన్నారు', 'ఎలా ఉన్నావు', 'kaise ho']):
        matched_category = 'how_are_you'
    elif any(w in clean for w in ['thank', 'danyavadalu', 'dhanyavadalu', 'ధన్యవాదాలు', 'shukriya', 'dhanyawad']):
        matched_category = 'thank_you'
    elif any(w in clean for w in ['doing', 'chestunnav', 'chestunnaru', 'ఏం చేస్తున్నారు', 'kya kar']):
        matched_category = 'what_are_you_doing'
    elif any(w in clean for w in ['going', 'velthunnav', 'velthunnaru', 'ఎక్కడికి', 'kahan ja']):
        matched_category = 'where_are_you_going'

    base_replies = CURATED_SMART_REPLIES.get(matched_category, CURATED_SMART_REPLIES['default'])

    # If target_lang is 'en', return the English curated replies directly
    if target_lang == 'en':
        return base_replies

    # Otherwise translate replies into target_lang using fast neural engine
    translated_replies = []
    for item in base_replies:
        try:
            trans, _ = query_gtx(item['reply'], sl='en', tl=target_lang)
            translated_replies.append({"reply": trans, "tone": item['tone']})
        except Exception:
            translated_replies.append(item)
    return translated_replies

