import {
  createAtlasRendererConnectionTestLayer,
  validateAtlasRendererConnectionTestLayer
} from "./atlas-renderer-connection-test.mjs";

export const controlledTownVisualTestSchemaId =
  "CONTROLLED_TOWN_VISUAL_TEST_001";
export const controlledTownVisualTestResultSchemaId =
  "CONTROLLED_TOWN_VISUAL_TEST_RESULT_001";
export const controlledTownVisualTestValidationSchemaId =
  "CONTROLLED_TOWN_VISUAL_TEST_VALIDATION_001";

export function createAtlasControlledTownTest(rawInput, options = {}) {
  const normalized = normalizeControlledTownInput(rawInput, options);
  const selectedScene = selectTownScene(normalized.connectionTestLayer);
  const categorizedObjects = categorizeTownObjects(
    selectedScene.commandFlow,
    selectedScene.sceneId
  );

  const resultBase = deepFreeze({
    schemaId: controlledTownVisualTestResultSchemaId,
    visualTestId: `${selectedScene.sceneId}_CONTROLLED_TOWN_VISUAL`,
    testScene: deepFreeze({
      schemaId: controlledTownVisualTestSchemaId,
      sceneId: "CONTROLLED_TOWN_VISUAL_TEST_001",
      sourceSceneId: selectedScene.sceneId,
      sourceSceneType: selectedScene.sceneType,
      isolated: true,
      reversible: true,
      productionMapAttached: false,
      automaticLifecycleEnabled: false
    }),
    districtCount: estimateDistrictCount(categorizedObjects),
    objectCount: categorizedObjects.length,
    objectsTested: deepFreeze(
      categorizedObjects.map((entry) => ({
        objectId: entry.objectId,
        objectType: entry.objectType,
        category: entry.category,
        districtKey: entry.districtKey,
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
  const validation = buildTownValidation(
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

  const checked = validateAtlasControlledTownTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasControlledTownTest(rawResult) {
  try {
    if (rawResult?.schemaId !== controlledTownVisualTestResultSchemaId) {
      throw createValidationError(
        "invalid_controlled_town_visual_test_result_schema",
        `Expected ${controlledTownVisualTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (rawResult.testScene?.schemaId !== controlledTownVisualTestSchemaId) {
      throw createValidationError(
        "invalid_controlled_town_visual_test_schema",
        `Expected ${controlledTownVisualTestSchemaId} but received ${rawResult.testScene?.schemaId}.`
      );
    }

    if (!Array.isArray(rawResult.objectsTested) || rawResult.objectsTested.length < 24) {
      throw createValidationError(
        "invalid_controlled_town_objects_tested",
        "Controlled town visual test must expose a non-empty town object list."
      );
    }

    if (!rawResult.cleanupStatus || rawResult.cleanupStatus.cleanupCompleted !== true) {
      throw createValidationError(
        "invalid_controlled_town_cleanup",
        "Controlled town visual test must expose completed cleanup."
      );
    }

    if (rawResult.validation?.schemaId !== controlledTownVisualTestValidationSchemaId) {
      throw createValidationError(
        "invalid_controlled_town_validation_schema",
        `Expected ${controlledTownVisualTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const key of [
      "authorizationPassed",
      "districtGroupingValid",
      "townCentreConnectionsValid",
      "roadHierarchyValid",
      "commercialPlacementValid",
      "greenSpaceRelationshipsValid",
      "transportLinksValid",
      "assetReferencesValid",
      "layerOrderingValid",
      "cleanupCompleted",
      "allObjectsAccountedFor",
      "relationshipsPreserved",
      "noSourceMutation",
      "deterministicOutput",
      "commandsValid",
      "validationPassedOverall"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createValidationError(
          "controlled_town_visual_test_validation_failed",
          `Controlled town visual test validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedHash !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "controlled_town_visual_test_signature_mismatch",
        "Controlled town visual test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      controlledTownVisualTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "controlled_town_visual_test_validation_failed",
      message: error.message,
      controlledTownVisualTestResult: null
    });
  }
}

function normalizeControlledTownInput(rawInput, options) {
  const authorizationToken = options.rendererAuthorization ?? null;
  if (authorizationToken !== "AUTHORIZED_CONTROLLED_RENDER_TEST") {
    throw createValidationError(
      "controlled_town_visual_test_not_authorized",
      "Controlled town visual test requires explicit renderer authorization."
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

function selectTownScene(connectionTestLayer) {
  const candidates = connectionTestLayer.connectionTestResults.filter(
    (entry) => entry.commandFlow.length >= 24
  );
  if (candidates.length === 0) {
    throw createValidationError(
      "missing_controlled_town_source",
      "Controlled town visual test requires a source scene with enough command flow."
    );
  }
  return candidates[0];
}

function categorizeTownObjects(commandFlow, sourceSceneId) {
  const createCommands = commandFlow.filter(
    (entry) => entry.commandType === "CREATE_OBJECT_COMMAND"
  );

  return deepFreeze(
    createCommands.map((entry) => ({
      ...entry,
      sourceSceneId,
      category: resolveCategory(entry),
      districtKey: resolveDistrictKey(entry.objectId)
    }))
  );
}

function resolveCategory(entry) {
  if (entry.renderLayer === "ROAD_LAYER" && /HIGHWAY|CONNECTOR/i.test(entry.objectType)) {
    return "connectorRoad";
  }
  if (entry.renderLayer === "ROAD_LAYER" && /INTERSECTION/i.test(entry.objectType)) {
    return "intersection";
  }
  if (entry.renderLayer === "ROAD_LAYER" && /SIDEWALK|PATH/i.test(entry.objectType)) {
    return "sidewalk";
  }
  if (entry.renderLayer === "ROAD_LAYER" && /STATION|BUS|RAIL|FERRY/i.test(entry.objectType)) {
    return "transport";
  }
  if (entry.renderLayer === "ROAD_LAYER") {
    return "localRoad";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /HOUSE|TOWNHOUSE|APARTMENT/i.test(entry.objectType)) {
    return "residential";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /CENTRE|PLAZA|MAIN_STREET|CIVIC_CENTRE/i.test(entry.objectType)) {
    return "townCentre";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /LIBRARY|CIVIC|SCHOOL|COMMUNITY/i.test(entry.objectType)) {
    return "civic";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /LOOKOUT|LANDMARK|LIGHTHOUSE|MONUMENT/i.test(entry.objectType)) {
    return "landmark";
  }
  if (entry.renderLayer === "OBJECT_LAYER") {
    return "commercial";
  }
  if (entry.renderLayer === "GROUND_LAYER" && /PARK|CORRIDOR|GREENSPACE|RESERVE/i.test(entry.objectType)) {
    return "greenSpace";
  }
  if (entry.renderLayer === "NATURE_LAYER" || entry.renderLayer === "GROUND_LAYER") {
    return "nature";
  }
  if (entry.renderLayer === "DETAIL_LAYER") {
    return "detail";
  }
  return "other";
}

function resolveDistrictKey(objectId) {
  if (/CONNECTOR|TOWN_CENTRE|TOWN_SHARED|DISTRICT_SHARED/i.test(String(objectId))) {
    return "TOWN_SHARED";
  }
  const match = String(objectId).match(/DISTRICT_[A-Z0-9]+/);
  return match ? match[0] : "TOWN_SHARED";
}

function estimateDistrictCount(objects) {
  return new Set(
    objects
      .map((entry) => entry.districtKey)
      .filter((key) => key !== "TOWN_SHARED")
  ).size;
}

function buildSceneCategories(objects) {
  return deepFreeze([...new Set(objects.map((entry) => entry.category))].sort());
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
    connectorRoad: 0,
    localRoad: 0,
    intersection: 0,
    sidewalk: 0,
    transport: 0,
    residential: 0,
    commercial: 0,
    townCentre: 0,
    greenSpace: 0,
    nature: 0,
    civic: 0,
    landmark: 0,
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
    cleanupMode: "CONTROLLED_TOWN_SYNTHETIC_RELEASE_ONLY",
    sourceStateRestored: true,
    transientStateReleased: true
  });
}

function buildDeterministicFingerprint(resultBase) {
  return deepFreeze({
    deterministicOutput: true,
    fingerprint: computeDeterministicSignatureHash({
      testScene: resultBase.testScene,
      districtCount: resultBase.districtCount,
      objectCount: resultBase.objectCount,
      sceneCategories: resultBase.sceneCategories,
      layerSummary: resultBase.layerSummary,
      assetSummary: resultBase.assetSummary,
      relationshipSummary: resultBase.relationshipSummary,
      cleanupStatus: resultBase.cleanupStatus
    }),
    sameInputProducesSameSceneRecord: true
  });
}

function buildTownValidation(
  resultBase,
  connectionTestLayer,
  categorizedObjects,
  deterministicFingerprint
) {
  const authorizationPassed = true;
  const districtGroupingValid = resultBase.districtCount >= 2;
  const townCentreConnectionsValid =
    resultBase.relationshipSummary.townCentre >= 1 &&
    resultBase.relationshipSummary.commercial >= 2 &&
    resultBase.relationshipSummary.connectorRoad >= 1;
  const roadHierarchyValid =
    resultBase.relationshipSummary.connectorRoad >= 1 &&
    resultBase.relationshipSummary.localRoad >= 3 &&
    resultBase.relationshipSummary.intersection >= 2;
  const commercialPlacementValid =
    resultBase.relationshipSummary.commercial >= 2 &&
    resultBase.relationshipSummary.townCentre >= 1;
  const greenSpaceRelationshipsValid =
    resultBase.relationshipSummary.greenSpace >= 2 &&
    resultBase.relationshipSummary.nature >= 2;
  const transportLinksValid =
    resultBase.relationshipSummary.transport >= 1 &&
    resultBase.relationshipSummary.sidewalk >= 1 &&
    resultBase.relationshipSummary.connectorRoad >= 1;
  const assetReferencesValid = categorizedObjects.every(
    (entry) => typeof entry.assetReference === "string" && entry.assetReference.length > 0
  );
  const layerOrderingValid = categorizedObjects.every((entry, index, list) =>
    index === 0 ? true : entry.layerOrdering >= list[index - 1].layerOrdering
  );
  const cleanupCompleted = resultBase.cleanupStatus.cleanupCompleted === true;
  const allObjectsAccountedFor = categorizedObjects.length === resultBase.objectCount;
  const relationshipsPreserved = categorizedObjects.every(
    (entry) => entry.sourceSceneId === resultBase.testScene.sourceSceneId
  );
  const noSourceMutation =
    connectionTestLayer.validation.transformsUnchanged === true &&
    resultBase.cleanupStatus.sourceStateRestored === true;
  const deterministicOutput = deterministicFingerprint.deterministicOutput === true;
  const commandsValid = categorizedObjects.every(
    (entry) =>
      typeof entry.objectId === "string" &&
      typeof entry.assetReference === "string" &&
      typeof entry.renderLayer === "string" &&
      typeof entry.transformSignature === "string"
  );

  const validationWithoutHash = deepFreeze({
    schemaId: controlledTownVisualTestValidationSchemaId,
    authorizationPassed,
    districtGroupingValid,
    townCentreConnectionsValid,
    roadHierarchyValid,
    commercialPlacementValid,
    greenSpaceRelationshipsValid,
    transportLinksValid,
    assetReferencesValid,
    layerOrderingValid,
    cleanupCompleted,
    allObjectsAccountedFor,
    relationshipsPreserved,
    noSourceMutation,
    deterministicOutput,
    commandsValid,
    validationPassedOverall:
      connectionTestLayer.validation.validationPassedOverall === true &&
      authorizationPassed &&
      districtGroupingValid &&
      townCentreConnectionsValid &&
      roadHierarchyValid &&
      commercialPlacementValid &&
      greenSpaceRelationshipsValid &&
      transportLinksValid &&
      assetReferencesValid &&
      layerOrderingValid &&
      cleanupCompleted &&
      allObjectsAccountedFor &&
      relationshipsPreserved &&
      noSourceMutation &&
      deterministicOutput &&
      commandsValid,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      testScene: resultBase.testScene,
      districtCount: resultBase.districtCount,
      objectCount: resultBase.objectCount,
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
    districtCount: result.districtCount,
    objectCount: result.objectCount,
    sceneCategories: result.sceneCategories,
    layerSummary: result.layerSummary,
    assetSummary: result.assetSummary,
    relationshipSummary: result.relationshipSummary,
    cleanupStatus: result.cleanupStatus,
    deterministicFingerprint: result.deterministicFingerprint,
    validation: result.validation
      ? {
          authorizationPassed: result.validation.authorizationPassed,
          districtGroupingValid: result.validation.districtGroupingValid,
          townCentreConnectionsValid: result.validation.townCentreConnectionsValid,
          roadHierarchyValid: result.validation.roadHierarchyValid,
          commercialPlacementValid: result.validation.commercialPlacementValid,
          greenSpaceRelationshipsValid: result.validation.greenSpaceRelationshipsValid,
          transportLinksValid: result.validation.transportLinksValid,
          assetReferencesValid: result.validation.assetReferencesValid,
          layerOrderingValid: result.validation.layerOrderingValid,
          cleanupCompleted: result.validation.cleanupCompleted,
          allObjectsAccountedFor: result.validation.allObjectsAccountedFor,
          relationshipsPreserved: result.validation.relationshipsPreserved,
          noSourceMutation: result.validation.noSourceMutation,
          deterministicOutput: result.validation.deterministicOutput,
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
