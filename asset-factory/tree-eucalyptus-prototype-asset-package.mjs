import {
  coastalStarterPackBlenderBatch001Definition,
  validateCoastalStarterPackBlenderBatch001
} from "./coastal-starter-pack-blender-batch-001-foundation.mjs";
import {
  buildBlenderSceneTemplate,
  buildGlbExportPreparationHelpers
} from "./coastal-starter-pack-blender-generation-pipeline-001.mjs";

export const treeEucalyptusPrototypeAssetPackageRequiredFields = Object.freeze([
  "assetId",
  "assetSourceDefinition",
  "geometryRequirements",
  "materialRequirements",
  "lodRequirements",
  "exportMetadata",
  "assetManifest",
  "validationMetadata"
]);

export const treeEucalyptusPrototypeAssetPackageDefinition = deepFreeze({
  assetId: "TREE_EUCALYPTUS_001",
  assetSourceDefinition: deepFreeze({
    sourceType: "generated-prototype",
    generationJobId: "COASTAL_STARTER_GENERATION_JOB_002",
    batchJobId: "COASTAL_STARTER_BLENDER_JOB_002",
    assetFamilyId: "COASTAL_NATURE_FAMILY_001",
    recipeReference: "TREE_EUCALYPTUS_RECIPE_001",
    realBlenderExecutionOccurred: false
  }),
  geometryRequirements: deepFreeze({
    collectionContract: buildBlenderSceneTemplate("TREE_EUCALYPTUS_001").collectionNames,
    geometryProfile: "organic-tree-prototype",
    componentDefinitions: deepFreeze([
      createComponentDefinition("TREE_TRUNK_EUCALYPTUS_001", "trunk-core", "lod0"),
      createComponentDefinition("TREE_BRANCH_SMALL_001", "branch-small", "lod1"),
      createComponentDefinition("TREE_BRANCH_LARGE_001", "branch-large", "lod0"),
      createComponentDefinition("TREE_CANOPY_EUCALYPTUS_001", "canopy-core", "lod1"),
      createComponentDefinition("TREE_LEAF_CLUSTER_001", "leaf-cluster", "lod2")
    ]),
    variationSupport: deepFreeze(["small", "medium", "large"]),
    mobileGeometryBudget: deepFreeze({
      gpuVertexBudget: 240,
      batchingExpected: true
    })
  }),
  materialRequirements: deepFreeze({
    sharedMaterialProfile: "coastal-organic-materials",
    materialDefinitions: deepFreeze([
      createMaterialDefinition("MAT_EUCALYPTUS_BARK_001", "bark"),
      createMaterialDefinition("MAT_EUCALYPTUS_LEAF_001", "leaf"),
      createMaterialDefinition("MAT_EUCALYPTUS_LEAF_VARIATION_001", "leaf-variation")
    ]),
    textureStrategy: "shared_atlas_mobile_ready"
  }),
  lodRequirements: deepFreeze({
    close: createLodDefinition("close", "lod0", "TREE_EUCALYPTUS_001_LOD_CLOSE.glb"),
    gameplay: createLodDefinition(
      "gameplay",
      "lod1",
      "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"
    ),
    map: createLodDefinition("map", "lod2", "TREE_EUCALYPTUS_001_LOD_MAP.glb"),
    distantSilhouette: createLodDefinition(
      "distantSilhouette",
      "lod3",
      "TREE_EUCALYPTUS_001_LOD_DISTANT_SILHOUETTE.glb"
    )
  }),
  exportMetadata: deepFreeze({
    ...buildGlbExportPreparationHelpers("TREE_EUCALYPTUS_001"),
    assetPackageLocation:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export",
    realBlenderExecutionOccurred: false,
    blendArtifactProduced: false,
    glbArtifactProduced: false
  }),
  assetManifest: deepFreeze({
    assetId: "TREE_EUCALYPTUS_001",
    recipeReference: "TREE_EUCALYPTUS_RECIPE_001",
    manifestVersion: "1.0.0",
    manifestReady: true
  }),
  validationMetadata: deepFreeze({
    blenderPipelineCompatibilityValidated: true,
    sceneContractValidated: true,
    exportReadinessValidated: true,
    manifestReadinessValidated: true,
    performanceMetadataValidated: true,
    performanceMetadata: deepFreeze({
      storageTargetKb: 128,
      ramTargetKb: 192,
      gpuVertexBudget: 240,
      textureStrategy: "shared_atlas_mobile_ready"
    })
  })
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;
const supportedLodKeys = Object.freeze([
  "close",
  "gameplay",
  "map",
  "distantSilhouette"
]);
const supportedVariations = Object.freeze(["small", "medium", "large"]);

export function createTreeEucalyptusPrototypeAssetPackage(
  rawPackage = treeEucalyptusPrototypeAssetPackageDefinition
) {
  return normalizePrototypeAssetPackage(rawPackage);
}

export function validateTreeEucalyptusPrototypeAssetPackage(
  rawPackage = treeEucalyptusPrototypeAssetPackageDefinition,
  options = {}
) {
  try {
    const batchResult = validateCoastalStarterPackBlenderBatch001(
      options.batchDefinition ?? coastalStarterPackBlenderBatch001Definition
    );
    if (!batchResult.ok) {
      return freezeFailure(batchResult);
    }

    const prototypeAssetPackage = normalizePrototypeAssetPackage(rawPackage);
    validatePackageCompatibility(
      prototypeAssetPackage,
      batchResult.batch.definition
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      prototypeAssetPackage: Object.freeze({
        package: prototypeAssetPackage,
        compatibility: Object.freeze({
          blenderPipelineCompatibilityVerified: true,
          sceneContractVerified: true,
          exportReadinessVerified: true,
          manifestReadinessVerified: true,
          passiveOnly: true,
          realBlenderExecutionOccurred: false,
          blendArtifactProduced: false,
          glbArtifactProduced: false
        })
      })
    });
  } catch (error) {
    if (error?.name !== "TreeEucalyptusPrototypeAssetPackageValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      prototypeAssetPackage: null
    });
  }
}

function normalizePrototypeAssetPackage(rawPackage) {
  const prototypeAssetPackage = asPlainObject(
    rawPackage,
    "tree eucalyptus prototype asset package"
  );
  assertRequiredFields(prototypeAssetPackage);

  return deepFreeze({
    assetId: normalizePermanentId(prototypeAssetPackage.assetId, "assetId"),
    assetSourceDefinition: normalizeAssetSourceDefinition(
      prototypeAssetPackage.assetSourceDefinition
    ),
    geometryRequirements: normalizeGeometryRequirements(
      prototypeAssetPackage.geometryRequirements
    ),
    materialRequirements: normalizeMaterialRequirements(
      prototypeAssetPackage.materialRequirements
    ),
    lodRequirements: normalizeLodRequirements(prototypeAssetPackage.lodRequirements),
    exportMetadata: normalizeExportMetadata(prototypeAssetPackage.exportMetadata),
    assetManifest: normalizeAssetManifest(prototypeAssetPackage.assetManifest),
    validationMetadata: normalizeValidationMetadata(
      prototypeAssetPackage.validationMetadata
    )
  });
}

function validatePackageCompatibility(prototypeAssetPackage, batch) {
  const batchJob =
    batch.blenderJobs.find(
      (blenderJob) => blenderJob.assetId === prototypeAssetPackage.assetId
    ) ?? null;

  if (!batchJob) {
    throw createValidationError(
      "missing_batch_job",
      `Prototype asset package ${prototypeAssetPackage.assetId} is not present in Blender Batch 001.`
    );
  }

  if (
    prototypeAssetPackage.assetSourceDefinition.recipeReference !==
    batchJob.recipeReference
  ) {
    throw createValidationError(
      "recipe_reference_mismatch",
      "Prototype asset package recipe reference must match the approved Blender batch job."
    );
  }

  const expectedSceneContract = buildBlenderSceneTemplate("TREE_EUCALYPTUS_001").collectionNames;
  if (
    prototypeAssetPackage.geometryRequirements.collectionContract.length !==
      expectedSceneContract.length ||
    prototypeAssetPackage.geometryRequirements.collectionContract.some(
      (collectionName, index) => collectionName !== expectedSceneContract[index]
    )
  ) {
    throw createValidationError(
      "scene_contract_mismatch",
      "Prototype asset package scene contract must match the Blender generation pipeline scene template."
    );
  }

  if (
    prototypeAssetPackage.exportMetadata.format !== "glb" ||
    prototypeAssetPackage.exportMetadata.glbArtifactProduced ||
    prototypeAssetPackage.exportMetadata.blendArtifactProduced ||
    prototypeAssetPackage.exportMetadata.realBlenderExecutionOccurred
  ) {
    throw createValidationError(
      "unexpected_real_artifact_state",
      "Prototype asset package must remain passive and must not claim real Blender execution or produced artifacts."
    );
  }

  if (
    prototypeAssetPackage.validationMetadata.performanceMetadata.gpuVertexBudget !==
    batchJob.validationRequirements.mobilePerformanceMetadata.gpuVertexBudget
  ) {
    throw createValidationError(
      "performance_metadata_mismatch",
      "Prototype asset package performance metadata must match the approved Blender batch mobile performance metadata."
    );
  }
}

function assertRequiredFields(prototypeAssetPackage) {
  for (const fieldName of treeEucalyptusPrototypeAssetPackageRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(prototypeAssetPackage, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Tree eucalyptus prototype asset package is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeAssetSourceDefinition(rawAssetSourceDefinition) {
  const assetSourceDefinition = asPlainObject(
    rawAssetSourceDefinition,
    "assetSourceDefinition"
  );

  return deepFreeze({
    sourceType: normalizeStringValue(
      assetSourceDefinition.sourceType,
      "assetSourceDefinition.sourceType"
    ),
    generationJobId: normalizePermanentId(
      assetSourceDefinition.generationJobId,
      "assetSourceDefinition.generationJobId"
    ),
    batchJobId: normalizePermanentId(
      assetSourceDefinition.batchJobId,
      "assetSourceDefinition.batchJobId"
    ),
    assetFamilyId: normalizePermanentId(
      assetSourceDefinition.assetFamilyId,
      "assetSourceDefinition.assetFamilyId"
    ),
    recipeReference: normalizePermanentId(
      assetSourceDefinition.recipeReference,
      "assetSourceDefinition.recipeReference"
    ),
    realBlenderExecutionOccurred: normalizeBoolean(
      assetSourceDefinition.realBlenderExecutionOccurred,
      "assetSourceDefinition.realBlenderExecutionOccurred"
    )
  });
}

function normalizeGeometryRequirements(rawGeometryRequirements) {
  const geometryRequirements = asPlainObject(
    rawGeometryRequirements,
    "geometryRequirements"
  );

  const variationSupport = normalizeStringArray(
    geometryRequirements.variationSupport,
    "geometryRequirements.variationSupport"
  );
  for (const variation of variationSupport) {
    if (!supportedVariations.includes(variation.toLowerCase())) {
      throw createValidationError(
        "invalid_variation_support",
        `Unsupported tree variation ${variation} in geometryRequirements.variationSupport.`
      );
    }
  }

  return deepFreeze({
    collectionContract: deepFreeze(
      normalizeStringArray(
        geometryRequirements.collectionContract,
        "geometryRequirements.collectionContract"
      )
    ),
    geometryProfile: normalizeStringValue(
      geometryRequirements.geometryProfile,
      "geometryRequirements.geometryProfile"
    ),
    componentDefinitions: deepFreeze(
      normalizeComponentDefinitions(geometryRequirements.componentDefinitions)
    ),
    variationSupport: deepFreeze(variationSupport.map((variation) => variation.toLowerCase())),
    mobileGeometryBudget: normalizeMobileGeometryBudget(
      geometryRequirements.mobileGeometryBudget
    )
  });
}

function normalizeComponentDefinitions(rawComponentDefinitions) {
  if (!Array.isArray(rawComponentDefinitions)) {
    throw createValidationError(
      "invalid_field_type",
      "geometryRequirements.componentDefinitions must be an array."
    );
  }

  return rawComponentDefinitions.map((entry, index) => {
    const componentDefinition = asPlainObject(
      entry,
      `geometryRequirements.componentDefinitions[${index}]`
    );
    return deepFreeze({
      componentId: normalizePermanentId(
        componentDefinition.componentId,
        `geometryRequirements.componentDefinitions[${index}].componentId`
      ),
      componentRole: normalizeStringValue(
        componentDefinition.componentRole,
        `geometryRequirements.componentDefinitions[${index}].componentRole`
      ),
      lodBias: normalizeStringValue(
        componentDefinition.lodBias,
        `geometryRequirements.componentDefinitions[${index}].lodBias`
      )
    });
  });
}

function normalizeMobileGeometryBudget(rawMobileGeometryBudget) {
  const mobileGeometryBudget = asPlainObject(
    rawMobileGeometryBudget,
    "geometryRequirements.mobileGeometryBudget"
  );

  return deepFreeze({
    gpuVertexBudget: normalizePositiveNumber(
      mobileGeometryBudget.gpuVertexBudget,
      "geometryRequirements.mobileGeometryBudget.gpuVertexBudget"
    ),
    batchingExpected: normalizeBoolean(
      mobileGeometryBudget.batchingExpected,
      "geometryRequirements.mobileGeometryBudget.batchingExpected"
    )
  });
}

function normalizeMaterialRequirements(rawMaterialRequirements) {
  const materialRequirements = asPlainObject(
    rawMaterialRequirements,
    "materialRequirements"
  );

  return deepFreeze({
    sharedMaterialProfile: normalizeStringValue(
      materialRequirements.sharedMaterialProfile,
      "materialRequirements.sharedMaterialProfile"
    ),
    materialDefinitions: deepFreeze(
      normalizeMaterialDefinitions(materialRequirements.materialDefinitions)
    ),
    textureStrategy: normalizeStringValue(
      materialRequirements.textureStrategy,
      "materialRequirements.textureStrategy"
    )
  });
}

function normalizeMaterialDefinitions(rawMaterialDefinitions) {
  if (!Array.isArray(rawMaterialDefinitions)) {
    throw createValidationError(
      "invalid_field_type",
      "materialRequirements.materialDefinitions must be an array."
    );
  }

  return rawMaterialDefinitions.map((entry, index) => {
    const materialDefinition = asPlainObject(
      entry,
      `materialRequirements.materialDefinitions[${index}]`
    );
    return deepFreeze({
      materialId: normalizePermanentId(
        materialDefinition.materialId,
        `materialRequirements.materialDefinitions[${index}].materialId`
      ),
      materialRole: normalizeStringValue(
        materialDefinition.materialRole,
        `materialRequirements.materialDefinitions[${index}].materialRole`
      )
    });
  });
}

function normalizeLodRequirements(rawLodRequirements) {
  const lodRequirements = asPlainObject(rawLodRequirements, "lodRequirements");
  const normalized = {};

  for (const lodKey of supportedLodKeys) {
    const lodDefinition = asPlainObject(
      lodRequirements[lodKey],
      `lodRequirements.${lodKey}`
    );
    normalized[lodKey] = deepFreeze({
      lodKey: normalizeStringValue(lodDefinition.lodKey, `lodRequirements.${lodKey}.lodKey`),
      geometryProfile: normalizeStringValue(
        lodDefinition.geometryProfile,
        `lodRequirements.${lodKey}.geometryProfile`
      ),
      output: normalizeStringValue(
        lodDefinition.output,
        `lodRequirements.${lodKey}.output`
      )
    });
  }

  return deepFreeze(normalized);
}

function normalizeExportMetadata(rawExportMetadata) {
  const exportMetadata = asPlainObject(rawExportMetadata, "exportMetadata");

  return deepFreeze({
    assetId: normalizePermanentId(exportMetadata.assetId, "exportMetadata.assetId"),
    format: normalizeStringValue(exportMetadata.format, "exportMetadata.format").toLowerCase(),
    exportRoot: normalizeUppercaseToken(
      exportMetadata.exportRoot,
      "exportMetadata.exportRoot"
    ),
    lodExports: normalizeLodExports(exportMetadata.lodExports),
    manifestReference: normalizePermanentId(
      exportMetadata.manifestReference,
      "exportMetadata.manifestReference"
    ),
    assetPackageLocation: normalizeStringValue(
      exportMetadata.assetPackageLocation,
      "exportMetadata.assetPackageLocation"
    ),
    realBlenderExecutionOccurred: normalizeBoolean(
      exportMetadata.realBlenderExecutionOccurred,
      "exportMetadata.realBlenderExecutionOccurred"
    ),
    blendArtifactProduced: normalizeBoolean(
      exportMetadata.blendArtifactProduced,
      "exportMetadata.blendArtifactProduced"
    ),
    glbArtifactProduced: normalizeBoolean(
      exportMetadata.glbArtifactProduced,
      "exportMetadata.glbArtifactProduced"
    )
  });
}

function normalizeLodExports(rawLodExports) {
  const lodExports = asPlainObject(rawLodExports, "exportMetadata.lodExports");
  const normalized = {};

  for (const lodKey of supportedLodKeys) {
    normalized[lodKey] = normalizeStringValue(
      lodExports[lodKey],
      `exportMetadata.lodExports.${lodKey}`
    );
  }

  return deepFreeze(normalized);
}

function normalizeAssetManifest(rawAssetManifest) {
  const assetManifest = asPlainObject(rawAssetManifest, "assetManifest");

  return deepFreeze({
    assetId: normalizePermanentId(assetManifest.assetId, "assetManifest.assetId"),
    recipeReference: normalizePermanentId(
      assetManifest.recipeReference,
      "assetManifest.recipeReference"
    ),
    manifestVersion: normalizeVersion(
      assetManifest.manifestVersion,
      "assetManifest.manifestVersion"
    ),
    manifestReady: normalizeBoolean(
      assetManifest.manifestReady,
      "assetManifest.manifestReady"
    )
  });
}

function normalizeValidationMetadata(rawValidationMetadata) {
  const validationMetadata = asPlainObject(
    rawValidationMetadata,
    "validationMetadata"
  );
  const performanceMetadata = asPlainObject(
    validationMetadata.performanceMetadata,
    "validationMetadata.performanceMetadata"
  );

  return deepFreeze({
    blenderPipelineCompatibilityValidated: normalizeBoolean(
      validationMetadata.blenderPipelineCompatibilityValidated,
      "validationMetadata.blenderPipelineCompatibilityValidated"
    ),
    sceneContractValidated: normalizeBoolean(
      validationMetadata.sceneContractValidated,
      "validationMetadata.sceneContractValidated"
    ),
    exportReadinessValidated: normalizeBoolean(
      validationMetadata.exportReadinessValidated,
      "validationMetadata.exportReadinessValidated"
    ),
    manifestReadinessValidated: normalizeBoolean(
      validationMetadata.manifestReadinessValidated,
      "validationMetadata.manifestReadinessValidated"
    ),
    performanceMetadataValidated: normalizeBoolean(
      validationMetadata.performanceMetadataValidated,
      "validationMetadata.performanceMetadataValidated"
    ),
    performanceMetadata: deepFreeze({
      storageTargetKb: normalizePositiveNumber(
        performanceMetadata.storageTargetKb,
        "validationMetadata.performanceMetadata.storageTargetKb"
      ),
      ramTargetKb: normalizePositiveNumber(
        performanceMetadata.ramTargetKb,
        "validationMetadata.performanceMetadata.ramTargetKb"
      ),
      gpuVertexBudget: normalizePositiveNumber(
        performanceMetadata.gpuVertexBudget,
        "validationMetadata.performanceMetadata.gpuVertexBudget"
      ),
      textureStrategy: normalizeStringValue(
        performanceMetadata.textureStrategy,
        "validationMetadata.performanceMetadata.textureStrategy"
      )
    })
  });
}

function createComponentDefinition(componentId, componentRole, lodBias) {
  return deepFreeze({ componentId, componentRole, lodBias });
}

function createMaterialDefinition(materialId, materialRole) {
  return deepFreeze({ materialId, materialRole });
}

function createLodDefinition(lodKey, geometryProfile, output) {
  return deepFreeze({ lodKey, geometryProfile, output });
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

function normalizeUppercaseToken(value, fieldName) {
  return normalizeStringValue(value, fieldName).toUpperCase();
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of strings.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
  );
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
}

function normalizePositiveNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw createValidationError(
      "invalid_field_value",
      `Field ${fieldName} must be a positive finite number.`
    );
  }

  return value;
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
    prototypeAssetPackage: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "TreeEucalyptusPrototypeAssetPackageValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}
