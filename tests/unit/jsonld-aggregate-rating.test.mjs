// Tests for buildAggregateRating — the JSON-LD aggregateRating block.
//
// Política CRÍTICA: NUNCA fabricar ratings. Google penaliza fake reviews
// e o helper deve devolver null quando review_count = 0 ou input ausente.

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildAggregateRating } from "../../src/lib/jsonld.ts";

test("buildAggregateRating: null when input is null or undefined", () => {
  assert.equal(buildAggregateRating(null), null);
  assert.equal(buildAggregateRating(undefined), null);
});

test("buildAggregateRating: null when review_count is 0", () => {
  assert.equal(
    buildAggregateRating({ rating_value: 4.5, review_count: 0, best_rating: 5, worst_rating: 1 }),
    null,
    "must NOT emit aggregateRating block when no reviews exist (Google policy)",
  );
});

test("buildAggregateRating: null when review_count is negative", () => {
  assert.equal(
    buildAggregateRating({ rating_value: 4.5, review_count: -1, best_rating: 5, worst_rating: 1 }),
    null,
  );
});

test("buildAggregateRating: emits proper Schema.org shape when reviews exist", () => {
  const got = buildAggregateRating({
    rating_value: 4.5, review_count: 12, best_rating: 5, worst_rating: 1,
  });
  assert.ok(got, "should emit a block");
  assert.equal(got["@type"], "AggregateRating");
  assert.equal(got.ratingValue, "4.50", "rating_value formatted to 2 decimals");
  assert.equal(got.reviewCount, 12);
  assert.equal(got.bestRating, 5);
  assert.equal(got.worstRating, 1);
});

test("buildAggregateRating: ratingValue is 2-decimal string (Google expects)", () => {
  const got = buildAggregateRating({
    rating_value: 4, review_count: 1, best_rating: 5, worst_rating: 1,
  });
  assert.equal(got.ratingValue, "4.00", "integer rating still formatted to 2 decimals");

  const got2 = buildAggregateRating({
    rating_value: 3.333333, review_count: 7, best_rating: 5, worst_rating: 1,
  });
  assert.equal(got2.ratingValue, "3.33", "long decimals truncated to 2");
});

test("buildAggregateRating: defaults best/worst when missing", () => {
  const got = buildAggregateRating({
    rating_value: 4, review_count: 1, best_rating: undefined, worst_rating: undefined,
  });
  assert.equal(got.bestRating, 5);
  assert.equal(got.worstRating, 1);
});

test("buildAggregateRating: review_count of exactly 1 still emits (1+ is valid)", () => {
  // Google's threshold is >= 1 review.
  const got = buildAggregateRating({
    rating_value: 5, review_count: 1, best_rating: 5, worst_rating: 1,
  });
  assert.ok(got, "1 review must produce a block");
  assert.equal(got.reviewCount, 1);
});

test("buildAggregateRating: high review counts pass through unchanged", () => {
  const got = buildAggregateRating({
    rating_value: 4.87, review_count: 1234, best_rating: 5, worst_rating: 1,
  });
  assert.equal(got.reviewCount, 1234);
  assert.equal(got.ratingValue, "4.87");
});
