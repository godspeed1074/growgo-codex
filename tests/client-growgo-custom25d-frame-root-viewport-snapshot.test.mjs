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

function countMatches(source, pattern) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

const frameSnapshotBody = extractFunctionBody(
  "createCustom25DFrameViewportSnapshot"
);
const drawMapCanvasWithFrameSnapshotBody = extractFunctionBody(
  "drawCustom25DMapCanvasWithFrameSnapshot"
);
const drawMapCanvasBody = extractFunctionBody("drawCustom25DMapCanvas");
const initMapExperimentBody = extractFunctionBody("initCustom25DMapExperiment");

const zoneViewportFactoryBody = extractFunctionBody(
  "createCustom25DZonesLiveViewportProjection"
);
const buildingViewportFactoryBody = extractFunctionBody(
  "createCustom25DBuildingsLiveViewportProjection"
);
const roadViewportFactoryBody = extractFunctionBody(
  "createCustom25DRoadsLiveViewportProjection"
);
const treeViewportFactoryBody = extractFunctionBody(
  "createCustom25DTreesLiveViewportProjection"
);
const landmarkViewportFactoryBody = extractFunctionBody(
  "createCustom25DLandmarksLiveViewportProjection"
);

const strippedFrameSnapshotBody = stripComments(frameSnapshotBody);
const strippedDrawMapCanvasWithFrameSnapshotBody = stripComments(
  drawMapCanvasWithFrameSnapshotBody
);
const strippedDrawMapCanvasBody = stripComments(drawMapCanvasBody);
const strippedZoneViewportFactoryBody = stripComments(zoneViewportFactoryBody);
const strippedBuildingViewportFactoryBody = stripComments(
  buildingViewportFactoryBody
);
const strippedRoadViewportFactoryBody = stripComments(roadViewportFactoryBody);
const strippedTreeViewportFactoryBody = stripComments(treeViewportFactoryBody);
const strippedLandmarkViewportFactoryBody = stripComments(
  landmarkViewportFactoryBody
);

test("script.js remains a classic script and drawCustom25DMapCanvas creates one shared frame-root viewport snapshot", () => {
  assert.match(indexSource, /<script src="script\.js\?v=cards14"><\/script>/);
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs"><\/script>/
  );
  assert.doesNotMatch(strippedDrawMapCanvasBody, /import\(/);
  assert.match(
    strippedDrawMapCanvasBody,
    /frameViewportSnapshot = createCustom25DFrameViewportSnapshot\(\s*\{\s*map,\s*canvas\s*\}\s*\)/
  );
  assert.match(
    strippedDrawMapCanvasBody,
    /const bounds = frameViewportSnapshot;/
  );
  assert.match(
    strippedDrawMapCanvasBody,
    /const topLeft = frameViewportSnapshot\.canvasLayerPosition;/
  );
  assert.match(
    strippedDrawMapCanvasBody,
    /return drawCustom25DMapCanvasWithFrameSnapshotPrivateImplementation\(\s*\{\s*canvas,\s*frameViewportSnapshot\s*\}\s*\);/
  );
});

test("the frame-root snapshot owns exactly one size bounds north-west top-left zoom and pixel-ratio read", () => {
  assert.equal(
    countMatches(strippedFrameSnapshotBody, /map\.getSize\(\)/g),
    1
  );
  assert.equal(
    countMatches(strippedFrameSnapshotBody, /map\.getBounds\(\)/g),
    1
  );
  assert.equal(
    countMatches(strippedFrameSnapshotBody, /bounds\.getNorthWest\(\)/g),
    1
  );
  assert.equal(
    countMatches(
      strippedFrameSnapshotBody,
      /map\.latLngToLayerPoint\(northWestCoordinate\)/g
    ),
    1
  );
  assert.equal(
    countMatches(strippedFrameSnapshotBody, /map\.getZoom\(\)/g),
    1
  );
  assert.equal(
    countMatches(
      strippedFrameSnapshotBody,
      /normalizeCustom25DDevicePixelRatio\(\s*window\.devicePixelRatio\s*\)/g
    ),
    1
  );
});

test("snapshot-aware draw seam applies Canvas position logical size and backing size once from the shared snapshot", () => {
  assert.equal(
    countMatches(
      strippedDrawMapCanvasWithFrameSnapshotBody,
      /L\.DomUtil\.setPosition\(canvas, topLeft\);/g
    ),
    1
  );
  assert.equal(
    countMatches(
      strippedDrawMapCanvasWithFrameSnapshotBody,
      /canvas\.style\.width = `\$\{normalizedFrameViewportSnapshot\.logicalWidth\}px`;/g
    ),
    1
  );
  assert.equal(
    countMatches(
      strippedDrawMapCanvasWithFrameSnapshotBody,
      /canvas\.style\.height = `\$\{normalizedFrameViewportSnapshot\.logicalHeight\}px`;/g
    ),
    1
  );
  assert.equal(
    countMatches(
      strippedDrawMapCanvasWithFrameSnapshotBody,
      /canvas\.width = normalizedFrameViewportSnapshot\.backingWidth;/g
    ),
    1
  );
  assert.equal(
    countMatches(
      strippedDrawMapCanvasWithFrameSnapshotBody,
      /canvas\.height = normalizedFrameViewportSnapshot\.backingHeight;/g
    ),
    1
  );
});

test("zones buildings roads trees and landmarks all consume the shared snapshot and no active viewport adapter re-reads map size bounds north-west or zoom", () => {
  for (const block of [
    strippedZoneViewportFactoryBody,
    strippedBuildingViewportFactoryBody,
    strippedRoadViewportFactoryBody,
    strippedTreeViewportFactoryBody,
    strippedLandmarkViewportFactoryBody
  ]) {
    assert.doesNotMatch(block, /map\.getSize\(/);
    assert.doesNotMatch(block, /map\.getBounds\(/);
    assert.doesNotMatch(block, /bounds\.getNorthWest\(/);
  }

  for (const block of [
    strippedZoneViewportFactoryBody,
    strippedBuildingViewportFactoryBody,
    strippedRoadViewportFactoryBody,
    strippedTreeViewportFactoryBody
  ]) {
    assert.doesNotMatch(block, /map\.getZoom\(/);
    assert.match(
      block,
      /frameViewportSnapshot\?\.zoom/
    );
    assert.match(
      block,
      /frameViewportSnapshot\?\.contains\(\[latitude, longitude\]\) === true/
    );
  }

  assert.match(
    strippedLandmarkViewportFactoryBody,
    /frameViewportSnapshot\?\.contains\(\[latitude, longitude\]\) === true/
  );
});

test("one frame projection capability is reused and coordinate-space behavior stays correct for canvas-local layers and raw-layer landmarks", () => {
  for (const block of [
    strippedZoneViewportFactoryBody,
    strippedBuildingViewportFactoryBody,
    strippedRoadViewportFactoryBody,
    strippedTreeViewportFactoryBody
  ]) {
    assert.match(
      block,
      /const point = map\.latLngToLayerPoint\(\[latitude, longitude\]\);/
    );
    assert.match(
      block,
      /x: point\.x - frozenTopLeft\.x/
    );
    assert.match(
      block,
      /y: point\.y - frozenTopLeft\.y/
    );
  }

  assert.match(
    strippedLandmarkViewportFactoryBody,
    /const point = map\.latLngToLayerPoint\(\[latitude, longitude\]\);/
  );
  assert.match(
    strippedLandmarkViewportFactoryBody,
    /layerPoint: \{\s*x: point\.x,\s*y: point\.y\s*\}/s
  );
  assert.doesNotMatch(strippedLandmarkViewportFactoryBody, /frozenTopLeft/);
});

test("layer draw order initializer ownership listener behavior and safety flags remain unchanged", () => {
  assert.match(
    strippedDrawMapCanvasWithFrameSnapshotBody,
    /drawCustom25DBackground\(ctx, size, bounds\);[\s\S]*drawCustom25DZonesLiveCallsite\(ctx, bounds, topLeft\);[\s\S]*drawCustom25DBuildingsLiveCallsite\(ctx, bounds, topLeft\);[\s\S]*drawCustom25DRoadsLiveCallsite\(ctx, bounds, topLeft\);[\s\S]*drawCustom25DTreesLiveCallsite\(ctx, bounds, topLeft\);[\s\S]*renderCustomLandmarkLayerLiveCallsite\(ctx, bounds\);/s
  );

  assert.match(scriptSource, /let custom25DMapLayer = null;/);
  assert.match(initMapExperimentBody, /custom25DMapLayer = \{ canvas, redraw \};/);
  assert.match(initMapExperimentBody, /map\.on\("moveend zoomend", redraw\);/);
  assert.match(initMapExperimentBody, /redraw\(\);/);

  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_MAP = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA = false;/);

  for (const block of [
    strippedFrameSnapshotBody,
    strippedDrawMapCanvasBody,
    strippedZoneViewportFactoryBody,
    strippedBuildingViewportFactoryBody,
    strippedRoadViewportFactoryBody,
    strippedTreeViewportFactoryBody,
    strippedLandmarkViewportFactoryBody
  ]) {
    assert.doesNotMatch(block, /\.on\(/);
    assert.doesNotMatch(block, /setInterval|setTimeout|requestAnimationFrame/);
    assert.doesNotMatch(block, /window\.GrowGoDeveloperDiagnostics/);
    assert.doesNotMatch(block, /fetch\(|XMLHttpRequest|WebSocket/);
  }

  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createCustom25DFrameViewportSnapshot|normalizeCustom25DDevicePixelRatio/
  );
});
