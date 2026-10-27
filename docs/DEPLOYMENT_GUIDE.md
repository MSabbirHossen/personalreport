# BPS_Report — Production Deployment & Operations Guide

## 1. System Architecture Overview

BPS_Report uses a decoupled, multi-tenant MERN architecture hardened for security and scalability:

- **Frontend SPA:** React 19 + TypeScript + Vite, deployed as a static Single Page Application (e.g. Vercel, Cloudflare Pages, AWS S3 + CloudFront).
- **Backend API:** Node.js 22 + Express 4 + TypeScript, containerized using multi-stage Alpine Docker runtime (e.g. Render, Railway, AWS ECS, Google Cloud Run).
- **Database Engine:** MongoDB Atlas (M10+ recommended for production) operating as a 3-node replica set to support atomic transactions, secondary read scaling, and automated point-in-time backups.
- **Identity & Auth:** Firebase Authentication (Client SDK on web, Firebase Admin SDK with service-account credential on API).

---

## 2. Environment Variables Specification

### Backend API (`apps/api`)

| Variable | Required in Production | Purpose / Description | Example / Allowed Values |
|---|---|---|---|
| `NODE_ENV` | **Yes** | Defines application environment mode | `production` |
| `PORT` | Optional (default: `4000`) | Network port for HTTP server | `4000` |
| `MONGODB_URI` | **Yes** | Connection string to MongoDB cluster | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/reportbd?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Optional (default: `reportbd`) | Database name within MongoDB cluster | `reportbd` |
| `CORS_ORIGIN` | **Yes** | Comma-separated list of permitted frontend origins (wildcards prohibited in production) | `https://app.reportbd.com,https://beta.reportbd.com` |
| `TRUST_PROXY` | **Yes** (if behind proxy) | Enables Express trusted proxy header resolution for reverse proxies. Set `true` if behind Google Cloud Run, AWS ALB, Cloudflare, or Nginx. Leave `false` if exposed directly without a proxy to prevent source IP spoofing. | `true` or `false` |
| `FIREBASE_PROJECT_ID` | **Yes** | Firebase project identifier | `reportbd-prod` |
| `FIREBASE_CLIENT_EMAIL` | **Yes** | Service account email from Firebase console | `firebase-adminsdk-xxxxx@reportbd-prod.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | **Yes** | Cryptographic private key for Firebase Admin verification | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `ALLOW_DEV_MOCK_AUTH` | **FORBIDDEN** in prod | Bypass flag for local testing. In production, startup fails if `true`. | `false` |

> **Operational Note on Rate Limiting Architecture:**
> The sliding-window rate limiters (`authRateLimiter`, `inviteRateLimiter`, `sensitiveOpsLimiter`, `generalApiLimiter`) utilize an in-memory bucket store. In-memory counters are scoped per Node.js process and do NOT provide a shared global quota across horizontally scaled replicas. For multi-instance container clusters requiring global quota synchronization, configure Redis-backed storage or enforce rate limiting at the ingress/API gateway layer.

### Frontend Web SPA (`apps/web`)

| Variable | Required in Production | Purpose / Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | **Yes** | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | Firebase Auth domain (`<project-id>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | Firebase project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | **Yes** | Firebase Cloud Storage bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | **Yes** | Firebase Web application ID |
| `VITE_API_BASE_URL` | Optional | Backend API base URL (leave blank if served through same domain / reverse proxy) |

---

## 3. Pre-Deployment Verification Checklist

Before deploying any production release:

- [ ] **CI Pass:** GitHub Actions CI workflow must pass all checks (shared tests, API tests, real MongoDB integration, typecheck, build, and `git diff --check`).
- [ ] **Database Indexes:** Execute `npm run db:init -w apps/api` against the target database cluster. Verify that all 15 compound, unique, and partial indexes are created.
- [ ] **Secret Sanitization:** Ensure no `.env` or service account keys are committed to Git.
- [ ] **Allowed Origins:** Verify `CORS_ORIGIN` precisely matches the production frontend domain.

---

## 4. Step-by-Step Deployment Instructions

### Step 1: Database Initialization & Migration

Execute the database initialization script against your MongoDB Atlas cluster:
```bash
MONGODB_URI="mongodb+srv://<admin-user>:<password>@cluster0.mongodb.net/reportbd?retryWrites=true&w=majority" npm run db:init -w apps/api
```
This command is safe and idempotent:
- Creates all required compound and partial unique indexes.
- Seeds the standard template version (`standard_v1`) if absent.
- Upserts the default organization root.

### Step 2: Backend Container Deployment

Build and push the multi-stage production Docker image:
```bash
docker build -t reportbd-api:v1.0.0 -f apps/api/Dockerfile .
```
Deploy the container to your orchestration platform with the required environment variables. Verify healthchecks:
- `GET /health` -> HTTP 200 `{ status: "ok" }`
- `GET /health/ready` -> HTTP 200 `{ status: "ready", database: "connected" }`

### Step 3: Frontend Web Deployment (Vercel)

1. Connect the GitHub repository to Vercel.
2. Configure project settings:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variables (`VITE_FIREBASE_*`, `VITE_API_BASE_URL`).
4. Ensure `apps/web/vercel.json` is deployed to route all client-side paths to `/index.html`.

---

## 5. Rollback Procedures

### Backend Rollback
- In container platforms (Render, Railway, ECS, Kubernetes), redeploy the previous immutable image tag (e.g. `reportbd-api:v0.9.9`).
- Because all MongoDB index changes are backward-compatible and additive, database schema rollbacks are not required.

### Frontend Rollback
- On Vercel: navigate to **Deployments** tab -> locate the previous verified deployment -> click **Promote to Production** (instant zero-downtime rollback).

### Disaster Recovery
- MongoDB Atlas maintains automated snapshots every 6 hours and continuous oplog backup.
- In case of catastrophic data corruption, initiate point-in-time recovery to the desired timestamp via the MongoDB Atlas Cloud console.

---

## 6. Staging Handoff & Release Readiness Checklist

### 1. Required Production Environment Variables (Names Only)
- **Backend API:** `NODE_ENV`, `PORT`, `MONGODB_URI`, `MONGODB_DB_NAME`, `CORS_ORIGIN`, `TRUST_PROXY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- **Frontend SPA:** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_API_BASE_URL`.

### 2. Firebase Provisioning Protocol
1. Create a Firebase Project in Google Cloud console.
2. Enable **Authentication** -> Sign-in methods: **Email/Password** and **Google**.
3. In Project Settings -> **Service accounts**, generate a new private key JSON.
4. Extract `project_id`, `client_email`, and format `private_key` with actual newlines (`\n`) for environment injection.
5. In Project Settings -> General -> **Your apps**, register a Web App and extract Client SDK keys for `apps/web`.

### 3. Database Replica Set & Migration Requirements
1. MongoDB cluster must run MongoDB 7.0+ as a replica set (required for multi-document ACID transactions in supervisor reviews and snapshot submission).
2. Execute `npm run db:init -w apps/api` against target cluster to generate all 15 compound, unique, and partial indexes before directing traffic.
3. Verify partial index on notifications (`idempotencyKey`) and unique index on memberships (`orgId`, `userId`).

### 4. Backup & Pre-Release Safeguards
1. Verify automated cloud backup snapshot state in MongoDB Atlas console prior to executing data migrations.
2. Confirm oplog retention window is active (minimum 24-hour continuous recovery).

### 5. Ingress, Reverse-Proxy & CORS Controls
1. Set `CORS_ORIGIN` to exact comma-separated production origins (e.g. `https://app.reportbd.com`). Wildcards (`*`) are rejected at startup in production.
2. If API is deployed behind Cloud Run, AWS ALB, Nginx, or Cloudflare, ensure `TRUST_PROXY=true` to resolve client IP addresses correctly for rate limiting.

### 6. Deployment Sequence & Post-Deployment Smoke Checks
1. **Phase 1: Database Initialization:** Run `npm run db:init -w apps/api`.
2. **Phase 2: API Container Rollout:** Deploy `reportbd-api:<tag>`.
3. **Phase 3: Backend Smoke Check:** Query `GET /health` (expect 200 `{ status: "ok" }`) and `GET /health/ready` (expect 200 `{ status: "ready", database: "connected" }`).
4. **Phase 4: Frontend Rollout:** Deploy `apps/web` to Vercel/CDN.
5. **Phase 5: End-to-End Smoke Check:** Sign in with seeded test account; confirm profile loads and active organization displays.

### 7. Health & Readiness Monitoring
- Monitor `GET /health` for process liveness (container restart trigger if unresponsive).
- Monitor `GET /health/ready` for traffic routing (load balancer cuts traffic on 503 `disconnected` state).

### 8. Release Abort & Rollback Criteria
- **Abort Release If:**
  - Database readiness check fails for > 3 consecutive health checks.
  - API error rate exceeds 1% of total requests during smoke testing or initial traffic.
  - Startup throws validation error (e.g. missing credentials or loopback URI).
- **Operational Monitoring Prerequisites for Automated Enforcement:**
  - *Readiness Enforcement:* Handled natively by container orchestrators (e.g., Kubernetes `readinessProbe` with `failureThreshold: 3`, AWS ECS target group health check, or GCP Cloud Run health checks) which automatically cease traffic routing to instances returning 503 `disconnected`.
  - *Error Rate Observability:* The 1% error threshold cannot be assumed to be enforced automatically without configured telemetry. Prior to deployment, establish an APM alarm (e.g., AWS CloudWatch 5XX Metric Alarm, GCP Cloud Monitoring Error Ratio Alert, or Datadog Synthetic Monitor). In environments without automated APM alerting, an engineer must actively observe live server access logs (`docker logs -f` or Cloud Logging) for 15 minutes post-deployment to manually verify error rates.
- **Rollback Procedure:** Redeploy previous verified Docker container tag on backend; promote previous verified deployment on Vercel frontend.

### 9. Remaining Human Verification Tasks
- Browser UI exploration for Student, Supervisor, Org Admin, and Platform Admin flows.
- Visual Chrome / Edge A4 print preview inspection for `/monthly-plan`.

### 10. Outstanding Security & Architectural Boundaries
- **Multi-Instance Rate Limiting Limitations:**
  - The built-in sliding-window rate limiters store bucket state in memory (`Map<string, RateLimitRecord>`) local to each Node.js process.
  - *Why Sticky Sessions / IP Hashing is Insufficient:* Sticky routing does not provide globally consistent rate limits. If traffic is distributed across $N$ API instances, a malicious or abusive actor can consume up to $N \times \text{limit}$ total requests if their requests balance across instances. Furthermore, authenticated users sharing an organization or NAT IP will have split state across instances, while IP failover or pod restarts reset in-memory buckets immediately.
  - *Required Architecture for Scaled Multi-Instance Deployments:*
    1. **Shared Memory Store:** Connect the Express rate limiting middleware to an external distributed cache such as Redis (e.g., via `rate-limit-redis` with `ioredis`). This ensures all API pods atomically increment and evaluate the same sliding-window key.
    2. **Edge / API Gateway Rate Limiting:** Enforce baseline IP and route rate limiting upstream at the reverse proxy or CDN edge (e.g., Cloudflare Rate Limiting Rules, AWS WAF rate-based rules, GCP Cloud Armor, or Nginx `limit_req_zone`). Edge limiting mitigates volumetric abuse and DoS attacks before traffic reaches the container cluster, while application-level rate limiting enforces authenticated user/organization business quotas.
