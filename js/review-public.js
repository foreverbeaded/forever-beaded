(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.FOREVER_BEADED_REVIEW_PUBLIC = api;
    root.FOREVER_BEADED_API_BASE_URL = api.resolveApiBaseUrl(
      root.location?.hostname,
      root.FOREVER_BEADED_API_BASE_URL
    );
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  const PRODUCTION_API_URL = "https://forever-beaded-api.onrender.com";
  const LOCAL_API_URL = "http://127.0.0.1:3000";

  function resolveApiBaseUrl(hostname, configuredUrl) {
    if (String(configuredUrl || "").trim()) {
      return String(configuredUrl).replace(/^http:\/\/localhost:3000\/?$/i, LOCAL_API_URL);
    }
    return ["localhost", "127.0.0.1"].includes(String(hostname || "").toLowerCase())
      ? LOCAL_API_URL
      : PRODUCTION_API_URL;
  }

  function filterApprovedReviews(reviews) {
    if (!Array.isArray(reviews)) return [];
    return reviews.filter(review => {
      if (!review || typeof review !== "object") return false;
      const status = String(review.status || "").trim().toUpperCase();
      if (status) return status === "APPROVED";
      if (Object.prototype.hasOwnProperty.call(review, "approved")) return review.approved === true;
      return true;
    });
  }

  return { resolveApiBaseUrl, filterApprovedReviews };
});
