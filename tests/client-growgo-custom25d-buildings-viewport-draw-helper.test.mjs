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
    "growgo-custom25d-buildings-viewport-draw-helper.mjs"
  )
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
    closePath() {
      operations.push(["closePath"]);
    },
    fill() {
      operations.push(["fill"]);
    },
    stroke() {
      operations.push(["stroke"]);
    },
    fillRect(x, y, width, height) {
      operations.push(["fillRect", x, y, width, height]);
    },
    strokeRect(x, y, width, height) {
      operations.push(["strokeRect", x, y, width, height]);
    },
    quadraticCurveTo(cpx, cpy, x, y) {
      operations.push(["quadraticCurveTo", cpx, cpy, x, y]);
    },
    roundRect(x, y, width, height, radius) {
      operations.push(["roundRect", x, y, width, height, radius]);
    },
    arc(x, y, radius, startAngle, endAngle) {
      operations.push(["arc", x, y, radius, startAngle, endAngle]);
    },
    ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle) {
      operations.push([
        "ellipse",
        x,
        y,
        radiusX,
        radiusY,
        rotation,
        startAngle,
        endAngle
      ]);
    },
    rect(x, y, width, height) {
      operations.push(["rect", x, y, width, height]);
    }
  };

  for (const propertyName of [
    "fillStyle",
    "strokeStyle",
    "lineWidth",
    "lineCap",
    "lineJoin",
    "shadowColor",
    "shadowBlur",
    "shadowOffsetX",
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
  zoom = 18.6,
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

function createBuilding(overrides = {}) {
  return {
    id: overrides.id ?? "building-default",
    coords:
      overrides.coords ??
      [
        [-38.12, 144.61],
        [-38.121, 144.612],
        [-38.123, 144.608]
      ],
    center: overrides.center ?? {
      lat: -38.121,
      lng: 144.61
    },
    buildingType: overrides.buildingType ?? "residential",
    zoneType: overrides.zoneType ?? "town",
    shopTag: overrides.shopTag ?? "",
    amenity: overrides.amenity ?? "",
    office: overrides.office ?? "",
    buildingArea: overrides.buildingArea ?? 220,
    nearCoast: Object.prototype.hasOwnProperty.call(overrides, "nearCoast")
      ? overrides.nearCoast
      : false
  };
}

function createStyleConfig(overrides = {}) {
  return moduleUnderTest.createGrowGoCustom25DBuildingsStyleConfig(overrides);
}

function findFirstOperation(operations, opName) {
  return operations.find((entry) => entry[0] === opName);
}

function countOperations(operations, opName) {
  return operations.filter((entry) => entry[0] === opName).length;
}

test("module import has no side effects, helper exists, style config exists, and source lock preserves the current live global dependencies", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DBuildingsStyleConfig,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DBuildingsViewportDrawHelperSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DBuildingsViewportDrawHelperSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
  );
  assert.equal(inspection.buildingDataSource, "custom25DBuildingFeatures");
  assert.equal(
    inspection.geometryFormat,
    "polygon coords -> [latitude, longitude] tuples"
  );
  assert.match(inspection.directGlobalReads[1], /map\.getZoom/);
  assert.match(inspection.directGlobalReads[4], /map\.latLngToLayerPoint/);
  assert.match(
    inspection.directGlobalReads[5],
    /getShopRecipeForFeature\(feature\) -> map\?\./
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /growgo-custom25d-buildings-viewport-draw-helper/
  );
});

test("valid fake viewport, explicit buildings, and explicit style config produce an immutable successful draw summary with canvas-local coordinates", () => {
  const viewport = createViewportProjection({ zoom: 18.6 });
  const helper =
    moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper({
      viewportProjection: viewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const context = createFakeContext();
  const buildings = [
    createBuilding({
      id: "shop-1",
      buildingType: "commercial",
      shopTag: "bakery",
      nearCoast: true,
      buildingArea: 640,
      coords: [
        [-38.12, 144.61],
        [-38.121, 144.612],
        [-38.123, 144.608]
      ]
    }),
    createBuilding({
      id: "house-1",
      buildingType: "residential",
      coords: [
        [-38.119, 144.611],
        [-38.118, 144.613],
        [-38.117, 144.609]
      ]
    }),
    createBuilding({
      id: "offscreen-1",
      buildingType: "residential",
      coords: [
        [-38.2, 144.7],
        [-38.201, 144.702],
        [-38.203, 144.698]
      ]
    })
  ];

  const result = helper.drawBuildings({ context, buildings });

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "BUILDINGS_DRAW_READY");
  assert.equal(result.viewportValidated, true);
  assert.equal(result.contextValidated, true);
  assert.equal(result.styleConfigValidated, true);
  assert.equal(result.geometryValidated, true);
  assert.equal(result.zoom, 18.6);
  assert.equal(result.buildingInputCount, 3);
  assert.equal(result.eligibleBuildingCount, 2);
  assert.equal(result.skippedBuildingCount, 1);
  assert.equal(result.malformedBuildingCount, 0);
  assert.equal(result.projectionRequestCount, 9);
  assert.equal(result.projectionSuccessCount, 9);
  assert.equal(result.projectionFailureCount, 0);
  assert.equal(result.drawAttemptCount, 2);
  assert.equal(result.completedBuildingDrawCount, 2);
  assert.equal(result.contextSaveCount, result.contextRestoreCount);
  assert.ok(result.contextSaveCount > 0);
  assert.equal(viewport.calls.getZoom, 1);
  assert.equal(viewport.calls.project.length, 9);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.canonicalSafetyFlagSnapshot), true);

  assert.deepEqual(viewport.calls.project[0], {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.deepEqual(viewport.calls.project[3], {
    latitude: -38.119,
    longitude: 144.611
  });
  assert.deepEqual(viewport.calls.project[6], {
    latitude: -38.2,
    longitude: 144.7
  });

  const firstMove = findFirstOperation(context.operations, "moveTo");
  assert.equal(firstMove[0], "moveTo");
  assert.equal(Number.isFinite(firstMove[1]), true);
  assert.equal(Number.isFinite(firstMove[2]), true);
  assert.ok(countOperations(context.operations, "roundRect") > 0);
  assert.ok(countOperations(context.operations, "fillRect") > 0);
  assert.ok(
    countOperations(context.operations, "quadraticCurveTo") > 0 ||
      countOperations(context.operations, "arc") > 0 ||
      countOperations(context.operations, "ellipse") > 0 ||
      countOperations(context.operations, "rect") > 0
  );
  assert.equal(context.saveDepth, 0);
});

test("low zoom fails closed before projection and preserves the live minimum building threshold", () => {
  const viewport = createViewportProjection({ zoom: 16.1 });
  const helper =
    moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper({
      viewportProjection: viewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const context = createFakeContext();
  const result = helper.drawBuildings({
    context,
    buildings: [createBuilding()]
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "UNSUPPORTED_CURRENT_ZOOM");
  assert.equal(result.viewportValidated, true);
  assert.equal(result.contextValidated, false);
  assert.equal(result.buildingInputCount, 0);
  assert.equal(result.projectionRequestCount, 0);
  assert.equal(viewport.calls.getZoom, 1);
  assert.equal(viewport.calls.project.length, 0);
});

test("missing context fails closed without drawing", () => {
  const viewport = createViewportProjection();
  const helper =
    moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper({
      viewportProjection: viewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const result = helper.drawBuildings({
    buildings: [createBuilding()]
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "DRAW_CONTEXT_MISSING");
  assert.equal(result.contextValidated, false);
  assert.equal(result.projectionRequestCount, 0);
});

test("missing building collection fails closed", () => {
  const viewport = createViewportProjection();
  const helper =
    moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper({
      viewportProjection: viewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const context = createFakeContext();
  const result = helper.drawBuildings({ context });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "BUILDINGS_INPUT_MISSING");
  assert.equal(result.projectionRequestCount, 0);
  assert.equal(result.drawAttemptCount, 0);
});

test("unsupported multipolygon-like geometry fails closed as malformed input", () => {
  const viewport = createViewportProjection();
  const helper =
    moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper({
      viewportProjection: viewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const context = createFakeContext();
  const result = helper.drawBuildings({
    context,
    buildings: [
      createBuilding({
        geometryType: "polygon",
        coords: [
          [
            [-38.12, 144.61],
            [-38.121, 144.612],
            [-38.123, 144.608]
          ]
        ]
      })
    ]
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "BUILDING_GEOMETRY_INVALID");
  assert.equal(result.malformedBuildingCount, 1);
  assert.equal(result.geometryValidated, false);
  assert.equal(result.projectionRequestCount, 0);
});

test("projection failure fails closed and reports the failed projection attempt", () => {
  const viewport = createViewportProjection({ throwOnProject: true });
  const helper =
    moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper({
      viewportProjection: viewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const context = createFakeContext();
  const result = helper.drawBuildings({
    context,
    buildings: [createBuilding()]
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "PROJECTION_FAILURE");
  assert.equal(result.projectionRequestCount, 1);
  assert.equal(result.projectionSuccessCount, 0);
  assert.equal(result.projectionFailureCount, 1);
  assert.equal(result.drawAttemptCount, 0);
});

test("max building cap is preserved from the live zoom thresholds without reordering the input", () => {
  const viewport = createViewportProjection({ zoom: 17.2 });
  const helper =
    moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper({
      viewportProjection: viewport.viewportProjection,
      styleConfig: createStyleConfig({
        thresholds: {
          mediumZoomCap: 2
        }
      })
    });
  const context = createFakeContext();
  const buildings = [
    createBuilding({ id: "one" }),
    createBuilding({
      id: "two",
      coords: [
        [-38.118, 144.611],
        [-38.117, 144.613],
        [-38.116, 144.609]
      ]
    }),
    createBuilding({
      id: "three",
      coords: [
        [-38.117, 144.612],
        [-38.116, 144.614],
        [-38.115, 144.61]
      ]
    })
  ];

  const result = helper.drawBuildings({ context, buildings });

  assert.equal(result.outcome, "success");
  assert.equal(result.zoom, 17.2);
  assert.equal(result.buildingInputCount, 3);
  assert.equal(result.eligibleBuildingCount, 2);
  assert.equal(result.skippedBuildingCount, 1);
  assert.equal(result.completedBuildingDrawCount, 2);
  assert.equal(result.projectionRequestCount, 6);
  assert.deepEqual(viewport.calls.project[0], {
    latitude: -38.12,
    longitude: 144.61
  });
  assert.deepEqual(viewport.calls.project[3], {
    latitude: -38.118,
    longitude: 144.611
  });
});

test("dispose clears retained seams and future draws fail closed", () => {
  const viewport = createViewportProjection();
  const helper =
    moduleUnderTest.createGrowGoCustom25DBuildingsViewportDrawHelper({
      viewportProjection: viewport.viewportProjection,
      styleConfig: createStyleConfig()
    });

  const disposeStatus = helper.dispose();
  assert.equal(disposeStatus.helperStatus, "disposed");
  assert.equal(disposeStatus.reasonCode, "HELPER_DISPOSED");
  assert.equal(disposeStatus.disposed, true);

  const result = helper.drawBuildings({
    context: createFakeContext(),
    buildings: [createBuilding()]
  });
  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "HELPER_DISPOSED");
});
