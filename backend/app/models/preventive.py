from datetime import date, datetime, timezone
from typing import Optional
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

class PreventiveMaintenancePlan(Base, TimestampMixin):
    __tablename__ = "preventive_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    asset_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True)
    location_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True, index=True)
    frequency: Mapped[str] = mapped_column(String(50), nullable=False) # Weekly, Monthly, Quarterly, Semi-Annual, Annual
    assigned_technician_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    checklist: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON checklist array
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    next_due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    last_generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    asset: Mapped[Optional["Asset"]] = relationship("Asset")
    location: Mapped[Optional["Location"]] = relationship("Location")
    assigned_technician: Mapped[Optional["User"]] = relationship("User")
