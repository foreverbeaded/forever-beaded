(() => {
  const monarchMarkup = `
    <span class="monarch-shadow"></span>
    <img class="monarch-whole" src="images/monarch-cover-realistic.png" alt="" draggable="false" decoding="async">
    <span class="left-wing monarch-textured-wing"></span>
    <span class="right-wing monarch-textured-wing"></span>
  `;

  const protectImages = () => {
    document.querySelectorAll("img").forEach((image) => {
      image.setAttribute("draggable", "false");
    });

    document.addEventListener("contextmenu", (event) => {
      if (event.target.closest("img")) {
        event.preventDefault();
      }
    });
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const setupScrollMonarchs = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.querySelector(".scroll-monarch-layer")) return;

    const layer = document.createElement("div");
    layer.className = "scroll-monarch-layer";
    layer.setAttribute("aria-hidden", "true");

    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const count = isMobile ? 1 : 2;
    const butterflies = Array.from({ length: count }, (_, index) => {
      const node = document.createElement("span");
      node.className = `svg-monarch scroll-monarch scroll-monarch-${index + 1}`;
      node.innerHTML = monarchMarkup;
      layer.appendChild(node);
      const side = index % 2 === 0 ? "left" : "right";
      const baseX = side === "left" ? window.innerWidth * .08 : window.innerWidth * .92;
      return {
        node,
        index,
        side,
        x: isMobile ? window.innerWidth * .86 : baseX,
        y: window.innerHeight * (.28 + (index * .32)),
        phase: index * 2.7,
      };
    });

    document.body.appendChild(layer);

    let lastScroll = window.scrollY || 0;
    let scrollDirection = 1;
    let scrollImpulse = 0;
    let directionalBias = 0;
    let directionUntil = 0;
    let lastNow = performance.now();

    const frame = (now) => {
      const currentScroll = window.scrollY || 0;
      const delta = currentScroll - lastScroll;
      if (Math.abs(delta) > .4) {
        scrollDirection = delta > 0 ? 1 : -1;
        scrollImpulse = clamp(scrollImpulse + (delta * .12), -110, 110);
        directionalBias = clamp(directionalBias + (delta * .34), -150, 150);
        directionUntil = now + 950;
        butterflies.forEach((butterfly) => {
          butterfly.y = clamp(butterfly.y + clamp(delta * .22, -72, 72), 70, window.innerHeight - 70);
        });
      }
      lastScroll = currentScroll;
      scrollImpulse *= .9;
      directionalBias *= .94;

      const dt = clamp((now - lastNow) / 1000, 0, .08);
      lastNow = now;
      const pageProgress = document.documentElement.scrollHeight > window.innerHeight
        ? currentScroll / (document.documentElement.scrollHeight - window.innerHeight)
        : 0;
      const introActive = document.body.classList.contains("intro-active");

      butterflies.forEach((butterfly) => {
        const orbit = (now / 1000) + butterfly.phase;
        const edgeX = butterfly.side === "left" ? window.innerWidth * .08 : window.innerWidth * .92;
        const mobileX = window.innerWidth * .86;
        const column = isMobile ? mobileX : edgeX;
        const edgeDrift = isMobile ? 16 : 30;
        const naturalDesired = {
          x: clamp(column + (Math.sin(orbit * .42) * edgeDrift), 42, window.innerWidth - 42),
          y: clamp(
            (window.innerHeight * (.28 + (butterfly.index * .34))) +
            (Math.sin((pageProgress * Math.PI * 2.4) + butterfly.phase) * 58) +
            scrollImpulse +
            directionalBias +
            (scrollDirection * 18) +
            (Math.sin(orbit * .9) * 16),
            86,
            window.innerHeight - 86
          )
        };

        const directionDesired = {
          x: clamp(butterfly.x + (Math.sin(orbit * 1.3) * 18), 55, window.innerWidth - 55),
          y: clamp(butterfly.y + (scrollDirection * (52 + (butterfly.index * 7))), 78, window.innerHeight - 78)
        };

        const desired = now < directionUntil
            ? directionDesired
            : naturalDesired;

        butterfly.x += (desired.x - butterfly.x) * clamp(dt * 1.6, .03, .14);
        butterfly.y += (desired.y - butterfly.y) * clamp(dt * 1.7, .03, .15);

        const resting = false;
        const opacity = introActive ? 0 : .5;
        const rotation = Math.sin(orbit * .68) * 10 + (scrollDirection * 4);
        const scale = (window.innerWidth <= 640 ? .54 : .68) + (Math.sin(orbit * .52) * .045) - (butterfly.index * .035);

        butterfly.node.classList.add("is-flying");
        butterfly.node.classList.toggle("is-resting", resting);
        butterfly.node.style.opacity = String(opacity);
        butterfly.node.style.transform = `translate3d(${butterfly.x}px, ${butterfly.y}px, 0) translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
      });

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  };

  const setupPage = () => {
    protectImages();
    setupScrollMonarchs();
  };

  if (document.readyState !== "loading") {
    setupPage();
  } else {
    document.addEventListener("DOMContentLoaded", setupPage);
  }
})();
