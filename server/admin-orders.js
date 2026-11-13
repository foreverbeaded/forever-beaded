(() => {
  "use strict";

  const accessForm = document.getElementById("accessForm");
  const orderList = document.getElementById("orderList");
  const status = document.getElementById("status");
  const activationNotice = document.getElementById("activationNotice");

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("error", isError);
  };

  const adminFetch = async (url, options = {}) => {
    const secret = document.getElementById("adminSecret").value;
    const response = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${secret}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "The owner request could not be completed.");
    return data;
  };

  const formatMoney = cents => new Intl.NumberFormat("en-CA", {
    style: "currency", currency: "CAD"
  }).format(Number(cents || 0) / 100);
  const formatDate = value => value ? new Date(value).toLocaleString() : "Not recorded";
  const stateLabel = value => ({
    AWAITING_PAYMENT: "Awaiting Payment",
    VERIFIED: "Paid",
    CANCELLED: "Cancelled",
    RECEIVED: "Received, not verified",
    REFUNDED: "Refunded"
  }[value] || String(value || "Unknown").replaceAll("_", " "));

  const changePaymentStatus = async (order, paymentStatus, button) => {
    const label = stateLabel(paymentStatus);
    const message = paymentStatus === "VERIFIED"
      ? `Confirm that you independently checked RBC and matched payment to ${order.orderNumber}. Mark this order Paid?`
      : `Change ${order.orderNumber} to ${label}? Fulfilment status will remain unchanged.`;
    if (!window.confirm(message)) return;
    button.disabled = true;
    setStatus(`Saving ${label} for ${order.orderNumber}...`);
    try {
      await adminFetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/payment-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus })
      });
      setStatus(`${order.orderNumber} is now ${label}.`);
      await loadOrders();
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  };

  const setSuppressed = async (order, suppressed, button) => {
    const message = suppressed
      ? `Put the automatic payment reminder for ${order.orderNumber} on hold?`
      : `Resume the automatic payment reminder for ${order.orderNumber}?`;
    if (!window.confirm(message)) return;
    button.disabled = true;
    try {
      await adminFetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/payment-reminder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suppressed, reason: suppressed ? "Held by owner" : "" })
      });
      setStatus(`Reminder ${suppressed ? "held" : "resumed"} for ${order.orderNumber}.`);
      await loadOrders();
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  };

  const retryReminder = async (order, button) => {
    const uncertain = order.reminder?.state === "ATTENTION";
    const warning = uncertain
      ? "The previous process stopped while provider acceptance was uncertain. Check the email provider before retrying to avoid a duplicate. Continue?"
      : `Retry the failed payment reminder for ${order.orderNumber}?`;
    if (!window.confirm(warning)) return;
    button.disabled = true;
    setStatus(`Retrying reminder for ${order.orderNumber}...`);
    try {
      const result = await adminFetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/payment-reminder/retry`, { method: "POST" });
      setStatus(result.sent
        ? "The email provider accepted the reminder. Inbox delivery is not guaranteed."
        : "The provider did not accept the reminder. It remains available for review.", !result.sent);
      await loadOrders();
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  };

  const actionButton = (label, className, handler) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener("click", () => handler(button));
    return button;
  };

  const renderOrders = orders => {
    orderList.replaceChildren();
    if (!orders.length) return setStatus("No orders match this payment status.");
    setStatus(`${orders.length} private order${orders.length === 1 ? "" : "s"} loaded.`);
    orders.forEach(order => {
      const card = document.createElement("article");
      card.className = "order-card";
      const heading = document.createElement("div");
      heading.className = "order-heading";
      const title = document.createElement("h2");
      title.textContent = order.orderNumber;
      const amount = document.createElement("span");
      amount.className = "amount";
      amount.textContent = `${formatMoney(order.totalCents)} CAD`;
      heading.append(title, amount);

      const customer = document.createElement("p");
      customer.className = "order-meta";
      customer.textContent = `${order.customerName} | ${order.customerEmail} | ordered ${formatDate(order.createdAt)}`;

      const states = document.createElement("dl");
      states.className = "state-grid";
      const reminder = order.reminder;
      const values = [
        ["Payment", stateLabel(order.paymentStatus)],
        ["Fulfilment", stateLabel(order.orderStatus)],
        ["Payment confirmed", formatDate(order.paymentConfirmedAt)],
        ["Reminder due", reminder ? formatDate(reminder.dueAt) : "Not enrolled (historical or pre-activation)"],
        ["Reminder state", reminder ? stateLabel(reminder.state) : "Not enrolled"],
        ["Reminder sent", reminder?.sentAt ? `${formatDate(reminder.sentAt)} (provider accepted)` : "Not sent"]
      ];
      values.forEach(([term, value]) => {
        const wrapper = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = term;
        dd.textContent = value;
        wrapper.append(dt, dd);
        states.append(wrapper);
      });
      card.append(heading, customer, states);

      if (reminder?.lastError) {
        const error = document.createElement("p");
        error.className = "attention";
        error.textContent = `Reminder attention: ${reminder.lastError}`;
        card.append(error);
      }

      const actions = document.createElement("div");
      actions.className = "actions";
      if (order.paymentStatus !== "VERIFIED") actions.append(actionButton("Mark Paid", "", button => changePaymentStatus(order, "VERIFIED", button)));
      if (order.paymentStatus !== "AWAITING_PAYMENT") actions.append(actionButton("Mark Awaiting Payment", "secondary", button => changePaymentStatus(order, "AWAITING_PAYMENT", button)));
      if (order.paymentStatus !== "CANCELLED") actions.append(actionButton("Mark Cancelled", "danger", button => changePaymentStatus(order, "CANCELLED", button)));
      if (reminder && !reminder.sentAt && order.paymentStatus === "AWAITING_PAYMENT") {
        if (reminder.state === "SUPPRESSED") actions.append(actionButton("Resume Reminder", "secondary", button => setSuppressed(order, false, button)));
        else actions.append(actionButton("Hold Reminder", "secondary", button => setSuppressed(order, true, button)));
      }
      if (reminder && ["FAILED", "ATTENTION"].includes(reminder.state) && order.paymentStatus === "AWAITING_PAYMENT") {
        actions.append(actionButton("Retry Reminder", "secondary", button => retryReminder(order, button)));
      }
      card.append(actions);

      if (order.history?.length) {
        const history = document.createElement("details");
        history.className = "history";
        const summary = document.createElement("summary");
        summary.textContent = `Payment and reminder history (${order.history.length})`;
        const list = document.createElement("ul");
        order.history.forEach(event => {
          const item = document.createElement("li");
          item.textContent = `${formatDate(event.createdAt)} - ${stateLabel(event.type)}`;
          list.append(item);
        });
        history.append(summary, list);
        card.append(history);
      }
      orderList.append(card);
    });
  };

  async function loadOrders() {
    orderList.replaceChildren();
    setStatus("Loading private payment orders...");
    try {
      const paymentStatus = document.getElementById("paymentStatusFilter").value;
      const data = await adminFetch(`/api/admin/payment-orders?paymentStatus=${encodeURIComponent(paymentStatus)}`);
      activationNotice.hidden = data.reminderFeatureEnabled;
      activationNotice.textContent = data.reminderFeatureEnabled
        ? ""
        : "Automatic reminders are currently disabled. Orders remain safe and no reminder emails can be sent until the owner explicitly activates the backend setting.";
      renderOrders(data.orders || []);
    } catch (error) {
      activationNotice.hidden = true;
      setStatus(error.message, true);
    }
  }

  accessForm.addEventListener("submit", event => {
    event.preventDefault();
    loadOrders();
  });
  document.getElementById("paymentStatusFilter").addEventListener("change", () => {
    if (document.getElementById("adminSecret").value) loadOrders();
  });
})();
