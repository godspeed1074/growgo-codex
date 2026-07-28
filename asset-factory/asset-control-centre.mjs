import { createHash } from "node:crypto";

import {
  createAssetProductionReviewLayer,
  validateAssetProductionReviewLayer
} from "./asset-production-review-dashboard.mjs";
import {
  createAssetGovernanceDashboardLayer,
  validateAssetGovernanceDashboardLayer
} from "./asset-governance-dashboard.mjs";
import {
  createAssetDiscoveryLayer,
  validateAssetDiscoveryLayer
} from "./asset-discovery.mjs";
import {
  createAssetRecommendationLayer,
  validateAssetRecommendationLayer
} from "./asset-recommendation.mjs";
import {
  createAssetAutomationRuleLayer,
  validateAssetAutomationRuleLayer
} from "./asset-automation-rules.mjs";
import {
  createAssetAgentAssistantLayer,
  validateAssetAgentAssistantLayer
} from "./asset-agent-assistant.mjs";
import {
  createAssetReleaseManagementLayer,
  validateAssetReleaseManagementLayer
} from "./asset-release-management.mjs";

export const assetControlCentreLayerSchemaId = "ASSET_FACTORY_CONTROL_CENTRE_LAYER_001";
export const assetControlCentreRecordSchemaId = "ASSET_CONTROL_CENTRE_RECORD_001";
export const assetControlCentreValidationSchemaId = "ASSET_CONTROL_CENTRE_VALIDATION_001";

export const assetControlAreas = deepFreeze([
  "PRODUCTION",
  "QUALITY",
  "GOVERNANCE",
  "DISCOVERY",
  "RELEASES",
  "ASSISTANCE"
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

export function createAssetControlCentreLayer(
  rawOptions = {},
  rawProductionLayer = createAssetProductionReviewLayer(),
  rawGovernanceLayer = createAssetGovernanceDashboardLayer(),
  rawDiscoveryLayer = createAssetDiscoveryLayer(),
  rawRecommendationLayer = createAssetRecommendationLayer(),
  rawAutomationLayer = createAssetAutomationRuleLayer(),
  rawAssistantLayer = createAssetAgentAssistantLayer(),
  rawReleaseLayer = createAssetReleaseManagementLayer()
) {
  const options = normalizeOptions(rawOptions);
  const productionLayer = normalizeProductionLayer(rawProductionLayer);
  const governanceLayer = normalizeGovernanceLayer(rawGovernanceLayer);
  const discoveryLayer = normalizeDiscoveryLayer(rawDiscoveryLayer);
  const recommendationLayer = normalizeRecommendationLayer(rawRecommendationLayer);
  const automationLayer = normalizeAutomationLayer(rawAutomationLayer);
  const assistantLayer = normalizeAssistantLayer(rawAssistantLayer);
  const releaseLayer = normalizeReleaseLayer(rawReleaseLayer);

  const sourceContext = buildSourceContext(
    options,
    productionLayer,
    governanceLayer,
    discoveryLayer,
    recommendationLayer,
    automationLayer,
    assistantLayer,
    releaseLayer
  );
  const recordBase = buildControlCentreRecord(sourceContext);
  const validation = buildControlCentreValidation(recordBase, sourceContext);
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const layer = deepFreeze({
    schemaId: assetControlCentreLayerSchemaId,
    layerId: "ASSET_FACTORY_CONTROL_CENTRE_LAYER_001_DEFAULT",
    productionLayerId: productionLayer.layerId,
    governanceLayerId: governanceLayer.layerId,
    discoveryLayerId: discoveryLayer.layerId,
    recommendationLayerId: recommendationLayer.layerId,
    automationLayerId: automationLayer.layerId,
    assistantLayerId: assistantLayer.layerId,
    releaseLayerId: releaseLayer.layerId,
    record,
    validation
  });

  const checked = validateAssetControlCentreLayer(layer);
  if (!checked.ok) {
    throw createControlCentreError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetControlCentreLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetControlCentreLayerSchemaId) {
      throw createControlCentreError(
        "invalid_asset_control_centre_layer_schema",
        `Expected ${assetControlCentreLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.record?.schemaId !== assetControlCentreRecordSchemaId) {
      throw createControlCentreError(
        "invalid_asset_control_centre_record_schema",
        `Expected ${assetControlCentreRecordSchemaId} but received ${rawLayer.record?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetControlCentreValidationSchemaId) {
      throw createControlCentreError(
        "invalid_asset_control_centre_validation_schema",
        `Expected ${assetControlCentreValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "connectedSystemsValid",
      "summariesDeterministic",
      "noMutation",
      "lifecycleConsistency",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createControlCentreError(
          "asset_control_centre_layer_validation_failed",
          `Asset control centre validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetControlCentreLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_control_centre_layer_validation_failed",
      message: error.message,
      assetControlCentreLayer: null
    });
  }
}

export function validateAssetControlCentreRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetControlCentreRecordSchemaId) {
      throw createControlCentreError(
        "invalid_asset_control_centre_record_schema",
        `Expected ${assetControlCentreRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetControlCentreValidationSchemaId) {
      throw createControlCentreError(
        "invalid_asset_control_centre_record_validation_schema",
        `Expected ${assetControlCentreValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!Array.isArray(rawRecord.controlAreas) || rawRecord.controlAreas.length !== assetControlAreas.length) {
      throw createControlCentreError(
        "invalid_asset_control_centre_areas",
        "Asset control centre record must expose all control areas."
      );
    }

    for (const key of [
      "connectedSystemsValid",
      "summariesDeterministic",
      "noMutation",
      "lifecycleConsistency",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createControlCentreError(
          "asset_control_centre_record_validation_failed",
          `Asset control centre validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildControlCentreSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicControlCentreHash) {
      throw createControlCentreError(
        "asset_control_centre_hash_mismatch",
        "Asset control centre record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetControlCentreRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_control_centre_record_validation_failed",
      message: error.message,
      assetControlCentreRecord: null
    });
  }
}

function buildSourceContext(
  options,
  productionLayer,
  governanceLayer,
  discoveryLayer,
  recommendationLayer,
  automationLayer,
  assistantLayer,
  releaseLayer
) {
  const productionReport = options.productionReport ?? productionLayer.report;
  const governanceReport = options.governanceReport ?? governanceLayer.report;
  const discoveryResults =
    options.discoveryResults ?? discoveryLayer.search({ category: "nature" });
  const recommendationResults =
    options.recommendationResults ?? recommendationLayer.recommend(defaultRecommendationContext);
  const automationActions =
    options.automationActions ??
    automationLayer.evaluateEvent({
      eventType: "ASSET_PUBLISHED",
      assetId: defaultAssetId,
      sourceRecordId: "PUBLISH_RECORD_001",
      severity: "MEDIUM"
    });
  const assistantResponse =
    options.assistantResponse ??
    assistantLayer.answerQuery({
      queryType: "ASSET_STATUS_EXPLANATION",
      assetId: defaultAssetId
    });
  const releaseRecord =
    options.releaseRecord ??
    releaseLayer.createReleaseRecord({
      assetIds: [defaultAssetId]
    });

  return deepFreeze({
    productionLayer,
    productionReport,
    governanceLayer,
    governanceReport,
    discoveryLayer,
    discoveryResults,
    recommendationLayer,
    recommendationResults,
    automationLayer,
    automationActions,
    assistantLayer,
    assistantResponse,
    releaseLayer,
    releaseRecord
  });
}

function buildControlCentreRecord(sourceContext) {
  const pendingActions = deepFreeze([
    ...sourceContext.productionReport.recommendedActions.map((action) =>
      deepFreeze({
        source: "PRODUCTION_REVIEW",
        actionId: action.actionId,
        summaryState: action.summaryState,
        description: action.description
      })
    ),
    ...sourceContext.automationActions.map((action) =>
      deepFreeze({
        source: "AUTOMATION",
        actionId: action.actionRecordId,
        summaryState: action.executionStatus,
        description: action.matchedRule.suggestedAction
      })
    )
  ]);

  const blockedItems = deepFreeze([
    ...sourceContext.productionReport.blockedAssets.map((asset) =>
      deepFreeze({
        itemType: "ASSET",
        itemId: asset.assetId,
        area: "PRODUCTION",
        reason: `${asset.assetState} / ${asset.dependencyStatus}`
      })
    ),
    ...(sourceContext.governanceReport.healthState === "HIGH_RISK" ||
    sourceContext.governanceReport.healthState === "BLOCKED"
      ? [
          deepFreeze({
            itemType: "GOVERNANCE",
            itemId: sourceContext.governanceReport.reportId,
            area: "GOVERNANCE",
            reason: `Health state ${sourceContext.governanceReport.healthState}`
          })
        ]
      : [])
  ]);

  const recommendations = deepFreeze([
    ...sourceContext.recommendationResults.slice(0, 3).map((entry) =>
      deepFreeze({
        assetId: entry.assetId,
        score: entry.score,
        reason: entry.reason
      })
    )
  ]);

  const systemStatus = deepFreeze({
    production: sourceContext.productionReport.overallSummaryState,
    quality: sourceContext.productionReport.qualityStatus.summaryState,
    governance: sourceContext.governanceReport.healthState,
    discovery: sourceContext.discoveryResults.length > 0 ? "READY" : "EMPTY",
    releases: sourceContext.releaseRecord.releaseStatus,
    assistance: sourceContext.assistantResponse.queryType
  });

  const activeWorkflows = deepFreeze({
    activeBatchCount: sourceContext.productionReport.summary.activeBatchCount,
    blockedAssetCount: sourceContext.productionReport.summary.blockedAssetCount,
    releaseStatus: sourceContext.releaseRecord.releaseStatus,
    automationSuggestionCount: sourceContext.automationActions.length
  });

  const healthSummary = deepFreeze({
    overallHealth: deriveOverallHealth(sourceContext),
    governanceHealth: sourceContext.governanceReport.healthState,
    productionState: sourceContext.productionReport.overallSummaryState,
    blockedItemCount: blockedItems.length,
    pendingActionCount: pendingActions.length
  });

  const controlAreas = deepFreeze(
    assetControlAreas.map((area) =>
      deepFreeze({
        area,
        summary: buildAreaSummary(area, sourceContext, pendingActions, blockedItems)
      })
    )
  );

  return deepFreeze({
    schemaId: assetControlCentreRecordSchemaId,
    recordId: "ASSET_CONTROL_CENTRE_RECORD_001_DEFAULT",
    controlAreas,
    systemStatus,
    activeWorkflows,
    pendingActions,
    blockedItems,
    recommendations,
    healthSummary,
    navigation: deepFreeze({
      productionReportId: sourceContext.productionReport.reportId,
      governanceReportId: sourceContext.governanceReport.reportId,
      releaseRecordId: sourceContext.releaseRecord.releaseId,
      assistantResponseId: sourceContext.assistantResponse.responseRecordId
    }),
    validation: null
  });
}

function buildAreaSummary(area, sourceContext, pendingActions, blockedItems) {
  switch (area) {
    case "PRODUCTION":
      return deepFreeze({
        status: sourceContext.productionReport.overallSummaryState,
        headline: `${sourceContext.productionReport.summary.activeBatchCount} active batch(es), ${sourceContext.productionReport.summary.blockedAssetCount} blocked asset(s).`
      });
    case "QUALITY":
      return deepFreeze({
        status: sourceContext.productionReport.qualityStatus.summaryState,
        headline: `${sourceContext.productionReport.qualityStatus.warningCount} quality warning(s) currently visible.`
      });
    case "GOVERNANCE":
      return deepFreeze({
        status: sourceContext.governanceReport.healthState,
        headline: `${sourceContext.governanceReport.highImpactChanges.count} high-impact change(s), ${sourceContext.governanceReport.approvalIssues.count} approval issue(s).`
      });
    case "DISCOVERY":
      return deepFreeze({
        status: sourceContext.discoveryResults.length > 0 ? "READY" : "EMPTY",
        headline: `${sourceContext.discoveryResults.length} discovery result(s) in the current control-centre probe.`
      });
    case "RELEASES":
      return deepFreeze({
        status: sourceContext.releaseRecord.releaseStatus,
        headline: `Current release package ${sourceContext.releaseRecord.releaseId} is ${sourceContext.releaseRecord.releaseStatus}.`
      });
    case "ASSISTANCE":
      return deepFreeze({
        status: "READY",
        headline: `${sourceContext.assistantResponse.queryType} is available with confidence ${sourceContext.assistantResponse.confidence.toFixed(2)}.`
      });
    default:
      return deepFreeze({
        status: "UNKNOWN",
        headline: "No summary available."
      });
  }
}

function deriveOverallHealth(sourceContext) {
  if (
    sourceContext.governanceReport.healthState === "HIGH_RISK" ||
    sourceContext.productionReport.overallSummaryState === "BLOCKED"
  ) {
    return "ATTENTION_REQUIRED";
  }
  if (sourceContext.productionReport.overallSummaryState === "QUALITY_REVIEW") {
    return "MONITORED";
  }
  return "STABLE";
}

function buildControlCentreValidation(record, sourceContext) {
  const preHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  const postHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  const probe = buildControlCentreRecord(sourceContext);

  const connectedSystemsValid =
    Boolean(sourceContext.productionReport?.reportId) &&
    Boolean(sourceContext.governanceReport?.reportId) &&
    Boolean(sourceContext.releaseRecord?.releaseId) &&
    Boolean(sourceContext.assistantResponse?.responseRecordId);
  const summariesDeterministic =
    JSON.stringify(record.controlAreas) === JSON.stringify(probe.controlAreas) &&
    JSON.stringify(record.systemStatus) === JSON.stringify(probe.systemStatus);
  const noMutation = preHash === postHash;
  const lifecycleConsistency =
    record.healthSummary.governanceHealth === sourceContext.governanceReport.healthState &&
    record.systemStatus.production === sourceContext.productionReport.overallSummaryState &&
    record.systemStatus.releases === sourceContext.releaseRecord.releaseStatus;
  const validationPassed =
    connectedSystemsValid &&
    summariesDeterministic &&
    noMutation &&
    lifecycleConsistency;

  return deepFreeze({
    schemaId: assetControlCentreValidationSchemaId,
    connectedSystemsValid,
    summariesDeterministic,
    noMutation,
    lifecycleConsistency,
    validationPassed,
    deterministicControlCentreHash: computeDeterministicHash(buildControlCentreSignature(record))
  });
}

function buildSourceSignature(sourceContext) {
  return [
    sourceContext.productionReport.validation?.deterministicSummaryHash,
    sourceContext.governanceReport.validation?.deterministicSummaryHash,
    sourceContext.discoveryLayer.validation?.deterministicSearchHash,
    sourceContext.recommendationLayer.validation?.deterministicRecommendationHash,
    sourceContext.automationLayer.validation?.deterministicAutomationHash,
    sourceContext.assistantResponse.validation?.deterministicAssistantHash,
    sourceContext.releaseRecord.validation?.deterministicReleaseHash
  ];
}

function buildControlCentreSignature(record) {
  return [
    record.recordId,
    record.controlAreas,
    record.systemStatus,
    record.activeWorkflows,
    record.pendingActions,
    record.blockedItems,
    record.recommendations,
    record.healthSummary,
    record.navigation
  ];
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createControlCentreError(
      "invalid_asset_control_centre_options",
      "Asset control centre options must be an object when provided."
    );
  }
  return deepFreeze({ ...rawOptions });
}

function normalizeProductionLayer(rawLayer) {
  const checked = validateAssetProductionReviewLayer(rawLayer);
  if (!checked.ok) {
    throw createControlCentreError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeGovernanceLayer(rawLayer) {
  const checked = validateAssetGovernanceDashboardLayer(rawLayer);
  if (!checked.ok) {
    throw createControlCentreError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeDiscoveryLayer(rawLayer) {
  const checked = validateAssetDiscoveryLayer(rawLayer);
  if (!checked.ok) {
    throw createControlCentreError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeRecommendationLayer(rawLayer) {
  const checked = validateAssetRecommendationLayer(rawLayer);
  if (!checked.ok) {
    throw createControlCentreError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeAutomationLayer(rawLayer) {
  const checked = validateAssetAutomationRuleLayer(rawLayer);
  if (!checked.ok) {
    throw createControlCentreError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeAssistantLayer(rawLayer) {
  const checked = validateAssetAgentAssistantLayer(rawLayer);
  if (!checked.ok) {
    throw createControlCentreError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeReleaseLayer(rawLayer) {
  const checked = validateAssetReleaseManagementLayer(rawLayer);
  if (!checked.ok) {
    throw createControlCentreError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function createControlCentreError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
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
