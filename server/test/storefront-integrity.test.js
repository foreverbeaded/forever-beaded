const assert = require("node:assert/strict");
const crypto = require("node:crypto");
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
  assert.equal(activeProducts.length, 95);

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
    "personalized-scripture-cross-keychain": 3000,
    "fall-fox": 2500,
    "fall-acorn": 2000,
    "fall-maple-leaf": 2000,
    "fall-sunflower": 2500,
    "fall-coffee-cup": 2500,
    "fall-leaves-keychain": 2500,
    "spider-man": 4000,
    "spider-man-version-1": 4000,
    tiger: 3000,
    "flower-beaded-lanyard": 4500,
    "autumn-tree": 2500,
    "cinnamon-roll": 2000,
    "pie-slice": 2000,
    "cozy-sweater": 2000,
    scarf: 2000,
    "rain-boots": 2000,
    umbrella: 2000,
    "hot-chocolate": 2000,
    pinecone: 2000,
    squirrel: 2000
  };

  Object.entries(expectedPrices).forEach(([slug, priceCents]) => {
    const product = getSeedProduct(slug);
    assert.ok(product, `${slug} is missing from the server catalogue`);
    assert.equal(product.basePriceCents, priceCents, `${slug} server price mismatch`);
  });
});

test("Animal Friends retains its exact trusted cross-collection identities", () => {
  const catalogue = loadCatalogue();
  const tiger = catalogue.find(product => product.slug === "tiger");
  const squirrel = catalogue.find(product => product.slug === "squirrel");
  const fox = catalogue.find(product => product.slug === "fall-fox");
  const owl = catalogue.find(product => product.slug === "owl");

  assert.equal(catalogue.filter(product => product.slug === "tiger").length, 1);
  assert.equal(catalogue.filter(product => product.slug === "squirrel").length, 1);
  assert.equal(tiger?.active, true);
  assert.equal(tiger?.basePriceCents, 3000);
  assert.equal(tiger?.imageUrl, "etsy/images-branded/tiger-safari-owner-approved.jpg");
  assert.ok(Array.isArray(tiger?.previewPattern) && tiger.previewPattern.length > 0);
  assert.deepEqual(Array.from(tiger?.defaultColours || []), ["orange", "black", "white"]);
  assert.equal(squirrel?.basePriceCents, 2000);
  assert.deepEqual(Array.from(squirrel?.collections || []), ["Fall Collection", "Animals"]);
  assert.equal(catalogue.filter(product => product.slug === "fall-fox").length, 1);
  assert.equal(fox?.id, 152);
  assert.equal(fox?.basePriceCents, 2500);
  assert.equal(fox?.imageUrl, "images/fall-collection/fox.jpg");
  assert.deepEqual(Array.from(fox?.collections || []), ["Fall Collection", "Animals"]);
  assert.equal(owl?.category, "Birds");
  assert.equal((owl?.collections || []).includes("Animals"), false);

  const animalNames = Array.from(catalogue
    .filter(product => product.active !== false)
    .filter(product => product.category === "Animals" || (product.collections || []).includes("Animals"))
    .map(product => product.name)).sort();
  assert.deepEqual(animalNames, ["Fox", "Giraffe", "Lion", "Monkey", "Panda", "Puppy", "Squirrel", "Tiger", "Zebra"]);

  const animalFriends = extractStaticProductCards()
    .filter(card => card.file === "animal-friends.html")
    .map(card => card.name);
  assert.deepEqual(animalFriends, ["Puppy", "Monkey", "Tiger", "Lion", "Zebra", "Panda", "Giraffe", "Squirrel", "Fox"]);
});

test("Flower Beaded Lanyard is one trusted multi-collection product", () => {
  const catalogue = loadCatalogue();
  const matches = catalogue.filter(product => product.slug === "flower-beaded-lanyard");
  const lanyard = matches[0];

  assert.equal(matches.length, 1);
  assert.equal(lanyard?.id, 170);
  assert.equal(lanyard?.active, true);
  assert.equal(lanyard?.basePriceCents, 4500);
  assert.equal(lanyard?.imageUrl, "images/accessories/flower-beaded-lanyard.jpg");
  assert.deepEqual(Array.from(lanyard?.collections || []), ["Accessories", "Flower"]);
  assert.equal(lanyard?.supportsPersonalization, false);
  assert.ok(Array.isArray(lanyard?.previewPattern) && lanyard.previewPattern.length > 0);
});

test("Fall treats retain one trusted identity across Sweet Treats", () => {
  const catalogue = loadCatalogue();
  const expected = [
    { id: 161, slug: "cinnamon-roll", image: "images/october-collection/cinnamon-roll.jpg" },
    { id: 162, slug: "pie-slice", image: "images/october-collection/pie-slice.jpg" },
    { id: 167, slug: "hot-chocolate", image: "images/october-collection/hot-chocolate.jpg" }
  ];

  expected.forEach(({ id, slug, image }) => {
    const matches = catalogue.filter(product => product.slug === slug);
    const product = matches[0];
    assert.equal(matches.length, 1, `${slug} should have one trusted identity`);
    assert.equal(product?.id, id);
    assert.equal(product?.basePriceCents, 2000);
    assert.equal(product?.imageUrl, image);
    assert.deepEqual(Array.from(product?.collections || []), ["Fall Collection", "Sweet Treats"]);
  });

  const sweetTreats = fs.readFileSync(path.join(projectRoot, "sweet-treats.html"), "utf8");
  expected.forEach(({ slug }) => {
    assert.match(sweetTreats, new RegExp(`create\\.html\\?design=${slug}(?:#homeDesignBuilder)?`));
  });
  const sweetTreatCards = extractStaticProductCards()
    .filter(card => card.file === "sweet-treats.html")
    .map(card => card.name);
  assert.deepEqual(sweetTreatCards, ["Ice Cream Keychain", "Melting Ice Cream", "Cinnamon Roll", "Pie Slice", "Hot Chocolate"]);
});

test("October Collection is consolidated into one deduplicated Fall Collection", () => {
  const catalogue = loadCatalogue();
  const formerOctoberProducts = [
    { id: 160, slug: "autumn-tree", name: "Autumn Tree", price: 2500, collections: ["Fall Collection"] },
    { id: 161, slug: "cinnamon-roll", name: "Cinnamon Roll", price: 2000, collections: ["Fall Collection", "Sweet Treats"] },
    { id: 162, slug: "pie-slice", name: "Pie Slice", price: 2000, collections: ["Fall Collection", "Sweet Treats"] },
    { id: 163, slug: "cozy-sweater", name: "Cozy Sweater", price: 2000, collections: ["Fall Collection"] },
    { id: 164, slug: "scarf", name: "Scarf", price: 2000, collections: ["Fall Collection"] },
    { id: 165, slug: "rain-boots", name: "Rain Boots", price: 2000, collections: ["Fall Collection"] },
    { id: 166, slug: "umbrella", name: "Umbrella", price: 2000, collections: ["Fall Collection"] },
    { id: 167, slug: "hot-chocolate", name: "Hot Chocolate", price: 2000, collections: ["Fall Collection", "Sweet Treats"] },
    { id: 168, slug: "pinecone", name: "Pinecone", price: 2000, collections: ["Fall Collection"] },
    { id: 169, slug: "squirrel", name: "Squirrel", price: 2000, collections: ["Fall Collection", "Animals"] }
  ];

  catalogue.forEach((product) => {
    assert.notEqual(product.category, "October Collection", `${product.slug} retains the retired category`);
    assert.equal((product.collections || []).includes("October Collection"), false, `${product.slug} retains the retired collection`);
  });
  formerOctoberProducts.forEach((expected) => {
    const product = catalogue.find(item => item.slug === expected.slug);
    assert.deepEqual(
      { id: product?.id, name: product?.name, price: product?.basePriceCents, collections: Array.from(product?.collections || []) },
      { id: expected.id, name: expected.name, price: expected.price, collections: expected.collections }
    );
  });

  const acorn = catalogue.find(product => product.slug === "fall-acorn");
  assert.deepEqual(Array.from(acorn?.collections || []), ["Fall Collection"]);

  const fallCards = extractStaticProductCards().filter(card => card.file === "fall-collection.html");
  assert.equal(fallCards.length, 20);
  assert.equal(new Set(fallCards.map(card => card.slug)).size, 20);
  assert.deepEqual(fallCards.map(card => card.name), [
    "Fox", "Owl", "Acorn", "Autumn Tree", "Cinnamon Roll", "Pie Slice", "Cozy Sweater", "Scarf", "Rain Boots", "Umbrella",
    "Hot Chocolate", "Pinecone", "Squirrel", "Maple Leaf", "Sunflower", "Best Friends Forever Bracelet", "Coffee Cup", "Mushroom",
    "Pumpkin Spice Latte", "Fall Leaves Keychain"
  ]);

  const fallPage = fs.readFileSync(path.join(projectRoot, "fall-collection.html"), "utf8");
  assert.equal((fallPage.match(/<span class="exclusive-label">October Exclusive<\/span>/g) || []).length, 1);
  const autumnTree = catalogue.find(product => product.slug === "autumn-tree");
  assert.match(autumnTree?.description || "", /^October Exclusive\b/);
  assert.equal(catalogue.filter(product => /^October Exclusive\b/.test(product.description || "")).length, 1);

  const collectionsPage = fs.readFileSync(path.join(projectRoot, "collections.html"), "utf8");
  assert.match(collectionsPage, /href="fall-collection\.html"><img src="images\/fall-collection\/autumn-forest-background\.png"/);
  assert.doesNotMatch(collectionsPage, /href="october-collection\.html"/);
  assert.equal((collectionsPage.match(/<span>Fall Collection<\/span>/g) || []).length, 1);
  assert.doesNotMatch(collectionsPage, /<span>October Collection<\/span>/);

  const legacyOctoberPage = fs.readFileSync(path.join(projectRoot, "october-collection.html"), "utf8");
  assert.match(legacyOctoberPage, /http-equiv="refresh" content="0; url=fall-collection\.html"/);
  assert.match(legacyOctoberPage, /rel="canonical" href="https:\/\/foreverbeaded\.ca\/fall-collection\.html"/);
  assert.match(legacyOctoberPage, /href="fall-collection\.html"/);
});

test("new personalized butterfly and turtle keychains remain distinct trusted products", () => {
  const catalogue = loadCatalogue();
  const personalizedButterfly = catalogue.find(product => product.slug === "personalized-butterfly-keychain");
  const personalizedTurtle = catalogue.find(product => product.slug === "personalized-turtle-keychain");
  const butterflyNameKeychain = catalogue.find(product => product.slug === "butterfly-name-keychain");
  const turtle = catalogue.find(product => product.slug === "turtle");

  assert.equal(catalogue.filter(product => product.slug === "personalized-butterfly-keychain").length, 1);
  assert.equal(personalizedButterfly?.id, 171);
  assert.equal(personalizedButterfly?.name, "Personalized Butterfly Keychain");
  assert.equal(personalizedButterfly?.basePriceCents, 2500);
  assert.equal(personalizedButterfly?.category, "Butterfly");
  assert.deepEqual(Array.from(personalizedButterfly?.collections || []), ["Butterfly"]);
  assert.equal(personalizedButterfly?.imageUrl, "images/products/personalized-butterfly-keychain.jpg");
  assert.deepEqual(Array.from(personalizedButterfly?.additionalImageUrls || []), ["images/products/personalized-butterfly-keychain-example-2.jpg"]);
  assert.deepEqual(Array.from(personalizedButterfly?.defaultColours || []), ["pink", "purple", "black"]);
  assert.equal(personalizedButterfly?.supportsPersonalization, true);
  assert.ok(Array.isArray(personalizedButterfly?.previewPattern) && personalizedButterfly.previewPattern.length > 0);

  assert.equal(catalogue.filter(product => product.slug === "personalized-turtle-keychain").length, 1);
  assert.equal(personalizedTurtle?.id, 172);
  assert.equal(personalizedTurtle?.name, "Personalized Turtle Keychain");
  assert.equal(personalizedTurtle?.basePriceCents, 2500);
  assert.equal(personalizedTurtle?.category, "Ocean Animals");
  assert.equal(personalizedTurtle?.imageUrl, "images/products/personalized-turtle-keychain.jpg");
  assert.deepEqual(Array.from(personalizedTurtle?.defaultColours || []), ["green", "brown", "blue"]);
  assert.equal(personalizedTurtle?.supportsPersonalization, true);
  assert.ok(Array.isArray(personalizedTurtle?.previewPattern) && personalizedTurtle.previewPattern.length > 0);

  const existingButterflies = [
    { slug: "butterfly", id: 1, name: "Butterfly", price: 2000, image: "etsy/images-branded/butterfly-owner-approved-master.jpg" },
    { slug: "natalies-butterfly", id: 12, name: "Natalie’s Butterfly", price: 2500, image: "etsy/images-branded/natalies-butterfly-owner-approved-master.jpg" },
    { slug: "butterfly-with-flowers", id: 4, name: "Butterfly with Flowers", price: 3000, image: "etsy/images-branded/phoenix-butterfly-owner-approved-master.jpg" },
    { slug: "butterfly-name-keychain", id: 131, name: "Butterfly Name Keychain", price: 2500, image: "images/mothers-day-butterfly-name-keychain.jpg" },
    { slug: "butterfly-and-flower", id: 139, name: "Butterfly and Flower", price: 3000, image: "etsy/images-branded/phoenix-butterfly-owner-approved-master.jpg" },
    { slug: "butterfly-collection", id: 104, name: "Butterflies Collection", price: 2200, image: "etsy/images-branded/butterflies-collection-approved-master.jpg" }
  ];
  existingButterflies.forEach((expected) => {
    const product = catalogue.find(item => item.slug === expected.slug);
    assert.deepEqual(
      { id: product?.id, name: product?.name, price: product?.basePriceCents, image: product?.imageUrl },
      { id: expected.id, name: expected.name, price: expected.price, image: expected.image },
      `${expected.name} must remain unchanged`
    );
  });
  assert.equal(butterflyNameKeychain?.id, 131);
  assert.deepEqual(
    { id: turtle?.id, name: turtle?.name, price: turtle?.basePriceCents, image: turtle?.imageUrl },
    { id: 20, name: "Turtle", price: 2000, image: "etsy/images-branded/turtle-approved-master.jpg" }
  );

  const imageHashes = {
    "images/products/personalized-butterfly-keychain.jpg": "6700c36046251173575ec08ebcd5371a67a7a649c308f46b112f0bf1199a4e08",
    "images/products/personalized-butterfly-keychain-example-2.jpg": "1874875884deedc5a6e9668bd3cd7bfd6a0f98ff587d83c9ca4d2c0fbd76d0e9",
    "images/products/personalized-turtle-keychain.jpg": "cfd0f47586f6319b23267a6932e34044411797d04710a0335ce2aca35747ccd4"
  };
  Object.entries(imageHashes).forEach(([relativePath, expectedHash]) => {
    const image = fs.readFileSync(path.join(projectRoot, relativePath));
    assert.equal(crypto.createHash("sha256").update(image).digest("hex"), expectedHash, `${relativePath} must remain owner-approved`);
  });

  const oceanCards = extractStaticProductCards().filter(card => card.file === "ocean-friends.html");
  assert.equal(oceanCards.filter(card => card.slug === "personalized-turtle-keychain").length, 1);
  const etsyPreparation = fs.readFileSync(path.join(projectRoot, "etsy", "phase-a-listing-reconciliation.md"), "utf8");
  assert.match(etsyPreparation, /Personalized Butterfly Keychain[\s\S]*one made-to-order listing/);
  assert.match(etsyPreparation, /Personalized Turtle Keychain[\s\S]*separate from the existing non-personalized Turtle/);
});

test("Personalized Scripture Cross Keychain is one trusted Faith product", () => {
  const catalogue = loadCatalogue();
  const matches = catalogue.filter(product => product.slug === "personalized-scripture-cross-keychain");
  const scriptureCross = matches[0];

  assert.equal(matches.length, 1);
  assert.equal(scriptureCross?.id, 173);
  assert.equal(scriptureCross?.name, "Personalized Scripture Cross Keychain");
  assert.equal(scriptureCross?.basePriceCents, 3000);
  assert.equal(scriptureCross?.category, "Faith");
  assert.deepEqual(Array.from(scriptureCross?.collections || []), ["Faith"]);
  assert.equal(scriptureCross?.imageUrl, "images/products/personalized-scripture-cross-keychain.jpg");
  assert.deepEqual(Array.from(scriptureCross?.defaultColours || []), ["white", "grey", "yellow", "green", "brown"]);
  assert.equal(scriptureCross?.supportsPersonalization, true);
  assert.equal(scriptureCross?.personalizationLabel, "Scripture reference / short faith reference");
  assert.equal(scriptureCross?.personalizationPlaceholder, "e.g. ISAIAH 41:10");
  assert.equal(scriptureCross?.personalizationMaxLength, 12);
  assert.ok(Array.isArray(scriptureCross?.previewPattern) && scriptureCross.previewPattern.length > 0);
  const approvedImage = fs.readFileSync(path.join(projectRoot, scriptureCross.imageUrl));
  assert.equal(
    crypto.createHash("sha256").update(approvedImage).digest("hex"),
    "a6de6eaa53c8f603655eaa377d3f2572375c74040dcc7bdc7ebe197adc251591"
  );

  const faithCards = extractStaticProductCards().filter(card => card.file === "faith-collection.html");
  assert.equal(faithCards.length, 5);
  assert.equal(faithCards.filter(card => card.slug === scriptureCross.slug).length, 1);
  assert.deepEqual(faithCards.find(card => card.slug === scriptureCross.slug), {
    file: "faith-collection.html",
    slug: "personalized-scripture-cross-keychain",
    image: "images/products/personalized-scripture-cross-keychain.jpg",
    name: "Personalized Scripture Cross Keychain",
    priceCents: 3000
  });

  const existingFaith = [
    { id: 6, slug: "faith-cross", name: "Faith Cross", price: 2000 },
    { id: 112, slug: "joy-cross", name: "Joy Cross", price: 2000 },
    { id: 113, slug: "peace-cross", name: "Peace Cross", price: 2000 },
    { id: 151, slug: "personalized-faith-heart-keychain", name: "Personalized Faith Heart Keychain", price: 3000 }
  ];
  existingFaith.forEach((expected) => {
    const product = catalogue.find(item => item.slug === expected.slug);
    assert.deepEqual(
      { id: product?.id, name: product?.name, price: product?.basePriceCents },
      { id: expected.id, name: expected.name, price: expected.price }
    );
  });

  const etsyPreparation = fs.readFileSync(path.join(projectRoot, "etsy", "phase-a-listing-reconciliation.md"), "utf8");
  assert.match(etsyPreparation, /Personalized Scripture Cross Keychain, Custom Bible Verse Reference/);
  assert.match(etsyPreparation, /FB-173-PERSONALIZED-SCRIPTURE-CROSS-KEYCHAIN/);
  assert.match(etsyPreparation, /up to 12 characters/);
  assert.match(etsyPreparation, /Do not publish it automatically/);
});
