from abc import ABC, abstractmethod


class OverviewGenerator(ABC):
    """Generates contextual copy for an English phrase (overview or roast)."""

    @abstractmethod
    async def generate_overview(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        """Return a practical explanation in Russian."""

    @abstractmethod
    async def generate_roast(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        """Return a witty roast in Russian."""

    async def generate(
        self,
        english: str,
        translation: str,
        context: str | None = None,
    ) -> str:
        return await self.generate_overview(english, translation, context)
