"""Narrow local studio capability for selecting an reviewed derivative."""

import os
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.derivatives import approved_for, require_selection
from app.config import get_settings
from app.db.base import get_db
from app.models.entities import ContentItem, Creator, PublicationStatus


def require_studio(creator_slug: str, authorization: Annotated[str | None, Header()] = None):
    token = os.getenv("DRAFT_PREVIEW_TOKEN", "")
    if (
        get_settings().app_env != "development"
        or creator_slug != get_settings().demo_creator_slug
        or len(token) < 32
        or not secrets.compare_digest((authorization or "").encode(), f"Bearer {token}".encode())
    ):
        raise HTTPException(404, "Studio unavailable")


router = APIRouter(
    prefix="/api/creators/{creator_slug}/studio/draft-previews",
    tags=["local studio"],
    dependencies=[Depends(require_studio)],
)


class Attachment(BaseModel):
    model_config = ConfigDict(extra="forbid")
    preview_id: str | None = Field(max_length=80)
    expected_preview_id: str | None = Field(max_length=80)


def _drafts(creator_slug: str):
    return (
        select(ContentItem)
        .join(Creator)
        .where(Creator.slug == creator_slug, ContentItem.status == PublicationStatus.DRAFT)
    )


def _draft_view(draft: ContentItem) -> dict:
    return {"slug": draft.slug, "title": draft.title, "preview_id": draft.approved_preview_id}


@router.get("")
def list_drafts(creator_slug: str, response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    drafts = db.scalars(_drafts(creator_slug).order_by(ContentItem.title, ContentItem.slug))
    return {
        "drafts": [_draft_view(d) for d in drafts],
        "previews": [preview.choice() for preview in approved_for(db, creator_slug).values()],
    }


@router.get("/{draft_slug}")
def read_draft_sample(creator_slug: str, draft_slug: str, db: Session = Depends(get_db)):
    draft = db.scalar(_drafts(creator_slug).where(ContentItem.slug == draft_slug))
    return require_selection(db, creator_slug, draft).stream()


@router.put("/{draft_slug}")
def attach_preview(
    creator_slug: str,
    draft_slug: str,
    body: Attachment,
    response: Response,
    db: Session = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    draft = db.scalar(_drafts(creator_slug).where(ContentItem.slug == draft_slug).with_for_update(of=ContentItem))
    if draft is None:
        raise HTTPException(404, "Draft unavailable")
    if body.preview_id is not None and body.preview_id not in approved_for(db, creator_slug):
        raise HTTPException(422, "Choose an approved public preview")
    if draft.approved_preview_id != body.preview_id:
        if draft.approved_preview_id != body.expected_preview_id:
            raise HTTPException(409, "The attachment changed. Reload the draft before saving.")
        draft.approved_preview_id = body.preview_id
    result = _draft_view(draft)
    db.commit()
    return result
