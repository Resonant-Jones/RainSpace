"""FastAPI application entrypoint.

Public catalogue reads and a separately gated local studio attachment editor.
Authentication, payments, media processing and fan accounts are deliberately
absent - see docs/architecture/adr/0001-platform-foundation.md.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import catalog, draft_previews, health
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Creator Distribution Platform API",
    version=__version__,
    description=(
        "Creator-scoped catalog API for the Creator Distribution Platform "
        "foundation and its local draft preview editor."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(catalog.router)

app.include_router(draft_previews.router)
