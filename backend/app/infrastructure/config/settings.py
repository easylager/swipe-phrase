import os

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./phrase_feed.db"
    port: int = 8000

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
        ]
    )
    # LAN dev only — ignored when FRONTEND_URL is set for production
    cors_origin_regex: str = r"http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?"
    frontend_url: str = ""

    daily_new_limit: int = 20
    session_size: int = 30
    matchday_target_reviews: int = 25
    matchday_target_accuracy: float = 65.0

    # Usage challenges — AI situational prompts for well-known phrases
    usage_challenge_min_reviews: int = 3
    usage_challenge_min_success_rate: float = 65.0
    usage_challenge_max_per_session: int = 5

    # LLM overview: ollama (local dev) | groq (cloud, Railway) | none
    llm_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:latest"
    groq_api_key: str = ""
    groq_model: str = "llama-3.1-8b-instant"

    jwt_secret: str = "dev-change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 30

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        """Railway Postgres uses postgres:// — convert for SQLAlchemy async."""
        if value.startswith("postgres://"):
            value = value.replace("postgres://", "postgresql://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        # On Railway without explicit URL, store SQLite on the mounted volume.
        if os.environ.get("RAILWAY_ENVIRONMENT") and value.startswith("sqlite"):
            if "/data/" not in value and "///app/data" not in value:
                return "sqlite+aiosqlite:////app/data/phrase_feed.db"
        return value

    @property
    def is_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")

    @property
    def allowed_origins(self) -> list[str]:
        origins = list(self.cors_origins)
        if self.frontend_url and self.frontend_url not in origins:
            origins.append(self.frontend_url.rstrip("/"))
        return origins


settings = Settings()
