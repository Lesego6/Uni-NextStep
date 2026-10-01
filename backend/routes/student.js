const express = require("express");
const db = require("../database");
const authenticateToken = require("../middleware/authMiddleware");
const { calculateAps } = require("../utils/aps");
const {
    getUserNotifications,
    markAllNotificationsRead,
    markNotificationRead
} = require("../utils/notifications");

const router = express.Router();

function requireStudent(req, res, next) {
    if (req.user.role !== "student") {
        return res.status(403).json({ message: "Student access is required." });
    }

    next();
}

// Accepts an array of objects: { subjects: [{ name: "Maths", percentage: 75 }, ...] }
router.post("/aps", authenticateToken, requireStudent, async (req, res, next) => {
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
    //Calculates the aps score and saves it to the database 

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

router.get("/profile", authenticateToken, requireStudent, async (req, res, next) => {
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

router.get("/notifications", authenticateToken, requireStudent, async (req, res, next) => {
    try {
        const data = await getUserNotifications(req.user.id);
        res.json(data);
    } catch (error) {
        next(error);
    }
});

router.patch("/notifications/read-all", authenticateToken, requireStudent, async (req, res, next) => {
    try {
        await markAllNotificationsRead(req.user.id);
        const data = await getUserNotifications(req.user.id);
        res.json({
            message: "Notifications marked as read.",
            ...data
        });
    } catch (error) {
        next(error);
    }
});

router.patch("/notifications/:id/read", authenticateToken, requireStudent, async (req, res, next) => {
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId <= 0) {
        return res.status(400).json({ message: "Invalid notification ID." });
    }

    try {
        const result = await markNotificationRead(req.user.id, notificationId);

        if (result.changes === 0) {
            return res.status(404).json({ message: "Notification not found." });
        }

        const data = await getUserNotifications(req.user.id);
        res.json({
            message: "Notification marked as read.",
            ...data
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
