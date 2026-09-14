/* Shared one-shot collection entrances; never hide content without motion support. */
(() => {
  "use strict";
  if (document.body.classList.contains("storybook-home") || document.documentElement.dataset.collectionEntrances) return;
  document.documentElement.dataset.collectionEntrances = "loading";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const registered = new WeakSet(), seen = new Set(), pending = new Set();
  let started = false;
  const cards = ".product-grid .product-card, .collection-grid .collection-card";
  const keyFor = el => el.dataset.favouriteKey || el.dataset.createUrl || el.querySelector("a")?.getAttribute("href") || el.textContent.trim();
  function finish(el) {
    el.classList.remove("collection-enter-pending", "collection-enter-running");
    el.dataset.entranceState = "complete";
    pending.delete(el);
  }
  function enter(el, delay = 0) {
    if (reduced.matches || el.contains(document.activeElement)) return finish(el);
    el.style.setProperty("--collection-enter-delay", delay + "ms");
    el.classList.remove("collection-enter-pending");
    el.classList.add("collection-enter-running");
    el.dataset.entranceState = "animating";
    el.addEventListener("animationend", event => { if (event.target === el) finish(el); }, { once: true });
    setTimeout(() => finish(el), 1200 + delay);
  }
  const observer = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    if (document.hidden) return;
    let stagger = 0;
    entries.forEach(entry => {
      const el = entry.target;
      if (!entry.isIntersecting || !el.getClientRects().length || el.hidden) return;
      observer.unobserve(el);
      seen.add(keyFor(el));
      enter(el, Math.min(stagger++, 5) * 120);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -24px 0px" }) : null;
  function register() {
    document.querySelectorAll(cards).forEach(el => {
      if (registered.has(el)) return;
      registered.add(el);
      el.classList.add("collection-enter-card");
      if (reduced.matches || !observer || seen.has(keyFor(el))) return finish(el);
      el.classList.add("collection-enter-pending");
      el.dataset.entranceState = "pending";
      pending.add(el);
      observer.observe(el);
    });
  }
  function start() {
    if (document.hidden || started) return;
    started = true;
    document.removeEventListener("visibilitychange", start);
    document.documentElement.dataset.collectionEntrances = "ready";
    const areas = [...document.querySelectorAll(".page-heading, .world-hero-copy, .world-search-row, .shop-results-row, .chapter-order-nav, main > .section-heading, main section > .section-heading")];
    areas.filter(el => !areas.some(parent => parent !== el && parent.contains(el))).forEach((el, i) => {
      el.classList.add("collection-enter-heading");
      el.classList.add("collection-enter-pending");
      requestAnimationFrame(() => requestAnimationFrame(() => enter(el, 120 + Math.min(i, 3) * 90)));
    });
    register();
    document.documentElement.classList.remove("collection-enter-boot");
    new MutationObserver(register).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
  }
  function ready() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (document.hidden) document.addEventListener("visibilitychange", start);
      else start();
    }));
  }
  const whenParsed = () => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", ready, { once: true }) : ready();
  if (document.querySelector('link[data-collection-entrances]')) {
    // A preceding static stylesheet is already ready before this deferred script.
    // Reassigning its URL can invalidate sheet and lose the load handoff.
    whenParsed();
  } else {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "css/collection-entrances.css?v=20260909-fix2";
    stylesheet.onload = whenParsed;
    stylesheet.onerror = () => { document.documentElement.dataset.collectionEntrances = "stylesheet-error"; };
    document.head.append(stylesheet);
  }
  reduced.addEventListener("change", () => {
    if (reduced.matches) {
      document.querySelectorAll(".collection-enter-pending, .collection-enter-running").forEach(finish);
      observer?.disconnect();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pending.forEach(el => { observer?.unobserve(el); observer?.observe(el); });
  });
  document.addEventListener("focusin", event => {
    const el = event.target.closest(".collection-enter-pending, .collection-enter-running");
    if (el) { observer?.unobserve(el); finish(el); }
  });
})();
