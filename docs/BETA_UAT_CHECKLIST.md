# Report-BPS — Beta User Acceptance Testing (UAT) Checklist

**Version:** 1.0.0-beta
**Verification Policy:** Scenarios validated by automated tests are marked **Automated Passed**. Manual user interface, browser printing, and cross-browser visual checks require human execution and are marked **Pending Human Verification**.

---

## 1. Persona 1: Student

| Scenario ID | Test Scenario | Prerequisites | Step-by-Step Actions | Expected Result | Verification Status |
|---|---|---|---|---|---|
| **UAT-STU-01** | Account Registration & Invitation Acceptance | Unregistered user with valid invite link | 1. Navigate to `/invite/:token`<br>2. Sign in via Firebase Email or Google<br>3. Click "আমন্ত্রণ গ্রহণ করুন" | Active membership assigned; redirected to student dashboard. | **Automated Passed** (Inv-6) / **Pending Human UI Check** |
| **UAT-STU-02** | Daily Reporting Entry & Auto-Sum | Active student membership | 1. Open `/daily-report`<br>2. Enter counts for Quran, Hadith, Study<br>3. Save daily report | Metrics saved; daily revision increments; totals dynamically update. | **Automated Passed** (Daily-1, 2) / **Pending Human UI Check** |
| **UAT-STU-03** | Monthly Plan Setup & Supervisor Sharing | Active student | 1. Open `/monthly-plan`<br>2. Set target metrics for upcoming month<br>3. Click "সুপারভাইজারের সাথে শেয়ার করুন" | Plan status changes to `shared`; targets become visible to assigned supervisor. | **Automated Passed** (Plan-1, 3) / **Pending Human UI Check** |
| **UAT-STU-04** | A4 Monthly Plan Browser Print | Active student with saved plan | 1. Open `/monthly-plan`<br>2. Click "প্রিন্ট ভিউ (A4)" button or press Ctrl+P<br>3. Check print preview dialog | A4 portrait layout with metadata strip, dense tables, signature lines, no buttons/nav. | **Pending Human Verification** (Procedure below) |
| **UAT-STU-05** | Monthly Outcome Submission & Snapshot Freeze | Completed daily reports for month | 1. Open `/monthly-outcome`<br>2. Review derived values<br>3. Click "রিপোর্ট জমা দিন" | Status freezes to `submitted`; immutable snapshot recorded; editing locked. | **Automated Passed** (Outcome-1, 4) / **Pending Human UI Check** |
| **UAT-STU-06** | Stale Snapshot Warning on Post-Submission Daily Edits | Submitted monthly outcome | 1. Modify a daily report from submitted month<br>2. Open `/monthly-outcome` | Amber warning banner displayed: "রিপোর্ট পরিবর্তন করা হয়েছে (Stale)". Frozen snapshot remains intact. | **Automated Passed** (Outcome-2) / **Pending Human UI Check** |
| **UAT-STU-07** | Revision Conflict Handling on Concurrent Daily Edits | Active student | 1. Open daily report in two browser tabs<br>2. Save update in Tab A (rev 1 -> 2)<br>3. Attempt save in Tab B using stale rev 1 | HTTP 409 Conflict modal triggered; informs student that data was updated; prompts reload. | **Automated Passed** (Daily-3, 4) / **Pending Human UI Check** |

---

## 2. Persona 2: Supervisor

| Scenario ID | Test Scenario | Prerequisites | Step-by-Step Actions | Expected Result | Verification Status |
|---|---|---|---|---|---|
| **UAT-SUP-01** | Supervisor Dashboard Queue & Filters | Active supervisor assigned to students | 1. Open `/supervisor/dashboard`<br>2. Filter by monthKey and status<br>3. Inspect KPI counters | Pending review counter matches submitted reports; filter shows assigned students only. | **Automated Passed** (Queue-1, Sup-9) / **Pending Human UI Check** |
| **UAT-SUP-02** | Report Review & Plan vs Actual Comparison | Submitted student report in queue | 1. Open report from review queue<br>2. Compare planned targets with actual outcome<br>3. Enter review feedback | Targets and actuals displayed side-by-side; historical advice loaded. | **Automated Passed** (Sup-6, 7) / **Pending Human UI Check** |
| **UAT-SUP-03** | Report Return & Resubmission Flow | Submitted report | 1. Click "সংশোধনের জন্য ফেরত দিন" with feedback<br>2. Student updates daily entries and resubmits | Status changes to `returned`; student editing unlocked; resubmission notifies supervisor. | **Automated Passed** (Review-2, Sup-9) / **Pending Human UI Check** |
| **UAT-SUP-04** | Mentorship Thread & Two-Way Advice | Existing report or advice thread | 1. Supervisor posts mentorship advice<br>2. Student posts reply in thread | Threaded replies update chronologically; in-app notification delivered. | **Automated Passed** (Advice-1, Adv-1) / **Pending Human UI Check** |
| **UAT-SUP-05** | Concurrent Supervisor Review Protection | Submitted report in queue | 1. Two supervisors open same report<br>2. Supervisor A acknowledges report<br>3. Supervisor B attempts return simultaneously | Supervisor A succeeds; Supervisor B receives HTTP 409 `ALREADY_REVIEWED` conflict alert. | **Automated Passed** (Sup-7, RealMongo-3) / **Pending Human UI Check** |

---

## 3. Persona 3: Organization Administrator

| Scenario ID | Test Scenario | Prerequisites | Step-by-Step Actions | Expected Result | Verification Status |
|---|---|---|---|---|---|
| **UAT-ADM-01** | Create Expiring Invitation | `org_admin` role | 1. Open `/organization/invitations`<br>2. Enter email, role (`student`/`supervisor`), and expiry<br>3. Generate invitation | Secure 48-char crypto token generated; pending invite appears in table. | **Automated Passed** (Inv-1, B1) / **Pending Human UI Check** |
| **UAT-ADM-02** | Revoke Pending Invitation | Active pending invitation | 1. Click "বাতিল করুন" on pending invitation | Invitation status marked `revoked`; public preview returns 410 Gone. | **Automated Passed** (Inv-8, B4) / **Pending Human UI Check** |
| **UAT-ADM-03** | Supervisor Assignment Linkage | Active student & supervisor in org | 1. Assign student to supervisor via admin modal | `supervisorAssignments` updated; supervisor immediately sees student in queue. | **Automated Passed** (MENT-01) / **Pending Human UI Check** |
| **UAT-ADM-04** | Administrative Audit Log Explorer | `org_admin` role | 1. Open `/organization/audit-log`<br>2. Filter by date range, action, or actor<br>3. Click "বিস্তারিত" to inspect metadata | Historical actions listed with Bangla timestamps; sensitive keys redacted; strictly scoped to org. | **Automated Passed** (Audit-1–10) / **Pending Human UI Check** |
| **UAT-ADM-05** | Invitation Creation Rate Limiting | `org_admin` role | 1. Rapidly submit >30 invitation generation requests within 15 minutes | HTTP 429 Too Many Requests returned with `Retry-After` header; protects against invitation spam. | **Automated Passed** (Sec-5) / **Pending Human UI Check** |

---

## 4. Persona 4: Platform Administrator

| Scenario ID | Test Scenario | Prerequisites | Step-by-Step Actions | Expected Result | Verification Status |
|---|---|---|---|---|---|
| **UAT-PLT-01** | Multi-Tenant Organization Switcher & Cross-Org Isolation | `platform_admin` role | 1. Query audit events or reports across tenants | Can inspect target org; tenant data boundary enforced per query. | **Automated Passed** (Audit-2, Sup-3) / **Pending Human UI Check** |

---

## 5. PLAN-04: A4 Print Preview Verification Procedure

To verify `PLAN-04` manual print rendering:
1. Start local dev server (`npm run dev`) or access staging deployment.
2. Log in as a student with a configured monthly plan (`/monthly-plan`).
3. Click the **"প্রিন্ট ভিউ (A4)"** button in the top-right header or press `Ctrl + P`.
4. Verify in Chrome / Edge print preview dialog:
   - **Page Size:** Select **A4** (210 × 297 mm).
   - **Orientation:** Select **Portrait**.
   - **Margins:** Default.
   - **Options:** Check **"Background graphics"**.
5. **Visual Inspection Criteria:**
   - [ ] Application sidebar, top header, buttons, and input borders are completely hidden.
   - [ ] Dedicated document header shows organization name, student name, email, month, revision, and generation date.
   - [ ] Table headers repeat cleanly across multi-page tables.
   - [ ] Dense Bangla typography renders without clipping or overflow.
   - [ ] Notes and supervisor advice are formatted as print cards.
   - [ ] Dual signature blocks ("শিক্ষার্থীর স্বাক্ষর" and "সুপারভাইজারের স্বাক্ষর ও মন্তব্য") appear neatly at the document footer.
   - [ ] No trailing blank pages.

---

## 6. Manual Human UAT Execution Test Sheet & Sign-Off Template

*Note: All listed accounts are synthetic development/test accounts seeded locally. No production accounts or credentials are used.*

| Persona | Scenario ID | Target Workflow | Setup & Prerequisites | Test Actions & Execution | Expected Outcome | Evidence Field (Screenshot / Log) | Sign-Off Status |
|---|---|---|---|---|---|---|---|
| **Student** | `UAT-STU-01` | Invitation Acceptance & Onboarding | Seeded invite link for `org_test` | Open `/invite/:token`, log in, click accept | Active student membership granted; dashboard accessible | `[Record URL / Screenshot]` | [ ] Pending |
| **Student** | `UAT-STU-02` | Daily Report Entry & Dynamic Sums | Active student session | Fill daily fields (Quran, Hadith, Study) across 3 days | Saved with revision counter increment; auto-sums update | `[Record revision # / Screenshot]` | [ ] Pending |
| **Student** | `UAT-STU-03` | Monthly Plan Setup & Sharing | Active student session | Input target metrics in `/monthly-plan`, click share | Status transitions to `shared`; visible to supervisor | `[Record Plan Status / Screenshot]` | [ ] Pending |
| **Student** | `UAT-STU-05` | Monthly Outcome Submission & Snapshot | Completed daily reports | Navigate to `/monthly-outcome`, click submit | Status marked `submitted`; snapshot frozen; inputs locked | `[Record Outcome ID / Screenshot]` | [ ] Pending |
| **Student** | `UAT-STU-06` | Stale Snapshot Warning on Post-Edit | Submitted outcome | Modify past daily report in submitted month | Warning banner: "রিপোর্ট পরিবর্তন করা হয়েছে (Stale)" | `[Record Banner Text / Screenshot]` | [ ] Pending |
| **Student** | `UAT-STU-07` | Concurrency Conflict Recovery (409) | Active student session | Open report in two browser tabs; save in Tab A, then Tab B | Tab B receives HTTP 409 Conflict prompt with reload action | `[Record Modal Alert / Screenshot]` | [ ] Pending |
| **Supervisor** | `UAT-SUP-01` | Dashboard Queue & KPI Counters | Supervisor session with assigned student | Open `/supervisor/dashboard`, apply status/month filter | KPI numbers match queue counts; only assigned students visible | `[Record KPI numbers / Screenshot]` | [ ] Pending |
| **Supervisor** | `UAT-SUP-02` | Plan vs Actual Comparison & Review | Submitted outcome in queue | Open student review view, inspect targets vs actuals | Comparison table displayed side-by-side; advice log visible | `[Record Side-by-side UI Screenshot]` | [ ] Pending |
| **Supervisor** | `UAT-SUP-03` | Return for Resubmission Flow | Submitted report | Click "সংশোধনের জন্য ফেরত দিন" with comment | Report status changes to `returned`; student editing unlocked | `[Record Returned Status / Screenshot]` | [ ] Pending |
| **Supervisor** | `UAT-SUP-04` | Two-Way Mentorship Threading | Active advice thread | Supervisor posts advice; student posts response | Thread updates in chronological order; notifications increment | `[Record Thread UI Screenshot]` | [ ] Pending |
| **Supervisor** | `UAT-SUP-05` | Concurrent Review Conflict (409) | Submitted report | Two supervisors review same report concurrently | First review succeeds; second receives `ALREADY_REVIEWED` 409 | `[Record 409 Toast / Screenshot]` | [ ] Pending |
| **Org Admin** | `UAT-ADM-01` | Expiring Invitation Creation | `org_admin` session | Open `/organization/invitations`, create student invite | 48-char crypto token created with 7-day expiration | `[Record Token Preview / Screenshot]` | [ ] Pending |
| **Org Admin** | `UAT-ADM-02` | Invitation Revocation | Pending invitation | Click "বাতিল করুন" on pending invitation | Invitation status marked `revoked`; preview returns 410 | `[Record Revoked Badge / Screenshot]` | [ ] Pending |
| **Org Admin** | `UAT-ADM-03` | Supervisor-Student Linkage | Active student & supervisor | Link student to supervisor in modal | Immediate appearance of student in supervisor queue | `[Record Assignment Modal Screenshot]` | [ ] Pending |
| **Org Admin** | `UAT-ADM-04` | Audit Explorer Filter & Redaction | `org_admin` session | Open `/organization/audit-log`, inspect event metadata | Actions listed; tokens, passwords, and secrets redacted | `[Record Sanitized Metadata Screenshot]`| [ ] Pending |
| **Platform Admin** | `UAT-PLT-01` | Cross-Tenant Data Isolation | `platform_admin` session | Query audit logs and reports across distinct orgs | Data strictly isolated to requested orgId; no cross-leakage | `[Record Tenant Header / Screenshot]` | [ ] Pending |
| **Print** | `PLAN-04` | Chrome / Edge A4 Portrait Print | Configured monthly plan | Open `/monthly-plan`, click A4 Print or Ctrl+P | A4 portrait, 12mm/15mm margins, signature block, no UI nav | `[Attach Print PDF Artifact / Scan]` | [ ] Pending |
