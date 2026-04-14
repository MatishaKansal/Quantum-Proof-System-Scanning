const { randomUUID } = require("node:crypto");
const { getPool } = require("./db");
const { seedUsers, seedAssets, seedPhases, seedTasks, seedPQCAlgorithms } = require("./seedData");

function nowIso() {
  return new Date().toISOString();
}

function mapAssetRow(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    domain: row.domain,
    endpoint: row.endpoint,
    tlsVersion: row.tls_version,
    keyExchange: row.key_exchange,
    certificateAlgorithm: row.certificate_algorithm,
    keySize: row.key_size,
    cipherSuite: row.cipher_suite,
    forwardSecrecy: row.forward_secrecy,
    pqcCompatible: row.pqc_compatible,
    riskScore: row.risk_score,
    riskLevel: row.risk_level,
    securityLabel: row.security_label,
    ownerTeam: row.owner_team,
    status: row.status,
    lastScannedAt: row.last_scanned_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function mapScanRow(row) {
  return {
    id: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    scannedBy: row.scanned_by,
    assetCount: row.asset_count,
    riskCounts: row.risk_counts,
    findings: row.findings,
  };
}

async function initializeDatabase() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      domain TEXT UNIQUE NOT NULL,
      endpoint TEXT NOT NULL,
      tls_version TEXT NOT NULL,
      key_exchange TEXT NOT NULL,
      certificate_algorithm TEXT NOT NULL,
      key_size INT NOT NULL,
      cipher_suite TEXT NOT NULL,
      forward_secrecy BOOLEAN NOT NULL,
      pqc_compatible BOOLEAN NOT NULL,
      risk_score INT NOT NULL,
      risk_level TEXT NOT NULL,
      security_label TEXT NOT NULL,
      owner_team TEXT NOT NULL,
      status TEXT NOT NULL,
      last_scanned_at TIMESTAMPTZ NULL,
      updated_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      started_at TIMESTAMPTZ NOT NULL,
      finished_at TIMESTAMPTZ NOT NULL,
      scanned_by JSONB NOT NULL,
      asset_count INT NOT NULL,
      risk_counts JSONB NOT NULL,
      findings JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS scheduled_scans (
      id TEXT PRIMARY KEY,
      cron TEXT NOT NULL,
      asset_ids JSONB NOT NULL,
      enabled BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS migration_phases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      timeline TEXT NOT NULL,
      phase_order INT NOT NULL,
      description TEXT,
      completion_percent INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS migration_tasks (
      id TEXT PRIMARY KEY,
      phase_id TEXT NOT NULL REFERENCES migration_phases(id) ON DELETE CASCADE,
      task_text TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pqc_algorithms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      nist_standardized BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const user of seedUsers) {
    await pool.query(
      `INSERT INTO users (id, username, password, role, full_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO UPDATE SET
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         full_name = EXCLUDED.full_name`,
      [user.id, user.username, user.password, user.role, user.fullName]
    );
  }

  const assetsCount = await pool.query("SELECT COUNT(*)::int AS count FROM assets");
  if (assetsCount.rows[0].count === 0) {
    for (const asset of seedAssets) {
      await pool.query(
        `INSERT INTO assets (
          id, name, type, domain, endpoint, tls_version, key_exchange,
          certificate_algorithm, key_size, cipher_suite, forward_secrecy,
          pqc_compatible, risk_score, risk_level, security_label,
          owner_team, status, last_scanned_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18
        )`,
        [
          asset.id,
          asset.name,
          asset.type,
          asset.domain,
          asset.endpoint,
          asset.tlsVersion,
          asset.keyExchange,
          asset.certificateAlgorithm,
          asset.keySize,
          asset.cipherSuite,
          asset.forwardSecrecy,
          asset.pqcCompatible,
          asset.riskScore,
          asset.riskLevel,
          asset.securityLabel,
          asset.ownerTeam,
          asset.status,
          asset.lastScannedAt,
        ]
      );
    }
  }

  // Seed migration phases
  const phasesCount = await pool.query("SELECT COUNT(*)::int AS count FROM migration_phases");
  if (phasesCount.rows[0].count === 0) {
    for (const phase of seedPhases) {
      await pool.query(
        `INSERT INTO migration_phases (id, title, status, timeline, phase_order, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [phase.id, phase.title, phase.status, phase.timeline, phase.phaseOrder, phase.description]
      );
    }

    // Seed migration tasks
    for (const task of seedTasks) {
      await pool.query(
        `INSERT INTO migration_tasks (id, phase_id, task_text, completed)
         VALUES ($1, $2, $3, $4)`,
        [task.id, task.phaseId, task.taskText, task.completed]
      );
    }

    // Seed PQC algorithms
    for (const algo of seedPQCAlgorithms) {
      await pool.query(
        `INSERT INTO pqc_algorithms (id, name, type, category, description, nist_standardized)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [algo.id, algo.name, algo.type, algo.category, algo.description, algo.nistStandardized]
      );
    }
  }
}

async function findUserByCredentials(username, password) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, username, role, full_name FROM users WHERE username = $1 AND password = $2 LIMIT 1",
    [username, password]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    fullName: row.full_name,
  };
}

async function findUserByUsername(username) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, username, role, full_name FROM users WHERE username = $1 LIMIT 1",
    [username]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    fullName: row.full_name,
  };
}

async function createUser(user) {
  const pool = getPool();

  await pool.query(
    `INSERT INTO users (id, username, password, role, full_name)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, user.username, user.password, user.role, user.fullName]
  );

  return findUserById(user.id);
}

async function findUserById(id) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT id, username, role, full_name FROM users WHERE id = $1 LIMIT 1",
    [id]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    fullName: row.full_name,
  };
}

async function writeAuditLog(entry) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO audit_logs (id, timestamp, user_id, username, role, action, status, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      randomUUID(),
      nowIso(),
      entry.userId,
      entry.username,
      entry.role,
      entry.action,
      entry.status,
      entry.details,
    ]
  );
}

async function listAuditLogs() {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM audit_logs ORDER BY timestamp DESC");
  return result.rows;
}

async function listAssets(filters = {}) {
  const pool = getPool();
  const clauses = [];
  const values = [];

  if (filters.q) {
    values.push(`%${String(filters.q).toLowerCase()}%`);
    clauses.push(`(LOWER(name) LIKE $${values.length} OR LOWER(domain) LIKE $${values.length} OR LOWER(endpoint) LIKE $${values.length})`);
  }

  if (filters.riskLevel) {
    values.push(String(filters.riskLevel).toLowerCase());
    clauses.push(`LOWER(risk_level) = $${values.length}`);
  }

  if (filters.type) {
    values.push(String(filters.type).toLowerCase());
    clauses.push(`LOWER(type) = $${values.length}`);
  }

  if (filters.status) {
    values.push(String(filters.status).toLowerCase());
    clauses.push(`LOWER(status) = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await pool.query(`SELECT * FROM assets ${where} ORDER BY domain ASC`, values);
  return result.rows.map(mapAssetRow);
}

async function listAssetsByIds(assetIds) {
  const pool = getPool();
  const result = await pool.query(
    "SELECT * FROM assets WHERE id = ANY($1::text[]) ORDER BY domain ASC",
    [assetIds]
  );
  return result.rows.map(mapAssetRow);
}

async function getAssetById(id) {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM assets WHERE id = $1 LIMIT 1", [id]);
  const row = result.rows[0];
  return row ? mapAssetRow(row) : null;
}

async function createAsset(asset) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO assets (
      id, name, type, domain, endpoint, tls_version, key_exchange,
      certificate_algorithm, key_size, cipher_suite, forward_secrecy,
      pqc_compatible, risk_score, risk_level, security_label,
      owner_team, status, last_scanned_at, updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18, $19
    )`,
    [
      asset.id,
      asset.name,
      asset.type,
      asset.domain,
      asset.endpoint,
      asset.tlsVersion,
      asset.keyExchange,
      asset.certificateAlgorithm,
      asset.keySize,
      asset.cipherSuite,
      asset.forwardSecrecy,
      asset.pqcCompatible,
      asset.riskScore,
      asset.riskLevel,
      asset.securityLabel,
      asset.ownerTeam,
      asset.status,
      asset.lastScannedAt,
      asset.updatedAt || null,
    ]
  );

  return getAssetById(asset.id);
}

async function updateAsset(id, patch) {
  const current = await getAssetById(id);
  if (!current) return null;

  const next = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };

  const pool = getPool();
  await pool.query(
    `UPDATE assets SET
      name = $2,
      type = $3,
      domain = $4,
      endpoint = $5,
      tls_version = $6,
      key_exchange = $7,
      certificate_algorithm = $8,
      key_size = $9,
      cipher_suite = $10,
      forward_secrecy = $11,
      pqc_compatible = $12,
      risk_score = $13,
      risk_level = $14,
      security_label = $15,
      owner_team = $16,
      status = $17,
      last_scanned_at = $18,
      updated_at = $19
     WHERE id = $1`,
    [
      id,
      next.name,
      next.type,
      next.domain,
      next.endpoint,
      next.tlsVersion,
      next.keyExchange,
      next.certificateAlgorithm,
      next.keySize,
      next.cipherSuite,
      next.forwardSecrecy,
      next.pqcCompatible,
      next.riskScore,
      next.riskLevel,
      next.securityLabel,
      next.ownerTeam,
      next.status,
      next.lastScannedAt,
      next.updatedAt,
    ]
  );

  return getAssetById(id);
}

async function deleteAsset(id) {
  const asset = await getAssetById(id);
  if (!asset) return null;

  const pool = getPool();
  await pool.query("DELETE FROM assets WHERE id = $1", [id]);
  return asset;
}

async function createScan(scan) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO scans (id, started_at, finished_at, scanned_by, asset_count, risk_counts, findings)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb)`,
    [
      scan.id,
      scan.startedAt,
      scan.finishedAt,
      JSON.stringify(scan.scannedBy),
      scan.assetCount,
      JSON.stringify(scan.riskCounts),
      JSON.stringify(scan.findings),
    ]
  );

  return getScanById(scan.id);
}

async function listScans(limit) {
  const pool = getPool();
  const hasLimit = Number.isInteger(limit) && limit > 0;
  const result = hasLimit
    ? await pool.query("SELECT * FROM scans ORDER BY started_at DESC LIMIT $1", [limit])
    : await pool.query("SELECT * FROM scans ORDER BY started_at DESC");

  return result.rows.map(mapScanRow);
}

async function getScanById(id) {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM scans WHERE id = $1 LIMIT 1", [id]);
  const row = result.rows[0];
  return row ? mapScanRow(row) : null;
}

async function getLatestScan() {
  const list = await listScans(1);
  return list[0] || null;
}

async function createSchedule(schedule) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO scheduled_scans (id, cron, asset_ids, enabled, created_at, created_by)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6)`,
    [
      schedule.id,
      schedule.cron,
      JSON.stringify(schedule.assetIds || []),
      schedule.enabled,
      schedule.createdAt,
      schedule.createdBy,
    ]
  );

  return schedule;
}

async function listSchedules() {
  const pool = getPool();
  const result = await pool.query("SELECT * FROM scheduled_scans ORDER BY created_at DESC");
  return result.rows.map((row) => ({
    id: row.id,
    cron: row.cron,
    assetIds: row.asset_ids,
    enabled: row.enabled,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }));
}

module.exports = {
  initializeDatabase,
  nowIso,
  findUserByCredentials,
  findUserByUsername,
  findUserById,
  createUser,
  writeAuditLog,
  listAuditLogs,
  listAssets,
  listAssetsByIds,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  createScan,
  listScans,
  getScanById,
  getLatestScan,
  createSchedule,
  listSchedules,
};
