import { validateGrowgoObjectClassificationLayer } from "./growgo-object-classification.mjs";
import {
  createAtlasEnvironmentPreviewLayer,
  validateAtlasEnvironmentPreviewLayer
} from "./atlas-environment-preview.mjs";
import { validateAtlasObjectRelationshipLayer } from "./atlas-object-relationship.mjs";

export const atlasStreetSceneCompositionLayerSchemaId =
  "ATLAS_STREET_SCENE_COMPOSITION_LAYER_001";
export const atlasStreetScenePreviewSchemaId =
  "ATLAS_STREET_SCENE_PREVIEW_001";
export const atlasStreetSceneValidationSchemaId =
  "ATLAS_STREET_SCENE_VALIDATION_001";

const residentialObjectTypes = new Set(["HOUSE", "TOWNHOUSE", "APARTMENT"]);
const businessObjectTypes = new Set([
  "BAKERY",
  "CAFE",
  "SHOP",
  "PETROL_STATION",
  "LIBRARY",
  "SCHOOL",
  "COMMUNITY_BUILDING"
]);
const coastalObjectTypes = new Set([
  "BEACH",
  "LIGHTHOUSE",
  "LOOKOUT",
  "ATTRACTION",
  "WATERWAY"
]);
const naturePreviewTypes = new Set([
  "COASTAL_PARK_PREVIEW",
  "SUBURBAN_GREENSPACE_PREVIEW",
  "BEACH_EDGE_PREVIEW"
]);

export function createAtlasStreetSceneCompositionLayer(
  rawWorldObjects,
  rawRelationships,
  rawEnvironmentPreview = null,
  options = {}
) {
  const normalized = normalizeSceneInputs(
    rawWorldObjects,
    rawRelationships,
    rawEnvironmentPreview,
    options
  );
  const sceneEntries = buildStreetSceneEntries(normalized);

  const layerBase = deepFreeze({
    schemaId: atlasStreetSceneCompositionLayerSchemaId,
    layerId: `${normalized.layerId}_STREET_SCENE_COMPOSITION`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    streetScenes: deepFreeze({
      schemaId: atlasStreetScenePreviewSchemaId,
      entries: sceneEntries
    }),
    validation: null
  });

  const validation = buildStreetSceneValidation(layerBase, normalized);
  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateAtlasStreetSceneCompositionLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasStreetSceneCompositionLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== atlasStreetSceneCompositionLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_street_scene_composition_layer_schema",
        `Expected ${atlasStreetSceneCompositionLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.streetScenes?.schemaId !== atlasStreetScenePreviewSchemaId) {
      throw createValidationError(
        "invalid_atlas_street_scene_preview_schema",
        `Expected ${atlasStreetScenePreviewSchemaId} but received ${rawLayer.streetScenes?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.streetScenes.entries) || rawLayer.streetScenes.entries.length === 0) {
      throw createValidationError(
        "invalid_atlas_street_scene_entries",
        "Atlas street scene composition layer must expose a non-empty scene entry list."
      );
    }

    if (rawLayer.validation?.schemaId !== atlasStreetSceneValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_street_scene_validation_schema",
        `Expected ${atlasStreetSceneValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const entry of rawLayer.streetScenes.entries) {
      assertPresent(entry.sceneId, "Street scene sceneId is required.");
      assertPresent(entry.sceneType, "Street scene sceneType is required.");
      if (!Array.isArray(entry.objectList) || entry.objectList.length === 0) {
        throw createValidationError(
          "invalid_atlas_street_scene_object_list",
          `Street scene ${entry.sceneId} must expose a non-empty object list.`
        );
      }
      if (!Array.isArray(entry.roadLayoutReference) || entry.roadLayoutReference.length === 0) {
        throw createValidationError(
          "invalid_atlas_street_scene_road_layout_reference",
          `Street scene ${entry.sceneId} must expose road layout references.`
        );
      }
      if (!Array.isArray(entry.assetAssignments) || entry.assetAssignments.length === 0) {
        throw createValidationError(
          "invalid_atlas_street_scene_asset_assignments",
          `Street scene ${entry.sceneId} must expose asset assignments.`
        );
      }
      if (!Array.isArray(entry.relationshipGraph)) {
        throw createValidationError(
          "invalid_atlas_street_scene_relationship_graph",
          `Street scene ${entry.sceneId} must expose a relationship graph array.`
        );
      }
    }

    for (const key of [
      "objectsBelongToScene",
      "relationshipsValid",
      "assetAssignmentsValid",
      "geometryPreserved",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createValidationError(
          "atlas_street_scene_validation_failed",
          `Atlas street scene validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawLayer)
    );
    if (expectedHash !== rawLayer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_street_scene_signature_mismatch",
        "Atlas street scene deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasStreetSceneCompositionLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_street_scene_validation_failed",
      message: error.message,
      atlasStreetSceneCompositionLayer: null
    });
  }
}

function normalizeSceneInputs(
  rawWorldObjects,
  rawRelationships,
  rawEnvironmentPreview,
  options
) {
  const worldLayer = normalizeWorldObjects(rawWorldObjects);
  const relationshipLayer = normalizeRelationships(rawRelationships);
  const environmentPreviewLayer =
    rawEnvironmentPreview &&
    rawEnvironmentPreview.schemaId === "ATLAS_ENVIRONMENT_PREVIEW_LAYER_001"
      ? normalizeEnvironmentPreview(rawEnvironmentPreview)
      : createAtlasEnvironmentPreviewLayer(
          rawWorldObjects,
          rawRelationships,
          options.natureResolver ?? null,
          options.environmentPreviewOptions ?? {}
        );

  const previewEntriesByObjectId = new Map(
    environmentPreviewLayer.previewObjects.entries.map((entry) => [entry.objectId, entry])
  );
  const worldObjectsById = new Map(
    worldLayer.worldObjects.objects.map((object) => [object.objectId, object])
  );
  const relationshipsByObjectId = groupRelationshipsByObjectId(
    relationshipLayer.relationships.entries
  );

  return deepFreeze({
    layerId: worldLayer.layerId,
    packageId: worldLayer.packageId,
    regionId: worldLayer.regionId,
    worldObjectsById,
    orderedWorldObjects: worldLayer.worldObjects.objects,
    previewEntriesByObjectId,
    orderedPreviewEntries: environmentPreviewLayer.previewObjects.entries,
    relationships: relationshipLayer.relationships.entries,
    relationshipsByObjectId
  });
}

function normalizeWorldObjects(rawWorldObjects) {
  if (rawWorldObjects?.schemaId === "GROWGO_WORLD_OBJECTS_001") {
    return deepFreeze({
      layerId: "GROWGO_WORLD_OBJECTS_001_DIRECT_INPUT",
      packageId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      regionId: "DIRECT_GROWGO_WORLD_OBJECTS_INPUT",
      worldObjects: structuredClone(rawWorldObjects)
    });
  }

  const validation = validateGrowgoObjectClassificationLayer(rawWorldObjects);
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

function normalizeRelationships(rawRelationships) {
  if (rawRelationships?.schemaId === "ATLAS_OBJECT_RELATIONSHIPS_001") {
    return deepFreeze({
      schemaId: "ATLAS_OBJECT_RELATIONSHIP_LAYER_001",
      layerId: "ATLAS_OBJECT_RELATIONSHIPS_001_DIRECT_INPUT",
      packageId: "DIRECT_ATLAS_RELATIONSHIP_INPUT",
      regionId: "DIRECT_ATLAS_RELATIONSHIP_INPUT",
      relationships: structuredClone(rawRelationships),
      validation: deepFreeze({ validationPassed: true })
    });
  }

  const validation = validateAtlasObjectRelationshipLayer(rawRelationships);
  if (!validation.ok) {
    throw createValidationError(
      "invalid_atlas_object_relationship_layer",
      validation.message
    );
  }

  return deepFreeze(structuredClone(validation.atlasObjectRelationshipLayer));
}

function normalizeEnvironmentPreview(rawEnvironmentPreview) {
  const validation = validateAtlasEnvironmentPreviewLayer(rawEnvironmentPreview);
  if (!validation.ok) {
    throw createValidationError(
      "invalid_atlas_environment_preview_layer",
      validation.message
    );
  }

  return deepFreeze(structuredClone(validation.atlasEnvironmentPreviewLayer));
}

function buildStreetSceneEntries(normalized) {
  const entries = [
    buildSuburbanStreetScene(normalized),
    buildTownMainStreetScene(normalized),
    buildCoastalStreetScene(normalized)
  ].filter(Boolean);

  if (entries.length === 0) {
    throw createValidationError(
      "missing_atlas_street_scene_entries",
      "No valid Atlas street scene compositions could be derived from the input."
    );
  }

  return deepFreeze(entries.sort(compareBy("sceneId")));
}

function buildSuburbanStreetScene(normalized) {
  const objectIds = new Set();
  for (const preview of normalized.orderedPreviewEntries) {
    if (preview.previewType === "RESIDENTIAL_AREA_PREVIEW") {
      objectIds.add(preview.objectId);
    }
    if (
      naturePreviewTypes.has(preview.previewType) &&
      preview.previewType !== "BEACH_EDGE_PREVIEW"
    ) {
      objectIds.add(preview.objectId);
    }
  }

  expandWithRelatedTransport(objectIds, normalized);
  const sceneObjects = materializeSceneObjects(objectIds, normalized);
  if (
    !sceneObjects.some((entry) => residentialObjectTypes.has(entry.objectType)) ||
    !sceneObjects.some((entry) => entry.objectType === "TRANSPORT_ROUTE")
  ) {
    return null;
  }

  return buildSceneEntry("SUBURBAN_STREET_SCENE", sceneObjects, normalized, {
    sceneFocus: "residential_frontage",
    includesGardens: sceneObjects.some((entry) =>
      ["PARK", "RESERVE"].includes(entry.objectType)
    ),
    includesStreetTrees: sceneObjects.some((entry) =>
      entry.assetAssignments.some((asset) => asset.assetFamily === "TREE_ASSET_FAMILY_001")
    )
  });
}

function buildTownMainStreetScene(normalized) {
  const objectIds = new Set();
  for (const preview of normalized.orderedPreviewEntries) {
    if (
      preview.previewType === "COMMERCIAL_AREA_PREVIEW" ||
      (preview.previewType === "TOWN_STREET_PREVIEW" &&
        (businessObjectTypes.has(preview.objectType) || preview.objectType === "TRANSPORT_ROUTE"))
    ) {
      objectIds.add(preview.objectId);
    }
  }

  expandWithSceneRelationships(objectIds, normalized, new Set(["served_by_road", "connected"]));
  const sceneObjects = materializeSceneObjects(objectIds, normalized);
  if (
    !sceneObjects.some((entry) => businessObjectTypes.has(entry.objectType)) ||
    !sceneObjects.some((entry) => entry.objectType === "TRANSPORT_ROUTE")
  ) {
    return null;
  }

  return buildSceneEntry("TOWN_MAIN_STREET_SCENE", sceneObjects, normalized, {
    sceneFocus: "commercial_frontage",
    includesBusinesses: sceneObjects.filter((entry) => businessObjectTypes.has(entry.objectType))
      .length,
    streetFurnitureReferences: ["SIDEWALK_REFERENCE", "SHOPFRONT_REFERENCE"]
  });
}

function buildCoastalStreetScene(normalized) {
  const objectIds = new Set();
  for (const preview of normalized.orderedPreviewEntries) {
    const relationshipTypes = normalized.relationshipsByObjectId.get(preview.objectId) ?? [];
    if (
      preview.previewType === "COASTAL_PARK_PREVIEW" ||
      preview.previewType === "BEACH_EDGE_PREVIEW" ||
      coastalObjectTypes.has(preview.objectType) ||
      relationshipTypes.some((entry) => entry.relationshipType === "waterfront_relationship")
    ) {
      objectIds.add(preview.objectId);
    }
  }

  expandWithSceneRelationships(
    objectIds,
    normalized,
    new Set(["waterfront_relationship", "served_by_road", "connected", "reachable"])
  );
  const sceneObjects = materializeSceneObjects(objectIds, normalized);
  if (
    !sceneObjects.some(
      (entry) =>
        entry.previewType === "BEACH_EDGE_PREVIEW" ||
        entry.previewMetadata.relationshipHints.includes("waterfront_relationship")
    ) ||
    !sceneObjects.some((entry) => entry.objectType === "TRANSPORT_ROUTE")
  ) {
    return null;
  }

  return buildSceneEntry("COASTAL_STREET_SCENE", sceneObjects, normalized, {
    sceneFocus: "waterfront_edge",
    waterfrontContext: true,
    coastalLandmarkCount: sceneObjects.filter((entry) =>
      ["LIGHTHOUSE", "LOOKOUT", "ATTRACTION"].includes(entry.objectType)
    ).length
  });
}

function expandWithRelatedTransport(objectIds, normalized) {
  for (const objectId of [...objectIds]) {
    const relationships = normalized.relationshipsByObjectId.get(objectId) ?? [];
    for (const relationship of relationships) {
      if (relationship.relationshipType === "served_by_road" ||
          relationship.relationshipType === "connected" ||
          relationship.relationshipType === "nearby") {
        const targetPreview = normalized.previewEntriesByObjectId.get(relationship.toObjectId);
        if (targetPreview?.objectType === "TRANSPORT_ROUTE") {
          objectIds.add(relationship.toObjectId);
        }
      }
    }
  }
}

function expandWithSceneRelationships(objectIds, normalized, allowedRelationshipTypes) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const relationship of normalized.relationships) {
      if (!allowedRelationshipTypes.has(relationship.relationshipType)) {
        continue;
      }
      const fromIncluded = objectIds.has(relationship.fromObjectId);
      const toIncluded = objectIds.has(relationship.toObjectId);
      const canIncludeFrom = normalized.previewEntriesByObjectId.has(relationship.fromObjectId);
      const canIncludeTo = normalized.previewEntriesByObjectId.has(relationship.toObjectId);

      if (fromIncluded && !toIncluded && canIncludeTo) {
        objectIds.add(relationship.toObjectId);
        changed = true;
      } else if (toIncluded && !fromIncluded && canIncludeFrom) {
        objectIds.add(relationship.fromObjectId);
        changed = true;
      }
    }
  }
}

function materializeSceneObjects(objectIds, normalized) {
  return [...objectIds]
    .map((objectId) => {
      const preview = normalized.previewEntriesByObjectId.get(objectId);
      const worldObject = normalized.worldObjectsById.get(objectId);
      if (!preview || !worldObject) {
        return null;
      }

      return deepFreeze({
        objectId,
        objectType: preview.objectType,
        previewType: preview.previewType,
        sourceGeometryReference: preview.sourceGeometryReference,
        assetAssignments: preview.assignedAssets,
        lodRules: preview.lodRules,
        previewMetadata: preview.previewMetadata,
        sourceReference: worldObject.sourceReference
      });
    })
    .filter(Boolean)
    .sort(compareBy("objectId"));
}

function buildSceneEntry(sceneType, sceneObjects, normalized, metadata) {
  const objectIds = new Set(sceneObjects.map((entry) => entry.objectId));
  const sceneRelationships = normalized.relationships
    .filter(
      (entry) => objectIds.has(entry.fromObjectId) && objectIds.has(entry.toObjectId)
    )
    .sort(compareBy("relationshipId"));
  const roadLayoutReference = sceneObjects
    .filter((entry) => entry.objectType === "TRANSPORT_ROUTE")
    .map((entry) =>
      deepFreeze({
        objectId: entry.objectId,
        geometryReference: entry.sourceGeometryReference,
        relationshipCount: sceneRelationships.filter(
          (relationship) =>
            relationship.fromObjectId === entry.objectId ||
            relationship.toObjectId === entry.objectId
        ).length
      })
    );
  const assetAssignments = sceneObjects
    .flatMap((entry) =>
      entry.assetAssignments.map((asset) => ({
        objectId: entry.objectId,
        objectType: entry.objectType,
        assetId: asset.assetId,
        assetFamily: asset.assetFamily,
        role: asset.role
      }))
    )
    .sort(compareBy("objectId"));

  return deepFreeze({
    sceneId: `${sceneType}_${buildSceneSuffix(sceneObjects)}`,
    sceneType,
    roadLayoutReference: deepFreeze(roadLayoutReference),
    objectList: deepFreeze(sceneObjects),
    assetAssignments: deepFreeze(assetAssignments),
    relationshipGraph: deepFreeze(sceneRelationships),
    sceneMetadata: deepFreeze({
      objectCount: sceneObjects.length,
      relationshipCount: sceneRelationships.length,
      relationshipTypes: deepFreeze(
        uniqueSorted(sceneRelationships.map((entry) => entry.relationshipType))
      ),
      objectTypes: deepFreeze(uniqueSorted(sceneObjects.map((entry) => entry.objectType))),
      ...metadata
    })
  });
}

function buildStreetSceneValidation(layerBase, normalized) {
  const sceneEntries = layerBase.streetScenes.entries;
  const validationWithoutHash = deepFreeze({
    schemaId: atlasStreetSceneValidationSchemaId,
    objectsBelongToScene: sceneEntries.every((scene) =>
      scene.objectList.every(
        (entry) =>
          normalized.worldObjectsById.has(entry.objectId) &&
          normalized.previewEntriesByObjectId.has(entry.objectId)
      )
    ),
    relationshipsValid: sceneEntries.every((scene) => {
      const objectIds = new Set(scene.objectList.map((entry) => entry.objectId));
      return scene.relationshipGraph.every(
        (entry) => objectIds.has(entry.fromObjectId) && objectIds.has(entry.toObjectId)
      );
    }),
    assetAssignmentsValid: sceneEntries.every((scene) =>
      scene.assetAssignments.every(
        (asset) =>
          normalized.previewEntriesByObjectId.has(asset.objectId) &&
          typeof asset.assetId === "string" &&
          asset.assetId.length > 0
      )
    ),
    geometryPreserved: sceneEntries.every((scene) =>
      scene.objectList.every((entry) => {
        const worldObject = normalized.worldObjectsById.get(entry.objectId);
        return (
          stableStringify(entry.sourceGeometryReference) ===
          stableStringify(worldObject?.geometryReference)
        );
      })
    ),
    deterministicOutput: true,
    validationPassed: true,
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      streetScenes: layerBase.streetScenes,
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
    scenes: layer.streetScenes.entries.map((scene) => ({
      sceneId: scene.sceneId,
      sceneType: scene.sceneType,
      roadLayoutReference: scene.roadLayoutReference,
      objectList: scene.objectList.map((entry) => ({
        objectId: entry.objectId,
        objectType: entry.objectType,
        previewType: entry.previewType
      })),
      assetAssignments: scene.assetAssignments,
      relationshipGraph: scene.relationshipGraph.map((entry) => ({
        relationshipId: entry.relationshipId,
        relationshipType: entry.relationshipType,
        fromObjectId: entry.fromObjectId,
        toObjectId: entry.toObjectId
      })),
      sceneMetadata: scene.sceneMetadata
    })),
    validation: layer.validation
      ? {
          objectsBelongToScene: layer.validation.objectsBelongToScene,
          relationshipsValid: layer.validation.relationshipsValid,
          assetAssignmentsValid: layer.validation.assetAssignmentsValid,
          geometryPreserved: layer.validation.geometryPreserved,
          deterministicOutput: layer.validation.deterministicOutput,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
}

function buildSceneSuffix(sceneObjects) {
  return sceneObjects
    .map((entry) => entry.objectId)
    .sort()
    .slice(0, 3)
    .join("_");
}

function groupRelationshipsByObjectId(entries) {
  const byObjectId = new Map();
  for (const entry of entries) {
    if (!byObjectId.has(entry.fromObjectId)) {
      byObjectId.set(entry.fromObjectId, []);
    }
    byObjectId.get(entry.fromObjectId).push(entry);
  }
  return byObjectId;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => String(left).localeCompare(String(right)));
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
