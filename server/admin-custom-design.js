(() => {
  "use strict";

  const form = document.getElementById("orderLookupForm");
  const status = document.getElementById("status");
  const itemsRoot = document.getElementById("customDesignItems");
  let currentOrderNumber = "";

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
    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await response.json() : null;
    if (!response.ok) throw new Error(data?.error || "The owner request could not be completed.");
    return { response, data };
  };

  const showCustomerLink = (container, previewPath) => {
    const url = new URL(previewPath, window.location.origin).href;
    container.innerHTML = "";
    const label = document.createElement("strong");
    label.textContent = "Secure customer preview link";
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = url;
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "secondary";
    copy.textContent = "Copy customer link";
    copy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(url);
      setStatus("Customer preview link copied.");
    });
    container.append(label, link, copy);
  };

  const loadOwnerPreview = async (image, itemId) => {
    try {
      const { response } = await adminFetch(`/api/admin/orders/${encodeURIComponent(currentOrderNumber)}/custom-designs/${itemId}/image`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      image.onload = () => URL.revokeObjectURL(objectUrl);
      image.src = objectUrl;
      image.hidden = false;
    } catch (error) {
      image.hidden = true;
    }
  };

  const renderItems = (items) => {
    itemsRoot.innerHTML = "";
    if (!items.length) {
      setStatus("This order does not contain a Custom Design item.", true);
      return;
    }
    setStatus(`${items.length} Custom Design item${items.length === 1 ? "" : "s"} found.`);
    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "design-item";
      const title = document.createElement("h2");
      title.textContent = item.requestedProductName || "Custom Design";
      const meta = document.createElement("p");
      meta.className = "item-meta";
      meta.textContent = `${item.customDescription}\nColours: ${item.colours || "Not provided"}\nHardware: ${item.hardware || "Not provided"}\nCustomer reference: ${item.hasCustomerReference ? "Yes" : "No"}`;
      const preview = document.createElement("img");
      preview.className = "preview";
      preview.alt = `${title.textContent} proposed Forever Beaded design`;
      preview.hidden = true;
      const customerReference = document.createElement("img");
      customerReference.className = "preview";
      customerReference.alt = `${title.textContent} customer reference photo`;
      customerReference.hidden = true;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/jpeg,image/png,image/webp";
      input.setAttribute("aria-label", `Choose proposed design picture for ${title.textContent}`);
      const actions = document.createElement("div");
      actions.className = "item-actions";
      const upload = document.createElement("button");
      upload.type = "button";
      upload.textContent = item.hasDesignPicture ? "Replace Design Picture" : "Add Design Picture";
      const linkButton = document.createElement("button");
      linkButton.type = "button";
      linkButton.className = "secondary";
      linkButton.textContent = "Create Customer Link";
      linkButton.disabled = !item.hasDesignPicture;
      const referenceButton = document.createElement("button");
      referenceButton.type = "button";
      referenceButton.className = "secondary";
      referenceButton.textContent = "View Customer Reference";
      referenceButton.hidden = !item.hasCustomerReference;
      const customerLink = document.createElement("div");
      customerLink.className = "customer-link";
      customerLink.hidden = true;

      upload.addEventListener("click", async () => {
        const file = input.files?.[0];
        if (!file) return setStatus("Choose a JPEG, PNG or WebP design picture first.", true);
        upload.disabled = true;
        setStatus("Uploading the proposed design picture...");
        try {
          const { data } = await adminFetch(`/api/admin/orders/${encodeURIComponent(currentOrderNumber)}/custom-designs/${item.orderItemId}/image`, {
            method: "PUT",
            headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) },
            body: file
          });
          await loadOwnerPreview(preview, item.orderItemId);
          upload.textContent = "Replace Design Picture";
          linkButton.disabled = false;
          customerLink.hidden = false;
          showCustomerLink(customerLink, data.customerPreviewPath);
          setStatus("Forever Beaded design picture saved for this order.");
        } catch (error) {
          setStatus(error.message, true);
        } finally {
          upload.disabled = false;
        }
      });

      linkButton.addEventListener("click", async () => {
        linkButton.disabled = true;
        try {
          const { data } = await adminFetch(`/api/admin/orders/${encodeURIComponent(currentOrderNumber)}/custom-designs/${item.orderItemId}/customer-link`, { method: "POST" });
          customerLink.hidden = false;
          showCustomerLink(customerLink, data.customerPreviewPath);
          setStatus("A new secure customer preview link is ready. Older links are no longer valid.");
        } catch (error) {
          setStatus(error.message, true);
        } finally {
          linkButton.disabled = false;
        }
      });

      referenceButton.addEventListener("click", async () => {
        referenceButton.disabled = true;
        try {
          const { response } = await adminFetch(`/api/admin/orders/${encodeURIComponent(currentOrderNumber)}/custom-designs/${item.orderItemId}/reference-image`);
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          customerReference.onload = () => URL.revokeObjectURL(objectUrl);
          customerReference.src = objectUrl;
          customerReference.hidden = false;
          setStatus("Customer reference photo displayed separately below.");
        } catch (error) {
          setStatus(error.message, true);
        } finally {
          referenceButton.disabled = false;
        }
      });

      actions.append(upload, linkButton, referenceButton);
      card.append(title, meta, preview, customerReference, input, actions, customerLink);
      itemsRoot.append(card);
      if (item.hasDesignPicture) loadOwnerPreview(preview, item.orderItemId);
    });
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    currentOrderNumber = document.getElementById("orderNumber").value.trim();
    itemsRoot.innerHTML = "";
    setStatus("Finding the Custom Design order...");
    try {
      const { data } = await adminFetch(`/api/admin/orders/${encodeURIComponent(currentOrderNumber)}/custom-designs`);
      renderItems(data.items || []);
    } catch (error) {
      setStatus(error.message, true);
    }
  });
})();
