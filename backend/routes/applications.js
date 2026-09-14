const crypto = require("crypto");
const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();
const VALID_STATUSES = ["Pending", "Accepted", "Rejected"];

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
    university_id: row.university_id,
    university_name: row.university_name,
    status: row.status,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at
  };
}

router.post("/", authenticateToken, requireRole("student"), async (req, res, next) => {
    const submittedApplications = Array.isArray(req.body.applications) ? req.body.applications : [req.body];

    if (submittedApplications.length === 0) {
      return res.status(400).json({ message: "At least one application is required." });
    }

    const cleanedApplications = submittedApplications.map((application) => ({
      course_id: application.course_id ?? application.courseId ?? null,
      course_name: application.course_name || application.courseName,
      university_id: application.university_id ?? application.uniId ?? null,
      university_name: application.university_name || application.universityName
    }));

    if (cleanedApplications.some(app => !app.course_name || !app.university_name || !app.course_id || !app.university_id)) {
      return res.status(400).json({ message: "Each application needs a course, university, course name, and university name." });
    }

    try {
      const result = await db.transaction(async (tx) => {
        const applications = [];
        const skipped = [];
        const seen = new Set();

        for (const app of cleanedApplications) {
          const pairKey = `${req.user.id}:${app.course_id}:${app.university_id}`;
          if (seen.has(pairKey)) {
            skipped.push({
              course_id: app.course_id,
              course_name: app.course_name,
              university_id: app.university_id,
              university_name: app.university_name,
              reason: "Duplicate in this submission"
            });
            continue;
          }
          seen.add(pairKey);

          const existing = await tx.prepare(`
            SELECT id FROM applications
            WHERE user_id = ? AND course_id = ? AND university_id = ?
            LIMIT 1
          `).get(req.user.id, app.course_id, app.university_id);

          if (existing) {
            skipped.push({
              course_id: app.course_id,
              course_name: app.course_name,
              university_id: app.university_id,
              university_name: app.university_name,
              reason: "You already applied for this course and university pair"
            });
            continue;
          }

          const referenceNumber = await createReferenceNumber(tx);
          const insertion = await tx.prepare(`
            INSERT INTO applications (reference_number, user_id, course_id, course_name, university_id, university_name)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(referenceNumber, req.user.id, app.course_id, app.course_name.trim(), app.university_id, app.university_name.trim());

          const inserted = await tx.prepare("SELECT * FROM applications WHERE id = ?").get(insertion.lastInsertRowid);
          applications.push(mapApplication(inserted));
        }

        return { applications, skipped };
      });

      const message = result.skipped.length > 0
        ? "Applications submitted successfully. Some duplicate applications were skipped."
        : "Application submitted successfully.";

      res.status(201).json({
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
      res.json({ applications: rows.map(mapApplication) });
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

router.patch("/:id/status", authenticateToken, requireRole("admin"), async (req, res, next) => {
    const applicationId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(applicationId) || applicationId <= 0 || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid ID or Status." });
    }

    try {
      const result = await db.prepare(`UPDATE applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, applicationId);
      if (result.changes === 0) return res.status(404).json({ message: "Application not found." });

      const application = await db.prepare(`
          SELECT applications.*, CONCAT(users.first_name, ' ', users.last_name) AS student_name, users.email AS student_email
          FROM applications JOIN users ON users.id = applications.user_id WHERE applications.id = ?
        `).get(applicationId);

      res.json({ message: "Application status updated successfully.", application: mapApplication(application) });
    } catch (error) { next(error); }
});

module.exports = router;