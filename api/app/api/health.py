"""Health endpoint.

Reports service liveness and database reachability. The service itself is
"up" even when the database is unreachable, so orchestrators can distinguish
the two failures.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app import __version__
from app.config import get_settings
from app.db.base import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict:
    settings = get_settings()
    database = "ok"
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        database = "unavailable"

    return {
        "status": "ok",
        "service": "creator-distribution-platform-api",
        "version": __version__,
        "environment": settings.app_env,
        "database": database,
    }
