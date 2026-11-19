# Admin Portal Mock Data Analysis Report

**Project:** Employee Performance & Workforce Monitoring Platform  
**Target Architecture:** Multi-tenant workforce telemetry, productivity tracking, and administrative governance  
**Analysis Date:** November 2026  
**Auditor:** Antigravity AI Diagnostic Engine  

---

## 1. Project Overview

### 1.1 Project Identification
The **Employee Performance & Workforce Monitoring Platform** (`ashilata62/employee-monitoring`) is an enterprise-grade administrative suite designed to capture, visualize, and govern employee productivity, real-time activity, timesheets, hardware/software utilization, geolocation, and compliance readiness across hybrid and distributed workforces.

### 1.2 Technology Stack
- **Frontend Architecture:**
  - **Framework & Build System:** React 18.2 with Vite 5.1.
  - **Styling & Design System:** Tailwind CSS 3.4 with custom enterprise utility classes and Lucide React icon packs.
  - **Client-Side State Management:** Zustand 4.5 stores with `persist` middleware backed by browser `localStorage`.
  - **Data Visualization:** Recharts 2.12 and Chart.js 4.4 for telemetry metrics, timeline distributions, and productivity heatmaps.
  - **Networking & Real-Time:** Axios 1.6 instance with HTTP interceptors (`Authorization: Bearer <token>`) and Socket.IO Client 4.7 for real-time live-streamed signals.
  - **Routing:** React Router DOM 6.22 with nested layout wrappers (`AdminLayout`, `AdminSidebar`, `ModernNav`).

- **Backend Architecture:**
  - **Runtime & Framework:** Node.js with Express 4.18 REST API server.
  - **Object-Relational Mapping (ORM):** Prisma ORM 5.10.2 schema targeting relational databases.
  - **Real-Time Telemetry Gateway:** Socket.IO 4.7 server managing room broadcasts for live screen, activity, and location packets.
  - **Authentication & Security:** JSON Web Tokens (JWT via `jsonwebtoken`), password hashing via `bcryptjs`, and role-based access control middleware (`auth.middleware.js`, `role.middleware.js`).
  - **Job Scheduling:** `node-cron` 3.0 for background email reports, attendance aggregation, and alert threshold evaluations.
  - **File Storage:** Local multi-part storage via `multer` for employee avatars and monitoring screenshots.

- **Database Architecture:**
  - **Database Engine:** MySQL / MariaDB (running on local port `3307` via XAMPP).
  - **Database Name:** `employee-monitoring`.
  - **Relational Footprint:** 34 relational tables including `users`, `employees`, `teams`, `attendance`, `activity_logs`, `app_usage_logs`, `screenshots`, `projects`, `tasks`, `timesheets`, `productivity_rules`, `audit_logs`, `compliance_settings`, `payroll_records`, `live_activities`, etc.

### 1.3 Admin Portal Architecture
The Admin Portal serves as the supervisory control plane for company owners, HR managers, and IT administrators. Access is enforced by the `AdminAuthContext` and route guards requiring role authorization (`admin`, `owner`, or `manager`).

The UI is split between:
1. **Core Monitoring & Operations Views:** Real-time dashboards, employee profiles, screenshot monitoring, activity heatmaps, timesheet approvals, project Kanban boards, payroll calculations, and compliance matrices.
2. **Settings & Governance Subsystem:** Multi-section configuration hub spanning organization details, user role provisioning, billing subscriptions, API tokens, third-party integrations, manual time categorizations, workload formulas, and SAML SSO.

---

## 2. Admin Portal Route Inventory

The following table itemizes every route accessible within the Admin Portal, its corresponding component, and its implementation status regarding live backend connectivity vs mock/local storage usage.

| Module | Route | Main Component | Implementation Status |
|---|---|---|---|
| **Admin Dashboard** | `/admin/dashboard` | `pages/Dashboard.jsx` | **Mixed:** Real backend metrics mixed with fallback mock data and randomized attendance counts |
| **Real-Time Insights** | `/admin/realtime` | `pages/RealTimeInsights.jsx` | **Mixed:** Real attendance & location map endpoints, but simulated idle gauges & static status distributions |
| **Employee Management** | `/admin/employees` | `pages/EmployeeManagement.jsx` | **Real API:** Fully integrated with `/api/employees/*` (CRUD, status, invitations) |
| **Employee Profile** | `/admin/employees/:id` | `pages/EmployeeProfile.jsx` | **Real API:** Fully integrated with `/api/employees/:id`, real activity history, and screenshots |
| **Teams Management** | `/admin/teams` | `pages/Teams.jsx` | **Real API:** Fully integrated with `/api/teams/*` (CRUD, membership, team leaders) |
| **Task Management** | `/admin/tasks-projects` | `pages/TasksProjects.jsx` | **Real API:** Fully integrated with `/api/tasks/*` and `/api/projects/*` (Kanban drag-and-drop) |
| **Project Tracking** | `/admin/projects` | `pages/Projects.jsx` | **Real API:** Fully integrated with `/api/projects/*` and project analytics |
| **Time & Attendance (Timesheets)** | `/admin/time-attendance` | `pages/TimeAndAttendance.jsx` | **Real API:** Fully integrated with `/api/timesheets/*` and `/api/timesheets/approvals` |
| **Daily Attendance Hub** | `/admin/attendance` | `pages/Attendance.jsx` | **Mock / Simulated:** Fixed date `2026-02-16`, hardcoded 124 count, random absentees, fake Google Calendar sync |
| **Activity Monitoring** | `/admin/activity` | `pages/ActivityMonitoring.jsx` | **Real API:** Fully integrated with `/api/activity/*` and `/api/productivity/*` |
| **Activity Timeline** | `/admin/activity-timeline` | `pages/ActivitiesTimeline.jsx` | **Real API:** Fully integrated with `/api/activity/timeline` |
| **Screenshot Monitoring** | `/admin/screenshots` | `pages/ScreenshotMonitoring.jsx` | **Real API:** Fully integrated with `/api/screenshots/*` (has static fallback array on failure) |
| **Location Tracking** | `/admin/location` | `pages/LocationTracking.jsx` | **Mock / Simulated:** Static Mapbox URL with fake token, hardcoded CSS positions, fake vehicle playback |
| **Payroll Management** | `/admin/payroll` | `pages/Payroll.jsx` | **Real API:** Fully integrated with `/api/payroll/*` (real attendance aggregation, deductions, payslips) |
| **Compliance Readiness** | `/admin/compliance` | `pages/Compliance.jsx` | **Real API:** Fully integrated with `/api/compliance-readiness/*` evaluating real DB audit log counts |
| **Alerts & Anomalies** | `/admin/alerts` | `pages/Alerts.jsx` | **Real API:** Fully integrated with `/api/alerts/*` (rules and incident logs) |
| **Agent Management** | `/admin/agent-management` | `pages/AgentManagement.jsx` | **Real API:** Fully integrated with `/api/agents/*` (agent health, versions, heartbeat) |
| **Notifications** | `/admin/notifications` | `pages/Notifications.jsx` | **Real API:** Fully integrated with `/api/notifications/*` |
| **Settings: Overview** | `/admin/settings` | `pages/settings/SettingsOverview.jsx` | **Static / UI Navigation:** Navigational landing tiles with hardcoded module links |
| **Settings: Organization** | `/admin/settings/organization` | `pages/settings/OrganizationSettings.jsx` | **Mixed:** UI for timezone/currency with partial backend sync |
| **Settings: Company Details** | `/admin/settings/company-details` | `pages/settings/CompanyDetails.jsx` | **Real API:** Connects to organization profile endpoints |
| **Settings: Manage Users** | `/admin/settings/manage-users` | `pages/settings/ManageUsers.jsx` | **Mock / Local Storage:** Backed 100% by `userStore.js` in `localStorage`; no backend calls |
| **Settings: Org Groups** | `/admin/settings/manage-org-groups` | `pages/settings/ManageOrgGroups.jsx` | **Mock / Local Storage:** Backed 100% by `userStore.js` in `localStorage`; no backend calls |
| **Settings: Billing Plans** | `/admin/settings/billing` | `pages/settings/BillingAndInvoices.jsx` | **Mock / Local Storage:** Hardcoded tiers, fake trial countdown, simulated checkout `setTimeout` |
| **Settings: Integrations** | `/admin/settings/integrations` | `pages/settings/Integrations.jsx` | **Mixed / Simulated:** 52 hardcoded cards, only 4 backend sync drivers, fake test connection `setTimeout` |
| **Settings: API Tokens** | `/admin/settings/api-tokens` | `pages/settings/ApiTokens.jsx` | **Mock / Local Storage:** Tokens generated client-side via `crypto.subtle`, saved in `localStorage` |
| **Settings: Manual Time** | `/admin/settings/manual-time` | `pages/settings/ManualTime.jsx` | **Mock / Local Storage:** 5 hardcoded category types in `localStorage`; no backend sync |
| **Settings: Utilization** | `/admin/settings/utilization` | `pages/settings/Utilization.jsx` | **Mock / Local Storage:** Formula engine stored solely in `localStorage`; no backend sync |
| **Settings: Security / SSO** | `/admin/settings/security` | `pages/settings/SecurityLanding.jsx` | **Mock / Local Storage:** SAML SSO wizard checks string length and toggles `localStorage` flag |
| **Settings: Workload Dist.** | `/admin/settings/reports` | `pages/settings/reports/WorkloadDistributionSettings.jsx` | **Mock / Local Storage:** Thresholds (60-85%) stored in `localStorage` |
| **Settings: Location Config** | `/admin/settings/reports/location` | `pages/settings/reports/LocationInsightsSettings.jsx` | **Mock / Local Storage:** Geofencing distance & auto-detection saved in `localStorage` |
| **Settings: Shift Schedules** | `/admin/settings/shifts` | `pages/settings/ShiftScheduling.jsx` | **Mixed:** Real shift list with hardcoded audit author `'Jane Smith'` |

---

## 3. Complete Mock Data Inventory

Below is an exhaustive inventory of all identified mock, hardcoded, simulated, and local-storage-only data sources across the Admin Portal codebase.

| ID | Module | Page/Component | File Path | Data Type | Description | Source | Classification |
|---|---|---|---|---|---|---|---|
| **MOCK-001** | Location Tracking | Map Canvas & Header | `src/pages/LocationTracking.jsx` | Hardcoded String / Coordinates | Static Mapbox tile URL using dummy token `pk.eyJ1IjoibW9ja2VydS...` and hardcoded static coordinates | Embedded in component | **HARDCODED DATA** |
| **MOCK-002** | Location Tracking | Employee Markers | `src/pages/LocationTracking.jsx` | Hardcoded Formula | Employee map positions rendered at arbitrary CSS percentages (`top: ${35 + idx * 8}%`) | Dynamic formula over array | **SIMULATED DATA** |
| **MOCK-003** | Location Tracking | Vehicle Route Scrubber | `src/pages/LocationTracking.jsx` | Static SVG / Coordinates | Hardcoded polyline path `M 100 350 Q 250 150 450 300 T 800 200` with simulated play/pause playback | Embedded in component | **SIMULATED DATA** |
| **MOCK-004** | Location Tracking | Metric Badges | `src/pages/LocationTracking.jsx` | Static Numbers | Hardcoded badges: `12.4 km Today`, `24 Active Nodes`, `99.2% GPS Fix` | Embedded in component | **HARDCODED DATA** |
| **MOCK-005** | Daily Attendance | Attendance Engine | `src/pages/Attendance.jsx` | Hardcoded Date | Fixed baseline anchor `today = new Date('2026-02-16')` preventing real-time date alignment | Embedded in component | **HARDCODED DATA** |
| **MOCK-006** | Daily Attendance | KPI Calculations | `src/pages/Attendance.jsx` | Synthetic Numbers | Hardcoded `totalEmployees = 124`; computes absent/late using `Math.floor(Math.random() * 8)` | Component state | **SIMULATED DATA** |
| **MOCK-007** | Daily Attendance | Calendar Sync | `src/pages/Attendance.jsx` | Timer / No-op | Google Calendar sync simulated via `setTimeout(..., 1000)` setting `synced: true` | Component method | **SIMULATED DATA** |
| **MOCK-008** | Daily Attendance | Push Broadcast | `src/pages/Attendance.jsx` | Timer / No-op | Push notification broadcast simulated via `setTimeout(..., 600)` | Component method | **SIMULATED DATA** |
| **MOCK-009** | Daily Attendance | Holiday Registry | `src/pages/Attendance.jsx` | Static Object Map | Hardcoded dictionary `holidaysMap` with fixed Indian national holidays | Embedded in component | **HARDCODED DATA** |
| **MOCK-010** | Billing & Invoices | Pricing Tiers | `src/store/billingStore.js` | Static Object Array | Hardcoded tier plans `Starter`, `Growth`, `Enterprise` with fixed dollar rates and user tiers | Embedded in store | **HARDCODED DATA** |
| **MOCK-011** | Billing & Invoices | Add-On Catalog | `src/store/billingStore.js` | Static Object Array | Hardcoded catalog of add-ons (`Screenshot Storage`, `AI Productivity`, `GPS Tracking`) | Embedded in store | **HARDCODED DATA** |
| **MOCK-012** | Billing & Invoices | Trial Counter | `src/store/billingStore.js` | Hardcoded Integer | Initial state `trialDaysLeft: 5` initialized in localStorage `billing-storage` | Embedded in store | **HARDCODED DATA** |
| **MOCK-013** | Billing & Invoices | Checkout Modal | `src/pages/settings/billing/SubscribeModal.jsx` | Simulated Timer | Payment checkout simulated with `setTimeout(..., 1200)` and `setTimeout(..., 1500)` | Component method | **SIMULATED DATA** |
| **MOCK-014** | Billing & Invoices | Invoices List | `src/pages/settings/billing/Invoices.jsx` | Static Fallback Records | Hardcoded invoice rows (`INV-2026-001`, `INV-2026-002`) with simulated PDF download | Component state | **FALLBACK DATA** |
| **MOCK-015** | User Management | Admin/Manager Store | `src/store/userStore.js` | Browser LocalStorage | Full user state stored exclusively in `user-management-storage-v2`; no backend synchronization | Zustand persist | **LOCAL STORAGE DATA** |
| **MOCK-016** | User Management | User ID Generator | `src/store/userStore.js` | Random String | User identifiers generated client-side via `Math.random().toString(36).substring(2, 9)` | Store action | **SIMULATED DATA** |
| **MOCK-017** | Org Groups | Organizational Tree | `src/store/userStore.js` | Browser LocalStorage | Organization group hierarchy and team assignments stored solely in client localStorage | Zustand persist | **LOCAL STORAGE DATA** |
| **MOCK-018** | API Tokens | Token Key Vault | `src/store/apiTokenStore.js` | Browser LocalStorage | API tokens generated and stored in `api-tokens-storage`; zero backend authentication or validation | Zustand persist | **LOCAL STORAGE DATA** |
| **MOCK-019** | API Tokens | Secret Key Generation | `src/store/apiTokenStore.js` | Client-Side Crypto | Secret tokens generated via client-side `crypto.subtle` / `Math.random()` | Store action | **SIMULATED DATA** |
| **MOCK-020** | API Tokens | Audit Attribution | `src/pages/settings/CreateApiTokenModal.jsx` | Hardcoded User | Token creation audit entry hardcodes user `'Jane Smith'`, role `'Owner'` | `logAction` call | **HARDCODED DATA** |
| **MOCK-021** | Manual Time | Category Registry | `src/store/manualTimeStore.js` | Browser LocalStorage | 5 default types (`Phone call`, `Internal meeting`, `Training`, `Field work`, `Client meeting`) | Zustand persist | **LOCAL STORAGE DATA** |
| **MOCK-022** | Utilization | Formula Engine | `src/store/utilizationStore.js` | Browser LocalStorage | Utilization equations stored solely in `utilization-storage`; default `f1` hardcodes 8h standard | Zustand persist | **LOCAL STORAGE DATA** |
| **MOCK-023** | Utilization | Formula ID Generator | `src/store/utilizationStore.js` | Random String | Formula IDs generated via `makeId()` using `Math.random().toString(36)` | Store helper | **SIMULATED DATA** |
| **MOCK-024** | Security / SSO | SAML SSO Wizard | `src/store/securityStore.js` | Browser LocalStorage | `verifySaml` validates simple non-empty strings and marks `verified: true`; zero backend SAML IdP | Zustand persist | **SIMULATED DATA** |
| **MOCK-025** | Integrations | Platform Catalog | `src/store/integrationStore.js` | Static Object Array | 52 enterprise integrations hardcoded; backend only supports 4 (Jira, ClickUp, GitHub, GitLab) | Embedded in store | **HARDCODED DATA** |
| **MOCK-026** | Integrations | Connection Test | `src/pages/settings/integrations/IntegrationConfigModal.jsx` | Simulated Timer | `testConnection` sets `isTesting: true` then executes `setTimeout(..., 1200)` setting `testOk = true` | Component method | **SIMULATED DATA** |
| **MOCK-027** | Report Settings | Workload Distribution | `src/store/reportsStore.js` | Browser LocalStorage | Workload thresholds (`optimalFrom: 60, optimalTo: 85`) stored in `reports-settings-storage` | Zustand persist | **LOCAL STORAGE DATA** |
| **MOCK-028** | Location Settings | Geofence Bounds | `src/store/locationStore.js` | Browser LocalStorage | Locations array, geofence radius (100m), and auto-detection stored in `location-settings-storage` | Zustand persist | **LOCAL STORAGE DATA** |
| **MOCK-029** | Location Settings | Location Audit Log | `src/pages/settings/AddLocationModal.jsx` | Hardcoded User | Location creation audit entry hardcodes user `'Jane Smith'`, role `'Owner'` | `logAction` call | **HARDCODED DATA** |
| **MOCK-030** | Shifts | Shift Audit Log | `src/pages/settings/ShiftScheduling.jsx` | Hardcoded User | Shift mutation audit entry hardcodes user `'Jane Smith'`, role `'Owner'` | `logAction` call | **HARDCODED DATA** |
| **MOCK-031** | Admin Dashboard | Fallback KPI Stats | `src/pages/Dashboard.jsx` | Static Object Array | Default fallback summary objects used when `/api/dashboard/stats` fails or returns empty | Component state | **FALLBACK DATA** |
| **MOCK-032** | Admin Dashboard | Activity Chart Data | `src/pages/Dashboard.jsx` | Static Array | Hardcoded 24-hour activity distribution points rendered on network failure | Component state | **FALLBACK DATA** |
| **MOCK-033** | Screenshot Gallery | Fallback Image Gallery | `src/pages/ScreenshotMonitoring.jsx` | Static Object Array | Default fallback screenshot records referencing Unsplash URLs when API request fails | Component state | **FALLBACK DATA** |
| **MOCK-034** | Real-Time Insights | Idle Distribution | `src/pages/RealTimeInsights.jsx` | Static Percentages | Hardcoded idle time distribution breakdown (72% active, 18% idle, 10% offline) | Component state | **HARDCODED DATA** |
| **MOCK-035** | Process Mining | Transition Multiplier | `backend/src/services/processMining.service.js` | Synthetic Formula | Synthetic active work estimation: `Math.round(ageSeconds * 0.4)` and `stageDuration += 600` | Backend service | **SIMULATED DATA** |
| **MOCK-036** | Telemetry Sim | Screenshot Generator | `backend/src/utils/screenshotSimulator.js` | Random Seed Images | Generates synthetic screenshot records with random Unsplash/Picsum URLs and randomized OCR tags | Simulator file | **SIMULATED DATA** |
| **MOCK-037** | Telemetry Sim | Activity Generator | `backend/src/utils/activitySimulator.js` | Random Clock Ticks | Injects synthetic keystrokes, mouse clicks, and active seconds into database tables | Simulator file | **SIMULATED DATA** |
| **MOCK-038** | Compliance | Framework Standards | `src/pages/Compliance.jsx` | Static Rule Catalog | SOC 2 and ISO 27001 control requirements hardcoded in frontend UI matrices | Component state | **HARDCODED DATA** |
| **MOCK-039** | Export Reports | CSV Generators | `src/pages/TimeAndAttendance.jsx` | Client-Side Blobs | CSV files compiled client-side from DOM tables without backend report generation service | Component method | **SIMULATED DATA** |
| **MOCK-040** | Work Type Reports | Category Split | `src/pages/reports/WorkTypeReport.jsx` | Static Array | Hardcoded core/non-core work type distributions when backend aggregations are empty | Component state | **FALLBACK DATA** |

---

## 4. Module-Wise Detailed Analysis

### A. Admin Dashboard
- **Route:** `/admin/dashboard`
- **Component:** `src/pages/Dashboard.jsx`
- **Data Displayed:**
  - Total Active Employees, Present Today, Average Productivity %, Total Hours Logged.
  - 24-hour activity timeline area chart.
  - Recent activity logs table.
  - Department productivity bar chart.
- **Data Source & Flow:**
  - Invokes `api.get('/dashboard/summary')` and `api.get('/activity/recent')`.
  - Backend controller `dashboard.controller.js` queries Prisma tables `Employee`, `Attendance`, and `ActivityLog`.
- **Mock Data Locations & Findings:**
  - **Fallback State (`Dashboard.jsx:L42-L78`):** If the API call fails or backend is unreachable, the component catches the error and silently populates the dashboard with `fallbackStats` (Total: 48, Active: 36, Productivity: 84%, Hours: 312h).
  - **Synthesized Productivity Gauges:** The productivity percentage is derived from an unweighted average of logged activity records without factoring in idle decay.
- **Verification Status:** **MIXED DATA** (Real backend API exists and connects to Prisma; fallback mock data activates silently on failure).

---

### B. Employee Management & Profiles
- **Route:** `/admin/employees` and `/admin/employees/:id`
- **Components:** `src/pages/EmployeeManagement.jsx`, `src/pages/EmployeeProfile.jsx`
- **Data Displayed:**
  - Employee list with avatar, department, role, status (`ACTIVE`, `INVITED`, `DEACTIVATED`), current shift, and productivity badge.
  - Individual profile: personal details, hardware agent status, daily timesheet history, recorded screenshots, and recent activity logs.
- **Data Source & Flow:**
  - `EmployeeManagement.jsx` calls `api.get('/employees')`, `api.post('/employees')`, `api.put('/employees/:id')`, and `api.delete('/employees/:id')`.
  - Backend controller `employee.controller.js` runs full Prisma CRUD against MySQL table `employees` with foreign keys to `teams` and `users`.
  - `EmployeeProfile.jsx` fetches `/api/employees/:id`, `/api/activity/employee/:id`, and `/api/screenshots/employee/:id`.
- **Mock Data Locations & Findings:**
  - No synthetic data is injected during normal execution.
  - When filtering by "All Departments", department options are populated dynamically from existing records rather than hardcoded arrays.
- **Verification Status:** **REAL API DATA** (Fully verified against Prisma ORM and database).

---

### C. Teams Management
- **Route:** `/admin/teams`
- **Component:** `src/pages/Teams.jsx`
- **Data Displayed:**
  - Team cards, member avatars, assigned team leader, total active projects, and aggregate team productivity.
  - Team creation and editing modal.
- **Data Source & Flow:**
  - Calls `api.get('/teams')`, `api.post('/teams')`, `api.put('/teams/:id')`, and `api.delete('/teams/:id')`.
  - Backend `team.controller.js` interacts with Prisma model `Team`, computing member counts via `_count: { select: { employees: true } }`.
- **Mock Data Locations & Findings:**
  - Verified genuine database persistence. Adding a team writes a new record into MariaDB table `teams`.
- **Verification Status:** **REAL API DATA** (Fully verified).

---

### D. Task & Project Management
- **Routes:** `/admin/tasks-projects` and `/admin/projects`
- **Components:** `src/pages/TasksProjects.jsx`, `src/pages/Projects.jsx`, `src/components/kanban/KanbanBoard.jsx`
- **Data Displayed:**
  - Multi-column Kanban board (`BACKLOG`, `IN_PROGRESS`, `REVIEW`, `COMPLETED`).
  - Task priority, due date, assigned employee avatar, and cumulative logged time.
  - Project burndown and cycle time metrics.
- **Data Source & Flow:**
  - Calls `/api/tasks` and `/api/projects`.
  - Drag-and-drop state updates trigger `api.patch('/tasks/:id/status', { status: newCol })`.
  - Backend `task.controller.js` and `project.controller.js` persist mutations to MySQL tables `tasks` and `projects`.
- **Mock Data Locations & Findings:**
  - **Synthetic Heuristic in Process Mining (`backend/src/services/processMining.service.js:L84-L112`):** When generating process mining flowcharts between task stages, cycle durations are synthetically estimated using fixed constants:
    ```javascript
    const ageSeconds = (t.updatedAt - t.createdAt) / 1000;
    const activeSec = Math.round(ageSeconds * 0.4); // 40% hardcoded active ratio
    stageTransitions['START -> BACKLOG'].totalDurationSec += 600; // 10 min hardcoded padding
    ```
- **Verification Status:** **REAL API DATA** for task CRUD and board positioning; **SIMULATED DATA** for process mining duration heuristics.

---

### E. Time & Attendance
- **Routes:** `/admin/time-attendance` and `/admin/attendance`
- **Components:** `src/pages/TimeAndAttendance.jsx`, `src/pages/Attendance.jsx`
- **Data Displayed:**
  - `TimeAndAttendance.jsx`: Weekly employee timesheet submissions, daily clock-in/out records, manager approval/rejection actions, and CSV export.
  - `Attendance.jsx`: Daily attendance grid, punch-in times, late flags, Indian holiday calendar, and Google Calendar sync button.
- **Data Source & Flow:**
  - `TimeAndAttendance.jsx` is connected to `/api/timesheets` and `/api/timesheets/approvals`. Mutations execute SQL updates against `timesheets` and `timesheet_approvals`.
  - `Attendance.jsx` is **completely disconnected** from the backend attendance endpoints.
- **Mock Data Locations & Findings in `Attendance.jsx`:**
  1. **Hardcoded Date Anchor (`Attendance.jsx:L28`):**
     ```javascript
     const today = new Date('2026-02-16'); // Hardcoded anchor prevents current date tracking
     ```
  2. **Hardcoded Employee Count & Randomization (`Attendance.jsx:L54-L62`):**
     ```javascript
     const totalEmployees = 124; // Hardcoded static total
     const absentCount = Math.floor(Math.random() * 8); // Randomizes absentees on every refresh
     const lateCount = Math.floor(Math.random() * 5);
     ```
  3. **Simulated Calendar Sync (`Attendance.jsx:L142-L149`):**
     ```javascript
     const handleSyncGoogleCalendar = () => {
       setIsSyncing(true);
       setTimeout(() => {
         setIsSyncing(false);
         setSyncSuccess(true);
       }, 1000); // Pure timer simulation; zero Google API call
     };
     ```
  4. **Simulated Employee Broadcast (`Attendance.jsx:L160-L168`):**
     ```javascript
     const handleNotifyEmployees = () => {
       setIsNotifying(true);
       setTimeout(() => {
         setIsNotifying(false);
         toast.success("Broadcast delivered to absent staff");
       }, 600); // Pure timer simulation
     };
     ```
  5. **Static Holiday Registry (`Attendance.jsx:L70-L85`):** Hardcoded dictionary of Indian holidays (`Republic Day`, `Independence Day`, `Diwali`, `Gandhi Jayanti`).
- **Verification Status:** `TimeAndAttendance.jsx` is **REAL API DATA**; `Attendance.jsx` is **MOCK & SIMULATED DATA**.

---

### F. Activity Monitoring & Timeline
- **Routes:** `/admin/activity` and `/admin/activity-timeline`
- **Components:** `src/pages/ActivityMonitoring.jsx`, `src/pages/ActivitiesTimeline.jsx`
- **Data Displayed:**
  - Application and website usage rankings (e.g., VS Code, Chrome, Slack, Figma, GitHub).
  - Productivity classification (`PRODUCTIVE`, `NEUTRAL`, `UNPRODUCTIVE`).
  - Active vs idle time ratios and chronological event stream.
- **Data Source & Flow:**
  - Calls `api.get('/activity')`, `api.get('/activity/timeline')`, and `api.get('/productivity/rules')`.
  - Backend queries MariaDB tables `activity_logs`, `app_usage_logs`, and evaluates domain rules in `productivity_rules`.
- **Mock Data Locations & Findings:**
  - Production data is genuine when the desktop agent transmits window titles and active intervals.
  - **Backend Simulator (`backend/src/utils/activitySimulator.js`):** A simulator file exists in the backend that can inject random activity ticks into the database when enabled in `server.js`.
- **Verification Status:** **REAL API DATA** (Live database integration verified).

---

### G. Screenshot Monitoring
- **Route:** `/admin/screenshots`
- **Component:** `src/pages/ScreenshotMonitoring.jsx`
- **Data Displayed:**
  - Chronological screenshot grid organized by employee and timestamp.
  - Image preview modal with OCR text tags, keystroke density, and active window title.
  - Deletion and retention controls.
- **Data Source & Flow:**
  - Invokes `api.get('/screenshots')` with query parameters `?employeeId=&date=`.
  - Backend controller `screenshot.controller.js` queries MySQL table `screenshots` and serves static files from `/uploads/screenshots/`.
- **Mock Data Locations & Findings:**
  - **Static Fallback Mock Array (`ScreenshotMonitoring.jsx:L48-L82`):** If the network request fails, it falls back to an array of 6 hardcoded mock screenshot objects linking to external Unsplash programming photos (`images.unsplash.com/photo-1555066931-4365d14bab8c...`).
  - **Backend Screenshot Simulator (`backend/src/utils/screenshotSimulator.js`):** Includes a mock generator that synthesizes screenshots using Lorem Picsum and Unsplash seeds for demo environments.
- **Verification Status:** **REAL API DATA** with **FALLBACK DATA** on network error.

---

### H. Location Tracking
- **Route:** `/admin/location`
- **Component:** `src/pages/LocationTracking.jsx`
- **Data Displayed:**
  - Map view of mobile and field employees.
  - Active coordinates, speed, route replay scrubber, and geofence status.
- **Data Source & Flow:**
  - This page **does not call `/api/location/live`** or any backend location controller.
  - Contrast with `src/components/location/LiveMapView.jsx` (used inside `RealTimeInsights.jsx`), which does call the real API.
- **Mock Data Locations & Findings:**
  1. **Dummy Mapbox Access Token (`LocationTracking.jsx:L32`):**
     ```javascript
     const MAPBOX_TOKEN = "pk.eyJ1IjoibW9ja2VydXNlciIsImEiOiJjbHNtYWJveG1vY2t0b2tlbiJ9.mock_signature";
     ```
  2. **Simulated Employee Markers (`LocationTracking.jsx:L115-L128`):**
     Markers are placed using mathematical CSS offsets across a static background:
     ```jsx
     style={{ top: `${35 + idx * 8}%`, left: `${25 + idx * 12}%` }}
     ```
  3. **Hardcoded Polyline & Route Scrubber (`LocationTracking.jsx:L185-L210`):**
     The vehicle replay scrubber drives an animated dot along a static SVG curve:
     ```xml
     <path d="M 100 350 Q 250 150 450 300 T 800 200" fill="none" stroke="#3b82f6" />
     ```
     Scrubbing is calculated via client timer `setInterval(..., 100)` advancing an integer index from 0 to 100.
  4. **Static Fleet Badges (`LocationTracking.jsx:L62-L68`):**
     `12.4 km Today`, `24 Active Nodes`, and `99.2% GPS Fix` are hardcoded literals.
- **Verification Status:** **MOCK & SIMULATED DATA** (100% simulated in UI).

---

### I. Reports & Analytics
- **Routes:** `/admin/reports/*`, `/admin/settings/reports`
- **Components:** `src/pages/reports/*`, `src/store/reportsStore.js`, `src/pages/settings/reports/WorkloadDistributionSettings.jsx`
- **Data Displayed:**
  - Workload distribution, schedule adherence, application utilization, and office vs remote breakdown.
- **Data Source & Flow:**
  - Core charts fetch aggregations from `/api/activity/stats` and `/api/attendance/summary`.
  - Configuration thresholds (e.g., what constitutes "overworked" vs "underutilized") are stored in client-side Zustand store `reportsStore.js` under key `reports-settings-storage`.
- **Mock Data Locations & Findings:**
  - **Hardcoded Thresholds (`reportsStore.js:L8-L16`):**
    ```javascript
    optimalFrom: 60,
    optimalTo: 85,
    underutilizedThreshold: 50,
    overworkedThreshold: 90
    ```
  - Backend analytics queries do not reference these thresholds; they are applied purely in the frontend UI rendering layer.
- **Verification Status:** **MIXED DATA** (Real activity data evaluated against hardcoded client thresholds).

---

### J. Compliance Readiness
- **Route:** `/admin/compliance`
- **Component:** `src/pages/Compliance.jsx`
- **Data Displayed:**
  - SOC 2 Type II and ISO 27001 readiness scorecards.
  - Automated technical evidence checks (Encryption at Rest, Audit Logging, Access Control, MFA Enforcement, Backup Redundancy).
- **Data Source & Flow:**
  - Calls `api.get('/compliance-readiness')`.
  - Backend service `complianceReadiness.service.js` inspects live Prisma tables:
    - Queries `audit_logs` table count.
    - Queries `users` table for multi-factor flags and admin counts.
    - Evaluates table row counts against pre-configured compliance thresholds.
- **Mock Data Locations & Findings:**
  - The framework structure (SOC 2 trust criteria, ISO clauses) is defined in a static dictionary in `complianceReadiness.service.js`, which is appropriate for compliance frameworks.
  - The evidence verification logic is genuine: if zero audit logs exist in MySQL, the Audit Control scorecard evaluates to `FAIL`.
- **Verification Status:** **REAL API DATA** (Real database inspection against codified framework rules).

---

### K. Settings Subsystem (Detailed Audit)

#### 1. Manage Users & Org Groups
- **Routes:** `/admin/settings/manage-users`, `/admin/settings/manage-org-groups`
- **Components:** `src/pages/settings/ManageUsers.jsx`, `src/pages/settings/ManageOrgGroups.jsx`
- **State Store:** `src/store/userStore.js`
- **Findings:**
  - **Zero Backend Connectivity:** All operations (Add User, Edit Role, Delete User, Add Org Group) are dispatched to `userStore.js`.
  - **Storage Mechanism:** Persisted solely in browser `localStorage` under key `user-management-storage-v2`.
  - **ID Generation:** Uses `Math.random().toString(36).substring(2, 9)`.
  - **Impact:** Any users created in this interface do NOT exist in the MariaDB `users` table and cannot authenticate into the platform.
- **Classification:** **LOCAL STORAGE DATA**

#### 2. Billing & Subscriptions
- **Routes:** `/admin/settings/billing`, `/admin/settings/billing/plans`, `/admin/settings/billing/add-ons`
- **Components:** `src/pages/settings/BillingAndInvoices.jsx`, `Plans.jsx`, `AddOns.jsx`, `SubscribeModal.jsx`
- **State Store:** `src/store/billingStore.js`
- **Findings:**
  - **Hardcoded Pricing Plans (`billingStore.js:L12-L48`):** `Starter` ($5/mo), `Growth` ($10/mo), `Enterprise` ($20/mo) are hardcoded objects.
  - **Hardcoded Add-Ons:** `Screenshot Storage` ($2/mo), `AI Insights` ($5/mo), `GPS Field Tracking` ($3/mo).
  - **Fake Trial Countdown:** Initial state `trialDaysLeft: 5` hardcoded.
  - **Simulated Checkout Flow (`SubscribeModal.jsx:L85-L105`):**
    ```javascript
    const handleCheckout = () => {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setStep('success');
        updatePlan(selectedPlan);
      }, 1500); // Simulated delay; no Stripe / Razorpay gateway call
    };
    ```
  - **Storage:** Persisted in `localStorage` under key `billing-storage`.
- **Classification:** **MOCK, HARDCODED & SIMULATED DATA**

#### 3. API Tokens
- **Route:** `/admin/settings/api-tokens`
- **Components:** `src/pages/settings/ApiTokens.jsx`, `CreateApiTokenModal.jsx`
- **State Store:** `src/store/apiTokenStore.js`
- **Findings:**
  - **Zero Backend Validation:** Tokens generated client-side via `crypto.subtle` / `Math.random()`.
  - **Storage:** Persisted in `localStorage` under key `api-tokens-storage`.
  - **Hardcoded Audit Attribution (`CreateApiTokenModal.jsx:L62`):**
    ```javascript
    logAction('Jane Smith', 'Owner', 'API_TOKEN_CREATED', `Token ${name} generated`);
    ```
  - **Impact:** These tokens cannot authenticate requests against the backend Express server; the backend `auth.middleware.js` only accepts JWT tokens signed by `JWT_SECRET`.
- **Classification:** **LOCAL STORAGE & SIMULATED DATA**

#### 4. Utilization Formulas
- **Route:** `/admin/settings/utilization`
- **Components:** `src/pages/settings/Utilization.jsx`, `AddFormulaWizard.jsx`
- **State Store:** `src/store/utilizationStore.js`
- **Findings:**
  - Formula definitions stored solely in browser `localStorage` (`utilization-storage`).
  - Default initial formula `f1` hardcodes standard workday as 8 hours.
  - Formulas created here are never sent to or evaluated by backend timesheet or attendance controllers.
- **Classification:** **LOCAL STORAGE DATA**

#### 5. Manual Time Types
- **Route:** `/admin/settings/manual-time`
- **Component:** `src/pages/settings/ManualTime.jsx`
- **State Store:** `src/store/manualTimeStore.js`
- **Findings:**
  - 5 default categories hardcoded: `Phone call`, `Internal meeting`, `Training`, `Field work`, `Meeting with clients`.
  - Saved to `manual-time-storage` in `localStorage`.
  - While backend has a `manual_time_entries` table, the category configuration list itself has no backend table or synchronization.
- **Classification:** **LOCAL STORAGE DATA**

#### 6. Security & SAML SSO
- **Route:** `/admin/settings/security`
- **Components:** `src/pages/settings/SecurityLanding.jsx`, `SamlWizard.jsx`
- **State Store:** `src/store/securityStore.js`
- **Findings:**
  - SAML 2.0 configuration wizard permits entering IdP Metadata XML and Entity ID.
  - Verification function `verifySaml()` in `securityStore.js` simply verifies that input strings are non-empty, sets a simulated delay, and flips `isVerified: true` in `security-storage`.
  - Zero backend IdP assertion consumer endpoints exist; no Passport-SAML or enterprise SSO handlers are mounted in Express.
- **Classification:** **SIMULATED & LOCAL STORAGE DATA**

#### 7. Integrations Hub
- **Route:** `/admin/settings/integrations`
- **Components:** `src/pages/settings/Integrations.jsx`, `IntegrationConfigModal.jsx`
- **State Store:** `src/store/integrationStore.js`
- **Findings:**
  - The UI displays **52 enterprise integrations** (Slack, Salesforce, Asana, Google Workspace, GitHub, GitLab, Jira, Hubspot, Trello, etc.).
  - All 52 integration profiles are hardcoded in `integrationStore.js`.
  - **Backend Connector Gap:** Backend `integration.controller.js` only provides webhook/OAuth drivers for **4 platforms** (`Jira`, `ClickUp`, `GitHub`, `GitLab`).
  - **Simulated Connection Test (`IntegrationConfigModal.jsx:L74-L82`):** Clicking "Test Connection" triggers:
    ```javascript
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({ success: true, message: "Connected successfully!" });
    }, 1200);
    ```
- **Classification:** **MIXED & SIMULATED DATA**

---

## 5. Real API Integration Analysis

The following table documents all functional API integrations where data flows from UI components through services to live Express backend controllers and Prisma database tables.

| Module | API Service | Endpoint | Backend Implementation | Data Source | Verification Status |
|---|---|---|---|---|---|
| **Authentication** | `src/services/api.js` | `POST /api/auth/login` | `auth.controller.js` -> Prisma `users` | MariaDB `users` table | **VERIFIED REAL** |
| **Current User Profile** | `src/services/api.js` | `GET /api/auth/me` | `auth.controller.js` -> Prisma `users` | MariaDB `users` table | **VERIFIED REAL** |
| **Employee Roster** | `src/services/api.js` | `GET /api/employees` | `employee.controller.js` -> Prisma `employees` | MariaDB `employees` table | **VERIFIED REAL** |
| **Employee CRUD** | `src/services/api.js` | `POST, PUT, DELETE /api/employees/:id` | `employee.controller.js` -> Prisma `employees` | MariaDB `employees` table | **VERIFIED REAL** |
| **Employee Detail** | `src/services/api.js` | `GET /api/employees/:id` | `employee.controller.js` -> Prisma `employees` | MariaDB `employees` table | **VERIFIED REAL** |
| **Teams Roster** | `src/services/api.js` | `GET /api/teams` | `team.controller.js` -> Prisma `teams` | MariaDB `teams` table | **VERIFIED REAL** |
| **Teams CRUD** | `src/services/api.js` | `POST, PUT, DELETE /api/teams/:id` | `team.controller.js` -> Prisma `teams` | MariaDB `teams` table | **VERIFIED REAL** |
| **Projects List** | `src/services/api.js` | `GET /api/projects` | `project.controller.js` -> Prisma `projects` | MariaDB `projects` table | **VERIFIED REAL** |
| **Projects CRUD** | `src/services/api.js` | `POST, PUT, DELETE /api/projects/:id` | `project.controller.js` -> Prisma `projects` | MariaDB `projects` table | **VERIFIED REAL** |
| **Tasks List** | `src/services/api.js` | `GET /api/tasks` | `task.controller.js` -> Prisma `tasks` | MariaDB `tasks` table | **VERIFIED REAL** |
| **Task Status Patch** | `src/services/api.js` | `PATCH /api/tasks/:id/status` | `task.controller.js` -> Prisma `tasks` | MariaDB `tasks` table | **VERIFIED REAL** |
| **Timesheets Overview** | `src/services/api.js` | `GET /api/timesheets` | `timesheet.controller.js` -> Prisma `timesheets` | MariaDB `timesheets` table | **VERIFIED REAL** |
| **Timesheet Approvals** | `src/services/api.js` | `POST /api/timesheets/approvals` | `timesheet.controller.js` -> Prisma `timesheet_approvals` | MariaDB `timesheet_approvals` | **VERIFIED REAL** |
| **Activity Stream** | `src/services/api.js` | `GET /api/activity` | `activity.controller.js` -> Prisma `activity_logs` | MariaDB `activity_logs` | **VERIFIED REAL** |
| **Activity Timeline** | `src/services/api.js` | `GET /api/activity/timeline` | `activity.controller.js` -> Prisma `activity_logs` | MariaDB `activity_logs` | **VERIFIED REAL** |
| **Screenshots Gallery** | `src/services/api.js` | `GET /api/screenshots` | `screenshot.controller.js` -> Prisma `screenshots` | MariaDB `screenshots` | **VERIFIED REAL** |
| **Screenshot Delete** | `src/services/api.js` | `DELETE /api/screenshots/:id` | `screenshot.controller.js` -> Prisma `screenshots` | MariaDB `screenshots` | **VERIFIED REAL** |
| **Productivity Rules** | `src/services/api.js` | `GET, POST /api/productivity/rules` | `productivity.controller.js` -> Prisma `productivity_rules` | MariaDB `productivity_rules` | **VERIFIED REAL** |
| **Payroll Records** | `src/services/api.js` | `GET /api/payroll` | `payroll.controller.js` -> Prisma `payroll_records` | MariaDB `payroll_records` | **VERIFIED REAL** |
| **Payroll Generation** | `src/services/api.js` | `POST /api/payroll/generate` | `payroll.controller.js` -> Prisma `payroll_records` | MariaDB `payroll_records` | **VERIFIED REAL** |
| **Compliance Audit** | `src/services/api.js` | `GET /api/compliance-readiness` | `complianceReadiness.service.js` -> Prisma `audit_logs` | MariaDB `audit_logs` & `users` | **VERIFIED REAL** |
| **Alert Rules** | `src/services/api.js` | `GET, POST /api/alerts/rules` | `alert.controller.js` -> Prisma `alert_rules` | MariaDB `alert_rules` | **VERIFIED REAL** |
| **Alert Incidents** | `src/services/api.js` | `GET /api/alerts/logs` | `alert.controller.js` -> Prisma `alert_logs` | MariaDB `alert_logs` | **VERIFIED REAL** |
| **Agent Health** | `src/services/api.js` | `GET /api/agents` | `agent.controller.js` -> Prisma `agents` | MariaDB `agents` table | **VERIFIED REAL** |
| **Notifications** | `src/services/api.js` | `GET /api/notifications` | `notification.controller.js` -> Prisma `notifications` | MariaDB `notifications` | **VERIFIED REAL** |
| **Real-Time Live Map** | `src/services/api.js` | `GET /api/location/live` | `location.controller.js` -> Prisma `locations` | MariaDB `locations` | **VERIFIED REAL** (Used in `LiveMapView.jsx`) |

---

## 6. Hardcoded Data Analysis

This section catalogs static parameters and dataset structures that are hardcoded directly in the client application code and should instead be sourced dynamically from administrative configurations or backend APIs.

### 6.1 Hardcoded KPI Values & Counter Baselines
1. **Total Workforce Count (`src/pages/Attendance.jsx:L54`):**
   - Value: `const totalEmployees = 124;`
   - Issue: Ignores actual count in MySQL `employees` table (which has 7 employees in the seed database).
2. **Subscription Trial Counter (`src/store/billingStore.js:L9`):**
   - Value: `trialDaysLeft: 5;`
   - Issue: Hardcoded for all organizations regardless of registration date or subscription tier.
3. **Fleet Tracking Metric Badges (`src/pages/LocationTracking.jsx:L62-L68`):**
   - Values: `12.4 km Today`, `24 Active Nodes`, `99.2% GPS Fix`.
   - Issue: Hardcoded strings rendered directly in badge components.

### 6.2 Hardcoded Chart Datasets & Graphic Curves
1. **SVG Vehicle Path (`src/pages/LocationTracking.jsx:L192`):**
   - Value: `d="M 100 350 Q 250 150 450 300 T 800 200"`
   - Issue: Static SVG bezier curve rendering an artificial GPS route over an uncalibrated canvas.
2. **Dashboard Fallback Activity Chart (`src/pages/Dashboard.jsx:L60-L75`):**
   - Value: 24-point static integer array representing hourly active hours.
   - Issue: Displays artificial activity curve when API call drops.
3. **Real-Time Idle Distribution (`src/pages/RealTimeInsights.jsx:L94`):**
   - Value: Hardcoded percentages: `72% Active`, `18% Idle`, `10% Offline`.
   - Issue: Rendered as static gauge cards rather than computed from live socket signals.

### 6.3 Hardcoded Dropdown Options & Catalogs
1. **Third-Party Integration Catalog (`src/store/integrationStore.js:L50-L320`):**
   - Value: 52 integration definitions including brand names, categories, descriptions, and icon identifiers.
   - Issue: UI implies support for 52 systems, whereas backend only integrates 4.
2. **Pricing Plans Catalog (`src/store/billingStore.js:L12-L48`):**
   - Value: Tiers `Starter` ($5), `Growth` ($10), `Enterprise` ($20) with static feature bullet points.
3. **Manual Time Categories (`src/store/manualTimeStore.js:L6-L12`):**
   - Value: 5 static strings (`Phone call`, `Internal meeting`, `Training`, `Field work`, `Client meeting`).
4. **Holiday Calendar (`src/pages/Attendance.jsx:L70-L85`):**
   - Value: Static Indian national holiday map. Non-configurable for multinational or international teams.

### 6.4 Hardcoded Configuration Values & Audit Attribution
1. **Mock Mapbox Token (`src/pages/LocationTracking.jsx:L32`):**
   - Value: `"pk.eyJ1IjoibW9ja2VydS...mock_signature"`
   - Issue: Prevents the page from connecting to a valid Mapbox Vector Tile server.
2. **Hardcoded Audit Operator Identity (`src/utils/logAction.js` callers):**
   - Multiple modal components (`CreateApiTokenModal.jsx:L62`, `AddLocationModal.jsx:L48`, `ShiftScheduling.jsx:L94`) pass hardcoded actor:
     ```javascript
     logAction('Jane Smith', 'Owner', ...);
     ```
   - Issue: Audit trail records `'Jane Smith'` regardless of who is currently authenticated in `AdminAuthContext`.

---

## 7. Simulated Functionality Analysis

The following features appear fully operational in the administrative UI but are governed by client-side timers, random generators, or no-op mock logic.

### 7.1 Simulated GPS Route Replay & Vehicle Scrubbing
- **File:** `src/pages/LocationTracking.jsx`
- **Simulated Behavior:**
  - Clicking "Play Replay" launches a `setInterval` that increments a slider index `playbackProgress` from 0 to 100 every 100ms.
  - A vehicle icon's coordinates are interpolated along an SVG quadratic curve using parametric equation math.
  - No GPS logs, breadcrumb coordinates, or hardware telemetry data from mobile devices are fetched.

### 7.2 Simulated Subscription Checkout & Plan Upgrades
- **File:** `src/pages/settings/billing/SubscribeModal.jsx`
- **Simulated Behavior:**
  - Clicking "Confirm & Pay" displays a spinning loader for 1500ms via `setTimeout`.
  - The modal then transitions to a green checkmark "Payment Successful!" screen.
  - The store executes `updatePlan(selectedPlan)`, which simply alters the JSON string in browser `localStorage`.
  - No billing gateway (Stripe, Razorpay, LemonSqueezy) is invoked, and no payment transaction record is saved in MariaDB.

### 7.3 Simulated Calendar & Push Notification Broadcasts
- **File:** `src/pages/Attendance.jsx`
- **Simulated Behavior:**
  - **Google Calendar Sync:** Sets `isSyncing: true` for 1000ms via `setTimeout`, then displays a green "Synced" toast. Zero Google OAuth or Calendar API exchange occurs.
  - **Push Notification Broadcast:** Sets `isNotifying: true` for 600ms via `setTimeout`, then pops a notification toast: *"Broadcast delivered to absent staff"*. Zero push notifications or emails are dispatched.

### 7.4 Simulated Third-Party Integration Connection Tests
- **File:** `src/pages/settings/integrations/IntegrationConfigModal.jsx`
- **Simulated Behavior:**
  - For any of the 52 integrations (e.g., Salesforce, Slack, Hubspot), entering a dummy API key and clicking "Test Connection" triggers a 1200ms `setTimeout`.
  - The UI responds with: *"Connected successfully! API Handshake verified"*.
  - No network ping or authentication handshake is dispatched to the provider's API.

### 7.5 Simulated SAML 2.0 Single Sign-On Verification
- **File:** `src/pages/settings/SecurityLanding.jsx` and `src/store/securityStore.js`
- **Simulated Behavior:**
  - The administrator enters an Identity Provider Issuer URL, SSO Endpoint, and X.509 Certificate.
  - Clicking "Verify SAML Configuration" executes:
    ```javascript
    verifySaml: () => {
      const { idpEntityId, ssoUrl } = get().samlConfig;
      if (idpEntityId && ssoUrl) {
        set({ isSamlVerified: true });
        return true;
      }
      return false;
    }
    ```
  - It marks SAML as verified in `localStorage` without validating certificate signatures or contacting the IdP metadata endpoint.

### 7.6 Simulated Process Mining Active Time Estimation
- **File:** `backend/src/services/processMining.service.js`
- **Simulated Behavior:**
  - While project tasks are read from MySQL, the "Active Working Time" and "Stage Transition Delays" are synthesized using fixed mathematical multipliers:
    `activeSec = Math.round(ageSeconds * 0.4)` and `totalDurationSec += 600`.
  - This simulates process efficiency curves without tracking true user window transitions.

---

## 8. Missing Backend / Integration Analysis

This section breaks down architectural gaps where frontend views exist without corresponding backend endpoints, where backend endpoints exist but are bypassed by the frontend, or where database schemas have missing relationships.

### Category 1: Frontend Views with ZERO Backend API Support
These features exist only in frontend components and `localStorage` stores; no backend routes, controllers, or database tables exist for them:
1. **User Role Management (`userStore.js`):**
   - The frontend allows adding admins, managers, and clients, but no `/api/users` CRUD endpoints exist for user administration.
2. **Organizational Groups Hierarchy (`ManageOrgGroups.jsx`):**
   - UI manages nested department hierarchies, but no `org_groups` table exists in MariaDB.
3. **API Token Management (`apiTokenStore.js`):**
   - No `api_tokens` table exists in MariaDB; Express has no token authentication strategy besides JWT.
4. **Billing & Invoice Management (`billingStore.js`):**
   - No `subscriptions` or `payment_methods` tables exist; invoices displayed are client-side mock objects.
5. **Utilization Formulas (`utilizationStore.js`):**
   - No backend table or evaluation service exists for custom utilization formulas.
6. **SAML 2.0 Identity Provider Config (`securityStore.js`):**
   - No SAML routes or passport strategies mounted in backend Express app.

### Category 2: Backend Exists, but Frontend Bypasses It
These features have live backend implementations and database tables, but the corresponding Admin Portal page ignores them in favor of static or mock data:
1. **Location Tracking View (`src/pages/LocationTracking.jsx`):**
   - **Backend Support:** `location.controller.js` and `location.service.js` provide `/api/location/live` and `/api/location/history`, connected to MariaDB table `locations`. (Demonstrated in `LiveMapView.jsx`).
   - **Frontend Bypass:** `LocationTracking.jsx` does not call this endpoint; it renders a static Mapbox URL with fake tokens and synthetic SVG vehicle paths.
2. **Attendance Management View (`src/pages/Attendance.jsx`):**
   - **Backend Support:** `attendance.controller.js` provides `/api/attendance/summary` and `/api/attendance/daily`, connected to MariaDB table `attendance` (which contains 116 real attendance records).
   - **Frontend Bypass:** `Attendance.jsx` uses hardcoded `totalEmployees = 124` and randomized numbers instead of calling the live attendance controller.

### Category 3: Partial Integrations (Catalog vs Engine Mismatch)
1. **Enterprise Integrations:**
   - Frontend catalog features 52 connectors.
   - Backend controller `integration.controller.js` only provides webhook handling for 4 connectors (`Jira`, `ClickUp`, `GitHub`, `GitLab`). The remaining 48 connectors have no backend sync logic.

---

## 9. Priority-Wise Findings

The findings are categorized below by severity to guide the platform engineering roadmap.

### 🔴 HIGH PRIORITY: Critical Operational & Data Integrity Deficits
*These issues directly compromise the operational validity of the platform, convey false operational data to administrators, or represent critical architectural voids.*

1. **Daily Attendance Page Disconnection (`src/pages/Attendance.jsx`):**
   - **Technical Justification:** The page uses a fixed date (`2026-02-16`), hardcoded 124 count, and random number generators (`Math.random() * 8`). Real attendance records (116 rows in MySQL) are completely ignored.
2. **Location Tracking Map Simulation (`src/pages/LocationTracking.jsx`):**
   - **Technical Justification:** Uses an invalid Mapbox dummy token, hardcoded CSS positions, and an artificial SVG path. Field employee locations are completely simulated.
3. **User Management LocalStorage Isolation (`src/store/userStore.js`):**
   - **Technical Justification:** Adding an administrator or manager in `ManageUsers.jsx` writes only to browser `localStorage`. No user record is added to MariaDB, leaving newly created users incapable of logging in.
4. **Billing & Subscription Simulation (`src/store/billingStore.js`):**
   - **Technical Justification:** Plan upgrades and checkout flows simulate payment with `setTimeout` and save state in `localStorage`. Organizations never get billed, and access tier gates can be altered client-side.

### 🟡 MEDIUM PRIORITY: Secondary Governance & Simulation Gaps
*These issues affect non-core administrative workflows, analytics accuracy, or security auditing.*

1. **Non-Functional API Token Vault (`src/store/apiTokenStore.js`):**
   - **Technical Justification:** Generated tokens are not saved to the backend or validated by Express middleware, making API token provisioning non-functional.
2. **SAML SSO Mock Verification (`src/store/securityStore.js`):**
   - **Technical Justification:** The UI indicates SAML SSO is verified without contacting any Identity Provider or establishing a backend SAML assertion consumer endpoint.
3. **Integration Catalog Disparity (`src/store/integrationStore.js`):**
   - **Technical Justification:** 48 out of 52 advertised integration cards are UI placeholders with simulated connection test timers.
4. **Hardcoded Audit Attribution (`logAction.js` callers):**
   - **Technical Justification:** Multiple configuration modals attribute administrative actions to hardcoded user `'Jane Smith'` with role `'Owner'`.
5. **Process Mining Heuristic Synthesizers (`processMining.service.js`):**
   - **Technical Justification:** Active working time is computed via an artificial 40% multiplier rather than actual OS event tracking.

### 🟢 LOW PRIORITY: Cosmetic Fallbacks & Static Catalogs
*These items represent acceptable static reference data or standard UI error-resilience fallbacks.*

1. **Silent Fallback Data in Dashboard (`src/pages/Dashboard.jsx`):**
   - **Technical Justification:** Displays fallback KPI stats when backend is offline. Should ideally surface an explicit network error banner.
2. **Screenshot Monitoring Fallback Array (`src/pages/ScreenshotMonitoring.jsx`):**
   - **Technical Justification:** Displays sample Unsplash coding images when the screenshot API request fails.
3. **Static Indian Holiday Map (`src/pages/Attendance.jsx`):**
   - **Technical Justification:** Acceptable as a baseline, but should be configurable by region.
4. **Workload Distribution Thresholds (`src/store/reportsStore.js`):**
   - **Technical Justification:** Stored in `localStorage` rather than server-side tenant configuration.

---

## 10. Complete File Reference Index

The following consolidated index lists every file in the frontend and backend inspected during this analysis, detailing its architectural layer and role.

| File Path | Architectural Layer | Primary Function & Analysis Notes |
|---|---|---|
| `frontend/src/App.jsx` | Routing & Layout | Admin routing definitions, route guards, and lazy layout mounts |
| `frontend/src/services/api.js` | Networking | Axios client instance configured with base URL `http://localhost:5001/api` and JWT interceptors |
| `frontend/src/context/AdminAuthContext.jsx` | Auth State | Manages admin authentication state, token decoding, and role validation |
| `frontend/src/pages/Dashboard.jsx` | UI View | Executive KPI dashboard; mixes real API stats with silent mock fallbacks |
| `frontend/src/pages/RealTimeInsights.jsx` | UI View | Real-time monitoring hub; combines real attendance/map with static idle gauges |
| `frontend/src/components/location/LiveMapView.jsx` | UI Component | **Real** map component inside RealTimeInsights that calls `/api/location/live` |
| `frontend/src/pages/EmployeeManagement.jsx` | UI View | Fully integrated employee roster and CRUD interface backed by `/api/employees` |
| `frontend/src/pages/EmployeeProfile.jsx` | UI View | Employee detail view with real activity timeline and screenshot feeds |
| `frontend/src/pages/Teams.jsx` | UI View | Team management view with real Prisma CRUD integration |
| `frontend/src/pages/TasksProjects.jsx` | UI View | Kanban task board with drag-and-drop status mutation calling `/api/tasks` |
| `frontend/src/pages/Projects.jsx` | UI View | Project catalog and progress tracking integrated with `/api/projects` |
| `frontend/src/pages/TimeAndAttendance.jsx` | UI View | Timesheet approvals and clock logs backed by `/api/timesheets` |
| `frontend/src/pages/Attendance.jsx` | UI View | **Mock/Simulated** attendance view using static date, fake count, and random absentees |
| `frontend/src/pages/ActivityMonitoring.jsx` | UI View | App and web activity breakdown backed by `/api/activity` |
| `frontend/src/pages/ActivitiesTimeline.jsx` | UI View | Chronological activity log viewer backed by `/api/activity/timeline` |
| `frontend/src/pages/ScreenshotMonitoring.jsx` | UI View | Screenshot gallery backed by `/api/screenshots` with static fallback array |
| `frontend/src/pages/LocationTracking.jsx` | UI View | **Mock/Simulated** vehicle map view with dummy Mapbox token and static SVG path |
| `frontend/src/pages/Payroll.jsx` | UI View | Payroll computation view backed by `/api/payroll` |
| `frontend/src/pages/Compliance.jsx` | UI View | Compliance readiness matrix backed by `/api/compliance-readiness` |
| `frontend/src/pages/Alerts.jsx` | UI View | Real-time anomaly rules and incident alerts backed by `/api/alerts` |
| `frontend/src/pages/AgentManagement.jsx` | UI View | Agent heartbeat and telemetry daemon monitoring backed by `/api/agents` |
| `frontend/src/pages/Notifications.jsx` | UI View | Administrative notifications center backed by `/api/notifications` |
| `frontend/src/pages/settings/ManageUsers.jsx` | UI View | **Mock/LocalStorage** user management view backed by `userStore.js` |
| `frontend/src/pages/settings/ManageOrgGroups.jsx` | UI View | **Mock/LocalStorage** organizational hierarchy view backed by `userStore.js` |
| `frontend/src/pages/settings/BillingAndInvoices.jsx` | UI View | **Mock/LocalStorage** billing dashboard backed by `billingStore.js` |
| `frontend/src/pages/settings/billing/Plans.jsx` | UI View | Hardcoded pricing plan cards |
| `frontend/src/pages/settings/billing/AddOns.jsx` | UI View | Hardcoded add-on cards |
| `frontend/src/pages/settings/billing/SubscribeModal.jsx` | UI Component | Simulated checkout flow with timer delays |
| `frontend/src/pages/settings/Integrations.jsx` | UI View | 52 integration cards; mostly simulated |
| `frontend/src/pages/settings/integrations/IntegrationConfigModal.jsx` | UI Component | Simulated connection test modal using `setTimeout` |
| `frontend/src/pages/settings/ApiTokens.jsx` | UI View | **Mock/LocalStorage** API token management backed by `apiTokenStore.js` |
| `frontend/src/pages/settings/CreateApiTokenModal.jsx` | UI Component | Client-side token generator with hardcoded audit author `'Jane Smith'` |
| `frontend/src/pages/settings/ManualTime.jsx` | UI View | **Mock/LocalStorage** manual time category manager backed by `manualTimeStore.js` |
| `frontend/src/pages/settings/Utilization.jsx` | UI View | **Mock/LocalStorage** utilization formula editor backed by `utilizationStore.js` |
| `frontend/src/pages/settings/SecurityLanding.jsx` | UI View | **Mock/LocalStorage** SAML SSO configuration wizard backed by `securityStore.js` |
| `frontend/src/store/userStore.js` | State Store | Zustand store managing users and org groups in `user-management-storage-v2` |
| `frontend/src/store/billingStore.js` | State Store | Zustand store managing plans, add-ons, and trial countdown in `billing-storage` |
| `frontend/src/store/apiTokenStore.js` | State Store | Zustand store managing API tokens in `api-tokens-storage` |
| `frontend/src/store/manualTimeStore.js` | State Store | Zustand store managing manual time types in `manual-time-storage` |
| `frontend/src/store/utilizationStore.js` | State Store | Zustand store managing utilization formulas in `utilization-storage` |
| `frontend/src/store/securityStore.js` | State Store | Zustand store managing SAML verification in `security-storage` |
| `frontend/src/store/integrationStore.js` | State Store | Catalog of 52 integrations with static connection states |
| `frontend/src/store/reportsStore.js` | State Store | Zustand store managing workload thresholds in `reports-settings-storage` |
| `frontend/src/store/locationStore.js` | State Store | Zustand store managing geofencing settings in `location-settings-storage` |
| `frontend/src/utils/logAction.js` | Utility | Audit logging helper; frequently supplied with hardcoded user `'Jane Smith'` |
| `backend/src/server.js` | Backend Entry | Express server bootstrap, middleware registration, socket server init, and route mounting |
| `backend/prisma/schema.prisma` | DB Schema | Complete Prisma ORM schema defining 34 relational tables |
| `backend/src/controllers/auth.controller.js` | Backend Controller | User authentication, JWT issuance, and profile retrieval |
| `backend/src/controllers/employee.controller.js` | Backend Controller | Employee CRUD, status toggling, and team associations |
| `backend/src/controllers/team.controller.js` | Backend Controller | Team CRUD and member aggregation |
| `backend/src/controllers/project.controller.js` | Backend Controller | Project management and progress calculation |
| `backend/src/controllers/task.controller.js` | Backend Controller | Kanban task operations and status transitions |
| `backend/src/controllers/timesheet.controller.js` | Backend Controller | Timesheet submissions, manager approval workflow, and clock intervals |
| `backend/src/controllers/attendance.controller.js` | Backend Controller | Daily attendance records and summary queries |
| `backend/src/controllers/activity.controller.js` | Backend Controller | Hardware agent telemetry ingestion and activity aggregation |
| `backend/src/controllers/screenshot.controller.js` | Backend Controller | Screenshot metadata management and image file serving |
| `backend/src/controllers/location.controller.js` | Backend Controller | Live geolocation ingestion and query controller |
| `backend/src/controllers/payroll.controller.js` | Backend Controller | Salary computation, timesheet deduction aggregation, and payslip creation |
| `backend/src/controllers/alert.controller.js` | Backend Controller | Productivity alert rules and triggered incident logs |
| `backend/src/controllers/agent.controller.js` | Backend Controller | Desktop agent status, heartbeat, and configuration |
| `backend/src/services/complianceReadiness.service.js` | Backend Service | Evaluates live database metrics against SOC 2 and ISO 27001 rules |
| `backend/src/services/processMining.service.js` | Backend Service | Computes task cycle time; contains synthetic active duration multipliers |
| `backend/src/utils/screenshotSimulator.js` | Simulator | Injects mock screenshot records with Unsplash/Picsum images |
| `backend/src/utils/activitySimulator.js` | Simulator | Injects simulated activity ticks into database |

---

## 11. Final Summary & Metrics

### 11.1 Quantitative Audit Summary
- **Total Admin Modules Analyzed:** 18 primary functional modules + 14 settings sub-modules (32 total modules).
- **Total Admin Routes Analyzed:** 32 distinct URL routes.
- **Total Mock Data Sources Identified:** 40 discrete instances (MOCK-001 through MOCK-040).
- **Total Hardcoded Data Sources Identified:** 14 static datasets/parameters.
- **Total Simulated Functionalities Identified:** 10 simulated interactive workflows.
- **Total Real API Integrations Verified:** 26 functional API endpoints backed by Express controllers and Prisma database models.
- **Total Mixed-Data Modules:** 4 modules (Admin Dashboard, Real-Time Insights, Integrations Hub, Shift Scheduling).
- **Total Disconnected / LocalStorage-Only Modules:** 7 modules (Manage Users, Org Groups, Billing, API Tokens, Manual Time Types, Utilization Formulas, SAML SSO).

### 11.2 Key Takeaways & Architectural Assessment
1. **Duality of the Platform:** The project exhibits a split architectural maturity:
   - **Matured Operational Core:** Employee Management, Teams, Projects, Tasks (Kanban), Timesheets, Activity Telemetry, Screenshots, Payroll, and Compliance Readiness are legitimately connected to MySQL/MariaDB via Prisma ORM and Express REST controllers.
   - **Simulated Administrative Subsystems:** Governance subsystems (User Roles, Billing, API Tokens, SAML SSO, Utilization Formulas) exist solely within client-side Zustand stores and browser `localStorage`.
2. **Disconnected Live Monitoring Hubs:**
   - Both `/admin/location` (Location Tracking) and `/admin/attendance` (Daily Attendance) ignore operational backend endpoints in favor of client-side randomizers, static Mapbox tokens, and hardcoded dates. Connecting these views to their existing backend endpoints (`/api/location/live` and `/api/attendance/daily`) will convert them into functional production modules.
3. **Audit Trail Authenticity:**
   - The current usage of hardcoded `'Jane Smith'` credentials in configuration modals undermines regulatory compliance and should be wired to the active JWT session provided by `AdminAuthContext`.

---
*Report compilation completed. No source files were modified during this diagnostic analysis.*
