import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine, init_tables
from app.db.seed import seed_database
from app.api.v1 import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    try:
        init_tables()
        if settings.SEED_DEMO_DATA:
            seed_database()
    except Exception as e:
        print(f"Startup warning during table initialization: {e}")
    yield
    # Shutdown
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Zervuno — Maintenance operations SaaS platform. Keep work moving.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads route with database fallback for persistent file serving
from fastapi.responses import FileResponse, Response

@app.get("/uploads/{file_path:path}", tags=["Uploads"])
def serve_upload(file_path: str):
    clean_path = file_path.replace("\\", "/")
    local_target = Path(settings.UPLOAD_DIR) / clean_path
    if local_target.exists() and local_target.is_file():
        return FileResponse(path=str(local_target))

    # Database persistent fallback from Neon PostgreSQL
    try:
        from app.db.session import SessionLocal
        from app.models.request import Attachment
        with SessionLocal() as db:
            att = db.query(Attachment).filter(
                (Attachment.storage_key == clean_path) |
                (Attachment.storage_key.ilike(f"%{Path(clean_path).name}"))
            ).first()
            if att and att.file_data:
                return Response(
                    content=att.file_data,
                    media_type=att.mime_type or "image/jpeg",
                    headers={
                        "Cache-Control": "public, max-age=31536000, immutable",
                        "Content-Disposition": f'inline; filename="{att.file_name}"',
                    }
                )
    except Exception:
        pass

    return JSONResponse(status_code=404, content={"detail": "File not found"})

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

@app.get("/health", tags=["System"])
def health_check():
    """Health and readiness check verifying database connectivity."""
    db_ok = False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_ok = True
    except Exception as e:
        db_error = str(e)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": db_error,
                "version": settings.VERSION
            }
        )

    return {
        "status": "healthy",
        "database": "connected",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time()
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "name": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
