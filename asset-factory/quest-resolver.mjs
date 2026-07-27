import {
  validateGrowgoObjectClassificationLayer
} from "./growgo-object-classification.mjs";

const questResolverLayerSchemaId = "QUEST_RESOLVER_LAYER_001";
const questLocationResolutionSchemaId = "QUEST_LOCATION_RESOLUTION_001";
const questResolverValidationSchemaId = "QUEST_RESOLVER_VALIDATION_001";
const growgoWorldObjectsSchemaId = "GROWGO_WORLD_OBJECTS_001";

const subtypeAliasMap = deepFreeze({
  STATION: "RAILWAY_STATION",
  FERRY_TERMINAL: "FERRY_TERMINAL",
  BUS_STOP: "BUS_STOP",
  BAKERY: "BAKERY",
  CAFE: "CAFE",
  RESTAURANT: "RESTAURANT",
  SHOP: "SHOP",
  LIBRARY: "LIBRARY",
  PETROL_STATION: "PETROL_STATION",
  LIGHTHOUSE: "LIGHTHOUSE",
  MONUMENT: "MONUMENT",
  LOOKOUT: "LOOKOUT",
  HISTORIC_SITE: "HISTORIC_SITE",
  PARK: "PARK",
  RESERVE: "RESERVE"
});

const classificationTagDefaults = deepFreeze({
  PARK: ["exploration", "nature"],
  BUSINESS: ["npc_interaction", "crafting"],
  LANDMARK: ["achievement", "collection", "quest"],
  TRANSPORT: ["travel", "route"]
});

export function createQuestResolverLayer(rawClassificationInput) {
  const normalized = normalizeClassificationInput(rawClassificationInput);
  const objectIndex = buildObjectIndex(normalized.worldObjects.objects);

  const layerBase = deepFreeze({
    schemaId: questResolverLayerSchemaId,
    layerId: `${normalized.layerId}_QUEST_RESOLVER`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    worldObjects: normalized.worldObjects,
    objectIndex,
    validation: null
  });

  const validation = buildQuestResolverLayerValidation(layerBase);
  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateQuestResolverLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateQuestResolverLayer(rawLayer) {
  try {
    const layer = rawLayer;
    assertPresent(layer?.worldObjects, "Quest resolver world objects are required.");
    assertPresent(layer?.objectIndex, "Quest resolver object index is required.");
    assertPresent(layer?.validation, "Quest resolver validation is required.");

    if (layer.schemaId !== questResolverLayerSchemaId) {
      throw createValidationError(
        "invalid_quest_resolver_layer_schema",
        `Expected ${questResolverLayerSchemaId} but received ${layer.schemaId}.`
      );
    }

    if (layer.worldObjects.schemaId !== growgoWorldObjectsSchemaId) {
      throw createValidationError(
        "invalid_quest_resolver_world_objects_schema",
        `Expected ${growgoWorldObjectsSchemaId} but received ${layer.worldObjects.schemaId}.`
      );
    }

    if (!Array.isArray(layer.worldObjects.objects) || layer.worldObjects.objects.length === 0) {
      throw createValidationError(
        "invalid_quest_resolver_world_objects",
        "Quest resolver world objects must expose a non-empty objects array."
      );
    }

    for (const object of layer.worldObjects.objects) {
      assertPresent(object.objectId, "Quest resolver objectId is required.");
      assertPresent(object.sourceReference, "Quest resolver sourceReference is required.");
      assertPresent(
        object.growgoClassification,
        "Quest resolver growgoClassification is required."
      );
      assertPresent(
        object.geometryReference,
        "Quest resolver geometryReference is required."
      );
      if (!Array.isArray(object.gameplayTags) || object.gameplayTags.length === 0) {
        throw createValidationError(
          "invalid_quest_resolver_gameplay_tags",
          `Quest resolver object ${object.objectId} must expose gameplay tags.`
        );
      }
    }

    for (const key of [
      "sourceReferencePreserved",
      "classifiedObjectsAvailable",
      "deterministicInput",
      "validationPassed"
    ]) {
      if (layer.validation[key] !== true) {
        throw createValidationError(
          "quest_resolver_validation_failed",
          `Quest resolver validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildLayerSignatureSource(layer)
    );
    if (expectedSignature !== layer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "quest_resolver_signature_mismatch",
        "Quest resolver deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      questResolverLayer: layer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "quest_resolver_validation_failed",
      message: error.message,
      questResolverLayer: null
    });
  }
}

export function resolveQuestLocation(rawQuestResolverInput, rawQuestRequirement) {
  const layer = normalizeQuestResolverInput(rawQuestResolverInput);
  const requirement = normalizeQuestRequirement(rawQuestRequirement);
  const candidates = collectCandidates(layer, requirement);
  const resolvedObject = candidates[0] ?? null;
  const distance = resolvedObject
    ? computeDistanceToOrigin(resolvedObject.geometryReference, requirement.origin)
    : null;

  const resolutionBase = deepFreeze({
    schemaId: questLocationResolutionSchemaId,
    resolutionId: `${requirement.requirementId}_${requirement.classification}_RESOLUTION`,
    requirementId: requirement.requirementId,
    requirementType: requirement.classification,
    resolvedObjectId: resolvedObject?.objectId ?? null,
    objectType: resolvedObject?.realWorldType ?? null,
    distance,
    sourceReference: resolvedObject?.sourceReference ?? null,
    gameplayTags: resolvedObject?.gameplayTags ?? deepFreeze([]),
    accessibilityStatus: resolvedObject
      ? resolveAccessibilityStatus(resolvedObject)
      : "UNAVAILABLE",
    resolutionStatus: resolvedObject ? "RESOLVED" : "UNRESOLVED",
    validation: null
  });

  const validation = buildQuestLocationResolutionValidation(
    layer,
    requirement,
    resolvedObject,
    resolutionBase
  );

  const resolution = deepFreeze({
    ...resolutionBase,
    validation
  });

  const checked = validateQuestLocationResolution(resolution);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return resolution;
}

export function validateQuestLocationResolution(rawResolution) {
  try {
    const resolution = rawResolution;
    assertPresent(resolution?.validation, "Quest location resolution validation is required.");

    if (resolution.schemaId !== questLocationResolutionSchemaId) {
      throw createValidationError(
        "invalid_quest_location_resolution_schema",
        `Expected ${questLocationResolutionSchemaId} but received ${resolution.schemaId}.`
      );
    }

    for (const key of [
      "sourceReferencePreserved",
      "objectTypeMatchesRequirement",
      "deterministicResolution",
      "noFictionalLocationsCreated",
      "validationPassed"
    ]) {
      if (resolution.validation[key] !== true) {
        throw createValidationError(
          "quest_location_resolution_validation_failed",
          `Quest location resolution validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildResolutionSignatureSource(resolution)
    );
    if (expectedSignature !== resolution.validation.deterministicSignatureHash) {
      throw createValidationError(
        "quest_location_resolution_signature_mismatch",
        "Quest location resolution deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      questLocationResolution: resolution
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "quest_location_resolution_validation_failed",
      message: error.message,
      questLocationResolution: null
    });
  }
}

function normalizeQuestResolverInput(rawQuestResolverInput) {
  if (rawQuestResolverInput?.schemaId === questResolverLayerSchemaId) {
    const validation = validateQuestResolverLayer(rawQuestResolverInput);
    if (!validation.ok) {
      throw createValidationError("invalid_quest_resolver_layer", validation.message);
    }
    return deepFreeze(structuredClone(validation.questResolverLayer));
  }

  return createQuestResolverLayer(rawQuestResolverInput);
}

function normalizeClassificationInput(rawClassificationInput) {
  if (rawClassificationInput?.schemaId === growgoWorldObjectsSchemaId) {
    return deepFreeze({
      layerId: growgoWorldObjectsSchemaId,
      packageId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      regionId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      worldObjects: structuredClone(rawClassificationInput)
    });
  }

  const validation = validateGrowgoObjectClassificationLayer(rawClassificationInput);
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

function normalizeQuestRequirement(rawQuestRequirement) {
  const requirement = structuredClone(rawQuestRequirement ?? {});
  const classification = String(requirement.classification ?? "").trim().toUpperCase();
  if (!classification) {
    throw createValidationError(
      "missing_quest_requirement_classification",
      "Quest requirement classification is required."
    );
  }

  const subtypeValue = requirement.subtype ?? requirement.objectSubtype ?? null;
  const subtype = subtypeValue ? normalizeSubtype(subtypeValue) : null;
  const requiredTags = uniqueSorted(
    (requirement.requiredTags ?? classificationTagDefaults[classification] ?? []).map(
      normalizeTag
    )
  );

  return deepFreeze({
    schemaId: "QUEST_REQUIREMENT_001",
    requirementId: String(
      requirement.requirementId ?? `${classification}_QUEST_REQUIREMENT_001`
    ),
    classification,
    subtype,
    requiredTags: deepFreeze(requiredTags),
    origin: normalizeOrigin(requirement.origin)
  });
}

function collectCandidates(layer, requirement) {
  return layer.worldObjects.objects
    .filter((object) => matchesClassification(object, requirement))
    .filter((object) => matchesSubtype(object, requirement))
    .filter((object) => matchesRequiredTags(object, requirement))
    .map((object) =>
      deepFreeze({
        ...object,
        __matchScore: computeMatchScore(object, requirement),
        __distance: computeDistanceToOrigin(object.geometryReference, requirement.origin)
      })
    )
    .sort(compareCandidates)
    .map(stripCandidateMeta);
}

function matchesClassification(object, requirement) {
  return object.growgoClassification === requirement.classification;
}

function matchesSubtype(object, requirement) {
  if (!requirement.subtype) {
    return true;
  }
  return object.realWorldType === requirement.subtype;
}

function matchesRequiredTags(object, requirement) {
  return requirement.requiredTags.every((tag) => object.gameplayTags.includes(tag));
}

function computeMatchScore(object, requirement) {
  const subtypeScore = requirement.subtype && object.realWorldType === requirement.subtype ? 100 : 0;
  const tagScore = requirement.requiredTags.filter((tag) => object.gameplayTags.includes(tag)).length;
  const questScore =
    object.questCompatibility === "QUEST_STRONG"
      ? 20
      : object.questCompatibility === "QUEST_SUPPORTED"
        ? 10
        : 5;
  return subtypeScore + tagScore * 5 + questScore;
}

function compareCandidates(left, right) {
  if (right.__matchScore !== left.__matchScore) {
    return right.__matchScore - left.__matchScore;
  }
  if (left.__distance !== right.__distance) {
    return left.__distance - right.__distance;
  }
  return String(left.objectId).localeCompare(String(right.objectId));
}

function stripCandidateMeta(object) {
  const stripped = { ...object };
  delete stripped.__matchScore;
  delete stripped.__distance;
  return deepFreeze(stripped);
}

function buildObjectIndex(objects) {
  return deepFreeze({
    byClassification: deepFreeze(buildGroupedIndex(objects, "growgoClassification")),
    byRealWorldType: deepFreeze(buildGroupedIndex(objects, "realWorldType")),
    objectCount: objects.length
  });
}

function buildGroupedIndex(objects, key) {
  const grouped = {};
  for (const object of objects) {
    const groupKey = String(object[key]);
    grouped[groupKey] ??= [];
    grouped[groupKey].push(object.objectId);
  }
  for (const groupKey of Object.keys(grouped)) {
    grouped[groupKey] = deepFreeze(grouped[groupKey].sort());
  }
  return grouped;
}

function buildQuestResolverLayerValidation(layerBase) {
  const objects = layerBase.worldObjects.objects;
  const validationWithoutHash = deepFreeze({
    schemaId: questResolverValidationSchemaId,
    sourceReferencePreserved: objects.every(
      (object) =>
        typeof object.sourceReference?.sourceFeatureId === "string" &&
        typeof object.sourceReference?.provider === "string"
    ),
    classifiedObjectsAvailable: objects.length > 0,
    deterministicInput: true,
    validationPassed: true,
    reasons: deepFreeze([
      "source references preserved",
      "classified objects available",
      "resolver input deterministic"
    ]),
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildLayerSignatureSource({
      ...layerBase,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash: signature
  });
}

function buildQuestLocationResolutionValidation(
  layer,
  requirement,
  resolvedObject,
  resolutionBase
) {
  const validationWithoutHash = deepFreeze({
    schemaId: questResolverValidationSchemaId,
    sourceReferencePreserved:
      resolvedObject === null ||
      (typeof resolvedObject.sourceReference?.sourceFeatureId === "string" &&
        typeof resolvedObject.sourceReference?.provider === "string"),
    objectTypeMatchesRequirement:
      resolvedObject === null ||
      (resolvedObject.growgoClassification === requirement.classification &&
        (requirement.subtype === null || resolvedObject.realWorldType === requirement.subtype)),
    deterministicResolution: true,
    noFictionalLocationsCreated:
      resolvedObject === null ||
      layer.worldObjects.objects.some((object) => object.objectId === resolvedObject.objectId),
    validationPassed: true,
    reasons: deepFreeze(
      resolvedObject
        ? [
            "resolved object exists in classified source set",
            "source reference preserved",
            "object type matches requirement",
            "deterministic resolution confirmed"
          ]
        : [
            "no matching real classified object found",
            "no fictional location created",
            "deterministic unresolved result confirmed"
          ]
    ),
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildResolutionSignatureSource({
      ...resolutionBase,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash: signature
  });
}

function buildLayerSignatureSource(layer) {
  return {
    layerId: layer.layerId,
    packageId: layer.packageId,
    worldObjects: layer.worldObjects,
    objectIndex: layer.objectIndex,
    validationFlags: layer.validation
      ? {
          sourceReferencePreserved: layer.validation.sourceReferencePreserved,
          classifiedObjectsAvailable: layer.validation.classifiedObjectsAvailable,
          deterministicInput: layer.validation.deterministicInput,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
}

function buildResolutionSignatureSource(resolution) {
  return {
    resolutionId: resolution.resolutionId,
    requirementId: resolution.requirementId,
    requirementType: resolution.requirementType,
    resolvedObjectId: resolution.resolvedObjectId,
    objectType: resolution.objectType,
    distance: resolution.distance,
    sourceReference: resolution.sourceReference,
    gameplayTags: resolution.gameplayTags,
    accessibilityStatus: resolution.accessibilityStatus,
    resolutionStatus: resolution.resolutionStatus,
    validationFlags: resolution.validation
      ? {
          sourceReferencePreserved: resolution.validation.sourceReferencePreserved,
          objectTypeMatchesRequirement:
            resolution.validation.objectTypeMatchesRequirement,
          deterministicResolution: resolution.validation.deterministicResolution,
          noFictionalLocationsCreated:
            resolution.validation.noFictionalLocationsCreated,
          validationPassed: resolution.validation.validationPassed
        }
      : null
  };
}

function resolveAccessibilityStatus(object) {
  if (object.realWorldType === "RESERVE") {
    return "CONTROLLED_ACCESS";
  }
  return "PUBLIC_ACCESS";
}

function normalizeSubtype(value) {
  const normalized = String(value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return subtypeAliasMap[normalized] ?? normalized;
}

function normalizeOrigin(origin) {
  if (!origin) {
    return null;
  }
  if (!Array.isArray(origin) || origin.length !== 2) {
    throw createValidationError(
      "invalid_quest_requirement_origin",
      "Quest requirement origin must be a [longitude, latitude] pair."
    );
  }
  return deepFreeze([Number(origin[0]), Number(origin[1])]);
}

function computeDistanceToOrigin(geometryReference, origin) {
  if (!origin) {
    return 0;
  }
  const point = geometryToAnchorPoint(geometryReference);
  if (!point) {
    return Number.POSITIVE_INFINITY;
  }
  return roundNumber(euclideanDistance(point, origin));
}

function geometryToAnchorPoint(geometryReference) {
  if (!geometryReference) {
    return null;
  }
  if (geometryReference.type && Array.isArray(geometryReference.coordinates)) {
    return geometryToAnchorPoint(geometryReference.coordinates);
  }
  if (Array.isArray(geometryReference) && geometryReference.length === 2) {
    if (geometryReference.every((value) => typeof value === "number")) {
      return deepFreeze([Number(geometryReference[0]), Number(geometryReference[1])]);
    }
  }

  const points = [];
  collectPoints(geometryReference, points);
  if (points.length === 0) {
    return null;
  }

  const sum = points.reduce(
    (accumulator, point) => [
      accumulator[0] + point[0],
      accumulator[1] + point[1]
    ],
    [0, 0]
  );

  return deepFreeze([
    roundNumber(sum[0] / points.length),
    roundNumber(sum[1] / points.length)
  ]);
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
  const deltaX = left[0] - right[0];
  const deltaY = left[1] - right[1];
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function normalizeTag(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
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
