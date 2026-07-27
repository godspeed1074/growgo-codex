import { createHash } from "node:crypto";

import {
  createAssetProductionReviewLayer,
  validateAssetProductionReviewReport
} from "./asset-production-review-dashboard.mjs";
import {
  createAssetImpactAnalysisLayer,
  validateAssetImpactReport
} from "./asset-impact-analysis.mjs";
import {
  createAssetAuditTrailLayer,
  validateAssetAuditRecord
} from "./asset-audit-trail.mjs";
import {
  createAssetVersioningLayer,
  validateAssetVersionRecord
} from "./asset-versioning.mjs";
import {
  createAssetApprovalRegistrationLayer,
  validateAssetApprovalRecord
} from "./asset-approval-registration.mjs";
import {
  createAssetPublishingPipelineLayer,
  validateAssetPublishRecord
} from "./asset-publishing-pipeline.mjs";

export const assetGovernanceDashboardLayerSchemaId =
  "ASSET_GOVERNANCE_DASHBOARD_LAYER_001";
export const assetGovernanceReportSchemaId = "ASSET_GOVERNANCE_REPORT_001";
export const assetGovernanceValidationSchemaId =
  "ASSET_GOVERNANCE_VALIDATION_001";

export const assetGovernanceHealthStates = deepFreeze([
  "HEALTHY",
  "ATTENTION_REQUIRED",
  "BLOCKED",
  "HIGH_RISK"
]);

const defaultAssetId = "GROUND_BEACH_SAND_001";
const governanceDate = "2026-07-27";

export function createAssetGovernanceDashboardLayer(
  rawOptions = {},
  rawProductionReviewLayer = createAssetProductionReviewLayer(),
  rawImpactLayer = createAssetImpactAnalysisLayer(),
  rawAuditLayer = createAssetAuditTrailLayer(),
  rawVersioningLayer = createAssetVersioningLayer(),
  rawApprovalLayer = createAssetApprovalRegistrationLayer(),
  rawPublishingLayer = createAssetPublishingPipelineLayer()
) {
  const options = normalizeOptions(rawOptions);
  const productionReviewLayer = normalizeProductionReviewLayer(rawProductionReviewLayer);
  const impactLayer = normalizeImpactLayer(rawImpactLayer);
  const auditLayer = normalizeAuditLayer(rawAuditLayer);
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);
  const approvalLayer = normalizeApprovalLayer(rawApprovalLayer);
  const publishingLayer = normalizePublishingLayer(rawPublishingLayer);

  const sourceRecords = resolveSourceRecords(
    options,
    productionReviewLayer,
    impactLayer,
    auditLayer,
    versioningLayer,
    approvalLayer,
    publishingLayer
  );
  const preBuildHash = computeDeterministicHash(buildSourceSignature(sourceRecords));
  const reportBase = buildGovernanceReport(sourceRecords);
  const postBuildHash = computeDeterministicHash(buildSourceSignature(sourceRecords));
  const validation = buildGovernanceValidation(
    reportBase,
    sourceRecords,
    preBuildHash,
    postBuildHash
  );
  const report = deepFreeze({
    ...reportBase,
    validation
  });

  const layer = deepFreeze({
    schemaId: assetGovernanceDashboardLayerSchemaId,
    layerId: "ASSET_GOVERNANCE_DASHBOARD_LAYER_001_DEFAULT",
    productionReviewLayerId: productionReviewLayer.layerId,
    impactLayerId: impactLayer.layerId,
    auditLayerId: auditLayer.layerId,
    versioningLayerId: versioningLayer.layerId,
    approvalLayerId: approvalLayer.layerId,
    publishingLayerId: publishingLayer.layerId,
    report,
    validation
  });

  const checked = validateAssetGovernanceDashboardLayer(layer);
  if (!checked.ok) {
    throw createGovernanceError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetGovernanceDashboardLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetGovernanceDashboardLayerSchemaId) {
      throw createGovernanceError(
        "invalid_asset_governance_dashboard_layer_schema",
        `Expected ${assetGovernanceDashboardLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.report?.schemaId !== assetGovernanceReportSchemaId) {
      throw createGovernanceError(
        "invalid_asset_governance_report_schema",
        `Expected ${assetGovernanceReportSchemaId} but received ${rawLayer.report?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetGovernanceValidationSchemaId) {
      throw createGovernanceError(
        "invalid_asset_governance_validation_schema",
        `Expected ${assetGovernanceValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "sourceRecordsValid",
      "summariesDeterministic",
      "noMutation",
      "lifecycleConsistency",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createGovernanceError(
          "asset_governance_dashboard_layer_validation_failed",
          `Asset governance validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetGovernanceDashboardLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_governance_dashboard_layer_validation_failed",
      message: error.message,
      assetGovernanceDashboardLayer: null
    });
  }
}

export function validateAssetGovernanceReport(rawReport) {
  try {
    if (rawReport?.schemaId !== assetGovernanceReportSchemaId) {
      throw createGovernanceError(
        "invalid_asset_governance_report_schema",
        `Expected ${assetGovernanceReportSchemaId} but received ${rawReport?.schemaId}.`
      );
    }

    if (!assetGovernanceHealthStates.includes(rawReport.healthState)) {
      throw createGovernanceError(
        "invalid_asset_governance_health_state",
        `Unsupported governance health state ${rawReport.healthState}.`
      );
    }

    if (rawReport.validation?.schemaId !== assetGovernanceValidationSchemaId) {
      throw createGovernanceError(
        "invalid_asset_governance_validation_schema",
        `Expected ${assetGovernanceValidationSchemaId} but received ${rawReport.validation?.schemaId}.`
      );
    }

    for (const key of [
      "sourceRecordsValid",
      "summariesDeterministic",
      "noMutation",
      "lifecycleConsistency",
      "validationPassed"
    ]) {
      if (rawReport.validation[key] !== true) {
        throw createGovernanceError(
          "asset_governance_report_validation_failed",
          `Asset governance validation flag ${key} must be true.`
        );
      }
    }

    const expectedHealth = deriveHealthState({
      highImpactChangeCount: rawReport.highImpactChanges.count,
      approvalIssuesCount: rawReport.approvalIssues.count,
      publishingIssuesCount: rawReport.publishingIssues.count,
      blockedAssetCount: rawReport.lifecycleSummary.blockedAssets
    });
    if (expectedHealth !== rawReport.healthState) {
      throw createGovernanceError(
        "asset_governance_health_mismatch",
        "Asset governance health state does not match generated state."
      );
    }

    const expectedHash = computeDeterministicHash(buildGovernanceSignature(rawReport));
    if (expectedHash !== rawReport.validation.deterministicSummaryHash) {
      throw createGovernanceError(
        "asset_governance_hash_mismatch",
        "Asset governance report hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetGovernanceReport: rawReport
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_governance_report_validation_failed",
      message: error.message,
      assetGovernanceReport: null
    });
  }
}

function resolveSourceRecords(
  options,
  productionReviewLayer,
  impactLayer,
  auditLayer,
  versioningLayer,
  approvalLayer,
  publishingLayer
) {
  const productionReviewReport = options.productionReviewReport ?? productionReviewLayer.report;
  const impactReport =
    options.impactReport ??
    impactLayer.createImpactReport({
      assetId: defaultAssetId
    });
  const versionRecord =
    options.versionRecord ??
    versioningLayer.createVersionRecord({
      assetId: defaultAssetId
    });
  const approvalRecord =
    options.approvalRecord ??
    approvalLayer.createApprovalRecord({
      assetId: defaultAssetId
    });
  const publishRecord =
    options.publishRecord ??
    publishingLayer.createPublishRecord({
      assetId: defaultAssetId
    });
  const auditRecords =
    options.auditRecords ??
    buildDefaultAuditRecords(auditLayer, defaultAssetId);

  return deepFreeze({
    productionReviewReport,
    impactReport,
    auditRecords,
    versionRecord,
    approvalRecord,
    publishRecord
  });
}

function buildDefaultAuditRecords(auditLayer, assetId) {
  let records = [];
  for (const eventType of ["ASSET_CREATED", "ASSET_VERSIONED", "ASSET_PUBLISHED"]) {
    records = auditLayer.appendAuditRecord(records, { assetId, eventType });
  }
  return records;
}

function buildGovernanceReport(sourceRecords) {
  const lifecycleSummary = buildLifecycleSummary(sourceRecords);
  const recentChanges = buildRecentChanges(sourceRecords);
  const highImpactChanges = buildHighImpactChanges(sourceRecords);
  const approvalIssues = buildApprovalIssues(sourceRecords);
  const publishingIssues = buildPublishingIssues(sourceRecords);
  const versionHealth = buildVersionHealth(sourceRecords);
  const riskSummary = buildRiskSummary(
    lifecycleSummary,
    highImpactChanges,
    approvalIssues,
    publishingIssues,
    versionHealth
  );
  const healthState = deriveHealthState({
    highImpactChangeCount: highImpactChanges.count,
    approvalIssuesCount: approvalIssues.count,
    publishingIssuesCount: publishingIssues.count,
    blockedAssetCount: lifecycleSummary.blockedAssets
  });

  return deepFreeze({
    schemaId: assetGovernanceReportSchemaId,
    reportId: "ASSET_GOVERNANCE_REPORT_001_DEFAULT",
    healthState,
    totalAssets: lifecycleSummary.totalAssets,
    activeAssets: lifecycleSummary.activeAssets,
    pendingAssets: lifecycleSummary.pendingAssets,
    deprecatedAssets: lifecycleSummary.deprecatedAssets,
    recentChanges,
    highImpactChanges,
    approvalIssues,
    publishingIssues,
    versionHealth,
    lifecycleSummary,
    riskSummary,
    sourceRecordIds: deepFreeze({
      productionReviewReportId: sourceRecords.productionReviewReport.reportId,
      impactReportId: sourceRecords.impactReport.reportId,
      auditEventIds: deepFreeze(sourceRecords.auditRecords.map((record) => record.eventId)),
      versionRecordId: sourceRecords.versionRecord.versionRecordId,
      approvalRecordId: sourceRecords.approvalRecord.approvalRecordId,
      publishRecordId: sourceRecords.publishRecord.publishRecordId
    }),
    createdTimestamp: governanceDate,
    validation: null
  });
}

function buildLifecycleSummary(sourceRecords) {
  const trackedAssetIds = new Set([
    sourceRecords.versionRecord.assetId,
    sourceRecords.approvalRecord.assetId,
    sourceRecords.publishRecord.assetId,
    ...sourceRecords.impactReport.affectedAssets,
    ...extractTrackedAssetIdsFromProductionReview(sourceRecords.productionReviewReport),
    ...sourceRecords.auditRecords.map((record) => record.assetId)
  ]);

  const totalAssets = trackedAssetIds.size;
  const activeAssets = sourceRecords.versionRecord.activeStatus ? 1 : 0;
  const pendingAssets =
    sourceRecords.approvalRecord.approvalStatus === "PENDING_REVIEW" ? 1 : 0;
  const deprecatedAssets =
    sourceRecords.versionRecord.versionState === "DEPRECATED" ||
    sourceRecords.publishRecord.publishStatus === "RETIRED"
      ? 1
      : 0;
  const blockedAssets = sourceRecords.productionReviewReport.blockedAssets.length;

  return deepFreeze({
    totalAssets,
    activeAssets,
    pendingAssets,
    deprecatedAssets,
    blockedAssets
  });
}

function extractTrackedAssetIdsFromProductionReview(reviewReport) {
  const assetIds = new Set();
  for (const progressRecord of reviewReport.assetProgress) {
    assetIds.add(progressRecord.assetId);
  }
  return [...assetIds];
}

function buildRecentChanges(sourceRecords) {
  const auditTail = [...sourceRecords.auditRecords]
    .sort((left, right) => right.sequenceNumber - left.sequenceNumber)
    .slice(0, 5)
    .map((record) =>
      deepFreeze({
        eventId: record.eventId,
        assetId: record.assetId,
        eventType: record.eventType,
        timestamp: record.timestamp,
        summary: record.eventSummary
      })
    );

  return deepFreeze({
    count: auditTail.length,
    events: deepFreeze(auditTail)
  });
}

function buildHighImpactChanges(sourceRecords) {
  const entries = sourceRecords.impactReport.analysisEntries.filter((entry) =>
    ["HIGH", "CRITICAL"].includes(entry.impactLevel)
  );

  return deepFreeze({
    count: entries.length,
    severity: sourceRecords.impactReport.impactSeverity,
    impactedAtlasSystems: sourceRecords.impactReport.affectedAtlasSystems,
    impactedEnvironments: sourceRecords.impactReport.affectedEnvironments,
    changes: deepFreeze(
      entries.map((entry) =>
        deepFreeze({
          analysisType: entry.analysisType,
          sourceId: entry.sourceId,
          targetId: entry.targetId,
          impactLevel: entry.impactLevel
        })
      )
    )
  });
}

function buildApprovalIssues(sourceRecords) {
  const issues = [];
  if (sourceRecords.approvalRecord.approvalStatus !== "ACTIVE") {
    issues.push(
      deepFreeze({
        assetId: sourceRecords.approvalRecord.assetId,
        issueType: "APPROVAL_NOT_ACTIVE",
        approvalStatus: sourceRecords.approvalRecord.approvalStatus
      })
    );
  }
  if (sourceRecords.approvalRecord.registrationStatus !== "active_library_entry") {
    issues.push(
      deepFreeze({
        assetId: sourceRecords.approvalRecord.assetId,
        issueType: "REGISTRATION_NOT_ACTIVE",
        registrationStatus: sourceRecords.approvalRecord.registrationStatus
      })
    );
  }

  return deepFreeze({
    count: issues.length,
    issues: deepFreeze(issues)
  });
}

function buildPublishingIssues(sourceRecords) {
  const issues = [];
  if (sourceRecords.publishRecord.publishStatus !== "PUBLISHED") {
    issues.push(
      deepFreeze({
        assetId: sourceRecords.publishRecord.assetId,
        issueType: "PUBLISH_NOT_COMPLETE",
        publishStatus: sourceRecords.publishRecord.publishStatus
      })
    );
  }
  if (sourceRecords.publishRecord.validation.versionValid !== true) {
    issues.push(
      deepFreeze({
        assetId: sourceRecords.publishRecord.assetId,
        issueType: "VERSION_VALIDATION_FAILED",
        publishStatus: sourceRecords.publishRecord.publishStatus
      })
    );
  }

  return deepFreeze({
    count: issues.length,
    issues: deepFreeze(issues)
  });
}

function buildVersionHealth(sourceRecords) {
  const versionRecord = sourceRecords.versionRecord;
  const publishRecord = sourceRecords.publishRecord;
  const lifecycleAligned =
    (versionRecord.versionState === "PUBLISHED" && publishRecord.publishStatus === "READY_TO_PUBLISH") ||
    (versionRecord.versionState === "PUBLISHED" && publishRecord.publishStatus === "PUBLISHED") ||
    (versionRecord.versionState === "DEPRECATED" && publishRecord.publishStatus === "RETIRED");

  return deepFreeze({
    assetId: versionRecord.assetId,
    versionNumber: versionRecord.versionNumber,
    versionState: versionRecord.versionState,
    publishStatus: publishRecord.publishStatus,
    activeStatus: versionRecord.activeStatus,
    lifecycleAligned
  });
}

function buildRiskSummary(
  lifecycleSummary,
  highImpactChanges,
  approvalIssues,
  publishingIssues,
  versionHealth
) {
  const riskItems = [];

  if (highImpactChanges.count > 0) {
    riskItems.push("high impact dependency surface");
  }
  if (approvalIssues.count > 0) {
    riskItems.push("approval pipeline friction");
  }
  if (publishingIssues.count > 0) {
    riskItems.push("publishing pipeline friction");
  }
  if (lifecycleSummary.blockedAssets > 0) {
    riskItems.push("blocked production assets");
  }
  if (!versionHealth.lifecycleAligned) {
    riskItems.push("version and publish state mismatch");
  }

  return deepFreeze({
    count: riskItems.length,
    risks: deepFreeze(riskItems)
  });
}

function deriveHealthState({
  highImpactChangeCount,
  approvalIssuesCount,
  publishingIssuesCount,
  blockedAssetCount
}) {
  if (highImpactChangeCount > 2 || publishingIssuesCount > 0) {
    return "HIGH_RISK";
  }
  if (blockedAssetCount > 0) {
    return "BLOCKED";
  }
  if (approvalIssuesCount > 0 || highImpactChangeCount > 0) {
    return "ATTENTION_REQUIRED";
  }
  return "HEALTHY";
}

function buildGovernanceValidation(report, sourceRecords, preBuildHash, postBuildHash) {
  const sourceRecordsValid =
    validateAssetProductionReviewReport(sourceRecords.productionReviewReport).ok &&
    validateAssetImpactReport(sourceRecords.impactReport).ok &&
    sourceRecords.auditRecords.every((record, index) =>
      validateAssetAuditRecord(record, index > 0 ? sourceRecords.auditRecords[index - 1] : null).ok
    ) &&
    validateAssetVersionRecord(sourceRecords.versionRecord).ok &&
    validateAssetApprovalRecord(sourceRecords.approvalRecord).ok &&
    validateAssetPublishRecord(sourceRecords.publishRecord).ok;
  const summariesDeterministic = preBuildHash === postBuildHash;
  const noMutation = preBuildHash === postBuildHash;
  const lifecycleConsistency = report.versionHealth.lifecycleAligned;
  const validationPassed =
    sourceRecordsValid && summariesDeterministic && noMutation && lifecycleConsistency;

  return deepFreeze({
    schemaId: assetGovernanceValidationSchemaId,
    sourceRecordsValid,
    summariesDeterministic,
    noMutation,
    lifecycleConsistency,
    validationPassed,
    deterministicSummaryHash: computeDeterministicHash(buildGovernanceSignature(report))
  });
}

function buildSourceSignature(sourceRecords) {
  return [
    sourceRecords.productionReviewReport.reportId,
    sourceRecords.productionReviewReport.validation?.deterministicSummaryHash,
    sourceRecords.impactReport.reportId,
    sourceRecords.impactReport.validation?.deterministicImpactHash,
    sourceRecords.auditRecords.map((record) => record.validation?.deterministicAuditHash),
    sourceRecords.versionRecord.validation?.deterministicVersionHash,
    sourceRecords.approvalRecord.validation?.deterministicApprovalHash,
    sourceRecords.publishRecord.validation?.deterministicPublishHash
  ];
}

function buildGovernanceSignature(report) {
  return [
    report.reportId,
    report.healthState,
    report.totalAssets,
    report.activeAssets,
    report.pendingAssets,
    report.deprecatedAssets,
    report.recentChanges,
    report.highImpactChanges,
    report.approvalIssues,
    report.publishingIssues,
    report.versionHealth,
    report.lifecycleSummary,
    report.riskSummary,
    report.sourceRecordIds,
    report.createdTimestamp
  ];
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createGovernanceError(
      "invalid_asset_governance_dashboard_options",
      "Asset governance dashboard options must be an object when provided."
    );
  }
  return deepFreeze({ ...rawOptions });
}

function normalizeProductionReviewLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_FACTORY_PRODUCTION_REVIEW_LAYER_001" ||
    !rawLayer.report
  ) {
    throw createGovernanceError(
      "invalid_asset_governance_production_review_layer",
      "Asset governance dashboard requires a valid production review layer."
    );
  }
  return rawLayer;
}

function normalizeImpactLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_IMPACT_ANALYSIS_LAYER_001" ||
    typeof rawLayer.createImpactReport !== "function"
  ) {
    throw createGovernanceError(
      "invalid_asset_governance_impact_layer",
      "Asset governance dashboard requires a valid impact analysis layer."
    );
  }
  return rawLayer;
}

function normalizeAuditLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_AUDIT_TRAIL_LAYER_001" ||
    typeof rawLayer.appendAuditRecord !== "function"
  ) {
    throw createGovernanceError(
      "invalid_asset_governance_audit_layer",
      "Asset governance dashboard requires a valid audit trail layer."
    );
  }
  return rawLayer;
}

function normalizeVersioningLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_VERSIONING_LAYER_001" ||
    typeof rawLayer.createVersionRecord !== "function"
  ) {
    throw createGovernanceError(
      "invalid_asset_governance_versioning_layer",
      "Asset governance dashboard requires a valid versioning layer."
    );
  }
  return rawLayer;
}

function normalizeApprovalLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_APPROVAL_REGISTRATION_LAYER_001" ||
    typeof rawLayer.createApprovalRecord !== "function"
  ) {
    throw createGovernanceError(
      "invalid_asset_governance_approval_layer",
      "Asset governance dashboard requires a valid approval layer."
    );
  }
  return rawLayer;
}

function normalizePublishingLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_PUBLISHING_PIPELINE_LAYER_001" ||
    typeof rawLayer.createPublishRecord !== "function"
  ) {
    throw createGovernanceError(
      "invalid_asset_governance_publishing_layer",
      "Asset governance dashboard requires a valid publishing layer."
    );
  }
  return rawLayer;
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createGovernanceError(code, message) {
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
