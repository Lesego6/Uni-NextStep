# EmailJS Templates

Create two EmailJS templates and paste the matching HTML file into each template body.

For both templates, use:

```text
To Email: {{to_email}}
To Name: {{to_name}}
Subject: {{subject_line}}
From Name: Uni NextStep
```

Then set the template IDs in `backend/.env`:

```env
EMAILJS_TEMPLATE_ID=your_received_template_id
EMAILJS_STATUS_TEMPLATE_ID=your_status_update_template_id
EMAILJS_ACCEPTED_TEMPLATE_ID=
EMAILJS_REJECTED_TEMPLATE_ID=
EMAILJS_PENDING_TEMPLATE_ID=
```

`EMAILJS_TEMPLATE_ID` is used for application received emails. `EMAILJS_STATUS_TEMPLATE_ID` is used for accepted, rejected, and pending status updates.

The accepted/rejected/pending template IDs are still supported as optional overrides if you later want separate status templates.

## Template Map

| Email | HTML File | Env Variable |
|---|---|---|
| Application received | `received.html` | `EMAILJS_TEMPLATE_ID` |
| Accepted, rejected, pending | `status-update.html` | `EMAILJS_STATUS_TEMPLATE_ID` |
