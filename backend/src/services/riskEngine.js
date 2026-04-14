const { RISK_LEVELS, SECURITY_LABELS } = require("../constants");

function extractTlsMinor(tlsVersion) {
  const match = String(tlsVersion || "").match(/1\.(\d)/);
  return match ? Number(match[1]) : null;
}

function daysUntil(dateInput) {
  if (!dateInput) return null;
  const ts = Date.parse(dateInput);
  if (Number.isNaN(ts)) return null;
  return Math.floor((ts - Date.now()) / (1000 * 60 * 60 * 24));
}

function stableTieBreaker(text) {
  // Keep ties deterministic when posture is otherwise identical.
  const value = String(text || "");
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 3;
}

function calculateRisk(asset) {
  let score = 12;

  // Normalize TLS version format (handle both "TLS 1.2" and "TLSv1.2")
  const tlsVer = String(asset.tlsVersion || "").replace(/v/i, " ");
  const tlsMinor = extractTlsMinor(tlsVer);

  if (tlsMinor === 3) {
    score -= 6;
  } else if (tlsMinor === 2) {
    score += 12;
  } else if (tlsMinor === 1 || tlsMinor === 0) {
    score += 26;
  } else {
    score += 22;
  }

  if (!asset.forwardSecrecy) {
    score += 14;
  }

  const keyExchange = String(asset.keyExchange || "").toLowerCase();
  const certificateAlgorithm = String(asset.certificateAlgorithm || "").toLowerCase();
  const cipherSuite = String(asset.cipherSuite || "").toLowerCase();
  const keySize = Number(asset.keySize || 0);

  if (keyExchange.includes("rsa")) {
    score += 10;
  } else if (keyExchange.includes("ecdhe")) {
    score -= 2;
  } else if (keyExchange.includes("dhe")) {
    score += 2;
  } else if (keyExchange.includes("unknown")) {
    score += 8;
  }

  if (certificateAlgorithm.includes("sha-1")) {
    score += 20;
  }

  if (certificateAlgorithm.includes("ecdsa")) {
    score -= 2;
  } else if (certificateAlgorithm.includes("rsa")) {
    score += 2;
  } else if (certificateAlgorithm.includes("unknown")) {
    score += 4;
  }

  if (keySize > 0 && keySize < 2048) {
    score += 26;
  } else if (keySize === 2048) {
    score += 6;
  } else if (keySize >= 3072) {
    score -= 2;
  }

  if (cipherSuite.includes("cbc")) {
    score += 8;
  }
  if (cipherSuite.includes("chacha20")) {
    score -= 1;
  }
  if (cipherSuite.includes("aes_128")) {
    score += 1;
  }
  if (cipherSuite.includes("aes_256")) {
    score -= 1;
  }

  if (asset.pqcCompatible) {
    score -= 10;
  }

  const daysLeft = daysUntil(asset.certValidTo);
  if (daysLeft !== null) {
    if (daysLeft < 0) score += 25;
    else if (daysLeft <= 30) score += 14;
    else if (daysLeft <= 90) score += 7;
    else if (daysLeft >= 395) score += 2;
  } else {
    score += 3;
  }

  score += stableTieBreaker(asset.endpoint || asset.domain || "");

  const bounded = Math.max(5, Math.min(100, Math.round(score)));

  let riskLevel = RISK_LEVELS.MEDIUM;
  if (bounded <= 40) riskLevel = RISK_LEVELS.LOW;
  else if (bounded <= 70) riskLevel = RISK_LEVELS.MEDIUM;
  else if (bounded <= 85) riskLevel = RISK_LEVELS.HIGH;
  else riskLevel = RISK_LEVELS.CRITICAL;

  let securityLabel = SECURITY_LABELS.NOT_READY;
  if (asset.pqcCompatible && bounded <= 20) {
    securityLabel = SECURITY_LABELS.FULLY_QUANTUM_SAFE;
  } else if (asset.pqcCompatible && bounded <= 40) {
    securityLabel = SECURITY_LABELS.QUANTUM_SAFE;
  } else if (!String(asset.keyExchange).toLowerCase().includes("rsa") && bounded <= 45) {
    securityLabel = SECURITY_LABELS.PQC_READY;
  }

  return {
    riskScore: bounded,
    riskLevel,
    securityLabel,
  };
}

function recommendationEngine(asset) {
  const recommendations = [];

  // Normalize TLS version
  const tlsVer = String(asset.tlsVersion || "").replace(/v/i, " ");

  if (tlsVer.includes("1.0") || tlsVer.includes("1.1")) {
    recommendations.push("Upgrade endpoint to TLS 1.2 or TLS 1.3 immediately.");
  } else if (tlsVer.includes("1.2")) {
    recommendations.push("TLS 1.2 is acceptable; prefer TLS 1.3 where possible.");
  }

  if (!asset.forwardSecrecy) {
    recommendations.push("Enable forward secrecy with ECDHE or hybrid KEM exchange.");
  }

  if (String(asset.keyExchange).toLowerCase().includes("rsa")) {
    recommendations.push("Migrate from RSA key exchange to hybrid ECDHE + CRYSTALS-Kyber.");
  }

  if ((asset.keySize || 0) < 2048 && String(asset.keyExchange).toLowerCase().includes("rsa")) {
    recommendations.push("Replace weak RSA keys with minimum 3072-bit or PQC-ready alternatives.");
  }

  if (String(asset.certificateAlgorithm).toLowerCase().includes("sha-1")) {
    recommendations.push("Reissue certificates using SHA-256+ and plan Dilithium-based signature transition.");
  }

  if (!asset.pqcCompatible) {
    recommendations.push("Run pilot migration to NIST-standardized PQC algorithms (Kyber/Dilithium).");
  }

  if (recommendations.length === 0) {
    recommendations.push("Current configuration is healthy; keep continuous monitoring active.");
  }

  return recommendations;
}

/**
 * Determine which phase an asset qualifies for based on its properties
 * Phase 1: Assessment - asset has been scanned (has real TLS data)
 * Phase 2: Hybrid - asset has TLS 1.3 and medium risk or better
 * Phase 3: Full PQC - asset is PQC compatible
 */
function calculateAssetPhase(asset, riskData) {
  // Normalize TLS version
  const tlsVer = String(asset.tlsVersion || "").replace(/v/i, " ");

  // Phase 3: Full PQC Adoption
  if (asset.pqcCompatible && riskData.riskScore <= 30) {
    return { phase: 3, readiness: 1.0 };
  }

  // Phase 2: Hybrid Deployment
  if (tlsVer.includes("1.3") && riskData.riskScore <= 50) {
    return { phase: 2, readiness: 0.7 };
  }

  // Phase 1: Assessment (any scanned asset with real TLS data)
  if (!tlsVer.includes("Unknown") && !String(asset.keyExchange || "").includes("Unknown")) {
    return { phase: 1, readiness: 0.5 };
  }

  // Not yet assessed
  return { phase: 0, readiness: 0.0 };
}

/**
 * Auto-calculate phase status based on all scanned assets
 * Determines what percentage of assets are ready for each phase
 */
function calculatePhaseStatus(assets) {
  if (!assets || assets.length === 0) {
    return {
      phase1: "pending",
      phase2: "pending",
      phase3: "pending",
    };
  }

  const phaseCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  
  assets.forEach(asset => {
    const risk = calculateRisk(asset);
    const { phase } = calculateAssetPhase(asset, risk);
    phaseCounts[phase]++;
  });

  // Calculate readiness percentages
  const total = assets.length;
  const phase1Ready = phaseCounts[1] + phaseCounts[2] + phaseCounts[3];
  const phase2Ready = phaseCounts[2] + phaseCounts[3];
  const phase3Ready = phaseCounts[3];

  const phase1Percent = (phase1Ready / total) * 100;
  const phase2Percent = (phase2Ready / total) * 100;
  const phase3Percent = (phase3Ready / total) * 100;

  // Determine status: complete (100%), in_progress (>0%), pending (0%)
  return {
    phase1: phase1Percent === 100 ? "complete" : phase1Percent > 0 ? "in_progress" : "pending",
    phase1Percent,
    phase2: phase2Percent === 100 ? "complete" : phase2Percent > 0 ? "in_progress" : "pending",
    phase2Percent,
    phase3: phase3Percent === 100 ? "complete" : phase3Percent > 0 ? "in_progress" : "pending",
    phase3Percent,
  };
}

module.exports = {
  calculateRisk,
  recommendationEngine,
  calculateAssetPhase,
  calculatePhaseStatus,
};
