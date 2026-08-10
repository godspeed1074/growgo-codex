import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const repoRoot = path.resolve(import.meta.dirname, "..");

const approvedAssetModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-first-approved-live-asset.mjs"
  )
);

const treeGameplayGlbPath = path.join(
  repoRoot,
  "asset-factory-workspace",
  "production",
  "COASTAL_NATURE_FAMILY_001",
  "export",
  "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"
);

async function loadTreeGameplayGlbArrayBuffer() {
  const buffer = await readFile(treeGameplayGlbPath);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

function createFetchProvider(arrayBuffer) {
  return async (requestedPath) => ({
    ok: requestedPath.endsWith("TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"),
    async arrayBuffer() {
      return arrayBuffer;
    }
  });
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
    setZoom(nextZoom) {
      zoom = nextZoom;
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
  const arrayBuffer = await loadTreeGameplayGlbArrayBuffer();
  const { gl, stats } = createFakeWebGLContext();
  const documentStub = createDocumentStub(gl);
  const map = createMapStub(documentStub, stats);
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController(
      {
        getGrowGoMap: () => map,
        attachmentStatusProvider: () => createAttachedStatus(),
        documentObject: documentStub,
        hostObject: { location: { hostname: "127.0.0.1" } },
        fetchProvider: createFetchProvider(arrayBuffer)
      }
    );

  return { controller, map, documentStub, stats };
}

test("actual gameplay GLB scene parser extracts the approved eucalyptus mesh scene", async () => {
  const sceneData =
    approvedAssetModule.parseTreeEucalyptusApprovedGameplayGlbSceneData(
      await loadTreeGameplayGlbArrayBuffer()
    );

  assert.equal(sceneData.assetId, "TREE_EUCALYPTUS_001");
  assert.equal(sceneData.assetVersion, "v001");
  assert.ok(sceneData.meshCount > 0);
  assert.ok(sceneData.materialCount > 0);
  assert.ok(sceneData.sceneObjectCount > 0);
  assert.ok(sceneData.modelBounds.height > 0);
  assert.ok(sceneData.drawCalls.length > 0);
});

test("approved live asset controller creates one true 3D renderer surface and one model instance", async () => {
  const { controller, map, documentStub } = await createControllerHarness();

  const result = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "created");
  assert.equal(result.status.actualGlbLoaded, true);
  assert.equal(result.status.representationMode, "atlas_true_3d_glb_model");
  assert.equal(result.status.rendererSurfaceCount, 1);
  assert.equal(result.status.rendererCanvasCount, 1);
  assert.equal(result.status.modelInstanceCount, 1);
  assert.equal(result.status.ownedListenerCount, 3);
  assert.equal(result.status.renderLoopCount, 0);
  assert.equal(result.status.glContextCreated, true);
  assert.equal(result.status.true3dRendererReady, true);
  assert.equal(map.listenerCount(), 3);
  assert.equal(documentStub.overlayPane.children.length, 1);
  assert.ok(map.drawCount() > 0);
});

test("moveend and zoomend redraw the same true 3D instance without creating duplicates", async () => {
  const { controller, map, documentStub } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  const beforeDrawCount = map.drawCount();

  map.fire("moveend");
  map.setZoom(19);
  map.fire("zoomend");

  const status = controller.getFirstApprovedLiveAssetStatus();
  assert.equal(status.rendererSurfaceCount, 1);
  assert.equal(status.modelInstanceCount, 1);
  assert.equal(documentStub.overlayPane.children.length, 1);
  assert.ok(map.drawCount() > beforeDrawCount);
});

test("approved live asset controller updates deterministically and preserves the same model instance id", async () => {
  const { controller } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  const updated = await controller.updateFirstApprovedLiveAsset({
    latitude: -38.118,
    longitude: 144.612
  });

  assert.equal(updated.outcome, "updated");
  assert.equal(
    updated.status.modelInstanceId,
    approvedAssetModule.DEFAULT_FIRST_APPROVED_LIVE_ASSET_MODEL_INSTANCE_ID
  );
  assert.equal(updated.status.latitude, -38.118);
  assert.equal(updated.status.longitude, 144.612);
  assert.equal(updated.status.modelInstanceCount, 1);
});

test("approved live asset controller clears model instance, listeners, and renderer canvas cleanly", async () => {
  const { controller, map, documentStub } = await createControllerHarness();

  await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });
  const cleared = controller.clearFirstApprovedLiveAsset();

  assert.equal(cleared.outcome, "removed");
  assert.equal(cleared.status.liveAssetPresent, false);
  assert.equal(cleared.status.modelInstanceCount, 0);
  assert.equal(cleared.status.rendererSurfaceCount, 0);
  assert.equal(cleared.status.rendererCanvasCount, 0);
  assert.equal(cleared.status.ownedListenerCount, 0);
  assert.equal(map.listenerCount(), 0);
  assert.equal(documentStub.overlayPane.children.length, 0);
});

test("approved live asset controller fails closed when the GLB fetch fails", async () => {
  const { gl } = createFakeWebGLContext();
  const documentStub = createDocumentStub(gl);
  const map = createMapStub(documentStub, { drawArraysCount: 0 });
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController(
      {
        getGrowGoMap: () => map,
        attachmentStatusProvider: () => createAttachedStatus(),
        documentObject: documentStub,
        hostObject: { location: { hostname: "127.0.0.1" } },
        fetchProvider: async () => ({
          ok: false,
          async arrayBuffer() {
            return new ArrayBuffer(0);
          }
        })
      }
    );

  const result = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "APPROVED_ASSET_GLB_FETCH_FAILED");
});

test("approved live asset controller fails closed when Atlas is not attached", async () => {
  const arrayBuffer = await loadTreeGameplayGlbArrayBuffer();
  const { gl } = createFakeWebGLContext();
  const documentStub = createDocumentStub(gl);
  const map = createMapStub(documentStub, { drawArraysCount: 0 });
  const controller =
    approvedAssetModule.createDeveloperOnlyAtlasFirstApprovedLiveAssetController(
      {
        getGrowGoMap: () => map,
        attachmentStatusProvider: () => ({
          attached: false,
          exactLiveMapBound: false
        }),
        documentObject: documentStub,
        hostObject: { location: { hostname: "127.0.0.1" } },
        fetchProvider: createFetchProvider(arrayBuffer)
      }
    );

  const result = await controller.placeFirstApprovedLiveAsset({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "ATLAS_NOT_ATTACHED");
});
