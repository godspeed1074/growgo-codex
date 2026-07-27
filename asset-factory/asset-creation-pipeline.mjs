import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetVariantSystem } from "./asset-variant-system.mjs";

export const assetCreationPipelineLayerSchemaId = "ASSET_CREATION_PIPELINE_LAYER_001";
export const assetCreationRequestSchemaId = "ASSET_CREATION_REQUEST_001";
export const assetCreationValidationSchemaId = "ASSET_CREATION_VALIDATION_001";

export const assetCreationPipelineStates = deepFreeze([
  "REQUESTED",
  "IN_PROGRESS",
  "VALIDATION_PENDING",
  "APPROVED",
  "REGISTERED"
]);

const allowedStateTransitions = deepFreeze({
  REQUESTED: deepFreeze(["IN_PROGRESS"]),
  IN_PROGRESS: deepFreeze(["VALIDATION_PENDING"]),
  VALIDATION_PENDING: deepFreeze(["APPROVED"]),
  APPROVED: deepFreeze(["REGISTERED"]),
  REGISTERED: deepFreeze([])
});

export function createAssetCreationPipelineLayer(
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawVariantSystem = createAssetVariantSystem(rawRegistry)
) {
  const registry = normalizeRegistry(rawRegistry);
  const variantSystem = normalizeVariantSystem(rawVariantSystem);

  const layer = deepFreeze({
    schemaId: assetCreationPipelineLayerSchemaId,
    layerId: "ASSET_CREATION_PIPELINE_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    variantSystemId: variantSystem.systemId,
    pipelineStates: assetCreationPipelineStates,
    createRequest(rawRequest) {
      return createAssetCreationRequest(rawRequest, registry, variantSystem);
    },
    advanceRequest(rawRequest, targetState) {
      return advanceAssetCreationRequest(rawRequest, targetState, registry, variantSystem);
    }
  });

  const checked = validateAssetCreationPipelineLayer(layer);
  if (!checked.ok) {
    throw createPipelineValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetCreationPipelineLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetCreationPipelineLayerSchemaId) {
      throw createPipelineValidationError(
        "invalid_asset_creation_pipeline_schema",
        `Expected ${assetCreationPipelineLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.pipelineStates) || rawLayer.pipelineStates.length === 0) {
      throw createPipelineValidationError(
        "invalid_asset_creation_pipeline_states",
        "Asset creation pipeline layer must expose non-empty pipeline states."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetCreationPipelineLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_creation_pipeline_validation_failed",
      message: error.message,
      assetCreationPipelineLayer: null
    });
  }
}

export function validateAssetCreationRequest(rawRequest) {
  try {
    if (rawRequest?.schemaId !== assetCreationRequestSchemaId) {
      throw createPipelineValidationError(
        "invalid_asset_creation_request_schema",
        `Expected ${assetCreationRequestSchemaId} but received ${rawRequest?.schemaId}.`
      );
    }

    if (rawRequest.validation?.schemaId !== assetCreationValidationSchemaId) {
      throw createPipelineValidationError(
        "invalid_asset_creation_validation_schema",
        `Expected ${assetCreationValidationSchemaId} but received ${rawRequest.validation?.schemaId}.`
      );
    }

    if (!assetCreationPipelineStates.includes(rawRequest.state)) {
      throw createPipelineValidationError(
        "invalid_asset_creation_state",
        `Unsupported asset creation state ${rawRequest.state}.`
      );
    }

    for (const key of [
      "assetExistsInRegistry",
      "recipeExists",
      "variantCompatible",
      "lodDefined",
      "performanceBudgetDefined",
      "deterministicRequest",
      "validationPassed"
    ]) {
      if (rawRequest.validation[key] !== true) {
        throw createPipelineValidationError(
          "asset_creation_request_validation_failed",
          `Asset creation validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash([
      rawRequest.assetId,
      rawRequest.recipeId,
      rawRequest.selectedVariant,
      rawRequest.state,
      rawRequest.variantRequirements,
      rawRequest.lodRequirements,
      rawRequest.performanceBudget,
      rawRequest.validationRequirements,
      rawRequest.environmentContext
    ]);

    if (expectedHash !== rawRequest.validation.deterministicRequestHash) {
      throw createPipelineValidationError(
        "asset_creation_request_hash_mismatch",
        "Asset creation request deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetCreationRequest: rawRequest
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_creation_request_validation_failed",
      message: error.message,
      assetCreationRequest: null
    });
  }
}

function createAssetCreationRequest(rawRequest, registry, variantSystem) {
  const request = normalizeCreationInput(rawRequest);
  const baseRecord = resolveBaseRecord(request, registry);
  const variantAssignment = resolveVariantAssignment(request, variantSystem, baseRecord);
  const selectedAsset = registry.getAssetById(variantAssignment.assetId);

  if (!selectedAsset) {
    throw createPipelineValidationError(
      "missing_asset_creation_target",
      `Variant target asset ${variantAssignment.assetId} is not registered.`
    );
  }

  const performanceBudget =
    normalizePerformanceBudget(selectedAsset.metadata?.performanceBudget) ??
    normalizePerformanceBudget(request.performanceBudgetOverride);

  const creationRequest = deepFreeze({
    schemaId: assetCreationRequestSchemaId,
    requestId: buildRequestId(request, variantAssignment),
    state: "REQUESTED",
    assetId: selectedAsset.assetId,
    baseAssetId: baseRecord.assetId,
    recipeId: selectedAsset.recipeId,
    selectedVariant: variantAssignment.selectedVariant,
    variantRequirements: deepFreeze({
      variantAssignmentId: variantAssignment.assignmentId,
      baseReferenceType: variantAssignment.baseReferenceType,
      baseReferenceId: variantAssignment.baseReferenceId,
      reason: variantAssignment.reason
    }),
    lodRequirements: deepFreeze([...selectedAsset.lodRules]),
    performanceBudget,
    validationRequirements: deepFreeze([
      "asset_exists_in_registry",
      "recipe_exists",
      "variant_compatible",
      "lod_defined",
      "performance_budget_defined",
      "deterministic_request"
    ]),
    environmentContext: variantAssignment.environmentContext,
    metadata: deepFreeze({
      sourceRecipeId: baseRecord.recipeId,
      sourceAssetId: baseRecord.assetId,
      variantSystemId: variantSystem.systemId,
      performanceBudgetSource: selectedAsset.metadata?.performanceBudget
        ? "registry_metadata"
        : "request_override"
    }),
    validation: null
  });

  const validation = buildAssetCreationValidation(
    creationRequest,
    registry,
    variantAssignment,
    Boolean(performanceBudget)
  );
  const finalized = deepFreeze({
    ...creationRequest,
    validation
  });

  const checked = validateAssetCreationRequest(finalized);
  if (!checked.ok) {
    throw createPipelineValidationError(checked.errorCode, checked.message);
  }

  return finalized;
}

function advanceAssetCreationRequest(rawRequest, targetState, registry, variantSystem) {
  const checked = validateAssetCreationRequest(rawRequest);
  if (!checked.ok) {
    throw createPipelineValidationError(checked.errorCode, checked.message);
  }

  const normalizedTargetState = normalizeState(targetState);
  if (!allowedStateTransitions[rawRequest.state].includes(normalizedTargetState)) {
    throw createPipelineValidationError(
      "invalid_asset_creation_state_transition",
      `Cannot transition asset creation request from ${rawRequest.state} to ${normalizedTargetState}.`
    );
  }

  const rebuilt = createAssetCreationRequest(
    {
      baseAssetId: rawRequest.baseAssetId,
      environmentContext: rawRequest.environmentContext,
      performanceBudgetOverride:
        rawRequest.metadata.performanceBudgetSource === "request_override"
          ? rawRequest.performanceBudget
          : null
    },
    registry,
    variantSystem
  );

  const advanced = deepFreeze({
    ...rebuilt,
    requestId: rawRequest.requestId,
    state: normalizedTargetState,
    validation: deepFreeze({
      ...rebuilt.validation,
      deterministicRequestHash: computeDeterministicHash([
        rebuilt.assetId,
        rebuilt.recipeId,
        rebuilt.selectedVariant,
        normalizedTargetState,
        rebuilt.variantRequirements,
        rebuilt.lodRequirements,
        rebuilt.performanceBudget,
        rebuilt.validationRequirements,
        rebuilt.environmentContext
      ])
    })
  });

  const validated = validateAssetCreationRequest(advanced);
  if (!validated.ok) {
    throw createPipelineValidationError(validated.errorCode, validated.message);
  }

  return advanced;
}

function resolveBaseRecord(request, registry) {
  const baseRecord = request.baseAssetId
    ? registry.getAssetById(request.baseAssetId)
    : registry.getAssetByRecipeId(request.baseRecipeId);

  if (!baseRecord) {
    throw createPipelineValidationError(
      "missing_asset_creation_base_record",
      `Base asset creation reference could not be resolved for ${request.baseAssetId ?? request.baseRecipeId}.`
    );
  }

  return baseRecord;
}

function resolveVariantAssignment(request, variantSystem, baseRecord) {
  if (request.baseAssetId) {
    try {
      return variantSystem.resolveVariant({
        baseAssetId: baseRecord.assetId,
        environmentContext: request.environmentContext
      });
    } catch (error) {
      if (error?.code !== "missing_asset_variant_group") {
        throw error;
      }

      return buildDirectAssetVariantAssignment(baseRecord, request.environmentContext);
    }
  }

  return variantSystem.resolveVariant({
    baseRecipeId: request.baseRecipeId,
    environmentContext: request.environmentContext
  });
}

function normalizeCreationInput(rawRequest) {
  const request = asPlainObject(rawRequest, "assetCreationRequestInput");
  const hasAssetReference = isPresent(request.baseAssetId);
  const hasRecipeReference = isPresent(request.baseRecipeId);

  if (hasAssetReference === hasRecipeReference) {
    throw createPipelineValidationError(
      "invalid_asset_creation_reference",
      "Provide either baseAssetId or baseRecipeId when creating an asset request."
    );
  }

  return deepFreeze({
    baseAssetId: hasAssetReference
      ? normalizeStringValue(request.baseAssetId, "baseAssetId")
      : null,
    baseRecipeId: hasRecipeReference
      ? normalizeStringValue(request.baseRecipeId, "baseRecipeId")
      : null,
    environmentContext: normalizeEnvironmentContext(request.environmentContext),
    performanceBudgetOverride: request.performanceBudgetOverride ?? null
  });
}

function buildAssetCreationValidation(request, registry, variantAssignment, hasPerformanceBudget) {
  const selectedAsset = registry.getAssetById(request.assetId);
  const assetExistsInRegistry = Boolean(selectedAsset);
  const recipeExists = Boolean(selectedAsset?.recipeId) && selectedAsset.recipeId === request.recipeId;
  const variantCompatible =
    variantAssignment.assetId === request.assetId &&
    variantAssignment.validation.compatibilityPreserved === true;
  const lodDefined = Array.isArray(request.lodRequirements) && request.lodRequirements.length > 0;
  const performanceBudgetDefined = hasPerformanceBudget === true;
  const deterministicRequest = true;
  const validationPassed =
    assetExistsInRegistry &&
    recipeExists &&
    variantCompatible &&
    lodDefined &&
    performanceBudgetDefined &&
    deterministicRequest;

  return deepFreeze({
    schemaId: assetCreationValidationSchemaId,
    assetExistsInRegistry,
    recipeExists,
    variantCompatible,
    lodDefined,
    performanceBudgetDefined,
    deterministicRequest,
    validationPassed,
    deterministicRequestHash: computeDeterministicHash([
      request.assetId,
      request.recipeId,
      request.selectedVariant,
      request.state,
      request.variantRequirements,
      request.lodRequirements,
      request.performanceBudget,
      request.validationRequirements,
      request.environmentContext
    ])
  });
}

function buildDirectAssetVariantAssignment(baseRecord, environmentContext) {
  const variantId = "base";
  const reason = "direct_registered_asset:no_variant_group";
  const validationSource = [
    "asset",
    baseRecord.assetId,
    baseRecord.assetId,
    baseRecord.assetId,
    variantId,
    reason,
    environmentContext
  ];

  return deepFreeze({
    schemaId: "ASSET_VARIANT_ASSIGNMENT_001",
    assignmentId: [
      "ASSET_VARIANT_ASSIGNMENT",
      normalizeSlug(baseRecord.assetId),
      variantId.toUpperCase()
    ].join("_"),
    assetId: baseRecord.assetId,
    baseAssetId: baseRecord.assetId,
    baseReferenceType: "asset",
    baseReferenceId: baseRecord.assetId,
    selectedVariant: variantId,
    reason,
    environmentContext,
    validation: deepFreeze({
      schemaId: "ASSET_VARIANT_VALIDATION_001",
      variantExists: true,
      baseAssetExists: true,
      deterministicSelection: true,
      compatibilityPreserved: true,
      validationPassed: true,
      deterministicVariantHash: computeDeterministicHash(validationSource)
    })
  });
}

function normalizeRegistry(rawRegistry) {
  if (
    !rawRegistry ||
    rawRegistry.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001" ||
    typeof rawRegistry.getAssetById !== "function" ||
    typeof rawRegistry.getAssetByRecipeId !== "function"
  ) {
    throw createPipelineValidationError(
      "invalid_asset_creation_registry",
      "Asset creation pipeline requires a valid Asset Factory registry layer."
    );
  }

  return rawRegistry;
}

function normalizeVariantSystem(rawVariantSystem) {
  if (
    !rawVariantSystem ||
    rawVariantSystem.schemaId !== "ASSET_VARIANT_SYSTEM_001" ||
    typeof rawVariantSystem.resolveVariant !== "function"
  ) {
    throw createPipelineValidationError(
      "invalid_asset_creation_variant_system",
      "Asset creation pipeline requires a valid asset variant system."
    );
  }

  return rawVariantSystem;
}

function normalizeEnvironmentContext(rawContext) {
  const context = asPlainObject(rawContext ?? {}, "environmentContext");
  return deepFreeze({
    biome: isPresent(context.biome) ? normalizeStringValue(context.biome, "environmentContext.biome") : "GENERIC",
    climate: isPresent(context.climate)
      ? normalizeStringValue(context.climate, "environmentContext.climate")
      : "GENERIC",
    regionProfile: isPresent(context.regionProfile)
      ? normalizeStringValue(context.regionProfile, "environmentContext.regionProfile")
      : "GENERIC",
    environmentType: isPresent(context.environmentType)
      ? normalizeStringValue(context.environmentType, "environmentContext.environmentType")
      : "GENERIC",
    styleProfile: isPresent(context.styleProfile)
      ? normalizeStringValue(context.styleProfile, "environmentContext.styleProfile")
      : "GENERIC"
  });
}

function normalizePerformanceBudget(rawBudget) {
  if (!rawBudget) {
    return null;
  }

  const budget = asPlainObject(rawBudget, "performanceBudget");
  const polygonBudget = normalizeStringValue(budget.polygonBudget, "performanceBudget.polygonBudget");
  const materialBudget = normalizeStringValue(
    budget.materialBudget,
    "performanceBudget.materialBudget"
  );
  const instanceFriendly = normalizeBoolean(
    budget.instanceFriendly,
    "performanceBudget.instanceFriendly"
  );

  return deepFreeze({
    polygonBudget,
    materialBudget,
    instanceFriendly
  });
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createPipelineValidationError(
      "invalid_asset_creation_string",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createPipelineValidationError(
      "invalid_asset_creation_boolean",
      `Field ${fieldName} must be a boolean.`
    );
  }
  return value;
}

function normalizeState(value) {
  const state = normalizeStringValue(value, "state");
  if (!assetCreationPipelineStates.includes(state)) {
    throw createPipelineValidationError(
      "invalid_asset_creation_state_value",
      `State ${state} is not supported by the asset creation pipeline.`
    );
  }
  return state;
}

function buildRequestId(request, variantAssignment) {
  return [
    "ASSET_CREATION_REQUEST",
    normalizeSlug(request.baseAssetId ?? request.baseRecipeId),
    normalizeSlug(variantAssignment.selectedVariant)
  ].join("_");
}

function normalizeSlug(value) {
  return value.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createPipelineValidationError(
      "invalid_asset_creation_object",
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
  return `CREATE_${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
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

function createPipelineValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetCreationPipelineValidationError";
  error.code = code;
  return error;
}
