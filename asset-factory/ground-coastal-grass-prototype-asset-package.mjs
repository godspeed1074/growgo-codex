import {
  coastalStarterPackBlenderBatch001Definition,
  validateCoastalStarterPackBlenderBatch001
} from "./coastal-starter-pack-blender-batch-001-foundation.mjs";
import {
  coastalStarterPackBlenderGenerationPipeline001Definition,
  validateCoastalStarterPackBlenderGenerationPipeline001
} from "./coastal-starter-pack-blender-generation-pipeline-001.mjs";

export const groundCoastalGrassPrototypeAssetPackageRequiredFields =
  Object.freeze([
    "assetId",
    "assetSourceDefinition",
    "geometryRequirements",
    "materialRequirements",
    "lodRequirements",
    "exportMetadata",
    "assetManifest",
    "validationMetadata"
  ]);

export const groundCoastalGrassPrototypeAssetPackageDefinition = deepFreeze({
  assetId: "GROUND_COASTAL_GRASS_001",
  assetSourceDefinition: deepFreeze({
    sourceType: "generated-prototype",
    generationJobId: "COASTAL_STARTER_GENERATION_JOB_001",
    batchJobId: "COASTAL_STARTER_BLENDER_JOB_001",
    assetFamilyId: "COASTAL_GROUND_FAMILY_001",
    recipeReference: "GROUND_COASTAL_GRASS_RECIPE_001",
    realBlenderExecutionOccurred: false
  }),
  geometryRequirements: deepFreeze({
    collectionContract: deepFreeze([
      "GEOMETRY",
      "MATERIALS",
      "LOD0",
      "LOD1",
      "LOD2",
      "LOD3",
      "EXPORT"
    ]),
    geometryProfile: "lod0",
    generationMode: "procedural-ground-cover",
    mobileGeometryBudget: deepFreeze({
      gpuVertexBudget: 160,
      batchingExpected: true
    })
  }),
  materialRequirements: deepFreeze({
    sharedMaterialProfile: "coastal-shared-materials",
    materialDefinitions: deepFreeze([
      {
        materialId: "COASTAL_GROUND_BASE_SHARED_001",
        atlasStrategy: "shared_atlas_mobile_ready"
      },
      {
        materialId: "COASTAL_GROUND_DETAIL_SHARED_001",
        atlasStrategy: "shared_atlas_mobile_ready"
      }
    ]),
    textureStrategy: "shared_atlas_mobile_ready"
  }),
  lodRequirements: deepFreeze({
    close: {
      lodKey: "close",
      geometryProfile: "lod0",
      output: "GROUND_COASTAL_GRASS_001_LOD_CLOSE.glb"
    },
    gameplay: {
      lodKey: "gameplay",
      geometryProfile: "lod1",
      output: "GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb"
    },
    map: {
      lodKey: "map",
      geometryProfile: "lod2",
      output: "GROUND_COASTAL_GRASS_001_LOD_MAP.glb"
    },
    distantSilhouette: {
      lodKey: "distantSilhouette",
      geometryProfile: "lod3",
      output: "GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb"
    }
  }),
  exportMetadata: deepFreeze({
    format: "glb",
    exportRoot: "GROUND_COASTAL_GRASS_001_EXPORT",
    assetPackageLocation:
      "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export",
    realBlenderExecutionOccurred: false,
    blendArtifactProduced: false,
    glbArtifactProduced: false
  }),
  assetManifest: deepFreeze({
    assetId: "GROUND_COASTAL_GRASS_001",
    recipeReference: "GROUND_COASTAL_GRASS_RECIPE_001",
    manifestVersion: "1.0.0",
    manifestReady: true
  }),
  validationMetadata: deepFreeze({
    assetIdValidated: true,
    recipeReferenceValidated: true,
    sceneContractValidated: true,
    performanceMetadataValidated: true,
    exportReadinessValidated: true,
    performanceMetadata: deepFreeze({
      storageTargetKb: 96,
      ramTargetKb: 128,
      gpuVertexBudget: 160,
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

export function createGroundCoastalGrassPrototypeAssetPackage(
  rawPackage = groundCoastalGrassPrototypeAssetPackageDefinition
) {
  return normalizePrototypeAssetPackage(rawPackage);
}

export function validateGroundCoastalGrassPrototypeAssetPackage(
  rawPackage = groundCoastalGrassPrototypeAssetPackageDefinition,
  options = {}
) {
  try {
    const batchResult = validateCoastalStarterPackBlenderBatch001(
      options.batchDefinition ?? coastalStarterPackBlenderBatch001Definition
    );
    if (!batchResult.ok) {
      return freezeFailure(batchResult);
    }

    const pipelineResult = validateCoastalStarterPackBlenderGenerationPipeline001(
      options.pipelineDefinition ?? coastalStarterPackBlenderGenerationPipeline001Definition
    );
    if (!pipelineResult.ok) {
      return freezeFailure(pipelineResult);
    }

    const prototypeAssetPackage = normalizePrototypeAssetPackage(rawPackage);
    validatePackageCompatibility(
      prototypeAssetPackage,
      batchResult.batch.definition,
      pipelineResult.generationPipeline.contract
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      prototypeAssetPackage: Object.freeze({
        package: prototypeAssetPackage,
        compatibility: Object.freeze({
          assetIdVerified: true,
          recipeReferenceVerified: true,
          sceneContractVerified: true,
          performanceMetadataVerified: true,
          exportReadinessVerified: true,
          passiveOnly: true,
          realBlenderExecutionOccurred: false,
          blendArtifactProduced: false,
          glbArtifactProduced: false
        })
      })
    });
  } catch (error) {
    if (
      error?.name !== "GroundCoastalGrassPrototypeAssetPackageValidationError"
    ) {
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
    "ground coastal grass prototype asset package"
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

function validatePackageCompatibility(prototypeAssetPackage, batch, pipelineContract) {
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

  if (
    prototypeAssetPackage.geometryRequirements.collectionContract.length !==
      pipelineContract.sceneTemplate.collectionNames.length ||
    prototypeAssetPackage.geometryRequirements.collectionContract.some(
      (collectionName, index) =>
        collectionName !== pipelineContract.sceneTemplate.collectionNames[index]
    )
  ) {
    throw createValidationError(
      "scene_contract_mismatch",
      "Prototype asset package scene contract must match the Blender generation pipeline scene template."
    );
  }

  if (
    prototypeAssetPackage.validationMetadata.performanceMetadata.gpuVertexBudget !==
    pipelineContract.validationConfiguration.mobilePerformanceMetadata.gpuVertexBudget
  ) {
    throw createValidationError(
      "performance_metadata_mismatch",
      "Prototype asset package performance metadata must match the pipeline mobile performance metadata."
    );
  }

  if (prototypeAssetPackage.exportMetadata.format !== pipelineContract.exportConfiguration.format) {
    throw createValidationError(
      "export_format_mismatch",
      "Prototype asset package export metadata must preserve the pipeline GLB export format."
    );
  }

  if (
    prototypeAssetPackage.exportMetadata.realBlenderExecutionOccurred === true ||
    prototypeAssetPackage.exportMetadata.blendArtifactProduced === true ||
    prototypeAssetPackage.exportMetadata.glbArtifactProduced === true
  ) {
    throw createValidationError(
      "unexpected_real_artifact_state",
      "Prototype asset package must remain passive and must not claim real Blender execution or produced artifacts."
    );
  }
}

function assertRequiredFields(prototypeAssetPackage) {
  for (const fieldName of groundCoastalGrassPrototypeAssetPackageRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(prototypeAssetPackage, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Ground coastal grass prototype asset package is missing required field ${fieldName}.`
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
    generationMode: normalizeStringValue(
      geometryRequirements.generationMode,
      "geometryRequirements.generationMode"
    ),
    mobileGeometryBudget: normalizeMobileGeometryBudget(
      geometryRequirements.mobileGeometryBudget
    )
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
      normalizeMaterialDefinitionEntries(materialRequirements.materialDefinitions)
    ),
    textureStrategy: normalizeStringValue(
      materialRequirements.textureStrategy,
      "materialRequirements.textureStrategy"
    )
  });
}

function normalizeMaterialDefinitionEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    throw createValidationError(
      "invalid_field_type",
      "materialRequirements.materialDefinitions must be an array."
    );
  }

  return rawEntries.map((entry, index) => {
    const materialDefinition = asPlainObject(
      entry,
      `materialRequirements.materialDefinitions[${index}]`
    );

    return deepFreeze({
      materialId: normalizePermanentId(
        materialDefinition.materialId,
        `materialRequirements.materialDefinitions[${index}].materialId`
      ),
      atlasStrategy: normalizeStringValue(
        materialDefinition.atlasStrategy,
        `materialRequirements.materialDefinitions[${index}].atlasStrategy`
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
    format: normalizeStringValue(exportMetadata.format, "exportMetadata.format").toLowerCase(),
    exportRoot: normalizeUppercaseToken(
      exportMetadata.exportRoot,
      "exportMetadata.exportRoot"
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
    assetIdValidated: normalizeBoolean(
      validationMetadata.assetIdValidated,
      "validationMetadata.assetIdValidated"
    ),
    recipeReferenceValidated: normalizeBoolean(
      validationMetadata.recipeReferenceValidated,
      "validationMetadata.recipeReferenceValidated"
    ),
    sceneContractValidated: normalizeBoolean(
      validationMetadata.sceneContractValidated,
      "validationMetadata.sceneContractValidated"
    ),
    performanceMetadataValidated: normalizeBoolean(
      validationMetadata.performanceMetadataValidated,
      "validationMetadata.performanceMetadataValidated"
    ),
    exportReadinessValidated: normalizeBoolean(
      validationMetadata.exportReadinessValidated,
      "validationMetadata.exportReadinessValidated"
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
    normalizeUppercaseToken(entry, `${fieldName}[${index}]`)
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
  error.name = "GroundCoastalGrassPrototypeAssetPackageValidationError";
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
