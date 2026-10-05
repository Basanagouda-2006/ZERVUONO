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
        "https://zervuono.vercel.app",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://zervuono.vercel.app",
        ]

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: str | None) -> str:
        if not v:
            return "postgresql+psycopg2://postgres:postgres@localhost:5432/zervuno"
        
        # Determine available driver: prefer psycopg2, gracefully fallback to pure-Python pg8000
        driver = "psycopg2"
        try:
            import psycopg2
        except Exception:
            driver = "pg8000"

        url = v
        if url.startswith("postgres://"):
            url = url.replace("postgres://", f"postgresql+{driver}://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", f"postgresql+{driver}://", 1)
        elif url.startswith("postgresql+psycopg2://") and driver == "pg8000":
            url = url.replace("postgresql+psycopg2://", "postgresql+pg8000://", 1)

        # For pg8000, strip libpq-specific parameters from query string
        if driver == "pg8000" and "?" in url:
            import urllib.parse
            parsed_p = urllib.parse.urlsplit(url)
            q_dict = urllib.parse.parse_qs(parsed_p.query)
            # Remove libpq parameters that pg8000 does not understand
            q_dict.pop("sslmode", None)
            q_dict.pop("channel_binding", None)
            new_q = urllib.parse.urlencode(q_dict, doseq=True)
            url = urllib.parse.urlunsplit((parsed_p.scheme, parsed_p.netloc, parsed_p.path, new_q, parsed_p.fragment))

        # Ensure reliable DNS resolution for cloud-hosted databases (e.g. Neon, AWS RDS)
        try:
            import socket
            import urllib.parse
            parsed = urllib.parse.urlsplit(url)
            hostname = parsed.hostname
            if hostname and hostname not in ("localhost", "127.0.0.1") and not hostname.replace(".", "").isdigit():
                query_params = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
                if "hostaddr" not in query_params:
                    # Test if system DNS can resolve it
                    need_fallback = False
                    try:
                        socket.gethostbyname(hostname)
                    except Exception:
                        need_fallback = True

                    if need_fallback:
                        try:
                            import dns.resolver
                            resolver = dns.resolver.Resolver()
                            resolver.nameservers = ["8.8.8.8", "1.1.1.1"]
                            answers = resolver.resolve(hostname, "A")
                            for rdata in answers:
                                query_params["hostaddr"] = [rdata.to_text()]
                                break
                            new_query = urllib.parse.urlencode(query_params, doseq=True)
                            url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment))
                        except Exception as dns_err:
                            print(f"Fallback DNS resolution failed for {hostname}: {dns_err}")
        except Exception:
            pass

        return url

settings = Settings()
