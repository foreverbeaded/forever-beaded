(() => {
  if (!document.querySelector('link[href*="collection-fall.css"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "css/collection-fall.css?v=2";
    document.head.append(stylesheet);
  }
  if (document.querySelector(".collection-fall-layer")) return;

  const file = decodeURIComponent(location.pathname.split("/").pop() || "").toLowerCase();
  if (file === "fall-collection.html") {
    document.body.classList.add("fall-leaves-page");
    const layer = document.createElement("div");
    layer.className = "collection-fall-layer collection-fall-layer--autumn";
    layer.setAttribute("aria-hidden", "true");
    const ns = "http://www.w3.org/2000/svg";
    for (let index = 0; index < 4; index += 1) {
      const leaf = document.createElement("span");
      leaf.className = "autumn-drifting-leaf";
      leaf.style.setProperty("--leaf-duration", `${36 + index * 4}s`);
      leaf.style.setProperty("--leaf-delay", `${-index * 11}s`);
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 32 40");
      svg.setAttribute("focusable", "false");
      const blade = document.createElementNS(ns, "path");
      blade.setAttribute("d", "M27 3C8 3 1 14 6 25C10 33 23 31 26 19C28 13 25 9 27 3Z");
      blade.setAttribute("fill", "currentColor");
      const vein = document.createElementNS(ns, "path");
      vein.setAttribute("d", "M6 38C10 26 15 19 23 8M13 23L10 15M17 18L23 17");
      vein.setAttribute("fill", "none");
      vein.setAttribute("stroke", "currentColor");
      vein.setAttribute("stroke-width", "1.5");
      svg.append(blade, vein);
      leaf.append(svg);
      layer.append(leaf);
    }
    document.body.prepend(layer);
    // The travel distance follows document height, never the scrolling viewport.
    const measure = () => layer.style.setProperty("--leaf-travel", `${document.body.offsetHeight + 80}px`);
    measure();
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body);
    else window.addEventListener("resize", measure, { passive: true });
    return;
  }
  const themes = {
    "animal-friends.html": { glyphs: ["🐾", "❧", "·"], color: "rgba(108,83,62,.34)" },
    "back-to-school.html": { glyphs: ["✎", "✦", "·"], color: "rgba(230,188,62,.42)" },
    "fall-collection.html": { glyphs: ["❧", "◆", "·"], color: "rgba(226,142,74,.42)" },
    "tiny-garden-friends.html": { glyphs: ["❀", "❧", "·"], color: "rgba(183,126,160,.38)" },
    "enchanted-beings.html": { glyphs: ["♡", "✦", "⋆"], color: "rgba(232,166,214,.42)" },
    "flags-of-the-world.html": { glyphs: ["★", "✦", "·"], color: "rgba(95,119,173,.34)" },
    "sports.html": { glyphs: ["✦", "•", "·"], color: "rgba(71,110,137,.34)" },
    "monthly-exclusive.html": { glyphs: ["✦", "⋆", "·"], color: "rgba(218,159,196,.40)" },
    "create.html": { glyphs: ["●", "♡", "·"], color: "rgba(204,139,177,.38)" },
    "flowers.html": { glyphs: ["❀", "·", "❧"], color: "rgba(220,151,157,.38)" },
    "butterflies.html": { glyphs: ["🦋", "❀", "·"], color: "rgba(215,150,192,.36)" },
    "birds.html": { glyphs: ["❯", "⌁", "·"], color: "rgba(138,168,179,.34)" },
    "ocean-friends.html": { glyphs: ["○", "◌", "·"], color: "rgba(117,191,211,.42)" },
    "sandy-beaches.html": { glyphs: ["○", "◌", "❉"], color: "rgba(118,186,201,.38)" },
    "faith-collection.html": { glyphs: ["✦", "⋆", "·"], color: "rgba(213,188,137,.38)" },
    "sweet-treats.html": { glyphs: ["▮", "•", "·"], color: "rgba(225,143,173,.38)" },
    "outer-space.html": { glyphs: ["☄", "✦", "☄"], color: "rgba(226,220,255,.38)" }
  };
  const theme = themes[file];
  if (!theme) return;

  const layer = document.createElement("div");
  layer.className = "collection-fall-layer";
  layer.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 15; index += 1) {
    const item = document.createElement("span");
    item.className = "collection-fall-item";
    item.textContent = theme.glyphs[index % theme.glyphs.length];
    item.style.setProperty("--fall-left", `${(index * 17 + 4) % 98}%`);
    item.style.setProperty("--fall-size", `${11 + (index % 5) * 3}px`);
    item.style.setProperty("--fall-duration", `${22 + (index % 7) * 3.2}s`);
    item.style.setProperty("--fall-delay", `${-3.1 * index}s`);
    item.style.setProperty("--fall-drift", `${-32 + (index % 6) * 13}px`);
    item.style.setProperty("--fall-color", theme.color);
    layer.append(item);
  }
  document.body.prepend(layer);
})();
