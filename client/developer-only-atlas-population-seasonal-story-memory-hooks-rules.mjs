const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_VERSION =
  "atlas_population_seasonal_story_memory_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      memoryStateId: "MEMORY_STATE_SEASONAL_COASTAL_DISCOVERED_001",
      seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_COASTAL_SUMMER_001",
      eventHookProfileId: "EVENT_HOOK_PROFILE_COASTAL_ACTIVITY_001",
      supportedSeasonProfileIds: Object.freeze(["summer", "spring"]),
      supportedBiomeProfileIds: Object.freeze(["coastal", "wetland"]),
      supportedStoryCategories: Object.freeze(["natural_wonder", "hidden_discovery"]),
      returnVisitCategory: "discovered",
      storyEvolutionReason: "seasonal_coastal_activity_and_repeat_discovery_memory",
      status: "approved"
    }),
    Object.freeze({
      memoryStateId: "MEMORY_STATE_HERITAGE_EVENT_REVISITED_001",
      seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_HERITAGE_GATHERING_001",
      eventHookProfileId: "EVENT_HOOK_PROFILE_HERITAGE_FESTIVAL_001",
      supportedSeasonProfileIds: Object.freeze(["autumn", "winter"]),
      supportedBiomeProfileIds: Object.freeze(["urban", "suburban"]),
      supportedStoryCategories: Object.freeze(["historic", "community"]),
      returnVisitCategory: "revisited",
      storyEvolutionReason: "heritage_event_cycle_and_return_visit_memory",
      status: "approved"
    }),
    Object.freeze({
      memoryStateId: "MEMORY_STATE_COMMUNITY_RECURRING_001",
      seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_COMMUNITY_RECURRING_001",
      eventHookProfileId: "EVENT_HOOK_PROFILE_COMMUNITY_EVENT_001",
      supportedSeasonProfileIds: Object.freeze(["spring", "summer", "autumn"]),
      supportedBiomeProfileIds: Object.freeze(["suburban", "rural", "coastal"]),
      supportedStoryCategories: Object.freeze(["community", "cultural"]),
      returnVisitCategory: "remembered",
      storyEvolutionReason: "community_event_recurrence_and_local_memory",
      status: "approved"
    }),
    Object.freeze({
      memoryStateId: "MEMORY_STATE_DISCOVERY_CHAIN_REMEMBERED_001",
      seasonalStoryProfileId: "SEASONAL_STORY_PROFILE_DISCOVERY_RETURN_001",
      eventHookProfileId: "EVENT_HOOK_PROFILE_DISCOVERY_ACHIEVEMENT_001",
      supportedSeasonProfileIds: Object.freeze(["summer", "autumn", "winter"]),
      supportedBiomeProfileIds: Object.freeze(["coastal", "urban", "suburban"]),
      supportedStoryCategories: Object.freeze(["hidden_discovery", "exploration"]),
      returnVisitCategory: "remembered",
      storyEvolutionReason: "achievement_chain_memory_and_return_visit_hook",
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
    seasonalStoryMemoryVersion: state.seasonalStoryMemoryVersion,
    registeredSeasonalStoryMemoryRuleCount:
      state.registeredSeasonalStoryMemoryRuleCount,
    memoryStateId: state.memoryStateId,
    seasonalStoryProfileId: state.seasonalStoryProfileId,
    eventHookProfileId: state.eventHookProfileId,
    returnVisitCategory: state.returnVisitCategory,
    storyEvolutionReason: state.storyEvolutionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const memoryStateId = sanitizeString(rule.memoryStateId);
  const seasonalStoryProfileId = sanitizeString(rule.seasonalStoryProfileId);
  const eventHookProfileId = sanitizeString(rule.eventHookProfileId);
  const returnVisitCategory = sanitizeString(rule.returnVisitCategory);
  const storyEvolutionReason = sanitizeString(rule.storyEvolutionReason);
  if (!memoryStateId) {
    throw Object.assign(new Error("MISSING_MEMORY_STATE_ID"), {
      reasonCode: "MISSING_MEMORY_STATE_ID"
    });
  }
  if (!seasonalStoryProfileId) {
    throw Object.assign(new Error("MISSING_SEASONAL_STORY_PROFILE_ID"), {
      reasonCode: "MISSING_SEASONAL_STORY_PROFILE_ID"
    });
  }
  if (!eventHookProfileId) {
    throw Object.assign(new Error("MISSING_EVENT_HOOK_PROFILE_ID"), {
      reasonCode: "MISSING_EVENT_HOOK_PROFILE_ID"
    });
  }
  if (!returnVisitCategory) {
    throw Object.assign(new Error("MISSING_RETURN_VISIT_CATEGORY"), {
      reasonCode: "MISSING_RETURN_VISIT_CATEGORY"
    });
  }
  if (!storyEvolutionReason) {
    throw Object.assign(new Error("MISSING_STORY_EVOLUTION_REASON"), {
      reasonCode: "MISSING_STORY_EVOLUTION_REASON"
    });
  }
  return deepFreeze({
    memoryStateId,
    seasonalStoryProfileId,
    eventHookProfileId,
    supportedSeasonProfileIds: deepFreeze(
      (rule.supportedSeasonProfileIds ?? []).map(String)
    ),
    supportedBiomeProfileIds: deepFreeze(
      (rule.supportedBiomeProfileIds ?? []).map(String)
    ),
    supportedStoryCategories: deepFreeze(
      (rule.supportedStoryCategories ?? []).map(String)
    ),
    returnVisitCategory,
    storyEvolutionReason,
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    seasonalStoryMemoryVersion: version,
    registeredSeasonalStoryMemoryRuleCount: rules.length,
    memoryStateId: null,
    seasonalStoryProfileId: null,
    eventHookProfileId: null,
    returnVisitCategory: null,
    storyEvolutionReason: null,
    lastFailureReason: null
  };
}

function chooseRule(registry, seasonProfileId, biomeProfileId, storyCategory) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedSeasonProfileIds.includes(seasonProfileId) &&
        rule.supportedBiomeProfileIds.includes(biomeProfileId) &&
        rule.supportedStoryCategories.includes(storyCategory)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      seasonalStoryMemoryVersion: null,
      registeredSeasonalStoryMemoryRuleCount: 0,
      memoryStateId: null,
      seasonalStoryProfileId: null,
      eventHookProfileId: null,
      returnVisitCategory: null,
      storyEvolutionReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooks(
  registry,
  {
    seasonProfileId,
    biomeProfileId,
    storyCategory
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSeasonalStoryMemoryHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_SEASONAL_STORY_MEMORY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedSeasonProfileId = sanitizeString(seasonProfileId);
  const normalizedBiomeProfileId = sanitizeString(biomeProfileId);
  const normalizedStoryCategory = sanitizeString(storyCategory);

  if (!normalizedSeasonProfileId) {
    registry.__state.lastFailureReason = "MISSING_SEASON_PROFILE_ID";
    throw Object.assign(new Error("MISSING_SEASON_PROFILE_ID"), {
      reasonCode: "MISSING_SEASON_PROFILE_ID"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedSeasonProfileId,
    normalizedBiomeProfileId,
    normalizedStoryCategory
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_SEASONAL_STORY_MEMORY_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      memoryStateId: null,
      seasonalStoryProfileId: null,
      eventHookProfileId: null,
      returnVisitCategory: null,
      storyEvolutionReason:
        "UNSUPPORTED_SEASONAL_STORY_MEMORY_CONTEXT",
      reasonCode: "UNSUPPORTED_SEASONAL_STORY_MEMORY_CONTEXT"
    });
  }

  registry.__state.memoryStateId = rule.memoryStateId;
  registry.__state.seasonalStoryProfileId = rule.seasonalStoryProfileId;
  registry.__state.eventHookProfileId = rule.eventHookProfileId;
  registry.__state.returnVisitCategory = rule.returnVisitCategory;
  registry.__state.storyEvolutionReason = rule.storyEvolutionReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    memoryStateId: rule.memoryStateId,
    seasonalStoryProfileId: rule.seasonalStoryProfileId,
    eventHookProfileId: rule.eventHookProfileId,
    returnVisitCategory: rule.returnVisitCategory,
    storyEvolutionReason: rule.storyEvolutionReason
  });
}
