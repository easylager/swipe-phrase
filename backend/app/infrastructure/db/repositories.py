from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.card import Card, CardState, ReviewRating
from app.domain.services.fsrs_scheduler import FSRSScheduler
from app.domain.services.session_builder import SessionBuilder, SessionCandidate
from app.infrastructure.config.settings import settings
from app.infrastructure.db.models import CardModel, ReviewModel, ScheduleModel, UserDailyStatsModel


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class CardRepository:
    def __init__(self, session: AsyncSession, user_id: int) -> None:
        self._session = session
        self._user_id = user_id
        self._scheduler = FSRSScheduler()

    async def create(
        self,
        english: str,
        translation: str,
        context: str | None = None,
        cluster: str | None = None,
    ) -> CardModel:
        card = CardModel(
            user_id=self._user_id,
            english=english.strip(),
            translation=translation.strip(),
            context=context.strip() if context else None,
            cluster=cluster.strip() if cluster else None,
            overview_status="idle" if settings.llm_provider.lower() != "none" else "skipped",
        )
        self._session.add(card)
        await self._session.flush()

        now = datetime.now(timezone.utc)
        schedule = ScheduleModel(
            card_id=card.id,
            state=CardState.NEW.value,
            due=now,
        )
        self._session.add(schedule)
        await self._session.commit()
        return await self.get_by_id(card.id)  # type: ignore[return-value]

    async def get_by_id(self, card_id: int) -> CardModel | None:
        result = await self._session.execute(
            select(CardModel)
            .options(selectinload(CardModel.schedule))
            .where(CardModel.id == card_id, CardModel.user_id == self._user_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[CardModel]:
        result = await self._session.execute(
            select(CardModel)
            .options(selectinload(CardModel.schedule))
            .where(CardModel.user_id == self._user_id)
            .order_by(CardModel.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_new_today(self) -> int:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self._session.execute(
            select(func.count(CardModel.id)).where(
                CardModel.user_id == self._user_id,
                CardModel.created_at >= today_start,
            )
        )
        return result.scalar_one()

    async def get_session_candidates(self) -> list[SessionCandidate]:
        cards = await self.list_all()
        candidates: list[SessionCandidate] = []
        for card in cards:
            schedule = card.schedule
            if not schedule:
                continue
            candidates.append(
                SessionCandidate(
                    card_id=card.id,
                    english=card.english,
                    translation=card.translation,
                    context=card.context,
                    cluster=card.cluster,
                    state=CardState(schedule.state),
                    due=_ensure_utc(schedule.due),
                    lapses=schedule.lapses,
                    reps=schedule.reps,
                    priority=0.0,
                    bucket="",
                    overview=card.overview,
                    overview_status=card.overview_status or "skipped",
                )
            )
        return candidates

    async def submit_review(
        self,
        card_id: int,
        rating: ReviewRating,
        flip_latency_ms: int | None = None,
        answer_latency_ms: int | None = None,
    ) -> CardModel | None:
        card = await self.get_by_id(card_id)
        if not card or not card.schedule:
            return None

        schedule = card.schedule
        now = datetime.now(timezone.utc)

        # Graduated cards stay out of FSRS — just log the swipe for stats.
        if schedule.state == CardState.GRADUATED.value and rating != ReviewRating.GRADUATED:
            review = ReviewModel(
                card_id=card_id,
                rating=rating.value,
                flip_latency_ms=flip_latency_ms,
                answer_latency_ms=answer_latency_ms,
            )
            self._session.add(review)
            await self._session.commit()
            return await self.get_by_id(card_id)

        fsrs_card = self._scheduler.build_fsrs_card(
            {
                "stability": schedule.stability,
                "difficulty": schedule.difficulty,
                "elapsed_days": schedule.elapsed_days,
                "scheduled_days": schedule.scheduled_days,
                "reps": schedule.reps,
                "lapses": schedule.lapses,
                "state": CardState(schedule.state),
                "due": _ensure_utc(schedule.due),
                "last_review": _ensure_utc(schedule.last_review) if schedule.last_review else None,
            }
        )

        if rating == ReviewRating.GRADUATED:
            updated_fsrs, due = self._scheduler.schedule(fsrs_card, rating, now)
            schedule.state = CardState.GRADUATED.value
            schedule.due = due
            schedule.last_review = now
            schedule.stability = updated_fsrs.stability or schedule.stability or 0.0
            schedule.difficulty = updated_fsrs.difficulty or schedule.difficulty or 0.0
        else:
            updated_fsrs, due = self._scheduler.schedule(fsrs_card, rating, now)
            fsrs_data = self._scheduler.from_fsrs_card(updated_fsrs)
            schedule.stability = fsrs_data["stability"]
            schedule.difficulty = fsrs_data["difficulty"]
            schedule.elapsed_days = fsrs_data["elapsed_days"]
            schedule.scheduled_days = fsrs_data["scheduled_days"]
            schedule.reps = schedule.reps + 1
            if rating == ReviewRating.AGAIN:
                schedule.lapses = schedule.lapses + 1
            schedule.state = fsrs_data["state"].value
            schedule.due = due
            schedule.last_review = now

        review = ReviewModel(
            card_id=card_id,
            rating=rating.value,
            flip_latency_ms=flip_latency_ms,
            answer_latency_ms=answer_latency_ms,
        )
        self._session.add(review)
        await self._session.commit()
        return await self.get_by_id(card_id)

    async def snooze_card(self, card_id: int, days: int) -> CardModel | None:
        """Push next review date forward without counting as a review."""
        card = await self.get_by_id(card_id)
        if not card or not card.schedule:
            return None

        now = datetime.now(timezone.utc)
        card.schedule.due = now + timedelta(days=days)
        await self._session.commit()
        return await self.get_by_id(card_id)

    async def build_session(self) -> list[SessionCandidate]:
        candidates = await self.get_session_candidates()
        new_today = await self.count_new_today()
        builder = SessionBuilder(
            session_size=settings.session_size,
            daily_new_limit=settings.daily_new_limit,
        )
        return builder.build(candidates, new_today_count=new_today)

    async def count_swipes_today(self) -> int:
        """Each review = one card passed (swipe or button)."""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self._session.execute(
            select(func.count(ReviewModel.id))
            .join(CardModel, ReviewModel.card_id == CardModel.id)
            .where(
                CardModel.user_id == self._user_id,
                ReviewModel.reviewed_at >= today_start,
            )
        )
        return result.scalar_one()

    async def get_stats(self) -> dict:
        return {
            "swipes_today": await self.count_swipes_today(),
            "best_combo_today": await self.get_best_combo_today(),
        }

    async def get_best_combo_today(self) -> int:
        today = datetime.now(timezone.utc).date()
        result = await self._session.execute(
            select(UserDailyStatsModel.best_combo).where(
                UserDailyStatsModel.user_id == self._user_id,
                UserDailyStatsModel.day == today,
            )
        )
        value = result.scalar_one_or_none()
        return int(value or 0)

    async def record_combo(self, combo_after: int) -> None:
        """Persist today's best swipe combo if this streak beats the record."""
        if combo_after <= 0:
            return

        today = datetime.now(timezone.utc).date()
        result = await self._session.execute(
            select(UserDailyStatsModel).where(
                UserDailyStatsModel.user_id == self._user_id,
                UserDailyStatsModel.day == today,
            )
        )
        row = result.scalar_one_or_none()
        if row:
            if combo_after > row.best_combo:
                row.best_combo = combo_after
        else:
            self._session.add(
                UserDailyStatsModel(
                    user_id=self._user_id,
                    day=today,
                    best_combo=combo_after,
                )
            )
        await self._session.commit()

    async def get_swipes_by_day(self, days: int = 14) -> dict:
        """Swipe counts grouped by calendar day for the chart."""
        days = max(1, min(days, 90))
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        start = today - timedelta(days=days - 1)

        result = await self._session.execute(
            select(
                func.date(ReviewModel.reviewed_at).label("day"),
                func.count(ReviewModel.id).label("count"),
            )
            .join(CardModel, ReviewModel.card_id == CardModel.id)
            .where(
                CardModel.user_id == self._user_id,
                ReviewModel.reviewed_at >= start,
            )
            .group_by(func.date(ReviewModel.reviewed_at))
            .order_by(func.date(ReviewModel.reviewed_at))
        )

        counts = {str(row.day): int(row.count) for row in result.all()}

        series: list[dict] = []
        total = 0
        for offset in range(days):
            day = (start + timedelta(days=offset)).date()
            key = day.isoformat()
            count = counts.get(key, 0)
            total += count
            series.append({"date": key, "count": count})

        return {"days": series, "total": total}

    async def get_stats_full(self) -> dict:
        """Internal metrics for session builder — not exposed in UI."""
        cards = await self.list_all()
        total = len(cards)
        graduated = sum(1 for c in cards if c.schedule and c.schedule.state == CardState.GRADUATED.value)
        due = sum(
            1 for c in cards
            if c.schedule
            and c.schedule.state != CardState.GRADUATED.value
            and _ensure_utc(c.schedule.due) <= datetime.now(timezone.utc)
        )
        new = sum(1 for c in cards if c.schedule and c.schedule.state == CardState.NEW.value)
        return {
            "total": total,
            "graduated": graduated,
            "due": due,
            "new": new,
            "new_today": await self.count_new_today(),
            "daily_new_limit": settings.daily_new_limit,
        }

    async def set_overview_status(self, card_id: int, status: str) -> None:
        card = await self.get_by_id(card_id)
        if not card:
            return
        card.overview_status = status
        await self._session.commit()

    async def update(
        self,
        card_id: int,
        *,
        english: str,
        translation: str,
        context: str | None = None,
        cluster: str | None = None,
    ) -> tuple[CardModel | None, bool]:
        """Update card fields. Returns (card, english_changed)."""
        card = await self.get_by_id(card_id)
        if not card:
            return None, False

        new_english = english.strip()
        english_changed = card.english != new_english

        card.english = new_english
        card.translation = translation.strip()
        card.context = context.strip() if context else None
        card.cluster = cluster.strip() if cluster else None

        if english_changed and settings.llm_provider.lower() != "none":
            card.overview = None
            card.overview_status = "idle"

        await self._session.commit()
        updated = await self.get_by_id(card_id)
        return updated, english_changed

    async def save_overview(self, card_id: int, overview: str) -> None:
        card = await self.get_by_id(card_id)
        if not card:
            return
        card.overview = overview
        card.overview_status = "ready"
        await self._session.commit()
