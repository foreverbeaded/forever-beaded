const { randomUUID } = require("node:crypto");
const validator = require("validator");

const REMINDER_DELAY_MS = 48 * 60 * 60 * 1000;
const RETRY_DELAY_MS = 6 * 60 * 60 * 1000;
const CLAIM_TTL_MS = 15 * 60 * 1000;
const MAX_AUTOMATIC_ATTEMPTS = 3;

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows || []));
  });
}

function isoAfter(value, milliseconds) {
  return new Date(new Date(value).getTime() + milliseconds).toISOString();
}

function normalizeExcludedEmails(value) {
  const entries = Array.isArray(value) ? value : String(value || "").split(",");
  return new Set(entries.map(email => String(email).trim().toLowerCase()).filter(Boolean));
}

function validCustomerEmail(email) {
  return validator.isEmail(String(email || "").trim());
}

async function migratePaymentReminderSchema(db) {
  await dbRun(db, `CREATE TABLE IF NOT EXISTS payment_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    due_at TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN (
      'PENDING','CLAIMED','SENT','FAILED','SUPPRESSED','INELIGIBLE','ATTENTION'
    )),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    next_attempt_at TEXT,
    sent_at TEXT,
    provider_message_id TEXT,
    last_error TEXT,
    claim_token TEXT,
    claim_expires_at TEXT,
    suppressed_at TEXT,
    suppressed_reason TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
  await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_payment_reminders_due
    ON payment_reminders(state, next_attempt_at, due_at)`);
}

async function enrollPaymentReminder(db, order, options = {}) {
  if (!options.enabled) return { enrolled: false, reason: "disabled" };
  const now = order.createdAt || new Date().toISOString();
  const dueAt = isoAfter(now, Number(options.delayMs) || REMINDER_DELAY_MS);
  const excludedEmails = normalizeExcludedEmails(options.excludedEmails);
  const email = String(order.customerEmail || "").trim().toLowerCase();
  let state = "PENDING";
  let lastError = null;
  if (!validCustomerEmail(email)) {
    state = "INELIGIBLE";
    lastError = "Customer email is invalid.";
  } else if (excludedEmails.has(email)) {
    state = "INELIGIBLE";
    lastError = "Excluded by server reminder configuration.";
  }
  await dbRun(db, `INSERT INTO payment_reminders (
    order_id, created_at, updated_at, due_at, state, next_attempt_at, last_error
  ) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(order_id) DO NOTHING`, [
    order.orderId, now, now, dueAt, state, state === "PENDING" ? dueAt : null, lastError
  ]);
  return { enrolled: true, state, dueAt };
}

function firstName(name) {
  return String(name || "there").trim().split(/\s+/)[0] || "there";
}

function formatCad(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

function buildPaymentReminderEmail(order) {
  const subject = `Forever Beaded \u2014 Friendly Payment Reminder for Order ${order.orderNumber}`;
  const text = `Hi ${firstName(order.customerName)},

Thank you for your Forever Beaded order!

We're just following up because we haven't yet confirmed the Interac e-Transfer payment for order ${order.orderNumber}.

Order total: $${formatCad(order.totalCents)} CAD

If you haven't sent your payment yet, please follow the payment instructions provided during checkout.

If you've already sent it, thank you! Please disregard this reminder while we verify the payment.

If you need any assistance, simply reply to this email.

Thank you for supporting Forever Beaded!

Forever Beaded
https://foreverbeaded.ca`;
  return { subject, text };
}

async function markStaleClaimsForAttention(db, now) {
  return dbRun(db, `UPDATE payment_reminders SET
    state = 'ATTENTION', updated_at = ?, claim_token = NULL, claim_expires_at = NULL,
    next_attempt_at = NULL,
    last_error = 'A previous process stopped while email acceptance was uncertain. Review before retrying.'
    WHERE state = 'CLAIMED' AND sent_at IS NULL AND claim_expires_at <= ?`, [now, now]);
}

async function claimReminder(db, reminderId, now, options = {}) {
  const claimToken = randomUUID();
  const claimExpiresAt = isoAfter(now, Number(options.claimTtlMs) || CLAIM_TTL_MS);
  await dbRun(db, "BEGIN IMMEDIATE TRANSACTION");
  try {
    const row = await dbGet(db, `SELECT payment_reminders.*, orders.order_number,
      orders.customer_name, orders.customer_email, orders.total_cents,
      orders.payment_status, orders.order_status
      FROM payment_reminders JOIN orders ON orders.id = payment_reminders.order_id
      WHERE payment_reminders.id = ?`, [reminderId]);
    const allowedState = row && (row.state === "PENDING" || row.state === "FAILED" || (options.manual && row.state === "ATTENTION"));
    const due = row && (options.manual || ((row.next_attempt_at || row.due_at) <= now));
    const attemptsAllowed = row && (options.manual || row.attempt_count < (Number(options.maxAttempts) || MAX_AUTOMATIC_ATTEMPTS));
    if (!allowedState || !due || !attemptsAllowed || row.sent_at) {
      await dbRun(db, "COMMIT");
      return null;
    }
    if (row.payment_status !== "AWAITING_PAYMENT" || row.order_status === "CANCELLED") {
      await dbRun(db, `UPDATE payment_reminders SET state = 'INELIGIBLE', updated_at = ?,
        next_attempt_at = NULL, last_error = 'Order is no longer awaiting payment.' WHERE id = ?`, [now, reminderId]);
      await dbRun(db, "COMMIT");
      return null;
    }
    if (!validCustomerEmail(row.customer_email)) {
      await dbRun(db, `UPDATE payment_reminders SET state = 'INELIGIBLE', updated_at = ?,
        next_attempt_at = NULL, last_error = 'Customer email is invalid.' WHERE id = ?`, [now, reminderId]);
      await dbRun(db, "COMMIT");
      return null;
    }
    const claimed = await dbRun(db, `UPDATE payment_reminders SET state = 'CLAIMED',
      updated_at = ?, attempt_count = attempt_count + 1, last_attempt_at = ?,
      claim_token = ?, claim_expires_at = ?, last_error = NULL
      WHERE id = ? AND state = ?`, [now, now, claimToken, claimExpiresAt, reminderId, row.state]);
    await dbRun(db, "COMMIT");
    if (claimed.changes !== 1) return null;
    return {
      reminderId,
      orderId: row.order_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      totalCents: row.total_cents,
      claimToken,
      attemptCount: row.attempt_count + 1
    };
  } catch (error) {
    await dbRun(db, "ROLLBACK").catch(() => {});
    throw error;
  }
}

async function recheckClaim(db, claim) {
  return dbGet(db, `SELECT payment_reminders.state, payment_reminders.claim_token,
    orders.payment_status, orders.order_status
    FROM payment_reminders JOIN orders ON orders.id = payment_reminders.order_id
    WHERE payment_reminders.id = ?`, [claim.reminderId]);
}

async function recordReminderEvent(db, orderId, now, eventType, details = {}) {
  await dbRun(db, "INSERT INTO order_events(order_id, created_at, event_type, details) VALUES (?, ?, ?, ?)", [
    orderId, now, eventType, JSON.stringify(details)
  ]);
}

async function completeClaim(db, claim, result, now, options = {}) {
  if (result.emailSent) {
    const updated = await dbRun(db, `UPDATE payment_reminders SET state = 'SENT', updated_at = ?,
      sent_at = ?, provider_message_id = ?, last_error = NULL, next_attempt_at = NULL,
      claim_token = NULL, claim_expires_at = NULL
      WHERE id = ? AND claim_token = ? AND sent_at IS NULL`, [
      now, now, result.messageId || null, claim.reminderId, claim.claimToken
    ]);
    if (updated.changes === 1) {
      await recordReminderEvent(db, claim.orderId, now, "PAYMENT_REMINDER_SENT", {
        attempt: claim.attemptCount,
        providerAccepted: true
      });
      return "SENT";
    }
    return "INELIGIBLE";
  }
  const maxAttempts = Number(options.maxAttempts) || MAX_AUTOMATIC_ATTEMPTS;
  const nextAttemptAt = claim.attemptCount < maxAttempts
    ? isoAfter(now, Number(options.retryDelayMs) || RETRY_DELAY_MS)
    : null;
  const current = await dbGet(db, `SELECT state FROM payment_reminders
    WHERE id = ? AND claim_token = ?`, [claim.reminderId, claim.claimToken]);
  if (!current) return "INELIGIBLE";
  const failedState = current.state === "CLAIMED" ? "FAILED" : current.state;
  const updated = await dbRun(db, `UPDATE payment_reminders SET state = ?, updated_at = ?,
    next_attempt_at = ?, last_error = ?, provider_message_id = NULL,
    claim_token = NULL, claim_expires_at = NULL
    WHERE id = ? AND claim_token = ?`, [
    failedState,
    now,
    failedState === "FAILED" ? nextAttemptAt : null,
    String(result.providerResponse || "Email provider did not accept the reminder.").slice(0, 500),
    claim.reminderId,
    claim.claimToken
  ]);
  if (updated.changes !== 1) return "INELIGIBLE";
  await recordReminderEvent(db, claim.orderId, now, "PAYMENT_REMINDER_FAILED", {
    attempt: claim.attemptCount,
    automaticRetryScheduled: failedState === "FAILED" && Boolean(nextAttemptAt)
  });
  return failedState;
}

async function processPaymentReminders(db, options = {}) {
  const now = options.now || new Date().toISOString();
  await markStaleClaimsForAttention(db, now);
  let rows;
  if (options.orderNumber) {
    rows = await dbAll(db, `SELECT payment_reminders.id FROM payment_reminders
      JOIN orders ON orders.id = payment_reminders.order_id
      WHERE orders.order_number = ?`, [options.orderNumber]);
  } else {
    rows = await dbAll(db, `SELECT id FROM payment_reminders
      WHERE state IN ('PENDING','FAILED') AND sent_at IS NULL
        AND COALESCE(next_attempt_at, due_at) <= ?
        AND attempt_count < ?
      ORDER BY due_at ASC, id ASC LIMIT ?`, [
      now,
      Number(options.maxAttempts) || MAX_AUTOMATIC_ATTEMPTS,
      Number(options.limit) || 25
    ]);
  }
  const summary = { checked: rows.length, sent: 0, failed: 0, skipped: 0 };
  for (const row of rows) {
    const claim = await claimReminder(db, row.id, now, options);
    if (!claim) {
      summary.skipped += 1;
      continue;
    }
    if (typeof options.beforeSend === "function") await options.beforeSend(claim);
    const latest = await recheckClaim(db, claim);
    if (!latest || latest.state !== "CLAIMED" || latest.claim_token !== claim.claimToken ||
      latest.payment_status !== "AWAITING_PAYMENT" || latest.order_status === "CANCELLED") {
      await dbRun(db, `UPDATE payment_reminders SET state = 'INELIGIBLE', updated_at = ?,
        next_attempt_at = NULL, claim_token = NULL, claim_expires_at = NULL,
        last_error = 'Payment status changed before the reminder was sent.'
        WHERE id = ? AND state = 'CLAIMED' AND claim_token = ?`, [now, claim.reminderId, claim.claimToken]);
      summary.skipped += 1;
      continue;
    }
    let result;
    try {
      result = await options.sender(claim);
    } catch (error) {
      result = { emailSent: false, providerResponse: error.message, messageId: null };
    }
    const state = await completeClaim(db, claim, result, now, options);
    if (state === "SENT") summary.sent += 1;
    else if (state === "FAILED") summary.failed += 1;
    else summary.skipped += 1;
  }
  return summary;
}

module.exports = {
  CLAIM_TTL_MS,
  MAX_AUTOMATIC_ATTEMPTS,
  REMINDER_DELAY_MS,
  RETRY_DELAY_MS,
  buildPaymentReminderEmail,
  enrollPaymentReminder,
  migratePaymentReminderSchema,
  normalizeExcludedEmails,
  processPaymentReminders,
  validCustomerEmail
};
