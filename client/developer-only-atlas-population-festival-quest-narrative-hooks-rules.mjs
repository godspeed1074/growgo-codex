const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_VERSION =
  "atlas_population_festival_quest_narrative_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      festivalProfileId: "FESTIVAL_PROFILE_HERITAGE_MARKET_001",
      questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_HERITAGE_SEQUENCE_001",
      seasonalDestinationProfileId:
        "SEASONAL_DESTINATION_PROFILE_HERITAGE_GATHERING_001",
      achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_HERITAGE_COLLECTION_001",
      narrativeReason:
        "heritage destinations combine market tradition, landmark arrival, and themed route memory into repeatable civic festival and collection-chain hooks",
      supportedDestinationFrameProfileIds: Object.freeze([
        "DESTINATION_FRAME_CIVIC_LANDMARK_001",
        "DESTINATION_FRAME_SPECIAL_SITE_001"
      ]),
      supportedRouteMemoryIds: Object.freeze([
        "ROUTE_MEMORY_HERITAGE_LANDMARK_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_HISTORIC_LANDMARK_001"
      ]),
      supportedRecurrencePatternIds: Object.freeze([
        "RECURRENCE_PATTERN_EVENT_MONTHLY_001"
      ]),
      supportedTraditionProfileIds: Object.freeze([
        "TRADITION_PROFILE_HERITAGE_MARKET_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      festivalProfileId: "FESTIVAL_PROFILE_COASTAL_SEASONAL_001",
      questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_SCENIC_DISCOVERY_001",
      seasonalDestinationProfileId:
        "SEASONAL_DESTINATION_PROFILE_COASTAL_REVEAL_001",
      achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_SCENIC_EXPLORER_001",
      narrativeReason:
        "coastal destinations combine scenic tradition, seasonal return rhythm, and exploration routes into repeatable seasonal celebration and discovery-chain hooks",
      supportedDestinationFrameProfileIds: Object.freeze([
        "DESTINATION_FRAME_SCENIC_REVEAL_001",
        "DESTINATION_FRAME_BEACH_GATHERING_001"
      ]),
      supportedRouteMemoryIds: Object.freeze([
        "ROUTE_MEMORY_SCENIC_COASTAL_001",
        "ROUTE_MEMORY_DISCOVERY_CHAIN_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_NATURAL_WONDER_001",
        "PLACE_MEMORY_HIDDEN_DISCOVERY_001"
      ]),
      supportedRecurrencePatternIds: Object.freeze([
        "RECURRENCE_PATTERN_SEASONAL_WEEKLY_001"
      ]),
      supportedTraditionProfileIds: Object.freeze([
        "TRADITION_PROFILE_COASTAL_SEASONAL_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      festivalProfileId: "FESTIVAL_PROFILE_COMMUNITY_ROUTINE_001",
      questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_COMMUNITY_JOURNEY_001",
      seasonalDestinationProfileId:
        "SEASONAL_DESTINATION_PROFILE_LOCAL_GATHERING_001",
      achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_COMMUNITY_RETURN_001",
      narrativeReason:
        "community places combine recurring gathering traditions, local routes, and community memory into future neighbourhood journeys, repeat quests, and return-visit hooks",
      supportedDestinationFrameProfileIds: Object.freeze([
        "DESTINATION_FRAME_CIVIC_LANDMARK_001",
        "DESTINATION_FRAME_SCENIC_REVEAL_001"
      ]),
      supportedRouteMemoryIds: Object.freeze([
        "ROUTE_MEMORY_PARK_TRAIL_001",
        "ROUTE_MEMORY_HERITAGE_LANDMARK_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_COMMUNITY_SITE_001"
      ]),
      supportedRecurrencePatternIds: Object.freeze([
        "RECURRENCE_PATTERN_DAILY_WEEKLY_001"
      ]),
      supportedTraditionProfileIds: Object.freeze([
        "TRADITION_PROFILE_COMMUNITY_CADENCE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      festivalProfileId: "FESTIVAL_PROFILE_RETURN_DISCOVERY_001",
      questNarrativeProfileId: "QUEST_NARRATIVE_PROFILE_RETURN_CHAIN_001",
      seasonalDestinationProfileId:
        "SEASONAL_DESTINATION_PROFILE_RETURN_VISIT_001",
      achievementHookProfileId: "ACHIEVEMENT_HOOK_PROFILE_DISCOVERY_MILESTONE_001",
      narrativeReason:
        "quiet return places combine local recurrence, discovery memory, and tradition continuity into achievement chains, revisit milestones, and low-intensity narrative destinations",
      supportedDestinationFrameProfileIds: Object.freeze([
        "DESTINATION_FRAME_SPECIAL_SITE_001",
        "DESTINATION_FRAME_BEACH_GATHERING_001"
      ]),
      supportedRouteMemoryIds: Object.freeze([
        "ROUTE_MEMORY_DISCOVERY_CHAIN_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_HIDDEN_DISCOVERY_001"
      ]),
      supportedRecurrencePatternIds: Object.freeze([
        "RECURRENCE_PATTERN_DAILY_LOCAL_001"
      ]),
      supportedTraditionProfileIds: Object.freeze([
        "TRADITION_PROFILE_DISCOVERY_RETURN_001"
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
    festivalQuestNarrativeVersion: state.festivalQuestNarrativeVersion,
    registeredNarrativeRuleCount: state.registeredNarrativeRuleCount,
    festivalProfileId: state.festivalProfileId,
    questNarrativeProfileId: state.questNarrativeProfileId,
    seasonalDestinationProfileId: state.seasonalDestinationProfileId,
    achievementHookProfileId: state.achievementHookProfileId,
    narrativeReason: state.narrativeReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const festivalProfileId = sanitizeString(rule.festivalProfileId);
  const questNarrativeProfileId = sanitizeString(rule.questNarrativeProfileId);
  const seasonalDestinationProfileId = sanitizeString(
    rule.seasonalDestinationProfileId
  );
  const achievementHookProfileId = sanitizeString(
    rule.achievementHookProfileId
  );
  const narrativeReason = sanitizeString(rule.narrativeReason);

  if (!festivalProfileId) {
    throw Object.assign(new Error("MISSING_FESTIVAL_PROFILE_ID"), {
      reasonCode: "MISSING_FESTIVAL_PROFILE_ID"
    });
  }
  if (!questNarrativeProfileId) {
    throw Object.assign(new Error("MISSING_QUEST_NARRATIVE_PROFILE_ID"), {
      reasonCode: "MISSING_QUEST_NARRATIVE_PROFILE_ID"
    });
  }
  if (!seasonalDestinationProfileId) {
    throw Object.assign(new Error("MISSING_SEASONAL_DESTINATION_PROFILE_ID"), {
      reasonCode: "MISSING_SEASONAL_DESTINATION_PROFILE_ID"
    });
  }
  if (!achievementHookProfileId) {
    throw Object.assign(new Error("MISSING_ACHIEVEMENT_HOOK_PROFILE_ID"), {
      reasonCode: "MISSING_ACHIEVEMENT_HOOK_PROFILE_ID"
    });
  }
  if (!narrativeReason) {
    throw Object.assign(new Error("MISSING_NARRATIVE_REASON"), {
      reasonCode: "MISSING_NARRATIVE_REASON"
    });
  }

  return deepFreeze({
    festivalProfileId,
    questNarrativeProfileId,
    seasonalDestinationProfileId,
    achievementHookProfileId,
    narrativeReason,
    supportedDestinationFrameProfileIds: deepFreeze(
      (rule.supportedDestinationFrameProfileIds ?? []).map(String)
    ),
    supportedRouteMemoryIds: deepFreeze(
      (rule.supportedRouteMemoryIds ?? []).map(String)
    ),
    supportedPlaceMemoryIds: deepFreeze(
      (rule.supportedPlaceMemoryIds ?? []).map(String)
    ),
    supportedRecurrencePatternIds: deepFreeze(
      (rule.supportedRecurrencePatternIds ?? []).map(String)
    ),
    supportedTraditionProfileIds: deepFreeze(
      (rule.supportedTraditionProfileIds ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    festivalQuestNarrativeVersion: version,
    registeredNarrativeRuleCount: rules.length,
    festivalProfileId: null,
    questNarrativeProfileId: null,
    seasonalDestinationProfileId: null,
    achievementHookProfileId: null,
    narrativeReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  destinationFrameProfileId,
  routeMemoryId,
  placeMemoryId,
  recurrencePatternId,
  traditionProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedDestinationFrameProfileIds.includes(
          destinationFrameProfileId
        ) &&
        rule.supportedRouteMemoryIds.includes(routeMemoryId) &&
        rule.supportedPlaceMemoryIds.includes(placeMemoryId) &&
        rule.supportedRecurrencePatternIds.includes(recurrencePatternId) &&
        rule.supportedTraditionProfileIds.includes(traditionProfileId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      festivalQuestNarrativeVersion: null,
      registeredNarrativeRuleCount: 0,
      festivalProfileId: null,
      questNarrativeProfileId: null,
      seasonalDestinationProfileId: null,
      achievementHookProfileId: null,
      narrativeReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooks(
  registry,
  {
    destinationFrameProfileId,
    routeMemoryId,
    placeMemoryId,
    recurrencePatternId,
    traditionProfileId
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationFestivalQuestNarrativeHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_FESTIVAL_QUEST_NARRATIVE_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedDestinationFrameProfileId = sanitizeString(
    destinationFrameProfileId
  );
  const normalizedRouteMemoryId = sanitizeString(routeMemoryId);
  const normalizedPlaceMemoryId = sanitizeString(placeMemoryId);
  const normalizedRecurrencePatternId = sanitizeString(recurrencePatternId);
  const normalizedTraditionProfileId = sanitizeString(traditionProfileId);

  if (!normalizedDestinationFrameProfileId) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_FESTIVAL_QUEST_NARRATIVE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      festivalProfileId: null,
      questNarrativeProfileId: null,
      seasonalDestinationProfileId: null,
      achievementHookProfileId: null,
      narrativeReason: "UNSUPPORTED_FESTIVAL_QUEST_NARRATIVE_CONTEXT",
      reasonCode: "UNSUPPORTED_FESTIVAL_QUEST_NARRATIVE_CONTEXT"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedDestinationFrameProfileId,
    normalizedRouteMemoryId,
    normalizedPlaceMemoryId,
    normalizedRecurrencePatternId,
    normalizedTraditionProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_FESTIVAL_QUEST_NARRATIVE_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      festivalProfileId: null,
      questNarrativeProfileId: null,
      seasonalDestinationProfileId: null,
      achievementHookProfileId: null,
      narrativeReason: "UNSUPPORTED_FESTIVAL_QUEST_NARRATIVE_CONTEXT",
      reasonCode: "UNSUPPORTED_FESTIVAL_QUEST_NARRATIVE_CONTEXT"
    });
  }

  registry.__state.festivalProfileId = rule.festivalProfileId;
  registry.__state.questNarrativeProfileId = rule.questNarrativeProfileId;
  registry.__state.seasonalDestinationProfileId =
    rule.seasonalDestinationProfileId;
  registry.__state.achievementHookProfileId =
    rule.achievementHookProfileId;
  registry.__state.narrativeReason = rule.narrativeReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    festivalProfileId: rule.festivalProfileId,
    questNarrativeProfileId: rule.questNarrativeProfileId,
    seasonalDestinationProfileId: rule.seasonalDestinationProfileId,
    achievementHookProfileId: rule.achievementHookProfileId,
    narrativeReason: rule.narrativeReason
  });
}
