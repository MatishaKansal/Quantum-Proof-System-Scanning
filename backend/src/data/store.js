const { randomUUID } = require("node:crypto");
const { RISK_LEVELS, SECURITY_LABELS } = require("../constants");

const users = [
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

const assets = [
  {
    id: "asset-1",
    name: "Main Web Server",
    type: "Web Server",
    domain: "www.pnbindia.in",
    endpoint: "https://www.pnbindia.in",
    tlsVersion: "TLS 1.2",
    keyExchange: "RSA-2048",
    certificateAlgorithm: "SHA-256 with RSA",
    keySize: 2048,
    cipherSuite: "TLS_RSA_WITH_AES_256_GCM_SHA384",
    forwardSecrecy: false,
    pqcCompatible: false,
    riskScore: 72,
    riskLevel: RISK_LEVELS.HIGH,
    securityLabel: SECURITY_LABELS.NOT_READY,
    ownerTeam: "Digital Banking",
    status: "active",
    lastScannedAt: null,
  },
  {
    id: "asset-2",
    name: "Netbanking Portal",
    type: "Web Server",
    domain: "netbanking.pnbindia.in",
    endpoint: "https://netbanking.pnbindia.in",
    tlsVersion: "TLS 1.3",
    keyExchange: "ECDHE",
    certificateAlgorithm: "SHA-256 with ECDSA",
    keySize: 256,
    cipherSuite: "TLS_AES_256_GCM_SHA384",
    forwardSecrecy: true,
    pqcCompatible: false,
    riskScore: 38,
    riskLevel: RISK_LEVELS.LOW,
    securityLabel: SECURITY_LABELS.PQC_READY,
    ownerTeam: "Netbanking",
    status: "active",
    lastScannedAt: null,
  },
  {
    id: "asset-3",
    name: "API Gateway",
    type: "API",
    domain: "api.pnbindia.in",
    endpoint: "https://api.pnbindia.in",
    tlsVersion: "TLS 1.2",
    keyExchange: "RSA-2048",
    certificateAlgorithm: "SHA-1 with RSA",
    keySize: 2048,
    cipherSuite: "TLS_RSA_WITH_AES_128_GCM_SHA256",
    forwardSecrecy: false,
    pqcCompatible: false,
    riskScore: 80,
    riskLevel: RISK_LEVELS.HIGH,
    securityLabel: SECURITY_LABELS.NOT_READY,
    ownerTeam: "Core APIs",
    status: "active",
    lastScannedAt: null,
  },
  {
    id: "asset-4",
    name: "VPN Gateway",
    type: "VPN",
    domain: "vpn.pnbindia.in",
    endpoint: "https://vpn.pnbindia.in",
    tlsVersion: "TLS 1.2",
    keyExchange: "RSA-1024",
    certificateAlgorithm: "SHA-1 with RSA",
    keySize: 1024,
    cipherSuite: "TLS_RSA_WITH_AES_128_CBC_SHA",
    forwardSecrecy: false,
    pqcCompatible: false,
    riskScore: 91,
    riskLevel: RISK_LEVELS.HIGH,
    securityLabel: SECURITY_LABELS.NOT_READY,
    ownerTeam: "Network Security",
    status: "active",
    lastScannedAt: null,
  },
];

const scans = [];
const auditLogs = [];
const scheduledScans = [];

function nowIso() {
  return new Date().toISOString();
}

function writeAuditLog(entry) {
  auditLogs.unshift({
    id: randomUUID(),
    timestamp: nowIso(),
    ...entry,
  });
}

function getState() {
  return {
    users,
    assets,
    scans,
    auditLogs,
    scheduledScans,
  };
}

module.exports = {
  getState,
  writeAuditLog,
  nowIso,
};
