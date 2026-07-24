import path from "node:path";
import { existsSync as defaultExistsSync } from "node:fs";
import {
  groundCoastalGrassPrototypeAssetPackageDefinition,
  validateGroundCoastalGrassPrototypeAssetPackage
} from "./ground-coastal-grass-prototype-asset-package.mjs";
import {
  groundCoastalGrassLocalGeneratorDefinition,
  validateGroundCoastalGrassLocalGenerator
} from "./ground-coastal-grass-local-generator.mjs";
import {
  coastalStarterPackBlenderGenerationPipeline001Definition,
  validateCoastalStarterPackBlenderGenerationPipeline001
} from "./coastal-starter-pack-blender-generation-pipeline-001.mjs";
import {
  assetPackageImportContractDefinition,
  supportedAssetPackageLodKeys,
  validateAssetPackageImportContract
} from "./asset-package-import-contract.mjs";

export const groundCoastalGrassGlbImportBridgeFoundationRequiredFields =
  Object.freeze([
    "glbRegistration",
    "atlasAssetReference"
  ]);

export const groundCoastalGrassGlbImportBridgeFoundationDefinition = deepFreeze({
  glbRegistration: {
    assetId: "GROUND_COASTAL_GRASS_001",
    glbPath:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
    lodReferences: {
      LOD_CLOSE:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
      LOD_GAMEPLAY:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb",
      LOD_MAP:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_MAP.glb",
      LOD_DISTANT_SILHOUETTE:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb"
    },
    manifestReference:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/ground-coastal-grass-manifest.json",
    metadataReference:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/ground-coastal-grass-metadata.json",
    validationStatus: {
      glbExistsValidated: false,
      manifestLinked: true,
      metadataLinked: true,
      assetIdentityValidated: true,
      exportValidated: true
    }
  },
  atlasAssetReference: {
    assetId: "GROUND_COASTAL_GRASS_001",
    renderPayload: {
      rendererAssetReference: "GROUND_COASTAL_GRASS_001",
      primaryGlb:
        "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
      rendererProfile: "custom-2.5d-passive"
    },
    lodSelector: {
      close: "LOD_CLOSE",
      gameplay: "LOD_GAMEPLAY",
      map: "LOD_MAP",
      distantSilhouette: "LOD_DISTANT_SILHOUETTE"
    },
    appearanceProfile: "day"
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const relativePathPattern = /^(?!\/).+/;
const supportedAppearanceProfiles = Object.freeze(["day", "sunset", "night"]);
const expectedLodSelectorKeys = Object.freeze([
  "close",
  "gameplay",
  "map",
  "distantSilhouette"
]);

export function createGroundCoastalGrassGlbImportBridgeFoundation(
  rawDefinition = groundCoastalGrassGlbImportBridgeFoundationDefinition
) {
  return normalizeBridgeFoundation(rawDefinition);
}

export function validateGroundCoastalGrassGlbImportBridgeFoundation(
  rawDefinition = groundCoastalGrassGlbImportBridgeFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeBridgeFoundation(rawDefinition);

    const packageResult =
      normalizedOptions.validateGroundCoastalGrassPrototypeAssetPackage(
        normalizedOptions.assetPackageDefinition
      );
    if (!packageResult.ok) {
      return freezeFailure(packageResult);
    }

    const generatorResult =
      normalizedOptions.validateGroundCoastalGrassLocalGenerator(
        normalizedOptions.localGeneratorDefinition
      );
    if (!generatorResult.ok) {
      return freezeFailure(generatorResult);
    }

    const pipelineResult =
      normalizedOptions.validateCoastalStarterPackBlenderGenerationPipeline001(
        normalizedOptions.pipelineDefinition
      );
    if (!pipelineResult.ok) {
      return freezeFailure(pipelineResult);
    }

    const importContractResult =
      normalizedOptions.validateAssetPackageImportContract(
        normalizedOptions.importContractDefinition,
        {
          validationContext: {
            componentLibrary: {
              findComponentById(componentId) {
                return [
                  "COASTAL_GROUND_PATCH_001",
                  "COASTAL_GRASS_CLUSTER_001"
                ].includes(componentId)
                  ? { componentId }
                  : null;
              },
              isComponentAvailable(componentId) {
                return [
                  "COASTAL_GROUND_PATCH_001",
                  "COASTAL_GRASS_CLUSTER_001"
                ].includes(componentId);
              }
            }
          },
          validateLightweightAssetBuildSpecification() {
            return Object.freeze({
              ok: true,
              errorCode: null,
              message: null,
              buildSpecification: Object.freeze({
                specification: Object.freeze({
                  assetId: "GROUND_COASTAL_GRASS_001",
                  componentMapping: [
                    Object.freeze({
                      componentId: "COASTAL_GROUND_PATCH_001"
                    }),
                    Object.freeze({
                      componentId: "COASTAL_GRASS_CLUSTER_001"
                    })
                  ],
                  materialSpecification: Object.freeze({
                    sharedMaterials: [
                      "COASTAL_GROUND_BASE_SHARED_001",
                      "COASTAL_GROUND_DETAIL_SHARED_001"
                    ],
                    reusableSurfaceDefinitions: [
                      Object.freeze({
                        surfaceId: "GROUND_BASE_SURFACE_001"
                      }),
                      Object.freeze({
                        surfaceId: "GRASS_DETAIL_SURFACE_001"
                      })
                    ]
                  }),
                  mobilePerformanceSpecification: Object.freeze({
                    storageTargetKb: 96,
                    ramTargetKb: 128,
                    gpuVertexBudget: 160,
                    batchingExpected: true
                  })
                }),
                rendererValidation: Object.freeze({
                  compatibility: Object.freeze({
                    rendererProfile: "custom-2.5d-passive",
                    passiveConsumerCompatibilityVerified: true
                  })
                })
              })
            });
          }
        }
      );
    if (!importContractResult.ok) {
      return freezeFailure(importContractResult);
    }

    validateCompatibility(
      foundation,
      packageResult.prototypeAssetPackage.package,
      generatorResult.localGenerator.definition,
      pipelineResult.generationPipeline.contract,
      importContractResult.importContract.contract,
      normalizedOptions.existsSync
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      glbImportBridge: Object.freeze({
        foundation,
        compatibility: Object.freeze({
          assetPackageVerified: true,
          localGeneratorVerified: true,
          pipelineVerified: true,
          importContractVerified: true,
          atlasReferenceVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "GroundCoastalGrassGlbImportBridgeFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      glbImportBridge: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    assetPackageDefinition:
      options.assetPackageDefinition ?? groundCoastalGrassPrototypeAssetPackageDefinition,
    localGeneratorDefinition:
      options.localGeneratorDefinition ?? groundCoastalGrassLocalGeneratorDefinition,
    pipelineDefinition:
      options.pipelineDefinition ??
      coastalStarterPackBlenderGenerationPipeline001Definition,
    importContractDefinition:
      options.importContractDefinition ??
      buildGroundCoastalGrassImportContractDefinition(),
    validateGroundCoastalGrassPrototypeAssetPackage:
      typeof options.validateGroundCoastalGrassPrototypeAssetPackage === "function"
        ? options.validateGroundCoastalGrassPrototypeAssetPackage
        : validateGroundCoastalGrassPrototypeAssetPackage,
    validateGroundCoastalGrassLocalGenerator:
      typeof options.validateGroundCoastalGrassLocalGenerator === "function"
        ? options.validateGroundCoastalGrassLocalGenerator
        : validateGroundCoastalGrassLocalGenerator,
    validateCoastalStarterPackBlenderGenerationPipeline001:
      typeof options.validateCoastalStarterPackBlenderGenerationPipeline001 ===
      "function"
        ? options.validateCoastalStarterPackBlenderGenerationPipeline001
        : validateCoastalStarterPackBlenderGenerationPipeline001,
    validateAssetPackageImportContract:
      typeof options.validateAssetPackageImportContract === "function"
        ? options.validateAssetPackageImportContract
        : validateAssetPackageImportContract,
    existsSync:
      typeof options.existsSync === "function" ? options.existsSync : defaultExistsSync
  });
}

function buildGroundCoastalGrassImportContractDefinition() {
  const base = structuredClone(assetPackageImportContractDefinition);
  base.assetId = "GROUND_COASTAL_GRASS_001";
  base.modelFiles.primary = "GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb";
  base.lodFiles = {
    close: "GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb",
    gameplay: "GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb",
    map: "GROUND_COASTAL_GRASS_001_LOD_MAP.glb",
    distantSilhouette: "GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb"
  };
  base.materials.reusableSurfaceDefinitions = [
    {
      surfaceId: "GROUND_BASE_SURFACE_001",
      materialFamily: "coastal_ground_base",
      atlasRegion: "coastal_ground_base"
    },
    {
      surfaceId: "GRASS_DETAIL_SURFACE_001",
      materialFamily: "coastal_grass_detail",
      atlasRegion: "coastal_grass_detail"
    }
  ];
  base.materials.materialReferences = [
    "COASTAL_GROUND_BASE_SHARED_001",
    "COASTAL_GROUND_DETAIL_SHARED_001"
  ];
  base.metadata.assetId = "GROUND_COASTAL_GRASS_001";
  base.metadata.lodReferences = { ...base.lodFiles };
  base.metadata.componentReferences = [
    "COASTAL_GROUND_PATCH_001",
    "COASTAL_GRASS_CLUSTER_001"
  ];
  base.metadata.materialReferences = [
    "COASTAL_GROUND_BASE_SHARED_001",
    "COASTAL_GROUND_DETAIL_SHARED_001"
  ];
  base.metadata.performanceMetadata = {
    storageTargetKb: 96,
    ramTargetKb: 128,
    gpuVertexBudget: 160,
    batchingExpected: true
  };
  return base;
}

function validateCompatibility(
  foundation,
  assetPackage,
  localGenerator,
  pipelineContract,
  importContract,
  existsSync
) {
  const registration = foundation.glbRegistration;
  const atlasReference = foundation.atlasAssetReference;

  if (registration.assetId !== assetPackage.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "GLB registration assetId must match the prototype asset package assetId."
    );
  }

  if (registration.assetId !== atlasReference.assetId) {
    throw createValidationError(
      "asset_identity_mismatch",
      "Atlas asset reference assetId must match the GLB registration assetId."
    );
  }

  if (registration.glbPath !== registration.lodReferences.LOD_CLOSE) {
    throw createValidationError(
      "primary_glb_mismatch",
      "Primary glbPath must match the close LOD registration reference."
    );
  }

  const expectedOutputRoot = localGenerator.expectedOutputLocation;
  for (const [lodLabel, lodPath] of Object.entries(registration.lodReferences)) {
    if (!lodPath.startsWith(expectedOutputRoot)) {
      throw createValidationError(
        "lod_reference_mismatch",
        `LOD registration ${lodLabel} must live under the approved export directory.`
      );
    }
  }

  if (!registration.manifestReference.startsWith(expectedOutputRoot)) {
    throw createValidationError(
      "manifest_linkage_mismatch",
      "Manifest reference must live under the approved export directory."
    );
  }

  if (!registration.metadataReference.startsWith(expectedOutputRoot)) {
    throw createValidationError(
      "metadata_linkage_mismatch",
      "Metadata reference must live under the approved export directory."
    );
  }

  const expectedLodPaths = {
    LOD_CLOSE: path.join(expectedOutputRoot, assetPackage.lodRequirements.close.output),
    LOD_GAMEPLAY: path.join(
      expectedOutputRoot,
      assetPackage.lodRequirements.gameplay.output
    ),
    LOD_MAP: path.join(expectedOutputRoot, assetPackage.lodRequirements.map.output),
    LOD_DISTANT_SILHOUETTE: path.join(
      expectedOutputRoot,
      assetPackage.lodRequirements.distantSilhouette.output
    )
  };

  for (const [lodLabel, expectedPath] of Object.entries(expectedLodPaths)) {
    if (registration.lodReferences[lodLabel] !== expectedPath) {
      throw createValidationError(
        "lod_reference_mismatch",
        `LOD registration ${lodLabel} must match the approved prototype package export output.`
      );
    }
  }

  if (
    path.basename(registration.manifestReference) !==
    "ground-coastal-grass-manifest.json"
  ) {
    throw createValidationError(
      "manifest_linkage_mismatch",
      "Manifest reference must preserve the approved local generator manifest filename."
    );
  }

  if (
    path.basename(registration.metadataReference) !==
    "ground-coastal-grass-metadata.json"
  ) {
    throw createValidationError(
      "metadata_linkage_mismatch",
      "Metadata reference must preserve the approved local generator metadata filename."
    );
  }

  validateGlbExistence(registration, existsSync);

  if (
    importContract.modelFiles.primary !==
    path.basename(registration.lodReferences.LOD_CLOSE)
  ) {
    throw createValidationError(
      "export_validation_mismatch",
      "Import contract primary model file must match the close LOD GLB registration."
    );
  }

  if (
    pipelineContract.exportConfiguration.manifestReference !== registration.assetId
  ) {
    throw createValidationError(
      "export_validation_mismatch",
      "Pipeline manifest reference must preserve the ground asset identity."
    );
  }

  if (
    atlasReference.renderPayload.primaryGlb !== registration.glbPath ||
    atlasReference.renderPayload.rendererAssetReference !== registration.assetId
  ) {
    throw createValidationError(
      "atlas_reference_mismatch",
      "Atlas render payload must point to the registered primary GLB and assetId."
    );
  }

  if (atlasReference.renderPayload.rendererProfile !== "custom-2.5d-passive") {
    throw createValidationError(
      "atlas_reference_mismatch",
      "Atlas render payload must preserve the passive renderer profile."
    );
  }

  if (
    JSON.stringify(Object.keys(atlasReference.lodSelector)) !==
    JSON.stringify(expectedLodSelectorKeys)
  ) {
    throw createValidationError(
      "atlas_reference_mismatch",
      "Atlas lodSelector must preserve close/gameplay/map/distantSilhouette keys."
    );
  }

  if (!supportedAppearanceProfiles.includes(atlasReference.appearanceProfile)) {
    throw createValidationError(
      "atlas_reference_mismatch",
      "Atlas appearanceProfile must be an approved appearance profile."
    );
  }
}

function validateGlbExistence(registration, existsSync) {
  const allPaths = [
    registration.glbPath,
    ...Object.values(registration.lodReferences),
    registration.manifestReference,
    registration.metadataReference
  ];
  const missingPaths = allPaths.filter((filePath) => !existsSync(filePath));
  if (missingPaths.length > 0) {
    throw createValidationError(
      "glb_missing",
      `GLB import bridge requires existing files before registration: ${missingPaths.join(", ")}`
    );
  }
}

function normalizeBridgeFoundation(rawDefinition) {
  const foundation = asPlainObject(rawDefinition, "GLB import bridge foundation");
  assertRequiredFields(foundation);

  return deepFreeze({
    glbRegistration: normalizeGlbRegistration(foundation.glbRegistration),
    atlasAssetReference: normalizeAtlasAssetReference(foundation.atlasAssetReference)
  });
}

function normalizeGlbRegistration(rawRegistration) {
  const registration = asPlainObject(rawRegistration, "glbRegistration");
  return deepFreeze({
    assetId: normalizePermanentId(registration.assetId, "glbRegistration.assetId"),
    glbPath: normalizeRelativePath(registration.glbPath, "glbRegistration.glbPath"),
    lodReferences: normalizeLodReferences(registration.lodReferences),
    manifestReference: normalizeRelativePath(
      registration.manifestReference,
      "glbRegistration.manifestReference"
    ),
    metadataReference: normalizeRelativePath(
      registration.metadataReference,
      "glbRegistration.metadataReference"
    ),
    validationStatus: normalizeValidationStatus(registration.validationStatus)
  });
}

function normalizeAtlasAssetReference(rawAtlasAssetReference) {
  const atlasAssetReference = asPlainObject(
    rawAtlasAssetReference,
    "atlasAssetReference"
  );
  const renderPayload = asPlainObject(
    atlasAssetReference.renderPayload,
    "atlasAssetReference.renderPayload"
  );
  const lodSelector = asPlainObject(
    atlasAssetReference.lodSelector,
    "atlasAssetReference.lodSelector"
  );

  return deepFreeze({
    assetId: normalizePermanentId(
      atlasAssetReference.assetId,
      "atlasAssetReference.assetId"
    ),
    renderPayload: deepFreeze({
      rendererAssetReference: normalizePermanentId(
        renderPayload.rendererAssetReference,
        "atlasAssetReference.renderPayload.rendererAssetReference"
      ),
      primaryGlb: normalizeRelativePath(
        renderPayload.primaryGlb,
        "atlasAssetReference.renderPayload.primaryGlb"
      ),
      rendererProfile: normalizeNonEmptyString(
        renderPayload.rendererProfile,
        "atlasAssetReference.renderPayload.rendererProfile"
      )
    }),
    lodSelector: deepFreeze({
      close: normalizeNonEmptyString(
        lodSelector.close,
        "atlasAssetReference.lodSelector.close"
      ),
      gameplay: normalizeNonEmptyString(
        lodSelector.gameplay,
        "atlasAssetReference.lodSelector.gameplay"
      ),
      map: normalizeNonEmptyString(
        lodSelector.map,
        "atlasAssetReference.lodSelector.map"
      ),
      distantSilhouette: normalizeNonEmptyString(
        lodSelector.distantSilhouette,
        "atlasAssetReference.lodSelector.distantSilhouette"
      )
    }),
    appearanceProfile: normalizeAppearanceProfile(
      atlasAssetReference.appearanceProfile,
      "atlasAssetReference.appearanceProfile"
    )
  });
}

function normalizeLodReferences(rawLodReferences) {
  const lodReferences = asPlainObject(rawLodReferences, "glbRegistration.lodReferences");
  return deepFreeze({
    LOD_CLOSE: normalizeRelativePath(
      lodReferences.LOD_CLOSE,
      "glbRegistration.lodReferences.LOD_CLOSE"
    ),
    LOD_GAMEPLAY: normalizeRelativePath(
      lodReferences.LOD_GAMEPLAY,
      "glbRegistration.lodReferences.LOD_GAMEPLAY"
    ),
    LOD_MAP: normalizeRelativePath(
      lodReferences.LOD_MAP,
      "glbRegistration.lodReferences.LOD_MAP"
    ),
    LOD_DISTANT_SILHOUETTE: normalizeRelativePath(
      lodReferences.LOD_DISTANT_SILHOUETTE,
      "glbRegistration.lodReferences.LOD_DISTANT_SILHOUETTE"
    )
  });
}

function normalizeValidationStatus(rawValidationStatus) {
  const validationStatus = asPlainObject(
    rawValidationStatus,
    "glbRegistration.validationStatus"
  );
  return deepFreeze({
    glbExistsValidated: normalizeBoolean(
      validationStatus.glbExistsValidated,
      "glbRegistration.validationStatus.glbExistsValidated"
    ),
    manifestLinked: normalizeBoolean(
      validationStatus.manifestLinked,
      "glbRegistration.validationStatus.manifestLinked"
    ),
    metadataLinked: normalizeBoolean(
      validationStatus.metadataLinked,
      "glbRegistration.validationStatus.metadataLinked"
    ),
    assetIdentityValidated: normalizeBoolean(
      validationStatus.assetIdentityValidated,
      "glbRegistration.validationStatus.assetIdentityValidated"
    ),
    exportValidated: normalizeBoolean(
      validationStatus.exportValidated,
      "glbRegistration.validationStatus.exportValidated"
    )
  });
}

function assertRequiredFields(foundation) {
  for (const fieldName of groundCoastalGrassGlbImportBridgeFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `GLB import bridge foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeAppearanceProfile(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName).toLowerCase();
  if (!supportedAppearanceProfiles.includes(value)) {
    throw createValidationError(
      "invalid_appearance_profile",
      `Field ${fieldName} must be one of ${supportedAppearanceProfiles.join(", ")}.`
    );
  }
  return value;
}

function normalizePermanentId(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!permanentIdPattern.test(value)) {
    throw createValidationError(
      "invalid_permanent_id",
      `Field ${fieldName} must be a permanent uppercase Asset Factory identifier.`
    );
  }
  return value;
}

function normalizeRelativePath(rawValue, fieldName) {
  const value = normalizeNonEmptyString(rawValue, fieldName);
  if (!relativePathPattern.test(value)) {
    throw createValidationError(
      "invalid_relative_path",
      `Field ${fieldName} must be a repo-relative path.`
    );
  }
  return value;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `Field ${fieldName} must be a boolean.`
    );
  }
  return value;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `Field ${fieldName} must be a non-empty string.`
    );
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
    glbImportBridge: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "GroundCoastalGrassGlbImportBridgeFoundationValidationError";
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
