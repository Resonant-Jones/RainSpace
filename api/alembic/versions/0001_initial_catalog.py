"""initial catalog foundation

Creates the minimal creator-scoped catalogue schema: creators, content items,
media assets and transcripts.

Revision ID: 0001_initial_catalog
Revises:
Create Date: 2026-11-21
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial_catalog"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Mirrors app.db.constants.EMBEDDING_DIMENSION.
EMBEDDING_DIMENSION = 512


def upgrade() -> None:
    # The vector type must exist before any table that uses it is created.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "creators",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.Column("display_name", sa.String(length=200), nullable=False),
        sa.Column("tagline", sa.String(length=300), nullable=True),
        sa.Column("theme", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_creators_slug", "creators", ["slug"], unique=True)

    op.create_table(
        "content_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("creator_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price_minor_units", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column(
            "status",
            sa.Enum(
                "draft",
                "scheduled",
                "published",
                "archived",
                name="publication_status",
            ),
            nullable=False,
            server_default="draft",
        ),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["creator_id"], ["creators.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "creator_id", "slug", name="uq_content_items_creator_slug"
        ),
    )
    op.create_index("ix_content_items_creator_id", "content_items", ["creator_id"])
    op.create_index("ix_content_items_status", "content_items", ["status"])
    op.create_index(
        "ix_content_items_creator_status", "content_items", ["creator_id", "status"]
    )

    op.create_table(
        "media_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "asset_type",
            sa.Enum(
                "preview",
                "teaser",
                "cover",
                "full",
                name="media_asset_type",
            ),
            nullable=False,
        ),
        sa.Column("storage_object_key", sa.String(length=512), nullable=False),
        sa.Column("mime_type", sa.String(length=120), nullable=False),
        sa.Column("duration_seconds", sa.Numeric(precision=10, scale=3), nullable=True),
        sa.Column("checksum_sha256", sa.String(length=64), nullable=True),
        sa.Column(
            "is_protected", sa.Boolean(), nullable=False, server_default=sa.true()
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["content_item_id"], ["content_items.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_media_assets_content_item_id", "media_assets", ["content_item_id"])
    op.create_index(
        "ix_media_assets_storage_object_key",
        "media_assets",
        ["storage_object_key"],
        unique=True,
    )

    op.create_table(
        "transcripts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content_item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("embedding", Vector(EMBEDDING_DIMENSION), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["content_item_id"], ["content_items.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transcripts_content_item_id", "transcripts", ["content_item_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_transcripts_content_item_id", table_name="transcripts")
    op.drop_table("transcripts")

    op.drop_index("ix_media_assets_storage_object_key", table_name="media_assets")
    op.drop_index("ix_media_assets_content_item_id", table_name="media_assets")
    op.drop_table("media_assets")

    op.drop_index("ix_content_items_creator_status", table_name="content_items")
    op.drop_index("ix_content_items_status", table_name="content_items")
    op.drop_index("ix_content_items_creator_id", table_name="content_items")
    op.drop_table("content_items")

    op.drop_index("ix_creators_slug", table_name="creators")
    op.drop_table("creators")

    op.execute("DROP TYPE IF EXISTS publication_status")
    op.execute("DROP TYPE IF EXISTS media_asset_type")
