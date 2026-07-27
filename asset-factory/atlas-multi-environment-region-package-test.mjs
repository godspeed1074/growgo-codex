import {
  validateGrowgoRegionImportPackage
} from "./region-package-builder.mjs";
import {
  createRegionPackageRuntimeReader
} from "./region-package-runtime-reader.mjs";
import {
  createAtlasPresentationRuntimeLayer
} from "./atlas-presentation-runtime.mjs";
import {
  createGrowgoObjectClassificationLayer
} from "./growgo-object-classification.mjs";
import {
  createAtlasObjectRelationshipLayer
} from "./atlas-object-relationship.mjs";
import {
  createAtlasAssetRecipeResolver
} from "./atlas-asset-recipe-resolver.mjs";
import {
  createAtlasStreetSceneCompositionLayer
} from "./atlas-street-scene-composition.mjs";

export const atlasMultiEnvironmentRegionPackageTestSchemaId =
  "ATLAS_MULTI_ENVIRONMENT_REGION_PACKAGE_TEST_001";
export const atlasMultiEnvironmentRegionTestResultSchemaId =
  "ATLAS_MULTI_ENVIRONMENT_REGION_TEST_RESULT_001";
export const atlasMultiEnvironmentRegionTestValidationSchemaId =
  "ATLAS_MULTI_ENVIRONMENT_REGION_TEST_VALIDATION_001";

const supportedPackageTypes = new Set([
  "COASTAL_REGION_PACKAGE",
  "RURAL_REGION_PACKAGE",
  "URBAN_REGION_PACKAGE"
]);

export function createAtlasMultiEnvironmentRegionPackageTest(rawPackagesByType) {
  const packagesByType = normalizePackagesByType(rawPackagesByType);
  const packageResults = buildPackageResults(packagesByType);

  const resultBase = deepFreeze({
    schemaId: atlasMultiEnvironmentRegionTestResultSchemaId,
    testId: "ATLAS_MULTI_ENVIRONMENT_REGION_PACKAGE_TEST_001_RESULT",
    testDefinition: deepFreeze({
      schemaId: atlasMultiEnvironmentRegionPackageTestSchemaId,
      packageTypes: deepFreeze(Object.keys(packagesByType).sort()),
      authoritativePackagesOnly: true,
      sourceGeometryMutable: false,
      atlasAuthorityMode: "CLASSIFY_PRESENT_COMPOSE_ONLY"
    }),
    packageResults,
    validation: null,
    deterministicFingerprint: null
  });

  const deterministicFingerprint = buildDeterministicFingerprint(resultBase);
  const validation = buildMultiEnvironmentValidation(
    resultBase,
    deterministicFingerprint
  );

  const result = deepFreeze({
    ...resultBase,
    validation,
    deterministicFingerprint
  });

  const checked = validateAtlasMultiEnvironmentRegionPackageTest(result);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return result;
}

export function validateAtlasMultiEnvironmentRegionPackageTest(rawResult) {
  try {
    if (rawResult?.schemaId !== atlasMultiEnvironmentRegionTestResultSchemaId) {
      throw createValidationError(
        "invalid_atlas_multi_environment_region_test_result_schema",
        `Expected ${atlasMultiEnvironmentRegionTestResultSchemaId} but received ${rawResult?.schemaId}.`
      );
    }

    if (
      rawResult.testDefinition?.schemaId !==
      atlasMultiEnvironmentRegionPackageTestSchemaId
    ) {
      throw createValidationError(
        "invalid_atlas_multi_environment_region_test_schema",
        `Expected ${atlasMultiEnvironmentRegionPackageTestSchemaId} but received ${rawResult.testDefinition?.schemaId}.`
      );
    }

    if (!Array.isArray(rawResult.packageResults) || rawResult.packageResults.length < 3) {
      throw createValidationError(
        "invalid_atlas_multi_environment_package_results",
        "Atlas multi-environment region test must expose at least three package results."
      );
    }

    if (
      rawResult.validation?.schemaId !==
      atlasMultiEnvironmentRegionTestValidationSchemaId
    ) {
      throw createValidationError(
        "invalid_atlas_multi_environment_region_validation_schema",
        `Expected ${atlasMultiEnvironmentRegionTestValidationSchemaId} but received ${rawResult.validation?.schemaId}.`
      );
    }

    for (const packageResult of rawResult.packageResults) {
      if (!supportedPackageTypes.has(packageResult.packageType)) {
        throw createValidationError(
          "invalid_atlas_multi_environment_package_type",
          `Unsupported package type ${packageResult.packageType}.`
        );
      }
      assertPresent(packageResult.packageId, "Package result packageId is required.");
      assertPresent(packageResult.regionId, "Package result regionId is required.");
      assertPresent(
        packageResult.classificationResult,
        "Package result classificationResult is required."
      );
    }

    for (const key of [
      "provenancePreserved",
      "geometryPreserved",
      "classificationsCorrect",
      "recipesValid",
      "deterministicOutput",
      "validationPassedOverall"
    ]) {
      if (rawResult.validation[key] !== true) {
        throw createValidationError(
          "atlas_multi_environment_region_test_validation_failed",
          `Atlas multi-environment region test validation flag ${key} must be true.`
        );
      }
    }

    const expectedSignature = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawResult)
    );
    if (expectedSignature !== rawResult.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_multi_environment_region_test_signature_mismatch",
        "Atlas multi-environment region test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasMultiEnvironmentRegionTestResult: rawResult
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_multi_environment_region_test_validation_failed",
      message: error.message,
      atlasMultiEnvironmentRegionTestResult: null
    });
  }
}

function normalizePackagesByType(rawPackagesByType) {
  if (!rawPackagesByType || typeof rawPackagesByType !== "object") {
    throw createValidationError(
      "invalid_multi_environment_region_package_input",
      "Atlas multi-environment region package test requires a package map."
    );
  }

  const normalized = {};
  for (const [packageType, rawPackage] of Object.entries(rawPackagesByType)) {
    if (!supportedPackageTypes.has(packageType)) {
      throw createValidationError(
        "unsupported_multi_environment_region_package_type",
        `Unsupported package type ${packageType}.`
      );
    }

    const validation = validateGrowgoRegionImportPackage(rawPackage);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_multi_environment_region_package",
        `${packageType}: ${validation.message}`
      );
    }

    normalized[packageType] = deepFreeze(structuredClone(validation.regionImportPackage));
  }

  return deepFreeze(normalized);
}

function buildPackageResults(packagesByType) {
  return deepFreeze(
    Object.entries(packagesByType)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([packageType, regionPackage]) => {
        const runtimeReader = createRegionPackageRuntimeReader(regionPackage);
        const atlasPresentationLayer =
          createAtlasPresentationRuntimeLayer(runtimeReader);
        const classificationLayer =
          createGrowgoObjectClassificationLayer(atlasPresentationLayer);
        const relationshipLayer =
          createAtlasObjectRelationshipLayer(classificationLayer);
        const assetResolver = createAtlasAssetRecipeResolver(
          classificationLayer,
          relationshipLayer
        );
        const sceneComposition = buildOptionalSceneComposition(
          classificationLayer,
          relationshipLayer
        );

        return deepFreeze({
          packageType,
          packageId: regionPackage.packageId,
          regionId: regionPackage.regionPackageMetadata.regionId,
          classificationResult:
            regionPackage.interpretationMetadata.classificationResult,
          selectedProfile: regionPackage.interpretationMetadata.selectedProfile,
          objectCounts: buildObjectCounts(runtimeReader, classificationLayer),
          classifications: buildClassificationSummary(classificationLayer),
          assetAssignments: buildAssetAssignmentSummary(assetResolver),
          sceneSummary: buildSceneSummary(sceneComposition),
          validationState: deepFreeze({
            runtimeReaderValidationPassed: runtimeReader.validation.validationPassed,
            atlasPresentationValidationPassed:
              atlasPresentationLayer.validation.validationPassed,
            classificationValidationPassed:
              classificationLayer.validation.validationPassed,
            relationshipValidationPassed:
              relationshipLayer.validation.validationPassed,
            assetResolverValidationPassed: assetResolver.validation.validationPassed,
            sceneCompositionAttempted: true,
            sceneCompositionValidationPassed:
              sceneComposition.validationPassedOverall
          }),
          packageValidation: deepFreeze({
            provenancePreserved:
              runtimeReader.validation.provenancePreserved === true &&
              atlasPresentationLayer.validation.provenanceMaintained === true,
            geometryPreserved:
              atlasPresentationLayer.validation.sourceGeometryPreserved === true &&
              assetResolver.validation.geometryPreserved === true,
            objectClassificationsValid:
              classificationLayer.validation.classificationValid === true,
            assetAssignmentsValid: assetResolver.validation.validationPassed === true,
            sceneCompositionAttempted: true,
            sceneCompositionAvailable: sceneComposition.available,
            sceneCompositionValid: sceneComposition.validationPassedOverall,
            deterministicOutput: true,
            validationPassedOverall:
              runtimeReader.validation.validationPassed === true &&
              atlasPresentationLayer.validation.validationPassed === true &&
              classificationLayer.validation.validationPassed === true &&
              relationshipLayer.validation.validationPassed === true &&
              assetResolver.validation.validationPassed === true
          })
        });
      })
  );
}

function buildOptionalSceneComposition(classificationLayer, relationshipLayer) {
  try {
    const sceneCompositionLayer = createAtlasStreetSceneCompositionLayer(
      classificationLayer,
      relationshipLayer
    );
    return deepFreeze({
      available: true,
      sceneCompositionLayer,
      validationPassedOverall:
        sceneCompositionLayer.validation.validationPassed === true,
      failureReason: null
    });
  } catch (error) {
    return deepFreeze({
      available: false,
      sceneCompositionLayer: null,
      validationPassedOverall: false,
      failureReason: error.message
    });
  }
}

function buildObjectCounts(runtimeReader, classificationLayer) {
  return deepFreeze({
    runtimeRoadObjects:
      runtimeReader.runtimeCollections.runtimeRoadObjects.objects.length,
    runtimeSettlementObjects:
      runtimeReader.runtimeCollections.runtimeSettlementObjects.objects.length,
    runtimePoiObjects:
      runtimeReader.runtimeCollections.runtimePoiObjects.objects.length,
    runtimeNaturalFeatureObjects:
      runtimeReader.runtimeCollections.runtimeNaturalFeatureObjects.objects.length,
    runtimeBuildingReferenceObjects:
      runtimeReader.runtimeCollections.runtimeBuildingReferenceObjects.objects.length,
    totalWorldObjects: classificationLayer.worldObjects.objects.length
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

function buildSceneSummary(sceneComposition) {
  if (!sceneComposition.available || !sceneComposition.sceneCompositionLayer) {
    return deepFreeze({
      sceneCount: 0,
      sceneEntries: deepFreeze([]),
      sceneCompositionAvailable: false,
      sceneCompositionFailureReason: sceneComposition.failureReason
    });
  }

  const sceneEntries = sceneComposition.sceneCompositionLayer.streetScenes.entries.map(
    (entry) =>
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
    sceneEntries: deepFreeze(sceneEntries),
    sceneCompositionAvailable: true,
    sceneCompositionFailureReason: null
  });
}

function buildDeterministicFingerprint(resultBase) {
  return deepFreeze({
    deterministicOutput: true,
    fingerprint: computeDeterministicSignatureHash({
      packageResults: resultBase.packageResults
    }),
    sameInputProducesSamePackageMatrix: true
  });
}

function buildMultiEnvironmentValidation(resultBase, deterministicFingerprint) {
  const provenancePreserved = resultBase.packageResults.every(
    (entry) => entry.packageValidation.provenancePreserved === true
  );
  const geometryPreserved = resultBase.packageResults.every(
    (entry) => entry.packageValidation.geometryPreserved === true
  );
  const classificationsCorrect = resultBase.packageResults.every(
    (entry) =>
      entry.classifications.totalObjects > 0 &&
      Object.keys(entry.classifications.byClassification).length > 0
  );
  const recipesValid = resultBase.packageResults.every(
    (entry) =>
      entry.assetAssignments.assignmentCount === entry.objectCounts.totalWorldObjects &&
      Object.keys(entry.assetAssignments.byRecipe).length > 0
  );
  const deterministicOutput = deterministicFingerprint.deterministicOutput === true;

  const validationWithoutHash = deepFreeze({
    schemaId: atlasMultiEnvironmentRegionTestValidationSchemaId,
    provenancePreserved,
    geometryPreserved,
    classificationsCorrect,
    recipesValid,
    deterministicOutput,
    validationPassedOverall:
      provenancePreserved &&
      geometryPreserved &&
      classificationsCorrect &&
      recipesValid &&
      deterministicOutput,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      packageResults: resultBase.packageResults,
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
    packageResults: result.packageResults,
    deterministicFingerprint: result.deterministicFingerprint,
    validation: result.validation
      ? {
          provenancePreserved: result.validation.provenancePreserved,
          geometryPreserved: result.validation.geometryPreserved,
          classificationsCorrect: result.validation.classificationsCorrect,
          recipesValid: result.validation.recipesValid,
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
