(() => {
  "use strict";
  const labels = {
    NEW: "New",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Made / Completed",
    SHIPPED: "Shipped",
    READY_FOR_PICKUP: "Ready for Pickup",
    DELIVERED: "Delivered",
    AWAITING_PAYMENT: "Awaiting payment",
    RECEIVED: "Payment received",
    VERIFIED: "Payment verified",
    REFUNDED: "Refunded",
    CANCELLED: "Cancelled"
  };
  const messages = {
    NEW: "Your request has been received and is ready for its handmade journey.",
    IN_PROGRESS: "Your creation is being handmade with love!",
    COMPLETED: "Your treasure has been made with care.",
    SHIPPED: "Your treasure is on its way to you.",
    READY_FOR_PICKUP: "Your treasure is ready for pickup.",
    DELIVERED: "Your treasure journey is complete. Thank you for being part of our story."
  };
  const byId = id => document.getElementById(id);
  const token = location.hash.startsWith("#") ? location.hash.slice(1) : "";
  if (location.hash) history.replaceState(null, "", location.pathname);
  const formatDate = value => new Intl.DateTimeFormat("en-CA", { dateStyle: "long" }).format(new Date(value));
  const routeFor = order => {
    if (order.fulfillmentStatus === "READY_FOR_PICKUP") return ["NEW","IN_PROGRESS","COMPLETED","READY_FOR_PICKUP"];
    return ["NEW","IN_PROGRESS","COMPLETED","SHIPPED","DELIVERED"];
  };
  const render = order => {
    byId("orderNumber").textContent = order.orderNumber;
    byId("orderDate").textContent = formatDate(order.orderDate);
    byId("paymentStatus").textContent = labels[order.paymentStatus] || "Payment update pending";
    byId("fulfillmentStatus").textContent = labels[order.fulfillmentStatus] || "New";
    const route = routeFor(order);
    const current = Math.max(0, route.indexOf(order.fulfillmentStatus));
    byId("timeline").replaceChildren(...route.map((status, index) => {
      const li = document.createElement("li");
      if (index <= current) li.classList.add("done");
      if (index === current) li.classList.add("current");
      const strong = document.createElement("strong");
      strong.textContent = labels[status];
      const span = document.createElement("span");
      span.textContent = messages[status];
      li.append(strong, span);
      return li;
    }));
    if (order.carrier || order.trackingNumber) {
      byId("shippingDetails").hidden = false;
      if (order.carrier) { byId("carrierRow").hidden = false; byId("carrier").textContent = order.carrier; }
      if (order.trackingNumber) { byId("trackingRow").hidden = false; byId("trackingNumber").textContent = order.trackingNumber; }
    }
    if (order.pickupInstructions && order.fulfillmentStatus === "READY_FOR_PICKUP") {
      byId("pickupDetails").hidden = false;
      byId("pickupInstructions").textContent = order.pickupInstructions;
    }
    byId("reviewInvitation").hidden = order.fulfillmentStatus !== "DELIVERED";
    byId("loadingPanel").hidden = true;
    byId("trackingPanel").hidden = false;
    document.title = `${order.orderNumber} | Forever Beaded`;
  };
  fetch("/api/tracking", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store"
  })
    .then(response => response.ok ? response.json() : Promise.reject(new Error("unavailable")))
    .then(result => render(result.order))
    .catch(() => { byId("loadingPanel").hidden = true; byId("errorPanel").hidden = false; });
})();
