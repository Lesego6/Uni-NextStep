const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Static in-memory catalog fallback for local development and UI demos.
const universitiesData = [
  { id: 1, abbr: "UCT", name: "University of Cape Town", province: "Western Cape", location: "Cape Town" },
  { id: 2, abbr: "Wits", name: "University of the Witwatersrand", province: "Gauteng", location: "Johannesburg" },
  { id: 3, abbr: "SU", name: "Stellenbosch University", province: "Western Cape", location: "Stellenbosch" },
  { id: 4, abbr: "UP", name: "University of Pretoria", province: "Gauteng", location: "Pretoria" },
  { id: 6, abbr: "UJ", name: "University of Johannesburg", province: "Gauteng", location: "Johannesburg" },
  { id: 25, abbr: "TUT", name: "Tshwane University of Technology", province: "Gauteng", location: "Pretoria" }
];

const coursesData = [
  { id: 101, name: "BSc Computer Science", field: "Science & Technology", minAps: 32, universities: [1, 2, 3, 4, 6] },
  { id: 102, name: "BCom Accounting", field: "Commerce", minAps: 34, universities: [1, 2, 4, 6] },
  { id: 103, name: "BA Psychology", field: "Humanities", minAps: 28, universities: [1, 3, 6] },
  { id: 104, name: "BIT (Information Technology)", field: "Science & Technology", minAps: 30, universities: [4, 6, 25] },
  { id: 105, name: "BCom Economics", field: "Commerce", minAps: 32, universities: [1, 2, 6] }
];

router.get("/courses", authenticateToken, (req, res) => {
  res.json({ courses: coursesData });
});

router.get("/universities", authenticateToken, (req, res) => {
  res.json({ universities: universitiesData });
});

module.exports = router;