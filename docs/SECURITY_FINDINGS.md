# ReportBD — Security Findings & Remediation Log

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
- **Fix Details:** Notification recipients are strictly determined on the server from verified database relationships (`supervisorAssignments` and `monthlyOutcomes.userId`). Notification read/query endpoints enforce `recipientId: req.user.userId`. Idempotent delivery uses compound unique sparse indexing on `(orgId, recipientId, idempotencyKey)` to drop duplicate deliveries gracefully.
- **Verification Evidence:** `Notif-3`, `Notif-4`, and `Notif-5` in `apps/api/src/tests/supervisorAndNotifications.test.ts`.
