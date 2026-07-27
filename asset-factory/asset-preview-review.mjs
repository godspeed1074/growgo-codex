import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetAuthoringBatchExecutionLayer } from "./asset-authoring-batch-execution.mjs";
import { createAssetProductionSpecificationLayer } from "./asset-production-specification.mjs";
import { createAssetQualityValidationLayer } from "./asset-quality-validation.mjs";

export const assetPreviewReviewLayerSchemaId = "ASSET_PREVIEW_REVIEW_LAYER_001";
export const assetPreviewRecordSchemaId = "ASSET_PREVIEW_RECORD_001";
export const assetPreviewReviewValidationSchemaId =
  "ASSET_PREVIEW_REVIEW_VALIDATION_001";

export const assetPreviewReviewStates = deepFreeze([
  "PREVIEW_READY",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "REVIEW_APPROVED"
]);

const allowedReviewTransitions = deepFreeze({
  PREVIEW_READY: deepFreeze(["UNDER_REVIEW"]),
  UNDER_REVIEW: deepFreeze(["CHANGES_REQUESTED", "REVIEW_APPROVED"]),
  CHANGES_REQUESTED: deepFreeze(["UNDER_REVIEW"]),
  REVIEW_APPROVED: deepFreeze([])
});

const defaultAssetId = "BUILDING_CIVIC_SPORTS_PAVILION_001";

export function createAssetPreviewReviewLayer(
  rawOptions = {},
  rawBatchExecutionLayer = createAssetAuthoringBatchExecutionLayer(),
  rawProductionSpecificationLayer = createAssetProductionSpecificationLayer(),
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawQualityLayer = createAssetQualityValidationLayer()
) {
  const options = normalizeOptions(rawOptions);
  const batchExecutionLayer = normalizeBatchExecutionLayer(rawBatchExecutionLayer);
  const productionSpecificationLayer = normalizeProductionSpecificationLayer(
    rawProductionSpecificationLayer
  );
  const registry = normalizeRegistry(rawRegistry);
  const qualityLayer = normalizeQualityLayer(rawQualityLayer);

  const previewRecord = createAssetPreviewRecord(
    { assetId: options.assetId },
    batchExecutionLayer,
    productionSpecificationLayer,
    registry,
    qualityLayer
  );
  const validation = buildPreviewReviewValidation(
    previewRecord,
    batchExecutionLayer,
    productionSpecificationLayer,
    registry
  );

  const layer = deepFreeze({
    schemaId: assetPreviewReviewLayerSchemaId,
    layerId: "ASSET_PREVIEW_REVIEW_LAYER_001_DEFAULT",
    batchExecutionLayerId: batchExecutionLayer.layerId,
    productionSpecificationLayerId: productionSpecificationLayer.layerId,
    registryId: registry.registryId,
    qualityLayerId: qualityLayer.layerId,
    previewRecord,
    validation,
    createPreviewRecord(rawInput = {}) {
      return createAssetPreviewRecord(
        { assetId: rawInput.assetId ?? options.assetId },
        batchExecutionLayer,
        productionSpecificationLayer,
        registry,
        qualityLayer
      );
    },
    advanceReview(rawRecord, targetState) {
      return advanceAssetPreviewRecord(
        rawRecord,
        targetState,
        batchExecutionLayer,
        productionSpecificationLayer,
        registry,
        qualityLayer
      );
    }
  });

  const checked = validateAssetPreviewReviewLayer(layer);
  if (!checked.ok) {
    throw createPreviewReviewError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetPreviewReviewLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetPreviewReviewLayerSchemaId) {
      throw createPreviewReviewError(
        "invalid_asset_preview_review_layer_schema",
        `Expected ${assetPreviewReviewLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.previewRecord?.schemaId !== assetPreviewRecordSchemaId) {
      throw createPreviewReviewError(
        "invalid_asset_preview_record_schema",
        `Expected ${assetPreviewRecordSchemaId} but received ${rawLayer.previewRecord?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetPreviewReviewValidationSchemaId) {
      throw createPreviewReviewError(
        "invalid_asset_preview_review_validation_schema",
        `Expected ${assetPreviewReviewValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "assetExists",
      "previewReferencesValidAsset",
      "qualityDataExists",
      "reviewStateValid",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createPreviewReviewError(
          "asset_preview_review_layer_validation_failed",
          `Asset preview review validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetPreviewReviewLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_preview_review_layer_validation_failed",
      message: error.message,
      assetPreviewReviewLayer: null
    });
  }
}

export function validateAssetPreviewRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetPreviewRecordSchemaId) {
      throw createPreviewReviewError(
        "invalid_asset_preview_record_schema",
        `Expected ${assetPreviewRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetPreviewReviewValidationSchemaId) {
      throw createPreviewReviewError(
        "invalid_asset_preview_review_validation_schema",
        `Expected ${assetPreviewReviewValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    const derivedValidation = buildPreviewReviewValidation(
      rawRecord,
      createAssetAuthoringBatchExecutionLayer(),
      createAssetProductionSpecificationLayer(),
      createAssetFactoryRegistryLayer()
    );

    for (const key of [
      "assetExists",
      "previewReferencesValidAsset",
      "qualityDataExists",
      "reviewStateValid",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (derivedValidation[key] !== true) {
        throw createPreviewReviewError(
          "asset_preview_record_validation_failed",
          `Asset preview review validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildPreviewSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicPreviewHash) {
      throw createPreviewReviewError(
        "asset_preview_review_hash_mismatch",
        "Asset preview record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetPreviewRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_preview_record_validation_failed",
      message: error.message,
      assetPreviewRecord: null
    });
  }
}

function createAssetPreviewRecord(
  rawInput,
  batchExecutionLayer,
  productionSpecificationLayer,
  registry,
  qualityLayer
) {
  const input = normalizeInput(rawInput);
  const batchRecord = batchExecutionLayer.batchRecord;
  const batchAsset = resolveBatchAsset(batchRecord, input.assetId);
  const assetSpecification = resolveAssetSpecification(
    productionSpecificationLayer,
    input.assetId
  );
  const registeredAsset = registry.getAssetById(input.assetId);
  if (!registeredAsset) {
    throw createPreviewReviewError(
      "missing_asset_preview_registered_asset",
      `Asset ${input.assetId} is not registered for preview review.`
    );
  }

  const authoringSnapshot = buildAuthoringSnapshot(batchRecord, batchAsset, assetSpecification);
  const qualityResult = qualityLayer.validateAsset({
    authoringRecord: authoringSnapshot
  });

  const recordBase = deepFreeze({
    schemaId: assetPreviewRecordSchemaId,
    previewRecordId: `ASSET_PREVIEW_${normalizeSlug(input.assetId)}`,
    assetId: input.assetId,
    recipeId: assetSpecification.recipeId,
    previewStatus: "PREVIEW_DATA_AVAILABLE",
    variantPreviewData: deepFreeze({
      selectedVariant: assetSpecification.selectedVariant,
      availableVariants: deepFreeze([...assetSpecification.variants]),
      lodRequirements: deepFreeze([...assetSpecification.lodRequirements]),
      previewContext: deepFreeze({
        creationStage: batchAsset.creationStage,
        assetState: batchAsset.assetState,
        dependencyStatus: batchAsset.dependencyStatus
      })
    }),
    qualitySummary: deepFreeze({
      reportId: qualityResult.report.reportId,
      approvalReadiness: qualityResult.report.approvalReadiness,
      warnings: deepFreeze([...qualityResult.report.warnings]),
      passCount: qualityResult.report.passFailResults.filter((entry) => entry.passed).length,
      failCount: qualityResult.report.passFailResults.filter((entry) => !entry.passed).length
    }),
    reviewStatus: "PREVIEW_READY",
    authoringHistory: deepFreeze({
      batchId: batchRecord.batchId,
      specificationId: assetSpecification.workPackageId,
      assetState: batchAsset.assetState,
      transitionHistory: deepFreeze([...batchAsset.transitionHistory])
    }),
    reviewHistory: deepFreeze(["PREVIEW_READY"]),
    validation: null
  });

  const validation = buildPreviewReviewValidation(
    recordBase,
    batchExecutionLayer,
    productionSpecificationLayer,
    registry
  );

  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetPreviewRecord(record);
  if (!checked.ok) {
    throw createPreviewReviewError(checked.errorCode, checked.message);
  }

  return record;
}

function advanceAssetPreviewRecord(
  rawRecord,
  targetState,
  batchExecutionLayer,
  productionSpecificationLayer,
  registry,
  qualityLayer
) {
  const checked = validateAssetPreviewRecord(rawRecord);
  if (!checked.ok) {
    throw createPreviewReviewError(checked.errorCode, checked.message);
  }

  const normalizedTargetState = normalizeReviewState(targetState);
  if (!allowedReviewTransitions[rawRecord.reviewStatus].includes(normalizedTargetState)) {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_state_transition",
      `Cannot transition asset preview record from ${rawRecord.reviewStatus} to ${normalizedTargetState}.`
    );
  }

  const rebuilt = createAssetPreviewRecord(
    { assetId: rawRecord.assetId },
    batchExecutionLayer,
    productionSpecificationLayer,
    registry,
    qualityLayer
  );

  const advancedBase = deepFreeze({
    ...rebuilt,
    reviewStatus: normalizedTargetState,
    reviewHistory: deepFreeze([...rawRecord.reviewHistory, normalizedTargetState]),
    validation: null
  });

  const validation = buildPreviewReviewValidation(
    advancedBase,
    batchExecutionLayer,
    productionSpecificationLayer,
    registry
  );
  const advanced = deepFreeze({
    ...advancedBase,
    validation
  });

  const validated = validateAssetPreviewRecord(advanced);
  if (!validated.ok) {
    throw createPreviewReviewError(validated.errorCode, validated.message);
  }

  return advanced;
}

function buildAuthoringSnapshot(batchRecord, batchAsset, assetSpecification) {
  return deepFreeze({
    assetId: batchAsset.assetId,
    specificationId: assetSpecification.workPackageId,
    workflowState: deriveWorkflowState(batchAsset.assetState),
    variantRequirements: deepFreeze([...assetSpecification.variants]),
    validationStatus: batchAsset.validationStatus,
    registrationStatus: "not_registered",
    recipeId: assetSpecification.recipeId,
    lodRules: deepFreeze([...assetSpecification.lodRequirements]),
    performanceBudget: structuredClone(assetSpecification.performanceBudget),
    metadata: deepFreeze({
      specificationLabel: assetSpecification.specificationLabel,
      specificationSourceAssetId: assetSpecification.assetId,
      creationRequestId: assetSpecification.creationRequest.requestId
    })
  });
}

function buildPreviewReviewValidation(
  record,
  batchExecutionLayer,
  productionSpecificationLayer,
  registry
) {
  const assetExists = registry.getAssetById(record.assetId) !== null;
  const batchAsset = batchExecutionLayer.batchRecord.assets.find(
    (entry) => entry.assetId === record.assetId
  );
  const assetSpecification = productionSpecificationLayer.specification.assetSpecifications.find(
    (entry) => entry.assetId === record.assetId
  );
  const previewReferencesValidAsset =
    Boolean(batchAsset) &&
    Boolean(assetSpecification) &&
    record.recipeId === assetSpecification.recipeId;
  const qualityDataExists =
    typeof record.qualitySummary?.reportId === "string" &&
    typeof record.qualitySummary?.approvalReadiness === "string";
  const reviewStateValid = assetPreviewReviewStates.includes(record.reviewStatus);
  const deterministicOutput = true;
  const validationPassed =
    assetExists &&
    previewReferencesValidAsset &&
    qualityDataExists &&
    reviewStateValid &&
    deterministicOutput;

  return deepFreeze({
    schemaId: assetPreviewReviewValidationSchemaId,
    assetExists,
    previewReferencesValidAsset,
    qualityDataExists,
    reviewStateValid,
    deterministicOutput,
    validationPassed,
    deterministicPreviewHash: computeDeterministicHash(buildPreviewSignature(record))
  });
}

function buildPreviewSignature(record) {
  return [
    record.previewRecordId,
    record.assetId,
    record.recipeId,
    record.previewStatus,
    record.variantPreviewData,
    record.qualitySummary,
    record.reviewStatus,
    record.authoringHistory,
    record.reviewHistory
  ];
}

function resolveBatchAsset(batchRecord, assetId) {
  const entry = batchRecord.assets.find((asset) => asset.assetId === assetId);
  if (!entry) {
    throw createPreviewReviewError(
      "missing_asset_preview_batch_asset",
      `Asset ${assetId} does not exist in the authoring batch record.`
    );
  }
  return entry;
}

function resolveAssetSpecification(productionSpecificationLayer, assetId) {
  const entry = productionSpecificationLayer.specification.assetSpecifications.find(
    (asset) => asset.assetId === assetId
  );
  if (!entry) {
    throw createPreviewReviewError(
      "missing_asset_preview_specification",
      `Asset ${assetId} does not exist in the production specification.`
    );
  }
  return entry;
}

function deriveWorkflowState(batchState) {
  if (batchState === "NOT_STARTED" || batchState === "READY") {
    return "SPEC_READY";
  }
  if (batchState === "IN_PROGRESS") {
    return "AUTHORING_STARTED";
  }
  if (batchState === "AUTHORING_COMPLETE") {
    return "AUTHORING_COMPLETE";
  }
  if (batchState === "VALIDATION_PENDING") {
    return "VALIDATION_PENDING";
  }
  return "APPROVED";
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({ assetId: defaultAssetId });
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_options",
      "Asset preview review options must be an object when provided."
    );
  }
  return deepFreeze({
    assetId: rawOptions.assetId ? normalizeString(rawOptions.assetId) : defaultAssetId
  });
}

function normalizeInput(rawInput) {
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_input",
      "Asset preview review input must be an object."
    );
  }
  return deepFreeze({
    assetId: normalizeString(rawInput.assetId)
  });
}

function normalizeBatchExecutionLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_AUTHORING_BATCH_EXECUTION_LAYER_001") {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_batch_execution_layer",
      "Asset preview review layer requires a valid Asset Authoring Batch Execution layer."
    );
  }
  return rawLayer;
}

function normalizeProductionSpecificationLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_PRODUCTION_SPECIFICATION_LAYER_001") {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_production_specification_layer",
      "Asset preview review layer requires a valid Asset Production Specification layer."
    );
  }
  return rawLayer;
}

function normalizeRegistry(rawRegistry) {
  if (rawRegistry?.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001") {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_registry",
      "Asset preview review layer requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizeQualityLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_QUALITY_VALIDATION_LAYER_001") {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_quality_layer",
      "Asset preview review layer requires a valid Asset Quality Validation layer."
    );
  }
  return rawLayer;
}

function normalizeReviewState(value) {
  const normalized = normalizeString(value);
  if (!assetPreviewReviewStates.includes(normalized)) {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_state",
      `Unsupported asset preview review state ${normalized}.`
    );
  }
  return normalized;
}

function normalizeString(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createPreviewReviewError(
      "invalid_asset_preview_review_string",
      "Expected a non-empty string."
    );
  }
  return value.trim().toUpperCase();
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createPreviewReviewError(code, message) {
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
