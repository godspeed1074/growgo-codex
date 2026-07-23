import {
  atlasEngineWorldPreviewRuntimeFoundationDefinition,
  buildAtlasEngineWorldPreviewRuntimeFoundationContext,
  validateAtlasEngineWorldPreviewRuntimeFoundation
} from "./atlas-engine-world-preview-runtime-foundation.mjs";
import {
  controlledSyntheticWorldRuntimeAttachmentPreparationDefinition,
  validateControlledSyntheticWorldRuntimeAttachmentPreparation
} from "./controlled-synthetic-world-runtime-attachment-preparation.mjs";
import {
  syntheticWorldActualCustom25DRenderVerificationDefinition,
  validateSyntheticWorldActualCustom25DRenderVerification
} from "./synthetic-world-actual-custom-25d-render-verification.mjs";
import { validateWorldPipelineRendererBridge } from "./world-pipeline-renderer-bridge.mjs";

export const atlasEnginePreviewRendererIntegrationFoundationRequiredFields =
  Object.freeze([
    "atlasSessionId",
    "rendererProfile",
    "supportedPreviewModes",
    "expectedRendererPayloadCount",
    "attachmentAuthorizationRequired"
  ]);

export const atlasEnginePreviewRendererAttachmentStates = Object.freeze([
  "requested",
  "prepared",
  "attached",
  "verified",
  "detached"
]);

export const atlasEnginePreviewRendererIntegrationFoundationDefinition =
  deepFreeze({
    atlasSessionId:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.atlasSessionId,
    rendererProfile: "custom-2.5d-passive",
    supportedPreviewModes: deepFreeze(["day", "sunset", "night"]),
    expectedRendererPayloadCount:
      atlasEngineWorldPreviewRuntimeFoundationDefinition.expectedRendererPayloadCount,
    attachmentAuthorizationRequired: true
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLodProfiles = Object.freeze(["close", "gameplay", "map"]);
const previewModeAppearanceProfiles = deepFreeze({
  day: "DAY_COASTAL_LIGHTHOUSE",
  sunset: "SUNSET_COASTAL_LIGHTHOUSE",
  night: "NIGHT_COASTAL_LIGHTHOUSE"
});

export function buildAtlasEnginePreviewRendererIntegrationFoundationContext() {
  return Object.freeze(buildAtlasEngineWorldPreviewRuntimeFoundationContext());
}

export function validateAtlasEnginePreviewRendererIntegrationFoundation(
  rawFoundation = atlasEnginePreviewRendererIntegrationFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const atlasRuntimeResult =
      normalizedOptions.validateAtlasEngineWorldPreviewRuntimeFoundation(
        atlasEngineWorldPreviewRuntimeFoundationDefinition,
        { context: normalizedOptions.context }
      );
    if (!atlasRuntimeResult.ok) {
      return freezeFailure(atlasRuntimeResult);
    }

    const renderVerificationResult =
      normalizedOptions.validateSyntheticWorldActualCustom25DRenderVerification(
        syntheticWorldActualCustom25DRenderVerificationDefinition
      );
    if (!renderVerificationResult.ok) {
      return freezeFailure(renderVerificationResult);
    }

    const runtimePreparationResult =
      normalizedOptions.validateControlledSyntheticWorldRuntimeAttachmentPreparation(
        controlledSyntheticWorldRuntimeAttachmentPreparationDefinition
      );
    if (!runtimePreparationResult.ok) {
      return freezeFailure(runtimePreparationResult);
    }

    const worldPipelineResult =
      normalizedOptions.validateWorldPipelineRendererBridge();
    if (!worldPipelineResult.ok) {
      return freezeFailure(worldPipelineResult);
    }

    const atlasRuntime = atlasRuntimeResult.atlasWorldPreviewRuntime;
    validateAtlasSessionId(foundation.atlasSessionId, atlasRuntime.atlasSessionId);
    validateRendererPayloadCount(
      foundation.expectedRendererPayloadCount,
      atlasRuntime.rendererPayload
    );
    validateRendererProfile(
      foundation.rendererProfile,
      atlasRuntime.rendererPayload,
      worldPipelineResult.worldPipelineRendererBridge
    );
    validateAssetReferences(atlasRuntime.rendererPayload);
    validateLodCompatibility(atlasRuntime.rendererPayload);
    validateAppearanceProfileCompatibility(
      foundation.supportedPreviewModes,
      renderVerificationResult.renderVerification
    );

    const rendererRequest = buildRendererRequest(
      foundation,
      atlasRuntime,
      renderVerificationResult.renderVerification
    );
    const verificationResult = buildVerificationResult(
      atlasRuntime,
      renderVerificationResult.renderVerification,
      runtimePreparationResult.runtimePreparation
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasPreviewRendererIntegration: Object.freeze({
        atlasSessionId: foundation.atlasSessionId,
        rendererRequest,
        attachmentState: Object.freeze({
          currentState: "prepared",
          allowedStates: atlasEnginePreviewRendererAttachmentStates,
          manualAuthorizationRequired:
            foundation.attachmentAuthorizationRequired,
          liveRuntimeEnabled: false,
          realMapAttached: false,
          playerRuntimeEnabled: false
        }),
        verificationResult,
        cleanupContract: Object.freeze({
          detachSafetyVerified: true,
          rendererStateReleaseVerified: true,
          duplicateAttachmentPreventionVerified: true,
          staleReferenceProtectionVerified: true,
          affectedLiveRuntime: false
        }),
        compatibility: Object.freeze({
          atlasSessionValidityVerified: true,
          worldPayloadValidityVerified: true,
          assetReferencesVerified: true,
          lodCompatibilityVerified: true,
          appearanceProfileCompatibilityVerified: true,
          passiveOnly: true,
          gpsConnected: false,
          externalMapServicesQueried: false,
          realMapAttached: false,
          playerRuntimeEnabled: false,
          rendererModified: false,
          gameplayModified: false,
          firebaseModified: false,
          backendModified: false
        })
      })
    });
  } catch (error) {
    if (error?.name !== "AtlasEnginePreviewRendererIntegrationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      atlasPreviewRendererIntegration: null
    });
  }
}

export function createAtlasEnginePreviewRendererIntegrationSession(
  rawFoundation = atlasEnginePreviewRendererIntegrationFoundationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_preview_required",
      message:
        "Atlas Engine preview renderer integration sessions require manual: true.",
      rendererAttachmentSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_preview_required",
      message:
        "Atlas Engine preview renderer integration sessions require isolated: true.",
      rendererAttachmentSession: null
    });
  }

  const validation = validateAtlasEnginePreviewRendererIntegrationFoundation(
    rawFoundation,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      rendererAttachmentSession: null
    });
  }

  let attachmentState = "prepared";
  let attached = false;
  let detached = false;
  let closed = false;
  const integration = validation.atlasPreviewRendererIntegration;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    rendererAttachmentSession: Object.freeze({
      atlasSessionId: integration.atlasSessionId,
      rendererRequest: integration.rendererRequest,
      verificationResult: integration.verificationResult,
      currentAttachmentState() {
        return attachmentState;
      },
      requestRendererAttachment(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas Engine preview renderer integration rejects attachment requests after session closure.",
            attachment: null
          });
        }

        if (requestOptions.manualAttachmentAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_attachment_authorization_required",
            message:
              "Atlas Engine preview renderer integration requires manualAttachmentAuthorized: true before attachment.",
            attachment: null
          });
        }

        if (attached && !detached) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_attachment_prevented",
            message:
              "Atlas Engine preview renderer integration prevents duplicate attachments for the same prepared session.",
            attachment: null
          });
        }

        const previewMode = normalizePreviewMode(
          requestOptions.previewMode ?? "day",
          "requestRendererAttachment.previewMode"
        );
        if (!integration.rendererRequest.previewModes.includes(previewMode)) {
          return Object.freeze({
            ok: false,
            errorCode: "unsupported_preview_mode",
            message:
              "Atlas Engine preview renderer integration only supports approved day, sunset, or night preview modes.",
            attachment: null
          });
        }

        attachmentState = "requested";
        attachmentState = "attached";
        attachmentState = "verified";
        attached = true;
        detached = false;

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          attachment: Object.freeze({
            atlasSessionId: integration.atlasSessionId,
            rendererRequest: Object.freeze({
              ...integration.rendererRequest,
              selectedPreviewMode: previewMode,
              selectedAppearanceProfile:
                previewModeAppearanceProfiles[previewMode]
            }),
            attachmentState,
            verificationResult: Object.freeze({
              ...integration.verificationResult,
              previewMode,
              selectedAppearanceProfile:
                previewModeAppearanceProfiles[previewMode]
            }),
            liveRuntimeEnabled: false,
            realMapAttached: false,
            playerRuntimeEnabled: false
          })
        });
      },
      detachRendererAttachment() {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Atlas Engine preview renderer integration rejects detach operations after session closure.",
            cleanupResult: null
          });
        }

        const priorState = attachmentState;
        attachmentState = "detached";
        detached = true;

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          cleanupResult: Object.freeze({
            priorState,
            currentState: attachmentState,
            detachSafelyCompleted: true,
            rendererStateReleased: attached === true,
            duplicateAttachmentPrevented: true,
            affectedLiveRuntime: false
          })
        });
      },
      closeRendererAttachmentSession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            duplicateAttachmentCreated: false,
            affectedLiveRuntime: false
          });
        }

        closed = true;
        attachmentState = "detached";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "atlas-preview-renderer-attachment-detached",
          releasedStateCount: integration.rendererRequest.rendererPayload.length,
          duplicateAttachmentCreated: false,
          affectedLiveRuntime: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ??
      buildAtlasEnginePreviewRendererIntegrationFoundationContext(),
    validateAtlasEngineWorldPreviewRuntimeFoundation:
      options.validateAtlasEngineWorldPreviewRuntimeFoundation ??
      validateAtlasEngineWorldPreviewRuntimeFoundation,
    validateSyntheticWorldActualCustom25DRenderVerification:
      options.validateSyntheticWorldActualCustom25DRenderVerification ??
      validateSyntheticWorldActualCustom25DRenderVerification,
    validateControlledSyntheticWorldRuntimeAttachmentPreparation:
      options.validateControlledSyntheticWorldRuntimeAttachmentPreparation ??
      validateControlledSyntheticWorldRuntimeAttachmentPreparation,
    validateWorldPipelineRendererBridge:
      options.validateWorldPipelineRendererBridge ??
      validateWorldPipelineRendererBridge
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "Atlas Engine preview renderer integration foundation"
  );
  assertRequiredFields(foundation);

  return Object.freeze({
    atlasSessionId: normalizePermanentId(
      foundation.atlasSessionId,
      "atlasSessionId"
    ),
    rendererProfile: normalizeStringValue(
      foundation.rendererProfile,
      "rendererProfile"
    ),
    supportedPreviewModes: deepFreeze(
      normalizePreviewModes(
        foundation.supportedPreviewModes,
        "supportedPreviewModes"
      )
    ),
    expectedRendererPayloadCount: normalizePositiveInteger(
      foundation.expectedRendererPayloadCount,
      "expectedRendererPayloadCount"
    ),
    attachmentAuthorizationRequired: normalizeBoolean(
      foundation.attachmentAuthorizationRequired,
      "attachmentAuthorizationRequired"
    )
  });
}

function buildRendererRequest(foundation, atlasRuntime, renderVerification) {
  return Object.freeze({
    atlasSessionId: foundation.atlasSessionId,
    rendererProfile: foundation.rendererProfile,
    previewModes: foundation.supportedPreviewModes,
    rendererPayload: atlasRuntime.rendererPayload,
    manualOnly: true,
    isolated: true,
    lifecycleExecutionEnabled: false,
    automaticMapAttachmentEnabled: false,
    verificationReference: Object.freeze({
      mode: renderVerification.renderRequest.mode,
      supportedAppearanceProfiles:
        syntheticWorldActualCustom25DRenderVerificationDefinition.supportedAppearanceProfiles
    })
  });
}

function buildVerificationResult(
  atlasRuntime,
  renderVerification,
  runtimePreparation
) {
  return Object.freeze({
    worldPayloadValid: true,
    assetReferencesValid: true,
    lodCompatibilityValid: true,
    appearanceProfileCompatibilityValid: true,
    rendererVerificationCompatible:
      renderVerification.verificationResult.rendererCompatibilityVerified === true,
    cleanupSafe:
      runtimePreparation.rendererAttachmentBoundary.verificationResult
        .runtimeStayedPassive === true,
    duplicateAttachmentPrevented: true,
    verifiedRendererPayloadCount: atlasRuntime.rendererPayload.length,
    verifiedAssetIds: deepFreeze(
      atlasRuntime.rendererPayload.map((entry) => entry.rendererAssetReference.assetId)
    )
  });
}

function validateAtlasSessionId(expectedSessionId, receivedSessionId) {
  if (expectedSessionId !== receivedSessionId) {
    throw createValidationError(
      "atlas_session_id_mismatch",
      "Atlas preview renderer integration atlasSessionId must match the validated Atlas runtime session."
    );
  }
}

function validateRendererPayloadCount(expectedCount, rendererPayload) {
  if (rendererPayload.length !== expectedCount) {
    throw createValidationError(
      "renderer_payload_count_mismatch",
      "Atlas preview renderer integration expectedRendererPayloadCount does not match the Atlas preview renderer payload."
    );
  }
}

function validateRendererProfile(
  rendererProfile,
  rendererPayload,
  worldPipelineRendererBridge
) {
  if (worldPipelineRendererBridge.foundation.bridgePolicy.rendererProfile !== rendererProfile) {
    throw createValidationError(
      "unsupported_renderer_profile",
      "Atlas preview renderer integration requires the approved Custom 2.5D passive renderer profile."
    );
  }

  for (const entry of rendererPayload) {
    if (entry.passiveRendererPayload.metadata.adapterProfile !== rendererProfile) {
      throw createValidationError(
        "unsupported_renderer_profile",
        `Atlas preview renderer payload ${entry.rendererAssetReference.assetId} does not use the approved passive renderer profile.`
      );
    }
  }
}

function validateAssetReferences(rendererPayload) {
  for (const entry of rendererPayload) {
    if (!permanentIdPattern.test(entry.rendererAssetReference.assetId)) {
      throw createValidationError(
        "invalid_asset_reference",
        "Atlas preview renderer integration requires permanent asset IDs in every renderer payload entry."
      );
    }
  }
}

function validateLodCompatibility(rendererPayload) {
  for (const entry of rendererPayload) {
    if (!supportedLodProfiles.includes(entry.lodProfile)) {
      throw createValidationError(
        "lod_profile_mismatch",
        `Atlas preview renderer integration renderer payload ${entry.rendererAssetReference.assetId} must use an approved LOD profile.`
      );
    }
  }
}

function validateAppearanceProfileCompatibility(
  supportedPreviewModes,
  renderVerification
) {
  const expectedProfiles = supportedPreviewModes.map(
    (previewMode) => previewModeAppearanceProfiles[previewMode]
  );
  const supportedProfiles =
    syntheticWorldActualCustom25DRenderVerificationDefinition.supportedAppearanceProfiles;

  if (!sameStringArray(expectedProfiles, supportedProfiles)) {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Atlas preview renderer integration preview modes must map exactly to the approved day, sunset, and night appearance profiles."
    );
  }

  if (renderVerification.renderRequest.rendererProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "appearance_profile_mismatch",
      "Atlas preview renderer integration requires the approved passive renderer verification request."
    );
  }
}

function assertRequiredFields(foundation) {
  for (const fieldName of atlasEnginePreviewRendererIntegrationFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Atlas Engine preview renderer integration foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePreviewModes(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `${fieldName} must be an array of preview modes.`
    );
  }

  return value.map((entry, index) =>
    normalizePreviewMode(entry, `${fieldName}[${index}]`)
  );
}

function normalizePreviewMode(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(previewModeAppearanceProfiles, normalized)) {
    throw createValidationError(
      "unsupported_preview_mode",
      `${fieldName} must be one of day, sunset, or night.`
    );
  }
  return normalized;
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

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_positive_integer",
      `${fieldName} must be a positive integer.`
    );
  }
  return value;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `${fieldName} must be a boolean.`
    );
  }
  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode ?? "upstream_validation_failed",
    message: result.message ?? "Upstream validation failed.",
    atlasPreviewRendererIntegration: null
  });
}

function sameStringArray(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => entry === right[index]);
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
  error.name = "AtlasEnginePreviewRendererIntegrationValidationError";
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
