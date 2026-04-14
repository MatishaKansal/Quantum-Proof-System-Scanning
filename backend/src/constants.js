const ROLES = {
  ADMIN: "security_admin",
  CHECKER: "checker",
  AUDITOR: "auditor",
};

const RISK_LEVELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const SECURITY_LABELS = {
  QUANTUM_SAFE: "Quantum-Safe",
  PQC_READY: "PQC Ready",
  FULLY_QUANTUM_SAFE: "Fully Quantum Safe",
  NOT_READY: "Not Quantum Safe",
};

module.exports = {
  ROLES,
  RISK_LEVELS,
  SECURITY_LABELS,
};
