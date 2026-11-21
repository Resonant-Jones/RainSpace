"""FastAPI application entrypoint.

CDP-001 exposes public, read-only creator-scoped catalog endpoints only.
Authentication, payments, media processing and fan accounts are deliberately
absent - see docs/architecture/adr/0001-platform-foundation.md.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api import catalog, health
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Creator Distribution Platform API",
    version=__version__,
    description=(
        "Creator-scoped catalog API for the Creator Distribution Platform "
        "foundation. Public read endpoints only."
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
