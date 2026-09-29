# Personal Reporting Platform — Product Requirements Document

**Version:** 1.0  
**Date:** 28 September 2026  
**Status:** Build-ready proposal; stakeholder validation required for unobserved roles  
**Working name:** ReportBD (replace before public launch if needed)  
**Owner:** Md. Sabbir Hossen

## 1. Executive summary

Build a Bangla-first, mobile-friendly personal reporting platform for students and their supervisors. A student sets a monthly plan, records daily activities, reviews an aggregated monthly report, and receives supervisor advice. Organization administrators manage people, assignments, reporting templates, and oversight. Platform administrators operate the service across organizations. The application must have a polished, interactive interface that makes a dense reporting system practical on phones as well as desktops.

The initial deployment uses **MongoDB, Express, React, Node.js (MERN)**, **Firebase Authentication** for email/password and Google sign-in, **MongoDB Atlas Free**, **Vercel** for the React frontend and Express API, and **GitHub** for version control and CI. This is a no-cost **personal, noncommercial pilot** subject to each provider's limits and terms. A wider or commercial rollout requires reassessing hosting, quotas, operational support, and privacy obligations.

### Evidence boundary

The student account on MyReportBD was inspected. Its observed routes are daily report grid, profile, monthly plan, monthly report, detailed report, mentors, followers, and advice. The supervisor, organization admin, platform admin, analytics, configurable templates, notifications, and mobile interactions in this PRD are **proposed requirements**, not claims that those MyReportBD screens exist. Exact source-site saving, calculations, and populated mentor actions were not verified. Product acceptance is based on this PRD after stakeholder approval, not presumed source-site parity.

## 2. Goals, users, and success measures

### Goals

1. Let a student finish an ordinary day's report on a phone in under three minutes after onboarding.
2. Preserve the core monthly planning, daily entry, monthly outcome, detailed report, and mentorship cycle.
3. Give supervisors useful review and advice tools without allowing them to rewrite student entries.
4. Give an organization control of its membership, assignments, metric definitions, and reporting rules.
5. Provide accurate, reproducible aggregates and printable reports, with a clear distinction between measured, self-reported, and manually entered values.
6. Keep each organization's records isolated and make sensitive access auditable.

### Pilot success measures

| Measure | Target for pilot | Measurement |
|---|---:|---|
| Student activation | 80% of invited students save a daily entry within seven days | Auth + saved-entry events |
| Daily entry completion | Median active entry session under three minutes | Privacy-conscious timing events |
| Monthly plan completion | 70% of active students create a plan | Plans / active students |
| Supervisor review | 80% of submitted monthly reports reviewed within seven days | Submission/review timestamps |
| Data correctness | Zero unexplained mismatch between daily totals and derived monthly values in acceptance fixtures | Automated aggregation tests |
| Reliability | 99% successful authenticated save requests during pilot | API monitoring |

These are pilot targets, not guarantees. Do not use public student rankings or a single composite morality/performance score.

### Personas

| Role | Primary job | Scope |
|---|---|---|
| Student | Plan, enter, reflect, share, read advice | Own account and permitted shared records |
| Supervisor / mentor | Review assigned students, advise, follow up | Current assigned students; historical access defined by policy |
| Organization admin | Manage members, assignments, templates, and oversight | One organization |
| Platform admin | Provision organizations and maintain the service | Platform operations, with exceptional access logged |
| Guardian / observer | Read explicitly shared summaries | Optional post-V1 role |

One Firebase user can hold multiple organization-scoped roles. No client-side role claim alone grants access.

## 3. Scope and release boundaries

**V1 pilot:** authentication; organization invitation and onboarding; student profile; daily reporting; monthly plan; monthly outcome; detailed report and print; supervisor assignments, reviews, advice; minimal organization admin; Bangla UI and responsive design; audit trail; CI and deployed pilot.

**V1.1:** configurable template editor with preview and versioning; richer charts; CSV/PDF export; notifications; bulk import; enhanced accessibility and keyboard grid editing.

**V2 candidates:** guardian portal, offline drafts/PWA, multi-organization platform self-service, localized English UI, advanced cohort analytics, scheduled reminders, and optional AI summaries subject to separate privacy review.

**Out of scope for V1:** payments, public social feed, direct messaging, student-to-student ranking, automated grading of religious practice, arbitrary file uploads, full academic ERP, and an AI assistant.

## 4. Functional requirements

Priority: **P0** launch-critical, **P1** next release, **P2** later. Each requirement must be verifiable in a test or review.

### 4.1 Authentication and onboarding

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| AUTH-01 | Firebase email/password and Google sign-in | P0 | Both providers can create/sign in a test user; account linking avoids duplicate profiles for the same verified identity. |
| AUTH-02 | Email verification and password reset | P0 | Unverified email policy is enforced; reset is handled by Firebase without storing passwords in MongoDB. |
| AUTH-03 | Invite-based organization join | P0 | A verified user can accept a valid, expiring invitation; cannot self-assign a supervisor/admin role. |
| AUTH-04 | First-login profile completion | P0 | User supplies required name, organization context, and consent/notice acknowledgments; can resume incomplete onboarding. |
| AUTH-05 | Session and revocation handling | P0 | API validates Firebase ID tokens; suspended users and revoked sessions lose protected access. |
| AUTH-06 | Google sign-in errors | P0 | Popup blocked, canceled, existing-account/provider collision, and network failures produce actionable messages. |

The browser sends a Firebase ID token to the API in an Authorization header. The Express API verifies it with Firebase Admin SDK, maps the `uid` to a MongoDB user, then checks organization-scoped roles and resource ownership. Firebase is the authentication authority; MongoDB stores profiles, roles, assignments, and reports. Never put Firebase service-account credentials in the frontend or repository.

### 4.2 Student profile

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PROF-01 | View/edit permitted profile fields | P0 | Name, current education, and photo are editable; branch, responsibility, and membership level follow organization approval rules. |
| PROF-02 | Membership level | P0 | Seed categories include সাধারণ ছাত্র, সমর্থক, কর্মী, সাথী, সাথীপার্থী, সদস্য, সদস্যপার্থী; organization may relabel or disable. |
| PROF-03 | Security settings | P0 | Password change/recovery remains a separate Firebase flow; no password stored or logged by the API. |
| PROF-04 | Sharing status | P0 | Student can see active supervisor, follower permissions, and what each role can view. |

Profile photos are optional for V1; if included, use a provider with an explicit free allowance or a small-image storage policy and account for upload cost. Do not store base64 photos in the Atlas database.

### 4.3 Daily reporting

Observed source pattern: month picker, one date row per day, many columns, numeric/time/checkbox controls, and month totals.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| DAY-01 | Choose month and date | P0 | Correct number of dates and local day labels display; timezone is organization-configured (default Asia/Dhaka). |
| DAY-02 | Desktop grid and mobile day form | P0 | Same underlying values are editable in both; grid has sticky date and metric group headings. |
| DAY-03 | Typed entry | P0 | Count, duration, boolean, and text fields enforce units, bounds, and clear blank/zero/not-applicable semantics. |
| DAY-04 | Save with feedback | P0 | Save is idempotent per user/date/template version; success time, pending state, and recoverable error are visible. |
| DAY-05 | Month totals | P0 | Totals/averages use documented rules; missing days do not silently count as zero. |
| DAY-06 | Corrections and revisions | P0 | Permitted edits update the current value and record actor, timestamp, old/new values, and reason where required. |
| DAY-07 | Quick interactions | P1 | Keyboard navigation, repeat selected prior values, and optional autosave do not overwrite newer data. |
| DAY-08 | Offline draft | P2 | Local draft sync handles conflict explicitly and never claims server save before acknowledgment. |

Initial metric groups and fields:

| Group | Initial fields and units |
|---|---|
| Qur'an | Study ayat count, recitation, tafsir activity |
| Hadith | Study count/activity |
| Salah | Congregational prayer, missed prayer count |
| Reading | Literature pages, other/syllabus pages |
| Textbook/class | Study minutes, class count, attendance count |
| Contacts | Member, sathi, worker, supporter, friend, talented student, well-wisher, muharrrama counts |
| Distribution | Literature, magazine, sticker/card, gift counts |
| Organizational work | Dawah minutes, other organizational minutes |
| Routine | Social media minutes, newspaper reading, exercise, self-reflection, sleep minutes |

These are source-inspired defaults. Organizational stakeholders must review labels, units, definitions, and whether sensitive categories belong in the product before launch. Avoid storing names of contacted people as a default metric.

### 4.4 Monthly plan

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| PLAN-01 | One plan per student/month | P0 | A month-specific draft can be saved and reopened without losing values. |
| PLAN-02 | Grouped targets | P0 | Qur'an/hadith, reading/study, prayer, contacts, distribution, organizational work, contributions, and miscellaneous targets supported. |
| PLAN-03 | Share and revise | P0 | Student shares a version with supervisor; later revisions preserve the viewed version and advice linkage. |
| PLAN-04 | Print view | P0 | A4 printable layout includes month, student, labeled targets, advice, and print timestamp; navigation is hidden. |
| PLAN-05 | Supervisor acknowledgment | P1 | Supervisor can add advice and acknowledge plan without changing target values. |

### 4.5 Monthly outcome and detailed reporting

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| MON-01 | Derived monthly values | P0 | Each derivable total cites its source metric and calculation period; aggregation fixtures cover missing and corrected days. |
| MON-02 | Manual monthly values | P0 | Non-derivable fields are marked manual; manual values never masquerade as daily aggregates. |
| MON-03 | Plan comparison | P0 | Matching target, actual, and difference appear with appropriate units; no misleading percentage for zero targets. |
| MON-04 | Reflection | P0 | Student may record achievements, challenges, and next month's priorities. |
| MON-05 | Submission snapshot | P0 | Submission captures values/template version and status; subsequent daily edits flag the snapshot as stale. |
| MON-06 | Review states | P0 | Draft → submitted → in review → acknowledged, or returned → resubmitted, with timestamps and permissions. |
| DET-01 | Date-range report | P0 | From/To filter checks range and tenant access; results show daily rows and documented totals. |
| DET-02 | Print | P0 | Plan, monthly, and date-range reports render clearly on A4 and on mobile print preview. |
| DET-03 | CSV/PDF download | P1 | Exports reflect the same authorized query and calculation version. |

### 4.6 Mentorship and advice

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| MENT-01 | Assignment | P0 | Admin creates/ends effective-dated assignment; both parties see status. |
| MENT-02 | Student list | P0 | Supervisor sees assigned students only; search and filters do not reveal others. |
| MENT-03 | Review | P0 | Supervisor can acknowledge or return a submitted report and leave written advice; cannot edit student values. |
| MENT-04 | Advice history | P0 | Advice is linked to plan/report/month, ordered by time, and visible to the relevant student. |
| MENT-05 | Student acknowledgment | P1 | Student can mark advice read and reply if enabled by organization. |
| MENT-06 | Followers | P1 | Separate limited permission grants, request/approve/revoke flow; no automatic access to full daily reports. |

### 4.7 Organization administration

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| ADMIN-01 | Users and invitations | P0 | Admin can invite, suspend, reactivate, and assign scoped roles; cannot promote self beyond delegated authority. |
| ADMIN-02 | Structure | P0 | Branches, groups, responsibilities, and membership levels have stable IDs and effective dates. |
| ADMIN-03 | Supervisor assignments | P0 | Reassignment preserves history and ends old future access according to policy. |
| ADMIN-04 | Reporting defaults | P0 | Admin selects an approved default template and reporting timezone; existing submitted data remains stable. |
| ADMIN-05 | Template editor | P1 | Admin previews and publishes versioned metrics, labels, units, bounds, and visibility; incompatible edits create a new version. |
| ADMIN-06 | Oversight | P1 | Authorized aggregates show participation and review backlog; drill-down respects permissions. |
| ADMIN-07 | Audit log | P0 | Sensitive access, role changes, assignments, edits, review actions, and exports are searchable by authorized admins. |

### 4.8 Platform administration and optional observer

Platform admin can provision/suspend organizations, assign initial admins, monitor failed jobs and quotas, inspect operational logs, and use a justified audited support-access workflow. Platform admin access to personal report content is exceptional. Guardian/observer read-only summaries are P2 and require explicit student/organization authorization and revocation.

## 5. Permissions matrix

| Action | Student | Supervisor | Org admin | Platform admin |
|---|---|---|---|---|
| Edit own daily entries | Own | No | No by default | No by default |
| View daily entries | Own | Assigned, if granted | Policy-based oversight | Exceptional audited support |
| Edit own plan/outcome draft | Own | No | No | No |
| Submit own monthly outcome | Own | No | No | No |
| Review/return outcome | No | Assigned | Delegated reviewer only | No |
| Write advice | No | Assigned | Delegated only | No |
| Assign supervisors | No | No | Yes | Delegated provisioning only |
| Manage template version | No | No | Yes | Default template only |
| View audit log | Own activity subset | No | Own organization | Operational scope |

Every API query must include organization scope and resource authorization. A guessed MongoDB ObjectId must never grant access.

## 6. Routes and information architecture

Use React Router, with clean paths and query parameters. Route guards help UX; the API remains the authority.

```text
/
/features
/privacy
/terms
/login
/register
/forgot-password
/invite/:token

/app/home
/app/reports/daily?month=YYYY-MM
/app/reports/daily/:date
/app/reports/monthly-plan?month=YYYY-MM
/app/reports/monthly-outcome?month=YYYY-MM
/app/reports/details?from=YYYY-MM-DD&to=YYYY-MM-DD
/app/mentors
/app/followers
/app/advice
/app/notifications
/app/profile
/app/profile/security

/supervisor/dashboard
/supervisor/students
/supervisor/students/:studentId/overview
/supervisor/students/:studentId/daily
/supervisor/students/:studentId/plans
/supervisor/students/:studentId/reports
/supervisor/students/:studentId/advice
/supervisor/reviews

/organization/dashboard
/organization/users
/organization/invitations
/organization/assignments
/organization/structure
/organization/reporting/templates
/organization/reporting/templates/:id/versions/:version
/organization/analytics
/organization/audit-log
/organization/settings

/platform/organizations
/platform/operations
/platform/audit-log
```

Unknown routes, unauthorized routes, and expired invitations must have distinct, accessible states. Mobile navigation prioritizes Home, Daily, Plan, Report, Profile; other items live in a menu. Desktop uses a collapsible sidebar and contextual subnavigation.

## 7. UX and visual design requirements

**Design direction:** modern, calm, trustworthy, and distinct from a generic dashboard template. Use a restrained brand palette, strong Bengali typography, ample spacing, purposeful iconography, and readable data density. Avoid excessive gradients, glass effects, decorative charts, and motion that slows entry.

1. Establish design tokens for color, type, spacing, radius, shadow, density, and motion. Provide light and dark modes with adequate contrast.
2. Use a Bangla-capable font with tested rendering and numeral alignment. Support Bangla and Arabic text in labels where needed; localize dates and units consistently.
3. Make the first-run experience guided: explain metric meanings, monthly plan, sharing, and how values are reviewed.
4. Desktop grid: grouped sticky headers, pinned date column, row focus, keyboard navigation, inline unit hints, visible save state, and fast month switching.
5. Mobile entry: one day at a time, collapsible metric groups, large touch targets, progress within the form, sticky Save action, and easy previous/next day movement.
6. Use meaningful microinteractions: saving indicator, confirmation, changed-value highlight, responsive filter transitions, and gentle reveal of details. Respect `prefers-reduced-motion`.
7. Empty, loading, error, partial, and stale-data states must be designed for every screen. Never show a blank advice route without explanation.
8. Charts are secondary to clear numbers and explanations. Provide tables or text equivalents; never infer value judgments from self-reported religious activities.
9. Meet WCAG 2.2 AA as a target: keyboard access, focus order, labels, error identification, screen-reader-friendly tables, contrast, and 44px-equivalent touch targets where feasible.
10. Validate on narrow Android screens, iPad/tablet, laptop, and print. Performance target: initial usable screen within three seconds on a typical mobile connection for the pilot dataset, subject to measurement.

## 8. Technical architecture

```text
GitHub repository + Actions CI
            |
            v
Vercel React/Vite frontend  --->  Vercel Node/Express API
       |                                |          |
       v                                v          v
Firebase Auth client        Firebase Admin SDK   MongoDB Atlas
```

### Monorepo

```text
apps/web/                 React + Vite + TypeScript
apps/api/                 Express + Node.js + TypeScript
packages/shared/          Zod schemas, API types, metric identifiers
docs/                     Architecture, ADRs, runbooks
.github/workflows/        CI
```

Frontend: React, TypeScript, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS with carefully customized design tokens, an accessible component foundation, and a lightweight chart library. Backend: Express, TypeScript, Firebase Admin SDK, MongoDB Node driver or Mongoose, Zod validation, structured logging, and rate limiting. Shared validation reduces drift but server validation remains mandatory.

Vercel serves the static frontend and Express as serverless functions. Do not rely on a long-running process, in-memory sessions, local persistent filesystem, WebSockets, or background workers in functions. Reuse a cached MongoDB connection across warm invocations; cap pool size appropriate to Atlas Free. Keep exports within function duration/payload limits or move heavier jobs to a later paid worker. Keep API and frontend in the same region where practical and measure latency. Configure SPA rewrites without swallowing `/api/*` requests.

### Firebase integration

- Enable Email/Password and Google providers; configure authorized production/preview domains deliberately.
- Client obtains Firebase ID token and refreshes through SDK; API verifies token via Admin SDK, not by trusting decoded client payload.
- Create a MongoDB user record on first verified login or invitation acceptance; use Firebase `uid` as immutable identity key.
- Store role assignments in MongoDB and check them on each request. Firebase custom claims may be a cache/hint, never the sole source for organization access.
- Restrict service-account secret to Vercel API environment variables; no `.env` in Git. Rotate compromised secrets and document local emulator setup.

### MongoDB model and indexes

Collections: `users`, `organizations`, `memberships`, `branches`, `groups`, `supervisorAssignments`, `followerGrants`, `templateVersions`, `dailyReports`, `monthlyPlans`, `monthlyOutcomes`, `advice`, `reviews`, `invitations`, `notifications`, `auditEvents`, `exportJobs` (later).

| Collection | Core fields | Essential index |
|---|---|---|
| users | firebaseUid, name, email, status, profile | unique `firebaseUid` |
| memberships | orgId, userId, roles, branchId, status | unique `(orgId,userId)` |
| supervisorAssignments | orgId, studentId, supervisorId, startAt, endAt | `(orgId,supervisorId,endAt)` and `(orgId,studentId)` |
| templateVersions | orgId, templateId, version, metrics, publishedAt | unique `(orgId,templateId,version)` |
| dailyReports | orgId, studentId, dateKey, templateVersionId, values, revision | unique `(orgId,studentId,dateKey)`; `(orgId,studentId,dateKey)` range |
| monthlyPlans | orgId, studentId, monthKey, revisions, status | unique `(orgId,studentId,monthKey)` |
| monthlyOutcomes | orgId, studentId, monthKey, snapshot, status | unique `(orgId,studentId,monthKey)` |
| advice | orgId, studentId, authorId, targetType/Id, body, createdAt | `(orgId,studentId,createdAt)` |
| auditEvents | orgId, actorId, action, target, time, metadata | `(orgId,time)` and `(orgId,target.id,time)` |

Store ISO `YYYY-MM-DD` date keys in the organization's reporting timezone and ISO `YYYY-MM` month keys. Store timestamps in UTC. Store duration as integer minutes, counts as nonnegative integers, and currency as integer minor units plus currency code. Values have stable metric IDs and explicit `null` or applicability state. Submitted snapshots include template/calculation version. Use optimistic concurrency (`revision` or ETag) so two devices cannot silently overwrite each other.

Atlas Free's storage ceiling includes data and indexes. Retain compact records, inspect index size, set quota alerts where available, and plan export/upgrade before capacity is exhausted. Sensitive raw data should not be copied into analytics events or logs.

## 9. API contract (initial)

All protected endpoints require `Authorization: Bearer <Firebase ID token>` and resolve organization context server-side. Use `/api/v1`, consistent error shape `{ code, message, details?, requestId }`, pagination, validation, and documented status codes.

```text
GET    /api/v1/me
PATCH  /api/v1/me
GET    /api/v1/me/memberships

GET    /api/v1/templates/current
GET    /api/v1/daily-reports?month=YYYY-MM
GET    /api/v1/daily-reports/:date
PUT    /api/v1/daily-reports/:date
GET    /api/v1/daily-reports/:date/revisions

GET    /api/v1/monthly-plans/:month
PUT    /api/v1/monthly-plans/:month
POST   /api/v1/monthly-plans/:month/share
GET    /api/v1/monthly-outcomes/:month
PUT    /api/v1/monthly-outcomes/:month
POST   /api/v1/monthly-outcomes/:month/submit
GET    /api/v1/reports/details?from=...&to=...

GET    /api/v1/mentors
GET    /api/v1/followers
GET    /api/v1/advice
POST   /api/v1/advice/:id/acknowledge

GET    /api/v1/supervisor/students
GET    /api/v1/supervisor/students/:id/overview
GET    /api/v1/supervisor/students/:id/reports
POST   /api/v1/supervisor/reviews/:outcomeId
POST   /api/v1/supervisor/advice

GET    /api/v1/organization/users
POST   /api/v1/organization/invitations
POST   /api/v1/organization/assignments
PATCH  /api/v1/organization/assignments/:id
GET    /api/v1/organization/audit-events
```

API documentation: OpenAPI generated or maintained with the implementation; example requests and error cases included. Mutating endpoints accept revision identifiers and return the saved authoritative record. Never accept `studentId` from the client as authorization for self routes.

## 10. Reporting calculations and state

Define each metric's aggregation as `sum`, `count of active days`, `average over answered days`, `average over calendar days`, `last value`, or `not aggregatable`. The template includes unit, bounds, zero meaning, and display precision. Do not aggregate text. A month with no values displays "No data", not zero performance. Plan comparison only happens for a compatible metric/unit pair.

Daily: `empty → saved → corrected`; monthly plan: `draft → shared → revised/acknowledged`; monthly outcome: `draft → submitted → in_review → acknowledged` or `returned → resubmitted`. All transitions have actor/time and permitted next actions. Once a snapshot is submitted, later daily edits create a visible "source changed" warning and a deliberate regeneration/resubmission path.

## 11. Security, privacy, and operations

- Enforce tenant isolation in every query and authorization policy. Test cross-user and cross-organization ID changes.
- Rate-limit sign-in-adjacent API, search, export, and invitation endpoints. Use Firebase abuse protections and limit privileged actions.
- Validate input and sanitize output; set security headers and a strict CORS allowlist for known frontend origins.
- Use least-privilege secrets, separate development and production Firebase projects/databases, and environment-specific Vercel variables.
- Audit role changes, assignment changes, report corrections, reviews, support access, and exports. Minimize or redact sensitive values in logs.
- Provide privacy notice, access request, correction, export, deletion, retention, and backup/restore procedures before onboarding real users.
- Make backup ownership explicit; a free Atlas cluster is not a substitute for tested backups. Pilot operator performs encrypted scheduled exports to a controlled destination and rehearses restore. Do not store backup archives in the Git repository.
- Monitor Vercel errors/usage, Atlas capacity/connections, auth failures, and client errors. Set a documented incident owner and response procedure.
- Review data sensitivity and applicable local laws before institutional rollout; do not assume a free pilot configuration is legally sufficient for every organization.

## 12. Deployment and CI/CD

1. GitHub monorepo with protected `main`, pull requests, code review, Dependabot, issue templates, and no committed secrets. Private repos have plan-specific Actions allowances; public standard-runner Actions are free, but a public repo must contain no credentials or personal data.
2. GitHub Actions on PR: install with lockfile, lint, typecheck, unit tests, API integration tests against an isolated test database, frontend build, and basic security/dependency check.
3. Vercel preview deployments for PRs, with a separate preview Firebase project or restricted preview auth domain and non-production data.
4. Merge to `main` triggers production deployment. Run migrations/seed changes as a controlled, idempotent step; Mongo schema changes must support old and new readers during rollout.
5. Atlas Free cluster with a dedicated database user and network configuration appropriate to Vercel's dynamic egress. Avoid treating a broad IP allowlist as security; enforce TLS, strong credentials, least privilege, and rotation. Confirm actual connectivity in preview and production.
6. Smoke test production: homepage, login, authorized API, daily save/reload, month aggregate, supervisor review, print, logout. Roll back to the previous Vercel deployment if critical checks fail; document handling for partially deployed schema changes.

**Free-tier reality:** Vercel Hobby is restricted to personal/noncommercial use; it has function and usage limits, and its cron scheduling is limited/imprecise. MongoDB Atlas Free has a 512 MB data-plus-index ceiling. Firebase Spark has provider-specific quotas. GitHub Actions limits differ for public and private repositories. These plans are suitable for development and a modest personal pilot, not a guarantee of a free multi-organization commercial production service. Monitor usage and plan a paid or alternative deployment before limits or terms become incompatible. No mandatory paid feature is required for V1; automated frequent reminders and heavy exports are deferred.

## 13. Testing and acceptance gates

| Gate | Required evidence |
|---|---|
| Authorization | Students cannot access another student's records; supervisors only assigned students; organization A cannot access B; suspended users blocked. |
| Reporting arithmetic | Fixtures cover February/leap year, 30/31-day months, timezone boundary, missing vs zero, corrections, version changes, and rounding. |
| Save integrity | Refresh and second-device edits preserve authoritative values; conflict presented, never silently overwritten. |
| Lifecycle | Every valid and invalid status transition tested; returned report retains old snapshot and advice. |
| Accessibility | Keyboard-only completion, labels, focus, errors, contrast, reduced motion, screen reader spot checks. |
| Responsive | 320px phone, common Android width, tablet, desktop, and A4 print layouts reviewed. |
| Performance | Month form remains responsive on low-end mobile; API p95 and bundle metrics measured on pilot data. |
| Operations | Production smoke test, monitoring, restore rehearsal, secret rotation runbook, rollback rehearsal. |

Release blocker: any cross-tenant data exposure, incorrect report totals, lost save without user notice, broken authentication, or unrecoverable backup gap.

## 14. Milestones and deliverables

| Milestone | Deliverables | Exit criterion |
|---|---|---|
| M0 — Discovery | Confirm reporting field definitions, sample filled forms, permissions, stakeholder approval, design references | Signed field dictionary and scope |
| M1 — Foundation | Monorepo, CI, Firebase auth, Atlas, organization model, deploy previews | Test users sign in with scoped API |
| M2 — Student reporting | Daily forms/grid, save/revisions, totals, profile | Full month entries persist and calculate correctly |
| M3 — Monthly cycle | Plan, outcome, snapshot, print, detailed report | Student completes end-to-end monthly workflow |
| M4 — Supervision | Assignments, review, advice, access tests | Supervisor can review assigned student only |
| M5 — Admin and hardening | Invites, structure, audit, privacy, monitoring, backup, accessibility and production checks | Pilot release gates pass |
| M6 — V1.1 | Template editor, exports, notifications, analytics | Separate acceptance and quota review |

Estimate effort only after M0 resolves the field dictionary, authorization rules, design depth, and pilot user count. Avoid a date commitment from this proposal alone.

## 15. Open decisions before implementation

1. Is the product for one organization or multiple organizations at launch? The model supports multiple; pilot UI may start with one.
2. Who can change membership level, branch, and responsibility, and how are changes approved?
3. What does "follower" mean and which records may they view?
4. Which monthly report fields are computed from daily records and which are manual?
5. Are historical entries editable indefinitely, within a window, or only after supervisor return?
6. Which activity categories are required for all students, optional, or organization-specific?
7. What are retention periods, backup destination, and authorized export recipients?
8. What is the expected pilot user count and monthly entry volume? This determines whether Atlas Free and Vercel Hobby remain practical.
9. Will the deployment be personal/noncommercial? If not, select an eligible hosting plan/provider before public launch.
10. Should the site use a distinct name and branding rather than reproducing MyReportBD's identity and content?

## 16. Source and platform notes

The source-site student observations are from the authenticated account inspection in this conversation. Other-role screens remain unverified. Current platform constraints should be rechecked at deployment:

- Vercel Express deployment and Functions: https://vercel.com/docs/frameworks/backend/express and https://vercel.com/docs/functions/limitations
- Vercel Hobby terms and limits: https://vercel.com/docs/plans/hobby and https://vercel.com/docs/limits/fair-use-guidelines
- Firebase Auth and Admin token verification: https://firebase.google.com/docs/auth and https://firebase.google.com/docs/auth/admin/verify-id-tokens
- Atlas Free limitations: https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/ and https://www.mongodb.com/docs/atlas/manage-clusters/
- GitHub Actions billing: https://docs.github.com/en/actions/concepts/billing-and-usage

