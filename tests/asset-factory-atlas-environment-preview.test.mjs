import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const previewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-environment-preview.mjs"
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
const relationshipModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-object-relationship.mjs"
  )
);
const natureResolverModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "nature-environment-recipe-resolver.mjs"
  )
);

function createDirectPreviewInput() {
  return {
    schemaId: "GROWGO_WORLD_OBJECTS_001",
    objects: [
      {
        objectId: "PARK_COASTAL_001",
        sourceReference: { sourceFeatureId: "park_001", provider: "fixture-provider" },
        realWorldType: "PARK",
        growgoClassification: "PARK",
        geometryReference: [
          [145.10, -38.31],
          [145.11, -38.31],
          [145.11, -38.32],
          [145.10, -38.32]
        ],
        presentationReference: "PARK_COASTAL_001_PRESENTATION",
        gameplayTags: ["exploration", "nature"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "GREENSPACE_SUBURBAN_001",
        sourceReference: { sourceFeatureId: "greenspace_001", provider: "fixture-provider" },
        realWorldType: "PARK",
        growgoClassification: "PARK",
        geometryReference: [
          [145.20, -38.40],
          [145.21, -38.40],
          [145.21, -38.41],
          [145.20, -38.41]
        ],
        presentationReference: "GREENSPACE_SUBURBAN_001_PRESENTATION",
        gameplayTags: ["exploration", "nature"],
        questCompatibility: "QUEST_OPTIONAL"
      },
      {
        objectId: "BEACH_EDGE_001",
        sourceReference: { sourceFeatureId: "beach_001", provider: "fixture-provider" },
        realWorldType: "BEACH",
        growgoClassification: "NATURAL_FEATURE",
        geometryReference: [
          [145.30, -38.50],
          [145.32, -38.50],
          [145.32, -38.51],
          [145.30, -38.51]
        ],
        presentationReference: "BEACH_EDGE_001_PRESENTATION",
        gameplayTags: ["exploration", "nature", "coastal"],
        questCompatibility: "QUEST_OPTIONAL"
      }
    ]
  };
}

function createDirectRelationshipInput() {
  return {
    schemaId: "ATLAS_OBJECT_RELATIONSHIPS_001",
    entries: [
      {
        relationshipId: "PARK_COASTAL_001_TO_ROUTE_CONNECTED",
        fromObjectId: "PARK_COASTAL_001",
        toObjectId: "ROUTE_001",
        relationshipType: "connected",
        relationshipDomain: "SPATIAL"
      },
      {
        relationshipId: "PARK_COASTAL_001_TO_ROUTE_TRAIL",
        fromObjectId: "PARK_COASTAL_001",
        toObjectId: "ROUTE_001",
        relationshipType: "park_has_trail",
        relationshipDomain: "NATURAL"
      },
      {
        relationshipId: "GREENSPACE_SUBURBAN_001_TO_ROUTE_CONNECTED",
        fromObjectId: "GREENSPACE_SUBURBAN_001",
        toObjectId: "ROUTE_001",
        relationshipType: "connected",
        relationshipDomain: "SPATIAL"
      },
      {
        relationshipId: "BEACH_EDGE_001_TO_WATERFRONT",
        fromObjectId: "BEACH_EDGE_001",
        toObjectId: "WATERFRONT_001",
        relationshipType: "waterfront_relationship",
        relationshipDomain: "NATURAL"
      }
    ]
  };
}

function createNatureResolverForDirectInput() {
  const worldObjects = createDirectPreviewInput();
  return natureResolverModule.createNatureEnvironmentRecipeResolver(worldObjects, {
    biomeMetadataByObjectId: {
      PARK_COASTAL_001: ["COASTAL", "FORESHORE_PARKLAND"],
      GREENSPACE_SUBURBAN_001: ["SUBURBAN_GARDEN", "URBAN_STREET"],
      BEACH_EDGE_001: ["COASTAL", "BEACH_EDGE"]
    },
    environmentClassificationByObjectId: {
      PARK_COASTAL_001: "COASTAL_PARK",
      GREENSPACE_SUBURBAN_001: "SUBURBAN_GARDEN",
      BEACH_EDGE_001: "BEACH"
    }
  });
}

function createClassificationPipeline() {
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
  const classificationLayer =
    classificationModule.createGrowgoObjectClassificationLayer(atlasLayer);
  const relationshipLayer =
    relationshipModule.createAtlasObjectRelationshipLayer(classificationLayer);
  const natureResolver = natureResolverModule.createNatureEnvironmentRecipeResolver(
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
        RESERVE_nat_coast_003_PRESENTATION_OBJECT: "SUBURBAN_GARDEN",
        BEACH_nat_coast_001_PRESENTATION_OBJECT: "BEACH"
      }
    }
  );

  return { classificationLayer, relationshipLayer, natureResolver };
}

test("coastal park preview preserves park boundary and coastal assignment", () => {
  const previewLayer = previewModule.createAtlasEnvironmentPreviewLayer(
    createDirectPreviewInput(),
    createDirectRelationshipInput(),
    createNatureResolverForDirectInput()
  );
  const preview = previewLayer.previewObjects.entries.find(
    (entry) => entry.objectId === "PARK_COASTAL_001"
  );

  assert.ok(preview);
  assert.equal(preview.previewType, "COASTAL_PARK_PREVIEW");
  assert.equal(preview.environmentRecipe, "COASTAL_PARK_RECIPE_001");
  assert.ok(preview.previewMetadata.relationshipHints.includes("park_has_trail"));
});

test("suburban greenspace preview maps garden recipe into greenspace preview type", () => {
  const previewLayer = previewModule.createAtlasEnvironmentPreviewLayer(
    createDirectPreviewInput(),
    createDirectRelationshipInput(),
    createNatureResolverForDirectInput()
  );
  const preview = previewLayer.previewObjects.entries.find(
    (entry) => entry.objectId === "GREENSPACE_SUBURBAN_001"
  );

  assert.ok(preview);
  assert.equal(preview.previewType, "SUBURBAN_GREENSPACE_PREVIEW");
  assert.equal(preview.environmentRecipe, "SUBURBAN_GARDEN_RECIPE_001");
  assert.deepEqual(
    preview.assignedAssets.map((asset) => asset.assetId),
    ["TREE_EUCALYPTUS_001", "BUSH_NATIVE_001", "GROUND_COASTAL_GRASS_001"]
  );
});

test("beach preview preserves coastline geometry reference and beach treatment", () => {
  const worldObjects = createDirectPreviewInput();
  const previewLayer = previewModule.createAtlasEnvironmentPreviewLayer(
    worldObjects,
    createDirectRelationshipInput(),
    createNatureResolverForDirectInput()
  );
  const preview = previewLayer.previewObjects.entries.find(
    (entry) => entry.objectId === "BEACH_EDGE_001"
  );
  const source = worldObjects.objects.find((entry) => entry.objectId === "BEACH_EDGE_001");

  assert.ok(preview);
  assert.equal(preview.previewType, "BEACH_EDGE_PREVIEW");
  assert.equal(preview.environmentRecipe, "BEACH_RECIPE_001");
  assert.deepEqual(preview.sourceGeometryReference, source.geometryReference);
});

test("asset assignment validation keeps preview assets present and recipes valid", () => {
  const previewLayer = previewModule.createAtlasEnvironmentPreviewLayer(
    createDirectPreviewInput(),
    createDirectRelationshipInput(),
    createNatureResolverForDirectInput()
  );

  assert.equal(previewLayer.validation.assetsExist, true);
  assert.equal(previewLayer.validation.recipesValid, true);
  assert.equal(previewLayer.validation.sourceGeometryPreserved, true);
});

test("same inputs produce deterministic same preview output", () => {
  const first = previewModule.createAtlasEnvironmentPreviewLayer(
    createDirectPreviewInput(),
    createDirectRelationshipInput(),
    createNatureResolverForDirectInput()
  );
  const second = previewModule.createAtlasEnvironmentPreviewLayer(
    createDirectPreviewInput(),
    createDirectRelationshipInput(),
    createNatureResolverForDirectInput()
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});

test("classification pipeline input produces valid preview layer", () => {
  const { classificationLayer, relationshipLayer, natureResolver } =
    createClassificationPipeline();
  const previewLayer = previewModule.createAtlasEnvironmentPreviewLayer(
    classificationLayer,
    relationshipLayer,
    natureResolver
  );

  assert.ok(previewLayer.previewObjects.entries.length >= 3);
  assert.equal(previewLayer.validation.validationPassed, true);
});
