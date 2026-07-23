(() => {
  const colourNames = {
    amber: "#d9822b",
    black: "#111111",
    blue: "#3478d4",
    bronze: "#9b6a2f",
    brown: "#6b3e26",
    cream: "#f2dfbd",
    gold: "#c99a46",
    green: "#3f8b4b",
    grey: "#8f8f8f",
    gray: "#8f8f8f",
    lavender: "#b77bc0",
    lime: "#9bd34f",
    navy: "#172f5f",
    orange: "#e8791f",
    pearl: "#fff5df",
    peach: "#f4a98b",
    pink: "#d878a4",
    plum: "#5b234f",
    purple: "#8a3f83",
    red: "#c63f35",
    silver: "#c9c8c1",
    teal: "#2b9a91",
    turquoise: "#2bbfc0",
    white: "#fff5df",
    yellow: "#f1c85b",
    burgundy: "#7f1d3a",
    coral: "#ef6f61"
  };

  const saveCategoryJump = (event) => {
    const link = event.target.closest("[data-jump-category]");
    if (!link) return;

    const category = link.getAttribute("data-jump-category");
    if (category) {
      sessionStorage.setItem("foreverBeadedCategory", category);
    }
  };

  const setupExclusiveProductLinks = () => {
    document.querySelectorAll("[data-exclusive-product='macaw']").forEach((element) => {
      element.addEventListener("click", (event) => {
        if (event.target.closest("a")) return;
        window.location.href = "create.html?design=macaw#homeDesignBuilder";
      });
      element.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (event.target.closest("a")) return;
        event.preventDefault();
        window.location.href = "create.html?design=macaw#homeDesignBuilder";
      });
    });
  };

  const setupBackToTop = () => {
    let button = document.getElementById("backToTop");
    if (!button) {
      button = document.createElement("button");
      button.id = "backToTop";
      button.className = "back-to-top";
      button.type = "button";
      document.documentElement.append(button);
    } else if (document.body.classList.contains("storybook-home") || document.body.classList.contains("storybook-page")) {
      document.documentElement.append(button);
    }

    button.textContent = "\u2191 Back to Top";
    button.setAttribute("aria-label", "Back to top");
    Object.assign(button.style, {
      position: "fixed",
      zIndex: "9000",
      display: "inline-grid",
      placeItems: "center",
      minHeight: "44px",
      padding: window.innerWidth < 640 ? "0 13px" : "0 18px",
      border: "1px solid rgba(212, 175, 55, .72)",
      borderRadius: "999px",
      background: "rgba(48, 25, 55, .94)",
      color: "#f8ead0",
      font: "800 .88rem/1 Inter, system-ui, sans-serif",
      letterSpacing: "0",
      fontWeight: "800",
      boxShadow: "0 14px 34px rgba(20, 10, 24, .32)",
      cursor: "pointer",
      right: window.innerWidth < 640 ? "14px" : "20px",
      bottom: window.innerWidth < 640 ? "14px" : "20px"
    });

    const syncPosition = () => {
      button.style.right = window.innerWidth < 640 ? "14px" : "20px";
      button.style.bottom = window.innerWidth < 640 ? "14px" : "20px";
      button.style.padding = window.innerWidth < 640 ? "0 13px" : "0 18px";
    };

    const syncVisibility = () => {
      const visible = window.scrollY > 500;
      button.classList.toggle("show", visible);
      button.style.opacity = visible ? "1" : "0";
      button.style.visibility = visible ? "visible" : "hidden";
      button.style.pointerEvents = visible ? "auto" : "none";
      button.style.transform = visible ? "translateY(0)" : "translateY(12px)";
    };

    button.addEventListener("click", () => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.scrollTo({ top: 0, behavior });
    });
    window.addEventListener("scroll", syncVisibility, { passive: true });
    window.addEventListener("resize", syncPosition, { passive: true });
    syncPosition();
    syncVisibility();
  };

  const normalizeColour = (value, fallbackIndex) => {
    const clean = String(value || "").trim().toLowerCase();
    if (!clean) return ["#8a3f83", "#fff5df", "#c99a46", "#8f8f8f"][fallbackIndex % 4];
    if (/^#[0-9a-f]{3,8}$/i.test(clean)) return clean;
    return colourNames[clean] || "#8f8f8f";
  };

  const parseColours = (value, fallbackColours = ["purple", "cream", "gold"]) => {
    const source = String(value || "").trim() ? value : fallbackColours.join(", ");
    const colours = String(source || "")
      .split(",")
      .map((part, index) => normalizeColour(part, index))
      .filter(Boolean);

    return colours.length ? colours : fallbackColours.map(normalizeColour);
  };

  const titleCase = (value) => String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const normalizeProductRecord = (product) => {
    const imageUrl = product?.imageUrl || product?.referenceImageUrl || product?.previewImageUrl || "";
    const basePrice = Number(product?.basePrice ?? product?.basePriceCents ?? 0);
    return {
      ...product,
      id: product?.id,
      slug: String(product?.slug || "").trim(),
      name: String(product?.name || "").trim(),
      imageUrl,
      referenceImageUrl: product?.referenceImageUrl || imageUrl,
      previewImageUrl: product?.previewImageUrl || imageUrl,
      previewPattern: Array.isArray(product?.previewPattern) ? product.previewPattern : null,
      defaultColours: Array.isArray(product?.defaultColours) ? product.defaultColours : ["purple", "cream", "gold"],
      basePrice,
      basePriceCents: Number(product?.basePriceCents ?? basePrice),
      active: product?.active !== false,
      disabledReason: String(product?.disabledReason || "").trim(),
      photoFocusClass: String(product?.photoFocusClass || "").trim()
    };
  };

  let productCatalogue = (window.FOREVER_BEADED_PRODUCTS || [])
    .map(normalizeProductRecord)
    .filter(product => product && product.slug)
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

  productCatalogue = Array.from(new Map(productCatalogue.map(product => [product.slug, product])).values());

  const isSelectableProduct = (product) => product?.active !== false && Number(product?.basePriceCents || product?.basePrice || 0) > 0;

  let fallbackProduct = productCatalogue.find(product => product.slug === "butterfly" && isSelectableProduct(product))
    || productCatalogue.find(isSelectableProduct)
    || productCatalogue[0]
    || null;

  const getSelectedProduct = () => {
    const designDropdown = document.getElementById("homeTreasureDesign");
    const selectedProduct = productCatalogue.find(product => product.slug === designDropdown?.value) || fallbackProduct;
    return selectedProduct;
  };

  const isCustomProduct = (product) => product?.slug === "custom-idea";

  const setProductImage = (image, frame, product, url, label) => {
    if (!image || !product) return;
    const placeholderTarget = frame || image;
    if (placeholderTarget) {
      placeholderTarget.dataset.placeholder = "";
      placeholderTarget.classList.remove("image-missing");
    }
    if (!url) {
      image.dataset.designPhotoUrl = "";
      image.removeAttribute("src");
      image.hidden = true;
      image.alt = `${product.name} image coming soon`;
      if (placeholderTarget) {
        placeholderTarget.dataset.placeholder = `${product.name} image coming soon`;
        placeholderTarget.classList.add("image-missing");
      }
      return;
    }
    image.dataset.designPhotoUrl = url;
    image.hidden = true;
    image.removeAttribute("src");
    image.onload = () => {
      if (image.dataset.designPhotoUrl === url) {
        image.hidden = false;
      }
    };
    image.onerror = () => {
      if (image.dataset.designPhotoUrl !== url) return;
      image.removeAttribute("src");
      image.hidden = true;
      image.alt = `${product.name} image coming soon`;
      if (placeholderTarget) {
        placeholderTarget.dataset.placeholder = `${product.name} image coming soon`;
        placeholderTarget.classList.add("image-missing");
      }
    };
    image.src = url;
    image.alt = `${product.name} ${label}`;
  };

  const updateProductImages = (product) => {
    const referenceImage = document.getElementById("homeReferenceImage");
    const referenceFrame = referenceImage?.closest(".workspace-photo-primary");
    const selectedPhoto = document.getElementById("homeSelectedProductPhoto");
    const selectedFrame = selectedPhoto?.closest(".home-selected-product-photo");
    if (!product) return;

    const designPhotoUrl = product.referenceImageUrl || product.imageUrl;
    setProductImage(referenceImage, referenceFrame, product, designPhotoUrl, "reference image");
    setProductImage(selectedPhoto, selectedFrame, product, designPhotoUrl, "product photo");

    [referenceFrame, selectedFrame].forEach((frame) => {
      if (!frame) return;
      Array.from(frame.classList)
        .filter(className => className.startsWith("focus-"))
        .forEach(className => frame.classList.remove(className));
      if (product.photoFocusClass) frame.classList.add(product.photoFocusClass);
    });
  };

  const hardwareToneClass = (hardware) => (
    String(hardware || "").trim().toLowerCase() === "silver" ? "silver" : "gold"
  );

  const hardwareMarkup = (hardware) => `
    <span class="preview-hardware preview-hardware-${hardwareToneClass(hardware)}" aria-hidden="true">
      <span class="preview-hardware-ring"></span>
      <span class="preview-hardware-link"></span>
      <span class="preview-hardware-clasp"></span>
    </span>`;

  const currentHardwareValue = () => document.getElementById("homeTreasureHardware")?.value || "Gold";

  const syncHardwarePreviewSample = () => {
    const sample = document.getElementById("homeHardwarePreviewSample");
    const text = document.getElementById("homeHardwarePreviewText");
    const hardware = currentHardwareValue();
    const tone = hardwareToneClass(hardware);
    if (sample) {
      sample.className = `hardware-preview-sample has-${tone}-hardware`;
      sample.innerHTML = hardwareMarkup(hardware);
    }
    if (text) {
      text.textContent = tone === "silver"
        ? "Silver ring and clasp sample"
        : "Gold ring and clasp sample";
    }
  };

  const renderColourSwatches = (preview, colours) => {
    preview.className = "home-preview-beads home-preview-swatches";
    preview.innerHTML = colours.map((colour) => `<span class="preview-colour-swatch" style="--bead:${colour}"></span>`).join("");
  };

  const renderBeadPattern = (preview, product, colours) => {
    const pattern = product?.previewPattern;
    preview.className = "home-preview-beads";
    preview.removeAttribute("data-placeholder");

    if (isCustomProduct(product)) {
      renderColourSwatches(preview, colours);
      return;
    }

    if (!Array.isArray(pattern) || !pattern.length) {
      preview.classList.add("preview-coming-soon");
      preview.innerHTML = `<span>${product?.name || "This design"} colour preview coming soon</span>`;
      return;
    }

    const maxCols = Math.max(...pattern.map(bead => Number(bead.x) || 1));
    const maxRows = Math.max(...pattern.map(bead => Number(bead.y) || 1));
    preview.style.setProperty("--home-preview-cols", maxCols);
    preview.style.setProperty("--home-preview-rows", maxRows);
    preview.innerHTML = pattern.map((bead) => {
      const code = String(bead.c || "a").charAt(0).toLowerCase();
      const colourIndex = Math.max(0, code.charCodeAt(0) - 97);
      const colour = colours[colourIndex % colours.length] || "#8f8f8f";
      const x = Math.max(1, Number(bead.x) || 1);
      const y = Math.max(1, Number(bead.y) || 1);
      return `<span class="preview-bead" style="--bead:${colour};grid-column:${x};grid-row:${y}"></span>`;
    }).join("");
  };

  const populateDesignOptions = () => {
    const select = document.getElementById("homeTreasureDesign");
    if (!select || !productCatalogue.length) return;
    const currentValue = select.value;
    select.innerHTML = productCatalogue.map((product) => {
      const disabled = !isSelectableProduct(product);
      const note = disabled ? ` — ${product.disabledReason || "coming soon"}` : "";
      return `<option value="${product.slug}"${disabled ? " disabled" : ""}>${product.name}${note}</option>`;
    }).join("");
    const currentProduct = productCatalogue.find(product => product.slug === currentValue && isSelectableProduct(product));
    select.value = currentProduct?.slug || fallbackProduct?.slug || productCatalogue.find(isSelectableProduct)?.slug || productCatalogue[0].slug;
  };

  const requestedDesignSlug = () => {
    const params = new URLSearchParams(window.location.search);
    const requested = String(params.get("design") || params.get("product") || "").trim().toLowerCase();
    return productCatalogue.some(product => product.slug === requested && isSelectableProduct(product)) ? requested : "";
  };

  const applyRequestedDesignSelection = () => {
    const requested = requestedDesignSlug();
    const select = document.getElementById("homeTreasureDesign");
    if (!requested || !select || select.value === requested) return false;
    select.value = requested;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  };

  const scrollToRequestedDesign = () => {
    if (!requestedDesignSlug()) return;
    const target = document.getElementById("homeDesignBuilder");
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
      document.getElementById("homeTreasureDesign")?.focus({ preventScroll: true });
    });
  };

  const normalizePersonalizationTextInput = () => {
    const input = document.getElementById("homePersonalizationText");
    if (!input) return "";
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = upper;
      if (document.activeElement === input && start != null && end != null) {
        input.setSelectionRange(start, end);
      }
    }
    return input.value.trim();
  };

  const getPersonalizationState = () => {
    const enabled = document.getElementById("homePersonalizationEnabled")?.value === "yes";
    const type = enabled ? (document.getElementById("homePersonalizationKind")?.value || "name") : "none";
    const text = normalizePersonalizationTextInput();
    if (type === "name") {
      return { type, text, phrase: text ? `personalized for ${text}` : "personalized for" };
    }
    if (type === "initials") {
      return { type, text, phrase: text ? `personalized with ${text}` : "personalized with initials" };
    }
    return { type: "none", text: "", phrase: "no personalization" };
  };

  const syncPersonalizationField = () => {
    const enabledSelect = document.getElementById("homePersonalizationEnabled");
    const kindSelect = document.getElementById("homePersonalizationKind");
    const kindWrap = document.getElementById("homePersonalizationKindWrap");
    const textWrap = document.getElementById("homePersonalizationTextWrap");
    const input = document.getElementById("homePersonalizationText");
    if (!enabledSelect || !kindSelect || !kindWrap || !textWrap || !input) return;

    const enabled = enabledSelect.value === "yes";
    const type = enabled ? (kindSelect.value || "name") : "none";
    kindWrap.hidden = !enabled;
    kindWrap.setAttribute("aria-hidden", enabled ? "false" : "true");
    kindWrap.classList.toggle("is-visible", enabled);
    textWrap.hidden = !enabled;
    textWrap.setAttribute("aria-hidden", enabled ? "false" : "true");
    textWrap.classList.toggle("is-visible", enabled);
    kindSelect.disabled = !enabled;
    input.required = enabled;
    input.maxLength = type === "initials" ? 8 : 40;
    textWrap.firstChild.textContent = type === "initials" ? "Initials to add" : "Name to add";
    input.placeholder = type === "initials" ? "e.g. B.T." : "e.g. Becky";
    if (!enabled) {
      input.value = "";
      kindSelect.value = "name";
      input.setCustomValidity("");
    }
  };

  const validatePersonalization = (report = true) => {
    const input = document.getElementById("homePersonalizationText");
    const state = getPersonalizationState();
    if (!input || state.type === "none") return true;

    let message = "";
    if (!state.text) {
      message = state.type === "initials" ? "Please enter the initials to add." : "Please enter the name to add.";
    } else if (state.type === "initials" && state.text.length > 8) {
      message = "Please keep initials to 8 characters or fewer.";
    }
    input.setCustomValidity(message);
    if (message && report) {
      input.reportValidity();
      setOrderStatus(message, true);
      return false;
    }
    return !message;
  };

  const renderHomeTreasurePreview = () => {
    const preview = document.getElementById("homeTreasurePreview");
    if (!preview) return;

    const product = getSelectedProduct();
    const design = product?.name || "Butterfly";
    const colourInput = document.getElementById("homeTreasureColours")?.value || "Purple, Cream, Gold";
    const hardware = document.getElementById("homeTreasureHardware")?.value || "Gold";
    const quantity = document.getElementById("homeTreasureQuantity")?.value || "1";
    const personalization = getPersonalizationState();
    const customDescription = document.getElementById("homeCustomDescription")?.value.trim() || "";
    const colours = parseColours(colourInput, product?.defaultColours);
    const readableColours = colourInput
      .split(",")
      .map(part => titleCase(part.trim()))
      .filter(Boolean)
      .length
      ? colourInput.split(",").map(part => titleCase(part.trim())).filter(Boolean).join(", ")
      : (product?.defaultColours || ["Custom colours"]).map(titleCase).join(", ");

    const previewTitle = document.getElementById("homeTreasurePreviewTitle");
    const previewMeta = document.getElementById("homeTreasurePreviewMeta");
    const previewDescription = document.getElementById("homeTreasurePreviewDescription");
    const previewPersonalization = document.getElementById("homeTreasurePreviewPersonalization");
    updateProductImages(product);
    renderBeadPattern(preview, product, colours);
    syncHardwarePreviewSample();

    if (previewTitle) {
      previewTitle.textContent = isCustomProduct(product)
        ? "Custom Design Request"
        : `${design} in ${readableColours}`;
    }

    if (previewMeta) {
      if (isCustomProduct(product)) {
        const price = product ? ` Starting at ${formatCents(product.basePrice)}.` : "";
        const personalizationSentence = personalization.phrase === "no personalization"
            ? "No personalization"
            : `${personalization.phrase}${/[.!?]$/.test(personalization.phrase) ? "" : "."}`;
        previewMeta.textContent = `${personalizationSentence}${price}`;
      } else {
        const price = product ? ` Starting at ${formatCents(product.basePrice)}.` : "";
        const personalizationSentence = `${personalization.phrase}${/[.!?]$/.test(personalization.phrase) ? "" : "."}`;
        previewMeta.textContent = `${hardware} hardware, quantity ${quantity || 1}, ${personalizationSentence}${price}`;
      }
    }

    if (previewPersonalization) {
      if (personalization.type === "none" || !personalization.text) {
        previewPersonalization.textContent = "";
        previewPersonalization.hidden = true;
      } else {
        previewPersonalization.textContent = personalization.text;
        previewPersonalization.hidden = false;
      }
    }

    if (previewDescription) {
      if (isCustomProduct(product)) {
        previewDescription.textContent = [
          "Idea:",
          customDescription || "Start typing your custom idea...",
          "",
          "Colours:",
          readableColours,
          "",
          "Hardware:",
          hardware,
          "",
          "Quantity:",
          String(quantity || 1)
        ].join("\n");
        previewDescription.hidden = false;
      } else {
        previewDescription.textContent = "";
        previewDescription.hidden = true;
      }
    }
  };

  const getOrderApiBaseUrl = () => {
    const configured = window.FOREVER_BEADED_API_BASE_URL || "http://127.0.0.1:3000";
    return configured.replace(/^http:\/\/localhost:3000\/?$/i, "http://127.0.0.1:3000");
  };
  const API_BASE_URL = getOrderApiBaseUrl();
  const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(API_BASE_URL);

  const formatCents = (cents, currency = "CAD") => {
    const amount = Number(cents || 0) / 100;
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency
    }).format(amount);
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  const checkoutTrace = (step, details = {}) => {
    console.info(`[checkout] ${step}`, details);
  };

  const provinceAliases = {
    ALBERTA: "AB",
    "BRITISH COLUMBIA": "BC",
    MANITOBA: "MB",
    "NEW BRUNSWICK": "NB",
    "NEWFOUNDLAND AND LABRADOR": "NL",
    "NOVA SCOTIA": "NS",
    "NORTHWEST TERRITORIES": "NT",
    NUNAVUT: "NU",
    ONTARIO: "ON",
    "PRINCE EDWARD ISLAND": "PE",
    QUEBEC: "QC",
    SASKATCHEWAN: "SK",
    YUKON: "YT"
  };

  const postalProvincePrefixes = {
    A: "NL",
    B: "NS",
    C: "PE",
    E: "NB",
    G: "QC",
    H: "QC",
    J: "QC",
    K: "ON",
    L: "ON",
    M: "ON",
    N: "ON",
    P: "ON",
    R: "MB",
    S: "SK",
    T: "AB",
    V: "BC",
    X: "NT",
    Y: "YT"
  };

  let pendingConfirmedAddress = null;
  let pendingOrderForm = null;
  let addressReturnFocus = null;
  let previousBodyOverflow = "";
  let addressConfirmed = false;
  let activeTreasureOrder = null;
  const CART_STORAGE_KEY = "foreverBeadedCart";
  const CART_CHECKOUT_FLAG_KEY = "foreverBeadedCartCheckout";

  const toTitleCase = (value) => value
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase())
    .replace(/\b(PO|P\.O)\b/gi, "PO");

  const normalizeWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const normalizeProvince = (value) => {
    const cleaned = normalizeWhitespace(value).replace(/\./g, "").toUpperCase();
    return provinceAliases[cleaned] || cleaned;
  };

  const normalizeCanadianPostalCode = (value) => {
    const compact = normalizeWhitespace(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(compact)) return "";
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  };

  const looksPlaceholder = (value) => /\b(test|sample|placeholder|unknown|none|n\/a|asdf|qwerty|123 main|fake)\b/i.test(value);
  const malformedPunctuation = (value) => {
    const punctuation = (value.match(/[!@#$%^*_+=<>?{}[\]|\\]/g) || []).length;
    return punctuation > 2 || /([,.;:])\1{2,}/.test(value);
  };

  const getAddressAsEntered = () => ({
    street: document.getElementById("homeShippingAddress")?.value || "",
    city: document.getElementById("homeCity")?.value || "",
    province: document.getElementById("homeProvince")?.value || "",
    postalCode: document.getElementById("homePostalCode")?.value || "",
    country: document.getElementById("homeCountry")?.value || ""
  });

  const validateAndNormalizeAddress = () => {
    const entered = getAddressAsEntered();
    const street = normalizeWhitespace(entered.street);
    const city = normalizeWhitespace(entered.city);
    const province = normalizeProvince(entered.province);
    const postalCode = normalizeCanadianPostalCode(entered.postalCode);
    const country = normalizeWhitespace(entered.country || "Canada");
    const errors = [];

    if (!street) errors.push("Please enter a street address.");
    if (street && !/\d/.test(street)) errors.push("Please include a street number.");
    if (street && !/[A-Za-z]{2,}/.test(street.replace(/\d+/g, ""))) errors.push("Please include a street name.");
    if (!city) errors.push("Please enter a city.");
    if (!province) errors.push("Please enter a province.");
    if (province && !Object.values(provinceAliases).includes(province)) errors.push("Please use a valid Canadian province or territory.");
    if (!postalCode) errors.push("Please enter a valid Canadian postal code, like A1A 1A1.");
    if (country && !/^canada$/i.test(country)) errors.push("This checkout currently validates Canadian shipping addresses only.");
    [street, city, province, entered.postalCode, country].forEach((value) => {
      if (looksPlaceholder(value)) errors.push("Please replace placeholder address text with your real shipping address.");
      if (malformedPunctuation(value)) errors.push("Please remove unusual punctuation from the shipping address.");
    });

    const postalProvince = postalProvincePrefixes[postalCode.charAt(0)];
    if (postalProvince && province && postalProvince !== province) {
      errors.push(`The postal code appears to belong to ${postalProvince}, but the province is ${province}.`);
    }

    const normalized = {
      street: toTitleCase(street),
      city: toTitleCase(city),
      province,
      postalCode,
      country: "Canada"
    };
    const normalizedAddress = `${normalized.street}\n${normalized.city}, ${normalized.province} ${normalized.postalCode}\n${normalized.country}`;
    const addressAsEntered = `${normalizeWhitespace(entered.street)}\n${normalizeWhitespace(entered.city)}, ${normalizeWhitespace(entered.province)} ${normalizeWhitespace(entered.postalCode)}\n${normalizeWhitespace(entered.country || "Canada")}`;

    return {
      valid: errors.length === 0,
      errors: [...new Set(errors)],
      entered,
      normalized,
      normalizedAddress,
      addressAsEntered
    };
  };

  const setOrderStatus = (message, isError = false) => {
    const status = document.getElementById("homeOrderStatus");
    if (!status) return;
    status.textContent = message;
    status.dataset.state = isError ? "error" : "ok";
  };

  const clearOrderStatus = () => {
    const status = document.getElementById("homeOrderStatus");
    if (!status) return;
    status.textContent = "";
    delete status.dataset.state;
  };

  const applySuccessOverlayStyles = (overlay) => {
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "999999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "rgba(20, 10, 24, 0.92)",
      boxSizing: "border-box"
    });
  };

  const applySuccessPanelStyles = (panel) => {
    Object.assign(panel.style, {
      position: "relative",
      zIndex: "1000000",
      display: "block",
      opacity: "1",
      visibility: "visible",
      transform: "none",
      width: "min(720px, 92vw)",
      maxHeight: "88vh",
      overflowY: "auto",
      padding: "32px",
      background: "#301937",
      color: "#fff",
      border: "2px solid #d4af37",
      borderRadius: "20px",
      boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
      boxSizing: "border-box",
      margin: "auto"
    });
  };

  const applySuccessCelebrationLayerStyles = (layer) => {
    Object.assign(layer.style, {
      position: "absolute",
      inset: "0",
      zIndex: "2",
      pointerEvents: "none",
      overflow: "hidden"
    });
  };

  const ensureSuccessCelebrationStyles = () => {
    if (document.getElementById("successCelebrationStyles")) return;
    const style = document.createElement("style");
    style.id = "successCelebrationStyles";
    style.textContent = `
      .success-celebration-layer,
      .success-confetti-layer,
      .success-butterfly-layer {
        pointer-events: none;
      }

      .success-small-business-line {
        animation: successLineGlow 3.8s ease both;
      }

      .success-storybook-line {
        animation: successStoryReveal 4.2s ease .45s both;
      }

      .success-confetti-piece,
      .success-bead-particle,
      .success-butterfly {
        position: absolute;
        pointer-events: none;
        will-change: transform, opacity;
      }

      .success-confetti-piece {
        width: 7px;
        height: 14px;
        border-radius: 999px;
        background: linear-gradient(180deg, #fff1a6, #d4af37 58%, #8d6d1f);
        box-shadow: 0 0 12px rgba(212, 175, 55, .5);
        opacity: 0;
        animation: successConfettiFall var(--duration, 3.9s) ease-out var(--delay, 0s) forwards;
      }

      .success-bead-particle {
        width: var(--size, 8px);
        height: var(--size, 8px);
        border-radius: 999px;
        background: radial-gradient(circle at 35% 30%, #fff8cf, #d4af37 52%, #6f4a18 100%);
        box-shadow: 0 0 14px rgba(212, 175, 55, .6);
        opacity: 0;
        animation: successBeadFloat var(--duration, 4.2s) ease-in-out var(--delay, 0s) forwards;
      }

      .success-butterfly {
        width: var(--size, 74px);
        height: auto;
        filter: sepia(.08) saturate(1.06) contrast(.9) brightness(1.18) drop-shadow(0 8px 14px rgba(54,32,18,.18));
        opacity: 0;
        animation: successButterflyDrift var(--duration, 4.6s) cubic-bezier(.32,.02,.22,1) var(--delay, 0s) forwards;
      }

      @keyframes successLineGlow {
        0% { opacity: 0; transform: translateY(-6px); text-shadow: none; }
        28% { opacity: 1; transform: translateY(0); text-shadow: 0 0 18px rgba(212,175,55,.45); }
        100% { opacity: 1; transform: translateY(0); text-shadow: 0 0 10px rgba(212,175,55,.22); }
      }

      @keyframes successStoryReveal {
        0% { opacity: 0; transform: translateY(8px); }
        100% { opacity: 1; transform: translateY(0); }
      }

      @keyframes successConfettiFall {
        0% { opacity: 0; transform: translate3d(var(--x, 50vw), -12vh, 0) rotate(0deg); }
        12% { opacity: .9; }
        76% { opacity: .86; }
        100% { opacity: 0; transform: translate3d(calc(var(--x, 50vw) + var(--drift, 0px)), 108vh, 0) rotate(var(--spin, 220deg)); }
      }

      @keyframes successBeadFloat {
        0% { opacity: 0; transform: translate3d(var(--x, 50vw), 94vh, 0) scale(.7); }
        16% { opacity: .85; }
        76% { opacity: .78; }
        100% { opacity: 0; transform: translate3d(calc(var(--x, 50vw) + var(--drift, 0px)), 20vh, 0) scale(1.04); }
      }

      @keyframes successButterflyDrift {
        0% { opacity: 0; transform: translate3d(var(--start-x, -12vw), var(--start-y, 72vh), 0) rotate(var(--start-rotate, -10deg)) scale(.82); }
        16% { opacity: .92; }
        68% { opacity: .92; }
        100% { opacity: 0; transform: translate3d(var(--end-x, 112vw), var(--end-y, 26vh), 0) rotate(var(--end-rotate, 12deg)) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        .success-small-business-line,
        .success-storybook-line,
        .success-confetti-piece,
        .success-bead-particle,
        .success-butterfly {
          animation: none !important;
        }
      }
    `;
    document.head.append(style);
  };

  const isSuccessPanelVisible = () => {
    const panel = document.getElementById("successPanel");
    if (!panel) return false;
    const styles = window.getComputedStyle(panel);
    const rect = panel.getBoundingClientRect();
    console.info("Success panel computed CSS:", {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      transform: styles.transform,
      position: styles.position,
      zIndex: styles.zIndex,
      width: rect.width,
      height: rect.height
    });
    return styles.display !== "none"
      && styles.visibility !== "hidden"
      && Number(styles.opacity) > 0
      && rect.width > 0
      && rect.height > 0;
  };

  const createSuccessOverlay = () => {
    checkoutTrace("Creating success modal");
    document.getElementById("successOverlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "successOverlay";
    overlay.setAttribute("role", "presentation");
    applySuccessOverlayStyles(overlay);

    const celebrationLayer = document.createElement("div");
    celebrationLayer.className = "success-celebration-layer";
    celebrationLayer.setAttribute("aria-hidden", "true");
    applySuccessCelebrationLayerStyles(celebrationLayer);

    const confettiLayer = document.createElement("div");
    confettiLayer.className = "success-confetti-layer";
    confettiLayer.setAttribute("aria-hidden", "true");
    applySuccessCelebrationLayerStyles(confettiLayer);

    const butterflyLayer = document.createElement("div");
    butterflyLayer.className = "success-butterfly-layer";
    butterflyLayer.setAttribute("aria-hidden", "true");
    applySuccessCelebrationLayerStyles(butterflyLayer);

    const panel = document.createElement("section");
    panel.id = "successPanel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "orderSuccessTitle");
    panel.tabIndex = -1;
    applySuccessPanelStyles(panel);

    overlay.append(celebrationLayer, confettiLayer, butterflyLayer);
    overlay.append(panel);
    document.body.append(overlay);
    return { overlay, panel, celebrationLayer, confettiLayer, butterflyLayer };
  };

  const playSuccessCelebration = (overlay) => {
    if (!overlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const panel = overlay.querySelector("#successPanel");
    if (!panel || !isSuccessPanelVisible()) return;
    ensureSuccessCelebrationStyles();

    const celebrationLayer = overlay.querySelector(".success-celebration-layer");
    const confettiLayer = overlay.querySelector(".success-confetti-layer");
    const butterflyLayer = overlay.querySelector(".success-butterfly-layer");
    if (!celebrationLayer || !confettiLayer || !butterflyLayer) return;

    const confettiCount = window.innerWidth < 700 ? 18 : 32;
    const beadCount = window.innerWidth < 700 ? 10 : 18;
    const butterflyCount = window.innerWidth < 700 ? 3 : 4;

    for (let index = 0; index < confettiCount; index += 1) {
      const piece = document.createElement("span");
      piece.className = "success-confetti-piece";
      piece.style.setProperty("--x", `${8 + Math.random() * 84}vw`);
      piece.style.setProperty("--drift", `${Math.round(-70 + Math.random() * 140)}px`);
      piece.style.setProperty("--spin", `${Math.round(160 + Math.random() * 340)}deg`);
      piece.style.setProperty("--delay", `${(Math.random() * .75).toFixed(2)}s`);
      piece.style.setProperty("--duration", `${(3.1 + Math.random() * 1.4).toFixed(2)}s`);
      confettiLayer.append(piece);
    }

    for (let index = 0; index < beadCount; index += 1) {
      const bead = document.createElement("span");
      bead.className = "success-bead-particle";
      bead.style.setProperty("--x", `${10 + Math.random() * 80}vw`);
      bead.style.setProperty("--drift", `${Math.round(-48 + Math.random() * 96)}px`);
      bead.style.setProperty("--size", `${Math.round(5 + Math.random() * 7)}px`);
      bead.style.setProperty("--delay", `${(.18 + Math.random() * .85).toFixed(2)}s`);
      bead.style.setProperty("--duration", `${(3.3 + Math.random() * 1.2).toFixed(2)}s`);
      celebrationLayer.append(bead);
    }

    for (let index = 0; index < butterflyCount; index += 1) {
      const butterfly = document.createElement("img");
      butterfly.className = "success-butterfly";
      butterfly.src = "images/monarch-cover-realistic.png";
      butterfly.alt = "";
      butterfly.decoding = "async";
      butterfly.draggable = false;
      const fromLeft = index % 2 === 0;
      butterfly.style.setProperty("--size", `${window.innerWidth < 700 ? 48 + index * 4 : 62 + index * 8}px`);
      butterfly.style.setProperty("--start-x", fromLeft ? "-12vw" : "112vw");
      butterfly.style.setProperty("--end-x", fromLeft ? "112vw" : "-12vw");
      butterfly.style.setProperty("--start-y", `${28 + Math.random() * 48}vh`);
      butterfly.style.setProperty("--end-y", `${18 + Math.random() * 58}vh`);
      butterfly.style.setProperty("--start-rotate", fromLeft ? "-12deg" : "14deg");
      butterfly.style.setProperty("--end-rotate", fromLeft ? "13deg" : "-12deg");
      butterfly.style.setProperty("--delay", `${(.15 + index * .32).toFixed(2)}s`);
      butterfly.style.setProperty("--duration", `${(3.6 + Math.random() * .9).toFixed(2)}s`);
      butterflyLayer.append(butterfly);
    }

    window.setTimeout(() => {
      celebrationLayer.replaceChildren();
      confettiLayer.replaceChildren();
      butterflyLayer.replaceChildren();
    }, 5200);
  };

  const showOrderSuccessScreen = (data) => {
    checkoutTrace("Showing success modal", {
      orderNumber: data.orderNumber || data.orderId || "",
      total: data.total,
      emailSent: data.emailSent === true
    });
    const orderNumber = data.orderNumber || data.orderId || "";
    const etransferEmail = data.etransferEmail || "foreverbeaded1@gmail.com";
    const total = formatCents(data.total, data.currency);
    const customerName = document.getElementById("homeCustomerName")?.value.trim() || "";
    const orderItems = Array.isArray(data.items) ? data.items : [];
    const itemSummaryHtml = orderItems.length ? `
      <div style="margin:18px 0;padding:14px;border:1px solid rgba(212,175,55,.45);border-radius:14px;background:rgba(255,255,255,.06);">
        <h3 style="margin:0 0 10px;color:#d4af37;font-family:'Cormorant Garamond',Georgia,serif;font-size:1.55rem;">Treasures in This Order</h3>
        <ol style="margin:0;padding-left:22px;color:#f8ead0;line-height:1.55;">
          ${orderItems.map((item) => {
            const design = escapeHtml(item.productName || item.design || "Treasure");
            const colours = escapeHtml(item.colours || "Custom colours");
            const hardware = escapeHtml(item.hardware || "Hardware selected");
            const quantity = Number(item.quantity || 1);
            const personalization = item.personalizationType && item.personalizationType !== "none"
              ? `${escapeHtml(item.personalizationType)}: ${escapeHtml(item.personalizationText || "")}`
              : "No personalization";
            const lineTotal = formatCents(item.lineTotalCents || item.unitPriceCents || 0, data.currency);
            const unitPrice = quantity > 1 && item.unitPriceCents ? ` <span style="opacity:.82;">(${formatCents(item.unitPriceCents, data.currency)} each)</span>` : "";
            return `<li style="margin:0 0 10px;"><strong style="color:#fff;">${design}</strong> — ${lineTotal}${unitPrice}<br><span style="font-size:.92rem;">Colours: ${colours}; Hardware: ${hardware}; Quantity: ${quantity}; ${personalization}</span></li>`;
          }).join("")}
        </ol>
      </div>
    ` : "";
    const gmailItemLines = orderItems.length
      ? orderItems.map((item, index) => {
        const design = item.productName || item.design || "Treasure";
        const quantity = Number(item.quantity || 1);
        const lineTotal = formatCents(item.lineTotalCents || item.unitPriceCents || 0, data.currency);
        const personalization = item.personalizationType && item.personalizationType !== "none"
          ? `${item.personalizationType}: ${item.personalizationText || ""}`
          : "No personalization";
        return `${index + 1}. ${design} — ${lineTotal}\n   Colours: ${item.colours || ""}\n   Hardware: ${item.hardware || ""}\n   Quantity: ${quantity}\n   Personalization: ${personalization}`;
      }).join("\n\n")
      : "Order item details are listed in the Forever Beaded order record.";
    const gmailSubject = `Forever Beaded Order ${orderNumber}`;
    const gmailBody = [
      "Hi Forever Beaded,",
      "",
      `I have sent the Interac e-Transfer for order ${orderNumber}.`,
      "",
      `Customer name: ${customerName}`,
      `Order total: ${total}`,
      "",
      "Items:",
      gmailItemLines,
      "",
      "Thank you."
    ].join("\n");
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(etransferEmail)}&su=${encodeURIComponent(gmailSubject)}&body=${encodeURIComponent(gmailBody)}`;
    const mailtoFallback = `mailto:${etransferEmail}?subject=${encodeURIComponent(gmailSubject)}&body=${encodeURIComponent(gmailBody)}`;
    const { overlay, panel } = createSuccessOverlay();

    panel.innerHTML = `
      <p style="margin:0 0 10px;color:#d4af37;font-size:0.78rem;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;">Thank You for Supporting a Small Business</p>
      <p class="success-small-business-line" style="margin:0 0 12px;color:#f8ead0;font-size:.95rem;font-weight:700;">Thank you for supporting a small business.</p>
      <h2 id="orderSuccessTitle" tabindex="-1" style="margin:0 0 16px;color:#fff;font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(2rem,5vw,3.5rem);line-height:1;">Your Treasure Journey Begins</h2>
      <p style="margin:0 0 18px;line-height:1.6;color:#f8ead0;">Thank you for your order! Your handmade treasure has been received successfully.</p>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0;">
        <div style="padding:14px;border:1px solid rgba(212,175,55,.65);border-radius:12px;background:rgba(255,255,255,.08);">
          <span style="display:block;color:#d4af37;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;">Order Number</span>
          <strong id="orderSuccessNumber" style="display:block;margin-top:6px;color:#fff;font-size:1.35rem;overflow-wrap:anywhere;">${orderNumber}</strong>
        </div>
        <div style="padding:14px;border:1px solid rgba(212,175,55,.65);border-radius:12px;background:rgba(255,255,255,.08);">
          <span style="display:block;color:#d4af37;font-size:.75rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;">Order Total</span>
          <strong id="orderSuccessTotal" style="display:block;margin-top:6px;color:#fff;font-size:1.35rem;">${total}</strong>
        </div>
      </div>
      ${itemSummaryHtml}
      <div style="margin:18px 0;padding-top:18px;border-top:1px solid rgba(212,175,55,.45);">
        <h3 style="margin:0 0 10px;color:#d4af37;font-family:'Cormorant Garamond',Georgia,serif;font-size:1.8rem;">Next Chapter</h3>
        <p style="margin:0 0 8px;line-height:1.55;color:#f8ead0;">Please send your Interac e-Transfer to:</p>
        <strong id="orderSuccessEmail" style="display:block;margin:8px 0 12px;padding:10px 12px;border-radius:10px;background:rgba(212,175,55,.16);color:#fff;font-size:1.25rem;overflow-wrap:anywhere;">${etransferEmail}</strong>
        <p style="margin:0 0 8px;line-height:1.55;color:#f8ead0;">Include your Order Number in the e-Transfer message so the payment can be matched correctly.</p>
        <p style="margin:0;line-height:1.55;color:#f8ead0;">We'll begin creating your handmade treasure once payment has been received and verified.</p>
      </div>
      <p class="success-storybook-line" style="margin:18px 0 0;color:#f8ead0;font-family:'Cormorant Garamond',Georgia,serif;font-size:1.25rem;line-height:1.35;font-style:italic;">Every treasured piece begins with a story...<br>Thank you for becoming part of ours.</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:22px;">
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-start;">
          <button id="addAnotherTreasure" type="button" style="min-height:48px;padding:0 18px;border:0;border-radius:999px;background:#d4af37;color:#1f1026;font-weight:900;cursor:pointer;">Add a Friend for My Treasure</button>
          <span style="color:#f8ead0;font-size:.88rem;line-height:1.35;">Because every gecko, butterfly, and little treasure deserves a friend.</span>
        </div>
        <button id="openGmailTransferConfirmation" type="button" style="min-height:48px;padding:0 18px;border:1px solid rgba(212,175,55,.8);border-radius:999px;background:rgba(212,175,55,.16);color:#fff;font-weight:900;cursor:pointer;">Finish and Send Payment Confirmation</button>
        <a href="index.html" style="min-height:48px;display:inline-flex;align-items:center;justify-content:center;padding:0 18px;border:1px solid rgba(212,175,55,.75);border-radius:999px;color:#fff;text-decoration:none;font-weight:900;">Return to the Storybook</a>
      </div>
    `;

    clearOrderStatus();
    document.getElementById("orderSuccessTitle")?.focus({ preventScroll: true });
    const successPanelVisible = isSuccessPanelVisible();
    checkoutTrace("Success modal visibility checked", { visible: successPanelVisible });
    if (successPanelVisible) {
      window.requestAnimationFrame(() => playSuccessCelebration(overlay));
    }
    document.getElementById("openGmailTransferConfirmation")?.addEventListener("click", () => {
      const gmailWindow = window.open(gmailUrl, "_blank", "noopener,noreferrer");
      if (!gmailWindow) {
        window.location.href = mailtoFallback;
      }
    });
    document.getElementById("addAnotherTreasure")?.addEventListener("click", () => {
      const form = document.getElementById("homeDesignBuilder");
      if (form) form.dataset.submitting = "false";
      pendingConfirmedAddress = null;
      addressConfirmed = false;
      hideAddressReview();
      hideOrderSuccessScreen();
      clearOrderStatus();
      const personalizationEnabled = document.getElementById("homePersonalizationEnabled");
      const personalizationKind = document.getElementById("homePersonalizationKind");
      const personalizationText = document.getElementById("homePersonalizationText");
      const design = document.getElementById("homeTreasureDesign");
      const colours = document.getElementById("homeTreasureColours");
      const hardware = document.getElementById("homeTreasureHardware");
      const quantity = document.getElementById("homeTreasureQuantity");
      const customDescription = document.getElementById("homeCustomDescription");

      if (personalizationEnabled) personalizationEnabled.value = "no";
      if (personalizationKind) personalizationKind.value = "name";
      if (personalizationText) personalizationText.value = "";
      if (design) design.value = fallbackProduct?.slug || productCatalogue[0]?.slug || "";
      if (colours) colours.value = "Purple, Cream, Gold";
      if (hardware) hardware.value = "Gold";
      if (quantity) quantity.value = "1";
      if (customDescription) {
        customDescription.value = "";
        customDescription.setCustomValidity("");
      }

      const button = document.getElementById("homeTreasureButton");
      if (button) {
        button.disabled = false;
        button.textContent = "Create My Treasure";
      }
      syncCustomDescriptionField();
      syncPersonalizationField();
      renderHomeTreasurePreview();
      if (activeTreasureOrder?.orderNumber) {
        setOrderStatus(`Add the next treasure for order ${activeTreasureOrder.orderNumber}. It will stay in the same order.`);
      }
      const designField = document.getElementById("homeTreasureDesign");
      const scrollTarget = designField?.closest("label") || document.getElementById("homeDesignBuilder");
      scrollTarget?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
      designField?.focus({ preventScroll: true });
    });
  };

  const hideOrderSuccessScreen = () => {
    const screen = document.getElementById("successOverlay");
    const form = document.getElementById("homeDesignBuilder");
    screen?.remove();
    form?.classList.remove("is-order-complete");
  };

  const showAddressReview = (address) => {
    document.getElementById("addressReviewDialog")?.remove();
    const dialog = document.createElement("section");
    dialog.id = "addressReviewDialog";
    dialog.className = "address-confirmation-overlay address-review-dialog is-visible";
    dialog.setAttribute("aria-labelledby", "addressReviewTitle");
    dialog.setAttribute("aria-live", "polite");
    Object.assign(dialog.style, {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: "rgba(20, 10, 24, 0.72)",
      overflowY: "auto",
      boxSizing: "border-box"
    });
    dialog.style.setProperty("position", "fixed", "important");
    dialog.style.setProperty("inset", "0", "important");
    dialog.style.setProperty("z-index", "99999", "important");
    dialog.style.setProperty("display", "flex", "important");
    dialog.style.setProperty("align-items", "center", "important");
    dialog.style.setProperty("justify-content", "center", "important");
    dialog.style.setProperty("min-height", "100dvh", "important");

    const panel = document.createElement("div");
    panel.className = "address-confirmation-panel address-review-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-describedby", "addressReviewText");
    Object.assign(panel.style, {
      position: "relative",
      margin: "auto",
      width: "min(680px, 94vw)",
      maxHeight: "90vh",
      overflowY: "auto"
    });
    panel.style.setProperty("position", "relative", "important");
    panel.style.setProperty("margin", "auto", "important");
    panel.style.setProperty("width", "min(680px, 94vw)", "important");
    panel.style.setProperty("max-height", "90vh", "important");
    panel.style.setProperty("overflow-y", "auto", "important");
    panel.innerHTML = `
      <p class="order-success-kicker">Shipping Address</p>
      <h2 id="addressReviewTitle" tabindex="-1">Please confirm your shipping address</h2>
      <p id="addressReviewText">This is a local format check, not an official delivery guarantee.</p>
      <address id="addressReviewAddress"></address>
      <div class="address-review-actions">
        <button id="confirmAddressButton" class="gold-button" type="button">Confirm Address</button>
        <button id="editAddressButton" class="glass-button" type="button">Edit Address</button>
      </div>
    `;
    dialog.append(panel);
    document.body.append(dialog);

    checkoutTrace("Showing address confirmation", {
      normalizedAddress: address.normalizedAddress
    });
    pendingConfirmedAddress = address;
    addressReturnFocus = document.activeElement;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.getElementById("addressReviewAddress").textContent = address.normalizedAddress;
    document.getElementById("confirmAddressButton").onclick = handleConfirmedOrderSubmission;
    document.getElementById("editAddressButton").onclick = () => {
      pendingConfirmedAddress = null;
      addressConfirmed = false;
      hideAddressReview({ returnFocus: true });
    };
    window.requestAnimationFrame(() => {
      centerAddressReviewInViewport();
      document.getElementById("addressReviewTitle")?.focus({ preventScroll: true });
    });
  };

  const centerAddressReviewInViewport = () => {
    const panel = document.querySelector("#addressReviewDialog .address-review-panel");
    if (!panel) return;
    panel.style.setProperty("transform", "none", "important");
    const rect = panel.getBoundingClientRect();
    const viewportPadding = 20;
    const desiredTop = Math.max(viewportPadding, (window.innerHeight - rect.height) / 2);
    const deltaY = desiredTop - rect.top;
    if (Math.abs(deltaY) > 1) {
      panel.style.setProperty("transform", `translateY(${Math.round(deltaY)}px)`, "important");
    }
  };

  const hideAddressReview = ({ returnFocus = false } = {}) => {
    document.getElementById("addressReviewDialog")?.remove();
    document.body.style.overflow = previousBodyOverflow;
    if (returnFocus) {
      const focusTarget = addressReturnFocus && typeof addressReturnFocus.focus === "function"
        ? addressReturnFocus
        : document.getElementById("homeShippingAddress");
      focusTarget?.focus();
    }
  };

  async function handleConfirmedOrderSubmission() {
    console.info("CONFIRM ADDRESS CLICKED");
    checkoutTrace("Confirm Address clicked", {
      hasPendingAddress: Boolean(pendingConfirmedAddress)
    });
    if (!pendingConfirmedAddress) return;
    addressConfirmed = true;
    const confirmed = pendingConfirmedAddress;
    const form = pendingOrderForm || document.getElementById("homeDesignBuilder");
    if (!form) {
      console.error("[checkout] Cannot submit order because the Create Yours form was not found.");
      return;
    }
    const confirmButton = document.getElementById("confirmAddressButton");
    if (confirmButton) {
      confirmButton.disabled = true;
      confirmButton.textContent = "Submitting Order...";
    }
    hideAddressReview();
    console.info("ADDRESS MODAL CLOSED");
    checkoutTrace("Address confirmed; calling submitHomeTreasureOrder");
    await submitHomeTreasureOrder(form, confirmed);
  }

  const beginHomeTreasureOrder = (form) => {
    checkoutTrace("Create My Treasure submitted");
    if (form.dataset.submitting === "true") return;
    syncCustomDescriptionField();
    syncPersonalizationField();
    if (!validatePersonalization()) return;
    if (!validateCustomDescription()) return;

    const address = validateAndNormalizeAddress();
    if (!address.valid) {
      checkoutTrace("Address validation failed", { errors: address.errors });
      setOrderStatus(address.errors[0], true);
      const firstField = !normalizeWhitespace(address.entered.street)
        ? "homeShippingAddress"
        : !normalizeWhitespace(address.entered.city)
          ? "homeCity"
          : !normalizeWhitespace(address.entered.province)
            ? "homeProvince"
            : !normalizeCanadianPostalCode(address.entered.postalCode)
              ? "homePostalCode"
              : "homeShippingAddress";
      document.getElementById(firstField)?.focus();
      return;
    }

    clearOrderStatus();
    checkoutTrace("Address validation passed", {
      normalizedAddress: address.normalizedAddress
    });
    pendingOrderForm = form;
    addressConfirmed = false;
    showAddressReview(address);
  };

  const postJson = async (url, payload) => {
    checkoutTrace("POST started", { url });
    if (typeof window.fetch === "function") {
      const response = await window.fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      console.info("API RESPONSE RECEIVED");
      console.info("Order API response received", { status: response.status, success: data.success === true });
      checkoutTrace("POST finished", {
        ok: response.ok,
        status: response.status,
        success: data.success === true,
        orderNumber: data.orderNumber || data.orderId || ""
      });
      return { ok: response.ok, status: response.status, data };
    }

    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", url, true);
      request.setRequestHeader("Content-Type", "application/json");
      request.onload = () => {
        let data = {};
        try {
          data = request.responseText ? JSON.parse(request.responseText) : {};
        } catch (error) {
          data = {};
        }
        console.info("API RESPONSE RECEIVED");
        checkoutTrace("XHR POST finished", {
          ok: request.status >= 200 && request.status < 300,
          status: request.status,
          success: data.success === true,
          orderNumber: data.orderNumber || data.orderId || ""
        });
        console.info("Order API response received", { status: request.status, success: data.success === true });
        resolve({ ok: request.status >= 200 && request.status < 300, status: request.status, data });
      };
      request.onerror = () => reject(new TypeError(`Could not reach ${url}`));
      request.ontimeout = () => reject(new TypeError(`Timed out reaching ${url}`));
      request.timeout = 20000;
      request.send(JSON.stringify(payload));
    });
  };

  const syncCustomDescriptionField = () => {
    const product = getSelectedProduct();
    const wrap = document.getElementById("homeCustomDescriptionWrap");
    const textarea = document.getElementById("homeCustomDescription");
    const count = document.getElementById("homeCustomDescriptionCount");
    if (!wrap || !textarea) return;

    const isCustom = isCustomProduct(product);
    textarea.required = isCustom;
    textarea.disabled = !isCustom;
    wrap.setAttribute("aria-hidden", String(!isCustom));

    if (isCustom) {
      wrap.hidden = false;
      window.requestAnimationFrame(() => wrap.classList.add("is-visible"));
    } else {
      wrap.classList.remove("is-visible");
      textarea.value = "";
      textarea.setCustomValidity("");
      window.setTimeout(() => {
        if (!isCustomProduct(getSelectedProduct())) {
          wrap.hidden = true;
        }
      }, 320);
    }
    if (count) count.textContent = `${textarea.value.length} / 500`;
  };

  const validateCustomDescription = () => {
    const product = getSelectedProduct();
    const textarea = document.getElementById("homeCustomDescription");
    if (!textarea || !isCustomProduct(product)) return true;

    const value = textarea.value.trim();
    let message = "";
    if (!value) {
      message = "Please describe your custom design.";
    } else if (value.length < 10) {
      message = "Please describe your custom design in at least 10 characters.";
    } else if (value.length > 500) {
      message = "Please keep your custom design description under 500 characters.";
    }
    textarea.setCustomValidity(message);
    if (message) {
      textarea.reportValidity();
      setOrderStatus(message, true);
      return false;
    }
    return true;
  };

  const cartCheckoutRequested = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("checkout") === "cart" || sessionStorage.getItem(CART_CHECKOUT_FLAG_KEY) === "true";
  };

  let selectedRequestIndex = -1;

  const legacyCartIdToSlug = {
    1: "macaw",
    2: "natalies-butterfly",
    3: "butterfly",
    5: "flower",
    6: "big-flower",
    7: "deluxe-flower",
    8: "butterfly-with-flowers",
    9: "gecko",
    13: "soccer-ball",
    14: "turtle",
    15: "octopus",
    17: "pencil",
    19: "cross"
  };

  const productBySlug = (slug) => productCatalogue.find(product => product.slug === slug) || null;

  const trustedProductSlugFromCartItem = (item) => {
    if (item?.productId && !/^\d+$/.test(String(item.productId))) return String(item.productId);
    const numericId = String(item?.productId || item?.id || "").split(":")[0];
    if (legacyCartIdToSlug[numericId]) return legacyCartIdToSlug[numericId];
    const name = String(item?.name || item?.description || "").toLowerCase();
    if (name.includes("natalie")) return "natalies-butterfly";
    if (name.includes("macaw")) return "macaw";
    if (name.includes("butterfly") && name.includes("flower")) return "butterfly-with-flowers";
    if (name.includes("big") && name.includes("flower")) return "big-flower";
    if ((name.includes("deluxe") || name.includes("intricated")) && name.includes("flower")) return "deluxe-flower";
    if (name.includes("butterfly")) return "butterfly";
    if (name.includes("gecko")) return "gecko";
    if (name.includes("flower")) return "flower";
    if (name.includes("turtle")) return "turtle";
    if (name.includes("fish")) return "fish";
    if (name.includes("crab")) return "crab";
    if (name.includes("penguin")) return "penguin";
    if (name.includes("octopus")) return "octopus";
    if (name.includes("soccer")) return "soccer-ball";
    if (name.includes("pencil")) return "pencil";
    if (name.includes("cross")) return "cross";
    return "custom-idea";
  };

  const normalizeRequestItem = (item) => {
    const options = item?.options && typeof item.options === "object" ? item.options : {};
    const productId = trustedProductSlugFromCartItem(item);
    const product = productBySlug(productId);
    const personalizationText = String(item?.personalizationText || item?.personalization || options.personalizationText || "").trim();
    const personalizationType = String(item?.personalizationType || options.personalizationType || (personalizationText ? "name" : "none")).trim().toLowerCase();
    const quantity = Math.max(1, Number.parseInt(item?.quantity, 10) || 1);
    const unitPriceCents = Number.isFinite(Number(item?.unitPriceCents))
      ? Math.max(0, Math.round(Number(item.unitPriceCents)))
      : Number.isFinite(Number(item?.price))
        ? Math.max(0, Math.round(Number(item.price) * 100))
        : Math.max(0, Math.round(Number(product?.basePriceCents || product?.basePrice || 0)));
    const design = String(item?.name || product?.name || "Custom Idea").trim();
    const image = String(item?.image || product?.referenceImageUrl || product?.imageUrl || "").trim();
    return {
      productId,
      product,
      design,
      image,
      imageFocusClass: String(item?.imageFocusClass || product?.photoFocusClass || "").trim(),
      colours: String(item?.colours || item?.colors || options.colours || options.colors || "").trim(),
      hardware: String(item?.hardware || item?.keychainType || options.hardware || options.keychainType || "").trim(),
      personalization: personalizationText,
      personalizationType: personalizationType === "initials" || personalizationType === "name" ? personalizationType : "none",
      personalizationText,
      customDescription: String(item?.customDescription || (item?.isCustom ? item?.description : "") || "").trim(),
      quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * quantity
    };
  };

  const loadStoredRequestItems = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeRequestItem).filter(item => item.productId && item.design && item.quantity > 0);
    } catch (error) {
      console.error("[checkout] Could not load cart checkout items", error);
      return [];
    }
  };

  const saveStoredRequestItems = (items) => {
    const normalized = items.map((item) => ({
      productId: item.productId,
      name: item.design,
      price: item.unitPriceCents / 100,
      image: item.image,
      imageFocusClass: item.imageFocusClass,
      quantity: item.quantity,
      options: {
        colours: item.colours,
        hardware: item.hardware,
        personalizationType: item.personalizationType,
        personalizationText: item.personalizationText
      },
      customDescription: item.customDescription,
      availability: "made to order"
    }));
    if (normalized.length) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
      sessionStorage.removeItem(CART_CHECKOUT_FLAG_KEY);
    }
  };

  const checkoutCartItems = () => loadStoredRequestItems().map((item) => ({
    productId: item.productId,
    design: item.design,
    colours: item.colours,
    hardware: item.hardware,
    personalization: item.personalizationText,
    personalizationType: item.personalizationType,
    personalizationText: item.personalizationText,
    customDescription: item.customDescription,
    quantity: item.quantity
  }));

  const renderTreasureRequestSummary = () => {
    const summary = document.getElementById("treasureRequestSummary");
    const itemsWrap = document.getElementById("treasureRequestItems");
    const totals = document.getElementById("treasureRequestTotals");
    if (!summary || !itemsWrap || !totals) return;

    const items = loadStoredRequestItems();
    summary.hidden = items.length === 0;
    if (!items.length) {
      itemsWrap.innerHTML = "";
      totals.textContent = "";
      selectedRequestIndex = -1;
      return;
    }

    if (selectedRequestIndex >= items.length) selectedRequestIndex = items.length - 1;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    itemsWrap.innerHTML = items.map((item, index) => {
      const personalization = item.personalizationType !== "none" && item.personalizationText
        ? `${titleCase(item.personalizationType)}: ${item.personalizationText}`
        : "No personalization";
      const options = [
        item.colours ? `Colours: ${item.colours}` : "",
        item.hardware ? `Hardware: ${item.hardware}` : "",
        personalization
      ].filter(Boolean).join(" | ");
      const thumbClasses = ["treasure-request-thumb", item.imageFocusClass].filter(Boolean).join(" ");
      const thumb = item.image
        ? `<span class="${escapeHtml(thumbClasses)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.design)} photo"></span>`
        : `<span class="treasure-request-thumb image-missing" data-placeholder="${escapeHtml(item.design)} image coming soon"></span>`;
      return `
        <article class="treasure-request-item${index === selectedRequestIndex ? " is-selected" : ""}" data-request-index="${index}">
          ${thumb}
          <div>
            <strong class="treasure-request-name">${escapeHtml(item.design)}</strong>
            <p class="treasure-request-meta">${escapeHtml(options)}</p>
            <p class="treasure-request-price">Unit price: ${formatCents(item.unitPriceCents)} | Line total: ${formatCents(item.lineTotalCents)}</p>
          </div>
          <div class="treasure-request-controls">
            <div class="treasure-request-quantity" aria-label="Quantity controls for ${escapeHtml(item.design)}">
              <button type="button" data-request-action="decrease" data-request-index="${index}" aria-label="Decrease ${escapeHtml(item.design)} quantity">-</button>
              <span>${item.quantity}</span>
              <button type="button" data-request-action="increase" data-request-index="${index}" aria-label="Increase ${escapeHtml(item.design)} quantity">+</button>
            </div>
            <button class="treasure-request-remove" type="button" data-request-action="remove" data-request-index="${index}">Remove</button>
          </div>
        </article>
      `;
    }).join("");
    totals.textContent = `${totalQuantity} item${totalQuantity === 1 ? "" : "s"} in this request | Combined total: ${formatCents(totalCents)}`;
  };

  const applyRequestItemToBuilder = (index) => {
    const items = loadStoredRequestItems();
    const item = items[index];
    if (!item) return;
    selectedRequestIndex = index;
    const product = item.product || productBySlug(item.productId);
    const design = document.getElementById("homeTreasureDesign");
    const colours = document.getElementById("homeTreasureColours");
    const hardware = document.getElementById("homeTreasureHardware");
    const quantity = document.getElementById("homeTreasureQuantity");
    const personalizationEnabled = document.getElementById("homePersonalizationEnabled");
    const personalizationKind = document.getElementById("homePersonalizationKind");
    const personalizationText = document.getElementById("homePersonalizationText");
    const customDescription = document.getElementById("homeCustomDescription");

    if (design && product?.slug) design.value = product.slug;
    if (!product && item.productId) {
      console.warn("[checkout] Missing product catalogue record for request item", item.productId);
    }
    if (colours) colours.value = item.colours || (product?.defaultColours || ["Purple", "Cream", "Gold"]).join(", ");
    if (hardware) hardware.value = item.hardware || "Gold";
    if (quantity) quantity.value = String(item.quantity || 1);
    if (personalizationEnabled) personalizationEnabled.value = item.personalizationType !== "none" && item.personalizationText ? "yes" : "no";
    if (personalizationKind) personalizationKind.value = item.personalizationType === "initials" ? "initials" : "name";
    if (personalizationText) personalizationText.value = item.personalizationText || "";
    if (customDescription) customDescription.value = item.customDescription || "";

    syncCustomDescriptionField();
    syncPersonalizationField();
    renderHomeTreasurePreview();
    if (item.image) {
      const imageProduct = {
        name: item.design,
        photoFocusClass: item.imageFocusClass
      };
      const referenceImage = document.getElementById("homeReferenceImage");
      const referenceFrame = referenceImage?.closest(".workspace-photo-primary");
      const selectedPhoto = document.getElementById("homeSelectedProductPhoto");
      const selectedFrame = selectedPhoto?.closest(".home-selected-product-photo");
      setProductImage(referenceImage, referenceFrame, imageProduct, item.image, "reference image");
      setProductImage(selectedPhoto, selectedFrame, imageProduct, item.image, "product photo");
      [referenceFrame, selectedFrame].forEach((frame) => {
        if (!frame) return;
        Array.from(frame.classList)
          .filter(className => className.startsWith("focus-"))
          .forEach(className => frame.classList.remove(className));
        if (item.imageFocusClass) frame.classList.add(item.imageFocusClass);
      });
    }
    renderTreasureRequestSummary();
  };

  const setupTreasureRequestSummary = () => {
    const summary = document.getElementById("treasureRequestSummary");
    if (!summary || summary.dataset.ready === "true") return;
    summary.dataset.ready = "true";
    summary.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-request-action]");
      const itemCard = event.target.closest(".treasure-request-item");
      const index = Number.parseInt((actionButton || itemCard)?.dataset.requestIndex, 10);
      if (!Number.isInteger(index)) return;

      const items = loadStoredRequestItems();
      const item = items[index];
      if (!item) return;

      if (actionButton) {
        const action = actionButton.dataset.requestAction;
        if (action === "increase") {
          item.quantity += 1;
        } else if (action === "decrease") {
          item.quantity -= 1;
        } else if (action === "remove") {
          items.splice(index, 1);
          selectedRequestIndex = Math.min(selectedRequestIndex, items.length - 1);
          saveStoredRequestItems(items);
          renderTreasureRequestSummary();
          return;
        }
        if (item.quantity <= 0) {
          items.splice(index, 1);
        }
        saveStoredRequestItems(items);
        renderTreasureRequestSummary();
        return;
      }

      applyRequestItemToBuilder(index);
    });
    renderTreasureRequestSummary();
  };

  const buildHomeTreasureOrder = (confirmedAddress) => {
    checkoutTrace("Building order payload");
    const product = getSelectedProduct();
    const design = product?.name || "Custom idea";
    const colours = document.getElementById("homeTreasureColours")?.value.trim() || "Custom colours";
    const hardware = document.getElementById("homeTreasureHardware")?.value || "Gold";
    const quantity = Number(document.getElementById("homeTreasureQuantity")?.value || 1);
    const personalization = getPersonalizationState();
    const customDescription = isCustomProduct(product) ? (document.getElementById("homeCustomDescription")?.value.trim() || "") : "";
    const address = confirmedAddress || validateAndNormalizeAddress();

    const cartItems = checkoutCartItems();
    const orderItems = cartItems.length ? cartItems : [{
      productId: product?.slug || "custom-idea",
      design,
      colours,
      hardware,
      personalization: personalization.text,
      personalizationType: personalization.type,
      personalizationText: personalization.text,
      customDescription,
      quantity
    }];

    return {
      customer: {
        name: document.getElementById("homeCustomerName")?.value.trim() || "",
        email: document.getElementById("homeCustomerEmail")?.value.trim() || "",
        phone: document.getElementById("homeCustomerPhone")?.value.trim() || ""
      },
      shipping: {
        address: address.normalizedAddress || document.getElementById("homeShippingAddress")?.value.trim() || "",
        street: address.normalized?.street || document.getElementById("homeShippingAddress")?.value.trim() || "",
        city: address.normalized?.city || document.getElementById("homeCity")?.value.trim() || "",
        province: address.normalized?.province || document.getElementById("homeProvince")?.value.trim() || "",
        postalCode: address.normalized?.postalCode || document.getElementById("homePostalCode")?.value.trim() || "",
        country: address.normalized?.country || document.getElementById("homeCountry")?.value.trim() || "Canada",
        addressAsEntered: address.addressAsEntered || "",
        normalizedAddress: address.normalizedAddress || ""
      },
      notes: "",
      website: document.getElementById("homeOrderWebsite")?.value || "",
      items: orderItems
    };
  };

  const submitHomeTreasureOrder = async (form, confirmedAddress) => {
    const button = document.getElementById("homeTreasureButton");
    checkoutTrace("submitHomeTreasureOrder called", {
      hasConfirmedAddress: Boolean(confirmedAddress),
      alreadySubmitting: form.dataset.submitting === "true"
    });
    if (form.dataset.submitting === "true") return;
    if (!confirmedAddress) return beginHomeTreasureOrder(form);

    form.dataset.submitting = "true";
    if (button) {
      button.disabled = true;
      button.textContent = "Submitting...";
    }
    setOrderStatus("Submitting your order securely...");

    let orderSucceeded = false;
    try {
      const submittedOrder = buildHomeTreasureOrder(confirmedAddress);
      const storedRequestItems = loadStoredRequestItems();
      const extendingOrderNumber = activeTreasureOrder?.orderNumber && storedRequestItems.length === 0 && submittedOrder.items.length === 1
        ? activeTreasureOrder.orderNumber
        : "";
      const orderApiUrl = extendingOrderNumber
        ? `${API_BASE_URL.replace(/\/$/, "")}/api/orders/${encodeURIComponent(extendingOrderNumber)}/items`
        : `${API_BASE_URL.replace(/\/$/, "")}/api/orders`;
      const orderPayload = extendingOrderNumber
        ? {
          item: submittedOrder.items[0],
          website: submittedOrder.website
        }
        : submittedOrder;
      console.info("SUBMIT ORDER STARTED");
      console.info("Submitting order");
      checkoutTrace("Submitting order to API", {
        orderApiUrl,
        productId: submittedOrder.items?.[0]?.productId,
        itemCount: submittedOrder.items?.length || 0,
        normalizedAddress: submittedOrder.shipping?.normalizedAddress,
        extendingOrderNumber: extendingOrderNumber || null
      });
      const { ok, status, data } = await postJson(orderApiUrl, orderPayload);
      if (!ok || !data.success) {
        checkoutTrace("Order API rejected submission", { ok, status, error: data.error });
        throw new Error(data.error || `Order could not be submitted. API returned HTTP ${status}.`);
      }

      orderSucceeded = true;
      activeTreasureOrder = {
        orderNumber: data.orderNumber || data.orderId || extendingOrderNumber,
        total: data.total,
        currency: data.currency || "CAD",
        items: Array.isArray(data.items) ? data.items : [],
        etransferEmail: data.etransferEmail || "foreverbeaded1@gmail.com"
      };
      console.info("ORDER SAVED");
      console.info("Order saved");
      console.info("Email result received", { emailSent: data.emailSent === true });
      checkoutTrace("Order saved; opening success modal", {
        orderNumber: data.orderNumber || data.orderId || "",
        emailSent: data.emailSent === true
      });
      try {
        console.info("SHOW SUCCESS PANEL");
        console.info("Showing success screen");
        showOrderSuccessScreen(data);
      } catch (modalError) {
        console.error("[checkout] Success modal failed; showing emergency fallback", modalError);
        const { panel } = createSuccessOverlay();
        panel.textContent = `SUCCESS PANEL TEST\nOrder ${data.orderNumber || data.orderId || ""} received. Total ${formatCents(data.total, data.currency)}. Send e-Transfer to ${data.etransferEmail || "foreverbeaded1@gmail.com"}.`;
      }
      if (button) {
        button.disabled = true;
        button.textContent = "Order Received";
      }
      if (cartCheckoutRequested()) {
        localStorage.removeItem(CART_STORAGE_KEY);
        sessionStorage.removeItem(CART_CHECKOUT_FLAG_KEY);
      } else if (storedRequestItems.length) {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
      renderTreasureRequestSummary();
      checkoutTrace("Checkout complete; success modal displayed");
    } catch (error) {
      console.error("[checkout] Order submission failed", error);
      const message = error instanceof TypeError && /fetch/i.test(error.message)
        ? `Could not reach the order API at ${API_BASE_URL.replace(/\/$/, "")}/api/orders. Make sure the Forever Beaded backend is running.`
        : (error?.message || "Unknown order submission error.");
      setOrderStatus(isLocalApi
        ? `Order submission failed: ${message}`
        : "Your order could not be submitted right now. Please check your details and try again, or contact Forever Beaded at foreverbeaded1@gmail.com.",
        true);
    } finally {
      form.dataset.submitting = "false";
      if (button && !orderSucceeded) {
        button.disabled = false;
        button.textContent = "Create My Treasure";
      }
    }
  };

  const setupHomeDesignBuilder = () => {
    const form = document.getElementById("homeDesignBuilder");
    if (!form) return;

    populateDesignOptions();
    applyRequestedDesignSelection();
    form.addEventListener("input", renderHomeTreasurePreview);
    form.addEventListener("change", () => {
      syncCustomDescriptionField();
      syncPersonalizationField();
      renderHomeTreasurePreview();
    });
    document.getElementById("homePersonalizationEnabled")?.addEventListener("change", () => {
      syncPersonalizationField();
      validatePersonalization(false);
      renderHomeTreasurePreview();
    });
    document.getElementById("homePersonalizationKind")?.addEventListener("change", () => {
      syncPersonalizationField();
      validatePersonalization(false);
      renderHomeTreasurePreview();
    });
    document.getElementById("homePersonalizationText")?.addEventListener("input", () => {
      normalizePersonalizationTextInput();
      validatePersonalization(false);
      renderHomeTreasurePreview();
    });
    document.getElementById("homeCustomDescription")?.addEventListener("input", () => {
      syncCustomDescriptionField();
      validateCustomDescription();
      renderHomeTreasurePreview();
    });
    document.getElementById("homeTreasureHardware")?.addEventListener("change", () => {
      syncHardwarePreviewSample();
      renderHomeTreasurePreview();
    });
    document.getElementById("homeTreasureHardware")?.addEventListener("input", () => {
      syncHardwarePreviewSample();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      beginHomeTreasureOrder(form);
    });
    setupTreasureRequestSummary();
    syncCustomDescriptionField();
    syncPersonalizationField();
    renderHomeTreasurePreview();
    const storedRequestItems = loadStoredRequestItems();
    if (storedRequestItems.length) {
      applyRequestItemToBuilder(0);
    }
    if (cartCheckoutRequested() && storedRequestItems.length) {
      setOrderStatus("Your cart treasures are ready. Please complete your customer details and shipping address to place one e-Transfer order.");
      form.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    }
    scrollToRequestedDesign();
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const easeInOut = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const cubicPoint = (a, b, c, d, t) => {
    const mt = 1 - t;
    return {
      x: (mt * mt * mt * a.x) + (3 * mt * mt * t * b.x) + (3 * mt * t * t * c.x) + (t * t * t * d.x),
      y: (mt * mt * mt * a.y) + (3 * mt * mt * t * b.y) + (3 * mt * t * t * c.y) + (t * t * t * d.y)
    };
  };

  const pointForElement = (selector, fallback) => {
    const element = document.querySelector(selector);
    if (!element) return fallback;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight * 2) return fallback;
    return {
      x: clamp(rect.left + rect.width * .5, 110, window.innerWidth - 110),
      y: clamp(rect.top + rect.height * .5, 150, window.innerHeight * .52)
    };
  };

  const setButterflyPose = (butterfly, point, rotation, scale, opacity) => {
    butterfly.style.opacity = String(opacity);
    butterfly.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
  };

  const animateMonarch = (butterfly, options) => {
    const startedAt = performance.now() + (options.delay || 0);
    const duration = options.duration;

    function frame(now) {
      if (now < startedAt) {
        requestAnimationFrame(frame);
        return;
      }

      const raw = clamp((now - startedAt) / duration, 0, 1);
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const flower = pointForElement(".workspace-photo-flower", {
        x: viewport.width * .66,
        y: viewport.height * .48
      });
      const exclusive = pointForElement(".hero-feature", {
        x: viewport.width * .86,
        y: viewport.height * .24
      });
      const book = pointForElement(".hero-book-scene", {
        x: viewport.width * .22,
        y: viewport.height * .58
      });
      const title = pointForElement("#customTitle", {
        x: viewport.width * .52,
        y: viewport.height * .24
      });
      let position;
      let rotation;
      let scale;
      let opacity = raw < .05 ? raw / .05 : raw > .985 ? (1 - raw) / .015 : 1;

      butterfly.classList.add("is-flying");
      butterfly.classList.toggle("is-resting", options.role === "flower" && raw > .42 && raw < .6);

      if (options.role === "close") {
        if (raw < .34) {
          const t = easeInOut(raw / .34);
          position = cubicPoint(
            { x: -230, y: viewport.height * .62 },
            { x: viewport.width * .08, y: viewport.height * .18 },
            { x: viewport.width * .32, y: viewport.height * .62 },
            { x: viewport.width * .5, y: viewport.height * .36 },
            t
          );
          rotation = -14 + Math.sin(t * Math.PI * 2.2) * 24;
          scale = 1.05 + Math.sin(t * Math.PI) * .42;
        } else if (raw < .62) {
          const t = easeInOut((raw - .34) / .28);
          position = cubicPoint(
            { x: viewport.width * .5, y: viewport.height * .36 },
            { x: viewport.width * .62, y: viewport.height * .18 },
            { x: book.x + 120, y: book.y - 170 },
            { x: book.x + 40, y: book.y - 92 },
            t
          );
          rotation = Math.sin(t * Math.PI * 2) * 18;
          scale = 1.18 - t * .34;
        } else {
          const t = easeInOut((raw - .62) / .38);
          position = cubicPoint(
            { x: book.x + 40, y: book.y - 92 },
            { x: book.x + 210, y: book.y - 190 },
            { x: viewport.width * .72, y: viewport.height * .22 },
            { x: viewport.width + 160, y: viewport.height * .46 },
            t
          );
          rotation = -8 + Math.sin(t * Math.PI * 3) * 20;
          scale = .86 + Math.sin(t * Math.PI) * .12;
        }
      } else if (options.role === "flower") {
        if (raw < .28) {
          const t = easeInOut(raw / .28);
          position = cubicPoint(
            { x: -150, y: viewport.height * .48 },
            { x: viewport.width * .18, y: viewport.height * .22 },
            { x: viewport.width * .42, y: viewport.height * .58 },
            { x: flower.x - 115, y: flower.y - 72 },
            t
          );
          rotation = -10 + Math.sin(t * Math.PI * 2) * 20;
          scale = .76 + Math.sin(t * Math.PI) * .18;
        } else if (raw < .42) {
          const t = (raw - .28) / .14;
          const angle = (t * Math.PI * 2.25) - Math.PI * .65;
          position = {
            x: flower.x + Math.cos(angle) * Math.min(96, viewport.width * .11),
            y: flower.y + Math.sin(angle) * Math.min(62, viewport.height * .09)
          };
          rotation = Math.sin(angle) * 26;
          scale = .9 + Math.sin(t * Math.PI) * .08;
        } else if (raw < .6) {
          const t = (raw - .42) / .18;
          position = {
            x: flower.x + Math.sin(t * Math.PI * 2) * 18,
            y: flower.y - 34 + Math.sin(t * Math.PI * 4) * 7
          };
          rotation = Math.sin(t * Math.PI * 2) * 6;
          scale = .92;
        } else {
          const t = easeInOut((raw - .6) / .4);
          position = cubicPoint(
            { x: flower.x, y: flower.y - 34 },
            { x: viewport.width * .48, y: viewport.height * .16 },
            { x: exclusive.x, y: exclusive.y },
            { x: viewport.width + 180, y: clamp(exclusive.y + 60, 130, viewport.height * .62) },
            t
          );
          rotation = -4 + Math.sin(t * Math.PI * 3) * 24;
          scale = .86 + Math.sin(t * Math.PI) * .14;
        }
      } else if (options.role === "title") {
        const t = easeInOut(raw);
        position = cubicPoint(
          { x: viewport.width + 150, y: title.y - 36 },
          { x: viewport.width * .72, y: title.y - 102 },
          { x: viewport.width * .46, y: title.y + 62 },
          { x: -150, y: title.y + 24 },
          t
        );
        rotation = Math.sin(t * Math.PI * 3.2) * 18 - 8;
        scale = .72 + Math.sin(t * Math.PI) * .1;
        opacity = raw < .06 ? raw / .06 : raw > .965 ? (1 - raw) / .035 : .92;
      } else {
        const t = easeInOut(raw);
        const side = options.seed % 2 === 0 ? 1 : -1;
        const depth = options.role === "depth-far" ? .56 : .68;
        position = cubicPoint(
          { x: side > 0 ? viewport.width + 120 : -120, y: viewport.height * (.24 + options.seed * .035) },
          { x: viewport.width * (.78 - options.seed * .025), y: viewport.height * (.18 + options.seed * .025) },
          { x: flower.x + side * 95, y: flower.y - 105 },
          { x: side > 0 ? -120 : viewport.width + 120, y: viewport.height * (.42 + options.seed * .04) },
          t
        );
        rotation = Math.sin(t * Math.PI * 4 + options.seed) * 22;
        scale = depth + Math.sin(t * Math.PI) * .14;
        opacity = raw < .08 ? raw / .08 : raw > .965 ? (1 - raw) / .035 : .82;
      }

      const bob = Math.sin(raw * Math.PI * (options.role === "close" ? 12 : 18) + options.seed) * (options.role === "close" ? 14 : 10);
      position.y += options.role === "title" ? Math.sin(raw * Math.PI * 12 + options.seed) * 8 : bob;
      setButterflyPose(butterfly, position, rotation, scale, clamp(opacity, 0, 1));

      if (raw < 1) {
        requestAnimationFrame(frame);
      } else {
        butterfly.classList.remove("is-flying", "is-resting");
        butterfly.style.opacity = "0";
      }
    }

    requestAnimationFrame(frame);
  };

  const setupChapterTwoButterflies = () => {
    const sections = ["chapterOne", "collections", "chapterThree", "chapterFour", "meetMaker", "kindWords", "beginStory"]
      .map(id => document.getElementById(id))
      .filter(Boolean);
    let layer = document.getElementById("chapterTwoButterflyLayer");
    const monarchMarkup = `
      <span class="svg-monarch svg-monarch-main" data-butterfly="main">
        <span class="monarch-shadow"></span>
        <img class="monarch-whole" src="images/monarch-cover-realistic.png" alt="" draggable="false" decoding="async">
        <span class="left-wing monarch-textured-wing"></span>
        <span class="right-wing monarch-textured-wing"></span>
      </span>
      <span class="svg-monarch svg-monarch-small svg-monarch-small-one" data-butterfly="small-one">
        <span class="monarch-shadow"></span>
        <img class="monarch-whole" src="images/monarch-cover-realistic.png" alt="" draggable="false" decoding="async">
        <span class="left-wing monarch-textured-wing"></span>
        <span class="right-wing monarch-textured-wing"></span>
      </span>
      <span class="svg-monarch svg-monarch-small svg-monarch-small-two" data-butterfly="small-two">
        <span class="monarch-shadow"></span>
        <img class="monarch-whole" src="images/monarch-cover-realistic.png" alt="" draggable="false" decoding="async">
        <span class="left-wing monarch-textured-wing"></span>
        <span class="right-wing monarch-textured-wing"></span>
      </span>`;

    if (!layer && sections.length) {
      layer = document.createElement("div");
      layer.id = "chapterTwoButterflyLayer";
      layer.className = "chapter-two-butterfly-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }

    if (!sections.length || !layer) return;
    layer.innerHTML = monarchMarkup;

    const main = layer.querySelector(".svg-monarch-main");
    const smallOne = layer.querySelector(".svg-monarch-small-one");
    const smallTwo = layer.querySelector(".svg-monarch-small-two");
    const template = main || smallOne || smallTwo;
    const createExtra = (className) => {
      if (!template) return null;
      const clone = template.cloneNode(true);
      clone.className = `svg-monarch ${className}`;
      clone.dataset.butterfly = className;
      clone.style.opacity = "0";
      layer.appendChild(clone);
      return clone;
    };
    const titleButterfly = layer.querySelector(".svg-monarch-title") || createExtra("svg-monarch-title");
    const depthButterfly = layer.querySelector(".svg-monarch-depth") || createExtra("svg-monarch-depth");
    let flightTimer = null;
    let flightStarted = false;

    main?.classList.add("svg-monarch-close");
    smallOne?.classList.add("svg-monarch-flower");
    smallTwo?.classList.add("svg-monarch-depth");

    const runFlightPass = () => {
      if (main) animateMonarch(main, { role: "close", duration: 32000, delay: 0, seed: 1 });
      if (smallOne) animateMonarch(smallOne, { role: "flower", duration: 35000, delay: 1200, seed: 2 });
      if (titleButterfly) animateMonarch(titleButterfly, { role: "title", duration: 30000, delay: 3600, seed: 3 });
      if (smallTwo) animateMonarch(smallTwo, { role: "depth-near", duration: 33000, delay: 5200, seed: 4 });
      if (depthButterfly) animateMonarch(depthButterfly, { role: "depth-far", duration: 36000, delay: 7200, seed: 5 });
    };

    const startFlight = () => {
      if (flightStarted) return;
      flightStarted = true;
      window.setTimeout(runFlightPass, 650);
      flightTimer = window.setInterval(runFlightPass, 43000);
    };

    startFlight();

    window.addEventListener("pagehide", () => {
      if (flightTimer) window.clearInterval(flightTimer);
    }, { once: true });
  };

  document.addEventListener("click", saveCategoryJump);

  const setupPageTransitions = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.body.classList.add("page-ready");
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank") return;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin || !url.pathname.endsWith(".html")) return;

      event.preventDefault();
      document.body.classList.add("page-turning");
      window.setTimeout(() => {
        window.location.href = url.href;
      }, 280);
    });
  };

  const setupPage = () => {
    setupBackToTop();
    setupExclusiveProductLinks();
    setupHomeDesignBuilder();
    setupChapterTwoButterflies();
    setupPageTransitions();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPage);
  } else {
    setupPage();
  }
})();
