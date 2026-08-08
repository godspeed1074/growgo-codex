const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MODULAR_BIBLE_STYLE_BRIDGE_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_MODULAR_BIBLE_STYLE_BRIDGE_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MODULAR_BIBLE_STYLE_BRIDGE_VERSION =
  "atlas_modular_bible_style_bridge_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_MODULAR_BIBLE_STYLE_BRIDGE_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "MODULAR_BIBLE_STYLE_BRIDGE_RULE_COASTAL_VEGETATION_001",
      supportedWorldThemeProfileIds: Object.freeze([
        "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
        "WORLD_THEME_PROFILE_FOREST_NATURAL_001"
      ]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_VEGETATION_COASTAL_001"
      ]),
      supportedArchitectureStyleProfileIds: Object.freeze([
        "ARCHITECTURE_STYLE_PROFILE_COASTAL_RESIDENTIAL_001",
        "ARCHITECTURE_STYLE_PROFILE_RURAL_EDGE_001"
      ]),
      supportedVegetationStyleProfileIds: Object.freeze([
        "VEGETATION_STYLE_PROFILE_COASTAL_001",
        "VEGETATION_STYLE_PROFILE_FOREST_001"
      ]),
      supportedStreetscapeStyleProfileIds: Object.freeze([
        "STREETSCAPE_STYLE_PROFILE_COASTAL_001",
        "STREETSCAPE_STYLE_PROFILE_NATURAL_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_VEGETATION_PALETTE_COASTAL_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_COASTAL_SOFT_NEUTRALS_001"
      ]),
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_VEGETATION_NATIVE_001",
      componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
      bridgeReason:
        "coastal_and_natural_styles_bridge_into_native_vegetation_modules",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_BIBLE_STYLE_BRIDGE_RULE_RURAL_RESIDENTIAL_001",
      supportedWorldThemeProfileIds: Object.freeze([
        "WORLD_THEME_PROFILE_RURAL_FARMING_001"
      ]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_RESIDENTIAL_RURAL_001"
      ]),
      supportedArchitectureStyleProfileIds: Object.freeze([
        "ARCHITECTURE_STYLE_PROFILE_RURAL_RESIDENTIAL_001"
      ]),
      supportedVegetationStyleProfileIds: Object.freeze([
        "VEGETATION_STYLE_PROFILE_RURAL_001"
      ]),
      supportedStreetscapeStyleProfileIds: Object.freeze([
        "STREETSCAPE_STYLE_PROFILE_RURAL_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_WALL_RURAL_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_RURAL_EARTH_001"
      ]),
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_RESIDENTIAL_RURAL_001",
      componentRecipeId: "COMPONENT_RECIPE_RESIDENTIAL_RURAL_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_RURAL_RESIDENTIAL_STEAD_001",
      bridgeReason:
        "rural_residential_style_bridges_into_earth_toned_modular_house_parts",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_BIBLE_STYLE_BRIDGE_RULE_SUBURBAN_RESIDENTIAL_001",
      supportedWorldThemeProfileIds: Object.freeze([
        "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001"
      ]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001"
      ]),
      supportedArchitectureStyleProfileIds: Object.freeze([
        "ARCHITECTURE_STYLE_PROFILE_COASTAL_RESIDENTIAL_001"
      ]),
      supportedVegetationStyleProfileIds: Object.freeze([
        "VEGETATION_STYLE_PROFILE_COASTAL_001"
      ]),
      supportedStreetscapeStyleProfileIds: Object.freeze([
        "STREETSCAPE_STYLE_PROFILE_COASTAL_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_ROOF_SUBURBAN_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_SUBURBAN_GARDEN_001"
      ]),
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_RESIDENTIAL_SUBURBAN_001",
      componentRecipeId: "COMPONENT_RECIPE_RESIDENTIAL_SUBURBAN_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_SUBURBAN_GARDEN_HOME_001",
      bridgeReason:
        "coastal_residential_style_bridges_into_suburban_modular_home_parts",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_BIBLE_STYLE_BRIDGE_RULE_HERITAGE_CIVIC_001",
      supportedWorldThemeProfileIds: Object.freeze([
        "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001"
      ]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_CIVIC_HERITAGE_001"
      ]),
      supportedArchitectureStyleProfileIds: Object.freeze([
        "ARCHITECTURE_STYLE_PROFILE_HERITAGE_CIVIC_001"
      ]),
      supportedVegetationStyleProfileIds: Object.freeze([
        "VEGETATION_STYLE_PROFILE_URBAN_001"
      ]),
      supportedStreetscapeStyleProfileIds: Object.freeze([
        "STREETSCAPE_STYLE_PROFILE_HERITAGE_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_WALL_HERITAGE_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_HERITAGE_WARM_MASONRY_001"
      ]),
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_CIVIC_HERITAGE_001",
      componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001",
      bridgeReason:
        "heritage_civic_style_bridges_into_formal_modular_civic_components",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_BIBLE_STYLE_BRIDGE_RULE_URBAN_COMMERCIAL_001",
      supportedWorldThemeProfileIds: Object.freeze([
        "WORLD_THEME_PROFILE_MODERN_URBAN_001"
      ]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_COMMERCIAL_URBAN_001"
      ]),
      supportedArchitectureStyleProfileIds: Object.freeze([
        "ARCHITECTURE_STYLE_PROFILE_MODERN_COMMERCIAL_001"
      ]),
      supportedVegetationStyleProfileIds: Object.freeze([
        "VEGETATION_STYLE_PROFILE_URBAN_001"
      ]),
      supportedStreetscapeStyleProfileIds: Object.freeze([
        "STREETSCAPE_STYLE_PROFILE_URBAN_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_TRIM_URBAN_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_URBAN_MIXED_MATERIAL_001"
      ]),
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_COMMERCIAL_URBAN_001",
      componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001",
      bridgeReason:
        "modern_urban_style_bridges_into_modular_shopfront_and_facade_parts",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "MODULAR_BIBLE_STYLE_BRIDGE_RULE_INDUSTRIAL_STREETSCAPE_001",
      supportedWorldThemeProfileIds: Object.freeze([
        "WORLD_THEME_PROFILE_INDUSTRIAL_001"
      ]),
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_STREET_FURNITURE_INDUSTRIAL_001"
      ]),
      supportedArchitectureStyleProfileIds: Object.freeze([
        "ARCHITECTURE_STYLE_PROFILE_INDUSTRIAL_COMMERCIAL_001"
      ]),
      supportedVegetationStyleProfileIds: Object.freeze([
        "VEGETATION_STYLE_PROFILE_URBAN_001"
      ]),
      supportedStreetscapeStyleProfileIds: Object.freeze([
        "STREETSCAPE_STYLE_PROFILE_INDUSTRIAL_001"
      ]),
      supportedMaterialFamilyIds: Object.freeze([
        "MATERIAL_FAMILY_ROAD_INDUSTRIAL_001"
      ]),
      supportedPaletteProfileIds: Object.freeze([
        "PALETTE_PROFILE_INDUSTRIAL_MUTED_001"
      ]),
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_STREETSCAPE_INDUSTRIAL_001",
      componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_INDUSTRIAL_STREET_EDGE_001",
      bridgeReason:
        "industrial_streetscape_style_bridges_into_modular_edge_and_furniture_parts",
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
    atlasModularBibleStyleBridgeVersion:
      state.atlasModularBibleStyleBridgeVersion,
    registeredStyleBridgeRuleCount: state.registeredStyleBridgeRuleCount,
    modularBibleFamilyId: state.modularBibleFamilyId,
    componentRecipeId: state.componentRecipeId,
    assetAssemblyProfileId: state.assetAssemblyProfileId,
    styleBridgeStatus: state.styleBridgeStatus,
    bridgeReason: state.bridgeReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const modularBibleFamilyId = sanitizeString(rule.modularBibleFamilyId);
  const componentRecipeId = sanitizeString(rule.componentRecipeId);
  const assetAssemblyProfileId = sanitizeString(rule.assetAssemblyProfileId);
  if (!ruleId) {
    throw Object.assign(new Error("MISSING_STYLE_BRIDGE_RULE_ID"), {
      reasonCode: "MISSING_STYLE_BRIDGE_RULE_ID"
    });
  }
  if (!modularBibleFamilyId) {
    throw Object.assign(new Error("MISSING_MODULAR_BIBLE_FAMILY_ID"), {
      reasonCode: "MISSING_MODULAR_BIBLE_FAMILY_ID"
    });
  }
  if (!componentRecipeId) {
    throw Object.assign(new Error("MISSING_COMPONENT_RECIPE_ID"), {
      reasonCode: "MISSING_COMPONENT_RECIPE_ID"
    });
  }
  if (!assetAssemblyProfileId) {
    throw Object.assign(new Error("MISSING_ASSET_ASSEMBLY_PROFILE_ID"), {
      reasonCode: "MISSING_ASSET_ASSEMBLY_PROFILE_ID"
    });
  }
  return deepFreeze({
    ruleId,
    supportedWorldThemeProfileIds: deepFreeze(
      (rule.supportedWorldThemeProfileIds ?? []).map(String)
    ),
    supportedAssetFamilyIds: deepFreeze(
      (rule.supportedAssetFamilyIds ?? []).map(String)
    ),
    supportedArchitectureStyleProfileIds: deepFreeze(
      (rule.supportedArchitectureStyleProfileIds ?? []).map(String)
    ),
    supportedVegetationStyleProfileIds: deepFreeze(
      (rule.supportedVegetationStyleProfileIds ?? []).map(String)
    ),
    supportedStreetscapeStyleProfileIds: deepFreeze(
      (rule.supportedStreetscapeStyleProfileIds ?? []).map(String)
    ),
    supportedMaterialFamilyIds: deepFreeze(
      (rule.supportedMaterialFamilyIds ?? []).map(String)
    ),
    supportedPaletteProfileIds: deepFreeze(
      (rule.supportedPaletteProfileIds ?? []).map(String)
    ),
    modularBibleFamilyId,
    componentRecipeId,
    assetAssemblyProfileId,
    bridgeReason: sanitizeString(rule.bridgeReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasModularBibleStyleBridgeVersion: version,
    registeredStyleBridgeRuleCount: rules.length,
    modularBibleFamilyId: null,
    componentRecipeId: null,
    assetAssemblyProfileId: null,
    styleBridgeStatus: null,
    bridgeReason: null,
    lastFailureReason: null
  };
}

function updateState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasModularBibleStyleBridge) {
    throw Object.assign(
      new Error("ATLAS_MODULAR_BIBLE_STYLE_BRIDGE_UNAVAILABLE"),
      { reasonCode: "ATLAS_MODULAR_BIBLE_STYLE_BRIDGE_UNAVAILABLE" }
    );
  }
}

function matchesRule(rule, input) {
  return (
    rule.supportedWorldThemeProfileIds.includes(input.worldThemeProfileId) &&
    rule.supportedAssetFamilyIds.includes(input.assetFamilyId) &&
    rule.supportedArchitectureStyleProfileIds.includes(
      input.architectureStyleProfileId
    ) &&
    rule.supportedVegetationStyleProfileIds.includes(
      input.vegetationStyleProfileId
    ) &&
    rule.supportedStreetscapeStyleProfileIds.includes(
      input.streetscapeStyleProfileId
    ) &&
    rule.supportedMaterialFamilyIds.includes(input.materialFamilyId) &&
    rule.supportedPaletteProfileIds.includes(input.paletteProfileId)
  );
}

export function createDeveloperOnlyAtlasModularBibleStyleBridge({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_MODULAR_BIBLE_STYLE_BRIDGE_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_MODULAR_BIBLE_STYLE_BRIDGE_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasModularBibleStyleBridge: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasModularBibleStyleBridgeStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasModularBibleStyleBridge) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasModularBibleStyleBridge(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const normalizedInput = {
    worldThemeProfileId: sanitizeString(input.worldThemeProfileId),
    assetFamilyId: sanitizeString(input.assetFamilyId),
    architectureStyleProfileId: sanitizeString(
      input.architectureStyleProfileId
    ),
    vegetationStyleProfileId: sanitizeString(input.vegetationStyleProfileId),
    streetscapeStyleProfileId: sanitizeString(
      input.streetscapeStyleProfileId
    ),
    materialFamilyId: sanitizeString(input.materialFamilyId),
    paletteProfileId: sanitizeString(input.paletteProfileId)
  };

  const rule = registry.__rules.find((candidate) =>
    matchesRule(candidate, normalizedInput)
  );

  if (!rule) {
    updateState(registry, {
      modularBibleFamilyId: null,
      componentRecipeId: null,
      assetAssemblyProfileId: null,
      styleBridgeStatus: "blocked",
      bridgeReason: "INCOMPATIBLE_MODULAR_BIBLE_STYLE_BRIDGE",
      lastFailureReason: "INCOMPATIBLE_MODULAR_BIBLE_STYLE_BRIDGE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "INCOMPATIBLE_MODULAR_BIBLE_STYLE_BRIDGE",
      modularBibleFamilyId: null,
      componentRecipeId: null,
      assetAssemblyProfileId: null,
      styleBridgeStatus: "blocked",
      bridgeReason: "INCOMPATIBLE_MODULAR_BIBLE_STYLE_BRIDGE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  updateState(registry, {
    modularBibleFamilyId: rule.modularBibleFamilyId,
    componentRecipeId: rule.componentRecipeId,
    assetAssemblyProfileId: rule.assetAssemblyProfileId,
    styleBridgeStatus: "valid",
    bridgeReason: rule.bridgeReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    modularBibleFamilyId: rule.modularBibleFamilyId,
    componentRecipeId: rule.componentRecipeId,
    assetAssemblyProfileId: rule.assetAssemblyProfileId,
    styleBridgeStatus: "valid",
    bridgeReason: rule.bridgeReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
