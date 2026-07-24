import { existsSync as defaultExistsSync } from "node:fs";
import { readFile as defaultReadFile } from "node:fs/promises";
import {
  roadCoastalGlbImportBridgeFoundationDefinition,
  validateRoadCoastalGlbImportBridgeFoundation
} from "./road-coastal-glb-import-bridge-foundation.mjs";

export const roadCoastalRuntimePreviewBindingRequiredFields = Object.freeze([
  "glbRuntimeLoadId",
  "assetId",
  "glbReference",
  "loaderState",
  "meshResult",
  "materialResult",
  "renderResult",
  "validationResult"
]);

export const roadCoastalRuntimePreviewBindingStates = Object.freeze([
  "requested",
  "fetching",
  "parsing",
  "loaded",
  "rendering",
  "verified",
  "failed",
  "closed"
]);

export const roadCoastalRuntimePreviewBindingDefinition = deepFreeze({
  glbRuntimeLoadId: "ATLAS_RUNTIME_GLB_LOAD_ROAD_COASTAL_001",
  assetId: "ROAD_COASTAL_001",
  glbReference: {
    glbPath:
      "asset-factory-workspace/production/COASTAL_INFRASTRUCTURE_FAMILY_001/export/ROAD_COASTAL_001_LOD_GAMEPLAY.glb",
    manifestReference:
      "asset-factory-workspace/production/COASTAL_INFRASTRUCTURE_FAMILY_001/export/road-coastal-manifest.json",
    metadataReference:
      "asset-factory-workspace/production/COASTAL_INFRASTRUCTURE_FAMILY_001/export/road-coastal-metadata.json",
    lodKey: "LOD_GAMEPLAY"
  },
  loaderState: {
    currentState: "requested",
    allowedStates: roadCoastalRuntimePreviewBindingStates,
    fallbackEnabled: true
  },
  meshResult: {
    meshCount: 0,
    primitiveCount: 0,
    vertexCount: 0,
    projectedVertices: [
      { x: 0.0, y: 0.18 },
      { x: 0.0, y: 0.36 },
      { x: 1.0, y: 0.34 },
      { x: 1.0, y: 0.16 }
    ],
    bounds2D: {
      minX: 0.0,
      minY: 0.16,
      maxX: 1.0,
      maxY: 0.36
    }
  },
  materialResult: {
    materialCount: 0,
    materialNames: []
  },
  renderResult: {
    rendererProfile: "custom-2.5d-passive",
    displayMode: "runtime-glb-road-preview",
    fallbackPlaceholder: "ROAD_PLACEHOLDER",
    appearanceProfile: "day"
  },
  validationResult: {
    glbAvailable: false,
    binaryParsed: false,
    meshExtracted: false,
    materialExtracted: false,
    rendererCompatibilityValid: true,
    fallbackBehaviorValid: true
  }
});

const supportedStates = new Set(roadCoastalRuntimePreviewBindingStates);
const supportedLodKeys = new Set([
  "LOD_CLOSE",
  "LOD_GAMEPLAY",
  "LOD_MAP",
  "LOD_DISTANT_SILHOUETTE"
]);

export async function loadRoadCoastalRuntimePreviewBinding(
  rawDefinition = roadCoastalRuntimePreviewBindingDefinition,
  options = {}
) {
  try {
    const definition = normalizeRuntimeBindingDefinition(rawDefinition);
    const existsSync =
      typeof options.existsSync === "function" ? options.existsSync : defaultExistsSync;
    const readArrayBuffer =
      typeof options.loadArrayBuffer === "function"
        ? options.loadArrayBuffer
        : createDefaultArrayBufferLoader(options.readFile);

    const importBridgeDefinition =
      options.importBridgeDefinition ?? roadCoastalGlbImportBridgeFoundationDefinition;
    const importBridgeResult = validateRoadCoastalGlbImportBridgeFoundation(
      importBridgeDefinition,
      { existsSync }
    );
    const importBridge = importBridgeResult.ok
      ? importBridgeResult.glbImportBridge.foundation
      : normalizeImportBridgeFallback(importBridgeDefinition);

    validateCompatibility(definition, importBridge);

    if (!existsSync(definition.glbReference.glbPath)) {
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: null,
        runtimePreviewBinding: Object.freeze({
          definition,
          runtime: Object.freeze({
            actualGlbMeshLoaded: false,
            usedFallback: true
          })
        })
      });
    }

    const arrayBuffer = await readArrayBuffer(definition.glbReference.glbPath);
    const parsedGlb = parseBinaryGlb(arrayBuffer);

    const loadedDefinition = deepFreeze({
      ...definition,
      loaderState: {
        ...definition.loaderState,
        currentState: "verified"
      },
      meshResult: {
        ...definition.meshResult,
        meshCount: parsedGlb.meshCount,
        primitiveCount: parsedGlb.primitiveCount,
        vertexCount: parsedGlb.vertexCount
      },
      materialResult: {
        materialCount: parsedGlb.materialCount,
        materialNames: parsedGlb.materialNames
      },
      validationResult: {
        ...definition.validationResult,
        glbAvailable: true,
        binaryParsed: true,
        meshExtracted: parsedGlb.meshCount > 0 && parsedGlb.primitiveCount > 0,
        materialExtracted: parsedGlb.materialCount > 0
      }
    });

    validateLoadedRuntime(loadedDefinition);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      runtimePreviewBinding: Object.freeze({
        definition: loadedDefinition,
        runtime: Object.freeze({
          actualGlbMeshLoaded: true,
          usedFallback: false,
          parsedGlb
        })
      })
    });
  } catch (error) {
    if (error?.name !== "RoadCoastalRuntimePreviewBindingValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      runtimePreviewBinding: null
    });
  }
}

export function createRoadCoastalRuntimePreviewBinding(
  rawDefinition = roadCoastalRuntimePreviewBindingDefinition
) {
  return normalizeRuntimeBindingDefinition(rawDefinition);
}

function validateCompatibility(definition, importBridge) {
  if (definition.assetId !== importBridge.glbRegistration.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Road runtime preview binding assetId must match the GLB import bridge assetId."
    );
  }
  if (definition.glbReference.glbPath !== importBridge.glbRegistration.lodReferences.LOD_GAMEPLAY) {
    throw createValidationError(
      "glb_reference_mismatch",
      "Road runtime preview binding must target the gameplay GLB output."
    );
  }
  if (
    importBridge.runtimePreviewBinding.renderPayload.rendererProfile !==
      definition.renderResult.rendererProfile ||
    importBridge.runtimePreviewBinding.lodSelector.gameplay !== definition.glbReference.lodKey
  ) {
    throw createValidationError(
      "runtime_preview_binding_mismatch",
      "Road runtime preview binding must preserve the passive renderer profile and gameplay LOD selection."
    );
  }
}

function validateLoadedRuntime(definition) {
  if (!definition.validationResult.binaryParsed) {
    throw createValidationError(
      "binary_parse_invalid",
      "Road runtime preview binding must mark binaryParsed true after successful parsing."
    );
  }
  if (!definition.validationResult.meshExtracted) {
    throw createValidationError(
      "mesh_extraction_invalid",
      "Road runtime preview binding must extract at least one mesh primitive."
    );
  }
  if (!definition.validationResult.materialExtracted) {
    throw createValidationError(
      "material_extraction_invalid",
      "Road runtime preview binding must extract at least one material."
    );
  }
}

function parseBinaryGlb(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 20) {
    throw createValidationError(
      "invalid_glb_binary",
      "Road runtime preview binding requires a valid GLB ArrayBuffer."
    );
  }
  const view = new DataView(arrayBuffer);
  if (
    view.getUint32(0, true) !== 0x46546c67 ||
    view.getUint32(4, true) !== 2 ||
    view.getUint32(8, true) !== arrayBuffer.byteLength
  ) {
    throw createValidationError(
      "invalid_glb_binary",
      "Road runtime preview binding encountered an invalid GLB header."
    );
  }
  const jsonChunkLength = view.getUint32(12, true);
  if (view.getUint32(16, true) !== 0x4e4f534a) {
    throw createValidationError(
      "invalid_glb_binary",
      "Road runtime preview binding requires a leading JSON chunk."
    );
  }
  const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonChunkLength);
  const jsonText = new TextDecoder("utf-8").decode(jsonBytes).replace(/\0+$/u, "");
  let gltf;
  try {
    gltf = JSON.parse(jsonText);
  } catch {
    throw createValidationError(
      "invalid_glb_binary",
      "Road runtime preview binding could not parse the embedded glTF JSON."
    );
  }
  const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
  const materials = Array.isArray(gltf.materials) ? gltf.materials : [];
  const primitiveCount = meshes.reduce(
    (count, mesh) => count + (Array.isArray(mesh.primitives) ? mesh.primitives.length : 0),
    0
  );
  return Object.freeze({
    meshCount: meshes.length,
    primitiveCount,
    vertexCount: primitiveCount * 3,
    materialCount: materials.length,
    materialNames: Object.freeze(
      materials.map((material, index) =>
        typeof material?.name === "string" && material.name.trim()
          ? material.name
          : `MATERIAL_${index + 1}`
      )
    )
  });
}

function createDefaultArrayBufferLoader(readFileOverride) {
  const readFile = typeof readFileOverride === "function" ? readFileOverride : defaultReadFile;
  return async (filePath) => {
    const fileBuffer = await readFile(filePath);
    return fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );
  };
}

function normalizeImportBridgeFallback(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "importBridgeDefinition");
  return deepFreeze({
    glbRegistration: {
      assetId: normalizeString(definition.glbRegistration.assetId, "importBridgeDefinition.glbRegistration.assetId"),
      lodReferences: {
        LOD_GAMEPLAY: normalizeString(
          definition.glbRegistration.lodReferences.LOD_GAMEPLAY,
          "importBridgeDefinition.glbRegistration.lodReferences.LOD_GAMEPLAY"
        )
      }
    },
    runtimePreviewBinding: {
      renderPayload: {
        rendererProfile: normalizeString(
          definition.runtimePreviewBinding.renderPayload.rendererProfile,
          "importBridgeDefinition.runtimePreviewBinding.renderPayload.rendererProfile"
        )
      },
      lodSelector: {
        gameplay: normalizeString(
          definition.runtimePreviewBinding.lodSelector.gameplay,
          "importBridgeDefinition.runtimePreviewBinding.lodSelector.gameplay"
        )
      }
    }
  });
}

function normalizeRuntimeBindingDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "roadCoastalRuntimePreviewBinding");
  for (const fieldName of roadCoastalRuntimePreviewBindingRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Road runtime preview binding definition is missing ${fieldName}.`
      );
    }
  }
  if (normalizeString(definition.assetId, "assetId") !== "ROAD_COASTAL_001") {
    throw createValidationError(
      "asset_identity_invalid",
      "Road runtime preview binding is limited to ROAD_COASTAL_001."
    );
  }
  return deepFreeze({
    glbRuntimeLoadId: normalizeString(definition.glbRuntimeLoadId, "glbRuntimeLoadId"),
    assetId: "ROAD_COASTAL_001",
    glbReference: normalizeGlbReference(definition.glbReference),
    loaderState: normalizeLoaderState(definition.loaderState),
    meshResult: normalizeMeshResult(definition.meshResult),
    materialResult: normalizeMaterialResult(definition.materialResult),
    renderResult: normalizeRenderResult(definition.renderResult),
    validationResult: normalizeValidationResult(definition.validationResult)
  });
}

function normalizeGlbReference(rawValue) {
  const glbReference = asPlainObject(rawValue, "glbReference");
  const lodKey = normalizeString(glbReference.lodKey, "glbReference.lodKey");
  if (!supportedLodKeys.has(lodKey)) {
    throw createValidationError("invalid_lod_key", "Road runtime preview binding lodKey must be supported.");
  }
  return deepFreeze({
    glbPath: normalizeRelativePath(glbReference.glbPath, "glbReference.glbPath"),
    manifestReference: normalizeRelativePath(
      glbReference.manifestReference,
      "glbReference.manifestReference"
    ),
    metadataReference: normalizeRelativePath(
      glbReference.metadataReference,
      "glbReference.metadataReference"
    ),
    lodKey
  });
}

function normalizeLoaderState(rawValue) {
  const loaderState = asPlainObject(rawValue, "loaderState");
  const currentState = normalizeString(loaderState.currentState, "loaderState.currentState");
  if (!supportedStates.has(currentState)) {
    throw createValidationError("invalid_loader_state", "Road runtime preview binding currentState must be supported.");
  }
  return deepFreeze({
    currentState,
    allowedStates: deepFreeze(
      (Array.isArray(loaderState.allowedStates) ? loaderState.allowedStates : []).map((state, index) => {
        const value = normalizeString(state, `loaderState.allowedStates[${index}]`);
        if (!supportedStates.has(value)) {
          throw createValidationError("invalid_loader_state", "Road runtime preview binding allowedStates must be supported.");
        }
        return value;
      })
    ),
    fallbackEnabled: Boolean(loaderState.fallbackEnabled)
  });
}

function normalizeMeshResult(rawValue) {
  const meshResult = asPlainObject(rawValue, "meshResult");
  const vertices = Array.isArray(meshResult.projectedVertices)
    ? meshResult.projectedVertices.map((vertex, index) => normalizeVertex(vertex, index))
    : [];
  if (vertices.length < 3) {
    throw createValidationError(
      "invalid_mesh_result",
      "Road runtime preview binding meshResult.projectedVertices must describe a drawable polygon."
    );
  }
  return deepFreeze({
    meshCount: normalizeNonNegativeInteger(meshResult.meshCount, "meshResult.meshCount"),
    primitiveCount: normalizeNonNegativeInteger(meshResult.primitiveCount, "meshResult.primitiveCount"),
    vertexCount: normalizeNonNegativeInteger(meshResult.vertexCount, "meshResult.vertexCount"),
    projectedVertices: deepFreeze(vertices),
    bounds2D: deepFreeze({
      minX: Number(meshResult.bounds2D?.minX ?? 0),
      minY: Number(meshResult.bounds2D?.minY ?? 0),
      maxX: Number(meshResult.bounds2D?.maxX ?? 1),
      maxY: Number(meshResult.bounds2D?.maxY ?? 1)
    })
  });
}

function normalizeMaterialResult(rawValue) {
  const materialResult = asPlainObject(rawValue, "materialResult");
  return deepFreeze({
    materialCount: normalizeNonNegativeInteger(
      materialResult.materialCount,
      "materialResult.materialCount"
    ),
    materialNames: deepFreeze(
      (Array.isArray(materialResult.materialNames) ? materialResult.materialNames : []).map(
        (materialName, index) =>
          normalizeString(materialName, `materialResult.materialNames[${index}]`)
      )
    )
  });
}

function normalizeRenderResult(rawValue) {
  const renderResult = asPlainObject(rawValue, "renderResult");
  return deepFreeze({
    rendererProfile: normalizeString(renderResult.rendererProfile, "renderResult.rendererProfile"),
    displayMode: normalizeString(renderResult.displayMode, "renderResult.displayMode"),
    fallbackPlaceholder: normalizeString(
      renderResult.fallbackPlaceholder,
      "renderResult.fallbackPlaceholder"
    ),
    appearanceProfile: normalizeString(
      renderResult.appearanceProfile,
      "renderResult.appearanceProfile"
    )
  });
}

function normalizeValidationResult(rawValue) {
  const validationResult = asPlainObject(rawValue, "validationResult");
  return deepFreeze({
    glbAvailable: Boolean(validationResult.glbAvailable),
    binaryParsed: Boolean(validationResult.binaryParsed),
    meshExtracted: Boolean(validationResult.meshExtracted),
    materialExtracted: Boolean(validationResult.materialExtracted),
    rendererCompatibilityValid: Boolean(validationResult.rendererCompatibilityValid),
    fallbackBehaviorValid: Boolean(validationResult.fallbackBehaviorValid)
  });
}

function normalizeVertex(rawValue, index) {
  const vertex = asPlainObject(rawValue, `meshResult.projectedVertices[${index}]`);
  return {
    x: Number(vertex.x),
    y: Number(vertex.y)
  };
}

function normalizeNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw createValidationError(
      "invalid_non_negative_integer",
      `${fieldName} must be a non-negative integer.`
    );
  }
  return value;
}

function normalizeRelativePath(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (normalized.startsWith("/")) {
    throw createValidationError(
      "invalid_relative_path",
      `${fieldName} must remain repository-relative.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError("invalid_string", `${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function createValidationError(code, message) {
  return Object.assign(new Error(message), {
    code,
    name: "RoadCoastalRuntimePreviewBindingValidationError"
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}
