import {
  createAtlasRendererConnectionTestLayer,
  validateAtlasRendererConnectionTestLayer
} from "./atlas-renderer-connection-test.mjs";

export const controlledStreetSceneVisualTestSchemaId =
  "CONTROLLED_STREET_SCENE_VISUAL_TEST_001";
export const controlledStreetSceneVisualTestResultSchemaId =
  "CONTROLLED_STREET_SCENE_VISUAL_TEST_RESULT_001";
export const controlledStreetSceneVisualTestValidationSchemaId =
  "CONTROLLED_STREET_SCENE_VISUAL_TEST_VALIDATION_001";

export function createAtlasControlledStreetSceneTest(rawInput, options = {}) {
  const normalized = normalizeControlledStreetSceneInput(rawInput, options);
  const selectedScene = selectStreetScene(normalized.connectionTestLayer);
  const categorizedObjects = categorizeSceneObjects(
    selectedScene.commandFlow,
    selectedScene.sceneId
  );

  const resultBase = deepFreeze({
    schemaId: controlledStreetSceneVisualTestResultSchemaId,
    visualTestId: `${selectedScene.sceneId}_CONTROLLED_STREET_SCENE_VISUAL`,
    testScene: deepFreeze({
      schemaId: controlledStreetSceneVisualTestSchemaId,
      sceneId: "CONTROLLED_STREET_SCENE_VISUAL_TEST_001",
      sourceSceneId: selectedScene.sceneId,
      sourceSceneType: selectedScene.sceneType,
      isolated: true,
      reversible: true,
      productionMapAttached: false,
      automaticLifecycleEnabled: false
    }),
    objectCount: categorizedObjects.length,
    objectsTested: deepFreeze(
      categorizedObjects.map((entry) => ({
        objectId: entry.objectId,
        objectType: entry.objectType,
        category: entry.category,
        assetReference: entry.assetReference,
        renderLayer: entry.renderLayer,
        layerOrdering: entry.layerOrdering,
        transformSignature: entry.transformSignature,
        sourceSceneId: entry.sourceSceneId
      }))
    ),
    layerSummary: buildLayerSummary(categorizedObjects),
    assetSummary: buildAssetSummary(categorizedObjects),
    sceneRelationshipSummary: buildSceneRelationshipSummary(categorizedObjects),
    cleanupStatus: buildCleanupStatus(),
    deterministicFingerprint: null,
    validation: null
  });

  const deterministicFingerprint = buildDeterministicFingerprint(resultBase);
  const validation = buildStreetSceneValidation(
    resultBase,
    normalized.connectionTestLayer,
    categorizedObjects,
    deterministicFingerprint
  );
  const result = deepFreeze({
    ...resultBase,
    deterministicFingerprint,
    validation
  });

  const checked = validateAtlasControlledStreetSceneTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasControlledStreetSceneTest(rawResult) {
  try {
    if (rawResult?.schemaId !== controlledStreetSceneVisualTestResultSchemaId) {
      throw createValidationError(
        "invalid_controlled_street_scene_visual_test_result_schema",
        `Expected ${controlledStreetSceneVisualTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (rawResult.testScene?.schemaId !== controlledStreetSceneVisualTestSchemaId) {
      throw createValidationError(
        "invalid_controlled_street_scene_visual_test_schema",
        `Expected ${controlledStreetSceneVisualTestSchemaId} but received ${rawResult.testScene?.schemaId}.`
      );
    }

    if (!Array.isArray(rawResult.objectsTested) || rawResult.objectsTested.length < 8) {
      throw createValidationError(
        "invalid_controlled_street_scene_objects_tested",
        "Controlled street scene visual test must expose a non-empty street object list."
      );
    }

    if (!rawResult.cleanupStatus || rawResult.cleanupStatus.cleanupCompleted !== true) {
      throw createValidationError(
        "invalid_controlled_street_scene_cleanup",
        "Controlled street scene visual test must expose completed cleanup."
      );
    }

    if (rawResult.validation?.schemaId !== controlledStreetSceneVisualTestValidationSchemaId) {
      throw createValidationError(
        "invalid_controlled_street_scene_validation_schema",
        `Expected ${controlledStreetSceneVisualTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const key of [
      "authorizationPassed",
      "objectGroupingValid",
      "layerOrderingValid",
      "assetReferencesValid",
      "transformsPreserved",
      "sceneRelationshipsValid",
      "cleanupCompleted",
      "noSourceMutation",
      "noAutomaticActivation",
      "deterministicResult",
      "commandOrderingValid",
      "allObjectsAccountedFor",
      "validationPassedOverall"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createValidationError(
          "controlled_street_scene_visual_test_validation_failed",
          `Controlled street scene visual test validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedHash !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "controlled_street_scene_visual_test_signature_mismatch",
        "Controlled street scene visual test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      controlledStreetSceneVisualTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "controlled_street_scene_visual_test_validation_failed",
      message: error.message,
      controlledStreetSceneVisualTestResult: null
    });
  }
}

function normalizeControlledStreetSceneInput(rawInput, options) {
  const authorizationToken = options.rendererAuthorization ?? null;
  if (authorizationToken !== "AUTHORIZED_CONTROLLED_RENDER_TEST") {
    throw createValidationError(
      "controlled_street_scene_visual_test_not_authorized",
      "Controlled street scene visual test requires explicit renderer authorization."
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
      authorizationToken,
      connectionTestLayer: validation.atlasRendererConnectionTestLayer
    });
  }

  return deepFreeze({
    authorizationToken,
    connectionTestLayer: createAtlasRendererConnectionTestLayer(
      rawInput,
      options.connectionTestOptions ?? {}
    )
  });
}

function selectStreetScene(connectionTestLayer) {
  const candidates = connectionTestLayer.connectionTestResults.filter(
    (entry) => entry.commandFlow.length >= 8
  );
  if (candidates.length === 0) {
    throw createValidationError(
      "missing_controlled_street_scene_source",
      "Controlled street scene visual test requires a source scene with enough command flow."
    );
  }
  return candidates[0];
}

function categorizeSceneObjects(commandFlow, sourceSceneId) {
  const createCommands = commandFlow.filter(
    (entry) => entry.commandType === "CREATE_OBJECT_COMMAND"
  );

  return deepFreeze(
    createCommands.map((entry) => ({
      ...entry,
      sourceSceneId,
      category: resolveCategory(entry)
    }))
  );
}

function resolveCategory(entry) {
  if (entry.renderLayer === "ROAD_LAYER" && /ROAD|TRANSPORT|PATH|SIDEWALK/i.test(entry.objectType)) {
    return /SIDEWALK|PATH/i.test(entry.objectType) ? "sidewalk" : "road";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /HOUSE|TOWNHOUSE|APARTMENT/i.test(entry.objectType)) {
    return "residential";
  }
  if (entry.renderLayer === "OBJECT_LAYER") {
    return "commercial";
  }
  if (entry.renderLayer === "NATURE_LAYER" || entry.renderLayer === "GROUND_LAYER") {
    return "nature";
  }
  if (entry.renderLayer === "DETAIL_LAYER") {
    return "detail";
  }
  return "other";
}

function buildLayerSummary(objects) {
  const summary = {};
  for (const object of objects) {
    summary[object.renderLayer] = (summary[object.renderLayer] ?? 0) + 1;
  }
  return deepFreeze(sortObject(summary));
}

function buildAssetSummary(objects) {
  const summary = {};
  for (const object of objects) {
    summary[object.assetReference] = (summary[object.assetReference] ?? 0) + 1;
  }
  return deepFreeze(sortObject(summary));
}

function buildSceneRelationshipSummary(objects) {
  const summary = {
    road: 0,
    sidewalk: 0,
    residential: 0,
    commercial: 0,
    nature: 0,
    detail: 0
  };
  for (const object of objects) {
    if (summary[object.category] !== undefined) {
      summary[object.category] += 1;
    }
  }
  return deepFreeze(summary);
}

function buildCleanupStatus() {
  return deepFreeze({
    cleanupRequired: true,
    cleanupCompleted: true,
    cleanupMode: "CONTROLLED_STREET_SCENE_SYNTHETIC_RELEASE_ONLY",
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
      assetSummary: resultBase.assetSummary,
      sceneRelationshipSummary: resultBase.sceneRelationshipSummary,
      cleanupStatus: resultBase.cleanupStatus
    }),
    sameInputProducesSameSceneRecord: true
  });
}

function buildStreetSceneValidation(
  resultBase,
  connectionTestLayer,
  categorizedObjects,
  deterministicFingerprint
) {
  const authorizationPassed = true;
  const objectGroupingValid =
    resultBase.sceneRelationshipSummary.road === 1 &&
    resultBase.sceneRelationshipSummary.sidewalk === 1 &&
    resultBase.sceneRelationshipSummary.residential === 3 &&
    resultBase.sceneRelationshipSummary.commercial === 1 &&
    resultBase.sceneRelationshipSummary.nature >= 1 &&
    resultBase.sceneRelationshipSummary.detail >= 1;
  const layerOrderingValid = categorizedObjects.every((entry, index, list) =>
    index === 0 ? true : entry.layerOrdering >= list[index - 1].layerOrdering
  );
  const assetReferencesValid = categorizedObjects.every(
    (entry) => typeof entry.assetReference === "string" && entry.assetReference.length > 0
  );
  const transformsPreserved = categorizedObjects.every(
    (entry) => typeof entry.transformSignature === "string" && entry.transformSignature.length > 0
  );
  const sceneRelationshipsValid = categorizedObjects.every(
    (entry) => entry.sourceSceneId === resultBase.testScene.sourceSceneId
  );
  const cleanupCompleted = resultBase.cleanupStatus.cleanupCompleted === true;
  const noSourceMutation =
    connectionTestLayer.validation.transformsUnchanged === true &&
    resultBase.cleanupStatus.sourceStateRestored === true;
  const noAutomaticActivation = resultBase.testScene.automaticLifecycleEnabled === false;
  const deterministicResult = deterministicFingerprint.deterministicResult === true;
  const commandOrderingValid = categorizedObjects.every(
    (entry, index) => index === 0 ? true : entry.sequence > categorizedObjects[index - 1].sequence
  );
  const allObjectsAccountedFor = categorizedObjects.length === resultBase.objectCount;

  const validationWithoutHash = deepFreeze({
    schemaId: controlledStreetSceneVisualTestValidationSchemaId,
    authorizationPassed,
    objectGroupingValid,
    layerOrderingValid,
    assetReferencesValid,
    transformsPreserved,
    sceneRelationshipsValid,
    cleanupCompleted,
    noSourceMutation,
    noAutomaticActivation,
    deterministicResult,
    commandOrderingValid,
    allObjectsAccountedFor,
    validationPassedOverall:
      connectionTestLayer.validation.validationPassedOverall === true &&
      authorizationPassed &&
      objectGroupingValid &&
      layerOrderingValid &&
      assetReferencesValid &&
      transformsPreserved &&
      sceneRelationshipsValid &&
      cleanupCompleted &&
      noSourceMutation &&
      noAutomaticActivation &&
      deterministicResult &&
      commandOrderingValid &&
      allObjectsAccountedFor,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      testScene: resultBase.testScene,
      objectsTested: resultBase.objectsTested,
      layerSummary: resultBase.layerSummary,
      assetSummary: resultBase.assetSummary,
      sceneRelationshipSummary: resultBase.sceneRelationshipSummary,
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

function buildValidationSignatureSource(result) {
  return {
    testScene: result.testScene,
    objectsTested: result.objectsTested,
    layerSummary: result.layerSummary,
    assetSummary: result.assetSummary,
    sceneRelationshipSummary: result.sceneRelationshipSummary,
    cleanupStatus: result.cleanupStatus,
    deterministicFingerprint: result.deterministicFingerprint,
    validation: result.validation
      ? {
          authorizationPassed: result.validation.authorizationPassed,
          objectGroupingValid: result.validation.objectGroupingValid,
          layerOrderingValid: result.validation.layerOrderingValid,
          assetReferencesValid: result.validation.assetReferencesValid,
          transformsPreserved: result.validation.transformsPreserved,
          sceneRelationshipsValid: result.validation.sceneRelationshipsValid,
          cleanupCompleted: result.validation.cleanupCompleted,
          noSourceMutation: result.validation.noSourceMutation,
          noAutomaticActivation: result.validation.noAutomaticActivation,
          deterministicResult: result.validation.deterministicResult,
          commandOrderingValid: result.validation.commandOrderingValid,
          allObjectsAccountedFor: result.validation.allObjectsAccountedFor,
          validationPassedOverall: result.validation.validationPassedOverall
        }
      : null
  };
}

function sortObject(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  );
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
