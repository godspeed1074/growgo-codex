import {
  createProviderAdapterLayer,
  providerFixtureBundles,
  validateProviderAdapterLayer
} from "./provider-adapter.mjs";
import {
  createSourceAdapterLayer,
  createWorldInterpretationInputsFromRegionPackage,
  validateSourceAdapterLayer
} from "./source-adapter.mjs";
import {
  createWorldInterpretationLayer,
  validateWorldInterpretationLayer
} from "./world-interpretation-engine.mjs";

const providerSourceBundleSchemaId = "PROVIDER_SOURCE_BUNDLE_001";
const sourceDataBundleSchemaId = "SOURCE_DATA_BUNDLE_001";
const controlledProviderIntegrationSchemaId = "CONTROLLED_PROVIDER_INTEGRATION_001";
const controlledProviderIntegrationOutputSchemaId =
  "CONTROLLED_PROVIDER_INTEGRATION_OUTPUT_001";

export const mockProviderRegionBundle = deepFreeze({
  schemaId: "MOCK_PROVIDER_REGION_BUNDLE_001",
  bundleId: "MOCK_PROVIDER_REGION_BUNDLE_001",
  regionId: "mock-provider-region-coastal-001",
  description: "Controlled coastal-region mock external provider package",
  providerBundles: deepFreeze({
    mapProviderData: providerFixtureBundles.MAP_PROVIDER_FIXTURE_001,
    terrainProviderData: providerFixtureBundles.TERRAIN_PROVIDER_FIXTURE_001,
    poiProviderData: providerFixtureBundles.POI_PROVIDER_FIXTURE_001,
    naturalFeatureData: providerFixtureBundles.NATURAL_PROVIDER_FIXTURE_001
  })
});

export function createControlledProviderIntegration(
  rawMockProviderBundle = mockProviderRegionBundle
) {
  const mockBundle = normalizeMockProviderBundle(rawMockProviderBundle);
  const providerLayers = deepFreeze({
    mapProvider: createProviderAdapterLayer(mockBundle.providerBundles.mapProviderData),
    terrainProvider: createProviderAdapterLayer(mockBundle.providerBundles.terrainProviderData),
    poiProvider: createProviderAdapterLayer(mockBundle.providerBundles.poiProviderData),
    naturalProvider: createProviderAdapterLayer(mockBundle.providerBundles.naturalFeatureData)
  });

  const combinedSourceDataBundle = mergeProviderSourceDataBundles(
    mockBundle,
    providerLayers
  );
  const sourceAdapterLayer = createSourceAdapterLayer(combinedSourceDataBundle);
  const interpretationInputs = createWorldInterpretationInputsFromRegionPackage(
    sourceAdapterLayer.regionPackage
  );
  const interpretationResult = createWorldInterpretationLayer({
    interpretationSeed: `${mockBundle.bundleId}_INTERPRETATION`,
    sourceDataReferences: interpretationInputs
  });
  const provenanceSummary = buildProvenanceSummary(
    mockBundle,
    providerLayers,
    combinedSourceDataBundle,
    sourceAdapterLayer,
    interpretationResult
  );

  const output = deepFreeze({
    schemaId: controlledProviderIntegrationOutputSchemaId,
    outputId: `${mockBundle.bundleId}_OUTPUT`,
    normalizedRegionPackage: sourceAdapterLayer.regionPackage,
    interpretationResult,
    selectedProfile: interpretationResult.selectedEnvironmentProfile.profileId,
    gameplayOpportunities: interpretationResult.gameplayWeighting.map((rule) =>
      deepFreeze({
        ruleId: rule.ruleId,
        interpretedGameplayType: rule.interpretedGameplayType,
        sourceFeatureRefs: rule.sourceFeatureRefs
      })
    ),
    atlasPresentationRules: interpretationResult.atlasPresentationRules,
    provenanceSummary
  });

  const integration = deepFreeze({
    schemaId: controlledProviderIntegrationSchemaId,
    integrationId: `${mockBundle.bundleId}_INTEGRATION`,
    mockProviderBundle: mockBundle,
    providerLayers,
    sourceDataBundle: combinedSourceDataBundle,
    sourceAdapterLayer,
    interpretationInputs,
    interpretationResult,
    output,
    validation: buildIntegrationValidation(
      mockBundle,
      providerLayers,
      combinedSourceDataBundle,
      sourceAdapterLayer,
      interpretationResult,
      provenanceSummary
    )
  });

  const checked = validateControlledProviderIntegration(integration);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return integration;
}

export function validateControlledProviderIntegration(rawIntegration) {
  try {
    const integration = rawIntegration;
    assertPresent(integration?.providerLayers, "Provider layers are required.");
    assertPresent(integration?.sourceDataBundle, "Merged source data bundle is required.");
    assertPresent(
      integration?.sourceAdapterLayer,
      "Source adapter layer result is required."
    );
    assertPresent(
      integration?.interpretationResult,
      "World interpretation result is required."
    );
    assertPresent(integration?.output, "Controlled integration output is required.");
    assertPresent(integration?.validation, "Controlled integration validation is required.");

    for (const providerLayer of Object.values(integration.providerLayers)) {
      const providerValidation = validateProviderAdapterLayer(providerLayer);
      if (!providerValidation.ok) {
        throw createValidationError(
          "provider_layer_invalid",
          providerValidation.message
        );
      }
    }

    const sourceValidation = validateSourceAdapterLayer(integration.sourceAdapterLayer);
    if (!sourceValidation.ok) {
      throw createValidationError(
        "source_adapter_invalid",
        sourceValidation.message
      );
    }

    const interpretationValidation = validateWorldInterpretationLayer(
      integration.interpretationResult
    );
    if (!interpretationValidation.ok) {
      throw createValidationError(
        "interpretation_invalid",
        interpretationValidation.message
      );
    }

    for (const key of [
      "providerAdapterCompatibility",
      "sourceAdapterCompatibility",
      "interpretationCompatibility",
      "provenancePreserved",
      "noInventedFeatures",
      "deterministicOutputValid",
      "validationPassed"
    ]) {
      if (integration.validation[key] !== true) {
        throw createValidationError(
          "integration_validation_invalid",
          `Integration validation flag ${key} must be true.`
        );
      }
    }

    const signature = computeDeterministicSignatureHash(
      buildIntegrationValidationSource(integration)
    );
    if (signature !== integration.validation.deterministicSignatureHash) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "Controlled integration deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      controlledProviderIntegration: integration
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "controlled_provider_integration_failed",
      message: error.message,
      controlledProviderIntegration: null
    });
  }
}

function mergeProviderSourceDataBundles(mockBundle, providerLayers) {
  const sourceBundles = Object.values(providerLayers).map((layer) => layer.sourceDataBundle);
  const first = sourceBundles[0];

  return deepFreeze({
    schemaId: sourceDataBundleSchemaId,
    bundleId: `${mockBundle.bundleId}_SOURCE_DATA`,
    provider: deepFreeze({
      providerId: "controlled-provider-mock",
      providerType: "COMPOSITE_PROVIDER",
      version: "1.0"
    }),
    importVersion: "IMPORT_VERSION_001",
    geographicArea: structuredClone(first.geographicArea),
    sourceTimestamps: deepFreeze({
      capturedAt: sourceBundles
        .map((bundle) => bundle.sourceTimestamps.capturedAt)
        .sort()[0],
      importedAt: sourceBundles
        .map((bundle) => bundle.sourceTimestamps.importedAt)
        .sort()[0]
    }),
    geographyFeatures: deepFreeze(
      sortById(sourceBundles.flatMap((bundle) => bundle.geographyFeatures)).map(deepFreeze)
    ),
    roadFeatures: deepFreeze(
      sortById(sourceBundles.flatMap((bundle) => bundle.roadFeatures)).map(deepFreeze)
    ),
    settlementFeatures: deepFreeze(
      sortById(sourceBundles.flatMap((bundle) => bundle.settlementFeatures)).map(deepFreeze)
    ),
    poiFeatures: deepFreeze(
      sortById(sourceBundles.flatMap((bundle) => bundle.poiFeatures)).map(deepFreeze)
    ),
    naturalFeatures: deepFreeze(
      sortById(sourceBundles.flatMap((bundle) => bundle.naturalFeatures)).map(deepFreeze)
    )
  });
}

function buildProvenanceSummary(
  mockBundle,
  providerLayers,
  combinedSourceDataBundle,
  sourceAdapterLayer,
  interpretationResult
) {
  const normalizedProvenance = [
    ...sourceAdapterLayer.normalizedOutputs.normalizedGeographyData.provenance,
    ...sourceAdapterLayer.normalizedOutputs.normalizedRoadData.provenance,
    ...sourceAdapterLayer.normalizedOutputs.normalizedSettlementData.provenance,
    ...sourceAdapterLayer.normalizedOutputs.normalizedPoiData.provenance,
    ...sourceAdapterLayer.normalizedOutputs.normalizedNaturalFeatureData.provenance
  ];

  const interpretationRefs = new Set(
    [
      ...interpretationResult.gameplayWeighting.flatMap((rule) => rule.sourceFeatureRefs),
      ...interpretationResult.atlasPresentationRules.flatMap((rule) => rule.sourceFeatureRefs)
    ].filter(Boolean)
  );

  const providerSourceIds = Object.values(mockBundle.providerBundles).flatMap((bundle) =>
    bundle.sourceFeatures.map((feature) => feature.id)
  );

  const sourceFeatureIds = allSourceFeatures(combinedSourceDataBundle).map((feature) => feature.id);
  const normalizedSourceIds = normalizedProvenance.map((record) => record.sourceId);

  return deepFreeze({
    providerBundleCount: Object.keys(mockBundle.providerBundles).length,
    providerSourceCount: providerSourceIds.length,
    sourceBundleFeatureCount: sourceFeatureIds.length,
    normalizedProvenanceCount: normalizedSourceIds.length,
    interpretationReferencedFeatureCount: interpretationRefs.size,
    providerTraceRecords: providerSourceIds.map((sourceId) =>
      deepFreeze({
        sourceId,
        providerStagePresent: providerSourceIds.includes(sourceId),
        sourceAdapterStagePresent: sourceFeatureIds.includes(sourceId),
        normalizedStagePresent: normalizedSourceIds.includes(sourceId),
        interpretationStagePresent: interpretationRefs.has(sourceId)
      })
    ),
    providerSummaries: Object.entries(providerLayers).map(([key, layer]) =>
      deepFreeze({
        providerKey: key,
        providerName: layer.providerBundle.provider.providerId,
        convertedFeatureCount: countSourceBundleFeatures(layer.sourceDataBundle)
      })
    )
  });
}

function buildIntegrationValidation(
  mockBundle,
  providerLayers,
  combinedSourceDataBundle,
  sourceAdapterLayer,
  interpretationResult,
  provenanceSummary
) {
  const validationSource = {
    mockProviderBundle: mockBundle,
    providerLayers,
    sourceDataBundle: combinedSourceDataBundle,
    sourceAdapterLayer: {
      adapterId: sourceAdapterLayer.adapterId,
      normalizedOutputs: sourceAdapterLayer.normalizedOutputs,
      regionPackage: sourceAdapterLayer.regionPackage
    },
    interpretationResult: {
      interpretationId: interpretationResult.interpretationId,
      classificationResults: interpretationResult.classificationResults,
      selectedEnvironmentProfile: interpretationResult.selectedEnvironmentProfile,
      gameplayWeighting: interpretationResult.gameplayWeighting,
      atlasPresentationRules: interpretationResult.atlasPresentationRules
    },
    provenanceSummary
  };

  return deepFreeze({
    schemaId: "CONTROLLED_PROVIDER_INTEGRATION_VALIDATION_001",
    providerAdapterCompatibility: Object.values(providerLayers).every(
      (layer) => layer.validation.sourceAdapterCompatibility === true
    ),
    sourceAdapterCompatibility:
      sourceAdapterLayer.validationStatus.validationPassed === true,
    interpretationCompatibility:
      interpretationResult.validationState.validationPassed === true,
    provenancePreserved: provenanceSummary.providerTraceRecords.every(
      (record) =>
        record.providerStagePresent &&
        record.sourceAdapterStagePresent &&
        record.normalizedStagePresent
    ),
    noInventedFeatures:
      provenanceSummary.normalizedProvenanceCount <=
      provenanceSummary.sourceBundleFeatureCount,
    deterministicOutputValid: true,
    validationPassed: true,
    deterministicSignatureHash: computeDeterministicSignatureHash(validationSource)
  });
}

function normalizeMockProviderBundle(rawBundle) {
  assertPresent(rawBundle, "Mock provider bundle is required.");
  if (rawBundle.schemaId !== "MOCK_PROVIDER_REGION_BUNDLE_001") {
    throw createValidationError(
      "invalid_mock_provider_bundle_schema",
      "Mock provider bundle schema must be MOCK_PROVIDER_REGION_BUNDLE_001."
    );
  }

  return deepFreeze({
    schemaId: rawBundle.schemaId,
    bundleId: rawBundle.bundleId,
    regionId: rawBundle.regionId,
    description: rawBundle.description,
    providerBundles: deepFreeze({
      mapProviderData: rawBundle.providerBundles.mapProviderData,
      terrainProviderData: rawBundle.providerBundles.terrainProviderData,
      poiProviderData: rawBundle.providerBundles.poiProviderData,
      naturalFeatureData: rawBundle.providerBundles.naturalFeatureData
    })
  });
}

function buildIntegrationValidationSource(integration) {
  return {
    mockProviderBundle: integration.mockProviderBundle,
    providerLayers: integration.providerLayers,
    sourceDataBundle: integration.sourceDataBundle,
    sourceAdapterLayer: {
      adapterId: integration.sourceAdapterLayer.adapterId,
      normalizedOutputs: integration.sourceAdapterLayer.normalizedOutputs,
      regionPackage: integration.sourceAdapterLayer.regionPackage
    },
    interpretationResult: {
      interpretationId: integration.interpretationResult.interpretationId,
      classificationResults: integration.interpretationResult.classificationResults,
      selectedEnvironmentProfile:
        integration.interpretationResult.selectedEnvironmentProfile,
      gameplayWeighting: integration.interpretationResult.gameplayWeighting,
      atlasPresentationRules: integration.interpretationResult.atlasPresentationRules
    },
    provenanceSummary: integration.output.provenanceSummary
  };
}

function allSourceFeatures(sourceDataBundle) {
  return [
    ...sourceDataBundle.geographyFeatures,
    ...sourceDataBundle.roadFeatures,
    ...sourceDataBundle.settlementFeatures,
    ...sourceDataBundle.poiFeatures,
    ...sourceDataBundle.naturalFeatures
  ];
}

function countSourceBundleFeatures(sourceDataBundle) {
  return allSourceFeatures(sourceDataBundle).length;
}

function sortById(items) {
  return [...items].sort((left, right) => left.id.localeCompare(right.id));
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
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function assertPresent(value, message) {
  if (value === null || value === undefined || value === "") {
    throw createValidationError("required_field_missing", message);
  }
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return value;
}
