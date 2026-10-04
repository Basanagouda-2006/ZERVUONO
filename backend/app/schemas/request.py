from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.location import LocationResponse
from app.schemas.asset import AssetResponse

class AttachmentResponse(BaseModel):
    id: str
    file_name: str
    file_size: int
    mime_type: str
    url: str
    attachment_type: str
    created_at: datetime
    uploaded_by_id: str
    model_config = ConfigDict(from_attributes=True)

class WorkLogCreate(BaseModel):
    diagnosis: Optional[str] = None
    actions_taken: str = Field(..., min_length=3)
    hours_spent: float = Field(0.0, ge=0.0)

class WorkLogResponse(BaseModel):
    id: str
    request_id: str
    technician_id: str
    diagnosis: Optional[str] = None
    actions_taken: str
    hours_spent: float
    created_at: datetime
    technician: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

class MaterialUsageCreate(BaseModel):
    item_name: str
    quantity: float = Field(..., gt=0)
    unit: str = "pcs"
    cost: Optional[float] = None

class MaterialUsageResponse(BaseModel):
    id: str
    request_id: str
    technician_id: str
    item_name: str
    quantity: float
    unit: str
    cost: Optional[float] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    request_id: str
    customer_id: str
    rating: int
    comments: Optional[str] = None
    created_at: datetime
    customer: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

class StatusHistoryResponse(BaseModel):
    id: str
    request_id: str
    actor_id: Optional[str] = None
    from_status: Optional[str] = None
    to_status: str
    action: str
    comment: Optional[str] = None
    created_at: datetime
    actor: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)

class MaintenanceRequestCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    category: str # HVAC, Electrical, Plumbing, Mechanical, IT, Safety, etc.
    priority: Optional[str] = "Medium"
    location_id: Optional[str] = None
    location_details: Optional[str] = None
    asset_id: Optional[str] = None

class MaintenanceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    location_id: Optional[str] = None
    location_details: Optional[str] = None
    asset_id: Optional[str] = None

class AssignTechnicianRequest(BaseModel):
    technician_id: str
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    manager_instructions: Optional[str] = None

class SubmitCompletionRequest(BaseModel):
    completion_summary: str = Field(..., min_length=5)
    diagnosis: Optional[str] = None
    actions_taken: Optional[str] = None
    hours_spent: Optional[float] = 0.0

class VerifyResolutionRequest(BaseModel):
    confirmed: bool # True = verify and close, False = reopen
    reopen_reason: Optional[str] = None # required if confirmed is False
    feedback_rating: Optional[int] = None # optional rating if confirmed is True
    feedback_comments: Optional[str] = None

class MaintenanceRequestResponse(BaseModel):
    id: str
    organization_id: str
    request_number: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    requester_id: str
    location_id: Optional[str] = None
    location_details: Optional[str] = None
    asset_id: Optional[str] = None
    assigned_technician_id: Optional[str] = None
    due_date: Optional[datetime] = None
    manager_instructions: Optional[str] = None
    completion_summary: Optional[str] = None
    reopen_reason: Optional[str] = None
    reopen_count: int
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None

    requester: Optional[UserResponse] = None
    assigned_technician: Optional[UserResponse] = None
    location: Optional[LocationResponse] = None
    asset: Optional[AssetResponse] = None
    attachments: Optional[List[AttachmentResponse]] = []
    work_logs: Optional[List[WorkLogResponse]] = []
    materials: Optional[List[MaterialUsageResponse]] = []
    status_history: Optional[List[StatusHistoryResponse]] = []
    feedback: Optional[FeedbackResponse] = None
    model_config = ConfigDict(from_attributes=True)
