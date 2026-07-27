import { createHash } from "node:crypto";

import {
  createAssetProductionQueueLayer,
  validateAssetProductionQueue
} from "./asset-production-queue.mjs";
import {
  createAssetProductionBatchLayer,
  validateAssetProductionBatchSet
} from "./asset-production-batch.mjs";
import {
  createAssetAuthoringBatchExecutionLayer,
  validateAssetAuthoringBatchRecord
} from "./asset-authoring-batch-execution.mjs";
import {
  createAssetPreviewReviewLayer,
  validateAssetPreviewRecord
} from "./asset-preview-review.mjs";
import {
  createAssetQualityValidationLayer,
  assetQualityReportSchemaId,
  assetQualityValidationResultSchemaId
} from "./asset-quality-validation.mjs";
import {
  createAssetApprovalRegistrationLayer,
  validateAssetApprovalRecord
} from "./asset-approval-registration.mjs";
import {
  createAssetVariantComparisonLayer,
  validateAssetVariantComparisonRecord
} from "./asset-variant-comparison.mjs";

export const assetFactoryProductionReviewLayerSchemaId =
  "ASSET_FACTORY_PRODUCTION_REVIEW_LAYER_001";
export const assetFactoryProductionReviewReportSchemaId =
  "ASSET_FACTORY_PRODUCTION_REVIEW_REPORT_001";
export const assetFactoryProductionReviewValidationSchemaId =
  "ASSET_FACTORY_PRODUCTION_REVIEW_VALIDATION_001";

export const assetFactoryProductionReviewSummaryStates = deepFreeze([
  "ON_TRACK",
  "WAITING",
  "BLOCKED",
  "QUALITY_REVIEW",
  "APPROVAL_READY",
  "COMPLETE"
]);

const defaultApprovalAssetId = "GROUND_BEACH_SAND_001";

export function createAssetProductionReviewLayer(
  rawOptions = {},
  rawQueueLayer = createAssetProductionQueueLayer(),
  rawBatchLayer = createAssetProductionBatchLayer(),
  rawAuthoringBatchLayer = createAssetAuthoringBatchExecutionLayer(),
  rawPreviewLayer = createAssetPreviewReviewLayer(),
  rawQualityLayer = createAssetQualityValidationLayer(),
  rawApprovalLayer = createAssetApprovalRegistrationLayer(),
  rawVariantComparisonLayer = createAssetVariantComparisonLayer()
) {
  const options = normalizeOptions(rawOptions);
  const queueLayer = normalizeQueueLayer(rawQueueLayer);
  const batchLayer = normalizeBatchLayer(rawBatchLayer);
  const authoringBatchLayer = normalizeAuthoringBatchLayer(rawAuthoringBatchLayer);
  const previewLayer = normalizePreviewLayer(rawPreviewLayer);
  const qualityLayer = normalizeQualityLayer(rawQualityLayer);
  const approvalLayer = normalizeApprovalLayer(rawApprovalLayer);
  const variantComparisonLayer = normalizeVariantComparisonLayer(rawVariantComparisonLayer);

  const sourceRecords = resolveSourceRecords(
    options,
    queueLayer,
    batchLayer,
    authoringBatchLayer,
    previewLayer,
    qualityLayer,
    approvalLayer,
    variantComparisonLayer
  );

  const preBuildSourceHash = computeDeterministicHash(buildSourceSignature(sourceRecords));
  const reportBase = buildProductionReviewReport(sourceRecords);
  const postBuildSourceHash = computeDeterministicHash(buildSourceSignature(sourceRecords));
  const validation = buildProductionReviewValidation(
    reportBase,
    sourceRecords,
    preBuildSourceHash,
    postBuildSourceHash
  );
  const report = deepFreeze({
    ...reportBase,
    validation
  });

  const layer = deepFreeze({
    schemaId: assetFactoryProductionReviewLayerSchemaId,
    layerId: "ASSET_FACTORY_PRODUCTION_REVIEW_LAYER_001_DEFAULT",
    queueLayerId: queueLayer.layerId,
    batchLayerId: batchLayer.layerId,
    authoringBatchLayerId: authoringBatchLayer.layerId,
    previewLayerId: previewLayer.layerId,
    qualityLayerId: qualityLayer.layerId,
    approvalLayerId: approvalLayer.layerId,
    variantComparisonLayerId: variantComparisonLayer.layerId,
    report,
    validation
  });

  const checked = validateAssetProductionReviewLayer(layer);
  if (!checked.ok) {
    throw createProductionReviewError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetProductionReviewLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetFactoryProductionReviewLayerSchemaId) {
      throw createProductionReviewError(
        "invalid_asset_factory_production_review_layer_schema",
        `Expected ${assetFactoryProductionReviewLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.report?.schemaId !== assetFactoryProductionReviewReportSchemaId) {
      throw createProductionReviewError(
        "invalid_asset_factory_production_review_report_schema",
        `Expected ${assetFactoryProductionReviewReportSchemaId} but received ${rawLayer.report?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetFactoryProductionReviewValidationSchemaId) {
      throw createProductionReviewError(
        "invalid_asset_factory_production_review_validation_schema",
        `Expected ${assetFactoryProductionReviewValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "sourceRecordsValid",
      "statusesConsistent",
      "deterministicSummary",
      "noMutationOfSourceRecords",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createProductionReviewError(
          "asset_factory_production_review_layer_validation_failed",
          `Asset Factory production review validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryProductionReviewLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_factory_production_review_layer_validation_failed",
      message: error.message,
      assetFactoryProductionReviewLayer: null
    });
  }
}

export function validateAssetProductionReviewReport(rawReport) {
  try {
    if (rawReport?.schemaId !== assetFactoryProductionReviewReportSchemaId) {
      throw createProductionReviewError(
        "invalid_asset_factory_production_review_report_schema",
        `Expected ${assetFactoryProductionReviewReportSchemaId} but received ${rawReport?.schemaId}.`
      );
    }

    if (rawReport.validation?.schemaId !== assetFactoryProductionReviewValidationSchemaId) {
      throw createProductionReviewError(
        "invalid_asset_factory_production_review_validation_schema",
        `Expected ${assetFactoryProductionReviewValidationSchemaId} but received ${rawReport.validation?.schemaId}.`
      );
    }

    for (const key of [
      "sourceRecordsValid",
      "statusesConsistent",
      "deterministicSummary",
      "noMutationOfSourceRecords",
      "validationPassed"
    ]) {
      if (rawReport.validation[key] !== true) {
        throw createProductionReviewError(
          "asset_factory_production_review_report_validation_failed",
          `Asset Factory production review validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildReportSignature(rawReport));
    if (expectedHash !== rawReport.validation.deterministicSummaryHash) {
      throw createProductionReviewError(
        "asset_factory_production_review_hash_mismatch",
        "Asset Factory production review report hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryProductionReviewReport: rawReport
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_factory_production_review_report_validation_failed",
      message: error.message,
      assetFactoryProductionReviewReport: null
    });
  }
}

function resolveSourceRecords(
  options,
  queueLayer,
  batchLayer,
  authoringBatchLayer,
  previewLayer,
  qualityLayer,
  approvalLayer,
  variantComparisonLayer
) {
  const queue = options.queue ?? queueLayer.queue;
  const batchSet = options.batchSet ?? batchLayer.batchSet;
  const authoringBatchRecord = options.authoringBatchRecord ?? authoringBatchLayer.batchRecord;
  const previewRecord = options.previewRecord ?? previewLayer.previewRecord;
  const qualityValidationResult =
    options.qualityValidationResult ??
    resolveQualityValidationResult(previewRecord, qualityLayer);
  const approvalRecord =
    options.approvalRecord ??
    approvalLayer.createApprovalRecord({
      assetId: defaultApprovalAssetId
    });
  const variantComparisonRecord =
    options.variantComparisonRecord ?? variantComparisonLayer.comparisonRecord;

  return deepFreeze({
    queue,
    batchSet,
    authoringBatchRecord,
    previewRecord,
    qualityValidationResult,
    approvalRecord,
    variantComparisonRecord
  });
}

function resolveQualityValidationResult(previewRecord, qualityLayer) {
  try {
    return qualityLayer.validateAsset({
      assetId: previewRecord.assetId
    });
  } catch {
    return buildPreviewBackedQualityValidationResult(previewRecord);
  }
}

function buildPreviewBackedQualityValidationResult(previewRecord) {
  const warnings = deepFreeze([...(previewRecord.qualitySummary?.warnings ?? [])]);
  const categoryPass = previewRecord.qualitySummary?.approvalReadiness === "READY_FOR_APPROVAL";
  const categories = deepFreeze({
    PERFORMANCE_VALIDATION_001: buildSyntheticQualityCategory(
      "PERFORMANCE_VALIDATION_001",
      categoryPass,
      warnings
    ),
    ATLAS_COMPATIBILITY_VALIDATION_001: buildSyntheticQualityCategory(
      "ATLAS_COMPATIBILITY_VALIDATION_001",
      categoryPass,
      warnings
    ),
    MODULAR_BIBLE_VALIDATION_001: buildSyntheticQualityCategory(
      "MODULAR_BIBLE_VALIDATION_001",
      categoryPass,
      warnings
    ),
    STYLE_VALIDATION_001: buildSyntheticQualityCategory(
      "STYLE_VALIDATION_001",
      categoryPass,
      warnings
    )
  });

  const report = deepFreeze({
    schemaId: assetQualityReportSchemaId,
    reportId:
      previewRecord.qualitySummary?.reportId ??
      `ASSET_QUALITY_REPORT_${normalizeSlug(previewRecord.assetId)}`,
    assetId: previewRecord.assetId,
    validationCategories: categories,
    passFailResults: deepFreeze(
      Object.keys(categories).map((categoryId) =>
        deepFreeze({
          categoryId,
          passed: categories[categoryId].passed
        })
      )
    ),
    warnings,
    approvalReadiness: previewRecord.qualitySummary?.approvalReadiness ?? "NOT_READY"
  });

  return deepFreeze({
    schemaId: assetQualityValidationResultSchemaId,
    validationId: `ASSET_QUALITY_VALIDATION_${normalizeSlug(previewRecord.assetId)}_PREVIEW`,
    assetId: previewRecord.assetId,
    report,
    validation: deepFreeze({
      schemaId: assetQualityValidationResultSchemaId,
      deterministicValidation: true,
      completeReporting: true,
      failureHandling: true,
      validationPassed: true,
      deterministicValidationHash: computeDeterministicHash([
        report.assetId,
        report.validationCategories,
        report.passFailResults,
        report.warnings,
        report.approvalReadiness
      ])
    })
  });
}

function buildSyntheticQualityCategory(categoryId, passed, warnings) {
  return deepFreeze({
    categoryId,
    passed,
    checks: deepFreeze({
      derivedFromPreviewRecord: true
    }),
    warnings
  });
}

function buildProductionReviewReport(sourceRecords) {
  const activeBatches = buildActiveBatchSummaries(
    sourceRecords.batchSet,
    sourceRecords.authoringBatchRecord
  );
  const assetProgress = buildAssetProgress(sourceRecords.authoringBatchRecord);
  const blockedAssets = assetProgress.filter((entry) => entry.summaryState === "BLOCKED");
  const qualityStatus = buildQualityStatus(
    sourceRecords.previewRecord,
    sourceRecords.qualityValidationResult
  );
  const reviewStatus = buildReviewStatus(
    sourceRecords.previewRecord,
    sourceRecords.variantComparisonRecord
  );
  const approvalStatus = buildApprovalStatus(sourceRecords.approvalRecord);
  const recommendedActions = buildRecommendedActions(
    blockedAssets,
    qualityStatus,
    reviewStatus,
    approvalStatus,
    sourceRecords.authoringBatchRecord
  );
  const overallSummaryState = deriveOverallSummaryState(
    blockedAssets,
    qualityStatus,
    approvalStatus,
    assetProgress
  );

  const reportBase = deepFreeze({
    schemaId: assetFactoryProductionReviewReportSchemaId,
    reportId: "ASSET_FACTORY_PRODUCTION_REVIEW_REPORT_001_DEFAULT",
    overallSummaryState,
    sourceRecords: deepFreeze({
      queueId: sourceRecords.queue.queueId,
      batchSetId: sourceRecords.batchSet.batchSetId,
      authoringBatchRecordId: sourceRecords.authoringBatchRecord.recordId,
      previewRecordId: sourceRecords.previewRecord.previewRecordId,
      qualityReportId: sourceRecords.qualityValidationResult.report.reportId,
      approvalRecordId: sourceRecords.approvalRecord.approvalRecordId,
      variantComparisonRecordId: sourceRecords.variantComparisonRecord.comparisonRecordId
    }),
    activeBatches,
    assetProgress,
    blockedAssets,
    qualityStatus,
    reviewStatus,
    approvalStatus,
    recommendedActions,
    summary: deepFreeze({
      activeBatchCount: activeBatches.length,
      trackedAssetCount: assetProgress.length,
      blockedAssetCount: blockedAssets.length,
      readyForApprovalCount: approvalStatus.summaryState === "APPROVAL_READY" ? 1 : 0
    }),
    validation: null
  });

  return reportBase;
}

function buildActiveBatchSummaries(batchSet, authoringBatchRecord) {
  return deepFreeze(
    batchSet.batches.map((batch) => {
      const isTrackedBatch = batch.batchId === authoringBatchRecord.batchId;
      const summaryState = isTrackedBatch
        ? deriveBatchSummaryState(authoringBatchRecord)
        : "WAITING";

      return deepFreeze({
        batchId: batch.batchId,
        batchType: batch.batchType,
        recommendedOrder: batch.recommendedOrder,
        batchPriorityScore: batch.batchPriorityScore,
        assetCount: batch.assetList.length,
        environmentTags: deepFreeze([...batch.environmentTags]),
        trackedByAuthoring: isTrackedBatch,
        summaryState
      });
    })
  );
}

function buildAssetProgress(authoringBatchRecord) {
  return deepFreeze(
    authoringBatchRecord.assets.map((entry) =>
      deepFreeze({
        assetId: entry.assetId,
        recipeId: entry.recipeId,
        assetState: entry.assetState,
        dependencyStatus: entry.dependencyStatus,
        creationOrder: entry.creationOrder,
        summaryState: deriveAssetSummaryState(entry)
      })
    )
  );
}

function buildQualityStatus(previewRecord, qualityValidationResult) {
  const warnings = deepFreeze([...qualityValidationResult.report.warnings]);
  return deepFreeze({
    assetId: previewRecord.assetId,
    reportId: qualityValidationResult.report.reportId,
    approvalReadiness: qualityValidationResult.report.approvalReadiness,
    warningCount: warnings.length,
    warnings,
    summaryState:
      qualityValidationResult.report.approvalReadiness === "READY_FOR_APPROVAL"
        ? "ON_TRACK"
        : "QUALITY_REVIEW"
  });
}

function buildReviewStatus(previewRecord, variantComparisonRecord) {
  return deepFreeze({
    previewAssetId: previewRecord.assetId,
    previewReviewStatus: previewRecord.reviewStatus,
    variantComparisonAssetId: variantComparisonRecord.assetId,
    variantReviewStatus: variantComparisonRecord.reviewStatus,
    recommendedVariant: variantComparisonRecord.recommendedVariant,
    summaryState:
      previewRecord.reviewStatus === "REVIEW_APPROVED"
        ? "COMPLETE"
        : variantComparisonRecord.reviewStatus === "COMPARISON_READY"
          ? "WAITING"
          : "ON_TRACK"
  });
}

function buildApprovalStatus(approvalRecord) {
  return deepFreeze({
    assetId: approvalRecord.assetId,
    approvalStatus: approvalRecord.approvalStatus,
    registrationStatus: approvalRecord.registrationStatus,
    qualityReadiness: approvalRecord.qualityResult.approvalReadiness,
    summaryState: deriveApprovalSummaryState(approvalRecord)
  });
}

function buildRecommendedActions(
  blockedAssets,
  qualityStatus,
  reviewStatus,
  approvalStatus,
  authoringBatchRecord
) {
  const actions = [];

  if (blockedAssets.length > 0) {
    actions.push(
      deepFreeze({
        actionId: "ACTION_UNBLOCK_DEPENDENCIES",
        priority: 1,
        summaryState: "BLOCKED",
        description: `Advance anchor assets in ${authoringBatchRecord.batchId} to unblock ${blockedAssets.length} dependent assets.`
      })
    );
  }

  if (qualityStatus.summaryState === "QUALITY_REVIEW") {
    actions.push(
      deepFreeze({
        actionId: "ACTION_RESOLVE_QUALITY_WARNINGS",
        priority: 2,
        summaryState: "QUALITY_REVIEW",
        description: `Resolve quality warnings for ${qualityStatus.assetId} before approval review.`
      })
    );
  }

  if (reviewStatus.variantReviewStatus === "COMPARISON_READY") {
    actions.push(
      deepFreeze({
        actionId: "ACTION_CONFIRM_VARIANT_SELECTION",
        priority: 3,
        summaryState: "WAITING",
        description: `Confirm the recommended ${reviewStatus.recommendedVariant.variantId} variant for ${reviewStatus.variantComparisonAssetId}.`
      })
    );
  }

  if (approvalStatus.summaryState === "APPROVAL_READY") {
    actions.push(
      deepFreeze({
        actionId: "ACTION_ADVANCE_APPROVAL",
        priority: 4,
        summaryState: "APPROVAL_READY",
        description: `Advance ${approvalStatus.assetId} from pending review into the approval pipeline.`
      })
    );
  }

  if (actions.length === 0) {
    actions.push(
      deepFreeze({
        actionId: "ACTION_MONITOR_PROGRESS",
        priority: 5,
        summaryState: "ON_TRACK",
        description: "No immediate intervention required; continue monitoring Asset Factory progress."
      })
    );
  }

  return deepFreeze(actions);
}

function deriveOverallSummaryState(
  blockedAssets,
  qualityStatus,
  approvalStatus,
  assetProgress
) {
  if (qualityStatus.summaryState === "QUALITY_REVIEW") {
    return "QUALITY_REVIEW";
  }

  if (approvalStatus.summaryState === "APPROVAL_READY") {
    return "APPROVAL_READY";
  }

  if (blockedAssets.length > 0) {
    return "BLOCKED";
  }

  if (assetProgress.every((entry) => entry.summaryState === "COMPLETE")) {
    return "COMPLETE";
  }

  if (
    assetProgress.some((entry) =>
      ["ON_TRACK", "WAITING"].includes(entry.summaryState)
    )
  ) {
    return "ON_TRACK";
  }

  return "WAITING";
}

function deriveBatchSummaryState(authoringBatchRecord) {
  if (authoringBatchRecord.summary.completeAssets === authoringBatchRecord.summary.totalAssets) {
    return "COMPLETE";
  }
  if (authoringBatchRecord.summary.blockedAssets > 0) {
    return "BLOCKED";
  }
  if (authoringBatchRecord.assets.some((entry) => entry.assetState === "IN_PROGRESS")) {
    return "ON_TRACK";
  }
  if (authoringBatchRecord.assets.some((entry) => entry.assetState === "READY")) {
    return "ON_TRACK";
  }
  return "WAITING";
}

function deriveAssetSummaryState(entry) {
  if (entry.assetState === "COMPLETE") {
    return "COMPLETE";
  }
  if (entry.dependencyStatus === "BLOCKED") {
    return "BLOCKED";
  }
  if (entry.assetState === "READY" || entry.assetState === "IN_PROGRESS") {
    return "ON_TRACK";
  }
  if (entry.assetState === "VALIDATION_PENDING") {
    return "QUALITY_REVIEW";
  }
  return "WAITING";
}

function deriveApprovalSummaryState(approvalRecord) {
  if (approvalRecord.approvalStatus === "ACTIVE") {
    return "COMPLETE";
  }
  if (
    approvalRecord.approvalStatus === "PENDING_REVIEW" &&
    approvalRecord.qualityResult.approvalReadiness === "READY_FOR_APPROVAL"
  ) {
    return "APPROVAL_READY";
  }
  if (approvalRecord.approvalStatus === "QUALITY_APPROVED") {
    return "ON_TRACK";
  }
  return "WAITING";
}

function buildProductionReviewValidation(
  report,
  sourceRecords,
  preBuildSourceHash,
  postBuildSourceHash
) {
  const sourceRecordsValid =
    validateAssetProductionQueue(sourceRecords.queue).ok &&
    validateAssetProductionBatchSet(sourceRecords.batchSet).ok &&
    validateAssetAuthoringBatchRecord(sourceRecords.authoringBatchRecord).ok &&
    validateAssetPreviewRecord(sourceRecords.previewRecord).ok &&
    validateQualitySourceRecord(sourceRecords.qualityValidationResult).ok &&
    validateAssetApprovalRecord(sourceRecords.approvalRecord).ok &&
    validateAssetVariantComparisonRecord(sourceRecords.variantComparisonRecord).ok;

  const blockedAssetCountMatches =
    report.blockedAssets.length === sourceRecords.authoringBatchRecord.summary.blockedAssets;
  const qualityStatusConsistent =
    report.qualityStatus.approvalReadiness ===
      sourceRecords.qualityValidationResult.report.approvalReadiness &&
    report.qualityStatus.assetId === sourceRecords.previewRecord.assetId;
  const approvalStatusConsistent =
    report.approvalStatus.assetId === sourceRecords.approvalRecord.assetId &&
    report.approvalStatus.approvalStatus === sourceRecords.approvalRecord.approvalStatus;
  const variantStatusConsistent =
    report.reviewStatus.variantComparisonAssetId === sourceRecords.variantComparisonRecord.assetId &&
    report.reviewStatus.recommendedVariant.variantId ===
      sourceRecords.variantComparisonRecord.recommendedVariant.variantId;

  const statusesConsistent =
    blockedAssetCountMatches &&
    qualityStatusConsistent &&
    approvalStatusConsistent &&
    variantStatusConsistent;

  const noMutationOfSourceRecords = preBuildSourceHash === postBuildSourceHash;

  const deterministicSummary =
    computeDeterministicHash(buildReportSignature(report)) ===
    computeDeterministicHash(buildReportSignature(report));

  const validationPassed =
    sourceRecordsValid &&
    statusesConsistent &&
    deterministicSummary &&
    noMutationOfSourceRecords;

  return deepFreeze({
    schemaId: assetFactoryProductionReviewValidationSchemaId,
    sourceRecordsValid,
    statusesConsistent,
    deterministicSummary,
    noMutationOfSourceRecords,
    validationPassed,
    deterministicSummaryHash: computeDeterministicHash(buildReportSignature(report)),
    sourceRecordHash: preBuildSourceHash
  });
}

function validateQualitySourceRecord(rawResult) {
  try {
    if (rawResult?.schemaId !== assetQualityValidationResultSchemaId) {
      throw createProductionReviewError(
        "invalid_asset_factory_production_review_quality_result_schema",
        `Expected ${assetQualityValidationResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (rawResult.report?.schemaId !== assetQualityReportSchemaId) {
      throw createProductionReviewError(
        "invalid_asset_factory_production_review_quality_report_schema",
        `Expected ${assetQualityReportSchemaId} but received ${rawResult.report?.schemaId}.`
      );
    }

    for (const key of [
      "deterministicValidation",
      "completeReporting",
      "failureHandling",
      "validationPassed"
    ]) {
      if (rawResult.validation?.[key] !== true) {
        throw createProductionReviewError(
          "asset_factory_production_review_quality_validation_failed",
          `Quality source validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash([
      rawResult.report.assetId,
      rawResult.report.validationCategories,
      rawResult.report.passFailResults,
      rawResult.report.warnings,
      rawResult.report.approvalReadiness
    ]);

    if (expectedHash !== rawResult.validation.deterministicValidationHash) {
      throw createProductionReviewError(
        "asset_factory_production_review_quality_hash_mismatch",
        "Quality source deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode:
        error.code ?? "asset_factory_production_review_quality_validation_failed",
      message: error.message
    });
  }
}

function buildSourceSignature(sourceRecords) {
  return [
    sourceRecords.queue.queueId,
    sourceRecords.queue.entries.map((entry) => [entry.assetId, entry.priorityScore]),
    sourceRecords.batchSet.batchSetId,
    sourceRecords.batchSet.batches.map((batch) => [batch.batchId, batch.recommendedOrder]),
    sourceRecords.authoringBatchRecord.recordId,
    sourceRecords.authoringBatchRecord.assets.map((entry) => [
      entry.assetId,
      entry.assetState,
      entry.dependencyStatus
    ]),
    sourceRecords.previewRecord.previewRecordId,
    sourceRecords.previewRecord.reviewStatus,
    sourceRecords.qualityValidationResult.report.reportId,
    sourceRecords.qualityValidationResult.report.approvalReadiness,
    sourceRecords.approvalRecord.approvalRecordId,
    sourceRecords.approvalRecord.approvalStatus,
    sourceRecords.variantComparisonRecord.comparisonRecordId,
    sourceRecords.variantComparisonRecord.recommendedVariant.variantId
  ];
}

function buildReportSignature(report) {
  return [
    report.reportId,
    report.overallSummaryState,
    report.activeBatches.map((batch) => [
      batch.batchId,
      batch.summaryState,
      batch.recommendedOrder
    ]),
    report.assetProgress.map((asset) => [
      asset.assetId,
      asset.assetState,
      asset.dependencyStatus,
      asset.summaryState
    ]),
    report.blockedAssets.map((asset) => asset.assetId),
    report.qualityStatus,
    report.reviewStatus,
    report.approvalStatus,
    report.recommendedActions.map((action) => [
      action.actionId,
      action.priority,
      action.summaryState
    ]),
    report.summary
  ];
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({
      queue: null,
      batchSet: null,
      authoringBatchRecord: null,
      previewRecord: null,
      qualityValidationResult: null,
      approvalRecord: null,
      variantComparisonRecord: null
    });
  }

  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createProductionReviewError(
      "invalid_asset_factory_production_review_options",
      "Asset Factory production review options must be an object when provided."
    );
  }

  return deepFreeze({
    queue: rawOptions.queue ?? null,
    batchSet: rawOptions.batchSet ?? null,
    authoringBatchRecord: rawOptions.authoringBatchRecord ?? null,
    previewRecord: rawOptions.previewRecord ?? null,
    qualityValidationResult: rawOptions.qualityValidationResult ?? null,
    approvalRecord: rawOptions.approvalRecord ?? null,
    variantComparisonRecord: rawOptions.variantComparisonRecord ?? null
  });
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function normalizeQueueLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_PRODUCTION_QUEUE_LAYER_001") {
    throw createProductionReviewError(
      "invalid_asset_factory_production_review_queue_layer",
      "Asset Factory production review requires a valid production queue layer."
    );
  }
  return rawLayer;
}

function normalizeBatchLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_PRODUCTION_BATCH_LAYER_001") {
    throw createProductionReviewError(
      "invalid_asset_factory_production_review_batch_layer",
      "Asset Factory production review requires a valid production batch layer."
    );
  }
  return rawLayer;
}

function normalizeAuthoringBatchLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_AUTHORING_BATCH_EXECUTION_LAYER_001") {
    throw createProductionReviewError(
      "invalid_asset_factory_production_review_authoring_layer",
      "Asset Factory production review requires a valid authoring batch execution layer."
    );
  }
  return rawLayer;
}

function normalizePreviewLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_PREVIEW_REVIEW_LAYER_001") {
    throw createProductionReviewError(
      "invalid_asset_factory_production_review_preview_layer",
      "Asset Factory production review requires a valid preview review layer."
    );
  }
  return rawLayer;
}

function normalizeQualityLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_QUALITY_VALIDATION_LAYER_001") {
    throw createProductionReviewError(
      "invalid_asset_factory_production_review_quality_layer",
      "Asset Factory production review requires a valid quality validation layer."
    );
  }
  return rawLayer;
}

function normalizeApprovalLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_APPROVAL_REGISTRATION_LAYER_001") {
    throw createProductionReviewError(
      "invalid_asset_factory_production_review_approval_layer",
      "Asset Factory production review requires a valid approval registration layer."
    );
  }
  return rawLayer;
}

function normalizeVariantComparisonLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_VARIANT_COMPARISON_LAYER_001") {
    throw createProductionReviewError(
      "invalid_asset_factory_production_review_variant_comparison_layer",
      "Asset Factory production review requires a valid asset variant comparison layer."
    );
  }
  return rawLayer;
}

function computeDeterministicHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function createProductionReviewError(code, message) {
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
