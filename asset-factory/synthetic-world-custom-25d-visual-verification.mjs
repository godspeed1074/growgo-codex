import {
  buildSyntheticWorldToCustom25DPassiveRendererBridgeContext,
  syntheticWorldToCustom25DPassiveRendererBridgeDefinition,
  validateSyntheticWorldToCustom25DPassiveRendererBridge
} from "./synthetic-world-to-custom-25d-passive-renderer-bridge.mjs";

export const syntheticWorldCustom25DVisualVerificationRequiredFields = Object.freeze([
  "worldId",
  "rendererPayloads",
  "lodProfiles",
  "visibilityStates"
]);

export const syntheticWorldCustom25DVisualVerificationDefinition = Object.freeze({
  ...syntheticWorldToCustom25DPassiveRendererBridgeDefinition
});

const supportedRendererProfile = "custom-2.5d-passive";
const requiredSceneAssetIds = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildSyntheticWorldCustom25DVisualVerificationContext() {
  return Object.freeze(buildSyntheticWorldToCustom25DPassiveRendererBridgeContext());
}

export function validateSyntheticWorldCustom25DVisualVerification(
  rawWorld = syntheticWorldCustom25DVisualVerificationDefinition,
  options = {}
) {
  const bridgeResult = validateSyntheticWorldToCustom25DPassiveRendererBridge(
    rawWorld,
    options
  );

  if (!bridgeResult.ok) {
    return Object.freeze({
      ok: false,
      errorCode: bridgeResult.errorCode,
      message: bridgeResult.message,
      visualVerification: null
    });
  }

  try {
    const visualVerification = normalizeVisualVerification(
      bridgeResult.custom25DRendererSceneConsumer
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      visualVerification
    });
  } catch (error) {
    if (error?.name !== "SyntheticWorldCustom25DVisualVerificationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      visualVerification: null
    });
  }
}

export function createSyntheticWorldCustom25DVisualVerificationSession(
  rawWorld = syntheticWorldCustom25DVisualVerificationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_verification_required",
      message:
        "Synthetic world Custom 2.5D visual verification sessions require manual: true.",
      verificationSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_verification_required",
      message:
        "Synthetic world Custom 2.5D visual verification sessions require isolated: true.",
      verificationSession: null
    });
  }

  const validation = validateSyntheticWorldCustom25DVisualVerification(rawWorld, options);
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      verificationSession: null
    });
  }

  let cleanedUp = false;
  const verification = validation.visualVerification;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    verificationSession: Object.freeze({
      worldId: verification.worldId,
      rendererPayloads: verification.rendererPayloads,
      renderAcceptanceState: verification.renderAcceptanceState,
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
          cleanupStatus: "synthetic-verification-session-cleared",
          clearedRendererPayloadCount: verification.rendererPayloads.length,
          affectedLiveRuntime: false,
          removedRuntimeObjects: false,
          automaticMapAttachmentEnabled: false
        });
      }
    })
  });
}

function normalizeVisualVerification(rawVerification) {
  const verification = asPlainObject(
    rawVerification,
    "synthetic world Custom 2.5D visual verification"
  );
  assertRequiredFields(verification);

  const rendererPayloads = normalizeRendererPayloads(verification.rendererPayloads);
  const lodProfiles = normalizeAssetStateEntries(verification.lodProfiles, "lodProfile");
  const visibilityStates = normalizeAssetStateEntries(
    verification.visibilityStates,
    "visibilityState"
  );

  validateRequiredAssets(rendererPayloads);
  validateAssetStates(rendererPayloads, lodProfiles, visibilityStates);

  return Object.freeze({
    worldId: normalizeStringValue(verification.worldId, "worldId"),
    rendererPayloads,
    renderAcceptanceState: Object.freeze({
      accepted: true,
      rendererProfile: supportedRendererProfile,
      expectedAssetIds: deepFreeze([...requiredSceneAssetIds]),
      receivedAssetIds: deepFreeze(
        rendererPayloads.map((entry) => entry.rendererAssetReference.assetId)
      ),
      expectedObjectCount: requiredSceneAssetIds.length,
      receivedObjectCount: rendererPayloads.length,
      objectCountDeterministic: rendererPayloads.length === requiredSceneAssetIds.length,
      renderLifecycleControlled: true,
      manualOnly: true,
      isolated: true,
      automaticMapAttachmentEnabled: false,
      lifecycleExecutionActivated: false,
      runtimeRenderObjectsCreated: false,
      liveWorldRuntimeEnabled: false,
      cleanupSafe: true
    }),
    lodProfiles,
    visibilityStates,
    cleanupContract: Object.freeze({
      cleanupAvailable: true,
      cleanupStrategy: "in-memory-verification-session-only",
      affectsLiveRuntime: false,
      removesRuntimeObjects: false,
      automaticMapAttachmentEnabled: false
    })
  });
}

function normalizeRendererPayloads(value) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_renderer_payloads",
      "rendererPayloads must be an array."
    );
  }

  return deepFreeze(
    value.map((entry, index) => {
      const payload = asPlainObject(entry, `rendererPayloads[${index}]`);
      const rendererAssetReference = asPlainObject(
        payload.rendererAssetReference,
        `rendererPayloads[${index}].rendererAssetReference`
      );
      const transformData = asPlainObject(
        payload.transformData,
        `rendererPayloads[${index}].transformData`
      );
      const metadata = asPlainObject(payload.metadata, `rendererPayloads[${index}].metadata`);

      if (metadata.adapterProfile !== supportedRendererProfile) {
        throw createValidationError(
          "unsupported_renderer_profile",
          `Renderer payload profile ${metadata.adapterProfile} is not compatible with synthetic visual verification.`
        );
      }

      return Object.freeze({
        rendererAssetReference: Object.freeze({
          assetId: normalizeStringValue(
            rendererAssetReference.assetId,
            `rendererPayloads[${index}].rendererAssetReference.assetId`
          ),
          manifestId: normalizeStringValue(
            rendererAssetReference.manifestId,
            `rendererPayloads[${index}].rendererAssetReference.manifestId`
          ),
          recipeId: normalizeStringValue(
            rendererAssetReference.recipeId,
            `rendererPayloads[${index}].rendererAssetReference.recipeId`
          )
        }),
        transformData: Object.freeze({
          position: Object.freeze({
            x: normalizeFiniteNumber(
              transformData.position?.x,
              `rendererPayloads[${index}].transformData.position.x`
            ),
            y: normalizeFiniteNumber(
              transformData.position?.y,
              `rendererPayloads[${index}].transformData.position.y`
            )
          }),
          orientation: normalizeStringValue(
            transformData.orientation,
            `rendererPayloads[${index}].transformData.orientation`
          ),
          placementRuleId: normalizeStringValue(
            transformData.placementRuleId,
            `rendererPayloads[${index}].transformData.placementRuleId`
          ),
          locationId: normalizeStringValue(
            transformData.locationId,
            `rendererPayloads[${index}].transformData.locationId`
          )
        }),
        metadata: Object.freeze({
          adapterProfile: metadata.adapterProfile
        })
      });
    })
  );
}

function normalizeAssetStateEntries(value, stateKey) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_asset_state_entries",
      `${stateKey}s must be an array.`
    );
  }

  return deepFreeze(
    value.map((entry, index) => {
      const stateEntry = asPlainObject(entry, `${stateKey}s[${index}]`);
      return Object.freeze({
        assetId: normalizeStringValue(stateEntry.assetId, `${stateKey}s[${index}].assetId`),
        [stateKey]: normalizeStringValue(
          stateEntry[stateKey],
          `${stateKey}s[${index}].${stateKey}`
        )
      });
    })
  );
}

function validateRequiredAssets(rendererPayloads) {
  const assetIds = rendererPayloads
    .map((entry) => entry.rendererAssetReference.assetId)
    .sort();
  const expectedAssetIds = [...requiredSceneAssetIds].sort();

  if (JSON.stringify(assetIds) !== JSON.stringify(expectedAssetIds)) {
    throw createValidationError(
      "required_assets_mismatch",
      "Synthetic visual verification must contain the approved lighthouse, house, road, and tree renderer payloads."
    );
  }
}

function validateAssetStates(rendererPayloads, lodProfiles, visibilityStates) {
  for (const payload of rendererPayloads) {
    const assetId = payload.rendererAssetReference.assetId;
    const lodProfileEntry = lodProfiles.find((entry) => entry.assetId === assetId) ?? null;
    const visibilityStateEntry =
      visibilityStates.find((entry) => entry.assetId === assetId) ?? null;

    if (!lodProfileEntry) {
      throw createValidationError(
        "missing_lod_profile",
        `Synthetic visual verification is missing the LOD profile for ${assetId}.`
      );
    }

    if (!visibilityStateEntry) {
      throw createValidationError(
        "missing_visibility_state",
        `Synthetic visual verification is missing the visibility state for ${assetId}.`
      );
    }
  }
}

function assertRequiredFields(verification) {
  for (const fieldName of syntheticWorldCustom25DVisualVerificationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(verification, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Synthetic world visual verification is missing required field ${fieldName}.`
      );
    }
  }
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

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "SyntheticWorldCustom25DVisualVerificationError";
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
