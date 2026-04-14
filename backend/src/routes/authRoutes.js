const express = require("express");
const { randomUUID } = require("node:crypto");
const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../config");
const {
  findUserByCredentials,
  findUserByUsername,
  createUser,
  writeAuditLog,
} = require("../data/repository");
const { requireAuth } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { ROLES } = require("../constants");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  const user = await findUserByCredentials(username, password);

  if (!user) {
    writeAuditLog({
      userId: "unknown",
      username: username || "unknown",
      role: "unknown",
      action: "auth.login",
      status: "failed",
      details: "Invalid username or password",
    });

    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });

  writeAuditLog({
    userId: user.id,
    username: user.username,
    role: user.role,
    action: "auth.login",
    status: "success",
    details: "User logged in",
  });

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

router.post("/security-admins", requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const { username, password, fullName } = req.body || {};

  if (!username || !password || !fullName) {
    return res.status(400).json({ message: "username, password, and fullName are required" });
  }

  const existing = await findUserByUsername(username);
  if (existing) {
    return res.status(409).json({ message: "Username already exists" });
  }

  const user = await createUser({
    id: randomUUID(),
    username,
    password,
    role: ROLES.ADMIN,
    fullName,
  });

  await writeAuditLog({
    userId: req.user.id,
    username: req.user.username,
    role: req.user.role,
    action: "security_admin.create",
    status: "success",
    details: `Created security admin ${username}`,
  });

  return res.status(201).json({
    data: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

module.exports = router;
