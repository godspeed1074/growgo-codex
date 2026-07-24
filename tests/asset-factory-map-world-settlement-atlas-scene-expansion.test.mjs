import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-settlement-atlas-scene-expansion.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["MapWorldSettlementSceneMaterialA", "MapWorldSettlementSceneMaterialB"]
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

test("map world settlement Atlas scene expansion packages the larger settlement into Atlas-ready scene groups", async () => {
  const scene = await moduleUnderTest.createMapWorldSettlementAtlasSceneExpansion(
    moduleUnderTest.mapWorldSettlementAtlasSceneExpansionDefinition,
    buildLoaderOptions()
  );

  const result =
    moduleUnderTest.validateMapWorldSettlementAtlasSceneExpansion(scene);

  assert.equal(result.ok, true);
  assert.match(scene.sceneId, /^ATLAS_SETTLEMENT_SCENE_/);
  assert.equal(
    scene.worldId,
    scene.mapWorldRealLocationPreview.mapWorldLiveMapFoundation.activeWorldId
  );
  assert.ok(scene.roadInstances.length >= 8);
  assert.ok(scene.buildingInstances.length >= 12);
  assert.ok(scene.vegetationInstances.length >= 24);
  assert.equal(scene.landmarkInstances.length, 1);
  assert.equal(scene.cameraProfile.cameraProfile, "atlas-coastal-settlement-overlook");
  assert.equal(scene.cameraProfile.orientation, "north-up");
  assert.equal(scene.cameraProfile.previewZoomProfile, "normal");
  assert.deepEqual(scene.cameraProfile.availableZoomProfiles, ["far", "normal", "close"]);
  assert.equal(scene.visualScaling.densityProfile, "suburban_coastal");
  assert.ok(scene.visualScaling.blockScale > 1);
  assert.ok(scene.visualScaling.cameraScale > 1);
  assert.equal(scene.visualScaling.previewZoomProfile.activeProfile, "normal");
  assert.equal(scene.visualScaling.activeZoomProfile, "normal");
  assert.equal(scene.visualScaling.visibleObjectCount, 45);
  assert.ok(scene.visualScaling.previewZoomProfile.far);
  assert.ok(scene.visualScaling.previewZoomProfile.normal);
  assert.ok(scene.visualScaling.previewZoomProfile.close);
  assert.deepEqual(
    scene.visualScaling.previewZoomProfile.far.visibleCategories,
    ["road", "landmark"]
  );
  assert.deepEqual(
    scene.visualScaling.previewZoomProfile.normal.visibleCategories,
    ["road", "building", "vegetation", "landmark"]
  );
  assert.deepEqual(
    scene.visualScaling.previewZoomProfile.close.visibleCategories,
    ["building", "vegetation", "landmark"]
  );
  assert.equal(
    scene.visualScaling.zoomTransitionMetadata.activeLodSelection,
    "LOD_GAMEPLAY"
  );
  assert.ok(scene.presentationSummary.residentialBlockCount >= 1);
  assert.ok(scene.presentationSummary.roadContinuitySegments >= 8);
  assert.equal(scene.presentationSummary.visibleObjectCount, 45);
  assert.equal(scene.presentationSummary.activeZoomProfile, "normal");
  assert.equal(scene.validationResult.assetReferencesValid, true);
  assert.equal(scene.validationResult.placementValidity, true);
  assert.equal(scene.validationResult.deterministicSceneOutputValid, true);
  assert.equal(scene.validationResult.objectCountLimitsValid, true);
  assert.equal(scene.validationResult.connectedRoadNetworkValid, true);
  assert.equal(scene.validationResult.coastlineRelationshipValid, true);
  assert.equal(scene.validationResult.zoomDeterminismValid, true);
  assert.equal(scene.validationResult.visibleObjectLimitsValid, true);
  assert.equal(scene.validationResult.correctLodSelection, true);
  assert.equal(scene.validationResult.cameraConsistencyValid, true);
});

test("same map coordinate and seed produce the same deterministic Atlas settlement scene", async () => {
  const first = await moduleUnderTest.createMapWorldSettlementAtlasSceneExpansion(
    moduleUnderTest.mapWorldSettlementAtlasSceneExpansionDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createMapWorldSettlementAtlasSceneExpansion(
    moduleUnderTest.mapWorldSettlementAtlasSceneExpansionDefinition,
    buildLoaderOptions()
  );

  assert.equal(first.sceneId, second.sceneId);
  assert.equal(first.worldId, second.worldId);
  assert.deepEqual(
    first.roadInstances.map((instance) => instance.roadSegmentId),
    second.roadInstances.map((instance) => instance.roadSegmentId)
  );
  assert.deepEqual(
    first.buildingInstances.map((instance) => instance.position),
    second.buildingInstances.map((instance) => instance.position)
  );
  assert.deepEqual(
    first.vegetationInstances.map((instance) => instance.position),
    second.vegetationInstances.map((instance) => instance.position)
  );
  assert.deepEqual(first.visualScaling, second.visualScaling);
  assert.deepEqual(first.presentationSummary, second.presentationSummary);
});

test("map world settlement Atlas scene expansion rejects invalid object count limits safely", async () => {
  const scene = await moduleUnderTest.createMapWorldSettlementAtlasSceneExpansion(
    moduleUnderTest.mapWorldSettlementAtlasSceneExpansionDefinition,
    buildLoaderOptions()
  );

  const invalid = {
    ...scene,
    validationResult: {
      ...scene.validationResult,
      objectCountLimitsValid: false
    }
  };

  const result =
    moduleUnderTest.validateMapWorldSettlementAtlasSceneExpansion(invalid);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "object_count_limits_invalid");
});
