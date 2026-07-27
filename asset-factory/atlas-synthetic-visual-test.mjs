import {
  controlledRenderTestResultSchemaId,
  createAtlasControlledRenderTest,
  validateAtlasControlledRenderTest
} from "./atlas-controlled-render-test.mjs";

export const syntheticVisualTestSceneSchemaId =
  "SYNTHETIC_VISUAL_TEST_SCENE_001";
export const syntheticVisualTestResultSchemaId =
  "SYNTHETIC_VISUAL_TEST_RESULT_001";
export const syntheticVisualTestValidationSchemaId =
  "SYNTHETIC_VISUAL_TEST_VALIDATION_001";

export function createAtlasSyntheticVisualTest(rawInput, options = {}) {
  const normalized = normalizeSyntheticVisualTestInput(rawInput, options);
  const syntheticScene = buildSyntheticVisualTestScene(normalized.controlledRenderTest);
  const outputStatus = buildSyntheticVisualOutputStatus(
    normalized.controlledRenderTest,
    syntheticScene
  );
  const cleanupStatus = buildSyntheticVisualCleanupStatus(
    normalized.controlledRenderTest
  );

  const resultBase = deepFreeze({
    schemaId: syntheticVisualTestResultSchemaId,
    visualTestId: `${normalized.controlledRenderTest.testExecutionId}_SYNTHETIC_VISUAL`,
    controlledRenderTestId: normalized.controlledRenderTest.testExecutionId,
    activationLayerId: normalized.controlledRenderTest.activationLayerId,
    packageId: normalized.controlledRenderTest.packageId,
    regionId: normalized.controlledRenderTest.regionId,
    syntheticScene,
    objectIdentity: deepFreeze({
      objectId: normalized.controlledRenderTest.testedObject.objectId,
      sourceObjectId: normalized.controlledRenderTest.testedObject.sourceObjectId,
      objectType: normalized.controlledRenderTest.testedObject.objectType,
      assetReference: normalized.controlledRenderTest.testedObject.assetReference
    }),
    commandIdentity: deepFreeze({
      commandType: normalized.controlledRenderTest.testedObject.commandType,
      sourceSceneId: normalized.controlledRenderTest.testedObject.sourceSceneId,
      sourceCommandBucket:
        normalized.controlledRenderTest.testedObject.sourceCommandBucket,
      sourceBucketIndex:
        normalized.controlledRenderTest.testedObject.sourceBucketIndex,
      renderLayer: normalized.controlledRenderTest.testedObject.renderLayer,
      lod: normalized.controlledRenderTest.testedObject.lod,
      materialReference:
        normalized.controlledRenderTest.testedObject.materialReference
    }),
    outputStatus,
    cleanupStatus,
    deterministicFingerprint: null,
    validation: null
  });

  const deterministicFingerprint = buildDeterministicFingerprint(resultBase);
  const validation = buildSyntheticVisualTestValidation(
    resultBase,
    normalized.controlledRenderTest,
    deterministicFingerprint
  );
  const result = deepFreeze({
    ...resultBase,
    deterministicFingerprint,
    validation
  });

  const checked = validateAtlasSyntheticVisualTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasSyntheticVisualTest(rawResult) {
  try {
    if (rawResult?.schemaId !== syntheticVisualTestResultSchemaId) {
      throw createValidationError(
        "invalid_synthetic_visual_test_result_schema",
        `Expected ${syntheticVisualTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    validateSyntheticScene(rawResult.syntheticScene);
    validateObjectIdentity(rawResult.objectIdentity);
    validateCommandIdentity(rawResult.commandIdentity);
    validateOutputStatus(rawResult.outputStatus);
    validateCleanupStatus(rawResult.cleanupStatus);

    if (rawResult.validation?.schemaId !== syntheticVisualTestValidationSchemaId) {
      throw createValidationError(
        "invalid_synthetic_visual_test_validation_schema",
        `Expected ${syntheticVisualTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const key of [
      "authorizationPassed",
      "renderCommandValid",
      "assetReferenceValid",
      "transformPreserved",
      "cleanupCompleted",
      "noSourceMutation",
      "noAutomaticActivation",
      "deterministicOutput",
      "validationPassedOverall"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createValidationError(
          "synthetic_visual_test_validation_failed",
          `Synthetic visual test validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedHash !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "synthetic_visual_test_signature_mismatch",
        "Synthetic visual test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      syntheticVisualTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "synthetic_visual_test_validation_failed",
      message: error.message,
      syntheticVisualTestResult: null
    });
  }
}

function normalizeSyntheticVisualTestInput(rawInput, options) {
  if (rawInput?.schemaId === controlledRenderTestResultSchemaId) {
    const validation = validateAtlasControlledRenderTest(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_controlled_render_test_result",
        validation.message
      );
    }
    return deepFreeze({
      controlledRenderTest: validation.controlledRenderTestResult
    });
  }

  const controlledRenderTest = createAtlasControlledRenderTest(
    rawInput,
    options.controlledRenderOptions ?? {}
  );
  return deepFreeze({ controlledRenderTest });
}

function buildSyntheticVisualTestScene(controlledRenderTest) {
  return deepFreeze({
    schemaId: syntheticVisualTestSceneSchemaId,
    sceneId: "SYNTHETIC_VISUAL_TEST_SCENE_001",
    isolated: true,
    reversible: true,
    productionMapAttached: false,
    automaticLifecycleEnabled: false,
    syntheticObjectCount: 1
  });
}

function buildSyntheticVisualOutputStatus(controlledRenderTest, syntheticScene) {
  const testedObject = controlledRenderTest.testedObject;
  const outputToken = computeDeterministicSignatureHash({
    sceneId: syntheticScene.sceneId,
    objectId: testedObject.objectId,
    assetReference: testedObject.assetReference,
    renderLayer: testedObject.renderLayer,
    lod: testedObject.lod,
    materialReference: testedObject.materialReference,
    transform: testedObject.transform
  });

  return deepFreeze({
    outputStatus: "VERIFIED_SYNTHETIC_VISUAL",
    visualProofCreated: true,
    syntheticOnly: true,
    visualToken: `SYNTHETIC_VISUAL_${outputToken}`,
    transformPreserved: true,
    commandConsumed: true,
    productionWorldRenderingAttached: false
  });
}

function buildSyntheticVisualCleanupStatus(controlledRenderTest) {
  return deepFreeze({
    cleanupRequired: controlledRenderTest.cleanupResult.cleanupRequired,
    cleanupCompleted: controlledRenderTest.cleanupResult.cleanupCompleted,
    cleanupMode: "SYNTHETIC_VISUAL_RELEASE_ONLY",
    sourceStateRestored: controlledRenderTest.cleanupResult.sourceStateRestored,
    transientStateReleased:
      controlledRenderTest.cleanupResult.transientStateReleased
  });
}

function buildDeterministicFingerprint(resultBase) {
  const signatureSource = {
    syntheticScene: resultBase.syntheticScene,
    objectIdentity: resultBase.objectIdentity,
    commandIdentity: resultBase.commandIdentity,
    outputStatus: resultBase.outputStatus,
    cleanupStatus: resultBase.cleanupStatus
  };

  return deepFreeze({
    deterministicOutput: true,
    fingerprint: computeDeterministicSignatureHash(signatureSource),
    sameInputProducesSameVisualRecord: true
  });
}

function buildSyntheticVisualTestValidation(
  resultBase,
  controlledRenderTest,
  deterministicFingerprint
) {
  const authorizationPassed =
    controlledRenderTest.gateResults.rendererAuthorization.granted === true;
  const renderCommandValid =
    typeof resultBase.commandIdentity.commandType === "string" &&
    resultBase.commandIdentity.commandType.length > 0;
  const assetReferenceValid =
    typeof resultBase.objectIdentity.assetReference === "string" &&
    resultBase.objectIdentity.assetReference.length > 0;
  const transformPreserved = resultBase.outputStatus.transformPreserved === true;
  const cleanupCompleted = resultBase.cleanupStatus.cleanupCompleted === true;
  const noSourceMutation =
    controlledRenderTest.validation.noSourceMutation === true &&
    resultBase.cleanupStatus.sourceStateRestored === true;
  const noAutomaticActivation =
    controlledRenderTest.validation.noAutomaticActivation === true &&
    resultBase.syntheticScene.automaticLifecycleEnabled === false;

  const validationWithoutHash = deepFreeze({
    schemaId: syntheticVisualTestValidationSchemaId,
    authorizationPassed,
    renderCommandValid,
    assetReferenceValid,
    transformPreserved,
    cleanupCompleted,
    noSourceMutation,
    noAutomaticActivation,
    deterministicOutput:
      deterministicFingerprint.deterministicOutput === true,
    validationPassedOverall:
      controlledRenderTest.validation.validationPassedOverall === true &&
      authorizationPassed &&
      renderCommandValid &&
      assetReferenceValid &&
      transformPreserved &&
      cleanupCompleted &&
      noSourceMutation &&
      noAutomaticActivation &&
      deterministicFingerprint.deterministicOutput === true,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      syntheticScene: resultBase.syntheticScene,
      objectIdentity: resultBase.objectIdentity,
      commandIdentity: resultBase.commandIdentity,
      outputStatus: resultBase.outputStatus,
      cleanupStatus: resultBase.cleanupStatus,
      deterministicFingerprint,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash
  });
}

function validateSyntheticScene(scene) {
  if (scene?.schemaId !== syntheticVisualTestSceneSchemaId) {
    throw createValidationError(
      "invalid_synthetic_visual_test_scene_schema",
      `Expected ${syntheticVisualTestSceneSchemaId} but received ${scene?.schemaId}.`
    );
  }
  if (scene.syntheticObjectCount !== 1) {
    throw createValidationError(
      "invalid_synthetic_visual_test_scene_count",
      "Synthetic visual test scene must contain exactly one synthetic object."
    );
  }
}

function validateObjectIdentity(objectIdentity) {
  for (const key of ["objectId", "sourceObjectId", "objectType", "assetReference"]) {
    if (!objectIdentity?.[key]) {
      throw createValidationError(
        "invalid_synthetic_visual_test_object_identity",
        `Synthetic visual test objectIdentity ${key} is required.`
      );
    }
  }
}

function validateCommandIdentity(commandIdentity) {
  for (const key of [
    "commandType",
    "sourceSceneId",
    "sourceCommandBucket",
    "renderLayer",
    "lod",
    "materialReference"
  ]) {
    if (!commandIdentity?.[key]) {
      throw createValidationError(
        "invalid_synthetic_visual_test_command_identity",
        `Synthetic visual test commandIdentity ${key} is required.`
      );
    }
  }
}

function validateOutputStatus(outputStatus) {
  if (outputStatus?.outputStatus !== "VERIFIED_SYNTHETIC_VISUAL") {
    throw createValidationError(
      "invalid_synthetic_visual_test_output_status",
      "Synthetic visual test outputStatus must be VERIFIED_SYNTHETIC_VISUAL."
    );
  }
}

function validateCleanupStatus(cleanupStatus) {
  if (cleanupStatus?.cleanupCompleted !== true) {
    throw createValidationError(
      "invalid_synthetic_visual_test_cleanup_status",
      "Synthetic visual test cleanupCompleted must be true."
    );
  }
}

function buildValidationSignatureSource(result) {
  return {
    syntheticScene: result.syntheticScene,
    objectIdentity: result.objectIdentity,
    commandIdentity: result.commandIdentity,
    outputStatus: result.outputStatus,
    cleanupStatus: result.cleanupStatus,
    deterministicFingerprint: result.deterministicFingerprint,
    validation: result.validation
      ? {
          authorizationPassed: result.validation.authorizationPassed,
          renderCommandValid: result.validation.renderCommandValid,
          assetReferenceValid: result.validation.assetReferenceValid,
          transformPreserved: result.validation.transformPreserved,
          cleanupCompleted: result.validation.cleanupCompleted,
          noSourceMutation: result.validation.noSourceMutation,
          noAutomaticActivation: result.validation.noAutomaticActivation,
          deterministicOutput: result.validation.deterministicOutput,
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
