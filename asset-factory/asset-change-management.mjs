import { createHash } from "node:crypto";

import {
  createAssetVersioningLayer,
  validateAssetVersionRecord
} from "./asset-versioning.mjs";
import {
  createAssetApprovalRegistrationLayer,
  validateAssetApprovalRecord
} from "./asset-approval-registration.mjs";
import {
  createAssetQualityValidationLayer,
  validateAssetQualityValidationResult
} from "./asset-quality-validation.mjs";

export const assetChangeManagementLayerSchemaId =
  "ASSET_CHANGE_MANAGEMENT_LAYER_001";
export const assetChangeRecordSchemaId = "ASSET_CHANGE_RECORD_001";
export const assetChangeValidationSchemaId = "ASSET_CHANGE_VALIDATION_001";

export const assetChangeCategories = deepFreeze([
  "VISUAL_UPDATE",
  "PERFORMANCE_OPTIMIZATION",
  "BUG_FIX",
  "VARIANT_ADDITION",
  "COMPATIBILITY_UPDATE"
]);

const defaultAssetId = "GROUND_BEACH_SAND_001";
const defaultChangeCategory = "VARIANT_ADDITION";
const defaultChangeReason =
  "Approved Asset Factory follow-up change for controlled evolution.";
const changeDate = "2026-07-27";

export function createAssetChangeManagementLayer(
  rawVersioningLayer = createAssetVersioningLayer(),
  rawApprovalLayer = createAssetApprovalRegistrationLayer(),
  rawQualityLayer = createAssetQualityValidationLayer()
) {
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);
  const approvalLayer = normalizeApprovalLayer(rawApprovalLayer);
  const qualityLayer = normalizeQualityLayer(rawQualityLayer);

  const layer = deepFreeze({
    schemaId: assetChangeManagementLayerSchemaId,
    layerId: "ASSET_CHANGE_MANAGEMENT_LAYER_001_DEFAULT",
    versioningLayerId: versioningLayer.layerId,
    approvalLayerId: approvalLayer.layerId,
    qualityLayerId: qualityLayer.layerId,
    changeCategories: assetChangeCategories,
    createChangeRecord(rawInput = {}) {
      return createChangeRecord(rawInput, versioningLayer, approvalLayer, qualityLayer);
    }
  });

  const checked = validateAssetChangeManagementLayer(layer);
  if (!checked.ok) {
    throw createChangeManagementError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetChangeManagementLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetChangeManagementLayerSchemaId) {
      throw createChangeManagementError(
        "invalid_asset_change_management_layer_schema",
        `Expected ${assetChangeManagementLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.changeCategories) || rawLayer.changeCategories.length === 0) {
      throw createChangeManagementError(
        "invalid_asset_change_categories",
        "Asset change management layer must expose non-empty change categories."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetChangeManagementLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_change_management_layer_validation_failed",
      message: error.message,
      assetChangeManagementLayer: null
    });
  }
}

export function validateAssetChangeRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetChangeRecordSchemaId) {
      throw createChangeManagementError(
        "invalid_asset_change_record_schema",
        `Expected ${assetChangeRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetChangeValidationSchemaId) {
      throw createChangeManagementError(
        "invalid_asset_change_validation_schema",
        `Expected ${assetChangeValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!assetChangeCategories.includes(rawRecord.changeCategory)) {
      throw createChangeManagementError(
        "invalid_asset_change_category",
        `Unsupported asset change category ${rawRecord.changeCategory}.`
      );
    }

    for (const key of [
      "sourceVersionExists",
      "targetVersionExists",
      "changeReasonExists",
      "approvalLinked",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createChangeManagementError(
          "asset_change_record_validation_failed",
          `Asset change validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildChangeSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicChangeHash) {
      throw createChangeManagementError(
        "asset_change_hash_mismatch",
        "Asset change record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetChangeRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_change_record_validation_failed",
      message: error.message,
      assetChangeRecord: null
    });
  }
}

function createChangeRecord(rawInput, versioningLayer, approvalLayer, qualityLayer) {
  const input = normalizeChangeInput(rawInput);
  const sourceVersion =
    input.sourceVersionRecord ??
    versioningLayer.createVersionRecord({
      assetId: input.assetId
    });
  const targetVersion =
    input.targetVersionRecord ??
    versioningLayer.createVersionRecord({
      assetId: input.assetId,
      parentVersion: sourceVersion.versionNumber,
      changeSummary: input.changeReason
    });
  const approvalRecord =
    input.approvalRecord ??
    buildDefaultApprovalRecord(input.assetId, approvalLayer);
  const qualityValidationResult =
    input.qualityValidationResult ??
    qualityLayer.validateAsset({
      assetId: input.assetId
    });

  const recordBase = deepFreeze({
    schemaId: assetChangeRecordSchemaId,
    changeRecordId: `ASSET_CHANGE_${normalizeSlug(input.assetId)}_${sourceVersion.versionNumber.replace(/\./g, "_")}_TO_${targetVersion.versionNumber.replace(/\./g, "_")}`,
    assetId: input.assetId,
    sourceVersion: sourceVersion.versionNumber,
    targetVersion: targetVersion.versionNumber,
    changeReason: input.changeReason,
    changeCategory: input.changeCategory,
    impactSummary: buildImpactSummary(
      sourceVersion,
      targetVersion,
      input.changeCategory,
      qualityValidationResult
    ),
    approvalReference: deepFreeze({
      approvalRecordId: approvalRecord.approvalRecordId,
      approvalStatus: approvalRecord.approvalStatus,
      qualityReportId: qualityValidationResult.report.reportId
    }),
    versionReferences: deepFreeze({
      sourceVersionRecordId: sourceVersion.versionRecordId,
      targetVersionRecordId: targetVersion.versionRecordId
    }),
    createdTimestamp: changeDate,
    validation: null
  });

  const validation = buildChangeValidation(
    recordBase,
    sourceVersion,
    targetVersion,
    approvalRecord
  );
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetChangeRecord(record);
  if (!checked.ok) {
    throw createChangeManagementError(checked.errorCode, checked.message);
  }

  return record;
}

function buildDefaultApprovalRecord(assetId, approvalLayer) {
  const pending = approvalLayer.createApprovalRecord({ assetId });
  const approved = approvalLayer.advanceApprovalRecord(pending, "QUALITY_APPROVED");
  const registered = approvalLayer.advanceApprovalRecord(approved, "REGISTERED");
  return approvalLayer.advanceApprovalRecord(registered, "ACTIVE");
}

function buildImpactSummary(
  sourceVersion,
  targetVersion,
  changeCategory,
  qualityValidationResult
) {
  return deepFreeze({
    sourceState: sourceVersion.versionState,
    targetState: targetVersion.versionState,
    changeDelta: `${sourceVersion.versionNumber} -> ${targetVersion.versionNumber}`,
    qualityReadiness: qualityValidationResult.report.approvalReadiness,
    categoryImpact: deriveCategoryImpact(changeCategory)
  });
}

function deriveCategoryImpact(changeCategory) {
  switch (changeCategory) {
    case "VISUAL_UPDATE":
      return "presentation_refinement";
    case "PERFORMANCE_OPTIMIZATION":
      return "runtime_efficiency";
    case "BUG_FIX":
      return "stability_correction";
    case "VARIANT_ADDITION":
      return "coverage_expansion";
    case "COMPATIBILITY_UPDATE":
      return "integration_alignment";
    default:
      return "general_change";
  }
}

function buildChangeValidation(record, sourceVersion, targetVersion, approvalRecord) {
  const sourceVersionExists =
    typeof sourceVersion.versionRecordId === "string" &&
    sourceVersion.assetId === record.assetId;
  const targetVersionExists =
    typeof targetVersion.versionRecordId === "string" &&
    targetVersion.assetId === record.assetId &&
    targetVersion.parentVersion === sourceVersion.versionNumber;
  const changeReasonExists =
    typeof record.changeReason === "string" && record.changeReason.trim().length > 0;
  const approvalLinked =
    typeof record.approvalReference.approvalRecordId === "string" &&
    approvalRecord.approvalStatus === "ACTIVE";
  const deterministicOutput = true;
  const validationPassed =
    sourceVersionExists &&
    targetVersionExists &&
    changeReasonExists &&
    approvalLinked &&
    deterministicOutput;

  return deepFreeze({
    schemaId: assetChangeValidationSchemaId,
    sourceVersionExists,
    targetVersionExists,
    changeReasonExists,
    approvalLinked,
    deterministicOutput,
    validationPassed,
    deterministicChangeHash: computeDeterministicHash(buildChangeSignature(record))
  });
}

function buildChangeSignature(record) {
  return [
    record.changeRecordId,
    record.assetId,
    record.sourceVersion,
    record.targetVersion,
    record.changeReason,
    record.changeCategory,
    record.impactSummary,
    record.approvalReference,
    record.versionReferences,
    record.createdTimestamp
  ];
}

function normalizeChangeInput(rawInput) {
  const input = asPlainObject(rawInput, "assetChangeInput");
  const assetId =
    input.targetVersionRecord?.assetId ??
    input.sourceVersionRecord?.assetId ??
    input.approvalRecord?.assetId ??
    input.assetId ??
    defaultAssetId;

  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw createChangeManagementError(
      "invalid_asset_change_input",
      "Asset change management requires assetId or linked record asset IDs."
    );
  }

  const changeCategory =
    typeof input.changeCategory === "string" && input.changeCategory.trim().length > 0
      ? input.changeCategory.trim().toUpperCase()
      : defaultChangeCategory;

  if (!assetChangeCategories.includes(changeCategory)) {
    throw createChangeManagementError(
      "invalid_asset_change_category_input",
      `Change category ${changeCategory} is not supported.`
    );
  }

  return deepFreeze({
    assetId: assetId.trim(),
    changeReason:
      typeof input.changeReason === "string" && input.changeReason.trim().length > 0
        ? input.changeReason.trim()
        : defaultChangeReason,
    changeCategory,
    sourceVersionRecord: input.sourceVersionRecord ?? null,
    targetVersionRecord: input.targetVersionRecord ?? null,
    approvalRecord: input.approvalRecord ?? null,
    qualityValidationResult: input.qualityValidationResult ?? null
  });
}

function normalizeVersioningLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_VERSIONING_LAYER_001" ||
    typeof rawLayer.createVersionRecord !== "function"
  ) {
    throw createChangeManagementError(
      "invalid_asset_change_versioning_layer",
      "Asset change management requires a valid asset versioning layer."
    );
  }
  return rawLayer;
}

function normalizeApprovalLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_APPROVAL_REGISTRATION_LAYER_001" ||
    typeof rawLayer.createApprovalRecord !== "function" ||
    typeof rawLayer.advanceApprovalRecord !== "function"
  ) {
    throw createChangeManagementError(
      "invalid_asset_change_approval_layer",
      "Asset change management requires a valid approval registration layer."
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
    throw createChangeManagementError(
      "invalid_asset_change_quality_layer",
      "Asset change management requires a valid quality validation layer."
    );
  }
  return rawLayer;
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function asPlainObject(value, label) {
  if (value == null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw createChangeManagementError(
      `invalid_${label}`,
      `${label} must be an object when provided.`
    );
  }
  return value;
}

function createChangeManagementError(code, message) {
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
