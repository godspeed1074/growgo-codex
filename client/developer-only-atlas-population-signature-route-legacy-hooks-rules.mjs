const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_VERSION =
  "atlas_population_signature_route_legacy_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COASTAL_BIG_LAP_001",
      legacyDestinationId: "LEGACY_DESTINATION_COASTAL_REVEAL_001",
      mythologyProfileId: "MYTHOLOGY_PROFILE_SCENIC_EXPLORER_001",
      globalJourneyTier: "global_tier_2_signature",
      legacyReason:
        "coastal and nature world journeys become iconic signature routes when scenic route memory, natural place memory, and regional coastal identity align into a larger exploration mythology",
      supportedWorldJourneyProfileIds: Object.freeze([
        "WORLD_JOURNEY_PROFILE_BIG_LAP_STYLE_001",
        "WORLD_JOURNEY_PROFILE_GLOBAL_DISCOVERY_001"
      ]),
      supportedRouteMemoryIds: Object.freeze([
        "ROUTE_MEMORY_SCENIC_COASTAL_001",
        "ROUTE_MEMORY_DISCOVERY_CHAIN_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_NATURAL_WONDER_001",
        "PLACE_MEMORY_HIDDEN_DISCOVERY_001"
      ]),
      supportedRegionalIdentityIds: Object.freeze([
        "REGIONAL_IDENTITY_BELLARINE_COASTAL_001",
        "REGIONAL_IDENTITY_BELLARINE_NATURE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_HERITAGE_LEGACY_001",
      legacyDestinationId: "LEGACY_DESTINATION_HERITAGE_LANDMARK_001",
      mythologyProfileId: "MYTHOLOGY_PROFILE_HERITAGE_COLLECTOR_001",
      globalJourneyTier: "global_tier_3_legendary",
      legacyReason:
        "heritage world journeys become legendary destination loops when landmark route memory, historic place memory, and heritage regional identity reinforce one another",
      supportedWorldJourneyProfileIds: Object.freeze([
        "WORLD_JOURNEY_PROFILE_HERITAGE_ROUTES_001"
      ]),
      supportedRouteMemoryIds: Object.freeze([
        "ROUTE_MEMORY_HERITAGE_LANDMARK_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_HISTORIC_LANDMARK_001"
      ]),
      supportedRegionalIdentityIds: Object.freeze([
        "REGIONAL_IDENTITY_BELLARINE_HERITAGE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_COMMUNITY_RETURN_001",
      legacyDestinationId: "LEGACY_DESTINATION_COMMUNITY_ANCHOR_001",
      mythologyProfileId: "MYTHOLOGY_PROFILE_LOCAL_MEMORY_KEEPER_001",
      globalJourneyTier: "global_tier_1_local_legend",
      legacyReason:
        "community-scale world journeys gain local legend status when return routes, community place memory, and neighbourhood regional identity reinforce repeat visits and familiar stories",
      supportedWorldJourneyProfileIds: Object.freeze([
        "WORLD_JOURNEY_PROFILE_COMMUNITY_COLLECTIONS_001"
      ]),
      supportedRouteMemoryIds: Object.freeze([
        "ROUTE_MEMORY_PARK_TRAIL_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_COMMUNITY_SITE_001"
      ]),
      supportedRegionalIdentityIds: Object.freeze([
        "REGIONAL_IDENTITY_BELLARINE_COMMUNITY_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      signatureRouteProfileId: "SIGNATURE_ROUTE_PROFILE_DISCOVERY_ODYSSEY_001",
      legacyDestinationId: "LEGACY_DESTINATION_DISCOVERY_MILESTONE_001",
      mythologyProfileId: "MYTHOLOGY_PROFILE_GLOBAL_DISCOVERY_ODYSSEY_001",
      globalJourneyTier: "global_tier_2_mythic",
      legacyReason:
        "discovery-focused world journeys gain mythic destination continuity when exploration routes, hidden discovery memory, and nature-led regional identity scale into long-form player mythology",
      supportedWorldJourneyProfileIds: Object.freeze([
        "WORLD_JOURNEY_PROFILE_GLOBAL_DISCOVERY_001",
        "WORLD_JOURNEY_PROFILE_BIG_LAP_STYLE_001"
      ]),
      supportedRouteMemoryIds: Object.freeze([
        "ROUTE_MEMORY_DISCOVERY_CHAIN_001"
      ]),
      supportedPlaceMemoryIds: Object.freeze([
        "PLACE_MEMORY_HIDDEN_DISCOVERY_001"
      ]),
      supportedRegionalIdentityIds: Object.freeze([
        "REGIONAL_IDENTITY_BELLARINE_NATURE_001"
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
    signatureRouteLegacyVersion: state.signatureRouteLegacyVersion,
    registeredSignatureRouteLegacyRuleCount:
      state.registeredSignatureRouteLegacyRuleCount,
    signatureRouteProfileId: state.signatureRouteProfileId,
    legacyDestinationId: state.legacyDestinationId,
    mythologyProfileId: state.mythologyProfileId,
    globalJourneyTier: state.globalJourneyTier,
    legacyReason: state.legacyReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const signatureRouteProfileId = sanitizeString(rule.signatureRouteProfileId);
  const legacyDestinationId = sanitizeString(rule.legacyDestinationId);
  const mythologyProfileId = sanitizeString(rule.mythologyProfileId);
  const globalJourneyTier = sanitizeString(rule.globalJourneyTier);
  const legacyReason = sanitizeString(rule.legacyReason);

  if (!signatureRouteProfileId) {
    throw Object.assign(new Error("MISSING_SIGNATURE_ROUTE_PROFILE_ID"), {
      reasonCode: "MISSING_SIGNATURE_ROUTE_PROFILE_ID"
    });
  }
  if (!legacyDestinationId) {
    throw Object.assign(new Error("MISSING_LEGACY_DESTINATION_ID"), {
      reasonCode: "MISSING_LEGACY_DESTINATION_ID"
    });
  }
  if (!mythologyProfileId) {
    throw Object.assign(new Error("MISSING_MYTHOLOGY_PROFILE_ID"), {
      reasonCode: "MISSING_MYTHOLOGY_PROFILE_ID"
    });
  }
  if (!globalJourneyTier) {
    throw Object.assign(new Error("MISSING_GLOBAL_JOURNEY_TIER"), {
      reasonCode: "MISSING_GLOBAL_JOURNEY_TIER"
    });
  }
  if (!legacyReason) {
    throw Object.assign(new Error("MISSING_LEGACY_REASON"), {
      reasonCode: "MISSING_LEGACY_REASON"
    });
  }

  return deepFreeze({
    signatureRouteProfileId,
    legacyDestinationId,
    mythologyProfileId,
    globalJourneyTier,
    legacyReason,
    supportedWorldJourneyProfileIds: deepFreeze(
      (rule.supportedWorldJourneyProfileIds ?? []).map(String)
    ),
    supportedRouteMemoryIds: deepFreeze(
      (rule.supportedRouteMemoryIds ?? []).map(String)
    ),
    supportedPlaceMemoryIds: deepFreeze(
      (rule.supportedPlaceMemoryIds ?? []).map(String)
    ),
    supportedRegionalIdentityIds: deepFreeze(
      (rule.supportedRegionalIdentityIds ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    signatureRouteLegacyVersion: version,
    registeredSignatureRouteLegacyRuleCount: rules.length,
    signatureRouteProfileId: null,
    legacyDestinationId: null,
    mythologyProfileId: null,
    globalJourneyTier: null,
    legacyReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  worldJourneyProfileId,
  routeMemoryId,
  placeMemoryId,
  regionalIdentityId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedWorldJourneyProfileIds.includes(worldJourneyProfileId) &&
        rule.supportedRouteMemoryIds.includes(routeMemoryId) &&
        rule.supportedPlaceMemoryIds.includes(placeMemoryId) &&
        rule.supportedRegionalIdentityIds.includes(regionalIdentityId)
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      signatureRouteLegacyVersion: null,
      registeredSignatureRouteLegacyRuleCount: 0,
      signatureRouteProfileId: null,
      legacyDestinationId: null,
      mythologyProfileId: null,
      globalJourneyTier: null,
      legacyReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooks(
  registry,
  {
    worldJourneyProfileId = null,
    routeMemoryId = null,
    placeMemoryId = null,
    regionalIdentityId = null
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSignatureRouteLegacyHooksRuleRegistry ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_SIGNATURE_ROUTE_LEGACY_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedWorldJourneyProfileId = sanitizeString(worldJourneyProfileId);
  const normalizedRouteMemoryId = sanitizeString(routeMemoryId);
  const normalizedPlaceMemoryId = sanitizeString(placeMemoryId);
  const normalizedRegionalIdentityId = sanitizeString(regionalIdentityId);

  const rule = chooseRule(
    registry,
    normalizedWorldJourneyProfileId,
    normalizedRouteMemoryId,
    normalizedPlaceMemoryId,
    normalizedRegionalIdentityId
  );

  if (!rule) {
    registry.__state.signatureRouteProfileId = null;
    registry.__state.legacyDestinationId = null;
    registry.__state.mythologyProfileId = null;
    registry.__state.globalJourneyTier = null;
    registry.__state.legacyReason = null;
    registry.__state.lastFailureReason =
      "UNSUPPORTED_SIGNATURE_ROUTE_LEGACY_CONTEXT";

    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      signatureRouteProfileId: null,
      legacyDestinationId: null,
      mythologyProfileId: null,
      globalJourneyTier: null,
      legacyReason: "UNSUPPORTED_SIGNATURE_ROUTE_LEGACY_CONTEXT",
      reasonCode: "UNSUPPORTED_SIGNATURE_ROUTE_LEGACY_CONTEXT"
    });
  }

  registry.__state.signatureRouteProfileId = rule.signatureRouteProfileId;
  registry.__state.legacyDestinationId = rule.legacyDestinationId;
  registry.__state.mythologyProfileId = rule.mythologyProfileId;
  registry.__state.globalJourneyTier = rule.globalJourneyTier;
  registry.__state.legacyReason = rule.legacyReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    signatureRouteProfileId: rule.signatureRouteProfileId,
    legacyDestinationId: rule.legacyDestinationId,
    mythologyProfileId: rule.mythologyProfileId,
    globalJourneyTier: rule.globalJourneyTier,
    legacyReason: rule.legacyReason,
    reasonCode: "RESOLVED"
  });
}
