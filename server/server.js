const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const net = require("net");
const tls = require("tls");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const validator = require("validator");
const sharp = require("sharp");
const sqlite3 = require("sqlite3").verbose();
const { SEED_PRODUCTS, getSeedProduct } = require("./catalogue");

const PAYMENT_STATUSES = new Set(["AWAITING_PAYMENT", "RECEIVED", "VERIFIED", "REFUNDED", "CANCELLED"]);
const ORDER_STATUSES = new Set(["NEW", "IN_PROGRESS", "READY", "SHIPPED", "COMPLETED", "CANCELLED"]);
const REVIEW_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);
const REQUIRED_ADMIN_ORIGINS = [
  "https://forever-beaded-api.onrender.com"
];
const DEFAULT_ALLOWED_ORIGINS = [
  "https://foreverbeaded.ca",
  "https://www.foreverbeaded.ca",
  "https://foreverbeaded.github.io",
  "https://foreverbeaded.github.io/forever-beaded",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "http://localhost",
  "http://127.0.0.1"
];

const PROVINCE_ALIASES = {
  ALBERTA: "AB",
  "BRITISH COLUMBIA": "BC",
  MANITOBA: "MB",
  "NEW BRUNSWICK": "NB",
  "NEWFOUNDLAND AND LABRADOR": "NL",
  "NOVA SCOTIA": "NS",
  "NORTHWEST TERRITORIES": "NT",
  NUNAVUT: "NU",
  ONTARIO: "ON",
  "PRINCE EDWARD ISLAND": "PE",
  QUEBEC: "QC",
  SASKATCHEWAN: "SK",
  YUKON: "YT"
};
const POSTAL_PROVINCE_PREFIXES = {
  A: "NL",
  B: "NS",
  C: "PE",
  E: "NB",
  G: "QC",
  H: "QC",
  J: "QC",
  K: "ON",
  L: "ON",
  M: "ON",
  N: "ON",
  P: "ON",
  R: "MB",
  S: "SK",
  T: "AB",
  V: "BC",
  X: "NT",
  Y: "YT"
};

function getEtransferEmail() {
  return process.env.ETRANSFER_EMAIL || "foreverbeaded1@gmail.com";
}

function getDataPath(fileName) {
  return path.join(__dirname, "data", fileName);
}

function getReferenceUploadPath(options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, "referenceUploadPath")) {
    return options.referenceUploadPath ? path.resolve(options.referenceUploadPath) : null;
  }
  const configured = process.env.REFERENCE_UPLOAD_PATH;
  if (configured) return path.resolve(configured);
  return isProductionRuntime() ? null : getDataPath("reference-images");
}

function hashUploadToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function createReferenceUploadToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, hash: hashUploadToken(token) };
}

async function processUploadedDesignImage(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new PublicError(400, "Please choose a design picture.");
  }
  try {
    return await sharp(buffer, { failOn: "error", limitInputPixels: 25000000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    throw new PublicError(400, "That image could not be processed. Please choose a valid JPEG, PNG, or WebP photo.");
  }
}

function resolveStoredImagePath(rootPath, storageKey) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedFile = path.resolve(resolvedRoot, String(storageKey || ""));
  if (!resolvedFile.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new PublicError(404, "Design picture was not found.");
  }
  return resolvedFile;
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
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

function normalizePersonalizationType(value) {
  const type = normalizeText(value || "none", 20, "Personalization type").toLowerCase();
  if (["none", "name", "initials"].includes(type)) return type;
  throw new PublicError(400, "Personalization type is invalid.");
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

async function normalizeReviewPayload(db, body = {}) {
  if (normalizeText(body.website || body.company || body.honeypot, 200, "Honeypot")) {
    throw new PublicError(400, "Review could not be submitted.");
  }
  if (body.consent !== true) throw new PublicError(400, "Please agree to the review consent statement.");

  const stars = Number(body.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new PublicError(400, "Please choose a rating from 1 to 5 stars.");
  }
  const text = normalizeMultilineText(body.text, 600, "Review", { required: true });
  if (text.length < 3) {
    throw new PublicError(400, "Please write at least 3 characters in your review.");
  }
  if ((text.match(/https?:\/\/|www\./gi) || []).length > 1) {
    throw new PublicError(400, "Please remove links from your review.");
  }

  const productKey = normalizeText(body.productId || body.productSlug, 100, "Product", { required: true });
  const product = await getTrustedProduct(db, productKey);
  if (!product) throw new PublicError(400, "Please choose an available product.");
  const submissionKey = normalizeText(body.submissionKey, 100, "Submission key", { required: true });
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(submissionKey)) {
    throw new PublicError(400, "Please refresh the page and try submitting again.");
  }

  const review = {
    displayName: normalizeText(body.displayName || body.name, 40, "Display name", { required: true }),
    email: normalizeEmail(body.email),
    productId: String(product.id),
    productName: product.name,
    stars,
    text,
    submissionKeyHash: hashUploadToken(submissionKey)
  };
  review.payloadHash = crypto.createHash("sha256").update(JSON.stringify({
    displayName: review.displayName,
    email: review.email,
    productId: review.productId,
    stars: review.stars,
    text: review.text
  })).digest("hex");
  return review;
}

function normalizePostalCode(value) {
  const compact = normalizeText(value, 20, "Postal code", { required: true }).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact)) {
    throw new PublicError(400, "Please enter a valid Canadian postal code.");
  }
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

function toTitleCase(value) {
  return normalizeText(value, 160, "Address").toLowerCase().replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function normalizeProvince(value) {
  const cleaned = normalizeText(value, 60, "Province", { required: true }).replace(/\./g, "").toUpperCase();
  const province = PROVINCE_ALIASES[cleaned] || cleaned;
  if (!Object.values(PROVINCE_ALIASES).includes(province)) throw new PublicError(400, "Please enter a valid Canadian province or territory.");
  return province;
}

function rejectMalformedAddressPart(value, field) {
  if (/\b(test|sample|placeholder|unknown|none|n\/a|asdf|qwerty|123 main|fake)\b/i.test(value)) {
    throw new PublicError(400, `Please replace placeholder text in ${field}.`);
  }
  const punctuation = (value.match(/[!@#$%^*_+=<>?{}[\]|\\]/g) || []).length;
  if (punctuation > 2 || /([,.;:])\1{2,}/.test(value)) {
    throw new PublicError(400, `${field} appears malformed.`);
  }
}

function normalizeShippingAddress(shipping = {}, body = {}) {
  const streetRaw = shipping.street || shipping.addressLine1 || shipping.address || body.shippingAddress;
  const cityRaw = shipping.city || body.city;
  const province = normalizeProvince(shipping.province || body.province);
  const postalCode = normalizePostalCode(shipping.postalCode || body.postalCode);
  const country = normalizeText(shipping.country || body.country || "Canada", 80, "Country", { required: true });
  const street = normalizeText(streetRaw, 160, "Street address", { required: true });
  const city = normalizeText(cityRaw, 100, "City", { required: true });

  [street, city, province, postalCode, country].forEach((value) => rejectMalformedAddressPart(value, "shipping address"));
  if (!/\d/.test(street)) throw new PublicError(400, "Please include a street number.");
  if (!/[A-Za-z]{2,}/.test(street.replace(/\d+/g, ""))) throw new PublicError(400, "Please include a street name.");
  if (!/^canada$/i.test(country)) throw new PublicError(400, "This checkout currently validates Canadian shipping addresses only.");

  const expectedProvince = POSTAL_PROVINCE_PREFIXES[postalCode.charAt(0)];
  if (expectedProvince && expectedProvince !== province) {
    throw new PublicError(400, `The postal code appears to belong to ${expectedProvince}, but the province is ${province}.`);
  }

  const normalized = {
    street: toTitleCase(street),
    city: toTitleCase(city),
    province,
    postalCode,
    country: "Canada"
  };
  const normalizedAddress = `${normalized.street}\n${normalized.city}, ${normalized.province} ${normalized.postalCode}\n${normalized.country}`;
  const addressAsEntered = normalizeMultilineText(
    shipping.addressAsEntered || `${streetRaw || ""}\n${cityRaw || ""}, ${shipping.province || body.province || ""} ${shipping.postalCode || body.postalCode || ""}\n${shipping.country || body.country || "Canada"}`,
    700,
    "Address as entered"
  );
  return { ...normalized, normalizedAddress, addressAsEntered };
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
  const baseConfig = {
    configured: missing.length === 0,
    missing,
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "",
    to: process.env.ORDER_NOTIFICATION_EMAIL || "",
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || Number(process.env.SMTP_PORT) === 465
  };
  if (missing.length) return baseConfig;
  return {
    ...baseConfig,
    configured: true
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
  console.info(`[email] SMTP connection: connecting to ${config.host}:${config.port}`);
  let socket = await smtpConnect(config);
  console.info("[email] SMTP connection: connected");
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
    console.info("[email] success: SMTP provider accepted the message");
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
    const seed = getSeedProduct(row.slug || row.id);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      priceCents: row.base_price_cents,
      imageUrl: row.image_url,
      personalizationMaxLength: seed?.personalizationMaxLength ?? null
    };
  }

  const seed = getSeedProduct(id);
  return seed && seed.active ? {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    priceCents: seed.basePriceCents,
    imageUrl: seed.imageUrl,
    personalizationMaxLength: seed.personalizationMaxLength ?? null
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
  const personalizationType = normalizePersonalizationType(rawItem.personalizationType);
  const personalizationMaxLength = Number.isInteger(product.personalizationMaxLength)
    ? Math.min(40, Math.max(1, product.personalizationMaxLength))
    : (personalizationType === "initials" ? 8 : 40);
  const personalizationText = personalizationType === "none"
    ? ""
    : normalizeText(rawItem.personalizationText || rawItem.personalization || rawItem.name, personalizationMaxLength, "Personalization", { required: true }).toUpperCase();
  const requestedProductName = normalizeText(rawItem.requestedProductName, 80, "Product name");
  const colours = String(rawItem.colours || rawItem.colors || "")
    .split(",")
    .map((colour) => colour.trim())
    .filter((colour) => colour && colour.toLowerCase() !== "no color")
    .filter((colour, index, list) => list.findIndex((candidate) => candidate.toLowerCase() === colour.toLowerCase()) === index)
    .join(", ");
  if (isCustomIdea && !colours) throw new PublicError(400, "Please choose a primary bead colour.");
  if (isCustomIdea && colours.split(",").length > 3) throw new PublicError(400, "Please choose no more than three bead colours.");

  return {
    productId: String(product.id),
    productName: product.name,
    design,
    colours: normalizeText(colours, 180, "Colours"),
    personalizationType,
    personalization: personalizationText,
    personalizationText,
    requestedProductName,
    customDescription,
    hardware: normalizeText(rawItem.hardware || rawItem.keychainType, 80, "Hardware"),
    quantity,
    unitPriceCents,
    lineTotalCents: unitPriceCents * quantity,
    referenceImageRequested: isCustomIdea && rawItem.referenceImageRequested === true
  };
}

async function normalizeOrderPayload(db, body) {
  if (normalizeText(body.website || body.company || body.honeypot, 200, "Honeypot")) {
    throw new PublicError(400, "Order could not be submitted.");
  }

  const items = Array.isArray(body.items) ? await Promise.all(body.items.map((item) => normalizeItem(db, item))) : [];
  if (!items.length) throw new PublicError(400, "Please add at least one item.");

  const customer = body.customer || {};
  const shipping = body.shipping || {};
  const address = normalizeShippingAddress(shipping, body);
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const shippingCents = subtotalCents >= 7500 ? 0 : 500;

  return {
    customerName: normalizeText(customer.name || body.customerName || body.name, 120, "Customer name", { required: true }),
    customerEmail: normalizeEmail(customer.email || body.email),
    customerPhone: normalizeText(customer.phone || body.phone, 40, "Phone"),
    shippingAddress: address.normalizedAddress,
    addressAsEntered: address.addressAsEntered,
    normalizedAddress: address.normalizedAddress,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
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

function serializeOrderItem(item) {
  return {
    productId: item.productId,
    productName: item.productName,
    design: item.design,
    colours: item.colours,
    hardware: item.hardware,
    quantity: item.quantity,
    personalizationType: item.personalizationType,
    personalizationText: item.personalizationText,
    requestedProductName: item.requestedProductName,
    customDescription: item.customDescription,
    unitPriceCents: item.unitPriceCents,
    lineTotalCents: item.lineTotalCents
  };
}

function getAllowedOrigins(value) {
  const configured = String(value || "").split(",").map((origin) => origin.trim()).filter(Boolean);
  const storefrontOrigins = configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
  return [...new Set([...storefrontOrigins, ...REQUIRED_ADMIN_ORIGINS])];
}

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  if (origin === "null") return true;
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
    "customer_phone", "shipping_address", "address_as_entered", "normalized_address", "city", "province", "postal_code", "country", "notes",
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
    address_as_entered TEXT,
    normalized_address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT,
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

  const orderColumns = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(orders)", [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  const existingOrderColumns = new Set(orderColumns.map((column) => column.name));
  for (const [name, definition] of [
    ["address_as_entered", "TEXT"],
    ["normalized_address", "TEXT"],
    ["city", "TEXT"],
    ["country", "TEXT"]
  ]) {
    if (!existingOrderColumns.has(name)) {
      await dbRun(db, `ALTER TABLE orders ADD COLUMN ${name} ${definition}`);
    }
  }

  await dbRun(db, `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    requested_product_name TEXT,
    design TEXT,
    colours TEXT,
    personalization_type TEXT NOT NULL DEFAULT 'none',
    personalization TEXT,
    custom_description TEXT,
    hardware TEXT,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    line_total_cents INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);

  await dbRun(db, `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    display_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT,
    stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED')),
    moderated_at TEXT,
    moderation_note TEXT,
    submission_key_hash TEXT UNIQUE,
    payload_hash TEXT,
    notification_status TEXT NOT NULL DEFAULT 'PENDING',
    notification_attempted_at TEXT,
    notification_sent_at TEXT,
    notification_message_id TEXT,
    notification_error TEXT
  )`);
  await dbRun(db, "CREATE INDEX IF NOT EXISTS idx_reviews_status_created ON reviews(status, created_at DESC)");

  const reviewColumns = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(reviews)", [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  const existingReviewColumns = new Set(reviewColumns.map((column) => column.name));
  for (const [name, definition] of [
    ["submission_key_hash", "TEXT"],
    ["payload_hash", "TEXT"],
    ["notification_status", "TEXT NOT NULL DEFAULT 'PENDING'"],
    ["notification_attempted_at", "TEXT"],
    ["notification_sent_at", "TEXT"],
    ["notification_message_id", "TEXT"],
    ["notification_error", "TEXT"]
  ]) {
    if (!existingReviewColumns.has(name)) {
      await dbRun(db, `ALTER TABLE reviews ADD COLUMN ${name} ${definition}`);
    }
  }
  await dbRun(db, "CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_submission_key ON reviews(submission_key_hash) WHERE submission_key_hash IS NOT NULL");

  await dbRun(db, `CREATE TABLE IF NOT EXISTS review_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    sent_at TEXT,
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempted_at TEXT,
    message_id TEXT,
    last_error TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);

  const requestColumns = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(review_requests)", [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  const existingRequestColumns = new Set(requestColumns.map((column) => column.name));
  for (const [name, definition] of [
    ["status", "TEXT NOT NULL DEFAULT 'PENDING'"],
    ["attempt_count", "INTEGER NOT NULL DEFAULT 0"],
    ["last_attempted_at", "TEXT"],
    ["message_id", "TEXT"],
    ["last_error", "TEXT"]
  ]) {
    if (!existingRequestColumns.has(name)) {
      await dbRun(db, `ALTER TABLE review_requests ADD COLUMN ${name} ${definition}`);
    }
  }

  const itemColumns = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(order_items)", [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  if (itemColumns.length && !itemColumns.some((column) => column.name === "custom_description")) {
    await dbRun(db, "ALTER TABLE order_items ADD COLUMN custom_description TEXT");
  }
  if (itemColumns.length && !itemColumns.some((column) => column.name === "personalization_type")) {
    await dbRun(db, "ALTER TABLE order_items ADD COLUMN personalization_type TEXT NOT NULL DEFAULT 'none'");
  }
  if (itemColumns.length && !itemColumns.some((column) => column.name === "requested_product_name")) {
    await dbRun(db, "ALTER TABLE order_items ADD COLUMN requested_product_name TEXT");
  }

  await dbRun(db, `CREATE TABLE IF NOT EXISTS order_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);

  await dbRun(db, `CREATE TABLE IF NOT EXISTS order_reference_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    order_item_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','STORED','REMOVED')),
    upload_token_hash TEXT UNIQUE NOT NULL,
    storage_key TEXT,
    original_filename TEXT,
    mime_type TEXT,
    byte_size INTEGER,
    width INTEGER,
    height INTEGER,
    uploaded_at TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(order_item_id) REFERENCES order_items(id) ON DELETE SET NULL
  )`);

  await dbRun(db, `CREATE TABLE IF NOT EXISTS order_design_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'STORED' CHECK(status IN ('STORED','REMOVED')),
    customer_access_token_hash TEXT UNIQUE NOT NULL,
    storage_key TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
    byte_size INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
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
      shipping_address, address_as_entered, normalized_address, city, province, postal_code, country,
      notes, subtotal_cents, shipping_cents, total_cents, currency, payment_method, payment_status, order_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      orderNumber, now, now, order.customerName, order.customerEmail, order.customerPhone,
      order.shippingAddress, order.addressAsEntered, order.normalizedAddress, order.city, order.province, order.postalCode, order.country, order.notes,
      order.subtotalCents, order.shippingCents, order.totalCents, order.currency,
      order.paymentMethod, order.paymentStatus, order.orderStatus
    ]);

    const referenceUploads = [];
    for (const item of order.items) {
      const itemResult = await dbRun(db, `INSERT INTO order_items (
        order_id, product_id, product_name, requested_product_name, design, colours, personalization_type, personalization, custom_description, hardware,
        quantity, unit_price_cents, line_total_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        result.lastID, item.productId, item.productName, item.requestedProductName, item.design, item.colours,
        item.personalizationType, item.personalizationText, item.customDescription, item.hardware, item.quantity, item.unitPriceCents, item.lineTotalCents
      ]);
      if (item.referenceImageRequested) {
        const upload = createReferenceUploadToken();
        await dbRun(db, `INSERT INTO order_reference_images (
          order_id, order_item_id, created_at, updated_at, upload_token_hash
        ) VALUES (?, ?, ?, ?, ?)`, [result.lastID, itemResult.lastID, now, now, upload.hash]);
        referenceUploads.push({ token: upload.token, itemIndex: referenceUploads.length });
      }
    }

    await dbRun(db, "INSERT INTO order_events(order_id, created_at, event_type, details) VALUES (?, ?, ?, ?)", [
      result.lastID,
      now,
      "ORDER_CREATED",
      JSON.stringify({ paymentStatus: order.paymentStatus, orderStatus: order.orderStatus })
    ]);
    await dbRun(db, "COMMIT");
    return { orderId: result.lastID, orderNumber, referenceUploads };
  } catch (error) {
    await dbRun(db, "ROLLBACK").catch(() => {});
    throw error;
  }
}

async function getOrderWithItems(db, orderNumber) {
  const orderRow = await dbGet(db, `SELECT id, order_number, created_at, updated_at, customer_name, customer_email, customer_phone,
    shipping_address, address_as_entered, normalized_address, city, province, postal_code, country, notes,
    subtotal_cents, shipping_cents, total_cents, currency, payment_method, payment_status, order_status
    FROM orders
    WHERE order_number = ?`, [orderNumber]);
  if (!orderRow) throw new PublicError(404, "Order was not found.");

  const itemRows = await new Promise((resolve, reject) => {
    db.all(`SELECT product_id, product_name, requested_product_name, design, colours, personalization_type, personalization,
      custom_description, hardware, quantity, unit_price_cents, line_total_cents
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC`, [orderRow.id], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });

  return {
    orderId: orderRow.id,
    orderNumber: orderRow.order_number,
    customerName: orderRow.customer_name,
    customerEmail: orderRow.customer_email,
    customerPhone: orderRow.customer_phone,
    shippingAddress: orderRow.shipping_address,
    addressAsEntered: orderRow.address_as_entered,
    normalizedAddress: orderRow.normalized_address,
    city: orderRow.city,
    province: orderRow.province,
    postalCode: orderRow.postal_code,
    country: orderRow.country,
    notes: orderRow.notes,
    subtotalCents: orderRow.subtotal_cents,
    shippingCents: orderRow.shipping_cents,
    totalCents: orderRow.total_cents,
    currency: orderRow.currency,
    paymentMethod: orderRow.payment_method,
    paymentStatus: orderRow.payment_status,
    orderStatus: orderRow.order_status,
    items: itemRows.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      requestedProductName: item.requested_product_name || "",
      design: item.design,
      colours: item.colours,
      personalizationType: item.personalization_type,
      personalization: item.personalization,
      personalizationText: item.personalization,
      customDescription: item.custom_description,
      hardware: item.hardware,
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
      lineTotalCents: item.line_total_cents
    }))
  };
}

async function appendItemToOrder(db, orderNumber, rawItem) {
  const item = await normalizeItem(db, rawItem);
  await dbRun(db, "BEGIN IMMEDIATE TRANSACTION");
  try {
    const orderRow = await dbGet(db, `SELECT id, subtotal_cents, order_status
      FROM orders
      WHERE order_number = ?`, [orderNumber]);
    if (!orderRow) throw new PublicError(404, "Order was not found.");
    if (orderRow.order_status === "CANCELLED" || orderRow.order_status === "COMPLETED") {
      throw new PublicError(400, "This order can no longer be updated.");
    }

    const itemResult = await dbRun(db, `INSERT INTO order_items (
      order_id, product_id, product_name, requested_product_name, design, colours, personalization_type, personalization, custom_description, hardware,
      quantity, unit_price_cents, line_total_cents
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      orderRow.id, item.productId, item.productName, item.requestedProductName, item.design, item.colours,
      item.personalizationType, item.personalizationText, item.customDescription, item.hardware, item.quantity, item.unitPriceCents, item.lineTotalCents
    ]);
    let referenceUpload = null;
    if (item.referenceImageRequested) {
      const upload = createReferenceUploadToken();
      const uploadNow = new Date().toISOString();
      await dbRun(db, `INSERT INTO order_reference_images (
        order_id, order_item_id, created_at, updated_at, upload_token_hash
      ) VALUES (?, ?, ?, ?, ?)`, [orderRow.id, itemResult.lastID, uploadNow, uploadNow, upload.hash]);
      referenceUpload = { token: upload.token, itemIndex: 0 };
    }

    const subtotalCents = Number(orderRow.subtotal_cents || 0) + item.lineTotalCents;
    const shippingCents = subtotalCents >= 7500 ? 0 : 500;
    const totalCents = subtotalCents + shippingCents;
    const now = new Date().toISOString();
    await dbRun(db, `UPDATE orders
      SET updated_at = ?, subtotal_cents = ?, shipping_cents = ?, total_cents = ?
      WHERE id = ?`, [now, subtotalCents, shippingCents, totalCents, orderRow.id]);
    await dbRun(db, "INSERT INTO order_events(order_id, created_at, event_type, details) VALUES (?, ?, ?, ?)", [
      orderRow.id,
      now,
      "ORDER_ITEM_ADDED",
      JSON.stringify({ productId: item.productId, productName: item.productName, quantity: item.quantity })
    ]);
    await dbRun(db, "COMMIT");
    const savedOrder = await getOrderWithItems(db, orderNumber);
    savedOrder.referenceUploads = referenceUpload ? [referenceUpload] : [];
    return savedOrder;
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
      shipping_address, address_as_entered, normalized_address, city, province, postal_code, country,
      subtotal_cents, shipping_cents, total_cents, currency,
      payment_status, order_status
      FROM orders
      ORDER BY created_at DESC`, [], (error, rows) => {
      if (error) reject(error);
      else resolve(rows || []);
    });
  });
  const items = await new Promise((resolve, reject) => {
    db.all(`SELECT orders.order_number, order_items.product_name, order_items.design,
      order_items.colours, order_items.personalization_type, order_items.personalization, order_items.custom_description,
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
    ["Order Number", "Created", "Customer", "Email", "Phone", "Shipping Address", "Address As Entered", "Normalized Address", "City", "Province", "Postal Code", "Country", "Subtotal", "Shipping", "Total", "Currency", "Payment Status", "Order Status"],
    ...orders.map((order) => [
      order.order_number, order.created_at, order.customer_name, order.customer_email, order.customer_phone,
      order.shipping_address, order.address_as_entered, order.normalized_address, order.city, order.province, order.postal_code, order.country,
      order.subtotal_cents, order.shipping_cents, order.total_cents,
      order.currency, order.payment_status, order.order_status
    ])
  ];
  const itemRows = [
    ["Order Number", "Product", "Design", "Colours", "Personalization Type", "Personalization Text", "Custom Description", "Hardware", "Quantity", "Unit Price", "Line Total"],
    ...items.map((item) => [
      item.order_number, item.product_name, item.design, item.colours, item.personalization_type,
      item.personalization, item.custom_description, item.hardware, item.quantity, item.unit_price_cents, item.line_total_cents
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
        type: index >= 12 && index <= 14 && row !== orderRows[0] ? "Number" : "String"
      })))).join("\n      ")}
    </Table>
  </Worksheet>
  <Worksheet ss:Name="Items">
    <Table>
      ${itemRows.map((row) => spreadsheetRow(row.map((value, index) => ({
        value,
        type: index >= 8 && row !== itemRows[0] ? "Number" : "String"
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
    `Requested product name: ${item.requestedProductName || ""}`,
    `Design: ${item.design || ""}`,
    `Colours: ${item.colours || ""}`,
    `Hardware: ${item.hardware || ""}`,
    `Quantity: ${item.quantity}`,
    `Personalization choice: ${item.personalizationType || "none"}`,
    `Name or initials entered: ${item.personalizationText || item.personalization || ""}`,
    item.customDescription ? `Custom-design description: ${item.customDescription}` : ""
  ].filter(Boolean).join("\n")).join("\n\n");

  return `New Forever Beaded order received.

Order number: ${saved.orderNumber}
Customer name: ${order.customerName}
Customer email: ${order.customerEmail}
Phone: ${order.customerPhone || ""}
Shipping address: ${order.shippingAddress || ""}
Address as entered: ${order.addressAsEntered || ""}
Normalized address: ${order.normalizedAddress || ""}
City: ${order.city || ""}
Province: ${order.province || ""}
Postal code: ${order.postalCode || ""}
Country: ${order.country || ""}

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

function buildCustomerConfirmationMessage(order, saved, etransferEmail, emailSent) {
  const lines = [
    "Thank you! Your Forever Beaded order has been received.",
    "",
    `Order number: ${saved.orderNumber}`,
    "",
    `Total: ${(order.totalCents / 100).toFixed(2)} ${order.currency}`,
    "",
    "Shipping address:",
    order.normalizedAddress || order.shippingAddress || "",
    "",
    "Send your Interac e-Transfer to:",
    etransferEmail,
    "",
    "Include your order number in the e-Transfer message.",
    "",
    "We'll begin creating your handmade treasure after payment has been received and verified.",
    "",
    "When your treasure arrives, you're warmly invited to leave an honest review:",
    "https://foreverbeaded.ca/reviews.html"
  ];
  if (emailSent) {
    lines.push("", "A confirmation email has been sent to your inbox.");
  }
  return lines.join("\n");
}

function buildReviewRequestMessage(order) {
  return `Thank you so much for supporting Forever Beaded!

I hope you're loving your handmade creation.

If you have a moment, I'd really appreciate an honest review on my website. Your feedback helps my small business grow and helps other customers discover Forever Beaded.

Leave a review:
https://foreverbeaded.ca/reviews.html

Thank you for supporting handmade!

Forever Beaded
Small Beads, Big Joy!

Order: ${order.orderNumber}`;
}

async function sendReviewRequestEmail(order) {
  const config = getEmailConfig();
  if (!config.configured) {
    return {
      emailSent: false,
      to: order.customerEmail,
      provider: "smtp",
      providerResponse: `Missing email environment variables: ${config.missing.join(", ")}`,
      messageId: null
    };
  }
  try {
    const result = await sendSmtpMail(config, {
      from: config.from,
      to: order.customerEmail,
      subject: `How are you enjoying your Forever Beaded treasure?`,
      text: buildReviewRequestMessage(order)
    });
    return {
      emailSent: true,
      to: order.customerEmail,
      provider: "smtp",
      providerResponse: result.providerResponse,
      messageId: result.messageId
    };
  } catch (error) {
    return {
      emailSent: false,
      to: order.customerEmail,
      provider: "smtp",
      providerResponse: error.message,
      messageId: null
    };
  }
}

function buildReviewNotificationMessage(review) {
  const adminBaseUrl = String(process.env.PUBLIC_API_BASE_URL || "https://forever-beaded-api.onrender.com").replace(/\/$/, "");
  return `A new customer review is waiting for approval.

Product: ${escapeEmailText(review.productName)}
Rating: ${review.stars} out of 5 stars
Customer display name: ${escapeEmailText(review.displayName)}
Review reference ID: ${review.id}
Submitted: ${review.createdAt}

Review:
${escapeEmailText(review.text)}

Moderate this review:
${adminBaseUrl}/admin/reviews

The customer email remains private and is available only in the authenticated moderation dashboard.`;
}

async function sendReviewNotificationEmail(review) {
  const config = getEmailConfig();
  const to = config.configured ? config.to : getOrderNotificationEmail();
  if (!config.configured) {
    return {
      emailSent: false,
      to,
      provider: "smtp",
      providerResponse: `Missing email environment variables: ${config.missing.join(", ")}`,
      messageId: null
    };
  }
  try {
    const result = await sendSmtpMail(config, {
      from: config.from,
      to,
      subject: "Forever Beaded — New Review Awaiting Approval",
      text: buildReviewNotificationMessage(review)
    });
    return {
      emailSent: true,
      to,
      provider: "smtp",
      providerResponse: result.providerResponse,
      messageId: result.messageId
    };
  } catch (error) {
    return {
      emailSent: false,
      to,
      provider: "smtp",
      providerResponse: error.message,
      messageId: null
    };
  }
}

async function recordReviewNotificationResult(db, reviewId, result) {
  const now = new Date().toISOString();
  const status = result.emailSent ? "SENT" : "FAILED";
  await dbRun(db, `UPDATE reviews SET
    updated_at = ?, notification_status = ?, notification_attempted_at = ?, notification_sent_at = ?,
    notification_message_id = ?, notification_error = ?
    WHERE id = ?`, [
    now,
    status,
    now,
    result.emailSent ? now : null,
    result.messageId || null,
    result.emailSent ? null : String(result.providerResponse || "Notification failed.").trim().slice(0, 500),
    reviewId
  ]);
  return status;
}

async function notifyOwnerOfReview(db, review, sender) {
  let result;
  try {
    result = await sender(review);
  } catch (error) {
    result = { emailSent: false, providerResponse: error.message, messageId: null };
  }
  try {
    const status = await recordReviewNotificationResult(db, review.id, result);
    return { status, result };
  } catch (error) {
    console.error("Could not record review notification status:", error.message);
    return { status: result.emailSent ? "SENT" : "FAILED", result };
  }
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

  console.info("[email] EMAIL STARTED");
  console.info(`[email] recipient address: ${to}`);
  console.info(`[email] SMTP host: ${config.host || "(missing)"}`);
  console.info(`[email] SMTP port: ${config.port || "(missing)"}`);
  console.info(`[email] SMTP_USER exists: ${Boolean(config.user)}`);
  console.info(`[email] SMTP_PASS exists: ${Boolean(config.pass)}`);
  console.info(`[email] SMTP configuration: ${config.configured ? "present" : `missing ${config.missing.join(", ")}`}`);

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
    console.error("[email] complete error message:", error?.stack || error?.message || error);
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

function requireAdminAuth(req, res, next, configuredSecret) {
  const adminSecret = configuredSecret || process.env.ADMIN_SECRET;
  if (!adminSecret || adminSecret === "replace-with-a-long-random-secret") {
    return res.status(503).json({ error: "Admin API is not configured." });
  }
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== adminSecret) return res.status(401).json({ error: "Authentication required." });
  return next();
}

function rejectUnsupportedOrderMethod(req, res) {
  res.set("Allow", "POST, OPTIONS");
  return res.status(405).json({ error: "Method is not allowed." });
}

async function createPendingReview(db, review) {
  const now = new Date().toISOString();
  try {
    const result = await dbRun(db, `INSERT INTO reviews (
      created_at, updated_at, display_name, customer_email, product_id, product_name, stars, review_text,
      status, submission_key_hash, payload_hash, notification_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, 'PENDING')`, [
      now, now, review.displayName, review.email, review.productId, review.productName, review.stars, review.text,
      review.submissionKeyHash, review.payloadHash
    ]);
    return {
      id: result.lastID,
      createdAt: now,
      ...review,
      notificationStatus: "PENDING",
      duplicate: false
    };
  } catch (error) {
    if (error?.code !== "SQLITE_CONSTRAINT") throw error;
    const existing = await dbGet(db, `SELECT id, created_at, display_name, customer_email, product_id, product_name,
      stars, review_text, payload_hash, notification_status
      FROM reviews WHERE submission_key_hash = ?`, [review.submissionKeyHash]);
    if (!existing || existing.payload_hash !== review.payloadHash) {
      throw new PublicError(409, "This review submission changed while it was being retried. Please refresh and try again.");
    }
    return {
      id: existing.id,
      createdAt: existing.created_at,
      displayName: existing.display_name,
      email: existing.customer_email,
      productId: existing.product_id,
      productName: existing.product_name,
      stars: existing.stars,
      text: existing.review_text,
      notificationStatus: existing.notification_status,
      duplicate: true
    };
  }
}

async function createApp(options = {}) {
  readEnvFile(path.join(__dirname, ".env"));
  const app = express();
  const db = options.db || createDatabase(options.databasePath || process.env.DATABASE_PATH || path.join(__dirname, "data", "orders.db"));
  const referenceUploadPath = getReferenceUploadPath(options);
  await migrateSchema(db);

  const allowedOrigins = getAllowedOrigins(options.allowedOrigins || process.env.ALLOWED_ORIGINS);
  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: options.apiRateLimit || 100, standardHeaders: true, legacyHeaders: false });
  const orderLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: options.orderRateLimit || 40, standardHeaders: true, legacyHeaders: false });
  const reviewLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: options.reviewRateLimit || 5, standardHeaders: true, legacyHeaders: false });

  app.disable("x-powered-by");
  if (options.trustProxy != null) {
    app.set("trust proxy", options.trustProxy);
  } else if (isProductionRuntime()) {
    app.set("trust proxy", 1);
  }
  app.locals.db = db;
  app.locals.referenceUploadPath = referenceUploadPath;
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:", "blob:"]
      }
    }
  }));
  app.use(cors({
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Reference-Upload-Token", "X-File-Name"],
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
  app.get("/admin/custom-designs", (req, res) => {
    res.sendFile(path.join(__dirname, "admin-custom-design.html"));
  });
  app.get("/admin/reviews", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(__dirname, "admin-reviews.html"));
  });
  app.get("/admin-assets/custom-design.css", (req, res) => {
    res.type("text/css").sendFile(path.join(__dirname, "admin-custom-design.css"));
  });
  app.get("/admin-assets/custom-design.js", (req, res) => {
    res.type("application/javascript").sendFile(path.join(__dirname, "admin-custom-design.js"));
  });
  app.get("/admin-assets/reviews.css", (req, res) => {
    res.type("text/css").sendFile(path.join(__dirname, "admin-reviews.css"));
  });
  app.get("/admin-assets/reviews.js", (req, res) => {
    res.type("application/javascript").sendFile(path.join(__dirname, "admin-reviews.js"));
  });

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

  app.get("/api/reviews", async (req, res, next) => {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all(`SELECT id, created_at, display_name, product_name, stars, review_text
          FROM reviews
          WHERE status = 'APPROVED'
          ORDER BY created_at DESC, id DESC
          LIMIT 100`, [], (error, result) => {
          if (error) reject(error);
          else resolve(result || []);
        });
      });
      res.json({
        success: true,
        reviews: rows.map((row) => ({
          id: row.id,
          createdAt: row.created_at,
          displayName: row.display_name,
          product: row.product_name || "",
          stars: row.stars,
          text: row.review_text
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reviews", reviewLimiter, async (req, res, next) => {
    try {
      const review = await normalizeReviewPayload(db, req.body || {});
      const saveReview = options.reviewSaver || createPendingReview;
      const saved = await saveReview(db, review);
      if (saved.notificationStatus !== "SENT") {
        const sender = options.reviewNotificationSender || sendReviewNotificationEmail;
        const notification = await notifyOwnerOfReview(db, saved, sender);
        saved.notificationStatus = notification.status;
      }
      res.status(saved.duplicate ? 200 : 201).json({
        success: true,
        reviewId: saved.id,
        status: "PENDING",
        duplicate: saved.duplicate,
        message: "Thank you! Your review has been received and is awaiting approval."
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/orders", orderLimiter, async (req, res, next) => {
    try {
      const order = await normalizeOrderPayload(db, req.body || {});
      if (order.items.some((item) => item.referenceImageRequested) && !referenceUploadPath) {
        throw new PublicError(503, "Reference photo uploads are temporarily unavailable. Please remove the photo and try again.");
      }
      const saved = await createOrder(db, order);
      const etransferEmail = getEtransferEmail();
      await writeOrdersWorkbook(db);
      const emailResult = options.emailSender
        ? await options.emailSender(order, saved, etransferEmail)
        : await sendOrderNotificationEmail(order, saved, etransferEmail);
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
        shippingAddress: order.shippingAddress,
        addressAsEntered: order.addressAsEntered,
        normalizedAddress: order.normalizedAddress,
        items: order.items.map(serializeOrderItem),
        referenceUploads: saved.referenceUploads || [],
        workbookUpdated: true,
        email: emailResult,
        confirmationEmail: emailResult,
        message: buildCustomerConfirmationMessage(order, saved, etransferEmail, emailResult.emailSent)
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/orders/:orderNumber/items", orderLimiter, async (req, res, next) => {
    try {
      if (normalizeText(req.body?.website || req.body?.company || req.body?.honeypot, 200, "Honeypot")) {
        throw new PublicError(400, "Order could not be submitted.");
      }
      const rawItem = req.body?.item || (Array.isArray(req.body?.items) ? req.body.items[0] : null);
      if (rawItem?.referenceImageRequested === true && !referenceUploadPath) {
        throw new PublicError(503, "Reference photo uploads are temporarily unavailable. Please remove the photo and try again.");
      }
      const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
      const order = await appendItemToOrder(db, orderNumber, rawItem);
      const saved = { orderId: order.orderId, orderNumber: order.orderNumber };
      const etransferEmail = getEtransferEmail();
      await writeOrdersWorkbook(db);
      const emailResult = options.emailSender
        ? await options.emailSender(order, saved, etransferEmail)
        : await sendOrderNotificationEmail(order, saved, etransferEmail);
      res.status(200).json({
        success: true,
        orderSaved: true,
        emailSent: emailResult.emailSent,
        orderId: order.orderNumber,
        orderNumber: order.orderNumber,
        total: order.totalCents,
        subtotal: order.subtotalCents,
        shipping: order.shippingCents,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        etransferEmail,
        shippingAddress: order.shippingAddress,
        addressAsEntered: order.addressAsEntered,
        normalizedAddress: order.normalizedAddress,
        items: order.items.map(serializeOrderItem),
        referenceUploads: order.referenceUploads || [],
        workbookUpdated: true,
        email: emailResult,
        confirmationEmail: emailResult,
        message: buildCustomerConfirmationMessage(order, saved, etransferEmail, emailResult.emailSent)
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/orders/:orderNumber/reference-image", orderLimiter,
    express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "3mb" }),
    async (req, res, next) => {
      let temporaryPath = "";
      try {
        if (!referenceUploadPath) throw new PublicError(503, "Reference photo uploads are temporarily unavailable.");
        const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
        const token = req.get("x-reference-upload-token") || "";
        if (!token) throw new PublicError(401, "Reference photo authorization is required.");
        if (!Buffer.isBuffer(req.body) || !req.body.length) throw new PublicError(400, "Please choose a reference photo.");

        const reference = await dbGet(db, `SELECT order_reference_images.id, order_reference_images.status
          FROM order_reference_images
          JOIN orders ON orders.id = order_reference_images.order_id
          WHERE orders.order_number = ? AND order_reference_images.upload_token_hash = ?`, [orderNumber, hashUploadToken(token)]);
        if (!reference || reference.status !== "PENDING") throw new PublicError(401, "Reference photo authorization is invalid or has expired.");

        let processed;
        try {
          processed = await sharp(req.body, { failOn: "error", limitInputPixels: 25000000 })
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 84, mozjpeg: true })
            .toBuffer({ resolveWithObject: true });
        } catch (error) {
          throw new PublicError(400, "That image could not be processed. Please choose a valid JPEG, PNG, or WebP photo.");
        }

        fs.mkdirSync(referenceUploadPath, { recursive: true });
        const storageKey = `${crypto.randomUUID()}.jpg`;
        const finalPath = path.join(referenceUploadPath, storageKey);
        temporaryPath = `${finalPath}.tmp`;
        await fs.promises.writeFile(temporaryPath, processed.data, { flag: "wx" });
        await fs.promises.rename(temporaryPath, finalPath);
        temporaryPath = "";
        const now = new Date().toISOString();
        const originalName = normalizeText(decodeURIComponent(req.get("x-file-name") || "reference-photo"), 120, "File name");
        await dbRun(db, `UPDATE order_reference_images SET
          updated_at = ?, status = 'STORED', upload_token_hash = ?, storage_key = ?, original_filename = ?,
          mime_type = 'image/jpeg', byte_size = ?, width = ?, height = ?, uploaded_at = ?
          WHERE id = ?`, [now, hashUploadToken(crypto.randomBytes(32).toString("base64url")), storageKey, originalName,
          processed.data.length, processed.info.width, processed.info.height, now, reference.id]);
        await dbRun(db, `INSERT INTO order_events(order_id, created_at, event_type, details)
          SELECT order_id, ?, 'REFERENCE_IMAGE_STORED', ? FROM order_reference_images WHERE id = ?`,
        [now, JSON.stringify({ referenceImageId: reference.id }), reference.id]);
        res.status(200).json({ success: true, orderNumber, referenceImageStored: true });
      } catch (error) {
        if (temporaryPath) await fs.promises.unlink(temporaryPath).catch(() => {});
        next(error);
      }
    });

  app.get("/api/orders/:orderNumber/custom-designs/:orderItemId/image", async (req, res, next) => {
    try {
      if (!referenceUploadPath) throw new PublicError(503, "Custom design picture storage is not configured.");
      const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
      const orderItemId = Number.parseInt(req.params.orderItemId, 10);
      const token = String(req.query.token || "");
      if (!Number.isSafeInteger(orderItemId) || orderItemId < 1 || !token) {
        throw new PublicError(401, "This custom design preview link is invalid.");
      }
      const designImage = await dbGet(db, `SELECT order_design_images.storage_key
        FROM order_design_images
        JOIN orders ON orders.id = order_design_images.order_id
        WHERE orders.order_number = ? AND order_design_images.order_item_id = ?
          AND order_design_images.status = 'STORED'
          AND order_design_images.customer_access_token_hash = ?`,
      [orderNumber, orderItemId, hashUploadToken(token)]);
      if (!designImage?.storage_key) throw new PublicError(404, "Custom design picture was not found.");
      res.set("Cache-Control", "private, no-store");
      res.type("image/jpeg");
      res.sendFile(resolveStoredImagePath(referenceUploadPath, designImage.storage_key));
    } catch (error) {
      next(error);
    }
  });

  app.all("/api/orders/:orderNumber/items", rejectUnsupportedOrderMethod);
  app.all("/api/orders", rejectUnsupportedOrderMethod);

  app.use("/api/admin", (req, res, next) => requireAdminAuth(req, res, next, options.adminSecret));
  app.use("/api/admin", (req, res, next) => {
    res.set("Cache-Control", "private, no-store");
    next();
  });
  app.get("/api/admin/health", (req, res) => {
    res.json({ ok: true, admin: true });
  });
  app.get("/api/admin/reviews", async (req, res, next) => {
    try {
      const requestedStatus = normalizeText(req.query.status || "PENDING", 20, "Review status").toUpperCase();
      if (!REVIEW_STATUSES.has(requestedStatus)) throw new PublicError(400, "Review status is invalid.");
      const rows = await new Promise((resolve, reject) => {
        db.all(`SELECT id, created_at, updated_at, display_name, customer_email, product_id, product_name,
          stars, review_text, status, moderated_at, moderation_note, notification_status,
          notification_attempted_at, notification_sent_at, notification_message_id, notification_error
          FROM reviews WHERE status = ? ORDER BY created_at ASC, id ASC`, [requestedStatus], (error, result) => {
          if (error) reject(error);
          else resolve(result || []);
        });
      });
      res.json({ success: true, reviews: rows });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/reviews/:reviewId", async (req, res, next) => {
    try {
      const reviewId = Number.parseInt(req.params.reviewId, 10);
      if (!Number.isSafeInteger(reviewId) || reviewId < 1) throw new PublicError(400, "Review is invalid.");
      const status = normalizeText(req.body?.status, 20, "Review status", { required: true }).toUpperCase();
      if (!REVIEW_STATUSES.has(status) || status === "PENDING") {
        throw new PublicError(400, "Choose APPROVED or REJECTED.");
      }
      const note = normalizeText(req.body?.moderationNote, 300, "Moderation note");
      const now = new Date().toISOString();
      const result = await dbRun(db, `UPDATE reviews
        SET updated_at = ?, status = ?, moderated_at = ?, moderation_note = ?
        WHERE id = ?`, [now, status, now, note, reviewId]);
      if (!result.changes) throw new PublicError(404, "Review was not found.");
      res.json({ success: true, reviewId, status });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/reviews/:reviewId/notification", async (req, res, next) => {
    try {
      const reviewId = Number.parseInt(req.params.reviewId, 10);
      if (!Number.isSafeInteger(reviewId) || reviewId < 1) throw new PublicError(400, "Review is invalid.");
      const row = await dbGet(db, `SELECT id, created_at, display_name, customer_email, product_id, product_name,
        stars, review_text, notification_status FROM reviews WHERE id = ?`, [reviewId]);
      if (!row) throw new PublicError(404, "Review was not found.");
      if (row.notification_status === "SENT") {
        throw new PublicError(409, "The owner notification was already sent for this review.");
      }
      const review = {
        id: row.id,
        createdAt: row.created_at,
        displayName: row.display_name,
        email: row.customer_email,
        productId: row.product_id,
        productName: row.product_name,
        stars: row.stars,
        text: row.review_text
      };
      const sender = options.reviewNotificationSender || sendReviewNotificationEmail;
      const notification = await notifyOwnerOfReview(db, review, sender);
      if (notification.status !== "SENT") {
        throw new PublicError(503, "The notification was not sent. Check the email configuration and try again.");
      }
      res.json({ success: true, reviewId, notificationStatus: "SENT" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/orders/:orderNumber/review-request", async (req, res, next) => {
    try {
      if (req.body?.deliveryConfirmed !== true) {
        throw new PublicError(400, "Confirm delivery before sending a review request.");
      }
      const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
      const order = await getOrderWithItems(db, orderNumber);
      if (order.orderStatus === "CANCELLED") throw new PublicError(400, "A cancelled order cannot receive a review request.");
      const now = new Date().toISOString();
      let request = await dbGet(db, "SELECT id, status FROM review_requests WHERE order_id = ?", [order.orderId]);
      if (request?.status === "SENT") {
        throw new PublicError(409, "A review request was already sent for this order.");
      }
      if (!request) {
        const inserted = await dbRun(db, `INSERT INTO review_requests (
          order_id, created_at, sent_at, recipient_email, status, attempt_count
        ) VALUES (?, ?, ?, ?, 'PENDING', 0)`, [order.orderId, now, now, order.customerEmail]);
        request = { id: inserted.lastID, status: "PENDING" };
      }
      await dbRun(db, `UPDATE review_requests SET status = 'PENDING', attempt_count = attempt_count + 1,
        last_attempted_at = ?, last_error = NULL WHERE id = ?`, [now, request.id]);
      const emailResult = options.reviewEmailSender
        ? await options.reviewEmailSender(order)
        : await sendReviewRequestEmail(order);
      if (!emailResult.emailSent) {
        await dbRun(db, `UPDATE review_requests SET status = 'FAILED', last_error = ?, message_id = NULL
          WHERE id = ?`, [String(emailResult.providerResponse || "Email delivery failed.").slice(0, 500), request.id]);
        throw new PublicError(503, "The review request was not sent. Check the email configuration and try again.");
      }
      await dbRun(db, `UPDATE review_requests SET status = 'SENT', sent_at = ?, message_id = ?, last_error = NULL
        WHERE id = ?`, [now, emailResult.messageId || null, request.id]);
      await dbRun(db, "INSERT INTO order_events(order_id, created_at, event_type, details) VALUES (?, ?, ?, ?)", [
        order.orderId, now, "REVIEW_REQUEST_SENT", JSON.stringify({ recipient: order.customerEmail })
      ]);
      res.json({ success: true, orderNumber, sentAt: now });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/admin/orders/:orderNumber/reference-image", async (req, res, next) => {
    try {
      if (!referenceUploadPath) throw new PublicError(503, "Reference photo storage is not configured.");
      const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
      const reference = await dbGet(db, `SELECT order_reference_images.storage_key
        FROM order_reference_images JOIN orders ON orders.id = order_reference_images.order_id
        WHERE orders.order_number = ? AND order_reference_images.status = 'STORED'
        ORDER BY order_reference_images.id DESC LIMIT 1`, [orderNumber]);
      if (!reference?.storage_key) throw new PublicError(404, "Reference photo was not found.");
      const rootPath = path.resolve(referenceUploadPath);
      const filePath = path.resolve(rootPath, reference.storage_key);
      if (!filePath.startsWith(`${rootPath}${path.sep}`)) throw new PublicError(404, "Reference photo was not found.");
      res.set("Cache-Control", "private, no-store");
      res.type("image/jpeg");
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/orders/:orderNumber/custom-designs", async (req, res, next) => {
    try {
      const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
      const order = await dbGet(db, "SELECT id FROM orders WHERE order_number = ?", [orderNumber]);
      if (!order) throw new PublicError(404, "Order was not found.");
      const items = await new Promise((resolve, reject) => {
        db.all(`SELECT order_items.id, order_items.requested_product_name, order_items.custom_description,
          order_items.colours, order_items.hardware, order_items.personalization_type, order_items.personalization,
          order_design_images.status AS design_image_status, order_design_images.updated_at AS design_image_updated_at,
          EXISTS(SELECT 1 FROM order_reference_images
            WHERE order_reference_images.order_item_id = order_items.id
              AND order_reference_images.status = 'STORED') AS has_customer_reference
          FROM order_items
          LEFT JOIN products ON CAST(products.id AS TEXT) = order_items.product_id
          LEFT JOIN order_design_images ON order_design_images.order_item_id = order_items.id
          WHERE order_items.order_id = ?
            AND (products.slug = 'custom-idea' OR order_items.product_id = '10' OR order_items.design = 'Custom Idea')
          ORDER BY order_items.id ASC`, [order.id], (error, rows) => {
          if (error) reject(error);
          else resolve(rows || []);
        });
      });
      res.json({
        success: true,
        orderNumber,
        items: items.map((item) => ({
          orderItemId: item.id,
          requestedProductName: item.requested_product_name || "Custom Design",
          customDescription: item.custom_description || "",
          colours: item.colours || "",
          hardware: item.hardware || "",
          personalizationType: item.personalization_type || "none",
          personalizationText: item.personalization || "",
          hasCustomerReference: Boolean(item.has_customer_reference),
          hasDesignPicture: item.design_image_status === "STORED",
          designPictureUpdatedAt: item.design_image_updated_at || null
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/orders/:orderNumber/custom-designs/:orderItemId/image", async (req, res, next) => {
    try {
      if (!referenceUploadPath) throw new PublicError(503, "Custom design picture storage is not configured.");
      const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
      const orderItemId = Number.parseInt(req.params.orderItemId, 10);
      if (!Number.isSafeInteger(orderItemId) || orderItemId < 1) throw new PublicError(400, "Order item is invalid.");
      const image = await dbGet(db, `SELECT order_design_images.storage_key
        FROM order_design_images JOIN orders ON orders.id = order_design_images.order_id
        WHERE orders.order_number = ? AND order_design_images.order_item_id = ?
          AND order_design_images.status = 'STORED'`, [orderNumber, orderItemId]);
      if (!image?.storage_key) throw new PublicError(404, "Custom design picture was not found.");
      res.set("Cache-Control", "private, no-store");
      res.type("image/jpeg");
      res.sendFile(resolveStoredImagePath(referenceUploadPath, image.storage_key));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/orders/:orderNumber/custom-designs/:orderItemId/reference-image", async (req, res, next) => {
    try {
      if (!referenceUploadPath) throw new PublicError(503, "Reference photo storage is not configured.");
      const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
      const orderItemId = Number.parseInt(req.params.orderItemId, 10);
      if (!Number.isSafeInteger(orderItemId) || orderItemId < 1) throw new PublicError(400, "Order item is invalid.");
      const image = await dbGet(db, `SELECT order_reference_images.storage_key
        FROM order_reference_images JOIN orders ON orders.id = order_reference_images.order_id
        WHERE orders.order_number = ? AND order_reference_images.order_item_id = ?
          AND order_reference_images.status = 'STORED'`, [orderNumber, orderItemId]);
      if (!image?.storage_key) throw new PublicError(404, "Customer reference photo was not found.");
      res.set("Cache-Control", "private, no-store");
      res.type("image/jpeg");
      res.sendFile(resolveStoredImagePath(referenceUploadPath, image.storage_key));
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/orders/:orderNumber/custom-designs/:orderItemId/image",
    express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "3mb" }),
    async (req, res, next) => {
      let temporaryPath = "";
      let finalPath = "";
      try {
        if (!referenceUploadPath) throw new PublicError(503, "Custom design picture storage is not configured.");
        const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
        const orderItemId = Number.parseInt(req.params.orderItemId, 10);
        if (!Number.isSafeInteger(orderItemId) || orderItemId < 1) throw new PublicError(400, "Order item is invalid.");
        const item = await dbGet(db, `SELECT orders.id AS order_id, order_items.id AS order_item_id,
          order_design_images.storage_key AS previous_storage_key
          FROM orders JOIN order_items ON order_items.order_id = orders.id
          LEFT JOIN products ON CAST(products.id AS TEXT) = order_items.product_id
          LEFT JOIN order_design_images ON order_design_images.order_item_id = order_items.id
          WHERE orders.order_number = ? AND order_items.id = ?
            AND (products.slug = 'custom-idea' OR order_items.product_id = '10' OR order_items.design = 'Custom Idea')`,
        [orderNumber, orderItemId]);
        if (!item) throw new PublicError(404, "Custom design order item was not found.");

        const processed = await processUploadedDesignImage(req.body);
        fs.mkdirSync(referenceUploadPath, { recursive: true });
        const storageKey = `design-${crypto.randomUUID()}.jpg`;
        finalPath = path.join(referenceUploadPath, storageKey);
        temporaryPath = `${finalPath}.tmp`;
        await fs.promises.writeFile(temporaryPath, processed.data, { flag: "wx" });
        await fs.promises.rename(temporaryPath, finalPath);
        temporaryPath = "";

        const now = new Date().toISOString();
        const access = createReferenceUploadToken();
        let originalName = "custom-design.jpg";
        try {
          originalName = decodeURIComponent(req.get("x-file-name") || originalName);
        } catch (error) {
          throw new PublicError(400, "The design picture file name is invalid.");
        }
        originalName = normalizeText(originalName, 120, "File name");
        await dbRun(db, `INSERT INTO order_design_images (
          order_id, order_item_id, created_at, updated_at, status, customer_access_token_hash,
          storage_key, original_filename, mime_type, byte_size, width, height, uploaded_at
        ) VALUES (?, ?, ?, ?, 'STORED', ?, ?, ?, 'image/jpeg', ?, ?, ?, ?)
        ON CONFLICT(order_item_id) DO UPDATE SET
          updated_at = excluded.updated_at, status = 'STORED',
          customer_access_token_hash = excluded.customer_access_token_hash,
          storage_key = excluded.storage_key, original_filename = excluded.original_filename,
          mime_type = excluded.mime_type, byte_size = excluded.byte_size,
          width = excluded.width, height = excluded.height, uploaded_at = excluded.uploaded_at`,
        [item.order_id, item.order_item_id, now, now, access.hash, storageKey, originalName,
          processed.data.length, processed.info.width, processed.info.height, now]);
        await dbRun(db, "INSERT INTO order_events(order_id, created_at, event_type, details) VALUES (?, ?, ?, ?)", [
          item.order_id, now, item.previous_storage_key ? "CUSTOM_DESIGN_IMAGE_REPLACED" : "CUSTOM_DESIGN_IMAGE_ADDED",
          JSON.stringify({ orderItemId })
        ]);
        if (item.previous_storage_key && item.previous_storage_key !== storageKey) {
          const previousPath = resolveStoredImagePath(referenceUploadPath, item.previous_storage_key);
          await fs.promises.unlink(previousPath).catch(() => {});
        }
        finalPath = "";
        const customerPreviewPath = `/api/orders/${encodeURIComponent(orderNumber)}/custom-designs/${orderItemId}/image?token=${encodeURIComponent(access.token)}`;
        res.json({ success: true, orderNumber, orderItemId, designPictureStored: true, customerPreviewPath });
      } catch (error) {
        if (temporaryPath) await fs.promises.unlink(temporaryPath).catch(() => {});
        if (finalPath) await fs.promises.unlink(finalPath).catch(() => {});
        next(error);
      }
    });

  app.post("/api/admin/orders/:orderNumber/custom-designs/:orderItemId/customer-link", async (req, res, next) => {
    try {
      const orderNumber = normalizeText(req.params.orderNumber, 40, "Order number", { required: true });
      const orderItemId = Number.parseInt(req.params.orderItemId, 10);
      if (!Number.isSafeInteger(orderItemId) || orderItemId < 1) throw new PublicError(400, "Order item is invalid.");
      const image = await dbGet(db, `SELECT order_design_images.id
        FROM order_design_images JOIN orders ON orders.id = order_design_images.order_id
        WHERE orders.order_number = ? AND order_design_images.order_item_id = ?
          AND order_design_images.status = 'STORED'`, [orderNumber, orderItemId]);
      if (!image) throw new PublicError(404, "Custom design picture was not found.");
      const access = createReferenceUploadToken();
      await dbRun(db, "UPDATE order_design_images SET customer_access_token_hash = ?, updated_at = ? WHERE id = ?", [
        access.hash, new Date().toISOString(), image.id
      ]);
      const customerPreviewPath = `/api/orders/${encodeURIComponent(orderNumber)}/custom-designs/${orderItemId}/image?token=${encodeURIComponent(access.token)}`;
      res.json({ success: true, orderNumber, orderItemId, customerPreviewPath });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || error.statusCode || 500;
    if (status >= 500) console.error("Server error:", error.message);
    const ownerDesignUpload = req.method === "PUT" && /^\/api\/admin\/orders\/[^/]+\/custom-designs\/\d+\/image$/.test(req.path);
    const publicMessage = error.type === "entity.too.large"
      ? (ownerDesignUpload
        ? "That design picture is too large. Please choose a smaller design picture."
        : "That file is too large. Please choose a smaller reference photo.")
      : (error.publicMessage || "Request could not be completed.");
    res.status(status).json({
      error: error.publicMessage ? publicMessage : (status >= 500 ? "Something went wrong. Please try again later." : publicMessage)
    });
  });

  return app;
}

if (require.main === module) {
  createApp()
    .then((app) => {
      const port = Number(process.env.PORT || 3000);
      const host = isProductionRuntime() ? "0.0.0.0" : "127.0.0.1";
      app.listen(port, host, () => console.log(`Forever Beaded API running on http://${host}:${port}`));
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
