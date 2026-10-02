from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class LocationCreate(BaseModel):
    name: str
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    address: Optional[str] = None

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class LocationResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
