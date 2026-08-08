const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_VERSION =
  "atlas_population_weekly_routine_recurrence_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      weeklyRoutineProfileId: "WEEKLY_ROUTINE_PROFILE_VISITOR_WEEKEND_001",
      recurrencePatternId: "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001",
      communityCadenceId: "COMMUNITY_CADENCE_SCENIC_VISITOR_001",
      eventFrequency: "seasonal_weekly",
      recurrenceReason:
        "visitor-oriented places recur through seasonal weekend presence, scenic routines, and repeat destination cadence",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park"]),
      supportedLivenessCategories: Object.freeze(["visitor"]),
      supportedOccupancyProfileIds: Object.freeze([
        "OCCUPANCY_PROFILE_VISITOR_DAYTIME_001"
      ]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_COASTAL_TOURISM_001"
      ]),
      supportedCommunityRoles: Object.freeze(["visitor_attraction"]),
      status: "approved"
    }),
    Object.freeze({
      weeklyRoutineProfileId: "WEEKLY_ROUTINE_PROFILE_COMMUNITY_WEEKLY_001",
      recurrencePatternId: "RECURRENCE_PATTERN_DAILY_WEEKLY_001",
      communityCadenceId: "COMMUNITY_CADENCE_LOCAL_GATHERING_001",
      eventFrequency: "weekly",
      recurrenceReason:
        "community-serving places recur through weekday and weekend local routines, repeat gatherings, and shared civic cadence",
      supportedFeatureClasses: Object.freeze(["civic_site", "sports_ground", "park"]),
      supportedLivenessCategories: Object.freeze(["civic"]),
      supportedOccupancyProfileIds: Object.freeze([
        "OCCUPANCY_PROFILE_CIVIC_SOCIAL_001"
      ]),
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
      weeklyRoutineProfileId: "WEEKLY_ROUTINE_PROFILE_MARKET_EVENT_001",
      recurrencePatternId: "RECURRENCE_PATTERN_EVENT_MONTHLY_001",
      communityCadenceId: "COMMUNITY_CADENCE_MARKET_TRADITION_001",
      eventFrequency: "monthly_event",
      recurrenceReason:
        "market and heritage places recur through event schedules, traditions, and festival-like community cadence",
      supportedFeatureClasses: Object.freeze(["building_footprint", "civic_site"]),
      supportedLivenessCategories: Object.freeze(["commercial"]),
      supportedOccupancyProfileIds: Object.freeze([
        "OCCUPANCY_PROFILE_EVENT_PEAK_001"
      ]),
      supportedServiceRoleIds: Object.freeze([
        "SERVICE_ROLE_MARKET_HERITAGE_001"
      ]),
      supportedCommunityRoles: Object.freeze(["visitor_attraction"]),
      status: "approved"
    }),
    Object.freeze({
      weeklyRoutineProfileId: "WEEKLY_ROUTINE_PROFILE_LOCAL_RETURN_001",
      recurrencePatternId: "RECURRENCE_PATTERN_DAILY_LOCAL_001",
      communityCadenceId: "COMMUNITY_CADENCE_QUIET_RETURN_001",
      eventFrequency: "daily",
      recurrenceReason:
        "quiet local places recur through daily return behavior, regular neighbourhood routines, and low-intensity social cadence",
      supportedFeatureClasses: Object.freeze(["building_footprint", "coastal_green"]),
      supportedLivenessCategories: Object.freeze(["social"]),
      supportedOccupancyProfileIds: Object.freeze([
        "OCCUPANCY_PROFILE_QUIET_LOCAL_001"
      ]),
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
    weeklyRoutineRecurrenceVersion: state.weeklyRoutineRecurrenceVersion,
    registeredWeeklyRoutineRuleCount: state.registeredWeeklyRoutineRuleCount,
    weeklyRoutineProfileId: state.weeklyRoutineProfileId,
    recurrencePatternId: state.recurrencePatternId,
    communityCadenceId: state.communityCadenceId,
    eventFrequency: state.eventFrequency,
    recurrenceReason: state.recurrenceReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const weeklyRoutineProfileId = sanitizeString(rule.weeklyRoutineProfileId);
  const recurrencePatternId = sanitizeString(rule.recurrencePatternId);
  const communityCadenceId = sanitizeString(rule.communityCadenceId);
  const eventFrequency = sanitizeString(rule.eventFrequency);
  const recurrenceReason = sanitizeString(rule.recurrenceReason);
  if (!weeklyRoutineProfileId) {
    throw Object.assign(new Error("MISSING_WEEKLY_ROUTINE_PROFILE_ID"), {
      reasonCode: "MISSING_WEEKLY_ROUTINE_PROFILE_ID"
    });
  }
  if (!recurrencePatternId) {
    throw Object.assign(new Error("MISSING_RECURRENCE_PATTERN_ID"), {
      reasonCode: "MISSING_RECURRENCE_PATTERN_ID"
    });
  }
  if (!communityCadenceId) {
    throw Object.assign(new Error("MISSING_COMMUNITY_CADENCE_ID"), {
      reasonCode: "MISSING_COMMUNITY_CADENCE_ID"
    });
  }
  if (!eventFrequency) {
    throw Object.assign(new Error("MISSING_EVENT_FREQUENCY"), {
      reasonCode: "MISSING_EVENT_FREQUENCY"
    });
  }
  if (!recurrenceReason) {
    throw Object.assign(new Error("MISSING_RECURRENCE_REASON"), {
      reasonCode: "MISSING_RECURRENCE_REASON"
    });
  }
  return deepFreeze({
    weeklyRoutineProfileId,
    recurrencePatternId,
    communityCadenceId,
    eventFrequency,
    recurrenceReason,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedLivenessCategories: deepFreeze(
      (rule.supportedLivenessCategories ?? []).map(String)
    ),
    supportedOccupancyProfileIds: deepFreeze(
      (rule.supportedOccupancyProfileIds ?? []).map(String)
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
    weeklyRoutineRecurrenceVersion: version,
    registeredWeeklyRoutineRuleCount: rules.length,
    weeklyRoutineProfileId: null,
    recurrencePatternId: null,
    communityCadenceId: null,
    eventFrequency: null,
    recurrenceReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  livenessCategory,
  occupancyProfileId,
  serviceRoleId,
  communityRole
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedLivenessCategories.includes(livenessCategory) &&
        rule.supportedOccupancyProfileIds.includes(occupancyProfileId) &&
        rule.supportedServiceRoleIds.includes(serviceRoleId) &&
        rule.supportedCommunityRoles.includes(communityRole)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      weeklyRoutineRecurrenceVersion: null,
      registeredWeeklyRoutineRuleCount: 0,
      weeklyRoutineProfileId: null,
      recurrencePatternId: null,
      communityCadenceId: null,
      eventFrequency: null,
      recurrenceReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooks(
  registry,
  {
    featureClass,
    livenessCategory,
    occupancyProfileId,
    serviceRoleId,
    communityRole
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationWeeklyRoutineRecurrenceHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_WEEKLY_ROUTINE_RECURRENCE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedLivenessCategory = sanitizeString(livenessCategory);
  const normalizedOccupancyProfileId = sanitizeString(occupancyProfileId);
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
    normalizedLivenessCategory,
    normalizedOccupancyProfileId,
    normalizedServiceRoleId,
    normalizedCommunityRole
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_WEEKLY_ROUTINE_RECURRENCE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      weeklyRoutineProfileId: null,
      recurrencePatternId: null,
      communityCadenceId: null,
      eventFrequency: null,
      recurrenceReason: "UNSUPPORTED_WEEKLY_ROUTINE_RECURRENCE_CONTEXT",
      reasonCode: "UNSUPPORTED_WEEKLY_ROUTINE_RECURRENCE_CONTEXT"
    });
  }

  registry.__state.weeklyRoutineProfileId = rule.weeklyRoutineProfileId;
  registry.__state.recurrencePatternId = rule.recurrencePatternId;
  registry.__state.communityCadenceId = rule.communityCadenceId;
  registry.__state.eventFrequency = rule.eventFrequency;
  registry.__state.recurrenceReason = rule.recurrenceReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    weeklyRoutineProfileId: rule.weeklyRoutineProfileId,
    recurrencePatternId: rule.recurrencePatternId,
    communityCadenceId: rule.communityCadenceId,
    eventFrequency: rule.eventFrequency,
    recurrenceReason: rule.recurrenceReason
  });
}
