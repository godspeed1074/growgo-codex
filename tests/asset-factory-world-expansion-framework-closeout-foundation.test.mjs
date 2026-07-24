import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-expansion-framework-closeout-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = [
    "WorldExpansionFrameworkCloseoutMaterialA",
    "WorldExpansionFrameworkCloseoutMaterialB"
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

test("world expansion framework closeout records the supported regions and active coastal production path", async () => {
  const foundation =
    await moduleUnderTest.createWorldExpansionFrameworkCloseoutFoundation(
      moduleUnderTest.worldExpansionFrameworkCloseoutFoundationDefinition,
      buildLoaderOptions()
    );

  const validation =
    moduleUnderTest.validateWorldExpansionFrameworkCloseoutFoundation(
      foundation
    );

  assert.equal(validation.ok, true);
  assert.match(
    foundation.frameworkId,
    /^WORLD_EXPANSION_FRAMEWORK_CLOSEOUT_/
  );
  assert.equal(foundation.supportedRegionProfiles.length, 4);
  assert.equal(foundation.activeProductionRegion.regionType, "coastal");
  assert.equal(
    foundation.activeProductionRegion.currentCoastalProductionPath.sceneRouting,
    "map-world-settlement-atlas-scene-expansion"
  );
  assert.equal(
    foundation.validationStatus.status,
    "ready-for-future-region-content-work"
  );
});

test("world expansion framework closeout preserves provider and asset compatibility boundaries with no missing dependencies", async () => {
  const foundation =
    await moduleUnderTest.createWorldExpansionFrameworkCloseoutFoundation(
      moduleUnderTest.worldExpansionFrameworkCloseoutFoundationDefinition,
      buildLoaderOptions()
    );

  assert.equal(
    foundation.extensionPoints.mapProviderBoundary.activeProviderKind,
    "local_fixture_map_provider"
  );
  assert.equal(
    foundation.extensionPoints.mapProviderBoundary.liveNetworkAllowed,
    false
  );
  assert.equal(
    foundation.extensionPoints.assetCompatibilityBoundary.coastalAssetCompatibility,
    true
  );
  assert.equal(
    foundation.extensionPoints.assetCompatibilityBoundary.futureRegionContentEnabled,
    false
  );
  assert.deepEqual(foundation.validationStatus.missingDependencies, []);
  assert.equal(
    foundation.validationResult.allFrameworkModulesRemainCompatible,
    true
  );
  assert.equal(foundation.validationResult.coastalPathUnchanged, true);
  assert.equal(foundation.validationResult.noMissingDependencies, true);
});
