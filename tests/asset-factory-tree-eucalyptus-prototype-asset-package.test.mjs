import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const prototypeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "tree-eucalyptus-prototype-asset-package.mjs"
  )
);

test("tree eucalyptus prototype asset package validates the first organic prototype package", () => {
  const result = prototypeModule.validateTreeEucalyptusPrototypeAssetPackage();

  assert.equal(result.ok, true);
  assert.equal(
    result.prototypeAssetPackage.package.assetId,
    "TREE_EUCALYPTUS_001"
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

test("tree eucalyptus prototype asset package defines modular components, materials, and variations", () => {
  const prototypeAssetPackage =
    prototypeModule.createTreeEucalyptusPrototypeAssetPackage();

  assert.equal(
    prototypeAssetPackage.geometryRequirements.componentDefinitions.length,
    5
  );
  assert.equal(
    prototypeAssetPackage.materialRequirements.materialDefinitions.length,
    3
  );
  assert.deepEqual(prototypeAssetPackage.geometryRequirements.variationSupport, [
    "small",
    "medium",
    "large"
  ]);
});

test("tree eucalyptus prototype asset package preserves LOD and scene contract readiness", () => {
  const prototypeAssetPackage =
    prototypeModule.createTreeEucalyptusPrototypeAssetPackage();

  assert.deepEqual(prototypeAssetPackage.geometryRequirements.collectionContract, [
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "LOD2",
    "LOD3",
    "EXPORT"
  ]);
  assert.equal(
    prototypeAssetPackage.lodRequirements.distantSilhouette.output,
    "TREE_EUCALYPTUS_001_LOD_DISTANT_SILHOUETTE.glb"
  );
  assert.equal(prototypeAssetPackage.assetManifest.manifestReady, true);
});

test("tree eucalyptus prototype asset package rejects invalid variation support safely", () => {
  const invalidPrototype = structuredClone(
    prototypeModule.treeEucalyptusPrototypeAssetPackageDefinition
  );
  invalidPrototype.geometryRequirements.variationSupport = ["small", "giant"];

  const result =
    prototypeModule.validateTreeEucalyptusPrototypeAssetPackage(
      invalidPrototype
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "invalid_variation_support");
});
