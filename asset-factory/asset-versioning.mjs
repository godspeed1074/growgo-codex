import { createHash } from "node:crypto";

import {
  createAssetFactoryRegistryLayer,
  validateAssetFactoryRegistryLayer
} from "./asset-registry.mjs";
import {
  createAssetApprovalRegistrationLayer,
  validateAssetApprovalRecord
} from "./asset-approval-registration.mjs";
import {
  createAssetPublishingPipelineLayer,
  validateAssetPublishRecord
} from "./asset-publishing-pipeline.mjs";

export const assetVersioningLayerSchemaId = "ASSET_VERSIONING_LAYER_001";
export const assetVersionRecordSchemaId = "ASSET_VERSION_RECORD_001";
export const assetVersionValidationSchemaId = "ASSET_VERSION_VALIDATION_001";

export const assetVersionStates = deepFreeze([
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "PUBLISHED",
  "DEPRECATED"
]);

const allowedVersionTransitions = deepFreeze({
  DRAFT: deepFreeze(["REVIEW"]),
  REVIEW: deepFreeze(["APPROVED"]),
  APPROVED: deepFreeze(["PUBLISHED"]),
  PUBLISHED: deepFreeze(["DEPRECATED"]),
  DEPRECATED: deepFreeze([])
});

const defaultAssetId = "GROUND_BEACH_SAND_001";
const defaultChangeSummary = "Initial Asset Factory version record.";
const versionDate = "2026-07-27";

export function createAssetVersioningLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawApprovalLayer = createAssetApprovalRegistrationLayer(rawRegistry),
  rawPublishingLayer = createAssetPublishingPipelineLayer(rawRegistry, rawApprovalLayer)
) {
  const registry = normalizeRegistry(rawRegistry);
  const approvalLayer = normalizeApprovalLayer(rawApprovalLayer);
  const publishingLayer = normalizePublishingLayer(rawPublishingLayer);

  const layer = deepFreeze({
    schemaId: assetVersioningLayerSchemaId,
    layerId: "ASSET_VERSIONING_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    approvalLayerId: approvalLayer.layerId,
    publishingLayerId: publishingLayer.layerId,
    versionStates: assetVersionStates,
    createVersionRecord(rawInput = {}) {
      return createVersionRecord(rawInput, registry, approvalLayer, publishingLayer);
    },
    advanceVersionRecord(rawRecord, targetState) {
      return advanceVersionRecord(rawRecord, targetState);
    }
  });

  const checked = validateAssetVersioningLayer(layer);
  if (!checked.ok) {
    throw createVersioningError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetVersioningLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetVersioningLayerSchemaId) {
      throw createVersioningError(
        "invalid_asset_versioning_layer_schema",
        `Expected ${assetVersioningLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.versionStates) || rawLayer.versionStates.length === 0) {
      throw createVersioningError(
        "invalid_asset_versioning_states",
        "Asset versioning layer must expose non-empty version states."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetVersioningLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_versioning_layer_validation_failed",
      message: error.message,
      assetVersioningLayer: null
    });
  }
}

export function validateAssetVersionRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetVersionRecordSchemaId) {
      throw createVersioningError(
        "invalid_asset_version_record_schema",
        `Expected ${assetVersionRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetVersionValidationSchemaId) {
      throw createVersioningError(
        "invalid_asset_version_validation_schema",
        `Expected ${assetVersionValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!assetVersionStates.includes(rawRecord.versionState)) {
      throw createVersioningError(
        "invalid_asset_version_state",
        `Unsupported asset version state ${rawRecord.versionState}.`
      );
    }

    for (const key of [
      "versionSequenceValid",
      "assetReferenceValid",
      "approvalLinked",
      "publishLinked",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createVersioningError(
          "asset_version_record_validation_failed",
          `Asset version validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildVersionSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicVersionHash) {
      throw createVersioningError(
        "asset_version_hash_mismatch",
        "Asset version record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetVersionRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_version_record_validation_failed",
      message: error.message,
      assetVersionRecord: null
    });
  }
}

function createVersionRecord(rawInput, registry, approvalLayer, publishingLayer) {
  const input = normalizeVersionInput(rawInput);
  const assetRecord = registry.getAssetById(input.assetId);
  if (!assetRecord) {
    throw createVersioningError(
      "missing_asset_version_registry_record",
      `Asset ${input.assetId} is not registered in the Asset Factory registry.`
    );
  }

  const approvalRecord = input.approvalRecord ?? buildDefaultApprovalRecord(input.assetId, approvalLayer);
  const publishRecord = input.publishRecord ?? buildDefaultPublishRecord(input.assetId, publishingLayer);

  const versionNumber = deriveVersionNumber(input, assetRecord);
  const parentVersion = input.parentVersion ?? deriveParentVersion(versionNumber);
  const versionState = deriveInitialVersionState(approvalRecord, publishRecord);
  const activeStatus = versionState === "PUBLISHED";

  const recordBase = deepFreeze({
    schemaId: assetVersionRecordSchemaId,
    versionRecordId: `ASSET_VERSION_${normalizeSlug(input.assetId)}_${versionNumber.replace(/\./g, "_")}`,
    assetId: input.assetId,
    versionNumber,
    parentVersion,
    changeSummary: input.changeSummary ?? defaultChangeSummary,
    approvalReference: deepFreeze({
      approvalRecordId: approvalRecord.approvalRecordId,
      approvalStatus: approvalRecord.approvalStatus,
      version: approvalRecord.version
    }),
    publishReference: deepFreeze({
      publishRecordId: publishRecord.publishRecordId,
      publishStatus: publishRecord.publishStatus,
      version: publishRecord.version
    }),
    activeStatus,
    versionState,
    lifecycleHistory: deepFreeze([versionState]),
    createdTimestamp: versionDate,
    validation: null
  });

  const validation = buildVersionValidation(recordBase, assetRecord, approvalRecord, publishRecord);
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetVersionRecord(record);
  if (!checked.ok) {
    throw createVersioningError(checked.errorCode, checked.message);
  }

  return record;
}

function advanceVersionRecord(rawRecord, targetState) {
  const checked = validateAssetVersionRecord(rawRecord);
  if (!checked.ok) {
    throw createVersioningError(checked.errorCode, checked.message);
  }

  const normalizedTargetState = normalizeVersionState(targetState);
  if (!allowedVersionTransitions[rawRecord.versionState].includes(normalizedTargetState)) {
    throw createVersioningError(
      "invalid_asset_version_state_transition",
      `Cannot transition asset version record from ${rawRecord.versionState} to ${normalizedTargetState}.`
    );
  }

  const advancedBase = deepFreeze({
    ...rawRecord,
    versionState: normalizedTargetState,
    activeStatus: normalizedTargetState === "PUBLISHED",
    publishReference: deepFreeze({
      ...rawRecord.publishReference,
      publishStatus:
        normalizedTargetState === "PUBLISHED"
          ? "PUBLISHED"
          : normalizedTargetState === "DEPRECATED"
            ? "RETIRED"
            : rawRecord.publishReference.publishStatus
    }),
    lifecycleHistory: deepFreeze([...rawRecord.lifecycleHistory, normalizedTargetState]),
    validation: null
  });

  const assetRecord = deepFreeze({
    assetId: rawRecord.assetId,
    version: rawRecord.versionNumber
  });
  const approvalRecord = deepFreeze({
    approvalRecordId: rawRecord.approvalReference.approvalRecordId,
    approvalStatus:
      normalizedTargetState === "DRAFT" || normalizedTargetState === "REVIEW"
        ? "PENDING_REVIEW"
        : "ACTIVE",
    version: rawRecord.approvalReference.version
  });
  const publishRecord = deepFreeze({
    publishRecordId: rawRecord.publishReference.publishRecordId,
    publishStatus: advancedBase.publishReference.publishStatus,
    version: rawRecord.publishReference.version
  });

  const validation = buildVersionValidation(advancedBase, assetRecord, approvalRecord, publishRecord);
  const advanced = deepFreeze({
    ...advancedBase,
    validation
  });

  const validated = validateAssetVersionRecord(advanced);
  if (!validated.ok) {
    throw createVersioningError(validated.errorCode, validated.message);
  }

  return advanced;
}

function buildDefaultApprovalRecord(assetId, approvalLayer) {
  const pending = approvalLayer.createApprovalRecord({ assetId });
  const approved = approvalLayer.advanceApprovalRecord(pending, "QUALITY_APPROVED");
  const registered = approvalLayer.advanceApprovalRecord(approved, "REGISTERED");
  return approvalLayer.advanceApprovalRecord(registered, "ACTIVE");
}

function buildDefaultPublishRecord(assetId, publishingLayer) {
  const ready = publishingLayer.createPublishRecord({ assetId });
  const publishing = publishingLayer.advancePublishRecord(ready, "PUBLISHING");
  return publishingLayer.advancePublishRecord(publishing, "PUBLISHED");
}

function deriveVersionNumber(input, assetRecord) {
  if (input.versionNumber) {
    return input.versionNumber;
  }

  if (input.parentVersion) {
    return incrementVersion(input.parentVersion);
  }

  return assetRecord.version;
}

function deriveParentVersion(versionNumber) {
  const parts = versionNumber.split(".").map((part) => Number(part));
  if (parts.length !== 3) {
    return null;
  }
  if (parts[2] === 0) {
    return null;
  }
  return `${parts[0]}.${parts[1]}.${parts[2] - 1}`;
}

function deriveInitialVersionState(approvalRecord, publishRecord) {
  if (publishRecord.publishStatus === "PUBLISHED") {
    return "PUBLISHED";
  }
  if (approvalRecord.approvalStatus === "ACTIVE") {
    return "APPROVED";
  }
  if (approvalRecord.approvalStatus === "QUALITY_APPROVED") {
    return "REVIEW";
  }
  return "DRAFT";
}

function buildVersionValidation(record, assetRecord, approvalRecord, publishRecord) {
  const versionSequenceValid = isVersionSequenceValid(record.versionNumber, record.parentVersion);
  const assetReferenceValid = Boolean(assetRecord?.assetId) && assetRecord.assetId === record.assetId;
  const approvalLinked =
    typeof record.approvalReference.approvalRecordId === "string" &&
    approvalRecord.approvalStatus !== "PENDING_REVIEW";
  const publishLinked =
    typeof record.publishReference.publishRecordId === "string" &&
    ["READY_TO_PUBLISH", "PUBLISHING", "PUBLISHED", "RETIRED"].includes(
      publishRecord.publishStatus
    );
  const deterministicOutput = true;
  const validationPassed =
    versionSequenceValid &&
    assetReferenceValid &&
    approvalLinked &&
    publishLinked &&
    deterministicOutput;

  return deepFreeze({
    schemaId: assetVersionValidationSchemaId,
    versionSequenceValid,
    assetReferenceValid,
    approvalLinked,
    publishLinked,
    deterministicOutput,
    validationPassed,
    deterministicVersionHash: computeDeterministicHash(buildVersionSignature(record))
  });
}

function isVersionSequenceValid(versionNumber, parentVersion) {
  if (!isVersionString(versionNumber)) {
    return false;
  }
  if (parentVersion == null) {
    return true;
  }
  if (!isVersionString(parentVersion)) {
    return false;
  }
  return incrementVersion(parentVersion) === versionNumber;
}

function incrementVersion(version) {
  if (!isVersionString(version)) {
    throw createVersioningError(
      "invalid_asset_version_increment_input",
      `Version ${version} is not a valid semantic version string.`
    );
  }
  const [major, minor, patch] = version.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function isVersionString(version) {
  return typeof version === "string" && /^[0-9]+\.[0-9]+\.[0-9]+$/.test(version);
}

function buildVersionSignature(record) {
  return [
    record.versionRecordId,
    record.assetId,
    record.versionNumber,
    record.parentVersion,
    record.changeSummary,
    record.approvalReference,
    record.publishReference,
    record.activeStatus,
    record.versionState,
    record.lifecycleHistory,
    record.createdTimestamp
  ];
}

function normalizeVersionInput(rawInput) {
  const input = asPlainObject(rawInput, "assetVersionInput");
  const assetId =
    input.publishRecord?.assetId ??
    input.approvalRecord?.assetId ??
    input.assetId ??
    defaultAssetId;

  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw createVersioningError(
      "invalid_asset_version_input",
      "Asset versioning requires assetId, publishRecord.assetId, or approvalRecord.assetId."
    );
  }

  return deepFreeze({
    assetId: assetId.trim(),
    versionNumber:
      typeof input.versionNumber === "string" && input.versionNumber.trim().length > 0
        ? input.versionNumber.trim()
        : null,
    parentVersion:
      typeof input.parentVersion === "string" && input.parentVersion.trim().length > 0
        ? input.parentVersion.trim()
        : null,
    changeSummary:
      typeof input.changeSummary === "string" && input.changeSummary.trim().length > 0
        ? input.changeSummary.trim()
        : null,
    approvalRecord: input.approvalRecord ?? null,
    publishRecord: input.publishRecord ?? null
  });
}

function normalizeRegistry(rawRegistry) {
  const checked = validateAssetFactoryRegistryLayer(rawRegistry);
  if (!checked.ok) {
    throw createVersioningError(checked.errorCode, checked.message);
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
    throw createVersioningError(
      "invalid_asset_versioning_approval_layer",
      "Asset versioning requires a valid approval registration layer."
    );
  }
  return rawLayer;
}

function normalizePublishingLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_PUBLISHING_PIPELINE_LAYER_001" ||
    typeof rawLayer.createPublishRecord !== "function" ||
    typeof rawLayer.advancePublishRecord !== "function"
  ) {
    throw createVersioningError(
      "invalid_asset_versioning_publishing_layer",
      "Asset versioning requires a valid publishing pipeline layer."
    );
  }
  return rawLayer;
}

function normalizeVersionState(value) {
  const normalized = normalizeStringValue(value, "versionState");
  if (!assetVersionStates.includes(normalized)) {
    throw createVersioningError(
      "invalid_asset_version_state_value",
      `Version state ${normalized} is not supported.`
    );
  }
  return normalized;
}

function normalizeStringValue(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createVersioningError(
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
    throw createVersioningError(
      `invalid_${label}`,
      `${label} must be an object when provided.`
    );
  }
  return value;
}

function createVersioningError(code, message) {
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
