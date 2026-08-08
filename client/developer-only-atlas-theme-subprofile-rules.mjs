const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_THEME_SUBPROFILE_RULES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_THEME_SUBPROFILE_RULES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_THEME_SUBPROFILE_RULES_VERSION =
  "atlas_theme_subprofile_rules_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_THEME_SUBPROFILE_RULE_SET =
  Object.freeze([
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_VEGETATION_COASTAL_001",
        "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001"
      ]),
      architectureStyleProfileId:
        "ARCHITECTURE_STYLE_PROFILE_COASTAL_RESIDENTIAL_001",
      vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_COASTAL_001",
      streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_COASTAL_001",
      styleSubprofileReason:
        "coastal_theme_selects_light_residential_native_vegetation_and_open_edges",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_CIVIC_HERITAGE_001"
      ]),
      architectureStyleProfileId:
        "ARCHITECTURE_STYLE_PROFILE_HERITAGE_CIVIC_001",
      vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_URBAN_001",
      streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_HERITAGE_001",
      styleSubprofileReason:
        "heritage_theme_selects_civic_architecture_and_formal_streetscape",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_RURAL_FARMING_001",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_RESIDENTIAL_SUBURBAN_001"
      ]),
      architectureStyleProfileId:
        "ARCHITECTURE_STYLE_PROFILE_RURAL_RESIDENTIAL_001",
      vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_RURAL_001",
      streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_RURAL_001",
      styleSubprofileReason:
        "rural_theme_selects_spread_residential_and_grass_edge_streetscape",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_COMMERCIAL_URBAN_001"
      ]),
      architectureStyleProfileId:
        "ARCHITECTURE_STYLE_PROFILE_MODERN_COMMERCIAL_001",
      vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_URBAN_001",
      streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_URBAN_001",
      styleSubprofileReason:
        "urban_theme_selects_modern_commercial_frontage_and_hardscape_edges",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_FOREST_NATURAL_001",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_VEGETATION_COASTAL_001"
      ]),
      architectureStyleProfileId: "ARCHITECTURE_STYLE_PROFILE_RURAL_EDGE_001",
      vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_FOREST_001",
      streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_NATURAL_001",
      styleSubprofileReason:
        "forest_theme_selects_stronger_vegetation_bias_and_natural_edges",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_INDUSTRIAL_001",
      supportedAssetFamilyIds: Object.freeze([
        "ASSET_FAMILY_COMMERCIAL_URBAN_001"
      ]),
      architectureStyleProfileId:
        "ARCHITECTURE_STYLE_PROFILE_INDUSTRIAL_COMMERCIAL_001",
      vegetationStyleProfileId: "VEGETATION_STYLE_PROFILE_URBAN_001",
      streetscapeStyleProfileId: "STREETSCAPE_STYLE_PROFILE_INDUSTRIAL_001",
      styleSubprofileReason:
        "industrial_theme_selects_hardscape_and_muted_supporting_styles",
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
    atlasThemeSubprofileRulesVersion: state.atlasThemeSubprofileRulesVersion,
    registeredThemeSubprofileRuleCount:
      state.registeredThemeSubprofileRuleCount,
    architectureStyleProfileId: state.architectureStyleProfileId,
    vegetationStyleProfileId: state.vegetationStyleProfileId,
    streetscapeStyleProfileId: state.streetscapeStyleProfileId,
    themeSubprofileCompatibility: state.themeSubprofileCompatibility,
    styleSubprofileReason: state.styleSubprofileReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const worldThemeProfileId = sanitizeString(rule.worldThemeProfileId);
  if (!worldThemeProfileId) {
    throw Object.assign(new Error("MISSING_THEME_SUBPROFILE_RULE_ID"), {
      reasonCode: "MISSING_THEME_SUBPROFILE_RULE_ID"
    });
  }
  return deepFreeze({
    worldThemeProfileId,
    supportedAssetFamilyIds: deepFreeze(
      (rule.supportedAssetFamilyIds ?? []).map(String)
    ),
    architectureStyleProfileId: sanitizeString(rule.architectureStyleProfileId),
    vegetationStyleProfileId: sanitizeString(rule.vegetationStyleProfileId),
    streetscapeStyleProfileId: sanitizeString(rule.streetscapeStyleProfileId),
    styleSubprofileReason: sanitizeString(rule.styleSubprofileReason),
    status: sanitizeString(rule.status)
  });
}

function createInitialState({ version, registeredThemeSubprofileRuleCount }) {
  return {
    atlasThemeSubprofileRulesVersion: version,
    registeredThemeSubprofileRuleCount,
    architectureStyleProfileId: null,
    vegetationStyleProfileId: null,
    streetscapeStyleProfileId: null,
    themeSubprofileCompatibility: null,
    styleSubprofileReason: null,
    lastFailureReason: null
  };
}

export function createDeveloperOnlyAtlasThemeSubprofileRules({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_THEME_SUBPROFILE_RULES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_THEME_SUBPROFILE_RULE_SET
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasThemeSubprofileRules: true,
    __rules: normalizedRules,
    __state: createInitialState({
      version,
      registeredThemeSubprofileRuleCount: normalizedRules.length
    })
  };
}

export function getDeveloperOnlyAtlasThemeSubprofileRulesStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasThemeSubprofileRules) {
    return freezeStatus(
      createInitialState({
        version: null,
        registeredThemeSubprofileRuleCount: 0
      })
    );
  }
  return freezeStatus(registry.__state);
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasThemeSubprofileRules) {
    throw Object.assign(
      new Error("ATLAS_THEME_SUBPROFILE_RULES_UNAVAILABLE"),
      { reasonCode: "ATLAS_THEME_SUBPROFILE_RULES_UNAVAILABLE" }
    );
  }
}

function withUpdatedState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

export function resolveDeveloperOnlyAtlasThemeSubprofile(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const worldThemeProfileId = sanitizeString(input.worldThemeProfileId);
  const assetFamilyId = sanitizeString(input.assetFamilyId);

  const rule = registry.__rules.find(
    (candidate) => candidate.worldThemeProfileId === worldThemeProfileId
  );

  if (!rule) {
    withUpdatedState(registry, {
      architectureStyleProfileId: null,
      vegetationStyleProfileId: null,
      streetscapeStyleProfileId: null,
      themeSubprofileCompatibility: "blocked",
      styleSubprofileReason: "THEME_SUBPROFILE_RULE_NOT_FOUND",
      lastFailureReason: "THEME_SUBPROFILE_RULE_NOT_FOUND"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "THEME_SUBPROFILE_RULE_NOT_FOUND",
      architectureStyleProfileId: null,
      vegetationStyleProfileId: null,
      streetscapeStyleProfileId: null,
      themeSubprofileCompatibility: "blocked",
      styleSubprofileReason: "THEME_SUBPROFILE_RULE_NOT_FOUND",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  if (!rule.supportedAssetFamilyIds.includes(assetFamilyId)) {
    withUpdatedState(registry, {
      architectureStyleProfileId: null,
      vegetationStyleProfileId: null,
      streetscapeStyleProfileId: null,
      themeSubprofileCompatibility: "blocked",
      styleSubprofileReason: "ASSET_FAMILY_THEME_SUBPROFILE_INCOMPATIBLE",
      lastFailureReason: "ASSET_FAMILY_THEME_SUBPROFILE_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "ASSET_FAMILY_THEME_SUBPROFILE_INCOMPATIBLE",
      architectureStyleProfileId: null,
      vegetationStyleProfileId: null,
      streetscapeStyleProfileId: null,
      themeSubprofileCompatibility: "blocked",
      styleSubprofileReason: "ASSET_FAMILY_THEME_SUBPROFILE_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  withUpdatedState(registry, {
    architectureStyleProfileId: rule.architectureStyleProfileId,
    vegetationStyleProfileId: rule.vegetationStyleProfileId,
    streetscapeStyleProfileId: rule.streetscapeStyleProfileId,
    themeSubprofileCompatibility: "valid",
    styleSubprofileReason: rule.styleSubprofileReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    architectureStyleProfileId: rule.architectureStyleProfileId,
    vegetationStyleProfileId: rule.vegetationStyleProfileId,
    streetscapeStyleProfileId: rule.streetscapeStyleProfileId,
    themeSubprofileCompatibility: "valid",
    styleSubprofileReason: rule.styleSubprofileReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
