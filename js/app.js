const products = [
  {
    id: 1,
    name: "Exclusive Macaw",
    price: 47,
    category: "exclusive",
    image: "images/macaw.jpeg",
    description: "Forever Beaded Exclusive:A vibrant macaw design, perfect for bird lovers."
  },
  {
    id: 2,
    name: "Natalie's Butterfly",
    price: 25,
    category: "Butterfly",
    image: "images/natalies-butterfly-mushroom.jpeg",
    description: "Inspired by Natalie's love for nature, this butterfly design is a delightful addition to any collection."
  },
  {
    id: 3,
    name: "Butterfly Keychain",
    price: 20,
    category: "Butterfly",
    image: "images/butterfly.jpeg",
    description: "A charming butterfly keychain, perfect for adding a touch of nature to your keys."
  },
  {
    id: 4,
    name: "Butterflies collection",
    price: 22,
    category: "Butterfly",
    image: "images/butterflies.jpeg",
    description: "A beautiful collection of butterfly designs, perfect for nature lovers."
  },
  {
    id: 5,
    name: "Flower Braided",
    price: 18,
    category: "Flower",
    image: "images/flower-braided.jpeg",
    description: "A beautiful braided flower design, perfect for adding a touch of nature to your accessories."
  },
  {
    id: 6,
    name: "Large Flower",
    price: 20,
    category: "Flower",
    image: "images/big-flower.jpeg",
    description: "A large flower design, perfect for making a statement with your accessories."
  },
  {
    id: 7,
    name: "Intricated Flower",
    price: 25,
    category: "Flower",
    image: "images/intricated-flower.jpeg",
    description: "An intricately designed flower, perfect for those who appreciate detailed craftsmanship."
  },
  {
    id: 8,
    name: "Butterfly and Flower",
    price: 30,
    category: "Butterfly & Flower",
    image: "images/phoenix-butterfly-flower-braided.jpeg",
    description: "A beautiful combination of butterfly and flower designs, perfect for nature enthusiasts."
  },
  {
    id: 9,
    name: "Gecko Keychain",
    price: 20,
    category: "Animals",
    image: "images/gecko.jpeg",
    description: "A cute gecko keychain, perfect for animal lovers."
  },
  {
    id: 10,
    name: "Baby gecko",
    price: 18,
    category: "Animals",
    image: "images/baby-gecko.jpeg",
    description: "A adorable baby gecko keychain, perfect for animal lovers."
  },
  {
    id: 11,
    name: "Gecko and Butterfly",
    price: 40,
    category: "Animals",
    image: "images/gecko-butterfly.jpeg",
    description: "A beautiful combination of gecko and butterfly designs, perfect for animal and nature enthusiasts."
  },
  {
    id: 12,
    name: "Canada Flag",
    price: 20,
    category: "Flags",
    image: "images/canada-Flag.jpeg",
    description: "A patriotic Canada flag design, perfect for showing your national pride."
  },
  {
    id: 13,
    name: "Soccer Ball",
    price: 18,
    category: "Sports",
    image: "images/soccer-ball.jpeg",
    description: "A fun soccer ball design, perfect for sports enthusiasts."
  },
  {
    id: 14,
    name: "Turtle",
    price: 20,
    category: "Ocean Animals",
    image: "images/turtle.jpeg",
    description: "A cute turtle keychain, perfect for animal lovers."
  },
  {
    id: 15,
    name: "Octopus",
    price: 25,
    category: "Ocean Animals",
    image: "images/octopus.jpeg",
    description: "A cute octopus keychain, perfect for animal lovers."
  },
  {
    id: 16,
    name: "Fish, Crab and Penguin",
    price: 30,
    category: "Ocean Animals",
    image: "images/fish-crab-penguin.jpeg",
    description: "A delightful combination of fish, crab, and penguin designs, perfect for ocean enthusiasts."
  },
  {
    id: 17,
    name: "Personalized Pencil",
    price: 15,
    category: "Stationery",
    image: "images/pencil.jpeg",
    description: "A personalized pencil, perfect for those who want a unique gift."
  },
  {
    id: 18,
    name: "Pencil Collection",
    price: 18,
    category: "Stationery",
    image: "images/pencil-butterflies-baby-geckos.jpeg",
    description: "A collection of personalized pencils, perfect for those who want a unique gift."
  },
  {
    id: 19,
    name: "Cross Keychain",
    price: 18,
    category: "Faith",
    image: "images/cross.jpeg",
    description: "A beautiful cross keychain, perfect for those who want to express their faith."
  }
];

let cart = JSON.parse(localStorage.getItem("foreverBeadedCart")) || [];

const productGrid = document.getElementById("productGrid");
const productSearch = document.getElementById("productSearch");
const shopFilters = document.getElementById("shopFilters");
const shopResultsCount = document.getElementById("shopResultsCount");
const clearShopFilters = document.getElementById("clearShopFilters");
const cartCount = document.getElementById("cartCount");
const cartPanel = document.getElementById("cartPanel");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const menuBtn = document.getElementById("menuBtn");
const cartBtn = document.getElementById("cartBtn");
const galleryGrid = document.getElementById("galleryGrid");
const galleryFilters = document.getElementById("galleryFilters");
const fbModal = document.getElementById("fbModal");
const fbModalMessage = document.getElementById("fbModalMessage");
const fbModalOk = document.getElementById("fbModalOk");

function money(amount) {
  return `$${amount} CAD`;
}

let activeShopCategory = "All";
let activeShopSearch = "";

function getProductCategories() {
  return ["All", ...new Set(products.map(product => product.category))];
}

function productMatchesShopFilters(product) {
  const categoryMatch = activeShopCategory === "All" || product.category === activeShopCategory;
  const searchText = `${product.name} ${product.category} ${product.description}`.toLowerCase();
  const searchMatch = !activeShopSearch || searchText.includes(activeShopSearch.toLowerCase());
  return categoryMatch && searchMatch;
}

function renderShopFilters() {
  if (!shopFilters) return;
  shopFilters.innerHTML = getProductCategories().map(category => `
    <button class="filter-btn ${category === activeShopCategory ? "active" : ""}" type="button" data-shop-category="${category}">${category}</button>
  `).join("");
}

function productSocialStats(product) {
  // Gentle placeholders for engagement labels only; written reviews are customer-submitted below.
  const likes = 12 + product.id * 3;
  const comments = Math.max(0, Math.round(likes / 18));
  return { likes, reviews: 0, comments, rating: "New" };
}

function showForeverBeadedMessage(message) {
  if (!fbModal || !fbModalMessage) {
    alert(message);
    return;
  }

  fbModalMessage.innerHTML = message.replace(/\n/g, "<br>");
  fbModal.classList.add("open");
  fbModal.setAttribute("aria-hidden", "false");
}

function closeForeverBeadedMessage() {
  if (!fbModal) return;
  fbModal.classList.remove("open");
  fbModal.setAttribute("aria-hidden", "true");
}

function saveCart() {
  localStorage.setItem("foreverBeadedCart", JSON.stringify(cart));
}

function openCart() {
  if (!cartPanel) return;
  cartPanel.classList.add("open");
}

function renderProducts() {
  if (!productGrid) return;

  renderShopFilters();

  const visibleProducts = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => productMatchesShopFilters(product));

  if (shopResultsCount) {
    const label = activeShopCategory === "All" ? "all categories" : activeShopCategory;
    shopResultsCount.textContent = visibleProducts.length
      ? `Showing ${visibleProducts.length} handmade piece${visibleProducts.length === 1 ? "" : "s"} in ${label}`
      : "No pieces matched that search yet.";
  }

  if (!visibleProducts.length) {
    productGrid.innerHTML = `
      <div class="no-results-card">
        <h3>No matching pieces yet</h3>
        <p>Try another search, choose a different category, or use the custom order builder and I can make something just for you.</p>
        <a href="shop.html#designer" class="primary-btn">Create Custom Order</a>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = visibleProducts.map(({ product, index }) => {
    const stats = productSocialStats(product);
    return `
      <article class="product-card" data-category="${product.category}">
        <img src="${product.image}" alt="${product.name}" class="product-image">
        <span class="badge">${product.id === 1 ? "Exclusive" : "Handmade"}</span>
        <h3>${product.name}</h3>
        <div class="social-row">${stats.rating} · ${stats.likes} saved · Made to order</div>
        <p>${product.description}</p>
        <strong>${money(product.price)}</strong><br><br>
        <button class="add-to-cart-btn" data-index="${index}">Add to Cart</button>
      </article>
    `;
  }).join("");
}

function renderGallery(category = "All") {
  if (!galleryGrid) return;

  const categories = ["All", ...new Set(products.map(product => product.category))];

  if (galleryFilters) {
    galleryFilters.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat === category ? "active" : ""}" data-category="${cat}">${cat}</button>
    `).join("");
  }

  const shownProducts = category === "All"
    ? products
    : products.filter(product => product.category === category);

  galleryGrid.innerHTML = shownProducts.map((product, index) => {
    const originalIndex = products.findIndex(item => item.id === product.id);
    const stats = productSocialStats(product);
    return `
      <article class="gallery-card">
        <img src="${product.image}" alt="${product.name}" class="gallery-image">
        <div class="gallery-info">
          <span class="badge">${product.id === 1 ? "Most Loved" : "Customer Favorite"}</span>
          <h3>${product.name}</h3>
          <div class="stars"><strong>Made to order</strong> <span>Customer photos welcome</span></div>
          <div class="social-row">${stats.likes} saved · Handmade</div>
          <p>${product.description}</p>
          <strong>${money(product.price)}</strong>
          <button class="add-to-cart-btn" data-index="${originalIndex}">Add to Cart</button>
        </div>
      </article>
    `;
  }).join("");
}

function addToCart(index) {
  const product = products[index];
  if (!product) return;

  cart.push({ ...product, quantity: 1 });
  saveCart();
  renderCart();
  openCart();
  console.log("Add to cart:", product.name);
}

function addCustomToCart() {
  if (!document.getElementById("designType")) return;
  const design = document.getElementById("designType").value;
  const colours = document.getElementById("colours").value;
  const name = document.getElementById("customName").value || "None";
  const keychain = document.getElementById("keychainType").value;
  const price = calculateCustomPrice();

  // Keep only one custom request in the cart at a time.
  cart = cart.filter(item => !item.isCustom);

  cart.push({
    isCustom: true,
    name: `Custom ${design}`,
    price,
    description: `Colours: ${colours}. Name: ${name}. Type: ${keychain}.`,
    quantity: 1
  });

  saveCart();
  renderCart();
  openCart();
}

function renderCart() {
  if (!cartCount || !cartItems || !cartTotal) return;
  cartCount.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = money(0);
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <strong>${item.name}</strong>
      <p>${item.description}</p>
      <p>${money(item.price)}</p>
      <button class="remove-btn" data-index="${index}">Remove</button>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = money(total);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  localStorage.removeItem("foreverBeadedCart");
  renderCart();
}

function checkout() {
  buyNow();
}


function normalizeColourName(value) {
  return String(value || "").trim().toLowerCase();
}

const beadColourMap = {
  purple: "#7b4bb3",
  lavender: "#b99be8",
  violet: "#8d5bd1",
  pink: "#f28ab8",
  hotpink: "#e83e8c",
  rose: "#e86f9d",
  white: "#ffffff",
  cream: "#fff5d6",
  gold: "#d6a84f",
  yellow: "#ffd84d",
  orange: "#ff8a3d",
  red: "#d64242",
  blue: "#3d7fe0",
  skyblue: "#7ec8ff",
  teal: "#2bb3b1",
  green: "#4f9b55",
  lime: "#a7d957",
  black: "#2b2430",
  brown: "#8b5e3c",
  grey: "#9ca3af",
  gray: "#9ca3af",
  silver: "#c7ccd4",
  clear: "#f7fbff",
  rainbow: "linear-gradient(135deg,#ff5f6d,#ffc371,#47cf73,#42a5f5,#9c6bff)"
};

function parseCustomerColours(value) {
  const fallback = ["purple", "white", "gold"];
  const parts = String(value || "")
    .split(/[,/]+|\band\b/i)
    .map(part => normalizeColourName(part).replace(/\s+/g, ""))
    .filter(Boolean);

  const chosen = parts.length ? parts : fallback;
  return chosen.slice(0, 4).map((name, index) => {
    const fallbackName = fallback[index % fallback.length];
    return beadColourMap[name] || beadColourMap[fallbackName] || name;
  });
}

function patternForDesign(design) {
  const patterns = {
    "Butterfly": [
      "aa...bb",
      "aaa.bbb",
      ".aaabb.",
      "...c...",
      ".bbbaa.",
      "bbb.aaa",
      "bb...aa"
    ],
    "Natalie's Butterfly": [
      "aa...bb",
      "aaa.bbb",
      ".aaccb.",
      "...c...",
      ".bccaa.",
      "bbb.aaa",
      "bb...aa"
    ],
    "Gecko": [
      "..aa..",
      ".aaaa.",
      "a.aa.a",
      "..bb..",
      ".bbbb.",
      "b.b.b.",
      "a....a"
    ],
    "Flower": [
      "..a..",
      ".aba.",
      "abcba",
      ".aba.",
      "..c.."
    ],
    "Macaw": [
      "..a..",
      ".aaa.",
      "abbba",
      "bcccb",
      ".ccc.",
      "..c.."
    ],
    "Turtle": [
      "..a..",
      ".bbb.",
      "bbcbc",
      ".bbb.",
      "a...a"
    ],
    "Octopus": [
      ".aaa.",
      "aaaaa",
      "ababa",
      ".aaa.",
      "a.a.a"
    ],
    "Soccer Ball": [
      ".aaa.",
      "abbba",
      "ababa",
      "abbba",
      ".aaa."
    ],
    "Canada Flag": [
      "aabbaa",
      "aabbaa",
      "aabba.",
      "aabbaa"
    ],
    "Cross": [
      "..a..",
      "..a..",
      "aaaaa",
      "..a..",
      "..a.."
    ],
    "Pencil": [
      "..a..",
      "..b..",
      "..b..",
      "..b..",
      "..c.."
    ],
    "Crab": [
      "a...a",
      ".a.a.",
      "bbbbb",
      "b.b.b",
      "a...a"
    ],
    "Fish": [
      "...a.",
      "..aaa",
      "aaaaa",
      "..aaa",
      "...a."
    ],
    "Tiger": [
      ".aaa.",
      "ababa",
      "aabaa",
      ".aaa.",
      "a...a"
    ],
    "Penguin": [
      ".aaa.",
      "ababa",
      "abbba",
      ".bbb.",
      "c...c"
    ],
    "Mushroom": [
      ".aaa.",
      "aaaaa",
      ".bbb.",
      ".bbb."
    ]
  };
  return patterns[design] || patterns["Butterfly"];
}

function renderLiveDesignPreview() {
  const preview = document.getElementById("liveDesignPreview");
  if (!preview) return;

  const design = document.getElementById("designType")?.value || "Butterfly";
  const colours = parseCustomerColours(document.getElementById("colours")?.value);
  const pattern = patternForDesign(design);
  const maxCols = Math.max(...pattern.map(row => row.length));

  preview.style.setProperty("--preview-cols", maxCols);
  preview.style.setProperty("--preview-rows", pattern.length);

  const beads = [];
  pattern.forEach(row => {
    [...row.padEnd(maxCols, ".")].forEach(code => {
      if (code === ".") {
        beads.push('<span class="bead empty"></span>');
        return;
      }
      const colourIndex = code === "a" ? 0 : code === "b" ? 1 : code === "c" ? 2 : 3;
      const colour = colours[colourIndex % colours.length];
      beads.push(`<span class="bead" style="--bead:${colour}"></span>`);
    });
  });

  preview.innerHTML = beads.join("");
}

function calculateCustomPrice() {
  const design = document.getElementById("designType").value;
  const keychain = document.getElementById("keychainType").value;
  const name = document.getElementById("customName").value;

  const basePrices = {
    "Butterfly": 20,
    "Gecko": 20,
    "Flower": 20,
    "Macaw": 47,
    "Natalie's Butterfly": 25,
    "Turtle": 20,
    "Octopus": 25,
    "Soccer Ball": 18,
    "Canada Flag": 20,
    "Cross": 18,
    "Pencil": 15,
    "Crab": 20,
    "Fish": 20,
    "Tiger": 35,
    "Penguin": 20,
    "Mushroom": 18,
    "Surprise Me": 25,
    "Custom": 35
  };

  let price = basePrices[design] || 25;

  if (name.trim()) price += 5;
  if (keychain === "Gold") price += 5;
  if (keychain === "Bag Charm") price += 3;

  return price;
}

function updatePreview() {
  if (!document.getElementById("designType")) return;
  const design = document.getElementById("designType").value;
  const colours = document.getElementById("colours").value;
  const name = document.getElementById("customName").value || "None";

  document.getElementById("previewTitle").textContent = `${design} Design`;
  document.getElementById("previewColours").textContent = `Colours: ${colours}`;
  document.getElementById("previewName").textContent = `Name: ${name}`;
  document.getElementById("previewPrice").textContent = money(calculateCustomPrice());
  renderLiveDesignPreview();
}

// One click listener for product and remove buttons.
document.addEventListener("click", (event) => {
  const addButton = event.target.closest(".add-to-cart-btn");
  if (addButton) {
    addToCart(Number(addButton.dataset.index));
    return;
  }

  const removeButton = event.target.closest(".remove-btn");
  if (removeButton) {
    removeFromCart(Number(removeButton.dataset.index));
    return;
  }

  const galleryFilterButton = event.target.closest("[data-category]");
  if (galleryFilterButton) {
    renderGallery(galleryFilterButton.dataset.category || "All");
    return;
  }

  const collectionJump = event.target.closest("[data-jump-category]");
  if (collectionJump) {
    const category = collectionJump.dataset.jumpCategory;
    if (category && category !== "custom") {
      sessionStorage.setItem("foreverBeadedCategory", category);
      activeShopCategory = category;
      activeShopSearch = "";
      if (productSearch) productSearch.value = "";
      renderProducts();
    }
  }

  if (event.target === fbModal || event.target === fbModalOk) {
    closeForeverBeadedMessage();
  }
});

function calculateCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
}

function buildOrderMessage() {
  const orderLines = cart.map((item, index) => {
    const quantity = item.quantity || 1;
    return `${index + 1}. ${item.name} x${quantity} - ${money(item.price * quantity)}\n${item.description || ""}`;
  }).join("\n\n");

  const total = calculateCartTotal();

  return `Hello Forever Beaded!\n\nI would like to place this order:\n\n${orderLines}\n\nTotal: ${money(total)}\n\nName:\nShipping Address:\nPhone Number:\nNotes:`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[character]));
}

const getForeverBeadedApiBaseUrl = () => {
  const configured = window.FOREVER_BEADED_API_BASE_URL || "http://127.0.0.1:3000";
  return configured.replace(/^http:\/\/localhost:3000\/?$/i, "http://127.0.0.1:3000");
};
const FOREVER_BEADED_API_BASE_URL = getForeverBeadedApiBaseUrl();

function centsDisplay(cents, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency
  }).format(Number(cents || 0) / 100);
}

function productIdForOrderItem(item) {
  const legacyMap = {
    1: "macaw",
    2: "butterfly",
    3: "butterfly",
    4: "butterfly",
    5: "flower",
    6: "flower",
    7: "flower",
    8: "butterfly-with-flowers",
    9: "gecko",
    10: "gecko",
    11: "butterfly-with-flowers",
    12: "custom-idea",
    13: "sports-design",
    14: "ocean-animal",
    15: "ocean-animal",
    16: "ocean-animal",
    17: "pencil",
    18: "pencil",
    19: "cross"
  };
  if (item.id && legacyMap[item.id]) return legacyMap[item.id];
  const design = String(item.name || item.description || "").toLowerCase();
  if (design.includes("macaw")) return "macaw";
  if (design.includes("butterfly") && design.includes("flower")) return "butterfly-with-flowers";
  if (design.includes("butterfly")) return "butterfly";
  if (design.includes("flower")) return "flower";
  if (design.includes("gecko")) return "gecko";
  if (design.includes("turtle") || design.includes("octopus") || design.includes("fish") || design.includes("crab") || design.includes("penguin")) return "ocean-animal";
  if (design.includes("soccer") || design.includes("sport")) return "sports-design";
  if (design.includes("pencil")) return "pencil";
  if (design.includes("cross")) return "cross";
  return "custom-idea";
}

function customerDetailsFromPrompt() {
  const customerName = window.prompt("Name for your order:");
  if (customerName === null) return null;
  const email = window.prompt("Email for your order confirmation:");
  if (email === null) return null;
  const shippingAddress = window.prompt("Shipping address, or leave blank if you will arrange pickup:");
  if (shippingAddress === null) return null;
  const phone = window.prompt("Phone number, optional:") || "";
  const notes = window.prompt("Order notes, optional:") || "";
  return { customerName, email, shippingAddress, phone, notes };
}

async function saveOrderToDatabase(orderItems, customerDetails) {
  const payload = {
    customer: {
      name: customerDetails.customerName,
      email: customerDetails.email,
      phone: customerDetails.phone
    },
    shipping: {
      address: customerDetails.shippingAddress
    },
    notes: customerDetails.notes,
    website: "",
    items: orderItems.map(item => ({
      productId: productIdForOrderItem(item),
      design: item.name,
      colours: item.colours || item.colors || "",
      personalization: item.personalization || item.description || "",
      customDescription: item.customDescription || item.description || item.name || "",
      hardware: item.hardware || item.keychainType || "",
      quantity: item.quantity || 1
    })),
    browserTotal: calculateCartTotal()
  };

  const response = await fetch(`${FOREVER_BEADED_API_BASE_URL.replace(/\/$/, "")}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Order could not be submitted.");
  }
  return data;
}

async function buyNow() {
  if (cart.length === 0) {
    showForeverBeadedMessage("Your cart is empty. Please add an item first.");
    return;
  }

  const orderItems = cart.map(item => ({ ...item }));
  const customerDetails = customerDetailsFromPrompt();
  if (!customerDetails) return;
  if (!customerDetails.customerName.trim() || !customerDetails.email.trim()) {
    showForeverBeadedMessage("Please enter your name and a valid email address before submitting your order.");
    return;
  }

  const button = document.getElementById("buyNowBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "Submitting...";
  }

  try {
    const data = await saveOrderToDatabase(orderItems, customerDetails);
    cart = [];
    localStorage.removeItem("foreverBeadedCart");
    renderCart();
    if (cartPanel) cartPanel.classList.remove("open");

    showForeverBeadedMessage(`Thank you for your order.\n\nOrder number: ${data.orderNumber}\nTotal: ${centsDisplay(data.total, data.currency)}\n\nPlease send your Interac e-Transfer to:\n${data.etransferEmail}\n\nInclude your order number in the e-transfer message.\n\nYour treasure will begin after payment has been received and verified.`);
  } catch (error) {
    showForeverBeadedMessage("Your order could not be submitted right now. Please try again, or contact Forever Beaded at foreverbeaded1@gmail.com.");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Order by E-transfer";
    }
  }
}

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    document.getElementById("nav")?.classList.toggle("open");
  });
}

if (cartBtn) cartBtn.addEventListener("click", openCart);

const closeCartBtn = document.getElementById("closeCart");
if (closeCartBtn) {
  closeCartBtn.addEventListener("click", () => {
    if (cartPanel) cartPanel.classList.remove("open");
  });
}

const clearCartButton = document.getElementById("clearCart");
if (clearCartButton) clearCartButton.addEventListener("click", clearCart);
const buyNowButton = document.getElementById("buyNowBtn");
if (buyNowButton) buyNowButton.addEventListener("click", buyNow);
const addCustomBtn = document.getElementById("addCustomBtn");
if (addCustomBtn) addCustomBtn.addEventListener("click", addCustomToCart);

const copyEmailButton = document.getElementById("copyEmailBtn");
if (copyEmailButton) {
  copyEmailButton.addEventListener("click", async () => {
    const email = "foreverbeaded1@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      showForeverBeadedMessage(`Copied!\n\n${email}\n\nPaste it into your email app to contact Forever Beaded.`);
    } catch (error) {
      showForeverBeadedMessage(`Forever Beaded email:\n\n${email}`);
    }
  });
}

["designType", "colours", "customName", "keychainType"].forEach(id => {
  const field = document.getElementById(id);
  if (field) {
    field.addEventListener("input", updatePreview);
    field.addEventListener("change", updatePreview);
  }
});

if (productSearch) {
  productSearch.addEventListener("input", (event) => {
    activeShopSearch = event.target.value.trim();
    renderProducts();
  });
}

if (shopFilters) {
  shopFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-shop-category]");
    if (!button) return;
    activeShopCategory = button.dataset.shopCategory || "All";
    renderProducts();
  });
}

if (clearShopFilters) {
  clearShopFilters.addEventListener("click", () => {
    activeShopCategory = "All";
    activeShopSearch = "";
    if (productSearch) productSearch.value = "";
    renderProducts();
  });
}

const savedCategoryJump = sessionStorage.getItem("foreverBeadedCategory");
if (savedCategoryJump && productGrid) {
  activeShopCategory = savedCategoryJump;
  sessionStorage.removeItem("foreverBeadedCategory");
}

renderProducts();
renderGallery();
renderCart();
updatePreview();

// Final gallery modal controls: click any product/gallery photo, then close / previous / next / zoom.
const galleryModal = document.getElementById("galleryModal");
const galleryModalImage = document.getElementById("galleryModalImage");
const prevImage = document.getElementById("prevImage");
const nextImage = document.getElementById("nextImage");
const zoomImage = document.getElementById("zoomImage");
const closeGalleryModal = document.getElementById("closeGalleryModal");

let galleryList = [];
let currentGalleryIndex = 0;

function refreshGalleryList() {
  galleryList = Array.from(document.querySelectorAll(".gallery-grid img, .product-image"));
}

function setGalleryImage(index) {
  if (!galleryList.length || !galleryModalImage) return;
  currentGalleryIndex = (index + galleryList.length) % galleryList.length;
  const selectedImage = galleryList[currentGalleryIndex];
  galleryModalImage.src = selectedImage.currentSrc || selectedImage.src;
  galleryModalImage.alt = selectedImage.alt || "Forever Beaded gallery preview";
  galleryModalImage.classList.remove("zoomed");
}

function openGallery(index) {
  if (!galleryModal || !galleryModalImage) return;
  refreshGalleryList();
  if (!galleryList.length) return;
  setGalleryImage(index);
  galleryModal.classList.add("open");
  galleryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("gallery-open");
}

function closeGallery() {
  if (!galleryModal || !galleryModalImage) return;
  galleryModal.classList.remove("open");
  galleryModal.setAttribute("aria-hidden", "true");
  galleryModalImage.classList.remove("zoomed");
  document.body.classList.remove("gallery-open");
}

function showNextImage() {
  setGalleryImage(currentGalleryIndex + 1);
}

function showPrevImage() {
  setGalleryImage(currentGalleryIndex - 1);
}

document.addEventListener("click", (event) => {
  const img = event.target.closest(".gallery-grid img, .product-image");
  if (!img) return;

  refreshGalleryList();
  const index = galleryList.indexOf(img);
  openGallery(index >= 0 ? index : 0);
});

if (nextImage) {
  nextImage.addEventListener("click", (event) => {
    event.stopPropagation();
    showNextImage();
  });
}

if (prevImage) {
  prevImage.addEventListener("click", (event) => {
    event.stopPropagation();
    showPrevImage();
  });
}

if (zoomImage) {
  zoomImage.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!galleryModalImage) return;
    galleryModalImage.classList.toggle("zoomed");
  });
}

if (galleryModalImage) {
  galleryModalImage.addEventListener("click", (event) => {
    event.stopPropagation();
    galleryModalImage.classList.toggle("zoomed");
  });
}

if (closeGalleryModal) {
  closeGalleryModal.addEventListener("click", (event) => {
    event.stopPropagation();
    closeGallery();
  });
}

if (galleryModal) {
  galleryModal.addEventListener("click", (event) => {
    if (event.target === galleryModal) closeGallery();
  });
}

document.addEventListener("keydown", (event) => {
  if (!galleryModal || !galleryModal.classList.contains("open")) return;
  if (event.key === "Escape") closeGallery();
  if (event.key === "ArrowRight") showNextImage();
  if (event.key === "ArrowLeft") showPrevImage();
});


// Real customer review area. Reviews are saved in this browser until a backend is added.
const reviewForm = document.getElementById("reviewForm");
const reviewGrid = document.getElementById("reviewGrid");
const savedReviewsKey = "foreverBeadedReviews";
let customerReviews = JSON.parse(localStorage.getItem(savedReviewsKey) || "[]");

function starsText(value) {
  const stars = Number(value) || 5;
  return `${stars} out of 5 stars`;
}

function renderReviews() {
  if (!reviewGrid) return;
  if (!customerReviews.length) {
    reviewGrid.innerHTML = `
      <article class="review-card empty-review">
        <div class="review-stars">5 out of 5 stars</div>
        <p>Reviews will appear here after real customers add them.</p>
        <strong>— Forever Beaded</strong>
      </article>
    `;
    return;
  }

  reviewGrid.innerHTML = customerReviews.map(review => `
    <article class="review-card">
      <div class="review-stars">${starsText(review.stars)}</div>
      <p>“${escapeHtml(review.text)}”</p>
      <strong>— ${escapeHtml(review.name)}</strong>
    </article>
  `).join("");
}

if (reviewForm) {
  reviewForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = document.getElementById("reviewName").value.trim();
    const stars = document.getElementById("reviewStars").value;
    const text = document.getElementById("reviewText").value.trim();
    if (!name || !text) return;
    customerReviews.unshift({ name, stars, text, date: new Date().toISOString() });
    customerReviews = customerReviews.slice(0, 12);
    localStorage.setItem(savedReviewsKey, JSON.stringify(customerReviews));
    reviewForm.reset();
    renderReviews();
    showForeverBeadedMessage("Thank you for leaving a real review.");
  });
}

const backToTop = document.getElementById("backToTop");
if (backToTop) {
  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("show", window.scrollY > 500);
  });
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

renderReviews();



/* Forever Beaded — Cinematic asset build */
(function(){
  const ready = fn => document.readyState !== "loading" ? fn() : document.addEventListener("DOMContentLoaded", fn);

  ready(() => {
    const opening = document.getElementById("openingScene");
    const skip = document.getElementById("skipOpening");
    if(skip && opening) skip.addEventListener("click", () => opening.classList.add("skip"));

    const popup = document.getElementById("exclusivePopup");
    const close = document.getElementById("closeExclusive");
    if(popup && close){
      const today = new Date();
      const july31 = new Date(today.getFullYear(), 6, 31);
      if(today < july31){
        setTimeout(() => popup.classList.add("open"), 18000);
      }
      close.addEventListener("click", () => popup.classList.remove("open"));
      popup.addEventListener("click", e => {
        if(e.target === popup) popup.classList.remove("open");
      });
    }

    setInterval(() => {
      const h = document.createElement("span");
      h.className = "fb-heart";
      h.textContent = "♥";
      h.style.left = Math.random() * 96 + "vw";
      h.style.fontSize = (10 + Math.random() * 10) + "px";
      h.style.animationDuration = (7 + Math.random() * 6) + "s";
      document.body.appendChild(h);
      h.addEventListener("animationend", () => h.remove());
    }, 2600);

    initLivingNature();

    document.addEventListener("contextmenu", e => {
      if(e.target.matches("img")) e.preventDefault();
    });
    document.querySelectorAll("img").forEach(img => img.setAttribute("draggable","false"));
  });

  function initLivingNature(){
    if(document.body.classList.contains("storybook-home")) return;
    if(document.querySelector(".living-nature-layer")) return;

    const layer = document.createElement("div");
    layer.className = "living-nature-layer";
    layer.setAttribute("aria-hidden", "true");

    const dust = document.createElement("div");
    dust.className = "living-dust";
    layer.appendChild(dust);

    for(let i = 0; i < 4; i += 1){
      const butterfly = document.createElement("span");
      butterfly.className = `living-butterfly living-butterfly-${i + 1}`;
      butterfly.innerHTML = `
        <span class="monarch-shadow"></span>
        <img class="monarch-whole" src="images/monarch-cover-realistic.png" alt="" draggable="false" decoding="async">
        <i></i><b></b>
      `;
      layer.appendChild(butterfly);
    }

    for(let i = 0; i < 8; i += 1){
      const mote = document.createElement("span");
      mote.className = "living-spark";
      mote.style.setProperty("--x", `${8 + Math.random() * 84}vw`);
      mote.style.setProperty("--delay", `${Math.random() * 9}s`);
      mote.style.setProperty("--duration", `${8 + Math.random() * 8}s`);
      layer.appendChild(mote);
    }

    document.body.appendChild(layer);
  }
})();
