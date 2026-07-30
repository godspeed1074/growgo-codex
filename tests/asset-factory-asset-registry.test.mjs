import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assetRegistryModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-registry.mjs")
);

test("house lookup returns onboarded residential suburban asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_RESIDENTIAL_SUBURBAN_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "FAMILY_BUILDING_RESIDENTIAL_HOUSE");
  assert.equal(asset.recipeId, "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001");
  assert.deepEqual(asset.lodRules, ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]);
});

test("shop lookup returns onboarded commercial small shop asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_COMMERCIAL_SMALL_SHOP_001");

  assert.ok(asset);
  assert.equal(asset.assetType, "SMALL_SHOP");
  assert.equal(asset.recipeId, "BUILDING_SHOP_GENERAL_RECIPE_001");
  assert.equal(asset.atlasCompatibility.atlasCompatible, true);
});

test("tree lookup returns nature pack tree asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("TREE_EUCALYPTUS_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "TREE_ASSET_FAMILY_001");
  assert.equal(asset.assetType, "COASTAL_TREE");
  assert.ok(asset.biomeCompatibility.includes("COASTAL"));
});

test("vegetation lookup returns nature pack vegetation asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUSH_NATIVE_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "VEGETATION_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "RECIPE_NATURE_SUBURBAN_GARDEN_STANDARD_001");
});

test("terrain feature lookup returns coastal terrain feature asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("ROCK_COASTAL_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "TERRAIN_FEATURE_ASSET_FAMILY_001");
  assert.ok(asset.biomeCompatibility.includes("CLIFF_EDGE"));
});

test("water edge lookup returns coastal shoreline transition asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("COASTAL_WATER_EDGE_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "COASTAL_NATURE_FAMILY_001");
  assert.equal(asset.recipeId, "COASTAL_WATER_EDGE_RECIPE_001");
  assert.ok(asset.biomeCompatibility.includes("RIVERBANK"));
});

test("gravel path lookup returns coastal pathway module asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("COASTAL_GRAVEL_PATH_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "COASTAL_PATHWAY_FAMILY_001");
  assert.equal(asset.recipeId, "COASTAL_GRAVEL_PATH_RECIPE_001");
  assert.ok(asset.biomeCompatibility.includes("COASTAL"));
});

test("beach lookup returns expanded beach asset family record", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("GROUND_BEACH_SAND_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "BEACH_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "BEACH_ENVIRONMENT_RECIPE_001");
  assert.ok(asset.biomeCompatibility.includes("DUNE_SYSTEM"));
});

test("forest lookup returns expanded forest asset family record", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("FOREST_UNDERGROWTH_SET_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "FOREST_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "FOREST_ENVIRONMENT_RECIPE_001");
  assert.ok(asset.biomeCompatibility.includes("WOODLAND"));
});

test("reserve lookup returns expanded reserve asset family record", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("RESERVE_HABITAT_SET_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "RESERVE_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "RESERVE_ENVIRONMENT_RECIPE_001");
  assert.ok(asset.biomeCompatibility.includes("PROTECTED_AREA"));
});

test("park treatment lookup returns expanded park treatment asset family record", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("PARK_TREATMENT_GREENERY_SET_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "PARK_TREATMENT_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "PARK_ENVIRONMENT_RECIPE_001");
  assert.ok(asset.biomeCompatibility.includes("SUBURBAN_PARKLAND"));
});

test("recipe lookup resolves shop recipe to onboarded asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetByRecipeId("BUILDING_SHOP_GENERAL_RECIPE_001");

  assert.ok(asset);
  assert.equal(asset.assetId, "BUILDING_COMMERCIAL_SMALL_SHOP_001");
});

test("recipe lookup resolves nature pack recipe through nature asset pack", () => {
  const naturePack = assetRegistryModule.createNatureAssetPack();
  const recipe = naturePack.getRecipe("RECIPE_NATURE_COASTAL_ENVIRONMENT_STANDARD_001");

  assert.ok(recipe);
  assert.equal(recipe.recipeType, "COASTAL_ENVIRONMENT_RECIPE");
  assert.ok(recipe.supportedFamilies.includes("TREE_ASSET_FAMILY_001"));
});

test("recipe lookup resolves expanded nature environment recipe through nature asset pack", () => {
  const naturePack = assetRegistryModule.createNatureAssetPack();
  const recipe = naturePack.getRecipe("BEACH_ENVIRONMENT_RECIPE_001");

  assert.ok(recipe);
  assert.equal(recipe.recipeType, "BEACH_ENVIRONMENT_RECIPE");
  assert.ok(recipe.supportedFamilies.includes("BEACH_ASSET_FAMILY_001"));
});

test("school lookup returns civic school asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_CIVIC_SCHOOL_PRIMARY_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "SCHOOL_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "SCHOOL_RECIPE_001");
  assert.ok(asset.footprintCompatibility.includes("CAMPUS_FOOTPRINT"));
});

test("library lookup returns civic library asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_CIVIC_LIBRARY_SMALL_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "LIBRARY_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "LIBRARY_RECIPE_001");
});

test("community lookup returns civic community building asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_CIVIC_COMMUNITY_HALL_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "COMMUNITY_BUILDING_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "COMMUNITY_BUILDING_RECIPE_001");
});

test("sports lookup returns civic sports facility asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_CIVIC_SPORTS_PAVILION_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "SPORTS_FACILITY_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "SPORTS_FACILITY_RECIPE_001");
  assert.ok(
    asset.atlasCompatibility.atlasAssignmentRecipeIds.includes("SPORTS_OVAL_RECIPE_001")
  );
});

test("recipe lookup resolves civic pack recipe through civic asset pack", () => {
  const civicPack = assetRegistryModule.createCivicAssetPack();
  const recipe = civicPack.getRecipe("SCHOOL_RECIPE_001");

  assert.ok(recipe);
  assert.equal(recipe.recipeType, "SCHOOL_CIVIC_RECIPE");
  assert.ok(recipe.supportedFamilies.includes("SCHOOL_ASSET_FAMILY_001"));
});

test("railway lookup returns transport railway asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("TRANSPORT_RAILWAY_STATION_PLATFORM_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "RAIL_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "RAILWAY_STATION_RECIPE_001");
});

test("ferry lookup returns transport ferry asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("TRANSPORT_FERRY_TERMINAL_PIER_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "FERRY_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "FERRY_TERMINAL_RECIPE_001");
});

test("bus stop lookup returns transport bus stop asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("TRANSPORT_BUS_STOP_SHELTER_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "BUS_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "BUS_STOP_RECIPE_001");
});

test("infrastructure lookup returns road infrastructure asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("TRANSPORT_ROAD_INFRASTRUCTURE_STANDARD_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "ROAD_INFRASTRUCTURE_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "ROAD_INFRASTRUCTURE_RECIPE_001");
});

test("recipe lookup resolves transport pack recipe through transport asset pack", () => {
  const transportPack = assetRegistryModule.createTransportAssetPack();
  const recipe = transportPack.getRecipe("RAILWAY_STATION_RECIPE_001");

  assert.ok(recipe);
  assert.equal(recipe.recipeType, "RAILWAY_STATION_TRANSPORT_RECIPE");
  assert.ok(recipe.supportedFamilies.includes("RAIL_ASSET_FAMILY_001"));
});

test("road lookup returns road surface asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("ROAD_SURFACE_RESIDENTIAL_STREET_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "ROAD_SURFACE_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "RESIDENTIAL_STREET_RECIPE_001");
  assert.ok(asset.geometryCompatibility.includes("LINEAR_ROAD_GEOMETRY"));
});

test("sidewalk lookup returns sidewalk asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("SIDEWALK_CURB_CROSSING_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "SIDEWALK_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "PEDESTRIAN_PATH_RECIPE_001");
});

test("furniture lookup returns street furniture asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("STREET_FURNITURE_STANDARD_SET_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "STREET_FURNITURE_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "STREET_FURNITURE_RECIPE_001");
});

test("detail lookup returns road detail asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("ROAD_DETAIL_MARKING_SET_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "ROAD_DETAIL_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "INTERSECTION_RECIPE_001");
});

test("recipe lookup resolves road and street pack recipe through road and street asset pack", () => {
  const roadPack = assetRegistryModule.createRoadAndStreetAssetPack();
  const recipe = roadPack.getRecipe("RESIDENTIAL_STREET_RECIPE_001");

  assert.ok(recipe);
  assert.equal(recipe.recipeType, "RESIDENTIAL_STREET_ROAD_RECIPE");
  assert.ok(recipe.supportedFamilies.includes("ROAD_SURFACE_ASSET_FAMILY_001"));
});

test("bakery lookup returns commercial bakery asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_COMMERCIAL_BAKERY_SMALL_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "FOOD_BUSINESS_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "BAKERY_RECIPE_001");
});

test("cafe lookup returns commercial cafe asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_COMMERCIAL_CAFE_COASTAL_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "FOOD_BUSINESS_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "CAFE_RECIPE_001");
});

test("petrol station lookup returns commercial service asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_COMMERCIAL_SERVICE_PETROL_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "SERVICE_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "PETROL_STATION_RECIPE_001");
});

test("retail lookup returns commercial retail asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_COMMERCIAL_RETAIL_SHOP_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "RETAIL_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "RETAIL_SHOP_RECIPE_001");
});

test("recipe lookup resolves commercial pack recipe through commercial asset pack", () => {
  const commercialPack = assetRegistryModule.createCommercialAssetPack();
  const recipe = commercialPack.getRecipe("BAKERY_RECIPE_001");

  assert.ok(recipe);
  assert.equal(recipe.recipeType, "COMMERCIAL_BAKERY_RECIPE");
  assert.ok(recipe.supportedFamilies.includes("FOOD_BUSINESS_ASSET_FAMILY_001"));
});

test("residential house lookup returns residential house asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_RESIDENTIAL_HOUSE_SUBURBAN_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "HOUSE_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "SUBURBAN_HOUSE_RECIPE_001");
});

test("townhouse lookup returns residential townhouse asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_RESIDENTIAL_MULTI_UNIT_TOWNHOUSE_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "MULTI_UNIT_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "TOWNHOUSE_RECIPE_001");
});

test("apartment lookup returns residential apartment asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("BUILDING_RESIDENTIAL_MULTI_UNIT_APARTMENT_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "MULTI_UNIT_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "APARTMENT_RECIPE_001");
});

test("garden lookup returns residential detail asset", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const asset = registryLayer.getAssetById("RESIDENTIAL_DETAIL_GARDEN_SET_001");

  assert.ok(asset);
  assert.equal(asset.assetFamily, "RESIDENTIAL_DETAIL_ASSET_FAMILY_001");
  assert.equal(asset.recipeId, "RESIDENTIAL_GARDEN_RECIPE_001");
});

test("recipe lookup resolves residential pack recipe through residential asset pack", () => {
  const residentialPack = assetRegistryModule.createResidentialAssetPack();
  const recipe = residentialPack.getRecipe("SUBURBAN_HOUSE_RECIPE_001");

  assert.ok(recipe);
  assert.equal(recipe.recipeType, "RESIDENTIAL_SUBURBAN_HOUSE_RECIPE");
  assert.ok(recipe.supportedFamilies.includes("HOUSE_ASSET_FAMILY_001"));
});

test("atlas assignment resolution resolves residential recipe deterministically", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const resolved = registryLayer.resolveAssetForAtlasAssignment({
    objectId: "HOUSE_settle_house_001",
    objectType: "HOUSE",
    recipeId: "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001"
  });

  assert.ok(resolved);
  assert.equal(resolved.assetId, "BUILDING_RESIDENTIAL_SUBURBAN_001");
});

test("deterministic nature asset pack output stays stable", () => {
  const first = assetRegistryModule.createNatureAssetPack();
  const second = assetRegistryModule.createNatureAssetPack();

  assert.deepEqual(first.assets, second.assets);
  assert.equal(
    first.validation.deterministicNaturePackHash,
    second.validation.deterministicNaturePackHash
  );
});

test("deterministic civic asset pack output stays stable", () => {
  const first = assetRegistryModule.createCivicAssetPack();
  const second = assetRegistryModule.createCivicAssetPack();

  assert.deepEqual(first.assets, second.assets);
  assert.equal(
    first.validation.deterministicCivicPackHash,
    second.validation.deterministicCivicPackHash
  );
});

test("deterministic transport asset pack output stays stable", () => {
  const first = assetRegistryModule.createTransportAssetPack();
  const second = assetRegistryModule.createTransportAssetPack();

  assert.deepEqual(first.assets, second.assets);
  assert.equal(
    first.validation.deterministicTransportPackHash,
    second.validation.deterministicTransportPackHash
  );
});

test("deterministic road and street asset pack output stays stable", () => {
  const first = assetRegistryModule.createRoadAndStreetAssetPack();
  const second = assetRegistryModule.createRoadAndStreetAssetPack();

  assert.deepEqual(first.assets, second.assets);
  assert.equal(
    first.validation.deterministicRoadAndStreetPackHash,
    second.validation.deterministicRoadAndStreetPackHash
  );
});

test("deterministic commercial asset pack output stays stable", () => {
  const first = assetRegistryModule.createCommercialAssetPack();
  const second = assetRegistryModule.createCommercialAssetPack();

  assert.deepEqual(first.assets, second.assets);
  assert.equal(
    first.validation.deterministicCommercialPackHash,
    second.validation.deterministicCommercialPackHash
  );
});

test("deterministic residential asset pack output stays stable", () => {
  const first = assetRegistryModule.createResidentialAssetPack();
  const second = assetRegistryModule.createResidentialAssetPack();

  assert.deepEqual(first.assets, second.assets);
  assert.equal(
    first.validation.deterministicResidentialPackHash,
    second.validation.deterministicResidentialPackHash
  );
});

test("invalid asset handling rejects duplicate asset ids", () => {
  assert.throws(
    () =>
      assetRegistryModule.createAssetFactoryRegistryLayer([
        ...assetRegistryModule.onboardedExistingAssetRecords,
        assetRegistryModule.onboardedExistingAssetRecords[0]
      ]),
    /already exists/i
  );
});

test("same inputs produce deterministic same registry output", () => {
  const first = assetRegistryModule.createAssetFactoryRegistryLayer();
  const second = assetRegistryModule.createAssetFactoryRegistryLayer();

  assert.deepEqual(first.records, second.records);
  assert.equal(
    first.validation.deterministicRegistryHash,
    second.validation.deterministicRegistryHash
  );
});

test("explicit asset registry validation passes contract checks", () => {
  const registryLayer = assetRegistryModule.createAssetFactoryRegistryLayer();
  const validation =
    assetRegistryModule.validateAssetFactoryRegistryLayer(registryLayer);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.assetFactoryRegistryLayer.validation.uniqueIds,
    true
  );
  assert.equal(
    validation.assetFactoryRegistryLayer.validation.recipeExists,
    true
  );
  assert.equal(
    validation.assetFactoryRegistryLayer.validation.atlasCompatibilityValid,
    true
  );
});

test("explicit nature asset pack validation passes contract checks", () => {
  const naturePack = assetRegistryModule.createNatureAssetPack();
  const validation = assetRegistryModule.validateNatureAssetPack(naturePack);

  assert.equal(validation.ok, true);
  assert.equal(validation.natureAssetPack.validation.uniqueIds, true);
  assert.equal(validation.natureAssetPack.validation.recipesExist, true);
  assert.equal(
    validation.natureAssetPack.validation.biomeCompatibilityValid,
    true
  );
});

test("explicit civic asset pack validation passes contract checks", () => {
  const civicPack = assetRegistryModule.createCivicAssetPack();
  const validation = assetRegistryModule.validateCivicAssetPack(civicPack);

  assert.equal(validation.ok, true);
  assert.equal(validation.civicAssetPack.validation.uniqueIds, true);
  assert.equal(validation.civicAssetPack.validation.recipesExist, true);
  assert.equal(validation.civicAssetPack.validation.atlasCompatibilityValid, true);
  assert.equal(validation.civicAssetPack.validation.footprintCompatibilityValid, true);
});

test("explicit transport asset pack validation passes contract checks", () => {
  const transportPack = assetRegistryModule.createTransportAssetPack();
  const validation = assetRegistryModule.validateTransportAssetPack(transportPack);

  assert.equal(validation.ok, true);
  assert.equal(validation.transportAssetPack.validation.uniqueIds, true);
  assert.equal(validation.transportAssetPack.validation.recipesExist, true);
  assert.equal(validation.transportAssetPack.validation.atlasCompatibilityValid, true);
  assert.equal(
    validation.transportAssetPack.validation.footprintCompatibilityValid,
    true
  );
});

test("explicit road and street asset pack validation passes contract checks", () => {
  const roadPack = assetRegistryModule.createRoadAndStreetAssetPack();
  const validation = assetRegistryModule.validateRoadAndStreetAssetPack(roadPack);

  assert.equal(validation.ok, true);
  assert.equal(validation.roadAndStreetAssetPack.validation.uniqueIds, true);
  assert.equal(validation.roadAndStreetAssetPack.validation.recipesExist, true);
  assert.equal(validation.roadAndStreetAssetPack.validation.atlasCompatibilityValid, true);
  assert.equal(
    validation.roadAndStreetAssetPack.validation.geometryCompatibilityValid,
    true
  );
});

test("explicit commercial asset pack validation passes contract checks", () => {
  const commercialPack = assetRegistryModule.createCommercialAssetPack();
  const validation = assetRegistryModule.validateCommercialAssetPack(commercialPack);

  assert.equal(validation.ok, true);
  assert.equal(validation.commercialAssetPack.validation.uniqueIds, true);
  assert.equal(validation.commercialAssetPack.validation.recipesExist, true);
  assert.equal(validation.commercialAssetPack.validation.atlasCompatibilityValid, true);
  assert.equal(
    validation.commercialAssetPack.validation.footprintCompatibilityValid,
    true
  );
});

test("explicit residential asset pack validation passes contract checks", () => {
  const residentialPack = assetRegistryModule.createResidentialAssetPack();
  const validation = assetRegistryModule.validateResidentialAssetPack(residentialPack);

  assert.equal(validation.ok, true);
  assert.equal(validation.residentialAssetPack.validation.uniqueIds, true);
  assert.equal(validation.residentialAssetPack.validation.recipesExist, true);
  assert.equal(validation.residentialAssetPack.validation.atlasCompatibilityValid, true);
  assert.equal(
    validation.residentialAssetPack.validation.footprintCompatibilityValid,
    true
  );
});
