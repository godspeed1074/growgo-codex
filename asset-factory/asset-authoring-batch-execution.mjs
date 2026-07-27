import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import { createAssetProductionSpecificationLayer } from "./asset-production-specification.mjs";

export const assetAuthoringBatchExecutionLayerSchemaId =
  "ASSET_AUTHORING_BATCH_EXECUTION_LAYER_001";
export const assetAuthoringBatchRecordSchemaId = "ASSET_AUTHORING_BATCH_RECORD_001";
export const assetAuthoringBatchValidationSchemaId =
  "ASSET_AUTHORING_BATCH_VALIDATION_001";

export const assetAuthoringBatchStates = deepFreeze([
  "NOT_STARTED",
  "READY",
  "IN_PROGRESS",
  "AUTHORING_COMPLETE",
  "VALIDATION_PENDING",
  "COMPLETE"
]);

const allowedStateTransitions = deepFreeze({
  NOT_STARTED: deepFreeze(["READY"]),
  READY: deepFreeze(["IN_PROGRESS"]),
  IN_PROGRESS: deepFreeze(["AUTHORING_COMPLETE"]),
  AUTHORING_COMPLETE: deepFreeze(["VALIDATION_PENDING"]),
  VALIDATION_PENDING: deepFreeze(["COMPLETE"]),
  COMPLETE: deepFreeze([])
});

const progressWeights = deepFreeze({
  NOT_STARTED: 0,
  READY: 20,
  IN_PROGRESS: 45,
  AUTHORING_COMPLETE: 70,
  VALIDATION_PENDING: 85,
  COMPLETE: 100
});

const defaultBatchId = "CIVIC_LOCATION_BATCH_001";

export function createAssetAuthoringBatchExecutionLayer(
  rawOptions = {},
  rawSpecificationLayer = createAssetProductionSpecificationLayer(),
  rawRegistry = createAssetFactoryRegistryLayer()
) {
  const options = normalizeOptions(rawOptions);
  const specificationLayer = normalizeSpecificationLayer(rawSpecificationLayer);
  const registry = normalizeRegistry(rawRegistry);

  const batchRecord = createAssetAuthoringBatchRecord(
    { batchId: options.batchId },
    specificationLayer,
    registry
  );
  const validation = buildBatchExecutionValidation(batchRecord, specificationLayer, registry);

  const layer = deepFreeze({
    schemaId: assetAuthoringBatchExecutionLayerSchemaId,
    layerId: "ASSET_AUTHORING_BATCH_EXECUTION_LAYER_001_DEFAULT",
    specificationLayerId: specificationLayer.layerId,
    registryId: registry.registryId,
    batchRecord,
    validation,
    createBatchRecord(rawInput = {}) {
      return createAssetAuthoringBatchRecord(
        {
          batchId: rawInput.batchId ?? options.batchId
        },
        specificationLayer,
        registry
      );
    },
    advanceAsset(rawBatchRecord, assetId, targetState) {
      return advanceAssetAuthoringBatchRecord(
        rawBatchRecord,
        assetId,
        targetState,
        specificationLayer,
        registry
      );
    },
    getAssetStatus(rawBatchRecord, assetId) {
      const checked = validateAssetAuthoringBatchRecord(rawBatchRecord);
      if (!checked.ok) {
        throw createBatchExecutionError(checked.errorCode, checked.message);
      }
      return (
        rawBatchRecord.assets.find((entry) => entry.assetId === normalizeString(assetId)) ?? null
      );
    }
  });

  const checked = validateAssetAuthoringBatchExecutionLayer(layer);
  if (!checked.ok) {
    throw createBatchExecutionError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetAuthoringBatchExecutionLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetAuthoringBatchExecutionLayerSchemaId) {
      throw createBatchExecutionError(
        "invalid_asset_authoring_batch_execution_layer_schema",
        `Expected ${assetAuthoringBatchExecutionLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.batchRecord?.schemaId !== assetAuthoringBatchRecordSchemaId) {
      throw createBatchExecutionError(
        "invalid_asset_authoring_batch_record_schema",
        `Expected ${assetAuthoringBatchRecordSchemaId} but received ${rawLayer.batchRecord?.schemaId}.`
      );
    }

    if (rawLayer.validation?.schemaId !== assetAuthoringBatchValidationSchemaId) {
      throw createBatchExecutionError(
        "invalid_asset_authoring_batch_validation_schema",
        `Expected ${assetAuthoringBatchValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "specificationExists",
      "assetIdsValid",
      "dependencyOrderValid",
      "stateTransitionsValid",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createBatchExecutionError(
          "asset_authoring_batch_execution_layer_validation_failed",
          `Asset authoring batch validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAuthoringBatchExecutionLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_authoring_batch_execution_layer_validation_failed",
      message: error.message,
      assetAuthoringBatchExecutionLayer: null
    });
  }
}

export function validateAssetAuthoringBatchRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetAuthoringBatchRecordSchemaId) {
      throw createBatchExecutionError(
        "invalid_asset_authoring_batch_record_schema",
        `Expected ${assetAuthoringBatchRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetAuthoringBatchValidationSchemaId) {
      throw createBatchExecutionError(
        "invalid_asset_authoring_batch_validation_schema",
        `Expected ${assetAuthoringBatchValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    const derivedValidation = buildBatchExecutionValidation(
      rawRecord,
      createAssetProductionSpecificationLayer(),
      createAssetFactoryRegistryLayer()
    );

    for (const key of [
      "specificationExists",
      "assetIdsValid",
      "dependencyOrderValid",
      "stateTransitionsValid",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (derivedValidation[key] !== true) {
        throw createBatchExecutionError(
          "asset_authoring_batch_record_validation_failed",
          `Asset authoring batch validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildBatchRecordSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicBatchExecutionHash) {
      throw createBatchExecutionError(
        "asset_authoring_batch_execution_hash_mismatch",
        "Asset authoring batch record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAuthoringBatchRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_authoring_batch_record_validation_failed",
      message: error.message,
      assetAuthoringBatchRecord: null
    });
  }
}

function createAssetAuthoringBatchRecord(rawInput, specificationLayer, registry) {
  const input = normalizeBatchInput(rawInput);
  const specification = resolveProductionSpecification(input.batchId, specificationLayer);

  const assets = specification.assetSpecifications
    .map((entry) => buildInitialAssetExecutionEntry(entry, registry))
    .sort(compareAssetsByCreationOrder);
  const hydratedAssets = hydrateDependencyStatuses(assets);

  const recordBase = deepFreeze({
    schemaId: assetAuthoringBatchRecordSchemaId,
    recordId: `${specification.batchId}_AUTHORING_BATCH_RECORD_001`,
    batchId: specification.batchId,
    specificationId: specification.specificationId,
    assetList: deepFreeze(hydratedAssets.map((entry) => entry.assetId)),
    assets: hydratedAssets,
    dependencyStatus: buildDependencySummary(hydratedAssets),
    validationStatus: buildValidationSummary(hydratedAssets),
    completionPercentage: calculateCompletionPercentage(hydratedAssets),
    summary: deepFreeze({
      totalAssets: hydratedAssets.length,
      completeAssets: hydratedAssets.filter((entry) => entry.assetState === "COMPLETE").length,
      blockedAssets: hydratedAssets.filter((entry) => entry.dependencyStatus === "BLOCKED").length
    }),
    validation: null
  });

  const validation = buildBatchExecutionValidation(recordBase, specificationLayer, registry);
  const record = deepFreeze({
    ...recordBase,
    validation
  });

  const checked = validateAssetAuthoringBatchRecord(record);
  if (!checked.ok) {
    throw createBatchExecutionError(checked.errorCode, checked.message);
  }

  return record;
}

function advanceAssetAuthoringBatchRecord(
  rawRecord,
  assetId,
  targetState,
  specificationLayer,
  registry
) {
  const checked = validateAssetAuthoringBatchRecord(rawRecord);
  if (!checked.ok) {
    throw createBatchExecutionError(checked.errorCode, checked.message);
  }

  const normalizedAssetId = normalizeString(assetId);
  const normalizedTargetState = normalizeState(targetState);
  const specification = resolveProductionSpecification(rawRecord.batchId, specificationLayer);

  const currentEntry = rawRecord.assets.find((entry) => entry.assetId === normalizedAssetId);
  if (!currentEntry) {
    throw createBatchExecutionError(
      "missing_asset_authoring_batch_asset",
      `Asset ${normalizedAssetId} does not exist in batch ${rawRecord.batchId}.`
    );
  }

  if (currentEntry.dependencyStatus === "BLOCKED" && normalizedTargetState !== "READY") {
    throw createBatchExecutionError(
      "blocked_asset_authoring_batch_state_transition",
      `Asset ${normalizedAssetId} is blocked by dependencies and cannot advance to ${normalizedTargetState}.`
    );
  }

  if (!allowedStateTransitions[currentEntry.assetState].includes(normalizedTargetState)) {
    throw createBatchExecutionError(
      "invalid_asset_authoring_batch_state_transition",
      `Cannot transition asset ${normalizedAssetId} from ${currentEntry.assetState} to ${normalizedTargetState}.`
    );
  }

  if (normalizedTargetState === "COMPLETE" && currentEntry.validationStatus !== "READY_FOR_REVIEW") {
    throw createBatchExecutionError(
      "invalid_asset_authoring_batch_validation_gate",
      `Asset ${normalizedAssetId} must reach READY_FOR_REVIEW before completion.`
    );
  }

  const updatedAssets = rawRecord.assets.map((entry) => {
    if (entry.assetId !== normalizedAssetId) {
      return deepFreeze(structuredClone(entry));
    }

    const nextHistory = deepFreeze([...entry.transitionHistory, normalizedTargetState]);
    return deepFreeze({
      ...structuredClone(entry),
      assetState: normalizedTargetState,
      transitionHistory: nextHistory,
      validationStatus: deriveAssetValidationStatus(normalizedTargetState),
      dependencyStatus: entry.dependencyStatus
    });
  });

  const hydratedAssets = hydrateDependencyStatuses(updatedAssets);
  const recordBase = deepFreeze({
    ...structuredClone(rawRecord),
    assetList: deepFreeze(hydratedAssets.map((entry) => entry.assetId)),
    assets: hydratedAssets,
    dependencyStatus: buildDependencySummary(hydratedAssets),
    validationStatus: buildValidationSummary(hydratedAssets),
    completionPercentage: calculateCompletionPercentage(hydratedAssets),
    summary: deepFreeze({
      totalAssets: hydratedAssets.length,
      completeAssets: hydratedAssets.filter((entry) => entry.assetState === "COMPLETE").length,
      blockedAssets: hydratedAssets.filter((entry) => entry.dependencyStatus === "BLOCKED").length
    }),
    validation: null
  });

  const validation = buildBatchExecutionValidation(recordBase, specificationLayer, registry);
  const advanced = deepFreeze({
    ...recordBase,
    validation
  });

  const validated = validateAssetAuthoringBatchRecord(advanced);
  if (!validated.ok) {
    throw createBatchExecutionError(validated.errorCode, validated.message);
  }

  return advanced;
}

function buildInitialAssetExecutionEntry(specificationEntry, registry) {
  const registeredAsset = registry.getAssetById(specificationEntry.assetId);
  if (!registeredAsset) {
    throw createBatchExecutionError(
      "missing_asset_authoring_batch_registry_asset",
      `Asset ${specificationEntry.assetId} is not registered for batch execution.`
    );
  }

  const initialState =
    specificationEntry.creationStage === "FOUNDATION_ASSETS" ? "READY" : "NOT_STARTED";
  const transitionHistory = deepFreeze([initialState]);

  return deepFreeze({
    assetId: specificationEntry.assetId,
    specificationId: specificationEntry.workPackageId,
    recipeId: specificationEntry.recipeId,
    creationStage: specificationEntry.creationStage,
    creationOrder: specificationEntry.creationOrder,
    dependencyTargets: deepFreeze([...specificationEntry.dependencyTargets]),
    assetState: initialState,
    dependencyStatus: specificationEntry.dependencyTargets.length === 0 ? "CLEAR" : "BLOCKED",
    validationStatus: deriveAssetValidationStatus(initialState),
    transitionHistory,
    variants: deepFreeze([...specificationEntry.variants]),
    lodRequirements: deepFreeze([...specificationEntry.lodRequirements]),
    performanceBudget: structuredClone(specificationEntry.performanceBudget),
    validationRequirements: deepFreeze([...specificationEntry.validationRequirements]),
    metadata: deepFreeze({
      batchStage: specificationEntry.creationStage,
      assetType: specificationEntry.metadata.assetType,
      assetFamily: specificationEntry.metadata.assetFamily
    })
  });
}

function hydrateDependencyStatuses(rawAssets) {
  const assetsById = new Map(rawAssets.map((entry) => [entry.assetId, entry]));

  return deepFreeze(
    rawAssets
      .map((entry) => {
        const blockedBy = entry.dependencyTargets.filter(
          (targetId) => assetsById.get(targetId)?.assetState !== "COMPLETE"
        );
        const dependencyStatus = blockedBy.length === 0 ? "CLEAR" : "BLOCKED";

        let assetState = entry.assetState;
        let transitionHistory = [...entry.transitionHistory];

        if (assetState === "NOT_STARTED" && dependencyStatus === "CLEAR") {
          assetState = "READY";
          transitionHistory = [...transitionHistory, "READY"];
        }

        return deepFreeze({
          ...structuredClone(entry),
          assetState,
          dependencyStatus,
          blockedBy: deepFreeze(blockedBy),
          validationStatus: deriveAssetValidationStatus(assetState),
          transitionHistory: deepFreeze(transitionHistory)
        });
      })
      .sort(compareAssetsByCreationOrder)
  );
}

function buildDependencySummary(assets) {
  return deepFreeze({
    clearCount: assets.filter((entry) => entry.dependencyStatus === "CLEAR").length,
    blockedCount: assets.filter((entry) => entry.dependencyStatus === "BLOCKED").length
  });
}

function buildValidationSummary(assets) {
  const passedCount = assets.filter((entry) => entry.validationStatus === "PASSED").length;
  const readyForReviewCount = assets.filter(
    (entry) => entry.validationStatus === "READY_FOR_REVIEW"
  ).length;

  return deepFreeze({
    pendingCount: assets.length - passedCount - readyForReviewCount,
    readyForReviewCount,
    passedCount
  });
}

function calculateCompletionPercentage(assets) {
  const total = assets.reduce((sum, entry) => sum + progressWeights[entry.assetState], 0);
  return Math.round(total / assets.length);
}

function buildBatchExecutionValidation(record, specificationLayer, registry) {
  const specification = specificationLayer.specification;
  const specificationExists = specification?.batchId === record.batchId;
  const assetIdsValid = record.assetList.every((assetId) => registry.getAssetById(assetId) !== null);
  const dependencyOrderValid = record.assets.every((entry) => {
    const blocking = entry.dependencyTargets.filter((targetId) => {
      const dependencyAsset = record.assets.find((asset) => asset.assetId === targetId);
      return dependencyAsset?.assetState !== "COMPLETE";
    });
    if (blocking.length === 0) {
      return true;
    }
    return entry.assetState === "NOT_STARTED" || entry.assetState === "READY";
  });
  const stateTransitionsValid = record.assets.every((entry) =>
    entry.transitionHistory.every((state, index, history) => {
      if (index === 0) {
        return assetAuthoringBatchStates.includes(state);
      }
      const previous = history[index - 1];
      return (
        previous === state ||
        (previous === "NOT_STARTED" && state === "READY") ||
        allowedStateTransitions[previous]?.includes(state)
      );
    })
  );
  const deterministicOutput = true;
  const validationPassed =
    specificationExists &&
    assetIdsValid &&
    dependencyOrderValid &&
    stateTransitionsValid &&
    deterministicOutput;

  return deepFreeze({
    schemaId: assetAuthoringBatchValidationSchemaId,
    specificationExists,
    assetIdsValid,
    dependencyOrderValid,
    stateTransitionsValid,
    deterministicOutput,
    validationPassed,
    deterministicBatchExecutionHash: computeDeterministicHash(buildBatchRecordSignature(record))
  });
}

function buildBatchRecordSignature(record) {
  return [
    record.recordId,
    record.batchId,
    record.specificationId,
    record.assets.map((entry) => [
      entry.assetId,
      entry.assetState,
      entry.dependencyStatus,
      entry.validationStatus,
      entry.dependencyTargets,
      entry.transitionHistory
    ]),
    record.completionPercentage
  ];
}

function resolveProductionSpecification(batchId, specificationLayer) {
  if (specificationLayer.specification?.batchId !== batchId) {
    throw createBatchExecutionError(
      "missing_asset_authoring_batch_specification",
      `No production specification exists for batch ${batchId}.`
    );
  }
  return specificationLayer.specification;
}

function deriveAssetValidationStatus(state) {
  if (state === "VALIDATION_PENDING") {
    return "READY_FOR_REVIEW";
  }
  if (state === "COMPLETE") {
    return "PASSED";
  }
  return "PENDING";
}

function compareAssetsByCreationOrder(left, right) {
  if (left.creationOrder !== right.creationOrder) {
    return left.creationOrder - right.creationOrder;
  }
  return left.assetId.localeCompare(right.assetId);
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({ batchId: defaultBatchId });
  }

  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createBatchExecutionError(
      "invalid_asset_authoring_batch_execution_options",
      "Asset authoring batch execution options must be an object when provided."
    );
  }

  return deepFreeze({
    batchId: rawOptions.batchId ? normalizeString(rawOptions.batchId) : defaultBatchId
  });
}

function normalizeBatchInput(rawInput) {
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    throw createBatchExecutionError(
      "invalid_asset_authoring_batch_execution_input",
      "Asset authoring batch execution input must be an object."
    );
  }

  return deepFreeze({
    batchId: normalizeString(rawInput.batchId)
  });
}

function normalizeSpecificationLayer(rawLayer) {
  if (rawLayer?.schemaId !== "ASSET_PRODUCTION_SPECIFICATION_LAYER_001") {
    throw createBatchExecutionError(
      "invalid_asset_authoring_batch_execution_specification_layer",
      "Asset authoring batch execution layer requires a valid Asset Production Specification layer."
    );
  }
  return rawLayer;
}

function normalizeRegistry(rawRegistry) {
  if (rawRegistry?.schemaId !== "ASSET_FACTORY_REGISTRY_LAYER_001") {
    throw createBatchExecutionError(
      "invalid_asset_authoring_batch_execution_registry",
      "Asset authoring batch execution layer requires a valid Asset Factory registry layer."
    );
  }
  return rawRegistry;
}

function normalizeState(state) {
  const normalizedState = normalizeString(state);
  if (!assetAuthoringBatchStates.includes(normalizedState)) {
    throw createBatchExecutionError(
      "invalid_asset_authoring_batch_execution_state",
      `Unsupported batch execution state ${normalizedState}.`
    );
  }
  return normalizedState;
}

function normalizeString(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createBatchExecutionError(
      "invalid_asset_authoring_batch_execution_string",
      "Expected a non-empty string."
    );
  }
  return value.trim().toUpperCase();
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createBatchExecutionError(code, message) {
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
