const assert = require("node:assert/strict");
const test = require("node:test");

const { filterApprovedReviews, resolveApiBaseUrl } = require("../../js/review-public.js");

test("review page resolves the live API before approved reviews load", () => {
  assert.equal(resolveApiBaseUrl("foreverbeaded.ca"), "https://forever-beaded-api.onrender.com");
  assert.equal(resolveApiBaseUrl("www.foreverbeaded.ca"), "https://forever-beaded-api.onrender.com");
  assert.equal(resolveApiBaseUrl("localhost"), "http://127.0.0.1:3000");
  assert.equal(resolveApiBaseUrl("127.0.0.1"), "http://127.0.0.1:3000");
});

test("public review fixtures include approved reviews and hide pending or rejected reviews", () => {
  const fixtures = [
    { id: 1, displayName: "Approved Customer", status: "APPROVED", text: "Beautiful!" },
    { id: 2, displayName: "Pending Customer", status: "PENDING", text: "Awaiting moderation" },
    { id: 3, displayName: "Rejected Customer", status: "REJECTED", text: "Not public" },
    { id: 4, displayName: "Public API Customer", text: "Love it!" },
    { id: 5, displayName: "Legacy Approved", approved: true, text: "Amazing!" },
    { id: 6, displayName: "Legacy Hidden", approved: false, text: "Private" }
  ];

  assert.deepEqual(filterApprovedReviews(fixtures).map(review => review.id), [1, 4, 5]);
});
