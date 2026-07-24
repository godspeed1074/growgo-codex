import {
  createMapCoordinateWorldResolverFoundation,
  mapCoordinateWorldResolverFoundationDefinition,
  validateMapCoordinateWorldResolverFoundation
} from "./map-coordinate-world-resolver-foundation.mjs";
import {
  createMapWorldSettlementAtlasSceneExpansion,
  mapWorldSettlementAtlasSceneExpansionDefinition,
  validateMapWorldSettlementAtlasSceneExpansion
} from "./map-world-settlement-atlas-scene-expansion.mjs";
import {
  buildMapWorldSettlementRealMapOverlayFoundation,
  validateMapWorldSettlementRealMapOverlayFoundation
} from "./map-world-settlement-real-map-overlay-foundation.mjs";

export const worldExpansionRegistryRequiredFields = Object.freeze([
  "worldRegionId",
  "regionType",
  "bounds",
  "generationProfile",
  "assetProfile",
  "validationResult"
]);

export const worldExpansionPlanningFoundationRequiredFields = Object.freeze([
  "expansionFrameworkId",
  "activeWorldLocation",
  "worldExpansionRegistry",
  "regionGenerationPipeline",
  "validationResult"
]);

export const worldExpansionPlanningFoundationDefinition = deepFreeze({
  ...mapCoordinateWorldResolverFoundationDefinition,
  ...mapWorldSettlementAtlasSceneExpansionDefinition
});

const supportedRegionTypes = Object.freeze([
  "coastal",
  "suburban",
  "rural",
  "urban"
]);

const supportedRegionTypeSet = new Set(supportedRegionTypes);
const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

export async function createWorldExpansionPlanningFoundation(
  rawDefinition = worldExpansionPlanningFoundationDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const worldResolver = await createMapCoordinateWorldResolverFoundation(
    definition,
    options
  );
  const settlementScene = await createMapWorldSettlementAtlasSceneExpansion(
    definition,
    options
  );
  const overlayFoundation = buildMapWorldSettlementRealMapOverlayFoundation({
    mapWorldLiveMapFoundation:
      settlementScene.mapWorldRealLocationPreview.mapWorldLiveMapFoundation,
    settlementScene
  });

  const worldExpansionRegistry = buildWorldExpansionRegistry({
    definition,
    worldResolver,
    settlementScene,
    overlayFoundation
  });
  const activeRegionProfile = worldExpansionRegistry.find(
    (region) => region.regionType === "coastal"
  );
  const regionGenerationPipeline = buildRegionGenerationPipeline({
    worldResolver,
    settlementScene,
    overlayFoundation,
    activeRegionProfile
  });

  const framework = deepFreeze({
    expansionFrameworkId: createExpansionFrameworkId(
      worldResolver.worldLocationResolver.worldId,
      worldResolver.worldLocationResolver.seed
    ),
    activeWorldLocation: deepFreeze({
      worldId: worldResolver.worldLocationResolver.worldId,
      latitude: worldResolver.worldLocationResolver.latitude,
      longitude: worldResolver.worldLocationResolver.longitude,
      terrainType: worldResolver.worldLocationResolver.terrainType,
      seed: worldResolver.worldLocationResolver.seed,
      activeRegionType: activeRegionProfile.regionType
    }),
    worldExpansionRegistry,
    regionGenerationPipeline,
    validationResult: buildFrameworkValidationResult({
      worldResolver,
      settlementScene,
      overlayFoundation,
      activeRegionProfile,
      regionGenerationPipeline
    })
  });

  const validation = validateWorldExpansionPlanningFoundation(framework);
  if (!validation.ok) {
    throw createValidationError(validation.errorCode, validation.message);
  }

  return framework;
}

export function validateWorldExpansionPlanningFoundation(rawFramework) {
  try {
    const framework = normalizeFramework(rawFramework);

    if (framework.worldExpansionRegistry.length !== supportedRegionTypes.length) {
      throw createValidationError(
        "region_count_invalid",
        "World expansion planning foundation must define exactly four supported regions."
      );
    }

    const regionTypes = new Set();
    for (const region of framework.worldExpansionRegistry) {
      validateWorldExpansionRegistryEntry(region);
      if (regionTypes.has(region.regionType)) {
        throw createValidationError(
          "duplicate_region_type",
          `World expansion planning foundation duplicates regionType ${region.regionType}.`
        );
      }
      regionTypes.add(region.regionType);
    }

    const coastalRegion = framework.worldExpansionRegistry.find(
      (region) => region.regionType === "coastal"
    );
    if (!coastalRegion) {
      throw createValidationError(
        "coastal_region_missing",
        "World expansion planning foundation requires a coastal registry profile."
      );
    }

    const resolverValidation = validateMapCoordinateWorldResolverFoundation(
      framework.regionGenerationPipeline.worldResolver
    );
    if (!resolverValidation.ok) {
      throw createValidationError(
        resolverValidation.errorCode ?? "world_resolver_invalid",
        resolverValidation.message ??
          "World expansion planning foundation requires a valid world resolver."
      );
    }

    const sceneValidation = validateMapWorldSettlementAtlasSceneExpansion(
      framework.regionGenerationPipeline.sceneAssembly.scene
    );
    if (!sceneValidation.ok) {
      throw createValidationError(
        sceneValidation.errorCode ?? "scene_invalid",
        sceneValidation.message ??
          "World expansion planning foundation requires a valid scene assembly."
      );
    }

    const overlayValidation = validateMapWorldSettlementRealMapOverlayFoundation(
      framework.regionGenerationPipeline.poiSystems.overlayFoundation
    );
    if (!overlayValidation.ok) {
      throw createValidationError(
        overlayValidation.errorCode ?? "overlay_invalid",
        overlayValidation.message ??
          "World expansion planning foundation requires a valid POI overlay foundation."
      );
    }

    if (!framework.validationResult.deterministicRegionOutputValid) {
      throw createValidationError(
        "deterministic_region_output_invalid",
        "World expansion planning foundation deterministicRegionOutputValid must be true."
      );
    }
    if (!framework.validationResult.profileCompatibilityValid) {
      throw createValidationError(
        "profile_compatibility_invalid",
        "World expansion planning foundation profileCompatibilityValid must be true."
      );
    }
    if (!framework.validationResult.existingCoastalWorldUnchangedValid) {
      throw createValidationError(
        "coastal_world_changed",
        "World expansion planning foundation existingCoastalWorldUnchangedValid must be true."
      );
    }
    if (!framework.validationResult.cleanupValid) {
      throw createValidationError(
        "cleanup_invalid",
        "World expansion planning foundation cleanupValid must be true."
      );
    }

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      worldExpansionPlanningFoundation: framework
    });
  } catch (error) {
    if (error?.name !== "WorldExpansionPlanningFoundationValidationError") {
      throw error;
    }
    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      worldExpansionPlanningFoundation: null
    });
  }
}

function buildWorldExpansionRegistry({
  definition,
  worldResolver,
  settlementScene,
  overlayFoundation
}) {
  return deepFreeze([
    buildCoastalRegistryEntry({
      definition,
      worldResolver,
      settlementScene,
      overlayFoundation
    }),
    buildPlannedRegistryEntry({
      worldRegionId: "SUBURBAN_WORLD_EXPANSION_REGION_001",
      regionType: "suburban",
      generationProfileId: "suburban_growth_profile_001",
      assetProfileId: "suburban_existing_asset_profile_001",
      terrainType: "suburban_transition",
      seed: "growgo-suburban-expansion-seed-001"
    }),
    buildPlannedRegistryEntry({
      worldRegionId: "RURAL_WORLD_EXPANSION_REGION_001",
      regionType: "rural",
      generationProfileId: "rural_growth_profile_001",
      assetProfileId: "rural_existing_asset_profile_001",
      terrainType: "rural_fields",
      seed: "growgo-rural-expansion-seed-001"
    }),
    buildPlannedRegistryEntry({
      worldRegionId: "URBAN_WORLD_EXPANSION_REGION_001",
      regionType: "urban",
      generationProfileId: "urban_growth_profile_001",
      assetProfileId: "urban_existing_asset_profile_001",
      terrainType: "urban_streets",
      seed: "growgo-urban-expansion-seed-001"
    })
  ]);
}

function buildCoastalRegistryEntry({
  definition,
  worldResolver,
  settlementScene,
  overlayFoundation
}) {
  const assetIds = collectSceneAssetIds(settlementScene);
  const resolverAssetIds = new Set(
    worldResolver.scenePackage.assetInstances
      .map((assetInstance) => assetInstance.assetId)
      .filter((assetId) => assetId !== "GROUND_COASTAL_GRASS_001")
  );
  return deepFreeze({
    worldRegionId: "COASTAL_WORLD_EXPANSION_REGION_001",
    regionType: "coastal",
    bounds: deepFreeze({ ...definition.bounds }),
    generationProfile: deepFreeze({
      generationProfileId: "coastal_first_location_generation_profile_001",
      terrainType: worldResolver.worldLocationResolver.terrainType,
      resolverId: "map-coordinate-world-resolver-foundation",
      settlementGeneratorId: "coastal-settlement-generator-foundation",
      sceneAssemblyId: "map-world-settlement-atlas-scene-expansion",
      deterministicSeed: worldResolver.worldLocationResolver.seed,
      status: "active-first-location"
    }),
    assetProfile: deepFreeze({
      assetProfileId: "coastal_first_location_asset_profile_001",
      contentMode: "existing-coastal-assets-only",
      supportedAssetIds: assetIds,
      poiCategories: deepFreeze([
        "landmark",
        "building",
        "nature",
        "infrastructure"
      ]),
      futureRegionContentEnabled: false
    }),
    validationResult: deepFreeze({
      deterministicRegionOutput: true,
      profileCompatibility:
        settlementScene.worldId === worldResolver.worldLocationResolver.worldId &&
        settlementScene.settlement.seed === worldResolver.worldLocationResolver.seed,
      coastalWorldUnchanged:
        overlayFoundation.worldId === settlementScene.worldId &&
        settlementScene.worldId === worldResolver.worldSummary.worldId &&
        [...resolverAssetIds].every((assetId) => assetIds.includes(assetId)),
      cleanupValid: overlayFoundation.validationResult.cleanupValid === true
    })
  });
}

function buildPlannedRegistryEntry({
  worldRegionId,
  regionType,
  generationProfileId,
  assetProfileId,
  terrainType,
  seed
}) {
  const regionHash = stableHash(
    `${worldRegionId}::${regionType}::${generationProfileId}::${assetProfileId}::${seed}`
  )
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return deepFreeze({
    worldRegionId,
    regionType,
    bounds: deepFreeze({
      minLatitude: null,
      minLongitude: null,
      maxLatitude: null,
      maxLongitude: null,
      minX: 0,
      minY: 0,
      maxX: 960,
      maxY: 640
    }),
    generationProfile: deepFreeze({
      generationProfileId,
      terrainType,
      resolverId: "map-coordinate-world-resolver-foundation",
      settlementGeneratorId: "planned-region-generator",
      sceneAssemblyId: "planned-region-scene-assembly",
      deterministicSeed: seed,
      regionHash,
      status: "planned-passive-profile"
    }),
    assetProfile: deepFreeze({
      assetProfileId,
      contentMode: "existing-asset-profile-planning-only",
      supportedAssetIds: deepFreeze([]),
      poiCategories: deepFreeze([]),
      futureRegionContentEnabled: false
    }),
    validationResult: deepFreeze({
      deterministicRegionOutput: true,
      profileCompatibility: true,
      coastalWorldUnchanged: true,
      cleanupValid: true
    })
  });
}

function buildRegionGenerationPipeline({
  worldResolver,
  settlementScene,
  overlayFoundation,
  activeRegionProfile
}) {
  const availablePoiCategories = deepFreeze([
    ...new Set(
      activeRegionProfile.assetProfile.poiCategories.filter(
        (category) => typeof category === "string" && category.length > 0
      )
    )
  ]);
  return deepFreeze({
    worldResolver,
    worldLocation: deepFreeze({
      ...worldResolver.worldLocationResolver
    }),
    regionProfile: deepFreeze(activeRegionProfile),
    settlementGeneration: deepFreeze({
      generatorId: "coastal-settlement-generator-foundation",
      settlementId: worldResolver.settlement.settlementSummary.settlementId,
      residentialLotCount:
        worldResolver.settlement.settlementSummary.residentialLotCount,
      roadSegmentCount: worldResolver.settlement.settlementSummary.roadSegmentCount,
      generatedAssetCount:
        worldResolver.settlement.settlementSummary.generatedAssetCount,
      mapFixtureDriven: worldResolver.settlement.mapFixtureDriven,
      deterministicOutput:
        worldResolver.settlement.validationResult.deterministicOutput === true
    }),
    sceneAssembly: deepFreeze({
      sceneAssemblyId: "map-world-settlement-atlas-scene-expansion",
      sceneId: settlementScene.sceneId,
      worldId: settlementScene.worldId,
      objectInstanceCount:
        settlementScene.roadInstances.length +
        settlementScene.buildingInstances.length +
        settlementScene.vegetationInstances.length +
        settlementScene.landmarkInstances.length,
      coastlineRelationshipValid:
        settlementScene.validationResult.coastlineRelationshipValid === true,
      deterministicSceneOutputValid:
        settlementScene.validationResult.deterministicSceneOutputValid === true,
      scene: settlementScene
    }),
    poiSystems: deepFreeze({
      overlayId: overlayFoundation.overlayId,
      defaultPoiId: overlayFoundation.poiState.poiId,
      defaultPoiType: overlayFoundation.poiState.poiType,
      defaultPoiCategory: overlayFoundation.poiContentMetadata.category,
      availablePoiCategories,
      detailPreviewState: overlayFoundation.detailState.detailState,
      interactionState: overlayFoundation.interactionState.interactionState,
      discoveryState: overlayFoundation.discoveryState.discoveryState,
      captureState: overlayFoundation.captureState.captureState,
      sessionState: overlayFoundation.sessionExperienceState.sessionState,
      overlayFoundation
    })
  });
}

function buildFrameworkValidationResult({
  worldResolver,
  settlementScene,
  overlayFoundation,
  activeRegionProfile,
  regionGenerationPipeline
}) {
  return deepFreeze({
    deterministicRegionOutputValid:
      activeRegionProfile.validationResult.deterministicRegionOutput === true &&
      worldResolver.validationResult.sameCoordinateSameWorld === true &&
      settlementScene.validationResult.deterministicSceneOutputValid === true,
    profileCompatibilityValid:
      activeRegionProfile.validationResult.profileCompatibility === true &&
      regionGenerationPipeline.regionProfile.regionType === "coastal" &&
      regionGenerationPipeline.sceneAssembly.worldId ===
        regionGenerationPipeline.worldLocation.worldId,
    existingCoastalWorldUnchangedValid:
      activeRegionProfile.validationResult.coastalWorldUnchanged === true &&
      overlayFoundation.worldId === worldResolver.worldSummary.worldId &&
      settlementScene.worldId === worldResolver.worldSummary.worldId,
    cleanupValid:
      activeRegionProfile.validationResult.cleanupValid === true &&
      overlayFoundation.validationResult.cleanupValid === true
  });
}

function validateWorldExpansionRegistryEntry(region) {
  for (const fieldName of worldExpansionRegistryRequiredFields) {
    if (!(fieldName in region)) {
      throw createValidationError(
        "missing_region_field",
        `World expansion registry entry is missing ${fieldName}.`
      );
    }
  }
  if (!supportedRegionTypeSet.has(region.regionType)) {
    throw createValidationError(
      "region_type_invalid",
      `World expansion registry entry regionType ${region.regionType} must be supported.`
    );
  }
  if (!region.validationResult.deterministicRegionOutput) {
    throw createValidationError(
      "region_determinism_invalid",
      `World expansion registry entry ${region.worldRegionId} must remain deterministic.`
    );
  }
  if (!region.validationResult.profileCompatibility) {
    throw createValidationError(
      "region_profile_compatibility_invalid",
      `World expansion registry entry ${region.worldRegionId} must remain profile-compatible.`
    );
  }
  if (!region.validationResult.cleanupValid) {
    throw createValidationError(
      "region_cleanup_invalid",
      `World expansion registry entry ${region.worldRegionId} must preserve cleanup validity.`
    );
  }
}

function normalizeDefinition(rawDefinition) {
  const definition = asPlainObject(
    rawDefinition,
    "worldExpansionPlanningFoundationDefinition"
  );
  return deepFreeze({
    ...mapCoordinateWorldResolverFoundationDefinition,
    ...mapWorldSettlementAtlasSceneExpansionDefinition,
    ...definition,
    bounds: deepFreeze(asPlainObject(definition.bounds, "bounds"))
  });
}

function normalizeFramework(rawFramework) {
  const framework = asPlainObject(
    rawFramework,
    "worldExpansionPlanningFoundation"
  );
  for (const fieldName of worldExpansionPlanningFoundationRequiredFields) {
    if (!(fieldName in framework)) {
      throw createValidationError(
        "missing_required_field",
        `World expansion planning foundation is missing ${fieldName}.`
      );
    }
  }

  return deepFreeze({
    expansionFrameworkId: normalizePermanentId(
      framework.expansionFrameworkId,
      "expansionFrameworkId"
    ),
    activeWorldLocation: deepFreeze(
      asPlainObject(framework.activeWorldLocation, "activeWorldLocation")
    ),
    worldExpansionRegistry: deepFreeze(
      asArray(framework.worldExpansionRegistry, "worldExpansionRegistry").map((region) =>
        deepFreeze(asPlainObject(region, "worldExpansionRegistry[]"))
      )
    ),
    regionGenerationPipeline: deepFreeze(
      asPlainObject(framework.regionGenerationPipeline, "regionGenerationPipeline")
    ),
    validationResult: deepFreeze(
      asPlainObject(framework.validationResult, "validationResult")
    )
  });
}

function collectSceneAssetIds(settlementScene) {
  return deepFreeze(
    [
      ...new Set(
        [
          ...settlementScene.roadInstances,
          ...settlementScene.buildingInstances,
          ...settlementScene.vegetationInstances,
          ...settlementScene.landmarkInstances
        ].map((instance) => instance.assetId)
      )
    ].sort()
  );
}

function createExpansionFrameworkId(worldId, seed) {
  const hash = stableHash(`${worldId}::${seed}`)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
  return `WORLD_EXPANSION_FRAMEWORK_${hash}_001`;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeString(value, fieldName);
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must be a supported permanent ID.`
    );
  }
  return normalized;
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function asPlainObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError("invalid_object", `${fieldName} must be an object.`);
  }
  return value;
}

function asArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createValidationError("invalid_array", `${fieldName} must be an array.`);
  }
  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "WorldExpansionPlanningFoundationValidationError";
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
