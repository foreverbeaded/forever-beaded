(() => {
  const ready = (callback) => {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  };

  ready(() => {
    const opening = document.getElementById("openingScene");
    const skip = document.getElementById("skipOpening");
    const menuButton = document.getElementById("storyMenuButton");
    const nav = document.getElementById("storyNav");

    if (skip && opening) {
      skip.addEventListener("click", () => {
        opening.classList.add("is-skipped");
      });
    }

    if (opening) {
      opening.addEventListener("animationend", (event) => {
        if (event.animationName === "openingFade") {
          opening.remove();
        }
      });
    }

    if (menuButton && nav) {
      menuButton.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(isOpen));
      });

      nav.addEventListener("click", (event) => {
        if (!event.target.closest("a")) return;
        nav.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
      });
    }
  });
})();
