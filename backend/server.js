const express = require("express");
const cors = require("cors");
const db = require("./database");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Uni NextStep API is running 🚀"
    });
});

app.listen(PORT, () => {
    console.log(`Uni NextStep backend running on http://localhost:${PORT}`);
});