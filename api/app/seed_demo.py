"""Repeatable demo seed.

Run with:

    python -m app.seed_demo

Everything this module writes is placeholder data: generic titles, generic
copy, and storage keys that point at nothing. No real media, no real customer
data, no creator records of any actual person.

The operation is idempotent. Running it repeatedly converges on the same
state - it updates existing rows instead of duplicating them - so it can be
used to reset a local database before a demo.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.base import SessionLocal
from app.models.entities import (
    ContentItem,
    Creator,
    MediaAsset,
    MediaAssetType,
    PublicationStatus,
    Transcript,
)

DEMO_THEME = {
    "primary": "#14141c",
    "accent": "#7c5cff",
    "background": "#0b0b0f",
    "surface": "#17171f",
    "text": "#f4f4f6",
    "muted": "#9b9bab",
}

# Fixed past timestamps keep the seeded catalog deterministic between runs.
_PUBLISHED = [
    {
        "slug": "field-recording-notes",
        "title": "Field Recording Notes",
        "description": (
            "A short walk-and-talk session about capturing location sound. "
            "Placeholder content for the platform demonstration."
        ),
        "price_minor_units": 0,
        "status": PublicationStatus.PUBLISHED,
        "published_at": datetime(2026, 1, 14, 17, 0, tzinfo=timezone.utc),
        "duration_seconds": 812.0,
        "transcript": {
            "raw_text": (
                "Placeholder transcript for the demo catalogue entry. It exists so the "
                "storage shape is fixed before any transcription pipeline is built."
            ),
            "summary": "Placeholder summary describing the demo catalogue entry.",
        },
    },
    {
        "slug": "keyboard-mechanics",
        "title": "Keyboard Mechanics: A Beginner's Path",
        "description": (
            "An instructional series entry covering the fundamentals. "
            "Placeholder content for the platform demonstration."
        ),
        "price_minor_units": 900,
        "status": PublicationStatus.PUBLISHED,
        "published_at": datetime(2026, 2, 3, 12, 30, tzinfo=timezone.utc),
        "duration_seconds": 2415.5,
        "transcript": {
            "raw_text": "Placeholder transcript for the demo catalogue entry.",
            "summary": "Placeholder summary for an instructional demo entry.",
        },
    },
    {
        "slug": "night-bus-short-film",
        "title": "Night Bus: A Short Film",
        "description": (
            "A short film entry with a paid tier. "
            "Placeholder content for the platform demonstration."
        ),
        "price_minor_units": 1400,
        "status": PublicationStatus.PUBLISHED,
        "published_at": datetime(2026, 3, 22, 20, 15, tzinfo=timezone.utc),
        "duration_seconds": 1563.0,
        "transcript": {
            "raw_text": "Placeholder transcript for the demo catalogue entry.",
            "summary": "Placeholder summary for a demo short film entry.",
        },
    },
]

_DRAFT = {
    "slug": "untitled-workshop-draft",
    "title": "Untitled Workshop Draft",
    "description": (
        "A draft entry. It must never appear in a public catalog response - "
        "this is the fixture that proves draft exclusion."
    ),
    "price_minor_units": 0,
    "status": PublicationStatus.DRAFT,
    "published_at": None,
    "duration_seconds": None,
    "transcript": None,
}

_SCHEDULED = {
    "slug": "room-tone-part-two",
    "title": "Room Tone: Part Two",
    "description": (
        "A scheduled entry. It is not published yet, so the public API must "
        "not return it."
    ),
    "price_minor_units": 0,
    "status": PublicationStatus.SCHEDULED,
    "published_at": None,  # resolved relative to now so it stays in the future
    "duration_seconds": 640.0,
    "transcript": None,
}


def _upsert_creator(db: Session, slug: str, display_name: str, tagline: str) -> Creator:
    creator = db.scalar(select(Creator).where(Creator.slug == slug))
    if creator is None:
        creator = Creator(slug=slug)
        db.add(creator)
    creator.display_name = display_name
    creator.tagline = tagline
    creator.theme = dict(DEMO_THEME)
    db.flush()
    return creator


def _upsert_content(db: Session, creator: Creator, spec: dict) -> ContentItem:
    content = db.scalar(
        select(ContentItem).where(
            ContentItem.creator_id == creator.id,
            ContentItem.slug == spec["slug"],
        )
    )
    if content is None:
        content = ContentItem(creator_id=creator.id, slug=spec["slug"])
        db.add(content)

    content.title = spec["title"]
    content.description = spec["description"]
    content.price_minor_units = spec["price_minor_units"]
    content.currency = "USD"
    content.status = spec["status"]
    content.published_at = spec["published_at"]
    db.flush()
    return content


def _upsert_media(db: Session, content: ContentItem, spec: dict) -> MediaAsset:
    asset = db.scalar(
        select(MediaAsset).where(MediaAsset.storage_object_key == spec["object_key"])
    )
    if asset is None:
        asset = MediaAsset(storage_object_key=spec["object_key"])
        db.add(asset)
    asset.content_item_id = content.id
    asset.asset_type = spec["asset_type"]
    asset.mime_type = spec["mime_type"]
    asset.duration_seconds = spec.get("duration_seconds")
    asset.checksum_sha256 = spec.get("checksum_sha256")
    asset.is_protected = spec.get("is_protected", True)
    db.flush()
    return asset


def _upsert_transcript(db: Session, content: ContentItem, spec: dict) -> Transcript | None:
    transcript = db.scalar(
        select(Transcript).where(Transcript.content_item_id == content.id)
    )
    if spec is None:
        if transcript is not None:
            db.delete(transcript)
            db.flush()
        return None

    if transcript is None:
        transcript = Transcript(content_item_id=content.id)
        db.add(transcript)
    transcript.raw_text = spec.get("raw_text")
    transcript.summary = spec.get("summary")
    # Embeddings are not generated in CDP-001. The column stays NULL until a
    # real embedding pipeline exists.
    transcript.embedding = None
    db.flush()
    return transcript


def _seed_content_item(db: Session, creator: Creator, spec: dict) -> None:
    content = _upsert_content(db, creator, spec)

    duration = spec.get("duration_seconds")
    prefix = f"demo/placeholders/{content.slug}"

    _upsert_media(
        db,
        content,
        {
            "object_key": f"{prefix}/cover.jpg",
            "asset_type": MediaAssetType.COVER,
            "mime_type": "image/jpeg",
            "duration_seconds": None,
            "is_protected": False,
        },
    )

    if duration is not None:
        _upsert_media(
            db,
            content,
            {
                "object_key": f"{prefix}/preview.mp4",
                "asset_type": MediaAssetType.PREVIEW,
                "mime_type": "video/mp4",
                "duration_seconds": 30.0,
                "is_protected": False,
            },
        )
        _upsert_media(
            db,
            content,
            {
                "object_key": f"{prefix}/original.mp4",
                "asset_type": MediaAssetType.FULL,
                "mime_type": "video/mp4",
                "duration_seconds": duration,
                "is_protected": True,
            },
        )

    _upsert_transcript(db, content, spec.get("transcript"))


def seed(db: Session, creator_slug: str) -> dict:
    """Apply the demo data set. Safe to run repeatedly."""
    creator = _upsert_creator(
        db,
        creator_slug,
        display_name="Demo Creator",
        tagline="Placeholder storefront for the platform demonstration.",
    )

    scheduled = dict(_SCHEDULED)
    scheduled["published_at"] = datetime.now(timezone.utc) + timedelta(days=3)

    for spec in (*_PUBLISHED, _DRAFT, scheduled):
        _seed_content_item(db, creator, spec)

    db.commit()

    published = len(
        db.scalars(
            select(ContentItem).where(
                ContentItem.creator_id == creator.id,
                ContentItem.status == PublicationStatus.PUBLISHED,
            )
        ).all()
    )
    total = len(
        db.scalars(
            select(ContentItem).where(ContentItem.creator_id == creator.id)
        ).all()
    )
    return {
        "creator": creator.slug,
        "published": published,
        "total": total,
    }


def main() -> None:
    settings = get_settings()
    with SessionLocal() as db:
        result = seed(db, settings.demo_creator_slug)

    print("Demo seed complete.")
    print(f"  creator slug : {result['creator']}")
    print(f"  content items: {result['total']}")
    print("  All content is placeholder data. No real media was written.")


if __name__ == "__main__":
    main()
