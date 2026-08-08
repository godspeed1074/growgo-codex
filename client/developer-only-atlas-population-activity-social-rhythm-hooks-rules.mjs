const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_VERSION =
  "atlas_population_activity_social_rhythm_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      activityProfileId: "ACTIVITY_PROFILE_COASTAL_DISCOVERY_TOURIST_001",
      socialRhythmId: "SOCIAL_RHYTHM_COASTAL_DISCOVERY_SEASONAL_001",
      timeContextProfile: "summer_daylight_seasonal_peak",
      supportedSettlementIdentityIds: Object.freeze([
        "coastal_village",
        "rural_town"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_NATURAL_WONDER_001",
        "PLACE_MEMORY_HIDDEN_DISCOVERY_001"
      ]),
      supportedSeasonalStoryProfileIds: Object.freeze([
        "SEASONAL_STORY_PROFILE_COASTAL_SUMMER_001",
        "SEASONAL_STORY_PROFILE_DISCOVERY_RETURN_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["spring", "summer"]),
      supportedReturnVisitCategories: Object.freeze(["discovered", "remembered"]),
      communityImportance: "medium",
      activityReason:
        "coastal_discovery_activity_blends_tourist_interest_with_repeat_visit_memory",
      status: "approved"
    }),
    Object.freeze({
      activityProfileId: "ACTIVITY_PROFILE_COMMUNITY_ANCHOR_SOCIAL_001",
      socialRhythmId: "SOCIAL_RHYTHM_COMMUNITY_WEEKLY_GATHERING_001",
      timeContextProfile: "weekly_daylight_community_cycle",
      supportedSettlementIdentityIds: Object.freeze([
        "suburban_community",
        "rural_town",
        "coastal_village"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_COMMUNITY_SITE_001"
      ]),
      supportedSeasonalStoryProfileIds: Object.freeze([
        "SEASONAL_STORY_PROFILE_COMMUNITY_RECURRING_001",
        "SEASONAL_STORY_PROFILE_HERITAGE_GATHERING_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["spring", "summer", "autumn"]),
      supportedReturnVisitCategories: Object.freeze(["remembered", "revisited"]),
      communityImportance: "high",
      activityReason:
        "community_anchor_activity_supports recurring gatherings and local social rhythm",
      status: "approved"
    }),
    Object.freeze({
      activityProfileId: "ACTIVITY_PROFILE_HERITAGE_EVENT_001",
      socialRhythmId: "SOCIAL_RHYTHM_HERITAGE_FESTIVAL_001",
      timeContextProfile: "autumn_winter_event_window",
      supportedSettlementIdentityIds: Object.freeze([
        "heritage_town",
        "urban_district",
        "suburban_community"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_HISTORIC_LANDMARK_001",
        "PLACE_MEMORY_COMMUNITY_SITE_001"
      ]),
      supportedSeasonalStoryProfileIds: Object.freeze([
        "SEASONAL_STORY_PROFILE_HERITAGE_GATHERING_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["autumn", "winter"]),
      supportedReturnVisitCategories: Object.freeze(["revisited"]),
      communityImportance: "high",
      activityReason:
        "heritage landmark activity aligns festival cadence with recurring communal memory",
      status: "approved"
    }),
    Object.freeze({
      activityProfileId: "ACTIVITY_PROFILE_QUIET_MEMORY_RETURN_001",
      socialRhythmId: "SOCIAL_RHYTHM_LOW_INTENSITY_RETURN_001",
      timeContextProfile: "quiet_repeat_visit_window",
      supportedSettlementIdentityIds: Object.freeze([
        "suburban_community",
        "urban_district",
        "coastal_village"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_HIDDEN_DISCOVERY_001",
        "PLACE_MEMORY_NATURAL_WONDER_001"
      ]),
      supportedSeasonalStoryProfileIds: Object.freeze([
        "SEASONAL_STORY_PROFILE_DISCOVERY_RETURN_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["autumn", "winter"]),
      supportedReturnVisitCategories: Object.freeze(["remembered"]),
      communityImportance: "low_medium",
      activityReason:
        "quiet return-visit activity preserves living-place memory without event intensity",
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
    activitySocialRhythmVersion: state.activitySocialRhythmVersion,
    registeredActivitySocialRhythmRuleCount:
      state.registeredActivitySocialRhythmRuleCount,
    activityProfileId: state.activityProfileId,
    socialRhythmId: state.socialRhythmId,
    timeContextProfile: state.timeContextProfile,
    activityReason: state.activityReason,
    communityImportance: state.communityImportance,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const activityProfileId = sanitizeString(rule.activityProfileId);
  const socialRhythmId = sanitizeString(rule.socialRhythmId);
  const timeContextProfile = sanitizeString(rule.timeContextProfile);
  const communityImportance = sanitizeString(rule.communityImportance);
  const activityReason = sanitizeString(rule.activityReason);
  if (!activityProfileId) {
    throw Object.assign(new Error("MISSING_ACTIVITY_PROFILE_ID"), {
      reasonCode: "MISSING_ACTIVITY_PROFILE_ID"
    });
  }
  if (!socialRhythmId) {
    throw Object.assign(new Error("MISSING_SOCIAL_RHYTHM_ID"), {
      reasonCode: "MISSING_SOCIAL_RHYTHM_ID"
    });
  }
  if (!timeContextProfile) {
    throw Object.assign(new Error("MISSING_TIME_CONTEXT_PROFILE"), {
      reasonCode: "MISSING_TIME_CONTEXT_PROFILE"
    });
  }
  if (!communityImportance) {
    throw Object.assign(new Error("MISSING_COMMUNITY_IMPORTANCE"), {
      reasonCode: "MISSING_COMMUNITY_IMPORTANCE"
    });
  }
  if (!activityReason) {
    throw Object.assign(new Error("MISSING_ACTIVITY_REASON"), {
      reasonCode: "MISSING_ACTIVITY_REASON"
    });
  }
  return deepFreeze({
    activityProfileId,
    socialRhythmId,
    timeContextProfile,
    supportedSettlementIdentityIds: deepFreeze(
      (rule.supportedSettlementIdentityIds ?? []).map(String)
    ),
    supportedPlaceMemoryIds: deepFreeze(
      (rule.supportedPlaceMemoryIds ?? []).map(String)
    ),
    supportedSeasonalStoryProfileIds: deepFreeze(
      (rule.supportedSeasonalStoryProfileIds ?? []).map(String)
    ),
    supportedSeasonProfileIds: deepFreeze(
      (rule.supportedSeasonProfileIds ?? []).map(String)
    ),
    supportedReturnVisitCategories: deepFreeze(
      (rule.supportedReturnVisitCategories ?? []).map(String)
    ),
    communityImportance,
    activityReason,
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    activitySocialRhythmVersion: version,
    registeredActivitySocialRhythmRuleCount: rules.length,
    activityProfileId: null,
    socialRhythmId: null,
    timeContextProfile: null,
    activityReason: null,
    communityImportance: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  settlementIdentityId,
  placeMemoryId,
  seasonalStoryProfileId,
  seasonProfileId,
  returnVisitCategory
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedSettlementIdentityIds.includes(settlementIdentityId) &&
        rule.supportedPlaceMemoryIds.includes(placeMemoryId) &&
        rule.supportedSeasonalStoryProfileIds.includes(
          seasonalStoryProfileId
        ) &&
        rule.supportedSeasonProfileIds.includes(seasonProfileId) &&
        rule.supportedReturnVisitCategories.includes(returnVisitCategory)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      activitySocialRhythmVersion: null,
      registeredActivitySocialRhythmRuleCount: 0,
      activityProfileId: null,
      socialRhythmId: null,
      timeContextProfile: null,
      activityReason: null,
      communityImportance: null,
      lastFailureReason:
        "ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationActivitySocialRhythmHooks(
  registry,
  {
    settlementIdentityId,
    placeMemoryId,
    seasonalStoryProfileId,
    seasonProfileId,
    returnVisitCategory
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationActivitySocialRhythmHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_ACTIVITY_SOCIAL_RHYTHM_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedSettlementIdentityId = sanitizeString(settlementIdentityId);
  const normalizedPlaceMemoryId = sanitizeString(placeMemoryId);
  const normalizedSeasonalStoryProfileId =
    sanitizeString(seasonalStoryProfileId);
  const normalizedSeasonProfileId = sanitizeString(seasonProfileId);
  const normalizedReturnVisitCategory = sanitizeString(returnVisitCategory);

  if (!normalizedSettlementIdentityId) {
    registry.__state.lastFailureReason = "MISSING_SETTLEMENT_IDENTITY_ID";
    throw Object.assign(new Error("MISSING_SETTLEMENT_IDENTITY_ID"), {
      reasonCode: "MISSING_SETTLEMENT_IDENTITY_ID"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedSettlementIdentityId,
    normalizedPlaceMemoryId,
    normalizedSeasonalStoryProfileId,
    normalizedSeasonProfileId,
    normalizedReturnVisitCategory
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_ACTIVITY_SOCIAL_RHYTHM_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      activityProfileId: null,
      socialRhythmId: null,
      timeContextProfile: null,
      activityReason: "UNSUPPORTED_ACTIVITY_SOCIAL_RHYTHM_CONTEXT",
      communityImportance: null,
      reasonCode: "UNSUPPORTED_ACTIVITY_SOCIAL_RHYTHM_CONTEXT"
    });
  }

  registry.__state.activityProfileId = rule.activityProfileId;
  registry.__state.socialRhythmId = rule.socialRhythmId;
  registry.__state.timeContextProfile = rule.timeContextProfile;
  registry.__state.activityReason = rule.activityReason;
  registry.__state.communityImportance = rule.communityImportance;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    activityProfileId: rule.activityProfileId,
    socialRhythmId: rule.socialRhythmId,
    timeContextProfile: rule.timeContextProfile,
    activityReason: rule.activityReason,
    communityImportance: rule.communityImportance
  });
}
