from datetime import datetime, timedelta, timezone

from fsrs import Card as FSRSCard, Rating, Scheduler, State

from app.domain.entities.card import CardState, ReviewRating


class FSRSScheduler:
    """Wraps FSRS library to map our domain ratings to scheduling updates."""

    _RATING_MAP = {
        ReviewRating.AGAIN: Rating.Again,
        ReviewRating.GOOD: Rating.Good,
        ReviewRating.GRADUATED: Rating.Easy,
    }

    def __init__(self) -> None:
        self._scheduler = Scheduler()

    def create_initial_card(self) -> FSRSCard:
        return FSRSCard()

    def schedule(
        self,
        fsrs_card: FSRSCard,
        rating: ReviewRating,
        now: datetime | None = None,
    ) -> tuple[FSRSCard, datetime]:
        """Apply rating and return updated FSRS card with next due date."""
        review_time = now or datetime.now(timezone.utc)
        if review_time.tzinfo is None:
            review_time = review_time.replace(tzinfo=timezone.utc)

        fsrs_rating = self._RATING_MAP[rating]
        updated, _ = self._scheduler.review_card(fsrs_card, fsrs_rating, review_time)
        due = updated.due

        if rating == ReviewRating.GRADUATED:
            updated.state = State.Review
            due = review_time + timedelta(days=90)

        return updated, due

    @staticmethod
    def to_card_state(fsrs_state: State) -> CardState:
        mapping = {
            State.Learning: CardState.LEARNING,
            State.Review: CardState.REVIEW,
            State.Relearning: CardState.RELEARNING,
        }
        return mapping.get(fsrs_state, CardState.NEW)

    @staticmethod
    def from_fsrs_card(fsrs_card: FSRSCard) -> dict:
        return {
            "stability": fsrs_card.stability or 0.0,
            "difficulty": fsrs_card.difficulty or 0.0,
            "elapsed_days": 0,
            "scheduled_days": 0,
            "reps": 1,
            "lapses": 1 if fsrs_card.state == State.Relearning else 0,
            "state": FSRSScheduler.to_card_state(fsrs_card.state),
            "due": fsrs_card.due,
            "last_review": fsrs_card.last_review,
        }

    @staticmethod
    def build_fsrs_card(schedule_data: dict) -> FSRSCard:
        state = schedule_data.get("state", CardState.NEW)
        stability = schedule_data.get("stability") or 0.0
        difficulty = schedule_data.get("difficulty") or 0.0

        # NEW cards must start from a clean FSRS card — not Review with empty memory.
        if state == CardState.NEW or (stability <= 0 and state in (CardState.REVIEW, CardState.RELEARNING)):
            return FSRSScheduler().create_initial_card()

        card = FSRSCard()
        card.stability = stability
        card.difficulty = difficulty
        card.due = schedule_data.get("due")
        card.last_review = schedule_data.get("last_review")

        state_reverse = {
            CardState.LEARNING: State.Learning,
            CardState.REVIEW: State.Review,
            CardState.RELEARNING: State.Relearning,
            CardState.NEW: State.Learning,
        }
        card.state = state_reverse.get(state, State.Learning)
        return card
