from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class CardModel(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    english: Mapped[str] = mapped_column(String(500), nullable=False)
    translation: Mapped[str] = mapped_column(String(500), nullable=False)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)
    cluster: Mapped[str | None] = mapped_column(String(100), nullable=True)
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    overview_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    schedule: Mapped["ScheduleModel | None"] = relationship(back_populates="card", uselist=False)
    reviews: Mapped[list["ReviewModel"]] = relationship(back_populates="card")


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
