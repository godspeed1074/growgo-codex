const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_WORLD_THEME_STYLE_BUNDLES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_WORLD_THEME_STYLE_BUNDLES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_WORLD_THEME_STYLE_BUNDLES_VERSION =
  "atlas_world_theme_style_bundles_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_WORLD_THEME_STYLE_BUNDLE_RULES =
  Object.freeze([
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_AUSTRALIAN_COASTAL_001",
      regionalStyleBundleId: "REGIONAL_STYLE_BUNDLE_AUSTRALIAN_COASTAL_001",
      supportedSettlementPackageProfileIds: Object.freeze([
        "SETTLEMENT_PACKAGE_PROFILE_COASTAL_VILLAGE_001"
      ]),
      supportedBiomePackageProfileIds: Object.freeze([
        "BIOME_PACKAGE_PROFILE_COASTAL_001"
      ]),
      supportedWorldPackageCategories: Object.freeze(["coastal", "park"]),
      visualCohesionScore: 0.94,
      themeSelectionReason:
        "australian_coastal_theme_aligns_coastal_settlement_and_green_edge_assets",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_VICTORIAN_HERITAGE_001",
      regionalStyleBundleId: "REGIONAL_STYLE_BUNDLE_VICTORIAN_HERITAGE_001",
      supportedSettlementPackageProfileIds: Object.freeze([
        "SETTLEMENT_PACKAGE_PROFILE_HERITAGE_TOWN_001"
      ]),
      supportedBiomePackageProfileIds: Object.freeze([
        "BIOME_PACKAGE_PROFILE_URBAN_001"
      ]),
      supportedWorldPackageCategories: Object.freeze(["civic", "park"]),
      visualCohesionScore: 0.96,
      themeSelectionReason:
        "victorian_heritage_theme_aligns_civic_landmarks_materials_and_open_space",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_RURAL_FARMING_001",
      regionalStyleBundleId: "REGIONAL_STYLE_BUNDLE_RURAL_FARMING_001",
      supportedSettlementPackageProfileIds: Object.freeze([
        "SETTLEMENT_PACKAGE_PROFILE_RURAL_TOWN_001"
      ]),
      supportedBiomePackageProfileIds: Object.freeze([
        "BIOME_PACKAGE_PROFILE_RURAL_001"
      ]),
      supportedWorldPackageCategories: Object.freeze(["residential", "park"]),
      visualCohesionScore: 0.9,
      themeSelectionReason:
        "rural_farming_theme_aligns_town_edge_assets_and_open_green_packages",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_MODERN_URBAN_001",
      regionalStyleBundleId: "REGIONAL_STYLE_BUNDLE_MODERN_URBAN_001",
      supportedSettlementPackageProfileIds: Object.freeze([
        "SETTLEMENT_PACKAGE_PROFILE_URBAN_DISTRICT_001"
      ]),
      supportedBiomePackageProfileIds: Object.freeze([
        "BIOME_PACKAGE_PROFILE_URBAN_001"
      ]),
      supportedWorldPackageCategories: Object.freeze(["commercial", "civic"]),
      visualCohesionScore: 0.92,
      themeSelectionReason:
        "modern_urban_theme_aligns_commercial_frontage_and_civic_bundles",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_FOREST_NATURAL_001",
      regionalStyleBundleId: "REGIONAL_STYLE_BUNDLE_FOREST_NATURAL_001",
      supportedSettlementPackageProfileIds: Object.freeze([
        "SETTLEMENT_PACKAGE_PROFILE_RURAL_TOWN_001"
      ]),
      supportedBiomePackageProfileIds: Object.freeze([
        "BIOME_PACKAGE_PROFILE_RURAL_001"
      ]),
      supportedWorldPackageCategories: Object.freeze(["park", "residential"]),
      visualCohesionScore: 0.88,
      themeSelectionReason:
        "forest_natural_theme_preserves_green_bias_and_rural_residential_compatibility",
      status: "approved"
    }),
    Object.freeze({
      worldThemeProfileId: "WORLD_THEME_PROFILE_INDUSTRIAL_001",
      regionalStyleBundleId: "REGIONAL_STYLE_BUNDLE_INDUSTRIAL_001",
      supportedSettlementPackageProfileIds: Object.freeze([
        "SETTLEMENT_PACKAGE_PROFILE_INDUSTRIAL_AREA_001"
      ]),
      supportedBiomePackageProfileIds: Object.freeze([
        "BIOME_PACKAGE_PROFILE_URBAN_001"
      ]),
      supportedWorldPackageCategories: Object.freeze(["commercial"]),
      visualCohesionScore: 0.87,
      themeSelectionReason:
        "industrial_theme_preserves_hardscape_commercial_style_bundle",
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
    atlasWorldThemeStyleBundlesVersion:
      state.atlasWorldThemeStyleBundlesVersion,
    registeredThemeBundleRuleCount: state.registeredThemeBundleRuleCount,
    worldThemeProfileId: state.worldThemeProfileId,
    regionalStyleBundleId: state.regionalStyleBundleId,
    visualCohesionScore: state.visualCohesionScore,
    themeCompatibilityStatus: state.themeCompatibilityStatus,
    themeSelectionReason: state.themeSelectionReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const worldThemeProfileId = sanitizeString(rule.worldThemeProfileId);
  const regionalStyleBundleId = sanitizeString(rule.regionalStyleBundleId);
  if (!worldThemeProfileId || !regionalStyleBundleId) {
    throw Object.assign(new Error("MISSING_THEME_BUNDLE_ID"), {
      reasonCode: "MISSING_THEME_BUNDLE_ID"
    });
  }
  return deepFreeze({
    worldThemeProfileId,
    regionalStyleBundleId,
    supportedSettlementPackageProfileIds: deepFreeze(
      (rule.supportedSettlementPackageProfileIds ?? []).map(String)
    ),
    supportedBiomePackageProfileIds: deepFreeze(
      (rule.supportedBiomePackageProfileIds ?? []).map(String)
    ),
    supportedWorldPackageCategories: deepFreeze(
      (rule.supportedWorldPackageCategories ?? []).map(String)
    ),
    visualCohesionScore: Number(rule.visualCohesionScore ?? 0),
    themeSelectionReason: sanitizeString(rule.themeSelectionReason),
    status: sanitizeString(rule.status)
  });
}

function createInitialState({ version, registeredThemeBundleRuleCount }) {
  return {
    atlasWorldThemeStyleBundlesVersion: version,
    registeredThemeBundleRuleCount,
    worldThemeProfileId: null,
    regionalStyleBundleId: null,
    visualCohesionScore: null,
    themeCompatibilityStatus: null,
    themeSelectionReason: null,
    lastFailureReason: null
  };
}

export function createDeveloperOnlyAtlasWorldThemeStyleBundles({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_WORLD_THEME_STYLE_BUNDLES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_WORLD_THEME_STYLE_BUNDLE_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasWorldThemeStyleBundles: true,
    __rules: normalizedRules,
    __state: createInitialState({
      version,
      registeredThemeBundleRuleCount: normalizedRules.length
    })
  };
}

export function getDeveloperOnlyAtlasWorldThemeStyleBundlesStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasWorldThemeStyleBundles) {
    return freezeStatus(
      createInitialState({
        version: null,
        registeredThemeBundleRuleCount: 0
      })
    );
  }
  return freezeStatus(registry.__state);
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasWorldThemeStyleBundles) {
    throw Object.assign(
      new Error("ATLAS_WORLD_THEME_STYLE_BUNDLES_UNAVAILABLE"),
      { reasonCode: "ATLAS_WORLD_THEME_STYLE_BUNDLES_UNAVAILABLE" }
    );
  }
}

function withUpdatedState(registry, patch) {
  for (const [key, value] of Object.entries(patch)) {
    registry.__state[key] = value;
  }
}

export function resolveDeveloperOnlyAtlasWorldThemeStyleBundle(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const settlementPackageProfileId = sanitizeString(
    input.settlementPackageProfileId
  );
  const biomePackageProfileId = sanitizeString(input.biomePackageProfileId);
  const worldPackageCategory = sanitizeString(input.worldPackageCategory);
  const resolvedWorldPackageId = sanitizeString(input.resolvedWorldPackageId);

  const rule = registry.__rules.find(
    (candidate) =>
      candidate.supportedSettlementPackageProfileIds.includes(
        settlementPackageProfileId
      ) &&
      candidate.supportedBiomePackageProfileIds.includes(biomePackageProfileId)
  );

  if (!rule) {
    withUpdatedState(registry, {
      worldThemeProfileId: null,
      regionalStyleBundleId: null,
      visualCohesionScore: null,
      themeCompatibilityStatus: "blocked",
      themeSelectionReason: "THEME_RULE_NOT_FOUND",
      lastFailureReason: "THEME_RULE_NOT_FOUND"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "THEME_RULE_NOT_FOUND",
      worldThemeProfileId: null,
      regionalStyleBundleId: null,
      visualCohesionScore: null,
      themeCompatibilityStatus: "blocked",
      themeSelectionReason: "THEME_RULE_NOT_FOUND",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  if (!rule.supportedWorldPackageCategories.includes(worldPackageCategory)) {
    withUpdatedState(registry, {
      worldThemeProfileId: rule.worldThemeProfileId,
      regionalStyleBundleId: rule.regionalStyleBundleId,
      visualCohesionScore: null,
      themeCompatibilityStatus: "blocked",
      themeSelectionReason: "WORLD_PACKAGE_THEME_INCOMPATIBLE",
      lastFailureReason: "WORLD_PACKAGE_THEME_INCOMPATIBLE"
    });
    return deepFreeze({
      schemaId: RESULT_SCHEMA_ID,
      matched: false,
      reasonCode: "WORLD_PACKAGE_THEME_INCOMPATIBLE",
      worldThemeProfileId: rule.worldThemeProfileId,
      regionalStyleBundleId: rule.regionalStyleBundleId,
      visualCohesionScore: null,
      themeCompatibilityStatus: "blocked",
      themeSelectionReason: "WORLD_PACKAGE_THEME_INCOMPATIBLE",
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  const regionalStyleBundleId = `REGIONAL_STYLE_BUNDLE_${hashString(
    stableSerialize({
      worldThemeProfileId: rule.worldThemeProfileId,
      regionalStyleBundleId: rule.regionalStyleBundleId,
      settlementPackageProfileId,
      biomePackageProfileId,
      worldPackageCategory,
      resolvedWorldPackageId
    })
  )
    .slice(0, 16)
    .toUpperCase()}`;

  withUpdatedState(registry, {
    worldThemeProfileId: rule.worldThemeProfileId,
    regionalStyleBundleId,
    visualCohesionScore: Number(rule.visualCohesionScore.toFixed(2)),
    themeCompatibilityStatus: "valid",
    themeSelectionReason: rule.themeSelectionReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    worldThemeProfileId: rule.worldThemeProfileId,
    regionalStyleBundleId,
    visualCohesionScore: Number(rule.visualCohesionScore.toFixed(2)),
    themeCompatibilityStatus: "valid",
    themeSelectionReason: rule.themeSelectionReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
