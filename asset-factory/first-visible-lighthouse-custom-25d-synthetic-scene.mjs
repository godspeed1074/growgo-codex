import {
  buildRealLighthousePackageSyntheticWorldPlacementContext,
  realLighthousePackageSyntheticWorldPlacementDefinition,
  validateRealLighthousePackageSyntheticWorldPlacement
} from "./real-lighthouse-package-synthetic-world-placement.mjs";
import {
  syntheticWorldCustom25DVisualVerificationDefinition,
  validateSyntheticWorldCustom25DVisualVerification
} from "./synthetic-world-custom-25d-visual-verification.mjs";
import {
  syntheticWorldToCustom25DPassiveRendererBridgeDefinition,
  validateSyntheticWorldToCustom25DPassiveRendererBridge
} from "./synthetic-world-to-custom-25d-passive-renderer-bridge.mjs";
import { validateWorldPipelineRendererBridge } from "./world-pipeline-renderer-bridge.mjs";

export const firstVisibleLighthouseCustom25DSyntheticSceneRequiredFields =
  Object.freeze([
    "worldId",
    "rendererPayloads",
    "requiredAssetIds",
    "supportedAppearanceProfiles"
  ]);

export const firstVisibleLighthouseCustom25DSyntheticSceneDefinition = deepFreeze({
  worldId: "SYNTHETIC_COASTAL_WORLD_SCENE_001",
  rendererPayloads: deepFreeze([]),
  requiredAssetIds: deepFreeze([
    "LIGHTHOUSE_ISLAND_ROCKY_001",
    "BUILDING_HOUSE_SMALL_COASTAL_001",
    "ROAD_STRAIGHT_SMALL_001",
    "TREE_EUCALYPTUS_001"
  ]),
  supportedAppearanceProfiles: deepFreeze([
    "DAY_COASTAL_LIGHTHOUSE",
    "SUNSET_COASTAL_LIGHTHOUSE",
    "NIGHT_COASTAL_LIGHTHOUSE"
  ])
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedRendererProfile = "custom-2.5d-passive";
const expectedAssetIds = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildFirstVisibleLighthouseCustom25DSyntheticSceneContext() {
  return Object.freeze(buildRealLighthousePackageSyntheticWorldPlacementContext());
}

export function validateFirstVisibleLighthouseCustom25DSyntheticScene(
  rawScene = firstVisibleLighthouseCustom25DSyntheticSceneDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const sceneDefinition = normalizeSceneDefinition(rawScene);

    const lighthousePlacementResult =
      normalizedOptions.validateRealLighthousePackageSyntheticWorldPlacement(
        normalizedOptions.lighthousePlacementDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!lighthousePlacementResult.ok) {
      return freezeFailure(lighthousePlacementResult);
    }

    const passiveBridgeResult =
      normalizedOptions.validateSyntheticWorldToCustom25DPassiveRendererBridge(
        normalizedOptions.passiveRendererBridgeDefinition,
        { context: normalizedOptions.validationContext }
      );
    if (!passiveBridgeResult.ok) {
      return freezeFailure(passiveBridgeResult);
    }

    const visualVerificationResult =
      normalizedOptions.validateSyntheticWorldCustom25DVisualVerification(
        normalizedOptions.visualVerificationDefinition,
        { context: normalizedOptions.validationContext }
      );
    if (!visualVerificationResult.ok) {
      return freezeFailure(visualVerificationResult);
    }

    const worldPipelineResult =
      normalizedOptions.validateWorldPipelineRendererBridge();
    if (!worldPipelineResult.ok) {
      return freezeFailure(worldPipelineResult);
    }

    const syntheticSceneVerification = buildSyntheticSceneVerificationResult(
      sceneDefinition,
      lighthousePlacementResult.lighthouseWorldPlacement,
      passiveBridgeResult.custom25DRendererSceneConsumer,
      visualVerificationResult.visualVerification
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      syntheticSceneVerification
    });
  } catch (error) {
    if (
      error?.name !== "FirstVisibleLighthouseCustom25DSyntheticSceneValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      syntheticSceneVerification: null
    });
  }
}

export function createFirstVisibleLighthouseCustom25DSyntheticSceneSession(
  rawScene = firstVisibleLighthouseCustom25DSyntheticSceneDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_verification_required",
      message:
        "First visible lighthouse Custom 2.5D synthetic scene sessions require manual: true.",
      verificationSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_verification_required",
      message:
        "First visible lighthouse Custom 2.5D synthetic scene sessions require isolated: true.",
      verificationSession: null
    });
  }

  const validation = validateFirstVisibleLighthouseCustom25DSyntheticScene(
    rawScene,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      verificationSession: null
    });
  }

  let cleanedUp = false;
  const verification = validation.syntheticSceneVerification;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    verificationSession: Object.freeze({
      worldId: verification.worldId,
      rendererPayloads: verification.rendererPayloads,
      sceneAcceptanceState: verification.sceneAcceptanceState,
      cleanupVerificationSession() {
        if (cleanedUp) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-clean",
            clearedRendererPayloadCount: 0,
            affectedLiveRuntime: false,
            removedRuntimeObjects: false,
            automaticMapAttachmentEnabled: false
          });
        }

        cleanedUp = true;
        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "synthetic-lighthouse-scene-cleared",
          clearedRendererPayloadCount: verification.rendererPayloads.length,
          affectedLiveRuntime: false,
          removedRuntimeObjects: false,
          automaticMapAttachmentEnabled: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  const validationContext =
    options.validationContext ??
    buildFirstVisibleLighthouseCustom25DSyntheticSceneContext();

  return Object.freeze({
    validationContext,
    lighthousePlacementDefinition:
      options.lighthousePlacementDefinition ??
      realLighthousePackageSyntheticWorldPlacementDefinition,
    visualVerificationDefinition:
      options.visualVerificationDefinition ??
      syntheticWorldCustom25DVisualVerificationDefinition,
    passiveRendererBridgeDefinition:
      options.passiveRendererBridgeDefinition ??
      syntheticWorldToCustom25DPassiveRendererBridgeDefinition,
    validateRealLighthousePackageSyntheticWorldPlacement:
      typeof options.validateRealLighthousePackageSyntheticWorldPlacement ===
      "function"
        ? options.validateRealLighthousePackageSyntheticWorldPlacement
        : validateRealLighthousePackageSyntheticWorldPlacement,
    validateSyntheticWorldCustom25DVisualVerification:
      typeof options.validateSyntheticWorldCustom25DVisualVerification ===
      "function"
        ? options.validateSyntheticWorldCustom25DVisualVerification
        : validateSyntheticWorldCustom25DVisualVerification,
    validateSyntheticWorldToCustom25DPassiveRendererBridge:
      typeof options.validateSyntheticWorldToCustom25DPassiveRendererBridge ===
      "function"
        ? options.validateSyntheticWorldToCustom25DPassiveRendererBridge
        : validateSyntheticWorldToCustom25DPassiveRendererBridge,
    validateWorldPipelineRendererBridge:
      typeof options.validateWorldPipelineRendererBridge === "function"
        ? options.validateWorldPipelineRendererBridge
        : validateWorldPipelineRendererBridge
  });
}

function buildSyntheticSceneVerificationResult(
  sceneDefinition,
  lighthousePlacement,
  passiveBridge,
  visualVerification
) {
  validateWorldId(sceneDefinition.worldId, visualVerification.worldId, passiveBridge.worldId);
  validateRequiredAssets(sceneDefinition.requiredAssetIds);
  validateAppearanceProfiles(
    sceneDefinition.supportedAppearanceProfiles,
    lighthousePlacement.appearanceProfileValidation
  );

  const assetReferences = sceneDefinition.requiredAssetIds.map((assetId) => {
    const rendererPayload = findRendererPayload(visualVerification.rendererPayloads, assetId);
    const lodProfile = findAssetStateEntry(visualVerification.lodProfiles, assetId, "lodProfile");
    const visibilityState = findAssetStateEntry(
      visualVerification.visibilityStates,
      assetId,
      "visibilityState"
    );

    validateRendererCompatibility(assetId, rendererPayload);

    return Object.freeze({
      assetId,
      rendererPayload,
      placement: Object.freeze({
        locationId: rendererPayload.transformData.locationId,
        placementRuleId: rendererPayload.transformData.placementRuleId,
        orientation: rendererPayload.transformData.orientation
      }),
      lodProfile: lodProfile.lodProfile,
      visibilityState: visibilityState.visibilityState
    });
  });

  validateLighthousePackageBackedReference(
    lighthousePlacement.packageBackedWorldInstanceBinding,
    assetReferences
  );
  validateDeterministicOutput(visualVerification, passiveBridge);

  return Object.freeze({
    worldId: visualVerification.worldId,
    rendererPayloads: deepFreeze(visualVerification.rendererPayloads),
    assetReferences: deepFreeze(
      assetReferences.map((entry) =>
        Object.freeze({
          assetId: entry.assetId,
          manifestId: entry.rendererPayload.rendererAssetReference.manifestId,
          recipeId: entry.rendererPayload.rendererAssetReference.recipeId
        })
      )
    ),
    placements: deepFreeze(
      assetReferences.map((entry) =>
        Object.freeze({
          assetId: entry.assetId,
          locationId: entry.placement.locationId,
          placementRuleId: entry.placement.placementRuleId,
          orientation: entry.placement.orientation
        })
      )
    ),
    lodProfiles: deepFreeze(
      assetReferences.map((entry) =>
        Object.freeze({
          assetId: entry.assetId,
          lodProfile: entry.lodProfile
        })
      )
    ),
    appearanceProfiles: Object.freeze({
      day: lighthousePlacement.appearanceProfileValidation.day,
      sunset: lighthousePlacement.appearanceProfileValidation.sunset,
      night: lighthousePlacement.appearanceProfileValidation.night,
      defaultAppearanceProfile:
        lighthousePlacement.appearanceProfileValidation.defaultAppearanceProfile
    }),
    sceneAcceptanceState: Object.freeze({
      accepted: true,
      rendererCompatibilityVerified: true,
      expectedObjectCount: sceneDefinition.requiredAssetIds.length,
      receivedObjectCount: visualVerification.renderAcceptanceState.receivedObjectCount,
      objectCountDeterministic:
        visualVerification.renderAcceptanceState.objectCountDeterministic === true,
      deterministicOutputVerified: true,
      cleanupSafe: visualVerification.cleanupContract.cleanupAvailable === true,
      packageBackedLighthouseVerified: true,
      manualOnly: true,
      isolated: true,
      automaticMapAttachmentEnabled: false,
      lifecycleExecutionActivated: false,
      runtimeRenderObjectsCreated: false
    }),
    cleanupContract: Object.freeze({
      cleanupAvailable: true,
      cleanupStrategy: "in-memory-synthetic-scene-session-only",
      affectsLiveRuntime: false,
      removesRuntimeObjects: false,
      automaticMapAttachmentEnabled: false
    })
  });
}

function validateWorldId(sceneWorldId, visualWorldId, passiveBridgeWorldId) {
  if (sceneWorldId !== visualWorldId || sceneWorldId !== passiveBridgeWorldId) {
    throw createValidationError(
      "world_id_mismatch",
      "First visible lighthouse synthetic scene worldId must match the passive bridge and visual verification worldId."
    );
  }
}

function validateRequiredAssets(requiredAssetIds) {
  if (!sameStringArray(requiredAssetIds, expectedAssetIds)) {
    throw createValidationError(
      "scene_asset_set_mismatch",
      "First visible lighthouse synthetic scene must verify the approved lighthouse, house, road, and tree asset set."
    );
  }
}

function validateAppearanceProfiles(
  supportedAppearanceProfiles,
  appearanceProfileValidation
) {
  if (!sameStringArray(supportedAppearanceProfiles, [
    appearanceProfileValidation.day,
    appearanceProfileValidation.sunset,
    appearanceProfileValidation.night
  ])) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "First visible lighthouse synthetic scene appearance profiles must match the approved lighthouse day, sunset, and night states."
    );
  }
}

function validateRendererCompatibility(assetId, rendererPayload) {
  if (rendererPayload.metadata.adapterProfile !== supportedRendererProfile) {
    throw createValidationError(
      "unsupported_renderer_profile",
      `Renderer payload profile ${rendererPayload.metadata.adapterProfile} is not compatible with the lighthouse synthetic scene for ${assetId}.`
    );
  }
}

function validateLighthousePackageBackedReference(
  lighthouseBinding,
  assetReferences
) {
  const lighthouseReference =
    assetReferences.find((entry) => entry.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001") ??
    null;

  if (!lighthouseReference) {
    throw createValidationError(
      "missing_lighthouse_reference",
      "First visible lighthouse synthetic scene requires a lighthouse renderer reference."
    );
  }

  if (lighthouseBinding.assetId !== lighthouseReference.assetId) {
    throw createValidationError(
      "asset_reference_mismatch",
      "First visible lighthouse synthetic scene lighthouse binding assetId must match the renderer lighthouse reference."
    );
  }
}

function validateDeterministicOutput(visualVerification, passiveBridge) {
  if (visualVerification.renderAcceptanceState.objectCountDeterministic !== true) {
    throw createValidationError(
      "deterministic_output_mismatch",
      "First visible lighthouse synthetic scene requires deterministic object-count output."
    );
  }

  if (passiveBridge.compatibility.deterministicPayloadReady !== true) {
    throw createValidationError(
      "deterministic_output_mismatch",
      "First visible lighthouse synthetic scene requires deterministic passive renderer payload readiness."
    );
  }
}

function normalizeSceneDefinition(rawScene) {
  const sceneDefinition = asPlainObject(
    rawScene,
    "first visible lighthouse Custom 2.5D synthetic scene"
  );
  assertRequiredFields(sceneDefinition);

  return deepFreeze({
    worldId: normalizeStringValue(sceneDefinition.worldId, "worldId"),
    rendererPayloads: deepFreeze(
      normalizeRendererPayloadPlaceholders(
        sceneDefinition.rendererPayloads,
        "rendererPayloads"
      )
    ),
    requiredAssetIds: deepFreeze(
      normalizePermanentIdArray(sceneDefinition.requiredAssetIds, "requiredAssetIds")
    ),
    supportedAppearanceProfiles: deepFreeze(
      normalizeStringArray(
        sceneDefinition.supportedAppearanceProfiles,
        "supportedAppearanceProfiles"
      )
    )
  });
}

function assertRequiredFields(sceneDefinition) {
  for (const fieldName of firstVisibleLighthouseCustom25DSyntheticSceneRequiredFields) {
    if (!(fieldName in sceneDefinition)) {
      throw createValidationError(
        "missing_required_field",
        `Missing required lighthouse synthetic scene field: ${fieldName}.`
      );
    }
  }
}

function normalizeRendererPayloadPlaceholders(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_renderer_payloads",
      `${fieldName} must be an array.`
    );
  }

  return value.map((entry, index) => {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      return deepFreeze({ ...entry });
    }
    if (entry == null) {
      return null;
    }
    throw createValidationError(
      "invalid_renderer_payloads",
      `${fieldName}[${index}] must be null or an object placeholder.`
    );
  });
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_array",
      `${fieldName} must be a non-empty array.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_array",
      `${fieldName} must be a non-empty array.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentId(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!permanentIdPattern.test(normalizedValue)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent uppercase asset identifier.`
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

function findRendererPayload(rendererPayloads, assetId) {
  const rendererPayload =
    rendererPayloads.find((entry) => entry.rendererAssetReference.assetId === assetId) ??
    null;

  if (!rendererPayload) {
    throw createValidationError(
      "asset_reference_mismatch",
      `No renderer payload was found for ${assetId}.`
    );
  }

  return rendererPayload;
}

function findAssetStateEntry(entries, assetId, fieldName) {
  const entry = entries.find((candidate) => candidate.assetId === assetId) ?? null;

  if (!entry) {
    throw createValidationError(
      "asset_reference_mismatch",
      `No ${fieldName} entry was found for ${assetId}.`
    );
  }

  return entry;
}

function sameStringArray(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
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

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    syntheticSceneVerification: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "FirstVisibleLighthouseCustom25DSyntheticSceneValidationError";
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
