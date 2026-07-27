const sourceDataBundleSchemaId = "SOURCE_DATA_BUNDLE_001";
const sourceAdapterSchemaId = "SOURCE_ADAPTER_LAYER_001";
const sourceAdapterValidationSchemaId = "SOURCE_ADAPTER_VALIDATION_001";
const mapSourceSchemaId = "MAP_DATA_SOURCE_001";
const terrainSourceSchemaId = "TERRAIN_DATA_SOURCE_001";
const poiSourceSchemaId = "POI_DATA_SOURCE_001";
const naturalSourceSchemaId = "NATURAL_DATA_SOURCE_001";
const normalizedGeographySchemaId = "NORMALIZED_GEOGRAPHY_DATA_001";
const normalizedRoadSchemaId = "NORMALIZED_ROAD_DATA_001";
const normalizedSettlementSchemaId = "NORMALIZED_SETTLEMENT_DATA_001";
const normalizedPoiSchemaId = "NORMALIZED_POI_DATA_001";
const normalizedNaturalFeatureSchemaId = "NORMALIZED_NATURAL_FEATURE_DATA_001";
const provenanceRecordSchemaId = "PROVENANCE_RECORD_001";
const growgoRegionPackageSchemaId = "GROWGO_REGION_PACKAGE_001";

const normalizationVersion = "1";
const importVersion = "IMPORT_VERSION_001";

const supportedGeometryTypes = new Set(["Point", "LineString", "Polygon"]);
const supportedRoadTypes = new Set(["ROAD", "TRAIL", "PATH", "TRANSPORT_ROUTE"]);
const supportedSettlementTypes = new Set(["CITY", "TOWN", "SUBURB", "VILLAGE"]);
const supportedPoiTypes = new Set(["LANDMARK", "ATTRACTION", "SERVICE", "CULTURAL"]);
const supportedNaturalTypes = new Set([
  "BEACH",
  "FOREST",
  "PARK",
  "RESERVE",
  "WATERWAY"
]);
const supportedGeographyTypes = new Set([
  "COASTLINE",
  "RIVER",
  "TERRAIN",
  "ELEVATION",
  "BIOME",
  "PROTECTED_AREA"
]);

export const fixtureSourceBundles = deepFreeze({
  COASTAL_SOURCE_BUNDLE_001: createFixtureBundle({
    bundleId: "COASTAL_SOURCE_BUNDLE_001",
    regionId: "fixture-coastal-region",
    providerName: "fixture-provider",
    providerVersion: "1.0",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.14,
      minLongitude: 144.82,
      maxLongitude: 145.38
    },
    geographyFeatures: [
      createFeature("geo_coast_001", "COASTLINE", "LineString", [
        [144.82, -38.42],
        [145.02, -38.3],
        [145.28, -38.18]
      ], { distanceMeters: 300 }),
      createFeature("geo_river_001", "RIVER", "LineString", [
        [145.08, -38.42],
        [145.16, -38.36]
      ], {}),
      createFeature("geo_terrain_001", "TERRAIN", "Polygon", [
        [
          [144.88, -38.52],
          [145.3, -38.52],
          [145.3, -38.18],
          [144.88, -38.18],
          [144.88, -38.52]
        ]
      ], { terrainType: "COASTAL_PLAIN" }),
      createFeature("geo_elevation_001", "ELEVATION", "Polygon", [
        [
          [144.92, -38.48],
          [145.22, -38.48],
          [145.22, -38.22],
          [144.92, -38.22],
          [144.92, -38.48]
        ]
      ], { averageMeters: 35, maxMeters: 72 }),
      createFeature("geo_biome_001", "BIOME", "Polygon", [
        [
          [144.9, -38.5],
          [145.26, -38.5],
          [145.26, -38.2],
          [144.9, -38.2],
          [144.9, -38.5]
        ]
      ], { biomeType: "TEMPERATE_COASTAL" }),
      createFeature("geo_protected_001", "PROTECTED_AREA", "Polygon", [
        [
          [145.0, -38.38],
          [145.18, -38.38],
          [145.18, -38.26],
          [145.0, -38.26],
          [145.0, -38.38]
        ]
      ], { protectedAreaType: "COASTAL_RESERVE" })
    ],
    roadFeatures: [
      createFeature("road_coast_001", "ROAD", "LineString", [
        [144.9, -38.44],
        [145.22, -38.24]
      ], { roadClass: "PRIMARY_COASTAL" }),
      createFeature("road_coast_002", "ROAD", "LineString", [
        [145.02, -38.46],
        [145.08, -38.32]
      ], { roadClass: "LOCAL" }),
      createFeature("trail_coast_001", "TRAIL", "LineString", [
        [144.94, -38.4],
        [145.14, -38.28]
      ], { trailType: "FORESHORE_WALK" }),
      createFeature("path_coast_001", "PATH", "LineString", [
        [145.08, -38.34],
        [145.12, -38.3]
      ], { pathType: "BEACH_ACCESS" }),
      createFeature("transport_coast_001", "TRANSPORT_ROUTE", "LineString", [
        [144.9, -38.45],
        [145.24, -38.22]
      ], { routeType: "SCENIC_COASTAL" })
    ],
    settlementFeatures: [
      createFeature("settle_coast_001", "TOWN", "Polygon", [
        [
          [145.02, -38.42],
          [145.18, -38.42],
          [145.18, -38.28],
          [145.02, -38.28],
          [145.02, -38.42]
        ]
      ], { name: "Coastal Town", density: 0.46 }),
      createFeature("settle_coast_002", "SUBURB", "Polygon", [
        [
          [145.06, -38.4],
          [145.16, -38.4],
          [145.16, -38.3],
          [145.06, -38.3],
          [145.06, -38.4]
        ]
      ], { name: "Foreshore", density: 0.44 })
    ],
    poiFeatures: [
      createFeature("poi_coast_001", "LANDMARK", "Point", [145.12, -38.31], {
        poiType: "LIGHTHOUSE"
      }),
      createFeature("poi_coast_002", "ATTRACTION", "Point", [145.1, -38.29], {
        poiType: "BEACH"
      }),
      createFeature("poi_coast_003", "SERVICE", "Point", [145.09, -38.32], {
        poiType: "CAFE"
      }),
      createFeature("poi_coast_004", "CULTURAL", "Point", [145.14, -38.33], {
        poiType: "HISTORIC_SITE"
      })
    ],
    naturalFeatures: [
      createFeature("nat_coast_001", "BEACH", "Polygon", [
        [
          [145.02, -38.32],
          [145.14, -38.32],
          [145.14, -38.26],
          [145.02, -38.26],
          [145.02, -38.32]
        ]
      ], { featureType: "SURF_BEACH", accessibility: "PUBLIC" }),
      createFeature("nat_coast_002", "PARK", "Polygon", [
        [
          [145.02, -38.38],
          [145.16, -38.38],
          [145.16, -38.32],
          [145.02, -38.32],
          [145.02, -38.38]
        ]
      ], { featureType: "FORESHORE_PARK", accessibility: "PUBLIC" }),
      createFeature("nat_coast_003", "RESERVE", "Polygon", [
        [
          [145.08, -38.36],
          [145.2, -38.36],
          [145.2, -38.28],
          [145.08, -38.28],
          [145.08, -38.36]
        ]
      ], { featureType: "NATURE_RESERVE", accessibility: "CONTROLLED" }),
      createFeature("nat_coast_004", "WATERWAY", "LineString", [
        [145.04, -38.41],
        [145.12, -38.35]
      ], { featureType: "ESTUARY", accessibility: "PUBLIC" })
    ]
  }),
  RURAL_SOURCE_BUNDLE_001: createFixtureBundle({
    bundleId: "RURAL_SOURCE_BUNDLE_001",
    regionId: "fixture-rural-region",
    providerName: "fixture-provider",
    providerVersion: "1.0",
    boundary: {
      minLatitude: -35.82,
      maxLatitude: -35.12,
      minLongitude: 146.08,
      maxLongitude: 146.94
    },
    geographyFeatures: [
      createFeature("geo_rural_river_001", "RIVER", "LineString", [
        [146.18, -35.72],
        [146.52, -35.28]
      ], {}),
      createFeature("geo_rural_terrain_001", "TERRAIN", "Polygon", [
        [
          [146.14, -35.78],
          [146.86, -35.78],
          [146.86, -35.18],
          [146.14, -35.18],
          [146.14, -35.78]
        ]
      ], { terrainType: "FARMLAND" }),
      createFeature("geo_rural_elev_001", "ELEVATION", "Polygon", [
        [
          [146.2, -35.7],
          [146.74, -35.7],
          [146.74, -35.24],
          [146.2, -35.24],
          [146.2, -35.7]
        ]
      ], { averageMeters: 120, maxMeters: 180 }),
      createFeature("geo_rural_biome_001", "BIOME", "Polygon", [
        [
          [146.18, -35.74],
          [146.8, -35.74],
          [146.8, -35.2],
          [146.18, -35.2],
          [146.18, -35.74]
        ]
      ], { biomeType: "TEMPERATE_FARMLAND" }),
      createFeature("geo_rural_protected_001", "PROTECTED_AREA", "Polygon", [
        [
          [146.48, -35.56],
          [146.64, -35.56],
          [146.64, -35.4],
          [146.48, -35.4],
          [146.48, -35.56]
        ]
      ], { protectedAreaType: "RIVER_RESERVE" })
    ],
    roadFeatures: [
      createFeature("road_rural_001", "ROAD", "LineString", [
        [146.14, -35.72],
        [146.84, -35.3]
      ], { roadClass: "RURAL_HIGHWAY" }),
      createFeature("road_rural_002", "ROAD", "LineString", [
        [146.36, -35.66],
        [146.42, -35.42]
      ], { roadClass: "LOCAL" }),
      createFeature("transport_rural_001", "TRANSPORT_ROUTE", "LineString", [
        [146.12, -35.7],
        [146.8, -35.32]
      ], { routeType: "RURAL_CONNECTOR" })
    ],
    settlementFeatures: [
      createFeature("settle_rural_001", "TOWN", "Polygon", [
        [
          [146.38, -35.6],
          [146.5, -35.6],
          [146.5, -35.48],
          [146.38, -35.48],
          [146.38, -35.6]
        ]
      ], { name: "Farm Service Town", density: 0.2 }),
      createFeature("settle_rural_002", "VILLAGE", "Polygon", [
        [
          [146.58, -35.5],
          [146.66, -35.5],
          [146.66, -35.44],
          [146.58, -35.44],
          [146.58, -35.5]
        ]
      ], { name: "Creek Village", density: 0.14 })
    ],
    poiFeatures: [
      createFeature("poi_rural_001", "LANDMARK", "Point", [146.52, -35.46], {
        poiType: "SILO_LOOKOUT"
      }),
      createFeature("poi_rural_002", "SERVICE", "Point", [146.44, -35.52], {
        poiType: "GENERAL_STORE"
      })
    ],
    naturalFeatures: [
      createFeature("nat_rural_001", "RESERVE", "Polygon", [
        [
          [146.46, -35.58],
          [146.64, -35.58],
          [146.64, -35.42],
          [146.46, -35.42],
          [146.46, -35.58]
        ]
      ], { featureType: "RIVER_RESERVE", accessibility: "PUBLIC" }),
      createFeature("nat_rural_002", "WATERWAY", "LineString", [
        [146.24, -35.68],
        [146.62, -35.34]
      ], { featureType: "RIVER_BEND", accessibility: "PUBLIC" })
    ]
  }),
  URBAN_SOURCE_BUNDLE_001: createFixtureBundle({
    bundleId: "URBAN_SOURCE_BUNDLE_001",
    regionId: "fixture-urban-region",
    providerName: "fixture-provider",
    providerVersion: "1.0",
    boundary: {
      minLatitude: -37.98,
      maxLatitude: -37.62,
      minLongitude: 144.82,
      maxLongitude: 145.28
    },
    geographyFeatures: [
      createFeature("geo_urban_terrain_001", "TERRAIN", "Polygon", [
        [
          [144.86, -37.94],
          [145.24, -37.94],
          [145.24, -37.66],
          [144.86, -37.66],
          [144.86, -37.94]
        ]
      ], { terrainType: "URBAN_PLAIN" }),
      createFeature("geo_urban_elev_001", "ELEVATION", "Polygon", [
        [
          [144.9, -37.9],
          [145.18, -37.9],
          [145.18, -37.7],
          [144.9, -37.7],
          [144.9, -37.9]
        ]
      ], { averageMeters: 52, maxMeters: 95 }),
      createFeature("geo_urban_biome_001", "BIOME", "Polygon", [
        [
          [144.88, -37.92],
          [145.22, -37.92],
          [145.22, -37.68],
          [144.88, -37.68],
          [144.88, -37.92]
        ]
      ], { biomeType: "TEMPERATE_URBAN_EDGE" }),
      createFeature("geo_urban_protected_001", "PROTECTED_AREA", "Polygon", [
        [
          [145.02, -37.86],
          [145.1, -37.86],
          [145.1, -37.78],
          [145.02, -37.78],
          [145.02, -37.86]
        ]
      ], { protectedAreaType: "CITY_PARK" })
    ],
    roadFeatures: [
      createFeature("road_urban_001", "ROAD", "LineString", [
        [144.9, -37.9],
        [145.22, -37.7]
      ], { roadClass: "ARTERIAL" }),
      createFeature("road_urban_002", "ROAD", "LineString", [
        [144.96, -37.88],
        [145.16, -37.72]
      ], { roadClass: "COLLECTOR" }),
      createFeature("path_urban_001", "PATH", "LineString", [
        [145.0, -37.84],
        [145.08, -37.78]
      ], { pathType: "CITY_WALK" }),
      createFeature("transport_urban_001", "TRANSPORT_ROUTE", "LineString", [
        [144.92, -37.9],
        [145.2, -37.72]
      ], { routeType: "RAIL" }),
      createFeature("transport_urban_002", "TRANSPORT_ROUTE", "LineString", [
        [144.94, -37.88],
        [145.16, -37.74]
      ], { routeType: "BUS_CORRIDOR" })
    ],
    settlementFeatures: [
      createFeature("settle_urban_001", "CITY", "Polygon", [
        [
          [144.96, -37.88],
          [145.18, -37.88],
          [145.18, -37.7],
          [144.96, -37.7],
          [144.96, -37.88]
        ]
      ], { name: "Metro", density: 0.9 }),
      createFeature("settle_urban_002", "SUBURB", "Polygon", [
        [
          [144.98, -37.88],
          [145.08, -37.88],
          [145.08, -37.78],
          [144.98, -37.78],
          [144.98, -37.88]
        ]
      ], { name: "Inner", density: 0.88 }),
      createFeature("settle_urban_003", "SUBURB", "Polygon", [
        [
          [145.08, -37.84],
          [145.18, -37.84],
          [145.18, -37.72],
          [145.08, -37.72],
          [145.08, -37.84]
        ]
      ], { name: "Outer", density: 0.86 })
    ],
    poiFeatures: [
      createFeature("poi_urban_001", "LANDMARK", "Point", [145.06, -37.8], {
        poiType: "TOWER"
      }),
      createFeature("poi_urban_002", "ATTRACTION", "Point", [145.08, -37.81], {
        poiType: "GALLERY"
      }),
      createFeature("poi_urban_003", "SERVICE", "Point", [145.03, -37.79], {
        poiType: "STATION"
      }),
      createFeature("poi_urban_004", "SERVICE", "Point", [145.12, -37.78], {
        poiType: "SHOPPING"
      }),
      createFeature("poi_urban_005", "CULTURAL", "Point", [145.09, -37.8], {
        poiType: "THEATRE"
      })
    ],
    naturalFeatures: [
      createFeature("nat_urban_001", "PARK", "Polygon", [
        [
          [145.0, -37.86],
          [145.12, -37.86],
          [145.12, -37.76],
          [145.0, -37.76],
          [145.0, -37.86]
        ]
      ], { featureType: "CITY_PARK", accessibility: "PUBLIC" })
    ]
  })
});

export function createSourceAdapterLayer(rawBundle) {
  const bundle = normalizeSourceDataBundle(rawBundle);
  const normalizedOutputs = normalizeSourceDataBundleOutputs(bundle);
  const interpretationInputs = createWorldInterpretationInputsFromNormalizedOutputs(
    bundle,
    normalizedOutputs
  );
  const baseRegionPackage = deepFreeze({
    schemaId: growgoRegionPackageSchemaId,
    packageId: `${bundle.bundleId}_REGION_PACKAGE`,
    geographicArea: bundle.geographicArea,
    normalizedGeographyRef: normalizedOutputs.normalizedGeographyData,
    normalizedRoadDataRef: normalizedOutputs.normalizedRoadData,
    normalizedSettlementDataRef: normalizedOutputs.normalizedSettlementData,
    normalizedPoiDataRef: normalizedOutputs.normalizedPoiData,
    normalizedNaturalFeatureDataRef: normalizedOutputs.normalizedNaturalFeatureData,
    interpretationMetadata: deepFreeze({
      compatibleWorldInterpretationLayer: "WORLD_INTERPRETATION_LAYER_001",
      interpretationInputs,
      sourceBundleId: bundle.bundleId
    }),
    cacheMetadata: deepFreeze({
      cacheKey: `${bundle.bundleId}:${bundle.provider.version}:${normalizationVersion}`,
      cacheScope: "REGION",
      deterministic: true
    }),
    packageValidation: null
  });

  const adapterId = createDeterministicId("SOURCE_ADAPTER", bundle);
  const adapterBase = deepFreeze({
    schemaId: sourceAdapterSchemaId,
    adapterId,
    provider: deepFreeze({
      providerId: bundle.provider.providerId,
      providerType: bundle.provider.providerType
    }),
    providerVersion: deepFreeze({
      version: bundle.provider.version
    }),
    importVersion,
    geographicArea: bundle.geographicArea,
    sourceTimestamps: bundle.sourceTimestamps,
    sourceReferences: bundle.sourceReferences,
    normalizedOutputs,
    normalizationStatus: deepFreeze({
      status: "COMPLETE",
      normalizedFeatureCounts: countNormalizedFeatures(normalizedOutputs),
      unsupportedFeatureCounts: buildUnsupportedCounts(bundle),
      droppedFeatureCounts: deepFreeze({
        geography: 0,
        roads: 0,
        settlements: 0,
        pois: 0,
        naturalFeatures: 0
      }),
      normalizationRuleVersion: normalizationVersion
    }),
    validationStatus: null,
    regionPackage: baseRegionPackage
  });

  const validationStatus = buildSourceAdapterValidation(adapterBase);
  const regionPackage = deepFreeze({
    ...baseRegionPackage,
    packageValidation: validationStatus
  });

  const adapter = deepFreeze({
    ...adapterBase,
    validationStatus,
    regionPackage
  });

  const validation = validateSourceAdapterLayer(adapter);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return adapter;
}

export function validateSourceAdapterLayer(rawAdapterLayer) {
  try {
    const adapterLayer = normalizeCreatedAdapterLayer(rawAdapterLayer);

    for (const field of [
      "adapterId",
      "provider",
      "providerVersion",
      "importVersion",
      "geographicArea",
      "sourceTimestamps",
      "sourceReferences",
      "normalizedOutputs",
      "normalizationStatus",
      "validationStatus",
      "regionPackage"
    ]) {
      assertPresent(adapterLayer[field], `Adapter layer missing required field ${field}.`);
    }

    validateGeographicArea(adapterLayer.geographicArea);
    validateNormalizedOutputs(adapterLayer.normalizedOutputs);
    validateRegionPackage(adapterLayer.regionPackage);

    const flags = [
      "requiredMetadataExists",
      "coordinatesValid",
      "geometryValid",
      "provenancePreserved",
      "unsupportedTypesHandled",
      "duplicateDetectionValid",
      "deterministicOutputValid",
      "interpretationCompatibilityValid",
      "validationPassed"
    ];

    for (const flag of flags) {
      if (adapterLayer.validationStatus[flag] !== true) {
        throw createValidationError(
          "validation_flag_invalid",
          `Adapter validation flag ${flag} must be true.`
        );
      }
    }

    const deterministicSignatureHash = computeDeterministicSignatureHash(
      buildDeterministicSignatureSource(adapterLayer)
    );

    if (
      deterministicSignatureHash !== adapterLayer.validationStatus.deterministicSignatureHash
    ) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "Source adapter deterministic signature hash does not match the generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      sourceAdapterLayer: adapterLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "source_adapter_validation_failed",
      message: error.message,
      sourceAdapterLayer: null
    });
  }
}

export function createGrowgoRegionPackage(rawBundle) {
  return createSourceAdapterLayer(rawBundle).regionPackage;
}

export function createWorldInterpretationInputsFromRegionPackage(rawRegionPackage) {
  const regionPackage = normalizeRegionPackage(rawRegionPackage);
  return deepFreeze(structuredClone(regionPackage.interpretationMetadata.interpretationInputs));
}

export const sourceAdapterDefinition = deepFreeze({
  schemaId: sourceAdapterSchemaId,
  supportedInputSchemaId: sourceDataBundleSchemaId,
  supportedOutputSchemaId: growgoRegionPackageSchemaId,
  supportedValidationSchemaId: sourceAdapterValidationSchemaId,
  fixtureBundles: fixtureSourceBundles
});

function normalizeSourceDataBundle(rawBundle) {
  assertPresent(rawBundle, "Source data bundle is required.");

  const bundle = {
    schemaId: rawBundle.schemaId ?? sourceDataBundleSchemaId,
    bundleId: rawBundle.bundleId,
    provider: normalizeProvider(rawBundle.provider),
    importVersion: rawBundle.importVersion ?? importVersion,
    geographicArea: normalizeGeographicArea(rawBundle.geographicArea),
    sourceTimestamps: deepFreeze({
      capturedAt: rawBundle.sourceTimestamps?.capturedAt ?? "2026-07-27T00:00:00Z",
      importedAt: rawBundle.sourceTimestamps?.importedAt ?? "2026-07-27T00:00:00Z"
    }),
    geographyFeatures: normalizeFeatureCollection(rawBundle.geographyFeatures, supportedGeographyTypes),
    roadFeatures: normalizeFeatureCollection(rawBundle.roadFeatures, supportedRoadTypes),
    settlementFeatures: normalizeFeatureCollection(
      rawBundle.settlementFeatures,
      supportedSettlementTypes
    ),
    poiFeatures: normalizeFeatureCollection(rawBundle.poiFeatures, supportedPoiTypes),
    naturalFeatures: normalizeFeatureCollection(rawBundle.naturalFeatures, supportedNaturalTypes)
  };

  if (bundle.schemaId !== sourceDataBundleSchemaId) {
    throw createValidationError(
      "invalid_source_bundle_schema",
      `Source data bundle schema must be ${sourceDataBundleSchemaId}.`
    );
  }

  bundle.sourceReferences = deepFreeze(
    [
      {
        schemaId: terrainSourceSchemaId,
        sourceId: `${bundle.bundleId}_TERRAIN_SOURCE`,
        provider: bundle.provider.providerId,
        providerVersion: bundle.provider.version,
        featureSetVersion: bundle.importVersion,
        geographicArea: bundle.geographicArea,
        featureCount: bundle.geographyFeatures.length
      },
      {
        schemaId: mapSourceSchemaId,
        sourceId: `${bundle.bundleId}_MAP_SOURCE`,
        provider: bundle.provider.providerId,
        providerVersion: bundle.provider.version,
        featureSetVersion: bundle.importVersion,
        geographicArea: bundle.geographicArea,
        featureCount: bundle.roadFeatures.length + bundle.settlementFeatures.length
      },
      {
        schemaId: poiSourceSchemaId,
        sourceId: `${bundle.bundleId}_POI_SOURCE`,
        provider: bundle.provider.providerId,
        providerVersion: bundle.provider.version,
        featureSetVersion: bundle.importVersion,
        geographicArea: bundle.geographicArea,
        featureCount: bundle.poiFeatures.length
      },
      {
        schemaId: naturalSourceSchemaId,
        sourceId: `${bundle.bundleId}_NATURAL_SOURCE`,
        provider: bundle.provider.providerId,
        providerVersion: bundle.provider.version,
        featureSetVersion: bundle.importVersion,
        geographicArea: bundle.geographicArea,
        featureCount: bundle.naturalFeatures.length
      }
    ].map(deepFreeze)
  );

  return deepFreeze(bundle);
}

function normalizeSourceDataBundleOutputs(bundle) {
  const unsupportedFeatures = collectUnsupportedFeatures(bundle);
  const duplicateFeatureIds = findDuplicateFeatureIds(bundle);

  if (duplicateFeatureIds.length > 0) {
    throw createValidationError(
      "duplicate_feature_ids_detected",
      `Duplicate feature identifiers detected: ${duplicateFeatureIds.join(", ")}`
    );
  }

  if (unsupportedFeatures.length > 0) {
    throw createValidationError(
      "unsupported_features_detected",
      `Unsupported features detected: ${unsupportedFeatures.map((feature) => feature.id).join(", ")}`
    );
  }

  const normalizedGeographyData = deepFreeze({
    schemaId: normalizedGeographySchemaId,
    normalizedId: `${bundle.bundleId}_GEOGRAPHY`,
    boundary: bundle.geographicArea.boundary,
    coastlineFeatures: toNormalizedGeographyFeatures(bundle, "COASTLINE"),
    riverFeatures: toNormalizedGeographyFeatures(bundle, "RIVER"),
    terrainBands: toNormalizedGeographyFeatures(bundle, "TERRAIN"),
    elevationBands: toNormalizedGeographyFeatures(bundle, "ELEVATION"),
    biomeClassification: toNormalizedGeographyFeatures(bundle, "BIOME"),
    protectedAreaFeatures: toNormalizedGeographyFeatures(bundle, "PROTECTED_AREA"),
    provenance: extractProvenance(bundle.provider, bundle.geographyFeatures)
  });

  const normalizedRoadData = deepFreeze({
    schemaId: normalizedRoadSchemaId,
    normalizedId: `${bundle.bundleId}_ROADS`,
    roadSegments: toNormalizedRoadFeatures(bundle, "ROAD"),
    trailSegments: toNormalizedRoadFeatures(bundle, "TRAIL"),
    pathSegments: toNormalizedRoadFeatures(bundle, "PATH"),
    transportRoutes: toNormalizedRoadFeatures(bundle, "TRANSPORT_ROUTE"),
    networkHierarchy: buildRoadHierarchy(bundle.roadFeatures),
    accessibilityRules: deepFreeze({
      publicRoadAccess: true,
      publicTrailAccess: true,
      controlledTransportAccess: bundle.roadFeatures.some(
        (feature) => feature.type === "TRANSPORT_ROUTE"
      )
    }),
    provenance: extractProvenance(bundle.provider, bundle.roadFeatures)
  });

  const settlementDensity = roundToTwoDecimals(
    average(
      bundle.settlementFeatures.map((feature) => Number(feature.properties.density ?? 0))
    )
  );

  const normalizedSettlementData = deepFreeze({
    schemaId: normalizedSettlementSchemaId,
    normalizedId: `${bundle.bundleId}_SETTLEMENTS`,
    cityRecords: toNormalizedSettlementFeatures(bundle, "CITY"),
    townRecords: toNormalizedSettlementFeatures(bundle, "TOWN"),
    suburbRecords: toNormalizedSettlementFeatures(bundle, "SUBURB"),
    villageRecords: toNormalizedSettlementFeatures(bundle, "VILLAGE"),
    settlementDensity,
    settlementBoundaries: bundle.settlementFeatures.map((feature) =>
      deepFreeze({
        sourceId: feature.id,
        type: feature.type,
        boundary: feature.geometry.coordinates
      })
    ),
    provenance: extractProvenance(bundle.provider, bundle.settlementFeatures)
  });

  const normalizedPoiData = deepFreeze({
    schemaId: normalizedPoiSchemaId,
    normalizedId: `${bundle.bundleId}_POIS`,
    landmarkRecords: toNormalizedPoiFeatures(bundle, "LANDMARK"),
    attractionRecords: toNormalizedPoiFeatures(bundle, "ATTRACTION"),
    serviceRecords: toNormalizedPoiFeatures(bundle, "SERVICE"),
    culturalLocationRecords: toNormalizedPoiFeatures(bundle, "CULTURAL"),
    categoryMapping: deepFreeze({
      LANDMARK: "LANDMARK",
      ATTRACTION: "ATTRACTION",
      SERVICE: "SERVICE",
      CULTURAL: "CULTURAL"
    }),
    confidenceHints: deepFreeze({
      categoryConfidence: 1,
      sourceCompleteness: 1
    }),
    provenance: extractProvenance(bundle.provider, bundle.poiFeatures)
  });

  const normalizedNaturalFeatureData = deepFreeze({
    schemaId: normalizedNaturalFeatureSchemaId,
    normalizedId: `${bundle.bundleId}_NATURAL`,
    beachFeatures: toNormalizedNaturalFeatures(bundle, "BEACH"),
    forestFeatures: toNormalizedNaturalFeatures(bundle, "FOREST"),
    parkFeatures: toNormalizedNaturalFeatures(bundle, "PARK"),
    reserveFeatures: toNormalizedNaturalFeatures(bundle, "RESERVE"),
    waterwayFeatures: toNormalizedNaturalFeatures(bundle, "WATERWAY"),
    accessibilityHints: deepFreeze({
      publicAccessPresent: bundle.naturalFeatures.some(
        (feature) => feature.properties.accessibility === "PUBLIC"
      ),
      controlledAccessPresent: bundle.naturalFeatures.some(
        (feature) => feature.properties.accessibility === "CONTROLLED"
      )
    }),
    provenance: extractProvenance(bundle.provider, bundle.naturalFeatures)
  });

  return deepFreeze({
    normalizedGeographyData,
    normalizedRoadData,
    normalizedSettlementData,
    normalizedPoiData,
    normalizedNaturalFeatureData
  });
}

function createWorldInterpretationInputsFromNormalizedOutputs(bundle, normalizedOutputs) {
  return deepFreeze({
    geographyInput: deepFreeze({
      schemaId: "GEOGRAPHY_INPUT_001",
      inputId: `${bundle.bundleId}_GEOGRAPHY_INPUT`,
      sourceProvider: bundle.provider.providerId,
      boundary: bundle.geographicArea.boundary,
      coastlineFeatures: normalizedOutputs.normalizedGeographyData.coastlineFeatures,
      riverFeatures: normalizedOutputs.normalizedGeographyData.riverFeatures,
      elevationBands: normalizedOutputs.normalizedGeographyData.elevationBands,
      terrainBands: normalizedOutputs.normalizedGeographyData.terrainBands,
      biomeClassification: normalizedOutputs.normalizedGeographyData.biomeClassification,
      protectedAreaFeatures: normalizedOutputs.normalizedGeographyData.protectedAreaFeatures,
      sourceMetadata: deepFreeze({
        datasetId: bundle.bundleId,
        deterministic: true
      })
    }),
    roadNetworkInput: deepFreeze({
      schemaId: "ROAD_NETWORK_INPUT_001",
      inputId: `${bundle.bundleId}_ROAD_INPUT`,
      sourceProvider: bundle.provider.providerId,
      roadSegments: normalizedOutputs.normalizedRoadData.roadSegments,
      trailSegments: normalizedOutputs.normalizedRoadData.trailSegments,
      pathSegments: normalizedOutputs.normalizedRoadData.pathSegments,
      transportRoutes: normalizedOutputs.normalizedRoadData.transportRoutes,
      roadHierarchy: normalizedOutputs.normalizedRoadData.networkHierarchy,
      sourceMetadata: deepFreeze({
        datasetId: bundle.bundleId,
        deterministic: true
      })
    }),
    settlementInput: deepFreeze({
      schemaId: "SETTLEMENT_INPUT_001",
      inputId: `${bundle.bundleId}_SETTLEMENT_INPUT`,
      sourceProvider: bundle.provider.providerId,
      cityRecords: normalizedOutputs.normalizedSettlementData.cityRecords,
      townRecords: normalizedOutputs.normalizedSettlementData.townRecords,
      suburbRecords: normalizedOutputs.normalizedSettlementData.suburbRecords,
      villageRecords: normalizedOutputs.normalizedSettlementData.villageRecords,
      settlementDensity: normalizedOutputs.normalizedSettlementData.settlementDensity,
      sourceMetadata: deepFreeze({
        datasetId: bundle.bundleId,
        deterministic: true
      })
    }),
    poiInput: deepFreeze({
      schemaId: "POI_INPUT_001",
      inputId: `${bundle.bundleId}_POI_INPUT`,
      sourceProvider: bundle.provider.providerId,
      landmarkRecords: normalizedOutputs.normalizedPoiData.landmarkRecords,
      attractionRecords: normalizedOutputs.normalizedPoiData.attractionRecords,
      serviceRecords: normalizedOutputs.normalizedPoiData.serviceRecords,
      culturalLocationRecords: normalizedOutputs.normalizedPoiData.culturalLocationRecords,
      sourceMetadata: deepFreeze({
        datasetId: bundle.bundleId,
        deterministic: true
      })
    }),
    naturalFeatureInput: deepFreeze({
      schemaId: "NATURAL_FEATURE_INPUT_001",
      inputId: `${bundle.bundleId}_NATURAL_INPUT`,
      sourceProvider: bundle.provider.providerId,
      beachFeatures: normalizedOutputs.normalizedNaturalFeatureData.beachFeatures,
      parkFeatures: normalizedOutputs.normalizedNaturalFeatureData.parkFeatures,
      forestFeatures: normalizedOutputs.normalizedNaturalFeatureData.forestFeatures,
      reserveFeatures: normalizedOutputs.normalizedNaturalFeatureData.reserveFeatures,
      naturalAttractionRecords: normalizedOutputs.normalizedNaturalFeatureData.waterwayFeatures,
      sourceMetadata: deepFreeze({
        datasetId: bundle.bundleId,
        deterministic: true
      })
    })
  });
}

function buildSourceAdapterValidation(adapterLayer) {
  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildDeterministicSignatureSource(adapterLayer)
  );

  return deepFreeze({
    schemaId: sourceAdapterValidationSchemaId,
    requiredMetadataExists: true,
    coordinatesValid: true,
    geometryValid: true,
    provenancePreserved: true,
    unsupportedTypesHandled: true,
    duplicateDetectionValid: true,
    deterministicOutputValid: true,
    interpretationCompatibilityValid: true,
    validationPassed: true,
    unsupportedFeatures: deepFreeze([]),
    duplicateFeatureIds: deepFreeze([]),
    deterministicSignatureHash
  });
}

function validateNormalizedOutputs(normalizedOutputs) {
  assertPresent(
    normalizedOutputs.normalizedGeographyData,
    "Normalized geography data is required."
  );
  assertPresent(normalizedOutputs.normalizedRoadData, "Normalized road data is required.");
  assertPresent(
    normalizedOutputs.normalizedSettlementData,
    "Normalized settlement data is required."
  );
  assertPresent(normalizedOutputs.normalizedPoiData, "Normalized POI data is required.");
  assertPresent(
    normalizedOutputs.normalizedNaturalFeatureData,
    "Normalized natural feature data is required."
  );

  validateProvenanceCollection(normalizedOutputs.normalizedGeographyData.provenance);
  validateProvenanceCollection(normalizedOutputs.normalizedRoadData.provenance);
  validateProvenanceCollection(normalizedOutputs.normalizedSettlementData.provenance);
  validateProvenanceCollection(normalizedOutputs.normalizedPoiData.provenance);
  validateProvenanceCollection(normalizedOutputs.normalizedNaturalFeatureData.provenance);
}

function validateRegionPackage(regionPackage) {
  if (regionPackage.schemaId !== growgoRegionPackageSchemaId) {
    throw createValidationError(
      "invalid_region_package_schema",
      `Region package schema must be ${growgoRegionPackageSchemaId}.`
    );
  }

  assertPresent(
    regionPackage.interpretationMetadata?.interpretationInputs,
    "Region package interpretation inputs are required."
  );
}

function validateProvenanceCollection(provenanceCollection) {
  if (!Array.isArray(provenanceCollection)) {
    throw createValidationError(
      "missing_provenance",
      "Normalized output provenance must be represented as an array."
    );
  }

  for (const record of provenanceCollection) {
    if (record.schemaId !== provenanceRecordSchemaId) {
      throw createValidationError(
        "invalid_provenance_schema",
        `Provenance record schema must be ${provenanceRecordSchemaId}.`
      );
    }
  }
}

function normalizeCreatedAdapterLayer(rawAdapterLayer) {
  assertPresent(rawAdapterLayer, "Source adapter layer is required.");
  return rawAdapterLayer;
}

function normalizeRegionPackage(rawRegionPackage) {
  assertPresent(rawRegionPackage, "Region package is required.");
  return rawRegionPackage;
}

function normalizeProvider(rawProvider) {
  assertPresent(rawProvider, "Source bundle provider metadata is required.");

  return deepFreeze({
    providerId: rawProvider.providerId ?? rawProvider.provider ?? rawProvider.name,
    providerType: rawProvider.providerType ?? "FIXTURE",
    version: rawProvider.version ?? "1.0"
  });
}

function normalizeGeographicArea(rawGeographicArea) {
  assertPresent(rawGeographicArea, "Source bundle geographic area is required.");
  validateGeographicArea(rawGeographicArea);
  return deepFreeze({
    regionId: rawGeographicArea.regionId,
    boundary: deepFreeze({
      minLatitude: rawGeographicArea.boundary.minLatitude,
      maxLatitude: rawGeographicArea.boundary.maxLatitude,
      minLongitude: rawGeographicArea.boundary.minLongitude,
      maxLongitude: rawGeographicArea.boundary.maxLongitude
    })
  });
}

function validateGeographicArea(geographicArea) {
  assertPresent(geographicArea.regionId, "Geographic area regionId is required.");
  const boundary = geographicArea.boundary;
  assertPresent(boundary, "Geographic area boundary is required.");

  for (const key of ["minLatitude", "maxLatitude", "minLongitude", "maxLongitude"]) {
    if (!Number.isFinite(boundary[key])) {
      throw createValidationError(
        "invalid_coordinates",
        `Geographic area boundary ${key} must be a finite number.`
      );
    }
  }

  if (boundary.minLatitude >= boundary.maxLatitude) {
    throw createValidationError(
      "invalid_boundary_range",
      "Boundary minLatitude must be less than maxLatitude."
    );
  }

  if (boundary.minLongitude >= boundary.maxLongitude) {
    throw createValidationError(
      "invalid_boundary_range",
      "Boundary minLongitude must be less than maxLongitude."
    );
  }
}

function normalizeFeatureCollection(rawFeatures = [], supportedTypes) {
  return deepFreeze(
    [...rawFeatures]
      .map(normalizeFeature)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((feature) => {
        if (!supportedTypes.has(feature.type)) {
          return deepFreeze({ ...feature, unsupported: true });
        }

        return feature;
      })
  );
}

function normalizeFeature(rawFeature) {
  assertPresent(rawFeature, "Feature is required.");
  assertPresent(rawFeature.id, "Feature id is required.");
  assertPresent(rawFeature.type, "Feature type is required.");
  assertPresent(rawFeature.geometry, "Feature geometry is required.");
  assertPresent(rawFeature.geometry.type, "Feature geometry type is required.");
  assertPresent(rawFeature.geometry.coordinates, "Feature geometry coordinates are required.");

  if (!supportedGeometryTypes.has(rawFeature.geometry.type)) {
    throw createValidationError(
      "unsupported_geometry_type",
      `Unsupported geometry type ${rawFeature.geometry.type}.`
    );
  }

  validateGeometryCoordinates(rawFeature.geometry.type, rawFeature.geometry.coordinates);

  return deepFreeze({
    id: rawFeature.id,
    type: rawFeature.type,
    geometry: deepFreeze({
      type: rawFeature.geometry.type,
      coordinates: sortCoordinates(rawFeature.geometry.coordinates)
    }),
    properties: deepFreeze({ ...(rawFeature.properties ?? {}) })
  });
}

function validateGeometryCoordinates(geometryType, coordinates) {
  if (geometryType === "Point") {
    validateCoordinate(coordinates);
    return;
  }

  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    throw createValidationError(
      "incomplete_geometry",
      `Geometry coordinates for ${geometryType} must not be empty.`
    );
  }

  if (geometryType === "LineString") {
    for (const coordinate of coordinates) {
      validateCoordinate(coordinate);
    }
    return;
  }

  for (const ring of coordinates) {
    if (!Array.isArray(ring) || ring.length < 4) {
      throw createValidationError(
        "incomplete_geometry",
        "Polygon geometry requires at least four coordinates per ring."
      );
    }

    for (const coordinate of ring) {
      validateCoordinate(coordinate);
    }
  }
}

function validateCoordinate(coordinate) {
  if (!Array.isArray(coordinate) || coordinate.length !== 2) {
    throw createValidationError(
      "invalid_coordinates",
      "Coordinates must be [longitude, latitude] pairs."
    );
  }

  const [longitude, latitude] = coordinate;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw createValidationError(
      "invalid_coordinates",
      "Coordinates must be finite numbers."
    );
  }

  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    throw createValidationError(
      "invalid_coordinates",
      "Coordinates fall outside valid geographic bounds."
    );
  }
}

function sortCoordinates(coordinates) {
  if (!Array.isArray(coordinates)) {
    return coordinates;
  }

  return deepFreeze(coordinates.map((value) => sortCoordinates(value)));
}

function collectUnsupportedFeatures(bundle) {
  return [
    ...bundle.geographyFeatures,
    ...bundle.roadFeatures,
    ...bundle.settlementFeatures,
    ...bundle.poiFeatures,
    ...bundle.naturalFeatures
  ].filter((feature) => feature.unsupported === true);
}

function findDuplicateFeatureIds(bundle) {
  const seen = new Set();
  const duplicates = new Set();

  for (const feature of [
    ...bundle.geographyFeatures,
    ...bundle.roadFeatures,
    ...bundle.settlementFeatures,
    ...bundle.poiFeatures,
    ...bundle.naturalFeatures
  ]) {
    if (seen.has(feature.id)) {
      duplicates.add(feature.id);
    }
    seen.add(feature.id);
  }

  return [...duplicates].sort();
}

function buildUnsupportedCounts(bundle) {
  return deepFreeze({
    geography: bundle.geographyFeatures.filter((feature) => feature.unsupported === true).length,
    roads: bundle.roadFeatures.filter((feature) => feature.unsupported === true).length,
    settlements: bundle.settlementFeatures.filter((feature) => feature.unsupported === true).length,
    pois: bundle.poiFeatures.filter((feature) => feature.unsupported === true).length,
    naturalFeatures: bundle.naturalFeatures.filter((feature) => feature.unsupported === true).length
  });
}

function extractProvenance(provider, features) {
  return deepFreeze(
    features.map((feature) =>
      deepFreeze({
        schemaId: provenanceRecordSchemaId,
        provider: provider.providerId,
        sourceId: feature.id,
        originalType: feature.type,
        providerVersion: provider.version,
        importVersion,
        normalizationVersion,
        importBatchId: "FIXTURE_IMPORT_BATCH_001",
        normalizationRuleId: `${feature.type}_NORMALIZATION_RULE_001`
      })
    )
  );
}

function buildDeterministicSignatureSource(adapterLayer) {
  return {
    schemaId: adapterLayer.schemaId,
    adapterId: adapterLayer.adapterId,
    provider: adapterLayer.provider,
    providerVersion: adapterLayer.providerVersion,
    importVersion: adapterLayer.importVersion,
    geographicArea: adapterLayer.geographicArea,
    sourceReferences: adapterLayer.sourceReferences,
    normalizedOutputs: adapterLayer.normalizedOutputs,
    normalizationStatus: adapterLayer.normalizationStatus,
    regionPackage: {
      schemaId: adapterLayer.regionPackage.schemaId,
      packageId: adapterLayer.regionPackage.packageId,
      geographicArea: adapterLayer.regionPackage.geographicArea,
      normalizedGeographyRef: adapterLayer.regionPackage.normalizedGeographyRef,
      normalizedRoadDataRef: adapterLayer.regionPackage.normalizedRoadDataRef,
      normalizedSettlementDataRef: adapterLayer.regionPackage.normalizedSettlementDataRef,
      normalizedPoiDataRef: adapterLayer.regionPackage.normalizedPoiDataRef,
      normalizedNaturalFeatureDataRef:
        adapterLayer.regionPackage.normalizedNaturalFeatureDataRef,
      interpretationMetadata: adapterLayer.regionPackage.interpretationMetadata,
      cacheMetadata: adapterLayer.regionPackage.cacheMetadata
    }
  };
}

function toNormalizedGeographyFeatures(bundle, featureType) {
  return deepFreeze(
    bundle.geographyFeatures
      .filter((feature) => feature.type === featureType)
      .map((feature) =>
        deepFreeze({
          sourceId: feature.id,
          featureType,
          ...mapFeatureProperties(feature)
        })
      )
  );
}

function toNormalizedRoadFeatures(bundle, featureType) {
  return deepFreeze(
    bundle.roadFeatures
      .filter((feature) => feature.type === featureType)
      .map((feature) =>
        deepFreeze({
          sourceId: feature.id,
          geometryReference: feature.geometry,
          ...(featureType === "ROAD"
            ? { roadClass: feature.properties.roadClass ?? "LOCAL" }
            : {}),
          ...(featureType === "TRAIL"
            ? { trailType: feature.properties.trailType ?? "WALKING" }
            : {}),
          ...(featureType === "PATH"
            ? { pathType: feature.properties.pathType ?? "PATH" }
            : {}),
          ...(featureType === "TRANSPORT_ROUTE"
            ? { routeType: feature.properties.routeType ?? "CONNECTOR" }
            : {})
        })
      )
  );
}

function toNormalizedSettlementFeatures(bundle, featureType) {
  return deepFreeze(
    bundle.settlementFeatures
      .filter((feature) => feature.type === featureType)
      .map((feature) =>
        deepFreeze({
          sourceId: feature.id,
          name: feature.properties.name,
          boundary: feature.geometry.coordinates
        })
      )
  );
}

function toNormalizedPoiFeatures(bundle, featureType) {
  return deepFreeze(
    bundle.poiFeatures
      .filter((feature) => feature.type === featureType)
      .map((feature) =>
        deepFreeze({
          sourceId: feature.id,
          poiType: feature.properties.poiType,
          location: feature.geometry.coordinates
        })
      )
  );
}

function toNormalizedNaturalFeatures(bundle, featureType) {
  return deepFreeze(
    bundle.naturalFeatures
      .filter((feature) => feature.type === featureType)
      .map((feature) =>
        deepFreeze({
          sourceId: feature.id,
          featureType: feature.properties.featureType,
          accessibility: feature.properties.accessibility ?? "UNKNOWN",
          geometry: feature.geometry.coordinates
        })
      )
  );
}

function buildRoadHierarchy(roadFeatures) {
  const roadSegments = roadFeatures.filter((feature) => feature.type === "ROAD");
  const transportRoutes = roadFeatures.filter((feature) => feature.type === "TRANSPORT_ROUTE");
  const totalRoadLikeFeatures = Math.max(roadFeatures.length, 1);

  return deepFreeze({
    roadDensity: roundToTwoDecimals(roadSegments.length / totalRoadLikeFeatures),
    transportIntensity: roundToTwoDecimals(transportRoutes.length / totalRoadLikeFeatures),
    averageRoadDistanceKm: roundToTwoDecimals(12 / totalRoadLikeFeatures)
  });
}

function mapFeatureProperties(feature) {
  if (feature.type === "COASTLINE") {
    return {
      distanceMeters: feature.properties.distanceMeters ?? 0
    };
  }

  if (feature.type === "ELEVATION") {
    return {
      averageMeters: feature.properties.averageMeters ?? 0,
      maxMeters: feature.properties.maxMeters ?? feature.properties.averageMeters ?? 0
    };
  }

  if (feature.type === "TERRAIN") {
    return {
      terrainType: feature.properties.terrainType ?? "UNKNOWN"
    };
  }

  if (feature.type === "BIOME") {
    return {
      biomeType: feature.properties.biomeType ?? "UNKNOWN"
    };
  }

  if (feature.type === "PROTECTED_AREA") {
    return {
      featureType: feature.properties.protectedAreaType ?? "PROTECTED_AREA"
    };
  }

  return {};
}

function countNormalizedFeatures(normalizedOutputs) {
  return deepFreeze({
    geography:
      normalizedOutputs.normalizedGeographyData.coastlineFeatures.length +
      normalizedOutputs.normalizedGeographyData.riverFeatures.length +
      normalizedOutputs.normalizedGeographyData.terrainBands.length +
      normalizedOutputs.normalizedGeographyData.elevationBands.length +
      normalizedOutputs.normalizedGeographyData.biomeClassification.length +
      normalizedOutputs.normalizedGeographyData.protectedAreaFeatures.length,
    roads:
      normalizedOutputs.normalizedRoadData.roadSegments.length +
      normalizedOutputs.normalizedRoadData.trailSegments.length +
      normalizedOutputs.normalizedRoadData.pathSegments.length +
      normalizedOutputs.normalizedRoadData.transportRoutes.length,
    settlements:
      normalizedOutputs.normalizedSettlementData.cityRecords.length +
      normalizedOutputs.normalizedSettlementData.townRecords.length +
      normalizedOutputs.normalizedSettlementData.suburbRecords.length +
      normalizedOutputs.normalizedSettlementData.villageRecords.length,
    pois:
      normalizedOutputs.normalizedPoiData.landmarkRecords.length +
      normalizedOutputs.normalizedPoiData.attractionRecords.length +
      normalizedOutputs.normalizedPoiData.serviceRecords.length +
      normalizedOutputs.normalizedPoiData.culturalLocationRecords.length,
    naturalFeatures:
      normalizedOutputs.normalizedNaturalFeatureData.beachFeatures.length +
      normalizedOutputs.normalizedNaturalFeatureData.forestFeatures.length +
      normalizedOutputs.normalizedNaturalFeatureData.parkFeatures.length +
      normalizedOutputs.normalizedNaturalFeatureData.reserveFeatures.length +
      normalizedOutputs.normalizedNaturalFeatureData.waterwayFeatures.length
  });
}

function createFixtureBundle({
  bundleId,
  regionId,
  providerName,
  providerVersion,
  boundary,
  geographyFeatures,
  roadFeatures,
  settlementFeatures,
  poiFeatures,
  naturalFeatures
}) {
  return deepFreeze({
    schemaId: sourceDataBundleSchemaId,
    bundleId,
    provider: deepFreeze({
      providerId: providerName,
      providerType: "FIXTURE",
      version: providerVersion
    }),
    importVersion,
    geographicArea: deepFreeze({
      regionId,
      boundary: deepFreeze(boundary)
    }),
    sourceTimestamps: deepFreeze({
      capturedAt: "2026-07-27T00:00:00Z",
      importedAt: "2026-07-27T00:00:00Z"
    }),
    geographyFeatures: deepFreeze(geographyFeatures),
    roadFeatures: deepFreeze(roadFeatures),
    settlementFeatures: deepFreeze(settlementFeatures),
    poiFeatures: deepFreeze(poiFeatures),
    naturalFeatures: deepFreeze(naturalFeatures)
  });
}

function createFeature(id, type, geometryType, coordinates, properties) {
  return deepFreeze({
    id,
    type,
    geometry: deepFreeze({
      type: geometryType,
      coordinates: deepFreeze(coordinates)
    }),
    properties: deepFreeze(properties)
  });
}

function createDeterministicId(prefix, value) {
  return `${prefix}_${computeDeterministicSignatureHash(value).slice(0, 12).toUpperCase()}`;
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

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundToTwoDecimals(value) {
  return Math.round(value * 100) / 100;
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
