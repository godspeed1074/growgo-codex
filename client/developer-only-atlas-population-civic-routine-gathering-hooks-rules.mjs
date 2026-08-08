const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_VERSION =
  "atlas_population_civic_routine_gathering_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_COMMUNITY_CENTRE_001",
      gatheringPatternId: "GATHERING_PATTERN_COMMUNITY_MEETUP_001",
      temporalUseProfile: "daytime_evening_weekly_cycle",
      communityRole: "neighbourhood_gathering_point",
      supportedFeatureClasses: Object.freeze(["civic_site", "park"]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_COMMUNITY_ANCHOR_SOCIAL_001"
      ]),
      supportedSocialRhythmIds: Object.freeze([
        "SOCIAL_RHYTHM_COMMUNITY_WEEKLY_GATHERING_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["spring", "summer", "autumn"]),
      routineReason:
        "community_anchor_places sustain recurring local meetups and shared daytime-evening routines",
      status: "approved"
    }),
    Object.freeze({
      civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_HERITAGE_SQUARE_001",
      gatheringPatternId: "GATHERING_PATTERN_FESTIVAL_MARKET_001",
      temporalUseProfile: "seasonal_daytime_evening_festival_window",
      communityRole: "visitor_attraction",
      supportedFeatureClasses: Object.freeze([
        "building_footprint",
        "civic_site"
      ]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_HERITAGE_EVENT_001"
      ]),
      supportedSocialRhythmIds: Object.freeze([
        "SOCIAL_RHYTHM_HERITAGE_FESTIVAL_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["autumn", "winter"]),
      routineReason:
        "heritage landmarks and civic anchors support market and festival use across seasonal gathering periods",
      status: "approved"
    }),
    Object.freeze({
      civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_COASTAL_LOOKOUT_001",
      gatheringPatternId: "GATHERING_PATTERN_SCENIC_PAUSE_001",
      temporalUseProfile: "daytime_seasonal_visit_cycle",
      communityRole: "visitor_attraction",
      supportedFeatureClasses: Object.freeze(["coastal_green", "park"]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_COASTAL_DISCOVERY_TOURIST_001"
      ]),
      supportedSocialRhythmIds: Object.freeze([
        "SOCIAL_RHYTHM_COASTAL_DISCOVERY_SEASONAL_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["spring", "summer"]),
      routineReason:
        "coastal discovery places attract scenic gathering, visitor pause points, and seasonal shared use",
      status: "approved"
    }),
    Object.freeze({
      civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_QUIET_RETURN_SITE_001",
      gatheringPatternId: "GATHERING_PATTERN_LOW_INTENSITY_LOCAL_USE_001",
      temporalUseProfile: "morning_daytime_quiet_return_cycle",
      communityRole: "local_hub",
      supportedFeatureClasses: Object.freeze([
        "building_footprint",
        "coastal_green"
      ]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_QUIET_MEMORY_RETURN_001"
      ]),
      supportedSocialRhythmIds: Object.freeze([
        "SOCIAL_RHYTHM_LOW_INTENSITY_RETURN_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["autumn", "winter"]),
      routineReason:
        "quiet repeat-visit places hold low-intensity local use, remembered return patterns, and everyday civic presence",
      status: "approved"
    }),
    Object.freeze({
      civicRoutineProfileId: "CIVIC_ROUTINE_PROFILE_SPORTS_GROUND_001",
      gatheringPatternId: "GATHERING_PATTERN_RECREATION_EVENT_001",
      temporalUseProfile: "morning_daytime_evening_recreation_cycle",
      communityRole: "local_hub",
      supportedFeatureClasses: Object.freeze(["sports_ground", "civic_site"]),
      supportedActivityProfileIds: Object.freeze([
        "ACTIVITY_PROFILE_COMMUNITY_ANCHOR_SOCIAL_001"
      ]),
      supportedSocialRhythmIds: Object.freeze([
        "SOCIAL_RHYTHM_COMMUNITY_WEEKLY_GATHERING_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["spring", "summer", "autumn"]),
      routineReason:
        "sports grounds and recreation anchors support repeating local gatherings, community events, and daytime activity cycles",
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
    civicRoutineGatheringVersion: state.civicRoutineGatheringVersion,
    registeredCivicRoutineRuleCount: state.registeredCivicRoutineRuleCount,
    civicRoutineProfileId: state.civicRoutineProfileId,
    gatheringPatternId: state.gatheringPatternId,
    temporalUseProfile: state.temporalUseProfile,
    communityRole: state.communityRole,
    routineReason: state.routineReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const civicRoutineProfileId = sanitizeString(rule.civicRoutineProfileId);
  const gatheringPatternId = sanitizeString(rule.gatheringPatternId);
  const temporalUseProfile = sanitizeString(rule.temporalUseProfile);
  const communityRole = sanitizeString(rule.communityRole);
  const routineReason = sanitizeString(rule.routineReason);
  if (!civicRoutineProfileId) {
    throw Object.assign(new Error("MISSING_CIVIC_ROUTINE_PROFILE_ID"), {
      reasonCode: "MISSING_CIVIC_ROUTINE_PROFILE_ID"
    });
  }
  if (!gatheringPatternId) {
    throw Object.assign(new Error("MISSING_GATHERING_PATTERN_ID"), {
      reasonCode: "MISSING_GATHERING_PATTERN_ID"
    });
  }
  if (!temporalUseProfile) {
    throw Object.assign(new Error("MISSING_TEMPORAL_USE_PROFILE"), {
      reasonCode: "MISSING_TEMPORAL_USE_PROFILE"
    });
  }
  if (!communityRole) {
    throw Object.assign(new Error("MISSING_COMMUNITY_ROLE"), {
      reasonCode: "MISSING_COMMUNITY_ROLE"
    });
  }
  if (!routineReason) {
    throw Object.assign(new Error("MISSING_ROUTINE_REASON"), {
      reasonCode: "MISSING_ROUTINE_REASON"
    });
  }
  return deepFreeze({
    civicRoutineProfileId,
    gatheringPatternId,
    temporalUseProfile,
    communityRole,
    supportedFeatureClasses: deepFreeze((rule.supportedFeatureClasses ?? []).map(String)),
    supportedActivityProfileIds: deepFreeze(
      (rule.supportedActivityProfileIds ?? []).map(String)
    ),
    supportedSocialRhythmIds: deepFreeze(
      (rule.supportedSocialRhythmIds ?? []).map(String)
    ),
    supportedSeasonProfileIds: deepFreeze(
      (rule.supportedSeasonProfileIds ?? []).map(String)
    ),
    routineReason,
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    civicRoutineGatheringVersion: version,
    registeredCivicRoutineRuleCount: rules.length,
    civicRoutineProfileId: null,
    gatheringPatternId: null,
    temporalUseProfile: null,
    communityRole: null,
    routineReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  featureClass,
  activityProfileId,
  socialRhythmId,
  seasonProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.supportedActivityProfileIds.includes(activityProfileId) &&
        rule.supportedSocialRhythmIds.includes(socialRhythmId) &&
        rule.supportedSeasonProfileIds.includes(seasonProfileId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      civicRoutineGatheringVersion: null,
      registeredCivicRoutineRuleCount: 0,
      civicRoutineProfileId: null,
      gatheringPatternId: null,
      temporalUseProfile: null,
      communityRole: null,
      routineReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooks(
  registry,
  { featureClass, activityProfileId, socialRhythmId, seasonProfileId } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationCivicRoutineGatheringHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_CIVIC_ROUTINE_GATHERING_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedActivityProfileId = sanitizeString(activityProfileId);
  const normalizedSocialRhythmId = sanitizeString(socialRhythmId);
  const normalizedSeasonProfileId = sanitizeString(seasonProfileId);

  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedFeatureClass,
    normalizedActivityProfileId,
    normalizedSocialRhythmId,
    normalizedSeasonProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_CIVIC_ROUTINE_GATHERING_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      civicRoutineProfileId: null,
      gatheringPatternId: null,
      temporalUseProfile: null,
      communityRole: null,
      routineReason: "UNSUPPORTED_CIVIC_ROUTINE_GATHERING_CONTEXT",
      reasonCode: "UNSUPPORTED_CIVIC_ROUTINE_GATHERING_CONTEXT"
    });
  }

  registry.__state.civicRoutineProfileId = rule.civicRoutineProfileId;
  registry.__state.gatheringPatternId = rule.gatheringPatternId;
  registry.__state.temporalUseProfile = rule.temporalUseProfile;
  registry.__state.communityRole = rule.communityRole;
  registry.__state.routineReason = rule.routineReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    civicRoutineProfileId: rule.civicRoutineProfileId,
    gatheringPatternId: rule.gatheringPatternId,
    temporalUseProfile: rule.temporalUseProfile,
    communityRole: rule.communityRole,
    routineReason: rule.routineReason
  });
}
