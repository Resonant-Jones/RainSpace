"""Repeatable demo seed.

Run with:

    python -m app.seed_demo

Rainspace Editions is a fictional film and sound imprint. Its public teaser
combines original generated artwork with a synthesized score. Private media
keys are illustrative. No customer or transaction data is created.

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
    "primary": "#20221f",
    "accent": "#efab79",
    "background": "#111310",
    "surface": "#1b1d1a",
    "text": "#f5f1e7",
    "muted": "#b6b7aa",
}

# Fixed past timestamps keep the seeded catalog deterministic between runs.
_PUBLISHED = [
    {
        "slug": "field-recording-notes",
        "title": "Field Recording Notes",
        "description": (
            "Listen to the sound bed from Night Bus on its own. Follow the low motor tone "
            "beneath the rain, then listen for the two-note stop bell as the street falls "
            "quiet."
        ),
        "price_minor_units": 0,
        "status": PublicationStatus.PUBLISHED,
        "published_at": datetime(2026, 1, 14, 17, 0, tzinfo=timezone.utc),
        "duration_seconds": 812.0,
        "preview_seconds": 18.0,
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
            "Build a cue for a night scene in three lessons. Start with a two-note motif, "
            "shape a soft attack, then leave space in the arrangement for the sound of the "
            "street.\n\n"
            "Try the opening exercise. Hold a low D for four beats. On the next bar, "
            "play A only on beat three. Repeat once with a slower attack and listen "
            "to how the same two notes move from the foreground into the room."
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
            "The last bus waits under sodium lights. A study of rain on asphalt, the glow of "
            "an empty cabin and the small sounds that carry a city through the night."
        ),
        "price_minor_units": 1400,
        "status": PublicationStatus.PUBLISHED,
        "published_at": datetime(2026, 3, 22, 20, 15, tzinfo=timezone.utc),
        "duration_seconds": 1563.0,
        "preview_seconds": 18.0,
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
    "preview_seconds": 30.0,
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
    prefix = f"{creator.slug}/placeholders/{content.slug}"

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
                "object_key": f"{prefix}/original.mp4",
                "asset_type": MediaAssetType.FULL,
                "mime_type": "video/mp4",
                "duration_seconds": duration,
                "is_protected": True,
            },
        )

    # The film and its listening notes share one public teaser. Retire only
    # the old seed's synthetic preview row on editions without a sample.
    preview_key = f"{prefix}/preview.mp4"
    if spec.get("preview_seconds") is not None:
        _upsert_media(
            db,
            content,
            {
                "object_key": preview_key,
                "asset_type": MediaAssetType.PREVIEW,
                "mime_type": "video/mp4",
                "duration_seconds": spec["preview_seconds"],
                "is_protected": False,
            },
        )
    elif spec["slug"] == "keyboard-mechanics":
        previous = db.scalar(
            select(MediaAsset).where(
                MediaAsset.content_item_id == content.id,
                MediaAsset.storage_object_key == preview_key,
                MediaAsset.asset_type == MediaAssetType.PREVIEW,
                MediaAsset.is_protected.is_(False),
            )
        )
        if previous is not None:
            db.delete(previous)

    _upsert_transcript(db, content, spec.get("transcript"))


def seed(db: Session, creator_slug: str) -> dict:
    """Apply the demo data set. Safe to run repeatedly."""
    creator = _upsert_creator(
        db,
        creator_slug,
        display_name="Rainspace Editions",
        tagline="Independent films, sound studies and lessons from the scoring room.",
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
    print("  Installed the demonstration catalogue. Public previews ship with the storefront.")


if __name__ == "__main__":
    main()
