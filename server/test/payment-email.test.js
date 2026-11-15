const test = require("node:test");
const assert = require("node:assert/strict");

const {
  RECOMMENDED_MAILTO_LENGTH,
  buildPaymentConfirmationDraft
} = require("../../js/payment-email");

const parseMailto = (mailtoUrl) => {
  const [address, query = ""] = mailtoUrl.slice("mailto:".length).split("?");
  return { address, params: new URLSearchParams(query) };
};

test("payment confirmation draft is provider-neutral and contains saved order details", () => {
  const draft = buildPaymentConfirmationDraft({
    recipient: "foreverbeaded1@gmail.com",
    orderNumber: "FB-20261107-0042",
    customerName: "Natalie Customer",
    totalCents: 7500,
    currency: "CAD",
    items: [{
      productName: "Apple",
      requestedProductName: "Apple",
      colours: "Turquoise, Green, Gold",
      hardware: "Gold",
      quantity: 2,
      personalizationType: "name",
      personalizationText: "NATALIE",
      lineTotalCents: 7500
    }],
    referenceImageSupplied: true
  });

  assert.equal(draft.recipient, "foreverbeaded1@gmail.com");
  assert.equal(draft.subject, "Forever Beaded Payment Confirmation — FB-20261107-0042");
  assert.match(draft.body, /Customer name: Natalie Customer/);
  assert.match(draft.body, /Forever Beaded order number: FB-20261107-0042/);
  assert.match(draft.body, /Order total: \$75\.00/);
  assert.match(draft.body, /1\. Apple — \$75\.00/);
  assert.match(draft.body, /Colours: Turquoise, Green, Gold/);
  assert.match(draft.body, /Hardware: Gold/);
  assert.match(draft.body, /Quantity: 2/);
  assert.match(draft.body, /Personalization: name: NATALIE/);
  assert.match(draft.body, /reporting that I sent an Interac e-Transfer/);
  assert.match(draft.body, /custom reference photo was supplied/);
  assert.ok(draft.body.includes("\r\n"));
  assert.doesNotMatch(draft.mailtoUrl, /mail\.google\.com|ADMIN_SECRET|token=/i);

  const { address, params } = parseMailto(draft.mailtoUrl);
  assert.equal(address, draft.recipient);
  assert.equal(params.get("subject"), draft.subject);
  assert.equal(params.get("body"), draft.body);
});

test("long payment confirmations remain complete and request copy fallback", () => {
  const items = Array.from({ length: 80 }, (_, index) => ({
    productName: `Treasure ${index + 1}`,
    colours: "Turquoise, Green, Gold, Purple, Cream",
    hardware: index % 2 ? "Silver" : "Gold",
    quantity: 1,
    personalizationType: "name",
    personalizationText: `Customer Name ${index + 1}`,
    lineTotalCents: 2000
  }));
  const draft = buildPaymentConfirmationDraft({
    recipient: "foreverbeaded1@gmail.com",
    orderNumber: "FB-LONG-ORDER",
    customerName: "Long Order Customer",
    totalCents: 160000,
    items
  });

  assert.equal(draft.isLongMailto, true);
  assert.ok(draft.mailtoLength > RECOMMENDED_MAILTO_LENGTH);
  assert.match(draft.body, /1\. Treasure 1/);
  assert.match(draft.body, /80\. Treasure 80/);
  assert.equal(parseMailto(draft.mailtoUrl).params.get("body"), draft.body);
});

test("bracelet payment details do not invent keychain hardware", () => {
  const draft = buildPaymentConfirmationDraft({
    recipient: "foreverbeaded1@gmail.com",
    orderNumber: "FB-BRACELET-1",
    customerName: "Bracelet Customer",
    totalCents: 2500,
    items: [{
      productName: "Best Friends Forever Bracelet",
      colours: "Pink, Purple, White",
      hardware: "",
      quantity: 1,
      personalizationType: "name",
      personalizationText: "AVA",
      lineTotalCents: 2500
    }]
  });
  assert.match(draft.body, /Best Friends Forever Bracelet/);
  assert.match(draft.body, /Personalization: name: AVA/);
  assert.doesNotMatch(draft.body, /Hardware:/);
});

test("email headers cannot inject additional mailto fields", () => {
  const draft = buildPaymentConfirmationDraft({
    recipient: "owner@example.com\r\nbcc:attacker@example.com",
    orderNumber: "FB-1\r\nBcc: attacker@example.com",
    customerName: "Customer",
    totalCents: 2000
  });

  assert.doesNotMatch(draft.recipient, /[\r\n]/);
  assert.doesNotMatch(draft.subject, /[\r\n]/);
  assert.equal((draft.mailtoUrl.match(/\?/g) || []).length, 1);
  assert.equal((draft.mailtoUrl.match(/&bcc=/gi) || []).length, 0);
});
