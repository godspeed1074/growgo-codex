const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_VERSION =
  "atlas_population_local_economy_service_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      serviceRoleId: "SERVICE_ROLE_COASTAL_TOURISM_001",
      economyProfileId: "ECONOMY_PROFILE_COASTAL_TOURISM_001",
      marketCycleProfileId: "MARKET_CYCLE_PROFILE_SEASONAL_VISITOR_001",
      serviceImportance: "visitor_access_high",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park"]),
      supportedCommunityRoles: Object.freeze(["visitor_attraction"]),
      supportedCivicRoutineProfileIds: Object.freeze([
        "CIVIC_ROUTINE_PROFILE_COASTAL_LOOKOUT_001"
      ]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_COASTAL_DISCOVERY_TOURIST_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze(["coastal_village", "rural_town"]),
      economyReason:
        "coastal visitor places support tourism services, seasonal access, and repeat scenic market activity",
      status: "approved"
    }),
    Object.freeze({
      serviceRoleId: "SERVICE_ROLE_COMMUNITY_SERVICE_001",
      economyProfileId: "ECONOMY_PROFILE_SUBURBAN_SERVICES_001",
      marketCycleProfileId: "MARKET_CYCLE_PROFILE_WEEKLY_LOCAL_001",
      serviceImportance: "community_importance_high",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground", "park"]),
      supportedCommunityRoles: Object.freeze([
        "local_hub",
        "neighbourhood_gathering_point"
      ]),
      supportedCivicRoutineProfileIds: Object.freeze([
        "CIVIC_ROUTINE_PROFILE_COMMUNITY_CENTRE_001",
        "CIVIC_ROUTINE_PROFILE_SPORTS_GROUND_001"
      ]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_COMMUNITY_ANCHOR_SOCIAL_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "suburban_community",
        "rural_town",
        "coastal_village"
      ]),
      economyReason:
        "community anchors sustain local services, recurring weekly cycles, and neighbourhood access value",
      status: "approved"
    }),
    Object.freeze({
      serviceRoleId: "SERVICE_ROLE_MARKET_HERITAGE_001",
      economyProfileId: "ECONOMY_PROFILE_URBAN_COMMERCE_001",
      marketCycleProfileId: "MARKET_CYCLE_PROFILE_EVENT_BASED_001",
      serviceImportance: "visitor_and_local_balanced",
      supportedFeatureClasses: Object.freeze(["building_footprint", "civic_site"]),
      supportedCommunityRoles: Object.freeze(["visitor_attraction"]),
      supportedCivicRoutineProfileIds: Object.freeze([
        "CIVIC_ROUTINE_PROFILE_HERITAGE_SQUARE_001"
      ]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_HERITAGE_EVENT_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "heritage_town",
        "urban_district",
        "suburban_community"
      ]),
      economyReason:
        "heritage squares support event-based markets, tourism commerce, and civic service concentration",
      status: "approved"
    }),
    Object.freeze({
      serviceRoleId: "SERVICE_ROLE_LOCAL_SHOP_QUIET_001",
      economyProfileId: "ECONOMY_PROFILE_RURAL_LOCAL_ECONOMY_001",
      marketCycleProfileId: "MARKET_CYCLE_PROFILE_WEEKLY_LOW_INTENSITY_001",
      serviceImportance: "residential_access_high",
      supportedFeatureClasses: Object.freeze(["building_footprint", "coastal_green"]),
      supportedCommunityRoles: Object.freeze(["local_hub"]),
      supportedCivicRoutineProfileIds: Object.freeze([
        "CIVIC_ROUTINE_PROFILE_QUIET_RETURN_SITE_001"
      ]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_QUIET_MEMORY_RETURN_001"
      ]),
      supportedSettlementIdentityIds: Object.freeze([
        "suburban_community",
        "coastal_village",
        "rural_town"
      ]),
      economyReason:
        "quiet return-use places support low-intensity local shops, regular service access, and remembered neighbourhood value",
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
    localEconomyServiceVersion: state.localEconomyServiceVersion,
    registeredLocalEconomyServiceRuleCount:
      state.registeredLocalEconomyServiceRuleCount,
    serviceRoleId: state.serviceRoleId,
    economyProfileId: state.economyProfileId,
    marketCycleProfileId: state.marketCycleProfileId,
    serviceImportance: state.serviceImportance,
    economyReason: state.economyReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const serviceRoleId = sanitizeString(rule.serviceRoleId);
  const economyProfileId = sanitizeString(rule.economyProfileId);
  const marketCycleProfileId = sanitizeString(rule.marketCycleProfileId);
  const serviceImportance = sanitizeString(rule.serviceImportance);
  const economyReason = sanitizeString(rule.economyReason);
  if (!serviceRoleId) {
    throw Object.assign(new Error("MISSING_SERVICE_ROLE_ID"), {
      reasonCode: "MISSING_SERVICE_ROLE_ID"
    });
  }
  if (!economyProfileId) {
    throw Object.assign(new Error("MISSING_ECONOMY_PROFILE_ID"), {
      reasonCode: "MISSING_ECONOMY_PROFILE_ID"
    });
  }
  if (!marketCycleProfileId) {
    throw Object.assign(new Error("MISSING_MARKET_CYCLE_PROFILE_ID"), {
      reasonCode: "MISSING_MARKET_CYCLE_PROFILE_ID"
    });
  }
  if (!serviceImportance) {
    throw Object.assign(new Error("MISSING_SERVICE_IMPORTANCE"), {
      reasonCode: "MISSING_SERVICE_IMPORTANCE"
    });
  }
  if (!economyReason) {
    throw Object.assign(new Error("MISSING_ECONOMY_REASON"), {
      reasonCode: "MISSING_ECONOMY_REASON"
    });
  }
  return deepFreeze({
    serviceRoleId,
    economyProfileId,
    marketCycleProfileId,
    serviceImportance,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedCommunityRoles: deepFreeze((rule.supportedCommunityRoles ?? []).map(String)),
    supportedCivicRoutineProfileIds: deepFreeze(
      (rule.supportedCivicRoutineProfileIds ?? []).map(String)
    ),
    supportedActivityProfileIds: deepFreeze(
      (rule.supportedActivityProfileIds ?? []).map(String)
    ),
    supportedSettlementIdentityIds: deepFreeze(
      (rule.supportedSettlementIdentityIds ?? []).map(String)
    ),
    economyReason,
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    localEconomyServiceVersion: version,
    registeredLocalEconomyServiceRuleCount: rules.length,
    serviceRoleId: null,
    economyProfileId: null,
    marketCycleProfileId: null,
    serviceImportance: null,
    economyReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  communityRole,
  civicRoutineProfileId,
  activityProfileId,
  settlementIdentityId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedCommunityRoles.includes(communityRole) &&
        rule.supportedCivicRoutineProfileIds.includes(civicRoutineProfileId) &&
        rule.supportedActivityProfileIds.includes(activityProfileId) &&
        rule.supportedSettlementIdentityIds.includes(settlementIdentityId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      localEconomyServiceVersion: null,
      registeredLocalEconomyServiceRuleCount: 0,
      serviceRoleId: null,
      economyProfileId: null,
      marketCycleProfileId: null,
      serviceImportance: null,
      economyReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationLocalEconomyServiceHooks(
  registry,
  {
    featureClass,
    communityRole,
    civicRoutineProfileId,
    activityProfileId,
    settlementIdentityId
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationLocalEconomyServiceHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_LOCAL_ECONOMY_SERVICE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedCommunityRole = sanitizeString(communityRole);
  const normalizedCivicRoutineProfileId = sanitizeString(civicRoutineProfileId);
  const normalizedActivityProfileId = sanitizeString(activityProfileId);
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
    normalizedCommunityRole,
    normalizedCivicRoutineProfileId,
    normalizedActivityProfileId,
    normalizedSettlementIdentityId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_LOCAL_ECONOMY_SERVICE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      serviceRoleId: null,
      economyProfileId: null,
      marketCycleProfileId: null,
      serviceImportance: null,
      economyReason: "UNSUPPORTED_LOCAL_ECONOMY_SERVICE_CONTEXT",
      reasonCode: "UNSUPPORTED_LOCAL_ECONOMY_SERVICE_CONTEXT"
    });
  }

  registry.__state.serviceRoleId = rule.serviceRoleId;
  registry.__state.economyProfileId = rule.economyProfileId;
  registry.__state.marketCycleProfileId = rule.marketCycleProfileId;
  registry.__state.serviceImportance = rule.serviceImportance;
  registry.__state.economyReason = rule.economyReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    serviceRoleId: rule.serviceRoleId,
    economyProfileId: rule.economyProfileId,
    marketCycleProfileId: rule.marketCycleProfileId,
    serviceImportance: rule.serviceImportance,
    economyReason: rule.economyReason
  });
}
