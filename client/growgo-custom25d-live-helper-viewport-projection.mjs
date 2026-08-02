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
  "GROWGO_CUSTOM25D_LIVE_HELPER_VIEWPORT_PROJECTION_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_HELPER_VIEWPORT_PROJECTION_RESULT_001";
const SNAPSHOT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_DRAW_MAP_SNAPSHOT_RESULT_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LIVE_HELPER_VIEWPORT_PROJECTION_SOURCE_LOCK_001";

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

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function validateBounds(bounds) {
  if (!isObjectLike(bounds)) {
    return null;
  }

  const north = Number(bounds.north);
  const south = Number(bounds.south);
  const east = Number(bounds.east);
  const west = Number(bounds.west);

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

function validateCanvasLayerPosition(canvasLayerPosition) {
  if (!isObjectLike(canvasLayerPosition)) {
    return null;
  }

  const x = Number(canvasLayerPosition.x);
  const y = Number(canvasLayerPosition.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return deepFreeze({ x, y });
}

function validateSnapshot(snapshot) {
  if (!isObjectLike(snapshot)) {
    return { ok: false, reasonCode: "SNAPSHOT_MISSING", snapshotSchemaId: null };
  }

  if (snapshot.schemaId !== SNAPSHOT_SCHEMA_ID) {
    return {
      ok: false,
      reasonCode: "INVALID_SNAPSHOT_SCHEMA",
      snapshotSchemaId: snapshot.schemaId ?? null
    };
  }

  if (snapshot.snapshotStatus !== "ready") {
    return {
      ok: false,
      reasonCode: "SNAPSHOT_NOT_READY",
      snapshotSchemaId: snapshot.schemaId
    };
  }

  if (snapshot.mapIdentityValidated !== true) {
    return {
      ok: false,
      reasonCode: "MAP_IDENTITY_NOT_VALIDATED",
      snapshotSchemaId: snapshot.schemaId
    };
  }

  if (
    snapshot.zoom === null ||
    typeof snapshot.zoom === "undefined" ||
    (typeof snapshot.zoom === "string" && !snapshot.zoom.trim())
  ) {
    return {
      ok: false,
      reasonCode: "INVALID_SNAPSHOT_ZOOM",
      snapshotSchemaId: snapshot.schemaId
    };
  }

  const zoom = Number(snapshot.zoom);
  if (!Number.isFinite(zoom)) {
    return {
      ok: false,
      reasonCode: "INVALID_SNAPSHOT_ZOOM",
      snapshotSchemaId: snapshot.schemaId
    };
  }

  const logicalWidth = Number(snapshot.logicalWidth);
  const logicalHeight = Number(snapshot.logicalHeight);
  if (
    !Number.isFinite(logicalWidth) ||
    !Number.isFinite(logicalHeight) ||
    logicalWidth <= 0 ||
    logicalHeight <= 0
  ) {
    return {
      ok: false,
      reasonCode: "INVALID_LOGICAL_DIMENSIONS",
      snapshotSchemaId: snapshot.schemaId
    };
  }

  const canvasLayerPosition = validateCanvasLayerPosition(
    snapshot.canvasLayerPosition
  );
  if (!canvasLayerPosition) {
    return {
      ok: false,
      reasonCode: "INVALID_CANVAS_LAYER_POSITION",
      snapshotSchemaId: snapshot.schemaId
    };
  }

  const bounds = validateBounds(snapshot.bounds);
  if (!bounds) {
    return {
      ok: false,
      reasonCode: "INVALID_SNAPSHOT_BOUNDS",
      snapshotSchemaId: snapshot.schemaId
    };
  }

  return {
    ok: true,
    reasonCode: "SNAPSHOT_VALIDATED",
    snapshotSchemaId: snapshot.schemaId,
    zoom,
    logicalWidth,
    logicalHeight,
    canvasLayerPosition,
    bounds
  };
}

function createInitialStatus() {
  return {
    schemaId: STATUS_SCHEMA_ID,
    seamStatus: "idle",
    reasonCode: "VIEWPORT_IDLE",
    snapshotValidated: false,
    snapshotSchemaId: null,
    zoom: null,
    logicalWidth: null,
    logicalHeight: null,
    canvasLayerPosition: null,
    bounds: null,
    projectorAvailable: false,
    projectionRequestCount: 0,
    projectionSuccessCount: 0,
    projectionFailureCount: 0,
    lastProjectionReasonCode: null,
    mapReferenceRetained: false,
    snapshotReferenceRetained: false,
    coordinateReferenceRetained: false,
    projectedPointReferenceRetained: false,
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

function createProjectionResult({
  projectionStatus,
  reasonCode,
  latitude = null,
  longitude = null,
  layerPoint = null,
  canvasPoint = null,
  zoom,
  insideSnapshotBounds,
  projectorInvocationCount,
  seamStatus,
  safetySnapshot
}) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    projectionStatus,
    reasonCode,
    latitude,
    longitude,
    layerPoint,
    canvasPoint,
    zoom,
    insideSnapshotBounds,
    projectorInvocationCount,
    mapReadPerformed: false,
    drawRequested: false,
    canvasMutationRequested: false,
    listenerAdded: false,
    seamStatus,
    canonicalSafetyFlagSnapshot: safetySnapshot
  });
}

function buildValidatedPoint(point) {
  if (!isObjectLike(point)) {
    return null;
  }

  const x = Number(point.x);
  const y = Number(point.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return deepFreeze({ x, y });
}

function isInsideBounds(bounds, latitude, longitude) {
  return (
    latitude <= bounds.north &&
    latitude >= bounds.south &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
}

export function inspectGrowGoCustom25DHelperViewportProjectionSourceLock({
  scriptSource
} = {}) {
  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_PROJECTION_IDENTITY_GAP"
    });
  }

  const checks = deepFreeze({
    zonesFound: scriptSource.includes("function drawCustom25DZones(ctx, bounds, topLeft)"),
    buildingsFound: scriptSource.includes(
      "function drawCustom25DBuildings(ctx, bounds, topLeft)"
    ),
    roadsFound: scriptSource.includes("function drawCustom25DRoads(ctx, bounds, topLeft)"),
    treesFound: scriptSource.includes("function drawCustom25DTrees(ctx, size, bounds)"),
    landmarksFound: scriptSource.includes(
      "function renderCustomLandmarkLayer(ctx, bounds)"
    ),
    zoomReadFound: scriptSource.includes("const zoom = map.getZoom();"),
    helperProjectionFound: scriptSource.includes(
      "const point = map.latLngToLayerPoint([lat, lng]);"
    ),
    topLeftSubtractionFound:
      scriptSource.includes("x: point.x - topLeft.x") &&
      scriptSource.includes("y: point.y - topLeft.y"),
    treeNorthWestReprojectionFound: scriptSource.includes(
      "projectCustom25DZonePoints(feature.coords, map.latLngToLayerPoint(bounds.getNorthWest()))"
    ),
    landmarkRawLayerProjectionFound: scriptSource.includes(
      "const point = map.latLngToLayerPoint([marker.lat, marker.lng]);"
    )
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok
      ? "HELPER_VIEWPORT_PROJECTION_SOURCE_LOCK_CONFIRMED"
      : "HELPER_VIEWPORT_PROJECTION_SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "BLOCKED_BY_FEATURE_DATA_GLOBAL_DEPENDENCIES"
      : "BLOCKED_BY_PROJECTION_IDENTITY_GAP",
    helperDependencyTable: ok
      ? deepFreeze([
          {
            helper: "drawCustom25DZones",
            globalMapReads: ["map.getZoom()", "map.latLngToLayerPoint(...)"],
            zoomUsed: true,
            coordinateProjections: "polygon coordinate projections",
            topLeftSubtraction: "inside helper projection function",
            outsideBoundsPolicy: "feature filtered by bounds.contains before projection",
            additionalViewportDependencies: ["bounds", "topLeft"],
            classification: "READY_FOR_VIEWPORT_PROJECTION_INJECTION"
          },
          {
            helper: "drawCustom25DBuildings",
            globalMapReads: ["map.getZoom()", "map.latLngToLayerPoint(...)"],
            zoomUsed: true,
            coordinateProjections: "building polygon projections",
            topLeftSubtraction: "inside helper projection function",
            outsideBoundsPolicy: "feature filtered by bounds.contains before projection",
            additionalViewportDependencies: ["bounds", "topLeft"],
            classification: "READY_FOR_VIEWPORT_PROJECTION_INJECTION"
          },
          {
            helper: "drawCustom25DRoads",
            globalMapReads: ["map.getZoom()", "map.latLngToLayerPoint(...)"],
            zoomUsed: true,
            coordinateProjections: "polyline coordinate projections",
            topLeftSubtraction: "inside helper projection function",
            outsideBoundsPolicy: "feature filtered by bounds.contains before projection",
            additionalViewportDependencies: ["bounds", "topLeft"],
            classification: "READY_FOR_VIEWPORT_PROJECTION_INJECTION"
          },
          {
            helper: "drawCustom25DTrees",
            globalMapReads: [
              "map.getZoom()",
              "map.latLngToLayerPoint(bounds.getNorthWest())",
              "map.latLngToLayerPoint(...)"
            ],
            zoomUsed: true,
            coordinateProjections: "park polygon coordinate projections",
            topLeftSubtraction: "inside helper projection function after north-west re-lookup",
            outsideBoundsPolicy: "feature filtered by bounds.contains before projection",
            additionalViewportDependencies: ["bounds", "topLeft"],
            classification: "READY_FOR_VIEWPORT_PROJECTION_INJECTION"
          },
          {
            helper: "renderCustomLandmarkLayer",
            globalMapReads: ["map.latLngToLayerPoint(...)"],
            zoomUsed: false,
            coordinateProjections: "marker point projections",
            topLeftSubtraction: "not performed in current helper",
            outsideBoundsPolicy: "marker filtered by bounds.contains before draw",
            additionalViewportDependencies: ["bounds", "canvas-local conversion"],
            classification: "REQUIRES_ADDITIONAL_VIEWPORT_INPUT"
          }
        ])
      : null,
    boundsPolicy: ok
      ? "helpers mostly pre-filter features by bounds membership before projection; projection seam should report insideSnapshotBounds without blocking mere out-of-bounds coordinates"
      : null,
    projectionFormula: ok
      ? "canvasLocal = projectedLayerPoint - frozenSnapshot.canvasLayerPosition"
      : null,
    viewportLifetime: ok
      ? "viewport values stay frozen for the seam instance lifetime; create a new snapshot and seam for a new viewport"
      : null
  });
}

export function createGrowGoCustom25DHelperViewportProjection({
  mapSnapshot,
  coordinateProjector
} = {}) {
  const validatedSnapshot = validateSnapshot(mapSnapshot);
  const initialStatus = createInitialStatus();

  let status = freezeStatus({
    ...initialStatus,
    seamStatus: validatedSnapshot.ok ? "ready" : "failed_closed",
    reasonCode: validatedSnapshot.reasonCode,
    snapshotValidated: validatedSnapshot.ok,
    snapshotSchemaId: validatedSnapshot.snapshotSchemaId,
    zoom: validatedSnapshot.ok ? validatedSnapshot.zoom : null,
    logicalWidth: validatedSnapshot.ok ? validatedSnapshot.logicalWidth : null,
    logicalHeight: validatedSnapshot.ok ? validatedSnapshot.logicalHeight : null,
    canvasLayerPosition: validatedSnapshot.ok
      ? validatedSnapshot.canvasLayerPosition
      : null,
    bounds: validatedSnapshot.ok ? validatedSnapshot.bounds : null,
    projectorAvailable: typeof coordinateProjector === "function"
  });

  function updateStatus(patch) {
    status = freezeStatus({
      ...status,
      ...patch,
      canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
    });
    return status;
  }

  function getViewportStatus() {
    return status;
  }

  function getZoom() {
    return status.seamStatus === "ready" ? status.zoom : null;
  }

  function blockedResult(reasonCode, patch = {}, latitude = null, longitude = null) {
    const next = updateStatus({
      seamStatus: "failed_closed",
      reasonCode,
      projectionRequestCount: status.projectionRequestCount + 1,
      projectionFailureCount: status.projectionFailureCount + 1,
      lastProjectionReasonCode: reasonCode,
      mapReferenceRetained: false,
      snapshotReferenceRetained: false,
      coordinateReferenceRetained: false,
      projectedPointReferenceRetained: false,
      ...patch
    });

    return createProjectionResult({
      projectionStatus: "failed_closed",
      reasonCode,
      latitude,
      longitude,
      layerPoint: null,
      canvasPoint: null,
      zoom: next.zoom,
      insideSnapshotBounds: null,
      projectorInvocationCount: 0,
      seamStatus: next.seamStatus,
      safetySnapshot: next.canonicalSafetyFlagSnapshot
    });
  }

  function projectCoordinate({
    latitude,
    longitude
  } = {}) {
    if (!status.snapshotValidated) {
      return blockedResult(status.reasonCode || "SNAPSHOT_NOT_READY");
    }

    if (typeof coordinateProjector !== "function") {
      return blockedResult("PROJECTOR_MISSING", { projectorAvailable: false });
    }

    if (!isFiniteNumber(latitude)) {
      return blockedResult("INVALID_LATITUDE", {}, latitude ?? null, longitude ?? null);
    }

    if (!isFiniteNumber(longitude)) {
      return blockedResult("INVALID_LONGITUDE", {}, latitude ?? null, longitude ?? null);
    }

    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);
    const insideSnapshotBounds = isInsideBounds(
      status.bounds,
      numericLatitude,
      numericLongitude
    );

    let projectedPointRaw;
    try {
      projectedPointRaw = coordinateProjector({
        latitude: numericLatitude,
        longitude: numericLongitude
      });
    } catch (error) {
      const reasonCode = toReasonCode(error, "PROJECTOR_EXCEPTION");
      const next = updateStatus({
        projectionRequestCount: status.projectionRequestCount + 1,
        projectionFailureCount: status.projectionFailureCount + 1,
        lastProjectionReasonCode: reasonCode,
        mapReferenceRetained: false,
        snapshotReferenceRetained: false,
        coordinateReferenceRetained: false,
        projectedPointReferenceRetained: false
      });

      return createProjectionResult({
        projectionStatus: "failed_closed",
        reasonCode,
        latitude: numericLatitude,
        longitude: numericLongitude,
        layerPoint: null,
        canvasPoint: null,
        zoom: next.zoom,
        insideSnapshotBounds,
        projectorInvocationCount: 1,
        seamStatus: next.seamStatus,
        safetySnapshot: next.canonicalSafetyFlagSnapshot
      });
    }

    const layerPoint = buildValidatedPoint(projectedPointRaw);
    if (!layerPoint) {
      const reasonCode = "INVALID_PROJECTED_POINT";
      const next = updateStatus({
        projectionRequestCount: status.projectionRequestCount + 1,
        projectionFailureCount: status.projectionFailureCount + 1,
        lastProjectionReasonCode: reasonCode,
        mapReferenceRetained: false,
        snapshotReferenceRetained: false,
        coordinateReferenceRetained: false,
        projectedPointReferenceRetained: false
      });

      return createProjectionResult({
        projectionStatus: "failed_closed",
        reasonCode,
        latitude: numericLatitude,
        longitude: numericLongitude,
        layerPoint: null,
        canvasPoint: null,
        zoom: next.zoom,
        insideSnapshotBounds,
        projectorInvocationCount: 1,
        seamStatus: next.seamStatus,
        safetySnapshot: next.canonicalSafetyFlagSnapshot
      });
    }

    const canvasPoint = deepFreeze({
      x: layerPoint.x - status.canvasLayerPosition.x,
      y: layerPoint.y - status.canvasLayerPosition.y
    });

    const next = updateStatus({
      projectionRequestCount: status.projectionRequestCount + 1,
      projectionSuccessCount: status.projectionSuccessCount + 1,
      lastProjectionReasonCode: "PROJECTION_READY",
      mapReferenceRetained: false,
      snapshotReferenceRetained: false,
      coordinateReferenceRetained: false,
      projectedPointReferenceRetained: false
    });

    return createProjectionResult({
      projectionStatus: "ready",
      reasonCode: "PROJECTION_READY",
      latitude: numericLatitude,
      longitude: numericLongitude,
      layerPoint,
      canvasPoint,
      zoom: next.zoom,
      insideSnapshotBounds,
      projectorInvocationCount: 1,
      seamStatus: next.seamStatus,
      safetySnapshot: next.canonicalSafetyFlagSnapshot
    });
  }

  function projectCoordinateToLayerPoint(args = {}) {
    return projectCoordinate(args);
  }

  function projectCoordinateToCanvasPoint(args = {}) {
    return projectCoordinate(args);
  }

  return deepFreeze({
    getViewportStatus,
    getZoom,
    projectCoordinateToLayerPoint,
    projectCoordinateToCanvasPoint
  });
}
