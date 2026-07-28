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
  createAssetAuditTrailLayer,
  validateAssetAuditTrail,
  validateAssetAuditTrailLayer
} from "./asset-audit-trail.mjs";
import {
  createAssetReleaseManagementLayer,
  validateAssetReleaseManagementLayer,
  validateAssetReleaseRecord
} from "./asset-release-management.mjs";

export const assetFactoryAnalyticsLayerSchemaId = "ASSET_FACTORY_ANALYTICS_LAYER_001";
export const assetFactoryAnalyticsReportSchemaId = "ASSET_FACTORY_ANALYTICS_REPORT_001";
export const assetFactoryAnalyticsValidationSchemaId = "ASSET_FACTORY_ANALYTICS_VALIDATION_001";

const defaultAssetId = "GROUND_BEACH_SAND_001";

export function createAssetAnalyticsLayer(
  rawOptions = {},
  rawProductionLayer = createAssetProductionReviewLayer(),
  rawGovernanceLayer = createAssetGovernanceDashboardLayer(),
  rawAuditLayer = createAssetAuditTrailLayer(),
  rawReleaseLayer = createAssetReleaseManagementLayer()
) {
  const options = normalizeOptions(rawOptions);
  const productionLayer = normalizeProductionLayer(rawProductionLayer);
  const governanceLayer = normalizeGovernanceLayer(rawGovernanceLayer);
  const auditLayer = normalizeAuditLayer(rawAuditLayer);
  const releaseLayer = normalizeReleaseLayer(rawReleaseLayer);

  const sourceContext = buildSourceContext(
    options,
    productionLayer,
    governanceLayer,
    auditLayer,
    releaseLayer
  );
  const reportBase = buildAnalyticsReport(sourceContext);
  const validation = buildAnalyticsValidation(reportBase, sourceContext);
  const report = deepFreeze({
    ...reportBase,
    validation
  });

  const layer = deepFreeze({
    schemaId: assetFactoryAnalyticsLayerSchemaId,
    layerId: "ASSET_FACTORY_ANALYTICS_LAYER_001_DEFAULT",
    productionLayerId: productionLayer.layerId,
    governanceLayerId: governanceLayer.layerId,
    auditLayerId: auditLayer.layerId,
    releaseLayerId: releaseLayer.layerId,
    report,
    validation
  });

  const checked = validateAssetAnalyticsLayer(layer);
  if (!checked.ok) {
    throw createAnalyticsError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetAnalyticsLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetFactoryAnalyticsLayerSchemaId) {
      throw createAnalyticsError(
        "invalid_asset_factory_analytics_layer_schema",
        `Expected ${assetFactoryAnalyticsLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.report?.schemaId !== assetFactoryAnalyticsReportSchemaId) {
      throw createAnalyticsError(
        "invalid_asset_factory_analytics_report_schema",
        `Expected ${assetFactoryAnalyticsReportSchemaId} but received ${rawLayer.report?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetFactoryAnalyticsValidationSchemaId) {
      throw createAnalyticsError(
        "invalid_asset_factory_analytics_validation_schema",
        `Expected ${assetFactoryAnalyticsValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "sourceRecordsValid",
      "calculationsDeterministic",
      "noMutation",
      "metricConsistency",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createAnalyticsError(
          "asset_factory_analytics_layer_validation_failed",
          `Asset Factory analytics validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryAnalyticsLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_factory_analytics_layer_validation_failed",
      message: error.message,
      assetFactoryAnalyticsLayer: null
    });
  }
}

export function validateAssetAnalyticsReport(rawReport) {
  try {
    if (rawReport?.schemaId !== assetFactoryAnalyticsReportSchemaId) {
      throw createAnalyticsError(
        "invalid_asset_factory_analytics_report_schema",
        `Expected ${assetFactoryAnalyticsReportSchemaId} but received ${rawReport?.schemaId}.`
      );
    }

    if (rawReport.validation?.schemaId !== assetFactoryAnalyticsValidationSchemaId) {
      throw createAnalyticsError(
        "invalid_asset_factory_analytics_report_validation_schema",
        `Expected ${assetFactoryAnalyticsValidationSchemaId} but received ${rawReport.validation?.schemaId}.`
      );
    }

    for (const key of [
      "sourceRecordsValid",
      "calculationsDeterministic",
      "noMutation",
      "metricConsistency",
      "validationPassed"
    ]) {
      if (rawReport.validation[key] !== true) {
        throw createAnalyticsError(
          "asset_factory_analytics_report_validation_failed",
          `Asset Factory analytics validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildAnalyticsSignature(rawReport));
    if (expectedHash !== rawReport.validation.deterministicAnalyticsHash) {
      throw createAnalyticsError(
        "asset_factory_analytics_hash_mismatch",
        "Asset Factory analytics report hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryAnalyticsReport: rawReport
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_factory_analytics_report_validation_failed",
      message: error.message,
      assetFactoryAnalyticsReport: null
    });
  }
}

function buildSourceContext(options, productionLayer, governanceLayer, auditLayer, releaseLayer) {
  const productionReport = options.productionReport ?? productionLayer.report;
  const governanceReport = options.governanceReport ?? governanceLayer.report;
  const auditRecords = options.auditRecords ?? createDefaultAuditRecords(auditLayer);
  const releaseRecords = options.releaseRecords ?? createDefaultReleaseRecords(releaseLayer);

  return deepFreeze({
    productionLayer,
    productionReport,
    governanceLayer,
    governanceReport,
    auditLayer,
    auditRecords,
    releaseLayer,
    releaseRecords
  });
}

function createDefaultAuditRecords(auditLayer) {
  const created = auditLayer.createAuditRecord({
    assetId: defaultAssetId,
    eventType: "ASSET_CREATED"
  });
  const specified = auditLayer.createAuditRecord(
    {
      assetId: defaultAssetId,
      eventType: "ASSET_SPECIFIED"
    },
    [created]
  );
  const authored = auditLayer.createAuditRecord(
    {
      assetId: defaultAssetId,
      eventType: "ASSET_AUTHORED"
    },
    [created, specified]
  );
  const validated = auditLayer.createAuditRecord(
    {
      assetId: defaultAssetId,
      eventType: "ASSET_VALIDATED"
    },
    [created, specified, authored]
  );
  const approved = auditLayer.createAuditRecord(
    {
      assetId: defaultAssetId,
      eventType: "ASSET_APPROVED"
    },
    [created, specified, authored, validated]
  );
  const published = auditLayer.createAuditRecord(
    {
      assetId: defaultAssetId,
      eventType: "ASSET_PUBLISHED"
    },
    [created, specified, authored, validated, approved]
  );

  return deepFreeze([created, specified, authored, validated, approved, published]);
}

function createDefaultReleaseRecords(releaseLayer) {
  const release = releaseLayer.createReleaseRecord({
    assetIds: [defaultAssetId]
  });
  const validationPending = releaseLayer.advanceReleaseRecord(release, "VALIDATION_PENDING");
  const ready = releaseLayer.advanceReleaseRecord(validationPending, "READY");
  const released = releaseLayer.advanceReleaseRecord(ready, "RELEASED");

  return deepFreeze([release, validationPending, ready, released]);
}

function buildAnalyticsReport(sourceContext) {
  const productionMetrics = buildProductionMetrics(sourceContext.productionReport);
  const qualityMetrics = buildQualityMetrics(sourceContext.productionReport);
  const lifecycleMetrics = buildLifecycleMetrics(sourceContext.auditRecords, sourceContext.releaseRecords);
  const governanceMetrics = buildGovernanceMetrics(
    sourceContext.governanceReport,
    sourceContext.auditRecords
  );
  const bottlenecks = buildBottlenecks(
    sourceContext.productionReport,
    sourceContext.governanceReport,
    qualityMetrics,
    lifecycleMetrics
  );
  const trends = buildTrends(
    productionMetrics,
    qualityMetrics,
    lifecycleMetrics,
    governanceMetrics
  );
  const healthIndicators = buildHealthIndicators(
    sourceContext.productionReport,
    sourceContext.governanceReport,
    bottlenecks
  );

  return deepFreeze({
    schemaId: assetFactoryAnalyticsReportSchemaId,
    reportId: "ASSET_FACTORY_ANALYTICS_REPORT_001_DEFAULT",
    metricsSummary: deepFreeze({
      production: productionMetrics,
      quality: qualityMetrics,
      lifecycle: lifecycleMetrics,
      governance: governanceMetrics
    }),
    trends,
    bottlenecks,
    healthIndicators,
    sourceRecords: deepFreeze({
      productionReportId: sourceContext.productionReport.reportId,
      governanceReportId: sourceContext.governanceReport.reportId,
      auditRecordCount: sourceContext.auditRecords.length,
      releaseRecordCount: sourceContext.releaseRecords.length
    }),
    validation: null
  });
}

function buildProductionMetrics(productionReport) {
  const completedAssets = productionReport.assetProgress.filter((entry) => entry.summaryState === "COMPLETE");
  const blockedAssets = productionReport.blockedAssets;
  const activeAssets = productionReport.assetProgress.filter((entry) =>
    ["ON_TRACK", "WAITING", "QUALITY_REVIEW", "APPROVAL_READY", "BLOCKED"].includes(entry.summaryState)
  );

  return deepFreeze({
    activeAssets: activeAssets.length,
    completedAssets: completedAssets.length,
    blockedAssets: blockedAssets.length
  });
}

function buildQualityMetrics(productionReport) {
  const warnings = productionReport.qualityStatus.warningCount;
  const reviewWorkload =
    (productionReport.qualityStatus.summaryState === "QUALITY_REVIEW" ? 1 : 0) +
    (productionReport.reviewStatus.summaryState === "WAITING" ? 1 : 0);
  const trackedAssets = Math.max(productionReport.summary.trackedAssetCount, 1);
  const passedAssets = Math.max(trackedAssets - productionReport.summary.blockedAssetCount - warnings, 0);
  const passRate = Number((passedAssets / trackedAssets).toFixed(2));

  return deepFreeze({
    passRate,
    failureCategories: deepFreeze(
      warnings > 0 ? ["QUALITY_WARNINGS", "REVIEW_PENDING"] : ["NO_ACTIVE_FAILURE_CATEGORY"]
    ),
    reviewWorkload
  });
}

function buildLifecycleMetrics(auditRecords, releaseRecords) {
  const uniqueAssets = new Set(auditRecords.map((record) => record.assetId));
  const transitionCount = auditRecords.length;
  const averageTransitionCounts = Number((transitionCount / Math.max(uniqueAssets.size, 1)).toFixed(2));
  const bottleneckStates = countBottleneckStates(auditRecords, releaseRecords);
  const releasedCount = releaseRecords.filter((record) => record.releaseStatus === "RELEASED").length;
  const releaseFrequency = Number((releasedCount / Math.max(releaseRecords.length, 1)).toFixed(2));

  return deepFreeze({
    averageTransitionCounts,
    bottleneckStates,
    releaseFrequency
  });
}

function countBottleneckStates(auditRecords, releaseRecords) {
  const counts = new Map();

  for (const record of auditRecords) {
    counts.set(record.eventType, (counts.get(record.eventType) ?? 0) + 1);
  }

  for (const record of releaseRecords) {
    counts.set(record.releaseStatus, (counts.get(record.releaseStatus) ?? 0) + 1);
  }

  return deepFreeze(
    [...counts.entries()]
      .map(([state, count]) => deepFreeze({ state, count }))
      .sort((left, right) => right.count - left.count || left.state.localeCompare(right.state))
  );
}

function buildGovernanceMetrics(governanceReport, auditRecords) {
  return deepFreeze({
    highImpactChanges: governanceReport.highImpactChanges.count,
    auditActivity: auditRecords.length,
    approvalIssues: governanceReport.approvalIssues.count
  });
}

function buildBottlenecks(productionReport, governanceReport, qualityMetrics, lifecycleMetrics) {
  const items = [];

  if (productionReport.summary.blockedAssetCount > 0) {
    items.push(
      deepFreeze({
        category: "PRODUCTION_BLOCKERS",
        severity: "HIGH",
        count: productionReport.summary.blockedAssetCount,
        description: `${productionReport.summary.blockedAssetCount} blocked asset(s) are currently visible in production review.`
      })
    );
  }

  if (qualityMetrics.reviewWorkload > 0) {
    items.push(
      deepFreeze({
        category: "QUALITY_REVIEW_LOAD",
        severity: "MEDIUM",
        count: qualityMetrics.reviewWorkload,
        description: `${qualityMetrics.reviewWorkload} active quality/review checkpoint(s) are waiting for attention.`
      })
    );
  }

  if (governanceReport.healthState === "HIGH_RISK" || governanceReport.healthState === "BLOCKED") {
    items.push(
      deepFreeze({
        category: "GOVERNANCE_RISK",
        severity: "HIGH",
        count: governanceReport.highImpactChanges.count + governanceReport.approvalIssues.count,
        description: `Governance health is ${governanceReport.healthState}.`
      })
    );
  }

  const topLifecycleState = lifecycleMetrics.bottleneckStates[0] ?? null;
  if (topLifecycleState) {
    items.push(
      deepFreeze({
        category: "LIFECYCLE_FRICTION",
        severity: topLifecycleState.count >= 2 ? "MEDIUM" : "LOW",
        count: topLifecycleState.count,
        description: `${topLifecycleState.state} is currently the most repeated lifecycle state.`
      })
    );
  }

  return deepFreeze(items.sort(compareBottlenecks));
}

function buildTrends(productionMetrics, qualityMetrics, lifecycleMetrics, governanceMetrics) {
  return deepFreeze({
    productionTrend: deriveProductionTrend(productionMetrics),
    qualityTrend: deriveQualityTrend(qualityMetrics),
    lifecycleTrend: deriveLifecycleTrend(lifecycleMetrics),
    governanceTrend: deriveGovernanceTrend(governanceMetrics)
  });
}

function deriveProductionTrend(productionMetrics) {
  if (productionMetrics.blockedAssets > 0) {
    return "PRESSURED";
  }
  if (productionMetrics.completedAssets > 0) {
    return "ADVANCING";
  }
  return "STABLE";
}

function deriveQualityTrend(qualityMetrics) {
  if (qualityMetrics.passRate >= 0.8 && qualityMetrics.reviewWorkload <= 1) {
    return "HEALTHY";
  }
  if (qualityMetrics.reviewWorkload > 1) {
    return "BACKLOGGED";
  }
  return "MONITORED";
}

function deriveLifecycleTrend(lifecycleMetrics) {
  if (lifecycleMetrics.releaseFrequency >= 0.25) {
    return "RELEASING";
  }
  if (lifecycleMetrics.averageTransitionCounts > 4) {
    return "HEAVY_TRANSITIONS";
  }
  return "STEADY";
}

function deriveGovernanceTrend(governanceMetrics) {
  if (governanceMetrics.highImpactChanges > 0 || governanceMetrics.approvalIssues > 0) {
    return "RISK_ELEVATED";
  }
  if (governanceMetrics.auditActivity > 0) {
    return "ACTIVE";
  }
  return "QUIET";
}

function buildHealthIndicators(productionReport, governanceReport, bottlenecks) {
  const overallHealth =
    governanceReport.healthState === "HIGH_RISK" || productionReport.overallSummaryState === "BLOCKED"
      ? "ATTENTION_REQUIRED"
      : productionReport.overallSummaryState === "QUALITY_REVIEW"
        ? "MONITORED"
        : "STABLE";

  return deepFreeze({
    overallHealth,
    productionState: productionReport.overallSummaryState,
    governanceHealth: governanceReport.healthState,
    bottleneckCount: bottlenecks.length
  });
}

function buildAnalyticsValidation(report, sourceContext) {
  const preHash = computeDeterministicHash(buildSourceSignature(sourceContext));
  const probe = buildAnalyticsReport(sourceContext);
  const postHash = computeDeterministicHash(buildSourceSignature(sourceContext));

  const sourceRecordsValid =
    Boolean(sourceContext.productionReport?.reportId) &&
    Boolean(sourceContext.governanceReport?.reportId) &&
    sourceContext.auditRecords.length > 0 &&
    sourceContext.releaseRecords.length > 0;
  const calculationsDeterministic =
    JSON.stringify(report.metricsSummary) === JSON.stringify(probe.metricsSummary) &&
    JSON.stringify(report.trends) === JSON.stringify(probe.trends);
  const noMutation = preHash === postHash;
  const metricConsistency =
    report.metricsSummary.production.blockedAssets === sourceContext.productionReport.summary.blockedAssetCount &&
    report.metricsSummary.governance.highImpactChanges === sourceContext.governanceReport.highImpactChanges.count &&
    report.metricsSummary.governance.approvalIssues === sourceContext.governanceReport.approvalIssues.count;
  const validationPassed =
    sourceRecordsValid &&
    calculationsDeterministic &&
    noMutation &&
    metricConsistency;

  return deepFreeze({
    schemaId: assetFactoryAnalyticsValidationSchemaId,
    sourceRecordsValid,
    calculationsDeterministic,
    noMutation,
    metricConsistency,
    validationPassed,
    deterministicAnalyticsHash: computeDeterministicHash(buildAnalyticsSignature(report))
  });
}

function buildSourceSignature(sourceContext) {
  return [
    sourceContext.productionReport.validation?.deterministicSummaryHash,
    sourceContext.governanceReport.validation?.deterministicSummaryHash,
    sourceContext.auditRecords.map((record) => record.validation?.deterministicAuditHash),
    sourceContext.releaseRecords.map((record) => record.validation?.deterministicReleaseHash)
  ];
}

function buildAnalyticsSignature(report) {
  return [
    report.reportId,
    report.metricsSummary,
    report.trends,
    report.bottlenecks,
    report.healthIndicators,
    report.sourceRecords
  ];
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createAnalyticsError(
      "invalid_asset_factory_analytics_options",
      "Asset Factory analytics options must be an object when provided."
    );
  }
  return deepFreeze({ ...rawOptions });
}

function normalizeProductionLayer(rawLayer) {
  const checked = validateAssetProductionReviewLayer(rawLayer);
  if (!checked.ok) {
    throw createAnalyticsError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeGovernanceLayer(rawLayer) {
  const checked = validateAssetGovernanceDashboardLayer(rawLayer);
  if (!checked.ok) {
    throw createAnalyticsError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeAuditLayer(rawLayer) {
  const checked = validateAssetAuditTrailLayer(rawLayer);
  if (!checked.ok) {
    throw createAnalyticsError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeReleaseLayer(rawLayer) {
  const checked = validateAssetReleaseManagementLayer(rawLayer);
  if (!checked.ok) {
    throw createAnalyticsError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function compareBottlenecks(left, right) {
  const severityOrder = new Map([
    ["HIGH", 3],
    ["MEDIUM", 2],
    ["LOW", 1]
  ]);

  return (
    (severityOrder.get(right.severity) ?? 0) - (severityOrder.get(left.severity) ?? 0) ||
    right.count - left.count ||
    left.category.localeCompare(right.category)
  );
}

function createAnalyticsError(code, message) {
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
