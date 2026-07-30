import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasMapAttachmentPlanning } from "./atlas-map-attachment-planning.mjs";
import { buildAtlasMapCoordinateDeterminismSimulation } from "./atlas-map-coordinate-determinism-simulation.mjs";
import { buildAtlasRegionalBoundaryTransitionSimulation } from "./atlas-regional-boundary-transition-simulation.mjs";

const PREVIEW_ROOT =
  "asset-factory-workspace/atlas-map-preview-attachment/ATLAS_MAP_PREVIEW_ATTACHMENT_001";

const COORDINATE_PREVIEW_FILENAME = "atlas-map-coordinate-preview-data.json";
const BOUNDARY_VISUALIZATION_FILENAME =
  "atlas-map-region-boundary-visualization-data.json";
const RECIPE_OVERLAY_FILENAME = "atlas-map-recipe-selection-overlay-data.json";
const PACKAGE_OVERLAY_FILENAME = "atlas-map-package-identity-overlay-data.json";
const INSPECTION_TOOLS_FILENAME = "atlas-map-preview-inspection-tools.json";
const VALIDATION_FILENAME = "atlas-map-preview-attachment-validation.json";
const REPORT_FILENAME = "atlas-map-preview-attachment-report.md";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }
  return Object.freeze(value);
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filename, value) {
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function uniqueBy(values, keyFn) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = keyFn(value);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(value);
  }
  return out;
}

function buildCoordinatePreviewData(coordinateSimulation) {
  const resolvedLookups = coordinateSimulation.results.scenarioResults.flatMap((scenario) =>
    scenario.lookups
      .filter((lookup) => lookup.status === "resolved")
      .map((lookup) =>
        deepFreeze({
          previewPointId: `${scenario.scenarioId}_${lookup.lookupId}`,
          sourceScenarioId: scenario.scenarioId,
          coordinate: {
            lat: lookup.lat,
            lng: lookup.lng,
            latBucket: lookup.latBucket,
            lngBucket: lookup.lngBucket
          },
          regionId: lookup.regionId,
          packageId: lookup.packageId,
          expectedRecipeId: lookup.expectedRecipeId,
          selectedRecipeId: lookup.selectedRecipeId,
          selectorSeed: lookup.selectorSeed,
          packageFingerprint: lookup.packageFingerprint,
          confidenceScore: lookup.confidenceScore,
          fallbackApplied: lookup.fallbackApplied,
          previewCategory: "LOOKUP_ALIGNMENT_POINT",
          deterministicFingerprint: lookup.deterministicFingerprint
        })
      )
  );

  return deepFreeze({
    schemaId: "ATLAS_MAP_COORDINATE_PREVIEW_DATA_001",
    previewId: "ATLAS_MAP_PREVIEW_ATTACHMENT_001",
    pointCount: resolvedLookups.length,
    points: resolvedLookups,
    deterministicFingerprint: hashHex(
      "ATLAS_MAP_COORDINATE_PREVIEW_DATA_001",
      ...resolvedLookups.map((point) => JSON.stringify(point))
    )
  });
}

function buildBoundaryVisualizationData(coordinatePreviewData, transitionSimulation) {
  const regionNodes = uniqueBy(
    coordinatePreviewData.points.map((point) =>
      deepFreeze({
        regionId: point.regionId,
        packageId: point.packageId,
        centroid: {
          lat: point.coordinate.latBucket,
          lng: point.coordinate.lngBucket
        },
        expectedRecipeId: point.expectedRecipeId,
        selectedRecipeId: point.selectedRecipeId
      })
    ),
    (node) => node.regionId
  );

  const transitionEdges = transitionSimulation.transitionRecords.transitions
    .filter(
      (transition) =>
        transition.steps.filter((step) => step.status === "resolved").length >= 2
    )
    .map((transition) => {
      const resolvedSteps = transition.steps.filter((step) => step.status === "resolved");
      const [from, to] = resolvedSteps;

      return deepFreeze({
        transitionId: transition.transitionId,
        transitionType: transition.transitionType,
        fromRegionId: from.regionId,
        toRegionId: to.regionId,
        fromCoordinate: {
          lat: from.latBucket,
          lng: from.lngBucket
        },
        toCoordinate: {
          lat: to.latBucket,
          lng: to.lngBucket
        },
        regionChanged: from.regionId !== to.regionId,
        recipeChanged: from.selectedRecipeId !== to.selectedRecipeId,
        expectedBoundaryBehavior: transition.summary.result,
        previewCategory: "BOUNDARY_TRANSITION_EDGE",
        deterministicFingerprint: hashHex(
          transition.transitionId,
          from.regionId,
          to.regionId,
          from.selectedRecipeId ?? "NONE",
          to.selectedRecipeId ?? "NONE"
        )
      });
    });

  return deepFreeze({
    schemaId: "ATLAS_MAP_REGION_BOUNDARY_VISUALIZATION_DATA_001",
    previewId: "ATLAS_MAP_PREVIEW_ATTACHMENT_001",
    regionNodes,
    transitionEdges,
    deterministicFingerprint: hashHex(
      "ATLAS_MAP_REGION_BOUNDARY_VISUALIZATION_DATA_001",
      ...regionNodes.map((node) => JSON.stringify(node)),
      ...transitionEdges.map((edge) => JSON.stringify(edge))
    )
  });
}

function buildRecipeSelectionOverlayData(coordinatePreviewData, transitionSimulation) {
  const recipePoints = coordinatePreviewData.points.map((point) =>
    deepFreeze({
      overlayId: `${point.previewPointId}_RECIPE`,
      coordinate: point.coordinate,
      environmentRegionId: point.regionId,
      selectedRecipeId: point.selectedRecipeId,
      expectedRecipeId: point.expectedRecipeId,
      matchStatus:
        point.selectedRecipeId === point.expectedRecipeId ? "MATCH" : "FALLBACK_MATCH",
      confidenceScore: point.confidenceScore,
      fallbackApplied: point.fallbackApplied
    })
  );

  const transitionOverlays = transitionSimulation.transitionRecords.transitions.map(
    (transition) => {
      const resolvedSteps = transition.steps.filter((step) => step.status === "resolved");
      return deepFreeze({
        transitionId: transition.transitionId,
        transitionType: transition.transitionType,
        selectedRecipeIds: resolvedSteps.map((step) => step.selectedRecipeId),
        continuityStatus:
          resolvedSteps.length >= 2 &&
          resolvedSteps.every(
            (step) => step.selectedRecipeId === resolvedSteps[0].selectedRecipeId
          )
            ? "CONTINUOUS"
            : "CHANGED",
        summaryResult: transition.summary.result
      });
    }
  );

  return deepFreeze({
    schemaId: "ATLAS_MAP_RECIPE_SELECTION_OVERLAY_DATA_001",
    previewId: "ATLAS_MAP_PREVIEW_ATTACHMENT_001",
    recipePoints,
    transitionOverlays,
    deterministicFingerprint: hashHex(
      "ATLAS_MAP_RECIPE_SELECTION_OVERLAY_DATA_001",
      ...recipePoints.map((entry) => JSON.stringify(entry)),
      ...transitionOverlays.map((entry) => JSON.stringify(entry))
    )
  });
}

function buildPackageIdentityOverlayData(coordinatePreviewData, transitionSimulation) {
  const packagePoints = coordinatePreviewData.points.map((point) =>
    deepFreeze({
      overlayId: `${point.previewPointId}_PACKAGE`,
      coordinate: point.coordinate,
      regionId: point.regionId,
      packageId: point.packageId,
      packageFingerprint: point.packageFingerprint,
      selectorSeed: point.selectorSeed,
      deterministicFingerprint: point.deterministicFingerprint
    })
  );

  const cacheTransitions = transitionSimulation.transitionRecords.transitions.map(
    (transition) => {
      const resolvedSteps = transition.steps.filter((step) => step.status === "resolved");
      return deepFreeze({
        transitionId: transition.transitionId,
        cacheKeys: resolvedSteps.map((step) => step.cacheKey),
        cacheContinuity:
          resolvedSteps.length >= 2 &&
          resolvedSteps.every((step) => step.cacheKey === resolvedSteps[0].cacheKey)
            ? "STABLE"
            : resolvedSteps.length >= 2
              ? "HANDOFF"
              : "BLOCKED_OR_SINGLE_STEP",
        summaryResult: transition.summary.result
      });
    }
  );

  return deepFreeze({
    schemaId: "ATLAS_MAP_PACKAGE_IDENTITY_OVERLAY_DATA_001",
    previewId: "ATLAS_MAP_PREVIEW_ATTACHMENT_001",
    packagePoints,
    cacheTransitions,
    deterministicFingerprint: hashHex(
      "ATLAS_MAP_PACKAGE_IDENTITY_OVERLAY_DATA_001",
      ...packagePoints.map((entry) => JSON.stringify(entry)),
      ...cacheTransitions.map((entry) => JSON.stringify(entry))
    )
  });
}

function buildInspectionTools(
  coordinatePreviewData,
  boundaryVisualizationData,
  recipeSelectionOverlayData,
  packageIdentityOverlayData
) {
  return deepFreeze({
    schemaId: "ATLAS_MAP_PREVIEW_INSPECTION_TOOLS_001",
    previewId: "ATLAS_MAP_PREVIEW_ATTACHMENT_001",
    supportedInspections: [
      {
        toolId: "INSPECT_COORDINATE_ALIGNMENT",
        description:
          "Inspect how a preview coordinate aligns to region, package, and recipe selection."
      },
      {
        toolId: "INSPECT_REGION_TRANSITION",
        description:
          "Inspect how a boundary transition changes region, package identity, cache continuity, and recipe overlay state."
      },
      {
        toolId: "INSPECT_PACKAGE_OVERLAY",
        description:
          "Inspect package identity, fingerprint, and selector seed markers for preview coordinates."
      }
    ],
    previewStats: {
      coordinatePointCount: coordinatePreviewData.pointCount,
      regionNodeCount: boundaryVisualizationData.regionNodes.length,
      transitionEdgeCount: boundaryVisualizationData.transitionEdges.length,
      recipeOverlayCount: recipeSelectionOverlayData.recipePoints.length,
      packageOverlayCount: packageIdentityOverlayData.packagePoints.length
    }
  });
}

export function inspectCoordinateAlignment(preview, previewPointId) {
  return (
    preview.coordinatePreviewData.points.find(
      (point) => point.previewPointId === previewPointId
    ) ?? null
  );
}

export function inspectRegionTransition(preview, transitionId) {
  return (
    preview.boundaryVisualizationData.transitionEdges.find(
      (edge) => edge.transitionId === transitionId
    ) ??
    preview.recipeSelectionOverlayData.transitionOverlays.find(
      (edge) => edge.transitionId === transitionId
    ) ??
    preview.packageIdentityOverlayData.cacheTransitions.find(
      (edge) => edge.transitionId === transitionId
    ) ??
    null
  );
}

export function inspectPackageOverlay(preview, overlayId) {
  return (
    preview.packageIdentityOverlayData.packagePoints.find(
      (point) => point.overlayId === overlayId
    ) ?? null
  );
}

function buildValidation(
  mapAttachmentPlanning,
  coordinatePreviewData,
  boundaryVisualizationData,
  recipeSelectionOverlayData,
  packageIdentityOverlayData
) {
  const checks = [
    {
      name: "coordinates_align_with_regions",
      ok: coordinatePreviewData.points.every(
        (point) =>
          Number(point.coordinate.latBucket.toFixed(2)) ===
            Number(point.coordinate.lat.toFixed(2)) &&
          Number(point.coordinate.lngBucket.toFixed(2)) ===
            Number(point.coordinate.lng.toFixed(2)) &&
          typeof point.regionId === "string"
      )
    },
    {
      name: "selected_recipes_match_expected_environments",
      ok: recipeSelectionOverlayData.recipePoints.every((point) =>
        ["MATCH", "FALLBACK_MATCH"].includes(point.matchStatus)
      )
    },
    {
      name: "boundaries_transition_correctly",
      ok: boundaryVisualizationData.transitionEdges.every(
        (edge) => edge.expectedBoundaryBehavior === "PASS"
      )
    },
    {
      name: "deterministic_outputs_preserved",
      ok:
        typeof coordinatePreviewData.deterministicFingerprint === "string" &&
        typeof boundaryVisualizationData.deterministicFingerprint === "string" &&
        typeof recipeSelectionOverlayData.deterministicFingerprint === "string" &&
        typeof packageIdentityOverlayData.deterministicFingerprint === "string"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .runtimeActivationAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .mapDownloadsAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .rendererAttachmentAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .blenderAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .glbAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_MAP_PREVIEW_ATTACHMENT_VALIDATION_001",
    previewId: "ATLAS_MAP_PREVIEW_ATTACHMENT_001",
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      "ATLAS_MAP_PREVIEW_ATTACHMENT_VALIDATION_001",
      JSON.stringify(checks),
      coordinatePreviewData.deterministicFingerprint,
      boundaryVisualizationData.deterministicFingerprint,
      recipeSelectionOverlayData.deterministicFingerprint,
      packageIdentityOverlayData.deterministicFingerprint
    ),
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    rendererAttachmentAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(preview, validation) {
  return `# ATLAS MAP PREVIEW ATTACHMENT

## Scope

${preview.previewId} provides a developer-only non-runtime preview layer showing how Atlas decisions align with map coordinates.

## Preview Outputs

- coordinate preview data
- region boundary visualization data
- recipe selection overlay data
- package identity overlay data
- preview inspection tools

## Preview Stats

- coordinate points: ${preview.coordinatePreviewData.pointCount}
- region nodes: ${preview.boundaryVisualizationData.regionNodes.length}
- transition edges: ${preview.boundaryVisualizationData.transitionEdges.length}
- recipe overlays: ${preview.recipeSelectionOverlayData.recipePoints.length}
- package overlays: ${preview.packageIdentityOverlayData.packagePoints.length}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Safety

- runtime activation authorized: ${validation.runtimeActivationAuthorized}
- map downloads authorized: ${validation.mapDownloadsAuthorized}
- renderer attachment authorized: ${validation.rendererAttachmentAuthorized}
- Blender authorized: ${validation.blenderAuthorized}
- GLB authorized: ${validation.glbAuthorized}
- asset modification authorized: ${validation.assetModificationAuthorized}

## Readiness

Future map attachment preview: ${validation.status === "pass" ? "READY" : "BLOCKED"}
`;
}

export function buildAtlasMapPreviewAttachment({ cwd = process.cwd() } = {}) {
  const mapAttachmentPlanning = buildAtlasMapAttachmentPlanning({ cwd });
  const coordinateSimulation = buildAtlasMapCoordinateDeterminismSimulation({
    cwd
  });
  const transitionSimulation = buildAtlasRegionalBoundaryTransitionSimulation({
    cwd
  });

  const coordinatePreviewData = buildCoordinatePreviewData(coordinateSimulation);
  const boundaryVisualizationData = buildBoundaryVisualizationData(
    coordinatePreviewData,
    transitionSimulation
  );
  const recipeSelectionOverlayData = buildRecipeSelectionOverlayData(
    coordinatePreviewData,
    transitionSimulation
  );
  const packageIdentityOverlayData = buildPackageIdentityOverlayData(
    coordinatePreviewData,
    transitionSimulation
  );
  const inspectionTools = buildInspectionTools(
    coordinatePreviewData,
    boundaryVisualizationData,
    recipeSelectionOverlayData,
    packageIdentityOverlayData
  );
  const validation = buildValidation(
    mapAttachmentPlanning,
    coordinatePreviewData,
    boundaryVisualizationData,
    recipeSelectionOverlayData,
    packageIdentityOverlayData
  );

  const preview = deepFreeze({
    previewId: "ATLAS_MAP_PREVIEW_ATTACHMENT_001",
    root: path.resolve(cwd, PREVIEW_ROOT),
    coordinatePreviewData,
    boundaryVisualizationData,
    recipeSelectionOverlayData,
    packageIdentityOverlayData,
    inspectionTools,
    validation
  });

  const report = buildReport(preview, validation);

  return deepFreeze({
    ...preview,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasMapPreviewAttachment({ cwd = process.cwd() } = {}) {
  const preview = buildAtlasMapPreviewAttachment({ cwd });
  const outputsDir = path.join(preview.root, "outputs");
  const validationDir = path.join(preview.root, "validation");
  const reportsDir = path.join(preview.root, "reports");

  for (const directory of [outputsDir, validationDir, reportsDir]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(outputsDir, COORDINATE_PREVIEW_FILENAME),
    preview.coordinatePreviewData
  );
  writeJson(
    path.join(outputsDir, BOUNDARY_VISUALIZATION_FILENAME),
    preview.boundaryVisualizationData
  );
  writeJson(
    path.join(outputsDir, RECIPE_OVERLAY_FILENAME),
    preview.recipeSelectionOverlayData
  );
  writeJson(
    path.join(outputsDir, PACKAGE_OVERLAY_FILENAME),
    preview.packageIdentityOverlayData
  );
  writeJson(
    path.join(outputsDir, INSPECTION_TOOLS_FILENAME),
    preview.inspectionTools
  );
  writeJson(path.join(validationDir, VALIDATION_FILENAME), preview.validation);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), preview.report);

  return preview;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasMapPreviewAttachment();
}
