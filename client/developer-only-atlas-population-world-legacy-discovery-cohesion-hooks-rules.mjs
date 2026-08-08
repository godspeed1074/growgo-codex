const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_VERSION =
  "atlas_population_world_legacy_discovery_cohesion_hooks_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_RULES =
  Object.freeze([
    Object.freeze({
      worldLegacyProfileId: "WORLD_LEGACY_PROFILE_COASTAL_ICON_001",
      discoveryCohesionId: "DISCOVERY_COHESION_COASTAL_COLLECTION_001",
      legacyTier: "legacy_tier_2_enduring",
      memoryCategory: "shared_world_icon",
      legacyReason:
        "coastal wonders, signature routes, and expedition collections reinforce one another into an enduring world legacy that is separate from any single player journey",
      supportedWorldWonderProfileIds: Object.freeze([
        "WORLD_WONDER_PROFILE_COASTAL_NATURAL_WONDER_001"
      ]),
      supportedSignatureRouteProfileIds: Object.freeze([
        "SIGNATURE_ROUTE_PROFILE_COASTAL_BIG_LAP_001"
      ]),
      supportedMetaCollectionIds: Object.freeze([
        "META_COLLECTION_EXPEDITION_SET_COASTAL_001",
        "META_COLLECTION_DISCOVERY_MILESTONES_001"
      ]),
      supportedGenerationMemoryProfileIds: Object.freeze([
        "GENERATION_MEMORY_PROFILE_SHARED_COASTAL_DISCOVERY_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldLegacyProfileId: "WORLD_LEGACY_PROFILE_HERITAGE_DESTINATION_001",
      discoveryCohesionId: "DISCOVERY_COHESION_HERITAGE_COLLECTION_001",
      legacyTier: "legacy_tier_3_legendary",
      memoryCategory: "historic_world_legacy",
      legacyReason:
        "heritage wonders, landmark routes, and heritage collections create a legendary world legacy that belongs to the world identity rather than individual player progress",
      supportedWorldWonderProfileIds: Object.freeze([
        "WORLD_WONDER_PROFILE_HERITAGE_ICON_001"
      ]),
      supportedSignatureRouteProfileIds: Object.freeze([
        "SIGNATURE_ROUTE_PROFILE_HERITAGE_LEGACY_001"
      ]),
      supportedMetaCollectionIds: Object.freeze([
        "META_COLLECTION_HERITAGE_LANDMARK_SET_001"
      ]),
      supportedGenerationMemoryProfileIds: Object.freeze([
        "GENERATION_MEMORY_PROFILE_CROSS_GENERATION_HERITAGE_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldLegacyProfileId: "WORLD_LEGACY_PROFILE_COMMUNITY_ROUTE_001",
      discoveryCohesionId: "DISCOVERY_COHESION_COMMUNITY_MEMORY_001",
      legacyTier: "legacy_tier_1_local_enduring",
      memoryCategory: "community_world_memory",
      legacyReason:
        "community anchors, return routes, and local collections create a durable world memory that persists as place identity without depending on player-specific achievements",
      supportedWorldWonderProfileIds: Object.freeze([
        "WORLD_WONDER_PROFILE_COMMUNITY_DISCOVERY_ANCHOR_001"
      ]),
      supportedSignatureRouteProfileIds: Object.freeze([
        "SIGNATURE_ROUTE_PROFILE_COMMUNITY_RETURN_001"
      ]),
      supportedMetaCollectionIds: Object.freeze([
        "META_COLLECTION_LOCAL_JOURNEY_SET_001"
      ]),
      supportedGenerationMemoryProfileIds: Object.freeze([
        "GENERATION_MEMORY_PROFILE_SHARED_COMMUNITY_RETURN_001"
      ]),
      status: "approved"
    }),
    Object.freeze({
      worldLegacyProfileId: "WORLD_LEGACY_PROFILE_DISCOVERY_ODYSSEY_001",
      discoveryCohesionId: "DISCOVERY_COHESION_MYTHIC_ODYSSEY_001",
      legacyTier: "legacy_tier_2_mythic",
      memoryCategory: "mythic_world_discovery",
      legacyReason:
        "mythic wonders, odyssey routes, and discovery collections cohere into a long-lived world legacy whose significance remains stable beyond any one player campaign",
      supportedWorldWonderProfileIds: Object.freeze([
        "WORLD_WONDER_PROFILE_DISCOVERY_MYTHIC_SITE_001"
      ]),
      supportedSignatureRouteProfileIds: Object.freeze([
        "SIGNATURE_ROUTE_PROFILE_DISCOVERY_ODYSSEY_001"
      ]),
      supportedMetaCollectionIds: Object.freeze([
        "META_COLLECTION_DISCOVERY_MILESTONES_001"
      ]),
      supportedGenerationMemoryProfileIds: Object.freeze([
        "GENERATION_MEMORY_PROFILE_LONG_FORM_DISCOVERY_001"
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
    worldLegacyDiscoveryCohesionVersion:
      state.worldLegacyDiscoveryCohesionVersion,
    registeredWorldLegacyRuleCount: state.registeredWorldLegacyRuleCount,
    worldLegacyProfileId: state.worldLegacyProfileId,
    discoveryCohesionId: state.discoveryCohesionId,
    legacyTier: state.legacyTier,
    memoryCategory: state.memoryCategory,
    legacyReason: state.legacyReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const worldLegacyProfileId = sanitizeString(rule.worldLegacyProfileId);
  const discoveryCohesionId = sanitizeString(rule.discoveryCohesionId);
  const legacyTier = sanitizeString(rule.legacyTier);
  const memoryCategory = sanitizeString(rule.memoryCategory);
  const legacyReason = sanitizeString(rule.legacyReason);

  if (!worldLegacyProfileId) {
    throw Object.assign(new Error("MISSING_WORLD_LEGACY_PROFILE_ID"), {
      reasonCode: "MISSING_WORLD_LEGACY_PROFILE_ID"
    });
  }
  if (!discoveryCohesionId) {
    throw Object.assign(new Error("MISSING_DISCOVERY_COHESION_ID"), {
      reasonCode: "MISSING_DISCOVERY_COHESION_ID"
    });
  }
  if (!legacyTier) {
    throw Object.assign(new Error("MISSING_LEGACY_TIER"), {
      reasonCode: "MISSING_LEGACY_TIER"
    });
  }
  if (!memoryCategory) {
    throw Object.assign(new Error("MISSING_MEMORY_CATEGORY"), {
      reasonCode: "MISSING_MEMORY_CATEGORY"
    });
  }
  if (!legacyReason) {
    throw Object.assign(new Error("MISSING_LEGACY_REASON"), {
      reasonCode: "MISSING_LEGACY_REASON"
    });
  }

  return deepFreeze({
    worldLegacyProfileId,
    discoveryCohesionId,
    legacyTier,
    memoryCategory,
    legacyReason,
    supportedWorldWonderProfileIds: deepFreeze(
      (rule.supportedWorldWonderProfileIds ?? []).map(String)
    ),
    supportedSignatureRouteProfileIds: deepFreeze(
      (rule.supportedSignatureRouteProfileIds ?? []).map(String)
    ),
    supportedMetaCollectionIds: deepFreeze(
      (rule.supportedMetaCollectionIds ?? []).map(String)
    ),
    supportedGenerationMemoryProfileIds: deepFreeze(
      (rule.supportedGenerationMemoryProfileIds ?? []).map(String)
    ),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    worldLegacyDiscoveryCohesionVersion: version,
    registeredWorldLegacyRuleCount: rules.length,
    worldLegacyProfileId: null,
    discoveryCohesionId: null,
    legacyTier: null,
    memoryCategory: null,
    legacyReason: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  worldWonderProfileId,
  signatureRouteProfileId,
  metaCollectionId,
  generationMemoryProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedWorldWonderProfileIds.includes(worldWonderProfileId) &&
        rule.supportedSignatureRouteProfileIds.includes(
          signatureRouteProfileId
        ) &&
        rule.supportedMetaCollectionIds.includes(metaCollectionId) &&
        rule.supportedGenerationMemoryProfileIds.includes(
          generationMemoryProfileId
        )
    ) ?? null
  );
}

export function createDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry:
      true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      worldLegacyDiscoveryCohesionVersion: null,
      registeredWorldLegacyRuleCount: 0,
      worldLegacyProfileId: null,
      discoveryCohesionId: null,
      legacyTier: null,
      memoryCategory: null,
      legacyReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooks(
  registry,
  {
    worldWonderProfileId = null,
    signatureRouteProfileId = null,
    metaCollectionId = null,
    generationMemoryProfileId = null
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationWorldLegacyDiscoveryCohesionHooksRuleRegistry ||
    !registry.__state
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_WORLD_LEGACY_DISCOVERY_COHESION_HOOKS_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedWorldWonderProfileId = sanitizeString(worldWonderProfileId);
  const normalizedSignatureRouteProfileId = sanitizeString(
    signatureRouteProfileId
  );
  const normalizedMetaCollectionId = sanitizeString(metaCollectionId);
  const normalizedGenerationMemoryProfileId = sanitizeString(
    generationMemoryProfileId
  );

  const rule = chooseRule(
    registry,
    normalizedWorldWonderProfileId,
    normalizedSignatureRouteProfileId,
    normalizedMetaCollectionId,
    normalizedGenerationMemoryProfileId
  );

  if (!rule) {
    registry.__state.worldLegacyProfileId = null;
    registry.__state.discoveryCohesionId = null;
    registry.__state.legacyTier = null;
    registry.__state.memoryCategory = null;
    registry.__state.legacyReason = null;
    registry.__state.lastFailureReason =
      "UNSUPPORTED_WORLD_LEGACY_DISCOVERY_COHESION_CONTEXT";

    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      worldLegacyProfileId: null,
      discoveryCohesionId: null,
      legacyTier: null,
      memoryCategory: null,
      legacyReason: "UNSUPPORTED_WORLD_LEGACY_DISCOVERY_COHESION_CONTEXT",
      reasonCode: "UNSUPPORTED_WORLD_LEGACY_DISCOVERY_COHESION_CONTEXT"
    });
  }

  registry.__state.worldLegacyProfileId = rule.worldLegacyProfileId;
  registry.__state.discoveryCohesionId = rule.discoveryCohesionId;
  registry.__state.legacyTier = rule.legacyTier;
  registry.__state.memoryCategory = rule.memoryCategory;
  registry.__state.legacyReason = rule.legacyReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    worldLegacyProfileId: rule.worldLegacyProfileId,
    discoveryCohesionId: rule.discoveryCohesionId,
    legacyTier: rule.legacyTier,
    memoryCategory: rule.memoryCategory,
    legacyReason: rule.legacyReason,
    reasonCode: "RESOLVED"
  });
}
