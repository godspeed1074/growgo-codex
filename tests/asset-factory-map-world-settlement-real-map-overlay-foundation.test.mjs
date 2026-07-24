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
  assert.equal(overlay.playerInteractionState.playerId, overlay.playerState.playerId);
  assert.equal(overlay.playerInteractionState.interactionState, "world-idle");
  assert.equal(overlay.playerInteractionState.validationResult.objectIdentityValid, true);
  assert.equal(overlay.captureState.playerId, overlay.playerState.playerId);
  assert.equal(overlay.captureState.captureState, "capture-idle");
  assert.equal(overlay.captureState.captureAnimationState, "capture-animation-idle");
  assert.deepEqual(overlay.captureState.capturedObjectIds, []);
  assert.equal(overlay.captureState.validationResult.targetIdentityValid, true);
  assert.equal(
    overlay.capturePresentationState.captureEffectState,
    "capture-highlight-idle"
  );
  assert.equal(
    overlay.capturePresentationState.markerState.currentState,
    "capture-marker-hidden"
  );
  assert.equal(
    overlay.capturePresentationState.validationResult.captureStateConsistencyValid,
    true
  );
  assert.equal(overlay.poiState.poiType, null);
  assert.equal(overlay.poiState.interactionState, "poi-idle");
  assert.equal(overlay.poiContentMetadata.poiId, overlay.poiState.poiId);
  assert.equal(overlay.poiContentMetadata.title, null);
  assert.equal(overlay.poiContentMetadata.category, null);
  assert.equal(
    overlay.poiContentMetadata.validationResult.metadataConsistencyValid,
    true
  );
  assert.equal(overlay.poiLocationMetadata.poiId, overlay.poiState.poiId);
  assert.equal(overlay.poiLocationMetadata.worldId, overlay.worldId);
  assert.equal(overlay.poiLocationMetadata.position, null);
  assert.equal(overlay.poiLocationMetadata.bounds, null);
  assert.equal(
    overlay.poiLocationMetadata.validationResult.coordinateConsistencyValid,
    true
  );
  assert.equal(
    overlay.poiPresentationState.poiMarkerState.activeMarkerId,
    null
  );
  assert.ok(overlay.poiPresentationState.poiMarkerState.visibleMarkerCount > 0);
  assert.equal(
    overlay.poiPresentationState.visibilityState.currentState,
    "visible"
  );
  assert.equal(
    overlay.poiPresentationState.validationResult.zoomVisibilityValid,
    true
  );
  assert.equal(overlay.discoveryState.playerId, overlay.playerState.playerId);
  assert.equal(overlay.discoveryState.discoveryState, "discovery-idle");
  assert.deepEqual(overlay.discoveryState.discoveredObjectIds, []);
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
  assert.equal(overlay.validationResult.captureInteractionValid, true);
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
  assert.deepEqual(first.playerInteractionState, second.playerInteractionState);
  assert.deepEqual(first.captureState, second.captureState);
  assert.deepEqual(first.capturePresentationState, second.capturePresentationState);
  assert.deepEqual(first.poiState, second.poiState);
  assert.deepEqual(first.poiContentMetadata, second.poiContentMetadata);
  assert.deepEqual(first.poiLocationMetadata, second.poiLocationMetadata);
  assert.deepEqual(first.poiPresentationState, second.poiPresentationState);
  assert.deepEqual(first.discoveryState, second.discoveryState);
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

test("overlay player interaction state validates nearby object interaction deterministically", async () => {
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

  const playerInteractionState = moduleUnderTest.createMapWorldSettlementPlayerInteractionState({
    settlementScene,
    mapWorldLiveMapFoundation,
    playerState,
    targetObject: "LIGHTHOUSE_ISLAND_ROCKY_001"
  });

  assert.equal(playerInteractionState.playerId, playerState.playerId);
  assert.equal(playerInteractionState.targetAssetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(playerInteractionState.validationResult.playerObjectAlignmentValid, true);
  assert.equal(playerInteractionState.validationResult.objectIdentityValid, true);
  assert.equal(playerInteractionState.validationResult.deterministicBehaviourValid, true);
});

test("overlay capture state validates session capture results deterministically", async () => {
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

  const captureState = moduleUnderTest.createMapWorldSettlementCaptureState({
    settlementScene,
    mapWorldLiveMapFoundation,
    playerState,
    targetObject: "LIGHTHOUSE_ISLAND_ROCKY_001"
  });

  assert.equal(captureState.playerId, playerState.playerId);
  assert.equal(captureState.targetAssetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.ok(
    [
      "capture-out-of-range",
      "captured-session"
    ].includes(captureState.captureState)
  );
  assert.equal(typeof captureState.captureRange, "number");
  assert.equal(typeof captureState.validationResult.playerProximityValid, "boolean");
  assert.equal(captureState.validationResult.targetIdentityValid, true);
  assert.equal(captureState.validationResult.deterministicCaptureResultValid, true);
});

test("overlay capture presentation state follows capture state deterministically", async () => {
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

  const captureState = moduleUnderTest.createMapWorldSettlementCaptureState({
    settlementScene,
    mapWorldLiveMapFoundation,
    playerState,
    targetObject: "LIGHTHOUSE_ISLAND_ROCKY_001"
  });
  const capturePresentationState =
    moduleUnderTest.createMapWorldSettlementCapturePresentationState({
      settlementScene,
      captureState
    });

  assert.equal(
    capturePresentationState.validationResult.captureStateConsistencyValid,
    true
  );
  assert.equal(
    capturePresentationState.validationResult.presentationStateConsistencyValid,
    true
  );
  assert.equal(
    capturePresentationState.markerState.capturedObjectCount,
    capturePresentationState.markerState.capturedObjectIds.length
  );
});

test("overlay POI state resolves reusable world object metadata deterministically", async () => {
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

  const poiState = moduleUnderTest.createMapWorldSettlementPoiState({
    settlementScene,
    targetObject: "LIGHTHOUSE_ISLAND_ROCKY_001",
    playerState
  });

  assert.equal(poiState.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(poiState.poiType, "landmark");
  assert.equal(poiState.validationResult.poiIdentityValid, true);
  assert.equal(poiState.validationResult.deterministicPlacementValid, true);
});

test("overlay POI content metadata resolves reusable detail and discovery profiles deterministically", async () => {
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
  const poiState = moduleUnderTest.createMapWorldSettlementPoiState({
    settlementScene,
    targetObject: "LIGHTHOUSE_ISLAND_ROCKY_001",
    playerState
  });

  const poiContentMetadata =
    moduleUnderTest.createMapWorldSettlementPoiContentMetadata({
      settlementScene,
      poiState
    });

  assert.equal(poiContentMetadata.poiId, poiState.poiId);
  assert.equal(poiContentMetadata.title, "Rocky Point Lighthouse");
  assert.equal(poiContentMetadata.category, "landmark");
  assert.equal(poiContentMetadata.interactionProfile.mode, "viewpoint-inspect");
  assert.equal(poiContentMetadata.discoveryProfile.mode, "landmark-discovery");
  assert.equal(poiContentMetadata.validationResult.poiIdentityValid, true);
  assert.equal(
    poiContentMetadata.validationResult.metadataConsistencyValid,
    true
  );
  assert.equal(
    poiContentMetadata.validationResult.deterministicOutputValid,
    true
  );
});

test("overlay POI location metadata resolves reusable spatial metadata deterministically", async () => {
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
  const poiState = moduleUnderTest.createMapWorldSettlementPoiState({
    settlementScene,
    targetObject: "LIGHTHOUSE_ISLAND_ROCKY_001",
    playerState
  });
  const poiContentMetadata =
    moduleUnderTest.createMapWorldSettlementPoiContentMetadata({
      settlementScene,
      poiState
    });
  const poiLocationMetadata =
    moduleUnderTest.createMapWorldSettlementPoiLocationMetadata({
      settlementScene,
      poiState,
      poiContentMetadata
    });

  assert.equal(poiLocationMetadata.poiId, poiState.poiId);
  assert.equal(poiLocationMetadata.worldId, settlementScene.worldId);
  assert.ok(Number.isFinite(poiLocationMetadata.position.x));
  assert.ok(Number.isFinite(poiLocationMetadata.position.y));
  assert.ok(poiLocationMetadata.bounds);
  assert.equal(poiLocationMetadata.bounds.shape, "point-radius");
  assert.equal(typeof poiLocationMetadata.orientation, "string");
  assert.equal(
    poiLocationMetadata.accessibility.zone,
    "landmark-positioning"
  );
  assert.equal(
    poiLocationMetadata.validationResult.coordinateConsistencyValid,
    true
  );
  assert.equal(
    poiLocationMetadata.validationResult.objectAlignmentValid,
    true
  );
  assert.equal(
    poiLocationMetadata.validationResult.deterministicPlacementValid,
    true
  );
});

test("overlay POI presentation state resolves reusable marker and label presentation deterministically", async () => {
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
  const poiState = moduleUnderTest.createMapWorldSettlementPoiState({
    settlementScene,
    targetObject: "LIGHTHOUSE_ISLAND_ROCKY_001",
    playerState
  });
  const poiContentMetadata =
    moduleUnderTest.createMapWorldSettlementPoiContentMetadata({
      settlementScene,
      poiState
    });
  const poiLocationMetadata =
    moduleUnderTest.createMapWorldSettlementPoiLocationMetadata({
      settlementScene,
      poiState,
      poiContentMetadata
    });
  const poiPresentationState =
    moduleUnderTest.createMapWorldSettlementPoiPresentationState({
      settlementScene,
      poiState,
      poiContentMetadata,
      poiLocationMetadata
    });

  assert.equal(
    poiPresentationState.poiMarkerState.activeMarkerId,
    poiState.poiId
  );
  assert.ok(poiPresentationState.poiMarkerState.visibleMarkerCount > 0);
  assert.equal(
    poiPresentationState.selectedStyle.currentState,
    "selected-poi-emphasis"
  );
  assert.equal(
    poiPresentationState.labelState.selectedLabelId,
    poiState.poiId
  );
  assert.equal(
    poiPresentationState.visibilityState.currentState,
    "visible"
  );
  assert.equal(
    poiPresentationState.validationResult.poiIdentityValid,
    true
  );
  assert.equal(
    poiPresentationState.validationResult.zoomVisibilityValid,
    true
  );
  assert.equal(
    poiPresentationState.validationResult.selectionStateValid,
    true
  );
});

test("overlay discovery state persists discovered nearby objects deterministically during the session", async () => {
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

  const discoveryState = moduleUnderTest.createMapWorldSettlementDiscoveryState({
    settlementScene,
    mapWorldLiveMapFoundation,
    playerState,
    targetObject: "LIGHTHOUSE_ISLAND_ROCKY_001"
  });

  assert.equal(discoveryState.playerId, playerState.playerId);
  assert.equal(discoveryState.assetId, "LIGHTHOUSE_ISLAND_ROCKY_001");
  assert.equal(
    typeof discoveryState.validationResult.playerProximityValid,
    "boolean"
  );
  assert.equal(discoveryState.validationResult.objectIdentityValid, true);
  assert.equal(discoveryState.validationResult.deterministicDiscoveryResultValid, true);
});
