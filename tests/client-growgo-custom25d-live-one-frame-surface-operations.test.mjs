import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-one-frame-surface-operations.mjs"
  )
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const sessionCoordinatorSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-session-coordinator.mjs"
  ),
  "utf8"
);

function createEnvironment(overrides = {}) {
  const calls = {
    getPane: [],
    createPane: [],
    domCreate: [],
    setPosition: [],
    getSize: 0,
    getBounds: 0,
    getNorthWest: 0,
    latLngToLayerPoint: [],
    appendChild: [],
    removeChild: [],
    canvasRemove: 0
  };

  const paneParent = {
    removedChildren: [],
    removeChild(node) {
      calls.removeChild.push(node);
      this.removedChildren.push(node);
      if (node === createdPane) {
        createdPane.wasRemoved = true;
      }
      if (overrides.throwOnPaneRemove) {
        throw Object.assign(new Error("pane remove failed"), {
          reasonCode: "ROLLBACK_PANE_REMOVAL_FAILED"
        });
      }
    }
  };

  const existingPane =
    overrides.existingPane ??
    {
      dataset: { owner: "custom25DMapPane" },
      childElementCount: 0,
      children: [],
      appendChild(node) {
        calls.appendChild.push({ pane: this, node });
        this.children.push(node);
        this.childElementCount = this.children.length;
        node.parentNode = this;
        if (overrides.throwOnAppend) {
          throw Object.assign(new Error("append failed"), {
            reasonCode: "CANVAS_APPEND_FAILED"
          });
        }
      },
      removeChild(node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
          this.children.splice(index, 1);
        }
        this.childElementCount = this.children.length;
        calls.removeChild.push(node);
        if (overrides.throwOnCanvasRemove) {
          throw Object.assign(new Error("canvas remove failed"), {
            reasonCode: "ROLLBACK_CANVAS_REMOVAL_FAILED"
          });
        }
      }
    };

  const createdPane =
    overrides.createdPane ??
    {
      dataset: { owner: "custom25DMapPane" },
      childElementCount: 0,
      children: [],
      parentNode: paneParent,
      appendChild(node) {
        calls.appendChild.push({ pane: this, node });
        this.children.push(node);
        this.childElementCount = this.children.length;
        node.parentNode = this;
        if (overrides.throwOnAppend) {
          throw Object.assign(new Error("append failed"), {
            reasonCode: "CANVAS_APPEND_FAILED"
          });
        }
      },
      removeChild(node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
          this.children.splice(index, 1);
        }
        this.childElementCount = this.children.length;
        calls.removeChild.push(node);
        if (overrides.throwOnCanvasRemove) {
          throw Object.assign(new Error("canvas remove failed"), {
            reasonCode: "ROLLBACK_CANVAS_REMOVAL_FAILED"
          });
        }
      }
    };

  const canvas =
    overrides.canvas ??
    {
      className: "custom-25d-map-canvas",
      style: {},
      remove() {
        calls.canvasRemove += 1;
        if (overrides.throwOnCanvasRemove) {
          throw Object.assign(new Error("canvas remove failed"), {
            reasonCode: "ROLLBACK_CANVAS_REMOVAL_FAILED"
          });
        }
        if (this.parentNode?.children) {
          const index = this.parentNode.children.indexOf(this);
          if (index >= 0) {
            this.parentNode.children.splice(index, 1);
            this.parentNode.childElementCount = this.parentNode.children.length;
          }
        }
      }
    };

  const northWest = overrides.northWest ?? { lat: -38.12, lng: 144.61 };

  const map =
    overrides.map ??
    {
      getPane(name) {
        calls.getPane.push(name);
        if (overrides.throwOnGetPane) {
          throw Object.assign(new Error("getPane failed"), {
            reasonCode: "PANE_LOOKUP_FAILED"
          });
        }
        return overrides.lookupResult === undefined ? existingPane : overrides.lookupResult;
      },
      createPane(name) {
        calls.createPane.push(name);
        if (overrides.throwOnCreatePane) {
          throw Object.assign(new Error("createPane failed"), {
            reasonCode: "PANE_CREATION_FAILED"
          });
        }
        return overrides.createPaneResult ?? createdPane;
      },
      getSize() {
        calls.getSize += 1;
        if (overrides.throwOnGetSize) {
          throw new Error("size failed");
        }
        return overrides.sizeResult ?? { x: 640, y: 360 };
      },
      getBounds() {
        calls.getBounds += 1;
        if (overrides.throwOnGetBounds) {
          throw new Error("bounds failed");
        }
        return overrides.boundsResult ?? {
          getNorthWest() {
            calls.getNorthWest += 1;
            if (overrides.throwOnGetNorthWest) {
              throw new Error("north west failed");
            }
            return northWest;
          }
        };
      },
      latLngToLayerPoint(value) {
        calls.latLngToLayerPoint.push(value);
        if (overrides.throwOnLayerPoint) {
          throw new Error("point failed");
        }
        return overrides.pointResult ?? { x: 12, y: 34 };
      }
    };

  const leafletProvider =
    overrides.leafletProvider ??
    {
      DomUtil: {
        create(tagName, className, pane) {
          calls.domCreate.push({ tagName, className, pane });
          if (overrides.throwOnDomCreate) {
            throw Object.assign(new Error("dom create failed"), {
              reasonCode: "CANVAS_CREATION_FAILED"
            });
          }
          canvas.className = className;
          if (pane && typeof pane.appendChild === "function") {
            pane.appendChild(canvas);
          }
          return overrides.canvasResult ?? canvas;
        },
        setPosition(node, point) {
          calls.setPosition.push({ node, point });
          if (overrides.throwOnSetPosition) {
            throw Object.assign(new Error("position failed"), {
              reasonCode: "CANVAS_POSITIONING_FAILED"
            });
          }
          node.position = point;
        }
      }
    };

  const operations =
    moduleUnderTest.createGrowGoCustom25DLiveOneFrameSurfaceOperations({
      leafletProvider,
      devicePixelRatioProvider:
        overrides.devicePixelRatioProvider ?? (() => overrides.devicePixelRatio ?? 2)
    });

  return {
    calls,
    map,
    canvas,
    existingPane,
    createdPane,
    paneParent,
    operations
  };
}

test("module import has no side effects, factory exists, and source lock remains anchored to current live renderer behavior", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DLiveOneFrameSurfaceOperations,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DLiveOneFrameSurfaceOperationsSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DLiveOneFrameSurfaceOperationsSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "LIVE_SURFACE_SOURCE_LOCK_CONFIRMED"
  );
  assert.equal(
    inspection.currentRendererBehavior.pixelRatioResizeOwner,
    "drawCustom25DMapCanvas"
  );
  assert.equal(
    inspection.currentRendererBehavior.rendererResizesAgainEachFrame,
    true
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createGrowGoCustom25DLiveOneFrameSurfaceOperations/
  );
  assert.doesNotMatch(
    sessionCoordinatorSource,
    /createGrowGoCustom25DLiveOneFrameSurfaceOperations/
  );
});

test("valid fake map prepares one surface with exact pane, Canvas, size, position, ratio, and no side effects beyond the owned surface", () => {
  const env = createEnvironment({ lookupResult: null, devicePixelRatio: 2 });
  const result = env.operations.prepareOneFrameSurface({ map: env.map });
  const status = env.operations.getSurfaceOperationsStatus();

  assert.equal(result.outcome, "prepared");
  assert.equal(result.reasonCode, "LIVE_SURFACE_PREPARED");
  assert.equal(result.surface.paneName, "custom25DMapPane");
  assert.equal(result.surface.canvasClassName, "custom-25d-map-canvas");
  assert.equal(result.surface.paneCreated, true);
  assert.equal(result.surface.paneReused, false);
  assert.equal(result.surface.paneOwnedByOperation, true);
  assert.equal(result.surface.canvasOwnedByOperation, true);
  assert.equal(result.surface.canvasAppended, true);
  assert.equal(result.surface.cssWidth, 640);
  assert.equal(result.surface.cssHeight, 360);
  assert.equal(result.surface.backingWidth, 1280);
  assert.equal(result.surface.backingHeight, 720);
  assert.equal(result.surface.devicePixelRatio, 2);
  assert.deepEqual(result.surface.canvasPosition, { x: 12, y: 34 });
  assert.equal(result.surface.cleanupRequired, true);
  assert.equal(result.surface.rollbackAvailable, true);
  assert.equal(result.surface.listenerAdded, false);
  assert.equal(result.surface.retentionWritten, false);
  assert.equal(result.surface.drawRequested, false);
  assert.equal(status.operationState, "prepared");
  assert.equal(status.moduleLevelMapRetained, false);
  assert.equal(status.moduleLevelPaneRetained, false);
  assert.equal(status.moduleLevelCanvasRetained, false);
  assert.equal(env.calls.getSize, 1);
  assert.equal(env.calls.getBounds, 1);
  assert.equal(env.calls.getNorthWest, 1);
  assert.equal(env.calls.latLngToLayerPoint.length, 1);
  assert.equal(env.calls.setPosition.length, 1);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.surfaceSnapshot), true);
});

test("existing valid pane is reused, missing pane creates exactly one pane, reused pane is not owned, and invalid ratio falls back to 1", () => {
  const reusedEnv = createEnvironment({ devicePixelRatio: Number.NaN });
  const createdEnv = createEnvironment({ lookupResult: null });

  const reused = reusedEnv.operations.prepareOneFrameSurface({ map: reusedEnv.map });
  const created = createdEnv.operations.prepareOneFrameSurface({ map: createdEnv.map });

  assert.equal(reused.surface.paneReused, true);
  assert.equal(reused.surface.paneCreated, false);
  assert.equal(reused.surface.paneOwnedByOperation, false);
  assert.equal(reused.surface.backingWidth, 640);
  assert.equal(reused.surface.devicePixelRatio, 1);
  assert.equal(created.surface.paneCreated, true);
  assert.equal(created.surface.paneOwnedByOperation, true);
  assert.equal(createdEnv.calls.createPane.length, 1);
});

test("missing or invalid dependencies fail closed before any live-capable surface is prepared", () => {
  const missingMap = createEnvironment().operations.prepareOneFrameSurface();
  const invalidMap = createEnvironment().operations.prepareOneFrameSurface({ map: {} });
  const badPane = createEnvironment().operations.prepareOneFrameSurface({
    map: createEnvironment().map,
    paneName: "wrongPane"
  });
  const badClass = createEnvironment().operations.prepareOneFrameSurface({
    map: createEnvironment().map,
    canvasClassName: "wrong-class"
  });
  const missingLeaflet =
    moduleUnderTest
      .createGrowGoCustom25DLiveOneFrameSurfaceOperations({})
      .prepareOneFrameSurface({ map: createEnvironment().map });

  assert.equal(missingMap.reasonCode, "MISSING_MAP");
  assert.equal(invalidMap.reasonCode, "INVALID_MAP_CONTRACT");
  assert.equal(badPane.reasonCode, "INCORRECT_PANE_NAME");
  assert.equal(badClass.reasonCode, "INCORRECT_CANVAS_CLASS");
  assert.equal(missingLeaflet.reasonCode, "MISSING_LEAFLET_PROVIDER");
});

test("invalid existing pane, pane creation failure, Canvas creation failure, append failure, invalid size, invalid bounds, invalid coordinate, invalid point, sizing failure, and positioning failure all fail closed", () => {
  const invalidPane = createEnvironment({
    existingPane: { dataset: { owner: "wrongPane" } }
  }).operations.prepareOneFrameSurface({ map: createEnvironment({
    existingPane: { dataset: { owner: "wrongPane" } }
  }).map });

  const paneCreateFailure = createEnvironment({
    lookupResult: null,
    throwOnCreatePane: true
  }).operations.prepareOneFrameSurface({ map: createEnvironment({
    lookupResult: null,
    throwOnCreatePane: true
  }).map });

  const canvasFailure = createEnvironment({
    throwOnDomCreate: true
  }).operations.prepareOneFrameSurface({ map: createEnvironment({
    throwOnDomCreate: true
  }).map });

  const appendFailureEnv = createEnvironment({
    lookupResult: null,
    throwOnAppend: true
  });
  const appendFailure = appendFailureEnv.operations.prepareOneFrameSurface({
    map: appendFailureEnv.map
  });

  const invalidSizeEnv = createEnvironment({
    lookupResult: null,
    sizeResult: { x: 0, y: 360 }
  });
  const invalidSize = invalidSizeEnv.operations.prepareOneFrameSurface({
    map: invalidSizeEnv.map
  });

  const invalidBoundsEnv = createEnvironment({
    lookupResult: null,
    boundsResult: {}
  });
  const invalidBounds = invalidBoundsEnv.operations.prepareOneFrameSurface({
    map: invalidBoundsEnv.map
  });

  const invalidNorthWestEnv = createEnvironment({
    lookupResult: null,
    boundsResult: {
      getNorthWest() {
        invalidNorthWestEnv.calls.getNorthWest += 1;
        return null;
      }
    }
  });
  const invalidNorthWest = invalidNorthWestEnv.operations.prepareOneFrameSurface({
    map: invalidNorthWestEnv.map
  });

  const invalidPointEnv = createEnvironment({
    lookupResult: null,
    pointResult: { x: "bad", y: 34 }
  });
  const invalidPoint = invalidPointEnv.operations.prepareOneFrameSurface({
    map: invalidPointEnv.map
  });

  const sizingFailureEnv = createEnvironment({
    lookupResult: null,
    canvas: {
      className: "custom-25d-map-canvas",
      set width(_) {
        throw Object.assign(new Error("size failed"), {
          reasonCode: "CANVAS_SIZING_FAILED"
        });
      },
      style: {},
      remove() {}
    }
  });
  const sizingFailure = sizingFailureEnv.operations.prepareOneFrameSurface({
    map: sizingFailureEnv.map
  });

  const positionFailureEnv = createEnvironment({
    lookupResult: null,
    throwOnSetPosition: true
  });
  const positionFailure = positionFailureEnv.operations.prepareOneFrameSurface({
    map: positionFailureEnv.map
  });

  assert.equal(invalidPane.reasonCode, "INVALID_EXISTING_PANE");
  assert.equal(paneCreateFailure.reasonCode, "PANE_CREATION_FAILED");
  assert.equal(canvasFailure.reasonCode, "CANVAS_CREATION_FAILED");
  assert.equal(appendFailure.reasonCode, "CANVAS_APPEND_FAILED");
  assert.equal(invalidSize.reasonCode, "INVALID_MAP_SIZE");
  assert.equal(invalidBounds.reasonCode, "INVALID_BOUNDS");
  assert.equal(invalidNorthWest.reasonCode, "INVALID_NORTH_WEST_COORDINATE");
  assert.equal(invalidPoint.reasonCode, "INVALID_LAYER_POINT_POSITION");
  assert.equal(sizingFailure.reasonCode, "CANVAS_SIZING_FAILED");
  assert.equal(positionFailure.reasonCode, "CANVAS_POSITIONING_FAILED");
});

test("append and later-stage failures trigger rollback, remove the exact Canvas, preserve reused panes, may remove owned empty panes, and preserve unrelated resources", () => {
  const reusedPaneEnv = createEnvironment({
    existingPane: {
      dataset: { owner: "custom25DMapPane" },
      childElementCount: 1,
      children: [{ id: "unrelated" }],
      appendChild(node) {
        this.children.push(node);
        this.childElementCount = this.children.length;
        node.parentNode = this;
      },
      removeChild(node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
          this.children.splice(index, 1);
        }
        this.childElementCount = this.children.length;
      }
    },
    pointResult: { x: "bad", y: 34 }
  });
  const reusedFailure = reusedPaneEnv.operations.prepareOneFrameSurface({
    map: reusedPaneEnv.map
  });

  const ownedPaneEnv = createEnvironment({
    lookupResult: null,
    pointResult: { x: "bad", y: 34 }
  });
  const ownedFailure = ownedPaneEnv.operations.prepareOneFrameSurface({
    map: ownedPaneEnv.map
  });

  assert.equal(reusedFailure.rollbackAttempted, true);
  assert.equal(reusedFailure.rollbackCompleted, true);
  assert.equal(reusedPaneEnv.existingPane.children.some((node) => node.id === "unrelated"), true);
  assert.equal(ownedFailure.rollbackAttempted, true);
  assert.equal(ownedFailure.rollbackCompleted, true);
  assert.equal(ownedPaneEnv.createdPane.wasRemoved, true);
});

test("explicit rollback removes the exact Canvas, never removes a reused pane, reports rollback failures precisely, and keeps snapshots deeply immutable", () => {
  const env = createEnvironment({ lookupResult: null });
  const prepared = env.operations.prepareOneFrameSurface({ map: env.map });
  const rollback = env.operations.rollbackPreparedSurface({
    surface: prepared.surface
  });

  assert.equal(rollback.outcome, "rolled_back");
  assert.equal(rollback.reasonCode, "ROLLBACK_COMPLETED");
  assert.equal(rollback.rollbackAttempted, true);
  assert.equal(rollback.rollbackCompleted, true);
  assert.equal(env.calls.canvasRemove, 1);
  assert.equal(env.createdPane.wasRemoved, true);
  assert.equal(Object.isFrozen(rollback), true);

  const reusedEnv = createEnvironment();
  const reusedPrepared = reusedEnv.operations.prepareOneFrameSurface({
    map: reusedEnv.map
  });
  const reusedRollback = reusedEnv.operations.rollbackPreparedSurface({
    surface: reusedPrepared.surface
  });
  assert.equal(reusedRollback.outcome, "rolled_back");
  assert.equal(reusedEnv.existingPane.wasRemoved, undefined);

  const rollbackFailureEnv = createEnvironment({
    lookupResult: null,
    throwOnCanvasRemove: true
  });
  const rollbackPrepared = rollbackFailureEnv.operations.prepareOneFrameSurface({
    map: rollbackFailureEnv.map
  });
  const rollbackFailure = rollbackFailureEnv.operations.rollbackPreparedSurface({
    surface: rollbackPrepared.surface
  });
  assert.equal(rollbackFailure.outcome, "failed_closed");
  assert.equal(
    rollbackFailure.rollbackFailureReason,
    "ROLLBACK_CANVAS_REMOVAL_FAILED"
  );
});
