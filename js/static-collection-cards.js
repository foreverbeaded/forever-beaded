(() => {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".product-card"));
  const search = document.getElementById("productSearch");
  const clear = document.getElementById("clearShopFilters");
  const results = document.getElementById("shopResultsCount");
  const favouritesKey = "foreverBeadedFavourites";

  function loadFavourites() {
    try {
      const stored = JSON.parse(localStorage.getItem(favouritesKey) || "[]");
      return new Set(Array.isArray(stored) ? stored.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function refreshHearts() {
    const favourites = loadFavourites();
    cards.forEach(card => {
      const key = String(card.dataset.favouriteKey || "");
      const name = card.querySelector(".product-name")?.textContent?.trim() || "product";
      const button = card.querySelector(".favourite-btn");
      if (!key || !button) return;
      const saved = favourites.has(key);
      button.classList.toggle("is-saved", saved);
      button.setAttribute("aria-pressed", String(saved));
      button.setAttribute("aria-label", `${saved ? "Remove" : "Save"} ${name} ${saved ? "from" : "to"} favourites`);
      const heart = button.querySelector("span");
      if (heart) heart.textContent = saved ? "♥" : "♡";
    });
  }

  function filterCards() {
    const query = search?.value.trim().toLowerCase() || "";
    let visible = 0;
    cards.forEach(card => {
      const matches = !query || card.textContent.toLowerCase().includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    if (results) results.textContent = `Showing ${visible} handmade piece${visible === 1 ? "" : "s"}`;
  }

  cards.forEach(card => {
    card.querySelector(".favourite-btn")?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const key = String(card.dataset.favouriteKey || "");
      if (!key) return;
      const favourites = loadFavourites();
      favourites.has(key) ? favourites.delete(key) : favourites.add(key);
      localStorage.setItem(favouritesKey, JSON.stringify([...favourites]));
      refreshHearts();
    });
  });

  search?.addEventListener("input", filterCards);
  clear?.addEventListener("click", () => {
    if (search) search.value = "";
    filterCards();
    search?.focus();
  });
  window.addEventListener("storage", refreshHearts);
  refreshHearts();
  filterCards();
})();
