import {
  validateGrowgoObjectClassificationLayer
} from "./growgo-object-classification.mjs";

const atlasObjectRelationshipLayerSchemaId = "ATLAS_OBJECT_RELATIONSHIP_LAYER_001";
const atlasObjectRelationshipsSchemaId = "ATLAS_OBJECT_RELATIONSHIPS_001";
const atlasObjectRelationshipValidationSchemaId =
  "ATLAS_OBJECT_RELATIONSHIP_VALIDATION_001";

const proximityThresholds = deepFreeze({
  nearby: 0.12,
  adjacent: 0.03,
  transport: 0.35,
  nature: 0.05
});

export function createAtlasObjectRelationshipLayer(rawInput) {
  const normalized = normalizeWorldObjectInput(rawInput);
  const relationships = buildAtlasObjectRelationships(normalized.worldObjects.objects);

  const layerBase = deepFreeze({
    schemaId: atlasObjectRelationshipLayerSchemaId,
    layerId: `${normalized.layerId}_OBJECT_RELATIONSHIPS`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    relationships: deepFreeze({
      schemaId: atlasObjectRelationshipsSchemaId,
      entries: relationships
    }),
    validation: null
  });

  const validation = buildRelationshipValidation(layerBase, normalized.worldObjects.objects);
  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateAtlasObjectRelationshipLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasObjectRelationshipLayer(rawLayer) {
  try {
    const layer = rawLayer;
    if (layer?.schemaId !== atlasObjectRelationshipLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_object_relationship_layer_schema",
        `Expected ${atlasObjectRelationshipLayerSchemaId} but received ${layer?.schemaId}.`
      );
    }
    assertPresent(layer.relationships, "Atlas object relationships are required.");
    assertPresent(layer.validation, "Atlas object relationship validation is required.");

    if (layer.relationships.schemaId !== atlasObjectRelationshipsSchemaId) {
      throw createValidationError(
        "invalid_atlas_object_relationships_schema",
        `Expected ${atlasObjectRelationshipsSchemaId} but received ${layer.relationships.schemaId}.`
      );
    }
    if (!Array.isArray(layer.relationships.entries) || layer.relationships.entries.length === 0) {
      throw createValidationError(
        "invalid_atlas_object_relationship_entries",
        "Atlas object relationships must expose a non-empty entries array."
      );
    }

    const objectIds = new Set(layer.validation.objectIds);
    for (const entry of layer.relationships.entries) {
      assertPresent(entry.relationshipId, "Relationship relationshipId is required.");
      assertPresent(entry.fromObjectId, "Relationship fromObjectId is required.");
      assertPresent(entry.toObjectId, "Relationship toObjectId is required.");
      assertPresent(entry.relationshipType, "Relationship relationshipType is required.");
      assertPresent(entry.relationshipDomain, "Relationship relationshipDomain is required.");
      if (!objectIds.has(entry.fromObjectId) || !objectIds.has(entry.toObjectId)) {
        throw createValidationError(
          "invalid_atlas_object_relationship_reference",
          `Relationship ${entry.relationshipId} references unknown objects.`
        );
      }
    }

    for (const key of [
      "relationshipReferencesValidObjects",
      "noImpossibleRelationships",
      "deterministicOutput",
      "sourceReferencesPreserved",
      "validationPassed"
    ]) {
      if (layer.validation[key] !== true) {
        throw createValidationError(
          "atlas_object_relationship_validation_failed",
          `Atlas object relationship validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildValidationSignatureSource(layer)
    );
    if (expectedSignature !== layer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_object_relationship_signature_mismatch",
        "Atlas object relationship deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasObjectRelationshipLayer: layer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_object_relationship_validation_failed",
      message: error.message,
      atlasObjectRelationshipLayer: null
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

function buildAtlasObjectRelationships(objects) {
  const entries = [];
  const byId = new Map(objects.map((object) => [object.objectId, object]));
  const businesses = objects.filter((object) => object.growgoClassification === "BUSINESS");
  const parks = objects.filter((object) => object.growgoClassification === "PARK");
  const landmarks = objects.filter((object) => object.growgoClassification === "LANDMARK");
  const transport = objects.filter((object) => object.growgoClassification === "TRANSPORT");
  const natural = objects.filter((object) =>
    object.growgoClassification === "NATURAL_FEATURE" || object.growgoClassification === "PARK"
  );

  for (const business of businesses) {
    const nearestTransport = findNearest(business, transport);
    if (nearestTransport && nearestTransport.distance <= proximityThresholds.transport) {
      entries.push(
        relationshipEntry(
          "served_by_road",
          "TRANSPORT",
          business,
          nearestTransport.object,
          nearestTransport.distance
        )
      );
    }

    const nearbyParks = parks
      .map((park) => ({ object: park, distance: distanceBetweenObjects(business, park) }))
      .filter((result) => result.distance <= proximityThresholds.nearby)
      .sort(compareDistanceThenId);

    for (const parkResult of nearbyParks) {
      entries.push(
        relationshipEntry(
          "nearby",
          "SPATIAL",
          business,
          parkResult.object,
          parkResult.distance
        )
      );
      entries.push(
        relationshipEntry(
          "business_area",
          "COMMERCIAL",
          business,
          parkResult.object,
          parkResult.distance
        )
      );
    }
  }

  for (const park of parks) {
    const nearestTransport = findNearest(park, transport);
    if (nearestTransport && nearestTransport.distance <= proximityThresholds.transport) {
      entries.push(
        relationshipEntry(
          "connected",
          "SPATIAL",
          park,
          nearestTransport.object,
          nearestTransport.distance
        )
      );
      entries.push(
        relationshipEntry(
          "park_has_trail",
          "NATURAL",
          park,
          nearestTransport.object,
          nearestTransport.distance
        )
      );
      entries.push(
        relationshipEntry(
          "has_entrances",
          "NATURAL",
          park,
          nearestTransport.object,
          nearestTransport.distance
        )
      );
    }

    for (const otherNatural of natural) {
      if (otherNatural.objectId === park.objectId) {
        continue;
      }
      const relation = deriveNatureRelationship(park, otherNatural);
      if (relation) {
        entries.push(relation);
      }
    }
  }

  for (const landmark of landmarks) {
    const nearestTransport = findNearest(landmark, transport);
    if (nearestTransport && nearestTransport.distance <= proximityThresholds.transport) {
      entries.push(
        relationshipEntry(
          "reachable",
          "SPATIAL",
          landmark,
          nearestTransport.object,
          nearestTransport.distance
        )
      );
      entries.push(
        relationshipEntry(
          "served_by_road",
          "TRANSPORT",
          landmark,
          nearestTransport.object,
          nearestTransport.distance
        )
      );
    }

    for (const naturalObject of natural) {
      if (naturalObject.objectId === landmark.objectId) {
        continue;
      }
      if (objectInsideArea(landmark, naturalObject)) {
        entries.push(
          relationshipEntry(
            "inside",
            "SPATIAL",
            landmark,
            naturalObject,
            distanceBetweenObjects(landmark, naturalObject)
          )
        );
        if (naturalObject.realWorldType === "BEACH" || naturalObject.realWorldType === "WATERWAY") {
          entries.push(
            relationshipEntry(
              "waterfront_relationship",
              "NATURAL",
              landmark,
              naturalObject,
              distanceBetweenObjects(landmark, naturalObject)
            )
          );
        } else {
          entries.push(
            relationshipEntry(
              "landmark_in_nature_area",
              "NATURAL",
              landmark,
              naturalObject,
              distanceBetweenObjects(landmark, naturalObject)
            )
          );
        }
      }
    }
  }

  for (const route of transport) {
    const servedObjects = [...businesses, ...landmarks, ...parks]
      .map((object) => ({ object, distance: distanceBetweenObjects(route, object) }))
      .filter((result) => result.distance <= proximityThresholds.transport)
      .sort(compareDistanceThenId);

    for (const served of servedObjects) {
      entries.push(
        relationshipEntry(
          "connected",
          "TRANSPORT",
          route,
          served.object,
          served.distance
        )
      );
    }
  }

  return deepFreeze(
    dedupeRelationships(entries)
      .sort(compareBy("relationshipId"))
      .map(deepFreeze)
  );
}

function deriveNatureRelationship(left, right) {
  const distance = distanceBetweenObjects(left, right);
  const overlaps = areasOverlap(left.geometryReference, right.geometryReference);
  const waterfrontPair =
    left.realWorldType === "PARK" &&
    (right.realWorldType === "BEACH" || right.realWorldType === "WATERWAY");
  if (overlaps) {
    return relationshipEntry(
      waterfrontPair ? "waterfront_relationship" : "adjacent",
      "NATURAL",
      left,
      right,
      distance
    );
  }
  if (distance <= proximityThresholds.nature) {
    return relationshipEntry(
      waterfrontPair ? "waterfront_relationship" : "adjacent",
      waterfrontPair ? "NATURAL" : "SPATIAL",
      left,
      right,
      distance
    );
  }
  return null;
}

function relationshipEntry(type, domain, fromObject, toObject, distance) {
  return {
    relationshipId: `${fromObject.objectId}__${type}__${toObject.objectId}`,
    fromObjectId: fromObject.objectId,
    toObjectId: toObject.objectId,
    relationshipType: type,
    relationshipDomain: domain,
    distance: roundNumber(distance),
    sourceReferences: deepFreeze({
      from: fromObject.sourceReference,
      to: toObject.sourceReference
    })
  };
}

function dedupeRelationships(entries) {
  const seen = new Set();
  const deduped = [];
  for (const entry of entries) {
    const key = [
      entry.fromObjectId,
      entry.relationshipType,
      entry.toObjectId
    ].join("|");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }
  return deduped;
}

function buildRelationshipValidation(layerBase, objects) {
  const objectIds = objects.map((object) => object.objectId).sort();
  const idSet = new Set(objectIds);
  const validationWithoutHash = deepFreeze({
    schemaId: atlasObjectRelationshipValidationSchemaId,
    relationshipReferencesValidObjects: layerBase.relationships.entries.every(
      (entry) => idSet.has(entry.fromObjectId) && idSet.has(entry.toObjectId)
    ),
    noImpossibleRelationships: layerBase.relationships.entries.every(
      (entry) => entry.fromObjectId !== entry.toObjectId && entry.distance >= 0
    ),
    deterministicOutput: true,
    sourceReferencesPreserved: layerBase.relationships.entries.every(
      (entry) =>
        typeof entry.sourceReferences?.from?.sourceFeatureId === "string" &&
        typeof entry.sourceReferences?.to?.sourceFeatureId === "string"
    ),
    validationPassed: true,
    objectIds: deepFreeze(objectIds),
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
    relationships: layer.relationships?.entries?.map((entry) => ({
      relationshipId: entry.relationshipId,
      fromObjectId: entry.fromObjectId,
      toObjectId: entry.toObjectId,
      relationshipType: entry.relationshipType,
      relationshipDomain: entry.relationshipDomain,
      distance: entry.distance
    })) ?? [],
    validationFlags: layer.validation
      ? {
          relationshipReferencesValidObjects:
            layer.validation.relationshipReferencesValidObjects,
          noImpossibleRelationships: layer.validation.noImpossibleRelationships,
          deterministicOutput: layer.validation.deterministicOutput,
          sourceReferencesPreserved: layer.validation.sourceReferencesPreserved,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
}

function findNearest(sourceObject, candidates) {
  if (candidates.length === 0) {
    return null;
  }
  return candidates
    .map((object) => ({ object, distance: distanceBetweenObjects(sourceObject, object) }))
    .sort(compareDistanceThenId)[0];
}

function compareDistanceThenId(left, right) {
  if (left.distance !== right.distance) {
    return left.distance - right.distance;
  }
  return String(left.object.objectId).localeCompare(String(right.object.objectId));
}

function distanceBetweenObjects(left, right) {
  const leftPoint = geometryToAnchorPoint(left.geometryReference);
  const rightPoint = geometryToAnchorPoint(right.geometryReference);
  return roundNumber(euclideanDistance(leftPoint, rightPoint));
}

function objectInsideArea(object, areaObject) {
  const point = geometryToAnchorPoint(object.geometryReference);
  const ring = resolvePrimaryPolygonRing(areaObject.geometryReference);
  if (!point || !ring) {
    return false;
  }
  return pointInPolygon(point, ring);
}

function areasOverlap(leftGeometry, rightGeometry) {
  const leftRing = resolvePrimaryPolygonRing(leftGeometry);
  const rightRing = resolvePrimaryPolygonRing(rightGeometry);
  if (!leftRing || !rightRing) {
    return false;
  }
  const leftPoint = geometryToAnchorPoint(leftGeometry);
  const rightPoint = geometryToAnchorPoint(rightGeometry);
  return pointInPolygon(leftPoint, rightRing) || pointInPolygon(rightPoint, leftRing);
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

function resolvePrimaryPolygonRing(geometryReference) {
  if (geometryReference?.type && Array.isArray(geometryReference.coordinates)) {
    return resolvePrimaryPolygonRing(geometryReference.coordinates);
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
  if (
    Array.isArray(geometryReference) &&
    geometryReference.length > 0 &&
    Array.isArray(geometryReference[0]) &&
    Array.isArray(geometryReference[0][0]) &&
    typeof geometryReference[0][0][0] !== "number"
  ) {
    return null;
  }
  return null;
}

function pointInPolygon(point, ring) {
  if (!point || !ring || ring.length < 4) {
    return false;
  }
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
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
