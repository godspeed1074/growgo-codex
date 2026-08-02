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
  "createCustom25DLandmarksLiveViewportProjection"
);
const migratedLandmarksBody = extractFunctionBody(
  "drawCustom25DLandmarksViewportInjected"
);
const liveCallsiteBody = extractFunctionBody(
  "renderCustomLandmarkLayerLiveCallsite"
);
const legacyLandmarkLayerBody = extractFunctionBody("renderCustomLandmarkLayer");
const landmarkFoundationBody = extractFunctionBody("drawCustom25DLandmarkFoundation");
const drawLandmarkPreviewGlyphBody = extractFunctionBody("drawLandmarkPreviewGlyph");
const drawSpecialPoiFoundationBody = extractFunctionBody("drawSpecialPoiFoundation");

function createFakeGradient(operations, descriptor) {
  return {
    addColorStop(offset, color) {
      operations.push([
        "gradient.addColorStop",
        descriptor,
        Number(offset),
        String(color)
      ]);
    }
  };
}

function createFakeContext() {
  const operations = [];
  let saveDepth = 0;
  let gradientCount = 0;

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
    arc(x, y, radius, startAngle, endAngle) {
      operations.push(["arc", x, y, radius, startAngle, endAngle]);
    },
    fill() {
      operations.push(["fill"]);
    },
    stroke() {
      operations.push(["stroke"]);
    },
    moveTo(x, y) {
      operations.push(["moveTo", x, y]);
    },
    lineTo(x, y) {
      operations.push(["lineTo", x, y]);
    },
    rect(x, y, width, height) {
      operations.push(["rect", x, y, width, height]);
    },
    quadraticCurveTo(cpx, cpy, x, y) {
      operations.push(["quadraticCurveTo", cpx, cpy, x, y]);
    },
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      gradientCount += 1;
      const descriptor = `gradient-${gradientCount}`;
      operations.push(["createRadialGradient", descriptor, x0, y0, r0, x1, y1, r1]);
      return createFakeGradient(operations, descriptor);
    }
  };

  for (const propertyName of [
    "strokeStyle",
    "fillStyle",
    "lineCap",
    "lineJoin",
    "lineWidth",
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
  throwOnProject = false,
  projectImplementation
} = {}) {
  const calls = {
    project: []
  };

  return {
    calls,
    viewportProjection: {
      projectCoordinateToLayerPoint({ latitude, longitude }) {
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
          layerPoint: {
            x: Number((longitude * 10).toFixed(3)),
            y: Number((latitude * -10).toFixed(3))
          },
          insideSnapshotBounds: inside
        };
      }
    }
  };
}

function createLandmark(overrides = {}) {
  return {
    id: overrides.id ?? "landmark-1",
    lat: overrides.lat ?? -38.12,
    lng: overrides.lng ?? 144.61,
    rendererCategory: overrides.rendererCategory,
    category: overrides.category ?? "generic"
  };
}

function createRecipeMap() {
  return {
    generic: {
      ring: "rgba(201, 160, 74, 0.92)",
      ringShadow: "rgba(108, 82, 38, 0.18)",
      innerTop: "rgba(252, 247, 231, 0.94)",
      innerBottom: "rgba(232, 221, 188, 0.9)",
      glyph: "rgba(134, 98, 38, 0.88)",
      glow: "rgba(255, 232, 170, 0.12)"
    },
    historic: {
      ring: "rgba(204, 163, 82, 0.92)",
      ringShadow: "rgba(109, 84, 41, 0.18)",
      innerTop: "rgba(252, 247, 232, 0.94)",
      innerBottom: "rgba(233, 223, 191, 0.9)",
      glyph: "rgba(127, 95, 56, 0.88)",
      glow: "rgba(243, 222, 164, 0.1)"
    },
    music: {
      ring: "rgba(205, 164, 78, 0.92)",
      ringShadow: "rgba(108, 82, 38, 0.18)",
      innerTop: "rgba(252, 246, 232, 0.94)",
      innerBottom: "rgba(231, 220, 189, 0.9)",
      glyph: "rgba(124, 86, 49, 0.88)",
      glow: "rgba(245, 223, 164, 0.1)"
    }
  };
}

function instantiateLandmarkMigrationRuntime() {
  const recipeMap = createRecipeMap();
  const sandbox = {
    Number,
    Array,
    Object,
    Math,
    String,
    getLandmarkVisualRecipe(category = "generic") {
      return recipeMap[category] || recipeMap.generic;
    },
    getActiveCustom25DLandmarkData() {
      return [
        {
          id: "active-historic",
          lat: -38.12,
          lng: 144.61,
          category: "historic"
        }
      ];
    },
    getCustom25DLandmarkTestMarkers(bounds) {
      return [
        {
          id: "test-generic",
          lat: bounds.center.lat,
          lng: bounds.center.lng,
          category: "generic"
        }
      ];
    }
  };

  vm.createContext(sandbox);
  const source = `
    ${drawLandmarkPreviewGlyphBody}
    ${drawSpecialPoiFoundationBody}
    ${liveViewportFactoryBody}
    ${migratedLandmarksBody}
    ${liveCallsiteBody}
  `;
  vm.runInContext(source, sandbox);
  return sandbox;
}

function countOperations(operations, opName) {
  return operations.filter((entry) => entry[0] === opName).length;
}

test("script.js remains a classic script, dynamic import is not introduced, and the live draw callsite now routes through the migrated landmark wrapper", () => {
  assert.match(indexSource, /<script src="script\.js\?v=cards14"><\/script>/);
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs"><\/script>/
  );
  assert.doesNotMatch(drawMapCanvasBody, /import\(/);
  assert.match(
    drawMapCanvasBody,
    /renderCustomLandmarkLayerLiveCallsite\(ctx, bounds\);/
  );
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DLandmarkFoundation\(ctx, bounds, topLeft\);/
  );
});

test("the migrated landmark logic has no direct global map reads while the frame-local viewport adapter performs raw layer-point projection and visibility checks", () => {
  assert.doesNotMatch(migratedLandmarksBody, /map\.latLngToLayerPoint\(/);
  assert.doesNotMatch(migratedLandmarksBody, /map\.getZoom\(/);
  assert.doesNotMatch(migratedLandmarksBody, /bounds\.contains\(/);
  assert.doesNotMatch(migratedLandmarksBody, /topLeft/);

  assert.match(
    liveViewportFactoryBody,
    /const point = map\.latLngToLayerPoint\(\[latitude, longitude\]\);/
  );
  assert.match(
    liveViewportFactoryBody,
    /insideSnapshotBounds: bounds\.contains\(\[latitude, longitude\]\) === true/
  );
  assert.doesNotMatch(liveViewportFactoryBody, /getNorthWest\(/);
  assert.doesNotMatch(liveViewportFactoryBody, /getZoom\(/);
});

test("landmark data sources, category fallback, raw layer-point behavior, draw order, and size constants remain source-compatible", () => {
  assert.match(liveCallsiteBody, /getActiveCustom25DLandmarkData\(\)/);
  assert.match(liveCallsiteBody, /getCustom25DLandmarkTestMarkers\(bounds\)/);
  assert.match(migratedLandmarksBody, /const rendererCategory = marker\.rendererCategory \|\| marker\.category \|\| "generic";/);
  assert.match(migratedLandmarksBody, /insideSnapshotBounds !== true/);
  assert.match(drawSpecialPoiFoundationBody, /const outerRadius = 13;/);
  assert.match(drawSpecialPoiFoundationBody, /const innerRadius = 9\.2;/);
  assert.match(drawSpecialPoiFoundationBody, /const glowRadius = 16\.5;/);
  assert.match(
    drawSpecialPoiFoundationBody,
    /drawLandmarkPreviewGlyph\(ctx, point\.x, point\.y, innerRadius \* 1\.5, category, recipe\.glyph\);/
  );
  assert.match(drawLandmarkPreviewGlyphBody, /category === "dinosaur"/);
  assert.match(drawLandmarkPreviewGlyphBody, /category === "film"/);
  assert.match(drawLandmarkPreviewGlyphBody, /category === "music"/);
  assert.match(drawLandmarkPreviewGlyphBody, /category === "waterfall"/);
  assert.match(drawLandmarkPreviewGlyphBody, /category === "beach"/);
  assert.match(drawLandmarkPreviewGlyphBody, /category === "historic"/);
});

test("representative fake data preserves projection counts, raw layer-point usage, generic fallback, draw order, and balanced save/restore behavior", () => {
  const runtime = instantiateLandmarkMigrationRuntime();
  const context = createFakeContext();
  const viewport = createViewportProjection();

  const result = runtime.drawCustom25DLandmarksViewportInjected(
    context,
    [
      createLandmark({
        id: "historic-a",
        lat: -38.12,
        lng: 144.61,
        category: "historic"
      }),
      createLandmark({
        id: "generic-b",
        lat: -38.119,
        lng: 144.611
      }),
      createLandmark({
        id: "outside-c",
        lat: -38.2,
        lng: 144.7,
        rendererCategory: "music"
      })
    ],
    viewport.viewportProjection
  );

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "LANDMARKS_DRAWN_WITH_VIEWPORT");
  assert.equal(result.drawn, 2);
  assert.equal(result.eligibleLandmarkCount, 2);
  assert.equal(result.skippedLandmarkCount, 1);
  assert.equal(result.projectionCount, 3);
  assert.deepEqual(viewport.calls.project[0], {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.deepEqual(viewport.calls.project[1], {
    latitude: -38.119,
    longitude: 144.611
  });
  assert.equal(countOperations(context.operations, "save"), 4);
  assert.equal(countOperations(context.operations, "restore"), 4);
  assert.equal(countOperations(context.operations, "createRadialGradient"), 2);
  assert.equal(countOperations(context.operations, "gradient.addColorStop"), 4);
  assert.equal(context.saveDepth, 0);
  const firstFillStyles = context.operations
    .filter((entry) => entry[0] === "set" && entry[1] === "fillStyle")
    .slice(0, 4);
  assert.deepEqual(firstFillStyles.slice(0, 3), [
    ["set", "fillStyle", "rgba(243, 222, 164, 0.1)"],
    ["set", "fillStyle", "rgba(204, 163, 82, 0.92)"],
    ["set", "fillStyle", "rgba(255,255,255,0.96)"]
  ]);
  assert.equal(firstFillStyles[3][0], "set");
  assert.equal(firstFillStyles[3][1], "fillStyle");
  assert.equal(typeof firstFillStyles[3][2]?.addColorStop, "function");
});

test("invalid viewport projection fails only the landmark layer closed and does not fall back to direct global-map access", () => {
  const runtime = instantiateLandmarkMigrationRuntime();
  const result = runtime.drawCustom25DLandmarksViewportInjected(
    createFakeContext(),
    [createLandmark()],
    {
      projectCoordinateToLayerPoint() {
        throw new Error("projection failed");
      }
    }
  );

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "LANDMARK_PROJECTION_FAILED");
  assert.equal(result.projectionCount, 0);
});

test("the legacy direct-map landmark function remains isolated, zones buildings roads and trees migrations stay active, and renderer startup stays untouched", () => {
  assert.match(
    legacyLandmarkLayerBody,
    /const point = map\.latLngToLayerPoint\(\[marker\.lat, marker\.lng\]\);/
  );
  assert.match(
    legacyLandmarkLayerBody,
    /if \(!bounds\.contains\(\[marker\.lat, marker\.lng\]\)\) return;/
  );
  assert.match(landmarkFoundationBody, /renderCustomLandmarkLayer\(ctx, bounds\);/);
  assert.match(drawMapCanvasBody, /renderCustomLandmarkLayerLiveCallsite\(ctx, bounds\);/);
  assert.match(
    drawMapCanvasBody,
    /drawCustom25DLandmarkFoundation\(ctx, bounds, topLeft\);/
  );
  assert.match(drawMapCanvasBody, /drawCustom25DZonesLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(drawMapCanvasBody, /drawCustom25DBuildingsLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(drawMapCanvasBody, /drawCustom25DRoadsLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(drawMapCanvasBody, /drawCustom25DTreesLiveCallsite\(ctx, bounds, topLeft\);/);
  assert.match(scriptSource, /function initCustom25DMapExperiment\(\)/);
  assert.match(scriptSource, /map\.on\("moveend zoomend", redraw\);/);
});

test("the migration adds no listeners, timers, browser activation, or development-alpha coupling", () => {
  for (const block of [
    liveViewportFactoryBody,
    migratedLandmarksBody,
    liveCallsiteBody
  ]) {
    assert.doesNotMatch(block, /\.on\(/);
    assert.doesNotMatch(block, /setInterval|setTimeout|requestAnimationFrame/);
    assert.doesNotMatch(block, /window\.GrowGoDeveloperDiagnostics/);
    assert.doesNotMatch(block, /fetch\(|XMLHttpRequest|WebSocket/);
  }

  assert.doesNotMatch(
    developmentAlphaAppSource,
    /renderCustomLandmarkLayerLiveCallsite|createCustom25DLandmarksLiveViewportProjection|drawCustom25DLandmarksViewportInjected/
  );
});
