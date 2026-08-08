const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MATERIAL_PALETTE_FINISH_COMPATIBILITY_PROFILES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MATERIAL_PALETTE_FINISH_COMPATIBILITY_PROFILES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_PALETTE_FINISH_COMPATIBILITY_PROFILES_VERSION =
  "atlas_material_palette_finish_compatibility_profiles_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_PALETTE_FINISH_COMPATIBILITY_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "MATERIAL_FINISH_RULE_COASTAL_VEGETATION_001",
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_A_001",
      materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
      paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
      biomeProfileId: "BIOME_PROFILE_COASTAL_001",
      materialCompatibilityStatus: "valid",
      paletteCompatibilityStatus: "valid",
      finishProfileId: "FINISH_PROFILE_NATURAL_001",
      resolvedMaterialProfileId: "RESOLVED_MATERIAL_PROFILE_COASTAL_NATIVE_001",
      materialReason:
        "coastal_native_variant_uses_natural_finish_and_coastal_palette",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MATERIAL_FINISH_RULE_COASTAL_VEGETATION_COMPACT_001",
      assetVariantId: "VARIANT_TREE_BOTTLEBRUSH_COASTAL_B_001",
      materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
      paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
      biomeProfileId: "BIOME_PROFILE_COASTAL_001",
      materialCompatibilityStatus: "valid",
      paletteCompatibilityStatus: "valid",
      finishProfileId: "FINISH_PROFILE_NATURAL_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_COASTAL_NATIVE_COMPACT_001",
      materialReason:
        "compact_coastal_variant_uses_same_palette_with_lower_complexity_finish",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MATERIAL_FINISH_RULE_HERITAGE_CIVIC_001",
      assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_A_001",
      materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
      paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      materialCompatibilityStatus: "valid",
      paletteCompatibilityStatus: "valid",
      finishProfileId: "FINISH_PROFILE_HERITAGE_AGED_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_HERITAGE_MASONRY_001",
      materialReason:
        "heritage_civic_variant_uses_aged_masonry_finish_and heritage palette",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MATERIAL_FINISH_RULE_HERITAGE_CIVIC_COMPACT_001",
      assetVariantId: "VARIANT_CIVIC_HERITAGE_PAVILION_B_001",
      materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
      paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      materialCompatibilityStatus: "valid",
      paletteCompatibilityStatus: "valid",
      finishProfileId: "FINISH_PROFILE_HERITAGE_AGED_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_HERITAGE_MASONRY_COMPACT_001",
      materialReason:
        "compact_heritage_variant_preserves_aged_finish_and heritage palette",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MATERIAL_FINISH_RULE_URBAN_COMMERCIAL_001",
      assetVariantId: "VARIANT_COMMERCIAL_URBAN_FRONTAGE_A_001",
      materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
      paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      materialCompatibilityStatus: "valid",
      paletteCompatibilityStatus: "valid",
      finishProfileId: "FINISH_PROFILE_CLEAN_MODERN_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_URBAN_COMMERCIAL_MIXED_001",
      materialReason:
        "urban_frontage_variant_uses_clean_modern_finish and urban mixed palette",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MATERIAL_FINISH_RULE_SUBURBAN_RESIDENTIAL_001",
      assetVariantId: "VARIANT_RESIDENTIAL_SUBURBAN_PLACEHOLDER_A_001",
      materialFamilyId: "MATERIAL_FAMILY_ROOF_SUBURBAN_001",
      paletteProfileId: "PALETTE_PROFILE_SUBURBAN_GARDEN_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
      biomeProfileId: "BIOME_PROFILE_COASTAL_001",
      materialCompatibilityStatus: "valid",
      paletteCompatibilityStatus: "valid",
      finishProfileId: "FINISH_PROFILE_WEATHERED_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_SUBURBAN_GARDEN_ROOF_001",
      materialReason:
        "suburban_residential_variant_uses_weathered_roof_finish and garden palette",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MATERIAL_FINISH_RULE_INDUSTRIAL_FURNITURE_001",
      assetVariantId: "VARIANT_INDUSTRIAL_STREET_FURNITURE_A_001",
      materialFamilyId: "MATERIAL_FAMILY_ROAD_INDUSTRIAL_001",
      paletteProfileId: "PALETTE_PROFILE_INDUSTRIAL_MUTED_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_INDUSTRIAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_INDUSTRIAL_AREA_001",
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      materialCompatibilityStatus: "valid",
      paletteCompatibilityStatus: "valid",
      finishProfileId: "FINISH_PROFILE_INDUSTRIAL_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_INDUSTRIAL_STREET_EDGE_001",
      materialReason:
        "industrial_edge_variant_uses muted industrial palette and robust hardscape finish",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MATERIAL_FINISH_RULE_INDUSTRIAL_FURNITURE_COMPACT_001",
      assetVariantId: "VARIANT_INDUSTRIAL_STREET_FURNITURE_B_001",
      materialFamilyId: "MATERIAL_FAMILY_ROAD_INDUSTRIAL_001",
      paletteProfileId: "PALETTE_PROFILE_INDUSTRIAL_MUTED_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_INDUSTRIAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_INDUSTRIAL_AREA_001",
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      materialCompatibilityStatus: "valid",
      paletteCompatibilityStatus: "valid",
      finishProfileId: "FINISH_PROFILE_INDUSTRIAL_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_INDUSTRIAL_STREET_EDGE_COMPACT_001",
      materialReason:
        "compact_industrial_edge_variant_keeps industrial palette with lower complexity finish",
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
    atlasMaterialPaletteFinishCompatibilityProfilesVersion:
      state.atlasMaterialPaletteFinishCompatibilityProfilesVersion,
    registeredMaterialCompatibilityRuleCount:
      state.registeredMaterialCompatibilityRuleCount,
    materialCompatibilityStatus: state.materialCompatibilityStatus,
    paletteCompatibilityStatus: state.paletteCompatibilityStatus,
    finishProfileId: state.finishProfileId,
    resolvedMaterialProfileId: state.resolvedMaterialProfileId,
    materialReason: state.materialReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const assetVariantId = sanitizeString(rule.assetVariantId);
  const materialFamilyId = sanitizeString(rule.materialFamilyId);
  const paletteProfileId = sanitizeString(rule.paletteProfileId);
  const finishProfileId = sanitizeString(rule.finishProfileId);
  const resolvedMaterialProfileId = sanitizeString(rule.resolvedMaterialProfileId);
  if (
    !ruleId ||
    !assetVariantId ||
    !materialFamilyId ||
    !paletteProfileId ||
    !finishProfileId ||
    !resolvedMaterialProfileId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_MATERIAL_PALETTE_FINISH_COMPATIBILITY_RULE"),
      { reasonCode: "INCOMPLETE_MATERIAL_PALETTE_FINISH_COMPATIBILITY_RULE" }
    );
  }
  return deepFreeze({
    ruleId,
    assetVariantId,
    materialFamilyId,
    paletteProfileId,
    worldThemeProfileId: sanitizeString(rule.worldThemeProfileId),
    settlementIdentityId: sanitizeString(rule.settlementIdentityId),
    biomeProfileId: sanitizeString(rule.biomeProfileId),
    materialCompatibilityStatus: sanitizeString(
      rule.materialCompatibilityStatus
    ),
    paletteCompatibilityStatus: sanitizeString(
      rule.paletteCompatibilityStatus
    ),
    finishProfileId,
    resolvedMaterialProfileId,
    materialReason: sanitizeString(rule.materialReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasMaterialPaletteFinishCompatibilityProfilesVersion: version,
    registeredMaterialCompatibilityRuleCount: rules.length,
    materialCompatibilityStatus: null,
    paletteCompatibilityStatus: null,
    finishProfileId: null,
    resolvedMaterialProfileId: null,
    materialReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles
  ) {
    throw Object.assign(
      new Error(
        "ATLAS_MATERIAL_PALETTE_FINISH_COMPATIBILITY_PROFILES_UNAVAILABLE"
      ),
      {
        reasonCode:
          "ATLAS_MATERIAL_PALETTE_FINISH_COMPATIBILITY_PROFILES_UNAVAILABLE"
      }
    );
  }
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

function fail(registry, reasonCode) {
  updateState(registry, {
    materialCompatibilityStatus: "blocked",
    paletteCompatibilityStatus: "blocked",
    finishProfileId: null,
    resolvedMaterialProfileId: null,
    materialReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    materialCompatibilityStatus: "blocked",
    paletteCompatibilityStatus: "blocked",
    finishProfileId: null,
    resolvedMaterialProfileId: null,
    materialReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles(
  {
    version = DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_PALETTE_FINISH_COMPATIBILITY_PROFILES_VERSION,
    rules =
      DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_PALETTE_FINISH_COMPATIBILITY_RULES
  } = {}
) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfilesStatus(
  registry
) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfiles
  ) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasMaterialPaletteFinishCompatibilityProfile(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const assetVariantId = sanitizeString(input.assetVariantId);
  const materialFamilyId = sanitizeString(input.materialFamilyId);
  const paletteProfileId = sanitizeString(input.paletteProfileId);
  const worldThemeProfileId = sanitizeString(input.worldThemeProfileId);
  const settlementIdentityId = sanitizeString(input.settlementIdentityId);
  const biomeProfileId = sanitizeString(input.biomeProfileId);

  const rule = registry.__rules.find(
    (candidate) => candidate.assetVariantId === assetVariantId
  );
  if (!rule) {
    return fail(registry, "MATERIAL_FINISH_RULE_NOT_FOUND");
  }
  if (rule.materialFamilyId !== materialFamilyId) {
    return fail(registry, "MATERIAL_FAMILY_INCOMPATIBLE");
  }
  if (rule.paletteProfileId !== paletteProfileId) {
    return fail(registry, "PALETTE_PROFILE_INCOMPATIBLE");
  }
  if (rule.worldThemeProfileId !== worldThemeProfileId) {
    return fail(registry, "WORLD_THEME_MATERIAL_INCOMPATIBLE");
  }
  if (rule.settlementIdentityId !== settlementIdentityId) {
    return fail(registry, "SETTLEMENT_MATERIAL_INCOMPATIBLE");
  }
  if (rule.biomeProfileId !== biomeProfileId) {
    return fail(registry, "BIOME_MATERIAL_INCOMPATIBLE");
  }

  updateState(registry, {
    materialCompatibilityStatus: rule.materialCompatibilityStatus,
    paletteCompatibilityStatus: rule.paletteCompatibilityStatus,
    finishProfileId: rule.finishProfileId,
    resolvedMaterialProfileId: rule.resolvedMaterialProfileId,
    materialReason: rule.materialReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    materialCompatibilityStatus: rule.materialCompatibilityStatus,
    paletteCompatibilityStatus: rule.paletteCompatibilityStatus,
    finishProfileId: rule.finishProfileId,
    resolvedMaterialProfileId: rule.resolvedMaterialProfileId,
    materialReason: rule.materialReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
