import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetCreationSpecificationLayer } from "./asset-creation-specification.mjs";

export const assetAuthoringWorkflowLayerSchemaId =
  "ASSET_AUTHORING_WORKFLOW_LAYER_001";
export const assetAuthoringRecordSchemaId = "ASSET_AUTHORING_RECORD_001";
export const assetAuthoringValidationSchemaId = "ASSET_AUTHORING_VALIDATION_001";

export const assetAuthoringWorkflowStates = deepFreeze([
  "SPEC_READY",
  "AUTHORING_STARTED",
  "AUTHORING_COMPLETE",
  "VALIDATION_PENDING",
  "APPROVED",
  "REGISTERED"
]);

const allowedWorkflowTransitions = deepFreeze({
  SPEC_READY: deepFreeze(["AUTHORING_STARTED"]),
  AUTHORING_STARTED: deepFreeze(["AUTHORING_COMPLETE"]),
  AUTHORING_COMPLETE: deepFreeze(["VALIDATION_PENDING"]),
  VALIDATION_PENDING: deepFreeze(["APPROVED"]),
  APPROVED: deepFreeze(["REGISTERED"]),
  REGISTERED: deepFreeze([])
});

export function createAssetAuthoringWorkflowLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawSpecificationLayer = createAssetCreationSpecificationLayer(rawRegistry)
) {
  const registry = normalizeRegistry(rawRegistry);
  const specificationLayer = normalizeSpecificationLayer(rawSpecificationLayer);

  const layer = deepFreeze({
    schemaId: assetAuthoringWorkflowLayerSchemaId,
    layerId: "ASSET_AUTHORING_WORKFLOW_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    specificationLayerId: specificationLayer.layerId,
    workflowStates: assetAuthoringWorkflowStates,
    createRecord(rawInput) {
      return createAssetAuthoringRecord(rawInput, registry, specificationLayer);
    },
    advanceRecord(rawRecord, targetState) {
      return advanceAssetAuthoringRecord(rawRecord, targetState, registry, specificationLayer);
    }
  });

  const checked = validateAssetAuthoringWorkflowLayer(layer);
  if (!checked.ok) {
    throw createAuthoringValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetAuthoringWorkflowLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetAuthoringWorkflowLayerSchemaId) {
      throw createAuthoringValidationError(
        "invalid_asset_authoring_workflow_layer_schema",
        `Expected ${assetAuthoringWorkflowLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.workflowStates) || rawLayer.workflowStates.length === 0) {
      throw createAuthoringValidationError(
        "invalid_asset_authoring_workflow_states",
        "Asset authoring workflow layer must expose non-empty workflow states."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAuthoringWorkflowLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_authoring_workflow_layer_validation_failed",
      message: error.message,
      assetAuthoringWorkflowLayer: null
    });
  }
}

export function validateAssetAuthoringRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetAuthoringRecordSchemaId) {
      throw createAuthoringValidationError(
        "invalid_asset_authoring_record_schema",
        `Expected ${assetAuthoringRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetAuthoringValidationSchemaId) {
      throw createAuthoringValidationError(
        "invalid_asset_authoring_validation_schema",
        `Expected ${assetAuthoringValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!assetAuthoringWorkflowStates.includes(rawRecord.workflowState)) {
      throw createAuthoringValidationError(
        "invalid_asset_authoring_state",
        `Unsupported asset authoring workflow state ${rawRecord.workflowState}.`
      );
    }

    for (const key of [
      "specificationExists",
      "assetRegistered",
      "recipeExists",
      "requiredMetadataExists",
      "deterministicWorkflowState",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createAuthoringValidationError(
          "asset_authoring_record_validation_failed",
          `Asset authoring validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildAuthoringSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicWorkflowHash) {
      throw createAuthoringValidationError(
        "asset_authoring_workflow_hash_mismatch",
        "Asset authoring record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAuthoringRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_authoring_record_validation_failed",
      message: error.message,
      assetAuthoringRecord: null
    });
  }
}

function createAssetAuthoringRecord(rawInput, registry, specificationLayer) {
  const input = normalizeAuthoringInput(rawInput);
  const specification = resolveSpecification(input, specificationLayer);
  const registeredAsset = registry.getAssetById(specification.assetId);

  if (!registeredAsset) {
    throw createAuthoringValidationError(
      "missing_asset_authoring_registered_asset",
      `Asset ${specification.assetId} is not registered for authoring.`
    );
  }

  const recordBase = deepFreeze({
    schemaId: assetAuthoringRecordSchemaId,
    recordId: buildRecordId(specification),
    assetId: specification.assetId,
    specificationId: specification.specificationId,
    workflowState: "SPEC_READY",
    variantRequirements: deepFreeze([...specification.variants]),
    validationStatus: "pending",
    registrationStatus: "not_registered",
    recipeId: specification.recipeId,
    lodRules: deepFreeze([...specification.lodRequirements]),
    performanceBudget: specification.performanceBudget,
    metadata: deepFreeze({
      specificationLabel: specification.specificationLabel,
      specificationSourceAssetId: specification.metadata.registrySourceAssetId,
      creationRequestId: specification.creationRequest.requestId
    }),
    validation: null
  });

  const validation = buildAuthoringValidation(recordBase, specification, registeredAsset);
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetAuthoringRecord(record);
  if (!checked.ok) {
    throw createAuthoringValidationError(checked.errorCode, checked.message);
  }

  return record;
}

function advanceAssetAuthoringRecord(rawRecord, targetState, registry, specificationLayer) {
  const checked = validateAssetAuthoringRecord(rawRecord);
  if (!checked.ok) {
    throw createAuthoringValidationError(checked.errorCode, checked.message);
  }

  const normalizedTargetState = normalizeWorkflowState(targetState);
  if (!allowedWorkflowTransitions[rawRecord.workflowState].includes(normalizedTargetState)) {
    throw createAuthoringValidationError(
      "invalid_asset_authoring_state_transition",
      `Cannot transition asset authoring record from ${rawRecord.workflowState} to ${normalizedTargetState}.`
    );
  }

  const specification = specificationLayer.getSpecificationByAssetId(rawRecord.assetId);
  if (!specification) {
    throw createAuthoringValidationError(
      "missing_asset_authoring_specification",
      `Specification for asset ${rawRecord.assetId} is no longer available.`
    );
  }
  const registeredAsset = registry.getAssetById(rawRecord.assetId);
  if (!registeredAsset) {
    throw createAuthoringValidationError(
      "missing_asset_authoring_registered_asset",
      `Asset ${rawRecord.assetId} is not registered for authoring.`
    );
  }

  const advancedBase = deepFreeze({
    ...rawRecord,
    workflowState: normalizedTargetState,
    validationStatus: deriveValidationStatus(normalizedTargetState),
    registrationStatus: deriveRegistrationStatus(normalizedTargetState),
    validation: null
  });

  const validation = buildAuthoringValidation(advancedBase, specification, registeredAsset);
  const advanced = deepFreeze({
    ...advancedBase,
    validation
  });

  const validated = validateAssetAuthoringRecord(advanced);
  if (!validated.ok) {
    throw createAuthoringValidationError(validated.errorCode, validated.message);
  }

  return advanced;
}

function resolveSpecification(input, specificationLayer) {
  const specification = specificationLayer.getSpecificationByAssetId(input.assetId);
  if (!specification) {
    throw createAuthoringValidationError(
      "missing_asset_authoring_specification",
      `No approved asset creation specification exists for asset ${input.assetId}.`
    );
  }

  return specification;
}

function buildAuthoringValidation(record, specification, registeredAsset) {
  const specificationExists =
    specification?.schemaId === "ASSET_CREATION_SPECIFICATION_001" &&
    specification.creationRequest?.state === "APPROVED";
  const assetRegistered = Boolean(registeredAsset);
  const recipeExists = assetRegistered && registeredAsset.recipeId === record.recipeId;
  const requiredMetadataExists = Boolean(
    record.specificationId &&
      record.assetId &&
      record.recipeId &&
      Array.isArray(record.variantRequirements) &&
      record.variantRequirements.length > 0 &&
      Array.isArray(record.lodRules) &&
      record.lodRules.length > 0 &&
      record.performanceBudget &&
      record.metadata?.creationRequestId
  );
  const deterministicWorkflowState = true;
  const validationPassed =
    specificationExists &&
    assetRegistered &&
    recipeExists &&
    requiredMetadataExists &&
    deterministicWorkflowState;

  return deepFreeze({
    schemaId: assetAuthoringValidationSchemaId,
    specificationExists,
    assetRegistered,
    recipeExists,
    requiredMetadataExists,
    deterministicWorkflowState,
    validationPassed,
    deterministicWorkflowHash: computeDeterministicHash(buildAuthoringSignature(record))
  });
}

function buildAuthoringSignature(record) {
  return [
    record.recordId,
    record.assetId,
    record.specificationId,
    record.workflowState,
    record.variantRequirements,
    record.validationStatus,
    record.registrationStatus,
    record.recipeId,
    record.lodRules,
    record.performanceBudget,
    record.metadata
  ];
}

function deriveValidationStatus(workflowState) {
  switch (workflowState) {
    case "SPEC_READY":
    case "AUTHORING_STARTED":
      return "pending";
    case "AUTHORING_COMPLETE":
      return "authoring_complete";
    case "VALIDATION_PENDING":
      return "pending_review";
    case "APPROVED":
    case "REGISTERED":
      return "approved";
    default:
      return "pending";
  }
}

function deriveRegistrationStatus(workflowState) {
  switch (workflowState) {
    case "REGISTERED":
      return "registered";
    case "APPROVED":
      return "approved_pending_registration";
    default:
      return "not_registered";
  }
}

function normalizeAuthoringInput(rawInput) {
  const input = asPlainObject(rawInput, "assetAuthoringInput");
  return deepFreeze({
    assetId: normalizeStringValue(input.assetId, "assetId")
  });
}

function normalizeRegistry(rawRegistry) {
  if (
    !rawRegistry ||
    rawRegistry.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001" ||
    typeof rawRegistry.getAssetById !== "function"
  ) {
    throw createAuthoringValidationError(
      "invalid_asset_authoring_registry",
      "Asset authoring workflow requires a valid Asset Factory registry layer."
    );
  }

  return rawRegistry;
}

function normalizeSpecificationLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_CREATION_SPECIFICATION_LAYER_001" ||
    typeof rawLayer.getSpecificationByAssetId !== "function"
  ) {
    throw createAuthoringValidationError(
      "invalid_asset_authoring_specification_layer",
      "Asset authoring workflow requires a valid asset creation specification layer."
    );
  }

  return rawLayer;
}

function normalizeWorkflowState(value) {
  const workflowState = normalizeStringValue(value, "workflowState");
  if (!assetAuthoringWorkflowStates.includes(workflowState)) {
    throw createAuthoringValidationError(
      "invalid_asset_authoring_workflow_state",
      `Workflow state ${workflowState} is not supported.`
    );
  }
  return workflowState;
}

function buildRecordId(specification) {
  return `ASSET_AUTHORING_${normalizeSlug(specification.assetId)}`;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createAuthoringValidationError(
      "invalid_asset_authoring_string",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function normalizeSlug(value) {
  return value.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createAuthoringValidationError(
      "invalid_asset_authoring_object",
      `Field ${fieldName} must be an object.`
    );
  }
  return value;
}

function computeDeterministicHash(value) {
  const source = JSON.stringify(sortKeys(value));
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `AUTHOR_${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
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

function createAuthoringValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetAuthoringWorkflowValidationError";
  error.code = code;
  return error;
}
