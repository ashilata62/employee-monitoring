# Complete REST & Real-Time API Specification

**Document Version:** 1.0.0  
**Effective Date:** November 19, 2026  
**Base URL (Local):** `http://localhost:5000/api`  
**Base URL (Production):** Configured via `VITE_API_URL` (e.g., `https://insight-pool-production.up.railway.app/api`)  
**Transport Protocols:** HTTP/1.1, WebSocket (Socket.IO v4)  

---

## 1. Global API Standards & Conventions

### 1.1 Authentication & Request Headers
All protected API endpoints require an Authorization header containing a valid Bearer token:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### 1.2 Unified Response Envelopes

#### Standard Success Envelope (HTTP 200, 201)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

#### Standard Error Envelope (HTTP 400, 401, 403, 404, 500)
```json
{
  "success": false,
  "message": "Descriptive error message",
  "error": "Error details or validation array"
}
```

---

## 2. Core API Modules Directory

---

### 2.1 Authentication Module (`/api/auth`)

#### `POST /api/auth/register`
- **Purpose:** Public self-registration (Default Employee).
- **Auth Required:** No.
- **Request Body:** `{ fullName, email, password }`
- **Response:** HTTP 201 `{ success: true, token, user }`

#### `POST /api/auth/register-admin`
- **Purpose:** Provision new administrative account and create default Organization.
- **Auth Required:** No.
- **Request Body:** `{ legalName, name, email, password }`
- **Response:** HTTP 201 `{ success: true, token, user, organization }`

#### `POST /api/auth/login`
- **Purpose:** Authenticate existing user.
- **Auth Required:** No.
- **Request Body:** `{ email, password }`
- **Response:** HTTP 200 `{ success: true, token, user: { id, email, role, employeeId, organizationId } }`

#### `POST /api/auth/logout`
- **Purpose:** End active user session.
- **Auth Required:** Yes (`Bearer <token>`).
- **Response:** HTTP 200 `{ success: true, message: "Logged out successfully" }`

#### `GET /api/auth/me`
- **Purpose:** Retrieve active user profile, linked employee profile, and live attendance state.
- **Auth Required:** Yes.
- **Response:** HTTP 200 `{ success: true, data: { user, employee, activeSession } }`

#### `POST /api/auth/invitations/send`
- **Purpose:** Send secure email invitation with tokenized setup link.
- **Auth Required:** Yes (`ADMIN` or `MANAGER`).
- **Request Body:** `{ email, fullName, role, teamId }`
- **Response:** HTTP 200 `{ success: true, message: "Invitation dispatched" }`

#### `POST /api/auth/invitations/complete`
- **Purpose:** Finalize password setup from tokenized invite link.
- **Auth Required:** No.
- **Request Body:** `{ token, password }`
- **Response:** HTTP 200 `{ success: true, message: "Account setup finalized" }`

---

### 2.2 Organizations Module (`/api/organization`)

#### `GET /api/organization`
- **Purpose:** Fetch current organization profile and working shift configurations.
- **Auth Required:** Yes (`ADMIN`, `MANAGER`).
- **Response:** HTTP 200 `{ success: true, data: { id, legalName, workStartTime, workEndTime, workDays } }`

#### `PUT /api/organization`
- **Purpose:** Update organization operational parameters.
- **Auth Required:** Yes (`ADMIN`).
- **Request Body:** `{ legalName, timeZone, workStartTime, workEndTime, workDays }`
- **Response:** HTTP 200 `{ success: true, data: organization }`

---

### 2.3 Teams Module (`/api/teams`)

#### `GET /api/teams`
- **Purpose:** List all organizational teams/departments with member counts.
- **Auth Required:** Yes.
- **Response:** HTTP 200 `{ success: true, data: [ { id, name, description, color, _count: { employees } } ] }`

#### `POST /api/teams`
- **Purpose:** Create a new team.
- **Auth Required:** Yes (`ADMIN`).
- **Request Body:** `{ name, description, color }`
- **Response:** HTTP 201 `{ success: true, data: team }`

---

### 2.4 Employees Module (`/api/employees`)

#### `GET /api/employees`
- **Purpose:** List all employees with active presence, team assignments, and tracking profiles.
- **Auth Required:** Yes (`ADMIN`, `MANAGER`).
- **Query Parameters:** `?teamId=...&status=...&search=...`
- **Response:** HTTP 200 `{ success: true, data: [ employee, ... ] }`

#### `POST /api/employees`
- **Purpose:** Manually create an employee record.
- **Auth Required:** Yes (`ADMIN`).
- **Request Body:** `{ fullName, email, role, teamId, hourlyRate, computerType, workMode }`
- **Response:** HTTP 201 `{ success: true, data: employee }`

#### `GET /api/employees/:id`
- **Purpose:** Fetch detailed employee profile with recent attendance, productivity ratio, and hardware specs.
- **Auth Required:** Yes.
- **Response:** HTTP 200 `{ success: true, data: employeeDetail }`

#### `PUT /api/employees/:id`
- **Purpose:** Update employee settings or deactivate account.
- **Auth Required:** Yes (`ADMIN`).
- **Request Body:** `{ fullName, role, teamId, status, hourlyRate }`
- **Response:** HTTP 200 `{ success: true, data: employee }`

---

### 2.5 Time & Attendance Module (`/api/attendance`)

#### `POST /api/attendance/clock-in`
- **Purpose:** Clock in and initiate active work session.
- **Auth Required:** Yes.
- **Response:** HTTP 200 `{ success: true, data: { attendanceId, clockIn, status: 'ACTIVE' } }`

#### `POST /api/attendance/clock-out`
- **Purpose:** Clock out and finalize work duration.
- **Auth Required:** Yes.
- **Response:** HTTP 200 `{ success: true, data: { attendanceId, clockOut, duration } }`

#### `POST /api/attendance/break`
- **Purpose:** Start or end employee break session.
- **Auth Required:** Yes.
- **Request Body:** `{ action: 'start' | 'end' }`
- **Response:** HTTP 200 `{ success: true, message: "Break status updated" }`

#### `GET /api/attendance/status`
- **Purpose:** Return current live stopwatch seconds and clock-in state for requesting user.
- **Auth Required:** Yes.
- **Response:** HTTP 200 `{ success: true, data: { isClockedIn, isOnBreak, sessionSeconds, activeSession } }`

---

### 2.6 Activity & Intraday Monitoring Module (`/api/activity` & `/api/activities`)

#### `GET /api/activities/timeline`
- **Purpose:** Return 24-hour hourly density matrix for team or employee on target date.
- **Auth Required:** Yes.
- **Query Parameters:** `?date=YYYY-MM-DD&employeeId=...&teamId=...`
- **Response:** HTTP 200 `{ success: true, data: [ { hour: 9, active: 3600, idle: 0, break: 0 }, ... ] }`

#### `GET /api/activities/logs`
- **Purpose:** Paginated raw application and window title logs.
- **Auth Required:** Yes.
- **Query Parameters:** `?page=1&limit=50&startDate=...&endDate=...`
- **Response:** HTTP 200 `{ success: true, data: logs, total }`

---

### 2.7 Screenshots Module (`/api/screenshots`)

#### `GET /api/screenshots`
- **Purpose:** Paginated gallery of captured employee screenshots.
- **Auth Required:** Yes (`ADMIN`, `MANAGER`).
- **Query Parameters:** `?employeeId=...&date=YYYY-MM-DD&page=1&limit=24`
- **Response:** HTTP 200 `{ success: true, data: [ { id, imageUrl, capturedAt, employee: { fullName } } ] }`

#### `DELETE /api/screenshots/:id`
- **Purpose:** Manually delete a screenshot asset and database record.
- **Auth Required:** Yes (`ADMIN`).
- **Response:** HTTP 200 `{ success: true, message: "Screenshot permanently deleted" }`

---

### 2.8 Executive Dashboard Module (`/api/dashboard`)

#### `GET /api/dashboard/admin`
- **Purpose:** Aggregated executive metrics for organization (Active time, Productivity ratio, Period comparison deltas).
- **Auth Required:** Yes (`ADMIN`).
- **Query Parameters:** `?startDate=...&endDate=...&compareStartDate=...&compareEndDate=...`
- **Response:** HTTP 200 `{ success: true, data: { summary, summarySeconds, topProductive, empMetrics, isLive } }`

#### `GET /api/dashboard/manager`
- **Purpose:** Team-scoped metrics for assigned subordinates.
- **Auth Required:** Yes (`MANAGER`).
- **Response:** HTTP 200 `{ success: true, data: managerMetrics }`

#### `GET /api/dashboard/employee`
- **Purpose:** Personal productivity and daily clock session metrics.
- **Auth Required:** Yes (`EMPLOYEE`).
- **Response:** HTTP 200 `{ success: true, data: employeeMetrics }`

---

### 2.9 Desktop Agent Ingestion Module (`/api/agent`)

#### `POST /api/agent/setup-verify`
- **Purpose:** Authenticate agent installation token and link device.
- **Auth Required:** No (Token in body).
- **Request Body:** `{ inviteToken, deviceId, os, hostname }`
- **Response:** HTTP 200 `{ success: true, employeeId, organizationId, agentToken }`

#### `POST /api/agent/screenshot`
- **Purpose:** Ingest screenshot image buffer from desktop agent.
- **Auth Required:** Yes (Agent token).
- **Request Format:** Multipart Form-Data with file field `screenshot`.
- **Response:** HTTP 201 `{ success: true, screenshotId, url }`

#### `GET /api/agent/download`
- **Purpose:** Download Windows Desktop Agent installer (.exe).
- **Auth Required:** No.
- **Response:** Binary executable stream `EMS-Tracker-Setup.exe` (or HTTP 404 if not present on server).

---

### 2.10 Timesheets Module (`/api/timesheets`)

#### `GET /api/timesheets/weekly`
- **Purpose:** Weekly aggregated timesheets grid.
- **Auth Required:** Yes.
- **Query Parameters:** `?weekStartDate=YYYY-MM-DD&employeeId=...`
- **Response:** HTTP 200 `{ success: true, data: timesheetData }`

#### `PUT /api/timesheets/:id/approve`
- **Purpose:** Approve employee timesheet.
- **Auth Required:** Yes (`ADMIN`, `MANAGER`).
- **Response:** HTTP 200 `{ success: true, data: { status: 'APPROVED' } }`

#### `PUT /api/timesheets/:id/reject`
- **Purpose:** Reject employee timesheet with comments.
- **Auth Required:** Yes (`ADMIN`, `MANAGER`).
- **Request Body:** `{ rejectionReason }`
- **Response:** HTTP 200 `{ success: true, data: { status: 'REJECTED' } }`

---

## 3. Real-Time Socket.IO Event Specification

### 3.1 Inbound Events (Client / Agent -> Server)

| Event Name | Sender | Payload Structure | Description |
| :--- | :--- | :--- | :--- |
| `employee:activity` | Agent | `{ activeApp, activeWindow, keystrokes, idleTime, taskId }` | High-frequency telemetry pulse. |
| `employee:status_override` | Agent | `{ status: 'ON_BREAK' \| 'ONLINE' }` | Explicit shift status toggle. |
| `live:request` | Admin UI | `{ employeeId }` | Requests live WebRTC screen stream. |
| `live:offer` | Agent | `{ requesterId, offer }` | WebRTC session description offer. |
| `live:answer` | Admin UI | `{ employeeId, answer, targetId }` | WebRTC session description answer. |
| `live:candidate` | Any | `{ targetId, candidate }` | WebRTC ICE candidate exchange. |

### 3.2 Outbound Broadcast Events (Server -> Client)

| Event Name | Target Room | Payload Structure | Frontend Action |
| :--- | :--- | :--- | :--- |
| `employee:status` | `org_${orgId}` | `{ employeeId, status }` | Updates presence pill on dashboard and tables. |
| `activity:update` | `org_${orgId}` | `{ employeeId, activeApp, productivity, duration }` | Ticks intraday timeline bar live. |
| `screenshot:new` | `org_${orgId}` | `{ screenshotId, imageUrl, employeeId, capturedAt }` | Inserts new card into Screenshot Gallery. |
| `violation:new` | `org_${orgId}_managers` | `{ alertId, employeeName, ruleName, severity }` | Triggers alert audio tone and manager toast. |
| `attendance:update`| `employee_${empId}` | `{ isClockedIn, isOnBreak, sessionSeconds }` | Synchronizes personal digital stopwatch. |
| `notification:new` | `employee_${empId}` | `{ id, title, message, type, unread: true }` | Increments notification Bell badge count. |
