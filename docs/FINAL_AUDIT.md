# ZERVUONO — Final Production & Engineering Audit Report

**System Name:** ZERVUONO Facility & Maintenance Operations SaaS  
**Audit Date:** October 2026  
**Status:** Audit Passed & Production Hardened  
**Repository:** `https://github.com/Basanagouda-2006/ZERVUONO`  
**Live Frontend:** `https://zervuono.vercel.app`  
**Live Backend API:** `https://zervono-api.onrender.com`  
**Documentation Version:** 1.0.0 Final  

---

## 1. Executive Summary

ZERVUONO is an enterprise-grade, multi-tenant facility maintenance and operational workflow platform engineered for commercial facilities, logistics hubs, and residential complexes. It streamlines the full lifecycle of maintenance requests: from rapid mobile reporting and intelligent dispatching to field technician diagnostics, material tracking, proof-of-work capture, and customer verification.

This comprehensive audit verifies full-stack stability, database persistence, multi-role access controls, automated test suites, and zero-mock production data integrity across both local disposable environments and production cloud infrastructure.

```mermaid
flowchart LR
    A[Customer: Report Issue] --> B[Manager: Review & Assign]
    B --> C[Technician: Claim & Work]
    C --> D[Technician: Log Parts & Proof]
    D --> E[Technician: Submit Completion]
    E --> F[Customer: Verify Resolution]
    F -->|Approved| G[Status: Closed]
    F -->|Rejected| H[Status: Reopened]
    H --> B
```

---

## 2. Full-Stack Architecture & Component Audit

### 2.1 Technology Stack Matrix

| Layer | Component | Version / Specification | Role in System |
|---|---|---|---|
| **Frontend** | React + TypeScript | React 18.3, TypeScript 5.5 | Type-safe single-page application |
| **Build Tool** | Vite | Vite 5.4 | Fast HMR, production bundling |
| **Styling** | Tailwind CSS | v3.4 (Custom Command Hub tokens) | Responsive design, dark mode |
| **Data Fetching** | TanStack React Query | v5.56 | Server state cache, auto-polling (10-15s) |
| **Routing** | React Router DOM | v6.26 | Declarative client-side routing & guards |
| **Backend API** | FastAPI | Python 3.12, FastAPI 0.115 | High-performance asynchronous REST API |
| **ORM & DB** | SQLAlchemy + Alembic | SQLAlchemy 2.0, Alembic 1.13 | Object-relational mapping & schema migrations |
| **Database** | PostgreSQL | Neon Serverless PostgreSQL | ACID-compliant relational data store |
| **File Storage** | Hybrid Local + DB | PostgreSQL `BYTEA` + Disk | 100% persistent image storage across container restarts |
| **Deployment** | Vercel & Render | Vercel Edge + Render Web Service | Continuous deployment from `main` |

---

### 2.2 Directory Structure Integrity

```
D:\ZENVURO\
├── backend/
│   ├── alembic/                # Database migration scripts
│   ├── app/
│   │   ├── api/v1/             # REST API routes (auth, requests, orgs, locations, audit, etc.)
│   │   ├── core/               # Configuration, security, state machine, logging
│   │   ├── db/                 # Session, engine, table initialization, demo seeding
│   │   ├── models/             # SQLAlchemy ORM models (User, Request, Org, Attachment, etc.)
│   │   ├── schemas/            # Pydantic v2 validation models
│   │   └── services/           # Notification & business logic services
│   ├── tests/                  # Pytest automated test suite (17 comprehensive tests)
│   ├── pytest.ini              # Pytest configuration
│   └── requirements.txt        # Production Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI widgets, layout, navigation, cards, drawers
│   │   ├── context/            # Authentication, Theme, Query contexts
│   │   ├── features/           # Role-based feature views (Customer, Manager, Tech, Admin)
│   │   ├── lib/                # API client, token persistence, image helpers
│   │   ├── tests/              # Vitest suite (8 unit & workflow tests)
│   │   └── types/              # TypeScript interface definitions
│   ├── package.json            # Frontend dependency specifications
│   └── vite.config.ts          # Vite build configuration
└── docs/                       # Comprehensive project & viva documentation
```

---

## 3. Database Schema & Persistence Audit

### 3.1 Primary Entities & Relations

1. **`organizations`**: Multi-tenant partitions (`id`, `name`, `slug`, `domain`, `is_active`).
2. **`memberships`**: RBAC join table linking `users` to `organizations` with roles: `Customer`, `Technician`, `Manager`, `Admin`. Unique constraint on `(user_id, organization_id)`.
3. **`users`**: Master user identity credentials (`email`, `hashed_password`, `full_name`, `is_active`).
4. **`locations`**: Physical sites (`building`, `floor`, `room`, `address`).
5. **`assets`**: Equipment tracked for servicing (`asset_tag`, `name`, `category`, `serial_number`).
6. **`maintenance_requests`**: Core operational records (`request_number`, `title`, `description`, `category`, `priority`, `status`, `reopen_count`, `requester_id`, `assigned_technician_id`, `location_id`).
7. **`attachments`**: Evidence photos and documentation. Features dual storage:
   - File path string (`file_path`, `storage_key`)
   - **`file_data BYTEA`**: Raw binary storage directly in PostgreSQL ensuring images never disappear when cloud containers restart.
8. **`work_logs`**: Field diagnostics, labor hours, and technical notes logged by technicians.
9. **`material_usages`**: Replacement parts, quantities, units, and unit costs.
10. **`request_status_history`**: Immutable audit trail of every status transition with actor IDs and timestamp.
11. **`feedback`**: Post-resolution customer ratings (1–5 stars) and comments.
12. **`notifications`**: In-app notifications with `recipient_id`, `title`, `message`, `notification_type`, and `is_read` flag.
13. **`audit_events`**: Administrative compliance log tracking sensitive organizational mutations.

---

## 4. Multi-Role RBAC & Workflows

### 4.1 Role Matrix & Permissions

| Role | Issue Reporting | Queue Access | Assignment | Work Logs & Parts | Completion Submission | Customer Verification | Org & Team Admin |
|---|---|---|---|---|---|---|---|
| **Customer** | Full Create & Edit (Submitted) | Own Requests Only | No | Read-Only | No | Yes (Approve / Reopen) | No |
| **Technician** | No (Facility reporting) | Assigned & Open Claimable | Self-Claim | Full Create & Edit | Yes (Pending Verification) | No | No |
| **Manager** | Full Create & Dispatch | Full Org Queue | Full Assign & Reassign | Read & Review | Review & Override | Yes (Manager Override) | Read Team |
| **Company Admin** | Full Access | Full Org Queue | Full Assign & Reassign | Full Review | Full Review | Full Review | Full Org, Locations, Members & Invites |
| **Platform Admin** | System Health | Cross-Tenant Health | System Health | System Health | System Health | System Health | System Health & Tenant Overview |

---

### 4.2 Lifecycle State Transitions

```
[SUBMITTED]
   │
   ├─► [UNDER_REVIEW] (Manager Review)
   │      │
   │      ├─► [CANCELLED]
   │      └─► [ASSIGNED] (Assigned to Technician)
   │
   ├─► [ASSIGNED] (Direct Assignment)
   │      │
   │      ├─► [ACCEPTED] (Technician Accepts)
   │      └─► [UNDER_REVIEW] (Technician Declines with Reason)
   │
   ├─► [ACCEPTED] (Self-Claimed from Open Queue)
   │      │
   │      └─► [IN_PROGRESS] (Technician Commences Work)
   │             │
   │             └─► [AWAITING_VERIFICATION] (Technician Logs Proof & Submits)
   │                    │
   │                    ├─► [CLOSED] (Customer Confirms "Problem Fixed" + Star Rating)
   │                    │
   │                    └─► [REOPENED] (Customer Clicks "Still Not Fixed" + Reason)
   │                           │
   │                           └─► [UNDER_REVIEW] / [ASSIGNED] (Manager Re-dispatches)
```

---

## 5. Security & Authentication Audit

1. **Password Hashing**: Industry-standard `bcrypt` password hashing with salt rounds.
2. **JWT Security**: Cryptographically signed access tokens using `HS256` with configurable expiration.
3. **Session Dual-Storage**: Frontend syncs access tokens to both `localStorage` and `sessionStorage`, preventing premature sign-outs across browser tabs or navigation events.
4. **Tenant Isolation**: Every database query explicitly filters by `organization_id == membership.organization_id`. Cross-tenant queries are blocked at the ORM layer.
5. **CORS Hardening**: Strict origin whitelist covering `localhost:5173`, `localhost:3000`, `https://zervuono.vercel.app`, and secure Vercel preview deployment regex (`^https:\/\/.*\.vercel\.app$`).
6. **No Secret Leakage**: Zero passwords, private keys, or raw connection strings are checked into version control. Environment variables are managed via cloud secrets managers (Vercel Environment Variables and Render Environment Groups).

---

## 6. Automated Testing Verification

### 6.1 Backend Pytest Suite
Automated backend tests execute against a disposable SQLite database (`test_disposable.db`), completely isolated from production cloud databases.

- **Command:** `python -m pytest backend/tests -v`
- **Result:** **17 Passed, 0 Failed, 0 Skipped (100% Pass Rate)**
- **Execution Time:** ~3.8 seconds

#### Tested Test Cases:
1. `test_health_check`: Verifies `/health` endpoint and database connectivity.
2. `test_login_demo_admin`: Validates authentication credentials and JWT issuance.
3. `test_login_invalid_password`: Verifies rejection of incorrect credentials with HTTP 401.
4. `test_register_new_user`: Tests self-registration and organization bootstrapping.
5. `test_register_all_roles`: Confirms registration across Technician, Manager, and Customer roles.
6. `test_get_current_user_unauthenticated`: Verifies HTTP 401 on unauthenticated access.
7. `test_get_current_user_authenticated`: Validates profile payload and active membership.
8. `test_logout_flow`: Tests token revocation and session invalidation.
9. `test_customer_cannot_assign_technician`: Confirms RBAC block (HTTP 403) when customers attempt manager actions.
10. `test_customer_only_sees_their_own_requests`: Asserts strict tenant and user scoping.
11. `test_operational_report_requires_manager_or_admin`: Confirms report generation authorization.
12. `test_full_maintenance_workflow`: Complete happy-path execution: Submit → Assign → Start → Work Log → Materials → Complete → Customer Verify & Rate → Closed.
13. `test_reopen_workflow`: Rejection path: Complete → Customer Reopen (with reason) → Reopened state → Reopen count incremented.
14. `test_location_auto_creation_and_management`: Verifies facility location resolution and creation.
15. `test_public_organizations_list`: Verifies organization discovery endpoint for registration.
16. `test_technician_claim_and_complete_workflow`: Self-dispatch flow for technicians.
17. `test_file_upload_workflow`: Tests file attachment upload and byte persistence.

---

### 6.2 Frontend Vitest Suite
- **Command:** `npm test --prefix frontend`
- **Result:** **8 Passed, 0 Failed (100% Pass Rate)**
- **Execution Time:** ~1.4 seconds

#### Tested Test Cases:
1. Validates full state transition sequence matching backend state machine.
2. Confirms role permission mapping for all 4 primary roles.
3. Validates SLA deadline calculations across priority tiers.
4. Verifies priority-based sorting and display badges.
5. Tests form validation for required fields in issue creation.
6. Validates reopen reason requirements and length constraints.
7. Tests feedback rating constraints (1 to 5 stars).
8. Confirms cost and labor aggregation calculations.

---

### 6.3 Production Build Verification
- **Command:** `npm run build --prefix frontend`
- **TypeScript Check:** `tsc` passed with 0 errors.
- **Vite Bundler:** Built in 6.25 seconds; transformed 1,650 modules cleanly.
- **Output:** Ready for zero-downtime deployment on Vercel CDN.

---

## 7. Verified Defects, Root Causes & Remediations

| ID | Issue Identified | Root Cause | Engineering Resolution | Status |
|---|---|---|---|---|
| **BUG-01** | Ephemeral storage wipes uploaded attachments on Render restarts | Render free/standard web services do not have persistent local disks | Implemented dual persistence: attachments store binary data in PostgreSQL `BYTEA` (`Attachment.file_data`) and stream with HTTP 200 via `/api/v1/files/{id}/view` and `/uploads/...` fallback. | **Resolved & Verified** |
| **BUG-02** | Pytest hung on Windows when connecting to external DNS | `assemble_db_connection` ran DNS socket lookups against remote poolers | Added condition to skip remote DNS lookups when running SQLite or in `ENVIRONMENT=testing`. | **Resolved & Verified** |
| **BUG-03** | Stale data after work order updates | React Query cache invalidation was scoped only to singular keys | Added comprehensive query invalidation for `['requests']`, `['reports']`, and `['notifications']`. | **Resolved & Verified** |
| **BUG-04** | Session loss across browser tabs | Tokens stored in isolated memory / single storage mechanism | Synchronized token storage across `localStorage` and `sessionStorage` with automatic header injection. | **Resolved & Verified** |
| **BUG-05** | Mobile create issue input fields obscured by keyboard | Viewport safe area padding missing on small form screens | Added responsive flex padding, fixed bottom buttons with scrollable containers, and safe-area margins. | **Resolved & Verified** |

---

## 8. Acceptance Sign-off

- [x] **Zero Mock Data**: All dashboards, queues, metrics, and dropdowns query live PostgreSQL database tables.
- [x] **Role Workflows Operational**: Verified Customer, Technician, Manager, and Administrator journeys.
- [x] **Real-time Notifications**: Triggered and recorded for all lifecycle events.
- [x] **Persistent File Attachments**: Tested and verified via PostgreSQL `BYTEA` streaming.
- [x] **Automated Tests**: 100% passing across backend pytest (17/17) and frontend vitest (8/8).
- [x] **Production Ready**: Clean production build with zero TypeScript or bundling errors.
