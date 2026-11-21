"""Runtime configuration.

All values come from the environment (or a local `.env` file). No secret is
baked into the image or committed to the repository.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # SQLAlchemy URL, e.g. postgresql+psycopg://user:pass@host:5432/db
    database_url: str = "postgresql+psycopg://cdp:cdp@localhost:5432/cdp"

    app_env: str = "development"

    # Comma separated. Kept as a string so a malformed value cannot crash
    # startup with a JSON decode error.
    cors_origins: str = "http://localhost:5173,http://localhost:8888"

    # Slug of the creator created by `python -m app.seed_demo`.
    demo_creator_slug: str = "demo"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
