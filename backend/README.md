# Quantum-Proof Systems Scanner Backend (Node.js)

Node.js REST API implementation aligned with the SRS in `pnbfinal.pdf`.

## Features implemented

- Asset discovery and inventory endpoints (web/API/VPN assets)
- Cryptographic analysis and risk scoring (Low/Medium/High/Critical)
- PQC readiness labels (`Quantum-Safe`, `PQC Ready`, `Fully Quantum Safe`, `Not Quantum Safe`)
- CBOM generation endpoint with CERT-In inspired structure
- Scan execution and mock scan scheduling
- Dashboard summary endpoint for enterprise monitoring
- Report export in JSON, CSV, XML
- Role-based access control (Security Admin, Checker, Auditor)
- Security Admin login page and security-admin management flow
- Audit logs for critical user actions

## Quick start

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create environment file:

```bash
copy .env.example .env
```

3. Set database (recommended for persistence):

```bash
set DATABASE_URL=postgres://postgres:postgres@localhost:5432/pnb
```

If `DATABASE_URL` is not set, the backend uses an in-memory PostgreSQL-compatible engine (`pg-mem`) for local demo/testing.

4. Run server:

```bash
npm run dev
```

Server base URL: `http://localhost:4000`

## Demo users

- Security Admin: `admin` / `admin@123`
- Checker: `checker` / `checker123`
- Auditor: `auditor` / `auditor123`

## Security Admin management

Only a logged-in Security Admin can create another Security Admin using `POST /api/auth/security-admins`.
Required fields: `username`, `password`, and `fullName`.

## Auth flow

1. `POST /api/auth/login`
2. Copy `token` from response
3. Send `Authorization: Bearer <token>` on protected endpoints

## Core endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/assets`
- `POST /api/assets` (admin, checker)
- `PATCH /api/assets/:id` (admin, checker)
- `DELETE /api/assets/:id` (admin)
- `POST /api/scans/run` (admin, checker)
- `GET /api/scans`
- `POST /api/scans/schedule` (admin)
- `GET /api/scans/schedule/list`
- `GET /api/dashboard/summary`
- `GET /api/cbom`
- `GET /api/cbom/:assetId`
- `GET /api/reports/latest`
- `GET /api/reports/export?format=json|csv|xml`
- `GET /api/logs`

## Notes

- The backend now supports PostgreSQL persistence (auto schema initialization and seed data).
- For production, use managed PostgreSQL, secure password hashing, secret rotation, and TLS-enabled DB connections.
- Frontend integration expects `VITE_API_BASE_URL` (see `frontend/.env.example`).
