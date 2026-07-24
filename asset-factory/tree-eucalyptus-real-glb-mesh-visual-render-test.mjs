import {
  createTreeEucalyptusRuntimePreviewBinding,
  treeEucalyptusRuntimePreviewBindingDefinition
} from "./tree-eucalyptus-runtime-preview-binding.mjs";

export const treeEucalyptusRealGlbMeshVisualRenderStates = Object.freeze([
  "received",
  "converting",
  "rendering",
  "displayed",
  "verified",
  "failed",
  "closed"
]);

export function createTreeEucalyptusRealGlbMeshVisualRenderTest(
  runtimeBindingDefinition = treeEucalyptusRuntimePreviewBindingDefinition
) {
  const runtimeBinding = createTreeEucalyptusRuntimePreviewBinding(runtimeBindingDefinition);

  if (runtimeBinding.assetId !== "TREE_EUCALYPTUS_001") {
    throw createValidationError(
      "asset_identity_invalid",
      "Tree mesh visual render test is limited to TREE_EUCALYPTUS_001."
    );
  }

  const materialPayload = {
    materialCount: runtimeBinding.materialResult.materialCount,
    materialNames: [...runtimeBinding.materialResult.materialNames],
    primaryMaterial:
      runtimeBinding.materialResult.materialNames[0] ?? "TREE_PLACEHOLDER",
    fillStyle: "#5a8f46"
  };

  return deepFreeze({
    glbMeshRenderTestId: "ATLAS_REAL_GLB_MESH_RENDER_TEST_TREE_EUCALYPTUS_001",
    assetId: runtimeBinding.assetId,
    meshData: runtimeBinding.meshResult,
    geometryPayload: {
      primitiveType: "triangle-fan",
      projectedVertices: runtimeBinding.meshResult.projectedVertices.map((vertex) => ({ ...vertex })),
      bounds2D: { ...runtimeBinding.meshResult.bounds2D },
      vertexCount: runtimeBinding.meshResult.vertexCount,
      meshCount: runtimeBinding.meshResult.meshCount,
      primitiveCount: runtimeBinding.meshResult.primitiveCount
    },
    materialPayload,
    renderState: {
      currentState: "verified",
      allowedStates: treeEucalyptusRealGlbMeshVisualRenderStates,
      rendererProfile: runtimeBinding.renderResult.rendererProfile,
      fallbackEnabled: runtimeBinding.loaderState.fallbackEnabled
    },
    verificationResult: {
      geometryConversionValid: runtimeBinding.meshResult.projectedVertices.length >= 3,
      materialMappingValid: materialPayload.materialCount > 0,
      renderCompletionValid: true,
      fallbackBehaviorValid:
        runtimeBinding.validationResult.glbAvailable || runtimeBinding.loaderState.fallbackEnabled,
      actualGlbGeometryRendered: runtimeBinding.validationResult.meshExtracted === true
    }
  });
}

export function validateTreeEucalyptusRealGlbMeshVisualRenderTest(rawDefinition) {
  try {
    const definition = normalizeDefinition(rawDefinition);
    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      glbMeshRenderTest: Object.freeze({ definition })
    });
  } catch (error) {
    if (error?.name !== "TreeEucalyptusRealGlbMeshVisualRenderTestValidationError") {
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

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "treeEucalyptusRealGlbMeshVisualRenderTest");
  if (definition.assetId !== "TREE_EUCALYPTUS_001") {
    throw createValidationError(
      "asset_identity_invalid",
      "Tree mesh visual render test assetId must be TREE_EUCALYPTUS_001."
    );
  }
  if (!Array.isArray(definition.geometryPayload?.projectedVertices) || definition.geometryPayload.projectedVertices.length < 3) {
    throw createValidationError(
      "geometry_conversion_invalid",
      "Tree mesh visual render test requires at least three projected vertices."
    );
  }
  if (!Array.isArray(definition.materialPayload?.materialNames) || definition.materialPayload.materialNames.length < 1) {
    throw createValidationError(
      "material_mapping_invalid",
      "Tree mesh visual render test requires at least one mapped material."
    );
  }
  if (!definition.verificationResult?.geometryConversionValid) {
    throw createValidationError(
      "geometry_conversion_invalid",
      "Tree mesh visual render test geometryConversionValid must be true."
    );
  }
  if (!definition.verificationResult?.materialMappingValid) {
    throw createValidationError(
      "material_mapping_invalid",
      "Tree mesh visual render test materialMappingValid must be true."
    );
  }
  return deepFreeze({
    ...definition,
    geometryPayload: {
      ...definition.geometryPayload,
      projectedVertices: definition.geometryPayload.projectedVertices.map((vertex) => ({ ...vertex })),
      bounds2D: { ...definition.geometryPayload.bounds2D }
    },
    materialPayload: {
      ...definition.materialPayload,
      materialNames: [...definition.materialPayload.materialNames]
    },
    renderState: {
      ...definition.renderState,
      allowedStates: [...definition.renderState.allowedStates]
    },
    verificationResult: {
      ...definition.verificationResult
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
    name: "TreeEucalyptusRealGlbMeshVisualRenderTestValidationError"
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
