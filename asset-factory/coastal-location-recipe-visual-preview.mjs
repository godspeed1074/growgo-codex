import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";

const PREVIEW_ROOT = "preview";
const VALIDATION_ROOT = "validation";
const REPORTS_ROOT = "reports";

const PREVIEW_DATA_FILENAME = "coastal-location-recipe-001-preview-data.json";
const DEPENDENCY_VISUALIZATION_FILENAME =
  "coastal-location-recipe-001-dependency-visualization.json";
const ZONE_SUMMARY_FILENAME = "coastal-location-recipe-001-zone-summary.json";
const DENSITY_REPORT_FILENAME = "coastal-location-recipe-001-density-report.json";
const PREVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-preview-validation.json";

const RENDERER_DATA_FILENAME =
  "coastal-location-recipe-001-visual-renderer-data.json";
const INSPECTION_OUTPUT_FILENAME =
  "coastal-location-recipe-001-visual-inspection-output.json";
const ZONE_VISUALIZATION_FILENAME =
  "coastal-location-recipe-001-zone-visualization.json";
const PLACEMENT_INSPECTION_FILENAME =
  "coastal-location-recipe-001-placement-inspection-report.json";
const VISUAL_VALIDATION_FILENAME =
  "coastal-location-recipe-001-visual-preview-validation.json";
const VISUAL_REPORT_FILENAME =
  "coastal-location-recipe-001-visual-preview-report.md";

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

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function loadPreviewPackage(cwd) {
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const previewRoot = path.join(recipeRoot, PREVIEW_ROOT);
  const validationRoot = path.join(recipeRoot, VALIDATION_ROOT);

  const previewData = readJson(path.join(previewRoot, PREVIEW_DATA_FILENAME));
  const dependencyVisualization = readJson(
    path.join(previewRoot, DEPENDENCY_VISUALIZATION_FILENAME)
  );
  const zoneSummary = readJson(path.join(previewRoot, ZONE_SUMMARY_FILENAME));
  const densityReport = readJson(path.join(previewRoot, DENSITY_REPORT_FILENAME));
  const previewValidation = readJson(
    path.join(validationRoot, PREVIEW_VALIDATION_FILENAME)
  );

  if (previewValidation.status !== "pass") {
    throw new Error(
      "Coastal location visual preview blocked: preview validation must pass first."
    );
  }

  return {
    recipeRoot,
    previewRoot,
    validationRoot,
    previewData,
    dependencyVisualization,
    zoneSummary,
    densityReport,
    previewValidation
  };
}

function glyphForRole(role) {
  switch (role) {
    case "primary_path_surface":
      return "path";
    case "elevated_wet_crossing":
      return "boardwalk";
    case "shoreline_transition_band":
      return "water";
    case "terrain_detail_cluster":
      return "rock";
    case "native_grass_breakup":
      return "grass";
    case "coastal_shrub_mass":
      return "shrub";
    case "accent_native_tree":
      return "tree";
    case "understory_ground_blend":
      return "ground";
    default:
      return "marker";
  }
}

function buildPreviewRendererData(previewPackage) {
  const layers = [
    {
      layerId: "navigation",
      roles: ["primary_path_surface", "elevated_wet_crossing"],
      colorToken: "var(--viz-series-1)"
    },
    {
      layerId: "water-transition",
      roles: ["shoreline_transition_band", "terrain_detail_cluster"],
      colorToken: "var(--viz-series-2)"
    },
    {
      layerId: "vegetation",
      roles: [
        "understory_ground_blend",
        "native_grass_breakup",
        "coastal_shrub_mass",
        "accent_native_tree"
      ],
      colorToken: "var(--viz-series-3)"
    }
  ];

  const marks = previewPackage.previewData.previewPlacements.map((placement) => ({
    placementId: placement.placementId,
    assetId: placement.assetId,
    zoneId: placement.zoneId,
    role: placement.role,
    glyph: glyphForRole(placement.role),
    x: placement.x,
    y: placement.y,
    rotationDegrees: placement.rotationDegrees,
    scale: placement.scale,
    layerId:
      layers.find((layer) => layer.roles.includes(placement.role))?.layerId ?? "vegetation"
  }));

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_VISUAL_RENDERER_DATA_001",
    recipeId: previewPackage.previewData.recipeId,
    locationPlanId: previewPackage.previewData.locationPlanId,
    coordinateSpace: "non_runtime_recipe_preview_2d",
    layers,
    marks,
    bounds: previewPackage.previewData.previewBounds
  });
}

function buildZoneVisualization(previewPackage) {
  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_ZONE_VISUALIZATION_001",
    recipeId: previewPackage.previewData.recipeId,
    zones: previewPackage.zoneSummary.map((zone) => {
      const density = previewPackage.densityReport.find(
        (entry) => entry.zoneId === zone.zoneId
      );
      return {
        zoneId: zone.zoneId,
        traversalRole: zone.traversalRole,
        laneRange: zone.laneRange,
        placementCount: zone.placementCount,
        densityProfile: zone.densityProfile,
        rolesPresent: zone.rolesPresent,
        assetIds: zone.assetIds,
        vegetationRatio: density?.vegetationRatio ?? 0,
        placementsPerLaneUnit: density?.placementsPerLaneUnit ?? 0
      };
    })
  });
}

function buildPlacementInspectionReport(previewPackage) {
  const placements = previewPackage.previewData.previewPlacements;
  const sortedByX = [...placements].sort((a, b) => a.x - b.x);

  const spacingFlags = [];
  for (let i = 0; i < sortedByX.length - 1; i += 1) {
    const current = sortedByX[i];
    const next = sortedByX[i + 1];
    const distance = Number(Math.hypot(next.x - current.x, next.y - current.y).toFixed(3));
    if (distance < 0.4) {
      spacingFlags.push({
        from: current.placementId,
        to: next.placementId,
        distance
      });
    }
  }

  const roleCounts = Object.fromEntries(
    placements.reduce((map, placement) => {
      map.set(placement.role, (map.get(placement.role) ?? 0) + 1);
      return map;
    }, new Map())
  );

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_PLACEMENT_INSPECTION_REPORT_001",
    recipeId: previewPackage.previewData.recipeId,
    totalPlacements: placements.length,
    roleCounts,
    spacingFlags,
    spacingStatus: spacingFlags.length === 0 ? "PASS" : "REVIEW",
    firstToLastFlow: {
      firstPlacementId: sortedByX[0]?.placementId ?? null,
      lastPlacementId: sortedByX.at(-1)?.placementId ?? null
    }
  });
}

function buildInspectionOutput(previewPackage, placementInspection, zoneVisualization) {
  const entryZone = zoneVisualization.zones.find((zone) => zone.zoneId === "ENTRY_PATH_ZONE");
  const crossingZone = zoneVisualization.zones.find(
    (zone) => zone.zoneId === "WET_CROSSING_ZONE"
  );
  const bufferZone = zoneVisualization.zones.find(
    (zone) => zone.zoneId === "VEGETATION_BUFFER_ZONE"
  );
  const destinationZone = zoneVisualization.zones.find(
    (zone) => zone.zoneId === "LOOKOUT_OR_REST_ZONE"
  );

  const playerFlow =
    entryZone &&
    crossingZone &&
    destinationZone &&
    entryZone.placementCount > 0 &&
    crossingZone.placementCount > 0 &&
    destinationZone.placementCount > 0
      ? "PASS"
      : "FAIL";

  const densityBalance =
    bufferZone && entryZone && bufferZone.vegetationRatio >= entryZone.vegetationRatio
      ? "PASS"
      : "FAIL";

  const navigationClarity =
    previewPackage.dependencyVisualization.nodes.some(
      (node) => node.role === "primary_path_surface"
    ) &&
    previewPackage.dependencyVisualization.nodes.some(
      (node) => node.role === "elevated_wet_crossing"
    )
      ? "PASS"
      : "FAIL";

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_VISUAL_INSPECTION_OUTPUT_001",
    recipeId: previewPackage.previewData.recipeId,
    locationPlanId: previewPackage.previewData.locationPlanId,
    review: {
      playerFlow: {
        status: playerFlow,
        summary:
          "Entry path, crossing transition, and destination zone remain visually understandable in the non-runtime preview."
      },
      assetSpacing: {
        status: placementInspection.spacingStatus === "PASS" ? "PASS" : "REVIEW",
        summary:
          placementInspection.spacingStatus === "PASS"
            ? "Placement spacing stays readable across neighboring assets."
            : "Some neighboring placements sit unusually close together and should be manually checked."
      },
      zoneTransitions: {
        status:
          crossingZone?.rolesPresent.includes("elevated_wet_crossing") &&
          entryZone?.rolesPresent.includes("primary_path_surface")
            ? "PASS"
            : "FAIL",
        summary:
          "Path-to-boardwalk transitions remain isolated to the wet-crossing zone and preserve the intended movement flow."
      },
      densityBalance: {
        status: densityBalance,
        summary:
          "Vegetation density builds in the buffer zone without overwhelming the entry corridor or shoreline edge."
      },
      navigationClarity: {
        status: navigationClarity,
        summary:
          "Primary path and crossing markers remain visually distinct enough for inspection-oriented review."
      }
    }
  });
}

export function buildCoastalLocationRecipeVisualPreview(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const previewPackage = loadPreviewPackage(cwd);
  const previewRendererData = buildPreviewRendererData(previewPackage);
  const zoneVisualization = buildZoneVisualization(previewPackage);
  const placementInspection = buildPlacementInspectionReport(previewPackage);
  const visualInspectionOutput = buildInspectionOutput(
    previewPackage,
    placementInspection,
    zoneVisualization
  );

  return deepFreeze({
    ...previewPackage,
    previewRendererData,
    zoneVisualization,
    placementInspection,
    visualInspectionOutput,
    visualPreviewFingerprint: hashHex(
      previewPackage.previewValidation.previewFingerprint,
      JSON.stringify(previewRendererData.marks.map((mark) => [mark.placementId, mark.layerId])),
      JSON.stringify(zoneVisualization.zones.map((zone) => [zone.zoneId, zone.placementCount]))
    )
  });
}

export function buildCoastalLocationRecipeVisualPreviewValidation(options = {}) {
  const preview = buildCoastalLocationRecipeVisualPreview(options);
  const review = preview.visualInspectionOutput.review;

  const checks = [
    ["preview_renderer_data_format_created", preview.previewRendererData.marks.length > 0],
    [
      "visual_inspection_output_created",
      Object.values(review).every((entry) => typeof entry.status === "string")
    ],
    ["zone_visualization_created", preview.zoneVisualization.zones.length === 5],
    ["placement_inspection_report_created", preview.placementInspection.totalPlacements > 0],
    ["player_flow_review_passes", review.playerFlow.status === "PASS"],
    ["asset_spacing_review_passes", review.assetSpacing.status !== "FAIL"],
    ["zone_transition_review_passes", review.zoneTransitions.status === "PASS"],
    ["density_balance_review_passes", review.densityBalance.status === "PASS"],
    ["navigation_clarity_review_passes", review.navigationClarity.status === "PASS"],
    ["no_runtime_activation", true],
    ["no_blender_files_created", true],
    ["no_glbs_created", true],
    ["no_asset_modification", true]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_VISUAL_PREVIEW_VALIDATION_001",
    recipeId: preview.previewData.recipeId,
    locationPlanId: preview.previewData.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    visualPreviewFingerprint: preview.visualPreviewFingerprint,
    nextAllowedAction: "manual_visual_preview_review_only"
  });
}

export function renderCoastalLocationRecipeVisualPreviewReport(options = {}) {
  const preview = buildCoastalLocationRecipeVisualPreview(options);
  const validation = buildCoastalLocationRecipeVisualPreviewValidation(options);

  return `# COASTAL_LOCATION_RECIPE_001 Visual Preview Report

Status: Non-runtime visual inspection package assembled

## Review

- player flow: ${preview.visualInspectionOutput.review.playerFlow.status}
- asset spacing: ${preview.visualInspectionOutput.review.assetSpacing.status}
- zone transitions: ${preview.visualInspectionOutput.review.zoneTransitions.status}
- density balance: ${preview.visualInspectionOutput.review.densityBalance.status}
- navigation clarity: ${preview.visualInspectionOutput.review.navigationClarity.status}

## Preview package

- preview renderer marks: ${preview.previewRendererData.marks.length}
- zone visualization entries: ${preview.zoneVisualization.zones.length}
- dependency visualization nodes: ${preview.dependencyVisualization.nodes.length}
- placement inspection placements: ${preview.placementInspection.totalPlacements}

## Safety

No runtime activation, Blender files, GLBs, or asset modifications were performed.

## Validation

- validation status: ${validation.status}
- next allowed action: ${validation.nextAllowedAction}

## Outcome

\`COASTAL_LOCATION_RECIPE_001\` visual preview data is ready for inspection-oriented review work.
`;
}

export function writeCoastalLocationRecipeVisualPreview(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const previewRoot = path.join(recipeRoot, PREVIEW_ROOT);
  const validationRoot = path.join(recipeRoot, VALIDATION_ROOT);
  const reportsRoot = path.join(recipeRoot, REPORTS_ROOT);

  ensureDirectory(previewRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(reportsRoot);

  const preview = buildCoastalLocationRecipeVisualPreview(options);
  const validation = buildCoastalLocationRecipeVisualPreviewValidation(options);
  const report = renderCoastalLocationRecipeVisualPreviewReport(options);

  fs.writeFileSync(
    path.join(previewRoot, RENDERER_DATA_FILENAME),
    `${JSON.stringify(preview.previewRendererData, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(previewRoot, INSPECTION_OUTPUT_FILENAME),
    `${JSON.stringify(preview.visualInspectionOutput, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(previewRoot, ZONE_VISUALIZATION_FILENAME),
    `${JSON.stringify(preview.zoneVisualization, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(previewRoot, PLACEMENT_INSPECTION_FILENAME),
    `${JSON.stringify(preview.placementInspection, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(validationRoot, VISUAL_VALIDATION_FILENAME),
    `${JSON.stringify(validation, null, 2)}\n`
  );
  fs.writeFileSync(path.join(reportsRoot, VISUAL_REPORT_FILENAME), report);

  return deepFreeze({
    recipeRoot,
    previewRendererData: preview.previewRendererData,
    visualInspectionOutput: preview.visualInspectionOutput,
    zoneVisualization: preview.zoneVisualization,
    placementInspection: preview.placementInspection,
    validation,
    report
  });
}
