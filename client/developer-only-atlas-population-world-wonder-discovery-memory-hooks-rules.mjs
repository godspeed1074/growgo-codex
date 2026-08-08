const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_VERSION =
  "atlas_population_world_wonder_discovery_memory_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      worldWonderProfileId: "WORLD_WONDER_PROFILE_COASTAL_NATURAL_WONDER_001",
      epicDestinationId: "EPIC_DESTINATION_COASTAL_REVEAL_001",
      discoveryMemoryTier: "discovery_memory_tier_2_enduring",
      generationMemoryProfileId:
        "GENERATION_MEMORY_PROFILE_SHARED_COASTAL_DISCOVERY_001",
      wonderReason:
        "coastal scenic routes with natural-wonder memory and signature journey identity become enduring world-wonder destinations with long-lived shared discovery significance",
      supportedSignatureRouteProfileIds: Object.freeze([
        "SIGNATURE_ROUTE_PROFILE_COASTAL_BIG_LAP_001"
      ]),
      supportedWorldJourneyProfileIds: Object.freeze([
        "WORLD_JOURNEY_PROFILE_BIG_LAP_STYLE_001",
        "WORLD_JOURNEY_PROFILE_GLOBAL_DISCOVERY_001"
      ]),
      supportedLegacyDestinationIds: Object.freeze([
        "LEGACY_DESTINATION_COASTAL_REVEAL_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_NATURAL_WONDER_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldWonderProfileId: "WORLD_WONDER_PROFILE_HERITAGE_ICON_001",
      epicDestinationId: "EPIC_DESTINATION_HERITAGE_ICON_001",
      discoveryMemoryTier: "discovery_memory_tier_3_legendary",
      generationMemoryProfileId:
        "GENERATION_MEMORY_PROFILE_CROSS_GENERATION_HERITAGE_001",
      wonderReason:
        "heritage signature journeys with historic place memory become iconic world-wonder destinations whose importance survives across generations of shared discovery",
      supportedSignatureRouteProfileIds: Object.freeze([
        "SIGNATURE_ROUTE_PROFILE_HERITAGE_LEGACY_001"
      ]),
      supportedWorldJourneyProfileIds: Object.freeze([
        "WORLD_JOURNEY_PROFILE_HERITAGE_ROUTES_001"
      ]),
      supportedLegacyDestinationIds: Object.freeze([
        "LEGACY_DESTINATION_HERITAGE_LANDMARK_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_HISTORIC_LANDMARK_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldWonderProfileId: "WORLD_WONDER_PROFILE_COMMUNITY_DISCOVERY_ANCHOR_001",
      epicDestinationId: "EPIC_DESTINATION_COMMUNITY_RETURN_001",
      discoveryMemoryTier: "discovery_memory_tier_1_local_enduring",
      generationMemoryProfileId:
        "GENERATION_MEMORY_PROFILE_SHARED_COMMUNITY_RETURN_001",
      wonderReason:
        "community signature routes with local place memory become long-lived discovery anchors whose significance persists through repeat visits and shared community stories",
      supportedSignatureRouteProfileIds: Object.freeze([
        "SIGNATURE_ROUTE_PROFILE_COMMUNITY_RETURN_001"
      ]),
      supportedWorldJourneyProfileIds: Object.freeze([
        "WORLD_JOURNEY_PROFILE_COMMUNITY_COLLECTIONS_001"
      ]),
      supportedLegacyDestinationIds: Object.freeze([
        "LEGACY_DESTINATION_COMMUNITY_ANCHOR_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_COMMUNITY_SITE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldWonderProfileId: "WORLD_WONDER_PROFILE_DISCOVERY_MYTHIC_SITE_001",
      epicDestinationId: "EPIC_DESTINATION_DISCOVERY_ODYSSEY_001",
      discoveryMemoryTier: "discovery_memory_tier_2_mythic",
      generationMemoryProfileId:
        "GENERATION_MEMORY_PROFILE_LONG_FORM_DISCOVERY_001",
      wonderReason:
        "mythic discovery routes with hidden place memory become epic destinations whose story significance spans long-form journeys and cross-generation exploration memory",
      supportedSignatureRouteProfileIds: Object.freeze([
        "SIGNATURE_ROUTE_PROFILE_DISCOVERY_ODYSSEY_001"
      ]),
      supportedWorldJourneyProfileIds: Object.freeze([
        "WORLD_JOURNEY_PROFILE_GLOBAL_DISCOVERY_001"
      ]),
      supportedLegacyDestinationIds: Object.freeze([
        "LEGACY_DESTINATION_DISCOVERY_MILESTONE_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_HIDDEN_DISCOVERY_001"
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
    worldWonderDiscoveryMemoryVersion: state.worldWonderDiscoveryMemoryVersion,
    registeredWorldWonderRuleCount: state.registeredWorldWonderRuleCount,
    worldWonderProfileId: state.worldWonderProfileId,
    epicDestinationId: state.epicDestinationId,
    discoveryMemoryTier: state.discoveryMemoryTier,
    generationMemoryProfileId: state.generationMemoryProfileId,
    wonderReason: state.wonderReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const worldWonderProfileId = sanitizeString(rule.worldWonderProfileId);
  const epicDestinationId = sanitizeString(rule.epicDestinationId);
  const discoveryMemoryTier = sanitizeString(rule.discoveryMemoryTier);
  const generationMemoryProfileId = sanitizeString(
    rule.generationMemoryProfileId
  );
  const wonderReason = sanitizeString(rule.wonderReason);

  if (!worldWonderProfileId) {
    throw Object.assign(new Error("MISSING_WORLD_WONDER_PROFILE_ID"), {
      reasonCode: "MISSING_WORLD_WONDER_PROFILE_ID"
    });
  }
  if (!epicDestinationId) {
    throw Object.assign(new Error("MISSING_EPIC_DESTINATION_ID"), {
      reasonCode: "MISSING_EPIC_DESTINATION_ID"
    });
  }
  if (!discoveryMemoryTier) {
    throw Object.assign(new Error("MISSING_DISCOVERY_MEMORY_TIER"), {
      reasonCode: "MISSING_DISCOVERY_MEMORY_TIER"
    });
  }
  if (!generationMemoryProfileId) {
    throw Object.assign(new Error("MISSING_GENERATION_MEMORY_PROFILE_ID"), {
      reasonCode: "MISSING_GENERATION_MEMORY_PROFILE_ID"
    });
  }
  if (!wonderReason) {
    throw Object.assign(new Error("MISSING_WONDER_REASON"), {
      reasonCode: "MISSING_WONDER_REASON"
    });
  }

  return deepFreeze({
    worldWonderProfileId,
    epicDestinationId,
    discoveryMemoryTier,
    generationMemoryProfileId,
    wonderReason,
    supportedSignatureRouteProfileIds: deepFreeze(
      (rule.supportedSignatureRouteProfileIds ?? []).map(String)
    ),
    supportedWorldJourneyProfileIds: deepFreeze(
      (rule.supportedWorldJourneyProfileIds ?? []).map(String)
    ),
    supportedLegacyDestinationIds: deepFreeze(
      (rule.supportedLegacyDestinationIds ?? []).map(String)
    ),
    supportedPlaceMemoryIds: deepFreeze(
      (rule.supportedPlaceMemoryIds ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    worldWonderDiscoveryMemoryVersion: version,
    registeredWorldWonderRuleCount: rules.length,
    worldWonderProfileId: null,
    epicDestinationId: null,
    discoveryMemoryTier: null,
    generationMemoryProfileId: null,
    wonderReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  signatureRouteProfileId,
  worldJourneyProfileId,
  legacyDestinationId,
  placeMemoryId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedSignatureRouteProfileIds.includes(
          signatureRouteProfileId
        ) &&
        rule.supportedWorldJourneyProfileIds.includes(worldJourneyProfileId) &&
        rule.supportedLegacyDestinationIds.includes(legacyDestinationId) &&
        rule.supportedPlaceMemoryIds.includes(placeMemoryId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      worldWonderDiscoveryMemoryVersion: null,
      registeredWorldWonderRuleCount: 0,
      worldWonderProfileId: null,
      epicDestinationId: null,
      discoveryMemoryTier: null,
      generationMemoryProfileId: null,
      wonderReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooks(
  registry,
  {
    signatureRouteProfileId = null,
    worldJourneyProfileId = null,
    legacyDestinationId = null,
    placeMemoryId = null
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationWorldWonderDiscoveryMemoryHooksRuleRegistry ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_WORLD_WONDER_DISCOVERY_MEMORY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedSignatureRouteProfileId = sanitizeString(
    signatureRouteProfileId
  );
  const normalizedWorldJourneyProfileId = sanitizeString(worldJourneyProfileId);
  const normalizedLegacyDestinationId = sanitizeString(legacyDestinationId);
  const normalizedPlaceMemoryId = sanitizeString(placeMemoryId);

  const rule = chooseRule(
    registry,
    normalizedSignatureRouteProfileId,
    normalizedWorldJourneyProfileId,
    normalizedLegacyDestinationId,
    normalizedPlaceMemoryId
  );

  if (!rule) {
    registry.__state.worldWonderProfileId = null;
    registry.__state.epicDestinationId = null;
    registry.__state.discoveryMemoryTier = null;
    registry.__state.generationMemoryProfileId = null;
    registry.__state.wonderReason = null;
    registry.__state.lastFailureReason =
      "UNSUPPORTED_WORLD_WONDER_DISCOVERY_MEMORY_CONTEXT";

    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      worldWonderProfileId: null,
      epicDestinationId: null,
      discoveryMemoryTier: null,
      generationMemoryProfileId: null,
      wonderReason: "UNSUPPORTED_WORLD_WONDER_DISCOVERY_MEMORY_CONTEXT",
      reasonCode: "UNSUPPORTED_WORLD_WONDER_DISCOVERY_MEMORY_CONTEXT"
    });
  }

  registry.__state.worldWonderProfileId = rule.worldWonderProfileId;
  registry.__state.epicDestinationId = rule.epicDestinationId;
  registry.__state.discoveryMemoryTier = rule.discoveryMemoryTier;
  registry.__state.generationMemoryProfileId = rule.generationMemoryProfileId;
  registry.__state.wonderReason = rule.wonderReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    worldWonderProfileId: rule.worldWonderProfileId,
    epicDestinationId: rule.epicDestinationId,
    discoveryMemoryTier: rule.discoveryMemoryTier,
    generationMemoryProfileId: rule.generationMemoryProfileId,
    wonderReason: rule.wonderReason,
    reasonCode: "RESOLVED"
  });
}
