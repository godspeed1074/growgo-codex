import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const sourceAdapterModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "source-adapter.mjs")
);
const regionPackageBuilderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "region-package-builder.mjs"
  )
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

function createAtlasLayer() {
  const sourceAdapterLayer = sourceAdapterModule.createSourceAdapterLayer(
    sourceAdapterModule.fixtureSourceBundles.COASTAL_SOURCE_BUNDLE_001
  );
  const regionImportPackage =
    regionPackageBuilderModule.createGrowgoRegionImportPackage(sourceAdapterLayer);
  const runtimeReader =
    runtimeReaderModule.createRegionPackageRuntimeReader(regionImportPackage);
  return atlasPresentationModule.createAtlasPresentationRuntimeLayer(runtimeReader);
}

function createClassificationLayer() {
  return classificationModule.createGrowgoObjectClassificationLayer(createAtlasLayer());
}

test("park classification adds exploration and nature meaning", () => {
  const layer = createClassificationLayer();
  const park = layer.worldObjects.objects.find(
    (object) => object.growgoClassification === "PARK"
  );

  assert.ok(park);
  assert.equal(park.realWorldType, "PARK");
  assert.ok(park.gameplayTags.includes("exploration"));
  assert.ok(park.gameplayTags.includes("nature"));
  assert.ok(park.gameplayTags.includes("wildlife"));
  assert.equal(park.questCompatibility, "QUEST_OPTIONAL");
});

test("bakery classification maps to business gameplay tags", () => {
  const atlasLayer = createAtlasLayer();
  const bakeryPresentation = structuredClone(
    atlasLayer.presentationObjects.buildingPresentations.find(
      (presentation) => presentation.buildingType === "CAFE"
    )
  );
  bakeryPresentation.presentationId = "BUILDING_REF_SERVICE_poi_bakery_PRESENTATION";
  bakeryPresentation.buildingType = "BAKERY";
  bakeryPresentation.assetRecipe = "RECIPE_BUILDING_SERVICE_BAKERY_PRESENTATION_001";
  bakeryPresentation.sourceReference = {
    ...bakeryPresentation.sourceReference,
    sourceFeatureId: "poi_bakery_001",
    normalizedFeatureId: "poi_bakery_001"
  };

  const augmentedPresentationObjects = {
    ...atlasLayer.presentationObjects,
    buildingPresentations: [
      ...atlasLayer.presentationObjects.buildingPresentations,
      bakeryPresentation
    ]
  };

  const layer = classificationModule.createGrowgoObjectClassificationLayer(
    augmentedPresentationObjects
  );
  const bakery = layer.worldObjects.objects.find(
    (object) => object.realWorldType === "BAKERY"
  );

  assert.ok(bakery);
  assert.equal(bakery.growgoClassification, "BUSINESS");
  assert.ok(bakery.gameplayTags.includes("crafting"));
  assert.ok(bakery.gameplayTags.includes("food"));
  assert.ok(bakery.gameplayTags.includes("npc_interaction"));
});

test("landmark classification maps to achievement and quest meaning", () => {
  const layer = createClassificationLayer();
  const landmark = layer.worldObjects.objects.find(
    (object) => object.realWorldType === "LIGHTHOUSE"
  );

  assert.ok(landmark);
  assert.equal(landmark.growgoClassification, "LANDMARK");
  assert.ok(landmark.gameplayTags.includes("achievement"));
  assert.ok(landmark.gameplayTags.includes("collection"));
  assert.ok(landmark.gameplayTags.includes("quest"));
});

test("transport classification maps routes into travel gameplay objects", () => {
  const layer = createClassificationLayer();
  const transport = layer.worldObjects.objects.find(
    (object) => object.growgoClassification === "TRANSPORT"
  );

  assert.ok(transport);
  assert.equal(transport.realWorldType, "TRANSPORT_ROUTE");
  assert.ok(transport.gameplayTags.includes("travel"));
  assert.ok(transport.gameplayTags.includes("route"));
  assert.ok(transport.gameplayTags.includes("quest"));
});

test("classification preserves source reference and presentation link", () => {
  const layer = createClassificationLayer();
  const cafe = layer.worldObjects.objects.find(
    (object) => object.realWorldType === "CAFE"
  );

  assert.ok(cafe);
  assert.equal(cafe.sourceReference.sourceFeatureId, "poi_coast_003");
  assert.equal(cafe.presentationReference, "BUILDING_REF_SERVICE_poi_coast_003_PRESENTATION");
});

test("same atlas presentation input produces deterministic same classification output", () => {
  const atlasLayer = createAtlasLayer();
  const first = classificationModule.createGrowgoObjectClassificationLayer(atlasLayer);
  const second = classificationModule.createGrowgoObjectClassificationLayer(atlasLayer);

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});

test("explicit classification validation passes contract checks", () => {
  const layer = createClassificationLayer();
  const validation = classificationModule.validateGrowgoObjectClassificationLayer(layer);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.growgoObjectClassificationLayer.validation.sourceReferencePreserved,
    true
  );
  assert.equal(
    validation.growgoObjectClassificationLayer.validation.classificationValid,
    true
  );
  assert.equal(
    validation.growgoObjectClassificationLayer.validation.gameplayTagsValid,
    true
  );
});
