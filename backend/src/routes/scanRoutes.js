const express = require("express");
const { randomUUID } = require("node:crypto");
const { listScans, getScanById, listSchedules, createAsset, listAssets } = require("../data/repository");
const { requireRole } = require("../middleware/rbac");
const { ROLES } = require("../constants");
const { createSchedule, runScan } = require("../services/scanService");

const router = express.Router();

router.post("/run", requireRole(ROLES.ADMIN, ROLES.CHECKER), async (req, res, next) => {
  try {
    let assetIds = req.body?.assetIds;

    // If URL is provided instead of assetIds, create/find asset first
    if (req.body?.url && !assetIds) {
      const url = req.body.url.trim();
      
      // Extract domain from URL
      let domain = url;
      try {
        const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
        domain = urlObj.hostname;
      } catch (e) {
        domain = url;
      }

      // Check if asset exists
      let existingAssets = await listAssets();
      let asset = existingAssets.find(a => a.domain === domain);

      // Create asset if doesn't exist
      if (!asset) {
        const assetId = randomUUID();
        await createAsset({
          id: assetId,
          name: `${domain} - Auto Discovered`,
          type: "Web Server",
          domain,
          endpoint: url.startsWith("http") ? url : `https://${url}`,
          tlsVersion: "Unknown",
          keyExchange: "Unknown",
          certificateAlgorithm: "Unknown",
          keySize: 0,
          cipherSuite: "Unknown",
          forwardSecrecy: false,
          pqcCompatible: false,
          riskScore: 0,
          riskLevel: "Unknown",
          securityLabel: "NOT_READY",
          ownerTeam: "Auto-Discovered",
          status: "active",
        });
        assetIds = [assetId];
      } else {
        assetIds = [asset.id];
      }
    }

    const scan = await runScan({
      actor: req.user,
      assetIds: assetIds,
    });

    return res.status(201).json({ data: scan });
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireRole(ROLES.ADMIN, ROLES.CHECKER, ROLES.AUDITOR), async (_req, res) => {
  const scans = await listScans();
  return res.json({ count: scans.length, data: scans });
});

router.get("/:id", requireRole(ROLES.ADMIN, ROLES.CHECKER, ROLES.AUDITOR), async (req, res) => {
  const scan = await getScanById(req.params.id);

  if (!scan) {
    return res.status(404).json({ message: "Scan not found" });
  }

  return res.json({ data: scan });
});

router.post("/schedule", requireRole(ROLES.ADMIN), async (req, res) => {
  const { cron, assetIds } = req.body || {};

  if (!cron || typeof cron !== "string") {
    return res.status(400).json({ message: "cron is required" });
  }

  const schedule = await createSchedule({
    actor: req.user,
    cron,
    assetIds,
  });

  return res.status(201).json({ data: schedule });
});

router.get("/schedule/list", requireRole(ROLES.ADMIN, ROLES.CHECKER, ROLES.AUDITOR), async (_req, res) => {
  const schedules = await listSchedules();
  return res.json({ count: schedules.length, data: schedules });
});

module.exports = router;
