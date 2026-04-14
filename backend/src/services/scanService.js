const { randomUUID } = require("node:crypto");
const {
  listAssets,
  listAssetsByIds,
  updateAsset,
  createScan: saveScan,
  createSchedule: saveSchedule,
  nowIso,
  writeAuditLog,
} = require("../data/repository");
const { calculateRisk, recommendationEngine, calculatePhaseStatus } = require("./riskEngine");
const { scanTLS } = require("./tlsScanner");
const { getPool } = require("../data/db");

async function runScan({ actor, assetIds }) {
  const selectedAssets = Array.isArray(assetIds) && assetIds.length
    ? await listAssetsByIds(assetIds)
    : await listAssets();

  if (!selectedAssets.length) {
    const err = new Error("No matching assets found for scan");
    err.statusCode = 400;
    throw err;
  }

  const startedAt = nowIso();
  const findings = [];

  for (const asset of selectedAssets) {
    // Scan TLS if this is an auto-discovered asset with unknown values
    let updatedAsset = { ...asset };
    if (asset.keyExchange === "Unknown" || asset.tlsVersion === "Unknown") {
      const tlsData = await scanTLS(asset.domain, asset.endpoint);
      updatedAsset = {
        ...asset,
        tlsVersion: tlsData.tlsVersion,
        keyExchange: tlsData.keyExchange,
        certificateAlgorithm: tlsData.certificateAlgorithm,
        keySize: tlsData.keySize,
        cipherSuite: tlsData.cipherSuite,
        forwardSecrecy: tlsData.forwardSecrecy,
        pqcCompatible: tlsData.pqcCompatible,
        certValidFrom: tlsData.certValidFrom,
        certValidTo: tlsData.certValidTo,
      };
    }

    const risk = calculateRisk(updatedAsset);
    const recommendations = recommendationEngine({ ...updatedAsset, ...risk });
    const lastScannedAt = nowIso();

    await updateAsset(asset.id, {
      tlsVersion: updatedAsset.tlsVersion,
      keyExchange: updatedAsset.keyExchange,
      certificateAlgorithm: updatedAsset.certificateAlgorithm,
      keySize: updatedAsset.keySize,
      cipherSuite: updatedAsset.cipherSuite,
      forwardSecrecy: updatedAsset.forwardSecrecy,
      pqcCompatible: updatedAsset.pqcCompatible,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      securityLabel: risk.securityLabel,
      lastScannedAt,
    });

    findings.push({
      assetId: asset.id,
      domain: updatedAsset.domain,
      tlsVersion: updatedAsset.tlsVersion,
      keyExchange: updatedAsset.keyExchange,
      certificateAlgorithm: updatedAsset.certificateAlgorithm,
      keySize: updatedAsset.keySize,
      cipherSuite: updatedAsset.cipherSuite,
      certValidFrom: updatedAsset.certValidFrom || null,
      certValidTo: updatedAsset.certValidTo || null,
      forwardSecrecy: updatedAsset.forwardSecrecy,
      pqcCompatible: updatedAsset.pqcCompatible,
      riskScore: risk.riskScore,
      riskLevel: risk.riskLevel,
      securityLabel: risk.securityLabel,
      recommendations,
    });
  }

  const riskCounts = findings.reduce(
    (acc, current) => {
      const key = current.riskLevel.toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 }
  );

  const scanRecord = {
    id: randomUUID(),
    startedAt,
    finishedAt: nowIso(),
    scannedBy: actor,
    assetCount: selectedAssets.length,
    riskCounts,
    findings,
  };

  const storedScan = await saveScan(scanRecord);

  // Auto-update migration phases based on asset readiness
  try {
    const allAssets = await listAssets();
    const phaseStatus = calculatePhaseStatus(allAssets);
    const pool = getPool();
    
    const phasesResult = await pool.query(
      "SELECT id, phase_order, status FROM migration_phases ORDER BY phase_order ASC"
    );
    
    for (const phase of phasesResult.rows) {
      let newStatus = phase.status;
      let completionPercent = 0;
      
      if (phase.phase_order === 1) {
        newStatus = phaseStatus.phase1;
        completionPercent = Math.round(phaseStatus.phase1Percent);
      } else if (phase.phase_order === 2) {
        newStatus = phaseStatus.phase2;
        completionPercent = Math.round(phaseStatus.phase2Percent);
      } else if (phase.phase_order === 3) {
        newStatus = phaseStatus.phase3;
        completionPercent = Math.round(phaseStatus.phase3Percent);
      }
      
      if (phase.status !== newStatus) {
        await pool.query(
          "UPDATE migration_phases SET status = $1, completion_percent = $2, updated_at = NOW() WHERE id = $3",
          [newStatus.replace("_", "-"), completionPercent, phase.id]
        );
      }
    }
  } catch (phaseUpdateError) {
    console.error("Warning: Failed to auto-update migration phases:", phaseUpdateError.message);
    // Don't fail the scan if phase update fails - just log it
  }

  await writeAuditLog({
    userId: actor.id,
    username: actor.username,
    role: actor.role,
    action: "scan.run",
    status: "success",
    details: `Triggered scan for ${selectedAssets.length} assets`,
  });

  return storedScan;
}

async function createSchedule({ actor, cron, assetIds }) {
  const schedule = {
    id: randomUUID(),
    cron,
    assetIds: assetIds || [],
    enabled: true,
    createdAt: nowIso(),
    createdBy: actor.username,
  };

  await saveSchedule(schedule);

  await writeAuditLog({
    userId: actor.id,
    username: actor.username,
    role: actor.role,
    action: "scan.schedule.create",
    status: "success",
    details: `Created schedule ${cron}`,
  });

  return schedule;
}

module.exports = {
  runScan,
  createSchedule,
};
