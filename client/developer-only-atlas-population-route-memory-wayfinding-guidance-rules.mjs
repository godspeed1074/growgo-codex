const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_VERSION =
  "atlas_population_route_memory_wayfinding_guidance_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_RULES =
  Object.freeze([
    Object.freeze({
      routeMemoryId: "ROUTE_MEMORY_SCENIC_COASTAL_001",
      wayfindingProfileId: "WAYFINDING_PROFILE_SCENIC_COASTAL_001",
      explorationRouteType: "scenic_coastal_route",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park", "reserve"]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation"]),
      supportedBiomeProfiles: Object.freeze(["coastal", "wetland"]),
      supportedDestinationProfiles: Object.freeze([
        "DESTINATION_FRAME_SCENIC_REVEAL_001",
        "DESTINATION_FRAME_BEACH_GATHERING_001"
      ]),
      guidanceReason: "coastal_scenic_reveal_and_exploration_memory",
      routePriority: "high_scenic",
      status: "approved"
    }),
    Object.freeze({
      routeMemoryId: "ROUTE_MEMORY_HERITAGE_LANDMARK_001",
      wayfindingProfileId: "WAYFINDING_PROFILE_HERITAGE_LANDMARK_001",
      explorationRouteType: "heritage_landmark_route",
      supportedFeatureClasses: Object.freeze(["building_footprint", "civic_site"]),
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use", "commercial"]),
      supportedBiomeProfiles: Object.freeze(["suburban", "urban"]),
      supportedDestinationProfiles: Object.freeze([
        "DESTINATION_FRAME_CIVIC_LANDMARK_001",
        "DESTINATION_FRAME_SPECIAL_SITE_001"
      ]),
      guidanceReason: "heritage_sequence_and_landmark_wayfinding_memory",
      routePriority: "high_heritage",
      status: "approved"
    }),
    Object.freeze({
      routeMemoryId: "ROUTE_MEMORY_PARK_TRAIL_001",
      wayfindingProfileId: "WAYFINDING_PROFILE_PARK_TRAIL_001",
      explorationRouteType: "park_trail_route",
      supportedFeatureClasses: Object.freeze(["park", "sports_ground", "reserve"]),
      supportedDistrictTypes: Object.freeze(["recreation", "civic"]),
      supportedBiomeProfiles: Object.freeze(["suburban", "rural", "coastal"]),
      supportedDestinationProfiles: Object.freeze([
        "DESTINATION_FRAME_SCENIC_REVEAL_001",
        "DESTINATION_FRAME_CIVIC_LANDMARK_001"
      ]),
      guidanceReason: "park_trail_guidance_and_discovery_chain",
      routePriority: "medium_trail",
      status: "approved"
    }),
    Object.freeze({
      routeMemoryId: "ROUTE_MEMORY_DISCOVERY_CHAIN_001",
      wayfindingProfileId: "WAYFINDING_PROFILE_DISCOVERY_CHAIN_001",
      explorationRouteType: "achievement_discovery_chain",
      supportedFeatureClasses: Object.freeze(["building_footprint", "park", "coastal_green"]),
      supportedDistrictTypes: Object.freeze(["mixed_use", "coastal_natural", "commercial"]),
      supportedBiomeProfiles: Object.freeze(["coastal", "suburban", "urban"]),
      supportedDestinationProfiles: Object.freeze([
        "DESTINATION_FRAME_SPECIAL_SITE_001",
        "DESTINATION_FRAME_BEACH_GATHERING_001"
      ]),
      guidanceReason: "discovery_chain_with_wayfinding_and_photo_hooks",
      routePriority: "medium_discovery",
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
    routeGuidanceVersion: state.routeGuidanceVersion,
    registeredRouteGuidanceRuleCount: state.registeredRouteGuidanceRuleCount,
    routeMemoryId: state.routeMemoryId,
    wayfindingProfileId: state.wayfindingProfileId,
    explorationRouteType: state.explorationRouteType,
    guidanceReason: state.guidanceReason,
    routePriority: state.routePriority,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const routeMemoryId = sanitizeString(rule.routeMemoryId);
  const wayfindingProfileId = sanitizeString(rule.wayfindingProfileId);
  const explorationRouteType = sanitizeString(rule.explorationRouteType);
  const guidanceReason = sanitizeString(rule.guidanceReason);
  const routePriority = sanitizeString(rule.routePriority);
  if (!routeMemoryId) {
    throw Object.assign(new Error("MISSING_ROUTE_MEMORY_ID"), {
      reasonCode: "MISSING_ROUTE_MEMORY_ID"
    });
  }
  if (!wayfindingProfileId) {
    throw Object.assign(new Error("MISSING_WAYFINDING_PROFILE_ID"), {
      reasonCode: "MISSING_WAYFINDING_PROFILE_ID"
    });
  }
  if (!explorationRouteType) {
    throw Object.assign(new Error("MISSING_EXPLORATION_ROUTE_TYPE"), {
      reasonCode: "MISSING_EXPLORATION_ROUTE_TYPE"
    });
  }
  if (!guidanceReason) {
    throw Object.assign(new Error("MISSING_GUIDANCE_REASON"), {
      reasonCode: "MISSING_GUIDANCE_REASON"
    });
  }
  if (!routePriority) {
    throw Object.assign(new Error("MISSING_ROUTE_PRIORITY"), {
      reasonCode: "MISSING_ROUTE_PRIORITY"
    });
  }
  return deepFreeze({
    routeMemoryId,
    wayfindingProfileId,
    explorationRouteType,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedDistrictTypes: deepFreeze((rule.supportedDistrictTypes ?? []).map(String)),
    supportedBiomeProfiles: deepFreeze((rule.supportedBiomeProfiles ?? []).map(String)),
    supportedDestinationProfiles: deepFreeze(
      (rule.supportedDestinationProfiles ?? []).map(String)
    ),
    guidanceReason,
    routePriority,
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    routeGuidanceVersion: version,
    registeredRouteGuidanceRuleCount: rules.length,
    routeMemoryId: null,
    wayfindingProfileId: null,
    explorationRouteType: null,
    guidanceReason: null,
    routePriority: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  districtType,
  biomeProfileId,
  destinationFrameProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedDistrictTypes.includes(districtType) &&
        (rule.supportedBiomeProfiles.length === 0 ||
          rule.supportedBiomeProfiles.includes(biomeProfileId)) &&
        (rule.supportedDestinationProfiles.length === 0 ||
          rule.supportedDestinationProfiles.includes(destinationFrameProfileId))
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      routeGuidanceVersion: null,
      registeredRouteGuidanceRuleCount: 0,
      routeMemoryId: null,
      wayfindingProfileId: null,
      explorationRouteType: null,
      guidanceReason: null,
      routePriority: null,
      lastFailureReason:
        "ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidance(
  registry,
  {
    featureClass,
    districtType,
    biomeProfileId,
    destinationFrameProfileId
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationRouteMemoryWayfindingGuidanceRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_ROUTE_MEMORY_WAYFINDING_GUIDANCE_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedBiomeProfileId = sanitizeString(biomeProfileId);
  const normalizedDestinationFrameProfileId = sanitizeString(
    destinationFrameProfileId
  );

  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeatureClass,
    normalizedDistrictType,
    normalizedBiomeProfileId,
    normalizedDestinationFrameProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_ROUTE_MEMORY_WAYFINDING_GUIDANCE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      routeMemoryId: null,
      wayfindingProfileId: null,
      explorationRouteType: null,
      guidanceReason:
        "UNSUPPORTED_ROUTE_MEMORY_WAYFINDING_GUIDANCE_CONTEXT",
      routePriority: null,
      reasonCode:
        "UNSUPPORTED_ROUTE_MEMORY_WAYFINDING_GUIDANCE_CONTEXT"
    });
  }

  registry.__state.routeMemoryId = rule.routeMemoryId;
  registry.__state.wayfindingProfileId = rule.wayfindingProfileId;
  registry.__state.explorationRouteType = rule.explorationRouteType;
  registry.__state.guidanceReason = rule.guidanceReason;
  registry.__state.routePriority = rule.routePriority;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    routeMemoryId: rule.routeMemoryId,
    wayfindingProfileId: rule.wayfindingProfileId,
    explorationRouteType: rule.explorationRouteType,
    guidanceReason: rule.guidanceReason,
    routePriority: rule.routePriority
  });
}
