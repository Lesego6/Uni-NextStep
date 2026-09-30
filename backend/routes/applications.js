const crypto = require("crypto");
const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");
const { ensureSeededCatalog } = require("../utils/catalogSeed");
const { sendApplicationReceivedEmail, sendStatusEmail } = require("../utils/emailNotifications");

const router = express.Router();
const VALID_STATUSES = ["Pending", "Accepted", "Rejected"];
const REJECTION_REASONS = [
  "Space constraints",
  "Requirements not met",
  "Missing/incomplete documents",
  "Application closed",
  "Duplicate application",
  "Other"
];
const REQUIRED_DOCUMENT_TYPES = ["ID Document", "Latest Results", "Proof of Address"];
const MAX_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;
const REQUIRED_PROFILE_FIELDS = [
  "address_line1",
  "city",
  "province",
  "postal_code",
  "contact_number",
  "guardian_name",
  "guardian_contact"
];

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
  };
}

async function createReferenceNumber(executor = db) {
  let referenceNumber;
  let exists;
  do {
    referenceNumber = `APP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    exists = await executor.prepare("SELECT id FROM applications WHERE reference_number = ?").get(referenceNumber);
  } while (exists);
  return referenceNumber;
}

function mapApplication(row) {
  return {
    id: row.id,
    reference_number: row.reference_number,
    user_id: row.user_id,
    student_name: row.student_name,
    student_email: row.student_email,
    course_id: row.course_id,
    course_name: row.course_name,
    course_min_aps: row.course_min_aps ?? row.min_aps ?? null,
    university_id: row.university_id,
    university_name: row.university_name,
    status: row.status,
    rejection_reason: row.rejection_reason,
    status_note: row.status_note,
    status_updated_at: row.status_updated_at,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at
  };
}

function cleanText(value, maxLength = 255) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim().slice(0, maxLength);
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function mapApplicationProfile(row) {
  if (!row) {
    return null;
  }

  return {
    address_line1: row.address_line1 || "",
    address_line2: row.address_line2 || "",
    city: row.city || "",
    province: row.province || "",
    postal_code: row.postal_code || "",
    contact_number: row.contact_number || "",
    guardian_name: row.guardian_name || "",
    guardian_relationship: row.guardian_relationship || "",
    guardian_contact: row.guardian_contact || "",
    guardian_email: row.guardian_email || "",
    updated_at: row.updated_at
  };
}

function mapDocument(row, includeContent = false) {
  const document = {
    id: row.id,
    document_type: row.document_type,
    file_name: row.file_name,
    mime_type: row.mime_type,
    file_size: row.file_size,
    uploaded_at: row.uploaded_at
  };

  if (includeContent) {
    document.content_base64 = row.content_base64;
  }

  return document;
}

function parseMetadata(value) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function mapApplicationEvent(row) {
  return {
    id: row.id,
    application_id: row.application_id,
    actor_user_id: row.actor_user_id,
    actor_role: row.actor_role,
    event_type: row.event_type,
    title: row.title,
    message: row.message || "",
    metadata: parseMetadata(row.metadata_json),
    created_at: row.created_at
  };
}

function mapEmailLog(row) {
  return {
    id: row.id,
    application_id: row.application_id,
    recipient_email: row.recipient_email || "",
    template_id: row.template_id || "",
    email_type: row.email_type,
    status: row.status,
    status_label: row.status_label || "",
    error_message: row.error_message || "",
    created_at: row.created_at
  };
}

async function recordApplicationEvent(applicationId, event, executor = db) {
  await executor.prepare(`
    INSERT INTO application_events (
      application_id,
      actor_user_id,
      actor_role,
      event_type,
      title,
      message,
      metadata_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    applicationId,
    event.actor_user_id || null,
    event.actor_role || "system",
    event.event_type,
    event.title,
    event.message || null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );
}

async function recordEmailLog(applicationId, emailType, emailResult) {
  if (!emailResult) {
    return;
  }

  await db.prepare(`
    INSERT INTO application_email_logs (
      application_id,
      recipient_email,
      template_id,
      email_type,
      status,
      status_label,
      error_message
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    applicationId,
    emailResult.recipient_email || null,
    emailResult.template_id || null,
    emailType,
    emailResult.status || "unknown",
    emailResult.status_label || null,
    emailResult.error_message || null
  );
}

async function getApplicationEvents(applicationIds) {
  if (!applicationIds.length) {
    return new Map();
  }

  const placeholders = applicationIds.map(() => "?").join(", ");
  const rows = await db.prepare(`
    SELECT *
    FROM application_events
    WHERE application_id IN (${placeholders})
    ORDER BY created_at ASC, id ASC
  `).all(...applicationIds);

  return rows.reduce((eventsByApplication, row) => {
    const applicationEvents = eventsByApplication.get(row.application_id) || [];
    applicationEvents.push(mapApplicationEvent(row));
    eventsByApplication.set(row.application_id, applicationEvents);
    return eventsByApplication;
  }, new Map());
}

async function getApplicationEmailLogs(applicationId) {
  const rows = await db.prepare(`
    SELECT *
    FROM application_email_logs
    WHERE application_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(applicationId);

  return rows.map(mapEmailLog);
}

async function getApplicationProfile(userId, executor = db) {
  const row = await executor.prepare(`
    SELECT *
    FROM application_profiles
    WHERE user_id = ?
    LIMIT 1
  `).get(userId);

  return mapApplicationProfile(row);
}

async function getDocuments(userId, { includeContent = false, executor = db } = {}) {
  const rows = await executor.prepare(`
    SELECT id, document_type, file_name, mime_type, file_size, uploaded_at${includeContent ? ", content_base64" : ""}
    FROM application_documents
    WHERE user_id = ?
    ORDER BY uploaded_at DESC, id DESC
  `).all(userId);

  return rows.map((row) => mapDocument(row, includeContent));
}

async function getDocumentTypes(userId, executor = db) {
  const rows = await executor.prepare(`
    SELECT DISTINCT document_type
    FROM application_documents
    WHERE user_id = ?
  `).all(userId);

  return rows.map((row) => row.document_type);
}

function isApplicationProfileComplete(profile, documentTypes) {
  if (!profile) {
    return false;
  }

  const hasRequiredProfileFields = REQUIRED_PROFILE_FIELDS.every((field) => Boolean(cleanText(profile[field])));
  const uploadedTypes = new Set(documentTypes);
  const hasRequiredDocuments = REQUIRED_DOCUMENT_TYPES.every((type) => uploadedTypes.has(type));

  return hasRequiredProfileFields && hasRequiredDocuments;
}

function normalizeProfilePayload(payload = {}) {
  return {
    address_line1: cleanText(payload.address_line1),
    address_line2: cleanText(payload.address_line2),
    city: cleanText(payload.city, 120),
    province: cleanText(payload.province, 120),
    postal_code: cleanText(payload.postal_code, 20),
    contact_number: cleanText(payload.contact_number, 40),
    guardian_name: cleanText(payload.guardian_name, 160),
    guardian_relationship: cleanText(payload.guardian_relationship, 80),
    guardian_contact: cleanText(payload.guardian_contact, 40),
    guardian_email: cleanText(payload.guardian_email)
  };
}

function normalizeDocumentPayload(document = {}) {
  return {
    document_type: cleanText(document.document_type, 120),
    file_name: cleanText(document.file_name),
    mime_type: cleanText(document.mime_type, 120),
    file_size: Number(document.file_size),
    content_base64: String(document.content_base64 || "").replace(/^data:[^;]+;base64,/, "")
  };
}

function validateProfile(profile) {
  const missingFields = REQUIRED_PROFILE_FIELDS.filter((field) => !cleanText(profile[field]));

  if (missingFields.length > 0) {
    return "Please complete address, contact number, and guardian contact details.";
  }

  if (profile.guardian_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.guardian_email)) {
    return "Guardian email must be a valid email address.";
  }

  const phonePattern = /^[0-9+()\-\s]{7,20}$/;
  if (!phonePattern.test(profile.contact_number) || !phonePattern.test(profile.guardian_contact)) {
    return "Contact numbers must be 7 to 20 characters and may only include numbers, spaces, +, -, and brackets.";
  }

  if (!/^\d{4}$/.test(profile.postal_code)) {
    return "Postal code must be 4 digits.";
  }

  return "";
}

function validateDocuments(documents) {
  if (!Array.isArray(documents)) {
    return "Documents must be sent as a list.";
  }

  const uploadedTypes = new Set();

  for (const document of documents) {
    if (!document.document_type || !document.file_name || !document.mime_type || !document.content_base64) {
      return "Each uploaded document needs a type, file name, file type, and file content.";
    }

    if (!REQUIRED_DOCUMENT_TYPES.includes(document.document_type)) {
      return "Document type must be ID Document, Latest Results, or Proof of Address.";
    }

    if (!Number.isFinite(document.file_size) || document.file_size <= 0 || document.file_size > MAX_DOCUMENT_SIZE_BYTES) {
      return "Each document must be smaller than 2 MB.";
    }

    uploadedTypes.add(document.document_type);
  }

  const missingDocuments = REQUIRED_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type));
  if (missingDocuments.length > 0) {
    return `Please upload: ${missingDocuments.join(", ")}.`;
  }

  return "";
}

router.get("/profile-data", authenticateToken, requireRole("student"), async (req, res, next) => {
  try {
    const [profile, documents] = await Promise.all([
      getApplicationProfile(req.user.id),
      getDocuments(req.user.id, { includeContent: true })
    ]);

    res.json({
      profile,
      documents,
      required_documents: REQUIRED_DOCUMENT_TYPES
    });
  } catch (error) {
    next(error);
  }
});

router.put("/profile-data", authenticateToken, requireRole("student"), async (req, res, next) => {
  const body = req.body || {};
  const profile = normalizeProfilePayload(body.profile);
  const documents = Array.isArray(body.documents)
    ? body.documents.map(normalizeDocumentPayload)
    : [];

  const profileError = validateProfile(profile);
  if (profileError) {
    return res.status(400).json({ message: profileError });
  }

  const documentError = validateDocuments(documents);
  if (documentError) {
    return res.status(400).json({ message: documentError });
  }

  try {
    await db.transaction(async (tx) => {
      await tx.prepare(`
        INSERT INTO application_profiles (
          user_id,
          address_line1,
          address_line2,
          city,
          province,
          postal_code,
          contact_number,
          guardian_name,
          guardian_relationship,
          guardian_contact,
          guardian_email
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          address_line1 = VALUES(address_line1),
          address_line2 = VALUES(address_line2),
          city = VALUES(city),
          province = VALUES(province),
          postal_code = VALUES(postal_code),
          contact_number = VALUES(contact_number),
          guardian_name = VALUES(guardian_name),
          guardian_relationship = VALUES(guardian_relationship),
          guardian_contact = VALUES(guardian_contact),
          guardian_email = VALUES(guardian_email),
          updated_at = CURRENT_TIMESTAMP
      `).run(
        req.user.id,
        profile.address_line1,
        profile.address_line2 || null,
        profile.city,
        profile.province,
        profile.postal_code,
        profile.contact_number,
        profile.guardian_name,
        profile.guardian_relationship || null,
        profile.guardian_contact,
        profile.guardian_email || null
      );

      await tx.prepare("DELETE FROM application_documents WHERE user_id = ?").run(req.user.id);

      for (const document of documents) {
        await tx.prepare(`
          INSERT INTO application_documents (
            user_id,
            document_type,
            file_name,
            mime_type,
            file_size,
            content_base64
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          req.user.id,
          document.document_type,
          document.file_name,
          document.mime_type,
          document.file_size,
          document.content_base64
        );
      }
    });

    const [savedProfile, savedDocuments] = await Promise.all([
      getApplicationProfile(req.user.id),
      getDocuments(req.user.id, { includeContent: true })
    ]);

    res.json({
      message: "Application details saved successfully.",
      profile: savedProfile,
      documents: savedDocuments,
      required_documents: REQUIRED_DOCUMENT_TYPES
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticateToken, requireRole("student"), async (req, res, next) => {
    const submittedApplications = Array.isArray(req.body.applications) ? req.body.applications : [req.body];

    if (submittedApplications.length === 0) {
      return res.status(400).json({ message: "At least one application is required." });
    }

    const cleanedApplications = submittedApplications.map((application) => ({
      course_id: toPositiveInteger(application.course_id ?? application.courseId),
      university_id: toPositiveInteger(application.university_id ?? application.uniId)
    }));

    if (cleanedApplications.some(app => !app.course_id || !app.university_id)) {
      return res.status(400).json({ message: "Each application needs a valid course and university." });
    }

    try {
      await ensureSeededCatalog();

      const profile = await db.prepare(`
        SELECT aps_score FROM student_profiles WHERE user_id = ? LIMIT 1
      `).get(req.user.id);

      if (!profile) {
        return res.status(404).json({ message: "Student profile not found." });
      }

      const studentAps = Number(profile.aps_score || 0);
      const [applicationProfile, documentTypes] = await Promise.all([
        getApplicationProfile(req.user.id),
        getDocumentTypes(req.user.id)
      ]);

      if (!isApplicationProfileComplete(applicationProfile, documentTypes)) {
        return res.status(400).json({
          message: "Complete application details and upload the required documents before submitting."
        });
      }

      const result = await db.transaction(async (tx) => {
        const applications = [];
        const skipped = [];
        const seen = new Set();

        for (const app of cleanedApplications) {
          const pairKey = `${req.user.id}:${app.course_id}:${app.university_id}`;
          if (seen.has(pairKey)) {
            skipped.push({
              course_id: app.course_id,
              university_id: app.university_id,
              reason: "Duplicate in this submission"
            });
            continue;
          }
          seen.add(pairKey);

          const catalogEntry = await tx.prepare(`
            SELECT
              c.id AS course_id,
              c.name AS course_name,
              c.min_aps,
              u.id AS university_id,
              u.name AS university_name
            FROM courses c
            JOIN course_universities cu
              ON cu.course_id = c.id
            JOIN universities u
              ON u.id = cu.university_id
            WHERE c.id = ? AND u.id = ?
            LIMIT 1
          `).get(app.course_id, app.university_id);

          if (!catalogEntry) {
            skipped.push({
              course_id: app.course_id,
              university_id: app.university_id,
              reason: "This course is not offered by the selected university"
            });
            continue;
          }

          if (studentAps < Number(catalogEntry.min_aps)) {
            skipped.push({
              course_id: catalogEntry.course_id,
              course_name: catalogEntry.course_name,
              university_id: catalogEntry.university_id,
              university_name: catalogEntry.university_name,
              reason: `Minimum APS is ${catalogEntry.min_aps}`
            });
            continue;
          }

          const existing = await tx.prepare(`
            SELECT id FROM applications
            WHERE user_id = ? AND course_id = ? AND university_id = ?
            LIMIT 1
          `).get(req.user.id, app.course_id, app.university_id);

          if (existing) {
            skipped.push({
              course_id: catalogEntry.course_id,
              course_name: catalogEntry.course_name,
              university_id: catalogEntry.university_id,
              university_name: catalogEntry.university_name,
              reason: "You already applied for this course and university pair"
            });
            continue;
          }

          const referenceNumber = await createReferenceNumber(tx);
          const insertion = await tx.prepare(`
            INSERT INTO applications (reference_number, user_id, course_id, course_name, university_id, university_name)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            referenceNumber,
            req.user.id,
            catalogEntry.course_id,
            catalogEntry.course_name,
            catalogEntry.university_id,
            catalogEntry.university_name
          );

          const inserted = await tx.prepare("SELECT * FROM applications WHERE id = ?").get(insertion.lastInsertRowid);
          await recordApplicationEvent(insertion.lastInsertRowid, {
            actor_user_id: req.user.id,
            actor_role: "student",
            event_type: "submitted",
            title: "Application submitted",
            message: `${catalogEntry.course_name} at ${catalogEntry.university_name} was submitted.`,
            metadata: {
              course_id: catalogEntry.course_id,
              university_id: catalogEntry.university_id,
              reference_number: referenceNumber
            }
          }, tx);
          applications.push(mapApplication(inserted));
        }

        return { applications, skipped };
      });

      const message = result.applications.length === 0
        ? "No new applications were submitted."
        : result.skipped.length > 0
          ? "Applications submitted successfully. Some applications were skipped."
          : "Application submitted successfully.";

      if (result.applications.length > 0) {
        const student = await db.prepare(`
          SELECT first_name, last_name, email
          FROM users
          WHERE id = ?
          LIMIT 1
        `).get(req.user.id);
        const studentName = `${student?.first_name || ""} ${student?.last_name || ""}`.trim() || "Student";

        for (const application of result.applications) {
          const emailResult = await sendApplicationReceivedEmail({
            ...application,
            student_name: studentName,
            student_email: student?.email || req.user.email
          });
          await recordEmailLog(application.id, "application_received", emailResult);
        }
      }

      res.status(result.applications.length > 0 ? 201 : 200).json({
        message,
        applications: result.applications,
        skipped: result.skipped
      });
    } catch (error) {
      next(error);
    }
});

router.get("/my", authenticateToken, requireRole("student"), async (req, res, next) => {
    try {
      const rows = await db.prepare(`SELECT * FROM applications WHERE user_id = ? ORDER BY submitted_at DESC, id DESC`).all(req.user.id);
      const applications = rows.map(mapApplication);
      const eventsByApplication = await getApplicationEvents(applications.map((application) => application.id));
      res.json({
        applications: applications.map((application) => ({
          ...application,
          activity: eventsByApplication.get(application.id) || []
        }))
      });
    } catch (error) { next(error); }
});

router.get("/", authenticateToken, requireRole("admin"), async (req, res, next) => {
    const status = req.query.status;
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status must be Pending, Accepted, or Rejected." });
    }

    try {
      const baseQuery = `
        SELECT applications.*, CONCAT(users.first_name, ' ', users.last_name) AS student_name, users.email AS student_email
        FROM applications JOIN users ON users.id = applications.user_id
      `;
      const rows = status
        ? await db.prepare(`${baseQuery} WHERE applications.status = ? ORDER BY applications.submitted_at DESC`).all(status)
        : await db.prepare(`${baseQuery} ORDER BY applications.submitted_at DESC`).all();

      res.json({ applications: rows.map(mapApplication) });
    } catch (error) { next(error); }
});

router.get("/:id/details", authenticateToken, requireRole("admin"), async (req, res, next) => {
    const applicationId = Number(req.params.id);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({ message: "Invalid application ID." });
    }

    try {
      const application = await db.prepare(`
        SELECT
          applications.*,
          users.id AS student_id,
          users.first_name,
          users.last_name,
          users.email AS student_email,
          users.status AS account_status,
          CONCAT(users.first_name, ' ', users.last_name) AS student_name,
          student_profiles.grade,
          student_profiles.province AS school_province,
          student_profiles.school,
          student_profiles.aps_score,
          courses.min_aps AS course_min_aps
        FROM applications
        JOIN users
          ON users.id = applications.user_id
        LEFT JOIN student_profiles
          ON student_profiles.user_id = users.id
        LEFT JOIN courses
          ON courses.id = applications.course_id
        WHERE applications.id = ?
        LIMIT 1
      `).get(applicationId);

      if (!application) {
        return res.status(404).json({ message: "Application not found." });
      }

      const [profile, documents, documentTypes, eventsByApplication, emailLogs] = await Promise.all([
        getApplicationProfile(application.user_id),
        getDocuments(application.user_id, { includeContent: true }),
        getDocumentTypes(application.user_id),
        getApplicationEvents([application.id]),
        getApplicationEmailLogs(application.id)
      ]);

      res.json({
        application: mapApplication(application),
        student: {
          id: application.student_id,
          first_name: application.first_name,
          last_name: application.last_name,
          name: application.student_name,
          email: application.student_email,
          account_status: application.account_status,
          grade: application.grade,
          school: application.school,
          school_province: application.school_province,
          aps_score: Number(application.aps_score || 0)
        },
        profile,
        documents,
        required_documents: REQUIRED_DOCUMENT_TYPES,
        documents_complete: REQUIRED_DOCUMENT_TYPES.every((type) => documentTypes.includes(type)),
        activity: eventsByApplication.get(application.id) || [],
        email_logs: emailLogs
      });
    } catch (error) { next(error); }
});

router.patch("/:id/request-review", authenticateToken, requireRole("student"), async (req, res, next) => {
    const applicationId = Number(req.params.id);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({ message: "Invalid application ID." });
    }

    try {
      const application = await db.prepare(`
        SELECT
          applications.*,
          CONCAT(users.first_name, ' ', users.last_name) AS student_name,
          users.email AS student_email
        FROM applications
        JOIN users
          ON users.id = applications.user_id
        WHERE applications.id = ?
          AND applications.user_id = ?
        LIMIT 1
      `).get(applicationId, req.user.id);

      if (!application) {
        return res.status(404).json({ message: "Application not found." });
      }

      if (application.status !== "Rejected") {
        return res.status(400).json({ message: "Only rejected applications can be sent back for review." });
      }

      const [profile, documentTypes] = await Promise.all([
        getApplicationProfile(req.user.id),
        getDocumentTypes(req.user.id)
      ]);

      if (!isApplicationProfileComplete(profile, documentTypes)) {
        return res.status(400).json({
          message: "Complete your application details and upload all required documents before requesting review."
        });
      }

      await db.prepare(`
        UPDATE applications
        SET
          status = 'Pending',
          rejection_reason = NULL,
          status_note = NULL,
          status_updated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND user_id = ?
      `).run(applicationId, req.user.id);

      await recordApplicationEvent(applicationId, {
        actor_user_id: req.user.id,
        actor_role: "student",
        event_type: "review_requested",
        title: "Review requested",
        message: "The student updated their application details and requested another review."
      });

      const updatedApplication = await db.prepare(`
        SELECT
          applications.*,
          CONCAT(users.first_name, ' ', users.last_name) AS student_name,
          users.email AS student_email
        FROM applications
        JOIN users
          ON users.id = applications.user_id
        WHERE applications.id = ?
          AND applications.user_id = ?
        LIMIT 1
      `).get(applicationId, req.user.id);
      const mappedApplication = mapApplication(updatedApplication);

      const emailResult = await sendStatusEmail(mappedApplication);
      await recordEmailLog(applicationId, "status_update", emailResult);

      res.json({
        message: "Application sent back for review.",
        application: mappedApplication
      });
    } catch (error) {
      next(error);
    }
});

router.patch("/:id/status", authenticateToken, requireRole("admin"), async (req, res, next) => {
    const applicationId = Number(req.params.id);
    const body = req.body || {};
    const { status } = body;
    const rejectionReason = cleanText(body.rejection_reason);
    const statusNote = cleanText(body.status_note, 1000);

    if (!Number.isInteger(applicationId) || applicationId <= 0 || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid ID or Status." });
    }

    if (status === "Rejected" && !REJECTION_REASONS.includes(rejectionReason)) {
      return res.status(400).json({ message: "Choose a valid rejection reason." });
    }

    try {
      const result = await db.prepare(`
        UPDATE applications
        SET
          status = ?,
          rejection_reason = ?,
          status_note = ?,
          status_updated_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        status,
        status === "Rejected" ? rejectionReason : null,
        status === "Rejected" ? statusNote || null : null,
        applicationId
      );
      if (result.changes === 0) return res.status(404).json({ message: "Application not found." });

      const application = await db.prepare(`
          SELECT applications.*, CONCAT(users.first_name, ' ', users.last_name) AS student_name, users.email AS student_email
          FROM applications JOIN users ON users.id = applications.user_id WHERE applications.id = ?
        `).get(applicationId);
      const mappedApplication = mapApplication(application);

      await recordApplicationEvent(applicationId, {
        actor_user_id: req.user.id,
        actor_role: "admin",
        event_type: "status_updated",
        title: `Status changed to ${status}`,
        message: status === "Rejected"
          ? `${rejectionReason}${statusNote ? ` - ${statusNote}` : ""}`
          : `Application status changed to ${status}.`,
        metadata: {
          status,
          rejection_reason: status === "Rejected" ? rejectionReason : null,
          status_note: status === "Rejected" ? statusNote || null : null
        }
      });

      const emailResult = await sendStatusEmail(mappedApplication);
      await recordEmailLog(applicationId, "status_update", emailResult);

      res.json({ message: "Application status updated successfully.", application: mappedApplication });
    } catch (error) { next(error); }
});

module.exports = router;
