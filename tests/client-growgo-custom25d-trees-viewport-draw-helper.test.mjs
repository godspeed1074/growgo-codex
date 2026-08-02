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
  path.join(repoRoot, "client", "growgo-custom25d-trees-viewport-draw-helper.mjs")
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

function createTree(overrides = {}) {
  return {
    id: overrides.id ?? "park-1",
    zoneType: overrides.zoneType ?? "park",
    coords:
      overrides.coords ??
      [
        [-38.12, 144.61],
        [-38.121, 144.612],
        [-38.123, 144.608]
      ]
  };
}

function countOperations(operations, opName) {
  return operations.filter((entry) => entry[0] === opName).length;
}

function createStyleConfig(overrides = {}) {
  return moduleUnderTest.createGrowGoCustom25DTreesStyleConfig(overrides);
}

test("module import has no side effects, helper factory exists, style config exists, and source lock preserves the current live tree dependencies including the north-west lookup", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DTreesStyleConfig,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DTreesViewportDrawHelperSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DTreesViewportDrawHelperSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
  );
  assert.equal(inspection.treeDataSource, "custom25DZoneFeatures");
  assert.equal(
    inspection.northWestDependency.classification,
    "redundant_with_frame_topLeft"
  );
  assert.match(
    inspection.directGlobalReads[3],
    /map\.latLngToLayerPoint\(bounds\.getNorthWest\(\)\)/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /growgo-custom25d-trees-viewport-draw-helper/
  );
});

test("valid fake viewport, representative trees, and explicit style config produce an immutable successful draw summary with no independent north-west lookup", () => {
  const viewport = createViewportProjection({ zoom: 17.4 });
  const helper = moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });
  const context = createFakeContext();
  const trees = [
    createTree({
      id: "park-a",
      coords: [
        [-38.12, 144.61],
        [-38.121, 144.612],
        [-38.123, 144.608]
      ]
    }),
    createTree({
      id: "park-b",
      coords: [
        [-38.119, 144.611],
        [-38.118, 144.613],
        [-38.117, 144.609]
      ]
    }),
    createTree({
      id: "beach-skip",
      zoneType: "beach"
    }),
    createTree({
      id: "park-offscreen",
      coords: [
        [-38.2, 144.7],
        [-38.201, 144.702],
        [-38.203, 144.698]
      ]
    })
  ];

  const result = helper.drawTrees({ context, trees });

  assert.equal(result.outcome, "success");
  assert.equal(result.reasonCode, "TREES_DRAW_READY");
  assert.equal(result.viewportValidated, true);
  assert.equal(result.contextValidated, true);
  assert.equal(result.styleConfigValidated, true);
  assert.equal(result.geometryValidated, true);
  assert.equal(result.zoom, 17.4);
  assert.equal(result.treeInputCount, 4);
  assert.equal(result.eligibleTreeCount, 2);
  assert.equal(result.skippedTreeCount, 2);
  assert.equal(result.malformedTreeCount, 0);
  assert.equal(result.projectionRequestCount, 9);
  assert.equal(result.projectionSuccessCount, 9);
  assert.equal(result.projectionFailureCount, 0);
  assert.equal(result.drawAttemptCount, 2);
  assert.equal(result.completedTreeDrawCount, 2);
  assert.equal(result.contextSaveCount, 2);
  assert.equal(result.contextRestoreCount, 2);
  assert.equal(result.northWestLookupCount, 0);
  assert.equal(result.frozenTopLeftUsed, true);
  assert.equal(viewport.calls.getZoom, 1);
  assert.equal(viewport.calls.project.length, 9);
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
  assert.equal(countOperations(context.operations, "clip"), 2);
  assert.equal(countOperations(context.operations, "arc"), 24);
  assert.equal(countOperations(context.operations, "fill"), 24);
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

test("actual zoom thresholds and cluster-count behavior are preserved", () => {
  const lowZoomHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
      viewportProjection: createViewportProjection({ zoom: 16.4 }).viewportProjection,
      styleConfig: createStyleConfig()
    });
  const lowZoomResult = lowZoomHelper.drawTrees({
    context: createFakeContext(),
    trees: [createTree()]
  });
  assert.equal(lowZoomResult.outcome, "blocked");
  assert.equal(lowZoomResult.reasonCode, "TREE_ZOOM_BELOW_THRESHOLD");

  const highZoomViewport = createViewportProjection({ zoom: 18.2 });
  const highZoomHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
      viewportProjection: highZoomViewport.viewportProjection,
      styleConfig: createStyleConfig()
    });
  const highZoomContext = createFakeContext();
  const highZoomResult = highZoomHelper.drawTrees({
    context: highZoomContext,
    trees: [createTree()]
  });

  assert.equal(highZoomResult.outcome, "success");
  assert.equal(highZoomResult.completedTreeDrawCount, 1);
  assert.equal(countOperations(highZoomContext.operations, "arc"), 20);
  assert.equal(countOperations(highZoomContext.operations, "fill"), 20);
});

test("repeated calls retain no tree state and return independent immutable summaries", () => {
  const viewport = createViewportProjection({ zoom: 17.4 });
  const helper = moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
    viewportProjection: viewport.viewportProjection,
    styleConfig: createStyleConfig()
  });

  const firstResult = helper.drawTrees({
    context: createFakeContext(),
    trees: [createTree()]
  });
  const secondResult = helper.drawTrees({
    context: createFakeContext(),
    trees: [createTree()]
  });

  assert.notEqual(firstResult, secondResult);
  assert.equal(firstResult.completedTreeDrawCount, 1);
  assert.equal(secondResult.completedTreeDrawCount, 1);
  assert.equal(Object.isFrozen(firstResult), true);
  assert.equal(Object.isFrozen(secondResult), true);
});

test("missing viewport, missing getZoom, missing projection capability, invalid zoom, missing context, missing trees, malformed collection, invalid geometry, invalid coordinates, projection failure, and invalid style all fail closed", () => {
  const validContext = createFakeContext();
  const validTrees = [createTree()];

  const invalidViewportHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
      styleConfig: createStyleConfig()
    });
  assert.equal(
    invalidViewportHelper.drawTrees({
      context: validContext,
      trees: validTrees
    }).reasonCode,
    "VIEWPORT_PROJECTION_MISSING"
  );

  const missingGetZoomHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
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
    missingGetZoomHelper.drawTrees({
      context: validContext,
      trees: validTrees
    }).reasonCode,
    "VIEWPORT_GET_ZOOM_MISSING"
  );

  const missingProjectorHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
      viewportProjection: {
        getZoom() {
          return 17.4;
        }
      },
      styleConfig: createStyleConfig()
    });
  assert.equal(
    missingProjectorHelper.drawTrees({
      context: validContext,
      trees: validTrees
    }).reasonCode,
    "VIEWPORT_PROJECT_COORDINATE_TO_CANVAS_POINT_MISSING"
  );

  const invalidZoomHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
      viewportProjection: createViewportProjection({ zoom: Number.NaN })
        .viewportProjection,
      styleConfig: createStyleConfig()
    });
  assert.equal(
    invalidZoomHelper.drawTrees({
      context: validContext,
      trees: validTrees
    }).reasonCode,
    "INVALID_FROZEN_ZOOM"
  );

  const helper = moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });
  assert.equal(helper.drawTrees({ trees: validTrees }).reasonCode, "DRAW_CONTEXT_MISSING");
  assert.equal(helper.drawTrees({ context: validContext }).reasonCode, "TREES_INPUT_MISSING");
  assert.equal(
    helper.drawTrees({
      context: validContext,
      trees: {}
    }).reasonCode,
    "TREES_INPUT_INVALID"
  );
  assert.equal(
    helper.drawTrees({
      context: validContext,
      trees: [null]
    }).reasonCode,
    "TREE_OBJECT_INVALID"
  );
  assert.equal(
    helper.drawTrees({
      context: validContext,
      trees: [
        createTree({
          coords: [[[-38.12, 144.61]], [[-38.121, 144.612]], [[-38.123, 144.608]]]
        })
      ]
    }).reasonCode,
    "TREE_GEOMETRY_INVALID"
  );
  assert.equal(
    helper.drawTrees({
      context: validContext,
      trees: [
        createTree({
          coords: [[-38.12, "bad"], [-38.121, 144.612], [-38.123, 144.608]]
        })
      ]
    }).reasonCode,
    "TREE_COORDINATE_INVALID"
  );

  const projectionFailureHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
      viewportProjection: createViewportProjection({ throwOnProject: true })
        .viewportProjection,
      styleConfig: createStyleConfig()
    });
  const projectionFailureResult = projectionFailureHelper.drawTrees({
    context: validContext,
    trees: validTrees
  });
  assert.equal(projectionFailureResult.reasonCode, "PROJECTION_FAILURE");
  assert.equal(projectionFailureResult.projectionRequestCount, 1);
  assert.equal(projectionFailureResult.projectionFailureCount, 1);

  const invalidStyleHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
      viewportProjection: createViewportProjection().viewportProjection,
      styleConfig: { thresholds: {} }
    });
  assert.equal(
    invalidStyleHelper.drawTrees({
      context: validContext,
      trees: validTrees
    }).reasonCode,
    "STYLE_CONFIG_INVALID"
  );

  const missingTreeTypeStyleHelper =
    moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
      viewportProjection: createViewportProjection().viewportProjection,
      styleConfig: {
        thresholds: {
          mediumDetailZoom: 16.5,
          highDetailZoom: 18,
          minimumProjectedSpan: 12
        },
        clusterLayout: {
          mediumClusterCount: 3,
          highClusterCount: 5,
          mediumBaseScale: 0.72,
          mediumScaleStep: 0.05,
          highBaseScale: 0.9,
          highScaleStep: 0.08,
          xSeedStep: 17.3,
          ySeedStep: 29.7
        },
        blobLayout: [
          {
            x: -5,
            y: 2,
            radius: 4.2,
            fill: "rgba(64, 149, 77, 0.52)"
          },
          {
            x: 0,
            y: -2,
            radius: 5.3,
            fill: "rgba(50, 133, 63, 0.58)"
          },
          {
            x: 5,
            y: 2,
            radius: 4.4,
            fill: "rgba(64, 149, 77, 0.52)"
          }
        ],
        highlight: {
          offsetX: -1.4,
          offsetY: -3.2,
          radius: 1.8,
          fill: "rgba(228, 247, 206, 0.14)"
        },
        supportedTreeTypes: ["wetland"]
      }
    });
  assert.equal(
    missingTreeTypeStyleHelper.drawTrees({
      context: validContext,
      trees: validTrees
    }).reasonCode,
    "TREE_STYLE_MAPPING_MISSING"
  );
});

test("disposing the helper releases the seam and future draws fail closed", () => {
  const helper = moduleUnderTest.createGrowGoCustom25DTreesViewportDrawHelper({
    viewportProjection: createViewportProjection().viewportProjection,
    styleConfig: createStyleConfig()
  });

  const disposeStatus = helper.dispose();
  assert.equal(disposeStatus.helperStatus, "disposed");
  assert.equal(disposeStatus.reasonCode, "HELPER_DISPOSED");
  assert.equal(disposeStatus.disposed, true);

  const result = helper.drawTrees({
    context: createFakeContext(),
    trees: [createTree()]
  });

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "HELPER_DISPOSED");
});
