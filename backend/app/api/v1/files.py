from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

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

    attachment = Attachment(
        organization_id=membership.organization_id,
        request_id=request_id,
        uploaded_by_id=membership.user_id,
        file_name=saved_meta["file_name"],
        file_size=saved_meta["file_size"],
        mime_type=saved_meta["mime_type"],
        storage_key=saved_meta["storage_key"],
        url=saved_meta["url"],
        attachment_type=attachment_type
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment
