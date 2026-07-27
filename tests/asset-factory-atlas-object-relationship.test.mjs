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

function createRelationshipLayer() {
  return relationshipModule.createAtlasObjectRelationshipLayer(
    createClassificationLayer()
  );
}

test("business relationships connect cafe to transport and nearby park context", () => {
  const layer = createRelationshipLayer();
  const servedByRoad = layer.relationships.entries.find(
    (entry) =>
      entry.fromObjectId === "BUILDING_REF_SERVICE_poi_coast_003_PRESENTATION_OBJECT" &&
      entry.relationshipType === "served_by_road"
  );
  const businessArea = layer.relationships.entries.find(
    (entry) =>
      entry.fromObjectId === "BUILDING_REF_SERVICE_poi_coast_003_PRESENTATION_OBJECT" &&
      entry.relationshipType === "business_area"
  );

  assert.ok(servedByRoad);
  assert.equal(servedByRoad.relationshipDomain, "TRANSPORT");
  assert.equal(
    servedByRoad.toObjectId,
    "TRANSPORT_ROUTE_transport_coast_001_PRESENTATION_OBJECT"
  );
  assert.ok(businessArea);
  assert.equal(businessArea.relationshipDomain, "COMMERCIAL");
});

test("park relationships include trail-style transport connection and waterfront context", () => {
  const layer = createRelationshipLayer();
  const parkTrail = layer.relationships.entries.find(
    (entry) =>
      entry.fromObjectId === "PARK_nat_coast_002_PRESENTATION_OBJECT" &&
      entry.relationshipType === "park_has_trail"
  );
  const waterfront = layer.relationships.entries.find(
    (entry) =>
      entry.fromObjectId === "PARK_nat_coast_002_PRESENTATION_OBJECT" &&
      entry.relationshipType === "waterfront_relationship"
  );

  assert.ok(parkTrail);
  assert.equal(parkTrail.toObjectId, "TRANSPORT_ROUTE_transport_coast_001_PRESENTATION_OBJECT");
  assert.ok(waterfront);
  assert.ok(
    [
      "BEACH_nat_coast_001_PRESENTATION_OBJECT",
      "WATERWAY_nat_coast_004_PRESENTATION_OBJECT"
    ].includes(waterfront.toObjectId)
  );
});

test("landmark relationships include reachability and nature-area membership", () => {
  const layer = createRelationshipLayer();
  const reachable = layer.relationships.entries.find(
    (entry) =>
      entry.fromObjectId === "BUILDING_REF_LANDMARK_poi_coast_001_PRESENTATION_OBJECT" &&
      entry.relationshipType === "reachable"
  );
  const inNature = layer.relationships.entries.find(
    (entry) =>
      entry.fromObjectId === "BUILDING_REF_LANDMARK_poi_coast_001_PRESENTATION_OBJECT" &&
      entry.relationshipType === "landmark_in_nature_area"
  );

  assert.ok(reachable);
  assert.equal(reachable.relationshipDomain, "SPATIAL");
  assert.ok(inNature);
  assert.equal(inNature.relationshipDomain, "NATURAL");
});

test("transport relationships connect route back to served world objects", () => {
  const layer = createRelationshipLayer();
  const transportConnections = layer.relationships.entries.filter(
    (entry) =>
      entry.fromObjectId === "TRANSPORT_ROUTE_transport_coast_001_PRESENTATION_OBJECT" &&
      entry.relationshipType === "connected"
  );

  assert.ok(transportConnections.length >= 2);
  assert.ok(
    transportConnections.some(
      (entry) => entry.toObjectId === "BUILDING_REF_SERVICE_poi_coast_003_PRESENTATION_OBJECT"
    )
  );
  assert.ok(
    transportConnections.some(
      (entry) => entry.toObjectId === "PARK_nat_coast_002_PRESENTATION_OBJECT"
    )
  );
});

test("same world object input produces deterministic same relationships", () => {
  const classificationLayer = createClassificationLayer();
  const first = relationshipModule.createAtlasObjectRelationshipLayer(
    classificationLayer
  );
  const second = relationshipModule.createAtlasObjectRelationshipLayer(
    classificationLayer
  );

  assert.deepEqual(first, second);
  assert.equal(first.validation.deterministicOutput, true);
});

test("explicit relationship validation passes contract checks", () => {
  const layer = createRelationshipLayer();
  const validation = relationshipModule.validateAtlasObjectRelationshipLayer(layer);

  assert.equal(validation.ok, true);
  assert.equal(
    validation.atlasObjectRelationshipLayer.validation.relationshipReferencesValidObjects,
    true
  );
  assert.equal(
    validation.atlasObjectRelationshipLayer.validation.sourceReferencesPreserved,
    true
  );
});
