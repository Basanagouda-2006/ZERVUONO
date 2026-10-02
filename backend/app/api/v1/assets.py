from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.organization import Membership
from app.models.asset import Asset
from app.models.audit import AuditEvent
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.api.deps import get_current_membership, require_roles

router = APIRouter()

@router.get("/", response_model=List[AssetResponse])
def list_assets(
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    location_id: Optional[str] = None,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    query = db.query(Asset).filter(Asset.organization_id == membership.organization_id)
    if category:
        query = query.filter(Asset.category == category)
    if status_filter:
        query = query.filter(Asset.status == status_filter)
    if location_id:
        query = query.filter(Asset.location_id == location_id)
    return query.order_by(Asset.name.asc()).all()

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    data: AssetCreate,
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    # Check asset tag uniqueness in org
    existing = db.query(Asset).filter(
        Asset.organization_id == membership.organization_id,
        Asset.asset_tag == data.asset_tag.strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Asset tag '{data.asset_tag}' already exists in this organization."
        )

    asset = Asset(
        organization_id=membership.organization_id,
        name=data.name.strip(),
        asset_tag=data.asset_tag.strip(),
        category=data.category,
        location_id=data.location_id,
        manufacturer=data.manufacturer,
        model=data.model,
        serial_number=data.serial_number,
        installation_date=data.installation_date,
        warranty_expiration=data.warranty_expiration,
        status=data.status or "Operational",
        criticality=data.criticality or "Medium",
        notes=data.notes
    )
    db.add(asset)

    audit = AuditEvent(
        organization_id=membership.organization_id,
        actor_id=membership.user_id,
        entity_type="ASSET",
        action="ASSET_CREATED",
        details=f"Created asset {asset.name} ({asset.asset_tag})"
    )
    db.add(audit)
    db.commit()
    db.refresh(asset)
    return asset

@router.get("/{id}", response_model=AssetResponse)
def get_asset(
    id: str,
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(
        Asset.id == id,
        Asset.organization_id == membership.organization_id
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    return asset

@router.put("/{id}", response_model=AssetResponse)
def update_asset(
    id: str,
    data: AssetUpdate,
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    asset = db.query(Asset).filter(
        Asset.id == id,
        Asset.organization_id == membership.organization_id
    ).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")

    if data.name is not None:
        asset.name = data.name.strip()
    if data.asset_tag is not None:
        asset.asset_tag = data.asset_tag.strip()
    if data.category is not None:
        asset.category = data.category
    if data.location_id is not None:
        asset.location_id = data.location_id
    if data.manufacturer is not None:
        asset.manufacturer = data.manufacturer
    if data.model is not None:
        asset.model = data.model
    if data.serial_number is not None:
        asset.serial_number = data.serial_number
    if data.installation_date is not None:
        asset.installation_date = data.installation_date
    if data.warranty_expiration is not None:
        asset.warranty_expiration = data.warranty_expiration
    if data.status is not None:
        asset.status = data.status
    if data.criticality is not None:
        asset.criticality = data.criticality
    if data.notes is not None:
        asset.notes = data.notes

    db.commit()
    db.refresh(asset)
    return asset
