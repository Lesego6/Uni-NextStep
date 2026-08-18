const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database");
require("dotenv").config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const { first_name, last_name, email, password, grade } = req.body;

  if (!first_name || !last_name || !email || !password || !grade) {
    return res.status(400).json({
      message: "All fields are required."
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

    const result = db
      .prepare(`
        INSERT INTO users (first_name, last_name, email, password)
        VALUES (?, ?, ?, ?)
      `)
      .run(first_name.trim(), last_name.trim(), normalizedEmail, hashedPassword);

    db.prepare(`
      INSERT INTO student_profiles (user_id, grade)
      VALUES (?, ?)
    `).run(result.lastInsertRowid, grade);

    res.status(201).json({
      message: "Student registered successfully!",
      user_id: result.lastInsertRowid
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong while registering."
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required."
    });
  }

  try {
    if (!JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication is not configured."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db
      .prepare(`
        SELECT
          users.*,
          student_profiles.grade,
          student_profiles.aps_score
        FROM users
        LEFT JOIN student_profiles
          ON users.id = student_profiles.user_id
        WHERE lower(users.email) = lower(?)
      `)
      .get(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: "2h"
      }
    );

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
        grade: user.grade || null,
        aps_score: user.aps_score ?? 0
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Something went wrong while logging in."
    });
  }
});

module.exports = router;
