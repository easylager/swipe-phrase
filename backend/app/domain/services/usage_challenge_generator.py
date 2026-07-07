"""Generate situational usage challenges via LLM or fallback templates."""

from __future__ import annotations

import json
import random
import re
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx

from app.domain.services.usage_challenge_prompt import (
    USAGE_CHALLENGE_SYSTEM,
    build_usage_challenge_prompt,
)
from app.infrastructure.config.settings import settings


@dataclass(frozen=True, slots=True)
class UsageChallengeContent:
    scenario_ru: str
    hint_ru: str
    example_answer_en: str


class UsageChallengeGenerator(ABC):
    @abstractmethod
    async def generate(
        self,
        english: str,
        translation: str,
        context: str | None = None,
        overview: str | None = None,
    ) -> UsageChallengeContent:
        """Return a situational prompt where the target phrase fits naturally."""


def _parse_json_content(raw: str, english: str) -> UsageChallengeContent:
    text = raw.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    data = json.loads(text)
    scenario = str(data.get("scenario_ru", "")).strip()
    hint = str(data.get("hint_ru", "")).strip()
    example = str(data.get("example_answer_en", "")).strip()
    if not scenario:
        raise ValueError("Missing scenario_ru")
    if english.lower() not in example.lower() and not _phrase_loosely_in(example, english):
        example = f'{example.rstrip(".")}. (Try: "{english}")'
    return UsageChallengeContent(
        scenario_ru=scenario,
        hint_ru=hint or "Ответь коротко и естественно.",
        example_answer_en=example or english,
    )


def _phrase_loosely_in(text: str, phrase: str) -> bool:
    words = phrase.lower().split()
    lowered = text.lower()
    return all(w in lowered for w in words[: max(2, len(words) // 2)])


def fallback_usage_challenge(
    english: str,
    translation: str,
    context: str | None = None,
) -> UsageChallengeContent:
    templates = [
        (
            "Тебе пишут в рабочем чате — нужно ответить коротко и по делу. "
            f"Ситуация связана с темой «{translation}». "
            "Как сказать по-английски, используя нужную фразу?"
        ),
        (
            "Друг спрашивает, как прошло. "
            f"Ты хочешь выразить мысль: «{translation}». "
            "Ответь ему по-английски — одним-двумя предложениями."
        ),
        (
            "Ты на созвоне, все ждут твоего мнения. "
            f"Нужно сказать что-то в духе «{translation}». "
            "Что ответишь по-английски?"
        ),
    ]
    if context:
        templates.append(
            f"Вспомни ситуацию: «{context}». "
            "Как описать это по-английски, вставив нужную фразу?"
        )
    scenario = random.choice(templates)
    return UsageChallengeContent(
        scenario_ru=scenario,
        hint_ru="Представь, что говоришь вслух — фраза должна звучать естественно.",
        example_answer_en=f"Well, {english}.",
    )


class OllamaUsageChallengeGenerator(UsageChallengeGenerator):
    async def generate(
        self,
        english: str,
        translation: str,
        context: str | None = None,
        overview: str | None = None,
    ) -> UsageChallengeContent:
        payload = {
            "model": settings.ollama_model,
            "messages": [
                {"role": "system", "content": USAGE_CHALLENGE_SYSTEM},
                {
                    "role": "user",
                    "content": build_usage_challenge_prompt(english, translation, context, overview),
                },
            ],
            "stream": False,
            "options": {"temperature": 0.45, "num_predict": 320},
            "format": "json",
        }
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            content = response.json().get("message", {}).get("content", "").strip()
        return _parse_json_content(content, english)


class GroqUsageChallengeGenerator(UsageChallengeGenerator):
    async def generate(
        self,
        english: str,
        translation: str,
        context: str | None = None,
        overview: str | None = None,
    ) -> UsageChallengeContent:
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not configured")

        payload = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": USAGE_CHALLENGE_SYSTEM},
                {
                    "role": "user",
                    "content": build_usage_challenge_prompt(english, translation, context, overview),
                },
            ],
            "temperature": 0.45,
            "max_tokens": 400,
            "response_format": {"type": "json_object"},
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"].strip()
        return _parse_json_content(content, english)
