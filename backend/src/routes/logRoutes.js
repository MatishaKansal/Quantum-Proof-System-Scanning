const express = require("express");
const { listAuditLogs } = require("../data/repository");

const router = express.Router();

router.get("/", async (_req, res) => {
  const logs = await listAuditLogs();
  return res.json({
    count: logs.length,
    data: logs,
  });
});

module.exports = router;
