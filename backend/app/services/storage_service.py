import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
    "image/pjpeg",
    "image/bmp",
    "image/tiff",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/octet-stream",
}

MAX_FILE_SIZE = 20 * 1024 * 1024 # 20 MB

class StorageService:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(
        self,
        file: UploadFile,
        organization_id: str,
        attachment_type: str = "general"
    ) -> dict:
        content_type = (file.content_type or "").lower()
        ext = Path(file.filename or "").suffix.lower()

        # Allow supported mime types or known safe image/document extensions
        is_allowed = content_type in ALLOWED_MIME_TYPES or ext in {
            ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".pdf", ".txt", ".bmp", ".tiff"
        }
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}. Allowed types: JPEG, PNG, WebP, HEIC, PDF."
            )

        # Generate secure unique key
        if not ext:
            ext = ".jpg" if "image" in content_type else ".dat"

        unique_id = str(uuid.uuid4())
        safe_filename = f"{unique_id}{ext}"
        storage_key = f"{organization_id}/{attachment_type}/{safe_filename}"

        if settings.STORAGE_BACKEND == "s3" and settings.S3_BUCKET_NAME:
            try:
                import boto3
                s3_kwargs = {
                    "aws_access_key_id": settings.S3_ACCESS_KEY_ID,
                    "aws_secret_access_key": settings.S3_SECRET_ACCESS_KEY,
                }
                if settings.S3_ENDPOINT_URL:
                    s3_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
                if settings.S3_REGION_NAME and settings.S3_REGION_NAME != "auto":
                    s3_kwargs["region_name"] = settings.S3_REGION_NAME

                s3_client = boto3.client("s3", **s3_kwargs)
                await file.seek(0)
                file_bytes = await file.read()
                s3_client.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=storage_key,
                    Body=file_bytes,
                    ContentType=file.content_type
                )
                if settings.S3_ENDPOINT_URL:
                    url = f"{settings.S3_ENDPOINT_URL.rstrip('/')}/{settings.S3_BUCKET_NAME}/{storage_key}"
                else:
                    url = f"https://{settings.S3_BUCKET_NAME}.s3.amazonaws.com/{storage_key}"

                return {
                    "file_name": file.filename or "uploaded_file",
                    "file_size": len(file_bytes),
                    "mime_type": file.content_type or "application/octet-stream",
                    "storage_key": storage_key,
                    "url": url,
                }
            except Exception:
                # Fall back to local file storage
                await file.seek(0)

        target_path = self.upload_dir / storage_key
        target_path.parent.mkdir(parents=True, exist_ok=True)

        size = 0
        async with aiofiles.open(target_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024): # 1MB chunks
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    # Clean up file on overflow
                    target_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum allowed size of 20MB."
                    )
                await out_file.write(chunk)

        # Public relative URL served by FastAPI static route
        url = f"/uploads/{storage_key.replace('\\', '/')}"

        return {
            "file_name": file.filename or "uploaded_file",
            "file_size": size,
            "mime_type": file.content_type or "application/octet-stream",
            "storage_key": storage_key,
            "url": url,
        }

storage_service = StorageService()
