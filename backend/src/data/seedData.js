const { RISK_LEVELS, SECURITY_LABELS } = require("../constants");

const seedUsers = [
  {
    id: "u-admin",
    username: "admin",
    password: "admin@123",
    role: "security_admin",
    fullName: "PNB Security Admin",
  },
  {
    id: "u-checker",
    username: "checker",
    password: "checker123",
    role: "checker",
    fullName: "PNB Checker",
  },
  {
    id: "u-auditor",
    username: "auditor",
    password: "auditor123",
    role: "auditor",
    fullName: "Compliance Auditor",
  },
];

// Start completely fresh - no demo assets
const seedAssets = [];

const seedPhases = [
  {
    id: "phase-1",
    title: "Phase 1 – Assessment",
    status: "pending",
    timeline: "Q1 2026",
    phaseOrder: 1,
    description: "Assess current cryptographic landscape and identify quantum vulnerabilities",
  },
  {
    id: "phase-2",
    title: "Phase 2 – Hybrid Deployment",
    status: "pending",
    timeline: "Q2–Q3 2026",
    phaseOrder: 2,
    description: "Deploy hybrid classical-quantum resistant algorithms",
  },
  {
    id: "phase-3",
    title: "Phase 3 – Full PQC Adoption",
    status: "pending",
    timeline: "Q4 2026 – Q2 2027",
    phaseOrder: 3,
    description: "Complete migration to post-quantum cryptography standards",
  },
];

const seedTasks = [
  {
    id: "task-1-1",
    phaseId: "phase-1",
    taskText: "Complete cryptographic inventory",
    completed: false,
  },
  {
    id: "task-1-2",
    phaseId: "phase-1",
    taskText: "Identify quantum-vulnerable systems",
    completed: false,
  },
  {
    id: "task-1-3",
    phaseId: "phase-1",
    taskText: "Baseline risk scoring across assets",
    completed: false,
  },
  {
    id: "task-1-4",
    phaseId: "phase-1",
    taskText: "Document current TLS configurations",
    completed: false,
  },
  {
    id: "task-2-1",
    phaseId: "phase-2",
    taskText: "Implement RSA + CRYSTALS-Kyber Hybrid",
    completed: false,
  },
  {
    id: "task-2-2",
    phaseId: "phase-2",
    taskText: "Upgrade TLS 1.2 → TLS 1.3",
    completed: false,
  },
  {
    id: "task-2-3",
    phaseId: "phase-2",
    taskText: "Replace RSA-1024 certificates",
    completed: false,
  },
  {
    id: "task-2-4",
    phaseId: "phase-2",
    taskText: "Enable forward secrecy on all endpoints",
    completed: false,
  },
  {
    id: "task-3-1",
    phaseId: "phase-3",
    taskText: "Deploy Kyber Key Exchange",
    completed: false,
  },
  {
    id: "task-3-2",
    phaseId: "phase-3",
    taskText: "Deploy Dilithium Digital Signatures",
    completed: false,
  },
  {
    id: "task-3-3",
    phaseId: "phase-3",
    taskText: "Update VPN gateways to PQC",
    completed: false,
  },
  {
    id: "task-3-4",
    phaseId: "phase-3",
    taskText: "Full compliance audit (RBI / NIST)",
    completed: false,
  },
];

const seedPQCAlgorithms = [
  {
    id: "algo-kyber",
    name: "CRYSTALS-Kyber",
    type: "Key Encapsulation",
    category: "Key Exchange",
    description: "Lattice-based key exchange mechanism standardized by NIST. Provides quantum-resistant key establishment.",
    nistStandardized: true,
  },
  {
    id: "algo-dilithium",
    name: "CRYSTALS-Dilithium",
    type: "Digital Signature",
    category: "Digital Signature",
    description: "Lattice-based signature scheme. Recommended for general-purpose digital signature applications.",
    nistStandardized: true,
  },
  {
    id: "algo-falcon",
    name: "Falcon",
    type: "Digital Signature",
    category: "Digital Signature",
    description: "Compact lattice-based signature with smaller signature sizes. Ideal for bandwidth-constrained environments.",
    nistStandardized: true,
  },
  {
    id: "algo-sphincs",
    name: "SPHINCS+",
    type: "Digital Signature",
    category: "Digital Signature",
    description: "Hash-based signature scheme. Provides conservative, stateless alternative with well-understood security assumptions.",
    nistStandardized: true,
  },
];

module.exports = {
  seedUsers,
  seedAssets,
  seedPhases,
  seedTasks,
  seedPQCAlgorithms,
};
