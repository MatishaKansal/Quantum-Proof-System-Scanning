const { Pool } = require("pg");

let pool;

function createPool() {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
    return pool;
  }

  const { newDb } = require("pg-mem");
  const db = newDb();
  const pgMem = db.adapters.createPg();
  pool = new pgMem.Pool();
  return pool;
}

function getPool() {
  return createPool();
}

module.exports = {
  getPool,
};
