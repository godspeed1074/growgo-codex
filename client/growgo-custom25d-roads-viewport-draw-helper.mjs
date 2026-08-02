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

const RESULT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_ROADS_VIEWPORT_DRAW_HELPER_RESULT_001";
const STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM25D_ROADS_VIEWPORT_DRAW_HELPER_STATUS_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_ROADS_VIEWPORT_DRAW_HELPER_SOURCE_LOCK_001";

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
    helperStatus: "idle",
    reasonCode: "ROADS_HELPER_IDLE",
    viewportValidated: false,
    styleConfigValidated: false,
    disposed: false,
    listenerAdded: false,
    retentionWritten: false,
    globalMapReadPerformed: false,
    globalRoadDataReadPerformed: false,
    realRendererInvoked: false,
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

function createResult(overrides) {
  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    operation: "drawRoads",
    outcome: overrides.outcome,
    reasonCode: overrides.reasonCode,
    helperStatus: overrides.helperStatus,
    viewportValidated: overrides.viewportValidated,
    zoom: overrides.zoom,
    roadInputCount: overrides.roadInputCount,
    eligibleRoadCount: overrides.eligibleRoadCount,
    skippedRoadCount: overrides.skippedRoadCount,
    malformedRoadCount: overrides.malformedRoadCount,
    projectionRequestCount: overrides.projectionRequestCount,
    projectionSuccessCount: overrides.projectionSuccessCount,
    projectionFailureCount: overrides.projectionFailureCount,
    drawAttemptCount: overrides.drawAttemptCount,
    completedRoadDrawCount: overrides.completedRoadDrawCount,
    contextValidated: overrides.contextValidated,
    styleConfigValidated: overrides.styleConfigValidated,
    geometryValidated: overrides.geometryValidated,
    contextSaveCount: overrides.contextSaveCount,
    contextRestoreCount: overrides.contextRestoreCount,
    globalMapReadPerformed: false,
    globalRoadDataReadPerformed: false,
    listenerAdded: false,
    retentionWritten: false,
    realRendererInvoked: false,
    realCanvasCreated: false,
    realPaneCreated: false,
    realWebglContextCreated: false,
    realOverlayCreated: false,
    networkRequested: false,
    assetDownloadRequested: false,
    automaticInvocation: false,
    canonicalSafetyFlagSnapshot: canonicalSafetyFlags()
  });
}

function freezePoint(point) {
  return deepFreeze({
    x: Number(point.x),
    y: Number(point.y)
  });
}

function cloneRoadStyles(styles) {
  if (!isObjectLike(styles)) {
    return null;
  }

  const normalized = {};
  for (const [key, style] of Object.entries(styles)) {
    if (!isObjectLike(style)) {
      return null;
    }

    const width = Number(style.width);
    const fill = String(style.fill ?? "");
    const edge = String(style.edge ?? "");
    const highlight = String(style.highlight ?? "");
    const warmCore = String(style.warmCore ?? "");
    const shadow = String(style.shadow ?? "");

    if (
      !Number.isFinite(width) ||
      !fill ||
      !edge ||
      !highlight ||
      !warmCore ||
      !shadow
    ) {
      return null;
    }

    normalized[key] = deepFreeze({
      width,
      fill,
      edge,
      highlight,
      warmCore,
      shadow
    });
  }

  return deepFreeze(normalized);
}

function normalizeZoomSettings(zoomSettings) {
  if (!isObjectLike(zoomSettings)) {
    return null;
  }

  const baseZoom = Number(zoomSettings.baseZoom);
  const boostFactor = Number(zoomSettings.boostFactor);
  if (!Number.isFinite(baseZoom) || !Number.isFinite(boostFactor)) {
    return null;
  }

  return deepFreeze({
    baseZoom,
    boostFactor
  });
}

function normalizeSupportedZoomRange(supportedZoomRange) {
  if (typeof supportedZoomRange === "undefined") {
    return deepFreeze({
      minimum: Number.NEGATIVE_INFINITY,
      maximum: Number.POSITIVE_INFINITY
    });
  }

  if (!isObjectLike(supportedZoomRange)) {
    return null;
  }

  const minimum = Number(
    Object.prototype.hasOwnProperty.call(supportedZoomRange, "minimum")
      ? supportedZoomRange.minimum
      : Number.NEGATIVE_INFINITY
  );
  const maximum = Number(
    Object.prototype.hasOwnProperty.call(supportedZoomRange, "maximum")
      ? supportedZoomRange.maximum
      : Number.POSITIVE_INFINITY
  );

  if (!Number.isFinite(minimum) && minimum !== Number.NEGATIVE_INFINITY) {
    return null;
  }

  if (!Number.isFinite(maximum) && maximum !== Number.POSITIVE_INFINITY) {
    return null;
  }

  if (minimum > maximum) {
    return null;
  }

  return deepFreeze({ minimum, maximum });
}

function normalizeStyleConfig(styleConfig) {
  if (!isObjectLike(styleConfig)) {
    return null;
  }

  const roadStyles = cloneRoadStyles(styleConfig.roadStyles);
  const zoomSettings = normalizeZoomSettings(styleConfig.zoomSettings);
  const supportedZoomRange = normalizeSupportedZoomRange(
    styleConfig.supportedZoomRange
  );

  if (!roadStyles || !zoomSettings || !supportedZoomRange) {
    return null;
  }

  return deepFreeze({
    roadStyles,
    zoomSettings,
    supportedZoomRange
  });
}

export function createGrowGoCustom25DRoadsStyleConfig(overrides = {}) {
  return normalizeStyleConfig({
    roadStyles: overrides.roadStyles ?? {
      primary: {
        width: 12.1,
        fill: "rgba(232, 188, 118, 0.95)",
        edge: "rgba(189, 140, 88, 0.30)",
        highlight: "rgba(255, 244, 216, 0.34)",
        warmCore: "rgba(246, 213, 152, 0.20)",
        shadow: "rgba(118, 93, 61, 0.08)"
      },
      secondary: {
        width: 8.9,
        fill: "rgba(239, 223, 184, 0.94)",
        edge: "rgba(175, 149, 110, 0.20)",
        highlight: "rgba(255, 249, 232, 0.24)",
        warmCore: "rgba(245, 226, 186, 0.14)",
        shadow: "rgba(109, 95, 66, 0.06)"
      },
      residential: {
        width: 6.45,
        fill: "rgba(246, 243, 234, 0.92)",
        edge: "rgba(186, 181, 170, 0.13)",
        highlight: "rgba(255, 255, 255, 0.12)",
        warmCore: "rgba(255, 250, 240, 0.08)",
        shadow: "rgba(112, 109, 103, 0.04)"
      },
      service: {
        width: 4.2,
        fill: "rgba(235, 231, 222, 0.82)",
        edge: "rgba(176, 171, 160, 0.07)",
        highlight: "rgba(255, 255, 255, 0.06)",
        warmCore: "rgba(252, 248, 236, 0.05)",
        shadow: "rgba(101, 98, 92, 0.028)"
      },
      path: {
        width: 2.2,
        fill: "rgba(196, 184, 150, 0.72)",
        edge: "rgba(151, 137, 103, 0.05)",
        highlight: "rgba(245, 233, 199, 0.04)",
        warmCore: "rgba(245, 233, 199, 0.02)",
        shadow: "rgba(96, 83, 60, 0.02)"
      }
    },
    zoomSettings: overrides.zoomSettings ?? {
      baseZoom: 15,
      boostFactor: 0.55
    },
    supportedZoomRange: overrides.supportedZoomRange
  });
}

function validateViewportProjection(viewportProjection) {
  if (!isObjectLike(viewportProjection)) {
    return { ok: false, reasonCode: "VIEWPORT_PROJECTION_MISSING" };
  }

  if (typeof viewportProjection.getZoom !== "function") {
    return { ok: false, reasonCode: "VIEWPORT_GET_ZOOM_MISSING" };
  }

  if (typeof viewportProjection.projectCoordinateToCanvasPoint !== "function") {
    return {
      ok: false,
      reasonCode: "VIEWPORT_PROJECT_COORDINATE_TO_CANVAS_POINT_MISSING"
    };
  }

  return { ok: true, reasonCode: "VIEWPORT_PROJECTION_VALIDATED" };
}

function validateStyleConfig(styleConfig) {
  if (!styleConfig) {
    return { ok: false, reasonCode: "STYLE_CONFIG_MISSING" };
  }

  const normalized = normalizeStyleConfig(styleConfig);
  if (!normalized) {
    return { ok: false, reasonCode: "STYLE_CONFIG_INVALID" };
  }

  return {
    ok: true,
    reasonCode: "STYLE_CONFIG_VALIDATED",
    styleConfig: normalized
  };
}

function validateContext(context) {
  if (!context) {
    return { ok: false, reasonCode: "DRAW_CONTEXT_MISSING" };
  }

  const requiredFunctions = [
    "save",
    "restore",
    "beginPath",
    "moveTo",
    "lineTo",
    "stroke",
    "setLineDash"
  ];

  for (const functionName of requiredFunctions) {
    if (typeof context[functionName] !== "function") {
      return {
        ok: false,
        reasonCode: `DRAW_CONTEXT_${functionName.toUpperCase()}_MISSING`
      };
    }
  }

  return { ok: true, reasonCode: "DRAW_CONTEXT_VALIDATED" };
}

function validateRoadsInput(roads) {
  if (typeof roads === "undefined") {
    return { ok: false, reasonCode: "ROADS_INPUT_MISSING" };
  }

  if (!Array.isArray(roads)) {
    return { ok: false, reasonCode: "ROADS_INPUT_INVALID" };
  }

  return { ok: true, reasonCode: "ROADS_INPUT_VALIDATED" };
}

function validateRoadGeometry(road) {
  if (!isObjectLike(road)) {
    return { ok: false, reasonCode: "ROAD_OBJECT_INVALID" };
  }

  if (Object.prototype.hasOwnProperty.call(road, "geometryType")) {
    const geometryType = String(road.geometryType || "").toLowerCase();
    if (geometryType && geometryType !== "linestring") {
      return { ok: false, reasonCode: "ROAD_GEOMETRY_UNSUPPORTED" };
    }
  }

  if (!Array.isArray(road.coords)) {
    return { ok: false, reasonCode: "ROAD_GEOMETRY_INVALID" };
  }

  if (road.coords.length < 2) {
    return { ok: false, reasonCode: "ROAD_GEOMETRY_INVALID" };
  }

  for (const coordinate of road.coords) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      return { ok: false, reasonCode: "ROAD_GEOMETRY_INVALID" };
    }

    if (Array.isArray(coordinate[0])) {
      return { ok: false, reasonCode: "ROAD_GEOMETRY_UNSUPPORTED" };
    }

    const latitude = Number(coordinate[0]);
    const longitude = Number(coordinate[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, reasonCode: "ROAD_COORDINATE_INVALID" };
    }
  }

  return { ok: true, reasonCode: "ROAD_GEOMETRY_VALIDATED" };
}

function validateZoom(zoom, styleConfig) {
  const numericZoom = Number(zoom);
  if (!Number.isFinite(numericZoom)) {
    return { ok: false, reasonCode: "INVALID_FROZEN_ZOOM" };
  }

  if (
    numericZoom < styleConfig.supportedZoomRange.minimum ||
    numericZoom > styleConfig.supportedZoomRange.maximum
  ) {
    return { ok: false, reasonCode: "UNSUPPORTED_CURRENT_ZOOM" };
  }

  return { ok: true, reasonCode: "FROZEN_ZOOM_VALIDATED", zoom: numericZoom };
}

function normalizeProjectionResult(projection) {
  if (!isObjectLike(projection) || !isObjectLike(projection.canvasPoint)) {
    return null;
  }

  const x = Number(projection.canvasPoint.x);
  const y = Number(projection.canvasPoint.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x,
    y,
    insideSnapshotBounds: projection.insideSnapshotBounds === true
  };
}

function projectRoadPoints(road, viewportProjection, metrics) {
  const points = [];
  let insideViewport = false;

  for (const coordinate of road.coords) {
    metrics.projectionRequestCount += 1;

    const latitude = Number(coordinate[0]);
    const longitude = Number(coordinate[1]);

    let projection;
    try {
      projection = viewportProjection.projectCoordinateToCanvasPoint({
        latitude,
        longitude
      });
    } catch (error) {
      metrics.projectionFailureCount += 1;
      return { ok: false, reasonCode: toReasonCode(error, "PROJECTION_FAILURE") };
    }

    const normalized = normalizeProjectionResult(projection);
    if (!normalized) {
      metrics.projectionFailureCount += 1;
      return { ok: false, reasonCode: "PROJECTION_FAILURE" };
    }

    metrics.projectionSuccessCount += 1;
    if (normalized.insideSnapshotBounds) {
      insideViewport = true;
    }

    points.push(
      freezePoint({
        x: normalized.x,
        y: normalized.y
      })
    );
  }

  return {
    ok: true,
    reasonCode: "ROAD_POINTS_PROJECTED",
    points: deepFreeze(points.slice()),
    insideViewport
  };
}

function getRoadStyleForFeature(highwayType, zoom, styleConfig) {
  const normalized = String(highwayType || "residential").toLowerCase();
  const zoomBoost = Math.max(
    0,
    zoom - styleConfig.zoomSettings.baseZoom
  ) * styleConfig.zoomSettings.boostFactor;

  const styles = styleConfig.roadStyles;
  if (normalized === "primary" || normalized === "primary_link") {
    return {
      ...styles.primary,
      width: styles.primary.width + zoomBoost
    };
  }

  if (
    normalized === "secondary" ||
    normalized === "secondary_link" ||
    normalized === "tertiary" ||
    normalized === "tertiary_link"
  ) {
    return {
      ...styles.secondary,
      width: styles.secondary.width + zoomBoost * 0.8
    };
  }

  if (normalized === "service" || normalized === "road") {
    return {
      ...styles.service,
      width: styles.service.width + zoomBoost * 0.44
    };
  }

  if (
    ["track", "path", "footway", "cycleway", "pedestrian"].includes(
      normalized
    )
  ) {
    return {
      ...styles.path,
      width: styles.path.width + zoomBoost * 0.18
    };
  }

  return {
    ...styles.residential,
    width: styles.residential.width + zoomBoost * 0.62
  };
}

function createInstrumentedContext(context, metrics) {
  return new Proxy(context, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") {
        return value;
      }

      if (property === "save") {
        return function instrumentedSave(...args) {
          metrics.contextSaveCount += 1;
          return value.apply(this, args);
        };
      }

      if (property === "restore") {
        return function instrumentedRestore(...args) {
          metrics.contextRestoreCount += 1;
          return value.apply(this, args);
        };
      }

      return function passthrough(...args) {
        return value.apply(this, args);
      };
    }
  });
}

function drawCustom25DRoadPath(context, points, dashPattern) {
  if (!Array.isArray(points) || points.length < 2) return;

  context.setLineDash(dashPattern || []);
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i += 1) {
    context.lineTo(points[i].x, points[i].y);
  }

  context.stroke();
}

function drawRoadShadow(context, points, style) {
  context.save();
  context.strokeStyle = style.shadow;
  context.lineWidth = style.width + 1.85;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = style.shadow;
  context.shadowBlur = Math.max(1.4, style.width * 0.24);
  context.shadowOffsetY = Math.max(0.26, style.width * 0.038);
  drawCustom25DRoadPath(context, points, style.dash || null);
  context.restore();
}

function drawCustom25DRoad(context, points, style) {
  drawRoadShadow(context, points, style);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  context.strokeStyle = style.edge;
  context.lineWidth = style.width + 0.3;
  drawCustom25DRoadPath(context, points, style.dash || null);

  context.strokeStyle = style.fill;
  context.lineWidth = style.width;
  drawCustom25DRoadPath(context, points, style.dash || null);

  if (style.warmCore) {
    context.strokeStyle = style.warmCore;
    context.lineWidth = Math.max(0.68, style.width * 0.31);
    drawCustom25DRoadPath(context, points, null);
  }

  context.strokeStyle = style.highlight;
  context.lineWidth = Math.max(0.62, style.width * 0.12);
  drawCustom25DRoadPath(context, points, null);
  context.restore();
}

function buildBaseMetrics({
  helperStatus,
  viewportValidated,
  zoom,
  roadInputCount = 0,
  eligibleRoadCount = 0,
  skippedRoadCount = 0,
  malformedRoadCount = 0,
  projectionRequestCount = 0,
  projectionSuccessCount = 0,
  projectionFailureCount = 0,
  drawAttemptCount = 0,
  completedRoadDrawCount = 0,
  contextValidated = false,
  styleConfigValidated = false,
  geometryValidated = false,
  contextSaveCount = 0,
  contextRestoreCount = 0
}) {
  return {
    helperStatus,
    viewportValidated,
    zoom,
    roadInputCount,
    eligibleRoadCount,
    skippedRoadCount,
    malformedRoadCount,
    projectionRequestCount,
    projectionSuccessCount,
    projectionFailureCount,
    drawAttemptCount,
    completedRoadDrawCount,
    contextValidated,
    styleConfigValidated,
    geometryValidated,
    contextSaveCount,
    contextRestoreCount
  };
}

export function inspectGrowGoCustom25DRoadsViewportDrawHelperSourceLock({
  scriptSource
} = {}) {
  if (typeof scriptSource !== "string" || !scriptSource.trim()) {
    return deepFreeze({
      schemaId: SOURCE_LOCK_SCHEMA_ID,
      ok: false,
      reasonCode: "SCRIPT_SOURCE_REQUIRED",
      classification: "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
    });
  }

  const checks = deepFreeze({
    drawCustom25DRoadsFound: scriptSource.includes(
      "function drawCustom25DRoads(ctx, bounds, topLeft) {"
    ),
    roadSourceFound: scriptSource.includes(
      "if (!Array.isArray(custom25DRoadFeatures) || !custom25DRoadFeatures.length) return;"
    ),
    zoomReadFound: scriptSource.includes("const zoom = map.getZoom();"),
    viewportFilterFound: scriptSource.includes(
      "const intersectsBounds = road.coords.some(([lat, lng]) => bounds.contains([lat, lng]));"
    ),
    projectionFound: scriptSource.includes(
      "const points = projectCustom25DRoadPoints(road.coords, topLeft);"
    ),
    latLngToLayerPointFound: scriptSource.includes(
      "const point = map.latLngToLayerPoint([lat, lng]);"
    ),
    styleFanoutFound: scriptSource.includes(
      "const style = getRoadStyleForFeature(road.highway, zoom);"
    ) && scriptSource.includes("drawCustom25DRoad(ctx, points, style);")
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "SOURCE_LOCK_CONFIRMED" : "SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
      : "BLOCKED_BY_ROAD_GEOMETRY_CONTRACT_GAP",
    roadDataSource: "custom25DRoadFeatures",
    roadSchema: deepFreeze([
      "road.highway",
      "road.coords"
    ]),
    geometryFormat: "linestring coords -> [latitude, longitude] tuples",
    zoomThresholds: deepFreeze({
      minimum: Number.NEGATIVE_INFINITY,
      maximum: Number.POSITIVE_INFINITY
    }),
    filteringRules: deepFreeze([
      "coords length >= 2",
      "at least one coordinate inside bounds.contains(...)",
      "projected point count >= 2"
    ]),
    supportedRoadTypes: deepFreeze([
      "primary",
      "primary_link",
      "secondary",
      "secondary_link",
      "tertiary",
      "tertiary_link",
      "service",
      "road",
      "track",
      "path",
      "footway",
      "cycleway",
      "pedestrian",
      "residential (fallback)"
    ]),
    directGlobalReads: deepFreeze([
      "custom25DRoadFeatures",
      "map.getZoom()",
      "bounds.contains([lat, lng])",
      "projectCustom25DRoadPoints(road.coords, topLeft)",
      "map.latLngToLayerPoint([lat, lng])"
    ])
  });
}

export function createGrowGoCustom25DRoadsViewportDrawHelper({
  viewportProjection,
  styleConfig
} = {}) {
  let mutableViewportProjection = viewportProjection;
  let mutableStyleConfig = styleConfig;
  let currentStatus = createInitialStatus();

  const viewportValidation = validateViewportProjection(mutableViewportProjection);
  if (viewportValidation.ok) {
    currentStatus = freezeStatus({
      ...currentStatus,
      helperStatus: "ready",
      reasonCode: viewportValidation.reasonCode,
      viewportValidated: true
    });
  } else {
    currentStatus = freezeStatus({
      ...currentStatus,
      helperStatus: "failed_closed",
      reasonCode: viewportValidation.reasonCode
    });
  }

  const styleValidation = validateStyleConfig(mutableStyleConfig);
  if (styleValidation.ok) {
    mutableStyleConfig = styleValidation.styleConfig;
    currentStatus = freezeStatus({
      ...currentStatus,
      helperStatus:
        currentStatus.helperStatus === "failed_closed" ? "failed_closed" : "ready",
      reasonCode:
        currentStatus.helperStatus === "failed_closed"
          ? currentStatus.reasonCode
          : styleValidation.reasonCode,
      styleConfigValidated: true
    });
  } else {
    currentStatus = freezeStatus({
      ...currentStatus,
      helperStatus: "failed_closed",
      reasonCode:
        currentStatus.helperStatus === "failed_closed"
          ? currentStatus.reasonCode
          : styleValidation.reasonCode
    });
  }

  function failResult(reasonCode, metrics = {}) {
    return createResult({
      outcome: "blocked",
      reasonCode,
      ...buildBaseMetrics({
        helperStatus: currentStatus.helperStatus,
        viewportValidated: currentStatus.viewportValidated,
        zoom: metrics.zoom ?? null,
        roadInputCount: metrics.roadInputCount ?? 0,
        eligibleRoadCount: metrics.eligibleRoadCount ?? 0,
        skippedRoadCount: metrics.skippedRoadCount ?? 0,
        malformedRoadCount: metrics.malformedRoadCount ?? 0,
        projectionRequestCount: metrics.projectionRequestCount ?? 0,
        projectionSuccessCount: metrics.projectionSuccessCount ?? 0,
        projectionFailureCount: metrics.projectionFailureCount ?? 0,
        drawAttemptCount: metrics.drawAttemptCount ?? 0,
        completedRoadDrawCount: metrics.completedRoadDrawCount ?? 0,
        contextValidated: metrics.contextValidated ?? false,
        styleConfigValidated:
          metrics.styleConfigValidated ?? currentStatus.styleConfigValidated,
        geometryValidated: metrics.geometryValidated ?? false,
        contextSaveCount: metrics.contextSaveCount ?? 0,
        contextRestoreCount: metrics.contextRestoreCount ?? 0
      })
    });
  }

  return deepFreeze({
    getHelperStatus() {
      return currentStatus;
    },
    dispose() {
      mutableViewportProjection = null;
      mutableStyleConfig = null;
      currentStatus = freezeStatus({
        ...currentStatus,
        helperStatus: "disposed",
        reasonCode: "HELPER_DISPOSED",
        disposed: true
      });
      return currentStatus;
    },
    drawRoads({ context, roads } = {}) {
      if (currentStatus.disposed === true) {
        return failResult("HELPER_DISPOSED");
      }

      const viewportCheck = validateViewportProjection(mutableViewportProjection);
      if (!viewportCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: viewportCheck.reasonCode,
          viewportValidated: false
        });
        return failResult(viewportCheck.reasonCode);
      }

      const styleCheck = validateStyleConfig(mutableStyleConfig);
      if (!styleCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: styleCheck.reasonCode,
          styleConfigValidated: false
        });
        return failResult(styleCheck.reasonCode);
      }

      let frozenZoom;
      try {
        frozenZoom = mutableViewportProjection.getZoom();
      } catch (error) {
        const reasonCode = toReasonCode(error, "INVALID_FROZEN_ZOOM");
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode,
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(reasonCode, { styleConfigValidated: true });
      }

      const zoomCheck = validateZoom(frozenZoom, styleCheck.styleConfig);
      if (!zoomCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: zoomCheck.reasonCode,
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(zoomCheck.reasonCode, {
          zoom: null,
          styleConfigValidated: true
        });
      }

      const contextCheck = validateContext(context);
      if (!contextCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: contextCheck.reasonCode,
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(contextCheck.reasonCode, {
          zoom: zoomCheck.zoom,
          contextValidated: false,
          styleConfigValidated: true
        });
      }

      const roadsCheck = validateRoadsInput(roads);
      if (!roadsCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: roadsCheck.reasonCode,
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(roadsCheck.reasonCode, {
          zoom: zoomCheck.zoom,
          contextValidated: true,
          styleConfigValidated: true
        });
      }

      const metrics = buildBaseMetrics({
        helperStatus: "ready",
        viewportValidated: true,
        zoom: zoomCheck.zoom,
        roadInputCount: roads.length,
        eligibleRoadCount: 0,
        skippedRoadCount: 0,
        malformedRoadCount: 0,
        projectionRequestCount: 0,
        projectionSuccessCount: 0,
        projectionFailureCount: 0,
        drawAttemptCount: 0,
        completedRoadDrawCount: 0,
        contextValidated: true,
        styleConfigValidated: true,
        geometryValidated: true,
        contextSaveCount: 0,
        contextRestoreCount: 0
      });

      const instrumentedContext = createInstrumentedContext(context, metrics);

      for (const road of roads) {
        const geometryCheck = validateRoadGeometry(road);
        if (!geometryCheck.ok) {
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode: geometryCheck.reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          metrics.malformedRoadCount += 1;
          metrics.geometryValidated = false;
          return failResult(geometryCheck.reasonCode, metrics);
        }

        const projection = projectRoadPoints(
          road,
          mutableViewportProjection,
          metrics
        );
        if (!projection.ok) {
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode: projection.reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          return failResult(projection.reasonCode, metrics);
        }

        if (!projection.insideViewport || projection.points.length < 2) {
          metrics.skippedRoadCount += 1;
          continue;
        }

        metrics.eligibleRoadCount += 1;
        metrics.drawAttemptCount += 1;

        try {
          const style = getRoadStyleForFeature(
            road.highway,
            zoomCheck.zoom,
            styleCheck.styleConfig
          );
          drawCustom25DRoad(instrumentedContext, projection.points, style);
        } catch (error) {
          const reasonCode = toReasonCode(error, "ROAD_DRAW_FAILED");
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          return failResult(reasonCode, metrics);
        }

        metrics.completedRoadDrawCount += 1;
      }

      currentStatus = freezeStatus({
        ...currentStatus,
        helperStatus: "ready",
        reasonCode: "ROADS_DRAW_READY",
        viewportValidated: true,
        styleConfigValidated: true
      });

      return createResult({
        outcome: "success",
        reasonCode: "ROADS_DRAW_READY",
        ...metrics
      });
    }
  });
}
