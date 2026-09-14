const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcrypt");
require("dotenv").config();

const db = require("./database");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const applicationRoutes = require("./routes/applications");
const adminRoutes = require("./routes/admin");
const catalogRoutes = require("./routes/catalog");
const authenticateToken = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is not set.");
    process.exit(1);
}

if (isProduction && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
    console.error("FATAL ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be provided in production.");
    process.exit(1);
}

const allowedOrigins = String(process.env.CORS_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(helmet());
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Origin not allowed by CORS"));
        }
    },
    credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", catalogRoutes);

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "uni-nextstep-api" });
});

app.get("/", (req, res) => {
    res.json({ message: "Uni NextStep API is running 🚀" });
});

app.get("/ready", async (req, res) => {
    try {
        await db.prepare("SELECT 1").get();
        res.json({ status: "ready", service: "uni-nextstep-api", database: "mysql" });
    } catch (error) {
        res.status(503).json({ status: "not-ready", service: "uni-nextstep-api", message: error.message });
    }
});

app.get("/api/profile", authenticateToken, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        user: req.user
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === "production"
            ? "An unexpected internal server error occurred."
            : err.message
    });
});

async function ensureAdminUser() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.warn("Skipping admin bootstrap because ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
        return;
    }

    try {
        const existingAdmin = await db.prepare(`
            SELECT id FROM users WHERE lower(email) = lower(?) AND role = ? LIMIT 1
        `).get(adminEmail, "admin");

        if (existingAdmin) {
            return;
        }

        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await db.prepare(`
            INSERT INTO users (first_name, last_name, email, password, role, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run("System", "Admin", adminEmail.trim().toLowerCase(), passwordHash, "admin", "Active");

        console.log("Bootstrap admin user created successfully.");
    } catch (error) {
        console.warn("Admin bootstrap skipped or failed:", error.message);
    }
}

async function start() {
    await ensureAdminUser();
    app.listen(PORT, () => {
        console.log(`Uni NextStep backend running on http://localhost:${PORT}`);
    });
}

start();