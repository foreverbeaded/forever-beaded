const crypto = require("crypto");

const TRACKING_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function migrateOrderTrackingSchema(db) {
  const columns = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(orders)", [], (error, rows) => error ? reject(error) : resolve(rows || []));
  });
  const names = new Set(columns.map(column => column.name));
  if (!names.has("shipping_carrier")) await dbRun(db, "ALTER TABLE orders ADD COLUMN shipping_carrier TEXT");
  if (!names.has("pickup_instructions")) await dbRun(db, "ALTER TABLE orders ADD COLUMN pickup_instructions TEXT");

  await dbRun(db, `CREATE TABLE IF NOT EXISTS order_tracking_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    derivation_id TEXT,
    token_hash TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT,
    revoked_at TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
  const trackingColumns = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(order_tracking_links)", [], (error, rows) => error ? reject(error) : resolve(rows || []));
  });
  if (!trackingColumns.some(column => column.name === "derivation_id")) {
    await dbRun(db, "ALTER TABLE order_tracking_links ADD COLUMN derivation_id TEXT");
  }
  await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_order_tracking_token
    ON order_tracking_links(token_hash)`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS order_submission_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_key_hash TEXT NOT NULL UNIQUE,
    payload_hash TEXT NOT NULL,
    order_id INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
}

function createTrackingToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function createTrackingMaterial(secret) {
  if (!secret || String(secret).length < 32) throw new Error("Tracking token secret must be at least 32 characters.");
  const derivationId = crypto.randomBytes(32).toString("base64url");
  return { derivationId, token: deriveTrackingToken(secret, derivationId) };
}

function deriveTrackingToken(secret, derivationId) {
  if (!secret || !derivationId) throw new Error("Tracking token configuration is incomplete.");
  return crypto.createHmac("sha256", String(secret)).update(String(derivationId)).digest("base64url");
}

function hashTrackingToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function validTrackingToken(token) {
  return TRACKING_TOKEN_PATTERN.test(String(token || ""));
}

function trackingExpiry(now = new Date(), days = 365) {
  const expires = new Date(now);
  expires.setUTCDate(expires.getUTCDate() + days);
  return expires.toISOString();
}

module.exports = {
  createTrackingMaterial,
  createTrackingToken,
  deriveTrackingToken,
  hashTrackingToken,
  migrateOrderTrackingSchema,
  trackingExpiry,
  validTrackingToken
};
