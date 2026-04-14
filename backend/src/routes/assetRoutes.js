const { randomUUID } = require("node:crypto");
const express = require("express");
const {
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  writeAuditLog,
} = require("../data/repository");
const { requireRole } = require("../middleware/rbac");
const { ROLES } = require("../constants");

const router = express.Router();

router.get("/", async (req, res) => {
  const list = await listAssets(req.query);
  return res.json({ count: list.length, data: list });
});

router.get("/:id", async (req, res) => {
  const asset = await getAssetById(req.params.id);
  if (!asset) {
    return res.status(404).json({ message: "Asset not found" });
  }

  return res.json({ data: asset });
});

router.post("/", requireRole(ROLES.ADMIN, ROLES.CHECKER), async (req, res) => {
  const payload = req.body || {};
  const required = [
    "name",
    "type",
    "domain",
    "endpoint",
    "tlsVersion",
    "keyExchange",
    "certificateAlgorithm",
    "keySize",
    "cipherSuite",
  ];

  const missing = required.filter((key) => payload[key] == null || payload[key] === "");
  if (missing.length) {
    return res.status(400).json({ message: `Missing fields: ${missing.join(", ")}` });
  }

  const asset = await createAsset({
    id: randomUUID(),
    name: payload.name,
    type: payload.type,
    domain: payload.domain,
    endpoint: payload.endpoint,
    tlsVersion: payload.tlsVersion,
    keyExchange: payload.keyExchange,
    certificateAlgorithm: payload.certificateAlgorithm,
    keySize: Number(payload.keySize),
    cipherSuite: payload.cipherSuite,
    forwardSecrecy: Boolean(payload.forwardSecrecy),
    pqcCompatible: Boolean(payload.pqcCompatible),
    ownerTeam: payload.ownerTeam || "Unknown",
    status: payload.status || "active",
    riskScore: 0,
    riskLevel: "Medium",
    securityLabel: "Not Quantum Safe",
    lastScannedAt: null,
  });

  await writeAuditLog({
    userId: req.user.id,
    username: req.user.username,
    role: req.user.role,
    action: "asset.create",
    status: "success",
    details: `Created asset ${asset.domain}`,
  });

  return res.status(201).json({ data: asset });
});

router.patch("/:id", requireRole(ROLES.ADMIN, ROLES.CHECKER), async (req, res) => {
  const asset = await updateAsset(req.params.id, req.body || {});

  if (!asset) {
    return res.status(404).json({ message: "Asset not found" });
  }

  await writeAuditLog({
    userId: req.user.id,
    username: req.user.username,
    role: req.user.role,
    action: "asset.update",
    status: "success",
    details: `Updated asset ${asset.domain}`,
  });

  return res.json({ data: asset });
});

router.delete("/:id", requireRole(ROLES.ADMIN), async (req, res) => {
  const removed = await deleteAsset(req.params.id);

  if (!removed) {
    return res.status(404).json({ message: "Asset not found" });
  }

  await writeAuditLog({
    userId: req.user.id,
    username: req.user.username,
    role: req.user.role,
    action: "asset.delete",
    status: "success",
    details: `Deleted asset ${removed.domain}`,
  });

  return res.status(204).send();
});

module.exports = router;
