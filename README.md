# ZERVUONO — Multi-Tenant Maintenance Operations Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.111-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791.svg?style=flat&logo=postgresql)](https://neon.tech)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Keep work moving.**<br>
> An autonomous, cloud-native Maintenance Operations and Computerized Maintenance Management System (CMMS) SaaS platform that unifies maintenance requests, equipment assets, technician dispatches, labor/parts tracking, and verifiable customer proof into an audited operational rhythm.

---

## 📌 Project Overview

**ZERVUONO** is a full-stack, enterprise-grade maintenance operations platform engineered to streamline facility and equipment management. Built with a modern, decoupled architecture, it integrates:
- A high-performance **FastAPI (Python 3.12)** asynchronous backend.
- A reactive, type-safe **React 18 + TypeScript + Vite** frontend.
- Relational data modeling with **SQLAlchemy 2** and **PostgreSQL (Neon)**.
- Secure, multi-tenant organization scoping with strict **Role-Based Access Control (RBAC)**.
- Deterministic, audited state machine transitions for maintenance requests.
- Resilient image and evidence storage using database `BYTEA` storage with S3 fallback.
- AI-assisted diagnostic recommendations powered by the **Google Gemini API** (`google-genai`) with grounded rule-based fallbacks.

### Deployment & Repository Links

- **Live Application Frontend:** [https://zervuono.vercel.app](https://zervuono.vercel.app)
- **Live API Backend:** [https://zervono-api.onrender.com](https://zervono-api.onrender.com)
- **Interactive OpenAPI Documentation:** [https://zervono-api.onrender.com/docs](https://zervono-api.onrender.com/docs)
- **GitHub Repository:** [https://github.com/Basanagouda-2006/ZERVUONO](https://github.com/Basanagouda-2006/ZERVUONO)

---

## ⚠️ Problem Statement & The ZERVUONO Solution

### The Problem
Traditional facility and equipment maintenance in industrial parks, commercial complexes, and institutions relies on fragmented channels:
1. **Unstructured Communication:** Phone calls, WhatsApp messages, or handwritten logbooks lead to lost work orders and lack of accountability.
2. **Missing Visibility:** Requesters (customers) have no real-time status updates on when a technician will arrive or whether parts have been ordered.
3. **Unverifiable Work Proof:** Technicians complete work without photographic evidence or itemized labor/spare parts logging, causing disputes.
4. **Data Isolation Gaps:** Multi-department or multi-client organizations struggle to keep maintenance history isolated without deploying separate software instances.

### The Solution
ZERVUONO replaces haphazard communication with an **enforced operational rhythm**:
- **Single Source of Truth:** Every issue generates a tracked ticket (`REQ-1001`) associated with a facility location and asset tag.
- **Explicit Lifecycle State Machine:** Requests follow strict state transitions (`Submitted` → `Assigned` → `Accepted` → `In Progress` → `Awaiting Verification` → `Closed` / `Reopened`).
- **Cryptographic & Tenant Security:** Organization-level isolation prevents cross-tenant data leakage; Argon2id password hashing and JWT/HttpOnly cookie sessions protect accounts.
- **Proof-of-Work Pipeline:** Photographic attachments and material consumption logs provide immutable audit proof before customer sign-off.
- **AI Diagnostics:** Instant classification of equipment faults, recommended priority tiers, and tailored troubleshooting steps based on historical organization data.

---

## 👥 The Four Operational Roles

ZERVUONO connects four distinct personas into an integrated workflow:

```mermaid
graph LR
    C[👤 Customer / Requester] -->|1. Submit Request with Photos| M[👔 Operations Manager]
    M -->|2. Triage, SLA Priority & Dispatch| T[🔧 Field Technician]
    T -->|3. Accept, Diagnose & Log Labor/Parts| T
    T -->|4. Submit Completion Proof| C
    C -->|5a. Confirm & Rate 5-Stars| Closed([✅ Ticket Closed])
    C -->|5b. Reject with Reason| Reopened([🔄 Reopened to Queue])
    Admin[🛡️ Organization Admin] -.->|Govern Users, Locations, Assets & Audit Logs| M
    Admin -.->|System-wide Analytics & Settings| T
```

### 1. 👤 Customer (Requester)
- Report issues in seconds with title, category, priority, building/floor/room location, and photo evidence.
- Track real-time progress of open tickets with automated notifications.
- Verify technician resolution reports: either confirm resolution with 1–5 star rating and feedback or reopen with mandatory justification.

### 2. 👔 Operations Manager
- Triage incoming facility queue across all categories and departments.
- Inspect real-time technician workload, active jobs, and completion times.
- Assign tickets to available technicians with due dates and specialized instructions.
- Oversee preventative maintenance schedules and trigger recurring service orders.
- Review analytical KPI reports (average resolution hours, reopen rates, status breakdowns).

### 3. 🔧 Field Service Technician
- Mobile-optimized interface for field use across smartphones, tablets, and rugged devices.
- Review dispatch instructions, facility locations, and asset equipment history.
- Accept or decline assigned jobs with feedback to management.
- Transition tickets to `In Progress` upon arrival on-site.
- Log diagnosis, itemized actions taken, elapsed labor hours, and spare parts consumed.
- Utilize AI Troubleshooting powered by Google Gemini and past resolution history.
- Upload photo proof of completed repairs and submit for customer verification.

### 4. 🛡️ Organization Administrator
- Manage multi-tenant organization profile and company settings.
- Invite team members with assigned roles (Manager, Technician, Customer).
- Manage facility locations, buildings, rooms, and physical assets.
- Review immutable database audit logs for all security, authentication, and state change events.

---

## 💻 Technology Stack

| Layer | Technology | Version | Purpose in ZERVUONO |
|---|---|---|---|
| **Backend Framework** | **FastAPI** | `^0.111.0` | Asynchronous RESTful API server, OpenAPI auto-generation, dependency injection |
| **ASGI Server** | **Uvicorn** | `^0.30.0` | High-performance asynchronous HTTP server with hot reload |
| **Language** | **Python** | `3.12+` | Modern type hints, structured pattern matching, async/await |
| **ORM** | **SQLAlchemy** | `^2.0.30` | Declarative relational mapping, connection pooling, typed queries |
| **Schema Validation** | **Pydantic** | `^2.7.0` | Request validation, response serialization, strict type checking |
| **Settings Management**| **Pydantic Settings** | `^2.3.0` | Centralized `.env` parsing with validation and fallbacks |
| **Database Migrations**| **Alembic** | `^1.13.0` | Version-controlled database schema migrations |
| **Database Engine** | **PostgreSQL** | `15+ / Neon` | ACID-compliant relational cloud persistence with connection pooling |
| **Database Drivers** | **psycopg / psycopg2 / pg8000** | Latest | Native C-binary drivers with pure-Python fallback for cloud resiliency |
| **Password Hashing** | **Argon2id (`argon2-cffi`)** | `^23.1.0` | Memory-hard cryptographic hashing resistant to GPU cracking |
| **Authentication** | **PyJWT** | `^2.8.0` | Stateless JSON Web Tokens (Bearer auth + HttpOnly secure cookies) |
| **AI Diagnostics** | **Google Gemini (`google-genai`)**| `^0.1.0` | Natural language category detection, priority recommendation, troubleshooting |
| **Frontend Framework** | **React** | `^18.3.1` | Declarative component-driven user interface |
| **Language (Frontend)**| **TypeScript** | `^5.5.4` | Static typing, interface definitions, zero runtime type errors |
| **Build Tool & Bundler**| **Vite** | `^5.4.3` | Instant Hot Module Replacement (HMR) and optimized production build |
| **Client State / Cache**| **TanStack React Query** | `^5.56.2` | Server-state caching, background polling (10s intervals), invalidations |
| **Styling** | **Tailwind CSS** | `^3.4.11` | Utility-first CSS, responsive design tokens, dark mode support |
| **Routing** | **React Router DOM** | `^6.26.2` | Client-side routing, protected routes, role-based workspace redirects |
| **Icons** | **Lucide React** | `^0.441.0` | Modern, consistent SVG iconography |
| **Testing (Backend)** | **Pytest + Pytest-Asyncio** | `^8.2.0` | Automated backend testing, test client execution, workflow validation |
| **Testing (Frontend)**| **Vitest** | `^2.1.1` | Unit and integration testing for client-side API layer and auth store |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (Vercel SPA)"]
        UI["React 18 + TypeScript + Tailwind UI"]
        RQ["TanStack React Query (State Cache & Polling)"]
        AUTH["Auth Context (JWT / SessionStorage / Cookies)"]
        UI <--> RQ
        UI <--> AUTH
    end

    subgraph APILayer["⚙️ Backend API (Render Cloud Service)"]
        FASTAPI["FastAPI 0.111 Application"]
        CORS["CORS & Timing Middleware"]
        SEC["Security & RBAC Dependency Guard"]
        SM["State Machine Engine (Request Transitions)"]
        AI_SVC["AI Diagnostic Service (Google Gemini)"]
        STORAGE["Storage Service (BYTEA Stream / S3)"]

        FASTAPI --> CORS
        FASTAPI --> SEC
        FASTAPI --> SM
        FASTAPI --> AI_SVC
        FASTAPI --> STORAGE
    end

    subgraph DataLayer["🗄️ Persistence Layer (Neon Cloud PostgreSQL)"]
        POOL["SQLAlchemy Connection Pool"]
        DB[("PostgreSQL Relational DB
        • users & sessions
        • organizations & memberships
        • maintenance_requests
        • request_status_history
        • work_logs & materials
        • attachments (BYTEA)
        • audit_events & notifications")]
        POOL --> DB
    end

    ClientLayer <==>|HTTPS / JSON REST / FormData| APILayer
    APILayer <==>|Async SQLAlchemy 2 Pool| DataLayer
```

---

## 📸 Screenshots & UI Walkthrough

*(Screenshots can be captured directly from your local instance or deployed URL)*

| View | Description | Preview |
|---|---|---|
| **Public Landing Page** | Value proposition, interactive capabilities, maintenance lifecycle visualization, and CTA. | `[Screenshot: Public Landing Page / Hero Section]` |
| **Customer Hub** | Ticket creation with dynamic category recommendation, location selector, and active orders. | `[Screenshot: Customer Dashboard & Create Modal]` |
| **Manager Dispatch Queue** | Unified requests table, technician workload cards, assignment modal with instructions. | `[Screenshot: Manager Dispatch & Triage Board]` |
| **Technician Mobile View** | Quick status toggles (Accept, Start Work), labor/parts logging, and completion modal. | `[Screenshot: Technician Field Workspace]` |
| **AI Troubleshooting** | Instant diagnostic checklists and similar past resolution retrieval powered by Gemini. | `[Screenshot: AI Troubleshooting Drawer]` |
| **Admin Governance** | Member roster, role invitations, facility locations manager, and immutable audit logs. | `[Screenshot: Admin Governance & Audit View]` |

---

## 🛠️ Local Installation & Development Setup

Follow these steps to run ZERVUONO locally on Windows (PowerShell), macOS, or Linux.

### Prerequisites
- **Python:** Version `3.12` or higher installed ([python.org](https://www.python.org/downloads/))
- **Node.js:** Version `20` LTS or higher with `npm` ([nodejs.org](https://nodejs.org/))
- **PostgreSQL:** Local PostgreSQL server running OR a free [Neon.tech](https://neon.tech) cloud database URL.
- **Git:** Version control CLI.

---

### Step 1: Clone Repository & Configure Workspace

```powershell
# Clone the repository
git clone https://github.com/Basanagouda-2006/ZERVUONO.git
cd ZERVUONO

# Configure root environment
Copy-Item .env.example .env
Copy-Item .env.example backend\.env
```

---

### Step 2: Configure Environment Variables

Edit `backend/.env` with your settings:

```env
ENVIRONMENT=development
PROJECT_NAME=Zervuno
VERSION=1.0.0
API_V1_STR=/api/v1

SECRET_KEY=generate_a_secure_random_hex_secret_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
COOKIE_SECURE=false

# Database: Neon cloud URL or local PostgreSQL
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/zervuno

# Storage Backend: "local" (uses PostgreSQL bytea + disk) or "s3"
STORAGE_BACKEND=local
UPLOAD_DIR=uploads

# Optional AI Integration (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Seed initial demo organization on first run (optional)
SEED_DEMO_DATA=false
```

---

### Step 3: Backend Setup (Python / FastAPI)

Open a PowerShell terminal:

```powershell
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# (On Linux / macOS use: source .venv/bin/activate)

# Upgrade pip and install all dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations / initialize tables
python -c "from app.db.session import init_tables; init_tables()"

# (Optional) Seed demo dataset for testing
python -m app.db.seed

# Start FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI backend will be live at:
- API Base: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

---

### Step 4: Frontend Setup (React / Vite)

Open a **second** terminal window:

```powershell
# Navigate to frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server
npm run dev
```

The React frontend will be live at:
- Web Application: `http://localhost:5173` (or `http://localhost:3000`)

---

## 🧪 Testing Instructions

### 1. Backend Automated Test Suite (Pytest)
The backend test suite validates authentication, security constraints, multi-tenant RBAC scoping, and the end-to-end request state machine.

```powershell
cd backend
python -m pytest -v backend/tests
```

**Expected Result (17/17 tests passing):**
```text
tests/test_auth.py::test_health_check PASSED
tests/test_auth.py::test_login_demo_admin PASSED
tests/test_auth.py::test_login_invalid_password PASSED
tests/test_auth.py::test_register_new_user PASSED
tests/test_auth.py::test_register_all_roles PASSED
tests/test_auth.py::test_get_current_user_unauthenticated PASSED
tests/test_auth.py::test_get_current_user_authenticated PASSED
tests/test_auth.py::test_logout_flow PASSED
tests/test_rbac_multitenancy.py::test_customer_cannot_assign_technician PASSED
tests/test_rbac_multitenancy.py::test_customer_only_sees_their_own_requests PASSED
tests/test_rbac_multitenancy.py::test_operational_report_requires_manager_or_admin PASSED
tests/test_workflow.py::test_full_maintenance_workflow PASSED
tests/test_workflow.py::test_reopen_workflow PASSED
tests/test_workflow.py::test_location_auto_creation_and_management PASSED
tests/test_workflow.py::test_public_organizations_list PASSED
tests/test_workflow.py::test_technician_claim_and_complete_workflow PASSED
tests/test_workflow.py::test_file_upload_workflow PASSED
======================== 17 passed in 3.81s ========================
```

### 2. Frontend Automated Test Suite (Vitest)
Validates auth token storage, multi-tenant context propagation, role validation, error boundary behavior, and URL resolution.

```powershell
cd frontend
npm run test
```

**Expected Result (8/8 tests passing):**
```text
✓ src/tests/workflow.test.ts (8 tests)
Test Files  1 passed (1)
Tests       8 passed (8)
```

### 3. Production Frontend Typecheck & Build Check
```powershell
cd frontend
npm run build
```

**Expected Result:**
```text
✓ 1650 modules transformed.
dist/index.html                   1.17 kB
dist/assets/index-DGEESsmg.css   44.81 kB
dist/assets/index-kwe0wwIc.js   427.14 kB
✓ built in 3.75s
```

---

## 🔒 Security & Multi-Tenancy Architecture

1. **Strict Multi-Tenant Scoping:** All database queries require an `organization_id` extracted from the server-validated user `Membership`. Requesters can never access work orders, assets, or locations belonging to another tenant.
2. **Argon2id Hashing:** User passwords are never stored in plain text. They are hashed using `argon2-cffi` with salt and memory cost parameters.
3. **Session Dual-Storage & HttpOnly Cookies:** Authentication tokens are delivered via JWT and protected by `HttpOnly`, `SameSite=Lax` cookies, with graceful bearer token fallback for mobile clients and cross-domain APIs.
4. **Persistent Object Storage with Zero Data Loss:** Attachments are streamed into PostgreSQL `BYTEA` storage and served via `/api/v1/files/{id}/view`, guaranteeing that ephemeral container sleep cycles on Render do not break image URLs.
5. **Immutable Audit Trails:** Authentication successes/failures, technician assignments, status transitions, and role invitations are permanently logged to the `audit_events` table.

---

## ⚠️ Known Limitations & Future Scope

### Known Limitations
1. **Free Tier Cold Starts:** The backend is deployed on Render's free tier. If inactive for 15 minutes, Render spins down the container, causing a 30–50 second delay on the initial request.
2. **Push Notifications:** Notifications are stored in the database and polled every 10–15 seconds via React Query; WebSockets / WebPush have not yet been integrated.
3. **Offline Mobile Mode:** Technicians require an active internet connection to submit work logs and complete jobs; local IndexedDB offline syncing is not yet implemented.

### Future Scope
- **Native Mobile Apps:** Packaging the technician and customer interfaces using React Native or Flutter for offline caching and device camera hardware bindings.
- **IoT Sensor Integrations:** Ingesting MQTT telematics from industrial chillers, vibration sensors, and power meters to automatically trigger preventive maintenance work orders.
- **Barcode & QR Scanning:** Scanning physical equipment QR stickers to open asset history and initiate work orders instantaneously.
- **Automated Invoicing & ERP Sync:** Direct integration with accounting platforms (QuickBooks, SAP) for material cost billing.

---

## 📄 License & Credits

Developed with pride by **Basanagouda** as a BCA Final Year Project and Cloud-Native Full-Stack Portfolio Application.

- **License:** MIT License. Free for educational, research, and commercial evaluation.
- **Inquiries & Portfolio:** Connect via [GitHub](https://github.com/Basanagouda-2006) or the in-app Contact page.
