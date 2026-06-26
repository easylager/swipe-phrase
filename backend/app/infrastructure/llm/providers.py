import httpx

from app.domain.services.overview_generator import OverviewGenerator
from app.domain.services.overview_prompt import OVERVIEW_SYSTEM_PROMPT, build_overview_prompt
from app.domain.services.roast_prompt import ROAST_SYSTEM_PROMPT, build_roast_prompt
from app.infrastructure.config.settings import settings


class OllamaOverviewGenerator(OverviewGenerator):
    """Free local LLM via Ollama — no API key required."""

    async def _chat(self, system: str, user: str, *, temperature: float, max_tokens: int) -> str:
        payload = {
            "model": settings.ollama_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens},
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
            raise ValueError("Ollama returned empty response")
        return content

    async def generate_overview(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        return await self._chat(
            OVERVIEW_SYSTEM_PROMPT,
            build_overview_prompt(english, translation, context),
            temperature=0.4,
            max_tokens=300,
        )

    async def generate_roast(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        return await self._chat(
            ROAST_SYSTEM_PROMPT,
            build_roast_prompt(english, translation, context),
            temperature=0.85,
            max_tokens=200,
        )


class GroqOverviewGenerator(OverviewGenerator):
    """Free-tier cloud LLM via Groq — fast, needs GROQ_API_KEY."""

    async def _chat(self, system: str, user: str, *, temperature: float, max_tokens: int) -> str:
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not configured")

        payload = {
            "model": settings.groq_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
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
            raise ValueError("Groq returned empty response")
        return content

    async def generate_overview(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        return await self._chat(
            OVERVIEW_SYSTEM_PROMPT,
            build_overview_prompt(english, translation, context),
            temperature=0.4,
            max_tokens=400,
        )

    async def generate_roast(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        return await self._chat(
            ROAST_SYSTEM_PROMPT,
            build_roast_prompt(english, translation, context),
            temperature=0.9,
            max_tokens=250,
        )
