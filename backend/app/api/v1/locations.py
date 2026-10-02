from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.organization import Membership
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse
from app.api.deps import get_current_membership, require_roles

router = APIRouter()

@router.get("/", response_model=List[LocationResponse])
def list_locations(
    membership: Membership = Depends(get_current_membership),
    db: Session = Depends(get_db)
):
    return (
        db.query(Location)
        .filter(
            Location.organization_id == membership.organization_id,
            Location.is_active == True
        )
        .order_by(Location.name.asc())
        .all()
    )

@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    data: LocationCreate,
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    loc = Location(
        organization_id=membership.organization_id,
        name=data.name.strip(),
        building=data.building,
        floor=data.floor,
        room=data.room,
        address=data.address,
        is_active=True
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc

@router.put("/{id}", response_model=LocationResponse)
def update_location(
    id: str,
    data: LocationUpdate,
    membership: Membership = Depends(require_roles(["Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    loc = db.query(Location).filter(
        Location.id == id,
        Location.organization_id == membership.organization_id
    ).first()
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found.")

    if data.name is not None:
        loc.name = data.name.strip()
    if data.building is not None:
        loc.building = data.building
    if data.floor is not None:
        loc.floor = data.floor
    if data.room is not None:
        loc.room = data.room
    if data.address is not None:
        loc.address = data.address
    if data.is_active is not None:
        loc.is_active = data.is_active

    db.commit()
    db.refresh(loc)
    return loc
