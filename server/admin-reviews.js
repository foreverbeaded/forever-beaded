(() => {
  "use strict";

  const accessForm = document.getElementById("accessForm");
  const reminderForm = document.getElementById("reminderForm");
  const reviewList = document.getElementById("reviewList");
  const testimonialList = document.getElementById("testimonialList");
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

  const saveMarketingPermission = async (reviewId, fields, button) => {
    button.disabled = true;
    setStatus("Saving external marketing permission...");
    try {
      const data = await adminFetch(`/api/admin/reviews/${reviewId}/marketing-permission`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionStatus: fields.status.value,
          permissionSource: fields.source.value,
          permissionNote: fields.note.value
        })
      });
      setStatus(`Permission saved as ${data.permissionStatus.toLowerCase().replaceAll("_", " ")}.`);
      await loadEtsyTestimonials();
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      button.disabled = false;
    }
  };

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
    const previousStatus = card.dataset.reviewStatus;
    const buttons = card.querySelectorAll("button");
    buttons.forEach(button => { button.disabled = true; });
    try {
      await adminFetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, moderationNote: note })
      });
      card.remove();
      let message;
      if (previousStatus === "APPROVED" && newStatus === "REJECTED") {
        message = "Review removed from the website and preserved under Rejected.";
      } else {
        message = `Review ${newStatus === "APPROVED" ? "approved" : "rejected"}.`;
      }
      if (!reviewList.children.length) {
        message += ` No ${currentReviewStatus().toLowerCase()} reviews remain.`;
      }
      setStatus(message);
      await loadEtsyTestimonials();
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
      card.dataset.reviewStatus = review.status;
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
      } else if (review.status === "APPROVED") {
        const permission = document.createElement("fieldset");
        permission.className = "permission-panel";
        const legend = document.createElement("legend");
        legend.textContent = "External marketing permission";
        const permissionStatus = document.createElement("select");
        permissionStatus.setAttribute("aria-label", `Marketing permission status for ${review.display_name}`);
        ["NOT_REQUESTED", "REQUESTED", "GRANTED", "DECLINED", "REVOKED"].forEach(value => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value.toLowerCase().replaceAll("_", " ");
          option.selected = value === (review.marketing_permission_status || "NOT_REQUESTED");
          permissionStatus.append(option);
        });
        const permissionSource = document.createElement("select");
        permissionSource.setAttribute("aria-label", `Permission source for ${review.display_name}`);
        [["", "Choose permission source"], ["EMAIL", "Email"], ["WEBSITE_FORM", "Website form"], ["ETSY_MESSAGE", "Etsy Message"], ["WRITTEN_OTHER", "Other written permission"]].forEach(([value, label]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          option.selected = value === (review.marketing_permission_source || "");
          permissionSource.append(option);
        });
        const permissionNote = document.createElement("textarea");
        permissionNote.maxLength = 300;
        permissionNote.placeholder = "Private note, such as the date and where written permission was received";
        permissionNote.setAttribute("aria-label", `Permission note for ${review.display_name}`);
        permissionNote.value = review.marketing_permission_note || "";
        const savePermission = document.createElement("button");
        savePermission.type = "button";
        savePermission.textContent = "Save Permission Record";
        savePermission.addEventListener("click", () => saveMarketingPermission(review.id, {
          status: permissionStatus,
          source: permissionSource,
          note: permissionNote
        }, savePermission));
        permission.append(legend, permissionStatus, permissionSource, permissionNote, savePermission);
        card.append(permission);

        const actions = document.createElement("div");
        actions.className = "review-actions";
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "reject";
        remove.textContent = "Remove from Website";
        remove.setAttribute("aria-label", `Remove ${review.display_name}'s review from the website`);
        remove.addEventListener("click", () => {
          const confirmed = window.confirm(
            "Remove this approved review from the public website? The private review record will be preserved under Rejected."
          );
          if (confirmed) moderateReview(review.id, "REJECTED", "", card);
        });
        actions.append(remove);
        card.append(actions);
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

  const copyTestimonial = async (testimonial) => {
    const copy = `"${testimonial.feedback}"\n\n- ${testimonial.displayName}, Forever Beaded customer feedback — website purchase`;
    try {
      await navigator.clipboard.writeText(copy);
      setStatus("Permission-approved testimonial copied with its website-purchase attribution.");
    } catch {
      setStatus("The testimonial could not be copied. Use the private export instead.", true);
    }
  };

  const resolveExternalAction = async (testimonial, button) => {
    const confirmed = window.confirm(
      "Confirm that the previously exported testimonial was removed or corrected everywhere it was reused. This does not update Etsy automatically."
    );
    if (!confirmed) return;
    button.disabled = true;
    try {
      await adminFetch(`/api/admin/reviews/${testimonial.reviewId}/testimonial-action-resolved`, { method: "POST" });
      setStatus("External testimonial cleanup recorded. No Etsy content was changed automatically.");
      await loadEtsyTestimonials();
    } catch (error) {
      setStatus(error.message, true);
      button.disabled = false;
    }
  };

  const renderEtsyTestimonials = (testimonials) => {
    testimonialList.replaceChildren();
    if (!testimonials.length) {
      const empty = document.createElement("p");
      empty.className = "review-meta";
      empty.textContent = "No website reviews have entered Etsy testimonial preparation.";
      testimonialList.append(empty);
      return;
    }
    testimonials.forEach(testimonial => {
      const card = document.createElement("article");
      card.className = "testimonial-card";
      const heading = document.createElement("h3");
      heading.textContent = testimonial.displayName;
      const product = document.createElement("p");
      product.className = "review-meta";
      product.textContent = testimonial.product;
      const feedback = document.createElement("p");
      feedback.className = "review-text";
      feedback.textContent = testimonial.feedback;
      const states = document.createElement("dl");
      states.className = "testimonial-states";
      [["Website approval", testimonial.websiteStatus], ["External permission", testimonial.permissionStatus], ["Etsy preparation", testimonial.preparationStatus]].forEach(([label, value]) => {
        const term = document.createElement("dt");
        term.textContent = label;
        const detail = document.createElement("dd");
        detail.textContent = value.toLowerCase().replaceAll("_", " ");
        states.append(term, detail);
      });
      card.append(heading, product, feedback, states);

      if (testimonial.actionRequired) {
        const warning = document.createElement("p");
        warning.className = "testimonial-warning";
        warning.textContent = testimonial.actionReason;
        const resolved = document.createElement("button");
        resolved.type = "button";
        resolved.className = "reject";
        resolved.textContent = "Mark External Cleanup Complete";
        resolved.addEventListener("click", () => resolveExternalAction(testimonial, resolved));
        card.append(warning, resolved);
      } else if (["READY", "EXPORTED"].includes(testimonial.preparationStatus)) {
        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "secondary";
        copy.textContent = "Copy Permitted Testimonial";
        copy.addEventListener("click", () => copyTestimonial(testimonial));
        card.append(copy);
      }
      testimonialList.append(card);
    });
  };

  async function loadEtsyTestimonials() {
    if (!document.getElementById("adminSecret").value) return;
    try {
      const data = await adminFetch("/api/admin/reviews/testimonials");
      renderEtsyTestimonials(data.testimonials || []);
    } catch (error) {
      testimonialList.replaceChildren();
      setStatus(error.message, true);
    }
  }

  accessForm.addEventListener("submit", event => {
    event.preventDefault();
    loadReviews();
    loadEtsyTestimonials();
  });

  document.getElementById("reviewStatus").addEventListener("change", () => {
    if (document.getElementById("adminSecret").value) loadReviews();
  });

  document.getElementById("refreshTestimonials").addEventListener("click", loadEtsyTestimonials);

  document.getElementById("exportTestimonials").addEventListener("click", async () => {
    const button = document.getElementById("exportTestimonials");
    button.disabled = true;
    setStatus("Preparing private testimonial export...");
    try {
      const secret = document.getElementById("adminSecret").value;
      const response = await fetch("/api/admin/reviews/testimonials/export", {
        headers: { Authorization: `Bearer ${secret}` }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The testimonial export could not be prepared.");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `forever-beaded-testimonials-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus(`${data.testimonials?.length || 0} permission-approved testimonial${data.testimonials?.length === 1 ? "" : "s"} exported privately.`);
      await loadEtsyTestimonials();
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      button.disabled = false;
    }
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
