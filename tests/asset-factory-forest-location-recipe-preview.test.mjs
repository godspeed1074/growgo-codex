import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001"
);
const previewDataPath = path.join(
  recipeRoot,
  "preview/forest-location-recipe-001-preview-data.json"
);
const dependencyVisualizationPath = path.join(
  recipeRoot,
  "preview/forest-location-recipe-001-dependency-visualization.json"
);
const zoneSummaryPath = path.join(
  recipeRoot,
  "preview/forest-location-recipe-001-zone-summary.json"
);
const densityReportPath = path.join(
  recipeRoot,
  "preview/forest-location-recipe-001-density-report.json"
);
const placementInspectionPath = path.join(
  recipeRoot,
  "preview/forest-location-recipe-001-placement-inspection-report.json"
);
const visualRendererDataPath = path.join(
  recipeRoot,
  "preview/forest-location-recipe-001-visual-renderer-data.json"
);
const previewValidationPath = path.join(
  recipeRoot,
  "validation/forest-location-recipe-001-preview-validation.json"
);
const previewReportPath = path.join(
  recipeRoot,
  "reports/forest-location-recipe-001-preview-report.md"
);

const previewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "forest-location-recipe-preview.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("forest location preview creates placement preview data from the generated plan", () => {
  const previewData = readJson(previewDataPath);

  assert.equal(previewData.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(previewData.previewMode, "non_runtime_2d_layout_reference");
  assert.equal(previewData.totalPlacements, 27);
  assert.equal(previewData.previewPlacements.length, 27);
  assert.equal(previewData.previewBounds.minX < previewData.previewBounds.maxX, true);
  assert.equal(previewData.previewBounds.minY < previewData.previewBounds.maxY, true);
});

test("forest location preview creates dependency visualization, zone summary, and visual renderer data", () => {
  const visualization = readJson(dependencyVisualizationPath);
  const zoneSummary = readJson(zoneSummaryPath);
  const visualRendererData = readJson(visualRendererDataPath);

  assert.equal(visualization.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(visualization.nodes.length, 6);
  assert.equal(visualization.edges.length >= 6, true);
  assert.equal(zoneSummary.length, 5);
  assert.equal(zoneSummary.every((zone) => zone.placementCount > 0), true);
  assert.equal(visualRendererData.marks.length, 27);
});

test("forest location preview creates density report and placement inspection output", () => {
  const densityReport = readJson(densityReportPath);
  const inspection = readJson(placementInspectionPath);
  const deep = densityReport.find((entry) => entry.zoneId === "DEEP_FOREST_MARGIN_ZONE");
  const edge = densityReport.find((entry) => entry.zoneId === "FOREST_EDGE_TRANSITION_ZONE");

  assert.equal(densityReport.length, 5);
  assert.equal(deep.densityProfile, "HIGH");
  assert.equal(deep.vegetationRatio >= edge.vegetationRatio, true);
  assert.equal(deep.structuralPlacementCount, 0);
  assert.equal(inspection.totalPlacements, 27);
  assert.equal(inspection.spacingStatus, "PASS");
});

test("forest location preview validation passes review and safety checks", () => {
  const validation = readJson(previewValidationPath);

  assert.equal(validation.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(validation.checks.every((check) => check.ok === true), true);
  assert.equal(validation.nextAllowedAction, "preview_review_only");
});

test("forest location preview report documents non-runtime review readiness", () => {
  const report = fs.readFileSync(previewReportPath, "utf8");

  assert.match(report, /Non-runtime preview package assembled/);
  assert.match(report, /trail flow: PASS/);
  assert.match(report, /vegetation density: PASS/);
  assert.match(report, /performance impact: PASS/);
  assert.match(
    report,
    /No Blender files, GLBs, asset modifications, or runtime activation were performed/i
  );
});

test("forest location preview builder remains deterministic for the same generated plan", () => {
  const first = previewModule.buildForestLocationRecipePreview({ cwd: repoRoot });
  const second = previewModule.buildForestLocationRecipePreview({ cwd: repoRoot });

  assert.equal(first.previewFingerprint, second.previewFingerprint);
  assert.deepEqual(first.zoneSummary, second.zoneSummary);
  assert.deepEqual(first.densityReport, second.densityReport);
});
