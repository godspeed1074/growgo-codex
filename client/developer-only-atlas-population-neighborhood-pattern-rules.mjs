const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_VERSION =
  "atlas_population_neighborhood_pattern_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_RULES =
  Object.freeze([
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_SUBURBAN_STREET_001",
      patternCategory: "residential",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedWorldFillCategories: Object.freeze(["residential"]),
      supportedSourcePrefixes: Object.freeze(["building:", "residential:"]),
      generatedContextIds: Object.freeze([
        "RESIDENTIAL_HOUSING_RHYTHM_CONTEXT_001",
        "RESIDENTIAL_SETBACK_CONSISTENCY_CONTEXT_001"
      ]),
      patternDecisionReason: "suburban_street_rhythm",
      status: "approved"
    }),
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_CUL_DE_SAC_001",
      patternCategory: "residential",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedWorldFillCategories: Object.freeze(["residential"]),
      supportedSourcePrefixes: Object.freeze(["building:", "residential:"]),
      generatedContextIds: Object.freeze([
        "CUL_DE_SAC_HOUSING_ARC_CONTEXT_001",
        "CUL_DE_SAC_SHARED_GREEN_EDGE_CONTEXT_001"
      ]),
      patternDecisionReason: "cul_de_sac_cluster",
      status: "approved"
    }),
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_TOWNHOUSE_ROW_001",
      patternCategory: "residential",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedWorldFillCategories: Object.freeze(["residential"]),
      supportedSourcePrefixes: Object.freeze(["building:terrace", "building:row"]),
      generatedContextIds: Object.freeze([
        "TOWNHOUSE_ROW_ALIGNMENT_CONTEXT_001",
        "TOWNHOUSE_ROW_SHARED_SETBACK_CONTEXT_001"
      ]),
      patternDecisionReason: "townhouse_row_alignment",
      status: "approved"
    }),
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_COASTAL_RESIDENTIAL_001",
      patternCategory: "residential",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedWorldFillCategories: Object.freeze(["residential"]),
      supportedSourcePrefixes: Object.freeze(["building:", "residential:"]),
      generatedContextIds: Object.freeze([
        "COASTAL_RESIDENTIAL_BUFFER_CONTEXT_001",
        "COASTAL_RESIDENTIAL_GARDEN_CONTEXT_001"
      ]),
      patternDecisionReason: "coastal_residential_variation",
      status: "approved"
    }),
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_CAFE_STRIP_001",
      patternCategory: "commercial",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedWorldFillCategories: Object.freeze(["commercial"]),
      supportedSourcePrefixes: Object.freeze(["shop:", "retail:", "cafe:", "amenity:cafe"]),
      generatedContextIds: Object.freeze([
        "COMMERCIAL_FRONTAGE_CONTINUITY_CONTEXT_001",
        "COMMERCIAL_PEDESTRIAN_SIDE_CONTEXT_001"
      ]),
      patternDecisionReason: "cafe_strip_frontage",
      status: "approved"
    }),
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_LOCAL_SHOPPING_CLUSTER_001",
      patternCategory: "commercial",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedWorldFillCategories: Object.freeze(["commercial"]),
      supportedSourcePrefixes: Object.freeze(["shop:", "retail:"]),
      generatedContextIds: Object.freeze([
        "LOCAL_SHOPPING_CLUSTER_FRONTAGE_CONTEXT_001",
        "LOCAL_SHOPPING_CLUSTER_OPEN_SPACE_CONTEXT_001"
      ]),
      patternDecisionReason: "local_shopping_cluster",
      status: "approved"
    }),
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_SPORTS_COMMUNITY_SITE_001",
      patternCategory: "civic",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground"]),
      supportedWorldFillCategories: Object.freeze(["civic"]),
      supportedSourcePrefixes: Object.freeze(["amenity:", "leisure:"]),
      generatedContextIds: Object.freeze([
        "SPORTS_COMMUNITY_ACCESS_CONTEXT_001",
        "SPORTS_COMMUNITY_OPEN_AREA_CONTEXT_001"
      ]),
      patternDecisionReason: "sports_community_site",
      status: "approved"
    }),
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_GREEN_CORRIDOR_001",
      patternCategory: "green_corridor",
      supportedFeatureClasses: Object.freeze(["park", "reserve"]),
      supportedWorldFillCategories: Object.freeze(["park"]),
      supportedSourcePrefixes: Object.freeze(["leisure:park", "zone:park", "green:"]),
      generatedContextIds: Object.freeze([
        "GREEN_CORRIDOR_CONNECTION_CONTEXT_001",
        "GREEN_CORRIDOR_OPEN_SPACE_CONTEXT_001"
      ]),
      patternDecisionReason: "park_connection_corridor",
      status: "approved"
    }),
    Object.freeze({
      neighborhoodPatternId: "NEIGHBORHOOD_PATTERN_COASTAL_SETTLEMENT_001",
      patternCategory: "coastal",
      supportedFeatureClasses: Object.freeze([
        "coastal_green",
        "reserve",
        "roadside_green",
        "vegetation_area"
      ]),
      supportedWorldFillCategories: Object.freeze(["coastal"]),
      supportedSourcePrefixes: Object.freeze(["green:", "leisure:", "natural:"]),
      generatedContextIds: Object.freeze([
        "COASTAL_SETTLEMENT_BUFFER_CONTEXT_001",
        "COASTAL_SETTLEMENT_TRANSITION_CONTEXT_001"
      ]),
      patternDecisionReason: "coastal_settlement_transition",
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
    deterministicFeatureIdentity:
      sanitizeString(feature.deterministicFeatureIdentity) ?? featureId,
    sourceClassification: sanitizeString(feature.sourceClassification)
  });
}

function validateRule(rule = {}) {
  const neighborhoodPatternId = sanitizeString(rule.neighborhoodPatternId);
  const patternCategory = sanitizeString(rule.patternCategory);
  if (!neighborhoodPatternId) {
    throw Object.assign(new Error("MISSING_NEIGHBORHOOD_PATTERN_ID"), {
      reasonCode: "MISSING_NEIGHBORHOOD_PATTERN_ID"
    });
  }
  if (!patternCategory) {
    throw Object.assign(new Error("MISSING_PATTERN_CATEGORY"), {
      reasonCode: "MISSING_PATTERN_CATEGORY"
    });
  }
  return deepFreeze({
    neighborhoodPatternId,
    patternCategory,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedWorldFillCategories: deepFreeze(
      (rule.supportedWorldFillCategories ?? []).map(String)
    ),
    supportedSourcePrefixes: deepFreeze(
      (rule.supportedSourcePrefixes ?? []).map(String)
    ),
    generatedContextIds: deepFreeze((rule.generatedContextIds ?? []).map(String)),
    patternDecisionReason: sanitizeString(rule.patternDecisionReason),
    status: sanitizeString(rule.status)
  });
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    neighborhoodPatternVersion: state.neighborhoodPatternVersion,
    registeredNeighborhoodPatternCount: state.registeredNeighborhoodPatternCount,
    neighborhoodPatternId: state.neighborhoodPatternId,
    patternCategory: state.patternCategory,
    patternSeed: state.patternSeed,
    generatedContextCount: state.generatedContextCount,
    patternDecisionReason: state.patternDecisionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function matchesFeature(rule, feature, worldFillCategory) {
  if (!rule.supportedFeatureClasses.includes(feature.featureClass)) {
    return false;
  }
  if (!rule.supportedWorldFillCategories.includes(worldFillCategory)) {
    return false;
  }
  if (!feature.sourceClassification) {
    return true;
  }
  if (rule.supportedSourcePrefixes.length === 0) {
    return true;
  }
  return rule.supportedSourcePrefixes.some((prefix) =>
    feature.sourceClassification.startsWith(prefix)
  );
}

function chooseResidentialRule(candidates, feature, selectorSeed) {
  const source = feature.sourceClassification ?? "";
  if (source.startsWith("building:terrace") || source.startsWith("building:row")) {
    return candidates.find((entry) =>
      entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_TOWNHOUSE_ROW_001"
    );
  }
  const coastalFraction = hashFraction(
    `${selectorSeed}:${feature.deterministicFeatureIdentity}:coastalResidential`
  );
  if (coastalFraction > 0.82) {
    return candidates.find((entry) =>
      entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_COASTAL_RESIDENTIAL_001"
    );
  }
  const culDeSacFraction = hashFraction(
    `${selectorSeed}:${feature.deterministicFeatureIdentity}:culdesac`
  );
  if (culDeSacFraction > 0.86) {
    return candidates.find((entry) =>
      entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_CUL_DE_SAC_001"
    );
  }
  return candidates.find((entry) =>
    entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_SUBURBAN_STREET_001"
  );
}

function chooseCommercialRule(candidates, feature) {
  const source = feature.sourceClassification ?? "";
  if (source.startsWith("cafe:") || source.startsWith("amenity:cafe")) {
    return candidates.find((entry) =>
      entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_CAFE_STRIP_001"
    );
  }
  return candidates.find((entry) =>
    entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_LOCAL_SHOPPING_CLUSTER_001"
  );
}

export function createDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry({
  neighborhoodPatternVersion =
    DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  const state = {
    neighborhoodPatternVersion: sanitizeString(neighborhoodPatternVersion),
    registeredNeighborhoodPatternCount: validatedRules.length,
    neighborhoodPatternId: null,
    patternCategory: null,
    patternSeed: null,
    generatedContextCount: 0,
    patternDecisionReason: null,
    lastFailureReason: null
  };
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry: true,
    __rules: validatedRules,
    __state: state
  });
}

function requireRegistry(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry ||
    !Array.isArray(registry.__rules) ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_RULE_REGISTRY_UNAVAILABLE"),
      { reasonCode: "ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_RULE_REGISTRY_UNAVAILABLE" }
    );
  }
  return registry;
}

export function resolveDeveloperOnlyAtlasPopulationNeighborhoodPattern(
  registry,
  {
    feature,
    selectorSeed,
    worldFillCategory,
    contextualWorldFillResolution
  } = {}
) {
  requireRegistry(registry);
  const state = registry.__state;
  const normalizedFeature = normalizeFeature(feature);
  const normalizedSelectorSeed = sanitizeString(selectorSeed);
  const normalizedWorldFillCategory = sanitizeString(worldFillCategory);

  if (!normalizedSelectorSeed) {
    state.lastFailureReason = "MISSING_SELECTOR_SEED";
    throw Object.assign(new Error("MISSING_SELECTOR_SEED"), {
      reasonCode: "MISSING_SELECTOR_SEED"
    });
  }

  const candidates = registry.__rules.filter((rule) =>
    matchesFeature(rule, normalizedFeature, normalizedWorldFillCategory)
  );

  let matchedRule = null;
  if (normalizedWorldFillCategory === "residential") {
    matchedRule = chooseResidentialRule(candidates, normalizedFeature, normalizedSelectorSeed);
  } else if (normalizedWorldFillCategory === "commercial") {
    matchedRule = chooseCommercialRule(candidates, normalizedFeature);
  } else if (normalizedWorldFillCategory === "civic") {
    matchedRule = candidates.find((entry) =>
      entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_SPORTS_COMMUNITY_SITE_001"
    );
  } else if (normalizedWorldFillCategory === "park") {
    matchedRule = candidates.find((entry) =>
      entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_GREEN_CORRIDOR_001"
    );
  } else if (normalizedWorldFillCategory === "coastal") {
    matchedRule = candidates.find((entry) =>
      entry.neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_COASTAL_SETTLEMENT_001"
    );
  }

  if (!matchedRule) {
    state.neighborhoodPatternId = null;
    state.patternCategory = normalizedWorldFillCategory;
    state.patternSeed = null;
    state.generatedContextCount = 0;
    state.patternDecisionReason = "NO_NEIGHBORHOOD_PATTERN_MATCH";
    state.lastFailureReason = null;
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      neighborhoodPatternId: null,
      patternCategory: normalizedWorldFillCategory,
      patternSeed: null,
      generatedContextCount: 0,
      patternDecisionReason: "NO_NEIGHBORHOOD_PATTERN_MATCH",
      generatedContextIds: deepFreeze([]),
      contextualWorldFillCategory: normalizedWorldFillCategory,
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const patternSeed = `PATTERN_${hashString(
    `${normalizedSelectorSeed}:${normalizedFeature.deterministicFeatureIdentity}:${matchedRule.neighborhoodPatternId}`
  )
    .slice(0, 16)
    .toUpperCase()}`;

  const generatedContextIds = deepFreeze([
    ...matchedRule.generatedContextIds,
    ...((contextualWorldFillResolution?.subRecipeIds ?? []).length > 0
      ? []
      : [])
  ]);

  state.neighborhoodPatternId = matchedRule.neighborhoodPatternId;
  state.patternCategory = matchedRule.patternCategory;
  state.patternSeed = patternSeed;
  state.generatedContextCount = generatedContextIds.length;
  state.patternDecisionReason = matchedRule.patternDecisionReason;
  state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    neighborhoodPatternId: matchedRule.neighborhoodPatternId,
    patternCategory: matchedRule.patternCategory,
    patternSeed,
    generatedContextCount: generatedContextIds.length,
    patternDecisionReason: matchedRule.patternDecisionReason,
    generatedContextIds,
    contextualWorldFillCategory: normalizedWorldFillCategory,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function getDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationNeighborhoodPatternRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      neighborhoodPatternVersion: null,
      registeredNeighborhoodPatternCount: 0,
      neighborhoodPatternId: null,
      patternCategory: null,
      patternSeed: null,
      generatedContextCount: 0,
      patternDecisionReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_NEIGHBORHOOD_PATTERN_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}
