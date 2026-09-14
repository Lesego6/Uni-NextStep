const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Helper algorithm to compute official NSC APS
function calculateAps(subjects) {
    let totalPoints = 0;
    
    subjects.forEach((subject) => {
        const mark = Number(subject.percentage);
        if (isNaN(mark)) return;
        
        let points = 0;
        if (mark >= 80) points = 7;
        else if (mark >= 70) points = 6;
        else if (mark >= 60) points = 5;
        else if (mark >= 50) points = 4;
        else if (mark >= 40) points = 3;
        else if (mark >= 30) points = 2;
        else points = 1;

        // Exclude Life Orientation strictly for normal APS conversion
        if (subject.name && subject.name.toLowerCase().includes("life orientation")) {
            points = 0; 
        }

        totalPoints += points;
    });

    return Math.min(totalPoints, 42); // standard max 6 subjects x 7 points
}

// Accepts an array of objects: { subjects: [{ name: "Maths", percentage: 75 }, ...] }
router.post("/aps", authenticateToken, async (req, res, next) => {
    const { subjects } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ message: "Please provide an array of subjects with percentages." });
    }

    try {
        const calculatedScore = calculateAps(subjects);

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