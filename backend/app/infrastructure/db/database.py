from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from sqlalchemy import text

from app.infrastructure.config.settings import settings
from app.infrastructure.db.models import Base

engine = create_async_engine(settings.database_url, echo=False)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def _run_migrations(conn) -> None:
    """Add new columns to existing SQLite databases."""
    result = await conn.execute(text("PRAGMA table_info(cards)"))
    columns = {row[1] for row in result.fetchall()}
    if "overview" not in columns:
        await conn.execute(text("ALTER TABLE cards ADD COLUMN overview TEXT"))
    if "overview_status" not in columns:
        await conn.execute(text("ALTER TABLE cards ADD COLUMN overview_status VARCHAR(20) DEFAULT 'pending'"))

    # Multi-user migration — legacy single-tenant cards are dropped (no owner).
    if "user_id" not in columns:
        await conn.execute(text("ALTER TABLE cards ADD COLUMN user_id INTEGER REFERENCES users(id)"))
        await conn.execute(text("DELETE FROM reviews"))
        await conn.execute(text("DELETE FROM schedules"))
        await conn.execute(text("DELETE FROM cards"))


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _run_migrations(conn)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
