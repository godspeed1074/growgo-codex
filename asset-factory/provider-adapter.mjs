import {
  createSourceAdapterLayer,
  validateSourceAdapterLayer
} from "./source-adapter.mjs";

const providerSourceBundleSchemaId = "PROVIDER_SOURCE_BUNDLE_001";
const providerAdapterLayerSchemaId = "PROVIDER_ADAPTER_LAYER_001";
const providerAdapterSchemaId = "PROVIDER_ADAPTER_001";
const mapProviderAdapterSchemaId = "MAP_PROVIDER_ADAPTER_001";
const terrainProviderAdapterSchemaId = "TERRAIN_PROVIDER_ADAPTER_001";
const poiProviderAdapterSchemaId = "POI_PROVIDER_ADAPTER_001";
const naturalProviderAdapterSchemaId = "NATURAL_FEATURE_PROVIDER_ADAPTER_001";
const providerFieldMappingSchemaId = "PROVIDER_FIELD_MAPPING_001";
const providerValidationSchemaId = "PROVIDER_VALIDATION_001";
const providerAdapterValidationSchemaId = "PROVIDER_ADAPTER_VALIDATION_001";
const sourceDataBundleSchemaId = "SOURCE_DATA_BUNDLE_001";
const mappingVersion = "MAPPING_VERSION_001";

const supportedProviderTypes = Object.freeze([
  "MAP_PROVIDER",
  "TERRAIN_PROVIDER",
  "POI_PROVIDER",
  "NATURAL_PROVIDER"
]);

const mapRoadTypeMap = deepFreeze({
  primary: { type: "ROAD", roadClass: "PRIMARY" },
  secondary: { type: "ROAD", roadClass: "SECONDARY" },
  residential: { type: "ROAD", roadClass: "LOCAL" },
  track: { type: "TRAIL", trailType: "TRACK" },
  footway: { type: "PATH", pathType: "FOOTWAY" }
});

const poiCategoryMap = deepFreeze({
  lighthouse: { type: "LANDMARK", poiType: "LIGHTHOUSE" },
  lookout: { type: "LANDMARK", poiType: "LOOKOUT" },
  beach: { type: "ATTRACTION", poiType: "BEACH" },
  gallery: { type: "ATTRACTION", poiType: "GALLERY" },
  cafe: { type: "SERVICE", poiType: "CAFE" },
  station: { type: "SERVICE", poiType: "STATION" },
  museum: { type: "CULTURAL", poiType: "MUSEUM" }
});

const naturalCategoryMap = deepFreeze({
  beach: { type: "BEACH", featureType: "BEACH" },
  park: { type: "PARK", featureType: "PARK" },
  reserve: { type: "RESERVE", featureType: "RESERVE" },
  waterway: { type: "WATERWAY", featureType: "WATERWAY" },
  forest: { type: "FOREST", featureType: "FOREST" }
});

export const providerFieldMappings = deepFreeze([
  {
    schemaId: providerFieldMappingSchemaId,
    providerField: "highway",
    providerType: "MAP_PROVIDER",
    growgoTargetField: "roadFeatures[].type",
    transformationRule: "MAP_HIGHWAY_TO_SOURCE_ROAD_TYPE",
    confidenceHandling: "DIRECT"
  },
  {
    schemaId: providerFieldMappingSchemaId,
    providerField: "surface",
    providerType: "MAP_PROVIDER",
    growgoTargetField: "roadFeatures[].properties.surface",
    transformationRule: "PASS_SURFACE_METADATA",
    confidenceHandling: "DIRECT"
  },
  {
    schemaId: providerFieldMappingSchemaId,
    providerField: "access",
    providerType: "MAP_PROVIDER",
    growgoTargetField: "roadFeatures[].properties.access",
    transformationRule: "PASS_ACCESS_METADATA",
    confidenceHandling: "DIRECT"
  },
  {
    schemaId: providerFieldMappingSchemaId,
    providerField: "elevationMeters",
    providerType: "TERRAIN_PROVIDER",
    growgoTargetField: "geographyFeatures[].properties.averageMeters",
    transformationRule: "MAP_ELEVATION_TO_GEOGRAPHY_ELEVATION",
    confidenceHandling: "DIRECT"
  },
  {
    schemaId: providerFieldMappingSchemaId,
    providerField: "terrainClass",
    providerType: "TERRAIN_PROVIDER",
    growgoTargetField: "geographyFeatures[].properties.terrainType",
    transformationRule: "MAP_TERRAIN_CLASS_TO_GEOGRAPHY_TERRAIN",
    confidenceHandling: "DIRECT"
  },
  {
    schemaId: providerFieldMappingSchemaId,
    providerField: "category",
    providerType: "POI_PROVIDER",
    growgoTargetField: "poiFeatures[].type",
    transformationRule: "MAP_POI_CATEGORY_TO_SOURCE_POI_TYPE",
    confidenceHandling: "FLAG_LOW_CONFIDENCE"
  },
  {
    schemaId: providerFieldMappingSchemaId,
    providerField: "featureClass",
    providerType: "NATURAL_PROVIDER",
    growgoTargetField: "naturalFeatures[].type",
    transformationRule: "MAP_NATURAL_CLASS_TO_SOURCE_NATURAL_TYPE",
    confidenceHandling: "DIRECT"
  }
].map(deepFreeze));

export const providerAdapterDefinitions = deepFreeze({
  schemaId: providerAdapterLayerSchemaId,
  layerId: providerAdapterLayerSchemaId,
  supportedAdapters: deepFreeze([
    {
      schemaId: mapProviderAdapterSchemaId,
      adapterId: "MAP_PROVIDER_ADAPTER_001",
      providerType: "MAP_PROVIDER",
      providerName: "fixture-map-provider",
      providerVersion: "1.0",
      supportedDataTypes: deepFreeze(["roads", "trails", "paths", "boundaries"]),
      mappingVersion,
      normalizationTarget: sourceDataBundleSchemaId,
      validationStatus: { schemaId: providerValidationSchemaId }
    },
    {
      schemaId: terrainProviderAdapterSchemaId,
      adapterId: "TERRAIN_PROVIDER_ADAPTER_001",
      providerType: "TERRAIN_PROVIDER",
      providerName: "fixture-terrain-provider",
      providerVersion: "1.0",
      supportedDataTypes: deepFreeze(["elevation", "terrain", "landform"]),
      mappingVersion,
      normalizationTarget: sourceDataBundleSchemaId,
      validationStatus: { schemaId: providerValidationSchemaId }
    },
    {
      schemaId: poiProviderAdapterSchemaId,
      adapterId: "POI_PROVIDER_ADAPTER_001",
      providerType: "POI_PROVIDER",
      providerName: "fixture-poi-provider",
      providerVersion: "1.0",
      supportedDataTypes: deepFreeze(["landmarks", "attractions", "services"]),
      mappingVersion,
      normalizationTarget: sourceDataBundleSchemaId,
      validationStatus: { schemaId: providerValidationSchemaId }
    },
    {
      schemaId: naturalProviderAdapterSchemaId,
      adapterId: "NATURAL_FEATURE_PROVIDER_ADAPTER_001",
      providerType: "NATURAL_PROVIDER",
      providerName: "fixture-natural-provider",
      providerVersion: "1.0",
      supportedDataTypes: deepFreeze(["beaches", "parks", "reserves", "waterways"]),
      mappingVersion,
      normalizationTarget: sourceDataBundleSchemaId,
      validationStatus: { schemaId: providerValidationSchemaId }
    }
  ].map(deepFreeze))
});

export const providerFixtureBundles = deepFreeze({
  MAP_PROVIDER_FIXTURE_001: createProviderFixture({
    bundleId: "MAP_PROVIDER_FIXTURE_001",
    providerType: "MAP_PROVIDER",
    providerName: "fixture-map-provider",
    providerVersion: "1.0",
    regionId: "provider-map-region",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.18,
      minLongitude: 144.84,
      maxLongitude: 145.22
    },
    sourceFeatures: deepFreeze([
      providerFeature("road_001", "road", "LineString", [[144.9, -38.44], [145.14, -38.28]], {
        highway: "primary",
        surface: "sealed",
        access: "public",
        confidence: 1
      }),
      providerFeature("trail_001", "trail", "LineString", [[144.96, -38.41], [145.08, -38.3]], {
        highway: "track",
        surface: "gravel",
        access: "public",
        confidence: 1
      }),
      providerFeature("path_001", "path", "LineString", [[145.02, -38.36], [145.08, -38.31]], {
        highway: "footway",
        surface: "sand",
        access: "public",
        confidence: 1
      }),
      providerFeature(
        "boundary_001",
        "boundary",
        "Polygon",
        [[[145.0, -38.4], [145.16, -38.4], [145.16, -38.28], [145.0, -38.28], [145.0, -38.4]]],
        {
          boundaryType: "town",
          name: "Provider Boundary",
          density: 0.42,
          confidence: 0.95
        }
      )
    ])
  }),
  TERRAIN_PROVIDER_FIXTURE_001: createProviderFixture({
    bundleId: "TERRAIN_PROVIDER_FIXTURE_001",
    providerType: "TERRAIN_PROVIDER",
    providerName: "fixture-terrain-provider",
    providerVersion: "1.0",
    regionId: "provider-terrain-region",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.18,
      minLongitude: 144.84,
      maxLongitude: 145.22
    },
    sourceFeatures: deepFreeze([
      providerFeature(
        "elev_001",
        "elevation",
        "Polygon",
        [[[144.92, -38.48], [145.18, -38.48], [145.18, -38.24], [144.92, -38.24], [144.92, -38.48]]],
        {
          elevationMeters: 34,
          maxElevationMeters: 68,
          confidence: 1
        }
      ),
      providerFeature(
        "terrain_001",
        "terrain",
        "Polygon",
        [[[144.88, -38.52], [145.18, -38.52], [145.18, -38.2], [144.88, -38.2], [144.88, -38.52]]],
        {
          terrainClass: "coastal_plain",
          slopeClass: "gentle",
          biomeClass: "temperate_coastal",
          confidence: 1
        }
      ),
      providerFeature(
        "coastline_001",
        "landform",
        "LineString",
        [[144.84, -38.42], [145.02, -38.32], [145.18, -38.2]],
        {
          landformType: "coastline",
          distanceMeters: 450,
          confidence: 1
        }
      ),
      providerFeature(
        "landform_001",
        "landform",
        "Polygon",
        [[[145.0, -38.36], [145.12, -38.36], [145.12, -38.26], [145.0, -38.26], [145.0, -38.36]]],
        {
          landformType: "reserve",
          protectedAreaType: "COASTAL_RESERVE",
          confidence: 0.96
        }
      )
    ])
  }),
  POI_PROVIDER_FIXTURE_001: createProviderFixture({
    bundleId: "POI_PROVIDER_FIXTURE_001",
    providerType: "POI_PROVIDER",
    providerName: "fixture-poi-provider",
    providerVersion: "1.0",
    regionId: "provider-poi-region",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.18,
      minLongitude: 144.84,
      maxLongitude: 145.22
    },
    sourceFeatures: deepFreeze([
      providerFeature("poi_001", "poi", "Point", [145.08, -38.31], {
        category: "lighthouse",
        confidence: 1
      }),
      providerFeature("poi_002", "poi", "Point", [145.05, -38.3], {
        category: "beach",
        confidence: 0.98
      }),
      providerFeature("poi_003", "poi", "Point", [145.06, -38.32], {
        category: "cafe",
        confidence: 0.94
      })
    ])
  }),
  NATURAL_PROVIDER_FIXTURE_001: createProviderFixture({
    bundleId: "NATURAL_PROVIDER_FIXTURE_001",
    providerType: "NATURAL_PROVIDER",
    providerName: "fixture-natural-provider",
    providerVersion: "1.0",
    regionId: "provider-natural-region",
    boundary: {
      minLatitude: -38.58,
      maxLatitude: -38.18,
      minLongitude: 144.84,
      maxLongitude: 145.22
    },
    sourceFeatures: deepFreeze([
      providerFeature(
        "natural_001",
        "natural",
        "Polygon",
        [[[145.02, -38.32], [145.14, -38.32], [145.14, -38.26], [145.02, -38.26], [145.02, -38.32]]],
        {
          featureClass: "beach",
          access: "public",
          confidence: 1
        }
      ),
      providerFeature(
        "natural_002",
        "natural",
        "Polygon",
        [[[145.0, -38.38], [145.12, -38.38], [145.12, -38.3], [145.0, -38.3], [145.0, -38.38]]],
        {
          featureClass: "park",
          access: "public",
          confidence: 1
        }
      ),
      providerFeature(
        "natural_003",
        "natural",
        "LineString",
        [[145.04, -38.4], [145.12, -38.34]],
        {
          featureClass: "waterway",
          access: "public",
          confidence: 0.96
        }
      )
    ])
  })
});

export function createProviderAdapterLayer(rawProviderBundle) {
  const providerBundle = normalizeProviderSourceBundle(rawProviderBundle);
  const mappings = selectMappingsForProviderType(providerBundle.providerType);
  const sourceDataBundle = convertProviderBundleToSourceDataBundle(providerBundle, mappings);
  const validation = buildProviderValidation(providerBundle, sourceDataBundle, mappings);

  const layer = deepFreeze({
    schemaId: providerAdapterLayerSchemaId,
    adapterRunId: createDeterministicId("PROVIDER_ADAPTER", providerBundle),
    providerBundle,
    providerAdapter: buildProviderAdapterDefinition(providerBundle),
    fieldMappings: mappings,
    sourceDataBundle,
    validation
  });

  const checked = validateProviderAdapterLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateProviderAdapterLayer(rawLayer) {
  try {
    const layer = rawLayer;
    assertPresent(layer?.providerBundle, "Provider bundle is required.");
    assertPresent(layer?.providerAdapter, "Provider adapter definition is required.");
    assertPresent(layer?.sourceDataBundle, "Converted source data bundle is required.");
    assertPresent(layer?.validation, "Provider validation is required.");

    if (layer.sourceDataBundle.schemaId !== sourceDataBundleSchemaId) {
      throw createValidationError(
        "invalid_source_data_bundle_schema",
        `Converted source bundle schema must be ${sourceDataBundleSchemaId}.`
      );
    }

    for (const key of [
      "providerMetadataExists",
      "mappingsValid",
      "requiredFieldsPresent",
      "unsupportedFieldsHandled",
      "provenancePreserved",
      "deterministicConversion",
      "sourceAdapterCompatibility"
    ]) {
      if (layer.validation[key] !== true) {
        throw createValidationError(
          "provider_validation_invalid",
          `Provider validation flag ${key} must be true.`
        );
      }
    }

    const sourceValidation = validateSourceAdapterLayer(
      createSourceAdapterLayer(layer.sourceDataBundle)
    );
    if (!sourceValidation.ok) {
      throw createValidationError(
        "source_adapter_compatibility_failed",
        sourceValidation.message
      );
    }

    const signature = computeDeterministicSignatureHash(buildDeterministicSignatureSource(layer));
    if (signature !== layer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "Provider adapter deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({ ok: true, errorCode: null, message: null, providerAdapterLayer: layer });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "provider_adapter_validation_failed",
      message: error.message,
      providerAdapterLayer: null
    });
  }
}

export function createProviderAdapterRegionPackage(rawProviderBundle) {
  const providerLayer = createProviderAdapterLayer(rawProviderBundle);
  return createSourceAdapterLayer(providerLayer.sourceDataBundle).regionPackage;
}

function buildProviderAdapterDefinition(providerBundle) {
  const schemaByType = {
    MAP_PROVIDER: mapProviderAdapterSchemaId,
    TERRAIN_PROVIDER: terrainProviderAdapterSchemaId,
    POI_PROVIDER: poiProviderAdapterSchemaId,
    NATURAL_PROVIDER: naturalProviderAdapterSchemaId
  };

  return deepFreeze({
    schemaId: schemaByType[providerBundle.providerType] ?? providerAdapterSchemaId,
    adapterId: `${providerBundle.providerType}_ADAPTER_${providerBundle.provider.providerId}`,
    providerType: providerBundle.providerType,
    providerName: providerBundle.provider.providerId,
    providerVersion: providerBundle.provider.version,
    supportedDataTypes: deepFreeze(structuredClone(providerBundle.supportedDataTypes)),
    mappingVersion,
    normalizationTarget: sourceDataBundleSchemaId,
    validationStatus: deepFreeze({ schemaId: providerValidationSchemaId })
  });
}

function convertProviderBundleToSourceDataBundle(providerBundle, mappings) {
  const converted = {
    schemaId: sourceDataBundleSchemaId,
    bundleId: `${providerBundle.bundleId}_SOURCE_DATA`,
    provider: deepFreeze({
      providerId: providerBundle.provider.providerId,
      providerType: providerBundle.providerType,
      version: providerBundle.provider.version
    }),
    importVersion: "IMPORT_VERSION_001",
    geographicArea: providerBundle.geographicArea,
    sourceTimestamps: providerBundle.sourceTimestamps,
    geographyFeatures: [],
    roadFeatures: [],
    settlementFeatures: [],
    poiFeatures: [],
    naturalFeatures: []
  };

  for (const feature of providerBundle.sourceFeatures) {
    if (providerBundle.providerType === "MAP_PROVIDER") {
      mapProviderFeature(converted, feature);
    } else if (providerBundle.providerType === "TERRAIN_PROVIDER") {
      terrainProviderFeature(converted, feature);
    } else if (providerBundle.providerType === "POI_PROVIDER") {
      poiProviderFeature(converted, feature);
    } else if (providerBundle.providerType === "NATURAL_PROVIDER") {
      naturalProviderFeature(converted, feature);
    }
  }

  return deepFreeze({
    ...converted,
    geographyFeatures: deepFreeze(sortById(converted.geographyFeatures)),
    roadFeatures: deepFreeze(sortById(converted.roadFeatures)),
    settlementFeatures: deepFreeze(sortById(converted.settlementFeatures)),
    poiFeatures: deepFreeze(sortById(converted.poiFeatures)),
    naturalFeatures: deepFreeze(sortById(converted.naturalFeatures)),
    providerMappingMetadata: mappings
  });
}

function mapProviderFeature(converted, feature) {
  if (feature.sourceType === "road" || feature.sourceType === "trail" || feature.sourceType === "path") {
    const mapping = mapRoadTypeMap[feature.properties.highway];
    if (!mapping) {
      throw createValidationError(
        "unsupported_map_feature",
        `Unsupported map feature highway ${feature.properties.highway}.`
      );
    }

    converted.roadFeatures.push(
      createSourceFeature(feature, mapping.type, {
        ...("roadClass" in mapping ? { roadClass: mapping.roadClass } : {}),
        ...("trailType" in mapping ? { trailType: mapping.trailType } : {}),
        ...("pathType" in mapping ? { pathType: mapping.pathType } : {}),
        surface: feature.properties.surface,
        access: feature.properties.access,
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
    return;
  }

  if (feature.sourceType === "boundary") {
    converted.settlementFeatures.push(
      createSourceFeature(feature, "TOWN", {
        name: feature.properties.name ?? "Provider Boundary",
        density: feature.properties.density ?? 0.4,
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
  }
}

function terrainProviderFeature(converted, feature) {
  if (feature.sourceType === "elevation") {
    converted.geographyFeatures.push(
      createSourceFeature(feature, "ELEVATION", {
        averageMeters: feature.properties.elevationMeters,
        maxMeters: feature.properties.maxElevationMeters ?? feature.properties.elevationMeters,
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
    return;
  }

  if (feature.sourceType === "terrain") {
    converted.geographyFeatures.push(
      createSourceFeature(feature, "TERRAIN", {
        terrainType: String(feature.properties.terrainClass ?? "unknown").toUpperCase(),
        slopeClass: feature.properties.slopeClass ?? "unknown",
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
    converted.geographyFeatures.push(
      createSourceFeature(
        { ...feature, id: `${feature.id}_BIOME` },
        "BIOME",
        {
          biomeType: String(feature.properties.biomeClass ?? "unknown").toUpperCase(),
          providerProvenance: buildFeatureProvenance(feature)
        }
      )
    );
    return;
  }

  if (feature.sourceType === "landform") {
    if (feature.properties.landformType === "coastline") {
      converted.geographyFeatures.push(
        createSourceFeature(feature, "COASTLINE", {
          distanceMeters: feature.properties.distanceMeters ?? 0,
          providerProvenance: buildFeatureProvenance(feature)
        })
      );
      return;
    }

    converted.geographyFeatures.push(
      createSourceFeature(feature, "PROTECTED_AREA", {
        protectedAreaType: feature.properties.protectedAreaType ?? "PROTECTED_AREA",
        landformType: feature.properties.landformType ?? "landform",
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
  }
}

function poiProviderFeature(converted, feature) {
  const mapping = poiCategoryMap[feature.properties.category];
  if (!mapping) {
    throw createValidationError(
      "unsupported_poi_feature",
      `Unsupported POI category ${feature.properties.category}.`
    );
  }

  converted.poiFeatures.push(
    createSourceFeature(feature, mapping.type, {
      poiType: mapping.poiType,
      mappingConfidence: feature.properties.confidence ?? 1,
      providerProvenance: buildFeatureProvenance(feature)
    })
  );
}

function naturalProviderFeature(converted, feature) {
  const mapping = naturalCategoryMap[feature.properties.featureClass];
  if (!mapping) {
    throw createValidationError(
      "unsupported_natural_feature",
      `Unsupported natural feature class ${feature.properties.featureClass}.`
    );
  }

  converted.naturalFeatures.push(
    createSourceFeature(feature, mapping.type, {
      featureType: mapping.featureType,
      accessibility: String(feature.properties.access ?? "unknown").toUpperCase(),
      providerProvenance: buildFeatureProvenance(feature)
    })
  );
}

function buildProviderValidation(providerBundle, sourceDataBundle, mappings) {
  const deterministicSignatureHash = computeDeterministicSignatureHash({
    providerBundle,
    providerAdapter: buildProviderAdapterDefinition(providerBundle),
    sourceDataBundle,
    fieldMappings: mappings
  });

  return deepFreeze({
    schemaId: providerAdapterValidationSchemaId,
    providerMetadataExists: true,
    mappingsValid: true,
    requiredFieldsPresent: true,
    unsupportedFieldsHandled: true,
    provenancePreserved: allSourceFeatures(sourceDataBundle).every(
      (feature) => feature.properties?.providerProvenance?.provider === providerBundle.provider.providerId
    ),
    deterministicConversion: true,
    sourceAdapterCompatibility: true,
    deterministicSignatureHash
  });
}

function normalizeProviderSourceBundle(rawBundle) {
  assertPresent(rawBundle, "Provider source bundle is required.");
  assertPresent(rawBundle.schemaId, "Provider source bundle schemaId is required.");
  if (rawBundle.schemaId !== providerSourceBundleSchemaId) {
    throw createValidationError(
      "invalid_provider_source_bundle_schema",
      `Provider source bundle schema must be ${providerSourceBundleSchemaId}.`
    );
  }

  if (!supportedProviderTypes.includes(rawBundle.providerType)) {
    throw createValidationError(
      "unsupported_provider",
      `Unsupported provider type ${rawBundle.providerType}.`
    );
  }

  const bundle = deepFreeze({
    schemaId: rawBundle.schemaId,
    bundleId: rawBundle.bundleId,
    providerType: rawBundle.providerType,
    provider: deepFreeze({
      providerId: rawBundle.provider.providerId,
      version: rawBundle.provider.version
    }),
    supportedDataTypes: deepFreeze(structuredClone(rawBundle.supportedDataTypes)),
    geographicArea: deepFreeze(structuredClone(rawBundle.geographicArea)),
    sourceTimestamps: deepFreeze(structuredClone(rawBundle.sourceTimestamps)),
    sourceFeatures: deepFreeze(
      sortById(rawBundle.sourceFeatures.map((feature) => normalizeProviderFeature(rawBundle, feature)))
    )
  });

  return bundle;
}

function normalizeProviderFeature(bundle, rawFeature) {
  assertPresent(rawFeature.id, "Provider feature id is required.");
  assertPresent(rawFeature.sourceType, "Provider feature sourceType is required.");
  assertPresent(rawFeature.geometry?.type, "Provider feature geometry type is required.");
  assertPresent(rawFeature.geometry?.coordinates, "Provider feature geometry coordinates are required.");

  return deepFreeze({
    id: rawFeature.id,
    sourceType: rawFeature.sourceType,
    geometry: deepFreeze(structuredClone(rawFeature.geometry)),
    properties: deepFreeze(structuredClone(rawFeature.properties ?? {})),
    providerMetadata: deepFreeze({
      provider: bundle.provider.providerId,
      providerType: bundle.providerType,
      providerVersion: bundle.provider.version,
      capturedAt: bundle.sourceTimestamps.capturedAt,
      sourceTimestamp: bundle.sourceTimestamps.importedAt
    })
  });
}

function selectMappingsForProviderType(providerType) {
  return deepFreeze(
    providerFieldMappings.filter((mapping) => mapping.providerType === providerType)
  );
}

function createProviderFixture({
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
    sourceFeatures
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

function providerFeature(id, sourceType, geometryType, coordinates, properties) {
  return deepFreeze({
    id,
    sourceType,
    geometry: deepFreeze({
      type: geometryType,
      coordinates: deepFreeze(coordinates)
    }),
    properties: deepFreeze(properties)
  });
}

function createSourceFeature(providerFeatureRecord, type, properties) {
  return deepFreeze({
    id: providerFeatureRecord.id,
    type,
    geometry: deepFreeze(structuredClone(providerFeatureRecord.geometry)),
    properties: deepFreeze(properties)
  });
}

function buildFeatureProvenance(feature) {
  return deepFreeze({
    provider: feature.providerMetadata.provider,
    providerId: feature.id,
    providerType: feature.providerMetadata.providerType,
    providerVersion: feature.providerMetadata.providerVersion,
    mappingVersion
  });
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

function buildDeterministicSignatureSource(layer) {
  return {
    providerBundle: layer.providerBundle,
    providerAdapter: layer.providerAdapter,
    sourceDataBundle: layer.sourceDataBundle,
    fieldMappings: layer.fieldMappings
  };
}

function sortById(items) {
  return [...items].sort((left, right) => left.id.localeCompare(right.id));
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
