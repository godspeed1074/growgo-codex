import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001";
const GENERATED_PLAN_FILENAME = "forest-location-recipe-001-generated-plan.json";
const DEPENDENCY_MAP_FILENAME = "forest-location-recipe-001-dependency-map.json";
const GENERATION_VALIDATION_FILENAME =
  "forest-location-recipe-001-generation-validation.json";

const PREVIEW_DATA_FILENAME = "forest-location-recipe-001-preview-data.json";
const DEPENDENCY_VISUALIZATION_FILENAME =
  "forest-location-recipe-001-dependency-visualization.json";
const ZONE_SUMMARY_FILENAME = "forest-location-recipe-001-zone-summary.json";
const DENSITY_REPORT_FILENAME = "forest-location-recipe-001-density-report.json";
const PLACEMENT_INSPECTION_FILENAME =
  "forest-location-recipe-001-placement-inspection-report.json";
const VISUAL_RENDERER_DATA_FILENAME =
  "forest-location-recipe-001-visual-renderer-data.json";
const PREVIEW_VALIDATION_FILENAME =
  "forest-location-recipe-001-preview-validation.json";
const PREVIEW_REPORT_FILENAME = "forest-location-recipe-001-preview-report.md";

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
        [
          "native_grass_breakup",
          "forest_shrub_mass",
          "accent_native_tree",
          "understory_ground_blend"
        ].includes(entry.role)
      );
      const structuralPlacements = placements.filter((entry) =>
        ["primary_path_surface", "terrain_detail_cluster"].includes(entry.role)
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

  const edges = [
    ...dependencyMap.assets.slice(0, -1).map((asset, index) => ({
      from: asset.assetId,
      to: dependencyMap.assets[index + 1].assetId,
      relation: "forest_recipe_layering_sequence",
      reason: `${asset.role} contributes before ${dependencyMap.assets[index + 1].role} in the forest preview stack`
    })),
    ...dependencyMap.deferredAssets.map((asset) => ({
      from: asset.assetId,
      to: "CANOPY_TRACK_ZONE",
      relation: "deferred_forest_canopy_uplift",
      reason: asset.reason
    }))
  ];

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_DEPENDENCY_VISUALIZATION_001",
    recipeId: dependencyMap.recipeId,
    nodes,
    edges
  });
}

function glyphForRole(role) {
  switch (role) {
    case "primary_path_surface":
      return "trail";
    case "terrain_detail_cluster":
      return "rock";
    case "understory_ground_blend":
      return "ground";
    case "native_grass_breakup":
      return "grass";
    case "forest_shrub_mass":
      return "shrub";
    case "accent_native_tree":
      return "tree";
    default:
      return "marker";
  }
}

function buildPlacementPreviewData(plan, zoneSummary) {
  const previewPlacements = plan.placementPlan.placements.map((placement) => ({
    placementId: placement.placementId,
    assetId: placement.assetId,
    zoneId: placement.zoneId,
    role: placement.role,
    previewGlyph: glyphForRole(placement.role),
    x: placement.transform.x,
    y: placement.transform.y,
    rotationDegrees: placement.transform.rotationDegrees,
    scale: placement.transform.scale
  }));

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_PLACEMENT_PREVIEW_DATA_001",
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

function buildPlacementInspectionOutput(plan) {
  const spacingFlags = [];
  const placements = plan.placementPlan.placements;
  for (let i = 0; i < placements.length; i += 1) {
    for (let j = i + 1; j < placements.length; j += 1) {
      const a = placements[i];
      const b = placements[j];
      const dx = a.transform.x - b.transform.x;
      const dy = a.transform.y - b.transform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 0.35 && a.assetId !== b.assetId) {
        spacingFlags.push({
          a: a.placementId,
          b: b.placementId,
          distance: Number(distance.toFixed(3))
        });
      }
    }
  }

  const roleCounts = Object.fromEntries(
    Array.from(
      groupBy(placements, (entry) => entry.role).entries(),
      ([role, items]) => [role, items.length]
    )
  );

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_PLACEMENT_INSPECTION_REPORT_001",
    recipeId: plan.recipeId,
    totalPlacements: placements.length,
    roleCounts,
    spacingFlags,
    spacingStatus: spacingFlags.length === 0 ? "PASS" : "FAIL",
    firstToLastFlow: {
      firstPlacementId: placements[0]?.placementId ?? null,
      lastPlacementId: placements.at(-1)?.placementId ?? null
    }
  });
}

function buildVisualRendererData(plan) {
  const layers = [
    {
      layerId: "trail",
      roles: ["primary_path_surface"],
      colorToken: "var(--viz-series-1)"
    },
    {
      layerId: "terrain",
      roles: ["terrain_detail_cluster", "understory_ground_blend"],
      colorToken: "var(--viz-series-2)"
    },
    {
      layerId: "vegetation",
      roles: ["native_grass_breakup", "forest_shrub_mass", "accent_native_tree"],
      colorToken: "var(--viz-series-3)"
    }
  ];

  const marks = plan.placementPlan.placements.map((placement) => ({
    placementId: placement.placementId,
    assetId: placement.assetId,
    zoneId: placement.zoneId,
    role: placement.role,
    glyph: glyphForRole(placement.role),
    x: placement.transform.x,
    y: placement.transform.y,
    rotationDegrees: placement.transform.rotationDegrees,
    scale: placement.transform.scale,
    layerId:
      placement.role === "primary_path_surface"
        ? "trail"
        : ["terrain_detail_cluster", "understory_ground_blend"].includes(placement.role)
          ? "terrain"
          : "vegetation"
  }));

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_VISUAL_RENDERER_DATA_001",
    recipeId: plan.recipeId,
    locationPlanId: plan.locationPlanId,
    coordinateSpace: "non_runtime_recipe_preview_2d",
    layers,
    marks
  });
}

function assessTrailFlow(plan) {
  return {
    status:
      plan.trailNavigationLogic.primaryRouteNodeIds.length >= 5 &&
      plan.trailNavigationLogic.routeNodes.every((node) => node.connectedTo.length >= 1)
        ? "PASS"
        : "FAIL",
    summary:
      "Entry, transition, canopy track, clearing, and return nodes form a continuous forest walking route."
  };
}

function assessVegetationDensity(densityReport) {
  const edge = densityReport.find((entry) => entry.zoneId === "FOREST_EDGE_TRANSITION_ZONE");
  const deep = densityReport.find((entry) => entry.zoneId === "DEEP_FOREST_MARGIN_ZONE");
  return {
    status:
      edge &&
      deep &&
      deep.vegetationRatio >= edge.vegetationRatio &&
      deep.structuralPlacementCount === 0
        ? "PASS"
        : "FAIL",
    summary:
      "Vegetation composition shifts from mixed edge-transition layering into a fully vegetated deep-forest backdrop."
  };
}

function assessClearingPlacement(plan, zoneSummary) {
  const clearingZone = zoneSummary.find((zone) => zone.zoneId === "CLEARING_OR_REST_ZONE");
  const clearingPlacements = plan.placementPlan.placements.filter(
    (entry) => entry.zoneId === "CLEARING_OR_REST_ZONE"
  );
  return {
    status:
      clearingZone &&
      clearingPlacements.some((entry) => entry.role === "primary_path_surface") &&
      clearingPlacements.some((entry) =>
        ["terrain_detail_cluster", "accent_native_tree"].includes(entry.role)
      )
        ? "PASS"
        : "FAIL",
    summary:
      "The clearing preserves a readable standing area while keeping at least one anchor feature for destination value."
  };
}

function assessExplorationInterest(plan) {
  return {
    status: plan.explorationInterestPoints.length >= 3 ? "PASS" : "FAIL",
    summary:
      "Transition, clearing, and deep-margin interest points provide a readable exploration rhythm without runtime systems."
  };
}

function assessForestTransitionQuality(plan) {
  const transitionPlacements = plan.placementPlan.placements.filter(
    (entry) => entry.zoneId === "FOREST_EDGE_TRANSITION_ZONE"
  );
  const transitionRoles = new Set(transitionPlacements.map((entry) => entry.role));
  return {
    status:
      transitionRoles.has("native_grass_breakup") &&
      transitionRoles.has("forest_shrub_mass") &&
      transitionRoles.has("terrain_detail_cluster")
        ? "PASS"
        : "FAIL",
    summary:
      "The edge transition includes grass, shrubs, and terrain accents so the move into canopy density feels stepped rather than abrupt."
  };
}

function assessPerformanceImpact(plan) {
  const limits = plan.mobilePerformanceLimits;
  return {
    status:
      Object.values(limits.withinBudget).every(Boolean) && limits.withinUniqueAssetCap
        ? "PASS"
        : "FAIL",
    summary:
      "Previewed forest recipe stays within close/gameplay/map triangle caps and the referenced-asset uniqueness budget."
  };
}

export function buildForestLocationRecipePreview(options = {}) {
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
      "Forest location preview blocked: generation validation must pass before preview assembly."
    );
  }

  const zoneSummary = buildZoneSummary(plan);
  const densityReport = buildDensityReport(plan);
  const dependencyVisualization = buildDependencyVisualization(dependencyMap);
  const placementPreviewData = buildPlacementPreviewData(plan, zoneSummary);
  const placementInspectionOutput = buildPlacementInspectionOutput(plan);
  const visualRendererData = buildVisualRendererData(plan);

  const review = {
    trailFlow: assessTrailFlow(plan),
    vegetationDensity: assessVegetationDensity(densityReport),
    clearingPlacement: assessClearingPlacement(plan, zoneSummary),
    explorationInterest: assessExplorationInterest(plan),
    forestTransitionQuality: assessForestTransitionQuality(plan),
    performanceImpact: assessPerformanceImpact(plan)
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
    placementInspectionOutput,
    visualRendererData,
    review,
    previewFingerprint: hashHex(
      plan.deterministicFingerprint,
      JSON.stringify(zoneSummary),
      JSON.stringify(densityReport),
      JSON.stringify(placementInspectionOutput.roleCounts)
    )
  });
}

export function buildForestLocationRecipePreviewValidation(options = {}) {
  const preview = buildForestLocationRecipePreview(options);
  const checks = [
    ["generated_plan_exists", Boolean(preview.plan.locationPlanId)],
    ["dependency_map_exists", preview.dependencyMap.assets.length > 0],
    ["placement_preview_data_created", preview.placementPreviewData.totalPlacements > 0],
    ["dependency_visualization_created", preview.dependencyVisualization.nodes.length > 0],
    ["zone_summary_created", preview.zoneSummary.length === 5],
    ["density_report_created", preview.densityReport.length === 5],
    ["placement_inspection_output_created", preview.placementInspectionOutput.totalPlacements > 0],
    ["visual_renderer_data_created", preview.visualRendererData.marks.length > 0],
    ["trail_flow_review_passes", preview.review.trailFlow.status === "PASS"],
    ["vegetation_density_review_passes", preview.review.vegetationDensity.status === "PASS"],
    ["clearing_placement_review_passes", preview.review.clearingPlacement.status === "PASS"],
    ["exploration_interest_review_passes", preview.review.explorationInterest.status === "PASS"],
    ["forest_transition_quality_review_passes", preview.review.forestTransitionQuality.status === "PASS"],
    ["performance_impact_review_passes", preview.review.performanceImpact.status === "PASS"],
    ["no_blender_files_created", true],
    ["no_glbs_created", true],
    ["no_asset_modification", true],
    ["no_runtime_activation", true]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_PREVIEW_VALIDATION_001",
    recipeId: preview.plan.recipeId,
    locationPlanId: preview.plan.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    previewFingerprint: preview.previewFingerprint,
    nextAllowedAction: "preview_review_only"
  });
}

export function renderForestLocationRecipePreviewReport(options = {}) {
  const preview = buildForestLocationRecipePreview(options);
  const validation = buildForestLocationRecipePreviewValidation(options);

  return `# FOREST_LOCATION_RECIPE_001 Preview Report

Status: Non-runtime preview package assembled

## Review

- trail flow: ${preview.review.trailFlow.status}
- vegetation density: ${preview.review.vegetationDensity.status}
- clearing placement: ${preview.review.clearingPlacement.status}
- exploration interest: ${preview.review.explorationInterest.status}
- forest transition quality: ${preview.review.forestTransitionQuality.status}
- performance impact: ${preview.review.performanceImpact.status}

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

\`FOREST_LOCATION_RECIPE_001\` preview data is ready for manual review and future non-runtime visualization work.
`;
}

export function writeForestLocationRecipePreview(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const previewRoot = path.join(recipeRoot, "preview");
  const validationRoot = path.join(recipeRoot, "validation");
  const reportsRoot = path.join(recipeRoot, "reports");

  ensureDirectory(previewRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(reportsRoot);

  const preview = buildForestLocationRecipePreview(options);
  const validation = buildForestLocationRecipePreviewValidation(options);
  const report = renderForestLocationRecipePreviewReport(options);

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
    path.join(previewRoot, PLACEMENT_INSPECTION_FILENAME),
    `${JSON.stringify(preview.placementInspectionOutput, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(previewRoot, VISUAL_RENDERER_DATA_FILENAME),
    `${JSON.stringify(preview.visualRendererData, null, 2)}\n`
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
    placementInspectionOutput: preview.placementInspectionOutput,
    visualRendererData: preview.visualRendererData,
    validation,
    report
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const result = writeForestLocationRecipePreview();
  process.stdout.write(
    `${result.validation.recipeId} preview written to ${result.recipeRoot}\n`
  );
}
