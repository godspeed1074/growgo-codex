import {
  validateRegionPackageRuntimeReader
} from "./region-package-runtime-reader.mjs";

const atlasPresentationRuntimeLayerSchemaId = "ATLAS_PRESENTATION_RUNTIME_LAYER_001";
const runtimeAtlasPresentationObjectsSchemaId = "RUNTIME_ATLAS_PRESENTATION_OBJECTS_001";
const atlasPresentationValidationSchemaId = "ATLAS_PRESENTATION_VALIDATION_001";

const roadAssetReferenceMap = deepFreeze({
  ROAD: "ATLAS_ROAD_STANDARD_001",
  TRAIL: "ATLAS_TRAIL_WALKING_001",
  PATH: "ATLAS_PATH_PEDESTRIAN_001",
  TRANSPORT_ROUTE: "ATLAS_TRANSPORT_ROUTE_STANDARD_001"
});

const buildingRecipeMap = deepFreeze({
  CAFE: "RECIPE_BUILDING_SERVICE_CAFE_PRESENTATION_001",
  BAKERY: "RECIPE_BUILDING_SERVICE_BAKERY_PRESENTATION_001",
  LIGHTHOUSE: "RECIPE_BUILDING_LANDMARK_LIGHTHOUSE_PRESENTATION_001",
  HISTORIC_SITE: "RECIPE_BUILDING_CULTURAL_HISTORIC_SITE_PRESENTATION_001"
});

const poiPresentationRuleMap = deepFreeze({
  LANDMARK: "ATLAS_RULE_LANDMARK_001",
  ATTRACTION: "ATLAS_RULE_ATTRACTION_001",
  SERVICE: "ATLAS_RULE_BUSINESS_001",
  CULTURAL: "ATLAS_RULE_CULTURAL_001"
});

const naturalTreatmentStyleMap = deepFreeze({
  PARK: "GROWGO_PARK_TREATMENT_STANDARD_001",
  RESERVE: "GROWGO_RESERVE_TREATMENT_STANDARD_001",
  BEACH: "GROWGO_BEACH_TREATMENT_STANDARD_001",
  FOREST: "GROWGO_FOREST_TREATMENT_STANDARD_001",
  WATERWAY: "GROWGO_WATERWAY_TREATMENT_STANDARD_001"
});

export function createAtlasPresentationRuntimeLayer(rawRuntimeReader) {
  const runtimeReader = normalizeRuntimeReader(rawRuntimeReader);

  const presentationObjects = deepFreeze({
    schemaId: runtimeAtlasPresentationObjectsSchemaId,
    roadPresentations: buildRoadPresentations(runtimeReader),
    buildingPresentations: buildBuildingPresentations(runtimeReader),
    parkPresentations: buildParkPresentations(runtimeReader),
    poiPresentations: buildPoiPresentations(runtimeReader)
  });

  const layerBase = deepFreeze({
    schemaId: atlasPresentationRuntimeLayerSchemaId,
    layerId: `${runtimeReader.readerId}_ATLAS_PRESENTATION`,
    packageId: runtimeReader.packageId,
    regionId: runtimeReader.regionId,
    styleProfile: "GROWGO_PAPERCUT_2_5D",
    geometryPreservationMode: "SOURCE_GEOMETRY_PRESERVED",
    presentationObjects,
    validation: null
  });

  const validation = buildAtlasPresentationValidation(layerBase);

  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateAtlasPresentationRuntimeLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasPresentationRuntimeLayer(rawLayer) {
  try {
    const layer = rawLayer;
    assertPresent(layer?.presentationObjects, "Presentation objects are required.");
    assertPresent(layer?.validation, "Atlas presentation validation is required.");

    validatePresentationCollection(layer.presentationObjects.roadPresentations, "road");
    validatePresentationCollection(
      layer.presentationObjects.buildingPresentations,
      "building"
    );
    validatePresentationCollection(layer.presentationObjects.parkPresentations, "park");
    validatePresentationCollection(layer.presentationObjects.poiPresentations, "poi");

    for (const key of [
      "sourceGeometryPreserved",
      "presentationRulesValid",
      "assetReferencesValid",
      "provenanceMaintained",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (layer.validation[key] !== true) {
        throw createValidationError(
          "atlas_presentation_validation_failed",
          `Atlas presentation validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildValidationSignatureSource(layer)
    );
    if (expectedSignature !== layer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_presentation_signature_mismatch",
        "Atlas presentation deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasPresentationRuntimeLayer: layer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_presentation_validation_failed",
      message: error.message,
      atlasPresentationRuntimeLayer: null
    });
  }
}

function normalizeRuntimeReader(rawRuntimeReader) {
  const validation = validateRegionPackageRuntimeReader(rawRuntimeReader);
  if (!validation.ok) {
    throw createValidationError("invalid_runtime_reader", validation.message);
  }
  return deepFreeze(structuredClone(validation.runtimeReader));
}

function buildRoadPresentations(runtimeReader) {
  return deepFreeze(
    runtimeReader.runtimeCollections.runtimeRoadObjects.objects
      .map((object) =>
        deepFreeze({
          presentationId: `${object.objectId}_PRESENTATION`,
          presentationType: "ROAD_PRESENTATION",
          roadType: object.objectType,
          assetReference: roadAssetReferenceMap[object.objectType],
          geometryReference: object.geometry,
          sourceReference: object.sourceReference,
          presentationRule: "ATLAS_RULE_ROAD_001",
          styleProfile: "GROWGO_PAPERCUT_2_5D",
          geometryPreservationMode: "SOURCE_GEOMETRY_PRESERVED"
        })
      )
      .sort(compareBy("presentationId"))
  );
}

function buildBuildingPresentations(runtimeReader) {
  return deepFreeze(
    runtimeReader.runtimeCollections.runtimeBuildingReferenceObjects.objects
      .map((object) =>
        deepFreeze({
          presentationId: `${object.objectId}_PRESENTATION`,
          presentationType: "BUILDING_PRESENTATION",
          buildingType: object.objectType,
          assetRecipe: resolveBuildingRecipe(object.objectType),
          footprintReference: object.geometry,
          sourceReference: object.sourceReference,
          interpretationMetadata: object.interpretationMetadata,
          presentationRule: "ATLAS_RULE_BUILDING_001",
          styleProfile: "GROWGO_PAPERCUT_2_5D",
          geometryPreservationMode: "SOURCE_GEOMETRY_PRESERVED"
        })
      )
      .sort(compareBy("presentationId"))
  );
}

function buildParkPresentations(runtimeReader) {
  return deepFreeze(
    runtimeReader.runtimeCollections.runtimeNaturalFeatureObjects.objects
      .filter((object) => ["PARK", "RESERVE", "BEACH", "FOREST", "WATERWAY"].includes(object.objectType))
      .map((object) =>
        deepFreeze({
          presentationId: `${object.objectId}_PRESENTATION`,
          presentationType: "NATURAL_FEATURE_PRESENTATION",
          naturalFeatureType: object.objectType,
          realBoundary: object.geometry,
          treatmentStyle: naturalTreatmentStyleMap[object.objectType],
          sourceReference: object.sourceReference,
          gameplayCompatibilityTags: object.gameplayCompatibilityTags,
          presentationRule:
            object.objectType === "BEACH"
              ? "ATLAS_RULE_WATERFRONT_001"
              : "ATLAS_RULE_GREEN_SPACE_001",
          styleProfile: "GROWGO_PAPERCUT_2_5D",
          geometryPreservationMode: "SOURCE_GEOMETRY_PRESERVED"
        })
      )
      .sort(compareBy("presentationId"))
  );
}

function buildPoiPresentations(runtimeReader) {
  return deepFreeze(
    runtimeReader.runtimeCollections.runtimePoiObjects.objects
      .map((object) =>
        deepFreeze({
          presentationId: `${object.objectId}_PRESENTATION`,
          presentationType: "POI_PRESENTATION",
          poiType: object.objectType,
          presentationRule: poiPresentationRuleMap[object.objectType],
          visualTreatment: resolvePoiVisualTreatment(object),
          geometryReference: object.geometry,
          sourceReference: object.sourceReference,
          interpretationMetadata: object.interpretationMetadata,
          gameplayCompatibilityTags: object.gameplayCompatibilityTags,
          styleProfile: "GROWGO_PAPERCUT_2_5D",
          geometryPreservationMode: "SOURCE_GEOMETRY_PRESERVED"
        })
      )
      .sort(compareBy("presentationId"))
  );
}

function resolveBuildingRecipe(buildingType) {
  return buildingRecipeMap[buildingType] ?? `RECIPE_BUILDING_${buildingType}_PRESENTATION_001`;
}

function resolvePoiVisualTreatment(object) {
  if (object.objectType === "LANDMARK") {
    return "LANDMARK_FOCAL_PRESENTATION";
  }
  if (object.objectType === "SERVICE") {
    return "BUSINESS_FRONTAGE_PRESENTATION";
  }
  if (object.objectType === "ATTRACTION") {
    return "ATTRACTION_MARKER_PRESENTATION";
  }
  return "CULTURAL_SITE_PRESENTATION";
}

function buildAtlasPresentationValidation(layerBase) {
  const allPresentations = flattenPresentations(layerBase.presentationObjects);
  const validationWithoutHash = deepFreeze({
    schemaId: atlasPresentationValidationSchemaId,
    sourceGeometryPreserved: allPresentations.every((presentation) =>
      presentation.geometryReference !== undefined ||
      presentation.footprintReference !== undefined ||
      presentation.realBoundary !== undefined
    ),
    presentationRulesValid: allPresentations.every(
      (presentation) =>
        typeof presentation.presentationRule === "string" &&
        presentation.presentationRule.startsWith("ATLAS_RULE_")
    ),
    assetReferencesValid: allPresentations.every(
      (presentation) =>
        typeof presentation.assetReference === "string" ||
        typeof presentation.assetRecipe === "string" ||
        typeof presentation.treatmentStyle === "string" ||
        typeof presentation.visualTreatment === "string"
    ),
    provenanceMaintained: allPresentations.every(
      (presentation) =>
        typeof presentation.sourceReference?.sourceFeatureId === "string" &&
        typeof presentation.sourceReference?.provider === "string"
    ),
    deterministicOutput: true,
    validationPassed: true,
    reasons: deepFreeze([
      "source geometry preserved",
      "presentation rules valid",
      "asset references valid",
      "provenance maintained",
      "presentation mapping deterministic"
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

function validatePresentationCollection(collection, kind) {
  if (!Array.isArray(collection)) {
    throw createValidationError(
      "invalid_presentation_collection",
      `Atlas ${kind} presentation collection must be an array.`
    );
  }

  for (const presentation of collection) {
    assertPresent(presentation.presentationId, `Atlas ${kind} presentationId is required.`);
    assertPresent(presentation.presentationType, `Atlas ${kind} presentationType is required.`);
    assertPresent(presentation.sourceReference, `Atlas ${kind} sourceReference is required.`);
    assertPresent(presentation.presentationRule, `Atlas ${kind} presentationRule is required.`);
    assertPresent(
      presentation.geometryPreservationMode,
      `Atlas ${kind} geometryPreservationMode is required.`
    );
  }
}

function flattenPresentations(presentationObjects) {
  return [
    ...presentationObjects.roadPresentations,
    ...presentationObjects.buildingPresentations,
    ...presentationObjects.parkPresentations,
    ...presentationObjects.poiPresentations
  ];
}

function buildValidationSignatureSource(layer) {
  return {
    layerId: layer.layerId,
    packageId: layer.packageId,
    presentationObjects: layer.presentationObjects,
    validationFlags: layer.validation
      ? {
          sourceGeometryPreserved: layer.validation.sourceGeometryPreserved,
          presentationRulesValid: layer.validation.presentationRulesValid,
          assetReferencesValid: layer.validation.assetReferencesValid,
          provenanceMaintained: layer.validation.provenanceMaintained,
          deterministicOutput: layer.validation.deterministicOutput,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
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
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return value;
}
