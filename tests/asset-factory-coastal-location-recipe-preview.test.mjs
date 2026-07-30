import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
);
const previewDataPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-preview-data.json"
);
const dependencyVisualizationPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-dependency-visualization.json"
);
const zoneSummaryPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-zone-summary.json"
);
const densityReportPath = path.join(
  recipeRoot,
  "preview/coastal-location-recipe-001-density-report.json"
);
const previewValidationPath = path.join(
  recipeRoot,
  "validation/coastal-location-recipe-001-preview-validation.json"
);
const previewReportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-preview-report.md"
);

const previewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-preview.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("coastal location preview creates placement preview data from the generated plan", () => {
  const previewData = readJson(previewDataPath);

  assert.equal(previewData.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(previewData.previewMode, "non_runtime_2d_layout_reference");
  assert.equal(previewData.totalPlacements, 26);
  assert.equal(previewData.previewPlacements.length, 26);
  assert.equal(previewData.previewBounds.minX < previewData.previewBounds.maxX, true);
  assert.equal(previewData.previewBounds.minY < previewData.previewBounds.maxY, true);
});

test("coastal location preview creates dependency visualization and zone summary", () => {
  const visualization = readJson(dependencyVisualizationPath);
  const zoneSummary = readJson(zoneSummaryPath);

  assert.equal(visualization.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(visualization.nodes.length, 8);
  assert.equal(visualization.edges.length, 7);
  assert.equal(zoneSummary.length, 5);
  assert.equal(zoneSummary.every((zone) => zone.placementCount > 0), true);
});

test("coastal location preview creates density report with reviewable vegetation and structural balance", () => {
  const densityReport = readJson(densityReportPath);
  const buffer = densityReport.find((entry) => entry.zoneId === "VEGETATION_BUFFER_ZONE");
  const shoreline = densityReport.find((entry) => entry.zoneId === "SHORELINE_EDGE_ZONE");

  assert.equal(densityReport.length, 5);
  assert.equal(buffer.densityProfile, "MEDIUM");
  assert.equal(buffer.vegetationPlacementCount >= shoreline.vegetationPlacementCount, true);
  assert.equal(
    densityReport.every((entry) => typeof entry.placementsPerLaneUnit === "number"),
    true
  );
});

test("coastal location preview validation passes review and safety checks", () => {
  const validation = readJson(previewValidationPath);

  assert.equal(validation.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.nextAllowedAction, "preview_review_only");
});

test("coastal location preview report documents non-runtime review readiness", () => {
  const report = fs.readFileSync(previewReportPath, "utf8");

  assert.match(report, /Non-runtime preview package assembled/);
  assert.match(report, /navigation flow: PASS/);
  assert.match(report, /water transition: PASS/);
  assert.match(report, /performance budgets: PASS/);
  assert.match(
    report,
    /No Blender files, GLBs, asset modifications, or runtime activation were performed/i
  );
});

test("coastal location preview builder remains deterministic for the same generated plan", () => {
  const first = previewModule.buildCoastalLocationRecipePreview({ cwd: repoRoot });
  const second = previewModule.buildCoastalLocationRecipePreview({ cwd: repoRoot });

  assert.equal(first.previewFingerprint, second.previewFingerprint);
  assert.deepEqual(first.zoneSummary, second.zoneSummary);
  assert.deepEqual(first.densityReport, second.densityReport);
});
