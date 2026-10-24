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
