const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_VERSION =
  "atlas_population_place_memory_narrative_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      placeMemoryId: "PLACE_MEMORY_HISTORIC_LANDMARK_001",
      storyCategory: "historic",
      localNarrativeProfileId: "LOCAL_NARRATIVE_HERITAGE_PATH_001",
      supportedFeatureClasses: Object.freeze(["building_footprint", "civic_site"]),
      supportedStoryRouteTypes: Object.freeze([
        "heritage_landmark_route",
        "achievement_discovery_chain"
      ]),
      supportedSettlementIdentities: Object.freeze([
        "coastal_village",
        "heritage_town",
        "urban_district",
        "suburban_community"
      ]),
      discoveryImportance: "high",
      storyReason: "historic_landmark_memory_with_route_and_local_identity",
      status: "approved"
    }),
    Object.freeze({
      placeMemoryId: "PLACE_MEMORY_NATURAL_WONDER_001",
      storyCategory: "natural_wonder",
      localNarrativeProfileId: "LOCAL_NARRATIVE_SCENIC_COAST_001",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park", "reserve"]),
      supportedStoryRouteTypes: Object.freeze([
        "scenic_coastal_route",
        "park_trail_route"
      ]),
      supportedSettlementIdentities: Object.freeze([
        "coastal_village",
        "rural_town"
      ]),
      discoveryImportance: "high",
      storyReason: "natural_wonder_memory_with_scenic_destination_chain",
      status: "approved"
    }),
    Object.freeze({
      placeMemoryId: "PLACE_MEMORY_COMMUNITY_SITE_001",
      storyCategory: "community",
      localNarrativeProfileId: "LOCAL_NARRATIVE_COMMUNITY_ANCHOR_001",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground", "park"]),
      supportedStoryRouteTypes: Object.freeze([
        "park_trail_route",
        "heritage_landmark_route"
      ]),
      supportedSettlementIdentities: Object.freeze([
        "suburban_community",
        "rural_town",
        "coastal_village"
      ]),
      discoveryImportance: "medium",
      storyReason: "community_anchor_memory_with_local_gathering_identity",
      status: "approved"
    }),
    Object.freeze({
      placeMemoryId: "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
      storyCategory: "hidden_discovery",
      localNarrativeProfileId: "LOCAL_NARRATIVE_DISCOVERY_CHAIN_001",
      supportedFeatureClasses: Object.freeze(["building_footprint", "coastal_green", "park"]),
      supportedStoryRouteTypes: Object.freeze(["achievement_discovery_chain"]),
      supportedSettlementIdentities: Object.freeze([
        "coastal_village",
        "suburban_community",
        "urban_district"
      ]),
      discoveryImportance: "medium_high",
      storyReason: "hidden_discovery_memory_with_achievement_chain_hook",
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

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    placeMemoryVersion: state.placeMemoryVersion,
    registeredPlaceMemoryRuleCount: state.registeredPlaceMemoryRuleCount,
    placeMemoryId: state.placeMemoryId,
    storyCategory: state.storyCategory,
    localNarrativeProfileId: state.localNarrativeProfileId,
    discoveryImportance: state.discoveryImportance,
    storyReason: state.storyReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const placeMemoryId = sanitizeString(rule.placeMemoryId);
  const storyCategory = sanitizeString(rule.storyCategory);
  const localNarrativeProfileId = sanitizeString(rule.localNarrativeProfileId);
  const discoveryImportance = sanitizeString(rule.discoveryImportance);
  const storyReason = sanitizeString(rule.storyReason);
  if (!placeMemoryId) {
    throw Object.assign(new Error("MISSING_PLACE_MEMORY_ID"), {
      reasonCode: "MISSING_PLACE_MEMORY_ID"
    });
  }
  if (!storyCategory) {
    throw Object.assign(new Error("MISSING_STORY_CATEGORY"), {
      reasonCode: "MISSING_STORY_CATEGORY"
    });
  }
  if (!localNarrativeProfileId) {
    throw Object.assign(new Error("MISSING_LOCAL_NARRATIVE_PROFILE_ID"), {
      reasonCode: "MISSING_LOCAL_NARRATIVE_PROFILE_ID"
    });
  }
  if (!discoveryImportance) {
    throw Object.assign(new Error("MISSING_DISCOVERY_IMPORTANCE"), {
      reasonCode: "MISSING_DISCOVERY_IMPORTANCE"
    });
  }
  if (!storyReason) {
    throw Object.assign(new Error("MISSING_STORY_REASON"), {
      reasonCode: "MISSING_STORY_REASON"
    });
  }
  return deepFreeze({
    placeMemoryId,
    storyCategory,
    localNarrativeProfileId,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedStoryRouteTypes: deepFreeze((rule.supportedStoryRouteTypes ?? []).map(String)),
    supportedSettlementIdentities: deepFreeze(
      (rule.supportedSettlementIdentities ?? []).map(String)
    ),
    discoveryImportance,
    storyReason,
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    placeMemoryVersion: version,
    registeredPlaceMemoryRuleCount: rules.length,
    placeMemoryId: null,
    storyCategory: null,
    localNarrativeProfileId: null,
    discoveryImportance: null,
    storyReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  explorationRouteType,
  settlementIdentityId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedStoryRouteTypes.includes(explorationRouteType) &&
        rule.supportedSettlementIdentities.includes(settlementIdentityId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      placeMemoryVersion: null,
      registeredPlaceMemoryRuleCount: 0,
      placeMemoryId: null,
      storyCategory: null,
      localNarrativeProfileId: null,
      discoveryImportance: null,
      storyReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooks(
  registry,
  {
    featureClass,
    explorationRouteType,
    settlementIdentityId
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationPlaceMemoryNarrativeHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_PLACE_MEMORY_NARRATIVE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedExplorationRouteType = sanitizeString(explorationRouteType);
  const normalizedSettlementIdentityId = sanitizeString(settlementIdentityId);

  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeatureClass,
    normalizedExplorationRouteType,
    normalizedSettlementIdentityId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_PLACE_MEMORY_NARRATIVE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      placeMemoryId: null,
      storyCategory: null,
      localNarrativeProfileId: null,
      discoveryImportance: null,
      storyReason: "UNSUPPORTED_PLACE_MEMORY_NARRATIVE_CONTEXT",
      reasonCode: "UNSUPPORTED_PLACE_MEMORY_NARRATIVE_CONTEXT"
    });
  }

  registry.__state.placeMemoryId = rule.placeMemoryId;
  registry.__state.storyCategory = rule.storyCategory;
  registry.__state.localNarrativeProfileId = rule.localNarrativeProfileId;
  registry.__state.discoveryImportance = rule.discoveryImportance;
  registry.__state.storyReason = rule.storyReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    placeMemoryId: rule.placeMemoryId,
    storyCategory: rule.storyCategory,
    localNarrativeProfileId: rule.localNarrativeProfileId,
    discoveryImportance: rule.discoveryImportance,
    storyReason: rule.storyReason
  });
}
