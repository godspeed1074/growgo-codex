import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const assetPackageModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "first-blender-generated-lighthouse-prototype-asset-package.mjs"
  )
);

test("first blender generated lighthouse prototype asset package validates the passive lighthouse package structure", () => {
  const result =
    assetPackageModule.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage();

  assert.equal(result.ok, true);
  assert.equal(
    result.lighthouseAssetPackage.prototypeAssetPackage.assetId,
    "LIGHTHOUSE_ISLAND_ROCKY_001"
  );
  assert.equal(
    result.lighthouseAssetPackage.prototypeAssetPackage.modelReferences.primary,
    "LIGHTHOUSE_ISLAND_ROCKY_001.glb"
  );
  assert.equal(
    result.lighthouseAssetPackage.prototypeAssetPackage.prototypeComponentDefinitions
      .length,
    6
  );
});

test("first blender generated lighthouse prototype asset package includes day, sunset, and night profiles", () => {
  const result =
    assetPackageModule.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage();

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.lighthouseAssetPackage.prototypeAssetPackage.appearanceProfiles,
    [
      "DAY_COASTAL_LIGHTHOUSE",
      "SUNSET_COASTAL_LIGHTHOUSE",
      "NIGHT_COASTAL_LIGHTHOUSE"
    ]
  );
  assert.equal(
    result.lighthouseAssetPackage.prototypeAssetPackage.metadata.productionReady,
    false
  );
});

test("same lighthouse prototype asset package definition produces identical passive output", () => {
  const first =
    assetPackageModule.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage();
  const second =
    assetPackageModule.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.lighthouseAssetPackage, second.lighthouseAssetPackage);
});

test("first blender generated lighthouse prototype asset package rejects component and texture mismatches safely", () => {
  const invalidComponent =
    assetPackageModule.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage({
      ...assetPackageModule.firstBlenderGeneratedLighthousePrototypeAssetPackageDefinition,
      prototypeComponentDefinitions: [
        {
          ...assetPackageModule.firstBlenderGeneratedLighthousePrototypeAssetPackageDefinition
            .prototypeComponentDefinitions[0],
          type: "lighthouse_tower_base_mutated"
        },
        ...assetPackageModule.firstBlenderGeneratedLighthousePrototypeAssetPackageDefinition.prototypeComponentDefinitions.slice(
          1
        )
      ]
    });

  const invalidTexture =
    assetPackageModule.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage({
      ...assetPackageModule.firstBlenderGeneratedLighthousePrototypeAssetPackageDefinition,
      textureReferences: ["LIGHTHOUSE_UNKNOWN_TEXTURE_001"]
    });

  assert.equal(invalidComponent.ok, false);
  assert.equal(invalidComponent.errorCode, "component_definition_mismatch");
  assert.equal(invalidTexture.ok, false);
  assert.equal(invalidTexture.errorCode, "texture_reference_mismatch");
});

test("first blender generated lighthouse prototype asset package remains passive and creates no final GLB runtime objects", () => {
  const result =
    assetPackageModule.validateFirstBlenderGeneratedLighthousePrototypeAssetPackage();

  assert.equal(result.ok, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.lighthouseAssetPackage, "canvas"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.lighthouseAssetPackage.prototypeAssetPackage,
      "glbBinary"
    ),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      result.lighthouseAssetPackage,
      "runtimeRenderer"
    ),
    false
  );
});
