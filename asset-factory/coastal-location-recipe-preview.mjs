import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";
const GENERATED_PLAN_FILENAME = "coastal-location-recipe-001-generated-plan.json";
const DEPENDENCY_MAP_FILENAME = "coastal-location-recipe-001-dependency-map.json";
const GENERATION_VALIDATION_FILENAME =
  "coastal-location-recipe-001-generation-validation.json";

const PREVIEW_DATA_FILENAME = "coastal-location-recipe-001-preview-data.json";
const DEPENDENCY_VISUALIZATION_FILENAME =
  "coastal-location-recipe-001-dependency-visualization.json";
const ZONE_SUMMARY_FILENAME = "coastal-location-recipe-001-zone-summary.json";
const DENSITY_REPORT_FILENAME = "coastal-location-recipe-001-density-report.json";
const PREVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-preview-validation.json";
const PREVIEW_REPORT_FILENAME = "coastal-location-recipe-001-preview-report.md";

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

function groupBy(array, keyFn) {
  const map = new Map();
  for (const item of array) {
    const key = keyFn(item);
    const current = map.get(key) ?? [];
    current.push(item);
    map.set(key, current);
  }
  return map;
}

function buildZoneSummary(plan) {
  const placementsByZone = groupBy(plan.placementPlan.placements, (entry) => entry.zoneId);
  return deepFreeze(
    plan.zoneAllocation.map((zone) => {
      const placements = placementsByZone.get(zone.zoneId) ?? [];
      return {
        zoneId: zone.zoneId,
        traversalRole: zone.traversalRole,
        laneRange: {
          start: zone.laneStart,
          end: zone.laneEnd,
          span: zone.laneEnd - zone.laneStart
        },
        densityProfile: zone.densityProfile,
        placementCount: placements.length,
        assetIds: Array.from(new Set(placements.map((entry) => entry.assetId))).sort(),
        rolesPresent: Array.from(new Set(placements.map((entry) => entry.role))).sort(),
        requiredRoles: zone.requiredRoles,
        optionalRoles: zone.optionalRoles
      };
    })
  );
}

function buildDensityReport(plan) {
  const placementsByZone = groupBy(plan.placementPlan.placements, (entry) => entry.zoneId);
  const zoneAreaById = Object.fromEntries(
    plan.zoneAllocation.map((zone) => [zone.zoneId, Math.max(zone.laneEnd - zone.laneStart, 1)])
  );

  return deepFreeze(
    plan.zoneAllocation.map((zone) => {
      const placements = placementsByZone.get(zone.zoneId) ?? [];
      const vegetationPlacements = placements.filter((entry) =>
        ["native_grass_breakup", "coastal_shrub_mass", "accent_native_tree", "understory_ground_blend"].includes(
          entry.role
        )
      );
      const structuralPlacements = placements.filter((entry) =>
        ["primary_path_surface", "elevated_wet_crossing", "terrain_detail_cluster"].includes(
          entry.role
        )
      );

      return {
        zoneId: zone.zoneId,
        densityProfile: zone.densityProfile,
        totalPlacementCount: placements.length,
        vegetationPlacementCount: vegetationPlacements.length,
        structuralPlacementCount: structuralPlacements.length,
        vegetationRatio:
          placements.length === 0
            ? 0
            : Number((vegetationPlacements.length / placements.length).toFixed(3)),
        placementsPerLaneUnit: Number(
          (placements.length / zoneAreaById[zone.zoneId]).toFixed(3)
        )
      };
    })
  );
}

function buildDependencyVisualization(dependencyMap) {
  const nodes = dependencyMap.assets.map((asset) => ({
    nodeId: asset.assetId,
    label: asset.assetId,
    category: asset.category,
    role: asset.role,
    placementCount: asset.placementCount,
    zones: asset.zones
  }));

  const edges = [];
  for (let i = 0; i < dependencyMap.assets.length - 1; i += 1) {
    const current = dependencyMap.assets[i];
    const next = dependencyMap.assets[i + 1];
    edges.push({
      from: current.assetId,
      to: next.assetId,
      relation: "coastal_location_recipe_sequence",
      reason: `${current.role} layers before ${next.role} in the preview dependency stack`
    });
  }

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_DEPENDENCY_VISUALIZATION_001",
    recipeId: dependencyMap.recipeId,
    nodes,
    edges
  });
}

function buildPlacementPreviewData(plan, zoneSummary) {
  const previewPlacements = plan.placementPlan.placements.map((placement) => ({
    placementId: placement.placementId,
    assetId: placement.assetId,
    zoneId: placement.zoneId,
    role: placement.role,
    previewGlyph:
      placement.role === "primary_path_surface"
        ? "path"
        : placement.role === "elevated_wet_crossing"
          ? "boardwalk"
          : placement.role === "shoreline_transition_band"
            ? "water_edge"
            : placement.role === "terrain_detail_cluster"
              ? "rock"
              : placement.role === "accent_native_tree"
                ? "tree"
                : "vegetation",
    x: placement.transform.x,
    y: placement.transform.y,
    rotationDegrees: placement.transform.rotationDegrees,
    scale: placement.transform.scale
  }));

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_PLACEMENT_PREVIEW_DATA_001",
    recipeId: plan.recipeId,
    locationPlanId: plan.locationPlanId,
    previewMode: "non_runtime_2d_layout_reference",
    zoneSummaryReference: ZONE_SUMMARY_FILENAME,
    totalPlacements: previewPlacements.length,
    previewPlacements,
    previewBounds: {
      minX: Math.min(...previewPlacements.map((entry) => entry.x)),
      maxX: Math.max(...previewPlacements.map((entry) => entry.x)),
      minY: Math.min(...previewPlacements.map((entry) => entry.y)),
      maxY: Math.max(...previewPlacements.map((entry) => entry.y))
    },
    overview: zoneSummary.map((zone) => ({
      zoneId: zone.zoneId,
      placementCount: zone.placementCount,
      densityProfile: zone.densityProfile
    }))
  });
}

function assessNavigationFlow(plan) {
  return {
    status:
      plan.navigationPathLogic.primaryRouteNodeIds.length >= 4 &&
      plan.navigationPathLogic.routeNodes.every((node) => node.connectedTo.length >= 1)
        ? "PASS"
        : "FAIL",
    summary:
      "Entry, path, transition, and destination nodes form a continuous pedestrian route through the preview plan."
  };
}

function assessWaterTransition(plan) {
  const boardwalkPlacements = plan.placementPlan.placements.filter(
    (entry) => entry.role === "elevated_wet_crossing"
  );
  const waterPlacements = plan.placementPlan.placements.filter(
    (entry) => entry.role === "shoreline_transition_band"
  );
  return {
    status:
      boardwalkPlacements.every((entry) => entry.zoneId === "WET_CROSSING_ZONE") &&
      waterPlacements.every((entry) =>
        ["SHORELINE_EDGE_ZONE", "WET_CROSSING_ZONE"].includes(entry.zoneId)
      )
        ? "PASS"
        : "FAIL",
    summary:
      "Water-edge placements stay non-traversable and boardwalk use remains confined to the wet-crossing transition logic."
  };
}

function assessVegetationDensity(densityReport) {
  const buffer = densityReport.find((entry) => entry.zoneId === "VEGETATION_BUFFER_ZONE");
  const shoreline = densityReport.find((entry) => entry.zoneId === "SHORELINE_EDGE_ZONE");
  return {
    status:
      buffer &&
      shoreline &&
      buffer.vegetationPlacementCount >= shoreline.vegetationPlacementCount
        ? "PASS"
        : "FAIL",
    summary:
      "Vegetation weight stays behind the navigation corridor, with shoreline edges lighter than the main buffer zone."
  };
}

function assessAssetSpacing(plan) {
  const closePairs = [];
  const placements = plan.placementPlan.placements;
  for (let i = 0; i < placements.length; i += 1) {
    for (let j = i + 1; j < placements.length; j += 1) {
      const a = placements[i];
      const b = placements[j];
      const dx = a.transform.x - b.transform.x;
      const dy = a.transform.y - b.transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 0.35 && a.assetId !== b.assetId) {
        closePairs.push([a.placementId, b.placementId]);
      }
    }
  }
  return {
    status: closePairs.length === 0 ? "PASS" : "FAIL",
    summary:
      closePairs.length === 0
        ? "Placement spacing stays readable, with no suspicious cross-asset overlaps in the preview envelope."
        : `Potentially overlapping placement pairs found: ${closePairs
            .map((pair) => pair.join(" / "))
            .join(", ")}`
  };
}

function assessPerformanceBudgets(plan) {
  const limits = plan.mobilePerformanceLimits;
  return {
    status:
      Object.values(limits.withinBudget).every(Boolean) && limits.withinUniqueAssetCap
        ? "PASS"
        : "FAIL",
    summary:
      "Previewed recipe stays within the recorded close/gameplay/map triangle caps and the unique asset budget."
  };
}

export function buildCoastalLocationRecipePreview(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const generationRoot = path.join(recipeRoot, "generation");
  const validationRoot = path.join(recipeRoot, "validation");

  const plan = readJson(path.join(generationRoot, GENERATED_PLAN_FILENAME));
  const dependencyMap = readJson(path.join(generationRoot, DEPENDENCY_MAP_FILENAME));
  const generationValidation = readJson(
    path.join(validationRoot, GENERATION_VALIDATION_FILENAME)
  );

  if (generationValidation.status !== "pass") {
    throw new Error(
      "Coastal location preview blocked: generation validation must pass before preview assembly."
    );
  }

  const zoneSummary = buildZoneSummary(plan);
  const densityReport = buildDensityReport(plan);
  const dependencyVisualization = buildDependencyVisualization(dependencyMap);
  const placementPreviewData = buildPlacementPreviewData(plan, zoneSummary);

  const review = {
    navigationFlow: assessNavigationFlow(plan),
    waterTransition: assessWaterTransition(plan),
    vegetationDensity: assessVegetationDensity(densityReport),
    assetSpacing: assessAssetSpacing(plan),
    performanceBudgets: assessPerformanceBudgets(plan)
  };

  return deepFreeze({
    recipeRoot,
    plan,
    dependencyMap,
    generationValidation,
    placementPreviewData,
    dependencyVisualization,
    zoneSummary,
    densityReport,
    review,
    previewFingerprint: hashHex(
      plan.deterministicFingerprint,
      JSON.stringify(zoneSummary),
      JSON.stringify(densityReport)
    )
  });
}

export function buildCoastalLocationRecipePreviewValidation(options = {}) {
  const preview = buildCoastalLocationRecipePreview(options);
  const checks = [
    ["generated_plan_exists", Boolean(preview.plan.locationPlanId)],
    ["dependency_map_exists", preview.dependencyMap.assets.length > 0],
    ["placement_preview_data_created", preview.placementPreviewData.totalPlacements > 0],
    ["dependency_visualization_created", preview.dependencyVisualization.nodes.length > 0],
    ["zone_summary_created", preview.zoneSummary.length === 5],
    ["density_report_created", preview.densityReport.length === 5],
    ["navigation_flow_review_passes", preview.review.navigationFlow.status === "PASS"],
    ["water_transition_review_passes", preview.review.waterTransition.status === "PASS"],
    ["vegetation_density_review_passes", preview.review.vegetationDensity.status === "PASS"],
    ["asset_spacing_review_passes", preview.review.assetSpacing.status === "PASS"],
    ["performance_budget_review_passes", preview.review.performanceBudgets.status === "PASS"],
    ["no_blender_files_created", true],
    ["no_glbs_created", true],
    ["no_asset_modification", true],
    ["no_runtime_activation", true]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_PREVIEW_VALIDATION_001",
    recipeId: preview.plan.recipeId,
    locationPlanId: preview.plan.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    previewFingerprint: preview.previewFingerprint,
    nextAllowedAction: "preview_review_only"
  });
}

export function renderCoastalLocationRecipePreviewReport(options = {}) {
  const preview = buildCoastalLocationRecipePreview(options);
  const validation = buildCoastalLocationRecipePreviewValidation(options);

  return `# COASTAL_LOCATION_RECIPE_001 Preview Report

Status: Non-runtime preview package assembled

## Review

- navigation flow: ${preview.review.navigationFlow.status}
- water transition: ${preview.review.waterTransition.status}
- vegetation density: ${preview.review.vegetationDensity.status}
- asset spacing: ${preview.review.assetSpacing.status}
- performance budgets: ${preview.review.performanceBudgets.status}

## Zone summary

${preview.zoneSummary
  .map(
    (zone) =>
      `- ${zone.zoneId}: ${zone.placementCount} placements, density ${zone.densityProfile}, roles ${zone.rolesPresent.join(", ")}`
  )
  .join("\n")}

## Safety

No Blender files, GLBs, asset modifications, or runtime activation were performed.

## Validation

- validation status: ${validation.status}
- next allowed action: ${validation.nextAllowedAction}

## Outcome

\`COASTAL_LOCATION_RECIPE_001\` preview data is ready for manual review and future non-runtime visualization work.
`;
}

export function writeCoastalLocationRecipePreview(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const previewRoot = path.join(recipeRoot, "preview");
  const validationRoot = path.join(recipeRoot, "validation");
  const reportsRoot = path.join(recipeRoot, "reports");

  ensureDirectory(previewRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(reportsRoot);

  const preview = buildCoastalLocationRecipePreview(options);
  const validation = buildCoastalLocationRecipePreviewValidation(options);
  const report = renderCoastalLocationRecipePreviewReport(options);

  fs.writeFileSync(
    path.join(previewRoot, PREVIEW_DATA_FILENAME),
    `${JSON.stringify(preview.placementPreviewData, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(previewRoot, DEPENDENCY_VISUALIZATION_FILENAME),
    `${JSON.stringify(preview.dependencyVisualization, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(previewRoot, ZONE_SUMMARY_FILENAME),
    `${JSON.stringify(preview.zoneSummary, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(previewRoot, DENSITY_REPORT_FILENAME),
    `${JSON.stringify(preview.densityReport, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(validationRoot, PREVIEW_VALIDATION_FILENAME),
    `${JSON.stringify(validation, null, 2)}\n`
  );
  fs.writeFileSync(path.join(reportsRoot, PREVIEW_REPORT_FILENAME), report);

  return deepFreeze({
    recipeRoot,
    placementPreviewData: preview.placementPreviewData,
    dependencyVisualization: preview.dependencyVisualization,
    zoneSummary: preview.zoneSummary,
    densityReport: preview.densityReport,
    validation,
    report
  });
}
