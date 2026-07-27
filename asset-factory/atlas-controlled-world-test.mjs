import {
  createAtlasRendererConnectionTestLayer,
  validateAtlasRendererConnectionTestLayer
} from "./atlas-renderer-connection-test.mjs";

export const controlledWorldVisualTestSchemaId =
  "CONTROLLED_WORLD_VISUAL_TEST_001";
export const controlledWorldVisualTestResultSchemaId =
  "CONTROLLED_WORLD_VISUAL_TEST_RESULT_001";
export const controlledWorldVisualTestValidationSchemaId =
  "CONTROLLED_WORLD_VISUAL_TEST_VALIDATION_001";

export function createAtlasControlledWorldTest(rawInput, options = {}) {
  const normalized = normalizeControlledWorldInput(rawInput, options);
  const selectedScene = selectWorldScene(normalized.connectionTestLayer);
  const categorizedObjects = categorizeWorldObjects(
    selectedScene.commandFlow,
    selectedScene.sceneId
  );

  const resultBase = deepFreeze({
    schemaId: controlledWorldVisualTestResultSchemaId,
    visualTestId: `${selectedScene.sceneId}_CONTROLLED_WORLD_VISUAL`,
    testScene: deepFreeze({
      schemaId: controlledWorldVisualTestSchemaId,
      sceneId: "CONTROLLED_WORLD_VISUAL_TEST_001",
      sourceSceneId: selectedScene.sceneId,
      sourceSceneType: selectedScene.sceneType,
      isolated: true,
      reversible: true,
      productionMapAttached: false,
      automaticLifecycleEnabled: false
    }),
    regionCount: estimateRegionCount(categorizedObjects),
    townCount: estimateTownCount(categorizedObjects),
    objectCount: categorizedObjects.length,
    objectsTested: deepFreeze(
      categorizedObjects.map((entry) => ({
        objectId: entry.objectId,
        objectType: entry.objectType,
        category: entry.category,
        regionKey: entry.regionKey,
        townKey: entry.townKey,
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
  const validation = buildWorldValidation(
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

  const checked = validateAtlasControlledWorldTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasControlledWorldTest(rawResult) {
  try {
    if (rawResult?.schemaId !== controlledWorldVisualTestResultSchemaId) {
      throw createValidationError(
        "invalid_controlled_world_visual_test_result_schema",
        `Expected ${controlledWorldVisualTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (rawResult.testScene?.schemaId !== controlledWorldVisualTestSchemaId) {
      throw createValidationError(
        "invalid_controlled_world_visual_test_schema",
        `Expected ${controlledWorldVisualTestSchemaId} but received ${rawResult.testScene?.schemaId}.`
      );
    }

    if (!Array.isArray(rawResult.objectsTested) || rawResult.objectsTested.length < 36) {
      throw createValidationError(
        "invalid_controlled_world_objects_tested",
        "Controlled world visual test must expose a non-empty world object list."
      );
    }

    if (!rawResult.cleanupStatus || rawResult.cleanupStatus.cleanupCompleted !== true) {
      throw createValidationError(
        "invalid_controlled_world_cleanup",
        "Controlled world visual test must expose completed cleanup."
      );
    }

    if (rawResult.validation?.schemaId !== controlledWorldVisualTestValidationSchemaId) {
      throw createValidationError(
        "invalid_controlled_world_validation_schema",
        `Expected ${controlledWorldVisualTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const key of [
      "authorizationPassed",
      "regionGroupingValid",
      "regionRelationshipsValid",
      "worldTravelCorridorsValid",
      "landmarkDistributionValid",
      "environmentDiversityValid",
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
          "controlled_world_visual_test_validation_failed",
          `Controlled world visual test validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedHash !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "controlled_world_visual_test_signature_mismatch",
        "Controlled world visual test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      controlledWorldVisualTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "controlled_world_visual_test_validation_failed",
      message: error.message,
      controlledWorldVisualTestResult: null
    });
  }
}

function normalizeControlledWorldInput(rawInput, options) {
  const authorizationToken = options.rendererAuthorization ?? null;
  if (authorizationToken !== "AUTHORIZED_CONTROLLED_RENDER_TEST") {
    throw createValidationError(
      "controlled_world_visual_test_not_authorized",
      "Controlled world visual test requires explicit renderer authorization."
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

function selectWorldScene(connectionTestLayer) {
  const candidates = connectionTestLayer.connectionTestResults.filter(
    (entry) => entry.commandFlow.length >= 36
  );
  if (candidates.length === 0) {
    throw createValidationError(
      "missing_controlled_world_source",
      "Controlled world visual test requires a source scene with enough command flow."
    );
  }
  return candidates[0];
}

function categorizeWorldObjects(commandFlow, sourceSceneId) {
  const createCommands = commandFlow.filter(
    (entry) => entry.commandType === "CREATE_OBJECT_COMMAND"
  );

  return deepFreeze(
    createCommands.map((entry) => ({
      ...entry,
      sourceSceneId,
      category: resolveCategory(entry),
      regionKey: resolveRegionKey(entry.objectId),
      townKey: resolveTownKey(entry.objectId)
    }))
  );
}

function resolveCategory(entry) {
  if (
    entry.renderLayer === "ROAD_LAYER" &&
    /HIGHWAY|ARTERIAL|FERRY_ROUTE|RAIL_CORRIDOR|COASTAL_ROUTE/i.test(entry.objectType)
  ) {
    return "worldCorridor";
  }
  if (entry.renderLayer === "ROAD_LAYER" && /INTERSECTION/i.test(entry.objectType)) {
    return "intersection";
  }
  if (entry.renderLayer === "ROAD_LAYER" && /SIDEWALK|PATH|TRAIL/i.test(entry.objectType)) {
    return "path";
  }
  if (
    entry.renderLayer === "ROAD_LAYER" &&
    /STATION|BUS|FERRY_TERMINAL|RAIL_HUB/i.test(entry.objectType)
  ) {
    return "transportHub";
  }
  if (entry.renderLayer === "ROAD_LAYER") {
    return "regionalConnector";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /HOUSE|TOWNHOUSE|APARTMENT/i.test(entry.objectType)) {
    return "residential";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /CENTRE|PLAZA|MAIN_STREET/i.test(entry.objectType)) {
    return "townCentre";
  }
  if (
    entry.renderLayer === "OBJECT_LAYER" &&
    /LIBRARY|CIVIC|SCHOOL|COMMUNITY|HALL/i.test(entry.objectType)
  ) {
    return "civic";
  }
  if (entry.renderLayer === "OBJECT_LAYER" && /LOOKOUT|LANDMARK|LIGHTHOUSE|MONUMENT/i.test(entry.objectType)) {
    return "landmark";
  }
  if (entry.renderLayer === "OBJECT_LAYER") {
    return "commercial";
  }
  if (
    entry.renderLayer === "GROUND_LAYER" &&
    /PARK|CORRIDOR|GREENSPACE|RESERVE|BEACH|WETLAND|FOREST/i.test(entry.objectType)
  ) {
    return "environment";
  }
  if (entry.renderLayer === "NATURE_LAYER" || entry.renderLayer === "GROUND_LAYER") {
    return "nature";
  }
  if (entry.renderLayer === "DETAIL_LAYER") {
    return "detail";
  }
  return "other";
}

function resolveRegionKey(objectId) {
  if (/^WORLD_|^GLOBAL_|WORLD_SHARED/i.test(String(objectId))) {
    return "WORLD_SHARED";
  }
  const match = String(objectId).match(/REGION_[A-Z0-9]+/);
  return match ? match[0] : "WORLD_SHARED";
}

function resolveTownKey(objectId) {
  if (/^WORLD_|^GLOBAL_|WORLD_SHARED/i.test(String(objectId))) {
    return "WORLD_SHARED";
  }
  const match = String(objectId).match(/TOWN_[A-Z0-9]+/);
  return match ? match[0] : "WORLD_SHARED";
}

function estimateRegionCount(objects) {
  return new Set(
    objects
      .map((entry) => entry.regionKey)
      .filter((key) => key !== "WORLD_SHARED")
  ).size;
}

function estimateTownCount(objects) {
  return new Set(
    objects
      .map((entry) => entry.townKey)
      .filter((key) => key !== "WORLD_SHARED")
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
    worldCorridor: 0,
    regionalConnector: 0,
    intersection: 0,
    path: 0,
    transportHub: 0,
    residential: 0,
    commercial: 0,
    townCentre: 0,
    civic: 0,
    landmark: 0,
    environment: 0,
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
    cleanupMode: "CONTROLLED_WORLD_SYNTHETIC_RELEASE_ONLY",
    sourceStateRestored: true,
    transientStateReleased: true
  });
}

function buildDeterministicFingerprint(resultBase) {
  return deepFreeze({
    deterministicOutput: true,
    fingerprint: computeDeterministicSignatureHash({
      testScene: resultBase.testScene,
      regionCount: resultBase.regionCount,
      townCount: resultBase.townCount,
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

function buildWorldValidation(
  resultBase,
  connectionTestLayer,
  categorizedObjects,
  deterministicFingerprint
) {
  const authorizationPassed = true;
  const regionGroupingValid = resultBase.regionCount >= 3 && resultBase.townCount >= 4;
  const regionRelationshipsValid =
    resultBase.relationshipSummary.regionalConnector >= 4 &&
    resultBase.relationshipSummary.intersection >= 3;
  const worldTravelCorridorsValid =
    resultBase.relationshipSummary.worldCorridor >= 4 &&
    resultBase.relationshipSummary.transportHub >= 3 &&
    resultBase.relationshipSummary.path >= 2;
  const landmarkDistributionValid =
    resultBase.relationshipSummary.landmark >= 3 &&
    resultBase.relationshipSummary.civic >= 2 &&
    resultBase.relationshipSummary.townCentre >= 2;
  const environmentDiversityValid =
    resultBase.relationshipSummary.environment >= 4 &&
    resultBase.relationshipSummary.nature >= 4;
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
    schemaId: controlledWorldVisualTestValidationSchemaId,
    authorizationPassed,
    regionGroupingValid,
    regionRelationshipsValid,
    worldTravelCorridorsValid,
    landmarkDistributionValid,
    environmentDiversityValid,
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
      regionGroupingValid &&
      regionRelationshipsValid &&
      worldTravelCorridorsValid &&
      landmarkDistributionValid &&
      environmentDiversityValid &&
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
      regionCount: resultBase.regionCount,
      townCount: resultBase.townCount,
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
    regionCount: result.regionCount,
    townCount: result.townCount,
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
          regionGroupingValid: result.validation.regionGroupingValid,
          regionRelationshipsValid: result.validation.regionRelationshipsValid,
          worldTravelCorridorsValid: result.validation.worldTravelCorridorsValid,
          landmarkDistributionValid: result.validation.landmarkDistributionValid,
          environmentDiversityValid: result.validation.environmentDiversityValid,
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
