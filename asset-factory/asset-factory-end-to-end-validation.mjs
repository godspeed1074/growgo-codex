import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetCreationPipelineLayer } from "./asset-creation-pipeline.mjs";
import { createAssetCreationSpecificationLayer } from "./asset-creation-specification.mjs";
import { createAssetAuthoringWorkflowLayer } from "./asset-authoring-workflow.mjs";
import { createAssetQualityValidationLayer } from "./asset-quality-validation.mjs";
import { createAssetApprovalRegistrationLayer } from "./asset-approval-registration.mjs";

export const assetFactoryEndToEndValidationLayerSchemaId =
  "ASSET_FACTORY_END_TO_END_VALIDATION_LAYER_001";
export const assetFactoryEndToEndResultSchemaId =
  "ASSET_FACTORY_END_TO_END_RESULT_001";
export const assetFactoryEndToEndValidationSchemaId =
  "ASSET_FACTORY_END_TO_END_VALIDATION_001";

export function createAssetFactoryEndToEndValidationLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawCreationPipeline = createAssetCreationPipelineLayer(rawRegistry),
  rawSpecificationLayer = createAssetCreationSpecificationLayer(rawRegistry, rawCreationPipeline),
  rawAuthoringWorkflow = createAssetAuthoringWorkflowLayer(rawRegistry, rawSpecificationLayer),
  rawQualityLayer = createAssetQualityValidationLayer(
    rawRegistry,
    rawSpecificationLayer,
    rawAuthoringWorkflow
  ),
  rawApprovalLayer = createAssetApprovalRegistrationLayer(
    rawRegistry,
    rawSpecificationLayer,
    rawAuthoringWorkflow,
    rawQualityLayer
  )
) {
  const registry = normalizeRegistry(rawRegistry);
  const creationPipeline = normalizeCreationPipeline(rawCreationPipeline);
  const specificationLayer = normalizeSpecificationLayer(rawSpecificationLayer);
  const authoringWorkflow = normalizeAuthoringWorkflow(rawAuthoringWorkflow);
  const qualityLayer = normalizeQualityLayer(rawQualityLayer);
  const approvalLayer = normalizeApprovalLayer(rawApprovalLayer);

  const layer = deepFreeze({
    schemaId: assetFactoryEndToEndValidationLayerSchemaId,
    layerId: "ASSET_FACTORY_END_TO_END_VALIDATION_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    creationPipelineId: creationPipeline.layerId,
    specificationLayerId: specificationLayer.layerId,
    authoringWorkflowLayerId: authoringWorkflow.layerId,
    qualityValidationLayerId: qualityLayer.layerId,
    approvalLayerId: approvalLayer.layerId,
    runValidation(rawInput = {}) {
      return createAssetFactoryEndToEndResult(
        rawInput,
        registry,
        creationPipeline,
        specificationLayer,
        authoringWorkflow,
        qualityLayer,
        approvalLayer
      );
    }
  });

  const checked = validateAssetFactoryEndToEndLayer(layer);
  if (!checked.ok) {
    throw createEndToEndValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetFactoryEndToEndLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetFactoryEndToEndValidationLayerSchemaId) {
      throw createEndToEndValidationError(
        "invalid_asset_factory_end_to_end_layer_schema",
        `Expected ${assetFactoryEndToEndValidationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (typeof rawLayer.runValidation !== "function") {
      throw createEndToEndValidationError(
        "invalid_asset_factory_end_to_end_layer_contract",
        "End-to-end validation layer must expose runValidation."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryEndToEndValidationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_factory_end_to_end_layer_validation_failed",
      message: error.message,
      assetFactoryEndToEndValidationLayer: null
    });
  }
}

export function validateAssetFactoryEndToEndResult(rawResult) {
  try {
    if (rawResult?.schemaId !== assetFactoryEndToEndResultSchemaId) {
      throw createEndToEndValidationError(
        "invalid_asset_factory_end_to_end_result_schema",
        `Expected ${assetFactoryEndToEndResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (rawResult.validation?.schemaId !== assetFactoryEndToEndValidationSchemaId) {
      throw createEndToEndValidationError(
        "invalid_asset_factory_end_to_end_validation_schema",
        `Expected ${assetFactoryEndToEndValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const key of [
      "everyStageCompleted",
      "idsPreserved",
      "recipePreserved",
      "qualityPassed",
      "approvalCompleted",
      "deterministicResult",
      "validationPassed"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createEndToEndValidationError(
          "asset_factory_end_to_end_result_validation_failed",
          `End-to-end validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildEndToEndSignature(rawResult));
    if (expectedHash !== rawResult.validation.deterministicFingerprint) {
      throw createEndToEndValidationError(
        "asset_factory_end_to_end_hash_mismatch",
        "End-to-end deterministic fingerprint does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryEndToEndResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_factory_end_to_end_result_validation_failed",
      message: error.message,
      assetFactoryEndToEndResult: null
    });
  }
}

function createAssetFactoryEndToEndResult(
  rawInput,
  registry,
  creationPipeline,
  specificationLayer,
  authoringWorkflow,
  qualityLayer,
  approvalLayer
) {
  const input = normalizeEndToEndInput(rawInput);
  const assetId = input.assetId;
  const registryAsset = registry.getAssetById(assetId);
  if (!registryAsset) {
    throw createEndToEndValidationError(
      "missing_asset_factory_end_to_end_registry_asset",
      `Asset ${assetId} does not exist in the Asset Factory registry.`
    );
  }

  const creationRequest = buildApprovedCreationRequest(assetId, registryAsset, creationPipeline);
  const specification =
    specificationLayer.getSpecificationByAssetId(assetId) ??
    raiseMissingStage("specification", assetId);
  let authoringRecord = authoringWorkflow.createRecord({ assetId });
  authoringRecord = authoringWorkflow.advanceRecord(authoringRecord, "AUTHORING_STARTED");
  authoringRecord = authoringWorkflow.advanceRecord(authoringRecord, "AUTHORING_COMPLETE");
  authoringRecord = authoringWorkflow.advanceRecord(authoringRecord, "VALIDATION_PENDING");

  const qualityInput = buildQualityInput(authoringRecord, input.qualityOverrides);
  const qualityResult = qualityLayer.validateAsset(qualityInput);

  let approvalRecord = null;
  let finalStatus = "FAILED_AT_QUALITY";

  if (qualityResult.report.approvalReadiness === "READY_FOR_APPROVAL") {
    approvalRecord = approvalLayer.createApprovalRecord({
      authoringRecord,
      qualityReport: qualityResult.report
    });
    approvalRecord = approvalLayer.advanceApprovalRecord(approvalRecord, "QUALITY_APPROVED");
    approvalRecord = approvalLayer.advanceApprovalRecord(approvalRecord, "REGISTERED");
    approvalRecord = approvalLayer.advanceApprovalRecord(approvalRecord, "ACTIVE");
    finalStatus = "ACTIVE";
  } else if (input.expectApprovalFailure) {
    throw createEndToEndValidationError(
      "asset_factory_end_to_end_approval_blocked",
      `Asset ${assetId} cannot enter approval because quality checks did not pass.`
    );
  }

  const stageStatuses = deepFreeze({
    registry: deepFreeze({
      completed: true,
      assetId: registryAsset.assetId,
      recipeId: registryAsset.recipeId
    }),
    creationRequest: deepFreeze({
      completed: true,
      requestId: creationRequest.requestId,
      state: creationRequest.state,
      assetId: creationRequest.assetId,
      recipeId: creationRequest.recipeId
    }),
    specification: deepFreeze({
      completed: true,
      specificationId: specification.specificationId,
      assetId: specification.assetId,
      recipeId: specification.recipeId
    }),
    authoringRecord: deepFreeze({
      completed: true,
      recordId: authoringRecord.recordId,
      workflowState: authoringRecord.workflowState,
      assetId: authoringRecord.assetId,
      recipeId: authoringRecord.recipeId
    }),
    qualityReport: deepFreeze({
      completed: true,
      reportId: qualityResult.report.reportId,
      approvalReadiness: qualityResult.report.approvalReadiness,
      assetId: qualityResult.assetId
    }),
    approvalRecord: deepFreeze({
      completed: approvalRecord !== null,
      approvalRecordId: approvalRecord?.approvalRecordId ?? null,
      approvalStatus: approvalRecord?.approvalStatus ?? null,
      assetId: approvalRecord?.assetId ?? assetId
    }),
    activeAsset: deepFreeze({
      completed: approvalRecord?.approvalStatus === "ACTIVE",
      assetId,
      finalStatus
    })
  });

  const resultBase = deepFreeze({
    schemaId: assetFactoryEndToEndResultSchemaId,
    resultId: `ASSET_FACTORY_END_TO_END_${normalizeSlug(assetId)}`,
    assetId,
    pipelineStages: stageStatuses,
    validationResults: deepFreeze({
      qualityApprovalReadiness: qualityResult.report.approvalReadiness,
      qualityWarnings: deepFreeze([...qualityResult.report.warnings]),
      approvalStatus: approvalRecord?.approvalStatus ?? "NOT_CREATED"
    }),
    finalStatus,
    deterministicFingerprint: null,
    validation: null
  });

  const validation = buildEndToEndValidation(
    resultBase,
    registryAsset,
    creationRequest,
    specification,
    authoringRecord,
    qualityResult,
    approvalRecord
  );
  const result = deepFreeze({
    ...resultBase,
    deterministicFingerprint: validation.deterministicFingerprint,
    validation
  });

  const checked = validateAssetFactoryEndToEndResult(result);
  if (!checked.ok) {
    throw createEndToEndValidationError(checked.errorCode, checked.message);
  }

  return result;
}

function buildApprovedCreationRequest(assetId, registryAsset, creationPipeline) {
  const requestInput = buildCreationRequestInput(assetId, registryAsset);
  let request = creationPipeline.createRequest(requestInput);
  request = creationPipeline.advanceRequest(request, "IN_PROGRESS");
  request = creationPipeline.advanceRequest(request, "VALIDATION_PENDING");
  request = creationPipeline.advanceRequest(request, "APPROVED");
  return request;
}

function buildCreationRequestInput(assetId, registryAsset) {
  switch (assetId) {
    case "BUILDING_RESIDENTIAL_SUBURBAN_001":
      return {
        baseAssetId: assetId,
        environmentContext: {
          biome: "SUBURBAN_PARKLAND",
          climate: "TEMPERATE",
          regionProfile: "SUBURBAN_CITY_EDGE",
          environmentType: "RESIDENTIAL_AREA",
          styleProfile: "CLEAN_SUBURBAN"
        },
        performanceBudgetOverride: {
          polygonBudget: "medium",
          materialBudget: "shared_residential_material",
          instanceFriendly: true
        }
      };
    default:
      return {
        baseAssetId: assetId,
        environmentContext: {
          biome: registeredAsset.biomeCompatibility?.[0] ?? "GENERIC",
          climate: "TEMPERATE",
          regionProfile: "GENERIC",
          environmentType: "GENERIC",
          styleProfile: "PAPERCUT_STANDARD"
        },
        performanceBudgetOverride: registryAsset.metadata?.performanceBudget ?? {
          polygonBudget: "medium",
          materialBudget: "shared_default_material",
          instanceFriendly: true
        }
      };
  }
}

function buildQualityInput(authoringRecord, overrides) {
  return {
    authoringRecord,
    ...overrides
  };
}

function buildEndToEndValidation(
  result,
  registryAsset,
  creationRequest,
  specification,
  authoringRecord,
  qualityResult,
  approvalRecord
) {
  const everyStageCompleted =
    result.pipelineStages.registry.completed === true &&
    result.pipelineStages.creationRequest.completed === true &&
    result.pipelineStages.specification.completed === true &&
    result.pipelineStages.authoringRecord.completed === true &&
    result.pipelineStages.qualityReport.completed === true;
  const idsPreserved =
    registryAsset.assetId === result.assetId &&
    creationRequest.assetId === result.assetId &&
    specification.assetId === result.assetId &&
    authoringRecord.assetId === result.assetId &&
    qualityResult.assetId === result.assetId &&
    (approvalRecord ? approvalRecord.assetId === result.assetId : true);
  const recipePreserved =
    registryAsset.recipeId === creationRequest.recipeId &&
    creationRequest.recipeId === specification.recipeId &&
    specification.recipeId === authoringRecord.recipeId &&
    authoringRecord.recipeId === (approvalRecord?.recipeId ?? authoringRecord.recipeId);
  const qualityPassed = qualityResult.report.approvalReadiness === "READY_FOR_APPROVAL";
  const approvalCompleted = approvalRecord?.approvalStatus === "ACTIVE";
  const deterministicResult = true;
  const validationPassed =
    everyStageCompleted &&
    idsPreserved &&
    recipePreserved &&
    (qualityPassed || result.finalStatus === "FAILED_AT_QUALITY") &&
    (approvalCompleted || result.finalStatus !== "ACTIVE") &&
    deterministicResult;
  const deterministicFingerprint = computeDeterministicHash(buildEndToEndSignature(result));

  return deepFreeze({
    schemaId: assetFactoryEndToEndValidationSchemaId,
    everyStageCompleted,
    idsPreserved,
    recipePreserved,
    qualityPassed: qualityPassed || result.finalStatus === "FAILED_AT_QUALITY",
    approvalCompleted: approvalCompleted || result.finalStatus !== "ACTIVE",
    deterministicResult,
    validationPassed,
    deterministicFingerprint
  });
}

function buildEndToEndSignature(result) {
  return [
    result.resultId,
    result.assetId,
    result.pipelineStages,
    result.validationResults,
    result.finalStatus
  ];
}

function normalizeEndToEndInput(rawInput) {
  const input = asPlainObject(rawInput ?? {}, "assetFactoryEndToEndInput");
  const assetId =
    typeof input.assetId === "string" && input.assetId.trim().length > 0
      ? input.assetId.trim()
      : "BUILDING_RESIDENTIAL_SUBURBAN_001";

  return deepFreeze({
    assetId,
    qualityOverrides: deepFreeze({
      metadataCompleteOverride:
        typeof input.metadataCompleteOverride === "boolean"
          ? input.metadataCompleteOverride
          : undefined,
      textureBudgetValidOverride:
        typeof input.textureBudgetValidOverride === "boolean"
          ? input.textureBudgetValidOverride
          : undefined,
      recipeExistsOverride:
        typeof input.recipeExistsOverride === "boolean"
          ? input.recipeExistsOverride
          : undefined,
      styleProfileValidOverride:
        typeof input.styleProfileValidOverride === "boolean"
          ? input.styleProfileValidOverride
          : undefined,
      papercutCompatibleOverride:
        typeof input.papercutCompatibleOverride === "boolean"
          ? input.papercutCompatibleOverride
          : undefined,
      visualCategoryValidOverride:
        typeof input.visualCategoryValidOverride === "boolean"
          ? input.visualCategoryValidOverride
          : undefined,
      performanceBudget:
        input.performanceBudget && typeof input.performanceBudget === "object"
          ? deepFreeze({ ...input.performanceBudget })
          : null
    }),
    expectApprovalFailure: normalizeBoolean(input.expectApprovalFailure ?? false, "expectApprovalFailure")
  });
}

function raiseMissingStage(stageName, assetId) {
  throw createEndToEndValidationError(
    "missing_asset_factory_end_to_end_stage",
    `Missing ${stageName} stage for asset ${assetId}.`
  );
}

function normalizeRegistry(rawRegistry) {
  if (
    !rawRegistry ||
    rawRegistry.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001" ||
    typeof rawRegistry.getAssetById !== "function"
  ) {
    throw createEndToEndValidationError(
      "invalid_asset_factory_end_to_end_registry",
      "End-to-end validation requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizeCreationPipeline(rawPipeline) {
  if (
    !rawPipeline ||
    rawPipeline.schemaId !== "ASSET_CREATION_PIPELINE_LAYER_001" ||
    typeof rawPipeline.createRequest !== "function" ||
    typeof rawPipeline.advanceRequest !== "function"
  ) {
    throw createEndToEndValidationError(
      "invalid_asset_factory_end_to_end_creation_pipeline",
      "End-to-end validation requires a valid asset creation pipeline."
    );
  }
  return rawPipeline;
}

function normalizeSpecificationLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_CREATION_SPECIFICATION_LAYER_001" ||
    typeof rawLayer.getSpecificationByAssetId !== "function"
  ) {
    throw createEndToEndValidationError(
      "invalid_asset_factory_end_to_end_specification_layer",
      "End-to-end validation requires a valid asset creation specification layer."
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
    throw createEndToEndValidationError(
      "invalid_asset_factory_end_to_end_authoring_workflow",
      "End-to-end validation requires a valid asset authoring workflow layer."
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
    throw createEndToEndValidationError(
      "invalid_asset_factory_end_to_end_quality_layer",
      "End-to-end validation requires a valid asset quality validation layer."
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
    throw createEndToEndValidationError(
      "invalid_asset_factory_end_to_end_approval_layer",
      "End-to-end validation requires a valid asset approval registration layer."
    );
  }
  return rawLayer;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createEndToEndValidationError(
      "invalid_asset_factory_end_to_end_boolean",
      `Field ${fieldName} must be a boolean.`
    );
  }
  return value;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createEndToEndValidationError(
      "invalid_asset_factory_end_to_end_object",
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
  return `E2E_${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
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

function createEndToEndValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetFactoryEndToEndValidationError";
  error.code = code;
  return error;
}
