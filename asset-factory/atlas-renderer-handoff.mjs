import {
  createAtlasStreetSceneCompositionLayer,
  validateAtlasStreetSceneCompositionLayer
} from "./atlas-street-scene-composition.mjs";

export const atlasRendererHandoffLayerSchemaId =
  "ATLAS_RENDERER_HANDOFF_LAYER_001";
export const atlasRenderInstructionsSchemaId =
  "ATLAS_RENDER_INSTRUCTIONS_001";
export const atlasRenderHandoffValidationSchemaId =
  "ATLAS_RENDER_HANDOFF_VALIDATION_001";

const renderLayerOrder = deepFreeze({
  GROUND_LAYER: 10,
  ROAD_LAYER: 20,
  OBJECT_LAYER: 30,
  NATURE_LAYER: 40,
  DETAIL_LAYER: 50
});

const groundObjectTypes = new Set(["PARK", "RESERVE", "BEACH", "WATERWAY"]);
const objectObjectTypes = new Set([
  "HOUSE",
  "TOWNHOUSE",
  "APARTMENT",
  "BAKERY",
  "CAFE",
  "SHOP",
  "PETROL_STATION",
  "LIBRARY",
  "SCHOOL",
  "COMMUNITY_BUILDING",
  "LIGHTHOUSE",
  "LOOKOUT",
  "HISTORIC_SITE",
  "ATTRACTION"
]);
const natureFamilies = new Set([
  "TREE_ASSET_FAMILY_001",
  "VEGETATION_ASSET_FAMILY_001"
]);
const groundFamilies = new Set([
  "GROUND_ASSET_FAMILY_001",
  "TERRAIN_FEATURE_ASSET_FAMILY_001",
  "FAMILY_TREATMENT_PARK",
  "FAMILY_TREATMENT_RESERVE",
  "FAMILY_TREATMENT_NATURAL"
]);

export function createAtlasRendererHandoffLayer(rawStreetScenes, options = {}) {
  const normalized = normalizeStreetSceneInput(rawStreetScenes, options);
  const sceneEntries = buildRenderInstructionEntries(normalized);

  const layerBase = deepFreeze({
    schemaId: atlasRendererHandoffLayerSchemaId,
    layerId: `${normalized.layerId}_RENDERER_HANDOFF`,
    packageId: normalized.packageId,
    regionId: normalized.regionId,
    renderInstructions: deepFreeze({
      schemaId: atlasRenderInstructionsSchemaId,
      entries: sceneEntries
    }),
    validation: null
  });

  const validation = buildRendererHandoffValidation(layerBase, normalized);
  const layer = deepFreeze({
    ...layerBase,
    validation
  });

  const checked = validateAtlasRendererHandoffLayer(layer);
  if (!checked.ok) {
    throw createValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAtlasRendererHandoffLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== atlasRendererHandoffLayerSchemaId) {
      throw createValidationError(
        "invalid_atlas_renderer_handoff_layer_schema",
        `Expected ${atlasRendererHandoffLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (rawLayer.renderInstructions?.schemaId !== atlasRenderInstructionsSchemaId) {
      throw createValidationError(
        "invalid_atlas_render_instructions_schema",
        `Expected ${atlasRenderInstructionsSchemaId} but received ${rawLayer.renderInstructions?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.renderInstructions.entries) || rawLayer.renderInstructions.entries.length === 0) {
      throw createValidationError(
        "invalid_atlas_render_instruction_entries",
        "Atlas renderer handoff layer must expose a non-empty instruction entry list."
      );
    }

    if (rawLayer.validation?.schemaId !== atlasRenderHandoffValidationSchemaId) {
      throw createValidationError(
        "invalid_atlas_render_handoff_validation_schema",
        `Expected ${atlasRenderHandoffValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const sceneEntry of rawLayer.renderInstructions.entries) {
      assertPresent(sceneEntry.sceneId, "Render instruction sceneId is required.");
      assertPresent(sceneEntry.sceneType, "Render instruction sceneType is required.");
      if (!Array.isArray(sceneEntry.instructions) || sceneEntry.instructions.length === 0) {
        throw createValidationError(
          "invalid_atlas_render_scene_instructions",
          `Renderer handoff scene ${sceneEntry.sceneId} must expose non-empty instructions.`
        );
      }

      for (const instruction of sceneEntry.instructions) {
        assertPresent(instruction.objectId, "Render instruction objectId is required.");
        assertPresent(instruction.assetReference, "Render instruction assetReference is required.");
        assertPresent(
          instruction.transformReference,
          "Render instruction transformReference is required."
        );
        assertPresent(
          instruction.geometryReference,
          "Render instruction geometryReference is required."
        );
        assertPresent(instruction.lodLevel, "Render instruction lodLevel is required.");
        assertPresent(
          instruction.materialReference,
          "Render instruction materialReference is required."
        );
        assertPresent(instruction.renderLayer, "Render instruction renderLayer is required.");
        assertPresent(
          instruction.layerOrdering,
          "Render instruction layerOrdering is required."
        );
      }
    }

    for (const key of [
      "everyObjectHasAssetReference",
      "geometryPreserved",
      "lodExists",
      "layerValid",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createValidationError(
          "atlas_render_handoff_validation_failed",
          `Atlas render handoff validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicSignatureHash(
      buildValidationSignatureSource(rawLayer)
    );
    if (expectedHash !== rawLayer.validation.deterministicSignatureHash) {
      throw createValidationError(
        "atlas_render_handoff_signature_mismatch",
        "Atlas render handoff deterministic signature hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      atlasRendererHandoffLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "atlas_render_handoff_validation_failed",
      message: error.message,
      atlasRendererHandoffLayer: null
    });
  }
}

function normalizeStreetSceneInput(rawStreetScenes, options) {
  if (rawStreetScenes?.schemaId === atlasStreetScenePreviewSchemaIdPlaceholder()) {
    return deepFreeze({
      layerId: "ATLAS_STREET_SCENE_PREVIEW_001_DIRECT_INPUT",
      packageId: "DIRECT_ATLAS_STREET_SCENE_PREVIEW_INPUT",
      regionId: "DIRECT_ATLAS_STREET_SCENE_PREVIEW_INPUT",
      streetScenes: structuredClone(rawStreetScenes)
    });
  }

  if (rawStreetScenes?.schemaId === "ATLAS_STREET_SCENE_COMPOSITION_LAYER_001") {
    const validation = validateAtlasStreetSceneCompositionLayer(rawStreetScenes);
    if (!validation.ok) {
      throw createValidationError(
        "invalid_atlas_street_scene_composition_layer",
        validation.message
      );
    }
    const layer = validation.atlasStreetSceneCompositionLayer;
    return deepFreeze({
      layerId: layer.layerId,
      packageId: layer.packageId,
      regionId: layer.regionId,
      streetScenes: structuredClone(layer.streetScenes)
    });
  }

  const composed = createAtlasStreetSceneCompositionLayer(
    rawStreetScenes,
    options.relationships,
    options.environmentPreview,
    options.compositionOptions ?? {}
  );

  return deepFreeze({
    layerId: composed.layerId,
    packageId: composed.packageId,
    regionId: composed.regionId,
    streetScenes: structuredClone(composed.streetScenes)
  });
}

function buildRenderInstructionEntries(normalized) {
  return deepFreeze(
    normalized.streetScenes.entries
      .map((scene) => buildSceneRenderInstructions(scene))
      .sort(compareBy("sceneId"))
  );
}

function buildSceneRenderInstructions(scene) {
  const instructions = scene.objectList
    .flatMap((objectEntry) =>
      objectEntry.assetAssignments.map((assetAssignment, assetIndex) =>
        buildRenderInstruction(scene, objectEntry, assetAssignment, assetIndex)
      )
    )
    .sort(compareInstructions);

  return deepFreeze({
    sceneId: scene.sceneId,
    sceneType: scene.sceneType,
    instructions: deepFreeze(instructions),
    sceneMetadata: deepFreeze({
      objectCount: scene.objectList.length,
      instructionCount: instructions.length,
      renderLayers: deepFreeze(uniqueSorted(instructions.map((entry) => entry.renderLayer)))
    })
  });
}

function buildRenderInstruction(scene, objectEntry, assetAssignment, assetIndex) {
  const renderLayer = resolveRenderLayer(objectEntry, assetAssignment);
  const lodLevel = resolveLodLevel(renderLayer, objectEntry.lodRules);
  const geometryReference = objectEntry.sourceGeometryReference;

  return deepFreeze({
    objectId: objectEntry.objectId,
    sceneId: scene.sceneId,
    assetReference: assetAssignment.assetId,
    transformReference: deepFreeze(
      buildTransformReference(objectEntry.objectId, geometryReference, assetIndex)
    ),
    geometryReference,
    lodLevel,
    materialReference: buildMaterialReference(assetAssignment),
    renderLayer,
    layerOrdering: renderLayerOrder[renderLayer],
    assetFamily: assetAssignment.assetFamily,
    role: assetAssignment.role
  });
}

function resolveRenderLayer(objectEntry, assetAssignment) {
  if (objectEntry.objectType === "TRANSPORT_ROUTE") {
    return "ROAD_LAYER";
  }
  if (natureFamilies.has(assetAssignment.assetFamily)) {
    return "NATURE_LAYER";
  }
  if (groundFamilies.has(assetAssignment.assetFamily) || groundObjectTypes.has(objectEntry.objectType)) {
    return "GROUND_LAYER";
  }
  if (assetAssignment.role === "street_furniture_reference") {
    return "DETAIL_LAYER";
  }
  if (objectObjectTypes.has(objectEntry.objectType)) {
    return "OBJECT_LAYER";
  }
  return "DETAIL_LAYER";
}

function resolveLodLevel(renderLayer, lodRules) {
  const preferred = {
    GROUND_LAYER: "LOD_MAP",
    ROAD_LAYER: "LOD_GAMEPLAY",
    OBJECT_LAYER: "LOD_CLOSE",
    NATURE_LAYER: "LOD_GAMEPLAY",
    DETAIL_LAYER: "LOD_CLOSE"
  }[renderLayer];

  if (Array.isArray(lodRules) && lodRules.includes(preferred)) {
    return preferred;
  }
  if (Array.isArray(lodRules) && lodRules.length > 0) {
    return lodRules[0];
  }
  return "LOD_MAP";
}

function buildTransformReference(objectId, geometryReference, assetIndex) {
  return {
    transformId: `${objectId}_TRANSFORM_${String(assetIndex).padStart(2, "0")}`,
    anchor: deriveAnchorPoint(geometryReference),
    rotation: 0,
    scale: 1
  };
}

function deriveAnchorPoint(geometryReference) {
  const points = flattenGeometryPoints(geometryReference);
  if (points.length === 0) {
    return [0, 0];
  }
  const sums = points.reduce(
    (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
    [0, 0]
  );
  return [
    Number((sums[0] / points.length).toFixed(6)),
    Number((sums[1] / points.length).toFixed(6))
  ];
}

function flattenGeometryPoints(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  if (value.length === 2 && value.every((entry) => typeof entry === "number")) {
    return [value];
  }
  return value.flatMap((entry) => flattenGeometryPoints(entry));
}

function buildMaterialReference(assetAssignment) {
  return `${assetAssignment.assetFamily}_MAT_001`;
}

function buildRendererHandoffValidation(layerBase, normalized) {
  const validationWithoutHash = deepFreeze({
    schemaId: atlasRenderHandoffValidationSchemaId,
    everyObjectHasAssetReference: layerBase.renderInstructions.entries.every((scene) =>
      scene.instructions.every(
        (instruction) =>
          typeof instruction.assetReference === "string" && instruction.assetReference.length > 0
      )
    ),
    geometryPreserved: layerBase.renderInstructions.entries.every((scene) =>
      scene.instructions.every((instruction) => {
        const sourceScene = normalized.streetScenes.entries.find(
          (entry) => entry.sceneId === scene.sceneId
        );
        const sourceObject = sourceScene?.objectList.find(
          (entry) => entry.objectId === instruction.objectId
        );
        return (
          stableStringify(instruction.geometryReference) ===
          stableStringify(sourceObject?.sourceGeometryReference)
        );
      })
    ),
    lodExists: layerBase.renderInstructions.entries.every((scene) =>
      scene.instructions.every(
        (instruction) => typeof instruction.lodLevel === "string" && instruction.lodLevel.length > 0
      )
    ),
    layerValid: layerBase.renderInstructions.entries.every((scene) =>
      scene.instructions.every(
        (instruction) =>
          Object.prototype.hasOwnProperty.call(renderLayerOrder, instruction.renderLayer) &&
          instruction.layerOrdering === renderLayerOrder[instruction.renderLayer]
      )
    ),
    deterministicOutput: true,
    validationPassed: true,
    deterministicSignatureHash: null
  });

  const signature = computeDeterministicSignatureHash(
    buildValidationSignatureSource({
      renderInstructions: layerBase.renderInstructions,
      validation: validationWithoutHash
    })
  );

  return deepFreeze({
    ...validationWithoutHash,
    deterministicSignatureHash: signature
  });
}

function buildValidationSignatureSource(layer) {
  return {
    entries: layer.renderInstructions.entries.map((scene) => ({
      sceneId: scene.sceneId,
      sceneType: scene.sceneType,
      instructions: scene.instructions.map((instruction) => ({
        objectId: instruction.objectId,
        assetReference: instruction.assetReference,
        lodLevel: instruction.lodLevel,
        renderLayer: instruction.renderLayer,
        layerOrdering: instruction.layerOrdering,
        materialReference: instruction.materialReference,
        transformReference: instruction.transformReference
      }))
    })),
    validation: layer.validation
      ? {
          everyObjectHasAssetReference: layer.validation.everyObjectHasAssetReference,
          geometryPreserved: layer.validation.geometryPreserved,
          lodExists: layer.validation.lodExists,
          layerValid: layer.validation.layerValid,
          deterministicOutput: layer.validation.deterministicOutput,
          validationPassed: layer.validation.validationPassed
        }
      : null
  };
}

function atlasStreetScenePreviewSchemaIdPlaceholder() {
  return "ATLAS_STREET_SCENE_PREVIEW_001";
}

function compareInstructions(left, right) {
  if (left.layerOrdering !== right.layerOrdering) {
    return left.layerOrdering - right.layerOrdering;
  }
  const objectIdCompare = String(left.objectId).localeCompare(String(right.objectId));
  if (objectIdCompare !== 0) {
    return objectIdCompare;
  }
  return String(left.assetReference).localeCompare(String(right.assetReference));
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
