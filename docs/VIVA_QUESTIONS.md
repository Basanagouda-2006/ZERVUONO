# ZERVUONO — Project Viva Voce & Technical Interview Guide

**Prepared for:** Bachelor of Computer Applications (BCA) Project Viva & Full-Stack Developer Interviews  
**Topic Coverage:** Architecture, FastAPI, React, TypeScript, PostgreSQL, SQLAlchemy, Security, RBAC, File Storage, Testing & Deployment.

---

### Q1: What is ZERVUONO and what real-world problem does it solve?
**Answer:**  
ZERVUONO is a full-stack, multi-tenant Maintenance Operations and Computerized Maintenance Management System (CMMS) SaaS platform. It solves the problem of disorganized, untracked facility and equipment breakdowns by replacing paper slips, phone calls, and unmonitored chat messages with an audited, deterministic lifecycle state machine connecting four roles: Customers, Managers, Technicians, and Administrators.

---

### Q2: Why did you choose FastAPI over other Python web frameworks like Django or Flask?
**Answer:**  
FastAPI was chosen for four key technical reasons:
1. **Asynchronous Concurrency:** Built natively on `asyncio` and `Starlette`, giving high throughput and low latency for I/O-bound database operations.
2. **Automatic Type Validation:** Integrated with **Pydantic v2**, which automatically parses, validates, and serializes incoming request payloads and outgoing responses.
3. **Interactive Documentation:** Automatically generates interactive OpenAPI (Swagger UI) documentation at `/docs` with zero extra configuration.
4. **Lightweight & Modular:** Unlike monolithic Django, FastAPI provides freedom to choose modern tools like SQLAlchemy 2.0 and custom Argon2id security.

---

### Q3: What is the purpose of Pydantic in your backend architecture?
**Answer:**  
Pydantic is used for data modeling and validation. In ZERVUONO:
- Incoming request bodies (like `MaintenanceRequestCreate` or `RegisterRequest`) are validated against defined field constraints (e.g., minimum string lengths, valid email formats).
- Outgoing responses (like `MaintenanceRequestResponse`) serialize complex SQLAlchemy database models into clean JSON schemas while stripping sensitive data like `hashed_password`.

---

### Q4: How does Dependency Injection work in FastAPI, and where did you use it?
**Answer:**  
FastAPI uses the `Depends()` syntax to inject dependencies into route handlers before execution. In ZERVUONO:
- `get_db`: Automatically opens and closes a database session for each request.
- `get_current_user`: Extracts the JWT token from the Authorization header or cookie, decodes it, and retrieves the active user.
- `get_current_membership`: Validates that the user belongs to the target organization.
- `require_roles(['Manager', 'Admin'])`: Enforces Role-Based Access Control (RBAC) by checking the user's role before allowing endpoint execution.

---

### Q5: What is the State Machine pattern, and how is it implemented in your project?
**Answer:**  
A state machine restricts an entity so it can only transition between predefined valid states. In `backend/app/core/state_machine.py`, we define a `VALID_TRANSITIONS` dictionary mapping each `RequestStatus` to its allowed next states. For example:
- `Submitted` can transition to `Assigned`, `Under Review`, or `Cancelled`.
- `In Progress` can only transition to `Awaiting Verification` or `Cancelled`.
- Direct jumps from `Submitted` to `Closed` are forbidden and raise an exception. This guarantees no work order is marked closed without technician completion and customer verification.

---

### Q6: What is Multi-Tenancy, and how does ZERVUONO guarantee tenant data isolation?
**Answer:**  
Multi-tenancy means multiple client companies (tenants) share the same application instance and database while keeping their data completely segregated. In ZERVUONO:
- Every tenant has an `Organization` record with a unique `id` (UUID).
- Core tables (`maintenance_requests`, `assets`, `locations`, `attachments`) have an `organization_id` foreign key.
- Every API query automatically filters by the authenticated user's `organization_id` extracted from their active `Membership`. Users can never see or modify records from another organization.

---

### Q7: Why did you use Argon2id instead of standard bcrypt or MD5 for password hashing?
**Answer:**  
Argon2id is the state-of-the-art password hashing algorithm (winner of the Password Hashing Competition and specified in RFC 9106). Unlike bcrypt or MD5, Argon2id is a **memory-hard** algorithm designed to resist hardware-accelerated attacks using GPUs and dedicated ASICs, making brute-force cracking mathematically infeasible.

---

### Q8: How does user authentication work with JWT in ZERVUONO?
**Answer:**  
1. When a user submits valid email and password credentials to `POST /auth/login`, the backend generates a signed JSON Web Token (JWT) containing `sub: user.id` and an expiration timestamp (24 hours).
2. The server returns the token in the JSON response and sets a secure `HttpOnly`, `SameSite=Lax` cookie.
3. For subsequent requests, the client passes this token via the `Authorization: Bearer <token>` header.
4. The server verifies the token signature using the secret key (`HS256`) and retrieves the user without needing to query a centralized session table every time.

---

### Q9: Why did you implement both Bearer Token and HttpOnly Cookie authentication?
**Answer:**  
- **HttpOnly Cookies** protect web browsers against cross-site scripting (XSS) attacks because JavaScript running in the browser cannot read or steal an HttpOnly cookie.
- **Bearer Tokens** stored in client storage (`localStorage` / `sessionStorage`) are required for mobile browsers, cross-origin API calls, and automated API clients (like Postman or scripts) where third-party cookie restrictions or browser privacy settings block cookie forwarding.

---

### Q10: What is SQLAlchemy 2.0 and how does it differ from older SQLAlchemy versions?
**Answer:**  
SQLAlchemy 2.0 is the modern Python Object-Relational Mapper (ORM). It introduces:
- Strict typing with `Mapped[]` and `mapped_column()` syntax.
- The 2.0 style `select()` execution syntax replacing legacy `Query` chains.
- Better connection pooling with automated pre-ping (`pool_pre_ping=True`) to drop stale database connections.

---

### Q11: What is the "N+1 Query Problem", and how did you prevent it?
**Answer:**  
The N+1 query problem occurs when querying a list of $N$ parent records causes the ORM to issue $N$ additional database queries to fetch related child records. In ZERVUONO, we eliminated this by using eager prefetching:
- `joinedload()`: Generates an SQL `LEFT OUTER JOIN` to fetch 1-to-1 relationships (like requester, assigned technician, and location) in a single database query.
- `selectinload()`: Issues an optimized `IN (...)` query to fetch 1-to-many child collections (like work logs, material usages, and attachments) in two efficient queries instead of dozens.

---

### Q12: What is the role of Alembic in this project?
**Answer:**  
Alembic is the database migration tool for SQLAlchemy. It tracks changes made to database models (like adding columns or tables) and generates incremental, reversible migration scripts (`upgrade()` and `downgrade()`). This ensures that database schema updates can be applied consistently across local development and production cloud environments without data loss.

---

### Q13: What was the "Ephemeral Container Problem" on Render, and how did you solve it?
**Answer:**  
- **The Problem:** Cloud hosting platforms like Render run applications inside stateless, ephemeral Docker containers. Whenever the free server sleeps after 15 minutes of inactivity or deploys a new commit, any files saved to the local `uploads/` disk directory are erased, causing broken images (HTTP 404).
- **The Solution:** We added a `BYTEA` binary column (`file_data`) to the `attachments` table in PostgreSQL. When an image is uploaded, its binary bytes are saved directly into the cloud PostgreSQL database. The endpoint `GET /api/v1/files/{id}/view` streams the bytes directly from PostgreSQL with `Content-Disposition: inline` and HTTP 200 OK, guaranteeing permanent image delivery across server reboots.

---

### Q14: Why did you choose React 18 with TypeScript over plain JavaScript?
**Answer:**  
TypeScript provides static type checking at compile-time. By defining explicit TypeScript interfaces (such as `MaintenanceRequest`, `User`, `Location`), TypeScript catches missing properties, incorrect prop types, and undefined variables during development, resulting in zero runtime type errors in the production build.

---

### Q15: What is TanStack Query (React Query) and why is it better than standard `useEffect`?
**Answer:**  
TanStack Query is a dedicated server-state management library. Unlike manual `useEffect` fetching:
- It automatically caches API data with cache keys (`queryKey`).
- It deduplicates identical network requests.
- It provides built-in background polling (e.g., refetching the request queue every 10 seconds).
- It provides declarative mutation handling (`useMutation`) and instant cache invalidation (`queryClient.invalidateQueries({ queryKey: ['requests'] })`), immediately refreshing the UI when an action occurs.

---

### Q16: How do Protected Routes work in your React application?
**Answer:**  
In `frontend/src/routes/AppRoutes.tsx`, the `ProtectedRoute` component wraps role dashboards. It inspects the `AuthContext`:
1. If the auth state is still loading, it displays a loading spinner.
2. If the user is unauthenticated, it redirects them to `/login`.
3. If an `allowedRoles` array is specified (e.g., `['Manager', 'Admin']`) and the user's role does not match, it gracefully routes them to their authorized dashboard (e.g., a Customer is redirected to `/customer`).

---

### Q17: What is the difference between Vite and traditional Webpack?
**Answer:**  
- **Vite** leverages native ES Modules (ESM) in modern browsers, serving source code instantly without bundling during development. This provides near-instant Hot Module Replacement (HMR) within milliseconds.
- **Webpack** bundles the entire application code and dependencies upfront, which becomes slow and memory-intensive as projects grow.

---

### Q18: What is Google Gemini's role in ZERVUONO?
**Answer:**  
The **Google Gemini API** (`gemini-2.5-flash` model via `google-genai` SDK) provides intelligent assistance in two key workflows:
1. **Automated Categorization:** Analyzes natural language issue descriptions to detect the fault category (`HVAC`, `Electrical`, `Plumbing`) and urgency tier.
2. **Field Troubleshooting:** Generates step-by-step diagnostic checklists, likely causes, and safety warnings for technicians on-site.
3. **Historical Resolution Retrieval:** Supplies context from past resolved tickets in the organization database to recommend proven solutions.

---

### Q19: What happens if the Gemini API key is missing or the external service fails?
**Answer:**  
The application implements a **graceful, grounded fallback**. In `backend/app/services/ai_service.py`, if the Gemini client is uninitialized or throws a network error, the code automatically routes to a rule-based expert engine. This engine uses keyword pattern matching and standard operating procedures to return valid categories and diagnostic steps without crashing or blocking the user.

---

### Q20: Explain the Customer Verification and Feedback workflow.
**Answer:**  
When a technician marks a job complete, the ticket moves to `Awaiting Verification`. An urgent alert banner appears on the Customer's dashboard. The customer inspects the technician's notes and before/after photos:
- If satisfied, the customer clicks **Confirm Resolution**, submits an optional 1–5 star rating with text feedback, and the ticket status becomes `Closed`.
- If the equipment is still broken, the customer clicks **Reopen**, provides a mandatory explanation, and the ticket transitions to `Reopened`, alerting the manager and technician.

---

### Q21: What metrics are calculated on the Operational Reports dashboard?
**Answer:**  
The `/reports/summary` endpoint calculates live statistics directly from PostgreSQL:
- Total, open, unassigned, in-progress, awaiting verification, and closed requests.
- **Reopen Rate:** $(\text{Reopened Tickets} / \text{Total Tickets}) \times 100$.
- **Average Resolution Hours:** Elapsed time from request creation to closure timestamp.
- **Average Customer Rating:** Mean score of all 1–5 star customer feedback reviews.
- **Technician Workload Table:** Active jobs count, completed jobs, and average hours spent per technician.

---

### Q22: What tests were conducted to verify the project's reliability?
**Answer:**  
- **Backend Tests (Pytest):** 17 automated tests covering health checks, authentication, bad password rejection, multi-role registration, RBAC blocking, tenant scoping, full 7-step maintenance workflow, reopen flow, and file uploads. (100% passed in 3.81s).
- **Frontend Tests (Vitest):** 8 automated tests covering session token management, tenant header injection, role validation, and HTTP error handling. (100% passed in 16.68s).
- **TypeScript Production Build:** `tsc && vite build` compiled 1,650 modules in 3.75s with zero errors.
- **Live Cloud Verification:** Real end-to-end multi-role tickets (`REQ-1020`, `REQ-1021`) verified live on Render and Neon DB.

---

### Q23: How does the application handle cold starts on Render's free tier?
**Answer:**  
Render free web services spin down after 15 minutes of inactivity. When a new request arrives:
- The container takes 30–50 seconds to boot.
- The frontend features defensive timeout handling (up to 30s) and non-destructive retry logic in `AuthContext` to prevent logging users out prematurely while the backend spins up.
- The backend config includes custom DNS fallback resolvers (Google DNS `8.8.8.8` and Cloudflare `1.1.1.1`) so that when the server boots, it can immediately resolve cloud database hostnames (Neon) without DNS timeout errors.

---

### Q24: What are ACID properties and how does PostgreSQL enforce them in ZERVUONO?
**Answer:**  
ACID stands for:
- **Atomicity:** All operations within a transaction succeed or all roll back (e.g., creating a request and writing its initial status history happen together).
- **Consistency:** Foreign key constraints, unique constraints (`uq_org_request_number`), and non-null rules prevent invalid data states.
- **Isolation:** Multiple concurrent transactions execute without interfering with one another.
- **Durability:** Committed transactions are permanently written to write-ahead logs (WAL) on disk, surviving power failures.

---

### Q25: If you had more time, what features would you add next?
**Answer:**  
1. **Native Mobile App:** Build cross-platform apps using React Native with offline IndexedDB syncing for field technicians in basements without cellular coverage.
2. **IoT Telematics (MQTT):** Connect industrial sensors directly to the backend to automatically create work orders when motor temperatures or vibration thresholds exceed safety limits.
3. **QR Code Equipment Scanning:** Affix physical QR stickers to machines so technicians can scan equipment with a smartphone camera to pull up history instantly.
4. **Push Notifications:** Implement WebPush or Firebase Cloud Messaging (FCM) for instant mobile alert notifications.
