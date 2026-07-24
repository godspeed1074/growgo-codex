import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const harnessModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "client",
    "atlas-browser-demo-harness.mjs"
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
const realGroundPreviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-real-glb-atlas-preview-replacement.mjs"
  )
);
const realGroundRenderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-real-glb-renderer-preview-test.mjs"
  )
);
const realGroundMeshPreviewModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-real-glb-mesh-preview-integration.mjs"
  )
);
const realGroundRuntimeLoaderModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-minimal-glb-runtime-loader.mjs"
  )
);
const realGroundMeshRenderTestModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "ground-coastal-grass-real-glb-mesh-visual-render-test.mjs"
  )
);

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
    click() {
      const handler = this.listeners.get("click");
      if (handler) {
        handler();
      }
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

function buildRealGroundPreviewBinding() {
  const definition =
    realGroundPreviewModule.groundCoastalGrassRealGlbAtlasPreviewReplacementDefinition;
  const existingPaths = [
    definition.importReference.glbPath,
    definition.importReference.manifestReference,
    definition.importReference.metadataReference,
    definition.rendererPayload.lodGlb,
    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_GAMEPLAY.glb",
    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_MAP.glb",
    "asset-factory-workspace/production/COASTAL_GROUND_FAMILY_001/export/GROUND_COASTAL_GRASS_001_LOD_DISTANT_SILHOUETTE.glb"
  ];

  const result =
    realGroundPreviewModule.validateGroundCoastalGrassRealGlbAtlasPreviewReplacement(
      definition,
      {
        existsSync(candidatePath) {
          return existingPaths.includes(candidatePath);
        }
      }
    );

  assert.equal(result.ok, true);
  return result.realGlbAtlasPreviewReplacement.definition;
}

function buildRealGroundRenderBinding({ glbExists = true } = {}) {
  const definition =
    realGroundRenderModule.groundCoastalGrassRealGlbRendererPreviewTestDefinition;
  const existingPaths = glbExists
    ? [
        definition.glbReference.glbPath,
        definition.glbReference.manifestReference,
        definition.glbReference.metadataReference
      ]
    : [];

  const result =
    realGroundRenderModule.validateGroundCoastalGrassRealGlbRendererPreviewTest(
      {
        ...definition,
        renderState: {
          ...definition.renderState,
          realGeometryReady: glbExists
        },
        verificationResult: {
          ...definition.verificationResult,
          glbExists
        }
      },
      {
        existsSync(candidatePath) {
          return existingPaths.includes(candidatePath);
        }
      }
    );

  assert.equal(result.ok, true);
  return result.realGlbRendererPreview.definition;
}

function buildRealGroundMeshPreview({ glbExists = true } = {}) {
  const definition =
    realGroundMeshPreviewModule.groundCoastalGrassRealGlbMeshPreviewIntegrationDefinition;
  const existingPaths = glbExists
    ? [
        definition.glbReference.glbPath,
        definition.glbReference.manifestReference,
        definition.glbReference.metadataReference
      ]
    : [];

  const result =
    realGroundMeshPreviewModule.validateGroundCoastalGrassRealGlbMeshPreviewIntegration(
      {
        ...definition,
        loadState: {
          ...definition.loadState,
          currentState: glbExists ? "loaded" : "requested"
        },
        validationResult: {
          ...definition.validationResult,
          glbAvailable: glbExists,
          meshLoaded: glbExists,
          materialsLoaded: glbExists
        }
      },
      {
        existsSync(candidatePath) {
          return existingPaths.includes(candidatePath);
        }
      }
    );

  assert.equal(result.ok, true);
  return result.realGlbMeshPreview.definition;
}

function createSyntheticGlb({ materialNames = ["GrassBase", "GrassDetail"] } = {}) {
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

async function buildRealGroundRuntimeLoader() {
  const definition =
    realGroundRuntimeLoaderModule.groundCoastalGrassMinimalGlbRuntimeLoaderDefinition;
  const result =
    await realGroundRuntimeLoaderModule.loadGroundCoastalGrassMinimalGlbRuntimeLoader(
      definition,
      {
        existsSync(candidatePath) {
          return candidatePath === definition.glbReference.glbPath;
        },
        loadArrayBuffer() {
          return Promise.resolve(createSyntheticGlb());
        }
      }
    );

  assert.equal(result.ok, true);
  return result.glbRuntimeLoader.definition;
}

async function buildRealGroundMeshRenderTest() {
  const runtimeLoaderDefinition = await buildRealGroundRuntimeLoader();
  return realGroundMeshRenderTestModule.createGroundCoastalGrassRealGlbMeshVisualRenderTest(
    runtimeLoaderDefinition
  );
}

test("Atlas browser demo harness mounts and draws a visible placeholder preview", async () => {
  const document = createMockDocument();
  const realGroundRuntimeLoader = await buildRealGroundRuntimeLoader();
  const realGroundMeshRenderTest = await buildRealGroundMeshRenderTest();
  const result = harnessModule.createAtlasBrowserDemoHarness({
    document,
    previewMountOptions: buildPreviewMountOptions(),
    realGroundPreviewBinding: buildRealGroundPreviewBinding(),
    realGroundRenderBinding: buildRealGroundRenderBinding(),
    realGroundMeshPreview: buildRealGroundMeshPreview(),
    realGroundRuntimeLoader,
    realGroundMeshRenderTest
  });

  assert.equal(result.ok, true);

  const harness = result.atlasBrowserDemoHarness;
  const shown = harness.showPreview();
  assert.equal(shown.ok, true);
  assert.equal(
    harness.elements.previewContainer.dataset.previewVisible,
    "true"
  );
  assert.match(harness.elements.status.textContent, /rendered GLB mesh/i);
  assert.equal(harness.elements.canvasContainer.children.length, 1);
  assert.ok(harness.canvas._context.commands.length > 0);
  assert.ok(
    harness.canvas._context.commands.some(
      (command) =>
        command[0] === "fillText" && command[1] === "GROUND_COASTAL_GRASS_001"
    )
  );
  assert.ok(
    harness.canvas._context.commands.some(
      (command) => command[0] === "lineTo"
    )
  );
  assert.ok(
    harness.canvas._context.commands.some(
      (command) =>
        command[0] === "fillText" && String(command[1]).includes("verified :: GrassBase")
      )
  );
});

test("Atlas browser demo harness keeps placeholder fallback when real GLB render binding is unavailable", () => {
  const document = createMockDocument();
  const result = harnessModule.createAtlasBrowserDemoHarness({
    document,
    previewMountOptions: buildPreviewMountOptions(),
    realGroundPreviewBinding: buildRealGroundPreviewBinding(),
    realGroundRenderBinding: buildRealGroundRenderBinding({ glbExists: false })
  });

  assert.equal(result.ok, true);
  const harness = result.atlasBrowserDemoHarness;
  const shown = harness.showPreview();

  assert.equal(shown.ok, true);
  assert.match(harness.elements.status.textContent, /real GLB ground asset/i);
});

test("Atlas browser demo harness hides and cleans up the preview", () => {
  const document = createMockDocument();
  const result = harnessModule.createAtlasBrowserDemoHarness({
    document,
    previewMountOptions: buildPreviewMountOptions()
  });
  const harness = result.atlasBrowserDemoHarness;

  harness.showPreview();
  const cleanup = harness.hidePreview();

  assert.equal(cleanup.ok, true);
  assert.equal(harness.elements.previewContainer.hidden, true);
  assert.equal(harness.elements.canvasContainer.children.length, 0);
});

test("Atlas browser demo harness rejects duplicate activation safely", () => {
  const document = createMockDocument();
  const result = harnessModule.createAtlasBrowserDemoHarness({
    document,
    previewMountOptions: buildPreviewMountOptions()
  });
  const harness = result.atlasBrowserDemoHarness;

  const first = harness.showPreview();
  const second = harness.showPreview();

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.previewMountResult, null);
  assert.match(harness.elements.status.textContent, /prevents duplicate/i);
});
