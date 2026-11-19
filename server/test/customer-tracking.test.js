const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createApp, dbGet, dbRun, buildCustomerOrderEmail } = require("../server");
const { buildFulfillmentNotificationEmail } = require("../fulfillment-notifications");

function tempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-tracking-test-")), "orders.db");
}

function validOrder() {
  return {
    submissionKey: "tracking-order-submission-key-0001",
    customer: { name: "Private Customer", email: "private@example.com", phone: "604-555-0101" },
    shipping: { street: "123 Private Lane", city: "Vancouver", province: "BC", postalCode: "V6B 1A1", country: "Canada" },
    notes: "Internal customer note must stay private.",
    items: [{ productId: 1, quantity: 1, colours: "Purple, Pearl", hardware: "Silver" }]
  };
}

async function startServer(options = {}) {
  const capturedEmails = [];
  const app = await createApp({
    databasePath: options.databasePath || tempDbPath(),
    referenceUploadPath: null,
    allowedOrigins: "https://foreverbeaded.ca,http://127.0.0.1",
    apiRateLimit: 1000,
    orderRateLimit: 100,
    reviewRateLimit: 100,
    trackingRateLimit: options.trackingRateLimit || 100,
    adminSecret: "tracking-admin-secret",
    paymentRemindersEnabled: false,
    fulfillmentNotificationsEnabled: options.fulfillmentNotificationsEnabled === true,
    trackingTokenSecret: "test-only-tracking-secret-that-is-long-enough",
    trackingPublicBaseUrl: "https://tracking.example.test",
    emailSender: options.emailSender || (async (order, saved) => {
      capturedEmails.push({ order, saved });
      return { emailSent: true, messageId: "owner-only" };
    }),
    fulfillmentNotificationSender: options.fulfillmentNotificationSender
  });
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  return {
    app,
    capturedEmails,
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async close() {
      await new Promise(resolve => server.close(resolve));
      await new Promise(resolve => app.locals.db.close(resolve));
    }
  };
}

async function createOrder(baseUrl) {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://foreverbeaded.ca" },
    body: JSON.stringify(validOrder())
  });
  assert.equal(response.status, 200);
  return response.json();
}

const adminHeaders = { Authorization: "Bearer tracking-admin-secret", "Content-Type": "application/json" };

async function createLink(baseUrl, orderNumber) {
  const response = await fetch(`${baseUrl}/api/admin/orders/${orderNumber}/tracking-link`, {
    method: "POST",
    headers: adminHeaders
  });
  assert.equal(response.status, 201);
  return response.json();
}

function tokenFrom(url) {
  return new URL(url).hash.slice(1);
}

async function trackingRequest(baseUrl, token) {
  return fetch(`${baseUrl}/api/tracking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
}

test("tracking token is generated automatically, secure, hash-only, and customer-private", async () => {
  const context = await startServer();
  try {
    const order = await createOrder(context.baseUrl);
    const automaticUrl = context.capturedEmails[0].saved.trackingUrl;
    const token = tokenFrom(automaticUrl);
    assert.match(automaticUrl, /^https:\/\/tracking\.example\.test\/track#[A-Za-z0-9_-]{43}$/);
    const unauthorized = await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/tracking-link`, { method: "POST" });
    assert.equal(unauthorized.status, 401);
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    const stored = await dbGet(context.app.locals.db, "SELECT token_hash, expires_at, revoked_at FROM order_tracking_links");
    assert.equal(stored.token_hash.length, 64);
    assert.notEqual(stored.token_hash, token);
    assert.equal(stored.revoked_at, null);

    const duplicate = await createOrder(context.baseUrl);
    assert.equal(duplicate.orderNumber, order.orderNumber);
    assert.equal(duplicate.duplicate, true);
    assert.equal(context.capturedEmails.length, 1);
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM orders")).count, 1);
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM order_tracking_links")).count, 1);

    const response = await trackingRequest(context.baseUrl, token);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const payload = await response.json();
    assert.deepEqual(Object.keys(payload.order).sort(), [
      "carrier", "fulfillmentStatus", "orderDate", "orderNumber", "paymentStatus", "pickupInstructions", "trackingNumber"
    ]);
    const serialized = JSON.stringify(payload);
    for (const privateValue of ["Private Customer", "private@example.com", "604-555-0101", "123 Private Lane", "Internal customer note"]) {
      assert.doesNotMatch(serialized, new RegExp(privateValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  } finally {
    await context.close();
  }
});

test("customer tracking follows all fulfilment states without changing payment status", async () => {
  const context = await startServer();
  try {
    const order = await createOrder(context.baseUrl);
    const token = tokenFrom(context.capturedEmails[0].saved.trackingUrl);
    const states = ["NEW", "IN_PROGRESS", "COMPLETED", "SHIPPED", "READY_FOR_PICKUP", "DELIVERED"];
    for (const fulfillmentStatus of states) {
      const body = { fulfillmentStatus };
      if (fulfillmentStatus === "SHIPPED") Object.assign(body, { trackingNumber: "CP-1234-TEST", carrier: "Canada Post" });
      if (fulfillmentStatus === "READY_FOR_PICKUP") body.pickupInstructions = "Please arrange a pickup time with Forever Beaded.";
      const update = await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/fulfillment-status`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify(body)
      });
      assert.equal(update.status, 200);
      const tracking = await (await trackingRequest(context.baseUrl, token)).json();
      assert.equal(tracking.order.fulfillmentStatus, fulfillmentStatus);
      assert.equal(tracking.order.paymentStatus, "AWAITING_PAYMENT");
      if (fulfillmentStatus === "SHIPPED") {
        assert.equal(tracking.order.trackingNumber, "CP-1234-TEST");
        assert.equal(tracking.order.carrier, "Canada Post");
      }
      if (fulfillmentStatus === "READY_FOR_PICKUP") {
        assert.equal(tracking.order.pickupInstructions, "Please reply to your Forever Beaded email to arrange pickup.");
      }
    }
    const saved = await dbGet(context.app.locals.db, "SELECT payment_status FROM orders WHERE order_number = ?", [order.orderNumber]);
    assert.equal(saved.payment_status, "AWAITING_PAYMENT");
  } finally {
    await context.close();
  }
});

test("rotated, revoked, expired, malformed, and unknown tracking links reveal nothing", async () => {
  const context = await startServer();
  try {
    const order = await createOrder(context.baseUrl);
    const firstToken = tokenFrom(context.capturedEmails[0].saved.trackingUrl);
    const second = await createLink(context.baseUrl, order.orderNumber);
    const secondToken = tokenFrom(second.trackingUrl);
    assert.notEqual(firstToken, secondToken);
    assert.equal((await trackingRequest(context.baseUrl, firstToken)).status, 404);
    assert.equal((await trackingRequest(context.baseUrl, "not-a-token")).status, 404);
    assert.equal((await trackingRequest(context.baseUrl, "A".repeat(43))).status, 404);

    const revoke = await fetch(`${context.baseUrl}/api/admin/orders/${order.orderNumber}/tracking-link`, {
      method: "DELETE",
      headers: adminHeaders
    });
    assert.equal(revoke.status, 200);
    assert.equal((await trackingRequest(context.baseUrl, secondToken)).status, 404);

    const third = await createLink(context.baseUrl, order.orderNumber);
    const thirdToken = tokenFrom(third.trackingUrl);
    await dbRun(context.app.locals.db, "UPDATE order_tracking_links SET expires_at = ?", ["2000-01-01T00:00:00.000Z"]);
    assert.equal((await trackingRequest(context.baseUrl, thirdToken)).status, 404);
  } finally {
    await context.close();
  }
});

test("tracking page is private, responsive, branded, and prepares reviews without sending them", async () => {
  const context = await startServer();
  try {
    const page = await fetch(`${context.baseUrl}/track`);
    assert.equal(page.status, 200);
    assert.equal(page.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
    const html = await page.text();
    assert.match(html, /Your creation is being handmade with love!/);
    assert.match(html, /reviewInvitation/);
    assert.doesNotMatch(html, /customer_email|shipping_address|phone/i);
    const css = await (await fetch(`${context.baseUrl}/tracking-assets/customer-tracking.css`)).text();
    assert.match(css, /@media \(max-width: 560px\)/);
    assert.match(css, /prefers-reduced-motion/);
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM review_requests")).count, 0);
  } finally {
    await context.close();
  }
});

test("future confirmation and fulfilment emails receive the same private tracking link", async () => {
  const context = await startServer();
  try {
    const orderResponse = await createOrder(context.baseUrl);
    const saved = context.capturedEmails[0].saved;
    const customerMessage = buildCustomerOrderEmail(context.capturedEmails[0].order, saved, "foreverbeaded1@gmail.com");
    assert.match(customerMessage.text, /Send your Interac e-Transfer to:/);
    assert.match(customerMessage.text, /Follow your treasure's journey:/);
    assert.match(customerMessage.text, /https:\/\/tracking\.example\.test\/track#[A-Za-z0-9_-]{43}/);

    const fulfillmentMessage = buildFulfillmentNotificationEmail({
      orderNumber: orderResponse.orderNumber,
      customerName: "Private Customer",
      productNames: ["Butterfly"],
      trackingUrl: saved.trackingUrl
    }, "COMPLETED");
    assert.match(fulfillmentMessage.text, /Follow your treasure's journey:/);
    assert.match(fulfillmentMessage.html, /tracking\.example\.test\/track#[A-Za-z0-9_-]{43}/);
  } finally {
    await context.close();
  }
});

test("email failure keeps the order and its single tracking link", async () => {
  const context = await startServer({
    emailSender: async () => ({ emailSent: false, providerResponse: "isolated SMTP failure", messageId: null })
  });
  try {
    const order = await createOrder(context.baseUrl);
    assert.equal(order.success, true);
    assert.equal(order.orderSaved, true);
    assert.equal(order.emailSent, false);
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM orders")).count, 1);
    assert.equal((await dbGet(context.app.locals.db, "SELECT COUNT(*) AS count FROM order_tracking_links")).count, 1);
  } finally {
    await context.close();
  }
});

test("invalid tracking requests are rate limited without revealing link state", async () => {
  const context = await startServer({ trackingRateLimit: 2 });
  try {
    assert.equal((await trackingRequest(context.baseUrl, "invalid-one")).status, 404);
    assert.equal((await trackingRequest(context.baseUrl, "invalid-two")).status, 404);
    const limited = await trackingRequest(context.baseUrl, "invalid-three");
    assert.equal(limited.status, 429);
  } finally {
    await context.close();
  }
});

test("migration does not backfill a tracking link for an existing order", async () => {
  const databasePath = tempDbPath();
  const first = await startServer({ databasePath });
  try {
    await createOrder(first.baseUrl);
    await dbRun(first.app.locals.db, "DELETE FROM order_tracking_links");
  } finally {
    await first.close();
  }
  const reopened = await startServer({ databasePath });
  try {
    assert.equal((await dbGet(reopened.app.locals.db, "SELECT COUNT(*) AS count FROM orders")).count, 1);
    assert.equal((await dbGet(reopened.app.locals.db, "SELECT COUNT(*) AS count FROM order_tracking_links")).count, 0);
  } finally {
    await reopened.close();
  }
});
