import os
# Ensure test suite runs in an isolated, disposable test database (never mutating production Neon DB)
if "TEST_DATABASE_URL" in os.environ:
    os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]
else:
    test_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_disposable.db"))
    # Normalize Windows backslashes for SQLite URL
    clean_sqlite_path = test_db_path.replace("\\", "/")
    os.environ["DATABASE_URL"] = f"sqlite:///{clean_sqlite_path}"

os.environ["ENVIRONMENT"] = "testing"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal, get_db, engine, init_tables
from app.db.seed import seed_database
from sqlalchemy import text

@pytest.fixture(scope="session", autouse=True)
def setup_test_data():
    init_tables()
    seed_database()
    yield
    # Clean up test accounts after test session
    try:
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM users WHERE email LIKE '%@example.com'"))
    except Exception:
        pass
    # Dispose engine so file lock is released
    engine.dispose()
    # Remove disposable sqlite db file if it was used
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("sqlite:///"):
        raw_path = db_url.replace("sqlite:///", "")
        if os.path.exists(raw_path):
            try:
                os.remove(raw_path)
            except Exception:
                pass

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="function")
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
