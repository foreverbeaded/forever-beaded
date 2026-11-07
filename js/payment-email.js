(function attachPaymentEmail(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.FOREVER_BEADED_PAYMENT_EMAIL = api;
})(typeof window !== "undefined" ? window : globalThis, () => {
  const RECOMMENDED_MAILTO_LENGTH = 1800;

  const cleanHeader = (value) => String(value || "").replace(/[\r\n]+/g, " ").trim();
  const formatCents = (cents, currency = "CAD") => new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: cleanHeader(currency) || "CAD"
  }).format(Number(cents || 0) / 100);

  const buildItemLines = (items, currency) => {
    if (!Array.isArray(items) || !items.length) {
      return "Order item details are listed in the Forever Beaded order record.";
    }
    return items.map((item, index) => {
      const design = String(item.productName || item.design || "Treasure").trim();
      const quantity = Math.max(1, Number(item.quantity || 1));
      const lineTotal = formatCents(item.lineTotalCents || item.unitPriceCents || 0, currency);
      const personalization = item.personalizationType && item.personalizationType !== "none"
        ? `${item.personalizationType}: ${item.personalizationText || ""}`
        : "No personalization";
      return [
        `${index + 1}. ${design} — ${lineTotal}`,
        `   Product Name: ${item.requestedProductName || design}`,
        `   Colours: ${item.colours || "Not specified"}`,
        `   Hardware: ${item.hardware || "Not specified"}`,
        `   Quantity: ${quantity}`,
        `   Personalization: ${personalization}`
      ].join("\r\n");
    }).join("\r\n\r\n");
  };

  const buildPaymentConfirmationDraft = ({
    recipient,
    orderNumber,
    customerName,
    totalCents,
    currency = "CAD",
    items = [],
    referenceImageSupplied = false
  }) => {
    const safeRecipient = cleanHeader(recipient);
    const safeOrderNumber = cleanHeader(orderNumber);
    const subject = `Forever Beaded Payment Confirmation — ${safeOrderNumber}`;
    const body = [
      "Hi Forever Beaded,",
      "",
      "I am reporting that I sent an Interac e-Transfer payment for this order.",
      "",
      `Customer name: ${String(customerName || "").trim() || "Not provided"}`,
      `Forever Beaded order number: ${safeOrderNumber}`,
      `Order total: ${formatCents(totalCents, currency)}`,
      "",
      "Purchased products:",
      buildItemLines(items, currency),
      ...(referenceImageSupplied ? ["", "A custom reference photo was supplied with this order."] : []),
      "",
      "Please review this payment confirmation against the saved Forever Beaded order.",
      "",
      "Thank you."
    ].join("\r\n");
    const mailtoUrl = `mailto:${encodeURI(safeRecipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return Object.freeze({
      recipient: safeRecipient,
      subject,
      body,
      mailtoUrl,
      isLongMailto: mailtoUrl.length > RECOMMENDED_MAILTO_LENGTH,
      mailtoLength: mailtoUrl.length
    });
  };

  return Object.freeze({
    RECOMMENDED_MAILTO_LENGTH,
    buildPaymentConfirmationDraft
  });
});
