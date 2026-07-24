import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-settlement-real-map-overlay-foundation.mjs"
  )
);
const liveMapModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-live-map-foundation.mjs"
  )
);
const settlementSceneModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-settlement-atlas-scene-expansion.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["OverlayFoundationMaterialA", "OverlayFoundationMaterialB"]
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

test("map world settlement real map overlay foundation validates a combined map and settlement overlay package", async () => {
  const overlay =
    await moduleUnderTest.createMapWorldSettlementRealMapOverlayFoundation(
      moduleUnderTest.mapWorldSettlementRealMapOverlayFoundationDefinition,
      buildLoaderOptions()
    );

  const result =
    moduleUnderTest.validateMapWorldSettlementRealMapOverlayFoundation(overlay);

  assert.equal(result.ok, true);
  assert.match(overlay.overlayId, /^MAP_WORLD_SETTLEMENT_OVERLAY_/);
  assert.equal(overlay.worldId, overlay.mapWorldLiveMapFoundation.activeWorldId);
  assert.equal(overlay.sceneId, overlay.settlementScene.sceneId);
  assert.equal(overlay.mapBaseLayer.visibleUnderlay, true);
  assert.equal(overlay.settlementLayer.mapVisibleUnderneath, true);
  assert.equal(overlay.alignmentState.coordinateAlignmentValid, true);
  assert.equal(overlay.alignmentState.zoomConsistencyValid, true);
  assert.equal(overlay.alignmentState.worldIdentityValid, true);
  assert.equal(overlay.interactionState.selectedObject, null);
  assert.equal(overlay.interactionState.hoverState.currentState, "idle");
  assert.equal(overlay.interactionState.interactionMode, "map-overlay-selection");
  assert.equal(overlay.interactionState.cameraFocus.currentState, "world-anchor");
  assert.equal(overlay.interactionState.validationResult.objectIdentityValid, true);
  assert.equal(overlay.detailState.selectedObjectId, null);
  assert.equal(overlay.detailState.assetId, null);
  assert.equal(overlay.detailState.detailState, "map-overview");
  assert.equal(overlay.detailState.validationResult.previewStateValid, true);
  assert.equal(overlay.playerState.worldId, overlay.worldId);
  assert.equal(overlay.playerState.visibilityState, "world-visible");
  assert.equal(overlay.playerState.validationResult.coordinateConsistencyValid, true);
  assert.equal(overlay.cameraSync.synchronized, true);
  assert.equal(overlay.cameraSync.previewCameraProfile, "atlas-coastal-settlement-overlook");
  assert.equal(overlay.validationResult.coordinateAlignmentValid, true);
  assert.equal(overlay.validationResult.zoomConsistencyValid, true);
  assert.equal(overlay.validationResult.worldIdentityValid, true);
  assert.equal(overlay.validationResult.cleanupValid, true);
  assert.equal(overlay.validationResult.deterministicPlacementValid, true);
  assert.equal(overlay.validationResult.objectIdentityValid, true);
  assert.equal(overlay.validationResult.selectionPersistenceValid, true);
  assert.equal(overlay.validationResult.cameraFocusValid, true);
  assert.equal(overlay.validationResult.detailPreviewValid, true);
  assert.equal(overlay.validationResult.playerPresenceValid, true);
  assert.equal(overlay.validationResult.mapVisibleUnderlayValid, true);
  assert.equal(overlay.validationResult.combinedViewReady, true);
});

test("same coordinate and zoom produce deterministic combined overlay output", async () => {
  const first =
    await moduleUnderTest.createMapWorldSettlementRealMapOverlayFoundation(
      moduleUnderTest.mapWorldSettlementRealMapOverlayFoundationDefinition,
      buildLoaderOptions()
    );
  const second =
    await moduleUnderTest.createMapWorldSettlementRealMapOverlayFoundation(
      moduleUnderTest.mapWorldSettlementRealMapOverlayFoundationDefinition,
      buildLoaderOptions()
    );

  assert.equal(first.overlayId, second.overlayId);
  assert.equal(first.worldId, second.worldId);
  assert.equal(first.sceneId, second.sceneId);
  assert.deepEqual(first.mapBaseLayer.centerCoordinate, second.mapBaseLayer.centerCoordinate);
  assert.deepEqual(first.cameraSync, second.cameraSync);
  assert.deepEqual(first.interactionState, second.interactionState);
  assert.deepEqual(first.detailState, second.detailState);
  assert.deepEqual(first.playerState, second.playerState);
});

test("overlay foundation can be built from existing live map and settlement scene state", async () => {
  const mapWorldLiveMapFoundation = await liveMapModule.createMapWorldLiveMapFoundation(
    liveMapModule.mapWorldLiveMapFoundationDefinition,
    buildLoaderOptions()
  );
  const settlementScene =
    await settlementSceneModule.createMapWorldSettlementAtlasSceneExpansion(
      settlementSceneModule.mapWorldSettlementAtlasSceneExpansionDefinition,
      buildLoaderOptions()
    );

  const overlay = moduleUnderTest.buildMapWorldSettlementRealMapOverlayFoundation({
    mapWorldLiveMapFoundation,
    settlementScene
  });

  assert.equal(overlay.worldId, mapWorldLiveMapFoundation.activeWorldId);
  assert.equal(overlay.sceneId, settlementScene.sceneId);
  assert.equal(overlay.settlementLayer.objectInstanceCount, 45);
  assert.equal(overlay.alignmentState.overlayMode, "map-and-settlement-combined-view");
});

test("overlay interaction state can deterministically select supported overlay objects", async () => {
  const mapWorldLiveMapFoundation = await liveMapModule.createMapWorldLiveMapFoundation(
    liveMapModule.mapWorldLiveMapFoundationDefinition,
    buildLoaderOptions()
  );
  const settlementScene =
    await settlementSceneModule.createMapWorldSettlementAtlasSceneExpansion(
      settlementSceneModule.mapWorldSettlementAtlasSceneExpansionDefinition,
      buildLoaderOptions()
    );

  const interactionState = moduleUnderTest.createMapWorldSettlementOverlayInteractionState({
    settlementScene,
    mapWorldLiveMapFoundation,
    selectedObject: "LIGHTHOUSE_ISLAND_ROCKY_001"
  });

  assert.equal(interactionState.selectedObject.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(interactionState.cameraFocus.currentState, "selected-object");
  assert.equal(interactionState.cameraFocus.targetAsset, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(interactionState.cameraFocus.synchronizedWithMap, true);
  assert.equal(interactionState.validationResult.objectIdentityValid, true);
  assert.equal(interactionState.validationResult.deterministicBehaviourValid, true);
});

test("overlay detail preview state can focus a supported selected asset and preserve map sync", async () => {
  const mapWorldLiveMapFoundation = await liveMapModule.createMapWorldLiveMapFoundation(
    liveMapModule.mapWorldLiveMapFoundationDefinition,
    buildLoaderOptions()
  );
  const settlementScene =
    await settlementSceneModule.createMapWorldSettlementAtlasSceneExpansion(
      settlementSceneModule.mapWorldSettlementAtlasSceneExpansionDefinition,
      buildLoaderOptions()
    );

  const detailState = moduleUnderTest.createMapWorldSettlementOverlayAssetDetailState({
    settlementScene,
    mapWorldLiveMapFoundation,
    selectedObject: "BUILDING_COASTAL_COTTAGE_001"
  });

  assert.equal(detailState.assetId, "BUILDING_COASTAL_COTTAGE_001");
  assert.equal(detailState.assetType, "building");
  assert.equal(detailState.detailState, "focused-detail-preview");
  assert.equal(detailState.cameraProfile.currentState, "detail-focused");
  assert.equal(detailState.validationResult.selectedAssetIdentityValid, true);
  assert.equal(detailState.validationResult.mapSynchronizationValid, true);
});

test("overlay player map state can deterministically place and focus player presence", async () => {
  const mapWorldLiveMapFoundation = await liveMapModule.createMapWorldLiveMapFoundation(
    liveMapModule.mapWorldLiveMapFoundationDefinition,
    buildLoaderOptions()
  );
  const settlementScene =
    await settlementSceneModule.createMapWorldSettlementAtlasSceneExpansion(
      settlementSceneModule.mapWorldSettlementAtlasSceneExpansionDefinition,
      buildLoaderOptions()
    );

  const playerState = moduleUnderTest.createMapWorldSettlementPlayerMapState({
    settlementScene,
    mapWorldLiveMapFoundation,
    focusMode: "player-focused"
  });

  assert.equal(playerState.worldId, settlementScene.worldId);
  assert.equal(playerState.visibilityState, "player-focused");
  assert.equal(playerState.cameraFocus.currentState, "player-focused");
  assert.equal(playerState.cameraFocus.targetAsset, "PLAYER_MARKER");
  assert.equal(playerState.validationResult.coordinateConsistencyValid, true);
  assert.equal(playerState.validationResult.deterministicPlacementValid, true);
});
