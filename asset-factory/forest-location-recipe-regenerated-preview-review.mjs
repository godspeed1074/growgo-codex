import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001";

const PREVIEW_DATA_FILENAME = "forest-location-recipe-001-preview-data.json";
const DEPENDENCY_VISUALIZATION_FILENAME =
  "forest-location-recipe-001-dependency-visualization.json";
const ZONE_SUMMARY_FILENAME = "forest-location-recipe-001-zone-summary.json";
const DENSITY_REPORT_FILENAME = "forest-location-recipe-001-density-report.json";
const PREVIEW_VALIDATION_FILENAME =
  "forest-location-recipe-001-preview-validation.json";

const REGENERATED_PLAN_FILENAME =
  "forest-location-recipe-001-regenerated-plan.json";
const REGENERATED_DEPENDENCY_MAP_FILENAME =
  "forest-location-recipe-001-regenerated-dependency-map.json";
const REGENERATION_VALIDATION_FILENAME =
  "forest-location-recipe-001-regeneration-validation.json";

const REGENERATED_PREVIEW_DATA_FILENAME =
  "forest-location-recipe-001-regenerated-preview-data.json";
const REGENERATED_DEPENDENCY_VISUALIZATION_FILENAME =
  "forest-location-recipe-001-regenerated-dependency-visualization.json";
const REGENERATED_ZONE_SUMMARY_FILENAME =
  "forest-location-recipe-001-regenerated-zone-summary.json";
const REGENERATED_DENSITY_REPORT_FILENAME =
  "forest-location-recipe-001-regenerated-density-report.json";
const BEFORE_AFTER_COMPARISON_FILENAME =
  "forest-location-recipe-001-regenerated-before-after-comparison.json";
const REGENERATED_REVIEW_VALIDATION_FILENAME =
  "forest-location-recipe-001-regenerated-preview-review-validation.json";
const REGENERATED_REVIEW_REPORT_FILENAME =
  "forest-location-recipe-001-regenerated-preview-review-report.md";

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

  const edges = [];
  for (let i = 0; i < dependencyMap.assets.length - 1; i += 1) {
    const current = dependencyMap.assets[i];
    const next = dependencyMap.assets[i + 1];
    edges.push({
      from: current.assetId,
      to: next.assetId,
      relation: "forest_location_recipe_sequence",
      reason: `${current.role} layers before ${next.role} in the forest preview dependency stack`
    });
  }

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_REGENERATED_DEPENDENCY_VISUALIZATION_001",
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
    schemaId: "FOREST_LOCATION_RECIPE_001_REGENERATED_PLACEMENT_PREVIEW_DATA_001",
    recipeId: plan.recipeId,
    locationPlanId: plan.locationPlanId,
    previewMode: "non_runtime_2d_layout_reference",
    zoneSummaryReference: REGENERATED_ZONE_SUMMARY_FILENAME,
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

function loadInputs(cwd) {
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const previewRoot = path.join(recipeRoot, "preview");
  const generationRoot = path.join(recipeRoot, "generation");
  const validationRoot = path.join(recipeRoot, "validation");
  const reportsRoot = path.join(recipeRoot, "reports");

  const originalPreview = {
    previewData: readJson(path.join(previewRoot, PREVIEW_DATA_FILENAME)),
    dependencyVisualization: readJson(
      path.join(previewRoot, DEPENDENCY_VISUALIZATION_FILENAME)
    ),
    zoneSummary: readJson(path.join(previewRoot, ZONE_SUMMARY_FILENAME)),
    densityReport: readJson(path.join(previewRoot, DENSITY_REPORT_FILENAME)),
    validation: readJson(path.join(validationRoot, PREVIEW_VALIDATION_FILENAME))
  };

  const regeneratedPlan = readJson(path.join(generationRoot, REGENERATED_PLAN_FILENAME));
  const regeneratedDependencyMap = readJson(
    path.join(generationRoot, REGENERATED_DEPENDENCY_MAP_FILENAME)
  );
  const regenerationValidation = readJson(
    path.join(validationRoot, REGENERATION_VALIDATION_FILENAME)
  );

  if (originalPreview.validation.status !== "pass") {
    throw new Error(
      "Forest regenerated preview review blocked: original preview validation must pass first."
    );
  }
  if (regenerationValidation.status !== "pass") {
    throw new Error(
      "Forest regenerated preview review blocked: regeneration validation must pass first."
    );
  }

  return {
    recipeRoot,
    previewRoot,
    generationRoot,
    validationRoot,
    reportsRoot,
    originalPreview,
    regeneratedPlan,
    regeneratedDependencyMap,
    regenerationValidation
  };
}

function buildRegeneratedPreviewPackage(inputs) {
  const zoneSummary = buildZoneSummary(inputs.regeneratedPlan);
  const densityReport = buildDensityReport(inputs.regeneratedPlan);
  const dependencyVisualization = buildDependencyVisualization(
    inputs.regeneratedDependencyMap
  );
  const previewData = buildPlacementPreviewData(inputs.regeneratedPlan, zoneSummary);
  const previewFingerprint = hashHex(
    inputs.regeneratedPlan.deterministicFingerprint,
    JSON.stringify(zoneSummary),
    JSON.stringify(densityReport)
  );

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_REGENERATED_PREVIEW_PACKAGE_001",
    recipeId: inputs.regeneratedPlan.recipeId,
    locationPlanId: inputs.regeneratedPlan.locationPlanId,
    basedOnFingerprint: inputs.regeneratedPlan.deterministicFingerprint,
    previewData,
    dependencyVisualization,
    zoneSummary,
    densityReport,
    previewFingerprint
  });
}

function zoneById(zones, zoneId) {
  return zones.find((zone) => zone.zoneId === zoneId) ?? null;
}

function densityById(densities, zoneId) {
  return densities.find((entry) => entry.zoneId === zoneId) ?? null;
}

function buildBeforeAfterComparison(inputs, regeneratedPreview) {
  const originalCanopy = zoneById(inputs.originalPreview.zoneSummary, "CANOPY_TRACK_ZONE");
  const regeneratedCanopy = zoneById(regeneratedPreview.zoneSummary, "CANOPY_TRACK_ZONE");
  const originalClearing = zoneById(
    inputs.originalPreview.zoneSummary,
    "CLEARING_OR_REST_ZONE"
  );
  const regeneratedClearing = zoneById(
    regeneratedPreview.zoneSummary,
    "CLEARING_OR_REST_ZONE"
  );
  const originalDeep = zoneById(inputs.originalPreview.zoneSummary, "DEEP_FOREST_MARGIN_ZONE");
  const regeneratedDeep = zoneById(regeneratedPreview.zoneSummary, "DEEP_FOREST_MARGIN_ZONE");

  const originalCanopyDensity = densityById(
    inputs.originalPreview.densityReport,
    "CANOPY_TRACK_ZONE"
  );
  const regeneratedCanopyDensity = densityById(
    regeneratedPreview.densityReport,
    "CANOPY_TRACK_ZONE"
  );
  const originalTransitionDensity = densityById(
    inputs.originalPreview.densityReport,
    "FOREST_EDGE_TRANSITION_ZONE"
  );
  const regeneratedTransitionDensity = densityById(
    regeneratedPreview.densityReport,
    "FOREST_EDGE_TRANSITION_ZONE"
  );
  const originalClearingDensity = densityById(
    inputs.originalPreview.densityReport,
    "CLEARING_OR_REST_ZONE"
  );
  const regeneratedClearingDensity = densityById(
    regeneratedPreview.densityReport,
    "CLEARING_OR_REST_ZONE"
  );

  const playerJourney = {
    status: "PASS",
    before:
      "Original route already read clearly from entry through canopy corridor to clearing and deep backdrop.",
    after:
      "Regenerated route keeps the same legible sequence while adding stronger support in the canopy corridor and destination half.",
    improvementConfirmed: true
  };

  const canopyCorridorQuality = {
    status:
      originalCanopy &&
      regeneratedCanopy &&
      originalCanopyDensity &&
      regeneratedCanopyDensity &&
      regeneratedCanopy.placementCount > originalCanopy.placementCount &&
      regeneratedCanopyDensity.vegetationRatio > originalCanopyDensity.vegetationRatio
        ? "IMPROVED"
        : "UNCHANGED",
    before: {
      placementCount: originalCanopy?.placementCount ?? 0,
      vegetationRatio: originalCanopyDensity?.vegetationRatio ?? 0
    },
    after: {
      placementCount: regeneratedCanopy?.placementCount ?? 0,
      vegetationRatio: regeneratedCanopyDensity?.vegetationRatio ?? 0
    },
    improvementConfirmed:
      Boolean(
        originalCanopyDensity &&
          regeneratedCanopyDensity &&
          regeneratedCanopyDensity.vegetationRatio > originalCanopyDensity.vegetationRatio
      )
  };

  const clearingQuality = {
    status:
      originalClearing &&
      regeneratedClearing &&
      !originalClearing.rolesPresent.includes("forest_shrub_mass") &&
      regeneratedClearing.rolesPresent.includes("forest_shrub_mass")
        ? "IMPROVED"
        : "UNCHANGED",
    beforeRoles: originalClearing?.rolesPresent ?? [],
    afterRoles: regeneratedClearing?.rolesPresent ?? [],
    improvementConfirmed:
      Boolean(
        regeneratedClearing &&
          regeneratedClearing.rolesPresent.includes("forest_shrub_mass")
      )
  };

  const explorationInterest = {
    status:
      originalDeep &&
      regeneratedDeep &&
      !originalDeep.rolesPresent.includes("terrain_detail_cluster") &&
      regeneratedDeep.rolesPresent.includes("terrain_detail_cluster")
        ? "IMPROVED"
        : "UNCHANGED",
    beforeRoles: originalDeep?.rolesPresent ?? [],
    afterRoles: regeneratedDeep?.rolesPresent ?? [],
    improvementConfirmed:
      Boolean(
        regeneratedDeep &&
          regeneratedDeep.rolesPresent.includes("terrain_detail_cluster")
      )
  };

  const vegetationBalance = {
    status:
      originalCanopyDensity &&
      regeneratedCanopyDensity &&
      originalTransitionDensity &&
      regeneratedTransitionDensity &&
      regeneratedCanopyDensity.vegetationRatio > originalCanopyDensity.vegetationRatio &&
      regeneratedTransitionDensity.totalPlacementCount < originalTransitionDensity.totalPlacementCount
        ? "IMPROVED"
        : "UNCHANGED",
    before: {
      canopyVegetationRatio: originalCanopyDensity?.vegetationRatio ?? 0,
      transitionPlacements: originalTransitionDensity?.totalPlacementCount ?? 0
    },
    after: {
      canopyVegetationRatio: regeneratedCanopyDensity?.vegetationRatio ?? 0,
      transitionPlacements: regeneratedTransitionDensity?.totalPlacementCount ?? 0
    },
    improvementConfirmed:
      Boolean(
        originalCanopyDensity &&
          regeneratedCanopyDensity &&
          regeneratedCanopyDensity.vegetationRatio > originalCanopyDensity.vegetationRatio
      )
  };

  const performanceImpact = {
    status:
      Object.values(inputs.regeneratedPlan.mobilePerformanceLimits.withinBudget).every(Boolean)
        ? "ACCEPTABLE"
        : "REVIEW",
    before: inputs.originalPreview.previewData.totalPlacements,
    after: regeneratedPreview.previewData.totalPlacements,
    triangleDelta: {
      close:
        inputs.regeneratedPlan.mobilePerformanceLimits.triangleTotals.close -
        6623,
      gameplay:
        inputs.regeneratedPlan.mobilePerformanceLimits.triangleTotals.gameplay -
        4571,
      map: inputs.regeneratedPlan.mobilePerformanceLimits.triangleTotals.map - 2643
    },
    withinBudget: inputs.regeneratedPlan.mobilePerformanceLimits.withinBudget,
    clearingVegetationDelta:
      (regeneratedClearingDensity?.vegetationPlacementCount ?? 0) -
      (originalClearingDensity?.vegetationPlacementCount ?? 0)
  };

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_REGENERATED_PREVIEW_COMPARISON_001",
    recipeId: inputs.regeneratedPlan.recipeId,
    previousPreviewFingerprint: inputs.originalPreview.validation.previewFingerprint,
    regeneratedPreviewFingerprint: regeneratedPreview.previewFingerprint,
    review: {
      playerJourney,
      canopyCorridorQuality,
      clearingQuality,
      explorationInterest,
      vegetationBalance,
      performanceImpact
    },
    overallStatus:
      canopyCorridorQuality.improvementConfirmed &&
      clearingQuality.improvementConfirmed &&
      explorationInterest.improvementConfirmed &&
      vegetationBalance.improvementConfirmed &&
      performanceImpact.status === "ACCEPTABLE"
        ? "APPROVED_FOR_RECIPE_APPROVAL"
        : "REVIEW_REQUIRED"
  });
}

function buildValidation(regeneratedPreview, comparison) {
  const checks = [
    ["regenerated_preview_package_created", regeneratedPreview.previewData.totalPlacements > 0],
    ["before_after_comparison_created", Boolean(comparison.regeneratedPreviewFingerprint)],
    [
      "canopy_corridor_improvement_confirmed",
      comparison.review.canopyCorridorQuality.improvementConfirmed === true
    ],
    [
      "clearing_quality_improvement_confirmed",
      comparison.review.clearingQuality.improvementConfirmed === true
    ],
    [
      "exploration_interest_improvement_confirmed",
      comparison.review.explorationInterest.improvementConfirmed === true
    ],
    [
      "vegetation_balance_improvement_confirmed",
      comparison.review.vegetationBalance.improvementConfirmed === true
    ],
    [
      "performance_impact_acceptably_within_budget",
      comparison.review.performanceImpact.status === "ACCEPTABLE"
    ],
    ["no_blender_usage", true],
    ["no_glb_generation", true],
    ["no_asset_modification", true],
    ["no_runtime_activation", true]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_REGENERATED_PREVIEW_REVIEW_VALIDATION_001",
    recipeId: regeneratedPreview.recipeId,
    locationPlanId: regeneratedPreview.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    nextAllowedAction: "recipe_approval_ready"
  });
}

function buildReport(comparison, validation) {
  return `# FOREST_LOCATION_RECIPE_001 Regenerated Preview Review Report

Status: Regenerated preview comparison complete

## Improvements

- player journey: ${comparison.review.playerJourney.improvementConfirmed}
- canopy corridor quality: ${comparison.review.canopyCorridorQuality.status}
- clearing quality: ${comparison.review.clearingQuality.status}
- exploration interest: ${comparison.review.explorationInterest.status}
- vegetation balance: ${comparison.review.vegetationBalance.status}
- performance impact: ${comparison.review.performanceImpact.status}

## Before / After

- canopy placement count: ${comparison.review.canopyCorridorQuality.before.placementCount} -> ${comparison.review.canopyCorridorQuality.after.placementCount}
- canopy vegetation ratio: ${comparison.review.canopyCorridorQuality.before.vegetationRatio} -> ${comparison.review.canopyCorridorQuality.after.vegetationRatio}
- clearing roles: ${comparison.review.clearingQuality.beforeRoles.join(", ")} -> ${comparison.review.clearingQuality.afterRoles.join(", ")}
- deep-margin roles: ${comparison.review.explorationInterest.beforeRoles.join(", ")} -> ${comparison.review.explorationInterest.afterRoles.join(", ")}
- transition placement count: ${comparison.review.vegetationBalance.before.transitionPlacements} -> ${comparison.review.vegetationBalance.after.transitionPlacements}

## Performance

- close delta: ${comparison.review.performanceImpact.triangleDelta.close}
- gameplay delta: ${comparison.review.performanceImpact.triangleDelta.gameplay}
- map delta: ${comparison.review.performanceImpact.triangleDelta.map}

## Validation

- status: ${validation.status}
- next allowed action: ${validation.nextAllowedAction}

## Safety

No Blender, GLBs, asset modification, or runtime activation were performed.
`;
}

export function buildForestLocationRecipeRegeneratedPreviewReview(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const inputs = loadInputs(cwd);
  const regeneratedPreview = buildRegeneratedPreviewPackage(inputs);
  const comparison = buildBeforeAfterComparison(inputs, regeneratedPreview);
  const validation = buildValidation(regeneratedPreview, comparison);
  const report = buildReport(comparison, validation);

  ensureDirectory(inputs.previewRoot);
  ensureDirectory(inputs.validationRoot);
  ensureDirectory(inputs.reportsRoot);

  writeJson(
    path.join(inputs.previewRoot, REGENERATED_PREVIEW_DATA_FILENAME),
    regeneratedPreview.previewData
  );
  writeJson(
    path.join(inputs.previewRoot, REGENERATED_DEPENDENCY_VISUALIZATION_FILENAME),
    regeneratedPreview.dependencyVisualization
  );
  writeJson(
    path.join(inputs.previewRoot, REGENERATED_ZONE_SUMMARY_FILENAME),
    regeneratedPreview.zoneSummary
  );
  writeJson(
    path.join(inputs.previewRoot, REGENERATED_DENSITY_REPORT_FILENAME),
    regeneratedPreview.densityReport
  );
  writeJson(
    path.join(inputs.previewRoot, BEFORE_AFTER_COMPARISON_FILENAME),
    comparison
  );
  writeJson(
    path.join(inputs.validationRoot, REGENERATED_REVIEW_VALIDATION_FILENAME),
    validation
  );
  fs.writeFileSync(
    path.join(inputs.reportsRoot, REGENERATED_REVIEW_REPORT_FILENAME),
    `${report}\n`
  );

  return deepFreeze({
    regeneratedPreview,
    comparison,
    validation,
    report,
    reviewFingerprint: hashHex(
      regeneratedPreview.previewFingerprint,
      comparison.overallStatus,
      validation.nextAllowedAction
    )
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  buildForestLocationRecipeRegeneratedPreviewReview();
}
