from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class MetricCard(BaseModel):
    label: str
    value: Any
    change: Optional[str] = None
    trend: Optional[str] = None # "up", "down", "neutral"
    description: Optional[str] = None

class TechnicianWorkload(BaseModel):
    technician_id: str
    technician_name: str
    avatar_url: Optional[str] = None
    active_jobs: int
    completed_jobs: int
    avg_hours_per_job: float

class CategoryCount(BaseModel):
    category: str
    count: int
    percentage: float

class StatusCount(BaseModel):
    status: str
    count: int

class ReportSummaryResponse(BaseModel):
    total_requests: int
    open_requests: int
    unassigned_requests: int
    in_progress_requests: int
    awaiting_verification: int
    closed_requests: int
    reopened_requests: int
    reopen_rate_percent: float
    avg_resolution_hours: float
    avg_response_hours: float
    avg_rating: float
    total_ratings_count: int
    technicians_workload: List[TechnicianWorkload]
    categories_breakdown: List[CategoryCount]
    status_breakdown: List[StatusCount]
    generated_at: str
