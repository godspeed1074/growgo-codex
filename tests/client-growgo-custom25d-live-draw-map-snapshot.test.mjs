import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "growgo-custom25d-live-draw-map-snapshot.mjs"
  )
);
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createEnvironment(overrides = {}) {
  const calls = {
    mapProvider: 0,
    getSize: 0,
    getBounds: 0,
    getNorthWest: 0,
    latLngToLayerPoint: [],
    getZoom: 0,
    devicePixelRatio: 0
  };

  const bounds =
    overrides.bounds ??
    {
      getNorth() {
        return overrides.north ?? -38.10;
      },
      getSouth() {
        return overrides.south ?? -38.14;
      },
      getEast() {
        return overrides.east ?? 144.64;
      },
      getWest() {
        return overrides.west ?? 144.58;
      },
      getNorthWest() {
        calls.getNorthWest += 1;
        if (overrides.throwOnNorthWest) {
          throw Object.assign(new Error("north west failed"), {
            reasonCode: "NORTH_WEST_FAILED"
          });
        }
        return (
          overrides.northWest ?? {
            lat: overrides.north ?? -38.10,
            lng: overrides.west ?? 144.58
          }
        );
      }
    };

  const map =
    overrides.map ??
    {
      getSize() {
        calls.getSize += 1;
        if (overrides.throwOnSize) {
          throw Object.assign(new Error("size failed"), {
            reasonCode: "SIZE_FAILED"
          });
        }
        return overrides.size ?? { x: 640, y: 360 };
      },
      getBounds() {
        calls.getBounds += 1;
        if (overrides.throwOnBounds) {
          throw Object.assign(new Error("bounds failed"), {
            reasonCode: "BOUNDS_FAILED"
          });
        }
        return bounds;
      },
      latLngToLayerPoint(value) {
        calls.latLngToLayerPoint.push(value);
        if (overrides.throwOnLayerPoint) {
          throw Object.assign(new Error("layer point failed"), {
            reasonCode: "LAYER_POINT_FAILED"
          });
        }
        return overrides.layerPoint ?? { x: 12, y: 34 };
      },
      getZoom() {
        calls.getZoom += 1;
        if (overrides.throwOnZoom) {
          throw Object.assign(new Error("zoom failed"), {
            reasonCode: "ZOOM_FAILED"
          });
        }
        return overrides.zoom ?? 17.5;
      }
    };

  const mapProvider =
    overrides.mapProvider ??
    (() => {
      calls.mapProvider += 1;
      if (overrides.throwOnMapProvider) {
        throw Object.assign(new Error("map provider failed"), {
          reasonCode: "MAP_PROVIDER_FAILED"
        });
      }
      return Object.prototype.hasOwnProperty.call(overrides, "map")
        ? overrides.map
        : map;
    });

  const devicePixelRatioProvider =
    overrides.devicePixelRatioProvider ??
    (() => {
      calls.devicePixelRatio += 1;
      if (overrides.throwOnDevicePixelRatio) {
        throw Object.assign(new Error("ratio failed"), {
          reasonCode: "RATIO_FAILED"
        });
      }
      return Object.prototype.hasOwnProperty.call(overrides, "devicePixelRatio")
        ? overrides.devicePixelRatio
        : 2;
    });

  const provider =
    moduleUnderTest.createGrowGoCustom25DDrawMapSnapshotProvider({
      mapProvider: overrides.omitMapProvider ? undefined : mapProvider,
      devicePixelRatioProvider
    });

  return {
    calls,
    provider,
    map,
    bounds
  };
}

test("module import has no side effects, factory exists, and source lock stays anchored to current draw-map dependencies", () => {
  assert.equal(
    typeof moduleUnderTest.createGrowGoCustom25DDrawMapSnapshotProvider,
    "function"
  );
  assert.equal(
    typeof moduleUnderTest.inspectGrowGoCustom25DDrawMapSnapshotSourceLock,
    "function"
  );

  const inspection =
    moduleUnderTest.inspectGrowGoCustom25DDrawMapSnapshotSourceLock({
      scriptSource
    });

  assert.equal(inspection.ok, true);
  assert.equal(
    inspection.classification,
    "BLOCKED_BY_ADDITIONAL_GLOBAL_MAP_READS"
  );
  assert.equal(inspection.zoomDependency, true);
  assert.match(inspection.directGlobalMapReads[0], /map\.getSize/);
  assert.match(inspection.indirectHelperMapReads[0], /drawCustom25DZones/);
  assert.match(inspection.viewportValuesRequired[8], /zoom/);
  assert.match(
    inspection.canvasResizeAndPositionOrder[3],
    /L\.DomUtil\.setPosition/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /createGrowGoCustom25DDrawMapSnapshotProvider/
  );
});

test("valid fake map creates one deeply immutable snapshot with exact read counts and normalized backing size", () => {
  const env = createEnvironment();
  const snapshot = env.provider.getDrawMapSnapshot();
  const status = env.provider.getDrawMapSnapshotStatus();

  assert.equal(snapshot.schemaId, "GROWGO_CUSTOM25D_LIVE_DRAW_MAP_SNAPSHOT_RESULT_001");
  assert.equal(snapshot.snapshotStatus, "ready");
  assert.equal(snapshot.reasonCode, "DRAW_MAP_SNAPSHOT_READY");
  assert.equal(snapshot.mapIdentityValidated, true);
  assert.equal(snapshot.mapReadCount, 1);
  assert.equal(snapshot.sizeReadCount, 1);
  assert.equal(snapshot.boundsReadCount, 1);
  assert.equal(snapshot.northWestReadCount, 1);
  assert.equal(snapshot.layerPointConversionCount, 1);
  assert.equal(snapshot.devicePixelRatioReadCount, 1);
  assert.equal(snapshot.zoomReadCount, 1);
  assert.equal(snapshot.logicalWidth, 640);
  assert.equal(snapshot.logicalHeight, 360);
  assert.equal(snapshot.backingWidth, 1280);
  assert.equal(snapshot.backingHeight, 720);
  assert.equal(snapshot.devicePixelRatio, 2);
  assert.equal(snapshot.zoom, 17.5);
  assert.deepEqual(snapshot.bounds, {
    north: -38.1,
    south: -38.14,
    east: 144.64,
    west: 144.58
  });
  assert.deepEqual(snapshot.northWestCoordinate, {
    latitude: -38.1,
    longitude: 144.58
  });
  assert.deepEqual(snapshot.canvasLayerPosition, { x: 12, y: 34 });
  assert.equal(snapshot.mapReferenceRetained, false);
  assert.equal(snapshot.boundsReferenceRetained, false);
  assert.equal(snapshot.coordinateReferenceRetained, false);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.bounds), true);
  assert.equal(Object.isFrozen(snapshot.northWestCoordinate), true);
  assert.equal(Object.isFrozen(snapshot.canvasLayerPosition), true);
  assert.equal(status.snapshotStatus, "ready");
  assert.equal(status, env.provider.getDrawMapSnapshotStatus());

  assert.equal(env.calls.mapProvider, 1);
  assert.equal(env.calls.getSize, 1);
  assert.equal(env.calls.getBounds, 1);
  assert.equal(env.calls.getNorthWest, 1);
  assert.equal(env.calls.latLngToLayerPoint.length, 1);
  assert.equal(env.calls.devicePixelRatio, 1);
  assert.equal(env.calls.getZoom, 1);
});

test("invalid absent zero or negative device pixel ratio falls back to 1", () => {
  for (const ratio of [undefined, null, 0, -2, Number.NaN]) {
    const env = createEnvironment({ devicePixelRatio: ratio });
    const snapshot = env.provider.getDrawMapSnapshot();
    assert.equal(snapshot.snapshotStatus, "ready");
    assert.equal(snapshot.devicePixelRatio, 1);
    assert.equal(snapshot.backingWidth, 640);
    assert.equal(snapshot.backingHeight, 360);
  }
});

test("repeated calls return independent frozen snapshots and status inspection performs no map reads", () => {
  const env = createEnvironment();
  const idleStatusA = env.provider.getDrawMapSnapshotStatus();
  const idleStatusB = env.provider.getDrawMapSnapshotStatus();

  assert.equal(idleStatusA.snapshotStatus, "idle");
  assert.equal(idleStatusA, idleStatusB);
  assert.equal(env.calls.mapProvider, 0);
  assert.equal(env.calls.getSize, 0);

  const first = env.provider.getDrawMapSnapshot();
  const second = env.provider.getDrawMapSnapshot();

  assert.notEqual(first, second);
  assert.deepEqual(first, second);
  assert.equal(env.calls.mapProvider, 2);
  assert.equal(env.calls.getSize, 2);
  assert.equal(env.calls.getBounds, 2);
  assert.equal(env.calls.getNorthWest, 2);
  assert.equal(env.calls.latLngToLayerPoint.length, 2);
  assert.equal(env.calls.devicePixelRatio, 2);
  assert.equal(env.calls.getZoom, 2);
});

test("missing map provider, missing map, and incomplete map interface all fail closed", () => {
  const missingProviderEnv = createEnvironment({ omitMapProvider: true });
  const missingProvider = missingProviderEnv.provider.getDrawMapSnapshot();
  assert.equal(missingProvider.snapshotStatus, "failed_closed");
  assert.equal(missingProvider.reasonCode, "MAP_PROVIDER_MISSING");
  assert.equal(missingProviderEnv.calls.mapProvider, 0);

  const missingMapEnv = createEnvironment({ map: null });
  const missingMap = missingMapEnv.provider.getDrawMapSnapshot();
  assert.equal(missingMap.snapshotStatus, "failed_closed");
  assert.equal(missingMap.reasonCode, "MAP_PROVIDER_RETURNED_NO_MAP");
  assert.equal(missingMap.mapReadCount, 1);

  const incompleteMapEnv = createEnvironment({
    map: {
      getSize() {
        return { x: 1, y: 1 };
      }
    }
  });
  const incompleteMap = incompleteMapEnv.provider.getDrawMapSnapshot();
  assert.equal(incompleteMap.snapshotStatus, "failed_closed");
  assert.equal(incompleteMap.reasonCode, "INCOMPLETE_MAP_INTERFACE");
  assert.equal(incompleteMap.mapReadCount, 1);
});

test("provider exceptions fail closed with precise reason and no later reads", () => {
  const mapProviderEnv = createEnvironment({ throwOnMapProvider: true });
  const mapProviderResult = mapProviderEnv.provider.getDrawMapSnapshot();
  assert.equal(mapProviderResult.snapshotStatus, "failed_closed");
  assert.equal(mapProviderResult.reasonCode, "MAP_PROVIDER_FAILED");
  assert.equal(mapProviderEnv.calls.getSize, 0);

  const sizeEnv = createEnvironment({ throwOnSize: true });
  const sizeResult = sizeEnv.provider.getDrawMapSnapshot();
  assert.equal(sizeResult.snapshotStatus, "failed_closed");
  assert.equal(sizeResult.reasonCode, "SIZE_FAILED");
  assert.equal(sizeEnv.calls.getBounds, 0);

  const boundsEnv = createEnvironment({ throwOnBounds: true });
  const boundsResult = boundsEnv.provider.getDrawMapSnapshot();
  assert.equal(boundsResult.snapshotStatus, "failed_closed");
  assert.equal(boundsResult.reasonCode, "BOUNDS_FAILED");
  assert.equal(boundsEnv.calls.getNorthWest, 0);

  const northWestEnv = createEnvironment({ throwOnNorthWest: true });
  const northWestResult = northWestEnv.provider.getDrawMapSnapshot();
  assert.equal(northWestResult.snapshotStatus, "failed_closed");
  assert.equal(northWestResult.reasonCode, "NORTH_WEST_FAILED");
  assert.equal(northWestEnv.calls.latLngToLayerPoint.length, 0);

  const layerPointEnv = createEnvironment({ throwOnLayerPoint: true });
  const layerPointResult = layerPointEnv.provider.getDrawMapSnapshot();
  assert.equal(layerPointResult.snapshotStatus, "failed_closed");
  assert.equal(layerPointResult.reasonCode, "LAYER_POINT_FAILED");
  assert.equal(layerPointEnv.calls.devicePixelRatio, 0);

  const ratioEnv = createEnvironment({ throwOnDevicePixelRatio: true });
  const ratioResult = ratioEnv.provider.getDrawMapSnapshot();
  assert.equal(ratioResult.snapshotStatus, "failed_closed");
  assert.equal(ratioResult.reasonCode, "RATIO_FAILED");
  assert.equal(ratioEnv.calls.getZoom, 1);
});

test("invalid size, invalid bounds, invalid coordinate, invalid layer point, and invalid zoom are handled safely", () => {
  const invalidSizeEnv = createEnvironment({ size: { x: 0, y: 360 } });
  const invalidSize = invalidSizeEnv.provider.getDrawMapSnapshot();
  assert.equal(invalidSize.reasonCode, "INVALID_LOGICAL_SIZE");
  assert.equal(invalidSize.boundsReadCount, 0);

  const invalidBoundsEnv = createEnvironment({
    north: -38.2,
    south: -38.1
  });
  const invalidBounds = invalidBoundsEnv.provider.getDrawMapSnapshot();
  assert.equal(invalidBounds.reasonCode, "INVALID_BOUNDS");
  assert.equal(invalidBounds.northWestReadCount, 0);

  const invalidCoordinateEnv = createEnvironment({
    northWest: { lat: Number.NaN, lng: 144.58 }
  });
  const invalidCoordinate = invalidCoordinateEnv.provider.getDrawMapSnapshot();
  assert.equal(invalidCoordinate.reasonCode, "INVALID_NORTH_WEST_COORDINATE");
  assert.equal(invalidCoordinate.layerPointConversionCount, 0);

  const invalidLayerPointEnv = createEnvironment({
    layerPoint: { x: Number.NaN, y: 34 }
  });
  const invalidLayerPoint = invalidLayerPointEnv.provider.getDrawMapSnapshot();
  assert.equal(invalidLayerPoint.reasonCode, "INVALID_LAYER_POINT");
  assert.equal(invalidLayerPoint.devicePixelRatioReadCount, 0);

  const invalidZoomEnv = createEnvironment({ zoom: "not-finite" });
  const invalidZoom = invalidZoomEnv.provider.getDrawMapSnapshot();
  assert.equal(invalidZoom.snapshotStatus, "ready");
  assert.equal(invalidZoom.zoom, null);
});

test("no references are retained and no live draw, canvas, DOM, listener, timer, network, asset, or browser activation side effects are introduced", () => {
  const env = createEnvironment();
  const snapshot = env.provider.getDrawMapSnapshot();

  assert.equal(snapshot.mapReferenceRetained, false);
  assert.equal(snapshot.boundsReferenceRetained, false);
  assert.equal(snapshot.coordinateReferenceRetained, false);
  assert.equal(snapshot.drawRequested, false);
  assert.equal(snapshot.canvasMutationRequested, false);
  assert.equal(snapshot.canvasPositionMutationRequested, false);
  assert.equal(snapshot.listenerAdded, false);
  assert.equal(snapshot.retentionWritten, false);
  assert.equal(snapshot.realRendererInvoked, false);
  assert.equal(snapshot.realDrawFunctionCalled, false);
  assert.equal(snapshot.realCanvasCreated, false);
  assert.equal(snapshot.realPaneCreated, false);
  assert.equal(snapshot.realWebglContextCreated, false);
  assert.equal(snapshot.realOverlayCreated, false);
  assert.equal(snapshot.networkRequested, false);
  assert.equal(snapshot.assetDownloadRequested, false);
  assert.equal(snapshot.automaticInvocation, false);

  const moduleSource = fs.readFileSync(
    path.join(
      repoRoot,
      "client",
      "growgo-custom25d-live-draw-map-snapshot.mjs"
    ),
    "utf8"
  );

  assert.doesNotMatch(moduleSource, /\bdrawCustom25DMapCanvas\([^)]*\);/);
  assert.doesNotMatch(moduleSource, /\binitCustom25DMapExperiment\(\);/);
  assert.doesNotMatch(moduleSource, /\.on\(/);
  assert.doesNotMatch(moduleSource, /setInterval|setTimeout/);
  assert.doesNotMatch(moduleSource, /\bwindow\.GrowGoDeveloperDiagnostics\b/);
});

test("all four canonical safety flags remain false and script.js remains the source contract without modification", () => {
  const env = createEnvironment();
  const snapshot = env.provider.getDrawMapSnapshot();

  assert.deepEqual(snapshot.canonicalSafetyFlagSnapshot, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });

  assert.match(scriptSource, /function drawCustom25DMapCanvas\(canvas\)/);
  assert.match(scriptSource, /map\.getSize\(\)/);
  assert.match(scriptSource, /map\.getBounds\(\)/);
  assert.match(scriptSource, /map\.latLngToLayerPoint\(bounds\.getNorthWest\(\)\)/);
  assert.match(scriptSource, /L\.DomUtil\.setPosition\(canvas, topLeft\)/);
  assert.match(scriptSource, /window\.devicePixelRatio/);
  assert.match(scriptSource, /canvas\.getContext\("2d"\)/);
  assert.match(scriptSource, /function initCustom25DMapExperiment\(\)/);
  assert.match(scriptSource, /let custom25DMapLayer = null;/);
});
