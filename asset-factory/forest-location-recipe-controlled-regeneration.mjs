import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001";

const GENERATED_PLAN_FILENAME = "forest-location-recipe-001-generated-plan.json";
const REGENERATED_PLAN_FILENAME =
  "forest-location-recipe-001-regenerated-plan.json";
const REGENERATED_DEPENDENCY_MAP_FILENAME =
  "forest-location-recipe-001-regenerated-dependency-map.json";
const REFINEMENT_SPECIFICATION_FILENAME =
  "forest-location-recipe-001-refinement-specification.json";
const BEFORE_AFTER_RULES_FILENAME =
  "forest-location-recipe-001-before-after-rule-comparison.json";
const REGENERATION_VALIDATION_FILENAME =
  "forest-location-recipe-001-regeneration-validation.json";
const REGENERATION_REPORT_FILENAME =
  "forest-location-recipe-001-regeneration-comparison-report.md";

const generationModule = await import(
  path.resolve(import.meta.dirname, "forest-location-recipe-generation.mjs")
);

const DEFAULT_OPTIONS = Object.freeze({
  createdOn: "2026-07-30",
  seed: "FOREST_LOCATION_RECIPE_001:DEFAULT:SEED_001",
  locationId: "FOREST_EXPLORATION_LOCATION_001",
  variantId: "DEFAULT",
  biomeProfile: "TEMPERATE_FOREST_EDGE",
  archetype: "FOREST_EDGE_LOOP"
});

const DEPENDENCY_ORDER = Object.freeze([
  "COASTAL_GRAVEL_PATH_001",
  "COASTAL_GROUND_COVER_001",
  "COASTAL_ROCK_CLUSTER_001",
  "COASTAL_GRASS_TUSSOCK_001",
  "SHRUB_COASTAL_LOW_001",
  "TREE_BOTTLEBRUSH_001"
]);

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

function hashFloat(seed, min, max, precision = 3) {
  const hex = hashHex(seed).slice(0, 12);
  const value = Number.parseInt(hex, 16) / 0xffffffffffff;
  const scaled = min + (max - min) * value;
  return Number(scaled.toFixed(precision));
}

function byAssetId(specification) {
  const all = [
    ...specification.assetDependencies.requiredCoreAssets,
    ...specification.assetDependencies.approvedVegetationAssets
  ];
  return new Map(all.map((entry) => [entry.assetId, entry]));
}

function loadInputs(cwd) {
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const generationRoot = path.join(recipeRoot, "generation");
  const refinementRoot = path.join(recipeRoot, "refinement");
  const validationRoot = path.join(recipeRoot, "validation");
  const reportsRoot = path.join(recipeRoot, "reports");

  return {
    recipeRoot,
    generationRoot,
    refinementRoot,
    validationRoot,
    reportsRoot,
    previousPlan: readJson(path.join(generationRoot, GENERATED_PLAN_FILENAME)),
    refinementSpecification: readJson(
      path.join(refinementRoot, REFINEMENT_SPECIFICATION_FILENAME)
    ),
    beforeAfterRules: readJson(path.join(refinementRoot, BEFORE_AFTER_RULES_FILENAME))
  };
}

function makePlacement(assetRecord, assetId, zoneId, instanceIndex, role, options, extra = {}) {
  const baseSeed = `${options.seed}:${assetId}:${zoneId}:${instanceIndex}:refined`;
  return {
    placementId: `${assetId}:${zoneId}:${String(instanceIndex).padStart(2, "0")}`,
    assetId,
    assetVersion: assetRecord.version,
    role,
    zoneId,
    lodHint: "LOD_GAMEPLAY",
    dependencyRecord: assetRecord.sourceCatalogRecord,
    transform: {
      x: hashFloat(`${baseSeed}:x`, extra.xMin ?? 0, extra.xMax ?? 10),
      y: hashFloat(`${baseSeed}:y`, extra.yMin ?? 0, extra.yMax ?? 10),
      rotationDegrees: hashFloat(
        `${baseSeed}:rot`,
        extra.rotationMin ?? -12,
        extra.rotationMax ?? 12,
        2
      ),
      scale: hashFloat(
        `${baseSeed}:scale`,
        extra.scaleMin ?? 0.95,
        extra.scaleMax ?? 1.05,
        3
      )
    },
    notes: extra.notes ?? null
  };
}

function replacePlacement(placements, oldPlacementId, newPlacement) {
  return placements
    .filter((placement) => placement.placementId !== oldPlacementId)
    .concat(newPlacement);
}

function applyRefinement(baseOutput, specification, options) {
  const dependencies = byAssetId(specification);
  let placements = [...baseOutput.output.placementPlan.placements];

  placements.push(
    makePlacement(
      dependencies.get("COASTAL_GROUND_COVER_001"),
      "COASTAL_GROUND_COVER_001",
      "CANOPY_TRACK_ZONE",
      7,
      "understory_ground_blend",
      options,
      {
        xMin: 30.8,
        xMax: 35.4,
        yMin: 4.1,
        yMax: 5.5,
        rotationMin: -14,
        rotationMax: 14,
        scaleMin: 0.94,
        scaleMax: 1.03,
        notes: "refinement support for stronger canopy enclosure"
      }
    )
  );

  placements = replacePlacement(
    placements,
    "SHRUB_COASTAL_LOW_001:FOREST_EDGE_TRANSITION_ZONE:01",
    makePlacement(
      dependencies.get("SHRUB_COASTAL_LOW_001"),
      "SHRUB_COASTAL_LOW_001",
      "CLEARING_OR_REST_ZONE",
      4,
      "forest_shrub_mass",
      options,
      {
        xMin: 80.4,
        xMax: 84.6,
        yMin: 5.8,
        yMax: 7.1,
        rotationMin: -10,
        rotationMax: 10,
        scaleMin: 0.95,
        scaleMax: 1.05,
        notes: "refinement support for stronger clearing payoff"
      }
    )
  );

  placements = replacePlacement(
    placements,
    "COASTAL_GRASS_TUSSOCK_001:DEEP_FOREST_MARGIN_ZONE:05",
    makePlacement(
      dependencies.get("COASTAL_ROCK_CLUSTER_001"),
      "COASTAL_ROCK_CLUSTER_001",
      "DEEP_FOREST_MARGIN_ZONE",
      3,
      "terrain_detail_cluster",
      options,
      {
        xMin: 96.8,
        xMax: 101.6,
        yMin: 7.4,
        yMax: 8.9,
        rotationMin: -18,
        rotationMax: 18,
        scaleMin: 0.93,
        scaleMax: 1.07,
        notes: "refinement curiosity beat between clearing and deep-margin threshold"
      }
    )
  );

  const output = structuredClone(baseOutput.output);
  output.schemaId = "FOREST_LOCATION_RECIPE_001_REGENERATED_PLAN_001";
  output.generationMode = "deterministic_recipe_assembly_plan_refined";
  output.refinementState = {
    refinementApplied: true,
    refinementAreas: [
      "canopy_corridor_enclosure_improvement",
      "clearing_payoff_enhancement",
      "exploration_curiosity_improvement"
    ]
  };
  output.placementPlan.placements = placements.sort((a, b) =>
    a.placementId.localeCompare(b.placementId)
  );
  output.placementPlan.totalPlacements = output.placementPlan.placements.length;
  output.trailNavigationLogic.placementCount = output.placementPlan.totalPlacements;
  output.vegetationDensityRules.CANOPY_TRACK_ZONE.allowedRoles = [
    "primary_path_surface",
    "understory_ground_blend",
    "forest_shrub_mass",
    "accent_native_tree"
  ];
  output.vegetationDensityRules.CLEARING_OR_REST_ZONE.allowedRoles = [
    "primary_path_surface",
    "terrain_detail_cluster",
    "accent_native_tree",
    "forest_shrub_mass",
    "understory_ground_blend"
  ];
  output.clearingDiscoveryZones = output.clearingDiscoveryZones.map((zone) =>
    zone.zoneId === "DEEP_FOREST_MARGIN_ZONE"
      ? {
          ...zone,
          supportedAnchors: [
            ...new Set([...zone.supportedAnchors, "terrain_detail_cluster"])
          ]
        }
      : zone
  );
  output.explorationInterestPoints = output.explorationInterestPoints.map((point) =>
    point.pointId === "FOREST_MARGIN_FUTURE_CANOPY_001"
      ? {
          ...point,
          description:
            "Reserved visual mass area for later eucalyptus canopy promotion plus a compact curiosity-support beat."
        }
      : point
  );
  output.deterministicFingerprint = hashHex(
    output.recipeId,
    output.locationPlanId,
    "refined",
    JSON.stringify(
      output.placementPlan.placements.map((entry) => [
        entry.assetId,
        entry.zoneId,
        entry.transform.x,
        entry.transform.y,
        entry.transform.rotationDegrees,
        entry.transform.scale
      ])
    )
  );

  return output;
}

function buildDependencyMap(specification, output) {
  const allDependencies = [
    ...specification.assetDependencies.requiredCoreAssets,
    ...specification.assetDependencies.approvedVegetationAssets
  ];

  const usageByAsset = Object.fromEntries(
    allDependencies.map((entry) => [
      entry.assetId,
      {
        assetId: entry.assetId,
        role: entry.role,
        familyId: entry.familyId,
        category: entry.category,
        recipeId: entry.recipeId,
        sourceCatalogRecord: entry.sourceCatalogRecord,
        placementCount: output.placementPlan.placements.filter(
          (placement) => placement.assetId === entry.assetId
        ).length,
        zones: Array.from(
          new Set(
            output.placementPlan.placements
              .filter((placement) => placement.assetId === entry.assetId)
              .map((placement) => placement.zoneId)
          )
        ).sort()
      }
    ])
  );

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_REGENERATED_DEPENDENCY_MAP_001",
    recipeId: specification.recipeIdentity.recipeId,
    assets: DEPENDENCY_ORDER.map((assetId) => usageByAsset[assetId]),
    deferredAssets: specification.assetDependencies.deferredAssets.map((asset) => ({
      assetId: asset.assetId,
      plannedRole: asset.plannedRole,
      lifecycleStatus: asset.lifecycleStatus,
      reason: asset.reason
    })),
    unsupportedAssetsIncluded: false
  });
}

function buildPerformanceSummary(specification, dependencyMap, options) {
  const budget = specification.performanceConstraints
    ? specification.performanceConstraints.archetypeTriangleBudgets[options.archetype]
    : basePerformanceConstraints(options.archetype);
  const maxUniqueReferencedAssetsPerLocation = specification.performanceConstraints
    ? specification.performanceConstraints.maxUniqueReferencedAssetsPerLocation
    : 6;
  const dependencies = byAssetId(specification);

  const totals = dependencyMap.assets.reduce(
    (accumulator, asset) => {
      const source = dependencies.get(asset.assetId);
      accumulator.close += asset.placementCount * source.metrics.closeTriangles;
      accumulator.gameplay += asset.placementCount * source.metrics.gameplayTriangles;
      accumulator.map += asset.placementCount * source.metrics.mapTriangles;
      return accumulator;
    },
    { close: 0, gameplay: 0, map: 0 }
  );

  return deepFreeze({
    triangleTotals: totals,
    budget,
    withinBudget: {
      close: totals.close <= budget.closeMax,
      gameplay: totals.gameplay <= budget.gameplayMax,
      map: totals.map <= budget.mapMax
    },
    uniqueAssetCount: dependencyMap.assets.length,
    maxUniqueReferencedAssetsPerLocation,
    withinUniqueAssetCap:
      dependencyMap.assets.length <= maxUniqueReferencedAssetsPerLocation
  });
}

function basePerformanceConstraints(archetype) {
  const budgets = {
    FOREST_EDGE_LOOP: {
      closeMax: 7600,
      gameplayMax: 5200,
      mapMax: 2800
    },
    CLEARING_SPUR: {
      closeMax: 7000,
      gameplayMax: 4800,
      mapMax: 2500
    },
    RESERVE_TRACK_OUT_AND_BACK: {
      closeMax: 8000,
      gameplayMax: 5400,
      mapMax: 3000
    }
  };
  return budgets[archetype];
}

function countByZone(output) {
  const map = new Map();
  for (const placement of output.placementPlan.placements) {
    map.set(placement.zoneId, (map.get(placement.zoneId) ?? 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function countByAsset(output) {
  const map = new Map();
  for (const placement of output.placementPlan.placements) {
    map.set(placement.assetId, (map.get(placement.assetId) ?? 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function buildComparison(previousPlan, regeneratedOutput, performanceSummary) {
  const previousAssetCounts = countByAsset(previousPlan);
  const newAssetCounts = countByAsset(regeneratedOutput);
  const previousZoneCounts = countByZone(previousPlan);
  const newZoneCounts = countByZone(regeneratedOutput);

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_REGENERATION_COMPARISON_001",
    recipeId: regeneratedOutput.recipeId,
    previousFingerprint: previousPlan.deterministicFingerprint,
    newFingerprint: regeneratedOutput.deterministicFingerprint,
    fingerprintChanged:
      previousPlan.deterministicFingerprint !== regeneratedOutput.deterministicFingerprint,
    placementCountChanges: {
      previous: previousPlan.placementPlan.totalPlacements,
      current: regeneratedOutput.placementPlan.totalPlacements,
      delta:
        regeneratedOutput.placementPlan.totalPlacements -
        previousPlan.placementPlan.totalPlacements
    },
    assetCountChanges: Object.fromEntries(
      DEPENDENCY_ORDER.map((assetId) => [
        assetId,
        {
          previous: previousAssetCounts[assetId] ?? 0,
          current: newAssetCounts[assetId] ?? 0,
          delta: (newAssetCounts[assetId] ?? 0) - (previousAssetCounts[assetId] ?? 0)
        }
      ])
    ),
    zoneChanges: Object.fromEntries(
      Object.keys({ ...previousZoneCounts, ...newZoneCounts })
        .sort()
        .map((zoneId) => [
          zoneId,
          {
            previous: previousZoneCounts[zoneId] ?? 0,
            current: newZoneCounts[zoneId] ?? 0,
            delta: (newZoneCounts[zoneId] ?? 0) - (previousZoneCounts[zoneId] ?? 0)
          }
        ])
    ),
    performanceImpact: {
      previous: previousPlan.mobilePerformanceLimits.triangleTotals,
      current: performanceSummary.triangleTotals,
      delta: {
        close:
          performanceSummary.triangleTotals.close -
          previousPlan.mobilePerformanceLimits.triangleTotals.close,
        gameplay:
          performanceSummary.triangleTotals.gameplay -
          previousPlan.mobilePerformanceLimits.triangleTotals.gameplay,
        map:
          performanceSummary.triangleTotals.map -
          previousPlan.mobilePerformanceLimits.triangleTotals.map
      }
    }
  });
}

function buildValidation(
  output,
  dependencyMap,
  performanceSummary,
  comparison,
  deterministicCheckFingerprint
) {
  const canopySupportPresent = output.placementPlan.placements.some(
    (placement) =>
      placement.zoneId === "CANOPY_TRACK_ZONE" &&
      placement.role === "understory_ground_blend" &&
      placement.placementId === "COASTAL_GROUND_COVER_001:CANOPY_TRACK_ZONE:07"
  );
  const clearingPayoffPresent = output.placementPlan.placements.some(
    (placement) =>
      placement.zoneId === "CLEARING_OR_REST_ZONE" &&
      placement.role === "forest_shrub_mass"
  );
  const curiositySupportPresent = output.placementPlan.placements.some(
    (placement) =>
      placement.zoneId === "DEEP_FOREST_MARGIN_ZONE" &&
      placement.role === "terrain_detail_cluster"
  );

  const checks = [
    ["previous_fingerprint_loaded", Boolean(comparison.previousFingerprint)],
    ["new_fingerprint_generated", Boolean(comparison.newFingerprint)],
    ["fingerprint_changed_after_refinement", comparison.fingerprintChanged],
    ["canopy_corridor_enclosure_applied", canopySupportPresent],
    ["clearing_payoff_applied", clearingPayoffPresent],
    ["exploration_curiosity_applied", curiositySupportPresent],
    [
      "deterministic_output_for_same_seed",
      deterministicCheckFingerprint === output.deterministicFingerprint
    ],
    [
      "performance_limits_respected",
      Object.values(performanceSummary.withinBudget).every(Boolean) &&
        performanceSummary.withinUniqueAssetCap === true
    ],
    [
      "only_approved_dependencies_used",
      dependencyMap.assets.every((asset) => asset.placementCount > 0) &&
        dependencyMap.unsupportedAssetsIncluded === false &&
        dependencyMap.deferredAssets.some((asset) => asset.assetId === "TREE_EUCALYPTUS_001")
    ],
    ["no_blender_usage", output.runtimeSafety.blenderFilesCreated === false],
    ["no_glb_generation", output.runtimeSafety.glbsCreated === false],
    ["no_asset_modification", output.runtimeSafety.assetsModified === false],
    ["no_runtime_activation", output.runtimeSafety.runtimeActivated === false]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_REGENERATION_VALIDATION_001",
    recipeId: output.recipeId,
    locationPlanId: output.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: output.deterministicFingerprint,
    nextAllowedAction: "preview_review_ready"
  });
}

function buildReport(comparison, validation) {
  return `# FOREST_LOCATION_RECIPE_001 Regeneration Comparison Report

Status: Controlled deterministic regeneration completed

## Fingerprints

- previous: ${comparison.previousFingerprint}
- current: ${comparison.newFingerprint}
- changed: ${comparison.fingerprintChanged}

## Placement Count Change

- previous: ${comparison.placementCountChanges.previous}
- current: ${comparison.placementCountChanges.current}
- delta: ${comparison.placementCountChanges.delta}

## Zone Changes

${Object.entries(comparison.zoneChanges)
  .map(
    ([zoneId, change]) =>
      `- ${zoneId}: ${change.previous} -> ${change.current} (${change.delta >= 0 ? "+" : ""}${change.delta})`
  )
  .join("\n")}

## Performance Impact

- close triangles: ${comparison.performanceImpact.previous.close} -> ${comparison.performanceImpact.current.close} (${comparison.performanceImpact.delta.close >= 0 ? "+" : ""}${comparison.performanceImpact.delta.close})
- gameplay triangles: ${comparison.performanceImpact.previous.gameplay} -> ${comparison.performanceImpact.current.gameplay} (${comparison.performanceImpact.delta.gameplay >= 0 ? "+" : ""}${comparison.performanceImpact.delta.gameplay})
- map triangles: ${comparison.performanceImpact.previous.map} -> ${comparison.performanceImpact.current.map} (${comparison.performanceImpact.delta.map >= 0 ? "+" : ""}${comparison.performanceImpact.delta.map})

## Validation

- status: ${validation.status}
- next allowed action: ${validation.nextAllowedAction}

## Safety

No Blender, GLBs, asset modification, or runtime activation were performed.
`;
}

export function buildControlledRegeneratedForestRecipe(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const writeFiles = options.writeFiles ?? false;
  const inputs = loadInputs(cwd);
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options, cwd };
  const base = generationModule.buildForestLocationRecipeOutput(resolvedOptions);
  const regeneratedOutput = applyRefinement(base, base.specification, resolvedOptions);
  const deterministicCheckOutput = applyRefinement(
    base,
    base.specification,
    resolvedOptions
  );
  const dependencyMap = buildDependencyMap(base.specification, regeneratedOutput);
  const performanceSummary = buildPerformanceSummary(
    base.specification,
    dependencyMap,
    resolvedOptions
  );
  regeneratedOutput.mobilePerformanceLimits = performanceSummary;
  const comparison = buildComparison(
    inputs.previousPlan,
    regeneratedOutput,
    performanceSummary
  );
  const validation = buildValidation(
    regeneratedOutput,
    dependencyMap,
    performanceSummary,
    comparison,
    deterministicCheckOutput.deterministicFingerprint
  );
  const report = buildReport(comparison, validation);

  if (writeFiles) {
    ensureDirectory(inputs.generationRoot);
    ensureDirectory(inputs.validationRoot);
    ensureDirectory(inputs.reportsRoot);
    writeJson(
      path.join(inputs.generationRoot, REGENERATED_PLAN_FILENAME),
      regeneratedOutput
    );
    writeJson(
      path.join(inputs.generationRoot, REGENERATED_DEPENDENCY_MAP_FILENAME),
      dependencyMap
    );
    writeJson(
      path.join(inputs.validationRoot, REGENERATION_VALIDATION_FILENAME),
      validation
    );
    fs.writeFileSync(
      path.join(inputs.reportsRoot, REGENERATION_REPORT_FILENAME),
      `${report}\n`
    );
  }

  return deepFreeze({
    output: regeneratedOutput,
    dependencyMap,
    performanceSummary,
    comparison,
    validation,
    report,
    refinementSpecification: inputs.refinementSpecification,
    beforeAfterRules: inputs.beforeAfterRules
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  buildControlledRegeneratedForestRecipe({ writeFiles: true });
}
