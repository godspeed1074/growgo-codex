import { existsSync as defaultExistsSync } from "node:fs";
import {
  groundCoastalGrassRealGlbRendererPreviewTestDefinition,
  validateGroundCoastalGrassRealGlbRendererPreviewTest
} from "./ground-coastal-grass-real-glb-renderer-preview-test.mjs";
import {
  groundCoastalGrassGlbImportBridgeFoundationDefinition,
  validateGroundCoastalGrassGlbImportBridgeFoundation
} from "./ground-coastal-grass-glb-import-bridge-foundation.mjs";

export const groundCoastalGrassRealGlbMeshPreviewIntegrationRequiredFields =
  Object.freeze([
    "glbPreviewId",
    "assetId",
    "glbReference",
    "loadState",
    "meshData",
    "renderResult",
    "validationResult"
  ]);

export const groundCoastalGrassRealGlbMeshPreviewIntegrationStates =
  Object.freeze([
    "requested",
    "loading",
    "loaded",
    "displaying",
    "verified",
    "failed",
    "closed"
  ]);

export const groundCoastalGrassRealGlbMeshPreviewIntegrationDefinition =
  deepFreeze({
    glbPreviewId: "ATLAS_REAL_GLB_MESH_PREVIEW_GROUND_COASTAL_GRASS_001",
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
    loadState: {
      currentState: "requested",
      allowedStates: groundCoastalGrassRealGlbMeshPreviewIntegrationStates,
      fallbackEnabled: true
    },
    meshData: {
      vertexCount: 4,
      materialCount: 2,
      primitiveType: "triangle-strip",
      bounds2D: {
        minX: 0.0,
        minY: 0.0,
        maxX: 1.0,
        maxY: 0.35
      },
      projectedVertices: [
        { x: 0.0, y: 0.34 },
        { x: 0.28, y: 0.08 },
        { x: 0.72, y: 0.12 },
        { x: 1.0, y: 0.32 }
      ],
      materials: [
        "COASTAL_GROUND_BASE_SHARED_001",
        "COASTAL_GROUND_DETAIL_SHARED_001"
      ]
    },
    renderResult: {
      rendererProfile: "custom-2.5d-passive",
      displayMode: "mesh-projected-preview",
      fallbackPlaceholder: "GROUND_PLACEHOLDER",
      appearanceProfile: "day"
    },
    validationResult: {
      glbAvailable: false,
      assetIdentityValid: true,
      meshLoaded: false,
      materialsLoaded: false,
      rendererCompatibilityValid: true,
      fallbackBehaviorValid: true
    }
  });

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedStates = new Set(groundCoastalGrassRealGlbMeshPreviewIntegrationStates);
const supportedAppearanceProfiles = new Set(["day", "sunset", "night"]);
const supportedLodKeys = new Set([
  "LOD_CLOSE",
  "LOD_GAMEPLAY",
  "LOD_MAP",
  "LOD_DISTANT_SILHOUETTE"
]);

export function createGroundCoastalGrassRealGlbMeshPreviewIntegration(
  rawDefinition = groundCoastalGrassRealGlbMeshPreviewIntegrationDefinition
) {
  return normalizeMeshPreviewDefinition(rawDefinition);
}

export function validateGroundCoastalGrassRealGlbMeshPreviewIntegration(
  rawDefinition = groundCoastalGrassRealGlbMeshPreviewIntegrationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeMeshPreviewDefinition(rawDefinition);

    const rendererPreviewResult =
      normalizedOptions.validateGroundCoastalGrassRealGlbRendererPreviewTest(
        normalizedOptions.rendererPreviewDefinition,
        { existsSync: normalizedOptions.existsSync }
      );
    const rendererPreviewDefinition = rendererPreviewResult.ok
      ? rendererPreviewResult.realGlbRendererPreview.definition
      : normalizeRendererPreviewFallback(normalizedOptions.rendererPreviewDefinition);

    const importBridgeResult =
      normalizedOptions.validateGroundCoastalGrassGlbImportBridgeFoundation(
        normalizedOptions.importBridgeDefinition,
        { existsSync: normalizedOptions.existsSync }
      );
    const importBridgeDefinition = importBridgeResult.ok
      ? importBridgeResult.glbImportBridge.foundation
      : normalizeImportBridgeFallback(normalizedOptions.importBridgeDefinition);

    validateCompatibility(
      definition,
      rendererPreviewDefinition,
      importBridgeDefinition,
      normalizedOptions.existsSync
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      realGlbMeshPreview: Object.freeze({
        definition,
        compatibility: Object.freeze({
          glbImportBridgeConnected: true,
          previewRendererInputConnected: true,
          fallbackBehaviorVerified: true,
          actualMeshGeometryReady: definition.validationResult.meshLoaded
        })
      })
    });
  } catch (error) {
    if (error?.name !== "GroundCoastalGrassRealGlbMeshPreviewIntegrationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      realGlbMeshPreview: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    rendererPreviewDefinition:
      options.rendererPreviewDefinition ??
      groundCoastalGrassRealGlbRendererPreviewTestDefinition,
    importBridgeDefinition:
      options.importBridgeDefinition ??
      groundCoastalGrassGlbImportBridgeFoundationDefinition,
    validateGroundCoastalGrassRealGlbRendererPreviewTest:
      typeof options.validateGroundCoastalGrassRealGlbRendererPreviewTest === "function"
        ? options.validateGroundCoastalGrassRealGlbRendererPreviewTest
        : validateGroundCoastalGrassRealGlbRendererPreviewTest,
    validateGroundCoastalGrassGlbImportBridgeFoundation:
      typeof options.validateGroundCoastalGrassGlbImportBridgeFoundation === "function"
        ? options.validateGroundCoastalGrassGlbImportBridgeFoundation
        : validateGroundCoastalGrassGlbImportBridgeFoundation,
    existsSync:
      typeof options.existsSync === "function" ? options.existsSync : defaultExistsSync
  });
}

function validateCompatibility(definition, rendererPreviewDefinition, importBridgeDefinition, existsSync) {
  if (definition.assetId !== rendererPreviewDefinition.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "GLB mesh preview assetId must match the real renderer preview assetId."
    );
  }

  if (definition.assetId !== importBridgeDefinition.glbRegistration.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "GLB mesh preview assetId must match the GLB import bridge assetId."
    );
  }

  if (definition.glbReference.glbPath !== importBridgeDefinition.glbRegistration.lodReferences.LOD_GAMEPLAY) {
    throw createValidationError(
      "glb_reference_mismatch",
      "GLB mesh preview must target the gameplay GLB output."
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
      "GLB mesh preview must use a LOD supported by the controlled renderer preview path."
    );
  }

  const glbAvailable = existsSync(definition.glbReference.glbPath);
  if (glbAvailable !== definition.validationResult.glbAvailable) {
    throw createValidationError(
      "glb_availability_mismatch",
      "GLB mesh preview validationResult.glbAvailable must match actual GLB availability."
    );
  }

  if (glbAvailable && !definition.validationResult.meshLoaded) {
    throw createValidationError(
      "mesh_loading_invalid",
      "GLB mesh preview must mark meshLoaded true when the gameplay GLB is available."
    );
  }

  if (glbAvailable && !definition.validationResult.materialsLoaded) {
    throw createValidationError(
      "material_loading_invalid",
      "GLB mesh preview must mark materialsLoaded true when the gameplay GLB is available."
    );
  }

  if (!glbAvailable && !definition.loadState.fallbackEnabled) {
    throw createValidationError(
      "fallback_behavior_invalid",
      "GLB mesh preview fallback must remain enabled when the gameplay GLB is unavailable."
    );
  }
}

function normalizeRendererPreviewFallback(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "rendererPreviewDefinition");
  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "rendererPreviewDefinition.assetId"),
    glbReference: deepFreeze({
      glbPath: normalizeRelativePath(
        definition.glbReference.glbPath,
        "rendererPreviewDefinition.glbReference.glbPath"
      )
    }),
    lodSelection: deepFreeze({
      availableLods: normalizeAllowedLods(
        definition.lodSelection?.availableLods,
        "rendererPreviewDefinition.lodSelection.availableLods"
      )
    })
  });
}

function normalizeImportBridgeFallback(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "importBridgeDefinition");
  return deepFreeze({
    glbRegistration: deepFreeze({
      assetId: normalizePermanentId(
        definition.glbRegistration.assetId,
        "importBridgeDefinition.glbRegistration.assetId"
      ),
      lodReferences: deepFreeze({
        LOD_GAMEPLAY: normalizeRelativePath(
          definition.glbRegistration.lodReferences.LOD_GAMEPLAY,
          "importBridgeDefinition.glbRegistration.lodReferences.LOD_GAMEPLAY"
        )
      })
    })
  });
}

function normalizeAllowedLods(rawValue, fieldName) {
  if (!Array.isArray(rawValue) || rawValue.length === 0) {
    throw createValidationError(
      "invalid_renderer_preview_definition",
      `${fieldName} must contain at least one supported LOD.`
    );
  }

  const normalized = rawValue.map((lodKey, index) => {
    if (!supportedLodKeys.has(lodKey)) {
      throw createValidationError(
        "invalid_renderer_preview_definition",
        `${fieldName}[${index}] must be a supported LOD key.`
      );
    }
    return lodKey;
  });

  return deepFreeze([...new Set(normalized)]);
}

function normalizeMeshPreviewDefinition(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "real GLB mesh preview");
  assertRequiredFields(definition);

  return deepFreeze({
    glbPreviewId: normalizePermanentId(definition.glbPreviewId, "glbPreviewId"),
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    glbReference: normalizeGlbReference(definition.glbReference),
    loadState: normalizeLoadState(definition.loadState),
    meshData: normalizeMeshData(definition.meshData),
    renderResult: normalizeRenderResult(definition.renderResult),
    validationResult: normalizeValidationResult(definition.validationResult)
  });
}

function normalizeGlbReference(rawGlbReference) {
  const glbReference = asPlainObject(rawGlbReference, "glbReference");
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
    lodKey: normalizeSupportedLod(glbReference.lodKey, "glbReference.lodKey")
  });
}

function normalizeLoadState(rawLoadState) {
  const loadState = asPlainObject(rawLoadState, "loadState");
  const currentState = normalizeNonEmptyString(loadState.currentState, "loadState.currentState");
  if (!supportedStates.has(currentState)) {
    throw createValidationError(
      "invalid_load_state",
      `loadState.currentState must be one of ${Array.from(supportedStates).join(", ")}.`
    );
  }
  if (!Array.isArray(loadState.allowedStates) || loadState.allowedStates.length !== groundCoastalGrassRealGlbMeshPreviewIntegrationStates.length) {
    throw createValidationError(
      "invalid_load_state",
      "loadState.allowedStates must preserve the approved GLB preview load states."
    );
  }
  return deepFreeze({
    currentState,
    allowedStates: deepFreeze(
      loadState.allowedStates.map((state, index) =>
        normalizeNonEmptyString(state, `loadState.allowedStates[${index}]`)
      )
    ),
    fallbackEnabled: normalizeBoolean(loadState.fallbackEnabled, "loadState.fallbackEnabled")
  });
}

function normalizeMeshData(rawMeshData) {
  const meshData = asPlainObject(rawMeshData, "meshData");
  const bounds2D = asPlainObject(meshData.bounds2D, "meshData.bounds2D");
  if (!Array.isArray(meshData.projectedVertices) || meshData.projectedVertices.length < 3) {
    throw createValidationError(
      "invalid_mesh_data",
      "meshData.projectedVertices must contain at least three projected points."
    );
  }
  if (!Array.isArray(meshData.materials) || meshData.materials.length === 0) {
    throw createValidationError(
      "invalid_mesh_data",
      "meshData.materials must contain at least one material reference."
    );
  }
  return deepFreeze({
    vertexCount: normalizePositiveInteger(meshData.vertexCount, "meshData.vertexCount"),
    materialCount: normalizePositiveInteger(meshData.materialCount, "meshData.materialCount"),
    primitiveType: normalizeNonEmptyString(meshData.primitiveType, "meshData.primitiveType"),
    bounds2D: deepFreeze({
      minX: normalizeNumber(bounds2D.minX, "meshData.bounds2D.minX"),
      minY: normalizeNumber(bounds2D.minY, "meshData.bounds2D.minY"),
      maxX: normalizeNumber(bounds2D.maxX, "meshData.bounds2D.maxX"),
      maxY: normalizeNumber(bounds2D.maxY, "meshData.bounds2D.maxY")
    }),
    projectedVertices: deepFreeze(
      meshData.projectedVertices.map((vertex, index) => {
        const point = asPlainObject(vertex, `meshData.projectedVertices[${index}]`);
        return deepFreeze({
          x: normalizeNumber(point.x, `meshData.projectedVertices[${index}].x`),
          y: normalizeNumber(point.y, `meshData.projectedVertices[${index}].y`)
        });
      })
    ),
    materials: deepFreeze(
      meshData.materials.map((material, index) =>
        normalizeNonEmptyString(material, `meshData.materials[${index}]`)
      )
    )
  });
}

function normalizeRenderResult(rawRenderResult) {
  const renderResult = asPlainObject(rawRenderResult, "renderResult");
  return deepFreeze({
    rendererProfile: normalizeNonEmptyString(
      renderResult.rendererProfile,
      "renderResult.rendererProfile"
    ),
    displayMode: normalizeNonEmptyString(
      renderResult.displayMode,
      "renderResult.displayMode"
    ),
    fallbackPlaceholder: normalizeNonEmptyString(
      renderResult.fallbackPlaceholder,
      "renderResult.fallbackPlaceholder"
    ),
    appearanceProfile: normalizeAppearanceProfile(
      renderResult.appearanceProfile,
      "renderResult.appearanceProfile"
    )
  });
}

function normalizeValidationResult(rawValidationResult) {
  const validationResult = asPlainObject(rawValidationResult, "validationResult");
  return deepFreeze({
    glbAvailable: normalizeBoolean(
      validationResult.glbAvailable,
      "validationResult.glbAvailable"
    ),
    assetIdentityValid: normalizeBoolean(
      validationResult.assetIdentityValid,
      "validationResult.assetIdentityValid"
    ),
    meshLoaded: normalizeBoolean(
      validationResult.meshLoaded,
      "validationResult.meshLoaded"
    ),
    materialsLoaded: normalizeBoolean(
      validationResult.materialsLoaded,
      "validationResult.materialsLoaded"
    ),
    rendererCompatibilityValid: normalizeBoolean(
      validationResult.rendererCompatibilityValid,
      "validationResult.rendererCompatibilityValid"
    ),
    fallbackBehaviorValid: normalizeBoolean(
      validationResult.fallbackBehaviorValid,
      "validationResult.fallbackBehaviorValid"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of groundCoastalGrassRealGlbMeshPreviewIntegrationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Real GLB mesh preview integration is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeSupportedLod(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!supportedLodKeys.has(normalized)) {
    throw createValidationError(
      "invalid_lod_selection",
      `Field ${fieldName} must be one of ${Array.from(supportedLodKeys).join(", ")}.`
    );
  }
  return normalized;
}

function normalizeAppearanceProfile(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName).toLowerCase();
  if (!supportedAppearanceProfiles.has(normalized)) {
    throw createValidationError(
      "invalid_appearance_profile",
      `Field ${fieldName} must be one of ${Array.from(supportedAppearanceProfiles).join(", ")}.`
    );
  }
  return normalized;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `Field ${fieldName} must be a permanent uppercase Asset Factory identifier.`
    );
  }
  return normalized;
}

function normalizeRelativePath(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (normalized.startsWith("/")) {
    throw createValidationError(
      "invalid_relative_path",
      `Field ${fieldName} must be a repo-relative path.`
    );
  }
  return normalized;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError("invalid_boolean", `Field ${fieldName} must be a boolean.`);
  }
  return value;
}

function normalizeNumber(value, fieldName) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw createValidationError("invalid_number", `Field ${fieldName} must be a number.`);
  }
  return value;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createValidationError(
      "invalid_positive_integer",
      `Field ${fieldName} must be a positive integer.`
    );
  }
  return value;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError("invalid_string", `Field ${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${label} must be a plain object.`);
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "GroundCoastalGrassRealGlbMeshPreviewIntegrationValidationError";
  error.code = code;
  return error;
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
