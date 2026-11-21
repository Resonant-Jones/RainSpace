"""Shared test fixtures.

Tests run against a real PostgreSQL + pgvector database - the same one the
docker-compose stack serves - but inside a throwaway schema that is created
by running the real Alembic migrations and dropped afterwards. That keeps the
tests honest about the migration, and it never touches the `public` schema or
the seeded demo data.
"""

from __future__ import annotations

import os
import uuid
from collections.abc import Iterator
from datetime import datetime, timezone
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.db.base import get_db
from app.models.entities import ContentItem, Creator, PublicationStatus

API_DIR = Path(__file__).resolve().parents[1]

TEST_DATABASE_URL = (
    os.getenv("TEST_DATABASE_URL")
    or os.getenv("DATABASE_URL")
    or "postgresql+psycopg://cdp:cdp@localhost:5432/cdp"
)


def _engine(schema: str | None = None):
    connect_args = (
        {"options": f"-csearch_path={schema},public"} if schema else {}
    )
    return create_engine(TEST_DATABASE_URL, connect_args=connect_args)


@pytest.fixture(scope="session")
def test_schema() -> Iterator[str]:
    """Create an isolated schema, migrate it, and drop it afterwards."""
    schema = f"cdp_test_{uuid.uuid4().hex[:12]}"

    bootstrap = _engine()
    with bootstrap.connect() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
        connection.commit()
    bootstrap.dispose()

    previous_url = os.environ.get("DATABASE_URL")
    previous_schema = os.environ.get("ALEMBIC_TARGET_SCHEMA")
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    os.environ["ALEMBIC_TARGET_SCHEMA"] = schema
    get_settings.cache_clear()

    alembic_config = Config(str(API_DIR / "alembic" / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(API_DIR / "alembic"))
    command.upgrade(alembic_config, "head")

    try:
        yield schema
    finally:
        if previous_url is None:
            os.environ.pop("DATABASE_URL", None)
        else:
            os.environ["DATABASE_URL"] = previous_url
        if previous_schema is None:
            os.environ.pop("ALEMBIC_TARGET_SCHEMA", None)
        else:
            os.environ["ALEMBIC_TARGET_SCHEMA"] = previous_schema
        get_settings.cache_clear()

        cleanup = _engine()
        with cleanup.connect() as connection:
            connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
            connection.commit()
        cleanup.dispose()


@pytest.fixture()
def db(test_schema: str) -> Iterator[Session]:
    """A session bound to the isolated schema, truncated before each test."""
    engine = _engine(test_schema)
    with engine.connect() as connection:
        connection.execute(
            text("TRUNCATE creators, content_items, media_assets, transcripts CASCADE")
        )
        connection.commit()

    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db: Session) -> Iterator:
    """A TestClient whose database dependency points at the test schema."""
    from fastapi.testclient import TestClient

    from app.main import app

    def override_get_db() -> Iterator[Session]:
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# --- data helpers ---------------------------------------------------------


def make_creator(
    db: Session,
    slug: str,
    display_name: str = "Test Creator",
    theme: dict | None = None,
) -> Creator:
    creator = Creator(
        slug=slug,
        display_name=display_name,
        tagline="Fixture creator",
        theme=theme or {"accent": "#7c5cff"},
    )
    db.add(creator)
    db.flush()
    return creator


def make_content(
    db: Session,
    creator: Creator,
    slug: str,
    status: PublicationStatus = PublicationStatus.PUBLISHED,
    price_minor_units: int = 0,
    title: str | None = None,
) -> ContentItem:
    published_at = (
        datetime(2026, 1, 1, tzinfo=timezone.utc)
        if status == PublicationStatus.PUBLISHED
        else None
    )
    item = ContentItem(
        creator_id=creator.id,
        slug=slug,
        title=title or slug.replace("-", " ").title(),
        description="Fixture content.",
        price_minor_units=price_minor_units,
        currency="USD",
        status=status,
        published_at=published_at,
    )
    db.add(item)
    db.flush()
    return item
