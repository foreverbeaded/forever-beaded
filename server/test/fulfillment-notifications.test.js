const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createApp, dbGet } = require("../server");
const { buildFulfillmentNotificationEmail } = require("../fulfillment-notifications");

function tempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-fulfillment-test-")), "orders.db");
}

function validOrder(email = "customer@example.com") {
  return {
    customer: { name: "Jamie Customer", email, phone: "604-555-1212" },
    shipping: { street: "123 Bead Lane", city: "Vancouver", province: "BC", postalCode: "V6B 1A1", country: "Canada" },
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
    paymentRemindersEnabled: false,
    fulfillmentNotificationsEnabled: options.fulfillmentNotificationsEnabled === true,
    fulfillmentNotificationExcludedEmails: options.fulfillmentNotificationExcludedEmails,
    fulfillmentNotificationSender: options.fulfillmentNotificationSender,
    emailSender: async () => ({ emailSent: true, providerResponse: "accepted", messageId: "owner-order-test" }),
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

async function updateStatus(baseUrl, orderNumber, fulfillmentStatus, extra = {}, headers = adminHeaders) {
  return fetch(`${baseUrl}/api/admin/orders/${orderNumber}/fulfillment-status`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ fulfillmentStatus, ...extra })
  });
}

test("customer progress templates are branded, status-specific, and private", () => {
  const order = {
    customerName: "Jamie Customer",
    orderNumber: "FB-2026-123456",
    productNames: ["Frog Keychain", "Personalized Blossom Keychain"],
    trackingNumber: "TRACK-1234"
  };
  const completed = buildFulfillmentNotificationEmail(order, "COMPLETED");
  assert.equal(completed.subject, "Your Forever Beaded Creation Is Ready! 💕");
  assert.match(completed.text, /completed with care/i);
  assert.match(completed.text, /Frog Keychain/);
  assert.match(completed.text, /not been marked as shipped or delivered/i);
  const shipped = buildFulfillmentNotificationEmail(order, "SHIPPED");
  assert.match(shipped.text, /TRACK-1234/);
  const pickup = buildFulfillmentNotificationEmail(order, "READY_FOR_PICKUP");
  assert.match(pickup.subject, /Ready for Pickup/);
  const delivered = buildFulfillmentNotificationEmail(order, "DELIVERED");
  assert.equal(delivered.subject, "Your Forever Beaded Order Has Been Delivered! 💜");
  assert.match(delivered.text, /supporting my handmade business/i);
  for (const message of [completed, shipped, pickup, delivered]) {
    assert.match(message.html, /Forever Beaded/);
    assert.doesNotMatch(message.text + message.html, /customer@example\.com|123 Bead Lane|604-555/);
  }
});

test("fulfilment notification migration is additive and preserves existing orders", async () => {
  const databasePath = tempDbPath();
  const first = await startServer({ databasePath });
  const existing = await postOrder(first.baseUrl, validOrder("existing@example.com"));
  await first.close();
  const second = await startServer({ databasePath });
  try {
    const saved = await dbGet(second.app.locals.db, `SELECT order_number, payment_status, order_status,
      fulfillment_status, customer_notifications_suppressed FROM orders WHERE order_number = ?`, [existing.orderNumber]);
    assert.deepEqual(saved, {
      order_number: existing.orderNumber,
      payment_status: "AWAITING_PAYMENT",
      order_status: "NEW",
      fulfillment_status: null,
      customer_notifications_suppressed: 0
    });
    assert.deepEqual(
      await dbGet(second.app.locals.db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'fulfillment_notifications'"),
      { name: "fulfillment_notifications" }
    );
  } finally {
    await second.close();
  }
});

test("disabled mode saves progress without sending or changing payment", async () => {
  let sends = 0;
  const context = await startServer({
    fulfillmentNotificationSender: async () => { sends += 1; return { emailSent: true, messageId: "unexpected" }; }
  });
  try {
    const order = await postOrder(context.baseUrl);
    const response = await updateStatus(context.baseUrl, order.orderNumber, "COMPLETED");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.notificationsEnabled, false);
    assert.equal(body.notification.state, "DISABLED");
    assert.equal(sends, 0);
    const saved = await dbGet(context.app.locals.db, `SELECT payment_status, order_status, fulfillment_status
      FROM orders WHERE order_number = ?`, [order.orderNumber]);
    assert.deepEqual(saved, { payment_status: "AWAITING_PAYMENT", order_status: "COMPLETED", fulfillment_status: "COMPLETED" });
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM fulfillment_notifications")).count, 0);
  } finally {
    await context.close();
  }
});

test("manual milestones send once with product names and optional tracking", async () => {
  const sent = [];
  const context = await startServer({
    fulfillmentNotificationsEnabled: true,
    fulfillmentNotificationSender: async (order, status) => {
      sent.push({ order, status, message: buildFulfillmentNotificationEmail(order, status) });
      return { emailSent: true, providerResponse: "250 accepted", messageId: `message-${status}` };
    }
  });
  try {
    const order = await postOrder(context.baseUrl);
    for (const [status, extra] of [
      ["COMPLETED", {}],
      ["SHIPPED", { trackingNumber: "TRACK-1234" }],
      ["READY_FOR_PICKUP", {}],
      ["DELIVERED", {}]
    ]) {
      const response = await updateStatus(context.baseUrl, order.orderNumber, status, extra);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).notification.sent, true);
    }
    assert.deepEqual(sent.map(entry => entry.status), ["COMPLETED", "SHIPPED", "READY_FOR_PICKUP", "DELIVERED"]);
    assert.match(sent[0].message.text, /Butterfly/);
    assert.match(sent[1].message.text, /TRACK-1234/);
    const repeated = await updateStatus(context.baseUrl, order.orderNumber, "DELIVERED");
    assert.equal(repeated.status, 200);
    assert.equal((await repeated.json()).unchanged, true);
    assert.equal(sent.length, 4);
    const saved = await dbGet(context.app.locals.db, `SELECT payment_status, fulfillment_status, tracking_number
      FROM orders WHERE order_number = ?`, [order.orderNumber]);
    assert.deepEqual(saved, { payment_status: "AWAITING_PAYMENT", fulfillment_status: "DELIVERED", tracking_number: "TRACK-1234" });
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM fulfillment_notifications WHERE state = 'SENT'")).count, 4);
    const dashboard = await fetch(`${context.baseUrl}/api/admin/payment-orders?paymentStatus=ALL`, { headers: adminHeaders });
    const dashboardBody = await dashboard.json();
    assert.equal(dashboardBody.fulfillmentNotificationsEnabled, true);
    assert.equal(dashboardBody.orders[0].fulfillmentNotifications.length, 4);
  } finally {
    await context.close();
  }
});

test("cancelled, suppressed, and excluded test orders cannot send", async () => {
  const sent = [];
  const context = await startServer({
    fulfillmentNotificationsEnabled: true,
    fulfillmentNotificationExcludedEmails: "test-order@example.com",
    fulfillmentNotificationSender: async order => { sent.push(order); return { emailSent: true, messageId: "unexpected" }; }
  });
  try {
    const cancelled = await postOrder(context.baseUrl, validOrder("cancelled@example.com"));
    await fetch(`${context.baseUrl}/api/admin/orders/${cancelled.orderNumber}/payment-status`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ paymentStatus: "CANCELLED" })
    });
    assert.equal((await updateStatus(context.baseUrl, cancelled.orderNumber, "COMPLETED")).status, 200);

    const suppressed = await postOrder(context.baseUrl, validOrder("suppressed@example.com"));
    await fetch(`${context.baseUrl}/api/admin/orders/${suppressed.orderNumber}/customer-notifications`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ suppressed: true })
    });
    assert.equal((await updateStatus(context.baseUrl, suppressed.orderNumber, "SHIPPED")).status, 200);

    const excluded = await postOrder(context.baseUrl, validOrder("test-order@example.com"));
    assert.equal((await updateStatus(context.baseUrl, excluded.orderNumber, "DELIVERED")).status, 200);
    assert.equal(sent.length, 0);
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM fulfillment_notifications WHERE state = 'INELIGIBLE'")).count, 2);
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM fulfillment_notifications WHERE state = 'SUPPRESSED'")).count, 1);
  } finally {
    await context.close();
  }
});

test("failed delivery remains recorded and owner retry is controlled", async () => {
  let attempts = 0;
  const context = await startServer({
    fulfillmentNotificationsEnabled: true,
    fulfillmentNotificationSender: async () => {
      attempts += 1;
      return attempts === 1
        ? { emailSent: false, providerResponse: "temporary SMTP failure" }
        : { emailSent: true, providerResponse: "250 accepted", messageId: "retry-success" };
    }
  });
  try {
    const order = await postOrder(context.baseUrl);
    const first = await updateStatus(context.baseUrl, order.orderNumber, "COMPLETED");
    assert.equal((await first.json()).notification.state, "FAILED");
    let saved = await dbGet(context.app.locals.db, "SELECT state, attempt_count, last_error FROM fulfillment_notifications");
    assert.equal(saved.state, "FAILED");
    assert.equal(saved.attempt_count, 1);
    assert.match(saved.last_error, /temporary SMTP failure/);
    const retry = await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/fulfillment-notifications/COMPLETED/retry`, {
      method: "POST", headers: adminHeaders
    });
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).sent, true);
    saved = await dbGet(context.app.locals.db, "SELECT state, attempt_count, provider_message_id FROM fulfillment_notifications");
    assert.deepEqual(saved, { state: "SENT", attempt_count: 2, provider_message_id: "retry-success" });
    assert.equal(attempts, 2);
    const duplicateRetry = await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/fulfillment-notifications/COMPLETED/retry`, {
      method: "POST", headers: adminHeaders
    });
    assert.equal(duplicateRetry.status, 409);
  } finally {
    await context.close();
  }
});

test("owner authentication and tracking validation protect status actions", async () => {
  const context = await startServer({ fulfillmentNotificationsEnabled: true });
  try {
    const order = await postOrder(context.baseUrl);
    const unauthorized = await updateStatus(context.baseUrl, order.orderNumber, "SHIPPED", {}, { "Content-Type": "application/json" });
    assert.equal(unauthorized.status, 401);
    const invalidTracking = await updateStatus(context.baseUrl, order.orderNumber, "SHIPPED", { trackingNumber: "<script>" });
    assert.equal(invalidTracking.status, 400);
    const saved = await dbGet(context.app.locals.db, "SELECT payment_status, fulfillment_status FROM orders WHERE order_number = ?", [order.orderNumber]);
    assert.deepEqual(saved, { payment_status: "AWAITING_PAYMENT", fulfillment_status: null });
  } finally {
    await context.close();
  }
});
