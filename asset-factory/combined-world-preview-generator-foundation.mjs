import {
  buildControlledRealLocationSyntheticPreviewContext,
  controlledRealLocationSyntheticPreviewDefinition,
  validateControlledRealLocationSyntheticPreview
} from "./controlled-real-location-synthetic-preview.mjs";
import {
  environmentAndBiomePreviewFoundationDefinition,
  validateEnvironmentAndBiomePreviewFoundation
} from "./environment-and-biome-preview-foundation.mjs";
import { resolveDeterministicAssetSelection } from "./deterministic-asset-resolver.mjs";
import {
  createDeterministicWorldInstanceId,
  validateWorldInstanceManagerFoundation
} from "./world-instance-manager-foundation.mjs";
import { validateWorldStreamingCoordinatorFoundation } from "./world-streaming-coordinator-foundation.mjs";
import { validateWorldPipelineRendererBridge } from "./world-pipeline-renderer-bridge.mjs";
import {
  calculateDeterministicPlacement,
  createWorldPlacementRuleRegistry,
  coreWorldPlacementRules
} from "./world-placement-rules.mjs";
import { adaptFactoryAssetForRenderer } from "./factory-to-renderer-adapter.mjs";
import { buildStarterAssetFactoryLayers } from "./starter-asset-manifest-pack.mjs";

export const combinedWorldPreviewGeneratorFoundationRequiredFields = Object.freeze([
  "previewWorldId",
  "locationRequest",
  "worldSeed",
  "expectedStructureAssetIds",
  "expectedEnvironmentAssetIds",
  "expectedRendererAssetIds"
]);

export const combinedWorldPreviewGeneratorFoundationDefinition = deepFreeze({
  previewWorldId: "COMBINED_WORLD_PREVIEW_GENERATOR_001",
  locationRequest: deepFreeze({
    ...controlledRealLocationSyntheticPreviewDefinition.locationRequest
  }),
  worldSeed: controlledRealLocationSyntheticPreviewDefinition.locationRequest.worldSeed,
  expectedStructureAssetIds: deepFreeze([
    "BUILDING_HOUSE_SMALL_COASTAL_001",
    "ROAD_STRAIGHT_SMALL_001",
    "TREE_EUCALYPTUS_001",
    "ROCK_COASTAL_001"
  ]),
  expectedEnvironmentAssetIds: deepFreeze([
    "GRASS_PATCH_001",
    "TREE_EUCALYPTUS_001",
    "ROCK_COASTAL_001",
    "BUSH_NATIVE_001",
    "TRAIL_PATH_SMALL_001",
    "FENCE_WOOD_001",
    "BENCH_PARK_001"
  ]),
  expectedRendererAssetIds: deepFreeze([
    "ROAD_STRAIGHT_SMALL_001",
    "TRAIL_PATH_SMALL_001",
    "BUILDING_HOUSE_SMALL_COASTAL_001",
    "BENCH_PARK_001",
    "TREE_EUCALYPTUS_001",
    "GRASS_PATCH_001",
    "BUSH_NATIVE_001",
    "ROCK_COASTAL_001",
    "FENCE_WOOD_001",
    "TREE_EUCALYPTUS_001",
    "ROCK_COASTAL_001"
  ])
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedRendererProfile = "custom-2.5d-passive";

const environmentRendererTargets = deepFreeze({
  grass: deepFreeze({
    assetCategory: "nature",
    locationSuffix: "GRASS_FILL_001",
    priorityCategory: "environment_objects",
    state: "ready",
    coordinateOffset: { x: 22, y: 1 },
    locationType: "nature_cluster",
    placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
    placementSeedSuffix: "grass"
  }),
  trees: deepFreeze({
    assetCategory: "nature",
    locationSuffix: "TREE_FILL_001",
    priorityCategory: "environment_objects",
    state: "visible",
    coordinateOffset: { x: 26, y: 2 },
    locationType: "nature_cluster",
    placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
    placementSeedSuffix: "trees"
  }),
  rocks: deepFreeze({
    assetCategory: "nature",
    locationSuffix: "ROCK_FILL_001",
    priorityCategory: "environment_objects",
    state: "cached",
    coordinateOffset: { x: 30, y: 1 },
    locationType: "nature_cluster",
    placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
    placementSeedSuffix: "rocks"
  }),
  shrubs: deepFreeze({
    assetCategory: "nature",
    locationSuffix: "SHRUB_FILL_001",
    priorityCategory: "environment_objects",
    state: "ready",
    coordinateOffset: { x: 34, y: 1 },
    locationType: "nature_cluster",
    placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
    placementSeedSuffix: "shrubs"
  }),
  paths: deepFreeze({
    assetCategory: "roads",
    locationSuffix: "PATH_FILL_001",
    priorityCategory: "objectives",
    state: "ready",
    coordinateOffset: { x: 38, y: 0 },
    locationType: "path_lane",
    placementRuleId: "PLACEMENT_ROAD_SEGMENT_001",
    placementSeedSuffix: "paths"
  }),
  fences: deepFreeze({
    assetCategory: "decorations",
    locationSuffix: "FENCE_FILL_001",
    priorityCategory: "environment_objects",
    state: "cached",
    coordinateOffset: { x: 42, y: 1 },
    locationType: "road_edge",
    placementRuleId: "PLACEMENT_DECORATION_EDGE_001",
    placementSeedSuffix: "fences"
  }),
  parkObjects: deepFreeze({
    assetCategory: "decorations",
    locationSuffix: "PARK_OBJECT_FILL_001",
    priorityCategory: "environment_objects",
    state: "visible",
    coordinateOffset: { x: 46, y: 1 },
    locationType: "building_plot",
    placementRuleId: "PLACEMENT_DECORATION_EDGE_001",
    placementSeedSuffix: "parkObjects"
  })
});

export function buildCombinedWorldPreviewGeneratorFoundationContext() {
  const starterLayers = buildStarterAssetFactoryLayers();

  return Object.freeze({
    starterLayers,
    placementRuleRegistry: createWorldPlacementRuleRegistry(coreWorldPlacementRules),
    previewContext: buildControlledRealLocationSyntheticPreviewContext()
  });
}

export function validateCombinedWorldPreviewGeneratorFoundation(
  rawFoundation = combinedWorldPreviewGeneratorFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const structurePreviewResult =
      normalizedOptions.validateControlledRealLocationSyntheticPreview(
        buildStructurePreviewDefinition(foundation.locationRequest),
        { context: normalizedOptions.context.previewContext }
      );
    if (!structurePreviewResult.ok) {
      return freezeFailure(structurePreviewResult);
    }

    const environmentPreviewResult =
      normalizedOptions.validateEnvironmentAndBiomePreviewFoundation(
        buildEnvironmentPreviewDefinition(foundation.locationRequest),
        { context: normalizedOptions.context.previewContext }
      );
    if (!environmentPreviewResult.ok) {
      return freezeFailure(environmentPreviewResult);
    }

    const worldInstanceResult =
      normalizedOptions.validateWorldInstanceManagerFoundation();
    if (!worldInstanceResult.ok) {
      return freezeFailure(worldInstanceResult);
    }

    const streamingBenchmark =
      normalizedOptions.validateWorldStreamingCoordinatorFoundation();
    if (!streamingBenchmark.ok) {
      return freezeFailure(streamingBenchmark);
    }

    const bridgeBenchmark =
      normalizedOptions.validateWorldPipelineRendererBridge();
    if (!bridgeBenchmark.ok) {
      return freezeFailure(bridgeBenchmark);
    }

    validateExpectedAssetIds(
      foundation.expectedStructureAssetIds,
      structurePreviewResult.previewWorld.generatedInstances.map((entry) => entry.assetId),
      "structure_asset_mismatch",
      "Structure instances do not match the expected deterministic structure asset set."
    );
    validateExpectedAssetIds(
      foundation.expectedEnvironmentAssetIds,
      environmentPreviewResult.environmentBiomePreview.environmentModules.map(
        (entry) => entry.assetId
      ),
      "environment_asset_mismatch",
      "Environment instances do not match the expected deterministic environment asset set."
    );

    const structureInstances = normalizeStructureInstances(
      structurePreviewResult.previewWorld.generatedInstances
    );
    const environmentInstances = buildEnvironmentInstances(
      structurePreviewResult.previewWorld,
      environmentPreviewResult.environmentBiomePreview,
      normalizedOptions.context
    );

    const combinedInstances = deepFreeze([
      ...structureInstances,
      ...environmentInstances
    ]);

    validateConflictRules(combinedInstances);

    const rendererPayload = buildCombinedRendererPayload(
      structurePreviewResult.previewWorld.rendererPreviewPayload,
      environmentInstances
    );

    validateExpectedAssetIds(
      foundation.expectedRendererAssetIds,
      rendererPayload.map((entry) => entry.rendererAssetReference.assetId),
      "renderer_asset_mismatch",
      "Combined renderer payload does not match the expected deterministic asset ordering."
    );

    const worldDensityRules = buildWorldDensityRules(
      structureInstances,
      environmentInstances
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      combinedWorldPreview: Object.freeze({
        previewWorldId: createPreviewWorldId(
          foundation.previewWorldId,
          foundation.locationRequest.locationId,
          foundation.worldSeed
        ),
        locationRequest: deepFreeze({ ...foundation.locationRequest }),
        structureInstances,
        environmentInstances,
        worldSeed: foundation.worldSeed,
        rendererPayload,
        worldDensityRules,
        validation: Object.freeze({
          spacingVerified: true,
          terrainCompatibilityVerified: true,
          placementConflictsVerified: true,
          assetCompatibilityVerified: true,
          deterministicWorldPreviewVerified: true,
          streamingSelectionVerified: true
        }),
        compatibility: Object.freeze({
          passiveOnly: true,
          gpsConnected: false,
          externalMapServicesQueried: false,
          liveWorldObjectsCreated: false,
          rendererModified: false,
          gameplayModified: false,
          firebaseModified: false,
          backendModified: false,
          worldInstanceBenchmarkVerified:
            worldInstanceResult.worldInstanceManager.compatibility
              .deterministicIdentityVerified === true,
          streamingBenchmarkVerified:
            streamingBenchmark.worldStreamingCoordinator.compatibility
              .passiveHandoffVerified === true,
          bridgeBenchmarkVerified:
            bridgeBenchmark.worldPipelineRendererBridge.compatibility
              .deterministicPayloadVerified === true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "CombinedWorldPreviewGeneratorFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      combinedWorldPreview: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildCombinedWorldPreviewGeneratorFoundationContext(),
    validateControlledRealLocationSyntheticPreview:
      options.validateControlledRealLocationSyntheticPreview ??
      validateControlledRealLocationSyntheticPreview,
    validateEnvironmentAndBiomePreviewFoundation:
      options.validateEnvironmentAndBiomePreviewFoundation ??
      validateEnvironmentAndBiomePreviewFoundation,
    validateWorldInstanceManagerFoundation:
      options.validateWorldInstanceManagerFoundation ??
      validateWorldInstanceManagerFoundation,
    validateWorldStreamingCoordinatorFoundation:
      options.validateWorldStreamingCoordinatorFoundation ??
      validateWorldStreamingCoordinatorFoundation,
    validateWorldPipelineRendererBridge:
      options.validateWorldPipelineRendererBridge ??
      validateWorldPipelineRendererBridge
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "combined world preview generator foundation"
  );
  assertRequiredFields(foundation);

  const locationRequest = normalizeLocationRequest(foundation.locationRequest);
  const worldSeed = normalizeStringValue(foundation.worldSeed, "worldSeed");
  if (locationRequest.worldSeed !== worldSeed) {
    throw createValidationError(
      "world_seed_mismatch",
      "locationRequest.worldSeed must match worldSeed for the combined world preview generator."
    );
  }

  return deepFreeze({
    previewWorldId: normalizePermanentId(
      foundation.previewWorldId,
      "previewWorldId"
    ),
    locationRequest,
    worldSeed,
    expectedStructureAssetIds: normalizePermanentIdArray(
      foundation.expectedStructureAssetIds,
      "expectedStructureAssetIds"
    ),
    expectedEnvironmentAssetIds: normalizePermanentIdArray(
      foundation.expectedEnvironmentAssetIds,
      "expectedEnvironmentAssetIds"
    ),
    expectedRendererAssetIds: normalizePermanentIdArray(
      foundation.expectedRendererAssetIds,
      "expectedRendererAssetIds"
    )
  });
}

function normalizeLocationRequest(rawLocationRequest) {
  const locationRequest = asPlainObject(rawLocationRequest, "locationRequest");

  return deepFreeze({
    locationId: normalizePermanentId(
      locationRequest.locationId,
      "locationRequest.locationId"
    ),
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

function normalizeStructureInstances(generatedInstances) {
  return deepFreeze(
    generatedInstances.map((entry) =>
      deepFreeze({
        instanceId: normalizePermanentId(entry.instanceId, "structure.instanceId"),
        assetId: normalizePermanentId(entry.assetId, "structure.assetId"),
        assetFamilyId: normalizePermanentId(
          entry.assetFamilyId,
          "structure.assetFamilyId"
        ),
        locationId: normalizePermanentId(entry.locationId, "structure.locationId"),
        streamingState: normalizeStringValue(
          entry.streamingState,
          "structure.streamingState"
        ),
        selectedLodProfile: normalizeStringValue(
          entry.selectedLodProfile,
          "structure.selectedLodProfile"
        ),
        loadingPriority: normalizeFiniteNumber(
          entry.loadingPriority,
          "structure.loadingPriority"
        ),
        placement: deepFreeze({
          locationId: normalizePermanentId(
            entry.placementResult.placement.locationId,
            "structure.placement.locationId"
          ),
          position: deepFreeze({
            x: normalizeFiniteNumber(
              entry.placementResult.placement.position.x,
              "structure.placement.position.x"
            ),
            y: normalizeFiniteNumber(
              entry.placementResult.placement.position.y,
              "structure.placement.position.y"
            )
          }),
          orientation: normalizeStringValue(
            entry.placementResult.placement.orientation,
            "structure.placement.orientation"
          ),
          alignmentRule: normalizeStringValue(
            entry.placementResult.placement.alignmentRule,
            "structure.placement.alignmentRule"
          ),
          terrainType: normalizeStringValue(
            entry.placementResult.placement.terrainType,
            "structure.placement.terrainType"
          ),
          spacingProfile: deepFreeze({
            minDistanceMetres: normalizeFiniteNumber(
              entry.placementResult.placement.spacingProfile.minDistanceMetres,
              "structure.placement.spacingProfile.minDistanceMetres"
            ),
            clusterSpacingMetres: normalizeFiniteNumber(
              entry.placementResult.placement.spacingProfile.clusterSpacingMetres,
              "structure.placement.spacingProfile.clusterSpacingMetres"
            )
          }),
          placementRuleId: normalizePermanentId(
            entry.placementResult.deterministicPlacement.placementRuleId,
            "structure.placement.placementRuleId"
          )
        }),
        rendererPayload: null
      })
    )
  );
}

function buildEnvironmentInstances(previewWorld, environmentBiomePreview, context) {
  return deepFreeze(
    environmentBiomePreview.environmentModules.map((module) =>
      buildEnvironmentInstance(
        previewWorld.locationRequest,
        previewWorld.worldSeed,
        module,
        context
      )
    )
  );
}

function buildEnvironmentInstance(locationRequest, worldSeed, module, context) {
  const target = environmentRendererTargets[module.moduleGroup];
  const locationId = `${locationRequest.locationId}_${target.locationSuffix}`;
  const coordinates = {
    x: Number((locationRequest.latitude + target.coordinateOffset.x).toFixed(6)),
    y: Number((locationRequest.longitude + target.coordinateOffset.y).toFixed(6))
  };

  const placementResult = calculateDeterministicPlacement(
    {
      placementRuleId: target.placementRuleId,
      assetId: module.assetId,
      locationId,
      coordinates,
      seed: `${worldSeed}::combined-world-preview::${target.placementSeedSuffix}`,
      terrainType: "grass",
      locationType: target.locationType
    },
    {
      assetRegistry: context.starterLayers.assetRegistry,
      manifestRegistry: context.starterLayers.manifestRegistry,
      placementRuleRegistry: context.placementRuleRegistry
    }
  );
  if (!placementResult.ok) {
    throw createValidationError(
      placementResult.errorCode ?? "environment_instance_placement_failed",
      placementResult.message ??
        `Environment placement for ${module.moduleGroup} failed in the combined world preview generator.`
    );
  }

  const manifest = context.starterLayers.manifestRegistry.findManifestByAssetId(
    module.assetId
  );

  const rendererAdaptation = adaptFactoryAssetForRenderer(
    {
      assetId: module.assetId,
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
        rendererAdapterProfile: supportedRendererProfile,
        placementMetadata: {
          deterministic: true,
          moduleGroup: module.moduleGroup,
          appearanceProfiles: module.appearanceProfiles
        }
      }
    },
    {
      ...context.starterLayers,
      placementRuleRegistry: context.placementRuleRegistry
    }
  );
  if (!rendererAdaptation.ok) {
    throw createValidationError(
      rendererAdaptation.errorCode ?? "environment_renderer_adaptation_failed",
      rendererAdaptation.message ??
        `Environment renderer adaptation for ${module.moduleGroup} failed.`
    );
  }

  return deepFreeze({
    instanceId: createDeterministicWorldInstanceId({
      locationId,
      assetId: module.assetId,
      worldSeed: `${worldSeed}::combined-world-preview`
    }).instanceId,
    assetId: module.assetId,
    assetFamilyId: deriveAssetFamilyId(module.assetId),
    locationId,
    streamingState: target.state,
    selectedLodProfile: target.state === "visible" ? "close" : target.state === "ready" ? "gameplay" : "map",
    loadingPriority: determineEnvironmentPriority(module.moduleGroup),
    placement: deepFreeze({
      locationId: placementResult.placement.locationId,
      position: deepFreeze({
        x: placementResult.placement.position.x,
        y: placementResult.placement.position.y
      }),
      orientation: placementResult.placement.orientation,
      alignmentRule: placementResult.placement.alignmentRule,
      terrainType: placementResult.placement.terrainType,
      spacingProfile: deepFreeze({
        minDistanceMetres: placementResult.placement.spacingProfile.minDistanceMetres,
        clusterSpacingMetres:
          placementResult.placement.spacingProfile.clusterSpacingMetres
      }),
      placementRuleId: placementResult.deterministicPlacement.placementRuleId
    }),
    density: module.density,
    rendererPayload: deepFreeze({
      rendererAssetReference: rendererAdaptation.rendererAssetReference,
      rendererComponentReferences: rendererAdaptation.rendererComponentReferences,
      transformData: rendererAdaptation.transformData,
      placementData: deepFreeze({
        locationId: placementResult.placement.locationId,
        placementRuleId: placementResult.deterministicPlacement.placementRuleId,
        orientation: placementResult.placement.orientation,
        alignmentRule: placementResult.placement.alignmentRule
      }),
      lodProfile:
        target.state === "visible" ? "close" : target.state === "ready" ? "gameplay" : "map",
      visibilityMetadata: deepFreeze({
        visibilityState: target.state,
        priority: determineEnvironmentPriority(module.moduleGroup),
        distanceToPlayerMetres: calculateDistanceFromOrigin(
          locationRequest.latitude,
          locationRequest.longitude,
          placementResult.placement.position.x,
          placementResult.placement.position.y
        ),
        assetFamilyId: deriveAssetFamilyId(module.assetId)
      }),
      passiveRendererPayload: deepFreeze({
        rendererAssetReference: rendererAdaptation.rendererAssetReference,
        rendererComponentReferences: rendererAdaptation.rendererComponentReferences,
        transformData: rendererAdaptation.transformData,
        orientation: rendererAdaptation.transformData.orientation,
        metadata: rendererAdaptation.metadata
      })
    })
  });
}

function buildCombinedRendererPayload(structurePayloads, environmentInstances) {
  const environmentPayloads = environmentInstances.map((entry) => entry.rendererPayload);

  return deepFreeze(
    [...structurePayloads, ...environmentPayloads].sort((left, right) => {
      if (right.visibilityMetadata.priority !== left.visibilityMetadata.priority) {
        return right.visibilityMetadata.priority - left.visibilityMetadata.priority;
      }
      return left.rendererAssetReference.assetId.localeCompare(
        right.rendererAssetReference.assetId
      );
    })
  );
}

function buildWorldDensityRules(structureInstances, environmentInstances) {
  const vegetationCount = environmentInstances.filter((entry) =>
    ["GRASS_PATCH_001", "TREE_EUCALYPTUS_001", "BUSH_NATIVE_001"].includes(
      entry.assetId
    )
  ).length;
  const rockCount = environmentInstances.filter(
    (entry) => entry.assetId === "ROCK_COASTAL_001"
  ).length;
  const decorationCount = environmentInstances.filter((entry) =>
    ["FENCE_WOOD_001", "BENCH_PARK_001"].includes(entry.assetId)
  ).length;

  return deepFreeze({
    structures: deepFreeze({
      count: structureInstances.length,
      densityPerPreview: Number((structureInstances.length / 11).toFixed(4))
    }),
    vegetation: deepFreeze({
      count: vegetationCount,
      densityPerPreview: Number((vegetationCount / 11).toFixed(4))
    }),
    rocks: deepFreeze({
      count: rockCount,
      densityPerPreview: Number((rockCount / 11).toFixed(4))
    }),
    decorations: deepFreeze({
      count: decorationCount,
      densityPerPreview: Number((decorationCount / 11).toFixed(4))
    })
  });
}

function validateConflictRules(combinedInstances) {
  validateUniqueLocations(combinedInstances);
  validateSpacing(combinedInstances);
  validateTerrainCompatibility(combinedInstances);
  validatePlacementConflicts(combinedInstances);
  validateAssetCompatibility(combinedInstances);
}

function validateUniqueLocations(instances) {
  const seen = new Set();
  for (const instance of instances) {
    if (seen.has(instance.locationId)) {
      throw createValidationError(
        "duplicate_location_id",
        `Combined world preview location ${instance.locationId} is duplicated.`
      );
    }
    seen.add(instance.locationId);
  }
}

function validateSpacing(instances) {
  for (let leftIndex = 0; leftIndex < instances.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < instances.length; rightIndex += 1) {
      const left = instances[leftIndex];
      const right = instances[rightIndex];
      const distance = calculateDistance(
        left.placement.position,
        right.placement.position
      );
      const minimumRequired = Math.min(
        left.placement.spacingProfile.minDistanceMetres,
        right.placement.spacingProfile.minDistanceMetres
      );

      if (distance < minimumRequired) {
        throw createValidationError(
          "spacing_conflict",
          `Combined world preview instances ${left.instanceId} and ${right.instanceId} violate minimum spacing.`
        );
      }
    }
  }
}

function validateTerrainCompatibility(instances) {
  for (const instance of instances) {
    if (instance.placement.terrainType !== "grass") {
      throw createValidationError(
        "terrain_compatibility_mismatch",
        `Combined world preview instance ${instance.instanceId} is not on the expected preview terrain type.`
      );
    }
  }
}

function validatePlacementConflicts(instances) {
  for (let leftIndex = 0; leftIndex < instances.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < instances.length; rightIndex += 1) {
      const left = instances[leftIndex];
      const right = instances[rightIndex];
      if (
        left.placement.placementRuleId === right.placement.placementRuleId &&
        left.placement.position.x === right.placement.position.x &&
        left.placement.position.y === right.placement.position.y
      ) {
        throw createValidationError(
          "placement_conflict",
          `Combined world preview instances ${left.instanceId} and ${right.instanceId} collide on the same placement output.`
        );
      }
    }
  }
}

function validateAssetCompatibility(instances) {
  for (const instance of instances) {
    if (
      !instance.rendererPayload &&
      !["ROAD_STRAIGHT_SMALL_001", "BUILDING_HOUSE_SMALL_COASTAL_001", "TREE_EUCALYPTUS_001", "ROCK_COASTAL_001"].includes(instance.assetId)
    ) {
      throw createValidationError(
        "asset_compatibility_mismatch",
        `Combined world preview instance ${instance.instanceId} is missing renderer payload compatibility.`
      );
    }
  }
}

function validateExpectedAssetIds(expected, actual, errorCode, message) {
  if (!areArraysEqual(expected, actual)) {
    throw createValidationError(errorCode, message);
  }
}

function buildStructurePreviewDefinition(locationRequest) {
  return deepFreeze({
    ...controlledRealLocationSyntheticPreviewDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function buildEnvironmentPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...environmentAndBiomePreviewFoundationDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function determineEnvironmentPriority(moduleGroup) {
  switch (moduleGroup) {
    case "paths":
      return 3900;
    case "parkObjects":
      return 1800;
    case "trees":
      return 1600;
    case "grass":
      return 1500;
    case "shrubs":
      return 1400;
    case "rocks":
      return 1300;
    case "fences":
      return 1200;
    default:
      return 1000;
  }
}

function deriveAssetFamilyId(assetId) {
  const withoutNumericSuffix = assetId.replace(/_[0-9]{3,}$/, "");
  return `${withoutNumericSuffix}_FAMILY_001`;
}

function createPreviewWorldId(baseId, locationId, worldSeed) {
  const hash = stableHash([baseId, locationId, worldSeed].join("::"));
  return `${baseId}_${String(hash).padStart(10, "0")}`;
}

function calculateDistance(left, right) {
  const deltaX = right.x - left.x;
  const deltaY = right.y - left.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function calculateDistanceFromOrigin(originX, originY, x, y) {
  return calculateDistance({ x: originX, y: originY }, { x, y });
}

function assertRequiredFields(foundation) {
  for (const fieldName of combinedWorldPreviewGeneratorFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Combined world preview generator foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_permanent_id_array",
      `${fieldName} must be a non-empty array of permanent IDs.`
    );
  }

  return deepFreeze(
    value.map((entry, index) =>
      normalizePermanentId(entry, `${fieldName}[${index}]`)
    )
  );
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must use the approved permanent ID format.`
    );
  }

  return normalized;
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
    combinedWorldPreview: null
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
  error.name = "CombinedWorldPreviewGeneratorFoundationValidationError";
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
