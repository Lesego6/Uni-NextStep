const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../database");

const router = express.Router();

router.post("/register", async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required."
        });
    }

    try {
        const existingUser = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(email);

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
    .run(first_name, last_name, email, hashedPassword);

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
        const user = db
            .prepare("SELECT * FROM users WHERE email = ?")
            .get(email);

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

        res.json({
            message: "Login successful!",
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
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