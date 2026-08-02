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
    "growgo-custom25d-zones-viewport-draw-helper.mjs"
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
    clip() {
      operations.push(["clip"]);
    },
    fillRect(x, y, width, height) {
      operations.push(["fillRect", x, y, width, height]);
    },
    strokeRect(x, y, width, height) {
      operations.push(["strokeRect", x, y, width, height]);
    },
    quadraticCurveTo(cpx, cpy, x, y) {
      operations.push(["quadraticCurveTo", cpx, cpy, x, y]);
    }
  };

  for (const propertyName of [
    "fillStyle",
    "strokeStyle",
    "lineWidth",
    "lineCap",
    "lineJoin"
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
  zoom = 17.5,
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

function createZone(overrides = {}) {
  return {
    zoneType: overrides.zoneType ?? "grass",
    closed: Object.prototype.hasOwnProperty.call(overrides, "closed")
      ? overrides.closed
      : true,
    coords:
      overrides.coords ??
      [
        [-38.12, 144.61],
        [-38.121, 144.612],
        [-38.123, 144.608]
      ]
  };
}

function createStyleConfig(overrides = {}) {
  return moduleUnderTest.createGrowGoCustom25DZonesStyleConfig(overrides);
}

function findFirstOperation(operations, opName) {
  return operations.find((entry) => entry[0] === opName);
}

test("module import has no side effects, helper exists, style config exists, and source lock preserves the current live global dependencies", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DZonesStyleConfig,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DZonesViewportDrawHelperSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DZonesViewportDrawHelperSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
  );
  assert.match(inspection.directGlobalReads[0], /custom25DZoneFeatures/);
  assert.match(inspection.directGlobalReads[1], /map\.getZoom/);
  assert.match(inspection.directGlobalReads[4], /map\.latLngToLayerPoint/);
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /growgo-custom25d-zones-viewport-draw-helper/
  );
});

test("valid fake viewport, frozen zoom, explicit zones, and explicit style config produce an immutable successful draw summary with canvas-local coordinates", () => {
  const viewport = createViewportProjection();
  const helper = moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });
  const context = createFakeContext();
  const zones = [
    createZone({
      zoneType: "water",
      coords: [
        [-38.2, 144.7],
        [-38.21, 144.71],
        [-38.205, 144.705]
      ]
    }),
    createZone({
      zoneType: "grass",
      coords: [
        [-38.12, 144.61],
        [-38.121, 144.612],
        [-38.123, 144.608]
      ]
    }),
    createZone({
      zoneType: "park",
      coords: [
        [-38.119, 144.611],
        [-38.118, 144.613],
        [-38.117, 144.609]
      ]
    })
  ];

  const result = helper.drawZones({ context, zones });

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "ZONES_DRAW_READY");
  assert.equal(result.viewportValidated, true);
  assert.equal(result.contextValidated, true);
  assert.equal(result.styleConfigValidated, true);
  assert.equal(result.zoom, 17.5);
  assert.equal(result.zoneInputCount, 3);
  assert.equal(result.eligibleZoneCount, 2);
  assert.equal(result.skippedZoneCount, 1);
  assert.equal(result.projectionRequestCount, 9);
  assert.equal(result.projectionSuccessCount, 9);
  assert.equal(result.projectionFailureCount, 0);
  assert.equal(result.drawAttemptCount, 2);
  assert.equal(result.completedZoneDrawCount, 2);
  assert.equal(viewport.calls.getZoom, 1);
  assert.equal(viewport.calls.project.length, 9);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.canonicalSafetyFlagSnapshot), true);

  const firstMove = findFirstOperation(context.operations, "moveTo");
  assert.deepEqual(firstMove, ["moveTo", 1446.1, 381.2]);
  assert.deepEqual(viewport.calls.project[0], {
    latitude: -38.2,
    longitude: 144.7
  });
  assert.deepEqual(viewport.calls.project[3], {
    latitude: -38.12,
    longitude: 144.61
  });
});

test("zone filtering, zone priority order, zoom detail thresholds, style behavior, and context operation order are preserved", () => {
  const mediumViewport = createViewportProjection({ zoom: 16.5 });
  const mediumHelper =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      viewportProjection: mediumViewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const mediumContext = createFakeContext();
  const mediumResult = mediumHelper.drawZones({
    context: mediumContext,
    zones: [
      createZone({ zoneType: "water" }),
      createZone({ zoneType: "grass" })
    ]
  });

  assert.equal(mediumResult.outcome, "success");
  assert.equal(mediumResult.eligibleZoneCount, 2);
  assert.equal(
    mediumContext.operations.slice(0, 9).map((entry) => entry[0]).join(","),
    "save,beginPath,moveTo,lineTo,lineTo,closePath,set,fill,set"
  );
  assert.deepEqual(
    mediumContext.operations[6],
    ["set", "fillStyle", "rgba(154, 203, 130, 0.22)"]
  );
  assert.equal(
    mediumContext.operations.some(
      (entry) =>
        entry[0] === "set" &&
        entry[1] === "lineWidth" &&
        entry[2] === 1.6
    ),
    true
  );
  assert.equal(
    mediumContext.operations.some(
      (entry) =>
        entry[0] === "set" &&
        entry[1] === "fillStyle" &&
        entry[2] === "rgba(201, 228, 178, 0.04)"
    ),
    true
  );
  assert.equal(
    mediumContext.operations.some((entry) => entry[0] === "quadraticCurveTo"),
    false
  );

  const highViewport = createViewportProjection({
    zoom: 18.2,
    projectImplementation(coordinate) {
      return {
        canvasPoint: {
          x: Number((coordinate.longitude * 1000).toFixed(3)),
          y: Number((coordinate.latitude * -1000).toFixed(3))
        },
        insideSnapshotBounds: true
      };
    }
  });
  const highHelper = moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper(
    {
      viewportProjection: highViewport.viewportProjection,
      styleConfig: createStyleConfig()
    }
  );
  const highContext = createFakeContext();
  const highResult = highHelper.drawZones({
    context: highContext,
    zones: [
      createZone({
        zoneType: "park",
        coords: [
          [-38.12, 144.61],
          [-38.12, 144.68],
          [-38.18, 144.68],
          [-38.18, 144.61]
        ]
      })
    ]
  });

  assert.equal(highResult.outcome, "success");
  assert.equal(
    highContext.operations.some((entry) => entry[0] === "quadraticCurveTo"),
    true
  );
  assert.equal(
    highContext.operations.some(
      (entry) =>
        entry[0] === "set" &&
        entry[1] === "lineWidth" &&
        entry[2] === 2.2
    ),
    true
  );
});

test("repeated independent draw calls do not retain feature, context, or viewport result state", () => {
  const viewport = createViewportProjection();
  const helper = moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });

  const firstContext = createFakeContext();
  const secondContext = createFakeContext();
  const firstZones = [createZone({ zoneType: "grass" })];
  const secondZones = [createZone({ zoneType: "sports" })];

  const firstResult = helper.drawZones({ context: firstContext, zones: firstZones });
  const secondResult = helper.drawZones({
    context: secondContext,
    zones: secondZones
  });

  assert.notEqual(firstResult, secondResult);
  assert.equal(firstResult.completedZoneDrawCount, 1);
  assert.equal(secondResult.completedZoneDrawCount, 1);
  assert.equal(firstContext.saveDepth, 0);
  assert.equal(secondContext.saveDepth, 0);
  assert.equal(
    Object.keys(firstResult).includes("zones") ||
      Object.keys(firstResult).includes("context") ||
      Object.keys(firstResult).includes("viewportProjection"),
    false
  );
  assert.equal(helper.getHelperStatus().disposed, false);
});

test("missing viewport, missing getZoom, missing projection capability, invalid zoom, unsupported zoom, missing context, invalid context, missing zones, and invalid style configuration all fail closed", () => {
  const missingViewport =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      styleConfig: createStyleConfig()
    });
  assert.equal(
    missingViewport.drawZones({
      context: createFakeContext(),
      zones: [createZone()]
    }).reasonCode,
    "VIEWPORT_PROJECTION_MISSING"
  );

  const missingGetZoom =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      viewportProjection: {
        projectCoordinateToCanvasPoint() {
          return {
            canvasPoint: { x: 1, y: 2 },
            insideSnapshotBounds: true
          };
        }
      },
      styleConfig: createStyleConfig()
    });
  assert.equal(
    missingGetZoom.drawZones({
      context: createFakeContext(),
      zones: [createZone()]
    }).reasonCode,
    "VIEWPORT_GET_ZOOM_MISSING"
  );

  const missingProjector =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      viewportProjection: {
        getZoom() {
          return 17.5;
        }
      },
      styleConfig: createStyleConfig()
    });
  assert.equal(
    missingProjector.drawZones({
      context: createFakeContext(),
      zones: [createZone()]
    }).reasonCode,
    "VIEWPORT_PROJECT_COORDINATE_TO_CANVAS_POINT_MISSING"
  );

  const invalidZoomViewport = createViewportProjection({ zoom: Number.NaN });
  const invalidZoomHelper =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      viewportProjection: invalidZoomViewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  assert.equal(
    invalidZoomHelper.drawZones({
      context: createFakeContext(),
      zones: [createZone()]
    }).reasonCode,
    "INVALID_FROZEN_ZOOM"
  );

  const unsupportedZoomViewport = createViewportProjection({ zoom: 14.8 });
  const unsupportedZoomHelper =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      viewportProjection: unsupportedZoomViewport.viewportProjection,
      styleConfig: createStyleConfig({
        supportedZoomRange: {
          minimum: 15,
          maximum: 20
        }
      })
    });
  assert.equal(
    unsupportedZoomHelper.drawZones({
      context: createFakeContext(),
      zones: [createZone()]
    }).reasonCode,
    "UNSUPPORTED_CURRENT_ZOOM"
  );

  const validViewport = createViewportProjection();
  const helper = moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
    viewportProjection: validViewport.viewportProjection,
    styleConfig: createStyleConfig()
  });
  assert.equal(
    helper.drawZones({ zones: [createZone()] }).reasonCode,
    "DRAW_CONTEXT_MISSING"
  );
  assert.equal(
    helper.drawZones({
      context: { save() {} },
      zones: [createZone()]
    }).reasonCode,
    "DRAW_CONTEXT_INVALID"
  );
  assert.equal(
    helper.drawZones({ context: createFakeContext() }).reasonCode,
    "ZONES_INPUT_MISSING"
  );

  const missingStyle =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      viewportProjection: validViewport.viewportProjection
    });
  assert.equal(
    missingStyle.drawZones({
      context: createFakeContext(),
      zones: [createZone()]
    }).reasonCode,
    "STYLE_CONFIG_MISSING"
  );

  const invalidStyle =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      viewportProjection: validViewport.viewportProjection,
      styleConfig: {
        zoneStyles: {
          grass: { fill: "", edge: "", inner: "" }
        }
      }
    });
  assert.equal(
    invalidStyle.drawZones({
      context: createFakeContext(),
      zones: [createZone()]
    }).reasonCode,
    "STYLE_CONFIG_INVALID"
  );
});

test("malformed zone geometry, invalid coordinates, and projection failures fail closed with accurate projection counters", () => {
  const viewport = createViewportProjection();
  const helper = moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });

  const invalidGeometry = helper.drawZones({
    context: createFakeContext(),
    zones: [{ zoneType: "grass", coords: null }]
  });
  assert.equal(invalidGeometry.reasonCode, "ZONE_GEOMETRY_INVALID");
  assert.equal(invalidGeometry.projectionRequestCount, 0);

  const invalidCoordinate = helper.drawZones({
    context: createFakeContext(),
    zones: [{ zoneType: "grass", coords: [[-38.12, "nope"], [-38.1, 144.6]] }]
  });
  assert.equal(invalidCoordinate.reasonCode, "ZONE_COORDINATE_INVALID");
  assert.equal(invalidCoordinate.projectionRequestCount, 0);

  const projectionFailureViewport = createViewportProjection({
    projectImplementation(coordinate) {
      if (coordinate.longitude > 144.611) {
        throw Object.assign(new Error("projection failed"), {
          reasonCode: "PROJECTION_FAILURE"
        });
      }
      return {
        canvasPoint: { x: 10, y: 20 },
        insideSnapshotBounds: true
      };
    }
  });
  const projectionFailureHelper =
    moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
      viewportProjection: projectionFailureViewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const projectionFailure = projectionFailureHelper.drawZones({
    context: createFakeContext(),
    zones: [
      createZone({
        coords: [
          [-38.12, 144.61],
          [-38.121, 144.612],
          [-38.123, 144.608]
        ]
      })
    ]
  });

  assert.equal(projectionFailure.reasonCode, "PROJECTION_FAILURE");
  assert.equal(projectionFailure.projectionRequestCount, 2);
  assert.equal(projectionFailure.projectionSuccessCount, 1);
  assert.equal(projectionFailure.projectionFailureCount, 1);
  assert.equal(projectionFailure.completedZoneDrawCount, 0);
});

test("context save and restore stay balanced, results are deeply immutable, and no live-side effects are reported", () => {
  const viewport = createViewportProjection({ zoom: 18.2 });
  const helper = moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });
  const context = createFakeContext();

  const result = helper.drawZones({
    context,
    zones: [createZone({ zoneType: "water" }), createZone({ zoneType: "beach" })]
  });

  const saveCount = context.operations.filter((entry) => entry[0] === "save").length;
  const restoreCount = context.operations.filter((entry) => entry[0] === "restore").length;

  assert.equal(saveCount, restoreCount);
  assert.equal(context.saveDepth, 0);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.canonicalSafetyFlagSnapshot), true);
  assert.throws(() => {
    result.zoneInputCount = 99;
  }, /read only|Cannot assign/i);

  assert.equal(result.globalMapReadPerformed, false);
  assert.equal(result.globalZoneDataReadPerformed, false);
  assert.equal(result.listenerAdded, false);
  assert.equal(result.retentionWritten, false);
  assert.equal(result.realRendererInvoked, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realPaneCreated, false);
  assert.equal(result.realWebglContextCreated, false);
  assert.equal(result.realOverlayCreated, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);
});

test("disposing the helper releases the seam and blocks future draws without exposing browser commands or live globals", () => {
  const viewport = createViewportProjection();
  const helper = moduleUnderTest.createGrowGoCustom25DZonesViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });

  const disposedStatus = helper.dispose();
  const result = helper.drawZones({
    context: createFakeContext(),
    zones: [createZone()]
  });

  assert.equal(disposedStatus.helperStatus, "disposed");
  assert.equal(result.reasonCode, "HELPER_DISPOSED");
  assert.equal(helper.getHelperStatus().disposed, true);
  assert.equal(
    Object.prototype.hasOwnProperty.call(globalThis, "GrowGoCustom25DZonesViewportDrawHelper"),
    false
  );
  assert.equal(
    scriptSource.includes("GrowGoCustom25DZonesViewportDrawHelper"),
    false
  );
});
