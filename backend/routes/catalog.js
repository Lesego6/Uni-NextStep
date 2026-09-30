const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");
const { ensureSeededCatalog } = require("../utils/catalogSeed");

const router = express.Router();

router.get("/courses", authenticateToken, async (req, res, next) => {
  try {
    await ensureSeededCatalog();
    const courses = await db.prepare(`
      SELECT c.id, c.name, c.field, c.min_aps AS minAps,
        COALESCE(GROUP_CONCAT(u.id ORDER BY u.id), '') AS universities
      FROM courses c
      LEFT JOIN course_universities cu ON cu.course_id = c.id
      LEFT JOIN universities u ON u.id = cu.university_id
      GROUP BY c.id, c.name, c.field, c.min_aps
      ORDER BY c.name
    `).all();

    const resolvedCourses = courses.map((course) => ({
      ...course,
      universities: String(course.universities || "")
        .split(",")
        .filter(Boolean)
        .map((id) => Number(id))
    }));

    res.json({ courses: resolvedCourses });
  } catch (error) {
    next(error);
  }
});

router.get("/universities", authenticateToken, async (req, res, next) => {
  try {
    await ensureSeededCatalog();
    const universities = await db.prepare(`
      SELECT id, abbr, name, province, location
      FROM universities
      ORDER BY name
    `).all();

    res.json({ universities });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
