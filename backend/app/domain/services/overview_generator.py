from abc import ABC, abstractmethod


class OverviewGenerator(ABC):
    """Generates a short contextual explanation for an English phrase."""

    @abstractmethod
    async def generate(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        """Return overview text in Russian."""
