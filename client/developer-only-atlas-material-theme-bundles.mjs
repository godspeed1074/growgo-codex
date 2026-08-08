const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MATERIAL_THEME_BUNDLES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MATERIAL_THEME_BUNDLES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_THEME_BUNDLES_VERSION =
  "atlas_material_theme_bundles_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_THEME_BUNDLE_RULES =
  Object.freeze([
    Object.freeze({
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_COASTAL_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_COASTAL_VILLAGE_001",
      biomeProfileId: "BIOME_PROFILE_COASTAL_001",
      materialFamilyId: "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001",
      paletteProfileId: "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001",
      finishProfileId: "FINISH_PROFILE_NATURAL_001",
      resolvedMaterialProfileId: "RESOLVED_MATERIAL_PROFILE_COASTAL_NATIVE_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_COASTAL_NATURAL_001",
      resolvedPaletteSetId: "RESOLVED_PALETTE_SET_COASTAL_SOFT_001",
      materialBundleCompatibilityStatus: "valid",
      materialBundleReason:
        "coastal_bundle_aligns_native_green_materials_palette_and finish set",
      status: "approved"
    }),
    Object.freeze({
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_HERITAGE_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_HERITAGE_TOWN_001",
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      materialFamilyId: "MATERIAL_FAMILY_WALL_HERITAGE_001",
      paletteProfileId: "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001",
      finishProfileId: "FINISH_PROFILE_HERITAGE_AGED_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_HERITAGE_MASONRY_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_HERITAGE_AGED_001",
      resolvedPaletteSetId: "RESOLVED_PALETTE_SET_HERITAGE_WARM_001",
      materialBundleCompatibilityStatus: "valid",
      materialBundleReason:
        "heritage_bundle_aligns masonry trims windows and aged finish set",
      status: "approved"
    }),
    Object.freeze({
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_URBAN_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_URBAN_DISTRICT_001",
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      materialFamilyId: "MATERIAL_FAMILY_TRIM_URBAN_001",
      paletteProfileId: "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001",
      finishProfileId: "FINISH_PROFILE_CLEAN_MODERN_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_URBAN_COMMERCIAL_MIXED_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_URBAN_MODERN_001",
      resolvedPaletteSetId: "RESOLVED_PALETTE_SET_URBAN_MIXED_001",
      materialBundleCompatibilityStatus: "valid",
      materialBundleReason:
        "urban_bundle_aligns facade trim glazing and modern finish set",
      status: "approved"
    }),
    Object.freeze({
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_RURAL_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_RURAL_FARMING_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_RURAL_TOWN_001",
      biomeProfileId: "BIOME_PROFILE_RURAL_001",
      materialFamilyId: "MATERIAL_FAMILY_ROOF_SUBURBAN_001",
      paletteProfileId: "PALETTE_PROFILE_SUBURBAN_GARDEN_001",
      finishProfileId: "FINISH_PROFILE_WEATHERED_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_SUBURBAN_GARDEN_ROOF_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_RURAL_WEATHERED_001",
      resolvedPaletteSetId: "RESOLVED_PALETTE_SET_RURAL_GARDEN_001",
      materialBundleCompatibilityStatus: "valid",
      materialBundleReason:
        "rural_bundle_aligns weathered roof fence vegetation and garden palette",
      status: "approved"
    }),
    Object.freeze({
      materialThemeBundleId: "MATERIAL_THEME_BUNDLE_INDUSTRIAL_001",
      worldThemeProfileId: "WORLD_THEME_PROFILE_INDUSTRIAL_001",
      settlementIdentityId: "SETTLEMENT_IDENTITY_INDUSTRIAL_AREA_001",
      biomeProfileId: "BIOME_PROFILE_URBAN_001",
      materialFamilyId: "MATERIAL_FAMILY_ROAD_INDUSTRIAL_001",
      paletteProfileId: "PALETTE_PROFILE_INDUSTRIAL_MUTED_001",
      finishProfileId: "FINISH_PROFILE_INDUSTRIAL_001",
      resolvedMaterialProfileId:
        "RESOLVED_MATERIAL_PROFILE_INDUSTRIAL_STREET_EDGE_001",
      resolvedFinishSetId: "RESOLVED_FINISH_SET_INDUSTRIAL_HARDWEAR_001",
      resolvedPaletteSetId: "RESOLVED_PALETTE_SET_INDUSTRIAL_MUTED_001",
      materialBundleCompatibilityStatus: "valid",
      materialBundleReason:
        "industrial_bundle_aligns hardscape trim fence and muted finish set",
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
    atlasMaterialThemeBundlesVersion: state.atlasMaterialThemeBundlesVersion,
    registeredMaterialThemeBundleRuleCount:
      state.registeredMaterialThemeBundleRuleCount,
    materialThemeBundleId: state.materialThemeBundleId,
    resolvedFinishSetId: state.resolvedFinishSetId,
    resolvedPaletteSetId: state.resolvedPaletteSetId,
    materialBundleCompatibilityStatus:
      state.materialBundleCompatibilityStatus,
    materialBundleReason: state.materialBundleReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const materialThemeBundleId = sanitizeString(rule.materialThemeBundleId);
  const worldThemeProfileId = sanitizeString(rule.worldThemeProfileId);
  const settlementIdentityId = sanitizeString(rule.settlementIdentityId);
  const biomeProfileId = sanitizeString(rule.biomeProfileId);
  const materialFamilyId = sanitizeString(rule.materialFamilyId);
  const paletteProfileId = sanitizeString(rule.paletteProfileId);
  const finishProfileId = sanitizeString(rule.finishProfileId);
  const resolvedMaterialProfileId = sanitizeString(rule.resolvedMaterialProfileId);
  const resolvedFinishSetId = sanitizeString(rule.resolvedFinishSetId);
  const resolvedPaletteSetId = sanitizeString(rule.resolvedPaletteSetId);
  if (
    !materialThemeBundleId ||
    !worldThemeProfileId ||
    !settlementIdentityId ||
    !biomeProfileId ||
    !materialFamilyId ||
    !paletteProfileId ||
    !finishProfileId ||
    !resolvedMaterialProfileId ||
    !resolvedFinishSetId ||
    !resolvedPaletteSetId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_MATERIAL_THEME_BUNDLE_RULE"),
      { reasonCode: "INCOMPLETE_MATERIAL_THEME_BUNDLE_RULE" }
    );
  }
  return deepFreeze({
    materialThemeBundleId,
    worldThemeProfileId,
    settlementIdentityId,
    biomeProfileId,
    materialFamilyId,
    paletteProfileId,
    finishProfileId,
    resolvedMaterialProfileId,
    resolvedFinishSetId,
    resolvedPaletteSetId,
    materialBundleCompatibilityStatus: sanitizeString(
      rule.materialBundleCompatibilityStatus
    ),
    materialBundleReason: sanitizeString(rule.materialBundleReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasMaterialThemeBundlesVersion: version,
    registeredMaterialThemeBundleRuleCount: rules.length,
    materialThemeBundleId: null,
    resolvedFinishSetId: null,
    resolvedPaletteSetId: null,
    materialBundleCompatibilityStatus: null,
    materialBundleReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasMaterialThemeBundles) {
    throw Object.assign(new Error("ATLAS_MATERIAL_THEME_BUNDLES_UNAVAILABLE"), {
      reasonCode: "ATLAS_MATERIAL_THEME_BUNDLES_UNAVAILABLE"
    });
  }
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

function fail(registry, reasonCode) {
  updateState(registry, {
    materialThemeBundleId: null,
    resolvedFinishSetId: null,
    resolvedPaletteSetId: null,
    materialBundleCompatibilityStatus: "blocked",
    materialBundleReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    materialThemeBundleId: null,
    resolvedFinishSetId: null,
    resolvedPaletteSetId: null,
    materialBundleCompatibilityStatus: "blocked",
    materialBundleReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasMaterialThemeBundles({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_THEME_BUNDLES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_MATERIAL_THEME_BUNDLE_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasMaterialThemeBundles: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasMaterialThemeBundlesStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasMaterialThemeBundles) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasMaterialThemeBundle(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const worldThemeProfileId = sanitizeString(input.worldThemeProfileId);
  const settlementIdentityId = sanitizeString(input.settlementIdentityId);
  const biomeProfileId = sanitizeString(input.biomeProfileId);
  const materialFamilyId = sanitizeString(input.materialFamilyId);
  const paletteProfileId = sanitizeString(input.paletteProfileId);
  const finishProfileId = sanitizeString(input.finishProfileId);
  const resolvedMaterialProfileId = sanitizeString(input.resolvedMaterialProfileId);

  const rule = registry.__rules.find(
    (candidate) => candidate.worldThemeProfileId === worldThemeProfileId
  );
  if (!rule) {
    return fail(registry, "MATERIAL_THEME_BUNDLE_NOT_FOUND");
  }
  if (rule.settlementIdentityId !== settlementIdentityId) {
    return fail(registry, "MATERIAL_THEME_BUNDLE_SETTLEMENT_INCOMPATIBLE");
  }
  if (rule.biomeProfileId !== biomeProfileId) {
    return fail(registry, "MATERIAL_THEME_BUNDLE_BIOME_INCOMPATIBLE");
  }
  if (rule.materialFamilyId !== materialFamilyId) {
    return fail(registry, "MATERIAL_THEME_BUNDLE_MATERIAL_INCOMPATIBLE");
  }
  if (rule.paletteProfileId !== paletteProfileId) {
    return fail(registry, "MATERIAL_THEME_BUNDLE_PALETTE_INCOMPATIBLE");
  }
  if (rule.finishProfileId !== finishProfileId) {
    return fail(registry, "MATERIAL_THEME_BUNDLE_FINISH_INCOMPATIBLE");
  }
  if (rule.resolvedMaterialProfileId !== resolvedMaterialProfileId) {
    return fail(
      registry,
      "MATERIAL_THEME_BUNDLE_RESOLVED_MATERIAL_INCOMPATIBLE"
    );
  }

  updateState(registry, {
    materialThemeBundleId: rule.materialThemeBundleId,
    resolvedFinishSetId: rule.resolvedFinishSetId,
    resolvedPaletteSetId: rule.resolvedPaletteSetId,
    materialBundleCompatibilityStatus: rule.materialBundleCompatibilityStatus,
    materialBundleReason: rule.materialBundleReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    materialThemeBundleId: rule.materialThemeBundleId,
    resolvedFinishSetId: rule.resolvedFinishSetId,
    resolvedPaletteSetId: rule.resolvedPaletteSetId,
    materialBundleCompatibilityStatus: rule.materialBundleCompatibilityStatus,
    materialBundleReason: rule.materialBundleReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
