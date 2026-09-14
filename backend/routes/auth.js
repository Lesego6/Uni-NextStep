const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../database");
require("dotenv").config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many authentication attempts, please try again later." }
});

router.post("/register", authLimiter, async (req, res, next) => {
  const { first_name, last_name, email, password, grade } = req.body;

  if (!first_name || !last_name || !email || !password || !grade) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await db.prepare("SELECT id FROM users WHERE lower(email) = lower(?)").get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.prepare(`
        INSERT INTO users (first_name, last_name, email, password)
        VALUES (?, ?, ?, ?)
      `).run(first_name.trim(), last_name.trim(), normalizedEmail, hashedPassword);

    await db.prepare(`
      INSERT INTO student_profiles (user_id, grade)
      VALUES (?, ?)
    `).run(result.lastInsertRowid, grade);

    res.status(201).json({
      message: "Student registered successfully!",
      user_id: result.lastInsertRowid
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.prepare(`
        SELECT users.*, student_profiles.grade, student_profiles.aps_score
        FROM users
        LEFT JOIN student_profiles ON users.id = student_profiles.user_id
        WHERE lower(users.email) = lower(?)
      `).get(normalizedEmail);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "This account is inactive. Please contact an administrator." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 1000 * 60 * 60 * 2
    });

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
        role: user.role,
        status: user.status,
        grade: user.grade || null,
        aps_score: user.aps_score ?? 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/"
  });

  res.json({ message: "Logout successful." });
});

module.exports = router;