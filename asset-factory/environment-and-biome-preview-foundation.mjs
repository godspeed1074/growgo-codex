import {
  buildControlledRealLocationSyntheticPreviewContext,
  controlledRealLocationSyntheticPreviewDefinition,
  validateControlledRealLocationSyntheticPreview
} from "./controlled-real-location-synthetic-preview.mjs";
import { resolveDeterministicAssetSelection } from "./deterministic-asset-resolver.mjs";
import { createDeterministicWorldInstanceId, validateWorldInstanceManagerFoundation } from "./world-instance-manager-foundation.mjs";
import { calculateDeterministicPlacement, createWorldPlacementRuleRegistry, coreWorldPlacementRules } from "./world-placement-rules.mjs";
import { buildStarterAssetFactoryLayers } from "./starter-asset-manifest-pack.mjs";

export const environmentAndBiomePreviewFoundationRequiredFields = Object.freeze([
  "previewFoundationId",
  "locationRequest",
  "biomeRecipes",
  "expectedEnvironmentAssetIds"
]);

export const supportedBiomeAppearanceProfiles = Object.freeze([
  "day",
  "sunset",
  "night"
]);

export const biomePreviewRecipes = deepFreeze([
  createBiomeRecipeDefinition({
    biomeId: "COASTAL_GRASSLAND_RECIPE_001",
    environmentType: "coastal",
    terrainType: "grass",
    moduleReferences: {
      grass: ["GRASS_PATCH_001", "TERRAIN_GRASS_001"],
      trees: ["TREE_EUCALYPTUS_001"],
      rocks: ["ROCK_COASTAL_001"],
      shrubs: ["BUSH_NATIVE_001"],
      paths: ["TRAIL_PATH_SMALL_001"],
      fences: ["FENCE_WOOD_001"],
      parkObjects: ["BENCH_PARK_001"]
    },
    densityRules: {
      vegetationDensity: 0.78,
      rockDensity: 0.35,
      decorationDensity: 0.28
    },
    placementRules: {
      primaryNatureRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      pathRuleId: "PLACEMENT_ROAD_SEGMENT_001",
      decorationRuleId: "PLACEMENT_DECORATION_EDGE_001"
    },
    appearanceProfiles: ["day", "sunset", "night"],
    metadata: {
      biomeRole: "coastal_preview_fill",
      deterministic: true,
      runtimeActivationAuthorized: false
    }
  }),
  createBiomeRecipeDefinition({
    biomeId: "RURAL_FIELD_RECIPE_001",
    environmentType: "rural",
    terrainType: "grass",
    moduleReferences: {
      grass: ["GRASS_PATCH_001", "TERRAIN_GRASS_001"],
      trees: ["TREE_EUCALYPTUS_001", "TREE_NATIVE_SMALL_001"],
      rocks: ["ROCK_COASTAL_001"],
      shrubs: ["BUSH_NATIVE_001"],
      paths: ["TRAIL_PATH_SMALL_001"],
      fences: ["FENCE_WOOD_001"],
      parkObjects: ["BENCH_PARK_001"]
    },
    densityRules: {
      vegetationDensity: 0.84,
      rockDensity: 0.18,
      decorationDensity: 0.12
    },
    placementRules: {
      primaryNatureRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      pathRuleId: "PLACEMENT_ROAD_SEGMENT_001",
      decorationRuleId: "PLACEMENT_DECORATION_EDGE_001"
    },
    appearanceProfiles: ["day", "sunset", "night"],
    metadata: {
      biomeRole: "rural_preview_fill",
      deterministic: true,
      runtimeActivationAuthorized: false
    }
  }),
  createBiomeRecipeDefinition({
    biomeId: "CITY_PARK_RECIPE_001",
    environmentType: "park",
    terrainType: "grass",
    moduleReferences: {
      grass: ["GRASS_PATCH_001", "TERRAIN_GRASS_001"],
      trees: ["TREE_EUCALYPTUS_001", "TREE_NATIVE_SMALL_001"],
      rocks: ["ROCK_COASTAL_001"],
      shrubs: ["BUSH_NATIVE_001"],
      paths: ["FOOTPATH_SMALL_001", "TRAIL_PATH_SMALL_001"],
      fences: ["FENCE_WOOD_001"],
      parkObjects: ["BENCH_PARK_001", "LAMP_POST_BASIC_001"]
    },
    densityRules: {
      vegetationDensity: 0.62,
      rockDensity: 0.1,
      decorationDensity: 0.46
    },
    placementRules: {
      primaryNatureRuleId: "PLACEMENT_NATURE_CLUSTER_001",
      pathRuleId: "PLACEMENT_ROAD_SEGMENT_001",
      decorationRuleId: "PLACEMENT_DECORATION_EDGE_001"
    },
    appearanceProfiles: ["day", "sunset", "night"],
    metadata: {
      biomeRole: "park_preview_fill",
      deterministic: true,
      runtimeActivationAuthorized: false
    }
  })
]);

export const environmentAndBiomePreviewFoundationDefinition = deepFreeze({
  previewFoundationId: "ENVIRONMENT_AND_BIOME_PREVIEW_FOUNDATION_001",
  locationRequest: deepFreeze({
    ...controlledRealLocationSyntheticPreviewDefinition.locationRequest
  }),
  biomeRecipes: biomePreviewRecipes,
  expectedEnvironmentAssetIds: deepFreeze([
    "GRASS_PATCH_001",
    "TREE_EUCALYPTUS_001",
    "ROCK_COASTAL_001",
    "BUSH_NATIVE_001",
    "TRAIL_PATH_SMALL_001",
    "FENCE_WOOD_001",
    "BENCH_PARK_001"
  ])
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;

const biomeResolverTargets = deepFreeze({
  grass: deepFreeze({
    assetCategory: "nature",
    placementRuleKey: "primaryNatureRuleId",
    locationType: "nature_cluster",
    priorityCategory: "environment_objects",
    state: "ready",
    coordinateOffset: { x: 22, y: 1 }
  }),
  trees: deepFreeze({
    assetCategory: "nature",
    placementRuleKey: "primaryNatureRuleId",
    locationType: "nature_cluster",
    priorityCategory: "environment_objects",
    state: "visible",
    coordinateOffset: { x: 26, y: 2 }
  }),
  rocks: deepFreeze({
    assetCategory: "nature",
    placementRuleKey: "primaryNatureRuleId",
    locationType: "nature_cluster",
    priorityCategory: "environment_objects",
    state: "cached",
    coordinateOffset: { x: 30, y: 1 }
  }),
  shrubs: deepFreeze({
    assetCategory: "nature",
    placementRuleKey: "primaryNatureRuleId",
    locationType: "nature_cluster",
    priorityCategory: "environment_objects",
    state: "ready",
    coordinateOffset: { x: 34, y: 1 }
  }),
  paths: deepFreeze({
    assetCategory: "roads",
    placementRuleKey: "pathRuleId",
    locationType: "path_lane",
    priorityCategory: "objectives",
    state: "ready",
    coordinateOffset: { x: 38, y: 0 }
  }),
  fences: deepFreeze({
    assetCategory: "decorations",
    placementRuleKey: "decorationRuleId",
    locationType: "road_edge",
    priorityCategory: "environment_objects",
    state: "cached",
    coordinateOffset: { x: 42, y: 1 }
  }),
  parkObjects: deepFreeze({
    assetCategory: "decorations",
    placementRuleKey: "decorationRuleId",
    locationType: "building_plot",
    priorityCategory: "environment_objects",
    state: "visible",
    coordinateOffset: { x: 46, y: 1 }
  })
});

export function buildEnvironmentAndBiomePreviewFoundationContext() {
  const starterLayers = buildStarterAssetFactoryLayers();

  return Object.freeze({
    starterLayers,
    placementRuleRegistry: createWorldPlacementRuleRegistry(coreWorldPlacementRules),
    previewContext: buildControlledRealLocationSyntheticPreviewContext()
  });
}

export function validateEnvironmentAndBiomePreviewFoundation(
  rawFoundation = environmentAndBiomePreviewFoundationDefinition,
  options = {}
) {
  try {
    const normalizedOptions = normalizeOptions(options);
    const foundation = normalizeFoundation(rawFoundation);

    const previewResult = normalizedOptions.validateControlledRealLocationSyntheticPreview(
      buildPreviewDefinition(foundation.locationRequest),
      { context: normalizedOptions.context.previewContext }
    );
    if (!previewResult.ok) {
      return freezeFailure(previewResult);
    }

    const worldInstanceResult =
      normalizedOptions.validateWorldInstanceManagerFoundation();
    if (!worldInstanceResult.ok) {
      return freezeFailure(worldInstanceResult);
    }

    const normalizedRecipes = normalizeBiomeRecipes(
      foundation.biomeRecipes,
      normalizedOptions.context.starterLayers
    );
    const selectedBiome = selectBiomeRecipe(
      previewResult.previewWorld.locationRequest.environmentType,
      normalizedRecipes
    );
    const environmentModules = buildEnvironmentModules(
      previewResult.previewWorld,
      selectedBiome,
      normalizedOptions.context.starterLayers
    );

    validateExpectedEnvironmentAssetIds(
      foundation.expectedEnvironmentAssetIds,
      environmentModules
    );

    return Object.freeze({
      ok: true,
      errorCode: null,
      message: null,
      environmentBiomePreview: Object.freeze({
        foundationId: foundation.previewFoundationId,
        locationRequest: previewResult.previewWorld.locationRequest,
        previewWorld: previewResult.previewWorld,
        selectedBiome,
        environmentModules,
        validation: Object.freeze({
          biomeSelectionVerified: true,
          deterministicPlacementVerified: true,
          densityRulesVerified: true,
          appearanceProfilesVerified: true,
          placementCompatibilityVerified: true
        }),
        compatibility: Object.freeze({
          passiveOnly: true,
          gpsConnected: false,
          externalMapServicesQueried: false,
          liveWorldObjectsCreated: false,
          rendererModified: false,
          gameplayModified: false,
          firebaseModified: false,
          backendModified: false,
          worldInstanceBenchmarkVerified:
            worldInstanceResult.worldInstanceManager.compatibility
              .deterministicIdentityVerified === true
        })
      })
    });
  } catch (error) {
    if (error?.name !== "EnvironmentAndBiomePreviewFoundationValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      environmentBiomePreview: null
    });
  }
}

function normalizeOptions(options) {
  return Object.freeze({
    context:
      options.context ?? buildEnvironmentAndBiomePreviewFoundationContext(),
    validateControlledRealLocationSyntheticPreview:
      options.validateControlledRealLocationSyntheticPreview ??
      validateControlledRealLocationSyntheticPreview,
    validateWorldInstanceManagerFoundation:
      options.validateWorldInstanceManagerFoundation ??
      validateWorldInstanceManagerFoundation
  });
}

function normalizeFoundation(rawFoundation) {
  const foundation = asPlainObject(
    rawFoundation,
    "environment and biome preview foundation"
  );

  assertRequiredFields(foundation);

  return deepFreeze({
    previewFoundationId: normalizePermanentId(
      foundation.previewFoundationId,
      "previewFoundationId"
    ),
    locationRequest: normalizeLocationRequest(foundation.locationRequest),
    biomeRecipes: normalizeBiomeRecipeArray(foundation.biomeRecipes),
    expectedEnvironmentAssetIds: normalizePermanentIdArray(
      foundation.expectedEnvironmentAssetIds,
      "expectedEnvironmentAssetIds"
    )
  });
}

function normalizeLocationRequest(rawLocationRequest) {
  const locationRequest = asPlainObject(rawLocationRequest, "locationRequest");

  return deepFreeze({
    locationId: normalizePermanentId(
      locationRequest.locationId,
      "locationRequest.locationId"
    ),
    latitude: normalizeFiniteNumber(
      locationRequest.latitude,
      "locationRequest.latitude"
    ),
    longitude: normalizeFiniteNumber(
      locationRequest.longitude,
      "locationRequest.longitude"
    ),
    region: normalizeStringValue(locationRequest.region, "locationRequest.region"),
    environmentType: normalizeStringValue(
      locationRequest.environmentType,
      "locationRequest.environmentType"
    ),
    worldSeed: normalizeStringValue(
      locationRequest.worldSeed,
      "locationRequest.worldSeed"
    )
  });
}

function normalizeBiomeRecipeArray(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_biome_recipe_array",
      "biomeRecipes must be a non-empty array."
    );
  }

  return deepFreeze(value.map((entry, index) => normalizeBiomeRecipe(entry, index)));
}

function normalizeBiomeRecipe(rawRecipe, index = 0) {
  const recipe = asPlainObject(rawRecipe, `biomeRecipes[${index}]`);
  const moduleReferences = asPlainObject(
    recipe.moduleReferences,
    `biomeRecipes[${index}].moduleReferences`
  );
  const densityRules = asPlainObject(
    recipe.densityRules,
    `biomeRecipes[${index}].densityRules`
  );
  const placementRules = asPlainObject(
    recipe.placementRules,
    `biomeRecipes[${index}].placementRules`
  );
  const metadata = asPlainObject(recipe.metadata, `biomeRecipes[${index}].metadata`);

  return deepFreeze({
    biomeId: normalizePermanentId(recipe.biomeId, `biomeRecipes[${index}].biomeId`),
    environmentType: normalizeStringValue(
      recipe.environmentType,
      `biomeRecipes[${index}].environmentType`
    ),
    terrainType: normalizeStringValue(
      recipe.terrainType,
      `biomeRecipes[${index}].terrainType`
    ),
    moduleReferences: deepFreeze({
      grass: normalizePermanentIdArray(
        moduleReferences.grass,
        `biomeRecipes[${index}].moduleReferences.grass`
      ),
      trees: normalizePermanentIdArray(
        moduleReferences.trees,
        `biomeRecipes[${index}].moduleReferences.trees`
      ),
      rocks: normalizePermanentIdArray(
        moduleReferences.rocks,
        `biomeRecipes[${index}].moduleReferences.rocks`
      ),
      shrubs: normalizePermanentIdArray(
        moduleReferences.shrubs,
        `biomeRecipes[${index}].moduleReferences.shrubs`
      ),
      paths: normalizePermanentIdArray(
        moduleReferences.paths,
        `biomeRecipes[${index}].moduleReferences.paths`
      ),
      fences: normalizePermanentIdArray(
        moduleReferences.fences,
        `biomeRecipes[${index}].moduleReferences.fences`
      ),
      parkObjects: normalizePermanentIdArray(
        moduleReferences.parkObjects,
        `biomeRecipes[${index}].moduleReferences.parkObjects`
      )
    }),
    densityRules: deepFreeze({
      vegetationDensity: normalizeDensity(
        densityRules.vegetationDensity,
        `biomeRecipes[${index}].densityRules.vegetationDensity`
      ),
      rockDensity: normalizeDensity(
        densityRules.rockDensity,
        `biomeRecipes[${index}].densityRules.rockDensity`
      ),
      decorationDensity: normalizeDensity(
        densityRules.decorationDensity,
        `biomeRecipes[${index}].densityRules.decorationDensity`
      )
    }),
    placementRules: deepFreeze({
      primaryNatureRuleId: normalizePermanentId(
        placementRules.primaryNatureRuleId,
        `biomeRecipes[${index}].placementRules.primaryNatureRuleId`
      ),
      pathRuleId: normalizePermanentId(
        placementRules.pathRuleId,
        `biomeRecipes[${index}].placementRules.pathRuleId`
      ),
      decorationRuleId: normalizePermanentId(
        placementRules.decorationRuleId,
        `biomeRecipes[${index}].placementRules.decorationRuleId`
      )
    }),
    appearanceProfiles: normalizeAppearanceProfiles(
      recipe.appearanceProfiles,
      `biomeRecipes[${index}].appearanceProfiles`
    ),
    metadata: deepFreeze({
      biomeRole: normalizeStringValue(
        metadata.biomeRole,
        `biomeRecipes[${index}].metadata.biomeRole`
      ),
      deterministic: normalizeBoolean(
        metadata.deterministic,
        `biomeRecipes[${index}].metadata.deterministic`
      ),
      runtimeActivationAuthorized: normalizeBoolean(
        metadata.runtimeActivationAuthorized,
        `biomeRecipes[${index}].metadata.runtimeActivationAuthorized`
      )
    })
  });
}

function normalizeBiomeRecipes(recipes, starterLayers) {
  const seenBiomeIds = new Set();

  return recipes.map((recipe) => {
    if (seenBiomeIds.has(recipe.biomeId)) {
      throw createValidationError(
        "duplicate_biome_id",
        `Biome recipe ${recipe.biomeId} is duplicated.`
      );
    }
    seenBiomeIds.add(recipe.biomeId);

    validateBiomeRecipeDependencies(recipe, starterLayers);
    return recipe;
  });
}

function validateBiomeRecipeDependencies(recipe, starterLayers) {
  for (const assetIds of Object.values(recipe.moduleReferences)) {
    for (const assetId of assetIds) {
      const asset = starterLayers.assetRegistry.findAssetById(assetId);
      if (!asset || !starterLayers.assetRegistry.isAssetAvailable(assetId)) {
        throw createValidationError(
          "missing_biome_asset",
          `Biome recipe ${recipe.biomeId} references unavailable asset ${assetId}.`
        );
      }

      const manifest = starterLayers.manifestRegistry.findManifestByAssetId(assetId);
      if (!manifest || !starterLayers.manifestRegistry.isManifestAvailable(assetId)) {
        throw createValidationError(
          "missing_biome_manifest",
          `Biome recipe ${recipe.biomeId} references unavailable manifest ${assetId}.`
        );
      }
    }
  }

  for (const ruleId of Object.values(recipe.placementRules)) {
    if (!coreWorldPlacementRules.find((rule) => rule.placementRuleId === ruleId)) {
      throw createValidationError(
        "missing_biome_placement_rule",
        `Biome recipe ${recipe.biomeId} references unknown placement rule ${ruleId}.`
      );
    }
  }

  if (recipe.metadata.runtimeActivationAuthorized) {
    throw createValidationError(
      "runtime_activation_not_allowed",
      `Biome recipe ${recipe.biomeId} must remain runtime-inactive.`
    );
  }
}

function selectBiomeRecipe(environmentType, normalizedRecipes) {
  const recipe = normalizedRecipes.find(
    (entry) => entry.environmentType === environmentType
  );

  if (!recipe) {
    throw createValidationError(
      "missing_biome_recipe",
      `No biome recipe is defined for environment type ${environmentType}.`
    );
  }

  return recipe;
}

function buildEnvironmentModules(previewWorld, biomeRecipe, starterLayers) {
  const assetGroups = [
    "grass",
    "trees",
    "rocks",
    "shrubs",
    "paths",
    "fences",
    "parkObjects"
  ];

  return deepFreeze(
    assetGroups.map((groupName, index) =>
      buildEnvironmentModule(
        groupName,
        biomeRecipe.moduleReferences[groupName],
        biomeRecipe,
        previewWorld,
        starterLayers,
        index
      )
    )
  );
}

function buildEnvironmentModule(
  groupName,
  availableAssetReferences,
  biomeRecipe,
  previewWorld,
  starterLayers,
  index
) {
  const target = biomeResolverTargets[groupName];
  const selection = resolveDeterministicAssetSelection(
    {
      locationId: `${previewWorld.locationRequest.locationId}_${biomeRecipe.biomeId}_${groupName}`,
      coordinates: {
        x:
          previewWorld.locationRequest.latitude + target.coordinateOffset.x,
        y:
          previewWorld.locationRequest.longitude + target.coordinateOffset.y
      },
      seed: previewWorld.locationRequest.worldSeed,
      assetCategory: target.assetCategory,
      assetType: null,
      availableAssetReferences,
      resolverRules: {
        variantPolicy: "seeded-index",
        variantOffset: index
      }
    },
    starterLayers
  );

  if (!selection.ok) {
    throw createValidationError(
      selection.errorCode ?? "biome_asset_selection_failed",
      selection.message ??
        `Biome asset selection for ${groupName} failed.`
    );
  }

  const placementRuleId = biomeRecipe.placementRules[target.placementRuleKey];
  const locationId = `${previewWorld.locationRequest.locationId}_${groupName.toUpperCase()}_MODULE_001`;
  const coordinates = {
    x: Number(
      (previewWorld.locationRequest.latitude + target.coordinateOffset.x).toFixed(6)
    ),
    y: Number(
      (previewWorld.locationRequest.longitude + target.coordinateOffset.y).toFixed(6)
    )
  };

  const placement = calculateDeterministicPlacement(
    {
      placementRuleId,
      assetId: selection.selectedAsset.assetId,
      locationId,
      coordinates,
      seed: `${previewWorld.locationRequest.worldSeed}::${biomeRecipe.biomeId}::${groupName}`,
      terrainType: biomeRecipe.terrainType,
      locationType: target.locationType
    },
    {
      assetRegistry: starterLayers.assetRegistry,
      manifestRegistry: starterLayers.manifestRegistry,
      placementRuleRegistry: createWorldPlacementRuleRegistry(coreWorldPlacementRules)
    }
  );

  if (!placement.ok) {
    throw createValidationError(
      placement.errorCode ?? "biome_placement_failed",
      placement.message ?? `Biome placement for ${groupName} failed.`
    );
  }

  return deepFreeze({
    moduleGroup: groupName,
    biomeId: biomeRecipe.biomeId,
    assetId: selection.selectedAsset.assetId,
    instanceId: createDeterministicWorldInstanceId({
      locationId,
      assetId: selection.selectedAsset.assetId,
      worldSeed: `${previewWorld.locationRequest.worldSeed}::${biomeRecipe.biomeId}`
    }).instanceId,
    density: densityForGroup(groupName, biomeRecipe.densityRules),
    appearanceProfiles: biomeRecipe.appearanceProfiles,
    placementResult: placement.deterministicPlacement,
    compatibility: Object.freeze({
      deterministic: true,
      passiveOnly: true,
      liveRuntimeEnabled: false,
      rendererActivationRequired: false
    })
  });
}

function densityForGroup(groupName, densityRules) {
  if (["grass", "trees", "shrubs"].includes(groupName)) {
    return densityRules.vegetationDensity;
  }
  if (groupName === "rocks") {
    return densityRules.rockDensity;
  }
  return densityRules.decorationDensity;
}

function validateExpectedEnvironmentAssetIds(expectedAssetIds, environmentModules) {
  const actualAssetIds = environmentModules.map((entry) => entry.assetId);
  if (!areArraysEqual(expectedAssetIds, actualAssetIds)) {
    throw createValidationError(
      "environment_asset_mismatch",
      "Environment biome preview output does not match the expected deterministic asset set."
    );
  }
}

function buildPreviewDefinition(locationRequest) {
  return deepFreeze({
    ...controlledRealLocationSyntheticPreviewDefinition,
    locationRequest: deepFreeze({ ...locationRequest })
  });
}

function createBiomeRecipeDefinition(definition) {
  return deepFreeze(definition);
}

function normalizeAppearanceProfiles(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_appearance_profiles",
      `${fieldName} must be a non-empty array.`
    );
  }

  return deepFreeze(
    value.map((entry, index) => {
      const normalized = normalizeStringValue(entry, `${fieldName}[${index}]`);
      if (!supportedBiomeAppearanceProfiles.includes(normalized)) {
        throw createValidationError(
          "unsupported_appearance_profile",
          `${fieldName}[${index}] must be one of ${supportedBiomeAppearanceProfiles.join(", ")}.`
        );
      }
      return normalized;
    })
  );
}

function normalizeDensity(value, fieldName) {
  const normalized = normalizeFiniteNumber(value, fieldName);
  if (normalized < 0 || normalized > 1) {
    throw createValidationError(
      "invalid_density",
      `${fieldName} must be between 0 and 1.`
    );
  }

  return normalized;
}

function assertRequiredFields(foundation) {
  for (const fieldName of environmentAndBiomePreviewFoundationRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(foundation, fieldName)) {
      throw createValidationError(
        "missing_required_field",
        `Environment and biome preview foundation is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createValidationError(
      "invalid_permanent_id_array",
      `${fieldName} must be a non-empty array of permanent IDs.`
    );
  }

  return deepFreeze(
    value.map((entry, index) =>
      normalizePermanentId(entry, `${fieldName}[${index}]`)
    )
  );
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createValidationError(
      "invalid_permanent_id",
      `${fieldName} must use the approved permanent ID format.`
    );
  }

  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createValidationError(
      "invalid_string",
      `${fieldName} must be a non-empty string.`
    );
  }

  return value.trim();
}

function normalizeFiniteNumber(value, fieldName) {
  if (!Number.isFinite(value)) {
    throw createValidationError(
      "invalid_number",
      `${fieldName} must be a finite number.`
    );
  }

  return Number(value);
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createValidationError(
      "invalid_boolean",
      `${fieldName} must be a boolean.`
    );
  }

  return value;
}

function freezeFailure(result) {
  return Object.freeze({
    ok: false,
    errorCode: result.errorCode ?? "upstream_validation_failed",
    message: result.message ?? "Upstream validation failed.",
    environmentBiomePreview: null
  });
}

function areArraysEqual(first, second) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((entry, index) => entry === second[index]);
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createValidationError(
      "invalid_object",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createValidationError(code, message) {
  const error = new Error(message);
  error.name = "EnvironmentAndBiomePreviewFoundationValidationError";
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
