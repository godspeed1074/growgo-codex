const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_BUILD_RECIPES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_BUILD_RECIPES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_BUILD_RECIPES_VERSION =
  "atlas_asset_factory_build_recipes_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_BUILD_RECIPE_RULES =
  Object.freeze([
    Object.freeze({
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_COASTAL_TREE_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_VEGETATION_001",
      assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_COASTAL_TREE_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_VEGETATION_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_COASTAL_VEGETATION_001",
      buildStepCount: 4,
      dependencyCount: 1,
      factoryReadinessStatus: "ready",
      factoryReadinessReason:
        "coastal tree build recipe preserves manifest validation dependency and queue ordering",
      status: "approved"
    }),
    Object.freeze({
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_COASTAL_TREE_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_VEGETATION_COMPACT_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_COASTAL_TREE_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_VEGETATION_COMPACT_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_COASTAL_VEGETATION_COMPACT_001",
      buildStepCount: 4,
      dependencyCount: 1,
      factoryReadinessStatus: "ready",
      factoryReadinessReason:
        "compact coastal tree build recipe preserves lightweight manifest dependency and queue ordering",
      status: "approved"
    }),
    Object.freeze({
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_HERITAGE_CIVIC_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_HERITAGE_CIVIC_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_001",
      buildStepCount: 6,
      dependencyCount: 3,
      factoryReadinessStatus: "ready",
      factoryReadinessReason:
        "heritage civic build recipe preserves validated dependencies and building queue order",
      status: "approved"
    }),
    Object.freeze({
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_HERITAGE_CIVIC_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_BUILDINGS_COMPACT_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_HERITAGE_CIVIC_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_COMPACT_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_HERITAGE_CIVIC_COMPACT_001",
      buildStepCount: 6,
      dependencyCount: 3,
      factoryReadinessStatus: "ready",
      factoryReadinessReason:
        "compact heritage civic build recipe preserves validated compact dependencies and queue order",
      status: "approved"
    }),
    Object.freeze({
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_URBAN_COMMERCIAL_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_URBAN_COMMERCIAL_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_URBAN_COMMERCIAL_001",
      buildStepCount: 5,
      dependencyCount: 2,
      factoryReadinessStatus: "ready",
      factoryReadinessReason:
        "urban commercial build recipe preserves frontage dependency validation and queue grouping",
      status: "approved"
    }),
    Object.freeze({
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_RURAL_RESIDENTIAL_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_RURAL_RESIDENTIAL_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_RURAL_RESIDENTIAL_001",
      buildStepCount: 5,
      dependencyCount: 2,
      factoryReadinessStatus: "ready",
      factoryReadinessReason:
        "rural residential build recipe preserves deterministic dependencies and queue grouping",
      status: "approved"
    }),
    Object.freeze({
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_STREETSCAPE_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_001",
      buildStepCount: 4,
      dependencyCount: 1,
      factoryReadinessStatus: "ready",
      factoryReadinessReason:
        "industrial edge build recipe preserves deterministic street furniture queue ordering",
      status: "approved"
    }),
    Object.freeze({
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_STREETSCAPE_COMPACT_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_COMPACT_001",
      exportContractId: "ATLAS_EXPORT_CONTRACT_INDUSTRIAL_EDGE_COMPACT_001",
      buildStepCount: 4,
      dependencyCount: 1,
      factoryReadinessStatus: "ready",
      factoryReadinessReason:
        "compact industrial edge build recipe preserves deterministic compact queue ordering",
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
    atlasAssetFactoryBuildRecipesVersion:
      state.atlasAssetFactoryBuildRecipesVersion,
    registeredAssetFactoryBuildRecipeRuleCount:
      state.registeredAssetFactoryBuildRecipeRuleCount,
    assetBuildRecipeId: state.assetBuildRecipeId,
    generationQueueProfileId: state.generationQueueProfileId,
    buildStepCount: state.buildStepCount,
    dependencyCount: state.dependencyCount,
    factoryReadinessStatus: state.factoryReadinessStatus,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const assetBuildRecipeId = sanitizeString(rule.assetBuildRecipeId);
  const generationQueueProfileId = sanitizeString(
    rule.generationQueueProfileId
  );
  const assetPackageManifestId = sanitizeString(rule.assetPackageManifestId);
  const exportValidationProfileId = sanitizeString(
    rule.exportValidationProfileId
  );
  const exportContractId = sanitizeString(rule.exportContractId);
  const buildStepCount = Number(rule.buildStepCount ?? 0);
  const dependencyCount = Number(rule.dependencyCount ?? 0);
  if (
    !assetBuildRecipeId ||
    !generationQueueProfileId ||
    !assetPackageManifestId ||
    !exportValidationProfileId ||
    !exportContractId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_ASSET_FACTORY_BUILD_RECIPE_RULE"),
      { reasonCode: "INCOMPLETE_ASSET_FACTORY_BUILD_RECIPE_RULE" }
    );
  }
  return deepFreeze({
    assetBuildRecipeId,
    generationQueueProfileId,
    assetPackageManifestId,
    exportValidationProfileId,
    exportContractId,
    buildStepCount,
    dependencyCount,
    factoryReadinessStatus: sanitizeString(rule.factoryReadinessStatus),
    factoryReadinessReason: sanitizeString(rule.factoryReadinessReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasAssetFactoryBuildRecipesVersion: version,
    registeredAssetFactoryBuildRecipeRuleCount: rules.length,
    assetBuildRecipeId: null,
    generationQueueProfileId: null,
    buildStepCount: 0,
    dependencyCount: 0,
    factoryReadinessStatus: null,
    factoryReadinessReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetFactoryBuildRecipes) {
    throw Object.assign(
      new Error("ATLAS_ASSET_FACTORY_BUILD_RECIPES_UNAVAILABLE"),
      { reasonCode: "ATLAS_ASSET_FACTORY_BUILD_RECIPES_UNAVAILABLE" }
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
    assetBuildRecipeId: null,
    generationQueueProfileId: null,
    buildStepCount: 0,
    dependencyCount: 0,
    factoryReadinessStatus: "blocked",
    factoryReadinessReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    assetBuildRecipeId: null,
    generationQueueProfileId: null,
    buildStepCount: 0,
    dependencyCount: 0,
    factoryReadinessStatus: "blocked",
    factoryReadinessReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasAssetFactoryBuildRecipes({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_BUILD_RECIPES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_ASSET_FACTORY_BUILD_RECIPE_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasAssetFactoryBuildRecipes: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasAssetFactoryBuildRecipesStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasAssetFactoryBuildRecipes) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasAssetFactoryBuildRecipe(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const assetPackageManifestId = sanitizeString(input.assetPackageManifestId);
  const exportValidationProfileId = sanitizeString(
    input.exportValidationProfileId
  );
  const exportContractId = sanitizeString(input.exportContractId);

  const manifestMatches = registry.__rules.filter(
    (candidate) => candidate.assetPackageManifestId === assetPackageManifestId
  );
  if (manifestMatches.length === 0) {
    return fail(registry, "ASSET_FACTORY_BUILD_RECIPE_MANIFEST_NOT_FOUND");
  }
  const exportValidationMatches = manifestMatches.filter(
    (candidate) =>
      candidate.exportValidationProfileId === exportValidationProfileId
  );
  if (exportValidationMatches.length === 0) {
    return fail(
      registry,
      "ASSET_FACTORY_BUILD_RECIPE_EXPORT_VALIDATION_INCOMPATIBLE"
    );
  }
  const rule = exportValidationMatches.find(
    (candidate) => candidate.exportContractId === exportContractId
  );
  if (!rule) {
    return fail(
      registry,
      "ASSET_FACTORY_BUILD_RECIPE_EXPORT_CONTRACT_INCOMPATIBLE"
    );
  }

  updateState(registry, {
    assetBuildRecipeId: rule.assetBuildRecipeId,
    generationQueueProfileId: rule.generationQueueProfileId,
    buildStepCount: rule.buildStepCount,
    dependencyCount: rule.dependencyCount,
    factoryReadinessStatus: rule.factoryReadinessStatus,
    factoryReadinessReason: rule.factoryReadinessReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    assetBuildRecipeId: rule.assetBuildRecipeId,
    generationQueueProfileId: rule.generationQueueProfileId,
    buildStepCount: rule.buildStepCount,
    dependencyCount: rule.dependencyCount,
    factoryReadinessStatus: rule.factoryReadinessStatus,
    factoryReadinessReason: rule.factoryReadinessReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
