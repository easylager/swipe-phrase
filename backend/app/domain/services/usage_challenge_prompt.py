"""LLM prompts for situational usage challenges — answer should use the target phrase."""

USAGE_CHALLENGE_SYSTEM = """Ты создаёшь короткие практические задания для русскоязычных, учящих английский.

Задача: придумать КОНКРЕТНУЮ жизненную ситуацию, где человек естественно ответил бы по-английски, используя ЦЕЛЕВУЮ ФРАЗУ.

Верни ТОЛЬКО валидный JSON (без markdown, без пояснений) с ключами:
- scenario_ru: живая ситуация на русском (2–3 предложения). Опиши кто, где, что спрашивает или происходит. В конце — прямой вопрос или просьба ответить по-английски. НЕ вставляй целевую фразу и её перевод в scenario_ru.
- hint_ru: одна короткая подсказка на русском (направление мысли, не раскрывай фразу дословно)
- example_answer_en: один естественный пример ответа на английском (1–2 предложения) — ОБЯЗАТЕЛЬНО содержит целевую фразу дословно или в естественной форме (past tense, plural и т.д.)

Ситуации: Slack/Teams, email, созвон, кафе, аэропорт, свидание, спорт — что уместно фразе.
Избегай абстракций («представь, что...» без деталей) и учебникового тона."""


USAGE_CHALLENGE_USER_TEMPLATE = """Целевая фраза: "{english}"
Перевод: "{translation}"
{context_line}
{overview_line}

Сгенерируй JSON."""


def build_usage_challenge_prompt(
    english: str,
    translation: str,
    context: str | None = None,
    overview: str | None = None,
) -> str:
    context_line = f'Контекст ученика: «{context}»' if context else ""
    overview_line = ""
    if overview:
        snippet = overview[:400].replace("\n", " ")
        overview_line = f"Обзор фразы (ориентир): {snippet}"
    return USAGE_CHALLENGE_USER_TEMPLATE.format(
        english=english,
        translation=translation,
        context_line=context_line,
        overview_line=overview_line,
    )
