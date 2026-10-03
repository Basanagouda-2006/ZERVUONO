import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "Zervuno"
    TAGLINE: str = "Keep work moving."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security
    SECRET_KEY: str = "zervuno-super-secret-key-change-in-production-f83b194a72d3e"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    COOKIE_NAME: str = "zervuno_session"
    COOKIE_SECURE: bool = False # set to True in production HTTPS
    COOKIE_SAMESITE: str = "lax"

    # Database
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/zervuno"

    # Storage
    STORAGE_BACKEND: str = "local" # "local" or "s3"
    UPLOAD_DIR: str = "uploads"
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = ""
    S3_REGION_NAME: str = "auto"

    # AI Configuration (Gemini API)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Email
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "Zervuno <notifications@zervuno.com>"

    # Demo Data Seeding (false by default for clean production)
    SEED_DEMO_DATA: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: str | None) -> str:
        if not v:
            return "postgresql+psycopg2://postgres:postgres@localhost:5432/zervuno"
        # If user provides standard postgresql:// (e.g. from Neon or Render), transform to postgresql+psycopg2://
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+psycopg2://", 1)
        if v.startswith("postgresql://") and not v.startswith("postgresql+"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

settings = Settings()
