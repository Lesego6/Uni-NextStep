const EMAILJS_SEND_URL = "https://api.emailjs.com/api/v1.0/email/send";

const STATUS_TEMPLATE_KEYS = {
  accepted: "EMAILJS_ACCEPTED_TEMPLATE_ID",
  rejected: "EMAILJS_REJECTED_TEMPLATE_ID",
  pending: "EMAILJS_PENDING_TEMPLATE_ID"
};

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function formatStatus(status) {
  const normalized = normalizeStatus(status);
  if (!normalized) {
    return "Updated";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStatusTemplateId(status) {
  const statusTemplateKey = STATUS_TEMPLATE_KEYS[normalizeStatus(status)];
  return (
    (statusTemplateKey && process.env[statusTemplateKey]) ||
    process.env.EMAILJS_STATUS_TEMPLATE_ID ||
    process.env.EMAILJS_TEMPLATE_ID
  );
}

function getReceivedTemplateId() {
  return process.env.EMAILJS_RECEIVED_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
}

function isConfigured(templateId) {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
    templateId &&
    process.env.EMAILJS_PUBLIC_KEY
  );
}

function createEmailResult({ status, templateId, application, statusLabel, errorMessage = "" }) {
  return {
    status,
    template_id: templateId || "",
    recipient_email: getRecipientEmail(application),
    status_label: statusLabel,
    error_message: errorMessage
  };
}

function getStatusCopy(application) {
  const status = normalizeStatus(application.status);

  if (status === "accepted") {
    return {
      title: "Application accepted",
      message: "Congratulations. Your application has been marked as accepted.",
      detailTitle: "Next step",
      detail: "Keep checking your email and phone for any follow-up instructions from the admissions team."
    };
  }

  if (status === "rejected") {
    const reason = application.rejection_reason || "Not specified";
    const note = application.status_note ? ` ${application.status_note}` : "";

    return {
      title: "Application rejected",
      message: "Your application has been reviewed and was not successful.",
      detailTitle: "Reason",
      detail: `${reason}.${note}`.trim()
    };
  }

  return {
    title: "Application under review",
    message: "Your application status has been moved back to pending.",
    detailTitle: "What this means",
    detail: "The admissions team is still reviewing your application."
  };
}

function getReceivedCopy() {
  return {
    title: "Application received",
    message: "We received your Uni NextStep application.",
    detailTitle: "What happens next",
    detail: "Your application is now pending review. We will email you when the status changes."
  };
}

function getRecipientEmail(application) {
  return String(
    application.student_email ||
    application.to_email ||
    application.email ||
    application.user_email ||
    ""
  ).trim().toLowerCase();
}

function getRecipientName(application) {
  return String(application.student_name || application.to_name || "Student").trim();
}

async function sendEmail(templateId, application, copy, statusLabel) {
  if (!isConfigured(templateId)) {
    const errorMessage = "EmailJS email skipped because EMAILJS_* environment variables are not configured.";
    console.warn(errorMessage);
    return createEmailResult({
      status: "skipped",
      templateId,
      application,
      statusLabel,
      errorMessage
    });
  }

  const recipientEmail = getRecipientEmail(application);
  const recipientName = getRecipientName(application);

  if (!recipientEmail) {
    const errorMessage = `EmailJS email skipped because recipient email is missing for application ${application.reference_number || "unknown"}.`;
    console.warn(errorMessage);
    return createEmailResult({
      status: "skipped",
      templateId,
      application,
      statusLabel,
      errorMessage
    });
  }

  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: templateId,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email: recipientEmail,
      email: recipientEmail,
      user_email: recipientEmail,
      recipient_email: recipientEmail,
      to_name: recipientName,
      name: recipientName,
      user_name: recipientName,
      reference_number: application.reference_number,
      course_name: application.course_name,
      university_name: application.university_name,
      status: statusLabel,
      status_label: statusLabel,
      status_title: copy.title,
      status_message: copy.message,
      status_detail_title: copy.detailTitle,
      status_detail: copy.detail,
      rejection_reason: application.rejection_reason || "",
      status_note: application.status_note || "",
      subject_line: `Uni NextStep application ${application.reference_number}: ${statusLabel}`
    }
  };

  if (process.env.EMAILJS_PRIVATE_KEY) {
    payload.accessToken = process.env.EMAILJS_PRIVATE_KEY;
  }

  try {
    const response = await fetch(EMAILJS_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      const errorMessage = `${response.status} ${text}`;
      console.warn(`EmailJS email failed: ${errorMessage}`);
      return createEmailResult({
        status: "failed",
        templateId,
        application,
        statusLabel,
        errorMessage
      });
    }

    return createEmailResult({
      status: "sent",
      templateId,
      application,
      statusLabel
    });
  } catch (error) {
    console.warn("EmailJS email failed:", error.message);
    return createEmailResult({
      status: "failed",
      templateId,
      application,
      statusLabel,
      errorMessage: error.message
    });
  }
}

async function sendApplicationReceivedEmail(application) {
  return await sendEmail(getReceivedTemplateId(), application, getReceivedCopy(), "Received");
}

async function sendStatusEmail(application) {
  const statusLabel = formatStatus(application.status);
  return await sendEmail(getStatusTemplateId(application.status), application, getStatusCopy(application), statusLabel);
}

module.exports = { sendApplicationReceivedEmail, sendStatusEmail };
