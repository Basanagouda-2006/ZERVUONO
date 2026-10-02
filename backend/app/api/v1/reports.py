from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.organization import Membership
from app.models.user import User
from app.models.request import (
    MaintenanceRequest,
    WorkLog,
    Feedback,
    RequestStatusHistory
)
from app.schemas.report import (
    ReportSummaryResponse,
    TechnicianWorkload,
    CategoryCount,
    StatusCount
)
from app.api.deps import require_roles

router = APIRouter()

@router.get("/summary", response_model=ReportSummaryResponse)
def get_operational_summary(
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    org_id = membership.organization_id
    now = datetime.now(timezone.utc)

    # All requests in organization
    requests = (
        db.query(MaintenanceRequest)
        .filter(MaintenanceRequest.organization_id == org_id)
        .all()
    )

    total_requests = len(requests)
    open_requests = sum(1 for r in requests if r.status not in ["Closed", "Cancelled"])
    unassigned_requests = sum(1 for r in requests if r.assigned_technician_id is None and r.status not in ["Closed", "Cancelled"])
    in_progress = sum(1 for r in requests if r.status == "In Progress")
    awaiting_verification = sum(1 for r in requests if r.status == "Awaiting Verification")
    closed = sum(1 for r in requests if r.status == "Closed")
    reopened = sum(1 for r in requests if r.reopen_count > 0 or r.status == "Reopened")

    reopen_rate = (reopened / total_requests * 100) if total_requests > 0 else 0.0

    # Resolution time calculation (in hours)
    closed_requests_list = [r for r in requests if r.status == "Closed" and r.closed_at]
    resolution_times = []
    for r in closed_requests_list:
        diff_hours = (r.closed_at - r.created_at).total_seconds() / 3600.0
        if diff_hours >= 0:
            resolution_times.append(diff_hours)
    avg_resolution_hours = sum(resolution_times) / len(resolution_times) if resolution_times else 0.0

    # Response time calculation (from created_at to first ASSIGNED action in history)
    response_times = []
    for r in requests:
        first_assign = (
            db.query(RequestStatusHistory)
            .filter(
                RequestStatusHistory.request_id == r.id,
                RequestStatusHistory.to_status == "Assigned"
            )
            .order_by(RequestStatusHistory.created_at.asc())
            .first()
        )
        if first_assign:
            resp_h = (first_assign.created_at - r.created_at).total_seconds() / 3600.0
            if resp_h >= 0:
                response_times.append(resp_h)
    avg_response_hours = sum(response_times) / len(response_times) if response_times else 0.0

    # Feedback ratings
    feedbacks = (
        db.query(Feedback)
        .join(MaintenanceRequest, Feedback.request_id == MaintenanceRequest.id)
        .filter(MaintenanceRequest.organization_id == org_id)
        .all()
    )
    total_ratings = len(feedbacks)
    avg_rating = sum(f.rating for f in feedbacks) / total_ratings if total_ratings > 0 else 5.0

    # Technicians workload
    tech_members = (
        db.query(Membership)
        .filter(
            Membership.organization_id == org_id,
            Membership.role == "Technician",
            Membership.is_active == True
        )
        .all()
    )
    workloads: List[TechnicianWorkload] = []
    for tm in tech_members:
        tech_user = tm.user
        active_jobs = sum(1 for r in requests if r.assigned_technician_id == tech_user.id and r.status not in ["Closed", "Cancelled"])
        completed_jobs = sum(1 for r in requests if r.assigned_technician_id == tech_user.id and r.status == "Closed")
        
        # Calculate logged hours
        total_hours = (
            db.query(func.coalesce(func.sum(WorkLog.hours_spent), 0.0))
            .filter(WorkLog.technician_id == tech_user.id)
            .scalar()
            or 0.0
        )
        total_jobs_ever = active_jobs + completed_jobs
        avg_h = (total_hours / total_jobs_ever) if total_jobs_ever > 0 else 0.0

        workloads.append(
            TechnicianWorkload(
                technician_id=tech_user.id,
                technician_name=tech_user.full_name,
                avatar_url=tech_user.avatar_url,
                active_jobs=active_jobs,
                completed_jobs=completed_jobs,
                avg_hours_per_job=round(avg_h, 1)
            )
        )

    # Categories breakdown
    cat_counts: Dict[str, int] = {}
    for r in requests:
        cat_counts[r.category] = cat_counts.get(r.category, 0) + 1

    categories_breakdown = [
        CategoryCount(
            category=cat,
            count=cnt,
            percentage=round(cnt / total_requests * 100, 1) if total_requests > 0 else 0.0
        )
        for cat, cnt in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Status breakdown
    status_counts: Dict[str, int] = {}
    for r in requests:
        status_counts[r.status] = status_counts.get(r.status, 0) + 1

    status_breakdown = [
        StatusCount(status=st, count=cnt)
        for st, cnt in sorted(status_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    return ReportSummaryResponse(
        total_requests=total_requests,
        open_requests=open_requests,
        unassigned_requests=unassigned_requests,
        in_progress_requests=in_progress,
        awaiting_verification=awaiting_verification,
        closed_requests=closed,
        reopened_requests=reopened,
        reopen_rate_percent=round(reopen_rate, 1),
        avg_resolution_hours=round(avg_resolution_hours, 1),
        avg_response_hours=round(avg_response_hours, 1),
        avg_rating=round(avg_rating, 1),
        total_ratings_count=total_ratings,
        technicians_workload=workloads,
        categories_breakdown=categories_breakdown,
        status_breakdown=status_breakdown,
        generated_at=now.isoformat()
    )
