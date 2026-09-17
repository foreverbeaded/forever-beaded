(() => {
  if (!document.querySelector('link[href*="chapter-order-navigation.css"]')) {
    const navigationStyles = document.createElement("link");
    navigationStyles.rel = "stylesheet";
    navigationStyles.href = "css/chapter-order-navigation.css?v=collapsible-preview-1";
    document.head.append(navigationStyles);
  }

  // Collection entrances are shared without changing the navigation itself.
  if (!document.querySelector('script[src*="collection-entrances.js"]')) {
    const entranceScript = document.createElement("script");
    entranceScript.src = "js/collection-entrances.js?v=20260909-fix2";
    document.head.append(entranceScript);
  }
  const collectionChapters = [
    ["flowers.html", "Flower Garden"],
    ["butterflies.html", "Butterfly Garden"],
    ["animal-friends.html", "Animal Friends"],
    ["birds.html", "Birds of the Sky"],
    ["ocean-friends.html", "Ocean Friends"],
    ["sandy-beaches.html", "Sandy Beaches"],
    ["faith-collection.html", "Faith Collection"],
    ["valentines-collection.html", "Valentine's Collection"],
    ["fathers-day-collection.html", "Father's Day Collection"],
    ["sweet-treats.html", "Sweet Treats"],
    ["back-to-school.html", "Back to School"],
    ["fall-collection.html", "Fall Collection"],
    ["tiny-garden-friends.html", "Tiny Garden Friends"],
    ["enchanted-beings.html", "Enchanted Beings"],
    ["outer-space.html", "Outer Space"],
    ["flags-of-the-world.html", "Flags of the World"],
    ["sports.html", "Sports"],
    ["accessories.html", "Accessories"],
    ["monthly-exclusive.html", "Monthly Exclusive"],
    ["create.html", "Create Your Own Treasure"]
  ];
  const utilityPages = [
    ["collections.html", "All Collections"],
    ["my-favourites.html", "My Favourites"]
  ];

  const currentFile = decodeURIComponent(location.pathname.split("/").pop() || "").toLowerCase();
  const collectionIndex = collectionChapters.findIndex(([file]) => file === currentFile);
  const utilityIndex = utilityPages.findIndex(([file]) => file === currentFile);
  if (collectionIndex < 0 && utilityIndex < 0) return;

  const collapsibleBreakpoint = window.matchMedia("(max-width: 1024px)");
  const makeNavigationCollapsible = (navigation) => {
    if (!navigation || navigation.dataset.collapsibleReady === "true") return;

    navigation.dataset.collapsibleReady = "true";
    if (!navigation.id) navigation.id = "collectionChapterTabs";

    const toggle = document.createElement("button");
    toggle.className = "chapter-order-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-controls", navigation.id);
    toggle.innerHTML = '<span>Browse Collections</span><span class="chapter-order-toggle__caret" aria-hidden="true">&#9662;</span>';
    navigation.insertAdjacentElement("beforebegin", toggle);

    const setExpanded = (expanded) => {
      navigation.classList.toggle("is-expanded", expanded);
      navigation.classList.toggle("is-collapsed", !expanded);
      navigation.setAttribute("aria-hidden", String(!expanded));
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.classList.toggle("is-expanded", expanded);
      if ("inert" in navigation) navigation.inert = !expanded;
    };

    const applyViewportDefault = () => setExpanded(!collapsibleBreakpoint.matches);
    toggle.addEventListener("click", () => {
      setExpanded(toggle.getAttribute("aria-expanded") !== "true");
    });
    collapsibleBreakpoint.addEventListener("change", applyViewportDefault);
    applyViewportDefault();
  };

  /* Back to School begins the shared master order; only the active page rotates forward. */
  const backToSchoolIndex = collectionChapters.findIndex(([file]) => file === "back-to-school.html");
  const masterOrder = collectionChapters
    .slice(backToSchoolIndex)
    .concat(collectionChapters.slice(0, backToSchoolIndex), utilityPages);
  const existingNavigation = document.querySelector(".chapter-order-nav");
  if (existingNavigation) {
    const present = new Set([...existingNavigation.querySelectorAll("a")].map((link) => link.getAttribute("href")));
    masterOrder.forEach(([file, label]) => {
      if (present.has(file)) return;
      const link = document.createElement("a");
      link.className = "chapter-order-nav__link";
      link.href = file;
      link.textContent = label;
      existingNavigation.append(link);
    });
    makeNavigationCollapsible(existingNavigation);
    return;
  }
  const activeChapter = masterOrder.find(([file]) => file === currentFile);
  const orderedChapters = activeChapter
    ? [activeChapter, ...masterOrder.filter(([file]) => file !== currentFile)]
    : masterOrder;

  const navigation = document.createElement("nav");
  navigation.className = "chapter-order-nav";
  navigation.setAttribute("aria-label", "Collection chapter order");

  orderedChapters.forEach(([file, label]) => {
    const link = document.createElement("a");
    link.className = "chapter-order-nav__link";
    link.href = file;
    link.textContent = label;
    if (file === currentFile) link.setAttribute("aria-current", "page");
    navigation.append(link);
  });

  if (collectionIndex >= 0) {
    const [nextFile, nextLabel] = collectionChapters[(collectionIndex + 1) % collectionChapters.length];
    const nextChapterLink = document.querySelector(".chapter-navigation__link");
    if (nextChapterLink) {
      nextChapterLink.href = nextFile;
      const nextChapterName = nextChapterLink.querySelector("strong");
      if (nextChapterName) nextChapterName.textContent = nextLabel;
    }
  }

  const searchRow = document.querySelector(".world-search-row");
  const flowerHeading = document.querySelector(".page-heading");
  const createSelectedDesign = document.querySelector(".world-create #selectedDesignSummary");
  const main = document.querySelector("main");

  if (createSelectedDesign) {
    createSelectedDesign.insertAdjacentElement("beforebegin", navigation);
  } else if (searchRow) {
    searchRow.insertAdjacentElement("afterend", navigation);
  } else if (flowerHeading) {
    flowerHeading.append(navigation);
  } else if (main) {
    main.prepend(navigation);
  }

  makeNavigationCollapsible(navigation);
})();
