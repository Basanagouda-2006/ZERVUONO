# ZERVUONO — 5-Minute Live Demonstration Script & Backup Protocol

**Objective:** Demonstrate the complete end-to-end maintenance operations workflow across all 4 roles (**Customer → Manager → Technician → Customer Verification → Admin Audit**) in under 5 minutes during a viva exam or recruiter walkthrough.

---

## 📋 Pre-Demo Checklist (2 Minutes Before Demo)

1. **Open Live Website:** [https://zervuono.vercel.app](https://zervuono.vercel.app) in Google Chrome.
2. **Wake Up Render Backend:** Open [https://zervono-api.onrender.com/health](https://zervono-api.onrender.com/health) in a browser tab.
   - If the server was sleeping, this initiates the 30–45s cold start before you begin speaking.
   - Once it responds `{"status": "healthy", "database": "connected"}`, your live demo will be blazing fast.
3. **Demo User Accounts:**
   - **Customer:** `customer@zervuno.com` / `Password123!`
   - **Manager:** `manager@zervuno.com` / `Password123!`
   - **Technician:** `tech@zervuno.com` / `Password123!`
   - **Administrator:** `admin@zervuno.com` / `Password123!`
   *(Note: The login page at `/login` includes 1-Click Quick Login buttons for all 4 accounts).*

---

## ⏱️ Minute-by-Minute Demonstration Flow

### 🕒 Minute 1: Public Landing & Customer Issue Reporting
**Spoken Narration:**  
> *"Good morning respected examiners. This is ZERVUONO, an autonomous maintenance operations platform. In any commercial facility, breakdowns happen without warning. Let me show you how a customer reports an issue in under 30 seconds."*

**Actions:**
1. Navigate to `/login` and click **"Customer (Elena)"** for 1-Click login.
2. The browser redirects to `/customer` (Customer Maintenance Hub).
3. Click the green button: **`+ Report Maintenance Issue`**.
4. In the modal:
   - **Title:** `Rooftop Chiller High Pressure Warning`
   - **Description:** `Circuit 3 is throwing a high-pressure differential cut-out alarm. Compressor cycling frequently.`
   - Notice the AI assistance automatically detects **Category: HVAC** and **Priority: High**.
   - **Location:** Select or type `North Wing - Logistics Hub`.
   - **Photo Upload:** Select any sample JPEG/PNG photo from your computer.
5. Click **Submit Request**.
6. **Result:** An alert confirms ticket creation: **`REQ-1022`** (or next serial ID).
7. Point out: The ticket immediately appears in the Customer's active list in `Submitted` status with photo attached.

---

### 🕒 Minute 2: Manager Triage & Workload-Aware Dispatch
**Spoken Narration:**  
> *"Now let's switch to the Facilities Manager, David Miller, who oversees all facility queues and team workloads."*

**Actions:**
1. Click the top navbar profile icon → **Sign Out**.
2. On `/login`, click **"Manager (David)"** 1-Click login.
3. The browser lands on `/manager` (Manager Operations Board).
4. Point out the top **Requests Queue**:
   - The newly created ticket `REQ-1022` is instantly visible at the top of the table.
5. Point out the **Technician Workload** cards:
   - Shows active jobs count for each technician to prevent overloading.
6. On the row for `REQ-1022`, click **Assign**:
   - Select Technician: **Alex Vance**.
   - Priority: **Urgent**.
   - Instructions: `Inspect high-pressure relief valve and clean condenser coils.`
   - Click **Confirm Assignment**.
7. **Result:** The ticket status badge immediately flips to **`Assigned`** with a green toast notification.

---

### 🕒 Minute 3: Technician Mobile Execution & Work Logging
**Spoken Narration:**  
> *"Now let's look at the field technician's view on mobile. Alex Vance arrives on-site with his smartphone."*

**Actions:**
1. Sign out and click **"Technician (Alex)"** on `/login`.
2. *(Optional Pro-Tip: Press `F12` in Chrome and toggle the Device Toolbar `Ctrl+Shift+M` to show mobile smartphone view).*
3. The dashboard shows Alex's assigned jobs:
   - Click **Accept Job** on `REQ-1022`. Status updates to `Accepted`.
   - Click **Start Work**. Status updates to `In Progress`.
4. Demonstrate **AI Diagnostic Assistance**:
   - Click the purple **AI Troubleshoot** button.
   - The drawer opens with step-by-step inspection procedures and past similar HVAC fixes.
5. Demonstrate **Labor & Parts Logging**:
   - Click **Log Work**: enter diagnosis `Clogged condenser fins`, actions `High-pressure nitrogen blowdown`, hours `1.5`, and save.
   - Click **Log Materials**: enter item `Nitrogen Canister 50L`, quantity `1`, cost `$35.00`, and save.
6. Click **Complete Job**:
   - Completion Summary: `Condenser coils cleared. Operating head pressure normalized to 240 PSI.`
   - Click **Submit Completion Proof**.
7. **Result:** Status transitions to **`Awaiting Verification`**.

---

### 🕒 Minute 4: Customer Verification & 5-Star Sign-Off
**Spoken Narration:**  
> *"In traditional systems, the technician marks it done and walks away. In ZERVUONO, work is never closed until the customer inspects and signs off."*

**Actions:**
1. Sign out and log back in as **"Customer (Elena)"**.
2. Immediately point out the **Urgent Amber Alert Banner** at the top of the Customer Hub:
   - *"Action Required: Work order REQ-1022 is awaiting your verification!"*
3. Click **Review REQ-1022**:
   - The customer reviews the technician's completion summary, logged parts, and evidence photo.
4. Click **Confirm Resolution**:
   - Select **5 Stars** ⭐⭐⭐⭐⭐.
   - Feedback: `Chiller is running cold and quiet. Exceptional service!`
   - Click **Verify & Close Work Order**.
5. **Result:** Status badge turns emerald green: **`Closed`**. The work order is officially complete!

---

### 🕒 Minute 5: Admin Audit Trail & Real-Time Operational Analytics
**Spoken Narration:**  
> *"Finally, let's view the platform from an executive standpoint as Administrator Sarah Jenkins."*

**Actions:**
1. Sign out and log in as **"Admin (Sarah)"**.
2. Open the **Audit Logs** tab:
   - Point out the immutable audit entries generated during this demo: `USER_LOGIN`, `TECHNICIAN_ASSIGNED`, `WORK_STARTED`, `VERIFIED_AND_CLOSED` with exact timestamps and actor names.
3. Open the **Analytics & Reports** tab:
   - Point out the live metrics calculated directly from PostgreSQL:
     - Total Requests, Closed Requests count, Average Resolution Hours, and Customer Satisfaction rating.
4. Conclude presentation:
   > *"As you have seen, ZERVUONO transforms unpredictable breakdowns into a verifiable, auditable rhythm. Thank you, and I welcome any questions."*

---

## 🛡️ Emergency Backup Protocol (Fail-Safe Plan)

In academic vivas and presentations, network hiccups, Wi-Fi drops, or cloud cold starts can happen. Follow these steps if the live site experiences delays:

### Scenario A: Cloud Backend is Cold-Starting (Spin-up Delay)
1. If the live site shows *"Authenticating session..."* for more than 15 seconds, explain to the evaluators:
   > *"The cloud backend is hosted on a free-tier Render container that spins down when idle. It takes approximately 30 seconds to initialize."*
2. Simply refresh `https://zervono-api.onrender.com/health` in another tab until it returns `{"status": "healthy"}`. Then refresh the frontend.

### Scenario B: Cloud Network Disconnection (Run Local Full-Stack in 20 Seconds)
If college Wi-Fi blocks cloud ports or internet is completely unavailable:

1. Open PowerShell terminal in `d:\ZENVURO`:
   ```powershell
   cd d:\ZENVURO\backend
   .\.venv\Scripts\Activate.ps1
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. Open a second PowerShell terminal:
   ```powershell
   cd d:\ZENVURO\frontend
   npm run dev
   ```
3. Open browser to `http://localhost:5173`.
4. Perform the exact same 5-minute demo locally! All demo roles and database operations will function identically at lightning speed.

### Scenario C: Fast Automated Script Demonstration
To prove that the live backend API and database work end-to-end in just 10 seconds:
```powershell
cd d:\ZENVURO
python "C:\Users\basan\.gemini\antigravity\brain\02c61cba-7434-497c-9a8e-3bd69510424f\scratch\live_e2e_check.py"
```
This script executes all 4 logins, ticket creation, dispatch, technician work log, completion, customer verification, and analytics calculation live on the cloud backend, displaying green `[OK]` marks for every step on the terminal screen!
