import {
  buildRealAssetPackageIntegrationContext,
  realAssetPackageIntegrationDefinition,
  validateRealAssetPackageIntegration
} from "./real-asset-package-integration.mjs";
import {
  blenderApiBridgeFoundationDefinition,
  validateBlenderApiBridgeFoundation
} from "./blender-api-bridge-foundation.mjs";
import {
  blenderPrototypeSceneGenerationDefinition,
  validateBlenderPrototypeSceneGeneration
} from "./blender-prototype-scene-generation.mjs";
import {
  assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
  validateAssetGenerationWorkspaceAppearanceProfileFoundation
} from "./asset-generation-workspace-appearance-profile-foundation.mjs";
import {
  supportedAssetPackageImportFormats,
  supportedAssetPackageLodKeys
} from "./asset-package-import-contract.mjs";

export const blenderPrototypeAssetGenerationGlbExportFoundationRequiredFields =
  Object.freeze([
    "assetPackage",
    "modelReferences",
    "lodReferences",
    "materialReferences",
    "metadataReferences"
  ]);

export const blenderPrototypeAssetGenerationGlbExportFoundationDefinition = deepFreeze({
  assetPackage: {
    assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
    version: "1.0.0",
    packageId: "LIGHTHOUSE_ISLAND_ROCKY_PROTOTYPE_GLB_PACKAGE_001",
    packageLocation:
      "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export",
    format: "glb"
  },
  modelReferences: {
    primary: "LIGHTHOUSE_ISLAND_ROCKY_001.glb"
  },
  lodReferences: {
    LOD0: {
      lodKey: "close",
      geometryProfile: "lod0",
      filename: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_CLOSE.glb"
    },
    LOD1: {
      lodKey: "gameplay",
      geometryProfile: "lod1",
      filename: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_GAMEPLAY.glb"
    },
    LOD2: {
      lodKey: "map",
      geometryProfile: "lod2",
      filename: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_MAP.glb"
    },
    LOD3: {
      lodKey: "distantSilhouette",
      geometryProfile: "lod3",
      filename: "LIGHTHOUSE_ISLAND_ROCKY_001_LOD_DISTANT_SILHOUETTE.glb"
    }
  },
  materialReferences: [
    "LIGHTHOUSE_MASONRY_SHARED_001",
    "LIGHTHOUSE_LANTERN_SHARED_001",
    "LIGHTHOUSE_BEAM_SHARED_001"
  ],
  metadataReferences: {
    assetMetadata:
      "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/metadata/lighthouse-island-rocky-prototype.json",
    exportMetadata:
      "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export/lighthouse-island-rocky-export.json",
    validationMetadata:
      "asset-factory-workspace/production/LIGHTHOUSE_COASTAL_FAMILY_001/export/lighthouse-island-rocky-validation.json"
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;
const supportedRendererProfile = "custom-2.5d-passive";
const lodTierKeys = Object.freeze(["LOD0", "LOD1", "LOD2", "LOD3"]);
const expectedGeometryProfiles = Object.freeze({
  LOD0: "lod0",
  LOD1: "lod1",
  LOD2: "lod2",
  LOD3: "lod3"
});
const expectedLodKeyByTier = Object.freeze({
  LOD0: "close",
  LOD1: "gameplay",
  LOD2: "map",
  LOD3: "distantSilhouette"
});

export function buildBlenderPrototypeAssetGenerationGlbExportFoundationContext() {
  return Object.freeze(buildRealAssetPackageIntegrationContext());
}

export function validateBlenderPrototypeAssetGenerationGlbExportFoundation(
  rawFoundation = blenderPrototypeAssetGenerationGlbExportFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeFoundationOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const packageIntegrationResult =
      normalizedOptions.validateRealAssetPackageIntegration(
        normalizedOptions.packageIntegrationDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!packageIntegrationResult.ok) {
      return freezeFailure(packageIntegrationResult);
    }

    const blenderBridgeResult = normalizedOptions.validateBlenderApiBridgeFoundation(
      normalizedOptions.blenderBridgeDefinition,
      { validationContext: normalizedOptions.validationContext }
    );
    if (!blenderBridgeResult.ok) {
      return freezeFailure(blenderBridgeResult);
    }

    const prototypeSceneResult =
      normalizedOptions.validateBlenderPrototypeSceneGeneration(
        normalizedOptions.prototypeSceneDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!prototypeSceneResult.ok) {
      return freezeFailure(prototypeSceneResult);
    }

    const workspaceResult =
      normalizedOptions.validateAssetGenerationWorkspaceAppearanceProfileFoundation(
        normalizedOptions.workspaceFoundationDefinition,
        { validationContext: normalizedOptions.validationContext }
      );
    if (!workspaceResult.ok) {
      return freezeFailure(workspaceResult);
    }

    const exportFoundation = buildExportFoundationResult(
      foundation,
      packageIntegrationResult.integration,
      blenderBridgeResult.bridge,
      prototypeSceneResult.prototypeScene,
      workspaceResult.workspaceProfile
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      exportFoundation
    });
  } catch (error) {
    if (error?.name !== "BlenderPrototypeAssetGenerationGlbExportFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      exportFoundation: null
    });
  }
}

function normalizeFoundationOptions(options) {
  const validationContext =
    options.validationContext ??
    buildBlenderPrototypeAssetGenerationGlbExportFoundationContext();

  return Object.freeze({
    validationContext,
    packageIntegrationDefinition:
      options.packageIntegrationDefinition ?? realAssetPackageIntegrationDefinition,
    blenderBridgeDefinition:
      options.blenderBridgeDefinition ?? blenderApiBridgeFoundationDefinition,
    prototypeSceneDefinition:
      options.prototypeSceneDefinition ?? blenderPrototypeSceneGenerationDefinition,
    workspaceFoundationDefinition:
      options.workspaceFoundationDefinition ??
      assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
    validateRealAssetPackageIntegration:
      typeof options.validateRealAssetPackageIntegration === "function"
        ? options.validateRealAssetPackageIntegration
        : validateRealAssetPackageIntegration,
    validateBlenderApiBridgeFoundation:
      typeof options.validateBlenderApiBridgeFoundation === "function"
        ? options.validateBlenderApiBridgeFoundation
        : validateBlenderApiBridgeFoundation,
    validateBlenderPrototypeSceneGeneration:
      typeof options.validateBlenderPrototypeSceneGeneration === "function"
        ? options.validateBlenderPrototypeSceneGeneration
        : validateBlenderPrototypeSceneGeneration,
    validateAssetGenerationWorkspaceAppearanceProfileFoundation:
      typeof options.validateAssetGenerationWorkspaceAppearanceProfileFoundation ===
      "function"
        ? options.validateAssetGenerationWorkspaceAppearanceProfileFoundation
        : validateAssetGenerationWorkspaceAppearanceProfileFoundation
  });
}

function buildExportFoundationResult(
  foundation,
  integration,
  blenderBridge,
  prototypeScene,
  workspaceProfile
) {
  validateAssetPackageStructure(foundation, integration.assetPackage);
  validateGlbExportPreparation(
    foundation,
    blenderBridge.request,
    prototypeScene.scene,
    workspaceProfile.foundation.workspaceContract
  );
  validateAssetPackageCompatibility(foundation, integration, blenderBridge.request);
  const lodValidation = validateLodReferences(foundation, blenderBridge.request);
  const syntheticReplacementVerification = buildSyntheticReplacementVerification(
    integration
  );

  return Object.freeze({
    foundation,
    lodValidation,
    exportPreparation: Object.freeze({
      namingConventionsVerified: true,
      exportMetadataVerified: true,
      validationReferencesVerified: true,
      exportCollectionId: prototypeScene.scene.metadata.exportCollectionId,
      exportFolder: workspaceProfile.foundation.workspaceContract.exportFolder,
      exportFormat: foundation.assetPackage.format
    }),
    assetPackageValidation: Object.freeze({
      identityVerified: true,
      componentsVerified: true,
      recipesVerified: true,
      manifestsVerified: true,
      importContractCompatibilityVerified: true,
      performanceMetadataVerified: true
    }),
    syntheticReplacementVerification,
    compatibility: Object.freeze({
      prototypeExportStructureVerified: true,
      glbExportPreparationVerified: true,
      assetPackageValidationVerified: true,
      lodValidationVerified: true,
      syntheticReplacementVerified: true,
      passiveOnly: true
    })
  });
}

function validateAssetPackageStructure(foundation, integratedAssetPackage) {
  if (foundation.assetPackage.assetId !== integratedAssetPackage.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Prototype export asset package assetId must match the integrated lighthouse asset package assetId."
    );
  }

  if (foundation.assetPackage.version !== integratedAssetPackage.version) {
    throw createValidationError(
      "asset_version_mismatch",
      "Prototype export asset package version must match the integrated lighthouse asset package version."
    );
  }

  if (foundation.assetPackage.packageLocation !== integratedAssetPackage.packageLocation) {
    throw createValidationError(
      "package_location_mismatch",
      "Prototype export package location must match the integrated lighthouse package location."
    );
  }

  if (foundation.modelReferences.primary !== integratedAssetPackage.modelReferences.primary) {
    throw createValidationError(
      "model_reference_mismatch",
      "Prototype export primary model reference must match the integrated lighthouse package model reference."
    );
  }

  if (
    JSON.stringify(foundation.materialReferences) !==
    JSON.stringify(integratedAssetPackage.materialReferences)
  ) {
    throw createValidationError(
      "material_reference_mismatch",
      "Prototype export material references must match the integrated lighthouse package material references."
    );
  }
}

function validateGlbExportPreparation(
  foundation,
  blenderBridgeRequest,
  prototypeScene,
  workspaceContract
) {
  if (!supportedAssetPackageImportFormats.includes(foundation.assetPackage.format)) {
    throw createValidationError(
      "unsupported_export_format",
      `Prototype export format ${foundation.assetPackage.format} is not approved for GLB package export.`
    );
  }

  if (foundation.assetPackage.format !== blenderBridgeRequest.exportRequirements.format) {
    throw createValidationError(
      "export_format_mismatch",
      "Prototype export format must match the Blender bridge export format."
    );
  }

  if (prototypeScene.metadata.exportCollectionId !== "EXPORT") {
    throw createValidationError(
      "export_collection_mismatch",
      "Prototype scene must preserve the EXPORT collection for GLB export preparation."
    );
  }

  if (
    !foundation.metadataReferences.exportMetadata.startsWith(workspaceContract.exportFolder)
  ) {
    throw createValidationError(
      "export_metadata_location_mismatch",
      "Prototype export metadata reference must live under the workspace export folder."
    );
  }

  if (
    !foundation.metadataReferences.validationMetadata.startsWith(workspaceContract.exportFolder)
  ) {
    throw createValidationError(
      "validation_metadata_location_mismatch",
      "Prototype validation metadata reference must live under the workspace export folder."
    );
  }

  if (
    !foundation.metadataReferences.assetMetadata.includes("/metadata/") ||
    !foundation.metadataReferences.assetMetadata.endsWith(".json")
  ) {
    throw createValidationError(
      "asset_metadata_reference_invalid",
      "Prototype asset metadata reference must point to a metadata JSON file."
    );
  }

  const validationRequirements =
    blenderBridgeRequest.exportRequirements.validationRequirements;
  const requiredValidationFlags = [
    "namingValidated",
    "lodValidated",
    "materialsValidated",
    "workflowValidated"
  ];
  for (const fieldName of requiredValidationFlags) {
    if (validationRequirements[fieldName] !== true) {
      throw createValidationError(
        "validation_reference_incomplete",
        `Prototype export preparation requires ${fieldName} to remain true.`
      );
    }
  }
}

function validateAssetPackageCompatibility(foundation, integration, blenderBridgeRequest) {
  if (integration.manifestReference.recipeId !== integration.assetPackage.recipeId) {
    throw createValidationError(
      "manifest_recipe_mismatch",
      "Integrated lighthouse manifest recipe must match the real asset package recipe."
    );
  }

  if (
    JSON.stringify(integration.manifestReference.componentReferences) !==
    JSON.stringify(integration.assetPackage.componentReferences)
  ) {
    throw createValidationError(
      "manifest_component_mismatch",
      "Integrated lighthouse manifest components must match the real asset package components."
    );
  }

  if (
    !blenderBridgeRequest.componentReferences.every((componentId) =>
      integration.assetPackage.componentReferences.includes(componentId)
    )
  ) {
    throw createValidationError(
      "bridge_component_mismatch",
      "Prototype export foundation must preserve every Blender bridge component reference."
    );
  }

  if (
    integration.assetPackage.rendererCompatibilityProfile !== supportedRendererProfile ||
    blenderBridgeRequest.request?.rendererCompatibilityProfile === "production"
  ) {
    throw createValidationError(
      "renderer_profile_mismatch",
      "Prototype export foundation must remain aligned to the passive Custom 2.5D renderer profile."
    );
  }

  const performanceMetadata = integration.assetPackage.performanceMetadata;
  const requiredFields = [
    "storageTargetKb",
    "ramTargetKb",
    "gpuVertexBudget"
  ];
  for (const fieldName of requiredFields) {
    if (!Number.isInteger(performanceMetadata[fieldName]) || performanceMetadata[fieldName] <= 0) {
      throw createValidationError(
        "invalid_performance_metadata",
        `Prototype export foundation requires positive integer ${fieldName} performance metadata.`
      );
    }
  }
  if (typeof performanceMetadata.batchingExpected !== "boolean") {
    throw createValidationError(
      "invalid_performance_metadata",
      "Prototype export foundation requires explicit batchingExpected performance metadata."
    );
  }
}

function validateLodReferences(foundation, blenderBridgeRequest) {
  const lodEntries = lodTierKeys.map((lodTier) => {
    const lodReference = foundation.lodReferences[lodTier];
    const expectedLodKey = expectedLodKeyByTier[lodTier];
    const expectedGeometryProfile = expectedGeometryProfiles[lodTier];

    if (lodReference.lodKey !== expectedLodKey) {
      throw createValidationError(
        "lod_key_mismatch",
        `${lodTier} must map to ${expectedLodKey} in the prototype GLB export foundation.`
      );
    }

    if (lodReference.geometryProfile !== expectedGeometryProfile) {
      throw createValidationError(
        "lod_geometry_profile_mismatch",
        `${lodTier} must preserve geometry profile ${expectedGeometryProfile}.`
      );
    }

    if (!supportedAssetPackageLodKeys.includes(lodReference.lodKey)) {
      throw createValidationError(
        "unsupported_lod_key",
        `${lodReference.lodKey} is not part of the approved asset package LOD key set.`
      );
    }

    const expectedFragment = `_LOD_${normalizeLodSegment(lodReference.lodKey)}.`;
    if (!lodReference.filename.includes(expectedFragment)) {
      throw createValidationError(
        "invalid_lod_naming",
        `${lodTier} filename must include ${expectedFragment}.`
      );
    }

    const expectedBridgeProfile =
      blenderBridgeRequest.lodRequirements[lodReference.lodKey]?.geometryProfile ?? null;
    if (expectedBridgeProfile !== lodReference.geometryProfile) {
      throw createValidationError(
        "lod_bridge_mismatch",
        `${lodTier} geometry profile must match the Blender bridge LOD requirement.`
      );
    }

    if (getFileExtension(lodReference.filename) !== foundation.assetPackage.format) {
      throw createValidationError(
        "lod_format_mismatch",
        `${lodTier} filename must use the declared ${foundation.assetPackage.format} format.`
      );
    }

    return Object.freeze({
      lodTier,
      lodKey: lodReference.lodKey,
      geometryProfile: lodReference.geometryProfile,
      filename: lodReference.filename
    });
  });

  return deepFreeze(lodEntries);
}

function buildSyntheticReplacementVerification(integration) {
  if (integration.replacementValidation.sameWorldOutput !== true) {
    throw createValidationError(
      "synthetic_replacement_failed",
      "Prototype GLB export foundation requires synthetic replacement validation to preserve the same world output."
    );
  }

  return Object.freeze({
    packageReference: integration.replacementValidation.realPackageReference,
    worldPipelineReference: Object.freeze({
      instanceId: integration.worldInstanceReference.instanceId,
      assetId: integration.worldInstanceReference.assetId,
      locationId: integration.worldInstanceReference.locationId
    }),
    rendererPayloadReference: Object.freeze({
      assetId: integration.rendererPayloadReference.assetId,
      recipeId: integration.rendererPayloadReference.recipeId,
      transformData: deepFreeze(integration.rendererPayloadReference.transformData)
    }),
    sameWorldOutput: true
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "blender prototype asset generation GLB export foundation"
  );
  assertRequiredFields(foundation);

  const assetPackage = normalizeAssetPackage(foundation.assetPackage);
  const modelReferences = normalizeModelReferences(
    foundation.modelReferences,
    assetPackage.format
  );
  const lodReferences = normalizeLodReferences(
    foundation.lodReferences,
    assetPackage.format
  );
  const materialReferences = deepFreeze(
    normalizePermanentIdArray(foundation.materialReferences, "materialReferences")
  );
  const metadataReferences = normalizeMetadataReferences(foundation.metadataReferences);

  return deepFreeze({
    assetPackage,
    modelReferences,
    lodReferences,
    materialReferences,
    metadataReferences
  });
}

function normalizeAssetPackage(value) {
  const assetPackage = asPlainObject(value, "assetPackage");
  const assetId = normalizePermanentId(assetPackage.assetId, "assetPackage.assetId");
  const version = normalizeVersion(assetPackage.version, "assetPackage.version");
  const packageId = normalizePermanentId(assetPackage.packageId, "assetPackage.packageId");
  const packageLocation = normalizeStringValue(
    assetPackage.packageLocation,
    "assetPackage.packageLocation"
  );
  const format = normalizeFormat(assetPackage.format, "assetPackage.format");

  return deepFreeze({
    assetId,
    version,
    packageId,
    packageLocation,
    format
  });
}

function normalizeModelReferences(value, expectedFormat) {
  const modelReferences = asPlainObject(value, "modelReferences");
  return deepFreeze({
    primary: normalizeFilename(
      modelReferences.primary,
      "modelReferences.primary",
      expectedFormat
    )
  });
}

function normalizeLodReferences(value, expectedFormat) {
  const lodReferences = asPlainObject(value, "lodReferences");
  const normalized = {};
  for (const lodTier of lodTierKeys) {
    const lodReference = asPlainObject(lodReferences[lodTier], `lodReferences.${lodTier}`);
    normalized[lodTier] = Object.freeze({
      lodKey: normalizeLodKey(
        lodReference.lodKey,
        `lodReferences.${lodTier}.lodKey`
      ),
      geometryProfile: normalizeStringValue(
        lodReference.geometryProfile,
        `lodReferences.${lodTier}.geometryProfile`
      ),
      filename: normalizeFilename(
        lodReference.filename,
        `lodReferences.${lodTier}.filename`,
        expectedFormat
      )
    });
  }
  return deepFreeze(normalized);
}

function normalizeMetadataReferences(value) {
  const metadataReferences = asPlainObject(value, "metadataReferences");
  return deepFreeze({
    assetMetadata: normalizeJsonFilename(
      metadataReferences.assetMetadata,
      "metadataReferences.assetMetadata"
    ),
    exportMetadata: normalizeJsonFilename(
      metadataReferences.exportMetadata,
      "metadataReferences.exportMetadata"
    ),
    validationMetadata: normalizeJsonFilename(
      metadataReferences.validationMetadata,
      "metadataReferences.validationMetadata"
    )
  });
}

function normalizeJsonFilename(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!normalized.endsWith(".json")) {
    throw createValidationError(
      "invalid_metadata_reference",
      `Field ${fieldName} must point to a JSON metadata file.`
    );
  }
  return normalized;
}

function normalizeFormat(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toLowerCase();
  if (!supportedAssetPackageImportFormats.includes(normalized)) {
    throw createValidationError(
      "unsupported_format",
      `Format ${normalized} is not approved for prototype GLB export.`
    );
  }
  return normalized;
}

function normalizeLodKey(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!supportedAssetPackageLodKeys.includes(normalized)) {
    throw createValidationError(
      "unsupported_lod_key",
      `LOD key ${normalized} is not approved for prototype GLB export.`
    );
  }
  return normalized;
}

function normalizeFilename(value, fieldName, expectedFormat) {
  const normalized = normalizeStringValue(value, fieldName);
  if (getFileExtension(normalized) !== expectedFormat) {
    throw createValidationError(
      "invalid_file_extension",
      `Field ${fieldName} must use the declared ${expectedFormat} format.`
    );
  }
  return normalized;
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array of permanent IDs.`
    );
  }
  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }
  return normalized;
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }
  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  const normalized = value.trim();
  if (!normalized) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }
  return normalized;
}

function normalizeLodSegment(lodKey) {
  return lodKey === "distantSilhouette"
    ? "DISTANT_SILHOUETTE"
    : lodKey.toUpperCase();
}

function getFileExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.at(-1).toLowerCase() : "";
}

function assertRequiredFields(foundation) {
  for (const fieldName of blenderPrototypeAssetGenerationGlbExportFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Prototype GLB export foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }
  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode,
    message: result.message,
    exportFoundation: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "BlenderPrototypeAssetGenerationGlbExportFoundationValidationError";
  error.code = code;
  return error;
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
