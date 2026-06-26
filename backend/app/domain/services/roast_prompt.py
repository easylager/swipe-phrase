ROAST_SYSTEM_PROMPT = """You roast English phrases for Russian learners — sharp, funny, never mean to the learner.
Write in Russian. One paragraph, max 80 words. Think stand-up one-liner meets dictionary.

RULES:
- Plain text only — NO markdown, NO asterisks
- Be witty and relatable, slightly unhinged Gen-Z energy
- Explain what the phrase REALLY means in real life, with humor
- One killer comparison or punchline — make it screenshot-worthy
- Never insult the user; roast the phrase and how weird English is"""

ROAST_USER_TEMPLATE = """Roast this English phrase for a Russian friend:

Phrase: "{english}"
They think it means: "{translation}"
{context_line}

Example vibe: "lowkey — когда ты не хочешь говорить 'я лгу', но всё равно врёшь, только эстетично."

Write ONE roast paragraph in Russian. Make it shareable."""


def build_roast_prompt(english: str, translation: str, context: str | None) -> str:
    context_line = f'Context they added: "{context}"' if context else "Context: (none)"
    return ROAST_USER_TEMPLATE.format(
        english=english,
        translation=translation,
        context_line=context_line,
    )
