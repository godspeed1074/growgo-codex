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
  "generation/forest-location-recipe-001-regenerated-plan.json"
);
const dependencyMapPath = path.join(
  recipeRoot,
  "generation/forest-location-recipe-001-regenerated-dependency-map.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/forest-location-recipe-001-regeneration-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/forest-location-recipe-001-regeneration-comparison-report.md"
);

const regenerationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "forest-location-recipe-controlled-regeneration.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("controlled forest regeneration creates refined deterministic output", () => {
  const output = readJson(outputPath);

  assert.equal(output.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(output.generationMode, "deterministic_recipe_assembly_plan_refined");
  assert.equal(output.refinementState.refinementApplied, true);
  assert.equal(output.placementPlan.totalPlacements, 28);
});

test("controlled forest regeneration applies canopy, clearing, and curiosity refinements", () => {
  const output = readJson(outputPath);

  assert.equal(
    output.placementPlan.placements.some(
      (placement) =>
        placement.zoneId === "CANOPY_TRACK_ZONE" &&
        placement.role === "understory_ground_blend" &&
        placement.placementId === "COASTAL_GROUND_COVER_001:CANOPY_TRACK_ZONE:07"
    ),
    true
  );
  assert.equal(
    output.placementPlan.placements.some(
      (placement) =>
        placement.zoneId === "CLEARING_OR_REST_ZONE" &&
        placement.role === "forest_shrub_mass"
    ),
    true
  );
  assert.equal(
    output.placementPlan.placements.some(
      (placement) =>
        placement.zoneId === "DEEP_FOREST_MARGIN_ZONE" &&
        placement.role === "terrain_detail_cluster"
    ),
    true
  );
});

test("controlled forest regeneration dependency map and performance remain valid", () => {
  const dependencyMap = readJson(dependencyMapPath);
  const output = readJson(outputPath);

  assert.equal(
    dependencyMap.assets.find((asset) => asset.assetId === "COASTAL_GROUND_COVER_001")
      .placementCount,
    8
  );
  assert.equal(
    dependencyMap.assets.find((asset) => asset.assetId === "COASTAL_ROCK_CLUSTER_001")
      .placementCount,
    4
  );
  assert.equal(
    dependencyMap.assets.find((asset) => asset.assetId === "COASTAL_GRASS_TUSSOCK_001")
      .placementCount,
    5
  );
  assert.equal(output.mobilePerformanceLimits.withinBudget.close, true);
  assert.equal(output.mobilePerformanceLimits.withinBudget.gameplay, true);
  assert.equal(output.mobilePerformanceLimits.withinBudget.map, true);
});

test("controlled forest regeneration validation and report show preview-review readiness", () => {
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(validation.nextAllowedAction, "preview_review_ready");
  assert.match(report, /Controlled deterministic regeneration completed/);
  assert.match(report, /previous:/);
  assert.match(report, /current:/);
});

test("controlled forest regeneration remains deterministic", () => {
  const first = regenerationModule.buildControlledRegeneratedForestRecipe({
    cwd: repoRoot,
    writeFiles: false
  });
  const second = regenerationModule.buildControlledRegeneratedForestRecipe({
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
