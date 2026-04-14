export type Asset = {
  id: string;
  name: string;
  type: string;
  domain: string;
  endpoint: string;
  tlsVersion: string;
  keyExchange: string;
  certificateAlgorithm: string;
  keySize: number;
  cipherSuite: string;
  forwardSecrecy: boolean;
  pqcCompatible: boolean;
  riskScore: number;
  riskLevel: string;
  securityLabel: string;
  ownerTeam: string;
  status: string;
  lastScannedAt: string | null;
};

export type ScanRecord = {
  id: string;
  startedAt: string;
  finishedAt: string;
  assetCount: number;
  findings: Array<{
    assetId: string;
    domain: string;
    tlsVersion: string;
    keyExchange: string;
    certificateAlgorithm: string;
    forwardSecrecy: boolean;
    pqcCompatible: boolean;
    riskScore: number;
    riskLevel: string;
    securityLabel: string;
    recommendations: string[];
  }>;
};

export type DashboardSummary = {
  totalAssets: number;
  overallRiskScore: number;
  riskBreakdown: { low: number; medium: number; high: number };
  securityLabels: {
    quantumSafe: number;
    pqcReady: number;
    fullyQuantumSafe: number;
    notQuantumSafe: number;
  };
  latestScans: ScanRecord[];
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const TOKEN_KEY = "pnb_api_token";

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  role: string;
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function requireToken() {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  return token;
}

async function loginRequest(username: string, password: string) {
  const payload = await requestWithoutAuth<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setAuthToken(payload.token);
  return payload;
}

async function requestWithoutAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      Authorization: `Bearer ${requireToken()}`,
    },
  });

  if (response.status === 401) {
    clearAuthToken();
    throw new Error("Authentication expired");
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      Authorization: `Bearer ${requireToken()}`,
    },
  });

  if (response.status === 401) {
    clearAuthToken();
    throw new Error("Authentication expired");
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  return loginRequest(username, password);
}

export async function getCurrentUser() {
  const payload = await requestWithAuth<{ user: AuthUser }>("/auth/me");
  return payload.user;
}

export async function createSecurityAdmin(input: { username: string; password: string; fullName: string; }) {
  const payload = await requestWithAuth<{ data: AuthUser }>("/auth/security-admins", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return payload.data;
}

export async function getAssets() {
  const payload = await apiRequest<{ data: Asset[] }>("/assets");
  return payload.data;
}

export async function getDashboardSummary() {
  const payload = await apiRequest<{ data: DashboardSummary }>("/dashboard/summary");
  return payload.data;
}

export async function runScan(assetIds?: string[], url?: string) {
  const body: any = {};
  if (assetIds && assetIds.length) {
    body.assetIds = assetIds;
  } else if (url) {
    body.url = url;
  }
  
  const payload = await apiRequest<{ data: ScanRecord }>("/scans/run", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return payload.data;
}

export async function getLatestReport() {
  const payload = await apiRequest<{ data: ScanRecord }>("/reports/latest");
  return payload.data;
}

export async function exportReport(format: "json" | "csv" | "xml") {
  const token = requireToken();
  const response = await fetch(`${BASE_URL}/reports/export?format=${format}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Report export failed with status ${response.status}`);
  }

  return response.blob();
}

export type MigrationPhase = {
  id: string;
  title: string;
  status: "complete" | "in_progress" | "pending";
  timeline: string;
  tasks: Array<{
    text: string;
    done: boolean;
  }>;
};

export type PQCAlgorithm = {
  id: string;
  name: string;
  type: string;
  description: string;
};

export async function getMigrationPhases() {
  const payload = await apiRequest<MigrationPhase[]>("/migration/phases");
  return payload;
}

export async function getPQCAlgorithms() {
  const payload = await apiRequest<PQCAlgorithm[]>("/migration/pqc-algorithms");
  return payload;
}

export async function updatePhaseStatus(phaseId: string, status: "complete" | "in_progress" | "pending") {
  const payload = await apiRequest("/migration/phases/" + phaseId + "/status", {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  return payload;
}

export async function updateTaskCompletion(taskId: string, completed: boolean) {
  const payload = await apiRequest("/migration/tasks/" + taskId + "/completion", {
    method: "PUT",
    body: JSON.stringify({ completed }),
  });
  return payload;
}
