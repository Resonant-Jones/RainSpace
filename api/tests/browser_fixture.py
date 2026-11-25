"""Out-of-band operator for one disposable browser-test schema. No HTTP routes."""

import os
import re
import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import select, text

schema = os.environ["ALEMBIC_TARGET_SCHEMA"]
if not re.fullmatch(r"cdp_browser_[0-9a-f]{32}", schema):
    raise ValueError("Expected a generated browser test schema")
os.environ["PGOPTIONS"] = f"-csearch_path={schema},public"

from app.db.base import SessionLocal
from app.models.entities import ContentItem, Creator, MediaAsset, PublicationStatus
from app.seed_demo import NIGHT_BUS, seed

action = sys.argv[1]
with SessionLocal() as db:
    if action == "init":
        db.execute(text(f'CREATE SCHEMA "{schema}"'))
        db.commit()
        try:
            command.upgrade(Config(os.environ["ALEMBIC_CONFIG"]), "head")
            assert db.scalar(text("SELECT current_schema()")) == schema
            seed(db, "demo")
        except Exception:
            db.rollback()
            db.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
            db.commit()
            raise
    elif action == "drop":
        db.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        db.commit()
    else:
        assert db.scalar(text("SELECT current_schema()")) == schema
        item = db.scalars(select(ContentItem).join(Creator).where(
            Creator.slug == "demo", ContentItem.slug == "untitled-workshop-draft")).one()
        if action in ("published", "draft"):
            item.status = PublicationStatus(action)
            db.commit()
        elif action in ("withdraw", "restore"):
            source = db.scalars(select(MediaAsset).join(ContentItem).join(Creator).where(
                Creator.slug == "demo", MediaAsset.checksum_sha256 == NIGHT_BUS.digest)).one()
            source.is_protected = action == "withdraw"
            db.commit()
        elif action != "read":
            raise ValueError("Unknown fixture operation")
        print(f"{item.status.value}|{item.approved_preview_id or 'none'}")
