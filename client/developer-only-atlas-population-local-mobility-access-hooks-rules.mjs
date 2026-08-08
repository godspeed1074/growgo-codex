const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_VERSION =
  "atlas_population_local_mobility_access_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      mobilityProfileId: "MOBILITY_PROFILE_TOURISM_WALKING_001",
      accessPatternId: "ACCESS_PATTERN_VISITOR_001",
      flowPriority: "daytime_seasonal_flow",
      movementReason:
        "visitor-oriented places prioritize walking access, scenic paths, and seasonal approach flow",
      accessibilityProfile: "path_priority_high",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park"]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_COASTAL_TOURISM_001"
      ]),
      supportedCommunityRoles: Object.freeze(["visitor_attraction"]),
      supportedCivicRoutineProfileIds: Object.freeze([
        "CIVIC_ROUTINE_PROFILE_COASTAL_LOOKOUT_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      mobilityProfileId: "MOBILITY_PROFILE_COMMUNITY_MIXED_001",
      accessPatternId: "ACCESS_PATTERN_CIVIC_001",
      flowPriority: "morning_daytime_evening_cycle",
      movementReason:
        "community anchors prioritize mixed local access, repeat entry routes, and shared daily movement flow",
      accessibilityProfile: "entrance_access_priority",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground", "park"]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_COMMUNITY_SERVICE_001"
      ]),
      supportedCommunityRoles: Object.freeze([
        "local_hub",
        "neighbourhood_gathering_point"
      ]),
      supportedCivicRoutineProfileIds: Object.freeze([
        "CIVIC_ROUTINE_PROFILE_COMMUNITY_CENTRE_001",
        "CIVIC_ROUTINE_PROFILE_SPORTS_GROUND_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      mobilityProfileId: "MOBILITY_PROFILE_URBAN_EVENT_MIXED_001",
      accessPatternId: "ACCESS_PATTERN_COMMERCIAL_001",
      flowPriority: "event_daytime_evening_cycle",
      movementReason:
        "market and heritage places prioritize mixed pedestrian and service access around event-based daily flows",
      accessibilityProfile: "connection_priority_high",
      supportedFeatureClasses: Object.freeze(["building_footprint", "civic_site"]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_MARKET_HERITAGE_001"
      ]),
      supportedCommunityRoles: Object.freeze(["visitor_attraction"]),
      supportedCivicRoutineProfileIds: Object.freeze([
        "CIVIC_ROUTINE_PROFILE_HERITAGE_SQUARE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      mobilityProfileId: "MOBILITY_PROFILE_LOCAL_DRIVING_001",
      accessPatternId: "ACCESS_PATTERN_RESIDENTIAL_001",
      flowPriority: "morning_daytime_local_cycle",
      movementReason:
        "quiet local service places prioritize residential access, regular return routes, and lower-intensity daily flow",
      accessibilityProfile: "connection_priority_medium",
      supportedFeatureClasses: Object.freeze(["building_footprint", "coastal_green"]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_LOCAL_SHOP_QUIET_001"
      ]),
      supportedCommunityRoles: Object.freeze(["local_hub"]),
      supportedCivicRoutineProfileIds: Object.freeze([
        "CIVIC_ROUTINE_PROFILE_QUIET_RETURN_SITE_001"
      ]),
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
    localMobilityAccessVersion: state.localMobilityAccessVersion,
    registeredLocalMobilityAccessRuleCount:
      state.registeredLocalMobilityAccessRuleCount,
    mobilityProfileId: state.mobilityProfileId,
    accessPatternId: state.accessPatternId,
    flowPriority: state.flowPriority,
    movementReason: state.movementReason,
    accessibilityProfile: state.accessibilityProfile,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const mobilityProfileId = sanitizeString(rule.mobilityProfileId);
  const accessPatternId = sanitizeString(rule.accessPatternId);
  const flowPriority = sanitizeString(rule.flowPriority);
  const movementReason = sanitizeString(rule.movementReason);
  const accessibilityProfile = sanitizeString(rule.accessibilityProfile);
  if (!mobilityProfileId) {
    throw Object.assign(new Error("MISSING_MOBILITY_PROFILE_ID"), {
      reasonCode: "MISSING_MOBILITY_PROFILE_ID"
    });
  }
  if (!accessPatternId) {
    throw Object.assign(new Error("MISSING_ACCESS_PATTERN_ID"), {
      reasonCode: "MISSING_ACCESS_PATTERN_ID"
    });
  }
  if (!flowPriority) {
    throw Object.assign(new Error("MISSING_FLOW_PRIORITY"), {
      reasonCode: "MISSING_FLOW_PRIORITY"
    });
  }
  if (!movementReason) {
    throw Object.assign(new Error("MISSING_MOVEMENT_REASON"), {
      reasonCode: "MISSING_MOVEMENT_REASON"
    });
  }
  if (!accessibilityProfile) {
    throw Object.assign(new Error("MISSING_ACCESSIBILITY_PROFILE"), {
      reasonCode: "MISSING_ACCESSIBILITY_PROFILE"
    });
  }
  return deepFreeze({
    mobilityProfileId,
    accessPatternId,
    flowPriority,
    movementReason,
    accessibilityProfile,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedServiceRoleIds: deepFreeze((rule.supportedServiceRoleIds ?? []).map(String)),
    supportedCommunityRoles: deepFreeze((rule.supportedCommunityRoles ?? []).map(String)),
    supportedCivicRoutineProfileIds: deepFreeze(
      (rule.supportedCivicRoutineProfileIds ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    localMobilityAccessVersion: version,
    registeredLocalMobilityAccessRuleCount: rules.length,
    mobilityProfileId: null,
    accessPatternId: null,
    flowPriority: null,
    movementReason: null,
    accessibilityProfile: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  serviceRoleId,
  communityRole,
  civicRoutineProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedServiceRoleIds.includes(serviceRoleId) &&
        rule.supportedCommunityRoles.includes(communityRole) &&
        rule.supportedCivicRoutineProfileIds.includes(civicRoutineProfileId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      localMobilityAccessVersion: null,
      registeredLocalMobilityAccessRuleCount: 0,
      mobilityProfileId: null,
      accessPatternId: null,
      flowPriority: null,
      movementReason: null,
      accessibilityProfile: null,
      lastFailureReason:
        "ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationLocalMobilityAccessHooks(
  registry,
  { featureClass, serviceRoleId, communityRole, civicRoutineProfileId } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationLocalMobilityAccessHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_LOCAL_MOBILITY_ACCESS_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedServiceRoleId = sanitizeString(serviceRoleId);
  const normalizedCommunityRole = sanitizeString(communityRole);
  const normalizedCivicRoutineProfileId = sanitizeString(civicRoutineProfileId);

  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeatureClass,
    normalizedServiceRoleId,
    normalizedCommunityRole,
    normalizedCivicRoutineProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_LOCAL_MOBILITY_ACCESS_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      mobilityProfileId: null,
      accessPatternId: null,
      flowPriority: null,
      movementReason: "UNSUPPORTED_LOCAL_MOBILITY_ACCESS_CONTEXT",
      accessibilityProfile: null,
      reasonCode: "UNSUPPORTED_LOCAL_MOBILITY_ACCESS_CONTEXT"
    });
  }

  registry.__state.mobilityProfileId = rule.mobilityProfileId;
  registry.__state.accessPatternId = rule.accessPatternId;
  registry.__state.flowPriority = rule.flowPriority;
  registry.__state.movementReason = rule.movementReason;
  registry.__state.accessibilityProfile = rule.accessibilityProfile;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    mobilityProfileId: rule.mobilityProfileId,
    accessPatternId: rule.accessPatternId,
    flowPriority: rule.flowPriority,
    movementReason: rule.movementReason,
    accessibilityProfile: rule.accessibilityProfile
  });
}
