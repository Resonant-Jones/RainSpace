"""Persistence and scope of the local draft attachment capability."""

from hashlib import sha256
from secrets import token_hex

from sqlalchemy import select

from app.api.derivatives import NIGHT_BUS

from app.models.entities import ContentItem, MediaAsset, MediaAssetType, PublicationStatus
from tests.conftest import make_content, make_creator

STUDIO = "/api/creators/demo/studio/draft-previews"
CATALOG = "/api/creators/demo/catalog"
PREVIEW = "night-bus-teaser"
TOKEN = token_hex(32)
HEADERS = {"Authorization": f"Bearer {TOKEN}"}


def grant(db, owner):
    source = make_content(db, owner, "reviewed-source", status=PublicationStatus.ARCHIVED)
    asset = MediaAsset(content_item_id=source.id, asset_type=MediaAssetType.PREVIEW,
                       storage_object_key=f"{owner.slug}/internal/approved", mime_type="video/mp4",
                       checksum_sha256=NIGHT_BUS.digest, is_protected=False)
    db.add(asset)
    db.flush()
    return asset


def selection(preview_id=PREVIEW, previous=None):
    return {"preview_id": preview_id, "expected_preview_id": previous}


def test_save_refresh_retry_remove_and_visibility(client, db, monkeypatch):
    monkeypatch.setenv("DRAFT_PREVIEW_TOKEN", TOKEN)
    owner = make_creator(db, "demo")
    grant(db, owner)
    item = make_content(db, owner, "workshop", status=PublicationStatus.DRAFT)
    db.commit()
    url = f"{STUDIO}/workshop"
    assert client.get(STUDIO, headers=HEADERS).json()["drafts"][0]["preview_id"] is None
    for _ in range(2):
        assert client.put(url, headers=HEADERS, json=selection()).json()["preview_id"] == PREVIEW
    db.expire_all()
    assert db.scalar(select(ContentItem.approved_preview_id).where(ContentItem.id == item.id)) == PREVIEW
    response = client.get(STUDIO, headers=HEADERS)
    assert response.headers["cache-control"] == "no-store"
    assert response.json()["drafts"][0]["preview_id"] == PREVIEW
    assert client.get(CATALOG).json() == []
    assert client.get(f"{CATALOG}/workshop/preview").status_code == 404
    assert client.put(url, headers=HEADERS, json=selection(None)).status_code == 409
    assert client.put(url, headers=HEADERS, json=selection(None, PREVIEW)).json()["preview_id"] is None
    assert client.get(STUDIO, headers=HEADERS).json()["drafts"][0]["preview_id"] is None


def test_studio_capability_and_draft_scope(client, db, monkeypatch):
    owner = make_creator(db, "demo")
    grant(db, owner)
    other = make_creator(db, "other")
    own = make_content(db, owner, "shared", status=PublicationStatus.DRAFT)
    theirs = make_content(db, other, "shared", status=PublicationStatus.DRAFT)
    for state in [PublicationStatus.PUBLISHED, PublicationStatus.SCHEDULED, PublicationStatus.ARCHIVED]:
        make_content(db, owner, state.value, status=state)
    db.commit()
    monkeypatch.delenv("DRAFT_PREVIEW_TOKEN", raising=False)
    assert client.get(STUDIO, headers=HEADERS).status_code == 404
    monkeypatch.setenv("DRAFT_PREVIEW_TOKEN", TOKEN)
    assert client.get(STUDIO).status_code == 404
    assert client.put(f"{STUDIO}/shared", json=selection()).status_code == 404
    assert client.get(STUDIO.replace("/demo/", "/other/"), headers=HEADERS).status_code == 404
    assert client.put(STUDIO.replace("/demo/", "/other/") + "/shared", headers=HEADERS, json=selection()).status_code == 404
    assert [d["slug"] for d in client.get(STUDIO, headers=HEADERS).json()["drafts"]] == ["shared"]
    for slug in ["published", "scheduled", "archived", "unknown"]:
        assert client.put(f"{STUDIO}/{slug}", headers=HEADERS, json=selection()).status_code == 404
    for invalid in ["/private/original.mp4", "unapproved", "https://example.invalid/movie.mp4"]:
        assert client.put(f"{STUDIO}/shared", headers=HEADERS, json=selection(invalid)).status_code == 422
    assert client.put(f"{STUDIO}/shared", headers=HEADERS, json=selection()).status_code == 200
    db.expire_all()
    assert own.approved_preview_id == PREVIEW
    assert theirs.approved_preview_id is None


def test_approved_preview_follows_release_if_later_published(client, db, monkeypatch):
    monkeypatch.setenv("DRAFT_PREVIEW_TOKEN", TOKEN)
    owner = make_creator(db, "demo")
    grant(db, owner)
    item = make_content(db, owner, "another-film", status=PublicationStatus.DRAFT)
    db.commit()
    client.put(f"{STUDIO}/another-film", headers=HEADERS, json=selection()).raise_for_status()
    # Model a future publication only inside the disposable test schema.
    item.status = PublicationStatus.PUBLISHED
    db.commit()
    assert client.get(f"{CATALOG}/another-film").json()["media"] == [
        {"asset_type": "preview", "mime_type": "video/mp4", "duration_seconds": 18.0}
    ]
    res = client.get(f"{CATALOG}/another-film/preview")
    assert res.status_code == 200
    assert res.json()["path"] == f"{CATALOG}/another-film/preview/bytes"
    media = client.get(res.json()["path"])
    assert media.status_code == 200
    assert media.headers["content-type"] == "video/mp4"
    assert sha256(media.content).hexdigest() == NIGHT_BUS.digest
    assert client.get(STUDIO, headers=HEADERS).json()["drafts"] == []
