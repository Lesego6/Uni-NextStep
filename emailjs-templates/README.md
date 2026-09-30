# EmailJS Templates

Create two EmailJS templates:

- Application received: use `received.html` and set `EMAILJS_TEMPLATE_ID` or `EMAILJS_RECEIVED_TEMPLATE_ID`.
- Status update: use `status-update.html` and set `EMAILJS_STATUS_TEMPLATE_ID`.

In EmailJS, set the recipient field to `{{to_email}}` and the subject to `{{subject_line}}`.
