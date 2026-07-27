import {
  createSourceAdapterLayer,
  createWorldInterpretationInputsFromRegionPackage,
  validateSourceAdapterLayer
} from "./source-adapter.mjs";
import {
  createWorldInterpretationLayer,
  validateWorldInterpretationLayer
} from "./world-interpretation-engine.mjs";

const growgoRegionImportPackageSchemaId = "GROWGO_REGION_IMPORT_PACKAGE_001";
const regionPackageMetadataSchemaId = "REGION_PACKAGE_METADATA_001";
const packageProvenanceIndexSchemaId = "PACKAGE_PROVENANCE_INDEX_001";
const regionInterpretationMetadataSchemaId = "REGION_INTERPRETATION_METADATA_001";
const regionCacheMetadataSchemaId = "REGION_CACHE_METADATA_001";
const regionPackageValidationSchemaId = "REGION_PACKAGE_VALIDATION_001";

const packageVersion = "1";
const compatibilityVersion = "WORLD_INTERPRETATION_LAYER_001";

export function createGrowgoRegionImportPackage(rawSourceAdapterLayer) {
  const sourceAdapterLayer = normalizeSourceAdapterLayer(rawSourceAdapterLayer);
  const interpretation = createWorldInterpretationLayer({
    interpretationSeed: `${sourceAdapterLayer.regionPackage.packageId}_INTERPRETATION`,
    sourceDataReferences: createWorldInterpretationInputsFromRegionPackage(
      sourceAdapterLayer.regionPackage
    )
  });

  const provenanceIndex = buildPackageProvenanceIndex(sourceAdapterLayer);
  const metadata = buildRegionPackageMetadata(sourceAdapterLayer);
  const interpretationMetadata = buildInterpretationMetadata(interpretation);
  const cacheMetadata = buildCacheMetadata(sourceAdapterLayer, provenanceIndex);

  const packageBase = deepFreeze({
    schemaId: growgoRegionImportPackageSchemaId,
    packageId: metadata.packageId,
    regionPackageMetadata: metadata,
    normalizedDataContent: deepFreeze({
      normalizedGeographyData: sourceAdapterLayer.normalizedOutputs.normalizedGeographyData,
      normalizedRoadData: sourceAdapterLayer.normalizedOutputs.normalizedRoadData,
      normalizedSettlementData: sourceAdapterLayer.normalizedOutputs.normalizedSettlementData,
      normalizedPoiData: sourceAdapterLayer.normalizedOutputs.normalizedPoiData,
      normalizedNaturalFeatureData:
        sourceAdapterLayer.normalizedOutputs.normalizedNaturalFeatureData
    }),
    provenanceIndex,
    interpretationMetadata,
    cacheMetadata,
    sourceAdapterReference: deepFreeze({
      adapterId: sourceAdapterLayer.adapterId,
      regionPackageId: sourceAdapterLayer.regionPackage.packageId
    }),
    validationReport: null
  });

  const validationReport = buildRegionPackageValidation(
    packageBase,
    sourceAdapterLayer,
    interpretation
  );

  const finalized = deepFreeze({
    ...packageBase,
    validationReport
  });

  const validation = validateGrowgoRegionImportPackage(finalized);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return finalized;
}

export function createGrowgoRegionImportPackageFromSourceBundle(rawBundle) {
  return createGrowgoRegionImportPackage(createSourceAdapterLayer(rawBundle));
}

export function validateGrowgoRegionImportPackage(rawRegionImportPackage) {
  try {
    const regionImportPackage = rawRegionImportPackage;

    assertPresent(
      regionImportPackage?.regionPackageMetadata,
      "Region package metadata is required."
    );
    assertPresent(
      regionImportPackage?.normalizedDataContent,
      "Normalized data content is required."
    );
    assertPresent(regionImportPackage?.provenanceIndex, "Provenance index is required.");
    assertPresent(
      regionImportPackage?.interpretationMetadata,
      "Interpretation metadata is required."
    );
    assertPresent(regionImportPackage?.cacheMetadata, "Cache metadata is required.");
    assertPresent(regionImportPackage?.validationReport, "Validation report is required.");

    if (regionImportPackage.schemaId !== growgoRegionImportPackageSchemaId) {
      throw createValidationError(
        "invalid_region_import_package_schema",
        `Expected ${growgoRegionImportPackageSchemaId} but received ${regionImportPackage.schemaId}.`
      );
    }

    const validationReport = regionImportPackage.validationReport;
    for (const key of [
      "sourceReferencesPreserved",
      "requiredDataPresent",
      "provenanceComplete",
      "interpretationCompatible",
      "deterministicPackageHashValid",
      "cacheMetadataValid",
      "validationPassed"
    ]) {
      if (validationReport[key] !== true) {
        throw createValidationError(
          "region_import_package_validation_failed",
          `Region import package validation flag ${key} must be true.`
        );
      }
    }

    const expectedPackageHash = computeDeterministicSignatureHash(
      buildHashSourcePayload(regionImportPackage)
    );
    if (expectedPackageHash !== regionImportPackage.cacheMetadata.packageHash) {
      throw createValidationError(
        "region_import_package_hash_mismatch",
        "Region import package hash does not match deterministic package contents."
      );
    }

    const expectedValidationHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(regionImportPackage)
    );
    if (expectedValidationHash !== validationReport.deterministicSignatureHash) {
      throw createValidationError(
        "region_import_package_validation_hash_mismatch",
        "Region package validation signature does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      regionImportPackage
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "region_import_package_validation_failed",
      message: error.message,
      regionImportPackage: null
    });
  }
}

function normalizeSourceAdapterLayer(rawSourceAdapterLayer) {
  const validation = validateSourceAdapterLayer(rawSourceAdapterLayer);
  if (!validation.ok) {
    throw createValidationError("source_adapter_invalid", validation.message);
  }

  return deepFreeze(structuredClone(validation.sourceAdapterLayer));
}

function buildRegionPackageMetadata(sourceAdapterLayer) {
  return deepFreeze({
    schemaId: regionPackageMetadataSchemaId,
    packageId: `${sourceAdapterLayer.regionPackage.packageId}_IMPORT`,
    regionId: sourceAdapterLayer.geographicArea.regionId,
    sourceVersions: deepFreeze({
      providerVersion: sourceAdapterLayer.providerVersion.version,
      importVersion: sourceAdapterLayer.importVersion,
      normalizationRuleVersion:
        sourceAdapterLayer.normalizationStatus.normalizationRuleVersion
    }),
    creationTimestamp: sourceAdapterLayer.sourceTimestamps.importedAt,
    geographicBounds: sourceAdapterLayer.geographicArea.boundary,
    packageVersion
  });
}

function buildPackageProvenanceIndex(sourceAdapterLayer) {
  const categories = [
    ["normalizedGeographyData", sourceAdapterLayer.normalizedOutputs.normalizedGeographyData],
    ["normalizedRoadData", sourceAdapterLayer.normalizedOutputs.normalizedRoadData],
    ["normalizedSettlementData", sourceAdapterLayer.normalizedOutputs.normalizedSettlementData],
    ["normalizedPoiData", sourceAdapterLayer.normalizedOutputs.normalizedPoiData],
    [
      "normalizedNaturalFeatureData",
      sourceAdapterLayer.normalizedOutputs.normalizedNaturalFeatureData
    ]
  ];

  const entries = categories
    .flatMap(([groupId, group]) =>
      group.provenance.map((record, index) =>
        deepFreeze({
          provenanceRecordId: `${groupId.toUpperCase()}_${String(index + 1).padStart(3, "0")}`,
          normalizedFeatureGroup: groupId,
          sourceFeatureId: record.sourceId,
          provider: record.provider,
          normalizedFeatureId: record.normalizedFeatureId ?? record.sourceId,
          normalizationVersion: record.normalizationVersion
        })
      )
    )
    .sort(compareBy("provenanceRecordId"));

  return deepFreeze({
    schemaId: packageProvenanceIndexSchemaId,
    indexEntries: deepFreeze(entries),
    totalEntries: entries.length
  });
}

function buildInterpretationMetadata(interpretation) {
  const interpretationValidation = validateWorldInterpretationLayer(interpretation);
  if (!interpretationValidation.ok) {
    throw createValidationError(
      "world_interpretation_invalid",
      interpretationValidation.message
    );
  }

  return deepFreeze({
    schemaId: regionInterpretationMetadataSchemaId,
    classificationResult: interpretation.classificationResults.primaryWorldType,
    selectedProfile: interpretation.selectedEnvironmentProfile.profileId,
    confidence: interpretation.selectedEnvironmentProfile.profileConfidence,
    evidenceReasons: interpretation.classificationResults.reasons
  });
}

function buildCacheMetadata(sourceAdapterLayer, provenanceIndex) {
  const packageHash = computeDeterministicSignatureHash(
    buildHashSourcePayload({
      regionPackageMetadata: buildRegionPackageMetadata(sourceAdapterLayer),
      normalizedDataContent: {
        normalizedGeographyData: sourceAdapterLayer.normalizedOutputs.normalizedGeographyData,
        normalizedRoadData: sourceAdapterLayer.normalizedOutputs.normalizedRoadData,
        normalizedSettlementData: sourceAdapterLayer.normalizedOutputs.normalizedSettlementData,
        normalizedPoiData: sourceAdapterLayer.normalizedOutputs.normalizedPoiData,
        normalizedNaturalFeatureData:
          sourceAdapterLayer.normalizedOutputs.normalizedNaturalFeatureData
      },
      provenanceIndex,
      sourceAdapterReference: {
        adapterId: sourceAdapterLayer.adapterId,
        regionPackageId: sourceAdapterLayer.regionPackage.packageId
      }
    })
  );

  return deepFreeze({
    schemaId: regionCacheMetadataSchemaId,
    packageSize: countPackageFeatures(sourceAdapterLayer.normalizedOutputs),
    chunkReferences: deepFreeze([
      `${sourceAdapterLayer.geographicArea.regionId}:GEOGRAPHY`,
      `${sourceAdapterLayer.geographicArea.regionId}:ROAD_NETWORK`,
      `${sourceAdapterLayer.geographicArea.regionId}:SETTLEMENTS`,
      `${sourceAdapterLayer.geographicArea.regionId}:POINTS_OF_INTEREST`,
      `${sourceAdapterLayer.geographicArea.regionId}:NATURAL_FEATURES`
    ]),
    version: packageVersion,
    expiryUpdateInformation: deepFreeze({
      sourceImportedAt: sourceAdapterLayer.sourceTimestamps.importedAt,
      staleAfter: null,
      refreshPolicy: "SOURCE_VERSION_CHANGE"
    }),
    compatibilityVersion,
    packageHash
  });
}

function buildRegionPackageValidation(packageBase, sourceAdapterLayer, interpretation) {
  const validationWithoutHash = deepFreeze({
    schemaId: regionPackageValidationSchemaId,
    sourceReferencesPreserved:
      sourceAdapterLayer.sourceReferences.length > 0 &&
      packageBase.provenanceIndex.totalEntries > 0,
    requiredDataPresent: hasRequiredData(packageBase.normalizedDataContent),
    provenanceComplete:
      packageBase.provenanceIndex.indexEntries.length >=
      sourceAdapterLayer.sourceReferences.length,
    interpretationCompatible:
      interpretation.validationState.validationPassed === true &&
      packageBase.interpretationMetadata.selectedProfile ===
        interpretation.selectedEnvironmentProfile.profileId,
    deterministicPackageHashValid: true,
    cacheMetadataValid:
      packageBase.cacheMetadata.chunkReferences.length === 5 &&
      packageBase.cacheMetadata.compatibilityVersion === compatibilityVersion,
    validationPassed: true,
    reasons: deepFreeze([
      "source references preserved",
      "required normalized data present",
      "provenance index complete",
      "interpretation compatibility confirmed",
      "cache metadata valid",
      "deterministic package hash generated"
    ]),
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      ...packageBase,
      validationReport: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash: signature
  });
}

function buildHashSourcePayload(value) {
  return {
    regionPackageMetadata: value.regionPackageMetadata,
    normalizedDataContent: value.normalizedDataContent,
    provenanceIndex: value.provenanceIndex,
    sourceAdapterReference: value.sourceAdapterReference
  };
}

function buildValidationSignatureSource(regionImportPackage) {
  return {
    packageId: regionImportPackage.packageId,
    packageHash: regionImportPackage.cacheMetadata.packageHash,
    validationFlags: {
      sourceReferencesPreserved:
        regionImportPackage.validationReport?.sourceReferencesPreserved ?? true,
      requiredDataPresent: regionImportPackage.validationReport?.requiredDataPresent ?? true,
      provenanceComplete: regionImportPackage.validationReport?.provenanceComplete ?? true,
      interpretationCompatible:
        regionImportPackage.validationReport?.interpretationCompatible ?? true,
      deterministicPackageHashValid:
        regionImportPackage.validationReport?.deterministicPackageHashValid ?? true,
      cacheMetadataValid: regionImportPackage.validationReport?.cacheMetadataValid ?? true,
      validationPassed: regionImportPackage.validationReport?.validationPassed ?? true
    }
  };
}

function hasRequiredData(normalizedDataContent) {
  return Boolean(
    normalizedDataContent?.normalizedGeographyData &&
      normalizedDataContent?.normalizedRoadData &&
      normalizedDataContent?.normalizedSettlementData &&
      normalizedDataContent?.normalizedPoiData &&
      normalizedDataContent?.normalizedNaturalFeatureData
  );
}

function countPackageFeatures(normalizedOutputs) {
  return (
    normalizedOutputs.normalizedGeographyData.coastlineFeatures.length +
    normalizedOutputs.normalizedGeographyData.riverFeatures.length +
    normalizedOutputs.normalizedGeographyData.terrainBands.length +
    normalizedOutputs.normalizedGeographyData.elevationBands.length +
    normalizedOutputs.normalizedGeographyData.biomeClassification.length +
    normalizedOutputs.normalizedGeographyData.protectedAreaFeatures.length +
    normalizedOutputs.normalizedRoadData.roadSegments.length +
    normalizedOutputs.normalizedRoadData.trailSegments.length +
    normalizedOutputs.normalizedRoadData.pathSegments.length +
    normalizedOutputs.normalizedRoadData.transportRoutes.length +
    normalizedOutputs.normalizedSettlementData.cityRecords.length +
    normalizedOutputs.normalizedSettlementData.townRecords.length +
    normalizedOutputs.normalizedSettlementData.suburbRecords.length +
    normalizedOutputs.normalizedSettlementData.villageRecords.length +
    normalizedOutputs.normalizedPoiData.landmarkRecords.length +
    normalizedOutputs.normalizedPoiData.attractionRecords.length +
    normalizedOutputs.normalizedPoiData.serviceRecords.length +
    normalizedOutputs.normalizedPoiData.culturalLocationRecords.length +
    normalizedOutputs.normalizedNaturalFeatureData.beachFeatures.length +
    normalizedOutputs.normalizedNaturalFeatureData.parkFeatures.length +
    normalizedOutputs.normalizedNaturalFeatureData.forestFeatures.length +
    normalizedOutputs.normalizedNaturalFeatureData.reserveFeatures.length +
    normalizedOutputs.normalizedNaturalFeatureData.waterwayFeatures.length
  );
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
