import logging
from collections.abc import AsyncGenerator

from sqlalchemy import event, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.infrastructure.config.settings import settings
from app.infrastructure.db.models import Base, UserModel

logger = logging.getLogger(__name__)


def _engine_kwargs() -> dict:
    if settings.is_postgres:
        return {"echo": False, "pool_pre_ping": True}
    return {
        "echo": False,
        "connect_args": {"timeout": 30},
    }


engine = create_async_engine(settings.database_url, **_engine_kwargs())
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


if not settings.is_postgres:

    @event.listens_for(engine.sync_engine, "connect")
    def _sqlite_pragmas(dbapi_conn, _connection_record) -> None:
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


async def _run_migrations(conn) -> None:
    """Add new columns to existing SQLite databases."""
    if settings.is_postgres:
        return

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

    from sqlalchemy import func

    async with async_session_factory() as session:
        user_count = await session.scalar(select(func.count()).select_from(UserModel)) or 0
        db_label = "postgres" if settings.is_postgres else settings.database_url.rsplit("/", 1)[-1]
        logger.info("Database ready (%s) — users: %s", db_label, user_count)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
