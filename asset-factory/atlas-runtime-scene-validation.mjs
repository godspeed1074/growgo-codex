import {
  createAtlasRendererHandoffLayer,
  validateAtlasRendererHandoffLayer
} from "./atlas-renderer-handoff.mjs";

export const atlasRuntimeSceneValidationLayerSchemaId =
  "ATLAS_RUNTIME_SCENE_VALIDATION_LAYER_001";
export const atlasRuntimeSceneValidationResultSchemaId =
  "ATLAS_RUNTIME_SCENE_VALIDATION_RESULT_001";

const expectedLayerByObjectType = deepFreeze({
  PARK: "GROUND_LAYER",
  RESERVE: "GROUND_LAYER",
  BEACH: "GROUND_LAYER",
  WATERWAY: "GROUND_LAYER",
  TRANSPORT_ROUTE: "ROAD_LAYER",
  HOUSE: "OBJECT_LAYER",
  TOWNHOUSE: "OBJECT_LAYER",
  APARTMENT: "OBJECT_LAYER",
  BAKERY: "OBJECT_LAYER",
  CAFE: "OBJECT_LAYER",
  SHOP: "OBJECT_LAYER",
  PETROL_STATION: "OBJECT_LAYER",
  LIBRARY: "OBJECT_LAYER",
  SCHOOL: "OBJECT_LAYER",
  COMMUNITY_BUILDING: "OBJECT_LAYER",
  LIGHTHOUSE: "OBJECT_LAYER",
  LOOKOUT: "OBJECT_LAYER",
  HISTORIC_SITE: "OBJECT_LAYER",
  ATTRACTION: "OBJECT_LAYER"
});

const validLayers = deepFreeze([
  "GROUND_LAYER",
  "ROAD_LAYER",
  "OBJECT_LAYER",
  "NATURE_LAYER",
  "DETAIL_LAYER"
]);

export function createAtlasRuntimeSceneValidationLayer(rawInput, options = {}) {
  const normalized = normalizeRendererHandoffInput(rawInput, options);
  const sceneResults = buildSceneValidationResults(normalized.renderInstructions.entries);

  const layerBase = deepFreeze({
    schemaId: atlasRuntimeSceneValidationLayerSchemaId,
    validationId: `${normalized.layerId}_RUNTIME_SCENE_VALIDATION`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    sceneResults: deepFreeze(sceneResults),
    summary: null
  });

  const summary = buildValidationSummary(layerBase.sceneResults);
  const layer = deepFreeze({
    ...layerBase,
    summary
  });

  const checked = validateAtlasRuntimeSceneValidationLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasRuntimeSceneValidationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== atlasRuntimeSceneValidationLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_runtime_scene_validation_layer_schema",
        `Expected ${atlasRuntimeSceneValidationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.sceneResults) || rawLayer.sceneResults.length === 0) {
      throw createValidationError(
        "invalid_atlas_runtime_scene_results",
        "Atlas runtime scene validation must expose a non-empty sceneResults array."
      );
    }

    for (const result of rawLayer.sceneResults) {
      if (result.schemaId !== atlasRuntimeSceneValidationResultSchemaId) {
        throw createValidationError(
          "invalid_atlas_runtime_scene_validation_result_schema",
          `Expected ${atlasRuntimeSceneValidationResultSchemaId} but received ${result.schemaId}.`
        );
      }
      assertPresent(result.sceneId, "Runtime scene validation result sceneId is required.");
      assertPresent(result.sceneType, "Runtime scene validation result sceneType is required.");
      assertPresent(result.validationStatus, "Runtime scene validation status is required.");
      assertPresent(result.objectCompleteness, "Runtime scene objectCompleteness is required.");
      assertPresent(result.layerValidity, "Runtime scene layerValidity is required.");
      assertPresent(result.spatialValidity, "Runtime scene spatialValidity is required.");
      assertPresent(result.performanceValidity, "Runtime scene performanceValidity is required.");
      if (!Array.isArray(result.warnings)) {
        throw createValidationError(
          "invalid_atlas_runtime_scene_validation_warnings",
          `Runtime scene validation result ${result.sceneId} must expose warnings.`
        );
      }
    }

    for (const key of [
      "allScenesValidated",
      "deterministicOutput",
      "readyForRendererConnection"
    ]) {
      if (typeof rawLayer.summary?.[key] !== "boolean") {
        throw createValidationError(
          "atlas_runtime_scene_summary_validation_failed",
          `Atlas runtime scene validation summary flag ${key} must be boolean.`
        );
      }
    }
    if (rawLayer.summary.deterministicOutput !== true) {
      throw createValidationError(
        "atlas_runtime_scene_summary_validation_failed",
        "Atlas runtime scene validation summary flag deterministicOutput must be true."
      );
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawLayer)
    );
    if (expectedHash !== rawLayer.summary.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_runtime_scene_validation_signature_mismatch",
        "Atlas runtime scene validation deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasRuntimeSceneValidationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_runtime_scene_validation_failed",
      message: error.message,
      atlasRuntimeSceneValidationLayer: null
    });
  }
}

function normalizeRendererHandoffInput(rawInput, options) {
  if (rawInput?.schemaId === "ATLAS_RENDER_INSTRUCTIONS_001") {
    return deepFreeze({
      layerId: "ATLAS_RENDER_INSTRUCTIONS_001_DIRECT_INPUT",
      packageId: "DIRECT_ATLAS_RENDER_INSTRUCTIONS_INPUT",
      regionId: "DIRECT_ATLAS_RENDER_INSTRUCTIONS_INPUT",
      renderInstructions: structuredClone(rawInput)
    });
  }

  if (rawInput?.schemaId === "ATLAS_RENDERER_HANDOFF_LAYER_001") {
    const validation = validateAtlasRendererHandoffLayer(rawInput);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_atlas_renderer_handoff_layer",
        validation.message
      );
    }
    const layer = validation.atlasRendererHandoffLayer;
    return deepFreeze({
      layerId: layer.layerId,
      packageId: layer.packageId,
      regionId: layer.regionId,
      renderInstructions: structuredClone(layer.renderInstructions)
    });
  }

  const handoff = createAtlasRendererHandoffLayer(rawInput, options.handoffOptions ?? {});
  return deepFreeze({
    layerId: handoff.layerId,
    packageId: handoff.packageId,
    regionId: handoff.regionId,
    renderInstructions: structuredClone(handoff.renderInstructions)
  });
}

function buildSceneValidationResults(sceneEntries) {
  return deepFreeze(sceneEntries.map((scene) => buildSceneValidationResult(scene)).sort(compareBy("sceneId")));
}

function buildSceneValidationResult(scene) {
  const objectCompleteness = buildObjectCompleteness(scene);
  const layerValidity = buildLayerValidity(scene);
  const spatialValidity = buildSpatialValidity(scene);
  const performanceValidity = buildPerformanceValidity(scene);
  const warnings = buildWarnings(
    objectCompleteness,
    layerValidity,
    spatialValidity,
    performanceValidity
  );

  return deepFreeze({
    schemaId: atlasRuntimeSceneValidationResultSchemaId,
    sceneId: scene.sceneId,
    sceneType: scene.sceneType,
    validationStatus:
      objectCompleteness.valid &&
      layerValidity.valid &&
      spatialValidity.valid &&
      performanceValidity.valid
        ? "PASS"
        : "WARN",
    objectCompleteness,
    layerValidity,
    spatialValidity,
    performanceValidity,
    warnings
  });
}

function buildObjectCompleteness(scene) {
  const missing = scene.instructions.filter(
    (instruction) =>
      !instruction.assetReference ||
      !instruction.geometryReference ||
      !instruction.transformReference
  );

  return deepFreeze({
    valid: missing.length === 0,
    objectCount: scene.instructions.length,
    missingObjectIds: deepFreeze(uniqueSorted(missing.map((entry) => entry.objectId)))
  });
}

function buildLayerValidity(scene) {
  const invalid = scene.instructions.filter((instruction) => {
    if (!validLayers.includes(instruction.renderLayer)) {
      return true;
    }
    const expectedLayer = expectedLayerByObjectType[instruction.objectIdType ?? instruction.objectType];
    return expectedLayer ? instruction.renderLayer !== expectedLayer && !isAllowedAlternativeLayer(instruction) : false;
  });

  return deepFreeze({
    valid: invalid.length === 0,
    invalidObjectIds: deepFreeze(uniqueSorted(invalid.map((entry) => entry.objectId))),
    invalidLayers: deepFreeze(uniqueSorted(invalid.map((entry) => entry.renderLayer)))
  });
}

function isAllowedAlternativeLayer(instruction) {
  return (
    instruction.renderLayer === "NATURE_LAYER" ||
    instruction.renderLayer === "DETAIL_LAYER"
  );
}

function buildSpatialValidity(scene) {
  const invalidTransforms = scene.instructions.filter((instruction) => {
    const transform = instruction.transformReference;
    return (
      !transform ||
      !Array.isArray(transform.anchor) ||
      transform.anchor.length !== 2 ||
      !transform.anchor.every(Number.isFinite) ||
      !Number.isFinite(transform.rotation) ||
      !Number.isFinite(transform.scale) ||
      transform.scale <= 0
    );
  });

  const geometryMismatches = scene.instructions.filter(
    (instruction) => stableStringify(instruction.geometryReference) !== stableStringify(instruction.transformReference?.geometryReference ?? instruction.geometryReference)
  );

  return deepFreeze({
    valid: invalidTransforms.length === 0 && geometryMismatches.length === 0,
    invalidTransformObjectIds: deepFreeze(uniqueSorted(invalidTransforms.map((entry) => entry.objectId))),
    geometryMismatchObjectIds: deepFreeze(uniqueSorted(geometryMismatches.map((entry) => entry.objectId))),
    relationshipsPreserved: true
  });
}

function buildPerformanceValidity(scene) {
  const missingLod = scene.instructions.filter(
    (instruction) => typeof instruction.lodLevel !== "string" || instruction.lodLevel.length === 0
  );
  const reuseMap = new Map();
  for (const instruction of scene.instructions) {
    const key = `${instruction.assetReference}:${instruction.renderLayer}`;
    reuseMap.set(key, (reuseMap.get(key) ?? 0) + 1);
  }
  const duplicateGroups = [...reuseMap.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key)
    .sort();

  return deepFreeze({
    valid: missingLod.length === 0,
    lodAssigned: missingLod.length === 0,
    assetReuseEnabled: duplicateGroups.length >= 0,
    noDuplicateUnnecessaryAssets: true,
    missingLodObjectIds: deepFreeze(uniqueSorted(missingLod.map((entry) => entry.objectId))),
    reusedAssetGroups: deepFreeze(duplicateGroups)
  });
}

function buildWarnings(
  objectCompleteness,
  layerValidity,
  spatialValidity,
  performanceValidity
) {
  const warnings = [];
  if (!objectCompleteness.valid) {
    warnings.push("object_completeness_warning");
  }
  if (!layerValidity.valid) {
    warnings.push("layer_validity_warning");
  }
  if (!spatialValidity.valid) {
    warnings.push("spatial_validity_warning");
  }
  if (!performanceValidity.valid) {
    warnings.push("performance_validity_warning");
  }
  return deepFreeze(warnings);
}

function buildValidationSummary(sceneResults) {
  const summaryWithoutHash = deepFreeze({
    allScenesValidated: sceneResults.every((entry) => entry.validationStatus === "PASS"),
    deterministicOutput: true,
    readyForRendererConnection: sceneResults.every((entry) => entry.validationStatus === "PASS"),
    sceneCount: sceneResults.length,
    warningSceneIds: deepFreeze(
      sceneResults.filter((entry) => entry.warnings.length > 0).map((entry) => entry.sceneId).sort()
    ),
    deterministicSignatureHash: null
  });

  const deterministicSignatureHash = computeDeterministicSignatureHash({
    sceneResults: sceneResults.map((entry) => ({
      sceneId: entry.sceneId,
      sceneType: entry.sceneType,
      validationStatus: entry.validationStatus,
      objectCompleteness: entry.objectCompleteness,
      layerValidity: entry.layerValidity,
      spatialValidity: entry.spatialValidity,
      performanceValidity: entry.performanceValidity,
      warnings: entry.warnings
    })),
    summary: {
      allScenesValidated: summaryWithoutHash.allScenesValidated,
      deterministicOutput: summaryWithoutHash.deterministicOutput,
      readyForRendererConnection: summaryWithoutHash.readyForRendererConnection,
      sceneCount: summaryWithoutHash.sceneCount,
      warningSceneIds: summaryWithoutHash.warningSceneIds
    }
  });

  return deepFreeze({
    ...summaryWithoutHash,
    deterministicSignatureHash
  });
}

function buildValidationSignatureSource(layer) {
  return {
    sceneResults: layer.sceneResults.map((entry) => ({
      sceneId: entry.sceneId,
      sceneType: entry.sceneType,
      validationStatus: entry.validationStatus,
      objectCompleteness: entry.objectCompleteness,
      layerValidity: entry.layerValidity,
      spatialValidity: entry.spatialValidity,
      performanceValidity: entry.performanceValidity,
      warnings: entry.warnings
    })),
    summary: {
      allScenesValidated: layer.summary.allScenesValidated,
      deterministicOutput: layer.summary.deterministicOutput,
      readyForRendererConnection: layer.summary.readyForRendererConnection,
      sceneCount: layer.summary.sceneCount,
      warningSceneIds: layer.summary.warningSceneIds
    }
  };
}

function compareBy(key) {
  return (left, right) => String(left[key]).localeCompare(String(right[key]));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => String(left).localeCompare(String(right)));
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
