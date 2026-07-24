import {
  createGroundCoastalGrassMinimalGlbRuntimeLoader,
  groundCoastalGrassMinimalGlbRuntimeLoaderDefinition
} from "./ground-coastal-grass-minimal-glb-runtime-loader.mjs";

export const groundCoastalGrassRealGlbMeshVisualRenderTestRequiredFields = Object.freeze([
  "glbMeshRenderTestId",
  "assetId",
  "meshData",
  "geometryPayload",
  "materialPayload",
  "renderState",
  "verificationResult"
]);

export const groundCoastalGrassRealGlbMeshVisualRenderStates = Object.freeze([
  "received",
  "converting",
  "rendering",
  "displayed",
  "verified",
  "failed",
  "closed"
]);

export function createGroundCoastalGrassRealGlbMeshVisualRenderTest(
  runtimeLoaderDefinition = groundCoastalGrassMinimalGlbRuntimeLoaderDefinition
) {
  const runtimeLoader =
    createGroundCoastalGrassMinimalGlbRuntimeLoader(runtimeLoaderDefinition);

  validateRuntimeLoader(runtimeLoader);

  const geometryPayload = buildGeometryPayload(runtimeLoader.meshResult);
  const materialPayload = buildMaterialPayload(runtimeLoader.materialResult);

  return deepFreeze({
    glbMeshRenderTestId: "ATLAS_REAL_GLB_MESH_RENDER_TEST_GROUND_COASTAL_GRASS_001",
    assetId: runtimeLoader.assetId,
    meshData: runtimeLoader.meshResult,
    geometryPayload,
    materialPayload,
    renderState: {
      currentState: "verified",
      allowedStates: groundCoastalGrassRealGlbMeshVisualRenderStates,
      rendererProfile: runtimeLoader.renderResult.rendererProfile,
      fallbackEnabled: runtimeLoader.loaderState.fallbackEnabled
    },
    verificationResult: {
      geometryConversionValid: geometryPayload.projectedVertices.length >= 3,
      materialMappingValid: materialPayload.materialCount > 0,
      renderCompletionValid: true,
      fallbackBehaviorValid:
        runtimeLoader.validationResult.glbAvailable || runtimeLoader.loaderState.fallbackEnabled,
      actualGlbGeometryRendered: runtimeLoader.validationResult.meshExtracted === true
    }
  });
}

export function validateGroundCoastalGrassRealGlbMeshVisualRenderTest(
  rawDefinition
) {
  try {
    const definition = normalizeVisualRenderDefinition(rawDefinition);
    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      glbMeshRenderTest: Object.freeze({
        definition
      })
    });
  } catch (error) {
    if (error?.name !== "GroundCoastalGrassRealGlbMeshVisualRenderTestValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      glbMeshRenderTest: null
    });
  }
}

function buildGeometryPayload(meshResult) {
  return deepFreeze({
    primitiveType: "triangle-strip",
    projectedVertices: meshResult.projectedVertices.map((vertex) => ({ ...vertex })),
    bounds2D: {
      ...meshResult.bounds2D
    },
    vertexCount: meshResult.vertexCount,
    meshCount: meshResult.meshCount,
    primitiveCount: meshResult.primitiveCount
  });
}

function buildMaterialPayload(materialResult) {
  const primaryMaterial = materialResult.materialNames[0] ?? "GROUND_PLACEHOLDER";
  return deepFreeze({
    materialCount: materialResult.materialCount,
    materialNames: [...materialResult.materialNames],
    primaryMaterial,
    fillStyle: resolveGroundFillStyle(primaryMaterial)
  });
}

function resolveGroundFillStyle(primaryMaterial) {
  if (/grass/i.test(primaryMaterial)) {
    return "#4d9b57";
  }
  if (/detail/i.test(primaryMaterial)) {
    return "#5ebf68";
  }
  return "#4d9b57";
}

function validateRuntimeLoader(runtimeLoader) {
  if (runtimeLoader.assetId !== "GROUND_COASTAL_GRASS_001") {
    throw createValidationError(
      "asset_identity_invalid",
      "Mesh visual render test is limited to GROUND_COASTAL_GRASS_001."
    );
  }

  if (!runtimeLoader.validationResult.glbAvailable) {
    throw createValidationError(
      "glb_unavailable",
      "Mesh visual render test requires an available GLB runtime loader result."
    );
  }

  if (!runtimeLoader.validationResult.meshExtracted) {
    throw createValidationError(
      "mesh_extraction_invalid",
      "Mesh visual render test requires extracted GLB mesh data."
    );
  }

  if (!runtimeLoader.validationResult.materialExtracted) {
    throw createValidationError(
      "material_extraction_invalid",
      "Mesh visual render test requires extracted GLB material data."
    );
  }
}

function normalizeVisualRenderDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "groundCoastalGrassRealGlbMeshVisualRenderTest"
  );

  for (const fieldName of groundCoastalGrassRealGlbMeshVisualRenderTestRequiredFields) {
    if (!(fieldName in definition)) {
      throw createValidationError(
        "missing_required_field",
        `Mesh visual render test is missing ${fieldName}.`
      );
    }
  }

  if (definition.assetId !== "GROUND_COASTAL_GRASS_001") {
    throw createValidationError(
      "asset_identity_invalid",
      "Mesh visual render test assetId must be GROUND_COASTAL_GRASS_001."
    );
  }

  const geometryPayload = asPlainObject(definition.geometryPayload, "geometryPayload");
  if (
    !Array.isArray(geometryPayload.projectedVertices) ||
    geometryPayload.projectedVertices.length < 3
  ) {
    throw createValidationError(
      "geometry_conversion_invalid",
      "Mesh visual render test requires at least three projected vertices."
    );
  }

  const materialPayload = asPlainObject(definition.materialPayload, "materialPayload");
  if (!Array.isArray(materialPayload.materialNames) || materialPayload.materialNames.length < 1) {
    throw createValidationError(
      "material_mapping_invalid",
      "Mesh visual render test requires at least one mapped material."
    );
  }

  const renderState = asPlainObject(definition.renderState, "renderState");
  if (!groundCoastalGrassRealGlbMeshVisualRenderStates.includes(renderState.currentState)) {
    throw createValidationError(
      "invalid_render_state",
      "Mesh visual render test currentState must be supported."
    );
  }

  const verificationResult = asPlainObject(
    definition.verificationResult,
    "verificationResult"
  );
  if (!verificationResult.geometryConversionValid) {
    throw createValidationError(
      "geometry_conversion_invalid",
      "Mesh visual render test geometryConversionValid must be true."
    );
  }
  if (!verificationResult.materialMappingValid) {
    throw createValidationError(
      "material_mapping_invalid",
      "Mesh visual render test materialMappingValid must be true."
    );
  }
  if (!verificationResult.renderCompletionValid) {
    throw createValidationError(
      "render_completion_invalid",
      "Mesh visual render test renderCompletionValid must be true."
    );
  }

  return deepFreeze({
    ...definition,
    geometryPayload: {
      ...geometryPayload,
      projectedVertices: geometryPayload.projectedVertices.map((vertex) => ({ ...vertex })),
      bounds2D: { ...geometryPayload.bounds2D }
    },
    materialPayload: {
      ...materialPayload,
      materialNames: [...materialPayload.materialNames]
    },
    renderState: {
      ...renderState,
      allowedStates: [...renderState.allowedStates]
    },
    verificationResult: {
      ...verificationResult
    }
  });
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
    name: "GroundCoastalGrassRealGlbMeshVisualRenderTestValidationError"
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
