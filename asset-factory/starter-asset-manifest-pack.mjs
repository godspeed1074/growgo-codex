import {
  createAssetRegistry,
  assetRegistryStatuses,
  validateAssetRecord
} from "./asset-registry.mjs";
import { createAssetRecipeRegistry } from "./asset-recipe-system.mjs";
import { createComponentLibrary } from "./component-library.mjs";
import { createAssetManifestRegistry } from "./asset-manifest-system.mjs";
import {
  buildCoreWorldAssetFactoryLayers,
  coreWorldSeedAssets,
  coreWorldSeedComponents,
  coreWorldSeedManifests,
  coreWorldSeedRecipes
} from "./core-world-asset-pack.mjs";
import {
  coreWorldPlacementRules,
  createWorldPlacementRuleRegistry
} from "./world-placement-rules.mjs";

export const starterAssetPackRequiredFields = Object.freeze([
  "packId",
  "version",
  "status",
  "assetReferences",
  "metadata"
]);

export const starterAssetPackAssetReferences = deepFreeze([
  "BUILDING_HOUSE_SMALL_COASTAL_001",
  "BUILDING_SHOP_SMALL_001",
  "BUILDING_BAKERY_SMALL_001",
  "BUILDING_GAS_STATION_SMALL_001",
  "ROAD_STRAIGHT_SMALL_001",
  "ROAD_CURVE_SMALL_001",
  "ROAD_INTERSECTION_SMALL_001",
  "TRAIL_PATH_SMALL_001",
  "TREE_EUCALYPTUS_001",
  "TREE_PINE_001",
  "BUSH_NATIVE_001",
  "ROCK_COASTAL_001",
  "SIGN_BASIC_001",
  "FENCE_WOOD_001",
  "LAMP_POST_BASIC_001"
]);

export const starterSeedComponents = deepFreeze([
  createComponentRecord(
    "COASTAL_HOUSE_WALL_PANEL_001",
    "walls",
    "coastal_house_wall_panel"
  ),
  createComponentRecord(
    "COASTAL_HOUSE_ROOF_GABLE_001",
    "roofs",
    "coastal_house_roof_gable"
  ),
  createComponentRecord(
    "COASTAL_HOUSE_DOOR_BASIC_001",
    "doors",
    "coastal_house_door_basic"
  ),
  createComponentRecord(
    "COASTAL_HOUSE_WINDOW_SHUTTER_001",
    "windows",
    "coastal_house_window_shutter"
  ),
  createComponentRecord(
    "WEATHERBOARD_HOUSE_WALL_PANEL_001",
    "walls",
    "weatherboard_house_wall_panel"
  ),
  createComponentRecord(
    "WEATHERBOARD_HOUSE_ROOF_GABLE_001",
    "roofs",
    "weatherboard_house_roof_gable"
  ),
  createComponentRecord(
    "WEATHERBOARD_HOUSE_DOOR_BASIC_001",
    "doors",
    "weatherboard_house_door_basic"
  ),
  createComponentRecord(
    "WEATHERBOARD_HOUSE_WINDOW_BASIC_001",
    "windows",
    "weatherboard_house_window_basic"
  ),
  createComponentRecord(
    "SUBURBAN_HOUSE_WALL_PANEL_001",
    "walls",
    "suburban_house_wall_panel"
  ),
  createComponentRecord(
    "SUBURBAN_HOUSE_ROOF_HIP_001",
    "roofs",
    "suburban_house_roof_hip"
  ),
  createComponentRecord(
    "SUBURBAN_HOUSE_DOOR_BASIC_001",
    "doors",
    "suburban_house_door_basic"
  ),
  createComponentRecord(
    "SUBURBAN_HOUSE_WINDOW_WIDE_001",
    "windows",
    "suburban_house_window_wide"
  ),
  createComponentRecord("BAKERY_WALL_PANEL_001", "walls", "bakery_wall_panel"),
  createComponentRecord("BAKERY_ROOF_GABLE_001", "roofs", "bakery_roof_gable"),
  createComponentRecord("BAKERY_DOOR_GLASS_001", "doors", "bakery_door_glass"),
  createComponentRecord(
    "BAKERY_WINDOW_DISPLAY_001",
    "windows",
    "bakery_window_display"
  ),
  createComponentRecord("BAKERY_SIGN_BOARD_001", "windows", "bakery_sign_board"),
  createComponentRecord(
    "GAS_STATION_WALL_PANEL_001",
    "walls",
    "gas_station_wall_panel"
  ),
  createComponentRecord(
    "GAS_STATION_ROOF_CANOPY_001",
    "roofs",
    "gas_station_roof_canopy"
  ),
  createComponentRecord(
    "GAS_STATION_DOOR_GLASS_001",
    "doors",
    "gas_station_door_glass"
  ),
  createComponentRecord(
    "GAS_STATION_WINDOW_BASIC_001",
    "windows",
    "gas_station_window_basic"
  ),
  createComponentRecord(
    "GAS_STATION_PUMP_ICON_001",
    "windows",
    "gas_station_pump_icon"
  ),
  createComponentRecord(
    "SHOP_GENERAL_WALL_PANEL_001",
    "walls",
    "shop_general_wall_panel"
  ),
  createComponentRecord(
    "SHOP_GENERAL_ROOF_FLAT_001",
    "roofs",
    "shop_general_roof_flat"
  ),
  createComponentRecord(
    "SHOP_GENERAL_DOOR_GLASS_001",
    "doors",
    "shop_general_door_glass"
  ),
  createComponentRecord(
    "SHOP_GENERAL_WINDOW_DISPLAY_001",
    "windows",
    "shop_general_window_display"
  ),
  createComponentRecord(
    "SHOP_GENERAL_SIGN_PANEL_001",
    "windows",
    "shop_general_sign_panel"
  ),
  createComponentRecord(
    "ROAD_STRAIGHT_SMALL_SEGMENT_001",
    "road_pieces",
    "road_straight_small"
  ),
  createComponentRecord(
    "ROAD_CURVE_SMALL_SEGMENT_001",
    "road_pieces",
    "road_curve_small"
  ),
  createComponentRecord(
    "ROAD_INTERSECTION_SMALL_SEGMENT_001",
    "road_pieces",
    "road_intersection_small"
  ),
  createComponentRecord(
    "TRAIL_PATH_SMALL_SEGMENT_001",
    "road_pieces",
    "trail_path_small"
  ),
  createComponentRecord(
    "FOOTPATH_SMALL_SEGMENT_001",
    "road_pieces",
    "footpath_small"
  ),
  createComponentRecord(
    "TREE_EUCALYPTUS_TRUNK_001",
    "vegetation_pieces",
    "tree_eucalyptus_trunk"
  ),
  createComponentRecord(
    "TREE_EUCALYPTUS_CANOPY_001",
    "vegetation_pieces",
    "tree_eucalyptus_canopy"
  ),
  createComponentRecord(
    "TREE_PINE_TRUNK_001",
    "vegetation_pieces",
    "tree_pine_trunk"
  ),
  createComponentRecord(
    "TREE_PINE_CANOPY_001",
    "vegetation_pieces",
    "tree_pine_canopy"
  ),
  createComponentRecord(
    "TREE_NATIVE_SMALL_TRUNK_001",
    "vegetation_pieces",
    "tree_native_small_trunk"
  ),
  createComponentRecord(
    "TREE_NATIVE_SMALL_CANOPY_001",
    "vegetation_pieces",
    "tree_native_small_canopy"
  ),
  createComponentRecord(
    "BUSH_NATIVE_CLUSTER_001",
    "vegetation_pieces",
    "bush_native_cluster"
  ),
  createComponentRecord(
    "ROCK_COASTAL_FORM_001",
    "terrain_pieces",
    "rock_coastal_form"
  ),
  createComponentRecord(
    "GRASS_PATCH_CLUSTER_001",
    "vegetation_pieces",
    "grass_patch_cluster"
  ),
  createComponentRecord("SIGN_BASIC_PANEL_001", "windows", "sign_basic_panel"),
  createComponentRecord(
    "SIGN_GENERIC_PANEL_001",
    "windows",
    "sign_generic_panel"
  ),
  createComponentRecord("FENCE_WOOD_PANEL_001", "walls", "fence_wood_panel"),
  createComponentRecord(
    "LAMP_POST_POLE_001",
    "terrain_pieces",
    "lamp_post_pole"
  ),
  createComponentRecord(
    "BENCH_PARK_SEAT_001",
    "terrain_pieces",
    "bench_park_seat"
  )
]);

export const starterSeedAssets = deepFreeze([
  createAssetRecord("BUILDING_HOUSE_SMALL_COASTAL_001", "buildings", [
    "COASTAL_HOUSE_WALL_PANEL_001",
    "COASTAL_HOUSE_ROOF_GABLE_001",
    "COASTAL_HOUSE_DOOR_BASIC_001",
    "COASTAL_HOUSE_WINDOW_SHUTTER_001"
  ]),
  createAssetRecord("BUILDING_HOUSE_WEATHERBOARD_001", "buildings", [
    "WEATHERBOARD_HOUSE_WALL_PANEL_001",
    "WEATHERBOARD_HOUSE_ROOF_GABLE_001",
    "WEATHERBOARD_HOUSE_DOOR_BASIC_001",
    "WEATHERBOARD_HOUSE_WINDOW_BASIC_001"
  ]),
  createAssetRecord("BUILDING_HOUSE_SUBURBAN_001", "buildings", [
    "SUBURBAN_HOUSE_WALL_PANEL_001",
    "SUBURBAN_HOUSE_ROOF_HIP_001",
    "SUBURBAN_HOUSE_DOOR_BASIC_001",
    "SUBURBAN_HOUSE_WINDOW_WIDE_001"
  ]),
  findRequiredRecord(coreWorldSeedAssets, "assetId", "BUILDING_SHOP_SMALL_001"),
  createAssetRecord("BUILDING_BAKERY_SMALL_001", "buildings", [
    "BAKERY_WALL_PANEL_001",
    "BAKERY_ROOF_GABLE_001",
    "BAKERY_DOOR_GLASS_001",
    "BAKERY_WINDOW_DISPLAY_001",
    "BAKERY_SIGN_BOARD_001"
  ]),
  createAssetRecord("BUILDING_GAS_STATION_SMALL_001", "buildings", [
    "GAS_STATION_WALL_PANEL_001",
    "GAS_STATION_ROOF_CANOPY_001",
    "GAS_STATION_DOOR_GLASS_001",
    "GAS_STATION_WINDOW_BASIC_001",
    "GAS_STATION_PUMP_ICON_001"
  ]),
  createAssetRecord("BUILDING_SHOP_GENERAL_001", "buildings", [
    "SHOP_GENERAL_WALL_PANEL_001",
    "SHOP_GENERAL_ROOF_FLAT_001",
    "SHOP_GENERAL_DOOR_GLASS_001",
    "SHOP_GENERAL_WINDOW_DISPLAY_001",
    "SHOP_GENERAL_SIGN_PANEL_001"
  ]),
  createAssetRecord("ROAD_STRAIGHT_SMALL_001", "roads", [
    "ROAD_STRAIGHT_SMALL_SEGMENT_001"
  ]),
  createAssetRecord("ROAD_CURVE_SMALL_001", "roads", [
    "ROAD_CURVE_SMALL_SEGMENT_001"
  ]),
  createAssetRecord("ROAD_INTERSECTION_SMALL_001", "roads", [
    "ROAD_INTERSECTION_SMALL_SEGMENT_001"
  ]),
  createAssetRecord("TRAIL_PATH_SMALL_001", "roads", [
    "TRAIL_PATH_SMALL_SEGMENT_001"
  ]),
  createAssetRecord("FOOTPATH_SMALL_001", "roads", [
    "FOOTPATH_SMALL_SEGMENT_001"
  ]),
  createAssetRecord("TREE_EUCALYPTUS_001", "nature", [
    "TREE_EUCALYPTUS_TRUNK_001",
    "TREE_EUCALYPTUS_CANOPY_001"
  ]),
  createAssetRecord("TREE_PINE_001", "nature", [
    "TREE_PINE_TRUNK_001",
    "TREE_PINE_CANOPY_001"
  ]),
  createAssetRecord("TREE_NATIVE_SMALL_001", "nature", [
    "TREE_NATIVE_SMALL_TRUNK_001",
    "TREE_NATIVE_SMALL_CANOPY_001"
  ]),
  createAssetRecord("BUSH_NATIVE_001", "nature", ["BUSH_NATIVE_CLUSTER_001"]),
  createAssetRecord("ROCK_COASTAL_001", "nature", ["ROCK_COASTAL_FORM_001"]),
  createAssetRecord("GRASS_PATCH_001", "nature", ["GRASS_PATCH_CLUSTER_001"]),
  createAssetRecord("SIGN_BASIC_001", "decorations", ["SIGN_BASIC_PANEL_001"]),
  createAssetRecord("SIGN_GENERIC_001", "decorations", [
    "SIGN_GENERIC_PANEL_001"
  ]),
  createAssetRecord("FENCE_WOOD_001", "decorations", ["FENCE_WOOD_PANEL_001"]),
  createAssetRecord("LAMP_POST_BASIC_001", "decorations", [
    "LAMP_POST_POLE_001"
  ]),
  createAssetRecord("BENCH_PARK_001", "decorations", [
    "BENCH_PARK_SEAT_001"
  ])
]);

export const starterSeedRecipes = deepFreeze([
  createRecipeRecord(
    "BUILDING_HOUSE_SMALL_COASTAL_RECIPE_001",
    "building_house_small_coastal",
    [
      "COASTAL_HOUSE_WALL_PANEL_001",
      "COASTAL_HOUSE_ROOF_GABLE_001",
      "COASTAL_HOUSE_DOOR_BASIC_001",
      "COASTAL_HOUSE_WINDOW_SHUTTER_001"
    ]
  ),
  createRecipeRecord(
    "BUILDING_HOUSE_WEATHERBOARD_RECIPE_001",
    "building_house_weatherboard",
    [
      "WEATHERBOARD_HOUSE_WALL_PANEL_001",
      "WEATHERBOARD_HOUSE_ROOF_GABLE_001",
      "WEATHERBOARD_HOUSE_DOOR_BASIC_001",
      "WEATHERBOARD_HOUSE_WINDOW_BASIC_001"
    ]
  ),
  createRecipeRecord(
    "BUILDING_HOUSE_SUBURBAN_RECIPE_001",
    "building_house_suburban",
    [
      "SUBURBAN_HOUSE_WALL_PANEL_001",
      "SUBURBAN_HOUSE_ROOF_HIP_001",
      "SUBURBAN_HOUSE_DOOR_BASIC_001",
      "SUBURBAN_HOUSE_WINDOW_WIDE_001"
    ]
  ),
  findRequiredRecord(
    coreWorldSeedRecipes,
    "recipeId",
    "BUILDING_SHOP_SMALL_RECIPE_001"
  ),
  createRecipeRecord("BUILDING_BAKERY_SMALL_RECIPE_001", "building_bakery_small", [
    "BAKERY_WALL_PANEL_001",
    "BAKERY_ROOF_GABLE_001",
    "BAKERY_DOOR_GLASS_001",
    "BAKERY_WINDOW_DISPLAY_001",
    "BAKERY_SIGN_BOARD_001"
  ]),
  createRecipeRecord(
    "BUILDING_GAS_STATION_SMALL_RECIPE_001",
    "building_gas_station_small",
    [
      "GAS_STATION_WALL_PANEL_001",
      "GAS_STATION_ROOF_CANOPY_001",
      "GAS_STATION_DOOR_GLASS_001",
      "GAS_STATION_WINDOW_BASIC_001",
      "GAS_STATION_PUMP_ICON_001"
    ]
  ),
  createRecipeRecord("BUILDING_SHOP_GENERAL_RECIPE_001", "building_shop_general", [
    "SHOP_GENERAL_WALL_PANEL_001",
    "SHOP_GENERAL_ROOF_FLAT_001",
    "SHOP_GENERAL_DOOR_GLASS_001",
    "SHOP_GENERAL_WINDOW_DISPLAY_001",
    "SHOP_GENERAL_SIGN_PANEL_001"
  ]),
  createRecipeRecord("ROAD_STRAIGHT_SMALL_RECIPE_001", "road_straight_small", [
    "ROAD_STRAIGHT_SMALL_SEGMENT_001"
  ]),
  createRecipeRecord("ROAD_CURVE_SMALL_RECIPE_001", "road_curve_small", [
    "ROAD_CURVE_SMALL_SEGMENT_001"
  ]),
  createRecipeRecord(
    "ROAD_INTERSECTION_SMALL_RECIPE_001",
    "road_intersection_small",
    ["ROAD_INTERSECTION_SMALL_SEGMENT_001"]
  ),
  createRecipeRecord("TRAIL_PATH_SMALL_RECIPE_001", "trail_path_small", [
    "TRAIL_PATH_SMALL_SEGMENT_001"
  ]),
  createRecipeRecord("FOOTPATH_SMALL_RECIPE_001", "footpath_small", [
    "FOOTPATH_SMALL_SEGMENT_001"
  ]),
  createRecipeRecord("TREE_EUCALYPTUS_RECIPE_001", "tree_eucalyptus", [
    "TREE_EUCALYPTUS_TRUNK_001",
    "TREE_EUCALYPTUS_CANOPY_001"
  ]),
  createRecipeRecord("TREE_PINE_RECIPE_001", "tree_pine", [
    "TREE_PINE_TRUNK_001",
    "TREE_PINE_CANOPY_001"
  ]),
  createRecipeRecord("TREE_NATIVE_SMALL_RECIPE_001", "tree_native_small", [
    "TREE_NATIVE_SMALL_TRUNK_001",
    "TREE_NATIVE_SMALL_CANOPY_001"
  ]),
  createRecipeRecord("BUSH_NATIVE_RECIPE_001", "bush_native", [
    "BUSH_NATIVE_CLUSTER_001"
  ]),
  createRecipeRecord("ROCK_COASTAL_RECIPE_001", "rock_coastal", [
    "ROCK_COASTAL_FORM_001"
  ]),
  createRecipeRecord("GRASS_PATCH_RECIPE_001", "grass_patch", [
    "GRASS_PATCH_CLUSTER_001"
  ]),
  createRecipeRecord("SIGN_BASIC_RECIPE_001", "sign_basic", [
    "SIGN_BASIC_PANEL_001"
  ]),
  createRecipeRecord("SIGN_GENERIC_RECIPE_001", "sign_generic", [
    "SIGN_GENERIC_PANEL_001"
  ]),
  createRecipeRecord("FENCE_WOOD_RECIPE_001", "fence_wood", [
    "FENCE_WOOD_PANEL_001"
  ]),
  createRecipeRecord("LAMP_POST_BASIC_RECIPE_001", "lamp_post_basic", [
    "LAMP_POST_POLE_001"
  ]),
  createRecipeRecord("BENCH_PARK_RECIPE_001", "bench_park", [
    "BENCH_PARK_SEAT_001"
  ])
]);

export const starterSeedManifests = deepFreeze([
  createManifestRecord(
    "BUILDING_HOUSE_SMALL_COASTAL_001",
    "buildings",
    "BUILDING_HOUSE_SMALL_COASTAL_RECIPE_001",
    [
      "COASTAL_HOUSE_WALL_PANEL_001",
      "COASTAL_HOUSE_ROOF_GABLE_001",
      "COASTAL_HOUSE_DOOR_BASIC_001",
      "COASTAL_HOUSE_WINDOW_SHUTTER_001"
    ]
  ),
  createManifestRecord(
    "BUILDING_HOUSE_WEATHERBOARD_001",
    "buildings",
    "BUILDING_HOUSE_WEATHERBOARD_RECIPE_001",
    [
      "WEATHERBOARD_HOUSE_WALL_PANEL_001",
      "WEATHERBOARD_HOUSE_ROOF_GABLE_001",
      "WEATHERBOARD_HOUSE_DOOR_BASIC_001",
      "WEATHERBOARD_HOUSE_WINDOW_BASIC_001"
    ]
  ),
  createManifestRecord(
    "BUILDING_HOUSE_SUBURBAN_001",
    "buildings",
    "BUILDING_HOUSE_SUBURBAN_RECIPE_001",
    [
      "SUBURBAN_HOUSE_WALL_PANEL_001",
      "SUBURBAN_HOUSE_ROOF_HIP_001",
      "SUBURBAN_HOUSE_DOOR_BASIC_001",
      "SUBURBAN_HOUSE_WINDOW_WIDE_001"
    ]
  ),
  findRequiredRecord(
    coreWorldSeedManifests,
    "assetId",
    "BUILDING_SHOP_SMALL_001"
  ),
  createManifestRecord(
    "BUILDING_BAKERY_SMALL_001",
    "buildings",
    "BUILDING_BAKERY_SMALL_RECIPE_001",
    [
      "BAKERY_WALL_PANEL_001",
      "BAKERY_ROOF_GABLE_001",
      "BAKERY_DOOR_GLASS_001",
      "BAKERY_WINDOW_DISPLAY_001",
      "BAKERY_SIGN_BOARD_001"
    ]
  ),
  createManifestRecord(
    "BUILDING_GAS_STATION_SMALL_001",
    "buildings",
    "BUILDING_GAS_STATION_SMALL_RECIPE_001",
    [
      "GAS_STATION_WALL_PANEL_001",
      "GAS_STATION_ROOF_CANOPY_001",
      "GAS_STATION_DOOR_GLASS_001",
      "GAS_STATION_WINDOW_BASIC_001",
      "GAS_STATION_PUMP_ICON_001"
    ]
  ),
  createManifestRecord(
    "BUILDING_SHOP_GENERAL_001",
    "buildings",
    "BUILDING_SHOP_GENERAL_RECIPE_001",
    [
      "SHOP_GENERAL_WALL_PANEL_001",
      "SHOP_GENERAL_ROOF_FLAT_001",
      "SHOP_GENERAL_DOOR_GLASS_001",
      "SHOP_GENERAL_WINDOW_DISPLAY_001",
      "SHOP_GENERAL_SIGN_PANEL_001"
    ]
  ),
  createManifestRecord(
    "ROAD_STRAIGHT_SMALL_001",
    "roads",
    "ROAD_STRAIGHT_SMALL_RECIPE_001",
    ["ROAD_STRAIGHT_SMALL_SEGMENT_001"]
  ),
  createManifestRecord(
    "ROAD_CURVE_SMALL_001",
    "roads",
    "ROAD_CURVE_SMALL_RECIPE_001",
    ["ROAD_CURVE_SMALL_SEGMENT_001"]
  ),
  createManifestRecord(
    "ROAD_INTERSECTION_SMALL_001",
    "roads",
    "ROAD_INTERSECTION_SMALL_RECIPE_001",
    ["ROAD_INTERSECTION_SMALL_SEGMENT_001"]
  ),
  createManifestRecord(
    "TRAIL_PATH_SMALL_001",
    "roads",
    "TRAIL_PATH_SMALL_RECIPE_001",
    ["TRAIL_PATH_SMALL_SEGMENT_001"]
  ),
  createManifestRecord(
    "FOOTPATH_SMALL_001",
    "roads",
    "FOOTPATH_SMALL_RECIPE_001",
    ["FOOTPATH_SMALL_SEGMENT_001"]
  ),
  createManifestRecord(
    "TREE_EUCALYPTUS_001",
    "nature",
    "TREE_EUCALYPTUS_RECIPE_001",
    ["TREE_EUCALYPTUS_TRUNK_001", "TREE_EUCALYPTUS_CANOPY_001"]
  ),
  createManifestRecord(
    "TREE_PINE_001",
    "nature",
    "TREE_PINE_RECIPE_001",
    ["TREE_PINE_TRUNK_001", "TREE_PINE_CANOPY_001"]
  ),
  createManifestRecord(
    "TREE_NATIVE_SMALL_001",
    "nature",
    "TREE_NATIVE_SMALL_RECIPE_001",
    ["TREE_NATIVE_SMALL_TRUNK_001", "TREE_NATIVE_SMALL_CANOPY_001"]
  ),
  createManifestRecord("BUSH_NATIVE_001", "nature", "BUSH_NATIVE_RECIPE_001", [
    "BUSH_NATIVE_CLUSTER_001"
  ]),
  createManifestRecord(
    "ROCK_COASTAL_001",
    "nature",
    "ROCK_COASTAL_RECIPE_001",
    ["ROCK_COASTAL_FORM_001"]
  ),
  createManifestRecord("GRASS_PATCH_001", "nature", "GRASS_PATCH_RECIPE_001", [
    "GRASS_PATCH_CLUSTER_001"
  ]),
  createManifestRecord(
    "SIGN_BASIC_001",
    "decorations",
    "SIGN_BASIC_RECIPE_001",
    ["SIGN_BASIC_PANEL_001"]
  ),
  createManifestRecord(
    "SIGN_GENERIC_001",
    "decorations",
    "SIGN_GENERIC_RECIPE_001",
    ["SIGN_GENERIC_PANEL_001"]
  ),
  createManifestRecord(
    "FENCE_WOOD_001",
    "decorations",
    "FENCE_WOOD_RECIPE_001",
    ["FENCE_WOOD_PANEL_001"]
  ),
  createManifestRecord(
    "LAMP_POST_BASIC_001",
    "decorations",
    "LAMP_POST_BASIC_RECIPE_001",
    ["LAMP_POST_POLE_001"]
  ),
  createManifestRecord(
    "BENCH_PARK_001",
    "decorations",
    "BENCH_PARK_RECIPE_001",
    ["BENCH_PARK_SEAT_001"]
  )
]);

export const starterAssetPackDefinition = deepFreeze({
  packId: "STARTER_ASSET_PACK_001",
  version: "1.0.0",
  status: "validated",
  assetReferences: deepFreeze(starterAssetPackAssetReferences),
  metadata: deepFreeze({
    creatorSource: "internal",
    validationState: "validated",
    packRole: "starter_asset_catalogue",
    deterministic: true,
    catalogueScope: "growgo_starter_content"
  })
});

const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const versionPattern = /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){0,2}$/;

export function buildStarterAssetFactoryLayers() {
  const coreLayers = buildCoreWorldAssetFactoryLayers();
  const componentLibrary = coreLayers.componentLibrary;
  const assetRegistry = coreLayers.assetRegistry;
  const recipeRegistry = coreLayers.recipeRegistry;
  const manifestRegistry = coreLayers.manifestRegistry;

  for (const component of starterSeedComponents) {
    componentLibrary.addComponent(component);
  }

  for (const asset of starterSeedAssets) {
    if (!assetRegistry.hasAsset(asset.assetId)) {
      assetRegistry.addAsset(asset);
    }
  }

  for (const recipe of starterSeedRecipes) {
    if (!recipeRegistry.hasRecipe(recipe.recipeId)) {
      recipeRegistry.addRecipe(recipe);
    }
  }

  for (const manifest of starterSeedManifests) {
    if (!manifestRegistry.hasManifest(manifest.assetId)) {
      manifestRegistry.addManifest(manifest);
    }
  }

  const placementRuleRegistry = createWorldPlacementRuleRegistry(
    coreWorldPlacementRules
  );

  return Object.freeze({
    componentLibrary,
    assetRegistry,
    recipeRegistry,
    manifestRegistry,
    placementRuleRegistry
  });
}

export function createStarterAssetPack(
  rawPack = starterAssetPackDefinition,
  options = {}
) {
  return normalizeStarterAssetPack(rawPack, normalizePackOptions(options));
}

export function validateStarterAssetPack(
  rawPack = starterAssetPackDefinition,
  options = {}
) {
  try {
    const normalizedPack = normalizeStarterAssetPack(
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
    if (error?.name !== "StarterAssetPackValidationError") {
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

function normalizeStarterAssetPack(rawPack, options) {
  const pack = asPlainObject(rawPack, "starter asset pack");
  assertRequiredFields(pack);

  const packId = normalizePermanentId(pack.packId, "packId");
  const version = normalizeVersion(pack.version, "version");
  const status = normalizeStatus(pack.status, "status");
  const assetReferences = normalizePermanentIdArray(
    pack.assetReferences,
    "assetReferences"
  );
  const metadata = deepFreeze(asPlainObject(pack.metadata, "metadata"));

  validateStarterPackDependencies(assetReferences, options);

  return deepFreeze({
    packId,
    version,
    status,
    assetReferences: deepFreeze(assetReferences),
    metadata
  });
}

function validateStarterPackDependencies(assetReferences, options) {
  const {
    assetRegistry,
    manifestRegistry,
    recipeRegistry,
    componentLibrary,
    placementRuleRegistry
  } = options;

  if (!assetRegistry || typeof assetRegistry.findAssetById !== "function") {
    throw createStarterAssetPackValidationError(
      "asset_registry_unavailable",
      "Starter asset pack validation requires an available asset registry."
    );
  }

  if (
    !manifestRegistry ||
    typeof manifestRegistry.findManifestByAssetId !== "function"
  ) {
    throw createStarterAssetPackValidationError(
      "manifest_registry_unavailable",
      "Starter asset pack validation requires an available manifest registry."
    );
  }

  if (!recipeRegistry || typeof recipeRegistry.findRecipeById !== "function") {
    throw createStarterAssetPackValidationError(
      "recipe_registry_unavailable",
      "Starter asset pack validation requires an available recipe registry."
    );
  }

  if (
    !componentLibrary ||
    typeof componentLibrary.findComponentById !== "function"
  ) {
    throw createStarterAssetPackValidationError(
      "component_library_unavailable",
      "Starter asset pack validation requires an available component library."
    );
  }

  if (
    !placementRuleRegistry ||
    typeof placementRuleRegistry.listPlacementRules !== "function"
  ) {
    throw createStarterAssetPackValidationError(
      "placement_rule_registry_unavailable",
      "Starter asset pack validation requires an available placement rule registry."
    );
  }

  for (const assetId of assetReferences) {
    const asset = assetRegistry.findAssetById(assetId);
    if (!asset) {
      throw createStarterAssetPackValidationError(
        "missing_asset_reference",
        `Asset ${assetId} is not registered in the starter catalogue.`
      );
    }

    if (
      typeof assetRegistry.isAssetAvailable === "function" &&
      !assetRegistry.isAssetAvailable(assetId)
    ) {
      throw createStarterAssetPackValidationError(
        "unavailable_asset_reference",
        `Asset ${assetId} is registered but not approved for starter pack use.`
      );
    }

    const assetValidation = validateAssetRecord(asset);
    if (!assetValidation.ok) {
      throw createStarterAssetPackValidationError(
        "invalid_asset_record",
        `Asset ${assetId} failed validation with ${assetValidation.errorCode}.`
      );
    }

    const manifest = manifestRegistry.findManifestByAssetId(assetId);
    if (!manifest) {
      throw createStarterAssetPackValidationError(
        "missing_manifest_reference",
        `Asset ${assetId} does not have an approved manifest.`
      );
    }

    if (
      typeof manifestRegistry.isManifestAvailable === "function" &&
      !manifestRegistry.isManifestAvailable(assetId)
    ) {
      throw createStarterAssetPackValidationError(
        "unavailable_manifest_reference",
        `Manifest ${assetId} exists but is not approved for starter pack use.`
      );
    }

    const recipe = recipeRegistry.findRecipeById(manifest.recipeId);
    if (!recipe) {
      throw createStarterAssetPackValidationError(
        "missing_recipe_reference",
        `Manifest ${assetId} references missing recipe ${manifest.recipeId}.`
      );
    }

    if (
      typeof recipeRegistry.isRecipeAvailable === "function" &&
      !recipeRegistry.isRecipeAvailable(manifest.recipeId)
    ) {
      throw createStarterAssetPackValidationError(
        "unavailable_recipe_reference",
        `Recipe ${manifest.recipeId} exists but is not approved for starter pack use.`
      );
    }

    for (const componentId of manifest.componentReferences) {
      if (!componentLibrary.findComponentById(componentId)) {
        throw createStarterAssetPackValidationError(
          "missing_component_reference",
          `Manifest ${assetId} references missing component ${componentId}.`
        );
      }

      if (
        typeof componentLibrary.isComponentAvailable === "function" &&
        !componentLibrary.isComponentAvailable(componentId)
      ) {
        throw createStarterAssetPackValidationError(
          "unavailable_component_reference",
          `Component ${componentId} exists but is not approved for starter pack use.`
        );
      }
    }

    const matchingPlacementRules = placementRuleRegistry
      .listPlacementRules()
      .filter(
        (rule) =>
          rule.assetCategory === asset.category &&
          rule.compatibilityRules.allowedAssetIds.includes(assetId)
      );

    if (matchingPlacementRules.length === 0) {
      throw createStarterAssetPackValidationError(
        "missing_placement_rule",
        `Asset ${assetId} does not have an approved placement rule.`
      );
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
    tags: deepFreeze([type, "starter_asset_seed"]),
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
    tags: deepFreeze([category, "starter_asset_seed"]),
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
      tags: deepFreeze([assetType, "starter_asset_seed"])
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
      manifestRole: "starter_asset_catalogue"
    }),
    tags: deepFreeze([category, "starter_asset_seed"]),
    generationRules: deepFreeze({
      deterministic: true,
      seedMode: "explicit",
      recipeVersionLocked: true
    })
  });
}

function assertRequiredFields(pack) {
  for (const fieldName of starterAssetPackRequiredFields) {
    if (!Object.prototype.hasOwnProperty.call(pack, fieldName)) {
      throw createStarterAssetPackValidationError(
        "missing_required_field",
        `Starter asset pack is missing required field ${fieldName}.`
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
      componentLibrary: null,
      placementRuleRegistry: null
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
        : null,
    placementRuleRegistry:
      options.placementRuleRegistry &&
      typeof options.placementRuleRegistry === "object"
        ? options.placementRuleRegistry
        : null
  });
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw createStarterAssetPackValidationError(
      "invalid_identifier",
      `Field ${fieldName} must use the approved permanent uppercase Asset Factory ID format.`
    );
  }

  return normalized;
}

function normalizePermanentIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createStarterAssetPackValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be an array of permanent asset IDs.`
    );
  }

  return value.map((entry, index) =>
    normalizePermanentId(entry, `${fieldName}[${index}]`)
  );
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw createStarterAssetPackValidationError(
      "invalid_version",
      `Field ${fieldName} must use the approved Asset Factory version format.`
    );
  }

  return normalized;
}

function normalizeStatus(value, fieldName) {
  const normalized = normalizeStringValue(value, fieldName);
  if (!assetRegistryStatuses.includes(normalized)) {
    throw createStarterAssetPackValidationError(
      "invalid_status",
      `Field ${fieldName} must use an approved Asset Factory status.`
    );
  }

  return normalized;
}

function normalizeStringValue(value, fieldName) {
  if (typeof value !== "string") {
    throw createStarterAssetPackValidationError(
      "invalid_field_type",
      `Field ${fieldName} must be a non-empty string.`
    );
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    throw createStarterAssetPackValidationError(
      "invalid_field_value",
      `Field ${fieldName} must not be blank.`
    );
  }

  return normalized;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createStarterAssetPackValidationError(
      "invalid_field_type",
      `${label} must be a plain object.`
    );
  }

  return value;
}

function findRequiredRecord(collection, keyName, keyValue) {
  const record =
    collection.find((entry) => entry && entry[keyName] === keyValue) ?? null;

  if (!record) {
    throw new Error(`Required record ${keyValue} was not found in ${keyName}.`);
  }

  return record;
}

function createStarterAssetPackValidationError(code, message) {
  const error = new Error(message);
  error.name = "StarterAssetPackValidationError";
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
