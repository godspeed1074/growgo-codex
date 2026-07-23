import {
  buildSyntheticWorldSceneConsumerContext,
  syntheticWorldSceneConsumerDefinition,
  validateSyntheticWorldSceneConsumer
} from "./synthetic-world-scene-consumer.mjs";

export const syntheticWorldToCustom25DPassiveRendererBridgeRequiredFields =
  Object.freeze(["worldId", "rendererPayloads", "lodProfiles", "visibilityStates"]);

export const syntheticWorldToCustom25DPassiveRendererBridgeDefinition = Object.freeze({
  ...syntheticWorldSceneConsumerDefinition
});

const supportedRendererProfile = "custom-2.5d-passive";
const requiredSceneAssetIds = Object.freeze([
  "LIGHTHOUSE_ISLAND_ROCKY_001",
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "TREE_EUCALYPTUS_001"
]);

export function buildSyntheticWorldToCustom25DPassiveRendererBridgeContext() {
  return Object.freeze(buildSyntheticWorldSceneConsumerContext());
}

export function validateSyntheticWorldToCustom25DPassiveRendererBridge(
  rawWorld = syntheticWorldToCustom25DPassiveRendererBridgeDefinition,
  options = {}
) {
  const syntheticWorldResult = validateSyntheticWorldSceneConsumer(rawWorld, options);

  if (!syntheticWorldResult.ok) {
    return Object.freeze({
      ok: false,
      errorCode: syntheticWorldResult.errorCode,
      message: syntheticWorldResult.message,
      custom25DRendererSceneConsumer: null
    });
  }

  try {
    const custom25DRendererSceneConsumer =
      validateSyntheticWorldCustom25DPassiveRendererScene(
        syntheticWorldResult.syntheticWorldScene
      );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      custom25DRendererSceneConsumer
    });
  } catch (error) {
    if (error?.name !== "SyntheticWorldCustom25DPassiveRendererBridgeValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      custom25DRendererSceneConsumer: null
    });
  }
}

export function validateSyntheticWorldCustom25DPassiveRendererScene(rawScene) {
  const syntheticWorldScene = normalizeSyntheticWorldScene(rawScene);
  const assetSceneObjects = requiredSceneAssetIds.map((assetId) =>
    buildSceneAssetValidation(assetId, syntheticWorldScene)
  );

  const rendererPayloads = deepFreeze(
    assetSceneObjects.map((entry) => entry.bridgeOutput.passiveRendererPayload)
  );
  const lodProfiles = deepFreeze(
    assetSceneObjects.map((entry) =>
      Object.freeze({
        assetId: entry.assetId,
        lodProfile: entry.bridgeOutput.lodProfile
      })
    )
  );
  const visibilityStates = deepFreeze(
    assetSceneObjects.map((entry) =>
      Object.freeze({
        assetId: entry.assetId,
        visibilityState: entry.bridgeOutput.visibilityMetadata.visibilityState
      })
    )
  );

  return Object.freeze({
    worldId: syntheticWorldScene.world.worldId,
    rendererPayloads,
    lodProfiles,
    visibilityStates,
    assetSceneObjects: deepFreeze(assetSceneObjects),
    compatibility: Object.freeze({
      rendererProfile: supportedRendererProfile,
      assetReferencesVerified: true,
      transformsVerified: true,
      placementDataVerified: true,
      lodProfilesVerified: true,
      visibilityStatesVerified: true,
      deterministicPayloadReady: true,
      passiveOnly: true
    })
  });
}

function normalizeSyntheticWorldScene(rawScene) {
  const syntheticWorldScene = asPlainObject(
    rawScene,
    "synthetic world Custom 2.5D passive renderer scene"
  );
  const requiredFields = [
    "world",
    "candidateEvaluations",
    "bridgeResult",
    "consumerResults"
  ];

  for (const fieldName of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(syntheticWorldScene, fieldName)) {
      throw createValidationError(
        "missing_synthetic_world_artifact",
        `Synthetic world Custom 2.5D validation requires ${fieldName}.`
      );
    }
  }

  const bridgeResult = asPlainObject(syntheticWorldScene.bridgeResult, "bridgeResult");

  if (!Array.isArray(bridgeResult.rendererHandoffOutputs)) {
    throw createValidationError(
      "invalid_bridge_outputs",
      "Synthetic world bridgeResult.rendererHandoffOutputs must be an array."
    );
  }

  if (!Array.isArray(syntheticWorldScene.candidateEvaluations)) {
    throw createValidationError(
      "invalid_candidate_evaluations",
      "Synthetic world candidateEvaluations must be an array."
    );
  }

  if (!Array.isArray(syntheticWorldScene.consumerResults)) {
    throw createValidationError(
      "invalid_consumer_results",
      "Synthetic world consumerResults must be an array."
    );
  }

  return Object.freeze({
    world: asPlainObject(syntheticWorldScene.world, "world"),
    candidateEvaluations: syntheticWorldScene.candidateEvaluations,
    bridgeResult,
    consumerResults: syntheticWorldScene.consumerResults
  });
}

function buildSceneAssetValidation(assetId, syntheticWorldScene) {
  const candidateEvaluation = findCandidateEvaluation(
    syntheticWorldScene.candidateEvaluations,
    assetId
  );
  const bridgeOutput = findBridgeOutput(
    syntheticWorldScene.bridgeResult.rendererHandoffOutputs,
    assetId
  );
  const consumerResult = findConsumerResult(
    syntheticWorldScene.consumerResults,
    bridgeOutput.passiveRendererPayload
  );

  if (bridgeOutput.rendererAssetReference.assetId !== assetId) {
    throw createValidationError(
      "asset_reference_mismatch",
      `Renderer bridge asset reference ${bridgeOutput.rendererAssetReference.assetId} must match ${assetId}.`
    );
  }

  if (bridgeOutput.passiveRendererPayload.metadata.adapterProfile !== supportedRendererProfile) {
    throw createValidationError(
      "unsupported_renderer_profile",
      `Renderer payload profile ${bridgeOutput.passiveRendererPayload.metadata.adapterProfile} is not compatible with the passive Custom 2.5D contract.`
    );
  }

  if (!consumerResult.ok) {
    throw createValidationError(
      consumerResult.errorCode ?? "consumer_result_invalid",
      consumerResult.message ??
        `Passive renderer consumer rejected ${assetId} during Custom 2.5D validation.`
    );
  }

  validateTransformData(assetId, candidateEvaluation, bridgeOutput);
  validatePlacementData(assetId, candidateEvaluation, bridgeOutput);
  validateLodAndVisibility(assetId, candidateEvaluation, bridgeOutput);

  return Object.freeze({
    assetId,
    bridgeOutput,
    candidateEvaluation,
    consumerResult
  });
}

function validateTransformData(assetId, candidateEvaluation, bridgeOutput) {
  const expectedPlacement = candidateEvaluation.candidateEvaluation.placementResult.placement;
  const transformData = bridgeOutput.transformData;

  if (transformData.orientation !== expectedPlacement.orientation) {
    throw createValidationError(
      "transform_orientation_mismatch",
      `Renderer transform orientation for ${assetId} must match deterministic placement orientation.`
    );
  }

  if (
    transformData.position.x !== expectedPlacement.position.x ||
    transformData.position.y !== expectedPlacement.position.y
  ) {
    throw createValidationError(
      "transform_position_mismatch",
      `Renderer transform position for ${assetId} must match deterministic placement position.`
    );
  }
}

function validatePlacementData(assetId, candidateEvaluation, bridgeOutput) {
  const expectedPlacement = candidateEvaluation.candidateEvaluation.placementResult.placement;
  const expectedDeterministicPlacement =
    candidateEvaluation.candidateEvaluation.placementResult.deterministicPlacement;
  const placementData = bridgeOutput.placementData;

  if (placementData.locationId !== expectedPlacement.locationId) {
    throw createValidationError(
      "placement_location_mismatch",
      `Renderer placement location for ${assetId} must match deterministic placement location.`
    );
  }

  if (placementData.placementRuleId !== expectedDeterministicPlacement.placementRuleId) {
    throw createValidationError(
      "placement_rule_mismatch",
      `Renderer placement rule for ${assetId} must match deterministic placement rule.`
    );
  }

  if (placementData.orientation !== expectedPlacement.orientation) {
    throw createValidationError(
      "placement_orientation_mismatch",
      `Renderer placement orientation for ${assetId} must match deterministic placement orientation.`
    );
  }
}

function validateLodAndVisibility(assetId, candidateEvaluation, bridgeOutput) {
  const evaluation = candidateEvaluation.candidateEvaluation;

  if (bridgeOutput.lodProfile !== evaluation.selectedLodProfile) {
    throw createValidationError(
      "lod_profile_mismatch",
      `Renderer LOD profile for ${assetId} must match the synthetic world selected LOD profile.`
    );
  }

  if (bridgeOutput.visibilityMetadata.visibilityState !== evaluation.streamingState) {
    throw createValidationError(
      "visibility_state_mismatch",
      `Renderer visibility state for ${assetId} must match the synthetic world streaming state.`
    );
  }
}

function findCandidateEvaluation(candidateEvaluations, assetId) {
  const candidateEvaluation =
    candidateEvaluations.find((entry) => entry.assetInstance?.assetId === assetId) ?? null;

  if (!candidateEvaluation) {
    throw createValidationError(
      "missing_candidate_evaluation",
      `Synthetic world candidate evaluation for ${assetId} is unavailable.`
    );
  }

  return candidateEvaluation;
}

function findBridgeOutput(rendererHandoffOutputs, assetId) {
  const bridgeOutput =
    rendererHandoffOutputs.find(
      (entry) => entry.rendererAssetReference?.assetId === assetId
    ) ?? null;

  if (!bridgeOutput) {
    throw createValidationError(
      "missing_bridge_output",
      `Synthetic world renderer handoff output for ${assetId} is unavailable.`
    );
  }

  return bridgeOutput;
}

function findConsumerResult(consumerResults, passiveRendererPayload) {
  const consumerResult =
    consumerResults.find(
      (entry) =>
        JSON.stringify(entry.acceptedPayload) === JSON.stringify(passiveRendererPayload)
    ) ?? null;

  if (!consumerResult) {
    throw createValidationError(
      "missing_consumer_result",
      "Synthetic world passive renderer consumer result is unavailable for a renderer payload."
    );
  }

  return consumerResult;
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
  error.name = "SyntheticWorldCustom25DPassiveRendererBridgeValidationError";
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
