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

function getTemplateId(status) {
  const statusTemplateKey = STATUS_TEMPLATE_KEYS[normalizeStatus(status)];
  return (statusTemplateKey && process.env[statusTemplateKey]) || process.env.EMAILJS_TEMPLATE_ID;
}

function isConfigured(status) {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
    getTemplateId(status) &&
    process.env.EMAILJS_PUBLIC_KEY
  );
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

async function sendStatusEmail(application) {
  if (!isConfigured(application.status)) {
    console.warn("EmailJS status email skipped because EMAILJS_* environment variables are not configured.");
    return;
  }

  const statusLabel = formatStatus(application.status);
  const copy = getStatusCopy(application);
  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: getTemplateId(application.status),
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: {
      to_email: application.student_email,
      to_name: application.student_name,
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
      console.warn(`EmailJS status email failed: ${response.status} ${text}`);
    }
  } catch (error) {
    console.warn("EmailJS status email failed:", error.message);
  }
}

module.exports = { sendStatusEmail };
