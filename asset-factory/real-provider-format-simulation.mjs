import {
  createProviderAdapterLayer,
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

const realProviderFormatSimulationSchemaId = "REAL_PROVIDER_FORMAT_SIMULATION_001";
const realProviderSimulationValidationSchemaId =
  "REAL_PROVIDER_SIMULATION_VALIDATION_001";
const providerSourceBundleSchemaId = "PROVIDER_SOURCE_BUNDLE_001";
const sourceDataBundleSchemaId = "SOURCE_DATA_BUNDLE_001";

export const messyProviderExports = deepFreeze({
  MESSY_MAP_PROVIDER_EXPORT_001: createMessyProviderBundle({
    bundleId: "MESSY_MAP_PROVIDER_EXPORT_001",
    providerType: "MAP_PROVIDER",
    providerName: "messy-map-provider",
    providerVersion: "2026.07-a",
    regionId: "messy-provider-region-coastal-001",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.18,
      minLongitude: 144.84,
      maxLongitude: 145.24
    },
    sourceFeatures: deepFreeze([
      {
        id: "messy_road_001",
        sourceType: "road",
        geometryFormat: "polyline",
        points: [
          [144.9, -38.44],
          [145.12, -38.28]
        ],
        properties: {
          tags: { highway: "primary" },
          meta: { access: "public" },
          confidence: 0.93
        }
      },
      {
        id: "messy_trail_001",
        sourceType: "trail",
        geometry: {
          type: "MultiLineString",
          coordinates: [
            [
              [144.96, -38.41],
              [145.08, -38.31]
            ]
          ]
        },
        properties: {
          attributes: { highway: "track" },
          tags: { surface: "gravel" },
          confidence: 0.87
        }
      },
      {
        id: "messy_path_001",
        sourceType: "path",
        geometryFormat: "polyline",
        points: [
          [145.0, -38.37],
          [145.07, -38.32]
        ],
        properties: {
          roadType: "pedestrian",
          meta: { surface: "sand" },
          confidence: 0.82
        }
      },
      {
        id: "messy_boundary_001",
        sourceType: "boundary",
        geometryFormat: "bboxPolygon",
        bbox: {
          minLongitude: 145.0,
          maxLongitude: 145.16,
          minLatitude: -38.4,
          maxLatitude: -38.28
        },
        properties: {
          name: "Messy Coastal Boundary",
          meta: { density: 0.43 },
          confidence: 0.88
        }
      },
      {
        id: "messy_road_unsupported_001",
        sourceType: "road",
        geometryFormat: "polyline",
        points: [
          [145.01, -38.38],
          [145.05, -38.33]
        ],
        properties: {
          tags: { highway: "service_lane" },
          confidence: 0.55
        }
      }
    ])
  }),
  MESSY_TERRAIN_PROVIDER_EXPORT_001: createMessyProviderBundle({
    bundleId: "MESSY_TERRAIN_PROVIDER_EXPORT_001",
    providerType: "TERRAIN_PROVIDER",
    providerName: "messy-terrain-provider",
    providerVersion: "2026.07-b",
    regionId: "messy-provider-region-coastal-001",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.18,
      minLongitude: 144.84,
      maxLongitude: 145.24
    },
    sourceFeatures: deepFreeze([
      {
        id: "messy_elev_001",
        sourceType: "elevation",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [144.92, -38.48],
            [145.18, -38.48],
            [145.18, -38.24],
            [144.92, -38.24],
            [144.92, -38.48]
          ]]
        },
        properties: {
          elev_m: 37,
          elev_max_m: 71,
          confidence: 0.88
        }
      },
      {
        id: "messy_terrain_001",
        sourceType: "terrain",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [144.88, -38.52],
            [145.18, -38.52],
            [145.18, -38.2],
            [144.88, -38.2],
            [144.88, -38.52]
          ]]
        },
        properties: {
          classification: { terrain: "coastal flats" },
          biomeLabel: "temperate_coast",
          confidence: 0.72
        }
      },
      {
        id: "messy_coastline_001",
        sourceType: "landform",
        geometry: {
          type: "LineString",
          coordinates: [
            [144.84, -38.42],
            [145.02, -38.32],
            [145.18, -38.2]
          ]
        },
        properties: {
          landform: { kind: "shoreline" },
          proximityMeters: 420,
          confidence: 0.91
        }
      },
      {
        id: "messy_reserve_001",
        sourceType: "landform",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [145.0, -38.36],
            [145.14, -38.36],
            [145.14, -38.26],
            [145.0, -38.26],
            [145.0, -38.36]
          ]]
        },
        properties: {
          classification: { landform: "protected_reserve" },
          status: { protectedType: "COASTAL_RESERVE" },
          confidence: 0.8
        }
      }
    ])
  }),
  MESSY_POI_PROVIDER_EXPORT_001: createMessyProviderBundle({
    bundleId: "MESSY_POI_PROVIDER_EXPORT_001",
    providerType: "POI_PROVIDER",
    providerName: "messy-poi-provider",
    providerVersion: "2026.07-c",
    regionId: "messy-provider-region-coastal-001",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.18,
      minLongitude: 144.84,
      maxLongitude: 145.24
    },
    sourceFeatures: deepFreeze([
      {
        id: "messy_poi_lookout_001",
        sourceType: "poi",
        geometryFormat: "pointTuple",
        point: [145.1, -38.31],
        properties: {
          classification: { category: "scenic_lookout" },
          name: "Headland Lookout",
          confidence: 0.74
        }
      },
      {
        id: "messy_poi_beach_001",
        sourceType: "poi",
        geometry: {
          type: "Point",
          coordinates: [145.05, -38.3]
        },
        properties: {
          poiCategory: "surf_beach",
          description: "Surf beach",
          confidence: 0.91
        }
      },
      {
        id: "messy_poi_beach_dup_001",
        sourceType: "poi",
        geometryFormat: "pointTuple",
        point: [145.05, -38.3],
        properties: {
          poiCategory: "surf_beach",
          confidence: 0.61
        }
      },
      {
        id: "messy_poi_service_001",
        sourceType: "poi",
        geometry: {
          type: "Point",
          coordinates: [145.06, -38.32]
        },
        properties: {
          tags: { kind: "coffee_shop" },
          confidence: 0.8
        }
      },
      {
        id: "messy_poi_unknown_001",
        sourceType: "poi",
        geometry: {
          type: "Point",
          coordinates: [145.08, -38.28]
        },
        properties: {
          category: "boat_hire",
          confidence: 0.52
        }
      }
    ])
  }),
  MESSY_NATURAL_PROVIDER_EXPORT_001: createMessyProviderBundle({
    bundleId: "MESSY_NATURAL_PROVIDER_EXPORT_001",
    providerType: "NATURAL_PROVIDER",
    providerName: "messy-natural-provider",
    providerVersion: "2026.07-d",
    regionId: "messy-provider-region-coastal-001",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.18,
      minLongitude: 144.84,
      maxLongitude: 145.24
    },
    sourceFeatures: deepFreeze([
      {
        id: "messy_natural_beach_001",
        sourceType: "natural",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [145.02, -38.32],
            [145.14, -38.32],
            [145.14, -38.26],
            [145.02, -38.26],
            [145.02, -38.32]
          ]]
        },
        properties: {
          classification: { natural: "beachfront" },
          access: "public",
          overlapsWith: ["messy_natural_park_001"],
          confidence: 0.88
        }
      },
      {
        id: "messy_natural_park_001",
        sourceType: "natural",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [145.0, -38.38],
            [145.12, -38.38],
            [145.12, -38.3],
            [145.0, -38.3],
            [145.0, -38.38]
          ]]
        },
        properties: {
          featureType: "foreshore_park",
          access: "public",
          boundaryStatus: "INCOMPLETE",
          confidence: 0.77
        }
      },
      {
        id: "messy_natural_reserve_001",
        sourceType: "natural",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [145.08, -38.36],
            [145.18, -38.36],
            [145.18, -38.28],
            [145.08, -38.28],
            [145.08, -38.36]
          ]]
        },
        properties: {
          tags: { natural_kind: "nature_reserve" },
          meta: { access: "controlled" },
          confidence: 0.83
        }
      },
      {
        id: "messy_natural_creek_001",
        sourceType: "natural",
        geometry: {
          type: "LineString",
          coordinates: [
            [145.04, -38.4],
            [145.12, -38.34]
          ]
        },
        properties: {
          featureClass: "creek",
          access: "public",
          confidence: 0.8
        }
      }
    ])
  })
});

export function createRealProviderFormatSimulation() {
  const providerLayers = deepFreeze({
    mapProvider: createProviderAdapterLayer(messyProviderExports.MESSY_MAP_PROVIDER_EXPORT_001),
    terrainProvider: createProviderAdapterLayer(
      messyProviderExports.MESSY_TERRAIN_PROVIDER_EXPORT_001
    ),
    poiProvider: createProviderAdapterLayer(messyProviderExports.MESSY_POI_PROVIDER_EXPORT_001),
    naturalProvider: createProviderAdapterLayer(
      messyProviderExports.MESSY_NATURAL_PROVIDER_EXPORT_001
    )
  });

  const mergedSourceDataBundle = mergeSourceBundles(
    "MESSY_PROVIDER_COMBINED_SOURCE_DATA_001",
    providerLayers
  );
  const sourceAdapterLayer = createSourceAdapterLayer(mergedSourceDataBundle);
  const interpretationInputs = createWorldInterpretationInputsFromRegionPackage(
    sourceAdapterLayer.regionPackage
  );
  const interpretationResult = createWorldInterpretationLayer({
    interpretationSeed: "REAL_PROVIDER_FORMAT_SIMULATION_001",
    sourceDataReferences: interpretationInputs
  });

  const warningSummary = buildWarningSummary(providerLayers);
  const validation = buildSimulationValidation(
    providerLayers,
    mergedSourceDataBundle,
    sourceAdapterLayer,
    interpretationResult,
    warningSummary
  );

  const simulation = deepFreeze({
    schemaId: realProviderFormatSimulationSchemaId,
    simulationId: realProviderFormatSimulationSchemaId,
    providerLayers,
    mergedSourceDataBundle,
    sourceAdapterLayer,
    interpretationInputs,
    interpretationResult,
    warningSummary,
    validation
  });

  const checked = validateRealProviderFormatSimulation(simulation);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return simulation;
}

export function validateRealProviderFormatSimulation(rawSimulation) {
  try {
    const simulation = rawSimulation;
    assertPresent(simulation?.providerLayers, "Provider layers are required.");
    assertPresent(
      simulation?.mergedSourceDataBundle,
      "Merged source data bundle is required."
    );
    assertPresent(simulation?.sourceAdapterLayer, "Source adapter layer is required.");
    assertPresent(
      simulation?.interpretationResult,
      "Interpretation result is required."
    );
    assertPresent(simulation?.validation, "Simulation validation is required.");

    for (const layer of Object.values(simulation.providerLayers)) {
      const providerValidation = validateProviderAdapterLayer(layer);
      if (!providerValidation.ok) {
        throw createValidationError("provider_layer_invalid", providerValidation.message);
      }
    }

    const sourceValidation = validateSourceAdapterLayer(simulation.sourceAdapterLayer);
    if (!sourceValidation.ok) {
      throw createValidationError("source_layer_invalid", sourceValidation.message);
    }

    const interpretationValidation = validateWorldInterpretationLayer(
      simulation.interpretationResult
    );
    if (!interpretationValidation.ok) {
      throw createValidationError(
        "interpretation_invalid",
        interpretationValidation.message
      );
    }

    for (const key of [
      "messyDataAcceptedSafely",
      "invalidDataIdentified",
      "fieldsMappedCorrectly",
      "confidenceRecorded",
      "sourceIdsPreserved",
      "providerMetadataPreserved",
      "normalizedOutputCompatible",
      "classificationDeterministic",
      "validationPassed"
    ]) {
      if (simulation.validation[key] !== true) {
        throw createValidationError(
          "simulation_validation_invalid",
          `Simulation validation flag ${key} must be true.`
        );
      }
    }

    const signature = computeDeterministicSignatureHash(
      buildSimulationValidationSource(simulation)
    );
    if (signature !== simulation.validation.deterministicSignatureHash) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "Real provider format simulation deterministic signature hash does not match."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      simulation
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "real_provider_format_simulation_failed",
      message: error.message,
      simulation: null
    });
  }
}

function buildWarningSummary(providerLayers) {
  const warnings = Object.entries(providerLayers).flatMap(([providerKey, layer]) =>
    layer.conversionWarnings.map((warning) =>
      deepFreeze({
        providerKey,
        ...warning
      })
    )
  );

  return deepFreeze({
    warningCount: warnings.length,
    warningCodes: deepFreeze([...new Set(warnings.map((warning) => warning.code))].sort()),
    warnings
  });
}

function buildSimulationValidation(
  providerLayers,
  mergedSourceDataBundle,
  sourceAdapterLayer,
  interpretationResult,
  warningSummary
) {
  const validationSource = {
    providerLayers,
    mergedSourceDataBundle,
    sourceAdapterLayer: {
      adapterId: sourceAdapterLayer.adapterId,
      normalizedOutputs: sourceAdapterLayer.normalizedOutputs,
      regionPackage: sourceAdapterLayer.regionPackage
    },
    interpretationResult: {
      classificationResults: interpretationResult.classificationResults,
      selectedEnvironmentProfile: interpretationResult.selectedEnvironmentProfile,
      gameplayWeighting: interpretationResult.gameplayWeighting,
      atlasPresentationRules: interpretationResult.atlasPresentationRules
    },
    warningSummary
  };

  return deepFreeze({
    schemaId: realProviderSimulationValidationSchemaId,
    messyDataAcceptedSafely: true,
    invalidDataIdentified:
      warningSummary.warningCodes.includes("UNSUPPORTED_MAP_FEATURE") &&
      warningSummary.warningCodes.includes("UNSUPPORTED_POI_FEATURE"),
    fieldsMappedCorrectly: mergedSourceDataBundle.roadFeatures.length > 0 &&
      mergedSourceDataBundle.geographyFeatures.length > 0 &&
      mergedSourceDataBundle.poiFeatures.length > 0 &&
      mergedSourceDataBundle.naturalFeatures.length > 0,
    confidenceRecorded: allSourceFeatures(mergedSourceDataBundle).every((feature) =>
      feature.properties?.mappingConfidence !== undefined ||
      feature.properties?.providerProvenance !== undefined
    ),
    sourceIdsPreserved: allSourceFeatures(mergedSourceDataBundle).every((feature) =>
      typeof feature.properties?.providerProvenance?.providerId === "string"
    ),
    providerMetadataPreserved: allSourceFeatures(mergedSourceDataBundle).every((feature) =>
      typeof feature.properties?.providerProvenance?.provider === "string"
    ),
    normalizedOutputCompatible: sourceAdapterLayer.validationStatus.validationPassed === true,
    classificationDeterministic:
      interpretationResult.classificationResults.primaryWorldType === "COASTAL" &&
      interpretationResult.selectedEnvironmentProfile.profileId ===
        "AUSTRALIAN_COASTAL_WORLD",
    warningCount: warningSummary.warningCount,
    validationPassed: true,
    deterministicSignatureHash: computeDeterministicSignatureHash(validationSource)
  });
}

function mergeSourceBundles(bundleId, providerLayers) {
  const bundles = Object.values(providerLayers).map((layer) => layer.sourceDataBundle);
  const first = bundles[0];
  return deepFreeze({
    schemaId: sourceDataBundleSchemaId,
    bundleId,
    provider: deepFreeze({
      providerId: "messy-provider-composite",
      providerType: "COMPOSITE_PROVIDER",
      version: "1.0"
    }),
    importVersion: "IMPORT_VERSION_001",
    geographicArea: structuredClone(first.geographicArea),
    sourceTimestamps: deepFreeze({
      capturedAt: bundles.map((bundle) => bundle.sourceTimestamps.capturedAt).sort()[0],
      importedAt: bundles.map((bundle) => bundle.sourceTimestamps.importedAt).sort()[0]
    }),
    geographyFeatures: deepFreeze(sortById(bundles.flatMap((bundle) => bundle.geographyFeatures))),
    roadFeatures: deepFreeze(sortById(bundles.flatMap((bundle) => bundle.roadFeatures))),
    settlementFeatures: deepFreeze(
      sortById(bundles.flatMap((bundle) => bundle.settlementFeatures))
    ),
    poiFeatures: deepFreeze(sortById(bundles.flatMap((bundle) => bundle.poiFeatures))),
    naturalFeatures: deepFreeze(sortById(bundles.flatMap((bundle) => bundle.naturalFeatures)))
  });
}

function buildSimulationValidationSource(simulation) {
  return {
    providerLayers: simulation.providerLayers,
    mergedSourceDataBundle: simulation.mergedSourceDataBundle,
    sourceAdapterLayer: {
      adapterId: simulation.sourceAdapterLayer.adapterId,
      normalizedOutputs: simulation.sourceAdapterLayer.normalizedOutputs,
      regionPackage: simulation.sourceAdapterLayer.regionPackage
    },
    interpretationResult: {
      classificationResults: simulation.interpretationResult.classificationResults,
      selectedEnvironmentProfile:
        simulation.interpretationResult.selectedEnvironmentProfile,
      gameplayWeighting: simulation.interpretationResult.gameplayWeighting,
      atlasPresentationRules: simulation.interpretationResult.atlasPresentationRules
    },
    warningSummary: simulation.warningSummary
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

function createMessyProviderBundle({
  bundleId,
  providerType,
  providerName,
  providerVersion,
  regionId,
  boundary,
  sourceFeatures
}) {
  return deepFreeze({
    schemaId: providerSourceBundleSchemaId,
    bundleId,
    providerType,
    provider: deepFreeze({
      providerId: providerName,
      version: providerVersion
    }),
    supportedDataTypes: supportedTypesForProvider(providerType),
    geographicArea: deepFreeze({
      regionId,
      boundary: deepFreeze(boundary)
    }),
    sourceTimestamps: deepFreeze({
      capturedAt: "2026-07-27T00:00:00Z",
      importedAt: "2026-07-27T00:00:00Z"
    }),
    sourceFeatures: deepFreeze(sourceFeatures)
  });
}

function supportedTypesForProvider(providerType) {
  if (providerType === "MAP_PROVIDER") {
    return deepFreeze(["roads", "trails", "paths", "boundaries"]);
  }
  if (providerType === "TERRAIN_PROVIDER") {
    return deepFreeze(["elevation", "terrain", "landform"]);
  }
  if (providerType === "POI_PROVIDER") {
    return deepFreeze(["landmarks", "attractions", "services"]);
  }
  return deepFreeze(["beaches", "parks", "reserves", "waterways"]);
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
