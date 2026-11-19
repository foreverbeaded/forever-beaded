const validator = require("validator");

const FULFILLMENT_STATUSES = new Set([
  "NEW",
  "IN_PROGRESS",
  "COMPLETED",
  "SHIPPED",
  "READY_FOR_PICKUP",
  "DELIVERED"
]);
const NOTIFICATION_STATUSES = new Set(["COMPLETED", "SHIPPED", "READY_FOR_PICKUP", "DELIVERED"]);

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) reject(error);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function migrateFulfillmentNotificationSchema(db) {
  const columns = await new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(orders)", [], (error, rows) => error ? reject(error) : resolve(rows || []));
  });
  const names = new Set(columns.map(column => column.name));
  if (!names.has("fulfillment_status")) await dbRun(db, "ALTER TABLE orders ADD COLUMN fulfillment_status TEXT");
  if (!names.has("customer_notifications_suppressed")) {
    await dbRun(db, "ALTER TABLE orders ADD COLUMN customer_notifications_suppressed INTEGER NOT NULL DEFAULT 0");
  }
  await dbRun(db, `CREATE TABLE IF NOT EXISTS fulfillment_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    fulfillment_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','CLAIMED','SENT','FAILED','SUPPRESSED','INELIGIBLE','ATTENTION')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TEXT,
    sent_at TEXT,
    provider_message_id TEXT,
    last_error TEXT,
    UNIQUE(order_id, fulfillment_status),
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
  await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_fulfillment_notifications_order
    ON fulfillment_notifications(order_id, created_at DESC)`);
}

function firstName(name) {
  return String(name || "there").trim().split(/\s+/)[0] || "there";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function productList(order) {
  const names = Array.isArray(order.productNames) ? order.productNames.filter(Boolean) : [];
  return names.length ? names : ["Forever Beaded creation"];
}

function buildFulfillmentNotificationEmail(order, status) {
  if (!NOTIFICATION_STATUSES.has(status)) return null;
  const name = firstName(order.customerName);
  const orderNumber = String(order.orderNumber || "");
  const products = productList(order);
  const productLines = products.map(product => `- ${product}`).join("\n");
  let subject;
  let message;
  if (status === "COMPLETED") {
    subject = "Your Forever Beaded Creation Is Ready! 💕";
    message = `Your handmade creation has been completed with care. It has not been marked as shipped or delivered yet.\n\nOrder ${orderNumber}\n${productLines}`;
  } else if (status === "SHIPPED") {
    subject = "Your Forever Beaded Order Is on Its Way! 💌";
    message = `Your Forever Beaded package for order ${orderNumber} is on its way.`;
    if (order.trackingNumber) message += `\n\nTracking number: ${order.trackingNumber}`;
  } else if (status === "READY_FOR_PICKUP") {
    subject = "Your Forever Beaded Order Is Ready for Pickup! 💕";
    message = `Your Forever Beaded order ${orderNumber} is ready for pickup. Please reply if you need help arranging pickup.`;
  } else {
    subject = "Your Forever Beaded Order Has Been Delivered! 💜";
    message = `Your Forever Beaded order ${orderNumber} has been delivered!\n\nThank you so much for supporting my handmade business. Every creation is made with love and care, and I hope you enjoy yours!`;
  }
  const trackingText = order.trackingUrl
    ? `\n\nFollow your treasure's journey:\n${order.trackingUrl}`
    : "";
  const trackingHtml = order.trackingUrl
    ? `<p style="margin-top:22px"><a href="${escapeHtml(order.trackingUrl)}" style="display:inline-block;padding:12px 18px;background:#7b2f86;color:#fff;text-decoration:none;border-radius:6px">Follow your treasure's journey</a></p>`
    : "";
  const text = `Hi ${name},\n\n${message}${trackingText}\n\nWith love,\nForever Beaded\nhttps://foreverbeaded.ca`;
  const html = `<!doctype html><html><body style="margin:0;background:#fff8fb;color:#241528;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:28px"><h1 style="color:#7b2f86;font-family:Georgia,serif;font-size:26px">Forever Beaded</h1><p>Hi ${escapeHtml(name)},</p>${escapeHtml(message).replaceAll("\n", "<br>")}${trackingHtml}<p style="margin-top:24px">With love,<br><strong>Forever Beaded</strong><br><a href="https://foreverbeaded.ca">foreverbeaded.ca</a></p></div></body></html>`;
  return { subject, text, html };
}

function validTrackingNumber(value) {
  const tracking = String(value || "").trim();
  return !tracking || (tracking.length >= 4 && tracking.length <= 100 && /^[A-Za-z0-9][A-Za-z0-9 .-]*$/.test(tracking));
}

function validCustomerEmail(email) {
  return validator.isEmail(String(email || "").trim());
}

function legacyOrderStatus(status) {
  if (status === "READY_FOR_PICKUP") return "READY";
  if (status === "DELIVERED") return "COMPLETED";
  return status;
}

function effectiveFulfillmentStatus(row) {
  if (row.fulfillment_status) return row.fulfillment_status;
  if (row.order_status === "READY") return "READY_FOR_PICKUP";
  return row.order_status || "NEW";
}

module.exports = {
  FULFILLMENT_STATUSES,
  NOTIFICATION_STATUSES,
  buildFulfillmentNotificationEmail,
  effectiveFulfillmentStatus,
  legacyOrderStatus,
  migrateFulfillmentNotificationSchema,
  validCustomerEmail,
  validTrackingNumber
};
