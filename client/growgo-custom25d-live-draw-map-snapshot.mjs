function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }

  return Object.freeze(value);
}

const STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_DRAW_MAP_SNAPSHOT_STATUS_001";
const SNAPSHOT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_DRAW_MAP_SNAPSHOT_RESULT_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_DRAW_MAP_SNAPSHOT_SOURCE_LOCK_001";

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function toReasonCode(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (typeof error.reasonCode === "string" && error.reasonCode.trim()) {
    return error.reasonCode;
  }

  if (typeof error.code === "string" && error.code.trim()) {
    return error.code;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim().replace(/\s+/g, "_").toUpperCase();
  }

  return fallback;
}

function isObjectLike(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function createInitialStatus() {
  return {
    schemaId: STATUS_SCHEMA_ID,
    snapshotStatus: "idle",
    reasonCode: "SNAPSHOT_IDLE",
    zoom: null,
    logicalWidth: null,
    logicalHeight: null,
    backingWidth: null,
    backingHeight: null,
    devicePixelRatio: null,
    bounds: null,
    northWestCoordinate: null,
    canvasLayerPosition: null,
    mapIdentityValidated: false,
    mapReadCount: 0,
    sizeReadCount: 0,
    boundsReadCount: 0,
    northWestReadCount: 0,
    layerPointConversionCount: 0,
    devicePixelRatioReadCount: 0,
    zoomReadCount: 0,
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
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  };
}

function freezeStatus(status) {
  return deepFreeze({
    ...status,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  });
}

function normalizeLogicalSize(size) {
  if (!isObjectLike(size)) {
    return null;
  }

  const width = Number(size.x ?? size.width);
  const height = Number(size.y ?? size.height);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (width <= 0 || height <= 0) {
    return null;
  }

  return deepFreeze({ width, height });
}

function normalizeDevicePixelRatio(value) {
  const ratio = Number(value);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
}

function buildBoundsSnapshot(bounds) {
  if (!isObjectLike(bounds)) {
    return null;
  }

  const north = Number(
    typeof bounds.getNorth === "function" ? bounds.getNorth() : bounds.north
  );
  const south = Number(
    typeof bounds.getSouth === "function" ? bounds.getSouth() : bounds.south
  );
  const east = Number(
    typeof bounds.getEast === "function" ? bounds.getEast() : bounds.east
  );
  const west = Number(
    typeof bounds.getWest === "function" ? bounds.getWest() : bounds.west
  );

  if (
    !Number.isFinite(north) ||
    !Number.isFinite(south) ||
    !Number.isFinite(east) ||
    !Number.isFinite(west)
  ) {
    return null;
  }

  if (north < south) {
    return null;
  }

  return deepFreeze({ north, south, east, west });
}

function buildNorthWestCoordinate(boundsSnapshot, northWestSource) {
  if (typeof northWestSource !== "undefined") {
    if (!isObjectLike(northWestSource)) {
      return null;
    }

    const latitude = Number(
      northWestSource.lat ?? northWestSource.latitude ?? northWestSource[0]
    );
    const longitude = Number(
      northWestSource.lng ?? northWestSource.longitude ?? northWestSource[1]
    );

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return deepFreeze({ latitude, longitude });
    }

    return null;
  }

  if (!boundsSnapshot) {
    return null;
  }

  return deepFreeze({
    latitude: boundsSnapshot.north,
    longitude: boundsSnapshot.west
  });
}

function buildLayerPointSnapshot(layerPoint) {
  if (!isObjectLike(layerPoint)) {
    return null;
  }

  const x = Number(layerPoint.x);
  const y = Number(layerPoint.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return deepFreeze({ x, y });
}

function createSnapshotFromStatus(status) {
  return deepFreeze({
    schemaId: SNAPSHOT_SCHEMA_ID,
    snapshotStatus: status.snapshotStatus,
    reasonCode: status.reasonCode,
    zoom: status.zoom,
    logicalWidth: status.logicalWidth,
    logicalHeight: status.logicalHeight,
    backingWidth: status.backingWidth,
    backingHeight: status.backingHeight,
    devicePixelRatio: status.devicePixelRatio,
    bounds: status.bounds,
    northWestCoordinate: status.northWestCoordinate,
    canvasLayerPosition: status.canvasLayerPosition,
    mapIdentityValidated: status.mapIdentityValidated,
    mapReadCount: status.mapReadCount,
    sizeReadCount: status.sizeReadCount,
    boundsReadCount: status.boundsReadCount,
    northWestReadCount: status.northWestReadCount,
    layerPointConversionCount: status.layerPointConversionCount,
    devicePixelRatioReadCount: status.devicePixelRatioReadCount,
    zoomReadCount: status.zoomReadCount,
    mapReferenceRetained: status.mapReferenceRetained,
    boundsReferenceRetained: status.boundsReferenceRetained,
    coordinateReferenceRetained: status.coordinateReferenceRetained,
    drawRequested: status.drawRequested,
    canvasMutationRequested: status.canvasMutationRequested,
    canvasPositionMutationRequested: status.canvasPositionMutationRequested,
    listenerAdded: status.listenerAdded,
    retentionWritten: status.retentionWritten,
    realRendererInvoked: status.realRendererInvoked,
    realDrawFunctionCalled: status.realDrawFunctionCalled,
    realCanvasCreated: status.realCanvasCreated,
    realPaneCreated: status.realPaneCreated,
    realWebglContextCreated: status.realWebglContextCreated,
    realOverlayCreated: status.realOverlayCreated,
    networkRequested: status.networkRequested,
    assetDownloadRequested: status.assetDownloadRequested,
    automaticInvocation: status.automaticInvocation,
    canonicalSafetyFlagSnapshot: status.canonicalSafetyFlagSnapshot
  });
}

export function inspectGrowGoCustom25DDrawMapSnapshotSourceLock({
  scriptSource
} = {}) {
  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_SNAPSHOT_IDENTITY_GAP"
    });
  }

  const checks = deepFreeze({
    drawEntryFound: scriptSource.includes("function drawCustom25DMapCanvas(canvas)"),
    initializerFound: scriptSource.includes("function initCustom25DMapExperiment()"),
    customLayerRetentionFound: scriptSource.includes("let custom25DMapLayer = null;"),
    sizeReadFound: scriptSource.includes("const size = map.getSize();"),
    boundsReadFound: scriptSource.includes("const bounds = map.getBounds();"),
    northWestLayerReadFound: scriptSource.includes(
      "const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());"
    ),
    positionMutationFound: scriptSource.includes("L.DomUtil.setPosition(canvas, topLeft);"),
    devicePixelRatioFound: scriptSource.includes("const scale = window.devicePixelRatio || 1;"),
    contextReadFound: scriptSource.includes('const ctx = canvas.getContext("2d");'),
    zoneZoomReadFound: scriptSource.includes("const zoom = map.getZoom();"),
    zoneProjectionFound: scriptSource.includes(
      "const point = map.latLngToLayerPoint([lat, lng]);"
    ),
    treeTopLeftReprojectionFound: scriptSource.includes(
      "projectCustom25DZonePoints(feature.coords, map.latLngToLayerPoint(bounds.getNorthWest()))"
    ),
    landmarkProjectionFound: scriptSource.includes(
      "const point = map.latLngToLayerPoint([marker.lat, marker.lng]);"
    )
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok
      ? "DRAW_MAP_SNAPSHOT_SOURCE_LOCK_CONFIRMED"
      : "DRAW_MAP_SNAPSHOT_SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "BLOCKED_BY_ADDITIONAL_GLOBAL_MAP_READS"
      : "BLOCKED_BY_SNAPSHOT_IDENTITY_GAP",
    checks,
    directGlobalMapReads: ok
      ? deepFreeze([
          "map.getSize()",
          "map.getBounds()",
          "map.latLngToLayerPoint(bounds.getNorthWest())"
        ])
      : null,
    indirectHelperMapReads: ok
      ? deepFreeze([
          "drawCustom25DZones -> map.getZoom(), map.latLngToLayerPoint([lat, lng])",
          "drawCustom25DBuildings -> map.getZoom(), map.latLngToLayerPoint([lat, lng])",
          "drawCustom25DRoads -> map.getZoom(), map.latLngToLayerPoint([lat, lng])",
          "drawCustom25DTrees -> map.getZoom(), map.latLngToLayerPoint(bounds.getNorthWest()), map.latLngToLayerPoint([lat, lng])",
          "renderCustomLandmarkLayer -> map.latLngToLayerPoint([marker.lat, marker.lng])"
        ])
      : null,
    zoomDependency: ok,
    viewportValuesRequired: ok
      ? deepFreeze([
          "logicalWidth",
          "logicalHeight",
          "backingWidth",
          "backingHeight",
          "devicePixelRatio",
          "bounds",
          "northWestCoordinate",
          "canvasLayerPosition",
          "zoom"
        ])
      : null,
    canvasResizeAndPositionOrder: ok
      ? deepFreeze([
          "map.getSize()",
          "map.getBounds()",
          "map.latLngToLayerPoint(bounds.getNorthWest())",
          "L.DomUtil.setPosition(canvas, topLeft)",
          "window.devicePixelRatio || 1",
          "canvas.width/canvas.height/canvas.style.width/canvas.style.height",
          'canvas.getContext("2d")',
          "ctx.setTransform",
          "ctx.clearRect"
        ])
      : null
  });
}

export function createGrowGoCustom25DDrawMapSnapshotProvider({
  mapProvider,
  devicePixelRatioProvider
} = {}) {
  let status = freezeStatus(createInitialStatus());

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch,
      canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
    });
    return status;
  }

  function getDrawMapSnapshotStatus() {
    return status;
  }

  function failClosed(reasonCode, patch = {}) {
    const next = updateStatus({
      snapshotStatus: "failed_closed",
      reasonCode,
      mapReferenceRetained: false,
      boundsReferenceRetained: false,
      coordinateReferenceRetained: false,
      ...patch
    });

    return createSnapshotFromStatus(next);
  }

  function getDrawMapSnapshot() {
    if (typeof mapProvider !== "function") {
      return failClosed("MAP_PROVIDER_MISSING");
    }

    let map;
    try {
      map = mapProvider();
    } catch (error) {
      return failClosed(toReasonCode(error, "MAP_PROVIDER_EXCEPTION"), {
        mapReadCount: 1
      });
    }

    if (!isObjectLike(map)) {
      return failClosed("MAP_PROVIDER_RETURNED_NO_MAP", {
        mapReadCount: 1
      });
    }

    if (
      typeof map.getSize !== "function" ||
      typeof map.getBounds !== "function" ||
      typeof map.latLngToLayerPoint !== "function"
    ) {
      return failClosed("INCOMPLETE_MAP_INTERFACE", {
        mapReadCount: 1
      });
    }

    let sizeRaw;
    try {
      sizeRaw = map.getSize();
    } catch (error) {
      return failClosed(toReasonCode(error, "SIZE_READ_EXCEPTION"), {
        mapIdentityValidated: true,
        mapReadCount: 1,
        sizeReadCount: 1
      });
    }

    const logicalSize = normalizeLogicalSize(sizeRaw);
    if (!logicalSize) {
      return failClosed("INVALID_LOGICAL_SIZE", {
        mapIdentityValidated: true,
        mapReadCount: 1,
        sizeReadCount: 1
      });
    }

    let boundsRaw;
    try {
      boundsRaw = map.getBounds();
    } catch (error) {
      return failClosed(toReasonCode(error, "BOUNDS_READ_EXCEPTION"), {
        mapIdentityValidated: true,
        mapReadCount: 1,
        sizeReadCount: 1,
        boundsReadCount: 1
      });
    }

    const boundsSnapshot = buildBoundsSnapshot(boundsRaw);
    if (!boundsSnapshot) {
      return failClosed("INVALID_BOUNDS", {
        mapIdentityValidated: true,
        mapReadCount: 1,
        sizeReadCount: 1,
        boundsReadCount: 1
      });
    }

    let northWestRaw;
    if (typeof boundsRaw.getNorthWest === "function") {
      try {
        northWestRaw = boundsRaw.getNorthWest();
      } catch (error) {
        return failClosed(toReasonCode(error, "NORTH_WEST_READ_EXCEPTION"), {
          mapIdentityValidated: true,
          mapReadCount: 1,
          sizeReadCount: 1,
          boundsReadCount: 1,
          northWestReadCount: 1
        });
      }
    }

    const northWestCoordinate = buildNorthWestCoordinate(
      boundsSnapshot,
      northWestRaw
    );
    if (!northWestCoordinate) {
      return failClosed("INVALID_NORTH_WEST_COORDINATE", {
        mapIdentityValidated: true,
        mapReadCount: 1,
        sizeReadCount: 1,
        boundsReadCount: 1,
        northWestReadCount: 1
      });
    }

    let layerPointRaw;
    try {
      layerPointRaw = map.latLngToLayerPoint({
        lat: northWestCoordinate.latitude,
        lng: northWestCoordinate.longitude
      });
    } catch (error) {
      return failClosed(toReasonCode(error, "LAYER_POINT_CONVERSION_EXCEPTION"), {
        mapIdentityValidated: true,
        mapReadCount: 1,
        sizeReadCount: 1,
        boundsReadCount: 1,
        northWestReadCount: 1,
        layerPointConversionCount: 1
      });
    }

    const canvasLayerPosition = buildLayerPointSnapshot(layerPointRaw);
    if (!canvasLayerPosition) {
      return failClosed("INVALID_LAYER_POINT", {
        mapIdentityValidated: true,
        mapReadCount: 1,
        sizeReadCount: 1,
        boundsReadCount: 1,
        northWestReadCount: 1,
        layerPointConversionCount: 1
      });
    }

    let zoomRaw;
    if (typeof map.getZoom === "function") {
      try {
        zoomRaw = map.getZoom();
      } catch (error) {
        return failClosed(toReasonCode(error, "ZOOM_READ_EXCEPTION"), {
          mapIdentityValidated: true,
          mapReadCount: 1,
          sizeReadCount: 1,
          boundsReadCount: 1,
          northWestReadCount: 1,
          layerPointConversionCount: 1,
          zoomReadCount: 1
        });
      }
    }

    const zoom =
      typeof zoomRaw === "undefined" ? null : Number.isFinite(Number(zoomRaw)) ? Number(zoomRaw) : null;

    let ratioRaw;
    try {
      ratioRaw =
        typeof devicePixelRatioProvider === "function"
          ? devicePixelRatioProvider()
          : typeof window !== "undefined"
            ? window.devicePixelRatio
            : 1;
    } catch (error) {
      return failClosed(toReasonCode(error, "DEVICE_PIXEL_RATIO_PROVIDER_EXCEPTION"), {
        mapIdentityValidated: true,
        mapReadCount: 1,
        sizeReadCount: 1,
        boundsReadCount: 1,
        northWestReadCount: 1,
        layerPointConversionCount: 1,
        zoomReadCount: typeof zoomRaw === "undefined" ? 0 : 1,
        devicePixelRatioReadCount: 1,
        zoom
      });
    }

    const ratio = normalizeDevicePixelRatio(ratioRaw);
    const backingWidth = Math.max(1, Math.round(logicalSize.width * ratio));
    const backingHeight = Math.max(1, Math.round(logicalSize.height * ratio));

    const next = updateStatus({
      snapshotStatus: "ready",
      reasonCode: "DRAW_MAP_SNAPSHOT_READY",
      zoom,
      logicalWidth: logicalSize.width,
      logicalHeight: logicalSize.height,
      backingWidth,
      backingHeight,
      devicePixelRatio: ratio,
      bounds: boundsSnapshot,
      northWestCoordinate,
      canvasLayerPosition,
      mapIdentityValidated: true,
      mapReadCount: 1,
      sizeReadCount: 1,
      boundsReadCount: 1,
      northWestReadCount: 1,
      layerPointConversionCount: 1,
      devicePixelRatioReadCount: 1,
      zoomReadCount: typeof zoomRaw === "undefined" ? 0 : 1,
      mapReferenceRetained: false,
      boundsReferenceRetained: false,
      coordinateReferenceRetained: false
    });

    return createSnapshotFromStatus(next);
  }

  return deepFreeze({
    getDrawMapSnapshotStatus,
    getDrawMapSnapshot
  });
}
