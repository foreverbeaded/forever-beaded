(() => {
  const saveCategoryJump = (event) => {
    const link = event.target.closest("[data-jump-category]");
    if (!link) return;

    const category = link.getAttribute("data-jump-category");
    if (category) {
      sessionStorage.setItem("foreverBeadedCategory", category);
    }
  };

  document.addEventListener("click", saveCategoryJump);
})();
