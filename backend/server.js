const express = require("express");
const cors = require("cors");
const db = require("./database");
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const applicationRoutes = require("./routes/applications");
const adminRoutes = require("./routes/admin");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const authenticateToken = require("./middleware/authMiddleware");

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Uni NextStep API is running 🚀"
    });
});

app.get("/api/profile", authenticateToken, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        user: req.user
    });
});

app.listen(PORT, () => {
    console.log(`Uni NextStep backend running on http://localhost:${PORT}`);
});
