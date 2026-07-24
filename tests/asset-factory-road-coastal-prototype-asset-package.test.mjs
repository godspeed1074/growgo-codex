import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const prototypeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "road-coastal-prototype-asset-package.mjs"
  )
);

test("road coastal prototype asset package validates the coastal road prototype package", () => {
  const result = prototypeModule.validateRoadCoastalPrototypeAssetPackage();

  assert.equal(result.ok, true);
  assert.equal(
    result.prototypeAssetPackage.package.assetId,
    "ROAD_COASTAL_001"
  );
  assert.equal(
    result.prototypeAssetPackage.compatibility.realBlenderExecutionOccurred,
    false
  );
  assert.equal(
    result.prototypeAssetPackage.compatibility.glbArtifactProduced,
    false
  );
});

test("road coastal prototype asset package defines modular components, variants, and placement metadata", () => {
  const prototypeAssetPackage =
    prototypeModule.createRoadCoastalPrototypeAssetPackage();

  assert.equal(
    prototypeAssetPackage.geometryRequirements.componentDefinitions.length,
    6
  );
  assert.deepEqual(prototypeAssetPackage.geometryRequirements.variants, [
    "small",
    "medium",
    "main"
  ]);
  assert.equal(
    prototypeAssetPackage.placementMetadata.connectionType,
    "coastal_road_network"
  );
});

test("road coastal prototype asset package preserves scene contract and export readiness", () => {
  const prototypeAssetPackage =
    prototypeModule.createRoadCoastalPrototypeAssetPackage();

  assert.deepEqual(prototypeAssetPackage.geometryRequirements.collectionContract, [
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "LOD2",
    "LOD3",
    "EXPORT"
  ]);
  assert.equal(prototypeAssetPackage.exportMetadata.format, "glb");
  assert.equal(
    prototypeAssetPackage.validationMetadata.performanceMetadata.gpuVertexBudget,
    180
  );
});

test("road coastal prototype asset package rejects invalid terrain compatibility safely", () => {
  const invalidPrototype = structuredClone(
    prototypeModule.roadCoastalPrototypeAssetPackageDefinition
  );
  invalidPrototype.placementMetadata.terrainCompatibility = ["grass", "lava"];

  const result = prototypeModule.validateRoadCoastalPrototypeAssetPackage(
    invalidPrototype
  );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_terrain_compatibility");
});
