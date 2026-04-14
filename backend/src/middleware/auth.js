const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");
const { findUserById } = require("../data/repository");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    };
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}

module.exports = {
  requireAuth,
};
