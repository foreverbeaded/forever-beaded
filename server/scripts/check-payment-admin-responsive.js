const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createApp, dbRun } = require("../server");

const widths = [320, 375, 390, 393, 414, 430, 768, 1024, 1366];
const edge = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
].find(fs.existsSync);
if (!edge) throw new Error("Microsoft Edge was not found.");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-payment-admin-audit-"));
const databasePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "forever-beaded-payment-admin-db-")), "orders.db");
const debugPort = 9341;
let browser;
let server;
let app;

const connect = websocketUrl => new Promise((resolve, reject) => {
  const socket = new WebSocket(websocketUrl);
  const pending = new Map();
  let id = 0;
  socket.addEventListener("open", () => resolve({
    send(method, params = {}) {
      const requestId = ++id;
      socket.send(JSON.stringify({ id: requestId, method, params }));
      return new Promise((requestResolve, requestReject) => pending.set(requestId, { requestResolve, requestReject }));
    },
    close: () => socket.close()
  }));
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const callbacks = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callbacks.requestReject(new Error(message.error.message));
    else callbacks.requestResolve(message.result);
  });
  socket.addEventListener("error", reject);
});

async function waitForDebugger() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error("Timed out waiting for the headless browser.");
}

(async () => {
  app = await createApp({
    databasePath,
    referenceUploadPath: null,
    allowedOrigins: "http://127.0.0.1",
    adminSecret: "responsive-admin-secret",
    paymentRemindersEnabled: false,
    paymentReminderSchedulerSecret: "responsive-scheduler-secret",
    fulfillmentNotificationsEnabled: false,
    emailSender: async () => ({ emailSent: true, messageId: "owner-test" }),
    reviewNotificationSender: async () => ({ emailSent: true, messageId: "review-test" }),
    paymentReminderEmailSender: async () => ({ emailSent: true, messageId: "reminder-test" })
  });
  server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const orderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1" },
    body: JSON.stringify({
      customer: { name: "Responsive Customer With A Longer Name", email: "responsive@example.com", phone: "604-555-1212" },
      shipping: {
        address: "123 Bead Lane",
        street: "123 Bead Lane",
        city: "Vancouver",
        province: "BC",
        postalCode: "V6B 1A1",
        country: "Canada",
        addressAsEntered: "123 Bead Lane\nVancouver, BC V6B 1A1\nCanada"
      },
      notes: "Please leave the package at the side door after delivery.",
      items: [{ productId: 1, quantity: 2, colours: "Purple, Cream, Gold", hardware: "Gold" }]
    })
  });
  if (!orderResponse.ok) throw new Error(`Could not seed responsive order: ${orderResponse.status} ${await orderResponse.text()}`);
  const seededOrder = await orderResponse.json();

  browser = spawn(edge, [
    "--headless", "--disable-gpu", "--no-first-run",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ], { stdio: "ignore" });
  await waitForDebugger();
  const pageResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, { method: "PUT" });
  const page = await pageResponse.json();
  const cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  const results = [];
  for (const [index, width] of widths.entries()) {
    const paymentState = ["AWAITING_PAYMENT", "VERIFIED", "CANCELLED"][index % 3];
    await dbRun(app.locals.db, "UPDATE orders SET payment_status = ?, payment_confirmed_at = ? WHERE order_number = ?", [
      paymentState,
      paymentState === "VERIFIED" ? new Date().toISOString() : null,
      seededOrder.orderNumber
    ]);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width <= 430 });
    await cdp.send("Page.navigate", { url: `${baseUrl}/admin/orders` });
    await sleep(250);
    const evaluation = await cdp.send("Runtime.evaluate", {
      expression: `(async () => {
        for (let i = 0; i < 40 && !document.getElementById('adminSecret'); i += 1) await new Promise(r => setTimeout(r, 50));
        document.getElementById('adminSecret').value = 'responsive-admin-secret';
        document.getElementById('paymentStatusFilter').value = 'ALL';
        document.getElementById('accessForm').requestSubmit();
        for (let i = 0; i < 40 && document.querySelectorAll('.order-card').length !== 1; i += 1) await new Promise(r => setTimeout(r, 50));
        const detailsButton = document.querySelector('.details-button');
        detailsButton?.click();
        for (let i = 0; i < 40 && !document.querySelector('.order-details:not([hidden])'); i += 1) await new Promise(r => setTimeout(r, 50));
        const details = document.querySelector('.order-details:not([hidden])');
        return {
          width: ${width},
          paymentState: '${paymentState}',
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          cardCount: document.querySelectorAll('.order-card').length,
          visibleButtons: [...document.querySelectorAll('.order-card button')].filter(button => button.offsetParent !== null).length,
          dueDateVisible: document.body.textContent.includes('Reminder due'),
          detailsVisible: Boolean(details),
          detailItemCount: details?.querySelectorAll('.detail-item').length || 0,
          detailsContainSavedFields: Boolean(details?.textContent.includes('Responsive Customer With A Longer Name') && details?.textContent.includes('Purple, Cream, Gold') && details?.textContent.includes('side door')),
          progressControlsVisible: Boolean(document.querySelector('.fulfillment-controls select')?.offsetParent && document.querySelector('.fulfillment-controls input')?.offsetParent),
          progressOptions: document.querySelectorAll('.fulfillment-controls select option').length,
          secretVisible: document.body.textContent.includes('responsive-admin-secret')
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    results.push(evaluation.result.value);
  }
  cdp.close();
  console.log(JSON.stringify(results, null, 2));
  if (results.some(result => result.horizontalOverflow || result.cardCount !== 1 || result.visibleButtons < 3 || !result.dueDateVisible || !result.detailsVisible || result.detailItemCount !== 1 || !result.detailsContainSavedFields || !result.progressControlsVisible || result.progressOptions !== 6 || result.secretVisible)) {
    process.exitCode = 1;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) browser.kill();
  if (server) await new Promise(resolve => server.close(resolve));
  if (app?.locals?.db) await new Promise(resolve => app.locals.db.close(resolve));
  await sleep(300);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  try { fs.rmSync(path.dirname(databasePath), { recursive: true, force: true }); } catch {}
});
