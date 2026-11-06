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
  assert.equal(activeProducts.length, 117);

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

test("homepage monarch uses one accessible, self-cleaning appearance cycle", () => {
  const bookSource = fs.readFileSync(path.join(projectRoot, "js", "book.js"), "utf8");
  const gardenSource = fs.readFileSync(path.join(projectRoot, "css", "garden.css"), "utf8");

  assert.match(bookSource, /restMinMs:\s*5000/);
  assert.match(bookSource, /restMaxMs:\s*8000/);
  assert.match(bookSource, /returnMinMs:\s*20000/);
  assert.match(bookSource, /returnMaxMs:\s*40000/);
  assert.match(bookSource, /document\.addEventListener\("visibilitychange"/);
  assert.match(bookSource, /prefers-reduced-motion:\s*reduce/);
  assert.match(bookSource, /controller\.butterfly\?\.remove\(\)/);
  assert.match(bookSource, /if \(document\.hidden \|\| motionQuery\.matches \|\| controller\.butterfly\) return/);
  assert.match(bookSource, /"\.product-card",\s*\n\s*"\.hero-feature", "\.cart-panel", "\.fb-modal", "\.story-header"/);
  assert.match(gardenSource, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hero-butterfly-layer[\s\S]*display:\s*none\s*!important/);
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
    "personalized-scripture-dove-keychain": 3000,
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
    squirrel: 2000,
    "frog-keychain": 2500,
    "personalized-blossom-keychain": 3000,
    "christmas-star": 2000,
    poinsettia: 2500,
    "christmas-truck": 2500,
    "christmas-teddy-bear": 2000,
    "christmas-polar-bear": 2000,
    "gingerbread-girl": 2000,
    "christmas-wreath": 2000,
    "christmas-candy-cane": 2000,
    "christmas-present": 2000,
    "christmas-stocking": 2000,
    "christmas-tree": 2000,
    "christmas-snowflake": 2000,
    "gingerbread-man": 2000,
    "christmas-angel": 2000,
    "christmas-snowman": 2000,
    "christmas-reindeer": 2000,
    "christmas-elf": 2000,
    "glow-in-the-dark-christmas-ornament": 3500,
    "mrs-claus": 2000,
    "christmas-santa": 2000
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

test("Personalized Scripture Dove Keychain is one trusted Faith product", () => {
  const catalogue = loadCatalogue();
  const matches = catalogue.filter(product => product.slug === "personalized-scripture-dove-keychain");
  const scriptureDove = matches[0];

  assert.equal(matches.length, 1);
  assert.equal(scriptureDove?.id, 173);
  assert.equal(scriptureDove?.name, "Personalized Scripture Dove Keychain");
  assert.equal(scriptureDove?.basePriceCents, 3000);
  assert.equal(scriptureDove?.category, "Faith");
  assert.deepEqual(Array.from(scriptureDove?.collections || []), ["Faith"]);
  assert.deepEqual(Array.from(scriptureDove?.legacySlugs || []), ["personalized-scripture-cross-keychain"]);
  assert.equal(scriptureDove?.imageUrl, "images/products/personalized-scripture-dove-keychain.jpg");
  assert.deepEqual(Array.from(scriptureDove?.defaultColours || []), ["white", "grey", "yellow", "green", "brown"]);
  assert.equal(scriptureDove?.supportsPersonalization, true);
  assert.equal(scriptureDove?.personalizationLabel, "Scripture reference / short faith reference");
  assert.equal(scriptureDove?.personalizationPlaceholder, "e.g. ISAIAH 41:10");
  assert.equal(scriptureDove?.personalizationMaxLength, 12);
  assert.ok(Array.isArray(scriptureDove?.previewPattern) && scriptureDove.previewPattern.length > 0);
  const approvedImage = fs.readFileSync(path.join(projectRoot, scriptureDove.imageUrl));
  assert.equal(
    crypto.createHash("sha256").update(approvedImage).digest("hex"),
    "a6de6eaa53c8f603655eaa377d3f2572375c74040dcc7bdc7ebe197adc251591"
  );

  const faithCards = extractStaticProductCards().filter(card => card.file === "faith-collection.html");
  assert.equal(faithCards.length, 5);
  assert.equal(faithCards.filter(card => card.slug === scriptureDove.slug).length, 1);
  assert.deepEqual(faithCards.find(card => card.slug === scriptureDove.slug), {
    file: "faith-collection.html",
    slug: "personalized-scripture-dove-keychain",
    image: "images/products/personalized-scripture-dove-keychain.jpg",
    name: "Personalized Scripture Dove Keychain",
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
  assert.match(etsyPreparation, /Personalized Scripture Dove Keychain, Custom Bible Verse Reference/);
  assert.match(etsyPreparation, /FB-173-PERSONALIZED-SCRIPTURE-DOVE-KEYCHAIN/);
  assert.doesNotMatch(etsyPreparation, /cross keychain|personalized cross|beaded cross/i);
  assert.match(etsyPreparation, /up to 12 characters/);
  assert.match(etsyPreparation, /Do not publish it automatically/);
});

test("released Frog and Personalized Blossom products use one trusted identity each", () => {
  const catalogue = loadCatalogue();
  const frogMatches = catalogue.filter(product => product.slug === "frog-keychain");
  const blossomMatches = catalogue.filter(product => product.slug === "personalized-blossom-keychain");
  const frog = frogMatches[0];
  const blossom = blossomMatches[0];

  assert.equal(frogMatches.length, 1);
  assert.equal(frog?.id, 174);
  assert.equal(frog?.basePriceCents, 2500);
  assert.equal(frog?.category, "Pond Friends");
  assert.deepEqual(Array.from(frog?.collections || []), ["Pond Friends"]);
  assert.equal(frog?.imageUrl, "images/products/frog-keychain.jpg");
  assert.equal(frog?.supportsPersonalization, true);
  assert.equal(frog?.priceApprovalPending, undefined);
  assert.equal(frog?.releaseStatus, undefined);
  assert.ok(Array.isArray(frog?.previewPattern) && frog.previewPattern.length > 0);

  assert.equal(blossomMatches.length, 1);
  assert.equal(blossom?.id, 175);
  assert.equal(blossom?.basePriceCents, 3000);
  assert.equal(blossom?.category, "Flower");
  assert.deepEqual(Array.from(blossom?.collections || []), ["Flower", "Mother's Day"]);
  assert.equal(blossom?.imageUrl, "images/products/personalized-blossom-keychain-edited-natalie.png");
  assert.equal(blossom?.originalSourceImageUrl, "images/products/personalized-blossom-keychain-original.jpg");
  assert.equal(blossom?.imageClassification, "edited-styled-example");
  assert.match(blossom?.imageEditDisclosure || "", /edited.*NATLIE.*NATALIE/i);
  assert.equal(blossom?.supportsPersonalization, true);
  assert.equal(blossom?.priceApprovalPending, undefined);
  assert.equal(blossom?.releaseStatus, undefined);

  const expectedHashes = {
    "images/products/frog-keychain.jpg": "d973f0b9d817322f9bd84ecf3f2fda744a1b58551ec933887b3a90e02697f892",
    "images/products/personalized-blossom-keychain-original.jpg": "fb737aad479a2fb1fa28b04a3cc292376cfdba2d2e0f8f55ebd469395b80dd8f"
  };
  Object.entries(expectedHashes).forEach(([relativePath, expectedHash]) => {
    const image = fs.readFileSync(path.join(projectRoot, relativePath));
    assert.equal(crypto.createHash("sha256").update(image).digest("hex"), expectedHash);
  });
  assert.notEqual(
    crypto.createHash("sha256").update(fs.readFileSync(path.join(projectRoot, blossom.imageUrl))).digest("hex"),
    expectedHashes[blossom.originalSourceImageUrl],
    "the edited NATALIE example must remain distinct from the preserved original"
  );

  const pondPage = fs.readFileSync(path.join(projectRoot, "pond-friends.html"), "utf8");
  const flowerPage = fs.readFileSync(path.join(projectRoot, "flowers.html"), "utf8");
  const mothersDayPage = fs.readFileSync(path.join(projectRoot, "mothers-day-collection.html"), "utf8");
  const collectionsPage = fs.readFileSync(path.join(projectRoot, "collections.html"), "utf8");
  const designerSource = fs.readFileSync(path.join(projectRoot, "js", "garden.js"), "utf8");
  assert.match(pondPage, /data-initial-category="Pond Friends"/);
  assert.match(pondPage, /class="page-scroll"/);
  assert.match(pondPage, /class="animal-page"/);
  assert.match(pondPage, /class="page-heading"/);
  assert.match(pondPage, /class="search-wrap"/);
  assert.match(pondPage, /js\/static-collection-cards\.js/);
  assert.match(pondPage, /create\.html\?design=frog-keychain#homeDesignBuilder/);
  assert.match(pondPage, /images\/products\/frog-keychain\.jpg/);
  assert.match(
    fs.readFileSync(path.join(projectRoot, "js", "chapter-order-navigation.js"), "utf8"),
    /\["pond-friends\.html", "Pond Friends"\]/
  );
  assert.match(collectionsPage, /href="pond-friends\.html"/);
  assert.match(flowerPage, /personalized-blossom-keychain/);
  assert.match(mothersDayPage, /data-initial-category="Mother's Day"/);
  assert.match(designerSource, /label: "Pond Friends"/);
  assert.doesNotMatch(pondPage, /design=custom-idea|design=butterfly/);
});

test("Christmas draft uses one trusted identity for every supplied standalone design", () => {
  const catalogue = loadCatalogue();
  const expected = [
    { id: 176, slug: "christmas-star", name: "Star", price: 2000, image: "star.jpg", source: "1-Photo-1.jpg" },
    { id: 177, slug: "poinsettia", name: "Poinsettia", price: 2500, image: "poinsettia.jpg", source: "2-Photo-2.jpg" },
    { id: 178, slug: "christmas-truck", name: "Christmas Truck", price: 2500, image: "christmas-truck.jpg", source: "3-Photo-3.jpg" },
    { id: 179, slug: "christmas-teddy-bear", name: "Teddy Bear", price: 2000, image: "teddy-bear.jpg", source: "4-Photo-4.jpg" },
    { id: 180, slug: "christmas-polar-bear", name: "Polar Bear", price: 2000, image: "polar-bear.jpg", source: "5-Photo-5.jpg" },
    { id: 181, slug: "gingerbread-girl", name: "Gingerbread Girl", price: 2000, image: "gingerbread-girl.jpg", source: "6-Photo-6.jpg" },
    { id: 182, slug: "christmas-wreath", name: "Wreath", price: 2000, image: "wreath.jpg", source: "7-Photo-7.jpg" },
    { id: 183, slug: "christmas-candy-cane", name: "Candy Cane", price: 2000, image: "candy-cane.jpg", source: "8-Photo-8.jpg" },
    { id: 184, slug: "christmas-present", name: "Present", price: 2000, image: "present.jpg", source: "9-Photo-9.jpg" },
    { id: 185, slug: "christmas-stocking", name: "Christmas Stocking", price: 2000, image: "christmas-stocking.jpg", source: "batch-2/1-Photo-1.jpg" },
    { id: 186, slug: "christmas-tree", name: "Christmas Tree", price: 2000, image: "christmas-tree.jpg", source: "batch-2/2-Photo-2.jpg" },
    { id: 187, slug: "christmas-snowflake", name: "Snowflake", price: 2000, image: "snowflake.jpg", source: "batch-2/3-Photo-3.jpg" },
    { id: 188, slug: "gingerbread-man", name: "Gingerbread Man", price: 2000, image: "gingerbread-man.jpg", source: "batch-2/4-Photo-4.jpg" },
    { id: 189, slug: "christmas-angel", name: "Angel", price: 2000, image: "angel.jpg", source: "batch-2/5-Photo-5.jpg" },
    { id: 190, slug: "christmas-snowman", name: "Snowman", price: 2000, image: "snowman.jpg", source: "batch-2/7-Photo-7.jpg" },
    { id: 191, slug: "christmas-reindeer", name: "Reindeer", price: 2000, image: "reindeer.jpg", source: "batch-2/8-Photo-8.jpg" },
    { id: 192, slug: "christmas-elf", name: "Elf", price: 2000, image: "elf.jpg", source: "batch-2/10-Photo-10.jpg" },
    { id: 194, slug: "mrs-claus", name: "Mrs. Claus", price: 2000, image: "mrs-claus.jpg", source: "batch-3/1-Photo-1.jpg" },
    { id: 195, slug: "christmas-santa", name: "Santa", price: 2000, image: "santa.jpg", source: "batch-3/2-Photo-2.jpg" }
  ];

  expected.forEach((item) => {
    const matches = catalogue.filter(product => product.slug === item.slug);
    const product = matches[0];
    assert.equal(matches.length, 1, `${item.slug} must have one trusted identity`);
    assert.equal(product?.id, item.id);
    assert.equal(product?.name, item.name);
    assert.equal(product?.basePriceCents, item.price);
    assert.equal(product?.category, "Christmas Collection");
    assert.deepEqual(Array.from(product?.collections || []), ["Christmas Collection"]);
    assert.equal(product?.supportsPersonalization, false);
    assert.equal(product?.imageClassification, "styled-marketing-photo");
    assert.equal(product?.imageUrl, `images/christmas-collection/products/${item.image}`);
    assert.equal(product?.originalSourceImageUrl, `images/christmas-collection/originals/${item.source}`);

    const storefrontImage = fs.readFileSync(path.join(projectRoot, product.imageUrl));
    const preservedSource = fs.readFileSync(path.join(projectRoot, product.originalSourceImageUrl));
    assert.equal(
      crypto.createHash("sha256").update(storefrontImage).digest("hex"),
      crypto.createHash("sha256").update(preservedSource).digest("hex"),
      `${item.slug} storefront image must remain byte-for-byte identical to its preserved source`
    );
  });

  const christmasPage = fs.readFileSync(path.join(projectRoot, "christmas-collection.html"), "utf8");
  const collectionsPage = fs.readFileSync(path.join(projectRoot, "collections.html"), "utf8");
  const designerSource = fs.readFileSync(path.join(projectRoot, "js", "garden.js"), "utf8");
  assert.equal(extractStaticProductCards().filter(card => card.file === "christmas-collection.html").length, 20);
  assert.match(christmasPage, /id="productGrid"/);
  assert.match(christmasPage, /js\/static-collection-cards\.js/);
  assert.doesNotMatch(christmasPage, /design=custom-idea|design=butterfly/);
  assert.match(collectionsPage, /href="christmas-collection\.html"/);
  assert.match(designerSource, /label: "Christmas Collection"/);

  const dynamicChristmasSurfaces = ["shop.html", "gallery.html", "my-favourites.html", "create.html", "reviews.html"];
  dynamicChristmasSurfaces.forEach((file) => {
    const html = fs.readFileSync(path.join(projectRoot, file), "utf8");
    assert.match(html, /js\/product-catalogue\.js\?v=christmas-release-20261106/, `${file} must load the released catalogue`);
  });
  assert.match(fs.readFileSync(path.join(projectRoot, "shop.html"), "utf8"), /id="productSearch"[\s\S]*id="productGrid"/);
  assert.match(fs.readFileSync(path.join(projectRoot, "gallery.html"), "utf8"), /id="galleryGrid"/);
  assert.match(fs.readFileSync(path.join(projectRoot, "my-favourites.html"), "utf8"), /data-initial-category="My Favourites"/);
  assert.match(fs.readFileSync(path.join(projectRoot, "create.html"), "utf8"), /js\/garden\.js/);

  const existingPenguin = catalogue.find(product => product.id === 15);
  assert.equal(existingPenguin?.slug, "penguin");
  assert.equal(existingPenguin?.name, "Penguin");
  assert.equal((existingPenguin?.collections || []).includes("Christmas Collection"), false);
  assert.equal(catalogue.some(product => product.slug === "christmas-penguin"), false);
  const christmasTree = catalogue.find(product => product.slug === "christmas-tree");
  assert.deepEqual(Array.from(christmasTree?.additionalImageUrls || []), ["images/christmas-collection/products/christmas-tree-example-2.jpg"]);
  assert.deepEqual(Array.from(christmasTree?.additionalOriginalSourceImageUrls || []), ["images/christmas-collection/originals/batch-2/6-Photo-6.jpg"]);
  assert.equal(
    crypto.createHash("sha256").update(fs.readFileSync(path.join(projectRoot, christmasTree.additionalImageUrls[0]))).digest("hex"),
    crypto.createHash("sha256").update(fs.readFileSync(path.join(projectRoot, christmasTree.additionalOriginalSourceImageUrls[0]))).digest("hex")
  );

  const ornament = catalogue.find(product => product.slug === "glow-in-the-dark-christmas-ornament");
  assert.equal(ornament?.id, 193);
  assert.equal(ornament?.basePriceCents, 3500);
  assert.equal(ornament?.active, true);
  assert.equal(ornament?.priceApprovalPending, undefined);
  assert.equal(ornament?.releaseStatus, undefined);
  assert.deepEqual(Array.from(ornament?.collections || []), ["Christmas Collection", "Monthly Exclusives"]);
  assert.match(ornament?.description || "", /no batteries or LEDs/i);
  assert.match(ornament?.description || "", /exposure to light/i);
  assert.equal(catalogue.filter(product => product.collections?.includes("Christmas Collection") && product.active !== false).length, 20);
  assert.equal(
    crypto.createHash("sha256").update(fs.readFileSync(path.join(projectRoot, ornament.imageUrl))).digest("hex"),
    crypto.createHash("sha256").update(fs.readFileSync(path.join(projectRoot, ornament.originalSourceImageUrl))).digest("hex")
  );

  const monthlyPage = fs.readFileSync(path.join(projectRoot, "monthly-exclusive.html"), "utf8");
  assert.match(monthlyPage, /design=autumn-tree/);
  assert.match(monthlyPage, /October Exclusive/);
  assert.match(monthlyPage, /Glow-in-the-Dark Christmas Ornament/);
  assert.match(monthlyPage, /\$35 CAD/);
  assert.match(monthlyPage, /design=glow-in-the-dark-christmas-ornament/);

  const etsyDraft = fs.readFileSync(path.join(projectRoot, "etsy", "christmas-collection-2026-draft.md"), "utf8");
  expected.forEach(item => assert.match(etsyDraft, new RegExp(`FB-${item.id}-`)));
  assert.match(etsyDraft, /FB-193-GLOW-IN-THE-DARK-CHRISTMAS-ORNAMENT/);
  assert.match(etsyDraft, /Approved price: `\$35 CAD`/);
  assert.match(etsyDraft, /no batteries, LEDs or electronic components/i);
  assert.match(etsyDraft, /Exposure to light charges the naturally glowing beads/i);
  assert.match(etsyDraft, /Christmas Penguin[\s\S]*Do not reuse existing Penguin ID 15/i);
  assert.match(etsyDraft, /live status unverified/i);
  assert.match(etsyDraft, /plastic pony beads/);
  assert.match(etsyDraft, /Hardware colour[\s\S]*Silver[\s\S]*Gold/);
  const tagLines = etsyDraft.split(/\r?\n/).filter(line => line.startsWith("- Tags:"));
  assert.equal(tagLines.length, 21, "all 20 Christmas designs and the ornament need Etsy tags");
  tagLines.forEach((line) => {
    const tags = Array.from(line.matchAll(/`([^`]+)`/g), match => match[1]);
    assert.equal(tags.length, 13, `expected 13 Etsy tags in: ${line}`);
    tags.forEach(tag => assert.ok(tag.length <= 20, `Etsy tag exceeds 20 characters: ${tag}`));
  });
  assert.match(etsyDraft, /Do not publish/i);
  assert.match(etsyDraft, /genuine unedited original photograph/i);
});

test("review form only clears after a persisted pending review is confirmed", () => {
  const html = fs.readFileSync(path.join(projectRoot, "reviews.html"), "utf8");
  const appSource = fs.readFileSync(path.join(projectRoot, "js", "app.js"), "utf8");
  const adminHtml = fs.readFileSync(path.join(projectRoot, "server", "admin-reviews.html"), "utf8");
  const adminSource = fs.readFileSync(path.join(projectRoot, "server", "admin-reviews.js"), "utf8");

  assert.match(html, /id="reviewProduct" required/);
  assert.match(html, /id="reviewText" minlength="3" maxlength="600"/);
  assert.doesNotMatch(html, /id="reviewPhoto"|type="file"/);
  assert.match(html, /Photo submissions are not enabled yet/);
  assert.ok(
    html.indexOf("js/review-public.js") < html.indexOf("js/app.js"),
    "review API configuration must load before app.js"
  );
  assert.ok(
    html.indexOf("js/master-header.js") < html.indexOf("js/app.js"),
    "master-header.js must configure the production API before app.js"
  );
  assert.match(appSource, /https:\/\/forever-beaded-api\.onrender\.com/);
  assert.match(appSource, /Loading approved customer reviews/);
  assert.match(appSource, /We couldn’t load approved reviews right now\. Please try again\./);
  assert.match(appSource, /review-retry-button/);
  assert.match(appSource, /cache: "no-store"/);
  assert.match(appSource, /submissionKey: reviewForm\.dataset\.submissionKey/);
  assert.match(appSource, /data\.success !== true \|\| data\.status !== "PENDING" \|\| !data\.reviewId/);
  assert.match(appSource, /Your message is still here/);
  assert.match(appSource, /REVIEW_MIN_LENGTH = 3/);
  assert.match(appSource, /Please write at least 3 characters in your review/);
  assert.match(appSource, /reviewSubmissionInFlight/);
  assert.ok(
    appSource.indexOf("data.success !== true") < appSource.indexOf("reviewForm.reset()"),
    "the form must not reset before persistence is confirmed"
  );
  assert.doesNotMatch(appSource, /prepared for approval before it appears publicly/);
  assert.match(adminHtml, /value="PENDING"/);
  assert.match(adminHtml, /value="APPROVED"/);
  assert.match(adminHtml, /value="REJECTED"/);
  assert.match(adminSource, /Remove from Website/);
  assert.match(adminSource, /window\.confirm/);
  assert.match(adminSource, /moderateReview\(review\.id, "REJECTED", "", card\)/);
});
