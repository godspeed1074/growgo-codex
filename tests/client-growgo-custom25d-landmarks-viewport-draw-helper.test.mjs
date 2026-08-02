import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-landmarks-viewport-draw-helper.mjs"
  )
);

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
  projectImplementation,
  throwOnProject = false
} = {}) {
  const calls = {
    layerProject: []
  };

  return {
    calls,
    viewportProjection: {
      projectCoordinateToLayerPoint(coordinate) {
        calls.layerProject.push(coordinate);
        if (throwOnProject) {
          throw Object.assign(new Error("projection failed"), {
            reasonCode: "PROJECTION_FAILURE"
          });
        }

        if (projectImplementation) {
          return projectImplementation(coordinate);
        }

        const inside =
          coordinate.latitude >= -38.14 &&
          coordinate.latitude <= -38.1 &&
          coordinate.longitude >= 144.58 &&
          coordinate.longitude <= 144.64;

        return Object.freeze({
          layerPoint: Object.freeze({
            x: Number((coordinate.longitude * 10).toFixed(3)),
            y: Number((coordinate.latitude * -10).toFixed(3))
          }),
          insideSnapshotBounds: inside
        });
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

function countOperations(operations, opName) {
  return operations.filter((entry) => entry[0] === opName).length;
}

function createStyleConfig(overrides = {}) {
  return moduleUnderTest.createGrowGoCustom25DLandmarksStyleConfig(overrides);
}

test("module import has no side effects, helper factory exists, style config exists, and source lock preserves the live landmark direct-map dependency while keeping other migrated callsites unchanged", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DLandmarksStyleConfig,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DLandmarksViewportDrawHelperSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DLandmarksViewportDrawHelperSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
  );
  assert.equal(
    inspection.landmarkDataSource,
    "getActiveCustom25DLandmarkData() + getCustom25DLandmarkTestMarkers(bounds)"
  );
  assert.equal(inspection.coordinateSpace.classification, "raw_layer_point");
  assert.equal(inspection.coordinateSpace.topLeftDependency, "none in current landmark path");
  assert.match(
    inspection.directGlobalReads[2],
    /map\.latLngToLayerPoint/
  );
  assert.ok(scriptSource.includes("drawCustom25DZonesLiveCallsite(ctx, bounds, topLeft);"));
  assert.ok(
    scriptSource.includes("drawCustom25DBuildingsLiveCallsite(ctx, bounds, topLeft);")
  );
  assert.ok(scriptSource.includes("drawCustom25DRoadsLiveCallsite(ctx, bounds, topLeft);"));
  assert.ok(scriptSource.includes("drawCustom25DTreesLiveCallsite(ctx, bounds, topLeft);"));
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /growgo-custom25d-landmarks-viewport-draw-helper/
  );
});

test("valid fake viewport, representative landmarks, and explicit style config produce an immutable successful draw summary using raw layer-point projection only", () => {
  const viewport = createViewportProjection();
  const helper = moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });
  const context = createFakeContext();
  const landmarks = [
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
  ];

  const result = helper.drawLandmarks({ context, landmarks });

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "LANDMARKS_DRAW_READY");
  assert.equal(result.viewportValidated, true);
  assert.equal(result.zoom, null);
  assert.equal(result.landmarkInputCount, 3);
  assert.equal(result.eligibleLandmarkCount, 2);
  assert.equal(result.skippedLandmarkCount, 1);
  assert.equal(result.malformedLandmarkCount, 0);
  assert.equal(result.layerProjectionRequestCount, 3);
  assert.equal(result.layerProjectionSuccessCount, 3);
  assert.equal(result.canvasProjectionRequestCount, 0);
  assert.equal(result.canvasProjectionSuccessCount, 0);
  assert.equal(result.projectionFailureCount, 0);
  assert.equal(result.drawAttemptCount, 2);
  assert.equal(result.completedLandmarkDrawCount, 2);
  assert.equal(result.contextValidated, true);
  assert.equal(result.styleConfigValidated, true);
  assert.equal(result.geometryValidated, true);
  assert.equal(result.coordinateSpaceUsed, "layerPoint");
  assert.equal(result.frozenTopLeftUsed, false);
  assert.equal(result.contextSaveCount, 4);
  assert.equal(result.contextRestoreCount, 4);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.canonicalSafetyFlagSnapshot), true);
  assert.equal(context.saveDepth, 0);

  assert.deepEqual(viewport.calls.layerProject[0], {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.deepEqual(viewport.calls.layerProject[1], {
    latitude: -38.119,
    longitude: 144.611
  });
  assert.equal(countOperations(context.operations, "createRadialGradient"), 2);
  assert.equal(countOperations(context.operations, "gradient.addColorStop"), 4);
  assert.equal(countOperations(context.operations, "arc"), 11);
  assert.equal(
    context.operations.some(
      (entry) =>
        entry[0] === "set" &&
        entry[1] === "fillStyle" &&
        entry[2] === "rgba(243, 222, 164, 0.1)"
    ),
    true
  );
  assert.equal(
    context.operations.some(
      (entry) =>
        entry[0] === "set" &&
        entry[1] === "fillStyle" &&
        entry[2] === "rgba(255,255,255,0.96)"
    ),
    true
  );
});

test("unknown categories preserve current generic-fallback behavior and drawing order", () => {
  const helper = moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });
  const context = createFakeContext();

  const result = helper.drawLandmarks({
    context,
    landmarks: [
      createLandmark({
        category: "made-up-category"
      })
    ]
  });

  assert.equal(result.outcome, "success");
  assert.equal(result.completedLandmarkDrawCount, 1);

  const fillStyles = context.operations.filter(
    (entry) => entry[0] === "set" && entry[1] === "fillStyle"
  );
  assert.deepEqual(fillStyles.slice(0, 3), [
    ["set", "fillStyle", "rgba(255, 232, 170, 0.12)"],
    ["set", "fillStyle", "rgba(201, 160, 74, 0.92)"],
    ["set", "fillStyle", "rgba(255,255,255,0.96)"]
  ]);
  assert.equal(fillStyles[3][0], "set");
  assert.equal(fillStyles[3][1], "fillStyle");
  assert.equal(typeof fillStyles[3][2], "object");
});

test("repeated calls retain no landmark state and return independent immutable summaries", () => {
  const helper = moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });

  const firstResult = helper.drawLandmarks({
    context: createFakeContext(),
    landmarks: [createLandmark()]
  });
  const secondResult = helper.drawLandmarks({
    context: createFakeContext(),
    landmarks: [createLandmark()]
  });

  assert.notEqual(firstResult, secondResult);
  assert.equal(firstResult.completedLandmarkDrawCount, 1);
  assert.equal(secondResult.completedLandmarkDrawCount, 1);
  assert.equal(Object.isFrozen(firstResult), true);
  assert.equal(Object.isFrozen(secondResult), true);
});

test("missing viewport, missing layer projection capability, missing context, missing landmarks, malformed collection, invalid landmark, invalid coordinates, projection failure, and invalid style all fail closed", () => {
  const validContext = createFakeContext();
  const validLandmarks = [createLandmark()];

  const invalidViewportHelper =
    moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
      styleConfig: createStyleConfig()
    });
  assert.equal(
    invalidViewportHelper.drawLandmarks({
      context: validContext,
      landmarks: validLandmarks
    }).reasonCode,
    "VIEWPORT_PROJECTION_MISSING"
  );

  const missingProjectorHelper =
    moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
      viewportProjection: {},
      styleConfig: createStyleConfig()
    });
  assert.equal(
    missingProjectorHelper.drawLandmarks({
      context: validContext,
      landmarks: validLandmarks
    }).reasonCode,
    "VIEWPORT_PROJECT_COORDINATE_TO_LAYER_POINT_MISSING"
  );

  const helper = moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });
  assert.equal(
    helper.drawLandmarks({ landmarks: validLandmarks }).reasonCode,
    "DRAW_CONTEXT_MISSING"
  );
  assert.equal(
    helper.drawLandmarks({ context: validContext }).reasonCode,
    "LANDMARKS_INPUT_MISSING"
  );
  assert.equal(
    helper.drawLandmarks({
      context: validContext,
      landmarks: {}
    }).reasonCode,
    "LANDMARKS_INPUT_INVALID"
  );
  assert.equal(
    helper.drawLandmarks({
      context: validContext,
      landmarks: [null]
    }).reasonCode,
    "LANDMARK_OBJECT_INVALID"
  );
  assert.equal(
    helper.drawLandmarks({
      context: validContext,
      landmarks: [
        createLandmark({
          lat: "bad"
        })
      ]
    }).reasonCode,
    "LANDMARK_COORDINATE_INVALID"
  );

  const projectionFailureHelper =
    moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
      viewportProjection: createViewportProjection({ throwOnProject: true })
        .viewportProjection,
      styleConfig: createStyleConfig()
    });
  const projectionFailureResult = projectionFailureHelper.drawLandmarks({
    context: validContext,
    landmarks: validLandmarks
  });
  assert.equal(projectionFailureResult.reasonCode, "PROJECTION_FAILURE");
  assert.equal(projectionFailureResult.layerProjectionRequestCount, 1);
  assert.equal(projectionFailureResult.projectionFailureCount, 1);

  const invalidStyleHelper =
    moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
      viewportProjection: createViewportProjection().viewportProjection,
      styleConfig: { recipes: {} }
    });
  assert.equal(
    invalidStyleHelper.drawLandmarks({
      context: validContext,
      landmarks: validLandmarks
    }).reasonCode,
    "STYLE_CONFIG_INVALID"
  );
});

test("missing required context capabilities block before projection", () => {
  const helper = moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });

  const badContext = {
    save() {},
    restore() {},
    beginPath() {},
    arc() {},
    fill() {},
    stroke() {},
    moveTo() {},
    lineTo() {},
    rect() {}
  };

  const result = helper.drawLandmarks({
    context: badContext,
    landmarks: [createLandmark()]
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "DRAW_CONTEXT_QUADRATICCURVETO_MISSING");
  assert.equal(result.layerProjectionRequestCount, 0);
});

test("disposing the helper releases the seam and blocks future draws", () => {
  const helper = moduleUnderTest.createGrowGoCustom25DLandmarksViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });

  const disposeStatus = helper.dispose();
  assert.equal(disposeStatus.helperStatus, "disposed");
  assert.equal(disposeStatus.reasonCode, "HELPER_DISPOSED");
  assert.equal(disposeStatus.disposed, true);

  const result = helper.drawLandmarks({
    context: createFakeContext(),
    landmarks: [createLandmark()]
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "HELPER_DISPOSED");
});
