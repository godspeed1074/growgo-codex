const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_VERSION =
  "atlas_population_asset_family_material_cohesion_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "ASSET_FAMILY_COHESION_RULE_COASTAL_VEGETATION_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_COASTAL_001"]),
      supportedFeatureClasses: Object.freeze([
        "coastal_green",
        "vegetation_area",
        "park"
      ]),
      assetFamilyId: "ASSET_FAMILY_VEGETATION_COASTAL_001",
      materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
      paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
      styleCompatibilityReason:
        "coastal_settlement_selects_native_vegetation_palette",
      assetSelectionSeedKey: "coastal_vegetation",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "ASSET_FAMILY_COHESION_RULE_RURAL_RESIDENTIAL_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_RURAL_TOWN_001"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_RURAL_001",
        "BIOME_PROFILE_FOREST_001"
      ]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      assetFamilyId: "ASSET_FAMILY_RESIDENTIAL_RURAL_001",
      materialFamilyId: "MATERIAL_FAMILY_WALL_RURAL_001",
      paletteProfileId: "PALETTE_PROFILE_RURAL_EARTH_001",
      styleCompatibilityReason:
        "rural_town_residential_selects_earth_wall_family",
      assetSelectionSeedKey: "rural_residential",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "ASSET_FAMILY_COHESION_RULE_SUBURBAN_RESIDENTIAL_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_SUBURBAN_COMMUNITY_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_SUBURBAN_001"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      assetFamilyId: "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001",
      materialFamilyId: "MATERIAL_FAMILY_ROOF_SUBURBAN_001",
      paletteProfileId: "PALETTE_PROFILE_SUBURBAN_GARDEN_001",
      styleCompatibilityReason:
        "suburban_community_selects_residential_roof_and_palette_family",
      assetSelectionSeedKey: "suburban_residential",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "ASSET_FAMILY_COHESION_RULE_URBAN_COMMERCIAL_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      assetFamilyId: "ASSET_FAMILY_COMMERCIAL_URBAN_001",
      materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
      paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001",
      styleCompatibilityReason:
        "urban_district_selects_commercial_frontage_trim_family",
      assetSelectionSeedKey: "urban_commercial",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "ASSET_FAMILY_COHESION_RULE_HERITAGE_CIVIC_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_URBAN_001",
        "BIOME_PROFILE_SUBURBAN_001"
      ]),
      supportedFeatureClasses: Object.freeze(["civic_site", "building_footprint"]),
      assetFamilyId: "ASSET_FAMILY_CIVIC_HERITAGE_001",
      materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
      paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001",
      styleCompatibilityReason:
        "heritage_town_selects_civic_wall_and_palette_family",
      assetSelectionSeedKey: "heritage_civic",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "ASSET_FAMILY_COHESION_RULE_INDUSTRIAL_FURNITURE_001",
      supportedSettlementIdentityIds: Object.freeze([
        "SETTLEMENT_IDENTITY_INDUSTRIAL_AREA_001"
      ]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      supportedFeatureClasses: Object.freeze(["civic_site", "roadway"]),
      assetFamilyId: "ASSET_FAMILY_STREET_FURNITURE_INDUSTRIAL_001",
      materialFamilyId: "MATERIAL_FAMILY_ROAD_INDUSTRIAL_001",
      paletteProfileId: "PALETTE_PROFILE_INDUSTRIAL_MUTED_001",
      styleCompatibilityReason:
        "industrial_area_selects_road_and_street_furniture_family",
      assetSelectionSeedKey: "industrial_furniture",
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

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ charCode, 2654435761);
    h2 = Math.imul(h2 ^ charCode, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    assetFamilyMaterialCohesionVersion: state.assetFamilyMaterialCohesionVersion,
    registeredAssetFamilyRuleCount: state.registeredAssetFamilyRuleCount,
    assetFamilyId: state.assetFamilyId,
    materialFamilyId: state.materialFamilyId,
    paletteProfileId: state.paletteProfileId,
    styleCompatibilityReason: state.styleCompatibilityReason,
    assetSelectionSeed: state.assetSelectionSeed,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const assetFamilyId = sanitizeString(rule.assetFamilyId);
  const materialFamilyId = sanitizeString(rule.materialFamilyId);
  const paletteProfileId = sanitizeString(rule.paletteProfileId);
  if (!ruleId) {
    throw Object.assign(new Error("MISSING_ASSET_FAMILY_RULE_ID"), {
      reasonCode: "MISSING_ASSET_FAMILY_RULE_ID"
    });
  }
  if (!assetFamilyId) {
    throw Object.assign(new Error("MISSING_ASSET_FAMILY_ID"), {
      reasonCode: "MISSING_ASSET_FAMILY_ID"
    });
  }
  if (!materialFamilyId) {
    throw Object.assign(new Error("MISSING_MATERIAL_FAMILY_ID"), {
      reasonCode: "MISSING_MATERIAL_FAMILY_ID"
    });
  }
  if (!paletteProfileId) {
    throw Object.assign(new Error("MISSING_PALETTE_PROFILE_ID"), {
      reasonCode: "MISSING_PALETTE_PROFILE_ID"
    });
  }
  return deepFreeze({
    ruleId,
    supportedSettlementIdentityIds: deepFreeze(
      (rule.supportedSettlementIdentityIds ?? []).map(String)
    ),
    supportedBiomeProfileIds: deepFreeze(
      (rule.supportedBiomeProfileIds ?? []).map(String)
    ),
    supportedFeatureClasses: deepFreeze(
      (rule.supportedFeatureClasses ?? []).map(String)
    ),
    assetFamilyId,
    materialFamilyId,
    paletteProfileId,
    styleCompatibilityReason: sanitizeString(rule.styleCompatibilityReason),
    assetSelectionSeedKey: sanitizeString(rule.assetSelectionSeedKey),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    assetFamilyMaterialCohesionVersion: version,
    registeredAssetFamilyRuleCount: rules.length,
    assetFamilyId: null,
    materialFamilyId: null,
    paletteProfileId: null,
    styleCompatibilityReason: null,
    assetSelectionSeed: null,
    lastFailureReason: null
  };
}

function chooseRule(
  registry,
  settlementIdentityId,
  biomeProfileId,
  featureClass,
  paletteProfileId
) {
  return (
    registry.__rules.find(
      (rule) =>
        rule.supportedSettlementIdentityIds.includes(settlementIdentityId) &&
        rule.supportedBiomeProfileIds.includes(biomeProfileId) &&
        rule.supportedFeatureClasses.includes(featureClass) &&
        rule.paletteProfileId === paletteProfileId
    ) ??
    registry.__rules.find(
      (rule) =>
        rule.supportedSettlementIdentityIds.includes(settlementIdentityId) &&
        rule.supportedFeatureClasses.includes(featureClass)
    ) ??
    null
  );
}

export function createDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry({
  version =
    DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_RULES
} = {}) {
  const validatedRules = deepFreeze(rules.map(validateRule));
  return Object.freeze({
    __growgoDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry: true,
    __version: sanitizeString(version),
    __rules: validatedRules,
    __state: createState(version, validatedRules)
  });
}

export function getDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistryStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      assetFamilyMaterialCohesionVersion: null,
      registeredAssetFamilyRuleCount: 0,
      assetFamilyId: null,
      materialFamilyId: null,
      paletteProfileId: null,
      styleCompatibilityReason: null,
      assetSelectionSeed: null,
      lastFailureReason:
        "ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_RULE_REGISTRY_UNAVAILABLE"
    });
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesion(
  registry,
  {
    settlementIdentityId,
    biomeProfileId,
    localCharacterProfileId,
    featureClass,
    paletteProfileId
  } = {}
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasPopulationAssetFamilyMaterialCohesionRuleRegistry
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_RULE_REGISTRY_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_POPULATION_ASSET_FAMILY_MATERIAL_COHESION_RULE_REGISTRY_UNAVAILABLE"
      }
    );
  }

  const normalizedSettlementIdentityId = sanitizeString(settlementIdentityId);
  const normalizedBiomeProfileId = sanitizeString(biomeProfileId);
  const normalizedLocalCharacterProfileId = sanitizeString(localCharacterProfileId);
  const normalizedFeatureClass = sanitizeString(featureClass);
  const normalizedPaletteProfileId = sanitizeString(paletteProfileId);

  if (!normalizedSettlementIdentityId) {
    registry.__state.lastFailureReason = "MISSING_SETTLEMENT_IDENTITY_ID";
    throw Object.assign(new Error("MISSING_SETTLEMENT_IDENTITY_ID"), {
      reasonCode: "MISSING_SETTLEMENT_IDENTITY_ID"
    });
  }
  if (!normalizedBiomeProfileId) {
    registry.__state.lastFailureReason = "MISSING_BIOME_PROFILE_ID";
    throw Object.assign(new Error("MISSING_BIOME_PROFILE_ID"), {
      reasonCode: "MISSING_BIOME_PROFILE_ID"
    });
  }
  if (!normalizedFeatureClass) {
    registry.__state.lastFailureReason = "MISSING_FEATURE_CLASS";
    throw Object.assign(new Error("MISSING_FEATURE_CLASS"), {
      reasonCode: "MISSING_FEATURE_CLASS"
    });
  }
  if (!normalizedPaletteProfileId) {
    registry.__state.lastFailureReason = "MISSING_PALETTE_PROFILE_ID";
    throw Object.assign(new Error("MISSING_PALETTE_PROFILE_ID"), {
      reasonCode: "MISSING_PALETTE_PROFILE_ID"
    });
  }

  const rule = chooseRule(
    registry,
    normalizedSettlementIdentityId,
    normalizedBiomeProfileId,
    normalizedFeatureClass,
    normalizedPaletteProfileId
  );

  if (!rule) {
    registry.__state.lastFailureReason =
      "INCOMPATIBLE_ASSET_FAMILY_MATERIAL_STYLE";
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      assetFamilyId: null,
      materialFamilyId: null,
      paletteProfileId: normalizedPaletteProfileId,
      styleCompatibilityReason: "INCOMPATIBLE_ASSET_FAMILY_MATERIAL_STYLE",
      assetSelectionSeed: null,
      reasonCode: "INCOMPATIBLE_ASSET_FAMILY_MATERIAL_STYLE"
    });
  }

  const assetSelectionSeed = `ASSET_SELECTION_${hashString(
    stableSerialize({
      settlementIdentityId: normalizedSettlementIdentityId,
      biomeProfileId: normalizedBiomeProfileId,
      localCharacterProfileId: normalizedLocalCharacterProfileId,
      featureClass: normalizedFeatureClass,
      paletteProfileId: normalizedPaletteProfileId,
      assetSelectionSeedKey: rule.assetSelectionSeedKey
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  registry.__state.assetFamilyId = rule.assetFamilyId;
  registry.__state.materialFamilyId = rule.materialFamilyId;
  registry.__state.paletteProfileId = rule.paletteProfileId;
  registry.__state.styleCompatibilityReason = rule.styleCompatibilityReason;
  registry.__state.assetSelectionSeed = assetSelectionSeed;
  registry.__state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    assetFamilyId: rule.assetFamilyId,
    materialFamilyId: rule.materialFamilyId,
    paletteProfileId: rule.paletteProfileId,
    styleCompatibilityReason: rule.styleCompatibilityReason,
    assetSelectionSeed
  });
}
