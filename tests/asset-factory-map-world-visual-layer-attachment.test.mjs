import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-visual-layer-attachment.mjs"
  )
);
const previewMountModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-engine-first-manual-browser-visible-preview-mount.mjs"
  )
);

function createSyntheticGlb({
  materialNames = ["VisualLayerMaterialA", "VisualLayerMaterialB"]
} = {}) {
  const json = JSON.stringify({
    asset: { version: "2.0" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [{ attributes: { POSITION: 0 }, material: 0 }]
      }
    ],
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

function stableNumericHash(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash).padStart(10, "0");
}

function createMockCanvasContext() {
  return {
    commands: [],
    fillStyle: "",
    font: "",
    textAlign: "",
    fillRect(...args) {
      this.commands.push(["fillRect", ...args]);
    },
    beginPath() {
      this.commands.push(["beginPath"]);
    },
    moveTo(...args) {
      this.commands.push(["moveTo", ...args]);
    },
    lineTo(...args) {
      this.commands.push(["lineTo", ...args]);
    },
    closePath() {
      this.commands.push(["closePath"]);
    },
    fill() {
      this.commands.push(["fill"]);
    },
    arc(...args) {
      this.commands.push(["arc", ...args]);
    },
    fillText(...args) {
      this.commands.push(["fillText", ...args]);
    },
    clearRect(...args) {
      this.commands.push(["clearRect", ...args]);
    }
  };
}

function createMockElement(id = "") {
  return {
    id,
    hidden: false,
    textContent: "",
    className: "",
    dataset: {},
    children: [],
    listeners: new Map(),
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) {
        this.children.splice(index, 1);
      }
      child.parentNode = null;
      return child;
    },
    addEventListener(type, handler) {
      this.listeners.set(type, handler);
    },
    setAttribute(name, value) {
      this[name] = value;
    }
  };
}

function createMockDocument() {
  const elements = new Map([
    ["atlasPreviewContainer", createMockElement("atlasPreviewContainer")],
    ["atlasPreviewCanvasHost", createMockElement("atlasPreviewCanvasHost")],
    ["atlasPreviewShowButton", createMockElement("atlasPreviewShowButton")],
    ["atlasPreviewHideButton", createMockElement("atlasPreviewHideButton")],
    ["atlasPreviewStatus", createMockElement("atlasPreviewStatus")]
  ]);

  return {
    getElementById(id) {
      return elements.get(id) ?? null;
    },
    createElement(tagName) {
      if (tagName !== "canvas") {
        return createMockElement();
      }
      const context = createMockCanvasContext();
      return {
        ...createMockElement(),
        tagName: "CANVAS",
        width: 0,
        height: 0,
        getContext(type) {
          return type === "2d" ? context : null;
        },
        _context: context
      };
    }
  };
}

function buildPreviewMountOptions() {
  const foundation =
    previewMountModule.atlasEngineFirstManualBrowserVisiblePreviewMountFoundationDefinition;
  const lightingMode = "day_showcase";
  const drawSessionId = `${foundation.drawSessionId}_${stableNumericHash(
    "ATLAS_FIRST_VISIBLE_CANVAS_DRAW_RESULT_001_0123456789::day_showcase::draw"
  )}`;
  const captureId = `${foundation.drawResultId}_${stableNumericHash(
    `${drawSessionId}::${lightingMode}::visible-capture`
  )}`;

  return {
    validateAtlasEngineFirstVisibleCanvasDrawResultFoundation: () => ({
      ok: true,
      atlasFirstVisibleCanvasDrawResult: {
        captureId,
        drawSessionId,
        canvasResult: {
          exists: true,
          width: 1280,
          height: 720,
          pixelRatio: 1,
          lightingMode,
          drawCommandCount: 4,
          drawCommandsExecuted: true
        },
        frameResult: {
          frameProduced: true,
          visibleState: "verified-visible",
          objectCount: 11,
          deterministicOutput: true
        },
        verificationState: {
          currentState: "verified",
          cleanupSuccessful: true
        }
      }
    })
  };
}

test("map world visual layer attachment validates a coordinate-synced visible layer package", async () => {
  const attachment = await moduleUnderTest.createMapWorldVisualLayerAttachment(
    moduleUnderTest.mapWorldVisualLayerAttachmentDefinition,
    buildLoaderOptions()
  );
  const result = moduleUnderTest.validateMapWorldVisualLayerAttachment(attachment);

  assert.equal(result.ok, true);
  assert.equal(attachment.visibilityState.currentState, "hidden");
  assert.equal(attachment.cameraState.synchronized, true);
  assert.equal(
    attachment.cameraState.mapCenterCoordinate.latitude,
    attachment.mapWorldRealMapDisplay.centerCoordinate.latitude
  );
  assert.equal(attachment.validationResult.correctWorldForCoordinate, true);
});

test("same coordinate produces deterministic visual layer output", async () => {
  const first = await moduleUnderTest.createMapWorldVisualLayerAttachment(
    moduleUnderTest.mapWorldVisualLayerAttachmentDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createMapWorldVisualLayerAttachment(
    moduleUnderTest.mapWorldVisualLayerAttachmentDefinition,
    buildLoaderOptions()
  );

  assert.equal(first.layerId, second.layerId);
  assert.equal(first.worldId, second.worldId);
  assert.equal(first.sceneId, second.sceneId);
});

test("map world visual layer session supports activation, toggle, camera sync, and cleanup", async () => {
  const session = moduleUnderTest.createMapWorldVisualLayerSession({
    loaderOptions: buildLoaderOptions()
  });

  const loaded = await session.loadFixedTestCoordinate();
  assert.equal(loaded.ok, true);
  assert.equal(session.currentVisualLayerState(), "hidden");

  const moved = await session.moveMapCenter({
    latitudeDelta: 0.001,
    longitudeDelta: 0
  });
  assert.equal(moved.ok, true);
  assert.equal(
    moved.mapWorldVisualLayerAttachment.cameraState.mapCenterCoordinate.latitude,
    moved.mapWorldVisualLayerAttachment.mapWorldRealMapDisplay.centerCoordinate.latitude
  );

  const activated = session.activateVisualLayer({
    document: createMockDocument(),
    previewMountOptions: buildPreviewMountOptions()
  });
  assert.equal(activated.ok, true);
  assert.equal(session.currentVisualLayerState(), "visible");
  assert.equal(activated.mapWorldVisualLayerAttachment.visibilityState.visible, true);
  assert.ok(
    activated.atlasPreviewAttachment.atlasBrowserDemoHarness.canvas._context.commands.some(
      (command) =>
        command[0] === "fillText" && command[1] === "LIGHTHOUSE_ISLAND_ROCKY_001"
    )
  );

  const toggledHidden = session.toggleWorldLayer();
  assert.equal(toggledHidden.ok, true);
  assert.equal(session.currentVisualLayerState(), "hidden");
  assert.equal(toggledHidden.mapWorldVisualLayerAttachment.visibilityState.visible, false);
});
