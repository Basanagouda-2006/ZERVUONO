# ZERVUONO — System Architecture & Technical Design

## 1. High-Level Architecture Overview

ZERVUONO follows a decoupled, three-tier cloud-native architecture comprising a Single-Page Application (SPA) client layer, an asynchronous REST API service layer, and a cloud-hosted relational database persistence tier.

```mermaid
flowchart TB
    subgraph ClientTier["Client Presentation Tier (Vercel)"]
        Browser["Desktop & Mobile Web Browsers"]
        SPA["React 18 + TypeScript + Vite SPA"]
        RQ["TanStack React Query Cache"]
        Browser <--> SPA
        SPA <--> RQ
    end

    subgraph APITier["Application & Business Logic Tier (Render)"]
        Uvicorn["Uvicorn ASGI Server (:8000)"]
        FastAPI["FastAPI 0.111 Application"]
        Middlewares["CORS & Timing Middlewares"]
        Routers["Modular Routers (/api/v1/*)"]
        StateMachine["State Machine Engine"]
        AIService["AI Diagnostics (Gemini & Rule-Based)"]
        StorageEngine["Storage Engine (BYTEA & S3)"]

        Uvicorn --> FastAPI
        FastAPI --> Middlewares
        Middlewares --> Routers
        Routers --> StateMachine
        Routers --> AIService
        Routers --> StorageEngine
    end

    subgraph DataTier["Persistence & Data Tier (Neon Serverless PostgreSQL)"]
        ConnPool["SQLAlchemy 2.0 Connection Pool"]
        PostgresDB[("PostgreSQL 15+ Database
        • Multi-tenant Schemas
        • Row-level Org Isolation
        • BYTEA Object Storage")]
        ConnPool <--> PostgresDB
    end

    SPA <==>|HTTPS / JSON REST / Multipart| FastAPI
    Routers <==>|Async Session / SQL| ConnPool
```

---

## 2. Frontend Architecture (React + TypeScript)

The frontend is built as a Single-Page Application (SPA) using React 18, TypeScript, and Vite. It emphasizes type safety, rapid component rendering, and zero-runtime CSS via Tailwind.

### Key Architectural Patterns
1. **Feature-Driven Modular Directory Structure:** Code is organized by domain modules (`features/auth`, `features/customer`, `features/manager`, `features/technician`, `features/admin`, `features/requests`) rather than arbitrary file types.
2. **Server-State Management via TanStack Query (React Query v5):**
   - Automatically caches API query results with defined `queryKey` tuples (e.g., `['requests', 'manager', statusFilter]`).
   - Implements automated background polling (every 10–15 seconds) so field technicians and managers receive live updates without manual page refreshes.
   - Provides clean cache invalidation on mutations (e.g., dispatching or logging work orders immediately invalidates `['requests']`).
3. **Dual-Layer Auth Session Synchronization:**
   - Auth tokens are managed in an in-memory variable for speed, backed by simultaneous synchronization to `localStorage` and `sessionStorage`.
   - Protects against hard page refreshes on mobile browsers while maintaining security.
4. **Declarative Role-Based Route Guards:**
   - `ProtectedRoute` wrapper inspects the authenticated user's role and automatically routes them to their dedicated workspace (`/customer`, `/manager`, `/technician`, `/admin`).
5. **Form Validation & Schemas:**
   - Powered by `react-hook-form` and `zod` for client-side input validation and error feedback before network dispatch.

---

## 3. Backend Architecture (FastAPI + Python 3.12)

The backend is built with FastAPI, leveraging Python's native `asyncio` loop for high-throughput, non-blocking I/O.

### Modular Architecture
```text
backend/app/
├── api/
│   ├── deps.py             # Dependency injection: get_db, get_current_user, require_roles
│   └── v1/                 # Versioned route handlers
│       ├── auth.py         # Registration, login, logout, password reset
│       ├── requests.py     # Maintenance requests lifecycle & actions
│       ├── organizations.py# Tenant management, members, invitations
│       ├── assets.py       # Physical equipment registry
│       ├── locations.py    # Facility buildings, floors, rooms
│       ├── preventive.py   # Preventive maintenance plans
│       ├── reports.py      # Operational metrics & dashboard aggregations
│       ├── files.py        # File uploads & inline streaming
│       ├── ai.py           # Gemini-assisted classification & troubleshooting
│       └── audit.py        # Compliance audit events
├── core/
│   ├── config.py           # Pydantic BaseSettings with DNS fallbacks
│   ├── security.py         # Argon2id hashing & JWT cryptographic tokens
│   └── state_machine.py    # RequestStatus enum & VALID_TRANSITIONS map
├── db/
│   ├── session.py          # SQLAlchemy 2 Engine, SessionLocal, init_tables
│   └── seed.py             # Demo organization seed script
├── models/                 # SQLAlchemy Declarative Models
└── schemas/                # Pydantic v2 Request/Response Models
```

### Dependency Injection Pipeline (`deps.py`)
Each incoming request passes through an automated dependency chain:
1. `get_db`: Yields an active SQLAlchemy `Session` from the connection pool and guarantees closure.
2. `get_token_from_request`: Extracts the token from either the `Authorization: Bearer <token>` header or the `zervuno_session` HttpOnly cookie.
3. `get_current_user`: Decodes the JWT, validates expiration, and verifies user active status in the database.
4. `get_current_membership`: Scopes the user to their active tenant using the `X-Organization-Id` header (or primary membership).
5. `require_roles(['Manager', 'Admin'])`: Enforces endpoint-level RBAC, returning `HTTP 403 Forbidden` if unauthorized.

---

## 4. Authentication & Security Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Client Browser
    participant API as ⚙️ FastAPI Backend
    participant Security as 🔒 Security Core (Argon2id/JWT)
    participant DB as 🗄️ PostgreSQL Database

    User->>API: POST /api/v1/auth/login {email, password}
    API->>DB: Query User by Email
    DB-->>API: User record (with hashed_password)
    API->>Security: verify_password(plain, hashed_password)
    Security-->>API: Verified (True)
    API->>Security: create_access_token(user_id)
    Security-->>API: JWT Token (exp: 24h)
    API->>DB: INSERT INTO audit_events (USER_LOGIN)
    API-->>User: HTTP 200 OK + JWT Bearer + Set-Cookie (HttpOnly)

    Note over User,API: Subsequent Authenticated Requests
    User->>API: GET /api/v1/requests/ (Header: Bearer Token & X-Org-Id)
    API->>Security: decode_token(jwt)
    Security-->>API: Valid Payload (sub=user_id)
    API->>DB: Verify active Membership in Organization
    DB-->>API: Membership (role=Manager, org_id=xyz)
    API->>DB: SELECT * FROM maintenance_requests WHERE organization_id = xyz
    DB-->>API: Scoped Records
    API-->>User: HTTP 200 OK [JSON Request List]
```

---

## 5. Persistent File Storage & Image Pipeline

On cloud container platforms like Render, the container filesystem is **ephemeral** (files written to disk are destroyed when the server restarts or sleeps). ZERVUONO solves this by integrating **persistent database object storage**:

```mermaid
flowchart LR
    Browser["📱 Client Browser"]
    UploadEP["POST /files/upload"]
    DB[("PostgreSQL\nattachments table\n(file_data BYTEA)")]
    ViewEP["GET /files/{id}/view"]

    Browser -->|1. Multipart File Form| UploadEP
    UploadEP -->|2. Store binary bytes in file_data| DB
    UploadEP -->|3. Return URL: /api/v1/files/{id}/view| Browser

    Browser -->|4. HTTP GET Image URL| ViewEP
    ViewEP -->|5. Read BYTEA binary stream| DB
    ViewEP -->|6. Return HTTP 200 (image/jpeg, inline)| Browser
```

### Technical Resilience Features:
- **`BYTEA` Database Persistence:** Binary image content is stored directly in Neon PostgreSQL in the `Attachment.file_data` column.
- **Resilient Delivery:** Even after Render container cold starts or complete redeployments, image links remain valid and return **HTTP 200 OK**.
- **Dual Fallback:** If configured, S3 object storage is targeted first; if unconfigured, PostgreSQL `BYTEA` storage takes over, with a local disk cache for fast local reads.

---

## 6. End-to-End Maintenance Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor C as 👤 Customer
    participant API as ⚙️ FastAPI
    actor M as 👔 Manager
    actor T as 🔧 Technician
    participant DB as 🗄️ PostgreSQL

    C->>API: POST /requests/ (Title, Category, Location, Photo)
    API->>DB: INSERT maintenance_requests (Status: Submitted)
    API->>DB: INSERT request_status_history
    API-->>C: REQ-1001 Created (HTTP 201)

    M->>API: GET /requests/
    API->>DB: SELECT * WHERE org_id = xyz
    API-->>M: Queue includes REQ-1001

    M->>API: POST /requests/{id}/assign {technician_id, priority, instructions}
    API->>DB: UPDATE status = 'Assigned', technician_id = T
    API-->>M: HTTP 200 OK

    T->>API: POST /requests/{id}/accept
    API->>DB: UPDATE status = 'Accepted'
    T->>API: POST /requests/{id}/start
    API->>DB: UPDATE status = 'In Progress'

    T->>API: POST /requests/{id}/work-logs {diagnosis, actions, hours: 1.5}
    API->>DB: INSERT work_logs
    T->>API: POST /requests/{id}/materials {item: 'Coupling', qty: 1, cost: 45}
    API->>DB: INSERT material_usages

    T->>API: POST /requests/{id}/complete {completion_summary, proof_photo}
    API->>DB: UPDATE status = 'Awaiting Verification'
    API-->>T: HTTP 200 OK

    C->>API: POST /requests/{id}/verify {confirmed: true, rating: 5, comments}
    API->>DB: UPDATE status = 'Closed', closed_at = NOW()
    API->>DB: INSERT feedbacks (rating: 5)
    API-->>C: Ticket Successfully Closed (HTTP 200)
```

---

## 7. Cloud Deployment Topology

```mermaid
flowchart TD
    subgraph Internet["🌐 Public Internet / Users"]
        WebClients["Desktop & Mobile Users"]
    end

    subgraph VercelEdge["⚡ Vercel Edge Network (Global CDN)"]
        SPA_Static["Vite Production Bundle\n(HTML, CSS, JS Chunks)"]
        VercelRewrite["vercel.json Proxy Rules\n/api/* -> Render Backend\n/uploads/* -> Render Backend"]
    end

    subgraph RenderPlatform["☁️ Render Cloud Web Service (Oregon, US)"]
        AppServer["FastAPI + Uvicorn Async Server"]
        EnvConfig["Environment Variables\n• DATABASE_URL\n• SECRET_KEY\n• ENVIRONMENT=production\n• COOKIE_SECURE=true"]
    end

    subgraph NeonCloud["🐘 Neon Serverless PostgreSQL (AWS us-east-2)"]
        PgBouncer["PgBouncer Connection Pooler (:5432)"]
        StorageEngine["Compute & Storage Engine\n(ACID Tables, Indexes, BYTEA)"]
    end

    WebClients <==>|HTTPS (zervuono.vercel.app)| VercelEdge
    VercelEdge <==>|Reverse Proxy & Static Assets| SPA_Static
    VercelRewrite <==>|HTTPS (zervono-api.onrender.com)| AppServer
    AppServer <==>|Encrypted SSL / psycopg2 pool| PgBouncer
    PgBouncer <==> StorageEngine
```

This architecture provides a scalable, enterprise-grade foundation that completely decouples client presentation from business logic and database persistence.
