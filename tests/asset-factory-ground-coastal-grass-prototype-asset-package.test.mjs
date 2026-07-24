import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const prototypeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-prototype-asset-package.mjs"
  )
);

test("ground coastal grass prototype asset package validates the first generated prototype package", () => {
  const result =
    prototypeModule.validateGroundCoastalGrassPrototypeAssetPackage();

  assert.equal(result.ok, true);
  assert.equal(
    result.prototypeAssetPackage.package.assetId,
    "GROUND_COASTAL_GRASS_001"
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

test("ground coastal grass prototype asset package preserves GLB export and manifest readiness", () => {
  const prototypeAssetPackage =
    prototypeModule.createGroundCoastalGrassPrototypeAssetPackage();

  assert.equal(prototypeAssetPackage.exportMetadata.format, "glb");
  assert.equal(prototypeAssetPackage.assetManifest.manifestReady, true);
  assert.equal(
    prototypeAssetPackage.lodRequirements.distantSilhouette.output,
    "GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb"
  );
});

test("ground coastal grass prototype asset package preserves the Blender scene contract", () => {
  const prototypeAssetPackage =
    prototypeModule.createGroundCoastalGrassPrototypeAssetPackage();

  assert.deepEqual(prototypeAssetPackage.geometryRequirements.collectionContract, [
    "GEOMETRY",
    "MATERIALS",
    "LOD0",
    "LOD1",
    "LOD2",
    "LOD3",
    "EXPORT"
  ]);
});

test("ground coastal grass prototype asset package rejects recipe mismatches safely", () => {
  const invalidPrototype = structuredClone(
    prototypeModule.groundCoastalGrassPrototypeAssetPackageDefinition
  );
  invalidPrototype.assetSourceDefinition.recipeReference =
    "GROUND_COASTAL_GRASS_RECIPE_999";

  const result =
    prototypeModule.validateGroundCoastalGrassPrototypeAssetPackage(
      invalidPrototype
    );

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "recipe_reference_mismatch");
});
