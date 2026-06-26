import logging

from app.infrastructure.db.database import async_session_factory
from app.infrastructure.db.repositories import CardRepository
from app.infrastructure.llm.factory import get_overview_generator

logger = logging.getLogger(__name__)


async def generate_overview_for_card(card_id: int, user_id: int) -> None:
    """Background job: call LLM and persist overview on the card."""
    generator = get_overview_generator()
    if not generator:
        return

    async with async_session_factory() as session:
        repo = CardRepository(session, user_id)
        card = await repo.get_by_id(card_id)
        if not card:
            return

        if card.overview_status == "ready" and card.overview:
            return

        await repo.set_overview_status(card_id, "generating")

        try:
            overview = await generator.generate(
                english=card.english,
                translation=card.translation,
                context=card.context,
            )
            await repo.save_overview(card_id, overview)
            logger.info("Overview generated for card %s", card_id)
        except Exception as exc:
            logger.warning("Overview generation failed for card %s: %s", card_id, exc)
            await repo.set_overview_status(card_id, "failed")
