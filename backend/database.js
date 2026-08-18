const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const db = new Database(path.join(__dirname, "unextstep.db"));
db.pragma("foreign_keys = ON");

console.log("Uni NextStep database connected successfully!");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    grade TEXT NOT NULL,
    province TEXT,
    school TEXT,
    aps_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_number TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    course_id INTEGER,
    course_name TEXT NOT NULL,
    university_id INTEGER,
    university_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending'
      CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_applications_user_id
  ON applications (user_id)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_applications_status
  ON applications (status)
`);

console.log("Users table is ready!");

db.exec(`
  INSERT OR IGNORE INTO student_profiles (user_id, grade, aps_score)
  SELECT id, 'Grade 12', 0
  FROM users
  WHERE role = 'student'
`);

db.exec(`
  UPDATE student_profiles
  SET aps_score = 0
  WHERE aps_score IS NULL
`);

function seedAdminUser() {
  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    .get();

  if (existingAdmin) {
    console.log("Admin user is ready!");
    return;
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@uninextstep.co.za")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingUser = db
    .prepare("SELECT id FROM users WHERE lower(email) = lower(?)")
    .get(adminEmail);

  if (existingUser) {
    db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existingUser.id);
    console.log("Existing admin email promoted to admin role!");
    return;
  }

  const hashedPassword = bcrypt.hashSync(adminPassword, 10);

  db.prepare(`
    INSERT INTO users (first_name, last_name, email, password, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).run("System", "Admin", adminEmail, hashedPassword);

  console.log("Default admin user created!");
}

seedAdminUser();

module.exports = db;
