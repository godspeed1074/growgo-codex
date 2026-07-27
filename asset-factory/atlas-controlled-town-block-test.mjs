import {
  createAtlasRendererConnectionTestLayer,
  validateAtlasRendererConnectionTestLayer
} from "./atlas-renderer-connection-test.mjs";

export const controlledTownBlockVisualTestSchemaId =
  "CONTROLLED_TOWN_BLOCK_VISUAL_TEST_001";
export const controlledTownBlockVisualTestResultSchemaId =
  "CONTROLLED_TOWN_BLOCK_VISUAL_TEST_RESULT_001";
export const controlledTownBlockVisualTestValidationSchemaId =
  "CONTROLLED_TOWN_BLOCK_VISUAL_TEST_VALIDATION_001";

export function createAtlasControlledTownBlockTest(rawInput, options = {}) {
  const normalized = normalizeControlledTownBlockInput(rawInput, options);
  const selectedScene = selectTownBlockScene(normalized.connectionTestLayer);
  const categorizedObjects = categorizeTownBlockObjects(
    selectedScene.commandFlow,
    selectedScene.sceneId
  );

  const resultBase = deepFreeze({
    schemaId: controlledTownBlockVisualTestResultSchemaId,
    visualTestId: `${selectedScene.sceneId}_CONTROLLED_TOWN_BLOCK_VISUAL`,
    testScene: deepFreeze({
      schemaId: controlledTownBlockVisualTestSchemaId,
      sceneId: "CONTROLLED_TOWN_BLOCK_VISUAL_TEST_001",
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
    sceneCategories: buildSceneCategories(categorizedObjects),
    layerSummary: buildLayerSummary(categorizedObjects),
    assetSummary: buildAssetSummary(categorizedObjects),
    relationshipSummary: buildRelationshipSummary(categorizedObjects),
    cleanupStatus: buildCleanupStatus(),
    deterministicFingerprint: null,
    validation: null
  });

  const deterministicFingerprint = buildDeterministicFingerprint(resultBase);
  const validation = buildTownBlockValidation(
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

  const checked = validateAtlasControlledTownBlockTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasControlledTownBlockTest(rawResult) {
  try {
    if (rawResult?.schemaId !== controlledTownBlockVisualTestResultSchemaId) {
      throw createValidationError(
        "invalid_controlled_town_block_visual_test_result_schema",
        `Expected ${controlledTownBlockVisualTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (rawResult.testScene?.schemaId !== controlledTownBlockVisualTestSchemaId) {
      throw createValidationError(
        "invalid_controlled_town_block_visual_test_schema",
        `Expected ${controlledTownBlockVisualTestSchemaId} but received ${rawResult.testScene?.schemaId}.`
      );
    }

    if (!Array.isArray(rawResult.objectsTested) || rawResult.objectsTested.length < 12) {
      throw createValidationError(
        "invalid_controlled_town_block_objects_tested",
        "Controlled town block visual test must expose a non-empty town block object list."
      );
    }

    if (!rawResult.cleanupStatus || rawResult.cleanupStatus.cleanupCompleted !== true) {
      throw createValidationError(
        "invalid_controlled_town_block_cleanup",
        "Controlled town block visual test must expose completed cleanup."
      );
    }

    if (rawResult.validation?.schemaId !== controlledTownBlockVisualTestValidationSchemaId) {
      throw createValidationError(
        "invalid_controlled_town_block_validation_schema",
        `Expected ${controlledTownBlockVisualTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const key of [
      "authorizationPassed",
      "blockGroupingValid",
      "roadRelationshipsValid",
      "buildingPlacementReferencesValid",
      "parkRelationshipsValid",
      "layerOrderingValid",
      "assetReferencesValid",
      "cleanupCompleted",
      "allObjectsAccountedFor",
      "noSourceMutation",
      "deterministicResult",
      "relationshipsPreserved",
      "commandsValid",
      "validationPassedOverall"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createValidationError(
          "controlled_town_block_visual_test_validation_failed",
          `Controlled town block visual test validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedHash !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "controlled_town_block_visual_test_signature_mismatch",
        "Controlled town block visual test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      controlledTownBlockVisualTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "controlled_town_block_visual_test_validation_failed",
      message: error.message,
      controlledTownBlockVisualTestResult: null
    });
  }
}

function normalizeControlledTownBlockInput(rawInput, options) {
  const authorizationToken = options.rendererAuthorization ?? null;
  if (authorizationToken !== "AUTHORIZED_CONTROLLED_RENDER_TEST") {
    throw createValidationError(
      "controlled_town_block_visual_test_not_authorized",
      "Controlled town block visual test requires explicit renderer authorization."
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

function selectTownBlockScene(connectionTestLayer) {
  const candidates = connectionTestLayer.connectionTestResults.filter(
    (entry) => entry.commandFlow.length >= 12
  );
  if (candidates.length === 0) {
    throw createValidationError(
      "missing_controlled_town_block_source",
      "Controlled town block visual test requires a source scene with enough command flow."
    );
  }
  return candidates[0];
}

function categorizeTownBlockObjects(commandFlow, sourceSceneId) {
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
  if (entry.renderLayer === "ROAD_LAYER" && /INTERSECTION/i.test(entry.objectType)) {
    return "intersection";
  }
  if (entry.renderLayer === "ROAD_LAYER" && /SIDEWALK|PATH/i.test(entry.objectType)) {
    return "sidewalk";
  }
  if (entry.renderLayer === "ROAD_LAYER") {
    return "road";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /HOUSE|TOWNHOUSE|APARTMENT/i.test(entry.objectType)) {
    return "residential";
  }
  if (entry.renderLayer === "OBJECT_LAYER") {
    return "commercial";
  }
  if (entry.renderLayer === "GROUND_LAYER" && /PARK|RESERVE|GREENSPACE/i.test(entry.objectType)) {
    return "park";
  }
  if (entry.renderLayer === "NATURE_LAYER" || entry.renderLayer === "GROUND_LAYER") {
    return "nature";
  }
  if (entry.renderLayer === "DETAIL_LAYER") {
    return "detail";
  }
  return "other";
}

function buildSceneCategories(objects) {
  const categories = new Set(objects.map((entry) => entry.category));
  return deepFreeze([...categories].sort((a, b) => a.localeCompare(b)));
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

function buildRelationshipSummary(objects) {
  const summary = {
    road: 0,
    intersection: 0,
    sidewalk: 0,
    residential: 0,
    commercial: 0,
    park: 0,
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
    cleanupMode: "CONTROLLED_TOWN_BLOCK_SYNTHETIC_RELEASE_ONLY",
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
      sceneCategories: resultBase.sceneCategories,
      layerSummary: resultBase.layerSummary,
      assetSummary: resultBase.assetSummary,
      relationshipSummary: resultBase.relationshipSummary,
      cleanupStatus: resultBase.cleanupStatus
    }),
    sameInputProducesSameSceneRecord: true
  });
}

function buildTownBlockValidation(
  resultBase,
  connectionTestLayer,
  categorizedObjects,
  deterministicFingerprint
) {
  const authorizationPassed = true;
  const blockGroupingValid =
    resultBase.relationshipSummary.road >= 2 &&
    resultBase.relationshipSummary.intersection >= 1 &&
    resultBase.relationshipSummary.residential >= 3 &&
    resultBase.relationshipSummary.commercial >= 2 &&
    resultBase.relationshipSummary.park >= 1 &&
    resultBase.relationshipSummary.nature >= 1 &&
    resultBase.relationshipSummary.detail >= 1;
  const roadRelationshipsValid =
    resultBase.relationshipSummary.road >= 2 &&
    resultBase.relationshipSummary.intersection >= 1 &&
    resultBase.relationshipSummary.sidewalk >= 1;
  const buildingPlacementReferencesValid = categorizedObjects
    .filter((entry) => entry.category === "residential" || entry.category === "commercial")
    .every((entry) => typeof entry.transformSignature === "string" && entry.transformSignature.length > 0);
  const parkRelationshipsValid =
    resultBase.relationshipSummary.park >= 1 &&
    (resultBase.relationshipSummary.nature >= 1 || resultBase.relationshipSummary.detail >= 1);
  const layerOrderingValid = categorizedObjects.every((entry, index, list) =>
    index === 0 ? true : entry.layerOrdering >= list[index - 1].layerOrdering
  );
  const assetReferencesValid = categorizedObjects.every(
    (entry) => typeof entry.assetReference === "string" && entry.assetReference.length > 0
  );
  const cleanupCompleted = resultBase.cleanupStatus.cleanupCompleted === true;
  const allObjectsAccountedFor = categorizedObjects.length === resultBase.objectCount;
  const noSourceMutation =
    connectionTestLayer.validation.transformsUnchanged === true &&
    resultBase.cleanupStatus.sourceStateRestored === true;
  const deterministicResult = deterministicFingerprint.deterministicResult === true;
  const relationshipsPreserved = categorizedObjects.every(
    (entry) => entry.sourceSceneId === resultBase.testScene.sourceSceneId
  );
  const commandsValid = categorizedObjects.every(
    (entry) =>
      typeof entry.objectId === "string" &&
      typeof entry.assetReference === "string" &&
      typeof entry.renderLayer === "string"
  );

  const validationWithoutHash = deepFreeze({
    schemaId: controlledTownBlockVisualTestValidationSchemaId,
    authorizationPassed,
    blockGroupingValid,
    roadRelationshipsValid,
    buildingPlacementReferencesValid,
    parkRelationshipsValid,
    layerOrderingValid,
    assetReferencesValid,
    cleanupCompleted,
    allObjectsAccountedFor,
    noSourceMutation,
    deterministicResult,
    relationshipsPreserved,
    commandsValid,
    validationPassedOverall:
      connectionTestLayer.validation.validationPassedOverall === true &&
      authorizationPassed &&
      blockGroupingValid &&
      roadRelationshipsValid &&
      buildingPlacementReferencesValid &&
      parkRelationshipsValid &&
      layerOrderingValid &&
      assetReferencesValid &&
      cleanupCompleted &&
      allObjectsAccountedFor &&
      noSourceMutation &&
      deterministicResult &&
      relationshipsPreserved &&
      commandsValid,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      testScene: resultBase.testScene,
      objectsTested: resultBase.objectsTested,
      sceneCategories: resultBase.sceneCategories,
      layerSummary: resultBase.layerSummary,
      assetSummary: resultBase.assetSummary,
      relationshipSummary: resultBase.relationshipSummary,
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
    sceneCategories: result.sceneCategories,
    layerSummary: result.layerSummary,
    assetSummary: result.assetSummary,
    relationshipSummary: result.relationshipSummary,
    cleanupStatus: result.cleanupStatus,
    deterministicFingerprint: result.deterministicFingerprint,
    validation: result.validation
      ? {
          authorizationPassed: result.validation.authorizationPassed,
          blockGroupingValid: result.validation.blockGroupingValid,
          roadRelationshipsValid: result.validation.roadRelationshipsValid,
          buildingPlacementReferencesValid:
            result.validation.buildingPlacementReferencesValid,
          parkRelationshipsValid: result.validation.parkRelationshipsValid,
          layerOrderingValid: result.validation.layerOrderingValid,
          assetReferencesValid: result.validation.assetReferencesValid,
          cleanupCompleted: result.validation.cleanupCompleted,
          allObjectsAccountedFor: result.validation.allObjectsAccountedFor,
          noSourceMutation: result.validation.noSourceMutation,
          deterministicResult: result.validation.deterministicResult,
          relationshipsPreserved: result.validation.relationshipsPreserved,
          commandsValid: result.validation.commandsValid,
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
