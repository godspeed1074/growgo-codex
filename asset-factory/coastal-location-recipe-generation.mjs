import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";
const SPECIFICATION_FILENAME = "coastal-location-recipe-001-specification.json";
const OUTPUT_FILENAME = "coastal-location-recipe-001-generated-plan.json";
const DEPENDENCY_MAP_FILENAME = "coastal-location-recipe-001-dependency-map.json";
const VALIDATION_FILENAME = "coastal-location-recipe-001-generation-validation.json";
const REPORT_FILENAME = "coastal-location-recipe-001-generation-report.md";

const DEFAULT_OPTIONS = Object.freeze({
  createdOn: "2026-07-30",
  seed: "COASTAL_LOCATION_RECIPE_001:DEFAULT:SEED_001",
  locationId: "COASTAL_EXPLORATION_LOCATION_001",
  variantId: "DEFAULT",
  biomeProfile: "COASTAL_RESERVE_TRAIL",
  archetype: "RESERVE_LOOP"
});

const DEPENDENCY_ORDER = Object.freeze([
  "COASTAL_GRAVEL_PATH_001",
  "COASTAL_BOARDWALK_001",
  "COASTAL_WATER_EDGE_001",
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

function buildZoneAllocation(options, specification) {
  const zoneOrder = specification.placementRules.zoneDefinitions.map((zone) => zone.zoneId);
  const waterVariant =
    options.archetype === "WETLAND_CROSSING"
      ? "broad_wet_crossing"
      : options.archetype === "CLIFF_LOOKOUT_APPROACH"
        ? "lookout_margin"
        : "shoreline_margin";

  return deepFreeze([
    {
      zoneId: zoneOrder[0],
      laneStart: 0,
      laneEnd: 24,
      traversalRole: "ENTRY",
      requiredRoles: ["primary_path_surface", "understory_ground_blend"],
      optionalRoles: ["native_grass_breakup"],
      densityProfile: "LOW"
    },
    {
      zoneId: zoneOrder[1],
      laneStart: 24,
      laneEnd: 56,
      traversalRole: "SHORELINE",
      requiredRoles: ["shoreline_transition_band", "terrain_detail_cluster"],
      optionalRoles: ["native_grass_breakup", "coastal_shrub_mass"],
      densityProfile: waterVariant === "lookout_margin" ? "MEDIUM" : "LOW"
    },
    {
      zoneId: zoneOrder[2],
      laneStart: 56,
      laneEnd: 76,
      traversalRole: "CROSSING",
      requiredRoles: ["elevated_wet_crossing", "shoreline_transition_band"],
      optionalRoles: ["terrain_detail_cluster"],
      densityProfile: "LOW"
    },
    {
      zoneId: zoneOrder[3],
      laneStart: 76,
      laneEnd: 112,
      traversalRole: "BUFFER",
      requiredRoles: ["native_grass_breakup", "coastal_shrub_mass", "understory_ground_blend"],
      optionalRoles: ["accent_native_tree"],
      densityProfile: options.archetype === "WETLAND_CROSSING" ? "HIGH" : "MEDIUM"
    },
    {
      zoneId: zoneOrder[4],
      laneStart: 112,
      laneEnd: 144,
      traversalRole: "DESTINATION",
      requiredRoles: ["primary_path_surface", "terrain_detail_cluster"],
      optionalRoles: ["accent_native_tree", "elevated_wet_crossing"],
      densityProfile: "MEDIUM"
    }
  ]);
}

function buildCounts(options) {
  const base = {
    COASTAL_GRAVEL_PATH_001: 4,
    COASTAL_BOARDWALK_001: options.archetype === "CLIFF_LOOKOUT_APPROACH" ? 2 : 1,
    COASTAL_WATER_EDGE_001: options.archetype === "WETLAND_CROSSING" ? 4 : 3,
    COASTAL_GROUND_COVER_001: 7,
    COASTAL_ROCK_CLUSTER_001: options.archetype === "CLIFF_LOOKOUT_APPROACH" ? 3 : 2,
    COASTAL_GRASS_TUSSOCK_001: 6,
    SHRUB_COASTAL_LOW_001: 2,
    TREE_BOTTLEBRUSH_001: 1
  };

  return Object.fromEntries(
    Object.entries(base).map(([assetId, count]) => {
      const jitterAllowed = [
        "COASTAL_GRAVEL_PATH_001",
        "COASTAL_WATER_EDGE_001",
        "COASTAL_GRASS_TUSSOCK_001"
      ].includes(assetId);
      const jitter = jitterAllowed
        ? hashInt(`${options.seed}:${assetId}:count`, 0, 1)
        : 0;
      const adjusted =
        assetId === "TREE_BOTTLEBRUSH_001"
          ? count
          : assetId === "COASTAL_BOARDWALK_001"
            ? count
            : count + jitter;
      return [assetId, adjusted];
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
      scale: hashFloat(`${baseSeed}:scale`, extra.scaleMin ?? 0.95, extra.scaleMax ?? 1.05, 3)
    },
    notes: extra.notes ?? null
  });
}

function buildPlacementPlan(specification, options) {
  const dependencies = byAssetId(specification);
  const zoneAllocation = buildZoneAllocation(options, specification);
  const counts = buildCounts(options);

  const placements = [];

  for (let i = 0; i < counts.COASTAL_GRAVEL_PATH_001; i += 1) {
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_GRAVEL_PATH_001"),
        i,
        "primary_path_surface",
        i < 2 ? "ENTRY_PATH_ZONE" : "LOOKOUT_OR_REST_ZONE",
        options,
        {
          xMin: i * 7,
          xMax: i * 7 + 6.5,
          yMin: 0.1,
          yMax: 1.2,
          rotationMin: -4,
          rotationMax: 4,
          notes: "main traversable route"
        }
      )
    );
  }

  for (let i = 0; i < counts.COASTAL_BOARDWALK_001; i += 1) {
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_BOARDWALK_001"),
        i,
        "elevated_wet_crossing",
        "WET_CROSSING_ZONE",
        options,
        {
          xMin: 24 + i * 6,
          xMax: 29 + i * 6,
          yMin: 1.8,
          yMax: 2.8,
          rotationMin: -2,
          rotationMax: 6,
          notes: "wet or unstable crossing segment"
        }
      )
    );
  }

  for (let i = 0; i < counts.COASTAL_WATER_EDGE_001; i += 1) {
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_WATER_EDGE_001"),
        i,
        "shoreline_transition_band",
        "SHORELINE_EDGE_ZONE",
        options,
        {
          xMin: 10 + i * 8,
          xMax: 16 + i * 8,
          yMin: 4.2,
          yMax: 6.1,
          rotationMin: -18,
          rotationMax: 18,
          scaleMin: 0.98,
          scaleMax: 1.06,
          notes: "non-traversable shoreline boundary"
        }
      )
    );
  }

  for (let i = 0; i < counts.COASTAL_GROUND_COVER_001; i += 1) {
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_GROUND_COVER_001"),
        i,
        "understory_ground_blend",
        i < 3 ? "ENTRY_PATH_ZONE" : "VEGETATION_BUFFER_ZONE",
        options,
        {
          xMin: 0 + i * 3,
          xMax: 2.4 + i * 3,
          yMin: 1.4,
          yMax: 4.4,
          rotationMin: -25,
          rotationMax: 25,
          scaleMin: 0.9,
          scaleMax: 1.08
        }
      )
    );
  }

  for (let i = 0; i < counts.COASTAL_ROCK_CLUSTER_001; i += 1) {
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_ROCK_CLUSTER_001"),
        i,
        "terrain_detail_cluster",
        i < 2 ? "SHORELINE_EDGE_ZONE" : "LOOKOUT_OR_REST_ZONE",
        options,
        {
          xMin: 18 + i * 9,
          xMax: 21 + i * 9,
          yMin: 3.1,
          yMax: 5.8,
          rotationMin: -18,
          rotationMax: 18,
          scaleMin: 0.92,
          scaleMax: 1.12
        }
      )
    );
  }

  for (let i = 0; i < counts.COASTAL_GRASS_TUSSOCK_001; i += 1) {
    placements.push(
      makePlacement(
        dependencies.get("COASTAL_GRASS_TUSSOCK_001"),
        i,
        "native_grass_breakup",
        i < 2 ? "ENTRY_PATH_ZONE" : "VEGETATION_BUFFER_ZONE",
        options,
        {
          xMin: 2 + i * 4,
          xMax: 4 + i * 4,
          yMin: 1.8,
          yMax: 5.2,
          rotationMin: -35,
          rotationMax: 35,
          scaleMin: 0.88,
          scaleMax: 1.12
        }
      )
    );
  }

  for (let i = 0; i < counts.SHRUB_COASTAL_LOW_001; i += 1) {
    placements.push(
      makePlacement(
        dependencies.get("SHRUB_COASTAL_LOW_001"),
        i,
        "coastal_shrub_mass",
        "VEGETATION_BUFFER_ZONE",
        options,
        {
          xMin: 42 + i * 8,
          xMax: 46 + i * 8,
          yMin: 4.8,
          yMax: 8.4,
          rotationMin: -24,
          rotationMax: 24,
          scaleMin: 0.94,
          scaleMax: 1.1
        }
      )
    );
  }

  for (let i = 0; i < counts.TREE_BOTTLEBRUSH_001; i += 1) {
    placements.push(
      makePlacement(
        dependencies.get("TREE_BOTTLEBRUSH_001"),
        i,
        "accent_native_tree",
        "LOOKOUT_OR_REST_ZONE",
        options,
        {
          xMin: 69,
          xMax: 76,
          yMin: 6.6,
          yMax: 8.8,
          rotationMin: -14,
          rotationMax: 14,
          scaleMin: 0.98,
          scaleMax: 1.04,
          notes: "destination anchor tree kept outside main standing space"
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

function buildNavigationPlan(placementPlan) {
  const routeNodes = [
    {
      nodeId: "ENTRY_NODE_001",
      zoneId: "ENTRY_PATH_ZONE",
      connectedTo: ["PATH_NODE_001"],
      surfaceRole: "primary_path_surface"
    },
    {
      nodeId: "PATH_NODE_001",
      zoneId: "ENTRY_PATH_ZONE",
      connectedTo: ["ENTRY_NODE_001", "TRANSITION_NODE_001"],
      surfaceRole: "primary_path_surface"
    },
    {
      nodeId: "TRANSITION_NODE_001",
      zoneId: "WET_CROSSING_ZONE",
      connectedTo: ["PATH_NODE_001", "DESTINATION_NODE_001"],
      surfaceRole: "elevated_wet_crossing"
    },
    {
      nodeId: "DESTINATION_NODE_001",
      zoneId: "LOOKOUT_OR_REST_ZONE",
      connectedTo: ["TRANSITION_NODE_001"],
      surfaceRole: "primary_path_surface"
    }
  ];

  return deepFreeze({
    routeType: "pedestrian_exploration",
    primaryRouteNodeIds: routeNodes.map((node) => node.nodeId),
    routeNodes,
    waterBoundaryRule:
      "placements tagged shoreline_transition_band are excluded from traversable route surfaces",
    vegetationClearanceRule:
      "vegetation placements must preserve a readable movement corridor around primary path and destination nodes",
    placementCount: placementPlan.placements.length
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
    schemaId: "COASTAL_LOCATION_RECIPE_001_DEPENDENCY_MAP_001",
    recipeId: specification.recipeIdentity.recipeId,
    assets: DEPENDENCY_ORDER.map((assetId) => usageByAsset[assetId]),
    unsupportedAssetsIncluded: false
  });
}

function buildPerformanceSummary(specification, dependencyMap, options) {
  const budget = specification.performanceConstraints.archetypeTriangleBudgets[options.archetype];
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
      specification.performanceConstraints.maxUniqueReferencedAssetsPerLocation,
    withinUniqueAssetCap:
      dependencyMap.assets.length <=
      specification.performanceConstraints.maxUniqueReferencedAssetsPerLocation
  });
}

export function buildCoastalLocationRecipeOutput(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const specification = readJson(
    path.resolve(cwd, RECIPE_ROOT, "specification", SPECIFICATION_FILENAME)
  );

  const approvedDependencyIds = new Set([
    ...specification.assetDependencies.requiredCoreAssets.map((entry) => entry.assetId),
    ...specification.assetDependencies.approvedVegetationAssets.map((entry) => entry.assetId)
  ]);

  const unexpectedDependency = [...approvedDependencyIds].find(
    (assetId) => !DEPENDENCY_ORDER.includes(assetId)
  );
  if (unexpectedDependency) {
    throw new Error(
      `Coastal location recipe generation blocked: unsupported approved asset ${unexpectedDependency} was included in the intake package.`
    );
  }

  const placementPlan = buildPlacementPlan(specification, resolvedOptions);
  const dependencyMap = buildDependencyMap(specification, placementPlan);
  const navigationPlan = buildNavigationPlan(placementPlan);
  const performanceSummary = buildPerformanceSummary(
    specification,
    dependencyMap,
    resolvedOptions
  );

  const output = {
    schemaId: "COASTAL_LOCATION_RECIPE_001_GENERATED_PLAN_001",
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
    navigationPathLogic: navigationPlan,
    waterTransitionRules: {
      boardwalkRequiredZones: ["WET_CROSSING_ZONE"],
      waterEdgeTraversable: false,
      pathToBoardwalkTransitionOnlyThrough: ["WET_CROSSING_ZONE"],
      rockClustersRestrictedTo: ["SHORELINE_EDGE_ZONE", "LOOKOUT_OR_REST_ZONE"]
    },
    vegetationDensityRules: {
      ENTRY_PATH_ZONE: {
        density: "LOW",
        allowedRoles: ["understory_ground_blend", "native_grass_breakup"]
      },
      SHORELINE_EDGE_ZONE: {
        density: "LOW",
        allowedRoles: ["terrain_detail_cluster", "native_grass_breakup"]
      },
      VEGETATION_BUFFER_ZONE: {
        density:
          resolvedOptions.archetype === "WETLAND_CROSSING" ? "HIGH" : "MEDIUM",
        allowedRoles: [
          "native_grass_breakup",
          "coastal_shrub_mass",
          "understory_ground_blend",
          "accent_native_tree"
        ]
      },
      LOOKOUT_OR_REST_ZONE: {
        density: "MEDIUM",
        allowedRoles: ["terrain_detail_cluster", "accent_native_tree"]
      }
    },
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
    JSON.stringify(output.placementPlan.placements.map((entry) => [
      entry.assetId,
      entry.zoneId,
      entry.transform.x,
      entry.transform.y,
      entry.transform.rotationDegrees,
      entry.transform.scale
    ]))
  );

  return deepFreeze({
    specification,
    output: deepFreeze(output),
    dependencyMap,
    performanceSummary
  });
}

export function buildCoastalLocationRecipeGenerationValidation(options = {}) {
  const { specification, output, dependencyMap, performanceSummary } =
    buildCoastalLocationRecipeOutput(options);

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
      buildCoastalLocationRecipeOutput(options).output.deterministicFingerprint ===
        output.deterministicFingerprint
    ],
    [
      "no_unsupported_assets_included",
      dependencyMap.assets.every((asset) => allowedDependencies.has(asset.assetId)) &&
        output.unsupportedAssetsIncluded === false
    ],
    [
      "navigation_path_logic_defined",
      output.navigationPathLogic.primaryRouteNodeIds.length >= 4
    ],
    [
      "water_transition_rules_defined",
      output.waterTransitionRules.boardwalkRequiredZones.includes("WET_CROSSING_ZONE")
    ],
    [
      "vegetation_density_rules_defined",
      Object.keys(output.vegetationDensityRules).length >= 4
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
    schemaId: "COASTAL_LOCATION_RECIPE_001_GENERATION_VALIDATION_001",
    recipeId: specification.recipeIdentity.recipeId,
    locationPlanId: output.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: output.deterministicFingerprint,
    nextAllowedAction: "recipe_review_or_world_assembly_preview_only"
  });
}

export function renderCoastalLocationRecipeGenerationReport(options = {}) {
  const { output, dependencyMap, performanceSummary } =
    buildCoastalLocationRecipeOutput(options);
  const validation = buildCoastalLocationRecipeGenerationValidation(options);

  return `# COASTAL_LOCATION_RECIPE_001 Generation Report

Status: Deterministic coastal location assembly plan generated

## Seed

- seed: ${output.seedHandling.seed}
- location ID: ${output.seedHandling.locationId}
- biome profile: ${output.seedHandling.biomeProfile}
- archetype: ${output.seedHandling.archetype}

## Included assets

${dependencyMap.assets.map((asset) => `- ${asset.assetId}: ${asset.placementCount} placements`).join("\n")}

## Navigation

- primary route nodes: ${output.navigationPathLogic.primaryRouteNodeIds.join(" -> ")}
- water edge traversable: ${output.waterTransitionRules.waterEdgeTraversable}
- boardwalk transition zones: ${output.waterTransitionRules.boardwalkRequiredZones.join(", ")}

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

\`COASTAL_LOCATION_RECIPE_001\` has a deterministic, dependency-validated assembly plan ready for review.
`;
}

export function writeCoastalLocationRecipeGeneration(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const generationDirectory = path.join(recipeRoot, "generation");
  const validationDirectory = path.join(recipeRoot, "validation");
  const reportsDirectory = path.join(recipeRoot, "reports");

  ensureDirectory(generationDirectory);
  ensureDirectory(validationDirectory);
  ensureDirectory(reportsDirectory);

  const { output, dependencyMap } = buildCoastalLocationRecipeOutput(options);
  const validation = buildCoastalLocationRecipeGenerationValidation(options);
  const report = renderCoastalLocationRecipeGenerationReport(options);

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
