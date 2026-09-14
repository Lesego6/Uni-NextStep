# Uni NextStep

A South African university guidance application built with React + Tailwind CSS.

## Features

- **APS Calculator** — Calculate Admission Point Score using official NSC conversions
- **Course Matching** — Find courses you qualify for based on your APS
- **University Browser** — Explore all 26 SA universities with course listings
- **Application System** — Apply to multiple universities through one interface
- **Status Tracking** — Monitor application status (Pending/Accepted/Rejected)
- **Admin Portal** — User management and report generation

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- React Router DOM
- Lucide React icons
- Mock data 

## Getting Started

```bash
npm install
npm run dev
```

In a second terminal, start the backend:

```bash
cd backend
npm install
npm run dev
```

## MySQL setup

The backend expects a local MySQL connection configured through the environment variables in [backend/.env.example](backend/.env.example) and [.env.example](.env.example). The repository includes a database bootstrap in [backend/database.js](backend/database.js) that creates the configured `DB_NAME` and imports the schema from [backend/db/mysql.example.sql](backend/db/mysql.example.sql) when the backend starts.

## Production secret handling

Do not commit or track real values such as `JWT_SECRET`, `ADMIN_PASSWORD`, or `DB_PASSWORD`. In production, supply those values through a secret manager or deployment environment variable injection. A safe local pattern is to copy [.env.example](.env.example) or [backend/.env.example](backend/.env.example) to a workspace-local `.env` file and never commit it.

## Admin bootstrap

The backend bootstraps the admin user only when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are present in the environment. The default hardcoded fallback is removed to avoid insecure production assumptions.

## Automated tests

The backend now includes a Node test smoke check in [backend/test/database-smoke.test.js](backend/test/database-smoke.test.js). Run it with:

```bash
cd backend
npm test
```

## Routes

| Route | Page |
|-------|------|
| `/` | Landing Page |
| `/auth` | Login / Register |
| `/dashboard` | Student Dashboard |
| `/calculator` | APS Calculator |
| `/courses` | Course Recommendations |
| `/universities` | University Browser |
| `/apply` | Application Page |
| `/track` | Application Tracker |
| `/admin` | Admin Login |
| `/admin/users` | User Management |
| `/admin/reports` | Reports |

## Test Credentials

- **Student**: register a new account from `/auth`
- **Admin**: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your local or production environment before running the backend

The backend bootstraps an admin user only when the configured admin environment variables are present.

## Design System

- Primary: Deep navy `#1A3A6B`
- Accent: Teal `#00B4A6`
- Background: `#F8FAFC`
- Mobile-first (380px+)
- Clean gov-tech/edtech aesthetic
