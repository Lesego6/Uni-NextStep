const bcrypt = require("bcrypt");
const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();
const VALID_ROLES = ["student", "admin"];
const VALID_STATUSES = ["Active", "Inactive"];

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access is required."
    });
  }

  next();
}

function normalizeRole(role) {
  const normalizedRole = String(role || "student").trim().toLowerCase();
  return VALID_ROLES.includes(normalizedRole) ? normalizedRole : null;
}

function normalizeStatus(status) {
  const normalizedStatus = String(status || "Active").trim();
  return VALID_STATUSES.includes(normalizedStatus) ? normalizedStatus : null;
}

function splitName(name, firstName, lastName) {
  if (firstName && lastName) {
    return {
      first_name: firstName.trim(),
      last_name: lastName.trim()
    };
  }

  const nameParts = String(name || "").trim().split(/\s+/);

  return {
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ")
  };
}

function mapUser(row) {
  const roleLabel = row.role === "admin" ? "Admin" : "Student";
  const displayPrefix = row.role === "admin" ? "ADM" : "STU";

  return {
    id: row.id,
    display_id: `${displayPrefix}-${String(row.id).padStart(3, "0")}`,
    first_name: row.first_name,
    last_name: row.last_name,
    name: `${row.first_name} ${row.last_name}`.trim(),
    email: row.email,
    role: roleLabel,
    role_key: row.role,
    grade: row.grade || null,
    aps: row.role === "student" ? row.aps_score ?? 0 : "-",
    applications: row.role === "student" ? row.application_count ?? 0 : "-",
    status: row.status || "Active",
    created_at: row.created_at
  };
}

function getUserById(id) {
  return db
    .prepare(`
      SELECT
        users.id,
        users.first_name,
        users.last_name,
        users.email,
        users.role,
        users.status,
        users.created_at,
        student_profiles.grade,
        student_profiles.aps_score,
        COUNT(applications.id) AS application_count
      FROM users
      LEFT JOIN student_profiles
        ON student_profiles.user_id = users.id
      LEFT JOIN applications
        ON applications.user_id = users.id
      WHERE users.id = ?
      GROUP BY users.id
    `)
    .get(id);
}

function dateFilters(column, startDate, endDate) {
  const filters = [];
  const params = [];

  if (startDate) {
    filters.push(`date(${column}) >= date(?)`);
    params.push(startDate);
  }

  if (endDate) {
    filters.push(`date(${column}) <= date(?)`);
    params.push(endDate);
  }

  return {
    clause: filters.length ? `WHERE ${filters.join(" AND ")}` : "",
    params
  };
}

function isValidDate(value) {
  if (!value) {
    return true;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

router.use(authenticateToken, requireAdmin);

router.get("/users", (req, res) => {
  const role = req.query.role ? normalizeRole(req.query.role) : null;
  const search = String(req.query.search || "").trim().toLowerCase();

  if (req.query.role && !role) {
    return res.status(400).json({
      message: "Role must be student or admin."
    });
  }

  try {
    const filters = [];
    const params = [];

    if (role) {
      filters.push("users.role = ?");
      params.push(role);
    }

    if (search) {
      filters.push(`
        (
          lower(users.first_name || ' ' || users.last_name) LIKE ?
          OR lower(users.email) LIKE ?
          OR users.id LIKE ?
        )
      `);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const users = db
      .prepare(`
        SELECT
          users.id,
          users.first_name,
          users.last_name,
          users.email,
          users.role,
          users.status,
          users.created_at,
          student_profiles.grade,
          student_profiles.aps_score,
          COUNT(applications.id) AS application_count
        FROM users
        LEFT JOIN student_profiles
          ON student_profiles.user_id = users.id
        LEFT JOIN applications
          ON applications.user_id = users.id
        ${whereClause}
        GROUP BY users.id
        ORDER BY users.created_at DESC, users.id DESC
      `)
      .all(...params)
      .map(mapUser);

    res.json({ users });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong while fetching users."
    });
  }
});

router.post("/users", async (req, res) => {
  const { name, first_name, last_name, email, password, grade, aps_score } = req.body;
  const role = normalizeRole(req.body.role);
  const status = normalizeStatus(req.body.status);
  const parsedAps = Number(aps_score ?? 0);
  const names = splitName(name, first_name, last_name);

  if (!names.first_name || !names.last_name || !email || !password || !role || !status) {
    return res.status(400).json({
      message: "Name, email, password, role, and status are required."
    });
  }

  if (role === "student" && (!Number.isInteger(parsedAps) || parsedAps < 0 || parsedAps > 42)) {
    return res.status(400).json({
      message: "APS score must be between 0 and 42."
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = db
      .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
      .get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        message: "A user with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createUser = db.transaction(() => {
      const result = db
        .prepare(`
          INSERT INTO users (first_name, last_name, email, password, role, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .run(
          names.first_name,
          names.last_name,
          normalizedEmail,
          hashedPassword,
          role,
          status
        );

      if (role === "student") {
        db.prepare(`
          INSERT INTO student_profiles (user_id, grade, aps_score)
          VALUES (?, ?, ?)
        `).run(result.lastInsertRowid, grade || "Grade 12", parsedAps);
      }

      return getUserById(result.lastInsertRowid);
    });

    const user = createUser();

    res.status(201).json({
      message: "User created successfully.",
      user: mapUser(user)
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong while creating the user."
    });
  }
});

router.patch("/users/:id/status", (req, res) => {
  const userId = Number(req.params.id);
  const status = normalizeStatus(req.body.status);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "Invalid user id."
    });
  }

  if (!status) {
    return res.status(400).json({
      message: "Status must be Active or Inactive."
    });
  }

  if (userId === req.user.id && status === "Inactive") {
    return res.status(400).json({
      message: "You cannot deactivate your own admin account."
    });
  }

  try {
    const result = db
      .prepare("UPDATE users SET status = ? WHERE id = ?")
      .run(status, userId);

    if (result.changes === 0) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.json({
      message: "User status updated successfully.",
      user: mapUser(getUserById(userId))
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong while updating the user."
    });
  }
});

router.delete("/users/:id", (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      message: "Invalid user id."
    });
  }

  if (userId === req.user.id) {
    return res.status(400).json({
      message: "You cannot delete your own admin account."
    });
  }

  try {
    const removeUser = db.transaction(() => {
      db.prepare("DELETE FROM applications WHERE user_id = ?").run(userId);
      db.prepare("DELETE FROM student_profiles WHERE user_id = ?").run(userId);

      return db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    });

    const result = removeUser();

    if (result.changes === 0) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.json({
      message: "User deleted successfully."
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong while deleting the user."
    });
  }
});

router.get("/reports", (req, res) => {
  const type = req.query.type || "applications";
  const startDate = req.query.start_date || "";
  const endDate = req.query.end_date || "";

  if (!["applications", "users"].includes(type)) {
    return res.status(400).json({
      message: "Report type must be applications or users."
    });
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({
      message: "Dates must use YYYY-MM-DD format."
    });
  }

  try {
    if (type === "applications") {
      const { clause, params } = dateFilters("submitted_at", startDate, endDate);
      const stats = db
        .prepare(`
          SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) AS accepted,
            SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
          FROM applications
          ${clause}
        `)
        .get(...params);

      return res.json({
        report: {
          type,
          title: "Application Report",
          summary: `${stats.total || 0} applications submitted`,
          start_date: startDate || null,
          end_date: endDate || null,
          generated_at: new Date().toISOString(),
          stats: [
            { key: "total", label: "Total Applications", value: stats.total || 0 },
            { key: "pending", label: "Pending", value: stats.pending || 0 },
            { key: "accepted", label: "Accepted", value: stats.accepted || 0 },
            { key: "rejected", label: "Rejected", value: stats.rejected || 0 }
          ]
        }
      });
    }

    const { clause, params } = dateFilters("created_at", startDate, endDate);
    const stats = db
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) AS students,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins
        FROM users
        ${clause}
      `)
      .get(...params);

    res.json({
      report: {
        type,
        title: "User Activity Report",
        summary: `${stats.active || 0} active users`,
        start_date: startDate || null,
        end_date: endDate || null,
        generated_at: new Date().toISOString(),
        stats: [
          { key: "total", label: "Total Users", value: stats.total || 0 },
          { key: "active", label: "Active", value: stats.active || 0 },
          { key: "students", label: "Students", value: stats.students || 0 },
          { key: "admins", label: "Admins", value: stats.admins || 0 }
        ]
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong while generating the report."
    });
  }
});

module.exports = router;
