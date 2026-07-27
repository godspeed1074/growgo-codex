import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const resolverModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "nature-environment-recipe-resolver.mjs"
  )
);
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

function createDirectInput() {
  return {
    layerId: "TEST_NATURE_ENVIRONMENT_INPUT",
    naturalFeatureObjects: [
      {
        objectId: "PARK_COASTAL_001",
        realWorldType: "PARK",
        growgoClassification: "PARK",
        gameplayTags: ["exploration", "nature"]
      },
      {
        objectId: "GARDEN_SUBURBAN_001",
        realWorldType: "PARK",
        growgoClassification: "PARK",
        gameplayTags: ["exploration", "nature"]
      },
      {
        objectId: "FOREST_EDGE_001",
        realWorldType: "FOREST",
        growgoClassification: "NATURAL_FEATURE",
        gameplayTags: ["exploration", "nature"]
      },
      {
        objectId: "BEACH_EDGE_001",
        realWorldType: "BEACH",
        growgoClassification: "NATURAL_FEATURE",
        gameplayTags: ["exploration", "nature", "coastal"]
      }
    ],
    biomeMetadataByObjectId: {
      PARK_COASTAL_001: ["COASTAL", "FORESHORE_PARKLAND"],
      GARDEN_SUBURBAN_001: ["SUBURBAN_GARDEN", "URBAN_STREET"],
      FOREST_EDGE_001: ["TEMPERATE_FOREST_EDGE"],
      BEACH_EDGE_001: ["COASTAL", "BEACH_EDGE"]
    }
  };
}

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

test("coastal park assignment selects coastal tree grass and rock assets", () => {
  const resolver = resolverModule.createNatureEnvironmentRecipeResolver(
    createDirectInput(),
    {
      environmentClassificationByObjectId: {
        PARK_COASTAL_001: "COASTAL_PARK"
      }
    }
  );
  const assignment = resolver.assignments.entries.find(
    (entry) => entry.objectId === "PARK_COASTAL_001"
  );

  assert.ok(assignment);
  assert.equal(assignment.recipeId, "COASTAL_PARK_RECIPE_001");
  assert.deepEqual(
    assignment.selectedAssets.map((asset) => asset.assetId),
    ["TREE_COASTAL_001", "GROUND_COASTAL_GRASS_001", "ROCK_COASTAL_001"]
  );
});

test("suburban garden assignment selects eucalyptus bushes and grass", () => {
  const resolver = resolverModule.createNatureEnvironmentRecipeResolver(
    createDirectInput(),
    {
      environmentClassificationByObjectId: {
        GARDEN_SUBURBAN_001: "SUBURBAN_GARDEN"
      }
    }
  );
  const assignment = resolver.assignments.entries.find(
    (entry) => entry.objectId === "GARDEN_SUBURBAN_001"
  );

  assert.ok(assignment);
  assert.equal(assignment.recipeId, "SUBURBAN_GARDEN_RECIPE_001");
  assert.deepEqual(
    assignment.selectedAssets.map((asset) => asset.assetId),
    ["TREE_EUCALYPTUS_001", "BUSH_NATIVE_001", "GROUND_COASTAL_GRASS_001"]
  );
});

test("forest assignment selects forest recipe asset combination", () => {
  const resolver = resolverModule.createNatureEnvironmentRecipeResolver(
    createDirectInput()
  );
  const assignment = resolver.assignments.entries.find(
    (entry) => entry.objectId === "FOREST_EDGE_001"
  );

  assert.ok(assignment);
  assert.equal(assignment.environmentType, "FOREST");
  assert.equal(assignment.recipeId, "FOREST_RECIPE_001");
  assert.ok(assignment.biomeRules.includes("TEMPERATE_FOREST_EDGE"));
});

test("beach assignment selects beach recipe asset combination", () => {
  const resolver = resolverModule.createNatureEnvironmentRecipeResolver(
    createDirectInput()
  );
  const assignment = resolver.assignments.entries.find(
    (entry) => entry.objectId === "BEACH_EDGE_001"
  );

  assert.ok(assignment);
  assert.equal(assignment.recipeId, "BEACH_RECIPE_001");
  assert.deepEqual(
    assignment.selectedAssets.map((asset) => asset.assetId),
    ["GROUND_COASTAL_GRASS_001", "GROUND_COASTAL_GRASS_001", "ROCK_COASTAL_001"]
  );
});

test("same inputs produce deterministic same nature assignments", () => {
  const input = createDirectInput();
  const first = resolverModule.createNatureEnvironmentRecipeResolver(input);
  const second = resolverModule.createNatureEnvironmentRecipeResolver(input);

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicAssignment, true);
});

test("classification layer input resolves natural presentation objects deterministically", () => {
  const classificationLayer = createClassificationLayer();
  const resolver = resolverModule.createNatureEnvironmentRecipeResolver(
    classificationLayer,
    {
      biomeMetadataByObjectId: {
        PARK_nat_coast_002_PRESENTATION_OBJECT: ["COASTAL", "FORESHORE_PARKLAND"],
        RESERVE_nat_coast_003_PRESENTATION_OBJECT: ["COASTAL", "SUBURBAN_PARKLAND"],
        BEACH_nat_coast_001_PRESENTATION_OBJECT: ["COASTAL", "BEACH_EDGE"],
        WATERWAY_nat_coast_004_PRESENTATION_OBJECT: ["RIVER_CORRIDOR"]
      },
      environmentClassificationByObjectId: {
        PARK_nat_coast_002_PRESENTATION_OBJECT: "COASTAL_PARK",
        RESERVE_nat_coast_003_PRESENTATION_OBJECT: "COASTAL_PARK",
        BEACH_nat_coast_001_PRESENTATION_OBJECT: "BEACH"
      }
    }
  );

  assert.ok(resolver.assignments.entries.length >= 3);
  assert.equal(resolver.validation.validationPassed, true);
});

test("explicit nature recipe validation passes contract checks", () => {
  const resolver = resolverModule.createNatureEnvironmentRecipeResolver(
    createDirectInput()
  );
  const validation =
    resolverModule.validateNatureEnvironmentRecipeResolver(resolver);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.natureEnvironmentRecipeResolver.validation.assetsExist,
    true
  );
  assert.equal(
    validation.natureEnvironmentRecipeResolver.validation.biomeCompatibilityValid,
    true
  );
  assert.equal(
    validation.natureEnvironmentRecipeResolver.validation.atlasCompatibilityValid,
    true
  );
});
