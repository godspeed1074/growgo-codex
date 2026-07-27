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
  const conversion = convertProviderBundleToSourceDataBundle(providerBundle, mappings);
  const { sourceDataBundle, warnings, stats } = conversion;
  const validation = buildProviderValidation(
    providerBundle,
    sourceDataBundle,
    mappings,
    warnings,
    stats
  );

  const layer = deepFreeze({
    schemaId: providerAdapterLayerSchemaId,
    adapterRunId: createDeterministicId("PROVIDER_ADAPTER", providerBundle),
    providerBundle,
    providerAdapter: buildProviderAdapterDefinition(providerBundle),
    fieldMappings: mappings,
    sourceDataBundle,
    conversionWarnings: warnings,
    conversionStats: stats,
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
  const warnings = [];
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
      mapProviderFeature(converted, feature, warnings);
    } else if (providerBundle.providerType === "TERRAIN_PROVIDER") {
      terrainProviderFeature(converted, feature, warnings);
    } else if (providerBundle.providerType === "POI_PROVIDER") {
      poiProviderFeature(converted, feature, warnings);
    } else if (providerBundle.providerType === "NATURAL_PROVIDER") {
      naturalProviderFeature(converted, feature, warnings);
    }
  }

  const dedupedPoiResult = dedupePoiFeatures(converted.poiFeatures, warnings);

  const sourceDataBundle = deepFreeze({
    ...converted,
    geographyFeatures: deepFreeze(sortById(converted.geographyFeatures)),
    roadFeatures: deepFreeze(sortById(converted.roadFeatures)),
    settlementFeatures: deepFreeze(sortById(converted.settlementFeatures)),
    poiFeatures: deepFreeze(sortById(dedupedPoiResult.poiFeatures)),
    naturalFeatures: deepFreeze(sortById(converted.naturalFeatures)),
    providerMappingMetadata: mappings
  });

  const stats = deepFreeze({
    warningCount: warnings.length,
    duplicateResolutionCount: dedupedPoiResult.duplicatesResolvedCount,
    lowConfidenceMappingCount: countLowConfidenceFeatures(sourceDataBundle)
  });

  return deepFreeze({
    sourceDataBundle,
    warnings: deepFreeze(warnings.map((warning) => deepFreeze(warning))),
    stats
  });
}

function mapProviderFeature(converted, feature, warnings) {
  if (feature.sourceType === "road" || feature.sourceType === "trail" || feature.sourceType === "path") {
    const highway = normalizeRoadAlias(
      readProviderField(feature, [
        "highway",
        "roadType",
        "tags.highway",
        "attributes.highway",
        "classification.road"
      ])
    );
    const mapping = mapRoadTypeMap[highway];
    if (!mapping) {
      warnings.push(
        createWarning(
          "UNSUPPORTED_MAP_FEATURE",
          feature.id,
          `Unsupported map feature highway ${String(highway)} was ignored.`
        )
      );
      return;
    }

    converted.roadFeatures.push(
      createSourceFeature(feature, mapping.type, {
        ...("roadClass" in mapping ? { roadClass: mapping.roadClass } : {}),
        ...("trailType" in mapping ? { trailType: mapping.trailType } : {}),
        ...("pathType" in mapping ? { pathType: mapping.pathType } : {}),
        surface: readProviderField(feature, [
          "surface",
          "tags.surface",
          "meta.surface"
        ]) ?? "UNKNOWN",
        access:
          String(
            readProviderField(feature, ["access", "tags.access", "meta.access"]) ?? "UNKNOWN"
          ).toUpperCase(),
        mappingConfidence: normalizeConfidence(readProviderField(feature, ["confidence"])),
        providerProvenance: buildFeatureProvenance(feature)
      })
    );

    if (readProviderField(feature, ["surface", "tags.surface", "meta.surface"]) === undefined) {
      warnings.push(
        createWarning(
          "MISSING_OPTIONAL_SURFACE",
          feature.id,
          "Road feature missing surface metadata; defaulted to UNKNOWN."
        )
      );
    }
    if (readProviderField(feature, ["access", "tags.access", "meta.access"]) === undefined) {
      warnings.push(
        createWarning(
          "MISSING_OPTIONAL_ACCESS",
          feature.id,
          "Road feature missing access metadata; defaulted to UNKNOWN."
        )
      );
    }
    return;
  }

  if (feature.sourceType === "boundary") {
    converted.settlementFeatures.push(
      createSourceFeature(feature, "TOWN", {
        name: readProviderField(feature, ["name", "properties.name"]) ?? "Provider Boundary",
        density: Number(readProviderField(feature, ["density", "meta.density"]) ?? 0.4),
        mappingConfidence: normalizeConfidence(readProviderField(feature, ["confidence"])),
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
  }
}

function terrainProviderFeature(converted, feature, warnings) {
  if (feature.sourceType === "elevation") {
    const elevationMeters = Number(
      readProviderField(feature, [
        "elevationMeters",
        "elev_m",
        "stats.avg_elevation_m"
      ]) ?? 0
    );
    const maxElevationMeters = Number(
      readProviderField(feature, [
        "maxElevationMeters",
        "elev_max_m",
        "stats.max_elevation_m"
      ]) ?? elevationMeters
    );
    converted.geographyFeatures.push(
      createSourceFeature(feature, "ELEVATION", {
        averageMeters: elevationMeters,
        maxMeters: maxElevationMeters,
        mappingConfidence: normalizeConfidence(readProviderField(feature, ["confidence"])),
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
    return;
  }

  if (feature.sourceType === "terrain") {
    const terrainType = normalizeTerrainAlias(
      readProviderField(feature, [
        "terrainClass",
        "terrainLabel",
        "classification.terrain",
        "landcover.terrain"
      ])
    );
    const biomeType = normalizeBiomeAlias(
      readProviderField(feature, [
        "biomeClass",
        "biomeLabel",
        "classification.biome",
        "landcover.biome"
      ])
    );
    const slopeClass = readProviderField(feature, ["slopeClass", "slope", "terrainSlope"]);
    converted.geographyFeatures.push(
      createSourceFeature(feature, "TERRAIN", {
        terrainType,
        slopeClass: slopeClass ?? "UNKNOWN",
        mappingConfidence: normalizeConfidence(readProviderField(feature, ["confidence"])),
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
    converted.geographyFeatures.push(
      createSourceFeature(
        { ...feature, id: `${feature.id}_BIOME` },
        "BIOME",
        {
          biomeType,
          mappingConfidence: normalizeConfidence(readProviderField(feature, ["confidence"])),
          providerProvenance: buildFeatureProvenance(feature)
        }
      )
    );

    if (slopeClass === undefined) {
      warnings.push(
        createWarning(
          "MISSING_OPTIONAL_SLOPE",
          feature.id,
          "Terrain feature missing slope data; defaulted to UNKNOWN."
        )
      );
    }
    return;
  }

  if (feature.sourceType === "landform") {
    const landformType = normalizeLandformAlias(
      readProviderField(feature, [
        "landformType",
        "landform.kind",
        "classification.landform"
      ])
    );

    if (landformType === "coastline") {
      converted.geographyFeatures.push(
        createSourceFeature(feature, "COASTLINE", {
          distanceMeters: Number(readProviderField(feature, ["distanceMeters", "proximityMeters"]) ?? 0),
          mappingConfidence: normalizeConfidence(readProviderField(feature, ["confidence"])),
          providerProvenance: buildFeatureProvenance(feature)
        })
      );
      return;
    }

    converted.geographyFeatures.push(
      createSourceFeature(feature, "PROTECTED_AREA", {
        protectedAreaType:
          readProviderField(feature, ["protectedAreaType", "status.protectedType"]) ??
          "PROTECTED_AREA",
        landformType: landformType ?? "landform",
        mappingConfidence: normalizeConfidence(readProviderField(feature, ["confidence"])),
        providerProvenance: buildFeatureProvenance(feature)
      })
    );
  }
}

function poiProviderFeature(converted, feature, warnings) {
  const rawCategory = readProviderField(feature, [
    "category",
    "poiCategory",
    "classification.category",
    "tags.kind"
  ]);
  const normalizedCategory = normalizePoiAlias(rawCategory);
  const mapping = poiCategoryMap[normalizedCategory];
  if (!mapping) {
    warnings.push(
      createWarning(
        "UNSUPPORTED_POI_FEATURE",
        feature.id,
        `Unsupported POI category ${String(rawCategory)} was ignored.`
      )
    );
    return;
  }

  const mappingConfidence = normalizeConfidence(readProviderField(feature, ["confidence"]));
  converted.poiFeatures.push(
    createSourceFeature(feature, mapping.type, {
      poiType: mapping.poiType,
      mappingConfidence,
      metadataCompleteness: hasMetadataFields(feature, ["name", "description"]) ? "COMPLETE" : "PARTIAL",
      providerProvenance: buildFeatureProvenance(feature)
    })
  );

  if (!hasMetadataFields(feature, ["name", "description"])) {
    warnings.push(
      createWarning(
        "INCOMPLETE_POI_METADATA",
        feature.id,
        "POI feature has incomplete metadata and was preserved with partial completeness."
      )
    );
  }
  if (mappingConfidence < 0.75) {
    warnings.push(
      createWarning(
        "LOW_CONFIDENCE_POI_MAPPING",
        feature.id,
        "POI feature mapped with low confidence."
      )
    );
  }
}

function naturalProviderFeature(converted, feature, warnings) {
  const rawFeatureClass = readProviderField(feature, [
    "featureClass",
    "featureType",
    "classification.natural",
    "tags.natural_kind"
  ]);
  const normalizedFeatureClass = normalizeNaturalAlias(rawFeatureClass);
  const mapping = naturalCategoryMap[normalizedFeatureClass];
  if (!mapping) {
    warnings.push(
      createWarning(
        "UNSUPPORTED_NATURAL_FEATURE",
        feature.id,
        `Unsupported natural feature class ${String(rawFeatureClass)} was ignored.`
      )
    );
    return;
  }

  converted.naturalFeatures.push(
    createSourceFeature(feature, mapping.type, {
      featureType: mapping.featureType,
      accessibility: String(readProviderField(feature, ["access", "meta.access"]) ?? "UNKNOWN").toUpperCase(),
      mappingConfidence: normalizeConfidence(readProviderField(feature, ["confidence"])),
      providerProvenance: buildFeatureProvenance(feature)
    })
  );

  if (readProviderField(feature, ["boundaryStatus"]) === "INCOMPLETE") {
    warnings.push(
      createWarning(
        "INCOMPLETE_NATURAL_BOUNDARY",
        feature.id,
        "Natural feature boundary is incomplete and was preserved with warning."
      )
    );
  }
  if (Array.isArray(readProviderField(feature, ["overlapsWith"]))) {
    warnings.push(
      createWarning(
        "OVERLAPPING_NATURAL_FEATURE",
        feature.id,
        "Natural feature overlaps with another provider feature."
      )
    );
  }
}

function buildProviderValidation(providerBundle, sourceDataBundle, mappings, warnings, stats) {
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
    warningCount: stats.warningCount,
    duplicateResolutionCount: stats.duplicateResolutionCount,
    lowConfidenceMappingCount: stats.lowConfidenceMappingCount,
    warnings,
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

  const normalizedFeatures = rawBundle.sourceFeatures
    .map((feature) => normalizeProviderFeature(rawBundle, feature))
    .filter(Boolean);

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
    sourceFeatures: deepFreeze(sortById(normalizedFeatures))
  });

  return bundle;
}

function normalizeProviderFeature(bundle, rawFeature) {
  assertPresent(rawFeature.id, "Provider feature id is required.");
  assertPresent(rawFeature.sourceType, "Provider feature sourceType is required.");
  const geometry = normalizeProviderGeometry(rawFeature);
  assertPresent(geometry?.type, "Provider feature geometry type is required.");
  assertPresent(geometry?.coordinates, "Provider feature geometry coordinates are required.");

  return deepFreeze({
    id: rawFeature.id,
    sourceType: rawFeature.sourceType,
    geometry: deepFreeze(geometry),
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

function readProviderField(feature, candidatePaths) {
  for (const path of candidatePaths) {
    const value = getNestedValue(feature.properties, path);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function getNestedValue(value, path) {
  const segments = path.split(".");
  let current = value;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function normalizeRoadAlias(rawValue) {
  const value = String(rawValue ?? "").trim().toLowerCase();
  const aliasMap = {
    primary_road: "primary",
    primaryroute: "primary",
    main: "primary",
    local_street: "residential",
    local: "residential",
    walking_track: "track",
    trail: "track",
    pedestrian: "footway",
    path: "footway"
  };
  return aliasMap[value] ?? value;
}

function normalizeTerrainAlias(rawValue) {
  const value = String(rawValue ?? "unknown").trim().toUpperCase();
  const aliasMap = {
    "COASTAL FLATS": "COASTAL_PLAIN",
    COASTAL_FLATS: "COASTAL_PLAIN",
    COASTALPLAIN: "COASTAL_PLAIN",
    FARM_LAND: "FARMLAND"
  };
  return aliasMap[value] ?? value;
}

function normalizeBiomeAlias(rawValue) {
  const value = String(rawValue ?? "unknown").trim().toUpperCase();
  const aliasMap = {
    TEMPERATECOASTAL: "TEMPERATE_COASTAL",
    TEMPERATE_COAST: "TEMPERATE_COASTAL"
  };
  return aliasMap[value] ?? value;
}

function normalizeLandformAlias(rawValue) {
  const value = String(rawValue ?? "").trim().toLowerCase();
  const aliasMap = {
    shoreline: "coastline",
    coast: "coastline",
    foreshore: "coastline",
    protected_reserve: "reserve"
  };
  return aliasMap[value] ?? value;
}

function normalizePoiAlias(rawValue) {
  const value = String(rawValue ?? "").trim().toLowerCase();
  const aliasMap = {
    scenic_lookout: "lookout",
    lookout_point: "lookout",
    surf_beach: "beach",
    beachfront: "beach",
    coffee_shop: "cafe",
    cafe_shop: "cafe",
    light_house: "lighthouse",
    art_gallery: "gallery"
  };
  return aliasMap[value] ?? value;
}

function normalizeNaturalAlias(rawValue) {
  const value = String(rawValue ?? "").trim().toLowerCase();
  const aliasMap = {
    foreshore_park: "park",
    urban_park: "park",
    nature_reserve: "reserve",
    protected_reserve: "reserve",
    creek: "waterway",
    stream: "waterway",
    beachfront: "beach",
    woodland: "forest"
  };
  return aliasMap[value] ?? value;
}

function normalizeConfidence(rawValue) {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return 0.7;
  }
  if (numeric < 0) {
    return 0;
  }
  if (numeric > 1) {
    return 1;
  }
  return Math.round(numeric * 100) / 100;
}

function hasMetadataFields(feature, fieldNames) {
  return fieldNames.some((fieldName) => readProviderField(feature, [fieldName]) !== undefined);
}

function normalizeProviderGeometry(rawFeature) {
  if (rawFeature.geometry?.type && rawFeature.geometry?.coordinates) {
    if (rawFeature.geometry.type === "MultiLineString") {
      const firstSegment = rawFeature.geometry.coordinates[0];
      return {
        type: "LineString",
        coordinates: structuredClone(firstSegment ?? [])
      };
    }
    return structuredClone(rawFeature.geometry);
  }

  if (rawFeature.geometryFormat === "polyline" && Array.isArray(rawFeature.points)) {
    return {
      type: "LineString",
      coordinates: structuredClone(rawFeature.points)
    };
  }

  if (rawFeature.geometryFormat === "bboxPolygon" && rawFeature.bbox) {
    const {
      minLongitude,
      maxLongitude,
      minLatitude,
      maxLatitude
    } = rawFeature.bbox;
    return {
      type: "Polygon",
      coordinates: [[
        [minLongitude, minLatitude],
        [maxLongitude, minLatitude],
        [maxLongitude, maxLatitude],
        [minLongitude, maxLatitude],
        [minLongitude, minLatitude]
      ]]
    };
  }

  if (rawFeature.geometryFormat === "pointTuple" && Array.isArray(rawFeature.point)) {
    return {
      type: "Point",
      coordinates: structuredClone(rawFeature.point)
    };
  }

  return rawFeature.geometry ? structuredClone(rawFeature.geometry) : null;
}

function dedupePoiFeatures(features, warnings) {
  const byKey = new Map();
  let duplicatesResolvedCount = 0;

  for (const feature of sortById(features)) {
    const key = buildPoiDeduplicationKey(feature);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, feature);
      continue;
    }

    duplicatesResolvedCount += 1;
    warnings.push(
      createWarning(
        "DUPLICATE_POI_RESOLVED",
        feature.id,
        `Duplicate POI ${feature.id} resolved deterministically against ${existing.id}.`
      )
    );

    const existingConfidence = normalizeConfidence(existing.properties.mappingConfidence);
    const currentConfidence = normalizeConfidence(feature.properties.mappingConfidence);
    if (currentConfidence > existingConfidence) {
      byKey.set(key, feature);
    }
  }

  return {
    poiFeatures: [...byKey.values()],
    duplicatesResolvedCount
  };
}

function buildPoiDeduplicationKey(feature) {
  const coordinates = Array.isArray(feature.geometry.coordinates)
    ? feature.geometry.coordinates.map((value) => roundCoordinate(value)).join(",")
    : String(feature.geometry.coordinates);
  return `${feature.type}|${feature.properties.poiType}|${coordinates}`;
}

function roundCoordinate(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return Math.round(numeric * 10000) / 10000;
}

function countLowConfidenceFeatures(sourceDataBundle) {
  return allSourceFeatures(sourceDataBundle).filter(
    (feature) => normalizeConfidence(feature.properties?.mappingConfidence) < 0.75
  ).length;
}

function createWarning(code, featureId, message) {
  return {
    code,
    featureId,
    message
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
