import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
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

const normalizeDevicePixelRatioBody = extractFunctionBody(
  "normalizeCustom25DDevicePixelRatio"
);
const freezeFrameViewportSnapshotBody = extractFunctionBody(
  "freezeCustom25DFrameViewportSnapshot"
);
const createFrameViewportSnapshotBody = extractFunctionBody(
  "createCustom25DFrameViewportSnapshot"
);
const normalizeSnapshotForDrawBody = extractFunctionBody(
  "normalizeCustom25DFrameViewportSnapshotForDraw"
);
const drawWithSnapshotBody = extractFunctionBody(
  "drawCustom25DMapCanvasWithFrameSnapshot"
);
const drawMapCanvasBody = extractFunctionBody("drawCustom25DMapCanvas");
const initMapExperimentBody = extractFunctionBody("initCustom25DMapExperiment");

const strippedNormalizeSnapshotForDrawBody = stripComments(
  normalizeSnapshotForDrawBody
);
const strippedDrawWithSnapshotBody = stripComments(drawWithSnapshotBody);
const strippedDrawMapCanvasBody = stripComments(drawMapCanvasBody);

function createLayerRecorder() {
  const calls = [];
  return {
    calls,
    background(ctx, size, bounds) {
      calls.push({ name: "background", ctx, size, bounds });
    },
    zones(ctx, bounds, topLeft) {
      calls.push({ name: "zones", ctx, bounds, topLeft });
    },
    buildings(ctx, bounds, topLeft) {
      calls.push({ name: "buildings", ctx, bounds, topLeft });
    },
    roads(ctx, bounds, topLeft) {
      calls.push({ name: "roads", ctx, bounds, topLeft });
    },
    trees(ctx, bounds, topLeft) {
      calls.push({ name: "trees", ctx, bounds, topLeft });
    },
    landmarks(ctx, bounds) {
      calls.push({ name: "landmarks", ctx, bounds });
    }
  };
}

function compileSnapshotAwareHelpers({
  recorder,
  mutatePositionPointInPlace = false
} = {}) {
  const evaluationSource = `
const CUSTOM_25D_FRAME_VIEWPORT_SNAPSHOT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_FRAME_VIEWPORT_SNAPSHOT_001";
${normalizeDevicePixelRatioBody}
${freezeFrameViewportSnapshotBody}
${normalizeSnapshotForDrawBody}
${drawWithSnapshotBody}
${createFrameViewportSnapshotBody}
${drawMapCanvasBody}
module.exports = {
  normalizeCustom25DFrameViewportSnapshotForDraw,
  drawCustom25DMapCanvasWithFrameSnapshot,
  drawCustom25DMapCanvas,
  createCustom25DFrameViewportSnapshot
};
`;

  const context = {
    module: { exports: {} },
    exports: {},
    Object,
    Number,
    Math,
    Error,
    ENABLE_CUSTOM_25D_MAP: true,
    map: null,
    window: { devicePixelRatio: 2 },
    L: {
      DomUtil: {
        setPosition(canvas, point) {
          if (mutatePositionPointInPlace) {
            point.x = Math.round(point.x);
            point.y = Math.round(point.y);
          }
          canvas.position = { x: point.x, y: point.y };
        }
      }
    },
    drawCustom25DBackground:
      recorder?.background ?? (() => {}),
    drawCustom25DZonesLiveCallsite:
      recorder?.zones ?? (() => {}),
    drawCustom25DBuildingsLiveCallsite:
      recorder?.buildings ?? (() => {}),
    drawCustom25DRoadsLiveCallsite:
      recorder?.roads ?? (() => {}),
    drawCustom25DTreesLiveCallsite:
      recorder?.trees ?? (() => {}),
    renderCustomLandmarkLayerLiveCallsite:
      recorder?.landmarks ?? (() => {})
  };

  vm.createContext(context);
  vm.runInContext(evaluationSource, context);
  return {
    helpers: context.module.exports,
    context
  };
}

function createFakeContext2D() {
  const calls = [];
  return {
    calls,
    setTransform(...args) {
      calls.push({ name: "setTransform", args });
    },
    clearRect(...args) {
      calls.push({ name: "clearRect", args });
    }
  };
}

function createFakeCanvas(context2d = createFakeContext2D()) {
  return {
    className: "custom-25d-map-canvas",
    width: 0,
    height: 0,
    style: {
      width: "0px",
      height: "0px"
    },
    getContext(type) {
      return type === "2d" ? context2d : null;
    }
  };
}

function createImmutableFrameSnapshot(overrides = {}) {
  const north = overrides.north ?? -38.12;
  const south = overrides.south ?? -38.28;
  const east = overrides.east ?? 145.13;
  const west = overrides.west ?? 144.98;
  const snapshot = {
    schemaId: "GROWGO_CUSTOM25D_FRAME_VIEWPORT_SNAPSHOT_001",
    logicalWidth: overrides.logicalWidth ?? 640,
    logicalHeight: overrides.logicalHeight ?? 360,
    backingWidth: overrides.backingWidth ?? 1280,
    backingHeight: overrides.backingHeight ?? 720,
    devicePixelRatio: overrides.devicePixelRatio ?? 2,
    bounds: Object.freeze({
      north,
      south,
      east,
      west
    }),
    northWestCoordinate: Object.freeze({
      latitude: overrides.latitude ?? north,
      longitude: overrides.longitude ?? west
    }),
    canvasLayerPosition: Object.freeze({
      x: overrides.x ?? 12,
      y: overrides.y ?? 34
    }),
    zoom: overrides.zoom ?? 16.5,
    mapIdentityValidated: true,
    canvasIdentityValidated: true,
    snapshotCreated: true,
    drawRequested: false,
    listenerAdded: false,
    retentionWritten: false,
    contains([latitude, longitude]) {
      const normalizedLatitude = Number(latitude);
      const normalizedLongitude = Number(longitude);
      return (
        Number.isFinite(normalizedLatitude) &&
        Number.isFinite(normalizedLongitude) &&
        normalizedLatitude <= north &&
        normalizedLatitude >= south &&
        normalizedLongitude <= east &&
        normalizedLongitude >= west
      );
    },
    getNorthWest() {
      return {
        lat: overrides.latitude ?? north,
        lng: overrides.longitude ?? west
      };
    },
    getCenter() {
      return {
        lat: (north + south) / 2,
        lng: (east + west) / 2
      };
    }
  };

  Object.freeze(snapshot);
  return snapshot;
}

test("drawCustom25DMapCanvas still exists, creates one frame snapshot, and delegates to the snapshot-aware seam", () => {
  assert.match(indexSource, /<script src="script\.js\?v=cards14"><\/script>/);
  assert.match(strippedDrawMapCanvasBody, /function drawCustom25DMapCanvas\(canvas\)/);
  assert.match(
    strippedDrawMapCanvasBody,
    /frameViewportSnapshot = createCustom25DFrameViewportSnapshot\(\s*\{\s*map,\s*canvas\s*\}\s*\)/
  );
  assert.match(
    strippedDrawMapCanvasBody,
    /return drawCustom25DMapCanvasWithFrameSnapshotPrivateImplementation\(\s*\{\s*canvas,\s*frameViewportSnapshot\s*\}\s*\);/
  );
  assert.equal(
    strippedDrawMapCanvasBody.match(/createCustom25DFrameViewportSnapshot\(/g)?.length ?? 0,
    1
  );
  assert.doesNotMatch(
    strippedDrawMapCanvasBody,
    /return drawCustom25DMapCanvas\(\s*canvas\s*\)/
  );
});

test("snapshot-aware seam accepts a supplied frame snapshot and performs no direct map or device pixel ratio reads", () => {
  assert.match(
    strippedDrawWithSnapshotBody,
    /function drawCustom25DMapCanvasWithFrameSnapshot\(\{\s*canvas,\s*frameViewportSnapshot\s*\} = \{\}\)/
  );

  for (const pattern of [
    /map\.getSize\(/,
    /map\.getBounds\(/,
    /map\.getZoom\(/,
    /map\.latLngToLayerPoint\(/,
    /window\.devicePixelRatio/
  ]) {
    assert.doesNotMatch(strippedDrawWithSnapshotBody, pattern);
    assert.doesNotMatch(strippedNormalizeSnapshotForDrawBody, pattern);
  }
});

test("snapshot fields are validated and invalid snapshot fails closed without fallback map reads", () => {
  const recorder = createLayerRecorder();
  const { helpers } = compileSnapshotAwareHelpers({ recorder });
  const canvas = createFakeCanvas();

  const invalidResult = helpers.drawCustom25DMapCanvasWithFrameSnapshot({
    canvas,
    frameViewportSnapshot: createImmutableFrameSnapshot({ logicalWidth: 0 })
  });

  assert.equal(invalidResult.outcome, "blocked");
  assert.equal(invalidResult.reasonCode, "FRAME_VIEWPORT_SNAPSHOT_VALUES_INVALID");
  assert.deepEqual(recorder.calls, []);
});

test("canvas and context behavior remain equivalent, transform and clear happen once, and layer order is unchanged", () => {
  const recorder = createLayerRecorder();
  const { helpers } = compileSnapshotAwareHelpers({ recorder });
  const context2d = createFakeContext2D();
  const canvas = createFakeCanvas(context2d);
  const snapshot = createImmutableFrameSnapshot();

  const result = helpers.drawCustom25DMapCanvasWithFrameSnapshot({
    canvas,
    frameViewportSnapshot: snapshot
  });

  assert.equal(result.outcome, "drawn");
  assert.equal(result.reasonCode, "FRAME_DRAW_COMPLETED");
  assert.deepEqual(canvas.position, { x: 12, y: 34 });
  assert.equal(canvas.width, 1280);
  assert.equal(canvas.height, 720);
  assert.equal(canvas.style.width, "640px");
  assert.equal(canvas.style.height, "360px");
  assert.deepEqual(context2d.calls, [
    { name: "setTransform", args: [2, 0, 0, 2, 0, 0] },
    { name: "clearRect", args: [0, 0, 640, 360] }
  ]);
  assert.deepEqual(
    recorder.calls.map((entry) => entry.name),
    ["background", "zones", "buildings", "roads", "trees", "landmarks"]
  );
});

test("snapshot-aware seam uses a mutable local position handoff so in-place Leaflet positioning does not mutate the frozen snapshot", () => {
  const recorder = createLayerRecorder();
  const { helpers } = compileSnapshotAwareHelpers({
    recorder,
    mutatePositionPointInPlace: true
  });
  const context2d = createFakeContext2D();
  const canvas = createFakeCanvas(context2d);
  const snapshot = createImmutableFrameSnapshot({ x: 12.4, y: 34.6 });

  const result = helpers.drawCustom25DMapCanvasWithFrameSnapshot({
    canvas,
    frameViewportSnapshot: snapshot
  });

  assert.equal(result.outcome, "drawn");
  assert.equal(result.reasonCode, "FRAME_DRAW_COMPLETED");
  assert.deepEqual(canvas.position, { x: 12, y: 35 });
  assert.deepEqual(snapshot.canvasLayerPosition, { x: 12.4, y: 34.6 });
  assert.equal(Object.isFrozen(snapshot.canvasLayerPosition), true);
});

test("zones, buildings, roads, trees, and landmarks paths remain unchanged, startup remains unchanged, and no browser activation command exists", () => {
  assert.match(
    strippedDrawWithSnapshotBody,
    /drawCustom25DBackground\(ctx, size, bounds\);[\s\S]*drawCustom25DZonesLiveCallsite\(ctx, bounds, topLeft\);[\s\S]*drawCustom25DBuildingsLiveCallsite\(ctx, bounds, topLeft\);[\s\S]*drawCustom25DRoadsLiveCallsite\(ctx, bounds, topLeft\);[\s\S]*drawCustom25DTreesLiveCallsite\(ctx, bounds, topLeft\);[\s\S]*renderCustomLandmarkLayerLiveCallsite\(ctx, bounds\);/s
  );
  assert.match(initMapExperimentBody, /custom25DMapLayer = \{ canvas, redraw \};/);
  assert.match(initMapExperimentBody, /map\.on\("moveend zoomend", redraw\);/);
  assert.doesNotMatch(scriptSource, /runAtlasRendererHandoffLiveOneFrameAttempt/);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /drawCustom25DMapCanvasWithFrameSnapshot|runAtlasRendererHandoffLiveOneFrameAttempt/
  );
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_MAP = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA = false;/);
});
