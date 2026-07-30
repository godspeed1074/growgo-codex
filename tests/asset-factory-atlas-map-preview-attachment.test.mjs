import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const previewRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-map-preview-attachment/ATLAS_MAP_PREVIEW_ATTACHMENT_001"
);

const coordinatePreviewPath = path.join(
  previewRoot,
  "outputs/atlas-map-coordinate-preview-data.json"
);
const boundaryVisualizationPath = path.join(
  previewRoot,
  "outputs/atlas-map-region-boundary-visualization-data.json"
);
const recipeOverlayPath = path.join(
  previewRoot,
  "outputs/atlas-map-recipe-selection-overlay-data.json"
);
const packageOverlayPath = path.join(
  previewRoot,
  "outputs/atlas-map-package-identity-overlay-data.json"
);
const inspectionToolsPath = path.join(
  previewRoot,
  "outputs/atlas-map-preview-inspection-tools.json"
);
const validationPath = path.join(
  previewRoot,
  "validation/atlas-map-preview-attachment-validation.json"
);
const reportPath = path.join(
  previewRoot,
  "reports/atlas-map-preview-attachment-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-map-preview-attachment.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas map preview attachment is deterministic", () => {
  const first = moduleUnderTest.buildAtlasMapPreviewAttachment({ cwd: repoRoot });
  const second = moduleUnderTest.buildAtlasMapPreviewAttachment({ cwd: repoRoot });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.coordinatePreviewData, second.coordinatePreviewData);
  assert.deepEqual(first.boundaryVisualizationData, second.boundaryVisualizationData);
  assert.deepEqual(first.recipeSelectionOverlayData, second.recipeSelectionOverlayData);
  assert.deepEqual(first.packageIdentityOverlayData, second.packageIdentityOverlayData);
  assert.deepEqual(first.inspectionTools, second.inspectionTools);
});

test("atlas map preview attachment aligns coordinates, regions, recipes, and boundaries", () => {
  const preview = moduleUnderTest.buildAtlasMapPreviewAttachment({ cwd: repoRoot });

  assert.equal(preview.coordinatePreviewData.pointCount > 0, true);
  assert.equal(
    preview.coordinatePreviewData.points.every(
      (point) =>
        point.selectedRecipeId &&
        point.regionId &&
        Number(point.coordinate.latBucket.toFixed(2)) ===
          Number(point.coordinate.lat.toFixed(2))
    ),
    true
  );
  assert.equal(
    preview.boundaryVisualizationData.transitionEdges.every(
      (edge) => edge.expectedBoundaryBehavior === "PASS"
    ),
    true
  );
  assert.equal(
    preview.recipeSelectionOverlayData.recipePoints.every((point) =>
      ["MATCH", "FALLBACK_MATCH"].includes(point.matchStatus)
    ),
    true
  );
});

test("atlas map preview attachment inspection tools expose preview records safely", () => {
  const preview = moduleUnderTest.buildAtlasMapPreviewAttachment({ cwd: repoRoot });
  const firstPoint = preview.coordinatePreviewData.points[0];
  const firstPackage = preview.packageIdentityOverlayData.packagePoints[0];
  const firstTransition = preview.boundaryVisualizationData.transitionEdges[0];

  assert.deepEqual(
    moduleUnderTest.inspectCoordinateAlignment(preview, firstPoint.previewPointId),
    firstPoint
  );
  assert.deepEqual(
    moduleUnderTest.inspectPackageOverlay(preview, firstPackage.overlayId),
    firstPackage
  );
  assert.equal(
    moduleUnderTest.inspectRegionTransition(preview, firstTransition.transitionId) !== null,
    true
  );
});

test("atlas map preview attachment writes records and preserves safety boundaries", () => {
  moduleUnderTest.writeAtlasMapPreviewAttachment({ cwd: repoRoot });

  const coordinatePreview = readJson(coordinatePreviewPath);
  const boundaryVisualization = readJson(boundaryVisualizationPath);
  const recipeOverlay = readJson(recipeOverlayPath);
  const packageOverlay = readJson(packageOverlayPath);
  const inspectionTools = readJson(inspectionToolsPath);
  const validation = readJson(validationPath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(coordinatePreview.pointCount > 0, true);
  assert.equal(boundaryVisualization.regionNodes.length > 0, true);
  assert.equal(recipeOverlay.recipePoints.length > 0, true);
  assert.equal(packageOverlay.packagePoints.length > 0, true);
  assert.equal(inspectionTools.supportedInspections.length, 3);
  assert.equal(validation.status, "pass");
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.mapDownloadsAuthorized, false);
  assert.equal(validation.rendererAttachmentAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.match(report, /Future map attachment preview: READY/);
});
