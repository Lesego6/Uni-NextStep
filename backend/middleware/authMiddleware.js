const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

function parseCookies(header) {
    if (!header) return {};

    return header.split(";").reduce((cookies, cookie) => {
        const [name, ...valueParts] = cookie.trim().split("=");
        if (!name) return cookies;
        cookies[name] = decodeURIComponent(valueParts.join("="));
        return cookies;
    }, {});
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const cookies = parseCookies(req.headers.cookie);

    const token = (authHeader && authHeader.split(" ")[1]) || cookies.jwt;

    if (!token) {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token."
        });
    }
}

module.exports = authenticateToken;