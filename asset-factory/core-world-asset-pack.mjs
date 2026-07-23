import {
  createAssetRegistry,
  assetRegistryStatuses,
  validateAssetRecord
} from "./asset-registry.mjs";
import { createAssetRecipeRegistry } from "./asset-recipe-system.mjs";
import { createComponentLibrary } from "./component-library.mjs";
import { createAssetManifestRegistry } from "./asset-manifest-system.mjs";

export const coreWorldAssetPackRequiredFields = Object.freeze([
  "packId",
  "version",
  "status",
  "assetReferences",
  "metadata"
]);

export const coreWorldSeedComponents = deepFreeze([
  createComponentRecord("TERRAIN_GRASS_TILE_001", "terrain_pieces", "grass_tile"),
  createComponentRecord("TERRAIN_DIRT_TILE_001", "terrain_pieces", "dirt_tile"),
  createComponentRecord("TERRAIN_SAND_TILE_001", "terrain_pieces", "sand_tile"),
  createComponentRecord(
    "TERRAIN_WATER_EDGE_TILE_001",
    "terrain_pieces",
    "water_edge_tile"
  ),
  createComponentRecord("ROAD_STRAIGHT_SEGMENT_001", "road_pieces", "road_straight"),
  createComponentRecord("ROAD_CURVE_SEGMENT_001", "road_pieces", "road_curve"),
  createComponentRecord(
    "ROAD_INTERSECTION_SEGMENT_001",
    "road_pieces",
    "road_intersection"
  ),
  createComponentRecord("TRAIL_PATH_SEGMENT_001", "road_pieces", "trail_path"),
  createComponentRecord("TREE_BASIC_TRUNK_001", "vegetation_pieces", "tree_trunk"),
  createComponentRecord(
    "TREE_BASIC_CANOPY_001",
    "vegetation_pieces",
    "tree_canopy"
  ),
  createComponentRecord("BUSH_BASIC_CLUSTER_001", "vegetation_pieces", "bush_cluster"),
  createComponentRecord("ROCK_SMALL_FORM_001", "terrain_pieces", "small_rock"),
  createComponentRecord("HOUSE_WALL_PANEL_001", "walls", "house_wall_panel"),
  createComponentRecord("HOUSE_ROOF_GABLE_001", "roofs", "house_roof_gable"),
  createComponentRecord("HOUSE_DOOR_BASIC_001", "doors", "house_door_basic"),
  createComponentRecord("HOUSE_WINDOW_BASIC_001", "windows", "house_window_basic"),
  createComponentRecord("SHOP_WALL_PANEL_001", "walls", "shop_wall_panel"),
  createComponentRecord("SHOP_ROOF_FLAT_001", "roofs", "shop_roof_flat"),
  createComponentRecord("SHOP_DOOR_GLASS_001", "doors", "shop_door_glass"),
  createComponentRecord("SHOP_WINDOW_DISPLAY_001", "windows", "shop_window_display"),
  createComponentRecord("SIGN_BOARD_BASIC_001", "windows", "sign_board")
]);

export const coreWorldSeedAssets = deepFreeze([
  createAssetRecord("TERRAIN_GRASS_001", "terrain", ["TERRAIN_GRASS_TILE_001"]),
  createAssetRecord("TERRAIN_DIRT_001", "terrain", ["TERRAIN_DIRT_TILE_001"]),
  createAssetRecord("TERRAIN_SAND_001", "terrain", ["TERRAIN_SAND_TILE_001"]),
  createAssetRecord("TERRAIN_WATER_EDGE_001", "terrain", [
    "TERRAIN_WATER_EDGE_TILE_001"
  ]),
  createAssetRecord("ROAD_STRAIGHT_001", "roads", ["ROAD_STRAIGHT_SEGMENT_001"]),
  createAssetRecord("ROAD_CURVE_001", "roads", ["ROAD_CURVE_SEGMENT_001"]),
  createAssetRecord("ROAD_INTERSECTION_001", "roads", [
    "ROAD_INTERSECTION_SEGMENT_001"
  ]),
  createAssetRecord("TRAIL_PATH_001", "roads", ["TRAIL_PATH_SEGMENT_001"]),
  createAssetRecord("TREE_BASIC_001", "nature", [
    "TREE_BASIC_TRUNK_001",
    "TREE_BASIC_CANOPY_001"
  ]),
  createAssetRecord("BUSH_BASIC_001", "nature", ["BUSH_BASIC_CLUSTER_001"]),
  createAssetRecord("ROCK_SMALL_001", "nature", ["ROCK_SMALL_FORM_001"]),
  createAssetRecord("BUILDING_HOUSE_SMALL_001", "buildings", [
    "HOUSE_WALL_PANEL_001",
    "HOUSE_ROOF_GABLE_001",
    "HOUSE_DOOR_BASIC_001",
    "HOUSE_WINDOW_BASIC_001"
  ]),
  createAssetRecord("BUILDING_SHOP_SMALL_001", "buildings", [
    "SHOP_WALL_PANEL_001",
    "SHOP_ROOF_FLAT_001",
    "SHOP_DOOR_GLASS_001",
    "SHOP_WINDOW_DISPLAY_001",
    "SIGN_BOARD_BASIC_001"
  ]),
  createAssetRecord("DECORATION_SIGN_BASIC_001", "decorations", [
    "SIGN_BOARD_BASIC_001"
  ])
]);

export const coreWorldSeedRecipes = deepFreeze([
  createRecipeRecord("TERRAIN_GRASS_RECIPE_001", "terrain_grass", [
    "TERRAIN_GRASS_TILE_001"
  ]),
  createRecipeRecord("TERRAIN_DIRT_RECIPE_001", "terrain_dirt", [
    "TERRAIN_DIRT_TILE_001"
  ]),
  createRecipeRecord("TERRAIN_SAND_RECIPE_001", "terrain_sand", [
    "TERRAIN_SAND_TILE_001"
  ]),
  createRecipeRecord("TERRAIN_WATER_EDGE_RECIPE_001", "terrain_water_edge", [
    "TERRAIN_WATER_EDGE_TILE_001"
  ]),
  createRecipeRecord("ROAD_STRAIGHT_RECIPE_001", "road_straight", [
    "ROAD_STRAIGHT_SEGMENT_001"
  ]),
  createRecipeRecord("ROAD_CURVE_RECIPE_001", "road_curve", [
    "ROAD_CURVE_SEGMENT_001"
  ]),
  createRecipeRecord("ROAD_INTERSECTION_RECIPE_001", "road_intersection", [
    "ROAD_INTERSECTION_SEGMENT_001"
  ]),
  createRecipeRecord("TRAIL_PATH_RECIPE_001", "trail_path", [
    "TRAIL_PATH_SEGMENT_001"
  ]),
  createRecipeRecord("TREE_BASIC_RECIPE_001", "tree_basic", [
    "TREE_BASIC_TRUNK_001",
    "TREE_BASIC_CANOPY_001"
  ]),
  createRecipeRecord("BUSH_BASIC_RECIPE_001", "bush_basic", [
    "BUSH_BASIC_CLUSTER_001"
  ]),
  createRecipeRecord("ROCK_SMALL_RECIPE_001", "rock_small", [
    "ROCK_SMALL_FORM_001"
  ]),
  createRecipeRecord("BUILDING_HOUSE_SMALL_RECIPE_001", "building_house_small", [
    "HOUSE_WALL_PANEL_001",
    "HOUSE_ROOF_GABLE_001",
    "HOUSE_DOOR_BASIC_001",
    "HOUSE_WINDOW_BASIC_001"
  ]),
  createRecipeRecord("BUILDING_SHOP_SMALL_RECIPE_001", "building_shop_small", [
    "SHOP_WALL_PANEL_001",
    "SHOP_ROOF_FLAT_001",
    "SHOP_DOOR_GLASS_001",
    "SHOP_WINDOW_DISPLAY_001",
    "SIGN_BOARD_BASIC_001"
  ]),
  createRecipeRecord("DECORATION_SIGN_BASIC_RECIPE_001", "decoration_sign_basic", [
    "SIGN_BOARD_BASIC_001"
  ])
]);

export const coreWorldSeedManifests = deepFreeze([
  createManifestRecord("TERRAIN_GRASS_001", "terrain", "TERRAIN_GRASS_RECIPE_001", [
    "TERRAIN_GRASS_TILE_001"
  ]),
  createManifestRecord("TERRAIN_DIRT_001", "terrain", "TERRAIN_DIRT_RECIPE_001", [
    "TERRAIN_DIRT_TILE_001"
  ]),
  createManifestRecord("TERRAIN_SAND_001", "terrain", "TERRAIN_SAND_RECIPE_001", [
    "TERRAIN_SAND_TILE_001"
  ]),
  createManifestRecord(
    "TERRAIN_WATER_EDGE_001",
    "terrain",
    "TERRAIN_WATER_EDGE_RECIPE_001",
    ["TERRAIN_WATER_EDGE_TILE_001"]
  ),
  createManifestRecord("ROAD_STRAIGHT_001", "roads", "ROAD_STRAIGHT_RECIPE_001", [
    "ROAD_STRAIGHT_SEGMENT_001"
  ]),
  createManifestRecord("ROAD_CURVE_001", "roads", "ROAD_CURVE_RECIPE_001", [
    "ROAD_CURVE_SEGMENT_001"
  ]),
  createManifestRecord(
    "ROAD_INTERSECTION_001",
    "roads",
    "ROAD_INTERSECTION_RECIPE_001",
    ["ROAD_INTERSECTION_SEGMENT_001"]
  ),
  createManifestRecord("TRAIL_PATH_001", "roads", "TRAIL_PATH_RECIPE_001", [
    "TRAIL_PATH_SEGMENT_001"
  ]),
  createManifestRecord("TREE_BASIC_001", "nature", "TREE_BASIC_RECIPE_001", [
    "TREE_BASIC_TRUNK_001",
    "TREE_BASIC_CANOPY_001"
  ]),
  createManifestRecord("BUSH_BASIC_001", "nature", "BUSH_BASIC_RECIPE_001", [
    "BUSH_BASIC_CLUSTER_001"
  ]),
  createManifestRecord("ROCK_SMALL_001", "nature", "ROCK_SMALL_RECIPE_001", [
    "ROCK_SMALL_FORM_001"
  ]),
  createManifestRecord(
    "BUILDING_HOUSE_SMALL_001",
    "buildings",
    "BUILDING_HOUSE_SMALL_RECIPE_001",
    [
      "HOUSE_WALL_PANEL_001",
      "HOUSE_ROOF_GABLE_001",
      "HOUSE_DOOR_BASIC_001",
      "HOUSE_WINDOW_BASIC_001"
    ]
  ),
  createManifestRecord(
    "BUILDING_SHOP_SMALL_001",
    "buildings",
    "BUILDING_SHOP_SMALL_RECIPE_001",
    [
      "SHOP_WALL_PANEL_001",
      "SHOP_ROOF_FLAT_001",
      "SHOP_DOOR_GLASS_001",
      "SHOP_WINDOW_DISPLAY_001",
      "SIGN_BOARD_BASIC_001"
    ]
  ),
  createManifestRecord(
    "DECORATION_SIGN_BASIC_001",
    "decorations",
    "DECORATION_SIGN_BASIC_RECIPE_001",
    ["SIGN_BOARD_BASIC_001"]
  )
]);

export const coreWorldAssetPackDefinition = deepFreeze({
  packId: "CORE_WORLD_PACK_001",
  version: "1.0.0",
  status: "validated",
  assetReferences: deepFreeze(
    coreWorldSeedManifests.map((manifest) => manifest.assetId)
  ),
  metadata: deepFreeze({
    creatorSource: "internal",
    validationState: "validated",
    packRole: "seed_core_world_content",
    deterministic: true,
    supportedDomains: deepFreeze([
      "terrain",
      "roads",
      "nature",
      "buildings",
      "decorations"
    ])
  })
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function buildCoreWorldAssetFactoryLayers() {
  const componentLibrary = createComponentLibrary(coreWorldSeedComponents);
  const assetRegistry = createAssetRegistry(coreWorldSeedAssets);
  const recipeRegistry = createAssetRecipeRegistry(coreWorldSeedRecipes, {
    assetRegistry,
    componentLibrary
  });
  const manifestRegistry = createAssetManifestRegistry(coreWorldSeedManifests, {
    recipeRegistry,
    componentLibrary
  });

  return Object.freeze({
    componentLibrary,
    assetRegistry,
    recipeRegistry,
    manifestRegistry
  });
}

export function createCoreWorldAssetPack(rawPack = coreWorldAssetPackDefinition, options = {}) {
  return normalizeCoreWorldAssetPack(rawPack, normalizePackOptions(options));
}

export function validateCoreWorldAssetPack(rawPack = coreWorldAssetPackDefinition, options = {}) {
  try {
    const normalizedPack = normalizeCoreWorldAssetPack(
      rawPack,
      normalizePackOptions(options)
    );

    return Object.freeze({
      ok: true,
      normalizedPack,
      errorCode: null,
      message: null
    });
  } catch (error) {
    if (error?.name !== "CoreWorldAssetPackValidationError") {
      throw error;
    }

    return Object.freeze({
      ok: false,
      normalizedPack: null,
      errorCode: error.code,
      message: error.message
    });
  }
}

function normalizeCoreWorldAssetPack(rawPack, options) {
  const pack = asPlainObject(rawPack, "core world asset pack");
  assertRequiredFields(pack);

  const packId = normalizePermanentId(pack.packId, "packId");
  const version = normalizeVersion(pack.version, "version");
  const status = normalizeStatus(pack.status, "status");
  const assetReferences = normalizePermanentIdArray(
    pack.assetReferences,
    "assetReferences"
  );
  const metadata = deepFreeze(asPlainObject(pack.metadata, "metadata"));

  validatePackDependencies(assetReferences, options);

  return deepFreeze({
    packId,
    version,
    status,
    assetReferences: deepFreeze(assetReferences),
    metadata
  });
}

function validatePackDependencies(assetReferences, options) {
  const {
    assetRegistry,
    manifestRegistry,
    recipeRegistry,
    componentLibrary
  } = options;

  if (!assetRegistry || typeof assetRegistry.findAssetById !== "function") {
    throw createCoreWorldAssetPackValidationError(
      "asset_registry_unavailable",
      "Core World asset pack validation requires an available asset registry."
    );
  }

  if (!manifestRegistry || typeof manifestRegistry.findManifestByAssetId !== "function") {
    throw createCoreWorldAssetPackValidationError(
      "manifest_registry_unavailable",
      "Core World asset pack validation requires an available manifest registry."
    );
  }

  if (!recipeRegistry || typeof recipeRegistry.findRecipeById !== "function") {
    throw createCoreWorldAssetPackValidationError(
      "recipe_registry_unavailable",
      "Core World asset pack validation requires an available recipe registry."
    );
  }

  if (!componentLibrary || typeof componentLibrary.findComponentById !== "function") {
    throw createCoreWorldAssetPackValidationError(
      "component_library_unavailable",
      "Core World asset pack validation requires an available component library."
    );
  }

  for (const assetId of assetReferences) {
    const asset = assetRegistry.findAssetById(assetId);
    if (!asset) {
      throw createCoreWorldAssetPackValidationError(
        "missing_asset_reference",
        `Asset ${assetId} is not registered in the Asset Registry.`
      );
    }

    if (
      typeof assetRegistry.isAssetAvailable === "function" &&
      !assetRegistry.isAssetAvailable(assetId)
    ) {
      throw createCoreWorldAssetPackValidationError(
        "unavailable_asset_reference",
        `Asset ${assetId} is registered but not currently available.`
      );
    }

    const assetValidation = validateAssetRecord(asset);
    if (!assetValidation.ok) {
      throw createCoreWorldAssetPackValidationError(
        "invalid_asset_version",
        `Asset ${assetId} failed registry validation with ${assetValidation.errorCode}.`
      );
    }

    const manifest = manifestRegistry.findManifestByAssetId(assetId);
    if (!manifest) {
      throw createCoreWorldAssetPackValidationError(
        "missing_manifest_reference",
        `Asset ${assetId} does not have an available manifest.`
      );
    }

    if (
      typeof manifestRegistry.isManifestAvailable === "function" &&
      !manifestRegistry.isManifestAvailable(assetId)
    ) {
      throw createCoreWorldAssetPackValidationError(
        "unavailable_manifest_reference",
        `Manifest ${assetId} exists but is not approved for pack use.`
      );
    }

    const recipe = recipeRegistry.findRecipeById(manifest.recipeId);
    if (!recipe) {
      throw createCoreWorldAssetPackValidationError(
        "missing_recipe_reference",
        `Manifest ${assetId} references missing recipe ${manifest.recipeId}.`
      );
    }

    if (
      typeof recipeRegistry.isRecipeAvailable === "function" &&
      !recipeRegistry.isRecipeAvailable(manifest.recipeId)
    ) {
      throw createCoreWorldAssetPackValidationError(
        "unavailable_recipe_reference",
        `Recipe ${manifest.recipeId} exists but is not approved for pack use.`
      );
    }

    for (const componentId of manifest.componentReferences) {
      if (!componentLibrary.findComponentById(componentId)) {
        throw createCoreWorldAssetPackValidationError(
          "missing_component_reference",
          `Manifest ${assetId} references missing component ${componentId}.`
        );
      }

      if (
        typeof componentLibrary.isComponentAvailable === "function" &&
        !componentLibrary.isComponentAvailable(componentId)
      ) {
        throw createCoreWorldAssetPackValidationError(
          "unavailable_component_reference",
          `Component ${componentId} exists but is not approved for pack use.`
        );
      }
    }
  }
}

function createComponentRecord(componentId, category, type) {
  return deepFreeze({
    componentId,
    category,
    type,
    version: "1.0.0",
    status: "validated",
    dimensions: deepFreeze({
      width: 1,
      height: 1,
      depth: 1
    }),
    attachmentPoints: deepFreeze([
      deepFreeze({
        pointId: "CENTER",
        type: "modular_anchor",
        position: deepFreeze({
          x: 0,
          y: 0,
          z: 0
        })
      })
    ]),
    compatibilityRules: deepFreeze({
      allowedCategories: deepFreeze([]),
      allowedTypes: deepFreeze([]),
      disallowedComponentIds: deepFreeze([])
    }),
    tags: deepFreeze([type, "core_world_seed"]),
    metadata: deepFreeze({
      creatorSource: "internal",
      validationState: "validated"
    })
  });
}

function createAssetRecord(assetId, category, components) {
  return deepFreeze({
    assetId,
    category,
    version: "1.0.0",
    status: "validated",
    components: deepFreeze(components),
    tags: deepFreeze([category, "core_world_seed"]),
    metadata: deepFreeze({
      creatorSource: "internal",
      performanceTargets: deepFreeze({
        storageBudget: "low",
        ramBudget: "low",
        gpuBudget: "low"
      }),
      lod: deepFreeze({
        profile: "mobile-default"
      }),
      validationState: "validated"
    })
  });
}

function createRecipeRecord(recipeId, assetType, components) {
  return deepFreeze({
    recipeId,
    assetType,
    version: "1.0.0",
    status: "validated",
    components: deepFreeze(components),
    optionalComponents: deepFreeze([]),
    metadata: deepFreeze({
      creatorSource: "internal",
      compatibilityProfile: "mobile-default",
      tags: deepFreeze([assetType, "core_world_seed"])
    }),
    generationRules: deepFreeze({
      deterministic: true,
      seedMode: "explicit",
      variantPolicy: "version-pinned"
    })
  });
}

function createManifestRecord(assetId, category, recipeId, componentReferences) {
  return deepFreeze({
    assetId,
    category,
    version: "1.0.0",
    status: "validated",
    recipeId,
    componentReferences: deepFreeze(componentReferences),
    metadata: deepFreeze({
      creatorSource: "internal",
      validationState: "validated",
      manifestRole: "core_world_seed_asset"
    }),
    tags: deepFreeze([category, "core_world_seed"]),
    generationRules: deepFreeze({
      deterministic: true,
      seedMode: "explicit",
      recipeVersionLocked: true
    })
  });
}

function assertRequiredFields(pack) {
  for (const fieldName of coreWorldAssetPackRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(pack, fieldName)) {
      throw createCoreWorldAssetPackValidationError(
        "missing_required_field",
        `Core World asset pack is missing required field ${fieldName}.`
      );
    }
  }
}

function normalizePackOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return Object.freeze({
      assetRegistry: null,
      manifestRegistry: null,
      recipeRegistry: null,
      componentLibrary: null
    });
  }

  return Object.freeze({
    assetRegistry:
      options.assetRegistry && typeof options.assetRegistry === "object"
        ? options.assetRegistry
        : null,
    manifestRegistry:
      options.manifestRegistry && typeof options.manifestRegistry === "object"
        ? options.manifestRegistry
        : null,
    recipeRegistry:
      options.recipeRegistry && typeof options.recipeRegistry === "object"
        ? options.recipeRegistry
        : null,
    componentLibrary:
      options.componentLibrary && typeof options.componentLibrary === "object"
        ? options.componentLibrary
        : null
  });
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createCoreWorldAssetPackValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createCoreWorldAssetPackValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent asset IDs.`
    );
  }

  const ids = value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );

  if (new Set(ids).size !== ids.length) {
    throw createCoreWorldAssetPackValidationError(
      "duplicate_asset_reference",
      `Field ${fieldName} must not contain duplicate asset references.`
    );
  }

  return ids;
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createCoreWorldAssetPackValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }

  return normalized;
}

function normalizeStatus(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!assetRegistryStatuses.includes(normalized)) {
    throw createCoreWorldAssetPackValidationError(
      "invalid_status",
      `Field ${fieldName} must use an approved Asset Factory status.`
    );
  }

  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createCoreWorldAssetPackValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createCoreWorldAssetPackValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createCoreWorldAssetPackValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function createCoreWorldAssetPackValidationError(code, message) {
  const error = new Error(message);
  error.name = "CoreWorldAssetPackValidationError";
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}
