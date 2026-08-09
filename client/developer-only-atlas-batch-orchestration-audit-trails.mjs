const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_BATCH_ORCHESTRATION_AUDIT_TRAILS_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_BATCH_ORCHESTRATION_AUDIT_TRAILS_RESULT_001";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_BATCH_ORCHESTRATION_AUDIT_TRAILS_VERSION =
  "atlas_batch_orchestration_audit_trails_v1";

export const DEFAULT_DEVELOPER_ONLY_ATLAS_BATCH_ORCHESTRATION_RULES =
  Object.freeze([
    Object.freeze({
      productionBatchId: "ATLAS_PRODUCTION_BATCH_BELLARINE_COASTAL_001",
      auditTrailId: "ATLAS_AUDIT_TRAIL_BELLARINE_COASTAL_001",
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_COASTAL_TREE_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_COASTAL_TREE_001",
      batchAssetCount: 3,
      batchDependencyCount: 1,
      batchProfile: "biome:coastal",
      settlementProfile: "settlement:coastal_village",
      themeProfile: "theme:australian_coastal",
      auditVersionTag: "audit_v1",
      orchestrationReason:
        "coastal vegetation job joins a Bellarine coastal production batch with preserved dependency ordering and audit lineage",
      status: "approved"
    }),
    Object.freeze({
      productionBatchId:
        "ATLAS_PRODUCTION_BATCH_BELLARINE_COASTAL_COMPACT_001",
      auditTrailId: "ATLAS_AUDIT_TRAIL_BELLARINE_COASTAL_COMPACT_001",
      productionBundleId:
        "ATLAS_PRODUCTION_BUNDLE_COASTAL_TREE_COMPACT_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_COASTAL_TREE_COMPACT_001",
      batchAssetCount: 2,
      batchDependencyCount: 1,
      batchProfile: "biome:coastal_compact",
      settlementProfile: "settlement:coastal_village",
      themeProfile: "theme:australian_coastal",
      auditVersionTag: "audit_v1",
      orchestrationReason:
        "compact coastal vegetation job joins a compact coastal batch with deterministic audit tracking",
      status: "approved"
    }),
    Object.freeze({
      productionBatchId: "ATLAS_PRODUCTION_BATCH_BELLARINE_CIVIC_001",
      auditTrailId: "ATLAS_AUDIT_TRAIL_BELLARINE_CIVIC_001",
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_HERITAGE_CIVIC_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_HERITAGE_CIVIC_001",
      batchAssetCount: 5,
      batchDependencyCount: 3,
      batchProfile: "settlement:civic",
      settlementProfile: "settlement:heritage_town",
      themeProfile: "theme:victorian_heritage",
      auditVersionTag: "audit_v1",
      orchestrationReason:
        "heritage civic job joins a civic settlement batch with preserved validation approval lineage and revision history",
      status: "approved"
    }),
    Object.freeze({
      productionBatchId:
        "ATLAS_PRODUCTION_BATCH_BELLARINE_CIVIC_COMPACT_001",
      auditTrailId: "ATLAS_AUDIT_TRAIL_BELLARINE_CIVIC_COMPACT_001",
      productionBundleId:
        "ATLAS_PRODUCTION_BUNDLE_HERITAGE_CIVIC_COMPACT_001",
      assetJobTicketId:
        "ATLAS_ASSET_JOB_TICKET_HERITAGE_CIVIC_COMPACT_001",
      batchAssetCount: 4,
      batchDependencyCount: 3,
      batchProfile: "settlement:civic_compact",
      settlementProfile: "settlement:heritage_town",
      themeProfile: "theme:victorian_heritage",
      auditVersionTag: "audit_v1",
      orchestrationReason:
        "compact heritage civic job joins a compact civic batch with deterministic revision traceability",
      status: "approved"
    }),
    Object.freeze({
      productionBatchId: "ATLAS_PRODUCTION_BATCH_BELLARINE_COMMERCIAL_001",
      auditTrailId: "ATLAS_AUDIT_TRAIL_BELLARINE_COMMERCIAL_001",
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_URBAN_COMMERCIAL_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_URBAN_COMMERCIAL_001",
      batchAssetCount: 4,
      batchDependencyCount: 2,
      batchProfile: "settlement:commercial",
      settlementProfile: "settlement:urban_district",
      themeProfile: "theme:modern_urban",
      auditVersionTag: "audit_v1",
      orchestrationReason:
        "urban commercial job joins a commercial settlement batch with stable approvals and dependency grouping",
      status: "approved"
    }),
    Object.freeze({
      productionBatchId: "ATLAS_PRODUCTION_BATCH_BELLARINE_RESIDENTIAL_001",
      auditTrailId: "ATLAS_AUDIT_TRAIL_BELLARINE_RESIDENTIAL_001",
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_RURAL_RESIDENTIAL_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_RURAL_RESIDENTIAL_001",
      batchAssetCount: 4,
      batchDependencyCount: 2,
      batchProfile: "settlement:residential",
      settlementProfile: "settlement:rural_town",
      themeProfile: "theme:rural_farming",
      auditVersionTag: "audit_v1",
      orchestrationReason:
        "rural residential job joins a residential settlement batch with preserved dependency traceability",
      status: "approved"
    }),
    Object.freeze({
      productionBatchId: "ATLAS_PRODUCTION_BATCH_BELLARINE_INDUSTRIAL_001",
      auditTrailId: "ATLAS_AUDIT_TRAIL_BELLARINE_INDUSTRIAL_001",
      productionBundleId: "ATLAS_PRODUCTION_BUNDLE_INDUSTRIAL_EDGE_001",
      assetJobTicketId: "ATLAS_ASSET_JOB_TICKET_INDUSTRIAL_EDGE_001",
      batchAssetCount: 3,
      batchDependencyCount: 1,
      batchProfile: "theme:industrial",
      settlementProfile: "settlement:industrial_area",
      themeProfile: "theme:industrial",
      auditVersionTag: "audit_v1",
      orchestrationReason:
        "industrial edge job joins an industrial production batch with stable audit history and one dependency",
      status: "approved"
    }),
    Object.freeze({
      productionBatchId:
        "ATLAS_PRODUCTION_BATCH_BELLARINE_INDUSTRIAL_COMPACT_001",
      auditTrailId: "ATLAS_AUDIT_TRAIL_BELLARINE_INDUSTRIAL_COMPACT_001",
      productionBundleId:
        "ATLAS_PRODUCTION_BUNDLE_INDUSTRIAL_EDGE_COMPACT_001",
      assetJobTicketId:
        "ATLAS_ASSET_JOB_TICKET_INDUSTRIAL_EDGE_COMPACT_001",
      batchAssetCount: 2,
      batchDependencyCount: 1,
      batchProfile: "theme:industrial_compact",
      settlementProfile: "settlement:industrial_area",
      themeProfile: "theme:industrial",
      auditVersionTag: "audit_v1",
      orchestrationReason:
        "compact industrial edge job joins a compact industrial batch with deterministic audit lineage",
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
    atlasBatchOrchestrationAuditTrailsVersion:
      state.atlasBatchOrchestrationAuditTrailsVersion,
    registeredBatchOrchestrationRuleCount:
      state.registeredBatchOrchestrationRuleCount,
    productionBatchId: state.productionBatchId,
    auditTrailId: state.auditTrailId,
    batchAssetCount: state.batchAssetCount,
    batchDependencyCount: state.batchDependencyCount,
    orchestrationReason: state.orchestrationReason,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateRule(rule = {}) {
  const productionBatchId = sanitizeString(rule.productionBatchId);
  const auditTrailId = sanitizeString(rule.auditTrailId);
  const productionBundleId = sanitizeString(rule.productionBundleId);
  const assetJobTicketId = sanitizeString(rule.assetJobTicketId);
  if (
    !productionBatchId ||
    !auditTrailId ||
    !productionBundleId ||
    !assetJobTicketId
  ) {
    throw Object.assign(
      new Error("INCOMPLETE_BATCH_ORCHESTRATION_RULE"),
      { reasonCode: "INCOMPLETE_BATCH_ORCHESTRATION_RULE" }
    );
  }
  return deepFreeze({
    productionBatchId,
    auditTrailId,
    productionBundleId,
    assetJobTicketId,
    batchAssetCount: sanitizeNumber(rule.batchAssetCount),
    batchDependencyCount: sanitizeNumber(rule.batchDependencyCount),
    batchProfile: sanitizeString(rule.batchProfile),
    settlementProfile: sanitizeString(rule.settlementProfile),
    themeProfile: sanitizeString(rule.themeProfile),
    auditVersionTag: sanitizeString(rule.auditVersionTag),
    orchestrationReason: sanitizeString(rule.orchestrationReason),
    status: sanitizeString(rule.status)
  });
}

function createState(version, rules) {
  return {
    atlasBatchOrchestrationAuditTrailsVersion: version,
    registeredBatchOrchestrationRuleCount: rules.length,
    productionBatchId: null,
    auditTrailId: null,
    batchAssetCount: 0,
    batchDependencyCount: 0,
    orchestrationReason: null,
    lastFailureReason: null
  };
}

function requireRegistry(registry) {
  if (!registry?.__growgoDeveloperOnlyAtlasBatchOrchestrationAuditTrails) {
    throw Object.assign(
      new Error("ATLAS_BATCH_ORCHESTRATION_AUDIT_TRAILS_UNAVAILABLE"),
      { reasonCode: "ATLAS_BATCH_ORCHESTRATION_AUDIT_TRAILS_UNAVAILABLE" }
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
    productionBatchId: null,
    auditTrailId: null,
    batchAssetCount: 0,
    batchDependencyCount: 0,
    orchestrationReason: reasonCode,
    lastFailureReason: reasonCode
  });
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: false,
    reasonCode,
    productionBatchId: null,
    auditTrailId: null,
    batchAssetCount: 0,
    batchDependencyCount: 0,
    orchestrationReason: reasonCode,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createDeveloperOnlyAtlasBatchOrchestrationAuditTrails({
  version = DEFAULT_DEVELOPER_ONLY_ATLAS_BATCH_ORCHESTRATION_AUDIT_TRAILS_VERSION,
  rules = DEFAULT_DEVELOPER_ONLY_ATLAS_BATCH_ORCHESTRATION_RULES
} = {}) {
  const normalizedRules = deepFreeze(rules.map((rule) => validateRule(rule)));
  return {
    __growgoDeveloperOnlyAtlasBatchOrchestrationAuditTrails: true,
    __rules: normalizedRules,
    __state: createState(version, normalizedRules)
  };
}

export function getDeveloperOnlyAtlasBatchOrchestrationAuditTrailsStatus(
  registry
) {
  if (!registry?.__growgoDeveloperOnlyAtlasBatchOrchestrationAuditTrails) {
    return freezeStatus(createState(null, []));
  }
  return freezeStatus(registry.__state);
}

export function resolveDeveloperOnlyAtlasBatchOrchestrationAuditTrail(
  registry,
  input = {}
) {
  requireRegistry(registry);

  const productionBundleId = sanitizeString(input.productionBundleId);
  const assetJobTicketId = sanitizeString(input.assetJobTicketId);

  const bundleMatches = registry.__rules.filter(
    (candidate) => candidate.productionBundleId === productionBundleId
  );
  if (bundleMatches.length === 0) {
    return fail(registry, "BATCH_ORCHESTRATION_PRODUCTION_BUNDLE_NOT_FOUND");
  }
  const rule = bundleMatches.find(
    (candidate) => candidate.assetJobTicketId === assetJobTicketId
  );
  if (!rule) {
    return fail(registry, "BATCH_ORCHESTRATION_JOB_TICKET_INCOMPATIBLE");
  }

  updateState(registry, {
    productionBatchId: rule.productionBatchId,
    auditTrailId: rule.auditTrailId,
    batchAssetCount: rule.batchAssetCount,
    batchDependencyCount: rule.batchDependencyCount,
    orchestrationReason: rule.orchestrationReason,
    lastFailureReason: null
  });

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    matched: true,
    reasonCode: "RESOLVED",
    productionBatchId: rule.productionBatchId,
    auditTrailId: rule.auditTrailId,
    batchAssetCount: rule.batchAssetCount,
    batchDependencyCount: rule.batchDependencyCount,
    batchProfile: rule.batchProfile,
    settlementProfile: rule.settlementProfile,
    themeProfile: rule.themeProfile,
    auditVersionTag: rule.auditVersionTag,
    orchestrationReason: rule.orchestrationReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}
