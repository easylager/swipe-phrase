from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    cards: Mapped[list["CardModel"]] = relationship(back_populates="user")
    daily_stats: Mapped[list["UserDailyStatsModel"]] = relationship(back_populates="user")


class UserDailyStatsModel(Base):
    """Per-user daily gamification stats (combo record, etc.)."""
    __tablename__ = "user_daily_stats"
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_user_daily_stats"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    day: Mapped[date] = mapped_column(Date, nullable=False)
    best_combo: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["UserModel"] = relationship(back_populates="daily_stats")


class CardModel(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    english: Mapped[str] = mapped_column(String(500), nullable=False)
    translation: Mapped[str] = mapped_column(String(500), nullable=False)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)
    cluster: Mapped[str | None] = mapped_column(String(100), nullable=True)
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    overview_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    schedule: Mapped["ScheduleModel | None"] = relationship(back_populates="card", uselist=False)
    reviews: Mapped[list["ReviewModel"]] = relationship(back_populates="card")
    user: Mapped["UserModel"] = relationship(back_populates="cards")


class ScheduleModel(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id"), unique=True, nullable=False)
    stability: Mapped[float] = mapped_column(Float, default=0.0)
    difficulty: Mapped[float] = mapped_column(Float, default=0.0)
    elapsed_days: Mapped[int] = mapped_column(Integer, default=0)
    scheduled_days: Mapped[int] = mapped_column(Integer, default=0)
    reps: Mapped[int] = mapped_column(Integer, default=0)
    lapses: Mapped[int] = mapped_column(Integer, default=0)
    state: Mapped[str] = mapped_column(String(20), default="new")
    due: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_review: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    card: Mapped["CardModel"] = relationship(back_populates="schedule")


class ReviewModel(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id"), nullable=False)
    rating: Mapped[str] = mapped_column(String(20), nullable=False)
    flip_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    answer_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    card: Mapped["CardModel"] = relationship(back_populates="reviews")


class UsageChallengeModel(Base):
    """AI-generated situational prompt linked to a phrase card."""

    __tablename__ = "usage_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id"), nullable=False, index=True)
    target_phrase: Mapped[str] = mapped_column(String(500), nullable=False)
    scenario_ru: Mapped[str] = mapped_column(Text, nullable=False)
    hint_ru: Mapped[str | None] = mapped_column(Text, nullable=True)
    example_answer_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ready")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    attempts: Mapped[list["UsageChallengeAttemptModel"]] = relationship(back_populates="challenge")


class UsageChallengeAttemptModel(Base):
    __tablename__ = "usage_challenge_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("usage_challenges.id"), nullable=False, index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id"), nullable=False, index=True)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)  # applied | again
    answer_latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    challenge: Mapped["UsageChallengeModel"] = relationship(back_populates="attempts")
