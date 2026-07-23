import {
  buildSyntheticWorldActualCustom25DRenderVerificationContext,
  syntheticWorldActualCustom25DRenderVerificationDefinition,
  validateSyntheticWorldActualCustom25DRenderVerification
} from "./synthetic-world-actual-custom-25d-render-verification.mjs";
import {
  syntheticWorldCustom25DVisualVerificationDefinition,
  validateSyntheticWorldCustom25DVisualVerification
} from "./synthetic-world-custom-25d-visual-verification.mjs";
import { validateWorldPipelineRendererBridge } from "./world-pipeline-renderer-bridge.mjs";

export const controlledSyntheticWorldRuntimeAttachmentPreparationRequiredFields =
  Object.freeze([
    "sessionId",
    "worldId",
    "expectedAssetIds",
    "activationMode",
    "activationAuthorizationRequired"
  ]);

export const controlledSyntheticWorldRuntimeAttachmentStates = Object.freeze([
  "created",
  "prepared",
  "attached",
  "running",
  "detached",
  "closed"
]);

export const controlledSyntheticWorldRuntimeAttachmentPreparationDefinition =
  deepFreeze({
    sessionId: "SYNTHETIC_RUNTIME_ATTACHMENT_SESSION_001",
    worldId: "SYNTHETIC_COASTAL_WORLD_SCENE_001",
    expectedAssetIds: deepFreeze([
      "LIGHTHOUSE_ISLAND_ROCKY_001",
      "BUILDING_HOUSE_SMALL_COASTAL_001",
      "ROAD_STRAIGHT_SMALL_001",
      "TREE_EUCALYPTUS_001"
    ]),
    activationMode: "manual-only-preparation",
    activationAuthorizationRequired: true
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedRendererProfile = "custom-2.5d-passive";
const expectedAssetIds = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildControlledSyntheticWorldRuntimeAttachmentPreparationContext() {
  return Object.freeze(
    buildSyntheticWorldActualCustom25DRenderVerificationContext()
  );
}

export function validateControlledSyntheticWorldRuntimeAttachmentPreparation(
  rawDefinition = controlledSyntheticWorldRuntimeAttachmentPreparationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeDefinition(rawDefinition);

    const renderVerificationResult =
      normalizedOptions.validateSyntheticWorldActualCustom25DRenderVerification(
        normalizedOptions.renderVerificationDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!renderVerificationResult.ok) {
      return freezeFailure(renderVerificationResult);
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

    const runtimePreparation = buildRuntimePreparationResult(
      definition,
      renderVerificationResult.renderVerification,
      visualVerificationResult.visualVerification,
      worldPipelineResult.worldPipelineRendererBridge
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      runtimePreparation
    });
  } catch (error) {
    if (
      error?.name !==
      "ControlledSyntheticWorldRuntimeAttachmentPreparationValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      runtimePreparation: null
    });
  }
}

export function createControlledSyntheticWorldRuntimeAttachmentPreparationSession(
  rawDefinition = controlledSyntheticWorldRuntimeAttachmentPreparationDefinition,
  options = {}
) {
  if (options.manual !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "manual_verification_required",
      message:
        "Controlled synthetic runtime attachment preparation sessions require manual: true.",
      runtimeSession: null
    });
  }

  if (options.isolated !== true) {
    return Object.freeze({
      ok: false,
      errorCode: "isolated_verification_required",
      message:
        "Controlled synthetic runtime attachment preparation sessions require isolated: true.",
      runtimeSession: null
    });
  }

  const validation = validateControlledSyntheticWorldRuntimeAttachmentPreparation(
    rawDefinition,
    options
  );
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      runtimeSession: null
    });
  }

  let lifecycleState = "prepared";
  let closed = false;
  let attachmentGranted = false;
  const preparation = validation.runtimePreparation;

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    runtimeSession: Object.freeze({
      sessionId: preparation.runtimeSession.sessionId,
      worldId: preparation.runtimeSession.worldId,
      assetInstances: preparation.runtimeSession.assetInstances,
      rendererState: preparation.runtimeSession.rendererState,
      activationMode: preparation.runtimeSession.activationMode,
      cleanupState: preparation.runtimeSession.cleanupState,
      currentActivationState() {
        return lifecycleState;
      },
      requestRendererAttachment(requestOptions = {}) {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Controlled synthetic runtime attachment preparation rejects renderer attachment requests after session closure.",
            attachmentBoundary: null
          });
        }

        if (requestOptions.manualActivationAuthorized !== true) {
          return Object.freeze({
            ok: false,
            errorCode: "manual_activation_authorization_required",
            message:
              "Controlled synthetic runtime attachment preparation requires manualActivationAuthorized: true before renderer attachment may be prepared.",
            attachmentBoundary: null
          });
        }

        if (attachmentGranted) {
          return Object.freeze({
            ok: false,
            errorCode: "duplicate_session_prevented",
            message:
              "Controlled synthetic runtime attachment preparation prevents duplicate attachment requests for the same prepared session.",
            attachmentBoundary: null
          });
        }

        attachmentGranted = true;
        lifecycleState = "attached";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          attachmentBoundary: Object.freeze({
            runtimeSession: preparation.rendererAttachmentBoundary.runtimeSession,
            rendererAttachmentRequest:
              preparation.rendererAttachmentBoundary.rendererAttachmentRequest,
            verificationResult:
              preparation.rendererAttachmentBoundary.verificationResult,
            lifecycleExecutionEnabled: false,
            automaticMapAttachmentEnabled: false,
            liveRuntimeEnabled: false
          })
        });
      },
      detachPreparedAttachment() {
        if (closed) {
          return Object.freeze({
            ok: false,
            errorCode: "stale_reference_rejected",
            message:
              "Controlled synthetic runtime attachment preparation rejects detach operations after session closure.",
            cleanupResult: null
          });
        }

        const priorState = lifecycleState;
        lifecycleState = "detached";

        return Object.freeze({
          ok: true,
          errorCode: null,
          message: null,
          cleanupResult: Object.freeze({
            detachedSafely: true,
            stateReleased: priorState === "attached" || priorState === "prepared",
            duplicateSessionPrevented: true,
            staleReferenceRejected: true,
            affectedLiveRuntime: false
          })
        });
      },
      closeRuntimeSession() {
        if (closed) {
          return Object.freeze({
            ok: true,
            cleanupPerformed: false,
            cleanupStatus: "already-closed",
            releasedStateCount: 0,
            affectedLiveRuntime: false,
            duplicateSessionCreated: false
          });
        }

        closed = true;
        lifecycleState = "closed";

        return Object.freeze({
          ok: true,
          cleanupPerformed: true,
          cleanupStatus: "synthetic-runtime-session-closed",
          releasedStateCount: preparation.runtimeSession.assetInstances.length,
          affectedLiveRuntime: false,
          duplicateSessionCreated: false
        });
      }
    })
  });
}

function normalizeOptions(options) {
  const validationContext =
    options.validationContext ??
    buildControlledSyntheticWorldRuntimeAttachmentPreparationContext();

  return Object.freeze({
    validationContext,
    renderVerificationDefinition:
      options.renderVerificationDefinition ??
      syntheticWorldActualCustom25DRenderVerificationDefinition,
    visualVerificationDefinition:
      options.visualVerificationDefinition ??
      syntheticWorldCustom25DVisualVerificationDefinition,
    validateSyntheticWorldActualCustom25DRenderVerification:
      typeof options.validateSyntheticWorldActualCustom25DRenderVerification ===
      "function"
        ? options.validateSyntheticWorldActualCustom25DRenderVerification
        : validateSyntheticWorldActualCustom25DRenderVerification,
    validateSyntheticWorldCustom25DVisualVerification:
      typeof options.validateSyntheticWorldCustom25DVisualVerification ===
      "function"
        ? options.validateSyntheticWorldCustom25DVisualVerification
        : validateSyntheticWorldCustom25DVisualVerification,
    validateWorldPipelineRendererBridge:
      typeof options.validateWorldPipelineRendererBridge === "function"
        ? options.validateWorldPipelineRendererBridge
        : validateWorldPipelineRendererBridge
  });
}

function buildRuntimePreparationResult(
  definition,
  renderVerification,
  visualVerification,
  worldPipelineRendererBridge
) {
  validateWorldId(
    definition.worldId,
    renderVerification.worldId,
    visualVerification.worldId
  );
  validateExpectedAssetIds(definition.expectedAssetIds);
  validateRendererCompatibility(
    renderVerification.rendererPayloads,
    worldPipelineRendererBridge
  );

  const assetInstances = renderVerification.verificationResult.orderedAssetIds.map(
    (assetId) => {
      const rendererPayload = findRendererPayload(
        renderVerification.rendererPayloads,
        assetId
      );
      return Object.freeze({
        assetId,
        manifestId: rendererPayload.rendererAssetReference.manifestId,
        recipeId: rendererPayload.rendererAssetReference.recipeId
      });
    }
  );

  return Object.freeze({
    runtimeSession: Object.freeze({
      sessionId: definition.sessionId,
      worldId: definition.worldId,
      assetInstances: deepFreeze(assetInstances),
      rendererState: Object.freeze({
        rendererProfile: supportedRendererProfile,
        renderRequestMode: renderVerification.renderRequest.mode,
        rendererPayloadCount: renderVerification.rendererPayloads.length,
        automaticLifecycleExecutionEnabled: false
      }),
      activationMode: Object.freeze({
        mode: definition.activationMode,
        manualActivationRequired: definition.activationAuthorizationRequired,
        activationState: "prepared"
      }),
      cleanupState: Object.freeze({
        detachSafetyVerified: true,
        stateReleaseReady: true,
        duplicateSessionPreventionReady: true,
        staleReferenceRejectionReady: true
      })
    }),
    rendererAttachmentBoundary: Object.freeze({
      runtimeSession: Object.freeze({
        sessionId: definition.sessionId,
        worldId: definition.worldId,
        activationState: "prepared"
      }),
      rendererAttachmentRequest: Object.freeze({
        rendererProfile: supportedRendererProfile,
        manualActivationAuthorized: true,
        attachmentMode: "verification-only",
        automaticMapAttachmentEnabled: false,
        lifecycleExecutionEnabled: false
      }),
      verificationResult: Object.freeze({
        preparedSuccessfully: true,
        attachmentAllowed: true,
        runtimeStayedPassive: true,
        productionMapAttached: false,
        liveRuntimeEnabled: false
      })
    }),
    compatibility: Object.freeze({
      runtimeSessionStructureVerified: true,
      activationAuthorizationVerified: true,
      rendererAttachmentBoundaryVerified: true,
      cleanupValidationReady: true,
      passiveOnly: true
    })
  });
}

function validateWorldId(definitionWorldId, renderWorldId, visualWorldId) {
  if (definitionWorldId !== renderWorldId || definitionWorldId !== visualWorldId) {
    throw createValidationError(
      "world_id_mismatch",
      "Controlled synthetic runtime attachment preparation worldId must match the validated synthetic render and visual verification worldId."
    );
  }
}

function validateExpectedAssetIds(expectedAssetIds) {
  if (!sameStringArray(expectedAssetIds, expectedAssetIds)) {
    throw createValidationError(
      "asset_set_mismatch",
      "Controlled synthetic runtime attachment preparation requires the approved lighthouse synthetic asset set."
    );
  }

  if (!sameStringArray(expectedAssetIds, expectedAssetIdsFromContract())) {
    throw createValidationError(
      "asset_set_mismatch",
      "Controlled synthetic runtime attachment preparation asset set must match the approved lighthouse, house, road, and tree contract."
    );
  }
}

function validateRendererCompatibility(
  rendererPayloads,
  worldPipelineRendererBridge
) {
  for (const rendererPayload of rendererPayloads) {
    if (rendererPayload.metadata.adapterProfile !== supportedRendererProfile) {
      throw createValidationError(
        "unsupported_renderer_profile",
        `Renderer payload profile ${rendererPayload.metadata.adapterProfile} is not compatible with controlled synthetic runtime attachment preparation.`
      );
    }
  }

  if (
    worldPipelineRendererBridge.compatibility.rendererProfileSupportVerified !== true
  ) {
    throw createValidationError(
      "unsupported_renderer_profile",
      "World pipeline renderer bridge must preserve renderer profile compatibility before runtime attachment preparation can proceed."
    );
  }
}

function expectedAssetIdsFromContract() {
  return expectedAssetIds;
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "controlled synthetic runtime attachment preparation"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    sessionId: normalizePermanentId(definition.sessionId, "sessionId"),
    worldId: normalizeStringValue(definition.worldId, "worldId"),
    expectedAssetIds: deepFreeze(
      normalizePermanentIdArray(definition.expectedAssetIds, "expectedAssetIds")
    ),
    activationMode: normalizeStringValue(definition.activationMode, "activationMode"),
    activationAuthorizationRequired: normalizeBoolean(
      definition.activationAuthorizationRequired,
      "activationAuthorizationRequired"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of controlledSyntheticWorldRuntimeAttachmentPreparationRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Missing required synthetic runtime attachment preparation field: ${fieldName}.`
      );
    }
  }
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

function normalizePermanentId(value, fieldName) {
  const normalizedValue = normalizeStringValue(value, fieldName);
  if (!permanentIdPattern.test(normalizedValue)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent uppercase identifier.`
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

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `${fieldName} must be a boolean.`
    );
  }
  return value;
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
    runtimePreparation: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name =
    "ControlledSyntheticWorldRuntimeAttachmentPreparationValidationError";
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
