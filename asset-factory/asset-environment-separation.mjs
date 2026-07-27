import { createHash } from "node:crypto";

import {
  createAssetApprovalRegistrationLayer,
  validateAssetApprovalRecord
} from "./asset-approval-registration.mjs";
import {
  createAssetPublishingPipelineLayer,
  validateAssetPublishRecord
} from "./asset-publishing-pipeline.mjs";
import {
  createAssetVersioningLayer,
  validateAssetVersionRecord
} from "./asset-versioning.mjs";
import {
  createAssetAuditTrailLayer,
  validateAssetAuditRecord
} from "./asset-audit-trail.mjs";

export const assetEnvironmentSeparationLayerSchemaId =
  "ASSET_ENVIRONMENT_SEPARATION_LAYER_001";
export const assetEnvironmentRecordSchemaId = "ASSET_ENVIRONMENT_RECORD_001";
export const assetEnvironmentValidationSchemaId =
  "ASSET_ENVIRONMENT_VALIDATION_001";

export const assetEnvironments = deepFreeze([
  "DEVELOPMENT",
  "TESTING",
  "APPROVAL",
  "PRODUCTION"
]);

export const assetEnvironmentPromotionRules = deepFreeze([
  "DEVELOPMENT_TO_TESTING",
  "TESTING_TO_APPROVAL",
  "APPROVAL_TO_PRODUCTION"
]);

const environmentOrder = deepFreeze({
  DEVELOPMENT: 0,
  TESTING: 1,
  APPROVAL: 2,
  PRODUCTION: 3
});

const allowedEnvironmentTransitions = deepFreeze({
  DEVELOPMENT: deepFreeze(["TESTING"]),
  TESTING: deepFreeze(["APPROVAL"]),
  APPROVAL: deepFreeze(["PRODUCTION"]),
  PRODUCTION: deepFreeze([])
});

const defaultAssetId = "GROUND_BEACH_SAND_001";
const environmentDate = "2026-07-27T00:00:00.000Z";

export function createAssetEnvironmentSeparationLayer(
  rawApprovalLayer = createAssetApprovalRegistrationLayer(),
  rawPublishingLayer = createAssetPublishingPipelineLayer(),
  rawVersioningLayer = createAssetVersioningLayer(),
  rawAuditLayer = createAssetAuditTrailLayer()
) {
  const approvalLayer = normalizeApprovalLayer(rawApprovalLayer);
  const publishingLayer = normalizePublishingLayer(rawPublishingLayer);
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);
  const auditLayer = normalizeAuditLayer(rawAuditLayer);

  const layer = deepFreeze({
    schemaId: assetEnvironmentSeparationLayerSchemaId,
    layerId: "ASSET_ENVIRONMENT_SEPARATION_LAYER_001_DEFAULT",
    approvalLayerId: approvalLayer.layerId,
    publishingLayerId: publishingLayer.layerId,
    versioningLayerId: versioningLayer.layerId,
    auditLayerId: auditLayer.layerId,
    environments: assetEnvironments,
    promotionRules: assetEnvironmentPromotionRules,
    createEnvironmentRecord(rawInput = {}) {
      return createEnvironmentRecord(
        rawInput,
        approvalLayer,
        publishingLayer,
        versioningLayer,
        auditLayer
      );
    },
    promoteEnvironmentRecord(rawRecord, targetEnvironment) {
      return promoteEnvironmentRecord(
        rawRecord,
        targetEnvironment,
        approvalLayer,
        publishingLayer,
        versioningLayer,
        auditLayer
      );
    }
  });

  const checked = validateAssetEnvironmentSeparationLayer(layer);
  if (!checked.ok) {
    throw createEnvironmentError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetEnvironmentSeparationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetEnvironmentSeparationLayerSchemaId) {
      throw createEnvironmentError(
        "invalid_asset_environment_separation_layer_schema",
        `Expected ${assetEnvironmentSeparationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    for (const key of ["createEnvironmentRecord", "promoteEnvironmentRecord"]) {
      if (typeof rawLayer[key] !== "function") {
        throw createEnvironmentError(
          "invalid_asset_environment_separation_layer_api",
          `Asset environment separation layer must expose ${key}.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetEnvironmentSeparationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_environment_separation_layer_validation_failed",
      message: error.message,
      assetEnvironmentSeparationLayer: null
    });
  }
}

export function validateAssetEnvironmentRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetEnvironmentRecordSchemaId) {
      throw createEnvironmentError(
        "invalid_asset_environment_record_schema",
        `Expected ${assetEnvironmentRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (!assetEnvironments.includes(rawRecord.currentEnvironment)) {
      throw createEnvironmentError(
        "invalid_asset_environment_current",
        `Unsupported environment ${rawRecord.currentEnvironment}.`
      );
    }

    if (
      rawRecord.previousEnvironment !== null &&
      !assetEnvironments.includes(rawRecord.previousEnvironment)
    ) {
      throw createEnvironmentError(
        "invalid_asset_environment_previous",
        `Unsupported previous environment ${rawRecord.previousEnvironment}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetEnvironmentValidationSchemaId) {
      throw createEnvironmentError(
        "invalid_asset_environment_validation_schema",
        `Expected ${assetEnvironmentValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    for (const key of [
      "promotionAllowed",
      "approvalStateValid",
      "publishStateValid",
      "noEnvironmentBypass",
      "deterministicTransitions",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createEnvironmentError(
          "asset_environment_record_validation_failed",
          `Asset environment validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildEnvironmentSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicTransitionHash) {
      throw createEnvironmentError(
        "asset_environment_hash_mismatch",
        "Asset environment record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetEnvironmentRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_environment_record_validation_failed",
      message: error.message,
      assetEnvironmentRecord: null
    });
  }
}

function createEnvironmentRecord(
  rawInput,
  approvalLayer,
  publishingLayer,
  versioningLayer,
  auditLayer
) {
  const input = normalizeEnvironmentInput(rawInput);
  const approvalRecord =
    input.approvalRecord ?? buildDefaultApprovalRecord(input.assetId, approvalLayer);
  const publishRecord =
    input.publishRecord ?? buildDefaultPublishRecord(input.assetId, publishingLayer);
  const versionRecord =
    input.versionRecord ??
    versioningLayer.createVersionRecord({
      assetId: input.assetId
    });
  const auditRecords = input.auditRecords ?? buildDefaultAuditRecords(input.assetId, auditLayer);

  validateSourceRecords(approvalRecord, publishRecord, versionRecord, auditRecords);

  const currentEnvironment =
    input.currentEnvironment ??
    deriveCurrentEnvironment(approvalRecord, publishRecord, versionRecord, auditRecords);
  const previousEnvironment = derivePreviousEnvironment(currentEnvironment, input.transitionHistory);
  const promotionStatus =
    input.promotionStatus ?? derivePromotionStatus(currentEnvironment, publishRecord);
  const transitionHistory =
    input.transitionHistory ??
    buildTransitionHistory(currentEnvironment, previousEnvironment, approvalRecord, publishRecord);

  const recordBase = deepFreeze({
    schemaId: assetEnvironmentRecordSchemaId,
    environmentRecordId: `ASSET_ENVIRONMENT_${normalizeSlug(input.assetId)}`,
    assetId: input.assetId,
    currentEnvironment,
    previousEnvironment,
    promotionStatus,
    validationStatus: "PENDING_VALIDATION",
    transitionHistory,
    sourceReferences: deepFreeze({
      approvalRecordId: approvalRecord.approvalRecordId,
      publishRecordId: publishRecord.publishRecordId,
      versionRecordId: versionRecord.versionRecordId,
      auditEventIds: deepFreeze(auditRecords.map((record) => record.eventId))
    }),
    validation: null
  });

  const validation = buildEnvironmentValidation(
    recordBase,
    approvalRecord,
    publishRecord,
    transitionHistory
  );
  const record = deepFreeze({
    ...recordBase,
    validationStatus: validation.validationPassed ? "VALID" : "INVALID",
    validation
  });

  const checked = validateAssetEnvironmentRecord(record);
  if (!checked.ok) {
    throw createEnvironmentError(checked.errorCode, checked.message);
  }

  return record;
}

function promoteEnvironmentRecord(
  rawRecord,
  targetEnvironment,
  approvalLayer,
  publishingLayer,
  versioningLayer,
  auditLayer
) {
  const checked = validateAssetEnvironmentRecord(rawRecord);
  if (!checked.ok) {
    throw createEnvironmentError(checked.errorCode, checked.message);
  }

  const normalizedTargetEnvironment = normalizeEnvironment(targetEnvironment, "targetEnvironment");
  if (!allowedEnvironmentTransitions[rawRecord.currentEnvironment].includes(normalizedTargetEnvironment)) {
    throw createEnvironmentError(
      "invalid_asset_environment_transition",
      `Cannot transition asset environment record from ${rawRecord.currentEnvironment} to ${normalizedTargetEnvironment}.`
    );
  }

  const approvalRecord = buildPromotionApprovalRecord(
    rawRecord.assetId,
    normalizedTargetEnvironment,
    approvalLayer
  );
  const publishRecord = buildPromotionPublishRecord(
    rawRecord.assetId,
    normalizedTargetEnvironment,
    publishingLayer
  );
  const versionRecord = versioningLayer.createVersionRecord({
    assetId: rawRecord.assetId,
    approvalRecord,
    publishRecord
  });
  const auditRecords = buildPromotionAuditRecords(rawRecord, normalizedTargetEnvironment, auditLayer);

  return createEnvironmentRecord(
    {
      assetId: rawRecord.assetId,
      approvalRecord,
      publishRecord,
      versionRecord,
      auditRecords,
      currentEnvironment: normalizedTargetEnvironment,
      promotionStatus: "PROMOTED",
      transitionHistory: deepFreeze([
        ...rawRecord.transitionHistory,
        createTransitionEntry(
          rawRecord.currentEnvironment,
          normalizedTargetEnvironment,
          ruleForTransition(rawRecord.currentEnvironment, normalizedTargetEnvironment),
          transitionTimestamp(rawRecord.transitionHistory.length + 1)
        )
      ])
    },
    approvalLayer,
    publishingLayer,
    versioningLayer,
    auditLayer
  );
}

function buildDefaultApprovalRecord(assetId, approvalLayer) {
  const pending = approvalLayer.createApprovalRecord({ assetId });
  const approved = approvalLayer.advanceApprovalRecord(pending, "QUALITY_APPROVED");
  const registered = approvalLayer.advanceApprovalRecord(approved, "REGISTERED");
  return approvalLayer.advanceApprovalRecord(registered, "ACTIVE");
}

function buildDefaultPublishRecord(assetId, publishingLayer) {
  return publishingLayer.createPublishRecord({ assetId });
}

function buildDefaultAuditRecords(assetId, auditLayer) {
  let records = [];
  for (const eventType of [
    "ASSET_CREATED",
    "ASSET_VALIDATED",
    "ASSET_APPROVED"
  ]) {
    records = auditLayer.appendAuditRecord(records, { assetId, eventType });
  }
  return records;
}

function buildPromotionApprovalRecord(assetId, targetEnvironment, approvalLayer) {
  const pending = approvalLayer.createApprovalRecord({ assetId });
  if (targetEnvironment === "TESTING") {
    return pending;
  }
  const approved = approvalLayer.advanceApprovalRecord(pending, "QUALITY_APPROVED");
  if (targetEnvironment === "APPROVAL") {
    return approved;
  }
  const registered = approvalLayer.advanceApprovalRecord(approved, "REGISTERED");
  return approvalLayer.advanceApprovalRecord(registered, "ACTIVE");
}

function buildPromotionPublishRecord(assetId, targetEnvironment, publishingLayer) {
  const ready = publishingLayer.createPublishRecord({ assetId });
  if (targetEnvironment !== "PRODUCTION") {
    return ready;
  }
  const publishing = publishingLayer.advancePublishRecord(ready, "PUBLISHING");
  return publishingLayer.advancePublishRecord(publishing, "PUBLISHED");
}

function buildPromotionAuditRecords(rawRecord, targetEnvironment, auditLayer) {
  const eventType =
    targetEnvironment === "TESTING"
      ? "ASSET_VALIDATED"
      : targetEnvironment === "APPROVAL"
        ? "ASSET_APPROVED"
        : "ASSET_PUBLISHED";
  let records = buildDefaultAuditRecords(rawRecord.assetId, auditLayer);
  return auditLayer.appendAuditRecord(records, {
    assetId: rawRecord.assetId,
    eventType
  });
}

function validateSourceRecords(approvalRecord, publishRecord, versionRecord, auditRecords) {
  const checks = [
    validateAssetApprovalRecord(approvalRecord),
    validateAssetPublishRecord(publishRecord),
    validateAssetVersionRecord(versionRecord)
  ];
  for (const auditRecord of auditRecords) {
    checks.push(validateAssetAuditRecord(auditRecord));
  }
  if (!checks.every((check) => check.ok)) {
    const failed = checks.find((check) => !check.ok);
    throw createEnvironmentError(failed.errorCode, failed.message);
  }
}

function deriveCurrentEnvironment(approvalRecord, publishRecord, versionRecord, auditRecords) {
  if (publishRecord.publishStatus === "PUBLISHED" || publishRecord.publishStatus === "RETIRED") {
    return "PRODUCTION";
  }
  if (
    ["READY_TO_PUBLISH", "PUBLISHING"].includes(publishRecord.publishStatus) ||
    ["QUALITY_APPROVED", "REGISTERED", "ACTIVE"].includes(approvalRecord.approvalStatus)
  ) {
    return "APPROVAL";
  }
  if (
    approvalRecord.approvalStatus === "PENDING_REVIEW" ||
    auditRecords.some((record) => record.eventType === "ASSET_VALIDATED") ||
    ["REVIEW", "APPROVED"].includes(versionRecord.versionState)
  ) {
    return "TESTING";
  }
  return "DEVELOPMENT";
}

function derivePreviousEnvironment(currentEnvironment, transitionHistory = null) {
  if (Array.isArray(transitionHistory) && transitionHistory.length > 0) {
    const latestTransition = transitionHistory.at(-1);
    if (latestTransition.toEnvironment === currentEnvironment) {
      return latestTransition.fromEnvironment === "ORIGIN"
        ? null
        : latestTransition.fromEnvironment;
    }
    return latestTransition.toEnvironment;
  }
  switch (currentEnvironment) {
    case "TESTING":
      return "DEVELOPMENT";
    case "APPROVAL":
      return "TESTING";
    case "PRODUCTION":
      return "APPROVAL";
    default:
      return null;
  }
}

function derivePromotionStatus(currentEnvironment, publishRecord) {
  if (currentEnvironment === "PRODUCTION" && publishRecord.publishStatus === "PUBLISHED") {
    return "STABLE";
  }
  if (currentEnvironment === "APPROVAL") {
    return "READY_FOR_PROMOTION";
  }
  if (currentEnvironment === "TESTING") {
    return "UNDER_VALIDATION";
  }
  return "IN_DEVELOPMENT";
}

function buildTransitionHistory(currentEnvironment, previousEnvironment, approvalRecord, publishRecord) {
  if (previousEnvironment === null) {
    return deepFreeze([
      createTransitionEntry(
        "ORIGIN",
        currentEnvironment,
        "INITIAL_PLACEMENT",
        transitionTimestamp(0)
      )
    ]);
  }

  return deepFreeze([
    createTransitionEntry(
      previousEnvironment,
      currentEnvironment,
      ruleForTransition(previousEnvironment, currentEnvironment),
      transitionTimestamp(0),
      approvalRecord.approvalStatus,
      publishRecord.publishStatus
    )
  ]);
}

function createTransitionEntry(
  fromEnvironment,
  toEnvironment,
  promotionRule,
  timestamp,
  approvalStatus = null,
  publishStatus = null
) {
  return deepFreeze({
    fromEnvironment,
    toEnvironment,
    promotionRule,
    timestamp,
    approvalStatus,
    publishStatus
  });
}

function buildEnvironmentValidation(record, approvalRecord, publishRecord, transitionHistory) {
  const promotionAllowed = isPromotionAllowed(
    record.previousEnvironment,
    record.currentEnvironment,
    approvalRecord,
    publishRecord
  );
  const approvalStateValid = isApprovalStateValid(record.currentEnvironment, approvalRecord);
  const publishStateValid = isPublishStateValid(record.currentEnvironment, publishRecord);
  const noEnvironmentBypass = hasNoEnvironmentBypass(transitionHistory);
  const deterministicTransitions = true;
  const validationPassed =
    promotionAllowed &&
    approvalStateValid &&
    publishStateValid &&
    noEnvironmentBypass &&
    deterministicTransitions;

  return deepFreeze({
    schemaId: assetEnvironmentValidationSchemaId,
    promotionAllowed,
    approvalStateValid,
    publishStateValid,
    noEnvironmentBypass,
    deterministicTransitions,
    validationPassed,
    deterministicTransitionHash: computeDeterministicHash(buildEnvironmentSignature(record))
  });
}

function isPromotionAllowed(previousEnvironment, currentEnvironment, approvalRecord, publishRecord) {
  if (previousEnvironment === null || previousEnvironment === "ORIGIN") {
    return true;
  }

  if (!allowedEnvironmentTransitions[previousEnvironment].includes(currentEnvironment)) {
    return false;
  }

  if (previousEnvironment === "DEVELOPMENT" && currentEnvironment === "TESTING") {
    return true;
  }
  if (previousEnvironment === "TESTING" && currentEnvironment === "APPROVAL") {
    return ["QUALITY_APPROVED", "REGISTERED", "ACTIVE"].includes(approvalRecord.approvalStatus);
  }
  if (previousEnvironment === "APPROVAL" && currentEnvironment === "PRODUCTION") {
    return (
      approvalRecord.approvalStatus === "ACTIVE" &&
      publishRecord.publishStatus === "PUBLISHED"
    );
  }

  return false;
}

function isApprovalStateValid(currentEnvironment, approvalRecord) {
  if (currentEnvironment === "DEVELOPMENT") {
    return true;
  }
  if (currentEnvironment === "TESTING") {
    return approvalRecord.approvalStatus === "PENDING_REVIEW";
  }
  if (currentEnvironment === "APPROVAL") {
    return ["QUALITY_APPROVED", "REGISTERED", "ACTIVE"].includes(approvalRecord.approvalStatus);
  }
  return approvalRecord.approvalStatus === "ACTIVE";
}

function isPublishStateValid(currentEnvironment, publishRecord) {
  if (currentEnvironment === "PRODUCTION") {
    return publishRecord.publishStatus === "PUBLISHED";
  }
  if (currentEnvironment === "APPROVAL") {
    return ["READY_TO_PUBLISH", "PUBLISHING"].includes(publishRecord.publishStatus);
  }
  return true;
}

function hasNoEnvironmentBypass(transitionHistory) {
  for (const transition of transitionHistory) {
    if (transition.fromEnvironment === "ORIGIN") {
      continue;
    }
    const fromOrder = environmentOrder[transition.fromEnvironment];
    const toOrder = environmentOrder[transition.toEnvironment];
    if (typeof fromOrder !== "number" || typeof toOrder !== "number") {
      return false;
    }
    if (toOrder - fromOrder !== 1) {
      return false;
    }
  }
  return true;
}

function ruleForTransition(previousEnvironment, currentEnvironment) {
  if (previousEnvironment === "DEVELOPMENT" && currentEnvironment === "TESTING") {
    return "DEVELOPMENT_TO_TESTING";
  }
  if (previousEnvironment === "TESTING" && currentEnvironment === "APPROVAL") {
    return "TESTING_TO_APPROVAL";
  }
  if (previousEnvironment === "APPROVAL" && currentEnvironment === "PRODUCTION") {
    return "APPROVAL_TO_PRODUCTION";
  }
  return "INITIAL_PLACEMENT";
}

function transitionTimestamp(index) {
  const date = new Date(environmentDate);
  date.setUTCMinutes(date.getUTCMinutes() + index);
  return date.toISOString();
}

function buildEnvironmentSignature(record) {
  return [
    record.environmentRecordId,
    record.assetId,
    record.currentEnvironment,
    record.previousEnvironment,
    record.promotionStatus,
    record.transitionHistory,
    record.sourceReferences
  ];
}

function normalizeEnvironmentInput(rawInput) {
  const input = asPlainObject(rawInput, "assetEnvironmentInput");
  const assetId =
    input.versionRecord?.assetId ??
    input.publishRecord?.assetId ??
    input.approvalRecord?.assetId ??
    input.assetId ??
    defaultAssetId;

  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw createEnvironmentError(
      "invalid_asset_environment_input",
      "Asset environment separation requires assetId or linked lifecycle records."
    );
  }

  return deepFreeze({
    assetId: assetId.trim(),
    approvalRecord: input.approvalRecord ?? null,
    publishRecord: input.publishRecord ?? null,
    versionRecord: input.versionRecord ?? null,
    auditRecords: input.auditRecords ?? null,
    currentEnvironment:
      typeof input.currentEnvironment === "string" && input.currentEnvironment.trim().length > 0
        ? normalizeEnvironment(input.currentEnvironment, "currentEnvironment")
        : null,
    promotionStatus:
      typeof input.promotionStatus === "string" && input.promotionStatus.trim().length > 0
        ? input.promotionStatus.trim().toUpperCase()
        : null,
    transitionHistory: Array.isArray(input.transitionHistory)
      ? deepFreeze([...input.transitionHistory])
      : null
  });
}

function normalizeApprovalLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_APPROVAL_REGISTRATION_LAYER_001" ||
    typeof rawLayer.createApprovalRecord !== "function" ||
    typeof rawLayer.advanceApprovalRecord !== "function"
  ) {
    throw createEnvironmentError(
      "invalid_asset_environment_approval_layer",
      "Asset environment separation requires a valid approval layer."
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
    throw createEnvironmentError(
      "invalid_asset_environment_publishing_layer",
      "Asset environment separation requires a valid publishing layer."
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
    throw createEnvironmentError(
      "invalid_asset_environment_versioning_layer",
      "Asset environment separation requires a valid versioning layer."
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
    throw createEnvironmentError(
      "invalid_asset_environment_audit_layer",
      "Asset environment separation requires a valid audit layer."
    );
  }
  return rawLayer;
}

function normalizeEnvironment(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createEnvironmentError(`invalid_${label}`, `${label} must be a non-empty string.`);
  }
  const normalized = value.trim().toUpperCase();
  if (!assetEnvironments.includes(normalized)) {
    throw createEnvironmentError(
      `invalid_${label}`,
      `Environment ${normalized} is not supported.`
    );
  }
  return normalized;
}

function asPlainObject(value, label) {
  if (value == null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw createEnvironmentError(
      `invalid_${label}`,
      `${label} must be an object when provided.`
    );
  }
  return value;
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createEnvironmentError(code, message) {
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
