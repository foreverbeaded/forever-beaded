(() => {
  const collectionChapters = [
    ["flowers.html", "Flower Garden"],
    ["butterflies.html", "Butterfly Garden"],
    ["animal-friends.html", "Animal Friends"],
    ["birds.html", "Birds of the Sky"],
    ["ocean-friends.html", "Ocean Friends"],
    ["sandy-beaches.html", "Sandy Beaches"],
    ["faith-collection.html", "Faith Collection"],
    ["sweet-treats.html", "Sweet Treats"],
    ["back-to-school.html", "Back to School"],
    ["fall-collection.html", "Fall Collection"],
    ["tiny-garden-friends.html", "Tiny Garden Friends"],
    ["enchanted-beings.html", "Enchanted Beings"],
    ["flags-of-the-world.html", "Flags of the World"],
    ["sports.html", "Sports"],
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
  if ((collectionIndex < 0 && utilityIndex < 0) || document.querySelector(".chapter-order-nav")) return;

  /* Back to School begins the shared master order; only the active page rotates forward. */
  const backToSchoolIndex = collectionChapters.findIndex(([file]) => file === "back-to-school.html");
  const masterOrder = collectionChapters
    .slice(backToSchoolIndex)
    .concat(collectionChapters.slice(0, backToSchoolIndex), utilityPages);
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
})();
