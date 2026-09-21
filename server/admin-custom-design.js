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

  const prepareDesignPicture = async (file) => {
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(file.type)) {
      throw new Error("Please choose a JPEG, PNG or WebP design picture. If your iPhone photo is HEIC, export or share it as JPEG first.");
    }
    if (file.size > 12 * 1024 * 1024) {
      throw new Error("That design picture is too large. Please choose a picture smaller than 12 MB.");
    }

    let source;
    let sourceUrl = "";
    try {
      if (typeof createImageBitmap === "function") {
        source = await createImageBitmap(file, { imageOrientation: "from-image" });
      } else {
        sourceUrl = URL.createObjectURL(file);
        source = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error("That design picture could not be read. Please choose another image."));
          image.src = sourceUrl;
        });
      }

      const width = source.width || source.naturalWidth;
      const height = source.height || source.naturalHeight;
      if (!width || !height || width * height > 25000000) {
        throw new Error("That design picture is too large to process safely. Please choose a smaller image.");
      }
      const scale = Math.min(1, 1600 / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("This browser could not prepare the design picture. Please try another browser or image.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .84));
      if (!blob || blob.size > 3 * 1024 * 1024) {
        throw new Error("That design picture could not be compressed enough. Please choose a smaller image.");
      }
      return blob;
    } finally {
      if (typeof source?.close === "function") source.close();
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    }
  };

  const displayProtectedImage = (image, blob, errorMessage) => new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    image.onload = () => {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      resolve();
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      image.hidden = true;
      reject(new Error(errorMessage));
    };
    image.src = objectUrl;
    image.hidden = false;
  });

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
    const { response } = await adminFetch(`/api/admin/orders/${encodeURIComponent(currentOrderNumber)}/custom-designs/${itemId}/image`);
    const blob = await response.blob();
    await displayProtectedImage(image, blob, "The saved Forever Beaded design picture could not be displayed.");
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
      const itemStatus = document.createElement("p");
      itemStatus.className = "item-status";
      itemStatus.setAttribute("role", "status");
      itemStatus.setAttribute("aria-live", "polite");
      const setItemStatus = (message, isError = false) => {
        itemStatus.textContent = message;
        itemStatus.classList.toggle("error", isError);
      };

      input.addEventListener("change", () => {
        const file = input.files?.[0];
        setItemStatus(file ? `${file.name} selected and ready to prepare.` : "");
      });

      upload.addEventListener("click", async () => {
        const file = input.files?.[0];
        if (!file) return setItemStatus("Choose a JPEG, PNG or WebP design picture first.", true);
        upload.disabled = true;
        setItemStatus("Preparing the proposed design picture...");
        try {
          const preparedImage = await prepareDesignPicture(file);
          setItemStatus("Uploading the proposed design picture...");
          const { data } = await adminFetch(`/api/admin/orders/${encodeURIComponent(currentOrderNumber)}/custom-designs/${item.orderItemId}/image`, {
            method: "PUT",
            headers: { "Content-Type": "image/jpeg", "X-File-Name": encodeURIComponent(file.name) },
            body: preparedImage
          });
          upload.textContent = "Replace Design Picture";
          linkButton.disabled = false;
          customerLink.hidden = false;
          showCustomerLink(customerLink, data.customerPreviewPath);
          setItemStatus("Design picture saved. Loading the protected preview...");
          await loadOwnerPreview(preview, item.orderItemId);
          setItemStatus("Forever Beaded design picture saved and displayed for this order.");
        } catch (error) {
          setItemStatus(error.message, true);
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
          customerReference.onload = () => {
            setStatus("Customer reference photo displayed separately below.");
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
          };
          customerReference.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            customerReference.hidden = true;
            setStatus("The protected customer reference photo could not be displayed.", true);
          };
          customerReference.src = objectUrl;
          customerReference.hidden = false;
        } catch (error) {
          setStatus(error.message, true);
        } finally {
          referenceButton.disabled = false;
        }
      });

      actions.append(upload, linkButton, referenceButton);
      card.append(title, meta, preview, customerReference, input, actions, itemStatus, customerLink);
      itemsRoot.append(card);
      if (item.hasDesignPicture) {
        loadOwnerPreview(preview, item.orderItemId).catch((error) => setItemStatus(error.message, true));
      }
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
