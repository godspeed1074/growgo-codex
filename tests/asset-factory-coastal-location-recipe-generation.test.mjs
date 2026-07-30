import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
);
const outputPath = path.join(
  recipeRoot,
  "generation/coastal-location-recipe-001-generated-plan.json"
);
const dependencyMapPath = path.join(
  recipeRoot,
  "generation/coastal-location-recipe-001-dependency-map.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/coastal-location-recipe-001-generation-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-generation-report.md"
);

const generationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-generation.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("coastal location recipe generation creates a deterministic plan for the same seed", () => {
  const first = generationModule.buildCoastalLocationRecipeOutput({ cwd: repoRoot });
  const second = generationModule.buildCoastalLocationRecipeOutput({ cwd: repoRoot });

  assert.equal(first.output.deterministicFingerprint, second.output.deterministicFingerprint);
  assert.deepEqual(first.output.placementPlan.placements, second.output.placementPlan.placements);
});

test("coastal location recipe generation uses only approved dependencies and excludes unsupported assets", () => {
  const dependencyMap = readJson(dependencyMapPath);

  assert.deepEqual(
    dependencyMap.assets.map((asset) => asset.assetId),
    [
      "COASTAL_GRAVEL_PATH_001",
      "COASTAL_BOARDWALK_001",
      "COASTAL_WATER_EDGE_001",
      "COASTAL_GROUND_COVER_001",
      "COASTAL_ROCK_CLUSTER_001",
      "COASTAL_GRASS_TUSSOCK_001",
      "SHRUB_COASTAL_LOW_001",
      "TREE_BOTTLEBRUSH_001"
    ]
  );
  assert.equal(dependencyMap.unsupportedAssetsIncluded, false);
  assert.equal(dependencyMap.assets.every((asset) => asset.placementCount > 0), true);
});

test("coastal location recipe output defines zone allocation, navigation path logic, and water transition rules", () => {
  const output = readJson(outputPath);

  assert.equal(output.zoneAllocation.length, 5);
  assert.equal(output.navigationPathLogic.primaryRouteNodeIds.length, 4);
  assert.equal(output.waterTransitionRules.waterEdgeTraversable, false);
  assert.deepEqual(output.waterTransitionRules.boardwalkRequiredZones, ["WET_CROSSING_ZONE"]);
});

test("coastal location recipe output defines vegetation density rules and stays within mobile performance limits", () => {
  const output = readJson(outputPath);

  assert.equal(output.vegetationDensityRules.VEGETATION_BUFFER_ZONE.density, "MEDIUM");
  assert.equal(output.mobilePerformanceLimits.withinBudget.close, true);
  assert.equal(output.mobilePerformanceLimits.withinBudget.gameplay, true);
  assert.equal(output.mobilePerformanceLimits.withinBudget.map, true);
  assert.equal(output.mobilePerformanceLimits.withinUniqueAssetCap, true);
});

test("coastal location recipe generation validation confirms dependency, deterministic, and safety gates", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(
    validation.nextAllowedAction,
    "recipe_review_or_world_assembly_preview_only"
  );
});

test("coastal location recipe generation report documents readiness and no runtime side effects", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Deterministic coastal location assembly plan generated/);
  assert.match(report, /COASTAL_BOARDWALK_001: \d+ placements/);
  assert.match(report, /No Blender files, GLBs, asset modifications, or runtime activation were performed/i);
  assert.match(report, /deterministic, dependency-validated assembly plan ready for review/i);
});
