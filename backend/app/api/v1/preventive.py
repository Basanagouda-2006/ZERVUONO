from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.state_machine import RequestStatus
from app.db.session import get_db
from app.models.organization import Membership
from app.models.preventive import PreventiveMaintenancePlan
from app.models.request import MaintenanceRequest, RequestStatusHistory
from app.schemas.preventive import (
    PreventivePlanCreate,
    PreventivePlanUpdate,
    PreventivePlanResponse,
)
from app.services.notification_service import notification_service
from app.api.deps import get_current_membership, require_roles

router = APIRouter()

def compute_next_due(current: date, frequency: str) -> date:
    freq = frequency.lower()
    if "week" in freq:
        return current + timedelta(days=7)
    elif "month" in freq:
        return current + timedelta(days=30)
    elif "quarter" in freq:
        return current + timedelta(days=90)
    elif "semi" in freq:
        return current + timedelta(days=182)
    elif "annual" in freq or "year" in freq:
        return current + timedelta(days=365)
    return current + timedelta(days=30)

@router.get("/", response_model=List[PreventivePlanResponse])
def list_preventive_plans(
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    return (
        db.query(PreventiveMaintenancePlan)
        .filter(PreventiveMaintenancePlan.organization_id == membership.organization_id)
        .order_by(PreventiveMaintenancePlan.next_due_date.asc())
        .all()
    )

@router.post("/", response_model=PreventivePlanResponse, status_code=status.HTTP_201_CREATED)
def create_preventive_plan(
    data: PreventivePlanCreate,
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    plan = PreventiveMaintenancePlan(
        organization_id=membership.organization_id,
        title=data.title.strip(),
        description=data.description,
        asset_id=data.asset_id,
        location_id=data.location_id,
        frequency=data.frequency,
        assigned_technician_id=data.assigned_technician_id,
        checklist=data.checklist,
        is_active=True,
        next_due_date=data.next_due_date
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/{id}", response_model=PreventivePlanResponse)
def update_preventive_plan(
    id: str,
    data: PreventivePlanUpdate,
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    plan = db.query(PreventiveMaintenancePlan).filter(
        PreventiveMaintenancePlan.id == id,
        PreventiveMaintenancePlan.organization_id == membership.organization_id
    ).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    if data.title is not None:
        plan.title = data.title.strip()
    if data.description is not None:
        plan.description = data.description
    if data.asset_id is not None:
        plan.asset_id = data.asset_id
    if data.location_id is not None:
        plan.location_id = data.location_id
    if data.frequency is not None:
        plan.frequency = data.frequency
    if data.assigned_technician_id is not None:
        plan.assigned_technician_id = data.assigned_technician_id
    if data.checklist is not None:
        plan.checklist = data.checklist
    if data.is_active is not None:
        plan.is_active = data.is_active
    if data.next_due_date is not None:
        plan.next_due_date = data.next_due_date

    db.commit()
    db.refresh(plan)
    return plan

@router.post("/{id}/trigger")
def trigger_plan_work_order(
    id: str,
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    """Instantly spawns a scheduled work request from this preventive maintenance plan."""
    plan = db.query(PreventiveMaintenancePlan).filter(
        PreventiveMaintenancePlan.id == id,
        PreventiveMaintenancePlan.organization_id == membership.organization_id
    ).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    count = (
        db.query(func.count(MaintenanceRequest.id))
        .filter(MaintenanceRequest.organization_id == membership.organization_id)
        .scalar()
        or 0
    )
    req_number = f"PM-{1001 + count}"

    req = MaintenanceRequest(
        organization_id=membership.organization_id,
        request_number=req_number,
        title=f"[PM] {plan.title}",
        description=f"Preventive maintenance scheduled occurrence.\n{plan.description or ''}\n\nChecklist:\n{plan.checklist or 'Standard inspection'}",
        category="Preventive",
        priority="Medium",
        status=RequestStatus.ASSIGNED.value if plan.assigned_technician_id else RequestStatus.SUBMITTED.value,
        requester_id=membership.user_id,
        location_id=plan.location_id,
        asset_id=plan.asset_id,
        assigned_technician_id=plan.assigned_technician_id,
        due_date=datetime.combine(plan.next_due_date, datetime.min.time(), tzinfo=timezone.utc),
        manager_instructions=f"Frequency: {plan.frequency}. Complete preventive maintenance checklist."
    )
    db.add(req)
    db.flush()

    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=None,
        to_status=req.status,
        action="PREVENTIVE_MAINTENANCE_TRIGGERED",
        comment=f"Generated from plan: {plan.title}"
    )
    db.add(history)

    # Advance plan next due date
    plan.last_generated_at = datetime.now(timezone.utc)
    plan.next_due_date = compute_next_due(plan.next_due_date, plan.frequency)

    if plan.assigned_technician_id:
        notification_service.create_notification(
            db=db,
            organization_id=membership.organization_id,
            recipient_id=plan.assigned_technician_id,
            title=f"Preventive Job Assigned: {req.request_number}",
            message=f"Scheduled maintenance: {req.title}",
            notification_type="ASSIGNED",
            request_id=req.id
        )

    db.commit()
    db.refresh(req)
    return {"message": "Preventive maintenance work order created.", "request_id": req.id, "request_number": req.request_number}
