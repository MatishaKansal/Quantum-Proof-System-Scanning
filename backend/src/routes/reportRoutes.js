const express = require("express");
const { getLatestScan } = require("../data/repository");
const { toCsv, toXml } = require("../services/reportService");

const router = express.Router();

router.get("/latest", async (_req, res) => {
  const latest = await getLatestScan();

  if (!latest) {
    return res.status(404).json({ message: "No scan report available yet. Run a scan first." });
  }

  return res.json({ data: latest });
});

router.get("/export", async (req, res) => {
  const latest = await getLatestScan();

  if (!latest) {
    return res.status(404).json({ message: "No scan report available yet. Run a scan first." });
  }

  const format = String(req.query.format || "json").toLowerCase();

  if (format === "json") {
    return res.json({ data: latest });
  }

  if (format === "csv") {
    const rows = latest.findings.map((finding) => ({
      assetId: finding.assetId,
      domain: finding.domain,
      tlsVersion: finding.tlsVersion,
      keyExchange: finding.keyExchange,
      certificateAlgorithm: finding.certificateAlgorithm,
      forwardSecrecy: finding.forwardSecrecy,
      pqcCompatible: finding.pqcCompatible,
      riskScore: finding.riskScore,
      riskLevel: finding.riskLevel,
      securityLabel: finding.securityLabel,
      recommendations: finding.recommendations.join(" | "),
    }));

    const payload = toCsv(rows);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=scan-${latest.id}.csv`);
    return res.status(200).send(payload);
  }

  if (format === "xml") {
    const payload = toXml(latest);
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", `attachment; filename=scan-${latest.id}.xml`);
    return res.status(200).send(payload);
  }

  return res.status(400).json({ message: "Unsupported format. Use json, csv, or xml." });
});

module.exports = router;
