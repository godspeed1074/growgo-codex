import { validateGrowgoObjectClassificationLayer } from "./growgo-object-classification.mjs";
import { validateAtlasObjectRelationshipLayer } from "./atlas-object-relationship.mjs";
import {
  createNatureEnvironmentRecipeResolver,
  validateNatureEnvironmentRecipeResolver
} from "./nature-environment-recipe-resolver.mjs";

export const atlasEnvironmentPreviewLayerSchemaId =
  "ATLAS_ENVIRONMENT_PREVIEW_LAYER_001";
export const atlasEnvironmentPreviewObjectsSchemaId =
  "ATLAS_ENVIRONMENT_PREVIEW_OBJECTS_001";
export const atlasEnvironmentPreviewValidationSchemaId =
  "ATLAS_ENVIRONMENT_PREVIEW_VALIDATION_001";

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
  const resolver =
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
    relationshipsByObjectId,
    assignments: resolver.assignments.entries
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

function buildPreviewEntries(normalized) {
  return deepFreeze(
    normalized.assignments
      .map((assignment) => {
        const sourceObject = normalized.worldObjectsById.get(assignment.objectId);
        if (!sourceObject) {
          throw createValidationError(
            "missing_preview_source_object",
            `Nature assignment ${assignment.objectId} does not resolve to a world object.`
          );
        }

        const objectRelationships =
          normalized.relationshipsByObjectId.get(assignment.objectId) ?? [];
        return deepFreeze({
          objectId: assignment.objectId,
          sourceGeometryReference: sourceObject.geometryReference,
          environmentRecipe: assignment.recipeId,
          assignedAssets: deepFreeze(
            assignment.selectedAssets.map((asset) => ({
              assetId: asset.assetId,
              assetFamily: asset.assetFamily,
              role: asset.role
            }))
          ),
          lodRules: assignment.lodRules,
          previewType: resolvePreviewType(assignment.environmentType),
          previewMetadata: deepFreeze({
            environmentType: assignment.environmentType,
            relationshipHints: deepFreeze(
              uniqueSorted(objectRelationships.map((entry) => entry.relationshipType))
            ),
            realWorldType: sourceObject.realWorldType,
            classification: sourceObject.growgoClassification
          })
        });
      })
      .sort(compareBy("objectId"))
  );
}

function buildPreviewValidation(layerBase, normalized) {
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
      (entry) => typeof entry.environmentRecipe === "string" && entry.environmentRecipe.endsWith("_RECIPE_001")
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
          deterministicOutput: layer.validation.deterministicOutput,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
}

function resolvePreviewType(environmentType) {
  if (environmentType === "COASTAL_PARK") {
    return "COASTAL_PARK_PREVIEW";
  }
  if (environmentType === "BEACH") {
    return "BEACH_EDGE_PREVIEW";
  }
  return "SUBURBAN_GREENSPACE_PREVIEW";
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
