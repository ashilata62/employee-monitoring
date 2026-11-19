# Employee Monitoring System — Project & Engineering Rules

**Document Version:** 1.0.0  
**Effective Date:** November 19, 2026  
**Target Systems:** `employee-monitoring-frontend`, `employee-monitoirng-backend`, `agent-source`  
**Classification:** Internal Engineering Standard  

---

## 1. Project Purpose, Architecture & Scope

The **Employee Monitoring System** is an enterprise-grade, multi-tenant workforce intelligence, productivity measurement, time tracking, and compliance platform. The platform is architected as a **monorepo** consisting of three core application tiers:
1. **Frontend Web App (`employee-monitoring-frontend`):** Single-page application built on React 18, Vite 5, Tailwind CSS, and Zustand.
2. **Backend REST & Real-Time API (`employee-monitoirng-backend`):** Node.js runtime with Express 5, Prisma ORM 5, MySQL database, and Socket.IO real-time event engine.
3. **Desktop Agent Client (`agent-source`):** Cross-platform desktop application built with Electron 29, capturing active window metadata, system idle time, and automated screen captures.

All engineering activities must preserve system stability, data privacy, and multi-tenant data boundaries.

---

## 2. Rule Classification

Every rule in this document is labeled as either:
- `[MANDATORY]`: Strictly enforced. Violations cause automated build failures, merge rejections, or production rollbacks.
- `[RECOMMENDED]`: Best practice. Expected unless an architectural trade-off is formally documented.

---

## 3. Repository & File Organization Rules

### 3.1 Monorepo Boundaries `[MANDATORY]`
- The Git repository root is `C:\Users\91969\Downloads\employee monitoring`.
- Do not initialize independent `.git` directories inside `employee-monitoring-frontend` or `employee-monitoirng-backend`.
- All team pulls and synchronization operations must be executed at the root level using `git pull origin main`.

### 3.2 File Naming Conventions `[MANDATORY]`
- **Frontend Components & Pages:** PascalCase (e.g., `ComparativeKpiGrid.jsx`, `Dashboard.jsx`, `TimeAndAttendance.jsx`).
- **Frontend Stores & Utilities:** camelCase (e.g., `authStore.js`, `timeFormat.js`, `api.js`).
- **Backend Controllers, Routes & Services:** Dot notation with descriptor suffix (e.g., `attendance.controller.js`, `attendance.routes.js`, `attendance.service.js`).
- **Backend Middleware & Utilities:** Dot notation (e.g., `auth.middleware.js`, `role.middleware.js`, `orgId.js`).
- **Database Migrations:** Prisma timestamped folders (`prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql`).

---

## 4. Frontend Development Rules

### 4.1 State Management & Store Scoping `[MANDATORY]`
- Global state must use **Zustand**. Do not introduce Redux, MobX, or React Context for high-frequency data.
- Global timer states (such as active stopwatch ticks) must use dedicated subscribers (`useSessionTimer`, `useLiveTimeDisplay`) to prevent unnecessary component re-rendering.
- Always clear interval timers and event listeners inside `useEffect` cleanup returns:
  ```javascript
  useEffect(() => {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
  }, []);
  ```

### 4.2 Styling & Theme Consistency `[MANDATORY]`
- All styling must be expressed through Tailwind CSS utility classes.
- Support both **Light** and **Dark** modes via the Tailwind `dark:` prefix.
- Hardcoded hex codes outside the official brand configuration are prohibited.

### 4.3 Safe API Integration `[MANDATORY]`
- Never call `fetch()` directly in UI components. All HTTP interactions must route through centralized services in `src/services/` using the configured Axios client (`src/config/api.js`).
- Never hardcode the backend URL in components. Always resolve via `import.meta.env.VITE_API_URL` or fallback to `http://localhost:5000/api`.

---

## 5. Backend Development Rules

### 5.1 Architecture Layering `[MANDATORY]`
- Code must follow a strict three-tier module architecture:
  1. **Route (`*.routes.js`):** Defines HTTP verb, URL path, middleware pipeline (`authMiddleware`, `roleMiddleware`), and maps to controller methods.
  2. **Controller (`*.controller.js`):** Validates request input, calls services, and handles HTTP response wrapping using `successResponse` or `errorResponse`.
  3. **Service (`*.service.js`):** Contains pure business logic and Prisma database operations. Controllers must never query `prisma` directly.

### 5.2 Input Validation & Serialization `[MANDATORY]`
- All incoming payloads must be validated using **Zod** schemas or explicit guard checks before reaching service functions.
- Passwords must be hashed with `bcrypt` (minimum 10 salt rounds) before persistence.

---

## 6. Multi-Tenant Data Isolation & Organization Scoping

### 6.1 Strict Organization Scoping `[MANDATORY]`
- Every database query for tenant-owned models must include `organizationId` in the `where` clause:
  ```javascript
  const records = await prisma.activityLog.findMany({
      where: {
          organizationId,
          ...filters
      }
  });
  ```
- `organizationId` must be derived securely from `req.user.organizationId` (set by `auth.middleware.js`) using `getOrganizationId(req)`. Never trust an unverified `organizationId` sent in the request body from a non-admin client.

---

## 7. Authentication, Authorization & Roles

### 7.1 Implemented Roles `[MANDATORY]`
- The system recognizes exactly three roles defined in Prisma `Role`:
  1. `ADMIN`: Full administrative control over organization settings, employees, billing, integrations, and reports.
  2. `MANAGER`: Delegated supervisory access over assigned teams, timesheet approvals, and intraday activity.
  3. `EMPLOYEE`: Personal dashboard, time recording, personal timesheet submission, and task execution.
- Note: `SUPER_ADMIN` is not currently implemented in the database schema or middleware.

### 7.2 Route Protection `[MANDATORY]`
- All non-public routes must apply `authMiddleware`.
- Elevated routes must enforce `roleMiddleware(['ADMIN', 'MANAGER'])`.
- Requests from deactivated employees (`employee.status === 'DEACTIVATED'`) must be rejected with HTTP 403 `ACCOUNT_DEACTIVATED`.

---

## 8. Employee Privacy & Monitoring Standards

### 8.1 Consent & Transparency `[MANDATORY]`
- The Desktop Agent must display transparent status indicators (Online, Idle, On Break, Disconnected).
- Stealth tracking mode is only permitted on company-owned computers (`computerType === 'COMPANY'`) where authorized by organizational compliance settings.

### 8.2 Screenshot Masking & Storage `[MANDATORY]`
- If `screenshotSetting.globalBlur === true` or privacy rules dictate, screenshot images must be blurred during ingestion using `sharp` before being written to disk or Cloudinary.
- Screenshot retention is governed by permanent audit requirements unless explicitly deleted by authorized administrators.

---

## 9. Real-Time Engine & Socket.IO Rules

### 9.1 Channel Isolation `[MANDATORY]`
- Socket connections must authenticate via JWT or Base64 Agent token during the handshake.
- Sockets must be joined to scoped rooms:
  - `org_${organizationId}`: Broadcasts general presence and activity ticks.
  - `org_${organizationId}_managers`: Restricted to Admin/Manager roles for security alerts and violation events.
  - `employee_${employeeId}`: Direct point-to-point commands (e.g., live stream requests).

---

## 10. Background Schedulers & Automations

### 10.1 Automated PDF Email Reports `[MANDATORY]`
- Automated reports are scheduled via `node-cron` (`0 8 * * *`) inside `reportScheduler.js`.
- The scheduler must record daily dispatches in the in-memory set `dispatchedHistory` to prevent duplicate emails during cluster restarts.
- Email transport failures must be caught, logged via `logger.error`, and recorded in `AuditLog` without crashing the Express server.

### 10.2 Stale Attendance Sweeper `[MANDATORY]`
- The server runs a 60-second periodic sweep (`processAllStaleSessions`) that automatically clocks out agent sessions that have gone silent for more than 10 minutes without explicit logout.

---

## 11. Git & Multi-Developer Safety Rules

### 11.1 Prohibited Operations `[MANDATORY]`
- `git reset --hard` is strictly forbidden.
- `git clean -fd` is strictly forbidden.
- Force pushing (`git push --force`) to `main` is strictly forbidden.
- Blind conflict resolution using `--ours` or `--theirs` is strictly forbidden.

### 11.2 Standard Synchronization Protocol `[MANDATORY]`
1. Check status: `git status`
2. Stash local work: `git stash push -m "local-backup"`
3. Pull updates: `git pull origin main`
4. Reapply local work: `git stash pop`
5. Test compile: `npm run build`
