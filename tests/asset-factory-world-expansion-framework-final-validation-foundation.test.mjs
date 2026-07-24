import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-expansion-framework-final-validation-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = [
    "WorldExpansionFrameworkValidationMaterialA",
    "WorldExpansionFrameworkValidationMaterialB"
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

test("world expansion framework final validation proves the full framework remains consistent", async () => {
  const foundation =
    await moduleUnderTest.createWorldExpansionFrameworkFinalValidationFoundation(
      moduleUnderTest.worldExpansionFrameworkFinalValidationFoundationDefinition,
      buildLoaderOptions()
    );

  const validation =
    moduleUnderTest.validateWorldExpansionFrameworkFinalValidationFoundation(
      foundation
    );

  assert.equal(validation.ok, true);
  assert.match(
    foundation.frameworkValidationId,
    /^WORLD_EXPANSION_FRAMEWORK_VALIDATION_/
  );
  assert.deepEqual(foundation.frameworkValidationSummary.coordinateToScenePipeline, [
    "coordinate",
    "region selection",
    "region resolution",
    "scene routing",
    "map data routing",
    "settlement generation",
    "scene assembly"
  ]);
  assert.equal(
    foundation.frameworkValidationSummary.coastalActiveWorldUnchanged,
    true
  );
  assert.equal(
    foundation.frameworkValidationSummary.futureRegionProfilesFallbackSafely,
    true
  );
  assert.equal(foundation.frameworkValidationSummary.deterministicOutputs, true);
  assert.equal(foundation.frameworkValidationSummary.assetCompatibility, true);
  assert.equal(
    foundation.frameworkValidationSummary.validationChainConsistency,
    true
  );
});

test("world expansion framework final validation reports all supported region profiles safely", async () => {
  const foundation =
    await moduleUnderTest.createWorldExpansionFrameworkFinalValidationFoundation(
      moduleUnderTest.worldExpansionFrameworkFinalValidationFoundationDefinition,
      buildLoaderOptions()
    );

  assert.equal(foundation.regionProfileValidationReport.length, 4);
  assert.deepEqual(
    foundation.regionProfileValidationReport.map((entry) => entry.regionType),
    ["coastal", "suburban", "rural", "urban"]
  );

  const suburbanEntry = foundation.regionProfileValidationReport.find(
    (entry) => entry.regionType === "suburban"
  );
  assert.equal(suburbanEntry.validationResult.safeFallbackValid, true);
  assert.equal(suburbanEntry.validationResult.deterministicSelectionValid, true);

  const coastalEntry = foundation.regionProfileValidationReport.find(
    (entry) => entry.regionType === "coastal"
  );
  assert.equal(coastalEntry.validationResult.assetProfileCompatibleValid, true);
  assert.equal(coastalEntry.validationResult.chainConsistencyValid, true);
});
