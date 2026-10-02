from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.organization import Membership

class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        organization_id: str,
        recipient_id: str,
        title: str,
        message: str,
        notification_type: str,
        request_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            organization_id=organization_id,
            recipient_id=recipient_id,
            title=title,
            message=message,
            notification_type=notification_type,
            request_id=request_id,
            is_read=False
        )
        db.add(notif)
        db.flush()
        return notif

    @staticmethod
    def notify_role(
        db: Session,
        organization_id: str,
        role: str,
        title: str,
        message: str,
        notification_type: str,
        request_id: Optional[str] = None
    ) -> List[Notification]:
        """Notify all active members with a given role in an organization (e.g. Managers)."""
        members = (
            db.query(Membership)
            .filter(
                Membership.organization_id == organization_id,
                Membership.role == role,
                Membership.is_active == True
            )
            .all()
        )
        created = []
        for m in members:
            notif = NotificationService.create_notification(
                db=db,
                organization_id=organization_id,
                recipient_id=m.user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                request_id=request_id
            )
            created.append(notif)
        return created

notification_service = NotificationService()
