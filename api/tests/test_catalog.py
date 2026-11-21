"""Creator scoping and public visibility rules for the catalog API.

These are the two tenancy guarantees the platform rests on:

1. A request for creator A can never reach creator B's content.
2. Unpublished content never appears in a public response.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.entities import (
    MediaAsset,
    MediaAssetType,
    PublicationStatus,
    Transcript,
)
from tests.conftest import make_content, make_creator


def test_unknown_creator_returns_404(client) -> None:
    response = client.get("/api/creators/nobody")

    assert response.status_code == 404


def test_creator_profile_is_returned(client, db: Session) -> None:
    make_creator(db, "demo", display_name="Demo Creator")

    response = client.get("/api/creators/demo")

    assert response.status_code == 200
    payload = response.json()
    assert payload["slug"] == "demo"
    assert payload["display_name"] == "Demo Creator"


def test_catalog_returns_only_published_content(client, db: Session) -> None:
    creator = make_creator(db, "demo")
    make_content(db, creator, "published-one")
    make_content(db, creator, "published-two")
    make_content(db, creator, "draft-item", status=PublicationStatus.DRAFT)
    make_content(db, creator, "scheduled-item", status=PublicationStatus.SCHEDULED)
    make_content(db, creator, "archived-item", status=PublicationStatus.ARCHIVED)

    response = client.get("/api/creators/demo/catalog")

    assert response.status_code == 200
    slugs = {item["slug"] for item in response.json()}
    assert slugs == {"published-one", "published-two"}


def test_catalog_excludes_content_from_other_creators(client, db: Session) -> None:
    creator_a = make_creator(db, "creator-a")
    creator_b = make_creator(db, "creator-b")
    make_content(db, creator_a, "belongs-to-a")
    make_content(db, creator_b, "belongs-to-b")

    response = client.get("/api/creators/creator-a/catalog")

    assert response.status_code == 200
    slugs = {item["slug"] for item in response.json()}
    assert slugs == {"belongs-to-a"}
    assert "belongs-to-b" not in response.text


def test_detail_returns_published_content(client, db: Session) -> None:
    creator = make_creator(db, "demo")
    make_content(db, creator, "published-one", price_minor_units=1200)

    response = client.get("/api/creators/demo/catalog/published-one")

    assert response.status_code == 200
    payload = response.json()
    assert payload["slug"] == "published-one"
    assert payload["price_minor_units"] == 1200
    assert payload["currency"] == "USD"


def test_detail_returns_404_for_draft_content(client, db: Session) -> None:
    creator = make_creator(db, "demo")
    make_content(db, creator, "draft-item", status=PublicationStatus.DRAFT)

    response = client.get("/api/creators/demo/catalog/draft-item")

    assert response.status_code == 404


def test_detail_returns_404_for_scheduled_content(client, db: Session) -> None:
    creator = make_creator(db, "demo")
    make_content(db, creator, "scheduled-item", status=PublicationStatus.SCHEDULED)

    response = client.get("/api/creators/demo/catalog/scheduled-item")

    assert response.status_code == 404


def test_detail_cannot_reach_another_creators_content(client, db: Session) -> None:
    creator_a = make_creator(db, "creator-a")
    creator_b = make_creator(db, "creator-b")
    make_content(db, creator_b, "belongs-to-b")

    response = client.get("/api/creators/creator-a/catalog/belongs-to-b")

    assert response.status_code == 404


def test_detail_returns_404_for_unknown_content(client, db: Session) -> None:
    make_creator(db, "demo")

    response = client.get("/api/creators/demo/catalog/does-not-exist")

    assert response.status_code == 404


def test_public_payload_excludes_private_fields(client, db: Session) -> None:
    creator = make_creator(db, "demo")
    item = make_content(db, creator, "published-one")
    db.add(
        MediaAsset(
            content_item_id=item.id,
            asset_type=MediaAssetType.FULL,
            storage_object_key="demo/placeholders/published-one/original.mp4",
            mime_type="video/mp4",
            duration_seconds=1200,
            is_protected=True,
        )
    )
    db.add(
        MediaAsset(
            content_item_id=item.id,
            asset_type=MediaAssetType.PREVIEW,
            storage_object_key="demo/placeholders/published-one/preview.mp4",
            mime_type="video/mp4",
            duration_seconds=30,
            is_protected=False,
        )
    )
    db.add(
        Transcript(
            content_item_id=item.id,
            raw_text="Private transcript body.",
            summary="Private summary.",
        )
    )
    db.commit()

    response = client.get("/api/creators/demo/catalog/published-one")

    assert response.status_code == 200
    body = response.text
    assert "storage_object_key" not in body
    assert "original.mp4" not in body
    assert "Private transcript body." not in body
    assert "Private summary." not in body
    assert "is_protected" not in body
    assert "embedding" not in body

    payload = response.json()
    # Only non-original asset roles are described publicly.
    assert {m["asset_type"] for m in payload["media"]} == {"preview"}
    assert payload["duration_seconds"] == 30.0


def test_catalog_ordering_is_newest_first(client, db: Session) -> None:
    creator = make_creator(db, "demo")
    older = make_content(db, creator, "older")
    newer = make_content(db, creator, "newer")
    older.published_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    newer.published_at = datetime(2026, 5, 1, tzinfo=timezone.utc)
    db.commit()

    response = client.get("/api/creators/demo/catalog")

    slugs = [item["slug"] for item in response.json()]
    assert slugs == ["newer", "older"]
