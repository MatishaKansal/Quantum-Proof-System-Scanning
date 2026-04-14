# Quantum-Proof System Scanning

Enterprise-oriented platform for assessing TLS/cryptographic exposure, tracking quantum-readiness, and planning migration to post-quantum cryptography.

## Repository structure

- `backend/` - Node.js REST API (Express)
- `frontend/` - React + TypeScript (Vite)

## Key features

- Asset inventory and discovery workflows
- TLS and cryptographic posture analysis
- Quantum risk scoring and readiness labels
- Dashboard analytics and report exports (JSON/CSV/XML)
- Security Admin authentication and role-based access control
- Security Admin management: only a Security Admin can create another Security Admin
- Public View and Security Admin mode switching in UI

## Tech stack

- Backend: Node.js, Express, pg, pg-mem
- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui

## Prerequisites

- Node.js 18+
- npm 9+

## Local setup

### 1) Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Backend runs on: `http://localhost:4000`

Optional persistent database:

```bash
set DATABASE_URL=postgres://postgres:postgres@localhost:5432/pnb
```

If `DATABASE_URL` is not set, backend uses in-memory `pg-mem`.

### 2) Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on: `http://localhost:5173`

Make sure `VITE_API_BASE_URL` points to backend API, for example:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## Demo users

- Security Admin: `admin` / `admin@123`
- Checker (Public View default session): `checker` / `checker123`
- Auditor: `auditor` / `auditor123`

## Security and access flow

- App opens in Public View by default.
- Choosing Security Admin from header opens login.
- After successful Security Admin login, privileged actions are enabled.
- Security Admin can switch back to Public View from header.
- Creating new Security Admin users is restricted to Security Admin role.

## Scripts

### Backend

```bash
npm run dev
npm test
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run test
npm run lint
```

## API quick links

- Health: `GET /api/health`
- Login: `POST /api/auth/login`
- Current user: `GET /api/auth/me`
- Create Security Admin: `POST /api/auth/security-admins`
- Assets: `GET /api/assets`
- Run scan: `POST /api/scans/run`
- Dashboard summary: `GET /api/dashboard/summary`
- Latest report: `GET /api/reports/latest`

## Notes

- This repository currently tracks both frontend and backend in a single repo.
- Keep secrets in `.env` files only; do not commit production secrets.