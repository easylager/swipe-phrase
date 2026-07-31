from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.middleware import RequestIdMiddleware
from app.api.routes.auth import router as auth_router
from app.api.routes.cards import router as cards_router
from app.infrastructure.config.settings import settings
from app.infrastructure.db.database import init_db

APP_VERSION = "0.1.0"


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Phrase Feed API", version=APP_VERSION, lifespan=lifespan)

# Starlette applies middleware in reverse add order — CORS outermost.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.cors_origin_regex if not settings.frontend_url else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(RequestIdMiddleware)

app.include_router(auth_router)
app.include_router(cards_router)


@app.get("/health")
async def health(request: Request) -> dict[str, str]:
    return {
        "status": "ok",
        "service": "phrase-feed-api",
        "version": APP_VERSION,
        "request_id": getattr(request.state, "request_id", ""),
    }


@app.get("/health/db")
async def health_db(request: Request) -> dict:
    """Diagnostics for Railway — confirms DB is reachable and persistent."""
    from sqlalchemy import func, select

    from app.infrastructure.db.database import async_session_factory
    from app.infrastructure.db.models import UserModel

    async with async_session_factory() as session:
        user_count = await session.scalar(select(func.count()).select_from(UserModel)) or 0

    return {
        "status": "ok",
        "service": "phrase-feed-api",
        "version": APP_VERSION,
        "backend": "postgres" if settings.is_postgres else "sqlite",
        "users": user_count,
        "request_id": getattr(request.state, "request_id", ""),
    }
