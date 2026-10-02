from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from app.schemas.user import UserResponse

class OrganizationCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    domain: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    settings: Optional[str] = None
    logo_url: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    domain: Optional[str] = None
    settings: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MembershipResponse(BaseModel):
    id: str
    user_id: str
    organization_id: str
    role: str
    title: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    joined_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str # "Admin", "Manager", "Technician", "Customer"

class InvitationResponse(BaseModel):
    id: str
    organization_id: str
    email: str
    role: str
    token: str
    status: str
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class AcceptInvitationRequest(BaseModel):
    token: str
    password: str
    full_name: str
