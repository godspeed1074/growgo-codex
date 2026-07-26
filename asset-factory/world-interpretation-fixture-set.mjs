import {
  createWorldInterpretationLayer,
  validateWorldInterpretationLayer,
  worldInterpretationEngineDefinition
} from "./world-interpretation-engine.mjs";

export const fixtureInterpretationValidationSchemaId =
  "FIXTURE_INTERPRETATION_VALIDATION_001";

export const realWorldInterpretationFixtureSetDefinition = deepFreeze({
  fixtureSetId: "REAL_WORLD_INTERPRETATION_FIXTURE_SET_001",
  fixtures: deepFreeze([
    deepFreeze({
      fixtureId: "COASTAL_TOWN_FIXTURE_001",
      description: "Phillip Island / Australian coastal town style",
      expectedClassification: deepFreeze(["COASTAL"]),
      expectedProfiles: deepFreeze(["AUSTRALIAN_COASTAL_WORLD"]),
      expectedGameplayTypes: deepFreeze([
        "COASTAL_EXPLORATION_OPPORTUNITY",
        "DISCOVERY_AND_QUEST_CANDIDATE",
        "WALKING_EXPLORATION_ROUTE"
      ]),
      expectedPresentationCategories: deepFreeze([
        "ROAD_PRESENTATION",
        "WATERFRONT_PRESENTATION",
        "GREEN_SPACE_PRESENTATION"
      ]),
      input: createFixtureInput({
        interpretationSeed: "COASTAL_TOWN_FIXTURE_001",
        coastlineDistance: 450,
        elevationBands: [{ sourceId: "ELEVATION_COASTAL_001", averageMeters: 35, maxMeters: 70 }],
        terrainType: "COASTAL_PLAIN",
        biomeType: "TEMPERATE_COASTAL",
        protectedAreaType: "COASTAL_RESERVE",
        roadDensity: 0.56,
        transportIntensity: 0.44,
        averageRoadDistanceKm: 7,
        roads: [
          { sourceId: "ROAD_COASTAL_001", roadClass: "PRIMARY_COASTAL" },
          { sourceId: "ROAD_COASTAL_002", roadClass: "LOCAL" }
        ],
        trails: [{ sourceId: "TRAIL_COASTAL_001", trailType: "FORESHORE_WALK" }],
        paths: [{ sourceId: "PATH_COASTAL_001", pathType: "BEACH_ACCESS" }],
        transportRoutes: [{ sourceId: "TRANSPORT_COASTAL_001", routeType: "SCENIC_COASTAL" }],
        towns: [{ sourceId: "TOWN_COASTAL_001", name: "Coastal Town" }],
        suburbs: [{ sourceId: "SUBURB_COASTAL_001", name: "Foreshore" }],
        settlementDensity: 0.46,
        landmarks: [{ sourceId: "LANDMARK_COASTAL_001", poiType: "LOOKOUT" }],
        attractions: [
          { sourceId: "ATTRACTION_COASTAL_001", poiType: "BEACH" },
          { sourceId: "ATTRACTION_COASTAL_002", poiType: "PIER" }
        ],
        services: [{ sourceId: "SERVICE_COASTAL_001", poiType: "CAFE" }],
        culturalLocations: [{ sourceId: "CULTURE_COASTAL_001", poiType: "HISTORIC_SITE" }],
        beaches: [{ sourceId: "BEACH_COASTAL_001", featureType: "SURF_BEACH" }],
        parks: [{ sourceId: "PARK_COASTAL_001", featureType: "FORESHORE_PARK" }],
        reserves: [{ sourceId: "RESERVE_COASTAL_001", featureType: "NATURE_RESERVE" }],
        naturalAttractions: [
          { sourceId: "NATURAL_COASTAL_001", featureType: "CLIFF_LOOKOUT" }
        ]
      })
    }),
    deepFreeze({
      fixtureId: "RURAL_REGION_FIXTURE_001",
      description: "Australian farming / rural area",
      expectedClassification: deepFreeze(["RURAL", "REMOTE"]),
      expectedProfiles: deepFreeze(["AUSTRALIAN_OUTBACK_WORLD"]),
      expectedGameplayTypes: deepFreeze([
        "DISCOVERY_AND_QUEST_CANDIDATE",
        "SETTLEMENT_HUB_OPPORTUNITY"
      ]),
      expectedPresentationCategories: deepFreeze([
        "ROAD_PRESENTATION",
        "BUILDING_PRESENTATION"
      ]),
      input: createFixtureInput({
        interpretationSeed: "RURAL_REGION_FIXTURE_001",
        coastlineDistance: null,
        elevationBands: [{ sourceId: "ELEVATION_RURAL_001", averageMeters: 120, maxMeters: 180 }],
        terrainType: "FARMLAND",
        biomeType: "TEMPERATE_FARMLAND",
        protectedAreaType: "RIVER_RESERVE",
        roadDensity: 0.2,
        transportIntensity: 0.18,
        averageRoadDistanceKm: 21,
        roads: [
          { sourceId: "ROAD_RURAL_001", roadClass: "RURAL_HIGHWAY" },
          { sourceId: "ROAD_RURAL_002", roadClass: "LOCAL" }
        ],
        trails: [],
        paths: [],
        transportRoutes: [{ sourceId: "TRANSPORT_RURAL_001", routeType: "RURAL_CONNECTOR" }],
        towns: [{ sourceId: "TOWN_RURAL_001", name: "Farm Service Town" }],
        villages: [{ sourceId: "VILLAGE_RURAL_001", name: "Hamlet" }],
        settlementDensity: 0.18,
        landmarks: [{ sourceId: "LANDMARK_RURAL_001", poiType: "SILO_LOOKOUT" }],
        attractions: [],
        services: [{ sourceId: "SERVICE_RURAL_001", poiType: "GENERAL_STORE" }],
        culturalLocations: [],
        beaches: [],
        parks: [],
        reserves: [{ sourceId: "RESERVE_RURAL_001", featureType: "RIVER_RESERVE" }],
        naturalAttractions: [{ sourceId: "NATURAL_RURAL_001", featureType: "RIVER_BEND" }]
      })
    }),
    deepFreeze({
      fixtureId: "ALPINE_REGION_FIXTURE_001",
      description: "Mountain / nature area",
      expectedClassification: deepFreeze(["MOUNTAIN"]),
      expectedProfiles: deepFreeze(["ALPINE_WORLD"]),
      expectedGameplayTypes: deepFreeze([
        "WALKING_EXPLORATION_ROUTE",
        "DISCOVERY_AND_QUEST_CANDIDATE"
      ]),
      expectedPresentationCategories: deepFreeze([
        "TRAIL_PRESENTATION",
        "GREEN_SPACE_PRESENTATION"
      ]),
      input: createFixtureInput({
        interpretationSeed: "ALPINE_REGION_FIXTURE_001",
        coastlineDistance: null,
        elevationBands: [{ sourceId: "ELEVATION_ALPINE_001", averageMeters: 1180, maxMeters: 1680 }],
        terrainType: "ALPINE_RIDGE",
        biomeType: "ALPINE_FOREST",
        protectedAreaType: "NATIONAL_PARK",
        roadDensity: 0.26,
        transportIntensity: 0.22,
        averageRoadDistanceKm: 15,
        roads: [{ sourceId: "ROAD_ALPINE_001", roadClass: "MOUNTAIN_ACCESS" }],
        trails: [
          { sourceId: "TRAIL_ALPINE_001", trailType: "HIKING" },
          { sourceId: "TRAIL_ALPINE_002", trailType: "SUMMIT_WALK" }
        ],
        paths: [],
        transportRoutes: [],
        towns: [],
        villages: [{ sourceId: "VILLAGE_ALPINE_001", name: "Trailhead" }],
        settlementDensity: 0.16,
        landmarks: [{ sourceId: "LANDMARK_ALPINE_001", poiType: "LOOKOUT" }],
        attractions: [{ sourceId: "ATTRACTION_ALPINE_001", poiType: "WATERFALL" }],
        services: [],
        culturalLocations: [],
        beaches: [],
        parks: [{ sourceId: "PARK_ALPINE_001", featureType: "MOUNTAIN_PARK" }],
        forests: [{ sourceId: "FOREST_ALPINE_001", featureType: "ALPINE_FOREST" }],
        reserves: [{ sourceId: "RESERVE_ALPINE_001", featureType: "PROTECTED_AREA" }],
        naturalAttractions: [{ sourceId: "NATURAL_ALPINE_001", featureType: "SUMMIT" }]
      })
    }),
    deepFreeze({
      fixtureId: "TOURISM_AREA_FIXTURE_001",
      description: "Tourist destination area",
      expectedClassification: deepFreeze(["TOURISM"]),
      expectedProfiles: deepFreeze(["TOURISM_ARCHIPELAGO_WORLD"]),
      expectedGameplayTypes: deepFreeze([
        "COASTAL_EXPLORATION_OPPORTUNITY",
        "DISCOVERY_AND_QUEST_CANDIDATE"
      ]),
      expectedPresentationCategories: deepFreeze([
        "WATERFRONT_PRESENTATION",
        "LANDMARK_PRESENTATION",
        "ROAD_PRESENTATION"
      ]),
      input: createFixtureInput({
        interpretationSeed: "TOURISM_AREA_FIXTURE_001",
        coastlineDistance: 700,
        elevationBands: [{ sourceId: "ELEVATION_TOURISM_001", averageMeters: 55, maxMeters: 110 }],
        terrainType: "ISLAND_COAST",
        biomeType: "TEMPERATE_COASTAL",
        protectedAreaType: "SCENIC_RESERVE",
        roadDensity: 0.48,
        transportIntensity: 0.55,
        averageRoadDistanceKm: 8,
        roads: [{ sourceId: "ROAD_TOURISM_001", roadClass: "SCENIC" }],
        trails: [{ sourceId: "TRAIL_TOURISM_001", trailType: "BOARDWALK" }],
        paths: [],
        transportRoutes: [{ sourceId: "TRANSPORT_TOURISM_001", routeType: "FERRY_ACCESS" }],
        towns: [{ sourceId: "TOWN_TOURISM_001", name: "Island Hub" }],
        settlementDensity: 0.4,
        landmarks: [
          { sourceId: "LANDMARK_TOURISM_001", poiType: "LIGHTHOUSE" },
          { sourceId: "LANDMARK_TOURISM_002", poiType: "LOOKOUT" }
        ],
        attractions: [
          { sourceId: "ATTRACTION_TOURISM_001", poiType: "BEACH" },
          { sourceId: "ATTRACTION_TOURISM_002", poiType: "PIER" },
          { sourceId: "ATTRACTION_TOURISM_003", poiType: "ISLAND_TOUR" }
        ],
        services: [
          { sourceId: "SERVICE_TOURISM_001", poiType: "HOTEL" },
          { sourceId: "SERVICE_TOURISM_002", poiType: "CAFE" }
        ],
        culturalLocations: [{ sourceId: "CULTURE_TOURISM_001", poiType: "MUSEUM" }],
        beaches: [{ sourceId: "BEACH_TOURISM_001", featureType: "TOURIST_BEACH" }],
        parks: [{ sourceId: "PARK_TOURISM_001", featureType: "SCENIC_PARK" }],
        reserves: [{ sourceId: "RESERVE_TOURISM_001", featureType: "SCENIC_RESERVE" }],
        naturalAttractions: [{ sourceId: "NATURAL_TOURISM_001", featureType: "SEA_ARCH" }]
      })
    }),
    deepFreeze({
      fixtureId: "URBAN_AREA_FIXTURE_001",
      description: "City / suburban area",
      expectedClassification: deepFreeze(["URBAN"]),
      expectedProfiles: deepFreeze(["METROPOLITAN_EXPANSION_WORLD"]),
      expectedGameplayTypes: deepFreeze([
        "DISCOVERY_AND_QUEST_CANDIDATE",
        "SETTLEMENT_HUB_OPPORTUNITY"
      ]),
      expectedPresentationCategories: deepFreeze([
        "ROAD_PRESENTATION",
        "BUILDING_PRESENTATION",
        "LANDMARK_PRESENTATION"
      ]),
      input: createFixtureInput({
        interpretationSeed: "URBAN_AREA_FIXTURE_001",
        coastlineDistance: null,
        elevationBands: [{ sourceId: "ELEVATION_URBAN_001", averageMeters: 45, maxMeters: 90 }],
        terrainType: "URBAN_PLAIN",
        biomeType: "TEMPERATE_URBAN_EDGE",
        protectedAreaType: "CITY_PARK",
        roadDensity: 0.9,
        transportIntensity: 0.88,
        averageRoadDistanceKm: 4,
        roads: [
          { sourceId: "ROAD_URBAN_001", roadClass: "ARTERIAL" },
          { sourceId: "ROAD_URBAN_002", roadClass: "COLLECTOR" }
        ],
        trails: [],
        paths: [{ sourceId: "PATH_URBAN_001", pathType: "CITY_WALK" }],
        transportRoutes: [
          { sourceId: "TRANSPORT_URBAN_001", routeType: "RAIL" },
          { sourceId: "TRANSPORT_URBAN_002", routeType: "BUS_CORRIDOR" }
        ],
        cities: [{ sourceId: "CITY_URBAN_001", name: "Metro" }],
        suburbs: [
          { sourceId: "SUBURB_URBAN_001", name: "Inner" },
          { sourceId: "SUBURB_URBAN_002", name: "Outer" }
        ],
        settlementDensity: 0.89,
        landmarks: [{ sourceId: "LANDMARK_URBAN_001", poiType: "TOWER" }],
        attractions: [{ sourceId: "ATTRACTION_URBAN_001", poiType: "GALLERY" }],
        services: [
          { sourceId: "SERVICE_URBAN_001", poiType: "STATION" },
          { sourceId: "SERVICE_URBAN_002", poiType: "SHOPPING" }
        ],
        culturalLocations: [{ sourceId: "CULTURE_URBAN_001", poiType: "THEATRE" }],
        beaches: [],
        parks: [{ sourceId: "PARK_URBAN_001", featureType: "CITY_PARK" }],
        reserves: [],
        naturalAttractions: []
      })
    })
  ])
});

export function createRealWorldInterpretationFixtureValidation(
  rawDefinition = realWorldInterpretationFixtureSetDefinition
) {
  const definition = normalizeFixtureSetDefinition(rawDefinition);
  const fixtureResults = definition.fixtures.map((fixture) => {
    const interpretation = createWorldInterpretationLayer(fixture.input);
    const validation = validateWorldInterpretationLayer(interpretation);
    const classificationMatches = fixture.expectedClassification.includes(
      interpretation.classificationResults.primaryWorldType
    );
    const profileMatches = fixture.expectedProfiles.includes(
      interpretation.selectedEnvironmentProfile.profileId
    );
    const gameplayTraceabilityMatches = fixture.expectedGameplayTypes.every((type) =>
      interpretation.gameplayWeighting.some(
        (rule) =>
          rule.interpretedGameplayType === type &&
          Array.isArray(rule.sourceFeatureRefs) &&
          rule.sourceFeatureRefs.length > 0
      )
    );
    const atlasPresentationMatches = fixture.expectedPresentationCategories.every(
      (category) =>
        interpretation.atlasPresentationRules.some(
          (rule) =>
            rule.presentationCategory === category &&
            Array.isArray(rule.sourceFeatureRefs) &&
            rule.sourceFeatureRefs.length > 0
        )
    );
    const evidencePresent =
      interpretation.classificationResults.reasons.length > 0 &&
      interpretation.classificationResults.sourceEvidence.length > 0;

    return deepFreeze({
      fixtureId: fixture.fixtureId,
      description: fixture.description,
      expectedClassification: fixture.expectedClassification,
      actualClassification: interpretation.classificationResults.primaryWorldType,
      confidenceScore: interpretation.classificationResults.confidenceScore,
      evidenceReasons: interpretation.classificationResults.reasons,
      selectedProfile: interpretation.selectedEnvironmentProfile.profileId,
      classificationMatches,
      profileMatches,
      gameplayTraceabilityMatches,
      atlasPresentationMatches,
      deterministicOutputValid: interpretation.validationState.deterministicOutputValid,
      evidencePresent,
      validationPassed:
        validation.ok &&
        classificationMatches &&
        profileMatches &&
        gameplayTraceabilityMatches &&
        atlasPresentationMatches &&
        evidencePresent,
      interpretation
    });
  });

  const summary = deepFreeze({
    fixtureCount: fixtureResults.length,
    passedCount: fixtureResults.filter((result) => result.validationPassed).length,
    deterministicOutputValid: fixtureResults.every(
      (result) => result.deterministicOutputValid === true
    ),
    allFixturesPassed: fixtureResults.every((result) => result.validationPassed === true)
  });

  const output = deepFreeze({
    schemaId: fixtureInterpretationValidationSchemaId,
    fixtureSetId: definition.fixtureSetId,
    fixtureResults,
    summary
  });

  const validation = validateRealWorldInterpretationFixtureValidation(output);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return output;
}

export function validateRealWorldInterpretationFixtureValidation(rawValidation) {
  try {
    const validation = normalizeFixtureValidation(rawValidation);
    if (validation.schemaId !== fixtureInterpretationValidationSchemaId) {
      throw createValidationError(
        "invalid_fixture_validation_schema_id",
        `Expected schemaId ${fixtureInterpretationValidationSchemaId}.`
      );
    }
    if (validation.summary.fixtureCount !== validation.fixtureResults.length) {
      throw createValidationError(
        "fixture_count_mismatch",
        "Fixture interpretation validation summary.fixtureCount must match fixtureResults length."
      );
    }
    for (const fixtureResult of validation.fixtureResults) {
      if (fixtureResult.classificationMatches !== true) {
        throw createValidationError(
          "fixture_classification_mismatch",
          `Fixture ${fixtureResult.fixtureId} did not match expected classification.`
        );
      }
      if (fixtureResult.profileMatches !== true) {
        throw createValidationError(
          "fixture_profile_mismatch",
          `Fixture ${fixtureResult.fixtureId} did not match expected profile.`
        );
      }
      if (fixtureResult.gameplayTraceabilityMatches !== true) {
        throw createValidationError(
          "fixture_gameplay_traceability_invalid",
          `Fixture ${fixtureResult.fixtureId} did not preserve gameplay traceability.`
        );
      }
      if (fixtureResult.atlasPresentationMatches !== true) {
        throw createValidationError(
          "fixture_atlas_presentation_invalid",
          `Fixture ${fixtureResult.fixtureId} did not preserve Atlas presentation mapping.`
        );
      }
      if (fixtureResult.evidencePresent !== true) {
        throw createValidationError(
          "fixture_evidence_missing",
          `Fixture ${fixtureResult.fixtureId} must include evidence reasons and source evidence.`
        );
      }
      if (fixtureResult.deterministicOutputValid !== true) {
        throw createValidationError(
          "fixture_determinism_invalid",
          `Fixture ${fixtureResult.fixtureId} must remain deterministic.`
        );
      }
    }
    if (validation.summary.allFixturesPassed !== true) {
      throw createValidationError(
        "fixture_summary_failed",
        "Fixture interpretation validation summary.allFixturesPassed must be true."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      fixtureInterpretationValidation: validation
    });
  } catch (error) {
    if (error?.name !== "WorldInterpretationFixtureSetValidationError") {
      throw error;
    }
    return deepFreeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      fixtureInterpretationValidation: null
    });
  }
}

function normalizeFixtureSetDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "realWorldInterpretationFixtureSetDefinition");
  if (
    typeof definition.fixtureSetId !== "string" ||
    definition.fixtureSetId.trim().length === 0
  ) {
    throw createValidationError(
      "invalid_fixture_set_id",
      "realWorldInterpretationFixtureSetDefinition.fixtureSetId must be a non-empty string."
    );
  }
  if (!Array.isArray(definition.fixtures) || definition.fixtures.length === 0) {
    throw createValidationError(
      "missing_fixtures",
      "realWorldInterpretationFixtureSetDefinition.fixtures must be a non-empty array."
    );
  }
  return definition;
}

function normalizeFixtureValidation(rawValidation) {
  const validation = asPlainObject(rawValidation, "fixtureInterpretationValidation");
  if (!Array.isArray(validation.fixtureResults)) {
    throw createValidationError(
      "invalid_fixture_results",
      "fixtureInterpretationValidation.fixtureResults must be an array."
    );
  }
  return validation;
}

function createFixtureInput({
  interpretationSeed,
  coastlineDistance,
  elevationBands,
  terrainType,
  biomeType,
  protectedAreaType,
  roadDensity,
  transportIntensity,
  averageRoadDistanceKm = 8,
  roads = [],
  trails = [],
  paths = [],
  transportRoutes = [],
  cities = [],
  towns = [],
  suburbs = [],
  villages = [],
  settlementDensity,
  landmarks = [],
  attractions = [],
  services = [],
  culturalLocations = [],
  beaches = [],
  parks = [],
  forests = [],
  reserves = [],
  naturalAttractions = []
}) {
  return deepFreeze({
    interpretationSeed,
    sourceDataReferences: deepFreeze({
      geographyInput: deepFreeze({
        schemaId: "GEOGRAPHY_INPUT_001",
        inputId: `${interpretationSeed}_GEOGRAPHY`,
        sourceProvider: "local_fixture_map_provider",
        boundary: deepFreeze({
          minLatitude: -39,
          maxLatitude: -37,
          minLongitude: 144,
          maxLongitude: 146
        }),
        coastlineFeatures:
          coastlineDistance == null
            ? deepFreeze([])
            : deepFreeze([
                deepFreeze({
                  sourceId: `${interpretationSeed}_COAST_001`,
                  distanceMeters: coastlineDistance,
                  featureType: "COASTLINE"
                })
              ]),
        riverFeatures: deepFreeze([]),
        elevationBands: deepFreeze(elevationBands.map((band) => deepFreeze({ ...band }))),
        terrainBands: deepFreeze([
          deepFreeze({ sourceId: `${interpretationSeed}_TERRAIN_001`, terrainType })
        ]),
        biomeClassification: deepFreeze([
          deepFreeze({ sourceId: `${interpretationSeed}_BIOME_001`, biomeType })
        ]),
        protectedAreaFeatures: deepFreeze([
          deepFreeze({
            sourceId: `${interpretationSeed}_PROTECTED_001`,
            featureType: protectedAreaType
          })
        ]),
        sourceMetadata: deepFreeze({
          datasetId: `${interpretationSeed}_DATASET`,
          deterministic: true
        })
      }),
      roadNetworkInput: deepFreeze({
        schemaId: "ROAD_NETWORK_INPUT_001",
        inputId: `${interpretationSeed}_ROADS`,
        sourceProvider: "local_fixture_map_provider",
        roadSegments: deepFreeze(roads.map((road) => deepFreeze({ ...road }))),
        trailSegments: deepFreeze(trails.map((trail) => deepFreeze({ ...trail }))),
        pathSegments: deepFreeze(paths.map((path) => deepFreeze({ ...path }))),
        transportRoutes: deepFreeze(
          transportRoutes.map((route) => deepFreeze({ ...route }))
        ),
        roadHierarchy: deepFreeze({
          roadDensity,
          transportIntensity,
          averageRoadDistanceKm
        }),
        sourceMetadata: deepFreeze({
          datasetId: `${interpretationSeed}_DATASET`,
          deterministic: true
        })
      }),
      settlementInput: deepFreeze({
        schemaId: "SETTLEMENT_INPUT_001",
        inputId: `${interpretationSeed}_SETTLEMENT`,
        sourceProvider: "local_fixture_map_provider",
        cityRecords: deepFreeze(cities.map((record) => deepFreeze({ ...record }))),
        townRecords: deepFreeze(towns.map((record) => deepFreeze({ ...record }))),
        suburbRecords: deepFreeze(suburbs.map((record) => deepFreeze({ ...record }))),
        villageRecords: deepFreeze(villages.map((record) => deepFreeze({ ...record }))),
        settlementDensity,
        sourceMetadata: deepFreeze({
          datasetId: `${interpretationSeed}_DATASET`,
          deterministic: true
        })
      }),
      poiInput: deepFreeze({
        schemaId: "POI_INPUT_001",
        inputId: `${interpretationSeed}_POI`,
        sourceProvider: "local_fixture_map_provider",
        landmarkRecords: deepFreeze(landmarks.map((record) => deepFreeze({ ...record }))),
        attractionRecords: deepFreeze(attractions.map((record) => deepFreeze({ ...record }))),
        serviceRecords: deepFreeze(services.map((record) => deepFreeze({ ...record }))),
        culturalLocationRecords: deepFreeze(
          culturalLocations.map((record) => deepFreeze({ ...record }))
        ),
        sourceMetadata: deepFreeze({
          datasetId: `${interpretationSeed}_DATASET`,
          deterministic: true
        })
      }),
      naturalFeatureInput: deepFreeze({
        schemaId: "NATURAL_FEATURE_INPUT_001",
        inputId: `${interpretationSeed}_NATURAL`,
        sourceProvider: "local_fixture_map_provider",
        beachFeatures: deepFreeze(beaches.map((feature) => deepFreeze({ ...feature }))),
        parkFeatures: deepFreeze(parks.map((feature) => deepFreeze({ ...feature }))),
        forestFeatures: deepFreeze(forests.map((feature) => deepFreeze({ ...feature }))),
        reserveFeatures: deepFreeze(reserves.map((feature) => deepFreeze({ ...feature }))),
        naturalAttractionRecords: deepFreeze(
          naturalAttractions.map((feature) => deepFreeze({ ...feature }))
        ),
        sourceMetadata: deepFreeze({
          datasetId: `${interpretationSeed}_DATASET`,
          deterministic: true
        })
      })
    })
  });
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${fieldName} must be a plain object.`
    );
  }
  return value;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const property of Object.values(value)) {
    deepFreeze(property);
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldInterpretationFixtureSetValidationError";
  error.code = code;
  return error;
}
