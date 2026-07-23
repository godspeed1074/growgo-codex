import {
  buildLightweightAssetBuildSpecificationContext,
  lightweightAssetBuildSpecificationDefinition,
  validateLightweightAssetBuildSpecification
} from "./lightweight-asset-build-specification.mjs";

export const assetPackageImportContractRequiredFields = Object.freeze([
  "assetId",
  "version",
  "format",
  "modelFiles",
  "lodFiles",
  "materials",
  "textures",
  "metadata",
  "validationInformation"
]);

export const supportedAssetPackageImportFormats = Object.freeze(["glb", "gltf"]);
export const supportedAssetPackageLodKeys = Object.freeze([
  "close",
  "gameplay",
  "map",
  "distantSilhouette"
]);

export const assetPackageImportContractDefinition = deepFreeze({
  assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
  version: "1.0.0",
  format: "glb",
  modelFiles: {
    primary: "BUILDING_HOUSE_SMALL_COASTAL_001.glb"
  },
  lodFiles: {
    close: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_CLOSE.glb",
    gameplay: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_GAMEPLAY.glb",
    map: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_MAP.glb",
    distantSilhouette: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_DISTANT_SILHOUETTE.glb"
  },
  materials: {
    materialReferences: [
      "COASTAL_WEATHERBOARD_SHARED_001",
      "COASTAL_ROOF_SHARED_001"
    ],
    reusableSurfaceDefinitions: [
      {
        surfaceId: "HOUSE_WALL_SURFACE_001",
        materialFamily: "painted_weatherboard",
        atlasRegion: "coastal_residential_walls"
      },
      {
        surfaceId: "HOUSE_ROOF_SURFACE_001",
        materialFamily: "salt_resilient_roofing",
        atlasRegion: "coastal_residential_roofs"
      },
      {
        surfaceId: "HOUSE_TRIM_SURFACE_001",
        materialFamily: "coastal_trim",
        atlasRegion: "coastal_residential_trim"
      }
    ]
  },
  textures: {
    atlasReferences: ["COASTAL_ATLAS_RESIDENTIAL_001"],
    textureRules: {
      sharedAtlasOnly: true,
      standaloneTexturesAllowed: false
    }
  },
  metadata: {
    assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
    version: "1.0.0",
    format: "glb",
    lodReferences: {
      close: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_CLOSE.glb",
      gameplay: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_GAMEPLAY.glb",
      map: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_MAP.glb",
      distantSilhouette: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_DISTANT_SILHOUETTE.glb"
    },
    componentReferences: [
      "COASTAL_HOUSE_WALL_PANEL_001",
      "COASTAL_HOUSE_ROOF_GABLE_001",
      "COASTAL_HOUSE_DOOR_BASIC_001",
      "COASTAL_HOUSE_WINDOW_SHUTTER_001"
    ],
    materialReferences: [
      "COASTAL_WEATHERBOARD_SHARED_001",
      "COASTAL_ROOF_SHARED_001"
    ],
    performanceMetadata: {
      storageTargetKb: 192,
      ramTargetKb: 256,
      gpuVertexBudget: 320,
      batchingExpected: true
    },
    futureSupportedFormats: ["gltf"]
  },
  validationInformation: {
    structureValidated: true,
    componentCompatibilityValidated: true,
    materialValidationState: "validated",
    mobilePerformanceValidationState: "validated",
    rendererCompatibilityProfile: "custom-2.5d-passive"
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function buildAssetPackageImportContractContext() {
  return Object.freeze(buildLightweightAssetBuildSpecificationContext());
}

export function validateAssetPackageImportContract(
  rawContract = assetPackageImportContractDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeAssetPackageImportOptions(options);
    const contract = normalizeAssetPackageImportContract(rawContract);
    const buildSpecificationResult = normalizedOptions.validateLightweightAssetBuildSpecification(
      lightweightAssetBuildSpecificationDefinition,
      {
        validationContext: normalizedOptions.validationContext
      }
    );

    if (!buildSpecificationResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: buildSpecificationResult.errorCode,
        message: buildSpecificationResult.message,
        importContract: null
      });
    }

    const buildSpecification = buildSpecificationResult.buildSpecification.specification;
    validateIdentity(contract, buildSpecification);
    validateFileStructure(contract);
    validateLodNaming(contract);
    validateComponentCompatibility(
      contract.metadata.componentReferences,
      buildSpecification.componentMapping,
      normalizedOptions.validationContext.componentLibrary
    );
    validateMaterialCompatibility(contract, buildSpecification);
    validateMobilePerformanceCompatibility(
      contract.metadata.performanceMetadata,
      buildSpecification.mobilePerformanceSpecification
    );
    validateRendererCompatibility(
      contract.validationInformation,
      buildSpecificationResult.buildSpecification.rendererValidation.compatibility
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      importContract: Object.freeze({
        contract,
        buildSpecification: buildSpecificationResult.buildSpecification,
        compatibility: Object.freeze({
          assetIdentityVerified: true,
          fileStructureVerified: true,
          lodNamingVerified: true,
          componentCompatibilityVerified: true,
          materialCompatibilityVerified: true,
          mobilePerformanceCompatibilityVerified: true,
          rendererCompatibilityVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "AssetPackageImportContractValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      importContract: null
    });
  }
}

function normalizeAssetPackageImportOptions(options) {
  const validationContext =
    options.validationContext ?? buildAssetPackageImportContractContext();
  const validateLightweightAssetBuildSpecificationFn =
    typeof options.validateLightweightAssetBuildSpecification === "function"
      ? options.validateLightweightAssetBuildSpecification
      : validateLightweightAssetBuildSpecification;

  return Object.freeze({
    validationContext,
    validateLightweightAssetBuildSpecification:
      validateLightweightAssetBuildSpecificationFn
  });
}

function normalizeAssetPackageImportContract(rawContract) {
  const contract = asPlainObject(rawContract, "asset package import contract");
  assertRequiredFields(contract);

  const assetId = normalizePermanentId(contract.assetId, "assetId");
  const version = normalizeVersion(contract.version, "version");
  const format = normalizeFormat(contract.format, "format");
  const modelFiles = normalizeModelFiles(contract.modelFiles, format);
  const lodFiles = normalizeLodFiles(contract.lodFiles, format);
  const materials = normalizeMaterials(contract.materials);
  const textures = normalizeTextures(contract.textures);
  const metadata = normalizeMetadata(contract.metadata, format);
  const validationInformation = normalizeValidationInformation(
    contract.validationInformation
  );

  return deepFreeze({
    assetId,
    version,
    format,
    modelFiles,
    lodFiles,
    materials,
    textures,
    metadata,
    validationInformation
  });
}

function validateIdentity(contract, buildSpecification) {
  if (contract.assetId !== buildSpecification.assetId) {
    throw createAssetPackageImportValidationError(
      "asset_identity_mismatch",
      "Asset package import contract asset identity must match the lightweight build specification asset identity."
    );
  }

  if (contract.metadata.assetId !== contract.assetId) {
    throw createAssetPackageImportValidationError(
      "asset_identity_mismatch",
      "Asset package metadata assetId must match the package assetId."
    );
  }
}

function validateFileStructure(contract) {
  const primaryExtension = getFileExtension(contract.modelFiles.primary);
  if (primaryExtension !== contract.format) {
    throw createAssetPackageImportValidationError(
      "file_structure_mismatch",
      "Primary model file extension must match the declared package format."
    );
  }

  for (const lodKey of supportedAssetPackageLodKeys) {
    const lodFile = contract.lodFiles[lodKey];
    if (getFileExtension(lodFile) !== contract.format) {
      throw createAssetPackageImportValidationError(
        "file_structure_mismatch",
        `LOD file ${lodKey} must match the declared package format.`
      );
    }
  }
}

function validateLodNaming(contract) {
  for (const lodKey of supportedAssetPackageLodKeys) {
    const expectedFragment = `_LOD_${normalizeLodFileNameSegment(lodKey)}.`;
    if (!contract.lodFiles[lodKey].includes(expectedFragment)) {
      throw createAssetPackageImportValidationError(
        "invalid_lod_naming",
        `LOD file ${lodKey} must include ${expectedFragment} in its filename.`
      );
    }
  }
}

function validateComponentCompatibility(
  componentReferences,
  componentMapping,
  componentLibrary
) {
  const expectedComponentIds = componentMapping.map((entry) => entry.componentId);

  if (componentReferences.length !== expectedComponentIds.length) {
    throw createAssetPackageImportValidationError(
      "component_reference_mismatch",
      "Asset package component references must cover every lightweight build component."
    );
  }

  for (const componentId of componentReferences) {
    if (!expectedComponentIds.includes(componentId)) {
      throw createAssetPackageImportValidationError(
        "component_reference_mismatch",
        `Asset package component ${componentId} is not part of the approved lightweight build component mapping.`
      );
    }

    if (!componentLibrary.findComponentById(componentId)) {
      throw createAssetPackageImportValidationError(
        "missing_component_reference",
        `Asset package component ${componentId} is not available in the component library.`
      );
    }

    if (
      typeof componentLibrary.isComponentAvailable === "function" &&
      !componentLibrary.isComponentAvailable(componentId)
    ) {
      throw createAssetPackageImportValidationError(
        "unavailable_component_reference",
        `Asset package component ${componentId} is not approved for import validation.`
      );
    }
  }
}

function validateMaterialCompatibility(contract, buildSpecification) {
  const expectedMaterialReferences =
    buildSpecification.materialSpecification.sharedMaterials;
  const expectedSurfaceIds =
    buildSpecification.materialSpecification.reusableSurfaceDefinitions.map(
      (entry) => entry.surfaceId
    );

  if (
    JSON.stringify(contract.metadata.materialReferences) !==
    JSON.stringify(expectedMaterialReferences)
  ) {
    throw createAssetPackageImportValidationError(
      "material_reference_mismatch",
      "Asset package material references must match the lightweight build specification shared materials."
    );
  }

  const contractSurfaceIds = contract.materials.reusableSurfaceDefinitions.map(
    (entry) => entry.surfaceId
  );

  if (JSON.stringify(contractSurfaceIds) !== JSON.stringify(expectedSurfaceIds)) {
    throw createAssetPackageImportValidationError(
      "material_surface_mismatch",
      "Asset package reusable surface definitions must match the lightweight build specification surface set."
    );
  }
}

function validateMobilePerformanceCompatibility(
  performanceMetadata,
  mobilePerformanceSpecification
) {
  const exactFields = ["storageTargetKb", "ramTargetKb", "gpuVertexBudget"];
  for (const fieldName of exactFields) {
    if (performanceMetadata[fieldName] !== mobilePerformanceSpecification[fieldName]) {
      throw createAssetPackageImportValidationError(
        "mobile_performance_mismatch",
        `Asset package performance field ${fieldName} must match the lightweight build specification mobile budget.`
      );
    }
  }

  if (
    performanceMetadata.batchingExpected !==
    mobilePerformanceSpecification.batchingExpected
  ) {
    throw createAssetPackageImportValidationError(
      "mobile_performance_mismatch",
      "Asset package batching expectation must match the lightweight build specification."
    );
  }
}

function validateRendererCompatibility(
  validationInformation,
  rendererCompatibility
) {
  if (
    validationInformation.rendererCompatibilityProfile !==
    rendererCompatibility.rendererProfile
  ) {
    throw createAssetPackageImportValidationError(
      "renderer_profile_mismatch",
      "Asset package renderer compatibility profile must match the passive Custom 2.5D renderer contract."
    );
  }

  if (!rendererCompatibility.passiveConsumerCompatibilityVerified) {
    throw createAssetPackageImportValidationError(
      "renderer_compatibility_failed",
      "Passive Custom 2.5D renderer consumer compatibility must remain verified."
    );
  }
}

function normalizeModelFiles(value, expectedFormat) {
  const modelFiles = asPlainObject(value, "modelFiles");
  return deepFreeze({
    primary: normalizeFilename(modelFiles.primary, "modelFiles.primary", expectedFormat)
  });
}

function normalizeLodFiles(value, expectedFormat) {
  const lodFiles = asPlainObject(value, "lodFiles");
  const normalized = {};
  for (const lodKey of supportedAssetPackageLodKeys) {
    normalized[lodKey] = normalizeFilename(
      lodFiles[lodKey],
      `lodFiles.${lodKey}`,
      expectedFormat
    );
  }

  return deepFreeze(normalized);
}

function normalizeMaterials(value) {
  const materials = asPlainObject(value, "materials");
  return deepFreeze({
    materialReferences: deepFreeze(
      normalizePermanentIdArray(materials.materialReferences, "materials.materialReferences")
    ),
    reusableSurfaceDefinitions: deepFreeze(
      normalizeReusableSurfaceDefinitions(
        materials.reusableSurfaceDefinitions,
        "materials.reusableSurfaceDefinitions"
      )
    )
  });
}

function normalizeTextures(value) {
  const textures = asPlainObject(value, "textures");
  const textureRules = asPlainObject(textures.textureRules, "textures.textureRules");

  return deepFreeze({
    atlasReferences: deepFreeze(
      normalizePermanentIdArray(textures.atlasReferences, "textures.atlasReferences")
    ),
    textureRules: deepFreeze({
      sharedAtlasOnly: normalizeBoolean(
        textureRules.sharedAtlasOnly,
        "textures.textureRules.sharedAtlasOnly"
      ),
      standaloneTexturesAllowed: normalizeBoolean(
        textureRules.standaloneTexturesAllowed,
        "textures.textureRules.standaloneTexturesAllowed"
      )
    })
  });
}

function normalizeMetadata(value, expectedFormat) {
  const metadata = asPlainObject(value, "metadata");
  const lodReferences = asPlainObject(metadata.lodReferences, "metadata.lodReferences");
  const performanceMetadata = asPlainObject(
    metadata.performanceMetadata,
    "metadata.performanceMetadata"
  );

  const normalizedLodReferences = {};
  for (const lodKey of supportedAssetPackageLodKeys) {
    normalizedLodReferences[lodKey] = normalizeFilename(
      lodReferences[lodKey],
      `metadata.lodReferences.${lodKey}`,
      expectedFormat
    );
  }

  return deepFreeze({
    assetId: normalizePermanentId(metadata.assetId, "metadata.assetId"),
    version: normalizeVersion(metadata.version, "metadata.version"),
    format: normalizeFormat(metadata.format, "metadata.format"),
    lodReferences: deepFreeze(normalizedLodReferences),
    componentReferences: deepFreeze(
      normalizePermanentIdArray(metadata.componentReferences, "metadata.componentReferences")
    ),
    materialReferences: deepFreeze(
      normalizePermanentIdArray(metadata.materialReferences, "metadata.materialReferences")
    ),
    performanceMetadata: deepFreeze({
      storageTargetKb: normalizePositiveInteger(
        performanceMetadata.storageTargetKb,
        "metadata.performanceMetadata.storageTargetKb"
      ),
      ramTargetKb: normalizePositiveInteger(
        performanceMetadata.ramTargetKb,
        "metadata.performanceMetadata.ramTargetKb"
      ),
      gpuVertexBudget: normalizePositiveInteger(
        performanceMetadata.gpuVertexBudget,
        "metadata.performanceMetadata.gpuVertexBudget"
      ),
      batchingExpected: normalizeBoolean(
        performanceMetadata.batchingExpected,
        "metadata.performanceMetadata.batchingExpected"
      )
    }),
    futureSupportedFormats: deepFreeze(
      normalizeSupportedFormatsArray(
        metadata.futureSupportedFormats,
        "metadata.futureSupportedFormats"
      )
    )
  });
}

function normalizeValidationInformation(value) {
  const validationInformation = asPlainObject(value, "validationInformation");
  return deepFreeze({
    structureValidated: normalizeBoolean(
      validationInformation.structureValidated,
      "validationInformation.structureValidated"
    ),
    componentCompatibilityValidated: normalizeBoolean(
      validationInformation.componentCompatibilityValidated,
      "validationInformation.componentCompatibilityValidated"
    ),
    materialValidationState: normalizeStringValue(
      validationInformation.materialValidationState,
      "validationInformation.materialValidationState"
    ),
    mobilePerformanceValidationState: normalizeStringValue(
      validationInformation.mobilePerformanceValidationState,
      "validationInformation.mobilePerformanceValidationState"
    ),
    rendererCompatibilityProfile: normalizeStringValue(
      validationInformation.rendererCompatibilityProfile,
      "validationInformation.rendererCompatibilityProfile"
    )
  });
}

function normalizeReusableSurfaceDefinitions(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createAssetPackageImportValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array.`
    );
  }

  return value.map((entry, index) => {
    const surface = asPlainObject(entry, `${fieldName}[${index}]`);
    return deepFreeze({
      surfaceId: normalizeStringValue(surface.surfaceId, `${fieldName}[${index}].surfaceId`),
      materialFamily: normalizeStringValue(
        surface.materialFamily,
        `${fieldName}[${index}].materialFamily`
      ),
      atlasRegion: normalizeStringValue(
        surface.atlasRegion,
        `${fieldName}[${index}].atlasRegion`
      )
    });
  });
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createAssetPackageImportValidationError(
      "invalid_field_type",
      `${fieldName} must be a non-empty array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeSupportedFormatsArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createAssetPackageImportValidationError(
      "invalid_field_type",
      `${fieldName} must be an array of supported future formats.`
    );
  }

  return value.map((entry, index) =>
    normalizeFormat(entry, `${fieldName}[${index}]`)
  );
}

function normalizeFilename(value, fieldName, expectedFormat) {
  const normalized = normalizeStringValue(value, fieldName);
  if (getFileExtension(normalized) !== expectedFormat) {
    throw createAssetPackageImportValidationError(
      "invalid_file_extension",
      `File ${fieldName} must use the declared ${expectedFormat} format.`
    );
  }

  return normalized;
}

function normalizeFormat(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toLowerCase();
  if (!supportedAssetPackageImportFormats.includes(normalized)) {
    throw createAssetPackageImportValidationError(
      "unsupported_format",
      `Format ${normalized} is not part of the approved Asset Package Import Contract format set.`
    );
  }

  return normalized;
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createAssetPackageImportValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }

  return normalized;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createAssetPackageImportValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function assertRequiredFields(contract) {
  for (const fieldName of assetPackageImportContractRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(contract, fieldName)) {
      throw createAssetPackageImportValidationError(
        "missing_required_field",
        `Asset package import contract is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createAssetPackageImportValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a string.`
    );
  }

  const normalized = value.trim();
  if (!normalized) {
    throw createAssetPackageImportValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be empty.`
    );
  }

  return normalized;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createAssetPackageImportValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive integer.`
    );
  }

  return value;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createAssetPackageImportValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
}

function normalizeLodFileNameSegment(lodKey) {
  return lodKey.replace(/([A-Z])/g, "_$1").toUpperCase();
}

function getFileExtension(filename) {
  const segments = filename.toLowerCase().split(".");
  return segments[segments.length - 1] ?? "";
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createAssetPackageImportValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createAssetPackageImportValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetPackageImportContractValidationError";
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
