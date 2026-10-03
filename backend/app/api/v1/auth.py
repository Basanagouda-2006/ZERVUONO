from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
import re

from app.core.config import settings
from app.core.security import (
    verify_password,
    get_password_hash,
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    generate_random_token,
)
from app.db.session import get_db
from app.models.user import User, UserSession, TokenRecord
from app.models.organization import Organization, Membership
from app.models.audit import AuditEvent
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserAuthSummary,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from app.api.deps import get_current_user

router = APIRouter()

def create_slug(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", name.strip().lower()).strip("-")
    return slug or "org"

@router.post("/register", response_model=TokenResponse)
def register(
    data: RegisterRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    # 1. Validate password strength
    is_valid, err_msg = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    # 2. Check existing user
    email_clean = data.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # 3. Create user
    hashed = get_password_hash(data.password)
    user = User(
        email=email_clean,
        hashed_password=hashed,
        full_name=data.full_name.strip(),
        phone=data.phone,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    # 4. Determine role & title
    valid_roles = ["Admin", "Manager", "Technician", "Customer"]
    if data.role and data.role in valid_roles:
        user_role = data.role
    elif data.organization_name and data.organization_name.strip():
        user_role = "Admin"
    else:
        user_role = "Customer"
    title_map = {
        "Admin": "Organization Administrator",
        "Manager": "Operations & Maintenance Manager",
        "Technician": "Field Service Technician",
        "Customer": "Requester / Client"
    }

    # Handle organization creation or onboarding
    org = None
    if data.organization_name and data.organization_name.strip():
        req_name = data.organization_name.strip()
        org = db.query(Organization).filter(
            (Organization.name.ilike(req_name)) | (Organization.slug == create_slug(req_name))
        ).first()
        if not org:
            base_slug = create_slug(req_name)
            slug = base_slug
            counter = 1
            while db.query(Organization).filter(Organization.slug == slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            org = Organization(name=req_name, slug=slug, is_active=True)
            db.add(org)
            db.flush()
    else:
        # Check if an active organization already exists to attach to
        org = db.query(Organization).filter(Organization.is_active == True).first()
        if not org:
            org_name = f"{data.full_name}'s Organization"
            base_slug = create_slug(org_name)
            slug = base_slug
            counter = 1
            while db.query(Organization).filter(Organization.slug == slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            org = Organization(name=org_name, slug=slug, is_active=True)
            db.add(org)
            db.flush()

    # Create membership with the user's chosen role
    membership = Membership(
        user_id=user.id,
        organization_id=org.id,
        role=user_role,
        title=title_map.get(user_role, "Team Member"),
        is_active=True
    )
    db.add(membership)

    # Audit log
    audit = AuditEvent(
        organization_id=org.id,
        actor_id=user.id,
        entity_type="AUTH",
        entity_id=user.id,
        action="USER_REGISTERED",
        details=f"User {user.email} registered as {user_role} in organization {org.name}",
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    # 5. Issue token
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)

    # Set secure HttpOnly cookie
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserAuthSummary(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_verified=user.is_verified,
            organization_id=org.id,
            organization_name=org.name,
            role=membership.role
        )
    )

@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db)
):
    email_clean = data.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact your organization administrator."
        )

    membership = db.query(Membership).filter(
        Membership.user_id == user.id,
        Membership.is_active == True
    ).first()

    org_id = membership.organization_id if membership else None
    org_name = None
    role = membership.role if membership else None

    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            org_name = org.name

    access_token = create_access_token(subject=user.id)
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    # Record login in audit log if org exists
    if org_id:
        audit = AuditEvent(
            organization_id=org_id,
            actor_id=user.id,
            entity_type="AUTH",
            entity_id=user.id,
            action="USER_LOGIN",
            details=f"User {user.email} signed in successfully",
            ip_address=request.client.host if request.client else None
        )
        db.add(audit)
        db.commit()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserAuthSummary(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_verified=user.is_verified,
            organization_id=org_id,
            organization_name=org_name,
            role=role
        )
    )

@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user)):
    response.delete_cookie(key=settings.COOKIE_NAME, path="/")
    return {"message": "Successfully logged out."}

@router.get("/me", response_model=UserAuthSummary)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = db.query(Membership).filter(
        Membership.user_id == current_user.id,
        Membership.is_active == True
    ).first()

    org_id = membership.organization_id if membership else None
    org_name = None
    role = membership.role if membership else None

    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            org_name = org.name

    return UserAuthSummary(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        organization_id=org_id,
        organization_name=org_name,
        role=role
    )

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = data.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    # Always return success message to prevent user enumeration
    if not user:
        return {"message": "If an account with that email exists, reset instructions have been generated."}

    token = generate_random_token(32)
    token_record = TokenRecord(
        user_id=user.id,
        token=token,
        token_type="password_reset",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=2)
    )
    db.add(token_record)
    db.commit()

    return {
        "message": "If an account with that email exists, reset instructions have been generated.",
        "dev_token": token if settings.ENVIRONMENT == "development" else None
    }

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    is_valid, err_msg = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    token_record = db.query(TokenRecord).filter(
        TokenRecord.token == data.token,
        TokenRecord.token_type == "password_reset",
        TokenRecord.used_at == None,
        TokenRecord.expires_at > datetime.now(timezone.utc)
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.hashed_password = get_password_hash(data.new_password)
    token_record.used_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Password has been successfully updated. You can now sign in."}

@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match."
        )

    is_valid, err_msg = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    return {"message": "Password updated successfully."}
