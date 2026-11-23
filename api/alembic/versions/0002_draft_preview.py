"""Store an optional, creator-owned public preview selection on a release."""

from alembic import op
import sqlalchemy as sa

revision = "0002_draft_preview"
down_revision = "0001_initial_catalog"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("content_items", sa.Column("approved_preview_id", sa.String(80), nullable=True))


def downgrade() -> None:
    op.drop_column("content_items", "approved_preview_id")
