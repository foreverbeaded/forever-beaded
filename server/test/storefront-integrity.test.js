const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..", "..");

function loadCatalogue() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(projectRoot, "js", "product-catalogue.js"), "utf8"),
    context,
    { filename: "product-catalogue.js" }
  );
  return context.window.FOREVER_BEADED_PRODUCTS;
}

function decodeHtml(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&rsquo;", "’")
    .replaceAll("&quot;", '"');
}

function extractStaticProductCards() {
  return fs.readdirSync(projectRoot)
    .filter(file => file.endsWith(".html"))
    .flatMap((file) => {
      const html = fs.readFileSync(path.join(projectRoot, file), "utf8");
      return [...html.matchAll(/<article class="product-card"[\s\S]*?<\/article>/g)]
        .map(match => match[0])
        .map((card) => {
          const href = decodeHtml(card.match(/class="product-card-link"[^>]*href="([^"]+)"/)?.[1]);
          const image = decodeHtml(card.match(/<img[^>]*src="([^"]+)"/)?.[1]);
          const name = decodeHtml(card.match(/class="product-name">([^<]+)</)?.[1]?.trim());
          const priceLabel = card.match(/class="product-price">\$([\d.]+)\s+CAD</)?.[1];
          if (!href || !name || !priceLabel) return null;
          const url = new URL(href, "https://foreverbeaded.ca/");
          return {
            file,
            slug: url.searchParams.get("design"),
            image,
            name,
            priceCents: Math.round(Number(priceLabel) * 100)
          };
        })
        .filter(Boolean);
    });
}

test("trusted catalogue has unique active identities and valid local images", () => {
  const catalogue = loadCatalogue();
  const activeProducts = catalogue.filter(product => product.active !== false && product.slug !== "custom-idea");

  assert.equal(new Set(catalogue.map(product => product.id)).size, catalogue.length, "duplicate trusted product ID");
  assert.equal(new Set(catalogue.map(product => product.slug)).size, catalogue.length, "duplicate trusted product slug");
  assert.equal(activeProducts.length, 80);

  activeProducts.forEach((product) => {
    assert.ok(product.basePriceCents > 0, `${product.slug} must have a positive trusted price`);
    assert.ok(product.imageUrl, `${product.slug} must have a trusted image`);
    assert.ok(
      fs.existsSync(path.join(projectRoot, product.imageUrl)),
      `${product.slug} image does not exist: ${product.imageUrl}`
    );
  });
});

test("every static storefront card matches its exact trusted design", () => {
  const catalogue = loadCatalogue();
  const bySlug = new Map(catalogue.map(product => [product.slug, product]));
  const cards = extractStaticProductCards();

  assert.ok(cards.length > 0, "expected static storefront cards");
  cards.forEach((card) => {
    assert.notEqual(card.slug, "custom-idea", `${card.file}: ${card.name} must not route to Custom Idea`);
    const product = bySlug.get(card.slug);
    assert.ok(product, `${card.file}: ${card.name} uses unknown design slug ${card.slug}`);
    assert.equal(card.name, product.name, `${card.file}: ${card.slug} name mismatch`);
    assert.equal(card.priceCents, product.basePriceCents, `${card.file}: ${card.slug} price mismatch`);
    assert.ok(
      [product.imageUrl, product.referenceImageUrl, product.previewImageUrl].includes(card.image),
      `${card.file}: ${card.slug} image mismatch`
    );
  });
});

test("dynamic storefront rendering is sourced from the trusted catalogue", () => {
  const appSource = fs.readFileSync(path.join(projectRoot, "js", "app.js"), "utf8");
  assert.match(appSource, /window\.FOREVER_BEADED_PRODUCTS/);
  assert.doesNotMatch(appSource, /CREATE_DESIGN_SLUG_ALIASES/);
});

test("newly reconciled storefront designs use the same trusted server prices", () => {
  const { getSeedProduct } = require("../catalogue");
  const expectedPrices = {
    "flower-braided": 1800,
    "intricated-flower": 2500,
    "butterfly-and-flower": 3000,
    apple: 2500,
    "abc-blocks": 2500,
    backpack: 2500,
    "school-bus": 2500,
    ruler: 2500,
    calculator: 2500,
    "glue-bottle": 2500,
    scissors: 2500,
    "lunch-box": 2500,
    "stack-of-books": 2500,
    owl: 2500,
    "personalized-faith-heart-keychain": 3000,
    "fall-fox": 2500,
    "fall-acorn": 2000,
    "fall-maple-leaf": 2000,
    "fall-sunflower": 2500,
    "fall-coffee-cup": 2500,
    "fall-leaves-keychain": 2500,
    "spider-man": 4000,
    "spider-man-version-1": 4000
  };

  Object.entries(expectedPrices).forEach(([slug, priceCents]) => {
    const product = getSeedProduct(slug);
    assert.ok(product, `${slug} is missing from the server catalogue`);
    assert.equal(product.basePriceCents, priceCents, `${slug} server price mismatch`);
  });
});
