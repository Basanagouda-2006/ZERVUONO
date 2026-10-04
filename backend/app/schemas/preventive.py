from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.asset import AssetResponse
from app.schemas.location import LocationResponse
from app.schemas.user import UserResponse

class PreventivePlanCreate(BaseModel):
    title: str
    description: Optional[str] = None
    asset_id: Optional[str] = None
    location_id: Optional[str] = None
    frequency: str # Weekly, Monthly, Quarterly, Semi-Annual, Annual
    assigned_technician_id: Optional[str] = None
    checklist: Optional[str] = None
    next_due_date: date

class PreventivePlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    asset_id: Optional[str] = None
    location_id: Optional[str] = None
    frequency: Optional[str] = None
    assigned_technician_id: Optional[str] = None
    checklist: Optional[str] = None
    is_active: Optional[bool] = None
    next_due_date: Optional[date] = None

class PreventivePlanResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    description: Optional[str] = None
    asset_id: Optional[str] = None
    location_id: Optional[str] = None
    frequency: str
    assigned_technician_id: Optional[str] = None
    checklist: Optional[str] = None
    is_active: bool
    next_due_date: date
    last_generated_at: Optional[datetime] = None
    created_at: datetime

    asset: Optional[AssetResponse] = None
    location: Optional[LocationResponse] = None
    assigned_technician: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)
