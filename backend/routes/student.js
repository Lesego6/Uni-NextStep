const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/aps", authenticateToken, (req, res) => {
    const { aps_score } = req.body;

    if (aps_score === undefined || aps_score < 0 || aps_score > 42) {
        return res.status(400).json({
            message: "APS score must be between 0 and 42."
        });
    }

    try {
        db.prepare(`
            UPDATE student_profiles
            SET aps_score = ?
            WHERE user_id = ?
        `).run(aps_score, req.user.id);

        res.json({
            message: "APS score saved successfully!",
            aps_score
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Something went wrong while saving APS score."
        });
    }
});

router.get("/profile", authenticateToken, (req, res) => {
    try {
        const profile = db.prepare(`
            SELECT
                users.id,
                users.first_name,
                users.last_name,
                users.email,
                users.role,
                student_profiles.grade,
                student_profiles.province,
                student_profiles.school,
                student_profiles.aps_score
            FROM users
            JOIN student_profiles
                ON users.id = student_profiles.user_id
            WHERE users.id = ?
        `).get(req.user.id);

        if (!profile) {
            return res.status(404).json({
                message: "Student profile not found."
            });
        }

        res.json({
            user: profile
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Something went wrong while fetching profile."
        });
    }
}); 
module.exports = router;