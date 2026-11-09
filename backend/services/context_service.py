from typing import List, Dict, Optional

class ConversationContextManager:
    """Manages short-term recent dialogue turns for context-aware interpretation."""

    @staticmethod
    def format_context_for_prompt(context_turns: Optional[List[Dict[str, str]]], max_turns: int = 4) -> str:
        """Format recent dialogue history into a compact prompt string for LLM or resolution."""
        if not context_turns:
            return ""

        recent = context_turns[-max_turns:]
        lines = []
        for turn in recent:
            spk = turn.get("speaker", "User")
            txt = turn.get("text", "")
            trans = turn.get("translated", "")
            if txt:
                if trans:
                    lines.append(f"{spk}: {txt} (translated: {trans})")
                else:
                    lines.append(f"{spk}: {txt}")
        return "\n".join(lines)

    @staticmethod
    def extract_recent_entities(context_turns: Optional[List[Dict[str, str]]]) -> List[str]:
        """Extract capitalized entities/names from recent turns to help pronoun disambiguation."""
        if not context_turns:
            return []
        entities = []
        for turn in context_turns[-3:]:
            words = turn.get("text", "").split()
            for w in words:
                clean_w = w.strip(",.?!:;\"'")
                # Capitalized word that is not the first word of sentence
                if len(clean_w) > 2 and clean_w[0].isupper() and clean_w.lower() not in {"i", "the", "he", "she", "they", "we"}:
                    if clean_w not in entities:
                        entities.append(clean_w)
        return entities

