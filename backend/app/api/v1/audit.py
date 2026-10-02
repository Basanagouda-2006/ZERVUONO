from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.organization import Membership
from app.models.audit import AuditEvent
from app.schemas.user import UserResponse
from app.api.deps import require_roles

router = APIRouter()

class AuditEventResponse(BaseModel):
    id: str
    organization_id: str
    actor_id: Optional[str] = None
    entity_type: str
    entity_id: Optional[str] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    actor: Optional[UserResponse] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AuditEventResponse])
def list_audit_events(
    limit: int = 100,
    membership: Membership = Depends(require_roles(["Admin"])),
    db: Session = Depends(get_db)
):
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.organization_id == membership.organization_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return events
