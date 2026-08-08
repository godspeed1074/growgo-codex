const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_VERSION =
  "atlas_population_exploration_progression_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      campaignProfileId: "CAMPAIGN_PROFILE_COASTAL_TRAIL_001",
      destinationChainId: "DESTINATION_CHAIN_COASTAL_TRAIL_001",
      rewardArcProfileId: "REWARD_ARC_PROFILE_SCENIC_DISCOVERY_001",
      progressionTier: "tier_2_regional",
      explorationReason:
        "coastal destinations connect scenic frames, coastal route memory, and exploration hooks into a seasonal trail campaign with discovery milestones",
      supportedSeasonalDestinationProfileIds: Object.freeze([
        "SEASONAL_DESTINATION_PROFILE_COASTAL_REVEAL_001"
      ]),
      supportedRoutePriorities: Object.freeze(["high_scenic", "medium_discovery"]),
      supportedAchievementHookProfileIds: Object.freeze([
        "ACHIEVEMENT_HOOK_PROFILE_SCENIC_EXPLORER_001",
        "ACHIEVEMENT_HOOK_PROFILE_DISCOVERY_MILESTONE_001"
      ]),
      supportedQuestNarrativeProfileIds: Object.freeze([
        "QUEST_NARRATIVE_PROFILE_SCENIC_DISCOVERY_001",
        "QUEST_NARRATIVE_PROFILE_RETURN_CHAIN_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      campaignProfileId: "CAMPAIGN_PROFILE_HERITAGE_ROUTE_001",
      destinationChainId: "DESTINATION_CHAIN_HERITAGE_ROUTE_001",
      rewardArcProfileId: "REWARD_ARC_PROFILE_HERITAGE_COLLECTION_001",
      progressionTier: "tier_3_landmark",
      explorationReason:
        "heritage destinations connect landmark arrivals, heritage route memory, and collection achievements into a deeper landmark progression arc",
      supportedSeasonalDestinationProfileIds: Object.freeze([
        "SEASONAL_DESTINATION_PROFILE_HERITAGE_GATHERING_001"
      ]),
      supportedRoutePriorities: Object.freeze(["high_heritage"]),
      supportedAchievementHookProfileIds: Object.freeze([
        "ACHIEVEMENT_HOOK_PROFILE_HERITAGE_COLLECTION_001"
      ]),
      supportedQuestNarrativeProfileIds: Object.freeze([
        "QUEST_NARRATIVE_PROFILE_HERITAGE_SEQUENCE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      campaignProfileId: "CAMPAIGN_PROFILE_COMMUNITY_JOURNEY_001",
      destinationChainId: "DESTINATION_CHAIN_COMMUNITY_JOURNEY_001",
      rewardArcProfileId: "REWARD_ARC_PROFILE_RETURN_VISIT_001",
      progressionTier: "tier_1_local",
      explorationReason:
        "community destinations connect local gathering narratives, neighbourhood routes, and return achievements into a lightweight recurring community journey",
      supportedSeasonalDestinationProfileIds: Object.freeze([
        "SEASONAL_DESTINATION_PROFILE_LOCAL_GATHERING_001"
      ]),
      supportedRoutePriorities: Object.freeze(["medium_trail", "high_heritage"]),
      supportedAchievementHookProfileIds: Object.freeze([
        "ACHIEVEMENT_HOOK_PROFILE_COMMUNITY_RETURN_001"
      ]),
      supportedQuestNarrativeProfileIds: Object.freeze([
        "QUEST_NARRATIVE_PROFILE_COMMUNITY_JOURNEY_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      campaignProfileId: "CAMPAIGN_PROFILE_DISCOVERY_RETURN_001",
      destinationChainId: "DESTINATION_CHAIN_DISCOVERY_RETURN_001",
      rewardArcProfileId: "REWARD_ARC_PROFILE_MILESTONE_CHAIN_001",
      progressionTier: "tier_2_discovery",
      explorationReason:
        "return-discovery destinations connect revisit narratives, medium discovery routes, and milestone achievements into deterministic collection-style exploration campaigns",
      supportedSeasonalDestinationProfileIds: Object.freeze([
        "SEASONAL_DESTINATION_PROFILE_RETURN_VISIT_001"
      ]),
      supportedRoutePriorities: Object.freeze(["medium_discovery"]),
      supportedAchievementHookProfileIds: Object.freeze([
        "ACHIEVEMENT_HOOK_PROFILE_DISCOVERY_MILESTONE_001"
      ]),
      supportedQuestNarrativeProfileIds: Object.freeze([
        "QUEST_NARRATIVE_PROFILE_RETURN_CHAIN_001"
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
    explorationProgressionVersion: state.explorationProgressionVersion,
    registeredExplorationRuleCount: state.registeredExplorationRuleCount,
    campaignProfileId: state.campaignProfileId,
    destinationChainId: state.destinationChainId,
    rewardArcProfileId: state.rewardArcProfileId,
    progressionTier: state.progressionTier,
    explorationReason: state.explorationReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const campaignProfileId = sanitizeString(rule.campaignProfileId);
  const destinationChainId = sanitizeString(rule.destinationChainId);
  const rewardArcProfileId = sanitizeString(rule.rewardArcProfileId);
  const progressionTier = sanitizeString(rule.progressionTier);
  const explorationReason = sanitizeString(rule.explorationReason);

  if (!campaignProfileId) {
    throw Object.assign(new Error("MISSING_CAMPAIGN_PROFILE_ID"), {
      reasonCode: "MISSING_CAMPAIGN_PROFILE_ID"
    });
  }
  if (!destinationChainId) {
    throw Object.assign(new Error("MISSING_DESTINATION_CHAIN_ID"), {
      reasonCode: "MISSING_DESTINATION_CHAIN_ID"
    });
  }
  if (!rewardArcProfileId) {
    throw Object.assign(new Error("MISSING_REWARD_ARC_PROFILE_ID"), {
      reasonCode: "MISSING_REWARD_ARC_PROFILE_ID"
    });
  }
  if (!progressionTier) {
    throw Object.assign(new Error("MISSING_PROGRESSION_TIER"), {
      reasonCode: "MISSING_PROGRESSION_TIER"
    });
  }
  if (!explorationReason) {
    throw Object.assign(new Error("MISSING_EXPLORATION_REASON"), {
      reasonCode: "MISSING_EXPLORATION_REASON"
    });
  }

  return deepFreeze({
    campaignProfileId,
    destinationChainId,
    rewardArcProfileId,
    progressionTier,
    explorationReason,
    supportedSeasonalDestinationProfileIds: deepFreeze(
      (rule.supportedSeasonalDestinationProfileIds ?? []).map(String)
    ),
    supportedRoutePriorities: deepFreeze(
      (rule.supportedRoutePriorities ?? []).map(String)
    ),
    supportedAchievementHookProfileIds: deepFreeze(
      (rule.supportedAchievementHookProfileIds ?? []).map(String)
    ),
    supportedQuestNarrativeProfileIds: deepFreeze(
      (rule.supportedQuestNarrativeProfileIds ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    explorationProgressionVersion: version,
    registeredExplorationRuleCount: rules.length,
    campaignProfileId: null,
    destinationChainId: null,
    rewardArcProfileId: null,
    progressionTier: null,
    explorationReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  seasonalDestinationProfileId,
  routePriority,
  achievementHookProfileId,
  questNarrativeProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedSeasonalDestinationProfileIds.includes(
          seasonalDestinationProfileId
        ) &&
        rule.supportedRoutePriorities.includes(routePriority) &&
        rule.supportedAchievementHookProfileIds.includes(
          achievementHookProfileId
        ) &&
        rule.supportedQuestNarrativeProfileIds.includes(
          questNarrativeProfileId
        )
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      explorationProgressionVersion: null,
      registeredExplorationRuleCount: 0,
      campaignProfileId: null,
      destinationChainId: null,
      rewardArcProfileId: null,
      progressionTier: null,
      explorationReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationExplorationProgressionHooks(
  registry,
  {
    seasonalDestinationProfileId,
    routePriority,
    achievementHookProfileId,
    questNarrativeProfileId
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationExplorationProgressionHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_EXPLORATION_PROGRESSION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedSeasonalDestinationProfileId = sanitizeString(
    seasonalDestinationProfileId
  );
  const normalizedRoutePriority = sanitizeString(routePriority);
  const normalizedAchievementHookProfileId = sanitizeString(
    achievementHookProfileId
  );
  const normalizedQuestNarrativeProfileId = sanitizeString(
    questNarrativeProfileId
  );

  if (!normalizedSeasonalDestinationProfileId) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_EXPLORATION_PROGRESSION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      campaignProfileId: null,
      destinationChainId: null,
      rewardArcProfileId: null,
      progressionTier: null,
      explorationReason: "UNSUPPORTED_EXPLORATION_PROGRESSION_CONTEXT",
      reasonCode: "UNSUPPORTED_EXPLORATION_PROGRESSION_CONTEXT"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedSeasonalDestinationProfileId,
    normalizedRoutePriority,
    normalizedAchievementHookProfileId,
    normalizedQuestNarrativeProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_EXPLORATION_PROGRESSION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      campaignProfileId: null,
      destinationChainId: null,
      rewardArcProfileId: null,
      progressionTier: null,
      explorationReason: "UNSUPPORTED_EXPLORATION_PROGRESSION_CONTEXT",
      reasonCode: "UNSUPPORTED_EXPLORATION_PROGRESSION_CONTEXT"
    });
  }

  registry.__state.campaignProfileId = rule.campaignProfileId;
  registry.__state.destinationChainId = rule.destinationChainId;
  registry.__state.rewardArcProfileId = rule.rewardArcProfileId;
  registry.__state.progressionTier = rule.progressionTier;
  registry.__state.explorationReason = rule.explorationReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    campaignProfileId: rule.campaignProfileId,
    destinationChainId: rule.destinationChainId,
    rewardArcProfileId: rule.rewardArcProfileId,
    progressionTier: rule.progressionTier,
    explorationReason: rule.explorationReason
  });
}
