OVERVIEW_SYSTEM_PROMPT = """You are an expert English teacher helping Russian speakers learn real-life English.
Write concise, practical explanations in Russian.
Max 150 words. No greetings, no filler.

STRICT FORMAT RULES:
- Plain text only — NO markdown, NO asterisks, NO **, NO # headers
- Use short paragraphs separated by blank lines
- Use "—" at line start for list items (not bullets with *)
- Example sentences in English on their own lines in quotes"""

OVERVIEW_USER_TEMPLATE = """Explain this English phrase to a Russian learner:

Phrase: "{english}"
Translation: "{translation}"
{context_line}

Cover these points (plain text, use "—" for each point):
— Register (slang / informal / formal / neutral) and when it's used
— How natives actually say it (real usage, not dictionary)
— 1–2 short example sentences in English
— Common mistake or nuance to watch for"""


def build_overview_prompt(english: str, translation: str, context: str | None) -> str:
    context_line = f'User note: "{context}"' if context else "User note: (none)"
    return OVERVIEW_USER_TEMPLATE.format(
        english=english,
        translation=translation,
        context_line=context_line,
    )
