import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const repoRoot = path.resolve(import.meta.dirname, "..");

const sharedModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-shared-approved-live-assets.mjs"
  )
);

const eucalyptusGameplayGlbPath = path.join(
  repoRoot,
  "asset-factory-workspace",
  "production",
  "COASTAL_NATURE_FAMILY_001",
  "export",
  "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"
);

const bottlebrushGameplayGlbPath = path.join(
  repoRoot,
  "asset-factory-workspace",
  "production",
  "COASTAL_NATURE_FAMILY_001",
  "export",
  "TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb"
);

const pavilionGameplayGlbPath = path.join(
  repoRoot,
  "asset-factory-workspace",
  "production",
  "CIVIC_SPORTS_PAVILION_FAMILY_001",
  "export",
  "BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"
);

const shrubGameplayGlbPath = path.join(
  repoRoot,
  "asset-factory-workspace",
  "production",
  "COASTAL_SHRUB_FAMILY_001",
  "export",
  "SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb"
);

async function loadGameplayGlbArrayBuffer(filePath) {
  const buffer = await readFile(filePath);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

function createFetchProvider(responses) {
  return async (requestedPath) => {
    const arrayBuffer = responses.get(requestedPath) ?? null;
    return {
      ok: arrayBuffer instanceof ArrayBuffer,
      async arrayBuffer() {
        return arrayBuffer;
      }
    };
  };
}

function createFakeWebGLContext() {
  const stats = {
    drawArraysCount: 0
  };

  const gl = {
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88e4,
    COLOR_BUFFER_BIT: 0x4000,
    DEPTH_BUFFER_BIT: 0x0100,
    DEPTH_TEST: 0x0b71,
    LEQUAL: 0x0203,
    BLEND: 0x0be2,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    TRIANGLES: 0x0004,
    FLOAT: 0x1406,
    createShader() {
      return {};
    },
    shaderSource() {},
    compileShader() {},
    getShaderParameter() {
      return true;
    },
    getShaderInfoLog() {
      return "";
    },
    deleteShader() {},
    createProgram() {
      return {};
    },
    attachShader() {},
    linkProgram() {},
    getProgramParameter() {
      return true;
    },
    getProgramInfoLog() {
      return "";
    },
    deleteProgram() {},
    getAttribLocation() {
      return 0;
    },
    getUniformLocation() {
      return {};
    },
    createBuffer() {
      return {};
    },
    bindBuffer() {},
    bufferData() {},
    enable() {},
    depthFunc() {},
    blendFunc() {},
    viewport() {},
    clearColor() {},
    clear() {},
    useProgram() {},
    uniformMatrix4fv() {},
    uniform2fv() {},
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    uniform4fv() {},
    drawArrays() {
      stats.drawArraysCount += 1;
    },
    deleteBuffer() {}
  };

  return { gl, stats };
}

function createDocumentStub(gl) {
  const overlayPane = {
    children: [],
    appendChild(node) {
      node.__parent = this;
      this.children.push(node);
    },
    removeChild(node) {
      this.children = this.children.filter((entry) => entry !== node);
      node.__parent = null;
    }
  };

  return {
    overlayPane,
    createElement(tagName) {
      if (tagName !== "canvas") {
        throw new Error(`Unsupported tag: ${tagName}`);
      }
      return {
        className: "",
        style: {},
        width: 1,
        height: 1,
        clientWidth: 640,
        clientHeight: 480,
        getContext(kind) {
          if (kind === "webgl" || kind === "experimental-webgl") {
            return gl;
          }
          return null;
        },
        remove() {
          this.__parent?.removeChild(this);
        }
      };
    }
  };
}

function createMapStub(documentStub, stats) {
  const listeners = new Map();
  const center = { lat: -38.12, lng: 144.61 };
  let zoom = 18;

  return {
    getPanes() {
      return { overlayPane: documentStub.overlayPane };
    },
    getContainer() {
      return documentStub.overlayPane;
    },
    getSize() {
      return { x: 640, y: 480 };
    },
    getZoom() {
      return zoom;
    },
    zoomIn(delta = 1) {
      zoom += Number(delta);
      this.fire("zoomend");
    },
    getCenter() {
      return center;
    },
    latLngToContainerPoint([lat, lng]) {
      return {
        x: 320 + (lng - center.lng) * 20000,
        y: 240 - (lat - center.lat) * 20000
      };
    },
    on(eventName, listener) {
      const current = listeners.get(eventName) ?? new Set();
      current.add(listener);
      listeners.set(eventName, current);
    },
    off(eventName, listener) {
      const current = listeners.get(eventName);
      current?.delete(listener);
    },
    fire(eventName) {
      for (const listener of listeners.get(eventName) ?? []) {
        listener();
      }
    },
    panBy() {
      this.fire("moveend");
    },
    listenerCount() {
      let count = 0;
      for (const set of listeners.values()) {
        count += set.size;
      }
      return count;
    },
    drawCount() {
      return stats.drawArraysCount;
    }
  };
}

function createAttachedStatus() {
  return {
    attached: true,
    exactLiveMapBound: true,
    attachedMapIdentityId: "ATLAS_LIVE_MAP_001"
  };
}

async function createControllerHarness() {
  const eucalyptusArrayBuffer = await loadGameplayGlbArrayBuffer(
    eucalyptusGameplayGlbPath
  );
  const bottlebrushArrayBuffer = await loadGameplayGlbArrayBuffer(
    bottlebrushGameplayGlbPath
  );
  const pavilionArrayBuffer = await loadGameplayGlbArrayBuffer(
    pavilionGameplayGlbPath
  );
  const shrubArrayBuffer = await loadGameplayGlbArrayBuffer(
    shrubGameplayGlbPath
  );
  const { gl, stats } = createFakeWebGLContext();
  const documentStub = createDocumentStub(gl);
  const map = createMapStub(documentStub, stats);
  const responses = new Map([
    [
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
      eucalyptusArrayBuffer
    ],
    [
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb",
      bottlebrushArrayBuffer
    ],
    [
      "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb",
      pavilionArrayBuffer
    ],
    [
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb",
      shrubArrayBuffer
    ]
  ]);

  const controller =
    sharedModule.createDeveloperOnlyAtlasSharedApprovedLiveAssetController({
      getGrowGoMap: () => map,
      attachmentStatusProvider: () => createAttachedStatus(),
      documentObject: documentStub,
      hostObject: { location: { hostname: "127.0.0.1" } },
      fetchProvider: createFetchProvider(responses)
    });

  return { controller, map, documentStub, stats };
}

test("shared approved asset controller renders eucalyptus and bottlebrush in one shared renderer surface", async () => {
  const { controller, map, documentStub } = await createControllerHarness();

  const firstResult = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  const secondResult = await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(firstResult.outcome, "created");
  assert.equal(secondResult.outcome, "created");
  assert.equal(status.rendererCanvasCount, 1);
  assert.equal(status.rendererInstanceCount, 1);
  assert.equal(status.sharedSceneCount, 1);
  assert.equal(status.modelInstanceCount, 2);
  assert.equal(status.sharedAssetInstances.length, 2);
  assert.equal(status.secondSelectedAssetId, "TREE_BOTTLEBRUSH_001");
  assert.equal(status.secondSelectedAssetVersion, "v002");
  assert.equal(status.secondResolvedGlbIdentity,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_BOTTLEBRUSH_001_LOD_GAMEPLAY.glb"
  );
  assert.equal(status.ownedListenerCount, 3);
  assert.equal(documentStub.overlayPane.children.length, 1);
  assert.equal(map.listenerCount(), 3);
});

test("shared approved asset controller keeps one canvas and one listener set across pan and zoom redraws", async () => {
  const { controller, map } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });

  const drawCountBefore = map.drawCount();
  map.fire("moveend");
  map.fire("zoomend");
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.ok(map.drawCount() > drawCountBefore);
  assert.equal(status.rendererCanvasCount, 1);
  assert.equal(status.rendererInstanceCount, 1);
  assert.equal(status.sharedSceneCount, 1);
  assert.equal(status.ownedListenerCount, 3);
  assert.equal(status.modelInstanceCount, 2);
});

test("shared approved asset controller updates one asset without moving the other", async () => {
  const { controller } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });

  const result = await controller.updateSecondApprovedLiveAsset({
    latitude: -38.1224,
    longitude: 144.6142
  });
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(result.outcome, "updated");
  assert.equal(status.latitude, -38.12);
  assert.equal(status.longitude, 144.61);
  assert.equal(status.secondLatitude, -38.1224);
  assert.equal(status.secondLongitude, 144.6142);
  assert.equal(status.modelInstanceCount, 2);
});

test("shared approved asset controller removes one asset and keeps the other rendered", async () => {
  const { controller, documentStub, map } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });

  const result = controller.clearSecondApprovedLiveAsset();
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(result.outcome, "removed");
  assert.equal(status.liveAssetPresent, true);
  assert.equal(status.secondLiveAssetPresent, false);
  assert.equal(status.rendererCanvasCount, 1);
  assert.equal(status.rendererInstanceCount, 1);
  assert.equal(status.sharedSceneCount, 1);
  assert.equal(status.modelInstanceCount, 1);
  assert.equal(documentStub.overlayPane.children.length, 1);
  assert.equal(map.listenerCount(), 3);
});

test("shared approved asset controller recreates the removed second asset in the same shared renderer", async () => {
  const { controller } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });
  controller.clearSecondApprovedLiveAsset();

  const result = await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1231,
    longitude: 144.6152
  });
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(result.outcome, "created");
  assert.equal(status.secondLiveAssetPresent, true);
  assert.equal(status.secondLatitude, -38.1231);
  assert.equal(status.secondLongitude, 144.6152);
  assert.equal(status.rendererCanvasCount, 1);
  assert.equal(status.modelInstanceCount, 2);
});

test("shared approved asset controller clears both assets and tears down the shared renderer surface", async () => {
  const { controller, map, documentStub } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });

  const result = controller.clearAllApprovedLiveAssets();
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(result.outcome, "removed");
  assert.equal(status.rendererCanvasCount, 0);
  assert.equal(status.rendererInstanceCount, 0);
  assert.equal(status.sharedSceneCount, 0);
  assert.equal(status.modelInstanceCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.renderLoopCount, 0);
  assert.equal(documentStub.overlayPane.children.length, 0);
  assert.equal(map.listenerCount(), 0);
});

test("shared approved asset controller renders eucalyptus, bottlebrush, and pavilion in one shared renderer surface", async () => {
  const { controller, map, documentStub } = await createControllerHarness();

  const firstResult = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  const secondResult = await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });
  const thirdResult = await controller.placeThirdApprovedLiveAsset({
    latitude: -38.1189,
    longitude: 144.6161
  });
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(firstResult.outcome, "created");
  assert.equal(secondResult.outcome, "created");
  assert.equal(thirdResult.outcome, "created");
  assert.equal(status.rendererCanvasCount, 1);
  assert.equal(status.rendererInstanceCount, 1);
  assert.equal(status.sharedSceneCount, 1);
  assert.equal(status.modelInstanceCount, 3);
  assert.equal(status.sharedAssetInstances.length, 3);
  assert.equal(
    status.thirdSelectedAssetId,
    "BUILDING_CIVIC_SPORTS_PAVILION_001"
  );
  assert.equal(status.thirdSelectedAssetVersion, "1.0.0");
  assert.equal(
    status.thirdResolvedGlbIdentity,
    "asset-factory-workspace/production/CIVIC_SPORTS_PAVILION_FAMILY_001/export/BUILDING_CIVIC_SPORTS_PAVILION_001_LOD_GAMEPLAY.glb"
  );
  assert.equal(status.thirdActualGlbLoaded, true);
  assert.equal(status.ownedListenerCount, 3);
  assert.equal(documentStub.overlayPane.children.length, 1);
  assert.equal(map.listenerCount(), 3);
});

test("shared approved asset controller updates the pavilion without moving the two tree assets", async () => {
  const { controller } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });
  await controller.placeThirdApprovedLiveAsset({
    latitude: -38.1189,
    longitude: 144.6161
  });

  const result = await controller.updateThirdApprovedLiveAsset({
    latitude: -38.1182,
    longitude: 144.6186
  });
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(result.outcome, "updated");
  assert.equal(status.latitude, -38.12);
  assert.equal(status.longitude, 144.61);
  assert.equal(status.secondLatitude, -38.1218);
  assert.equal(status.secondLongitude, 144.6124);
  assert.equal(status.thirdLatitude, -38.1182);
  assert.equal(status.thirdLongitude, 144.6186);
  assert.equal(status.modelInstanceCount, 3);
});

test("shared approved asset controller renders eucalyptus, bottlebrush, pavilion, and shrub in one shared renderer surface", async () => {
  const { controller, map, documentStub } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });
  await controller.placeThirdApprovedLiveAsset({
    latitude: -38.1189,
    longitude: 144.6161
  });
  const fourthResult = await controller.placeFourthApprovedLiveAsset({
    latitude: -38.1236,
    longitude: 144.6111
  });
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(fourthResult.outcome, "created");
  assert.equal(status.rendererCanvasCount, 1);
  assert.equal(status.rendererInstanceCount, 1);
  assert.equal(status.sharedSceneCount, 1);
  assert.equal(status.modelInstanceCount, 4);
  assert.equal(status.sharedAssetInstances.length, 4);
  assert.equal(status.fourthSelectedAssetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(status.fourthSelectedAssetVersion, "v002");
  assert.equal(
    status.fourthResolvedGlbIdentity,
    "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb"
  );
  assert.equal(status.fourthActualGlbLoaded, true);
  assert.equal(status.ownedListenerCount, 3);
  assert.equal(documentStub.overlayPane.children.length, 1);
  assert.equal(map.listenerCount(), 3);
});

test("shared approved asset controller updates the shrub without moving the other three assets", async () => {
  const { controller } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.placeSecondApprovedLiveAsset({
    latitude: -38.1218,
    longitude: 144.6124
  });
  await controller.placeThirdApprovedLiveAsset({
    latitude: -38.1189,
    longitude: 144.6161
  });
  await controller.placeFourthApprovedLiveAsset({
    latitude: -38.1236,
    longitude: 144.6111
  });

  const result = await controller.updateFourthApprovedLiveAsset({
    latitude: -38.1241,
    longitude: 144.6102
  });
  const status = controller.getSharedApprovedLiveAssetStatus();

  assert.equal(result.outcome, "updated");
  assert.equal(status.latitude, -38.12);
  assert.equal(status.longitude, 144.61);
  assert.equal(status.secondLatitude, -38.1218);
  assert.equal(status.secondLongitude, 144.6124);
  assert.equal(status.thirdLatitude, -38.1189);
  assert.equal(status.thirdLongitude, 144.6161);
  assert.equal(status.fourthLatitude, -38.1241);
  assert.equal(status.fourthLongitude, 144.6102);
  assert.equal(status.modelInstanceCount, 4);
});

test("shared approved asset controller fails closed when the live map is unavailable", async () => {
  const eucalyptusArrayBuffer = await loadGameplayGlbArrayBuffer(
    eucalyptusGameplayGlbPath
  );

  const controller =
    sharedModule.createDeveloperOnlyAtlasSharedApprovedLiveAssetController({
      getGrowGoMap: () => null,
      attachmentStatusProvider: () => createAttachedStatus(),
      documentObject: createDocumentStub(createFakeWebGLContext().gl),
      hostObject: { location: { hostname: "127.0.0.1" } },
      fetchProvider: createFetchProvider(
        new Map([
          [
            "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb",
            eucalyptusArrayBuffer
          ]
        ])
      )
    });

  const result = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "LIVE_MAP_UNAVAILABLE");
});

test("shared approved asset controller exposes a locked shared renderer foundation contract", async () => {
  const { controller } = await createControllerHarness();

  const contract = controller.getLockedSharedRendererFoundationContract();

  assert.equal(
    contract.schemaId,
    "GROWGO_DEVELOPER_ONLY_ATLAS_SHARED_RENDERER_FOUNDATION_CONTRACT_001"
  );
  assert.equal(contract.foundationLocked, true);
  assert.equal(contract.sharedRendererSingletonRequired, true);
  assert.equal(contract.sharedCanvasSingletonRequired, true);
  assert.equal(contract.sharedSceneSingletonRequired, true);
  assert.equal(contract.perAssetRendererForbidden, true);
  assert.equal(contract.perAssetCanvasForbidden, true);
  assert.equal(contract.duplicateSceneCreationForbidden, true);
  assert.equal(contract.duplicateMapListenerOwnershipForbidden, true);
  assert.equal(contract.orphanedRenderLoopForbidden, true);
  assert.equal(contract.leakedModelInstanceForbidden, true);
  assert.equal(
    contract.minimumSupportedRendererApi.createModelInstance.operation,
    "createApprovedSharedAssetModelInstance"
  );
  assert.equal(
    contract.provisionalVisualCalibrationObservation.developerScaleMultiplier,
    0.62
  );
  assert.equal(
    contract.provisionalVisualCalibrationObservation.developerTargetHeightMeters,
    3.6
  );
  assert.match(
    contract.visualQualityFinding,
    /technically functional but visually below the desired GrowGo quality bar/i
  );
  assert.throws(() => {
    contract.foundationLocked = false;
  }, /Cannot assign to read only property|read only/i);
});

test("shared approved asset controller generic lifecycle API preserves singleton renderer counts", async () => {
  const { controller } = await createControllerHarness();

  const initResult = controller.initializeSharedApprovedLiveAssetRenderer();
  assert.equal(initResult.outcome, "ready");
  assert.equal(
    initResult.reasonCode,
    "ATLAS_SHARED_RENDERER_DEFERRED_UNTIL_FIRST_MODEL_INSTANCE"
  );

  await controller.createApprovedSharedAssetModelInstance({
    slotId: "first",
    assetId: "TREE_EUCALYPTUS_001",
    latitude: -38.12,
    longitude: 144.61
  });
  await controller.createApprovedSharedAssetModelInstance({
    slotId: "second",
    assetId: "TREE_BOTTLEBRUSH_001",
    latitude: -38.1218,
    longitude: 144.6124
  });
  await controller.createApprovedSharedAssetModelInstance({
    slotId: "third",
    assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
    latitude: -38.1189,
    longitude: 144.6161
  });
  await controller.createApprovedSharedAssetModelInstance({
    slotId: "fourth",
    assetId: "SHRUB_COASTAL_LOW_001",
    latitude: -38.1236,
    longitude: 144.6111
  });

  let status = controller.getSharedApprovedLiveAssetStatus();
  assert.equal(status.rendererInstanceCount, 1);
  assert.equal(status.rendererCanvasCount, 1);
  assert.equal(status.sharedSceneCount, 1);
  assert.equal(status.modelInstanceCount, 4);

  await controller.updateApprovedSharedAssetGeographicPosition({
    slotId: "fourth",
    latitude: -38.1241,
    longitude: 144.6102
  });

  const removeResult = controller.removeApprovedSharedAssetModelInstance({
    slotId: "fourth"
  });
  assert.equal(removeResult.outcome, "removed");
  status = controller.getSharedApprovedLiveAssetStatus();
  assert.equal(status.rendererInstanceCount, 1);
  assert.equal(status.rendererCanvasCount, 1);
  assert.equal(status.sharedSceneCount, 1);
  assert.equal(status.modelInstanceCount, 3);

  const clearResult = controller.clearApprovedSharedAssetModelInstances();
  assert.equal(clearResult.outcome, "removed");
  status = controller.getSharedApprovedLiveAssetStatus();
  assert.equal(status.rendererInstanceCount, 0);
  assert.equal(status.rendererCanvasCount, 0);
  assert.equal(status.sharedSceneCount, 0);
  assert.equal(status.modelInstanceCount, 0);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.renderLoopCount, 0);

  const disposeResult = controller.disposeApprovedSharedAssetRendererFoundation();
  assert.equal(disposeResult.outcome, "removed");
  status = controller.getSharedApprovedLiveAssetStatus();
  assert.equal(status.rendererInstanceCount, 0);
  assert.equal(status.rendererCanvasCount, 0);
  assert.equal(status.sharedSceneCount, 0);
  assert.equal(status.modelInstanceCount, 0);
});

test("shared approved asset controller generic lifecycle API fails closed for invalid slot ids", async () => {
  const { controller } = await createControllerHarness();

  const result = await controller.createApprovedSharedAssetModelInstance({
    slotId: "fifth",
    assetId: "TREE_EUCALYPTUS_001",
    latitude: -38.12,
    longitude: 144.61
  }).catch((error) => error);

  assert.equal(result.reasonCode, "APPROVED_SHARED_ASSET_SLOT_INVALID");
});
