# ZERVUONO — Production Deployment & Operations Guide

**Application:** ZERVUONO Facility & Maintenance Operations System  
**Frontend Deployment Platform:** Vercel Edge Network  
**Backend Deployment Platform:** Render Web Services  
**Database Host:** Neon Serverless PostgreSQL  
**Live Frontend:** `https://zervuono.vercel.app`  
**Live API Endpoint:** `https://zervono-api.onrender.com`  
**Live API Documentation (Swagger):** `https://zervono-api.onrender.com/docs`  

---

## 1. Architecture Overview

```mermaid
flowchart TD
    subgraph ClientBrowser["Client Browser (Mobile & Desktop)"]
        UI["React 18 + Vite SPA"]
    end

    subgraph VercelCDN["Vercel Edge Network"]
        StaticAssets["Production Build Assets"]
        RoutingRules["SPA Fallback Routing (vercel.json)"]
    end

    subgraph RenderCloud["Render Web Service"]
        FastAPIApp["FastAPI REST Engine (Uvicorn ASGI)"]
        AutoDoc["Interactive Swagger UI /docs"]
        FileStreaming["Binary Streamer /api/v1/files/{id}/view"]
    end

    subgraph NeonDB["Neon Cloud Database"]
        PG["PostgreSQL Serverless"]
        Tables["Tables: users, requests, attachments, work_logs..."]
        ByteaCol["Persistent BYTEA Storage for Uploads"]
    end

    UI -->|Static Load| VercelCDN
    UI -->|REST API Calls (Bearer JWT)| FastAPIApp
    FastAPIApp -->|Connection Pool (Port 5432 / SSL)| PG
    PG -->|Binary File Bytes| FileStreaming
    FileStreaming -->|HTTP 200 Stream| UI
```

---

## 2. Environment Variables & Secret Configuration

> [!IMPORTANT]
> Never commit actual passwords, secret tokens, or connection strings into version control. Manage all credentials securely within Vercel and Render dashboard settings.

### 2.1 Backend Environment Variables (Render)

Configure these in **Render Dashboard → Service → Environment Variables**:

| Variable Name | Required | Default / Description |
|---|---|---|
| `ENVIRONMENT` | Yes | `production` |
| `PROJECT_NAME` | No | `Zervuno` |
| `SECRET_KEY` | Yes | High-entropy cryptographic random string for JWT signing |
| `ALGORITHM` | Yes | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | `1440` (24 hours) |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection URI (`postgresql://...`) |
| `BACKEND_CORS_ORIGINS` | Yes | `https://zervuono.vercel.app,http://localhost:5173` |
| `STORAGE_BACKEND` | Yes | `local` (uses PostgreSQL `BYTEA` persistent fallback) |
| `UPLOAD_DIR` | Yes | `uploads` |
| `SEED_DEMO_DATA` | Yes | `false` (avoids duplicate seed injections in production) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for automated triage & recommendations |

### 2.2 Frontend Environment Variables (Vercel)

Configure these in **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable Name | Required | Target Value |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | `https://zervono-api.onrender.com` |
| `VITE_APP_TITLE` | No | `Zervuno — Keep work moving.` |

---

## 3. Database Migration & Schema Bootstrapping

Database migrations are managed via Alembic and SQLAlchemy model bindings.

### Local Development / Disposable Testing:
```bash
# Sets up isolated SQLite test database
os.environ["ENVIRONMENT"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///./test_disposable.db"
python -m pytest backend/tests -v
```

### Production Deployment Schema Check:
When Render starts the FastAPI application, the asynchronous lifespan context executes `init_tables()`:
1. Calls `Base.metadata.create_all(bind=engine)` to create any missing tables.
2. Runs schema synchronization:
   ```sql
   ALTER TABLE attachments ADD COLUMN IF NOT EXISTS file_data BYTEA;
   ```
3. Verifies database connectivity with a ping check before opening port traffic.

---

## 4. Frontend Deployment on Vercel

### 4.1 Deployment Configuration (`vercel.json`)
Located in root or frontend root to support HTML5 PushState client routing:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 4.2 Build Steps
1. Push changes to GitHub repository `main` branch.
2. Vercel automatically detects Vite framework.
3. Build command:
   ```bash
   npm run build
   ```
4. Output directory: `dist`
5. Node.js version: `20.x` or `22.x`

---

## 5. Backend Deployment on Render

### 5.1 Service Settings
- **Service Type:** Web Service
- **Environment:** Python 3
- **Root Directory:** `backend`
- **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Health Check Path:** `/health` (Responds with HTTP 200 `{"status":"healthy","database":"connected"}`)

### 5.2 Auto-Deploy
Any push to the `main` branch automatically triggers a zero-downtime rolling build on Render.

---

## 6. Health & Diagnostic Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | `GET` | Health and database readiness check |
| `/docs` | `GET` | Interactive Swagger API documentation |
| `/redoc` | `GET` | ReDoc API documentation |
| `/api/v1/organizations/public-list` | `GET` | Discovery list of registered facilities |
| `/api/v1/files/{attachment_id}/view` | `GET` | Inline binary image delivery from PostgreSQL |

---

## 7. Troubleshooting & Recovery Runbook

1. **Cold-Start Latency (Render Free Tier):**
   - Free-tier Render services sleep after 15 minutes of inactivity.
   - Initial wake-up takes 30–50 seconds.
   - Solution: Production accounts use a paid Starter instance ($7/mo) with zero sleep.
2. **Image Delivery Check:**
   - If an uploaded image fails to render from disk cache, the backend streams the raw bytes directly from PostgreSQL `BYTEA` column `attachments.file_data`.
   - Verify image delivery via `curl -I https://zervono-api.onrender.com/api/v1/files/<id>/view`.
3. **Session Verification:**
   - If a user reports unexpected logout, check `localStorage.getItem('zervuno_token')` and `sessionStorage.getItem('zervuno_token')`.
   - Both storages are synchronized on login and cleared only upon explicit user logout.
