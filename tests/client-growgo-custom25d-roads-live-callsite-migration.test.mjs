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
  "createCustom25DRoadsLiveViewportProjection"
);
const projectionHelperBody = extractFunctionBody(
  "projectCustom25DRoadPointsWithViewport"
);
const migratedRoadsBody = extractFunctionBody(
  "drawCustom25DRoadsViewportInjected"
);
const liveCallsiteBody = extractFunctionBody("drawCustom25DRoadsLiveCallsite");
const legacyRoadsBody = extractFunctionBody("drawCustom25DRoads");
const roadStyleBody = extractFunctionBody("getRoadStyleForFeature");
const drawRoadBody = extractFunctionBody("drawCustom25DRoad");
const drawRoadShadowBody = extractFunctionBody("drawRoadShadow");
const drawRoadPathBody = extractFunctionBody("drawCustom25DRoadPath");

function createFakeContext() {
  const operations = [];
  let saveDepth = 0;

  const context = {
    operations,
    get saveDepth() {
      return saveDepth;
    },
    save() {
      saveDepth += 1;
      operations.push(["save"]);
    },
    restore() {
      saveDepth -= 1;
      operations.push(["restore"]);
    },
    beginPath() {
      operations.push(["beginPath"]);
    },
    moveTo(x, y) {
      operations.push(["moveTo", x, y]);
    },
    lineTo(x, y) {
      operations.push(["lineTo", x, y]);
    },
    stroke() {
      operations.push(["stroke"]);
    },
    setLineDash(value) {
      operations.push(["setLineDash", Array.isArray(value) ? [...value] : value]);
    }
  };

  for (const propertyName of [
    "strokeStyle",
    "lineWidth",
    "lineCap",
    "lineJoin",
    "shadowColor",
    "shadowBlur",
    "shadowOffsetY"
  ]) {
    let currentValue = null;
    Object.defineProperty(context, propertyName, {
      enumerable: true,
      configurable: true,
      get() {
        return currentValue;
      },
      set(value) {
        currentValue = value;
        operations.push(["set", propertyName, value]);
      }
    });
  }

  return context;
}

function createViewportProjection({
  zoom = 17.4,
  throwOnProject = false,
  projectImplementation
} = {}) {
  const calls = {
    getZoom: 0,
    project: []
  };

  return {
    calls,
    viewportProjection: {
      getZoom() {
        calls.getZoom += 1;
        return zoom;
      },
      projectCoordinateToCanvasPoint({ latitude, longitude }) {
        calls.project.push({ latitude, longitude });
        if (throwOnProject) {
          throw new Error("projection failed");
        }

        if (projectImplementation) {
          return projectImplementation({ latitude, longitude });
        }

        const inside =
          latitude >= -38.14 &&
          latitude <= -38.1 &&
          longitude >= 144.58 &&
          longitude <= 144.64;

        return {
          canvasPoint: {
            x: Number((longitude * 10).toFixed(3)),
            y: Number((latitude * -10).toFixed(3))
          },
          insideSnapshotBounds: inside
        };
      }
    }
  };
}

function instantiateRoadsMigrationRuntime() {
  const sandbox = {
    Number,
    Array,
    Object,
    Math,
    String
  };

  vm.createContext(sandbox);
  const source = `
    ${roadStyleBody}
    ${drawRoadPathBody}
    ${drawRoadShadowBody}
    ${drawRoadBody}
    ${projectionHelperBody}
    ${migratedRoadsBody}
    ${liveCallsiteBody}
  `;
  vm.runInContext(source, sandbox);
  return sandbox;
}

function findOperationIndex(operations, matcher) {
  return operations.findIndex(matcher);
}

function countOperations(operations, opName) {
  return operations.filter((entry) => entry[0] === opName).length;
}

test("script.js remains a classic script, dynamic import is not introduced, and the live draw callsite now routes through the migrated roads wrapper", () => {
  assert.match(indexSource, /<script src="script\.js\?v=cards14"><\/script>/);
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs"><\/script>/
  );
  assert.doesNotMatch(drawMapCanvasBody, /import\(/);
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DRoadsLiveCallsite\(ctx, bounds, topLeft\);/
  );
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DRoads\(ctx, bounds, topLeft\);/
  );
});

test("the migrated roads logic has no direct global map reads while the frame-local viewport adapter performs the frozen live reads once per frame", () => {
  assert.doesNotMatch(migratedRoadsBody, /map\.getZoom\(/);
  assert.doesNotMatch(migratedRoadsBody, /map\.latLngToLayerPoint\(/);
  assert.doesNotMatch(migratedRoadsBody, /bounds\.contains\(/);
  assert.doesNotMatch(migratedRoadsBody, /projectCustom25DRoadPoints\(/);

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

test("road-data source, source order, supported buckets, geometry contract, zoomBoost formula, widths, and five-pass draw contract remain source-compatible", () => {
  assert.match(liveCallsiteBody, /custom25DRoadFeatures/);
  assert.match(
    roadStyleBody,
    /const zoomBoost = Math\.max\(0, zoom - 15\) \* 0\.55;/
  );
  assert.match(
    roadStyleBody,
    /if \(normalized === "primary" \|\| normalized === "primary_link"\) return styles\.primary;/
  );
  assert.match(
    roadStyleBody,
    /normalized === "secondary" \|\| normalized === "secondary_link" \|\| normalized === "tertiary" \|\| normalized === "tertiary_link"/
  );
  assert.match(
    roadStyleBody,
    /if \(normalized === "service" \|\| normalized === "road"\) return styles\.service;/
  );
  assert.match(
    roadStyleBody,
    /\["track", "path", "footway", "cycleway", "pedestrian"\]\.includes\(normalized\)/
  );
  assert.match(projectionHelperBody, /for \(const coordinate of coords\)/);
  assert.match(migratedRoadsBody, /const style = getRoadStyleForFeature\(road\.highway, zoom\);/);
  assert.match(migratedRoadsBody, /drawCustom25DRoad\(ctx, projection\.points, style\);/);
  assert.match(drawRoadBody, /drawRoadShadow\(ctx, points, style\);/);
  assert.match(drawRoadBody, /ctx\.strokeStyle = style\.edge;/);
  assert.match(drawRoadBody, /ctx\.strokeStyle = style\.fill;/);
  assert.match(drawRoadBody, /ctx\.strokeStyle = style\.warmCore;/);
  assert.match(drawRoadBody, /ctx\.strokeStyle = style\.highlight;/);
  assert.match(drawRoadBody, /ctx\.lineCap = "round";/);
  assert.match(drawRoadBody, /ctx\.lineJoin = "round";/);
});

test("representative fake data preserves projection counts, source-order behavior, widths, and five-pass road draw behavior", () => {
  const runtime = instantiateRoadsMigrationRuntime();
  const context = createFakeContext();
  const viewport = createViewportProjection({ zoom: 17.4 });

  const result = runtime.drawCustom25DRoadsViewportInjected(
    context,
    [
      {
        highway: "primary",
        coords: [
          [-38.12, 144.61],
          [-38.121, 144.612],
          [-38.123, 144.608]
        ]
      },
      {
        highway: "path",
        coords: [
          [-38.119, 144.611],
          [-38.118, 144.613]
        ]
      },
      {
        highway: "service",
        coords: [
          [-38.2, 144.7],
          [-38.201, 144.702]
        ]
      }
    ],
    viewport.viewportProjection
  );

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "ROADS_DRAWN_WITH_VIEWPORT");
  assert.equal(result.zoom, 17.4);
  assert.equal(result.drawn, 2);
  assert.equal(result.eligibleRoadCount, 2);
  assert.equal(result.skippedRoadCount, 1);
  assert.equal(result.projectionCount, 7);
  assert.equal(viewport.calls.getZoom, 1);
  assert.deepEqual(viewport.calls.project[0], {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.deepEqual(viewport.calls.project[3], {
    latitude: -38.119,
    longitude: 144.611
  });
  assert.equal(countOperations(context.operations, "setLineDash"), 10);
  assert.equal(countOperations(context.operations, "save"), 4);
  assert.equal(countOperations(context.operations, "restore"), 4);
  assert.equal(context.saveDepth, 0);

  const primaryShadowWidthIndex = findOperationIndex(
    context.operations,
    (entry) =>
      entry[0] === "set" &&
      entry[1] === "lineWidth" &&
      entry[2] === 15.269999999999998
  );
  const primaryFillWidthIndex = findOperationIndex(
    context.operations,
    (entry) =>
      entry[0] === "set" &&
      entry[1] === "lineWidth" &&
      entry[2] === 13.419999999999998
  );

  assert.ok(primaryShadowWidthIndex >= 0);
  assert.ok(primaryFillWidthIndex > primaryShadowWidthIndex);
  assert.ok(
    context.operations.some(
      (entry) => entry[0] === "set" && entry[1] === "lineCap" && entry[2] === "round"
    )
  );
  assert.ok(
    context.operations.some(
      (entry) => entry[0] === "set" && entry[1] === "lineJoin" && entry[2] === "round"
    )
  );
});

test("invalid viewport projection fails only the roads layer closed and does not fall back to direct global-map access", () => {
  const runtime = instantiateRoadsMigrationRuntime();
  const result = runtime.drawCustom25DRoadsViewportInjected(
    createFakeContext(),
    [
      {
        highway: "primary",
        coords: [
          [-38.12, 144.61],
          [-38.121, 144.612]
        ]
      }
    ],
    {
      getZoom() {
        return 17.4;
      },
      projectCoordinateToCanvasPoint() {
        throw new Error("projection failed");
      }
    }
  );

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "ROAD_PROJECTION_FAILED");
  assert.equal(result.projectionCount, 0);
  assert.doesNotMatch(migratedRoadsBody, /map\.getZoom|map\.latLngToLayerPoint/);
});

test("the legacy direct-map roads function remains isolated, zones and buildings migrations stay active, and trees landmarks plus renderer startup stay untouched", () => {
  assert.match(legacyRoadsBody, /const zoom = map\.getZoom\(\);/);
  assert.match(
    legacyRoadsBody,
    /const points = projectCustom25DRoadPoints\(road\.coords, topLeft\);/
  );
  assert.match(drawMapCanvasBody, /drawCustom25DZonesLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(drawMapCanvasBody, /drawCustom25DBuildingsLiveCallsite\(ctx, bounds, topLeft\);/);
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
    projectionHelperBody,
    migratedRoadsBody,
    liveCallsiteBody
  ]) {
    assert.doesNotMatch(block, /\.on\(/);
    assert.doesNotMatch(block, /setInterval|setTimeout|requestAnimationFrame/);
    assert.doesNotMatch(block, /window\.GrowGoDeveloperDiagnostics/);
    assert.doesNotMatch(block, /fetch\(|XMLHttpRequest|WebSocket/);
  }

  assert.doesNotMatch(
    developmentAlphaAppSource,
    /drawCustom25DRoadsLiveCallsite|createCustom25DRoadsLiveViewportProjection|drawCustom25DRoadsViewportInjected/
  );
});
