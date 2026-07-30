import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001";
const SPECIFICATION_FILENAME = "forest-location-recipe-001-specification.json";
const OUTPUT_FILENAME = "forest-location-recipe-001-generated-plan.json";
const DEPENDENCY_MAP_FILENAME = "forest-location-recipe-001-dependency-map.json";
const VALIDATION_FILENAME = "forest-location-recipe-001-generation-validation.json";
const REPORT_FILENAME = "forest-location-recipe-001-generation-report.md";

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

const PERFORMANCE_CONSTRAINTS = Object.freeze({
  maxUniqueReferencedAssetsPerLocation: 6,
  archetypeTriangleBudgets: {
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
  }
});

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

function hashInt(seed, min, maxInclusive) {
  const hex = hashHex(seed).slice(0, 12);
  const value = Number.parseInt(hex, 16);
  const range = maxInclusive - min + 1;
  return min + (value % range);
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

function buildZoneAllocation(specification) {
  const zoneOrder = specification.placementRules.zoneDefinitions.map((zone) => zone.zoneId);

  return deepFreeze([
    {
      zoneId: zoneOrder[0],
      laneStart: 0,
      laneEnd: 22,
      traversalRole: "ENTRY",
      requiredRoles: ["primary_path_surface", "understory_ground_blend"],
      optionalRoles: ["native_grass_breakup"],
      densityProfile: "LOW"
    },
    {
      zoneId: zoneOrder[1],
      laneStart: 22,
      laneEnd: 46,
      traversalRole: "TRANSITION",
      requiredRoles: [
        "native_grass_breakup",
        "forest_shrub_mass",
        "understory_ground_blend",
        "terrain_detail_cluster"
      ],
      optionalRoles: ["accent_native_tree"],
      densityProfile: "MEDIUM"
    },
    {
      zoneId: zoneOrder[2],
      laneStart: 46,
      laneEnd: 82,
      traversalRole: "MAIN_TRACK",
      requiredRoles: [
        "primary_path_surface",
        "understory_ground_blend",
        "forest_shrub_mass"
      ],
      optionalRoles: ["accent_native_tree"],
      densityProfile: "MEDIUM_HIGH"
    },
    {
      zoneId: zoneOrder[3],
      laneStart: 82,
      laneEnd: 108,
      traversalRole: "CLEARING",
      requiredRoles: ["primary_path_surface", "terrain_detail_cluster"],
      optionalRoles: ["accent_native_tree", "understory_ground_blend"],
      densityProfile: "LOW_MEDIUM"
    },
    {
      zoneId: zoneOrder[4],
      laneStart: 108,
      laneEnd: 144,
      traversalRole: "BACKDROP",
      requiredRoles: ["forest_shrub_mass", "native_grass_breakup"],
      optionalRoles: ["accent_native_tree"],
      densityProfile: "HIGH"
    }
  ]);
}

function buildCounts(options) {
  const base = {
    COASTAL_GRAVEL_PATH_001:
      options.archetype === "RESERVE_TRACK_OUT_AND_BACK" ? 6 : 5,
    COASTAL_GROUND_COVER_001: 7,
    COASTAL_ROCK_CLUSTER_001:
      options.archetype === "CLEARING_SPUR" ? 2 : 3,
    COASTAL_GRASS_TUSSOCK_001: 5,
    SHRUB_COASTAL_LOW_001:
      options.archetype === "FOREST_EDGE_LOOP" ? 4 : 5,
    TREE_BOTTLEBRUSH_001:
      options.archetype === "RESERVE_TRACK_OUT_AND_BACK" ? 1 : 2
  };

  return Object.fromEntries(
    Object.entries(base).map(([assetId, count]) => {
      const jitterAllowed = [
        "COASTAL_GROUND_COVER_001",
        "COASTAL_GRASS_TUSSOCK_001",
        "SHRUB_COASTAL_LOW_001"
      ].includes(assetId);
      const jitter = jitterAllowed
        ? hashInt(`${options.seed}:${assetId}:count`, 0, 1)
        : 0;
      return [assetId, count + jitter];
    })
  );
}

function makePlacement(assetRecord, instanceIndex, role, zoneId, options, extra = {}) {
  const baseSeed = `${options.seed}:${assetRecord.assetId}:${zoneId}:${instanceIndex}`;
  return deepFreeze({
    placementId: `${assetRecord.assetId}:${zoneId}:${String(instanceIndex).padStart(2, "0")}`,
    assetId: assetRecord.assetId,
    assetVersion: assetRecord.version,
    role,
    zoneId,
    lodHint: extra.lodHint ?? "LOD_GAMEPLAY",
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
      scale: hashFloat(`${baseSeed}:scale`, extra.scaleMin ?? 0.95, extra.scaleMax ?? 1.05, 3)
    },
    notes: extra.notes ?? null
  });
}

function buildPlacementPlan(specification, options) {
  const dependencies = byAssetId(specification);
  const zoneAllocation = buildZoneAllocation(specification);
  const counts = buildCounts(options);
  const placements = [];

  for (let i = 0; i < counts.COASTAL_GRAVEL_PATH_001; i += 1) {
    const zoneId =
      i < 2
        ? "ENTRY_TRACK_ZONE"
        : i < counts.COASTAL_GRAVEL_PATH_001 - 1
          ? "CANOPY_TRACK_ZONE"
          : "CLEARING_OR_REST_ZONE";
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_GRAVEL_PATH_001"),
        i,
        "primary_path_surface",
        zoneId,
        options,
        {
          xMin: i * 10,
          xMax: i * 10 + 8.5,
          yMin: zoneId === "ENTRY_TRACK_ZONE" ? 0.2 : 1.2,
          yMax: zoneId === "CLEARING_OR_REST_ZONE" ? 3.2 : 2.2,
          rotationMin: -5,
          rotationMax: 5,
          notes:
            zoneId === "CLEARING_OR_REST_ZONE"
              ? "clearing standing surface"
              : "primary forest walking route"
        }
      )
    );
  }

  for (let i = 0; i < counts.COASTAL_GROUND_COVER_001; i += 1) {
    const zoneId = i < 2 ? "ENTRY_TRACK_ZONE" : i < 5 ? "FOREST_EDGE_TRANSITION_ZONE" : "CANOPY_TRACK_ZONE";
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_GROUND_COVER_001"),
        i,
        "understory_ground_blend",
        zoneId,
        options,
        {
          xMin: 1 + i * 5,
          xMax: 4 + i * 5,
          yMin: 1.1,
          yMax: zoneId === "CANOPY_TRACK_ZONE" ? 4.8 : 3.6,
          rotationMin: -22,
          rotationMax: 22,
          scaleMin: 0.92,
          scaleMax: 1.08
        }
      )
    );
  }

  for (let i = 0; i < counts.COASTAL_ROCK_CLUSTER_001; i += 1) {
    const zoneId = i === counts.COASTAL_ROCK_CLUSTER_001 - 1 ? "CLEARING_OR_REST_ZONE" : "FOREST_EDGE_TRANSITION_ZONE";
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_ROCK_CLUSTER_001"),
        i,
        "terrain_detail_cluster",
        zoneId,
        options,
        {
          xMin: 20 + i * 18,
          xMax: 24 + i * 18,
          yMin: zoneId === "CLEARING_OR_REST_ZONE" ? 5.4 : 3.2,
          yMax: zoneId === "CLEARING_OR_REST_ZONE" ? 7 : 4.8,
          rotationMin: -20,
          rotationMax: 20,
          scaleMin: 0.9,
          scaleMax: 1.12
        }
      )
    );
  }

  for (let i = 0; i < counts.COASTAL_GRASS_TUSSOCK_001; i += 1) {
    const zoneId = i < 2 ? "FOREST_EDGE_TRANSITION_ZONE" : "DEEP_FOREST_MARGIN_ZONE";
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_GRASS_TUSSOCK_001"),
        i,
        "native_grass_breakup",
        zoneId,
        options,
        {
          xMin: 12 + i * 6,
          xMax: 15 + i * 6,
          yMin: zoneId === "DEEP_FOREST_MARGIN_ZONE" ? 6.4 : 2.6,
          yMax: zoneId === "DEEP_FOREST_MARGIN_ZONE" ? 9.8 : 4.2,
          rotationMin: -28,
          rotationMax: 28,
          scaleMin: 0.9,
          scaleMax: 1.1
        }
      )
    );
  }

  for (let i = 0; i < counts.SHRUB_COASTAL_LOW_001; i += 1) {
    const zoneId =
      i < 2
        ? "FOREST_EDGE_TRANSITION_ZONE"
        : i < counts.SHRUB_COASTAL_LOW_001 - 1
          ? "CANOPY_TRACK_ZONE"
          : "DEEP_FOREST_MARGIN_ZONE";
    placements.push(
      makePlacement(
        dependencies.get("SHRUB_COASTAL_LOW_001"),
        i,
        "forest_shrub_mass",
        zoneId,
        options,
        {
          xMin: 18 + i * 10,
          xMax: 23 + i * 10,
          yMin: zoneId === "DEEP_FOREST_MARGIN_ZONE" ? 7.4 : 3.6,
          yMax: zoneId === "DEEP_FOREST_MARGIN_ZONE" ? 10.8 : 6.8,
          rotationMin: -24,
          rotationMax: 24,
          scaleMin: 0.94,
          scaleMax: 1.12,
          notes:
            zoneId === "DEEP_FOREST_MARGIN_ZONE"
              ? "backdrop mass preserving future eucalyptus space"
              : null
        }
      )
    );
  }

  for (let i = 0; i < counts.TREE_BOTTLEBRUSH_001; i += 1) {
    const zoneId = i === 0 ? "CLEARING_OR_REST_ZONE" : "DEEP_FOREST_MARGIN_ZONE";
    placements.push(
      makePlacement(
        dependencies.get("TREE_BOTTLEBRUSH_001"),
        i,
        "accent_native_tree",
        zoneId,
        options,
        {
          xMin: zoneId === "CLEARING_OR_REST_ZONE" ? 86 : 112,
          xMax: zoneId === "CLEARING_OR_REST_ZONE" ? 94 : 120,
          yMin: zoneId === "CLEARING_OR_REST_ZONE" ? 6.4 : 8.8,
          yMax: zoneId === "CLEARING_OR_REST_ZONE" ? 8.4 : 11.2,
          rotationMin: -16,
          rotationMax: 16,
          scaleMin: 0.98,
          scaleMax: 1.05,
          notes:
            zoneId === "CLEARING_OR_REST_ZONE"
              ? "clearing anchor tree kept outside standing center"
              : "deep-margin marker tree"
        }
      )
    );
  }

  const orderedPlacements = placements.sort((a, b) =>
    a.placementId.localeCompare(b.placementId)
  );

  return deepFreeze({
    zoneAllocation,
    placements: orderedPlacements
  });
}

function buildNavigationPlan() {
  const routeNodes = [
    {
      nodeId: "FOREST_ENTRY_NODE_001",
      zoneId: "ENTRY_TRACK_ZONE",
      connectedTo: ["FOREST_EDGE_NODE_001"],
      surfaceRole: "primary_path_surface"
    },
    {
      nodeId: "FOREST_EDGE_NODE_001",
      zoneId: "FOREST_EDGE_TRANSITION_ZONE",
      connectedTo: ["FOREST_ENTRY_NODE_001", "CANOPY_NODE_001"],
      surfaceRole: "primary_path_surface"
    },
    {
      nodeId: "CANOPY_NODE_001",
      zoneId: "CANOPY_TRACK_ZONE",
      connectedTo: ["FOREST_EDGE_NODE_001", "CLEARING_NODE_001"],
      surfaceRole: "primary_path_surface"
    },
    {
      nodeId: "CLEARING_NODE_001",
      zoneId: "CLEARING_OR_REST_ZONE",
      connectedTo: ["CANOPY_NODE_001", "RETURN_NODE_001"],
      surfaceRole: "primary_path_surface"
    },
    {
      nodeId: "RETURN_NODE_001",
      zoneId: "DEEP_FOREST_MARGIN_ZONE",
      connectedTo: ["CLEARING_NODE_001"],
      surfaceRole: "primary_path_surface"
    }
  ];

  return deepFreeze({
    routeType: "pedestrian_forest_exploration",
    primaryRouteNodeIds: routeNodes.map((node) => node.nodeId),
    routeNodes,
    trailLegibilityRule:
      "primary path placements must remain readable through entry, canopy corridor, and clearing arrival",
    clearanceRule:
      "shrub and grass placements must not overlap the standing corridor around canopy and clearing route nodes"
  });
}

function buildDependencyMap(specification, placementPlan) {
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
        placementCount: placementPlan.placements.filter(
          (placement) => placement.assetId === entry.assetId
        ).length,
        zones: Array.from(
          new Set(
            placementPlan.placements
              .filter((placement) => placement.assetId === entry.assetId)
              .map((placement) => placement.zoneId)
          )
        ).sort()
      }
    ])
  );

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_DEPENDENCY_MAP_001",
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
  const budget = PERFORMANCE_CONSTRAINTS.archetypeTriangleBudgets[options.archetype];
  const dependencies = byAssetId(specification);

  const totals = dependencyMap.assets.reduce(
    (accumulator, asset) => {
      const source = dependencies.get(asset.assetId);
      accumulator.close += asset.placementCount * source.metrics.closeTriangles;
      accumulator.gameplay += asset.placementCount * source.metrics.gameplayTriangles;
      accumulator.map += asset.placementCount * source.metrics.mapTriangles;
      accumulator.materialFamilies += source.metrics.closeMaterials;
      return accumulator;
    },
    { close: 0, gameplay: 0, map: 0, materialFamilies: 0 }
  );

  return deepFreeze({
    triangleTotals: {
      close: totals.close,
      gameplay: totals.gameplay,
      map: totals.map
    },
    budget,
    withinBudget: {
      close: totals.close <= budget.closeMax,
      gameplay: totals.gameplay <= budget.gameplayMax,
      map: totals.map <= budget.mapMax
    },
    uniqueAssetCount: dependencyMap.assets.length,
    maxUniqueReferencedAssetsPerLocation:
      PERFORMANCE_CONSTRAINTS.maxUniqueReferencedAssetsPerLocation,
    withinUniqueAssetCap:
      dependencyMap.assets.length <=
      PERFORMANCE_CONSTRAINTS.maxUniqueReferencedAssetsPerLocation
  });
}

function buildClearingDiscoveryZones() {
  return deepFreeze([
    {
      zoneId: "CLEARING_OR_REST_ZONE",
      zoneType: "standing_clearing",
      standingAreaRequired: true,
      intendedUse: "pause_point_and_light_destination",
      supportedAnchors: ["terrain_detail_cluster", "accent_native_tree"]
    },
    {
      zoneId: "DEEP_FOREST_MARGIN_ZONE",
      zoneType: "discovery_backdrop",
      standingAreaRequired: false,
      intendedUse: "future_canopy_interest_and_depth",
      supportedAnchors: ["forest_shrub_mass", "accent_native_tree"]
    }
  ]);
}

function buildExplorationInterestPoints(options) {
  return deepFreeze([
    {
      pointId: "FOREST_CLEARING_MARKER_001",
      zoneId: "CLEARING_OR_REST_ZONE",
      interestType: "arrival_pause",
      description: "Small clearing with anchor tree and rock detail.",
      discoveryWeight: options.archetype === "CLEARING_SPUR" ? "HIGH" : "MEDIUM"
    },
    {
      pointId: "FOREST_TRANSITION_SCREEN_001",
      zoneId: "FOREST_EDGE_TRANSITION_ZONE",
      interestType: "sightline_break",
      description: "Shrub and grass layering creates enclosure before the canopy track.",
      discoveryWeight: "MEDIUM"
    },
    {
      pointId: "FOREST_MARGIN_FUTURE_CANOPY_001",
      zoneId: "DEEP_FOREST_MARGIN_ZONE",
      interestType: "future_uplift_reserved",
      description: "Reserved visual mass area for later eucalyptus canopy promotion.",
      discoveryWeight: "LOW"
    }
  ]);
}

export function buildForestLocationRecipeOutput(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const specification = readJson(
    path.resolve(cwd, RECIPE_ROOT, "specification", SPECIFICATION_FILENAME)
  );

  const approvedDependencyIds = new Set([
    ...specification.assetDependencies.requiredCoreAssets.map((entry) => entry.assetId),
    ...specification.assetDependencies.approvedVegetationAssets.map((entry) => entry.assetId)
  ]);
  const deferredDependencyIds = new Set(
    specification.assetDependencies.deferredAssets.map((entry) => entry.assetId)
  );

  const unexpectedDependency = [...approvedDependencyIds].find(
    (assetId) => !DEPENDENCY_ORDER.includes(assetId)
  );
  if (unexpectedDependency) {
    throw new Error(
      `Forest location recipe generation blocked: unsupported approved asset ${unexpectedDependency} was included in the intake package.`
    );
  }
  if (approvedDependencyIds.has("TREE_EUCALYPTUS_001") || !deferredDependencyIds.has("TREE_EUCALYPTUS_001")) {
    throw new Error(
      "Forest location recipe generation blocked: TREE_EUCALYPTUS_001 must remain deferred until approved lifecycle promotion."
    );
  }

  const placementPlan = buildPlacementPlan(specification, resolvedOptions);
  const dependencyMap = buildDependencyMap(specification, placementPlan);
  const navigationPlan = buildNavigationPlan();
  const performanceSummary = buildPerformanceSummary(
    specification,
    dependencyMap,
    resolvedOptions
  );

  const output = {
    schemaId: "FOREST_LOCATION_RECIPE_001_GENERATED_PLAN_001",
    recipeId: specification.recipeIdentity.recipeId,
    locationPlanId: `${resolvedOptions.locationId}:${resolvedOptions.seed}`,
    generatedOn: resolvedOptions.createdOn,
    generationMode: "deterministic_recipe_assembly_plan_only",
    seedHandling: {
      seed: resolvedOptions.seed,
      locationId: resolvedOptions.locationId,
      variantId: resolvedOptions.variantId,
      biomeProfile: resolvedOptions.biomeProfile,
      archetype: resolvedOptions.archetype,
      seedStrategy: specification.deterministicSeedRules.seedStrategy
    },
    zoneAllocation: placementPlan.zoneAllocation,
    placementPlan: {
      totalPlacements: placementPlan.placements.length,
      placements: placementPlan.placements
    },
    forestZones: specification.placementRules.zoneDefinitions,
    trailNavigationLogic: navigationPlan,
    vegetationDensityRules: {
      ENTRY_TRACK_ZONE: {
        density: "LOW",
        allowedRoles: ["primary_path_surface", "understory_ground_blend", "native_grass_breakup"]
      },
      FOREST_EDGE_TRANSITION_ZONE: {
        density: "MEDIUM",
        allowedRoles: [
          "native_grass_breakup",
          "forest_shrub_mass",
          "understory_ground_blend",
          "terrain_detail_cluster"
        ]
      },
      CANOPY_TRACK_ZONE: {
        density: "MEDIUM_HIGH",
        allowedRoles: [
          "primary_path_surface",
          "understory_ground_blend",
          "forest_shrub_mass",
          "accent_native_tree"
        ]
      },
      CLEARING_OR_REST_ZONE: {
        density: "LOW_MEDIUM",
        allowedRoles: ["primary_path_surface", "terrain_detail_cluster", "accent_native_tree"]
      },
      DEEP_FOREST_MARGIN_ZONE: {
        density: "HIGH",
        allowedRoles: ["forest_shrub_mass", "native_grass_breakup", "accent_native_tree"]
      }
    },
    clearingDiscoveryZones: buildClearingDiscoveryZones(),
    explorationInterestPoints: buildExplorationInterestPoints(resolvedOptions),
    mobilePerformanceLimits: performanceSummary,
    unsupportedAssetsIncluded: false,
    runtimeSafety: {
      blenderFilesCreated: false,
      glbsCreated: false,
      assetsModified: false,
      runtimeActivated: false
    }
  };

  output.deterministicFingerprint = hashHex(
    output.recipeId,
    output.locationPlanId,
    JSON.stringify(output.zoneAllocation),
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

  return deepFreeze({
    specification,
    output: deepFreeze(output),
    dependencyMap,
    performanceSummary
  });
}

export function buildForestLocationRecipeGenerationValidation(options = {}) {
  const { specification, output, dependencyMap, performanceSummary } =
    buildForestLocationRecipeOutput(options);

  const allowedDependencies = new Set(DEPENDENCY_ORDER);
  const checks = [
    [
      "all_dependencies_exist",
      dependencyMap.assets.length === DEPENDENCY_ORDER.length &&
        dependencyMap.assets.every((asset) => asset.placementCount > 0)
    ],
    [
      "lifecycle_requirements_pass",
      dependencyMap.assets.every((asset) =>
        ["ACTIVE_DEVELOPMENT_REVISION", "APPROVED_CURRENT", "APPROVED_CURRENT_CANDIDATE"].includes(
          byAssetId(specification).get(asset.assetId).lifecycleStatus
        )
      )
    ],
    [
      "deterministic_output_for_same_seed",
      buildForestLocationRecipeOutput(options).output.deterministicFingerprint ===
        output.deterministicFingerprint
    ],
    [
      "unsupported_assets_blocked",
      dependencyMap.assets.every((asset) => allowedDependencies.has(asset.assetId)) &&
        output.unsupportedAssetsIncluded === false &&
        dependencyMap.deferredAssets.some((asset) => asset.assetId === "TREE_EUCALYPTUS_001")
    ],
    [
      "forest_zones_defined",
      output.forestZones.length === 5 && output.forestZones.some((zone) => zone.zoneId === "CLEARING_OR_REST_ZONE")
    ],
    [
      "trail_navigation_logic_defined",
      output.trailNavigationLogic.primaryRouteNodeIds.length >= 5
    ],
    [
      "vegetation_density_rules_defined",
      Object.keys(output.vegetationDensityRules).length === 5
    ],
    [
      "clearing_and_discovery_zones_defined",
      output.clearingDiscoveryZones.length >= 2 &&
        output.explorationInterestPoints.length >= 3
    ],
    [
      "mobile_performance_limits_respected",
      Object.values(performanceSummary.withinBudget).every(Boolean) &&
        performanceSummary.withinUniqueAssetCap === true
    ],
    ["no_blender_files_created", output.runtimeSafety.blenderFilesCreated === false],
    ["no_glbs_created", output.runtimeSafety.glbsCreated === false],
    ["no_assets_modified", output.runtimeSafety.assetsModified === false],
    ["runtime_not_activated", output.runtimeSafety.runtimeActivated === false]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_GENERATION_VALIDATION_001",
    recipeId: specification.recipeIdentity.recipeId,
    locationPlanId: output.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: output.deterministicFingerprint,
    nextAllowedAction: "recipe_review_or_world_assembly_preview_only"
  });
}

export function renderForestLocationRecipeGenerationReport(options = {}) {
  const { output, dependencyMap, performanceSummary } =
    buildForestLocationRecipeOutput(options);
  const validation = buildForestLocationRecipeGenerationValidation(options);

  return `# FOREST_LOCATION_RECIPE_001 Generation Report

Status: Deterministic forest location assembly plan generated

## Seed

- seed: ${output.seedHandling.seed}
- location ID: ${output.seedHandling.locationId}
- biome profile: ${output.seedHandling.biomeProfile}
- archetype: ${output.seedHandling.archetype}

## Included assets

${dependencyMap.assets.map((asset) => `- ${asset.assetId}: ${asset.placementCount} placements`).join("\n")}

## Forest flow

- primary route nodes: ${output.trailNavigationLogic.primaryRouteNodeIds.join(" -> ")}
- clearing zones: ${output.clearingDiscoveryZones.map((zone) => zone.zoneId).join(", ")}
- deferred canopy assets: ${dependencyMap.deferredAssets.map((asset) => asset.assetId).join(", ")}

## Performance

- close triangles: ${performanceSummary.triangleTotals.close} / ${performanceSummary.budget.closeMax}
- gameplay triangles: ${performanceSummary.triangleTotals.gameplay} / ${performanceSummary.budget.gameplayMax}
- map triangles: ${performanceSummary.triangleTotals.map} / ${performanceSummary.budget.mapMax}
- unique asset count: ${performanceSummary.uniqueAssetCount} / ${performanceSummary.maxUniqueReferencedAssetsPerLocation}

## Safety

No Blender files, GLBs, asset modifications, or runtime activation were performed.

## Validation

- validation status: ${validation.status}
- next allowed action: ${validation.nextAllowedAction}

## Outcome

\`FOREST_LOCATION_RECIPE_001\` has a deterministic, dependency-validated forest assembly plan ready for preview.
`;
}

export function writeForestLocationRecipeGeneration(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const generationDirectory = path.join(recipeRoot, "generation");
  const validationDirectory = path.join(recipeRoot, "validation");
  const reportsDirectory = path.join(recipeRoot, "reports");

  ensureDirectory(generationDirectory);
  ensureDirectory(validationDirectory);
  ensureDirectory(reportsDirectory);

  const { output, dependencyMap } = buildForestLocationRecipeOutput(options);
  const validation = buildForestLocationRecipeGenerationValidation(options);
  const report = renderForestLocationRecipeGenerationReport(options);

  fs.writeFileSync(
    path.join(generationDirectory, OUTPUT_FILENAME),
    `${JSON.stringify(output, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(generationDirectory, DEPENDENCY_MAP_FILENAME),
    `${JSON.stringify(dependencyMap, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(validationDirectory, VALIDATION_FILENAME),
    `${JSON.stringify(validation, null, 2)}\n`
  );
  fs.writeFileSync(path.join(reportsDirectory, REPORT_FILENAME), report);

  return deepFreeze({
    recipeRoot,
    output,
    dependencyMap,
    validation,
    report
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const result = writeForestLocationRecipeGeneration();
  process.stdout.write(
    `${result.output.recipeId} generation written to ${result.recipeRoot}\n`
  );
}
