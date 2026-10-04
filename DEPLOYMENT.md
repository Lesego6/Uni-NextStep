# Deployment Guide

Recommended free/demo stack:

- Frontend: Vercel
- Backend: Render Web Service
- Database: Aiven MySQL

This keeps the current React/Vite + Express + MySQL architecture.

## 1. Push To GitHub

Create a GitHub repository and push this project.

Do not commit local `.env` files.

## 2. Create Aiven MySQL

Create a free MySQL service on Aiven and copy:

- Host
- Port
- User
- Password
- Database name

Use the existing Aiven database name for `DB_NAME`. For Aiven, set:

```env
DB_CREATE_DATABASE=false
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

For a stricter SSL setup, paste Aiven's CA certificate into `DB_SSL_CA` and keep:

```env
DB_SSL_REJECT_UNAUTHORIZED=true
```

If you paste the CA certificate into an environment variable, replace line breaks with `\n`.

## 3. Deploy Backend On Render

Create a new Render Blueprint from the repository, or create a Web Service manually.

The repository includes [render.yaml](render.yaml), which tells Render:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

Set these Render environment variables:

```env
NODE_ENV=production
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=replace-with-a-strong-admin-password
CORS_ORIGIN=https://your-vercel-app.vercel.app
DB_HOST=your-aiven-host
DB_PORT=your-aiven-port
DB_USER=your-aiven-user
DB_PASSWORD=your-aiven-password
DB_NAME=your-aiven-database
DB_CREATE_DATABASE=false
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
EMAILJS_SERVICE_ID=your-emailjs-service-id
EMAILJS_TEMPLATE_ID=your-application-received-template-id
EMAILJS_STATUS_TEMPLATE_ID=your-status-update-template-id
EMAILJS_PUBLIC_KEY=your-emailjs-public-key
EMAILJS_PRIVATE_KEY=your-emailjs-private-key
```

After deploy, test:

```text
https://your-render-service.onrender.com/health
https://your-render-service.onrender.com/ready
```

`/health` confirms the API is running. `/ready` confirms MySQL is reachable.

## 4. Deploy Frontend On Vercel

Import the same GitHub repository into Vercel.

The repository includes [vercel.json](vercel.json), which tells Vercel:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- SPA fallback rewrite for React Router

Set this Vercel environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

Deploy the frontend.

## 5. Update CORS

After Vercel gives you the final frontend URL, go back to Render and update:

```env
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

If you need both local and hosted frontend access, use a comma-separated list:

```env
CORS_ORIGIN=http://localhost:3000,https://your-vercel-app.vercel.app
```

Redeploy or restart the Render backend after changing CORS.

## 6. Demo Checklist

Before presenting:

1. Open the backend health URL so Render wakes up.
2. Open the frontend URL.
3. Log in as admin using `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
4. Register or log in as a student.
5. Run through APS, documents, application submission, admin review, notifications, and tracker.

Render free services can sleep after inactivity, so the first request can be slow.

## Troubleshooting

### CORS Error

Check that `CORS_ORIGIN` exactly matches the frontend URL, including `https://`.

### Database Connection Error

Check:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSL=true`

For Aiven, `DB_CREATE_DATABASE=false` is usually safest because the database already exists.

### Login Works Locally But Not Hosted

Check:

- `JWT_SECRET` is set on Render.
- `NODE_ENV=production` is set on Render.
- Frontend `VITE_API_URL` points to the Render backend `/api`.

### EmailJS Fails On Render

In EmailJS account security, allow API access from non-browser/server environments, or use the private key setup already supported by this backend.
