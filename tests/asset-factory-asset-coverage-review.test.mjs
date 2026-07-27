import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const coverageReviewModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-coverage-review.mjs")
);

test("coverage calculation reports expected pack percentages", () => {
  const layer = coverageReviewModule.createAssetFactoryCoverageReviewLayer();
  const nature = layer.getPackReport("NATURE");
  const residential = layer.getPackReport("RESIDENTIAL");

  assert.ok(nature);
  assert.equal(nature.familyCoveragePercentage, 100);
  assert.equal(nature.recipeCoveragePercentage, 100);
  assert.equal(nature.variantCoveragePercentage, 13);
  assert.equal(nature.packCoveragePercentage, 71);

  assert.ok(residential);
  assert.equal(residential.packCoveragePercentage, 89);
});

test("missing recipe detection identifies uncovered nature Atlas demand", () => {
  const layer = coverageReviewModule.createAssetFactoryCoverageReviewLayer();
  const nature = layer.getPackReport("NATURE");

  assert.deepEqual(nature.recipeCoverage.uncoveredRecipes, []);
  assert.equal(nature.highestValueGaps[0].gapType, "underfilled_asset_family");
});

test("priority ordering favors lowest coverage first then existing pack priority order", () => {
  const layer = coverageReviewModule.createAssetFactoryCoverageReviewLayer();
  const orderedCategories = layer.report.recommendedNextActions.map((entry) => entry.category);

  assert.deepEqual(orderedCategories, [
    "CIVIC",
    "ROAD_AND_STREET",
    "TRANSPORT",
    "NATURE",
    "COMMERCIAL",
    "RESIDENTIAL"
  ]);
});

test("same inputs produce deterministic same coverage report", () => {
  const first = coverageReviewModule.createAssetFactoryCoverageReviewLayer();
  const second = coverageReviewModule.createAssetFactoryCoverageReviewLayer();

  assert.deepEqual(first.report, second.report);
  assert.equal(
    first.validation.deterministicCoverageHash,
    second.validation.deterministicCoverageHash
  );
});

test("explicit coverage validation passes contract checks", () => {
  const layer = coverageReviewModule.createAssetFactoryCoverageReviewLayer();
  const validation = coverageReviewModule.validateAssetFactoryCoverageReviewLayer(layer);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.assetFactoryCoverageReviewLayer.validation.registryCompleteness,
    true
  );
  assert.equal(
    validation.assetFactoryCoverageReviewLayer.validation.recipeLinksValid,
    true
  );
  assert.equal(
    validation.assetFactoryCoverageReviewLayer.validation.noDuplicateCategories,
    true
  );
});
