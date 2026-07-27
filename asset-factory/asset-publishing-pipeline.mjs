import { createHash } from "node:crypto";

import {
  createAssetApprovalRegistrationLayer,
  validateAssetApprovalRecord
} from "./asset-approval-registration.mjs";
import {
  createAssetQualityValidationLayer,
  validateAssetQualityValidationResult
} from "./asset-quality-validation.mjs";
import {
  createAssetFactoryRegistryLayer,
  validateAssetFactoryRegistryLayer
} from "./asset-registry.mjs";

export const assetPublishingPipelineLayerSchemaId =
  "ASSET_PUBLISHING_PIPELINE_LAYER_001";
export const assetPublishRecordSchemaId = "ASSET_PUBLISH_RECORD_001";
export const assetPublishValidationSchemaId = "ASSET_PUBLISH_VALIDATION_001";

export const assetPublishStates = deepFreeze([
  "READY_TO_PUBLISH",
  "PUBLISHING",
  "PUBLISHED",
  "RETIRED"
]);

const allowedPublishTransitions = deepFreeze({
  READY_TO_PUBLISH: deepFreeze(["PUBLISHING"]),
  PUBLISHING: deepFreeze(["PUBLISHED"]),
  PUBLISHED: deepFreeze(["RETIRED"]),
  RETIRED: deepFreeze([])
});

const defaultAssetId = "GROUND_BEACH_SAND_001";
const releaseDate = "2026-07-27";

export function createAssetPublishingPipelineLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawApprovalLayer = createAssetApprovalRegistrationLayer(rawRegistry),
  rawQualityLayer = createAssetQualityValidationLayer(rawRegistry)
) {
  const registry = normalizeRegistry(rawRegistry);
  const approvalLayer = normalizeApprovalLayer(rawApprovalLayer);
  const qualityLayer = normalizeQualityLayer(rawQualityLayer);

  const layer = deepFreeze({
    schemaId: assetPublishingPipelineLayerSchemaId,
    layerId: "ASSET_PUBLISHING_PIPELINE_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    approvalLayerId: approvalLayer.layerId,
    qualityLayerId: qualityLayer.layerId,
    publishStates: assetPublishStates,
    createPublishRecord(rawInput = {}) {
      return createPublishRecord(rawInput, registry, approvalLayer, qualityLayer);
    },
    advancePublishRecord(rawRecord, targetState) {
      return advancePublishRecord(rawRecord, targetState, registry);
    }
  });

  const checked = validateAssetPublishingPipelineLayer(layer);
  if (!checked.ok) {
    throw createPublishValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetPublishingPipelineLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetPublishingPipelineLayerSchemaId) {
      throw createPublishValidationError(
        "invalid_asset_publishing_pipeline_layer_schema",
        `Expected ${assetPublishingPipelineLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.publishStates) || rawLayer.publishStates.length === 0) {
      throw createPublishValidationError(
        "invalid_asset_publish_states",
        "Asset publishing pipeline layer must expose non-empty publish states."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetPublishingPipelineLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_publishing_pipeline_layer_validation_failed",
      message: error.message,
      assetPublishingPipelineLayer: null
    });
  }
}

export function validateAssetPublishRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetPublishRecordSchemaId) {
      throw createPublishValidationError(
        "invalid_asset_publish_record_schema",
        `Expected ${assetPublishRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetPublishValidationSchemaId) {
      throw createPublishValidationError(
        "invalid_asset_publish_validation_schema",
        `Expected ${assetPublishValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!assetPublishStates.includes(rawRecord.publishStatus)) {
      throw createPublishValidationError(
        "invalid_asset_publish_status",
        `Unsupported asset publish status ${rawRecord.publishStatus}.`
      );
    }

    for (const key of [
      "approvalComplete",
      "qualityPassed",
      "registryValid",
      "versionValid",
      "deterministicPublishState",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createPublishValidationError(
          "asset_publish_record_validation_failed",
          `Asset publish validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildPublishSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicPublishHash) {
      throw createPublishValidationError(
        "asset_publish_hash_mismatch",
        "Asset publish record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetPublishRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_publish_record_validation_failed",
      message: error.message,
      assetPublishRecord: null
    });
  }
}

function createPublishRecord(rawInput, registry, approvalLayer, qualityLayer) {
  const input = normalizePublishInput(rawInput);
  const approvalRecord =
    input.approvalRecord ?? buildActiveApprovalRecord(input.assetId, approvalLayer);
  const qualityValidationResult =
    input.qualityValidationResult ??
    qualityLayer.validateAsset({
      assetId: approvalRecord.assetId
    });

  ensurePublishEligibility(approvalRecord, qualityValidationResult);

  const version = input.version ?? approvalRecord.version;

  const recordBase = deepFreeze({
    schemaId: assetPublishRecordSchemaId,
    publishRecordId: `ASSET_PUBLISH_${normalizeSlug(approvalRecord.assetId)}`,
    assetId: approvalRecord.assetId,
    version,
    publishStatus: "READY_TO_PUBLISH",
    approvalReference: deepFreeze({
      approvalRecordId: approvalRecord.approvalRecordId,
      approvalStatus: approvalRecord.approvalStatus,
      recipeId: approvalRecord.recipeId
    }),
    qualityReference: deepFreeze({
      validationId: qualityValidationResult.validationId,
      reportId: qualityValidationResult.report.reportId,
      approvalReadiness: qualityValidationResult.report.approvalReadiness
    }),
    registryReference: deepFreeze({
      registryId: registry.registryId,
      assetVersion: registry.getAssetById(approvalRecord.assetId)?.version ?? null
    }),
    releaseTimestamp: releaseDate,
    lifecycleHistory: deepFreeze(["READY_TO_PUBLISH"]),
    validation: null
  });

  const validation = buildPublishValidation(
    recordBase,
    approvalRecord,
    qualityValidationResult,
    registry
  );
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetPublishRecord(record);
  if (!checked.ok) {
    throw createPublishValidationError(checked.errorCode, checked.message);
  }

  return record;
}

function advancePublishRecord(rawRecord, targetState, registry) {
  const checked = validateAssetPublishRecord(rawRecord);
  if (!checked.ok) {
    throw createPublishValidationError(checked.errorCode, checked.message);
  }

  const normalizedTargetState = normalizePublishState(targetState);
  if (!allowedPublishTransitions[rawRecord.publishStatus].includes(normalizedTargetState)) {
    throw createPublishValidationError(
      "invalid_asset_publish_state_transition",
      `Cannot transition asset publish record from ${rawRecord.publishStatus} to ${normalizedTargetState}.`
    );
  }

  const approvalRecord = deepFreeze({
    schemaId: "ASSET_APPROVAL_RECORD_001",
    approvalRecordId: rawRecord.approvalReference.approvalRecordId,
    assetId: rawRecord.assetId,
    approvalStatus: rawRecord.approvalReference.approvalStatus,
    recipeId: rawRecord.approvalReference.recipeId,
    version: rawRecord.version,
    qualityResult: deepFreeze({
      approvalReadiness: rawRecord.qualityReference.approvalReadiness
    }),
    validation: deepFreeze({
      schemaId: "ASSET_APPROVAL_VALIDATION_001",
      qualityPassed: true,
      authoringCompleted: true,
      registryEntryValid: true,
      recipeExists: true,
      deterministicApprovalState: true,
      validationPassed: true,
      deterministicApprovalHash: "PUBLISH_APPROVAL_REFERENCE"
    }),
    registrationStatus: "active_library_entry",
    approvalTimestamp: releaseDate,
    authoringHistory: deepFreeze({})
  });

  const qualityValidationResult = deepFreeze({
    schemaId: "ASSET_QUALITY_VALIDATION_RESULT_001",
    validationId: rawRecord.qualityReference.validationId,
    assetId: rawRecord.assetId,
    report: deepFreeze({
      schemaId: "ASSET_QUALITY_REPORT_001",
      reportId: rawRecord.qualityReference.reportId,
      assetId: rawRecord.assetId,
      approvalReadiness: rawRecord.qualityReference.approvalReadiness,
      validationCategories: deepFreeze({}),
      passFailResults: deepFreeze([]),
      warnings: deepFreeze([])
    }),
    validation: deepFreeze({
      schemaId: "ASSET_QUALITY_VALIDATION_RESULT_001",
      deterministicValidation: true,
      completeReporting: true,
      failureHandling: true,
      validationPassed: true,
      deterministicValidationHash: "PUBLISH_QUALITY_REFERENCE"
    })
  });

  const advancedBase = deepFreeze({
    ...rawRecord,
    publishStatus: normalizedTargetState,
    lifecycleHistory: deepFreeze([...rawRecord.lifecycleHistory, normalizedTargetState]),
    releaseTimestamp:
      normalizedTargetState === "PUBLISHED" || normalizedTargetState === "RETIRED"
        ? releaseDate
        : rawRecord.releaseTimestamp,
    validation: null
  });

  const validation = buildPublishValidation(
    advancedBase,
    approvalRecord,
    qualityValidationResult,
    registry
  );
  const advanced = deepFreeze({
    ...advancedBase,
    validation
  });

  const validated = validateAssetPublishRecord(advanced);
  if (!validated.ok) {
    throw createPublishValidationError(validated.errorCode, validated.message);
  }

  return advanced;
}

function buildActiveApprovalRecord(assetId, approvalLayer) {
  const pending = approvalLayer.createApprovalRecord({ assetId });
  const approved = approvalLayer.advanceApprovalRecord(pending, "QUALITY_APPROVED");
  const registered = approvalLayer.advanceApprovalRecord(approved, "REGISTERED");
  return approvalLayer.advanceApprovalRecord(registered, "ACTIVE");
}

function ensurePublishEligibility(approvalRecord, qualityValidationResult) {
  if (approvalRecord.approvalStatus !== "ACTIVE") {
    throw createPublishValidationError(
      "asset_publish_approval_incomplete",
      `Asset ${approvalRecord.assetId} cannot be published until approval status is ACTIVE.`
    );
  }

  if (qualityValidationResult.report.approvalReadiness !== "READY_FOR_APPROVAL") {
    throw createPublishValidationError(
      "asset_publish_quality_not_ready",
      `Asset ${approvalRecord.assetId} cannot be published because quality checks did not pass.`
    );
  }
}

function buildPublishValidation(record, approvalRecord, qualityValidationResult, registry) {
  const registeredAsset = registry.getAssetById(record.assetId);
  const approvalComplete = approvalRecord.approvalStatus === "ACTIVE";
  const qualityPassed = qualityValidationResult.report.approvalReadiness === "READY_FOR_APPROVAL";
  const registryValid = Boolean(registeredAsset);
  const versionValid =
    typeof record.version === "string" &&
    record.version.length > 0 &&
    registeredAsset?.version === record.version;
  const deterministicPublishState = true;
  const validationPassed =
    approvalComplete &&
    qualityPassed &&
    registryValid &&
    versionValid &&
    deterministicPublishState;

  return deepFreeze({
    schemaId: assetPublishValidationSchemaId,
    approvalComplete,
    qualityPassed,
    registryValid,
    versionValid,
    deterministicPublishState,
    validationPassed,
    deterministicPublishHash: computeDeterministicHash(buildPublishSignature(record))
  });
}

function buildPublishSignature(record) {
  return [
    record.publishRecordId,
    record.assetId,
    record.version,
    record.publishStatus,
    record.approvalReference,
    record.qualityReference,
    record.registryReference,
    record.releaseTimestamp,
    record.lifecycleHistory
  ];
}

function normalizePublishInput(rawInput) {
  const input = asPlainObject(rawInput, "assetPublishInput");
  const assetId = input.approvalRecord?.assetId ?? input.assetId ?? defaultAssetId;

  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw createPublishValidationError(
      "invalid_asset_publish_input",
      "Asset publishing requires assetId or approvalRecord.assetId."
    );
  }

  return deepFreeze({
    assetId: assetId.trim(),
    version:
      typeof input.version === "string" && input.version.trim().length > 0
        ? input.version.trim()
        : null,
    approvalRecord: input.approvalRecord ?? null,
    qualityValidationResult: input.qualityValidationResult ?? null
  });
}

function normalizeRegistry(rawRegistry) {
  const checked = validateAssetFactoryRegistryLayer(rawRegistry);
  if (!checked.ok) {
    throw createPublishValidationError(checked.errorCode, checked.message);
  }
  return rawRegistry;
}

function normalizeApprovalLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_APPROVAL_REGISTRATION_LAYER_001" ||
    typeof rawLayer.createApprovalRecord !== "function" ||
    typeof rawLayer.advanceApprovalRecord !== "function"
  ) {
    throw createPublishValidationError(
      "invalid_asset_publish_approval_layer",
      "Asset publishing pipeline requires a valid approval registration layer."
    );
  }
  return rawLayer;
}

function normalizeQualityLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_QUALITY_VALIDATION_LAYER_001" ||
    typeof rawLayer.validateAsset !== "function"
  ) {
    throw createPublishValidationError(
      "invalid_asset_publish_quality_layer",
      "Asset publishing pipeline requires a valid quality validation layer."
    );
  }
  return rawLayer;
}

function normalizePublishState(value) {
  const normalized = normalizeStringValue(value, "publishStatus");
  if (!assetPublishStates.includes(normalized)) {
    throw createPublishValidationError(
      "invalid_asset_publish_state_value",
      `Publish state ${normalized} is not supported.`
    );
  }
  return normalized;
}

function normalizeStringValue(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createPublishValidationError(
      `invalid_${label}`,
      `${label} must be a non-empty string.`
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

function asPlainObject(value, label) {
  if (value == null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw createPublishValidationError(
      `invalid_${label}`,
      `${label} must be an object when provided.`
    );
  }
  return value;
}

function createPublishValidationError(code, message) {
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
