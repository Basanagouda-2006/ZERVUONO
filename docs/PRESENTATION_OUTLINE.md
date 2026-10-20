# ZERVUONO — Final Project Viva Presentation Outline

**Presentation Format:** 12-Slide Academic Defense & Technical Showcase  
**Target Duration:** 10–12 Minutes (+ 3–5 Minutes Q&A)  
**Presenter:** [Student Name] (BCA Final Year)

---

## Slide 1: Title & Introduction
- **Slide Title:** ZERVUONO — Multi-Tenant Maintenance Operations & CMMS SaaS Platform
- **Sub-Title:** Autonomous, Audited Lifecycle Orchestration for Industrial & Commercial Facilities
- **Presenter Details:**
  - Student Name: **[Student Name]**
  - Roll / USN Number: **[University Seat Number]**
  - Degree: Bachelor of Computer Applications (BCA)
  - Department: Department of Computer Applications
  - College: **[College / Institution Name]**
  - Guide: **[Guide Name]**, [Guide Designation]
- **Key Talking Points:**
  - Introduce the project as a full-stack, enterprise-grade cloud application built from scratch to solve real-world facility upkeep and breakdown challenges.
- **Suggested Visuals:**
  - Project Logo / Hero Banner with Zervuono tagline: *"Keep work moving."*

---

## Slide 2: Problem Statement & Industrial Motivation
- **Slide Title:** The Problem: Why Traditional Maintenance Fails
- **Key Bullet Points:**
  - **Communication Black Holes:** Verbal requests, WhatsApp chats, and paper logs result in lost work orders and zero accountability.
  - **No Dispatch Visibility:** Managers have no real-time view of who is available, who is overloaded, or where emergency faults are located.
  - **Lack of Verified Work Proof:** Technicians complete work without itemized labor logs, spare part tracking, or photographic proof.
  - **Zero Customer Sign-off:** Requesters are left guessing whether an issue is resolved, with no formal rejection or rating mechanism.
  - **Multi-Tenant Data Leaks:** Co-working, multi-client, or multi-facility organizations risk data leakage without strict tenant boundaries.
- **Key Talking Points:**
  - Highlight that equipment breakdown in logistics and manufacturing directly causes costly downtime; manual tracking is the root cause of extended repair delays.
- **Suggested Visuals:**
  - Visual comparison graphic: Chaotic paper slips & WhatsApp chats vs. clean unified digital board.

---

## Slide 3: Project Objectives & Core Vision
- **Slide Title:** Project Objectives: Bringing Structure to Maintenance
- **Key Bullet Points:**
  - **Deterministic State Machine:** Enforce strict, audited transitions from `Submitted` to `Closed`.
  - **Four Connected Roles:** Seamlessly link Customer, Manager, Technician, and Administrator.
  - **Verifiable Proof of Work:** Require labor hours, parts consumed, and persistent photos before sign-off.
  - **Multi-Tenant Security:** Guarantee 100% database-level tenant isolation across organizations.
  - **AI-Powered Diagnostics:** Assist field workers with automated fault categorization and diagnostic checklists.
  - **Zero Data Loss Architecture:** Ensure photographic evidence survives cloud server cold starts and redeployments.
- **Key Talking Points:**
  - Emphasize that ZERVUONO is not just another ticketing tool; it is an enforced operating rhythm where every state transition requires verified criteria.
- **Suggested Visuals:**
  - Icon grid highlighting the 6 core pillars (State Machine, 4 Roles, Proof, Security, AI, Persistence).

---

## Slide 4: Proposed Solution & Core Value Proposition
- **Slide Title:** The ZERVUONO Solution: An Enforced Operating Rhythm
- **Key Bullet Points:**
  - Single Source of Truth for all facility assets, work orders, and locations.
  - Mobile-first interface for field technicians on the move.
  - Interactive manager dispatch board with live workload indicators.
  - Customer verification loop with 1–5 star service ratings.
  - Live operational analytics (resolution hours, reopen rates, status breakdowns).
- **Key Talking Points:**
  - Walk the evaluators through the core value proposition: transparency for the customer, efficiency for the manager, clarity for the technician, and compliance for the administrator.
- **Suggested Visuals:**
  - High-level workflow diagram: `Customer -> Manager -> Technician -> Customer Verification -> Closed`.

---

## Slide 5: System Architecture & Modern Tech Stack
- **Slide Title:** System Architecture: Modern, Fast, and Decoupled
- **Key Bullet Points:**
  - **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (SPA hosted on Vercel).
  - **Server State:** TanStack React Query v5 (client caching, 10s background polling).
  - **Backend API:** FastAPI (Python 3.12) with asynchronous ASGI execution on Render.
  - **Data Layer:** PostgreSQL (Neon Cloud) + SQLAlchemy 2.0 ORM + Alembic migrations.
  - **Security:** Argon2id password hashing + JWT access tokens + HttpOnly cookies.
  - **AI Engine:** Google Gemini API (`gemini-2.5-flash`) with grounded rule-based fallbacks.
- **Key Talking Points:**
  - Explain why FastAPI was chosen over Flask/Django (async throughput, native Pydantic validation, auto-generated OpenAPI docs) and why TypeScript was used on React (zero runtime type errors).
- **Suggested Visuals:**
  - 3-tier architecture diagram from `docs/SYSTEM_ARCHITECTURE.md`.

---

## Slide 6: Multi-Tenant Architecture & The 4 Roles
- **Slide Title:** Role-Based Access Control & Multi-Tenancy
- **Key Bullet Points:**
  - **Organization Boundary:** Every query filters by `organization_id`; cross-tenant visibility is strictly prohibited at the SQL level.
  - **Customer:** Report issues, upload photos, select locations, verify repairs, rate service.
  - **Manager:** Triage queue, review technician workloads, dispatch tickets, configure PM plans.
  - **Technician:** Mobile job view, accept/decline jobs, log diagnosis, labor hours, and spare parts.
  - **Administrator:** Member invitations, facility building/room manager, and immutable audit logs.
- **Key Talking Points:**
  - Mention that each role gets an isolated, purpose-built dashboard rather than a cluttered generic view.
- **Suggested Visuals:**
  - RBAC Matrix table or 4-quadrant diagram displaying the 4 role personas.

---

## Slide 7: Maintenance Lifecycle State Machine
- **Slide Title:** The Request Lifecycle State Machine
- **Key Bullet Points:**
  - Requests cannot skip states or arbitrarily close.
  - `Submitted` → Manager triages and assigns technician → `Assigned`.
  - `Assigned` → Technician accepts on mobile → `Accepted`.
  - `Accepted` → Technician commences work on-site → `In Progress`.
  - `In Progress` → Work & parts logged, completion filed → `Awaiting Verification`.
  - `Awaiting Verification` → Customer confirms fix → `Closed` (or reopens with reason → `Reopened`).
- **Key Talking Points:**
  - Highlight the `Reopened` branch: if a repair fails quality inspection, the customer reopens the ticket, which alerts management and increments the reopen counter for analytics.
- **Suggested Visuals:**
  - Finite State Machine diagram (`Submitted` through `Closed` / `Reopened`).

---

## Slide 8: Database Design & Persistent Object Storage
- **Slide Title:** Relational Database & Persistent Storage Pipeline
- **Key Bullet Points:**
  - **Normalized Schema:** 17 tables with UUID primary keys and foreign key cascades.
  - **Eager Prefetching:** Uses SQLAlchemy `joinedload` and `selectinload` to eliminate N+1 queries.
  - **The Ephemeral Container Problem:** Cloud containers (Render) erase disk files on sleep/reboot.
  - **The ZERVUONO Solution:** Binary image bytes stored in PostgreSQL `attachments.file_data` (`BYTEA`).
  - Served directly via `/api/v1/files/{id}/view` with HTTP 200 OK, inline streaming, and immutable caching.
- **Key Talking Points:**
  - Emphasize this technical triumph: even if Render sleeps or reboots, images remain permanently visible and return HTTP 200 to the browser.
- **Suggested Visuals:**
  - Simplified Entity-Relationship Diagram (ERD) and the `BYTEA` storage flow diagram.

---

## Slide 9: AI Diagnostic Assistance & Predictive Troubleshooting
- **Slide Title:** AI Assistance: Google Gemini Integration
- **Key Bullet Points:**
  - **Automated Categorization:** Analyzes issue title & description to detect fault category and priority tier.
  - **Field Troubleshooting Drawer:** Generates probable causes, step-by-step diagnostic procedures, and safety precautions.
  - **Historical Memory:** Queries the organization database for past resolved tickets on the same equipment category.
  - **Deterministic Fallback:** Seamlessly switches to a rule-based expert engine if API keys are absent or rate-limited.
- **Key Talking Points:**
  - Explain that AI is used responsibly: it augments the technician with expert checklists and safety rules (e.g., Lockout/Tagout reminders) without replacing human judgment.
- **Suggested Visuals:**
  - Screenshot of the AI Troubleshooting Drawer showing diagnostic steps and similar past issues.

---

## Slide 10: Security Implementation & Compliance
- **Slide Title:** Security Architecture & Defense-in-Depth
- **Key Bullet Points:**
  - **Argon2id Hashing:** Resistant to GPU cracking and side-channel attacks.
  - **Dual Token Session Management:** Stateless JWT Bearer token + `HttpOnly`, `SameSite=Lax` cookies.
  - **Header Scoping:** `X-Organization-Id` enables frictionless multi-organization membership switching.
  - **Zero User Enumeration:** Forgot-password endpoints return identical generic responses regardless of email existence.
  - **Immutable Audit Events:** All logins, dispatches, and status updates logged with actor ID and IP address.
- **Key Talking Points:**
  - Summarize that ZERVUONO follows OWASP Top 10 guidelines for web application security.
- **Suggested Visuals:**
  - Security flow diagram showing token validation and tenant membership verification.

---

## Slide 11: Testing, Verification & Quality Assurance
- **Slide Title:** Comprehensive Testing & Verification Evidence
- **Key Bullet Points:**
  - **Backend Pytest Suite:** 17 tests passed in 3.81s (Auth, RBAC, Multitenancy, Workflows).
  - **Frontend Vitest Suite:** 8 tests passed in 16.68s (Session storage, API error boundaries).
  - **Frontend Production Build:** Vite compiled 1,650 modules in 3.75s with zero TypeScript errors.
  - **Live Production E2E Verification:** Live tickets (`REQ-1020`, `REQ-1021`) executed against Neon PostgreSQL and Render backend with 100% success.
  - **100% Real Data:** No fake, mock, or hardcoded dummy records used in production.
- **Key Talking Points:**
  - State with confidence that the application has been verified both locally and live in the cloud.
- **Suggested Visuals:**
  - Screenshot of green Pytest output (17 passed) and Vitest terminal output.

---

## Slide 12: Conclusion, Limitations & Future Enhancements
- **Slide Title:** Conclusion & Future Road Map
- **Key Bullet Points:**
  - **Project Outcome:** Successfully engineered and deployed an enterprise-grade CMMS SaaS platform.
  - **Known Limitations:** Render free-tier cold starts (30s initial delay); HTTP polling instead of WebSockets.
  - **Future Road Map:**
    - React Native / Flutter mobile applications with offline IndexedDB synchronization.
    - IoT telematics ingestion (MQTT) for automated machine-to-cloud fault reporting.
    - Physical QR code equipment tagging for instant scan-and-report workflows.
- **Closing Statement:** *"ZERVUONO delivers the operational rhythm modern enterprises need to keep work moving."*
- **Q&A Slide:** Thank You. Questions & Discussion.
- **Suggested Visuals:**
  - Live demo link (`https://zervuono.vercel.app`) and GitHub QR code.
