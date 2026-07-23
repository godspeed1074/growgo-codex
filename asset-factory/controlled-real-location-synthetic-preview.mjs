import {
  buildControlledRealLocationDataBridgeContext,
  controlledRealLocationDataBridgeDefinition,
  createControlledRealLocationWorldRequest,
  validateControlledRealLocationDataBridge
} from "./controlled-real-location-data-bridge.mjs";
import {
  createDeterministicWorldInstanceId,
  validateWorldInstanceManagerFoundation
} from "./world-instance-manager-foundation.mjs";
import {
  validateWorldStreamingCoordinatorFoundation
} from "./world-streaming-coordinator-foundation.mjs";
import {
  validateWorldPipelineRendererBridge
} from "./world-pipeline-renderer-bridge.mjs";
import {
  validateSyntheticWorldActualCustom25DRenderVerification
} from "./synthetic-world-actual-custom-25d-render-verification.mjs";

export const controlledRealLocationSyntheticPreviewRequiredFields = Object.freeze([
  "previewId",
  "locationRequest",
  "expectedGeneratedAssetIds",
  "expectedRendererAssetIds",
  "expectedRendererProfile"
]);

export const controlledRealLocationSyntheticPreviewDefinition = deepFreeze({
  previewId: "CONTROLLED_REAL_LOCATION_SYNTHETIC_PREVIEW_001",
  locationRequest: deepFreeze({
    ...controlledRealLocationDataBridgeDefinition.locationRequest
  }),
  expectedGeneratedAssetIds: deepFreeze([
    "BUILDING_HOUSE_SMALL_COASTAL_001",
    "ROAD_STRAIGHT_SMALL_001",
    "TREE_EUCALYPTUS_001",
    "ROCK_COASTAL_001"
  ]),
  expectedRendererAssetIds: deepFreeze([
    "ROAD_STRAIGHT_SMALL_001",
    "BUILDING_HOUSE_SMALL_COASTAL_001",
    "TREE_EUCALYPTUS_001",
    "ROCK_COASTAL_001"
  ]),
  expectedRendererProfile: "custom-2.5d-passive"
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

const previewEnvironmentTemplates = deepFreeze({
  coastal: deepFreeze([
    createPreviewAssetTemplate({
      assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
      assetFamilyId: "BUILDING_HOUSE_SMALL_COASTAL_FAMILY_001",
      locationSuffix: "BUILDING_PLOT_001",
      placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
      priorityCategory: "buildings",
      state: "visible",
      coordinateOffset: { x: 1.5, y: 1.5 },
      terrainType: "grass",
      locationType: "building_plot",
      resolverAvailableAssetReferences: []
    }),
    createPreviewAssetTemplate({
      assetId: "ROAD_STRAIGHT_SMALL_001",
      assetFamilyId: "ROAD_STRAIGHT_SMALL_FAMILY_001",
      locationSuffix: "ROAD_SEGMENT_001",
      placementRuleId: "PLACEMENT_ROAD_SEGMENT_001",
      priorityCategory: "objectives",
      state: "ready",
      coordinateOffset: { x: 7, y: 0 },
      terrainType: "grass",
      locationType: "road_lane",
      resolverAvailableAssetReferences: []
    }),
    createPreviewAssetTemplate({
      assetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: "TREE_EUCALYPTUS_FAMILY_001",
      locationSuffix: "NATURE_CLUSTER_001",
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      priorityCategory: "environment_objects",
      state: "ready",
      coordinateOffset: { x: 11, y: 1 },
      terrainType: "grass",
      locationType: "nature_cluster",
      resolverAvailableAssetReferences: ["TREE_EUCALYPTUS_001"]
    }),
    createPreviewAssetTemplate({
      assetId: "ROCK_COASTAL_001",
      assetFamilyId: "ROCK_COASTAL_FAMILY_001",
      locationSuffix: "NATURE_CLUSTER_002",
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      priorityCategory: "environment_objects",
      state: "cached",
      coordinateOffset: { x: 18, y: 1 },
      terrainType: "grass",
      locationType: "nature_cluster",
      resolverAvailableAssetReferences: ["ROCK_COASTAL_001"]
    })
  ]),
  urban: deepFreeze([
    createPreviewAssetTemplate({
      assetId: "BUILDING_SHOP_GENERAL_001",
      assetFamilyId: "BUILDING_SHOP_GENERAL_FAMILY_001",
      locationSuffix: "BUILDING_PLOT_001",
      placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
      priorityCategory: "businesses",
      state: "visible",
      coordinateOffset: { x: 1, y: 1 },
      terrainType: "grass",
      locationType: "building_plot",
      resolverAvailableAssetReferences: []
    }),
    createPreviewAssetTemplate({
      assetId: "ROAD_INTERSECTION_SMALL_001",
      assetFamilyId: "ROAD_INTERSECTION_SMALL_FAMILY_001",
      locationSuffix: "ROAD_SEGMENT_001",
      placementRuleId: "PLACEMENT_ROAD_SEGMENT_001",
      priorityCategory: "objectives",
      state: "ready",
      coordinateOffset: { x: 6, y: 0 },
      terrainType: "grass",
      locationType: "road_lane",
      resolverAvailableAssetReferences: []
    }),
    createPreviewAssetTemplate({
      assetId: "LAMP_POST_BASIC_001",
      assetFamilyId: "LAMP_POST_BASIC_FAMILY_001",
      locationSuffix: "DECORATION_EDGE_001",
      placementRuleId: "PLACEMENT_DECORATION_EDGE_001",
      priorityCategory: "environment_objects",
      state: "ready",
      coordinateOffset: { x: 10, y: 1 },
      terrainType: "grass",
      locationType: "decoration_edge",
      resolverAvailableAssetReferences: []
    })
  ]),
  rural: deepFreeze([
    createPreviewAssetTemplate({
      assetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: "TREE_EUCALYPTUS_FAMILY_001",
      locationSuffix: "NATURE_CLUSTER_001",
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      priorityCategory: "environment_objects",
      state: "visible",
      coordinateOffset: { x: 2, y: 2 },
      terrainType: "grass",
      locationType: "nature_cluster",
      resolverAvailableAssetReferences: ["TREE_EUCALYPTUS_001"]
    }),
    createPreviewAssetTemplate({
      assetId: "ROCK_COASTAL_001",
      assetFamilyId: "ROCK_COASTAL_FAMILY_001",
      locationSuffix: "NATURE_CLUSTER_002",
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      priorityCategory: "environment_objects",
      state: "ready",
      coordinateOffset: { x: 8, y: 0 },
      terrainType: "grass",
      locationType: "nature_cluster",
      resolverAvailableAssetReferences: ["ROCK_COASTAL_001"]
    })
  ]),
  park: deepFreeze([
    createPreviewAssetTemplate({
      assetId: "BENCH_PARK_001",
      assetFamilyId: "BENCH_PARK_FAMILY_001",
      locationSuffix: "DECORATION_EDGE_001",
      placementRuleId: "PLACEMENT_DECORATION_EDGE_001",
      priorityCategory: "environment_objects",
      state: "visible",
      coordinateOffset: { x: 1, y: 1 },
      terrainType: "grass",
      locationType: "decoration_edge",
      resolverAvailableAssetReferences: []
    }),
    createPreviewAssetTemplate({
      assetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: "TREE_EUCALYPTUS_FAMILY_001",
      locationSuffix: "NATURE_CLUSTER_001",
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      priorityCategory: "environment_objects",
      state: "ready",
      coordinateOffset: { x: 7, y: 1 },
      terrainType: "grass",
      locationType: "nature_cluster",
      resolverAvailableAssetReferences: ["TREE_EUCALYPTUS_001"]
    })
  ]),
  water: deepFreeze([
    createPreviewAssetTemplate({
      assetId: "ROCK_COASTAL_001",
      assetFamilyId: "ROCK_COASTAL_FAMILY_001",
      locationSuffix: "SHORELINE_EDGE_001",
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      priorityCategory: "environment_objects",
      state: "visible",
      coordinateOffset: { x: 2, y: 1 },
      terrainType: "grass",
      locationType: "nature_cluster",
      resolverAvailableAssetReferences: ["ROCK_COASTAL_001"]
    }),
    createPreviewAssetTemplate({
      assetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: "TREE_EUCALYPTUS_FAMILY_001",
      locationSuffix: "SHORELINE_EDGE_002",
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      priorityCategory: "environment_objects",
      state: "ready",
      coordinateOffset: { x: 9, y: 1 },
      terrainType: "grass",
      locationType: "nature_cluster",
      resolverAvailableAssetReferences: ["TREE_EUCALYPTUS_001"]
    })
  ]),
  landmark_area: deepFreeze([
    createPreviewAssetTemplate({
      assetId: "SIGN_GENERIC_001",
      assetFamilyId: "SIGN_GENERIC_FAMILY_001",
      locationSuffix: "LANDMARK_EDGE_001",
      placementRuleId: "PLACEMENT_DECORATION_EDGE_001",
      priorityCategory: "objectives",
      state: "visible",
      coordinateOffset: { x: 1, y: 1 },
      terrainType: "grass",
      locationType: "decoration_edge",
      resolverAvailableAssetReferences: []
    }),
    createPreviewAssetTemplate({
      assetId: "ROAD_STRAIGHT_SMALL_001",
      assetFamilyId: "ROAD_STRAIGHT_SMALL_FAMILY_001",
      locationSuffix: "ROAD_SEGMENT_001",
      placementRuleId: "PLACEMENT_ROAD_SEGMENT_001",
      priorityCategory: "objectives",
      state: "ready",
      coordinateOffset: { x: 7, y: 0 },
      terrainType: "grass",
      locationType: "road_lane",
      resolverAvailableAssetReferences: []
    })
  ])
});

export function buildControlledRealLocationSyntheticPreviewContext() {
  return Object.freeze(buildControlledRealLocationDataBridgeContext());
}

export function createControlledRealLocationSyntheticPreview(
  rawDefinition = controlledRealLocationSyntheticPreviewDefinition,
  options = {}
) {
  const validation = validateControlledRealLocationSyntheticPreview(
    rawDefinition,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      previewWorld: null
    });
  }

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    previewWorld: validation.previewWorld
  });
}

export function validateControlledRealLocationSyntheticPreview(
  rawDefinition = controlledRealLocationSyntheticPreviewDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeDefinition(rawDefinition);

    const locationWorldRequest = createControlledRealLocationWorldRequest(
      definition.locationRequest,
      { context: normalizedOptions.context }
    );

    const locationBridgeDefinition = deepFreeze({
      locationRequest: locationWorldRequest.locationRequest,
      locationClassification: locationWorldRequest.locationClassification,
      assetCandidateRequest: locationWorldRequest.assetCandidateRequest,
      runtimeHandoff: controlledRealLocationDataBridgeDefinition.runtimeHandoff
    });
    const locationBridgeResult =
      normalizedOptions.validateControlledRealLocationDataBridge(
        locationBridgeDefinition,
        {
          context: normalizedOptions.context,
          validateWorldInstanceManagerFoundation:
            normalizedOptions.validateWorldInstanceManagerFoundation,
          validateWorldStreamingCoordinatorFoundation:
            normalizedOptions.validateWorldStreamingCoordinatorFoundation
        }
      );
    if (!locationBridgeResult.ok) {
      return freezeFailure(locationBridgeResult);
    }

    const worldInstanceBenchmark =
      normalizedOptions.validateWorldInstanceManagerFoundation();
    if (!worldInstanceBenchmark.ok) {
      return freezeFailure(worldInstanceBenchmark);
    }

    const controlledRenderBenchmark =
      normalizedOptions.validateSyntheticWorldActualCustom25DRenderVerification();
    if (!controlledRenderBenchmark.ok) {
      return freezeFailure(controlledRenderBenchmark);
    }

    const previewTemplates = getPreviewEnvironmentTemplates(
      locationWorldRequest.locationRequest.environmentType
    );
    const generatedInstances = buildGeneratedInstances(
      locationWorldRequest,
      previewTemplates
    );

    validateExpectedGeneratedAssetIds(
      definition.expectedGeneratedAssetIds,
      generatedInstances
    );

    const streamingFoundation = buildStreamingFoundation(
      locationWorldRequest,
      generatedInstances
    );
    const streamingResult =
      normalizedOptions.validateWorldStreamingCoordinatorFoundation(
        streamingFoundation,
        {
          context: normalizedOptions.context.starterLayers,
          validateWorldInstanceManagerFoundation() {
            return worldInstanceBenchmark;
          }
        }
      );
    if (!streamingResult.ok) {
      return freezeFailure(streamingResult);
    }

    const bridgeFoundation = buildRendererBridgeFoundation(
      streamingResult.worldStreamingCoordinator
    );
    const pipelineBridgeResult =
      normalizedOptions.validateWorldPipelineRendererBridge(
        bridgeFoundation,
        {
          validateWorldInstanceManagerFoundation() {
            return worldInstanceBenchmark;
          },
          validateWorldStreamingCoordinatorFoundation() {
            return streamingResult;
          }
        }
      );
    if (!pipelineBridgeResult.ok) {
      return freezeFailure(pipelineBridgeResult);
    }

    validateExpectedRendererAssetIds(
      definition.expectedRendererAssetIds,
      pipelineBridgeResult.worldPipelineRendererBridge.rendererHandoffOutputs
    );
    validateRendererProfile(
      definition.expectedRendererProfile,
      pipelineBridgeResult.worldPipelineRendererBridge.rendererHandoffOutputs
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      previewWorld: Object.freeze({
        previewId: createPreviewId(
          definition.previewId,
          locationWorldRequest.deterministicWorldRequest.worldRequestId
        ),
        locationRequest: locationWorldRequest.locationRequest,
        worldRequest: locationWorldRequest.deterministicWorldRequest,
        generatedInstances: deepFreeze(
          streamingResult.worldStreamingCoordinator.candidateEvaluations.map(
            (evaluation) => {
              const candidate = streamingResult.worldStreamingCoordinator.foundation.instanceCandidates.find(
                (entry) => entry.instanceId === evaluation.instanceId
              );

              return deepFreeze({
                instanceId: evaluation.instanceId,
                assetId: evaluation.assetId,
                assetFamilyId: candidate.assetFamilyId,
                locationId: candidate.locationId,
                streamingState: evaluation.streamingState,
                selectedLodProfile: evaluation.selectedLodProfile,
                loadingPriority: evaluation.loadingPriority,
                placementResult: evaluation.placementResult,
                rendererAvailable:
                  evaluation.rendererHandoff?.ok === true
              });
            }
          )
        ),
        rendererPreviewPayload: deepFreeze(
          pipelineBridgeResult.worldPipelineRendererBridge.rendererHandoffOutputs
        ),
        validation: Object.freeze({
          locationAccepted: true,
          deterministicOutputVerified: true,
          assetSelectionVerified: true,
          placementCompatibilityVerified: true,
          rendererCompatibilityVerified: true,
          controlledSyntheticRendererContractVerified: true
        }),
        compatibility: Object.freeze({
          passiveOnly: true,
          liveRuntimeEnabled: false,
          gpsConnected: false,
          externalMapServicesQueried: false,
          livePlayerWorldCreated: false,
          rendererModified: false,
          gameplayModified: false,
          firebaseModified: false,
          backendModified: false,
          benchmarkWorldId:
            controlledRenderBenchmark.renderVerification.worldId
        })
      })
    });
  } catch (error) {
    if (
      error?.name !==
      "ControlledRealLocationSyntheticPreviewValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      previewWorld: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildControlledRealLocationSyntheticPreviewContext(),
    validateControlledRealLocationDataBridge:
      options.validateControlledRealLocationDataBridge ??
      validateControlledRealLocationDataBridge,
    validateWorldInstanceManagerFoundation:
      options.validateWorldInstanceManagerFoundation ??
      validateWorldInstanceManagerFoundation,
    validateWorldStreamingCoordinatorFoundation:
      options.validateWorldStreamingCoordinatorFoundation ??
      validateWorldStreamingCoordinatorFoundation,
    validateWorldPipelineRendererBridge:
      options.validateWorldPipelineRendererBridge ??
      validateWorldPipelineRendererBridge,
    validateSyntheticWorldActualCustom25DRenderVerification:
      options.validateSyntheticWorldActualCustom25DRenderVerification ??
      validateSyntheticWorldActualCustom25DRenderVerification
  });
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "controlled real location synthetic preview"
  );

  assertRequiredFields(definition);

  return deepFreeze({
    previewId: normalizePermanentId(definition.previewId, "previewId"),
    locationRequest: normalizeLocationRequest(definition.locationRequest),
    expectedGeneratedAssetIds: normalizePermanentIdArray(
      definition.expectedGeneratedAssetIds,
      "expectedGeneratedAssetIds"
    ),
    expectedRendererAssetIds: normalizePermanentIdArray(
      definition.expectedRendererAssetIds,
      "expectedRendererAssetIds"
    ),
    expectedRendererProfile: normalizeStringValue(
      definition.expectedRendererProfile,
      "expectedRendererProfile"
    )
  });
}

function normalizeLocationRequest(rawLocationRequest) {
  const locationRequest = asPlainObject(rawLocationRequest, "locationRequest");

  return deepFreeze({
    locationId: normalizePermanentId(locationRequest.locationId, "locationRequest.locationId"),
    latitude: normalizeFiniteNumber(
      locationRequest.latitude,
      "locationRequest.latitude"
    ),
    longitude: normalizeFiniteNumber(
      locationRequest.longitude,
      "locationRequest.longitude"
    ),
    region: normalizeStringValue(locationRequest.region, "locationRequest.region"),
    environmentType: normalizeStringValue(
      locationRequest.environmentType,
      "locationRequest.environmentType"
    ),
    worldSeed: normalizeStringValue(
      locationRequest.worldSeed,
      "locationRequest.worldSeed"
    )
  });
}

function buildGeneratedInstances(locationWorldRequest, templates) {
  return deepFreeze(
    templates.map((template) => {
      const coordinates = deepFreeze({
        x: Number(
          (locationWorldRequest.locationRequest.latitude + template.coordinateOffset.x).toFixed(6)
        ),
        y: Number(
          (locationWorldRequest.locationRequest.longitude + template.coordinateOffset.y).toFixed(6)
        )
      });
      const locationId = `${locationWorldRequest.locationRequest.locationId}_${template.locationSuffix}`;

      return deepFreeze({
        instanceId: createDeterministicWorldInstanceId({
          locationId,
          assetId: template.assetId,
          worldSeed: locationWorldRequest.locationRequest.worldSeed
        }).instanceId,
        assetId: template.assetId,
        assetFamilyId: template.assetFamilyId,
        locationId,
        worldSeed: locationWorldRequest.locationRequest.worldSeed,
        placementRuleId: template.placementRuleId,
        priorityCategory: template.priorityCategory,
        state: template.state,
        metadata: deepFreeze({
          coordinates,
          terrainType: template.terrainType,
          locationType: template.locationType,
          resolverAvailableAssetReferences: deepFreeze(
            template.resolverAvailableAssetReferences
          ),
          runtimeSpawnAuthorized: false
        })
      });
    })
  );
}

function buildStreamingFoundation(locationWorldRequest, generatedInstances) {
  const streamingRequest = deepFreeze({
    playerLocation: deepFreeze({
      anchorId: `${locationWorldRequest.locationRequest.locationId}_PLAYER_ANCHOR_001`,
      coordinates: deepFreeze({
        x: locationWorldRequest.locationRequest.latitude,
        y: locationWorldRequest.locationRequest.longitude
      })
    }),
    worldRegion: deepFreeze({
      regionId: `${locationWorldRequest.locationRequest.locationId}_PREVIEW_REGION_001`,
      regionSeed: locationWorldRequest.locationRequest.worldSeed
    }),
    loadRadius: 20,
    unloadRadius: 30,
    priorityRules: deepFreeze([
      createPriorityRule("quest_landmarks", 6000),
      createPriorityRule("npc_locations", 5000),
      createPriorityRule("objectives", 4000),
      createPriorityRule("businesses", 3000),
      createPriorityRule("buildings", 2000),
      createPriorityRule("environment_objects", 1000)
    ]),
    lodRules: deepFreeze({
      closeDistanceMetres: 5,
      mediumDistanceMetres: 12,
      farDistanceMetres: 20
    })
  });

  return deepFreeze({
    streamingRequest,
    instanceCandidates: generatedInstances,
    cacheMetadata: deepFreeze({
      assetReuseRule: "same-asset-same-location-same-seed",
      memoryPriority: "balanced",
      storageEligibility: "local-streaming-cache-eligible"
    }),
    passiveHandoff: computePassiveHandoff(streamingRequest, generatedInstances)
  });
}

function buildRendererBridgeFoundation(worldStreamingCoordinator) {
  const bridgeInputs = worldStreamingCoordinator.passiveHandoff.selectedInstances.map(
    (selectedInstance) => {
      const evaluation = worldStreamingCoordinator.candidateEvaluations.find(
        (entry) => entry.instanceId === selectedInstance.instanceId
      );
      const candidate = worldStreamingCoordinator.foundation.instanceCandidates.find(
        (entry) => entry.instanceId === selectedInstance.instanceId
      );

      return deepFreeze({
        instanceId: selectedInstance.instanceId,
        assetReference: deepFreeze({
          assetId: candidate.assetId,
          assetFamilyId: candidate.assetFamilyId
        }),
        placementData: deepFreeze({
          locationId: evaluation.placementResult.placement.locationId,
          placementRuleId:
            evaluation.placementResult.deterministicPlacement.placementRuleId,
          orientation: evaluation.placementResult.placement.orientation
        }),
        lodProfile: selectedInstance.selectedLodProfile,
        visibilityState: selectedInstance.streamingState,
        priority: selectedInstance.loadingPriority
      });
    }
  );

  return deepFreeze({
    bridgeInputs: deepFreeze(bridgeInputs),
    bridgePolicy: deepFreeze({
      rendererProfile: "custom-2.5d-passive",
      deterministic: true,
      renderingActivated: false
    })
  });
}

function validateExpectedGeneratedAssetIds(expectedAssetIds, generatedInstances) {
  const actualAssetIds = generatedInstances.map((entry) => entry.assetId);
  if (!areArraysEqual(expectedAssetIds, actualAssetIds)) {
    throw createValidationError(
      "generated_asset_mismatch",
      "Generated instance asset IDs do not match the expected controlled preview asset set."
    );
  }
}

function validateExpectedRendererAssetIds(expectedAssetIds, rendererPayloads) {
  const actualAssetIds = rendererPayloads.map(
    (entry) => entry.rendererAssetReference.assetId
  );
  if (!areArraysEqual(expectedAssetIds, actualAssetIds)) {
    throw createValidationError(
      "renderer_asset_mismatch",
      "Renderer preview payload asset ordering does not match the expected deterministic preview ordering."
    );
  }
}

function validateRendererProfile(expectedRendererProfile, rendererPayloads) {
  for (const payload of rendererPayloads) {
    if (
      payload.passiveRendererPayload.metadata.adapterProfile !==
      expectedRendererProfile
    ) {
      throw createValidationError(
        "renderer_profile_mismatch",
        "Renderer preview payloads must preserve the expected passive renderer profile."
      );
    }
  }
}

function getPreviewEnvironmentTemplates(environmentType) {
  const templates = previewEnvironmentTemplates[environmentType];
  if (!templates) {
    throw createValidationError(
      "unsupported_preview_environment",
      `Environment type ${environmentType} is not supported by the controlled real location synthetic preview.`
    );
  }

  return templates;
}

function computePassiveHandoff(streamingRequest, instanceCandidates) {
  const selectedInstances = instanceCandidates
    .map((candidate) => {
      const distanceToPlayerMetres = calculateDistanceMetres(
        streamingRequest.playerLocation.coordinates,
        candidate.metadata.coordinates
      );
      const streamingState = selectStreamingState(
        distanceToPlayerMetres,
        streamingRequest
      );
      if (streamingState === "unloaded") {
        return null;
      }

      return deepFreeze({
        instanceId: candidate.instanceId,
        selectedLodProfile: selectLodProfile(
          distanceToPlayerMetres,
          streamingRequest.lodRules
        ),
        loadingPriority: calculateLoadingPriority(
          candidate.priorityCategory,
          distanceToPlayerMetres,
          streamingRequest.priorityRules
        ),
        streamingState
      });
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.loadingPriority !== left.loadingPriority) {
        return right.loadingPriority - left.loadingPriority;
      }

      return left.instanceId.localeCompare(right.instanceId);
    });

  return deepFreeze({
    selectedInstances: deepFreeze(selectedInstances)
  });
}

function createPreviewId(basePreviewId, worldRequestId) {
  const hash = stableHash([basePreviewId, worldRequestId].join("::"));
  return `${basePreviewId}_${String(hash).padStart(9, "0")}`;
}

function createPreviewAssetTemplate(definition) {
  return deepFreeze(definition);
}

function createPriorityRule(category, basePriority) {
  return deepFreeze({
    category,
    basePriority
  });
}

function calculateDistanceMetres(playerCoordinates, candidateCoordinates) {
  const deltaX = candidateCoordinates.x - playerCoordinates.x;
  const deltaY = candidateCoordinates.y - playerCoordinates.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function selectLodProfile(distanceToPlayerMetres, lodRules) {
  if (distanceToPlayerMetres <= lodRules.closeDistanceMetres) {
    return "close";
  }
  if (distanceToPlayerMetres <= lodRules.mediumDistanceMetres) {
    return "gameplay";
  }
  return "map";
}

function selectStreamingState(distanceToPlayerMetres, streamingRequest) {
  if (distanceToPlayerMetres <= streamingRequest.lodRules.closeDistanceMetres) {
    return "visible";
  }
  if (distanceToPlayerMetres <= streamingRequest.lodRules.mediumDistanceMetres) {
    return "ready";
  }
  if (distanceToPlayerMetres <= streamingRequest.loadRadius) {
    return "cached";
  }
  return "unloaded";
}

function calculateLoadingPriority(
  priorityCategory,
  distanceToPlayerMetres,
  priorityRules
) {
  const priorityRule = priorityRules.find((entry) => entry.category === priorityCategory);
  if (!priorityRule) {
    throw createValidationError(
      "missing_priority_rule",
      `Missing priority rule for category ${priorityCategory}.`
    );
  }

  return priorityRule.basePriority - Math.round(distanceToPlayerMetres * 10);
}

function assertRequiredFields(definition) {
  for (const fieldName of controlledRealLocationSyntheticPreviewRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Controlled real location synthetic preview is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_permanent_id_array",
      `${fieldName} must be a non-empty array of permanent identifiers.`
    );
  }

  return deepFreeze(
    value.map((entry, index) =>
      normalizePermanentId(entry, `${fieldName}[${index}]`)
    )
  );
}

function normalizePermanentId(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalizedValue)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must use the approved permanent uppercase GrowGo identifier format.`
    );
  }

  return normalizedValue;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }

  return value.trim();
}

function normalizeFiniteNumber(value, fieldName) {
  if (!Number.isFinite(value)) {
    throw createValidationError(
      "invalid_number",
      `${fieldName} must be a finite number.`
    );
  }

  return Number(value);
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode ?? "upstream_validation_failed",
    message: result.message ?? "Upstream validation failed.",
    previewWorld: null
  });
}

function areArraysEqual(first, second) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((entry, index) => entry === second[index]);
}

function stableHash(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "ControlledRealLocationSyntheticPreviewValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }

  return Object.freeze(value);
}
