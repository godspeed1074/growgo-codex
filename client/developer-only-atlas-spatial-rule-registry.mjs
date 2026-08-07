const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_SPATIAL_RULE_REGISTRY_STATUS_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_SPATIAL_RULE_REGISTRY_VERSION =
  "atlas_spatial_rule_registry_v1";

const DEFAULT_APPROVED_REGIONS = Object.freeze([
  "BELLARINE",
  "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
]);
const DEFAULT_APPROVED_PACKAGES = Object.freeze([
  "ATLAS_DEVELOPER_PACKAGE",
  "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"
]);
const DEFAULT_APPROVED_RECIPES = Object.freeze([
  "TREE_EUCALYPTUS_RECIPE_001",
  "TREE_BOTTLEBRUSH_RECIPE_001",
  "SHRUB_COASTAL_LOW_RECIPE_001",
  "SPORTS_OVAL_RECIPE_001",
  "RECREATION_AREA_RECIPE_001",
  "BUILDING_CIVIC_SPORTS_PAVILION_001",
  "COASTAL_LOCATION_RECIPE_001"
]);

export const DEFAULT_DEVELOPER_ONLY_ATLAS_SPATIAL_RULES = Object.freeze([
  Object.freeze({
    ruleId: "SPATIAL_RULE_TREE_EUCALYPTUS_001",
    ruleVersion: "v1",
    assetId: "TREE_EUCALYPTUS_001",
    assetCategory: "vegetation",
    supportedAssetFamilies: Object.freeze(["COASTAL_NATURE_FAMILY_001"]),
    allowedFeatureClasses: Object.freeze([
      "vegetation_area",
      "park",
      "reserve",
      "roadside_green"
    ]),
    prohibitedFeatureClasses: Object.freeze([
      "building_footprint",
      "unsupported"
    ]),
    minimumSpacing: 8,
    maximumDensity: 1,
    orientationPolicy: Object.freeze({
      mode: "deterministic_seed_rotation"
    }),
    scalePolicy: Object.freeze({
      mode: "registry_default"
    }),
    lodPolicy: Object.freeze({
      mode: "registry_default"
    }),
    exclusionRadiusRules: Object.freeze({
      building_footprint: 6
    }),
    regionConstraints: Object.freeze({
      approvedRegions: DEFAULT_APPROVED_REGIONS,
      approvedPackages: DEFAULT_APPROVED_PACKAGES,
      approvedRecipeIds: DEFAULT_APPROVED_RECIPES
    }),
    deterministicRuleSeed: "TREE_EUCALYPTUS_001_SPATIAL_RULE_SEED",
    status: "approved"
  }),
  Object.freeze({
    ruleId: "SPATIAL_RULE_TREE_BOTTLEBRUSH_001",
    ruleVersion: "v1",
    assetId: "TREE_BOTTLEBRUSH_001",
    assetCategory: "vegetation",
    supportedAssetFamilies: Object.freeze(["COASTAL_NATURE_FAMILY_001"]),
    allowedFeatureClasses: Object.freeze([
      "park",
      "reserve",
      "coastal_green",
      "roadside_green"
    ]),
    prohibitedFeatureClasses: Object.freeze([
      "building_footprint",
      "unsupported"
    ]),
    minimumSpacing: 7,
    maximumDensity: 1,
    orientationPolicy: Object.freeze({
      mode: "deterministic_seed_rotation"
    }),
    scalePolicy: Object.freeze({
      mode: "registry_default"
    }),
    lodPolicy: Object.freeze({
      mode: "registry_default"
    }),
    exclusionRadiusRules: Object.freeze({
      building_footprint: 5
    }),
    regionConstraints: Object.freeze({
      approvedRegions: DEFAULT_APPROVED_REGIONS,
      approvedPackages: DEFAULT_APPROVED_PACKAGES,
      approvedRecipeIds: DEFAULT_APPROVED_RECIPES
    }),
    deterministicRuleSeed: "TREE_BOTTLEBRUSH_001_SPATIAL_RULE_SEED",
    status: "approved"
  }),
  Object.freeze({
    ruleId: "SPATIAL_RULE_SHRUB_COASTAL_LOW_001",
    ruleVersion: "v1",
    assetId: "SHRUB_COASTAL_LOW_001",
    assetCategory: "vegetation",
    supportedAssetFamilies: Object.freeze(["COASTAL_SHRUB_FAMILY_001"]),
    allowedFeatureClasses: Object.freeze([
      "coastal_green",
      "reserve",
      "vegetation_area"
    ]),
    prohibitedFeatureClasses: Object.freeze([
      "building_footprint",
      "unsupported"
    ]),
    minimumSpacing: 2.5,
    maximumDensity: 3,
    orientationPolicy: Object.freeze({
      mode: "deterministic_seed_rotation"
    }),
    scalePolicy: Object.freeze({
      mode: "registry_default"
    }),
    lodPolicy: Object.freeze({
      mode: "registry_default"
    }),
    exclusionRadiusRules: Object.freeze({
      building_footprint: 2
    }),
    regionConstraints: Object.freeze({
      approvedRegions: DEFAULT_APPROVED_REGIONS,
      approvedPackages: DEFAULT_APPROVED_PACKAGES,
      approvedRecipeIds: DEFAULT_APPROVED_RECIPES
    }),
    deterministicRuleSeed: "SHRUB_COASTAL_LOW_001_SPATIAL_RULE_SEED",
    status: "approved"
  }),
  Object.freeze({
    ruleId: "SPATIAL_RULE_BUILDING_CIVIC_SPORTS_PAVILION_001",
    ruleVersion: "v1",
    assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
    assetCategory: "building",
    supportedAssetFamilies: Object.freeze([
      "CIVIC_SPORTS_PAVILION_FAMILY_001"
    ]),
    allowedFeatureClasses: Object.freeze([
      "civic_site",
      "sports_ground",
      "building_footprint"
    ]),
    prohibitedFeatureClasses: Object.freeze([
      "vegetation_area",
      "park",
      "reserve",
      "coastal_green",
      "roadside_green",
      "unsupported"
    ]),
    minimumSpacing: 20,
    maximumDensity: 1,
    orientationPolicy: Object.freeze({
      mode: "orientation_hint_or_cardinal"
    }),
    scalePolicy: Object.freeze({
      mode: "registry_default"
    }),
    lodPolicy: Object.freeze({
      mode: "registry_default"
    }),
    exclusionRadiusRules: Object.freeze({
      vegetation_area: 5
    }),
    regionConstraints: Object.freeze({
      approvedRegions: DEFAULT_APPROVED_REGIONS,
      approvedPackages: DEFAULT_APPROVED_PACKAGES,
      approvedRecipeIds: DEFAULT_APPROVED_RECIPES
    }),
    deterministicRuleSeed:
      "BUILDING_CIVIC_SPORTS_PAVILION_001_SPATIAL_RULE_SEED",
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

function validateStringArray(values, reasonCode) {
  if (!Array.isArray(values) || values.length === 0) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return deepFreeze(values.map((value) => String(value)));
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const ruleVersion = sanitizeString(rule.ruleVersion);
  const assetId = sanitizeString(rule.assetId);
  const assetCategory = sanitizeString(rule.assetCategory);
  const status = sanitizeString(rule.status);

  if (!ruleId) {
    throw Object.assign(new Error("MISSING_RULE_ID"), { reasonCode: "MISSING_RULE_ID" });
  }
  if (!ruleVersion) {
    throw Object.assign(new Error("MISSING_RULE_VERSION"), {
      reasonCode: "MISSING_RULE_VERSION"
    });
  }
  if (!assetId) {
    throw Object.assign(new Error("MISSING_ASSET_ID"), { reasonCode: "MISSING_ASSET_ID" });
  }
  if (!assetCategory) {
    throw Object.assign(new Error("MISSING_ASSET_CATEGORY"), {
      reasonCode: "MISSING_ASSET_CATEGORY"
    });
  }

  return deepFreeze({
    ruleId,
    ruleVersion,
    assetId,
    assetCategory,
    supportedAssetFamilies: validateStringArray(
      rule.supportedAssetFamilies,
      "MISSING_SUPPORTED_ASSET_FAMILIES"
    ),
    allowedFeatureClasses: validateStringArray(
      rule.allowedFeatureClasses,
      "MISSING_ALLOWED_FEATURE_CLASSES"
    ),
    prohibitedFeatureClasses: validateStringArray(
      rule.prohibitedFeatureClasses,
      "MISSING_PROHIBITED_FEATURE_CLASSES"
    ),
    minimumSpacing: Number(rule.minimumSpacing ?? 0),
    maximumDensity: Number(rule.maximumDensity ?? 0),
    orientationPolicy: deepFreeze({ ...(rule.orientationPolicy ?? {}) }),
    scalePolicy: deepFreeze({ ...(rule.scalePolicy ?? {}) }),
    lodPolicy: deepFreeze({ ...(rule.lodPolicy ?? {}) }),
    exclusionRadiusRules: deepFreeze({ ...(rule.exclusionRadiusRules ?? {}) }),
    regionConstraints: deepFreeze({
      approvedRegions: validateStringArray(
        rule.regionConstraints?.approvedRegions,
        "MISSING_APPROVED_REGIONS"
      ),
      approvedPackages: validateStringArray(
        rule.regionConstraints?.approvedPackages,
        "MISSING_APPROVED_PACKAGES"
      ),
      approvedRecipeIds: validateStringArray(
        rule.regionConstraints?.approvedRecipeIds,
        "MISSING_APPROVED_RECIPE_IDS"
      )
    }),
    deterministicRuleSeed:
      sanitizeString(rule.deterministicRuleSeed) ?? `${assetId}_RULE_SEED`,
    status: status ?? "approved"
  });
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    spatialRuleRegistryVersion: state.spatialRuleRegistryVersion,
    registeredRuleCount: state.registeredRuleCount,
    lastResolvedRuleId: state.lastResolvedRuleId,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasSpatialRuleRegistry({
  spatialRuleRegistryVersion = DEFAULT_DEVELOPER_ONLY_ATLAS_SPATIAL_RULE_REGISTRY_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_SPATIAL_RULES
} = {}) {
  const byRuleId = new Map();
  const byAssetId = new Map();
  const validated = [];

  for (const rule of rules) {
    const sanitized = validateRule(rule);
    if (byRuleId.has(sanitized.ruleId)) {
      throw Object.assign(new Error("DUPLICATE_SPATIAL_RULE_ID"), {
        reasonCode: "DUPLICATE_SPATIAL_RULE_ID"
      });
    }
    byRuleId.set(sanitized.ruleId, sanitized);
    byAssetId.set(sanitized.assetId, sanitized);
    validated.push(sanitized);
  }

  const state = {
    spatialRuleRegistryVersion:
      sanitizeString(spatialRuleRegistryVersion) ??
      DEFAULT_DEVELOPER_ONLY_ATLAS_SPATIAL_RULE_REGISTRY_VERSION,
    registeredRuleCount: validated.length,
    lastResolvedRuleId: null,
    lastFailureReason: null
  };

  return Object.freeze({
    __growgoDeveloperOnlyAtlasSpatialRuleRegistry: true,
    __state: state,
    __internal: {
      rules: deepFreeze([...validated]),
      byRuleId,
      byAssetId
    }
  });
}

export function resolveDeveloperOnlyAtlasSpatialRule(registry, ruleId) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasSpatialRuleRegistry ||
    !registry.__state ||
    !registry.__internal
  ) {
    throw Object.assign(new Error("ATLAS_SPATIAL_RULE_REGISTRY_UNAVAILABLE"), {
      reasonCode: "ATLAS_SPATIAL_RULE_REGISTRY_UNAVAILABLE"
    });
  }

  const normalizedRuleId = sanitizeString(ruleId);
  if (!normalizedRuleId) {
    registry.__state.lastFailureReason = "MISSING_RULE_ID";
    throw Object.assign(new Error("MISSING_RULE_ID"), {
      reasonCode: "MISSING_RULE_ID"
    });
  }

  const rule = registry.__internal.byRuleId.get(normalizedRuleId) ?? null;
  if (!rule) {
    registry.__state.lastFailureReason = "UNKNOWN_SPATIAL_RULE_ID";
    throw Object.assign(new Error("UNKNOWN_SPATIAL_RULE_ID"), {
      reasonCode: "UNKNOWN_SPATIAL_RULE_ID"
    });
  }

  registry.__state.lastResolvedRuleId = normalizedRuleId;
  registry.__state.lastFailureReason = null;
  return rule;
}

export function resolveDeveloperOnlyAtlasSpatialRuleByAssetId(registry, assetId) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasSpatialRuleRegistry ||
    !registry.__state ||
    !registry.__internal
  ) {
    throw Object.assign(new Error("ATLAS_SPATIAL_RULE_REGISTRY_UNAVAILABLE"), {
      reasonCode: "ATLAS_SPATIAL_RULE_REGISTRY_UNAVAILABLE"
    });
  }

  const normalizedAssetId = sanitizeString(assetId);
  const rule = registry.__internal.byAssetId.get(normalizedAssetId) ?? null;
  if (!rule) {
    registry.__state.lastFailureReason = "UNKNOWN_ASSET_SPATIAL_RULE";
    throw Object.assign(new Error("UNKNOWN_ASSET_SPATIAL_RULE"), {
      reasonCode: "UNKNOWN_ASSET_SPATIAL_RULE"
    });
  }

  registry.__state.lastResolvedRuleId = rule.ruleId;
  registry.__state.lastFailureReason = null;
  return rule;
}

export function getDeveloperOnlyAtlasSpatialRuleRegistryStatus(registry) {
  if (
    !registry?.__growgoDeveloperOnlyAtlasSpatialRuleRegistry ||
    !registry.__state
  ) {
    return freezeStatus({
      spatialRuleRegistryVersion:
        DEFAULT_DEVELOPER_ONLY_ATLAS_SPATIAL_RULE_REGISTRY_VERSION,
      registeredRuleCount: 0,
      lastResolvedRuleId: null,
      lastFailureReason: "ATLAS_SPATIAL_RULE_REGISTRY_UNAVAILABLE"
    });
  }

  return freezeStatus(registry.__state);
}
