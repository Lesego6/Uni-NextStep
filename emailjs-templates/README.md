# EmailJS Templates

Create four EmailJS templates and paste the matching HTML file into each template body.

For all three templates, use:

```text
To Email: {{to_email}}
To Name: {{to_name}}
Subject: {{subject_line}}
From Name: Uni NextStep
```

Then set the template IDs in `backend/.env`:

```env
EMAILJS_ACCEPTED_TEMPLATE_ID=your_accepted_template_id
EMAILJS_REJECTED_TEMPLATE_ID=your_rejected_template_id
EMAILJS_PENDING_TEMPLATE_ID=your_pending_template_id
EMAILJS_RECEIVED_TEMPLATE_ID=your_received_template_id
```

The backend falls back to `EMAILJS_TEMPLATE_ID` if a status-specific template ID is blank.

## Template Map

| Status | HTML File | Env Variable |
|---|---|---|
| Application received | `received.html` | `EMAILJS_RECEIVED_TEMPLATE_ID` |
| Accepted | `accepted.html` | `EMAILJS_ACCEPTED_TEMPLATE_ID` |
| Rejected | `rejected.html` | `EMAILJS_REJECTED_TEMPLATE_ID` |
| Pending | `pending.html` | `EMAILJS_PENDING_TEMPLATE_ID` |
