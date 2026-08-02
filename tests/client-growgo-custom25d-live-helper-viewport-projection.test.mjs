import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-helper-viewport-projection.mjs"
  )
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createSnapshot(overrides = {}) {
  return Object.freeze({
    schemaId: "GROWGO_CUSTOM25D_LIVE_DRAW_MAP_SNAPSHOT_RESULT_001",
    snapshotStatus: overrides.snapshotStatus ?? "ready",
    reasonCode: overrides.reasonCode ?? "DRAW_MAP_SNAPSHOT_READY",
    zoom: Object.prototype.hasOwnProperty.call(overrides, "zoom")
      ? overrides.zoom
      : 17.5,
    logicalWidth: Object.prototype.hasOwnProperty.call(overrides, "logicalWidth")
      ? overrides.logicalWidth
      : 640,
    logicalHeight: Object.prototype.hasOwnProperty.call(overrides, "logicalHeight")
      ? overrides.logicalHeight
      : 360,
    backingWidth: Object.prototype.hasOwnProperty.call(overrides, "backingWidth")
      ? overrides.backingWidth
      : 1280,
    backingHeight: Object.prototype.hasOwnProperty.call(overrides, "backingHeight")
      ? overrides.backingHeight
      : 720,
    devicePixelRatio: Object.prototype.hasOwnProperty.call(overrides, "devicePixelRatio")
      ? overrides.devicePixelRatio
      : 2,
    bounds:
      overrides.bounds ??
      Object.freeze({
        north: -38.1,
        south: -38.14,
        east: 144.64,
        west: 144.58
      }),
    northWestCoordinate:
      overrides.northWestCoordinate ??
      Object.freeze({
        latitude: -38.1,
        longitude: 144.58
      }),
    canvasLayerPosition:
      overrides.canvasLayerPosition ?? Object.freeze({ x: 12, y: 34 }),
    mapIdentityValidated: overrides.mapIdentityValidated ?? true,
    mapReadCount: overrides.mapReadCount ?? 1,
    sizeReadCount: overrides.sizeReadCount ?? 1,
    boundsReadCount: overrides.boundsReadCount ?? 1,
    northWestReadCount: overrides.northWestReadCount ?? 1,
    layerPointConversionCount: overrides.layerPointConversionCount ?? 1,
    devicePixelRatioReadCount: overrides.devicePixelRatioReadCount ?? 1,
    zoomReadCount: overrides.zoomReadCount ?? 1,
    mapReferenceRetained: false,
    boundsReferenceRetained: false,
    coordinateReferenceRetained: false,
    drawRequested: false,
    canvasMutationRequested: false,
    canvasPositionMutationRequested: false,
    listenerAdded: false,
    retentionWritten: false,
    realRendererInvoked: false,
    realDrawFunctionCalled: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createEnvironment(overrides = {}) {
  const calls = {
    projector: 0
  };

  const projector =
    overrides.projector ??
    ((input) => {
      calls.projector += 1;
      if (overrides.throwOnProjector) {
        throw Object.assign(new Error("projector failed"), {
          reasonCode: "PROJECTOR_FAILED"
        });
      }
      return (
        overrides.projectedPoint ?? {
          x: 40,
          y: 90
        }
      );
    });

  const seam =
    moduleUnderTest.createGrowGoCustom25DHelperViewportProjection({
      mapSnapshot:
        Object.prototype.hasOwnProperty.call(overrides, "mapSnapshot")
          ? overrides.mapSnapshot
          : createSnapshot(overrides.snapshotOverrides),
      coordinateProjector:
        overrides.omitProjector === true ? undefined : projector
    });

  return {
    calls,
    seam
  };
}

test("module import has no side effects, factory exists, and source lock captures the helper dependency table", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DHelperViewportProjection,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DHelperViewportProjectionSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DHelperViewportProjectionSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "BLOCKED_BY_FEATURE_DATA_GLOBAL_DEPENDENCIES"
  );
  assert.equal(inspection.helperDependencyTable.length, 5);
  assert.equal(
    inspection.helperDependencyTable[0].classification,
    "READY_FOR_VIEWPORT_PROJECTION_INJECTION"
  );
  assert.equal(
    inspection.helperDependencyTable[4].classification,
    "REQUIRES_ADDITIONAL_VIEWPORT_INPUT"
  );
  assert.match(
    inspection.projectionFormula,
    /projectedLayerPoint - frozenSnapshot\.canvasLayerPosition/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createGrowGoCustom25DHelperViewportProjection/
  );
});

test("valid Phase 211.28 snapshot is accepted, copied, and does not invoke the projector during construction", () => {
  const env = createEnvironment();
  const status = env.seam.getViewportStatus();

  assert.equal(status.seamStatus, "ready");
  assert.equal(status.snapshotValidated, true);
  assert.equal(
    status.snapshotSchemaId,
    "GROWGO_CUSTOM25D_LIVE_DRAW_MAP_SNAPSHOT_RESULT_001"
  );
  assert.equal(status.zoom, 17.5);
  assert.equal(status.logicalWidth, 640);
  assert.equal(status.logicalHeight, 360);
  assert.deepEqual(status.canvasLayerPosition, { x: 12, y: 34 });
  assert.deepEqual(status.bounds, {
    north: -38.1,
    south: -38.14,
    east: 144.64,
    west: 144.58
  });
  assert.equal(status.projectorAvailable, true);
  assert.equal(status.snapshotReferenceRetained, false);
  assert.equal(status.mapReferenceRetained, false);
  assert.equal(env.calls.projector, 0);
  assert.equal(Object.isFrozen(status), true);
});

test("frozen zoom is returned without side effects or projector use", () => {
  const env = createEnvironment();

  assert.equal(env.seam.getZoom(), 17.5);
  assert.equal(env.seam.getZoom(), 17.5);
  assert.equal(env.calls.projector, 0);
});

test("one coordinate projection calls the projector exactly once and returns immutable layer and canvas-local points", () => {
  const env = createEnvironment();
  const result = env.seam.projectCoordinateToCanvasPoint({
    latitude: -38.12,
    longitude: 144.61
  });
  const status = env.seam.getViewportStatus();

  assert.equal(result.projectionStatus, "ready");
  assert.equal(result.reasonCode, "PROJECTION_READY");
  assert.equal(result.latitude, -38.12);
  assert.equal(result.longitude, 144.61);
  assert.deepEqual(result.layerPoint, { x: 40, y: 90 });
  assert.deepEqual(result.canvasPoint, { x: 28, y: 56 });
  assert.equal(result.zoom, 17.5);
  assert.equal(result.insideSnapshotBounds, true);
  assert.equal(result.projectorInvocationCount, 1);
  assert.equal(result.mapReadPerformed, false);
  assert.equal(env.calls.projector, 1);
  assert.equal(status.projectionRequestCount, 1);
  assert.equal(status.projectionSuccessCount, 1);
  assert.equal(status.projectionFailureCount, 0);
  assert.equal(status.lastProjectionReasonCode, "PROJECTION_READY");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.layerPoint), true);
  assert.equal(Object.isFrozen(result.canvasPoint), true);
});

test("repeated projections use the same frozen viewport, keep accurate counters, and return independent snapshots", () => {
  const env = createEnvironment();
  const first = env.seam.projectCoordinateToLayerPoint({
    latitude: -38.12,
    longitude: 144.61
  });
  const second = env.seam.projectCoordinateToCanvasPoint({
    latitude: -38.2,
    longitude: 144.7
  });
  const status = env.seam.getViewportStatus();

  assert.equal(first.zoom, 17.5);
  assert.equal(second.zoom, 17.5);
  assert.equal(first.insideSnapshotBounds, true);
  assert.equal(second.insideSnapshotBounds, false);
  assert.notEqual(first, second);
  assert.equal(env.calls.projector, 2);
  assert.equal(status.projectionRequestCount, 2);
  assert.equal(status.projectionSuccessCount, 2);
  assert.equal(status.projectionFailureCount, 0);
});

test("missing snapshot, invalid snapshot schema, invalid snapshot status, invalid zoom, invalid canvas position, and invalid bounds fail closed", () => {
  const missingSnapshot = createEnvironment({ mapSnapshot: null });
  assert.equal(
    missingSnapshot.seam.projectCoordinateToCanvasPoint({
      latitude: -38.12,
      longitude: 144.61
    }).reasonCode,
    "SNAPSHOT_MISSING"
  );

  const invalidSchema = createEnvironment({
    mapSnapshot: Object.freeze({ ...createSnapshot(), schemaId: "WRONG_SCHEMA" })
  });
  assert.equal(
    invalidSchema.seam.projectCoordinateToCanvasPoint({
      latitude: -38.12,
      longitude: 144.61
    }).reasonCode,
    "INVALID_SNAPSHOT_SCHEMA"
  );

  const invalidStatus = createEnvironment({
    mapSnapshot: createSnapshot({ snapshotStatus: "failed_closed" })
  });
  assert.equal(
    invalidStatus.seam.projectCoordinateToCanvasPoint({
      latitude: -38.12,
      longitude: 144.61
    }).reasonCode,
    "SNAPSHOT_NOT_READY"
  );

  const invalidZoom = createEnvironment({
    mapSnapshot: createSnapshot({ zoom: null })
  });
  assert.equal(
    invalidZoom.seam.projectCoordinateToCanvasPoint({
      latitude: -38.12,
      longitude: 144.61
    }).reasonCode,
    "INVALID_SNAPSHOT_ZOOM"
  );

  const invalidCanvasPosition = createEnvironment({
    mapSnapshot: createSnapshot({
      canvasLayerPosition: Object.freeze({ x: Number.NaN, y: 34 })
    })
  });
  assert.equal(
    invalidCanvasPosition.seam.projectCoordinateToCanvasPoint({
      latitude: -38.12,
      longitude: 144.61
    }).reasonCode,
    "INVALID_CANVAS_LAYER_POSITION"
  );

  const invalidBounds = createEnvironment({
    mapSnapshot: createSnapshot({
      bounds: Object.freeze({
        north: -38.2,
        south: -38.1,
        east: 144.64,
        west: 144.58
      })
    })
  });
  assert.equal(
    invalidBounds.seam.projectCoordinateToCanvasPoint({
      latitude: -38.12,
      longitude: 144.61
    }).reasonCode,
    "INVALID_SNAPSHOT_BOUNDS"
  );
});

test("missing projector, invalid coordinates, projector exceptions, and invalid projected points fail closed with precise reasons", () => {
  const missingProjector = createEnvironment({ omitProjector: true });
  assert.equal(
    missingProjector.seam.projectCoordinateToCanvasPoint({
      latitude: -38.12,
      longitude: 144.61
    }).reasonCode,
    "PROJECTOR_MISSING"
  );

  const invalidLatitude = createEnvironment();
  assert.equal(
    invalidLatitude.seam.projectCoordinateToCanvasPoint({
      latitude: Number.NaN,
      longitude: 144.61
    }).reasonCode,
    "INVALID_LATITUDE"
  );
  assert.equal(invalidLatitude.calls.projector, 0);

  const invalidLongitude = createEnvironment();
  assert.equal(
    invalidLongitude.seam.projectCoordinateToCanvasPoint({
      latitude: -38.12,
      longitude: Number.NaN
    }).reasonCode,
    "INVALID_LONGITUDE"
  );
  assert.equal(invalidLongitude.calls.projector, 0);

  const projectorException = createEnvironment({ throwOnProjector: true });
  const exceptionResult = projectorException.seam.projectCoordinateToCanvasPoint({
    latitude: -38.12,
    longitude: 144.61
  });
  assert.equal(exceptionResult.reasonCode, "PROJECTOR_FAILED");
  assert.equal(projectorException.calls.projector, 1);

  const invalidPoint = createEnvironment({
    projectedPoint: { x: Number.NaN, y: 90 }
  });
  const invalidPointResult = invalidPoint.seam.projectCoordinateToCanvasPoint({
    latitude: -38.12,
    longitude: 144.61
  });
  assert.equal(invalidPointResult.reasonCode, "INVALID_PROJECTED_POINT");
  assert.equal(invalidPoint.calls.projector, 1);
});

test("status inspection invokes no projector, results retain no coordinate references, and no live side effects are introduced", () => {
  const env = createEnvironment();
  const before = env.seam.getViewportStatus();
  const result = env.seam.projectCoordinateToCanvasPoint({
    latitude: -38.12,
    longitude: 144.61
  });
  const after = env.seam.getViewportStatus();

  assert.equal(env.calls.projector, 1);
  assert.equal(before.projectionRequestCount, 0);
  assert.equal(after.coordinateReferenceRetained, false);
  assert.equal(after.projectedPointReferenceRetained, false);
  assert.equal(result.drawRequested, false);
  assert.equal(result.canvasMutationRequested, false);
  assert.equal(result.listenerAdded, false);
  assert.equal(result.mapReadPerformed, false);

  const moduleSource = fs.readFileSync(
    path.join(
      repoRoot,
      "client",
      "growgo-custom25d-live-helper-viewport-projection.mjs"
    ),
    "utf8"
  );

  assert.doesNotMatch(moduleSource, /\bdrawCustom25DMapCanvas\([^)]*\);/);
  assert.doesNotMatch(moduleSource, /\binitCustom25DMapExperiment\(\);/);
  assert.doesNotMatch(moduleSource, /custom25DMapLayer\s*=/);
  assert.doesNotMatch(moduleSource, /\.on\(/);
  assert.doesNotMatch(moduleSource, /setInterval|setTimeout/);
  assert.doesNotMatch(moduleSource, /\bwindow\.GrowGoDeveloperDiagnostics\b/);
});

test("all four canonical flags remain false and script source still contains the helper global-map reads", () => {
  const env = createEnvironment();
  const result = env.seam.projectCoordinateToCanvasPoint({
    latitude: -38.12,
    longitude: 144.61
  });

  assert.deepEqual(result.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });

  assert.match(scriptSource, /function drawCustom25DZones\(ctx, bounds, topLeft\)/);
  assert.match(scriptSource, /const zoom = map\.getZoom\(\);/);
  assert.match(scriptSource, /const point = map\.latLngToLayerPoint\(\[lat, lng\]\);/);
  assert.match(scriptSource, /x: point\.x - topLeft\.x/);
  assert.match(scriptSource, /y: point\.y - topLeft\.y/);
  assert.match(scriptSource, /projectCustom25DZonePoints\(feature\.coords, map\.latLngToLayerPoint\(bounds\.getNorthWest\(\)\)\)/);
  assert.match(scriptSource, /function renderCustomLandmarkLayer\(ctx, bounds\)/);
});
