from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.models.base import Base
# Import all models to ensure they register on Base.metadata
import app.models # noqa: F401

engine_args = {
    "pool_pre_ping": True,
    "pool_recycle": 180,
}

if settings.DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20
    connect_args = engine_args.setdefault("connect_args", {})
    if "pg8000" in settings.DATABASE_URL:
        import ssl
        connect_args["ssl_context"] = ssl.create_default_context()
    else:
        connect_args["connect_timeout"] = 15
        connect_args["keepalives"] = 1
        connect_args["keepalives_idle"] = 30
        connect_args["keepalives_interval"] = 10
        connect_args["keepalives_count"] = 5

engine = create_engine(settings.DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_tables():
    """Create all tables if they do not exist and ensure schema updates."""
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE attachments ADD COLUMN IF NOT EXISTS file_data BYTEA;"))
            conn.commit()
    except Exception:
        pass
