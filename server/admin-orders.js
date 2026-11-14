(() => {
  "use strict";

  const accessForm = document.getElementById("accessForm");
  const orderList = document.getElementById("orderList");
  const status = document.getElementById("status");
  const activationNotice = document.getElementById("activationNotice");
  let fulfillmentNotificationsEnabled = false;

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
    REFUNDED: "Refunded",
    NEW: "New",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Made / Completed",
    SHIPPED: "Shipped",
    READY: "Ready for Pickup",
    READY_FOR_PICKUP: "Ready for Pickup",
    DELIVERED: "Delivered"
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

  const changeFulfillmentStatus = async (order, select, trackingInput, button) => {
    const fulfillmentStatus = select.value;
    const notificationMilestone = ["COMPLETED", "SHIPPED", "READY_FOR_PICKUP", "DELIVERED"].includes(fulfillmentStatus);
    const notice = notificationMilestone && fulfillmentNotificationsEnabled
      ? " The eligible customer notification will be prepared and sent after this change."
      : " Customer email notifications are currently disabled, so no email will be sent.";
    if (!window.confirm(`Change ${order.orderNumber} to ${stateLabel(fulfillmentStatus)}? Payment status will remain unchanged.${notice}`)) return;
    button.disabled = true;
    setStatus(`Saving ${stateLabel(fulfillmentStatus)} for ${order.orderNumber}...`);
    try {
      const body = { fulfillmentStatus };
      if (fulfillmentStatus === "SHIPPED") body.trackingNumber = trackingInput.value.trim();
      const result = await adminFetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/fulfillment-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const emailResult = result.notification?.sent
        ? " The email provider accepted the customer update; inbox delivery is not guaranteed."
        : " No customer email was sent.";
      setStatus(`${order.orderNumber} is now ${stateLabel(fulfillmentStatus)}.${emailResult}`);
      await loadOrders();
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  };

  const setCustomerNotificationsSuppressed = async (order, suppressed, button) => {
    if (!window.confirm(`${suppressed ? "Suppress" : "Resume"} progress and delivery notifications for ${order.orderNumber}? Previously sent emails are unchanged.`)) return;
    button.disabled = true;
    try {
      await adminFetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/customer-notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suppressed, reason: suppressed ? "Suppressed by owner" : "" })
      });
      setStatus(`Customer notifications ${suppressed ? "suppressed" : "resumed"} for ${order.orderNumber}.`);
      await loadOrders();
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  };

  const retryFulfillmentNotification = async (order, notification, button) => {
    if (!window.confirm(`Retry the ${stateLabel(notification.fulfillmentStatus)} customer notification for ${order.orderNumber}? Check email history first to avoid a duplicate.`)) return;
    button.disabled = true;
    try {
      const result = await adminFetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/fulfillment-notifications/${encodeURIComponent(notification.fulfillmentStatus)}/retry`, { method: "POST" });
      setStatus(result.sent
        ? "The email provider accepted the customer update. Inbox delivery is not guaranteed."
        : "The provider did not accept the customer update.", !result.sent);
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

  const displayValue = value => {
    if (value === null || value === undefined || value === "") return "Not recorded";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Not recorded";
    if (typeof value === "object") return Object.entries(value)
      .map(([key, detail]) => `${stateLabel(key)}: ${displayValue(detail)}`)
      .join("; ") || "Not recorded";
    return String(value);
  };

  const definitionList = (className, values) => {
    const list = document.createElement("dl");
    list.className = className;
    values.forEach(([term, value, valueClass]) => {
      const wrapper = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = displayValue(value);
      if (valueClass) dd.className = valueClass;
      wrapper.append(dt, dd);
      list.append(wrapper);
    });
    return list;
  };

  const renderOrderDetails = order => {
    const content = document.createDocumentFragment();
    const summaryHeading = document.createElement("h3");
    summaryHeading.textContent = "Customer and delivery";
    const deliveryAddress = order.addressAsEntered || order.shippingAddress || order.normalizedAddress;
    content.append(summaryHeading, definitionList("detail-grid", [
      ["Order number", order.orderNumber],
      ["Order date", formatDate(order.createdAt)],
      ["Last updated", formatDate(order.updatedAt)],
      ["Customer", order.customerName],
      ["Email", order.customerEmail],
      ["Phone", order.customerPhone],
      ["Shipping or pickup method", order.fulfillmentMethod],
      ["Delivery address", deliveryAddress, "multiline"],
      ["Customer notes", order.notes, "multiline"]
    ]));

    const itemsHeading = document.createElement("h3");
    itemsHeading.textContent = `Purchased products (${order.items.length})`;
    const items = document.createElement("div");
    items.className = "detail-items";
    order.items.forEach((item, index) => {
      const article = document.createElement("article");
      article.className = "detail-item";
      const heading = document.createElement("h4");
      heading.textContent = `${index + 1}. ${item.productName}`;
      article.append(heading, definitionList("item-grid", [
        ["Product ID", item.productId],
        ["Requested name", item.requestedProductName],
        ["Design", item.design],
        ["Quantity", item.quantity],
        ["Individual price", formatMoney(item.unitPriceCents)],
        ["Line total", formatMoney(item.lineTotalCents)],
        ["Bead colours", item.colours],
        ["Hardware", item.hardware],
        ["Personalization type", item.personalizationType],
        ["Name, letters or personalization", item.personalization],
        ["Personalization instructions", item.customDescription, "multiline"]
      ]));
      items.append(article);
    });
    content.append(itemsHeading, items);

    const totalsHeading = document.createElement("h3");
    totalsHeading.textContent = "Totals and status";
    content.append(totalsHeading, definitionList("detail-grid", [
      ["Subtotal", formatMoney(order.subtotalCents)],
      ["Shipping", formatMoney(order.shippingCents)],
      ["Final total", `${formatMoney(order.totalCents)} ${order.currency || "CAD"}`],
      ["Payment method", stateLabel(order.paymentMethod)],
      ["Payment status", stateLabel(order.paymentStatus)],
      ["Payment confirmed", formatDate(order.paymentConfirmedAt)],
      ["Fulfilment status", stateLabel(order.fulfillmentStatus || order.orderStatus)],
      ["Tracking information", order.trackingNumber],
      ["Customer progress emails", order.customerNotificationsSuppressed ? "Suppressed by owner" : "Allowed when enabled"]
    ]));

    const notificationHeading = document.createElement("h3");
    notificationHeading.textContent = `Customer notification history (${order.fulfillmentNotifications?.length || 0})`;
    const notificationHistory = document.createElement("ol");
    notificationHistory.className = "detail-history";
    if (!order.fulfillmentNotifications?.length) {
      const item = document.createElement("li");
      item.textContent = "No progress or delivery notification attempts are recorded.";
      notificationHistory.append(item);
    } else {
      order.fulfillmentNotifications.forEach(notification => {
        const item = document.createElement("li");
        const heading = document.createElement("strong");
        heading.textContent = `${stateLabel(notification.fulfillmentStatus)} - ${stateLabel(notification.state)}`;
        const details = document.createElement("span");
        details.textContent = notification.sentAt
          ? `${formatDate(notification.sentAt)} | Email provider accepted the message; inbox delivery is not guaranteed.`
          : `${formatDate(notification.lastAttemptAt || notification.createdAt)}${notification.lastError ? ` | ${notification.lastError}` : ""}`;
        item.append(heading, details);
        notificationHistory.append(item);
      });
    }
    content.append(notificationHeading, notificationHistory);

    const historyHeading = document.createElement("h3");
    historyHeading.textContent = `Order and payment history (${order.history.length})`;
    const history = document.createElement("ol");
    history.className = "detail-history";
    if (!order.history.length) {
      const item = document.createElement("li");
      item.textContent = "No saved history events.";
      history.append(item);
    } else {
      order.history.forEach(event => {
        const item = document.createElement("li");
        const eventName = document.createElement("strong");
        eventName.textContent = stateLabel(event.type);
        const eventDetails = document.createElement("span");
        eventDetails.textContent = `${formatDate(event.createdAt)} | ${displayValue(event.details)}`;
        item.append(eventName, eventDetails);
        history.append(item);
      });
    }
    content.append(historyHeading, history);
    return content;
  };

  const toggleOrderDetails = async (order, button, region) => {
    if (region.dataset.loaded === "true") {
      region.hidden = !region.hidden;
      button.setAttribute("aria-expanded", String(!region.hidden));
      button.textContent = region.hidden ? "View Order Details" : "Hide Order Details";
      return;
    }
    button.disabled = true;
    button.textContent = "Loading Order Details...";
    try {
      const data = await adminFetch(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}/details`);
      region.replaceChildren(renderOrderDetails(data.order));
      region.dataset.loaded = "true";
      region.hidden = false;
      button.setAttribute("aria-expanded", "true");
      button.textContent = "Hide Order Details";
    } catch (error) {
      setStatus(error.message, true);
      button.textContent = "View Order Details";
    } finally {
      button.disabled = false;
    }
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
      const customerNotifications = order.fulfillmentNotifications || [];
      const latestCustomerNotification = customerNotifications.find(notification => notification.sentAt) || customerNotifications[0];
      const values = [
        ["Payment", stateLabel(order.paymentStatus)],
        ["Fulfilment", stateLabel(order.fulfillmentStatus || order.orderStatus)],
        ["Payment confirmed", formatDate(order.paymentConfirmedAt)],
        ["Reminder due", reminder ? formatDate(reminder.dueAt) : "Not enrolled (historical or pre-activation)"],
        ["Reminder state", reminder ? stateLabel(reminder.state) : "Not enrolled"],
        ["Reminder sent", reminder?.sentAt ? `${formatDate(reminder.sentAt)} (provider accepted)` : "Not sent"],
        ["Customer progress emails", order.customerNotificationsSuppressed ? "Suppressed" : "Allowed when enabled"],
        ["Latest customer update", latestCustomerNotification
          ? `${stateLabel(latestCustomerNotification.fulfillmentStatus)} - ${stateLabel(latestCustomerNotification.state)}`
          : "No notification recorded"]
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

      const fulfillmentControls = document.createElement("fieldset");
      fulfillmentControls.className = "fulfillment-controls";
      const legend = document.createElement("legend");
      legend.textContent = "Handmade progress";
      const fulfillmentLabel = document.createElement("label");
      fulfillmentLabel.textContent = "Fulfilment status";
      const fulfillmentSelect = document.createElement("select");
      [
        ["NEW", "New"],
        ["IN_PROGRESS", "In Progress"],
        ["COMPLETED", "Made / Completed"],
        ["SHIPPED", "Shipped"],
        ["READY_FOR_PICKUP", "Ready for Pickup"],
        ["DELIVERED", "Delivered"]
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        fulfillmentSelect.append(option);
      });
      const currentFulfillment = order.fulfillmentStatus || (order.orderStatus === "READY" ? "READY_FOR_PICKUP" : order.orderStatus);
      fulfillmentSelect.value = ["NEW", "IN_PROGRESS", "COMPLETED", "SHIPPED", "READY_FOR_PICKUP", "DELIVERED"].includes(currentFulfillment)
        ? currentFulfillment : "NEW";
      const trackingLabel = document.createElement("label");
      trackingLabel.textContent = "Tracking information (optional, used for Shipped only)";
      const trackingInput = document.createElement("input");
      trackingInput.type = "text";
      trackingInput.maxLength = 100;
      trackingInput.value = order.trackingNumber || "";
      trackingInput.placeholder = "Enter tracking number when available";
      const saveProgress = actionButton("Update Progress", "", button => changeFulfillmentStatus(order, fulfillmentSelect, trackingInput, button));
      fulfillmentControls.append(legend, fulfillmentLabel, fulfillmentSelect, trackingLabel, trackingInput, saveProgress);
      card.append(fulfillmentControls);

      if (reminder?.lastError) {
        const error = document.createElement("p");
        error.className = "attention";
        error.textContent = `Reminder attention: ${reminder.lastError}`;
        card.append(error);
      }

      const actions = document.createElement("div");
      actions.className = "actions";
      const detailsRegion = document.createElement("section");
      const detailsId = `order-details-${String(order.orderNumber).replace(/[^A-Za-z0-9_-]/g, "-")}`;
      detailsRegion.id = detailsId;
      detailsRegion.className = "order-details";
      detailsRegion.hidden = true;
      const detailsButton = actionButton("View Order Details", "details-button", button => toggleOrderDetails(order, button, detailsRegion));
      detailsButton.setAttribute("aria-expanded", "false");
      detailsButton.setAttribute("aria-controls", detailsId);
      actions.append(detailsButton);
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
      actions.append(actionButton(
        order.customerNotificationsSuppressed ? "Resume Customer Updates" : "Suppress Customer Updates",
        "secondary",
        button => setCustomerNotificationsSuppressed(order, !order.customerNotificationsSuppressed, button)
      ));
      customerNotifications.filter(notification => ["FAILED", "ATTENTION"].includes(notification.state)).forEach(notification => {
        actions.append(actionButton(`Retry ${stateLabel(notification.fulfillmentStatus)} Email`, "secondary", button => retryFulfillmentNotification(order, notification, button)));
      });
      card.append(actions);
      card.append(detailsRegion);

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
      fulfillmentNotificationsEnabled = data.fulfillmentNotificationsEnabled === true;
      const disabled = [];
      if (!data.reminderFeatureEnabled) disabled.push("Automatic payment reminders");
      if (!fulfillmentNotificationsEnabled) disabled.push("customer progress and delivery emails");
      activationNotice.hidden = disabled.length === 0;
      activationNotice.textContent = disabled.length
        ? `${disabled.join(" and ")} are currently disabled. Status changes remain available, but disabled email features cannot send customer messages until the owner explicitly activates their backend settings.`
        : "";
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
