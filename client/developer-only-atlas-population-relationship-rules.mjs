const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_RELATIONSHIP_RULE_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_RELATIONSHIP_RULE_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_RELATIONSHIP_RULE_VERSION =
  "atlas_population_relationship_rule_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_RELATIONSHIP_RULES =
  Object.freeze([
    Object.freeze({
      relationshipRuleId: "REL_RULE_PARK_PUBLIC_GREEN_RECIPE_001",
      recipeId: "PARK_PUBLIC_GREEN_RECIPE_001",
      supportedFeatureClasses: Object.freeze(["park"]),
      roadExclusionMeters: Object.freeze({
        TREE_EUCALYPTUS_001: 7,
        SHRUB_COASTAL_LOW_001: 2.5
      }),
      roadsideVergeBias: false,
      boundaryMode: "park_edge_planting",
      status: "approved"
    }),
    Object.freeze({
      relationshipRuleId: "REL_RULE_COASTAL_GREEN_RECIPE_001",
      recipeId: "COASTAL_GREEN_RECIPE_001",
      supportedFeatureClasses: Object.freeze([
        "vegetation_area",
        "coastal_green",
        "roadside_green",
        "reserve"
      ]),
      roadExclusionMeters: Object.freeze({
        TREE_BOTTLEBRUSH_001: 5,
        SHRUB_COASTAL_LOW_001: 1.75
      }),
      roadsideVergeBias: true,
      boundaryMode: "coastal_transition",
      status: "approved"
    }),
    Object.freeze({
      relationshipRuleId: "REL_RULE_BUILDING_CIVIC_RECIPE_001",
      recipeId: "BUILDING_CIVIC_RECIPE_001",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground"]),
      buildingSetbackMeters: 2.5,
      boundaryMode: "road_facing_frontage",
      status: "approved"
    }),
    Object.freeze({
      relationshipRuleId: "REL_RULE_BUILDING_GENERIC_RECIPE_001",
      recipeId: "BUILDING_GENERIC_RECIPE_001",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      buildingSetbackMeters: 2,
      boundaryMode: "road_facing_frontage",
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

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    relationshipRuleVersion: state.relationshipRuleVersion,
    registeredRelationshipRuleCount: state.registeredRelationshipRuleCount,
    relationshipRuleId: state.relationshipRuleId,
    nearestFeatureId: state.nearestFeatureId,
    nearestRoadId: state.nearestRoadId,
    boundaryDistance: state.boundaryDistance,
    orientationDecision: state.orientationDecision,
    placementReason: state.placementReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
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

function distanceMeters(a, b) {
  const dx = Number(a.longitude) - Number(b.longitude);
  const dy = Number(a.latitude) - Number(b.latitude);
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}

function normalizeCoordinate(value, reasonCode = "INVALID_COORDINATE") {
  const latitude = Number(value?.latitude ?? value?.lat);
  const longitude = Number(value?.longitude ?? value?.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return deepFreeze({
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
  });
}

function normalizeFeature(feature = {}) {
  const featureId = sanitizeString(feature.featureId);
  const featureClass = sanitizeString(feature.featureClass);
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
  return deepFreeze({
    featureId,
    featureClass,
    coordinate: normalizeCoordinate(
      feature.coordinate ?? feature.centroid,
      "INVALID_FEATURE_COORDINATE"
    ),
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

function normalizePlacement(placement = {}) {
  const assetId = sanitizeString(placement.assetId);
  if (!assetId) {
    throw Object.assign(new Error("MISSING_ASSET_ID"), {
      reasonCode: "MISSING_ASSET_ID"
    });
  }
  return deepFreeze({
    assetId,
    assetVersion: sanitizeString(placement.assetVersion),
    candidateIndex: Number(placement.candidateIndex ?? 0),
    coordinate: normalizeCoordinate(placement.coordinate, "INVALID_PLACEMENT_COORDINATE"),
    placementKind: sanitizeString(placement.placementKind) ?? "unknown",
    deterministicPlacementSeed:
      sanitizeString(placement.deterministicPlacementSeed) ?? assetId,
    orientationHintOverride:
      placement.orientationHintOverride == null ||
      !Number.isFinite(Number(placement.orientationHintOverride))
        ? null
        : Number(placement.orientationHintOverride)
  });
}

function normalizeRoadWay(road = {}) {
  const id = sanitizeString(road.id);
  if (!id) {
    throw Object.assign(new Error("MISSING_ROAD_ID"), {
      reasonCode: "MISSING_ROAD_ID"
    });
  }
  const coords = Array.isArray(road.coords)
    ? road.coords.map((pair) =>
        Array.isArray(pair) && pair.length >= 2
          ? deepFreeze({
              latitude: Number(Number(pair[0]).toFixed(6)),
              longitude: Number(Number(pair[1]).toFixed(6))
            })
          : normalizeCoordinate(pair, "INVALID_ROAD_COORDINATE")
      )
    : [];
  return deepFreeze({
    id,
    highway: sanitizeString(road.highway),
    coords: deepFreeze(coords)
  });
}

function normalizeAdjacentFeature(feature = {}) {
  if (!isPlainObject(feature)) {
    throw Object.assign(new Error("INVALID_ADJACENT_FEATURE"), {
      reasonCode: "INVALID_ADJACENT_FEATURE"
    });
  }
  return normalizeFeature(feature);
}

function normalizeRelationshipContext(context = {}) {
  if (!context || typeof context !== "object") {
    return deepFreeze({
      roadWays: [],
      adjacentFeatures: []
    });
  }
  return deepFreeze({
    roadWays: Array.isArray(context.roadWays)
      ? context.roadWays.map(normalizeRoadWay)
      : [],
    adjacentFeatures: Array.isArray(context.adjacentFeatures)
      ? context.adjacentFeatures.map(normalizeAdjacentFeature)
      : []
  });
}

function validateRule(rule = {}) {
  const relationshipRuleId = sanitizeString(rule.relationshipRuleId);
  const recipeId = sanitizeString(rule.recipeId);
  if (!relationshipRuleId) {
    throw Object.assign(new Error("MISSING_RELATIONSHIP_RULE_ID"), {
      reasonCode: "MISSING_RELATIONSHIP_RULE_ID"
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
    relationshipRuleId,
    recipeId,
    supportedFeatureClasses: deepFreeze(rule.supportedFeatureClasses.map(String)),
    roadExclusionMeters: rule.roadExclusionMeters
      ? deepFreeze({ ...rule.roadExclusionMeters })
      : null,
    roadsideVergeBias: rule.roadsideVergeBias === true,
    buildingSetbackMeters:
      rule.buildingSetbackMeters == null
        ? null
        : Number(rule.buildingSetbackMeters),
    boundaryMode: sanitizeString(rule.boundaryMode),
    status: sanitizeString(rule.status)
  });
}

function featureRadiusMeters(feature) {
  const area = Number(feature.area ?? 64);
  return Math.max(3.5, Number(Math.sqrt(Math.max(area, 9) / Math.PI).toFixed(3)));
}

function offsetCoordinate(coordinate, angleDegrees, distanceMetersValue) {
  const radians = (Number(angleDegrees) * Math.PI) / 180;
  const eastMeters = Math.cos(radians) * Number(distanceMetersValue);
  const northMeters = Math.sin(radians) * Number(distanceMetersValue);
  const latitudeOffset = northMeters / 111320;
  const cosLatitude = Math.cos((coordinate.latitude * Math.PI) / 180);
  const longitudeOffset = eastMeters / (111320 * Math.max(0.2, Math.abs(cosLatitude)));
  return deepFreeze({
    latitude: Number((coordinate.latitude + latitudeOffset).toFixed(6)),
    longitude: Number((coordinate.longitude + longitudeOffset).toFixed(6))
  });
}

function nearestRoadDecision(point, roadWays) {
  let best = null;
  for (const road of roadWays) {
    for (const coord of road.coords) {
      const measured = distanceMeters(point, coord);
      if (!best || measured < best.distanceMeters) {
        best = {
          roadId: road.id,
          roadCoordinate: coord,
          distanceMeters: Number(measured.toFixed(3))
        };
      }
    }
  }
  return best;
}

function nearestAdjacentFeatureDecision(feature, adjacentFeatures) {
  let best = null;
  for (const adjacent of adjacentFeatures) {
    if (adjacent.featureId === feature.featureId) {
      continue;
    }
    const measured = distanceMeters(feature.coordinate, adjacent.coordinate);
    if (!best || measured < best.distanceMeters) {
      best = {
        featureId: adjacent.featureId,
        featureClass: adjacent.featureClass,
        distanceMeters: Number(measured.toFixed(3))
      };
    }
  }
  return best;
}

function cardinalize(angleDegrees) {
  const values = [0, 90, 180, 270];
  const normalized = ((Number(angleDegrees) % 360) + 360) % 360;
  let best = values[0];
  let bestDistance = Infinity;
  for (const value of values) {
    const delta = Math.min(
      Math.abs(normalized - value),
      360 - Math.abs(normalized - value)
    );
    if (delta < bestDistance) {
      best = value;
      bestDistance = delta;
    }
  }
  return best;
}

function angleBetween(from, to) {
  const dx = Number(to.longitude) - Number(from.longitude);
  const dy = Number(to.latitude) - Number(from.latitude);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (angle + 360) % 360;
}

function createRejectedPlacement(placement, reasonCode, diagnostics) {
  return deepFreeze({
    ...placement,
    reasonCode,
    relationshipDiagnostics: diagnostics
  });
}

export function createDeveloperOnlyAtlasPopulationRelationshipRuleRegistry({
  relationshipRuleVersion = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_RELATIONSHIP_RULE_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_RELATIONSHIP_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  const state = {
    relationshipRuleVersion: sanitizeString(relationshipRuleVersion),
    registeredRelationshipRuleCount: validatedRules.length,
    relationshipRuleId: null,
    nearestFeatureId: null,
    nearestRoadId: null,
    boundaryDistance: null,
    orientationDecision: null,
    placementReason: null,
    lastFailureReason: null
  };
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationRelationshipRuleRegistry: true,
    __rules: validatedRules,
    __state: state
  });
}

function requireRegistry(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationRelationshipRuleRegistry ||
    !Array.isArray(registry.__rules) ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_RELATIONSHIP_RULE_REGISTRY_UNAVAILABLE"),
      { reasonCode: "ATLAS_POPULATION_RELATIONSHIP_RULE_REGISTRY_UNAVAILABLE" }
    );
  }
  return registry;
}

export function resolveDeveloperOnlyAtlasPopulationRelationshipPlacements(
  registry,
  { matchedRecipeId, feature, selectorSeed, placements = [], relationshipContext } = {}
) {
  requireRegistry(registry);
  const state = registry.__state;
  const normalizedRecipeId = sanitizeString(matchedRecipeId);
  const normalizedFeature = normalizeFeature(feature);
  const normalizedSelectorSeed = sanitizeString(selectorSeed);
  const normalizedPlacements = placements.map(normalizePlacement);
  const normalizedContext = normalizeRelationshipContext(relationshipContext);

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
    state.lastFailureReason = "UNSUPPORTED_RELATIONSHIP_RULE";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      relationshipRuleId: null,
      placements: deepFreeze(normalizedPlacements),
      rejectedPlacements: deepFreeze([]),
      featureDiagnostics: deepFreeze({
        relationshipRuleId: null,
        nearestFeatureId: null,
        nearestRoadId: null,
        boundaryDistance: null,
        orientationDecision: null,
        placementReason: "UNSUPPORTED_RELATIONSHIP_RULE"
      }),
      lastFailureReason: "UNSUPPORTED_RELATIONSHIP_RULE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const nearestRoad = nearestRoadDecision(
    normalizedFeature.coordinate,
    normalizedContext.roadWays
  );
  const nearestFeature = nearestAdjacentFeatureDecision(
    normalizedFeature,
    normalizedContext.adjacentFeatures
  );

  const adjustedPlacements = [];
  const rejectedPlacements = [];
  const featureRadius = featureRadiusMeters(normalizedFeature);

  for (const placement of normalizedPlacements) {
    let coordinate = placement.coordinate;
    let orientationDecision = placement.orientationHintOverride;
    let placementReason = "feature_internal_distribution";
    let boundaryDistance = Number(
      Math.max(0, featureRadius - distanceMeters(coordinate, normalizedFeature.coordinate)).toFixed(3)
    );

    if (rule.buildingSetbackMeters != null && nearestRoad) {
      const facingAngle = cardinalize(
        angleBetween(normalizedFeature.coordinate, nearestRoad.roadCoordinate)
      );
      orientationDecision = facingAngle;
      coordinate = offsetCoordinate(
        normalizedFeature.coordinate,
        facingAngle + 180,
        Number(rule.buildingSetbackMeters)
      );
      boundaryDistance = Number(rule.buildingSetbackMeters.toFixed(3));
      placementReason = "building_fronts_nearest_road";
    } else if (nearestRoad && rule.roadsideVergeBias === true) {
      const exclusionMeters = Number(rule.roadExclusionMeters?.[placement.assetId] ?? 0);
      if (nearestRoad.distanceMeters < exclusionMeters) {
        const diagnostics = deepFreeze({
          relationshipRuleId: rule.relationshipRuleId,
          nearestFeatureId: nearestFeature?.featureId ?? null,
          nearestRoadId: nearestRoad.roadId,
          boundaryDistance,
          orientationDecision: null,
          placementReason: "road_exclusion_zone"
        });
        rejectedPlacements.push(
          createRejectedPlacement(placement, "ROAD_EXCLUSION_ZONE_BLOCKED", diagnostics)
        );
        continue;
      }
      const roadAngle = angleBetween(nearestRoad.roadCoordinate, normalizedFeature.coordinate);
      const vergeOffset = Math.max(
        exclusionMeters,
        Number((featureRadius * 0.16).toFixed(3))
      );
      coordinate = offsetCoordinate(nearestRoad.roadCoordinate, roadAngle, vergeOffset);
      boundaryDistance = Number(
        Math.max(0, featureRadius - distanceMeters(coordinate, normalizedFeature.coordinate)).toFixed(3)
      );
      placementReason =
        normalizedFeature.featureClass === "roadside_green"
          ? "roadside_verge_preferred"
          : "coastal_transition_edge";
    } else if (
      placement.assetId === "SHRUB_COASTAL_LOW_001" &&
      (normalizedFeature.featureClass === "park" ||
        normalizedFeature.featureClass === "coastal_green" ||
        normalizedFeature.featureClass === "reserve")
    ) {
      placementReason =
        normalizedFeature.featureClass === "park"
          ? "park_edge_planting"
          : "coastal_transition_edge";
    } else if (
      nearestFeature &&
      (nearestFeature.featureClass === "park" || nearestFeature.featureClass === "reserve")
    ) {
      placementReason = "vegetation_near_open_area";
    }

    const diagnostics = deepFreeze({
      relationshipRuleId: rule.relationshipRuleId,
      nearestFeatureId: nearestFeature?.featureId ?? null,
      nearestRoadId: nearestRoad?.roadId ?? null,
      boundaryDistance,
      orientationDecision:
        orientationDecision == null ? null : Number(orientationDecision),
      placementReason
    });

    adjustedPlacements.push(
      deepFreeze({
        ...placement,
        coordinate,
        orientationHintOverride:
          orientationDecision == null ? null : Number(orientationDecision),
        relationshipDiagnostics: diagnostics
      })
    );
  }

  const featureDiagnostics =
    adjustedPlacements[0]?.relationshipDiagnostics ??
    rejectedPlacements[0]?.relationshipDiagnostics ??
    deepFreeze({
      relationshipRuleId: rule.relationshipRuleId,
      nearestFeatureId: nearestFeature?.featureId ?? null,
      nearestRoadId: nearestRoad?.roadId ?? null,
      boundaryDistance: null,
      orientationDecision: null,
      placementReason:
        nearestRoad != null ? "relationship_context_available" : "no_relationship_context"
    });

  state.relationshipRuleId = featureDiagnostics.relationshipRuleId;
  state.nearestFeatureId = featureDiagnostics.nearestFeatureId;
  state.nearestRoadId = featureDiagnostics.nearestRoadId;
  state.boundaryDistance = featureDiagnostics.boundaryDistance;
  state.orientationDecision = featureDiagnostics.orientationDecision;
  state.placementReason = featureDiagnostics.placementReason;
  state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    relationshipRuleId: rule.relationshipRuleId,
    placements: deepFreeze(adjustedPlacements),
    rejectedPlacements: deepFreeze(rejectedPlacements),
    featureDiagnostics,
    lastFailureReason: null,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function getDeveloperOnlyAtlasPopulationRelationshipRuleRegistryStatus(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationRelationshipRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      relationshipRuleVersion: null,
      registeredRelationshipRuleCount: 0,
      relationshipRuleId: null,
      nearestFeatureId: null,
      nearestRoadId: null,
      boundaryDistance: null,
      orientationDecision: null,
      placementReason: null,
      lastFailureReason: "ATLAS_POPULATION_RELATIONSHIP_RULE_REGISTRY_UNAVAILABLE"
    });
  }

  return freezeStatus(registry.__state);
}
