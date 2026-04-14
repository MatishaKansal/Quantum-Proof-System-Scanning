const express = require("express");
const { listAssets, listScans } = require("../data/repository");

const router = express.Router();

router.get("/summary", async (_req, res) => {
  const assets = await listAssets();

  const summary = assets.reduce(
    (acc, asset) => {
      const key = asset.riskLevel.toLowerCase();
      acc.risk[key] = (acc.risk[key] || 0) + 1;
      acc.totalRiskScore += asset.riskScore;
      return acc;
    },
    {
      totalAssets: assets.length,
      totalRiskScore: 0,
      risk: { low: 0, medium: 0, high: 0 },
      labels: { quantumSafe: 0, pqcReady: 0, fullyQuantumSafe: 0, notQuantumSafe: 0 },
    }
  );

  for (const asset of assets) {
    if (asset.securityLabel === "Quantum-Safe") summary.labels.quantumSafe += 1;
    else if (asset.securityLabel === "PQC Ready") summary.labels.pqcReady += 1;
    else if (asset.securityLabel === "Fully Quantum Safe") summary.labels.fullyQuantumSafe += 1;
    else summary.labels.notQuantumSafe += 1;
  }

  const overallRiskScore = assets.length
    ? Math.round(summary.totalRiskScore / assets.length)
    : 0;

  const latestScans = await listScans(5);

  return res.json({
    data: {
      totalAssets: summary.totalAssets,
      overallRiskScore,
      riskBreakdown: summary.risk,
      securityLabels: summary.labels,
      latestScans,
    },
  });
});

module.exports = router;
