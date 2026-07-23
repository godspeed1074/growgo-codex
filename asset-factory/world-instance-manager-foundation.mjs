import { adaptFactoryAssetForRenderer } from "./factory-to-renderer-adapter.mjs";
import {
  blenderApiBridgeFoundationDefinition,
  validateBlenderApiBridgeFoundation
} from "./blender-api-bridge-foundation.mjs";
import {
  firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
  validateFirstBlenderGeneratedAssetPrototypeWorkflow
} from "./first-blender-generated-asset-prototype-workflow.mjs";
import { buildStarterAssetFactoryLayers } from "./starter-asset-manifest-pack.mjs";
import { calculateDeterministicPlacement } from "./world-placement-rules.mjs";

export const worldInstanceManagerFoundationRequiredFields = Object.freeze([
  "instanceRecord",
  "distanceHandlingMetadata",
  "cacheMetadata",
  "passiveRendererHandoff"
]);

export const worldInstanceStates = Object.freeze([
  "planned",
  "loading",
  "active",
  "cached",
  "unloaded",
  "disabled"
]);

export const worldInstanceManagerFoundationDefinition = deepFreeze({
  instanceRecord: {
    instanceId: "WORLD_INSTANCE_438307999",
    assetId: "BUILDING_BAKERY_SMALL_001",
    assetFamilyId: "BUILDING_BAKERY_SMALL_FAMILY_001",
    locationId: "PLOT_ALPHA_001",
    worldSeed: "world-instance-seed-001",
    placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
    state: "planned",
    metadata: {
      coordinates: {
        x: 8.25,
        y: 5.5
      },
      terrainType: "grass",
      locationType: "building_plot",
      deterministicIdentityRequired: true,
      runtimeSpawnAuthorized: false,
      rendererAdapterProfile: "custom-2.5d-passive",
      instanceProfile: "passive-world-instance-manager-foundation"
    }
  },
  distanceHandlingMetadata: {
    closeLodProfile: "close",
    mediumLodProfile: "gameplay",
    farLodProfile: "map",
    unloadRules: {
      unloadLodProfile: "distantSilhouette",
      unloadDistanceMetres: 180,
      keepCachedBeforeUnload: true
    }
  },
  cacheMetadata: {
    cacheEligible: true,
    reuseRule: "same-asset-same-location-same-seed",
    memoryPriority: "medium"
  },
  passiveRendererHandoff: {
    instanceReference: {
      instanceId: "WORLD_INSTANCE_438307999",
      state: "planned"
    },
    assetReference: {
      assetId: "BUILDING_BAKERY_SMALL_001",
      assetFamilyId: "BUILDING_BAKERY_SMALL_FAMILY_001"
    },
    placementData: {
      locationId: "PLOT_ALPHA_001",
      placementRuleId: "PLACEMENT_BUILDING_PLOT_001",
      orientation: "north"
    },
    lodProfile: "close"
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLodProfiles = Object.freeze([
  "close",
  "gameplay",
  "map",
  "distantSilhouette"
]);
const supportedMemoryPriorities = Object.freeze(["low", "medium", "high"]);

export function buildWorldInstanceManagerFoundationContext() {
  return Object.freeze(buildStarterAssetFactoryLayers());
}

export function createDeterministicWorldInstanceId(input) {
  const normalizedInput = normalizeInstanceIdentityInput(input);
  const hashInput = [
    normalizedInput.locationId,
    normalizedInput.assetId,
    normalizedInput.worldSeed
  ].join("::");
  const deterministicHash = stableHash(hashInput);

  return Object.freeze({
    hashInput,
    deterministicHash,
    instanceId: `WORLD_INSTANCE_${String(deterministicHash).padStart(9, "0")}`
  });
}

export function validateWorldInstanceManagerFoundation(
  rawFoundation = worldInstanceManagerFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeFoundationOptions(options);
    const foundation = normalizeWorldInstanceManagerFoundation(rawFoundation);

    const prototypeWorkflowResult =
      normalizedOptions.validateFirstBlenderGeneratedAssetPrototypeWorkflow(
        normalizedOptions.prototypeWorkflowDefinition
      );
    if (!prototypeWorkflowResult.ok) {
      return freezeFailure(prototypeWorkflowResult);
    }

    const bridgeResult = normalizedOptions.validateBlenderApiBridgeFoundation(
      normalizedOptions.blenderBridgeDefinition
    );
    if (!bridgeResult.ok) {
      return freezeFailure(bridgeResult);
    }

    const context = normalizedOptions.context;
    const placementResult = calculateDeterministicPlacement(
      buildPlacementInput(foundation.instanceRecord),
      context
    );
    if (!placementResult.ok) {
      return freezeFailure(placementResult);
    }

    const manifest = context.manifestRegistry.findManifestByAssetId(
      foundation.instanceRecord.assetId
    );
    const rendererHandoffResult = adaptFactoryAssetForRenderer(
      buildRendererAdapterInput(
        foundation.instanceRecord,
        manifest,
        placementResult,
        foundation.distanceHandlingMetadata,
        foundation.cacheMetadata
      ),
      context
    );
    if (!rendererHandoffResult.ok) {
      return freezeFailure(rendererHandoffResult);
    }

    validateDeterministicInstanceIdentity(foundation.instanceRecord);
    validateDistanceHandlingMetadata(
      foundation.distanceHandlingMetadata,
      prototypeWorkflowResult.prototypeWorkflow.workflow,
      bridgeResult.bridge.request
    );
    validateCacheMetadata(foundation.cacheMetadata);
    validatePassiveRendererHandoff(
      foundation.passiveRendererHandoff,
      foundation.instanceRecord,
      rendererHandoffResult
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldInstanceManager: Object.freeze({
        foundation,
        placementResult,
        rendererHandoffResult,
        prototypeWorkflow: prototypeWorkflowResult.prototypeWorkflow,
        blenderBridge: bridgeResult.bridge,
        compatibility: Object.freeze({
          deterministicIdentityVerified: true,
          distanceHandlingVerified: true,
          cacheMetadataVerified: true,
          passiveRendererHandoffVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "WorldInstanceManagerFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldInstanceManager: null
    });
  }
}

function normalizeFoundationOptions(options) {
  return Object.freeze({
    context: options.context ?? buildWorldInstanceManagerFoundationContext(),
    prototypeWorkflowDefinition:
      options.prototypeWorkflowDefinition ??
      firstBlenderGeneratedAssetPrototypeWorkflowDefinition,
    blenderBridgeDefinition:
      options.blenderBridgeDefinition ?? blenderApiBridgeFoundationDefinition,
    validateFirstBlenderGeneratedAssetPrototypeWorkflow:
      typeof options.validateFirstBlenderGeneratedAssetPrototypeWorkflow === "function"
        ? options.validateFirstBlenderGeneratedAssetPrototypeWorkflow
        : validateFirstBlenderGeneratedAssetPrototypeWorkflow,
    validateBlenderApiBridgeFoundation:
      typeof options.validateBlenderApiBridgeFoundation === "function"
        ? options.validateBlenderApiBridgeFoundation
        : validateBlenderApiBridgeFoundation
  });
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    worldInstanceManager: null
  });
}

function normalizeWorldInstanceManagerFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "world instance manager foundation"
  );
  assertRequiredFields(foundation);

  return deepFreeze({
    instanceRecord: normalizeInstanceRecord(foundation.instanceRecord),
    distanceHandlingMetadata: normalizeDistanceHandlingMetadata(
      foundation.distanceHandlingMetadata
    ),
    cacheMetadata: normalizeCacheMetadata(foundation.cacheMetadata),
    passiveRendererHandoff: normalizePassiveRendererHandoff(
      foundation.passiveRendererHandoff
    )
  });
}

function normalizeInstanceRecord(value) {
  const instanceRecord = asPlainObject(value, "instanceRecord");
  const metadata = asPlainObject(instanceRecord.metadata, "instanceRecord.metadata");

  return deepFreeze({
    instanceId: normalizePermanentId(instanceRecord.instanceId, "instanceRecord.instanceId"),
    assetId: normalizePermanentId(instanceRecord.assetId, "instanceRecord.assetId"),
    assetFamilyId: normalizePermanentId(
      instanceRecord.assetFamilyId,
      "instanceRecord.assetFamilyId"
    ),
    locationId: normalizePermanentId(instanceRecord.locationId, "instanceRecord.locationId"),
    worldSeed: normalizeStringValue(instanceRecord.worldSeed, "instanceRecord.worldSeed"),
    placementRuleId: normalizePermanentId(
      instanceRecord.placementRuleId,
      "instanceRecord.placementRuleId"
    ),
    state: normalizeInstanceState(instanceRecord.state, "instanceRecord.state"),
    metadata: deepFreeze({
      coordinates: normalizeCoordinates(metadata.coordinates, "instanceRecord.metadata.coordinates"),
      terrainType: normalizeStringValue(metadata.terrainType, "instanceRecord.metadata.terrainType"),
      locationType: normalizeStringValue(
        metadata.locationType,
        "instanceRecord.metadata.locationType"
      ),
      deterministicIdentityRequired: normalizeBoolean(
        metadata.deterministicIdentityRequired,
        "instanceRecord.metadata.deterministicIdentityRequired"
      ),
      runtimeSpawnAuthorized: normalizeBoolean(
        metadata.runtimeSpawnAuthorized,
        "instanceRecord.metadata.runtimeSpawnAuthorized"
      ),
      rendererAdapterProfile: normalizeStringValue(
        metadata.rendererAdapterProfile,
        "instanceRecord.metadata.rendererAdapterProfile"
      ),
      instanceProfile: normalizeStringValue(
        metadata.instanceProfile,
        "instanceRecord.metadata.instanceProfile"
      )
    })
  });
}

function normalizeDistanceHandlingMetadata(value) {
  const metadata = asPlainObject(value, "distanceHandlingMetadata");
  const unloadRules = asPlainObject(
    metadata.unloadRules,
    "distanceHandlingMetadata.unloadRules"
  );

  return deepFreeze({
    closeLodProfile: normalizeLodProfile(
      metadata.closeLodProfile,
      "distanceHandlingMetadata.closeLodProfile"
    ),
    mediumLodProfile: normalizeLodProfile(
      metadata.mediumLodProfile,
      "distanceHandlingMetadata.mediumLodProfile"
    ),
    farLodProfile: normalizeLodProfile(
      metadata.farLodProfile,
      "distanceHandlingMetadata.farLodProfile"
    ),
    unloadRules: deepFreeze({
      unloadLodProfile: normalizeLodProfile(
        unloadRules.unloadLodProfile,
        "distanceHandlingMetadata.unloadRules.unloadLodProfile"
      ),
      unloadDistanceMetres: normalizePositiveNumber(
        unloadRules.unloadDistanceMetres,
        "distanceHandlingMetadata.unloadRules.unloadDistanceMetres"
      ),
      keepCachedBeforeUnload: normalizeBoolean(
        unloadRules.keepCachedBeforeUnload,
        "distanceHandlingMetadata.unloadRules.keepCachedBeforeUnload"
      )
    })
  });
}

function normalizeCacheMetadata(value) {
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

  return deepFreeze({
    cacheEligible: normalizeBoolean(metadata.cacheEligible, "cacheMetadata.cacheEligible"),
    reuseRule: normalizeStringValue(metadata.reuseRule, "cacheMetadata.reuseRule"),
    memoryPriority
  });
}

function normalizePassiveRendererHandoff(value) {
  const handoff = asPlainObject(value, "passiveRendererHandoff");
  const instanceReference = asPlainObject(
    handoff.instanceReference,
    "passiveRendererHandoff.instanceReference"
  );
  const assetReference = asPlainObject(
    handoff.assetReference,
    "passiveRendererHandoff.assetReference"
  );
  const placementData = asPlainObject(
    handoff.placementData,
    "passiveRendererHandoff.placementData"
  );

  return deepFreeze({
    instanceReference: deepFreeze({
      instanceId: normalizePermanentId(
        instanceReference.instanceId,
        "passiveRendererHandoff.instanceReference.instanceId"
      ),
      state: normalizeInstanceState(
        instanceReference.state,
        "passiveRendererHandoff.instanceReference.state"
      )
    }),
    assetReference: deepFreeze({
      assetId: normalizePermanentId(
        assetReference.assetId,
        "passiveRendererHandoff.assetReference.assetId"
      ),
      assetFamilyId: normalizePermanentId(
        assetReference.assetFamilyId,
        "passiveRendererHandoff.assetReference.assetFamilyId"
      )
    }),
    placementData: deepFreeze({
      locationId: normalizePermanentId(
        placementData.locationId,
        "passiveRendererHandoff.placementData.locationId"
      ),
      placementRuleId: normalizePermanentId(
        placementData.placementRuleId,
        "passiveRendererHandoff.placementData.placementRuleId"
      ),
      orientation: normalizeStringValue(
        placementData.orientation,
        "passiveRendererHandoff.placementData.orientation"
      )
    }),
    lodProfile: normalizeLodProfile(handoff.lodProfile, "passiveRendererHandoff.lodProfile")
  });
}

function buildPlacementInput(instanceRecord) {
  return {
    placementRuleId: instanceRecord.placementRuleId,
    assetId: instanceRecord.assetId,
    locationId: instanceRecord.locationId,
    coordinates: {
      x: instanceRecord.metadata.coordinates.x,
      y: instanceRecord.metadata.coordinates.y
    },
    seed: instanceRecord.worldSeed,
    terrainType: instanceRecord.metadata.terrainType,
    locationType: instanceRecord.metadata.locationType
  };
}

function buildRendererAdapterInput(
  instanceRecord,
  manifest,
  placementResult,
  distanceHandlingMetadata,
  cacheMetadata
) {
  return {
    assetId: instanceRecord.assetId,
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
      rendererAdapterProfile: instanceRecord.metadata.rendererAdapterProfile,
      placementMetadata: {
        deterministic: true,
        cacheEligible: cacheMetadata.cacheEligible,
        closeLodProfile: distanceHandlingMetadata.closeLodProfile
      }
    }
  };
}

function validateDeterministicInstanceIdentity(instanceRecord) {
  const identity = createDeterministicWorldInstanceId({
    locationId: instanceRecord.locationId,
    assetId: instanceRecord.assetId,
    worldSeed: instanceRecord.worldSeed
  });

  if (instanceRecord.instanceId !== identity.instanceId) {
    throw createValidationError(
      "instance_identity_mismatch",
      "World instance instanceId must match the deterministic identity derived from locationId, assetId, and worldSeed."
    );
  }

  if (!instanceRecord.metadata.deterministicIdentityRequired) {
    throw createValidationError(
      "deterministic_identity_not_required",
      "World instance metadata must require deterministic identity."
    );
  }
}

function validateDistanceHandlingMetadata(
  distanceHandlingMetadata,
  prototypeWorkflow,
  blenderBridgeRequest
) {
  const prototypeLodKeys = Object.keys(
    prototypeWorkflow.blenderPrototypeGenerationRequest.lodRequirements
  );
  const bridgeLodKeys = Object.keys(blenderBridgeRequest.lodRequirements);
  if (JSON.stringify(prototypeLodKeys) !== JSON.stringify(bridgeLodKeys)) {
    throw createValidationError(
      "lod_contract_mismatch",
      "Prototype workflow and Blender bridge must agree on the passive LOD contract."
    );
  }

  const expectedProfiles = ["close", "gameplay", "map", "distantSilhouette"];
  const actualProfiles = [
    distanceHandlingMetadata.closeLodProfile,
    distanceHandlingMetadata.mediumLodProfile,
    distanceHandlingMetadata.farLodProfile,
    distanceHandlingMetadata.unloadRules.unloadLodProfile
  ];

  if (JSON.stringify(actualProfiles) !== JSON.stringify(expectedProfiles)) {
    throw createValidationError(
      "distance_lod_profile_mismatch",
      "Distance handling metadata must follow the approved close/gameplay/map/distantSilhouette LOD progression."
    );
  }
}

function validateCacheMetadata(cacheMetadata) {
  if (!cacheMetadata.cacheEligible) {
    throw createValidationError(
      "cache_ineligible",
      "World instance foundation cache metadata must remain eligible for passive reuse."
    );
  }

  if (
    cacheMetadata.reuseRule !== "same-asset-same-location-same-seed"
  ) {
    throw createValidationError(
      "cache_reuse_rule_mismatch",
      "World instance cache reuse rule must remain deterministic and location-bound."
    );
  }
}

function validatePassiveRendererHandoff(
  passiveRendererHandoff,
  instanceRecord,
  rendererHandoffResult
) {
  if (
    passiveRendererHandoff.instanceReference.instanceId !== instanceRecord.instanceId
  ) {
    throw createValidationError(
      "handoff_instance_reference_mismatch",
      "Passive renderer handoff must reference the exact world instance identity."
    );
  }

  if (passiveRendererHandoff.instanceReference.state !== instanceRecord.state) {
    throw createValidationError(
      "handoff_state_mismatch",
      "Passive renderer handoff instance state must match the instance record state."
    );
  }

  if (passiveRendererHandoff.assetReference.assetId !== instanceRecord.assetId) {
    throw createValidationError(
      "handoff_asset_reference_mismatch",
      "Passive renderer handoff must reference the exact world instance assetId."
    );
  }

  if (
    passiveRendererHandoff.placementData.locationId !==
      rendererHandoffResult.transformData.locationId ||
    passiveRendererHandoff.placementData.placementRuleId !==
      rendererHandoffResult.transformData.placementRuleId ||
    passiveRendererHandoff.placementData.orientation !==
      rendererHandoffResult.transformData.orientation
  ) {
    throw createValidationError(
      "handoff_placement_mismatch",
      "Passive renderer handoff placement data must match the passive renderer adapter transform data."
    );
  }

  if (passiveRendererHandoff.lodProfile !== "close") {
    throw createValidationError(
      "handoff_lod_profile_invalid",
      "Passive renderer handoff must begin at the close LOD profile."
    );
  }
}

function assertRequiredFields(foundation) {
  for (const fieldName of worldInstanceManagerFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `World instance manager foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeInstanceIdentityInput(value) {
  const input = asPlainObject(value, "world instance identity input");

  return deepFreeze({
    locationId: normalizePermanentId(input.locationId, "locationId"),
    assetId: normalizePermanentId(input.assetId, "assetId"),
    worldSeed: normalizeStringValue(input.worldSeed, "worldSeed")
  });
}

function normalizeInstanceState(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!worldInstanceStates.includes(normalized)) {
    throw createValidationError(
      "invalid_instance_state",
      `Instance state ${normalized} is not part of the approved world instance lifecycle.`
    );
  }
  return normalized;
}

function normalizeLodProfile(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!supportedLodProfiles.includes(normalized)) {
    throw createValidationError(
      "invalid_lod_profile",
      `LOD profile ${normalized} is not approved for passive world instance handling.`
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

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
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

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldInstanceManagerFoundationValidationError";
  error.code = code;
  return error;
}

function stableHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000000000;
  }
  return hash;
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
