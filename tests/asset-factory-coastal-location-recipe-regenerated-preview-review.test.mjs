import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
);

const regeneratedPreviewDataPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-regenerated-preview-data.json"
);
const comparisonPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-regenerated-before-after-comparison.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/coastal-location-recipe-001-regenerated-preview-review-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-regenerated-preview-review-report.md"
);

const reviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-regenerated-preview-review.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("regenerated preview package is created from the refined recipe output", () => {
  const previewData = readJson(regeneratedPreviewDataPath);

  assert.equal(previewData.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(previewData.totalPlacements, 28);
  assert.equal(previewData.previewPlacements.length, 28);
});

test("before and after comparison confirms the key regeneration improvements", () => {
  const comparison = readJson(comparisonPath);

  assert.equal(comparison.review.shorelineTransition.status, "IMPROVED");
  assert.equal(comparison.review.destinationQuality.status, "IMPROVED");
  assert.equal(comparison.review.vegetationBalance.status, "IMPROVED");
  assert.equal(comparison.review.explorationInterest.status, "IMPROVED");
  assert.equal(comparison.review.performanceImpact.status, "ACCEPTABLE");
  assert.equal(comparison.overallStatus, "APPROVED_FOR_RECIPE_APPROVAL");
});

test("regenerated preview review validation marks the recipe approval gate ready", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.status, "pass");
  assert.equal(validation.nextAllowedAction, "recipe_approval_ready");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
});

test("regenerated preview review report documents confirmed improvements and safe execution", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /shoreline transition: IMPROVED/);
  assert.match(report, /destination quality: IMPROVED/);
  assert.match(report, /performance impact: ACCEPTABLE/);
  assert.match(
    report,
    /No Blender, GLBs, asset modification, or runtime activation were performed/i
  );
});

test("regenerated preview review builder remains deterministic", () => {
  const first = reviewModule.buildCoastalLocationRecipeRegeneratedPreviewReview({
    cwd: repoRoot
  });
  const second = reviewModule.buildCoastalLocationRecipeRegeneratedPreviewReview({
    cwd: repoRoot
  });

  assert.equal(first.reviewFingerprint, second.reviewFingerprint);
  assert.deepEqual(first.comparison, second.comparison);
  assert.deepEqual(first.validation, second.validation);
});
