from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
import re

from app.core.security import generate_random_token, get_password_hash, validate_password_strength
from app.db.session import get_db
from app.models.user import User
from app.models.organization import Organization, Membership, Invitation
from app.models.audit import AuditEvent
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationPublic,
    MembershipResponse,
    InvitationCreate,
    InvitationResponse,
    AcceptInvitationRequest,
)
from app.schemas.user import UserResponse
from app.api.deps import get_current_user, get_current_membership, require_roles

router = APIRouter()

def create_slug(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    return slug or "org"

@router.get("/public-list", response_model=List[OrganizationPublic])
def get_public_organizations(db: Session = Depends(get_db)):
    """Retrieve list of active organizations for user registration and workspace discovery."""
    return db.query(Organization).filter(Organization.is_active == True).order_by(Organization.name.asc()).all()

@router.get("/my-organizations", response_model=List[OrganizationResponse])
def get_my_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.is_active == True
    ).all()
    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all()
    return orgs

@router.post("/", response_model=OrganizationResponse)
def create_organization(
    data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    base_slug = data.slug or create_slug(data.name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(
        name=data.name.strip(),
        slug=slug,
        domain=data.domain,
        is_active=True
    )
    db.add(org)
    db.flush()

    # Current user becomes Admin of newly created organization
    membership = Membership(
        user_id=current_user.id,
        organization_id=org.id,
        role="Admin",
        title="Owner",
        is_active=True
    )
    db.add(membership)

    audit = AuditEvent(
        organization_id=org.id,
        actor_id=current_user.id,
        entity_type="ORGANIZATION",
        entity_id=org.id,
        action="ORGANIZATION_CREATED",
        details=f"Organization {org.name} created by {current_user.email}"
    )
    db.add(audit)
    db.commit()
    db.refresh(org)
    return org

@router.get("/current", response_model=OrganizationResponse)
def get_current_organization(
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == membership.organization_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org

@router.put("/current", response_model=OrganizationResponse)
def update_current_organization(
    data: OrganizationUpdate,
    membership: Membership = Depends(require_roles(["Admin"])),
    db: Session = Depends(get_db)
):
    org = db.query(Organization).filter(Organization.id == membership.organization_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    if data.name is not None:
        org.name = data.name.strip()
    if data.domain is not None:
        org.domain = data.domain
    if data.settings is not None:
        org.settings = data.settings
    if data.logo_url is not None:
        org.logo_url = data.logo_url

    db.commit()
    db.refresh(org)
    return org

@router.get("/members", response_model=List[MembershipResponse])
def get_organization_members(
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    members = (
        db.query(Membership)
        .options(joinedload(Membership.user))
        .filter(Membership.organization_id == membership.organization_id)
        .all()
    )
    return members

@router.get("/technicians", response_model=List[MembershipResponse])
def get_organization_technicians(
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    """Retrieve all technicians in the organization for task assignment."""
    technicians = (
        db.query(Membership)
        .options(joinedload(Membership.user))
        .filter(
            Membership.organization_id == membership.organization_id,
            Membership.role == "Technician",
            Membership.is_active == True
        )
        .all()
    )
    return technicians

@router.post("/invitations", response_model=InvitationResponse)
def invite_user(
    data: InvitationCreate,
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    # Only Admin can invite Admins and Managers
    if data.role in ["Admin", "Manager"] and membership.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can invite Managers or other Admins."
        )

    email_clean = data.email.lower().strip()
    # Check if already a member
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        existing_mem = db.query(Membership).filter(
            Membership.user_id == existing_user.id,
            Membership.organization_id == membership.organization_id
        ).first()
        if existing_mem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this organization."
            )

    token = generate_random_token(32)
    invitation = Invitation(
        organization_id=membership.organization_id,
        email=email_clean,
        role=data.role,
        token=token,
        invited_by_id=membership.user_id,
        status="Pending",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(invitation)

    audit = AuditEvent(
        organization_id=membership.organization_id,
        actor_id=membership.user_id,
        entity_type="USER",
        action="USER_INVITED",
        details=f"Invited {email_clean} as {data.role}"
    )
    db.add(audit)
    db.commit()
    db.refresh(invitation)
    return invitation

@router.get("/invitations", response_model=List[InvitationResponse])
def list_invitations(
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    invitations = (
        db.query(Invitation)
        .filter(Invitation.organization_id == membership.organization_id)
        .order_by(Invitation.created_at.desc())
        .all()
    )
    return invitations

@router.post("/accept-invitation")
def accept_invitation(
    data: AcceptInvitationRequest,
    db: Session = Depends(get_db)
):
    invitation = db.query(Invitation).filter(
        Invitation.token == data.token,
        Invitation.status == "Pending",
        Invitation.expires_at > datetime.now(timezone.utc)
    ).first()

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation token."
        )

    is_valid, err_msg = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # Find or create user
    user = db.query(User).filter(User.email == invitation.email).first()
    if not user:
        user = User(
            email=invitation.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name.strip(),
            is_active=True,
            is_verified=True
        )
        db.add(user)
        db.flush()

    # Create membership
    membership = Membership(
        user_id=user.id,
        organization_id=invitation.organization_id,
        role=invitation.role,
        is_active=True
    )
    db.add(membership)

    invitation.status = "Accepted"
    invitation.accepted_at = datetime.now(timezone.utc)

    audit = AuditEvent(
        organization_id=invitation.organization_id,
        actor_id=user.id,
        entity_type="USER",
        entity_id=user.id,
        action="INVITATION_ACCEPTED",
        details=f"User {user.email} joined as {invitation.role}"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Successfully joined organization as {invitation.role}. You can now sign in."}
