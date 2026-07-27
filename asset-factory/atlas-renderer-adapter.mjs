import {
  createAtlasRendererHandoffLayer,
  validateAtlasRendererHandoffLayer
} from "./atlas-renderer-handoff.mjs";
import {
  createAtlasRuntimeSceneValidationLayer,
  validateAtlasRuntimeSceneValidationLayer
} from "./atlas-runtime-scene-validation.mjs";

export const atlasRendererAdapterLayerSchemaId =
  "ATLAS_RENDERER_ADAPTER_LAYER_001";
export const atlasRenderCommandsSchemaId =
  "ATLAS_RENDER_COMMANDS_001";
export const atlasRendererAdapterValidationSchemaId =
  "ATLAS_RENDERER_ADAPTER_VALIDATION_001";

export const atlasRendererAdapterCommandTypes = deepFreeze([
  "CREATE_OBJECT_COMMAND",
  "UPDATE_OBJECT_COMMAND",
  "REMOVE_OBJECT_COMMAND"
]);

export function createAtlasRendererAdapterLayer(rawInput, options = {}) {
  const normalized = normalizeAdapterInput(rawInput, options);
  const commandEntries = buildRenderCommandEntries(normalized.renderInstructions.entries);

  const layerBase = deepFreeze({
    schemaId: atlasRendererAdapterLayerSchemaId,
    adapterId: `${normalized.layerId}_RENDERER_ADAPTER`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    renderCommands: deepFreeze({
      schemaId: atlasRenderCommandsSchemaId,
      entries: commandEntries
    }),
    validation: null
  });

  const validation = buildAdapterValidation(layerBase, normalized);
  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateAtlasRendererAdapterLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasRendererAdapterLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== atlasRendererAdapterLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_renderer_adapter_layer_schema",
        `Expected ${atlasRendererAdapterLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.renderCommands?.schemaId !== atlasRenderCommandsSchemaId) {
      throw createValidationError(
        "invalid_atlas_render_commands_schema",
        `Expected ${atlasRenderCommandsSchemaId} but received ${rawLayer.renderCommands?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.renderCommands.entries) || rawLayer.renderCommands.entries.length === 0) {
      throw createValidationError(
        "invalid_atlas_render_command_entries",
        "Atlas renderer adapter layer must expose a non-empty render command entry list."
      );
    }

    if (rawLayer.validation?.schemaId !== atlasRendererAdapterValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_renderer_adapter_validation_schema",
        `Expected ${atlasRendererAdapterValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const sceneEntry of rawLayer.renderCommands.entries) {
      assertPresent(sceneEntry.sceneId, "Render command sceneId is required.");
      assertPresent(sceneEntry.sceneType, "Render command sceneType is required.");
      if (!Array.isArray(sceneEntry.commands) || sceneEntry.commands.length === 0) {
        throw createValidationError(
          "invalid_atlas_render_commands_for_scene",
          `Renderer adapter scene ${sceneEntry.sceneId} must expose commands.`
        );
      }
      if (!Array.isArray(sceneEntry.cleanupCommands)) {
        throw createValidationError(
          "invalid_atlas_render_cleanup_commands",
          `Renderer adapter scene ${sceneEntry.sceneId} must expose cleanupCommands.`
        );
      }
      for (const command of [...sceneEntry.commands, ...sceneEntry.cleanupCommands]) {
        validateCommand(command);
      }
    }

    for (const key of [
      "inputCameFromAtlas",
      "validationPassed",
      "assetReferencesExist",
      "transformsUnchanged",
      "deterministicConversion",
      "geometryPreserved",
      "commandCompleteness",
      "cleanupSupport",
      "validationPassedOverall"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createValidationError(
          "atlas_renderer_adapter_validation_failed",
          `Atlas renderer adapter validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawLayer)
    );
    if (expectedHash !== rawLayer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_renderer_adapter_signature_mismatch",
        "Atlas renderer adapter deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasRendererAdapterLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_renderer_adapter_validation_failed",
      message: error.message,
      atlasRendererAdapterLayer: null
    });
  }
}

function normalizeAdapterInput(rawInput, options) {
  if (rawInput?.schemaId === "ATLAS_RUNTIME_SCENE_VALIDATION_LAYER_001") {
    const runtimeValidation = validateAtlasRuntimeSceneValidationLayer(rawInput);
    if (!runtimeValidation.ok) {
      throw createValidationError(
        "invalid_atlas_runtime_scene_validation_layer",
        runtimeValidation.message
      );
    }
    const validationLayer = runtimeValidation.atlasRuntimeSceneValidationLayer;
    if (validationLayer.summary.readyForRendererConnection !== true) {
      throw createValidationError(
        "atlas_runtime_scene_not_ready_for_renderer",
        "Atlas runtime scene validation must report readyForRendererConnection before adapter conversion."
      );
    }

    const handoff = createAtlasRendererHandoffLayer(
      options.handoffSource,
      options.handoffOptions ?? {}
    );
    return deepFreeze({
      layerId: handoff.layerId,
      packageId: handoff.packageId,
      regionId: handoff.regionId,
      renderInstructions: structuredClone(handoff.renderInstructions),
      sourceValidationPassed: true
    });
  }

  if (rawInput?.schemaId === "ATLAS_RENDERER_HANDOFF_LAYER_001") {
    const handoffValidation = validateAtlasRendererHandoffLayer(rawInput);
    if (!handoffValidation.ok) {
      throw createValidationError(
        "invalid_atlas_renderer_handoff_layer",
        handoffValidation.message
      );
    }
    const layer = handoffValidation.atlasRendererHandoffLayer;
    return deepFreeze({
      layerId: layer.layerId,
      packageId: layer.packageId,
      regionId: layer.regionId,
      renderInstructions: structuredClone(layer.renderInstructions),
      sourceValidationPassed: layer.validation.validationPassed === true
    });
  }

  if (rawInput?.schemaId === "ATLAS_RENDER_INSTRUCTIONS_001") {
    validateDirectRenderInstructions(rawInput);
    return deepFreeze({
      layerId: "ATLAS_RENDER_INSTRUCTIONS_001_DIRECT_INPUT",
      packageId: "DIRECT_ATLAS_RENDER_INSTRUCTIONS_INPUT",
      regionId: "DIRECT_ATLAS_RENDER_INSTRUCTIONS_INPUT",
      renderInstructions: structuredClone(rawInput),
      sourceValidationPassed: true
    });
  }

  const handoff = createAtlasRendererHandoffLayer(rawInput, options.handoffOptions ?? {});
  return deepFreeze({
    layerId: handoff.layerId,
    packageId: handoff.packageId,
    regionId: handoff.regionId,
    renderInstructions: structuredClone(handoff.renderInstructions),
    sourceValidationPassed: handoff.validation.validationPassed === true
  });
}

function validateDirectRenderInstructions(rawInstructions) {
  if (!Array.isArray(rawInstructions.entries) || rawInstructions.entries.length === 0) {
    throw createValidationError(
      "invalid_direct_atlas_render_instructions",
      "Direct Atlas render instructions must expose entries."
    );
  }
  for (const sceneEntry of rawInstructions.entries) {
    if (!Array.isArray(sceneEntry.instructions) || sceneEntry.instructions.length === 0) {
      throw createValidationError(
        "invalid_direct_atlas_render_instruction_scene",
        `Direct render instruction scene ${sceneEntry.sceneId ?? "UNKNOWN"} must expose instructions.`
      );
    }
    for (const instruction of sceneEntry.instructions) {
      assertPresent(instruction.objectId, "Direct render instruction objectId is required.");
      assertPresent(instruction.assetReference, "Direct render instruction assetReference is required.");
      assertPresent(instruction.transformReference, "Direct render instruction transformReference is required.");
      assertPresent(instruction.geometryReference, "Direct render instruction geometryReference is required.");
      assertPresent(instruction.renderLayer, "Direct render instruction renderLayer is required.");
      assertPresent(instruction.lodLevel, "Direct render instruction lodLevel is required.");
      assertPresent(instruction.materialReference, "Direct render instruction materialReference is required.");
    }
  }
}

function buildRenderCommandEntries(sceneEntries) {
  return deepFreeze(sceneEntries.map((scene) => buildRenderCommandScene(scene)).sort(compareBy("sceneId")));
}

function buildRenderCommandScene(scene) {
  const createCommands = scene.instructions
    .map((instruction) => buildCommand("CREATE_OBJECT_COMMAND", instruction))
    .sort(compareCommands);
  const updateCommands = scene.instructions
    .map((instruction) => buildCommand("UPDATE_OBJECT_COMMAND", instruction))
    .sort(compareCommands);
  const cleanupCommands = scene.instructions
    .map((instruction) => buildCommand("REMOVE_OBJECT_COMMAND", instruction))
    .sort(compareCommands);

  return deepFreeze({
    sceneId: scene.sceneId,
    sceneType: scene.sceneType,
    commands: deepFreeze(createCommands),
    updateCommands: deepFreeze(updateCommands),
    cleanupCommands: deepFreeze(cleanupCommands),
    commandMetadata: deepFreeze({
      supportedCommandTypes: atlasRendererAdapterCommandTypes,
      commandCount: createCommands.length,
      cleanupSupported: true
    })
  });
}

function buildCommand(commandType, instruction) {
  return deepFreeze({
    commandType,
    objectId: instruction.objectId,
    objectType: instruction.objectType,
    assetReference: instruction.assetReference,
    transform: structuredClone(instruction.transformReference),
    geometryReference: structuredClone(instruction.geometryReference),
    renderLayer: instruction.renderLayer,
    lod: instruction.lodLevel,
    materialReference: instruction.materialReference,
    layerOrdering: instruction.layerOrdering,
    sceneId: instruction.sceneId
  });
}

function buildAdapterValidation(layerBase, normalized) {
  const createCommands = layerBase.renderCommands.entries.flatMap((entry) => entry.commands);
  const cleanupCommands = layerBase.renderCommands.entries.flatMap((entry) => entry.cleanupCommands);
  const allCommands = [...createCommands, ...cleanupCommands];
  const instructionMap = new Map();
  for (const sceneEntry of normalized.renderInstructions.entries) {
    for (const instruction of sceneEntry.instructions) {
      instructionMap.set(
        buildInstructionLookupKey(
          sceneEntry.sceneId,
          instruction.objectId,
          instruction.assetReference,
          instruction.renderLayer,
          instruction.transformReference?.transformId
        ),
        instruction
      );
    }
  }

  const validationWithoutHash = deepFreeze({
    schemaId: atlasRendererAdapterValidationSchemaId,
    inputCameFromAtlas: true,
    validationPassed: normalized.sourceValidationPassed === true,
    assetReferencesExist: allCommands.every(
      (command) => typeof command.assetReference === "string" && command.assetReference.length > 0
    ),
    transformsUnchanged: allCommands.every((command) => {
      const instruction = instructionMap.get(
        buildInstructionLookupKey(
          command.sceneId,
          command.objectId,
          command.assetReference,
          command.renderLayer,
          command.transform?.transformId
        )
      );
      return stableStringify(command.transform) === stableStringify(instruction?.transformReference);
    }),
    deterministicConversion: true,
    geometryPreserved: allCommands.every((command) => {
      const instruction = instructionMap.get(
        buildInstructionLookupKey(
          command.sceneId,
          command.objectId,
          command.assetReference,
          command.renderLayer,
          command.transform?.transformId
        )
      );
      return stableStringify(command.geometryReference) === stableStringify(instruction?.geometryReference);
    }),
    commandCompleteness: allCommands.every((command) => isCompleteCommand(command)),
    cleanupSupport: layerBase.renderCommands.entries.every(
      (entry) =>
        Array.isArray(entry.cleanupCommands) &&
        entry.cleanupCommands.length === entry.commands.length &&
        entry.commandMetadata.cleanupSupported === true
    ),
    validationPassedOverall: true,
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      renderCommands: layerBase.renderCommands,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    validationPassedOverall:
      validationWithoutHash.inputCameFromAtlas &&
      validationWithoutHash.validationPassed &&
      validationWithoutHash.assetReferencesExist &&
      validationWithoutHash.transformsUnchanged &&
      validationWithoutHash.deterministicConversion &&
      validationWithoutHash.geometryPreserved &&
      validationWithoutHash.commandCompleteness &&
      validationWithoutHash.cleanupSupport,
    deterministicSignatureHash
  });
}

function buildInstructionLookupKey(sceneId, objectId, assetReference, renderLayer, transformId) {
  return [
    sceneId,
    objectId,
    assetReference,
    renderLayer,
    transformId ?? "NO_TRANSFORM_ID"
  ].join("::");
}

function isCompleteCommand(command) {
  return (
    typeof command.commandType === "string" &&
    atlasRendererAdapterCommandTypes.includes(command.commandType) &&
    typeof command.objectId === "string" &&
    command.objectId.length > 0 &&
    typeof command.assetReference === "string" &&
    command.assetReference.length > 0 &&
    command.transform &&
    typeof command.renderLayer === "string" &&
    command.renderLayer.length > 0 &&
    typeof command.lod === "string" &&
    command.lod.length > 0 &&
    typeof command.materialReference === "string" &&
    command.materialReference.length > 0
  );
}

function validateCommand(command) {
  if (!isCompleteCommand(command)) {
    throw createValidationError(
      "invalid_atlas_renderer_adapter_command",
      `Renderer adapter command for object ${command?.objectId ?? "UNKNOWN"} is incomplete.`
    );
  }
}

function buildValidationSignatureSource(layer) {
  return {
    entries: layer.renderCommands.entries.map((scene) => ({
      sceneId: scene.sceneId,
      sceneType: scene.sceneType,
      commands: scene.commands.map((command) => ({
        commandType: command.commandType,
        objectId: command.objectId,
        assetReference: command.assetReference,
        renderLayer: command.renderLayer,
        lod: command.lod,
        materialReference: command.materialReference,
        transform: command.transform
      })),
      cleanupCommands: scene.cleanupCommands.map((command) => ({
        commandType: command.commandType,
        objectId: command.objectId,
        assetReference: command.assetReference
      })),
      commandMetadata: scene.commandMetadata
    })),
    validation: layer.validation
      ? {
          inputCameFromAtlas: layer.validation.inputCameFromAtlas,
          validationPassed: layer.validation.validationPassed,
          assetReferencesExist: layer.validation.assetReferencesExist,
          transformsUnchanged: layer.validation.transformsUnchanged,
          deterministicConversion: layer.validation.deterministicConversion,
          geometryPreserved: layer.validation.geometryPreserved,
          commandCompleteness: layer.validation.commandCompleteness,
          cleanupSupport: layer.validation.cleanupSupport,
          validationPassedOverall: layer.validation.validationPassedOverall
        }
      : null
  };
}

function compareCommands(left, right) {
  const typeCompare = String(left.commandType).localeCompare(String(right.commandType));
  if (typeCompare !== 0) {
    return typeCompare;
  }
  const objectCompare = String(left.objectId).localeCompare(String(right.objectId));
  if (objectCompare !== 0) {
    return objectCompare;
  }
  return String(left.assetReference).localeCompare(String(right.assetReference));
}

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function assertPresent(value, message) {
  if (value === null || value === undefined) {
    throw createValidationError("missing_required_value", message);
  }
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
