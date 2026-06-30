import httpx

from app.domain.services.overview_generator import OverviewGenerator
from app.domain.services.overview_prompt import OVERVIEW_SYSTEM_PROMPT, build_overview_prompt
from app.infrastructure.config.settings import settings


class OllamaOverviewGenerator(OverviewGenerator):
    """Free local LLM via Ollama — no API key required."""

    async def generate(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        payload = {
            "model": settings.ollama_model,
            "messages": [
                {"role": "system", "content": OVERVIEW_SYSTEM_PROMPT},
                {"role": "user", "content": build_overview_prompt(english, translation, context)},
            ],
            "stream": False,
            "options": {"temperature": 0.35, "num_predict": 520},
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        content = data.get("message", {}).get("content", "").strip()
        if not content:
            raise ValueError("Ollama returned empty overview")
        return content


class GroqOverviewGenerator(OverviewGenerator):
    """Free-tier cloud LLM via Groq — fast, needs GROQ_API_KEY."""

    async def generate(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not configured")

        payload = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": OVERVIEW_SYSTEM_PROMPT},
                {"role": "user", "content": build_overview_prompt(english, translation, context)},
            ],
            "temperature": 0.35,
            "max_tokens": 560,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            )
            response.raise_for_status()
            data = response.json()

        content = data["choices"][0]["message"]["content"].strip()
        if not content:
            raise ValueError("Groq returned empty overview")
        return content
