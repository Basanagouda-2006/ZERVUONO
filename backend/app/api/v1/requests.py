from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func

from app.core.state_machine import RequestStatus, validate_transition
from app.db.session import get_db
from app.models.user import User
from app.models.organization import Membership
from app.models.location import Location
from app.models.request import (
    MaintenanceRequest,
    RequestStatusHistory,
    WorkLog,
    MaterialUsage,
    Feedback,
)
from app.models.audit import AuditEvent
from app.schemas.request import (
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestResponse,
    AssignTechnicianRequest,
    SubmitCompletionRequest,
    VerifyResolutionRequest,
    WorkLogCreate,
    WorkLogResponse,
    MaterialUsageCreate,
    MaterialUsageResponse,
    FeedbackCreate,
    FeedbackResponse,
)
from app.services.notification_service import notification_service
from app.api.deps import get_current_user, get_current_membership, require_roles

router = APIRouter()

def generate_request_number(db: Session, organization_id: str) -> str:
    count = (
        db.query(func.count(MaintenanceRequest.id))
        .filter(MaintenanceRequest.organization_id == organization_id)
        .scalar()
        or 0
    )
    return f"REQ-{1001 + count}"

@router.get("/", response_model=List[MaintenanceRequestResponse])
def list_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    my_assigned: Optional[bool] = Query(False, alias="my_assigned"),
    my_created: Optional[bool] = Query(False, alias="my_created"),
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    query = (
        db.query(MaintenanceRequest)
        .options(
            joinedload(MaintenanceRequest.requester),
            joinedload(MaintenanceRequest.assigned_technician),
            joinedload(MaintenanceRequest.location),
            joinedload(MaintenanceRequest.asset),
            selectinload(MaintenanceRequest.attachments),
            selectinload(MaintenanceRequest.work_logs),
            selectinload(MaintenanceRequest.materials),
            selectinload(MaintenanceRequest.status_history),
            selectinload(MaintenanceRequest.feedback),
        )
        .filter(MaintenanceRequest.organization_id == membership.organization_id)
    )

    # Scoping by role
    if membership.role == "Customer":
        # Customers only see their own requests
        query = query.filter(MaintenanceRequest.requester_id == membership.user_id)
    elif membership.role == "Technician":
        if my_assigned:
            query = query.filter(MaintenanceRequest.assigned_technician_id == membership.user_id)
        # Technicians can see their assigned jobs or jobs needing technician action
    elif my_assigned:
        query = query.filter(MaintenanceRequest.assigned_technician_id == membership.user_id)

    if my_created:
        query = query.filter(MaintenanceRequest.requester_id == membership.user_id)

    if status_filter:
        query = query.filter(MaintenanceRequest.status == status_filter)
    if category_filter:
        query = query.filter(MaintenanceRequest.category == category_filter)
    if priority_filter:
        query = query.filter(MaintenanceRequest.priority == priority_filter)

    requests = query.order_by(MaintenanceRequest.created_at.desc()).all()
    return requests

@router.post("/", response_model=MaintenanceRequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    data: MaintenanceRequestCreate,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    req_number = generate_request_number(db, membership.organization_id)
    
    # Resolve location if location_id not provided or empty string
    target_location_id = data.location_id if (data.location_id and data.location_id.strip()) else None
    if not target_location_id and data.location_name and data.location_name.strip():
        existing_loc = (
            db.query(Location)
            .filter(
                Location.organization_id == membership.organization_id,
                func.lower(Location.name) == func.lower(data.location_name.strip())
            )
            .first()
        )
        if existing_loc:
            target_location_id = existing_loc.id
        else:
            new_loc = Location(
                organization_id=membership.organization_id,
                name=data.location_name.strip(),
                is_active=True
            )
            db.add(new_loc)
            db.flush()
            target_location_id = new_loc.id

    req = MaintenanceRequest(
        organization_id=membership.organization_id,
        request_number=req_number,
        title=data.title.strip(),
        description=data.description.strip(),
        category=data.category,
        priority=data.priority or "Medium",
        status=RequestStatus.SUBMITTED.value,
        requester_id=membership.user_id,
        location_id=target_location_id,
        location_details=data.location_details,
        asset_id=data.asset_id if (data.asset_id and data.asset_id.strip()) else None,
    )
    db.add(req)
    db.flush()

    # Initial status history
    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=None,
        to_status=RequestStatus.SUBMITTED.value,
        action="REQUEST_CREATED",
        comment=f"Request submitted with {req.priority} priority."
    )
    db.add(history)

    # Notify managers about new incoming work
    notification_service.notify_role(
        db=db,
        organization_id=membership.organization_id,
        role="Manager",
        title=f"New Request: {req.request_number}",
        message=f"{membership.user.full_name} reported: {req.title}",
        notification_type="REQUEST_CREATED",
        request_id=req.id
    )

    db.commit()
    
    # Reload with eager-loaded relationships
    return (
        db.query(MaintenanceRequest)
        .options(
            joinedload(MaintenanceRequest.requester),
            joinedload(MaintenanceRequest.assigned_technician),
            joinedload(MaintenanceRequest.location),
            joinedload(MaintenanceRequest.asset),
            selectinload(MaintenanceRequest.attachments),
            selectinload(MaintenanceRequest.work_logs),
            selectinload(MaintenanceRequest.materials),
            selectinload(MaintenanceRequest.status_history),
            selectinload(MaintenanceRequest.feedback),
        )
        .filter(MaintenanceRequest.id == req.id)
        .first()
    )

@router.get("/{id}", response_model=MaintenanceRequestResponse)
def get_request(
    id: str,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .options(
            joinedload(MaintenanceRequest.requester),
            joinedload(MaintenanceRequest.assigned_technician),
            joinedload(MaintenanceRequest.location),
            joinedload(MaintenanceRequest.asset),
            selectinload(MaintenanceRequest.attachments),
            selectinload(MaintenanceRequest.work_logs),
            selectinload(MaintenanceRequest.materials),
            selectinload(MaintenanceRequest.status_history),
            selectinload(MaintenanceRequest.feedback),
        )
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    # Customer check
    if membership.role == "Customer" and req.requester_id != membership.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return req

@router.put("/{id}", response_model=MaintenanceRequestResponse)
def update_request(
    id: str,
    data: MaintenanceRequestUpdate,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    # Only requester (if submitted) or Manager/Admin can update
    if membership.role == "Customer":
        if req.requester_id != membership.user_id or req.status != RequestStatus.SUBMITTED.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customers can only edit their own requests while in 'Submitted' state."
            )

    if data.title is not None:
        req.title = data.title.strip()
    if data.description is not None:
        req.description = data.description.strip()
    if data.category is not None:
        req.category = data.category
    if data.priority is not None and membership.role in ["Manager", "Admin"]:
        req.priority = data.priority
    if data.location_id is not None:
        req.location_id = data.location_id
    if data.location_details is not None:
        req.location_details = data.location_details
    if data.asset_id is not None:
        req.asset_id = data.asset_id

    db.commit()
    db.refresh(req)
    return req

@router.post("/{id}/assign", response_model=MaintenanceRequestResponse)
def assign_technician(
    id: str,
    data: AssignTechnicianRequest,
    membership: Membership = Depends(require_roles(["Manager", "Admin"])),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    # Verify technician belongs to this organization
    tech_membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == data.technician_id,
            Membership.organization_id == membership.organization_id,
            Membership.role == "Technician",
            Membership.is_active == True
        )
        .first()
    )
    if not tech_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified technician does not exist or is not an active technician in this organization."
        )

    current_status = RequestStatus(req.status)
    validate_transition(current_status, RequestStatus.ASSIGNED)

    from_status = req.status
    req.assigned_technician_id = data.technician_id
    req.status = RequestStatus.ASSIGNED.value
    if data.priority:
        req.priority = data.priority
    if data.due_date:
        req.due_date = data.due_date
    if data.manager_instructions:
        req.manager_instructions = data.manager_instructions

    # Record history
    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=from_status,
        to_status=RequestStatus.ASSIGNED.value,
        action="TECHNICIAN_ASSIGNED",
        comment=f"Assigned to {tech_membership.user.full_name}. Priority: {req.priority}."
    )
    db.add(history)

    # Persist in-app notification to technician
    notification_service.create_notification(
        db=db,
        organization_id=membership.organization_id,
        recipient_id=data.technician_id,
        title=f"New Job Assignment: {req.request_number}",
        message=f"You have been assigned to: {req.title}. Priority: {req.priority}.",
        notification_type="ASSIGNED",
        request_id=req.id
    )

    db.commit()
    db.refresh(req)
    return req

@router.post("/{id}/claim", response_model=MaintenanceRequestResponse)
def claim_request(
    id: str,
    membership: Membership = Depends(require_roles(["Technician", "Manager", "Admin"])),
    db: Session = Depends(get_db)
):
    """Allow a technician or manager to self-claim and accept an unassigned request from the facility queue."""
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    if req.status not in [RequestStatus.SUBMITTED.value, RequestStatus.UNDER_REVIEW.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot claim a request currently in '{req.status}' state."
        )

    current_status = RequestStatus(req.status)
    validate_transition(current_status, RequestStatus.ACCEPTED)

    from_status = req.status
    req.assigned_technician_id = membership.user_id
    req.status = RequestStatus.ACCEPTED.value

    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=from_status,
        to_status=RequestStatus.ACCEPTED.value,
        action="TECHNICIAN_CLAIMED",
        comment=f"Work order claimed from facility queue by {membership.user.full_name}."
    )
    db.add(history)

    notification_service.notify_role(
        db=db,
        organization_id=membership.organization_id,
        role="Manager",
        title=f"Work Order Claimed: {req.request_number}",
        message=f"{membership.user.full_name} claimed {req.title} directly from the facility open queue.",
        notification_type="CLAIMED",
        request_id=req.id
    )

    db.commit()
    
    return (
        db.query(MaintenanceRequest)
        .options(
            joinedload(MaintenanceRequest.requester),
            joinedload(MaintenanceRequest.assigned_technician),
            joinedload(MaintenanceRequest.location),
            joinedload(MaintenanceRequest.asset),
            selectinload(MaintenanceRequest.attachments),
            selectinload(MaintenanceRequest.work_logs),
            selectinload(MaintenanceRequest.materials),
            selectinload(MaintenanceRequest.status_history),
            selectinload(MaintenanceRequest.feedback),
        )
        .filter(MaintenanceRequest.id == req.id)
        .first()
    )

@router.post("/{id}/accept", response_model=MaintenanceRequestResponse)
def accept_assignment(
    id: str,
    membership: Membership = Depends(require_roles(["Technician", "Manager", "Admin"])),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    if membership.role == "Technician" and req.assigned_technician_id != membership.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only accept requests assigned directly to you."
        )

    current_status = RequestStatus(req.status)
    validate_transition(current_status, RequestStatus.ACCEPTED)

    from_status = req.status
    req.status = RequestStatus.ACCEPTED.value

    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=from_status,
        to_status=RequestStatus.ACCEPTED.value,
        action="ASSIGNMENT_ACCEPTED",
        comment=f"Assignment accepted by {membership.user.full_name}."
    )
    db.add(history)

    # Notify managers
    notification_service.notify_role(
        db=db,
        organization_id=membership.organization_id,
        role="Manager",
        title=f"Assignment Accepted: {req.request_number}",
        message=f"{membership.user.full_name} accepted {req.title}.",
        notification_type="ACCEPTED",
        request_id=req.id
    )

    db.commit()
    db.refresh(req)
    return req

@router.post("/{id}/decline", response_model=MaintenanceRequestResponse)
def decline_assignment(
    id: str,
    reason: Optional[str] = Query(None),
    membership: Membership = Depends(require_roles(["Technician"])),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    if req.assigned_technician_id != membership.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only decline requests assigned directly to you."
        )

    current_status = RequestStatus(req.status)
    validate_transition(current_status, RequestStatus.UNDER_REVIEW)

    from_status = req.status
    req.status = RequestStatus.UNDER_REVIEW.value
    prev_tech_id = req.assigned_technician_id
    req.assigned_technician_id = None

    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=from_status,
        to_status=RequestStatus.UNDER_REVIEW.value,
        action="ASSIGNMENT_DECLINED",
        comment=f"Declined by technician. Reason: {reason or 'Unavailable / scheduling conflict'}."
    )
    db.add(history)

    # Notify managers for reassignment
    notification_service.notify_role(
        db=db,
        organization_id=membership.organization_id,
        role="Manager",
        title=f"Assignment Declined: {req.request_number}",
        message=f"{membership.user.full_name} declined {req.title}. Reason: {reason or 'Scheduling'}",
        notification_type="DECLINED",
        request_id=req.id
    )

    db.commit()
    db.refresh(req)
    return req

@router.post("/{id}/start", response_model=MaintenanceRequestResponse)
def start_work(
    id: str,
    membership: Membership = Depends(require_roles(["Technician", "Manager", "Admin"])),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    current_status = RequestStatus(req.status)
    validate_transition(current_status, RequestStatus.IN_PROGRESS)

    from_status = req.status
    req.status = RequestStatus.IN_PROGRESS.value

    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=from_status,
        to_status=RequestStatus.IN_PROGRESS.value,
        action="WORK_STARTED",
        comment="Technician initiated work on-site."
    )
    db.add(history)

    # Notify requester
    notification_service.create_notification(
        db=db,
        organization_id=membership.organization_id,
        recipient_id=req.requester_id,
        title=f"Work In Progress: {req.request_number}",
        message=f"Technician {membership.user.full_name} has started work on your request: {req.title}.",
        notification_type="WORK_STARTED",
        request_id=req.id
    )

    db.commit()
    db.refresh(req)
    return req

@router.post("/{id}/work-logs", response_model=WorkLogResponse)
def add_work_log(
    id: str,
    data: WorkLogCreate,
    membership: Membership = Depends(require_roles(["Technician", "Manager", "Admin"])),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    log = WorkLog(
        request_id=req.id,
        technician_id=membership.user_id,
        diagnosis=data.diagnosis,
        actions_taken=data.actions_taken.strip(),
        hours_spent=data.hours_spent
    )
    db.add(log)

    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=req.status,
        to_status=req.status,
        action="WORK_LOG_ADDED",
        comment=f"Logged {data.hours_spent}h: {data.actions_taken[:80]}..."
    )
    db.add(history)

    db.commit()
    db.refresh(log)
    return log

@router.post("/{id}/materials", response_model=MaterialUsageResponse)
def add_material_usage(
    id: str,
    data: MaterialUsageCreate,
    membership: Membership = Depends(require_roles(["Technician", "Manager", "Admin"])),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    material = MaterialUsage(
        request_id=req.id,
        technician_id=membership.user_id,
        item_name=data.item_name.strip(),
        quantity=data.quantity,
        unit=data.unit,
        cost=data.cost
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material

@router.post("/{id}/complete", response_model=MaintenanceRequestResponse)
def submit_completion(
    id: str,
    data: SubmitCompletionRequest,
    membership: Membership = Depends(require_roles(["Technician", "Manager", "Admin"])),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    current_status = RequestStatus(req.status)
    validate_transition(current_status, RequestStatus.AWAITING_VERIFICATION)

    from_status = req.status
    req.status = RequestStatus.AWAITING_VERIFICATION.value
    req.completion_summary = data.completion_summary.strip()

    # If technician provided work log details in completion form, log it
    if data.actions_taken:
        log = WorkLog(
            request_id=req.id,
            technician_id=membership.user_id,
            diagnosis=data.diagnosis,
            actions_taken=data.actions_taken.strip(),
            hours_spent=data.hours_spent or 0.0
        )
        db.add(log)

    history = RequestStatusHistory(
        request_id=req.id,
        actor_id=membership.user_id,
        from_status=from_status,
        to_status=RequestStatus.AWAITING_VERIFICATION.value,
        action="COMPLETION_SUBMITTED",
        comment=f"Completion report: {data.completion_summary[:100]}..."
    )
    db.add(history)

    # Notify Requester to verify work
    notification_service.create_notification(
        db=db,
        organization_id=membership.organization_id,
        recipient_id=req.requester_id,
        title=f"Verification Required: {req.request_number}",
        message=f"Technician {membership.user.full_name} completed work on: {req.title}. Please review and confirm resolution.",
        notification_type="COMPLETED",
        request_id=req.id
    )

    # Also notify managers
    notification_service.notify_role(
        db=db,
        organization_id=membership.organization_id,
        role="Manager",
        title=f"Work Completed: {req.request_number}",
        message=f"{req.title} completed by {membership.user.full_name}. Awaiting customer verification.",
        notification_type="COMPLETED",
        request_id=req.id
    )

    db.commit()
    db.refresh(req)
    return req

@router.post("/{id}/verify", response_model=MaintenanceRequestResponse)
def verify_resolution(
    id: str,
    data: VerifyResolutionRequest,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    # Only requester or Manager/Admin can verify
    if membership.role == "Customer" and req.requester_id != membership.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    current_status = RequestStatus(req.status)
    from_status = req.status

    if data.confirmed:
        validate_transition(current_status, RequestStatus.CLOSED)
        req.status = RequestStatus.CLOSED.value
        req.closed_at = datetime.now(timezone.utc)

        history = RequestStatusHistory(
            request_id=req.id,
            actor_id=membership.user_id,
            from_status=from_status,
            to_status=RequestStatus.CLOSED.value,
            action="VERIFIED_AND_CLOSED",
            comment="Customer confirmed resolution. Request successfully closed."
        )
        db.add(history)

        # Record feedback if provided
        if data.feedback_rating:
            feedback = Feedback(
                request_id=req.id,
                customer_id=membership.user_id,
                rating=data.feedback_rating,
                comments=data.feedback_comments
            )
            db.add(feedback)

        # Notify assigned technician and managers
        if req.assigned_technician_id:
            notification_service.create_notification(
                db=db,
                organization_id=membership.organization_id,
                recipient_id=req.assigned_technician_id,
                title=f"Work Verified & Closed: {req.request_number}",
                message=f"Customer verified resolution for {req.title}. Great job!",
                notification_type="VERIFIED",
                request_id=req.id
            )

    else:
        # Reopening
        validate_transition(current_status, RequestStatus.REOPENED)
        if not data.reopen_reason or len(data.reopen_reason.strip()) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A detailed reason is required when reopening a request."
            )

        req.status = RequestStatus.REOPENED.value
        req.reopen_reason = data.reopen_reason.strip()
        req.reopen_count += 1

        history = RequestStatusHistory(
            request_id=req.id,
            actor_id=membership.user_id,
            from_status=from_status,
            to_status=RequestStatus.REOPENED.value,
            action="REQUEST_REOPENED",
            comment=f"Customer reopened request. Reason: {data.reopen_reason.strip()}"
        )
        db.add(history)

        # Alert Manager and Technician
        notification_service.notify_role(
            db=db,
            organization_id=membership.organization_id,
            role="Manager",
            title=f"Request Reopened: {req.request_number}",
            message=f"{membership.user.full_name} reopened {req.title}. Reason: {data.reopen_reason[:80]}",
            notification_type="REOPENED",
            request_id=req.id
        )
        if req.assigned_technician_id:
            notification_service.create_notification(
                db=db,
                organization_id=membership.organization_id,
                recipient_id=req.assigned_technician_id,
                title=f"Work Reopened: {req.request_number}",
                message=f"Customer reopened {req.title}: {data.reopen_reason[:80]}",
                notification_type="REOPENED",
                request_id=req.id
            )

    db.commit()
    db.refresh(req)
    return req

@router.post("/{id}/feedback", response_model=FeedbackResponse)
def submit_feedback(
    id: str,
    data: FeedbackCreate,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    req = (
        db.query(MaintenanceRequest)
        .filter(
            MaintenanceRequest.id == id,
            MaintenanceRequest.organization_id == membership.organization_id
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    if req.status != RequestStatus.CLOSED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback can only be provided for closed requests."
        )

    if membership.role == "Customer" and req.requester_id != membership.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    existing_feedback = db.query(Feedback).filter(Feedback.request_id == req.id).first()
    if existing_feedback:
        existing_feedback.rating = data.rating
        existing_feedback.comments = data.comments
        db.commit()
        db.refresh(existing_feedback)
        return existing_feedback

    feedback = Feedback(
        request_id=req.id,
        customer_id=membership.user_id,
        rating=data.rating,
        comments=data.comments
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
