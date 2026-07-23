import {
  buildWorldStreamingCoordinatorFoundationContext,
  validateWorldStreamingCoordinatorFoundation
} from "./world-streaming-coordinator-foundation.mjs";
import { validateWorldInstanceManagerFoundation } from "./world-instance-manager-foundation.mjs";
import { validatePassiveRendererPayload } from "./passive-renderer-consumer.mjs";

export const worldPipelineRendererBridgeRequiredFields = Object.freeze([
  "bridgeInputs",
  "bridgePolicy"
]);

export const worldPipelineRendererBridgeSupportedVisibilityStates = Object.freeze([
  "requested",
  "loading",
  "ready",
  "visible",
  "cached",
  "unloaded"
]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLodProfiles = Object.freeze(["close", "gameplay", "map"]);

export function buildWorldPipelineRendererBridgeContext() {
  return Object.freeze(buildWorldStreamingCoordinatorFoundationContext());
}

export const worldPipelineRendererBridgeFoundationDefinition = deepFreeze(
  buildDefaultWorldPipelineRendererBridgeFoundation()
);

export function buildPassiveWorldPipelineRendererBridge(
  rawFoundation = worldPipelineRendererBridgeFoundationDefinition,
  options = {}
) {
  const validation = validateWorldPipelineRendererBridge(rawFoundation, options);
  if (!validation.ok) {
    return Object.freeze({
      ok: false,
      errorCode: validation.errorCode,
      message: validation.message,
      bridge: null
    });
  }

  return Object.freeze({
    ok: true,
    errorCode: null,
    message: null,
    bridge: validation.worldPipelineRendererBridge
  });
}

export function validateWorldPipelineRendererBridge(
  rawFoundation = worldPipelineRendererBridgeFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeBridgeOptions(options);
    const foundation = normalizeWorldPipelineRendererBridgeFoundation(rawFoundation);

    const worldInstanceResult =
      normalizedOptions.validateWorldInstanceManagerFoundation();
    if (!worldInstanceResult.ok) {
      return freezeFailure(worldInstanceResult);
    }

    const streamingResult =
      normalizedOptions.validateWorldStreamingCoordinatorFoundation();
    if (!streamingResult.ok) {
      return freezeFailure(streamingResult);
    }

    const bridgeOutputs = foundation.bridgeInputs.map((bridgeInput) =>
      buildRendererBridgeOutput(
        bridgeInput,
        streamingResult.worldStreamingCoordinator
      )
    );

    validateBridgeInputsAgainstStreaming(
      foundation.bridgeInputs,
      bridgeOutputs,
      streamingResult.worldStreamingCoordinator
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldPipelineRendererBridge: Object.freeze({
        foundation,
        worldInstanceManager: worldInstanceResult.worldInstanceManager,
        worldStreamingCoordinator: streamingResult.worldStreamingCoordinator,
        rendererHandoffOutputs: deepFreeze(bridgeOutputs),
        compatibility: Object.freeze({
          worldInstanceValidityVerified: true,
          assetAvailabilityVerified: true,
          placementCompatibilityVerified: true,
          lodCompatibilityVerified: true,
          rendererProfileSupportVerified: true,
          deterministicPayloadVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "WorldPipelineRendererBridgeValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldPipelineRendererBridge: null
    });
  }
}

function buildDefaultWorldPipelineRendererBridgeFoundation() {
  const streamingResult = validateWorldStreamingCoordinatorFoundation();
  if (!streamingResult.ok) {
    throw createValidationError(
      streamingResult.errorCode ?? "streaming_foundation_unavailable",
      streamingResult.message ??
        "World streaming coordinator foundation must validate before the renderer bridge can be defined."
    );
  }

  const bridgeInputs = streamingResult.worldStreamingCoordinator.passiveHandoff.selectedInstances.map(
    (selectedInstance) => {
      const evaluation = findCandidateEvaluation(
        streamingResult.worldStreamingCoordinator.candidateEvaluations,
        selectedInstance.instanceId
      );
      const candidate = findInstanceCandidate(
        streamingResult.worldStreamingCoordinator.foundation.instanceCandidates,
        selectedInstance.instanceId
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

function normalizeBridgeOptions(options) {
  return Object.freeze({
    validateWorldInstanceManagerFoundation:
      typeof options.validateWorldInstanceManagerFoundation === "function"
        ? options.validateWorldInstanceManagerFoundation
        : validateWorldInstanceManagerFoundation,
    validateWorldStreamingCoordinatorFoundation:
      typeof options.validateWorldStreamingCoordinatorFoundation === "function"
        ? options.validateWorldStreamingCoordinatorFoundation
        : validateWorldStreamingCoordinatorFoundation
  });
}

function normalizeWorldPipelineRendererBridgeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "world pipeline renderer bridge foundation"
  );
  assertRequiredFields(foundation);

  const bridgePolicy = asPlainObject(foundation.bridgePolicy, "bridgePolicy");

  return deepFreeze({
    bridgeInputs: deepFreeze(normalizeBridgeInputs(foundation.bridgeInputs)),
    bridgePolicy: deepFreeze({
      rendererProfile: normalizeStringValue(
        bridgePolicy.rendererProfile,
        "bridgePolicy.rendererProfile"
      ),
      deterministic: normalizeBoolean(
        bridgePolicy.deterministic,
        "bridgePolicy.deterministic"
      ),
      renderingActivated: normalizeBoolean(
        bridgePolicy.renderingActivated,
        "bridgePolicy.renderingActivated"
      )
    })
  });
}

function normalizeBridgeInputs(value) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      "bridgeInputs must be an array of passive world pipeline bridge inputs."
    );
  }

  return value.map((entry, index) => {
    const bridgeInput = asPlainObject(entry, `bridgeInputs[${index}]`);
    const assetReference = asPlainObject(
      bridgeInput.assetReference,
      `bridgeInputs[${index}].assetReference`
    );
    const placementData = asPlainObject(
      bridgeInput.placementData,
      `bridgeInputs[${index}].placementData`
    );

    return deepFreeze({
      instanceId: normalizePermanentId(
        bridgeInput.instanceId,
        `bridgeInputs[${index}].instanceId`
      ),
      assetReference: deepFreeze({
        assetId: normalizePermanentId(
          assetReference.assetId,
          `bridgeInputs[${index}].assetReference.assetId`
        ),
        assetFamilyId: normalizePermanentId(
          assetReference.assetFamilyId,
          `bridgeInputs[${index}].assetReference.assetFamilyId`
        )
      }),
      placementData: deepFreeze({
        locationId: normalizePermanentId(
          placementData.locationId,
          `bridgeInputs[${index}].placementData.locationId`
        ),
        placementRuleId: normalizePermanentId(
          placementData.placementRuleId,
          `bridgeInputs[${index}].placementData.placementRuleId`
        ),
        orientation: normalizeStringValue(
          placementData.orientation,
          `bridgeInputs[${index}].placementData.orientation`
        )
      }),
      lodProfile: normalizeLodProfile(
        bridgeInput.lodProfile,
        `bridgeInputs[${index}].lodProfile`
      ),
      visibilityState: normalizeVisibilityState(
        bridgeInput.visibilityState,
        `bridgeInputs[${index}].visibilityState`
      ),
      priority: normalizeInteger(
        bridgeInput.priority,
        `bridgeInputs[${index}].priority`
      )
    });
  });
}

function buildRendererBridgeOutput(bridgeInput, worldStreamingCoordinator) {
  const evaluation = findCandidateEvaluation(
    worldStreamingCoordinator.candidateEvaluations,
    bridgeInput.instanceId
  );
  const candidate = findInstanceCandidate(
    worldStreamingCoordinator.foundation.instanceCandidates,
    bridgeInput.instanceId
  );

  if (!evaluation.rendererHandoff || !evaluation.rendererHandoff.ok) {
    throw createValidationError(
      "renderer_handoff_unavailable",
      `Renderer handoff for instance ${bridgeInput.instanceId} is not available.`
    );
  }

  const passiveRendererPayload = {
    rendererAssetReference: evaluation.rendererHandoff.rendererAssetReference,
    rendererComponentReferences: evaluation.rendererHandoff.rendererComponentReferences,
    transformData: evaluation.rendererHandoff.transformData,
    orientation: evaluation.rendererHandoff.transformData.orientation,
    metadata: evaluation.rendererHandoff.metadata
  };
  const payloadValidation = validatePassiveRendererPayload(passiveRendererPayload);
  if (!payloadValidation.ok) {
    throw createValidationError(
      payloadValidation.errorCode ?? "passive_renderer_payload_invalid",
      payloadValidation.message ??
        `Passive renderer payload for instance ${bridgeInput.instanceId} is invalid.`
    );
  }

  return deepFreeze({
    instanceId: bridgeInput.instanceId,
    rendererAssetReference: payloadValidation.normalizedPayload.rendererAssetReference,
    rendererComponentReferences:
      payloadValidation.normalizedPayload.rendererComponentReferences,
    transformData: payloadValidation.normalizedPayload.transformData,
    placementData: deepFreeze({
      locationId: evaluation.placementResult.placement.locationId,
      placementRuleId:
        evaluation.placementResult.deterministicPlacement.placementRuleId,
      orientation: evaluation.placementResult.placement.orientation,
      alignmentRule: evaluation.placementResult.placement.alignmentRule
    }),
    lodProfile: bridgeInput.lodProfile,
    visibilityMetadata: deepFreeze({
      visibilityState: bridgeInput.visibilityState,
      priority: bridgeInput.priority,
      distanceToPlayerMetres: evaluation.distanceToPlayerMetres,
      assetFamilyId: candidate.assetFamilyId
    }),
    passiveRendererPayload: payloadValidation.normalizedPayload
  });
}

function validateBridgeInputsAgainstStreaming(
  bridgeInputs,
  bridgeOutputs,
  worldStreamingCoordinator
) {
  for (const bridgeInput of bridgeInputs) {
    const selectedInstance = findSelectedInstance(
      worldStreamingCoordinator.passiveHandoff.selectedInstances,
      bridgeInput.instanceId
    );
    const bridgeOutput = findBridgeOutput(bridgeOutputs, bridgeInput.instanceId);
    const evaluation = findCandidateEvaluation(
      worldStreamingCoordinator.candidateEvaluations,
      bridgeInput.instanceId
    );

    if (bridgeInput.assetReference.assetId !== evaluation.assetId) {
      throw createValidationError(
        "asset_reference_mismatch",
        `Bridge input ${bridgeInput.instanceId} must reference the selected world asset exactly.`
      );
    }

    if (
      bridgeInput.placementData.locationId !==
        evaluation.placementResult.placement.locationId ||
      bridgeInput.placementData.placementRuleId !==
        evaluation.placementResult.deterministicPlacement.placementRuleId ||
      bridgeInput.placementData.orientation !==
        evaluation.placementResult.placement.orientation
    ) {
      throw createValidationError(
        "placement_data_mismatch",
        `Bridge input ${bridgeInput.instanceId} must match the deterministic placement output.`
      );
    }

    if (bridgeInput.lodProfile !== selectedInstance.selectedLodProfile) {
      throw createValidationError(
        "lod_profile_mismatch",
        `Bridge input ${bridgeInput.instanceId} must use the selected streaming LOD profile.`
      );
    }

    if (bridgeInput.visibilityState !== selectedInstance.streamingState) {
      throw createValidationError(
        "visibility_state_mismatch",
        `Bridge input ${bridgeInput.instanceId} must use the selected streaming visibility state.`
      );
    }

    if (bridgeInput.priority !== selectedInstance.loadingPriority) {
      throw createValidationError(
        "priority_mismatch",
        `Bridge input ${bridgeInput.instanceId} must preserve the selected streaming priority.`
      );
    }

    if (bridgeOutput.lodProfile !== bridgeInput.lodProfile) {
      throw createValidationError(
        "handoff_lod_profile_mismatch",
        `Renderer handoff ${bridgeInput.instanceId} must preserve the bridge input LOD profile.`
      );
    }

    if (
      bridgeOutput.visibilityMetadata.visibilityState !== bridgeInput.visibilityState ||
      bridgeOutput.visibilityMetadata.priority !== bridgeInput.priority
    ) {
      throw createValidationError(
        "visibility_metadata_mismatch",
        `Renderer handoff ${bridgeInput.instanceId} must preserve bridge visibility metadata.`
      );
    }

    if (
      bridgeOutput.rendererAssetReference.assetId !== bridgeInput.assetReference.assetId
    ) {
      throw createValidationError(
        "renderer_asset_reference_mismatch",
        `Renderer handoff ${bridgeInput.instanceId} must preserve the selected asset reference.`
      );
    }
  }
}

function findSelectedInstance(selectedInstances, instanceId) {
  const selectedInstance =
    selectedInstances.find((entry) => entry.instanceId === instanceId) ?? null;
  if (!selectedInstance) {
    throw createValidationError(
      "missing_selected_instance",
      `Selected streaming instance ${instanceId} is unavailable for renderer bridging.`
    );
  }
  return selectedInstance;
}

function findCandidateEvaluation(candidateEvaluations, instanceId) {
  const evaluation =
    candidateEvaluations.find((entry) => entry.instanceId === instanceId) ?? null;
  if (!evaluation) {
    throw createValidationError(
      "missing_candidate_evaluation",
      `Streaming candidate evaluation ${instanceId} is unavailable.`
    );
  }
  return evaluation;
}

function findInstanceCandidate(instanceCandidates, instanceId) {
  const candidate =
    instanceCandidates.find((entry) => entry.instanceId === instanceId) ?? null;
  if (!candidate) {
    throw createValidationError(
      "missing_instance_candidate",
      `Streaming instance candidate ${instanceId} is unavailable.`
    );
  }
  return candidate;
}

function findBridgeOutput(bridgeOutputs, instanceId) {
  const bridgeOutput =
    bridgeOutputs.find((entry) => entry.instanceId === instanceId) ?? null;
  if (!bridgeOutput) {
    throw createValidationError(
      "missing_bridge_output",
      `Renderer bridge output ${instanceId} is unavailable.`
    );
  }
  return bridgeOutput;
}

function assertRequiredFields(foundation) {
  for (const fieldName of worldPipelineRendererBridgeRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `World pipeline renderer bridge foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeVisibilityState(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!worldPipelineRendererBridgeSupportedVisibilityStates.includes(normalized)) {
    throw createValidationError(
      "invalid_visibility_state",
      `Visibility state ${normalized} is not supported by the passive world pipeline renderer bridge.`
    );
  }
  return normalized;
}

function normalizeLodProfile(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!supportedLodProfiles.includes(normalized)) {
    throw createValidationError(
      "invalid_lod_profile",
      `LOD profile ${normalized} is not approved for the passive world pipeline renderer bridge.`
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

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
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
    worldPipelineRendererBridge: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldPipelineRendererBridgeValidationError";
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
