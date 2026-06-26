from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.cards import router as cards_router
from app.infrastructure.config.settings import settings
from app.infrastructure.db.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Phrase Feed API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.cors_origin_regex if not settings.frontend_url else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(cards_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
async def health_db() -> dict:
    """Diagnostics for Railway — confirms DB is reachable and persistent."""
    from sqlalchemy import func, select

    from app.infrastructure.db.database import async_session_factory
    from app.infrastructure.db.models import UserModel

    async with async_session_factory() as session:
        user_count = await session.scalar(select(func.count()).select_from(UserModel)) or 0

    return {
        "status": "ok",
        "backend": "postgres" if settings.is_postgres else "sqlite",
        "users": user_count,
    }
