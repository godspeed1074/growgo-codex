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
  "GROWGO_CUSTOM25D_ZONES_VIEWPORT_DRAW_HELPER_RESULT_001";
const STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM25D_ZONES_VIEWPORT_DRAW_HELPER_STATUS_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_ZONES_VIEWPORT_DRAW_HELPER_SOURCE_LOCK_001";

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

function createInitialStatus() {
  return {
    schemaId: STATUS_SCHEMA_ID,
    helperStatus: "idle",
    reasonCode: "ZONES_HELPER_IDLE",
    viewportValidated: false,
    styleConfigValidated: false,
    disposed: false,
    listenerAdded: false,
    retentionWritten: false,
    globalMapReadPerformed: false,
    globalZoneDataReadPerformed: false,
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
    operation: "drawZones",
    outcome: overrides.outcome,
    reasonCode: overrides.reasonCode,
    helperStatus: overrides.helperStatus,
    viewportValidated: overrides.viewportValidated,
    zoom: overrides.zoom,
    zoneInputCount: overrides.zoneInputCount,
    eligibleZoneCount: overrides.eligibleZoneCount,
    skippedZoneCount: overrides.skippedZoneCount,
    projectionRequestCount: overrides.projectionRequestCount,
    projectionSuccessCount: overrides.projectionSuccessCount,
    projectionFailureCount: overrides.projectionFailureCount,
    drawAttemptCount: overrides.drawAttemptCount,
    completedZoneDrawCount: overrides.completedZoneDrawCount,
    contextValidated: overrides.contextValidated,
    styleConfigValidated: overrides.styleConfigValidated,
    globalMapReadPerformed: false,
    globalZoneDataReadPerformed: false,
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

function clonePriorityMap(priority) {
  const normalized = {};
  for (const [key, value] of Object.entries(priority)) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return null;
    }
    normalized[key] = numeric;
  }
  return deepFreeze(normalized);
}

function cloneZoneStyles(styles) {
  const normalized = {};
  for (const [zoneType, style] of Object.entries(styles)) {
    if (!isObjectLike(style)) {
      return null;
    }

    const fill = String(style.fill ?? "");
    const edge = String(style.edge ?? "");
    const inner = String(style.inner ?? "");
    if (!fill || !edge || !inner) {
      return null;
    }

    normalized[zoneType] = deepFreeze({
      fill,
      edge,
      inner
    });
  }
  return deepFreeze(normalized);
}

function normalizeZoomThresholds(thresholds) {
  if (!isObjectLike(thresholds)) {
    return null;
  }

  const low = Number(thresholds.low);
  const medium = Number(thresholds.medium);
  const high = Number(thresholds.high);

  if (!Number.isFinite(low) || !Number.isFinite(medium) || !Number.isFinite(high)) {
    return null;
  }

  return deepFreeze({ low, medium, high });
}

function normalizeLineWidths(lineWidths) {
  if (!isObjectLike(lineWidths)) {
    return null;
  }

  const low = Number(lineWidths.low);
  const medium = Number(lineWidths.medium);
  const high = Number(lineWidths.high);

  if (!Number.isFinite(low) || !Number.isFinite(medium) || !Number.isFinite(high)) {
    return null;
  }

  return deepFreeze({ low, medium, high });
}

function normalizeDetailColors(detailColors) {
  if (!isObjectLike(detailColors)) {
    return null;
  }

  const normalized = {};
  for (const [key, value] of Object.entries(detailColors)) {
    const text = String(value ?? "");
    if (!text) {
      return null;
    }
    normalized[key] = text;
  }
  return deepFreeze(normalized);
}

function normalizeZoomSupport(supportedZoomRange) {
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

export function createGrowGoCustom25DZonesStyleConfig(overrides = {}) {
  const zonePriority = clonePriorityMap(
    overrides.zonePriority ?? {
      grass: 1,
      sports: 2,
      park: 3,
      wetland: 4,
      beach: 5,
      water: 6
    }
  );
  const zoneStyles = cloneZoneStyles(
    overrides.zoneStyles ?? {
      park: {
        fill: "rgba(125, 198, 108, 0.40)",
        edge: "rgba(76, 144, 68, 0.32)",
        inner: "rgba(196, 233, 173, 0.11)"
      },
      grass: {
        fill: "rgba(154, 203, 130, 0.22)",
        edge: "rgba(108, 156, 89, 0.12)",
        inner: "rgba(201, 228, 178, 0.04)"
      },
      water: {
        fill: "rgba(92, 181, 221, 0.37)",
        edge: "rgba(56, 132, 192, 0.34)",
        inner: "rgba(204, 239, 251, 0.11)"
      },
      beach: {
        fill: "rgba(239, 221, 165, 0.34)",
        edge: "rgba(195, 171, 111, 0.22)",
        inner: "rgba(251, 239, 206, 0.11)"
      },
      wetland: {
        fill: "rgba(121, 176, 152, 0.24)",
        edge: "rgba(82, 133, 112, 0.18)",
        inner: "rgba(174, 214, 193, 0.06)"
      },
      sports: {
        fill: "rgba(122, 196, 114, 0.22)",
        edge: "rgba(78, 142, 80, 0.14)",
        inner: "rgba(207, 236, 192, 0.06)"
      }
    }
  );
  const detailThresholds = normalizeZoomThresholds(
    overrides.detailThresholds ?? {
      low: 15,
      medium: 16.5,
      high: 18
    }
  );
  const lineWidths = normalizeLineWidths(
    overrides.lineWidths ?? {
      low: 1.1,
      medium: 1.6,
      high: 2.2
    }
  );
  const detailColors = normalizeDetailColors(
    overrides.detailColors ?? {
      waterStroke: "rgba(255, 255, 255, 0.24)",
      beachFill: "rgba(255, 246, 214, 0.24)",
      parkStroke: "rgba(248, 240, 204, 0.24)",
      sportsStroke: "rgba(255, 255, 255, 0.28)",
      wetlandStroke: "rgba(89, 134, 104, 0.28)"
    }
  );
  const supportedZoomRange = normalizeZoomSupport(
    overrides.supportedZoomRange
  );

  if (
    !zonePriority ||
    !zoneStyles ||
    !detailThresholds ||
    !lineWidths ||
    !detailColors ||
    !supportedZoomRange
  ) {
    return null;
  }

  return deepFreeze({
    zonePriority,
    zoneStyles,
    detailThresholds,
    lineWidths,
    detailColors,
    supportedZoomRange
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

  const normalized = createGrowGoCustom25DZonesStyleConfig(styleConfig);
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

  const requiredMethods = [
    "save",
    "restore",
    "beginPath",
    "moveTo",
    "lineTo",
    "closePath",
    "fill",
    "stroke",
    "clip",
    "fillRect",
    "strokeRect",
    "quadraticCurveTo"
  ];

  for (const methodName of requiredMethods) {
    if (typeof context[methodName] !== "function") {
      return {
        ok: false,
        reasonCode: "DRAW_CONTEXT_INVALID",
        missingMethod: methodName
      };
    }
  }

  return { ok: true, reasonCode: "DRAW_CONTEXT_VALIDATED" };
}

function validateZonesInput(zones) {
  if (typeof zones === "undefined" || zones === null) {
    return { ok: false, reasonCode: "ZONES_INPUT_MISSING" };
  }

  if (!Array.isArray(zones)) {
    return { ok: false, reasonCode: "ZONES_INPUT_INVALID" };
  }

  return { ok: true, reasonCode: "ZONES_INPUT_VALIDATED" };
}

function validateZoneGeometry(zone) {
  if (!isObjectLike(zone) || !Array.isArray(zone.coords)) {
    return { ok: false, reasonCode: "ZONE_GEOMETRY_INVALID" };
  }

  if (zone.coords.length < 2) {
    return { ok: false, reasonCode: "ZONE_GEOMETRY_INVALID" };
  }

  for (const coordinate of zone.coords) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      return { ok: false, reasonCode: "ZONE_GEOMETRY_INVALID" };
    }

    const latitude = Number(coordinate[0]);
    const longitude = Number(coordinate[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, reasonCode: "ZONE_COORDINATE_INVALID" };
    }
  }

  return { ok: true, reasonCode: "ZONE_GEOMETRY_VALIDATED" };
}

function normalizeProjectionResult(result) {
  if (!isObjectLike(result)) {
    return null;
  }

  const canvasPoint = result.canvasPoint;
  if (!isObjectLike(canvasPoint)) {
    return null;
  }

  const x = Number(canvasPoint.x);
  const y = Number(canvasPoint.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return deepFreeze({
    x,
    y,
    insideSnapshotBounds: result.insideSnapshotBounds === true
  });
}

function shouldDrawZoneDetailsAtZoom(zoom, detailLevel, styleConfig) {
  if (detailLevel === "low") return zoom >= styleConfig.detailThresholds.low;
  if (detailLevel === "high") return zoom >= styleConfig.detailThresholds.high;
  return zoom >= styleConfig.detailThresholds.medium;
}

function getZoneStyleForFeature(featureType, zoom, styleConfig) {
  const base = styleConfig.zoneStyles[featureType] || styleConfig.zoneStyles.grass;
  let lineWidth = styleConfig.lineWidths.low;
  if (zoom >= styleConfig.detailThresholds.high) {
    lineWidth = styleConfig.lineWidths.high;
  } else if (zoom >= styleConfig.detailThresholds.medium) {
    lineWidth = styleConfig.lineWidths.medium;
  }

  return deepFreeze({
    ...base,
    lineWidth
  });
}

function getProjectedBounds(points) {
  return points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y)
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY
    }
  );
}

function clipToProjectedPolygon(context, points) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index].x, points[index].y);
  }
  context.closePath();
  context.clip();
}

function drawCustom25DZone(context, points, style, closed = true) {
  if (!Array.isArray(points) || points.length < 2) return;

  context.save();
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index].x, points[index].y);
  }
  if (closed) context.closePath();

  if (closed) {
    context.fillStyle = style.fill;
    context.fill();
    context.strokeStyle = style.edge;
    context.lineWidth = style.lineWidth;
    context.stroke();
  } else {
    context.strokeStyle = style.fill;
    context.lineWidth = Math.max(4, style.lineWidth * 3.2);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.stroke();
  }
  context.restore();
}

function drawWaterTexture(context, points, zoom, closed, styleConfig) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "medium", styleConfig) || !Array.isArray(points) || points.length < 2) {
    return;
  }

  const bounds = getProjectedBounds(points);
  const spacing = zoom >= styleConfig.detailThresholds.high ? 22 : 30;

  context.save();
  context.strokeStyle = styleConfig.detailColors.waterStroke;
  context.lineWidth = 1.12;
  if (closed) {
    clipToProjectedPolygon(context, points);
  }

  for (let y = bounds.minY + 10; y < bounds.maxY; y += spacing) {
    context.beginPath();
    for (let x = bounds.minX - 12; x <= bounds.maxX + 12; x += 22) {
      const waveY = y + Math.sin((x + y) * 0.032) * 2.1;
      if (x === bounds.minX - 12) context.moveTo(x, waveY);
      else context.lineTo(x, waveY);
    }
    context.stroke();
  }
  context.restore();
}

function drawBeachDetails(context, points, zoom, styleConfig) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "high", styleConfig) || !Array.isArray(points) || points.length < 3) {
    return;
  }

  const bounds = getProjectedBounds(points);
  context.save();
  clipToProjectedPolygon(context, points);
  context.fillStyle = styleConfig.detailColors.beachFill;

  for (let index = 0; index < 10; index += 1) {
    const x =
      bounds.minX + ((index * 41) % Math.max(40, bounds.maxX - bounds.minX + 1));
    const y =
      bounds.minY + ((index * 27) % Math.max(40, bounds.maxY - bounds.minY + 1));
    context.fillRect(x, y, 2, 2);
  }
  context.restore();
}

function drawGrassTexture(context, points, zoom, style, styleConfig) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "medium", styleConfig) || !Array.isArray(points) || points.length < 3) {
    return;
  }

  const bounds = getProjectedBounds(points);
  context.save();
  clipToProjectedPolygon(context, points);
  context.fillStyle = style.inner;

  const spacing = zoom >= styleConfig.detailThresholds.high ? 22 : 32;
  for (let y = bounds.minY + 10; y < bounds.maxY; y += spacing) {
    context.fillRect(
      bounds.minX,
      y,
      Math.max(20, bounds.maxX - bounds.minX),
      zoom >= styleConfig.detailThresholds.high ? 1.6 : 1
    );
  }
  context.restore();
}

function drawParkDetails(context, points, zoom, styleConfig) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "medium", styleConfig) || !Array.isArray(points) || points.length < 3) {
    return;
  }

  const bounds = getProjectedBounds(points);
  context.save();
  clipToProjectedPolygon(context, points);

  if (shouldDrawZoneDetailsAtZoom(zoom, "high", styleConfig)) {
    context.strokeStyle = styleConfig.detailColors.parkStroke;
    context.lineWidth = 1;
    for (let y = bounds.minY + 18; y < bounds.maxY; y += 54) {
      context.beginPath();
      context.moveTo(bounds.minX, y);
      context.quadraticCurveTo(
        (bounds.minX + bounds.maxX) * 0.5,
        y + 6,
        bounds.maxX,
        y - 3
      );
      context.stroke();
    }
  }
  context.restore();
}

function drawSportsFieldDetails(context, points, zoom, styleConfig) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "high", styleConfig) || !Array.isArray(points) || points.length < 3) {
    return;
  }

  const bounds = getProjectedBounds(points);
  context.save();
  clipToProjectedPolygon(context, points);
  context.strokeStyle = styleConfig.detailColors.sportsStroke;
  context.lineWidth = 1.2;
  context.strokeRect(
    bounds.minX + 8,
    bounds.minY + 8,
    Math.max(0, bounds.maxX - bounds.minX - 16),
    Math.max(0, bounds.maxY - bounds.minY - 16)
  );
  context.restore();
}

function drawWetlandDetails(context, points, zoom, styleConfig) {
  if (!shouldDrawZoneDetailsAtZoom(zoom, "high", styleConfig) || !Array.isArray(points) || points.length < 3) {
    return;
  }

  const bounds = getProjectedBounds(points);
  context.save();
  clipToProjectedPolygon(context, points);
  context.strokeStyle = styleConfig.detailColors.wetlandStroke;
  context.lineWidth = 1;

  for (let x = bounds.minX + 10; x < bounds.maxX; x += 18) {
    context.beginPath();
    context.moveTo(x, bounds.maxY);
    context.lineTo(x - 2, bounds.maxY - 9);
    context.lineTo(x + 1, bounds.maxY - 17);
    context.stroke();
  }
  context.restore();
}

function validateZoom(zoom, styleConfig) {
  const numericZoom = Number(zoom);
  if (!Number.isFinite(numericZoom)) {
    return { ok: false, reasonCode: "INVALID_FROZEN_ZOOM" };
  }

  const { minimum, maximum } = styleConfig.supportedZoomRange;
  if (numericZoom < minimum || numericZoom > maximum) {
    return { ok: false, reasonCode: "UNSUPPORTED_CURRENT_ZOOM" };
  }

  return { ok: true, reasonCode: "FROZEN_ZOOM_VALIDATED", zoom: numericZoom };
}

function buildBaseMetrics({
  helperStatus,
  viewportValidated,
  zoom,
  zoneInputCount = 0,
  eligibleZoneCount = 0,
  skippedZoneCount = 0,
  projectionRequestCount = 0,
  projectionSuccessCount = 0,
  projectionFailureCount = 0,
  drawAttemptCount = 0,
  completedZoneDrawCount = 0,
  contextValidated = false,
  styleConfigValidated = false
}) {
  return {
    helperStatus,
    viewportValidated,
    zoom,
    zoneInputCount,
    eligibleZoneCount,
    skippedZoneCount,
    projectionRequestCount,
    projectionSuccessCount,
    projectionFailureCount,
    drawAttemptCount,
    completedZoneDrawCount,
    contextValidated,
    styleConfigValidated
  };
}

function projectZonePoints(zone, viewportProjection, metrics) {
  const projectedPoints = [];
  let insideViewport = false;

  for (const coordinate of zone.coords) {
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
      return {
        ok: false,
        reasonCode: toReasonCode(error, "PROJECTION_FAILURE")
      };
    }

    const normalizedPoint = normalizeProjectionResult(projection);
    if (!normalizedPoint) {
      metrics.projectionFailureCount += 1;
      return {
        ok: false,
        reasonCode: "PROJECTION_FAILURE"
      };
    }

    metrics.projectionSuccessCount += 1;
    if (normalizedPoint.insideSnapshotBounds) {
      insideViewport = true;
    }

    projectedPoints.push(
      freezePoint({
        x: normalizedPoint.x,
        y: normalizedPoint.y
      })
    );
  }

  return {
    ok: true,
    reasonCode: "ZONE_POINTS_PROJECTED",
    insideViewport,
    points: deepFreeze(projectedPoints.slice())
  };
}

function drawZoneDetailsByType(context, zone, points, zoom, style, styleConfig) {
  if (zone.zoneType === "water") {
    drawWaterTexture(context, points, zoom, zone.closed !== false, styleConfig);
  } else if (zone.zoneType === "beach") {
    drawBeachDetails(context, points, zoom, styleConfig);
  } else if (zone.zoneType === "park") {
    drawParkDetails(context, points, zoom, styleConfig);
  } else if (zone.zoneType === "grass") {
    drawGrassTexture(context, points, zoom, style, styleConfig);
  } else if (zone.zoneType === "sports") {
    drawSportsFieldDetails(context, points, zoom, styleConfig);
  } else if (zone.zoneType === "wetland") {
    drawWetlandDetails(context, points, zoom, styleConfig);
  }
}

export function inspectGrowGoCustom25DZonesViewportDrawHelperSourceLock({
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

  const directGlobalReads = deepFreeze([
    "custom25DZoneFeatures",
    "map.getZoom()",
    "bounds.contains([lat, lng])",
    "projectCustom25DZonePoints(feature.coords, topLeft)",
    "map.latLngToLayerPoint([lat, lng])"
  ]);

  const contextOperationOrder = deepFreeze([
    "ctx.save()",
    "ctx.beginPath()",
    "ctx.moveTo()",
    "ctx.lineTo()",
    "ctx.closePath()",
    "ctx.fill()",
    "ctx.stroke()",
    "ctx.restore()"
  ]);

  const detailHelperDependencies = deepFreeze([
    "drawWaterTexture(ctx, points, zoom, feature.closed !== false)",
    "drawBeachDetails(ctx, points, zoom)",
    "drawParkDetails(ctx, points, zoom)",
    "drawGrassTexture(ctx, points, zoom, style)",
    "drawSportsFieldDetails(ctx, points, zoom)",
    "drawWetlandDetails(ctx, points, zoom)"
  ]);

  const checks = deepFreeze({
    drawCustom25DZonesFound: scriptSource.includes(
      "function drawCustom25DZones(ctx, bounds, topLeft)"
    ),
    globalZoneFeaturesReadFound: scriptSource.includes(
      "if (!Array.isArray(custom25DZoneFeatures) || !custom25DZoneFeatures.length) return;"
    ),
    mapZoomReadFound: scriptSource.includes("const zoom = map.getZoom();"),
    boundsContainsFilterFound: scriptSource.includes(
      ".filter((feature) => feature.coords.some(([lat, lng]) => bounds.contains([lat, lng])))"
    ),
    projectionHelperFound: scriptSource.includes(
      "const points = projectCustom25DZonePoints(feature.coords, topLeft);"
    ),
    latLngToLayerPointFound: scriptSource.includes(
      "const point = map.latLngToLayerPoint([lat, lng]);"
    ),
    styleHelperFound: scriptSource.includes(
      "const style = getZoneStyleForFeature(feature.zoneType, zoom);"
    ),
    detailFanoutFound: detailHelperDependencies.every((entry) =>
      scriptSource.includes(entry)
    )
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "SOURCE_LOCK_CONFIRMED" : "SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
      : "BLOCKED_BY_ZONE_GEOMETRY_CONTRACT_GAP",
    directGlobalReads,
    detailHelperDependencies,
    contextOperationOrder,
    zoomThresholds: deepFreeze({
      low: 15,
      medium: 16.5,
      high: 18
    }),
    geometryStructure: "feature.coords -> [latitude, longitude] tuples",
    liveCallsiteCoupling:
      "drawCustom25DMapCanvas(ctx, bounds, topLeft) -> drawCustom25DZones(ctx, bounds, topLeft)"
  });
}

export function createGrowGoCustom25DZonesViewportDrawHelper({
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
      reasonCode: viewportValidation.reasonCode,
      viewportValidated: false
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
          : styleValidation.reasonCode,
      styleConfigValidated: false
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
        zoneInputCount: metrics.zoneInputCount ?? 0,
        eligibleZoneCount: metrics.eligibleZoneCount ?? 0,
        skippedZoneCount: metrics.skippedZoneCount ?? 0,
        projectionRequestCount: metrics.projectionRequestCount ?? 0,
        projectionSuccessCount: metrics.projectionSuccessCount ?? 0,
        projectionFailureCount: metrics.projectionFailureCount ?? 0,
        drawAttemptCount: metrics.drawAttemptCount ?? 0,
        completedZoneDrawCount: metrics.completedZoneDrawCount ?? 0,
        contextValidated: metrics.contextValidated ?? false,
        styleConfigValidated:
          metrics.styleConfigValidated ?? currentStatus.styleConfigValidated
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
    drawZones({ context, zones } = {}) {
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
        return failResult(styleCheck.reasonCode, {
          styleConfigValidated: false
        });
      }

      let frozenZoom;
      try {
        frozenZoom = mutableViewportProjection.getZoom();
      } catch (error) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: toReasonCode(error, "INVALID_FROZEN_ZOOM"),
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(toReasonCode(error, "INVALID_FROZEN_ZOOM"), {
          styleConfigValidated: true
        });
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

      const zonesCheck = validateZonesInput(zones);
      if (!zonesCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: zonesCheck.reasonCode,
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(zonesCheck.reasonCode, {
          zoom: zoomCheck.zoom,
          contextValidated: true,
          styleConfigValidated: true
        });
      }

      const metrics = buildBaseMetrics({
        helperStatus: "ready",
        viewportValidated: true,
        zoom: zoomCheck.zoom,
        zoneInputCount: zones.length,
        eligibleZoneCount: 0,
        skippedZoneCount: 0,
        projectionRequestCount: 0,
        projectionSuccessCount: 0,
        projectionFailureCount: 0,
        drawAttemptCount: 0,
        completedZoneDrawCount: 0,
        contextValidated: true,
        styleConfigValidated: true
      });

      const projectedZones = [];
      for (const zone of zones) {
        const geometryCheck = validateZoneGeometry(zone);
        if (!geometryCheck.ok) {
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode: geometryCheck.reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          return failResult(geometryCheck.reasonCode, metrics);
        }

        const projection = projectZonePoints(zone, mutableViewportProjection, metrics);
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

        if (projection.points.length < 2 || projection.insideViewport !== true) {
          metrics.skippedZoneCount += 1;
          continue;
        }

        metrics.eligibleZoneCount += 1;
        projectedZones.push(
          deepFreeze({
            zoneType: zone.zoneType,
            closed: zone.closed !== false,
            points: projection.points
          })
        );
      }

      const priorityMap = styleCheck.styleConfig.zonePriority;
      const sortedZones = projectedZones
        .slice()
        .sort(
          (left, right) =>
            (priorityMap[left.zoneType] || 0) - (priorityMap[right.zoneType] || 0)
        );

      for (const zone of sortedZones) {
        metrics.drawAttemptCount += 1;
        const style = getZoneStyleForFeature(
          zone.zoneType,
          zoomCheck.zoom,
          styleCheck.styleConfig
        );
        drawCustom25DZone(context, zone.points, style, zone.closed);
        drawZoneDetailsByType(
          context,
          zone,
          zone.points,
          zoomCheck.zoom,
          style,
          styleCheck.styleConfig
        );
        metrics.completedZoneDrawCount += 1;
      }

      currentStatus = freezeStatus({
        ...currentStatus,
        helperStatus: "ready",
        reasonCode: "ZONES_DRAW_READY",
        viewportValidated: true,
        styleConfigValidated: true
      });

      return createResult({
        outcome: "success",
        reasonCode: "ZONES_DRAW_READY",
        ...metrics
      });
    }
  });
}
