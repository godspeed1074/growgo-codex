const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_COMPONENT_ASSEMBLY_RULE_PROFILES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_COMPONENT_ASSEMBLY_RULE_PROFILES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_COMPONENT_ASSEMBLY_RULE_PROFILES_VERSION =
  "atlas_component_assembly_rule_profiles_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_COMPONENT_ASSEMBLY_RULES =
  Object.freeze([
    Object.freeze({
      ruleId: "COMPONENT_ASSEMBLY_RULE_COASTAL_VEGETATION_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_VEGETATION_NATIVE_001",
      componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
      assemblyRuleProfileId: "ASSEMBLY_RULE_PROFILE_COASTAL_VEGETATION_001",
      supportedFeatureClasses: Object.freeze([
        "coastal_green",
        "vegetation_area",
        "park"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_COASTAL_001",
        "BIOME_PROFILE_FOREST_001"
      ]),
      requiredComponentIds: Object.freeze(["vegetation_module"]),
      optionalComponentIds: Object.freeze(["edge_cluster", "canopy_variant"]),
      forbiddenComponentPairs: Object.freeze(["roof+wall", "door+fence"]),
      assemblyReason:
        "native_vegetation_assembly_allows_cluster_parts_and_blocks_building_envelope_parts",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "COMPONENT_ASSEMBLY_RULE_RURAL_RESIDENTIAL_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_RESIDENTIAL_RURAL_001",
      componentRecipeId: "COMPONENT_RECIPE_RESIDENTIAL_RURAL_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_RURAL_RESIDENTIAL_STEAD_001",
      assemblyRuleProfileId: "ASSEMBLY_RULE_PROFILE_RURAL_RESIDENTIAL_001",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_RURAL_001",
        "BIOME_PROFILE_FOREST_001"
      ]),
      requiredComponentIds: Object.freeze(["roof", "wall", "window", "door"]),
      optionalComponentIds: Object.freeze(["fence"]),
      forbiddenComponentPairs: Object.freeze([
        "vegetation_module+window",
        "edge_cluster+door"
      ]),
      assemblyReason:
        "rural_residential_assembly_requires_complete_building_envelope_with_optional_boundary",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "COMPONENT_ASSEMBLY_RULE_SUBURBAN_RESIDENTIAL_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_RESIDENTIAL_SUBURBAN_001",
      componentRecipeId: "COMPONENT_RECIPE_RESIDENTIAL_SUBURBAN_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_SUBURBAN_GARDEN_HOME_001",
      assemblyRuleProfileId: "ASSEMBLY_RULE_PROFILE_SUBURBAN_RESIDENTIAL_001",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_COASTAL_001",
        "BIOME_PROFILE_SUBURBAN_001"
      ]),
      requiredComponentIds: Object.freeze(["roof", "wall", "window", "door"]),
      optionalComponentIds: Object.freeze(["fence", "vegetation_module"]),
      forbiddenComponentPairs: Object.freeze(["edge_cluster+roof"]),
      assemblyReason:
        "suburban_residential_assembly_requires_home_envelope_with_optional_garden_and_boundary",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "COMPONENT_ASSEMBLY_RULE_HERITAGE_CIVIC_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_CIVIC_HERITAGE_001",
      componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001",
      assemblyRuleProfileId: "ASSEMBLY_RULE_PROFILE_HERITAGE_CIVIC_001",
      supportedFeatureClasses: Object.freeze([
        "civic_site",
        "building_footprint"
      ]),
      supportedBiomeProfileIds: Object.freeze([
        "BIOME_PROFILE_URBAN_001",
        "BIOME_PROFILE_SUBURBAN_001"
      ]),
      requiredComponentIds: Object.freeze(["roof", "wall", "window", "door"]),
      optionalComponentIds: Object.freeze(["fence"]),
      forbiddenComponentPairs: Object.freeze([
        "vegetation_module+wall",
        "canopy_variant+door"
      ]),
      assemblyReason:
        "heritage_civic_assembly_requires_formal_envelope_and_blocks_organic_component_mix",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "COMPONENT_ASSEMBLY_RULE_URBAN_COMMERCIAL_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_COMMERCIAL_URBAN_001",
      componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001",
      assemblyRuleProfileId: "ASSEMBLY_RULE_PROFILE_URBAN_COMMERCIAL_001",
      supportedFeatureClasses: Object.freeze(["building_footprint"]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      requiredComponentIds: Object.freeze(["roof", "wall", "window", "door"]),
      optionalComponentIds: Object.freeze(["fence"]),
      forbiddenComponentPairs: Object.freeze([
        "vegetation_module+wall",
        "edge_cluster+window"
      ]),
      assemblyReason:
        "urban_commercial_assembly_requires_frontage_envelope_and excludes_green_cluster_mix",
      status: "approved"
    }),
    Object.freeze({
      ruleId: "COMPONENT_ASSEMBLY_RULE_INDUSTRIAL_STREETSCAPE_001",
      modularBibleFamilyId: "MODULAR_BIBLE_FAMILY_STREETSCAPE_INDUSTRIAL_001",
      componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
      assetAssemblyProfileId:
        "ASSET_ASSEMBLY_PROFILE_INDUSTRIAL_STREET_EDGE_001",
      assemblyRuleProfileId: "ASSEMBLY_RULE_PROFILE_INDUSTRIAL_STREETSCAPE_001",
      supportedFeatureClasses: Object.freeze(["roadway", "civic_site"]),
      supportedBiomeProfileIds: Object.freeze(["BIOME_PROFILE_URBAN_001"]),
      requiredComponentIds: Object.freeze(["fence"]),
      optionalComponentIds: Object.freeze(["wall"]),
      forbiddenComponentPairs: Object.freeze(["roof+window", "door+vegetation_module"]),
      assemblyReason:
        "industrial_edge_assembly_requires_boundary_parts and blocks building envelope mixes",
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
    atlasComponentAssemblyRuleProfilesVersion:
      state.atlasComponentAssemblyRuleProfilesVersion,
    registeredComponentAssemblyRuleCount:
      state.registeredComponentAssemblyRuleCount,
    componentCompatibilityStatus: state.componentCompatibilityStatus,
    assemblyRuleProfileId: state.assemblyRuleProfileId,
    requiredComponentCount: state.requiredComponentCount,
    validatedComponentCount: state.validatedComponentCount,
    assemblyReason: state.assemblyReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const ruleId = sanitizeString(rule.ruleId);
  const modularBibleFamilyId = sanitizeString(rule.modularBibleFamilyId);
  const componentRecipeId = sanitizeString(rule.componentRecipeId);
  const assetAssemblyProfileId = sanitizeString(rule.assetAssemblyProfileId);
  const assemblyRuleProfileId = sanitizeString(rule.assemblyRuleProfileId);
  if (!ruleId) {
    throw Object.assign(new Error("MISSING_COMPONENT_ASSEMBLY_RULE_ID"), {
      reasonCode: "MISSING_COMPONENT_ASSEMBLY_RULE_ID"
    });
  }
  if (
    !modularBibleFamilyId ||
    !componentRecipeId ||
    !assetAssemblyProfileId ||
    !assemblyRuleProfileId
  ) {
    throw Object.assign(new Error("INCOMPLETE_COMPONENT_ASSEMBLY_RULE"), {
      reasonCode: "INCOMPLETE_COMPONENT_ASSEMBLY_RULE"
    });
  }
  return deepFreeze({
    ruleId,
    modularBibleFamilyId,
    componentRecipeId,
    assetAssemblyProfileId,
    assemblyRuleProfileId,
    supportedFeatureClasses: deepFreeze(
      (rule.supportedFeatureClasses ?? []).map(String)
    ),
    supportedBiomeProfileIds: deepFreeze(
      (rule.supportedBiomeProfileIds ?? []).map(String)
    ),
    requiredComponentIds: deepFreeze(
      (rule.requiredComponentIds ?? []).map(String)
    ),
    optionalComponentIds: deepFreeze(
      (rule.optionalComponentIds ?? []).map(String)
    ),
    forbiddenComponentPairs: deepFreeze(
      (rule.forbiddenComponentPairs ?? []).map(String)
    ),
    assemblyReason: sanitizeString(rule.assemblyReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasComponentAssemblyRuleProfilesVersion: version,
    registeredComponentAssemblyRuleCount: rules.length,
    componentCompatibilityStatus: null,
    assemblyRuleProfileId: null,
    requiredComponentCount: 0,
    validatedComponentCount: 0,
    assemblyReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasComponentAssemblyRuleProfiles) {
    throw Object.assign(
      new Error("ATLAS_COMPONENT_ASSEMBLY_RULE_PROFILES_UNAVAILABLE"),
      { reasonCode: "ATLAS_COMPONENT_ASSEMBLY_RULE_PROFILES_UNAVAILABLE" }
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
    componentCompatibilityStatus: "blocked",
    assemblyRuleProfileId: null,
    requiredComponentCount: 0,
    validatedComponentCount: 0,
    assemblyReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    componentCompatibilityStatus: "blocked",
    assemblyRuleProfileId: null,
    requiredComponentCount: 0,
    validatedComponentCount: 0,
    assemblyReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasComponentAssemblyRuleProfiles({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_COMPONENT_ASSEMBLY_RULE_PROFILES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_COMPONENT_ASSEMBLY_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasComponentAssemblyRuleProfiles: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasComponentAssemblyRuleProfilesStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasComponentAssemblyRuleProfiles) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasComponentAssemblyRuleProfile(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const modularBibleFamilyId = sanitizeString(input.modularBibleFamilyId);
  const componentRecipeId = sanitizeString(input.componentRecipeId);
  const assetAssemblyProfileId = sanitizeString(input.assetAssemblyProfileId);
  const featureClass = sanitizeString(input.featureClass);
  const biomeProfileId = sanitizeString(input.biomeProfileId);

  const rule = registry.__rules.find(
    (candidate) =>
      candidate.modularBibleFamilyId === modularBibleFamilyId &&
      candidate.componentRecipeId === componentRecipeId &&
      candidate.assetAssemblyProfileId === assetAssemblyProfileId
  );

  if (!rule) {
    return fail(registry, "COMPONENT_ASSEMBLY_RULE_NOT_FOUND");
  }
  if (!rule.supportedFeatureClasses.includes(featureClass)) {
    return fail(registry, "COMPONENT_ASSEMBLY_FEATURE_CLASS_INCOMPATIBLE");
  }
  if (!rule.supportedBiomeProfileIds.includes(biomeProfileId)) {
    return fail(registry, "COMPONENT_ASSEMBLY_BIOME_INCOMPATIBLE");
  }

  const componentIds = new Set([
    ...rule.requiredComponentIds,
    ...rule.optionalComponentIds
  ]);
  const hasForbiddenPair = rule.forbiddenComponentPairs.some((pair) => {
    const [left, right] = pair.split("+");
    return componentIds.has(left) && componentIds.has(right);
  });
  if (hasForbiddenPair) {
    return fail(registry, "COMPONENT_ASSEMBLY_FORBIDDEN_COMBINATION");
  }

  const requiredComponentCount = rule.requiredComponentIds.length;
  const validatedComponentCount =
    rule.requiredComponentIds.length + rule.optionalComponentIds.length;

  updateState(registry, {
    componentCompatibilityStatus: "valid",
    assemblyRuleProfileId: rule.assemblyRuleProfileId,
    requiredComponentCount,
    validatedComponentCount,
    assemblyReason: rule.assemblyReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    componentCompatibilityStatus: "valid",
    assemblyRuleProfileId: rule.assemblyRuleProfileId,
    requiredComponentCount,
    validatedComponentCount,
    assemblyReason: rule.assemblyReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
