const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_VERSION =
  "atlas_population_world_exploration_cohesion_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_BIG_LAP_STYLE_001",
      metaCollectionId: "META_COLLECTION_EXPEDITION_SET_COASTAL_001",
      crossRegionCampaignId: "CROSS_REGION_CAMPAIGN_COASTAL_NETWORK_001",
      explorationTier: "world_tier_2_regional",
      worldCohesionReason:
        "coastal and nature expedition networks scale into a broader world journey through consistent regional identity, cross-region collection logic, and long-form route progression",
      supportedExpeditionProfileIds: Object.freeze([
        "EXPEDITION_PROFILE_COASTAL_EXPEDITION_001",
        "EXPEDITION_PROFILE_NATURE_JOURNEY_001"
      ]),
      supportedCampaignNetworkIds: Object.freeze([
        "CAMPAIGN_NETWORK_COASTAL_EXPLORATION_001",
        "CAMPAIGN_NETWORK_NATURE_DISCOVERY_001"
      ]),
      supportedProgressionTiers: Object.freeze([
        "tier_2_regional",
        "tier_2_discovery"
      ]),
      supportedRegionalIdentityIds: Object.freeze([
        "REGIONAL_IDENTITY_BELLARINE_COASTAL_001",
        "REGIONAL_IDENTITY_BELLARINE_NATURE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_HERITAGE_ROUTES_001",
      metaCollectionId: "META_COLLECTION_HERITAGE_LANDMARK_SET_001",
      crossRegionCampaignId: "CROSS_REGION_CAMPAIGN_HERITAGE_NETWORK_001",
      explorationTier: "world_tier_3_landmark",
      worldCohesionReason:
        "heritage expedition loops scale into world-class landmark journeys through strong regional identity, collection arcs, and deeper completion milestones",
      supportedExpeditionProfileIds: Object.freeze([
        "EXPEDITION_PROFILE_HERITAGE_LOOP_001"
      ]),
      supportedCampaignNetworkIds: Object.freeze([
        "CAMPAIGN_NETWORK_HERITAGE_LANDMARKS_001"
      ]),
      supportedProgressionTiers: Object.freeze(["tier_3_landmark"]),
      supportedRegionalIdentityIds: Object.freeze([
        "REGIONAL_IDENTITY_BELLARINE_HERITAGE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_COMMUNITY_COLLECTIONS_001",
      metaCollectionId: "META_COLLECTION_LOCAL_JOURNEY_SET_001",
      crossRegionCampaignId: "CROSS_REGION_CAMPAIGN_COMMUNITY_NETWORK_001",
      explorationTier: "world_tier_1_local",
      worldCohesionReason:
        "community expedition networks preserve local identity while connecting neighbourhood returns into wider meta-collections and approachable exploration campaigns",
      supportedExpeditionProfileIds: Object.freeze([
        "EXPEDITION_PROFILE_COMMUNITY_JOURNEY_001"
      ]),
      supportedCampaignNetworkIds: Object.freeze([
        "CAMPAIGN_NETWORK_LOCAL_GATHERINGS_001"
      ]),
      supportedProgressionTiers: Object.freeze(["tier_1_local"]),
      supportedRegionalIdentityIds: Object.freeze([
        "REGIONAL_IDENTITY_BELLARINE_COMMUNITY_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldJourneyProfileId: "WORLD_JOURNEY_PROFILE_GLOBAL_DISCOVERY_001",
      metaCollectionId: "META_COLLECTION_DISCOVERY_MILESTONES_001",
      crossRegionCampaignId: "CROSS_REGION_CAMPAIGN_DISCOVERY_NETWORK_001",
      explorationTier: "world_tier_2_meta",
      worldCohesionReason:
        "discovery-oriented expedition networks scale into larger world exploration cohesion through milestone sets, themed campaigns, and repeatable meta-collection structure",
      supportedExpeditionProfileIds: Object.freeze([
        "EXPEDITION_PROFILE_NATURE_JOURNEY_001",
        "EXPEDITION_PROFILE_COASTAL_EXPEDITION_001"
      ]),
      supportedCampaignNetworkIds: Object.freeze([
        "CAMPAIGN_NETWORK_NATURE_DISCOVERY_001",
        "CAMPAIGN_NETWORK_COASTAL_EXPLORATION_001"
      ]),
      supportedProgressionTiers: Object.freeze([
        "tier_2_discovery",
        "tier_2_regional"
      ]),
      supportedRegionalIdentityIds: Object.freeze([
        "REGIONAL_IDENTITY_BELLARINE_NATURE_001",
        "REGIONAL_IDENTITY_BELLARINE_COASTAL_001"
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
    worldExplorationCohesionVersion: state.worldExplorationCohesionVersion,
    registeredWorldExplorationRuleCount: state.registeredWorldExplorationRuleCount,
    worldJourneyProfileId: state.worldJourneyProfileId,
    metaCollectionId: state.metaCollectionId,
    crossRegionCampaignId: state.crossRegionCampaignId,
    explorationTier: state.explorationTier,
    worldCohesionReason: state.worldCohesionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const worldJourneyProfileId = sanitizeString(rule.worldJourneyProfileId);
  const metaCollectionId = sanitizeString(rule.metaCollectionId);
  const crossRegionCampaignId = sanitizeString(rule.crossRegionCampaignId);
  const explorationTier = sanitizeString(rule.explorationTier);
  const worldCohesionReason = sanitizeString(rule.worldCohesionReason);

  if (!worldJourneyProfileId) {
    throw Object.assign(new Error("MISSING_WORLD_JOURNEY_PROFILE_ID"), {
      reasonCode: "MISSING_WORLD_JOURNEY_PROFILE_ID"
    });
  }
  if (!metaCollectionId) {
    throw Object.assign(new Error("MISSING_META_COLLECTION_ID"), {
      reasonCode: "MISSING_META_COLLECTION_ID"
    });
  }
  if (!crossRegionCampaignId) {
    throw Object.assign(new Error("MISSING_CROSS_REGION_CAMPAIGN_ID"), {
      reasonCode: "MISSING_CROSS_REGION_CAMPAIGN_ID"
    });
  }
  if (!explorationTier) {
    throw Object.assign(new Error("MISSING_WORLD_EXPLORATION_TIER"), {
      reasonCode: "MISSING_WORLD_EXPLORATION_TIER"
    });
  }
  if (!worldCohesionReason) {
    throw Object.assign(new Error("MISSING_WORLD_COHESION_REASON"), {
      reasonCode: "MISSING_WORLD_COHESION_REASON"
    });
  }

  return deepFreeze({
    worldJourneyProfileId,
    metaCollectionId,
    crossRegionCampaignId,
    explorationTier,
    worldCohesionReason,
    supportedExpeditionProfileIds: deepFreeze(
      (rule.supportedExpeditionProfileIds ?? []).map(String)
    ),
    supportedCampaignNetworkIds: deepFreeze(
      (rule.supportedCampaignNetworkIds ?? []).map(String)
    ),
    supportedProgressionTiers: deepFreeze(
      (rule.supportedProgressionTiers ?? []).map(String)
    ),
    supportedRegionalIdentityIds: deepFreeze(
      (rule.supportedRegionalIdentityIds ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    worldExplorationCohesionVersion: version,
    registeredWorldExplorationRuleCount: rules.length,
    worldJourneyProfileId: null,
    metaCollectionId: null,
    crossRegionCampaignId: null,
    explorationTier: null,
    worldCohesionReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  expeditionProfileId,
  campaignNetworkId,
  progressionTier,
  regionalIdentityId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedExpeditionProfileIds.includes(expeditionProfileId) &&
        rule.supportedCampaignNetworkIds.includes(campaignNetworkId) &&
        rule.supportedProgressionTiers.includes(progressionTier) &&
        rule.supportedRegionalIdentityIds.includes(regionalIdentityId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      worldExplorationCohesionVersion: null,
      registeredWorldExplorationRuleCount: 0,
      worldJourneyProfileId: null,
      metaCollectionId: null,
      crossRegionCampaignId: null,
      explorationTier: null,
      worldCohesionReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooks(
  registry,
  { expeditionProfileId, campaignNetworkId, progressionTier, regionalIdentityId } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationWorldExplorationCohesionHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_WORLD_EXPLORATION_COHESION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedExpeditionProfileId = sanitizeString(expeditionProfileId);
  const normalizedCampaignNetworkId = sanitizeString(campaignNetworkId);
  const normalizedProgressionTier = sanitizeString(progressionTier);
  const normalizedRegionalIdentityId = sanitizeString(regionalIdentityId);

  if (!normalizedExpeditionProfileId) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_WORLD_EXPLORATION_COHESION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      worldJourneyProfileId: null,
      metaCollectionId: null,
      crossRegionCampaignId: null,
      explorationTier: null,
      worldCohesionReason: "UNSUPPORTED_WORLD_EXPLORATION_COHESION_CONTEXT",
      reasonCode: "UNSUPPORTED_WORLD_EXPLORATION_COHESION_CONTEXT"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedExpeditionProfileId,
    normalizedCampaignNetworkId,
    normalizedProgressionTier,
    normalizedRegionalIdentityId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_WORLD_EXPLORATION_COHESION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      worldJourneyProfileId: null,
      metaCollectionId: null,
      crossRegionCampaignId: null,
      explorationTier: null,
      worldCohesionReason: "UNSUPPORTED_WORLD_EXPLORATION_COHESION_CONTEXT",
      reasonCode: "UNSUPPORTED_WORLD_EXPLORATION_COHESION_CONTEXT"
    });
  }

  registry.__state.worldJourneyProfileId = rule.worldJourneyProfileId;
  registry.__state.metaCollectionId = rule.metaCollectionId;
  registry.__state.crossRegionCampaignId = rule.crossRegionCampaignId;
  registry.__state.explorationTier = rule.explorationTier;
  registry.__state.worldCohesionReason = rule.worldCohesionReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    worldJourneyProfileId: rule.worldJourneyProfileId,
    metaCollectionId: rule.metaCollectionId,
    crossRegionCampaignId: rule.crossRegionCampaignId,
    explorationTier: rule.explorationTier,
    worldCohesionReason: rule.worldCohesionReason
  });
}
