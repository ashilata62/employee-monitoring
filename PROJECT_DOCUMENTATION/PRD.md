# Product Requirements Document (PRD) — Employee Monitoring System

**Document Version:** 1.0.0  
**Effective Date:** November 19, 2026  
**Status:** Living Product Document  

---

## 1. Product Overview & Problem Statement

### 1.1 Product Overview
The **Employee Monitoring System** is a unified workforce analytics and real-time operational platform. It provides distributed, hybrid, and in-office teams with continuous visibility into work sessions, application usage, attendance reliability, productivity ratios, and security compliance.

### 1.2 Problem Statement
Modern remote and hybrid organizations struggle with:
- Fragmented visibility into remote workforce engagement and actual hours worked.
- Inaccurate manual timesheets prone to inflation or human estimation errors.
- Unmonitored data compliance and security risks on unmanaged computers.
- Inability to balance performance accountability with employee privacy rights.

### 1.3 Product Objectives & Business Goals
- **Automated Accountability:** Eliminate self-reported timesheets by capturing cryptographic proof of presence and activity via native desktop telemetry.
- **Productivity Intelligence:** Categorize application and domain usage into Productive, Neutral, and Unproductive workloads.
- **Enterprise Security:** Flag unauthorized software usage, off-hours logins, and geo-fence violations in real time.
- **Operational Efficiency:** Automate timesheet approvals, shift schedules, PDF executive summaries, and multi-tenant billing.

---

## 2. Target Users & User Roles

| Role | Implemented Status | Description & Core Responsibilities |
| :--- | :--- | :--- |
| **Admin** | **Implemented** | Full organizational authority. Configures tracking profiles, creates teams, manages billing/plans, provisions employees, connects third-party tools, and views global reports. |
| **Manager** | **Implemented** | Supervisory authority. Monitors assigned team members, reviews intraday timelines, approves timesheets, and inspects activity logs. |
| **Employee** | **Implemented** | End-user workforce member. Clocks in/out, records manual time adjustments, selects active tasks, views personal productivity metrics, and runs the desktop agent. |
| **Super Admin** | **Planned (Not Implemented)** | Multi-organization platform administrator. Planned for cross-tenant billing, SaaS tenant provisioning, and global system configuration. *(Currently not in schema/routes)*. |

---

## 3. Module-Wise Feature Specifications & Implementation Status

### 3.1 Authentication, Onboarding & Security
| Feature | Implementation Status | Description |
| :--- | :--- | :--- |
| Email & Password Login | **Implemented** | JWT-based authentication with bcrypt password hashing and 24h expiration. |
| Invitation Token Setup | **Implemented** | Secure tokenized email invite flow with `InvitationToken` validation. |
| Role-Based Route Guards | **Implemented** | Frontend `ProtectedRoute` and backend `roleMiddleware` enforcing role isolation. |
| SAML 2.0 Single Sign-On | **Partially Implemented** | UI wizard (`SamlWizard.jsx`) and API endpoints exist; IdP metadata exchange requires external IdP certificate. |
| Audit Trail Logging | **Implemented** | Sensitive actions logged in `AuditLog` table with IP, user agent, and timestamp. |

### 3.2 Time & Attendance Tracking
| Feature | Implementation Status | Description |
| :--- | :--- | :--- |
| Live Digital Stopwatch | **Implemented** | Active session counter updating every second without UI flicker. |
| Clock-In / Clock-Out API | **Implemented** | Manages `Attendance` sessions with duration and break counters. |
| 10-Minute Stale Session Sweeper | **Implemented** | Auto clock-out background sweeper runs every 60s in `server.js` for inactive agents. |
| Manual Time Submission | **Implemented** | Form to request manual time adjustments with manager approval status. |
| Time Off Management | **Implemented** | Leave balance management and holiday request calendar. |

### 3.3 Intraday Activity & Productivity Intelligence
| Feature | Implementation Status | Description |
| :--- | :--- | :--- |
| Intraday Timeline Bar | **Implemented** | 24-hour visual breakdown of Active, Idle, Manual, and Break hours. |
| App & Website Categorization | **Implemented** | Rule engine classifies usage into Productive, Neutral, and Unproductive. |
| Smart Idle Detection | **Implemented** | Desktop agent detects user inactivity (>60s IDLE, >300s OFFLINE) via OS API. |
| Process Mining Analysis | **Implemented** | Graph analysis of application switching patterns and workflow bottlenecks. |

### 3.4 Screenshot Capture & Monitoring
| Feature | Implementation Status | Description |
| :--- | :--- | :--- |
| Automated Interval Capture | **Implemented** | Configurable capture frequency (e.g., every 5, 10, or 15 minutes). |
| Privacy Blurring Engine | **Implemented** | Server-side Gaussian blur via `sharp` library when `globalBlur === true`. |
| Cloudinary & Local Storage | **Implemented** | Hybrid image storage engine with Cloudinary upload and local filesystem fallback. |
| Permanent Retention Policy | **Implemented** | Permanent audit record retention; automated purge disabled. |

### 3.5 Desktop Agent Telemetry (`agent-source`)
| Feature | Implementation Status | Description |
| :--- | :--- | :--- |
| Cross-Platform Desktop App | **Implemented** | Electron application for Windows, macOS, and Linux. |
| Active Window Title Sniffing | **Implemented** | PowerShell (`get-active-window.ps1`) and AppleEvents window logging. |
| Multi-Device Runner Daemon | **Implemented** | Lightweight multi-target Node daemon (`agent-runner.js`) for CI/CD and testing. |
| WebRTC Live Screen Streaming | **Partially Implemented** | Socket signaling (`live:request`, `live:offer`, `live:answer`) implemented; requires STUN/TURN in production. |

### 3.6 Tasks & Project Management
| Feature | Implementation Status | Description |
| :--- | :--- | :--- |
| Project & Task Hierarchy | **Implemented** | Project budgets, billable rates, and task assignment to employees. |
| Active Task Linking | **Implemented** | Desktop agent binds foreground work logs directly to specific `taskId`. |
| Third-Party Issue Connectors | **Implemented** | Connector infrastructure for Jira, ClickUp, GitHub, and GitLab in `integrations/connectors`. |

### 3.7 Alerts, Notifications & Automated Reports
| Feature | Implementation Status | Description |
| :--- | :--- | :--- |
| Real-Time Violation Alerts | **Implemented** | Dispatches `violation:new` to manager socket room on rule breach. |
| Live Bell Notification History | **Implemented** | Persisted notifications with read/unread tracking and badge count. |
| Scheduled PDF Email Reports | **Implemented** | Daily/Weekly cron generator at 08:00 AM using `pdfkit` and `nodemailer`. |

---

## 4. Role-Wise Feature Access Matrix

| Platform Module | Admin | Manager | Employee |
| :--- | :---: | :---: | :---: |
| **Executive Dashboard** | Full Org Scope | Team Scope | Personal Scope |
| **Employee Management** | Create / Edit / Deactivate | View Assigned Team | Self Profile Only |
| **Screenshot Gallery** | Full Org Scope | Assigned Team | Hidden / Blur Only |
| **Timesheet Approval** | Full Override | Team Approve/Reject | Submit Only |
| **Payroll & Billing** | Manage Plans / Rates | Hidden | View Personal Rate |
| **Tracking Settings** | Configure Frequency / Rules | Read Only | View Transparency Card |
| **Integration Webhooks** | Provision API Keys | Hidden | Hidden |

---

## 5. Non-Functional Requirements (NFR)

1. **Performance:** Dashboard API responses must complete within <300ms for date ranges up to 30 days.
2. **Reliability:** Real-time presence updates must reconnect automatically via Socket.IO exponential backoff.
3. **Multi-Tenancy:** 100% database query isolation via `organizationId`. Zero cross-tenant data leakage.
4. **Data Integrity:** Idempotent report generation prevents duplicate PDF dispatches during cluster restarts.
5. **Security:** JWT authentication with HMAC SHA-256 signatures; bcrypt password hashing.

---

## 6. Existing Limitations & Future Roadmap

### Existing Limitations:
- Single-tenant billing model implemented; multi-tenant subscription gating (`Stripe` webhooks) currently in mock state.
- Desktop Agent Windows Installer (.exe) is gitignored, requiring external hosting or manual artifact pipeline for live downloads.
- `SUPER_ADMIN` tier not yet decoupled from organization-level `ADMIN`.

### Future Roadmap:
- **Phase 1:** Complete Super Admin multi-organization portal.
- **Phase 2:** Cloudflare Turnstile / TOTP 2-Factor Authentication.
- **Phase 3:** Automated payroll payouts via Stripe Connect / Wise integration.
- **Phase 4:** On-device OCR for credit card / PII data redaction in screenshots.
