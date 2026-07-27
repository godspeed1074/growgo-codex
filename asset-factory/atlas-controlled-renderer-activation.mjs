import {
  createAtlasRendererConnectionTestLayer,
  validateAtlasRendererConnectionTestLayer
} from "./atlas-renderer-connection-test.mjs";
import {
  createAtlasRendererAdapterLayer,
  validateAtlasRendererAdapterLayer
} from "./atlas-renderer-adapter.mjs";

export const atlasControlledRendererActivationLayerSchemaId =
  "ATLAS_CONTROLLED_RENDERER_ACTIVATION_LAYER_001";
export const controlledRendererTestSceneSchemaId =
  "CONTROLLED_RENDERER_TEST_SCENE_001";
export const atlasControlledRendererActivationValidationSchemaId =
  "ATLAS_CONTROLLED_RENDERER_ACTIVATION_VALIDATION_001";

export function createAtlasControlledRendererActivationLayer(
  rawInput,
  options = {}
) {
  const normalized = normalizeControlledRendererActivationInput(rawInput, options);
  const activationGates = buildActivationGates(normalized, options);
  const controlledRendererTestScene = buildControlledRendererTestScene(normalized);

  const layerBase = deepFreeze({
    schemaId: atlasControlledRendererActivationLayerSchemaId,
    activationLayerId: `${normalized.layerId}_CONTROLLED_RENDERER_ACTIVATION`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    activationGates,
    controlledRendererTestScene,
    activationPolicy: deepFreeze({
      automaticActivationAllowed: false,
      productionRendererActivationAllowed: false,
      canvasAllowed: false,
      webglAllowed: false,
      runtimeLifecycleAttachmentAllowed: false,
      worldObjectDrawingAllowed: false
    }),
    ownershipRules: deepFreeze({
      lifecycleOwnerId: normalized.lifecycleOwnerId,
      ownershipConfirmed: activationGates.lifecycleOwnershipConfirmed,
      manualAuthorizationRequired: true,
      isolatedExecutionRequired: true,
      nonProductionOnly: true
    }),
    cleanupRequirements: deepFreeze({
      cleanupRequired: true,
      reversibleExecutionRequired: true,
      releaseTransientStateRequired: true,
      duplicateActivationRejected: true,
      rendererSurfaceCreationAllowed: false
    }),
    activationReadiness: null,
    validation: null
  });

  const activationReadiness = buildActivationReadiness(layerBase);
  const validation = buildControlledRendererActivationValidation(
    layerBase,
    normalized,
    activationReadiness
  );
  const layer = deepFreeze({
    ...layerBase,
    activationReadiness,
    validation
  });

  const checked = validateAtlasControlledRendererActivationLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasControlledRendererActivationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== atlasControlledRendererActivationLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_controlled_renderer_activation_layer_schema",
        `Expected ${atlasControlledRendererActivationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    validateActivationGates(rawLayer.activationGates);
    validateControlledRendererTestScene(rawLayer.controlledRendererTestScene);

    if (rawLayer.validation?.schemaId !== atlasControlledRendererActivationValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_controlled_renderer_activation_validation_schema",
        `Expected ${atlasControlledRendererActivationValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "allGatesPresent",
      "noAutomaticActivation",
      "ownershipRulesDefined",
      "cleanupRequirementsDefined",
      "deterministicPreparationState",
      "validationPassedOverall"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createValidationError(
          "atlas_controlled_renderer_activation_validation_failed",
          `Atlas controlled renderer activation validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawLayer)
    );
    if (expectedHash !== rawLayer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_controlled_renderer_activation_signature_mismatch",
        "Atlas controlled renderer activation deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasControlledRendererActivationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_controlled_renderer_activation_validation_failed",
      message: error.message,
      atlasControlledRendererActivationLayer: null
    });
  }
}

function normalizeControlledRendererActivationInput(rawInput, options) {
  if (rawInput?.schemaId === atlasControlledRendererActivationLayerSchemaId) {
    const validation = validateAtlasControlledRendererActivationLayer(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_existing_atlas_controlled_renderer_activation_layer",
        validation.message
      );
    }
    const layer = validation.atlasControlledRendererActivationLayer;
    return deepFreeze({
      layerId: layer.activationLayerId,
      packageId: layer.packageId,
      regionId: layer.regionId,
      renderCommands: structuredClone(layer.controlledRendererTestScene.sourceRenderCommands),
      connectionTestLayer: null,
      lifecycleOwnerId: options.lifecycleOwnerId ?? layer.ownershipRules.lifecycleOwnerId
    });
  }

  if (rawInput?.schemaId === "ATLAS_RENDERER_CONNECTION_TEST_LAYER_001") {
    const validation = validateAtlasRendererConnectionTestLayer(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_atlas_renderer_connection_test_layer",
        validation.message
      );
    }
    const adapterLayer = resolveAdapterLayer(options.adapterInput, options.adapterOptions);
    return deepFreeze({
      layerId: rawInput.testLayerId,
      packageId: rawInput.packageId,
      regionId: rawInput.regionId,
      renderCommands: structuredClone(adapterLayer.renderCommands),
      connectionTestLayer: structuredClone(rawInput),
      lifecycleOwnerId: normalizeLifecycleOwnerId(options.lifecycleOwnerId)
    });
  }

  if (rawInput?.schemaId === "ATLAS_RENDERER_ADAPTER_LAYER_001") {
    const adapterValidation = validateAtlasRendererAdapterLayer(rawInput);
    if (!adapterValidation.ok) {
      throw createValidationError(
        "invalid_atlas_renderer_adapter_layer",
        adapterValidation.message
      );
    }
    const connectionTestLayer = createAtlasRendererConnectionTestLayer(rawInput);
    return deepFreeze({
      layerId: rawInput.adapterId,
      packageId: rawInput.packageId,
      regionId: rawInput.regionId,
      renderCommands: structuredClone(rawInput.renderCommands),
      connectionTestLayer: structuredClone(connectionTestLayer),
      lifecycleOwnerId: normalizeLifecycleOwnerId(options.lifecycleOwnerId)
    });
  }

  if (rawInput?.schemaId === "ATLAS_RENDER_COMMANDS_001") {
    const connectionTestLayer = createAtlasRendererConnectionTestLayer(rawInput);
    return deepFreeze({
      layerId: "ATLAS_RENDER_COMMANDS_001_CONTROLLED_RENDERER_PREPARATION",
      packageId: "DIRECT_ATLAS_RENDER_COMMANDS_INPUT",
      regionId: "DIRECT_ATLAS_RENDER_COMMANDS_INPUT",
      renderCommands: structuredClone(rawInput),
      connectionTestLayer: structuredClone(connectionTestLayer),
      lifecycleOwnerId: normalizeLifecycleOwnerId(options.lifecycleOwnerId)
    });
  }

  const adapterLayer = createAtlasRendererAdapterLayer(rawInput, options.adapterOptions ?? {});
  const connectionTestLayer = createAtlasRendererConnectionTestLayer(adapterLayer);
  return deepFreeze({
    layerId: adapterLayer.adapterId,
    packageId: adapterLayer.packageId,
    regionId: adapterLayer.regionId,
    renderCommands: structuredClone(adapterLayer.renderCommands),
    connectionTestLayer: structuredClone(connectionTestLayer),
    lifecycleOwnerId: normalizeLifecycleOwnerId(options.lifecycleOwnerId)
  });
}

function resolveAdapterLayer(rawAdapterInput, adapterOptions) {
  if (!rawAdapterInput) {
    throw createValidationError(
      "missing_adapter_input",
      "Atlas controlled renderer activation requires adapterInput when seeded from a connection test layer."
    );
  }
  const adapterLayer = createAtlasRendererAdapterLayer(
    rawAdapterInput,
    adapterOptions ?? {}
  );
  const validation = validateAtlasRendererAdapterLayer(adapterLayer);
  if (!validation.ok) {
    throw createValidationError(
      "invalid_resolved_atlas_renderer_adapter_layer",
      validation.message
    );
  }
  return adapterLayer;
}

function buildActivationGates(normalized, options) {
  const authorizationToken = options.rendererAuthorization ?? null;
  const assetValidationOverride = options.assetValidationPassed;
  const commandValidationOverride = options.commandValidationPassed;

  return deepFreeze({
    rendererAuthorization: deepFreeze({
      present: typeof authorizationToken === "string" && authorizationToken.length > 0,
      granted: authorizationToken === "AUTHORIZED_CONTROLLED_RENDER_TEST",
      authorizationToken
    }),
    sceneValidationPassed:
      normalized.connectionTestLayer?.summary?.validationStatus === "PASS",
    assetValidationPassed:
      typeof assetValidationOverride === "boolean"
        ? assetValidationOverride
        : collectAssetReferences(normalized.renderCommands).every(
            (entry) => typeof entry === "string" && entry.length > 0
          ),
    commandValidationPassed:
      typeof commandValidationOverride === "boolean"
        ? commandValidationOverride
        : normalized.renderCommands.entries.every((sceneEntry) =>
            ["commands", "updateCommands", "cleanupCommands"].every((bucketName) =>
              Array.isArray(sceneEntry[bucketName]) && sceneEntry[bucketName].length > 0
            )
          ),
    lifecycleOwnershipConfirmed: normalizeLifecycleOwnerId(options.lifecycleOwnerId).length > 0
  });
}

function buildControlledRendererTestScene(normalized) {
  const selected = selectSingleTestCommand(normalized.renderCommands.entries);
  return deepFreeze({
    schemaId: controlledRendererTestSceneSchemaId,
    sceneId: "CONTROLLED_RENDERER_TEST_SCENE_001",
    objectCount: 1,
    syntheticTestObjectAllowed: true,
    nonProductionData: true,
    reversibleExecution: true,
    automaticActivationAllowed: false,
    selectedCommand: deepFreeze({
      commandType: selected.command.commandType,
      objectId: `SYNTHETIC_${selected.command.objectId}_TEST`,
      sourceObjectId: selected.command.objectId,
      objectType: selected.command.objectType,
      assetReference: selected.command.assetReference,
      renderLayer: selected.command.renderLayer,
      lod: selected.command.lod,
      materialReference: selected.command.materialReference,
      transform: structuredClone(selected.command.transform),
      sourceSceneId: selected.sceneId,
      sourceCommandBucket: selected.bucketName,
      sourceBucketIndex: selected.bucketIndex
    }),
    sourceRenderCommands: deepFreeze({
      schemaId: "ATLAS_RENDER_COMMANDS_001",
      entries: [structuredClone(selected.sceneEntry)]
    }),
    cleanupPlan: deepFreeze({
      cleanupRequired: true,
      removeSyntheticObjectOnly: true,
      restorePassiveStateOnly: true,
      rendererSurfaceCleanupRequired: false
    })
  });
}

function buildActivationReadiness(layerBase) {
  const gates = layerBase.activationGates;
  const readyForControlledTest =
    gates.rendererAuthorization.granted &&
    gates.sceneValidationPassed &&
    gates.assetValidationPassed &&
    gates.commandValidationPassed &&
    gates.lifecycleOwnershipConfirmed;

  return deepFreeze({
    status: readyForControlledTest ? "READY" : "BLOCKED",
    readyForControlledTest,
    manualTriggerRequired: true,
    rendererActivationExecuted: false,
    allowedExecutionMode: "CONTROLLED_SINGLE_OBJECT_TEST_ONLY"
  });
}

function buildControlledRendererActivationValidation(
  layerBase,
  normalized,
  activationReadiness
) {
  const allGatesPresent = Object.values(layerBase.activationGates).every((value) =>
    value !== null && value !== undefined
  );
  const noAutomaticActivation =
    layerBase.activationPolicy.automaticActivationAllowed === false &&
    activationReadiness.manualTriggerRequired === true &&
    activationReadiness.rendererActivationExecuted === false;
  const ownershipRulesDefined =
    typeof layerBase.ownershipRules.lifecycleOwnerId === "string" &&
    layerBase.ownershipRules.lifecycleOwnerId.length > 0 &&
    layerBase.ownershipRules.manualAuthorizationRequired === true &&
    layerBase.ownershipRules.isolatedExecutionRequired === true;
  const cleanupRequirementsDefined =
    layerBase.cleanupRequirements.cleanupRequired === true &&
    layerBase.cleanupRequirements.reversibleExecutionRequired === true &&
    layerBase.cleanupRequirements.releaseTransientStateRequired === true;

  const validationWithoutHash = deepFreeze({
    schemaId: atlasControlledRendererActivationValidationSchemaId,
    allGatesPresent,
    noAutomaticActivation,
    ownershipRulesDefined,
    cleanupRequirementsDefined,
    deterministicPreparationState: true,
    validationPassedOverall:
      allGatesPresent &&
      noAutomaticActivation &&
      ownershipRulesDefined &&
      cleanupRequirementsDefined &&
      normalized.connectionTestLayer?.validation?.validationPassedOverall === true,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      activationGates: layerBase.activationGates,
      controlledRendererTestScene: layerBase.controlledRendererTestScene,
      activationPolicy: layerBase.activationPolicy,
      ownershipRules: layerBase.ownershipRules,
      cleanupRequirements: layerBase.cleanupRequirements,
      activationReadiness,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash
  });
}

function selectSingleTestCommand(sceneEntries) {
  for (const sceneEntry of sceneEntries) {
    for (const bucketName of ["commands", "updateCommands"]) {
      const command = sceneEntry[bucketName]?.[0];
      if (command) {
        return {
          sceneId: sceneEntry.sceneId,
          sceneEntry,
          bucketName,
          bucketIndex: 0,
          command
        };
      }
    }
  }
  throw createValidationError(
    "missing_test_command_for_controlled_renderer_activation",
    "Controlled renderer activation preparation requires at least one command to seed the single-object test scene."
  );
}

function collectAssetReferences(renderCommands) {
  return renderCommands.entries.flatMap((sceneEntry) =>
    ["commands", "updateCommands", "cleanupCommands"].flatMap((bucketName) =>
      (sceneEntry[bucketName] ?? []).map((command) => command.assetReference)
    )
  );
}

function validateActivationGates(activationGates) {
  if (!activationGates || typeof activationGates !== "object") {
    throw createValidationError(
      "invalid_atlas_controlled_renderer_activation_gates",
      "Atlas controlled renderer activation layer must expose activation gates."
    );
  }

  if (typeof activationGates.rendererAuthorization?.present !== "boolean") {
    throw createValidationError(
      "invalid_atlas_controlled_renderer_activation_authorization_gate",
      "Renderer authorization gate must expose present/granted booleans."
    );
  }
  if (typeof activationGates.rendererAuthorization?.granted !== "boolean") {
    throw createValidationError(
      "invalid_atlas_controlled_renderer_activation_authorization_gate",
      "Renderer authorization gate must expose present/granted booleans."
    );
  }

  for (const key of [
    "sceneValidationPassed",
    "assetValidationPassed",
    "commandValidationPassed",
    "lifecycleOwnershipConfirmed"
  ]) {
    if (typeof activationGates[key] !== "boolean") {
      throw createValidationError(
        "invalid_atlas_controlled_renderer_activation_gate",
        `Activation gate ${key} must be boolean.`
      );
    }
  }
}

function validateControlledRendererTestScene(testScene) {
  if (testScene?.schemaId !== controlledRendererTestSceneSchemaId) {
    throw createValidationError(
      "invalid_controlled_renderer_test_scene_schema",
      `Expected ${controlledRendererTestSceneSchemaId} but received ${testScene?.schemaId}.`
    );
  }
  if (testScene.objectCount !== 1) {
    throw createValidationError(
      "invalid_controlled_renderer_test_scene_object_count",
      "Controlled renderer test scene must contain exactly one object."
    );
  }
  if (testScene.syntheticTestObjectAllowed !== true) {
    throw createValidationError(
      "invalid_controlled_renderer_test_scene_synthetic_rule",
      "Controlled renderer test scene must explicitly allow a synthetic test object."
    );
  }
  if (testScene.nonProductionData !== true || testScene.reversibleExecution !== true) {
    throw createValidationError(
      "invalid_controlled_renderer_test_scene_safety_flags",
      "Controlled renderer test scene must remain non-production and reversible."
    );
  }
}

function normalizeLifecycleOwnerId(lifecycleOwnerId) {
  if (typeof lifecycleOwnerId === "string" && lifecycleOwnerId.trim().length > 0) {
    return lifecycleOwnerId.trim();
  }
  return "ATLAS_CONTROLLED_RENDERER_PREPARATION_OWNER";
}

function buildValidationSignatureSource(layer) {
  return {
    activationGates: {
      rendererAuthorization: {
        present: layer.activationGates.rendererAuthorization.present,
        granted: layer.activationGates.rendererAuthorization.granted,
        authorizationToken: layer.activationGates.rendererAuthorization.authorizationToken
      },
      sceneValidationPassed: layer.activationGates.sceneValidationPassed,
      assetValidationPassed: layer.activationGates.assetValidationPassed,
      commandValidationPassed: layer.activationGates.commandValidationPassed,
      lifecycleOwnershipConfirmed: layer.activationGates.lifecycleOwnershipConfirmed
    },
    controlledRendererTestScene: {
      sceneId: layer.controlledRendererTestScene.sceneId,
      objectCount: layer.controlledRendererTestScene.objectCount,
      syntheticTestObjectAllowed:
        layer.controlledRendererTestScene.syntheticTestObjectAllowed,
      nonProductionData: layer.controlledRendererTestScene.nonProductionData,
      reversibleExecution: layer.controlledRendererTestScene.reversibleExecution,
      selectedCommand: layer.controlledRendererTestScene.selectedCommand,
      cleanupPlan: layer.controlledRendererTestScene.cleanupPlan
    },
    activationPolicy: layer.activationPolicy,
    ownershipRules: layer.ownershipRules,
    cleanupRequirements: layer.cleanupRequirements,
    activationReadiness: layer.activationReadiness,
    validation: layer.validation
      ? {
          allGatesPresent: layer.validation.allGatesPresent,
          noAutomaticActivation: layer.validation.noAutomaticActivation,
          ownershipRulesDefined: layer.validation.ownershipRulesDefined,
          cleanupRequirementsDefined: layer.validation.cleanupRequirementsDefined,
          deterministicPreparationState:
            layer.validation.deterministicPreparationState,
          validationPassedOverall: layer.validation.validationPassedOverall
        }
      : null
  };
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function computeDeterministicSignatureHash(value) {
  const stable = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < stable.length; index += 1) {
    hash ^= stable.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
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
