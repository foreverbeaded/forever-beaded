const isForeverBeadedLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);
window.FOREVER_BEADED_API_BASE_URL = isForeverBeadedLocalDevelopment
  ? "http://127.0.0.1:3000"
  : "https://forever-beaded-api.onrender.com";

(() => {
  "use strict";

  const button = document.getElementById("storyMenuButton");
  const nav = document.getElementById("storyNav");
  if (!button || !nav) return;

  if (!nav.querySelector('a[href="accessories.html"]')) {
    const collectionsLink = nav.querySelector('a[href="collections.html"]');
    const accessoriesLink = document.createElement("a");
    accessoriesLink.href = "accessories.html";
    accessoriesLink.textContent = "Accessories";
    collectionsLink?.insertAdjacentElement("afterend", accessoriesLink);
  }

  button.addEventListener("click", event => {
    event.stopImmediatePropagation();
    const isOpen = nav.classList.toggle("is-open");
    button.setAttribute("aria-expanded", String(isOpen));
  }, { capture: true });

  nav.addEventListener("click", event => {
    if (!event.target.closest("a")) return;
    event.stopImmediatePropagation();
    nav.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }, { capture: true });
})();
