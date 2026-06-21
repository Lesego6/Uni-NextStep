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
- Mock data (no backend required)

## Getting Started

```bash
npm install
npm run dev
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

## Mock Credentials

- **Student**: any email + password → redirects to dashboard
- **Admin**: any email + password on `/admin` → redirects to admin panel

## Design System

- Primary: Deep navy `#1A3A6B`
- Accent: Teal `#00B4A6`
- Background: `#F8FAFC`
- Mobile-first (380px+)
- Clean gov-tech/edtech aesthetic
