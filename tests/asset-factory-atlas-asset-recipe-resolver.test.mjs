import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sourceAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "source-adapter.mjs")
);
const regionPackageBuilderModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "region-package-builder.mjs")
);
const runtimeReaderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "region-package-runtime-reader.mjs"
  )
);
const atlasPresentationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-presentation-runtime.mjs"
  )
);
const classificationModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "growgo-object-classification.mjs"
  )
);
const relationshipModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-object-relationship.mjs"
  )
);
const recipeResolverModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-asset-recipe-resolver.mjs"
  )
);

function createClassificationLayer() {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  const regionImportPackage =
    regionPackageBuilderModule.createGrowgoRegionImportPackage(sourceAdapterLayer);
  const runtimeReader =
    runtimeReaderModule.createRegionPackageRuntimeReader(regionImportPackage);
  const atlasLayer = atlasPresentationModule.createAtlasPresentationRuntimeLayer(
    runtimeReader
  );
  return classificationModule.createGrowgoObjectClassificationLayer(atlasLayer);
}

function createRelationshipLayer(classificationLayer = createClassificationLayer()) {
  return relationshipModule.createAtlasObjectRelationshipLayer(classificationLayer);
}

function createResolver(classificationLayer = createClassificationLayer()) {
  return recipeResolverModule.createAtlasAssetRecipeResolver(
    classificationLayer,
    createRelationshipLayer(classificationLayer)
  );
}

test("house assignment maps residential house to residential recipe", () => {
  const classificationLayer = createClassificationLayer();
  const syntheticHouse = {
    objectId: "HOUSE_settle_house_001",
    sourceReference: {
      sourceFeatureId: "settle_house_001",
      provider: "fixture-provider",
      normalizedFeatureId: "settle_house_001",
      normalizationVersion: "1"
    },
    realWorldType: "HOUSE",
    growgoClassification: "BUSINESS",
    geometryReference: [145.11, -38.31],
    presentationReference: "HOUSE_settle_house_001_PRESENTATION",
    gameplayTags: ["residential"],
    questCompatibility: "QUEST_OPTIONAL"
  };
  const worldObjects = {
    ...classificationLayer.worldObjects,
    objects: [...classificationLayer.worldObjects.objects, syntheticHouse]
  };

  const resolver = recipeResolverModule.createAtlasAssetRecipeResolver(worldObjects);
  const assignment = resolver.assignments.entries.find((entry) => entry.objectId === syntheticHouse.objectId);

  assert.ok(assignment);
  assert.equal(assignment.recipeId, "RECIPE_BUILDING_RESIDENTIAL_HOUSE_STANDARD_001");
  assert.equal(assignment.assetFamily, "FAMILY_BUILDING_RESIDENTIAL_HOUSE");
});

test("bakery assignment maps bakery object to bakery recipe", () => {
  const classificationLayer = createClassificationLayer();
  const bakery = {
    objectId: "BUILDING_REF_SERVICE_poi_bakery_PRESENTATION_OBJECT",
    sourceReference: {
      sourceFeatureId: "poi_bakery_001",
      provider: "fixture-provider",
      normalizedFeatureId: "poi_bakery_001",
      normalizationVersion: "1"
    },
    realWorldType: "BAKERY",
    growgoClassification: "BUSINESS",
    geometryReference: [145.091, -38.321],
    presentationReference: "BUILDING_REF_SERVICE_poi_bakery_PRESENTATION",
    gameplayTags: ["crafting", "food", "npc_interaction", "quest_candidate"],
    questCompatibility: "QUEST_SUPPORTED"
  };
  const worldObjects = {
    ...classificationLayer.worldObjects,
    objects: [...classificationLayer.worldObjects.objects, bakery]
  };

  const resolver = recipeResolverModule.createAtlasAssetRecipeResolver(worldObjects);
  const assignment = resolver.assignments.entries.find((entry) => entry.objectId === bakery.objectId);

  assert.ok(assignment);
  assert.equal(assignment.recipeId, "RECIPE_BUILDING_BAKERY_SMALL_TOWN_001");
});

test("civic recipe assignment uses explicit civic recipe identifiers", () => {
  const classificationLayer = createClassificationLayer();
  const civicObjects = [
    syntheticObject("LIBRARY_001", "LIBRARY", "BUSINESS", polygon(145.20, -38.20)),
    syntheticObject("SCHOOL_001", "SCHOOL", "BUSINESS", polygon(145.21, -38.20)),
    syntheticObject(
      "COMMUNITY_001",
      "COMMUNITY_BUILDING",
      "BUSINESS",
      polygon(145.22, -38.20)
    )
  ];
  const worldObjects = {
    ...classificationLayer.worldObjects,
    objects: [...classificationLayer.worldObjects.objects, ...civicObjects]
  };

  const resolver = recipeResolverModule.createAtlasAssetRecipeResolver(worldObjects);

  assert.equal(findAssignment(resolver, "LIBRARY_001").classification, "BUSINESS");
  assert.equal(findAssignment(resolver, "LIBRARY_001").recipeId, "LIBRARY_RECIPE_001");
  assert.equal(findAssignment(resolver, "SCHOOL_001").recipeId, "SCHOOL_RECIPE_001");
  assert.equal(
    findAssignment(resolver, "COMMUNITY_001").recipeId,
    "COMMUNITY_BUILDING_RECIPE_001"
  );
});

test("sports and natural recipe assignment uses explicit environment recipe identifiers", () => {
  const classificationLayer = createClassificationLayer();
  const environmentObjects = [
    syntheticObject("OVAL_001", "OVAL", "PARK", polygon(145.23, -38.20)),
    syntheticObject("RECREATION_001", "RECREATION_AREA", "PARK", polygon(145.24, -38.20)),
    syntheticObject("BEACH_001", "BEACH", "NATURAL_FEATURE", polygon(145.25, -38.20)),
    syntheticObject("RESERVE_001", "RESERVE", "PARK", polygon(145.26, -38.20)),
    syntheticObject("FOREST_001", "FOREST", "NATURAL_FEATURE", polygon(145.27, -38.20))
  ];
  const worldObjects = {
    ...classificationLayer.worldObjects,
    objects: [...classificationLayer.worldObjects.objects, ...environmentObjects]
  };

  const resolver = recipeResolverModule.createAtlasAssetRecipeResolver(worldObjects);

  assert.equal(findAssignment(resolver, "OVAL_001").recipeId, "SPORTS_OVAL_RECIPE_001");
  assert.equal(
    findAssignment(resolver, "RECREATION_001").recipeId,
    "RECREATION_AREA_RECIPE_001"
  );
  assert.equal(findAssignment(resolver, "BEACH_001").recipeId, "BEACH_RECIPE_001");
  assert.equal(findAssignment(resolver, "RESERVE_001").recipeId, "RESERVE_RECIPE_001");
  assert.equal(findAssignment(resolver, "FOREST_001").recipeId, "FOREST_RECIPE_001");
});

test("transport and industrial recipe assignment uses explicit recipe identifiers", () => {
  const classificationLayer = createClassificationLayer();
  const transportAndIndustrialObjects = [
    syntheticObject(
      "RAILWAY_001",
      "RAILWAY_STATION",
      "TRANSPORT",
      polygon(145.28, -38.20)
    ),
    syntheticObject(
      "FERRY_001",
      "FERRY_TERMINAL",
      "TRANSPORT",
      polygon(145.29, -38.20)
    ),
    syntheticObject("BUS_001", "BUS_STOP", "TRANSPORT", polygon(145.30, -38.20)),
    syntheticObject("WAREHOUSE_001", "WAREHOUSE", "BUSINESS", polygon(145.31, -38.20)),
    syntheticObject(
      "INDUSTRIAL_001",
      "INDUSTRIAL_BUILDING",
      "BUSINESS",
      polygon(145.32, -38.20)
    )
  ];
  const worldObjects = {
    ...classificationLayer.worldObjects,
    objects: [...classificationLayer.worldObjects.objects, ...transportAndIndustrialObjects]
  };

  const resolver = recipeResolverModule.createAtlasAssetRecipeResolver(worldObjects);

  assert.equal(
    findAssignment(resolver, "RAILWAY_001").recipeId,
    "RAILWAY_STATION_RECIPE_001"
  );
  assert.equal(
    findAssignment(resolver, "FERRY_001").recipeId,
    "FERRY_TERMINAL_RECIPE_001"
  );
  assert.equal(findAssignment(resolver, "BUS_001").recipeId, "BUS_STOP_RECIPE_001");
  assert.equal(findAssignment(resolver, "WAREHOUSE_001").recipeId, "WAREHOUSE_RECIPE_001");
  assert.equal(
    findAssignment(resolver, "INDUSTRIAL_001").recipeId,
    "INDUSTRIAL_BUILDING_RECIPE_001"
  );
});

test("park assignment maps park object to park treatment recipe", () => {
  const resolver = createResolver();
  const assignment = resolver.assignments.entries.find(
    (entry) => entry.objectType === "PARK"
  );

  assert.ok(assignment);
  assert.equal(assignment.recipeId, "RECIPE_TREATMENT_PARK_STANDARD_001");
  assert.ok(assignment.variantRules.includes("trail_connected_context"));
});

test("landmark assignment maps lighthouse to lighthouse recipe", () => {
  const resolver = createResolver();
  const assignment = resolver.assignments.entries.find(
    (entry) => entry.objectType === "LIGHTHOUSE"
  );

  assert.ok(assignment);
  assert.equal(assignment.recipeId, "RECIPE_LANDMARK_LIGHTHOUSE_001");
});

test("lod assignment includes close gameplay and map rules", () => {
  const resolver = createResolver();
  const assignment = resolver.assignments.entries.find(
    (entry) => entry.objectType === "CAFE"
  );

  assert.ok(assignment);
  assert.deepEqual(assignment.lodRules, ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]);
});

test("same inputs produce deterministic same asset assignments", () => {
  const classificationLayer = createClassificationLayer();
  const relationships = createRelationshipLayer(classificationLayer);
  const first = recipeResolverModule.createAtlasAssetRecipeResolver(
    classificationLayer,
    relationships
  );
  const second = recipeResolverModule.createAtlasAssetRecipeResolver(
    classificationLayer,
    relationships
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicAssignment, true);
});

test("explicit asset assignment validation passes contract checks", () => {
  const resolver = createResolver();
  const validation = recipeResolverModule.validateAtlasAssetRecipeResolver(resolver);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.atlasAssetRecipeResolver.validation.recipeExists,
    true
  );
  assert.equal(
    validation.atlasAssetRecipeResolver.validation.geometryPreserved,
    true
  );
});

function findAssignment(resolver, objectId) {
  const assignment = resolver.assignments.entries.find((entry) => entry.objectId === objectId);
  assert.ok(assignment, `Expected assignment for ${objectId}.`);
  return assignment;
}

function syntheticObject(objectId, realWorldType, growgoClassification, geometryReference) {
  return {
    objectId,
    sourceReference: {
      sourceFeatureId: objectId.toLowerCase(),
      provider: "fixture-provider",
      normalizedFeatureId: objectId.toLowerCase(),
      normalizationVersion: "1"
    },
    realWorldType,
    growgoClassification,
    geometryReference,
    presentationReference: `${objectId}_PRESENTATION`,
    gameplayTags: ["coverage_test"],
    questCompatibility: "QUEST_SUPPORTED"
  };
}

function polygon(x, y) {
  return [
    [x, y],
    [x + 0.005, y],
    [x + 0.005, y - 0.005],
    [x, y - 0.005]
  ];
}
