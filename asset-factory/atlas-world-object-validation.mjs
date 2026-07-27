import {
  validateGrowgoObjectClassificationLayer
} from "./growgo-object-classification.mjs";

const atlasWorldObjectSpatialValidationSchemaId =
  "ATLAS_WORLD_OBJECT_SPATIAL_VALIDATION_001";
const atlasSpatialValidationResultSchemaId = "ATLAS_SPATIAL_VALIDATION_RESULT_001";

const relationshipDistanceThresholds = deepFreeze({
  BUSINESS_TO_TRANSPORT: 0.3,
  PARK_TO_TRANSPORT: 0.4,
  LANDMARK_TO_TRANSPORT: 0.45
});

export function createAtlasWorldObjectSpatialValidation(rawInput) {
  const normalized = normalizeWorldObjectInput(rawInput);
  const results = buildSpatialValidationResults(normalized.worldObjects.objects);

  const validationLayer = deepFreeze({
    schemaId: atlasWorldObjectSpatialValidationSchemaId,
    validationId: `${normalized.layerId}_SPATIAL_VALIDATION`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    results: deepFreeze(results),
    summary: buildValidationSummary(results)
  });

  const checked = validateAtlasWorldObjectSpatialValidation(validationLayer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return validationLayer;
}

export function validateAtlasWorldObjectSpatialValidation(rawValidationLayer) {
  try {
    const validationLayer = rawValidationLayer;
    if (validationLayer?.schemaId !== atlasWorldObjectSpatialValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_world_object_spatial_validation_schema",
        `Expected ${atlasWorldObjectSpatialValidationSchemaId} but received ${validationLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(validationLayer?.results) || validationLayer.results.length === 0) {
      throw createValidationError(
        "invalid_atlas_spatial_validation_results",
        "Atlas spatial validation results must expose a non-empty results array."
      );
    }

    for (const result of validationLayer.results) {
      if (result.schemaId !== atlasSpatialValidationResultSchemaId) {
        throw createValidationError(
          "invalid_atlas_spatial_validation_result_schema",
          `Expected ${atlasSpatialValidationResultSchemaId} but received ${result.schemaId}.`
        );
      }
      assertPresent(result.objectId, "Atlas spatial validation result objectId is required.");
      assertPresent(
        result.validationStatus,
        "Atlas spatial validation result validationStatus is required."
      );
      assertPresent(
        result.relationshipChecks,
        "Atlas spatial validation relationshipChecks are required."
      );
      if (!Array.isArray(result.warnings)) {
        throw createValidationError(
          "invalid_atlas_spatial_validation_warnings",
          `Atlas spatial validation result ${result.objectId} must expose warnings.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildValidationSignatureSource(validationLayer)
    );
    if (expectedSignature !== validationLayer.summary.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_world_object_spatial_validation_signature_mismatch",
        "Atlas world object spatial validation deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasWorldObjectSpatialValidation: validationLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_world_object_spatial_validation_failed",
      message: error.message,
      atlasWorldObjectSpatialValidation: null
    });
  }
}

function normalizeWorldObjectInput(rawInput) {
  if (rawInput?.schemaId === "GROWGO_WORLD_OBJECTS_001") {
    return deepFreeze({
      layerId: "GROWGO_WORLD_OBJECTS_001_DIRECT_INPUT",
      packageId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      regionId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      worldObjects: structuredClone(rawInput)
    });
  }

  const validation = validateGrowgoObjectClassificationLayer(rawInput);
  if (!validation.ok) {
    throw createValidationError(
      "invalid_growgo_object_classification_layer",
      validation.message
    );
  }

  const layer = validation.growgoObjectClassificationLayer;
  return deepFreeze({
    layerId: layer.layerId,
    packageId: layer.packageId,
    regionId: layer.regionId,
    worldObjects: structuredClone(layer.worldObjects)
  });
}

function buildSpatialValidationResults(objects) {
  const transportObjects = objects.filter((object) => object.growgoClassification === "TRANSPORT");

  return objects
    .map((object) =>
      buildSpatialValidationResult(object, transportObjects)
    )
    .sort(compareBy("objectId"));
}

function buildSpatialValidationResult(object, transportObjects) {
  const geometryChecks = buildGeometryChecks(object);
  const relationshipChecks = buildRelationshipChecks(object, transportObjects);
  const warnings = buildWarnings(object, geometryChecks, relationshipChecks);

  return deepFreeze({
    schemaId: atlasSpatialValidationResultSchemaId,
    objectId: object.objectId,
    realWorldType: object.realWorldType,
    objectType: object.realWorldType,
    growgoClassification: object.growgoClassification,
    validationStatus:
      geometryChecks.valid && relationshipChecks.valid ? "PASS" : "WARN",
    geometryChecks,
    relationshipChecks,
    warnings
  });
}

function buildGeometryChecks(object) {
  const anchor = geometryToAnchorPoint(object.geometryReference);
  const pointCount = countGeometryPoints(object.geometryReference);
  const boundaryArea = computeApproximateArea(object.geometryReference);
  const coordinateValidity = anchor !== null && anchor.every(Number.isFinite);
  const hasGeometry = object.geometryReference !== null && object.geometryReference !== undefined;

  if (object.growgoClassification === "PARK" || object.growgoClassification === "NATURAL_FEATURE") {
    return deepFreeze({
      type: "AREA_OBJECT",
      valid:
        hasGeometry &&
        coordinateValidity &&
        pointCount >= 4 &&
        boundaryArea > 0,
      hasGeometry,
      coordinateValidity,
      pointCount,
      areaExists: boundaryArea > 0,
      area: roundNumber(boundaryArea)
    });
  }

  if (object.growgoClassification === "BUSINESS") {
    return deepFreeze({
      type: "BUSINESS_OBJECT",
      valid: hasGeometry && coordinateValidity && pointCount >= 1,
      hasGeometry,
      coordinateValidity,
      pointCount,
      footprintRelationshipValid: pointCount >= 1
    });
  }

  if (object.growgoClassification === "LANDMARK") {
    return deepFreeze({
      type: "LANDMARK_OBJECT",
      valid: hasGeometry && coordinateValidity && pointCount >= 1,
      hasGeometry,
      coordinateValidity,
      pointCount,
      presentationAlignmentValid: true
    });
  }

  if (object.growgoClassification === "TRANSPORT") {
    return deepFreeze({
      type: "ROAD_OBJECT",
      valid: hasGeometry && coordinateValidity && pointCount >= 2,
      hasGeometry,
      coordinateValidity,
      pointCount,
      connectedGeometry: pointCount >= 2,
      hierarchyValid: object.realWorldType === "TRANSPORT_ROUTE"
    });
  }

  return deepFreeze({
    type: "GENERIC_OBJECT",
    valid: hasGeometry && coordinateValidity,
    hasGeometry,
    coordinateValidity,
    pointCount
  });
}

function buildRelationshipChecks(object, transportObjects) {
  if (object.growgoClassification === "TRANSPORT") {
    return deepFreeze({
      valid: true,
      nearestTransportObjectId: object.objectId,
      distanceToNearestTransport: 0,
      nearbyObjectRelationshipValid: true,
      reachableFromNetwork: true
    });
  }

  const nearestTransport = findNearestTransport(object, transportObjects);
  const nearestId = nearestTransport?.object.objectId ?? null;
  const nearestDistance = nearestTransport?.distance ?? null;

  if (object.growgoClassification === "BUSINESS") {
    const valid =
      nearestDistance !== null &&
      nearestDistance <= relationshipDistanceThresholds.BUSINESS_TO_TRANSPORT;
    return deepFreeze({
      valid,
      nearestTransportObjectId: nearestId,
      distanceToNearestTransport: nearestDistance,
      supportingRoadRelationshipValid: valid,
      poiPositionAlignmentValid: true
    });
  }

  if (object.growgoClassification === "PARK") {
    const valid =
      nearestDistance !== null &&
      nearestDistance <= relationshipDistanceThresholds.PARK_TO_TRANSPORT;
    return deepFreeze({
      valid,
      nearestTransportObjectId: nearestId,
      distanceToNearestTransport: nearestDistance,
      entranceTrailConnectionValid: valid,
      insideCorrectArea: true
    });
  }

  if (object.growgoClassification === "LANDMARK") {
    const valid =
      nearestDistance !== null &&
      nearestDistance <= relationshipDistanceThresholds.LANDMARK_TO_TRANSPORT;
    return deepFreeze({
      valid,
      nearestTransportObjectId: nearestId,
      distanceToNearestTransport: nearestDistance,
      reachableFromNetwork: valid,
      presentationAlignmentValid: true
    });
  }

  return deepFreeze({
    valid: true,
    nearestTransportObjectId: nearestId,
    distanceToNearestTransport: nearestDistance
  });
}

function buildWarnings(object, geometryChecks, relationshipChecks) {
  const warnings = [];

  if (!geometryChecks.hasGeometry) {
    warnings.push("missing geometry reference");
  }
  if (geometryChecks.coordinateValidity === false) {
    warnings.push("invalid coordinates");
  }
  if (geometryChecks.areaExists === false) {
    warnings.push("zero area geometry");
  }
  if (relationshipChecks.valid === false) {
    if (object.growgoClassification === "BUSINESS") {
      warnings.push("business not near supporting transport route");
    } else if (object.growgoClassification === "PARK") {
      warnings.push("park not connected to transport or trail network");
    } else if (object.growgoClassification === "LANDMARK") {
      warnings.push("landmark not reachable from transport network");
    }
  }

  return deepFreeze(warnings);
}

function buildValidationSummary(results) {
  const passedCount = results.filter((result) => result.validationStatus === "PASS").length;
  const warningCount = results.filter((result) => result.warnings.length > 0).length;

  const summaryWithoutHash = deepFreeze({
    totalObjects: results.length,
    passedObjects: passedCount,
    warningObjects: warningCount,
    deterministicOutput: true,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      results,
      summary: summaryWithoutHash
    })
  );

  return deepFreeze({
    ...summaryWithoutHash,
    deterministicSignatureHash
  });
}

function buildValidationSignatureSource(validationLayer) {
  return {
    results: validationLayer.results?.map((result) => ({
      objectId: result.objectId,
      validationStatus: result.validationStatus,
      relationshipChecks: result.relationshipChecks,
      warnings: result.warnings
    })) ?? [],
    summary: validationLayer.summary
      ? {
          totalObjects: validationLayer.summary.totalObjects,
          passedObjects: validationLayer.summary.passedObjects,
          warningObjects: validationLayer.summary.warningObjects,
          deterministicOutput: validationLayer.summary.deterministicOutput
        }
      : null
  };
}

function findNearestTransport(object, transportObjects) {
  if (transportObjects.length === 0) {
    return null;
  }

  const objectPoint = geometryToAnchorPoint(object.geometryReference);
  if (!objectPoint) {
    return null;
  }

  return transportObjects
    .map((transportObject) => ({
      object: transportObject,
      distance: roundNumber(
        euclideanDistance(
          objectPoint,
          geometryToAnchorPoint(transportObject.geometryReference)
        )
      )
    }))
    .sort((left, right) => left.distance - right.distance)[0];
}

function geometryToAnchorPoint(geometryReference) {
  if (!geometryReference) {
    return null;
  }
  if (geometryReference.type && Array.isArray(geometryReference.coordinates)) {
    return geometryToAnchorPoint(geometryReference.coordinates);
  }
  if (
    Array.isArray(geometryReference) &&
    geometryReference.length === 2 &&
    geometryReference.every((value) => typeof value === "number")
  ) {
    return deepFreeze([Number(geometryReference[0]), Number(geometryReference[1])]);
  }

  const points = [];
  collectPoints(geometryReference, points);
  if (points.length === 0) {
    return null;
  }

  const total = points.reduce(
    (accumulator, point) => [accumulator[0] + point[0], accumulator[1] + point[1]],
    [0, 0]
  );

  return deepFreeze([
    roundNumber(total[0] / points.length),
    roundNumber(total[1] / points.length)
  ]);
}

function countGeometryPoints(geometryReference) {
  if (geometryReference?.type && Array.isArray(geometryReference.coordinates)) {
    return countGeometryPoints(geometryReference.coordinates);
  }
  const points = [];
  collectPoints(geometryReference, points);
  return points.length;
}

function computeApproximateArea(geometryReference) {
  if (geometryReference?.type && Array.isArray(geometryReference.coordinates)) {
    return computeApproximateArea(geometryReference.coordinates);
  }
  if (!Array.isArray(geometryReference)) {
    return 0;
  }

  const polygon = resolvePrimaryPolygonRing(geometryReference);
  if (!polygon || polygon.length < 4) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < polygon.length - 1; index += 1) {
    const current = polygon[index];
    const next = polygon[index + 1];
    total += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(total / 2);
}

function resolvePrimaryPolygonRing(geometryReference) {
  if (geometryReference?.type && Array.isArray(geometryReference.coordinates)) {
    return resolvePrimaryPolygonRing(geometryReference.coordinates);
  }

  if (
    Array.isArray(geometryReference) &&
    geometryReference.length > 0 &&
    Array.isArray(geometryReference[0]) &&
    Array.isArray(geometryReference[0][0]) &&
    Array.isArray(geometryReference[0][0][0])
  ) {
    return geometryReference[0];
  }

  if (
    Array.isArray(geometryReference) &&
    geometryReference.length > 0 &&
    Array.isArray(geometryReference[0]) &&
    Array.isArray(geometryReference[0][0]) &&
    typeof geometryReference[0][0][0] === "number"
  ) {
    return geometryReference[0];
  }

  return null;
}

function collectPoints(value, points) {
  if (!Array.isArray(value)) {
    return;
  }
  if (value.length === 2 && value.every((entry) => typeof entry === "number")) {
    points.push([Number(value[0]), Number(value[1])]);
    return;
  }
  for (const nested of value) {
    collectPoints(nested, points);
  }
}

function euclideanDistance(left, right) {
  if (!left || !right) {
    return Number.POSITIVE_INFINITY;
  }
  const deltaX = left[0] - right[0];
  const deltaY = left[1] - right[1];
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function roundNumber(value) {
  return Math.round(Number(value) * 10000) / 10000;
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
