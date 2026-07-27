import {
  validateGrowgoRegionImportPackage
} from "./region-package-builder.mjs";
import {
  createRegionPackageRuntimeReader,
  validateRegionPackageRuntimeReader
} from "./region-package-runtime-reader.mjs";
import {
  createAtlasPresentationRuntimeLayer,
  validateAtlasPresentationRuntimeLayer
} from "./atlas-presentation-runtime.mjs";
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
import {
  createAtlasStreetSceneCompositionLayer,
  validateAtlasStreetSceneCompositionLayer
} from "./atlas-street-scene-composition.mjs";

export const atlasRegionPackageConsumptionTestSchemaId =
  "ATLAS_REGION_PACKAGE_CONSUMPTION_TEST_001";
export const atlasRegionPackageTestResultSchemaId =
  "ATLAS_REGION_PACKAGE_TEST_RESULT_001";
export const atlasRegionPackageTestValidationSchemaId =
  "ATLAS_REGION_PACKAGE_TEST_VALIDATION_001";

export function createAtlasRegionPackageConsumptionTest(rawRegionImportPackage) {
  const regionImportPackage = normalizeRegionImportPackage(rawRegionImportPackage);
  const pipeline = buildPipeline(regionImportPackage);

  const resultBase = deepFreeze({
    schemaId: atlasRegionPackageTestResultSchemaId,
    testId: `${regionImportPackage.packageId}_ATLAS_REGION_PACKAGE_TEST`,
    consumptionTest: deepFreeze({
      schemaId: atlasRegionPackageConsumptionTestSchemaId,
      packageId: regionImportPackage.packageId,
      regionId: regionImportPackage.regionPackageMetadata.regionId,
      authoritativePackage: true,
      sourceGeometryMutable: false,
      atlasAuthorityMode: "INTERPRET_ASSIGN_COMPOSE_ONLY"
    }),
    packageIdentity: deepFreeze({
      packageId: regionImportPackage.packageId,
      regionId: regionImportPackage.regionPackageMetadata.regionId,
      packageVersion: regionImportPackage.regionPackageMetadata.packageVersion,
      selectedProfile: regionImportPackage.interpretationMetadata.selectedProfile,
      classificationResult: regionImportPackage.interpretationMetadata.classificationResult
    }),
    objectCount: buildObjectCountSummary(pipeline),
    classifications: buildClassificationSummary(pipeline.classificationLayer),
    assetAssignments: buildAssetAssignmentSummary(pipeline.assetResolver),
    sceneSummary: buildSceneSummary(pipeline.sceneCompositionLayer),
    validationState: buildValidationState(pipeline),
    deterministicFingerprint: null,
    validation: null
  });

  const deterministicFingerprint = buildDeterministicFingerprint(resultBase);
  const validation = buildRegionPackageTestValidation(
    resultBase,
    regionImportPackage,
    pipeline,
    deterministicFingerprint
  );

  const result = deepFreeze({
    ...resultBase,
    deterministicFingerprint,
    validation
  });

  const checked = validateAtlasRegionPackageConsumptionTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasRegionPackageConsumptionTest(rawResult) {
  try {
    if (rawResult?.schemaId !== atlasRegionPackageTestResultSchemaId) {
      throw createValidationError(
        "invalid_atlas_region_package_test_result_schema",
        `Expected ${atlasRegionPackageTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (
      rawResult.consumptionTest?.schemaId !==
      atlasRegionPackageConsumptionTestSchemaId
    ) {
      throw createValidationError(
        "invalid_atlas_region_package_consumption_test_schema",
        `Expected ${atlasRegionPackageConsumptionTestSchemaId} but received ${rawResult.consumptionTest?.schemaId}.`
      );
    }

    if (rawResult.validation?.schemaId !== atlasRegionPackageTestValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_region_package_test_validation_schema",
        `Expected ${atlasRegionPackageTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    if ((rawResult.objectCount?.totalWorldObjects ?? 0) <= 0) {
      throw createValidationError(
        "invalid_atlas_region_package_object_count",
        "Atlas region package test must expose a non-zero world object count."
      );
    }

    if (!Array.isArray(rawResult.sceneSummary?.sceneEntries) || rawResult.sceneSummary.sceneEntries.length === 0) {
      throw createValidationError(
        "invalid_atlas_region_package_scene_summary",
        "Atlas region package test must expose a non-empty scene summary."
      );
    }

    for (const key of [
      "provenancePreserved",
      "geometryPreserved",
      "objectClassificationsValid",
      "assetAssignmentsValid",
      "sceneCompositionValid",
      "deterministicOutput",
      "validationPassedOverall"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createValidationError(
          "atlas_region_package_test_validation_failed",
          `Atlas region package test validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedSignature !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_region_package_test_signature_mismatch",
        "Atlas region package test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasRegionPackageTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_region_package_test_validation_failed",
      message: error.message,
      atlasRegionPackageTestResult: null
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

function buildPipeline(regionImportPackage) {
  const runtimeReader = createRegionPackageRuntimeReader(regionImportPackage);
  const atlasPresentationLayer = createAtlasPresentationRuntimeLayer(runtimeReader);
  const classificationLayer =
    createGrowgoObjectClassificationLayer(atlasPresentationLayer);
  const relationshipLayer =
    createAtlasObjectRelationshipLayer(classificationLayer);
  const assetResolver = createAtlasAssetRecipeResolver(
    classificationLayer,
    relationshipLayer
  );
  const sceneCompositionLayer = createAtlasStreetSceneCompositionLayer(
    classificationLayer,
    relationshipLayer
  );

  return deepFreeze({
    runtimeReader,
    atlasPresentationLayer,
    classificationLayer,
    relationshipLayer,
    assetResolver,
    sceneCompositionLayer
  });
}

function buildObjectCountSummary(pipeline) {
  const runtimeCollections = pipeline.runtimeReader.runtimeCollections;
  const totalWorldObjects = pipeline.classificationLayer.worldObjects.objects.length;

  return deepFreeze({
    runtimeRoadObjects: runtimeCollections.runtimeRoadObjects.objects.length,
    runtimeSettlementObjects: runtimeCollections.runtimeSettlementObjects.objects.length,
    runtimePoiObjects: runtimeCollections.runtimePoiObjects.objects.length,
    runtimeNaturalFeatureObjects:
      runtimeCollections.runtimeNaturalFeatureObjects.objects.length,
    runtimeBuildingReferenceObjects:
      runtimeCollections.runtimeBuildingReferenceObjects.objects.length,
    totalWorldObjects
  });
}

function buildClassificationSummary(classificationLayer) {
  const summary = {};
  for (const object of classificationLayer.worldObjects.objects) {
    summary[object.growgoClassification] =
      (summary[object.growgoClassification] ?? 0) + 1;
  }

  return deepFreeze({
    totalObjects: classificationLayer.worldObjects.objects.length,
    byClassification: deepFreeze(sortObject(summary))
  });
}

function buildAssetAssignmentSummary(assetResolver) {
  const byRecipe = {};
  const byAssetFamily = {};

  for (const entry of assetResolver.assignments.entries) {
    byRecipe[entry.recipeId] = (byRecipe[entry.recipeId] ?? 0) + 1;
    byAssetFamily[entry.assetFamily] = (byAssetFamily[entry.assetFamily] ?? 0) + 1;
  }

  return deepFreeze({
    assignmentCount: assetResolver.assignments.entries.length,
    byRecipe: deepFreeze(sortObject(byRecipe)),
    byAssetFamily: deepFreeze(sortObject(byAssetFamily))
  });
}

function buildSceneSummary(sceneCompositionLayer) {
  const sceneEntries = sceneCompositionLayer.streetScenes.entries.map((entry) =>
    deepFreeze({
      sceneId: entry.sceneId,
      sceneType: entry.sceneType,
      objectCount: entry.objectList.length,
      roadReferenceCount: entry.roadLayoutReference.length,
      assetAssignmentCount: entry.assetAssignments.length,
      relationshipCount: entry.relationshipGraph.length
    })
  );

  return deepFreeze({
    sceneCount: sceneEntries.length,
    sceneEntries: deepFreeze(sceneEntries)
  });
}

function buildValidationState(pipeline) {
  return deepFreeze({
    runtimeReaderValidationPassed: pipeline.runtimeReader.validation.validationPassed,
    atlasPresentationValidationPassed:
      pipeline.atlasPresentationLayer.validation.validationPassed,
    classificationValidationPassed:
      pipeline.classificationLayer.validation.validationPassed,
    relationshipValidationPassed:
      pipeline.relationshipLayer.validation.validationPassed,
    assetResolverValidationPassed: pipeline.assetResolver.validation.validationPassed,
    sceneCompositionValidationPassed:
      pipeline.sceneCompositionLayer.validation.validationPassed
  });
}

function buildDeterministicFingerprint(resultBase) {
  return deepFreeze({
    deterministicOutput: true,
    fingerprint: computeDeterministicSignatureHash({
      packageIdentity: resultBase.packageIdentity,
      objectCount: resultBase.objectCount,
      classifications: resultBase.classifications,
      assetAssignments: resultBase.assetAssignments,
      sceneSummary: resultBase.sceneSummary,
      validationState: resultBase.validationState
    }),
    sameInputProducesSameConsumptionRecord: true
  });
}

function buildRegionPackageTestValidation(
  resultBase,
  regionImportPackage,
  pipeline,
  deterministicFingerprint
) {
  const provenancePreserved =
    pipeline.runtimeReader.validation.provenancePreserved === true &&
    pipeline.atlasPresentationLayer.validation.provenanceMaintained === true &&
    pipeline.classificationLayer.validation.sourceReferencePreserved === true &&
    pipeline.relationshipLayer.validation.sourceReferencesPreserved === true;

  const geometryPreserved =
    pipeline.atlasPresentationLayer.validation.sourceGeometryPreserved === true &&
    pipeline.assetResolver.validation.geometryPreserved === true &&
    pipeline.sceneCompositionLayer.validation.geometryPreserved === true;

  const objectClassificationsValid =
    pipeline.classificationLayer.validation.classificationValid === true &&
    resultBase.classifications.totalObjects === resultBase.objectCount.totalWorldObjects;

  const assetAssignmentsValid =
    pipeline.assetResolver.validation.validationPassed === true &&
    resultBase.assetAssignments.assignmentCount ===
      resultBase.objectCount.totalWorldObjects;

  const sceneCompositionValid =
    pipeline.sceneCompositionLayer.validation.validationPassed === true &&
    resultBase.sceneSummary.sceneCount > 0;

  const deterministicOutput = deterministicFingerprint.deterministicOutput === true;

  const validationWithoutHash = deepFreeze({
    schemaId: atlasRegionPackageTestValidationSchemaId,
    provenancePreserved,
    geometryPreserved,
    objectClassificationsValid,
    assetAssignmentsValid,
    sceneCompositionValid,
    deterministicOutput,
    validationPassedOverall:
      regionImportPackage.validationReport.validationPassed === true &&
      pipeline.runtimeReader.validation.validationPassed === true &&
      pipeline.atlasPresentationLayer.validation.validationPassed === true &&
      pipeline.classificationLayer.validation.validationPassed === true &&
      pipeline.relationshipLayer.validation.validationPassed === true &&
      pipeline.assetResolver.validation.validationPassed === true &&
      pipeline.sceneCompositionLayer.validation.validationPassed === true &&
      provenancePreserved &&
      geometryPreserved &&
      objectClassificationsValid &&
      assetAssignmentsValid &&
      sceneCompositionValid &&
      deterministicOutput,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      packageIdentity: resultBase.packageIdentity,
      objectCount: resultBase.objectCount,
      classifications: resultBase.classifications,
      assetAssignments: resultBase.assetAssignments,
      sceneSummary: resultBase.sceneSummary,
      validationState: resultBase.validationState,
      deterministicFingerprint,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash
  });
}

function buildValidationSignatureSource(result) {
  return {
    packageIdentity: result.packageIdentity,
    objectCount: result.objectCount,
    classifications: result.classifications,
    assetAssignments: result.assetAssignments,
    sceneSummary: result.sceneSummary,
    validationState: result.validationState,
    deterministicFingerprint: result.deterministicFingerprint,
    validation: result.validation
      ? {
          provenancePreserved: result.validation.provenancePreserved,
          geometryPreserved: result.validation.geometryPreserved,
          objectClassificationsValid: result.validation.objectClassificationsValid,
          assetAssignmentsValid: result.validation.assetAssignmentsValid,
          sceneCompositionValid: result.validation.sceneCompositionValid,
          deterministicOutput: result.validation.deterministicOutput,
          validationPassedOverall: result.validation.validationPassedOverall
        }
      : null
  };
}

function sortObject(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  );
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
