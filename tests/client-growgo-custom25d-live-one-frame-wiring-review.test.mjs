import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const sessionCoordinatorSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-session-coordinator.mjs"
  ),
  "utf8"
);
const reviewReportSource = fs.readFileSync(
  path.join(
    repoRoot,
    "GROWGO_SESSION_211_42_NARROW_LIVE_ONE_FRAME_ADAPTER_WIRING_REVIEW.md"
  ),
  "utf8"
);

const surfaceOperationsModule = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-one-frame-surface-operations.mjs"
  )
);
const drawOperationModule = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-one-frame-draw-operation.mjs"
  )
);
const lifecycleOwnerModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs"
  )
);

function extractFunctionBody(name) {
  const marker = `function ${name}(`;
  const start = scriptSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} should exist in script.js`);

  const paramsStart = scriptSource.indexOf("(", start);
  assert.notEqual(paramsStart, -1, `${name} should have parameter parentheses`);

  let paramDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < scriptSource.length; index += 1) {
    const character = scriptSource[index];
    if (character === "(") paramDepth += 1;
    if (character === ")") paramDepth -= 1;
    if (paramDepth === 0) {
      paramsEnd = index;
      break;
    }
  }

  assert.notEqual(paramsEnd, -1, `${name} should have a closing parenthesis`);

  const bodyStart = scriptSource.indexOf("{", paramsEnd);
  assert.notEqual(bodyStart, -1, `${name} should have an opening brace`);

  let depth = 0;
  for (let index = bodyStart; index < scriptSource.length; index += 1) {
    const character = scriptSource[index];
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth === 0) {
      return scriptSource.slice(start, index + 1);
    }
  }

  assert.fail(`${name} should have a closing brace`);
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function createLiveMapEnvironment() {
  const pane = {
    dataset: { owner: "custom25DMapPane" },
    children: [],
    childElementCount: 0,
    appendChild(node) {
      node.parentNode = this;
      this.children.push(node);
      this.childElementCount = this.children.length;
    },
    removeChild(node) {
      this.children = this.children.filter((child) => child !== node);
      this.childElementCount = this.children.length;
      node.parentNode = null;
    }
  };

  const parentNode = {
    removed: [],
    removeChild(node) {
      this.removed.push(node);
      node.parentNode = null;
    }
  };
  pane.parentNode = parentNode;

  const map = {
    getPane(name) {
      return name === "custom25DMapPane" ? pane : null;
    },
    createPane(name) {
      pane.dataset.owner = name;
      return pane;
    },
    getSize() {
      return { x: 640, y: 360 };
    },
    getBounds() {
      return {
        getNorthWest() {
          return { lat: -38.12, lng: 144.61 };
        }
      };
    },
    latLngToLayerPoint() {
      return { x: 12, y: 34 };
    },
    off() {}
  };

  const leafletProvider = {
    DomUtil: {
      create(tagName, className) {
        return {
          tagName,
          className,
          style: {},
          parentNode: null,
          remove() {
            if (this.parentNode && typeof this.parentNode.removeChild === "function") {
              this.parentNode.removeChild(this);
            }
          }
        };
      },
      setPosition(canvas, point) {
        canvas.position = { x: point.x, y: point.y };
      }
    }
  };

  return { map, pane, parentNode, leafletProvider };
}

const drawMapCanvasBody = stripComments(
  extractFunctionBody("drawCustom25DMapCanvas")
);
const zoneViewportFactoryBody = stripComments(
  extractFunctionBody("createCustom25DZonesLiveViewportProjection")
);
const buildingViewportFactoryBody = stripComments(
  extractFunctionBody("createCustom25DBuildingsLiveViewportProjection")
);
const roadViewportFactoryBody = stripComments(
  extractFunctionBody("createCustom25DRoadsLiveViewportProjection")
);
const treeViewportFactoryBody = stripComments(
  extractFunctionBody("createCustom25DTreesLiveViewportProjection")
);
const landmarkViewportFactoryBody = stripComments(
  extractFunctionBody("createCustom25DLandmarksLiveViewportProjection")
);

test("phase 211.41 frame-root snapshot remains active and all five active layers still consume the shared frame snapshot", () => {
  assert.match(indexSource, /<script src="script\.js\?v=cards14"><\/script>/);
  assert.match(
    drawMapCanvasBody,
    /frameViewportSnapshot = createCustom25DFrameViewportSnapshot\(\s*\{\s*map,\s*canvas\s*\}\s*\)/
  );
  assert.match(drawMapCanvasBody, /const bounds = frameViewportSnapshot;/);
  assert.match(
    drawMapCanvasBody,
    /const topLeft = frameViewportSnapshot\.canvasLayerPosition;/
  );

  for (const block of [
    zoneViewportFactoryBody,
    buildingViewportFactoryBody,
    roadViewportFactoryBody,
    treeViewportFactoryBody
  ]) {
    assert.match(block, /frameViewportSnapshot\?\.zoom/);
    assert.match(
      block,
      /frameViewportSnapshot\?\.contains\(\[latitude, longitude\]\) === true/
    );
  }

  assert.match(
    landmarkViewportFactoryBody,
    /frameViewportSnapshot\?\.contains\(\[latitude, longitude\]\) === true/
  );
  assert.match(
    landmarkViewportFactoryBody,
    /layerPoint: \{\s*x: point\.x,\s*y: point\.y\s*\}/s
  );
});

test("the live surface bundle satisfies the live draw contract, but lifecycle registration still needs a narrow translation layer", () => {
  const env = createLiveMapEnvironment();
  const surfaceOperations =
    surfaceOperationsModule.createGrowGoCustom25DLiveOneFrameSurfaceOperations({
      leafletProvider: env.leafletProvider,
      devicePixelRatioProvider: () => 2
    });

  const surfaceResult = surfaceOperations.prepareOneFrameSurface({ map: env.map });
  assert.equal(surfaceResult.outcome, "prepared");
  assert.equal(surfaceResult.reasonCode, "LIVE_SURFACE_PREPARED");
  assert.equal(surfaceResult.surface.schemaId, "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001");
  assert.equal(surfaceResult.surface.cleanupRequired, true);
  assert.equal(surfaceResult.surface.rollbackAvailable, true);
  assert.equal(surfaceResult.surface.listenerAdded, false);
  assert.equal(surfaceResult.surface.retentionWritten, false);
  assert.equal(surfaceResult.surface.drawRequested, false);

  const drawOperation =
    drawOperationModule.createGrowGoCustom25DLiveOneFrameDrawOperation({
      drawFunctionProvider: () => () => ({ ok: true })
    });
  const drawResult = drawOperation.drawPreparedSurfaceExactlyOnce({
    surface: surfaceResult.surface,
    canvas: surfaceResult.surface.canvas
  });
  assert.equal(drawResult.outcome, "completed");
  assert.equal(drawResult.reasonCode, "LIVE_ONE_FRAME_DRAW_COMPLETED");
  assert.equal(drawResult.completedFrameCount, 1);
  assert.equal(drawResult.cleanupRequired, true);
  assert.equal(drawResult.lifecycleCleanupRequired, true);

  const lifecycleOwner =
    lifecycleOwnerModule.createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
      removeCanvas() {},
      removePaneIfEmpty() {}
    });
  const registrationResult = lifecycleOwner.registerOwnedResources(
    surfaceResult.surface
  );
  assert.equal(registrationResult.outcome, "failed_closed");
  assert.equal(registrationResult.reasonCode, "LISTENER_REQUIRED");
});

test("live surface operations and live draw operations remain disconnected, while the review stays classified as a translation gap", () => {
  const surfaceLock =
    surfaceOperationsModule.inspectGrowGoCustom25DLiveOneFrameSurfaceOperationsSourceLock(
      { scriptSource }
    );
  assert.equal(surfaceLock.ok, true);
  assert.equal(
    surfaceLock.classification,
    "LIVE_SURFACE_SOURCE_LOCK_CONFIRMED"
  );
  assert.equal(
    surfaceLock.currentRendererBehavior.rendererResizesAgainEachFrame,
    true
  );

  const drawLock =
    drawOperationModule.inspectGrowGoCustom25DLiveOneFrameDrawOperationSourceLock(
      { scriptSource }
    );
  assert.equal(drawLock.ok, true);
  assert.equal(
    drawLock.classification,
    "BLOCKED_BY_GLOBAL_MAP_DEPENDENCY"
  );

  assert.match(
    reviewReportSource,
    /Classification:\s*`BLOCKED_BY_CONTRACT_TRANSLATION_GAP`/
  );
});

test("session coordination remains fake-only, no browser consumption seam is exposed, startup ownership stays unchanged, and all four canonical safety flags remain false", () => {
  assert.doesNotMatch(sessionCoordinatorSource, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(
    sessionCoordinatorSource,
    /document\.|window\.|createElement|appendChild|addEventListener/
  );
  assert.match(
    sessionCoordinatorSource,
    /authorizationConsumeAttemptCount:\s*0/
  );

  assert.match(
    developmentAlphaAppSource,
    /installControlledOneSessionDeveloperRendererHandoffAuthorization/
  );
  assert.match(
    developmentAlphaAppSource,
    /installDeveloperOnlyLiveAtlasRendererHandoffReadiness/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /consumeAuthorizedRendererHandoffAttempt|simulateOneFrameActivation|execute_authorized_one_frame_session/
  );

  assert.match(scriptSource, /let custom25DMapLayer = null;/);
  assert.match(
    scriptSource,
    /custom25DMapLayer = \{ canvas, redraw \};/
  );
  assert.match(scriptSource, /map\.on\("moveend zoomend", redraw\);/);
  assert.doesNotMatch(
    scriptSource,
    /createGrowGoCustom25DLiveOneFrameSurfaceOperations|createGrowGoCustom25DLiveOneFrameDrawOperation/
  );

  for (const source of [sessionCoordinatorSource, reviewReportSource]) {
    assert.match(source, /runtimeExecutionEnabled = false|runtimeExecutionEnabled:\s*false/);
    assert.match(source, /mapAttachmentAllowed = false|mapAttachmentAllowed:\s*false/);
    assert.match(
      source,
      /automaticRendererExecutionAllowed = false|automaticRendererExecutionAllowed:\s*false/
    );
    assert.match(
      source,
      /lifecycleExecutionEnabled = false|lifecycleExecutionEnabled:\s*false/
    );
  }
});
