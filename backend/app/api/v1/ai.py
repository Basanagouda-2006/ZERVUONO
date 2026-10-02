from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.organization import Membership
from app.models.request import MaintenanceRequest
from app.schemas.ai import (
    AICategoryRecommendationRequest,
    AICategoryRecommendationResponse,
    AITroubleshootingRequest,
    AITroubleshootingResponse,
    AISummarizeRequest,
    AISummarizeResponse,
)
from app.services.ai_service import ai_service
from app.api.deps import get_current_membership

router = APIRouter()

@router.post("/recommend", response_model=AICategoryRecommendationResponse)
def recommend_category_and_priority(
    data: AICategoryRecommendationRequest,
    membership: Membership = Depends(get_current_membership)
):
    """Suggests maintenance issue category and urgency/priority using Gemini AI / domain heuristics."""
    result = ai_service.recommend_category_and_priority(
        title=data.title,
        description=data.description
    )
    return AICategoryRecommendationResponse(
        category=result["category"],
        priority=result["priority"],
        confidence=result["confidence"],
        reasoning=result["reasoning"],
        is_ai_generated=result["is_ai_generated"]
    )

@router.post("/troubleshoot", response_model=AITroubleshootingResponse)
def get_troubleshooting(
    data: AITroubleshootingRequest,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    """Provides diagnostic troubleshooting steps and historical similar issue resolutions."""
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == data.request_id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    res = ai_service.generate_troubleshooting(db=db, request=req)
    return AITroubleshootingResponse(
        summary=res["summary"],
        likely_causes=res["likely_causes"],
        suggested_steps=res["suggested_steps"],
        safety_precautions=res["safety_precautions"],
        similar_past_issues=res["similar_past_issues"],
        is_available=res["is_available"],
        provider_status=res["provider_status"]
    )

@router.post("/summarize", response_model=AISummarizeResponse)
def summarize_request(
    data: AISummarizeRequest,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    """Generates an executive briefing or completion summary from work logs and materials."""
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == data.request_id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    res = ai_service.summarize_completion(db=db, request=req)
    return AISummarizeResponse(
        summary=res["summary"],
        key_findings=res["key_findings"],
        materials_used_summary=res["materials_used_summary"],
        time_spent_total=res["time_spent_total"],
        recommendation_for_preventive=res["recommendation_for_preventive"]
    )
