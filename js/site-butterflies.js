(() => {
  "use strict";

  function removeButterflies() {
    document.querySelectorAll(
      ".site-butterfly-layer, .scroll-monarch-layer, .flying-butterfly, " +
      ".living-butterfly, .create-butterfly, .ambient-butterfly, " +
      ".chapter-two-butterfly-layer, .exclusive-discovery-butterfly"
    ).forEach(element => element.remove());
  }

  removeButterflies();
})();
