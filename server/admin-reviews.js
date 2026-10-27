(() => {
  "use strict";

  const accessForm = document.getElementById("accessForm");
  const reminderForm = document.getElementById("reminderForm");
  const reviewList = document.getElementById("reviewList");
  const status = document.getElementById("status");

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

  const currentReviewStatus = () => document.getElementById("reviewStatus").value;

  const retryNotification = async (reviewId, button, notificationLine) => {
    button.disabled = true;
    setStatus("Retrying owner notification...");
    try {
      await adminFetch(`/api/admin/reviews/${reviewId}/notification`, { method: "POST" });
      notificationLine.textContent = "Owner notification: sent";
      notificationLine.classList.remove("needs-attention");
      button.remove();
      setStatus("Owner notification sent.");
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  };

  const moderateReview = async (reviewId, newStatus, note, card) => {
    const buttons = card.querySelectorAll("button");
    buttons.forEach(button => { button.disabled = true; });
    try {
      await adminFetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, moderationNote: note })
      });
      card.remove();
      setStatus(`Review ${newStatus === "APPROVED" ? "approved" : "rejected"}.`);
      if (!reviewList.children.length) setStatus(`No ${currentReviewStatus().toLowerCase()} reviews.`);
    } catch (error) {
      setStatus(error.message, true);
      buttons.forEach(button => { button.disabled = false; });
    }
  };

  const renderReviews = (reviews) => {
    reviewList.replaceChildren();
    const selectedStatus = currentReviewStatus().toLowerCase();
    if (!reviews.length) return setStatus(`No ${selectedStatus} reviews.`);
    setStatus(`${reviews.length} ${selectedStatus} review${reviews.length === 1 ? "" : "s"}.`);
    reviews.forEach(review => {
      const card = document.createElement("article");
      card.className = "review-card";
      const heading = document.createElement("h2");
      heading.textContent = `${review.display_name} - ${review.stars} star${review.stars === 1 ? "" : "s"}`;
      const meta = document.createElement("p");
      meta.className = "review-meta";
      meta.textContent = `${review.product_name} | ${review.customer_email} | ${new Date(review.created_at).toLocaleString()}`;
      const state = document.createElement("p");
      state.className = "review-state";
      state.textContent = `Status: ${review.status}`;
      const notification = document.createElement("p");
      notification.className = "review-notification";
      notification.textContent = `Owner notification: ${String(review.notification_status || "PENDING").toLowerCase()}`;
      if (review.notification_status === "FAILED") {
        notification.classList.add("needs-attention");
        if (review.notification_error) notification.title = review.notification_error;
      }
      const body = document.createElement("p");
      body.className = "review-text";
      body.textContent = review.review_text;
      card.append(heading, meta, state, notification, body);

      if (review.notification_status !== "SENT") {
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "secondary";
        retry.textContent = "Retry Owner Notification";
        retry.addEventListener("click", () => retryNotification(review.id, retry, notification));
        card.append(retry);
      }

      if (review.status === "PENDING") {
        const note = document.createElement("textarea");
        note.maxLength = 300;
        note.placeholder = "Optional private moderation note";
        note.setAttribute("aria-label", `Moderation note for ${review.display_name}`);
        const actions = document.createElement("div");
        actions.className = "review-actions";
        const approve = document.createElement("button");
        approve.type = "button";
        approve.textContent = "Approve";
        approve.addEventListener("click", () => moderateReview(review.id, "APPROVED", note.value, card));
        const reject = document.createElement("button");
        reject.type = "button";
        reject.className = "reject";
        reject.textContent = "Reject";
        reject.addEventListener("click", () => moderateReview(review.id, "REJECTED", note.value, card));
        actions.append(approve, reject);
        card.append(note, actions);
      }
      reviewList.append(card);
    });
  };

  const loadReviews = async () => {
    reviewList.replaceChildren();
    const selectedStatus = currentReviewStatus();
    setStatus(`Loading ${selectedStatus.toLowerCase()} reviews...`);
    try {
      const data = await adminFetch(`/api/admin/reviews?status=${encodeURIComponent(selectedStatus)}`);
      renderReviews(data.reviews || []);
    } catch (error) {
      setStatus(error.message, true);
    }
  };

  accessForm.addEventListener("submit", event => {
    event.preventDefault();
    loadReviews();
  });

  document.getElementById("reviewStatus").addEventListener("change", () => {
    if (document.getElementById("adminSecret").value) loadReviews();
  });

  reminderForm.addEventListener("submit", async event => {
    event.preventDefault();
    const orderNumber = document.getElementById("orderNumber").value.trim();
    const deliveryConfirmed = document.getElementById("deliveryConfirmed").checked;
    const button = reminderForm.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus("Sending one review invitation...");
    try {
      await adminFetch(`/api/admin/orders/${encodeURIComponent(orderNumber)}/review-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryConfirmed })
      });
      reminderForm.reset();
      setStatus(`Review invitation sent for ${orderNumber}.`);
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
})();
