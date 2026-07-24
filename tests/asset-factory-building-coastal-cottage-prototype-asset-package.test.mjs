import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const prototypeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "building-coastal-cottage-prototype-asset-package.mjs"
  )
);

test("building coastal cottage prototype asset package validates the cottage prototype package", () => {
  const result =
    prototypeModule.validateBuildingCoastalCottagePrototypeAssetPackage();

  assert.equal(result.ok, true);
  assert.equal(
    result.prototypeAssetPackage.package.assetId,
    "BUILDING_COASTAL_COTTAGE_001"
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

test("building coastal cottage prototype asset package defines modular components, variants, and orientations", () => {
  const prototypeAssetPackage =
    prototypeModule.createBuildingCoastalCottagePrototypeAssetPackage();

  assert.equal(
    prototypeAssetPackage.geometryRequirements.componentDefinitions.length,
    10
  );
  assert.deepEqual(prototypeAssetPackage.geometryRequirements.variants, [
    "small",
    "holiday",
    "modern"
  ]);
  assert.deepEqual(prototypeAssetPackage.orientationMetadata.supportedOrientations, [
    "north",
    "south",
    "east",
    "west"
  ]);
});

test("building coastal cottage prototype asset package preserves scene contract and export readiness", () => {
  const prototypeAssetPackage =
    prototypeModule.createBuildingCoastalCottagePrototypeAssetPackage();

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
    320
  );
});

test("building coastal cottage prototype asset package rejects invalid orientation support safely", () => {
  const invalidPrototype = structuredClone(
    prototypeModule.buildingCoastalCottagePrototypeAssetPackageDefinition
  );
  invalidPrototype.orientationMetadata.supportedOrientations = [
    "north",
    "sea-facing"
  ];

  const result =
    prototypeModule.validateBuildingCoastalCottagePrototypeAssetPackage(
      invalidPrototype
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_orientation_support");
});
