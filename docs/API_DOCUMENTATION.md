# ZERVUONO — RESTful API Specification

**Base URLs:**
- Local Development: `http://127.0.0.1:8000/api/v1`
- Cloud Production: `https://zervono-api.onrender.com/api/v1`
- Interactive OpenAPI Docs: `https://zervono-api.onrender.com/docs`

---

## 1. Authentication & Common Headers

Most endpoints require authentication. The API supports both **Bearer Token** authorization and secure **HttpOnly Cookies**.

### Request Headers
| Header | Type | Description |
|---|---|---|
| `Authorization` | `string` | Format: `Bearer <jwt_token>` (Mandatory for mobile & cross-origin clients) |
| `X-Organization-Id`| `string (UUID)` | Optional. Targets a specific organization membership if user belongs to multiple organizations. |
| `Content-Type` | `string` | `application/json` (or `multipart/form-data` for file uploads) |

### Common Error Responses
- `401 Unauthorized`: Missing, expired, or invalid JWT token.
- `403 Forbidden`: User authenticated, but lacks required role or organization membership.
- `404 Not Found`: Target entity UUID does not exist within the scoped organization.
- `422 Unprocessable Entity`: Request body failed Pydantic schema validation.

---

## 2. System Endpoints

### `GET /health`
Verifies backend service availability and database connectivity.
- **Auth:** None (Public)
- **Response 200 OK:**
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "version": "1.0.0",
    "environment": "production",
    "timestamp": 1728388700.123
  }
  ```
- **Response 503 Service Unavailable:** Returned if PostgreSQL database connection fails.

### `GET /`
Returns service metadata and link to Swagger documentation.
- **Auth:** None (Public)
- **Response 200 OK:**
  ```json
  {
    "name": "Zervuno",
    "tagline": "Keep work moving.",
    "version": "1.0.0",
    "docs_url": "/docs",
    "api_v1": "/api/v1"
  }
  ```

---

## 3. Authentication Endpoints (`/auth`)

### `POST /auth/register`
Creates a new user account, creates an organization or joins an existing one, sets HttpOnly cookie, and returns access token.
- **Auth:** None (Public)
- **Request Body (`application/json`):**
  ```json
  {
    "email": "technician.smith@example.com",
    "password": "SecurePassword123!",
    "full_name": "John Smith",
    "phone": "+1-555-0199",
    "organization_name": "Apex Logistics",
    "role": "Technician"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user": {
      "id": "e4b52b21-4f11-4ad9-bfcf-7ccae4b29bb2",
      "email": "technician.smith@example.com",
      "full_name": "John Smith",
      "phone": "+1-555-0199",
      "avatar_url": null,
      "is_active": true,
      "is_verified": true,
      "organization_id": "59ef8dca-728b-4e93-b510-cf8c09039c8d",
      "organization_name": "Apex Logistics",
      "role": "Technician"
    }
  }
  ```

### `POST /auth/login`
Authenticates user with email and password.
- **Auth:** None (Public)
- **Request Body:**
  ```json
  {
    "email": "manager@zervuno.com",
    "password": "Password123!"
  }
  ```
- **Response 200 OK:** Returns `TokenResponse` with `access_token` and `user` summary.

### `POST /auth/logout`
Deletes the session cookie and invalidates client session.
- **Auth:** Bearer Token
- **Response 200 OK:** `{"message": "Successfully logged out."}`

### `GET /auth/me`
Retrieves current authenticated user profile, organization, and role.
- **Auth:** Bearer Token
- **Response 200 OK:** Returns `UserAuthSummary`.

### `POST /auth/forgot-password`
Initiates a password reset workflow.
- **Request Body:** `{"email": "user@example.com"}`
- **Response 200 OK:** `{"message": "If an account with that email exists, reset instructions have been generated."}`

### `POST /auth/reset-password`
Completes password reset using single-use token.
- **Request Body:** `{"token": "random_token_str", "new_password": "NewSecurePassword123!"}`
- **Response 200 OK:** `{"message": "Password has been successfully updated. You can now sign in."}`

### `POST /auth/change-password`
Updates password for an active authenticated user.
- **Auth:** Bearer Token
- **Request Body:** `{"current_password": "OldPassword123!", "new_password": "NewSecurePassword123!"}`
- **Response 200 OK:** `{"message": "Password updated successfully."}`

---

## 4. Maintenance Requests (`/requests`)

### `GET /requests/`
Lists maintenance requests scoped to the user's organization and role.
- **Auth:** Bearer Token
- **Query Parameters:**
  - `status` (`string`, optional): Filter by status (`Submitted`, `Assigned`, `In Progress`, etc.).
  - `category` (`string`, optional): Filter by category (`HVAC`, `Electrical`, etc.).
  - `priority` (`string`, optional): Filter by priority (`Low`, `Medium`, `High`, `Urgent`).
  - `my_assigned` (`bool`, optional): Filter to jobs assigned to the caller.
  - `my_created` (`bool`, optional): Filter to tickets created by the caller.
- **Response 200 OK:** Array of `MaintenanceRequestResponse` with nested relationships (requester, technician, location, asset, attachments, work logs, materials, status history, feedback).

### `POST /requests/`
Creates a new maintenance work order.
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "title": "Chiller circuit pressure differential alarm",
    "description": "Continuous high-pressure cut-out warning on circuit 3.",
    "category": "HVAC",
    "priority": "High",
    "location_name": "Main Rooftop Chiller Plant",
    "location_details": "Roof access via staircase B",
    "asset_id": null
  }
  ```
- **Response 201 Created:** Returns full `MaintenanceRequestResponse` including auto-generated `request_number` (`REQ-1001`).

### `GET /requests/{id}`
Retrieves full details of a single request.
- **Auth:** Bearer Token
- **Response 200 OK:** Returns `MaintenanceRequestResponse`.

### `POST /requests/{id}/assign`
Dispatches a technician and sets priority/instructions.
- **Auth:** Bearer Token (`Manager` or `Admin` role required)
- **Request Body:**
  ```json
  {
    "technician_id": "f516a8d3-7d24-4f8e-a2b1-9c60e0a58142",
    "priority": "Urgent",
    "due_date": "2026-10-25T18:00:00Z",
    "manager_instructions": "Inspect harmonic drive gear and verify encoder calibration."
  }
  ```
- **Response 200 OK:** Returns updated `MaintenanceRequestResponse` (`status: "Assigned"`).

### `POST /requests/{id}/claim`
Allows a technician to self-claim an open, unassigned request.
- **Auth:** Bearer Token (`Technician` or `Admin` role required)
- **Response 200 OK:** Returns updated request assigned to the caller (`status: "Accepted"`).

### `POST /requests/{id}/accept`
Technician accepts an assigned job.
- **Auth:** Bearer Token (`Technician`, `Manager`, or `Admin`)
- **Response 200 OK:** Status becomes `Accepted`.

### `POST /requests/{id}/decline`
Technician declines an assignment with explanation.
- **Auth:** Bearer Token
- **Request Body:** `{"reason": "Requires specialized 10kV high-voltage certification."}`
- **Response 200 OK:** Status reverts to `Under Review`.

### `POST /requests/{id}/start`
Technician begins on-site execution.
- **Auth:** Bearer Token (`Technician`, `Manager`, or `Admin`)
- **Response 200 OK:** Status becomes `In Progress`.

### `POST /requests/{id}/work-logs`
Records labor hours and technical notes.
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "diagnosis": "Loose optical encoder coupling disc.",
    "actions_taken": "Realigned disc, torqued clamping ring to 4.2 Nm, recalibrated loop.",
    "hours_spent": 1.5
  }
  ```
- **Response 200 OK:** Returns `WorkLogResponse`.

### `POST /requests/{id}/materials`
Logs consumed spare parts and components.
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "item_name": "Encoder Flexible Coupling (Aluminum Bellows)",
    "quantity": 1,
    "unit": "pcs",
    "cost": 45.00
  }
  ```
- **Response 200 OK:** Returns `MaterialUsageResponse`.

### `POST /requests/{id}/complete`
Technician files completion report.
- **Auth:** Bearer Token
- **Request Body:**
  ```json
  {
    "completion_summary": "Replaced coupling and verified smooth trajectories across 150 cycles.",
    "diagnosis": null,
    "actions_taken": null,
    "hours_spent": 0.25
  }
  ```
- **Response 200 OK:** Status becomes `Awaiting Verification`.

### `POST /requests/{id}/verify`
Customer confirms repair resolution or reopens the issue.
- **Auth:** Bearer Token (`Customer`, `Manager`, or `Admin`)
- **Request Body (Verify & Close):**
  ```json
  {
    "confirmed": true,
    "feedback_rating": 5,
    "feedback_comments": "Equipment is running flawlessly at full capacity. Great job!"
  }
  ```
- **Request Body (Reopen):**
  ```json
  {
    "confirmed": false,
    "reopen_reason": "Vibration returned once chiller reached 90% load."
  }
  ```
- **Response 200 OK:** Status becomes `Closed` (if confirmed) or `Reopened` (if rejected).

### `POST /requests/{id}/feedback`
Submits standalone customer rating (1–5) and review.
- **Auth:** Bearer Token
- **Request Body:** `{"rating": 5, "comments": "Fast and clean work."}`
- **Response 200 OK:** Returns `FeedbackResponse`.

---

## 5. File Uploads & Evidence Serving (`/files`)

### `POST /files/upload`
Uploads image or document evidence with persistent database storage.
- **Auth:** Bearer Token
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `file`: Binary file stream (max 20 MB).
  - `request_id` (`string`, optional): Target request UUID.
  - `attachment_type` (`string`): `Initial`, `Before`, `After`, `Document`.
- **Response 200 OK:**
  ```json
  {
    "id": "1716356e-ea2d-431a-b594-280f7789181b",
    "file_name": "condenser_leak.jpg",
    "file_size": 149,
    "mime_type": "image/jpeg",
    "url": "/api/v1/files/1716356e-ea2d-431a-b594-280f7789181b/view",
    "attachment_type": "Initial",
    "uploaded_by_id": "e4b52b21-4f11-4ad9-bfcf-7ccae4b29bb2",
    "created_at": "2026-10-08T11:58:20Z"
  }
  ```

### `GET /files/{attachment_id}/view`
Public/browser direct streaming endpoint delivering binary images from PostgreSQL `BYTEA` storage.
- **Auth:** None (Direct Browser URL)
- **Response Headers:**
  - `Content-Type: image/jpeg` (or matching MIME)
  - `Content-Disposition: inline; filename="condenser_leak.jpg"`
  - `Cache-Control: public, max-age=31536000, immutable`
- **Response 200 OK:** Raw binary image stream.

---

## 6. Operational Reports & Analytics (`/reports`)

### `GET /reports/summary`
Calculates live operational metrics directly from PostgreSQL.
- **Auth:** Bearer Token (`Manager` or `Admin` role required)
- **Response 200 OK:**
  ```json
  {
    "total_requests": 21,
    "open_requests": 13,
    "unassigned_requests": 2,
    "in_progress_requests": 4,
    "awaiting_verification": 3,
    "closed_requests": 8,
    "reopened_requests": 1,
    "reopen_rate_percent": 4.76,
    "avg_resolution_hours": 9.0,
    "avg_response_hours": 1.2,
    "avg_rating": 4.9,
    "total_ratings_count": 8,
    "technicians_workload": [
      {
        "technician_id": "f516a8d3-7d24-4f8e-a2b1-9c60e0a58142",
        "technician_name": "Alex Vance",
        "avatar_url": null,
        "active_jobs": 3,
        "completed_jobs": 7,
        "avg_hours_per_job": 1.6
      }
    ],
    "categories_breakdown": [
      {"category": "HVAC", "count": 10, "percentage": 47.6},
      {"category": "Mechanical", "count": 6, "percentage": 28.6}
    ],
    "status_breakdown": [
      {"status": "Closed", "count": 8},
      {"status": "In Progress", "count": 4}
    ],
    "generated_at": "2026-10-08T12:00:00Z"
  }
  ```

---

## 7. AI Diagnostic Assistance (`/ai`)

### `POST /ai/recommend`
Analyzes issue text to recommend fault category and priority tier.
- **Request Body:** `{"title": "Water dripping from ceiling above server rack", "description": "Pipe appears to be leaking near cold air return duct."}`
- **Response 200 OK:**
  ```json
  {
    "category": "Plumbing",
    "priority": "Urgent",
    "confidence": 0.94,
    "reasoning": "Detected water leakage keywords in close proximity to critical IT server equipment.",
    "is_ai_generated": true
  }
  ```

### `POST /ai/troubleshoot`
Provides diagnostic checklists, likely causes, and past resolved cases.
- **Request Body:** `{"request_id": "a5f887e1-b161-4a5d-a88c-2e2e9ad92df2"}`
- **Response 200 OK:** Returns `AITroubleshootingResponse`.

---

## 8. Facility Management & Administration

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/organizations/current` | `GET` | All | Fetch active organization profile |
| `/organizations/members` | `GET` | Admin, Mgr | List all registered members and roles |
| `/organizations/technicians` | `GET` | Manager, Admin | List active technicians for dispatching |
| `/organizations/invitations` | `POST` | Admin | Issue new member invitation token |
| `/organizations/accept-invitation` | `POST` | Public | Redeem token and create user account |
| `/locations/` | `GET`, `POST` | Admin, Mgr | List or create buildings, floors, and rooms |
| `/assets/` | `GET`, `POST` | Admin, Mgr | List or register physical equipment |
| `/preventive/` | `GET`, `POST` | Admin, Mgr | List or configure recurring maintenance plans |
| `/preventive/{id}/trigger` | `POST` | Admin, Mgr | Force immediate generation of a PM work order |
| `/notifications/` | `GET` | All | Fetch user notifications |
| `/notifications/unread-count` | `GET` | All | Get unread badge count |
| `/notifications/read` | `POST` | All | Mark notifications as read |
| `/audit/` | `GET` | Admin | View immutable system audit event log |
