# Report BD (BPS_Report)

A multi-tenant, mobile-first personal reporting and mentorship platform built with TypeScript, Node.js/Express, MongoDB Atlas, React 19, Vite, Tailwind CSS, and Firebase Authentication.

Report BD enables students to record structured daily spiritual, academic, and personal activities, generate monthly plans, compile derived monthly outcomes, and submit reports for supervisor mentorship and review. The platform includes role-based access control (RBAC), organization multi-tenancy, an administrative audit log explorer, in-app notifications, multilingual interface support (Bengali, English, Arabic) with RTL layout handling, responsive typography scaling, and dedicated A4 print formatting.

---

## Table of Contents

- [Project Status](#project-status)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites & Dependencies](#prerequisites--dependencies)
- [Local Development Setup](#local-development-setup)
- [Environment Configuration](#environment-configuration)
- [Available Scripts & Commands](#available-scripts--commands)
- [Application Routing](#application-routing)
- [Authentication & Access Control (RBAC)](#authentication--access-control-rbac)
- [Reporting Data Model & Metrics Catalog](#reporting-data-model--metrics-catalog)
- [Internationalization (i18n) & Localization](#internationalization-i18n--localization)
- [Design System & Accessibility](#design-system--accessibility)
- [API Architecture & Endpoints](#api-architecture--endpoints)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Deployment & Operations](#deployment--operations)
- [Known Limitations & Technical Gaps](#known-limitations--technical-gaps)
- [Contributing](#contributing)
- [License & Repository Links](#license--repository-links)

---

## Project Status

- **Current Milestone:** **Beta Deployment Candidate**
- **Automated Quality Gates:** Clean pass (Typecheck: 0 errors; Production Build: 0 errors; Whitespace: 0 errors; Automated Tests: 144 passing, 0 failing, 4 skipped when local MongoDB is offline; 148 passing with live MongoDB engine).
- **Security Hardening:** Remediated and verified across 10 security quality gates (no mock token bypass in production, unverified JWT decode fallback prohibited, active organization membership enforced on all tenant routes, account suspension enforced, tenant data isolation verified, sliding-window rate limiting active, and recursive audit payload sanitization up to depth 6).
- **Operational Status:** Production Docker container verified with non-root user `node` and live health probes. Cloud staging deployment and 17 manual human browser/print UAT scenarios remain pending authorized human verification (detailed in [`docs/BETA_UAT_CHECKLIST.md`](docs/BETA_UAT_CHECKLIST.md)).

---

## Key Features

### 1. Daily Personal Reporting
- **Dual View Modes:** Responsive single-day form (optimized for mobile touch screens) and a comprehensive monthly table grid (optimized for desktop data entry).
- **Input Types & Bounds:** Validated numeric counts, duration minutes (with an hours-plus-minutes input helper), boolean checklists, and text notes.
- **Optimistic Concurrency Locking:** `PUT /api/v1/daily-reports/:date` enforces revision matching (`revision: existing.revision`). Stale submissions return HTTP 409 `CONFLICT` with the latest server data and reload recovery triggers.
- **Revision History Audit:** Modifying an existing daily report automatically creates a historical record in `dailyReportRevisions` capturing the previous values, author, and timestamp.
- **Date-Restricted Confirmation:** The `routine_report_confirmed` (রিপোর্ট সংরক্ষণ) field is restricted to editing only on the current date in the organization's reporting timezone (`Asia/Dhaka`). Editing this field for past or future dates is rejected with HTTP 400 `DATE_RESTRICTED`.
- **Daily Performance Summary:** Instant computation of academic study hours, book pages read, organizational minutes, and rest/sleep hours, with side-by-side comparison against the previous calendar day.

### 2. Monthly Planning & A4 Printable Submission
- **Target Setting:** Students define monthly goals per metric within their assigned organization template.
- **Supervisor Sharing:** `POST /api/v1/monthly-plans/:month/share` transitions plans from `draft` to `shared`, exposing targets to assigned supervisors.
- **A4 Printable Layout (`PLAN-04`):** Dedicated `@page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }` stylesheet with student, organization, and supervisor metadata headers, high-density metric tables, notes, supervisor advice logs, dual official signature blocks, and interactive control stripping (`.no-print`).

### 3. Monthly Outcomes & Immutable Submission Snapshots
- **Canonical Derivations:** Deterministic calculation formulas in `@reportbd/shared` handle variable month lengths (28, 29, 30, 31 days), leap years, and explicitly distinguish missing (`null`/`undefined`) entries from legitimate numeric zeros (`0`).
- **Manual Values Integration:** Allows qualitative reflections and manual adjustments without overwriting derived metrics.
- **Side-by-Side Target Comparison:** Renders planned targets alongside actual monthly aggregates.
- **Submission Snapshot Freezing:** `POST /api/v1/monthly-outcomes/:month/submit` freezes an immutable snapshot (`derivedValues`, `dailyValuesSummary`, `dailyReportsCount`, timestamp) and transitions the outcome status to `submitted`.
- **Stale Snapshot Detection:** Modifying daily entries for a submitted month marks `isStale: true`, records `staleReason` and `staleAt`, and alerts users with an amber warning while preserving the original frozen snapshot.
- **Lifecycle Transition Guards:** Submitted reports cannot be overwritten via `PUT` or resubmitted unless an assigned supervisor returns the report for correction.

### 4. Supervisor Mentorship & Review Concurrency
- **Assigned Student Scoping:** Supervisors can only view, review, or advise students actively assigned to them within the same organization via the `supervisorAssignments` collection.
- **Supervisor Dashboard & KPI Aggregates:** Bounded summary counts (`assignedStudentsCount`, `pendingReviewsCount`, `acknowledgedThisMonthCount`, `returnedThisMonthCount`) with a paginated review queue filterable by `monthKey`, `status`, and `studentId`.
- **Atomic Review Updates:** `POST /api/v1/supervisor/reports/:outcomeId/review` uses conditional MongoDB queries (`{ _id, orgId, status: { $in: ['submitted', 'in_review'] }, revision }`). Concurrent reviews return HTTP 409 `ALREADY_REVIEWED` or `CONFLICT`.
- **Review Outcomes:** Supervisors can acknowledge reports or return them with actionable feedback. Returning a report unlocks student editing for resubmission.
- **Two-Way Threaded Advice:** Supervisors and students exchange threaded advice messages (`/api/v1/advice` and `/api/v1/advice/:id/reply`) scoped to authorized participants.

### 5. Multi-Tenant Role-Based Access Control (RBAC)
- **4 System Roles:** `student`, `supervisor`, `org_admin`, `platform_admin`.
- **7 Membership Levels:** `general_student`, `supporter`, `worker`, `sathi_candidate`, `sathi`, `member_candidate`, `member`.
- **Server-Evaluated Permissions:** `GET /api/v1/me` returns a server-calculated `permissions` array derived from active memberships.
- **Dual-Layer Enforcement:** Protected client-side routes and navigation gates (`ProtectedRoute`, `PermissionGate`, `canAccessNavigationItem`) mirror strict server-side middleware (`requireAuth`, `requireActiveMembership`, `requireRole`, `requirePermission`, `requireAnyPermission`).
- **Multi-Role Aggregation:** Users holding multiple roles (e.g., student and supervisor) receive the seamless union of their granted permissions.

### 6. Administrative Audit Log Explorer (`ADMIN-07`)
- **Immutable Event Log:** Captures system events (invitations, supervisor assignments, plan sharing, report submissions, supervisor reviews, and advice creation) in the `auditEvents` collection.
- **Automatic Metadata Sanitization:** Server-side recursive redaction (up to depth 6, truncating strings > 256 characters) automatically scrubs passwords, tokens, API keys, credentials, and authorization headers.
- **Tenant Isolation:** Queries are strictly bound to `req.user.orgId`.
- **Administrative UI:** Dedicated React explorer (`AuditLogPage.tsx`) featuring date-range filters, action and entity dropdowns, actor search, action badge semantics, and safe metadata inspection modals.

### 7. In-App Notifications
- **Event Triggers:** Automated alerts delivered upon report submission (to assigned supervisors), supervisor acknowledgment/return (to students), and advice replies.
- **Idempotency & Deduplication:** Compound unique partial index on `(orgId, recipientId, idempotencyKey)` prevents duplicate notifications during retried requests.
- **Recipient Isolation:** Users can only query and mark read their own notifications.
- **Header Badge:** Live unread count badge in the navigation header with quick links to mark items read.

### 8. Multilingual Support (i18n)
- **Supported Locales:** Bengali (`bn`, default), English (`en`), Arabic (`ar`).
- **Key Parity:** 100% catalog key parity across all 3 languages, verified by automated test suites.
- **Bidirectional Layouts:** Automatic document direction switching (`dir="ltr"` for Bengali and English; `dir="rtl"` for Arabic) with logical CSS spacing.
- **Localized Formatters:** Native numeral translation (English to Bengali/Arabic numerals), date formatting, month formatting, and duration formatters.

### 9. Design System & Dynamic Typography Scaling
- **Heritage Visual Identity:** Palette drawn from Bangladesh (`#006A4E`, `#E63946`) and Saudi Arabia (`#0B6B3A`, `#0AA879`) national heritage with geometric motifs.
- **Centralized Typography Scale:** Uses CSS custom properties (`--font-scale`, `--text-base`, `--text-lg`, etc.) driven by user text-size preferences:
  - `standard`: 1.0x scale
  - `large`: 1.15x scale
  - `extra-large`: 1.30x scale
- **Theme Modes:** Light and dark themes with system preference detection (`data-theme="light|dark"`).
- **Mobile Touch Targets:** Minimum 44px touch targets on mobile devices with responsive padding.

### 10. Developer & Community Hub
- **Dedicated Hub (`/developer`):** Information page for project maintainer Md. Sabbir Hossen, displaying verified community links (WhatsApp, Telegram, GitHub, LinkedIn, YouTube, Portfolio, Facebook, Instagram), project vision, and feedback forms.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Monorepo Runtime** | Node.js | `>=22.0.0` (tested on v22.20.0) | JavaScript runtime for backend and tooling |
| **Package Management** | npm | `>=10.0.0` (tested on v11.18.0) | npm workspaces monorepo orchestration |
| **Language** | TypeScript | `^5.7.3` | Static typing across all workspaces |
| **Frontend Framework** | React | `^19.0.0` | UI component architecture |
| **Frontend Routing** | React Router | `^7.2.0` | Declarative client-side routing & route code-splitting |
| **Build Tool & Bundler** | Vite | `^6.1.0` | Frontend dev server and production Rollup bundler |
| **Client State / Cache**| TanStack Query | `^5.66.0` | Server state caching, query invalidation, and deduplication |
| **Styling & CSS** | Tailwind CSS / PostCSS | `^3.4.17` / `^8.5.2` | Utility-first CSS with design system tokens |
| **Iconography** | Lucide React | `^0.475.0` | Accessible SVG icon suite |
| **Backend Framework** | Express | `^4.21.2` | REST API HTTP server |
| **Database Driver** | MongoDB Node Driver | `^6.13.0` | Native driver connecting to MongoDB Atlas / local engine |
| **Authentication (API)**| Firebase Admin SDK | `^13.1.0` | Server-side cryptographic verification of Firebase ID tokens |
| **Authentication (Web)**| Firebase Client SDK | `^11.3.1` | Client-side Email/Password and Google OAuth sign-in |
| **Data Validation** | Zod | `^3.24.2` | Runtime schema validation across API and shared models |
| **Security Headers** | Helmet | `^8.0.0` | HTTP response security headers |
| **CORS Middleware** | cors | `^2.8.5` | Origin validation and credential handling |
| **Test Runner** | Node.js Test Runner | `node:test` via `tsx ^4.19.3` | Zero-dependency native unit and integration test runner |
| **Process Runner** | concurrently | `^9.1.2` | Parallel execution of shared build and dev servers |
| **Containerization** | Docker | Multi-stage Alpine | Production container runtime with non-root user `node` |
| **Deployment Routing** | Vercel | SPA rewrites | Edge security headers and SPA `/index.html` fallback |

---

## System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Browser (React 19 + Vite)"]
        UI["React SPA UI / Tailwind CSS"]
        AuthCtx["AuthContext (Firebase Client SDK)"]
        I18nCtx["Language & TextSize Providers"]
        QueryCache["TanStack React Query Cache"]
    end

    subgraph Proxy["Reverse Proxy / Edge (Vercel / Cloudflare / Nginx)"]
        EdgeRewrites["SPA Fallback & Header Rules (vercel.json)"]
        RateLimitEdge["Sliding-Window Rate Limiters"]
    end

    subgraph Backend["Backend API (Express 4 on Node 22)"]
        AuthMW["requireAuth & requireActiveMembership"]
        RBACMW["requireRole & requirePermission"]
        Routes["REST API v1 (/me, /daily-reports, /monthly-plans, /monthly-outcomes, /supervisor, /organization, /advice, /notifications)"]
        AuditSvc["Audit Service (sanitizeMetadata depth <= 6)"]
        NotifSvc["Notification Service (idempotency partial index)"]
    end

    subgraph External["External Infrastructure & Storage"]
        FirebaseAuth["Firebase Authentication Service"]
        MongoAtlas["MongoDB Atlas Cluster (Collections, Indexes, Aggregations)"]
    end

    UI --> AuthCtx
    UI --> I18nCtx
    UI --> QueryCache
    QueryCache -- "HTTP /api/v1 (Bearer Token)" --> EdgeRewrites
    EdgeRewrites --> RateLimitEdge
    RateLimitEdge --> AuthMW
    AuthMW -- "verifyIdToken()" --> FirebaseAuth
    AuthMW --> RBACMW
    RBACMW --> Routes
    Routes --> AuditSvc
    Routes --> NotifSvc
    Routes --> MongoAtlas
    AuditSvc --> MongoAtlas
    NotifSvc --> MongoAtlas
```

---

## Repository Structure

```
.
├── .agents/                      # Agent behavior rules and conventions
│   └── rules/git-commits.md     # Git commit and PR guidelines
├── .github/                      # CI/CD automation
│   └── workflows/ci.yml         # GitHub Actions pipeline (Mongo 7.0 container, tests, typecheck, build)
├── apps/
│   ├── api/                     # Node.js + Express REST API backend
│   │   ├── api/index.ts         # Serverless entry point for Vercel deployment
│   │   ├── Dockerfile           # Multi-stage Alpine Docker build with non-root user
│   │   ├── package.json         # Backend dependencies and scripts
│   │   ├── tsconfig.json        # Backend TypeScript configuration
│   │   ├── vercel.json          # API serverless route rewrites
│   │   ├── .env.example         # Backend environment variables template
│   │   └── src/
│   │       ├── app.ts           # Express app setup, security middlewares, route mounting
│   │       ├── index.ts         # HTTP listener, startup validation, graceful shutdown
│   │       ├── config/          # Environment configuration and production startup checks
│   │       ├── db/              # MongoDB connection pool and health checks
│   │       ├── middleware/      # requireAuth, requireRole, requirePermission, rateLimiter, errorHandler
│   │       ├── routes/          # API v1 routes (me, dailyReports, monthlyPlans, monthlyOutcomes, supervisor, etc.)
│   │       ├── scripts/         # initDb.ts: Idempotent index creation and default template seeding
│   │       ├── services/        # audit.ts (sanitization) and notifications.ts (idempotent alerts)
│   │       └── tests/           # 8 test suites (RBAC, security hardening, supervisor, student, audit, real Mongo)
│   └── web/                     # React 19 + Vite frontend Single Page Application
│       ├── index.html           # HTML entry point with font preloads and viewport metadata
│       ├── package.json         # Frontend dependencies and scripts
│       ├── postcss.config.js    # PostCSS configuration
│       ├── tailwind.config.js   # Tailwind configuration mapped to design tokens
│       ├── tsconfig.json        # Frontend TypeScript configuration
│       ├── vercel.json          # SPA fallback rewrites and security response headers
│       ├── vite.config.ts       # Vite config (proxy to :4000, alias paths, manual chunk splitting)
│       ├── .env.example         # Frontend environment variables template
│       ├── public/              # Web app icons, SVG favicons, and manifest.json
│       └── src/
│           ├── main.tsx         # React DOM mount point
│           ├── App.tsx          # Router, route-level code splitting, context providers
│           ├── index.css        # Global CSS, resets, A4 print rules, and direction styles
│           ├── components/      # UI components (auth, common, daily, layout, navigation)
│           ├── config/          # Firebase client config and navigation items registry
│           ├── context/         # AuthContext, LanguageContext, ThemeContext, TextSizeContext
│           ├── i18n/            # Translation dictionaries (bn, en, ar) and formatters
│           ├── pages/           # Page views (Dashboard, DailyReport, MonthlyPlan, Supervisor, Audit, etc.)
│           ├── services/        # api.ts (fetchWithAuth with automatic token refresh)
│           ├── styles/          # tokens.css (centralized variables, typography scale, heritage palette)
│           └── tests/           # 4 test suites (RBAC navigation, i18n catalog parity, typography, developer)
├── bps-report-design-system/     # Design specifications, style guides, and reference components
│   ├── DESIGN_SPEC.md           # Color palettes, typography guidelines, and layout rules
│   ├── README.md                # Design system overview and component usage instructions
│   └── src/                     # Tokens, global CSS, logo, and loader reference implementations
├── docs/                        # Project documentation and operational runbooks
│   ├── BETA_UAT_CHECKLIST.md    # 17-point persona UAT manual test sheet and sign-off criteria
│   ├── DEPLOYMENT_GUIDE.md      # Zero-downtime production deployment, rollback, and proxy runbooks
│   ├── PHASE_STATUS.md          # Chronological phase status ledger and verification audit trail
│   ├── PROJECT_STATUS.md        # Comprehensive technical status, PRD requirement matrix, and milestones
│   └── SECURITY_FINDINGS.md     # Audit findings, remediation records, and verification proofs
├── packages/
│   └── shared/                  # Monorepo shared domain library (@reportbd/shared)
│       ├── package.json         # Shared library build and test scripts
│       ├── tsconfig.json        # Shared library TypeScript configuration
│       └── src/
│           ├── index.ts         # Module export barrel
│           ├── calculations/    # aggregations.ts (canonical monthly formulas), dailySummary.ts
│           ├── constants/       # metrics.ts (9 groups, 31 metrics), permissions.ts, roles.ts
│           ├── schemas/         # Zod schemas for daily reports, plans, outcomes, invitations, audit
│           ├── tests/           # 3 test suites (aggregations, dailySummary, i18n metrics)
│           └── types/           # Shared TypeScript interfaces for users, reports, plans, outcomes, audit
├── .dockerignore                # Docker build exclusions
├── .gitignore                   # Git exclusions (environment files, service accounts, recordings)
├── .npmrc                       # npm configuration (production devDependencies handling)
├── firestore.rules              # Firebase security rules (reference)
├── package.json                 # Monorepo root manifest and orchestration scripts
├── package-lock.json            # Root lockfile ensuring reproducible dependency tree
├── ReportBD-Product-Requirements-Document.md # Original product requirements document (PRD)
├── storage.rules                # Firebase Storage security rules (reference)
├── tsconfig.base.json           # Root TypeScript base compiler configuration
└── vercel.json                  # Root multi-service Vercel configuration
```

---

## Prerequisites & Dependencies

Before running Report BD locally, ensure you have:

1. **Node.js:** Version `22.x` (LTS recommended; tested on v22.20.0).
2. **npm:** Version `10.x` or `11.x` (tested on v11.18.0).
3. **MongoDB:** A running MongoDB instance (version 7.0+ recommended), either locally via Docker/service or a hosted MongoDB Atlas connection string.
4. **Firebase Project:** A Firebase project with **Authentication** enabled (Email/Password and Google providers enabled). You will need:
   - Web App configuration credentials for the frontend.
   - A Service Account Private Key JSON for the backend API.

---

## Local Development Setup

Follow these steps to set up and run the application locally from a clean checkout:

### 1. Clone the Repository
```bash
git clone https://github.com/MSabbirHossen/personalreport.git
cd personalreport
```

### 2. Install Monorepo Dependencies
Install all dependencies across the root and workspace packages:
```bash
npm install
```

### 3. Build the Shared Package
The shared package must be built before starting the services so its compiled JavaScript outputs are available in `packages/shared/dist`:
```bash
npm run build -w packages/shared
```

### 4. Configure Environment Files

Create the local environment files from the provided templates:

**Backend API (`apps/api/.env`):**
```bash
cp apps/api/.env.example apps/api/.env
```
Edit `apps/api/.env` and supply your database connection and Firebase Admin credentials:
```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/reportbd
MONGODB_DB_NAME=reportbd
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ALLOW_DEV_MOCK_AUTH=true
TRUST_PROXY=false
```

**Frontend Web (`apps/web/.env`):**
```bash
cp apps/web/.env.example apps/web/.env
```
Edit `apps/web/.env` and supply your Firebase client credentials:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_API_BASE_URL=
```
*(Leave `VITE_API_BASE_URL` empty in local development; Vite proxies `/api` requests directly to `http://localhost:4000`.)*

### 5. Initialize Database Collections & Indexes
Execute the database initialization script against your MongoDB database to create all collections, unique indexes, partial filter indexes, and default template versions:
```bash
npm run db:init -w apps/api
```

### 6. Start the Development Server
Run the unified development command to launch the shared package watcher, frontend SPA, and backend API in parallel:
```bash
npm run dev
```

### 7. Access the Application
- **Frontend SPA:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **API Health Check:** [http://localhost:4000/health](http://localhost:4000/health)
- **API Readiness Check:** [http://localhost:4000/health/ready](http://localhost:4000/health/ready)

---

## Environment Configuration

### Backend API Variables (`apps/api/.env`)

| Variable | Scope | Required in Prod | Safe Default | Description |
|---|---|---|---|---|
| `PORT` | Server | Optional | `4000` | Network port for the Express HTTP server |
| `NODE_ENV` | Server | **Yes** | `development` | Environment mode (`development`, `test`, `production`) |
| `CORS_ORIGIN` | Server | **Yes** in prod | None | Comma-separated list of allowed frontend origins (e.g. `https://app.reportbd.com`). Wildcards (`*`) are strictly rejected in production. |
| `MONGODB_URI` | Server | **Yes** | `mongodb://localhost:27017/reportbd` | MongoDB connection URI. Loopback/localhost addresses are rejected during production startup validation. |
| `MONGODB_DB_NAME` | Server | Optional | `reportbd` | Target database name inside the MongoDB instance or cluster |
| `FIREBASE_PROJECT_ID` | Server | **Yes** in prod | None | Firebase project identifier from Google Cloud Console |
| `FIREBASE_CLIENT_EMAIL` | Server | **Yes** in prod | None | Firebase Admin service account client email |
| `FIREBASE_PRIVATE_KEY` | Server | **Yes** in prod | None | Firebase Admin RSA private key (with escaped newlines `\n`) |
| `ALLOW_DEV_MOCK_AUTH` | Server | **Forbidden** in prod | `false` | Development bypass flag allowing `Authorization: Bearer mock-token`. Production startup validation throws an error if set to `true`. |
| `TRUST_PROXY` | Server | Optional | `false` | Enables Express trusted proxy header resolution. Set `true` if behind Cloudflare, Nginx, or AWS ALB. |
| `ALLOW_LOCALHOST_CORS`| Server | Optional | `false` | Flag allowing localhost CORS origins even when running with `NODE_ENV=production`. |

### Frontend Web Variables (`apps/web/.env`)

All frontend variables are prefixed with `VITE_` and are bundled into the client build. **Never place server-side secrets or private keys in frontend environment files.**

| Variable | Scope | Required in Prod | Safe Default | Description |
|---|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | Public / Client | **Yes** | None | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Public / Client | **Yes** | None | Firebase authentication domain (`<project-id>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Public / Client | **Yes** | None | Firebase project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET`| Public / Client | **Yes** | None | Firebase cloud storage bucket identifier |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Public / Client | **Yes** | None | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Public / Client | **Yes** | None | Firebase Web Application ID |
| `VITE_API_BASE_URL` | Public / Client | Optional | Empty string `""` | Base URL for the backend API. If left empty, API calls use relative paths (`/api/v1`) via Vite dev proxy or reverse proxy. |

---

## Available Scripts & Commands

### Monorepo Root Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Runs shared watcher, web frontend (:3000), and API backend (:4000) concurrently |
| `npm run dev:web` | Runs the Vite development server for `apps/web` |
| `npm run dev:api` | Runs the Express API backend with `tsx watch` for `apps/api` |
| `npm run build` | Builds all packages and workspaces with a `build` script (`shared`, `api`, `web`) |
| `npm run typecheck` | Runs TypeScript type checking (`tsc --noEmit`) across all workspaces |
| `npm run lint` | Runs workspace lint scripts `--if-present` (Note: workspace lint scripts are currently unconfigured) |
| `npm test` | Runs the test suites across all workspaces (`packages/shared`, `apps/api`, `apps/web`) |

### Workspace-Specific Scripts

**Shared Package (`packages/shared`):**
- `npm run build -w packages/shared`: Compiles TypeScript files to `dist/`
- `npm run dev -w packages/shared`: Runs TypeScript compiler in watch mode
- `npm test -w packages/shared`: Runs 3 unit test suites (26 tests) with `node:test`
- `npm run typecheck -w packages/shared`: Validates TypeScript typing without emitting files

**Backend API (`apps/api`):**
- `npm run dev -w apps/api`: Runs API in development mode with `tsx watch`
- `npm run db:init -w apps/api`: Idempotently initializes MongoDB indexes and default templates
- `npm run build -w apps/api`: Compiles backend TypeScript to `dist/`
- `npm start -w apps/api`: Starts the compiled production server (`node dist/index.js`)
- `npm test -w apps/api`: Runs all 8 API test suites (93 tests)
- `npm run test:integration -w apps/api`: Runs targeted real MongoDB integration tests
- `npm run typecheck -w apps/api`: Validates API TypeScript types

**Frontend Web (`apps/web`):**
- `npm run dev -w apps/web`: Starts Vite local development server on port 3000
- `npm run build -w apps/web`: Compiles TypeScript and runs `vite build` to output `dist/`
- `npm run preview -w apps/web`: Serves local production build via Vite preview
- `npm test -w apps/web`: Runs 4 frontend quality gate test suites (29 tests)
- `npm run typecheck -w apps/web`: Validates frontend TypeScript types

---

## Application Routing

### Frontend Routes (`apps/web`)

| Route Path | Page Component | Access Requirement | Required Permission / Role |
|---|---|---|---|
| `/login` | `LoginPage` | Public | None |
| `/register` | `RegisterPage` | Public | None |
| `/forgot-password` | `ForgotPasswordPage` | Public | None |
| `/invite/:token` | `InvitePage` | Public / Authenticated | Valid cryptographic invitation token |
| `/developer` | `DeveloperInfoPage` | Public / Authenticated | None |
| `/developer-info`| Redirect | Public | Redirects to `/developer` |
| `/app/home` | `DashboardPage` | Authenticated | Active user session |
| `/app/reports/daily` | `DailyReportPage` | Authenticated + Org Member | `daily_report:read_own` |
| `/app/reports/monthly-plan` | `MonthlyPlanPage` | Authenticated + Org Member | `monthly_plan:read_own` |
| `/app/reports/monthly-outcome` | `MonthlyOutcomePage` | Authenticated + Org Member | `monthly_outcome:read_own` |
| `/app/advice` | `AdvicePage` | Authenticated + Org Member | `advice:read_own` |
| `/app/notifications` | `NotificationsPage` | Authenticated + Org Member | `notifications:read_own` |
| `/app/profile` | `ProfilePage` | Authenticated | `profile:read_own` |
| `/supervisor/dashboard` | `SupervisorDashboardPage` | Authenticated + Supervisor | `supervisor:dashboard_read` |
| `/supervisor/students` | `SupervisorDashboardPage` | Authenticated + Supervisor | `supervisor:students_read` |
| `/supervisor/students/:studentId/reports` | `SupervisorDashboardPage` | Authenticated + Supervisor | `supervisor:report_read` |
| `/supervisor/reports/:outcomeId` | `SupervisorReportReviewPage`| Authenticated + Assigned Sup | `supervisor:report_read` |
| `/organization/audit-log` | `AuditLogPage` | Authenticated + Org Admin | `org:audit_read` |

---

## Authentication & Access Control (RBAC)

### Authentication Flow
1. **Client Identity:** Users authenticate on the web client via Firebase Authentication using Email/Password or Google Sign-In.
2. **Token Passing:** The client obtains a Firebase ID token and includes it in all API requests via the `Authorization: Bearer <token>` header.
3. **Cryptographic Verification:** In `apps/api/src/middleware/auth.ts`, `requireAuth` verifies the token against the Firebase Admin SDK using `verifyIdToken()`.
4. **User & Membership Resolution:**
   - Resolves or creates the user in the `users` collection by immutable `firebaseUid`.
   - Rejects suspended accounts (`userRecord.status === 'active'`).
   - Resolves active organization membership from the `memberships` collection.
   - Computes effective permissions as a union across all assigned roles using `getEffectivePermissions(roles)`.
5. **Membership Enforcement:** All organization-scoped routes require the `requireActiveMembership` middleware. Users without active organization membership receive HTTP 403 `NO_ACTIVE_MEMBERSHIP`.

### System Roles & Permission Matrix

| Permission | Student | Supervisor | Org Admin | Platform Admin |
|---|:---:|:---:|:---:|:---:|
| `daily_report:read_own` | ✅ | ❌ | ❌ | ✅ |
| `daily_report:write_own` | ✅ | ❌ | ❌ | ✅ |
| `monthly_plan:read_own` | ✅ | ❌ | ❌ | ✅ |
| `monthly_plan:write_own` | ✅ | ❌ | ❌ | ✅ |
| `monthly_plan:share_own` | ✅ | ❌ | ❌ | ✅ |
| `monthly_outcome:read_own` | ✅ | ❌ | ❌ | ✅ |
| `monthly_outcome:write_own` | ✅ | ❌ | ❌ | ✅ |
| `monthly_outcome:submit_own` | ✅ | ❌ | ❌ | ✅ |
| `supervisor:dashboard_read` | ❌ | ✅ | ✅ | ✅ |
| `supervisor:queue_read` | ❌ | ✅ | ✅ | ✅ |
| `supervisor:students_read` | ❌ | ✅ | ✅ | ✅ |
| `supervisor:report_read` | ❌ | ✅ | ✅ | ✅ |
| `supervisor:review_submit` | ❌ | ✅ | ✅ | ✅ |
| `supervisor:advice_create` | ❌ | ✅ | ✅ | ✅ |
| `advice:read_own` | ✅ | ❌ | ❌ | ✅ |
| `advice:reply` | ✅ | ✅ | ✅ | ✅ |
| `org:audit_read` | ❌ | ❌ | ✅ | ✅ |
| `org:users_read` | ❌ | ❌ | ✅ | ✅ |
| `org:invitations_manage` | ❌ | ❌ | ✅ | ✅ |
| `platform:manage` | ❌ | ❌ | ❌ | ✅ |

---

## Reporting Data Model & Metrics Catalog

Report BD organizes reporting into **9 primary categories** containing **31 standardized metrics** defined in `packages/shared/src/constants/metrics.ts`:

| Group ID | Category Title (English / Bengali) | Metrics Count | Primary Metric Examples | Aggregation Type |
|---|---|:---:|---|---|
| `quran` | Qur'an Study & Recitation<br/>কুরআন অধ্যয়ন ও তিলাওয়াত | 3 | `quran_study_ayat` (Ayat)<br/>`quran_recitation_minutes` (Minutes)<br/>`quran_tafsir_ayat` (Ayat) | `sum` |
| `hadith` | Hadith Study<br/>হাদিস অধ্যয়ন | 3 | `hadith_study_count` (Count)<br/>`hadith_memorization_count` (Count)<br/>`hadith_study_minutes` (Minutes) | `sum` |
| `salah` | Salah & Prayers<br/>নামাজ ও ইবাদত | 3 | `salah_fard_congregation` (Times)<br/>`salah_fard_on_time` (Times)<br/>`salah_tahajjud_performed` (Boolean) | `sum`, `count_active_days` |
| `reading` | Islamic Literature & Reading<br/>ইসলামী বই ও সাহিত্য অধ্যয়ন | 2 | `islamic_book_pages` (Pages)<br/>`other_literature_pages` (Pages) | `sum` |
| `academic` | Textbook & Academic Study<br/>পাঠ্যবই ও প্রাতিষ্ঠানিক অধ্যয়ন | 3 | `academic_study_minutes` (Minutes)<br/>`class_attended_count` (Classes)<br/>`total_classes_held` (Classes) | `sum` |
| `contacts` | Contacts & Outreach<br/>যোগাযোগ ও দাওয়াত | 7 | `dawah_contacts_count`, `supporter_contacts_count`, `wellwisher_contacts_count`, `dawah_time_minutes`, etc. | `sum` |
| `distribution` | Distribution & Publications<br/>বই ও সাময়িকী বিতরণ | 5 | `books_distributed_count`, `magazines_distributed_count`, `leaflets_distributed_count`, etc. | `sum` |
| `organizational`| Organizational Work<br/>সাংগঠনিক কাজ ও বৈঠক | 2 | `org_meeting_minutes` (Minutes)<br/>`org_duty_time_minutes` (Minutes) | `sum` |
| `routine` | Daily Routine & Self Care<br/>দৈনন্দিন রুটিন ও আত্মউন্নয়ন | 6 | `routine_physical_exercise_min`, `routine_sleep_hours`, `routine_self_criticism_done`, `routine_report_confirmed`, etc. | `sum`, `avg_calendar_days`, `count_active_days`, `last_value` |

### Aggregation Formulas
Derived metrics are calculated deterministically by `@reportbd/shared/src/calculations/aggregations.ts`:
- **`sum`:** Total sum of valid recorded numbers across the month.
- **`count_active_days`:** Counts days where the metric value equals boolean `true`.
- **`avg_answered_days`:** Average divided strictly by days with non-null answers (prevents dragging down averages when days are omitted).
- **`avg_calendar_days`:** Average divided by total days in the month (e.g. 28, 29 in leap years, 30, or 31).
- **`last_value`:** Carries forward the most recent non-empty recorded value.

---

## Internationalization (i18n) & Localization

The application features full multilingual support across three languages:
1. **Bengali (`bn`):** Default locale for all users, tailored for Bangladesh organizations.
2. **English (`en`):** Full technical and interface translation.
3. **Arabic (`ar`):** Heritage translation with native RTL support.

### Translation Architecture
- **Catalog Location:** [`apps/web/src/i18n/resources/`](apps/web/src/i18n/resources/) (`bn.ts`, `en.ts`, `ar.ts`).
- **Catalog Parity:** Guaranteed 100% key parity across all locales, enforced by automated test `i18nCatalog.test.ts`.
- **Bidirectional Support:** When Arabic is active, `LanguageProvider` sets `<html dir="rtl" lang="ar">`, adjusting flex layouts, borders, navigation elements, and table directions via CSS logical properties.
- **Number Formatting:** English numerals are dynamically converted to Bengali numerals (`০১২৩৪৫৬৭৮৯`) and Arabic numerals (`٠١٢٣٤٥٦٧٨٩`) via localized formatters in `apps/web/src/i18n/utils/formatters.ts`.

---

## Design System & Accessibility

Report BD implements a heritage design system inspired by the colors and visual identity of Bangladesh and Saudi Arabia:

- **Primary Colors:** Bangladesh Green (`#006A4E`), Saudi Forest Green (`#0B6B3A`), Bright Accent Green (`#0AA879`), Accent Red (`#E63946`).
- **Dynamic Typography Scaling:** Centralized scale in `tokens.css` utilizing `--font-scale` to provide user-selectable text sizes:
  - `standard` (scale = 1.0)
  - `large` (scale = 1.15)
  - `extra-large` (scale = 1.30)
- **Script-Specific Fonts:** Noto Sans Bengali (Bangla), Inter (Latin/English), and Noto Sans Arabic (Arabic).
- **Theme Modes:** Light and dark theme tokens supported via `data-theme="light|dark"`, automatically detecting system preference when set to `system`.
- **Accessibility Practices:**
  - High-contrast color tokens meeting contrast ratios.
  - Visible keyboard focus rings (`--focus-ring: #2684ff`).
  - Screen reader status announcements (`role="status"`, `aria-live`).
  - `prefers-reduced-motion` media queries disabling non-essential transitions.
  - Minimum 44px mobile touch targets across navigation links, buttons, and form inputs.

---

## API Architecture & Endpoints

All REST API endpoints are prefixed with `/api/v1` and protected by global sliding-window rate limiting.

### Public & Health Endpoints
- `GET /`: Service identification JSON.
- `GET /health`: Liveness probe (HTTP 200 `{ status: "ok", service: "bps-report-api" }`).
- `GET /health/ready`: Readiness probe (checks MongoDB ping; returns 200 `{ status: "ready", database: "connected" }` or 503 `{ status: "unready", database: "disconnected" }`).

### Authenticated REST Endpoints (`/api/v1`)

| Method | Endpoint | Access Middleware | Description |
|---|---|---|---|
| `GET` | `/me` | `requireAuth` | Retrieves current user profile, organization, roles, and effective permissions |
| `PATCH` | `/me` | `requireAuth` | Updates user profile details |
| `GET` | `/me/memberships` | `requireAuth` | Lists user's active organization memberships |
| `GET` | `/invitations/:token` | Public | Previews invitation details (organization name, role, email) |
| `POST` | `/invitations/:token/accept` | `requireAuth` | Accepts invitation and grants active organization membership |
| `GET` | `/templates/current` | `requireActiveMembership` | Retrieves active metric template for organization |
| `GET` | `/daily-reports?month=YYYY-MM` | `requirePermission(DAILY_REPORT_READ_OWN)` | Lists student daily reports for the month |
| `GET` | `/daily-reports/:date` | `requirePermission(DAILY_REPORT_READ_OWN)` | Retrieves single daily report by date |
| `PUT` | `/daily-reports/:date` | `requirePermission(DAILY_REPORT_WRITE_OWN)` | Upserts daily report with optimistic revision check |
| `GET` | `/monthly-plans/:month` | `requirePermission(MONTHLY_PLAN_READ_OWN)` | Retrieves student monthly plan targets |
| `PUT` | `/monthly-plans/:month` | `requirePermission(MONTHLY_PLAN_WRITE_OWN)` | Saves monthly plan targets with optimistic locking |
| `POST` | `/monthly-plans/:month/share` | `requirePermission(MONTHLY_PLAN_SHARE_OWN)` | Shares monthly plan targets with assigned supervisor |
| `GET` | `/monthly-outcomes/:month` | `requirePermission(MONTHLY_OUTCOME_READ_OWN)`| Retrieves monthly outcome and derived values |
| `PUT` | `/monthly-outcomes/:month` | `requirePermission(MONTHLY_OUTCOME_WRITE_OWN)`| Updates manual values for monthly outcome |
| `POST` | `/monthly-outcomes/:month/submit` | `requirePermission(MONTHLY_OUTCOME_SUBMIT_OWN)`| Freezes immutable snapshot and submits report |
| `GET` | `/supervisor/dashboard` | `requirePermission(SUPERVISOR_DASHBOARD_READ)` | Aggregates supervisor KPI metrics and recent queue |
| `GET` | `/supervisor/queue` | `requirePermission(SUPERVISOR_QUEUE_READ)` | Paginated review queue with status and month filters |
| `GET` | `/supervisor/students` | `requirePermission(SUPERVISOR_STUDENTS_READ)` | Lists assigned students and their latest report statuses |
| `GET` | `/supervisor/reports/:outcomeId`| `requirePermission(SUPERVISOR_REPORT_READ)` | Loads report for review with plan target comparison |
| `POST` | `/supervisor/reports/:outcomeId/review` | `requirePermission(SUPERVISOR_REVIEW_SUBMIT)` | Submits atomic review (acknowledge or return) |
| `POST` | `/supervisor/advice` | `requirePermission(SUPERVISOR_ADVICE_CREATE)` | Creates a new mentorship advice thread |
| `GET` | `/advice` | `requirePermission(ADVICE_READ_OWN)` | Retrieves user's mentorship advice threads |
| `POST` | `/advice/:id/reply` | `requirePermission(ADVICE_REPLY)` | Appends reply to existing advice conversation thread |
| `GET` | `/notifications` | `requirePermission(NOTIFICATIONS_READ_OWN)` | Retrieves user's in-app notifications |
| `PATCH` | `/notifications/:id/read` | `requirePermission(NOTIFICATIONS_READ_OWN)` | Marks single notification as read |
| `POST` | `/notifications/read-all` | `requirePermission(NOTIFICATIONS_READ_OWN)` | Marks all user notifications as read |
| `GET` | `/organization/users` | `requireRole(['org_admin', 'platform_admin'])` | Lists organization users and roles |
| `GET` | `/organization/invitations` | `requireRole(['org_admin', 'platform_admin'])` | Lists pending organization invitations |
| `POST` | `/organization/invitations` | `requireRole(['org_admin', 'platform_admin'])` | Generates a single-use crypto invitation |
| `DELETE`| `/organization/invitations/:id` | `requireRole(['org_admin', 'platform_admin'])` | Revokes pending invitation |
| `GET` | `/organization/audit-events` | `requireRole(['org_admin', 'platform_admin'])` | Queries audit trail with date/action filters and redaction |
| `POST` | `/organization/assignments` | `requireRole(['org_admin', 'platform_admin'])` | Assigns supervisor to student |

---

## Testing & Quality Assurance

Report BD utilizes the built-in Node.js test runner (`node:test`, `node:assert/strict`) executed with `tsx`.

### Automated Test Breakdown (148 Total Tests)

1. **Shared Package (`packages/shared`, 26 Tests):**
   - `aggregations.test.ts` (5 tests): Reporting arithmetic, calendar-day averages, answered-day averages, leap years, and count sums.
   - `dailySummary.test.ts` (16 tests): Education hours, book pages sum, dawah minutes, sleep conversions, legitimate zero handling, date arithmetic, and Zod input bounds.
   - `i18n.test.ts` (5 tests): Multilingual metric group titles, metric labels, units, and localized summary comparisons across Bengali, English, and Arabic.

2. **Frontend Web (`apps/web`, 29 Tests):**
   - `developerPage.test.ts` (4 tests): Verified social contact links, email mailto formats, and complete i18n translations.
   - `i18nCatalog.test.ts` (7 tests): 100% key parity between Bengali, English, and Arabic catalogs, non-empty translation strings, string interpolations, and number formatters.
   - `rbacNavigation.test.ts` (13 tests): Role-to-permission mapping, multi-role unions, sidebar navigation group visibility, role-specific quick links, and mobile bottom nav bounds.
   - `typographyScale.test.ts` (5 tests): CSS custom property definitions, dynamic scaling with `var(--font-scale)`, user text-size modes, and Tailwind mapping.

3. **Backend API (`apps/api`, 93 Tests):**
   - `authAndSecurity.test.ts` (10 tests): Quality Gates 1–10 (token verification, mock token rejection, membership requirement, suspended account denial, tenant boundary isolation, database error isolation, CORS allowlist).
   - `invitations.test.ts` (8 tests): Invitation lifecycle, crypto token generation, admin guards, expiration enforcement, and membership upserts.
   - `studentReportingAndOutcomes.test.ts` (19 tests): Daily report optimistic locking, revision tracking, monthly plan targets, snapshot capture, post-submission staleness detection, and supervisor return lifecycles.
   - `supervisorAndNotifications.test.ts` (16 tests): Supervisor assignment scoping, atomic conditional review updates, race condition rejection (HTTP 409), dashboard KPI aggregates, threaded advice replies, and notification deduplication.
   - `auditAndAdmin.test.ts` (10 tests): Administrative audit query schemas, tenant filtering, sensitive field redaction, and event emissions.
   - `securityHardening.test.ts` (13 tests): Sliding-window rate limiters, recursive metadata sanitization (depth 6), malformed JSON handling, startup configuration validation, and production 500 stack trace concealment.
   - `rbacEnforcement.test.ts` (12 tests): Project-wide RBAC enforcement across student, supervisor, and admin endpoints, privilege escalation blocking, and server-side permission evaluation.
   - `realMongoIntegration.test.ts` (5 tests): Real MongoDB engine verification, target safety allowlist guards, partial unique index idempotency, atomic review update concurrency, and cross-organization audit query isolation.

### Running Test Suites

Execute all tests across all workspaces:
```bash
npm test
```

Execute tests for individual workspaces:
```bash
npm test -w packages/shared
npm test -w apps/web
npm test -w apps/api
```

Run real MongoDB integration tests specifically:
```bash
npm run test:integration -w apps/api
```

### Manual Smoke-Test Checklist
- [ ] Sign in via Google OAuth or Email/Password on `/login`.
- [ ] Verify role-specific Quick Links on the `/app/home` dashboard.
- [ ] Navigate to `/app/reports/daily`, enter daily numbers, and save. Verify the timestamp and summary card update.
- [ ] Verify `routine_report_confirmed` cannot be toggled for dates other than today.
- [ ] Navigate to `/app/reports/monthly-plan`, set a target, and click Share with Supervisor.
- [ ] Print preview `/app/reports/monthly-plan` in Chrome (Ctrl+P) and verify the A4 portrait printable layout.
- [ ] Navigate to `/app/reports/monthly-outcome`, verify derived metrics, and click Submit.
- [ ] Switch to a supervisor account, open `/supervisor/dashboard`, and review the submitted report.
- [ ] Toggle theme modes (Light / Dark) and Text Size modes (Standard / Large / Extra Large).
- [ ] Switch locale to Arabic (`ar`) and verify that the layout mirrors to RTL.

---

## Deployment & Operations

### 1. Docker Containerization (`apps/api`)
The backend API is containerized using a multi-stage Alpine Dockerfile located at `apps/api/Dockerfile`:
- **Stage 1 (Builder):** Uses `node:22-alpine`, installs dependencies, compiles `@reportbd/shared` and `@reportbd/api`, and prunes development dependencies.
- **Stage 2 (Runner):** Minimal Alpine image running as non-root user `node`. Includes `curl` for container health monitoring.
- **Healthcheck Probe:** Built-in `HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:4000/health || exit 1`.

Build and run the production container:
```bash
docker build -t reportbd-api:latest -f apps/api/Dockerfile .
docker run -p 4000:4000 --env-file apps/api/.env reportbd-api:latest
```

### 2. Frontend Vercel Deployment (`apps/web`)
The frontend is optimized for deployment to Vercel or any static SPA host:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **SPA Rewrites:** `apps/web/vercel.json` routes all client paths (`/(.*)`) to `/index.html`.
- **Security Headers:** Adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Referrer-Policy: strict-origin-when-cross-origin`.

### 3. Continuous Integration (`.github/workflows/ci.yml`)
The GitHub Actions workflow executes on push and pull requests targeting `main`:
1. Launches an official `mongo:7.0` service container with ping healthchecks.
2. Checks out repository and configures Node.js 22 with npm caching.
3. Performs clean install via `npm ci`.
4. Compiles the shared package (`npm run build -w packages/shared`).
5. Verifies code formatting and whitespace (`git diff --check`).
6. Executes shared package tests (`npm test -w packages/shared`).
7. Executes web frontend tests (`npm test -w apps/web`).
8. Initializes MongoDB indexes and templates against the live MongoDB container (`npm run db:init -w apps/api`).
9. Executes full API test suite with real MongoDB integration (`npm test -w apps/api`).
10. Validates workspace typecheck (`npm run typecheck`).
11. Executes production build across all workspaces (`npm run build`).

---

## Known Limitations & Technical Gaps

1. **In-Memory Rate Limiting:** The sliding-window rate limiters in `rateLimiter.ts` utilize in-memory storage scoped to a single Node.js process. When scaling horizontally across multiple container replicas, quotas are not synchronized globally. A distributed external cache (e.g. Redis via `rate-limit-redis`) or upstream edge rate limiting (Cloudflare, AWS WAF, Google Cloud Armor) is required for multi-replica deployments.
2. **Offline MongoDB Test Skipping:** When executing `npm test -w apps/api` without a running MongoDB instance, the 4 real MongoDB integration tests are skipped (while 89 unit/mock tests pass). To enforce fail-fast connection requirements during testing, run with environment variable `FAIL_ON_UNAVAILABLE_MONGO=true`.
3. **Workspace Lint Scripts:** While root `package.json` contains `"lint": "npm run lint --workspaces --if-present"`, individual workspace `package.json` files do not currently declare a `lint` script. Static code validation currently relies on `typecheck` (`tsc --noEmit`), build verification, and `git diff --check`.
4. **First-Login Onboarding Wizard:** While basic profile editing is implemented on `/app/profile`, a mandatory first-login step-by-step onboarding wizard is not strictly enforced upon registration.
5. **Human Browser & Physical Print Verification:** Automated tests and headless build steps pass completely, but manual exploratory human testing on physical devices and physical paper printouts remains pending (as documented in `docs/BETA_UAT_CHECKLIST.md`).

---

## Contributing

We welcome contributions to Report BD. Please follow the repository guidelines:

### Contribution Workflow
1. **Branch Naming:** Create a feature branch following the convention `feat/<feature-name>`, `fix/<issue-name>`, or `chore/<task-name>`.
2. **Commit Messages:** Follow the commit standards specified in `.agents/rules/git-commits.md` (e.g., `feat(daily): add responsive date navigation`, `fix(auth): enforce active membership check`).
3. **Maintain i18n Parity:** When adding new UI strings, ensure identical translation keys are added simultaneously to all three dictionaries:
   - `apps/web/src/i18n/resources/bn.ts`
   - `apps/web/src/i18n/resources/en.ts`
   - `apps/web/src/i18n/resources/ar.ts`
4. **Respect Design Tokens:** Use semantic tokens from `tokens.css` and avoid hard-coded arbitrary color classes.
5. **Enforce Backend Authorization:** Never rely solely on frontend UI hiding for security; ensure all backend routes enforce appropriate `requireRole` or `requirePermission` middlewares.
6. **Pre-Commit Verification:** Run the full verification pipeline locally before submitting a PR:
   ```bash
   npm run typecheck
   npm test
   npm run build
   git diff --check
   ```

---

## License & Repository Links

- **Repository:** [https://github.com/MSabbirHossen/personalreport.git](https://github.com/MSabbirHossen/personalreport.git)
- **Project Owner / Maintainer:** Md. Sabbir Hossen
- **License Status:** No open-source or proprietary license file is currently identified in this repository. All rights are reserved by the project owner unless otherwise specified.

