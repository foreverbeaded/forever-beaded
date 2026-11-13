const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createApp, dbGet, dbRun } = require("../server");
const { buildPaymentReminderEmail, processPaymentReminders } = require("../payment-reminders");

function tempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-reminder-test-")), "orders.db");
}

function validOrder(email = "customer@example.com") {
  return {
    customer: { name: "Jamie Customer", email, phone: "604-555-1212" },
    shipping: {
      address: "123 Bead Lane",
      street: "123 Bead Lane",
      city: "Vancouver",
      province: "BC",
      postalCode: "V6B 1A1",
      country: "Canada",
      addressAsEntered: "123 Bead Lane\nVancouver, BC V6B 1A1\nCanada"
    },
    items: [{ productId: 1, quantity: 1, colours: "Purple, Cream, Gold", hardware: "Gold" }]
  };
}

async function startServer(options = {}) {
  const app = await createApp({
    databasePath: options.databasePath || tempDbPath(),
    referenceUploadPath: null,
    allowedOrigins: "https://foreverbeaded.github.io,http://127.0.0.1",
    apiRateLimit: 500,
    orderRateLimit: 100,
    reviewRateLimit: 100,
    adminSecret: "test-admin-secret",
    paymentReminderSchedulerSecret: "test-scheduler-secret",
    paymentRemindersEnabled: options.paymentRemindersEnabled === true,
    paymentReminderDelayMs: options.paymentReminderDelayMs,
    paymentReminderExcludedEmails: options.paymentReminderExcludedEmails,
    paymentReminderEmailSender: options.paymentReminderEmailSender,
    emailSender: async () => ({ emailSent: true, provider: "test", providerResponse: "accepted", messageId: "owner-order-test" }),
    reviewNotificationSender: async () => ({ emailSent: true, providerResponse: "accepted", messageId: "review-test" })
  });
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  return {
    app,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async close() {
      await new Promise(resolve => server.close(resolve));
      await new Promise(resolve => app.locals.db.close(resolve));
    }
  };
}

async function postOrder(baseUrl, payload = validOrder()) {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://foreverbeaded.github.io" },
    body: JSON.stringify(payload)
  });
  assert.equal(response.status, 200);
  return response.json();
}

const adminHeaders = { Authorization: "Bearer test-admin-secret", "Content-Type": "application/json" };
const schedulerHeaders = { Authorization: "Bearer test-scheduler-secret" };

async function makeDue(db, orderNumber, timestamp = "2026-11-01T00:00:00.000Z") {
  await dbRun(db, `UPDATE payment_reminders SET due_at = ?, next_attempt_at = ?
    WHERE order_id = (SELECT id FROM orders WHERE order_number = ?)`, [timestamp, timestamp, orderNumber]);
}

test("migration is additive and reminder enrollment starts only for newly activated orders", async () => {
  const databasePath = tempDbPath();
  const first = await startServer({ databasePath, paymentRemindersEnabled: false });
  const historical = await postOrder(first.baseUrl, validOrder("historical@example.com"));
  assert.deepEqual(await dbGet(first.app.locals.db, "SELECT COUNT(*) AS count FROM payment_reminders"), { count: 0 });
  await first.close();

  const second = await startServer({ databasePath, paymentRemindersEnabled: true });
  try {
    const table = await dbGet(second.app.locals.db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'payment_reminders'");
    assert.deepEqual(table, { name: "payment_reminders" });
    const paymentColumn = await dbGet(second.app.locals.db, "SELECT name FROM pragma_table_info('orders') WHERE name = 'payment_confirmed_at'");
    assert.deepEqual(paymentColumn, { name: "payment_confirmed_at" });
    const oldReminder = await dbGet(second.app.locals.db, `SELECT payment_reminders.id FROM payment_reminders
      JOIN orders ON orders.id = payment_reminders.order_id WHERE orders.order_number = ?`, [historical.orderNumber]);
    assert.equal(oldReminder, undefined);

    const current = await postOrder(second.baseUrl, validOrder("new-order@example.com"));
    const row = await dbGet(second.app.locals.db, `SELECT orders.created_at, payment_reminders.due_at,
      payment_reminders.state, payment_reminders.attempt_count FROM payment_reminders
      JOIN orders ON orders.id = payment_reminders.order_id WHERE orders.order_number = ?`, [current.orderNumber]);
    assert.equal(row.state, "PENDING");
    assert.equal(row.attempt_count, 0);
    assert.equal(new Date(row.due_at).getTime() - new Date(row.created_at).getTime(), 48 * 60 * 60 * 1000);
  } finally {
    await second.close();
  }
});

test("one due unpaid reminder is provider-accepted once across repeated scheduler runs", async () => {
  const sent = [];
  const context = await startServer({
    paymentRemindersEnabled: true,
    paymentReminderEmailSender: async order => {
      sent.push(order);
      return { emailSent: true, providerResponse: "250 accepted", messageId: "reminder-message-1" };
    }
  });
  try {
    const order = await postOrder(context.baseUrl);
    await makeDue(context.app.locals.db, order.orderNumber);
    const first = await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
    const firstBody = await first.json();
    assert.equal(first.status, 200);
    assert.equal(firstBody.sent, 1);
    assert.equal(firstBody.providerAcceptanceOnly, true);
    const second = await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
    assert.equal((await second.json()).sent, 0);
    assert.equal(sent.length, 1);
    const reminder = await dbGet(context.app.locals.db, "SELECT state, attempt_count, sent_at, provider_message_id FROM payment_reminders");
    assert.equal(reminder.state, "SENT");
    assert.equal(reminder.attempt_count, 1);
    assert.ok(reminder.sent_at);
    assert.equal(reminder.provider_message_id, "reminder-message-1");
    const email = buildPaymentReminderEmail(sent[0]);
    assert.equal(email.subject, `Forever Beaded \u2014 Friendly Payment Reminder for Order ${order.orderNumber}`);
    assert.match(email.text, /^Hi Jamie,/);
    assert.match(email.text, new RegExp(order.orderNumber));
    assert.match(email.text, /Order total: \$25\.00 CAD/);
    assert.match(email.text, /already sent it.*disregard/i);
    assert.doesNotMatch(email.text, /123 Bead Lane|604-555/i);
  } finally {
    await context.close();
  }
});

test("owner-verified or cancelled payment stops reminders without changing fulfilment", async () => {
  const sent = [];
  const context = await startServer({
    paymentRemindersEnabled: true,
    paymentReminderEmailSender: async order => {
      sent.push(order);
      return { emailSent: true, messageId: "unexpected" };
    }
  });
  try {
    const paid = await postOrder(context.baseUrl, validOrder("paid@example.com"));
    const cancelled = await postOrder(context.baseUrl, validOrder("cancelled@example.com"));
    await makeDue(context.app.locals.db, paid.orderNumber);
    await makeDue(context.app.locals.db, cancelled.orderNumber);
    assert.equal((await fetch(`${context.baseUrl}/api/admin/orders/${paid.orderNumber}/payment-status`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ paymentStatus: "PAID" })
    })).status, 200);
    assert.equal((await fetch(`${context.baseUrl}/api/admin/orders/${cancelled.orderNumber}/payment-status`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ paymentStatus: "CANCELLED" })
    })).status, 200);
    await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
    assert.equal(sent.length, 0);
    const paidRow = await dbGet(context.app.locals.db, "SELECT payment_status, payment_confirmed_at, order_status FROM orders WHERE order_number = ?", [paid.orderNumber]);
    assert.equal(paidRow.payment_status, "VERIFIED");
    assert.ok(paidRow.payment_confirmed_at);
    assert.equal(paidRow.order_status, "NEW");
    const cancelledRow = await dbGet(context.app.locals.db, "SELECT payment_status, order_status FROM orders WHERE order_number = ?", [cancelled.orderNumber]);
    assert.deepEqual(cancelledRow, { payment_status: "CANCELLED", order_status: "NEW" });
    const events = await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM order_events WHERE event_type = 'PAYMENT_STATUS_CHANGED'");
    assert.equal(events.count, 2);
  } finally {
    await context.close();
  }
});

test("payment rechecked immediately before send cancels a claimed reminder", async () => {
  const context = await startServer({ paymentRemindersEnabled: true, paymentReminderEmailSender: async () => ({ emailSent: true }) });
  try {
    const order = await postOrder(context.baseUrl, validOrder("last-second@example.com"));
    await makeDue(context.app.locals.db, order.orderNumber);
    let senderCalled = false;
    const summary = await processPaymentReminders(context.app.locals.db, {
      now: "2026-11-02T00:00:00.000Z",
      beforeSend: async claim => {
        await dbRun(context.app.locals.db, "UPDATE orders SET payment_status = 'VERIFIED', payment_confirmed_at = ? WHERE id = ?", [
          "2026-11-02T00:00:00.000Z", claim.orderId
        ]);
      },
      sender: async () => {
        senderCalled = true;
        return { emailSent: true };
      }
    });
    assert.equal(senderCalled, false);
    assert.equal(summary.skipped, 1);
    assert.equal((await dbGet(context.app.locals.db, "SELECT state FROM payment_reminders")).state, "INELIGIBLE");
  } finally {
    await context.close();
  }
});

test("failed provider attempts retry with spacing and persist across restart", async () => {
  const databasePath = tempDbPath();
  let attempts = 0;
  const first = await startServer({
    databasePath,
    paymentRemindersEnabled: true,
    paymentReminderEmailSender: async () => {
      attempts += 1;
      return { emailSent: false, providerResponse: "temporary SMTP failure", messageId: null };
    }
  });
  const order = await postOrder(first.baseUrl, validOrder("retry@example.com"));
  await makeDue(first.app.locals.db, order.orderNumber);
  let response = await fetch(`${first.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
  assert.equal((await response.json()).failed, 1);
  let reminder = await dbGet(first.app.locals.db, "SELECT state, attempt_count, next_attempt_at FROM payment_reminders");
  assert.equal(reminder.state, "FAILED");
  assert.equal(reminder.attempt_count, 1);
  assert.ok(reminder.next_attempt_at);
  await first.close();

  const second = await startServer({
    databasePath,
    paymentRemindersEnabled: true,
    paymentReminderEmailSender: async () => {
      attempts += 1;
      return { emailSent: true, providerResponse: "accepted", messageId: "retry-success" };
    }
  });
  try {
    reminder = await dbGet(second.app.locals.db, "SELECT state, attempt_count FROM payment_reminders");
    assert.deepEqual(reminder, { state: "FAILED", attempt_count: 1 });
    await dbRun(second.app.locals.db, "UPDATE payment_reminders SET next_attempt_at = ?", ["2026-11-01T00:00:00.000Z"]);
    response = await fetch(`${second.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
    assert.equal((await response.json()).sent, 1);
    assert.equal(attempts, 2);
    reminder = await dbGet(second.app.locals.db, "SELECT state, attempt_count FROM payment_reminders");
    assert.deepEqual(reminder, { state: "SENT", attempt_count: 2 });
  } finally {
    await second.close();
  }
});

test("automatic retries stop after three attempts and owner can explicitly retry", async () => {
  let attempts = 0;
  let accept = false;
  const context = await startServer({
    paymentRemindersEnabled: true,
    paymentReminderEmailSender: async () => {
      attempts += 1;
      return accept
        ? { emailSent: true, providerResponse: "accepted", messageId: "manual-retry-success" }
        : { emailSent: false, providerResponse: "temporary SMTP failure", messageId: null };
    }
  });
  try {
    const order = await postOrder(context.baseUrl, validOrder("bounded@example.com"));
    await makeDue(context.app.locals.db, order.orderNumber);
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
      assert.equal((await response.json()).failed, 1);
      if (attempt < 3) {
        await dbRun(context.app.locals.db, "UPDATE payment_reminders SET next_attempt_at = ?", ["2026-11-01T00:00:00.000Z"]);
      }
    }
    const automaticStop = await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
    assert.equal((await automaticStop.json()).checked, 0);
    assert.equal(attempts, 3);
    let reminder = await dbGet(context.app.locals.db, "SELECT state, attempt_count, next_attempt_at FROM payment_reminders");
    assert.deepEqual(reminder, { state: "FAILED", attempt_count: 3, next_attempt_at: null });

    accept = true;
    const manual = await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/payment-reminder/retry`, {
      method: "POST", headers: adminHeaders
    });
    const manualBody = await manual.json();
    assert.equal(manual.status, 200);
    assert.equal(manualBody.sent, 1);
    assert.equal(attempts, 4);
    reminder = await dbGet(context.app.locals.db, "SELECT state, attempt_count, provider_message_id FROM payment_reminders");
    assert.deepEqual(reminder, { state: "SENT", attempt_count: 4, provider_message_id: "manual-retry-success" });
  } finally {
    await context.close();
  }
});

test("invalid, excluded, suppressed, and pre-activation orders never send", async () => {
  const sent = [];
  const context = await startServer({
    paymentRemindersEnabled: true,
    paymentReminderExcludedEmails: "test-order@example.com",
    paymentReminderEmailSender: async order => {
      sent.push(order);
      return { emailSent: true, messageId: "unexpected" };
    }
  });
  try {
    const excluded = await postOrder(context.baseUrl, validOrder("test-order@example.com"));
    const suppressed = await postOrder(context.baseUrl, validOrder("hold@example.com"));
    const invalid = await postOrder(context.baseUrl, validOrder("valid-first@example.com"));
    await makeDue(context.app.locals.db, excluded.orderNumber);
    await makeDue(context.app.locals.db, suppressed.orderNumber);
    await makeDue(context.app.locals.db, invalid.orderNumber);
    await dbRun(context.app.locals.db, "UPDATE orders SET customer_email = 'invalid-address' WHERE order_number = ?", [invalid.orderNumber]);
    assert.equal((await fetch(`${context.baseUrl}/api/admin/orders/${suppressed.orderNumber}/payment-reminder`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ suppressed: true, reason: "Owner hold" })
    })).status, 200);
    await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
    assert.equal(sent.length, 0);
    const states = await new Promise((resolve, reject) => context.app.locals.db.all(
      "SELECT state FROM payment_reminders ORDER BY id", [], (error, rows) => error ? reject(error) : resolve(rows.map(row => row.state))
    ));
    assert.deepEqual(states, ["INELIGIBLE", "SUPPRESSED", "INELIGIBLE"]);

    assert.equal((await fetch(`${context.baseUrl}/api/admin/orders/${excluded.orderNumber}/payment-status`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ paymentStatus: "PAID" })
    })).status, 200);
    assert.equal((await fetch(`${context.baseUrl}/api/admin/orders/${excluded.orderNumber}/payment-status`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ paymentStatus: "AWAITING_PAYMENT" })
    })).status, 200);
    assert.equal((await fetch(`${context.baseUrl}/api/admin/orders/${excluded.orderNumber}/payment-reminder`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ suppressed: false })
    })).status, 409);
    const excludedAfterStatusChanges = await dbGet(context.app.locals.db, `SELECT state, last_error
      FROM payment_reminders WHERE order_id = (SELECT id FROM orders WHERE order_number = ?)`, [excluded.orderNumber]);
    assert.equal(excludedAfterStatusChanges.state, "INELIGIBLE");
    assert.match(excludedAfterStatusChanges.last_error, /excluded/i);
  } finally {
    await context.close();
  }
});

test("provider acceptance during an owner payment update is recorded and never retried", async () => {
  let context;
  let attempts = 0;
  context = await startServer({
    paymentRemindersEnabled: true,
    paymentReminderEmailSender: async order => {
      attempts += 1;
      const paid = await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/payment-status`, {
        method: "PUT", headers: adminHeaders, body: JSON.stringify({ paymentStatus: "PAID" })
      });
      assert.equal(paid.status, 200);
      return { emailSent: true, providerResponse: "250 accepted", messageId: "accepted-during-status-change" };
    }
  });
  try {
    const order = await postOrder(context.baseUrl, validOrder("race-check@example.com"));
    await makeDue(context.app.locals.db, order.orderNumber);
    const first = await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
    assert.equal(first.status, 200);
    assert.equal((await first.json()).sent, 1);
    const stored = await dbGet(context.app.locals.db, `SELECT orders.payment_status, payment_reminders.state,
      payment_reminders.sent_at, payment_reminders.provider_message_id FROM orders
      JOIN payment_reminders ON payment_reminders.order_id = orders.id WHERE orders.order_number = ?`, [order.orderNumber]);
    assert.equal(stored.payment_status, "VERIFIED");
    assert.equal(stored.state, "SENT");
    assert.ok(stored.sent_at);
    assert.equal(stored.provider_message_id, "accepted-during-status-change");
    await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders });
    assert.equal(attempts, 1);
  } finally {
    await context.close();
  }
});

test("admin and scheduler endpoints reject unauthorized requests and feature remains disabled by default", async () => {
  const context = await startServer({ paymentRemindersEnabled: false });
  try {
    const order = await postOrder(context.baseUrl);
    assert.equal((await fetch(`${context.baseUrl}/api/admin/payment-orders`)).status, 401);
    assert.equal((await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/payment-status`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentStatus: "PAID" })
    })).status, 401);
    assert.equal((await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST" })).status, 401);
    assert.equal((await fetch(`${context.baseUrl}/api/internal/payment-reminders/run`, { method: "POST", headers: schedulerHeaders })).status, 409);
    assert.equal((await dbGet(context.app.locals.db, "SELECT payment_status FROM orders WHERE order_number = ?", [order.orderNumber])).payment_status, "AWAITING_PAYMENT");
  } finally {
    await context.close();
  }
});

test("customer payment-reporting actions cannot mark an order paid", async () => {
  const context = await startServer({ paymentRemindersEnabled: true });
  try {
    const order = await postOrder(context.baseUrl, validOrder("claim-only@example.com"));
    const publicAttempt = await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/payment-status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "PAID" })
    });
    assert.equal(publicAttempt.status, 401);
    const stored = await dbGet(context.app.locals.db, "SELECT payment_status, payment_confirmed_at FROM orders WHERE order_number = ?", [order.orderNumber]);
    assert.deepEqual(stored, { payment_status: "AWAITING_PAYMENT", payment_confirmed_at: null });
  } finally {
    await context.close();
  }
});
