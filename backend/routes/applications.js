const crypto = require("crypto");
const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();
const VALID_STATUSES = ["Pending", "Accepted", "Rejected"];

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action."
      });
    }

    next();
  };
}

function createReferenceNumber() {
  let referenceNumber;
  let exists;

  do {
    referenceNumber = `APP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    exists = db
      .prepare("SELECT id FROM applications WHERE reference_number = ?")
      .get(referenceNumber);
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
    university_id: row.university_id,
    university_name: row.university_name,
    status: row.status,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at
  };
}

function normalizeSubmittedApplications(body) {
  if (Array.isArray(body.applications)) {
    return body.applications;
  }

  return [body];
}

router.post(
  "/",
  authenticateToken,
  requireRole("student"),
  (req, res) => {
    const submittedApplications = normalizeSubmittedApplications(req.body);

    if (submittedApplications.length === 0) {
      return res.status(400).json({
        message: "At least one application is required."
      });
    }

    const cleanedApplications = submittedApplications.map((application) => ({
      course_id: application.course_id ?? application.courseId ?? null,
      course_name: application.course_name || application.courseName,
      university_id: application.university_id ?? application.uniId ?? null,
      university_name: application.university_name || application.universityName
    }));

    const invalidApplication = cleanedApplications.find((application) => (
      !application.course_name || !application.university_name
    ));

    if (invalidApplication) {
      return res.status(400).json({
        message: "Each application needs a course name and university name."
      });
    }

    try {
      const insertApplication = db.prepare(`
        INSERT INTO applications (
          reference_number,
          user_id,
          course_id,
          course_name,
          university_id,
          university_name
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const createApplications = db.transaction((applications) => {
        return applications.map((application) => {
          const referenceNumber = createReferenceNumber();
          const result = insertApplication.run(
            referenceNumber,
            req.user.id,
            application.course_id,
            application.course_name.trim(),
            application.university_id,
            application.university_name.trim()
          );

          return db
            .prepare("SELECT * FROM applications WHERE id = ?")
            .get(result.lastInsertRowid);
        });
      });

      const applications = createApplications(cleanedApplications).map(mapApplication);

      res.status(201).json({
        message: "Application submitted successfully.",
        applications
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Something went wrong while submitting applications."
      });
    }
  }
);

router.get(
  "/my",
  authenticateToken,
  requireRole("student"),
  (req, res) => {
    try {
      const applications = db
        .prepare(`
          SELECT *
          FROM applications
          WHERE user_id = ?
          ORDER BY submitted_at DESC, id DESC
        `)
        .all(req.user.id)
        .map(mapApplication);

      res.json({ applications });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Something went wrong while fetching applications."
      });
    }
  }
);

router.get(
  "/",
  authenticateToken,
  requireRole("admin"),
  (req, res) => {
    const status = req.query.status;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Status must be Pending, Accepted, or Rejected."
      });
    }

    try {
      const baseQuery = `
        SELECT
          applications.*,
          users.first_name || ' ' || users.last_name AS student_name,
          users.email AS student_email
        FROM applications
        JOIN users
          ON users.id = applications.user_id
      `;

      const rows = status
        ? db
            .prepare(`${baseQuery} WHERE applications.status = ? ORDER BY applications.submitted_at DESC, applications.id DESC`)
            .all(status)
        : db
            .prepare(`${baseQuery} ORDER BY applications.submitted_at DESC, applications.id DESC`)
            .all();

      res.json({
        applications: rows.map(mapApplication)
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Something went wrong while fetching applications."
      });
    }
  }
);

router.patch(
  "/:id/status",
  authenticateToken,
  requireRole("admin"),
  (req, res) => {
    const applicationId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        message: "Invalid application id."
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Status must be Pending, Accepted, or Rejected."
      });
    }

    try {
      const result = db
        .prepare(`
          UPDATE applications
          SET status = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .run(status, applicationId);

      if (result.changes === 0) {
        return res.status(404).json({
          message: "Application not found."
        });
      }

      const application = db
        .prepare(`
          SELECT
            applications.*,
            users.first_name || ' ' || users.last_name AS student_name,
            users.email AS student_email
          FROM applications
          JOIN users
            ON users.id = applications.user_id
          WHERE applications.id = ?
        `)
        .get(applicationId);

      res.json({
        message: "Application status updated successfully.",
        application: mapApplication(application)
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Something went wrong while updating application status."
      });
    }
  }
);

module.exports = router;
