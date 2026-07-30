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
  "generation/coastal-location-recipe-001-regenerated-plan.json"
);
const dependencyMapPath = path.join(
  recipeRoot,
  "generation/coastal-location-recipe-001-regenerated-dependency-map.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/coastal-location-recipe-001-regeneration-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-regeneration-comparison-report.md"
);

const regenerationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-controlled-regeneration.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("controlled regeneration creates refined deterministic output", () => {
  const output = readJson(outputPath);

  assert.equal(output.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(output.generationMode, "deterministic_recipe_assembly_plan_refined");
  assert.equal(output.refinementState.refinementApplied, true);
  assert.equal(output.placementPlan.totalPlacements, 28);
});

test("controlled regeneration applies shoreline, destination, density, and exploration refinements", () => {
  const output = readJson(outputPath);

  assert.equal(
    output.placementPlan.placements.some(
      (placement) =>
        placement.zoneId === "WET_CROSSING_ZONE" &&
        placement.role === "shoreline_transition_band"
    ),
    true
  );
  assert.equal(
    output.placementPlan.placements.some(
      (placement) =>
        placement.zoneId === "LOOKOUT_OR_REST_ZONE" &&
        placement.role === "terrain_detail_cluster"
    ),
    true
  );
  assert.equal(
    output.placementPlan.placements.some(
      (placement) =>
        placement.zoneId === "SHORELINE_EDGE_ZONE" &&
        placement.role === "understory_ground_blend"
    ),
    true
  );
  assert.equal(
    output.placementPlan.placements.some(
      (placement) =>
        placement.zoneId === "LOOKOUT_OR_REST_ZONE" &&
        placement.role === "understory_ground_blend"
    ),
    true
  );
});

test("controlled regeneration dependency map and performance remain valid", () => {
  const dependencyMap = readJson(dependencyMapPath);
  const output = readJson(outputPath);

  assert.equal(dependencyMap.assets.find((asset) => asset.assetId === "COASTAL_WATER_EDGE_001").placementCount, 4);
  assert.equal(dependencyMap.assets.find((asset) => asset.assetId === "COASTAL_ROCK_CLUSTER_001").placementCount, 3);
  assert.equal(output.mobilePerformanceLimits.withinBudget.close, true);
  assert.equal(output.mobilePerformanceLimits.withinBudget.gameplay, true);
  assert.equal(output.mobilePerformanceLimits.withinBudget.map, true);
});

test("controlled regeneration validation and report show preview-review readiness", () => {
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(validation.nextAllowedAction, "preview_review_ready");
  assert.match(report, /Controlled deterministic regeneration completed/);
  assert.match(report, /previous:/);
  assert.match(report, /current:/);
});

test("controlled regeneration remains deterministic", () => {
  const first = regenerationModule.buildControlledRegeneratedRecipe({
    cwd: repoRoot,
    writeFiles: false
  });
  const second = regenerationModule.buildControlledRegeneratedRecipe({
    cwd: repoRoot,
    writeFiles: false
  });

  assert.equal(
    first.output.deterministicFingerprint,
    second.output.deterministicFingerprint
  );
  assert.deepEqual(first.output.placementPlan.placements, second.output.placementPlan.placements);
  assert.deepEqual(first.comparison, second.comparison);
});
