const PRODUCTS = require("../js/product-catalogue");

function normalizeSeedProduct(product) {
  return {
    id: Number(product.id),
    slug: String(product.slug),
    name: String(product.name),
    category: String(product.category),
    description: String(product.description),
    basePriceCents: Number(product.basePriceCents),
    basePrice: Number(product.basePrice ?? product.basePriceCents),
    imageUrl: String(product.imageUrl),
    referenceImageUrl: String(product.referenceImageUrl || product.imageUrl),
    previewImageUrl: String(product.previewImageUrl || product.referenceImageUrl || product.imageUrl),
    previewPattern: Array.isArray(product.previewPattern) ? product.previewPattern : null,
    defaultColours: Array.isArray(product.defaultColours) ? product.defaultColours : [],
    active: product.active ? 1 : 0,
    sortOrder: Number(product.sortOrder)
  };
}

const SEED_PRODUCTS = Object.freeze(PRODUCTS.map(normalizeSeedProduct));

function getSeedProduct(productId) {
  const id = String(productId || "").trim();
  return SEED_PRODUCTS.find((product) => String(product.id) === id || product.slug === id) || null;
}

module.exports = {
  SEED_PRODUCTS,
  getSeedProduct
};
