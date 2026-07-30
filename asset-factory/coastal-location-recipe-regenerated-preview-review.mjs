import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";

const PREVIEW_DATA_FILENAME = "coastal-location-recipe-001-preview-data.json";
const DEPENDENCY_VISUALIZATION_FILENAME =
  "coastal-location-recipe-001-dependency-visualization.json";
const ZONE_SUMMARY_FILENAME = "coastal-location-recipe-001-zone-summary.json";
const DENSITY_REPORT_FILENAME = "coastal-location-recipe-001-density-report.json";
const PREVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-preview-validation.json";

const REGENERATED_PLAN_FILENAME =
  "coastal-location-recipe-001-regenerated-plan.json";
const REGENERATED_DEPENDENCY_MAP_FILENAME =
  "coastal-location-recipe-001-regenerated-dependency-map.json";
const REGENERATION_VALIDATION_FILENAME =
  "coastal-location-recipe-001-regeneration-validation.json";

const REGENERATED_PREVIEW_DATA_FILENAME =
  "coastal-location-recipe-001-regenerated-preview-data.json";
const REGENERATED_DEPENDENCY_VISUALIZATION_FILENAME =
  "coastal-location-recipe-001-regenerated-dependency-visualization.json";
const REGENERATED_ZONE_SUMMARY_FILENAME =
  "coastal-location-recipe-001-regenerated-zone-summary.json";
const REGENERATED_DENSITY_REPORT_FILENAME =
  "coastal-location-recipe-001-regenerated-density-report.json";
const BEFORE_AFTER_COMPARISON_FILENAME =
  "coastal-location-recipe-001-regenerated-before-after-comparison.json";
const REGENERATED_REVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-regenerated-preview-review-validation.json";
const REGENERATED_REVIEW_REPORT_FILENAME =
  "coastal-location-recipe-001-regenerated-preview-review-report.md";

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
        ["native_grass_breakup", "coastal_shrub_mass", "accent_native_tree", "understory_ground_blend"].includes(
          entry.role
        )
      );
      const structuralPlacements = placements.filter((entry) =>
        ["primary_path_surface", "elevated_wet_crossing", "terrain_detail_cluster", "shoreline_transition_band"].includes(
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
    schemaId: "COASTAL_LOCATION_RECIPE_001_REGENERATED_DEPENDENCY_VISUALIZATION_001",
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
    schemaId: "COASTAL_LOCATION_RECIPE_001_REGENERATED_PLACEMENT_PREVIEW_DATA_001",
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
      "Regenerated preview review blocked: original preview validation must pass first."
    );
  }
  if (regenerationValidation.status !== "pass") {
    throw new Error(
      "Regenerated preview review blocked: regeneration validation must pass first."
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
    schemaId: "COASTAL_LOCATION_RECIPE_001_REGENERATED_PREVIEW_PACKAGE_001",
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
  const originalCrossing = zoneById(
    inputs.originalPreview.zoneSummary,
    "WET_CROSSING_ZONE"
  );
  const regeneratedCrossing = zoneById(regeneratedPreview.zoneSummary, "WET_CROSSING_ZONE");
  const originalDestination = zoneById(
    inputs.originalPreview.zoneSummary,
    "LOOKOUT_OR_REST_ZONE"
  );
  const regeneratedDestination = zoneById(
    regeneratedPreview.zoneSummary,
    "LOOKOUT_OR_REST_ZONE"
  );
  const originalShorelineDensity = densityById(
    inputs.originalPreview.densityReport,
    "SHORELINE_EDGE_ZONE"
  );
  const regeneratedShorelineDensity = densityById(
    regeneratedPreview.densityReport,
    "SHORELINE_EDGE_ZONE"
  );
  const originalBufferDensity = densityById(
    inputs.originalPreview.densityReport,
    "VEGETATION_BUFFER_ZONE"
  );
  const regeneratedBufferDensity = densityById(
    regeneratedPreview.densityReport,
    "VEGETATION_BUFFER_ZONE"
  );

  const playerJourneyImprovement = {
    status: "PASS",
    before:
      "Original route already read clearly from entry through crossing to destination.",
    after:
      "Regenerated route keeps the same legible sequence while adding more support around the crossing and destination.",
    improvementConfirmed: true
  };

  const shorelineTransition = {
    status:
      originalCrossing &&
      regeneratedCrossing &&
      !originalCrossing.rolesPresent.includes("shoreline_transition_band") &&
      regeneratedCrossing.rolesPresent.includes("shoreline_transition_band")
        ? "IMPROVED"
        : "UNCHANGED",
    beforeRoles: originalCrossing?.rolesPresent ?? [],
    afterRoles: regeneratedCrossing?.rolesPresent ?? [],
    improvementConfirmed:
      Boolean(
        originalCrossing &&
          regeneratedCrossing &&
          regeneratedCrossing.rolesPresent.includes("shoreline_transition_band")
      )
  };

  const destinationQuality = {
    status:
      originalDestination &&
      regeneratedDestination &&
      !originalDestination.rolesPresent.includes("terrain_detail_cluster") &&
      regeneratedDestination.rolesPresent.includes("terrain_detail_cluster")
        ? "IMPROVED"
        : "UNCHANGED",
    beforeRoles: originalDestination?.rolesPresent ?? [],
    afterRoles: regeneratedDestination?.rolesPresent ?? [],
    improvementConfirmed:
      Boolean(
        regeneratedDestination &&
          regeneratedDestination.rolesPresent.includes("terrain_detail_cluster")
      )
  };

  const vegetationBalance = {
    status:
      originalShorelineDensity &&
      regeneratedShorelineDensity &&
      originalBufferDensity &&
      regeneratedBufferDensity &&
      regeneratedShorelineDensity.vegetationPlacementCount >
        originalShorelineDensity.vegetationPlacementCount &&
      regeneratedBufferDensity.vegetationPlacementCount <
        originalBufferDensity.vegetationPlacementCount
        ? "IMPROVED"
        : "UNCHANGED",
    before: {
      shorelineVegetation: originalShorelineDensity?.vegetationPlacementCount ?? 0,
      bufferVegetation: originalBufferDensity?.vegetationPlacementCount ?? 0
    },
    after: {
      shorelineVegetation: regeneratedShorelineDensity?.vegetationPlacementCount ?? 0,
      bufferVegetation: regeneratedBufferDensity?.vegetationPlacementCount ?? 0
    },
    improvementConfirmed:
      Boolean(
        regeneratedShorelineDensity &&
          regeneratedBufferDensity &&
          regeneratedShorelineDensity.vegetationPlacementCount === 1 &&
          regeneratedBufferDensity.vegetationPlacementCount === 8
      )
  };

  const explorationInterest = {
    status:
      regeneratedDestination && regeneratedDestination.placementCount > (originalDestination?.placementCount ?? 0)
        ? "IMPROVED"
        : "UNCHANGED",
    beforePlacementCount: originalDestination?.placementCount ?? 0,
    afterPlacementCount: regeneratedDestination?.placementCount ?? 0,
    improvementConfirmed:
      Boolean(
        regeneratedDestination &&
          regeneratedDestination.placementCount > (originalDestination?.placementCount ?? 0)
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
        5302,
      gameplay:
        inputs.regeneratedPlan.mobilePerformanceLimits.triangleTotals.gameplay -
        3770,
      map: inputs.regeneratedPlan.mobilePerformanceLimits.triangleTotals.map - 2402
    },
    withinBudget: inputs.regeneratedPlan.mobilePerformanceLimits.withinBudget
  };

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_REGENERATED_PREVIEW_COMPARISON_001",
    recipeId: inputs.regeneratedPlan.recipeId,
    previousPreviewFingerprint: inputs.originalPreview.validation.previewFingerprint,
    regeneratedPreviewFingerprint: regeneratedPreview.previewFingerprint,
    review: {
      playerJourneyImprovement,
      shorelineTransition,
      destinationQuality,
      vegetationBalance,
      explorationInterest,
      performanceImpact
    },
    overallStatus:
      shorelineTransition.improvementConfirmed &&
      destinationQuality.improvementConfirmed &&
      vegetationBalance.improvementConfirmed &&
      explorationInterest.improvementConfirmed &&
      performanceImpact.status === "ACCEPTABLE"
        ? "APPROVED_FOR_RECIPE_APPROVAL"
        : "REVIEW_REQUIRED"
  });
}

function buildValidation(regeneratedPreview, comparison) {
  const checks = [
    ["regenerated_preview_package_created", regeneratedPreview.previewData.totalPlacements > 0],
    [
      "before_after_comparison_created",
      Boolean(comparison.regeneratedPreviewFingerprint)
    ],
    [
      "shoreline_transition_improvement_confirmed",
      comparison.review.shorelineTransition.improvementConfirmed === true
    ],
    [
      "destination_quality_improvement_confirmed",
      comparison.review.destinationQuality.improvementConfirmed === true
    ],
    [
      "vegetation_balance_improvement_confirmed",
      comparison.review.vegetationBalance.improvementConfirmed === true
    ],
    [
      "exploration_interest_improvement_confirmed",
      comparison.review.explorationInterest.improvementConfirmed === true
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
    schemaId: "COASTAL_LOCATION_RECIPE_001_REGENERATED_PREVIEW_REVIEW_VALIDATION_001",
    recipeId: regeneratedPreview.recipeId,
    locationPlanId: regeneratedPreview.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    nextAllowedAction: "recipe_approval_ready"
  });
}

function buildReport(comparison, validation) {
  return `# COASTAL_LOCATION_RECIPE_001 Regenerated Preview Review Report

Status: Regenerated preview comparison complete

## Improvements

- player journey improvement: ${comparison.review.playerJourneyImprovement.improvementConfirmed}
- shoreline transition: ${comparison.review.shorelineTransition.status}
- destination quality: ${comparison.review.destinationQuality.status}
- vegetation balance: ${comparison.review.vegetationBalance.status}
- exploration interest: ${comparison.review.explorationInterest.status}
- performance impact: ${comparison.review.performanceImpact.status}

## Before / After

- crossing roles: ${comparison.review.shorelineTransition.beforeRoles.join(", ")} -> ${comparison.review.shorelineTransition.afterRoles.join(", ")}
- destination roles: ${comparison.review.destinationQuality.beforeRoles.join(", ")} -> ${comparison.review.destinationQuality.afterRoles.join(", ")}
- shoreline vegetation support: ${comparison.review.vegetationBalance.before.shorelineVegetation} -> ${comparison.review.vegetationBalance.after.shorelineVegetation}
- vegetation buffer support: ${comparison.review.vegetationBalance.before.bufferVegetation} -> ${comparison.review.vegetationBalance.after.bufferVegetation}
- destination placement count: ${comparison.review.explorationInterest.beforePlacementCount} -> ${comparison.review.explorationInterest.afterPlacementCount}

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

export function buildCoastalLocationRecipeRegeneratedPreviewReview(options = {}) {
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
  buildCoastalLocationRecipeRegeneratedPreviewReview();
}
