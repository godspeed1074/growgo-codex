import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "map-world-to-atlas-scene-attachment-foundation.mjs"
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
  materialNames = ["MapAttachmentMaterialA", "MapAttachmentMaterialB"]
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
    }
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

test("map world to Atlas scene attachment foundation connects a resolved map world to the Atlas preview path", async () => {
  const attachment =
    await moduleUnderTest.createMapWorldToAtlasSceneAttachmentFoundation(
      moduleUnderTest.mapWorldToAtlasSceneAttachmentFoundationDefinition,
      buildLoaderOptions()
    );

  const result =
    moduleUnderTest.validateMapWorldToAtlasSceneAttachmentFoundation(attachment);

  assert.equal(result.ok, true);
  assert.equal(attachment.worldId, attachment.worldLocationResolver.worldId);
  assert.equal(attachment.sceneId, "COASTAL_STARTER_WORLD_REAL_ASSET_SCENE_001");
  assert.equal(attachment.assetInstances.length, 5);
  assert.equal(attachment.cameraProfile.cameraProfile, "coastal-overlook");
  assert.equal(attachment.renderState.currentState, "ready");
  assert.equal(attachment.renderState.showAction, "showCoastalWorld");
  assert.equal(attachment.validationResult.worldIdentityValid, true);
  assert.equal(attachment.validationResult.sceneIdentityValid, true);
  assert.equal(attachment.validationResult.assetReferencesValid, true);
  assert.equal(attachment.validationResult.deterministicOutputValid, true);
});

test("same map coordinate and seed produce the same deterministic Atlas attachment output", async () => {
  const first = await moduleUnderTest.createMapWorldToAtlasSceneAttachmentFoundation(
    moduleUnderTest.mapWorldToAtlasSceneAttachmentFoundationDefinition,
    buildLoaderOptions()
  );
  const second = await moduleUnderTest.createMapWorldToAtlasSceneAttachmentFoundation(
    moduleUnderTest.mapWorldToAtlasSceneAttachmentFoundationDefinition,
    buildLoaderOptions()
  );

  assert.equal(first.attachmentId, second.attachmentId);
  assert.equal(first.worldId, second.worldId);
  assert.equal(first.sceneId, second.sceneId);
  assert.deepEqual(
    first.assetInstances.map((assetInstance) => assetInstance.assetId),
    second.assetInstances.map((assetInstance) => assetInstance.assetId)
  );
});

test("map world to Atlas scene attachment attaches to the Atlas preview harness and cleans up safely", async () => {
  const attachment =
    await moduleUnderTest.createMapWorldToAtlasSceneAttachmentFoundation(
      moduleUnderTest.mapWorldToAtlasSceneAttachmentFoundationDefinition,
      {
        ...buildLoaderOptions(),
        allowFallbackShowcase: true
      }
    );

  const attached = moduleUnderTest.attachMapWorldToAtlasPreview(attachment, {
    document: createMockDocument(),
    previewMountOptions: buildPreviewMountOptions()
  });

  assert.equal(attached.ok, true);
  const harness = attached.atlasPreviewAttachment.atlasBrowserDemoHarness;
  const shown = harness.showCoastalWorld();
  assert.equal(shown.ok, true);
  assert.equal(harness.elements.previewContainer.dataset.previewVisible, "true");
  assert.match(harness.elements.status.textContent, /coastal world visible/i);
  assert.ok(
    harness.canvas._context.commands.some(
      (command) =>
        command[0] === "fillText" && command[1] === "LIGHTHOUSE_ISLAND_ROCKY_001"
    )
  );

  const hidden = harness.hideCoastalWorld();
  assert.equal(hidden.ok, true);
  assert.equal(harness.elements.previewContainer.dataset.previewVisible, "false");
  assert.match(harness.elements.status.textContent, /hidden/i);
});
