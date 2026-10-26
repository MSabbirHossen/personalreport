# Report-BPS — Security Findings & Remediation Log

**Audit Date:** 2026-10-24  
**Audit Scope:** Full codebase audit covering `apps/api`, `apps/web`, `packages/shared`, configuration, and Firebase rules.  
**Phase Status:** Remediated & Verified

---

## High & Critical Vulnerabilities & Remediation Record

### 1. Hard-Coded Authentication Bypass (`mock-token`)
- **Severity:** Critical
- **Location:** `apps/api/src/middleware/auth.ts` (formerly lines 58-62, 90)
- **Vulnerability:** The string `"mock-token"` was hard-coded in the primary authentication middleware, granting instant access as `mock_user_123` with student roles without any signature or identity verification.
- **Impact:** Anyone could bypass authentication in any environment by sending `Authorization: Bearer mock-token`.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Removed the production bypass. Mock token is only evaluated if `config.allowDevMockAuth` is explicitly true (strictly guarded by `!config.isProduction && process.env.ALLOW_DEV_MOCK_AUTH === 'true'`).
- **Verification Evidence:** `Gate 2: mock-token cannot authenticate in production or when allowDevMockAuth is false` in `apps/api/src/tests/authAndSecurity.test.ts`.

---

### 2. Unverified JWT Decode-Only Token Forgery
- **Severity:** High
- **Location:** `apps/api/src/middleware/auth.ts` (formerly lines 68-87)
- **Vulnerability:** When Firebase token verification failed, the middleware decoded the base64url payload without verifying cryptographic signatures.
- **Impact:** Attackers could forge an unsigned JWT containing arbitrary `sub`, `email`, and `aud` to impersonate any user.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Completely removed the base64 decode fallback. Tokens must be verified by Firebase Admin SDK (`verifyIdToken`).
- **Verification Evidence:** `Gate 1: Missing, malformed, expired, and invalid tokens are rejected with 401` in `apps/api/src/tests/authAndSecurity.test.ts`.

---

### 3. Arbitrary String Accepted as Identity Key
- **Severity:** High
- **Location:** `apps/api/src/middleware/auth.ts` (formerly lines 88-93)
- **Vulnerability:** When Firebase Admin was not initialized, any arbitrary bearer token string was directly accepted as `firebaseUid`.
- **Impact:** Complete spoofing of accounts without credentials.
- **Remediation Status:** **Resolved**.
- **Fix Details:** If Firebase Admin is uninitialized in production, requests are rejected with a 500 `AUTH_MISCONFIGURED` error. Startup validation (`validateStartupConfig`) fails closed if credentials are missing in production.

---

### 4. Silent Privilege Grant and Default Tenant Assignment
- **Severity:** High
- **Location:** `apps/api/src/middleware/auth.ts` (formerly lines 126-133)
- **Vulnerability:** If a user had no active membership in MongoDB, the code assigned `roles = ['student']` and `orgId = 'org_default'`.
- **Impact:** Violated tenant isolation. Any newly registered Firebase user was automatically granted access to the default organization's data pool.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Removed fallback defaults. If no active membership exists, `orgId` and `roles` remain empty. Added `requireActiveMembership` middleware on all organization routes (`/templates`, `/daily-reports`, `/monthly-plans`, `/monthly-outcomes`, `/advice`, `/supervisor`, `/organization`).
- **Verification Evidence:** `Gate 3: Identity without active membership cannot access protected organization endpoints` in `apps/api/src/tests/authAndSecurity.test.ts`.

---

### 5. Suspended and Disabled Account Bypass
- **Severity:** Medium / High
- **Location:** `apps/api/src/middleware/auth.ts` (formerly lines 104-122)
- **Vulnerability:** The middleware did not verify `userRecord.status === 'active'`.
- **Impact:** Suspended or banned users could still make authenticated requests if they had a valid Firebase session.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Explicitly checks `userRecord.status === 'active'` in `requireAuth` and returns 403 `ACCOUNT_SUSPENDED`.
- **Verification Evidence:** `Gate 4: Suspended or deactivated accounts are denied access with 403` in `apps/api/src/tests/authAndSecurity.test.ts`.

---

### 6. Database Connection Failures Masquerading as Invalid Tokens
- **Severity:** Medium
- **Location:** `apps/api/src/middleware/auth.ts` (formerly line 145)
- **Vulnerability:** All errors thrown within `requireAuth`, including MongoDB driver timeouts and disconnections, were caught and returned as `401 INVALID_TOKEN`.
- **Impact:** Misleading client errors and obscured operational outages.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Separated token verification `try/catch` from database query `try/catch`. DB errors return 503 `DATABASE_UNAVAILABLE`.
- **Verification Evidence:** `Gate 8: Database failure produces 503 DATABASE_UNAVAILABLE, not 401 INVALID_TOKEN` in `apps/api/src/tests/authAndSecurity.test.ts`.

---

### 7. Insecure CORS Configuration with Credentials
- **Severity:** Medium
- **Location:** `apps/api/src/app.ts` and `apps/api/src/config/index.ts`
- **Vulnerability:** `config.corsOrigin === '*'` resulted in `origin: true` being passed to `cors()`, reflecting any request origin while allowing `credentials: true`.
- **Impact:** Insecure cross-origin access in production.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Added origin callback in `corsOptions`. In production, only origins explicitly listed in `config.cors.allowedOrigins` are permitted; wildcards and unapproved origins are rejected with 403 `CORS_FORBIDDEN`.
- **Verification Evidence:** `Gate 10: Production CORS policy rejects unapproved origins` in `apps/api/src/tests/authAndSecurity.test.ts`.

---

### 8. Unchecked Supervisor Review Authorization
- **Severity:** Medium
- **Location:** `apps/api/src/routes/supervisor.ts`
- **Vulnerability:** `POST /api/v1/supervisor/reviews/:outcomeId` updated monthly outcome records matching `{ _id, orgId }` without confirming whether the supervisor is actively assigned to that student.
- **Impact:** Any supervisor within an organization could alter or review reports of students assigned to other mentors.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Added assignment query in `supervisorAssignments` checking `{ orgId, supervisorId, studentId: outcome.studentId, status: 'active' }`. If not assigned (and not `org_admin`), returns 403 `FORBIDDEN`.
- **Verification Evidence:** `Gate 7: Supervisor cannot review or alter reports of an unassigned student` in `apps/api/src/tests/authAndSecurity.test.ts`.

---

### 9. Environment File Tracking in `.gitignore`
- **Severity:** Low / Operational
- **Location:** `.gitignore`
- **Vulnerability:** Broad `.env.*` rule prevented `.env.example` templates from being committed.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Added `!.env.example` to `.gitignore`. Real `.env`, `.env.local`, and `*firebase-service-account*.json` remain strictly ignored.

---

### 10. Daily Reporting & Monthly Plan Concurrent Overwrites (Race Condition)
- **Severity:** Medium / Data Integrity
- **Location:** `apps/api/src/routes/dailyReports.ts`, `apps/api/src/routes/monthlyPlans.ts`
- **Vulnerability:** Blind `updateOne` with `$set` would allow a client with stale values to overwrite a newer revision submitted from another browser session or device.
- **Impact:** Silently lost student reporting corrections or goals.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Implemented revision-based optimistic concurrency. Queries include `{ revision: existing.revision }`. If `matchedCount === 0`, update fails and returns HTTP 409 `CONFLICT` alongside `serverRevision`.
- **Verification Evidence:** `Daily-3`, `Daily-4`, `Plan-2` in `apps/api/src/tests/studentReportingAndOutcomes.test.ts`.

---

### 11. Retroactive Mutation of Submitted Monthly Outcome Records
- **Severity:** Medium / Auditability
- **Location:** `apps/api/src/routes/monthlyOutcomes.ts`, `apps/api/src/routes/dailyReports.ts`
- **Vulnerability:** If daily reports were modified after a student submitted their monthly outcome, historical calculations viewed by the supervisor would silently drift, undermining review integrity.
- **Impact:** Reports acknowledged by supervisors would not reflect the actual numbers evaluated during mentorship.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Submission freezes a complete immutable snapshot (`snapshot.derivedValues`, `dailyValuesSummary`, `dailyReportsCount`, timestamp). Modifying a daily report for that period leaves the submitted snapshot intact and flags `isStale: true` with audit reason and timestamp.
- **Verification Evidence:** `Outcome-1`, `Outcome-2`, `Outcome-3` in `apps/api/src/tests/studentReportingAndOutcomes.test.ts`.

---

### 12. Supervisor Concurrent Review Action Race Condition
- **Severity:** High / Concurrency & Auditability
- **Location:** `apps/api/src/routes/supervisor.ts`
- **Vulnerability:** Unsynchronized read-then-write updates allowed two concurrent supervisor requests (or double-clicks) to simultaneously review a report. One could acknowledge while another returned, silently overwriting status, feedback, and review audit metadata.
- **Impact:** Inconsistent review lifecycle state, corrupted audit trail, and duplicate/conflicting advice records.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Implemented conditional atomic updates in MongoDB `updateOne` filtering on `{ _id, orgId, status: { $in: ['submitted', 'in_review'] }, revision: expectedRevision }`. If another review action resolved first, the query fails with `matchedCount === 0`. The handler performs a post-check and responds with HTTP 409 `ALREADY_REVIEWED` or `CONFLICT`.
- **Verification Evidence:** `Sup-4` and `Sup-5` in `apps/api/src/tests/supervisorAndNotifications.test.ts`.

---

### 13. Notification Cross-Tenant Disclosure & Duplication via Insecure Recipient Injection
- **Severity:** High / Access Control & Integrity
- **Location:** `apps/api/src/routes/notifications.ts`, `apps/api/src/services/notifications.ts`
- **Vulnerability:** Client-supplied recipient parameters or unscoped notification queries could allow malicious actors to inject notifications into other users' feeds or read private notifications belonging to other students/supervisors. Furthermore, network retries could generate unbounded duplicate notifications.
- **Impact:** Cross-student information disclosure and notification flooding.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Notification recipients are strictly determined on the server from verified database relationships (`supervisorAssignments` and `monthlyOutcomes.userId`). Notification read/query endpoints enforce `recipientId: req.user.userId`. Idempotent delivery uses compound unique partial indexing on `(orgId, recipientId, idempotencyKey)` to drop duplicate deliveries gracefully.
- **Verification Evidence:** `Notif-3`, `Notif-4`, and `Notif-5` in `apps/api/src/tests/supervisorAndNotifications.test.ts`.

---

### 14. Sensitive Credential Exposure in System Audit Trails & Client Audit Forgery
- **Severity:** High / Confidentiality & Integrity
- **Location:** `apps/api/src/services/audit.ts`, `apps/api/src/routes/organization.ts`
- **Vulnerability:** Unfiltered audit logging can capture authorization tokens, invitation crypto keys, passwords, or private report content in metadata blobs. Furthermore, trusting client-submitted audit records allows malicious users to falsify administrative actions or cover their tracks.
- **Impact:** Permanent disclosure of sensitive secrets in audit logs; corrupted forensic evidence.
- **Remediation Status:** **Resolved**.
- **Fix Details:**
  1. Audit events are strictly generated server-side within authenticated service and route handlers; no client endpoint exists to inject or mutate audit events.
  2. The `logAuditEvent` helper automatically scans and redacts sensitive field names (`password`, `token`, `secret`, `credential`, `key`, `hash`, `authorization`, `cookie`, etc.), replacing values with `"[REDACTED]"`.
  3. String values are capped at 500 characters to prevent audit-log bloat attacks.
  4. Audit logs are strictly immutable: no endpoints exist for administrators to update or delete audit records.
  5. Cross-organization leakage is physically blocked by forcing `orgId: req.user.orgId` in `GET /api/v1/organization/audit-events`.
- **Verification Evidence:** `Audit-2`, `Audit-8` in `apps/api/src/tests/auditAndAdmin.test.ts`.

---

### 15. Compound Unique Sparse Index Null-Collision Flaw in MongoDB Deduplication Engine
- **Severity:** Medium / Reliability & Data Integrity
- **Location:** `apps/api/src/scripts/initDb.ts`, `apps/api/src/services/notifications.ts`
- **Vulnerability:** In MongoDB, a compound unique index with `{ unique: true, sparse: true }` over `(orgId, recipientId, idempotencyKey)` will still index documents where `idempotencyKey` is missing or `null` if `orgId` and `recipientId` are present. This causes the second notification without an idempotency key to be rejected with `E11000 duplicate key error collection: reportbd.notifications index: org_recipient_idempotency_uniq dup key: { orgId: "...", recipientId: "...", idempotencyKey: null }`.
- **Impact:** Ordinary system notifications without idempotency keys crashed or dropped subsequent messages for the same recipient.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Upgraded the index definition in `initDb.ts` from `{ sparse: true }` to `{ unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }`. MongoDB now only enforces uniqueness when `idempotencyKey` is an actual string, allowing multiple standard notifications per recipient while strictly deduplicating idempotent operations.
- **Verification Evidence:** Verified against a live MongoDB engine in `apps/api/src/tests/realMongoIntegration.test.ts`.

---

### 16. Unbounded API Consumption & Abuse Vectors on Sensitive Endpoints
- **Severity:** High / Availability & Anti-Abuse
- **Location:** `apps/api/src/middleware/rateLimiter.ts`, `apps/api/src/routes/`
- **Vulnerability:** Endpoints responsible for invite acceptance, organization invitation dispatch, supervisor outcome reviews, and administrative audit queries lacked request-rate limiting. An attacker could brute-force invitation tokens, spam email invitations, trigger Denial-of-Service via unbounded audit scans, or flood review submissions.
- **Impact:** Service degradation, invitation brute-forcing, resource exhaustion, and spam abuse.
- **Remediation Status:** **Resolved**.
- **Fix Details:**
  1. Implemented a zero-dependency in-memory sliding-window rate limiter with automated memory cleanup.
  2. Configured strict tiering: `authRateLimiter` (15 req/15min on token acceptance), `inviteRateLimiter` (30 req/15min on invitation creation), `sensitiveOpsLimiter` (60 req/min on review submission and audit log queries), and `generalApiLimiter` (300 req/min on `/api/v1`).
  3. When limit is exceeded, responds with HTTP 429 `TOO_MANY_REQUESTS` and RFC-compliant `Retry-After` header.
  4. Supports `trust proxy` configuration via `config.trustProxy` to avoid spoofed client IP headers when behind a trusted reverse proxy.
- **Verification Evidence:** `Sec-5: Sliding window rate limiter enforces request limits and returns 429` in `apps/api/src/tests/securityHardening.test.ts`.

---

### 17. Shallow Audit Metadata Sanitization & Unobserved Audit Logging Failures
- **Severity:** Medium / Audit Reliability & Compliance
- **Location:** `apps/api/src/services/audit.ts`
- **Vulnerability:** Metadata sanitization was previously shallow (only iterating top-level object keys). Sensitive credentials or private tokens nested within inner objects or arrays would not be detected and could be written to the database. Additionally, database write errors during audit logging were caught and logged to console, but gave operators no programmatic visibility into failure rates or operational degradation.
- **Impact:** Potential leakage of deeply nested credentials; silent degradation of security audit logging without alerting.
- **Remediation Status:** **Resolved**.
- **Fix Details:**
  1. Enhanced `sanitizeMetadata` to recursively sanitize nested objects and arrays up to depth 6, truncating strings > 256 characters and replacing sensitive keys with `"[REDACTED]"`.
  2. Implemented operational metrics tracking (`getAuditMetrics()`) with `totalLogged`, `totalFailures`, `lastFailureAt`, and `lastFailureReason` for operational monitoring and health alerting.
- **Verification Evidence:** `Sec-1`, `Sec-2`, `Sec-3`, and `Sec-4` in `apps/api/src/tests/securityHardening.test.ts`.

---

### 18. Value-Level Token and Key Disclosure via Arbitrary Metadata Key Names
- **Severity:** Medium / Data Confidentiality
- **Location:** `apps/api/src/services/audit.ts`
- **Vulnerability:** Sanitization regex only checked whether object property *names* matched sensitive patterns (e.g. `password`, `token`, `key`). If a caller stored an authorization header or TLS private key in an arbitrarily named property (e.g. `rawHeader`, `note`, `authValue`), the value was persisted unredacted.
- **Impact:** Potential forensic leakage of sensitive authentication headers or private keys into database audit storage.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Added value-level string pattern detection in `sanitizeMetadata`: any string value prefixed with `Bearer ` or containing `BEGIN PRIVATE KEY` / `BEGIN RSA PRIVATE KEY` is automatically replaced with `"[REDACTED]"` regardless of the key name.
- **Verification Evidence:** `Sec-8: sanitizeMetadata redacts secret-like values (Bearer tokens, PEM keys) under non-sensitive keys` in `apps/api/src/tests/securityHardening.test.ts`.

---

### 19. Memory Accumulation in In-Memory Rate Limiting Bucket Store
- **Severity:** Low / Operational Resilience
- **Location:** `apps/api/src/middleware/rateLimiter.ts`
- **Vulnerability:** High request volumes from distinct IP addresses or users could cause in-memory rate limiting Map size to grow indefinitely if expired window entries were not proactively deleted.
- **Impact:** Gradual memory bloat over extended server uptime under distributed scanning or user load.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Implemented automated periodic garbage collection running every 5 minutes (`cleanupInterval.unref()`), plus exported `cleanupExpiredRateLimits(currentTime)` to evict expired bucket records deterministically.
- **Verification Evidence:** `Sec-9: cleanupExpiredRateLimits evicts expired bucket entries preventing unbounded memory growth` in `apps/api/src/tests/securityHardening.test.ts`.

---

### 20. Permissive Substring Matching on Destructive Test Database Cleanup
- **Severity:** Medium / Data Loss Prevention
- **Location:** `apps/api/src/tests/realMongoIntegration.test.ts`
- **Vulnerability:** `testDbName.toLowerCase().includes('test')` permitted any database containing the substring `"test"`. A misconfigured environment variable (e.g. `TEST_DB_NAME=production_test_backup` or `test_prod`) could have targeted sensitive non-test databases for destructive `dropDatabase()` execution.
- **Impact:** Accidental data loss on non-isolated databases.
- **Remediation Status:** **Resolved**.
- **Fix Details:** Replaced substring check with a strict allowlist of explicitly approved test database names (`ALLOWED_TEST_DB_NAMES`). Verifies both configured name and connected database name (`db.databaseName`) against the allowlist before any destructive drops in `before()` and `after()`.
- **Verification Evidence:** Tested and verified in `npm run test:integration --workspace apps/api`.

---

### 21. Multi-Stage Dockerfile Missing Builder Context & Workspace Dependency Resolution
- **Severity:** High / Container Availability
- **Location:** `apps/api/Dockerfile`, `.dockerignore`
- **Vulnerability:**
  1. The runner stage in `apps/api/Dockerfile` used `COPY --chown=node:node` without `--from=builder` and `/app/` paths, causing Docker build failures because `dist` and `node_modules` were ignored by `.dockerignore`.
  2. Npm workspaces in Node 22 placed hoisted dependencies into `apps/api/node_modules`, causing runtime ESM module resolution failure (`ERR_MODULE_NOT_FOUND: Cannot find package 'express'` and `'zod'`) on container startup.
  3. `.dockerignore` lacked recursive patterns (`**/.env*`, `**/*firebase-service-account*.json`) to prevent sensitive development files from entering the Docker build context.
- **Impact:** Broken container build pipeline and container crash loop on container startup.
- **Remediation Status:** **Resolved**.
- **Fix Details:**
  1. Updated `COPY` commands in runner stage with `--from=builder --chown=node:node /app/...`.
  2. Copied both root `node_modules` and workspace `apps/api/node_modules`, and established workspace symlink `ln -s /app/apps/api/node_modules /app/packages/shared/node_modules` for ESM resolution.
  3. Expanded `.dockerignore` to recursively exclude `**/.env*`, `**/*firebase-service-account*.json`, `**/*.pem`, and `**/*.key`.
- **Verification Evidence:** Container successfully built (`reportbd-api:beta-test`), executed with Docker, and responded with HTTP 200 on `/health`.

---

### 22. Target Environment & Remote Cluster Protection in Integration Test Harness
- **Severity:** High / Target Safeguarding & Credential Sanitization
- **Location:** `apps/api/src/tests/realMongoIntegration.test.ts`
- **Vulnerability:** While an allowlist for test database names was introduced in Phase 8, the test runner did not guard against execution under `NODE_ENV=production` and did not evaluate connection URIs. If configured with a remote cluster URI (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/reportbd_test_phase9`), tests could have connected to or executed drop commands against remote cloud infrastructure. Furthermore, unhandled connection failure logs risked exposing embedded database credentials in terminal logs or CI artifacts.
- **Impact:** Risk of executing destructive testing operations against remote cloud databases; credential exposure in test logs.
- **Remediation Status:** **Resolved**.
- **Fix Details:**
  1. Implemented `assertSafeIntegrationTarget(uri, dbName, nodeEnv)` in `realMongoIntegration.test.ts`. The guard fails closed before any database connection attempt:
     - Rejects `NODE_ENV === 'production'`.
     - Validates that `dbName` matches `ALLOWED_TEST_DB_NAMES`.
     - Rejects remote protocols (`mongodb+srv://`).
     - Restricts permitted hosts strictly to local development and test container network endpoints (`localhost`, `127.0.0.1`, `host.docker.internal`, or CI host).
  2. Implemented `sanitizeMongoUri(uri)` to strip embedded username and password credentials (`mongodb://***:***@...`) before logging target connection URIs.
  3. Added subtest `RealMongo-0` confirming that attempts to target `NODE_ENV=production`, remote clusters, unapproved DB names, or empty configurations are rejected immediately without connecting.
- **Verification Evidence:** `RealMongo-0: target safety guards reject production, remote clusters, unapproved DB names, and sanitize credentials` passed in `apps/api/src/tests/realMongoIntegration.test.ts`.
