import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001"
);
const outputPath = path.join(
  recipeRoot,
  "generation/forest-location-recipe-001-generated-plan.json"
);
const dependencyMapPath = path.join(
  recipeRoot,
  "generation/forest-location-recipe-001-dependency-map.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/forest-location-recipe-001-generation-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/forest-location-recipe-001-generation-report.md"
);

const generationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "forest-location-recipe-generation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("forest location recipe generation creates a deterministic plan for the same seed", () => {
  const first = generationModule.buildForestLocationRecipeOutput({ cwd: repoRoot });
  const second = generationModule.buildForestLocationRecipeOutput({ cwd: repoRoot });

  assert.equal(first.output.deterministicFingerprint, second.output.deterministicFingerprint);
  assert.deepEqual(first.output.placementPlan.placements, second.output.placementPlan.placements);
});

test("forest location recipe generation uses only approved dependencies and keeps eucalyptus deferred", () => {
  const dependencyMap = readJson(dependencyMapPath);

  assert.deepEqual(
    dependencyMap.assets.map((asset) => asset.assetId),
    [
      "COASTAL_GRAVEL_PATH_001",
      "COASTAL_GROUND_COVER_001",
      "COASTAL_ROCK_CLUSTER_001",
      "COASTAL_GRASS_TUSSOCK_001",
      "SHRUB_COASTAL_LOW_001",
      "TREE_BOTTLEBRUSH_001"
    ]
  );
  assert.equal(dependencyMap.unsupportedAssetsIncluded, false);
  assert.equal(
    dependencyMap.deferredAssets.some((asset) => asset.assetId === "TREE_EUCALYPTUS_001"),
    true
  );
  assert.equal(dependencyMap.assets.every((asset) => asset.placementCount > 0), true);
});

test("forest location recipe output defines forest zones, trail navigation logic, and discovery zones", () => {
  const output = readJson(outputPath);

  assert.equal(output.zoneAllocation.length, 5);
  assert.equal(output.forestZones.length, 5);
  assert.equal(output.trailNavigationLogic.primaryRouteNodeIds.length, 5);
  assert.equal(output.clearingDiscoveryZones.some((zone) => zone.zoneId === "CLEARING_OR_REST_ZONE"), true);
  assert.equal(output.explorationInterestPoints.length >= 3, true);
});

test("forest location recipe output defines vegetation density rules and stays within mobile performance limits", () => {
  const output = readJson(outputPath);

  assert.equal(output.vegetationDensityRules.DEEP_FOREST_MARGIN_ZONE.density, "HIGH");
  assert.equal(output.mobilePerformanceLimits.withinBudget.close, true);
  assert.equal(output.mobilePerformanceLimits.withinBudget.gameplay, true);
  assert.equal(output.mobilePerformanceLimits.withinBudget.map, true);
  assert.equal(output.mobilePerformanceLimits.withinUniqueAssetCap, true);
});

test("forest location recipe generation validation confirms dependency, deterministic, and safety gates", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(
    validation.nextAllowedAction,
    "recipe_review_or_world_assembly_preview_only"
  );
});

test("forest location recipe generation report documents readiness and no runtime side effects", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Deterministic forest location assembly plan generated/);
  assert.match(report, /TREE_EUCALYPTUS_001/);
  assert.match(report, /No Blender files, GLBs, asset modifications, or runtime activation were performed/i);
  assert.match(report, /deterministic, dependency-validated forest assembly plan ready for preview/i);
});
