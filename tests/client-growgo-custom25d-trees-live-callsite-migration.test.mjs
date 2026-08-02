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
  "createCustom25DTreesLiveViewportProjection"
);
const projectionHelperBody = extractFunctionBody(
  "projectCustom25DTreePointsWithViewport"
);
const migratedTreesBody = extractFunctionBody(
  "drawCustom25DTreesViewportInjected"
);
const liveCallsiteBody = extractFunctionBody("drawCustom25DTreesLiveCallsite");
const legacyTreesBody = extractFunctionBody("drawCustom25DTrees");
const drawTreeClusterBody = extractFunctionBody("drawTreeCluster");
const hashFeatureSeedBody = extractFunctionBody("hashFeatureSeed");
const getProjectedBoundsBody = extractFunctionBody("getProjectedBounds");
const clipToProjectedPolygonBody = extractFunctionBody("clipToProjectedPolygon");

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
    closePath() {
      operations.push(["closePath"]);
    },
    clip() {
      operations.push(["clip"]);
    },
    arc(x, y, radius, startAngle, endAngle) {
      operations.push(["arc", x, y, radius, startAngle, endAngle]);
    },
    fill() {
      operations.push(["fill"]);
    }
  };

  let fillStyle = null;
  Object.defineProperty(context, "fillStyle", {
    enumerable: true,
    configurable: true,
    get() {
      return fillStyle;
    },
    set(value) {
      fillStyle = value;
      operations.push(["set", "fillStyle", value]);
    }
  });

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

function instantiateTreesMigrationRuntime() {
  const sandbox = {
    Number,
    Array,
    Object,
    Math,
    String,
    shouldDrawZoneDetailsAtZoom(zoom, detailLevel = "medium") {
      if (detailLevel === "low") return zoom >= 15;
      if (detailLevel === "high") return zoom >= 18;
      return zoom >= 16.5;
    }
  };

  vm.createContext(sandbox);
  const source = `
    ${hashFeatureSeedBody}
    ${getProjectedBoundsBody}
    ${clipToProjectedPolygonBody}
    ${drawTreeClusterBody}
    ${projectionHelperBody}
    ${migratedTreesBody}
    ${liveCallsiteBody}
  `;
  vm.runInContext(source, sandbox);
  return sandbox;
}

function countOperations(operations, opName) {
  return operations.filter((entry) => entry[0] === opName).length;
}

test("script.js remains a classic script, dynamic import is not introduced, and the live draw callsite now routes through the migrated trees wrapper", () => {
  assert.match(indexSource, /<script src="script\.js\?v=cards14"><\/script>/);
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs"><\/script>/
  );
  assert.doesNotMatch(drawMapCanvasBody, /import\(/);
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DTreesLiveCallsite\(ctx, bounds, topLeft\);/
  );
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DTrees\(ctx, size, bounds\);/
  );
});

test("the migrated trees logic has no direct global map reads and performs no north-west re-lookup while the frame-local viewport adapter performs the frozen reads once per frame", () => {
  assert.doesNotMatch(migratedTreesBody, /map\.getZoom\(/);
  assert.doesNotMatch(migratedTreesBody, /map\.latLngToLayerPoint\(/);
  assert.doesNotMatch(migratedTreesBody, /bounds\.contains\(/);
  assert.doesNotMatch(migratedTreesBody, /getNorthWest\(/);
  assert.doesNotMatch(migratedTreesBody, /projectCustom25DZonePoints\(/);

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

test("tree-data source, park filtering, zoom behavior, cluster counts, scale formulas, deterministic seed behavior, clipping, colors, and fill-only order remain source-compatible", () => {
  assert.match(liveCallsiteBody, /custom25DZoneFeatures/);
  assert.match(migratedTreesBody, /if \(feature\?\.zoneType !== "park"\) continue;/);
  assert.match(migratedTreesBody, /if \(!Array\.isArray\(feature\?\.coords\) \|\| feature\.coords\.length < 3\) continue;/);
  assert.match(migratedTreesBody, /if \(!shouldDrawZoneDetailsAtZoom\(zoom, "medium"\)\)/);
  assert.match(migratedTreesBody, /const clusterCount = zoom >= 18 \? 5 : 3;/);
  assert.match(
    migratedTreesBody,
    /const scale =\s*zoom >= 18 \? 0\.9 \+ \(\(i % 3\) \* 0\.08\) : 0\.72 \+ \(\(i % 2\) \* 0\.05\);/s
  );
  assert.match(migratedTreesBody, /const seed = hashFeatureSeed\(feature\.id\);/);
  assert.match(migratedTreesBody, /ctx\.save\(\);/);
  assert.match(migratedTreesBody, /clipToProjectedPolygon\(ctx, projection\.points\);/);
  assert.match(migratedTreesBody, /drawTreeCluster\(ctx, x, y, scale\);/);
  assert.match(drawTreeClusterBody, /rgba\(64, 149, 77, 0\.52\)/);
  assert.match(drawTreeClusterBody, /rgba\(50, 133, 63, 0\.58\)/);
  assert.match(drawTreeClusterBody, /rgba\(228, 247, 206, 0\.14\)/);
});

test("representative fake data preserves projection counts, park-only eligibility, cluster counts, fill order, and balanced save/restore behavior", () => {
  const runtime = instantiateTreesMigrationRuntime();
  const context = createFakeContext();
  const viewport = createViewportProjection({ zoom: 17.4 });

  const result = runtime.drawCustom25DTreesViewportInjected(
    context,
    [
      {
        id: "park-a",
        zoneType: "park",
        coords: [
          [-38.12, 144.61],
          [-38.121, 144.612],
          [-38.123, 144.608]
        ]
      },
      {
        id: "park-b",
        zoneType: "park",
        coords: [
          [-38.119, 144.611],
          [-38.118, 144.613],
          [-38.117, 144.609]
        ]
      },
      {
        id: "beach-skip",
        zoneType: "beach",
        coords: [
          [-38.119, 144.611],
          [-38.118, 144.613],
          [-38.117, 144.609]
        ]
      },
      {
        id: "park-offscreen",
        zoneType: "park",
        coords: [
          [-38.2, 144.7],
          [-38.201, 144.702],
          [-38.203, 144.698]
        ]
      }
    ],
    viewport.viewportProjection
  );

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "TREES_DRAWN_WITH_VIEWPORT");
  assert.equal(result.zoom, 17.4);
  assert.equal(result.drawn, 2);
  assert.equal(result.projectionCount, 9);
  assert.equal(viewport.calls.getZoom, 1);
  assert.deepEqual(viewport.calls.project[0], {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.deepEqual(viewport.calls.project[3], {
    latitude: -38.119,
    longitude: 144.611
  });
  assert.equal(countOperations(context.operations, "save"), 2);
  assert.equal(countOperations(context.operations, "restore"), 2);
  assert.equal(countOperations(context.operations, "clip"), 2);
  assert.equal(countOperations(context.operations, "arc"), 24);
  assert.equal(countOperations(context.operations, "fill"), 24);
  assert.equal(context.saveDepth, 0);
  assert.deepEqual(
    context.operations.filter(
      (entry) =>
        entry[0] === "set" &&
        entry[1] === "fillStyle" &&
        typeof entry[2] === "string"
    ).slice(0, 4),
    [
      ["set", "fillStyle", "rgba(64, 149, 77, 0.52)"],
      ["set", "fillStyle", "rgba(50, 133, 63, 0.58)"],
      ["set", "fillStyle", "rgba(64, 149, 77, 0.52)"],
      ["set", "fillStyle", "rgba(228, 247, 206, 0.14)"]
    ]
  );
});

test("invalid viewport projection fails only the trees layer closed and does not fall back to direct global-map access", () => {
  const runtime = instantiateTreesMigrationRuntime();
  const result = runtime.drawCustom25DTreesViewportInjected(
    createFakeContext(),
    [
      {
        id: "park-a",
        zoneType: "park",
        coords: [
          [-38.12, 144.61],
          [-38.121, 144.612],
          [-38.123, 144.608]
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
  assert.equal(result.reasonCode, "TREE_PROJECTION_FAILED");
  assert.equal(result.projectionCount, 0);
});

test("the legacy direct-map trees function remains isolated, zones buildings and roads migrations stay active, and landmarks plus renderer startup stay untouched", () => {
  assert.match(legacyTreesBody, /const zoom = map\.getZoom\(\);/);
  assert.match(
    legacyTreesBody,
    /projectCustom25DZonePoints\(feature\.coords, map\.latLngToLayerPoint\(bounds\.getNorthWest\(\)\)\)/
  );
  assert.match(drawMapCanvasBody, /drawCustom25DZonesLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(drawMapCanvasBody, /drawCustom25DBuildingsLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(drawMapCanvasBody, /drawCustom25DRoadsLiveCallsite\(ctx, bounds, topLeft\);/);
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
    migratedTreesBody,
    liveCallsiteBody
  ]) {
    assert.doesNotMatch(block, /\.on\(/);
    assert.doesNotMatch(block, /setInterval|setTimeout|requestAnimationFrame/);
    assert.doesNotMatch(block, /window\.GrowGoDeveloperDiagnostics/);
    assert.doesNotMatch(block, /fetch\(|XMLHttpRequest|WebSocket/);
  }

  assert.doesNotMatch(
    developmentAlphaAppSource,
    /drawCustom25DTreesLiveCallsite|createCustom25DTreesLiveViewportProjection|drawCustom25DTreesViewportInjected/
  );
});
