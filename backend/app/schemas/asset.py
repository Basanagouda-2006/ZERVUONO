from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.location import LocationResponse

class AssetCreate(BaseModel):
    name: str
    asset_tag: str
    category: str
    location_id: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    installation_date: Optional[date] = None
    warranty_expiration: Optional[date] = None
    status: Optional[str] = "Operational"
    criticality: Optional[str] = "Medium"
    notes: Optional[str] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_tag: Optional[str] = None
    category: Optional[str] = None
    location_id: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    installation_date: Optional[date] = None
    warranty_expiration: Optional[date] = None
    status: Optional[str] = None
    criticality: Optional[str] = None
    notes: Optional[str] = None

class AssetResponse(BaseModel):
    id: str
    organization_id: str
    location_id: Optional[str] = None
    name: str
    asset_tag: str
    category: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    installation_date: Optional[date] = None
    warranty_expiration: Optional[date] = None
    status: str
    criticality: str
    notes: Optional[str] = None
    created_at: datetime
    location: Optional[LocationResponse] = None

    class Config:
        from_attributes = True
