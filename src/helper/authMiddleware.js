const jwt = require("jsonwebtoken");
const { isBlacklisted } = require("./tokenBlacklist");

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token; // Get token from cookie

  if (!token) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  // Check if token is blacklisted
  if (isBlacklisted(token)) {
    return res.status(401).json({ message: "Token has been revoked. Please log in again." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token. Please log in again." });
  }
};

module.exports = authMiddleware;
