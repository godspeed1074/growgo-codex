const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_PRODUCTION_BUNDLES_JOB_TICKETS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_PRODUCTION_BUNDLES_JOB_TICKETS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_PRODUCTION_BUNDLES_JOB_TICKETS_VERSION =
  "atlas_production_bundles_job_tickets_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_PRODUCTION_BUNDLE_JOB_TICKET_RULES =
  Object.freeze([
    Object.freeze({
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_COASTAL_TREE_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_COASTAL_TREE_001",
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_COASTAL_TREE_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_COASTAL_TREE_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_VEGETATION_001",
      factoryValidationStatus: "ready",
      factoryQueuePriority: 40,
      jobDependencyCount: 1,
      expectedOutput: "validated coastal tree vegetation bundle",
      bundleBatchGroup: "vegetation",
      traceabilitySource: "coastal_green_recipe_chain",
      validationHistoryTag: "factory_validation_ready",
      productionBundleReason:
        "coastal tree validation package becomes a vegetation production bundle with one dependency and medium priority",
      status: "approved"
    }),
    Object.freeze({
      productionBundleId:
        "ATLAS_PRODUCTION_BUNDLE_COASTAL_TREE_COMPACT_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_COASTAL_TREE_COMPACT_001",
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_COASTAL_TREE_COMPACT_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_COASTAL_TREE_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_VEGETATION_COMPACT_001",
      factoryValidationStatus: "ready",
      factoryQueuePriority: 38,
      jobDependencyCount: 1,
      expectedOutput: "validated compact coastal tree vegetation bundle",
      bundleBatchGroup: "vegetation_compact",
      traceabilitySource: "coastal_green_recipe_chain",
      validationHistoryTag: "factory_validation_ready",
      productionBundleReason:
        "compact coastal tree validation package becomes a compact vegetation production bundle with one dependency",
      status: "approved"
    }),
    Object.freeze({
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_HERITAGE_CIVIC_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_HERITAGE_CIVIC_001",
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_HERITAGE_CIVIC_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_HERITAGE_CIVIC_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      factoryValidationStatus: "ready",
      factoryQueuePriority: 85,
      jobDependencyCount: 3,
      expectedOutput: "validated heritage civic building bundle",
      bundleBatchGroup: "buildings",
      traceabilitySource: "civic_site_recipe_chain",
      validationHistoryTag: "factory_validation_ready",
      productionBundleReason:
        "heritage civic validation package becomes a high-priority building production bundle with preserved dependency ordering",
      status: "approved"
    }),
    Object.freeze({
      productionBundleId:
        "ATLAS_PRODUCTION_BUNDLE_HERITAGE_CIVIC_COMPACT_001",
      assetJobTicketId:
        "ATLAS_ASSET_JOB_TICKET_HERITAGE_CIVIC_COMPACT_001",
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_HERITAGE_CIVIC_COMPACT_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_HERITAGE_CIVIC_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_BUILDINGS_COMPACT_001",
      factoryValidationStatus: "ready",
      factoryQueuePriority: 82,
      jobDependencyCount: 3,
      expectedOutput: "validated compact heritage civic building bundle",
      bundleBatchGroup: "buildings_compact",
      traceabilitySource: "civic_site_recipe_chain",
      validationHistoryTag: "factory_validation_ready",
      productionBundleReason:
        "compact heritage civic validation package becomes a compact building production bundle with preserved dependency ordering",
      status: "approved"
    }),
    Object.freeze({
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_URBAN_COMMERCIAL_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_URBAN_COMMERCIAL_001",
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_URBAN_COMMERCIAL_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_URBAN_COMMERCIAL_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      factoryValidationStatus: "ready",
      factoryQueuePriority: 78,
      jobDependencyCount: 2,
      expectedOutput: "validated urban commercial package bundle",
      bundleBatchGroup: "buildings",
      traceabilitySource: "commercial_frontage_recipe_chain",
      validationHistoryTag: "factory_validation_ready",
      productionBundleReason:
        "urban commercial validation package becomes a building production bundle with frontage dependency traceability",
      status: "approved"
    }),
    Object.freeze({
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_RURAL_RESIDENTIAL_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_RURAL_RESIDENTIAL_001",
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_RURAL_RESIDENTIAL_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_RURAL_RESIDENTIAL_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_BUILDINGS_001",
      factoryValidationStatus: "ready",
      factoryQueuePriority: 74,
      jobDependencyCount: 2,
      expectedOutput: "validated rural residential package bundle",
      bundleBatchGroup: "buildings",
      traceabilitySource: "residential_layout_recipe_chain",
      validationHistoryTag: "factory_validation_ready",
      productionBundleReason:
        "rural residential validation package becomes a building production bundle with deterministic dependency preservation",
      status: "approved"
    }),
    Object.freeze({
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_INDUSTRIAL_EDGE_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_INDUSTRIAL_EDGE_001",
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_INDUSTRIAL_EDGE_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_001",
      generationQueueProfileId: "ATLAS_GENERATION_QUEUE_STREETSCAPE_001",
      factoryValidationStatus: "ready",
      factoryQueuePriority: 62,
      jobDependencyCount: 1,
      expectedOutput: "validated industrial edge streetscape bundle",
      bundleBatchGroup: "streetscape",
      traceabilitySource: "industrial_edge_recipe_chain",
      validationHistoryTag: "factory_validation_ready",
      productionBundleReason:
        "industrial edge validation package becomes a streetscape production bundle with one dependency and deterministic queue priority",
      status: "approved"
    }),
    Object.freeze({
      productionBundleId:
        "ATLAS_PRODUCTION_BUNDLE_INDUSTRIAL_EDGE_COMPACT_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_INDUSTRIAL_EDGE_COMPACT_001",
      productionReadinessProfileId:
        "ATLAS_PRODUCTION_READINESS_PROFILE_INDUSTRIAL_EDGE_COMPACT_001",
      assetBuildRecipeId: "ATLAS_BUILD_RECIPE_INDUSTRIAL_EDGE_COMPACT_001",
      generationQueueProfileId:
        "ATLAS_GENERATION_QUEUE_STREETSCAPE_COMPACT_001",
      factoryValidationStatus: "ready",
      factoryQueuePriority: 58,
      jobDependencyCount: 1,
      expectedOutput: "validated compact industrial edge streetscape bundle",
      bundleBatchGroup: "streetscape_compact",
      traceabilitySource: "industrial_edge_recipe_chain",
      validationHistoryTag: "factory_validation_ready",
      productionBundleReason:
        "compact industrial edge validation package becomes a compact streetscape production bundle with deterministic queue priority",
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

function sanitizeNumber(value, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    atlasProductionBundlesJobTicketsVersion:
      state.atlasProductionBundlesJobTicketsVersion,
    registeredProductionBundleRuleCount:
      state.registeredProductionBundleRuleCount,
    productionBundleId: state.productionBundleId,
    assetJobTicketId: state.assetJobTicketId,
    factoryQueuePriority: state.factoryQueuePriority,
    jobDependencyCount: state.jobDependencyCount,
    productionBundleReason: state.productionBundleReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const productionBundleId = sanitizeString(rule.productionBundleId);
  const assetJobTicketId = sanitizeString(rule.assetJobTicketId);
  const productionReadinessProfileId = sanitizeString(
    rule.productionReadinessProfileId
  );
  const assetBuildRecipeId = sanitizeString(rule.assetBuildRecipeId);
  const generationQueueProfileId = sanitizeString(
    rule.generationQueueProfileId
  );
  const factoryValidationStatus = sanitizeString(rule.factoryValidationStatus);
  if (
    !productionBundleId ||
    !assetJobTicketId ||
    !productionReadinessProfileId ||
    !assetBuildRecipeId ||
    !generationQueueProfileId ||
    !factoryValidationStatus
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_PRODUCTION_BUNDLE_JOB_TICKET_RULE"),
      { reasonCode: "INCOMPLETE_PRODUCTION_BUNDLE_JOB_TICKET_RULE" }
    );
  }
  return deepFreeze({
    productionBundleId,
    assetJobTicketId,
    productionReadinessProfileId,
    assetBuildRecipeId,
    generationQueueProfileId,
    factoryValidationStatus,
    factoryQueuePriority: sanitizeNumber(rule.factoryQueuePriority),
    jobDependencyCount: sanitizeNumber(rule.jobDependencyCount),
    expectedOutput: sanitizeString(rule.expectedOutput),
    bundleBatchGroup: sanitizeString(rule.bundleBatchGroup),
    traceabilitySource: sanitizeString(rule.traceabilitySource),
    validationHistoryTag: sanitizeString(rule.validationHistoryTag),
    productionBundleReason: sanitizeString(rule.productionBundleReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasProductionBundlesJobTicketsVersion: version,
    registeredProductionBundleRuleCount: rules.length,
    productionBundleId: null,
    assetJobTicketId: null,
    factoryQueuePriority: 0,
    jobDependencyCount: 0,
    productionBundleReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasProductionBundlesJobTickets) {
    throw Object.assign(
      new Error("ATLAS_PRODUCTION_BUNDLES_JOB_TICKETS_UNAVAILABLE"),
      { reasonCode: "ATLAS_PRODUCTION_BUNDLES_JOB_TICKETS_UNAVAILABLE" }
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
    productionBundleId: null,
    assetJobTicketId: null,
    factoryQueuePriority: 0,
    jobDependencyCount: 0,
    productionBundleReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    productionBundleId: null,
    assetJobTicketId: null,
    factoryQueuePriority: 0,
    jobDependencyCount: 0,
    productionBundleReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasProductionBundlesJobTickets({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_PRODUCTION_BUNDLES_JOB_TICKETS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_PRODUCTION_BUNDLE_JOB_TICKET_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasProductionBundlesJobTickets: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasProductionBundlesJobTicketsStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasProductionBundlesJobTickets) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasProductionBundleJobTicket(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const productionReadinessProfileId = sanitizeString(
    input.productionReadinessProfileId
  );
  const assetBuildRecipeId = sanitizeString(input.assetBuildRecipeId);
  const generationQueueProfileId = sanitizeString(
    input.generationQueueProfileId
  );
  const factoryValidationStatus = sanitizeString(
    input.factoryValidationStatus
  );

  if (factoryValidationStatus !== "ready") {
    return fail(registry, "PRODUCTION_BUNDLE_VALIDATION_NOT_READY");
  }

  const readinessMatches = registry.__rules.filter(
    (candidate) =>
      candidate.productionReadinessProfileId === productionReadinessProfileId
  );
  if (readinessMatches.length === 0) {
    return fail(registry, "PRODUCTION_BUNDLE_READINESS_PROFILE_NOT_FOUND");
  }
  const buildMatches = readinessMatches.filter(
    (candidate) => candidate.assetBuildRecipeId === assetBuildRecipeId
  );
  if (buildMatches.length === 0) {
    return fail(registry, "PRODUCTION_BUNDLE_BUILD_RECIPE_INCOMPATIBLE");
  }
  const rule = buildMatches.find(
    (candidate) =>
      candidate.generationQueueProfileId === generationQueueProfileId
  );
  if (!rule) {
    return fail(registry, "PRODUCTION_BUNDLE_QUEUE_PROFILE_INCOMPATIBLE");
  }

  updateState(registry, {
    productionBundleId: rule.productionBundleId,
    assetJobTicketId: rule.assetJobTicketId,
    factoryQueuePriority: rule.factoryQueuePriority,
    jobDependencyCount: rule.jobDependencyCount,
    productionBundleReason: rule.productionBundleReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    productionBundleId: rule.productionBundleId,
    assetJobTicketId: rule.assetJobTicketId,
    factoryQueuePriority: rule.factoryQueuePriority,
    jobDependencyCount: rule.jobDependencyCount,
    expectedOutput: rule.expectedOutput,
    bundleBatchGroup: rule.bundleBatchGroup,
    traceabilitySource: rule.traceabilitySource,
    validationHistoryTag: rule.validationHistoryTag,
    productionBundleReason: rule.productionBundleReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
