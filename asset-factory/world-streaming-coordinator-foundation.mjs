import {
  buildWorldInstanceManagerFoundationContext,
  createDeterministicWorldInstanceId,
  validateWorldInstanceManagerFoundation
} from "./world-instance-manager-foundation.mjs";
import { resolveDeterministicAssetSelection } from "./deterministic-asset-resolver.mjs";
import { calculateDeterministicPlacement } from "./world-placement-rules.mjs";
import { adaptFactoryAssetForRenderer } from "./factory-to-renderer-adapter.mjs";

export const worldStreamingCoordinatorFoundationRequiredFields = Object.freeze([
  "streamingRequest",
  "instanceCandidates",
  "cacheMetadata",
  "passiveHandoff"
]);

export const worldStreamingStates = Object.freeze([
  "requested",
  "loading",
  "ready",
  "visible",
  "cached",
  "unloaded"
]);

export const worldStreamingPriorityCategories = Object.freeze([
  "quest_landmarks",
  "npc_locations",
  "objectives",
  "businesses",
  "buildings",
  "environment_objects"
]);

const defaultStreamingRequest = deepFreeze({
  playerLocation: {
    anchorId: "PLAYER_ANCHOR_ALPHA_001",
    coordinates: {
      x: 10,
      y: 6
    }
  },
  worldRegion: {
    regionId: "COASTAL_TOWN_ALPHA_REGION_001",
    regionSeed: "world-instance-seed-001"
  },
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
  lodRules: {
    closeDistanceMetres: 5,
    mediumDistanceMetres: 12,
    farDistanceMetres: 20
  }
});

const defaultInstanceCandidates = deepFreeze([
  createStreamingCandidateRecord({
    assetId: "BUILDING_BAKERY_SMALL_001",
    assetFamilyId: "BUILDING_BAKERY_SMALL_FAMILY_001",
    locationId: "PLOT_ALPHA_001",
    worldSeed: "world-instance-seed-001",
    placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
    priorityCategory: "businesses",
    state: "visible",
    coordinates: {
      x: 8.25,
      y: 5.5
    },
    terrainType: "grass",
    locationType: "building_plot"
  }),
  createStreamingCandidateRecord({
    assetId: "BUILDING_SHOP_GENERAL_001",
    assetFamilyId: "BUILDING_SHOP_GENERAL_FAMILY_001",
    locationId: "PLOT_BRAVO_001",
    worldSeed: "world-instance-seed-001",
    placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
    priorityCategory: "businesses",
    state: "ready",
    coordinates: {
      x: 16.5,
      y: 8
    },
    terrainType: "grass",
    locationType: "building_plot"
  }),
  createStreamingCandidateRecord({
    assetId: "TREE_EUCALYPTUS_001",
    assetFamilyId: "TREE_EUCALYPTUS_FAMILY_001",
    locationId: "NATURE_CLUSTER_DELTA_001",
    worldSeed: "world-instance-seed-001",
    placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
    priorityCategory: "environment_objects",
    state: "cached",
    coordinates: {
      x: 28,
      y: 10
    },
    terrainType: "grass",
    locationType: "nature_cluster",
    resolverAvailableAssetReferences: ["TREE_EUCALYPTUS_001"]
  }),
  createStreamingCandidateRecord({
    assetId: "ROCK_COASTAL_001",
    assetFamilyId: "ROCK_COASTAL_FAMILY_001",
    locationId: "NATURE_CLUSTER_ECHO_001",
    worldSeed: "world-instance-seed-001",
    placementRuleId: "PLACEMENT_NATURE_CLUSTER_001",
    priorityCategory: "environment_objects",
    state: "unloaded",
    coordinates: {
      x: 42,
      y: 12
    },
    terrainType: "grass",
    locationType: "nature_cluster",
    resolverAvailableAssetReferences: ["ROCK_COASTAL_001"]
  })
]);

const defaultCacheMetadata = deepFreeze({
  assetReuseRule: "same-asset-same-location-same-seed",
  memoryPriority: "balanced",
  storageEligibility: "local-streaming-cache-eligible"
});

export const worldStreamingCoordinatorFoundationDefinition = deepFreeze({
  streamingRequest: defaultStreamingRequest,
  instanceCandidates: defaultInstanceCandidates,
  cacheMetadata: defaultCacheMetadata,
  passiveHandoff: buildPassiveHandoffDefinition(
    defaultStreamingRequest,
    defaultInstanceCandidates
  )
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLodProfiles = Object.freeze(["close", "gameplay", "map"]);
const supportedMemoryPriorities = Object.freeze(["low", "balanced", "high"]);
const supportedStorageEligibility = Object.freeze([
  "local-streaming-cache-eligible",
  "memory-only-cache",
  "cache-disabled"
]);

export function buildWorldStreamingCoordinatorFoundationContext() {
  return Object.freeze(buildWorldInstanceManagerFoundationContext());
}

export function validateWorldStreamingCoordinatorFoundation(
  rawFoundation = worldStreamingCoordinatorFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeCoordinatorOptions(options);
    const foundation = normalizeWorldStreamingCoordinatorFoundation(rawFoundation);

    const worldInstanceResult = normalizedOptions.validateWorldInstanceManagerFoundation();
    if (!worldInstanceResult.ok) {
      return freezeFailure(worldInstanceResult);
    }

    const evaluations = foundation.instanceCandidates.map((candidate) =>
      evaluateStreamingCandidate(candidate, foundation.streamingRequest, normalizedOptions.context)
    );

    const computedHandoff = computePassiveHandoff(
      foundation.streamingRequest,
      foundation.instanceCandidates
    );

    validatePriorityRules(foundation.streamingRequest.priorityRules);
    validateCacheMetadata(foundation.cacheMetadata);
    validatePassiveHandoff(foundation.passiveHandoff, computedHandoff);
    validateCandidateStates(foundation.instanceCandidates, evaluations);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldStreamingCoordinator: Object.freeze({
        foundation,
        worldInstanceManager: worldInstanceResult.worldInstanceManager,
        candidateEvaluations: deepFreeze(evaluations),
        passiveHandoff: computedHandoff,
        compatibility: Object.freeze({
          requestStructureVerified: true,
          priorityHandlingVerified: true,
          lodSelectionVerified: true,
          cacheMetadataVerified: true,
          passiveHandoffVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "WorldStreamingCoordinatorFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldStreamingCoordinator: null
    });
  }
}

function normalizeCoordinatorOptions(options) {
  return Object.freeze({
    context: options.context ?? buildWorldStreamingCoordinatorFoundationContext(),
    validateWorldInstanceManagerFoundation:
      typeof options.validateWorldInstanceManagerFoundation === "function"
        ? options.validateWorldInstanceManagerFoundation
        : validateWorldInstanceManagerFoundation
  });
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    worldStreamingCoordinator: null
  });
}

function normalizeWorldStreamingCoordinatorFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "world streaming coordinator foundation"
  );
  assertRequiredFields(foundation);

  return deepFreeze({
    streamingRequest: normalizeStreamingRequest(foundation.streamingRequest),
    instanceCandidates: deepFreeze(
      normalizeInstanceCandidates(foundation.instanceCandidates)
    ),
    cacheMetadata: normalizeCoordinatorCacheMetadata(foundation.cacheMetadata),
    passiveHandoff: normalizePassiveHandoff(foundation.passiveHandoff)
  });
}

function normalizeStreamingRequest(value) {
  const request = asPlainObject(value, "streamingRequest");
  const playerLocation = asPlainObject(
    request.playerLocation,
    "streamingRequest.playerLocation"
  );
  const worldRegion = asPlainObject(
    request.worldRegion,
    "streamingRequest.worldRegion"
  );
  const lodRules = asPlainObject(request.lodRules, "streamingRequest.lodRules");

  const loadRadius = normalizePositiveNumber(
    request.loadRadius,
    "streamingRequest.loadRadius"
  );
  const unloadRadius = normalizePositiveNumber(
    request.unloadRadius,
    "streamingRequest.unloadRadius"
  );
  if (unloadRadius <= loadRadius) {
    throw createValidationError(
      "invalid_streaming_radii",
      "streamingRequest.unloadRadius must be greater than streamingRequest.loadRadius."
    );
  }

  const normalizedLodRules = deepFreeze({
    closeDistanceMetres: normalizePositiveNumber(
      lodRules.closeDistanceMetres,
      "streamingRequest.lodRules.closeDistanceMetres"
    ),
    mediumDistanceMetres: normalizePositiveNumber(
      lodRules.mediumDistanceMetres,
      "streamingRequest.lodRules.mediumDistanceMetres"
    ),
    farDistanceMetres: normalizePositiveNumber(
      lodRules.farDistanceMetres,
      "streamingRequest.lodRules.farDistanceMetres"
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
      "LOD rules must increase from close to medium to far and remain within loadRadius."
    );
  }

  return deepFreeze({
    playerLocation: deepFreeze({
      anchorId: normalizePermanentId(
        playerLocation.anchorId,
        "streamingRequest.playerLocation.anchorId"
      ),
      coordinates: normalizeCoordinates(
        playerLocation.coordinates,
        "streamingRequest.playerLocation.coordinates"
      )
    }),
    worldRegion: deepFreeze({
      regionId: normalizePermanentId(
        worldRegion.regionId,
        "streamingRequest.worldRegion.regionId"
      ),
      regionSeed: normalizeStringValue(
        worldRegion.regionSeed,
        "streamingRequest.worldRegion.regionSeed"
      )
    }),
    loadRadius,
    unloadRadius,
    priorityRules: deepFreeze(normalizePriorityRules(request.priorityRules)),
    lodRules: normalizedLodRules
  });
}

function normalizePriorityRules(value) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      "streamingRequest.priorityRules must be an array."
    );
  }
  return value.map((entry, index) => {
    const rule = asPlainObject(entry, `streamingRequest.priorityRules[${index}]`);
    const category = normalizeStringValue(
      rule.category,
      `streamingRequest.priorityRules[${index}].category`
    );
    if (!worldStreamingPriorityCategories.includes(category)) {
      throw createValidationError(
        "invalid_priority_category",
        `Priority category ${category} is not approved.`
      );
    }
    return deepFreeze({
      category,
      basePriority: normalizePositiveInteger(
        rule.basePriority,
        `streamingRequest.priorityRules[${index}].basePriority`
      )
    });
  });
}

function normalizeInstanceCandidates(value) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      "instanceCandidates must be an array."
    );
  }

  return value.map((entry, index) => normalizeStreamingCandidate(entry, index));
}

function normalizeStreamingCandidate(value, index) {
  const candidate = asPlainObject(value, `instanceCandidates[${index}]`);
  const metadata = asPlainObject(
    candidate.metadata,
    `instanceCandidates[${index}].metadata`
  );

  return deepFreeze({
    instanceId: normalizePermanentId(
      candidate.instanceId,
      `instanceCandidates[${index}].instanceId`
    ),
    assetId: normalizePermanentId(
      candidate.assetId,
      `instanceCandidates[${index}].assetId`
    ),
    assetFamilyId: normalizePermanentId(
      candidate.assetFamilyId,
      `instanceCandidates[${index}].assetFamilyId`
    ),
    locationId: normalizePermanentId(
      candidate.locationId,
      `instanceCandidates[${index}].locationId`
    ),
    worldSeed: normalizeStringValue(
      candidate.worldSeed,
      `instanceCandidates[${index}].worldSeed`
    ),
    placementRuleId: normalizePermanentId(
      candidate.placementRuleId,
      `instanceCandidates[${index}].placementRuleId`
    ),
    priorityCategory: normalizePriorityCategory(
      candidate.priorityCategory,
      `instanceCandidates[${index}].priorityCategory`
    ),
    state: normalizeStreamingState(
      candidate.state,
      `instanceCandidates[${index}].state`
    ),
    metadata: deepFreeze({
      coordinates: normalizeCoordinates(
        metadata.coordinates,
        `instanceCandidates[${index}].metadata.coordinates`
      ),
      terrainType: normalizeStringValue(
        metadata.terrainType,
        `instanceCandidates[${index}].metadata.terrainType`
      ),
      locationType: normalizeStringValue(
        metadata.locationType,
        `instanceCandidates[${index}].metadata.locationType`
      ),
      resolverAvailableAssetReferences: deepFreeze(
        normalizeOptionalPermanentIdArray(
          metadata.resolverAvailableAssetReferences,
          `instanceCandidates[${index}].metadata.resolverAvailableAssetReferences`
        )
      ),
      runtimeSpawnAuthorized: normalizeBoolean(
        metadata.runtimeSpawnAuthorized,
        `instanceCandidates[${index}].metadata.runtimeSpawnAuthorized`
      )
    })
  });
}

function normalizeCoordinatorCacheMetadata(value) {
  const metadata = asPlainObject(value, "cacheMetadata");
  const memoryPriority = normalizeStringValue(
    metadata.memoryPriority,
    "cacheMetadata.memoryPriority"
  );
  if (!supportedMemoryPriorities.includes(memoryPriority)) {
    throw createValidationError(
      "invalid_memory_priority",
      `Cache memory priority ${memoryPriority} is not approved.`
    );
  }

  const storageEligibility = normalizeStringValue(
    metadata.storageEligibility,
    "cacheMetadata.storageEligibility"
  );
  if (!supportedStorageEligibility.includes(storageEligibility)) {
    throw createValidationError(
      "invalid_storage_eligibility",
      `Storage eligibility ${storageEligibility} is not approved.`
    );
  }

  return deepFreeze({
    assetReuseRule: normalizeStringValue(
      metadata.assetReuseRule,
      "cacheMetadata.assetReuseRule"
    ),
    memoryPriority,
    storageEligibility
  });
}

function normalizePassiveHandoff(value) {
  const handoff = asPlainObject(value, "passiveHandoff");
  if (!Array.isArray(handoff.selectedInstances)) {
    throw createValidationError(
      "invalid_field_type",
      "passiveHandoff.selectedInstances must be an array."
    );
  }

  return deepFreeze({
    selectedInstances: deepFreeze(
      handoff.selectedInstances.map((entry, index) => {
        const selected = asPlainObject(
          entry,
          `passiveHandoff.selectedInstances[${index}]`
        );
        return deepFreeze({
          instanceId: normalizePermanentId(
            selected.instanceId,
            `passiveHandoff.selectedInstances[${index}].instanceId`
          ),
          selectedLodProfile: normalizeSelectedLodProfile(
            selected.selectedLodProfile,
            `passiveHandoff.selectedInstances[${index}].selectedLodProfile`
          ),
          loadingPriority: normalizeInteger(
            selected.loadingPriority,
            `passiveHandoff.selectedInstances[${index}].loadingPriority`
          ),
          streamingState: normalizeStreamingState(
            selected.streamingState,
            `passiveHandoff.selectedInstances[${index}].streamingState`
          )
        });
      })
    )
  });
}

function validatePriorityRules(priorityRules) {
  const categories = priorityRules.map((entry) => entry.category);
  if (JSON.stringify(categories) !== JSON.stringify(worldStreamingPriorityCategories)) {
    throw createValidationError(
      "priority_rule_order_mismatch",
      "Priority rules must follow the approved quest/npc/objective/business/building/environment order."
    );
  }
}

function validateCacheMetadata(cacheMetadata) {
  if (cacheMetadata.assetReuseRule !== "same-asset-same-location-same-seed") {
    throw createValidationError(
      "cache_reuse_rule_mismatch",
      "Streaming cache asset reuse must remain deterministic and location-bound."
    );
  }
}

function validatePassiveHandoff(passiveHandoff, computedHandoff) {
  if (
    JSON.stringify(passiveHandoff.selectedInstances) !==
    JSON.stringify(computedHandoff.selectedInstances)
  ) {
    throw createValidationError(
      "passive_handoff_mismatch",
      "Passive streaming handoff must match the computed selected instance set, LOD profiles, and priorities."
    );
  }
}

function validateCandidateStates(instanceCandidates, evaluations) {
  for (let index = 0; index < instanceCandidates.length; index += 1) {
    if (instanceCandidates[index].state !== evaluations[index].streamingState) {
      throw createValidationError(
        "streaming_state_mismatch",
        `Instance ${instanceCandidates[index].instanceId} must match the computed streaming state.`
      );
    }
    if (instanceCandidates[index].metadata.runtimeSpawnAuthorized) {
      throw createValidationError(
        "runtime_spawn_not_allowed",
        `Instance ${instanceCandidates[index].instanceId} must remain passive and runtime-spawn unauthorized.`
      );
    }
  }
}

function evaluateStreamingCandidate(candidate, streamingRequest, context) {
  validateDeterministicCandidateIdentity(candidate);

  if (candidate.metadata.resolverAvailableAssetReferences.length > 0) {
    const resolverResult = resolveDeterministicAssetSelection(
      {
        locationId: candidate.locationId,
        coordinates: candidate.metadata.coordinates,
        seed: candidate.worldSeed,
        assetCategory: "nature",
        assetType: null,
        availableAssetReferences: candidate.metadata.resolverAvailableAssetReferences,
        resolverRules: {
          variantPolicy: "seeded-index",
          variantOffset: 0
        }
      },
      context
    );
    if (!resolverResult.ok || resolverResult.selectedAsset.assetId !== candidate.assetId) {
      throw createValidationError(
        "resolver_asset_mismatch",
        `Environment candidate ${candidate.instanceId} must match the deterministic resolver output.`
      );
    }
  }

  const placementResult = calculateDeterministicPlacement(
    {
      placementRuleId: candidate.placementRuleId,
      assetId: candidate.assetId,
      locationId: candidate.locationId,
      coordinates: candidate.metadata.coordinates,
      seed: candidate.worldSeed,
      terrainType: candidate.metadata.terrainType,
      locationType: candidate.metadata.locationType
    },
    context
  );
  if (!placementResult.ok) {
    throw createValidationError(
      placementResult.errorCode ?? "placement_failed",
      placementResult.message ?? "Streaming candidate placement failed."
    );
  }

  const distanceToPlayerMetres = calculateDistanceMetres(
    streamingRequest.playerLocation.coordinates,
    candidate.metadata.coordinates
  );
  const selectedLodProfile = selectLodProfile(
    distanceToPlayerMetres,
    streamingRequest.lodRules
  );
  const streamingState = selectStreamingState(
    distanceToPlayerMetres,
    streamingRequest
  );
  const loadingPriority = calculateLoadingPriority(
    candidate.priorityCategory,
    distanceToPlayerMetres,
    streamingRequest.priorityRules
  );

  let rendererHandoff = null;
  if (streamingState !== "unloaded") {
    const manifest = context.manifestRegistry.findManifestByAssetId(candidate.assetId);
    rendererHandoff = adaptFactoryAssetForRenderer(
      {
        assetId: candidate.assetId,
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
        rendererHandoff.message ?? "Passive renderer handoff failed."
      );
    }
  }

  return deepFreeze({
    instanceId: candidate.instanceId,
    assetId: candidate.assetId,
    distanceToPlayerMetres,
    selectedLodProfile,
    streamingState,
    loadingPriority,
    placementResult,
    rendererHandoff
  });
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
      return Object.freeze({
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

function buildPassiveHandoffDefinition(streamingRequest, instanceCandidates) {
  return computePassiveHandoff(streamingRequest, instanceCandidates);
}

function createPriorityRule(category, basePriority) {
  return deepFreeze({
    category,
    basePriority
  });
}

function createStreamingCandidateRecord({
  assetId,
  assetFamilyId,
  locationId,
  worldSeed,
  placementRuleId,
  priorityCategory,
  state,
  coordinates,
  terrainType,
  locationType,
  resolverAvailableAssetReferences = []
}) {
  return deepFreeze({
    instanceId: createDeterministicWorldInstanceId({
      locationId,
      assetId,
      worldSeed
    }).instanceId,
    assetId,
    assetFamilyId,
    locationId,
    worldSeed,
    placementRuleId,
    priorityCategory,
    state,
    metadata: deepFreeze({
      coordinates: deepFreeze({
        x: coordinates.x,
        y: coordinates.y
      }),
      terrainType,
      locationType,
      resolverAvailableAssetReferences: deepFreeze(resolverAvailableAssetReferences),
      runtimeSpawnAuthorized: false
    })
  });
}

function validateDeterministicCandidateIdentity(candidate) {
  const expectedIdentity = createDeterministicWorldInstanceId({
    locationId: candidate.locationId,
    assetId: candidate.assetId,
    worldSeed: candidate.worldSeed
  });
  if (candidate.instanceId !== expectedIdentity.instanceId) {
    throw createValidationError(
      "candidate_identity_mismatch",
      `Candidate ${candidate.instanceId} must match the deterministic world instance identity.`
    );
  }
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
      `Priority rule for category ${priorityCategory} is missing.`
    );
  }
  return priorityRule.basePriority - Math.round(distanceToPlayerMetres * 10);
}

function assertRequiredFields(foundation) {
  for (const fieldName of worldStreamingCoordinatorFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `World streaming coordinator foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePriorityCategory(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!worldStreamingPriorityCategories.includes(normalized)) {
    throw createValidationError(
      "invalid_priority_category",
      `Priority category ${normalized} is not approved.`
    );
  }
  return normalized;
}

function normalizeStreamingState(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!worldStreamingStates.includes(normalized)) {
    throw createValidationError(
      "invalid_streaming_state",
      `Streaming state ${normalized} is not approved.`
    );
  }
  return normalized;
}

function normalizeSelectedLodProfile(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!supportedLodProfiles.includes(normalized)) {
    throw createValidationError(
      "invalid_lod_profile",
      `LOD profile ${normalized} is not approved for passive world streaming.`
    );
  }
  return normalized;
}

function normalizeOptionalPermanentIdArray(value, fieldName) {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent IDs.`
    );
  }
  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
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

function normalizeCoordinates(value, fieldName) {
  const coordinates = asPlainObject(value, fieldName);
  return deepFreeze({
    x: normalizeFiniteNumber(coordinates.x, `${fieldName}.x`),
    y: normalizeFiniteNumber(coordinates.y, `${fieldName}.y`)
  });
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

function normalizeInteger(value, fieldName) {
  if (!Number.isInteger(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an integer.`
    );
  }
  return value;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }
  return value;
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

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldStreamingCoordinatorFoundationValidationError";
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
