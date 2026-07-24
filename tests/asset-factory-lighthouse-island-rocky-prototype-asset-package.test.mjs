import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const prototypeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "lighthouse-island-rocky-prototype-asset-package.mjs"
  )
);

test("lighthouse island rocky prototype asset package validates the landmark prototype package", () => {
  const result =
    prototypeModule.validateLighthouseIslandRockyPrototypeAssetPackage();

  assert.equal(result.ok, true);
  assert.equal(
    result.prototypeAssetPackage.package.assetId,
    "LIGHTHOUSE_ISLAND_ROCKY_001"
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

test("lighthouse island rocky prototype asset package defines landmark components, appearance profiles, and placement metadata", () => {
  const prototypeAssetPackage =
    prototypeModule.createLighthouseIslandRockyPrototypeAssetPackage();

  assert.equal(
    prototypeAssetPackage.geometryRequirements.componentDefinitions.length,
    10
  );
  assert.deepEqual(prototypeAssetPackage.materialRequirements.appearanceProfiles, [
    "day",
    "sunset",
    "night"
  ]);
  assert.equal(prototypeAssetPackage.placementMetadata.viewpointValue, "high");
  assert.equal(prototypeAssetPackage.placementMetadata.questEligibility, true);
  assert.equal(prototypeAssetPackage.placementMetadata.captureEligibility, false);
});

test("lighthouse island rocky prototype asset package preserves scene contract and export readiness", () => {
  const prototypeAssetPackage =
    prototypeModule.createLighthouseIslandRockyPrototypeAssetPackage();

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
    480
  );
});

test("lighthouse island rocky prototype asset package rejects invalid appearance profiles safely", () => {
  const invalidPrototype = structuredClone(
    prototypeModule.lighthouseIslandRockyPrototypeAssetPackageDefinition
  );
  invalidPrototype.materialRequirements.appearanceProfiles = [
    "day",
    "storm"
  ];

  const result =
    prototypeModule.validateLighthouseIslandRockyPrototypeAssetPackage(
      invalidPrototype
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_appearance_profile");
});
