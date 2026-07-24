import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-expansion-region-selection-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = [
    "WorldExpansionRegionSelectionMaterialA",
    "WorldExpansionRegionSelectionMaterialB"
  ]
} = {}) {
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: materialNames.map((name) => ({ name }))
  });
  const jsonBytes = new TextEncoder().encode(json);
  const paddedJsonLength = Math.ceil(jsonBytes.length / 4) * 4;
  const totalLength = 12 + 8 + paddedJsonLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, paddedJsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(arrayBuffer, 20, paddedJsonLength).set(jsonBytes);
  return arrayBuffer;
}

function buildLoaderOptions() {
  return {
    existsSync() {
      return true;
    },
    loadArrayBuffer() {
      return Promise.resolve(createSyntheticGlb());
    },
    allowFallbackShowcase: true
  };
}

test("world expansion region selection defaults to the coastal active world safely", async () => {
  const selection =
    await moduleUnderTest.createWorldExpansionRegionSelectionFoundation(
      moduleUnderTest.worldExpansionRegionSelectionFoundationDefinition,
      buildLoaderOptions()
    );

  const validation =
    moduleUnderTest.validateWorldExpansionRegionSelectionFoundation(selection);

  assert.equal(validation.ok, true);
  assert.equal(selection.selectedRegionType, "coastal");
  assert.equal(selection.selectionSource, "default-active-coordinate");
  assert.equal(
    selection.selectedGenerationProfile.generationProfileId,
    "coastal_first_location_generation_profile_001"
  );
  assert.equal(
    selection.selectedAssetProfile.assetProfileId,
    "coastal_first_location_asset_profile_001"
  );
  assert.equal(selection.validationResult.regionSelectionConsistencyValid, true);
  assert.equal(selection.validationResult.safeFallbackValid, true);
  assert.equal(selection.validationResult.deterministicRoutingValid, true);
  assert.equal(selection.validationResult.coastalUnchangedValid, true);
});

test("world expansion region selection previews suburban routing safely without activating new content", async () => {
  const selection =
    await moduleUnderTest.createWorldExpansionRegionSelectionFoundation(
      moduleUnderTest.worldExpansionRegionSelectionFoundationDefinition,
      buildLoaderOptions()
    );
  const suburbanSelection = moduleUnderTest.selectWorldExpansionRegionProfile(
    selection,
    "suburban",
    { selectionSource: "demo-region-selector" }
  );

  assert.equal(suburbanSelection.selectedRegionType, "suburban");
  assert.equal(
    suburbanSelection.selectedGenerationProfile.generationProfileId,
    "suburban_growth_profile_001"
  );
  assert.equal(
    suburbanSelection.selectedAssetProfile.assetProfileId,
    "suburban_existing_asset_profile_001"
  );
  assert.equal(suburbanSelection.selectionSource, "demo-region-selector");
  assert.equal(suburbanSelection.sceneRoute.sceneProfile.fallbackActivated, true);
  assert.equal(
    suburbanSelection.mapDataRoute.providerProfile.fallbackActivated,
    true
  );
  assert.equal(suburbanSelection.validationResult.regionSelectionConsistencyValid, true);
  assert.equal(suburbanSelection.validationResult.safeFallbackValid, true);
});

test("world expansion region selection remains deterministic for repeated urban preview selection", async () => {
  const selection =
    await moduleUnderTest.createWorldExpansionRegionSelectionFoundation(
      moduleUnderTest.worldExpansionRegionSelectionFoundationDefinition,
      buildLoaderOptions()
    );
  const first = moduleUnderTest.selectWorldExpansionRegionProfile(
    selection,
    "urban",
    { selectionSource: "demo-region-selector" }
  );
  const second = moduleUnderTest.selectWorldExpansionRegionProfile(
    selection,
    "urban",
    { selectionSource: "demo-region-selector" }
  );

  assert.equal(first.selectedRegionType, second.selectedRegionType);
  assert.deepEqual(first.selectedGenerationProfile, second.selectedGenerationProfile);
  assert.deepEqual(first.selectedAssetProfile, second.selectedAssetProfile);
  assert.equal(first.sceneRoute.sceneRouteId, second.sceneRoute.sceneRouteId);
  assert.equal(first.mapDataRoute.mapDataRouteId, second.mapDataRoute.mapDataRouteId);
});
