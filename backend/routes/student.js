const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");
const { calculateAps } = require("../utils/aps");

const router = express.Router();

// Accepts an array of objects: { subjects: [{ name: "Maths", percentage: 75 }, ...] }
router.post("/aps", authenticateToken, async (req, res, next) => {
    const { subjects } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ message: "Please provide an array of subjects with percentages." });
    }

    const sanitizedSubjects = subjects.map((subject) => ({
        name: typeof subject?.name === "string" ? subject.name.trim() : "",
        percentage: Number(subject?.percentage)
    }));

    if (sanitizedSubjects.some((subject) => !subject.name || Number.isNaN(subject.percentage) || subject.percentage < 0 || subject.percentage > 100)) {
        return res.status(400).json({ message: "Each subject must include a valid name and a percentage from 0 to 100." });
    }

    const nonLifeOrientation = sanitizedSubjects.filter((subject) => !/life orientation/i.test(subject.name));
    if (nonLifeOrientation.length < 6) {
        return res.status(400).json({ message: "Students must provide at least 6 non-Life Orientation subjects." });
    }

    try {
        const calculatedScore = calculateAps(sanitizedSubjects);

        await db.prepare(`
            UPDATE student_profiles
            SET aps_score = ?
            WHERE user_id = ?
        `).run(calculatedScore, req.user.id);

        res.json({
            message: "APS score calculated and saved successfully!",
            aps_score: calculatedScore
        });

    } catch (error) {
        next(error);
    }
});

router.get("/profile", authenticateToken, async (req, res, next) => {
    try {
        const profile = await db.prepare(`
            SELECT
                users.id, users.first_name, users.last_name, users.email, users.role,
                student_profiles.grade, student_profiles.province,
                student_profiles.school, student_profiles.aps_score
            FROM users
            JOIN student_profiles ON users.id = student_profiles.user_id
            WHERE users.id = ?
        `).get(req.user.id);

        if (!profile) return res.status(404).json({ message: "Student profile not found." });

        res.json({ user: profile });
    } catch (error) {
        next(error);
    }
}); 
module.exports = router;