/* Load the Sandy Beaches card component after page-local styles so every
   catalogue-driven collection receives the same final card contract. */
if (document.body?.classList.contains("world-page") && !document.querySelector('link[href*="compact-product-cards.css"]')) {
  const compactCardsStylesheet = document.createElement("link");
  compactCardsStylesheet.rel = "stylesheet";
  compactCardsStylesheet.href = "css/compact-product-cards.css?v=3";
  document.head.append(compactCardsStylesheet);
}

const products = [
  { id: 1, slug: "macaw", productId: "macaw", name: "Macaw", price: 47, category: "Birds", image: "images/macaw.jpeg", description: "A vibrant Sunset Macaw inspired beaded design for bird lovers." },
  { id: 2, slug: "natalies-butterfly", name: "Natalie's Butterfly", price: 25, category: "Butterfly", image: "images/natalies-butterfly-mushroom.jpeg", description: "Inspired by Natalie's love for nature, this butterfly design is a delightful addition to any collection." },
  { id: 3, slug: "butterfly", name: "Butterfly Keychain", price: 20, category: "Butterfly", image: "images/butterfly-purple.jpg", description: "A charming butterfly keychain, handmade bead by bead." },
  { id: 4, slug: "butterfly-collection", name: "Butterflies Collection", price: 22, category: "Butterfly", image: "images/butterflies.jpeg", description: "A colourful collection of handmade butterfly designs." },
  { id: 5, slug: "flower-braided", name: "Flower Braided", price: 18, category: "Flower", image: "images/flower-braided.jpeg", description: "A delicate braided flower design." },
  { id: 6, slug: "big-flower", name: "Large Flower", price: 25, category: "Flower", image: "images/big-flower.jpeg", description: "A large handmade flower designed to make a statement." },
  { id: 7, slug: "deluxe-flower", name: "Intricated Flower", price: 25, category: "Flower", image: "images/intricated-flower.jpeg", description: "An intricate handmade flower for detail lovers." },
  { id: 8, slug: "butterfly-with-flowers", name: "Butterfly and Flower", price: 30, category: "Butterfly & Flower", image: "images/phoenix-butterfly-flower-braided.jpeg", description: "A detailed combination of butterfly and flower designs." },
  { id: 9, slug: "gecko", name: "Gecko Keychain", price: 20, category: "Animals", image: "images/gecko.jpeg", description: "A playful handmade gecko keychain." },
  { id: 10, slug: "baby-gecko", name: "Baby Gecko", price: 20, category: "Animals", image: "images/baby-gecko.jpeg", description: "A tiny handmade baby gecko keychain." },
  { id: 11, slug: "gecko-butterfly", name: "Gecko and Butterfly", price: 40, category: "Animals", image: "images/gecko-butterfly.jpeg", description: "A detailed combination of gecko and butterfly designs." },
  { id: 12, slug: "canada-flag", name: "Canada Flag", price: 20, category: "Flags", image: "images/canada-Flag.jpeg", description: "A handmade Canada flag design." },
  { id: 13, slug: "soccer-ball", name: "Soccer Ball", price: 20, category: "Sports", image: "images/soccer-ball.jpeg", description: "A handmade soccer ball design for sports fans." },
  { id: 14, slug: "turtle", name: "Turtle", price: 20, category: "Ocean Animals", image: "images/turtle.jpeg", description: "A cheerful handmade turtle keychain." },
  { id: 15, slug: "octopus", name: "Octopus", price: 30, category: "Ocean Animals", image: "images/octopus.jpeg", description: "A detailed handmade octopus keychain." },
  { id: 16, slug: "fish", productId: "fish", name: "Fish", price: 20, category: "Ocean Animals", image: "images/fish.jpeg", description: "A bright handmade beaded fish design." },
  { id: 20, slug: "crab", productId: "crab", name: "Crab", price: 25, category: "Sandy Beaches", image: "images/crab.jpeg", description: "A playful handmade crab design with coastal charm." },
  { id: 21, slug: "penguin", productId: "penguin", name: "Penguin", price: 20, category: "Ocean Animals", image: "images/penquin.jpeg", description: "A handmade penguin from the Arctic side of the ocean collection." },
  { id: 22, slug: "whale", productId: "whale", name: "Whale", price: 25, category: "Ocean Animals", image: "images/whale.jpeg", description: "A calm handmade whale design with deep-ocean charm." },
  { id: 23, slug: "jellyfish", productId: "jellyfish", name: "Jellyfish", price: 25, category: "Ocean Animals", image: "images/jellyfish.jpeg", description: "A graceful handmade jellyfish inspired by drifting sea light." },
  { id: 24, slug: "lobster", productId: "lobster", name: "Lobster", price: 25, category: "Ocean Animals", image: "images/lobster.jpeg", description: "A bright handmade lobster design with coastal character." },
  { id: 25, slug: "shark", productId: "shark", name: "Shark", price: 25, category: "Ocean Animals", image: "images/shark.jpeg", description: "A bold handmade shark design." },
  { id: 17, slug: "pencil", name: "Colouring Pencil", price: 20, category: "Back to School", image: "images/pencil.jpeg", description: "A handmade colouring pencil keychain." },
  { id: 19, slug: "faith-cross", productId: "faith-cross", name: "Faith Cross", price: 20, category: "Faith", image: "images/faith-cross.jpg", description: "A handmade purple-and-turquoise cross spelling FAITH." },
  { id: 33, slug: "joy-cross", productId: "joy-cross", name: "Joy Cross", price: 20, category: "Faith", image: "images/joy-cross.jpg", description: "A handmade blue-and-purple cross spelling JOY." },
  { id: 34, slug: "peace-cross", productId: "peace-cross", name: "Peace Cross", price: 20, category: "Faith", image: "images/peace-cross.jpg", description: "A handmade pink-and-white cross spelling PEACE." },
  { id: 26, slug: "ice-cream-keychain", productId: "ice-cream-keychain", name: "Ice Cream Keychain", price: 25, category: "Sweet Treats", image: "images/ice-cream.jpeg", description: "A handmade beaded ice cream keychain." },
  { id: 27, slug: "ladybug-backpack", name: "Ladybug Backpack", price: 25, category: "Tiny Garden Friends", image: "images/ladybug-backpack.jpeg", description: "A personalized handmade ladybug backpack keychain." },
  { id: 28, slug: "dragonfly-keychain", name: "Dragonfly Keychain", price: 25, category: "Tiny Garden Friends", image: "images/dragonfly-keychain.jpeg", description: "A colourful handmade dragonfly keychain with optional personalization." },
  { id: 29, slug: "unicorn", name: "Unicorn", price: 25, category: "Enchanted Beings", image: "images/unicorn.jpeg", description: "A magical handmade beaded unicorn, made to order in your favourite colours." },
  { id: 30, slug: "giraffe", productId: "giraffe", name: "Giraffe", price: 25, category: "Animals", image: "images/giraffe.jpg", description: "A personalized handmade beaded giraffe keychain." },
  { id: 31, slug: "ariel", productId: "ariel", name: "Ariel", price: 25, category: "Enchanted Beings", image: "images/ariel.jpg", description: "A handmade beaded mermaid keychain inspired by an undersea fairytale." },
  { id: 32, slug: "palm-tree", productId: "palm-tree", name: "Palm Tree", price: 20, category: "Sandy Beaches", image: "images/palm-tree.jpg", description: "A handmade beaded palm tree inspired by warm sandy shores." },
  { id: 35, slug: "fall-fox", name: "Fox", price: 25, category: "Fall Collection", image: "images/fall-collection/fox.jpg", createUrl: "create.html?design=custom-idea&idea=Fox#homeDesignBuilder", description: "A personalized handmade fox keychain." },
  { id: 36, slug: "fall-acorn", name: "Acorn", price: 20, category: "Fall Collection", image: "images/fall-collection/acorn.jpg", createUrl: "create.html?design=custom-idea&idea=Acorn#homeDesignBuilder", description: "A personalized handmade acorn keychain." },
  { id: 37, slug: "fall-maple-leaf", name: "Maple Leaf", price: 20, category: "Fall Collection", image: "images/fall-collection/maple-leaf.jpg", createUrl: "create.html?design=custom-idea&idea=Maple%20Leaf#homeDesignBuilder", description: "A personalized handmade maple leaf keychain." },
  { id: 38, slug: "fall-sunflower", name: "Sunflower", price: 25, category: "Fall Collection", image: "images/fall-collection/sunflower.jpg", createUrl: "create.html?design=custom-idea&idea=Sunflower#homeDesignBuilder", description: "A handmade sunflower keychain." },
  { id: 39, slug: "pumpkin-spice-latte", name: "Pumpkin Spice Latte", price: 45, category: "Fall Collection", image: "images/pumpkin-spice-latte-september-exclusive.jpg", createUrl: "create.html?design=pumpkin-spice-latte#homeDesignBuilder", description: "September Exclusive Pumpkin Spice Latte keychain." },
  { id: 40, slug: "owl", name: "Owl", price: 25, category: "Birds", collections: ["Birds", "Fall Collection"], image: "images/fall-collection/owl.jpg", createUrl: "create.html?design=custom-idea&idea=Owl#homeDesignBuilder", description: "A personalized handmade owl keychain." },
  { id: 41, slug: "fall-coffee-cup", name: "Coffee Cup", price: 25, category: "Fall Collection", image: "images/fall-collection/coffee-cup.jpg", createUrl: "create.html?design=custom-idea&idea=Coffee%20Cup#homeDesignBuilder", description: "A personalized handmade coffee cup keychain." }
]

function normalizeProductRecord(product) {
  return {
    ...product,
    name: product.name ?? product.title,
    image: product.image ?? product.imageUrl,
    price: product.pricePending ? null : (product.price ?? product.startingPrice),
    category: product.category ?? product.collection
  };
}

function productValidationDetails(product) {
  const missingFields = [];
  if (!String(product.name || "").trim()) missingFields.push("name/title");
  if (!String(product.image || "").trim()) missingFields.push("image/imageUrl");
  if (!product.pricePending && !Number.isFinite(Number(product.price))) missingFields.push("price/startingPrice");
  if (!String(product.category || "").trim()) missingFields.push("category/collection");
  return missingFields;
}

function warnInvalidProduct(product, missingField, attemptedImagePath = product.image || "(none)") {
  const page = decodeURIComponent(location.pathname.split("/").pop() || "index.html");
  const productLabel = product.name || product.title || product.slug || product.id || "unknown product";
  console.warn("[Forever Beaded] Product data warning", {
    page,
    product: productLabel,
    missingField,
    attemptedImagePath
  });
}

products.splice(0, products.length, ...products.map(normalizeProductRecord));

const CART_STORAGE_KEY = "foreverBeadedCart";
const CART_CHECKOUT_FLAG_KEY = "foreverBeadedCartCheckout";
const FAVOURITES_STORAGE_KEY = "foreverBeadedFavourites";
const MAX_CART_QUANTITY = 20;
const productById = new Map(products.map(product => [String(product.id), product]));
const CREATE_DESIGN_SLUG_ALIASES = {
  "flower-braided": "flower"
};

function createDesignUrl(product) {
  if (product.createUrl) return product.createUrl;
  const slug = CREATE_DESIGN_SLUG_ALIASES[product.slug] || product.slug;
  return `create.html?design=${encodeURIComponent(slug)}`;
}

let cart = loadCart();

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
let cartAddLocked = false;
let lastCartAdd = { productId: "", time: 0 };

function money(amount) {
  return `$${amount} CAD`;
}

function safeQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_CART_QUANTITY, Math.max(1, quantity));
}

function stableOptionsKey(options = {}) {
  const cleaned = {};
  Object.keys(options || {}).sort().forEach(key => {
    const value = options[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      cleaned[key] = String(value).trim();
    }
  });
  return JSON.stringify(cleaned);
}

function cartItemSignature(item) {
  if (item.isCustom) {
    return `custom:${item.name}:${item.price}:${stableOptionsKey(item.options)}:${item.description}`;
  }
  return `product:${item.productId || item.id}:${item.variantId || ""}:${stableOptionsKey(item.options)}`;
}

function findProductVariant(product, variantId) {
  if (!product || !Array.isArray(product.variants)) return null;
  return product.variants.find(variant => String(variant.id) === String(variantId)) || null;
}

function normalizeStoredCartItem(item) {
  if (!item || typeof item !== "object") return null;

  if (item.isCustom) {
    const price = Number(item.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    return {
      isCustom: true,
      name: String(item.name || "Custom Treasure").slice(0, 80),
      price,
      image: String(item.image || "images/custom-idea.jpeg"),
      description: String(item.description || "").slice(0, 280),
      quantity: safeQuantity(item.quantity),
      options: item.options && typeof item.options === "object" ? item.options : {},
      availability: "made to order"
    };
  }

  if (item.variantOf && item.variantId) {
    const baseProduct = productById.get(String(item.variantOf));
    const variant = findProductVariant(baseProduct, item.variantId);
    if (!baseProduct || !variant) return null;
    return {
      id: `${baseProduct.id}:${variant.id}`,
      productId: variant.productId,
      variantOf: baseProduct.id,
      variantId: variant.id,
      name: variant.name,
      price: baseProduct.price,
      category: baseProduct.category,
      image: variant.image || baseProduct.image,
      imageFocusClass: variant.focusClass || "",
      description: `${variant.name} from the Fish, Crab and Penguin collection.`,
      quantity: safeQuantity(item.quantity),
      options: {
        ...(item.options && typeof item.options === "object" ? item.options : {}),
        animal: variant.name
      },
      availability: "made to order"
    };
  }

  const product = productById.get(String(item.id))
    || productById.get(String(item.productId))
    || products.find(productRecord => String(productRecord.slug || productRecord.productId || "") === String(item.productId || item.slug || ""));
  if (!product) return null;
  return {
    ...product,
    productId: product.slug || product.productId || product.id,
    quantity: safeQuantity(item.quantity),
    options: item.options && typeof item.options === "object" ? item.options : {},
    availability: "made to order"
  };
}

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeStoredCartItem).filter(Boolean);
  } catch (error) {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

let activeShopCategory = "All";
let activeShopSearch = "";
let favouriteProductIds = loadFavouriteProductIds();

function favouriteKey(product) {
  return String(product?.slug || product?.productId || product?.id || "");
}

function loadFavouriteProductIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVOURITES_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return new Set();
    const validKeys = new Set(products.map(favouriteKey).filter(Boolean));
    return new Set(parsed.map(String).filter(key => validKeys.has(key)));
  } catch (error) {
    localStorage.removeItem(FAVOURITES_STORAGE_KEY);
    return new Set();
  }
}

function saveFavouriteProductIds() {
  localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify([...favouriteProductIds]));
}

function isFavouriteProduct(product) {
  return favouriteProductIds.has(favouriteKey(product));
}

function favouriteButtonMarkup(product) {
  const saved = isFavouriteProduct(product);
  const label = saved ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`;
  const heart = saved ? "&#9829;" : "&#9825;";
  return `<button class="favourite-btn${saved ? " is-saved" : ""}" type="button" data-favourite-product-id="${product.id}" aria-label="${escapeHtml(label)}" aria-pressed="${saved ? "true" : "false"}"><span aria-hidden="true">${heart}</span></button>`;
}

function toggleFavouriteProduct(productId) {
  const product = products.find(item => String(item.id) === String(productId));
  if (!product) return;
  const key = favouriteKey(product);
  if (favouriteProductIds.has(key)) {
    favouriteProductIds.delete(key);
  } else {
    favouriteProductIds.add(key);
  }
  saveFavouriteProductIds();
  renderProducts();
}

function collectionDisplayOrder(categories) {
  const reordered = categories.filter(category => !["Flags", "Sports", "Monthly Exclusives"].includes(category));
  const flagsIndex = categories.indexOf("Flags");
  const insertionIndex = flagsIndex < 0
    ? reordered.length
    : categories.slice(0, flagsIndex).filter(category => !["Flags", "Sports", "Monthly Exclusives"].includes(category)).length;
  reordered.splice(insertionIndex, 0, "Flags", "Sports", "Monthly Exclusives");
  return reordered;
}

function getProductCategories() {
  const categories = [...new Set(products
    .map(product => product.category)
    .filter(category => category !== "Butterfly & Flower"))];
  return ["All", "My Favourites", ...collectionDisplayOrder(categories)];
}

function productMatchesShopFilters(product) {
  const categoryMatch = activeShopCategory === "All" ||
    (activeShopCategory === "My Favourites" ? isFavouriteProduct(product) :
    product.category === activeShopCategory);
  const searchText = `${product.name} ${product.category} ${product.description}`.toLowerCase();
  const searchMatch = !activeShopSearch || searchText.includes(activeShopSearch.toLowerCase());
  return categoryMatch && searchMatch;
}

function productImageClass(product) {
  return [
    "product-image",
    product.requiresVariantSelection ? "variant-product-image" : "",
    product.defaultFocusClass || ""
  ].filter(Boolean).join(" ");
}

function variantSelectorMarkup(product) {
  if (!product.requiresVariantSelection || !Array.isArray(product.variants)) return "";
  return `
    <label class="product-variant-field">
      <span>Choose your animal</span>
      <select class="product-variant-select" data-product-id="${product.id}" required>
        <option value="">Choose your animal</option>
        ${product.variants.map(variant => `<option value="${variant.id}">${escapeHtml(variant.name)}</option>`).join("")}
      </select>
    </label>
  `;
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
    console.info(message);
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
  cart = cart.map(normalizeStoredCartItem).filter(Boolean);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function setPageScrollLocked(locked) {
  document.body.classList.toggle("cart-open", Boolean(locked));
}

function openCart() {
  if (!cartPanel) return;
  cartPanel.classList.add("open");
  cartPanel.setAttribute("aria-hidden", "false");
  setPageScrollLocked(true);
}

function closeCart() {
  if (!cartPanel) return;
  cartPanel.classList.remove("open");
  cartPanel.setAttribute("aria-hidden", "true");
  setPageScrollLocked(false);
}

function setCartFeedback(message) {
  if (!cartPanel) return;
  let feedback = cartPanel.querySelector(".cart-feedback");
  if (!feedback) {
    feedback = document.createElement("p");
    feedback.className = "cart-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    cartPanel.insertBefore(feedback, cartItems || cartPanel.firstChild);
  }
  feedback.textContent = message || "";
}

function ensureCartActions() {
  if (!cartPanel || cartPanel.querySelector("#continueShoppingBtn")) return;
  const continueButton = document.createElement("button");
  continueButton.id = "continueShoppingBtn";
  continueButton.className = "continue-shopping-btn";
  continueButton.type = "button";
  continueButton.textContent = "Continue Shopping";
  const checkoutButton = document.getElementById("buyNowBtn");
  cartPanel.insertBefore(continueButton, checkoutButton || null);
}


const COLLECTION_THEME_CLASSES = [
  "is-meadow-active",
  "is-butterfly-garden-active",
  "is-garden-active",
  "is-ocean-active",
  "is-forest-active",
  "is-desk-active",
  "is-chapel-active",
  "is-game-active",
  "is-sky-active",
  "is-sundae-active",
  "is-flags-active",
  "is-enchanted-active",
  "is-tiny-garden-active",
  "is-all-active",
  "is-favourites-active"
];

const COLLECTION_THEME_BY_CATEGORY = {
  All: "is-all-active",
  "My Favourites": "is-favourites-active",
  Butterfly: "is-butterfly-garden-active",
  Flower: "is-garden-active",
  "Ocean Animals": "is-ocean-active",
  Animals: "is-forest-active",
  "Back to School": "is-desk-active",
  Faith: "is-chapel-active",
  Sports: "is-game-active",
  Birds: "is-sky-active",
  "Monthly Exclusives": "is-sundae-active",
  Flags: "is-flags-active",
  "Enchanted Beings": "is-enchanted-active",
  "Tiny Garden Friends": "is-tiny-garden-active"
};

const NEXT_COLLECTION_CHAPTERS = {
  All: { label: "Butterflies", category: "Butterfly" },
  "My Favourites": { label: "Butterflies", category: "Butterfly" },
  Butterfly: { label: "Flowers", category: "Flower" },
  Flower: { label: "Ocean Animals", category: "Ocean Animals" },
  "Ocean Animals": { label: "Animals", category: "Animals" },
  Animals: { label: "Birds of the Sky", category: "Birds" },
  Birds: { label: "Flags of the World", category: "Flags" },
  Flags: { label: "Enchanted Beings", category: "Enchanted Beings" },
  "Enchanted Beings": { label: "Tiny Garden Friends", category: "Tiny Garden Friends" },
  "Tiny Garden Friends": { label: "Back to School", category: "Back to School" },
  "Back to School": { label: "Faith", category: "Faith" },
  Faith: { label: "Sports", category: "Sports" },
  Sports: { label: "Monthly Exclusive", href: "monthly-exclusive.html?v=september-2026" },
  "Monthly Exclusives": { label: "Create Your Own", href: "create.html?design=custom-idea&idea=Pumpkin%20Spice%20Latte#homeDesignBuilder" }
};


const COLLECTION_WORLD_COPY = {
  Butterfly: { title: "The Butterfly Flower Garden", description: "Wander through a garden filled with blossoms, petals, and handmade butterflies." },
  Flower: { title: "The Flower Garden", description: "A blooming garden chapter for floral treasures, soft petals, and colourful keepsakes." },
  Animals: { title: "The Forest Friends", description: "Step beneath the trees among ferns, mushrooms, moss, and playful woodland treasures." },
  "Ocean Animals": { title: "The Ocean Shore", description: "Begin on a sandy beach with seashells along the shore, then follow the waves into the sea." },
  Birds: { title: "Birds of the Sky", description: "Look up into the open blue sky, drifting clouds, and leafy branches." },
  Flags: { title: "Flags of the World", description: "Celebrate any country with a handmade flag treasure.", detail: "Choose any country flag — Canada is simply the sample shown in the collection." },
  "Enchanted Beings": { title: "Enchanted Beings", description: "Enter a moonlit world of unicorns, glowing flowers, and handmade magic." },
  "Tiny Garden Friends": { title: "Tiny Garden Friends", description: "Look closely among the leaves, mushrooms, and flowers for charming little handmade friends." },
  "Back to School": { title: "The Creative Classroom", description: "A cosy classroom filled with pencils, books, beads, and bright ideas." },
  Faith: { title: "The Peaceful Bible Garden", description: "A quiet chapter of faith, warm light, and meaningful handmade keepsakes." },
  Sports: { title: "The Sports Field", description: "A lively field for favourite teams, games, and sporty treasures." },
  "Monthly Exclusives": { title: "September's Pumpkin Spice Latte", description: "Discover September's cozy fall-inspired handmade treasure." }
};

function updateCollectionWorldCopy() {
  const title = document.getElementById("collectionWorldTitle");
  const description = document.getElementById("collectionWorldDescription");
  const detail = document.getElementById("collectionWorldDetail");
  if (!title || !description) return;
  const copy = COLLECTION_WORLD_COPY[activeShopCategory];
  title.textContent = copy ? copy.title : "Browse handmade pieces";
  description.textContent = copy ? copy.description : "Search and filter the current Forever Beaded collection without leaving the storybook.";
  if (detail) {
    detail.textContent = copy?.detail || "";
    detail.hidden = !copy?.detail;
  }
}

function updateCollectionChapterTheme() {
  if (!productGrid) return;
  const shopSection = productGrid.closest(".ocean-shop-section");
  if (!shopSection) return;
  shopSection.classList.remove(...COLLECTION_THEME_CLASSES);
  const themeClass = COLLECTION_THEME_BY_CATEGORY[activeShopCategory];
  if (themeClass) shopSection.classList.add(themeClass);
}

function updateNextCollectionChapter() {
  const target = document.getElementById("nextCollectionChapter");
  if (!target) return;
  const next = NEXT_COLLECTION_CHAPTERS[activeShopCategory] || NEXT_COLLECTION_CHAPTERS.All;
  if (!next) {
    target.innerHTML = "";
    return;
  }
  if (next.href) {
    target.innerHTML = `<a class="next-chapter-anchor" href="${next.href}"><span>Next Chapter</span><strong>${next.label}</strong></a>`;
    return;
  }
  target.innerHTML = `<a class="next-chapter-anchor" href="#shop" data-jump-category="${next.category}"><span>Next Chapter</span><strong>${next.label}</strong></a>`;
}
function renderProducts() {
  if (!productGrid) return;

  updateCollectionChapterTheme();
  updateCollectionWorldCopy();

  renderShopFilters();

  const visibleProducts = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) => productMatchesShopFilters(product))
    .filter(({ product }) => {
      const missingFields = productValidationDetails(product);
      if (missingFields.length) {
        missingFields.forEach(field => warnInvalidProduct(product, field));
        return false;
      }
      return true;
    });

  if (shopResultsCount) {
    const label = activeShopCategory === "All" ? "all categories" : activeShopCategory;
    shopResultsCount.textContent = visibleProducts.length
      ? `Showing ${visibleProducts.length} handmade piece${visibleProducts.length === 1 ? "" : "s"} in ${label}`
      : "No pieces matched that search yet.";
  }

  if (!visibleProducts.length) {
    updateNextCollectionChapter();
    productGrid.innerHTML = `
      <div class="no-results-card">
        <h3>${activeShopCategory === "My Favourites" ? "No favourites saved yet" : "No matching pieces yet"}</h3>
        <p>${activeShopCategory === "My Favourites" ? "Tap the heart on any product to save it here for later." : "Try another search, choose a different category, or use the custom order builder and I can make something just for you."}</p>
        <a href="shop.html#designer" class="primary-btn">Create Custom Order</a>
      </div>
    `;
    return;
  }

  updateNextCollectionChapter();
  productGrid.innerHTML = visibleProducts.map(({ product, index }) => {
    const createUrl = createDesignUrl(product);
    return `
      <article class="product-card" data-category="${product.category}" data-create-url="${createUrl}">
        <a class="product-card-link" href="${createUrl}" aria-label="View ${escapeHtml(product.name)}${product.pricePending ? "" : `, ${money(product.price)}`}">
          <img src="${product.image}" alt="${product.name}" data-product-card-image="${product.id}">
          <span class="product-name">${product.name}</span>
          ${product.pricePending ? "" : `<span class="product-price">${money(product.price)}</span>`}
        </a>
        ${favouriteButtonMarkup(product)}
      </article>
    `;
  }).join("");

  productGrid.querySelectorAll(".product-card img").forEach(image => {
    image.addEventListener("error", () => {
      const card = image.closest(".product-card");
      const name = card?.querySelector(".product-name")?.textContent?.trim() || "unknown product";
      const product = products.find(item => item.name === name) || { name };
      warnInvalidProduct(product, "image file", image.getAttribute("src") || "(none)");
      card?.remove();
    }, { once: true });
  });
}

function renderGallery(category = "All") {
  if (!galleryGrid) return;

  const productCategories = [...new Set(products
    .map(product => product.category)
    .filter(productCategory => productCategory !== "Butterfly & Flower"))];
  const categories = ["All", ...collectionDisplayOrder(productCategories)];

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
    const createUrl = createDesignUrl(product);
    return `
      <article class="gallery-card" data-create-url="${createUrl}">
        <img src="${product.image}" alt="${product.name}" class="${productImageClass(product).replace("product-image", "gallery-image")}" data-product-card-image="${product.id}">
        <div class="gallery-info">
          <span class="badge">${product.id === 1 ? "Most Loved" : "Customer Favorite"}</span>
          <h3>${product.name}</h3>
          <div class="stars"><strong>Made to order</strong> <span>Customer photos welcome</span></div>
          <div class="social-row">Handmade to order</div>
          <p>${product.description}</p>
          ${product.pricePending ? "" : `<strong>${money(product.price)}</strong>`}
          ${variantSelectorMarkup(product)}
          ${product.pricePending ? "" : `<button class="add-to-cart-btn" data-product-id="${product.id}"${product.requiresVariantSelection ? " disabled" : ""}>Add to My Request</button>`}
          <a class="product-create-request-btn" href="${createUrl}">Create Your Own Treasure</a>
        </div>
      </article>
    `;
  }).join("");
}

function cartItemFromProduct(product, variant = null) {
  if (variant) {
    return {
      id: `${product.id}:${variant.id}`,
      productId: variant.productId,
      variantOf: product.id,
      variantId: variant.id,
      name: variant.name,
      price: product.price,
      category: product.category,
      image: variant.image || product.image,
      imageFocusClass: variant.focusClass || "",
      description: `${variant.name} from the Fish, Crab and Penguin collection.`,
      quantity: 1,
      options: { animal: variant.name },
      availability: "made to order"
    };
  }

  return {
    ...product,
    productId: product.slug || product.productId || product.id,
    quantity: 1,
    options: {},
    availability: "made to order"
  };
}

function mergeCartItem(item) {
  const signature = cartItemSignature(item);
  const existing = cart.find(cartItem => cartItemSignature(cartItem) === signature);
  if (existing) {
    existing.quantity = safeQuantity((existing.quantity || 1) + (item.quantity || 1));
    return existing;
  }
  cart.push(item);
  return item;
}

function getSelectedVariantForButton(product, button) {
  if (!product?.requiresVariantSelection) return null;
  const card = button?.closest(".product-card, .gallery-card");
  const select = card?.querySelector(`.product-variant-select[data-product-id="${product.id}"]`);
  const variant = findProductVariant(product, select?.value);
  if (!variant) {
    setCartFeedback("Please choose Fish, Crab, or Penguin before adding to cart.");
    return null;
  }
  return variant;
}

function addProductToCart(product, button) {
  if (!product) return;
  const selectedVariant = getSelectedVariantForButton(product, button);
  if (product.requiresVariantSelection && !selectedVariant) return;

  const addKey = selectedVariant ? `${product.id}:${selectedVariant.id}` : String(product.id);
  const now = Date.now();
  if (lastCartAdd.productId === addKey && now - lastCartAdd.time < 1400) return;
  if (cartAddLocked) return;

  cartAddLocked = true;
  lastCartAdd = { productId: addKey, time: now };
  if (button) {
    button.disabled = true;
    button.textContent = "Added to My Request";
  }

  const addedItem = mergeCartItem(cartItemFromProduct(product, selectedVariant));
  saveCart();
  renderCart();
  sessionStorage.setItem(CART_CHECKOUT_FLAG_KEY, "true");
  setCartFeedback(product.id === 1 ? "Macaw added to your treasure request" : `${addedItem.name} added to your treasure request`);
  console.log("Add to request:", addedItem.name);
  const checkoutUrl = new URL("create.html", window.location.href);
  checkoutUrl.searchParams.set("checkout", "cart");
  checkoutUrl.hash = "homeDesignBuilder";

  window.setTimeout(() => {
    cartAddLocked = false;
    if (button) button.disabled = false;
    window.location.assign(checkoutUrl.href);
  }, 550);
}

function addToCartByProductId(productId, button) {
  const product = products.find(item => String(item.id) === String(productId));
  addProductToCart(product, button);
}

function addToCart(index, button) {
  addProductToCart(products[index], button);
}

function syncVariantSelection(select) {
  if (!select) return;
  const product = products.find(item => String(item.id) === String(select.dataset.productId));
  const variant = findProductVariant(product, select.value);
  const card = select.closest(".product-card, .gallery-card");
  const button = card?.querySelector(".add-to-cart-btn");
  const image = card?.querySelector(`[data-product-card-image="${product?.id}"]`);

  if (button) button.disabled = !variant;
  if (image && product) {
    image.src = variant?.image || product.image;
    image.alt = variant ? variant.name : product.name;
    Array.from(image.classList)
      .filter(className => className.startsWith("focus-"))
      .forEach(className => image.classList.remove(className));
    if (variant?.focusClass) image.classList.add(variant.focusClass);
  }
}

function addCustomToCart() {
  if (!document.getElementById("designType")) return;
  const design = document.getElementById("designType").value;
  const colours = document.getElementById("colours").value;
  const name = document.getElementById("customName").value || "None";
  const keychain = document.getElementById("keychainType").value;
  const price = calculateCustomPrice();

  const customItem = {
    isCustom: true,
    name: `Custom ${design}`,
    price,
    image: "images/custom-idea.jpeg",
    description: `Colours: ${colours}. Name: ${name}. Type: ${keychain}.`,
    quantity: 1,
    availability: "made to order",
    options: { design, colours, personalizationText: name, hardware: keychain }
  };

  mergeCartItem(customItem);
  saveCart();
  renderCart();
  openCart();
  setCartFeedback(`${customItem.name} added to your treasure order`);
}

function renderCart() {
  if (!cartItems || !cartTotal) return;
  if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = money(0);
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-image ${escapeHtml(item.imageFocusClass || "")}">` : ""}
      <strong>${escapeHtml(item.name)}</strong>
      <p>${escapeHtml(item.description)}</p>
      <p>${escapeHtml(item.availability || "Made to order")} · Quantity: ${item.quantity || 1}</p>
      <p>${money(item.price * (item.quantity || 1))}</p>
      <button class="remove-btn" data-index="${index}">Remove</button>
    </div>
  `).join("");

  const total = calculateCartTotal();
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

function renderCart() {
  if (!cartItems || !cartTotal) return;
  ensureCartActions();
  if (cartCount) cartCount.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = money(0);
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-image ${escapeHtml(item.imageFocusClass || "")}">` : ""}
      <strong>${escapeHtml(item.name)}</strong>
      <p>${escapeHtml(item.description)}</p>
      ${item.options && Object.keys(item.options).length ? `<p>${escapeHtml(Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(" | "))}</p>` : ""}
      <p>${escapeHtml(item.availability || "Made to order")}</p>
      <p>Unit price: ${money(item.price)}</p>
      <div class="cart-quantity-controls" aria-label="Quantity controls for ${escapeHtml(item.name)}">
        <button class="quantity-btn" type="button" data-cart-action="decrease" data-index="${index}" aria-label="Decrease ${escapeHtml(item.name)} quantity">-</button>
        <span>Quantity: ${item.quantity || 1}</span>
        <button class="quantity-btn" type="button" data-cart-action="increase" data-index="${index}" aria-label="Increase ${escapeHtml(item.name)} quantity">+</button>
      </div>
      <p>Line total: ${money(item.price * (item.quantity || 1))}</p>
      <button class="remove-btn" data-index="${index}">Remove</button>
    </div>
  `).join("");

  cartTotal.textContent = money(calculateCartTotal());
}

function updateCartQuantity(index, change) {
  const item = cart[index];
  if (!item) return;
  const nextQuantity = (item.quantity || 1) + change;
  if (nextQuantity <= 0) {
    removeFromCart(index);
    return;
  }
  item.quantity = safeQuantity(nextQuantity);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  localStorage.removeItem(CART_STORAGE_KEY);
  renderCart();
  setCartFeedback("Your treasure order cart is empty.");
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
  const favouriteButton = event.target.closest(".favourite-btn");
  if (favouriteButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavouriteProduct(favouriteButton.dataset.favouriteProductId);
    return;
  }

  const addButton = event.target.closest(".add-to-cart-btn");
  if (addButton) {
    if (addButton.dataset.productId) {
      addToCartByProductId(addButton.dataset.productId, addButton);
    } else {
      addToCart(Number(addButton.dataset.index), addButton);
    }
    return;
  }

  const removeButton = event.target.closest(".remove-btn");
  if (removeButton) {
    removeFromCart(Number(removeButton.dataset.index));
    return;
  }

  const quantityButton = event.target.closest("[data-cart-action]");
  if (quantityButton) {
    const change = quantityButton.dataset.cartAction === "increase" ? 1 : -1;
    updateCartQuantity(Number(quantityButton.dataset.index), change);
    return;
  }

  if (event.target.closest("#continueShoppingBtn")) {
    closeCart();
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

document.addEventListener("change", (event) => {
  const variantSelect = event.target.closest(".product-variant-select");
  if (variantSelect) {
    syncVariantSelection(variantSelect);
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
  if (item.productId && !/^\d+$/.test(String(item.productId))) return String(item.productId);
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
    14: "turtle",
    15: "octopus",
    16: "fish",
    17: "pencil",
    18: "pencil",
    19: "cross",
    20: "crab",
    22: "whale",
    23: "jellyfish",
    24: "lobster",
    25: "shark"
  };
  if (item.id && legacyMap[item.id]) return legacyMap[item.id];
  const design = String(item.name || item.description || "").toLowerCase();
  if (design.includes("macaw")) return "macaw";
  if (design.includes("butterfly") && design.includes("flower")) return "butterfly-with-flowers";
  if (design.includes("butterfly")) return "butterfly";
  if (design.includes("flower")) return "flower";
  if (design.includes("gecko")) return "gecko";
  if (design.includes("turtle")) return "turtle";
  if (design.includes("octopus")) return "octopus";
  if (design.includes("fish")) return "fish";
  if (design.includes("crab")) return "crab";
  if (design.includes("penguin")) return "penguin";
  if (design.includes("soccer") || design.includes("sport")) return "sports-design";
  if (design.includes("pencil")) return "pencil";
  if (design.includes("cross")) return "cross";
  return "custom-idea";
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
    items: orderItems.map(item => {
      const personalizationText = item.personalizationText || item.personalization || "";
      const personalizationType = item.personalizationType || (personalizationText ? "name" : "none");
      return {
        productId: productIdForOrderItem(item),
        design: item.name,
        colours: item.colours || item.colors || "",
        personalization: personalizationText,
        personalizationType,
        personalizationText,
        customDescription: item.customDescription || item.description || item.name || "",
        hardware: item.hardware || item.keychainType || "",
        quantity: item.quantity || 1
      };
    }),
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

  const button = document.getElementById("buyNowBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "Opening checkout...";
  }

  saveCart();
  sessionStorage.setItem(CART_CHECKOUT_FLAG_KEY, "true");
  closeCart();
  const checkoutUrl = new URL("create.html", window.location.href);
  checkoutUrl.searchParams.set("checkout", "cart");
  checkoutUrl.hash = "homeDesignBuilder";
  window.location.assign(checkoutUrl.href);
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
    closeCart();
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

const pageInitialCategory = document.body?.dataset?.initialCategory;
const urlInitialCategory = new URLSearchParams(window.location.search).get("category");
if (productGrid && (pageInitialCategory || urlInitialCategory)) {
  activeShopCategory = pageInitialCategory || urlInitialCategory;
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

  const productCard = img.closest(".product-card");
  if (productCard?.dataset.createUrl) {
    window.location.href = productCard.dataset.createUrl;
    return;
  }

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


// Customer review area. Only approved review data should be displayed publicly.
const reviewForm = document.getElementById("reviewForm");
const reviewGrid = document.getElementById("reviewGrid");
const reviewFormStatus = document.getElementById("reviewFormStatus");
const approvedReviews = Array.isArray(window.FOREVER_BEADED_APPROVED_REVIEWS)
  ? window.FOREVER_BEADED_APPROVED_REVIEWS
  : [];

function starsText(value) {
  const stars = Math.min(5, Math.max(1, Number(value) || 5));
  return `${stars} out of 5 stars`;
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}

function renderReviews() {
  if (!reviewGrid) return;
  const publicReviews = approvedReviews.filter(review => review && review.approved === true);
  if (!publicReviews.length) {
    reviewGrid.innerHTML = `
      <article class="review-card empty-review">
        <div class="review-stars" aria-label="No approved reviews yet">No approved reviews yet</div>
        <p>Real customer reviews will appear here after they have been approved for public display.</p>
        <strong>Forever Beaded</strong>
      </article>
    `;
    return;
  }

  reviewGrid.innerHTML = publicReviews.map(review => {
    const name = escapeHtml(review.displayName || review.name || "Forever Beaded customer");
    const product = String(review.product || "").trim();
    const date = formatReviewDate(review.date || review.createdAt);
    const photo = review.photoUrl || review.productPhotoUrl;
    return `
      <article class="review-card approved-review-card">
        ${photo ? `<img class="review-photo" src="${escapeHtml(photo)}" alt="${product ? escapeHtml(product) : "Approved customer review photo"}">` : ""}
        <div class="review-stars" aria-label="${Number(review.stars) || 5} out of 5 stars">${starsText(review.stars)}</div>
        <p>&quot;${escapeHtml(review.text || "")}&quot;</p>
        <strong>${name}</strong>
        ${product ? `<span class="review-product">${escapeHtml(product)}</span>` : ""}
        ${date ? `<time class="review-date" datetime="${escapeHtml(review.date || review.createdAt)}">${date}</time>` : ""}
      </article>
    `;
  }).join("");
}

if (reviewForm) {
  reviewForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = document.getElementById("reviewName")?.value.trim();
    const email = document.getElementById("reviewEmail")?.value.trim();
    const text = document.getElementById("reviewText")?.value.trim();
    const consent = document.getElementById("reviewConsent")?.checked;
    if (!name || !email || !text || !consent) return;
    reviewForm.reset();
    if (reviewFormStatus) {
      reviewFormStatus.textContent = "Thank you. Your review has been prepared for approval before it appears publicly.";
    }
    showForeverBeadedMessage("Thank you. Your review will need approval before it appears publicly.");
  });
}

const backToTop = document.getElementById("backToTop");
if (backToTop) {
  backToTop.textContent = "\u2191 Back to Top";
  backToTop.setAttribute("aria-label", "Back to top");
  window.addEventListener("scroll", () => {
    backToTop.classList.toggle("show", window.scrollY > 500);
  });
  backToTop.addEventListener("click", () => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    window.scrollTo({ top: 0, behavior });
  });
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
