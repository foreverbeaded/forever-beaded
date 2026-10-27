const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const test = require("node:test");
const sharp = require("sharp");
const sqlite3 = require("sqlite3").verbose();
const { createApp, dbGet, dbRun } = require("../server");
const { SEED_PRODUCTS } = require("../catalogue");

function tempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-test-"));
  return path.join(dir, "orders.db");
}

async function withServer(options = {}, callback) {
  const referenceUploadPath = Object.prototype.hasOwnProperty.call(options, "referenceUploadPath")
    ? options.referenceUploadPath
    : fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-reference-test-"));
  const app = await createApp({
    databasePath: tempDbPath(),
    allowedOrigins: "https://foreverbeaded.github.io,http://localhost,http://127.0.0.1",
    apiRateLimit: options.apiRateLimit || 200,
    orderRateLimit: options.orderRateLimit || 20,
    reviewRateLimit: options.reviewRateLimit || 20,
    emailSender: options.emailSender,
    reviewEmailSender: options.reviewEmailSender,
    reviewNotificationSender: options.reviewNotificationSender || (async () => ({
      emailSent: true,
      provider: "test",
      providerResponse: "accepted",
      messageId: "review-notification-test"
    })),
    reviewSaver: options.reviewSaver,
    referenceUploadPath,
    adminSecret: options.adminSecret || "test-admin-secret"
  });
  const server = await new Promise((resolve, reject) => {
    let attempts = 0;
    const listen = () => {
      attempts += 1;
      const port = 31000 + Math.floor(Math.random() * 10000);
      const instance = app.listen(port, "127.0.0.1", () => resolve(instance));
      instance.once("error", (error) => {
        if (error.code === "EADDRINUSE" && attempts < 20) return listen();
        return reject(error);
      });
    };
    listen();
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await callback({ app, baseUrl });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => app.locals.db.close(resolve));
  }
}

async function postReview(baseUrl, payload) {
  return fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://foreverbeaded.github.io" },
    body: JSON.stringify({ submissionKey: randomUUID(), ...payload })
  });
}

test("review schema migration preserves existing rows and adds notification fields", async () => {
  const databasePath = tempDbPath();
  const legacyDb = new sqlite3.Database(databasePath);
  await dbRun(legacyDb, `CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    display_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT,
    stars INTEGER NOT NULL,
    review_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    moderated_at TEXT,
    moderation_note TEXT
  )`);
  await dbRun(legacyDb, `INSERT INTO reviews (
    created_at, updated_at, display_name, customer_email, product_id, product_name, stars, review_text, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`, [
    "2026-10-01T00:00:00.000Z", "2026-10-01T00:00:00.000Z", "Existing Customer",
    "existing@example.com", "1", "Butterfly", 5, "An existing review that must be preserved."
  ]);
  await new Promise((resolve, reject) => legacyDb.close(error => error ? reject(error) : resolve()));

  const app = await createApp({
    databasePath,
    referenceUploadPath: null,
    adminSecret: "test-admin-secret",
    reviewNotificationSender: async () => ({ emailSent: true })
  });
  try {
    const columns = await new Promise((resolve, reject) => {
      app.locals.db.all("PRAGMA table_info(reviews)", [], (error, rows) => error ? reject(error) : resolve(rows));
    });
    const names = new Set(columns.map(column => column.name));
    assert.ok(names.has("submission_key_hash"));
    assert.ok(names.has("notification_status"));
    assert.ok(names.has("notification_error"));
    const preserved = await dbGet(app.locals.db, "SELECT display_name, status FROM reviews WHERE id = 1");
    assert.deepEqual(preserved, { display_name: "Existing Customer", status: "PENDING" });
  } finally {
    await new Promise(resolve => app.locals.db.close(resolve));
  }
});

test("stores reviews as pending and publishes only approved fields", async () => {
  const notifications = [];
  await withServer({
    reviewNotificationSender: async (review) => {
      notifications.push(review.id);
      return { emailSent: true, provider: "test", providerResponse: "accepted", messageId: "review-1" };
    }
  }, async ({ app, baseUrl }) => {
    const response = await postReview(baseUrl, {
      displayName: "Happy Customer",
      email: "private@example.com",
      productSlug: "butterfly",
      stars: 4,
      text: "The colours were lovely and the keychain was beautifully made.",
      consent: true,
      website: ""
    });
    const body = await response.json();
    assert.equal(response.status, 201);
    assert.equal(body.status, "PENDING");

    const stored = await dbGet(app.locals.db, `SELECT display_name, customer_email, product_name, stars, status,
      notification_status FROM reviews WHERE id = ?`, [body.reviewId]);
    assert.deepEqual(stored, {
      display_name: "Happy Customer",
      customer_email: "private@example.com",
      product_name: "Butterfly",
      stars: 4,
      status: "PENDING",
      notification_status: "SENT"
    });
    assert.deepEqual(notifications, [body.reviewId]);

    const beforeApproval = await (await fetch(`${baseUrl}/api/reviews`)).json();
    assert.deepEqual(beforeApproval.reviews, []);

    const pendingResponse = await fetch(`${baseUrl}/api/admin/reviews?status=PENDING`, {
      headers: { Authorization: "Bearer test-admin-secret" }
    });
    const pending = await pendingResponse.json();
    assert.equal(pending.reviews.length, 1);
    assert.equal(pending.reviews[0].customer_email, "private@example.com");

    const moderationResponse = await fetch(`${baseUrl}/api/admin/reviews/${body.reviewId}`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer test-admin-secret",
        "Content-Type": "application/json",
        Origin: "https://forever-beaded-api.onrender.com"
      },
      body: JSON.stringify({ status: "APPROVED" })
    });
    assert.equal(moderationResponse.status, 200);

    const publicResponse = await fetch(`${baseUrl}/api/reviews`);
    const publicBody = await publicResponse.json();
    assert.equal(publicBody.reviews.length, 1);
    assert.equal(publicBody.reviews[0].displayName, "Happy Customer");
    assert.equal(publicBody.reviews[0].product, "Butterfly");
    assert.equal(Object.hasOwn(publicBody.reviews[0], "customer_email"), false);
  });
});

test("validates review input and rejects the honeypot", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const baseReview = {
      displayName: "Customer",
      email: "customer@example.com",
      stars: 5,
      text: "A thoughtful and honest review of this handmade piece.",
      consent: true
    };
    assert.equal((await postReview(baseUrl, { ...baseReview, stars: 6 })).status, 400);
    assert.equal((await postReview(baseUrl, { ...baseReview, consent: false })).status, 400);
    assert.equal((await postReview(baseUrl, { ...baseReview, website: "spam.example" })).status, 400);
    assert.equal((await postReview(baseUrl, { ...baseReview, productSlug: "not-a-product" })).status, 400);
  });
});

test("accepts trimmed reviews from 3 through 600 characters", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const baseReview = {
      displayName: "Customer",
      email: "customer@example.com",
      productSlug: "butterfly",
      stars: 5,
      consent: true,
      website: ""
    };
    const cases = [
      { text: "", status: 400 },
      { text: "A", status: 400 },
      { text: "OK", status: 400 },
      { text: "Wow", status: 201 },
      { text: "Love it!!", status: 201 },
      { text: "Beautiful!", status: 201 },
      { text: "A".repeat(600), status: 201 },
      { text: "   ", status: 400 }
    ];

    for (const reviewCase of cases) {
      const response = await postReview(baseUrl, { ...baseReview, text: reviewCase.text });
      assert.equal(response.status, reviewCase.status, `unexpected status for ${reviewCase.text.trim().length} characters`);
      const body = await response.json();
      if (reviewCase.status === 201) {
        assert.equal(body.status, "PENDING");
      } else if (reviewCase.text.trim().length > 0) {
        assert.match(body.error, /at least 3 characters/i);
      }
    }
  });
});

test("a failed review database write never returns success", async () => {
  await withServer({
    reviewSaver: async () => {
      throw new Error("simulated database failure");
    }
  }, async ({ baseUrl }) => {
    const response = await postReview(baseUrl, {
      displayName: "Customer",
      email: "customer@example.com",
      productSlug: "butterfly",
      stars: 5,
      text: "This review must not be acknowledged as saved.",
      consent: true
    });
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.notEqual(body.success, true);
    assert.equal(Object.hasOwn(body, "reviewId"), false);
  });
});

test("duplicate review submissions return the persisted pending record once", async () => {
  const notifications = [];
  await withServer({
    reviewNotificationSender: async (review) => {
      notifications.push(review.id);
      return { emailSent: true, provider: "test", providerResponse: "accepted", messageId: "dedupe-test" };
    }
  }, async ({ app, baseUrl }) => {
    const payload = {
      submissionKey: "fixed-review-submission-key-123",
      displayName: "Retrying Customer",
      email: "retry@example.com",
      productSlug: "butterfly",
      stars: 5,
      text: "The same saved review should be returned on a safe retry.",
      consent: true
    };
    const first = await postReview(baseUrl, payload);
    const firstBody = await first.json();
    const second = await postReview(baseUrl, payload);
    const secondBody = await second.json();
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal(secondBody.duplicate, true);
    assert.equal(secondBody.reviewId, firstBody.reviewId);
    assert.equal((await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM reviews")).count, 1);
    assert.equal(notifications.length, 1);
  });
});

test("failed owner notification keeps the review and a retry does not duplicate it", async () => {
  let attempts = 0;
  await withServer({
    reviewNotificationSender: async () => {
      attempts += 1;
      return {
        emailSent: attempts > 1,
        provider: "test",
        providerResponse: attempts > 1 ? "accepted" : "temporary failure",
        messageId: attempts > 1 ? "retry-sent" : null
      };
    }
  }, async ({ app, baseUrl }) => {
    const payload = {
      submissionKey: "notification-retry-key-12345",
      displayName: "Notification Customer",
      email: "notify@example.com",
      productSlug: "butterfly",
      stars: 4,
      text: "The review remains saved when the owner email is unavailable.",
      consent: true
    };
    const firstBody = await (await postReview(baseUrl, payload)).json();
    let stored = await dbGet(app.locals.db, "SELECT status, notification_status FROM reviews WHERE id = ?", [firstBody.reviewId]);
    assert.deepEqual(stored, { status: "PENDING", notification_status: "FAILED" });

    const retryResponse = await postReview(baseUrl, payload);
    const retryBody = await retryResponse.json();
    assert.equal(retryResponse.status, 200);
    assert.equal(retryBody.reviewId, firstBody.reviewId);
    assert.equal((await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM reviews")).count, 1);
    stored = await dbGet(app.locals.db, "SELECT notification_status FROM reviews WHERE id = ?", [firstBody.reviewId]);
    assert.equal(stored.notification_status, "SENT");
    assert.equal(attempts, 2);
  });
});

test("unauthorized moderation is rejected and rejected reviews remain private", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const submitted = await (await postReview(baseUrl, {
      displayName: "Private Customer",
      email: "private-customer@example.com",
      productSlug: "butterfly",
      stars: 2,
      text: "This rejected review must never become public.",
      consent: true
    })).json();
    assert.equal((await fetch(`${baseUrl}/api/admin/reviews?status=PENDING`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/api/admin/reviews/${submitted.reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" })
    })).status, 401);

    const rejection = await fetch(`${baseUrl}/api/admin/reviews/${submitted.reviewId}`, {
      method: "PUT",
      headers: { Authorization: "Bearer test-admin-secret", "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" })
    });
    assert.equal(rejection.status, 200);
    const publicBody = await (await fetch(`${baseUrl}/api/reviews`)).json();
    assert.deepEqual(publicBody.reviews, []);
    const rejectedBody = await (await fetch(`${baseUrl}/api/admin/reviews?status=REJECTED`, {
      headers: { Authorization: "Bearer test-admin-secret" }
    })).json();
    assert.equal(rejectedBody.reviews.length, 1);
    assert.equal(rejectedBody.reviews[0].customer_email, "private-customer@example.com");
  });
});

test("manual review requests require delivery confirmation and are sent once", async () => {
  const sent = [];
  await withServer({
    reviewEmailSender: async (order) => {
      sent.push(order.orderNumber);
      return { emailSent: true, to: order.customerEmail, provider: "test", providerResponse: "accepted", messageId: "review-test" };
    }
  }, async ({ app, baseUrl }) => {
    const orderResponse = await postOrder(baseUrl, validOrder());
    const order = await orderResponse.json();
    const url = `${baseUrl}/api/admin/orders/${order.orderNumber}/review-request`;
    const headers = { Authorization: "Bearer test-admin-secret", "Content-Type": "application/json" };

    assert.equal((await fetch(url, { method: "POST", headers, body: JSON.stringify({ deliveryConfirmed: false }) })).status, 400);
    assert.equal((await fetch(url, { method: "POST", headers, body: JSON.stringify({ deliveryConfirmed: true }) })).status, 200);
    assert.equal((await fetch(url, { method: "POST", headers, body: JSON.stringify({ deliveryConfirmed: true }) })).status, 409);
    assert.equal(sent.length, 1);

    const event = await dbGet(app.locals.db, "SELECT event_type FROM order_events WHERE event_type = 'REVIEW_REQUEST_SENT'");
    assert.equal(event.event_type, "REVIEW_REQUEST_SENT");
  });
});

test("failed review invitation can be retried and moderation page is available", async () => {
  let attempt = 0;
  await withServer({
    reviewEmailSender: async (order) => {
      attempt += 1;
      return {
        emailSent: attempt > 1,
        to: order.customerEmail,
        provider: "test",
        providerResponse: attempt > 1 ? "accepted" : "temporary failure",
        messageId: attempt > 1 ? "review-retry" : null
      };
    }
  }, async ({ baseUrl }) => {
    const page = await fetch(`${baseUrl}/admin/reviews`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Review Moderation/);

    const orderResponse = await postOrder(baseUrl, validOrder());
    const order = await orderResponse.json();
    const url = `${baseUrl}/api/admin/orders/${order.orderNumber}/review-request`;
    const options = {
      method: "POST",
      headers: { Authorization: "Bearer test-admin-secret", "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryConfirmed: true })
    };
    assert.equal((await fetch(url, options)).status, 503);
    assert.equal((await fetch(url, options)).status, 200);
    assert.equal(attempt, 2);
  });
});

function validOrder(overrides = {}) {
  return {
    customer: {
      name: "Website Customer",
      email: "customer@example.com",
      phone: "604-555-1212"
    },
    shipping: {
      address: "123 Bead Lane",
      street: "123 Bead Lane",
      city: "Vancouver",
      province: "BC",
      postalCode: "v6b1a1",
      country: "Canada",
      addressAsEntered: "123 Bead Lane\nVancouver, BC v6b1a1\nCanada"
    },
    notes: "Please use warm colours.",
    items: [
      {
        productId: 1,
        quantity: 2,
        colours: "Purple, Cream, Gold",
        personalization: "Ava",
        hardware: "Gold"
      }
    ],
    ...overrides
  };
}

async function postOrder(baseUrl, payload, headers = {}) {
  return fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://foreverbeaded.github.io", ...headers },
    body: JSON.stringify(payload)
  });
}

test("creates a valid Interac e-Transfer order", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder());
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.match(body.orderNumber, /^FB-\d{8}-0001$/);
    assert.equal(body.total, 4500);
    assert.equal(body.currency, "CAD");
    assert.equal(body.paymentMethod, "INTERAC_ETRANSFER");
    assert.equal(body.paymentStatus, "AWAITING_PAYMENT");
    assert.equal(body.etransferEmail, "foreverbeaded1@gmail.com");
    assert.equal(body.workbookUpdated, true);
    assert.equal(body.orderSaved, true);
    assert.equal(body.emailSent, false);
    assert.equal(body.confirmationEmail.to, "foreverbeaded1@gmail.com");
    assert.equal(body.confirmationEmail.provider, "smtp");
    assert.equal(body.confirmationEmail.messageId, null);
    assert.match(body.confirmationEmail.providerResponse, /Missing email environment variables/);
    assert.match(body.message, /^Thank you! Your Forever Beaded order has been received\./);
    assert.match(body.message, /Order number: FB-\d{8}-0001/);
    assert.match(body.message, /Total: 45\.00 CAD/);
    assert.match(body.message, /Shipping address:\n123 Bead Lane\nVancouver, BC V6B 1A1\nCanada/);
    assert.match(body.message, /Send your Interac e-Transfer to:\nforeverbeaded1@gmail\.com/);
    assert.doesNotMatch(body.message, /saved|email notification|SMTP|server|backend/i);
    assert.doesNotMatch(body.message, /confirmation email has been sent/i);

    const row = await dbGet(app.locals.db, "SELECT total_cents, payment_status, order_status, address_as_entered, normalized_address, city, province, postal_code, country FROM orders WHERE order_number = ?", [body.orderNumber]);
    assert.deepEqual(row, {
      total_cents: 4500,
      payment_status: "AWAITING_PAYMENT",
      order_status: "NEW",
      address_as_entered: "123 Bead Lane\nVancouver, BC v6b1a1\nCanada",
      normalized_address: "123 Bead Lane\nVancouver, BC V6B 1A1\nCanada",
      city: "Vancouver",
      province: "BC",
      postal_code: "V6B 1A1",
      country: "Canada"
    });
    assert.ok(fs.existsSync(path.join(__dirname, "..", "data", "orders.xls")));
    const emailFiles = fs.readdirSync(path.join(__dirname, "..", "data", "email-outbox"));
    assert.ok(emailFiles.some((file) => file.startsWith(`${body.orderNumber}-`) && file.endsWith(".eml")));
  });
});

test("adds another treasure to the same order number", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const first = await postOrder(baseUrl, validOrder({
      items: [{ productId: "butterfly", quantity: 1, colours: "Purple, Cream, Gold", hardware: "Gold" }]
    }));
    const firstBody = await first.json();
    assert.equal(first.status, 200);
    assert.match(firstBody.orderNumber, /^FB-\d{8}-0001$/);
    assert.equal(firstBody.items.length, 1);

    const appendTreasure = (item) => fetch(`${baseUrl}/api/orders/${encodeURIComponent(firstBody.orderNumber)}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://foreverbeaded.github.io" },
      body: JSON.stringify({ item })
    });
    const second = await appendTreasure({
      productId: "gecko",
      quantity: 1,
      colours: "Green, Blue, Black",
      hardware: "Silver",
      personalizationType: "none",
      personalizationText: ""
    });
    const secondBody = await second.json();
    assert.equal(second.status, 200);
    assert.equal(secondBody.success, true);
    assert.equal(secondBody.orderNumber, firstBody.orderNumber);
    assert.equal(secondBody.items.length, 2);
    assert.deepEqual(secondBody.items.map((item) => item.productName), ["Butterfly", "Gecko Keychain"]);
    assert.deepEqual(secondBody.items.map((item) => item.lineTotalCents), [2000, 2000]);
    assert.equal(secondBody.total, 4500);

    const third = await appendTreasure({
      productId: "macaw",
      quantity: 1,
      colours: "Red, Yellow, Blue",
      hardware: "Gold",
      personalizationType: "none",
      personalizationText: ""
    });
    const thirdBody = await third.json();
    assert.equal(third.status, 200);
    assert.equal(thirdBody.success, true);
    assert.equal(thirdBody.orderNumber, firstBody.orderNumber);
    assert.equal(thirdBody.items.length, 3);
    assert.deepEqual(thirdBody.items.map((item) => item.productName), ["Butterfly", "Gecko Keychain", "Macaw"]);
    assert.equal(thirdBody.total, 8700);

    const orderCount = await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM orders WHERE order_number = ?", [firstBody.orderNumber]);
    const itemCount = await dbGet(app.locals.db, `SELECT COUNT(*) AS count
      FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE orders.order_number = ?`, [firstBody.orderNumber]);
    const savedTotal = await dbGet(app.locals.db, "SELECT total_cents FROM orders WHERE order_number = ?", [firstBody.orderNumber]);
    assert.equal(orderCount.count, 1);
    assert.equal(itemCount.count, 3);
    assert.equal(savedTotal.total_cents, 8700);
  });
});

test("includes customer confirmation email line only when provider accepts email", async () => {
  await withServer({
    emailSender: async () => ({
      emailSent: true,
      to: "foreverbeaded1@gmail.com",
      provider: "smtp",
      providerResponse: "250 2.0.0 OK queued",
      messageId: "<test-message@forever-beaded.local>"
    })
  }, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder());
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.emailSent, true);
    assert.equal(body.confirmationEmail.messageId, "<test-message@forever-beaded.local>");
    assert.match(body.message, /A confirmation email has been sent to your inbox\./);
    assert.doesNotMatch(body.message, /SMTP|backend|server|email notification failed/i);
  });
});

test("seeds active products and exposes safe catalogue metadata", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const activeProductCount = new Set(
      SEED_PRODUCTS.filter((product) => product.active === 1).map((product) => product.id)
    ).size;
    const seeded = await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM products WHERE active = 1");
    assert.equal(seeded.count, activeProductCount);

    const response = await fetch(`${baseUrl}/api/products`, {
      headers: { Origin: "https://foreverbeaded.github.io" }
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.products.length, activeProductCount);
    for (const slug of ["natalies-butterfly", "fish", "crab", "penguin", "whale", "jellyfish", "lobster", "shark", "custom-idea", "gecko", "big-flower", "lion", "zebra", "personalized-love-heart-keychain"]) {
      const expected = SEED_PRODUCTS.find((product) => product.slug === slug);
      const actual = body.products.find((product) => product.slug === slug);
      assert.ok(actual, `${slug} is missing from the catalogue API`);
      assert.equal(actual.name, expected.name);
      assert.equal(actual.category, expected.category);
      assert.equal(actual.basePriceCents, expected.basePriceCents);
      assert.equal(actual.referenceImageUrl, expected.referenceImageUrl);
      assert.equal(actual.previewImageUrl, expected.previewImageUrl);
    }
    assert.ok(body.products.find((product) => product.slug === "gecko").previewPattern.length > 0);
    assert.deepEqual(body.products.find((product) => product.slug === "custom-idea").previewPattern, null);
    const idColumn = await dbGet(app.locals.db, "SELECT type FROM pragma_table_info('products') WHERE name = 'id'");
    assert.equal(idColumn.type, "INTEGER");
    const referenceColumn = await dbGet(app.locals.db, "SELECT type FROM pragma_table_info('products') WHERE name = 'reference_image_url'");
    const previewColumn = await dbGet(app.locals.db, "SELECT type FROM pragma_table_info('products') WHERE name = 'preview_image_url'");
    assert.equal(referenceColumn.type, "TEXT");
    assert.equal(previewColumn.type, "TEXT");
  });
});

test("admin page permits protected blob previews while admin APIs remain authenticated", async () => {
  await withServer({ adminSecret: "csp-admin-secret" }, async ({ baseUrl }) => {
    const page = await fetch(`${baseUrl}/admin/custom-designs`);
    assert.equal(page.status, 200);
    const policy = page.headers.get("content-security-policy") || "";
    assert.match(policy, /img-src[^;]*'self'[^;]*data:[^;]*blob:/);

    const unauthenticated = await fetch(`${baseUrl}/api/admin/health`);
    assert.equal(unauthenticated.status, 401);
    assert.equal((await unauthenticated.json()).error, "Authentication required.");
  });
});

test("trusted catalogue IDs are unique after resolving the legacy collision", () => {
  const ids = SEED_PRODUCTS.map((product) => product.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(SEED_PRODUCTS.find((product) => product.slug === "monkey").id, 42);
  assert.equal(SEED_PRODUCTS.find((product) => product.slug === "pumpkin-spice-latte").id, 114);
  assert.equal(SEED_PRODUCTS.find((product) => product.slug === "lion").id, 134);
  assert.equal(SEED_PRODUCTS.find((product) => product.slug === "zebra").id, 135);
  assert.equal(SEED_PRODUCTS.find((product) => product.slug === "personalized-love-heart-keychain").id, 136);
});

test("uses the trusted Personalized Love Heart Keychain price", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({
      total: 1,
      items: [{
        productId: "personalized-love-heart-keychain",
        quantity: 1,
        unitPriceCents: 1,
        colours: "Pink, Red, White, Pearl",
        hardware: "Silver",
        personalization: "NOAH LOVES FIONA"
      }]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.total, 3500);
    assert.equal(body.items[0].productName, "Personalized Love Heart Keychain");
    assert.equal(body.items[0].unitPriceCents, 3000);
  });
});

test("uses the trusted Scripture dove price and enforces its physical personalization limit", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const validResponse = await postOrder(baseUrl, validOrder({
      total: 1,
      items: [{
        productId: "personalized-scripture-dove-keychain",
        quantity: 1,
        unitPriceCents: 1,
        colours: "White, Grey, Yellow, Green, Brown",
        hardware: "Silver",
        personalizationType: "name",
        personalizationText: "ISAIAH 41:10"
      }]
    }));
    const validBody = await validResponse.json();
    assert.equal(validResponse.status, 200);
    assert.equal(validBody.items[0].productName, "Personalized Scripture Dove Keychain");
    assert.equal(validBody.items[0].unitPriceCents, 3000);
    assert.equal(validBody.items[0].personalizationText, "ISAIAH 41:10");

    const tooLongResponse = await postOrder(baseUrl, validOrder({
      items: [{
        productId: "personalized-scripture-dove-keychain",
        quantity: 1,
        colours: "White, Grey, Yellow, Green, Brown",
        hardware: "Silver",
        personalizationType: "name",
        personalizationText: "PSALM 119:105"
      }]
    }));
    assert.equal(tooLongResponse.status, 400);

    const legacySlugResponse = await postOrder(baseUrl, validOrder({
      items: [{
        productId: "personalized-scripture-cross-keychain",
        quantity: 1,
        colours: "White, Grey, Yellow, Green, Brown",
        hardware: "Silver",
        personalizationType: "name",
        personalizationText: "ISAIAH 41:10"
      }]
    }));
    const legacySlugBody = await legacySlugResponse.json();
    assert.equal(legacySlugResponse.status, 200);
    assert.equal(legacySlugBody.items[0].productName, "Personalized Scripture Dove Keychain");
    assert.equal(legacySlugBody.items[0].productId, "173");
  });
});

test("uses the provisional trusted Frog and Blossom prices and personalization limits", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({
      total: 1,
      items: [
        {
          productId: "frog-keychain",
          quantity: 1,
          unitPriceCents: 1,
          colours: "Green, Red, Black",
          hardware: "Gold",
          personalizationType: "name",
          personalizationText: "ALEX"
        },
        {
          productId: "personalized-blossom-keychain",
          quantity: 1,
          unitPriceCents: 1,
          colours: "Pink, Pearl, Gold, Lavender",
          hardware: "Silver",
          personalizationType: "name",
          personalizationText: "NATALIE"
        }
      ]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body.items.map(item => ({ name: item.productName, price: item.unitPriceCents, personalization: item.personalizationText })), [
      { name: "Frog Keychain", price: 2500, personalization: "ALEX" },
      { name: "Personalized Blossom Keychain", price: 3000, personalization: "NATALIE" }
    ]);
  });
});

test("stores Pearl exactly through the trusted order flow", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({
      items: [{ productId: "butterfly", quantity: 1, colours: "Pink, Purple, Pearl", hardware: "Silver" }]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.items[0].colours, "Pink, Purple, Pearl");
    const row = await dbGet(app.locals.db, `SELECT colours FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE orders.order_number = ?`, [body.orderNumber]);
    assert.equal(row.colours, "Pink, Purple, Pearl");
  });
});

test("uses trusted Lion and Zebra prices instead of browser totals", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({
      total: 1,
      items: [
        { productId: "lion", quantity: 1, unitPriceCents: 1, colours: "Orange, Yellow", hardware: "Silver" },
        { productId: "zebra", quantity: 2, unitPriceCents: 1, colours: "Black, White", hardware: "Silver" }
      ]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.total, 7500);
    assert.deepEqual(body.items.map((item) => [item.productName, item.unitPriceCents, item.lineTotalCents]), [
      ["Lion", 2500, 2500],
      ["Zebra", 2500, 5000]
    ]);
    const rows = await new Promise((resolve, reject) => {
      app.locals.db.all(`SELECT product_name, unit_price_cents, line_total_cents FROM order_items
        JOIN orders ON orders.id = order_items.order_id
        WHERE orders.order_number = ? ORDER BY order_items.id`, [body.orderNumber], (error, result) => error ? reject(error) : resolve(result));
    });
    assert.deepEqual(rows, [
      { product_name: "Lion", unit_price_cents: 2500, line_total_cents: 2500 },
      { product_name: "Zebra", unit_price_cents: 2500, line_total_cents: 5000 }
    ]);
  });
});

test("seeded product image paths point to existing jpeg assets", () => {
  const products = require("../../js/product-catalogue");
  const expectedMappings = {
    "natalies-butterfly": "etsy/images-branded/natalies-butterfly-owner-approved-master.jpg",
    gecko: "etsy/images-branded/gecko-tiny-garden-branded.png",
    macaw: "etsy/images-branded/macaw-owner-approved-master.jpg",
    fish: "etsy/images-branded/fish-approved-master.jpg",
    crab: "etsy/images-branded/crab-approved-master.jpg",
    pencil: "etsy/images-branded/colouring-pencil-owner-approved-master.jpg",
    octopus: "etsy/images-branded/octopus-etsy-branded.jpg",
    "soccer-ball": "images/sports/soccer-ball.jpg",
    flower: "etsy/images-branded/flower-owner-approved-master.jpg",
    "big-flower": "etsy/images-branded/big-flower-approved-master.jpg",
    lion: "etsy/images-branded/lion-safari-owner-approved.jpg",
    zebra: "etsy/images-branded/zebra-safari-owner-approved.jpg"
  };

  for (const product of products) {
    if (product.imageUrl) {
      assert.match(product.imageUrl, /^(?:images|etsy\/images-branded)\/.+\.(?:jpe?g|png|webp)$/);
      assert.ok(fs.existsSync(path.join(__dirname, "..", "..", product.imageUrl)), `${product.name} image is missing at ${product.imageUrl}`);
    }
    if (product.referenceImageUrl) {
      assert.match(product.referenceImageUrl, /^(?:images|etsy\/images-branded)\/.+\.(?:jpe?g|png|webp)$/);
      assert.ok(fs.existsSync(path.join(__dirname, "..", "..", product.referenceImageUrl)), `${product.name} reference image is missing at ${product.referenceImageUrl}`);
    }
    if (product.previewImageUrl) {
      assert.match(product.previewImageUrl, /^(?:images|etsy\/images-branded)\/.+\.(?:jpe?g|png|webp)$/);
      assert.ok(fs.existsSync(path.join(__dirname, "..", "..", product.previewImageUrl)), `${product.name} preview image is missing at ${product.previewImageUrl}`);
    }
    assert.ok(Array.isArray(product.defaultColours), `${product.name} is missing default colours`);
    if (product.slug === "custom-idea") {
      assert.equal(product.previewPattern, null);
    } else if (product.previewPattern !== null) {
      assert.ok(Array.isArray(product.previewPattern) && product.previewPattern.length > 0, `${product.name} is missing a preview pattern`);
    }
    if (expectedMappings[product.slug]) {
      assert.equal(product.imageUrl, expectedMappings[product.slug]);
      assert.equal(product.referenceImageUrl, expectedMappings[product.slug]);
      assert.equal(product.previewImageUrl, expectedMappings[product.slug]);
    }
  }
});

test("rejects an invalid email", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ customer: { name: "Ava", email: "not-an-email" } }));
    assert.equal(response.status, 400);
  });
});

test("rejects empty items", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ items: [] }));
    assert.equal(response.status, 400);
  });
});

test("rejects unknown product IDs", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ items: [{ productId: "DROP_TABLE", quantity: 1 }] }));
    assert.equal(response.status, 400);
  });
});

test("accepts product slugs as trusted catalogue lookups", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ items: [{ productId: "gecko", quantity: 1 }] }));
    const body = await response.json();
    assert.equal(response.status, 200);
    const item = await dbGet(app.locals.db, "SELECT product_id, product_name, unit_price_cents FROM order_items JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?", [body.orderNumber]);
    assert.deepEqual(item, { product_id: "2", product_name: "Gecko Keychain", unit_price_cents: 2000 });
  });
});

test("accepts Natalie’s Butterfly and ocean animal variants", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const accepted = await postOrder(baseUrl, validOrder({ items: [{ productId: "natalies-butterfly", quantity: 1, colours: "Pink, Purple, Orange" }] }));
    const acceptedBody = await accepted.json();
    assert.equal(accepted.status, 200);
    assert.equal(acceptedBody.total, 3000);
    const item = await dbGet(app.locals.db, "SELECT product_id, product_name, unit_price_cents FROM order_items JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?", [acceptedBody.orderNumber]);
    assert.deepEqual(item, { product_id: "12", product_name: "Natalie’s Butterfly", unit_price_cents: 2500 });

    for (const [slug, expectedTotal] of [["fish", 2500], ["crab", 3000], ["penguin", 2500]]) {
      const response = await postOrder(baseUrl, validOrder({ items: [{ productId: slug, quantity: 1 }] }));
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.total, expectedTotal);
    }
  });
});

test("creates Big Flower orders from the product slug", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ items: [{ productId: "big-flower", quantity: 1, colours: "Purple, Cream, Gold" }] }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.total, 3000);
    const item = await dbGet(app.locals.db, "SELECT product_id, product_name, unit_price_cents, line_total_cents FROM order_items JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?", [body.orderNumber]);
    assert.deepEqual(item, { product_id: "11", product_name: "Big Flower", unit_price_cents: 2500, line_total_cents: 2500 });
  });
});

test("rejects negative and excessive quantities", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const negative = await postOrder(baseUrl, validOrder({ items: [{ productId: 1, quantity: -1 }] }));
    const excessive = await postOrder(baseUrl, validOrder({ items: [{ productId: 1, quantity: 999 }] }));
    assert.equal(negative.status, 400);
    assert.equal(excessive.status, 400);
  });
});

test("ignores manipulated browser totals and calculates trusted totals", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ total: 1, subtotal: 1 }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.total, 4500);
    const row = await dbGet(app.locals.db, "SELECT subtotal_cents, shipping_cents, total_cents FROM orders WHERE order_number = ?", [body.orderNumber]);
    assert.deepEqual(row, { subtotal_cents: 4000, shipping_cents: 500, total_cents: 4500 });
  });
});

test("rejects oversized notes", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ notes: "x".repeat(1001) }));
    assert.equal(response.status, 400);
  });
});

test("rejects honeypot bot submissions", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ website: "https://spam.example" }));
    assert.equal(response.status, 400);
  });
});

test("requires and stores custom idea descriptions with line breaks", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const missing = await postOrder(baseUrl, validOrder({
      items: [{ productId: 10, design: "Custom Idea", quantity: 1 }]
    }));
    assert.equal(missing.status, 400);

    const description = "A tiny garden charm\n  with purple flowers and initials AG.";
    const response = await postOrder(baseUrl, validOrder({
      items: [{ productId: 10, design: "Custom Idea", quantity: 1, colours: "Purple", customDescription: `  ${description}  ` }]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.items[0].customDescription, description);
    assert.match(body.message, /^Thank you! Your Forever Beaded order has been received\./);
    assert.doesNotMatch(body.message, /Custom idea:/);
    const row = await dbGet(app.locals.db, "SELECT custom_description FROM order_items JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?", [body.orderNumber]);
    assert.equal(row.custom_description, description);
  });
});

test("stores personalization type and text with orders", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({
      customer: {
        name: "Becky Customer",
        email: "becky@example.com",
        phone: "604-555-1212"
      },
      items: [{
        productId: 1,
        quantity: 1,
        colours: "Purple, Cream, Gold",
        hardware: "Gold",
        requestedProductName: "Butterfly Keepsake",
        personalizationType: "name",
        personalizationText: "becky"
      }]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.items[0].personalizationType, "name");
    assert.equal(body.items[0].personalizationText, "BECKY");
    assert.equal(body.items[0].requestedProductName, "Butterfly Keepsake");
    assert.match(body.message, /^Thank you! Your Forever Beaded order has been received\./);
    assert.doesNotMatch(body.message, /Personalization:/);

    const row = await dbGet(app.locals.db, `SELECT orders.customer_name, requested_product_name, personalization_type, personalization
      FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      WHERE orders.order_number = ?`, [body.orderNumber]);
    assert.deepEqual(row, { customer_name: "Becky Customer", requested_product_name: "Butterfly Keepsake", personalization_type: "name", personalization: "BECKY" });
  });
});

test("stores SQL injection strings safely as text", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const injectedName = "Robert'); DROP TABLE orders;--";
    const response = await postOrder(baseUrl, validOrder({ customer: { name: injectedName, email: "safe@example.com" } }));
    const body = await response.json();
    assert.equal(response.status, 200);
    const row = await dbGet(app.locals.db, "SELECT customer_name FROM orders WHERE order_number = ?", [body.orderNumber]);
    assert.equal(row.customer_name, injectedName);
    const table = await dbGet(app.locals.db, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'orders'");
    assert.equal(table.name, "orders");
  });
});

test("rate limits order submissions", async () => {
  await withServer({ orderRateLimit: 2 }, async ({ baseUrl }) => {
    assert.equal((await postOrder(baseUrl, validOrder())).status, 200);
    assert.equal((await postOrder(baseUrl, validOrder({ customer: { name: "Two", email: "two@example.com" } }))).status, 200);
    assert.equal((await postOrder(baseUrl, validOrder({ customer: { name: "Three", email: "three@example.com" } }))).status, 429);
  });
});

test("rejects disallowed CORS origins", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/health`, { headers: { Origin: "https://evil.example" } });
    assert.equal(response.status, 403);
  });
});

test("returns JSON 405 errors for unsupported order methods", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const ordersGet = await fetch(`${baseUrl}/api/orders`, {
      headers: { Origin: "https://foreverbeaded.github.io" }
    });
    const ordersGetBody = await ordersGet.json();
    assert.equal(ordersGet.status, 405);
    assert.equal(ordersGet.headers.get("allow"), "POST, OPTIONS");
    assert.equal(ordersGetBody.error, "Method is not allowed.");

    const itemPut = await fetch(`${baseUrl}/api/orders/FB-20260717-0001/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Origin: "https://foreverbeaded.github.io" },
      body: JSON.stringify({ item: { productId: "gecko", quantity: 1 } })
    });
    const itemPutBody = await itemPut.json();
    assert.equal(itemPut.status, 405);
    assert.equal(itemPut.headers.get("allow"), "POST, OPTIONS");
    assert.equal(itemPutBody.error, "Method is not allowed.");
  });
});

test("rolls back the transaction when item insertion fails", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    await dbRun(app.locals.db, "CREATE TRIGGER fail_items BEFORE INSERT ON order_items BEGIN SELECT RAISE(ABORT, 'forced item failure'); END");
    const response = await postOrder(baseUrl, validOrder());
    assert.equal(response.status, 500);
    const row = await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM orders");
    assert.equal(row.count, 0);
  });
});

test("stores only genuine custom colours for one, two, and three-colour requests", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const cases = [
      ["Pink, No Color, No Color", "Pink"],
      ["Pink, Pearl, No Color", "Pink, Pearl"],
      ["Pink, Pearl, Purple", "Pink, Pearl, Purple"]
    ];
    for (const [submittedColours, expectedColours] of cases) {
      const response = await postOrder(baseUrl, validOrder({ items: [{
        productId: 10, design: "Custom Idea", requestedProductName: "Garden keepsake",
        customDescription: "A detailed custom garden keepsake", colours: submittedColours,
        hardware: "Silver", quantity: 1
      }] }));
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.items[0].colours, expectedColours);
      assert.doesNotMatch(body.items[0].colours, /No Color/i);
      const row = await dbGet(app.locals.db, `SELECT colours FROM order_items
        JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?`, [body.orderNumber]);
      assert.equal(row.colours, expectedColours);
    }
  });
});

test("rejects more than three genuine colours for a custom request", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ items: [{
      productId: 10, design: "Custom Idea", requestedProductName: "Too many colours",
      customDescription: "A custom design with too many requested colours",
      colours: "Pink, Pearl, Purple, Blue", hardware: "Silver", quantity: 1
    }] }));
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.match(body.error, /no more than three/i);
  });
});

test("associates a processed reference image with its server-created order and protects retrieval", async () => {
  const referenceUploadPath = fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-reference-test-"));
  await withServer({ referenceUploadPath, adminSecret: "reference-admin-secret" }, async ({ app, baseUrl }) => {
    const orderResponse = await postOrder(baseUrl, validOrder({ items: [{
      productId: 10, design: "Custom Idea", requestedProductName: "Pearl butterfly keepsake",
      customDescription: "A pearl and pink butterfly with flower details", colours: "Pink, Pearl, No Color",
      hardware: "Silver", quantity: 1, referenceImageRequested: true
    }] }));
    const order = await orderResponse.json();
    assert.equal(orderResponse.status, 200);
    assert.equal(order.referenceUploads.length, 1);
    assert.ok(order.referenceUploads[0].token);

    const image = await sharp({ create: {
      width: 2400, height: 1200, channels: 3, background: { r: 236, g: 180, b: 214 }
    } }).png().toBuffer();
    const uploadResponse = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(order.orderNumber)}/reference-image`, {
      method: "POST",
      headers: {
        Origin: "https://foreverbeaded.github.io", "Content-Type": "image/png",
        "X-Reference-Upload-Token": order.referenceUploads[0].token,
        "X-File-Name": encodeURIComponent("inspiration & pearls.png")
      },
      body: image
    });
    const upload = await uploadResponse.json();
    assert.equal(uploadResponse.status, 200);
    assert.equal(upload.referenceImageStored, true);
    assert.equal(upload.orderNumber, order.orderNumber);

    const row = await dbGet(app.locals.db, `SELECT orders.order_number, order_reference_images.status,
      order_reference_images.storage_key, order_reference_images.mime_type, order_reference_images.width,
      order_reference_images.height FROM order_reference_images
      JOIN orders ON orders.id = order_reference_images.order_id WHERE orders.order_number = ?`, [order.orderNumber]);
    assert.equal(row.order_number, order.orderNumber);
    assert.equal(row.status, "STORED");
    assert.equal(row.mime_type, "image/jpeg");
    assert.ok(row.width <= 1600);
    assert.ok(row.height <= 1600);
    assert.equal(fs.existsSync(path.join(referenceUploadPath, row.storage_key)), true);

    const unauthenticated = await fetch(`${baseUrl}/api/admin/orders/${encodeURIComponent(order.orderNumber)}/reference-image`);
    assert.equal(unauthenticated.status, 401);
    const retrieved = await fetch(`${baseUrl}/api/admin/orders/${encodeURIComponent(order.orderNumber)}/reference-image`, {
      headers: { Authorization: "Bearer reference-admin-secret" }
    });
    assert.equal(retrieved.status, 200);
    assert.equal(retrieved.headers.get("content-type"), "image/jpeg");
    assert.ok((await retrieved.arrayBuffer()).byteLength > 0);
  });
});

test("rejects reference-image requests when durable storage is not configured", async () => {
  await withServer({ referenceUploadPath: null }, async ({ baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ items: [{
      productId: 10, design: "Custom Idea", requestedProductName: "Custom keepsake",
      customDescription: "A custom keepsake with a supplied photo", colours: "Pearl",
      hardware: "Silver", quantity: 1, referenceImageRequested: true
    }] }));
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.match(body.error, /temporarily unavailable/i);
  });
});

test("rejects unsupported and oversized reference image uploads safely", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const orderResponse = await postOrder(baseUrl, validOrder({ items: [{
      productId: 10, design: "Custom Idea", requestedProductName: "Custom keepsake",
      customDescription: "A custom keepsake with image validation", colours: "Pink",
      hardware: "Silver", quantity: 1, referenceImageRequested: true
    }] }));
    const order = await orderResponse.json();
    const url = `${baseUrl}/api/orders/${encodeURIComponent(order.orderNumber)}/reference-image`;
    const headers = { Origin: "https://foreverbeaded.github.io", "X-Reference-Upload-Token": order.referenceUploads[0].token, "X-File-Name": "reference.txt" };
    const unsupported = await fetch(url, { method: "POST", headers: { ...headers, "Content-Type": "text/plain" }, body: "not an image" });
    assert.equal(unsupported.status, 400);
    const oversized = await fetch(url, {
      method: "POST", headers: { ...headers, "Content-Type": "image/jpeg" },
      body: Buffer.alloc(3 * 1024 * 1024 + 1024, 1)
    });
    assert.equal(oversized.status, 413);
    assert.match((await oversized.json()).error, /too large/i);
  });
});

test("ordinary orders remain image-free and do not receive upload credentials", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({
      items: [{ productId: "butterfly", quantity: 1, colours: "Pink, Pearl", hardware: "Silver" }]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body.referenceUploads, []);
    const row = await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM order_reference_images");
    assert.equal(row.count, 0);
  });
});

test("owner adds a proposed design picture and only its customer link can retrieve it", async () => {
  const referenceUploadPath = fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-design-test-"));
  await withServer({ referenceUploadPath, adminSecret: "design-admin-secret" }, async ({ app, baseUrl }) => {
    const orderResponse = await postOrder(baseUrl, validOrder({ items: [{
      productId: 10, design: "Custom Idea", requestedProductName: "Bear keepsake",
      customDescription: "A friendly brown bear holding a small flower", colours: "Brown, Pink",
      hardware: "Silver", quantity: 1
    }] }));
    const order = await orderResponse.json();
    assert.equal(orderResponse.status, 200);
    assert.deepEqual(order.referenceUploads, []);
    const orderItem = await dbGet(app.locals.db, `SELECT order_items.id FROM order_items
      JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?`, [order.orderNumber]);

    const oversized = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs/${orderItem.id}/image`, {
      method: "PUT",
      headers: { Authorization: "Bearer design-admin-secret", "Content-Type": "image/jpeg" },
      body: Buffer.alloc(3 * 1024 * 1024 + 1024, 1)
    });
    assert.equal(oversized.status, 413);
    const oversizedBody = await oversized.json();
    assert.match(oversizedBody.error, /design picture/i);
    assert.doesNotMatch(oversizedBody.error, /reference photo/i);

    const unauthorized = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs`);
    assert.equal(unauthorized.status, 401);
    const listing = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs`, {
      headers: { Authorization: "Bearer design-admin-secret" }
    });
    const listingBody = await listing.json();
    assert.equal(listing.status, 200);
    assert.equal(listingBody.items.length, 1);
    assert.equal(listingBody.items[0].requestedProductName, "Bear keepsake");
    assert.equal(listingBody.items[0].hasCustomerReference, false);

    const image = await sharp({ create: {
      width: 900, height: 1200, channels: 3, background: { r: 151, g: 99, b: 66 }
    } }).png().toBuffer();
    const upload = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs/${orderItem.id}/image`, {
      method: "PUT",
      headers: {
        Authorization: "Bearer design-admin-secret", "Content-Type": "image/png",
        "X-File-Name": encodeURIComponent("bear proposal.png")
      },
      body: image
    });
    const uploadBody = await upload.json();
    assert.equal(upload.status, 200);
    assert.equal(uploadBody.designPictureStored, true);
    assert.match(uploadBody.customerPreviewPath, /token=/);

    const noToken = await fetch(`${baseUrl}/api/orders/${order.orderNumber}/custom-designs/${orderItem.id}/image`);
    assert.equal(noToken.status, 401);
    const customerView = await fetch(new URL(uploadBody.customerPreviewPath, baseUrl));
    assert.equal(customerView.status, 200);
    assert.equal(customerView.headers.get("content-type"), "image/jpeg");
    assert.ok((await customerView.arrayBuffer()).byteLength > 0);

    const refreshedLinkResponse = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs/${orderItem.id}/customer-link`, {
      method: "POST",
      headers: { Authorization: "Bearer design-admin-secret" }
    });
    const refreshedLink = await refreshedLinkResponse.json();
    assert.equal(refreshedLinkResponse.status, 200);
    assert.equal((await fetch(new URL(uploadBody.customerPreviewPath, baseUrl))).status, 404);
    assert.equal((await fetch(new URL(refreshedLink.customerPreviewPath, baseUrl))).status, 200);
  });
});

test("customer reference and owner design pictures stay separate and replacement revokes the old link", async () => {
  const referenceUploadPath = fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-design-separation-test-"));
  await withServer({ referenceUploadPath, adminSecret: "design-admin-secret" }, async ({ app, baseUrl }) => {
    const orderResponse = await postOrder(baseUrl, validOrder({ items: [{
      productId: 10, design: "Custom Idea", requestedProductName: "Horse keepsake",
      customDescription: "A pearl horse with lavender mane details", colours: "Pearl, Lavender, No Color",
      hardware: "Silver", quantity: 1, referenceImageRequested: true
    }] }));
    const order = await orderResponse.json();
    const orderItem = await dbGet(app.locals.db, `SELECT order_items.id FROM order_items
      JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?`, [order.orderNumber]);
    const reference = await sharp({ create: {
      width: 640, height: 480, channels: 3, background: { r: 220, g: 200, b: 230 }
    } }).png().toBuffer();
    const referenceUpload = await fetch(`${baseUrl}/api/orders/${order.orderNumber}/reference-image`, {
      method: "POST",
      headers: {
        "Content-Type": "image/png", "X-Reference-Upload-Token": order.referenceUploads[0].token,
        "X-File-Name": encodeURIComponent("customer horse inspiration.png")
      },
      body: reference
    });
    assert.equal(referenceUpload.status, 200);

    const uploadOwnerImage = async (colour, name) => {
      const image = await sharp({ create: { width: 720, height: 960, channels: 3, background: colour } }).png().toBuffer();
      const response = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs/${orderItem.id}/image`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer design-admin-secret", "Content-Type": "image/png",
          "X-File-Name": encodeURIComponent(name)
        },
        body: image
      });
      return { response, body: await response.json() };
    };

    const first = await uploadOwnerImage({ r: 90, g: 60, b: 120 }, "first horse design.png");
    assert.equal(first.response.status, 200);
    const firstRow = await dbGet(app.locals.db, `SELECT storage_key FROM order_design_images WHERE order_item_id = ?`, [orderItem.id]);
    const referenceRow = await dbGet(app.locals.db, `SELECT storage_key FROM order_reference_images WHERE order_item_id = ?`, [orderItem.id]);
    assert.notEqual(firstRow.storage_key, referenceRow.storage_key);
    assert.equal(fs.existsSync(path.join(referenceUploadPath, referenceRow.storage_key)), true);
    const ownerReferenceView = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs/${orderItem.id}/reference-image`, {
      headers: { Authorization: "Bearer design-admin-secret" }
    });
    assert.equal(ownerReferenceView.status, 200);
    assert.equal(ownerReferenceView.headers.get("content-type"), "image/jpeg");

    const second = await uploadOwnerImage({ r: 245, g: 235, b: 220 }, "revised horse design.png");
    assert.equal(second.response.status, 200);
    assert.equal((await fetch(new URL(first.body.customerPreviewPath, baseUrl))).status, 404);
    assert.equal((await fetch(new URL(second.body.customerPreviewPath, baseUrl))).status, 200);
    assert.equal(fs.existsSync(path.join(referenceUploadPath, firstRow.storage_key)), false);
    assert.equal(fs.existsSync(path.join(referenceUploadPath, referenceRow.storage_key)), true);
    const count = await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM order_design_images WHERE order_item_id = ?", [orderItem.id]);
    assert.equal(count.count, 1);
  });
});

test("a customer design link cannot retrieve another order's picture", async () => {
  await withServer({ adminSecret: "design-admin-secret" }, async ({ app, baseUrl }) => {
    const createCustomOrder = async (name) => {
      const response = await postOrder(baseUrl, validOrder({ items: [{
        productId: 10, design: "Custom Idea", requestedProductName: name,
        customDescription: `A detailed proposed ${name.toLowerCase()} design`, colours: "Pink",
        hardware: "Silver", quantity: 1
      }] }));
      const order = await response.json();
      const item = await dbGet(app.locals.db, `SELECT order_items.id FROM order_items
        JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?`, [order.orderNumber]);
      return { order, item };
    };
    const first = await createCustomOrder("Tiger keepsake");
    const second = await createCustomOrder("Car keepsake");
    const image = await sharp({ create: {
      width: 500, height: 500, channels: 3, background: { r: 240, g: 130, b: 30 }
    } }).png().toBuffer();
    const upload = await fetch(`${baseUrl}/api/admin/orders/${first.order.orderNumber}/custom-designs/${first.item.id}/image`, {
      method: "PUT",
      headers: { Authorization: "Bearer design-admin-secret", "Content-Type": "image/png" },
      body: image
    });
    const saved = await upload.json();
    const token = new URL(saved.customerPreviewPath, baseUrl).searchParams.get("token");
    const crossOrder = await fetch(`${baseUrl}/api/orders/${second.order.orderNumber}/custom-designs/${second.item.id}/image?token=${encodeURIComponent(token)}`);
    assert.equal(crossOrder.status, 404);
  });
});

test("ordinary catalogue orders cannot receive an owner custom design picture", async () => {
  await withServer({ adminSecret: "design-admin-secret" }, async ({ app, baseUrl }) => {
    const orderResponse = await postOrder(baseUrl, validOrder({ items: [{
      productId: "butterfly", quantity: 1, colours: "Pink, Pearl", hardware: "Silver"
    }] }));
    const order = await orderResponse.json();
    const item = await dbGet(app.locals.db, `SELECT order_items.id FROM order_items
      JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?`, [order.orderNumber]);
    const listing = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs`, {
      headers: { Authorization: "Bearer design-admin-secret" }
    });
    assert.deepEqual((await listing.json()).items, []);
    const image = await sharp({ create: {
      width: 100, height: 100, channels: 3, background: { r: 255, g: 180, b: 210 }
    } }).png().toBuffer();
    const upload = await fetch(`${baseUrl}/api/admin/orders/${order.orderNumber}/custom-designs/${item.id}/image`, {
      method: "PUT",
      headers: { Authorization: "Bearer design-admin-secret", "Content-Type": "image/png" },
      body: image
    });
    assert.equal(upload.status, 404);
  });
});
