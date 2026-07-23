import {
  assetPackageImportContractDefinition,
  buildAssetPackageImportContractContext,
  supportedAssetPackageImportFormats,
  supportedAssetPackageLodKeys,
  validateAssetPackageImportContract
} from "./asset-package-import-contract.mjs";
import {
  lightweightAssetBuildSpecificationDefinition
} from "./lightweight-asset-build-specification.mjs";

export const blenderGlbProductionWorkflowContractRequiredFields = Object.freeze([
  "assetId",
  "version",
  "blenderSceneRules",
  "glbExportRules",
  "modularAssetWorkflow",
  "materialWorkflow",
  "lodWorkflow",
  "preImportValidation",
  "metadata"
]);

export const blenderGlbProductionWorkflowContractDefinition = deepFreeze({
  assetId: "BUILDING_HOUSE_SMALL_COASTAL_001",
  version: "1.0.0",
  blenderSceneRules: {
    unitScale: {
      linearUnit: "meters",
      scaleLength: 1
    },
    worldOrientation: {
      upAxis: "Z",
      forwardAxis: "Y",
      northReference: "positive-y"
    },
    objectNaming: {
      assetRootObject: "BUILDING_HOUSE_SMALL_COASTAL_001_ROOT",
      lodObjectPrefix: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_",
      componentObjectPrefix: "BUILDING_HOUSE_SMALL_COASTAL_001_COMPONENT_"
    },
    collectionNaming: {
      assetCollection: "BUILDING_HOUSE_SMALL_COASTAL_001",
      lodCollections: {
        close: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_CLOSE",
        gameplay: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_GAMEPLAY",
        map: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_MAP",
        distantSilhouette: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_DISTANT_SILHOUETTE"
      }
    },
    pivotOriginRules: {
      rootOrigin: "ground_center",
      componentOrigins: "attachment_aligned",
      exportOriginFrozen: true
    },
    transformRules: {
      appliedRotation: true,
      appliedScale: true,
      appliedLocation: false
    }
  },
  glbExportRules: {
    primaryFormat: "glb",
    futureFormats: ["gltf"],
    namingConvention: "ASSET_OR_LOD_ID.glb",
    lodExportRules: {
      close: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_CLOSE.glb",
      gameplay: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_GAMEPLAY.glb",
      map: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_MAP.glb",
      distantSilhouette: "BUILDING_HOUSE_SMALL_COASTAL_001_LOD_DISTANT_SILHOUETTE.glb"
    },
    textureHandling: {
      embeddedTexturesAllowed: false,
      atlasOnly: true,
      externalAtlasReferences: ["COASTAL_ATLAS_RESIDENTIAL_001"]
    },
    compressionExpectations: {
      meshCompressionPreferred: true,
      textureCompressionPlanned: true
    }
  },
  modularAssetWorkflow: {
    componentNaming: [
      "COASTAL_HOUSE_WALL_PANEL_001",
      "COASTAL_HOUSE_ROOF_GABLE_001",
      "COASTAL_HOUSE_DOOR_BASIC_001",
      "COASTAL_HOUSE_WINDOW_SHUTTER_001"
    ],
    attachmentRules: {
      attachmentAlignment: "component-library-attachment-points",
      pivotCompatibilityRequired: true
    },
    reusableModuleRules: {
      sharedModulesRequired: true,
      bespokeGeometryMinimized: true,
      maxUniqueModules: 4
    },
    orientationVariants: ["north", "south", "east", "west"]
  },
  materialWorkflow: {
    materialNaming: [
      "COASTAL_WEATHERBOARD_SHARED_001",
      "COASTAL_ROOF_SHARED_001"
    ],
    textureAtlasRules: {
      atlasOnly: true,
      atlasReferences: ["COASTAL_ATLAS_RESIDENTIAL_001"]
    },
    sharedMaterialRules: {
      sharedMaterialsRequired: true,
      uniquePerAssetMaterialsAllowed: false
    },
    mobileLimitations: {
      maxMaterialFamilies: 2,
      maxAtlasCount: 1,
      normalMapOptional: true
    }
  },
  lodWorkflow: {
    close: {
      lodKey: "close",
      geometryProfile: "lod0",
      polygonBudget: 320
    },
    gameplay: {
      lodKey: "gameplay",
      geometryProfile: "lod1",
      polygonBudget: 180
    },
    map: {
      lodKey: "map",
      geometryProfile: "lod2",
      polygonBudget: 72
    },
    distantSilhouette: {
      lodKey: "distantSilhouette",
      geometryProfile: "lod3",
      polygonBudget: 24
    }
  },
  preImportValidation: {
    namingChecks: true,
    scaleChecks: true,
    orientationChecks: true,
    lodChecks: true,
    materialChecks: true,
    performanceChecks: true
  },
  metadata: {
    workflowProfileId: "BLENDER_GLB_WORKFLOW_PROFILE_001",
    rendererCompatibilityProfile: "custom-2.5d-passive",
    creatorSource: "internal",
    validationState: "validated"
  }
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;
const axisValues = Object.freeze(["X", "Y", "Z"]);
const orientationValues = Object.freeze(["north", "south", "east", "west"]);

export function buildBlenderGlbProductionWorkflowContractContext() {
  return Object.freeze(buildAssetPackageImportContractContext());
}

export function validateBlenderGlbProductionWorkflowContract(
  rawContract = blenderGlbProductionWorkflowContractDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeWorkflowOptions(options);
    const contract = normalizeWorkflowContract(rawContract);
    const importContractResult = normalizedOptions.validateAssetPackageImportContract(
      assetPackageImportContractDefinition,
      { validationContext: normalizedOptions.validationContext }
    );

    if (!importContractResult.ok) {
      return Object.freeze({
        ok: false,
        errorCode: importContractResult.errorCode,
        message: importContractResult.message,
        workflowContract: null
      });
    }

    const buildSpecification =
      importContractResult.importContract.buildSpecification.specification;
    const importContract = importContractResult.importContract.contract;

    validateWorkflowIdentity(contract, importContract);
    validateWorkflowLodFiles(contract, importContract, buildSpecification);
    validateWorkflowComponents(contract, buildSpecification.componentMapping);
    validateWorkflowMaterials(contract, buildSpecification, importContract);
    validateWorkflowPerformance(contract, buildSpecification.mobilePerformanceSpecification);
    validateWorkflowRendererCompatibility(
      contract,
      importContractResult.importContract.buildSpecification.rendererValidation.compatibility
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      workflowContract: Object.freeze({
        contract,
        importContract: importContractResult.importContract,
        compatibility: Object.freeze({
          identityVerified: true,
          lodWorkflowVerified: true,
          modularWorkflowVerified: true,
          materialWorkflowVerified: true,
          mobilePerformanceVerified: true,
          rendererCompatibilityVerified: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "BlenderGlbProductionWorkflowContractValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      workflowContract: null
    });
  }
}

function normalizeWorkflowOptions(options) {
  return Object.freeze({
    validationContext:
      options.validationContext ?? buildBlenderGlbProductionWorkflowContractContext(),
    validateAssetPackageImportContract:
      typeof options.validateAssetPackageImportContract === "function"
        ? options.validateAssetPackageImportContract
        : validateAssetPackageImportContract
  });
}

function normalizeWorkflowContract(rawContract) {
  const contract = asPlainObject(rawContract, "blender glb production workflow contract");
  assertRequiredFields(contract);

  return deepFreeze({
    assetId: normalizePermanentId(contract.assetId, "assetId"),
    version: normalizeVersion(contract.version, "version"),
    blenderSceneRules: normalizeBlenderSceneRules(contract.blenderSceneRules),
    glbExportRules: normalizeGlbExportRules(contract.glbExportRules),
    modularAssetWorkflow: normalizeModularAssetWorkflow(contract.modularAssetWorkflow),
    materialWorkflow: normalizeMaterialWorkflow(contract.materialWorkflow),
    lodWorkflow: normalizeLodWorkflow(contract.lodWorkflow),
    preImportValidation: normalizePreImportValidation(contract.preImportValidation),
    metadata: normalizeMetadata(contract.metadata)
  });
}

function validateWorkflowIdentity(contract, importContract) {
  if (contract.assetId !== importContract.assetId) {
    throw createWorkflowValidationError(
      "asset_identity_mismatch",
      "Workflow contract asset identity must match the asset package import contract identity."
    );
  }
}

function validateWorkflowLodFiles(contract, importContract, buildSpecification) {
  for (const lodKey of supportedAssetPackageLodKeys) {
    const expectedFile = importContract.lodFiles[lodKey];
    const workflowFile = contract.glbExportRules.lodExportRules[lodKey];
    if (workflowFile !== expectedFile) {
      throw createWorkflowValidationError(
        "lod_export_mismatch",
        `Workflow LOD export rule ${lodKey} must match the import contract LOD file identity.`
      );
    }

    const buildLod = buildSpecification.lodSpecification[lodKey];
    const workflowLod = contract.lodWorkflow[lodKey];
    if (workflowLod.geometryProfile !== buildLod.geometryProfile) {
      throw createWorkflowValidationError(
        "lod_profile_mismatch",
        `Workflow LOD profile ${lodKey} must match the lightweight build specification geometry profile.`
      );
    }
  }
}

function validateWorkflowComponents(contract, componentMapping) {
  const expectedComponentIds = componentMapping.map((entry) => entry.componentId);
  if (
    JSON.stringify(contract.modularAssetWorkflow.componentNaming) !==
    JSON.stringify(expectedComponentIds)
  ) {
    throw createWorkflowValidationError(
      "component_workflow_mismatch",
      "Workflow component naming must match the lightweight build specification component mapping."
    );
  }

  if (
    JSON.stringify(contract.modularAssetWorkflow.orientationVariants) !==
    JSON.stringify(orientationValues)
  ) {
    throw createWorkflowValidationError(
      "orientation_variant_mismatch",
      "Workflow orientation variants must cover the approved north/south/east/west set."
    );
  }
}

function validateWorkflowMaterials(contract, buildSpecification, importContract) {
  if (
    JSON.stringify(contract.materialWorkflow.materialNaming) !==
    JSON.stringify(buildSpecification.materialSpecification.sharedMaterials)
  ) {
    throw createWorkflowValidationError(
      "material_workflow_mismatch",
      "Workflow material naming must match the lightweight build specification shared materials."
    );
  }

  if (
    JSON.stringify(contract.materialWorkflow.textureAtlasRules.atlasReferences) !==
    JSON.stringify(importContract.textures.atlasReferences)
  ) {
    throw createWorkflowValidationError(
      "texture_atlas_mismatch",
      "Workflow texture atlas references must match the import contract atlas references."
    );
  }
}

function validateWorkflowPerformance(contract, mobilePerformanceSpecification) {
  const polygonBudgets = Object.values(contract.lodWorkflow).map((entry) => entry.polygonBudget);
  if (!(polygonBudgets[0] > polygonBudgets[1] && polygonBudgets[1] > polygonBudgets[2] && polygonBudgets[2] > polygonBudgets[3])) {
    throw createWorkflowValidationError(
      "invalid_lod_budget_order",
      "Workflow LOD polygon budgets must decrease from LOD0 through LOD3."
    );
  }

  if (
    polygonBudgets[0] > mobilePerformanceSpecification.gpuVertexBudget
  ) {
    throw createWorkflowValidationError(
      "gpu_budget_mismatch",
      "Workflow LOD0 polygon budget must not exceed the lightweight build GPU vertex budget."
    );
  }
}

function validateWorkflowRendererCompatibility(contract, rendererCompatibility) {
  if (
    contract.metadata.rendererCompatibilityProfile !==
    rendererCompatibility.rendererProfile
  ) {
    throw createWorkflowValidationError(
      "renderer_profile_mismatch",
      "Workflow renderer compatibility profile must match the passive Custom 2.5D renderer profile."
    );
  }
}

function normalizeBlenderSceneRules(value) {
  const rules = asPlainObject(value, "blenderSceneRules");
  const unitScale = asPlainObject(rules.unitScale, "blenderSceneRules.unitScale");
  const worldOrientation = asPlainObject(
    rules.worldOrientation,
    "blenderSceneRules.worldOrientation"
  );
  const objectNaming = asPlainObject(rules.objectNaming, "blenderSceneRules.objectNaming");
  const collectionNaming = asPlainObject(
    rules.collectionNaming,
    "blenderSceneRules.collectionNaming"
  );
  const pivotOriginRules = asPlainObject(
    rules.pivotOriginRules,
    "blenderSceneRules.pivotOriginRules"
  );
  const transformRules = asPlainObject(
    rules.transformRules,
    "blenderSceneRules.transformRules"
  );

  return deepFreeze({
    unitScale: deepFreeze({
      linearUnit: normalizeStringValue(unitScale.linearUnit, "unitScale.linearUnit"),
      scaleLength: normalizePositiveNumber(unitScale.scaleLength, "unitScale.scaleLength")
    }),
    worldOrientation: deepFreeze({
      upAxis: normalizeAxis(worldOrientation.upAxis, "worldOrientation.upAxis"),
      forwardAxis: normalizeAxis(
        worldOrientation.forwardAxis,
        "worldOrientation.forwardAxis"
      ),
      northReference: normalizeStringValue(
        worldOrientation.northReference,
        "worldOrientation.northReference"
      )
    }),
    objectNaming: deepFreeze({
      assetRootObject: normalizeStringValue(
        objectNaming.assetRootObject,
        "objectNaming.assetRootObject"
      ),
      lodObjectPrefix: normalizeStringValue(
        objectNaming.lodObjectPrefix,
        "objectNaming.lodObjectPrefix"
      ),
      componentObjectPrefix: normalizeStringValue(
        objectNaming.componentObjectPrefix,
        "objectNaming.componentObjectPrefix"
      )
    }),
    collectionNaming: deepFreeze({
      assetCollection: normalizeStringValue(
        collectionNaming.assetCollection,
        "collectionNaming.assetCollection"
      ),
      lodCollections: normalizeLodStringMap(
        collectionNaming.lodCollections,
        "collectionNaming.lodCollections"
      )
    }),
    pivotOriginRules: deepFreeze({
      rootOrigin: normalizeStringValue(
        pivotOriginRules.rootOrigin,
        "pivotOriginRules.rootOrigin"
      ),
      componentOrigins: normalizeStringValue(
        pivotOriginRules.componentOrigins,
        "pivotOriginRules.componentOrigins"
      ),
      exportOriginFrozen: normalizeBoolean(
        pivotOriginRules.exportOriginFrozen,
        "pivotOriginRules.exportOriginFrozen"
      )
    }),
    transformRules: deepFreeze({
      appliedRotation: normalizeBoolean(
        transformRules.appliedRotation,
        "transformRules.appliedRotation"
      ),
      appliedScale: normalizeBoolean(
        transformRules.appliedScale,
        "transformRules.appliedScale"
      ),
      appliedLocation: normalizeBoolean(
        transformRules.appliedLocation,
        "transformRules.appliedLocation"
      )
    })
  });
}

function normalizeGlbExportRules(value) {
  const rules = asPlainObject(value, "glbExportRules");
  const textureHandling = asPlainObject(
    rules.textureHandling,
    "glbExportRules.textureHandling"
  );
  const compressionExpectations = asPlainObject(
    rules.compressionExpectations,
    "glbExportRules.compressionExpectations"
  );

  return deepFreeze({
    primaryFormat: normalizeFormat(rules.primaryFormat, "glbExportRules.primaryFormat"),
    futureFormats: deepFreeze(
      normalizeSupportedFormatsArray(rules.futureFormats, "glbExportRules.futureFormats")
    ),
    namingConvention: normalizeStringValue(
      rules.namingConvention,
      "glbExportRules.namingConvention"
    ),
    lodExportRules: normalizeLodStringMap(rules.lodExportRules, "glbExportRules.lodExportRules"),
    textureHandling: deepFreeze({
      embeddedTexturesAllowed: normalizeBoolean(
        textureHandling.embeddedTexturesAllowed,
        "textureHandling.embeddedTexturesAllowed"
      ),
      atlasOnly: normalizeBoolean(textureHandling.atlasOnly, "textureHandling.atlasOnly"),
      externalAtlasReferences: deepFreeze(
        normalizePermanentIdArray(
          textureHandling.externalAtlasReferences,
          "textureHandling.externalAtlasReferences"
        )
      )
    }),
    compressionExpectations: deepFreeze({
      meshCompressionPreferred: normalizeBoolean(
        compressionExpectations.meshCompressionPreferred,
        "compressionExpectations.meshCompressionPreferred"
      ),
      textureCompressionPlanned: normalizeBoolean(
        compressionExpectations.textureCompressionPlanned,
        "compressionExpectations.textureCompressionPlanned"
      )
    })
  });
}

function normalizeModularAssetWorkflow(value) {
  const workflow = asPlainObject(value, "modularAssetWorkflow");
  const attachmentRules = asPlainObject(
    workflow.attachmentRules,
    "modularAssetWorkflow.attachmentRules"
  );
  const reusableModuleRules = asPlainObject(
    workflow.reusableModuleRules,
    "modularAssetWorkflow.reusableModuleRules"
  );

  return deepFreeze({
    componentNaming: deepFreeze(
      normalizePermanentIdArray(workflow.componentNaming, "modularAssetWorkflow.componentNaming")
    ),
    attachmentRules: deepFreeze({
      attachmentAlignment: normalizeStringValue(
        attachmentRules.attachmentAlignment,
        "attachmentRules.attachmentAlignment"
      ),
      pivotCompatibilityRequired: normalizeBoolean(
        attachmentRules.pivotCompatibilityRequired,
        "attachmentRules.pivotCompatibilityRequired"
      )
    }),
    reusableModuleRules: deepFreeze({
      sharedModulesRequired: normalizeBoolean(
        reusableModuleRules.sharedModulesRequired,
        "reusableModuleRules.sharedModulesRequired"
      ),
      bespokeGeometryMinimized: normalizeBoolean(
        reusableModuleRules.bespokeGeometryMinimized,
        "reusableModuleRules.bespokeGeometryMinimized"
      ),
      maxUniqueModules: normalizePositiveInteger(
        reusableModuleRules.maxUniqueModules,
        "reusableModuleRules.maxUniqueModules"
      )
    }),
    orientationVariants: deepFreeze(
      normalizeOrientationArray(
        workflow.orientationVariants,
        "modularAssetWorkflow.orientationVariants"
      )
    )
  });
}

function normalizeMaterialWorkflow(value) {
  const workflow = asPlainObject(value, "materialWorkflow");
  const textureAtlasRules = asPlainObject(
    workflow.textureAtlasRules,
    "materialWorkflow.textureAtlasRules"
  );
  const sharedMaterialRules = asPlainObject(
    workflow.sharedMaterialRules,
    "materialWorkflow.sharedMaterialRules"
  );
  const mobileLimitations = asPlainObject(
    workflow.mobileLimitations,
    "materialWorkflow.mobileLimitations"
  );

  return deepFreeze({
    materialNaming: deepFreeze(
      normalizePermanentIdArray(workflow.materialNaming, "materialWorkflow.materialNaming")
    ),
    textureAtlasRules: deepFreeze({
      atlasOnly: normalizeBoolean(
        textureAtlasRules.atlasOnly,
        "textureAtlasRules.atlasOnly"
      ),
      atlasReferences: deepFreeze(
        normalizePermanentIdArray(
          textureAtlasRules.atlasReferences,
          "textureAtlasRules.atlasReferences"
        )
      )
    }),
    sharedMaterialRules: deepFreeze({
      sharedMaterialsRequired: normalizeBoolean(
        sharedMaterialRules.sharedMaterialsRequired,
        "sharedMaterialRules.sharedMaterialsRequired"
      ),
      uniquePerAssetMaterialsAllowed: normalizeBoolean(
        sharedMaterialRules.uniquePerAssetMaterialsAllowed,
        "sharedMaterialRules.uniquePerAssetMaterialsAllowed"
      )
    }),
    mobileLimitations: deepFreeze({
      maxMaterialFamilies: normalizePositiveInteger(
        mobileLimitations.maxMaterialFamilies,
        "mobileLimitations.maxMaterialFamilies"
      ),
      maxAtlasCount: normalizePositiveInteger(
        mobileLimitations.maxAtlasCount,
        "mobileLimitations.maxAtlasCount"
      ),
      normalMapOptional: normalizeBoolean(
        mobileLimitations.normalMapOptional,
        "mobileLimitations.normalMapOptional"
      )
    })
  });
}

function normalizeLodWorkflow(value) {
  const workflow = asPlainObject(value, "lodWorkflow");
  const normalized = {};
  for (const lodKey of supportedAssetPackageLodKeys) {
    const lodEntry = asPlainObject(workflow[lodKey], `lodWorkflow.${lodKey}`);
    normalized[lodKey] = deepFreeze({
      lodKey: normalizeLodKey(lodEntry.lodKey, `lodWorkflow.${lodKey}.lodKey`),
      geometryProfile: normalizeStringValue(
        lodEntry.geometryProfile,
        `lodWorkflow.${lodKey}.geometryProfile`
      ),
      polygonBudget: normalizePositiveInteger(
        lodEntry.polygonBudget,
        `lodWorkflow.${lodKey}.polygonBudget`
      )
    });
  }

  return deepFreeze(normalized);
}

function normalizePreImportValidation(value) {
  const validation = asPlainObject(value, "preImportValidation");
  return deepFreeze({
    namingChecks: normalizeBoolean(validation.namingChecks, "preImportValidation.namingChecks"),
    scaleChecks: normalizeBoolean(validation.scaleChecks, "preImportValidation.scaleChecks"),
    orientationChecks: normalizeBoolean(
      validation.orientationChecks,
      "preImportValidation.orientationChecks"
    ),
    lodChecks: normalizeBoolean(validation.lodChecks, "preImportValidation.lodChecks"),
    materialChecks: normalizeBoolean(
      validation.materialChecks,
      "preImportValidation.materialChecks"
    ),
    performanceChecks: normalizeBoolean(
      validation.performanceChecks,
      "preImportValidation.performanceChecks"
    )
  });
}

function normalizeMetadata(value) {
  const metadata = asPlainObject(value, "metadata");
  return deepFreeze({
    workflowProfileId: normalizePermanentId(
      metadata.workflowProfileId,
      "metadata.workflowProfileId"
    ),
    rendererCompatibilityProfile: normalizeStringValue(
      metadata.rendererCompatibilityProfile,
      "metadata.rendererCompatibilityProfile"
    ),
    creatorSource: normalizeStringValue(metadata.creatorSource, "metadata.creatorSource"),
    validationState: normalizeStringValue(
      metadata.validationState,
      "metadata.validationState"
    )
  });
}

function normalizeSupportedFormatsArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createWorkflowValidationError(
      "invalid_field_type",
      `${fieldName} must be an array of supported future formats.`
    );
  }

  return value.map((entry, index) =>
    normalizeFormat(entry, `${fieldName}[${index}]`)
  );
}

function normalizeLodStringMap(value, fieldName) {
  const lodMap = asPlainObject(value, fieldName);
  const normalized = {};
  for (const lodKey of supportedAssetPackageLodKeys) {
    normalized[lodKey] = normalizeStringValue(lodMap[lodKey], `${fieldName}.${lodKey}`);
  }

  return deepFreeze(normalized);
}

function normalizeOrientationArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createWorkflowValidationError(
      "invalid_field_type",
      `${fieldName} must be an array of orientation values.`
    );
  }

  return value.map((entry, index) =>
    normalizeOrientation(entry, `${fieldName}[${index}]`)
  );
}

function normalizeFormat(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toLowerCase();
  if (!supportedAssetPackageImportFormats.includes(normalized)) {
    throw createWorkflowValidationError(
      "unsupported_format",
      `Format ${normalized} is not part of the approved workflow format set.`
    );
  }

  return normalized;
}

function normalizeAxis(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!axisValues.includes(normalized)) {
    throw createWorkflowValidationError(
      "invalid_axis",
      `Field ${fieldName} must use one of ${axisValues.join(", ")}.`
    );
  }

  return normalized;
}

function normalizeOrientation(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toLowerCase();
  if (!orientationValues.includes(normalized)) {
    throw createWorkflowValidationError(
      "invalid_orientation",
      `Field ${fieldName} must use one of ${orientationValues.join(", ")}.`
    );
  }

  return normalized;
}

function normalizeLodKey(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!supportedAssetPackageLodKeys.includes(normalized)) {
    throw createWorkflowValidationError(
      "invalid_lod_key",
      `Field ${fieldName} must use one of ${supportedAssetPackageLodKeys.join(", ")}.`
    );
  }

  return normalized;
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createWorkflowValidationError(
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
    throw createWorkflowValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createWorkflowValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }

  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createWorkflowValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a string.`
    );
  }

  const normalized = value.trim();
  if (!normalized) {
    throw createWorkflowValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be empty.`
    );
  }

  return normalized;
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw createWorkflowValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive integer.`
    );
  }

  return value;
}

function normalizePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw createWorkflowValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive finite number.`
    );
  }

  return value;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createWorkflowValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
}

function assertRequiredFields(contract) {
  for (const fieldName of blenderGlbProductionWorkflowContractRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(contract, fieldName)) {
      throw createWorkflowValidationError(
        "missing_required_field",
        `Blender GLB production workflow contract is missing required field ${fieldName}.`
      );
    }
  }
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createWorkflowValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createWorkflowValidationError(code, message) {
  const error = new Error(message);
  error.name = "BlenderGlbProductionWorkflowContractValidationError";
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
