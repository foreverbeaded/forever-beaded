const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createApp, dbGet, dbRun } = require("../server");

function tempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-test-"));
  return path.join(dir, "orders.db");
}

async function withServer(options = {}, callback) {
  const app = await createApp({
    databasePath: tempDbPath(),
    allowedOrigins: "https://foreverbeaded.github.io,http://localhost,http://127.0.0.1",
    apiRateLimit: options.apiRateLimit || 200,
    orderRateLimit: options.orderRateLimit || 20
  });
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await callback({ app, baseUrl });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => app.locals.db.close(resolve));
  }
}

function validOrder(overrides = {}) {
  return {
    customer: {
      name: "Website Customer",
      email: "customer@example.com",
      phone: "604-555-1212"
    },
    shipping: {
      address: "123 Bead Lane",
      province: "BC",
      postalCode: "V6B 1A1"
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

    const row = await dbGet(app.locals.db, "SELECT total_cents, payment_status, order_status FROM orders WHERE order_number = ?", [body.orderNumber]);
    assert.deepEqual(row, { total_cents: 4500, payment_status: "AWAITING_PAYMENT", order_status: "NEW" });
    assert.ok(fs.existsSync(path.join(__dirname, "..", "data", "orders.xls")));
    const emailFiles = fs.readdirSync(path.join(__dirname, "..", "data", "email-outbox"));
    assert.ok(emailFiles.some((file) => file.startsWith(`${body.orderNumber}-`) && file.endsWith(".eml")));
  });
});

test("seeds active products and exposes safe catalogue metadata", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const seeded = await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM products WHERE active = 1");
    assert.equal(seeded.count, 11);

    const response = await fetch(`${baseUrl}/api/products`, {
      headers: { Origin: "https://foreverbeaded.github.io" }
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.products.length, 11);
    assert.deepEqual(body.products.map((product) => product.slug), [
      "butterfly",
      "gecko",
      "flower",
      "big-flower",
      "butterfly-with-flowers",
      "macaw",
      "cross",
      "pencil",
      "octopus",
      "soccer-ball",
      "custom-idea"
    ]);
    assert.ok(body.products.some((product) => product.id === 10 && product.slug === "custom-idea" && product.referenceImageUrl === "images/both-flowers-side-by-side.jpeg" && product.previewImageUrl === "images/both-flowers-side-by-side.jpeg"));
    assert.ok(body.products.some((product) => product.slug === "gecko" && product.referenceImageUrl === "images/gecko.jpeg" && product.previewImageUrl === "images/gecko.jpeg"));
    assert.ok(body.products.some((product) => product.slug === "big-flower" && product.name === "Big Flower" && product.category === "Flower" && product.basePriceCents === 2000 && product.imageUrl === "images/big-flower.jpeg" && product.referenceImageUrl === "images/big-flower.jpeg" && product.previewImageUrl === "images/big-flower.jpeg"));
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

test("seeded product image paths point to existing jpeg assets", () => {
  const products = require("../../js/product-catalogue");
  const expectedMappings = {
    gecko: "images/gecko.jpeg",
    macaw: "images/macaw.jpeg",
    pencil: "images/pencil.jpeg",
    octopus: "images/octopus.jpeg",
    "soccer-ball": "images/soccer-ball.jpeg",
    flower: "images/flower-braided.jpeg",
    "big-flower": "images/big-flower.jpeg"
  };

  for (const product of products) {
    assert.match(product.imageUrl, /^images\/.+\.jpeg$/);
    assert.ok(fs.existsSync(path.join(__dirname, "..", "..", product.imageUrl)), `${product.name} image is missing at ${product.imageUrl}`);
    assert.ok(fs.existsSync(path.join(__dirname, "..", "..", product.referenceImageUrl)), `${product.name} reference image is missing at ${product.referenceImageUrl}`);
    assert.ok(fs.existsSync(path.join(__dirname, "..", "..", product.previewImageUrl)), `${product.name} preview image is missing at ${product.previewImageUrl}`);
    assert.ok(Array.isArray(product.defaultColours), `${product.name} is missing default colours`);
    if (product.slug === "custom-idea") {
      assert.equal(product.previewPattern, null);
    } else {
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
    assert.deepEqual(item, { product_id: "2", product_name: "Gecko", unit_price_cents: 2000 });
  });
});

test("creates Big Flower orders from the product slug", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    const response = await postOrder(baseUrl, validOrder({ items: [{ productId: "big-flower", quantity: 1, colours: "Purple, Cream, Gold" }] }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.total, 2500);
    const item = await dbGet(app.locals.db, "SELECT product_id, product_name, unit_price_cents, line_total_cents FROM order_items JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?", [body.orderNumber]);
    assert.deepEqual(item, { product_id: "11", product_name: "Big Flower", unit_price_cents: 2000, line_total_cents: 2000 });
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
      items: [{ productId: 10, design: "Custom Idea", quantity: 1, customDescription: `  ${description}  ` }]
    }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.items[0].customDescription, description);
    assert.match(body.message, /Custom idea:\nA tiny garden charm\n  with purple flowers and initials AG\./);
    const row = await dbGet(app.locals.db, "SELECT custom_description FROM order_items JOIN orders ON orders.id = order_items.order_id WHERE orders.order_number = ?", [body.orderNumber]);
    assert.equal(row.custom_description, description);
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

test("rolls back the transaction when item insertion fails", async () => {
  await withServer({}, async ({ app, baseUrl }) => {
    await dbRun(app.locals.db, "CREATE TRIGGER fail_items BEFORE INSERT ON order_items BEGIN SELECT RAISE(ABORT, 'forced item failure'); END");
    const response = await postOrder(baseUrl, validOrder());
    assert.equal(response.status, 500);
    const row = await dbGet(app.locals.db, "SELECT COUNT(*) AS count FROM orders");
    assert.equal(row.count, 0);
  });
});
