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

  const bodyStart = scriptSource.indexOf("{", start);
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

const initMapExperimentBody = extractFunctionBody("initCustom25DMapExperiment");
const drawMapCanvasBody = extractFunctionBody("drawCustom25DMapCanvas");

const zoneViewportFactoryBody = extractFunctionBody(
  "createCustom25DZonesLiveViewportProjection"
);
const zoneInjectedBody = extractFunctionBody("drawCustom25DZonesViewportInjected");
const zoneLiveCallsiteBody = extractFunctionBody("drawCustom25DZonesLiveCallsite");

const buildingViewportFactoryBody = extractFunctionBody(
  "createCustom25DBuildingsLiveViewportProjection"
);
const buildingInjectedBody = extractFunctionBody(
  "drawCustom25DBuildingsViewportInjected"
);
const buildingLiveCallsiteBody = extractFunctionBody(
  "drawCustom25DBuildingsLiveCallsite"
);

const roadViewportFactoryBody = extractFunctionBody(
  "createCustom25DRoadsLiveViewportProjection"
);
const roadInjectedBody = extractFunctionBody("drawCustom25DRoadsViewportInjected");
const roadLiveCallsiteBody = extractFunctionBody("drawCustom25DRoadsLiveCallsite");

const treeViewportFactoryBody = extractFunctionBody(
  "createCustom25DTreesLiveViewportProjection"
);
const treeInjectedBody = extractFunctionBody("drawCustom25DTreesViewportInjected");
const treeLiveCallsiteBody = extractFunctionBody("drawCustom25DTreesLiveCallsite");

const landmarkViewportFactoryBody = extractFunctionBody(
  "createCustom25DLandmarksLiveViewportProjection"
);
const landmarkInjectedBody = extractFunctionBody(
  "drawCustom25DLandmarksViewportInjected"
);
const landmarkLiveCallsiteBody = extractFunctionBody(
  "renderCustomLandmarkLayerLiveCallsite"
);

const activeFactories = [
  zoneViewportFactoryBody,
  buildingViewportFactoryBody,
  roadViewportFactoryBody,
  treeViewportFactoryBody,
  landmarkViewportFactoryBody
];

const activeInjectedBodies = [
  zoneInjectedBody,
  buildingInjectedBody,
  roadInjectedBody,
  treeInjectedBody,
  landmarkInjectedBody
];

const activeLiveCallsiteBodies = [
  zoneLiveCallsiteBody,
  buildingLiveCallsiteBody,
  roadLiveCallsiteBody,
  treeLiveCallsiteBody,
  landmarkLiveCallsiteBody
];

test("script.js remains a classic script and the active draw path routes all five custom 2.5D layers through viewport-injected live callsites", () => {
  assert.match(indexSource, /<script src="script\.js\?v=cards14"><\/script>/);
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs"><\/script>/
  );
  assert.doesNotMatch(drawMapCanvasBody, /import\(/);

  assert.match(
    drawMapCanvasBody,
    /drawCustom25DZonesLiveCallsite\(ctx, bounds, topLeft\);/
  );
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DBuildingsLiveCallsite\(ctx, bounds, topLeft\);/
  );
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DRoadsLiveCallsite\(ctx, bounds, topLeft\);/
  );
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DTreesLiveCallsite\(ctx, bounds, topLeft\);/
  );
  assert.match(
    drawMapCanvasBody,
    /renderCustomLandmarkLayerLiveCallsite\(ctx, bounds\);/
  );
});

test("migrated active helpers contain no direct map.getZoom or map.latLngToLayerPoint reads and the tree plus landmark paths do not re-read north-west or top-left in injected logic", () => {
  for (const block of [...activeInjectedBodies, ...activeLiveCallsiteBodies]) {
    assert.doesNotMatch(block, /map\.getZoom\(/);
    assert.doesNotMatch(block, /map\.latLngToLayerPoint\(/);
  }

  assert.doesNotMatch(zoneInjectedBody, /getNorthWest\(/);
  assert.doesNotMatch(buildingInjectedBody, /getNorthWest\(/);
  assert.doesNotMatch(roadInjectedBody, /getNorthWest\(/);
  assert.doesNotMatch(treeInjectedBody, /getNorthWest\(/);
  assert.doesNotMatch(treeInjectedBody, /topLeft/);
  assert.doesNotMatch(landmarkInjectedBody, /getNorthWest\(/);
  assert.doesNotMatch(landmarkInjectedBody, /topLeft/);
});

test("frame-root draw still owns Canvas sizing positioning bounds capture and top-left acquisition", () => {
  assert.match(drawMapCanvasBody, /const size = map\.getSize\(\);/);
  assert.match(drawMapCanvasBody, /const bounds = map\.getBounds\(\);/);
  assert.match(
    drawMapCanvasBody,
    /const topLeft = map\.latLngToLayerPoint\(bounds\.getNorthWest\(\)\);/
  );
  assert.match(drawMapCanvasBody, /L\.DomUtil\.setPosition\(canvas, topLeft\);/);
  assert.match(drawMapCanvasBody, /canvas\.width = Math\.max\(1, Math\.round\(size\.x \* scale\)\);/);
  assert.match(drawMapCanvasBody, /canvas\.height = Math\.max\(1, Math\.round\(size\.y \* scale\)\);/);
  assert.match(drawMapCanvasBody, /canvas\.style\.width = `\$\{size\.x\}px`;/);
  assert.match(drawMapCanvasBody, /canvas\.style\.height = `\$\{size\.y\}px`;/);
});

test("active viewport factories still own per-layer frozen zoom reads and layer-point projection from the live map", () => {
  for (const block of [
    zoneViewportFactoryBody,
    buildingViewportFactoryBody,
    roadViewportFactoryBody,
    treeViewportFactoryBody
  ]) {
    assert.match(block, /const frozenZoom = map\.getZoom\(\);/);
    assert.match(block, /const point = map\.latLngToLayerPoint\(\[latitude, longitude\]\);/);
  }

  assert.doesNotMatch(landmarkViewportFactoryBody, /const frozenZoom = map\.getZoom\(\);/);
  assert.match(
    landmarkViewportFactoryBody,
    /const point = map\.latLngToLayerPoint\(\[latitude, longitude\]\);/
  );
});

test("active callsites pass frame-root top-left into zones buildings roads and trees so north-west fallback remains unused during the live draw path", () => {
  assert.match(
    zoneLiveCallsiteBody,
    /createCustom25DZonesLiveViewportProjection\(bounds, topLeft\)/
  );
  assert.match(
    buildingLiveCallsiteBody,
    /createCustom25DBuildingsLiveViewportProjection\(\s*bounds,\s*topLeft\s*\)/
  );
  assert.match(
    roadLiveCallsiteBody,
    /createCustom25DRoadsLiveViewportProjection\(\s*bounds,\s*topLeft\s*\)/
  );
  assert.match(
    treeLiveCallsiteBody,
    /createCustom25DTreesLiveViewportProjection\(\s*bounds,\s*topLeft\s*\)/
  );

  for (const block of [
    zoneViewportFactoryBody,
    buildingViewportFactoryBody,
    roadViewportFactoryBody,
    treeViewportFactoryBody
  ]) {
    assert.match(
      block,
      /const frozenTopLeft = topLeft \|\| map\.latLngToLayerPoint\(bounds\.getNorthWest\(\)\);/
    );
  }
});

test("initializer custom25DMapLayer ownership and moveend/zoomend listener behavior remain unchanged and no new startup coupling or browser commands are introduced", () => {
  assert.match(scriptSource, /let custom25DMapLayer = null;/);
  assert.match(initMapExperimentBody, /if \(!ENABLE_CUSTOM_25D_MAP \|\| !map \|\| custom25DMapLayer\) return;/);
  assert.match(initMapExperimentBody, /map\.createPane\("custom25DMapPane"\);/);
  assert.match(initMapExperimentBody, /const pane = map\.getPane\("custom25DMapPane"\);/);
  assert.match(initMapExperimentBody, /custom25DMapLayer = \{ canvas, redraw \};/);
  assert.match(initMapExperimentBody, /map\.on\("moveend zoomend", redraw\);/);
  assert.match(initMapExperimentBody, /redraw\(\);/);

  for (const block of [
    drawMapCanvasBody,
    ...activeFactories,
    ...activeInjectedBodies,
    ...activeLiveCallsiteBodies
  ]) {
    assert.doesNotMatch(block, /\.on\(/);
    assert.doesNotMatch(block, /setInterval|setTimeout|requestAnimationFrame/);
    assert.doesNotMatch(block, /window\.GrowGoDeveloperDiagnostics/);
    assert.doesNotMatch(block, /fetch\(|XMLHttpRequest|WebSocket/);
    assert.doesNotMatch(block, /\bopen\(|location\.href|postMessage|navigator\./);
  }

  assert.doesNotMatch(
    developmentAlphaAppSource,
    /drawCustom25DMapCanvas|drawCustom25DZonesLiveCallsite|drawCustom25DBuildingsLiveCallsite|drawCustom25DRoadsLiveCallsite|drawCustom25DTreesLiveCallsite|renderCustomLandmarkLayerLiveCallsite/
  );
});

test("all four canonical safety flags remain false in source", () => {
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_MAP = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_LANDMARK_TEST_MARKERS = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_LANDMARK_SAMPLE_DATA = false;/);
  assert.match(scriptSource, /const ENABLE_CUSTOM_25D_DINOSAUR_SITES_AU_DATA = false;/);
});
