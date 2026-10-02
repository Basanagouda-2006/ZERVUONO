from typing import List, Optional
from pydantic import BaseModel

class AICategoryRecommendationRequest(BaseModel):
    title: str
    description: str

class AICategoryRecommendationResponse(BaseModel):
    category: str
    priority: str
    confidence: float
    reasoning: str
    is_ai_generated: bool = True

class AITroubleshootingRequest(BaseModel):
    request_id: str

class AITroubleshootingResponse(BaseModel):
    summary: str
    likely_causes: List[str]
    suggested_steps: List[str]
    safety_precautions: List[str]
    similar_past_issues: List[dict]
    is_available: bool = True
    provider_status: str # "ready", "simulated", "unavailable"

class AISummarizeRequest(BaseModel):
    request_id: str

class AISummarizeResponse(BaseModel):
    summary: str
    key_findings: List[str]
    materials_used_summary: Optional[str] = None
    time_spent_total: float
    recommendation_for_preventive: Optional[str] = None
