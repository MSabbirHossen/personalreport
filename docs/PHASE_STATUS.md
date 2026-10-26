# ReportBD — Phase Status Ledger

## Phase 1: Authentication and Security Foundation
**Target Milestone:** Hardening Foundation for V1 Pilot  
**Status:** Completed (Remediation & Testing Verified)  
**Objective:** Secure all identity, membership, and multi-tenant authorization pathways before advancing to unverified product features.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **A1** | Remove hard-coded `mock-token` bypass from production auth path | Confirmed Implemented & Tested | Removed from production path in `apps/api/src/middleware/auth.ts`. Protected by `config.allowDevMockAuth`. Verified in Gate 2 test. |
| **A2** | Forbid unverified JWT decoding or decode-only fallback | Confirmed Implemented & Tested | Removed unverified claims parsing from `requireAuth`. Malformed/unverified tokens strictly rejected with 401 `INVALID_TOKEN`. Verified in Gate 1 test. |
| **A3** | Fail closed on invalid/missing Firebase Admin config in production | Confirmed Implemented & Tested | `validateStartupConfig()` in `apps/api/src/config/index.ts` enforces `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` in production. |
| **A4** | Reject suspended or disabled accounts | Confirmed Implemented & Tested | Explicit check `userRecord.status === 'active'` in `requireAuth`; returns 403 `ACCOUNT_SUSPENDED`. Verified in Gate 4 test. |
| **A5** | Do not silently grant `student` or assign `org_default` | Confirmed Implemented & Tested | Removed silent defaults; added `requireActiveMembership` middleware on all organization routes. Users without active membership receive 403 `NO_ACTIVE_MEMBERSHIP`. Verified in Gate 3 test. |
| **A6** | Scope supervisor reviews to assigned students only | Confirmed Implemented & Tested | `POST /api/v1/supervisor/reviews/:outcomeId` verifies active `supervisorAssignments` link between supervisor and student. Unassigned supervisors receive 403 `FORBIDDEN`. Verified in Gate 7 test. |
| **A7** | Isolate infrastructure/database errors from token errors | Confirmed Implemented & Tested | MongoDB query failures in `requireAuth` return 503 `DATABASE_UNAVAILABLE` instead of 401 `INVALID_TOKEN`. Verified in Gate 8 test. |
| **A8** | Enforce CORS allowlist in production with credential support | Confirmed Implemented & Tested | Origin callback strictly checks `config.cors.allowedOrigins` in production, rejecting wildcards and unapproved origins with 403 `CORS_FORBIDDEN`. Verified in Gate 10 test. |
| **A9** | Add health liveness and readiness check endpoints | Confirmed Implemented & Tested | Added `GET /health` (liveness) and `GET /health/ready` (checks MongoDB `ping: 1`). |
| **A10** | Un-ignore `.env.example` while securing real environment files | Confirmed Implemented & Tested | Added `!.env.example` to root `.gitignore` while keeping real `.env*` and `*firebase-service-account*.json` safely excluded. |
| **A11** | Implement automated test suite covering all 10 security scenarios | Confirmed Implemented & Tested | Created `apps/api/src/tests/authAndSecurity.test.ts` (10 quality gates) and `packages/shared/src/tests/aggregations.test.ts` (reporting calculations). |

---

## Phase 2: Organization Onboarding & Invitation Flow
**Target Milestone:** Member Lifecycle & Onboarding (PRD AUTH-03, AUTH-04, ADMIN-01)  
**Status:** Completed (Implemented & Tested)  
**Objective:** Enable organization administrators to securely invite members and allow invitees to accept invitations and gain active organization memberships.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **B1** | Admin creates single-use expiring invitation | Confirmed Implemented & Tested | `POST /api/v1/organization/invitations` generates 48-char crypto hex token, 7-day expiration, and prevents duplicate active member invites. Tested in `apps/api/src/tests/invitations.test.ts` (Inv-1, Inv-3). |
| **B2** | Non-admin blocked from issuing invitations | Confirmed Implemented & Tested | Role guard `requireRole(['org_admin', 'platform_admin'])` returns 403 `FORBIDDEN` for students and unauthorized users. Tested in `invitations.test.ts` (Inv-2). |
| **B3** | Public/invitee preview of invitation details | Confirmed Implemented & Tested | `GET /api/v1/invitations/:token` returns organization name, role, email, and expiration timestamp without exposing internal secrets. Tested in `invitations.test.ts` (Inv-4). |
| **B4** | Expired/revoked invitations cannot be accepted | Confirmed Implemented & Tested | Expired or revoked invitations return 410 `INVITATION_EXPIRED`. Tested in `invitations.test.ts` (Inv-5, Inv-8). |
| **B5** | Invitee accepts invitation & receives active membership | Confirmed Implemented & Tested | `POST /api/v1/invitations/:token/accept` upserts `memberships` with status `'active'`, marks invitation `'accepted'`, and unlocks access to organization-scoped routes. Tested in `invitations.test.ts` (Inv-6). |
| **B6** | List user memberships via `/me/memberships` | Confirmed Implemented & Tested | `GET /api/v1/me/memberships` returns user's active memberships with populated organization names. Tested in `invitations.test.ts` (Inv-7). |
| **B7** | Admin can list and revoke pending invitations | Confirmed Implemented & Tested | `GET /api/v1/organization/invitations` and `DELETE /api/v1/organization/invitations/:id`. Tested in `invitations.test.ts` (Inv-8). |
| **B8** | Frontend `/invite/:token` invitation page | Confirmed Implemented & Tested | Created `apps/web/src/pages/InvitePage.tsx` with Bangla UI, Google/Email login integration, and one-click accept. |

---

## Phase 3: Student Reporting, Monthly Outcomes & Snapshot Integrity
**Target Milestone:** Reporting Core & Review Readiness (PRD DAY-01–06, PLAN-01–04, MON-01–06)
**Status:** Completed (Implemented & Tested)
**Objective:** Make daily reporting, monthly planning, and monthly outcomes persistent, concurrency-safe, tamper-resistant, and ready for supervisor review.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **C1** | Optimistic concurrency locking on daily reporting | Confirmed Implemented & Tested | `PUT /api/v1/daily-reports/:date` validates incoming revision and performs conditional DB update `{ revision: existing.revision }`. Stale revision returns HTTP 409 `CONFLICT` without overwriting latest data. Tested in `studentReportingAndOutcomes.test.ts` (Daily-3, Daily-4). |
| **C2** | Missing values distinguished from numeric zero | Confirmed Implemented & Tested | Aggregations and forms distinguish `null`/`undefined` from explicit `0`. Null entries do not artificially drag down active-day or answered-day averages. Tested in `studentReportingAndOutcomes.test.ts` (Daily-5) and `aggregations.test.ts`. |
| **C3** | Revision history audit trail | Confirmed Implemented & Tested | Edits to existing daily entries create entries in `dailyReportRevisions` capturing timestamp, author, previous values, and incremented revision. Tested in `studentReportingAndOutcomes.test.ts` (Daily-2). |
| **C4** | Monthly planning persistence & revision tracking | Confirmed Implemented & Tested | `PUT /api/v1/monthly-plans/:month` persists target metrics per organization and student with optimistic concurrency. Returns 409 `CONFLICT` on stale writes. Tested in `studentReportingAndOutcomes.test.ts` (Plan-1, Plan-2). |
| **C5** | Monthly plan sharing & supervisor visibility | Confirmed Implemented & Tested | `POST /api/v1/monthly-plans/:month/share` transitions plan status to `shared`, making targets available to assigned supervisor. Tested in `studentReportingAndOutcomes.test.ts` (Plan-3). |
| **C6** | Canonical calculation formulas in shared package | Confirmed Implemented & Tested | `calculateMetricAggregate` in `@reportbd/shared` handles leap years, month boundaries (e.g. Feb 28/29, 30, 31 days), duration conversions, and count sums with deterministic precision. Tested in `aggregations.test.ts`. |
| **C7** | Immutable submission snapshot capture | Confirmed Implemented & Tested | `POST /api/v1/monthly-outcomes/:month/submit` captures immutable snapshot (`derivedValues`, `dailyValuesSummary`, `dailyReportsCount`, timestamp). Submissions freeze outcome status to `submitted`. Tested in `studentReportingAndOutcomes.test.ts` (Outcome-1). |
| **C8** | Stale snapshot detection on post-submission edits | Confirmed Implemented & Tested | When a daily report affecting a submitted month is saved, API marks `isStale: true`, logs `staleReason`, and records `staleAt` while keeping frozen snapshot unmodified. Tested in `studentReportingAndOutcomes.test.ts` (Outcome-2). |
| **C9** | Isolation of stale detection to relevant month | Confirmed Implemented & Tested | Edits to daily reports for unrelated months do not trigger staleness flags on submitted outcomes. Tested in `studentReportingAndOutcomes.test.ts` (Outcome-3). |
| **C10** | Outcome lifecycle state transition guards | Confirmed Implemented & Tested | Once submitted, outcome cannot be edited via PUT (HTTP 400 `IMMUTABLE_OUTCOME`) or re-submitted (HTTP 400 `INVALID_STATE_TRANSITION`) unless supervisor returns it. Tested in `studentReportingAndOutcomes.test.ts` (Outcome-4). |
| **C11** | Supervisor review & return/resubmission lifecycle | Confirmed Implemented & Tested | Assigned supervisor can review and acknowledge or return report with advice. Returned status unlocks student editing for resubmission. Tested in `studentReportingAndOutcomes.test.ts` (Review-1, Review-2). |
| **C12** | Frontend UX for conflict reload & stale warnings | Confirmed Implemented | `DailyReportPage.tsx` and `MonthlyPlanPage.tsx` present revision badges, display 409 conflict notifications, and offer reload recovery buttons. `MonthlyOutcomePage.tsx` displays amber warning banners when report is stale and distinguishes live vs submitted values. |

---

## Phase 4: Supervisor Dashboard, Mentorship, Feedback & Notifications
**Target Milestone:** Supervisor Workflow, Two-Way Feedback & In-App Alerts (PRD MENT-01–04, NOTIF-01–03)
**Status:** Completed (Implemented & Tested)
**Objective:** Harden supervisor review concurrency, implement supervisor dashboard and review queue, enable threaded mentorship feedback, and deliver idempotent in-app notifications.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **D1** | Atomic supervisor review conditional update | Confirmed Implemented & Tested | `POST /api/v1/supervisor/reports/:outcomeId/review` executes an atomic conditional update `{ _id: outcomeId, orgId, status: { $in: ['submitted', 'in_review'] }, revision: expectedRevision }`. If a concurrent supervisor or action already transitioned the status, returns HTTP 409 `ALREADY_REVIEWED`. If revision is stale, returns HTTP 409 `CONFLICT`. Tested in `supervisorAndNotifications.test.ts` (Sup-4, Sup-5). |
| **D2** | Strict tenant & assignment scoping on reviews | Confirmed Implemented & Tested | Supervisors can only inspect or review reports for students actively assigned to them within the same organization (`supervisorAssignments` collection check). Unassigned access returns HTTP 403 `FORBIDDEN_STUDENT_NOT_ASSIGNED`. Cross-org access returns HTTP 403. Tested in `supervisorAndNotifications.test.ts` (Sup-1, Sup-2). |
| **D3** | Draft report review rejection | Confirmed Implemented & Tested | Attempting to review a report with status `draft` is strictly rejected with HTTP 400 `CANNOT_REVIEW_DRAFT`. Tested in `supervisorAndNotifications.test.ts` (Sup-3). |
| **D4** | Review audit metadata & snapshot preservation | Confirmed Implemented & Tested | Server stamps `reviewedBy` (actor userId), `reviewedAt` (ISO date), increments `revision`, and retains immutable snapshot data. A returned report reverts to editable status for student resubmission. Tested in `supervisorAndNotifications.test.ts` (Sup-6). |
| **D5** | Supervisor dashboard KPI metrics | Confirmed Implemented & Tested | `GET /api/v1/supervisor/dashboard` aggregates bounded counts for `assignedStudentsCount`, `pendingReviewsCount`, `acknowledgedThisMonthCount`, and `returnedThisMonthCount` alongside the recent review queue. Tested in `supervisorAndNotifications.test.ts` (Sup-9). |
| **D6** | Supervisor review queue with filters & pagination | Confirmed Implemented & Tested | `GET /api/v1/supervisor/queue` supports query filtering by `monthKey`, `status` (`submitted`, `in_review`, `acknowledged`, `returned`), and `studentId` with `limit` and `offset` bounds. Tested in `supervisorAndNotifications.test.ts` (Sup-10). |
| **D7** | Report comparison & review endpoint | Confirmed Implemented & Tested | `GET /api/v1/supervisor/reports/:outcomeId` loads outcome details, student identity, shared monthly plan targets for side-by-side metric comparison, and historical advice threads. Tested in `supervisorAndNotifications.test.ts` (Sup-6). |
| **D8** | Two-way threaded mentorship advice & replies | Confirmed Implemented & Tested | `POST /api/v1/advice/:id/reply` allows students and assigned supervisors to post conversation replies. Unauthorized users are blocked with HTTP 403. Tested in `supervisorAndNotifications.test.ts` (Adv-1, Adv-2). |
| **D9** | In-app notification triggers | Confirmed Implemented & Tested | Submission trigger notifies all assigned supervisors; review action (acknowledged or returned) triggers student notification; advice reply notifies student or supervisor. Tested in `supervisorAndNotifications.test.ts` (Notif-1, Notif-2, Adv-1). |
| **D10** | Notification idempotency & deduplication | Confirmed Implemented & Tested | `createInAppNotification` enforces unique `(orgId, recipientId, idempotencyKey)` to eliminate duplicate alerts from retried operations. Tested in `supervisorAndNotifications.test.ts` (Notif-5). |
| **D11** | Recipient notification management & isolation | Confirmed Implemented & Tested | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, and `POST /api/v1/notifications/read-all` strictly query by `recipientId: req.user.userId`. Students cannot view other users' alerts. Tested in `supervisorAndNotifications.test.ts` (Notif-3, Notif-4). |
| **D12** | Responsive React SPA supervisor & notification UX | Confirmed Implemented | `SupervisorDashboardPage.tsx` (KPI cards, filters, quick queue), `SupervisorReportReviewPage.tsx` (plan vs actual table, conflict recovery button, feedback entry), `NotificationsPage.tsx` (unread indicators, links, mark all read), and header notification badge. |

---

## Phase 5: Printable Reports, Administrative Audit Logs & Database Verification
**Target Milestone:** A4 Print Delivery, Organization Audit Trails & Real DB Verification (PRD PLAN-04, ADMIN-07)
**Status:** Completed (Implemented & Tested)
**Objective:** Deliver a professional A4 printable monthly plan layout, implement a role-governed, org-isolated administrative audit log explorer, and verify database integrity under real MongoDB operations.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **E1** | A4 Monthly Plan printable layout (`PLAN-04`) | Confirmed Implemented & Tested | Added `@page { size: A4 portrait; margin: 12mm 15mm 15mm 15mm; }` in `index.css`. Structured `MonthlyPlanPage.tsx` with dedicated `.print-only` header, org/student/supervisor metadata strip, high-density target tables, notes, supervisor advice history, dual signature blocks, and stripped `.no-print` interactive controls. Verified with manual print preview procedure. |
| **E2** | Structured audit event model | Confirmed Implemented & Tested | Added `AuditEvent` and `AuditEventsResponse` types in `@reportbd/shared` and `auditEvents` collection in MongoDB storing `orgId`, `actorId`, `actorRole`, `action`, `entityType`, `entityId`, `timestamp`, `metadata`, and `correlationId`. |
| **E3** | Server-side audit event logging helper | Confirmed Implemented & Tested | Created `apps/api/src/services/audit.ts` with `logAuditEvent`. Automatically sanitizes and redacts passwords, tokens, API keys, credentials, and truncates large payloads. Safe against logging failures. |
| **E4** | Server-side lifecycle audit event emitters | Confirmed Implemented & Tested | Wired audit event logging on: invitation created (`invitation.created`), invitation revoked (`invitation.revoked`), invitation accepted (`invitation.accepted`), supervisor assigned (`assignment.created`), plan shared (`plan.shared`), report submitted (`report.submitted`), report acknowledged (`review.acknowledged`), report returned (`review.returned`), advice created (`advice.created`), and advice replied (`advice.replied`). |
| **E5** | Bounded audit events query endpoint | Confirmed Implemented & Tested | `GET /api/v1/organization/audit-events` protected by `requireAuth`, `requireActiveMembership`, and `requireRole(['org_admin', 'platform_admin'])`. Validated via `AuditEventsQuerySchema` supporting `from`, `to`, `actorId`, `action`, `entityType`, with pagination `limit` (max 100) and `offset`. |
| **E6** | Organization isolation on audit queries | Confirmed Implemented & Tested | Query strictly enforces `orgId: req.user.orgId`. Cross-tenant audit data leakage is physically prevented at the query level. Tested in `auditAndAdmin.test.ts` (Audit-2) and `realMongoIntegration.test.ts`. |
| **E7** | Administrative audit log explorer UI (`ADMIN-07`) | Confirmed Implemented | Created `AuditLogPage.tsx` with date-range filters, action and entity dropdowns, actor search, action badge color semantics, formatted Bangla timestamps, expandable safe metadata viewer modal, and pagination. Linked in `Sidebar.tsx` and registered at `/organization/audit-log`. |
| **E8** | Safe metadata exposure & credential redaction | Confirmed Implemented & Tested | `logAuditEvent` scrubs `password`, `token`, `secret`, `credential`, `key`, `hash`, `authorization`, `cookie`. Raw report text bodies and invite tokens are never persisted in audit trail. Tested in `auditAndAdmin.test.ts` (Audit-8). |
| **E9** | Real MongoDB database index initialization | Confirmed Implemented & Tested | Updated `initDb.ts` to create compound indexes on `auditEvents`: `(orgId, time: -1)`, `(orgId, action, time: -1)`, `(orgId, entityType, entityId, time: -1)`, `(orgId, actorId, time: -1)`. Upgraded `notifications` compound index to `{ unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }`. Tested idempotency and real index behavior in `realMongoIntegration.test.ts`. |
| **E10** | Real MongoDB concurrency & isolation verification | Confirmed Implemented & Tested | Real MongoDB test harness (`realMongoIntegration.test.ts`) verified against local MongoDB engine (`127.0.0.1:27017`): partial unique index idempotency, atomic conditional review update concurrency conflict rejection (`matchedCount === 0`), and cross-organization audit query isolation. |
| **E11** | Full automated regression suite | Confirmed Implemented & Tested | 64 API tests passing across 6 suites + 5 shared package tests passing. 100% pass rate (69/69 passing tests, 0 failures). |

---

## Phase 6: Production Readiness, CI/CD & Security Hardening
**Target Milestone:** Beta Deployment Preparation, Automated CI, Security & Runbooks
**Status:** Completed (Implemented & Tested)
**Objective:** Prepare ReportBD for controlled beta deployment with automated GitHub Actions CI, multi-layered security hardening, runtime resilience, deployment specifications, and persona acceptance protocols.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **F1** | Sliding-window API rate limiting | Confirmed Implemented & Tested | Built `rateLimiter.ts` middleware with tiered limits: `authRateLimiter` (15 req/15min on `/invitations/:token/accept`), `inviteRateLimiter` (30 req/15min on `/organization/invitations`), `sensitiveOpsLimiter` (60 req/min on `/supervisor/reviews/:outcomeId` and `/organization/audit-events`), and `generalApiLimiter` (300 req/min on `/api/v1`). Includes RFC `Retry-After` headers and bypass in test environments. Tested in `securityHardening.test.ts` (Sec-5). |
| **F2** | Deep recursive audit redaction | Confirmed Implemented & Tested | Enhanced `sanitizeMetadata` in `services/audit.ts` to recursively redact nested structures up to depth 6, scrub keys matching sensitive regex (tokens, credentials, secrets, hashes), and truncate long strings (> 256 chars). Tested in `securityHardening.test.ts` (Sec-1, 2, 3). |
| **F3** | Audit failure observability | Confirmed Implemented & Tested | Implemented `getAuditMetrics()` and `resetAuditMetrics()` tracking `totalLogged`, `totalFailures`, `lastFailureAt`, and `lastFailureReason`. Failed writes log explicit operational error without crashing caller. Tested in `securityHardening.test.ts` (Sec-4). |
| **F4** | Malformed JSON & safe error handling | Confirmed Implemented & Tested | Added `SyntaxError` handler in `errorHandler.ts` returning 400 `INVALID_JSON`. Enforced non-sensitive generic error messages in production mode (`config.isProduction`). Tested in `securityHardening.test.ts` (Sec-6, 7). |
| **F5** | Graceful shutdown & connection draining | Confirmed Implemented & Tested | Implemented `gracefulShutdown` in `apps/api/src/index.ts` intercepting `SIGTERM`, `SIGINT`, `unhandledRejection`, and `uncaughtException`. Closes HTTP server with 10s timeout and safely drains MongoDB client pool via `closeDb()`. |
| **F6** | Startup configuration validation | Confirmed Implemented & Tested | Enforced production checks in `validateStartupConfig()`: rejects `allowDevMockAuth` when true in production and rejects loopback/localhost `MONGODB_URI` (`127.0.0.1`, `localhost`) in production environments. |
| **F7** | Reproducible GitHub Actions CI | Confirmed Implemented & Tested | Created `.github/workflows/ci.yml` matrix with Node 22, `mongo:7.0` container service with ping healthcheck, `npm ci`, shared package tests, `npm run db:init -w apps/api`, full API tests against containerized DB, workspace typecheck, full production build, and `git diff --check`. |
| **F8** | Containerization & Cloud Deployment | Confirmed Implemented | Created multi-stage Alpine `apps/api/Dockerfile` with non-root `USER node` and curl-based `/health` check. Created `apps/web/vercel.json` with SPA catch-all rewrite to `/index.html` and security response headers. Documented `VITE_API_BASE_URL` in `apps/web/.env.example` and `TRUST_PROXY` in `apps/api/.env.example`. |
| **F9** | Deployment guide & operational runbooks | Confirmed Implemented | Published `docs/DEPLOYMENT_GUIDE.md` detailing prerequisites, zero-downtime deployment steps, database initialization (`npm run db:init -w apps/api`), index migration guide, health endpoints (`/health`, `/health/ready`), and emergency rollback runbook. |
| **F10** | Beta UAT & A4 Print Verification Checklist | Confirmed Implemented | Published `docs/BETA_UAT_CHECKLIST.md` defining role-based acceptance criteria for Student, Supervisor, Org Admin, and Platform Admin personas, clearly marking manual browser checks and Chrome A4 print preview as **Pending Human Verification**. |
| **F11** | Full automated regression suite | Confirmed Implemented & Tested | 71 API tests passing across 7 suites + 5 shared package tests passing. 100% pass rate (76/76 passing tests, 0 failures, 0 skipped). |

---

## Phase 7: Beta Validation, Deployment Rehearsal & Release Gate
**Target Milestone:** Beta Readiness Sign-Off & Operational Release Gate
**Status:** Implementation Verified; Beta Validation Pending
**Objective:** Confirm ReportBD technical readiness for a controlled beta deployment through rigorous defect remediation, memory bounds verification, safe integration testing, CI validation, and persona UAT specifications.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **G1** | Non-destructive database drop protection | Confirmed Implemented & Tested | Added strict assertion in `realMongoIntegration.test.ts` requiring database name to explicitly contain `test` before `dropDatabase()` can execute, eliminating accidental data loss on staging/production databases. |
| **G2** | In-memory rate limiter memory cleanup | Confirmed Implemented & Tested | Exported `cleanupExpiredRateLimits(currentTime)` and verified in `securityHardening.test.ts` (Sec-9) that expired request counters are evicted from memory to prevent unbounded memory growth in long-running processes. |
| **G3** | Value-level credential & key redaction | Confirmed Implemented & Tested | Enhanced `sanitizeMetadata` to identify and redact string values containing Bearer tokens or PEM private keys (`BEGIN PRIVATE KEY`) regardless of the property key name. Tested in `securityHardening.test.ts` (Sec-8). |
| **G4** | Targeted integration testing script | Confirmed Implemented & Tested | Added `"test:integration": "tsx --test src/tests/realMongoIntegration.test.ts"` in `apps/api/package.json` to allow isolated execution of real database verification without test-file glob duplication. |
| **G5** | CI commit/PR diff whitespace check | Confirmed Implemented & Tested | Updated `.github/workflows/ci.yml` to check whitespace formatting across the actual changes introduced by pull requests (`origin/${{ github.base_ref }}...HEAD`) or commits (`${{ github.event.before }}...${{ github.sha }}`). |
| **G6** | Reverse proxy topology & architecture runbook | Confirmed Implemented | Formally documented reverse proxy topology options (`TRUST_PROXY=true` for Cloud Run / ALB / Cloudflare, `false` for direct exposure), single-process in-memory limiter boundaries, and zero-downtime rollback runbooks in `docs/DEPLOYMENT_GUIDE.md`. |
| **G7** | Expanded persona UAT scenarios | Confirmed Implemented | Added concurrent daily editing conflict recovery (`UAT-STU-07`), concurrent supervisor review rejection (`UAT-SUP-05`), and invitation generation rate limiting (`UAT-ADM-05`) in `docs/BETA_UAT_CHECKLIST.md`. |
| **G8** | Comprehensive automated regression suite | Confirmed Implemented & Tested | 73 API tests passing across 7 suites + 5 shared package tests passing. 100% pass rate (78/78 passing tests, 0 failures, 0 skipped). |
| **G9** | Release Gate Decision | **Implementation Verified; Beta Validation Pending** | All automated quality gates, security sanitization, and configuration rules pass. Local Docker build is documented as unverified due to local daemon unavailability; physical A4 printout checks and manual browser UI tests remain explicitly pending human verification. |

---

## Phase 8: Release-Gate Closure & Beta Readiness
**Target Milestone:** Release-Gate Closure & Operational Hand-Off
**Status:** Beta Deployment Candidate
**Objective:** Close all technical release gates, resolve build and containerization defects with evidence, verify real Docker startup and healthcheck, harden database safety guards, audit CI workflows, and prepare human UAT execution protocols.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **H1** | Strict test database allowlist guard | Confirmed Implemented & Tested | Replaced substring matching in `realMongoIntegration.test.ts` with explicit `ALLOWED_TEST_DB_NAMES` set. Protects production, staging, and development databases from accidental destructive drops. Verified in `npm run test:integration -w apps/api`. |
| **H2** | Fail-fast integration test connectivity | Confirmed Implemented & Tested | `realMongoIntegration.test.ts` asserts connectivity immediately and throws on failure when `FAIL_ON_UNAVAILABLE_MONGO=true` or `CI=true`. Verified locally. |
| **H3** | CI workflow harmonization & diff validation | Confirmed Implemented & Tested | Updated `.github/workflows/ci.yml` with `MONGODB_DB_NAME: reportbd_test_ci`, `TEST_DB_NAME: reportbd_test_ci`, added `reportbd_test_ci` to the test allowlist, and hardened PR base ref diff checks. |
| **H4** | Docker container build defect remediation | Confirmed Implemented & Tested | Corrected multi-stage `apps/api/Dockerfile` runner stage to use `--from=builder --chown=node:node /app/...`. Copied workspace `apps/api/node_modules` and symlinked `packages/shared/node_modules` to resolve ESM runtime dependencies. Expanded `.dockerignore` to recursively block `.env` and service account credentials. |
| **H5** | Live Docker container execution & health check | Confirmed Implemented & Tested | Successfully built `reportbd-api:beta-test`, ran container, and verified HTTP 200 response on `GET /health` (`{"status":"ok","service":"reportbd-api"}`). Verified execution as non-root user `node`. |
| **H6** | Web app React-Query and Header membership guard | Confirmed Implemented & Tested | Wrapped root component tree with `QueryClientProvider` and added active membership guard (`!!user.orgId && user.roles.length > 0`) in `Header.tsx` to prevent 403 Forbidden query errors for unassigned users. |
| **H7** | Comprehensive regression suite & production build | Confirmed Implemented & Tested | 78 tests passing across 8 suites (5 shared, 73 API, 0 failures, 0 skipped). Monorepo typecheck passed cleanly (`tsc --noEmit`). Production builds succeeded across all workspaces (`packages/shared`, `apps/api`, `apps/web`). `git diff --check` passed cleanly. |
| **H8** | Operational runbook & human UAT handoff | Confirmed Implemented | `docs/BETA_UAT_CHECKLIST.md` and `docs/DEPLOYMENT_GUIDE.md` updated with exact persona test accounts, step-by-step Chrome A4 print verification, and first remote GitHub Actions run manual verification steps. |
| **H9** | Release Decision | **Beta Deployment Candidate** | All technical pre-deployment gates (code, tests, build, typecheck, Docker, security) pass with observable evidence. Actual remote GitHub Actions execution, live cloud deployment, and human exploratory browser/print UAT remain pending authorized human verification. |

---

## Phase 9: Pre-Deployment Verification & Beta Handoff
**Target Milestone:** Technical Verification Gap Resolution & Authorized Beta Handoff
**Status:** Beta Deployment Candidate
**Objective:** Resolve technical verification gaps, correct test count discrepancies, harden connection-level MongoDB test safety, verify production Docker runtime behavior, revalidate CI/build gates, and prepare an uncompromised release evidence record for authorized deployment.

### Scope Checklist & Acceptance Criteria
| Item | Requirement | Status | Evidence / Verification |
|---|---|---|---|
| **J1** | Reconcile test evidence and test count discrepancy | Confirmed Implemented & Tested | Derived exact breakdown: 79 unique monorepo tests (5 in `@reportbd/shared`, 74 in `@reportbd/api`). Confirmed that the Phase 8 discrepancy (78 reported vs 82 executed) was caused by running both `npm test -w apps/api` and `npm run test:integration -w apps/api`, which executed the 4 integration tests twice. Unique count is now 79 with the added safety test. All 79 pass with 0 failures, 0 skipped. |
| **J2** | Harden MongoDB integration test target safety | Confirmed Implemented & Tested | Added `assertSafeIntegrationTarget(uri, dbName, nodeEnv)` in `realMongoIntegration.test.ts` before connection or drop: strictly rejects `NODE_ENV=production`, unapproved database names, and remote clusters (`mongodb+srv://`, non-local/non-container IPs). Sanitizes connection credentials in logs (`***:***`). |
| **J3** | Non-destructive validation of target safety guard | Confirmed Implemented & Tested | Added `RealMongo-0` subtest validating rejection of production mode, remote clusters, unapproved DB names, and invalid URIs without connecting to or mutating any database. |
| **J4** | Verify Docker production image build & non-root user | Confirmed Implemented & Tested | Rebuilt image `reportbd-api:phase9` via multi-stage Dockerfile. Verified container runtime user is non-root `node` (`docker run --rm reportbd-api:phase9 whoami` -> `node`). Verified no secrets or `.env` files present in container. |
| **J5** | Verify Docker production configuration rejection | Confirmed Implemented & Tested | Confirmed that starting container with `NODE_ENV=production` and missing required variables or `ALLOW_DEV_MOCK_AUTH=true` immediately throws validation error and exits with non-zero code. |
| **J6** | Verify Docker container runtime health & readiness | Confirmed Implemented & Tested | Ran container with valid test configuration connecting to containerized MongoDB. Verified `GET /health` returns HTTP 200 `{ status: "ok", service: "reportbd-api" }` and `GET /health/ready` returns HTTP 200 `{ status: "ready", database: "connected" }`. Container health check reported `healthy`. |
| **J7** | Revalidate CI, typecheck, production build, and whitespace gates | Confirmed Implemented & Tested | Ran `npm run typecheck` (all workspaces clean), `npm run build` (shared, API, and web Vite bundle clean), and `git diff --check` (0 whitespace errors). Audited `.github/workflows/ci.yml`. |
| **J8** | Verify deployment architecture and runtime settings | Confirmed Implemented | Verified that reverse-proxy trust (`TRUST_PROXY`), single-process in-memory rate limits, Vercel SPA rewrites (`vercel.json`), and Firebase Admin credentials align with documented architecture in `docs/DEPLOYMENT_GUIDE.md`. |
| **J9** | Prepare human UAT & A4 print handoff protocols | Confirmed Implemented | `docs/BETA_UAT_CHECKLIST.md` verified with Student, Supervisor, Org Admin, and Platform Admin flows. All accounts confirmed as synthetic dev-only seeded accounts. Manual browser UI and Chrome A4 print checks remain explicitly marked **Pending Human Verification**. |
| **J10** | Release Gate Decision | **Beta Deployment Candidate** | All technical gates, container checks, and automated tests passed with direct evidence. Remote GitHub Actions run, live cloud deployment, and human UAT remain pending authorized execution. Nothing pushed or deployed. |
