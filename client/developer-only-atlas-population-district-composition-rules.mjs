const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_DISTRICT_COMPOSITION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_DISTRICT_COMPOSITION_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_DISTRICT_COMPOSITION_VERSION =
  "atlas_population_district_composition_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_DISTRICT_COMPOSITION_RULES =
  Object.freeze([
    Object.freeze({
      districtId: "DISTRICT_RESIDENTIAL_001",
      districtType: "residential",
      supportedWorldFillCategories: Object.freeze(["residential"]),
      supportedPatternCategories: Object.freeze(["residential"]),
      settlementPatternId: "SETTLEMENT_PATTERN_RESIDENTIAL_STREET_GRID_001",
      densityWeighting: "medium",
      greenSpaceRelationship: "residential_garden_transition",
      transitionBoundaries: Object.freeze(["residential_to_park"]),
      districtTransitionReason: "residential_settlement_continuity",
      status: "approved"
    }),
    Object.freeze({
      districtId: "DISTRICT_COMMERCIAL_001",
      districtType: "commercial",
      supportedWorldFillCategories: Object.freeze(["commercial"]),
      supportedPatternCategories: Object.freeze(["commercial"]),
      settlementPatternId: "SETTLEMENT_PATTERN_COMMERCIAL_FRONTAGE_001",
      densityWeighting: "high",
      greenSpaceRelationship: "limited_open_space_frontage",
      transitionBoundaries: Object.freeze(["residential_to_commercial"]),
      districtTransitionReason: "commercial_frontage_continuity",
      status: "approved"
    }),
    Object.freeze({
      districtId: "DISTRICT_CIVIC_001",
      districtType: "civic",
      supportedWorldFillCategories: Object.freeze(["civic"]),
      supportedPatternCategories: Object.freeze(["civic"]),
      settlementPatternId: "SETTLEMENT_PATTERN_CIVIC_ANCHOR_001",
      densityWeighting: "medium",
      greenSpaceRelationship: "civic_open_space_anchor",
      transitionBoundaries: Object.freeze(["civic_to_recreation"]),
      districtTransitionReason: "civic_anchor_with_open_access",
      status: "approved"
    }),
    Object.freeze({
      districtId: "DISTRICT_RECREATION_001",
      districtType: "recreation",
      supportedWorldFillCategories: Object.freeze(["park"]),
      supportedPatternCategories: Object.freeze(["green_corridor"]),
      settlementPatternId: "SETTLEMENT_PATTERN_RECREATION_GREEN_LINK_001",
      densityWeighting: "low",
      greenSpaceRelationship: "park_connection_open_space",
      transitionBoundaries: Object.freeze(["residential_to_park"]),
      districtTransitionReason: "green_corridor_recreation_transition",
      status: "approved"
    }),
    Object.freeze({
      districtId: "DISTRICT_COASTAL_NATURAL_001",
      districtType: "coastal_natural",
      supportedWorldFillCategories: Object.freeze(["coastal"]),
      supportedPatternCategories: Object.freeze(["coastal"]),
      settlementPatternId: "SETTLEMENT_PATTERN_COASTAL_BUFFER_001",
      densityWeighting: "low",
      greenSpaceRelationship: "coastal_buffer_preservation",
      transitionBoundaries: Object.freeze(["coastal_to_settlement_edge"]),
      districtTransitionReason: "coastal_transition_buffer",
      status: "approved"
    }),
    Object.freeze({
      districtId: "DISTRICT_MIXED_USE_001",
      districtType: "mixed_use",
      supportedWorldFillCategories: Object.freeze(["commercial", "residential"]),
      supportedPatternCategories: Object.freeze(["commercial", "residential"]),
      settlementPatternId: "SETTLEMENT_PATTERN_MIXED_USE_CLUSTER_001",
      densityWeighting: "medium_high",
      greenSpaceRelationship: "mixed_use_open_space_balance",
      transitionBoundaries: Object.freeze(["residential_to_commercial"]),
      districtTransitionReason: "mixed_use_transition_frontage",
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

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    districtCompositionVersion: state.districtCompositionVersion,
    registeredDistrictRuleCount: state.registeredDistrictRuleCount,
    districtId: state.districtId,
    districtType: state.districtType,
    settlementPatternId: state.settlementPatternId,
    districtTransitionReason: state.districtTransitionReason,
    compositionSeed: state.compositionSeed,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
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
    deterministicFeatureIdentity:
      sanitizeString(feature.deterministicFeatureIdentity) ?? featureId,
    sourceClassification: sanitizeString(feature.sourceClassification)
  });
}

function validateRule(rule = {}) {
  const districtId = sanitizeString(rule.districtId);
  const districtType = sanitizeString(rule.districtType);
  const settlementPatternId = sanitizeString(rule.settlementPatternId);
  if (!districtId) {
    throw Object.assign(new Error("MISSING_DISTRICT_ID"), {
      reasonCode: "MISSING_DISTRICT_ID"
    });
  }
  if (!districtType) {
    throw Object.assign(new Error("MISSING_DISTRICT_TYPE"), {
      reasonCode: "MISSING_DISTRICT_TYPE"
    });
  }
  if (!settlementPatternId) {
    throw Object.assign(new Error("MISSING_SETTLEMENT_PATTERN_ID"), {
      reasonCode: "MISSING_SETTLEMENT_PATTERN_ID"
    });
  }
  return deepFreeze({
    districtId,
    districtType,
    supportedWorldFillCategories: deepFreeze(
      (rule.supportedWorldFillCategories ?? []).map(String)
    ),
    supportedPatternCategories: deepFreeze(
      (rule.supportedPatternCategories ?? []).map(String)
    ),
    settlementPatternId,
    densityWeighting: sanitizeString(rule.densityWeighting),
    greenSpaceRelationship: sanitizeString(rule.greenSpaceRelationship),
    transitionBoundaries: deepFreeze((rule.transitionBoundaries ?? []).map(String)),
    districtTransitionReason: sanitizeString(rule.districtTransitionReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    districtCompositionVersion: version,
    registeredDistrictRuleCount: rules.length,
    districtId: null,
    districtType: null,
    settlementPatternId: null,
    districtTransitionReason: null,
    compositionSeed: null,
    lastFailureReason: null
  };
}

function selectResidentialDistrict(ruleById, neighborhoodPatternId) {
  if (
    neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_CAFE_STRIP_001" ||
    neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_LOCAL_SHOPPING_CLUSTER_001"
  ) {
    return ruleById.get("DISTRICT_MIXED_USE_001");
  }
  return ruleById.get("DISTRICT_RESIDENTIAL_001");
}

function resolveTransitionReason({
  districtRule,
  worldFillCategory,
  neighborhoodPatternId
}) {
  if (districtRule.districtId === "DISTRICT_MIXED_USE_001") {
    return "residential_to_commercial";
  }
  if (districtRule.districtId === "DISTRICT_RECREATION_001") {
    return "residential_to_park";
  }
  if (districtRule.districtId === "DISTRICT_COASTAL_NATURAL_001") {
    return "coastal_to_settlement_edge";
  }
  if (worldFillCategory === "commercial" &&
      neighborhoodPatternId === "NEIGHBORHOOD_PATTERN_CAFE_STRIP_001") {
    return "residential_to_commercial";
  }
  return districtRule.districtTransitionReason;
}

function chooseRule(registry, normalizedFeature, worldFillCategory, patternCategory, neighborhoodPatternId) {
  const sourceClassification = normalizedFeature.sourceClassification ?? "";
  if (
    worldFillCategory === "commercial" &&
    sourceClassification.startsWith("cafe:")
  ) {
    return registry.__ruleById.get("DISTRICT_MIXED_USE_001");
  }

  if (worldFillCategory === "residential") {
    return selectResidentialDistrict(registry.__ruleById, neighborhoodPatternId);
  }
  if (worldFillCategory === "commercial") {
    return registry.__ruleById.get("DISTRICT_COMMERCIAL_001");
  }
  if (worldFillCategory === "civic") {
    return registry.__ruleById.get("DISTRICT_CIVIC_001");
  }
  if (worldFillCategory === "park") {
    return registry.__ruleById.get("DISTRICT_RECREATION_001");
  }
  if (worldFillCategory === "coastal") {
    return registry.__ruleById.get("DISTRICT_COASTAL_NATURAL_001");
  }

  return registry.__rules.find(
    (rule) =>
      rule.supportedWorldFillCategories.includes(worldFillCategory) &&
      rule.supportedPatternCategories.includes(patternCategory)
  ) ?? null;
}

export function createDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_DISTRICT_COMPOSITION_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_DISTRICT_COMPOSITION_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  const state = createState(version, validatedRules);
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleById: new Map(validatedRules.map((rule) => [rule.districtId, rule])),
    __state: state
  });
}

export function getDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      districtCompositionVersion: null,
      registeredDistrictRuleCount: 0,
      districtId: null,
      districtType: null,
      settlementPatternId: null,
      districtTransitionReason: null,
      compositionSeed: null,
      lastFailureReason: "ATLAS_POPULATION_DISTRICT_COMPOSITION_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationDistrictComposition(
  registry,
  {
    feature,
    selectorSeed,
    worldFillCategory,
    neighborhoodPatternId,
    patternCategory
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationDistrictCompositionRuleRegistry
  ) {
    throw Object.assign(
      new Error("ATLAS_POPULATION_DISTRICT_COMPOSITION_RULE_REGISTRY_UNAVAILABLE"),
      {
        reasonCode:
          "ATLAS_POPULATION_DISTRICT_COMPOSITION_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeature = normalizeFeature(feature);
  const normalizedWorldFillCategory = sanitizeString(worldFillCategory);
  const normalizedPatternCategory = sanitizeString(patternCategory);
  const normalizedNeighborhoodPatternId = sanitizeString(neighborhoodPatternId);
  const normalizedSelectorSeed = sanitizeString(selectorSeed);

  if (!normalizedWorldFillCategory) {
    registry.__state.lastFailureReason = "MISSING_WORLD_FILL_CATEGORY";
    throw Object.assign(new Error("MISSING_WORLD_FILL_CATEGORY"), {
      reasonCode: "MISSING_WORLD_FILL_CATEGORY"
    });
  }
  if (!normalizedPatternCategory) {
    registry.__state.lastFailureReason = "MISSING_PATTERN_CATEGORY";
    throw Object.assign(new Error("MISSING_PATTERN_CATEGORY"), {
      reasonCode: "MISSING_PATTERN_CATEGORY"
    });
  }
  if (!normalizedNeighborhoodPatternId) {
    registry.__state.lastFailureReason = "MISSING_NEIGHBORHOOD_PATTERN_ID";
    throw Object.assign(new Error("MISSING_NEIGHBORHOOD_PATTERN_ID"), {
      reasonCode: "MISSING_NEIGHBORHOOD_PATTERN_ID"
    });
  }

  const districtRule = chooseRule(
    registry,
    normalizedFeature,
    normalizedWorldFillCategory,
    normalizedPatternCategory,
    normalizedNeighborhoodPatternId
  );

  if (!districtRule) {
    registry.__state.lastFailureReason = "UNSUPPORTED_DISTRICT_COMPOSITION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      districtId: null,
      districtType: null,
      settlementPatternId: null,
      districtTransitionReason: "UNSUPPORTED_DISTRICT_COMPOSITION_CONTEXT",
      compositionSeed: null,
      reasonCode: "UNSUPPORTED_DISTRICT_COMPOSITION_CONTEXT"
    });
  }

  const compositionSeed = hashString(
    [
      normalizedSelectorSeed ?? "DISTRICT_SELECTOR",
      normalizedFeature.deterministicFeatureIdentity,
      normalizedWorldFillCategory,
      normalizedNeighborhoodPatternId,
      districtRule.districtId
    ].join(":")
  ).slice(0, 16);

  const districtTransitionReason = resolveTransitionReason({
    districtRule,
    worldFillCategory: normalizedWorldFillCategory,
    neighborhoodPatternId: normalizedNeighborhoodPatternId
  });

  registry.__state.districtId = districtRule.districtId;
  registry.__state.districtType = districtRule.districtType;
  registry.__state.settlementPatternId = districtRule.settlementPatternId;
  registry.__state.districtTransitionReason = districtTransitionReason;
  registry.__state.compositionSeed = compositionSeed;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    districtId: districtRule.districtId,
    districtType: districtRule.districtType,
    settlementPatternId: districtRule.settlementPatternId,
    districtTransitionReason,
    compositionSeed,
    densityWeighting: districtRule.densityWeighting,
    greenSpaceRelationship: districtRule.greenSpaceRelationship,
    transitionBoundaries: districtRule.transitionBoundaries
  });
}
