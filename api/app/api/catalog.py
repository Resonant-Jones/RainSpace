"""Creator-scoped public catalog API.

Tenancy rule for this module: a request names a creator slug, that slug is
resolved to a creator id, and every subsequent query is constrained by
`creator_id`. The caller's slug never selects rows directly, so a content
slug from another creator cannot be reached through this API.

Visibility rule: only `published` content appears in public responses.
Unpublished content returns 404 - the same response as unknown content - so
the existence of drafts is not disclosed.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.draft_previews import APPROVED
from app.db.base import get_db
from app.models.entities import (
    ContentItem,
    Creator,
    MediaAsset,
    MediaAssetType,
    PublicationStatus,
)
from app.schemas.public import (
    ContentDetailPublic,
    ContentSummaryPublic,
    CreatorPublic,
    MediaAssetPublic,
)

router = APIRouter(prefix="/api/creators", tags=["catalog"])

#: Asset roles that may be described publicly. `full` is deliberately absent:
#: originals are protected and are addressed by storage key, never by metadata.
PUBLIC_ASSET_TYPES = (
    MediaAssetType.PREVIEW,
    MediaAssetType.TEASER,
    MediaAssetType.COVER,
)


def _get_creator_or_404(db: Session, creator_slug: str) -> Creator:
    creator = db.scalar(select(Creator).where(Creator.slug == creator_slug))
    if creator is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="creator not found"
        )
    return creator


def _public_media(content: ContentItem, creator_slug: str) -> list[MediaAssetPublic]:
    approved = APPROVED.get(creator_slug, {}).get(content.approved_preview_id)
    assets = [
        asset for asset in content.media_assets
        if not asset.is_protected and asset.asset_type in PUBLIC_ASSET_TYPES
        and not (approved and asset.asset_type == MediaAssetType.PREVIEW)
    ]
    media = [
        MediaAssetPublic(
            asset_type=asset.asset_type.value,
            mime_type=asset.mime_type,
            duration_seconds=(
                float(asset.duration_seconds)
                if asset.duration_seconds is not None
                else None
            ),
        )
        for asset in assets
    ]
    if approved:
        media.append(MediaAssetPublic(asset_type="preview", mime_type="video/mp4", duration_seconds=approved.seconds))
    return media


def _to_summary(content: ContentItem, creator_slug: str) -> ContentSummaryPublic:
    media = _public_media(content, creator_slug)
    durations = [m.duration_seconds for m in media if m.duration_seconds is not None]
    return ContentSummaryPublic(
        slug=content.slug,
        title=content.title,
        description=content.description,
        price_minor_units=content.price_minor_units,
        currency=content.currency,
        published_at=content.published_at,
        duration_seconds=max(durations) if durations else None,
        media=media,
    )


@router.get("/{creator_slug}", response_model=CreatorPublic)
def get_creator(creator_slug: str, db: Session = Depends(get_db)) -> CreatorPublic:
    creator = _get_creator_or_404(db, creator_slug)
    return CreatorPublic(
        slug=creator.slug,
        display_name=creator.display_name,
        tagline=creator.tagline,
        theme=creator.theme,
        created_at=creator.created_at,
    )


@router.get("/{creator_slug}/catalog", response_model=list[ContentSummaryPublic])
def get_catalog(creator_slug: str, db: Session = Depends(get_db)) -> list[ContentSummaryPublic]:
    creator = _get_creator_or_404(db, creator_slug)

    stmt = (
        select(ContentItem)
        .where(
            ContentItem.creator_id == creator.id,
            ContentItem.status == PublicationStatus.PUBLISHED,
        )
        .options(selectinload(ContentItem.media_assets))
        .order_by(ContentItem.published_at.desc().nullslast(), ContentItem.created_at.desc())
    )
    return [_to_summary(content, creator_slug) for content in db.scalars(stmt)]


@router.get(
    "/{creator_slug}/catalog/{content_slug}",
    response_model=ContentDetailPublic,
)
def get_content(
    creator_slug: str,
    content_slug: str,
    db: Session = Depends(get_db),
) -> ContentDetailPublic:
    creator = _get_creator_or_404(db, creator_slug)

    stmt = (
        select(ContentItem)
        .where(
            ContentItem.creator_id == creator.id,
            ContentItem.slug == content_slug,
            ContentItem.status == PublicationStatus.PUBLISHED,
        )
        .options(selectinload(ContentItem.media_assets))
    )
    content = db.scalar(stmt)
    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="content not found"
        )

    summary = _to_summary(content, creator_slug)
    return ContentDetailPublic(**summary.model_dump())


@router.get("/{creator_slug}/catalog/{content_slug}/preview")
def get_public_preview(creator_slug: str, content_slug: str, db: Session = Depends(get_db)):
    item = db.scalar(
        select(ContentItem).join(Creator).where(
            Creator.slug == creator_slug,
            ContentItem.slug == content_slug,
            ContentItem.status == PublicationStatus.PUBLISHED,
        )
    )
    approved = APPROVED.get(creator_slug, {}).get(item.approved_preview_id) if item else None
    # The original seeded releases predate the attachment column.
    if item and item.approved_preview_id is None and item.slug in {"night-bus-short-film", "field-recording-notes"}:
        has_public_sample = any(
            asset.asset_type == MediaAssetType.PREVIEW and not asset.is_protected
            for asset in item.media_assets
        )
        if has_public_sample:
            approved = APPROVED.get(creator_slug, {}).get("night-bus-teaser")
    if not approved:
        raise HTTPException(404, "Preview unavailable")
    return approved.choice()
