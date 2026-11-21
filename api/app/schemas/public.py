"""Public API schemas.

These are the *only* shapes returned to an unauthenticated browser. They
deliberately exclude:

* media storage object keys (they address private objects),
* the `is_protected` flag and original/full asset rows,
* transcript raw text, summaries and embeddings,
* any creator record that is not part of the public storefront profile.

The frontend renders placeholder artwork locally, so it never needs a media
key to show a card.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ThemePublic(BaseModel):
    """Replaceable storefront theme. Unknown keys are ignored."""

    model_config = ConfigDict(extra="ignore")

    primary: str = "#111827"
    accent: str = "#7c5cff"
    background: str = "#0b0b0f"
    surface: str = "#17171f"
    text: str = "#f4f4f6"
    muted: str = "#9b9bab"


class CreatorPublic(BaseModel):
    """Public storefront profile for one creator."""

    model_config = ConfigDict(from_attributes=True)

    slug: str
    display_name: str
    tagline: str | None = None
    theme: ThemePublic
    created_at: datetime


class MediaAssetPublic(BaseModel):
    """Non-sensitive media metadata for previews and cover art."""

    model_config = ConfigDict(from_attributes=True)

    asset_type: str
    mime_type: str
    duration_seconds: float | None = None


class ContentSummaryPublic(BaseModel):
    """A catalog card payload."""

    model_config = ConfigDict(from_attributes=True)

    slug: str
    title: str
    description: str | None = None
    price_minor_units: int
    currency: str
    published_at: datetime | None = None
    duration_seconds: float | None = None
    media: list[MediaAssetPublic] = Field(default_factory=list)


class ContentDetailPublic(ContentSummaryPublic):
    """A content detail payload. Same exposure rules as the summary."""

    model_config = ConfigDict(from_attributes=True)
