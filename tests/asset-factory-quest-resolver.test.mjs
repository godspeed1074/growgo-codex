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
const questResolverModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "quest-resolver.mjs")
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

function createQuestResolverLayer() {
  return questResolverModule.createQuestResolverLayer(createClassificationLayer());
}

test("bakery quest resolution matches a real bakery business object", () => {
  const classificationLayer = createClassificationLayer();
  const bakeryObject = {
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
  const augmentedWorldObjects = {
    ...classificationLayer.worldObjects,
    objects: [...classificationLayer.worldObjects.objects, bakeryObject]
  };

  const resolution = questResolverModule.resolveQuestLocation(augmentedWorldObjects, {
    requirementId: "QUEST_REQ_BAKERY_001",
    classification: "BUSINESS",
    subtype: "BAKERY",
    requiredTags: ["crafting"]
  });

  assert.equal(resolution.resolutionStatus, "RESOLVED");
  assert.equal(resolution.resolvedObjectId, bakeryObject.objectId);
  assert.equal(resolution.objectType, "BAKERY");
});

test("park quest resolution matches real park object", () => {
  const resolution = questResolverModule.resolveQuestLocation(createQuestResolverLayer(), {
    requirementId: "QUEST_REQ_PARK_001",
    classification: "PARK",
    requiredTags: ["exploration", "nature"]
  });

  assert.equal(resolution.resolutionStatus, "RESOLVED");
  assert.equal(resolution.objectType, "PARK");
  assert.ok(resolution.gameplayTags.includes("exploration"));
  assert.ok(resolution.gameplayTags.includes("nature"));
});

test("landmark quest resolution matches lighthouse object", () => {
  const resolution = questResolverModule.resolveQuestLocation(createQuestResolverLayer(), {
    requirementId: "QUEST_REQ_LANDMARK_001",
    classification: "LANDMARK",
    subtype: "LIGHTHOUSE"
  });

  assert.equal(resolution.resolutionStatus, "RESOLVED");
  assert.equal(resolution.objectType, "LIGHTHOUSE");
  assert.ok(resolution.gameplayTags.includes("achievement"));
});

test("transport quest resolution matches transport object", () => {
  const resolution = questResolverModule.resolveQuestLocation(createQuestResolverLayer(), {
    requirementId: "QUEST_REQ_TRANSPORT_001",
    classification: "TRANSPORT",
    requiredTags: ["travel", "route"]
  });

  assert.equal(resolution.resolutionStatus, "RESOLVED");
  assert.equal(resolution.objectType, "TRANSPORT_ROUTE");
  assert.equal(resolution.accessibilityStatus, "PUBLIC_ACCESS");
});

test("invalid request handling returns deterministic unresolved result without fiction", () => {
  const resolution = questResolverModule.resolveQuestLocation(createQuestResolverLayer(), {
    requirementId: "QUEST_REQ_INVALID_001",
    classification: "BUSINESS",
    subtype: "PETROL_STATION"
  });

  assert.equal(resolution.resolutionStatus, "UNRESOLVED");
  assert.equal(resolution.resolvedObjectId, null);
  assert.equal(resolution.validation.noFictionalLocationsCreated, true);
});

test("quest resolution preserves source reference and remains deterministic", () => {
  const resolverLayer = createQuestResolverLayer();
  const requirement = {
    requirementId: "QUEST_REQ_DETERMINISTIC_001",
    classification: "PARK",
    requiredTags: ["exploration", "nature"]
  };

  const first = questResolverModule.resolveQuestLocation(resolverLayer, requirement);
  const second = questResolverModule.resolveQuestLocation(resolverLayer, requirement);

  assert.deepEqual(first, second);
  assert.equal(first.validation.sourceReferencePreserved, true);
  assert.equal(first.validation.deterministicResolution, true);
});

test("explicit quest resolver layer and resolution validation pass contract checks", () => {
  const resolverLayer = createQuestResolverLayer();
  const resolverValidation = questResolverModule.validateQuestResolverLayer(resolverLayer);
  const resolution = questResolverModule.resolveQuestLocation(resolverLayer, {
    requirementId: "QUEST_REQ_VALIDATE_001",
    classification: "LANDMARK"
  });
  const resolutionValidation =
    questResolverModule.validateQuestLocationResolution(resolution);

  assert.equal(resolverValidation.ok, true);
  assert.equal(resolutionValidation.ok, true);
  assert.equal(
    resolutionValidation.questLocationResolution.validation.objectTypeMatchesRequirement,
    true
  );
});
