from alembic import command
from alembic.config import Config
from sqlalchemy import select, text

from app.api.derivatives import NIGHT_BUS, matches_reviewed_file
from app.models.entities import ContentItem, MediaAsset, MediaAssetType, PublicationStatus
from app.seed_demo import seed
from tests.conftest import API_DIR, make_content, make_creator
from tests.test_draft_previews import CATALOG, HEADERS, PREVIEW, STUDIO, TOKEN, grant, selection


def test_withdrawal_stops_new_reads_and_retries(client, db, monkeypatch):
    monkeypatch.setenv("DRAFT_PREVIEW_TOKEN", TOKEN)
    owner = make_creator(db, "demo")
    source = grant(db, owner)
    item = make_content(db, owner, "cut", status=PublicationStatus.DRAFT)
    db.commit()
    studio = f"{STUDIO}/cut"
    public = f"{CATALOG}/cut/preview"
    assert client.put(studio, headers=HEADERS, json=selection()).status_code == 200
    assert client.get(studio).status_code == 404
    assert client.get(studio, headers=HEADERS).status_code == 200
    assert client.get(public + "/bytes").status_code == 404
    item.status = PublicationStatus.PUBLISHED
    db.commit()
    media = client.get(public + "/bytes", headers={"Range": "bytes=0-15"})
    assert media.status_code == 206
    assert len(media.content) == 16 and b"ftyp" in media.content
    assert "no-store" in media.headers["cache-control"]
    source.is_protected = True
    db.commit()
    for path in [public, public + "/bytes"]:
        assert client.get(path, headers={"Range": "bytes=0-15"}).status_code == 404
    assert client.get(f"{CATALOG}/cut").json()["media"] == []
    item.status = PublicationStatus.DRAFT
    db.commit()
    assert client.get(STUDIO, headers=HEADERS).json()["previews"] == []
    assert client.get(studio, headers=HEADERS).status_code == 404
    assert client.put(studio, headers=HEADERS, json=selection()).status_code == 422
    assert client.put(studio, headers=HEADERS, json=selection(None, PREVIEW)).status_code == 200


def test_other_creator_and_full_role_cannot_grant_access(client, db):
    owner = make_creator(db, "demo")
    other = make_creator(db, "other")
    grant(db, other)
    original = grant(db, owner)
    original.asset_type = MediaAssetType.FULL
    item = make_content(db, owner, "cut")
    item.approved_preview_id = PREVIEW
    db.commit()
    public = f"{CATALOG}/cut/preview"
    assert client.get(public).status_code == client.get(public + "/bytes").status_code == 404


def test_legacy_backfill_rollback_and_reseed_preserve_editor_choices(client, db, test_schema):
    config = Config(str(API_DIR / "alembic/alembic.ini"))
    seed(db, "demo")
    film, notes = "night-bus-short-film", "field-recording-notes"
    rows = {i.slug: i for i in db.scalars(select(ContentItem))}
    source = db.scalar(select(MediaAsset).where(MediaAsset.checksum_sha256 == NIGHT_BUS.digest))
    db.commit()
    # Reconstruct the two legacy null selections in an isolated 0002 database.
    command.downgrade(config, "0002_draft_preview")
    rows[film].approved_preview_id = rows[notes].approved_preview_id = None
    rows["untitled-workshop-draft"].approved_preview_id = "operator-selection"
    source.checksum_sha256 = None
    db.commit()
    command.upgrade(config, "head")
    db.expire_all()
    assert rows[film].approved_preview_id == rows[notes].approved_preview_id == PREVIEW
    assert client.get(f"{CATALOG}/{film}/preview/bytes").status_code == 200
    source.is_protected = True
    rows[notes].approved_preview_id = None
    db.commit()
    command.downgrade(config, "0002_draft_preview")
    assert db.scalar(text("SELECT to_regclass(:name)"), {"name": f"{test_schema}.ix_public_preview_digest"}) is None
    command.upgrade(config, "head")
    seed(db, "demo")
    db.expire_all()
    assert rows[notes].approved_preview_id is None
    assert rows["untitled-workshop-draft"].approved_preview_id == "operator-selection"
    assert source.is_protected
    assert client.get(f"{CATALOG}/{film}/preview/bytes").status_code == 404


def test_overlapping_edit_waits_and_returns_conflict(client, db, monkeypatch):
    import time
    from concurrent.futures import ThreadPoolExecutor

    monkeypatch.setenv("DRAFT_PREVIEW_TOKEN", TOKEN)
    owner = make_creator(db, "demo")
    grant(db, owner)
    item = make_content(db, owner, "cut", status=PublicationStatus.DRAFT)
    db.commit()
    engine = db.get_bind()
    with engine.connect() as winner, ThreadPoolExecutor(max_workers=1) as worker:
        pid = winner.scalar(text("SELECT pg_backend_pid()"))
        winner.execute(text("UPDATE content_items SET approved_preview_id=:id WHERE id=:item"),
                       {"id": PREVIEW, "item": item.id})
        pending = worker.submit(client.put, f"{STUDIO}/cut", headers=HEADERS, json=selection(None))
        try:
            with engine.connect() as observer:
                deadline = time.monotonic() + 5
                while not observer.scalar(text(
                    "SELECT EXISTS (SELECT FROM pg_stat_activity WHERE :pid = ANY(pg_blocking_pids(pid)))"
                ), {"pid": pid}):
                    observer.commit()
                    if time.monotonic() >= deadline:
                        raise AssertionError("Draft edit never waited for the competing transaction")
                    time.sleep(0.02)
        finally:
            winner.commit()
        assert pending.result(timeout=5).status_code == 409
    db.expire_all()
    assert item.approved_preview_id == PREVIEW


def test_missing_or_changed_image_file_fails_review(tmp_path):
    path = tmp_path / "copy.mp4"
    path.write_bytes(b"a different file")
    assert not matches_reviewed_file(path, NIGHT_BUS.digest)
    assert not matches_reviewed_file(tmp_path / "missing.mp4", NIGHT_BUS.digest)


def test_protected_promotional_roles_never_enter_either_projection(client, db):
    owner = make_creator(db, "demo")
    item = make_content(db, owner, "sealed")
    for role in (MediaAssetType.PREVIEW, MediaAssetType.TEASER, MediaAssetType.COVER):
        db.add(MediaAsset(content_item_id=item.id, asset_type=role, is_protected=True,
                          mime_type="video/mp4", storage_object_key=f"internal/{role.value}",
                          checksum_sha256=NIGHT_BUS.digest))
    item.approved_preview_id = PREVIEW
    db.commit()
    assert client.get(CATALOG).json()[0]["media"] == []
    assert client.get(CATALOG + "/sealed").json()["media"] == []
    assert client.get(CATALOG + "/sealed/preview/bytes").status_code == 404
