"""Register the original pilot's public teaser and materialize its legacy selections."""

from alembic import op
import sqlalchemy as sa


revision = "0003_reviewed_derivatives"
down_revision = "0002_draft_preview"
branch_labels = None
depends_on = None

# Frozen migration values, independent of future seed and registry changes.
DIGEST = "94e44e7661af0180c654859fe8bebd8caf09865c12c241e354047f33f4dec7a1"


def upgrade() -> None:
    op.create_index("ix_public_preview_digest", "media_assets", ["checksum_sha256", "content_item_id"],
                    postgresql_where=sa.text("NOT is_protected AND asset_type = 'preview'"))
    # Only adopt the precise public placeholder used by the old pilot. The
    # digest also marks completed adoption across a downgrade/upgrade cycle.
    op.get_bind().execute(sa.text("""
        WITH adopted AS (
            UPDATE media_assets a SET checksum_sha256 = :digest
            FROM content_items film JOIN creators c ON c.id = film.creator_id
            WHERE c.slug = 'demo' AND film.slug = 'night-bus-short-film'
              AND a.content_item_id = film.id AND a.checksum_sha256 IS NULL
              AND a.storage_object_key = 'demo/placeholders/night-bus-short-film/preview.mp4'
              AND a.asset_type = 'preview' AND a.mime_type = 'video/mp4' AND NOT a.is_protected
            RETURNING film.creator_id
        )
        UPDATE content_items i SET approved_preview_id = 'night-bus-teaser'
        WHERE i.creator_id IN (SELECT creator_id FROM adopted)
          AND i.slug IN ('night-bus-short-film', 'field-recording-notes')
          AND i.status = 'published' AND i.approved_preview_id IS NULL
          AND EXISTS (SELECT 1 FROM media_assets a WHERE a.content_item_id = i.id
                      AND a.asset_type = 'preview' AND NOT a.is_protected)
    """), {"digest": DIGEST})


def downgrade() -> None:
    # Both data fields already existed in 0002. Preserve selections, protection
    # changes and checksums, including edits made since the upgrade.
    op.drop_index("ix_public_preview_digest", table_name="media_assets")
