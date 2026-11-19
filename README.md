# InsightPool — Employee Monitoring & Productivity Intelligence Platform

An enterprise-grade, privacy-compliant Employee Monitoring and Workforce Analytics system with real-time telemetry, automated attendance tracking, desktop client agent, activity mining, and managerial reporting.

---

## 🏛️ System Architecture

```
employee-monitoring/
├── agent-source/                   # Cross-platform desktop tracker agent (Electron + Native scripts)
├── employee-monitoirng-backend/    # REST API & Socket.IO backend (Node.js, Express, Prisma ORM, MySQL)
├── employee-monitoring-frontend/   # Web Management Portal (React 18, Vite, Tailwind CSS, Lucide)
├── PROJECT_DOCUMENTATION/          # Full technical specifications, database schema, PRD, and architecture
│   ├── database/                   # Database schemas and SQL dumps
│   ├── guides/                     # Operational runbooks and git workflow guides
│   ├── reports/                    # Diagnostic audit logs and synchronization reports
│   ├── API_SPECIFICATION.md        # Complete REST API route documentation
│   ├── ARCHITECTURE.md             # System design & micro-architecture
│   ├── DATABASE.md                 # Data dictionary & relational models
│   ├── FLOW.md                     # Data flow lifecycle
│   ├── PRD.md                      # Product Requirements Document
│   └── RULES.md                    # Core business & compliance rules
├── .gitignore                      # Git ignore rules for node_modules, builds, and environments
└── package.json                    # Monorepo root helper scripts
```

---

## ⚡ Core Features

- **Desktop Monitoring Agent (`agent-source`):**
  - Native Windows/macOS background runner with system tray integration.
  - Active window and application detection via PowerShell and native APIs.
  - Idle time calculation and automated activity pulse.
  - Periodic screen snapshots and video capture with privacy blurring.

- **Real-Time Backend (`employee-monitoirng-backend`):**
  - Real-time bidirectional WebSocket communication (Socket.IO).
  - Multi-tenant organization isolation and Role-Based Access Control (RBAC: Admin, Manager, Employee).
  - Automated session management (clock-in, clock-out, idle session resolution).
  - Process mining directly-follows graph (DFG) calculation and bottleneck analytics.
  - MySQL database with Prisma ORM migrations.

- **Interactive Web Portal (`employee-monitoring-frontend`):**
  - **Executive Dashboards:** Real-time metrics, active employees, app usage trends.
  - **Device Management:** Registered desktop agents, online heartbeat status, approval workflows.
  - **Screenshots & Activity:** Live screen streams, timestamped snapshots, keystroke/mouse activity.
  - **Time & Attendance:** Automated time cards, shifts, overtime, and leave management.
  - **6 Core Analytics Reports:** Work Type, Schedule Adherence, Workload Distribution, Apps & Websites, Office vs Remote, and Process Mining.
  - **Payroll & Compliance:** Configurable salary structures, payslips, GDPR privacy controls, and screen blurring.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or later (v20+ recommended)
- **MySQL**: 8.0+
- **npm** or **yarn**

---

### 1. Backend Setup

```bash
cd employee-monitoirng-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, PORT, etc.

# Run Prisma migrations & generate client
npx prisma generate
npx prisma db push

# Start the server
npm run dev
```

The backend server runs at `http://localhost:5000`.

---

### 2. Frontend Setup

```bash
cd employee-monitoring-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api (or live production URL)

# Start development server
npm run dev

# Build for production
npm run build
```

The web application runs at `http://localhost:5173`.

---

### 3. Desktop Tracker Agent Setup

```bash
cd agent-source

# Install dependencies
npm install

# Run agent in development
npm start

# Build standalone Windows installer (.exe)
npm run dist:win
```

---

## 📋 Root Helper Commands

From the workspace root directory:
```bash
# Run frontend dev server
npm run dev:frontend

# Run backend dev server
npm run dev:backend

# Build frontend for production
npm run build
```

---

## 🔒 Security & Privacy

- **Data Encryption:** TLS in transit, Bcrypt password hashing at rest.
- **Privacy Controls:** Configurable screen blur modes (Full, PHI/PII Selective, or Disabled).
- **Access Control:** Strict role-based permission boundaries across Admin, Manager, and Employee portals.

---

## 📖 Documentation
Detailed technical specifications, ER diagrams, and operational runbooks are located in the [`PROJECT_DOCUMENTATION/`](./PROJECT_DOCUMENTATION/) directory.
