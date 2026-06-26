from dataclasses import dataclass
from datetime import datetime
from enum import Enum


class CardState(str, Enum):
    NEW = "new"
    LEARNING = "learning"
    REVIEW = "review"
    RELEARNING = "relearning"
    GRADUATED = "graduated"


class ReviewRating(str, Enum):
    AGAIN = "again"      # Не знаю
    GOOD = "good"        # Знаю
    GRADUATED = "graduated"  # Выучил


@dataclass
class Card:
    id: int | None
    english: str
    translation: str
    context: str | None
    cluster: str | None
    created_at: datetime


@dataclass
class CardSchedule:
    card_id: int
    stability: float
    difficulty: float
    elapsed_days: int
    scheduled_days: int
    reps: int
    lapses: int
    state: CardState
    due: datetime
    last_review: datetime | None


@dataclass
class ReviewRecord:
    card_id: int
    rating: ReviewRating
    flip_latency_ms: int | None
    answer_latency_ms: int | None
    reviewed_at: datetime
