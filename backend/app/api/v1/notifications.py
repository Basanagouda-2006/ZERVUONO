from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.organization import Membership
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationMarkReadRequest
from app.api.deps import get_current_user, get_current_membership

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    limit: int = 50,
    membership: Membership = Depends(get_current_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = (
        db.query(Notification)
        .filter(
            Notification.organization_id == membership.organization_id,
            Notification.recipient_id == current_user.id
        )
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return notifs

@router.get("/unread-count")
def get_unread_count(
    membership: Membership = Depends(get_current_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    count = (
        db.query(Notification)
        .filter(
            Notification.organization_id == membership.organization_id,
            Notification.recipient_id == current_user.id,
            Notification.is_read == False
        )
        .count()
    )
    return {"unread_count": count}

@router.post("/read")
def mark_notifications_read(
    data: NotificationMarkReadRequest,
    membership: Membership = Depends(get_current_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    query = db.query(Notification).filter(
        Notification.organization_id == membership.organization_id,
        Notification.recipient_id == current_user.id,
        Notification.is_read == False
    )
    if not data.mark_all and data.notification_ids:
        query = query.filter(Notification.id.in_(data.notification_ids))

    updated_count = query.update(
        {"is_read": True, "read_at": now},
        synchronize_session=False
    )
    db.commit()
    return {"updated": updated_count}
