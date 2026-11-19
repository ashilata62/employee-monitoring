# System Workflows & Sequence Guide — Employee Monitoring System

**Document Version:** 1.0.0  
**Effective Date:** November 19, 2026  
**Audience:** Architects, Full-Stack Engineers, DevOps  

---

## 1. System Authentication & Onboarding Workflows

### 1.1 User Login & Session Establishment

```mermaid
sequenceDiagram
    autonumber
    actor User as Employee / Admin
    participant UI as React Frontend
    participant API as Express API (/api/auth/login)
    participant DB as MySQL Database
    participant Sock as Socket.IO Server

    User->>UI: Enters Email & Password
    UI->>API: POST /api/auth/login { email, password }
    API->>DB: prisma.user.findUnique({ where: { email } })
    DB-->>API: User Record with Password Hash
    API->>API: bcrypt.compare(password, user.password)
    API->>API: generateToken({ userId, email, role, employeeId, organizationId })
    API-->>UI: HTTP 200 { token, user }
    UI->>UI: localStorage.setItem('token', token)
    UI->>Sock: io.connect('/', { auth: { token } })
    Sock->>Sock: verifyToken(token) & join rooms: org_${orgId}, employee_${empId}
    UI->>UI: Navigate to /:role/dashboard
```

- **Initiator:** End-user (Admin, Manager, or Employee).
- **Frontend Action:** Submits credentials form on `/login`.
- **API Endpoint:** `POST /api/auth/login`.
- **Backend Processing:** Validates credentials via `bcrypt.compare`, verifies account is not deactivated, crafts JWT signed with `JWT_SECRET`.
- **Database Operations:** Queries `users` and `employees` tables.
- **Response:** HTTP 200 `{ success: true, token, user }`.
- **Subsequent Action:** Frontend stores JWT, initializes Socket.IO connection, and redirects to role-based dashboard.

---

### 1.2 Employee Invitation & Tokenized Password Setup

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant UI as Admin Portal
    participant API as Express API
    participant Mail as Nodemailer SMTP
    actor Emp as New Employee
    participant Agent as Desktop Agent Setup

    Admin->>UI: Fills "Add Employee" Modal
    UI->>API: POST /api/employees/invite or /api/auth/invitations/send
    API->>API: crypto.randomBytes(32) -> rawToken
    API->>API: hashToken(rawToken)
    API->>API: prisma.invitationToken.create(...)
    API->>Mail: sendMail(employee.email, setupLink)
    Mail-->>Emp: Email with tokenized link: /setup-password?token=...
    Emp->>UI: Opens /setup-password?token=...
    UI->>API: GET /api/auth/invitations/validate/:token
    API-->>UI: HTTP 200 { valid: true, email }
    Emp->>UI: Enters Password & Submits
    UI->>API: POST /api/auth/invitations/complete { token, password }
    API->>API: prisma.user.create(...) & prisma.employee.update(status: 'ACTIVE')
    API-->>UI: HTTP 200 { success: true }
    UI->>Emp: Redirects to /setup-agent download page
```

---

## 2. Desktop Agent Telemetry & Time Tracking Workflows

### 2.1 Desktop Agent Connection & Socket Authentication

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Desktop Agent (Electron)
    participant API as Express API
    participant Sock as Socket.IO Engine
    participant DB as MySQL Database

    Agent->>API: POST /api/agent/setup-verify { inviteToken, deviceId }
    API->>DB: prisma.invitationToken.findUnique(...)
    API-->>Agent: HTTP 200 { employeeId, organizationId, agentToken }
    Agent->>Agent: Saves server-config.json locally
    Agent->>Sock: socket.connect(VITE_API_URL, { auth: { token: base64(empId:devId) } })
    Sock->>Sock: Verifies base64 INSIGHTFUL signature
    Sock->>Sock: socket.join(`org_${orgId}`)
    Sock->>Sock: liveSessions.set(empId, { socketId, status: 'ONLINE' })
    Sock-->>Sock: io.to(`org_${orgId}`).emit('employee:status', { employeeId, status: 'ONLINE' })
```

---

### 2.2 Live Activity Ingestion & Smart Idle Detection

```mermaid
sequenceDiagram
    autonumber
    participant OS as Operating System (Windows API)
    participant Agent as Desktop Agent
    participant Sock as Socket.IO Server
    participant Rules as Productivity Rules Engine
    participant DB as MySQL Database

    loop Every 5-15 Seconds
        Agent->>OS: Runs get-active-window.ps1 & GetLastInputInfo()
        OS-->>Agent: { windowTitle, processName: "chrome.exe", idleSeconds: 12 }
        Agent->>Sock: socket.emit('employee:activity', { activeApp, activeWindow, idleTime, taskId })
        Sock->>Rules: resolveAppActivityForOrg(activeApp, organizationId)
        Rules-->>Sock: { productivity: 'PRODUCTIVE', category: 'Development' }
        Sock->>DB: prisma.activityLog.create(...) & upsertAppUsageLog(...)
        Sock-->>Sock: io.to(`org_${orgId}`).emit('activity:update', { employeeId, activeApp, productivity })
    end
```

- **Initiator:** Background thread of Electron Desktop Agent.
- **Frontend Action:** Dashboard listens to `activity:update` and ticks intraday bars live.
- **API / Socket Event:** `socket.emit('employee:activity', payload)`.
- **Backend Processing:** Checks idle thresholds (`>60s` transitions to `IDLE`, `>300s` transitions to `OFFLINE`). Categorizes productivity based on organizational rules.
- **Database Operations:** Inserts into `activity_logs` and increments seconds in `app_usage_logs`.
- **Subsequent Action:** Updates in-memory `liveSessions` map and emits `activity:update` to the organization room.

---

### 2.3 Screenshot Capture & Privacy Blurring

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Desktop Agent
    participant API as Express API (/api/agent/screenshot)
    participant Sharp as Sharp Image Processor
    participant Cloud as Cloudinary / Local Disk
    participant DB as MySQL Database
    participant Sock as Socket.IO Server

    Agent->>Agent: screenshot-desktop captures raw screen buffer
    Agent->>API: POST /api/agent/screenshot (Multipart FormData with image buffer)
    API->>DB: prisma.screenshotSetting.findUnique({ where: { organizationId } })
    alt globalBlur === true
        API->>Sharp: sharp(buffer).blur(15).jpeg({ quality: 60 })
        Sharp-->>API: Blurred JPEG buffer
    else globalBlur === false
        API->>Sharp: sharp(buffer).jpeg({ quality: 75 })
        Sharp-->>API: Standard JPEG buffer
    end
    API->>Cloud: Writes to /public/uploads/screenshots/ or Cloudinary
    Cloud-->>API: Returns storage URL
    API->>DB: prisma.screenshot.create({ data: { imageUrl, employeeId, organizationId } })
    API->>Sock: io.to(`org_${orgId}`).emit('screenshot:new', screenshotData)
    API-->>Agent: HTTP 201 { success: true, screenshotId }
```

---

## 3. Timesheet Approval Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Emp as Employee
    participant UI as Web Dashboard
    participant API as Express API (/api/timesheets)
    participant DB as MySQL Database
    actor Mgr as Manager

    Emp->>UI: Navigates to Weekly Timesheets & clicks "Submit Timesheet"
    UI->>API: POST /api/timesheets/submit { timesheetId or weekStartDate }
    API->>DB: prisma.timesheet.update(status: 'SUBMITTED', submittedAt: now())
    API->>DB: prisma.notification.create(type: 'TIMESHEET_SUBMITTED')
    API-->>UI: HTTP 200 { success: true }
    Mgr->>UI: Opens Manager Approvals Queue
    UI->>API: GET /api/timesheets/pending
    API-->>UI: List of pending timesheets with aggregated hours
    Mgr->>UI: Clicks "Approve"
    UI->>API: PUT /api/timesheets/:id/approve { comments }
    API->>DB: prisma.timesheet.update(status: 'APPROVED')
    API->>DB: prisma.timesheetApproval.create(...)
    API-->>UI: HTTP 200 { success: true, status: 'APPROVED' }
    UI->>Emp: Dispatches socket notification "Your timesheet has been approved"
```

---

## 4. Background Automated PDF Email Report Workflow

```mermaid
sequenceDiagram
    autonumber
    participant Cron as node-cron (0 8 * * *)
    participant Sched as ReportScheduler.js
    participant Service as reports.service.js
    participant Builder as pdfReportBuilder.js (PDFKit)
    participant DB as MySQL Database
    participant SMTP as Nodemailer SMTP

    Cron->>Sched: Triggers daily sweep at 08:00 AM
    Sched->>DB: prisma.emailReport.findMany({ where: { isActive: true } })
    DB-->>Sched: Active configurations (Daily / Weekly / Monthly)
    loop For each Report Configuration
        Sched->>Service: Aggregates hours, top apps, utilization % for period
        Service-->>Sched: Consolidated statistics JSON
        Sched->>Builder: generatePdfReport(stats, reportConfig)
        Builder-->>Sched: Binary PDF Document Buffer
        Sched->>SMTP: sendMail({ to: report.recipients, attachments: [report.pdf] })
        SMTP-->>Sched: SMTP Accepted 250 OK
        Sched->>DB: prisma.auditLog.create({ action: 'EMAIL_REPORT_SENT' })
    end
```

---

## 5. Security Alert & Violation Notification Flow

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Desktop Agent
    participant API as Express API
    participant Engine as Alert Engine (alerts.service.js)
    participant DB as MySQL Database
    participant Sock as Socket.IO Server
    participant AdminUI as Admin Dashboard

    Agent->>API: Posts activity with blacklisted process (e.g., "torrent.exe")
    API->>Engine: evaluateRules(activityData, organizationId)
    Engine->>DB: prisma.alertRule.findMany({ where: { organizationId, isActive: true } })
    DB-->>Engine: Rules matching type: 'UNPRODUCTIVE_APP'
    Engine->>DB: prisma.alertLog.create(...) & prisma.notification.create(...)
    Engine->>Sock: io.to(`org_${orgId}_managers`).emit('violation:new', alertPayload)
    Sock-->>AdminUI: Plays alert tone, displays toast, increments Bell badge
```
