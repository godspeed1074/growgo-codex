import {
  buildCoastalStarterPackProductionQueueContext,
  coastalStarterPackProductionQueueDefinition,
  coastalStarterPackRequiredBlenderCollections,
  validateCoastalStarterPackProductionQueue
} from "./coastal-starter-pack-production-queue-foundation.mjs";
import {
  blenderApiBridgeFoundationDefinition,
  validateBlenderApiBridgeFoundation
} from "./blender-api-bridge-foundation.mjs";
import {
  assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
  validateAssetGenerationWorkspaceAppearanceProfileFoundation
} from "./asset-generation-workspace-appearance-profile-foundation.mjs";

export const coastalStarterPackBlenderBatch001RequiredFields = Object.freeze([
  "batchId",
  "version",
  "status",
  "blenderJobs",
  "metadata"
]);

export const coastalStarterPackBlenderJobRequiredFields = Object.freeze([
  "blenderJobId",
  "assetId",
  "assetFamilyId",
  "recipeReference",
  "componentReferences",
  "sceneRequirements",
  "materialRequirements",
  "lodRequirements",
  "exportRequirements",
  "validationRequirements"
]);

export const coastalStarterPackBlenderBatch001Assets = Object.freeze([
  "GROUND_COASTAL_GRASS_001",
  "TREE_EUCALYPTUS_001",
  "ROAD_COASTAL_001",
  "BUILDING_COASTAL_COTTAGE_001",
  "LIGHTHOUSE_ISLAND_ROCKY_001"
]);

export const coastalStarterPackBlenderBatch001Definition = deepFreeze({
  batchId: "COASTAL_STARTER_PACK_BLENDER_BATCH_001",
  version: "1.0.0",
  status: "validated",
  blenderJobs: deepFreeze([
    createBlenderJobDefinition({
      blenderJobId: "COASTAL_STARTER_BLENDER_JOB_001",
      assetId: "GROUND_COASTAL_GRASS_001",
      assetFamilyId: "COASTAL_GROUND_FAMILY_001",
      recipeReference: "GROUND_COASTAL_GRASS_RECIPE_001",
      componentReferences: [],
      materialPrefix: "COASTAL_GROUND",
      generationHookPrefix: "ground-coastal-grass",
      mobilePerformanceMetadata: {
        storageTargetKb: 96,
        ramTargetKb: 128,
        gpuVertexBudget: 160,
        textureStrategy: "shared_atlas_mobile_ready"
      }
    }),
    createBlenderJobDefinition({
      blenderJobId: "COASTAL_STARTER_BLENDER_JOB_002",
      assetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: "COASTAL_NATURE_FAMILY_001",
      recipeReference: "TREE_EUCALYPTUS_RECIPE_001",
      componentReferences: [
        "TREE_EUCALYPTUS_TRUNK_001",
        "TREE_EUCALYPTUS_CANOPY_001"
      ],
      materialPrefix: "COASTAL_TREE",
      generationHookPrefix: "tree-eucalyptus",
      mobilePerformanceMetadata: {
        storageTargetKb: 128,
        ramTargetKb: 192,
        gpuVertexBudget: 240,
        textureStrategy: "shared_atlas_mobile_ready"
      }
    }),
    createBlenderJobDefinition({
      blenderJobId: "COASTAL_STARTER_BLENDER_JOB_003",
      assetId: "ROAD_COASTAL_001",
      assetFamilyId: "COASTAL_INFRASTRUCTURE_FAMILY_001",
      recipeReference: "ROAD_COASTAL_RECIPE_001",
      componentReferences: [],
      materialPrefix: "COASTAL_ROAD",
      generationHookPrefix: "road-coastal",
      mobilePerformanceMetadata: {
        storageTargetKb: 112,
        ramTargetKb: 160,
        gpuVertexBudget: 180,
        textureStrategy: "shared_atlas_mobile_ready"
      }
    }),
    createBlenderJobDefinition({
      blenderJobId: "COASTAL_STARTER_BLENDER_JOB_004",
      assetId: "BUILDING_COASTAL_COTTAGE_001",
      assetFamilyId: "COASTAL_RESIDENTIAL_FAMILY_001",
      recipeReference: "BUILDING_COASTAL_COTTAGE_RECIPE_001",
      componentReferences: [],
      materialPrefix: "COASTAL_COTTAGE",
      generationHookPrefix: "building-coastal-cottage",
      mobilePerformanceMetadata: {
        storageTargetKb: 192,
        ramTargetKb: 256,
        gpuVertexBudget: 320,
        textureStrategy: "shared_atlas_mobile_ready"
      }
    }),
    createBlenderJobDefinition({
      blenderJobId: "COASTAL_STARTER_BLENDER_JOB_005",
      assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
      assetFamilyId: "COASTAL_LIGHTHOUSE_FAMILY_001",
      recipeReference: "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001",
      componentReferences: [
        "LIGHTHOUSE_TOWER_BASE_001",
        "LIGHTHOUSE_TOWER_BODY_TALL_001",
        "LIGHTHOUSE_LANTERN_BASE_001",
        "LIGHTHOUSE_GLASS_RING_001",
        "LIGHTHOUSE_ROOF_CAP_001",
        "LIGHTHOUSE_BEAM_EFFECT_001"
      ],
      materialPrefix: "LIGHTHOUSE",
      generationHookPrefix: "lighthouse-island-rocky",
      mobilePerformanceMetadata: {
        storageTargetKb: 256,
        ramTargetKb: 384,
        gpuVertexBudget: 480,
        textureStrategy: "shared_atlas_mobile_ready"
      }
    })
  ]),
  metadata: deepFreeze({
    creatorSource: "internal",
    validationState: "validated",
    batchRole: "coastal_starter_pack_blender_generation_batch",
    queueReference: "COASTAL_STARTER_PACK_PRODUCTION_QUEUE_001",
    planningOnly: true,
    atlasSystemsModified: false
  })
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;
const supportedLodKeys = Object.freeze(["close", "gameplay", "map", "distantSilhouette"]);

export function buildCoastalStarterPackBlenderBatch001Context() {
  return Object.freeze(buildCoastalStarterPackProductionQueueContext());
}

export function createCoastalStarterPackBlenderBatch001(
  rawBatch = coastalStarterPackBlenderBatch001Definition,
  options = {}
) {
  return normalizeBatch(rawBatch, normalizeOptions(options));
}

export function validateCoastalStarterPackBlenderBatch001(
  rawBatch = coastalStarterPackBlenderBatch001Definition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const queueResult = normalizedOptions.validateCoastalStarterPackProductionQueue(
      normalizedOptions.queueDefinition,
      { validationContext: normalizedOptions.validationContext }
    );

    if (!queueResult.ok) {
      return freezeFailure(queueResult);
    }

    const bridgeResult = normalizedOptions.validateBlenderApiBridgeFoundation(
      normalizedOptions.bridgeDefinition
    );
    if (!bridgeResult.ok) {
      return freezeFailure(bridgeResult);
    }

    const workspaceResult =
      normalizedOptions.validateAssetGenerationWorkspaceAppearanceProfileFoundation(
        normalizedOptions.workspaceDefinition
      );
    if (!workspaceResult.ok) {
      return freezeFailure(workspaceResult);
    }

    const batch = normalizeBatch(rawBatch, normalizedOptions);
    validateBatchCompatibility(
      batch,
      queueResult.queue.definition,
      bridgeResult.bridge.request,
      workspaceResult.workspaceProfile.foundation,
      normalizedOptions.validationContext
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      batch: Object.freeze({
        definition: batch,
        queue: queueResult.queue.definition,
        compatibility: Object.freeze({
          queueCoverageVerified: true,
          sceneContractVerified: true,
          mobilePerformanceMetadataVerified: true,
          glbExportRequirementsVerified: true,
          passiveOnly: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "CoastalStarterPackBlenderBatch001ValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      batch: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    validationContext:
      options.validationContext ??
      buildCoastalStarterPackBlenderBatch001Context(),
    queueDefinition:
      options.queueDefinition ?? coastalStarterPackProductionQueueDefinition,
    bridgeDefinition:
      options.bridgeDefinition ?? blenderApiBridgeFoundationDefinition,
    workspaceDefinition:
      options.workspaceDefinition ??
      assetGenerationWorkspaceAppearanceProfileFoundationDefinition,
    validateCoastalStarterPackProductionQueue:
      typeof options.validateCoastalStarterPackProductionQueue === "function"
        ? options.validateCoastalStarterPackProductionQueue
        : validateCoastalStarterPackProductionQueue,
    validateBlenderApiBridgeFoundation:
      typeof options.validateBlenderApiBridgeFoundation === "function"
        ? options.validateBlenderApiBridgeFoundation
        : validateBlenderApiBridgeFoundation,
    validateAssetGenerationWorkspaceAppearanceProfileFoundation:
      typeof options.validateAssetGenerationWorkspaceAppearanceProfileFoundation ===
      "function"
        ? options.validateAssetGenerationWorkspaceAppearanceProfileFoundation
        : validateAssetGenerationWorkspaceAppearanceProfileFoundation
  });
}

function normalizeBatch(rawBatch, options) {
  const batch = asPlainObject(rawBatch, "coastal starter pack blender batch");
  assertBatchRequiredFields(batch);

  return deepFreeze({
    batchId: normalizePermanentId(batch.batchId, "batchId"),
    version: normalizeVersion(batch.version, "version"),
    status: normalizeStatus(batch.status, "status"),
    blenderJobs: deepFreeze(
      normalizeBlenderJobs(batch.blenderJobs, options.validationContext)
    ),
    metadata: deepFreeze(asPlainObject(batch.metadata, "metadata"))
  });
}

function normalizeBlenderJobs(rawJobs, validationContext) {
  if (!Array.isArray(rawJobs)) {
    throw createValidationError(
      "invalid_field_type",
      "Blender batch jobs must be an array."
    );
  }

  const seenJobIds = new Set();
  const seenAssetIds = new Set();

  return rawJobs.map((rawJob, index) => {
    const job = normalizeBlenderJob(rawJob, index, validationContext);

    if (seenJobIds.has(job.blenderJobId)) {
      throw createValidationError(
        "duplicate_job_id",
        `Blender job ${job.blenderJobId} is duplicated in the batch.`
      );
    }

    if (seenAssetIds.has(job.assetId)) {
      throw createValidationError(
        "duplicate_asset_id",
        `Blender batch asset ${job.assetId} appears more than once.`
      );
    }

    seenJobIds.add(job.blenderJobId);
    seenAssetIds.add(job.assetId);
    return job;
  });
}

function normalizeBlenderJob(rawJob, index, validationContext) {
  const job = asPlainObject(rawJob, `blenderJobs[${index}]`);
  assertJobRequiredFields(job);

  const assetId = normalizePermanentId(job.assetId, `blenderJobs[${index}].assetId`);
  const manifest = validationContext.manifestRegistry.findManifestByAssetId(assetId);
  const recipeReference = normalizePermanentId(
    job.recipeReference,
    `blenderJobs[${index}].recipeReference`
  );

  if (manifest && recipeReference !== manifest.recipeId) {
    throw createValidationError(
      "recipe_reference_mismatch",
      `Blender job ${job.blenderJobId} recipe ${recipeReference} does not match the manifest recipe ${manifest.recipeId} for ${assetId}.`
    );
  }

  return deepFreeze({
    blenderJobId: normalizePermanentId(
      job.blenderJobId,
      `blenderJobs[${index}].blenderJobId`
    ),
    assetId,
    assetFamilyId: normalizePermanentId(
      job.assetFamilyId,
      `blenderJobs[${index}].assetFamilyId`
    ),
    recipeReference,
    componentReferences: deepFreeze(
      normalizePermanentIdArray(
        job.componentReferences,
        `blenderJobs[${index}].componentReferences`
      )
    ),
    sceneRequirements: normalizeSceneRequirements(
      job.sceneRequirements,
      `blenderJobs[${index}].sceneRequirements`
    ),
    materialRequirements: normalizeMaterialRequirements(
      job.materialRequirements,
      `blenderJobs[${index}].materialRequirements`
    ),
    lodRequirements: normalizeLodRequirements(
      job.lodRequirements,
      `blenderJobs[${index}].lodRequirements`
    ),
    exportRequirements: normalizeExportRequirements(
      job.exportRequirements,
      `blenderJobs[${index}].exportRequirements`
    ),
    validationRequirements: normalizeValidationRequirements(
      job.validationRequirements,
      `blenderJobs[${index}].validationRequirements`
    )
  });
}

function validateBatchCompatibility(
  batch,
  queue,
  bridgeRequest,
  workspaceFoundation,
  validationContext
) {
  const queuedAssetIds = new Set(
    queue.productionJobs.map((productionJob) => productionJob.assetId)
  );

  for (const job of batch.blenderJobs) {
    if (!coastalStarterPackBlenderBatch001Assets.includes(job.assetId)) {
      throw createValidationError(
        "unexpected_asset_id",
        `Blender batch asset ${job.assetId} is not part of the approved Batch 001 scope.`
      );
    }

    if (!queuedAssetIds.has(job.assetId)) {
      throw createValidationError(
        "missing_queue_reference",
        `Blender batch asset ${job.assetId} is not present in the coastal production queue.`
      );
    }

    if (
      job.sceneRequirements.requiredCollections.length !==
        coastalStarterPackRequiredBlenderCollections.length ||
      job.sceneRequirements.requiredCollections.some(
        (collectionName, index) =>
          collectionName !== coastalStarterPackRequiredBlenderCollections[index]
      )
    ) {
      throw createValidationError(
        "invalid_scene_contract",
        `Blender job ${job.blenderJobId} must use the approved Blender scene contract collections.`
      );
    }

    if (
      job.exportRequirements.format !== "glb" ||
      job.exportRequirements.lodExports.close.length === 0
    ) {
      throw createValidationError(
        "invalid_export_requirements",
        `Blender job ${job.blenderJobId} must preserve GLB export requirements.`
      );
    }

    if (
      job.validationRequirements.mobilePerformanceMetadata.storageTargetKb <= 0 ||
      job.validationRequirements.mobilePerformanceMetadata.ramTargetKb <= 0 ||
      job.validationRequirements.mobilePerformanceMetadata.gpuVertexBudget <= 0
    ) {
      throw createValidationError(
        "invalid_mobile_performance_metadata",
        `Blender job ${job.blenderJobId} must define positive mobile performance metadata.`
      );
    }

    if (
      !job.validationRequirements.mobilePerformanceValidationRequired ||
      !job.validationRequirements.glbExportValidationRequired
    ) {
      throw createValidationError(
        "validation_requirements_disabled",
        `Blender job ${job.blenderJobId} must keep mobile and GLB validation requirements enabled.`
      );
    }

    validateAssetCoverage(job, bridgeRequest, workspaceFoundation, validationContext);
  }
}

function validateAssetCoverage(job, bridgeRequest, workspaceFoundation, validationContext) {
  const asset = validationContext.assetRegistry.findAssetById(job.assetId);
  if (!asset) {
    throw createValidationError(
      "missing_asset_reference",
      `Blender job ${job.blenderJobId} references missing asset ${job.assetId}.`
    );
  }

  const manifest = validationContext.manifestRegistry.findManifestByAssetId(job.assetId);
  if (!manifest) {
    throw createValidationError(
      "missing_manifest_reference",
      `Blender job ${job.blenderJobId} is missing a manifest for ${job.assetId}.`
    );
  }

  if (
    job.assetId === "LIGHTHOUSE_ISLAND_ROCKY_001" &&
    bridgeRequest.componentReferences.length > 0 &&
    workspaceFoundation.performanceProfile.textureLimitProfile !==
      "shared-atlas-preferred"
  ) {
    throw createValidationError(
      "workspace_profile_mismatch",
      "Lighthouse Blender batch validation requires the existing shared-atlas workspace profile."
    );
  }
}

function normalizeSceneRequirements(rawRequirements, fieldName) {
  const requirements = asPlainObject(rawRequirements, fieldName);
  const requiredCollections = normalizeStringArray(
    requirements.requiredCollections,
    `${fieldName}.requiredCollections`
  );
  const lodCollectionAliases = asPlainObject(
    requirements.lodCollectionAliases,
    `${fieldName}.lodCollectionAliases`
  );

  const normalizedAliases = {};
  for (const lodKey of supportedLodKeys) {
    normalizedAliases[lodKey] = normalizeStringValue(
      lodCollectionAliases[lodKey],
      `${fieldName}.lodCollectionAliases.${lodKey}`
    );
  }

  return deepFreeze({
    requiredCollections: deepFreeze(requiredCollections),
    rootCollection: normalizeStringValue(
      requirements.rootCollection,
      `${fieldName}.rootCollection`
    ),
    lodCollectionAliases: deepFreeze(normalizedAliases),
    objectNamingExpectation: normalizeStringValue(
      requirements.objectNamingExpectation,
      `${fieldName}.objectNamingExpectation`
    )
  });
}

function normalizeMaterialRequirements(rawRequirements, fieldName) {
  const requirements = asPlainObject(rawRequirements, fieldName);
  return deepFreeze({
    sharedMaterialProfile: normalizeStringValue(
      requirements.sharedMaterialProfile,
      `${fieldName}.sharedMaterialProfile`
    ),
    materialNamingExpectation: normalizeStringValue(
      requirements.materialNamingExpectation,
      `${fieldName}.materialNamingExpectation`
    ),
    mobileTextureExpectation: normalizeStringValue(
      requirements.mobileTextureExpectation,
      `${fieldName}.mobileTextureExpectation`
    )
  });
}

function normalizeLodRequirements(rawRequirements, fieldName) {
  const requirements = asPlainObject(rawRequirements, fieldName);
  const normalized = {};

  for (const lodKey of supportedLodKeys) {
    const entry = asPlainObject(requirements[lodKey], `${fieldName}.${lodKey}`);
    normalized[lodKey] = deepFreeze({
      lodKey: normalizeStringValue(entry.lodKey, `${fieldName}.${lodKey}.lodKey`),
      geometryProfile: normalizeStringValue(
        entry.geometryProfile,
        `${fieldName}.${lodKey}.geometryProfile`
      ),
      targetPurpose: normalizeStringValue(
        entry.targetPurpose,
        `${fieldName}.${lodKey}.targetPurpose`
      )
    });
  }

  return deepFreeze(normalized);
}

function normalizeExportRequirements(rawRequirements, fieldName) {
  const requirements = asPlainObject(rawRequirements, fieldName);
  const lodExports = asPlainObject(requirements.lodExports, `${fieldName}.lodExports`);
  const validationProfile = asPlainObject(
    requirements.validationProfile,
    `${fieldName}.validationProfile`
  );

  const normalizedLodExports = {};
  for (const lodKey of supportedLodKeys) {
    normalizedLodExports[lodKey] = normalizeStringValue(
      lodExports[lodKey],
      `${fieldName}.lodExports.${lodKey}`
    );
  }

  return deepFreeze({
    format: normalizeStringValue(requirements.format, `${fieldName}.format`).toLowerCase(),
    lodExports: deepFreeze(normalizedLodExports),
    assetManifestReference: normalizePermanentId(
      requirements.assetManifestReference,
      `${fieldName}.assetManifestReference`
    ),
    validationProfile: deepFreeze({
      namingValidated: normalizeBoolean(
        validationProfile.namingValidated,
        `${fieldName}.validationProfile.namingValidated`
      ),
      lodValidated: normalizeBoolean(
        validationProfile.lodValidated,
        `${fieldName}.validationProfile.lodValidated`
      ),
      materialsValidated: normalizeBoolean(
        validationProfile.materialsValidated,
        `${fieldName}.validationProfile.materialsValidated`
      ),
      workflowValidated: normalizeBoolean(
        validationProfile.workflowValidated,
        `${fieldName}.validationProfile.workflowValidated`
      )
    })
  });
}

function normalizeValidationRequirements(rawRequirements, fieldName) {
  const requirements = asPlainObject(rawRequirements, fieldName);
  const mobilePerformanceMetadata = asPlainObject(
    requirements.mobilePerformanceMetadata,
    `${fieldName}.mobilePerformanceMetadata`
  );

  return deepFreeze({
    assetIdExists: normalizeBoolean(
      requirements.assetIdExists,
      `${fieldName}.assetIdExists`
    ),
    recipeReferenceExists: normalizeBoolean(
      requirements.recipeReferenceExists,
      `${fieldName}.recipeReferenceExists`
    ),
    sceneContractValidated: normalizeBoolean(
      requirements.sceneContractValidated,
      `${fieldName}.sceneContractValidated`
    ),
    materialRequirementsValidated: normalizeBoolean(
      requirements.materialRequirementsValidated,
      `${fieldName}.materialRequirementsValidated`
    ),
    lodRequirementsValidated: normalizeBoolean(
      requirements.lodRequirementsValidated,
      `${fieldName}.lodRequirementsValidated`
    ),
    glbExportValidationRequired: normalizeBoolean(
      requirements.glbExportValidationRequired,
      `${fieldName}.glbExportValidationRequired`
    ),
    mobilePerformanceValidationRequired: normalizeBoolean(
      requirements.mobilePerformanceValidationRequired,
      `${fieldName}.mobilePerformanceValidationRequired`
    ),
    mobilePerformanceMetadata: deepFreeze({
      storageTargetKb: normalizePositiveNumber(
        mobilePerformanceMetadata.storageTargetKb,
        `${fieldName}.mobilePerformanceMetadata.storageTargetKb`
      ),
      ramTargetKb: normalizePositiveNumber(
        mobilePerformanceMetadata.ramTargetKb,
        `${fieldName}.mobilePerformanceMetadata.ramTargetKb`
      ),
      gpuVertexBudget: normalizePositiveNumber(
        mobilePerformanceMetadata.gpuVertexBudget,
        `${fieldName}.mobilePerformanceMetadata.gpuVertexBudget`
      ),
      textureStrategy: normalizeStringValue(
        mobilePerformanceMetadata.textureStrategy,
        `${fieldName}.mobilePerformanceMetadata.textureStrategy`
      )
    })
  });
}

function assertBatchRequiredFields(batch) {
  for (const fieldName of coastalStarterPackBlenderBatch001RequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(batch, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Coastal starter Blender batch is missing required field ${fieldName}.`
      );
    }
  }
}

function assertJobRequiredFields(job) {
  for (const fieldName of coastalStarterPackBlenderJobRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(job, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Blender job is missing required field ${fieldName}.`
      );
    }
  }
}

function createBlenderJobDefinition({
  blenderJobId,
  assetId,
  assetFamilyId,
  recipeReference,
  componentReferences,
  materialPrefix,
  generationHookPrefix,
  mobilePerformanceMetadata
}) {
  return deepFreeze({
    blenderJobId,
    assetId,
    assetFamilyId,
    recipeReference,
    componentReferences: deepFreeze(componentReferences),
    sceneRequirements: deepFreeze({
      requiredCollections: coastalStarterPackRequiredBlenderCollections,
      rootCollection: assetId,
      lodCollectionAliases: deepFreeze({
        close: `${assetId}_LOD_CLOSE`,
        gameplay: `${assetId}_LOD_GAMEPLAY`,
        map: `${assetId}_LOD_MAP`,
        distantSilhouette: `${assetId}_LOD_DISTANT_SILHOUETTE`
      }),
      objectNamingExpectation: `${generationHookPrefix.toUpperCase().replace(/-/g, "_")}_*_OBJ`
    }),
    materialRequirements: deepFreeze({
      sharedMaterialProfile: "coastal-shared-materials",
      materialNamingExpectation: `${materialPrefix}_*_SHARED_001`,
      mobileTextureExpectation: "shared_atlas_mobile_ready"
    }),
    lodRequirements: deepFreeze({
      close: {
        lodKey: "close",
        geometryProfile: "lod0",
        targetPurpose: "detail-modeling"
      },
      gameplay: {
        lodKey: "gameplay",
        geometryProfile: "lod1",
        targetPurpose: "primary-gameplay-view"
      },
      map: {
        lodKey: "map",
        geometryProfile: "lod2",
        targetPurpose: "map-presence"
      },
      distantSilhouette: {
        lodKey: "distantSilhouette",
        geometryProfile: "lod3",
        targetPurpose: "skyline-silhouette"
      }
    }),
    exportRequirements: deepFreeze({
      format: "glb",
      lodExports: deepFreeze({
        close: `${assetId}_LOD_CLOSE.glb`,
        gameplay: `${assetId}_LOD_GAMEPLAY.glb`,
        map: `${assetId}_LOD_MAP.glb`,
        distantSilhouette: `${assetId}_LOD_DISTANT_SILHOUETTE.glb`
      }),
      assetManifestReference: assetId,
      validationProfile: deepFreeze({
        namingValidated: true,
        lodValidated: true,
        materialsValidated: true,
        workflowValidated: true
      })
    }),
    validationRequirements: deepFreeze({
      assetIdExists: true,
      recipeReferenceExists: true,
      sceneContractValidated: true,
      materialRequirementsValidated: true,
      lodRequirementsValidated: true,
      glbExportValidationRequired: true,
      mobilePerformanceValidationRequired: true,
      mobilePerformanceMetadata: deepFreeze(mobilePerformanceMetadata)
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

function normalizeStatus(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (normalized !== "validated") {
    throw createValidationError(
      "invalid_status",
      `Field ${fieldName} must use validated status for this passive Blender batch foundation.`
    );
  }

  return normalized;
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
    batch: null
  });
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "CoastalStarterPackBlenderBatch001ValidationError";
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
