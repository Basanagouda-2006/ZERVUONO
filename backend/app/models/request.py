from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid

class MaintenanceRequest(Base, TimestampMixin):
    __tablename__ = "maintenance_requests"
    __table_args__ = (
        UniqueConstraint("organization_id", "request_number", name="uq_org_request_number"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    request_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default="Medium", nullable=False) # Low, Medium, High, Urgent
    status: Mapped[str] = mapped_column(String(50), default="Submitted", index=True, nullable=False) # Follows state machine
    
    requester_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    location_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True, index=True)
    location_details: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    asset_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_technician_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    manager_instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completion_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reopen_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reopen_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="requests")
    requester: Mapped["User"] = relationship("User", foreign_keys=[requester_id])
    assigned_technician: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_technician_id])
    location: Mapped[Optional["Location"]] = relationship("Location", back_populates="requests")
    asset: Mapped[Optional["Asset"]] = relationship("Asset", back_populates="requests")
    
    status_history: Mapped[List["RequestStatusHistory"]] = relationship("RequestStatusHistory", back_populates="request", cascade="all, delete-orphan", order_by="RequestStatusHistory.created_at.desc()")
    work_logs: Mapped[List["WorkLog"]] = relationship("WorkLog", back_populates="request", cascade="all, delete-orphan", order_by="WorkLog.created_at.desc()")
    materials: Mapped[List["MaterialUsage"]] = relationship("MaterialUsage", back_populates="request", cascade="all, delete-orphan")
    attachments: Mapped[List["Attachment"]] = relationship("Attachment", back_populates="request", cascade="all, delete-orphan")
    feedback: Mapped[Optional["Feedback"]] = relationship("Feedback", back_populates="request", uselist=False, cascade="all, delete-orphan")

class RequestStatusHistory(Base):
    __tablename__ = "request_status_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    from_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    request: Mapped["MaintenanceRequest"] = relationship("MaintenanceRequest", back_populates="status_history")
    actor: Mapped[Optional["User"]] = relationship("User")

class WorkLog(Base):
    __tablename__ = "work_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    technician_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actions_taken: Mapped[str] = mapped_column(Text, nullable=False)
    hours_spent: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    request: Mapped["MaintenanceRequest"] = relationship("MaintenanceRequest", back_populates="work_logs")
    technician: Mapped["User"] = relationship("User")

class MaterialUsage(Base):
    __tablename__ = "material_usages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    technician_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), default="pcs", nullable=False)
    cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    request: Mapped["MaintenanceRequest"] = relationship("MaintenanceRequest", back_populates="materials")

class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    organization_id: Mapped[str] = mapped_column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    request_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("maintenance_requests.id", ondelete="CASCADE"), nullable=True, index=True)
    uploaded_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    attachment_type: Mapped[str] = mapped_column(String(50), default="Initial", nullable=False) # Initial, Before, After, Document
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    request: Mapped[Optional["MaintenanceRequest"]] = relationship("MaintenanceRequest", back_populates="attachments")
    uploader: Mapped["User"] = relationship("User")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("maintenance_requests.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False) # 1 to 5 stars
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    request: Mapped["MaintenanceRequest"] = relationship("MaintenanceRequest", back_populates="feedback")
    customer: Mapped["User"] = relationship("User")
