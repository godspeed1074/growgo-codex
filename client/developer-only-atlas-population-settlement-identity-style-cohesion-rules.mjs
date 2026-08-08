const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_VERSION =
  "atlas_population_settlement_identity_style_cohesion_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_RULES =
  Object.freeze([
    Object.freeze({
      settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
      styleProfileId: "STYLE_PROFILE_COASTAL_VILLAGE_001",
      paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_COASTAL_001"]),
      supportedDistrictTypes: Object.freeze(["coastal_natural", "mixed_use"]),
      architecturalInfluence: "coastal_village_lowrise",
      cohesionReason: "coastal_village_material_and_landscape_cohesion",
      status: "approved"
    }),
    Object.freeze({
      settlementIdentityId: "SETTLEMENT_IDENTITY_RURAL_TOWN_001",
      styleProfileId: "STYLE_PROFILE_RURAL_TOWN_001",
      paletteProfileId: "PALETTE_PROFILE_RURAL_EARTH_001",
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_RURAL_001",
        "BIOME_PROFILE_FOREST_001"
      ]),
      supportedDistrictTypes: Object.freeze(["recreation", "residential"]),
      architecturalInfluence: "rural_town_edge",
      cohesionReason: "rural_town_open_edge_and_planting_cohesion",
      status: "approved"
    }),
    Object.freeze({
      settlementIdentityId: "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001",
      styleProfileId: "STYLE_PROFILE_SUBURBAN_COMMUNITY_001",
      paletteProfileId: "PALETTE_PROFILE_SUBURBAN_GARDEN_001",
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_SUBURBAN_001"]),
      supportedDistrictTypes: Object.freeze(["residential"]),
      architecturalInfluence: "suburban_community_garden",
      cohesionReason: "suburban_verge_palette_and_building_cohesion",
      status: "approved"
    }),
    Object.freeze({
      settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
      styleProfileId: "STYLE_PROFILE_URBAN_DISTRICT_001",
      paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001",
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      supportedDistrictTypes: Object.freeze(["commercial", "mixed_use", "civic"]),
      architecturalInfluence: "urban_frontage_district",
      cohesionReason: "urban_district_frontage_and_material_cohesion",
      status: "approved"
    }),
    Object.freeze({
      settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
      styleProfileId: "STYLE_PROFILE_HERITAGE_TOWN_001",
      paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001",
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_URBAN_001",
        "BIOME_PROFILE_SUBURBAN_001"
      ]),
      supportedDistrictTypes: Object.freeze(["civic", "mixed_use"]),
      architecturalInfluence: "heritage_town_civic_frontage",
      cohesionReason: "heritage_civic_alignment_and_palette_cohesion",
      status: "approved"
    }),
    Object.freeze({
      settlementIdentityId: "SETTLEMENT_IDENTITY_INDUSTRIAL_AREA_001",
      styleProfileId: "STYLE_PROFILE_INDUSTRIAL_AREA_001",
      paletteProfileId: "PALETTE_PROFILE_INDUSTRIAL_MUTED_001",
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      supportedDistrictTypes: Object.freeze(["civic", "commercial"]),
      architecturalInfluence: "service_edge_industrial",
      cohesionReason: "industrial_service_edge_and_open-yard_cohesion",
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
    settlementIdentityStyleCohesionVersion:
      state.settlementIdentityStyleCohesionVersion,
    registeredSettlementIdentityRuleCount:
      state.registeredSettlementIdentityRuleCount,
    settlementIdentityId: state.settlementIdentityId,
    styleProfileId: state.styleProfileId,
    paletteProfileId: state.paletteProfileId,
    architecturalInfluence: state.architecturalInfluence,
    cohesionReason: state.cohesionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const settlementIdentityId = sanitizeString(rule.settlementIdentityId);
  const styleProfileId = sanitizeString(rule.styleProfileId);
  const paletteProfileId = sanitizeString(rule.paletteProfileId);
  if (!settlementIdentityId) {
    throw Object.assign(new Error("MISSING_SETTLEMENT_IDENTITY_ID"), {
      reasonCode: "MISSING_SETTLEMENT_IDENTITY_ID"
    });
  }
  if (!styleProfileId) {
    throw Object.assign(new Error("MISSING_STYLE_PROFILE_ID"), {
      reasonCode: "MISSING_STYLE_PROFILE_ID"
    });
  }
  if (!paletteProfileId) {
    throw Object.assign(new Error("MISSING_PALETTE_PROFILE_ID"), {
      reasonCode: "MISSING_PALETTE_PROFILE_ID"
    });
  }
  return deepFreeze({
    settlementIdentityId,
    styleProfileId,
    paletteProfileId,
    supportedBiomeProfileIds: deepFreeze(
      (rule.supportedBiomeProfileIds ?? []).map(String)
    ),
    supportedDistrictTypes: deepFreeze(
      (rule.supportedDistrictTypes ?? []).map(String)
    ),
    architecturalInfluence: sanitizeString(rule.architecturalInfluence),
    cohesionReason: sanitizeString(rule.cohesionReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    settlementIdentityStyleCohesionVersion: version,
    registeredSettlementIdentityRuleCount: rules.length,
    settlementIdentityId: null,
    styleProfileId: null,
    paletteProfileId: null,
    architecturalInfluence: null,
    cohesionReason: null,
    lastFailureReason: null
  };
}

function chooseRule(registry, biomeProfileId, districtType, localCharacterProfileId) {
  if (
    biomeProfileId === "BIOME_PROFILE_COASTAL_001" &&
    districtType === "coastal_natural"
  ) {
    return registry.__ruleById.get("SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001");
  }
  if (
    biomeProfileId === "BIOME_PROFILE_RURAL_001" ||
    biomeProfileId === "BIOME_PROFILE_FOREST_001"
  ) {
    return registry.__ruleById.get("SETTLEMENT_IDENTITY_RURAL_TOWN_001");
  }
  if (biomeProfileId === "BIOME_PROFILE_SUBURBAN_001") {
    return registry.__ruleById.get("SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001");
  }
  if (
    localCharacterProfileId === "LOCAL_CHARACTER_URBAN_MAINSTREET_001" &&
    districtType === "civic"
  ) {
    return registry.__ruleById.get("SETTLEMENT_IDENTITY_HERITAGE_TOWN_001");
  }
  if (biomeProfileId === "BIOME_PROFILE_URBAN_001" && districtType === "commercial") {
    return registry.__ruleById.get("SETTLEMENT_IDENTITY_URBAN_DISTRICT_001");
  }
  if (biomeProfileId === "BIOME_PROFILE_URBAN_001" && districtType === "civic") {
    return registry.__ruleById.get("SETTLEMENT_IDENTITY_INDUSTRIAL_AREA_001");
  }
  return registry.__rules.find(
    (rule) =>
      rule.supportedBiomeProfileIds.includes(biomeProfileId) &&
      rule.supportedDistrictTypes.includes(districtType)
  ) ?? null;
}

export function createDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry({
  version =
    DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __ruleById: new Map(
      validatedRules.map((rule) => [rule.settlementIdentityId, rule])
    ),
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      settlementIdentityStyleCohesionVersion: null,
      registeredSettlementIdentityRuleCount: 0,
      settlementIdentityId: null,
      styleProfileId: null,
      paletteProfileId: null,
      architecturalInfluence: null,
      cohesionReason: null,
      lastFailureReason:
        "ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesion(
  registry,
  {
    biomeProfileId,
    localCharacterProfileId,
    districtType
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationSettlementIdentityStyleCohesionRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_SETTLEMENT_IDENTITY_STYLE_COHESION_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedBiomeProfileId = sanitizeString(biomeProfileId);
  const normalizedLocalCharacterProfileId = sanitizeString(localCharacterProfileId);
  const normalizedDistrictType = sanitizeString(districtType);

  if (!normalizedBiomeProfileId) {
    registry.__state.lastFailureReason = "MISSING_BIOME_PROFILE_ID";
    throw Object.assign(new Error("MISSING_BIOME_PROFILE_ID"), {
      reasonCode: "MISSING_BIOME_PROFILE_ID"
    });
  }
  if (!normalizedDistrictType) {
    registry.__state.lastFailureReason = "MISSING_DISTRICT_TYPE";
    throw Object.assign(new Error("MISSING_DISTRICT_TYPE"), {
      reasonCode: "MISSING_DISTRICT_TYPE"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedBiomeProfileId,
    normalizedDistrictType,
    normalizedLocalCharacterProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "UNSUPPORTED_SETTLEMENT_IDENTITY_STYLE_COHESION_CONTEXT";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      settlementIdentityId: null,
      styleProfileId: null,
      paletteProfileId: null,
      architecturalInfluence: null,
      cohesionReason:
        "UNSUPPORTED_SETTLEMENT_IDENTITY_STYLE_COHESION_CONTEXT",
      reasonCode:
        "UNSUPPORTED_SETTLEMENT_IDENTITY_STYLE_COHESION_CONTEXT"
    });
  }

  registry.__state.settlementIdentityId = rule.settlementIdentityId;
  registry.__state.styleProfileId = rule.styleProfileId;
  registry.__state.paletteProfileId = rule.paletteProfileId;
  registry.__state.architecturalInfluence = rule.architecturalInfluence;
  registry.__state.cohesionReason = rule.cohesionReason;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    settlementIdentityId: rule.settlementIdentityId,
    styleProfileId: rule.styleProfileId,
    paletteProfileId: rule.paletteProfileId,
    architecturalInfluence: rule.architecturalInfluence,
    cohesionReason: rule.cohesionReason
  });
}
