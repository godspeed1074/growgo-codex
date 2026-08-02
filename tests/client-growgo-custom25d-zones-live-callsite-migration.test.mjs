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

const drawMapCanvasBody = extractFunctionBody("drawCustom25DMapCanvas");
const liveViewportFactoryBody = extractFunctionBody(
  "createCustom25DZonesLiveViewportProjection"
);
const migratedZonesBody = extractFunctionBody(
  "drawCustom25DZonesViewportInjected"
);
const liveCallsiteBody = extractFunctionBody("drawCustom25DZonesLiveCallsite");
const legacyZonesBody = extractFunctionBody("drawCustom25DZones");

test("script.js remains a classic script, dynamic import is not introduced, and the live draw callsite now routes through the migrated zones wrapper", () => {
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
    /drawCustom25DZones\(ctx, bounds, topLeft\);/
  );
});

test("the migrated zones logic has no direct global map reads while the frame-local viewport adapter performs the frozen live reads once per frame", () => {
  assert.doesNotMatch(migratedZonesBody, /map\.getZoom\(/);
  assert.doesNotMatch(migratedZonesBody, /map\.latLngToLayerPoint\(/);
  assert.doesNotMatch(migratedZonesBody, /bounds\.contains\(/);

  assert.match(liveViewportFactoryBody, /const frozenZoom = map\.getZoom\(\);/);
  assert.match(
    liveViewportFactoryBody,
    /const frozenTopLeft = topLeft \|\| map\.latLngToLayerPoint\(bounds\.getNorthWest\(\)\);/
  );
  assert.match(
    liveViewportFactoryBody,
    /const point = map\.latLngToLayerPoint\(\[latitude, longitude\]\);/
  );
  assert.match(
    liveViewportFactoryBody,
    /insideSnapshotBounds: bounds\.contains\(\[latitude, longitude\]\) === true/
  );
});

test("zone-data source, style values, zoom thresholds, priority order, draw order, and detail helper fanout remain source-compatible", () => {
  assert.match(liveCallsiteBody, /custom25DZoneFeatures/);

  assert.match(scriptSource, /if \(detailLevel === "low"\) return zoom >= 15;/);
  assert.match(scriptSource, /if \(detailLevel === "high"\) return zoom >= 18;/);
  assert.match(scriptSource, /return zoom >= 16\.5;/);

  assert.match(
    migratedZonesBody,
    /const zonePriority = \{\s*grass: 1,\s*sports: 2,\s*park: 3,\s*wetland: 4,\s*beach: 5,\s*water: 6\s*\};/s
  );
  assert.match(
    migratedZonesBody,
    /const style = getZoneStyleForFeature\(feature\.zoneType, zoom\);/
  );
  assert.match(
    migratedZonesBody,
    /drawCustom25DZone\(ctx, points, style, feature\.closed !== false\);/
  );
  assert.match(
    migratedZonesBody,
    /drawWaterTexture\(ctx, points, zoom, feature\.closed !== false\);/
  );
  assert.match(migratedZonesBody, /drawBeachDetails\(ctx, points, zoom\);/);
  assert.match(migratedZonesBody, /drawParkDetails\(ctx, points, zoom\);/);
  assert.match(
    migratedZonesBody,
    /drawGrassTexture\(ctx, points, zoom, style\);/
  );
  assert.match(
    migratedZonesBody,
    /drawSportsFieldDetails\(ctx, points, zoom\);/
  );
  assert.match(migratedZonesBody, /drawWetlandDetails\(ctx, points, zoom\);/);
});

test("the legacy direct-map zones function remains isolated, unchanged in source contract terms, and buildings roads trees landmarks plus renderer startup stay untouched", () => {
  assert.match(legacyZonesBody, /const zoom = map\.getZoom\(\);/);
  assert.match(
    legacyZonesBody,
    /const points = projectCustom25DZonePoints\(feature\.coords, topLeft\);/
  );

  assert.match(drawMapCanvasBody, /drawCustom25DBuildings\(ctx, bounds, topLeft\);/);
  assert.match(drawMapCanvasBody, /drawCustom25DRoads\(ctx, bounds, topLeft\);/);
  assert.match(drawMapCanvasBody, /drawCustom25DTrees\(ctx, size, bounds\);/);
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DLandmarkFoundation\(ctx, bounds, topLeft\);/
  );
  assert.match(scriptSource, /function initCustom25DMapExperiment\(\)/);
  assert.match(scriptSource, /map\.on\("moveend zoomend", redraw\);/);
});

test("the migration adds no listeners, timers, browser activation, or development-alpha coupling", () => {
  for (const block of [
    liveViewportFactoryBody,
    migratedZonesBody,
    liveCallsiteBody
  ]) {
    assert.doesNotMatch(block, /\.on\(/);
    assert.doesNotMatch(block, /setInterval|setTimeout|requestAnimationFrame/);
    assert.doesNotMatch(block, /window\.GrowGoDeveloperDiagnostics/);
    assert.doesNotMatch(block, /fetch\(|XMLHttpRequest|WebSocket/);
  }

  assert.doesNotMatch(
    developmentAlphaAppSource,
    /drawCustom25DZonesLiveCallsite|createCustom25DZonesLiveViewportProjection|drawCustom25DZonesViewportInjected/
  );
});
