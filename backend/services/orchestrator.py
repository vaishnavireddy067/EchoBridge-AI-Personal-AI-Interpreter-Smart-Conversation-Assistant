import time
import re
from typing import Optional, List, Dict, Any

from .language_service import (
    SUPPORTED_LANGUAGES,
    analyze_input,
    detect_script
)
from .translation_service import (
    POPULAR_ROMANIZED,
    resolve_semantic_meaning,
    query_gtx,
    transliterate_romanized,
    normalize_meaning_loanwords
)
from .llm_service import call_llm_translation
from .context_service import ConversationContextManager

# In-memory LRU-style cache
ORCHESTRATOR_CACHE = {}

class EchoBridgeOrchestrator:
    """
    EchoBridge AI Intelligent Orchestrator:
    Central decision engine implementing Hybrid Fast Path ⚡ vs Intelligent Path 🧠.
    """

    @classmethod
    def process_translation(
        cls,
        text: str,
        source_lang: Optional[str] = 'auto',
        target_lang: str = 'en',
        tone: Optional[str] = 'default',
        conversation_context: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        cleaned = text.strip()
        if not cleaned:
            return {
                "original_text": "",
                "translated_text": "",
                "detected_code": "auto",
                "detected_lang": "Auto Detect",
                "target_lang": target_lang,
                "transliterated_script": None,
                "execution_path": "empty",
                "latency_ms": 0.0
            }

        sl = source_lang or 'auto'
        tl = target_lang or 'en'
        tone_val = tone or 'default'
        cache_key = f"{cleaned.lower()}_{sl}_{tl}_{tone_val}_{bool(conversation_context)}"

        # 0. Check Cache
        if cache_key in ORCHESTRATOR_CACHE:
            cached_res = dict(ORCHESTRATOR_CACHE[cache_key])
            cached_res["cached"] = True
            return cached_res

        start_time = time.time()

        # 1. Input Intelligence Layer
        intel = analyze_input(cleaned, source_lang=sl)
        script = intel["script"]
        is_romanized = intel["is_romanized"]
        inferred_lang = intel["inferred_lang"]
        has_informal = intel["has_informal_marker"]
        has_pronoun = intel["has_context_pronoun"]
        has_context = bool(conversation_context and len(conversation_context) > 0)

        # 2. Decision Engine Routing:
        # Determine whether to use FAST PATH ⚡ or INTELLIGENT PATH 🧠
        requires_intelligent_path = (
            has_informal or 
            (has_pronoun and has_context) or 
            (tone_val != 'default') or 
            (has_context and is_romanized)
        )

        trans_text = None
        detected_code = inferred_lang
        transliterated_script = None
        execution_path = "fast_path"

        # -------------------------------------------------------------
        # STEP A: FAST PATH CHECK (Semantic Intent & Popular Romanized)
        # -------------------------------------------------------------
        # Even if tone is requested, common greetings & phrases have immediate direct answers
        semantic_match = resolve_semantic_meaning(cleaned, tl)
        if semantic_match and not (has_informal and intel.get("informal_particle") == 'ra'):
            trans_res, det_code, script_repr = semantic_match
            trans_text = trans_res
            detected_code = det_code
            transliterated_script = script_repr
            execution_path = "fast_path_semantic"

        # -------------------------------------------------------------
        # STEP B: INTELLIGENT PATH 🧠 (For ambiguous, informal, or contextual inputs)
        # -------------------------------------------------------------
        if trans_text is None and requires_intelligent_path:
            formatted_ctx = ConversationContextManager.format_context_for_prompt(conversation_context)
            llm_result = call_llm_translation(
                text=cleaned,
                source_lang=inferred_lang,
                target_lang=tl,
                conversation_context=formatted_ctx if has_context else None,
                tone=tone_val
            )
            if llm_result and llm_result.get("translated_text"):
                trans_text = llm_result["translated_text"]
                detected_code = llm_result.get("detected_code", inferred_lang)
                execution_path = "intelligent_path_llm"

        # -------------------------------------------------------------
        # STEP C: INTELLIGENT HEURISTIC RESOLUTION (For informal markers like 'ra')
        # -------------------------------------------------------------
        if trans_text is None and has_informal and intel.get("informal_particle") == 'ra':
            # e.g. "ela unnav ra" -> core is "ela unnav" + informal particle "ra" ("bro/buddy")
            sub_tokens = [t for t in intel["tokens"] if t != 'ra']
            core_phrase = " ".join(sub_tokens)
            core_match = resolve_semantic_meaning(core_phrase, tl)
            if core_match:
                base_trans, base_det, base_script = core_match
                detected_code = base_det
                transliterated_script = base_script
                if tl == 'en':
                    # Natural informal translation: "How are you, bro?"
                    base_clean = base_trans.rstrip("?.!")
                    trans_text = f"{base_clean}, bro?" if '?' in base_trans else f"{base_clean}, bro"
                else:
                    trans_text = base_trans
                execution_path = "intelligent_path_heuristic"

        # -------------------------------------------------------------
        # STEP D: FAST PATH ⚡ (Neural GTX + Romanized transliteration probe)
        # -------------------------------------------------------------
        if trans_text is None:
            lower_clean = cleaned.lower()
            if lower_clean in POPULAR_ROMANIZED:
                native_script, lang_code = POPULAR_ROMANIZED[lower_clean]
                transliterated_script = native_script
                detected_code = lang_code
                sub_trans, _ = query_gtx(native_script, sl=lang_code, tl=tl)
                trans_text = normalize_meaning_loanwords(sub_trans, tl)
                execution_path = "fast_path_romanized"
            else:
                try:
                    gtx_trans, gtx_detected = query_gtx(cleaned, sl=sl, tl=tl)
                    # Romanized transliteration probe if GTX simply echoed the word
                    if (gtx_trans.strip().lower() == lower_clean or gtx_detected in ('te', 'hi', 'ta', 'kn')) and script == 'latin':
                        for candidate_lang in ['te', 'hi', 'ta']:
                            cand_script = transliterate_romanized(cleaned, candidate_lang)
                            if cand_script and cand_script != cleaned:
                                sub_trans, _ = query_gtx(cand_script, sl=candidate_lang, tl=tl)
                                if sub_trans.strip().lower() != cand_script.strip().lower():
                                    gtx_trans = sub_trans
                                    gtx_detected = candidate_lang
                                    transliterated_script = cand_script
                                    break

                    trans_text = normalize_meaning_loanwords(gtx_trans, tl)
                    detected_code = gtx_detected
                    execution_path = "fast_path_neural"
                except Exception as e:
                    print(f"[Orchestrator GTX Error] {e}")
                    trans_text = cleaned
                    detected_code = 'auto'
                    execution_path = "fallback_echo"

        # -------------------------------------------------------------
        # STEP E: CONTEXT-AWARE PRONOUN RESOLUTION (Heuristic Fallback)
        # -------------------------------------------------------------
        if has_pronoun and has_context and tl == 'en' and trans_text:
            entities = ConversationContextManager.extract_recent_entities(conversation_context)
            if entities and ("he" in trans_text.lower().split() or "him" in trans_text.lower().split()):
                person_name = entities[-1]
                # Enhance contextual clarity: e.g. "When will he arrive?" -> "When will he (Ravi) arrive?"
                trans_text = re.sub(r'\b(he)\b', f'he ({person_name})', trans_text, count=1, flags=re.IGNORECASE)

        latency = round((time.time() - start_time) * 1000, 1)

        result = {
            "original_text": cleaned,
            "translated_text": trans_text,
            "detected_code": detected_code,
            "detected_lang": SUPPORTED_LANGUAGES.get(detected_code, str(detected_code).upper()),
            "target_lang": tl,
            "transliterated_script": transliterated_script,
            "execution_path": execution_path,
            "tone": tone_val,
            "latency_ms": latency
        }

        ORCHESTRATOR_CACHE[cache_key] = result
        return result
