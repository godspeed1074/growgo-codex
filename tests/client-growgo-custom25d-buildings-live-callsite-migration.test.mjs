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
  "createCustom25DBuildingsLiveViewportProjection"
);
const projectionHelperBody = extractFunctionBody(
  "projectCustom25DBuildingPointsWithViewport"
);
const migratedBuildingsBody = extractFunctionBody(
  "drawCustom25DBuildingsViewportInjected"
);
const liveCallsiteBody = extractFunctionBody(
  "drawCustom25DBuildingsLiveCallsite"
);
const legacyBuildingsBody = extractFunctionBody("drawCustom25DBuildings");

function instantiateBuildingsMigrationRuntime() {
  const sandbox = {
    Number,
    Array,
    Object,
    Math,
    String,
    custom25DBuildingFeatures: [],
    styleCalls: [],
    shopCalls: [],
    shopDrawCalls: [],
    genericDrawCalls: [],
    shouldDrawBuildingAtZoom(zoom) {
      return zoom >= 16.2;
    },
    getBuildingStyleForFeature(feature, zoom) {
      sandbox.styleCalls.push({ id: feature.id, zoom });
      return { styleId: feature.id, zoom };
    },
    getShopRecipeForFeature(feature, zoom) {
      sandbox.shopCalls.push({ id: feature.id, zoom });
      return feature.shopTag ? { recipe: { key: feature.shopTag } } : null;
    },
    drawShop25D(ctx, points, style, zoom, shopRecipe) {
      sandbox.shopDrawCalls.push({
        id: style.styleId,
        zoom,
        pointCount: points.length,
        shopRecipeKey: shopRecipe.recipe.key
      });
    },
    drawGeneric25DBuilding(ctx, points, style, zoom) {
      sandbox.genericDrawCalls.push({
        id: style.styleId,
        zoom,
        pointCount: points.length
      });
    }
  };

  vm.createContext(sandbox);
  const source = `
    ${projectionHelperBody}
    ${migratedBuildingsBody}
    ${liveCallsiteBody}
  `;
  vm.runInContext(source, sandbox);
  return sandbox;
}

test("script.js remains a classic script, dynamic import is not introduced, and the live draw callsite now routes through the migrated buildings wrapper", () => {
  assert.match(indexSource, /<script src="script\.js\?v=cards14"><\/script>/);
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs"><\/script>/
  );
  assert.doesNotMatch(drawMapCanvasBody, /import\(/);
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DBuildingsLiveCallsite\(ctx, bounds, topLeft\);/
  );
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DBuildings\(ctx, bounds, topLeft\);/
  );
});

test("the migrated buildings logic has no direct global map reads while the frame-local viewport adapter performs the frozen live reads once per frame", () => {
  assert.doesNotMatch(migratedBuildingsBody, /map\.getZoom\(/);
  assert.doesNotMatch(migratedBuildingsBody, /map\.latLngToLayerPoint\(/);
  assert.doesNotMatch(migratedBuildingsBody, /bounds\.contains\(/);

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

test("building-data source, source order, zoom thresholds, caps, shop fanout, and projection order remain source-compatible", () => {
  assert.match(liveCallsiteBody, /custom25DBuildingFeatures/);
  assert.match(migratedBuildingsBody, /if \(!shouldDrawBuildingAtZoom\(zoom\)\)/);
  assert.match(
    migratedBuildingsBody,
    /const maxBuildings = zoom >= 18 \? 120 : zoom >= 17 \? 80 : 45;/
  );
  assert.match(
    migratedBuildingsBody,
    /const style = getBuildingStyleForFeature\(feature, zoom\);/
  );
  assert.match(
    migratedBuildingsBody,
    /const shopRecipe = getShopRecipeForFeature\(feature, zoom\);/
  );
  assert.match(
    migratedBuildingsBody,
    /drawShop25D\(ctx, projection\.points, style, zoom, shopRecipe\);/
  );
  assert.match(
    migratedBuildingsBody,
    /drawGeneric25DBuilding\(ctx, projection\.points, style, zoom\);/
  );
  assert.match(
    projectionHelperBody,
    /for \(const coordinate of coords\)/
  );
});

test("representative fake data preserves projection counts, source-order behavior, cap behavior, and shop-versus-generic fanout", () => {
  const runtime = instantiateBuildingsMigrationRuntime();
  const viewportCalls = [];
  const viewportProjection = {
    getZoom() {
      return 17.4;
    },
    projectCoordinateToCanvasPoint({ latitude, longitude }) {
      viewportCalls.push({ latitude, longitude });
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
  };

  const result = runtime.drawCustom25DBuildingsViewportInjected(
    {},
    [
      {
        id: "shop-1",
        coords: [
          [-38.12, 144.61],
          [-38.121, 144.612],
          [-38.123, 144.608]
        ],
        shopTag: "bakery"
      },
      {
        id: "house-1",
        coords: [
          [-38.119, 144.611],
          [-38.118, 144.613],
          [-38.117, 144.609]
        ],
        shopTag: ""
      },
      {
        id: "offscreen-1",
        coords: [
          [-38.2, 144.7],
          [-38.201, 144.702],
          [-38.203, 144.698]
        ],
        shopTag: ""
      }
    ],
    viewportProjection
  );

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "BUILDINGS_DRAWN_WITH_VIEWPORT");
  assert.equal(result.zoom, 17.4);
  assert.equal(result.drawn, 2);
  assert.equal(result.projectionCount, 9);
  assert.deepEqual(runtime.styleCalls, [
    { id: "shop-1", zoom: 17.4 },
    { id: "house-1", zoom: 17.4 }
  ]);
  assert.deepEqual(runtime.shopCalls, [
    { id: "shop-1", zoom: 17.4 },
    { id: "house-1", zoom: 17.4 }
  ]);
  assert.deepEqual(runtime.shopDrawCalls, [
    { id: "shop-1", zoom: 17.4, pointCount: 3, shopRecipeKey: "bakery" }
  ]);
  assert.deepEqual(runtime.genericDrawCalls, [
    { id: "house-1", zoom: 17.4, pointCount: 3 }
  ]);
  assert.deepEqual(viewportCalls[0], {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.deepEqual(viewportCalls[3], {
    latitude: -38.119,
    longitude: 144.611
  });
});

test("invalid viewport projection fails only the buildings layer closed and does not fall back to direct global-map access", () => {
  const runtime = instantiateBuildingsMigrationRuntime();
  const result = runtime.drawCustom25DBuildingsViewportInjected(
    {},
    [
      {
        id: "bad-1",
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
  assert.equal(result.reasonCode, "BUILDING_PROJECTION_FAILED");
  assert.deepEqual(runtime.styleCalls, []);
  assert.deepEqual(runtime.shopCalls, []);
  assert.deepEqual(runtime.shopDrawCalls, []);
  assert.deepEqual(runtime.genericDrawCalls, []);
});

test("the legacy direct-map buildings function remains isolated, roads trees landmarks and renderer startup stay untouched, and no new coupling is added", () => {
  assert.match(legacyBuildingsBody, /map\.getZoom\(\)/);
  assert.match(
    legacyBuildingsBody,
    /const points = projectCustom25DBuildingPoints\(feature\.coords, topLeft\);/
  );
  assert.match(
    legacyBuildingsBody,
    /const shopRecipe = getShopRecipeForFeature\(feature\);/
  );

  assert.match(drawMapCanvasBody, /drawCustom25DZonesLiveCallsite\(ctx, bounds, topLeft\);/);
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
    projectionHelperBody,
    migratedBuildingsBody,
    liveCallsiteBody
  ]) {
    assert.doesNotMatch(block, /\.on\(/);
    assert.doesNotMatch(block, /setInterval|setTimeout|requestAnimationFrame/);
    assert.doesNotMatch(block, /window\.GrowGoDeveloperDiagnostics/);
    assert.doesNotMatch(block, /fetch\(|XMLHttpRequest|WebSocket/);
  }

  assert.doesNotMatch(
    developmentAlphaAppSource,
    /drawCustom25DBuildingsLiveCallsite|createCustom25DBuildingsLiveViewportProjection|drawCustom25DBuildingsViewportInjected/
  );
});
