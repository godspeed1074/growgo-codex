import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "world-expansion-pipeline-validation-foundation.mjs"
  )
);

function createSyntheticGlb({
  materialNames = [
    "WorldExpansionPipelineValidationMaterialA",
    "WorldExpansionPipelineValidationMaterialB"
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

test("world expansion pipeline validation proves the full coastal coordinate-to-scene chain", async () => {
  const foundation =
    await moduleUnderTest.createWorldExpansionPipelineValidationFoundation(
      moduleUnderTest.worldExpansionPipelineValidationFoundationDefinition,
      buildLoaderOptions()
    );

  const validation =
    moduleUnderTest.validateWorldExpansionPipelineValidationFoundation(foundation);

  assert.equal(validation.ok, true);
  assert.match(
    foundation.pipelineValidationId,
    /^WORLD_EXPANSION_PIPELINE_VALIDATION_/
  );
  assert.equal(foundation.regionResolution.regionType, "coastal");
  assert.equal(foundation.sceneRoute.regionType, "coastal");
  assert.equal(foundation.mapDataRoute.regionType, "coastal");
  assert.equal(
    foundation.sceneRoute.sceneProfile.sceneAssemblyId,
    "map-world-settlement-atlas-scene-expansion"
  );
  assert.equal(
    foundation.mapDataRoute.providerProfile.providerId,
    "LOCAL_FIXTURE_MAP_PROVIDER_001"
  );
  assert.equal(foundation.validationResult.fullChainValid, true);
  assert.equal(foundation.validationResult.coastalLocationUnchangedValid, true);
  assert.equal(foundation.validationResult.deterministicOutputValid, true);
  assert.equal(foundation.validationResult.assetCompatibilityValid, true);
  assert.equal(foundation.validationResult.fallbackSafetyValid, true);
  assert.equal(foundation.validationResult.chainIdentityConsistencyValid, true);
  assert.equal(foundation.validationResult.coordinateConsistencyValid, true);
});

test("world expansion pipeline validation remains deterministic for the same coordinate and seed", async () => {
  const first =
    await moduleUnderTest.createWorldExpansionPipelineValidationFoundation(
      moduleUnderTest.worldExpansionPipelineValidationFoundationDefinition,
      buildLoaderOptions()
    );
  const second =
    await moduleUnderTest.createWorldExpansionPipelineValidationFoundation(
      moduleUnderTest.worldExpansionPipelineValidationFoundationDefinition,
      buildLoaderOptions()
    );

  assert.equal(first.pipelineValidationId, second.pipelineValidationId);
  assert.deepEqual(first.coordinate, second.coordinate);
  assert.equal(first.regionResolution.regionResolutionId, second.regionResolution.regionResolutionId);
  assert.equal(first.sceneRoute.sceneRouteId, second.sceneRoute.sceneRouteId);
  assert.equal(first.mapDataRoute.mapDataRouteId, second.mapDataRoute.mapDataRouteId);
  assert.equal(
    first.settlementOutput.settlementSummary.settlementId,
    second.settlementOutput.settlementSummary.settlementId
  );
  assert.equal(first.sceneOutput.sceneId, second.sceneOutput.sceneId);
});
