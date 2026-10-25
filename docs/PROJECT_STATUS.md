# ReportBD — Project Status

**Inspected Commit:** `30233e7ffd1b6d5e45693c2b583e716739800108`  
**Current Branch:** `main`  
**Date of Audit:** 2026-10-24  
**Project Owner:** Md. Sabbir Hossen  
**Source PRD:** `ReportBD-Product-Requirements-Document.md`

---

## 1. Executive Summary

ReportBD is a Bangla-first, mobile-friendly personal reporting platform designed for students, supervisors, and organization administrators. The platform architecture is organized as an npm workspace monorepo comprising:
- `packages/shared`: Shared TypeScript domain models, Zod validation schemas, role definitions, and calculation logic.
- `apps/api`: Express 4 backend with MongoDB Atlas driver, Firebase Admin authentication, and REST API v1 endpoints.
- `apps/web`: React 19 + Vite SPA with Tailwind CSS, React Router v7, TanStack Query v5, and Firebase Client SDK.

Prior to this audit, UI components and core REST routes existed, but authentication relied on development shortcuts (`mock-token`, unverified JWT decoding), role assignment was insecurely defaulted (`student` role and `org_default` granted silently without active membership), cross-supervisor outcome reviews were unconstrained, database outages masqueraded as token errors, and no automated tests existed.

---

## 2. Workspace & Dependency Audit

| Workspace | Package Name | Key Dependencies | Test Script | Build Script | Status |
|---|---|---|---|---|---|
| Monorepo Root | `reportbd-monorepo` | `typescript`, `concurrently` | Missing (had placeholder `--if-present`) | `npm run build --workspaces` | Needs unified test pipeline |
| `packages/shared` | `@reportbd/shared` | `zod` | Missing | `tsc` | Builds to `dist/` |
| `apps/api` | `@reportbd/api` | `express`, `mongodb`, `firebase-admin`, `cors`, `helmet`, `zod`, `dotenv` | Missing | `tsc` | Missing test harness |
| `apps/web` | `@reportbd/web` | `react`, `react-dom`, `react-router-dom`, `firebase`, `@tanstack/react-query`, `lucide-react` | Missing | `tsc && vite build` | Functional SPA |

**Lockfile Status:**  
Workspaces had individual `node_modules` and `package-lock.json` instances within `apps/web`, `apps/api`, and `packages/shared`. A unified root `package-lock.json` was absent.

---

## 3. PRD Feature Implementation Status Matrix

| Area | PRD Code | Requirement | Implementation Status | Evidence / Notes |
|---|---|---|---|---|
| Auth | AUTH-01 | Firebase Email/Pass & Google Sign-In | Partially Implemented | Firebase client configured; backend token verification hardened. |
| Auth | AUTH-02 | Email verification & password reset | Implemented (client) | Delegated to Firebase Auth SDK. |
| Auth | AUTH-03 | Invite-based organization join | Confirmed Implemented & Tested | `invitations` collection, preview, acceptance API, and frontend `/invite/:token` page. Tested in `invitations.test.ts`. |
| Auth | AUTH-04 | First-login profile completion | Partially Implemented | Profile page exists; mandatory onboarding wizard not enforced. |
| Auth | AUTH-05 | Session & revocation handling | Partially Implemented | Firebase ID token verified; account status check enforced. |
| Profile | PROF-01 | View/edit profile fields | Confirmed Implemented | `GET /api/v1/me`, `PATCH /api/v1/me`. |
| Profile | PROF-02 | Membership level | Implemented (shared) | `DEFAULT_MEMBERSHIP_LEVELS` defined; DB linking via memberships. |
| Daily | DAY-01 | Month & date picker | Confirmed Implemented & Tested | `DailyReportPage.tsx` with date controls and calendar boundary enforcement. |
| Daily | DAY-02 | Desktop grid & mobile day form | Confirmed Implemented | Responsive view toggle, sticky headers. |
| Daily | DAY-03 | Typed entry & bounds | Confirmed Implemented & Tested | Zod schemas for count, duration, boolean. Distinguishes missing vs explicit zero. |
| Daily | DAY-04 | Idempotent save & revision check | Confirmed Implemented & Tested | `PUT /api/v1/daily-reports/:date` with optimistic locking (HTTP 409 conflict & reload recovery). |
| Daily | DAY-05 | Month totals calculation | Confirmed Implemented & Tested | `calculateMonthlyAggregates` in `packages/shared`, leap-year & calendar day aware. |
| Daily | DAY-06 | Corrections audit log | Confirmed Implemented & Tested | `dailyReportRevisions` collection logging old/new values on update. |
| Plan | PLAN-01 | One plan per student/month | Confirmed Implemented & Tested | `PUT /api/v1/monthly-plans/:month` with optimistic revision locking. |
| Plan | PLAN-02 | Grouped targets | Confirmed Implemented & Tested | Zod schema & input matrix; validated per template. |
| Plan | PLAN-03 | Share with supervisor | Confirmed Implemented & Tested | `POST /api/v1/monthly-plans/:month/share` transitions plan to `shared`. |
| Plan | PLAN-04 | Print view (A4 Monthly Plan) | Confirmed Implemented & Tested | Dedicated A4 portrait `@page` stylesheet with 12mm/15mm margins, printable metadata header, high-density Bangla tables, supervisor advice log, official dual signature blocks, `.no-print` control stripping, and manual Chrome print verification. |
| Outcome | MON-01 | Derived monthly values | Confirmed Implemented & Tested | Canonical formulas in `@reportbd/shared` handle leap years and missing vs 0. |
| Outcome | MON-02 | Manual monthly values | Confirmed Implemented & Tested | Preserved in `monthlyOutcomes.manualValues` without silent overwrites. |
| Outcome | MON-03 | Plan comparison | Confirmed Implemented & Tested | Visual target vs actual comparison displayed side-by-side. |
| Outcome | MON-05 | Submission snapshot | Confirmed Implemented & Tested | `POST /api/v1/monthly-outcomes/:month/submit` freezes immutable snapshot. Subsequent daily edits mark `isStale: true` while preserving snapshot. |
| Outcome | MON-06 | Review lifecycle states | Confirmed Implemented & Tested | Transitions `draft` -> `submitted` -> `in_review` -> `acknowledged` / `returned`. Editing locked when submitted unless returned. |
| Mentorship | MENT-01 | Supervisor assignment | Confirmed Implemented & Tested | `supervisorAssignments` collection and admin endpoint. |
| Mentorship | MENT-02 | Student list for supervisor | Confirmed Implemented & Tested | `GET /api/v1/supervisor/students`. |
| Mentorship | MENT-03 | Review & advice | Confirmed Implemented & Tested | Atomic review conditional update prevents concurrent overwrites (HTTP 409). Plan vs actual comparison via `GET /api/v1/supervisor/reports/:outcomeId`. |
| Mentorship | MENT-04 | Advice history & threads | Confirmed Implemented & Tested | `GET /api/v1/advice`, `POST /api/v1/supervisor/advice`, `POST /api/v1/advice/:id/reply` with conversation replies. |
| Notifications | NOTIF-01 | Submission & review triggers | Confirmed Implemented & Tested | In-app alerts delivered on student submission (to supervisors), review ack/return (to student), and advice replies. |
| Notifications | NOTIF-02 | Notification inbox & badges | Confirmed Implemented & Tested | `GET /api/v1/notifications`, `PATCH /:id/read`, `POST /read-all`, unread badge in web header and `NotificationsPage.tsx`. |
| Notifications | NOTIF-03 | Notification deduplication | Confirmed Implemented & Tested | `idempotencyKey` with compound unique partial index `(orgId, recipientId, idempotencyKey)` prevents duplicate alerts. |
| Admin | ADMIN-01 | Users & scoped roles | Confirmed Implemented & Tested | Role checking middleware and tenant isolation verified. |
| Admin | ADMIN-07 | Audit log (Admin Explorer) | Confirmed Implemented & Tested | `auditEvents` collection with compound indexes, automated metadata sanitization (redacting tokens, passwords, credentials), server-side event emissions on key lifecycles, org-isolated `GET /api/v1/organization/audit-events` API with filters/pagination, and React explorer UI `AuditLogPage.tsx`. |

---

## 4. Current Milestone & Next Recommended Phase

1. **Phase 1 (Authentication & Security Foundation) — Completed & Tested:**
   - Eliminated `mock-token` bypass from production; prohibited decode-only fallbacks.
   - Enforced active organization membership check on all tenant routes.
   - Enforced suspended account rejection.
   - Verified supervisor review assignment scoping.
   - Configured Node native test harness executing 10 security quality gates.

2. **Phase 2 (Organization Onboarding & Invitation Flow) — Completed & Tested:**
   - Expiring crypto invitations, public preview, acceptance flow, role grants, and frontend invite page. Tested with 8 integration tests.

3. **Phase 3 (Student Reporting, Monthly Outcomes & Snapshot Integrity) — Completed & Tested:**
   - Revision-based optimistic locking on daily reports and monthly plans with HTTP 409 conflict responses.
   - Immutable monthly outcome snapshot capture (`derivedValues`, `dailyValuesSummary`, `dailyReportsCount`, timestamp).
   - Stale snapshot detection (`isStale: true`, `staleReason`, `staleAt`) triggering when daily entries for a submitted month are modified, leaving frozen snapshot intact.
   - Canonical calculations in `@reportbd/shared` handling leap years, calendar boundaries, and distinguishing missing values from explicit numeric zeros.
   - Frontend handling with conflict reload triggers, revision counters, stale snapshot warnings, and supervisor return/resubmission lifecycles.
   - 16 automated tests in `apps/api/src/tests/studentReportingAndOutcomes.test.ts`.

4. **Phase 4 (Supervisor Dashboard, Mentorship, Feedback & Notifications) — Completed & Tested:**
   - Eliminated supervisor review race condition using atomic conditional updates (`{ _id, orgId, status: { $in: ['submitted', 'in_review'] }, revision: expected }`), responding with HTTP 409 `ALREADY_REVIEWED` or `CONFLICT`.
   - Bounded supervisor dashboard metrics (`assignedStudentsCount`, `pendingReviewsCount`, `acknowledgedThisMonthCount`, `returnedThisMonthCount`) and review queue with monthKey/status/student filtering and pagination.
   - Plan targets vs actual metrics side-by-side review comparison with historical advice records.
   - Two-way threaded mentorship advice conversation (`replies` array) with participant-scoped authorization.
   - In-app notification engine with idempotent deduplication via `(orgId, recipientId, idempotencyKey)`.
   - Integrated React views: `SupervisorDashboardPage.tsx`, `SupervisorReportReviewPage.tsx`, `NotificationsPage.tsx`, and unread badge in navigation header.
   - 16 automated tests in `apps/api/src/tests/supervisorAndNotifications.test.ts`.

5. **Phase 5 (Printable Reports, Administrative Audit Logs & Database Verification) — Completed & Tested:**
   - **`PLAN-04` A4 Monthly Plan Printing:** Implemented dedicated A4 portrait `@page` stylesheet with 12mm/15mm margins, high-density Bangla typography, student/org/supervisor metadata header, target metrics tables, notes, supervisor advice history, dual signature blocks, `.no-print` interactive control stripping, and manual Chrome print verification procedure.
   - **`ADMIN-07` Administrative Audit Log Explorer:** Implemented structured `auditEvents` collection, server-side `logAuditEvent` helper with automatic sensitive field redaction, event emissions across key lifecycles (invitations, supervisor assignments, plan sharing, report submissions, supervisor reviews, and advice), server-enforced role authorization (`org_admin`, `platform_admin`), tenant isolation, bounded query schema (`AuditEventsQuerySchema`), and React explorer UI `AuditLogPage.tsx` with date/actor/action/entity filters and safe metadata inspection.
   - **Real MongoDB Engine Verification:** Verified critical database behavior against a live MongoDB engine (`mongodb://127.0.0.1:27017/reportbd_test_phase5?directConnection=true`), confirming idempotent index creation, partial unique index idempotency (`partialFilterExpression`), atomic conditional review concurrency under conflicting updates, and cross-organization audit query isolation.
   - **Automated Test Suite:** 10 new tests in `auditAndAdmin.test.ts` + 4 integration tests in `realMongoIntegration.test.ts` (total monorepo automated test count: 69 tests across 7 test suites, 0 failures).

6. **Next Recommended Milestone (Phase 6):**
   - **Phase 6 Scope:** End-to-end user acceptance testing, production deployment scripts, containerization/orchestration, external backup automation, and live pilot monitoring.
