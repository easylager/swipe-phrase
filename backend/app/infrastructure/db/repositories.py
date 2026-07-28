from datetime import date, datetime, timedelta, timezone

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.collection.players import build_collection
from app.domain.entities.card import Card, CardState, ReviewRating
from app.domain.services.fsrs_scheduler import FSRSScheduler
from app.domain.services.session_builder import SessionBuilder, SessionCandidate
from app.infrastructure.config.settings import settings
from app.infrastructure.db.models import (
    CardModel,
    ReviewModel,
    ScheduleModel,
    UserDailyStatsModel,
)

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

    async def get_vocabulary_stats(self) -> dict:
        """Per-card swipe success stats, worst-first then no-stats at bottom."""
        cards = await self.list_all()

        result = await self._session.execute(
            select(
                ReviewModel.card_id,
                func.count(ReviewModel.id).label("total"),
                func.sum(
                    case(
                        (ReviewModel.rating.in_(["good", "graduated"]), 1),
                        else_=0,
                    )
                ).label("known"),
            )
            .join(CardModel, ReviewModel.card_id == CardModel.id)
            .where(CardModel.user_id == self._user_id)
            .group_by(ReviewModel.card_id)
        )

        review_stats: dict[int, dict[str, int]] = {}
        for row in result.all():
            review_stats[row.card_id] = {
                "total": int(row.total),
                "known": int(row.known or 0),
            }

        items: list[dict] = []
        for card in cards:
            stats = review_stats.get(card.id, {"total": 0, "known": 0})
            total = stats["total"]
            known = stats["known"]
            success_rate = round(known / total * 100, 1) if total > 0 else None
            schedule = card.schedule
            items.append(
                {
                    "id": card.id,
                    "english": card.english,
                    "translation": card.translation,
                    "cluster": card.cluster,
                    "state": schedule.state if schedule else "new",
                    "known_count": known,
                    "total_count": total,
                    "success_rate": success_rate,
                    "lapses": schedule.lapses if schedule else 0,
                }
            )

        with_stats = [item for item in items if item["total_count"] > 0]
        without_stats = [item for item in items if item["total_count"] == 0]

        with_stats.sort(
            key=lambda item: (
                item["success_rate"] or 0,
                -item["lapses"],
                -item["total_count"],
                item["english"].lower(),
            )
        )
        without_stats.sort(key=lambda item: item["english"].lower())

        sorted_items = with_stats + without_stats
        return {
            "total_words": len(sorted_items),
            "with_stats": len(with_stats),
            "without_stats": len(without_stats),
            "items": sorted_items,
        }

    async def _daily_review_outcomes(self, *, days: int) -> list[dict]:
        """Return per-day totals and known counts for the user."""
        days = max(1, min(days, 120))
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        start = today - timedelta(days=days - 1)

        result = await self._session.execute(
            select(
                func.date(ReviewModel.reviewed_at).label("day"),
                func.count(ReviewModel.id).label("total"),
                func.sum(
                    case(
                        (ReviewModel.rating.in_(["good", "graduated"]), 1),
                        else_=0,
                    )
                ).label("known"),
            )
            .join(CardModel, ReviewModel.card_id == CardModel.id)
            .where(
                CardModel.user_id == self._user_id,
                ReviewModel.reviewed_at >= start,
            )
            .group_by(func.date(ReviewModel.reviewed_at))
            .order_by(func.date(ReviewModel.reviewed_at))
        )

        by_day = {
            str(row.day): {"total": int(row.total), "known": int(row.known or 0)}
            for row in result.all()
        }

        series: list[dict] = []
        for offset in range(days):
            d = (start + timedelta(days=offset)).date()
            key = d.isoformat()
            stats = by_day.get(key, {"total": 0, "known": 0})
            total = stats["total"]
            known = stats["known"]
            accuracy = round((known / total * 100) if total else 0.0, 1)
            series.append(
                {
                    "date": key,
                    "total": total,
                    "known": known,
                    "accuracy": accuracy,
                }
            )
        return series

    @staticmethod
    def _level_from_xp(xp_total: int) -> dict[str, int]:
        level = 1
        remaining = max(0, xp_total)
        threshold = 120
        while remaining >= threshold:
            remaining -= threshold
            level += 1
            threshold = int(threshold * 1.18)
        return {
            "level": level,
            "xp_in_level": remaining,
            "xp_to_next_level": max(1, threshold),
        }

    async def _get_mvp_word(self, *, start: datetime) -> dict | None:
        today_rows = await self._session.execute(
            select(
                ReviewModel.card_id,
                func.count(ReviewModel.id).label("total"),
                func.sum(
                    case(
                        (ReviewModel.rating.in_(["good", "graduated"]), 1),
                        else_=0,
                    )
                ).label("known"),
            )
            .join(CardModel, ReviewModel.card_id == CardModel.id)
            .where(
                CardModel.user_id == self._user_id,
                ReviewModel.reviewed_at >= start,
            )
            .group_by(ReviewModel.card_id)
        )
        today_stats = {
            int(row.card_id): {"total": int(row.total), "known": int(row.known or 0)}
            for row in today_rows.all()
            if int(row.total) > 0
        }
        if not today_stats:
            return None

        previous_rows = await self._session.execute(
            select(
                ReviewModel.card_id,
                func.count(ReviewModel.id).label("total"),
                func.sum(
                    case(
                        (ReviewModel.rating.in_(["good", "graduated"]), 1),
                        else_=0,
                    )
                ).label("known"),
            )
            .join(CardModel, ReviewModel.card_id == CardModel.id)
            .where(
                CardModel.user_id == self._user_id,
                ReviewModel.reviewed_at < start,
                ReviewModel.card_id.in_(list(today_stats.keys())),
            )
            .group_by(ReviewModel.card_id)
        )
        previous_stats = {
            int(row.card_id): {"total": int(row.total), "known": int(row.known or 0)}
            for row in previous_rows.all()
        }

        card_rows = await self._session.execute(
            select(CardModel.id, CardModel.english).where(
                CardModel.user_id == self._user_id,
                CardModel.id.in_(list(today_stats.keys())),
            )
        )
        card_names = {int(row.id): row.english for row in card_rows.all()}

        scored: list[dict] = []
        for card_id, stats in today_stats.items():
            total_today = stats["total"]
            known_today = stats["known"]
            today_accuracy = (known_today / total_today) * 100 if total_today else 0.0
            previous = previous_stats.get(card_id, {"total": 0, "known": 0})
            prev_total = previous["total"]
            prev_accuracy = (previous["known"] / prev_total) * 100 if prev_total else 0.0
            delta = today_accuracy - prev_accuracy
            scored.append(
                {
                    "card_id": card_id,
                    "english": card_names.get(card_id, ""),
                    "delta_accuracy": round(delta, 1),
                    "today_accuracy": round(today_accuracy, 1),
                    "previous_accuracy": round(prev_accuracy, 1),
                    "total_today": total_today,
                }
            )

        scored.sort(
            key=lambda row: (
                row["delta_accuracy"],
                row["today_accuracy"],
                row["total_today"],
            ),
            reverse=True,
        )
        best = scored[0]
        return {
            "card_id": best["card_id"],
            "english": best["english"],
            "delta_accuracy": best["delta_accuracy"],
            "today_accuracy": best["today_accuracy"],
            "previous_accuracy": best["previous_accuracy"],
        }

    async def get_matchday_stats(self) -> dict:
        target_reviews = max(1, settings.matchday_target_reviews)
        target_accuracy = max(1.0, min(100.0, settings.matchday_target_accuracy))

        # 35 days gives enough history for streak + form.
        daily = await self._daily_review_outcomes(days=35)
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        if not daily:
            today_data = {"date": date.today().isoformat(), "total": 0, "known": 0, "accuracy": 0.0}
            form_last5 = []
            unbeaten_run = 0
        else:
            today_data = daily[-1]
            for item in daily:
                item["completed"] = (
                    item["total"] >= target_reviews and item["accuracy"] >= target_accuracy
                )

            unbeaten_run = 0
            for item in reversed(daily):
                if item["completed"]:
                    unbeaten_run += 1
                elif item["total"] > 0:
                    break
                else:
                    # skip empty days; they neither continue nor break the run
                    continue

            played_days = [item for item in daily if item["total"] > 0]
            form_last5 = played_days[-5:]

        today_completed = (
            today_data["total"] >= target_reviews and today_data["accuracy"] >= target_accuracy
        )
        if today_data["total"] < target_reviews:
            today_result = None
        elif today_completed:
            today_result = "win"
        elif today_data["accuracy"] >= max(1.0, target_accuracy - 10):
            today_result = "draw"
        else:
            today_result = "loss"

        totals = await self._session.execute(
            select(
                func.count(ReviewModel.id).label("total"),
                func.sum(
                    case(
                        (ReviewModel.rating.in_(["good", "graduated"]), 1),
                        else_=0,
                    )
                ).label("known"),
            )
            .join(CardModel, ReviewModel.card_id == CardModel.id)
            .where(CardModel.user_id == self._user_id)
        )
        totals_row = totals.one()
        total_reviews = int(totals_row.total or 0)
        known_reviews = int(totals_row.known or 0)
        xp_total = known_reviews * 12 + total_reviews * 3 + unbeaten_run * 20
        level_data = self._level_from_xp(xp_total)

        season_size = 5000
        season_progress = round(((xp_total % season_size) / season_size) * 100, 1)
        mvp_word = await self._get_mvp_word(start=today_start)

        return {
            "date": today_data["date"],
            "target_reviews": target_reviews,
            "target_accuracy": float(round(target_accuracy, 1)),
            "today_total": int(today_data["total"]),
            "today_known": int(today_data["known"]),
            "today_accuracy": float(today_data["accuracy"]),
            "today_completed": bool(today_completed),
            "today_result": today_result,
            "unbeaten_run": int(unbeaten_run),
            "form_last5": form_last5,
            "xp_total": int(xp_total),
            "level": level_data["level"],
            "xp_in_level": level_data["xp_in_level"],
            "xp_to_next_level": level_data["xp_to_next_level"],
            "season_progress": season_progress,
            "season_name": "Road to Wembley",
            "mvp_word": mvp_word,
        }

    async def get_collection_metrics(self) -> dict[str, int]:
        """Learning metrics that drive England squad unlocks."""
        target_reviews = max(1, settings.matchday_target_reviews)
        target_accuracy = max(1.0, min(100.0, settings.matchday_target_accuracy))

        daily = await self._daily_review_outcomes(days=120)
        matchdays_played = 0
        matchday_wins = 0
        high_accuracy_wins = 0
        for item in daily:
            if item["total"] >= target_reviews:
                matchdays_played += 1
                accuracy = item["accuracy"]
                completed = accuracy >= target_accuracy
                if completed:
                    matchday_wins += 1
                if completed and accuracy >= 80.0:
                    high_accuracy_wins += 1

        unbeaten_run = 0
        if daily:
            for item in daily:
                item["completed"] = (
                    item["total"] >= target_reviews and item["accuracy"] >= target_accuracy
                )
            for item in reversed(daily):
                if item["completed"]:
                    unbeaten_run += 1
                elif item["total"] > 0:
                    break

        cards = await self.list_all()
        graduated_words = sum(
            1 for c in cards if c.schedule and c.schedule.state == CardState.GRADUATED.value
        )
        vocabulary_size = len(cards)

        totals = await self._session.execute(
            select(func.count(ReviewModel.id))
            .join(CardModel, ReviewModel.card_id == CardModel.id)
            .where(CardModel.user_id == self._user_id)
        )
        total_reviews = int(totals.scalar_one() or 0)

        combo_result = await self._session.execute(
            select(func.max(UserDailyStatsModel.best_combo)).where(
                UserDailyStatsModel.user_id == self._user_id
            )
        )
        best_combo_ever = int(combo_result.scalar_one_or_none() or 0)

        return {
            "matchdays_played": matchdays_played,
            "matchday_wins": matchday_wins,
            "unbeaten_run": unbeaten_run,
            "total_reviews": total_reviews,
            "graduated_words": graduated_words,
            "vocabulary_size": vocabulary_size,
            "best_combo_ever": best_combo_ever,
            "high_accuracy_wins": high_accuracy_wins,
        }

    async def get_squad_collection(self) -> dict:
        metrics = await self.get_collection_metrics()
        return build_collection(metrics)

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
