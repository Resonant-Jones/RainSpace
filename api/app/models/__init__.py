"""Model package.

Importing this module registers every table on `Base.metadata`, which is what
Alembic's autogenerate and the migration environment rely on.
"""

from app.db.base import Base
from app.models.entities import (
    ContentItem,
    Creator,
    MediaAsset,
    MediaAssetType,
    PublicationStatus,
    Transcript,
)

__all__ = [
    "Base",
    "ContentItem",
    "Creator",
    "MediaAsset",
    "MediaAssetType",
    "PublicationStatus",
    "Transcript",
]
