import {
  buildFirstVisibleLighthouseCustom25DSyntheticSceneContext,
  firstVisibleLighthouseCustom25DSyntheticSceneDefinition,
  validateFirstVisibleLighthouseCustom25DSyntheticScene
} from "./first-visible-lighthouse-custom-25d-synthetic-scene.mjs";
import {
  syntheticWorldCustom25DVisualVerificationDefinition,
  validateSyntheticWorldCustom25DVisualVerification
} from "./synthetic-world-custom-25d-visual-verification.mjs";
import {
  syntheticWorldToCustom25DPassiveRendererBridgeDefinition,
  validateSyntheticWorldToCustom25DPassiveRendererBridge
} from "./synthetic-world-to-custom-25d-passive-renderer-bridge.mjs";

export const syntheticWorldActualCustom25DRenderVerificationRequiredFields =
  Object.freeze([
    "worldId",
    "expectedOrderedAssetIds",
    "expectedLodProfiles",
    "supportedAppearanceProfiles"
  ]);

export const syntheticWorldActualCustom25DRenderVerificationDefinition =
  deepFreeze({
    worldId: "SYNTHETIC_COASTAL_WORLD_SCENE_001",
    expectedOrderedAssetIds: deepFreeze([
      "LIGHTHOUSE_ISLAND_ROCKY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "ROAD_STRAIGHT_SMALL_001",
      "TREE_EUCALYPTUS_001"
    ]),
    expectedLodProfiles: deepFreeze({
      LIGHTHOUSE_ISLAND_ROCKY_001: "close",
      BUILDING_HOUSE_SMALL_COASTAL_001: "gameplay",
      ROAD_STRAIGHT_SMALL_001: "close",
      TREE_EUCALYPTUS_001: "gameplay"
    }),
    supportedAppearanceProfiles: deepFreeze([
      "DAY_COASTAL_LIGHTHOUSE",
      "SUNSET_COASTAL_LIGHTHOUSE",
      "NIGHT_COASTAL_LIGHTHOUSE"
    ])
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedRendererProfile = "custom-2.5d-passive";
const requiredAssetIds = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildSyntheticWorldActualCustom25DRenderVerificationContext() {
  return Object.freeze(buildFirstVisibleLighthouseCustom25DSyntheticSceneContext());
}

export function validateSyntheticWorldActualCustom25DRenderVerification(
  rawDefinition = syntheticWorldActualCustom25DRenderVerificationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeDefinition(rawDefinition);

    const lighthouseSceneResult =
      normalizedOptions.validateFirstVisibleLighthouseCustom25DSyntheticScene(
        normalizedOptions.syntheticSceneDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!lighthouseSceneResult.ok) {
      return freezeFailure(lighthouseSceneResult);
    }

    const visualVerificationResult =
      normalizedOptions.validateSyntheticWorldCustom25DVisualVerification(
        normalizedOptions.visualVerificationDefinition,
        { context: normalizedOptions.validationContext }
      );
    if (!visualVerificationResult.ok) {
      return freezeFailure(visualVerificationResult);
    }

    const passiveBridgeResult =
      normalizedOptions.validateSyntheticWorldToCustom25DPassiveRendererBridge(
        normalizedOptions.passiveRendererBridgeDefinition,
        { context: normalizedOptions.validationContext }
      );
    if (!passiveBridgeResult.ok) {
      return freezeFailure(passiveBridgeResult);
    }

    const renderVerification = buildRenderVerificationResult(
      definition,
      lighthouseSceneResult.syntheticSceneVerification,
      visualVerificationResult.visualVerification,
      passiveBridgeResult.custom25DRendererSceneConsumer
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      renderVerification
    });
  } catch (error) {
    if (
      error?.name !== "SyntheticWorldActualCustom25DRenderVerificationValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      renderVerification: null
    });
  }
}

export function createSyntheticWorldActualCustom25DRenderVerificationSession(
  rawDefinition = syntheticWorldActualCustom25DRenderVerificationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_verification_required",
      message:
        "Synthetic world actual Custom 2.5D render verification sessions require manual: true.",
      renderSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_verification_required",
      message:
        "Synthetic world actual Custom 2.5D render verification sessions require isolated: true.",
      renderSession: null
    });
  }

  const validation = validateSyntheticWorldActualCustom25DRenderVerification(
    rawDefinition,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      renderSession: null
    });
  }

  let closed = false;
  const verification = validation.renderVerification;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    renderSession: Object.freeze({
      worldId: verification.worldId,
      rendererPayloads: verification.rendererPayloads,
      renderRequest: verification.renderRequest,
      verificationResult: verification.verificationResult,
      closeRenderSession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            duplicateSessionCreated: false,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "synthetic-render-session-closed",
          releasedStateCount: verification.rendererPayloads.length,
          duplicateSessionCreated: false,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  const validationContext =
    options.validationContext ??
    buildSyntheticWorldActualCustom25DRenderVerificationContext();

  return Object.freeze({
    validationContext,
    syntheticSceneDefinition:
      options.syntheticSceneDefinition ??
      firstVisibleLighthouseCustom25DSyntheticSceneDefinition,
    visualVerificationDefinition:
      options.visualVerificationDefinition ??
      syntheticWorldCustom25DVisualVerificationDefinition,
    passiveRendererBridgeDefinition:
      options.passiveRendererBridgeDefinition ??
      syntheticWorldToCustom25DPassiveRendererBridgeDefinition,
    validateFirstVisibleLighthouseCustom25DSyntheticScene:
      typeof options.validateFirstVisibleLighthouseCustom25DSyntheticScene ===
      "function"
        ? options.validateFirstVisibleLighthouseCustom25DSyntheticScene
        : validateFirstVisibleLighthouseCustom25DSyntheticScene,
    validateSyntheticWorldCustom25DVisualVerification:
      typeof options.validateSyntheticWorldCustom25DVisualVerification ===
      "function"
        ? options.validateSyntheticWorldCustom25DVisualVerification
        : validateSyntheticWorldCustom25DVisualVerification,
    validateSyntheticWorldToCustom25DPassiveRendererBridge:
      typeof options.validateSyntheticWorldToCustom25DPassiveRendererBridge ===
      "function"
        ? options.validateSyntheticWorldToCustom25DPassiveRendererBridge
        : validateSyntheticWorldToCustom25DPassiveRendererBridge
  });
}

function buildRenderVerificationResult(
  definition,
  syntheticSceneVerification,
  visualVerification,
  passiveBridge
) {
  validateWorldId(
    definition.worldId,
    syntheticSceneVerification.worldId,
    visualVerification.worldId,
    passiveBridge.worldId
  );
  validateRequiredAssetOrdering(
    definition.expectedOrderedAssetIds,
    syntheticSceneVerification.assetReferences
  );
  validateRequiredAppearanceProfiles(
    definition.supportedAppearanceProfiles,
    syntheticSceneVerification.appearanceProfiles
  );

  validatePlacementTransforms(
    syntheticSceneVerification.placements,
    visualVerification.rendererPayloads
  );
  validateLodSelection(
    definition.expectedLodProfiles,
    syntheticSceneVerification.lodProfiles
  );
  validateRendererCompatibility(visualVerification.rendererPayloads, passiveBridge);
  validateDeterministicOutput(syntheticSceneVerification, visualVerification, passiveBridge);

  return Object.freeze({
    worldId: definition.worldId,
    rendererPayloads: deepFreeze(visualVerification.rendererPayloads),
    renderRequest: Object.freeze({
      worldId: definition.worldId,
      rendererProfile: supportedRendererProfile,
      mode: "manual-controlled-synthetic-render-verification",
      manualOnly: true,
      isolated: true,
      lifecycleExecutionEnabled: false,
      automaticMapAttachmentEnabled: false
    }),
    verificationResult: Object.freeze({
      drawAccepted: true,
      objectCount: visualVerification.renderAcceptanceState.receivedObjectCount,
      orderedAssetIds: deepFreeze(
        syntheticSceneVerification.assetReferences.map((entry) => entry.assetId)
      ),
      placementTransformsVerified: true,
      lodSelectionVerified: true,
      rendererCompatibilityVerified: true,
      deterministicOutputVerified: true,
      cleanupSafe: syntheticSceneVerification.cleanupContract.cleanupAvailable === true,
      noDuplicateSessions: true
    })
  });
}

function validateWorldId(
  definitionWorldId,
  lighthouseSceneWorldId,
  visualWorldId,
  passiveBridgeWorldId
) {
  if (
    definitionWorldId !== lighthouseSceneWorldId ||
    definitionWorldId !== visualWorldId ||
    definitionWorldId !== passiveBridgeWorldId
  ) {
    throw createValidationError(
      "world_id_mismatch",
      "Synthetic render verification worldId must match the lighthouse scene, visual verification, and passive bridge worldId."
    );
  }
}

function validateRequiredAssetOrdering(expectedOrderedAssetIds, assetReferences) {
  const receivedOrderedAssetIds = assetReferences.map((entry) => entry.assetId);
  if (!sameStringArray(expectedOrderedAssetIds, receivedOrderedAssetIds)) {
    throw createValidationError(
      "asset_ordering_mismatch",
      "Synthetic render verification asset ordering must match the approved lighthouse, house, road, and tree sequence."
    );
  }
}

function validateRequiredAppearanceProfiles(
  supportedAppearanceProfiles,
  sceneAppearanceProfiles
) {
  const receivedAppearanceProfiles = [
    sceneAppearanceProfiles.day,
    sceneAppearanceProfiles.sunset,
    sceneAppearanceProfiles.night
  ];

  if (!sameStringArray(supportedAppearanceProfiles, receivedAppearanceProfiles)) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Synthetic render verification appearance profiles must match the approved day, sunset, and night scene profile set."
    );
  }
}

function validatePlacementTransforms(placements, rendererPayloads) {
  for (const placement of placements) {
    const rendererPayload = findRendererPayload(rendererPayloads, placement.assetId);
    if (
      rendererPayload.transformData.locationId !== placement.locationId ||
      rendererPayload.transformData.placementRuleId !== placement.placementRuleId ||
      rendererPayload.transformData.orientation !== placement.orientation
    ) {
      throw createValidationError(
        "placement_transform_mismatch",
        `Synthetic render verification placement transforms must match for ${placement.assetId}.`
      );
    }
  }
}

function validateLodSelection(expectedLodProfiles, lodProfiles) {
  for (const [assetId, expectedLodProfile] of Object.entries(expectedLodProfiles)) {
    const lodEntry = lodProfiles.find((entry) => entry.assetId === assetId) ?? null;
    if (!lodEntry) {
      throw createValidationError(
        "lod_profile_mismatch",
        `Synthetic render verification is missing an LOD profile for ${assetId}.`
      );
    }
    if (lodEntry.lodProfile !== expectedLodProfile) {
      throw createValidationError(
        "lod_profile_mismatch",
        `Synthetic render verification LOD profile for ${assetId} must match the approved scene LOD selection.`
      );
    }
  }
}

function validateRendererCompatibility(rendererPayloads, passiveBridge) {
  for (const rendererPayload of rendererPayloads) {
    if (rendererPayload.metadata.adapterProfile !== supportedRendererProfile) {
      throw createValidationError(
        "unsupported_renderer_profile",
        `Renderer payload profile ${rendererPayload.metadata.adapterProfile} is not compatible with synthetic render verification.`
      );
    }
  }

  if (passiveBridge.compatibility.rendererProfile !== supportedRendererProfile) {
    throw createValidationError(
      "unsupported_renderer_profile",
      "Passive renderer bridge compatibility must remain on the approved Custom 2.5D passive profile."
    );
  }
}

function validateDeterministicOutput(
  syntheticSceneVerification,
  visualVerification,
  passiveBridge
) {
  if (syntheticSceneVerification.sceneAcceptanceState.objectCountDeterministic !== true) {
    throw createValidationError(
      "deterministic_output_mismatch",
      "Synthetic render verification requires deterministic object-count output."
    );
  }

  if (visualVerification.renderAcceptanceState.objectCountDeterministic !== true) {
    throw createValidationError(
      "deterministic_output_mismatch",
      "Visual verification must preserve deterministic object-count output."
    );
  }

  if (passiveBridge.compatibility.deterministicPayloadReady !== true) {
    throw createValidationError(
      "deterministic_output_mismatch",
      "Passive bridge must preserve deterministic renderer payload readiness."
    );
  }
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "synthetic world actual Custom 2.5D render verification"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    worldId: normalizeStringValue(definition.worldId, "worldId"),
    expectedOrderedAssetIds: deepFreeze(
      normalizePermanentIdArray(
        definition.expectedOrderedAssetIds,
        "expectedOrderedAssetIds"
      )
    ),
    expectedLodProfiles: normalizeExpectedLodProfiles(definition.expectedLodProfiles),
    supportedAppearanceProfiles: deepFreeze(
      normalizeStringArray(
        definition.supportedAppearanceProfiles,
        "supportedAppearanceProfiles"
      )
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of syntheticWorldActualCustom25DRenderVerificationRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Missing required synthetic render verification field: ${fieldName}.`
      );
    }
  }
}

function normalizeExpectedLodProfiles(value) {
  const expectedLodProfiles = asPlainObject(value, "expectedLodProfiles");
  const normalizedProfiles = {};

  for (const assetId of requiredAssetIds) {
    normalizedProfiles[assetId] = normalizeLodProfile(
      expectedLodProfiles[assetId],
      `expectedLodProfiles.${assetId}`
    );
  }

  return deepFreeze(normalizedProfiles);
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

function normalizeLodProfile(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!["close", "gameplay", "map"].includes(normalizedValue)) {
    throw createValidationError(
      "lod_profile_mismatch",
      `${fieldName} must be one of: close, gameplay, map.`
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
    renderVerification: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "SyntheticWorldActualCustom25DRenderVerificationValidationError";
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
