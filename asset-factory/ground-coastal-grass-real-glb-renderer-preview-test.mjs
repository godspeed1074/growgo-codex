import { existsSync as defaultExistsSync } from "node:fs";
import {
  groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition,
  validateGroundCoastalGrassRealGlbAtlasPreviewReplacement
} from "./ground-coastal-grass-real-glb-atlas-preview-replacement.mjs";
import {
  groundCoastalGrassGlbImportBridgeFoundationDefinition,
  validateGroundCoastalGrassGlbImportBridgeFoundation
} from "./ground-coastal-grass-glb-import-bridge-foundation.mjs";

export const groundCoastalGrassRealGlbRendererPreviewTestRequiredFields =
  Object.freeze([
    "realAssetRenderId",
    "assetId",
    "glbReference",
    "lodSelection",
    "renderPayload",
    "renderState",
    "verificationResult"
  ]);

export const groundCoastalGrassRealGlbRendererPreviewTestDefinition = deepFreeze({
  realAssetRenderId: "ATLAS_REAL_GLB_RENDER_PREVIEW_GROUND_COASTAL_GRASS_001",
  assetId: "GROUND_COASTAL_GRASS_001",
  glbReference: {
    glbPath:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
    manifestReference:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/ground-coastal-grass-manifest.json",
    metadataReference:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/ground-coastal-grass-metadata.json"
  },
  lodSelection: {
    currentLod: "LOD_CLOSE",
    fallbackLod: "LOD_MAP",
    availableLods: ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP", "LOD_DISTANT_SILHOUETTE"]
  },
  renderPayload: {
    rendererAssetReference: {
      assetId: "GROUND_COASTAL_GRASS_001",
      sourceType: "real-generated-glb"
    },
    rendererProfile: "custom-2.5d-passive",
    primaryGlb:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
    fallbackPlaceholder: "GROUND_PLACEHOLDER",
    appearanceProfile: "day"
  },
  renderState: {
    currentState: "validated",
    fallbackEnabled: true,
    realGeometryReady: false,
    browserPreviewReady: true
  },
  verificationResult: {
    glbExists: false,
    importBridgeValid: true,
    lodSelectionValid: true,
    rendererPayloadValid: true,
    fallbackBehaviorValid: true
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const supportedLods = Object.freeze([
  "LOD_CLOSE",
  "LOD_GAMEPLAY",
  "LOD_MAP",
  "LOD_DISTANT_SILHOUETTE"
]);
const supportedAppearanceProfiles = Object.freeze(["day", "sunset", "night"]);

export function createGroundCoastalGrassRealGlbRendererPreviewTest(
  rawDefinition = groundCoastalGrassRealGlbRendererPreviewTestDefinition
) {
  return normalizeRendererPreview(rawDefinition);
}

export function validateGroundCoastalGrassRealGlbRendererPreviewTest(
  rawDefinition = groundCoastalGrassRealGlbRendererPreviewTestDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizeRendererPreview(rawDefinition);

    const previewReplacementResult =
      normalizedOptions.validateGroundCoastalGrassRealGlbAtlasPreviewReplacement(
        normalizedOptions.previewReplacementDefinition,
        {
          existsSync: normalizedOptions.existsSync
        }
      );
    const previewReplacementDefinition =
      previewReplacementResult.ok
        ? previewReplacementResult.realGlbAtlasPreviewReplacement.definition
        : normalizePreviewReplacementFallback(
            normalizedOptions.previewReplacementDefinition
          );

    const importBridgeResult =
      normalizedOptions.validateGroundCoastalGrassGlbImportBridgeFoundation(
        normalizedOptions.importBridgeDefinition,
        {
          existsSync: normalizedOptions.existsSync
        }
      );
    const importBridgeDefinition =
      importBridgeResult.ok
        ? importBridgeResult.glbImportBridge.foundation
        : normalizeImportBridgeFallback(normalizedOptions.importBridgeDefinition);

    validateCompatibility(
      definition,
      previewReplacementDefinition,
      importBridgeDefinition,
      normalizedOptions.existsSync
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      realGlbRendererPreview: Object.freeze({
        definition,
        compatibility: Object.freeze({
          atlasAssetBindingConnected: true,
          previewRendererInputConnected: true,
          fallbackBehaviorVerified: true,
          realGeometryRenderable: definition.verificationResult.glbExists
        })
      })
    });
  } catch (error) {
    if (error?.name !== "GroundCoastalGrassRealGlbRendererPreviewTestValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      realGlbRendererPreview: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    previewReplacementDefinition:
      options.previewReplacementDefinition ??
      groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition,
    importBridgeDefinition:
      options.importBridgeDefinition ??
      groundCoastalGrassGlbImportBridgeFoundationDefinition,
    validateGroundCoastalGrassRealGlbAtlasPreviewReplacement:
      typeof options.validateGroundCoastalGrassRealGlbAtlasPreviewReplacement ===
      "function"
        ? options.validateGroundCoastalGrassRealGlbAtlasPreviewReplacement
        : validateGroundCoastalGrassRealGlbAtlasPreviewReplacement,
    validateGroundCoastalGrassGlbImportBridgeFoundation:
      typeof options.validateGroundCoastalGrassGlbImportBridgeFoundation === "function"
        ? options.validateGroundCoastalGrassGlbImportBridgeFoundation
        : validateGroundCoastalGrassGlbImportBridgeFoundation,
    existsSync:
      typeof options.existsSync === "function" ? options.existsSync : defaultExistsSync
  });
}

function validateCompatibility(
  definition,
  previewReplacement,
  importBridge,
  existsSync
) {
  if (definition.assetId !== previewReplacement.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Real GLB renderer preview assetId must match the Atlas preview replacement assetId."
    );
  }

  if (definition.assetId !== importBridge.glbRegistration.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Real GLB renderer preview assetId must match the GLB import bridge assetId."
    );
  }

  if (definition.glbReference.glbPath !== previewReplacement.importReference.glbPath) {
    throw createValidationError(
      "glb_reference_mismatch",
      "Renderer preview GLB reference must match the Atlas preview replacement GLB path."
    );
  }

  if (definition.glbReference.glbPath !== importBridge.glbRegistration.glbPath) {
    throw createValidationError(
      "glb_reference_mismatch",
      "Renderer preview GLB reference must match the GLB import bridge primary GLB path."
    );
  }

  if (
    definition.renderPayload.primaryGlb !== definition.glbReference.glbPath ||
    definition.renderPayload.rendererAssetReference.assetId !== definition.assetId
  ) {
    throw createValidationError(
      "render_payload_mismatch",
      "Renderer preview payload must preserve the selected GLB path and asset identity."
    );
  }

  if (definition.renderPayload.rendererProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "render_payload_mismatch",
      "Renderer preview payload must preserve the passive renderer profile."
    );
  }

  if (
    !definition.lodSelection.availableLods.includes(definition.lodSelection.currentLod) ||
    !definition.lodSelection.availableLods.includes(definition.lodSelection.fallbackLod)
  ) {
    throw createValidationError(
      "lod_selection_invalid",
      "Renderer preview LOD selection must preserve approved current and fallback LODs."
    );
  }

  const realGlbExists = existsSync(definition.glbReference.glbPath);
  if (realGlbExists !== definition.verificationResult.glbExists) {
    throw createValidationError(
      "glb_existence_mismatch",
      "Renderer preview verificationResult.glbExists must match actual GLB availability."
    );
  }

  if (!realGlbExists && !definition.renderState.fallbackEnabled) {
    throw createValidationError(
      "fallback_behavior_invalid",
      "Renderer preview fallback must remain enabled when the real GLB is unavailable."
    );
  }
}

function normalizePreviewReplacementFallback(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "previewReplacementDefinition"
  );
  return deepFreeze({
    assetId: normalizePermanentId(definition.assetId, "previewReplacementDefinition.assetId"),
    importReference: deepFreeze({
      glbPath: normalizeRelativePath(
        definition.importReference.glbPath,
        "previewReplacementDefinition.importReference.glbPath"
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
      glbPath: normalizeRelativePath(
        definition.glbRegistration.glbPath,
        "importBridgeDefinition.glbRegistration.glbPath"
      )
    })
  });
}

function normalizeRendererPreview(rawDefinition) {
  const definition = asPlainObject(rawDefinition, "real GLB renderer preview");
  assertRequiredFields(definition);

  return deepFreeze({
    realAssetRenderId: normalizePermanentId(
      definition.realAssetRenderId,
      "realAssetRenderId"
    ),
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    glbReference: normalizeGlbReference(definition.glbReference),
    lodSelection: normalizeLodSelection(definition.lodSelection),
    renderPayload: normalizeRenderPayload(definition.renderPayload),
    renderState: normalizeRenderState(definition.renderState),
    verificationResult: normalizeVerificationResult(definition.verificationResult)
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
    )
  });
}

function normalizeLodSelection(rawLodSelection) {
  const lodSelection = asPlainObject(rawLodSelection, "lodSelection");
  const availableLods = normalizeLodArray(
    lodSelection.availableLods,
    "lodSelection.availableLods"
  );
  return deepFreeze({
    currentLod: normalizeSupportedLod(
      lodSelection.currentLod,
      "lodSelection.currentLod"
    ),
    fallbackLod: normalizeSupportedLod(
      lodSelection.fallbackLod,
      "lodSelection.fallbackLod"
    ),
    availableLods
  });
}

function normalizeRenderPayload(rawRenderPayload) {
  const renderPayload = asPlainObject(rawRenderPayload, "renderPayload");
  const rendererAssetReference = asPlainObject(
    renderPayload.rendererAssetReference,
    "renderPayload.rendererAssetReference"
  );
  return deepFreeze({
    rendererAssetReference: deepFreeze({
      assetId: normalizePermanentId(
        rendererAssetReference.assetId,
        "renderPayload.rendererAssetReference.assetId"
      ),
      sourceType: normalizeNonEmptyString(
        rendererAssetReference.sourceType,
        "renderPayload.rendererAssetReference.sourceType"
      )
    }),
    rendererProfile: normalizeNonEmptyString(
      renderPayload.rendererProfile,
      "renderPayload.rendererProfile"
    ),
    primaryGlb: normalizeRelativePath(
      renderPayload.primaryGlb,
      "renderPayload.primaryGlb"
    ),
    fallbackPlaceholder: normalizeNonEmptyString(
      renderPayload.fallbackPlaceholder,
      "renderPayload.fallbackPlaceholder"
    ),
    appearanceProfile: normalizeAppearanceProfile(
      renderPayload.appearanceProfile,
      "renderPayload.appearanceProfile"
    )
  });
}

function normalizeRenderState(rawRenderState) {
  const renderState = asPlainObject(rawRenderState, "renderState");
  return deepFreeze({
    currentState: normalizeNonEmptyString(
      renderState.currentState,
      "renderState.currentState"
    ),
    fallbackEnabled: normalizeBoolean(
      renderState.fallbackEnabled,
      "renderState.fallbackEnabled"
    ),
    realGeometryReady: normalizeBoolean(
      renderState.realGeometryReady,
      "renderState.realGeometryReady"
    ),
    browserPreviewReady: normalizeBoolean(
      renderState.browserPreviewReady,
      "renderState.browserPreviewReady"
    )
  });
}

function normalizeVerificationResult(rawVerificationResult) {
  const verificationResult = asPlainObject(
    rawVerificationResult,
    "verificationResult"
  );
  return deepFreeze({
    glbExists: normalizeBoolean(
      verificationResult.glbExists,
      "verificationResult.glbExists"
    ),
    importBridgeValid: normalizeBoolean(
      verificationResult.importBridgeValid,
      "verificationResult.importBridgeValid"
    ),
    lodSelectionValid: normalizeBoolean(
      verificationResult.lodSelectionValid,
      "verificationResult.lodSelectionValid"
    ),
    rendererPayloadValid: normalizeBoolean(
      verificationResult.rendererPayloadValid,
      "verificationResult.rendererPayloadValid"
    ),
    fallbackBehaviorValid: normalizeBoolean(
      verificationResult.fallbackBehaviorValid,
      "verificationResult.fallbackBehaviorValid"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of groundCoastalGrassRealGlbRendererPreviewTestRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Real GLB renderer preview test is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeLodArray(value, fieldName) {
  if (!Array.isArray(value) || value.length !== supportedLods.length) {
    throw createValidationError(
      "invalid_lod_selection",
      `${fieldName} must list all supported LODs.`
    );
  }
  return deepFreeze(
    value.map((entry, index) => normalizeSupportedLod(entry, `${fieldName}[${index}]`))
  );
}

function normalizeSupportedLod(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!supportedLods.includes(normalized)) {
    throw createValidationError(
      "invalid_lod_selection",
      `Field ${fieldName} must be one of ${supportedLods.join(", ")}.`
    );
  }
  return normalized;
}

function normalizeAppearanceProfile(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName).toLowerCase();
  if (!supportedAppearanceProfiles.includes(normalized)) {
    throw createValidationError(
      "invalid_appearance_profile",
      `Field ${fieldName} must be one of ${supportedAppearanceProfiles.join(", ")}.`
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

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    realGlbRendererPreview: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "GroundCoastalGrassRealGlbRendererPreviewTestValidationError";
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
