const worldInterpretationSchemaId = "WORLD_INTERPRETATION_LAYER_001";
const geographyInputSchemaId = "GEOGRAPHY_INPUT_001";
const roadNetworkInputSchemaId = "ROAD_NETWORK_INPUT_001";
const settlementInputSchemaId = "SETTLEMENT_INPUT_001";
const poiInputSchemaId = "POI_INPUT_001";
const naturalFeatureInputSchemaId = "NATURAL_FEATURE_INPUT_001";
const worldClassificationSchemaId = "WORLD_CLASSIFICATION_001";
const gameplayInterpretationRuleSchemaId = "GAMEPLAY_INTERPRETATION_RULE_001";
const atlasPresentationRuleSchemaId = "ATLAS_PRESENTATION_RULE_001";
const interpretationValidationSchemaId = "INTERPRETATION_VALIDATION_001";

const supportedClassificationTypes = Object.freeze([
  "COASTAL",
  "RURAL",
  "URBAN",
  "MOUNTAIN",
  "TOURISM",
  "REMOTE"
]);

const supportedWorldProfiles = Object.freeze([
  "AUSTRALIAN_COASTAL_WORLD",
  "AUSTRALIAN_OUTBACK_WORLD",
  "ALPINE_WORLD",
  "TOURISM_ARCHIPELAGO_WORLD",
  "METROPOLITAN_EXPANSION_WORLD"
]);

const presentationCategories = new Set([
  "ROAD_PRESENTATION",
  "GREEN_SPACE_PRESENTATION",
  "WATERFRONT_PRESENTATION",
  "BUILDING_PRESENTATION",
  "TRAIL_PRESENTATION",
  "LANDMARK_PRESENTATION"
]);

const worldProfileByClassification = deepFreeze({
  COASTAL: "AUSTRALIAN_COASTAL_WORLD",
  REMOTE: "AUSTRALIAN_OUTBACK_WORLD",
  MOUNTAIN: "ALPINE_WORLD",
  TOURISM: "TOURISM_ARCHIPELAGO_WORLD",
  URBAN: "METROPOLITAN_EXPANSION_WORLD",
  RURAL: "AUSTRALIAN_OUTBACK_WORLD"
});

export const worldInterpretationEngineRequiredFields = Object.freeze([
  "sourceDataReferences",
  "classificationResults",
  "selectedEnvironmentProfile",
  "gameplayWeighting",
  "atlasPresentationRules",
  "validationState"
]);

export const worldInterpretationEngineDefinition = deepFreeze({
  interpretationSeed: "WORLD_INTERPRETATION_SEED_001",
  sourceDataReferences: deepFreeze({
    geographyInput: deepFreeze({
      schemaId: geographyInputSchemaId,
      inputId: "GEOGRAPHY_INPUT_001_SAMPLE",
      sourceProvider: "local_fixture_map_provider",
      boundary: deepFreeze({
        minLatitude: -38.5,
        maxLatitude: -38.1,
        minLongitude: 144.9,
        maxLongitude: 145.3
      }),
      coastlineFeatures: deepFreeze([
        deepFreeze({ sourceId: "COAST_001", distanceMeters: 500, featureType: "COASTLINE" })
      ]),
      riverFeatures: deepFreeze([
        deepFreeze({ sourceId: "RIVER_001", featureType: "RIVER" })
      ]),
      elevationBands: deepFreeze([
        deepFreeze({ sourceId: "ELEVATION_001", averageMeters: 40, maxMeters: 85 })
      ]),
      terrainBands: deepFreeze([
        deepFreeze({ sourceId: "TERRAIN_001", terrainType: "COASTAL_PLAIN" })
      ]),
      biomeClassification: deepFreeze([
        deepFreeze({ sourceId: "BIOME_001", biomeType: "TEMPERATE_COASTAL" })
      ]),
      protectedAreaFeatures: deepFreeze([
        deepFreeze({ sourceId: "PROTECTED_001", featureType: "COASTAL_RESERVE" })
      ]),
      sourceMetadata: deepFreeze({
        datasetId: "LOCAL_MAP_FIXTURE_001",
        deterministic: true
      })
    }),
    roadNetworkInput: deepFreeze({
      schemaId: roadNetworkInputSchemaId,
      inputId: "ROAD_NETWORK_INPUT_001_SAMPLE",
      sourceProvider: "local_fixture_map_provider",
      roadSegments: deepFreeze([
        deepFreeze({ sourceId: "ROAD_001", roadClass: "PRIMARY" }),
        deepFreeze({ sourceId: "ROAD_002", roadClass: "LOCAL" })
      ]),
      trailSegments: deepFreeze([
        deepFreeze({ sourceId: "TRAIL_001", trailType: "WALKING" })
      ]),
      pathSegments: deepFreeze([
        deepFreeze({ sourceId: "PATH_001", pathType: "FORESHORE" })
      ]),
      transportRoutes: deepFreeze([
        deepFreeze({ sourceId: "TRANSPORT_001", routeType: "SCENIC_COASTAL" })
      ]),
      roadHierarchy: deepFreeze({
        roadDensity: 0.58,
        transportIntensity: 0.42
      }),
      sourceMetadata: deepFreeze({
        datasetId: "LOCAL_MAP_FIXTURE_001",
        deterministic: true
      })
    }),
    settlementInput: deepFreeze({
      schemaId: settlementInputSchemaId,
      inputId: "SETTLEMENT_INPUT_001_SAMPLE",
      sourceProvider: "local_fixture_map_provider",
      cityRecords: deepFreeze([]),
      townRecords: deepFreeze([
        deepFreeze({ sourceId: "TOWN_001", name: "Coastal Town" })
      ]),
      suburbRecords: deepFreeze([
        deepFreeze({ sourceId: "SUBURB_001", name: "Foreshore" })
      ]),
      villageRecords: deepFreeze([]),
      settlementDensity: 0.44,
      sourceMetadata: deepFreeze({
        datasetId: "LOCAL_MAP_FIXTURE_001",
        deterministic: true
      })
    }),
    poiInput: deepFreeze({
      schemaId: poiInputSchemaId,
      inputId: "POI_INPUT_001_SAMPLE",
      sourceProvider: "local_fixture_map_provider",
      landmarkRecords: deepFreeze([
        deepFreeze({ sourceId: "LANDMARK_001", poiType: "LOOKOUT" })
      ]),
      attractionRecords: deepFreeze([
        deepFreeze({ sourceId: "ATTRACTION_001", poiType: "BEACH" })
      ]),
      serviceRecords: deepFreeze([
        deepFreeze({ sourceId: "SERVICE_001", poiType: "CAFE" })
      ]),
      culturalLocationRecords: deepFreeze([
        deepFreeze({ sourceId: "CULTURE_001", poiType: "HISTORIC_SITE" })
      ]),
      sourceMetadata: deepFreeze({
        datasetId: "LOCAL_MAP_FIXTURE_001",
        deterministic: true
      })
    }),
    naturalFeatureInput: deepFreeze({
      schemaId: naturalFeatureInputSchemaId,
      inputId: "NATURAL_FEATURE_INPUT_001_SAMPLE",
      sourceProvider: "local_fixture_map_provider",
      beachFeatures: deepFreeze([
        deepFreeze({ sourceId: "BEACH_001", featureType: "SURF_BEACH" })
      ]),
      parkFeatures: deepFreeze([
        deepFreeze({ sourceId: "PARK_001", featureType: "FORESHORE_PARK" })
      ]),
      forestFeatures: deepFreeze([]),
      reserveFeatures: deepFreeze([
        deepFreeze({ sourceId: "RESERVE_001", featureType: "NATURE_RESERVE" })
      ]),
      naturalAttractionRecords: deepFreeze([
        deepFreeze({ sourceId: "NATURAL_ATTRACTION_001", featureType: "CLIFF_LOOKOUT" })
      ]),
      sourceMetadata: deepFreeze({
        datasetId: "LOCAL_MAP_FIXTURE_001",
        deterministic: true
      })
    })
  })
});

export function createWorldInterpretationLayer(
  rawDefinition = worldInterpretationEngineDefinition
) {
  const normalized = normalizeInterpretationDefinition(rawDefinition);
  const inputMetrics = buildInputMetrics(normalized.sourceDataReferences);
  const classificationResults = buildWorldClassification(inputMetrics);
  const selectedEnvironmentProfile = buildSelectedEnvironmentProfile(classificationResults);
  const gameplayWeighting = buildGameplayInterpretationRules(normalized.sourceDataReferences);
  const atlasPresentationRules = buildAtlasPresentationRules(normalized.sourceDataReferences);

  const baseOutput = deepFreeze({
    schemaId: worldInterpretationSchemaId,
    interpretationId: createInterpretationId(
      normalized.interpretationSeed,
      normalized.sourceDataReferences
    ),
    interpretationSeed: normalized.interpretationSeed,
    sourceDataReferences: normalized.sourceDataReferences,
    classificationResults,
    selectedEnvironmentProfile,
    gameplayWeighting,
    atlasPresentationRules,
    validationState: null
  });

  const validationState = buildInterpretationValidation(baseOutput);
  const finalized = deepFreeze({
    ...baseOutput,
    validationState
  });

  const validation = validateWorldInterpretationLayer(finalized);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return finalized;
}

export function validateWorldInterpretationLayer(rawInterpretation) {
  try {
    const interpretation = normalizeCreatedInterpretation(rawInterpretation);

    validateSourceReferences(interpretation.sourceDataReferences);
    validateClassificationResults(interpretation.classificationResults);
    validateSelectedEnvironmentProfile(interpretation.selectedEnvironmentProfile);
    validateGameplayWeighting(interpretation.gameplayWeighting);
    validateAtlasPresentationRules(interpretation.atlasPresentationRules);

    for (const key of [
      "sourceIntegrityValid",
      "classificationExplainable",
      "gameplayTraceabilityValid",
      "presentationTraceabilityValid",
      "deterministicOutputValid",
      "validationPassed"
    ]) {
      if (interpretation.validationState[key] !== true) {
        throw createValidationError(
          "validation_state_invalid",
          `World interpretation validationState ${key} must be true.`
        );
      }
    }

    const deterministicHash = computeDeterministicSignatureHash(interpretation);
    if (deterministicHash !== interpretation.validationState.deterministicSignatureHash) {
      throw createValidationError(
        "deterministic_signature_mismatch",
        "World interpretation deterministic signature hash does not match the generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      worldInterpretationLayer: interpretation
    });
  } catch (error) {
    if (error?.name !== "WorldInterpretationEngineValidationError") {
      throw error;
    }
    return deepFreeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldInterpretationLayer: null
    });
  }
}

function buildWorldClassification(inputMetrics) {
  const evidence = {
    COASTAL: [],
    RURAL: [],
    URBAN: [],
    MOUNTAIN: [],
    TOURISM: [],
    REMOTE: []
  };

  let coastalScore = 0;
  let ruralScore = 0;
  let urbanScore = 0;
  let mountainScore = 0;
  let tourismScore = 0;
  let remoteScore = 0;

  if (inputMetrics.coastlineDistance <= 1000) {
    coastalScore += 0.5;
    evidence.COASTAL.push("near coastline");
  }
  if (inputMetrics.beachCount > 0 || inputMetrics.beachPOIs > 0) {
    coastalScore += 0.25;
    tourismScore += 0.15;
    evidence.COASTAL.push("beach features detected");
    evidence.TOURISM.push("beach attraction detected");
  }
  if (inputMetrics.marineFeatureCount > 0) {
    coastalScore += 0.2;
    tourismScore += 0.1;
    evidence.COASTAL.push("marine features detected");
  }
  if (inputMetrics.elevation >= 900) {
    mountainScore += 0.55;
    evidence.MOUNTAIN.push("high elevation detected");
  }
  if (inputMetrics.forestCount > 0) {
    mountainScore += 0.15;
    tourismScore += 0.05;
    evidence.MOUNTAIN.push("forest terrain present");
  }
  if (inputMetrics.trailCount > 0) {
    mountainScore += 0.15;
    tourismScore += 0.1;
    evidence.MOUNTAIN.push("trails detected");
    evidence.TOURISM.push("recreation trails detected");
  }
  if (inputMetrics.settlementDensity >= 0.75 || inputMetrics.cityCount > 0) {
    urbanScore += 0.5;
    evidence.URBAN.push("high settlement density");
  }
  if (inputMetrics.roadDensity >= 0.75 || inputMetrics.transportIntensity >= 0.7) {
    urbanScore += 0.25;
    evidence.URBAN.push("high transport intensity");
  }
  if (inputMetrics.tourismPOICount >= 3 || inputMetrics.attractionCount >= 3) {
    tourismScore += 0.45;
    evidence.TOURISM.push("attraction density detected");
  }
  if (inputMetrics.landmarkCount >= 2) {
    tourismScore += 0.2;
    evidence.TOURISM.push("landmark density detected");
  }
  if (inputMetrics.tourismPOICount >= 4 && inputMetrics.coastlineDistance <= 1500) {
    tourismScore += 0.15;
    evidence.TOURISM.push("visitor destination clustering near coastline");
  }
  if (inputMetrics.settlementDensity <= 0.35) {
    ruralScore += 0.25;
    remoteScore += 0.2;
    evidence.RURAL.push("low settlement density");
    evidence.REMOTE.push("low settlement density");
  }
  if (inputMetrics.roadDensity <= 0.35) {
    ruralScore += 0.15;
    remoteScore += 0.2;
    evidence.RURAL.push("low road density");
    evidence.REMOTE.push("low road density");
  }
  if (inputMetrics.averageRoadDistance >= 18) {
    remoteScore += 0.25;
    ruralScore += 0.1;
    evidence.REMOTE.push("long travel distances");
  }
  if (inputMetrics.villageCount + inputMetrics.townCount > 0 && inputMetrics.cityCount === 0) {
    ruralScore += 0.2;
    evidence.RURAL.push("small settlement pattern");
  }
  if (inputMetrics.serviceCount <= 1 && inputMetrics.averageRoadDistance >= 15) {
    remoteScore += 0.15;
    evidence.REMOTE.push("sparse services");
  }

  const scoreMap = deepFreeze({
    COASTAL: clamp01(roundNumber(coastalScore)),
    RURAL: clamp01(roundNumber(ruralScore)),
    URBAN: clamp01(roundNumber(urbanScore)),
    MOUNTAIN: clamp01(roundNumber(mountainScore)),
    TOURISM: clamp01(roundNumber(tourismScore)),
    REMOTE: clamp01(roundNumber(remoteScore))
  });

  const orderedScores = Object.entries(scoreMap).sort((left, right) =>
    right[1] - left[1] || left[0].localeCompare(right[0])
  );
  const primaryWorldType = orderedScores[0][0];
  const secondaryWorldTypes = orderedScores
    .slice(1)
    .filter((entry) => entry[1] >= 0.2)
    .map((entry) => entry[0]);

  const reasons = [
    ...evidence[primaryWorldType],
    ...secondaryWorldTypes.flatMap((type) => evidence[type].slice(0, 1))
  ].filter(Boolean);

  return deepFreeze({
    schemaId: worldClassificationSchemaId,
    classificationId: `WORLD_CLASSIFICATION_${primaryWorldType}_001`,
    worldTypeScores: scoreMap,
    primaryWorldType,
    secondaryWorldTypes: deepFreeze(secondaryWorldTypes),
    regionTypeHints: deepFreeze(resolveRegionTypeHints(primaryWorldType, secondaryWorldTypes)),
    gameplayEmphasisHints: deepFreeze(
      resolveGameplayEmphasisHints(primaryWorldType, secondaryWorldTypes)
    ),
    confidenceScore: roundNumber(orderedScores[0][1]),
    reasons: deepFreeze(reasons),
    sourceEvidence: deepFreeze(
      buildSourceEvidence(inputMetrics, evidence, primaryWorldType, secondaryWorldTypes)
    )
  });
}

function buildSelectedEnvironmentProfile(classificationResults) {
  const selectedProfile =
    worldProfileByClassification[classificationResults.primaryWorldType] ??
    "AUSTRALIAN_COASTAL_WORLD";

  return deepFreeze({
    profileId: selectedProfile,
    profileConfidence: classificationResults.confidenceScore,
    reasons: deepFreeze(classificationResults.reasons),
    classificationType: classificationResults.primaryWorldType
  });
}

function buildGameplayInterpretationRules(sourceDataReferences) {
  const rules = [];
  const { geographyInput, roadNetworkInput, settlementInput, poiInput, naturalFeatureInput } =
    sourceDataReferences;

  if (naturalFeatureInput.beachFeatures.length > 0 || geographyInput.coastlineFeatures.length > 0) {
    rules.push(
      deepFreeze({
        schemaId: gameplayInterpretationRuleSchemaId,
        ruleId: "GAMEPLAY_RULE_BEACH_001",
        sourceFeatureType: "BEACH",
        sourceFeatureRefs: deepFreeze(
          [
            ...naturalFeatureInput.beachFeatures.map((feature) => feature.sourceId),
            ...geographyInput.coastlineFeatures.map((feature) => feature.sourceId)
          ].filter(uniqueOnly)
        ),
        interpretedGameplayType: "COASTAL_EXPLORATION_OPPORTUNITY",
        achievementRules: deepFreeze(["COASTAL_ACHIEVEMENT"]),
        questRules: deepFreeze([]),
        collectionRules: deepFreeze(["COASTAL_COLLECTION_OPPORTUNITY"]),
        explorationRules: deepFreeze(["WATERFRONT_EXPLORATION_ROUTE"]),
        weighting: 0.82,
        traceability: deepFreeze({
          derivedFrom: "real_beach_or_coastline",
          evidence: "coastal source features preserved"
        })
      })
    );
  }

  if (poiInput.landmarkRecords.length > 0 || poiInput.culturalLocationRecords.length > 0) {
    rules.push(
      deepFreeze({
        schemaId: gameplayInterpretationRuleSchemaId,
        ruleId: "GAMEPLAY_RULE_LANDMARK_001",
        sourceFeatureType: "LANDMARK",
        sourceFeatureRefs: deepFreeze(
          [
            ...poiInput.landmarkRecords.map((feature) => feature.sourceId),
            ...poiInput.culturalLocationRecords.map((feature) => feature.sourceId)
          ].filter(uniqueOnly)
        ),
        interpretedGameplayType: "DISCOVERY_AND_QUEST_CANDIDATE",
        achievementRules: deepFreeze(["LANDMARK_ACHIEVEMENT"]),
        questRules: deepFreeze(["QUEST_CANDIDATE"]),
        collectionRules: deepFreeze([]),
        explorationRules: deepFreeze(["DISCOVERY_REWARD"]),
        weighting: 0.78,
        traceability: deepFreeze({
          derivedFrom: "real_landmark_records",
          evidence: "landmark and cultural POI source records preserved"
        })
      })
    );
  }

  if (roadNetworkInput.trailSegments.length > 0 || roadNetworkInput.pathSegments.length > 0) {
    rules.push(
      deepFreeze({
        schemaId: gameplayInterpretationRuleSchemaId,
        ruleId: "GAMEPLAY_RULE_TRAIL_001",
        sourceFeatureType: "TRAIL",
        sourceFeatureRefs: deepFreeze(
          [
            ...roadNetworkInput.trailSegments.map((feature) => feature.sourceId),
            ...roadNetworkInput.pathSegments.map((feature) => feature.sourceId)
          ].filter(uniqueOnly)
        ),
        interpretedGameplayType: "WALKING_EXPLORATION_ROUTE",
        achievementRules: deepFreeze([]),
        questRules: deepFreeze([]),
        collectionRules: deepFreeze([]),
        explorationRules: deepFreeze(["WALKING_CHALLENGE", "EXPLORATION_ROUTE"]),
        weighting: 0.71,
        traceability: deepFreeze({
          derivedFrom: "real_trail_and_path_segments",
          evidence: "walking route source geometry preserved"
        })
      })
    );
  }

  if (
    settlementInput.townRecords.length > 0 ||
    settlementInput.suburbRecords.length > 0 ||
    settlementInput.cityRecords.length > 0
  ) {
    rules.push(
      deepFreeze({
        schemaId: gameplayInterpretationRuleSchemaId,
        ruleId: "GAMEPLAY_RULE_SETTLEMENT_001",
        sourceFeatureType: "SETTLEMENT",
        sourceFeatureRefs: deepFreeze(
          [
            ...settlementInput.cityRecords.map((feature) => feature.sourceId),
            ...settlementInput.townRecords.map((feature) => feature.sourceId),
            ...settlementInput.suburbRecords.map((feature) => feature.sourceId),
            ...settlementInput.villageRecords.map((feature) => feature.sourceId)
          ].filter(uniqueOnly)
        ),
        interpretedGameplayType: "SETTLEMENT_HUB_OPPORTUNITY",
        achievementRules: deepFreeze(["HUB_VISIT_ACHIEVEMENT"]),
        questRules: deepFreeze(["SERVICE_HUB_QUEST_CANDIDATE"]),
        collectionRules: deepFreeze([]),
        explorationRules: deepFreeze(["ROUTE_CHECKPOINT"]),
        weighting: 0.68,
        traceability: deepFreeze({
          derivedFrom: "real_settlement_records",
          evidence: "settlement identities preserved"
        })
      })
    );
  }

  return deepFreeze(rules);
}

function buildAtlasPresentationRules(sourceDataReferences) {
  const rules = [];
  const { geographyInput, roadNetworkInput, settlementInput, poiInput, naturalFeatureInput } =
    sourceDataReferences;

  if (roadNetworkInput.roadSegments.length > 0) {
    rules.push(
      presentationRule(
        "ATLAS_RULE_ROAD_001",
        "ROAD",
        roadNetworkInput.roadSegments.map((segment) => segment.sourceId),
        "ROAD_PRESENTATION",
        "HIGH"
      )
    );
  }
  if (naturalFeatureInput.parkFeatures.length > 0 || naturalFeatureInput.reserveFeatures.length > 0) {
    rules.push(
      presentationRule(
        "ATLAS_RULE_GREEN_SPACE_001",
        "PARK",
        [
          ...naturalFeatureInput.parkFeatures.map((feature) => feature.sourceId),
          ...naturalFeatureInput.reserveFeatures.map((feature) => feature.sourceId)
        ],
        "GREEN_SPACE_PRESENTATION",
        "MEDIUM_HIGH"
      )
    );
  }
  if (geographyInput.coastlineFeatures.length > 0 || naturalFeatureInput.beachFeatures.length > 0) {
    rules.push(
      presentationRule(
        "ATLAS_RULE_WATERFRONT_001",
        "COASTLINE",
        [
          ...geographyInput.coastlineFeatures.map((feature) => feature.sourceId),
          ...naturalFeatureInput.beachFeatures.map((feature) => feature.sourceId)
        ],
        "WATERFRONT_PRESENTATION",
        "HIGH"
      )
    );
  }
  if (
    settlementInput.cityRecords.length > 0 ||
    settlementInput.townRecords.length > 0 ||
    settlementInput.suburbRecords.length > 0
  ) {
    rules.push(
      presentationRule(
        "ATLAS_RULE_BUILDING_001",
        "BUILDING_FOOTPRINT",
        [
          ...settlementInput.cityRecords.map((feature) => feature.sourceId),
          ...settlementInput.townRecords.map((feature) => feature.sourceId),
          ...settlementInput.suburbRecords.map((feature) => feature.sourceId)
        ],
        "BUILDING_PRESENTATION",
        "MEDIUM"
      )
    );
  }
  if (roadNetworkInput.trailSegments.length > 0 || roadNetworkInput.pathSegments.length > 0) {
    rules.push(
      presentationRule(
        "ATLAS_RULE_TRAIL_001",
        "TRAIL",
        [
          ...roadNetworkInput.trailSegments.map((feature) => feature.sourceId),
          ...roadNetworkInput.pathSegments.map((feature) => feature.sourceId)
        ],
        "TRAIL_PRESENTATION",
        "MEDIUM"
      )
    );
  }
  if (poiInput.landmarkRecords.length > 0) {
    rules.push(
      presentationRule(
        "ATLAS_RULE_LANDMARK_001",
        "LANDMARK",
        poiInput.landmarkRecords.map((feature) => feature.sourceId),
        "LANDMARK_PRESENTATION",
        "HIGH"
      )
    );
  }

  return deepFreeze(rules);
}

function buildInterpretationValidation(interpretation) {
  const sourceIntegrityValid = hasOnlySourceDerivedReferences(interpretation);
  const classificationExplainable =
    interpretation.classificationResults.reasons.length > 0 &&
    interpretation.classificationResults.sourceEvidence.length > 0;
  const gameplayTraceabilityValid = interpretation.gameplayWeighting.every(
    (rule) => rule.sourceFeatureRefs.length > 0 && rule.traceability.derivedFrom.length > 0
  );
  const presentationTraceabilityValid = interpretation.atlasPresentationRules.every(
    (rule) =>
      presentationCategories.has(rule.presentationCategory) &&
      rule.sourceFeatureRefs.length > 0
  );
  const validationWithoutHash = deepFreeze({
    schemaId: interpretationValidationSchemaId,
    validationId: `INTERPRETATION_VALIDATION_${interpretation.interpretationId}`,
    sourceIntegrityValid,
    classificationExplainable,
    gameplayTraceabilityValid,
    presentationTraceabilityValid,
    deterministicOutputValid: true,
    validationPassed: false,
    deterministicSignatureHash: 0,
    reasons: deepFreeze(buildValidationReasons({
      sourceIntegrityValid,
      classificationExplainable,
      gameplayTraceabilityValid,
      presentationTraceabilityValid
    }))
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash({
    ...interpretation,
    validationState: validationWithoutHash
  });

  const validationPassed = [
    sourceIntegrityValid,
    classificationExplainable,
    gameplayTraceabilityValid,
    presentationTraceabilityValid
  ].every(Boolean);

  return deepFreeze({
    ...validationWithoutHash,
    deterministicOutputValid: true,
    validationPassed,
    deterministicSignatureHash
  });
}

function normalizeInterpretationDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "worldInterpretationDefinition");
  return deepFreeze({
    interpretationSeed: normalizeString(
      definition.interpretationSeed ?? "WORLD_INTERPRETATION_SEED_001",
      "interpretationSeed"
    ),
    sourceDataReferences: normalizeSourceDataReferences(definition.sourceDataReferences)
  });
}

function normalizeCreatedInterpretation(rawInterpretation) {
  const interpretation = asPlainObject(rawInterpretation, "worldInterpretationLayer");
  if (interpretation.schemaId !== worldInterpretationSchemaId) {
    throw createValidationError(
      "invalid_world_interpretation_schema_id",
      `Expected schemaId ${worldInterpretationSchemaId}.`
    );
  }
  return interpretation;
}

function normalizeSourceDataReferences(rawReferences) {
  const references = asPlainObject(rawReferences, "sourceDataReferences");
  const geographyInput = normalizeInputContract(
    references.geographyInput,
    geographyInputSchemaId,
    "geographyInput"
  );
  const roadNetworkInput = normalizeInputContract(
    references.roadNetworkInput,
    roadNetworkInputSchemaId,
    "roadNetworkInput"
  );
  const settlementInput = normalizeInputContract(
    references.settlementInput,
    settlementInputSchemaId,
    "settlementInput"
  );
  const poiInput = normalizeInputContract(
    references.poiInput,
    poiInputSchemaId,
    "poiInput"
  );
  const naturalFeatureInput = normalizeInputContract(
    references.naturalFeatureInput,
    naturalFeatureInputSchemaId,
    "naturalFeatureInput"
  );

  return deepFreeze({
    geographyInput,
    roadNetworkInput,
    settlementInput,
    poiInput,
    naturalFeatureInput
  });
}

function normalizeInputContract(rawContract, expectedSchemaId, fieldName) {
  const contract = asPlainObject(rawContract, fieldName);
  if (normalizeString(contract.schemaId, `${fieldName}.schemaId`) !== expectedSchemaId) {
    throw createValidationError(
      "invalid_input_schema_id",
      `${fieldName}.schemaId must equal ${expectedSchemaId}.`
    );
  }
  return deepFreeze(contract);
}

function buildInputMetrics(sourceDataReferences) {
  const { geographyInput, roadNetworkInput, settlementInput, poiInput, naturalFeatureInput } =
    sourceDataReferences;
  return deepFreeze({
    coastlineDistance:
      geographyInput.coastlineFeatures[0]?.distanceMeters ?? Number.POSITIVE_INFINITY,
    marineFeatureCount: geographyInput.coastlineFeatures.length,
    elevation: Math.max(
      0,
      ...geographyInput.elevationBands.map((band) => band.maxMeters ?? band.averageMeters ?? 0)
    ),
    roadDensity: roadNetworkInput.roadHierarchy.roadDensity ?? 0,
    transportIntensity: roadNetworkInput.roadHierarchy.transportIntensity ?? 0,
    trailCount: roadNetworkInput.trailSegments.length,
    pathCount: roadNetworkInput.pathSegments.length,
    averageRoadDistance:
      roadNetworkInput.roadHierarchy.averageRoadDistanceKm ?? 8,
    cityCount: settlementInput.cityRecords.length,
    townCount: settlementInput.townRecords.length,
    suburbCount: settlementInput.suburbRecords.length,
    villageCount: settlementInput.villageRecords.length,
    settlementDensity: settlementInput.settlementDensity ?? 0,
    landmarkCount: poiInput.landmarkRecords.length,
    attractionCount: poiInput.attractionRecords.length,
    tourismPOICount:
      poiInput.attractionRecords.length + poiInput.culturalLocationRecords.length,
    serviceCount: poiInput.serviceRecords.length,
    beachPOIs: countByPredicate(
      poiInput.attractionRecords,
      (record) => String(record.poiType ?? "").includes("BEACH")
    ),
    beachCount: naturalFeatureInput.beachFeatures.length,
    forestCount: naturalFeatureInput.forestFeatures.length
  });
}

function buildSourceEvidence(inputMetrics, evidence, primaryWorldType, secondaryWorldTypes) {
  const evidenceEntries = [];
  for (const reason of evidence[primaryWorldType]) {
    evidenceEntries.push({
      classificationType: primaryWorldType,
      reason,
      metricSnapshot: deepFreeze({
        coastlineDistance: inputMetrics.coastlineDistance,
        elevation: inputMetrics.elevation,
        roadDensity: inputMetrics.roadDensity,
        settlementDensity: inputMetrics.settlementDensity,
        tourismPOICount: inputMetrics.tourismPOICount
      })
    });
  }
  for (const secondary of secondaryWorldTypes) {
    for (const reason of evidence[secondary].slice(0, 1)) {
      evidenceEntries.push({
        classificationType: secondary,
        reason,
        metricSnapshot: deepFreeze({
          coastlineDistance: inputMetrics.coastlineDistance,
          elevation: inputMetrics.elevation,
          roadDensity: inputMetrics.roadDensity,
          settlementDensity: inputMetrics.settlementDensity,
          tourismPOICount: inputMetrics.tourismPOICount
        })
      });
    }
  }
  return evidenceEntries.map((entry) => deepFreeze(entry));
}

function resolveRegionTypeHints(primaryWorldType, secondaryWorldTypes) {
  const hints = [primaryWorldType];
  for (const type of secondaryWorldTypes) {
    hints.push(type);
  }
  return hints.map((type) => `${type}_REGION_HINT`);
}

function resolveGameplayEmphasisHints(primaryWorldType, secondaryWorldTypes) {
  const hints = [];
  if (primaryWorldType === "COASTAL") {
    hints.push("WATERFRONT_EXPLORATION");
  }
  if (primaryWorldType === "REMOTE" || secondaryWorldTypes.includes("REMOTE")) {
    hints.push("LONG_DISTANCE_DISCOVERY");
  }
  if (primaryWorldType === "MOUNTAIN") {
    hints.push("ELEVATION_ROUTE_CHALLENGES");
  }
  if (primaryWorldType === "TOURISM" || secondaryWorldTypes.includes("TOURISM")) {
    hints.push("DESTINATION_COLLECTION_LOOPS");
  }
  if (primaryWorldType === "URBAN") {
    hints.push("MULTI_HUB_TRAVEL");
  }
  if (primaryWorldType === "RURAL") {
    hints.push("SERVICE_ROUTE_TRAVEL");
  }
  return hints;
}

function validateSourceReferences(sourceDataReferences) {
  for (const fieldName of [
    "geographyInput",
    "roadNetworkInput",
    "settlementInput",
    "poiInput",
    "naturalFeatureInput"
  ]) {
    const contract = sourceDataReferences[fieldName];
    if (typeof contract.inputId !== "string" || contract.inputId.length === 0) {
      throw createValidationError(
        "invalid_source_input_id",
        `World interpretation ${fieldName}.inputId must be present.`
      );
    }
  }
}

function validateClassificationResults(classificationResults) {
  if (classificationResults.schemaId !== worldClassificationSchemaId) {
    throw createValidationError(
      "invalid_classification_schema_id",
      `Expected schemaId ${worldClassificationSchemaId}.`
    );
  }
  if (!supportedClassificationTypes.includes(classificationResults.primaryWorldType)) {
    throw createValidationError(
      "unsupported_primary_world_type",
      `Primary world type ${classificationResults.primaryWorldType} is not supported.`
    );
  }
  if (classificationResults.confidenceScore <= 0) {
    throw createValidationError(
      "invalid_classification_confidence",
      "World classification confidenceScore must be positive."
    );
  }
}

function validateSelectedEnvironmentProfile(selectedEnvironmentProfile) {
  if (!supportedWorldProfiles.includes(selectedEnvironmentProfile.profileId)) {
    throw createValidationError(
      "unsupported_world_profile",
      `Selected environment profile ${selectedEnvironmentProfile.profileId} is not supported.`
    );
  }
  if (selectedEnvironmentProfile.profileConfidence <= 0) {
    throw createValidationError(
      "invalid_profile_confidence",
      "Selected environment profile confidence must be positive."
    );
  }
}

function validateGameplayWeighting(gameplayWeighting) {
  if (!Array.isArray(gameplayWeighting) || gameplayWeighting.length === 0) {
    throw createValidationError(
      "missing_gameplay_weighting_rules",
      "World interpretation must include gameplay weighting rules."
    );
  }
  for (const rule of gameplayWeighting) {
    if (rule.schemaId !== gameplayInterpretationRuleSchemaId) {
      throw createValidationError(
        "invalid_gameplay_rule_schema_id",
        `Expected schemaId ${gameplayInterpretationRuleSchemaId}.`
      );
    }
    if (!Array.isArray(rule.sourceFeatureRefs) || rule.sourceFeatureRefs.length === 0) {
      throw createValidationError(
        "gameplay_rule_missing_source_refs",
        `Gameplay rule ${rule.ruleId} must preserve source feature references.`
      );
    }
  }
}

function validateAtlasPresentationRules(atlasPresentationRules) {
  if (!Array.isArray(atlasPresentationRules) || atlasPresentationRules.length === 0) {
    throw createValidationError(
      "missing_atlas_presentation_rules",
      "World interpretation must include Atlas presentation rules."
    );
  }
  for (const rule of atlasPresentationRules) {
    if (rule.schemaId !== atlasPresentationRuleSchemaId) {
      throw createValidationError(
        "invalid_atlas_rule_schema_id",
        `Expected schemaId ${atlasPresentationRuleSchemaId}.`
      );
    }
    if (!presentationCategories.has(rule.presentationCategory)) {
      throw createValidationError(
        "unsupported_presentation_category",
        `Atlas presentation category ${rule.presentationCategory} is not supported.`
      );
    }
  }
}

function hasOnlySourceDerivedReferences(interpretation) {
  const sourceIdSet = collectSourceIds(interpretation.sourceDataReferences);
  return [
    ...interpretation.gameplayWeighting.flatMap((rule) => rule.sourceFeatureRefs),
    ...interpretation.atlasPresentationRules.flatMap((rule) => rule.sourceFeatureRefs)
  ].every((sourceId) => sourceIdSet.has(sourceId));
}

function collectSourceIds(sourceDataReferences) {
  const idSet = new Set();
  for (const collection of [
    sourceDataReferences.geographyInput.coastlineFeatures,
    sourceDataReferences.geographyInput.riverFeatures,
    sourceDataReferences.geographyInput.elevationBands,
    sourceDataReferences.geographyInput.terrainBands,
    sourceDataReferences.geographyInput.biomeClassification,
    sourceDataReferences.geographyInput.protectedAreaFeatures,
    sourceDataReferences.roadNetworkInput.roadSegments,
    sourceDataReferences.roadNetworkInput.trailSegments,
    sourceDataReferences.roadNetworkInput.pathSegments,
    sourceDataReferences.roadNetworkInput.transportRoutes,
    sourceDataReferences.settlementInput.cityRecords,
    sourceDataReferences.settlementInput.townRecords,
    sourceDataReferences.settlementInput.suburbRecords,
    sourceDataReferences.settlementInput.villageRecords,
    sourceDataReferences.poiInput.landmarkRecords,
    sourceDataReferences.poiInput.attractionRecords,
    sourceDataReferences.poiInput.serviceRecords,
    sourceDataReferences.poiInput.culturalLocationRecords,
    sourceDataReferences.naturalFeatureInput.beachFeatures,
    sourceDataReferences.naturalFeatureInput.parkFeatures,
    sourceDataReferences.naturalFeatureInput.forestFeatures,
    sourceDataReferences.naturalFeatureInput.reserveFeatures,
    sourceDataReferences.naturalFeatureInput.naturalAttractionRecords
  ]) {
    for (const item of collection) {
      if (typeof item.sourceId === "string") {
        idSet.add(item.sourceId);
      }
    }
  }
  return idSet;
}

function buildValidationReasons(checks) {
  const reasons = [];
  if (!checks.sourceIntegrityValid) {
    reasons.push("source references were not preserved");
  }
  if (!checks.classificationExplainable) {
    reasons.push("classification results were not explainable");
  }
  if (!checks.gameplayTraceabilityValid) {
    reasons.push("gameplay interpretation did not trace back to source features");
  }
  if (!checks.presentationTraceabilityValid) {
    reasons.push("Atlas presentation rules did not preserve source linkage");
  }
  if (reasons.length === 0) {
    reasons.push("all interpretation validation checks passed");
  }
  return reasons;
}

function presentationRule(ruleId, sourceFeatureType, refs, presentationCategory, presentationPriority) {
  return deepFreeze({
    schemaId: atlasPresentationRuleSchemaId,
    ruleId,
    sourceFeatureType,
    sourceFeatureRefs: deepFreeze(refs.filter(uniqueOnly)),
    presentationCategory,
    presentationPriority,
    styleProfile: "GROWGO_PAPERCUT_2_5D",
    geometryPreservationMode: "SOURCE_POSITION_PRESERVED",
    traceability: deepFreeze({
      derivedFrom: `real_${sourceFeatureType.toLowerCase()}_features`,
      evidence: "source feature references preserved"
    })
  });
}

function createInterpretationId(interpretationSeed, sourceDataReferences) {
  const stableId = stableHash(
    stableStringify({
      interpretationSeed,
      sourceDataReferences
    })
  );
  return `WORLD_INTERPRETATION_${stableId}`;
}

function computeDeterministicSignatureHash(interpretation) {
  return stableHash(
    stableStringify({
      ...interpretation,
      validationState: null
    })
  );
}

function countByPredicate(items, predicate) {
  return items.reduce((count, item) => count + (predicate(item) ? 1 : 0), 0);
}

function uniqueOnly(value, index, array) {
  return array.indexOf(value) === index;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
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

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function roundNumber(value) {
  return Number(value.toFixed(2));
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

function stableHash(input) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableStringify(value) {
  return JSON.stringify(orderKeys(value));
}

function orderKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => orderKeys(entry));
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = orderKeys(value[key]);
        return result;
      }, {});
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldInterpretationEngineValidationError";
  error.code = code;
  return error;
}
