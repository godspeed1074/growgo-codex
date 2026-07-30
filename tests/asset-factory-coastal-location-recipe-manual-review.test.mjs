import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
);

const reviewPath = path.join(
  recipeRoot,
  "review/coastal-location-recipe-001-manual-review.json"
);
const tuningPath = path.join(
  recipeRoot,
  "review/coastal-location-recipe-001-tuning-recommendations.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/coastal-location-recipe-001-manual-review-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-manual-review-report.md"
);

const manualReviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-manual-review.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("coastal location manual review records all requested review areas", () => {
  const review = readJson(reviewPath);

  assert.equal(review.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(review.reviewMethod, "non_runtime_preview_package_inspection");
  assert.equal(review.reviewAreas.playerJourney.status, "PASS");
  assert.equal(review.reviewAreas.navigationFlow.status, "PASS");
  assert.equal(review.reviewAreas.assetDensity.status, "TUNE_RECOMMENDED");
  assert.equal(review.reviewAreas.zoneBalance.status, "TUNE_RECOMMENDED");
  assert.equal(review.reviewAreas.shorelineTransition.status, "TUNE_RECOMMENDED");
  assert.equal(review.reviewAreas.explorationInterest.status, "TUNE_RECOMMENDED");
  assert.equal(review.reviewAreas.futurePoiSuitability.status, "PASS");
});

test("coastal location manual review creates deterministic tuning recommendations", () => {
  const recommendations = readJson(tuningPath);

  assert.equal(recommendations.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(recommendations.recommendationCount, 3);
  assert.deepEqual(
    recommendations.recommendations.map((entry) => entry.priority),
    ["HIGH", "HIGH", "MEDIUM"]
  );
});

test("coastal location manual review validation preserves non-runtime safety", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.status, "pass");
  assert.equal(validation.nextAllowedAction, "recipe_refinement_recommended");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
});

test("coastal location manual review report documents findings and tuning readiness", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /overall status: APPROVED_WITH_TUNING_RECOMMENDATIONS/);
  assert.match(report, /playerJourney: PASS/);
  assert.match(report, /zoneBalance: TUNE_RECOMMENDED/);
  assert.match(report, /recipe preview is ready for refinement planning/i);
});

test("coastal location manual review builder remains deterministic", () => {
  const first = manualReviewModule.buildCoastalLocationRecipeManualReview({
    cwd: repoRoot
  });
  const second = manualReviewModule.buildCoastalLocationRecipeManualReview({
    cwd: repoRoot
  });

  assert.equal(first.reviewFingerprint, second.reviewFingerprint);
  assert.deepEqual(first.reviewRecord, second.reviewRecord);
  assert.deepEqual(first.tuningRecommendations, second.tuningRecommendations);
  assert.deepEqual(first.validation, second.validation);
});
