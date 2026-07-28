import { createHash } from "node:crypto";

import {
  createAssetGovernanceDashboardLayer,
  validateAssetGovernanceDashboardLayer
} from "./asset-governance-dashboard.mjs";
import {
  createAssetAuditTrailLayer,
  validateAssetAuditTrailLayer
} from "./asset-audit-trail.mjs";
import {
  createAssetDependencyManagementLayer,
  validateAssetDependencyManagementLayer
} from "./asset-dependency-management.mjs";
import {
  createAssetImpactAnalysisLayer,
  validateAssetImpactAnalysisLayer
} from "./asset-impact-analysis.mjs";
import {
  createAssetDiscoveryLayer,
  validateAssetDiscoveryLayer
} from "./asset-discovery.mjs";
import {
  createAssetRecommendationLayer,
  validateAssetRecommendationLayer
} from "./asset-recommendation.mjs";
import {
  createAssetFactoryRegistryLayer,
  validateAssetFactoryRegistryLayer
} from "./asset-registry.mjs";

export const assetAgentAssistantLayerSchemaId = "ASSET_FACTORY_AGENT_ASSISTANT_LAYER_001";
export const assetAgentResponseRecordSchemaId = "ASSET_AGENT_RESPONSE_RECORD_001";
export const assetAgentValidationSchemaId = "ASSET_AGENT_VALIDATION_001";

export const assetAgentQueryTypes = deepFreeze([
  "ASSET_STATUS_EXPLANATION",
  "DEPENDENCY_EXPLANATION",
  "IMPACT_EXPLANATION",
  "RECOMMENDATION_EXPLANATION",
  "RELEASE_EXPLANATION"
]);

const defaultAssetId = "GROUND_BEACH_SAND_001";
const defaultRecommendationContext = deepFreeze({
  environmentType: "COASTAL_PARK",
  biome: "COASTAL",
  objectClassification: "NATURAL_FEATURE",
  atlasUsage: "PARK",
  existingAssetRelationships: ["GROUND_COASTAL_GRASS_001"],
  variantCompatibility: deepFreeze({
    baseReferenceType: "asset",
    baseReferenceId: "TREE_EUCALYPTUS_001"
  })
});

export function createAssetAgentAssistantLayer(
  rawOptions = {},
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawGovernanceLayer = createAssetGovernanceDashboardLayer(),
  rawAuditLayer = createAssetAuditTrailLayer(rawRegistry),
  rawDependencyLayer = createAssetDependencyManagementLayer(),
  rawImpactLayer = createAssetImpactAnalysisLayer(),
  rawDiscoveryLayer = createAssetDiscoveryLayer(),
  rawRecommendationLayer = createAssetRecommendationLayer()
) {
  const options = normalizeOptions(rawOptions);
  const registry = normalizeRegistry(rawRegistry);
  const governanceLayer = normalizeGovernanceLayer(rawGovernanceLayer);
  const auditLayer = normalizeAuditLayer(rawAuditLayer);
  const dependencyLayer = normalizeDependencyLayer(rawDependencyLayer);
  const impactLayer = normalizeImpactLayer(rawImpactLayer);
  const discoveryLayer = normalizeDiscoveryLayer(rawDiscoveryLayer);
  const recommendationLayer = normalizeRecommendationLayer(rawRecommendationLayer);

  const sourceContext = buildSourceContext(
    registry,
    governanceLayer,
    auditLayer,
    dependencyLayer,
    impactLayer,
    discoveryLayer,
    recommendationLayer,
    options
  );
  const validation = buildAssistantValidation(sourceContext);

  const layer = deepFreeze({
    schemaId: assetAgentAssistantLayerSchemaId,
    layerId: "ASSET_FACTORY_AGENT_ASSISTANT_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    governanceLayerId: governanceLayer.layerId,
    auditLayerId: auditLayer.layerId,
    dependencyLayerId: dependencyLayer.layerId,
    impactLayerId: impactLayer.layerId,
    discoveryLayerId: discoveryLayer.layerId,
    recommendationLayerId: recommendationLayer.layerId,
    validation,
    answerQuery(rawQuery = {}) {
      return answerAssistantQuery(rawQuery, sourceContext);
    }
  });

  const checked = validateAssetAgentAssistantLayer(layer);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetAgentAssistantLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetAgentAssistantLayerSchemaId) {
      throw createAssistantError(
        "invalid_asset_agent_assistant_layer_schema",
        `Expected ${assetAgentAssistantLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (typeof rawLayer.answerQuery !== "function") {
      throw createAssistantError(
        "invalid_asset_agent_assistant_api",
        "Asset agent assistant layer must expose answerQuery."
      );
    }

    if (rawLayer.validation?.schemaId !== assetAgentValidationSchemaId) {
      throw createAssistantError(
        "invalid_asset_agent_validation_schema",
        `Expected ${assetAgentValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "sourceReferencesValid",
      "explanationsTraceable",
      "noUnsupportedClaims",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createAssistantError(
          "asset_agent_assistant_layer_validation_failed",
          `Asset agent validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAgentAssistantLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_agent_assistant_layer_validation_failed",
      message: error.message,
      assetAgentAssistantLayer: null
    });
  }
}

export function validateAssetAgentResponseRecord(rawRecord, rawRegistry = createAssetFactoryRegistryLayer()) {
  try {
    const registry = normalizeRegistry(rawRegistry);

    if (rawRecord?.schemaId !== assetAgentResponseRecordSchemaId) {
      throw createAssistantError(
        "invalid_asset_agent_response_record_schema",
        `Expected ${assetAgentResponseRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (!assetAgentQueryTypes.includes(rawRecord.queryType)) {
      throw createAssistantError(
        "invalid_asset_agent_query_type",
        `Unsupported assistant query type ${rawRecord.queryType}.`
      );
    }

    if (
      typeof rawRecord.answerSummary !== "string" ||
      rawRecord.answerSummary.trim().length === 0
    ) {
      throw createAssistantError(
        "invalid_asset_agent_answer_summary",
        "Assistant response must include an answerSummary."
      );
    }

    if (!Number.isFinite(rawRecord.confidence) || rawRecord.confidence < 0 || rawRecord.confidence > 1) {
      throw createAssistantError(
        "invalid_asset_agent_confidence",
        "Assistant confidence must be a number between 0 and 1."
      );
    }

    if (rawRecord.validation?.schemaId !== assetAgentValidationSchemaId) {
      throw createAssistantError(
        "invalid_asset_agent_response_validation_schema",
        `Expected ${assetAgentValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!registry.getAssetById(rawRecord.assetId)) {
      throw createAssistantError(
        "invalid_asset_agent_asset_reference",
        `Assistant response asset ${rawRecord.assetId} is not registered.`
      );
    }

    for (const key of [
      "sourceReferencesValid",
      "explanationsTraceable",
      "noUnsupportedClaims",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createAssistantError(
          "asset_agent_response_validation_failed",
          `Asset agent validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildResponseSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicAssistantHash) {
      throw createAssistantError(
        "asset_agent_response_hash_mismatch",
        "Asset agent response hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAgentResponseRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_agent_response_validation_failed",
      message: error.message,
      assetAgentResponseRecord: null
    });
  }
}

function buildSourceContext(
  registry,
  governanceLayer,
  auditLayer,
  dependencyLayer,
  impactLayer,
  discoveryLayer,
  recommendationLayer,
  options
) {
  const governanceReport = options.governanceReport ?? governanceLayer.report;
  const auditRecords = options.auditRecords ?? createDefaultAuditRecords(auditLayer);
  const impactReport =
    options.impactReport ??
    impactLayer.createImpactReport({
      assetId: defaultAssetId
    });
  const recommendationContext = options.recommendationContext ?? defaultRecommendationContext;
  const recommendationResults =
    options.recommendationResults ??
    recommendationLayer.recommend(recommendationContext);

  return deepFreeze({
    registry,
    governanceLayer,
    governanceReport,
    auditLayer,
    auditRecords,
    dependencyLayer,
    impactLayer,
    impactReport,
    discoveryLayer,
    recommendationLayer,
    recommendationContext,
    recommendationResults
  });
}

function createDefaultAuditRecords(auditLayer) {
  const created = auditLayer.createAuditRecord({
    assetId: defaultAssetId,
    eventType: "ASSET_CREATED"
  });
  const published = auditLayer.createAuditRecord(
    {
      assetId: defaultAssetId,
      eventType: "ASSET_PUBLISHED"
    },
    [created]
  );
  return deepFreeze([created, published]);
}

function answerAssistantQuery(rawQuery, sourceContext) {
  const query = normalizeAssistantQuery(rawQuery);
  const beforeHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  const response = buildAssistantResponse(query, sourceContext);
  const afterHash = computeDeterministicHash(buildSourceSignature(sourceContext));

  if (beforeHash !== afterHash) {
    throw createAssistantError(
      "asset_agent_source_mutation_detected",
      "Asset agent assistant mutated source state."
    );
  }

  return response;
}

function buildAssistantResponse(query, sourceContext) {
  switch (query.queryType) {
    case "ASSET_STATUS_EXPLANATION":
      return buildStatusExplanation(query, sourceContext);
    case "DEPENDENCY_EXPLANATION":
      return buildDependencyExplanation(query, sourceContext);
    case "IMPACT_EXPLANATION":
      return buildImpactExplanation(query, sourceContext);
    case "RECOMMENDATION_EXPLANATION":
      return buildRecommendationExplanation(query, sourceContext);
    case "RELEASE_EXPLANATION":
      return buildReleaseExplanation(query, sourceContext);
    default:
      throw createAssistantError(
        "unsupported_asset_agent_query_type",
        `Unsupported assistant query type ${query.queryType}.`
      );
  }
}

function buildStatusExplanation(query, sourceContext) {
  const asset = getAssetRecord(query.assetId, sourceContext.registry);
  const relatedAudit = sourceContext.auditRecords.filter((record) => record.assetId === query.assetId);
  const summary = `${query.assetId} is currently tracked with governance health ${sourceContext.governanceReport.healthState}, registry status ${asset.status}, and ${relatedAudit.length} audit event${relatedAudit.length === 1 ? "" : "s"}.`;
  const supportingRecords = deepFreeze([
    supportingRecord("GOVERNANCE_REPORT", sourceContext.governanceReport.schemaId, "governance-health"),
    ...relatedAudit.map((record) =>
      supportingRecord("AUDIT_RECORD", record.eventId, `${record.eventType.toLowerCase()}: ${record.eventSummary}`)
    )
  ]);
  const nextActions = deepFreeze(buildStatusNextActions(sourceContext.governanceReport.healthState, asset.status));

  return finalizeAssistantResponse(
    query,
    query.assetId,
    summary,
    supportingRecords,
    nextActions,
    0.96,
    sourceContext.registry
  );
}

function buildDependencyExplanation(query, sourceContext) {
  const directDependencies = sourceContext.dependencyLayer.listDependenciesFor(query.assetId);
  const chain = sourceContext.dependencyLayer.resolveDependencyChain(query.assetId, 6);
  const summary = `${query.assetId} has ${directDependencies.length} direct dependency record${directDependencies.length === 1 ? "" : "s"} and a reachable dependency chain of ${chain.length} node${chain.length === 1 ? "" : "s"}.`;
  const supportingRecords = deepFreeze([
    ...directDependencies.slice(0, 5).map((record) =>
      supportingRecord(
        "DEPENDENCY_RECORD",
        `${record.sourceId}->${record.targetId}`,
        `${record.dependencyType}: ${record.dependencyReason}`
      )
    )
  ]);
  const nextActions = deepFreeze(
    directDependencies.some((record) => record.impactLevel === "HIGH")
      ? ["Review high-impact dependency links before approving related changes."]
      : ["No blocking dependency risk is visible from the direct graph."]
  );

  return finalizeAssistantResponse(
    query,
    query.assetId,
    summary,
    supportingRecords,
    nextActions,
    0.94,
    sourceContext.registry
  );
}

function buildImpactExplanation(query, sourceContext) {
  const report =
    query.assetId === sourceContext.impactReport.changedAsset.assetId
      ? sourceContext.impactReport
      : sourceContext.impactLayer.createImpactReport({
          assetId: query.assetId
        });
  const summary = `${query.assetId} currently carries ${report.impactSeverity} impact with ${report.analysisEntries.length} traced analysis entr${report.analysisEntries.length === 1 ? "y" : "ies"}.`;
  const supportingRecords = deepFreeze([
    supportingRecord("IMPACT_REPORT", report.reportId, `impact severity ${report.impactSeverity}`),
    ...report.analysisEntries.slice(0, 4).map((entry) =>
      supportingRecord(
        "IMPACT_ENTRY",
        `${entry.sourceId}->${entry.targetId}`,
        `${entry.analysisType}: ${entry.reason}`
      )
    )
  ]);
  const nextActions = deepFreeze(buildImpactNextActions(report.impactSeverity));

  return finalizeAssistantResponse(
    query,
    query.assetId,
    summary,
    supportingRecords,
    nextActions,
    0.95,
    sourceContext.registry
  );
}

function buildRecommendationExplanation(query, sourceContext) {
  const recommendationResults =
    query.assetId === defaultAssetId && query.recommendationContext === null
      ? sourceContext.recommendationResults
      : sourceContext.recommendationLayer.recommend(
          query.recommendationContext ?? sourceContext.recommendationContext
        );
  const top = recommendationResults[0];
  if (!top) {
    throw createAssistantError(
      "missing_asset_agent_recommendation_result",
      "Recommendation explanation requires at least one recommendation result."
    );
  }
  const summary = `${top.assetId} is the strongest recommendation with score ${top.score} because ${top.reason}`;
  const supportingRecords = deepFreeze([
    supportingRecord("RECOMMENDATION_RESULT", top.assetId, top.reason),
    ...top.relatedAssets.slice(0, 4).map((assetId) =>
      supportingRecord("RELATED_ASSET", assetId, "related through recommendation context")
    )
  ]);
  const nextActions = deepFreeze([
    `Use ${top.assetId} when the current context prioritizes ${top.compatibilitySummary.atlasUsageMatched ? "Atlas usage alignment" : "context fit"}.`
  ]);

  return finalizeAssistantResponse(
    query,
    top.assetId,
    summary,
    supportingRecords,
    nextActions,
    0.93,
    sourceContext.registry
  );
}

function buildReleaseExplanation(query, sourceContext) {
  const relatedAudit = sourceContext.auditRecords.filter(
    (record) => record.assetId === query.assetId && ["ASSET_PUBLISHED", "ASSET_RETIRED"].includes(record.eventType)
  );
  const latestEvent = relatedAudit.at(-1) ?? null;
  const summary = latestEvent
    ? `${query.assetId} most recently reached release event ${latestEvent.eventType} with governance health ${sourceContext.governanceReport.healthState}.`
    : `${query.assetId} has no recorded release audit event in the current assistant source set.`;
  const supportingRecords = deepFreeze(
    latestEvent
      ? [supportingRecord("AUDIT_RECORD", latestEvent.eventId, latestEvent.eventSummary)]
      : [supportingRecord("GOVERNANCE_REPORT", sourceContext.governanceReport.schemaId, "No release audit event found.")]
  );
  const nextActions = deepFreeze(
    latestEvent
      ? ["Cross-check release documentation before announcing the asset externally."]
      : ["Record a publish audit event before treating the asset as released."]
  );

  return finalizeAssistantResponse(
    query,
    query.assetId,
    summary,
    supportingRecords,
    nextActions,
    latestEvent ? 0.9 : 0.72,
    sourceContext.registry
  );
}

function finalizeAssistantResponse(
  query,
  assetId,
  answerSummary,
  supportingRecords,
  recommendedNextActions,
  confidence,
  registry
) {
  const responseBase = deepFreeze({
    schemaId: assetAgentResponseRecordSchemaId,
    responseRecordId: [
      "ASSET_AGENT_RESPONSE",
      normalizeSlug(query.queryType),
      normalizeSlug(assetId)
    ].join("_"),
    assetId,
    queryType: query.queryType,
    answerSummary,
    supportingRecords,
    recommendedNextActions,
    confidence,
    validation: null
  });

  const validation = buildResponseValidation(responseBase, registry);
  const response = deepFreeze({
    ...responseBase,
    validation
  });

  const checked = validateAssetAgentResponseRecord(response, registry);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }

  return response;
}

function buildStatusNextActions(healthState, assetStatus) {
  if (healthState === "HIGH_RISK" || healthState === "BLOCKED") {
    return ["Review governance blockers before progressing this asset."];
  }
  if (assetStatus === "draft" || assetStatus === "blocked") {
    return ["Complete validation and authoring checks before further promotion."];
  }
  return ["Current lifecycle state does not show an immediate blocker."];
}

function buildImpactNextActions(impactSeverity) {
  switch (impactSeverity) {
    case "CRITICAL":
      return ["Pause related approvals until the full dependency impact is reviewed."];
    case "HIGH":
      return ["Run a focused dependency and environment review before progressing the change."];
    case "MEDIUM":
      return ["Confirm dependent recipes and variants before promotion."];
    default:
      return ["Impact appears contained; continue with standard review discipline."];
  }
}

function buildAssistantValidation(sourceContext) {
  const probeQuery = deepFreeze({
    queryType: "RECOMMENDATION_EXPLANATION",
    assetId: defaultAssetId,
    recommendationContext: defaultRecommendationContext
  });
  const first = buildRecommendationExplanation(probeQuery, sourceContext);
  const second = buildRecommendationExplanation(probeQuery, sourceContext);

  const sourceReferencesValid =
    sourceContext.governanceReport?.schemaId === "ASSET_GOVERNANCE_REPORT_001" &&
    Array.isArray(sourceContext.auditRecords) &&
    Array.isArray(sourceContext.recommendationResults);
  const explanationsTraceable = first.supportingRecords.length > 0;
  const noUnsupportedClaims =
    first.answerSummary.includes(first.assetId) &&
    first.supportingRecords.every((record) => typeof record.recordId === "string");
  const deterministicOutput = JSON.stringify(first) === JSON.stringify(second);
  const validationPassed =
    sourceReferencesValid &&
    explanationsTraceable &&
    noUnsupportedClaims &&
    deterministicOutput;

  return deepFreeze({
    schemaId: assetAgentValidationSchemaId,
    sourceReferencesValid,
    explanationsTraceable,
    noUnsupportedClaims,
    deterministicOutput,
    validationPassed,
    deterministicAssistantHash: computeDeterministicHash(buildResponseSignature(first))
  });
}

function buildResponseValidation(response, registry) {
  const sourceReferencesValid =
    registry.getAssetById(response.assetId) !== null &&
    response.supportingRecords.every((record) => typeof record.recordType === "string");
  const explanationsTraceable = response.supportingRecords.length > 0;
  const noUnsupportedClaims =
    response.answerSummary.includes(response.assetId) ||
    response.supportingRecords.some((record) => record.recordId.includes(response.assetId));
  const deterministicOutput = true;
  const validationPassed =
    sourceReferencesValid &&
    explanationsTraceable &&
    noUnsupportedClaims &&
    deterministicOutput;

  return deepFreeze({
    schemaId: assetAgentValidationSchemaId,
    sourceReferencesValid,
    explanationsTraceable,
    noUnsupportedClaims,
    deterministicOutput,
    validationPassed,
    deterministicAssistantHash: computeDeterministicHash(buildResponseSignature(response))
  });
}

function buildResponseSignature(response) {
  return [
    response.responseRecordId,
    response.assetId,
    response.queryType,
    response.answerSummary,
    response.supportingRecords,
    response.recommendedNextActions,
    response.confidence
  ];
}

function buildSourceSignature(sourceContext) {
  return [
    sourceContext.governanceReport.validation?.deterministicSummaryHash,
    sourceContext.auditRecords.map((record) => record.validation?.deterministicAuditHash),
    sourceContext.impactReport.validation?.deterministicImpactHash,
    sourceContext.discoveryLayer.validation?.deterministicSearchHash,
    sourceContext.recommendationLayer.validation?.deterministicRecommendationHash
  ];
}

function supportingRecord(recordType, recordId, note) {
  return deepFreeze({
    recordType,
    recordId,
    note
  });
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createAssistantError(
      "invalid_asset_agent_options",
      "Asset agent assistant options must be an object when provided."
    );
  }
  return deepFreeze({ ...rawOptions });
}

function normalizeRegistry(rawRegistry) {
  const checked = validateAssetFactoryRegistryLayer(rawRegistry);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }
  return rawRegistry;
}

function normalizeGovernanceLayer(rawLayer) {
  const checked = validateAssetGovernanceDashboardLayer(rawLayer);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeAuditLayer(rawLayer) {
  const checked = validateAssetAuditTrailLayer(rawLayer);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeDependencyLayer(rawLayer) {
  const checked = validateAssetDependencyManagementLayer(rawLayer);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeImpactLayer(rawLayer) {
  const checked = validateAssetImpactAnalysisLayer(rawLayer);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeDiscoveryLayer(rawLayer) {
  const checked = validateAssetDiscoveryLayer(rawLayer);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeRecommendationLayer(rawLayer) {
  const checked = validateAssetRecommendationLayer(rawLayer);
  if (!checked.ok) {
    throw createAssistantError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeAssistantQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== "object" || Array.isArray(rawQuery)) {
    throw createAssistantError(
      "invalid_asset_agent_query",
      "Asset agent assistant query must be an object."
    );
  }

  const queryType = normalizeEnum(rawQuery.queryType, assetAgentQueryTypes, "queryType");
  const assetId =
    typeof rawQuery.assetId === "string" && rawQuery.assetId.trim().length > 0
      ? normalizeString(rawQuery.assetId, "assetId")
      : defaultAssetId;

  return deepFreeze({
    queryType,
    assetId,
    recommendationContext: rawQuery.recommendationContext ?? null
  });
}

function getAssetRecord(assetId, registry) {
  const asset = registry.getAssetById(assetId);
  if (!asset) {
    throw createAssistantError(
      "missing_asset_agent_registry_record",
      `Asset ${assetId} is not registered in the Asset Factory registry.`
    );
  }
  return asset;
}

function normalizeEnum(value, allowedValues, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createAssistantError(`invalid_${label}`, `${label} must be a non-empty string.`);
  }
  const normalized = value.trim().toUpperCase();
  if (!allowedValues.includes(normalized)) {
    throw createAssistantError(
      `invalid_${label}`,
      `${label} must be one of ${allowedValues.join(", ")}.`
    );
  }
  return normalized;
}

function normalizeString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createAssistantError(`invalid_${label}`, `${label} must be a non-empty string.`);
  }
  return value.trim().toUpperCase();
}

function normalizeSlug(value) {
  return String(value).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createAssistantError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return value;
}
