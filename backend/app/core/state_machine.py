from enum import Enum
from typing import Dict, Set

class RequestStatus(str, Enum):
    SUBMITTED = "Submitted"
    UNDER_REVIEW = "Under Review"
    ASSIGNED = "Assigned"
    ACCEPTED = "Accepted"
    IN_PROGRESS = "In Progress"
    AWAITING_VERIFICATION = "Awaiting Verification"
    REOPENED = "Reopened"
    CLOSED = "Closed"
    CANCELLED = "Cancelled"

class RequestPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

class UserRole(str, Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    TECHNICIAN = "Technician"
    CUSTOMER = "Customer"

VALID_TRANSITIONS: Dict[RequestStatus, Set[RequestStatus]] = {
    RequestStatus.SUBMITTED: {
        RequestStatus.UNDER_REVIEW,
        RequestStatus.ASSIGNED,
        RequestStatus.ACCEPTED,
        RequestStatus.CANCELLED
    },
    RequestStatus.UNDER_REVIEW: {
        RequestStatus.ASSIGNED,
        RequestStatus.ACCEPTED,
        RequestStatus.CANCELLED
    },
    RequestStatus.ASSIGNED: {
        RequestStatus.ACCEPTED,
        RequestStatus.UNDER_REVIEW, # if technician declines or manager reassigns
        RequestStatus.CANCELLED
    },
    RequestStatus.ACCEPTED: {
        RequestStatus.IN_PROGRESS,
        RequestStatus.UNDER_REVIEW,
        RequestStatus.CANCELLED
    },
    RequestStatus.IN_PROGRESS: {
        RequestStatus.AWAITING_VERIFICATION,
        RequestStatus.CANCELLED
    },
    RequestStatus.AWAITING_VERIFICATION: {
        RequestStatus.CLOSED,
        RequestStatus.REOPENED
    },
    RequestStatus.REOPENED: {
        RequestStatus.UNDER_REVIEW,
        RequestStatus.ASSIGNED,
        RequestStatus.IN_PROGRESS,
        RequestStatus.AWAITING_VERIFICATION,
        RequestStatus.CANCELLED
    },
    RequestStatus.CLOSED: set(),
    RequestStatus.CANCELLED: set()
}

def can_transition(current: RequestStatus, target: RequestStatus) -> bool:
    if current == target:
        return True
    return target in VALID_TRANSITIONS.get(current, set())

def validate_transition(current: RequestStatus, target: RequestStatus) -> None:
    if not can_transition(current, target):
        raise ValueError(
            f"Invalid status transition from '{current.value}' to '{target.value}'."
        )
