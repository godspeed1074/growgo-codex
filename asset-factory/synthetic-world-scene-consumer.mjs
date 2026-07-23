import {
  buildWorldPipelineRendererBridgeContext,
  validateWorldPipelineRendererBridge
} from "./world-pipeline-renderer-bridge.mjs";
import { consumePassiveRendererPayload } from "./passive-renderer-consumer.mjs";
import { createDeterministicWorldInstanceId } from "./world-instance-manager-foundation.mjs";
import { resolveDeterministicAssetSelection } from "./deterministic-asset-resolver.mjs";
import { calculateDeterministicPlacement } from "./world-placement-rules.mjs";
import { adaptFactoryAssetForRenderer } from "./factory-to-renderer-adapter.mjs";

export const syntheticWorldSceneConsumerRequiredFields = Object.freeze([
  "worldId",
  "locationId",
  "worldSeed",
  "assetInstances",
  "environmentRules"
]);

export const syntheticWorldSceneConsumerDefinition = deepFreeze({
  worldId: "SYNTHETIC_COASTAL_WORLD_SCENE_001",
  locationId: "COASTAL_WORLD_TEST_AREA_001",
  worldSeed: "synthetic-world-seed-001",
  assetInstances: deepFreeze([
    createAssetInstanceDefinition({
      assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
      assetFamilyId: "LIGHTHOUSE_COASTAL_FAMILY_001",
      locationId: "LANDMARK_LIGHTHOUSE_ISLAND_001",
      placementRuleId: "PLACEMENT_LANDMARK_COASTAL_001",
      priorityCategory: "quest_landmarks",
      coordinates: { x: 11, y: 6 },
      terrainType: "sand",
      locationType: "landmark_site"
    }),
    createAssetInstanceDefinition({
      assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
      assetFamilyId: "BUILDING_HOUSE_SMALL_COASTAL_FAMILY_001",
      locationId: "PLOT_COASTAL_HOME_001",
      placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
      priorityCategory: "buildings",
      coordinates: { x: 15, y: 8 },
      terrainType: "grass",
      locationType: "building_plot"
    }),
    createAssetInstanceDefinition({
      assetId: "ROAD_STRAIGHT_SMALL_001",
      assetFamilyId: "ROAD_STRAIGHT_SMALL_FAMILY_001",
      locationId: "ROAD_MAIN_SEGMENT_001",
      placementRuleId: "PLACEMENT_ROAD_SEGMENT_001",
      priorityCategory: "environment_objects",
      coordinates: { x: 13, y: 6 },
      terrainType: "grass",
      locationType: "road_lane"
    }),
    createAssetInstanceDefinition({
      assetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: "TREE_EUCALYPTUS_FAMILY_001",
      locationId: "NATURE_CLUSTER_TREE_001",
      placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      priorityCategory: "environment_objects",
      coordinates: { x: 20, y: 10 },
      terrainType: "grass",
      locationType: "nature_cluster"
    }),
    createAssetInstanceDefinition({
      assetId: "FOOTPATH_SMALL_001",
      assetFamilyId: "FOOTPATH_SMALL_FAMILY_001",
      locationId: "FOOTPATH_MAIN_SEGMENT_001",
      placementRuleId: "PLACEMENT_ROAD_SEGMENT_001",
      priorityCategory: "environment_objects",
      coordinates: { x: 14, y: 6.5 },
      terrainType: "grass",
      locationType: "path_lane"
    })
  ]),
  environmentRules: deepFreeze({
    playerLocation: {
      anchorId: "PLAYER_ANCHOR_SYNTHETIC_001",
      coordinates: {
        x: 10,
        y: 6
      }
    },
    worldRegion: {
      regionId: "COASTAL_WORLD_TEST_REGION_001",
      regionSeed: "synthetic-world-seed-001"
    },
    loadRadius: 20,
    unloadRadius: 30,
    priorityRules: deepFreeze([
      { category: "quest_landmarks", basePriority: 6000 },
      { category: "npc_locations", basePriority: 5000 },
      { category: "objectives", basePriority: 4000 },
      { category: "businesses", basePriority: 3000 },
      { category: "buildings", basePriority: 2000 },
      { category: "environment_objects", basePriority: 1000 }
    ]),
    lodRules: {
      closeDistanceMetres: 5,
      mediumDistanceMetres: 12,
      farDistanceMetres: 20
    },
    priorityValidation: {
      landmarkAssetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
      buildingAssetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
      environmentAssetId: "TREE_EUCALYPTUS_001"
    }
  })
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedPriorityCategories = Object.freeze([
  "quest_landmarks",
  "npc_locations",
  "objectives",
  "businesses",
  "buildings",
  "environment_objects"
]);

export function buildSyntheticWorldSceneConsumerContext() {
  const context = buildWorldPipelineRendererBridgeContext();
  ensureSyntheticLighthouseDefinitions(context);
  return Object.freeze(context);
}

export function buildSyntheticWorldSceneConsumer(
  rawWorld = syntheticWorldSceneConsumerDefinition,
  options = {}
) {
  const validation = validateSyntheticWorldSceneConsumer(rawWorld, options);
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      syntheticWorldScene: null
    });
  }

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    syntheticWorldScene: validation.syntheticWorldScene
  });
}

export function validateSyntheticWorldSceneConsumer(
  rawWorld = syntheticWorldSceneConsumerDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeSyntheticWorldOptions(options);
    const context = normalizedOptions.context;
    const world = normalizeSyntheticWorld(rawWorld);

    validateRequiredSceneAssets(world.assetInstances);

    const worldInstanceRecords = world.assetInstances.map((assetInstance) =>
      buildWorldInstanceRecord(assetInstance, world.worldSeed)
    );

    const candidateEvaluations = world.assetInstances.map((assetInstance) =>
      evaluateAssetInstance(
        assetInstance,
        world.worldSeed,
        world.environmentRules,
        context
      )
    );

    const selectedInstances = buildSelectedInstances(
      candidateEvaluations,
      world.environmentRules
    );
    validatePriorityHierarchy(
      world.environmentRules.priorityValidation,
      candidateEvaluations
    );

    const syntheticStreamingCoordinator = Object.freeze({
      foundation: Object.freeze({
        instanceCandidates: deepFreeze(
          candidateEvaluations.map((entry) => entry.instanceCandidate)
        ),
        streamingRequest: deepFreeze({
          playerLocation: world.environmentRules.playerLocation,
          worldRegion: world.environmentRules.worldRegion,
          loadRadius: world.environmentRules.loadRadius,
          unloadRadius: world.environmentRules.unloadRadius,
          priorityRules: world.environmentRules.priorityRules,
          lodRules: world.environmentRules.lodRules
        })
      }),
      passiveHandoff: Object.freeze({
        selectedInstances
      }),
      candidateEvaluations: deepFreeze(
        candidateEvaluations.map((entry) => entry.candidateEvaluation)
      )
    });

    const bridgeFoundation = Object.freeze({
      bridgeInputs: deepFreeze(
        selectedInstances.map((selectedInstance) => {
          const matchingEvaluation = findAssetEvaluationByInstanceId(
            candidateEvaluations,
            selectedInstance.instanceId
          );
          return Object.freeze({
            instanceId: selectedInstance.instanceId,
            assetReference: deepFreeze({
              assetId: matchingEvaluation.assetInstance.assetId,
              assetFamilyId: matchingEvaluation.assetInstance.assetFamilyId
            }),
            placementData: deepFreeze({
              locationId:
                matchingEvaluation.candidateEvaluation.placementResult.placement.locationId,
              placementRuleId:
                matchingEvaluation.candidateEvaluation.placementResult
                  .deterministicPlacement.placementRuleId,
              orientation:
                matchingEvaluation.candidateEvaluation.placementResult.placement.orientation
            }),
            lodProfile: selectedInstance.selectedLodProfile,
            visibilityState: selectedInstance.streamingState,
            priority: selectedInstance.loadingPriority
          });
        })
      ),
      bridgePolicy: deepFreeze({
        rendererProfile: "custom-2.5d-passive",
        deterministic: true,
        renderingActivated: false
      })
    });

    const bridgeResult = validateWorldPipelineRendererBridge(bridgeFoundation, {
      validateWorldInstanceManagerFoundation() {
        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          worldInstanceManager: Object.freeze({
            synthetic: true,
            worldInstanceRecords: deepFreeze(worldInstanceRecords)
          })
        });
      },
      validateWorldStreamingCoordinatorFoundation() {
        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          worldStreamingCoordinator: syntheticStreamingCoordinator
        });
      }
    });

    if (!bridgeResult.ok) {
      return freezeFailure(bridgeResult);
    }

    const consumerResults = bridgeResult.worldPipelineRendererBridge.rendererHandoffOutputs.map(
      (bridgeOutput) =>
        consumePassiveRendererPayload(bridgeOutput.passiveRendererPayload)
    );

    for (const consumerResult of consumerResults) {
      if (!consumerResult.ok) {
        return freezeFailure(consumerResult);
      }
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      syntheticWorldScene: Object.freeze({
        world,
        worldInstanceRecords: deepFreeze(worldInstanceRecords),
        candidateEvaluations: deepFreeze(candidateEvaluations),
        selectedInstances,
        bridgeResult: bridgeResult.worldPipelineRendererBridge,
        consumerResults: deepFreeze(consumerResults),
        compatibility: Object.freeze({
          worldInstanceCreationVerified: true,
          streamingSelectionVerified: true,
          lodSelectionVerified: true,
          rendererBridgeVerified: true,
          passiveRendererConsumerAcceptanceVerified: true,
          priorityValidationVerified: true,
          deterministicWorldOutputVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "SyntheticWorldSceneConsumerValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      syntheticWorldScene: null
    });
  }
}

function normalizeSyntheticWorldOptions(options) {
  return Object.freeze({
    context: options.context ?? buildSyntheticWorldSceneConsumerContext()
  });
}

function normalizeSyntheticWorld(rawWorld) {
  const world = asPlainObject(rawWorld, "synthetic world scene");
  assertRequiredFields(world);
  const environmentRules = normalizeEnvironmentRules(world.environmentRules);

  return deepFreeze({
    worldId: normalizePermanentId(world.worldId, "worldId"),
    locationId: normalizePermanentId(world.locationId, "locationId"),
    worldSeed: normalizeStringValue(world.worldSeed, "worldSeed"),
    assetInstances: deepFreeze(normalizeAssetInstances(world.assetInstances)),
    environmentRules
  });
}

function normalizeAssetInstances(value) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      "assetInstances must be an array of synthetic world asset instances."
    );
  }

  return value.map((entry, index) => {
    const assetInstance = asPlainObject(entry, `assetInstances[${index}]`);
    const coordinates = asPlainObject(
      assetInstance.coordinates,
      `assetInstances[${index}].coordinates`
    );

    return deepFreeze({
      assetId: normalizePermanentId(
        assetInstance.assetId,
        `assetInstances[${index}].assetId`
      ),
      assetFamilyId: normalizePermanentId(
        assetInstance.assetFamilyId,
        `assetInstances[${index}].assetFamilyId`
      ),
      locationId: normalizePermanentId(
        assetInstance.locationId,
        `assetInstances[${index}].locationId`
      ),
      placementRuleId: normalizePermanentId(
        assetInstance.placementRuleId,
        `assetInstances[${index}].placementRuleId`
      ),
      priorityCategory: normalizePriorityCategory(
        assetInstance.priorityCategory,
        `assetInstances[${index}].priorityCategory`
      ),
      coordinates: deepFreeze({
        x: normalizeFiniteNumber(
          coordinates.x,
          `assetInstances[${index}].coordinates.x`
        ),
        y: normalizeFiniteNumber(
          coordinates.y,
          `assetInstances[${index}].coordinates.y`
        )
      }),
      terrainType: normalizeStringValue(
        assetInstance.terrainType,
        `assetInstances[${index}].terrainType`
      ),
      locationType: normalizeStringValue(
        assetInstance.locationType,
        `assetInstances[${index}].locationType`
      )
    });
  });
}

function normalizeEnvironmentRules(value) {
  const environmentRules = asPlainObject(value, "environmentRules");
  const playerLocation = asPlainObject(
    environmentRules.playerLocation,
    "environmentRules.playerLocation"
  );
  const worldRegion = asPlainObject(
    environmentRules.worldRegion,
    "environmentRules.worldRegion"
  );
  const playerCoordinates = asPlainObject(
    playerLocation.coordinates,
    "environmentRules.playerLocation.coordinates"
  );
  const lodRules = asPlainObject(
    environmentRules.lodRules,
    "environmentRules.lodRules"
  );
  const priorityValidation = asPlainObject(
    environmentRules.priorityValidation,
    "environmentRules.priorityValidation"
  );

  const loadRadius = normalizePositiveNumber(
    environmentRules.loadRadius,
    "environmentRules.loadRadius"
  );
  const unloadRadius = normalizePositiveNumber(
    environmentRules.unloadRadius,
    "environmentRules.unloadRadius"
  );
  if (unloadRadius <= loadRadius) {
    throw createValidationError(
      "invalid_streaming_radii",
      "environmentRules.unloadRadius must be greater than environmentRules.loadRadius."
    );
  }

  const normalizedLodRules = deepFreeze({
    closeDistanceMetres: normalizePositiveNumber(
      lodRules.closeDistanceMetres,
      "environmentRules.lodRules.closeDistanceMetres"
    ),
    mediumDistanceMetres: normalizePositiveNumber(
      lodRules.mediumDistanceMetres,
      "environmentRules.lodRules.mediumDistanceMetres"
    ),
    farDistanceMetres: normalizePositiveNumber(
      lodRules.farDistanceMetres,
      "environmentRules.lodRules.farDistanceMetres"
    )
  });

  if (
    !(
      normalizedLodRules.closeDistanceMetres <
      normalizedLodRules.mediumDistanceMetres &&
      normalizedLodRules.mediumDistanceMetres <=
        normalizedLodRules.farDistanceMetres &&
      normalizedLodRules.farDistanceMetres <= loadRadius
    )
  ) {
    throw createValidationError(
      "invalid_lod_rules",
      "environmentRules.lodRules must increase from close to medium to far within loadRadius."
    );
  }

  return deepFreeze({
    playerLocation: deepFreeze({
      anchorId: normalizePermanentId(
        playerLocation.anchorId,
        "environmentRules.playerLocation.anchorId"
      ),
      coordinates: deepFreeze({
        x: normalizeFiniteNumber(
          playerCoordinates.x,
          "environmentRules.playerLocation.coordinates.x"
        ),
        y: normalizeFiniteNumber(
          playerCoordinates.y,
          "environmentRules.playerLocation.coordinates.y"
        )
      })
    }),
    worldRegion: deepFreeze({
      regionId: normalizePermanentId(
        worldRegion.regionId,
        "environmentRules.worldRegion.regionId"
      ),
      regionSeed: normalizeStringValue(
        worldRegion.regionSeed,
        "environmentRules.worldRegion.regionSeed"
      )
    }),
    loadRadius,
    unloadRadius,
    priorityRules: deepFreeze(normalizePriorityRules(environmentRules.priorityRules)),
    lodRules: normalizedLodRules,
    priorityValidation: deepFreeze({
      landmarkAssetId: normalizePermanentId(
        priorityValidation.landmarkAssetId,
        "environmentRules.priorityValidation.landmarkAssetId"
      ),
      buildingAssetId: normalizePermanentId(
        priorityValidation.buildingAssetId,
        "environmentRules.priorityValidation.buildingAssetId"
      ),
      environmentAssetId: normalizePermanentId(
        priorityValidation.environmentAssetId,
        "environmentRules.priorityValidation.environmentAssetId"
      )
    })
  });
}

function normalizePriorityRules(value) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      "environmentRules.priorityRules must be an array."
    );
  }
  return value.map((entry, index) => {
    const rule = asPlainObject(entry, `environmentRules.priorityRules[${index}]`);
    return deepFreeze({
      category: normalizePriorityCategory(
        rule.category,
        `environmentRules.priorityRules[${index}].category`
      ),
      basePriority: normalizePositiveInteger(
        rule.basePriority,
        `environmentRules.priorityRules[${index}].basePriority`
      )
    });
  });
}

function buildWorldInstanceRecord(assetInstance, worldSeed) {
  return Object.freeze({
    instanceId: createDeterministicWorldInstanceId({
      locationId: assetInstance.locationId,
      assetId: assetInstance.assetId,
      worldSeed
    }).instanceId,
    assetId: assetInstance.assetId,
    assetFamilyId: assetInstance.assetFamilyId,
    locationId: assetInstance.locationId,
    worldSeed,
    placementRuleId: assetInstance.placementRuleId,
    metadata: deepFreeze({
      coordinates: assetInstance.coordinates,
      terrainType: assetInstance.terrainType,
      locationType: assetInstance.locationType
    })
  });
}

function evaluateAssetInstance(assetInstance, worldSeed, environmentRules, context) {
  const asset = context.assetRegistry.findAssetById(assetInstance.assetId);
  if (!asset || !context.assetRegistry.isAssetAvailable(assetInstance.assetId)) {
    throw createValidationError(
      "missing_asset_reference",
      `Synthetic world asset ${assetInstance.assetId} is not available.`
    );
  }

  const manifest = context.manifestRegistry.findManifestByAssetId(assetInstance.assetId);
  if (!manifest || !context.manifestRegistry.isManifestAvailable(assetInstance.assetId)) {
    throw createValidationError(
      "missing_manifest_reference",
      `Synthetic world manifest ${assetInstance.assetId} is not available.`
    );
  }

  const resolverResult = resolveDeterministicAssetSelection(
    {
      locationId: assetInstance.locationId,
      coordinates: {
        x: assetInstance.coordinates.x,
        y: assetInstance.coordinates.y
      },
      seed: worldSeed,
      assetCategory: asset.category,
      assetType: null,
      availableAssetReferences: [assetInstance.assetId],
      resolverRules: {
        variantPolicy: "seeded-index",
        variantOffset: 0
      }
    },
    context
  );
  if (!resolverResult.ok || resolverResult.selectedAsset.assetId !== assetInstance.assetId) {
    throw createValidationError(
      "resolver_asset_mismatch",
      `Synthetic world asset ${assetInstance.assetId} must match the deterministic resolver output.`
    );
  }

  const placementResult = calculateDeterministicPlacement(
    {
      placementRuleId: assetInstance.placementRuleId,
      assetId: assetInstance.assetId,
      locationId: assetInstance.locationId,
      coordinates: {
        x: assetInstance.coordinates.x,
        y: assetInstance.coordinates.y
      },
      seed: worldSeed,
      terrainType: assetInstance.terrainType,
      locationType: assetInstance.locationType
    },
    context
  );
  if (!placementResult.ok) {
    throw createValidationError(
      placementResult.errorCode ?? "placement_failed",
      placementResult.message ?? "Synthetic world placement failed."
    );
  }

  const distanceToPlayerMetres = calculateDistance(
    environmentRules.playerLocation.coordinates,
    assetInstance.coordinates
  );
  const selectedLodProfile = selectLodProfile(
    distanceToPlayerMetres,
    environmentRules.lodRules
  );
  const streamingState = selectStreamingState(
    distanceToPlayerMetres,
    environmentRules
  );
  const loadingPriority = calculatePriority(
    assetInstance.priorityCategory,
    distanceToPlayerMetres,
    environmentRules.priorityRules
  );

  const rendererHandoff = adaptFactoryAssetForRenderer(
    {
      assetId: assetInstance.assetId,
      manifestReference: {
        assetId: manifest.assetId,
        category: manifest.category
      },
      recipeReference: manifest.recipeId,
      componentReferences: [...manifest.componentReferences],
      placementData: {
        placementRuleId: placementResult.deterministicPlacement.placementRuleId,
        locationId: placementResult.placement.locationId,
        alignmentRule: placementResult.placement.alignmentRule,
        position: {
          x: placementResult.placement.position.x,
          y: placementResult.placement.position.y
        }
      },
      orientation: placementResult.placement.orientation,
      metadata: {
        rendererAdapterProfile: "custom-2.5d-passive",
        placementMetadata: {
          deterministic: true,
          streamingState,
          selectedLodProfile
        }
      }
    },
    context
  );
  if (!rendererHandoff.ok) {
    throw createValidationError(
      rendererHandoff.errorCode ?? "renderer_handoff_failed",
      rendererHandoff.message ?? "Synthetic world renderer handoff failed."
    );
  }

  const instanceId = createDeterministicWorldInstanceId({
    locationId: assetInstance.locationId,
    assetId: assetInstance.assetId,
    worldSeed
  }).instanceId;

  const instanceCandidate = Object.freeze({
    instanceId,
    assetId: assetInstance.assetId,
    assetFamilyId: assetInstance.assetFamilyId,
    locationId: assetInstance.locationId,
    worldSeed,
    placementRuleId: assetInstance.placementRuleId,
    priorityCategory: assetInstance.priorityCategory,
    state: streamingState,
    metadata: Object.freeze({
      coordinates: assetInstance.coordinates,
      terrainType: assetInstance.terrainType,
      locationType: assetInstance.locationType,
      resolverAvailableAssetReferences: Object.freeze([assetInstance.assetId]),
      runtimeSpawnAuthorized: false
    })
  });

  const candidateEvaluation = Object.freeze({
    instanceId,
    assetId: assetInstance.assetId,
    distanceToPlayerMetres,
    selectedLodProfile,
    streamingState,
    loadingPriority,
    placementResult,
    rendererHandoff
  });

  return Object.freeze({
    assetInstance,
    instanceCandidate,
    candidateEvaluation
  });
}

function buildSelectedInstances(candidateEvaluations, environmentRules) {
  return deepFreeze(
    candidateEvaluations
      .filter((entry) => entry.candidateEvaluation.streamingState !== "unloaded")
      .map((entry) =>
        Object.freeze({
          instanceId: entry.candidateEvaluation.instanceId,
          selectedLodProfile: entry.candidateEvaluation.selectedLodProfile,
          loadingPriority: entry.candidateEvaluation.loadingPriority,
          streamingState: entry.candidateEvaluation.streamingState
        })
      )
      .sort((left, right) => {
        if (right.loadingPriority !== left.loadingPriority) {
          return right.loadingPriority - left.loadingPriority;
        }
        return left.instanceId.localeCompare(right.instanceId);
      })
  );
}

function validatePriorityHierarchy(priorityValidation, candidateEvaluations) {
  const landmark = findAssetEvaluationByAssetId(
    candidateEvaluations,
    priorityValidation.landmarkAssetId
  );
  const building = findAssetEvaluationByAssetId(
    candidateEvaluations,
    priorityValidation.buildingAssetId
  );
  const environment = findAssetEvaluationByAssetId(
    candidateEvaluations,
    priorityValidation.environmentAssetId
  );

  if (
    !(
      landmark.candidateEvaluation.loadingPriority >
      building.candidateEvaluation.loadingPriority &&
      building.candidateEvaluation.loadingPriority >
      environment.candidateEvaluation.loadingPriority
    )
  ) {
    throw createValidationError(
      "priority_hierarchy_mismatch",
      "Synthetic world priority validation must preserve landmark > building > environment loading priority."
    );
  }
}

function validateRequiredSceneAssets(assetInstances) {
  const assetIds = assetInstances.map((entry) => entry.assetId).sort();
  const requiredAssetIds = [
    "LIGHTHOUSE_ISLAND_ROCKY_001",
    "BUILDING_HOUSE_SMALL_COASTAL_001",
    "ROAD_STRAIGHT_SMALL_001",
    "TREE_EUCALYPTUS_001",
    "FOOTPATH_SMALL_001"
  ].sort();

  if (JSON.stringify(assetIds) !== JSON.stringify(requiredAssetIds)) {
    throw createValidationError(
      "scene_asset_set_mismatch",
      "Synthetic world scene must contain the approved lighthouse, house, road, tree, and footpath asset set."
    );
  }
}

function ensureSyntheticLighthouseDefinitions(context) {
  for (const component of syntheticLighthouseComponents) {
    if (!context.componentLibrary.hasComponent(component.componentId)) {
      context.componentLibrary.addComponent(component);
    }
  }

  if (!context.assetRegistry.hasAsset(syntheticLighthouseAsset.assetId)) {
    context.assetRegistry.addAsset(syntheticLighthouseAsset);
  }

  if (!context.recipeRegistry.hasRecipe(syntheticLighthouseRecipe.recipeId)) {
    context.recipeRegistry.addRecipe(syntheticLighthouseRecipe);
  }

  if (!context.manifestRegistry.hasManifest(syntheticLighthouseManifest.assetId)) {
    context.manifestRegistry.addManifest(syntheticLighthouseManifest);
  }

  if (
    !context.placementRuleRegistry.hasPlacementRule(
      syntheticLighthousePlacementRule.placementRuleId
    )
  ) {
    context.placementRuleRegistry.addRule(syntheticLighthousePlacementRule);
  }
}

function findAssetEvaluationByAssetId(candidateEvaluations, assetId) {
  const evaluation =
    candidateEvaluations.find((entry) => entry.assetInstance.assetId === assetId) ??
    null;
  if (!evaluation) {
    throw createValidationError(
      "missing_asset_evaluation",
      `Synthetic world asset evaluation for ${assetId} is unavailable.`
    );
  }
  return evaluation;
}

function findAssetEvaluationByInstanceId(candidateEvaluations, instanceId) {
  const evaluation =
    candidateEvaluations.find(
      (entry) => entry.candidateEvaluation.instanceId === instanceId
    ) ?? null;
  if (!evaluation) {
    throw createValidationError(
      "missing_instance_evaluation",
      `Synthetic world instance evaluation for ${instanceId} is unavailable.`
    );
  }
  return evaluation;
}

function calculateDistance(left, right) {
  const deltaX = right.x - left.x;
  const deltaY = right.y - left.y;
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

function selectStreamingState(distanceToPlayerMetres, environmentRules) {
  if (distanceToPlayerMetres <= environmentRules.lodRules.closeDistanceMetres) {
    return "visible";
  }
  if (distanceToPlayerMetres <= environmentRules.lodRules.mediumDistanceMetres) {
    return "ready";
  }
  if (distanceToPlayerMetres <= environmentRules.loadRadius) {
    return "cached";
  }
  return "unloaded";
}

function calculatePriority(priorityCategory, distanceToPlayerMetres, priorityRules) {
  const rule = priorityRules.find((entry) => entry.category === priorityCategory) ?? null;
  if (!rule) {
    throw createValidationError(
      "missing_priority_rule",
      `Priority rule ${priorityCategory} is unavailable for the synthetic world scene.`
    );
  }
  return rule.basePriority - Math.round(distanceToPlayerMetres * 10);
}

function createAssetInstanceDefinition({
  assetId,
  assetFamilyId,
  locationId,
  placementRuleId,
  priorityCategory,
  coordinates,
  terrainType,
  locationType
}) {
  return deepFreeze({
    assetId,
    assetFamilyId,
    locationId,
    placementRuleId,
    priorityCategory,
    coordinates: deepFreeze({
      x: coordinates.x,
      y: coordinates.y
    }),
    terrainType,
    locationType
  });
}

function assertRequiredFields(world) {
  for (const fieldName of syntheticWorldSceneConsumerRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(world, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Synthetic world scene is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePriorityCategory(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!supportedPriorityCategories.includes(normalized)) {
    throw createValidationError(
      "invalid_priority_category",
      `Priority category ${normalized} is not approved for the synthetic world scene.`
    );
  }
  return normalized;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }
  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }
  return normalized;
}

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a finite number.`
    );
  }
  return value;
}

function normalizePositiveNumber(value, fieldName) {
  const normalized = normalizeFiniteNumber(value, fieldName);
  if (normalized <= 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be greater than zero.`
    );
  }
  return normalized;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive integer.`
    );
  }
  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }
  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    syntheticWorldScene: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "SyntheticWorldSceneConsumerValidationError";
  error.code = code;
  return error;
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

const syntheticLighthouseComponents = deepFreeze([
  createSyntheticComponentRecord(
    "LIGHTHOUSE_TOWER_BASE_001",
    "walls",
    "lighthouse_tower_base",
    5,
    3,
    5
  ),
  createSyntheticComponentRecord(
    "LIGHTHOUSE_TOWER_BODY_SHORT_001",
    "walls",
    "lighthouse_tower_body_short",
    4,
    8,
    4
  ),
  createSyntheticComponentRecord(
    "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
    "walls",
    "lighthouse_tower_body_medium",
    4,
    10,
    4
  ),
  createSyntheticComponentRecord(
    "LIGHTHOUSE_TOWER_BODY_TALL_001",
    "walls",
    "lighthouse_tower_body_tall",
    4,
    12,
    4
  ),
  createSyntheticComponentRecord(
    "LIGHTHOUSE_LANTERN_BASE_001",
    "walls",
    "lighthouse_lantern_base",
    3,
    2,
    3
  ),
  createSyntheticComponentRecord(
    "LIGHTHOUSE_GLASS_RING_001",
    "windows",
    "lighthouse_glass_ring",
    3,
    2,
    3
  ),
  createSyntheticComponentRecord(
    "LIGHTHOUSE_LIGHT_SOURCE_001",
    "windows",
    "lighthouse_light_source",
    1,
    1,
    1
  ),
  createSyntheticComponentRecord(
    "LIGHTHOUSE_BEAM_EFFECT_001",
    "windows",
    "lighthouse_beam_effect",
    1,
    6,
    1
  ),
  createSyntheticComponentRecord(
    "LIGHTHOUSE_ROOF_CAP_001",
    "roofs",
    "lighthouse_roof_cap",
    3,
    2,
    3
  )
]);

const syntheticLighthouseAsset = deepFreeze({
  assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
  category: "landmarks",
  version: "1.0.0",
  status: "validated",
  components: deepFreeze([
    "LIGHTHOUSE_TOWER_BASE_001",
    "LIGHTHOUSE_TOWER_BODY_SHORT_001",
    "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
    "LIGHTHOUSE_TOWER_BODY_TALL_001",
    "LIGHTHOUSE_LANTERN_BASE_001",
    "LIGHTHOUSE_GLASS_RING_001",
    "LIGHTHOUSE_LIGHT_SOURCE_001",
    "LIGHTHOUSE_BEAM_EFFECT_001",
    "LIGHTHOUSE_ROOF_CAP_001"
  ]),
  tags: deepFreeze(["landmarks", "synthetic_world_scene"]),
  metadata: deepFreeze({
    creatorSource: "internal",
    performanceTargets: {
      storageBudget: "low",
      ramBudget: "low",
      gpuBudget: "low"
    },
    lod: {
      profile: "mobile-default"
    },
    validationState: "validated"
  })
});

const syntheticLighthouseRecipe = deepFreeze({
  recipeId: "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001",
  assetType: "lighthouse_island_rocky",
  version: "1.0.0",
  status: "validated",
  components: deepFreeze([
    "LIGHTHOUSE_TOWER_BASE_001",
    "LIGHTHOUSE_TOWER_BODY_SHORT_001",
    "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
    "LIGHTHOUSE_TOWER_BODY_TALL_001",
    "LIGHTHOUSE_LANTERN_BASE_001",
    "LIGHTHOUSE_GLASS_RING_001",
    "LIGHTHOUSE_LIGHT_SOURCE_001",
    "LIGHTHOUSE_BEAM_EFFECT_001",
    "LIGHTHOUSE_ROOF_CAP_001"
  ]),
  optionalComponents: deepFreeze([]),
  metadata: deepFreeze({
    creatorSource: "internal",
    compatibilityProfile: "mobile-default",
    tags: deepFreeze(["lighthouse_island_rocky", "synthetic_world_scene"])
  }),
  generationRules: deepFreeze({
    deterministic: true,
    seedMode: "explicit",
    recipeVersionLocked: true
  })
});

const syntheticLighthouseManifest = deepFreeze({
  assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
  category: "landmarks",
  version: "1.0.0",
  status: "validated",
  recipeId: "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001",
  componentReferences: deepFreeze([
    "LIGHTHOUSE_TOWER_BASE_001",
    "LIGHTHOUSE_TOWER_BODY_SHORT_001",
    "LIGHTHOUSE_TOWER_BODY_MEDIUM_001",
    "LIGHTHOUSE_TOWER_BODY_TALL_001",
    "LIGHTHOUSE_LANTERN_BASE_001",
    "LIGHTHOUSE_GLASS_RING_001",
    "LIGHTHOUSE_LIGHT_SOURCE_001",
    "LIGHTHOUSE_BEAM_EFFECT_001",
    "LIGHTHOUSE_ROOF_CAP_001"
  ]),
  metadata: deepFreeze({
    creatorSource: "internal",
    validationState: "validated",
    manifestRole: "synthetic_world_landmark"
  }),
  tags: deepFreeze(["landmarks", "synthetic_world_scene"]),
  generationRules: deepFreeze({
    deterministic: true,
    seedMode: "explicit",
    recipeVersionLocked: true
  })
});

const syntheticLighthousePlacementRule = deepFreeze({
  placementRuleId: "PLACEMENT_LANDMARK_COASTAL_001",
  assetCategory: "landmarks",
  allowedLocations: deepFreeze(["landmark_site", "coastal_point"]),
  orientationRules: deepFreeze({
    allowedOrientations: deepFreeze(["north", "south", "east", "west", "faceRoad"]),
    defaultOrientation: "faceRoad",
    alignmentRule: "cell-center"
  }),
  terrainRequirements: deepFreeze({
    allowedTerrainTypes: deepFreeze(["sand", "grass", "dirt"]),
    blockedTerrainTypes: deepFreeze(["water_edge"])
  }),
  spacingRules: deepFreeze({
    minDistanceMetres: 5,
    gridSizeMetres: 1,
    clusterSpacingMetres: 8
  }),
  compatibilityRules: deepFreeze({
    allowedAssetIds: deepFreeze(["LIGHTHOUSE_ISLAND_ROCKY_001"]),
    incompatibleAssetIds: deepFreeze([])
  }),
  metadata: deepFreeze({
    creatorSource: "internal",
    validationState: "validated",
    deterministic: true
  })
});

function createSyntheticComponentRecord(
  componentId,
  category,
  type,
  width,
  height,
  depth
) {
  return deepFreeze({
    componentId,
    category,
    type,
    version: "1.0.0",
    status: "validated",
    dimensions: deepFreeze({
      width,
      height,
      depth
    }),
    attachmentPoints: deepFreeze([
      {
        pointId: `${componentId}_ATTACH_ROOT`,
        type: "root",
        position: {
          x: 0,
          y: 0,
          z: 0
        }
      }
    ]),
    compatibilityRules: deepFreeze({
      allowedCategories: deepFreeze([]),
      allowedTypes: deepFreeze([]),
      disallowedComponentIds: deepFreeze([])
    }),
    tags: deepFreeze(["synthetic_world_scene", category]),
    metadata: deepFreeze({
      creatorSource: "internal",
      validationState: "validated"
    })
  });
}
