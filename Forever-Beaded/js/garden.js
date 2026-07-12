(() => {
  const colourNames = {
    amber: "#d9822b",
    black: "#111111",
    blue: "#3478d4",
    bronze: "#9b6a2f",
    brown: "#6b3e26",
    cream: "#f2dfbd",
    gold: "#c99a46",
    green: "#3f8b4b",
    lavender: "#b77bc0",
    orange: "#e8791f",
    pearl: "#fff5df",
    pink: "#d878a4",
    plum: "#5b234f",
    purple: "#8a3f83",
    red: "#c63f35",
    silver: "#c9c8c1",
    teal: "#2b9a91",
    white: "#fff5df",
    yellow: "#f1c85b"
  };

  const designPatterns = {
    Butterfly: [
      "a...a",
      "aa.aa",
      ".bcb.",
      "aa.aa",
      "a...a"
    ],
    Flower: [
      ".aba.",
      "abcba",
      "bcdcb",
      "abcba",
      ".aba."
    ],
    Gecko: [
      "..a..",
      ".aba.",
      "abcba",
      ".b.b.",
      "c...c"
    ],
    Macaw: [
      "..a..",
      ".aba.",
      "abcba",
      ".ddd.",
      "d...d"
    ],
    Turtle: [
      ".aaa.",
      "ababa",
      "abcba",
      ".aba.",
      "c...c"
    ],
    Octopus: [
      ".aaa.",
      "ababa",
      ".aaa.",
      "bcbcb",
      "c.c.c"
    ],
    Pencil: [
      "..a..",
      ".aba.",
      ".bcb.",
      ".bcb.",
      ".ddd."
    ],
    Cross: [
      "..a..",
      "aaaaa",
      "..a..",
      "..a..",
      "..a.."
    ],
    Custom: [
      ".aaa.",
      "abcba",
      "bcacb",
      "abcba",
      ".aaa."
    ]
  };

  const saveCategoryJump = (event) => {
    const link = event.target.closest("[data-jump-category]");
    if (!link) return;

    const category = link.getAttribute("data-jump-category");
    if (category) {
      sessionStorage.setItem("foreverBeadedCategory", category);
    }
  };

  const normalizeColour = (value, fallbackIndex) => {
    const clean = String(value || "").trim().toLowerCase();
    if (!clean) return ["#8a3f83", "#fff5df", "#c99a46", "#5b234f"][fallbackIndex % 4];
    if (/^#[0-9a-f]{3,8}$/i.test(clean)) return clean;
    return colourNames[clean] || clean;
  };

  const parseColours = (value) => {
    const colours = String(value || "")
      .split(",")
      .map((part, index) => normalizeColour(part, index))
      .filter(Boolean);

    return colours.length ? colours : ["#8a3f83", "#fff5df", "#c99a46"];
  };

  const titleCase = (value) => String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const renderHomeTreasurePreview = () => {
    const preview = document.getElementById("homeTreasurePreview");
    if (!preview) return;

    const design = document.getElementById("homeTreasureDesign")?.value || "Butterfly";
    const colourInput = document.getElementById("homeTreasureColours")?.value || "Purple, Cream, Gold";
    const hardware = document.getElementById("homeTreasureHardware")?.value || "Gold";
    const quantity = document.getElementById("homeTreasureQuantity")?.value || "1";
    const name = document.getElementById("homeTreasureName")?.value.trim() || "";
    const colours = parseColours(colourInput);
    const patternKey = ({"Flower Wristlet":"Flower","Pencil Charm":"Pencil","Sunset Macaw":"Macaw","Custom Treasure":"Custom"})[design] || design;
    const pattern = designPatterns[patternKey] || designPatterns.Custom;
    const maxCols = Math.max(...pattern.map(row => row.length));

    preview.style.setProperty("--home-preview-cols", maxCols);
    preview.style.setProperty("--home-preview-rows", pattern.length);

    preview.innerHTML = pattern.flatMap(row => {
      const normalizedRow = row.padEnd(maxCols, ".");
      return [...normalizedRow].map(code => {
        if (code === ".") return '<span class="preview-bead empty"></span>';
        const colourIndex = code.charCodeAt(0) - 97;
        const colour = colours[colourIndex % colours.length];
        return `<span class="preview-bead" style="--bead:${colour}"></span>`;
      });
    }).join("");

    const readableColours = colourInput
      .split(",")
      .map(part => titleCase(part.trim()))
      .filter(Boolean)
      .join(", ") || "Custom colours";

    const previewTitle = document.getElementById("homeTreasurePreviewTitle");
    const previewMeta = document.getElementById("homeTreasurePreviewMeta");

    if (previewTitle) {
      previewTitle.textContent = `${design} in ${readableColours.replace(/, ([^,]+)$/, " & $1")}`;
    }

    if (previewMeta) {
      previewMeta.textContent = `${hardware} hardware, quantity ${quantity || 1}, ${name ? `personalized for ${name}` : "no name added"}.`;
    }
  };

  const buildHomeTreasureMessage = () => {
    const name = document.getElementById("homeTreasureName")?.value.trim() || "None";
    const design = document.getElementById("homeTreasureDesign")?.value || "Custom";
    const colours = document.getElementById("homeTreasureColours")?.value.trim() || "Custom colours";
    const hardware = document.getElementById("homeTreasureHardware")?.value || "Gold";
    const quantity = document.getElementById("homeTreasureQuantity")?.value || "1";
    const customDetails = document.getElementById("customTreasureDetails")?.value.trim() || "None";

    return `Hello Forever Beaded,\n\nI would like to request a custom treasured piece.\n\nName or initials: ${name}\nDesign: ${design}\nColours: ${colours}\nHardware: ${hardware}\nQuantity: ${quantity}\nCustom treasure details: ${customDetails}\n\nNotes:\n\nThank you!`;
  };

  const openCustomRequestEmail = () => {
    const email = "foreverbeaded1@gmail.com";
    const subject = "Forever Beaded Custom Treasure Request";
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildHomeTreasureMessage())}`;
    window.location.href = gmailUrl;
  };

  const setupHomeDesignBuilder = () => {
    const form = document.getElementById("homeDesignBuilder");
    if (!form) return;

    form.addEventListener("input", renderHomeTreasurePreview);
    form.addEventListener("change", () => {
      const design = document.getElementById("homeTreasureDesign")?.value;
      const customWrap = document.getElementById("customTreasureDetailsWrap");
      const customField = document.getElementById("customTreasureDetails");
      const isCustom = design === "Custom Treasure";
      if (customWrap) customWrap.hidden = !isCustom;
      if (customField) customField.required = isCustom;
      renderHomeTreasurePreview();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      openCustomRequestEmail();
    });

    const design = document.getElementById("homeTreasureDesign")?.value;
    const customWrap = document.getElementById("customTreasureDetailsWrap");
    if (customWrap) customWrap.hidden = design !== "Custom Treasure";
    renderHomeTreasurePreview();
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const easeInOut = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const cubicPoint = (a, b, c, d, t) => {
    const mt = 1 - t;
    return {
      x: (mt * mt * mt * a.x) + (3 * mt * mt * t * b.x) + (3 * mt * t * t * c.x) + (t * t * t * d.x),
      y: (mt * mt * mt * a.y) + (3 * mt * mt * t * b.y) + (3 * mt * t * t * c.y) + (t * t * t * d.y)
    };
  };

  const pointForElement = (selector, fallback) => {
    const element = document.querySelector(selector);
    if (!element) return fallback;
    const rect = element.getBoundingClientRect();
    if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight * 2) return fallback;
    return {
      x: clamp(rect.left + rect.width * .5, 110, window.innerWidth - 110),
      y: clamp(rect.top + rect.height * .5, 150, window.innerHeight * .52)
    };
  };

  const setButterflyPose = (butterfly, point, rotation, scale, opacity) => {
    butterfly.style.opacity = String(opacity);
    butterfly.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
  };

  const animateMonarch = (butterfly, options) => {
    const startedAt = performance.now() + (options.delay || 0);
    const duration = options.duration;

    function frame(now) {
      if (now < startedAt) {
        requestAnimationFrame(frame);
        return;
      }

      const raw = clamp((now - startedAt) / duration, 0, 1);
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const flower = pointForElement(".workspace-photo-flower", {
        x: viewport.width * .66,
        y: viewport.height * .48
      });
      const exclusive = pointForElement(".hero-feature", {
        x: viewport.width * .86,
        y: viewport.height * .24
      });
      const book = pointForElement(".hero-book-scene", {
        x: viewport.width * .22,
        y: viewport.height * .58
      });
      const title = pointForElement("#customTitle", {
        x: viewport.width * .52,
        y: viewport.height * .24
      });
      let position;
      let rotation;
      let scale;
      let opacity = raw < .05 ? raw / .05 : raw > .985 ? (1 - raw) / .015 : 1;

      butterfly.classList.add("is-flying");
      butterfly.classList.toggle("is-resting", options.role === "flower" && raw > .42 && raw < .6);

      if (options.role === "close") {
        if (raw < .34) {
          const t = easeInOut(raw / .34);
          position = cubicPoint(
            { x: -230, y: viewport.height * .62 },
            { x: viewport.width * .08, y: viewport.height * .18 },
            { x: viewport.width * .32, y: viewport.height * .62 },
            { x: viewport.width * .5, y: viewport.height * .36 },
            t
          );
          rotation = -14 + Math.sin(t * Math.PI * 2.2) * 24;
          scale = 1.05 + Math.sin(t * Math.PI) * .42;
        } else if (raw < .62) {
          const t = easeInOut((raw - .34) / .28);
          position = cubicPoint(
            { x: viewport.width * .5, y: viewport.height * .36 },
            { x: viewport.width * .62, y: viewport.height * .18 },
            { x: book.x + 120, y: book.y - 170 },
            { x: book.x + 40, y: book.y - 92 },
            t
          );
          rotation = Math.sin(t * Math.PI * 2) * 18;
          scale = 1.18 - t * .34;
        } else {
          const t = easeInOut((raw - .62) / .38);
          position = cubicPoint(
            { x: book.x + 40, y: book.y - 92 },
            { x: book.x + 210, y: book.y - 190 },
            { x: viewport.width * .72, y: viewport.height * .22 },
            { x: viewport.width + 160, y: viewport.height * .46 },
            t
          );
          rotation = -8 + Math.sin(t * Math.PI * 3) * 20;
          scale = .86 + Math.sin(t * Math.PI) * .12;
        }
      } else if (options.role === "flower") {
        if (raw < .28) {
          const t = easeInOut(raw / .28);
          position = cubicPoint(
            { x: -150, y: viewport.height * .48 },
            { x: viewport.width * .18, y: viewport.height * .22 },
            { x: viewport.width * .42, y: viewport.height * .58 },
            { x: flower.x - 115, y: flower.y - 72 },
            t
          );
          rotation = -10 + Math.sin(t * Math.PI * 2) * 20;
          scale = .76 + Math.sin(t * Math.PI) * .18;
        } else if (raw < .42) {
          const t = (raw - .28) / .14;
          const angle = (t * Math.PI * 2.25) - Math.PI * .65;
          position = {
            x: flower.x + Math.cos(angle) * Math.min(96, viewport.width * .11),
            y: flower.y + Math.sin(angle) * Math.min(62, viewport.height * .09)
          };
          rotation = Math.sin(angle) * 26;
          scale = .9 + Math.sin(t * Math.PI) * .08;
        } else if (raw < .6) {
          const t = (raw - .42) / .18;
          position = {
            x: flower.x + Math.sin(t * Math.PI * 2) * 18,
            y: flower.y - 34 + Math.sin(t * Math.PI * 4) * 7
          };
          rotation = Math.sin(t * Math.PI * 2) * 6;
          scale = .92;
        } else {
          const t = easeInOut((raw - .6) / .4);
          position = cubicPoint(
            { x: flower.x, y: flower.y - 34 },
            { x: viewport.width * .48, y: viewport.height * .16 },
            { x: exclusive.x, y: exclusive.y },
            { x: viewport.width + 180, y: clamp(exclusive.y + 60, 130, viewport.height * .62) },
            t
          );
          rotation = -4 + Math.sin(t * Math.PI * 3) * 24;
          scale = .86 + Math.sin(t * Math.PI) * .14;
        }
      } else if (options.role === "title") {
        const t = easeInOut(raw);
        position = cubicPoint(
          { x: viewport.width + 150, y: title.y - 36 },
          { x: viewport.width * .72, y: title.y - 102 },
          { x: viewport.width * .46, y: title.y + 62 },
          { x: -150, y: title.y + 24 },
          t
        );
        rotation = Math.sin(t * Math.PI * 3.2) * 18 - 8;
        scale = .72 + Math.sin(t * Math.PI) * .1;
        opacity = raw < .06 ? raw / .06 : raw > .965 ? (1 - raw) / .035 : .92;
      } else {
        const t = easeInOut(raw);
        const side = options.seed % 2 === 0 ? 1 : -1;
        const depth = options.role === "depth-far" ? .56 : .68;
        position = cubicPoint(
          { x: side > 0 ? viewport.width + 120 : -120, y: viewport.height * (.24 + options.seed * .035) },
          { x: viewport.width * (.78 - options.seed * .025), y: viewport.height * (.18 + options.seed * .025) },
          { x: flower.x + side * 95, y: flower.y - 105 },
          { x: side > 0 ? -120 : viewport.width + 120, y: viewport.height * (.42 + options.seed * .04) },
          t
        );
        rotation = Math.sin(t * Math.PI * 4 + options.seed) * 22;
        scale = depth + Math.sin(t * Math.PI) * .14;
        opacity = raw < .08 ? raw / .08 : raw > .965 ? (1 - raw) / .035 : .82;
      }

      const bob = Math.sin(raw * Math.PI * (options.role === "close" ? 12 : 18) + options.seed) * (options.role === "close" ? 14 : 10);
      position.y += options.role === "title" ? Math.sin(raw * Math.PI * 12 + options.seed) * 8 : bob;
      setButterflyPose(butterfly, position, rotation, scale, clamp(opacity, 0, 1));

      if (raw < 1) {
        requestAnimationFrame(frame);
      } else {
        butterfly.classList.remove("is-flying", "is-resting");
        butterfly.style.opacity = "0";
      }
    }

    requestAnimationFrame(frame);
  };

  const setupChapterTwoButterflies = () => {
    const sections = ["chapterOne", "collections", "chapterThree", "chapterFour", "meetMaker", "kindWords", "beginStory"]
      .map(id => document.getElementById(id))
      .filter(Boolean);
    let layer = document.getElementById("chapterTwoButterflyLayer");
    const monarchMarkup = `
      <span class="svg-monarch svg-monarch-main" data-butterfly="main">
        <span class="monarch-shadow"></span>
        <img class="monarch-whole" src="images/monarch-cover-realistic.png" alt="" draggable="false" decoding="async">
        <span class="left-wing monarch-textured-wing"></span>
        <span class="right-wing monarch-textured-wing"></span>
      </span>
      <span class="svg-monarch svg-monarch-small svg-monarch-small-one" data-butterfly="small-one">
        <span class="monarch-shadow"></span>
        <img class="monarch-whole" src="images/monarch-cover-realistic.png" alt="" draggable="false" decoding="async">
        <span class="left-wing monarch-textured-wing"></span>
        <span class="right-wing monarch-textured-wing"></span>
      </span>
      <span class="svg-monarch svg-monarch-small svg-monarch-small-two" data-butterfly="small-two">
        <span class="monarch-shadow"></span>
        <img class="monarch-whole" src="images/monarch-cover-realistic.png" alt="" draggable="false" decoding="async">
        <span class="left-wing monarch-textured-wing"></span>
        <span class="right-wing monarch-textured-wing"></span>
      </span>`;

    if (!layer && sections.length) {
      layer = document.createElement("div");
      layer.id = "chapterTwoButterflyLayer";
      layer.className = "chapter-two-butterfly-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }

    if (!sections.length || !layer) return;
    layer.innerHTML = monarchMarkup;

    const main = layer.querySelector(".svg-monarch-main");
    const smallOne = layer.querySelector(".svg-monarch-small-one");
    const smallTwo = layer.querySelector(".svg-monarch-small-two");
    const template = main || smallOne || smallTwo;
    const createExtra = (className) => {
      if (!template) return null;
      const clone = template.cloneNode(true);
      clone.className = `svg-monarch ${className}`;
      clone.dataset.butterfly = className;
      clone.style.opacity = "0";
      layer.appendChild(clone);
      return clone;
    };
    const titleButterfly = layer.querySelector(".svg-monarch-title") || createExtra("svg-monarch-title");
    const depthButterfly = layer.querySelector(".svg-monarch-depth") || createExtra("svg-monarch-depth");
    let flightTimer = null;
    let flightStarted = false;

    main?.classList.add("svg-monarch-close");
    smallOne?.classList.add("svg-monarch-flower");
    smallTwo?.classList.add("svg-monarch-depth");

    const runFlightPass = () => {
      if (main) animateMonarch(main, { role: "close", duration: 32000, delay: 0, seed: 1 });
      if (smallOne) animateMonarch(smallOne, { role: "flower", duration: 35000, delay: 1200, seed: 2 });
      if (titleButterfly) animateMonarch(titleButterfly, { role: "title", duration: 30000, delay: 3600, seed: 3 });
      if (smallTwo) animateMonarch(smallTwo, { role: "depth-near", duration: 33000, delay: 5200, seed: 4 });
      if (depthButterfly) animateMonarch(depthButterfly, { role: "depth-far", duration: 36000, delay: 7200, seed: 5 });
    };

    const startFlight = () => {
      if (flightStarted) return;
      flightStarted = true;
      window.setTimeout(runFlightPass, 650);
      flightTimer = window.setInterval(runFlightPass, 43000);
    };

    startFlight();

    window.addEventListener("pagehide", () => {
      if (flightTimer) window.clearInterval(flightTimer);
    }, { once: true });
  };

  document.addEventListener("click", saveCategoryJump);

  const setupPageTransitions = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.body.classList.add("page-ready");
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank") return;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin || !url.pathname.endsWith(".html")) return;

      event.preventDefault();
      document.body.classList.add("page-turning");
      window.setTimeout(() => {
        window.location.href = url.href;
      }, 280);
    });
  };

  const setupPage = () => {
    setupHomeDesignBuilder();
    setupChapterTwoButterflies();
    setupPageTransitions();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPage);
  } else {
    setupPage();
  }
})();
