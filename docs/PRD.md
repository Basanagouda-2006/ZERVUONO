# ZERVUONO — Product Requirements Document (PRD)

**Version:** 1.0.0  
**Status:** Approved & Implemented  
**Target Platform:** Web (Desktop & Mobile Responsive)  
**System Type:** Multi-Tenant Computerized Maintenance Management System (CMMS)

---

## 1. Product Purpose & Vision

ZERVUONO is built to bridge the operational gap between facility tenants (customers), dispatch supervisors (managers), and field technicians. The system delivers a verifiable, auditable, and automated workflow for corrective and preventative maintenance, ensuring zero lost tickets, full accountability of labor and materials, and transparent customer sign-off.

---

## 2. User Roles & Permission Matrix (RBAC)

The application enforces strict **Role-Based Access Control (RBAC)** validated on both the client (route guards) and server (FastAPI dependency injection `require_roles`).

| Feature / Resource | Customer | Manager | Technician | Administrator |
|---|:---:|:---:|:---:|:---:|
| **Public Landing & Info Pages** | Read | Read | Read | Read |
| **Self-Registration & Login** | Create | Create | Create | Create |
| **Create Maintenance Request** | Full | Full | Full | Full |
| **View Organization Requests Queue** | Own Only | Full Org | Assigned + Open | Full Org |
| **Assign Technician & Priority** | ❌ Denied | Allowed | ❌ Denied | Allowed |
| **Self-Claim Open Request** | ❌ Denied | ❌ Denied | Allowed | Allowed |
| **Accept / Decline Assignment** | ❌ Denied | ❌ Denied | Allowed | Allowed |
| **Start Work (`In Progress`)** | ❌ Denied | Allowed | Allowed | Allowed |
| **Log Labor Hours & Materials** | ❌ Denied | Allowed | Allowed | Allowed |
| **Upload Photo Evidence** | Own Tickets | Full Org | Assigned Tickets | Full Org |
| **Submit Completion Report** | ❌ Denied | Allowed | Allowed | Allowed |
| **Verify Resolution & Close Ticket** | Allowed | Allowed | ❌ Denied | Allowed |
| **Reopen Incomplete Ticket** | Allowed | Allowed | ❌ Denied | Allowed |
| **Submit 1–5 Star Feedback** | Allowed | ❌ Denied | ❌ Denied | ❌ Denied |
| **Manage Facility Locations** | Read Only | Manage | Read Only | Full Control |
| **Manage Equipment Assets** | Read Only | Full Control | Read Only | Full Control |
| **Preventive Maintenance Schedules** | ❌ Denied | Full Control | Read Only | Full Control |
| **Operational Analytics & KPI Reports** | ❌ Denied | Full Access | ❌ Denied | Full Access |
| **Invite Members & Manage Roles** | ❌ Denied | ❌ Denied | ❌ Denied | Full Control |
| **Inspect System Audit Logs** | ❌ Denied | ❌ Denied | ❌ Denied | Full Control |

---

## 3. Functional Requirements (FR)

### FR-1: Authentication & Account Governance
- **FR-1.1:** Users shall register with full name, email, strong password (min 8 characters, requiring letters and numbers), and optional phone number.
- **FR-1.2:** New registrants can either create a new organization (becoming its `Admin`) or select their intended role (`Customer`, `Technician`, `Manager`) within an existing organization.
- **FR-1.3:** Passwords must be hashed using the **Argon2id** algorithm with dynamic salting.
- **FR-1.4:** Session management must issue stateless JWT access tokens with a default validity of 24 hours, alongside an `HttpOnly` cookie option for browser environments.
- **FR-1.5:** Password reset workflows must issue secure time-limited tokens (expiring in 2 hours) and invalidate used tokens.

### FR-2: Multi-Tenancy & Organization Management
- **FR-2.1:** Each customer, request, asset, and location must strictly belong to an `organization_id`.
- **FR-2.2:** Every API endpoint querying data must enforce `organization_id == current_user.membership.organization_id`.
- **FR-2.3:** Administrators can generate single-use invitation tokens associated with an email and role (`Admin`, `Manager`, `Technician`, `Customer`) that expire after 7 days.
- **FR-2.4:** Accepting an invitation must seamlessly link the user's account to the organization with the specified role.

### FR-3: Maintenance Request Creation & Location Tagging
- **FR-3.1:** Requesters shall submit work orders with Title (3–255 chars), Category (HVAC, Electrical, Plumbing, Mechanical, IT, Safety, Other), Detailed Description (min 5 chars), and Priority.
- **FR-3.2:** Requesters can select an existing registered location or enter a custom location name, which the backend automatically normalizes and attaches.
- **FR-3.3:** Requests shall be assigned an auto-incrementing human-friendly identifier formatted as `REQ-{1001 + count}` scoped per organization.
- **FR-3.4:** Requesters can attach initial photographic evidence during or immediately after creation.

### FR-4: Manager Triage & Dispatch
- **FR-4.1:** Managers shall view an active queue of all organization requests with multi-attribute filtering (Status, Priority, Category).
- **FR-4.2:** Managers can inspect technician workloads (active jobs count, completed jobs, and average hours per job) before dispatching.
- **FR-4.3:** Dispatching requires selecting an eligible technician, specifying priority (`Low`, `Medium`, `High`, `Urgent`), optional due date, and dispatch instructions.
- **FR-4.4:** Assigning must update ticket status to `Assigned` and trigger an in-app notification to the technician.

### FR-5: Technician Execution Workflow
- **FR-5.1:** Technicians can view all tickets explicitly assigned to them as well as browse open, unassigned tickets across their facility.
- **FR-5.2:** Technicians can self-claim unassigned tickets directly from the queue.
- **FR-5.3:** Technicians can Accept an assigned job (updating status to `Accepted`) or Decline with a mandatory comment (returning ticket to `Under Review`).
- **FR-5.4:** Technicians transition the ticket to `In Progress` when commencing physical on-site work.

### FR-6: Labor & Materials Tracking
- **FR-6.1:** While a ticket is `In Progress`, technicians can record itemized work logs with diagnosis notes, actions taken, and hours spent (decimal hours, e.g., 1.5h).
- **FR-6.2:** Technicians can record consumable materials and spare parts including item name, quantity, unit of measurement (`pcs`, `meters`, `liters`, etc.), and optional cost.
- **FR-6.3:** Labor and material records are permanently linked to the request and cannot be deleted by non-admin roles once saved.

### FR-7: Proof of Work & Persistent File Uploads
- **FR-7.1:** The system shall accept image uploads (`image/jpeg`, `image/png`, `image/webp`, `image/heic`) up to 20 MB.
- **FR-7.2:** Uploaded files must be stored persistently: binary bytes are stored directly in PostgreSQL `BYTEA` column (`file_data`) and cached to disk or external S3.
- **FR-7.3:** File serving endpoint `GET /api/v1/files/{attachment_id}/view` must stream the binary data with `Content-Disposition: inline`, `Cache-Control: public, max-age=31536000`, and correct MIME type, returning **HTTP 200 OK**.
- **FR-7.4:** The browser shall render before/after evidence photos reliably across server restarts and cloud cold-starts.

### FR-8: Customer Verification & Feedback
- **FR-8.1:** Upon technician completion, the ticket transitions to `Awaiting Verification`.
- **FR-8.2:** The requester is prompted with an action banner to review the technician's completion summary and evidence photos.
- **FR-8.3:** If confirmed fixed, the ticket is marked `Closed`, `closed_at` timestamp is recorded, and the customer can submit an optional 1–5 star rating with text feedback.
- **FR-8.4:** If symptoms persist, the customer can Reopen the ticket by supplying mandatory feedback. The system transitions the ticket to `Reopened`, increments `reopen_count`, and alerts the manager.

### FR-9: Operational Analytics & KPI Dashboards
- **FR-9.1:** Managers and Admins have access to `/reports/summary`, calculating live statistics directly from PostgreSQL:
  - Total requests, open requests, unassigned requests, awaiting verification, closed requests, reopened requests.
  - Reopen rate percentage ($(\text{Reopened} / \text{Total}) \times 100$).
  - Average resolution time (hours between creation and closure).
  - Average customer satisfaction rating across closed tickets.
  - Technician workload distribution table.
  - Breakdown by category and status.

### FR-10: AI Diagnostic Assistance (Google Gemini)
- **FR-10.1:** AI Category & Priority Recommendation: Analyzes issue title and description to suggest the appropriate category and urgency tier with confidence scoring.
- **FR-10.2:** AI Field Troubleshooting: Generates probable root causes, step-by-step diagnostic procedures, safety warnings, and retrieves similar past resolved tickets from the organization database.
- **FR-10.3:** Deterministic Fallback: If the Gemini API key is unconfigured or rate-limited, the system seamlessly falls back to a grounded rule-based expert engine without crashing or blocking the user.

---

## 4. Non-Functional Requirements (NFR)

### NFR-1: Security & Multi-Tenant Data Isolation
- Strict organization-level scoping on all relational queries.
- Argon2id password hashing with cryptographic salt.
- JWT session verification with token expiration and cookie security flags (`SameSite=Lax`, `HttpOnly`).
- Prevention of user enumeration on password reset endpoints.

### NFR-2: Performance & Query Optimization
- Eager relationship prefetching using SQLAlchemy `joinedload` and `selectinload` to prevent N+1 query performance penalties.
- Database indexing on all foreign keys (`organization_id`, `requester_id`, `assigned_technician_id`, `location_id`, `asset_id`), request numbers, and status fields.
- Frontend server-state caching with TanStack React Query to minimize redundant network roundtrips.

### NFR-3: Reliability & Data Persistence
- Zero reliance on ephemeral container disk storage for production business data or uploaded photos.
- Resilient PostgreSQL connection pooling with `pool_pre_ping=True` and automated retry on dropped pooler connections (Neon / PgBouncer).
- DNS fallback resolver (Google DNS `8.8.8.8` / Cloudflare `1.1.1.1`) to ensure reliable resolution of cloud-hosted database endpoints.

### NFR-4: Usability & Cross-Device Compatibility
- Fully responsive interface optimized for desktop displays (1920x1080), laptops (1366x768), tablets, and mobile smartphones (375px+).
- Touch-friendly tap targets (minimum 44x44px) for mobile technician workflows.
- Visual status badges and priority tags with distinct color tokens for rapid recognition.

### NFR-5: Compliance & Auditability
- Permanent write-only audit trail in `audit_events` recording all critical actions: user logins, ticket assignments, status transitions, and member invitations.
- Status history table (`request_status_history`) tracking every state change, timestamp, actor ID, and comment.

---

## 5. Use Cases & User Scenarios

### Use Case 1: UC-1 Customer Reports Broken Equipment
- **Primary Actor:** Customer (Elena Rostova)
- **Preconditions:** Customer is authenticated in their organization workspace.
- **Main Flow:**
  1. Customer clicks "Report Maintenance Issue" on their dashboard.
  2. Customer enters title ("Air compressor overheating in bay 3") and description.
  3. AI helper analyzes text and auto-selects Category: "Mechanical" and Priority: "High".
  4. Customer selects facility location ("North Wing - Logistics Hub") and uploads a photo of the temperature gauge.
  5. Customer submits form.
  6. Backend creates ticket with ID `REQ-1001`, writes status history, and persists image bytes in PostgreSQL.
- **Postconditions:** Ticket is in `Submitted` status, visible to Customer and Manager.

### Use Case 2: UC-2 Manager Assigns Technician
- **Primary Actor:** Operations Manager (David Miller)
- **Preconditions:** A ticket in `Submitted` status exists in the manager's facility queue.
- **Main Flow:**
  1. Manager reviews `REQ-1001` in the dispatch queue.
  2. Manager inspects technician roster and sees Alex Vance has the lowest active job count.
  3. Manager clicks "Assign", selects Alex Vance, sets priority to "High", and enters dispatch notes: "Inspect oil separator and clean radiator fins."
  4. Manager submits assignment.
  5. Backend validates state transition (`Submitted` → `Assigned`), updates assigned technician ID, and creates an audit record.
- **Postconditions:** Ticket is in `Assigned` status; technician receives an in-app notification.

### Use Case 3: UC-3 Technician Executes Repair & Logs Work
- **Primary Actor:** Field Service Technician (Alex Vance)
- **Preconditions:** Technician is logged in on mobile device with an assigned ticket.
- **Main Flow:**
  1. Technician opens technician dashboard and clicks "Accept Job". Status becomes `Accepted`.
  2. Technician arrives at North Wing Bay 3 and taps "Start Work". Status becomes `In Progress`.
  3. Technician opens "AI Troubleshooting" drawer for diagnostic advice and views past compressor fixes.
  4. Technician performs blowdown cleaning, tops up synthetic compressor oil, and clicks "Log Labor & Findings".
  5. Technician logs 1.75 hours of labor with diagnosis and actions taken.
  6. Technician logs material used: "Synthetic Compressor Oil ISO 46", quantity: 1.5 liters, cost: $32.00.
  7. Technician taps "Complete Job", uploads "After" photo showing gauge at normal 78°C, and submits.
- **Postconditions:** Status transitions to `Awaiting Verification`.

### Use Case 4: UC-4 Customer Verifies Resolution & Rates Service
- **Primary Actor:** Customer (Elena Rostova)
- **Preconditions:** Ticket is in `Awaiting Verification` status.
- **Main Flow:**
  1. Customer logs into Customer Hub and sees the alert banner for `REQ-1001`.
  2. Customer clicks "Review", inspects the technician's actions, parts used, and after-repair photo.
  3. Customer inspects physical equipment and verifies compressor is running normally.
  4. Customer clicks "Confirm Resolution", selects a 5-star rating, and enters comments: "Compressor running cool. Fast response!"
  5. Backend updates status to `Closed`, writes `closed_at` timestamp, and saves feedback record.
- **Postconditions:** Ticket reaches terminal state `Closed`. Operational analytics reflect new resolution time.

---

## 6. Acceptance Criteria

| ID | Feature | Acceptance Criteria |
|---|---|---|
| **AC-1** | User Registration | Registration succeeds only if email is unique, password meets strength criteria, and returns valid JWT token and user summary. |
| **AC-2** | Tenant Scoping | A customer in Organization A querying `/requests/` receives HTTP 200 with only Organization A requests; never Organization B requests. |
| **AC-3** | Unauthorized Role Block | A customer attempting to `POST /requests/{id}/assign` receives HTTP 403 Forbidden with message "Access denied". |
| **AC-4** | State Machine Guard | Attempting to transition directly from `Submitted` to `Closed` throws HTTP 400 Bad Request with "Invalid status transition". |
| **AC-5** | Image Serving Delivery | Uploading an image to `POST /files/upload` returns a URL; requesting that URL returns HTTP 200 OK with `image/jpeg` or `image/png` content-type. |
| **AC-6** | Customer Verification | Verifying with `confirmed: true` sets status to `Closed` and records feedback rating; verifying with `confirmed: false` sets status to `Reopened` and requires `reopen_reason`. |
| **AC-7** | Operational Metrics | Calling `GET /reports/summary` as Manager returns real non-zero integer counts for `total_requests`, `closed_requests`, and average resolution hours. |
