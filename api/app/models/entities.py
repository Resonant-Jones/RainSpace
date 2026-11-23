"""Catalog data model.

Every persisted content item belongs to exactly one creator. The creator
foreign key is the tenancy boundary: public queries must always constrain on
`creator_id` rather than trusting a slug supplied by the caller.

Media object keys and transcript text are deliberately *not* part of the
public projection - see `app.schemas.public`.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.constants import EMBEDDING_DIMENSION

if TYPE_CHECKING:  # pragma: no cover - typing only
    pass


class PublicationStatus(str, enum.Enum):
    """Editorial state of a content item."""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class MediaAssetType(str, enum.Enum):
    """Role of a media asset attached to a content item."""

    PREVIEW = "preview"
    TEASER = "teaser"
    COVER = "cover"
    FULL = "full"


def _enum_column(enum_cls: type[enum.Enum], name: str) -> SAEnum:
    """Store enum *values* (not member names) and reuse one PG type per enum."""
    return SAEnum(
        enum_cls,
        name=name,
        values_callable=lambda members: [member.value for member in members],
    )


class Creator(Base):
    """A storefront owner. One creator owns many content items."""

    __tablename__ = "creators"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    slug: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    theme: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    content_items: Mapped[list["ContentItem"]] = relationship(
        back_populates="creator", cascade="all, delete-orphan"
    )


class ContentItem(Base):
    """A piece of published (or draft) creator content."""

    __tablename__ = "content_items"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("creators.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slug: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_preview_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    price_minor_units: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    status: Mapped[PublicationStatus] = mapped_column(
        _enum_column(PublicationStatus, "publication_status"),
        nullable=False,
        default=PublicationStatus.DRAFT,
        index=True,
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    creator: Mapped["Creator"] = relationship(back_populates="content_items")
    media_assets: Mapped[list["MediaAsset"]] = relationship(
        back_populates="content_item", cascade="all, delete-orphan"
    )
    transcript: Mapped["Transcript | None"] = relationship(
        back_populates="content_item", cascade="all, delete-orphan", uselist=False
    )

    __table_args__ = (
        UniqueConstraint("creator_id", "slug", name="uq_content_items_creator_slug"),
        Index("ix_content_items_creator_status", "creator_id", "status"),
    )


class MediaAsset(Base):
    """A stored media object belonging to a content item.

    `storage_object_key` points at private object storage. It is never
    returned by a public endpoint. `is_protected` marks originals that must
    only ever be served through an authorised, signed path.
    """

    __tablename__ = "media_assets"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_item_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_type: Mapped[MediaAssetType] = mapped_column(
        _enum_column(MediaAssetType, "media_asset_type"), nullable=False
    )
    storage_object_key: Mapped[str] = mapped_column(
        String(512), nullable=False, unique=True, index=True
    )
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    duration_seconds: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    checksum_sha256: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_protected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    content_item: Mapped["ContentItem"] = relationship(back_populates="media_assets")


class Transcript(Base):
    """Transcript, summary and (optional) vector embedding for a content item.

    The embedding column is nullable and is never populated in CDP-001: no
    transcription or embedding generation is implemented yet. It exists so the
    storage contract is fixed before the pipeline exists.
    """

    __tablename__ = "transcripts"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_item_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(EMBEDDING_DIMENSION), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    content_item: Mapped["ContentItem"] = relationship(back_populates="transcript")
