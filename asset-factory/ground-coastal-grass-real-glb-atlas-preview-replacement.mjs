import { existsSync as defaultExistsSync } from "node:fs";
import {
  groundCoastalGrassGlbImportBridgeFoundationDefinition,
  validateGroundCoastalGrassGlbImportBridgeFoundation
} from "./ground-coastal-grass-glb-import-bridge-foundation.mjs";
import {
  groundCoastalGrassPrototypeAssetPackageDefinition,
  validateGroundCoastalGrassPrototypeAssetPackage
} from "./ground-coastal-grass-prototype-asset-package.mjs";

export const groundCoastalGrassRealGlbAtlasPreviewReplacementRequiredFields =
  Object.freeze([
    "assetPreviewId",
    "assetId",
    "importReference",
    "lodSelection",
    "rendererPayload",
    "previewState",
    "validationResult"
  ]);

export const groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition =
  deepFreeze({
    assetPreviewId: "ATLAS_REAL_GLB_PREVIEW_GROUND_COASTAL_GRASS_001",
    assetId: "GROUND_COASTAL_GRASS_001",
    importReference: {
      importBridgeId: "GROUND_COASTAL_GRASS_GLB_IMPORT_BRIDGE_001",
      glbPath:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
      manifestReference:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/ground-coastal-grass-manifest.json",
      metadataReference:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/ground-coastal-grass-metadata.json"
    },
    lodSelection: {
      currentLod: "LOD_CLOSE",
      availableLods: ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP", "LOD_DISTANT_SILHOUETTE"],
      lodSelector: {
        close: "LOD_CLOSE",
        gameplay: "LOD_GAMEPLAY",
        map: "LOD_MAP",
        distantSilhouette: "LOD_DISTANT_SILHOUETTE"
      }
    },
    rendererPayload: {
      rendererAssetReference: {
        assetId: "GROUND_COASTAL_GRASS_001",
        sourceType: "real-generated-glb"
      },
      primaryGlb:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
      lodGlb:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
      rendererProfile: "custom-2.5d-passive",
      appearanceProfile: "day"
    },
    previewState: {
      currentState: "validated",
      placeholderGroundReplaced: true,
      browserPreviewReady: true
    },
    validationResult: {
      glbExists: false,
      manifestValid: true,
      metadataValid: true,
      lodSelectionValid: true,
      rendererPayloadValid: true
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

export function createGroundCoastalGrassRealGlbAtlasPreviewReplacement(
  rawDefinition = groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition
) {
  return normalizePreviewReplacement(rawDefinition);
}

export function validateGroundCoastalGrassRealGlbAtlasPreviewReplacement(
  rawDefinition = groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const definition = normalizePreviewReplacement(rawDefinition);

    const bridgeResult =
      normalizedOptions.validateGroundCoastalGrassGlbImportBridgeFoundation(
        normalizedOptions.importBridgeDefinition,
        {
          existsSync: normalizedOptions.existsSync
        }
      );
    if (!bridgeResult.ok) {
      return freezeFailure(bridgeResult);
    }

    const packageResult =
      normalizedOptions.validateGroundCoastalGrassPrototypeAssetPackage(
        normalizedOptions.assetPackageDefinition
      );
    if (!packageResult.ok) {
      return freezeFailure(packageResult);
    }

    validateCompatibility(
      definition,
      bridgeResult.glbImportBridge.foundation,
      packageResult.prototypeAssetPackage.package,
      normalizedOptions.existsSync
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      realGlbAtlasPreviewReplacement: Object.freeze({
        definition,
        compatibility: Object.freeze({
          importBridgeVerified: true,
          prototypeAssetPackageVerified: true,
          atlasPreviewBindingVerified: true
        })
      })
    });
  } catch (error) {
    if (
      error?.name !== "GroundCoastalGrassRealGlbAtlasPreviewReplacementValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      realGlbAtlasPreviewReplacement: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    importBridgeDefinition:
      options.importBridgeDefinition ??
      groundCoastalGrassGlbImportBridgeFoundationDefinition,
    assetPackageDefinition:
      options.assetPackageDefinition ?? groundCoastalGrassPrototypeAssetPackageDefinition,
    validateGroundCoastalGrassGlbImportBridgeFoundation:
      typeof options.validateGroundCoastalGrassGlbImportBridgeFoundation === "function"
        ? options.validateGroundCoastalGrassGlbImportBridgeFoundation
        : validateGroundCoastalGrassGlbImportBridgeFoundation,
    validateGroundCoastalGrassPrototypeAssetPackage:
      typeof options.validateGroundCoastalGrassPrototypeAssetPackage === "function"
        ? options.validateGroundCoastalGrassPrototypeAssetPackage
        : validateGroundCoastalGrassPrototypeAssetPackage,
    existsSync:
      typeof options.existsSync === "function" ? options.existsSync : defaultExistsSync
  });
}

function validateCompatibility(definition, importBridge, assetPackage, existsSync) {
  if (definition.assetId !== importBridge.glbRegistration.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Real GLB Atlas preview replacement assetId must match the GLB import bridge assetId."
    );
  }

  if (definition.assetId !== assetPackage.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Real GLB Atlas preview replacement assetId must match the prototype asset package assetId."
    );
  }

  if (definition.importReference.glbPath !== importBridge.glbRegistration.glbPath) {
    throw createValidationError(
      "import_reference_mismatch",
      "Preview importReference.glbPath must match the GLB import bridge primary GLB path."
    );
  }

  if (
    definition.importReference.manifestReference !==
    importBridge.glbRegistration.manifestReference
  ) {
    throw createValidationError(
      "manifest_reference_mismatch",
      "Preview manifest reference must match the GLB import bridge manifest reference."
    );
  }

  if (
    definition.importReference.metadataReference !==
    importBridge.glbRegistration.metadataReference
  ) {
    throw createValidationError(
      "metadata_reference_mismatch",
      "Preview metadata reference must match the GLB import bridge metadata reference."
    );
  }

  if (
    definition.rendererPayload.primaryGlb !== importBridge.glbRegistration.glbPath ||
    definition.rendererPayload.lodGlb !==
      importBridge.glbRegistration.lodReferences[definition.lodSelection.currentLod]
  ) {
    throw createValidationError(
      "renderer_payload_mismatch",
      "Preview renderer payload must point to the selected GLB import bridge LOD paths."
    );
  }

  if (
    definition.rendererPayload.rendererAssetReference.assetId !== definition.assetId ||
    definition.rendererPayload.rendererProfile !== "custom-2.5d-passive"
  ) {
    throw createValidationError(
      "renderer_payload_mismatch",
      "Preview renderer payload must preserve the assetId and passive renderer profile."
    );
  }

  if (!definition.previewState.placeholderGroundReplaced) {
    throw createValidationError(
      "preview_state_invalid",
      "Preview replacement must explicitly mark the placeholder ground as replaced."
    );
  }

  const allExpectedFiles = [
    definition.importReference.glbPath,
    definition.importReference.manifestReference,
    definition.importReference.metadataReference,
    definition.rendererPayload.lodGlb
  ];
  for (const filePath of allExpectedFiles) {
    if (!existsSync(filePath)) {
      throw createValidationError(
        "preview_asset_missing",
        `Real GLB preview replacement requires existing import files before browser preview binding: ${filePath}`
      );
    }
  }
}

function normalizePreviewReplacement(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "real GLB Atlas preview replacement"
  );
  assertRequiredFields(definition);

  return deepFreeze({
    assetPreviewId: normalizePermanentId(definition.assetPreviewId, "assetPreviewId"),
    assetId: normalizePermanentId(definition.assetId, "assetId"),
    importReference: normalizeImportReference(definition.importReference),
    lodSelection: normalizeLodSelection(definition.lodSelection),
    rendererPayload: normalizeRendererPayload(definition.rendererPayload),
    previewState: normalizePreviewState(definition.previewState),
    validationResult: normalizeValidationResult(definition.validationResult)
  });
}

function normalizeImportReference(rawImportReference) {
  const importReference = asPlainObject(rawImportReference, "importReference");
  return deepFreeze({
    importBridgeId: normalizePermanentId(
      importReference.importBridgeId,
      "importReference.importBridgeId"
    ),
    glbPath: normalizeRelativePath(importReference.glbPath, "importReference.glbPath"),
    manifestReference: normalizeRelativePath(
      importReference.manifestReference,
      "importReference.manifestReference"
    ),
    metadataReference: normalizeRelativePath(
      importReference.metadataReference,
      "importReference.metadataReference"
    )
  });
}

function normalizeLodSelection(rawLodSelection) {
  const lodSelection = asPlainObject(rawLodSelection, "lodSelection");
  const currentLod = normalizeSupportedLod(
    lodSelection.currentLod,
    "lodSelection.currentLod"
  );
  const availableLods = normalizeLodArray(
    lodSelection.availableLods,
    "lodSelection.availableLods"
  );
  const lodSelector = asPlainObject(lodSelection.lodSelector, "lodSelection.lodSelector");

  return deepFreeze({
    currentLod,
    availableLods,
    lodSelector: deepFreeze({
      close: normalizeSupportedLod(lodSelector.close, "lodSelection.lodSelector.close"),
      gameplay: normalizeSupportedLod(
        lodSelector.gameplay,
        "lodSelection.lodSelector.gameplay"
      ),
      map: normalizeSupportedLod(lodSelector.map, "lodSelection.lodSelector.map"),
      distantSilhouette: normalizeSupportedLod(
        lodSelector.distantSilhouette,
        "lodSelection.lodSelector.distantSilhouette"
      )
    })
  });
}

function normalizeRendererPayload(rawRendererPayload) {
  const rendererPayload = asPlainObject(rawRendererPayload, "rendererPayload");
  const rendererAssetReference = asPlainObject(
    rendererPayload.rendererAssetReference,
    "rendererPayload.rendererAssetReference"
  );
  return deepFreeze({
    rendererAssetReference: deepFreeze({
      assetId: normalizePermanentId(
        rendererAssetReference.assetId,
        "rendererPayload.rendererAssetReference.assetId"
      ),
      sourceType: normalizeNonEmptyString(
        rendererAssetReference.sourceType,
        "rendererPayload.rendererAssetReference.sourceType"
      )
    }),
    primaryGlb: normalizeRelativePath(
      rendererPayload.primaryGlb,
      "rendererPayload.primaryGlb"
    ),
    lodGlb: normalizeRelativePath(rendererPayload.lodGlb, "rendererPayload.lodGlb"),
    rendererProfile: normalizeNonEmptyString(
      rendererPayload.rendererProfile,
      "rendererPayload.rendererProfile"
    ),
    appearanceProfile: normalizeAppearanceProfile(
      rendererPayload.appearanceProfile,
      "rendererPayload.appearanceProfile"
    )
  });
}

function normalizePreviewState(rawPreviewState) {
  const previewState = asPlainObject(rawPreviewState, "previewState");
  return deepFreeze({
    currentState: normalizeNonEmptyString(
      previewState.currentState,
      "previewState.currentState"
    ),
    placeholderGroundReplaced: normalizeBoolean(
      previewState.placeholderGroundReplaced,
      "previewState.placeholderGroundReplaced"
    ),
    browserPreviewReady: normalizeBoolean(
      previewState.browserPreviewReady,
      "previewState.browserPreviewReady"
    )
  });
}

function normalizeValidationResult(rawValidationResult) {
  const validationResult = asPlainObject(rawValidationResult, "validationResult");
  return deepFreeze({
    glbExists: normalizeBoolean(
      validationResult.glbExists,
      "validationResult.glbExists"
    ),
    manifestValid: normalizeBoolean(
      validationResult.manifestValid,
      "validationResult.manifestValid"
    ),
    metadataValid: normalizeBoolean(
      validationResult.metadataValid,
      "validationResult.metadataValid"
    ),
    lodSelectionValid: normalizeBoolean(
      validationResult.lodSelectionValid,
      "validationResult.lodSelectionValid"
    ),
    rendererPayloadValid: normalizeBoolean(
      validationResult.rendererPayloadValid,
      "validationResult.rendererPayloadValid"
    )
  });
}

function assertRequiredFields(definition) {
  for (const fieldName of groundCoastalGrassRealGlbAtlasPreviewReplacementRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(definition, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Real GLB Atlas preview replacement is missing required field ${fieldName}.`
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
  return deepFreeze(value.map((entry, index) => normalizeSupportedLod(entry, `${fieldName}[${index}]`)));
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
    realGlbAtlasPreviewReplacement: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "GroundCoastalGrassRealGlbAtlasPreviewReplacementValidationError";
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
