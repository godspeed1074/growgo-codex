const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_VERSION =
  "atlas_population_regional_expedition_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      expeditionProfileId: "EXPEDITION_PROFILE_COASTAL_EXPEDITION_001",
      campaignNetworkId: "CAMPAIGN_NETWORK_COASTAL_EXPLORATION_001",
      completionArcId: "COMPLETION_ARC_COASTAL_SUMMIT_001",
      regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_COASTAL_001",
      expeditionReason:
        "coastal chains connect scenic and discovery progression into a broader Bellarine coastal expedition with regional completion milestones",
      supportedCampaignProfileIds: Object.freeze([
        "CAMPAIGN_PROFILE_COASTAL_TRAIL_001",
        "CAMPAIGN_PROFILE_DISCOVERY_RETURN_001"
      ]),
      supportedDestinationChainIds: Object.freeze([
        "DESTINATION_CHAIN_COASTAL_TRAIL_001",
        "DESTINATION_CHAIN_DISCOVERY_RETURN_001"
      ]),
      supportedProgressionTiers: Object.freeze([
        "tier_2_regional",
        "tier_2_discovery"
      ]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation"]),
      supportedRegionIds: Object.freeze([
        "BELLARINE",
        "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
      ]),
      status: "approved"
    }),
    Object.freeze({
      expeditionProfileId: "EXPEDITION_PROFILE_HERITAGE_LOOP_001",
      campaignNetworkId: "CAMPAIGN_NETWORK_HERITAGE_LANDMARKS_001",
      completionArcId: "COMPLETION_ARC_HERITAGE_COLLECTION_001",
      regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_HERITAGE_001",
      expeditionReason:
        "heritage chains connect landmark campaigns, civic districts, and collection-style progression into a regional heritage loop",
      supportedCampaignProfileIds: Object.freeze([
        "CAMPAIGN_PROFILE_HERITAGE_ROUTE_001"
      ]),
      supportedDestinationChainIds: Object.freeze([
        "DESTINATION_CHAIN_HERITAGE_ROUTE_001"
      ]),
      supportedProgressionTiers: Object.freeze(["tier_3_landmark"]),
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use"]),
      supportedRegionIds: Object.freeze([
        "BELLARINE",
        "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
      ]),
      status: "approved"
    }),
    Object.freeze({
      expeditionProfileId: "EXPEDITION_PROFILE_COMMUNITY_JOURNEY_001",
      campaignNetworkId: "CAMPAIGN_NETWORK_LOCAL_GATHERINGS_001",
      completionArcId: "COMPLETION_ARC_COMMUNITY_RETURN_001",
      regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_COMMUNITY_001",
      expeditionReason:
        "community chains connect local journeys, neighbourhood destinations, and repeat-return progression into a coherent regional community campaign",
      supportedCampaignProfileIds: Object.freeze([
        "CAMPAIGN_PROFILE_COMMUNITY_JOURNEY_001"
      ]),
      supportedDestinationChainIds: Object.freeze([
        "DESTINATION_CHAIN_COMMUNITY_JOURNEY_001"
      ]),
      supportedProgressionTiers: Object.freeze(["tier_1_local"]),
      supportedDistrictTypes: Object.freeze(["residential", "civic", "recreation"]),
      supportedRegionIds: Object.freeze([
        "BELLARINE",
        "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
      ]),
      status: "approved"
    }),
    Object.freeze({
      expeditionProfileId: "EXPEDITION_PROFILE_NATURE_JOURNEY_001",
      campaignNetworkId: "CAMPAIGN_NETWORK_NATURE_DISCOVERY_001",
      completionArcId: "COMPLETION_ARC_DISCOVERY_CHAIN_001",
      regionalIdentityId: "REGIONAL_IDENTITY_BELLARINE_NATURE_001",
      expeditionReason:
        "nature-oriented chains connect discovery campaigns, coastal and open-space districts, and milestone arcs into a long-form exploration journey",
      supportedCampaignProfileIds: Object.freeze([
        "CAMPAIGN_PROFILE_DISCOVERY_RETURN_001",
        "CAMPAIGN_PROFILE_COASTAL_TRAIL_001"
      ]),
      supportedDestinationChainIds: Object.freeze([
        "DESTINATION_CHAIN_DISCOVERY_RETURN_001",
        "DESTINATION_CHAIN_COASTAL_TRAIL_001"
      ]),
      supportedProgressionTiers: Object.freeze([
        "tier_2_discovery",
        "tier_2_regional"
      ]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "recreation", "mixed_use"]),
      supportedRegionIds: Object.freeze([
        "BELLARINE",
        "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
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
    regionalExpeditionVersion: state.regionalExpeditionVersion,
    registeredExpeditionRuleCount: state.registeredExpeditionRuleCount,
    expeditionProfileId: state.expeditionProfileId,
    campaignNetworkId: state.campaignNetworkId,
    completionArcId: state.completionArcId,
    regionalIdentityId: state.regionalIdentityId,
    expeditionReason: state.expeditionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const expeditionProfileId = sanitizeString(rule.expeditionProfileId);
  const campaignNetworkId = sanitizeString(rule.campaignNetworkId);
  const completionArcId = sanitizeString(rule.completionArcId);
  const regionalIdentityId = sanitizeString(rule.regionalIdentityId);
  const expeditionReason = sanitizeString(rule.expeditionReason);

  if (!expeditionProfileId) {
    throw Object.assign(new Error("MISSING_EXPEDITION_PROFILE_ID"), {
      reasonCode: "MISSING_EXPEDITION_PROFILE_ID"
    });
  }
  if (!campaignNetworkId) {
    throw Object.assign(new Error("MISSING_CAMPAIGN_NETWORK_ID"), {
      reasonCode: "MISSING_CAMPAIGN_NETWORK_ID"
    });
  }
  if (!completionArcId) {
    throw Object.assign(new Error("MISSING_COMPLETION_ARC_ID"), {
      reasonCode: "MISSING_COMPLETION_ARC_ID"
    });
  }
  if (!regionalIdentityId) {
    throw Object.assign(new Error("MISSING_REGIONAL_IDENTITY_ID"), {
      reasonCode: "MISSING_REGIONAL_IDENTITY_ID"
    });
  }
  if (!expeditionReason) {
    throw Object.assign(new Error("MISSING_EXPEDITION_REASON"), {
      reasonCode: "MISSING_EXPEDITION_REASON"
    });
  }

  return deepFreeze({
    expeditionProfileId,
    campaignNetworkId,
    completionArcId,
    regionalIdentityId,
    expeditionReason,
    supportedCampaignProfileIds: deepFreeze(
      (rule.supportedCampaignProfileIds ?? []).map(String)
    ),
    supportedDestinationChainIds: deepFreeze(
      (rule.supportedDestinationChainIds ?? []).map(String)
    ),
    supportedProgressionTiers: deepFreeze(
      (rule.supportedProgressionTiers ?? []).map(String)
    ),
    supportedDistrictTypes: deepFreeze(
      (rule.supportedDistrictTypes ?? []).map(String)
    ),
    supportedRegionIds: deepFreeze((rule.supportedRegionIds ?? []).map(String)),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    regionalExpeditionVersion: version,
    registeredExpeditionRuleCount: rules.length,
    expeditionProfileId: null,
    campaignNetworkId: null,
    completionArcId: null,
    regionalIdentityId: null,
    expeditionReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  campaignProfileId,
  destinationChainId,
  progressionTier,
  districtType,
  regionId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedCampaignProfileIds.includes(campaignProfileId) &&
        rule.supportedDestinationChainIds.includes(destinationChainId) &&
        rule.supportedProgressionTiers.includes(progressionTier) &&
        rule.supportedDistrictTypes.includes(districtType) &&
        rule.supportedRegionIds.includes(regionId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      regionalExpeditionVersion: null,
      registeredExpeditionRuleCount: 0,
      expeditionProfileId: null,
      campaignNetworkId: null,
      completionArcId: null,
      regionalIdentityId: null,
      expeditionReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationRegionalExpeditionHooks(
  registry,
  { campaignProfileId, destinationChainId, progressionTier, districtType, regionId } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationRegionalExpeditionHooksRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_REGIONAL_EXPEDITION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedCampaignProfileId = sanitizeString(campaignProfileId);
  const normalizedDestinationChainId = sanitizeString(destinationChainId);
  const normalizedProgressionTier = sanitizeString(progressionTier);
  const normalizedDistrictType = sanitizeString(districtType);
  const normalizedRegionId = sanitizeString(regionId);

  if (!normalizedCampaignProfileId) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_REGIONAL_EXPEDITION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      expeditionProfileId: null,
      campaignNetworkId: null,
      completionArcId: null,
      regionalIdentityId: null,
      expeditionReason: "UNSUPPORTED_REGIONAL_EXPEDITION_CONTEXT",
      reasonCode: "UNSUPPORTED_REGIONAL_EXPEDITION_CONTEXT"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedCampaignProfileId,
    normalizedDestinationChainId,
    normalizedProgressionTier,
    normalizedDistrictType,
    normalizedRegionId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_REGIONAL_EXPEDITION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      expeditionProfileId: null,
      campaignNetworkId: null,
      completionArcId: null,
      regionalIdentityId: null,
      expeditionReason: "UNSUPPORTED_REGIONAL_EXPEDITION_CONTEXT",
      reasonCode: "UNSUPPORTED_REGIONAL_EXPEDITION_CONTEXT"
    });
  }

  registry.__state.expeditionProfileId = rule.expeditionProfileId;
  registry.__state.campaignNetworkId = rule.campaignNetworkId;
  registry.__state.completionArcId = rule.completionArcId;
  registry.__state.regionalIdentityId = rule.regionalIdentityId;
  registry.__state.expeditionReason = rule.expeditionReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    expeditionProfileId: rule.expeditionProfileId,
    campaignNetworkId: rule.campaignNetworkId,
    completionArcId: rule.completionArcId,
    regionalIdentityId: rule.regionalIdentityId,
    expeditionReason: rule.expeditionReason
  });
}
