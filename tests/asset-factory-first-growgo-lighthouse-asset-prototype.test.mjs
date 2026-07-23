import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "first-growgo-lighthouse-asset-prototype.mjs"
  )
);

test("first lighthouse asset prototype validates the approved six-module prototype structure", () => {
  const result = moduleUnderTest.validateFirstGrowGoLighthouseAssetPrototype();

  assert.equal(result.ok, true);
  assert.equal(result.lighthousePrototype.prototypeAsset.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(result.lighthousePrototype.prototypeModuleDefinitions.length, 6);
  assert.deepEqual(
    result.lighthousePrototype.prototypeAsset.componentReferences,
    [
      "LIGHTHOUSE_TOWER_BASE_001",
      "LIGHTHOUSE_TOWER_BODY_TALL_001",
      "LIGHTHOUSE_LANTERN_BASE_001",
      "LIGHTHOUSE_GLASS_RING_001",
      "LIGHTHOUSE_ROOF_CAP_001",
      "LIGHTHOUSE_BEAM_EFFECT_001"
    ]
  );
});

test("first lighthouse asset prototype records the expected reuse summary", () => {
  const result = moduleUnderTest.validateFirstGrowGoLighthouseAssetPrototype();

  assert.equal(result.ok, true);
  assert.equal(result.lighthousePrototype.modularLibraryAudit.reusableExistingModules.length, 0);
  assert.equal(result.lighthousePrototype.modularLibraryAudit.reuseSummary.totalModuleCount, 6);
  assert.equal(result.lighthousePrototype.modularLibraryAudit.reuseSummary.newModuleCount, 6);
  assert.equal(result.lighthousePrototype.modularLibraryAudit.reuseSummary.reusePercentage, 0);
});

test("same lighthouse prototype definition produces identical passive output", () => {
  const first = moduleUnderTest.validateFirstGrowGoLighthouseAssetPrototype();
  const second = moduleUnderTest.validateFirstGrowGoLighthouseAssetPrototype();

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(first.lighthousePrototype, second.lighthousePrototype);
});

test("first lighthouse asset prototype rejects component and appearance mismatches safely", () => {
  const invalidComponent = moduleUnderTest.validateFirstGrowGoLighthouseAssetPrototype({
    ...moduleUnderTest.firstGrowGoLighthouseAssetPrototypeDefinition,
    prototypeAsset: {
      ...moduleUnderTest.firstGrowGoLighthouseAssetPrototypeDefinition.prototypeAsset,
      componentReferences: [
        "LIGHTHOUSE_TOWER_BASE_001",
        "LIGHTHOUSE_TOWER_BODY_TALL_001"
      ]
    }
  });

  const invalidAppearance = moduleUnderTest.validateFirstGrowGoLighthouseAssetPrototype({
    ...moduleUnderTest.firstGrowGoLighthouseAssetPrototypeDefinition,
    prototypeAsset: {
      ...moduleUnderTest.firstGrowGoLighthouseAssetPrototypeDefinition.prototypeAsset,
      appearanceProfiles: ["DAY_COASTAL_LIGHTHOUSE", "NIGHT_ONLY_LIGHTHOUSE"]
    }
  });

  assert.equal(invalidComponent.ok, false);
  assert.equal(invalidComponent.errorCode, "prototype_component_mismatch");
  assert.equal(invalidAppearance.ok, false);
  assert.equal(invalidAppearance.errorCode, "appearance_profile_mismatch");
});

test("first lighthouse asset prototype remains passive and creates no final runtime assets", () => {
  const result = moduleUnderTest.validateFirstGrowGoLighthouseAssetPrototype();

  assert.equal(result.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call(result.lighthousePrototype, "canvas"), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.lighthousePrototype.prototypeAsset, "glbBinary"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(result.lighthousePrototype, "runtimeRenderer"),
    false
  );
});
