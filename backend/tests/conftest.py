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
    # Clean up after test session completes to keep database completely clean
    with engine.connect() as conn:
        tables = [
            'audit_events', 'feedbacks', 'material_usages', 'work_logs',
            'attachments', 'request_status_history', 'preventive_plans',
            'maintenance_requests', 'notifications', 'invitations',
            'memberships', 'assets', 'locations', 'token_records',
            'user_sessions', 'organizations', 'users'
        ]
        for t in tables:
            try:
                conn.execute(text(f"TRUNCATE TABLE {t} CASCADE"))
            except Exception:
                pass
        conn.commit()

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
