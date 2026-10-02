from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.db.session import SessionLocal, init_tables
from app.models.user import User
from app.models.organization import Organization, Membership
from app.models.location import Location
from app.models.asset import Asset
from app.models.request import (
    MaintenanceRequest,
    RequestStatusHistory,
    WorkLog,
    MaterialUsage,
    Feedback,
)
from app.models.preventive import PreventiveMaintenancePlan
from app.models.notification import Notification
from app.models.audit import AuditEvent

def seed_database():
    init_tables()
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        existing_org = db.query(Organization).filter(Organization.slug == "apex-logistics").first()
        if existing_org:
            print("Database already contains seed organization 'Apex Logistics'. Skipping.")
            return

        print("Seeding database with realistic SaaS maintenance data...")

        # 1. Organization
        org = Organization(
            name="Apex Logistics & Warehousing",
            slug="apex-logistics",
            domain="apexlogistics.com",
            is_active=True
        )
        db.add(org)
        db.flush()

        password_hash = get_password_hash("Password123!")

        # 2. Users across 4 connected roles
        admin = User(
            email="admin@zervuno.com",
            hashed_password=password_hash,
            full_name="Sarah Jenkins",
            phone="+1 (555) 234-5678",
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
            is_active=True,
            is_verified=True
        )
        manager = User(
            email="manager@zervuno.com",
            hashed_password=password_hash,
            full_name="David Miller",
            phone="+1 (555) 345-6789",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            is_active=True,
            is_verified=True
        )
        technician = User(
            email="tech@zervuno.com",
            hashed_password=password_hash,
            full_name="Alex Vance",
            phone="+1 (555) 456-7890",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            is_active=True,
            is_verified=True
        )
        customer = User(
            email="customer@zervuno.com",
            hashed_password=password_hash,
            full_name="Elena Rostova",
            phone="+1 (555) 567-8901",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            is_active=True,
            is_verified=True
        )
        db.add_all([admin, manager, technician, customer])
        db.flush()

        # Memberships
        m_admin = Membership(user_id=admin.id, organization_id=org.id, role="Admin", title="Operations Director", is_active=True)
        m_manager = Membership(user_id=manager.id, organization_id=org.id, role="Manager", title="Facilities Maintenance Lead", is_active=True)
        m_tech = Membership(user_id=technician.id, organization_id=org.id, role="Technician", title="Senior Electro-Mechanical Specialist", is_active=True)
        m_cust = Membership(user_id=customer.id, organization_id=org.id, role="Customer", title="Warehouse Operations Supervisor", is_active=True)
        db.add_all([m_admin, m_manager, m_tech, m_cust])
        db.flush()

        # 3. Locations
        loc1 = Location(organization_id=org.id, name="North Wing - Logistics Hub", building="Building A", floor="Ground", room="Main Bay", address="100 Logistics Way, Bay 1-12", is_active=True)
        loc2 = Location(organization_id=org.id, name="Central Distribution Facility", building="Building B", floor="2nd Floor", room="Control Station", address="104 Logistics Way", is_active=True)
        loc3 = Location(organization_id=org.id, name="South Cold Storage Depot", building="Building C", floor="Basement", room="Chiller Plant", address="110 Logistics Way", is_active=True)
        db.add_all([loc1, loc2, loc3])
        db.flush()

        # 4. Assets
        asset1 = Asset(
            organization_id=org.id,
            location_id=loc3.id,
            name="Industrial Ammonia Chiller Unit #1",
            asset_tag="HVAC-CH-01",
            category="HVAC",
            manufacturer="Carrier Industrial",
            model="AquaEdge 19XR",
            serial_number="CR-892341",
            installation_date=date(2023, 4, 15),
            warranty_expiration=date(2028, 4, 15),
            status="Operational",
            criticality="High",
            notes="Critical for refrigerated perishable logistics food storage."
        )
        asset2 = Asset(
            organization_id=org.id,
            location_id=loc1.id,
            name="Electric Forklift Yale ERP030",
            asset_tag="FL-04",
            category="Mechanical",
            manufacturer="Yale Materials Handling",
            model="ERP030-VT",
            serial_number="YL-774910",
            installation_date=date(2024, 1, 10),
            warranty_expiration=date(2027, 1, 10),
            status="Operational",
            criticality="Medium",
            notes="Assigned to North Wing loading docks."
        )
        asset3 = Asset(
            organization_id=org.id,
            location_id=loc2.id,
            name="High-Speed Sorting Conveyor Belt B",
            asset_tag="CONV-B-02",
            category="Mechanical",
            manufacturer="Dematic",
            model="FlexSort Pro",
            serial_number="DM-449102",
            installation_date=date(2023, 8, 20),
            status="Operational",
            criticality="Critical"
        )
        db.add_all([asset1, asset2, asset3])
        db.flush()

        now = datetime.now(timezone.utc)

        # 5. Maintenance Requests across lifecycle
        # Request 1: Closed with verification and feedback
        req1 = MaintenanceRequest(
            organization_id=org.id,
            request_number="REQ-1001",
            title="Perimeter Chiller temperature sensor erratic readings",
            description="Chiller Unit #1 shows temperature spike alarms during peak shift hours. Cooling loop pressure fluctuates intermittently.",
            category="HVAC",
            priority="High",
            status="Closed",
            requester_id=customer.id,
            location_id=loc3.id,
            location_details="Chiller Plant Room B, Panel 3",
            asset_id=asset1.id,
            assigned_technician_id=technician.id,
            due_date=now - timedelta(days=2),
            manager_instructions="Please check thermocouple calibration and refrigerant expansion valve.",
            completion_summary="Calibrated thermistor probe T-104 and tightened sensor mounting clip. Recharged 1.2kg R-134a refrigerant. Pressure normalized at 42 PSI.",
            closed_at=now - timedelta(days=1),
            created_at=now - timedelta(days=4)
        )
        db.add(req1)
        db.flush()

        # Work logs for Req 1
        db.add(WorkLog(
            request_id=req1.id,
            technician_id=technician.id,
            diagnosis="Thermocouple probe T-104 had thermal grease degradation and minor loose wiring clip causing intermittent resistance shifts.",
            actions_taken="Replaced thermal paste, seated wiring clip securely, purged and recharged refrigerant loop.",
            hours_spent=3.5,
            created_at=now - timedelta(days=2)
        ))
        db.add(MaterialUsage(
            request_id=req1.id,
            technician_id=technician.id,
            item_name="Industrial Thermal Compound 50g",
            quantity=1.0,
            unit="tube",
            cost=28.50,
            created_at=now - timedelta(days=2)
        ))
        db.add(MaterialUsage(
            request_id=req1.id,
            technician_id=technician.id,
            item_name="R-134a Refrigerant Gas",
            quantity=1.2,
            unit="kg",
            cost=64.00,
            created_at=now - timedelta(days=2)
        ))
        db.add(Feedback(
            request_id=req1.id,
            customer_id=customer.id,
            rating=5,
            comments="Excellent turnaround time! Chiller temperature is rock steady at 2.4°C throughout the night shift.",
            created_at=now - timedelta(days=1)
        ))

        # Request 2: Awaiting Verification (Technician completed work, awaiting customer confirmation)
        req2 = MaintenanceRequest(
            organization_id=org.id,
            request_number="REQ-1002",
            title="Conveyor Belt B alignment tracking sensor fault",
            description="Conveyor line B halted automatically due to belt edge skewing error sensor E-401 triggering.",
            category="Mechanical",
            priority="Urgent",
            status="Awaiting Verification",
            requester_id=customer.id,
            location_id=loc2.id,
            location_details="Main Sortation Line 2",
            asset_id=asset3.id,
            assigned_technician_id=technician.id,
            due_date=now + timedelta(hours=6),
            manager_instructions="High priority parcel line. Realign guide rollers immediately.",
            completion_summary="Adjusted tension roller turnbuckles by 4.2mm. Cleared plastic strapping debris wedged in idler bearing. Tested 50-parcel test run with zero deviation.",
            created_at=now - timedelta(days=1)
        )
        db.add(req2)
        db.flush()

        db.add(WorkLog(
            request_id=req2.id,
            technician_id=technician.id,
            diagnosis="Debris entanglement in idler pulley caused tracking drift.",
            actions_taken="Cleared foreign debris, adjusted tracking turnbuckles, ran 30-minute stress test.",
            hours_spent=2.0,
            created_at=now - timedelta(hours=3)
        ))

        # Request 3: In Progress (Technician currently working)
        req3 = MaintenanceRequest(
            organization_id=org.id,
            request_number="REQ-1003",
            title="Forklift FL-04 hydraulic mast lift stuttering",
            description="When hoisting loads over 1,500 lbs, the hydraulic mast exhibits vibration and hesitation.",
            category="Mechanical",
            priority="Medium",
            status="In Progress",
            requester_id=customer.id,
            location_id=loc1.id,
            location_details="Loading Dock 4 Maintenance Bay",
            asset_id=asset2.id,
            assigned_technician_id=technician.id,
            due_date=now + timedelta(days=1),
            manager_instructions="Inspect hydraulic fluid level and filter cartridge for particulate contamination.",
            created_at=now - timedelta(hours=8)
        )
        db.add(req3)
        db.flush()

        db.add(WorkLog(
            request_id=req3.id,
            technician_id=technician.id,
            diagnosis="Hydraulic fluid filter has high pressure differential. Oil shows minor emulsification.",
            actions_taken="Draining hydraulic reservoir and replacing high-pressure 10-micron cartridge filter.",
            hours_spent=1.5,
            created_at=now - timedelta(hours=2)
        ))

        # Request 4: Submitted (Fresh customer request ready for manager review & assignment)
        req4 = MaintenanceRequest(
            organization_id=org.id,
            request_number="REQ-1004",
            title="Overhead LED High-Bay fixture flickering in Aisle 7",
            description="Row of 4 LED fixtures over pallet rack 7B is buzzing loudly and strobing, creating poor visibility for forklift drivers.",
            category="Electrical",
            priority="Medium",
            status="Submitted",
            requester_id=customer.id,
            location_id=loc1.id,
            location_details="Warehouse Main Hall, Aisle 7, Bay B",
            created_at=now - timedelta(hours=1)
        )
        db.add(req4)
        db.flush()

        # Status Histories
        db.add(RequestStatusHistory(request_id=req4.id, actor_id=customer.id, from_status=None, to_status="Submitted", action="REQUEST_CREATED", comment="Initial report submitted."))

        # 6. Preventive Maintenance Plans
        plan1 = PreventiveMaintenancePlan(
            organization_id=org.id,
            title="Monthly Chiller Compressor & Oil Inspection",
            description="Inspect compressor vibration levels, check oil sight glass, test high/low pressure cutouts.",
            asset_id=asset1.id,
            location_id=loc3.id,
            frequency="Monthly",
            assigned_technician_id=technician.id,
            checklist="1. Verify oil level in sight glass\n2. Inspect refrigerant lines for weeping\n3. Test emergency relief valve\n4. Measure compressor amp draw",
            is_active=True,
            next_due_date=date.today() + timedelta(days=14)
        )
        plan2 = PreventiveMaintenancePlan(
            organization_id=org.id,
            title="Quarterly Conveyor Belt Roller Lubrication & Alignment",
            description="Grease all drive bearings, inspect belt lace, verify emergency pull-cord switches.",
            asset_id=asset3.id,
            location_id=loc2.id,
            frequency="Quarterly",
            assigned_technician_id=technician.id,
            checklist="1. LOTO electrical isolator\n2. Grease 18 idler bearings with Mobilith SHC\n3. Inspect belt seams\n4. Test e-stop lanyard cord",
            is_active=True,
            next_due_date=date.today() + timedelta(days=28)
        )
        db.add_all([plan1, plan2])

        # 7. Notifications
        db.add(Notification(
            organization_id=org.id,
            recipient_id=customer.id,
            title="Verification Required: REQ-1002",
            message="Technician Alex Vance completed repairs on Conveyor Belt B. Please verify.",
            notification_type="COMPLETED",
            request_id=req2.id,
            is_read=False
        ))
        db.add(Notification(
            organization_id=org.id,
            recipient_id=manager.id,
            title="New Request: REQ-1004",
            message="Elena Rostova reported: Overhead LED High-Bay fixture flickering in Aisle 7",
            notification_type="REQUEST_CREATED",
            request_id=req4.id,
            is_read=False
        ))

        # 8. Audit event
        db.add(AuditEvent(
            organization_id=org.id,
            actor_id=admin.id,
            entity_type="SYSTEM",
            action="ORGANIZATION_INITIALIZED",
            details="System seeded with operational accounts and baseline infrastructure."
        ))

        db.commit()
        print("Successfully seeded Zervuno database!")
        print("Demo Accounts:")
        print("  - Admin:      admin@zervuno.com     / Password123!")
        print("  - Manager:    manager@zervuno.com   / Password123!")
        print("  - Technician: tech@zervuno.com      / Password123!")
        print("  - Customer:   customer@zervuno.com  / Password123!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
