const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_VERSION =
  "atlas_population_place_liveness_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      occupancyProfileId: "OCCUPANCY_PROFILE_VISITOR_DAYTIME_001",
      timePresenceProfile: "daytime",
      livenessCategory: "visitor",
      peakActivityWindow: "seasonal_daytime_peak",
      presenceReason:
        "visitor access places feel most active in daytime seasonal windows with scenic and tourism presence",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park"]),
      supportedMobilityProfileIds: Object.freeze([
        "MOBILITY_PROFILE_TOURISM_WALKING_001"
      ]),
      supportedAccessPatternIds: Object.freeze(["ACCESS_PATTERN_VISITOR_001"]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_COASTAL_TOURISM_001"
      ]),
      supportedCommunityRoles: Object.freeze(["visitor_attraction"]),
      status: "approved"
    }),
    Object.freeze({
      occupancyProfileId: "OCCUPANCY_PROFILE_CIVIC_SOCIAL_001",
      timePresenceProfile: "morning_daytime_evening",
      livenessCategory: "civic",
      peakActivityWindow: "community_daily_peak",
      presenceReason:
        "community-serving places maintain moderate-to-busy civic presence across recurring daily use windows",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground", "park"]),
      supportedMobilityProfileIds: Object.freeze([
        "MOBILITY_PROFILE_COMMUNITY_MIXED_001"
      ]),
      supportedAccessPatternIds: Object.freeze(["ACCESS_PATTERN_CIVIC_001"]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_COMMUNITY_SERVICE_001"
      ]),
      supportedCommunityRoles: Object.freeze([
        "local_hub",
        "neighbourhood_gathering_point"
      ]),
      status: "approved"
    }),
    Object.freeze({
      occupancyProfileId: "OCCUPANCY_PROFILE_EVENT_PEAK_001",
      timePresenceProfile: "daytime_evening",
      livenessCategory: "commercial",
      peakActivityWindow: "event_market_peak",
      presenceReason:
        "market and heritage access places reach peak-event liveness during event-driven daytime and evening windows",
      supportedFeatureClasses: Object.freeze(["building_footprint", "civic_site"]),
      supportedMobilityProfileIds: Object.freeze([
        "MOBILITY_PROFILE_URBAN_EVENT_MIXED_001"
      ]),
      supportedAccessPatternIds: Object.freeze(["ACCESS_PATTERN_COMMERCIAL_001"]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_MARKET_HERITAGE_001"
      ]),
      supportedCommunityRoles: Object.freeze(["visitor_attraction"]),
      status: "approved"
    }),
    Object.freeze({
      occupancyProfileId: "OCCUPANCY_PROFILE_QUIET_LOCAL_001",
      timePresenceProfile: "morning_daytime",
      livenessCategory: "social",
      peakActivityWindow: "local_return_window",
      presenceReason:
        "quiet local access places feel lightly active during repeat local routines and return visits",
      supportedFeatureClasses: Object.freeze(["building_footprint", "coastal_green"]),
      supportedMobilityProfileIds: Object.freeze([
        "MOBILITY_PROFILE_LOCAL_DRIVING_001"
      ]),
      supportedAccessPatternIds: Object.freeze(["ACCESS_PATTERN_RESIDENTIAL_001"]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_LOCAL_SHOP_QUIET_001"
      ]),
      supportedCommunityRoles: Object.freeze(["local_hub"]),
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
    placeLivenessVersion: state.placeLivenessVersion,
    registeredPlaceLivenessRuleCount: state.registeredPlaceLivenessRuleCount,
    occupancyProfileId: state.occupancyProfileId,
    timePresenceProfile: state.timePresenceProfile,
    livenessCategory: state.livenessCategory,
    peakActivityWindow: state.peakActivityWindow,
    presenceReason: state.presenceReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const occupancyProfileId = sanitizeString(rule.occupancyProfileId);
  const timePresenceProfile = sanitizeString(rule.timePresenceProfile);
  const livenessCategory = sanitizeString(rule.livenessCategory);
  const peakActivityWindow = sanitizeString(rule.peakActivityWindow);
  const presenceReason = sanitizeString(rule.presenceReason);
  if (!occupancyProfileId) {
    throw Object.assign(new Error("MISSING_OCCUPANCY_PROFILE_ID"), {
      reasonCode: "MISSING_OCCUPANCY_PROFILE_ID"
    });
  }
  if (!timePresenceProfile) {
    throw Object.assign(new Error("MISSING_TIME_PRESENCE_PROFILE"), {
      reasonCode: "MISSING_TIME_PRESENCE_PROFILE"
    });
  }
  if (!livenessCategory) {
    throw Object.assign(new Error("MISSING_LIVENESS_CATEGORY"), {
      reasonCode: "MISSING_LIVENESS_CATEGORY"
    });
  }
  if (!peakActivityWindow) {
    throw Object.assign(new Error("MISSING_PEAK_ACTIVITY_WINDOW"), {
      reasonCode: "MISSING_PEAK_ACTIVITY_WINDOW"
    });
  }
  if (!presenceReason) {
    throw Object.assign(new Error("MISSING_PRESENCE_REASON"), {
      reasonCode: "MISSING_PRESENCE_REASON"
    });
  }
  return deepFreeze({
    occupancyProfileId,
    timePresenceProfile,
    livenessCategory,
    peakActivityWindow,
    presenceReason,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedMobilityProfileIds: deepFreeze(
      (rule.supportedMobilityProfileIds ?? []).map(String)
    ),
    supportedAccessPatternIds: deepFreeze(
      (rule.supportedAccessPatternIds ?? []).map(String)
    ),
    supportedServiceRoleIds: deepFreeze(
      (rule.supportedServiceRoleIds ?? []).map(String)
    ),
    supportedCommunityRoles: deepFreeze(
      (rule.supportedCommunityRoles ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    placeLivenessVersion: version,
    registeredPlaceLivenessRuleCount: rules.length,
    occupancyProfileId: null,
    timePresenceProfile: null,
    livenessCategory: null,
    peakActivityWindow: null,
    presenceReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  mobilityProfileId,
  accessPatternId,
  serviceRoleId,
  communityRole
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedMobilityProfileIds.includes(mobilityProfileId) &&
        rule.supportedAccessPatternIds.includes(accessPatternId) &&
        rule.supportedServiceRoleIds.includes(serviceRoleId) &&
        rule.supportedCommunityRoles.includes(communityRole)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      placeLivenessVersion: null,
      registeredPlaceLivenessRuleCount: 0,
      occupancyProfileId: null,
      timePresenceProfile: null,
      livenessCategory: null,
      peakActivityWindow: null,
      presenceReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationPlaceLivenessHooks(
  registry,
  {
    featureClass,
    mobilityProfileId,
    accessPatternId,
    serviceRoleId,
    communityRole
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationPlaceLivenessHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_PLACE_LIVENESS_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedMobilityProfileId = sanitizeString(mobilityProfileId);
  const normalizedAccessPatternId = sanitizeString(accessPatternId);
  const normalizedServiceRoleId = sanitizeString(serviceRoleId);
  const normalizedCommunityRole = sanitizeString(communityRole);

  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeatureClass,
    normalizedMobilityProfileId,
    normalizedAccessPatternId,
    normalizedServiceRoleId,
    normalizedCommunityRole
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_PLACE_LIVENESS_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      occupancyProfileId: null,
      timePresenceProfile: null,
      livenessCategory: null,
      peakActivityWindow: null,
      presenceReason: "UNSUPPORTED_PLACE_LIVENESS_CONTEXT",
      reasonCode: "UNSUPPORTED_PLACE_LIVENESS_CONTEXT"
    });
  }

  registry.__state.occupancyProfileId = rule.occupancyProfileId;
  registry.__state.timePresenceProfile = rule.timePresenceProfile;
  registry.__state.livenessCategory = rule.livenessCategory;
  registry.__state.peakActivityWindow = rule.peakActivityWindow;
  registry.__state.presenceReason = rule.presenceReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    occupancyProfileId: rule.occupancyProfileId,
    timePresenceProfile: rule.timePresenceProfile,
    livenessCategory: rule.livenessCategory,
    peakActivityWindow: rule.peakActivityWindow,
    presenceReason: rule.presenceReason
  });
}
