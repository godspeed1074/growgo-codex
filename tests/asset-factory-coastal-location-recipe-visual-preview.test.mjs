import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
);

const rendererDataPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-visual-renderer-data.json"
);
const inspectionOutputPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-visual-inspection-output.json"
);
const zoneVisualizationPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-zone-visualization.json"
);
const placementInspectionPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-placement-inspection-report.json"
);
const validationPath = path.join(
  recipeRoot,
  "validation/coastal-location-recipe-001-visual-preview-validation.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-visual-preview-report.md"
);

const visualPreviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-visual-preview.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("coastal location visual preview creates renderer data for non-runtime inspection", () => {
  const rendererData = readJson(rendererDataPath);

  assert.equal(rendererData.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(rendererData.coordinateSpace, "non_runtime_recipe_preview_2d");
  assert.equal(rendererData.layers.length, 3);
  assert.equal(rendererData.marks.length, 26);
  assert.equal(rendererData.marks.every((mark) => typeof mark.layerId === "string"), true);
});

test("coastal location visual preview creates inspection output with requested review categories", () => {
  const inspectionOutput = readJson(inspectionOutputPath);

  assert.equal(inspectionOutput.review.playerFlow.status, "PASS");
  assert.equal(inspectionOutput.review.assetSpacing.status, "PASS");
  assert.equal(inspectionOutput.review.zoneTransitions.status, "PASS");
  assert.equal(inspectionOutput.review.densityBalance.status, "PASS");
  assert.equal(inspectionOutput.review.navigationClarity.status, "PASS");
});

test("coastal location visual preview creates zone visualization and placement inspection report", () => {
  const zoneVisualization = readJson(zoneVisualizationPath);
  const placementInspection = readJson(placementInspectionPath);

  assert.equal(zoneVisualization.zones.length, 5);
  assert.equal(
    zoneVisualization.zones.some((zone) => zone.zoneId === "WET_CROSSING_ZONE"),
    true
  );
  assert.equal(placementInspection.totalPlacements, 26);
  assert.equal(placementInspection.spacingStatus, "PASS");
  assert.deepEqual(Object.keys(placementInspection.roleCounts).sort(), [
    "accent_native_tree",
    "coastal_shrub_mass",
    "elevated_wet_crossing",
    "native_grass_breakup",
    "primary_path_surface",
    "shoreline_transition_band",
    "terrain_detail_cluster",
    "understory_ground_blend"
  ]);
});

test("coastal location visual preview validation confirms non-runtime review readiness", () => {
  const validation = readJson(validationPath);

  assert.equal(validation.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.nextAllowedAction, "manual_visual_preview_review_only");
});

test("coastal location visual preview report documents readiness without runtime side effects", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Non-runtime visual inspection package assembled/);
  assert.match(report, /player flow: PASS/);
  assert.match(report, /zone transitions: PASS/);
  assert.match(report, /navigation clarity: PASS/);
  assert.match(
    report,
    /No runtime activation, Blender files, GLBs, or asset modifications were performed/i
  );
});

test("coastal location visual preview builder remains deterministic", () => {
  const first = visualPreviewModule.buildCoastalLocationRecipeVisualPreview({ cwd: repoRoot });
  const second = visualPreviewModule.buildCoastalLocationRecipeVisualPreview({ cwd: repoRoot });

  assert.equal(first.visualPreviewFingerprint, second.visualPreviewFingerprint);
  assert.deepEqual(first.previewRendererData, second.previewRendererData);
  assert.deepEqual(first.visualInspectionOutput, second.visualInspectionOutput);
});
