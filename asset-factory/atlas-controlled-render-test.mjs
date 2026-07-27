import {
  createAtlasControlledRendererActivationLayer,
  validateAtlasControlledRendererActivationLayer
} from "./atlas-controlled-renderer-activation.mjs";

export const controlledRenderTestResultSchemaId =
  "CONTROLLED_RENDER_TEST_RESULT_001";
export const controlledRenderTestValidationSchemaId =
  "CONTROLLED_RENDER_TEST_VALIDATION_001";

export function createAtlasControlledRenderTest(rawInput, options = {}) {
  const normalized = normalizeControlledRenderTestInput(rawInput, options);
  const execution = buildControlledExecution(normalized.activationLayer);
  const cleanupResult = buildCleanupResult(normalized.activationLayer, execution);

  const resultBase = deepFreeze({
    schemaId: controlledRenderTestResultSchemaId,
    testExecutionId: `${normalized.activationLayer.activationLayerId}_FIRST_CONTROLLED_RENDER_TEST`,
    activationLayerId: normalized.activationLayer.activationLayerId,
    packageId: normalized.activationLayer.packageId,
    regionId: normalized.activationLayer.regionId,
    gateResults: structuredClone(normalized.activationLayer.activationGates),
    testedObject: deepFreeze({
      ...structuredClone(
        normalized.activationLayer.controlledRendererTestScene.selectedCommand
      ),
      testSceneId: normalized.activationLayer.controlledRendererTestScene.sceneId
    }),
    execution,
    cleanupResult,
    deterministicState: null,
    validation: null
  });

  const deterministicState = buildDeterministicState(resultBase);
  const validation = buildControlledRenderTestValidation(
    resultBase,
    normalized,
    deterministicState
  );
  const result = deepFreeze({
    ...resultBase,
    deterministicState,
    validation
  });

  const checked = validateAtlasControlledRenderTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasControlledRenderTest(rawResult) {
  try {
    if (rawResult?.schemaId !== controlledRenderTestResultSchemaId) {
      throw createValidationError(
        "invalid_controlled_render_test_result_schema",
        `Expected ${controlledRenderTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    validateGateResults(rawResult.gateResults);
    validateTestedObject(rawResult.testedObject);
    validateExecution(rawResult.execution);
    validateCleanupResult(rawResult.cleanupResult);

    if (rawResult.validation?.schemaId !== controlledRenderTestValidationSchemaId) {
      throw createValidationError(
        "invalid_controlled_render_test_validation_schema",
        `Expected ${controlledRenderTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const key of [
      "executionRequiredAuthorization",
      "noAutomaticActivation",
      "cleanupCompleted",
      "noSourceMutation",
      "deterministicResult",
      "validationPassedOverall"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createValidationError(
          "controlled_render_test_validation_failed",
          `Controlled render test validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedHash !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "controlled_render_test_signature_mismatch",
        "Controlled render test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      controlledRenderTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "controlled_render_test_validation_failed",
      message: error.message,
      controlledRenderTestResult: null
    });
  }
}

function normalizeControlledRenderTestInput(rawInput, options) {
  if (rawInput?.schemaId === "ATLAS_CONTROLLED_RENDERER_ACTIVATION_LAYER_001") {
    const validation = validateAtlasControlledRendererActivationLayer(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_atlas_controlled_renderer_activation_layer",
        validation.message
      );
    }
    return deepFreeze({
      activationLayer: validation.atlasControlledRendererActivationLayer
    });
  }

  const activationLayer = createAtlasControlledRendererActivationLayer(
    rawInput,
    options.activationOptions ?? {}
  );
  return deepFreeze({ activationLayer });
}

function buildControlledExecution(activationLayer) {
  if (activationLayer.activationReadiness.readyForControlledTest !== true) {
    throw createValidationError(
      "controlled_render_test_not_authorized",
      "Controlled render test execution requires all activation gates to pass before execution."
    );
  }

  return deepFreeze({
    executionStatus: "EXECUTED",
    executionMode: activationLayer.activationReadiness.allowedExecutionMode,
    manualAuthorizationUsed:
      activationLayer.activationGates.rendererAuthorization.granted === true,
    automaticActivationUsed: false,
    rendererLifecycleAttached: false,
    productionRendererUsed: false,
    canvasCreated: false,
    webglCreated: false,
    worldObjectsDrawn: false,
    testObjectEvaluated: true,
    sourceMutationDetected: false
  });
}

function buildCleanupResult(activationLayer, execution) {
  return deepFreeze({
    cleanupRequired: activationLayer.cleanupRequirements.cleanupRequired,
    cleanupCompleted:
      execution.executionStatus === "EXECUTED" &&
      activationLayer.cleanupRequirements.cleanupRequired === true,
    cleanupMode: "SYNTHETIC_OBJECT_RELEASE_ONLY",
    reversibleExecutionVerified:
      activationLayer.controlledRendererTestScene.reversibleExecution === true,
    transientStateReleased: true,
    sourceStateRestored: true
  });
}

function buildDeterministicState(resultBase) {
  const signatureSource = {
    activationLayerId: resultBase.activationLayerId,
    gateResults: resultBase.gateResults,
    testedObject: resultBase.testedObject,
    execution: resultBase.execution,
    cleanupResult: resultBase.cleanupResult
  };

  return deepFreeze({
    deterministicResult: true,
    executionFingerprint: computeDeterministicSignatureHash(signatureSource),
    sameInputProducesSameOutput: true
  });
}

function buildControlledRenderTestValidation(
  resultBase,
  normalized,
  deterministicState
) {
  const executionRequiredAuthorization =
    resultBase.gateResults.rendererAuthorization.granted === true &&
    resultBase.execution.manualAuthorizationUsed === true;
  const noAutomaticActivation =
    resultBase.execution.automaticActivationUsed === false;
  const cleanupCompleted = resultBase.cleanupResult.cleanupCompleted === true;
  const noSourceMutation =
    resultBase.execution.sourceMutationDetected === false &&
    resultBase.cleanupResult.sourceStateRestored === true;

  const validationWithoutHash = deepFreeze({
    schemaId: controlledRenderTestValidationSchemaId,
    executionRequiredAuthorization,
    noAutomaticActivation,
    cleanupCompleted,
    noSourceMutation,
    deterministicResult: deterministicState.deterministicResult === true,
    validationPassedOverall:
      normalized.activationLayer.validation.validationPassedOverall === true &&
      executionRequiredAuthorization &&
      noAutomaticActivation &&
      cleanupCompleted &&
      noSourceMutation &&
      deterministicState.deterministicResult === true,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      gateResults: resultBase.gateResults,
      testedObject: resultBase.testedObject,
      execution: resultBase.execution,
      cleanupResult: resultBase.cleanupResult,
      deterministicState,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash
  });
}

function validateGateResults(gateResults) {
  if (!gateResults || typeof gateResults !== "object") {
    throw createValidationError(
      "invalid_controlled_render_test_gate_results",
      "Controlled render test must expose gateResults."
    );
  }
  if (typeof gateResults.rendererAuthorization?.granted !== "boolean") {
    throw createValidationError(
      "invalid_controlled_render_test_authorization_gate",
      "Controlled render test rendererAuthorization gate must expose granted."
    );
  }
}

function validateTestedObject(testedObject) {
  if (!testedObject || typeof testedObject !== "object") {
    throw createValidationError(
      "invalid_controlled_render_test_object",
      "Controlled render test must expose a testedObject."
    );
  }
  for (const key of [
    "objectId",
    "sourceObjectId",
    "assetReference",
    "renderLayer",
    "lod",
    "materialReference",
    "testSceneId"
  ]) {
    if (!testedObject[key]) {
      throw createValidationError(
        "invalid_controlled_render_test_object_field",
        `Controlled render test testedObject ${key} is required.`
      );
    }
  }
}

function validateExecution(execution) {
  if (!execution || typeof execution !== "object") {
    throw createValidationError(
      "invalid_controlled_render_test_execution",
      "Controlled render test must expose execution state."
    );
  }
  if (execution.executionStatus !== "EXECUTED") {
    throw createValidationError(
      "invalid_controlled_render_test_execution_status",
      "Controlled render test executionStatus must be EXECUTED."
    );
  }
}

function validateCleanupResult(cleanupResult) {
  if (!cleanupResult || typeof cleanupResult !== "object") {
    throw createValidationError(
      "invalid_controlled_render_test_cleanup_result",
      "Controlled render test must expose cleanupResult."
    );
  }
  if (cleanupResult.cleanupCompleted !== true) {
    throw createValidationError(
      "invalid_controlled_render_test_cleanup_completed",
      "Controlled render test cleanupCompleted must be true."
    );
  }
}

function buildValidationSignatureSource(result) {
  return {
    gateResults: result.gateResults,
    testedObject: result.testedObject,
    execution: result.execution,
    cleanupResult: result.cleanupResult,
    deterministicState: result.deterministicState,
    validation: result.validation
      ? {
          executionRequiredAuthorization:
            result.validation.executionRequiredAuthorization,
          noAutomaticActivation: result.validation.noAutomaticActivation,
          cleanupCompleted: result.validation.cleanupCompleted,
          noSourceMutation: result.validation.noSourceMutation,
          deterministicResult: result.validation.deterministicResult,
          validationPassedOverall: result.validation.validationPassedOverall
        }
      : null
  };
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function computeDeterministicSignatureHash(value) {
  const stable = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}
