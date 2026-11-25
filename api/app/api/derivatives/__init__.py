"""Reviewed playable derivatives. Request data never selects a file on disk."""

from dataclasses import dataclass
from functools import cache
from hashlib import file_digest
from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import ContentItem, Creator, MediaAsset, MediaAssetType


@dataclass(frozen=True)
class Derivative:
    id: str
    title: str
    filename: str
    seconds: int
    digest: str

    def choice(self) -> dict:
        return {"id": self.id, "title": self.title}

    def stream(self) -> FileResponse:
        path = Path(__file__).parent / self.filename
        if not matches_reviewed_file(path, self.digest):
            raise HTTPException(503, "Reviewed file unavailable", headers={"Cache-Control": "no-store"})
        return FileResponse(path, media_type="video/mp4", headers={"Cache-Control": "private, no-store"})


@cache
def matches_reviewed_file(path: Path, digest: str) -> bool:
    # Image contents are immutable for the lifetime of the API process.
    try:
        with path.open("rb") as stream:
            return file_digest(stream, "sha256").hexdigest() == digest
    except OSError:
        return False


NIGHT_BUS = Derivative(
    "night-bus-teaser", "Night Bus · 18-second teaser", "night-bus-teaser.mp4", 18,
    "94e44e7661af0180c654859fe8bebd8caf09865c12c241e354047f33f4dec7a1",
)
REVIEWED = (NIGHT_BUS,)


def approved_for(db: Session, creator_slug: str) -> dict[str, Derivative]:
    digests = set(db.scalars(
        select(MediaAsset.checksum_sha256)
        .join(ContentItem).join(Creator)
        .where(Creator.slug == creator_slug, MediaAsset.is_protected.is_(False),
               MediaAsset.asset_type == MediaAssetType.PREVIEW, MediaAsset.mime_type == "video/mp4",
               MediaAsset.checksum_sha256.in_([sample.digest for sample in REVIEWED]))
    ))
    return {sample.id: sample for sample in REVIEWED if sample.digest in digests}


def require_selection(db: Session, creator_slug: str, item: ContentItem | None) -> Derivative:
    sample = approved_for(db, creator_slug).get(item.approved_preview_id) if item else None
    if sample is None:
        raise HTTPException(404, "Preview unavailable", headers={"Cache-Control": "no-store"})
    return sample
