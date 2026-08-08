const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SPATIAL_DISTRIBUTION_RULE_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SPATIAL_DISTRIBUTION_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SPATIAL_DISTRIBUTION_VERSION =
  "atlas_population_spatial_distribution_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SPATIAL_DISTRIBUTION_RULES =
  Object.freeze([
    Object.freeze({
      distributionRuleId: "DIST_RULE_PARK_PUBLIC_GREEN_RECIPE_001",
      recipeId: "PARK_PUBLIC_GREEN_RECIPE_001",
      supportedFeatureClasses: Object.freeze(["park"]),
      densityThresholds: Object.freeze({
        mediumArea: 90,
        largeArea: 220
      }),
      vegetationPolicy: Object.freeze({
        treeSpacingMeters: 10,
        shrubSpacingMeters: 3.5,
        treeRadiusFractionRange: Object.freeze([0.22, 0.48]),
        shrubRadiusFractionRange: Object.freeze([0.72, 0.9]),
        treeCounts: Object.freeze({
          small: 1,
          medium: 1,
          large: 2
        }),
        shrubCounts: Object.freeze({
          small: 1,
          medium: 1,
          large: 2
        }),
        pathBoundaryPreference: "park_edge_cluster"
      }),
      roadRelationshipPolicy: Object.freeze({
        vegetationExclusionBias: "future_road_exclusion_hook",
        buildingSetbackBias: "not_applicable"
      }),
      buildingPolicy: null,
      status: "approved"
    }),
    Object.freeze({
      distributionRuleId: "DIST_RULE_COASTAL_GREEN_RECIPE_001",
      recipeId: "COASTAL_GREEN_RECIPE_001",
      supportedFeatureClasses: Object.freeze([
        "vegetation_area",
        "coastal_green",
        "roadside_green",
        "reserve"
      ]),
      densityThresholds: Object.freeze({
        mediumArea: 80,
        largeArea: 180
      }),
      vegetationPolicy: Object.freeze({
        treeSpacingMeters: 8,
        shrubSpacingMeters: 2.8,
        treeRadiusFractionRange: Object.freeze([0.34, 0.58]),
        shrubRadiusFractionRange: Object.freeze([0.76, 0.92]),
        treeCounts: Object.freeze({
          small: 1,
          medium: 1,
          large: 1
        }),
        shrubCounts: Object.freeze({
          small: 1,
          medium: 2,
          large: 2
        }),
        pathBoundaryPreference: "coastal_edge_cluster"
      }),
      roadRelationshipPolicy: Object.freeze({
        vegetationExclusionBias: "future_road_exclusion_hook",
        buildingSetbackBias: "not_applicable"
      }),
      buildingPolicy: null,
      status: "approved"
    }),
    Object.freeze({
      distributionRuleId: "DIST_RULE_BUILDING_CIVIC_RECIPE_001",
      recipeId: "BUILDING_CIVIC_RECIPE_001",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground"]),
      densityThresholds: Object.freeze({
        mediumArea: 200,
        largeArea: 500
      }),
      vegetationPolicy: null,
      roadRelationshipPolicy: Object.freeze({
        vegetationExclusionBias: "future_road_exclusion_hook",
        buildingSetbackBias: "anchor_offset_from_road_facing_edge"
      }),
      buildingPolicy: Object.freeze({
        defaultSetbackMeters: 2.5,
        orientationPolicy: "deterministic_orientation_hint",
        anchorPolicy: "footprint_centroid_with_setback"
      }),
      status: "approved"
    }),
    Object.freeze({
      distributionRuleId: "DIST_RULE_BUILDING_GENERIC_RECIPE_001",
      recipeId: "BUILDING_GENERIC_RECIPE_001",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      densityThresholds: Object.freeze({
        mediumArea: 180,
        largeArea: 420
      }),
      vegetationPolicy: null,
      roadRelationshipPolicy: Object.freeze({
        vegetationExclusionBias: "future_road_exclusion_hook",
        buildingSetbackBias: "anchor_offset_from_road_facing_edge"
      }),
      buildingPolicy: Object.freeze({
        defaultSetbackMeters: 2,
        orientationPolicy: "deterministic_orientation_hint",
        anchorPolicy: "footprint_centroid_with_setback"
      }),
      status: "approved"
    })
  ]);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }
  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function sanitizeString(value) {
  return value == null ? null : String(value);
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === Object.prototype
  );
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ charCode, 2654435761);
    h2 = Math.imul(h2 ^ charCode, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function hashFraction(seed) {
  const slice = hashString(seed).slice(0, 13);
  const numerator = Number.parseInt(slice, 16);
  const denominator = 0x1fffffffffffff;
  return denominator === 0 ? 0 : numerator / denominator;
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    distributionVersion: state.distributionVersion,
    registeredDistributionRuleCount: state.registeredDistributionRuleCount,
    distributionRuleId: state.distributionRuleId,
    densityTier: state.densityTier,
    generatedPlacementCount: state.generatedPlacementCount,
    rejectedPlacementCount: state.rejectedPlacementCount,
    rejectionReasons: deepFreeze([...state.rejectionReasons]),
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const distributionRuleId = sanitizeString(rule.distributionRuleId);
  const recipeId = sanitizeString(rule.recipeId);
  const status = sanitizeString(rule.status);
  if (!distributionRuleId) {
    throw Object.assign(new Error("MISSING_DISTRIBUTION_RULE_ID"), {
      reasonCode: "MISSING_DISTRIBUTION_RULE_ID"
    });
  }
  if (!recipeId) {
    throw Object.assign(new Error("MISSING_RECIPE_ID"), {
      reasonCode: "MISSING_RECIPE_ID"
    });
  }
  if (!Array.isArray(rule.supportedFeatureClasses) || rule.supportedFeatureClasses.length === 0) {
    throw Object.assign(new Error("MISSING_SUPPORTED_FEATURE_CLASSES"), {
      reasonCode: "MISSING_SUPPORTED_FEATURE_CLASSES"
    });
  }
  return deepFreeze({
    distributionRuleId,
    recipeId,
    supportedFeatureClasses: deepFreeze(
      rule.supportedFeatureClasses.map((value) => String(value))
    ),
    densityThresholds: deepFreeze({ ...rule.densityThresholds }),
    vegetationPolicy: rule.vegetationPolicy
      ? deepFreeze({ ...rule.vegetationPolicy })
      : null,
    roadRelationshipPolicy: rule.roadRelationshipPolicy
      ? deepFreeze({ ...rule.roadRelationshipPolicy })
      : null,
    buildingPolicy: rule.buildingPolicy
      ? deepFreeze({ ...rule.buildingPolicy })
      : null,
    status
  });
}

function normalizeFeature(feature = {}) {
  const featureId = sanitizeString(feature.featureId);
  const featureClass = sanitizeString(feature.featureClass);
  const latitude = Number(feature.coordinate?.latitude ?? feature.latitude);
  const longitude = Number(feature.coordinate?.longitude ?? feature.longitude);
  if (!featureId) {
    throw Object.assign(new Error("MISSING_FEATURE_ID"), {
      reasonCode: "MISSING_FEATURE_ID"
    });
  }
  if (!featureClass) {
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw Object.assign(new Error("INVALID_FEATURE_COORDINATE"), {
      reasonCode: "INVALID_FEATURE_COORDINATE"
    });
  }
  return deepFreeze({
    featureId,
    featureClass,
    coordinate: deepFreeze({
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6))
    }),
    area:
      feature.area == null || !Number.isFinite(Number(feature.area))
        ? null
        : Number(feature.area),
    footprintScalars:
      feature.footprintScalars &&
      Number.isFinite(Number(feature.footprintScalars.width)) &&
      Number.isFinite(Number(feature.footprintScalars.height))
        ? deepFreeze({
            width: Number(feature.footprintScalars.width),
            height: Number(feature.footprintScalars.height)
          })
        : null,
    orientationHint:
      feature.orientationHint == null || !Number.isFinite(Number(feature.orientationHint))
        ? null
        : Number(feature.orientationHint),
    deterministicFeatureIdentity:
      sanitizeString(feature.deterministicFeatureIdentity) ?? featureId
  });
}

function resolveDensityTier(rule, feature, selectorSeed) {
  const area = Number(feature.area ?? 0);
  const mediumArea = Number(rule.densityThresholds?.mediumArea ?? 100);
  const largeArea = Number(rule.densityThresholds?.largeArea ?? 220);
  let baseTier = "small";
  if (area >= largeArea) {
    baseTier = "large";
  } else if (area >= mediumArea) {
    baseTier = "medium";
  }
  const fraction = hashFraction(
    `${selectorSeed}:${rule.recipeId}:${feature.deterministicFeatureIdentity}:densityTier`
  );
  if (baseTier === "medium" && fraction > 0.94 && area >= mediumArea * 0.9) {
    return "large";
  }
  if (baseTier === "medium" && fraction < 0.06 && area <= largeArea * 0.7) {
    return "small";
  }
  if (baseTier === "small" && fraction > 0.97 && area >= mediumArea * 0.78) {
    return "medium";
  }
  if (baseTier === "large" && fraction < 0.03 && area <= largeArea * 1.08) {
    return "medium";
  }
  return baseTier;
}

function featureRadiusMeters(feature) {
  const area = Number(feature.area ?? 64);
  const radius = Math.sqrt(Math.max(area, 9) / Math.PI);
  return Math.max(3.5, Number(radius.toFixed(3)));
}

function offsetCoordinate(coordinate, angleDegrees, distanceMeters) {
  const angleRadians = (Number(angleDegrees) * Math.PI) / 180;
  const eastMeters = Math.cos(angleRadians) * Number(distanceMeters);
  const northMeters = Math.sin(angleRadians) * Number(distanceMeters);
  const latitudeOffset = northMeters / 111320;
  const cosLatitude = Math.cos((coordinate.latitude * Math.PI) / 180);
  const longitudeOffset = eastMeters / (111320 * Math.max(0.2, Math.abs(cosLatitude)));
  return deepFreeze({
    latitude: Number((coordinate.latitude + latitudeOffset).toFixed(6)),
    longitude: Number((coordinate.longitude + longitudeOffset).toFixed(6))
  });
}

function buildVegetationPlacements(rule, feature, selectorSeed, assetCommands, densityTier) {
  const placements = [];
  const rejections = [];
  const featureRadius = featureRadiusMeters(feature);

  for (const assetCommand of assetCommands) {
    const isShrub = assetCommand.assetId === "SHRUB_COASTAL_LOW_001";
    const countsByTier = isShrub
      ? rule.vegetationPolicy.shrubCounts
      : rule.vegetationPolicy.treeCounts;
    const count = Number(countsByTier?.[densityTier] ?? 1);
    const radiusRange = isShrub
      ? rule.vegetationPolicy.shrubRadiusFractionRange
      : rule.vegetationPolicy.treeRadiusFractionRange;

    for (let candidateIndex = 0; candidateIndex < count; candidateIndex += 1) {
      const seedBase = `${selectorSeed}:${rule.distributionRuleId}:${feature.deterministicFeatureIdentity}:${assetCommand.assetId}:${candidateIndex}`;
      const angle = Number((hashFraction(`${seedBase}:angle`) * 360).toFixed(3));
      const radiusFraction =
        Number(radiusRange[0]) +
        (Number(radiusRange[1]) - Number(radiusRange[0])) *
          hashFraction(`${seedBase}:radius`);
      const coordinate = offsetCoordinate(
        feature.coordinate,
        angle,
        Number((featureRadius * radiusFraction).toFixed(3))
      );

      placements.push(
        deepFreeze({
          assetId: assetCommand.assetId,
          assetVersion: assetCommand.assetVersion,
          candidateIndex,
          coordinate,
          placementKind: isShrub ? "edge_cluster" : "interior_tree",
          deterministicPlacementSeed: seedBase
        })
      );
    }
  }

  return deepFreeze({
    placements,
    rejections
  });
}

function buildBuildingPlacements(rule, feature, selectorSeed, assetCommands) {
  const placements = [];
  const rejections = [];
  if (assetCommands.length === 0) {
    return deepFreeze({
      placements,
      rejections
    });
  }

  const footprintWidth = Number(feature.footprintScalars?.width ?? 24);
  const footprintHeight = Number(feature.footprintScalars?.height ?? 16);
  const baseOrientation =
    feature.orientationHint == null
      ? Math.round(hashFraction(`${selectorSeed}:${feature.deterministicFeatureIdentity}:orientation`) * 3) * 90
      : Number(feature.orientationHint);
  const shorterSide = Math.max(6, Math.min(footprintWidth, footprintHeight));
  const setback = Math.min(
    Number(rule.buildingPolicy?.defaultSetbackMeters ?? 2),
    Number((shorterSide * 0.12).toFixed(3))
  );
  const anchorCoordinate = offsetCoordinate(
    feature.coordinate,
    baseOrientation + 180,
    setback
  );

  for (const assetCommand of assetCommands) {
    placements.push(
      deepFreeze({
        assetId: assetCommand.assetId,
        assetVersion: assetCommand.assetVersion,
        candidateIndex: 0,
        coordinate: anchorCoordinate,
        placementKind: "building_anchor",
        deterministicPlacementSeed: `${selectorSeed}:${rule.distributionRuleId}:${feature.deterministicFeatureIdentity}:${assetCommand.assetId}:anchor`,
        orientationHintOverride: Number(baseOrientation)
      })
    );
  }

  return deepFreeze({
    placements,
    rejections
  });
}

export function createDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry({
  distributionVersion = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SPATIAL_DISTRIBUTION_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SPATIAL_DISTRIBUTION_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  const state = {
    distributionVersion: sanitizeString(distributionVersion),
    registeredDistributionRuleCount: validatedRules.length,
    distributionRuleId: null,
    densityTier: null,
    generatedPlacementCount: 0,
    rejectedPlacementCount: 0,
    rejectionReasons: [],
    lastFailureReason: null
  };
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry: true,
    __rules: validatedRules,
    __state: state
  });
}

function requireRegistry(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry ||
    !Array.isArray(registry.__rules) ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_SPATIAL_DISTRIBUTION_RULE_REGISTRY_UNAVAILABLE"),
      { reasonCode: "ATLAS_POPULATION_SPATIAL_DISTRIBUTION_RULE_REGISTRY_UNAVAILABLE" }
    );
  }
  return registry;
}

export function resolveDeveloperOnlyAtlasPopulationSpatialDistribution(
  registry,
  { matchedRecipeId, feature, selectorSeed, assetCommands = [] } = {}
) {
  requireRegistry(registry);
  const state = registry.__state;
  const normalizedFeature = normalizeFeature(feature);
  const normalizedRecipeId = sanitizeString(matchedRecipeId);
  const normalizedSelectorSeed = sanitizeString(selectorSeed);

  if (!normalizedRecipeId) {
    state.lastFailureReason = "MISSING_MATCHED_RECIPE_ID";
    throw Object.assign(new Error("MISSING_MATCHED_RECIPE_ID"), {
      reasonCode: "MISSING_MATCHED_RECIPE_ID"
    });
  }
  if (!normalizedSelectorSeed) {
    state.lastFailureReason = "MISSING_SELECTOR_SEED";
    throw Object.assign(new Error("MISSING_SELECTOR_SEED"), {
      reasonCode: "MISSING_SELECTOR_SEED"
    });
  }

  const rule = registry.__rules.find(
    (entry) =>
      entry.recipeId === normalizedRecipeId &&
      entry.supportedFeatureClasses.includes(normalizedFeature.featureClass)
  );

  if (!rule) {
    state.distributionRuleId = null;
    state.densityTier = null;
    state.generatedPlacementCount = 0;
    state.rejectedPlacementCount = 1;
    state.rejectionReasons = ["UNSUPPORTED_DISTRIBUTION_RULE"];
    state.lastFailureReason = "UNSUPPORTED_DISTRIBUTION_RULE";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      matchedRecipeId: normalizedRecipeId,
      matchedFeatureClass: normalizedFeature.featureClass,
      distributionRuleId: null,
      densityTier: null,
      generatedPlacementCount: 0,
      rejectedPlacementCount: 1,
      rejectionReasons: deepFreeze(["UNSUPPORTED_DISTRIBUTION_RULE"]),
      placements: deepFreeze([]),
      lastFailureReason: "UNSUPPORTED_DISTRIBUTION_RULE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const densityTier = resolveDensityTier(rule, normalizedFeature, normalizedSelectorSeed);
  const buildResult =
    rule.vegetationPolicy != null
      ? buildVegetationPlacements(
          rule,
          normalizedFeature,
          normalizedSelectorSeed,
          assetCommands,
          densityTier
        )
      : buildBuildingPlacements(
          rule,
          normalizedFeature,
          normalizedSelectorSeed,
          assetCommands
        );

  state.distributionRuleId = rule.distributionRuleId;
  state.densityTier = densityTier;
  state.generatedPlacementCount = buildResult.placements.length;
  state.rejectedPlacementCount = buildResult.rejections.length;
  state.rejectionReasons = buildResult.rejections.map((entry) => entry.reasonCode);
  state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    matchedRecipeId: normalizedRecipeId,
    matchedFeatureClass: normalizedFeature.featureClass,
    distributionRuleId: rule.distributionRuleId,
    densityTier,
    generatedPlacementCount: buildResult.placements.length,
    rejectedPlacementCount: buildResult.rejections.length,
    rejectionReasons: deepFreeze(
      buildResult.rejections.map((entry) => entry.reasonCode)
    ),
    placements: deepFreeze(buildResult.placements),
    lastFailureReason: null,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function getDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSpatialDistributionRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      distributionVersion: null,
      registeredDistributionRuleCount: 0,
      distributionRuleId: null,
      densityTier: null,
      generatedPlacementCount: 0,
      rejectedPlacementCount: 0,
      rejectionReasons: [],
      lastFailureReason:
        "ATLAS_POPULATION_SPATIAL_DISTRIBUTION_RULE_REGISTRY_UNAVAILABLE"
    });
  }

  return freezeStatus(registry.__state);
}
