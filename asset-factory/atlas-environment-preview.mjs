import { validateGrowgoObjectClassificationLayer } from "./growgo-object-classification.mjs";
import { validateAtlasObjectRelationshipLayer } from "./atlas-object-relationship.mjs";
import {
  createNatureEnvironmentRecipeResolver,
  validateNatureEnvironmentRecipeResolver
} from "./nature-environment-recipe-resolver.mjs";
import {
  createAtlasAssetRecipeResolver,
  validateAtlasAssetRecipeResolver
} from "./atlas-asset-recipe-resolver.mjs";
import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";

export const atlasEnvironmentPreviewLayerSchemaId =
  "ATLAS_ENVIRONMENT_PREVIEW_LAYER_001";
export const atlasEnvironmentPreviewObjectsSchemaId =
  "ATLAS_ENVIRONMENT_PREVIEW_OBJECTS_001";
export const atlasObjectPreviewValidationSchemaId =
  "ATLAS_OBJECT_PREVIEW_VALIDATION_001";
export const atlasEnvironmentPreviewValidationSchemaId =
  atlasObjectPreviewValidationSchemaId;

export function createAtlasEnvironmentPreviewLayer(
  rawWorldObjects,
  rawRelationships,
  rawNatureAssignments = null,
  options = {}
) {
  const normalized = normalizePreviewInputs(
    rawWorldObjects,
    rawRelationships,
    rawNatureAssignments,
    options
  );
  const previewEntries = buildPreviewEntries(normalized);

  const layerBase = deepFreeze({
    schemaId: atlasEnvironmentPreviewLayerSchemaId,
    layerId: `${normalized.layerId}_ENVIRONMENT_PREVIEW`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    previewObjects: deepFreeze({
      schemaId: atlasEnvironmentPreviewObjectsSchemaId,
      entries: previewEntries
    }),
    validation: null
  });

  const validation = buildPreviewValidation(layerBase, normalized);
  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateAtlasEnvironmentPreviewLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasEnvironmentPreviewLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== atlasEnvironmentPreviewLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_environment_preview_layer_schema",
        `Expected ${atlasEnvironmentPreviewLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.previewObjects?.schemaId !== atlasEnvironmentPreviewObjectsSchemaId) {
      throw createValidationError(
        "invalid_atlas_environment_preview_objects_schema",
        `Expected ${atlasEnvironmentPreviewObjectsSchemaId} but received ${rawLayer.previewObjects?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.previewObjects.entries) || rawLayer.previewObjects.entries.length === 0) {
      throw createValidationError(
        "invalid_atlas_environment_preview_entries",
        "Atlas environment preview layer must expose a non-empty preview entry list."
      );
    }

    if (rawLayer.validation?.schemaId !== atlasEnvironmentPreviewValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_environment_preview_validation_schema",
        `Expected ${atlasEnvironmentPreviewValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const entry of rawLayer.previewObjects.entries) {
      assertPresent(entry.objectId, "Preview objectId is required.");
      assertPresent(
        entry.sourceGeometryReference,
        "Preview sourceGeometryReference is required."
      );
      assertPresent(entry.environmentRecipe, "Preview environmentRecipe is required.");
      assertPresent(entry.previewType, "Preview previewType is required.");
      if (!Array.isArray(entry.assignedAssets) || entry.assignedAssets.length === 0) {
        throw createValidationError(
          "invalid_atlas_environment_preview_assigned_assets",
          `Preview ${entry.objectId} must expose assigned assets.`
        );
      }
    }

    for (const key of [
      "sourceGeometryPreserved",
      "assetsExist",
      "recipesValid",
      "recipeCompatibility",
      "assetRegistryReferencesValid",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createValidationError(
          "atlas_environment_preview_validation_failed",
          `Atlas environment preview validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawLayer)
    );
    if (expectedHash !== rawLayer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_environment_preview_signature_mismatch",
        "Atlas environment preview deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasEnvironmentPreviewLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_environment_preview_validation_failed",
      message: error.message,
      atlasEnvironmentPreviewLayer: null
    });
  }
}

function normalizePreviewInputs(
  rawWorldObjects,
  rawRelationships,
  rawNatureAssignments,
  options
) {
  const worldLayer = normalizeWorldObjects(rawWorldObjects);
  const relationshipLayer = normalizeRelationships(rawRelationships);
  const natureResolver =
    rawNatureAssignments && rawNatureAssignments.schemaId === "NATURE_ENVIRONMENT_RECIPE_RESOLVER_001"
      ? normalizeNatureResolver(rawNatureAssignments)
      : createNatureEnvironmentRecipeResolver(
          worldLayer.worldObjects,
          {
            biomeMetadataByObjectId: options.biomeMetadataByObjectId ?? {},
            environmentClassificationByObjectId:
              options.environmentClassificationByObjectId ?? {},
            natureAssetPack: options.natureAssetPack
          }
        );
  const assetRecipeResolver =
    options.assetRecipeResolver &&
    options.assetRecipeResolver.schemaId === "ATLAS_ASSET_RECIPE_RESOLVER_001"
      ? normalizeAssetRecipeResolver(options.assetRecipeResolver)
      : createAtlasAssetRecipeResolver(worldLayer.worldObjects, relationshipLayer.relationships);
  const assetRegistryLayer = options.assetRegistryLayer ?? createAssetFactoryRegistryLayer();

  const worldObjectsById = new Map(
    worldLayer.worldObjects.objects.map((object) => [object.objectId, object])
  );
  const relationshipsByObjectId = groupRelationshipsByObjectId(
    relationshipLayer.relationships.entries
  );
  const natureAssignmentsByObjectId = new Map(
    natureResolver.assignments.entries.map((assignment) => [assignment.objectId, assignment])
  );
  const assetAssignmentsByObjectId = new Map(
    assetRecipeResolver.assignments.entries.map((assignment) => [assignment.objectId, assignment])
  );

  return deepFreeze({
    layerId: worldLayer.layerId,
    packageId: worldLayer.packageId,
    regionId: worldLayer.regionId,
    worldObjectsById,
    relationshipsByObjectId,
    natureAssignmentsByObjectId,
    assetAssignmentsByObjectId,
    orderedWorldObjects: worldLayer.worldObjects.objects,
    assetRegistryLayer
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
      validation: deepFreeze({
        validationPassed: true
      })
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

function normalizeNatureResolver(rawNatureAssignments) {
  const validation = validateNatureEnvironmentRecipeResolver(rawNatureAssignments);
  if (!validation.ok) {
    throw createValidationError(
      "invalid_nature_environment_recipe_resolver",
      validation.message
    );
  }
  return deepFreeze(structuredClone(validation.natureEnvironmentRecipeResolver));
}

function normalizeAssetRecipeResolver(rawAssetRecipeResolver) {
  const validation = validateAtlasAssetRecipeResolver(rawAssetRecipeResolver);
  if (!validation.ok) {
    throw createValidationError(
      "invalid_atlas_asset_recipe_resolver",
      validation.message
    );
  }
  return deepFreeze(structuredClone(validation.atlasAssetRecipeResolver));
}

function buildPreviewEntries(normalized) {
  return deepFreeze(
    normalized.orderedWorldObjects
      .filter(isPreviewSupportedObject)
      .map((sourceObject) =>
        buildPreviewEntryForObject(sourceObject, normalized)
      )
      .sort(compareBy("objectId"))
  );
}

function buildPreviewEntryForObject(sourceObject, normalized) {
  const natureAssignment =
    normalized.natureAssignmentsByObjectId.get(sourceObject.objectId) ?? null;
  const assetAssignment =
    normalized.assetAssignmentsByObjectId.get(sourceObject.objectId) ?? null;
  const objectRelationships =
    normalized.relationshipsByObjectId.get(sourceObject.objectId) ?? [];

  if (natureAssignment) {
    return deepFreeze({
      objectId: sourceObject.objectId,
      objectType: sourceObject.realWorldType,
      sourceGeometryReference: sourceObject.geometryReference,
      environmentRecipe: natureAssignment.recipeId,
      assetRecipe: natureAssignment.recipeId,
      assignedAssets: deepFreeze(
        natureAssignment.selectedAssets.map((asset) => ({
          assetId: asset.assetId,
          assetFamily: asset.assetFamily,
          role: asset.role
        }))
      ),
      lodRules: natureAssignment.lodRules,
      previewType: resolvePreviewType(sourceObject, natureAssignment, objectRelationships),
      previewMetadata: deepFreeze({
        environmentType: natureAssignment.environmentType,
        relationshipHints: deepFreeze(
          uniqueSorted(objectRelationships.map((entry) => entry.relationshipType))
        ),
        realWorldType: sourceObject.realWorldType,
        classification: sourceObject.growgoClassification
      })
    });
  }

  if (!assetAssignment) {
    throw createValidationError(
      "missing_preview_assignment",
      `Preview object ${sourceObject.objectId} has no assignment data.`
    );
  }

  const registryMatch = resolveRegistryMatchForAssignment(
    normalized.assetRegistryLayer,
    assetAssignment
  );

  return deepFreeze({
    objectId: sourceObject.objectId,
    objectType: sourceObject.realWorldType,
    sourceGeometryReference: sourceObject.geometryReference,
    environmentRecipe: assetAssignment.recipeId,
    assetRecipe: assetAssignment.recipeId,
    assignedAssets: deepFreeze([
      {
        assetId: registryMatch?.assetId ?? assetAssignment.assetFamily,
        assetFamily: assetAssignment.assetFamily,
        role: "primary_object_recipe"
      }
    ]),
    lodRules: assetAssignment.lodRules,
    previewType: resolvePreviewType(sourceObject, null, objectRelationships),
    previewMetadata: deepFreeze({
      relationshipHints: deepFreeze(
        uniqueSorted(objectRelationships.map((entry) => entry.relationshipType))
      ),
      realWorldType: sourceObject.realWorldType,
      classification: sourceObject.growgoClassification,
      variantRules: assetAssignment.variantRules,
      registryAssetId: registryMatch?.assetId ?? null
    })
  });
}

function buildPreviewValidation(layerBase, normalized) {
  const registryRecords = normalized.assetRegistryLayer.records;
  const validationWithoutHash = deepFreeze({
    schemaId: atlasEnvironmentPreviewValidationSchemaId,
    sourceGeometryPreserved: layerBase.previewObjects.entries.every((entry) => {
      const sourceObject = normalized.worldObjectsById.get(entry.objectId);
      return (
        stableStringify(entry.sourceGeometryReference) ===
        stableStringify(sourceObject?.geometryReference)
      );
    }),
    assetsExist: layerBase.previewObjects.entries.every(
      (entry) => Array.isArray(entry.assignedAssets) && entry.assignedAssets.length > 0
    ),
    recipesValid: layerBase.previewObjects.entries.every(
      (entry) =>
        typeof entry.environmentRecipe === "string" &&
        (entry.environmentRecipe.startsWith("RECIPE_") ||
          entry.environmentRecipe.endsWith("_RECIPE_001"))
    ),
    recipeCompatibility: layerBase.previewObjects.entries.every((entry) =>
      resolveRecipeCompatibility(entry, normalized)
    ),
    assetRegistryReferencesValid: layerBase.previewObjects.entries.every((entry) =>
      entry.assignedAssets.every((asset) => {
        if (canUsePreviewOnlyAssetReference(entry)) {
          return true;
        }
        return registryRecords.some(
          (record) =>
            record.assetId === asset.assetId || record.assetFamily === asset.assetFamily
        );
      })
    ),
    deterministicOutput: true,
    validationPassed: true,
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      previewObjects: layerBase.previewObjects,
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
    previewObjects: layer.previewObjects.entries.map((entry) => ({
      objectId: entry.objectId,
      objectType: entry.objectType,
      assetRecipe: entry.assetRecipe,
      environmentRecipe: entry.environmentRecipe,
      assignedAssets: entry.assignedAssets.map((asset) => asset.assetId),
      lodRules: entry.lodRules,
      previewType: entry.previewType,
      previewMetadata: entry.previewMetadata
    })),
    validation: layer.validation
      ? {
          sourceGeometryPreserved: layer.validation.sourceGeometryPreserved,
          assetsExist: layer.validation.assetsExist,
          recipesValid: layer.validation.recipesValid,
          recipeCompatibility: layer.validation.recipeCompatibility,
          assetRegistryReferencesValid: layer.validation.assetRegistryReferencesValid,
          deterministicOutput: layer.validation.deterministicOutput,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
}

function resolvePreviewType(sourceObject, natureAssignment, objectRelationships) {
  if (natureAssignment?.environmentType === "COASTAL_PARK") {
    return "COASTAL_PARK_PREVIEW";
  }
  if (natureAssignment?.environmentType === "BEACH") {
    return "BEACH_EDGE_PREVIEW";
  }
  if (
    ["HOUSE", "TOWNHOUSE", "APARTMENT"].includes(sourceObject.realWorldType)
  ) {
    return "RESIDENTIAL_AREA_PREVIEW";
  }
  if (sourceObject.realWorldType === "TRANSPORT_ROUTE") {
    return "TOWN_STREET_PREVIEW";
  }
  if (
    ["BAKERY", "CAFE", "SHOP", "PETROL_STATION", "LIBRARY", "SCHOOL", "COMMUNITY_BUILDING"].includes(
      sourceObject.realWorldType
    )
  ) {
    return objectRelationships.some((entry) => entry.relationshipType === "served_by_road")
      ? "TOWN_STREET_PREVIEW"
      : "COMMERCIAL_AREA_PREVIEW";
  }
  return "SUBURBAN_GREENSPACE_PREVIEW";
}

function resolveRegistryMatchForAssignment(assetRegistryLayer, assetAssignment) {
  return (
    assetRegistryLayer.records.find(
      (record) =>
        record.recipeId === assetAssignment.recipeId ||
        record.atlasCompatibility.atlasAssignmentRecipeIds.includes(
          assetAssignment.recipeId
        ) ||
        record.assetFamily === assetAssignment.assetFamily
    ) ?? null
  );
}

function resolveRecipeCompatibility(entry, normalized) {
  void normalized;
  if (entry.previewType === "RESIDENTIAL_AREA_PREVIEW") {
    return entry.assetRecipe.includes("RESIDENTIAL_HOUSE");
  }
  if (entry.objectType === "BAKERY") {
    return entry.assetRecipe.includes("BAKERY");
  }
  if (entry.objectType === "CAFE") {
    return entry.assetRecipe.includes("CAFE");
  }
  if (entry.objectType === "PETROL_STATION") {
    return entry.assetRecipe.includes("FUEL_STATION");
  }
  if (entry.objectType === "TRANSPORT_ROUTE") {
    return entry.assetRecipe.includes("TRANSPORT_ROUTE");
  }
  if (entry.objectType === "LIGHTHOUSE") {
    return entry.assetRecipe.includes("LIGHTHOUSE");
  }
  if (entry.objectType === "LOOKOUT") {
    return entry.assetRecipe.includes("LOOKOUT");
  }
  if (entry.objectType === "HISTORIC_SITE") {
    return entry.assetRecipe.includes("HISTORIC_SITE");
  }
  if (["PARK", "RESERVE", "BEACH", "FOREST", "WATERWAY"].includes(entry.objectType)) {
    return entry.assetRecipe.endsWith("_RECIPE_001");
  }
  if (entry.previewType === "TOWN_STREET_PREVIEW") {
    return (
      entry.assetRecipe.includes("TRANSPORT_ROUTE") ||
      entry.assetRecipe.includes("CAFE") ||
      entry.assetRecipe.includes("BAKERY") ||
      entry.assetRecipe.includes("SHOP") ||
      entry.assetRecipe.includes("LIBRARY")
    );
  }
  if (entry.previewType === "COMMERCIAL_AREA_PREVIEW") {
    return typeof entry.assetRecipe === "string" && entry.assetRecipe.startsWith("RECIPE_");
  }
  return typeof entry.assetRecipe === "string" && entry.assetRecipe.startsWith("RECIPE_");
}

function canUsePreviewOnlyAssetReference(entry) {
  return (
    entry.objectType === "TRANSPORT_ROUTE" ||
    ["ATTRACTION", "LIGHTHOUSE", "LOOKOUT", "HISTORIC_SITE", "LANDMARK"].includes(
      entry.objectType
    )
  );
}

function isPreviewSupportedObject(sourceObject) {
  return (
    ["PARK", "BUSINESS", "LANDMARK", "TRANSPORT", "NATURAL_FEATURE"].includes(
      sourceObject.growgoClassification
    ) ||
    ["HOUSE", "TOWNHOUSE", "APARTMENT"].includes(sourceObject.realWorldType)
  );
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

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
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
