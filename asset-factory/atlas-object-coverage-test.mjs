import {
  createGrowgoObjectClassificationLayer,
  validateGrowgoObjectClassificationLayer
} from "./growgo-object-classification.mjs";
import {
  createAtlasObjectRelationshipLayer,
  validateAtlasObjectRelationshipLayer
} from "./atlas-object-relationship.mjs";
import {
  createAtlasAssetRecipeResolver,
  validateAtlasAssetRecipeResolver
} from "./atlas-asset-recipe-resolver.mjs";

export const atlasObjectCoverageTestLayerSchemaId =
  "ATLAS_OBJECT_COVERAGE_TEST_LAYER_001";
export const atlasObjectCoverageTestResultSchemaId =
  "ATLAS_OBJECT_COVERAGE_TEST_RESULT_001";
export const atlasObjectCoverageValidationSchemaId =
  "ATLAS_OBJECT_COVERAGE_VALIDATION_001";

export function createAtlasObjectCoverageTestLayer(
  rawPresentationObjects,
  options = {}
) {
  void options;
  const classificationLayer =
    createGrowgoObjectClassificationLayer(rawPresentationObjects);
  const relationshipLayer =
    createAtlasObjectRelationshipLayer(classificationLayer);
  const assetResolver = createAtlasAssetRecipeResolver(
    classificationLayer,
    relationshipLayer
  );

  const coverageEntries = buildCoverageEntries(
    classificationLayer,
    relationshipLayer,
    assetResolver
  );

  const layerBase = deepFreeze({
    schemaId: atlasObjectCoverageTestLayerSchemaId,
    layerId: `${classificationLayer.layerId}_OBJECT_COVERAGE_TEST`,
    packageId: classificationLayer.packageId,
    regionId: classificationLayer.regionId,
    results: deepFreeze({
      schemaId: atlasObjectCoverageTestResultSchemaId,
      entries: coverageEntries
    }),
    validation: null
  });

  const validation = buildCoverageValidation(
    layerBase,
    classificationLayer,
    relationshipLayer,
    assetResolver
  );

  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateAtlasObjectCoverageTestLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasObjectCoverageTestLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== atlasObjectCoverageTestLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_object_coverage_test_layer_schema",
        `Expected ${atlasObjectCoverageTestLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.results?.schemaId !== atlasObjectCoverageTestResultSchemaId) {
      throw createValidationError(
        "invalid_atlas_object_coverage_test_result_schema",
        `Expected ${atlasObjectCoverageTestResultSchemaId} but received ${rawLayer.results?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.results.entries) || rawLayer.results.entries.length === 0) {
      throw createValidationError(
        "invalid_atlas_object_coverage_entries",
        "Atlas object coverage test must expose a non-empty entry list."
      );
    }

    if (rawLayer.validation?.schemaId !== atlasObjectCoverageValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_object_coverage_validation_schema",
        `Expected ${atlasObjectCoverageValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const entry of rawLayer.results.entries) {
      assertPresent(entry.objectId, "Coverage objectId is required.");
      assertPresent(entry.objectType, "Coverage objectType is required.");
      assertPresent(
        entry.classificationResult,
        "Coverage classificationResult is required."
      );
      assertPresent(entry.assetRecipe, "Coverage assetRecipe is required.");
      if (!Array.isArray(entry.relationships)) {
        throw createValidationError(
          "invalid_atlas_object_coverage_relationships",
          `Coverage entry ${entry.objectId} must expose relationship summaries.`
        );
      }
    }

    for (const key of [
      "classificationValid",
      "provenancePreserved",
      "geometryPreserved",
      "recipeCompatible",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createValidationError(
          "atlas_object_coverage_validation_failed",
          `Atlas object coverage validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawLayer)
    );
    if (expectedSignature !== rawLayer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_object_coverage_signature_mismatch",
        "Atlas object coverage deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasObjectCoverageTestLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_object_coverage_validation_failed",
      message: error.message,
      atlasObjectCoverageTestLayer: null
    });
  }
}

function buildCoverageEntries(
  classificationLayer,
  relationshipLayer,
  assetResolver
) {
  const relationshipsByObject = groupByObject(relationshipLayer.relationships.entries);
  const assignmentsByObject = new Map(
    assetResolver.assignments.entries.map((entry) => [entry.objectId, entry])
  );

  return deepFreeze(
    classificationLayer.worldObjects.objects
      .filter((object) => object.realWorldType !== "TRANSPORT_ROUTE")
      .map((object) =>
        deepFreeze({
          objectId: object.objectId,
          objectType: object.realWorldType,
          classificationResult: object.growgoClassification,
          relationships: deepFreeze(
            (relationshipsByObject.get(object.objectId) ?? []).map((entry) => ({
              relationshipType: entry.relationshipType,
              relationshipDomain: entry.relationshipDomain,
              toObjectId: entry.toObjectId
            }))
          ),
          assetRecipe: assignmentsByObject.get(object.objectId)?.recipeId ?? null,
          previewCompatibility: isPreviewCompatible(object),
          previewType: resolvePreviewCompatibilityType(object),
          validationStatus: "VALID"
        })
      )
      .sort(compareBy("objectId"))
  );
}

function buildCoverageValidation(
  layerBase,
  classificationLayer,
  relationshipLayer,
  assetResolver
) {
  const validationWithoutHash = deepFreeze({
    schemaId: atlasObjectCoverageValidationSchemaId,
    classificationValid: classificationLayer.validation.validationPassed === true,
    provenancePreserved:
      classificationLayer.validation.sourceReferencePreserved === true &&
      relationshipLayer.validation.sourceReferencesPreserved === true,
    geometryPreserved: assetResolver.validation.geometryPreserved === true,
    recipeCompatible: assetResolver.validation.objectTypeCompatible === true,
    deterministicOutput: true,
    validationPassed: true,
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

function groupByObject(entries) {
  const grouped = new Map();
  for (const entry of entries) {
    if (!grouped.has(entry.fromObjectId)) {
      grouped.set(entry.fromObjectId, []);
    }
    grouped.get(entry.fromObjectId).push(entry);
  }
  return grouped;
}

function buildValidationSignatureSource(layer) {
  return {
    results: layer.results.entries.map((entry) => ({
      objectId: entry.objectId,
      objectType: entry.objectType,
      classificationResult: entry.classificationResult,
      assetRecipe: entry.assetRecipe,
      previewCompatibility: entry.previewCompatibility,
      previewType: entry.previewType
    })),
    validationFlags: layer.validation
      ? {
          classificationValid: layer.validation.classificationValid,
          provenancePreserved: layer.validation.provenancePreserved,
          geometryPreserved: layer.validation.geometryPreserved,
          recipeCompatible: layer.validation.recipeCompatible,
          deterministicOutput: layer.validation.deterministicOutput,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
}

function isPreviewCompatible(object) {
  return (
    ["PARK", "BUSINESS", "LANDMARK", "TRANSPORT", "NATURAL_FEATURE"].includes(
      object.growgoClassification
    ) ||
    ["HOUSE", "TOWNHOUSE", "APARTMENT"].includes(object.realWorldType)
  );
}

function resolvePreviewCompatibilityType(object) {
  if (["OVAL", "RECREATION_AREA", "PARK", "RESERVE", "BEACH", "FOREST"].includes(object.realWorldType)) {
    return "ENVIRONMENT_PREVIEW_COMPATIBLE";
  }
  if (["RAILWAY_STATION", "FERRY_TERMINAL", "BUS_STOP"].includes(object.realWorldType)) {
    return "TRANSPORT_PREVIEW_COMPATIBLE";
  }
  if (
    [
      "LIBRARY",
      "SCHOOL",
      "COMMUNITY_BUILDING",
      "BAKERY",
      "CAFE",
      "PETROL_STATION",
      "SHOP",
      "WAREHOUSE",
      "INDUSTRIAL_BUILDING"
    ].includes(object.realWorldType)
  ) {
    return "STRUCTURE_PREVIEW_COMPATIBLE";
  }
  return "GENERIC_PREVIEW_COMPATIBLE";
}

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function assertPresent(value, message) {
  if (value === null || value === undefined || value === "") {
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
