(() => {
  "use strict";

  const button = document.getElementById("storyMenuButton");
  const nav = document.getElementById("storyNav");
  if (!button || !nav) return;

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
