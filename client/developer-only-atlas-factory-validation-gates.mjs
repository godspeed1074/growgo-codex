const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_FACTORY_VALIDATION_GATES_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_FACTORY_VALIDATION_GATES_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_FACTORY_VALIDATION_GATES_VERSION =
  "atlas_factory_validation_gates_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_FACTORY_VALIDATION_GATE_RULES =
  Object.freeze([
    Object.freeze({
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_COASTAL_TREE_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_COASTAL_TREE_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_VEGETATION_001",
      assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_COASTAL_TREE_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_VEGETATION_001",
      validationGateCount: 6,
      passedGateCount: 6,
      factoryValidationStatus: "ready",
      productionReadinessReason:
        "coastal tree package passes manifest dependency export naming version and compatibility gates",
      status: "approved"
    }),
    Object.freeze({
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_COASTAL_TREE_COMPACT_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_COASTAL_TREE_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_VEGETATION_COMPACT_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_COASTAL_TREE_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_VEGETATION_COMPACT_001",
      validationGateCount: 6,
      passedGateCount: 6,
      factoryValidationStatus: "ready",
      productionReadinessReason:
        "compact coastal tree package passes manifest dependency export naming version and compatibility gates",
      status: "approved"
    }),
    Object.freeze({
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_HERITAGE_CIVIC_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_HERITAGE_CIVIC_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      assetPackageManifestId: "ATLAS_ASSET_PACKAGE_MANIFEST_HERITAGE_CIVIC_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      validationGateCount: 6,
      passedGateCount: 6,
      factoryValidationStatus: "ready",
      productionReadinessReason:
        "heritage civic package passes manifest dependency export naming version and compatibility gates",
      status: "approved"
    }),
    Object.freeze({
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_HERITAGE_CIVIC_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_BUILDINGS_COMPACT_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_HERITAGE_CIVIC_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_COMPACT_001",
      validationGateCount: 6,
      passedGateCount: 6,
      factoryValidationStatus: "ready",
      productionReadinessReason:
        "compact heritage civic package passes manifest dependency export naming version and compatibility gates",
      status: "approved"
    }),
    Object.freeze({
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_URBAN_COMMERCIAL_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_URBAN_COMMERCIAL_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_URBAN_COMMERCIAL_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      validationGateCount: 6,
      passedGateCount: 6,
      factoryValidationStatus: "ready",
      productionReadinessReason:
        "urban commercial package passes manifest dependency export naming version and compatibility gates",
      status: "approved"
    }),
    Object.freeze({
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_RURAL_RESIDENTIAL_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_RURAL_RESIDENTIAL_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_RURAL_RESIDENTIAL_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_BUILDINGS_001",
      validationGateCount: 6,
      passedGateCount: 6,
      factoryValidationStatus: "ready",
      productionReadinessReason:
        "rural residential package passes manifest dependency export naming version and compatibility gates",
      status: "approved"
    }),
    Object.freeze({
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_INDUSTRIAL_EDGE_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_STREETSCAPE_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_001",
      validationGateCount: 6,
      passedGateCount: 6,
      factoryValidationStatus: "ready",
      productionReadinessReason:
        "industrial edge package passes manifest dependency export naming version and compatibility gates",
      status: "approved"
    }),
    Object.freeze({
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_STREETSCAPE_COMPACT_001",
      assetPackageManifestId:
        "ATLAS_ASSET_PACKAGE_MANIFEST_INDUSTRIAL_EDGE_COMPACT_001",
      exportValidationProfileId:
        "ATLAS_EXPORT_VALIDATION_PROFILE_STREETSCAPE_COMPACT_001",
      validationGateCount: 6,
      passedGateCount: 6,
      factoryValidationStatus: "ready",
      productionReadinessReason:
        "compact industrial edge package passes manifest dependency export naming version and compatibility gates",
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
    atlasFactoryValidationGatesVersion:
      state.atlasFactoryValidationGatesVersion,
    registeredFactoryValidationGateRuleCount:
      state.registeredFactoryValidationGateRuleCount,
    productionReadinessProfileId: state.productionReadinessProfileId,
    factoryValidationStatus: state.factoryValidationStatus,
    validationGateCount: state.validationGateCount,
    passedGateCount: state.passedGateCount,
    productionReadinessReason: state.productionReadinessReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const productionReadinessProfileId = sanitizeString(
    rule.productionReadinessProfileId
  );
  const assetBuildRecipeId = sanitizeString(rule.assetBuildRecipeId);
  const generationQueueProfileId = sanitizeString(
    rule.generationQueueProfileId
  );
  const assetPackageManifestId = sanitizeString(rule.assetPackageManifestId);
  const exportValidationProfileId = sanitizeString(
    rule.exportValidationProfileId
  );
  const validationGateCount = Number(rule.validationGateCount ?? 0);
  const passedGateCount = Number(rule.passedGateCount ?? 0);
  if (
    !productionReadinessProfileId ||
    !assetBuildRecipeId ||
    !generationQueueProfileId ||
    !assetPackageManifestId ||
    !exportValidationProfileId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_FACTORY_VALIDATION_GATE_RULE"),
      { reasonCode: "INCOMPLETE_FACTORY_VALIDATION_GATE_RULE" }
    );
  }
  return deepFreeze({
    productionReadinessProfileId,
    assetBuildRecipeId,
    generationQueueProfileId,
    assetPackageManifestId,
    exportValidationProfileId,
    validationGateCount,
    passedGateCount,
    factoryValidationStatus: sanitizeString(rule.factoryValidationStatus),
    productionReadinessReason: sanitizeString(rule.productionReadinessReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasFactoryValidationGatesVersion: version,
    registeredFactoryValidationGateRuleCount: rules.length,
    productionReadinessProfileId: null,
    factoryValidationStatus: null,
    validationGateCount: 0,
    passedGateCount: 0,
    productionReadinessReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasFactoryValidationGates) {
    throw Object.assign(
      new Error("ATLAS_FACTORY_VALIDATION_GATES_UNAVAILABLE"),
      { reasonCode: "ATLAS_FACTORY_VALIDATION_GATES_UNAVAILABLE" }
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
    productionReadinessProfileId: null,
    factoryValidationStatus: "blocked",
    validationGateCount: 0,
    passedGateCount: 0,
    productionReadinessReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    productionReadinessProfileId: null,
    factoryValidationStatus: "blocked",
    validationGateCount: 0,
    passedGateCount: 0,
    productionReadinessReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasFactoryValidationGates({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_FACTORY_VALIDATION_GATES_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_FACTORY_VALIDATION_GATE_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasFactoryValidationGates: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasFactoryValidationGatesStatus(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasFactoryValidationGates) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasFactoryValidationGate(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const assetBuildRecipeId = sanitizeString(input.assetBuildRecipeId);
  const generationQueueProfileId = sanitizeString(
    input.generationQueueProfileId
  );
  const assetPackageManifestId = sanitizeString(input.assetPackageManifestId);
  const exportValidationProfileId = sanitizeString(
    input.exportValidationProfileId
  );

  const buildMatches = registry.__rules.filter(
    (candidate) => candidate.assetBuildRecipeId === assetBuildRecipeId
  );
  if (buildMatches.length === 0) {
    return fail(registry, "FACTORY_VALIDATION_BUILD_RECIPE_NOT_FOUND");
  }
  const queueMatches = buildMatches.filter(
    (candidate) =>
      candidate.generationQueueProfileId === generationQueueProfileId
  );
  if (queueMatches.length === 0) {
    return fail(registry, "FACTORY_VALIDATION_QUEUE_PROFILE_INCOMPATIBLE");
  }
  const manifestMatches = queueMatches.filter(
    (candidate) => candidate.assetPackageManifestId === assetPackageManifestId
  );
  if (manifestMatches.length === 0) {
    return fail(registry, "FACTORY_VALIDATION_MANIFEST_INCOMPATIBLE");
  }
  const rule = manifestMatches.find(
    (candidate) =>
      candidate.exportValidationProfileId === exportValidationProfileId
  );
  if (!rule) {
    return fail(
      registry,
      "FACTORY_VALIDATION_EXPORT_VALIDATION_INCOMPATIBLE"
    );
  }

  updateState(registry, {
    productionReadinessProfileId: rule.productionReadinessProfileId,
    factoryValidationStatus: rule.factoryValidationStatus,
    validationGateCount: rule.validationGateCount,
    passedGateCount: rule.passedGateCount,
    productionReadinessReason: rule.productionReadinessReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    productionReadinessProfileId: rule.productionReadinessProfileId,
    factoryValidationStatus: rule.factoryValidationStatus,
    validationGateCount: rule.validationGateCount,
    passedGateCount: rule.passedGateCount,
    productionReadinessReason: rule.productionReadinessReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
