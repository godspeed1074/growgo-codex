export const groundCoastalGrassMinimalGlbRuntimeLoaderRequiredFields = Object.freeze([
  "glbRuntimeLoadId",
  "assetId",
  "glbReference",
  "loaderState",
  "meshResult",
  "materialResult",
  "renderResult",
  "validationResult"
]);

export const groundCoastalGrassMinimalGlbRuntimeLoaderStates = Object.freeze([
  "requested",
  "fetching",
  "parsing",
  "loaded",
  "rendering",
  "verified",
  "failed",
  "closed"
]);

export const groundCoastalGrassMinimalGlbRuntimeLoaderDefinition = deepFreeze({
  glbRuntimeLoadId: "ATLAS_RUNTIME_GLB_LOAD_GROUND_COASTAL_GRASS_001",
  assetId: "GROUND_COASTAL_GRASS_001",
  glbReference: {
    glbPath:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb",
    manifestReference:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/ground-coastal-grass-manifest.json",
    metadataReference:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/ground-coastal-grass-metadata.json",
    lodKey: "LOD_GAMEPLAY"
  },
  loaderState: {
    currentState: "requested",
    allowedStates: groundCoastalGrassMinimalGlbRuntimeLoaderStates,
    fallbackEnabled: true
  },
  meshResult: {
    meshCount: 0,
    primitiveCount: 0,
    vertexCount: 0,
    projectedVertices: [
      { x: 0.0, y: 0.34 },
      { x: 0.28, y: 0.08 },
      { x: 0.72, y: 0.12 },
      { x: 1.0, y: 0.32 }
    ],
    bounds2D: {
      minX: 0.0,
      minY: 0.0,
      maxX: 1.0,
      maxY: 0.35
    }
  },
  materialResult: {
    materialCount: 0,
    materialNames: []
  },
  renderResult: {
    rendererProfile: "custom-2.5d-passive",
    displayMode: "runtime-glb-mesh-preview",
    fallbackPlaceholder: "GROUND_PLACEHOLDER",
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

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedStates = new Set(groundCoastalGrassMinimalGlbRuntimeLoaderStates);
const supportedAppearanceProfiles = new Set(["day", "sunset", "night"]);
const supportedLodKeys = new Set([
  "LOD_CLOSE",
  "LOD_GAMEPLAY",
  "LOD_MAP",
  "LOD_DISTANT_SILHOUETTE"
]);
const defaultExistsSync = () => false;

export function createGroundCoastalGrassMinimalGlbRuntimeLoader(
  rawDefinition = groundCoastalGrassMinimalGlbRuntimeLoaderDefinition
) {
  return normalizeRuntimeLoaderDefinition(rawDefinition);
}

export async function loadGroundCoastalGrassMinimalGlbRuntimeLoader(
  rawDefinition = groundCoastalGrassMinimalGlbRuntimeLoaderDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeRuntimeLoaderDefinition(rawDefinition);

    const meshPreviewDefinition = normalizeMeshPreviewFallback(
      normalizedOptions.meshPreviewDefinition
    );
    const rendererPreviewDefinition = normalizeRendererPreviewFallback(
      normalizedOptions.rendererPreviewDefinition
    );

    validateCompatibility(
      definition,
      meshPreviewDefinition,
      rendererPreviewDefinition
    );

    if (!normalizedOptions.existsSync(definition.glbReference.glbPath)) {
      return Object.freeze({
        ok: true,
        errorCode: null,
        message: null,
        glbRuntimeLoader: Object.freeze({
          definition,
          runtime: Object.freeze({
            actualGlbMeshLoaded: false,
            usedFallback: true
          })
        })
      });
    }

    const arrayBuffer = await normalizedOptions.loadArrayBuffer(
      definition.glbReference.glbPath
    );
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
      glbRuntimeLoader: Object.freeze({
        definition: loadedDefinition,
        runtime: Object.freeze({
          actualGlbMeshLoaded: true,
          usedFallback: false,
          parsedGlb
        })
      })
    });
  } catch (error) {
    if (error?.name !== "GroundCoastalGrassMinimalGlbRuntimeLoaderValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      glbRuntimeLoader: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    meshPreviewDefinition:
      options.meshPreviewDefinition ?? createDefaultMeshPreviewDefinition(),
    rendererPreviewDefinition:
      options.rendererPreviewDefinition ?? createDefaultRendererPreviewDefinition(),
    existsSync:
      typeof options.existsSync === "function" ? options.existsSync : defaultExistsSync,
    loadArrayBuffer:
      typeof options.loadArrayBuffer === "function"
        ? options.loadArrayBuffer
        : createDefaultLoadArrayBuffer(options.readFile)
  });
}

function createDefaultLoadArrayBuffer(readFileOverride) {
  const readFile =
    typeof readFileOverride === "function"
      ? readFileOverride
      : async () => {
          throw createValidationError(
            "array_buffer_loader_required",
            "Runtime GLB loader requires loadArrayBuffer or readFile in this environment."
          );
        };
  return async (glbPath) => {
    const fileBuffer = await readFile(glbPath);
    return fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );
  };
}

function createDefaultMeshPreviewDefinition() {
  return deepFreeze({
    assetId: "GROUND_COASTAL_GRASS_001",
    glbReference: {
      glbPath:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb"
    }
  });
}

function createDefaultRendererPreviewDefinition() {
  return deepFreeze({
    assetId: "GROUND_COASTAL_GRASS_001",
    lodSelection: {
      availableLods: ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP", "LOD_DISTANT_SILHOUETTE"]
    }
  });
}

function validateCompatibility(definition, meshPreviewDefinition, rendererPreviewDefinition) {
  if (definition.assetId !== meshPreviewDefinition.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Runtime GLB loader assetId must match the mesh preview integration assetId."
    );
  }

  if (definition.assetId !== rendererPreviewDefinition.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Runtime GLB loader assetId must match the renderer preview assetId."
    );
  }

  if (definition.glbReference.glbPath !== meshPreviewDefinition.glbReference.glbPath) {
    throw createValidationError(
      "glb_reference_mismatch",
      "Runtime GLB loader must target the gameplay mesh preview GLB path."
    );
  }

  if (
    !Array.isArray(rendererPreviewDefinition.lodSelection?.availableLods) ||
    !rendererPreviewDefinition.lodSelection.availableLods.includes(
      definition.glbReference.lodKey
    )
  ) {
    throw createValidationError(
      "renderer_lod_unsupported",
      "Runtime GLB loader must use a LOD supported by the controlled preview renderer path."
    );
  }

  if (definition.renderResult.rendererProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "renderer_profile_invalid",
      "Runtime GLB loader must preserve the passive Custom 2.5D preview profile."
    );
  }
}

function validateLoadedRuntime(definition) {
  if (!definition.validationResult.binaryParsed) {
    throw createValidationError(
      "binary_parse_invalid",
      "Runtime GLB loader must mark binaryParsed true after successful parsing."
    );
  }

  if (!definition.validationResult.meshExtracted) {
    throw createValidationError(
      "mesh_extraction_invalid",
      "Runtime GLB loader must extract at least one mesh primitive."
    );
  }

  if (!definition.validationResult.materialExtracted) {
    throw createValidationError(
      "material_extraction_invalid",
      "Runtime GLB loader must extract at least one material."
    );
  }
}

function parseBinaryGlb(arrayBuffer) {
  if (!(arrayBuffer instanceof ArrayBuffer) || arrayBuffer.byteLength < 20) {
    throw createValidationError(
      "invalid_glb_binary",
      "Runtime GLB loader requires a valid GLB ArrayBuffer."
    );
  }

  const view = new DataView(arrayBuffer);
  const magic = view.getUint32(0, true);
  const version = view.getUint32(4, true);
  const declaredLength = view.getUint32(8, true);

  if (magic !== 0x46546c67 || version !== 2 || declaredLength !== arrayBuffer.byteLength) {
    throw createValidationError(
      "invalid_glb_binary",
      "Runtime GLB loader encountered an invalid GLB header."
    );
  }

  const jsonChunkLength = view.getUint32(12, true);
  const jsonChunkType = view.getUint32(16, true);
  if (jsonChunkType !== 0x4e4f534a) {
    throw createValidationError(
      "invalid_glb_binary",
      "Runtime GLB loader requires a leading JSON chunk."
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
      "Runtime GLB loader could not parse the embedded glTF JSON."
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

function normalizeMeshPreviewFallback(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "meshPreviewDefinition");
  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "meshPreviewDefinition.assetId"),
    glbReference: deepFreeze({
      glbPath: normalizeRelativePath(
        definition.glbReference.glbPath,
        "meshPreviewDefinition.glbReference.glbPath"
      )
    })
  });
}

function normalizeRendererPreviewFallback(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "rendererPreviewDefinition");
  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "rendererPreviewDefinition.assetId"),
    lodSelection: deepFreeze({
      availableLods: normalizeAllowedLods(
        definition.lodSelection?.availableLods,
        "rendererPreviewDefinition.lodSelection.availableLods"
      )
    })
  });
}

function normalizeRuntimeLoaderDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "groundCoastalGrassMinimalGlbRuntimeLoader");

  for (const fieldName of groundCoastalGrassMinimalGlbRuntimeLoaderRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Runtime GLB loader definition is missing ${fieldName}.`
      );
    }
  }

  const normalized = {
    glbRuntimeLoadId: normalizePermanentId(
      definition.glbRuntimeLoadId,
      "glbRuntimeLoadId"
    ),
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    glbReference: normalizeGlbReference(definition.glbReference),
    loaderState: normalizeLoaderState(definition.loaderState),
    meshResult: normalizeMeshResult(definition.meshResult),
    materialResult: normalizeMaterialResult(definition.materialResult),
    renderResult: normalizeRenderResult(definition.renderResult),
    validationResult: normalizeValidationResult(definition.validationResult)
  };

  if (normalized.assetId !== "GROUND_COASTAL_GRASS_001") {
    throw createValidationError(
      "asset_identity_invalid",
      "Runtime GLB loader is limited to GROUND_COASTAL_GRASS_001."
    );
  }

  return deepFreeze(normalized);
}

function normalizeGlbReference(rawValue) {
  const glbReference = asPlainObject(rawValue, "glbReference");
  const lodKey = normalizeString(glbReference.lodKey, "glbReference.lodKey");
  if (!supportedLodKeys.has(lodKey)) {
    throw createValidationError(
      "invalid_lod_key",
      "Runtime GLB loader glbReference.lodKey must be supported."
    );
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
    throw createValidationError(
      "invalid_loader_state",
      "Runtime GLB loader currentState must be supported."
    );
  }
  return deepFreeze({
    currentState,
    allowedStates: normalizeAllowedStates(
      loaderState.allowedStates,
      "loaderState.allowedStates"
    ),
    fallbackEnabled: Boolean(loaderState.fallbackEnabled)
  });
}

function normalizeAllowedStates(rawValue, fieldName) {
  if (!Array.isArray(rawValue) || rawValue.length === 0) {
    throw createValidationError(
      "invalid_allowed_states",
      `${fieldName} must contain at least one supported state.`
    );
  }
  const normalized = rawValue.map((state, index) => {
    const value = normalizeString(state, `${fieldName}[${index}]`);
    if (!supportedStates.has(value)) {
      throw createValidationError(
        "invalid_allowed_states",
        `${fieldName}[${index}] must be a supported state.`
      );
    }
    return value;
  });
  return deepFreeze([...new Set(normalized)]);
}

function normalizeAllowedLods(rawValue, fieldName) {
  if (!Array.isArray(rawValue) || rawValue.length === 0) {
    throw createValidationError(
      "invalid_renderer_preview_definition",
      `${fieldName} must contain at least one supported LOD.`
    );
  }
  const normalized = rawValue.map((lodKey, index) => {
    const value = normalizeString(lodKey, `${fieldName}[${index}]`);
    if (!supportedLodKeys.has(value)) {
      throw createValidationError(
        "invalid_renderer_preview_definition",
        `${fieldName}[${index}] must be a supported LOD key.`
      );
    }
    return value;
  });
  return deepFreeze([...new Set(normalized)]);
}

function normalizeMeshResult(rawValue) {
  const meshResult = asPlainObject(rawValue, "meshResult");
  if (!Array.isArray(meshResult.projectedVertices) || meshResult.projectedVertices.length < 3) {
    throw createValidationError(
      "invalid_mesh_result",
      "Runtime GLB loader meshResult.projectedVertices must describe a drawable polygon."
    );
  }
  return deepFreeze({
    meshCount: normalizeNonNegativeInteger(meshResult.meshCount, "meshResult.meshCount"),
    primitiveCount: normalizeNonNegativeInteger(
      meshResult.primitiveCount,
      "meshResult.primitiveCount"
    ),
    vertexCount: normalizeNonNegativeInteger(meshResult.vertexCount, "meshResult.vertexCount"),
    projectedVertices: deepFreeze(
      meshResult.projectedVertices.map((vertex, index) =>
        normalizeProjectedVertex(vertex, `meshResult.projectedVertices[${index}]`)
      )
    ),
    bounds2D: normalizeBounds2D(meshResult.bounds2D)
  });
}

function normalizeMaterialResult(rawValue) {
  const materialResult = asPlainObject(rawValue, "materialResult");
  if (!Array.isArray(materialResult.materialNames)) {
    throw createValidationError(
      "invalid_material_result",
      "Runtime GLB loader materialResult.materialNames must be an array."
    );
  }
  return deepFreeze({
    materialCount: normalizeNonNegativeInteger(
      materialResult.materialCount,
      "materialResult.materialCount"
    ),
    materialNames: deepFreeze(
      materialResult.materialNames.map((name, index) =>
        normalizeString(name, `materialResult.materialNames[${index}]`)
      )
    )
  });
}

function normalizeRenderResult(rawValue) {
  const renderResult = asPlainObject(rawValue, "renderResult");
  const appearanceProfile = normalizeString(
    renderResult.appearanceProfile,
    "renderResult.appearanceProfile"
  );
  if (!supportedAppearanceProfiles.has(appearanceProfile)) {
    throw createValidationError(
      "invalid_appearance_profile",
      "Runtime GLB loader appearanceProfile must be supported."
    );
  }
  return deepFreeze({
    rendererProfile: normalizeString(renderResult.rendererProfile, "renderResult.rendererProfile"),
    displayMode: normalizeString(renderResult.displayMode, "renderResult.displayMode"),
    fallbackPlaceholder: normalizeString(
      renderResult.fallbackPlaceholder,
      "renderResult.fallbackPlaceholder"
    ),
    appearanceProfile
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

function normalizeProjectedVertex(rawValue, fieldName) {
  const vertex = asPlainObject(rawValue, fieldName);
  return deepFreeze({
    x: normalizeFiniteNumber(vertex.x, `${fieldName}.x`),
    y: normalizeFiniteNumber(vertex.y, `${fieldName}.y`)
  });
}

function normalizeBounds2D(rawValue) {
  const bounds = asPlainObject(rawValue, "meshResult.bounds2D");
  return deepFreeze({
    minX: normalizeFiniteNumber(bounds.minX, "meshResult.bounds2D.minX"),
    minY: normalizeFiniteNumber(bounds.minY, "meshResult.bounds2D.minY"),
    maxX: normalizeFiniteNumber(bounds.maxX, "meshResult.bounds2D.maxX"),
    maxY: normalizeFiniteNumber(bounds.maxY, "meshResult.bounds2D.maxY")
  });
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a permanent Asset Factory style identifier.`
    );
  }
  return normalized;
}

function normalizeRelativePath(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (!normalized) {
    throw createValidationError("invalid_relative_path", `${fieldName} must not be empty.`);
  }
  if (normalized.startsWith("/")) {
    throw createValidationError(
      "invalid_relative_path",
      `${fieldName} must remain repository-relative.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError("invalid_string", `${fieldName} must be a string.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError("invalid_string", `${fieldName} must not be empty.`);
  }
  return normalized;
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

function normalizeFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createValidationError("invalid_number", `${fieldName} must be a finite number.`);
  }
  return value;
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function createValidationError(code, message) {
  return Object.assign(
    new Error(message),
    {
      code,
      name: "GroundCoastalGrassMinimalGlbRuntimeLoaderValidationError"
    }
  );
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
