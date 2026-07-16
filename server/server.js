const fs = require("fs");
const path = require("path");
const net = require("net");
const tls = require("tls");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const sqlite3 = require("sqlite3").verbose();
const { SEED_PRODUCTS, getSeedProduct } = require("./catalogue");

const PAYMENT_STATUSES = new Set(["AWAITING_PAYMENT", "RECEIVED", "VERIFIED", "REFUNDED", "CANCELLED"]);
const ORDER_STATUSES = new Set(["NEW", "IN_PROGRESS", "READY", "SHIPPED", "COMPLETED", "CANCELLED"]);
const DEFAULT_ALLOWED_ORIGINS = [
  "https://foreverbeaded.github.io",
  "https://foreverbeaded.github.io/forever-beaded",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "http://localhost",
  "http://127.0.0.1"
];
function getEtransferEmail() {
  return process.env.ETRANSFER_EMAIL || "foreverbeaded1@gmail.com";
}

function getDataPath(fileName) {
  return path.join(__dirname, "data", fileName);
}

class PublicError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.publicMessage = message;
  }
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) return;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  });
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve(this);
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });
}

function normalizeText(value, maxLength, field, { required = false } = {}) {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (required && !text) throw new PublicError(400, `${field} is required.`);
  if (text.length > maxLength) throw new PublicError(400, `${field} is too long.`);
  return text;
}

function normalizeMultilineText(value, maxLength, field, { required = false, minLength = 0 } = {}) {
  const text = typeof value === "string"
    ? value.replace(/\r\n?/g, "\n").trim()
    : "";
  if (required && !text) throw new PublicError(400, `${field} is required.`);
  if (text && text.length < minLength) throw new PublicError(400, `${field} is too short.`);
  if (text.length > maxLength) throw new PublicError(400, `${field} is too long.`);
  return text;
}

function normalizeEmail(value) {
  const email = normalizeText(value, 254, "Email", { required: true }).toLowerCase();
  if (!validator.isEmail(email)) throw new PublicError(400, "Please enter a valid email address.");
  return email;
}

function normalizePostalCode(value) {
  return normalizeText(value, 20, "Postal code").toUpperCase();
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeEmailText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n");
}

function getOrderNotificationEmail() {
  return process.env.ORDER_NOTIFICATION_EMAIL || process.env.ETRANSFER_EMAIL || "foreverbeaded1@gmail.com";
}

function getEmailConfig() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "ORDER_NOTIFICATION_EMAIL"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) return { configured: false, missing };
  return {
    configured: true,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM,
    to: process.env.ORDER_NOTIFICATION_EMAIL,
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || Number(process.env.SMTP_PORT) === 465
  };
}

function smtpRead(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onError = (error) => {
      socket.off("data", onData);
      reject(error);
    };
    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || "";
      if (/^\d{3} /.test(last)) {
        socket.off("data", onData);
        socket.off("error", onError);
        resolve(buffer);
      }
    };
    socket.on("data", onData);
    socket.once("error", onError);
  });
}

async function smtpCommand(socket, command, expectedCodes) {
  if (command) socket.write(`${command}\r\n`);
  const response = await smtpRead(socket);
  const code = Number(response.slice(0, 3));
  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed (${command || "connect"}): ${response.trim()}`);
  }
  return response;
}

function smtpConnect(config) {
  return new Promise((resolve, reject) => {
    const socket = config.secure
      ? tls.connect(config.port, config.host, { servername: config.host }, () => resolve(socket))
      : net.connect(config.port, config.host, () => resolve(socket));
    socket.setTimeout(20000, () => {
      socket.destroy(new Error("SMTP connection timed out."));
    });
    socket.once("error", reject);
  });
}

async function sendSmtpMail(config, { from, to, subject, text }) {
  let socket = await smtpConnect(config);
  try {
    await smtpCommand(socket, null, [220]);
    let response = await smtpCommand(socket, `EHLO ${process.env.SMTP_HELO_NAME || "forever-beaded.local"}`, [250]);
    if (!config.secure && /STARTTLS/i.test(response)) {
      await smtpCommand(socket, "STARTTLS", [220]);
      socket = tls.connect({ socket, servername: config.host });
      response = await smtpCommand(socket, `EHLO ${process.env.SMTP_HELO_NAME || "forever-beaded.local"}`, [250]);
    }
    await smtpCommand(socket, "AUTH LOGIN", [334]);
    await smtpCommand(socket, Buffer.from(config.user).toString("base64"), [334]);
    await smtpCommand(socket, Buffer.from(config.pass).toString("base64"), [235]);
    await smtpCommand(socket, `MAIL FROM:<${from}>`, [250]);
    await smtpCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
    await smtpCommand(socket, "DATA", [354]);
    const messageId = `<${Date.now()}.${Math.random().toString(16).slice(2)}@forever-beaded.local>`;
    const headers = [
      `From: Forever Beaded <${from}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Message-ID: ${messageId}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      ""
    ].join("\r\n");
    socket.write(`${headers}\r\n${text.replace(/^\./gm, "..")}\r\n.\r\n`);
    const providerResponse = await smtpRead(socket);
    const code = Number(providerResponse.slice(0, 3));
    if (code !== 250) throw new Error(`SMTP DATA failed: ${providerResponse.trim()}`);
    await smtpCommand(socket, "QUIT", [221]);
    return { messageId, providerResponse: providerResponse.trim() };
  } finally {
    socket.end();
  }
}

function spreadsheetCell(value, type = "String") {
  const data = type === "Number" ? Number(value || 0) : escapeXml(value);
  return `<Cell><Data ss:Type="${type}">${data}</Data></Cell>`;
}

function spreadsheetRow(values) {
  return `<Row>${values.map((value) => spreadsheetCell(value.value, value.type)).join("")}</Row>`;
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new PublicError(400, "Quantity must be between 1 and 20.");
  }
  return quantity;
}

async function getTrustedProduct(db, productId) {
  const id = String(productId || "").trim();
  const row = await dbGet(db, `SELECT id, slug, name, base_price_cents, image_url
    FROM products
    WHERE (CAST(id AS TEXT) = ? OR slug = ?) AND active = 1`, [id, id]);
  if (row) {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      priceCents: row.base_price_cents,
      imageUrl: row.image_url
    };
  }

  const seed = getSeedProduct(id);
  return seed && seed.active ? {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    priceCents: seed.basePriceCents,
    imageUrl: seed.imageUrl
  } : null;
}

async function normalizeItem(db, rawItem) {
  if (!rawItem || typeof rawItem !== "object") throw new PublicError(400, "Order item is invalid.");
  const submittedProductId = rawItem.productId ?? rawItem.id;
  const productId = normalizeText(submittedProductId == null ? "" : String(submittedProductId), 80, "Product ID", { required: true });
  const product = await getTrustedProduct(db, productId);
  if (!product) throw new PublicError(400, "One of the selected products is not available.");
  const quantity = normalizeQuantity(rawItem.quantity || 1);
  const unitPriceCents = product.priceCents;
  const design = normalizeText(rawItem.design, 80, "Design");
  const isCustomIdea = product.slug === "custom-idea" || design === "Custom Idea";
  const customDescription = normalizeMultilineText(rawItem.customDescription, 500, "Custom description", {
    required: isCustomIdea,
    minLength: isCustomIdea ? 10 : 0
  });
  return {
    productId: String(product.id),
    productName: product.name,
    design,
    colours: normalizeText(rawItem.colours || rawItem.colors, 180, "Colours"),
    personalization: normalizeText(rawItem.personalization || rawItem.name, 120, "Personalization"),
    customDescription,
    hardware: normalizeText(rawItem.hardware || rawItem.keychainType, 80, "Hardware"),
    quantity,
    unitPriceCents,
    lineTotalCents: unitPriceCents * quantity
  };
}

async function normalizeOrderPayload(db, body) {
  if (normalizeText(body.website || body.company || body.honeypot, 200, "Honeypot")) {
    throw new PublicError(400, "Order could not be submitted.");
  }

  const items = Array.isArray(body.items) ? await Promise.all(body.items.map((item) => normalizeItem(db, item))) : [];
  if (!items.length) throw new PublicError(400, "Please add at least one item.");
  if (items.length > 25) throw new PublicError(400, "Too many items in one order.");

  const customer = body.customer || {};
  const shipping = body.shipping || {};
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const shippingCents = subtotalCents >= 7500 ? 0 : 500;

  return {
    customerName: normalizeText(customer.name || body.customerName || body.name, 120, "Customer name", { required: true }),
    customerEmail: normalizeEmail(customer.email || body.email),
    customerPhone: normalizeText(customer.phone || body.phone, 40, "Phone"),
    shippingAddress: normalizeText(shipping.address || body.shippingAddress, 500, "Shipping address"),
    province: normalizeText(shipping.province || body.province, 60, "Province"),
    postalCode: normalizePostalCode(shipping.postalCode || body.postalCode),
    notes: normalizeText(body.notes, 1000, "Notes"),
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    currency: "CAD",
    paymentMethod: "INTERAC_ETRANSFER",
    paymentStatus: "AWAITING_PAYMENT",
    orderStatus: "NEW",
    items
  };
}

function getAllowedOrigins(value) {
  const configured = String(value || "").split(",").map((origin) => origin.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  return allowedOrigins.some((allowed) => {
    if (origin === allowed) return true;
    return (allowed === "http://localhost" && origin.startsWith("http://localhost:")) ||
      (allowed === "http://127.0.0.1" && origin.startsWith("http://127.0.0.1:"));
  });
}

async function migrateSchema(db) {
  await dbRun(db, "PRAGMA foreign_keys = ON");
  await dbRun(db, "PRAGMA journal_mode = WAL");
  await dbRun(db, "PRAGMA busy_timeout = 5000");

  const currentOrders = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(orders)", [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  const requiredOrderColumns = new Set([
    "id", "order_number", "created_at", "updated_at", "customer_name", "customer_email",
    "customer_phone", "shipping_address", "province", "postal_code", "notes",
    "subtotal_cents", "shipping_cents", "total_cents", "currency", "payment_method",
    "payment_status", "order_status", "etransfer_reference", "tracking_number"
  ]);

  if (currentOrders.length && currentOrders.some((column) => !requiredOrderColumns.has(column.name))) {
    await dbRun(db, `ALTER TABLE orders RENAME TO legacy_orders_${Date.now()}`);
  }

  const currentProducts = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(products)", [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  const productIdColumn = currentProducts.find((column) => column.name === "id");
  if (productIdColumn && !String(productIdColumn.type || "").toUpperCase().includes("INTEGER")) {
    await dbRun(db, `ALTER TABLE products RENAME TO legacy_products_${Date.now()}`);
  }

  await dbRun(db, `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    base_price_cents INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    reference_image_url TEXT,
    preview_image_url TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  const productColumnsAfterCreate = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(products)", [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  const existingProductColumns = new Set(productColumnsAfterCreate.map((column) => column.name));
  if (!existingProductColumns.has("reference_image_url")) {
    await dbRun(db, "ALTER TABLE products ADD COLUMN reference_image_url TEXT");
  }
  if (!existingProductColumns.has("preview_image_url")) {
    await dbRun(db, "ALTER TABLE products ADD COLUMN preview_image_url TEXT");
  }

  const now = new Date().toISOString();
  for (const product of SEED_PRODUCTS) {
    await dbRun(db, `INSERT INTO products (
      id, slug, name, category, description, base_price_cents, image_url, reference_image_url, preview_image_url,
      active, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name = excluded.name,
      category = excluded.category,
      description = excluded.description,
      base_price_cents = excluded.base_price_cents,
      image_url = excluded.image_url,
      reference_image_url = excluded.reference_image_url,
      preview_image_url = excluded.preview_image_url,
      active = excluded.active,
      sort_order = excluded.sort_order,
      updated_at = excluded.updated_at`, [
      product.id,
      product.slug,
      product.name,
      product.category,
      product.description,
      product.basePriceCents,
      product.imageUrl,
      product.referenceImageUrl,
      product.previewImageUrl,
      product.active,
      product.sortOrder,
      now,
      now
    ]);
  }

  await dbRun(db, `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT,
    province TEXT,
    postal_code TEXT,
    notes TEXT,
    subtotal_cents INTEGER NOT NULL,
    shipping_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CAD',
    payment_method TEXT NOT NULL DEFAULT 'INTERAC_ETRANSFER',
    payment_status TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT' CHECK(payment_status IN ('AWAITING_PAYMENT','RECEIVED','VERIFIED','REFUNDED','CANCELLED')),
    order_status TEXT NOT NULL DEFAULT 'NEW' CHECK(order_status IN ('NEW','IN_PROGRESS','READY','SHIPPED','COMPLETED','CANCELLED')),
    etransfer_reference TEXT,
    tracking_number TEXT
  )`);

  await dbRun(db, `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    design TEXT,
    colours TEXT,
    personalization TEXT,
    custom_description TEXT,
    hardware TEXT,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    line_total_cents INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);

  const itemColumns = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(order_items)", [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  if (itemColumns.length && !itemColumns.some((column) => column.name === "custom_description")) {
    await dbRun(db, "ALTER TABLE order_items ADD COLUMN custom_description TEXT");
  }

  await dbRun(db, `CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
}

async function generateOrderNumber(db, createdAt) {
  const day = createdAt.slice(0, 10).replace(/-/g, "");
  const row = await dbGet(db, "SELECT COUNT(*) AS count FROM orders WHERE order_number LIKE ?", [`FB-${day}-%`]);
  return `FB-${day}-${String((row?.count || 0) + 1).padStart(4, "0")}`;
}

async function createOrder(db, order) {
  await dbRun(db, "BEGIN IMMEDIATE TRANSACTION");
  try {
    const now = new Date().toISOString();
    const orderNumber = await generateOrderNumber(db, now);
    const result = await dbRun(db, `INSERT INTO orders (
      order_number, created_at, updated_at, customer_name, customer_email, customer_phone,
      shipping_address, province, postal_code, notes, subtotal_cents, shipping_cents,
      total_cents, currency, payment_method, payment_status, order_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      orderNumber, now, now, order.customerName, order.customerEmail, order.customerPhone,
      order.shippingAddress, order.province, order.postalCode, order.notes,
      order.subtotalCents, order.shippingCents, order.totalCents, order.currency,
      order.paymentMethod, order.paymentStatus, order.orderStatus
    ]);

    for (const item of order.items) {
      await dbRun(db, `INSERT INTO order_items (
        order_id, product_id, product_name, design, colours, personalization, custom_description, hardware,
        quantity, unit_price_cents, line_total_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        result.lastID, item.productId, item.productName, item.design, item.colours,
        item.personalization, item.customDescription, item.hardware, item.quantity, item.unitPriceCents, item.lineTotalCents
      ]);
    }

    await dbRun(db, "INSERT INTO order_events(order_id, created_at, event_type, details) VALUES (?, ?, ?, ?)", [
      result.lastID,
      now,
      "ORDER_CREATED",
      JSON.stringify({ paymentStatus: order.paymentStatus, orderStatus: order.orderStatus })
    ]);
    await dbRun(db, "COMMIT");
    return { orderId: result.lastID, orderNumber };
  } catch (error) {
    await dbRun(db, "ROLLBACK").catch(() => {});
    throw error;
  }
}

async function writeOrdersWorkbook(db, workbookPath = process.env.EXCEL_WORKBOOK_PATH || getDataPath("orders.xls")) {
  const resolvedPath = path.resolve(workbookPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  const orders = await new Promise((resolve, reject) => {
    db.all(`SELECT order_number, created_at, customer_name, customer_email, customer_phone,
      province, postal_code, subtotal_cents, shipping_cents, total_cents, currency,
      payment_status, order_status
      FROM orders
      ORDER BY created_at DESC`, [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  const items = await new Promise((resolve, reject) => {
    db.all(`SELECT orders.order_number, order_items.product_name, order_items.design,
      order_items.colours, order_items.personalization, order_items.custom_description,
      order_items.hardware, order_items.quantity, order_items.unit_price_cents,
      order_items.line_total_cents
      FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      ORDER BY orders.created_at DESC, order_items.id ASC`, [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });

  const orderRows = [
    ["Order Number", "Created", "Customer", "Email", "Phone", "Province", "Postal Code", "Subtotal", "Shipping", "Total", "Currency", "Payment Status", "Order Status"],
    ...orders.map((order) => [
      order.order_number, order.created_at, order.customer_name, order.customer_email, order.customer_phone,
      order.province, order.postal_code, order.subtotal_cents, order.shipping_cents, order.total_cents,
      order.currency, order.payment_status, order.order_status
    ])
  ];
  const itemRows = [
    ["Order Number", "Product", "Design", "Colours", "Personalization", "Custom Description", "Hardware", "Quantity", "Unit Price", "Line Total"],
    ...items.map((item) => [
      item.order_number, item.product_name, item.design, item.colours, item.personalization,
      item.custom_description, item.hardware, item.quantity, item.unit_price_cents, item.line_total_cents
    ])
  ];

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Orders">
    <Table>
      ${orderRows.map((row) => spreadsheetRow(row.map((value, index) => ({
        value,
        type: index >= 7 && index <= 9 && row !== orderRows[0] ? "Number" : "String"
      })))).join("\n      ")}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Items">
    <Table>
      ${itemRows.map((row) => spreadsheetRow(row.map((value, index) => ({
        value,
        type: index >= 7 && row !== itemRows[0] ? "Number" : "String"
      })))).join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>
`;
  fs.writeFileSync(resolvedPath, workbook, "utf8");
  return resolvedPath;
}

function buildOrderNotification(order, saved, etransferEmail) {
  const itemLines = order.items.map((item) => [
    `Product/design: ${item.productName}`,
    `Design: ${item.design || ""}`,
    `Colours: ${item.colours || ""}`,
    `Hardware: ${item.hardware || ""}`,
    `Quantity: ${item.quantity}`,
    `Personalization: ${item.personalization || ""}`,
    item.customDescription ? `Custom-design description: ${item.customDescription}` : ""
  ].filter(Boolean).join("\n")).join("\n\n");

  return `New Forever Beaded order received.

Order number: ${saved.orderNumber}
Customer name: ${order.customerName}
Customer email: ${order.customerEmail}
Phone: ${order.customerPhone || ""}
Shipping address: ${order.shippingAddress || ""}
Province: ${order.province || ""}
Postal code: ${order.postalCode || ""}

Items:
${itemLines}

Subtotal: ${(order.subtotalCents / 100).toFixed(2)} ${order.currency}
Shipping: ${(order.shippingCents / 100).toFixed(2)} ${order.currency}
Total: ${(order.totalCents / 100).toFixed(2)} ${order.currency}
Payment status: Awaiting e-Transfer
E-transfer email: ${etransferEmail}

Notes:
${order.notes || ""}
`;
}

function writeConfirmationEmail(order, saved, etransferEmail, outboxDir = process.env.EMAIL_OUTBOX_PATH || getDataPath("email-outbox")) {
  const resolvedDir = path.resolve(outboxDir);
  fs.mkdirSync(resolvedDir, { recursive: true });
  const safeOrderNumber = saved.orderNumber.replace(/[^A-Z0-9-]/gi, "_");
  const filePath = path.join(resolvedDir, `${safeOrderNumber}-${Date.now()}.eml`);
  const subject = `Forever Beaded order ${saved.orderNumber}`;
  const body = buildOrderNotification(order, saved, etransferEmail);
  const to = getOrderNotificationEmail();
  const email = [
    `From: Forever Beaded <${etransferEmail}>`,
    `To: ${to}`,
    `Reply-To: ${order.customerEmail}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    escapeEmailText(body)
  ].join("\r\n");
  fs.writeFileSync(filePath, email, "utf8");
  return filePath;
}

async function sendOrderNotificationEmail(order, saved, etransferEmail) {
  const config = getEmailConfig();
  const to = config.configured ? config.to : getOrderNotificationEmail();
  const subject = `Forever Beaded order ${saved.orderNumber}`;
  const text = buildOrderNotification(order, saved, etransferEmail);

  console.info("[email] email function started");
  console.info(`[email] recipient address: ${to}`);

  if (!config.configured) {
    const outboxPath = writeConfirmationEmail(order, saved, etransferEmail);
    const reason = `Missing email environment variables: ${config.missing.join(", ")}`;
    console.warn(`[email] provider response: not sent; ${reason}`);
    console.warn("[email] message ID: none");
    return {
      emailSent: false,
      to,
      provider: "smtp",
      providerResponse: reason,
      messageId: null,
      outboxPath
    };
  }

  try {
    const result = await sendSmtpMail(config, {
      from: config.from,
      to,
      subject,
      text
    });
    console.info(`[email] provider response: ${result.providerResponse}`);
    console.info(`[email] message ID: ${result.messageId}`);
    return {
      emailSent: true,
      to,
      provider: "smtp",
      providerResponse: result.providerResponse,
      messageId: result.messageId
    };
  } catch (error) {
    const outboxPath = writeConfirmationEmail(order, saved, etransferEmail);
    console.error("[email] full error:", error);
    return {
      emailSent: false,
      to,
      provider: "smtp",
      providerResponse: error.message,
      messageId: null,
      outboxPath
    };
  }
}

function createDatabase(databasePath) {
  const resolvedPath = path.resolve(databasePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const db = new sqlite3.Database(resolvedPath);
  return db;
}

function requireAdminAuth(req, res, next) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || adminSecret === "replace-with-a-long-random-secret") {
    return res.status(503).json({ error: "Admin API is not configured." });
  }
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== adminSecret) return res.status(401).json({ error: "Authentication required." });
  return next();
}

async function createApp(options = {}) {
  readEnvFile(path.join(__dirname, ".env"));
  const app = express();
  const db = options.db || createDatabase(options.databasePath || process.env.DATABASE_PATH || path.join(__dirname, "data", "orders.db"));
  await migrateSchema(db);

  const allowedOrigins = getAllowedOrigins(options.allowedOrigins || process.env.ALLOWED_ORIGINS);
  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: options.apiRateLimit || 100, standardHeaders: true, legacyHeaders: false });
  const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: options.orderRateLimit || 5, standardHeaders: true, legacyHeaders: false });

  app.disable("x-powered-by");
  app.locals.db = db;
  app.use(helmet());
  app.use(cors({
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    optionsSuccessStatus: 204,
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);
      return callback(new PublicError(403, "Origin is not allowed."));
    }
  }));
  app.use(express.json({ limit: "18kb" }));
  app.use((req, res, next) => {
    const started = Date.now();
    res.on("finish", () => {
      console.info(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - started}ms`);
    });
    next();
  });

  app.get("/health", (req, res) => res.json({ ok: true }));
  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api", apiLimiter);

  app.get("/api/products", async (req, res, next) => {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all(`SELECT id, slug, name, category, description, base_price_cents, image_url, reference_image_url, preview_image_url, active, sort_order
          FROM products
          WHERE active = 1
          ORDER BY sort_order ASC, name ASC`, [], (error, result) => {
          if (error) reject(error);
          else resolve(result || []);
        });
      });
      res.json({
        success: true,
        products: rows.map((row) => {
          const seed = getSeedProduct(row.slug);
          return {
            id: row.id,
            slug: row.slug,
            name: row.name,
            category: row.category,
            description: row.description,
            basePriceCents: row.base_price_cents,
            basePrice: row.base_price_cents,
            imageUrl: row.image_url,
            referenceImageUrl: row.reference_image_url || row.image_url,
            previewImageUrl: row.preview_image_url || row.reference_image_url || row.image_url,
            previewPattern: seed?.previewPattern || null,
            defaultColours: seed?.defaultColours || [],
            active: Boolean(row.active),
            sortOrder: row.sort_order
          };
        })
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/orders", orderLimiter, async (req, res, next) => {
    try {
      const order = await normalizeOrderPayload(db, req.body || {});
      const saved = await createOrder(db, order);
      const etransferEmail = getEtransferEmail();
      await writeOrdersWorkbook(db);
      const emailResult = await sendOrderNotificationEmail(order, saved, etransferEmail);
      res.status(200).json({
        success: true,
        orderSaved: true,
        emailSent: emailResult.emailSent,
        orderId: saved.orderNumber,
        orderNumber: saved.orderNumber,
        total: order.totalCents,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        etransferEmail,
        items: order.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          design: item.design,
          colours: item.colours,
          hardware: item.hardware,
          quantity: item.quantity,
          customDescription: item.customDescription
        })),
        workbookUpdated: true,
        email: emailResult,
        confirmationEmail: emailResult,
        message: `Thank you! Your Forever Beaded order has been received.\n\n${order.items.map((item) => item.customDescription ? `Custom idea:\n${item.customDescription}\n\n` : "").join("")}Please send your Interac e-Transfer to:\n${etransferEmail}\n\nInclude your order number in the e-transfer message.\n\nYour treasure will begin after payment has been received and verified.`
      });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/admin", requireAdminAuth);
  app.get("/api/admin/health", (req, res) => {
    res.json({ ok: true, admin: true });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || error.statusCode || 500;
    if (status >= 500) console.error("Server error:", error.message);
    res.status(status).json({
      error: status >= 500 ? "Something went wrong. Please try again later." : (error.publicMessage || "Request could not be completed.")
    });
  });

  return app;
}

if (require.main === module) {
  createApp()
    .then((app) => {
      const port = Number(process.env.PORT || 3000);
      app.listen(port, "127.0.0.1", () => console.log(`Forever Beaded API running on http://127.0.0.1:${port}`));
    })
    .catch((error) => {
      console.error("Could not start Forever Beaded API:", error.message);
      process.exit(1);
    });
}

module.exports = {
  PAYMENT_STATUSES,
  ORDER_STATUSES,
  PublicError,
  createApp,
  createOrder,
  migrateSchema,
  normalizeOrderPayload,
  dbGet,
  dbRun
};
