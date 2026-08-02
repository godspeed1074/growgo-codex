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
  path.join(repoRoot, "client", "growgo-custom25d-roads-viewport-draw-helper.mjs")
);

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
      projectCoordinateToCanvasPoint(coordinate) {
        calls.project.push(coordinate);
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
          canvasPoint: Object.freeze({
            x: Number((coordinate.longitude * 10).toFixed(3)),
            y: Number((coordinate.latitude * -10).toFixed(3))
          }),
          insideSnapshotBounds: inside
        });
      }
    }
  };
}

function createRoad(overrides = {}) {
  return {
    highway: overrides.highway ?? "residential",
    coords:
      overrides.coords ??
      [
        [-38.12, 144.61],
        [-38.121, 144.612]
      ]
  };
}

function createStyleConfig(overrides = {}) {
  return moduleUnderTest.createGrowGoCustom25DRoadsStyleConfig(overrides);
}

function findOperationIndex(operations, matcher) {
  return operations.findIndex(matcher);
}

function countOperations(operations, opName) {
  return operations.filter((entry) => entry[0] === opName).length;
}

test("module import has no side effects, helper exists, style config exists, and source lock preserves the current live global dependencies", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DRoadsStyleConfig,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DRoadsViewportDrawHelperSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DRoadsViewportDrawHelperSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
  );
  assert.equal(inspection.roadDataSource, "custom25DRoadFeatures");
  assert.equal(
    inspection.geometryFormat,
    "linestring coords -> [latitude, longitude] tuples"
  );
  assert.match(inspection.directGlobalReads[1], /map\.getZoom/);
  assert.match(inspection.directGlobalReads[4], /map\.latLngToLayerPoint/);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /growgo-custom25d-roads-viewport-draw-helper/
  );
});

test("valid fake viewport, representative roads, and explicit style config produce an immutable successful draw summary with preserved draw order and widths", () => {
  const viewport = createViewportProjection({ zoom: 17.4 });
  const helper = moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });
  const context = createFakeContext();
  const roads = [
    createRoad({
      highway: "primary",
      coords: [
        [-38.12, 144.61],
        [-38.121, 144.612],
        [-38.123, 144.608]
      ]
    }),
    createRoad({
      highway: "path",
      coords: [
        [-38.119, 144.611],
        [-38.118, 144.613]
      ]
    }),
    createRoad({
      highway: "service",
      coords: [
        [-38.2, 144.7],
        [-38.201, 144.702]
      ]
    })
  ];

  const result = helper.drawRoads({ context, roads });

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "ROADS_DRAW_READY");
  assert.equal(result.viewportValidated, true);
  assert.equal(result.contextValidated, true);
  assert.equal(result.styleConfigValidated, true);
  assert.equal(result.geometryValidated, true);
  assert.equal(result.zoom, 17.4);
  assert.equal(result.roadInputCount, 3);
  assert.equal(result.eligibleRoadCount, 2);
  assert.equal(result.skippedRoadCount, 1);
  assert.equal(result.malformedRoadCount, 0);
  assert.equal(result.projectionRequestCount, 7);
  assert.equal(result.projectionSuccessCount, 7);
  assert.equal(result.projectionFailureCount, 0);
  assert.equal(result.drawAttemptCount, 2);
  assert.equal(result.completedRoadDrawCount, 2);
  assert.equal(result.contextSaveCount, 4);
  assert.equal(result.contextRestoreCount, 4);
  assert.equal(viewport.calls.getZoom, 1);
  assert.equal(viewport.calls.project.length, 7);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.canonicalSafetyFlagSnapshot), true);
  assert.equal(context.saveDepth, 0);

  assert.deepEqual(viewport.calls.project[0], {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.deepEqual(viewport.calls.project[3], {
    latitude: -38.119,
    longitude: 144.611
  });

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
  assert.equal(countOperations(context.operations, "setLineDash"), 10);
});

test("repeated calls retain no road state and return independent immutable summaries", () => {
  const viewport = createViewportProjection({ zoom: 16.5 });
  const helper = moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });

  const firstResult = helper.drawRoads({
    context: createFakeContext(),
    roads: [createRoad()]
  });
  const secondResult = helper.drawRoads({
    context: createFakeContext(),
    roads: [createRoad()]
  });

  assert.notEqual(firstResult, secondResult);
  assert.equal(firstResult.completedRoadDrawCount, 1);
  assert.equal(secondResult.completedRoadDrawCount, 1);
  assert.equal(Object.isFrozen(firstResult), true);
  assert.equal(Object.isFrozen(secondResult), true);
});

test("missing viewport, missing getZoom, missing projection capability, invalid zoom, missing context, missing roads, malformed collection, malformed geometry, invalid coordinates, projection failure, and invalid style all fail closed", () => {
  const validContext = createFakeContext();
  const validRoads = [createRoad()];

  const invalidViewportHelper =
    moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
      styleConfig: createStyleConfig()
    });
  assert.equal(
    invalidViewportHelper.drawRoads({
      context: validContext,
      roads: validRoads
    }).reasonCode,
    "VIEWPORT_PROJECTION_MISSING"
  );

  const missingGetZoomHelper =
    moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
      viewportProjection: {
        projectCoordinateToCanvasPoint() {
          return {
            canvasPoint: { x: 1, y: 1 },
            insideSnapshotBounds: true
          };
        }
      },
      styleConfig: createStyleConfig()
    });
  assert.equal(
    missingGetZoomHelper.drawRoads({
      context: validContext,
      roads: validRoads
    }).reasonCode,
    "VIEWPORT_GET_ZOOM_MISSING"
  );

  const missingProjectorHelper =
    moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
      viewportProjection: {
        getZoom() {
          return 17;
        }
      },
      styleConfig: createStyleConfig()
    });
  assert.equal(
    missingProjectorHelper.drawRoads({
      context: validContext,
      roads: validRoads
    }).reasonCode,
    "VIEWPORT_PROJECT_COORDINATE_TO_CANVAS_POINT_MISSING"
  );

  const invalidZoomViewport = createViewportProjection({ zoom: Number.NaN });
  const invalidZoomHelper =
    moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
      viewportProjection: invalidZoomViewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  assert.equal(
    invalidZoomHelper.drawRoads({
      context: validContext,
      roads: validRoads
    }).reasonCode,
    "INVALID_FROZEN_ZOOM"
  );

  const helper = moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });
  assert.equal(helper.drawRoads({ roads: validRoads }).reasonCode, "DRAW_CONTEXT_MISSING");
  assert.equal(helper.drawRoads({ context: validContext }).reasonCode, "ROADS_INPUT_MISSING");
  assert.equal(
    helper.drawRoads({
      context: validContext,
      roads: {}
    }).reasonCode,
    "ROADS_INPUT_INVALID"
  );
  assert.equal(
    helper.drawRoads({
      context: validContext,
      roads: [null]
    }).reasonCode,
    "ROAD_OBJECT_INVALID"
  );
  assert.equal(
    helper.drawRoads({
      context: validContext,
      roads: [
        createRoad({
          coords: [[[-38.12, 144.61]], [[-38.121, 144.612]]]
        })
      ]
    }).reasonCode,
    "ROAD_GEOMETRY_INVALID"
  );
  assert.equal(
    helper.drawRoads({
      context: validContext,
      roads: [
        createRoad({
          coords: [[-38.12, "bad"], [-38.121, 144.612]]
        })
      ]
    }).reasonCode,
    "ROAD_COORDINATE_INVALID"
  );

  const projectionFailureHelper =
    moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
      viewportProjection: createViewportProjection({ throwOnProject: true })
        .viewportProjection,
      styleConfig: createStyleConfig()
    });
  const projectionFailureResult = projectionFailureHelper.drawRoads({
    context: validContext,
    roads: validRoads
  });
  assert.equal(projectionFailureResult.reasonCode, "PROJECTION_FAILURE");
  assert.equal(projectionFailureResult.projectionRequestCount, 1);
  assert.equal(projectionFailureResult.projectionFailureCount, 1);

  const invalidStyleHelper =
    moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
      viewportProjection: createViewportProjection().viewportProjection,
      styleConfig: { roadStyles: {} }
    });
  assert.equal(
    invalidStyleHelper.drawRoads({
      context: validContext,
      roads: validRoads
    }).reasonCode,
    "STYLE_CONFIG_INVALID"
  );
});

test("unsupported zoom range can be configured and blocks cleanly without projection", () => {
  const viewport = createViewportProjection({ zoom: 14 });
  const helper = moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig({
      supportedZoomRange: {
        minimum: 15,
        maximum: 22
      }
    })
  });

  const result = helper.drawRoads({
    context: createFakeContext(),
    roads: [createRoad()]
  });

  assert.equal(result.reasonCode, "UNSUPPORTED_CURRENT_ZOOM");
  assert.equal(result.projectionRequestCount, 0);
});

test("disposing the helper releases the seam and blocks future draws", () => {
  const helper = moduleUnderTest.createGrowGoCustom25DRoadsViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });

  const disposeStatus = helper.dispose();
  assert.equal(disposeStatus.helperStatus, "disposed");
  assert.equal(disposeStatus.reasonCode, "HELPER_DISPOSED");
  assert.equal(disposeStatus.disposed, true);

  const result = helper.drawRoads({
    context: createFakeContext(),
    roads: [createRoad()]
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "HELPER_DISPOSED");
});
