# Frontend - Quantum-Proof System Scanning

React + TypeScript frontend for the Quantum-Proof System Scanning platform.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Default local URL: `http://localhost:5173`

## Environment

Set backend base URL in `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## Available scripts

```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Authentication and modes

- App opens in Public View by default.
- Clicking Security Admin opens the login page.
- Security Admin can switch back to Public View from the top header.
