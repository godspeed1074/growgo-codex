const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_VERSION =
  "atlas_population_tradition_event_cycle_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      traditionProfileId: "TRADITION_PROFILE_COASTAL_SEASONAL_001",
      seasonalEventCycleId: "SEASONAL_EVENT_CYCLE_COASTAL_VISITOR_001",
      communityTraditionId: "COMMUNITY_TRADITION_SCENIC_SUMMER_RETURN_001",
      eventImportance: "high",
      traditionReason:
        "coastal visitor places sustain scenic return traditions through seasonal weekend rhythms, tourism peaks, and repeat discovery hooks",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
        "SETTLEMENT_IDENTITY_RURAL_TOWN_001"
      ]),
      supportedStoryCategories: Object.freeze([
        "natural_wonder",
        "hidden_discovery"
      ]),
      supportedRecurrencePatternIds: Object.freeze([
        "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001"
      ]),
      supportedCommunityCadenceIds: Object.freeze([
        "COMMUNITY_CADENCE_SCENIC_VISITOR_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["summer", "spring"]),
      status: "approved"
    }),
    Object.freeze({
      traditionProfileId: "TRADITION_PROFILE_COMMUNITY_CADENCE_001",
      seasonalEventCycleId: "SEASONAL_EVENT_CYCLE_COMMUNITY_GATHERING_001",
      communityTraditionId: "COMMUNITY_TRADITION_LOCAL_GATHERING_001",
      eventImportance: "medium",
      traditionReason:
        "community places preserve recurring local traditions through weekly gatherings, shared routines, and neighbourhood event cadence",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001",
        "SETTLEMENT_IDENTITY_RURAL_TOWN_001",
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001"
      ]),
      supportedStoryCategories: Object.freeze(["community"]),
      supportedRecurrencePatternIds: Object.freeze([
        "RECURRENCE_PATTERN_DAILY_WEEKLY_001"
      ]),
      supportedCommunityCadenceIds: Object.freeze([
        "COMMUNITY_CADENCE_LOCAL_GATHERING_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["spring", "summer", "autumn"]),
      status: "approved"
    }),
    Object.freeze({
      traditionProfileId: "TRADITION_PROFILE_HERITAGE_MARKET_001",
      seasonalEventCycleId: "SEASONAL_EVENT_CYCLE_HERITAGE_MARKET_001",
      communityTraditionId: "COMMUNITY_TRADITION_HERITAGE_MARKET_DAY_001",
      eventImportance: "high",
      traditionReason:
        "heritage and market places sustain monthly celebrations through civic market cycles, repeating festivals, and shared story traditions",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
        "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001"
      ]),
      supportedStoryCategories: Object.freeze(["historic"]),
      supportedRecurrencePatternIds: Object.freeze([
        "RECURRENCE_PATTERN_EVENT_MONTHLY_001"
      ]),
      supportedCommunityCadenceIds: Object.freeze([
        "COMMUNITY_CADENCE_MARKET_TRADITION_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["summer", "autumn", "winter"]),
      status: "approved"
    }),
    Object.freeze({
      traditionProfileId: "TRADITION_PROFILE_DISCOVERY_RETURN_001",
      seasonalEventCycleId: "SEASONAL_EVENT_CYCLE_DISCOVERY_RETURN_001",
      communityTraditionId: "COMMUNITY_TRADITION_RETURN_VISIT_001",
      eventImportance: "medium_high",
      traditionReason:
        "quiet return places preserve repeat discovery and achievement traditions through local recurrence, remembered visits, and low-intensity community continuity",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
        "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001",
        "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001"
      ]),
      supportedStoryCategories: Object.freeze(["hidden_discovery"]),
      supportedRecurrencePatternIds: Object.freeze([
        "RECURRENCE_PATTERN_DAILY_LOCAL_001"
      ]),
      supportedCommunityCadenceIds: Object.freeze([
        "COMMUNITY_CADENCE_QUIET_RETURN_001"
      ]),
      supportedSeasonProfileIds: Object.freeze(["summer", "autumn", "winter"]),
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
    traditionEventCycleVersion: state.traditionEventCycleVersion,
    registeredTraditionRuleCount: state.registeredTraditionRuleCount,
    traditionProfileId: state.traditionProfileId,
    seasonalEventCycleId: state.seasonalEventCycleId,
    communityTraditionId: state.communityTraditionId,
    eventImportance: state.eventImportance,
    traditionReason: state.traditionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const traditionProfileId = sanitizeString(rule.traditionProfileId);
  const seasonalEventCycleId = sanitizeString(rule.seasonalEventCycleId);
  const communityTraditionId = sanitizeString(rule.communityTraditionId);
  const eventImportance = sanitizeString(rule.eventImportance);
  const traditionReason = sanitizeString(rule.traditionReason);

  if (!traditionProfileId) {
    throw Object.assign(new Error("MISSING_TRADITION_PROFILE_ID"), {
      reasonCode: "MISSING_TRADITION_PROFILE_ID"
    });
  }
  if (!seasonalEventCycleId) {
    throw Object.assign(new Error("MISSING_SEASONAL_EVENT_CYCLE_ID"), {
      reasonCode: "MISSING_SEASONAL_EVENT_CYCLE_ID"
    });
  }
  if (!communityTraditionId) {
    throw Object.assign(new Error("MISSING_COMMUNITY_TRADITION_ID"), {
      reasonCode: "MISSING_COMMUNITY_TRADITION_ID"
    });
  }
  if (!eventImportance) {
    throw Object.assign(new Error("MISSING_EVENT_IMPORTANCE"), {
      reasonCode: "MISSING_EVENT_IMPORTANCE"
    });
  }
  if (!traditionReason) {
    throw Object.assign(new Error("MISSING_TRADITION_REASON"), {
      reasonCode: "MISSING_TRADITION_REASON"
    });
  }

  return deepFreeze({
    traditionProfileId,
    seasonalEventCycleId,
    communityTraditionId,
    eventImportance,
    traditionReason,
    supportedSettlementIdentityIds: deepFreeze(
      (rule.supportedSettlementIdentityIds ?? []).map(String)
    ),
    supportedStoryCategories: deepFreeze(
      (rule.supportedStoryCategories ?? []).map(String)
    ),
    supportedRecurrencePatternIds: deepFreeze(
      (rule.supportedRecurrencePatternIds ?? []).map(String)
    ),
    supportedCommunityCadenceIds: deepFreeze(
      (rule.supportedCommunityCadenceIds ?? []).map(String)
    ),
    supportedSeasonProfileIds: deepFreeze(
      (rule.supportedSeasonProfileIds ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    traditionEventCycleVersion: version,
    registeredTraditionRuleCount: rules.length,
    traditionProfileId: null,
    seasonalEventCycleId: null,
    communityTraditionId: null,
    eventImportance: null,
    traditionReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  settlementIdentityId,
  storyCategory,
  recurrencePatternId,
  communityCadenceId,
  seasonProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedSettlementIdentityIds.includes(settlementIdentityId) &&
        rule.supportedStoryCategories.includes(storyCategory) &&
        rule.supportedRecurrencePatternIds.includes(recurrencePatternId) &&
        rule.supportedCommunityCadenceIds.includes(communityCadenceId) &&
        rule.supportedSeasonProfileIds.includes(seasonProfileId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      traditionEventCycleVersion: null,
      registeredTraditionRuleCount: 0,
      traditionProfileId: null,
      seasonalEventCycleId: null,
      communityTraditionId: null,
      eventImportance: null,
      traditionReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationTraditionEventCycleHooks(
  registry,
  {
    settlementIdentityId,
    storyCategory,
    recurrencePatternId,
    communityCadenceId,
    seasonProfileId
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationTraditionEventCycleHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_TRADITION_EVENT_CYCLE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedSettlementIdentityId = sanitizeString(settlementIdentityId);
  const normalizedStoryCategory = sanitizeString(storyCategory);
  const normalizedRecurrencePatternId = sanitizeString(recurrencePatternId);
  const normalizedCommunityCadenceId = sanitizeString(communityCadenceId);
  const normalizedSeasonProfileId = sanitizeString(seasonProfileId);

  if (!normalizedSettlementIdentityId) {
    registry.__state.lastFailureReason = "MISSING_SETTLEMENT_IDENTITY_ID";
    throw Object.assign(new Error("MISSING_SETTLEMENT_IDENTITY_ID"), {
      reasonCode: "MISSING_SETTLEMENT_IDENTITY_ID"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedSettlementIdentityId,
    normalizedStoryCategory,
    normalizedRecurrencePatternId,
    normalizedCommunityCadenceId,
    normalizedSeasonProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_TRADITION_EVENT_CYCLE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      traditionProfileId: null,
      seasonalEventCycleId: null,
      communityTraditionId: null,
      eventImportance: null,
      traditionReason: "UNSUPPORTED_TRADITION_EVENT_CYCLE_CONTEXT",
      reasonCode: "UNSUPPORTED_TRADITION_EVENT_CYCLE_CONTEXT"
    });
  }

  registry.__state.traditionProfileId = rule.traditionProfileId;
  registry.__state.seasonalEventCycleId = rule.seasonalEventCycleId;
  registry.__state.communityTraditionId = rule.communityTraditionId;
  registry.__state.eventImportance = rule.eventImportance;
  registry.__state.traditionReason = rule.traditionReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    traditionProfileId: rule.traditionProfileId,
    seasonalEventCycleId: rule.seasonalEventCycleId,
    communityTraditionId: rule.communityTraditionId,
    eventImportance: rule.eventImportance,
    traditionReason: rule.traditionReason
  });
}
