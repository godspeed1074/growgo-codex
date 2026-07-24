import { assetRegistryStatuses } from "./asset-registry.mjs";
import { buildStarterAssetFactoryLayers } from "./starter-asset-manifest-pack.mjs";

export const coastalStarterPackProductionQueueRequiredFields = Object.freeze([
  "queueId",
  "version",
  "status",
  "productionJobs",
  "metadata"
]);

export const coastalStarterPackProductionJobRequiredFields = Object.freeze([
  "productionJobId",
  "assetId",
  "assetFamilyId",
  "priorityTier",
  "productionStatus",
  "dependencies",
  "blenderRequirements",
  "exportRequirements",
  "validationRequirements"
]);

export const coastalStarterPackPriorityTiers = Object.freeze([
  "tier1",
  "tier2",
  "tier3"
]);

export const coastalStarterPackProductionStatuses = Object.freeze([
  "planned",
  "queued",
  "blocked"
]);

export const coastalStarterPackRequiredBlenderCollections = Object.freeze([
  "GEOMETRY",
  "MATERIALS",
  "LOD0",
  "LOD1",
  "LOD2",
  "LOD3",
  "EXPORT"
]);

export const coastalStarterPackPlanningAssetRecords = deepFreeze([
  createPlanningAssetRecord("LIGHTHOUSE_ISLAND_ROCKY_001", "landmarks", "COASTAL_LIGHTHOUSE_FAMILY_001"),
  createPlanningAssetRecord("BUILDING_COASTAL_COTTAGE_001", "buildings", "COASTAL_RESIDENTIAL_FAMILY_001"),
  createPlanningAssetRecord("ROAD_COASTAL_001", "roads", "COASTAL_INFRASTRUCTURE_FAMILY_001"),
  createPlanningAssetRecord("GROUND_COASTAL_GRASS_001", "terrain", "COASTAL_GROUND_FAMILY_001"),
  createPlanningAssetRecord("ROCK_COASTAL_SMALL_001", "nature", "COASTAL_NATURE_FAMILY_001"),
  createPlanningAssetRecord("SHRUB_COASTAL_LOW_001", "nature", "COASTAL_NATURE_FAMILY_001"),
  createPlanningAssetRecord("TRAIL_COASTAL_001", "roads", "COASTAL_INFRASTRUCTURE_FAMILY_001"),
  createPlanningAssetRecord("FENCE_COASTAL_WOOD_001", "decorations", "COASTAL_DECORATION_FAMILY_001"),
  createPlanningAssetRecord("SHOP_COASTAL_BAKERY_001", "buildings", "COASTAL_COMMERCIAL_FAMILY_001"),
  createPlanningAssetRecord("GAS_COASTAL_FUEL_STOP_001", "buildings", "COASTAL_COMMERCIAL_FAMILY_001"),
  createPlanningAssetRecord("SHOP_COASTAL_CAFE_001", "buildings", "COASTAL_COMMERCIAL_FAMILY_001"),
  createPlanningAssetRecord("SHOP_COASTAL_GENERAL_STORE_001", "buildings", "COASTAL_COMMERCIAL_FAMILY_001"),
  createPlanningAssetRecord("BOARDWALK_COASTAL_001", "roads", "COASTAL_INFRASTRUCTURE_FAMILY_001")
]);

export const coastalStarterPackPlanningRecipeRecords = deepFreeze([
  createPlanningRecipeRecord("LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001", "lighthouse_island_rocky"),
  createPlanningRecipeRecord("BUILDING_COASTAL_COTTAGE_RECIPE_001", "building_coastal_cottage"),
  createPlanningRecipeRecord("ROAD_COASTAL_RECIPE_001", "road_coastal"),
  createPlanningRecipeRecord("GROUND_COASTAL_GRASS_RECIPE_001", "ground_coastal_grass"),
  createPlanningRecipeRecord("ROCK_COASTAL_SMALL_RECIPE_001", "rock_coastal_small"),
  createPlanningRecipeRecord("SHRUB_COASTAL_LOW_RECIPE_001", "shrub_coastal_low"),
  createPlanningRecipeRecord("TRAIL_COASTAL_RECIPE_001", "trail_coastal"),
  createPlanningRecipeRecord("FENCE_COASTAL_WOOD_RECIPE_001", "fence_coastal_wood"),
  createPlanningRecipeRecord("SHOP_COASTAL_BAKERY_RECIPE_001", "shop_coastal_bakery"),
  createPlanningRecipeRecord("GAS_COASTAL_FUEL_STOP_RECIPE_001", "gas_coastal_fuel_stop"),
  createPlanningRecipeRecord("SHOP_COASTAL_CAFE_RECIPE_001", "shop_coastal_cafe"),
  createPlanningRecipeRecord(
    "SHOP_COASTAL_GENERAL_STORE_RECIPE_001",
    "shop_coastal_general_store"
  ),
  createPlanningRecipeRecord("BOARDWALK_COASTAL_RECIPE_001", "boardwalk_coastal")
]);

export const coastalStarterPackPlanningManifestRecords = deepFreeze([
  createPlanningManifestRecord("LIGHTHOUSE_ISLAND_ROCKY_001", "landmarks", "LIGHTHOUSE_ISLAND_ROCKY_RECIPE_001"),
  createPlanningManifestRecord(
    "BUILDING_COASTAL_COTTAGE_001",
    "buildings",
    "BUILDING_COASTAL_COTTAGE_RECIPE_001"
  ),
  createPlanningManifestRecord("ROAD_COASTAL_001", "roads", "ROAD_COASTAL_RECIPE_001"),
  createPlanningManifestRecord(
    "GROUND_COASTAL_GRASS_001",
    "terrain",
    "GROUND_COASTAL_GRASS_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "ROCK_COASTAL_SMALL_001",
    "nature",
    "ROCK_COASTAL_SMALL_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "SHRUB_COASTAL_LOW_001",
    "nature",
    "SHRUB_COASTAL_LOW_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "TRAIL_COASTAL_001",
    "roads",
    "TRAIL_COASTAL_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "FENCE_COASTAL_WOOD_001",
    "decorations",
    "FENCE_COASTAL_WOOD_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "SHOP_COASTAL_BAKERY_001",
    "buildings",
    "SHOP_COASTAL_BAKERY_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "GAS_COASTAL_FUEL_STOP_001",
    "buildings",
    "GAS_COASTAL_FUEL_STOP_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "SHOP_COASTAL_CAFE_001",
    "buildings",
    "SHOP_COASTAL_CAFE_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "SHOP_COASTAL_GENERAL_STORE_001",
    "buildings",
    "SHOP_COASTAL_GENERAL_STORE_RECIPE_001"
  ),
  createPlanningManifestRecord(
    "BOARDWALK_COASTAL_001",
    "roads",
    "BOARDWALK_COASTAL_RECIPE_001"
  )
]);

export const coastalStarterPackProductionQueueDefinition = deepFreeze({
  queueId: "COASTAL_STARTER_PACK_PRODUCTION_QUEUE_001",
  version: "1.0.0",
  status: "validated",
  productionJobs: deepFreeze([
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_001",
      assetId: "LIGHTHOUSE_ISLAND_ROCKY_001",
      assetFamilyId: "COASTAL_LIGHTHOUSE_FAMILY_001",
      priorityTier: "tier1",
      dependencies: [],
      productionProfile: "coastal_landmark_tier1"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_002",
      assetId: "BUILDING_COASTAL_COTTAGE_001",
      assetFamilyId: "COASTAL_RESIDENTIAL_FAMILY_001",
      priorityTier: "tier1",
      dependencies: [],
      productionProfile: "coastal_residential_tier1"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_003",
      assetId: "TREE_EUCALYPTUS_001",
      assetFamilyId: "COASTAL_NATURE_FAMILY_001",
      priorityTier: "tier1",
      dependencies: [],
      productionProfile: "coastal_nature_tier1"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_004",
      assetId: "ROAD_COASTAL_001",
      assetFamilyId: "COASTAL_INFRASTRUCTURE_FAMILY_001",
      priorityTier: "tier1",
      dependencies: [],
      productionProfile: "coastal_infrastructure_tier1"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_005",
      assetId: "GROUND_COASTAL_GRASS_001",
      assetFamilyId: "COASTAL_GROUND_FAMILY_001",
      priorityTier: "tier1",
      dependencies: [],
      productionProfile: "coastal_ground_tier1"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_006",
      assetId: "ROCK_COASTAL_SMALL_001",
      assetFamilyId: "COASTAL_NATURE_FAMILY_001",
      priorityTier: "tier2",
      dependencies: ["GROUND_COASTAL_GRASS_001"],
      productionProfile: "coastal_nature_tier2"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_007",
      assetId: "SHRUB_COASTAL_LOW_001",
      assetFamilyId: "COASTAL_NATURE_FAMILY_001",
      priorityTier: "tier2",
      dependencies: ["GROUND_COASTAL_GRASS_001"],
      productionProfile: "coastal_nature_tier2"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_008",
      assetId: "TRAIL_COASTAL_001",
      assetFamilyId: "COASTAL_INFRASTRUCTURE_FAMILY_001",
      priorityTier: "tier2",
      dependencies: ["ROAD_COASTAL_001", "GROUND_COASTAL_GRASS_001"],
      productionProfile: "coastal_infrastructure_tier2"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_009",
      assetId: "FENCE_COASTAL_WOOD_001",
      assetFamilyId: "COASTAL_DECORATION_FAMILY_001",
      priorityTier: "tier2",
      dependencies: ["BUILDING_COASTAL_COTTAGE_001"],
      productionProfile: "coastal_decoration_tier2"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_010",
      assetId: "SHOP_COASTAL_BAKERY_001",
      assetFamilyId: "COASTAL_COMMERCIAL_FAMILY_001",
      priorityTier: "tier2",
      dependencies: ["ROAD_COASTAL_001"],
      productionProfile: "coastal_commercial_tier2"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_011",
      assetId: "GAS_COASTAL_FUEL_STOP_001",
      assetFamilyId: "COASTAL_COMMERCIAL_FAMILY_001",
      priorityTier: "tier3",
      dependencies: ["ROAD_COASTAL_001", "GROUND_COASTAL_GRASS_001"],
      productionProfile: "coastal_commercial_tier3"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_012",
      assetId: "SHOP_COASTAL_CAFE_001",
      assetFamilyId: "COASTAL_COMMERCIAL_FAMILY_001",
      priorityTier: "tier3",
      dependencies: ["ROAD_COASTAL_001", "GROUND_COASTAL_GRASS_001"],
      productionProfile: "coastal_commercial_tier3"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_013",
      assetId: "SHOP_COASTAL_GENERAL_STORE_001",
      assetFamilyId: "COASTAL_COMMERCIAL_FAMILY_001",
      priorityTier: "tier3",
      dependencies: ["ROAD_COASTAL_001"],
      productionProfile: "coastal_commercial_tier3"
    }),
    createProductionJobDefinition({
      productionJobId: "COASTAL_STARTER_PRODUCTION_JOB_014",
      assetId: "BOARDWALK_COASTAL_001",
      assetFamilyId: "COASTAL_INFRASTRUCTURE_FAMILY_001",
      priorityTier: "tier3",
      dependencies: ["TRAIL_COASTAL_001", "GROUND_COASTAL_GRASS_001"],
      productionProfile: "coastal_infrastructure_tier3"
    })
  ]),
  metadata: deepFreeze({
    creatorSource: "internal",
    validationState: "validated",
    packRole: "coastal_starter_pack_production_queue",
    deterministic: true,
    planningOnly: true,
    atlasSystemsModified: false
  })
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;
const priorityTierOrder = Object.freeze({
  tier1: 1,
  tier2: 2,
  tier3: 3
});

export function buildCoastalStarterPackProductionQueueContext() {
  const layers = buildStarterAssetFactoryLayers();

  for (const asset of coastalStarterPackPlanningAssetRecords) {
    if (!layers.assetRegistry.hasAsset(asset.assetId)) {
      layers.assetRegistry.addAsset(asset);
    }
  }

  for (const recipe of coastalStarterPackPlanningRecipeRecords) {
    if (!layers.recipeRegistry.hasRecipe(recipe.recipeId)) {
      layers.recipeRegistry.addRecipe(recipe);
    }
  }

  for (const manifest of coastalStarterPackPlanningManifestRecords) {
    if (!layers.manifestRegistry.hasManifest(manifest.assetId)) {
      layers.manifestRegistry.addManifest(manifest);
    }
  }

  return Object.freeze(layers);
}

export function createCoastalStarterPackProductionQueue(
  rawQueue = coastalStarterPackProductionQueueDefinition,
  options = {}
) {
  return normalizeQueue(rawQueue, normalizeOptions(options));
}

export function validateCoastalStarterPackProductionQueue(
  rawQueue = coastalStarterPackProductionQueueDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const queue = normalizeQueue(rawQueue, normalizedOptions);

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      queue: Object.freeze({
        definition: queue,
        jobsByPriority: Object.freeze(sortJobsByPriority(queue.productionJobs)),
        compatibility: Object.freeze({
          queueCreationVerified: true,
          priorityOrderingVerified: true,
          dependencyResolutionVerified: true,
          assetRegistryVerificationComplete: true,
          recipeReferenceVerificationComplete: true,
          lodProfileVerificationComplete: true,
          performanceMetadataVerificationComplete: true,
          atlasCompatibilityVerificationComplete: true,
          passiveOnly: true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "CoastalStarterPackProductionQueueValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      queue: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    validationContext:
      options.validationContext ??
      buildCoastalStarterPackProductionQueueContext()
  });
}

function normalizeQueue(rawQueue, options) {
  const queue = asPlainObject(rawQueue, "coastal starter pack production queue");
  assertQueueRequiredFields(queue);

  const queueId = normalizePermanentId(queue.queueId, "queueId");
  const version = normalizeVersion(queue.version, "version");
  const status = normalizeStatus(queue.status, "status");
  const productionJobs = normalizeProductionJobs(queue.productionJobs);
  const metadata = deepFreeze(asPlainObject(queue.metadata, "metadata"));

  validateQueueDependencies(productionJobs, options.validationContext);

  return deepFreeze({
    queueId,
    version,
    status,
    productionJobs: deepFreeze(sortJobsByPriority(productionJobs)),
    metadata
  });
}

function normalizeProductionJobs(rawProductionJobs) {
  if (!Array.isArray(rawProductionJobs)) {
    throw createValidationError(
      "invalid_field_type",
      "Production queue jobs must be an array."
    );
  }

  const seenJobIds = new Set();
  const seenAssetIds = new Set();

  return rawProductionJobs.map((rawJob, index) => {
    const job = normalizeProductionJob(rawJob, index);

    if (seenJobIds.has(job.productionJobId)) {
      throw createValidationError(
        "duplicate_job_id",
        `Production job ${job.productionJobId} is duplicated in the queue.`
      );
    }

    if (seenAssetIds.has(job.assetId)) {
      throw createValidationError(
        "duplicate_asset_id",
        `Queue asset ${job.assetId} appears more than once in the production queue.`
      );
    }

    seenJobIds.add(job.productionJobId);
    seenAssetIds.add(job.assetId);
    return job;
  });
}

function normalizeProductionJob(rawJob, index) {
  const job = asPlainObject(rawJob, `productionJobs[${index}]`);
  assertJobRequiredFields(job);

  const priorityTier = normalizeStringValue(
    job.priorityTier,
    `productionJobs[${index}].priorityTier`
  );
  if (!coastalStarterPackPriorityTiers.includes(priorityTier)) {
    throw createValidationError(
      "invalid_priority_tier",
      `Production job ${job.productionJobId} uses unsupported priority tier ${priorityTier}.`
    );
  }

  const productionStatus = normalizeStringValue(
    job.productionStatus,
    `productionJobs[${index}].productionStatus`
  );
  if (!coastalStarterPackProductionStatuses.includes(productionStatus)) {
    throw createValidationError(
      "invalid_production_status",
      `Production job ${job.productionJobId} uses unsupported production status ${productionStatus}.`
    );
  }

  return deepFreeze({
    productionJobId: normalizePermanentId(
      job.productionJobId,
      `productionJobs[${index}].productionJobId`
    ),
    assetId: normalizePermanentId(job.assetId, `productionJobs[${index}].assetId`),
    assetFamilyId: normalizePermanentId(
      job.assetFamilyId,
      `productionJobs[${index}].assetFamilyId`
    ),
    priorityTier,
    productionStatus,
    dependencies: deepFreeze(
      normalizePermanentIdArray(job.dependencies, `productionJobs[${index}].dependencies`)
    ),
    blenderRequirements: normalizeBlenderRequirements(
      job.blenderRequirements,
      `productionJobs[${index}].blenderRequirements`
    ),
    exportRequirements: normalizeExportRequirements(
      job.exportRequirements,
      `productionJobs[${index}].exportRequirements`
    ),
    validationRequirements: normalizeValidationRequirements(
      job.validationRequirements,
      `productionJobs[${index}].validationRequirements`
    )
  });
}

function normalizeBlenderRequirements(rawRequirements, fieldName) {
  const requirements = asPlainObject(rawRequirements, fieldName);
  const requiredCollections = normalizeStringArray(
    requirements.requiredCollections,
    `${fieldName}.requiredCollections`
  );

  if (
    requiredCollections.length !== coastalStarterPackRequiredBlenderCollections.length ||
    requiredCollections.some(
      (entry, index) => entry !== coastalStarterPackRequiredBlenderCollections[index]
    )
  ) {
    throw createValidationError(
      "invalid_blender_collections",
      `Field ${fieldName}.requiredCollections must match the approved coastal starter pack Blender handoff collections.`
    );
  }

  return deepFreeze({
    requiredCollections: deepFreeze(requiredCollections),
    sourceProfile: normalizeStringValue(
      requirements.sourceProfile,
      `${fieldName}.sourceProfile`
    ),
    sharedMaterialProfile: normalizeStringValue(
      requirements.sharedMaterialProfile,
      `${fieldName}.sharedMaterialProfile`
    ),
    exportProfile: normalizeStringValue(
      requirements.exportProfile,
      `${fieldName}.exportProfile`
    )
  });
}

function normalizeExportRequirements(rawRequirements, fieldName) {
  const requirements = asPlainObject(rawRequirements, fieldName);
  const lodMetadata = asPlainObject(requirements.lodMetadata, `${fieldName}.lodMetadata`);
  const assetManifest = asPlainObject(requirements.assetManifest, `${fieldName}.assetManifest`);

  return deepFreeze({
    format: normalizeStringValue(requirements.format, `${fieldName}.format`),
    mobileTextureExpectations: normalizeStringValue(
      requirements.mobileTextureExpectations,
      `${fieldName}.mobileTextureExpectations`
    ),
    sharedMaterialExpectations: normalizeStringValue(
      requirements.sharedMaterialExpectations,
      `${fieldName}.sharedMaterialExpectations`
    ),
    lodMetadata: deepFreeze({
      profileId: normalizeStringValue(lodMetadata.profileId, `${fieldName}.lodMetadata.profileId`),
      levels: deepFreeze(
        normalizeStringArray(lodMetadata.levels, `${fieldName}.lodMetadata.levels`)
      ),
      metadataRequired: normalizeBoolean(
        lodMetadata.metadataRequired,
        `${fieldName}.lodMetadata.metadataRequired`
      )
    }),
    assetManifest: deepFreeze({
      assetId: normalizePermanentId(assetManifest.assetId, `${fieldName}.assetManifest.assetId`),
      manifestVersion: normalizeVersion(
        assetManifest.manifestVersion,
        `${fieldName}.assetManifest.manifestVersion`
      )
    })
  });
}

function normalizeValidationRequirements(rawRequirements, fieldName) {
  const requirements = asPlainObject(rawRequirements, fieldName);
  const performanceMetadata = asPlainObject(
    requirements.performanceMetadata,
    `${fieldName}.performanceMetadata`
  );
  const atlasCompatibility = asPlainObject(
    requirements.atlasCompatibility,
    `${fieldName}.atlasCompatibility`
  );

  return deepFreeze({
    assetIdExists: normalizeBoolean(
      requirements.assetIdExists,
      `${fieldName}.assetIdExists`
    ),
    dependenciesResolve: normalizeBoolean(
      requirements.dependenciesResolve,
      `${fieldName}.dependenciesResolve`
    ),
    recipeReferenceExists: normalizeBoolean(
      requirements.recipeReferenceExists,
      `${fieldName}.recipeReferenceExists`
    ),
    lodProfileExists: normalizeBoolean(
      requirements.lodProfileExists,
      `${fieldName}.lodProfileExists`
    ),
    performanceMetadataExists: normalizeBoolean(
      requirements.performanceMetadataExists,
      `${fieldName}.performanceMetadataExists`
    ),
    atlasCompatibilityExists: normalizeBoolean(
      requirements.atlasCompatibilityExists,
      `${fieldName}.atlasCompatibilityExists`
    ),
    performanceMetadata: deepFreeze({
      storageTargetKb: normalizePositiveNumber(
        performanceMetadata.storageTargetKb,
        `${fieldName}.performanceMetadata.storageTargetKb`
      ),
      ramTargetKb: normalizePositiveNumber(
        performanceMetadata.ramTargetKb,
        `${fieldName}.performanceMetadata.ramTargetKb`
      ),
      gpuVertexBudget: normalizePositiveNumber(
        performanceMetadata.gpuVertexBudget,
        `${fieldName}.performanceMetadata.gpuVertexBudget`
      )
    }),
    atlasCompatibility: deepFreeze({
      previewCompatible: normalizeBoolean(
        atlasCompatibility.previewCompatible,
        `${fieldName}.atlasCompatibility.previewCompatible`
      ),
      worldInstanceCompatible: normalizeBoolean(
        atlasCompatibility.worldInstanceCompatible,
        `${fieldName}.atlasCompatibility.worldInstanceCompatible`
      ),
      showcaseCompatible: normalizeBoolean(
        atlasCompatibility.showcaseCompatible,
        `${fieldName}.atlasCompatibility.showcaseCompatible`
      )
    })
  });
}

function validateQueueDependencies(productionJobs, context) {
  const jobAssetIds = new Set(productionJobs.map((job) => job.assetId));

  for (const job of productionJobs) {
    validateJobAsset(job, context);
    validateJobDependencies(job, jobAssetIds);
    validateJobReadinessMetadata(job);
  }
}

function validateJobAsset(job, context) {
  const asset = context.assetRegistry.findAssetById(job.assetId);
  if (!asset) {
    throw createValidationError(
      "missing_asset_reference",
      `Production job ${job.productionJobId} references asset ${job.assetId}, which does not exist in the available Asset Factory registries.`
    );
  }

  const manifest = context.manifestRegistry.findManifestByAssetId(job.assetId);
  if (!manifest) {
    throw createValidationError(
      "missing_manifest_reference",
      `Production job ${job.productionJobId} is missing an asset manifest for ${job.assetId}.`
    );
  }

  const recipe = context.recipeRegistry.findRecipeById(manifest.recipeId);
  if (!recipe) {
    throw createValidationError(
      "missing_recipe_reference",
      `Production job ${job.productionJobId} is missing a recipe reference for ${job.assetId}.`
    );
  }
}

function validateJobDependencies(job, jobAssetIds) {
  for (const dependencyAssetId of job.dependencies) {
    if (!jobAssetIds.has(dependencyAssetId)) {
      throw createValidationError(
        "missing_dependency_reference",
        `Production job ${job.productionJobId} depends on ${dependencyAssetId}, which is not present in the coastal starter production queue.`
      );
    }
  }
}

function validateJobReadinessMetadata(job) {
  if (job.exportRequirements.format.toLowerCase() !== "glb") {
    throw createValidationError(
      "invalid_export_format",
      `Production job ${job.productionJobId} must require GLB output.`
    );
  }

  if (job.exportRequirements.lodMetadata.levels.length !== 4) {
    throw createValidationError(
      "missing_lod_profile",
      `Production job ${job.productionJobId} must define all required LOD metadata levels.`
    );
  }

  if (!job.validationRequirements.assetIdExists) {
    throw createValidationError(
      "asset_id_validation_disabled",
      `Production job ${job.productionJobId} must keep asset ID existence validation enabled.`
    );
  }

  if (!job.validationRequirements.dependenciesResolve) {
    throw createValidationError(
      "dependency_validation_disabled",
      `Production job ${job.productionJobId} must keep dependency validation enabled.`
    );
  }

  if (!job.validationRequirements.recipeReferenceExists) {
    throw createValidationError(
      "recipe_validation_disabled",
      `Production job ${job.productionJobId} must keep recipe reference validation enabled.`
    );
  }

  if (!job.validationRequirements.lodProfileExists) {
    throw createValidationError(
      "lod_validation_disabled",
      `Production job ${job.productionJobId} must keep LOD profile validation enabled.`
    );
  }

  if (!job.validationRequirements.performanceMetadataExists) {
    throw createValidationError(
      "performance_metadata_missing",
      `Production job ${job.productionJobId} must declare performance metadata.`
    );
  }

  if (!job.validationRequirements.atlasCompatibilityExists) {
    throw createValidationError(
      "atlas_compatibility_missing",
      `Production job ${job.productionJobId} must declare Atlas compatibility metadata.`
    );
  }

  if (
    !job.validationRequirements.atlasCompatibility.previewCompatible ||
    !job.validationRequirements.atlasCompatibility.worldInstanceCompatible ||
    !job.validationRequirements.atlasCompatibility.showcaseCompatible
  ) {
    throw createValidationError(
      "atlas_compatibility_incomplete",
      `Production job ${job.productionJobId} must remain compatible with Atlas preview, world-instance, and showcase flows.`
    );
  }
}

function assertQueueRequiredFields(queue) {
  for (const fieldName of coastalStarterPackProductionQueueRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(queue, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Coastal starter pack production queue is missing required field ${fieldName}.`
      );
    }
  }
}

function assertJobRequiredFields(job) {
  for (const fieldName of coastalStarterPackProductionJobRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(job, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Production job is missing required field ${fieldName}.`
      );
    }
  }
}

function sortJobsByPriority(productionJobs) {
  return [...productionJobs].sort((left, right) => {
    const priorityDifference =
      priorityTierOrder[left.priorityTier] - priorityTierOrder[right.priorityTier];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return left.productionJobId.localeCompare(right.productionJobId);
  });
}

function createProductionJobDefinition({
  productionJobId,
  assetId,
  assetFamilyId,
  priorityTier,
  dependencies,
  productionProfile
}) {
  return deepFreeze({
    productionJobId,
    assetId,
    assetFamilyId,
    priorityTier,
    productionStatus: "planned",
    dependencies: deepFreeze(dependencies),
    blenderRequirements: deepFreeze({
      requiredCollections: coastalStarterPackRequiredBlenderCollections,
      sourceProfile: productionProfile,
      sharedMaterialProfile: "coastal-shared-materials",
      exportProfile: "glb-mobile-shared-materials"
    }),
    exportRequirements: deepFreeze({
      format: "GLB",
      mobileTextureExpectations: "shared_atlas_mobile_ready",
      sharedMaterialExpectations: "shared_materials_required",
      lodMetadata: deepFreeze({
        profileId: `${assetId}_LOD_PROFILE`,
        levels: deepFreeze(["LOD0", "LOD1", "LOD2", "LOD3"]),
        metadataRequired: true
      }),
      assetManifest: deepFreeze({
        assetId,
        manifestVersion: "1.0.0"
      })
    }),
    validationRequirements: deepFreeze({
      assetIdExists: true,
      dependenciesResolve: true,
      recipeReferenceExists: true,
      lodProfileExists: true,
      performanceMetadataExists: true,
      atlasCompatibilityExists: true,
      performanceMetadata: deepFreeze({
        storageTargetKb: 256,
        ramTargetKb: 384,
        gpuVertexBudget: 480
      }),
      atlasCompatibility: deepFreeze({
        previewCompatible: true,
        worldInstanceCompatible: true,
        showcaseCompatible: true
      })
    })
  });
}

function createPlanningAssetRecord(assetId, category, assetFamilyId) {
  return deepFreeze({
    assetId,
    category,
    version: "1.0.0",
    status: "validated",
    components: deepFreeze([]),
    tags: deepFreeze(["coastal", "starter-pack", "production-queue"]),
    metadata: deepFreeze({
      assetFamilyId,
      queuePlanned: true,
      planningOnly: true
    })
  });
}

function createPlanningRecipeRecord(recipeId, assetType) {
  return deepFreeze({
    recipeId,
    assetType,
    version: "1.0.0",
    status: "validated",
    components: deepFreeze([]),
    optionalComponents: deepFreeze([]),
    metadata: deepFreeze({
      planningOnly: true,
      source: "coastal_starter_pack_production_queue"
    }),
    generationRules: deepFreeze({
      deterministic: true,
      profile: "coastal-starter-pack-planning"
    })
  });
}

function createPlanningManifestRecord(assetId, category, recipeId) {
  return deepFreeze({
    assetId,
    category,
    version: "1.0.0",
    status: "validated",
    recipeId,
    componentReferences: deepFreeze([]),
    metadata: deepFreeze({
      queuePlanned: true,
      atlasCompatibility: deepFreeze({
        previewCompatible: true,
        worldInstanceCompatible: true,
        showcaseCompatible: true
      })
    }),
    tags: deepFreeze(["coastal", "starter-pack", "production-queue"]),
    generationRules: deepFreeze({
      deterministic: true,
      profile: "coastal-starter-pack-planning"
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
  if (!assetRegistryStatuses.includes(normalized)) {
    throw createValidationError(
      "invalid_status",
      `Field ${fieldName} must use an approved Asset Factory status.`
    );
  }

  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of non-empty strings.`
    );
  }

  return value.map((entry, index) =>
    normalizeStringValue(entry, `${fieldName}[${index}]`)
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

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "CoastalStarterPackProductionQueueValidationError";
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
