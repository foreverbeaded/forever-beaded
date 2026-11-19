const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const source = path.resolve(process.argv[2] || process.env.DATABASE_PATH || path.join(__dirname, "..", "data", "orders.db"));
const destination = path.resolve(process.argv[3] || `${source}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`);

if (!fs.existsSync(source)) throw new Error("Source database was not found.");
if (fs.existsSync(destination)) throw new Error("Backup destination already exists.");
fs.mkdirSync(path.dirname(destination), { recursive: true });

const db = new sqlite3.Database(source, sqlite3.OPEN_READWRITE);
const run = sql => new Promise((resolve, reject) => db.run(sql, error => error ? reject(error) : resolve()));
const close = () => new Promise((resolve, reject) => db.close(error => error ? reject(error) : resolve()));

(async () => {
  try {
    await run("PRAGMA busy_timeout = 5000");
    await run("PRAGMA wal_checkpoint(FULL)");
    const escapedDestination = destination.replaceAll("'", "''");
    await run(`VACUUM INTO '${escapedDestination}'`);
    await close();
    const verification = new sqlite3.Database(destination, sqlite3.OPEN_READONLY);
    await new Promise((resolve, reject) => verification.get("PRAGMA integrity_check", (error, row) => {
      if (error) reject(error);
      else if (!row || Object.values(row)[0] !== "ok") reject(new Error("Backup integrity check failed."));
      else resolve();
    }));
    await new Promise((resolve, reject) => verification.close(error => error ? reject(error) : resolve()));
    console.log(`Verified SQLite backup: ${destination}`);
  } catch (error) {
    await close().catch(() => {});
    throw error;
  }
})().catch(error => {
  console.error(`Backup failed: ${error.message}`);
  process.exitCode = 1;
});
