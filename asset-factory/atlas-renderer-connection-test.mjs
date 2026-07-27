import {
  createAtlasRendererAdapterLayer,
  validateAtlasRendererAdapterLayer
} from "./atlas-renderer-adapter.mjs";

export const atlasRendererConnectionTestLayerSchemaId =
  "ATLAS_RENDERER_CONNECTION_TEST_LAYER_001";
export const atlasRendererConnectionTestResultSchemaId =
  "ATLAS_RENDERER_CONNECTION_TEST_RESULT_001";
export const atlasRendererConnectionTestValidationSchemaId =
  "ATLAS_RENDERER_CONNECTION_TEST_VALIDATION_001";

const commandBucketConfig = deepFreeze([
  ["commands", "CREATE_OBJECT_COMMAND"],
  ["updateCommands", "UPDATE_OBJECT_COMMAND"],
  ["cleanupCommands", "REMOVE_OBJECT_COMMAND"]
]);

export function createAtlasRendererConnectionTestLayer(rawInput, options = {}) {
  const normalized = normalizeConnectionTestInput(rawInput, options);
  const connectionTestResults = buildConnectionTestResults(normalized.renderCommands.entries);

  const layerBase = deepFreeze({
    schemaId: atlasRendererConnectionTestLayerSchemaId,
    testLayerId: `${normalized.layerId}_CONNECTION_TEST`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    connectionTestResults,
    summary: null,
    validation: null
  });

  const summary = buildConnectionTestSummary(connectionTestResults);
  const validation = buildConnectionTestValidation(layerBase, normalized, summary);
  const layer = deepFreeze({
    ...layerBase,
    summary,
    validation
  });

  const checked = validateAtlasRendererConnectionTestLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasRendererConnectionTestLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== atlasRendererConnectionTestLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_renderer_connection_test_layer_schema",
        `Expected ${atlasRendererConnectionTestLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.connectionTestResults) || rawLayer.connectionTestResults.length === 0) {
      throw createValidationError(
        "invalid_atlas_renderer_connection_test_results",
        "Atlas renderer connection test layer must expose non-empty connectionTestResults."
      );
    }

    for (const result of rawLayer.connectionTestResults) {
      validateConnectionTestResult(result);
    }

    if (!rawLayer.summary || typeof rawLayer.summary !== "object") {
      throw createValidationError(
        "invalid_atlas_renderer_connection_test_summary",
        "Atlas renderer connection test layer must expose a summary object."
      );
    }

    assertPresent(rawLayer.summary.totalCommandCount, "Connection test summary totalCommandCount is required.");
    if (!Array.isArray(rawLayer.summary.sceneTypes) || rawLayer.summary.sceneTypes.length === 0) {
      throw createValidationError(
        "invalid_atlas_renderer_connection_test_summary_scene_types",
        "Connection test summary sceneTypes must be a non-empty array."
      );
    }

    if (rawLayer.validation?.schemaId !== atlasRendererConnectionTestValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_renderer_connection_test_validation_schema",
        `Expected ${atlasRendererConnectionTestValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "commandsAccepted",
      "orderPreserved",
      "transformsUnchanged",
      "assetReferencesValid",
      "deterministicResult",
      "validationPassedOverall"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createValidationError(
          "atlas_renderer_connection_test_validation_failed",
          `Atlas renderer connection test validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawLayer)
    );
    if (expectedHash !== rawLayer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_renderer_connection_test_signature_mismatch",
        "Atlas renderer connection test deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasRendererConnectionTestLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_renderer_connection_test_validation_failed",
      message: error.message,
      atlasRendererConnectionTestLayer: null
    });
  }
}

function normalizeConnectionTestInput(rawInput, options) {
  if (rawInput?.schemaId === "ATLAS_RENDERER_ADAPTER_LAYER_001") {
    const validation = validateAtlasRendererAdapterLayer(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_atlas_renderer_adapter_layer",
        validation.message
      );
    }
    const layer = validation.atlasRendererAdapterLayer;
    return deepFreeze({
      layerId: layer.adapterId,
      packageId: layer.packageId,
      regionId: layer.regionId,
      renderCommands: structuredClone(layer.renderCommands)
    });
  }

  if (rawInput?.schemaId === "ATLAS_RENDER_COMMANDS_001") {
    validateDirectRenderCommands(rawInput);
    return deepFreeze({
      layerId: "ATLAS_RENDER_COMMANDS_001_DIRECT_INPUT",
      packageId: "DIRECT_ATLAS_RENDER_COMMANDS_INPUT",
      regionId: "DIRECT_ATLAS_RENDER_COMMANDS_INPUT",
      renderCommands: structuredClone(rawInput)
    });
  }

  const adapterLayer = createAtlasRendererAdapterLayer(rawInput, options.adapterOptions ?? {});
  return deepFreeze({
    layerId: adapterLayer.adapterId,
    packageId: adapterLayer.packageId,
    regionId: adapterLayer.regionId,
    renderCommands: structuredClone(adapterLayer.renderCommands)
  });
}

function validateDirectRenderCommands(rawRenderCommands) {
  if (!Array.isArray(rawRenderCommands.entries) || rawRenderCommands.entries.length === 0) {
    throw createValidationError(
      "invalid_atlas_render_commands_direct_input",
      "Direct Atlas render commands input must expose entries."
    );
  }
  for (const sceneEntry of rawRenderCommands.entries) {
    assertPresent(sceneEntry.sceneId, "Direct Atlas render command sceneId is required.");
    assertPresent(sceneEntry.sceneType, "Direct Atlas render command sceneType is required.");
    for (const [bucketName] of commandBucketConfig) {
      if (!Array.isArray(sceneEntry[bucketName])) {
        throw createValidationError(
          "invalid_atlas_render_command_bucket",
          `Direct Atlas render command scene ${sceneEntry.sceneId} must expose ${bucketName}.`
        );
      }
      for (const command of sceneEntry[bucketName]) {
        validateSourceCommand(command, bucketName);
      }
    }
  }
}

function buildConnectionTestResults(sceneEntries) {
  return deepFreeze(
    sceneEntries
      .map((sceneEntry) => buildConnectionTestResult(sceneEntry))
      .sort(compareBy("sceneId"))
  );
}

function buildConnectionTestResult(sceneEntry) {
  const commandFlow = buildCommandFlow(sceneEntry);
  const commandTypeSummary = buildCommandTypeSummary(commandFlow);
  const layerSummary = buildLayerSummary(commandFlow);
  const assetReferences = uniqueSorted(commandFlow.map((entry) => entry.assetReference));

  return deepFreeze({
    schemaId: atlasRendererConnectionTestResultSchemaId,
    sceneId: sceneEntry.sceneId,
    sceneType: sceneEntry.sceneType,
    commandCount: commandFlow.length,
    commandTypes: deepFreeze(Object.keys(commandTypeSummary).sort()),
    commandTypeSummary,
    assetReferences: deepFreeze(assetReferences),
    layerSummary,
    validationStatus:
      commandFlow.length > 0 &&
      assetReferences.length > 0
        ? "PASS"
        : "WARN",
    commandFlow
  });
}

function buildCommandFlow(sceneEntry) {
  const flow = [];
  for (const [bucketName] of commandBucketConfig) {
    const commands = sceneEntry[bucketName] ?? [];
    for (let index = 0; index < commands.length; index += 1) {
      const command = commands[index];
      flow.push(
        deepFreeze({
          sequence: flow.length,
          bucket: bucketName,
          bucketIndex: index,
          commandType: command.commandType,
          objectId: command.objectId,
          objectType: command.objectType,
          assetReference: command.assetReference,
          renderLayer: command.renderLayer,
          lod: command.lod,
          materialReference: command.materialReference,
          transform: structuredClone(command.transform),
          transformSignature: stableStringify(command.transform)
        })
      );
    }
  }
  return deepFreeze(flow);
}

function buildCommandTypeSummary(commandFlow) {
  const summary = {
    CREATE_OBJECT_COMMAND: 0,
    UPDATE_OBJECT_COMMAND: 0,
    REMOVE_OBJECT_COMMAND: 0
  };
  for (const entry of commandFlow) {
    summary[entry.commandType] = (summary[entry.commandType] ?? 0) + 1;
  }
  return deepFreeze(summary);
}

function buildLayerSummary(commandFlow) {
  const summary = {};
  for (const entry of commandFlow) {
    summary[entry.renderLayer] = (summary[entry.renderLayer] ?? 0) + 1;
  }
  return deepFreeze(sortObject(summary));
}

function buildConnectionTestSummary(connectionTestResults) {
  const totalCommandCount = connectionTestResults.reduce(
    (sum, result) => sum + result.commandCount,
    0
  );
  const sceneTypes = uniqueSorted(connectionTestResults.map((result) => result.sceneType));
  const commandTypes = uniqueSorted(
    connectionTestResults.flatMap((result) => result.commandTypes)
  );
  const assetReferences = uniqueSorted(
    connectionTestResults.flatMap((result) => result.assetReferences)
  );

  return deepFreeze({
    totalCommandCount,
    sceneTypes: deepFreeze(sceneTypes),
    commandTypes: deepFreeze(commandTypes),
    assetReferenceCount: assetReferences.length,
    validationStatus: connectionTestResults.every((result) => result.validationStatus === "PASS")
      ? "PASS"
      : "WARN"
  });
}

function buildConnectionTestValidation(layerBase, normalized, summary) {
  const sourceScenes = new Map(
    normalized.renderCommands.entries.map((entry) => [entry.sceneId, entry])
  );
  const commandsAccepted = normalized.renderCommands.entries.every((entry) =>
    commandBucketConfig.every(([bucketName]) => Array.isArray(entry[bucketName]))
  );
  const orderPreserved = layerBase.connectionTestResults.every((result) => {
    const sourceScene = sourceScenes.get(result.sceneId);
    return compareFlowToSource(result.commandFlow, sourceScene);
  });
  const transformsUnchanged = layerBase.connectionTestResults.every((result) => {
    const sourceScene = sourceScenes.get(result.sceneId);
    return compareTransformsToSource(result.commandFlow, sourceScene);
  });
  const assetReferencesValid = layerBase.connectionTestResults.every((result) =>
    result.commandFlow.every(
      (entry) => typeof entry.assetReference === "string" && entry.assetReference.length > 0
    )
  );

  const validationWithoutHash = deepFreeze({
    schemaId: atlasRendererConnectionTestValidationSchemaId,
    commandsAccepted,
    orderPreserved,
    transformsUnchanged,
    assetReferencesValid,
    deterministicResult: true,
    validationPassedOverall:
      commandsAccepted &&
      orderPreserved &&
      transformsUnchanged &&
      assetReferencesValid &&
      summary.validationStatus === "PASS",
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      connectionTestResults: layerBase.connectionTestResults,
      summary,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash
  });
}

function compareFlowToSource(commandFlow, sourceScene) {
  if (!sourceScene) {
    return false;
  }

  const expectedFlow = buildExpectedSourceFlow(sourceScene);
  if (commandFlow.length !== expectedFlow.length) {
    return false;
  }

  return commandFlow.every((entry, index) => {
    const expected = expectedFlow[index];
    return (
      entry.bucket === expected.bucket &&
      entry.bucketIndex === expected.bucketIndex &&
      entry.commandType === expected.commandType &&
      entry.objectId === expected.objectId &&
      entry.assetReference === expected.assetReference &&
      entry.renderLayer === expected.renderLayer
    );
  });
}

function compareTransformsToSource(commandFlow, sourceScene) {
  if (!sourceScene) {
    return false;
  }

  const expectedFlow = buildExpectedSourceFlow(sourceScene);
  if (commandFlow.length !== expectedFlow.length) {
    return false;
  }

  return commandFlow.every(
    (entry, index) =>
      entry.transformSignature === stableStringify(expectedFlow[index].transform)
  );
}

function buildExpectedSourceFlow(sourceScene) {
  const flow = [];
  for (const [bucketName] of commandBucketConfig) {
    const commands = sourceScene[bucketName] ?? [];
    for (let index = 0; index < commands.length; index += 1) {
      const command = commands[index];
      flow.push({
        bucket: bucketName,
        bucketIndex: index,
        commandType: command.commandType,
        objectId: command.objectId,
        assetReference: command.assetReference,
        renderLayer: command.renderLayer,
        transform: command.transform
      });
    }
  }
  return flow;
}

function validateConnectionTestResult(result) {
  if (result.schemaId !== atlasRendererConnectionTestResultSchemaId) {
    throw createValidationError(
      "invalid_atlas_renderer_connection_test_result_schema",
      `Expected ${atlasRendererConnectionTestResultSchemaId} but received ${result.schemaId}.`
    );
  }

  assertPresent(result.sceneId, "Connection test result sceneId is required.");
  assertPresent(result.sceneType, "Connection test result sceneType is required.");
  assertPresent(result.commandCount, "Connection test result commandCount is required.");
  assertPresent(result.validationStatus, "Connection test result validationStatus is required.");

  if (!Array.isArray(result.commandFlow) || result.commandFlow.length === 0) {
    throw createValidationError(
      "invalid_atlas_renderer_connection_test_command_flow",
      `Connection test result ${result.sceneId} must expose commandFlow.`
    );
  }

  if (!Array.isArray(result.assetReferences) || result.assetReferences.length === 0) {
    throw createValidationError(
      "invalid_atlas_renderer_connection_test_asset_references",
      `Connection test result ${result.sceneId} must expose assetReferences.`
    );
  }
}

function validateSourceCommand(command, bucketName) {
  if (!command || typeof command !== "object") {
    throw createValidationError(
      "invalid_atlas_render_source_command",
      `Atlas render source command in ${bucketName} must be an object.`
    );
  }
  for (const key of [
    "commandType",
    "objectId",
    "assetReference",
    "transform",
    "renderLayer",
    "lod",
    "materialReference"
  ]) {
    assertPresent(command[key], `Atlas render source command ${key} is required.`);
  }
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined))]
    .sort((left, right) => String(left).localeCompare(String(right)));
}

function sortObject(value) {
  return Object.fromEntries(
    Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
  );
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

function buildValidationSignatureSource(layer) {
  return {
    connectionTestResults: layer.connectionTestResults.map((result) => ({
      sceneId: result.sceneId,
      sceneType: result.sceneType,
      commandCount: result.commandCount,
      commandTypes: result.commandTypes,
      assetReferences: result.assetReferences,
      layerSummary: result.layerSummary,
      validationStatus: result.validationStatus,
      commandFlow: result.commandFlow.map((entry) => ({
        sequence: entry.sequence,
        bucket: entry.bucket,
        bucketIndex: entry.bucketIndex,
        commandType: entry.commandType,
        objectId: entry.objectId,
        assetReference: entry.assetReference,
        renderLayer: entry.renderLayer,
        lod: entry.lod,
        materialReference: entry.materialReference,
        transformSignature: entry.transformSignature
      }))
    })),
    summary: layer.summary,
    validation: layer.validation
      ? {
          commandsAccepted: layer.validation.commandsAccepted,
          orderPreserved: layer.validation.orderPreserved,
          transformsUnchanged: layer.validation.transformsUnchanged,
          assetReferencesValid: layer.validation.assetReferencesValid,
          deterministicResult: layer.validation.deterministicResult,
          validationPassedOverall: layer.validation.validationPassedOverall
        }
      : null
  };
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
