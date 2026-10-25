# ReportBD — Production Deployment & Operations Guide

## 1. System Architecture Overview

ReportBD uses a decoupled, multi-tenant MERN architecture hardened for security and scalability:

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
| `TRUST_PROXY` | **Yes** (if behind proxy) | Enables Express trusted proxy header resolution for reverse proxies | `true` or `false` |
| `FIREBASE_PROJECT_ID` | **Yes** | Firebase project identifier | `reportbd-prod` |
| `FIREBASE_CLIENT_EMAIL` | **Yes** | Service account email from Firebase console | `firebase-adminsdk-xxxxx@reportbd-prod.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | **Yes** | Cryptographic private key for Firebase Admin verification | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `ALLOW_DEV_MOCK_AUTH` | **FORBIDDEN** in prod | Bypass flag for local testing. In production, startup fails if `true`. | `false` |

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
