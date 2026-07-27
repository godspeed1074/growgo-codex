import {
  validateAtlasPresentationRuntimeLayer
} from "./atlas-presentation-runtime.mjs";

const growgoObjectClassificationLayerSchemaId = "GROWGO_OBJECT_CLASSIFICATION_LAYER_001";
const growgoWorldObjectsSchemaId = "GROWGO_WORLD_OBJECTS_001";
const growgoObjectClassificationValidationSchemaId =
  "GROWGO_OBJECT_CLASSIFICATION_VALIDATION_001";

const questCompatibilityMap = deepFreeze({
  PARK: "QUEST_OPTIONAL",
  BUSINESS: "QUEST_SUPPORTED",
  LANDMARK: "QUEST_STRONG",
  TRANSPORT: "QUEST_SUPPORTED",
  NATURAL_FEATURE: "QUEST_OPTIONAL",
  ROUTE: "QUEST_OPTIONAL"
});

export function createGrowgoObjectClassificationLayer(rawAtlasPresentationLayer) {
  const atlasPresentationLayer = normalizeAtlasPresentationLayer(rawAtlasPresentationLayer);
  const worldObjects = buildGrowgoWorldObjects(atlasPresentationLayer);

  const layerBase = deepFreeze({
    schemaId: growgoObjectClassificationLayerSchemaId,
    layerId: `${atlasPresentationLayer.layerId}_OBJECT_CLASSIFICATION`,
    packageId: atlasPresentationLayer.packageId,
    regionId: atlasPresentationLayer.regionId,
    worldObjects,
    validation: null
  });

  const validation = buildGrowgoObjectClassificationValidation(layerBase);
  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateGrowgoObjectClassificationLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateGrowgoObjectClassificationLayer(rawLayer) {
  try {
    const layer = rawLayer;
    assertPresent(layer?.worldObjects, "GrowGo world objects are required.");
    assertPresent(layer?.validation, "GrowGo object classification validation is required.");

    if (layer.worldObjects.schemaId !== growgoWorldObjectsSchemaId) {
      throw createValidationError(
        "invalid_growgo_world_objects_schema",
        `Expected ${growgoWorldObjectsSchemaId} but received ${layer.worldObjects.schemaId}.`
      );
    }

    if (!Array.isArray(layer.worldObjects.objects) || layer.worldObjects.objects.length === 0) {
      throw createValidationError(
        "invalid_growgo_world_objects",
        "GrowGo world objects must expose a non-empty objects array."
      );
    }

    for (const object of layer.worldObjects.objects) {
      assertPresent(object.objectId, "GrowGo world objectId is required.");
      assertPresent(object.sourceReference, "GrowGo world sourceReference is required.");
      assertPresent(object.realWorldType, "GrowGo world realWorldType is required.");
      assertPresent(
        object.growgoClassification,
        "GrowGo world classification is required."
      );
      assertPresent(
        object.geometryReference,
        "GrowGo world geometryReference is required."
      );
      assertPresent(
        object.presentationReference,
        "GrowGo world presentationReference is required."
      );
      if (!Array.isArray(object.gameplayTags) || object.gameplayTags.length === 0) {
        throw createValidationError(
          "invalid_growgo_gameplay_tags",
          `GrowGo world object ${object.objectId} must expose gameplay tags.`
        );
      }
      if (typeof object.questCompatibility !== "string") {
        throw createValidationError(
          "invalid_growgo_quest_compatibility",
          `GrowGo world object ${object.objectId} must expose quest compatibility.`
        );
      }
    }

    for (const key of [
      "sourceReferencePreserved",
      "classificationValid",
      "gameplayTagsValid",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (layer.validation[key] !== true) {
        throw createValidationError(
          "growgo_object_classification_validation_failed",
          `GrowGo object classification validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildValidationSignatureSource(layer)
    );
    if (expectedSignature !== layer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "growgo_object_classification_signature_mismatch",
        "GrowGo object classification deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      growgoObjectClassificationLayer: layer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "growgo_object_classification_validation_failed",
      message: error.message,
      growgoObjectClassificationLayer: null
    });
  }
}

function normalizeAtlasPresentationLayer(rawAtlasPresentationLayer) {
  if (rawAtlasPresentationLayer?.schemaId === "RUNTIME_ATLAS_PRESENTATION_OBJECTS_001") {
    return deepFreeze({
      schemaId: "ATLAS_PRESENTATION_RUNTIME_LAYER_001",
      layerId: "RUNTIME_ATLAS_PRESENTATION_OBJECTS_001_DIRECT_INPUT",
      packageId: "DIRECT_PRESENTATION_INPUT",
      regionId: "DIRECT_PRESENTATION_INPUT",
      presentationObjects: structuredClone(rawAtlasPresentationLayer),
      validation: deepFreeze({
        validationPassed: true
      })
    });
  }

  const validation = validateAtlasPresentationRuntimeLayer(rawAtlasPresentationLayer);
  if (!validation.ok) {
    throw createValidationError("invalid_atlas_presentation_layer", validation.message);
  }
  return deepFreeze(structuredClone(validation.atlasPresentationRuntimeLayer));
}

function buildGrowgoWorldObjects(atlasPresentationLayer) {
  const roadObjects = atlasPresentationLayer.presentationObjects.roadPresentations
    .filter((presentation) => presentation.roadType === "TRANSPORT_ROUTE")
    .map((presentation) =>
      buildWorldObject({
        objectId: `${presentation.presentationId}_OBJECT`,
        sourceReference: presentation.sourceReference,
        realWorldType: presentation.roadType,
        growgoClassification: "TRANSPORT",
        geometryReference: presentation.geometryReference,
        presentationReference: presentation.presentationId,
        gameplayTags: ["travel", "route", "quest"],
        questCompatibility: questCompatibilityMap.TRANSPORT
      })
    );

  const parkObjects = atlasPresentationLayer.presentationObjects.parkPresentations.map(
    (presentation) =>
      buildWorldObject({
        objectId: `${presentation.presentationId}_OBJECT`,
        sourceReference: presentation.sourceReference,
        realWorldType: presentation.naturalFeatureType,
        growgoClassification: classifyNaturalFeature(presentation.naturalFeatureType),
        geometryReference: presentation.realBoundary,
        presentationReference: presentation.presentationId,
        gameplayTags: resolveNaturalGameplayTags(presentation.naturalFeatureType),
        questCompatibility: resolveQuestCompatibilityForNatural(
          presentation.naturalFeatureType
        )
      })
  );

  const buildingObjects = atlasPresentationLayer.presentationObjects.buildingPresentations.map(
    (presentation) =>
      buildWorldObject({
        objectId: `${presentation.presentationId}_OBJECT`,
        sourceReference: presentation.sourceReference,
        realWorldType: presentation.buildingType,
        growgoClassification: classifyBuildingType(presentation.buildingType),
        geometryReference: presentation.footprintReference,
        presentationReference: presentation.presentationId,
        gameplayTags: resolveBuildingGameplayTags(presentation.buildingType),
        questCompatibility: resolveQuestCompatibilityForBuilding(
          presentation.buildingType
        )
      })
  );

  const coveredSources = new Set(buildingObjects.map((object) => object.sourceReference.sourceFeatureId));
  const poiObjects = atlasPresentationLayer.presentationObjects.poiPresentations
    .filter((presentation) => !coveredSources.has(presentation.sourceReference.sourceFeatureId))
    .map((presentation) =>
      buildWorldObject({
        objectId: `${presentation.presentationId}_OBJECT`,
        sourceReference: presentation.sourceReference,
        realWorldType: presentation.poiType,
        growgoClassification: classifyPoiType(presentation.poiType),
        geometryReference: presentation.geometryReference,
        presentationReference: presentation.presentationId,
        gameplayTags: resolvePoiGameplayTags(presentation.poiType),
        questCompatibility: resolveQuestCompatibilityForPoi(presentation.poiType)
      })
    );

  return deepFreeze({
    schemaId: growgoWorldObjectsSchemaId,
    objects: deepFreeze(
      [...parkObjects, ...buildingObjects, ...poiObjects, ...roadObjects].sort(
        compareBy("objectId")
      )
    )
  });
}

function buildWorldObject({
  objectId,
  sourceReference,
  realWorldType,
  growgoClassification,
  geometryReference,
  presentationReference,
  gameplayTags,
  questCompatibility
}) {
  return deepFreeze({
    objectId,
    sourceReference,
    realWorldType,
    growgoClassification,
    geometryReference,
    presentationReference,
    gameplayTags: deepFreeze(uniqueSorted(gameplayTags)),
    questCompatibility
  });
}

function classifyNaturalFeature(naturalFeatureType) {
  if (
    naturalFeatureType === "PARK" ||
    naturalFeatureType === "RESERVE" ||
    naturalFeatureType === "OVAL" ||
    naturalFeatureType === "RECREATION_AREA"
  ) {
    return "PARK";
  }
  return "NATURAL_FEATURE";
}

function classifyBuildingType(buildingType) {
  if (
    [
      "BAKERY",
      "CAFE",
      "RESTAURANT",
      "PETROL_STATION",
      "SHOP",
      "LIBRARY",
      "SCHOOL",
      "COMMUNITY_BUILDING",
      "WAREHOUSE",
      "INDUSTRIAL_BUILDING"
    ].includes(buildingType)
  ) {
    return "BUSINESS";
  }
  if (["LIGHTHOUSE", "MONUMENT", "LOOKOUT", "HISTORIC_SITE"].includes(buildingType)) {
    return "LANDMARK";
  }
  if (["RAILWAY_STATION", "FERRY_TERMINAL", "BUS_STOP"].includes(buildingType)) {
    return "TRANSPORT";
  }
  return "BUSINESS";
}

function classifyPoiType(poiType) {
  if (poiType === "LANDMARK" || poiType === "CULTURAL") {
    return "LANDMARK";
  }
  if (poiType === "SERVICE") {
    return "BUSINESS";
  }
  return "LANDMARK";
}

function resolveNaturalGameplayTags(naturalFeatureType) {
  if (naturalFeatureType === "PARK" || naturalFeatureType === "RESERVE") {
    return ["exploration", "nature", "wildlife", "quest_candidate"];
  }
  if (naturalFeatureType === "OVAL" || naturalFeatureType === "RECREATION_AREA") {
    return ["exploration", "nature", "recreation", "quest_candidate"];
  }
  if (naturalFeatureType === "BEACH") {
    return ["exploration", "nature", "coastal", "quest_candidate"];
  }
  return ["exploration", "nature"];
}

function resolveBuildingGameplayTags(buildingType) {
  if (buildingType === "BAKERY") {
    return ["npc_interaction", "crafting", "quest_candidate", "food"];
  }
  if (["CAFE", "RESTAURANT", "SHOP", "PETROL_STATION"].includes(buildingType)) {
    return ["npc_interaction", "crafting", "quest_candidate"];
  }
  if (["LIBRARY", "SCHOOL", "COMMUNITY_BUILDING"].includes(buildingType)) {
    return ["npc_interaction", "community", "quest_candidate"];
  }
  if (["WAREHOUSE", "INDUSTRIAL_BUILDING"].includes(buildingType)) {
    return ["industrial", "logistics", "quest_candidate"];
  }
  if (["LIGHTHOUSE", "MONUMENT", "LOOKOUT", "HISTORIC_SITE"].includes(buildingType)) {
    return ["achievement", "collection", "quest"];
  }
  if (["RAILWAY_STATION", "FERRY_TERMINAL", "BUS_STOP"].includes(buildingType)) {
    return ["travel", "route", "quest"];
  }
  return ["quest_candidate"];
}

function resolvePoiGameplayTags(poiType) {
  if (poiType === "LANDMARK" || poiType === "CULTURAL") {
    return ["achievement", "collection", "quest"];
  }
  if (poiType === "SERVICE") {
    return ["npc_interaction", "crafting", "quest_candidate"];
  }
  return ["exploration", "quest_candidate"];
}

function resolveQuestCompatibilityForNatural(naturalFeatureType) {
  if (naturalFeatureType === "PARK" || naturalFeatureType === "RESERVE") {
    return questCompatibilityMap.PARK;
  }
  return questCompatibilityMap.NATURAL_FEATURE;
}

function resolveQuestCompatibilityForBuilding(buildingType) {
  return questCompatibilityMap[classifyBuildingType(buildingType)] ?? "QUEST_OPTIONAL";
}

function resolveQuestCompatibilityForPoi(poiType) {
  return questCompatibilityMap[classifyPoiType(poiType)] ?? "QUEST_OPTIONAL";
}

function buildGrowgoObjectClassificationValidation(layerBase) {
  const objects = layerBase.worldObjects.objects;
  const validationWithoutHash = deepFreeze({
    schemaId: growgoObjectClassificationValidationSchemaId,
    sourceReferencePreserved: objects.every(
      (object) =>
        typeof object.sourceReference?.sourceFeatureId === "string" &&
        typeof object.sourceReference?.provider === "string"
    ),
    classificationValid: objects.every((object) =>
      ["PARK", "BUSINESS", "LANDMARK", "TRANSPORT", "NATURAL_FEATURE"].includes(
        object.growgoClassification
      )
    ),
    gameplayTagsValid: objects.every(
      (object) => Array.isArray(object.gameplayTags) && object.gameplayTags.length > 0
    ),
    deterministicOutput: true,
    validationPassed: true,
    reasons: deepFreeze([
      "source references preserved",
      "classifications valid",
      "gameplay tags valid",
      "classification mapping deterministic"
    ]),
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      ...layerBase,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash: signature
  });
}

function buildValidationSignatureSource(layer) {
  return {
    layerId: layer.layerId,
    packageId: layer.packageId,
    worldObjects: layer.worldObjects,
    validationFlags: layer.validation
      ? {
          sourceReferencePreserved: layer.validation.sourceReferencePreserved,
          classificationValid: layer.validation.classificationValid,
          gameplayTagsValid: layer.validation.gameplayTagsValid,
          deterministicOutput: layer.validation.deterministicOutput,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function assertPresent(value, message) {
  if (value === null || value === undefined) {
    throw createValidationError("missing_required_value", message);
  }
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
