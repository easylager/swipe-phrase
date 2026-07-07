from app.domain.services.overview_generator import OverviewGenerator
from app.domain.services.usage_challenge_generator import (
    GroqUsageChallengeGenerator,
    OllamaUsageChallengeGenerator,
    UsageChallengeGenerator,
)
from app.infrastructure.config.settings import settings
from app.infrastructure.llm.providers import GroqOverviewGenerator, OllamaOverviewGenerator


def get_overview_generator() -> OverviewGenerator | None:
    provider = settings.llm_provider.lower()
    if provider == "none":
        return None
    if provider == "groq":
        return GroqOverviewGenerator()
    if provider == "ollama":
        return OllamaOverviewGenerator()
    raise ValueError(f"Unknown LLM provider: {provider")


def get_usage_challenge_generator() -> UsageChallengeGenerator | None:
    provider = settings.llm_provider.lower()
    if provider == "none":
        return None
    if provider == "groq":
        return GroqUsageChallengeGenerator()
    if provider == "ollama":
        return OllamaUsageChallengeGenerator()
    raise ValueError(f"Unknown LLM provider: {provider}")
