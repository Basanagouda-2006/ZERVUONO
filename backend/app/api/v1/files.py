import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response, RedirectResponse, FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.organization import Membership
from app.models.request import MaintenanceRequest, Attachment
from app.schemas.request import AttachmentResponse
from app.services.storage_service import storage_service
from app.api.deps import get_current_membership

router = APIRouter()

@router.post("/upload", response_model=AttachmentResponse)
async def upload_file(
    file: UploadFile = File(...),
    request_id: Optional[str] = Form(None),
    attachment_type: str = Form("Initial"), # Initial, Before, After, Document
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    if request_id:
        req = (
            db.query(MaintenanceRequest)
            .filter(
                MaintenanceRequest.id == request_id,
                MaintenanceRequest.organization_id == membership.organization_id
            )
            .first()
        )
        if not req:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    saved_meta = await storage_service.save_file(
        file=file,
        organization_id=membership.organization_id,
        attachment_type=attachment_type.lower()
    )

    unique_att_id = str(uuid.uuid4())
    raw_url = saved_meta["url"]
    if raw_url.startswith("http://") or raw_url.startswith("https://"):
        file_url = raw_url
    else:
        file_url = f"/api/v1/files/{unique_att_id}/view"

    attachment = Attachment(
        id=unique_att_id,
        organization_id=membership.organization_id,
        request_id=request_id,
        uploaded_by_id=membership.user_id,
        file_name=saved_meta["file_name"],
        file_size=saved_meta["file_size"],
        mime_type=saved_meta["mime_type"],
        storage_key=saved_meta["storage_key"],
        url=file_url,
        file_data=saved_meta.get("file_bytes"),
        attachment_type=attachment_type
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment

@router.get("/{attachment_id}/view")
def view_file(
    attachment_id: str,
    db: Session = Depends(get_db)
):
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found.")

    # 1. External S3 object storage
    if attachment.url.startswith("http://") or attachment.url.startswith("https://"):
        return RedirectResponse(url=attachment.url, status_code=307)

    # 2. Persistent binary content from PostgreSQL
    if attachment.file_data:
        return Response(
            content=attachment.file_data,
            media_type=attachment.mime_type or "image/jpeg",
            headers={
                "Cache-Control": "public, max-age=31536000, immutable",
                "Content-Disposition": f'inline; filename="{attachment.file_name}"',
            }
        )

    # 3. Local disk cache fallback
    local_path = Path(settings.UPLOAD_DIR) / attachment.storage_key
    if local_path.exists() and local_path.is_file():
        return FileResponse(
            path=str(local_path),
            media_type=attachment.mime_type or "image/jpeg",
            filename=attachment.file_name
        )

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File content unavailable.")
