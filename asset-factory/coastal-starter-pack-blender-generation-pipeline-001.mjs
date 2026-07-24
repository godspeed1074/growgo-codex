import {
  blenderApiBridgeFoundationDefinition
} from "./blender-api-bridge-foundation.mjs";
import {
  coastalStarterPackBlenderBatch001Definition,
  validateCoastalStarterPackBlenderBatch001
} from "./coastal-starter-pack-blender-batch-001-foundation.mjs";
import {
  supportedAssetPackageImportFormats,
  supportedAssetPackageLodKeys
} from "./asset-package-import-contract.mjs";

export const coastalStarterPackBlenderGenerationPipeline001RequiredFields =
  Object.freeze([
    "generationJobId",
    "assetId",
    "sceneTemplate",
    "componentDefinitions",
    "materialDefinitions",
    "lodConfiguration",
    "exportConfiguration",
    "validationConfiguration"
  ]);

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const bridgeLodKeys = Object.freeze(
  Object.keys(blenderApiBridgeFoundationDefinition.lodRequirements)
);

export const coastalStarterPackBlenderGenerationPipeline001Definition =
  deepFreeze({
    generationJobId: "COASTAL_STARTER_GENERATION_JOB_001",
    assetId: "GROUND_COASTAL_GRASS_001",
    sceneTemplate: buildBlenderSceneTemplate("GROUND_COASTAL_GRASS_001"),
    componentDefinitions: buildComponentGenerationHelpers({
      assetId: "GROUND_COASTAL_GRASS_001",
      componentReferences: []
    }),
    materialDefinitions: buildSharedMaterialHelpers({
      assetId: "GROUND_COASTAL_GRASS_001",
      materialPrefix: "COASTAL_GROUND"
    }),
    lodConfiguration: buildLodGenerationHelpers("GROUND_COASTAL_GRASS_001"),
    exportConfiguration: buildGlbExportPreparationHelpers("GROUND_COASTAL_GRASS_001"),
    validationConfiguration: deepFreeze({
      structureValidated: true,
      collectionsValidated: true,
      materialDefinitionsValidated: true,
      lodConfigurationValidated: true,
      exportConfigurationValidated: true,
      mobilePerformanceValidated: true,
      mobilePerformanceMetadata: deepFreeze({
        storageTargetKb: 96,
        ramTargetKb: 128,
        gpuVertexBudget: 160,
        textureStrategy: "shared_atlas_mobile_ready"
      })
    })
  });

export function createCoastalStarterPackBlenderGenerationPipeline001(
  rawContract = coastalStarterPackBlenderGenerationPipeline001Definition,
  options = {}
) {
  return normalizeGenerationContract(rawContract, options);
}

export function validateCoastalStarterPackBlenderGenerationPipeline001(
  rawContract = coastalStarterPackBlenderGenerationPipeline001Definition,
  options = {}
) {
  try {
    const batchResult = validateCoastalStarterPackBlenderBatch001(
      options.batchDefinition ?? coastalStarterPackBlenderBatch001Definition
    );

    if (!batchResult.ok) {
      return freezeFailure(batchResult);
    }

    const contract = normalizeGenerationContract(rawContract, options);
    validateGenerationContractAgainstBatch(
      contract,
      batchResult.batch.definition.blenderJobs
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      generationPipeline: Object.freeze({
        contract,
        compatibility: Object.freeze({
          batchCoverageVerified: true,
          sceneBuilderVerified: true,
          componentHelpersVerified: true,
          materialHelpersVerified: true,
          lodHelpersVerified: true,
          glbExportPreparationVerified: true,
          passiveOnly: true
        })
      })
    });
  } catch (error) {
    if (
      error?.name !== "CoastalStarterPackBlenderGenerationPipeline001ValidationError"
    ) {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      generationPipeline: null
    });
  }
}

export function buildBlenderSceneTemplate(assetId) {
  const normalizedAssetId = normalizePermanentId(assetId, "assetId");
  const collectionNames = Object.freeze([
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "LOD2",
    "LOD3",
    "EXPORT"
  ]);

  return deepFreeze({
    templateId: `${normalizedAssetId}_SCENE_TEMPLATE`,
    rootCollection: normalizedAssetId,
    collectionNames,
    collectionDefinitions: deepFreeze(
      collectionNames.map((collectionName) =>
        deepFreeze({
          collectionName,
          assetScopedName: `${normalizedAssetId}_${collectionName}`
        })
      )
    )
  });
}

export function buildComponentGenerationHelpers({
  assetId,
  componentReferences = []
}) {
  const normalizedAssetId = normalizePermanentId(assetId, "assetId");
  const normalizedComponentReferences = normalizePermanentIdArray(
    componentReferences,
    "componentReferences"
  );

  return deepFreeze({
    assetId: normalizedAssetId,
    componentDefinitions: deepFreeze(
      normalizedComponentReferences.map((componentId) =>
        deepFreeze({
          componentId,
          generationHookId: `${normalizedAssetId}_${componentId}_GENERATION`,
          builderProfile: "shared-component-helper"
        })
      )
    ),
    componentlessAssetAllowed: normalizedComponentReferences.length === 0
  });
}

export function buildSharedMaterialHelpers({ assetId, materialPrefix }) {
  const normalizedAssetId = normalizePermanentId(assetId, "assetId");
  const normalizedMaterialPrefix = normalizeUppercaseToken(
    materialPrefix,
    "materialPrefix"
  );

  return deepFreeze({
    assetId: normalizedAssetId,
    sharedMaterialProfile: "coastal-shared-materials",
    materialDefinitions: deepFreeze([
      deepFreeze({
        materialId: `${normalizedMaterialPrefix}_BASE_SHARED_001`,
        atlasStrategy: "shared_atlas_mobile_ready",
        batchingFriendly: true
      }),
      deepFreeze({
        materialId: `${normalizedMaterialPrefix}_DETAIL_SHARED_001`,
        atlasStrategy: "shared_atlas_mobile_ready",
        batchingFriendly: true
      })
    ])
  });
}

export function buildLodGenerationHelpers(assetId) {
  const normalizedAssetId = normalizePermanentId(assetId, "assetId");
  const bridgeTemplate = blenderApiBridgeFoundationDefinition.lodRequirements;

  return deepFreeze({
    assetId: normalizedAssetId,
    lodDefinitions: deepFreeze(
      supportedAssetPackageLodKeys.map((lodKey) => {
        const bridgeTemplateEntry = bridgeTemplate[lodKey];
        return deepFreeze({
          lodKey,
          geometryProfile: bridgeTemplateEntry.geometryProfile,
          targetPurpose: bridgeTemplateEntry.targetPurpose,
          outputCollection: `${normalizedAssetId}_${lodKey.toUpperCase()}`
        });
      })
    )
  });
}

export function buildGlbExportPreparationHelpers(assetId) {
  const normalizedAssetId = normalizePermanentId(assetId, "assetId");
  return deepFreeze({
    assetId: normalizedAssetId,
    format: "glb",
    exportRoot: `${normalizedAssetId}_EXPORT`,
    lodExports: deepFreeze({
      close: `${normalizedAssetId}_LOD_CLOSE.glb`,
      gameplay: `${normalizedAssetId}_LOD_GAMEPLAY.glb`,
      map: `${normalizedAssetId}_LOD_MAP.glb`,
      distantSilhouette: `${normalizedAssetId}_LOD_DISTANT_SILHOUETTE.glb`
    }),
    manifestReference: normalizedAssetId
  });
}

function normalizeGenerationContract(rawContract) {
  const contract = asPlainObject(rawContract, "Blender generation contract");
  assertRequiredFields(contract);

  return deepFreeze({
    generationJobId: normalizePermanentId(contract.generationJobId, "generationJobId"),
    assetId: normalizePermanentId(contract.assetId, "assetId"),
    sceneTemplate: normalizeSceneTemplate(contract.sceneTemplate),
    componentDefinitions: normalizeComponentDefinitions(contract.componentDefinitions),
    materialDefinitions: normalizeMaterialDefinitions(contract.materialDefinitions),
    lodConfiguration: normalizeLodConfiguration(contract.lodConfiguration),
    exportConfiguration: normalizeExportConfiguration(contract.exportConfiguration),
    validationConfiguration: normalizeValidationConfiguration(
      contract.validationConfiguration
    )
  });
}

function validateGenerationContractAgainstBatch(contract, blenderJobs) {
  const matchingJob =
    blenderJobs.find((job) => job.assetId === contract.assetId) ?? null;

  if (!matchingJob) {
    throw createValidationError(
      "missing_batch_job",
      `Generation pipeline asset ${contract.assetId} is not present in Blender Batch 001.`
    );
  }

  if (
    contract.sceneTemplate.collectionNames.length !==
      matchingJob.sceneRequirements.requiredCollections.length ||
    contract.sceneTemplate.collectionNames.some(
      (collectionName, index) =>
        collectionName !== matchingJob.sceneRequirements.requiredCollections[index]
    )
  ) {
    throw createValidationError(
      "scene_contract_mismatch",
      "Generation pipeline scene template must match the approved Blender Batch 001 collection contract."
    );
  }

  if (!supportedAssetPackageImportFormats.includes(contract.exportConfiguration.format)) {
    throw createValidationError(
      "unsupported_export_format",
      `Generation pipeline export format ${contract.exportConfiguration.format} is not approved.`
    );
  }

  const contractLodKeys = contract.lodConfiguration.lodDefinitions.map(
    (entry) => entry.lodKey
  );
  if (
    contractLodKeys.length !== supportedAssetPackageLodKeys.length ||
    contractLodKeys.some(
      (lodKey, index) => lodKey !== supportedAssetPackageLodKeys[index]
    )
  ) {
    throw createValidationError(
      "lod_configuration_mismatch",
      "Generation pipeline LOD configuration must match the approved asset-package import LOD keys."
    );
  }

  if (
    contract.validationConfiguration.mobilePerformanceMetadata.storageTargetKb <= 0 ||
    contract.validationConfiguration.mobilePerformanceMetadata.ramTargetKb <= 0 ||
    contract.validationConfiguration.mobilePerformanceMetadata.gpuVertexBudget <= 0
  ) {
    throw createValidationError(
      "invalid_mobile_performance_metadata",
      "Generation pipeline mobile performance metadata must remain positive."
    );
  }
}

function assertRequiredFields(contract) {
  for (const fieldName of coastalStarterPackBlenderGenerationPipeline001RequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(contract, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Blender generation contract is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeSceneTemplate(rawSceneTemplate) {
  const sceneTemplate = asPlainObject(rawSceneTemplate, "sceneTemplate");
  const collectionNames = normalizeStringArray(
    sceneTemplate.collectionNames,
    "sceneTemplate.collectionNames"
  );
  const collectionDefinitions = normalizeCollectionDefinitions(
    sceneTemplate.collectionDefinitions
  );

  return deepFreeze({
    templateId: normalizeUppercaseToken(
      sceneTemplate.templateId,
      "sceneTemplate.templateId"
    ),
    rootCollection: normalizePermanentId(
      sceneTemplate.rootCollection,
      "sceneTemplate.rootCollection"
    ),
    collectionNames: deepFreeze(collectionNames),
    collectionDefinitions
  });
}

function normalizeCollectionDefinitions(rawCollectionDefinitions) {
  if (!Array.isArray(rawCollectionDefinitions)) {
    throw createValidationError(
      "invalid_field_type",
      "sceneTemplate.collectionDefinitions must be an array."
    );
  }

  return deepFreeze(
    rawCollectionDefinitions.map((entry, index) => {
      const definition = asPlainObject(
        entry,
        `sceneTemplate.collectionDefinitions[${index}]`
      );
      return deepFreeze({
        collectionName: normalizeUppercaseToken(
          definition.collectionName,
          `sceneTemplate.collectionDefinitions[${index}].collectionName`
        ),
        assetScopedName: normalizeUppercaseToken(
          definition.assetScopedName,
          `sceneTemplate.collectionDefinitions[${index}].assetScopedName`
        )
      });
    })
  );
}

function normalizeComponentDefinitions(rawComponentDefinitions) {
  const componentDefinitions = asPlainObject(
    rawComponentDefinitions,
    "componentDefinitions"
  );

  return deepFreeze({
    assetId: normalizePermanentId(componentDefinitions.assetId, "componentDefinitions.assetId"),
    componentDefinitions: deepFreeze(
      normalizeComponentDefinitionEntries(componentDefinitions.componentDefinitions)
    ),
    componentlessAssetAllowed: normalizeBoolean(
      componentDefinitions.componentlessAssetAllowed,
      "componentDefinitions.componentlessAssetAllowed"
    )
  });
}

function normalizeComponentDefinitionEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    throw createValidationError(
      "invalid_field_type",
      "componentDefinitions.componentDefinitions must be an array."
    );
  }

  return rawEntries.map((entry, index) => {
    const componentDefinition = asPlainObject(
      entry,
      `componentDefinitions.componentDefinitions[${index}]`
    );
    return deepFreeze({
      componentId: normalizePermanentId(
        componentDefinition.componentId,
        `componentDefinitions.componentDefinitions[${index}].componentId`
      ),
      generationHookId: normalizeUppercaseToken(
        componentDefinition.generationHookId,
        `componentDefinitions.componentDefinitions[${index}].generationHookId`
      ),
      builderProfile: normalizeStringValue(
        componentDefinition.builderProfile,
        `componentDefinitions.componentDefinitions[${index}].builderProfile`
      )
    });
  });
}

function normalizeMaterialDefinitions(rawMaterialDefinitions) {
  const materialDefinitions = asPlainObject(
    rawMaterialDefinitions,
    "materialDefinitions"
  );

  return deepFreeze({
    assetId: normalizePermanentId(materialDefinitions.assetId, "materialDefinitions.assetId"),
    sharedMaterialProfile: normalizeStringValue(
      materialDefinitions.sharedMaterialProfile,
      "materialDefinitions.sharedMaterialProfile"
    ),
    materialDefinitions: deepFreeze(
      normalizeMaterialDefinitionEntries(materialDefinitions.materialDefinitions)
    )
  });
}

function normalizeMaterialDefinitionEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    throw createValidationError(
      "invalid_field_type",
      "materialDefinitions.materialDefinitions must be an array."
    );
  }

  return rawEntries.map((entry, index) => {
    const materialDefinition = asPlainObject(
      entry,
      `materialDefinitions.materialDefinitions[${index}]`
    );
    return deepFreeze({
      materialId: normalizePermanentId(
        materialDefinition.materialId,
        `materialDefinitions.materialDefinitions[${index}].materialId`
      ),
      atlasStrategy: normalizeStringValue(
        materialDefinition.atlasStrategy,
        `materialDefinitions.materialDefinitions[${index}].atlasStrategy`
      ),
      batchingFriendly: normalizeBoolean(
        materialDefinition.batchingFriendly,
        `materialDefinitions.materialDefinitions[${index}].batchingFriendly`
      )
    });
  });
}

function normalizeLodConfiguration(rawLodConfiguration) {
  const lodConfiguration = asPlainObject(rawLodConfiguration, "lodConfiguration");

  if (!Array.isArray(lodConfiguration.lodDefinitions)) {
    throw createValidationError(
      "invalid_field_type",
      "lodConfiguration.lodDefinitions must be an array."
    );
  }

  return deepFreeze({
    assetId: normalizePermanentId(lodConfiguration.assetId, "lodConfiguration.assetId"),
    lodDefinitions: deepFreeze(
      lodConfiguration.lodDefinitions.map((entry, index) => {
        const lodDefinition = asPlainObject(
          entry,
          `lodConfiguration.lodDefinitions[${index}]`
        );
        return deepFreeze({
          lodKey: normalizeLodKey(lodDefinition.lodKey, `lodConfiguration.lodDefinitions[${index}].lodKey`),
          geometryProfile: normalizeStringValue(
            lodDefinition.geometryProfile,
            `lodConfiguration.lodDefinitions[${index}].geometryProfile`
          ),
          targetPurpose: normalizeStringValue(
            lodDefinition.targetPurpose,
            `lodConfiguration.lodDefinitions[${index}].targetPurpose`
          ),
          outputCollection: normalizeUppercaseToken(
            lodDefinition.outputCollection,
            `lodConfiguration.lodDefinitions[${index}].outputCollection`
          )
        });
      })
    )
  });
}

function normalizeExportConfiguration(rawExportConfiguration) {
  const exportConfiguration = asPlainObject(
    rawExportConfiguration,
    "exportConfiguration"
  );
  const lodExports = asPlainObject(
    exportConfiguration.lodExports,
    "exportConfiguration.lodExports"
  );

  const normalizedLodExports = {};
  for (const lodKey of supportedAssetPackageLodKeys) {
    normalizedLodExports[lodKey] = normalizeStringValue(
      lodExports[lodKey],
      `exportConfiguration.lodExports.${lodKey}`
    );
  }

  return deepFreeze({
    assetId: normalizePermanentId(exportConfiguration.assetId, "exportConfiguration.assetId"),
    format: normalizeStringValue(exportConfiguration.format, "exportConfiguration.format").toLowerCase(),
    exportRoot: normalizeUppercaseToken(
      exportConfiguration.exportRoot,
      "exportConfiguration.exportRoot"
    ),
    lodExports: deepFreeze(normalizedLodExports),
    manifestReference: normalizePermanentId(
      exportConfiguration.manifestReference,
      "exportConfiguration.manifestReference"
    )
  });
}

function normalizeValidationConfiguration(rawValidationConfiguration) {
  const validationConfiguration = asPlainObject(
    rawValidationConfiguration,
    "validationConfiguration"
  );
  const mobilePerformanceMetadata = asPlainObject(
    validationConfiguration.mobilePerformanceMetadata,
    "validationConfiguration.mobilePerformanceMetadata"
  );

  return deepFreeze({
    structureValidated: normalizeBoolean(
      validationConfiguration.structureValidated,
      "validationConfiguration.structureValidated"
    ),
    collectionsValidated: normalizeBoolean(
      validationConfiguration.collectionsValidated,
      "validationConfiguration.collectionsValidated"
    ),
    materialDefinitionsValidated: normalizeBoolean(
      validationConfiguration.materialDefinitionsValidated,
      "validationConfiguration.materialDefinitionsValidated"
    ),
    lodConfigurationValidated: normalizeBoolean(
      validationConfiguration.lodConfigurationValidated,
      "validationConfiguration.lodConfigurationValidated"
    ),
    exportConfigurationValidated: normalizeBoolean(
      validationConfiguration.exportConfigurationValidated,
      "validationConfiguration.exportConfigurationValidated"
    ),
    mobilePerformanceValidated: normalizeBoolean(
      validationConfiguration.mobilePerformanceValidated,
      "validationConfiguration.mobilePerformanceValidated"
    ),
    mobilePerformanceMetadata: deepFreeze({
      storageTargetKb: normalizePositiveNumber(
        mobilePerformanceMetadata.storageTargetKb,
        "validationConfiguration.mobilePerformanceMetadata.storageTargetKb"
      ),
      ramTargetKb: normalizePositiveNumber(
        mobilePerformanceMetadata.ramTargetKb,
        "validationConfiguration.mobilePerformanceMetadata.ramTargetKb"
      ),
      gpuVertexBudget: normalizePositiveNumber(
        mobilePerformanceMetadata.gpuVertexBudget,
        "validationConfiguration.mobilePerformanceMetadata.gpuVertexBudget"
      ),
      textureStrategy: normalizeStringValue(
        mobilePerformanceMetadata.textureStrategy,
        "validationConfiguration.mobilePerformanceMetadata.textureStrategy"
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

function normalizeUppercaseToken(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
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

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
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

function normalizeLodKey(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!supportedAssetPackageLodKeys.includes(normalized)) {
    throw createValidationError(
      "invalid_lod_key",
      `Field ${fieldName} must be one of the approved supported asset package LOD keys.`
    );
  }

  return normalized;
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
    generationPipeline: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "CoastalStarterPackBlenderGenerationPipeline001ValidationError";
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
