from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    id: str
    organization_id: str
    recipient_id: str
    title: str
    message: str
    notification_type: str
    request_id: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class NotificationMarkReadRequest(BaseModel):
    notification_ids: Optional[list[str]] = None
    mark_all: bool = False
