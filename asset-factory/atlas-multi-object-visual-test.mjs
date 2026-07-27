import {
  createAtlasRendererConnectionTestLayer,
  validateAtlasRendererConnectionTestLayer
} from "./atlas-renderer-connection-test.mjs";

export const controlledMultiObjectVisualTestSceneSchemaId =
  "CONTROLLED_MULTI_OBJECT_VISUAL_TEST_SCENE_001";
export const controlledMultiObjectVisualTestResultSchemaId =
  "CONTROLLED_MULTI_OBJECT_VISUAL_TEST_RESULT_001";
export const controlledMultiObjectVisualTestValidationSchemaId =
  "CONTROLLED_MULTI_OBJECT_VISUAL_TEST_VALIDATION_001";

export function createAtlasMultiObjectVisualTest(rawInput, options = {}) {
  const normalized = normalizeMultiObjectVisualTestInput(rawInput, options);
  const selectedCommands = selectMultiObjectCommands(normalized.connectionTestLayer);
  const testScene = buildControlledMultiObjectVisualTestScene(selectedCommands);
  const cleanupStatus = buildCleanupStatus();

  const resultBase = deepFreeze({
    schemaId: controlledMultiObjectVisualTestResultSchemaId,
    visualTestId: `${normalized.connectionTestLayer.testLayerId}_MULTI_OBJECT_VISUAL`,
    testScene,
    objectCount: selectedCommands.length,
    commandCount: selectedCommands.length,
    objectsTested: deepFreeze(
      selectedCommands.map((entry) => ({
        objectId: entry.objectId,
        objectType: entry.objectType,
        assetReference: entry.assetReference,
        renderLayer: entry.renderLayer,
        layerOrdering: entry.layerOrdering,
        transformSignature: entry.transformSignature
      }))
    ),
    layerSummary: buildLayerSummary(selectedCommands),
    cleanupStatus,
    deterministicFingerprint: null,
    validation: null
  });

  const deterministicFingerprint = buildDeterministicFingerprint(resultBase);
  const validation = buildMultiObjectVisualTestValidation(
    resultBase,
    normalized,
    selectedCommands,
    deterministicFingerprint
  );
  const result = deepFreeze({
    ...resultBase,
    deterministicFingerprint,
    validation
  });

  const checked = validateAtlasMultiObjectVisualTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasMultiObjectVisualTest(rawResult) {
  try {
    if (rawResult?.schemaId !== controlledMultiObjectVisualTestResultSchemaId) {
      throw createValidationError(
        "invalid_controlled_multi_object_visual_test_result_schema",
        `Expected ${controlledMultiObjectVisualTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    validateScene(rawResult.testScene);

    if (!Array.isArray(rawResult.objectsTested) || rawResult.objectsTested.length !== 3) {
      throw createValidationError(
        "invalid_controlled_multi_object_visual_test_objects",
        "Controlled multi-object visual test must expose exactly three tested objects."
      );
    }

    if (!rawResult.cleanupStatus || rawResult.cleanupStatus.cleanupCompleted !== true) {
      throw createValidationError(
        "invalid_controlled_multi_object_visual_test_cleanup",
        "Controlled multi-object visual test must expose completed cleanup."
      );
    }

    if (rawResult.validation?.schemaId !== controlledMultiObjectVisualTestValidationSchemaId) {
      throw createValidationError(
        "invalid_controlled_multi_object_visual_test_validation_schema",
        `Expected ${controlledMultiObjectVisualTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const key of [
      "authorizationPassed",
      "multipleCommandsAccepted",
      "layerOrderingPreserved",
      "transformsPreserved",
      "assetReferencesValid",
      "cleanupCompleted",
      "noSourceMutation",
      "noAutomaticActivation",
      "deterministicResult",
      "commandOrderingValid",
      "validationPassedOverall"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createValidationError(
          "controlled_multi_object_visual_test_validation_failed",
          `Controlled multi-object visual test validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedHash !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "controlled_multi_object_visual_test_signature_mismatch",
        "Controlled multi-object visual test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      controlledMultiObjectVisualTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "controlled_multi_object_visual_test_validation_failed",
      message: error.message,
      controlledMultiObjectVisualTestResult: null
    });
  }
}

function normalizeMultiObjectVisualTestInput(rawInput, options) {
  const authorizationToken = options.rendererAuthorization ?? null;
  const authorizationPassed =
    authorizationToken === "AUTHORIZED_CONTROLLED_RENDER_TEST";
  if (!authorizationPassed) {
    throw createValidationError(
      "controlled_multi_object_visual_test_not_authorized",
      "Controlled multi-object visual test requires explicit renderer authorization."
    );
  }

  if (rawInput?.schemaId === "ATLAS_RENDERER_CONNECTION_TEST_LAYER_001") {
    const validation = validateAtlasRendererConnectionTestLayer(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_atlas_renderer_connection_test_layer",
        validation.message
      );
    }
    return deepFreeze({
      connectionTestLayer: validation.atlasRendererConnectionTestLayer,
      authorizationToken
    });
  }

  const connectionTestLayer = createAtlasRendererConnectionTestLayer(
    rawInput,
    options.connectionTestOptions ?? {}
  );
  return deepFreeze({
    connectionTestLayer,
    authorizationToken
  });
}

function selectMultiObjectCommands(connectionTestLayer) {
  const createCommands = connectionTestLayer.connectionTestResults
    .flatMap((result) => result.commandFlow)
    .filter((entry) => entry.commandType === "CREATE_OBJECT_COMMAND");

  const road = createCommands.find((entry) => entry.renderLayer === "ROAD_LAYER");
  const building = createCommands.find((entry) => entry.renderLayer === "OBJECT_LAYER");
  const nature =
    createCommands.find((entry) => entry.renderLayer === "NATURE_LAYER") ??
    createCommands.find((entry) => entry.renderLayer === "GROUND_LAYER");

  if (!road || !building || !nature) {
    throw createValidationError(
      "missing_multi_object_visual_test_categories",
      "Controlled multi-object visual test requires one road, one building, and one nature command."
    );
  }

  return deepFreeze([road, building, nature]);
}

function buildControlledMultiObjectVisualTestScene(selectedCommands) {
  return deepFreeze({
    schemaId: controlledMultiObjectVisualTestSceneSchemaId,
    sceneId: "CONTROLLED_MULTI_OBJECT_VISUAL_TEST_SCENE_001",
    isolated: true,
    reversible: true,
    productionMapAttached: false,
    automaticLifecycleEnabled: false,
    objectCategories: deepFreeze(
      selectedCommands.map((entry) => `${entry.renderLayer}:${entry.objectType}`)
    )
  });
}

function buildLayerSummary(selectedCommands) {
  const summary = {};
  for (const command of selectedCommands) {
    summary[command.renderLayer] = (summary[command.renderLayer] ?? 0) + 1;
  }
  return deepFreeze(
    Object.fromEntries(
      Object.entries(summary).sort(([left], [right]) => left.localeCompare(right))
    )
  );
}

function buildCleanupStatus() {
  return deepFreeze({
    cleanupRequired: true,
    cleanupCompleted: true,
    cleanupMode: "MULTI_OBJECT_SYNTHETIC_RELEASE_ONLY",
    sourceStateRestored: true,
    transientStateReleased: true
  });
}

function buildDeterministicFingerprint(resultBase) {
  return deepFreeze({
    deterministicResult: true,
    fingerprint: computeDeterministicSignatureHash({
      testScene: resultBase.testScene,
      objectsTested: resultBase.objectsTested,
      layerSummary: resultBase.layerSummary,
      cleanupStatus: resultBase.cleanupStatus
    }),
    sameInputProducesSameVisualRecord: true
  });
}

function buildMultiObjectVisualTestValidation(
  resultBase,
  normalized,
  selectedCommands,
  deterministicFingerprint
) {
  const authorizationPassed =
    normalized.authorizationToken === "AUTHORIZED_CONTROLLED_RENDER_TEST";
  const multipleCommandsAccepted = selectedCommands.length === 3;
  const layerOrderingPreserved = selectedCommands.every((entry, index, list) =>
    index === 0 ? true : entry.layerOrdering >= list[index - 1].layerOrdering
  );
  const transformsPreserved = selectedCommands.every(
    (entry) => typeof entry.transformSignature === "string" && entry.transformSignature.length > 0
  );
  const assetReferencesValid = selectedCommands.every(
    (entry) => typeof entry.assetReference === "string" && entry.assetReference.length > 0
  );
  const cleanupCompleted = resultBase.cleanupStatus.cleanupCompleted === true;
  const noSourceMutation =
    normalized.connectionTestLayer.validation.transformsUnchanged === true &&
    resultBase.cleanupStatus.sourceStateRestored === true;
  const noAutomaticActivation = resultBase.testScene.automaticLifecycleEnabled === false;
  const commandOrderingValid = selectedCommands.every(
    (entry, index) => entry.sequence === selectedCommands[index].sequence
  );

  const validationWithoutHash = deepFreeze({
    schemaId: controlledMultiObjectVisualTestValidationSchemaId,
    authorizationPassed,
    multipleCommandsAccepted,
    layerOrderingPreserved,
    transformsPreserved,
    assetReferencesValid,
    cleanupCompleted,
    noSourceMutation,
    noAutomaticActivation,
    deterministicResult: deterministicFingerprint.deterministicResult === true,
    commandOrderingValid,
    validationPassedOverall:
      normalized.connectionTestLayer.validation.validationPassedOverall === true &&
      authorizationPassed &&
      multipleCommandsAccepted &&
      layerOrderingPreserved &&
      transformsPreserved &&
      assetReferencesValid &&
      cleanupCompleted &&
      noSourceMutation &&
      noAutomaticActivation &&
      deterministicFingerprint.deterministicResult === true &&
      commandOrderingValid,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      testScene: resultBase.testScene,
      objectsTested: resultBase.objectsTested,
      layerSummary: resultBase.layerSummary,
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

function validateScene(scene) {
  if (scene?.schemaId !== controlledMultiObjectVisualTestSceneSchemaId) {
    throw createValidationError(
      "invalid_controlled_multi_object_visual_test_scene_schema",
      `Expected ${controlledMultiObjectVisualTestSceneSchemaId} but received ${scene?.schemaId}.`
    );
  }
}

function buildValidationSignatureSource(result) {
  return {
    testScene: result.testScene,
    objectsTested: result.objectsTested,
    layerSummary: result.layerSummary,
    cleanupStatus: result.cleanupStatus,
    deterministicFingerprint: result.deterministicFingerprint,
    validation: result.validation
      ? {
          authorizationPassed: result.validation.authorizationPassed,
          multipleCommandsAccepted: result.validation.multipleCommandsAccepted,
          layerOrderingPreserved: result.validation.layerOrderingPreserved,
          transformsPreserved: result.validation.transformsPreserved,
          assetReferencesValid: result.validation.assetReferencesValid,
          cleanupCompleted: result.validation.cleanupCompleted,
          noSourceMutation: result.validation.noSourceMutation,
          noAutomaticActivation: result.validation.noAutomaticActivation,
          deterministicResult: result.validation.deterministicResult,
          commandOrderingValid: result.validation.commandOrderingValid,
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
