# Zervuno — Maintenance Operations SaaS Platform

> **Tagline:** Keep work moving.  
> **Mission:** Bring maintenance requests, technicians, equipment assets, and customer proof of work into one clear operational rhythm.

---

## 1. Product Overview & Architecture

Zervuno is a full-stack, multi-tenant maintenance operations platform built from scratch. It connects four critical roles into an explicit, audited state machine:

$$\text{Customer} \longrightarrow \text{Manager} \longrightarrow \text{Technician} \longrightarrow \text{Customer} \longrightarrow \text{Manager}$$

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Blazing fast, type-safe single-page application |
| **Styling** | Tailwind CSS + Accessible tokens | Brand palette (Evergreen `#183F35`, Jade `#399477`, Warm Ivory `#F6F3EA`) with Dark mode |
| **Server State** | TanStack React Query v5 | Automatic caching, real-time polling, and cache invalidation |
| **Backend** | Python 3.12 + FastAPI | High-performance asynchronous REST API with automatic OpenAPI docs |
| **Validation** | Pydantic v2 | Strict request/response validation and serialisation |
| **ORM & DB** | SQLAlchemy 2 + PostgreSQL | Normalized relational schema with strict foreign keys and timezone-aware timestamps |
| **Hosted Database**| Neon / Local PostgreSQL | Cloud-native serverless PostgreSQL persistence with pooling |
| **Migrations** | Alembic | Tracked, reversible schema migration management |
| **Security** | Argon2id + HttpOnly Cookies + JWT | Cryptographic password hashing, secure session management, and RBAC |
| **AI Diagnostics** | Google Gemini API (`google-genai`) | Automated category detection, priority recommendation, and field troubleshooting |
| **Testing** | Pytest + Vitest | Full-stack automated unit, workflow, and security test coverage |

---

## 2. Default Seed Organization & 4 Connected Demo Roles

A complete operational dataset ("Apex Logistics & Warehousing") is automatically seeded into PostgreSQL on first run.

| Role | Demo Email | Password | Primary Capabilities |
|---|---|---|---|
| **Admin** | `admin@zervuno.com` | `Password123!` | User governance, invitations, tenant settings, and immutable audit logs |
| **Manager** | `manager@zervuno.com` | `Password123!` | Dispatch requests, assign technicians, track team workload, PM schedules, and operational KPIs |
| **Technician** | `tech@zervuno.com` | `Password123!` | Mobile-first field view: accept jobs, log labor hours & materials, AI diagnostics, and completion proof |
| **Customer** | `customer@zervuno.com` | `Password123!` | Report issues with photos, track progress, verify resolution (or reopen with reason), and rate repairs |

> **Pro-Tip:** The Sign-In page at `http://localhost:3000/login` features **1-Click Quick Login** buttons for all four demo profiles for immediate evaluation without typing.

---

## 3. Real-World Lifecycle State Machine

Every maintenance request transitions through a strictly validated backend state machine:

```
[Submitted] ─────────► [Assigned] ─────────► [Accepted] ─────────► [In Progress]
     │                      │                      │                     │
     ▼                      ▼                      ▼                     ▼
[Cancelled]           [Under Review]         [Under Review]        [Awaiting Verification]
                            ▲                                            │
                            │                                            ▼
                            └──────────────── [Reopened] ◄───────────────┤
                                                                         ▼
                                                                     [Closed]
```

- **Submitted**: Issue reported with title, description, category, location, asset tag, and photo evidence.
- **Assigned**: Manager reviews request, sets SLA priority, assigns technician, and supplies dispatch instructions. Persists an in-app notification to the technician.
- **Accepted**: Technician reviews instructions on mobile and accepts (or declines with reason to return to review).
- **In Progress**: Technician starts work on-site, logging diagnostic findings, labor hours, replacement parts, and photo proof.
- **Awaiting Verification**: Technician files a completion report. The customer is alerted to inspect the work.
- **Closed**: Customer confirms the repair is fixed and submits optional 1-5 star feedback.
- **Reopened**: Customer reports symptoms persist, providing a mandatory reason and escalating back to management.

---

## 4. Local Development on Windows (PowerShell)

### Prerequisites
- Python 3.12+
- Node.js v20+ & npm
- PostgreSQL running locally or a Neon cloud connection string

### Step 1: Clone & Configure Environment

```powershell
# Navigate to the workspace
cd d:\ZENVURO

# Configure environment files
Copy-Item .env.example backend\.env
```

### Step 2: Set Up Backend

```powershell
cd d:\ZENVURO\backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run migrations (or initialize fresh database schema)
alembic upgrade head

# Seed demo dataset
python -m app.db.seed

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be accessible at: `http://127.0.0.1:8000/docs`

### Step 3: Set Up Frontend

Open a new PowerShell terminal:

```powershell
cd d:\ZENVURO\frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 3000
```
Open your browser to: `http://localhost:3000/`

---

## 5. Verification & Test Suite Execution

Both frontend and backend include automated test suites.

### Run Backend Pytest Suite
```powershell
cd d:\ZENVURO\backend
.\.venv\Scripts\pytest.exe -v
```
**Actual Verification Results:**
```
tests/test_auth.py::test_health_check PASSED
tests/test_auth.py::test_login_demo_admin PASSED
tests/test_auth.py::test_login_invalid_password PASSED
tests/test_auth.py::test_register_new_user PASSED
tests/test_rbac_multitenancy.py::test_customer_cannot_assign_technician PASSED
tests/test_rbac_multitenancy.py::test_customer_only_sees_their_own_requests PASSED
tests/test_rbac_multitenancy.py::test_operational_report_requires_manager_or_admin PASSED
tests/test_workflow.py::test_full_maintenance_workflow PASSED
tests/test_workflow.py::test_reopen_workflow PASSED
======================= 9 passed in 1.45s ========================
```

### Run Frontend Vitest & TypeScript Build Check
```powershell
cd d:\ZENVURO\frontend
npm test
npm run build
```
**Actual Verification Results:**
```
✓ src/tests/workflow.test.ts (3 tests) 3ms
Test Files: 1 passed (1)
Tests: 3 passed (3)
✓ 1650 modules transformed.
✓ built in 2.14s
```

---

## 6. Neon Cloud PostgreSQL Setup

To connect to Neon:
1. Create a database on [Neon.tech](https://neon.tech).
2. Copy your connection string: `postgresql://user:password@ep-sample-1234.us-east-2.aws.neon.tech/neondb?sslmode=require`
3. Paste it into `backend/.env` as `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql+psycopg://user:password@ep-sample-1234.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
4. Run migrations:
   ```powershell
   alembic upgrade head
   python -m app.db.seed
   ```
5. You can inspect all tables and relations directly using Neon's built-in SQL Editor, DBeaver, or pgAdmin.

---

## 7. Production Deployment Guide

### Deploy Backend (Render / Railway)
1. Link your GitHub repository to Render / Railway.
2. Select Python environment.
3. Build Command: `pip install -r backend/requirements.txt && alembic -c backend/alembic.ini upgrade head`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --app-dir backend`
5. Configure Environment Variables: `DATABASE_URL`, `SECRET_KEY`, `ENVIRONMENT=production`, `COOKIE_SECURE=true`.

### Deploy Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add rewrite rule in `vercel.json` to proxy `/api/(.*)` to your production backend URL.

---

## 8. Security & Compliance Implementation

- **Strict Multi-Tenant Scoping**: All database queries enforce `organization_id` ownership derived from server-validated memberships, preventing cross-tenant data leakage.
- **Argon2id Password Hashing**: State-of-the-art memory-hard hashing protects user credentials against GPU cracking attacks.
- **HttpOnly Secure Session Cookies**: Session tokens are isolated from JavaScript DOM access to mitigate XSS-based session hijacking.
- **Immutable Audit Logging**: Key authentication events, dispatch updates, and administrative modifications are written to the database audit table.
- **Input Sanitization & Rate Limits**: Pydantic schema validation protects all incoming payloads against malformed data and prototype pollution.

---

© 2026 Zervuno. Built with pride for autonomous operations. Keep work moving.
