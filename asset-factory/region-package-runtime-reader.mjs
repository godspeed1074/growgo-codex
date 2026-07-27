import {
  validateGrowgoRegionImportPackage
} from "./region-package-builder.mjs";
import {
  createWorldInterpretationLayer,
  validateWorldInterpretationLayer
} from "./world-interpretation-engine.mjs";

const regionPackageRuntimeReaderSchemaId = "REGION_PACKAGE_RUNTIME_READER_001";
const runtimePackageValidationSchemaId = "RUNTIME_PACKAGE_VALIDATION_001";
const runtimeRoadObjectsSchemaId = "RUNTIME_ROAD_OBJECTS_001";
const runtimeSettlementObjectsSchemaId = "RUNTIME_SETTLEMENT_OBJECTS_001";
const runtimePoiObjectsSchemaId = "RUNTIME_POI_OBJECTS_001";
const runtimeNaturalFeatureObjectsSchemaId = "RUNTIME_NATURAL_FEATURE_OBJECTS_001";
const runtimeBuildingReferenceObjectsSchemaId = "RUNTIME_BUILDING_REFERENCE_OBJECTS_001";

const validRoadTypes = new Set(["ROAD", "TRAIL", "PATH", "TRANSPORT_ROUTE"]);
const validSettlementTypes = new Set(["CITY", "TOWN", "SUBURB", "VILLAGE"]);
const validPoiTypes = new Set(["LANDMARK", "ATTRACTION", "SERVICE", "CULTURAL"]);
const validNaturalTypes = new Set(["BEACH", "FOREST", "PARK", "RESERVE", "WATERWAY"]);

export function createRegionPackageRuntimeReader(rawRegionImportPackage) {
  const regionImportPackage = normalizeRegionImportPackage(rawRegionImportPackage);
  const interpretation = createInterpretationFromPackage(regionImportPackage);
  const provenanceLookup = buildProvenanceLookup(regionImportPackage);

  const runtimeCollections = deepFreeze({
    runtimeRoadObjects: buildRuntimeRoadObjects(
      regionImportPackage,
      interpretation,
      provenanceLookup
    ),
    runtimeSettlementObjects: buildRuntimeSettlementObjects(
      regionImportPackage,
      interpretation,
      provenanceLookup
    ),
    runtimePoiObjects: buildRuntimePoiObjects(
      regionImportPackage,
      interpretation,
      provenanceLookup
    ),
    runtimeNaturalFeatureObjects: buildRuntimeNaturalFeatureObjects(
      regionImportPackage,
      interpretation,
      provenanceLookup
    ),
    runtimeBuildingReferenceObjects: buildRuntimeBuildingReferenceObjects(
      regionImportPackage,
      interpretation,
      provenanceLookup
    )
  });

  const readerBase = deepFreeze({
    schemaId: regionPackageRuntimeReaderSchemaId,
    readerId: `${regionImportPackage.packageId}_RUNTIME_READER`,
    packageId: regionImportPackage.packageId,
    regionId: regionImportPackage.regionPackageMetadata.regionId,
    interpretationMetadata: regionImportPackage.interpretationMetadata,
    runtimeCollections,
    validation: null
  });

  const validation = buildRuntimePackageValidation(
    regionImportPackage,
    readerBase,
    interpretation
  );

  const reader = deepFreeze({
    ...readerBase,
    validation
  });

  const checked = validateRegionPackageRuntimeReader(reader);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return reader;
}

export function validateRegionPackageRuntimeReader(rawReader) {
  try {
    const reader = rawReader;

    assertPresent(reader?.runtimeCollections, "Runtime collections are required.");
    assertPresent(reader?.validation, "Runtime validation is required.");

    const collections = reader.runtimeCollections;
    validateObjectCollection(
      collections.runtimeRoadObjects,
      runtimeRoadObjectsSchemaId,
      validRoadTypes
    );
    validateObjectCollection(
      collections.runtimeSettlementObjects,
      runtimeSettlementObjectsSchemaId,
      validSettlementTypes
    );
    validateObjectCollection(
      collections.runtimePoiObjects,
      runtimePoiObjectsSchemaId,
      validPoiTypes,
      true
    );
    validateObjectCollection(
      collections.runtimeNaturalFeatureObjects,
      runtimeNaturalFeatureObjectsSchemaId,
      validNaturalTypes,
      true
    );
    validateObjectCollection(
      collections.runtimeBuildingReferenceObjects,
      runtimeBuildingReferenceObjectsSchemaId,
      null,
      true
    );

    for (const key of [
      "packageVersionValid",
      "provenancePreserved",
      "objectTypesValid",
      "geometryPresent",
      "interpretationMetadataAvailable",
      "deterministicReading",
      "validationPassed"
    ]) {
      if (reader.validation[key] !== true) {
        throw createValidationError(
          "runtime_reader_validation_failed",
          `Runtime validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildRuntimeSignatureSource(reader)
    );
    if (expectedSignature !== reader.validation.deterministicSignatureHash) {
      throw createValidationError(
        "runtime_reader_signature_mismatch",
        "Runtime reader deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      runtimeReader: reader
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "runtime_reader_validation_failed",
      message: error.message,
      runtimeReader: null
    });
  }
}

function normalizeRegionImportPackage(rawRegionImportPackage) {
  const validation = validateGrowgoRegionImportPackage(rawRegionImportPackage);
  if (!validation.ok) {
    throw createValidationError("invalid_region_import_package", validation.message);
  }

  return deepFreeze(structuredClone(validation.regionImportPackage));
}

function createInterpretationFromPackage(regionImportPackage) {
  const interpretation = createWorldInterpretationLayer({
    interpretationSeed: `${regionImportPackage.packageId}_RUNTIME_INTERPRETATION`,
    sourceDataReferences: buildInterpretationInputsFromPackage(regionImportPackage)
  });
  const validation = validateWorldInterpretationLayer(interpretation);
  if (!validation.ok) {
    throw createValidationError("runtime_interpretation_invalid", validation.message);
  }
  return interpretation;
}

function buildInterpretationInputsFromPackage(regionImportPackage) {
  const { normalizedDataContent, regionPackageMetadata } = regionImportPackage;
  const sourceProvider =
    regionImportPackage.provenanceIndex.indexEntries[0]?.provider ?? "UNKNOWN_PROVIDER";
  const datasetId = regionImportPackage.packageId;
  return deepFreeze({
    geographyInput: deepFreeze({
      schemaId: "GEOGRAPHY_INPUT_001",
      inputId: `${datasetId}_GEOGRAPHY_INPUT`,
      sourceProvider,
      boundary: normalizedDataContent.normalizedGeographyData.boundary,
      coastlineFeatures: normalizedDataContent.normalizedGeographyData.coastlineFeatures,
      riverFeatures: normalizedDataContent.normalizedGeographyData.riverFeatures,
      elevationBands: normalizedDataContent.normalizedGeographyData.elevationBands,
      terrainBands: normalizedDataContent.normalizedGeographyData.terrainBands,
      biomeClassification: normalizedDataContent.normalizedGeographyData.biomeClassification,
      protectedAreaFeatures: normalizedDataContent.normalizedGeographyData.protectedAreaFeatures,
      sourceMetadata: deepFreeze({
        datasetId,
        deterministic: true
      })
    }),
    roadNetworkInput: deepFreeze({
      schemaId: "ROAD_NETWORK_INPUT_001",
      inputId: `${datasetId}_ROAD_INPUT`,
      sourceProvider,
      roadSegments: normalizedDataContent.normalizedRoadData.roadSegments,
      trailSegments: normalizedDataContent.normalizedRoadData.trailSegments,
      pathSegments: normalizedDataContent.normalizedRoadData.pathSegments,
      transportRoutes: normalizedDataContent.normalizedRoadData.transportRoutes,
      roadHierarchy: normalizedDataContent.normalizedRoadData.networkHierarchy,
      sourceMetadata: deepFreeze({
        datasetId,
        deterministic: true
      })
    }),
    settlementInput: deepFreeze({
      schemaId: "SETTLEMENT_INPUT_001",
      inputId: `${datasetId}_SETTLEMENT_INPUT`,
      sourceProvider,
      cityRecords: normalizedDataContent.normalizedSettlementData.cityRecords,
      townRecords: normalizedDataContent.normalizedSettlementData.townRecords,
      suburbRecords: normalizedDataContent.normalizedSettlementData.suburbRecords,
      villageRecords: normalizedDataContent.normalizedSettlementData.villageRecords,
      settlementDensity: normalizedDataContent.normalizedSettlementData.settlementDensity,
      sourceMetadata: deepFreeze({
        datasetId,
        deterministic: true
      })
    }),
    poiInput: deepFreeze({
      schemaId: "POI_INPUT_001",
      inputId: `${datasetId}_POI_INPUT`,
      sourceProvider,
      landmarkRecords: normalizedDataContent.normalizedPoiData.landmarkRecords,
      attractionRecords: normalizedDataContent.normalizedPoiData.attractionRecords,
      serviceRecords: normalizedDataContent.normalizedPoiData.serviceRecords,
      culturalLocationRecords:
        normalizedDataContent.normalizedPoiData.culturalLocationRecords,
      sourceMetadata: deepFreeze({
        datasetId,
        deterministic: true
      })
    }),
    naturalFeatureInput: deepFreeze({
      schemaId: "NATURAL_FEATURE_INPUT_001",
      inputId: `${datasetId}_NATURAL_INPUT`,
      sourceProvider,
      beachFeatures: normalizedDataContent.normalizedNaturalFeatureData.beachFeatures,
      parkFeatures: normalizedDataContent.normalizedNaturalFeatureData.parkFeatures,
      forestFeatures: normalizedDataContent.normalizedNaturalFeatureData.forestFeatures,
      reserveFeatures: normalizedDataContent.normalizedNaturalFeatureData.reserveFeatures,
      naturalAttractionRecords:
        normalizedDataContent.normalizedNaturalFeatureData.waterwayFeatures,
      sourceMetadata: deepFreeze({
        datasetId,
        deterministic: true
      })
    })
  });
}

function buildRuntimeRoadObjects(regionImportPackage, interpretation, provenanceLookup) {
  const roads = regionImportPackage.normalizedDataContent.normalizedRoadData;
  const objects = [
    ...roads.roadSegments.map((segment) =>
      runtimeObject({
        objectId: `ROAD_${segment.sourceId}`,
        sourceId: segment.sourceId,
        objectType: "ROAD",
        geometry: segment.geometryReference,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(segment.roadClass), "transport"]
      })
    ),
    ...roads.trailSegments.map((segment) =>
      runtimeObject({
        objectId: `TRAIL_${segment.sourceId}`,
        sourceId: segment.sourceId,
        objectType: "TRAIL",
        geometry: segment.geometryReference,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(segment.trailType), "walking"]
      })
    ),
    ...roads.pathSegments.map((segment) =>
      runtimeObject({
        objectId: `PATH_${segment.sourceId}`,
        sourceId: segment.sourceId,
        objectType: "PATH",
        geometry: segment.geometryReference,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(segment.pathType), "pedestrian"]
      })
    ),
    ...roads.transportRoutes.map((segment) =>
      runtimeObject({
        objectId: `TRANSPORT_ROUTE_${segment.sourceId}`,
        sourceId: segment.sourceId,
        objectType: "TRANSPORT_ROUTE",
        geometry: segment.geometryReference,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(segment.routeType), "transport"]
      })
    )
  ];

  return deepFreeze({
    schemaId: runtimeRoadObjectsSchemaId,
    objects: deepFreeze(objects.sort(compareBy("objectId")))
  });
}

function buildRuntimeSettlementObjects(regionImportPackage, interpretation, provenanceLookup) {
  const settlements = regionImportPackage.normalizedDataContent.normalizedSettlementData;
  const objects = [
    ...settlements.cityRecords.map((record) =>
      runtimeObject({
        objectId: `CITY_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "CITY",
        geometry: record.boundary,
        interpretation,
        provenanceLookup,
        extraTags: ["settlement", normalizeTag(record.name)]
      })
    ),
    ...settlements.townRecords.map((record) =>
      runtimeObject({
        objectId: `TOWN_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "TOWN",
        geometry: record.boundary,
        interpretation,
        provenanceLookup,
        extraTags: ["settlement", normalizeTag(record.name)]
      })
    ),
    ...settlements.suburbRecords.map((record) =>
      runtimeObject({
        objectId: `SUBURB_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "SUBURB",
        geometry: record.boundary,
        interpretation,
        provenanceLookup,
        extraTags: ["residential", normalizeTag(record.name)]
      })
    ),
    ...settlements.villageRecords.map((record) =>
      runtimeObject({
        objectId: `VILLAGE_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "VILLAGE",
        geometry: record.boundary,
        interpretation,
        provenanceLookup,
        extraTags: ["settlement", normalizeTag(record.name)]
      })
    )
  ];

  return deepFreeze({
    schemaId: runtimeSettlementObjectsSchemaId,
    objects: deepFreeze(objects.sort(compareBy("objectId")))
  });
}

function buildRuntimePoiObjects(regionImportPackage, interpretation, provenanceLookup) {
  const pois = regionImportPackage.normalizedDataContent.normalizedPoiData;
  const objects = [
    ...pois.landmarkRecords.map((record) =>
      runtimeObject({
        objectId: `LANDMARK_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "LANDMARK",
        geometry: record.location,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.poiType), "landmark"]
      })
    ),
    ...pois.attractionRecords.map((record) =>
      runtimeObject({
        objectId: `ATTRACTION_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "ATTRACTION",
        geometry: record.location,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.poiType), "attraction"]
      })
    ),
    ...pois.serviceRecords.map((record) =>
      runtimeObject({
        objectId: `SERVICE_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "SERVICE",
        geometry: record.location,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.poiType), "business", "service"]
      })
    ),
    ...pois.culturalLocationRecords.map((record) =>
      runtimeObject({
        objectId: `CULTURAL_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "CULTURAL",
        geometry: record.location,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.poiType), "cultural"]
      })
    )
  ];

  return deepFreeze({
    schemaId: runtimePoiObjectsSchemaId,
    objects: deepFreeze(objects.sort(compareBy("objectId")))
  });
}

function buildRuntimeNaturalFeatureObjects(regionImportPackage, interpretation, provenanceLookup) {
  const natural = regionImportPackage.normalizedDataContent.normalizedNaturalFeatureData;
  const objects = [
    ...natural.beachFeatures.map((record) =>
      runtimeObject({
        objectId: `BEACH_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "BEACH",
        geometry: record.geometry,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.featureType), "nature", "exploration"]
      })
    ),
    ...natural.parkFeatures.map((record) =>
      runtimeObject({
        objectId: `PARK_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "PARK",
        geometry: record.geometry,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.featureType), "nature", "exploration", "quest_candidate"]
      })
    ),
    ...natural.forestFeatures.map((record) =>
      runtimeObject({
        objectId: `FOREST_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "FOREST",
        geometry: record.geometry,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.featureType), "nature"]
      })
    ),
    ...natural.reserveFeatures.map((record) =>
      runtimeObject({
        objectId: `RESERVE_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "RESERVE",
        geometry: record.geometry,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.featureType), "nature", "protected_area"]
      })
    ),
    ...natural.waterwayFeatures.map((record) =>
      runtimeObject({
        objectId: `WATERWAY_${record.sourceId}`,
        sourceId: record.sourceId,
        objectType: "WATERWAY",
        geometry: record.geometry,
        interpretation,
        provenanceLookup,
        extraTags: [normalizeTag(record.featureType), "nature", "water"]
      })
    )
  ];

  return deepFreeze({
    schemaId: runtimeNaturalFeatureObjectsSchemaId,
    objects: deepFreeze(objects.sort(compareBy("objectId")))
  });
}

function buildRuntimeBuildingReferenceObjects(
  regionImportPackage,
  interpretation,
  provenanceLookup
) {
  const pois = regionImportPackage.normalizedDataContent.normalizedPoiData;
  const objects = [
    ...pois.serviceRecords.map((record) =>
      buildingReferenceObject({
        objectId: `BUILDING_REF_SERVICE_${record.sourceId}`,
        sourceId: record.sourceId,
        buildingType: record.poiType,
        geometry: record.location,
        interpretation,
        provenanceLookup,
        extraTags: ["crafting", "quest_candidate", normalizeTag(record.poiType)]
      })
    ),
    ...pois.culturalLocationRecords.map((record) =>
      buildingReferenceObject({
        objectId: `BUILDING_REF_CULTURAL_${record.sourceId}`,
        sourceId: record.sourceId,
        buildingType: record.poiType,
        geometry: record.location,
        interpretation,
        provenanceLookup,
        extraTags: ["cultural", "quest_candidate", normalizeTag(record.poiType)]
      })
    ),
    ...pois.landmarkRecords.map((record) =>
      buildingReferenceObject({
        objectId: `BUILDING_REF_LANDMARK_${record.sourceId}`,
        sourceId: record.sourceId,
        buildingType: record.poiType,
        geometry: record.location,
        interpretation,
        provenanceLookup,
        extraTags: ["landmark", "discovery", normalizeTag(record.poiType)]
      })
    )
  ];

  return deepFreeze({
    schemaId: runtimeBuildingReferenceObjectsSchemaId,
    objects: deepFreeze(objects.sort(compareBy("objectId")))
  });
}

function runtimeObject({
  objectId,
  sourceId,
  objectType,
  geometry,
  interpretation,
  provenanceLookup,
  extraTags = []
}) {
  return deepFreeze({
    objectId,
    sourceReference: buildSourceReference(sourceId, provenanceLookup),
    objectType,
    geometry,
    interpretationMetadata: buildObjectInterpretationMetadata(interpretation, sourceId),
    gameplayCompatibilityTags: deepFreeze(uniqueSorted([
      ...tagsFromGameplayRules(interpretation, sourceId),
      ...extraTags
    ]))
  });
}

function buildingReferenceObject({
  objectId,
  sourceId,
  buildingType,
  geometry,
  interpretation,
  provenanceLookup,
  extraTags = []
}) {
  return deepFreeze({
    objectId,
    sourceReference: buildSourceReference(sourceId, provenanceLookup),
    objectType: buildingType,
    geometry,
    interpretationMetadata: buildObjectInterpretationMetadata(interpretation, sourceId),
    gameplayCompatibilityTags: deepFreeze(uniqueSorted([
      ...tagsFromGameplayRules(interpretation, sourceId),
      "building_reference",
      ...extraTags
    ]))
  });
}

function buildSourceReference(sourceId, provenanceLookup) {
  const record = provenanceLookup.get(sourceId);
  return deepFreeze({
    sourceFeatureId: sourceId,
    provider: record?.provider ?? "UNKNOWN_PROVIDER",
    normalizedFeatureId: record?.normalizedFeatureId ?? sourceId,
    normalizationVersion: record?.normalizationVersion ?? "UNKNOWN"
  });
}

function buildObjectInterpretationMetadata(interpretation, sourceId) {
  return deepFreeze({
    classificationResult: interpretation.classificationResults.primaryWorldType,
    selectedProfile: interpretation.selectedEnvironmentProfile.profileId,
    confidence: interpretation.selectedEnvironmentProfile.profileConfidence,
    matchedGameplayRules: deepFreeze(
      interpretation.gameplayWeighting
        .filter((rule) => rule.sourceFeatureRefs.includes(sourceId))
        .map((rule) => rule.interpretedGameplayType)
        .sort()
    ),
    matchedPresentationRules: deepFreeze(
      interpretation.atlasPresentationRules
        .filter((rule) => rule.sourceFeatureRefs.includes(sourceId))
        .map((rule) => rule.presentationType)
        .sort()
    )
  });
}

function buildProvenanceLookup(regionImportPackage) {
  return new Map(
    regionImportPackage.provenanceIndex.indexEntries.map((entry) => [
      entry.sourceFeatureId,
      entry
    ])
  );
}

function tagsFromGameplayRules(interpretation, sourceId) {
  return interpretation.gameplayWeighting
    .filter((rule) => rule.sourceFeatureRefs.includes(sourceId))
    .flatMap((rule) => [
      normalizeTag(rule.interpretedGameplayType),
      ...rule.achievementRules.map(normalizeTag),
      ...rule.questRules.map(normalizeTag),
      ...rule.collectionRules.map(normalizeTag),
      ...rule.explorationRules.map(normalizeTag)
    ]);
}

function buildRuntimePackageValidation(regionImportPackage, readerBase, interpretation) {
  const allObjects = flattenRuntimeObjects(readerBase.runtimeCollections);
  const validationWithoutHash = deepFreeze({
    schemaId: runtimePackageValidationSchemaId,
    packageVersionValid: regionImportPackage.regionPackageMetadata.packageVersion === "1",
    provenancePreserved: allObjects.every(
      (object) =>
        typeof object.sourceReference.sourceFeatureId === "string" &&
        typeof object.sourceReference.provider === "string"
    ),
    objectTypesValid: allObjects.every((object) => typeof object.objectType === "string"),
    geometryPresent: allObjects.every((object) => object.geometry !== null && object.geometry !== undefined),
    interpretationMetadataAvailable:
      interpretation.validationState.validationPassed === true &&
      allObjects.every(
        (object) =>
          typeof object.interpretationMetadata.classificationResult === "string" &&
          typeof object.interpretationMetadata.selectedProfile === "string"
      ),
    deterministicReading: true,
    validationPassed: true,
    reasons: deepFreeze([
      "package version accepted",
      "provenance preserved on runtime objects",
      "runtime object types valid",
      "runtime geometry present",
      "interpretation metadata attached",
      "runtime reading deterministic"
    ]),
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildRuntimeSignatureSource({
      ...readerBase,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash: signature
  });
}

function validateObjectCollection(collection, expectedSchemaId, allowedTypes, requireTags = false) {
  if (collection?.schemaId !== expectedSchemaId) {
    throw createValidationError(
      "invalid_runtime_collection_schema",
      `Expected runtime collection schema ${expectedSchemaId}.`
    );
  }

  if (!Array.isArray(collection.objects)) {
    throw createValidationError(
      "invalid_runtime_collection_objects",
      `Collection ${expectedSchemaId} must expose an objects array.`
    );
  }

  for (const object of collection.objects) {
    assertPresent(object.objectId, "Runtime objectId is required.");
    assertPresent(object.sourceReference, "Runtime sourceReference is required.");
    assertPresent(object.objectType, "Runtime objectType is required.");
    assertPresent(object.geometry, "Runtime geometry is required.");
    assertPresent(
      object.interpretationMetadata,
      "Runtime interpretationMetadata is required."
    );
    if (allowedTypes && !allowedTypes.has(object.objectType)) {
      throw createValidationError(
        "invalid_runtime_object_type",
        `Unsupported runtime object type ${object.objectType}.`
      );
    }
    if (requireTags && (!Array.isArray(object.gameplayCompatibilityTags) || object.gameplayCompatibilityTags.length === 0)) {
      throw createValidationError(
        "missing_runtime_object_tags",
        `Runtime object ${object.objectId} must expose gameplay compatibility tags.`
      );
    }
  }
}

function flattenRuntimeObjects(runtimeCollections) {
  return [
    ...runtimeCollections.runtimeRoadObjects.objects,
    ...runtimeCollections.runtimeSettlementObjects.objects,
    ...runtimeCollections.runtimePoiObjects.objects,
    ...runtimeCollections.runtimeNaturalFeatureObjects.objects,
    ...runtimeCollections.runtimeBuildingReferenceObjects.objects
  ];
}

function buildRuntimeSignatureSource(reader) {
  return {
    readerId: reader.readerId,
    packageId: reader.packageId,
    interpretationMetadata: reader.interpretationMetadata,
    runtimeCollections: reader.runtimeCollections,
    validationFlags: reader.validation
      ? {
          packageVersionValid: reader.validation.packageVersionValid,
          provenancePreserved: reader.validation.provenancePreserved,
          objectTypesValid: reader.validation.objectTypesValid,
          geometryPresent: reader.validation.geometryPresent,
          interpretationMetadataAvailable:
            reader.validation.interpretationMetadataAvailable,
          deterministicReading: reader.validation.deterministicReading,
          validationPassed: reader.validation.validationPassed
        }
      : null
  };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function normalizeTag(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
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
