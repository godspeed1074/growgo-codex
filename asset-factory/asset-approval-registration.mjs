import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetAuthoringWorkflowLayer } from "./asset-authoring-workflow.mjs";
import { createAssetCreationSpecificationLayer } from "./asset-creation-specification.mjs";
import { createAssetQualityValidationLayer } from "./asset-quality-validation.mjs";

export const assetApprovalRegistrationLayerSchemaId =
  "ASSET_APPROVAL_REGISTRATION_LAYER_001";
export const assetApprovalRecordSchemaId = "ASSET_APPROVAL_RECORD_001";
export const assetApprovalValidationSchemaId = "ASSET_APPROVAL_VALIDATION_001";

export const assetApprovalStates = deepFreeze([
  "PENDING_REVIEW",
  "QUALITY_APPROVED",
  "REGISTERED",
  "ACTIVE"
]);

const allowedApprovalTransitions = deepFreeze({
  PENDING_REVIEW: deepFreeze(["QUALITY_APPROVED"]),
  QUALITY_APPROVED: deepFreeze(["REGISTERED"]),
  REGISTERED: deepFreeze(["ACTIVE"]),
  ACTIVE: deepFreeze([])
});

export function createAssetApprovalRegistrationLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawSpecificationLayer = createAssetCreationSpecificationLayer(rawRegistry),
  rawAuthoringWorkflow = createAssetAuthoringWorkflowLayer(rawRegistry, rawSpecificationLayer),
  rawQualityLayer = createAssetQualityValidationLayer(
    rawRegistry,
    rawSpecificationLayer,
    rawAuthoringWorkflow
  )
) {
  const registry = normalizeRegistry(rawRegistry);
  const specificationLayer = normalizeSpecificationLayer(rawSpecificationLayer);
  const authoringWorkflow = normalizeAuthoringWorkflow(rawAuthoringWorkflow);
  const qualityLayer = normalizeQualityLayer(rawQualityLayer);

  const layer = deepFreeze({
    schemaId: assetApprovalRegistrationLayerSchemaId,
    layerId: "ASSET_APPROVAL_REGISTRATION_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    specificationLayerId: specificationLayer.layerId,
    authoringWorkflowLayerId: authoringWorkflow.layerId,
    qualityValidationLayerId: qualityLayer.layerId,
    approvalStates: assetApprovalStates,
    createApprovalRecord(rawInput) {
      return createApprovalRecord(rawInput, registry, authoringWorkflow, qualityLayer);
    },
    advanceApprovalRecord(rawRecord, targetState) {
      return advanceApprovalRecord(
        rawRecord,
        targetState,
        registry,
        authoringWorkflow,
        qualityLayer
      );
    }
  });

  const checked = validateAssetApprovalRegistrationLayer(layer);
  if (!checked.ok) {
    throw createApprovalValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetApprovalRegistrationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetApprovalRegistrationLayerSchemaId) {
      throw createApprovalValidationError(
        "invalid_asset_approval_registration_layer_schema",
        `Expected ${assetApprovalRegistrationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.approvalStates) || rawLayer.approvalStates.length === 0) {
      throw createApprovalValidationError(
        "invalid_asset_approval_states",
        "Asset approval registration layer must expose non-empty approval states."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetApprovalRegistrationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_approval_registration_layer_validation_failed",
      message: error.message,
      assetApprovalRegistrationLayer: null
    });
  }
}

export function validateAssetApprovalRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetApprovalRecordSchemaId) {
      throw createApprovalValidationError(
        "invalid_asset_approval_record_schema",
        `Expected ${assetApprovalRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetApprovalValidationSchemaId) {
      throw createApprovalValidationError(
        "invalid_asset_approval_validation_schema",
        `Expected ${assetApprovalValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!assetApprovalStates.includes(rawRecord.approvalStatus)) {
      throw createApprovalValidationError(
        "invalid_asset_approval_status",
        `Unsupported asset approval status ${rawRecord.approvalStatus}.`
      );
    }

    for (const key of [
      "qualityPassed",
      "authoringCompleted",
      "registryEntryValid",
      "recipeExists",
      "deterministicApprovalState",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createApprovalValidationError(
          "asset_approval_record_validation_failed",
          `Asset approval validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildApprovalSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicApprovalHash) {
      throw createApprovalValidationError(
        "asset_approval_hash_mismatch",
        "Asset approval record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetApprovalRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_approval_record_validation_failed",
      message: error.message,
      assetApprovalRecord: null
    });
  }
}

function createApprovalRecord(rawInput, registry, authoringWorkflow, qualityLayer) {
  const input = normalizeApprovalInput(rawInput);
  const authoringRecord =
    input.authoringRecord ?? buildApprovedAuthoringRecord(input.assetId, authoringWorkflow);
  const qualityReport =
    input.qualityReport ?? qualityLayer.validateAsset({ authoringRecord }).report;

  ensureApprovalEligibility(authoringRecord, qualityReport);

  const recordBase = deepFreeze({
    schemaId: assetApprovalRecordSchemaId,
    approvalRecordId: `ASSET_APPROVAL_${normalizeSlug(authoringRecord.assetId)}`,
    assetId: authoringRecord.assetId,
    approvalStatus: "PENDING_REVIEW",
    qualityResult: deepFreeze({
      reportId: qualityReport.reportId,
      approvalReadiness: qualityReport.approvalReadiness,
      warnings: deepFreeze([...qualityReport.warnings])
    }),
    registrationStatus: "pending_registration",
    version: "1.0.0",
    approvalTimestamp: "2026-07-27",
    recipeId: authoringRecord.recipeId,
    authoringHistory: deepFreeze({
      specificationId: authoringRecord.specificationId,
      workflowState: authoringRecord.workflowState,
      validationStatus: authoringRecord.validationStatus,
      registrationStatus: authoringRecord.registrationStatus
    }),
    validation: null
  });

  const validation = buildApprovalValidation(recordBase, authoringRecord, qualityReport, registry);
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetApprovalRecord(record);
  if (!checked.ok) {
    throw createApprovalValidationError(checked.errorCode, checked.message);
  }

  return record;
}

function advanceApprovalRecord(rawRecord, targetState, registry, authoringWorkflow, qualityLayer) {
  const checked = validateAssetApprovalRecord(rawRecord);
  if (!checked.ok) {
    throw createApprovalValidationError(checked.errorCode, checked.message);
  }

  const normalizedTargetState = normalizeApprovalState(targetState);
  if (!allowedApprovalTransitions[rawRecord.approvalStatus].includes(normalizedTargetState)) {
    throw createApprovalValidationError(
      "invalid_asset_approval_state_transition",
      `Cannot transition asset approval record from ${rawRecord.approvalStatus} to ${normalizedTargetState}.`
    );
  }

  const authoringRecord = buildApprovedAuthoringRecord(rawRecord.assetId, authoringWorkflow);
  const qualityReport = qualityLayer.validateAsset({ authoringRecord }).report;
  ensureApprovalEligibility(authoringRecord, qualityReport);
  const registeredAsset = registry.getAssetById(rawRecord.assetId);

  const advancedBase = deepFreeze({
    ...rawRecord,
    approvalStatus: normalizedTargetState,
    registrationStatus: deriveRegistrationStatus(normalizedTargetState),
    validation: null
  });
  const validation = buildApprovalValidation(
    advancedBase,
    authoringRecord,
    qualityReport,
    registry
  );
  const advanced = deepFreeze({
    ...advancedBase,
    validation
  });

  if (!registeredAsset) {
    throw createApprovalValidationError(
      "missing_asset_approval_registry_entry",
      `Asset ${rawRecord.assetId} is not registered in the Asset Factory registry.`
    );
  }

  const validated = validateAssetApprovalRecord(advanced);
  if (!validated.ok) {
    throw createApprovalValidationError(validated.errorCode, validated.message);
  }

  return advanced;
}

function ensureApprovalEligibility(authoringRecord, qualityReport) {
  if (!isAuthoringCompleted(authoringRecord.workflowState)) {
    throw createApprovalValidationError(
      "asset_approval_authoring_not_complete",
      `Asset ${authoringRecord.assetId} cannot enter approval until authoring is complete.`
    );
  }

  if (qualityReport.approvalReadiness !== "READY_FOR_APPROVAL") {
    throw createApprovalValidationError(
      "asset_approval_quality_not_ready",
      `Asset ${authoringRecord.assetId} cannot enter approval because quality checks did not pass.`
    );
  }
}

function buildApprovedAuthoringRecord(assetId, authoringWorkflow) {
  let record = authoringWorkflow.createRecord({ assetId });
  record = authoringWorkflow.advanceRecord(record, "AUTHORING_STARTED");
  record = authoringWorkflow.advanceRecord(record, "AUTHORING_COMPLETE");
  record = authoringWorkflow.advanceRecord(record, "VALIDATION_PENDING");
  return record;
}

function buildApprovalValidation(record, authoringRecord, qualityReport, registry) {
  const registeredAsset = registry.getAssetById(record.assetId);
  const qualityPassed = qualityReport.approvalReadiness === "READY_FOR_APPROVAL";
  const authoringCompleted = isAuthoringCompleted(authoringRecord.workflowState);
  const registryEntryValid = Boolean(registeredAsset);
  const recipeExists = registryEntryValid && registeredAsset.recipeId === record.recipeId;
  const deterministicApprovalState = true;
  const validationPassed =
    qualityPassed &&
    authoringCompleted &&
    registryEntryValid &&
    recipeExists &&
    deterministicApprovalState;

  return deepFreeze({
    schemaId: assetApprovalValidationSchemaId,
    qualityPassed,
    authoringCompleted,
    registryEntryValid,
    recipeExists,
    deterministicApprovalState,
    validationPassed,
    deterministicApprovalHash: computeDeterministicHash(buildApprovalSignature(record))
  });
}

function buildApprovalSignature(record) {
  return [
    record.approvalRecordId,
    record.assetId,
    record.approvalStatus,
    record.qualityResult,
    record.registrationStatus,
    record.version,
    record.approvalTimestamp,
    record.recipeId,
    record.authoringHistory
  ];
}

function isAuthoringCompleted(workflowState) {
  return ["AUTHORING_COMPLETE", "VALIDATION_PENDING", "APPROVED", "REGISTERED"].includes(
    workflowState
  );
}

function deriveRegistrationStatus(approvalStatus) {
  switch (approvalStatus) {
    case "PENDING_REVIEW":
      return "pending_registration";
    case "QUALITY_APPROVED":
      return "approved_pending_registration";
    case "REGISTERED":
      return "registered";
    case "ACTIVE":
      return "active_library_entry";
    default:
      return "pending_registration";
  }
}

function normalizeApprovalInput(rawInput) {
  const input = asPlainObject(rawInput, "assetApprovalInput");
  const assetId = input.authoringRecord?.assetId ?? input.qualityReport?.assetId ?? input.assetId;

  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw createApprovalValidationError(
      "invalid_asset_approval_input",
      "Asset approval requires assetId or linked authoring/quality inputs."
    );
  }

  return deepFreeze({
    assetId: assetId.trim(),
    authoringRecord: input.authoringRecord ?? null,
    qualityReport: input.qualityReport ?? null
  });
}

function normalizeRegistry(rawRegistry) {
  if (
    !rawRegistry ||
    rawRegistry.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001" ||
    typeof rawRegistry.getAssetById !== "function"
  ) {
    throw createApprovalValidationError(
      "invalid_asset_approval_registry",
      "Asset approval registration requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizeSpecificationLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_CREATION_SPECIFICATION_LAYER_001"
  ) {
    throw createApprovalValidationError(
      "invalid_asset_approval_specification_layer",
      "Asset approval registration requires a valid specification layer."
    );
  }
  return rawLayer;
}

function normalizeAuthoringWorkflow(rawWorkflow) {
  if (
    !rawWorkflow ||
    rawWorkflow.schemaId !== "ASSET_AUTHORING_WORKFLOW_LAYER_001" ||
    typeof rawWorkflow.createRecord !== "function" ||
    typeof rawWorkflow.advanceRecord !== "function"
  ) {
    throw createApprovalValidationError(
      "invalid_asset_approval_authoring_workflow",
      "Asset approval registration requires a valid authoring workflow layer."
    );
  }
  return rawWorkflow;
}

function normalizeQualityLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_QUALITY_VALIDATION_LAYER_001" ||
    typeof rawLayer.validateAsset !== "function"
  ) {
    throw createApprovalValidationError(
      "invalid_asset_approval_quality_layer",
      "Asset approval registration requires a valid quality validation layer."
    );
  }
  return rawLayer;
}

function normalizeApprovalState(value) {
  const approvalState = normalizeStringValue(value, "approvalStatus");
  if (!assetApprovalStates.includes(approvalState)) {
    throw createApprovalValidationError(
      "invalid_asset_approval_state_value",
      `Approval state ${approvalState} is not supported.`
    );
  }
  return approvalState;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createApprovalValidationError(
      "invalid_asset_approval_string",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createApprovalValidationError(
      "invalid_asset_approval_object",
      `Field ${fieldName} must be an object.`
    );
  }
  return value;
}

function normalizeSlug(value) {
  return value.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function computeDeterministicHash(value) {
  const source = JSON.stringify(sortKeys(value));
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `APPROVAL_${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortKeys(entry));
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = sortKeys(value[key]);
        return result;
      }, {});
  }
  return value;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return value;
}

function createApprovalValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetApprovalRegistrationValidationError";
  error.code = code;
  return error;
}
