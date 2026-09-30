# Uni NextStep

A South African university guidance platform built with React, Vite, and a MySQL-backed Express API.

## What it does

- Calculates APS using the backend as the source of truth: Life Orientation is excluded, marks are sorted descending, and only the top six eligible subjects count.
- Lists courses and universities from a seeded catalog, with metadata including field and minimum APS.
- Lets students apply to matching programmes and track submission status.
- Collects application contact details, guardian information, and required documents before submission.
- Lets admins manage users, review applications, and generate reports.
- Sends EmailJS status emails when admins update an application.

## Stack

- React 18 + Vite
- Tailwind CSS
- React Router DOM
- Express + MySQL
- JWT cookie auth

## Local setup

```bash
npm install
npm run dev
```

Then run the API in a second terminal:

```bash
cd backend
npm install
npm run dev
```

## Environment variables

Copy the examples and add your local database credentials:

- [.env.example](.env.example)
- [backend/.env.example](backend/.env.example)

Required DB variables include:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Optional EmailJS variables for status update emails:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_RECEIVED_TEMPLATE_ID`
- `EMAILJS_ACCEPTED_TEMPLATE_ID`
- `EMAILJS_REJECTED_TEMPLATE_ID`
- `EMAILJS_PENDING_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`

`EMAILJS_TEMPLATE_ID` is the default template. The specific template IDs are optional; when set, the backend uses them for application received, accepted, rejected, and pending emails.

The EmailJS template can use these parameters: `to_email`, `to_name`, `reference_number`, `course_name`, `university_name`, `status`, `status_label`, `status_title`, `status_message`, `status_detail_title`, `status_detail`, `rejection_reason`, `status_note`, and `subject_line`.

## Email Template

Use `{{to_email}}` as the template recipient and `{{subject_line}}` as the subject. Ready-to-use HTML templates live in [emailjs-templates](emailjs-templates). A simple HTML body can use the status-aware variables:

```html
<div style="font-family: Arial, sans-serif; background:#f4f7fb; padding:32px;">
  <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:12px; border:1px solid #e5e7eb; overflow:hidden;">
    <div style="background:#1A3A6B; color:#ffffff; padding:22px 28px;">
      <h2 style="margin:0;">Uni NextStep</h2>
      <p style="margin:6px 0 0; color:#dbeafe;">{{status_title}}</p>
    </div>
    <div style="padding:28px; color:#1f2937;">
      <p>Hi {{to_name}},</p>
      <p>{{status_message}}</p>
      <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; padding:16px; margin:22px 0;">
        <p><strong>Reference:</strong> {{reference_number}}</p>
        <p><strong>Course:</strong> {{course_name}}</p>
        <p><strong>University:</strong> {{university_name}}</p>
        <p><strong>Status:</strong> {{status_label}}</p>
      </div>
      <div style="background:#f0fdfa; border:1px solid #99f6e4; border-radius:10px; padding:16px; margin:22px 0;">
        <p><strong>{{status_detail_title}}:</strong> {{status_detail}}</p>
      </div>
      <p>Regards,<br />Uni NextStep</p>
    </div>
  </div>
</div>
```

## Security Notes

Local `.env` files are ignored by git. If real values are ever shared in screenshots, commits, or messages, rotate `JWT_SECRET`, `ADMIN_PASSWORD`, `DB_PASSWORD`, `EMAILJS_PRIVATE_KEY`, and any affected EmailJS keys.

## Database bootstrap

The API bootstraps MySQL on startup through [backend/database.js](backend/database.js). It waits for the schema to be ready before serving traffic and seeds the catalog tables when empty.

## Tests

The backend includes Node tests for the APS logic in [backend/test/aps.test.js](backend/test/aps.test.js):

```bash
cd backend
npm test
```

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/auth` | Student login/register |
| `/dashboard` | Student dashboard |
| `/calculator` | APS calculator |
| `/courses` | Course catalog |
| `/universities` | University browser |
| `/documents` | Application details and document uploads |
| `/apply` | Application flow |
| `/track` | Student application tracker |
| `/admin` | Admin login |
| `/admin/users` | User management |
| `/admin/applications` | Application management |
| `/admin/reports` | Reports |

## Notes

- APS rules vary by institution and programme, so the app uses the backend for the final score calculation.
- Admin credentials are created only when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are configured.
