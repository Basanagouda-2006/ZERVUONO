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
    "application/pdf",
    "text/plain",
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
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}. Allowed types: JPEG, PNG, WebP, PDF."
            )

        # Generate secure unique key
        ext = Path(file.filename or "").suffix.lower()
        if not ext:
            ext = ".jpg" if "image" in (file.content_type or "") else ".dat"

        storage_key = f"{organization_id}/{attachment_type}/{uuid.uuid4().hex}{ext}"
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
