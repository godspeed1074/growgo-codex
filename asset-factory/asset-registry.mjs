export const assetFactoryCategories = Object.freeze([
  "buildings",
  "terrain",
  "roads",
  "rail",
  "nature",
  "landmarks",
  "npcs",
  "animals",
  "vehicles",
  "decorations",
  "seasonal_assets"
]);

export const assetRegistryStatuses = Object.freeze([
  "draft",
  "validated",
  "deprecated",
  "retired",
  "blocked"
]);

export const assetRegistryRequiredFields = Object.freeze([
  "assetId",
  "category",
  "version",
  "status",
  "components",
  "tags",
  "metadata"
]);

const assetIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export const assetFactoryRegistryLayerSchemaId = "ASSET_FACTORY_REGISTRY_LAYER_001";
export const assetRegistryValidationSchemaId = "ASSET_REGISTRY_VALIDATION_001";
export const natureAssetPackSchemaId = "NATURE_ASSET_PACK_001";
export const natureAssetPackValidationSchemaId = "NATURE_ASSET_PACK_VALIDATION_001";
export const civicAssetPackSchemaId = "CIVIC_ASSET_PACK_001";
export const civicAssetPackValidationSchemaId = "CIVIC_ASSET_PACK_VALIDATION_001";

export const assetFactoryRecordRequiredFields = Object.freeze([
  "assetId",
  "assetFamily",
  "assetType",
  "recipeId",
  "version",
  "lodRules",
  "usageRules",
  "atlasCompatibility"
]);

export const atlasCompatibleRecipeIds = Object.freeze([
  "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001",
  "BUILDING_SHOP_GENERAL_RECIPE_001",
  "RECIPE_BUILDING_BAKERY_SMALL_TOWN_001",
  "RECIPE_BUILDING_CAFE_COASTAL_001",
  "RECIPE_BUILDING_FUEL_STATION_STANDARD_001",
  "SCHOOL_RECIPE_001",
  "LIBRARY_RECIPE_001",
  "COMMUNITY_BUILDING_RECIPE_001",
  "SPORTS_OVAL_RECIPE_001",
  "RECREATION_AREA_RECIPE_001",
  "RECIPE_NATURE_PARK_STANDARD_001",
  "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001",
  "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
  "RECIPE_NATURE_FOREST_ENVIRONMENT_STANDARD_001"
]);

export const onboardedExistingAssetRecords = deepFreeze([
  deepFreeze({
    assetId: "BUILDING_RESIDENTIAL_SUBURBAN_001",
    assetFamily: "FAMILY_BUILDING_RESIDENTIAL_HOUSE",
    assetType: "RESIDENTIAL_HOUSE",
    recipeId: "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "suburban_residential",
      "detached_house_only",
      "atlas_residential_assignment"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["HOUSE"]),
      supportedClassifications: deepFreeze(["RESIDENTIAL"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001"
      ]),
      assignmentMode: "direct_recipe_match"
    }),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["BUILDING_HOUSE_SUBURBAN_BRICK_001"]),
      sourceRecipeReferences: deepFreeze(["RECIPE_HOUSE_SUBURBAN_BRICK_001"]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_110_EXISTING_ASSET_ONBOARDING"
    })
  }),
  deepFreeze({
    assetId: "BUILDING_COMMERCIAL_SMALL_SHOP_001",
    assetFamily: "FAMILY_BUILDING_COMMERCIAL_SMALL_SHOP",
    assetType: "SMALL_SHOP",
    recipeId: "BUILDING_SHOP_GENERAL_RECIPE_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "small_town_commercial",
      "shopfront_only",
      "atlas_business_assignment"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["SHOP", "BAKERY", "CAFE"]),
      supportedClassifications: deepFreeze(["BUSINESS"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "BUILDING_SHOP_GENERAL_RECIPE_001",
        "RECIPE_BUILDING_BAKERY_SMALL_TOWN_001",
        "RECIPE_BUILDING_CAFE_COASTAL_001"
      ]),
      assignmentMode: "recipe_or_business_fallback"
    }),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze([
        "BUILDING_SHOP_GENERAL_001",
        "BUILDING_BAKERY_SMALL_TOWN_001",
        "BUILDING_CAFE_COASTAL_001"
      ]),
      sourceRecipeReferences: deepFreeze([
        "BUILDING_SHOP_GENERAL_RECIPE_001",
        "RECIPE_BAKERY_SMALL_TOWN_001",
        "RECIPE_CAFE_COASTAL_001"
      ]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_110_EXISTING_ASSET_ONBOARDING"
    })
  })
]);

export const natureAssetPackRecipes = deepFreeze([
  deepFreeze({
    recipeId: "RECIPE_NATURE_PARK_STANDARD_001",
    recipeType: "PARK_NATURE_RECIPE",
    supportedFamilies: deepFreeze([
      "TREE_ASSET_FAMILY_001",
      "GROUND_ASSET_FAMILY_001",
      "VEGETATION_ASSET_FAMILY_001"
    ])
  }),
  deepFreeze({
    recipeId: "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001",
    recipeType: "SUBURBAN_GARDEN_RECIPE",
    supportedFamilies: deepFreeze([
      "TREE_ASSET_FAMILY_001",
      "VEGETATION_ASSET_FAMILY_001",
      "GROUND_ASSET_FAMILY_001"
    ])
  }),
  deepFreeze({
    recipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
    recipeType: "COASTAL_ENVIRONMENT_RECIPE",
    supportedFamilies: deepFreeze([
      "TREE_ASSET_FAMILY_001",
      "GROUND_ASSET_FAMILY_001",
      "TERRAIN_FEATURE_ASSET_FAMILY_001"
    ])
  }),
  deepFreeze({
    recipeId: "RECIPE_NATURE_FOREST_ENVIRONMENT_STANDARD_001",
    recipeType: "FOREST_ENVIRONMENT_RECIPE",
    supportedFamilies: deepFreeze([
      "TREE_ASSET_FAMILY_001",
      "VEGETATION_ASSET_FAMILY_001",
      "GROUND_ASSET_FAMILY_001"
    ])
  })
]);

export const natureAssetPackRecords = deepFreeze([
  deepFreeze({
    assetId: "TREE_EUCALYPTUS_001",
    assetFamily: "TREE_ASSET_FAMILY_001",
    assetType: "COASTAL_TREE",
    recipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
    version: "1.0.0",
    lodRules: deepFreeze([
      "LOD_CLOSE",
      "LOD_GAMEPLAY",
      "LOD_MAP",
      "LOD_DISTANT_SILHOUETTE"
    ]),
    usageRules: deepFreeze([
      "coastal_environment_cluster",
      "park_edge_tree",
      "street_tree_candidate",
      "forest_transition_tree"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["TREE", "PARK", "FOREST_EDGE"]),
      supportedClassifications: deepFreeze(["NATURAL_FEATURE", "PARK"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
        "RECIPE_NATURE_PARK_STANDARD_001",
        "RECIPE_NATURE_FOREST_ENVIRONMENT_STANDARD_001"
      ]),
      assignmentMode: "biome_and_context_match"
    }),
    biomeCompatibility: deepFreeze([
      "COASTAL",
      "SUBURBAN_PARKLAND",
      "FOREST_EDGE",
      "URBAN_STREET"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["TREE_EUCALYPTUS_001"]),
      sourceRecipeReferences: deepFreeze(["TREE_EUCALYPTUS_RECIPE_001"]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_111_NATURE_PACK_FOUNDATION"
    })
  }),
  deepFreeze({
    assetId: "TREE_COASTAL_001",
    assetFamily: "TREE_ASSET_FAMILY_001",
    assetType: "NATIVE_TREE",
    recipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
    version: "1.0.0",
    lodRules: deepFreeze([
      "LOD_CLOSE",
      "LOD_GAMEPLAY",
      "LOD_MAP",
      "LOD_DISTANT_SILHOUETTE"
    ]),
    usageRules: deepFreeze([
      "coastal_street_tree",
      "foreshore_tree_cluster",
      "suburban_coastal_tree"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["TREE", "PARK", "STREET_TREE"]),
      supportedClassifications: deepFreeze(["NATURAL_FEATURE", "PARK"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
        "RECIPE_NATURE_PARK_STANDARD_001"
      ]),
      assignmentMode: "biome_and_context_match"
    }),
    biomeCompatibility: deepFreeze([
      "COASTAL",
      "FORESHORE_PARKLAND",
      "SUBURBAN_PARKLAND",
      "URBAN_STREET"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["TREE_EUCALYPTUS_001"]),
      sourceRecipeReferences: deepFreeze([
        "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001"
      ]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_112_NATURE_ASSET_CREATION_PASS"
    })
  }),
  deepFreeze({
    assetId: "GROUND_COASTAL_GRASS_001",
    assetFamily: "GROUND_ASSET_FAMILY_001",
    assetType: "COASTAL_GROUND",
    recipeId: "RECIPE_NATURE_PARK_STANDARD_001",
    version: "1.0.0",
    lodRules: deepFreeze([
      "LOD_CLOSE",
      "LOD_GAMEPLAY",
      "LOD_MAP",
      "LOD_DISTANT_SILHOUETTE"
    ]),
    usageRules: deepFreeze([
      "park_ground_cover",
      "suburban_verge_ground",
      "coastal_ground_transition"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["PARK", "GROUND_COVER", "VERGE"]),
      supportedClassifications: deepFreeze(["PARK", "NATURAL_FEATURE"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "RECIPE_NATURE_PARK_STANDARD_001",
        "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001",
        "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001"
      ]),
      assignmentMode: "ground_context_match"
    }),
    biomeCompatibility: deepFreeze([
      "COASTAL",
      "SUBURBAN_PARKLAND",
      "TEMPERATE_GRASSLAND"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["GROUND_COASTAL_GRASS_001"]),
      sourceRecipeReferences: deepFreeze(["GROUND_COASTAL_GRASS_RECIPE_001"]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_111_NATURE_PACK_FOUNDATION"
    })
  }),
  deepFreeze({
    assetId: "BUSH_NATIVE_001",
    assetFamily: "VEGETATION_ASSET_FAMILY_001",
    assetType: "NATIVE_BUSH",
    recipeId: "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "suburban_garden_fill",
      "park_border_vegetation",
      "coastal_shrub_cluster"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["BUSH", "GARDEN", "PARK"]),
      supportedClassifications: deepFreeze(["NATURAL_FEATURE", "PARK"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001",
        "RECIPE_NATURE_PARK_STANDARD_001",
        "RECIPE_NATURE_FOREST_ENVIRONMENT_STANDARD_001"
      ]),
      assignmentMode: "vegetation_context_match"
    }),
    biomeCompatibility: deepFreeze([
      "SUBURBAN_GARDEN",
      "COASTAL",
      "TEMPERATE_FOREST_EDGE"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["BUSH_NATIVE_001"]),
      sourceRecipeReferences: deepFreeze(["BUSH_NATIVE_RECIPE_001"]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_111_NATURE_PACK_FOUNDATION"
    })
  }),
  deepFreeze({
    assetId: "ROCK_COASTAL_001",
    assetFamily: "TERRAIN_FEATURE_ASSET_FAMILY_001",
    assetType: "COASTAL_ROCK_FEATURE",
    recipeId: "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "cliff_edge_feature",
      "beach_edge_feature",
      "riverbank_or_coastal_marker"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["CLIFF_EDGE", "ROCK", "BEACH_EDGE", "RIVER_EDGE"]),
      supportedClassifications: deepFreeze(["NATURAL_FEATURE"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001"
      ]),
      assignmentMode: "terrain_feature_context_match"
    }),
    biomeCompatibility: deepFreeze([
      "COASTAL",
      "RIVER_CORRIDOR",
      "CLIFF_EDGE"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["ROCK_COASTAL_001"]),
      sourceRecipeReferences: deepFreeze(["RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001"]),
      existingWorkPreserved: true,
      onboardingSource: "SESSION_111_NATURE_PACK_FOUNDATION"
    })
  })
]);

export const civicAssetPackRecipes = deepFreeze([
  deepFreeze({
    recipeId: "SCHOOL_RECIPE_001",
    recipeType: "SCHOOL_CIVIC_RECIPE",
    supportedFamilies: deepFreeze(["SCHOOL_ASSET_FAMILY_001"])
  }),
  deepFreeze({
    recipeId: "LIBRARY_RECIPE_001",
    recipeType: "LIBRARY_CIVIC_RECIPE",
    supportedFamilies: deepFreeze(["LIBRARY_ASSET_FAMILY_001"])
  }),
  deepFreeze({
    recipeId: "COMMUNITY_BUILDING_RECIPE_001",
    recipeType: "COMMUNITY_CIVIC_RECIPE",
    supportedFamilies: deepFreeze(["COMMUNITY_BUILDING_ASSET_FAMILY_001"])
  }),
  deepFreeze({
    recipeId: "SPORTS_FACILITY_RECIPE_001",
    recipeType: "SPORTS_FACILITY_CIVIC_RECIPE",
    supportedFamilies: deepFreeze(["SPORTS_FACILITY_ASSET_FAMILY_001"])
  })
]);

export const civicAssetPackRecords = deepFreeze([
  deepFreeze({
    assetId: "BUILDING_CIVIC_SCHOOL_PRIMARY_001",
    assetFamily: "SCHOOL_ASSET_FAMILY_001",
    assetType: "PRIMARY_SCHOOL",
    recipeId: "SCHOOL_RECIPE_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "suburban_primary_school",
      "civic_anchor",
      "atlas_civic_assignment"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["SCHOOL"]),
      supportedClassifications: deepFreeze(["BUSINESS"]),
      atlasAssignmentRecipeIds: deepFreeze(["SCHOOL_RECIPE_001"]),
      assignmentMode: "direct_civic_recipe_match"
    }),
    footprintCompatibility: deepFreeze([
      "CAMPUS_FOOTPRINT",
      "SUBURBAN_BLOCK_EDGE",
      "CORNER_LOT_CIVIC"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["BUILDING_CIVIC_SCHOOL_PRIMARY_001"]),
      sourceRecipeReferences: deepFreeze(["SCHOOL_RECIPE_001"]),
      existingWorkPreserved: false,
      onboardingSource: "SESSION_137_CIVIC_ASSET_PACK_FOUNDATION",
      supportedVariants: deepFreeze(["primary_school", "secondary_school", "small_rural_school"])
    })
  }),
  deepFreeze({
    assetId: "BUILDING_CIVIC_LIBRARY_SMALL_001",
    assetFamily: "LIBRARY_ASSET_FAMILY_001",
    assetType: "SMALL_LIBRARY",
    recipeId: "LIBRARY_RECIPE_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "small_town_library",
      "community_library",
      "atlas_civic_assignment"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["LIBRARY"]),
      supportedClassifications: deepFreeze(["BUSINESS"]),
      atlasAssignmentRecipeIds: deepFreeze(["LIBRARY_RECIPE_001"]),
      assignmentMode: "direct_civic_recipe_match"
    }),
    footprintCompatibility: deepFreeze([
      "MAIN_STREET_CIVIC_FRONTAGE",
      "COMMUNITY_CLUSTER_FOOTPRINT"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["BUILDING_CIVIC_LIBRARY_SMALL_001"]),
      sourceRecipeReferences: deepFreeze(["LIBRARY_RECIPE_001"]),
      existingWorkPreserved: false,
      onboardingSource: "SESSION_137_CIVIC_ASSET_PACK_FOUNDATION",
      supportedVariants: deepFreeze(["small_library", "community_library"])
    })
  }),
  deepFreeze({
    assetId: "BUILDING_CIVIC_COMMUNITY_HALL_001",
    assetFamily: "COMMUNITY_BUILDING_ASSET_FAMILY_001",
    assetType: "COMMUNITY_HALL",
    recipeId: "COMMUNITY_BUILDING_RECIPE_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "community_hall",
      "civic_centre",
      "atlas_civic_assignment"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["COMMUNITY_BUILDING"]),
      supportedClassifications: deepFreeze(["BUSINESS"]),
      atlasAssignmentRecipeIds: deepFreeze(["COMMUNITY_BUILDING_RECIPE_001"]),
      assignmentMode: "direct_civic_recipe_match"
    }),
    footprintCompatibility: deepFreeze([
      "PUBLIC_FRONTAGE_FOOTPRINT",
      "CIVIC_CLUSTER_FOOTPRINT"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["BUILDING_CIVIC_COMMUNITY_HALL_001"]),
      sourceRecipeReferences: deepFreeze(["COMMUNITY_BUILDING_RECIPE_001"]),
      existingWorkPreserved: false,
      onboardingSource: "SESSION_137_CIVIC_ASSET_PACK_FOUNDATION",
      supportedVariants: deepFreeze(["community_hall", "civic_centre"])
    })
  }),
  deepFreeze({
    assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
    assetFamily: "SPORTS_FACILITY_ASSET_FAMILY_001",
    assetType: "SPORTS_PAVILION",
    recipeId: "SPORTS_FACILITY_RECIPE_001",
    version: "1.0.0",
    lodRules: deepFreeze(["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]),
    usageRules: deepFreeze([
      "sports_ground_support",
      "recreation_building",
      "atlas_civic_assignment"
    ]),
    atlasCompatibility: deepFreeze({
      atlasCompatible: true,
      supportedObjectTypes: deepFreeze(["OVAL", "RECREATION_AREA"]),
      supportedClassifications: deepFreeze(["PARK"]),
      atlasAssignmentRecipeIds: deepFreeze([
        "SPORTS_OVAL_RECIPE_001",
        "RECREATION_AREA_RECIPE_001"
      ]),
      assignmentMode: "sports_support_recipe_bridge"
    }),
    footprintCompatibility: deepFreeze([
      "SPORTS_EDGE_FOOTPRINT",
      "OPEN_SPACE_SUPPORT_FOOTPRINT"
    ]),
    metadata: deepFreeze({
      sourceAssetReferences: deepFreeze(["BUILDING_CIVIC_SPORTS_PAVILION_001"]),
      sourceRecipeReferences: deepFreeze([
        "SPORTS_FACILITY_RECIPE_001",
        "SPORTS_OVAL_RECIPE_001",
        "RECREATION_AREA_RECIPE_001"
      ]),
      existingWorkPreserved: false,
      onboardingSource: "SESSION_137_CIVIC_ASSET_PACK_FOUNDATION",
      supportedVariants: deepFreeze([
        "sports_pavilion",
        "changing_rooms",
        "recreation_building"
      ])
    })
  })
]);

export const defaultAssetFactoryRecords = deepFreeze([
  ...onboardedExistingAssetRecords,
  ...natureAssetPackRecords,
  ...civicAssetPackRecords
]);

export function createAssetRegistry(initialAssets = []) {
  const assetMap = new Map();

  for (const asset of initialAssets) {
    addAsset(asset);
  }

  return Object.freeze({
    addAsset,
    hasAsset(assetId) {
      return assetMap.has(normalizeAssetIdInput(assetId));
    },
    findAssetById(assetId) {
      const record = assetMap.get(normalizeAssetIdInput(assetId));
      return record ?? null;
    },
    getAssetMetadata(assetId) {
      const record = assetMap.get(normalizeAssetIdInput(assetId));
      return record ? record.metadata : null;
    },
    getAssetComponentDependencies(assetId) {
      const record = assetMap.get(normalizeAssetIdInput(assetId));
      return record ? record.components : null;
    },
    isAssetAvailable(assetId) {
      const record = assetMap.get(normalizeAssetIdInput(assetId));
      return record ? record.status === "validated" : false;
    },
    listAssets() {
      return Array.from(assetMap.values());
    },
    listAssetIds() {
      return Array.from(assetMap.keys());
    },
    size() {
      return assetMap.size;
    }
  });

  function addAsset(rawAsset) {
    const normalizedAsset = normalizeAssetRecord(rawAsset);
    const duplicate = assetMap.get(normalizedAsset.assetId);

    if (duplicate) {
      throw createAssetRegistryValidationError(
        "duplicate_asset_id",
        `Asset ID ${normalizedAsset.assetId} already exists in the registry.`
      );
    }

    assetMap.set(normalizedAsset.assetId, normalizedAsset);
    return normalizedAsset;
  }
}

export function validateAssetRecord(rawAsset, options = {}) {
  try {
    const normalizedAsset = normalizeAssetRecord(rawAsset, options);
    return Object.freeze({
      ok: true,
      normalizedAsset,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "AssetRegistryValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedAsset: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

export function createAssetFactoryRegistryLayer(
  initialAssets = defaultAssetFactoryRecords
) {
  const records = normalizeAssetFactoryRecords(initialAssets);
  const registryByAssetId = new Map(records.map((record) => [record.assetId, record]));
  const registryByRecipeId = new Map(records.map((record) => [record.recipeId, record]));
  const validation = buildAssetFactoryRegistryValidation(records);

  const layer = deepFreeze({
    schemaId: assetFactoryRegistryLayerSchemaId,
    registryId: "ASSET_FACTORY_REGISTRY_LAYER_001_DEFAULT",
    records,
    validation,
    getAssetById(assetId) {
      return registryByAssetId.get(normalizeAssetIdInput(assetId)) ?? null;
    },
    getAssetByRecipeId(recipeId) {
      return registryByRecipeId.get(normalizeStringValue(recipeId, "recipeId")) ?? null;
    },
    listAssetsByFamily(assetFamily) {
      const normalizedAssetFamily = normalizeStringValue(assetFamily, "assetFamily");
      return records.filter((record) => record.assetFamily === normalizedAssetFamily);
    },
    resolveAssetForAtlasAssignment(rawAssignment) {
      const assignment = normalizeAtlasAssignment(rawAssignment);
      const directMatch = registryByRecipeId.get(assignment.recipeId);
      if (directMatch) {
        return directMatch;
      }

      return (
        records.find((record) => isRecordCompatibleWithAtlasAssignment(record, assignment)) ??
        null
      );
    }
  });

  const checked = validateAssetFactoryRegistryLayer(layer);
  if (!checked.ok) {
    throw createAssetRegistryValidationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function createNatureAssetPack(initialAssets = natureAssetPackRecords) {
  const records = normalizeAssetFactoryRecords(initialAssets);
  const recipes = natureAssetPackRecipes;
  const validation = buildNatureAssetPackValidation(records, recipes);
  const recipeMap = new Map(recipes.map((recipe) => [recipe.recipeId, recipe]));
  const assetMap = new Map(records.map((record) => [record.assetId, record]));

  const pack = deepFreeze({
    schemaId: natureAssetPackSchemaId,
    packId: "NATURE_ASSET_PACK_001_DEFAULT",
    assetFamilies: deepFreeze([
      "TREE_ASSET_FAMILY_001",
      "GROUND_ASSET_FAMILY_001",
      "VEGETATION_ASSET_FAMILY_001",
      "TERRAIN_FEATURE_ASSET_FAMILY_001"
    ]),
    recipes,
    assets: records,
    validation,
    getAssetById(assetId) {
      return assetMap.get(normalizeAssetIdInput(assetId)) ?? null;
    },
    getAssetsByFamily(assetFamily) {
      const normalizedAssetFamily = normalizeStringValue(assetFamily, "assetFamily");
      return records.filter((record) => record.assetFamily === normalizedAssetFamily);
    },
    getRecipe(recipeId) {
      return recipeMap.get(normalizeStringValue(recipeId, "recipeId")) ?? null;
    }
  });

  const checked = validateNatureAssetPack(pack);
  if (!checked.ok) {
    throw createAssetRegistryValidationError(checked.errorCode, checked.message);
  }

  return pack;
}

export function createCivicAssetPack(initialAssets = civicAssetPackRecords) {
  const records = normalizeAssetFactoryRecords(initialAssets);
  const recipes = civicAssetPackRecipes;
  const validation = buildCivicAssetPackValidation(records, recipes);
  const recipeMap = new Map(recipes.map((recipe) => [recipe.recipeId, recipe]));
  const assetMap = new Map(records.map((record) => [record.assetId, record]));

  const pack = deepFreeze({
    schemaId: civicAssetPackSchemaId,
    packId: "CIVIC_ASSET_PACK_001_DEFAULT",
    assetFamilies: deepFreeze([
      "SCHOOL_ASSET_FAMILY_001",
      "LIBRARY_ASSET_FAMILY_001",
      "COMMUNITY_BUILDING_ASSET_FAMILY_001",
      "SPORTS_FACILITY_ASSET_FAMILY_001"
    ]),
    recipes,
    assets: records,
    validation,
    getAssetById(assetId) {
      return assetMap.get(normalizeAssetIdInput(assetId)) ?? null;
    },
    getAssetsByFamily(assetFamily) {
      const normalizedAssetFamily = normalizeStringValue(assetFamily, "assetFamily");
      return records.filter((record) => record.assetFamily === normalizedAssetFamily);
    },
    getRecipe(recipeId) {
      return recipeMap.get(normalizeStringValue(recipeId, "recipeId")) ?? null;
    }
  });

  const checked = validateCivicAssetPack(pack);
  if (!checked.ok) {
    throw createAssetRegistryValidationError(checked.errorCode, checked.message);
  }

  return pack;
}

export function validateNatureAssetPack(rawPack) {
  try {
    if (rawPack?.schemaId !== natureAssetPackSchemaId) {
      throw createAssetRegistryValidationError(
        "invalid_nature_asset_pack_schema",
        `Expected ${natureAssetPackSchemaId} but received ${rawPack?.schemaId}.`
      );
    }

    const records = normalizeAssetFactoryRecords(rawPack.assets);
    if (!Array.isArray(rawPack.recipes) || rawPack.recipes.length === 0) {
      throw createAssetRegistryValidationError(
        "invalid_nature_asset_pack_recipes",
        "Nature asset pack must expose a non-empty recipes array."
      );
    }

    if (rawPack.validation?.schemaId !== natureAssetPackValidationSchemaId) {
      throw createAssetRegistryValidationError(
        "invalid_nature_asset_pack_validation_schema",
        `Expected ${natureAssetPackValidationSchemaId} but received ${rawPack.validation?.schemaId}.`
      );
    }

    for (const key of [
      "uniqueIds",
      "recipesExist",
      "biomeCompatibilityValid",
      "atlasCompatibilityValid",
      "deterministicLookup",
      "validationPassed"
    ]) {
      if (rawPack.validation[key] !== true) {
        throw createAssetRegistryValidationError(
          "nature_asset_pack_validation_failed",
          `Nature asset pack validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicNaturePackHash(records, rawPack.recipes);
    if (expectedHash !== rawPack.validation.deterministicNaturePackHash) {
      throw createAssetRegistryValidationError(
        "nature_asset_pack_hash_mismatch",
        "Nature asset pack deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      natureAssetPack: rawPack
    });
  } catch (error) {
    if (error?.name !== "AssetRegistryValidationError") {
      throw error;
    }

    return deepFreeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      natureAssetPack: null
    });
  }
}

export function validateCivicAssetPack(rawPack) {
  try {
    if (rawPack?.schemaId !== civicAssetPackSchemaId) {
      throw createAssetRegistryValidationError(
        "invalid_civic_asset_pack_schema",
        `Expected ${civicAssetPackSchemaId} but received ${rawPack?.schemaId}.`
      );
    }

    const records = normalizeAssetFactoryRecords(rawPack.assets);
    if (!Array.isArray(rawPack.recipes) || rawPack.recipes.length === 0) {
      throw createAssetRegistryValidationError(
        "invalid_civic_asset_pack_recipes",
        "Civic asset pack must expose a non-empty recipes array."
      );
    }

    if (rawPack.validation?.schemaId !== civicAssetPackValidationSchemaId) {
      throw createAssetRegistryValidationError(
        "invalid_civic_asset_pack_validation_schema",
        `Expected ${civicAssetPackValidationSchemaId} but received ${rawPack.validation?.schemaId}.`
      );
    }

    for (const key of [
      "uniqueIds",
      "recipesExist",
      "atlasCompatibilityValid",
      "footprintCompatibilityValid",
      "deterministicLookup",
      "validationPassed"
    ]) {
      if (rawPack.validation[key] !== true) {
        throw createAssetRegistryValidationError(
          "civic_asset_pack_validation_failed",
          `Civic asset pack validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicCivicPackHash(records, rawPack.recipes);
    if (expectedHash !== rawPack.validation.deterministicCivicPackHash) {
      throw createAssetRegistryValidationError(
        "civic_asset_pack_hash_mismatch",
        "Civic asset pack deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      civicAssetPack: rawPack
    });
  } catch (error) {
    if (error?.name !== "AssetRegistryValidationError") {
      throw error;
    }

    return deepFreeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      civicAssetPack: null
    });
  }
}

export function validateAssetFactoryRegistryLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetFactoryRegistryLayerSchemaId) {
      throw createAssetRegistryValidationError(
        "invalid_asset_factory_registry_schema",
        `Expected ${assetFactoryRegistryLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.records) || rawLayer.records.length === 0) {
      throw createAssetRegistryValidationError(
        "invalid_asset_factory_registry_records",
        "Asset Factory registry must expose a non-empty records array."
      );
    }

    normalizeAssetFactoryRecords(rawLayer.records);

    if (rawLayer.validation?.schemaId !== assetRegistryValidationSchemaId) {
      throw createAssetRegistryValidationError(
        "invalid_asset_factory_registry_validation_schema",
        `Expected ${assetRegistryValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "uniqueIds",
      "recipeExists",
      "versionExists",
      "atlasCompatibilityValid",
      "deterministicLookup",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createAssetRegistryValidationError(
          "asset_factory_registry_validation_failed",
          `Asset registry validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicRegistryHash(rawLayer.records);
    if (expectedHash !== rawLayer.validation.deterministicRegistryHash) {
      throw createAssetRegistryValidationError(
        "asset_factory_registry_hash_mismatch",
        "Asset registry deterministic hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetFactoryRegistryLayer: rawLayer
    });
  } catch (error) {
    if (error?.name !== "AssetRegistryValidationError") {
      throw error;
    }

    return deepFreeze({
      ok: false,
      errorCode: error.code,
      message: error.message,
      assetFactoryRegistryLayer: null
    });
  }
}

function normalizeAssetFactoryRecords(rawRecords) {
  if (!Array.isArray(rawRecords)) {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      "Asset Factory records must be an array."
    );
  }

  const records = rawRecords.map((rawRecord) => normalizeAssetFactoryRecord(rawRecord));
  const assetIds = new Set();

  for (const record of records) {
    if (assetIds.has(record.assetId)) {
      throw createAssetRegistryValidationError(
        "duplicate_asset_id",
        `Asset ID ${record.assetId} already exists in the Asset Factory registry layer.`
      );
    }
    assetIds.add(record.assetId);
  }

  return deepFreeze(records.sort((left, right) => left.assetId.localeCompare(right.assetId)));
}

function normalizeAssetFactoryRecord(rawRecord) {
  const record = asPlainObject(rawRecord, "assetFactoryRecord");
  assertAssetFactoryRequiredFields(record);

  const assetId = normalizeAssetIdInput(record.assetId);
  if (!assetIdPattern.test(assetId)) {
    throw createAssetRegistryValidationError(
      "invalid_asset_id",
      `Asset ID ${assetId} must use the permanent uppercase Asset Factory ID format.`
    );
  }

  const assetFamily = normalizeStringValue(record.assetFamily, "assetFamily");
  const assetType = normalizeStringValue(record.assetType, "assetType");
  const recipeId = normalizeStringValue(record.recipeId, "recipeId");
  const version = normalizeStringValue(record.version, "version");
  if (!versionPattern.test(version)) {
    throw createAssetRegistryValidationError(
      "invalid_version",
      `Asset version ${version} must use the approved registry version format.`
    );
  }

  const atlasCompatibility = normalizeAtlasCompatibility(record.atlasCompatibility);

  return deepFreeze({
    assetId,
    assetFamily,
    assetType,
    recipeId,
    version,
    lodRules: deepFreeze(normalizeStringArray(record.lodRules, "lodRules")),
    usageRules: deepFreeze(normalizeStringArray(record.usageRules, "usageRules")),
    atlasCompatibility,
    footprintCompatibility: deepFreeze(
      normalizeOptionalStringArray(
        record.footprintCompatibility,
        "footprintCompatibility",
        ["GENERIC_FOOTPRINT"]
      )
    ),
    biomeCompatibility: deepFreeze(
      normalizeOptionalStringArray(
        record.biomeCompatibility,
        "biomeCompatibility",
        ["GENERIC"]
      )
    ),
    metadata: record.metadata ? deepFreeze(asPlainObject(record.metadata, "metadata")) : deepFreeze({})
  });
}

function assertAssetFactoryRequiredFields(record) {
  for (const fieldName of assetFactoryRecordRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(record, fieldName)) {
      throw createAssetRegistryValidationError(
        "missing_required_field",
        `Asset Factory record is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeAtlasCompatibility(rawAtlasCompatibility) {
  const atlasCompatibility = asPlainObject(rawAtlasCompatibility, "atlasCompatibility");
  return deepFreeze({
    atlasCompatible: normalizeBoolean(
      atlasCompatibility.atlasCompatible,
      "atlasCompatibility.atlasCompatible"
    ),
    supportedObjectTypes: deepFreeze(
      normalizeStringArray(
        atlasCompatibility.supportedObjectTypes,
        "atlasCompatibility.supportedObjectTypes"
      )
    ),
    supportedClassifications: deepFreeze(
      normalizeStringArray(
        atlasCompatibility.supportedClassifications,
        "atlasCompatibility.supportedClassifications"
      )
    ),
    atlasAssignmentRecipeIds: deepFreeze(
      normalizeStringArray(
        atlasCompatibility.atlasAssignmentRecipeIds,
        "atlasCompatibility.atlasAssignmentRecipeIds"
      )
    ),
    assignmentMode: normalizeStringValue(
      atlasCompatibility.assignmentMode,
      "atlasCompatibility.assignmentMode"
    )
  });
}

function normalizeAtlasAssignment(rawAssignment) {
  const assignment = asPlainObject(rawAssignment, "atlasAssignment");
  return deepFreeze({
    objectId: normalizeStringValue(assignment.objectId, "atlasAssignment.objectId"),
    objectType: normalizeStringValue(assignment.objectType, "atlasAssignment.objectType"),
    recipeId: normalizeStringValue(assignment.recipeId, "atlasAssignment.recipeId")
  });
}

function isRecordCompatibleWithAtlasAssignment(record, assignment) {
  return (
    record.atlasCompatibility.atlasCompatible &&
    (record.recipeId === assignment.recipeId ||
      record.atlasCompatibility.atlasAssignmentRecipeIds.includes(assignment.recipeId) ||
      record.atlasCompatibility.supportedObjectTypes.includes(assignment.objectType))
  );
}

function buildAssetFactoryRegistryValidation(records) {
  const uniqueIds = new Set(records.map((record) => record.assetId)).size === records.length;
  const recipeExists = records.every(
    (record) =>
      atlasCompatibleRecipeIds.includes(record.recipeId) ||
      record.atlasCompatibility.atlasAssignmentRecipeIds.every((recipeId) =>
        atlasCompatibleRecipeIds.includes(recipeId)
      )
  );
  const versionExists = records.every((record) => versionPattern.test(record.version));
  const atlasCompatibilityValid = records.every(
    (record) =>
      record.atlasCompatibility.atlasCompatible === true &&
      record.atlasCompatibility.supportedObjectTypes.length > 0 &&
      record.atlasCompatibility.atlasAssignmentRecipeIds.length > 0
  );
  const deterministicLookup = true;
  const validationPassed =
    uniqueIds &&
    recipeExists &&
    versionExists &&
    atlasCompatibilityValid &&
    deterministicLookup;

  return deepFreeze({
    schemaId: assetRegistryValidationSchemaId,
    uniqueIds,
    recipeExists,
    versionExists,
    atlasCompatibilityValid,
    deterministicLookup,
    validationPassed,
    deterministicRegistryHash: computeDeterministicRegistryHash(records)
  });
}

function buildNatureAssetPackValidation(records, recipes) {
  const uniqueIds = new Set(records.map((record) => record.assetId)).size === records.length;
  const recipesExist = records.every((record) =>
    recipes.some((recipe) => recipe.recipeId === record.recipeId)
  );
  const biomeCompatibilityValid = records.every(
    (record) => Array.isArray(record.biomeCompatibility) && record.biomeCompatibility.length > 0
  );
  const atlasCompatibilityValid = records.every(
    (record) =>
      record.atlasCompatibility.atlasCompatible === true &&
      record.atlasCompatibility.supportedObjectTypes.length > 0
  );
  const deterministicLookup = true;
  const validationPassed =
    uniqueIds &&
    recipesExist &&
    biomeCompatibilityValid &&
    atlasCompatibilityValid &&
    deterministicLookup;

  return deepFreeze({
    schemaId: natureAssetPackValidationSchemaId,
    uniqueIds,
    recipesExist,
    biomeCompatibilityValid,
    atlasCompatibilityValid,
    deterministicLookup,
    validationPassed,
    deterministicNaturePackHash: computeDeterministicNaturePackHash(records, recipes)
  });
}

function buildCivicAssetPackValidation(records, recipes) {
  const uniqueIds = new Set(records.map((record) => record.assetId)).size === records.length;
  const recipesExist = records.every(
    (record) =>
      recipes.some((recipe) => recipe.recipeId === record.recipeId) ||
      record.atlasCompatibility.atlasAssignmentRecipeIds.every((recipeId) =>
        atlasCompatibleRecipeIds.includes(recipeId)
      )
  );
  const atlasCompatibilityValid = records.every(
    (record) =>
      record.atlasCompatibility.atlasCompatible === true &&
      record.atlasCompatibility.supportedObjectTypes.length > 0
  );
  const footprintCompatibilityValid = records.every(
    (record) => Array.isArray(record.footprintCompatibility) && record.footprintCompatibility.length > 0
  );
  const deterministicLookup = true;
  const validationPassed =
    uniqueIds &&
    recipesExist &&
    atlasCompatibilityValid &&
    footprintCompatibilityValid &&
    deterministicLookup;

  return deepFreeze({
    schemaId: civicAssetPackValidationSchemaId,
    uniqueIds,
    recipesExist,
    atlasCompatibilityValid,
    footprintCompatibilityValid,
    deterministicLookup,
    validationPassed,
    deterministicCivicPackHash: computeDeterministicCivicPackHash(records, recipes)
  });
}

function computeDeterministicRegistryHash(records) {
  return stableStringify(
    records.map((record) => ({
      assetId: record.assetId,
      assetFamily: record.assetFamily,
      assetType: record.assetType,
      recipeId: record.recipeId,
      version: record.version,
      lodRules: record.lodRules,
      usageRules: record.usageRules,
      atlasCompatibility: record.atlasCompatibility,
      footprintCompatibility: record.footprintCompatibility
    }))
  );
}

function computeDeterministicNaturePackHash(records, recipes) {
  return stableStringify({
    assets: records.map((record) => ({
      assetId: record.assetId,
      assetFamily: record.assetFamily,
      recipeId: record.recipeId,
      biomeCompatibility: record.biomeCompatibility
    })),
    recipes: recipes.map((recipe) => ({
      recipeId: recipe.recipeId,
      recipeType: recipe.recipeType,
      supportedFamilies: recipe.supportedFamilies
    }))
  });
}

function computeDeterministicCivicPackHash(records, recipes) {
  return stableStringify({
    assets: records.map((record) => ({
      assetId: record.assetId,
      assetFamily: record.assetFamily,
      recipeId: record.recipeId,
      footprintCompatibility: record.footprintCompatibility,
      atlasAssignmentRecipeIds: record.atlasCompatibility.atlasAssignmentRecipeIds
    })),
    recipes: recipes.map((recipe) => ({
      recipeId: recipe.recipeId,
      recipeType: recipe.recipeType,
      supportedFamilies: recipe.supportedFamilies
    }))
  });
}

function normalizeAssetRecord(rawAsset) {
  const asset = asPlainObject(rawAsset, "asset");

  assertRequiredFields(asset);

  const assetId = normalizeAssetIdInput(asset.assetId);
  if (!assetIdPattern.test(assetId)) {
    throw createAssetRegistryValidationError(
      "invalid_asset_id",
      `Asset ID ${assetId} must use the permanent uppercase Asset Factory ID format.`
    );
  }

  const category = normalizeStringValue(asset.category, "category");
  if (!assetFactoryCategories.includes(category)) {
    throw createAssetRegistryValidationError(
      "invalid_category",
      `Asset category ${category} is not part of the approved Asset Factory categories.`
    );
  }

  const version = normalizeStringValue(asset.version, "version");
  if (!versionPattern.test(version)) {
    throw createAssetRegistryValidationError(
      "invalid_version",
      `Asset version ${version} must use the approved registry version format.`
    );
  }

  const status = normalizeStringValue(asset.status, "status");
  if (!assetRegistryStatuses.includes(status)) {
    throw createAssetRegistryValidationError(
      "invalid_status",
      `Asset status ${status} is not part of the approved registry status set.`
    );
  }

  const components = normalizeStringArray(asset.components, "components");
  const tags = normalizeStringArray(asset.tags, "tags");
  const metadata = deepFreeze(asPlainObject(asset.metadata, "metadata"));

  return deepFreeze({
    assetId,
    category,
    version,
    status,
    components: deepFreeze(components),
    tags: deepFreeze(tags),
    metadata
  });
}

function assertRequiredFields(asset) {
  for (const fieldName of assetRegistryRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(asset, fieldName)) {
      throw createAssetRegistryValidationError(
        "missing_required_field",
        `Asset record is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizeAssetIdInput(value) {
  return normalizeStringValue(value, "assetId").toUpperCase();
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createAssetRegistryValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function normalizeStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of non-empty strings.`
    );
  }

  return value.map((entry, index) => {
    try {
      return normalizeStringValue(entry, `${fieldName}[${index}]`);
    } catch (error) {
      if (error?.name !== "AssetRegistryValidationError") {
        throw error;
      }

      throw createAssetRegistryValidationError(
        error.code,
        `Field ${fieldName} contains an invalid value at index ${index}.`
      );
    }
  });
}

function normalizeOptionalStringArray(value, fieldName, defaultValue = []) {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  return normalizeStringArray(value, fieldName);
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a boolean.`
    );
  }

  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createAssetRegistryValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createAssetRegistryValidationError(code, message) {
  const error = new Error(message);
  error.name = "AssetRegistryValidationError";
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

function stableStringify(value) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}
