import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal, get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_data():
    from app.db.session import init_tables, engine
    from app.db.seed import seed_database
    from sqlalchemy import text
    init_tables()
    seed_database()
    yield
    # Clean up dynamic test accounts after test session while preserving base seed accounts
    with engine.begin() as conn:
        try:
            conn.execute(text("DELETE FROM users WHERE email LIKE '%@example.com'"))
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
