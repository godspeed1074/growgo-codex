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
  "GROWGO_CUSTOM25D_TREES_VIEWPORT_DRAW_HELPER_RESULT_001";
const STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM25D_TREES_VIEWPORT_DRAW_HELPER_STATUS_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_TREES_VIEWPORT_DRAW_HELPER_SOURCE_LOCK_001";

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
    reasonCode: "TREES_HELPER_IDLE",
    viewportValidated: false,
    styleConfigValidated: false,
    disposed: false,
    listenerAdded: false,
    retentionWritten: false,
    globalMapReadPerformed: false,
    globalTreeDataReadPerformed: false,
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
    operation: "drawTrees",
    outcome: overrides.outcome,
    reasonCode: overrides.reasonCode,
    helperStatus: overrides.helperStatus,
    viewportValidated: overrides.viewportValidated,
    zoom: overrides.zoom,
    treeInputCount: overrides.treeInputCount,
    eligibleTreeCount: overrides.eligibleTreeCount,
    skippedTreeCount: overrides.skippedTreeCount,
    malformedTreeCount: overrides.malformedTreeCount,
    projectionRequestCount: overrides.projectionRequestCount,
    projectionSuccessCount: overrides.projectionSuccessCount,
    projectionFailureCount: overrides.projectionFailureCount,
    drawAttemptCount: overrides.drawAttemptCount,
    completedTreeDrawCount: overrides.completedTreeDrawCount,
    contextValidated: overrides.contextValidated,
    styleConfigValidated: overrides.styleConfigValidated,
    geometryValidated: overrides.geometryValidated,
    contextSaveCount: overrides.contextSaveCount,
    contextRestoreCount: overrides.contextRestoreCount,
    northWestLookupCount: overrides.northWestLookupCount,
    frozenTopLeftUsed: overrides.frozenTopLeftUsed,
    globalMapReadPerformed: false,
    globalTreeDataReadPerformed: false,
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

function normalizeThresholds(thresholds) {
  if (!isObjectLike(thresholds)) {
    return null;
  }

  const mediumDetailZoom = Number(thresholds.mediumDetailZoom);
  const highDetailZoom = Number(thresholds.highDetailZoom);
  const minimumProjectedSpan = Number(thresholds.minimumProjectedSpan);

  if (
    !Number.isFinite(mediumDetailZoom) ||
    !Number.isFinite(highDetailZoom) ||
    !Number.isFinite(minimumProjectedSpan)
  ) {
    return null;
  }

  return deepFreeze({
    mediumDetailZoom,
    highDetailZoom,
    minimumProjectedSpan
  });
}

function normalizeClusterLayout(clusterLayout) {
  if (!isObjectLike(clusterLayout)) {
    return null;
  }

  const mediumClusterCount = Number(clusterLayout.mediumClusterCount);
  const highClusterCount = Number(clusterLayout.highClusterCount);
  const mediumBaseScale = Number(clusterLayout.mediumBaseScale);
  const mediumScaleStep = Number(clusterLayout.mediumScaleStep);
  const highBaseScale = Number(clusterLayout.highBaseScale);
  const highScaleStep = Number(clusterLayout.highScaleStep);
  const xSeedStep = Number(clusterLayout.xSeedStep);
  const ySeedStep = Number(clusterLayout.ySeedStep);

  if (
    !Number.isFinite(mediumClusterCount) ||
    !Number.isFinite(highClusterCount) ||
    !Number.isFinite(mediumBaseScale) ||
    !Number.isFinite(mediumScaleStep) ||
    !Number.isFinite(highBaseScale) ||
    !Number.isFinite(highScaleStep) ||
    !Number.isFinite(xSeedStep) ||
    !Number.isFinite(ySeedStep)
  ) {
    return null;
  }

  return deepFreeze({
    mediumClusterCount,
    highClusterCount,
    mediumBaseScale,
    mediumScaleStep,
    highBaseScale,
    highScaleStep,
    xSeedStep,
    ySeedStep
  });
}

function normalizeBlobLayout(blobLayout) {
  if (!Array.isArray(blobLayout) || !blobLayout.length) {
    return null;
  }

  const normalized = blobLayout.map((blob) => {
    if (!isObjectLike(blob)) {
      return null;
    }

    const x = Number(blob.x);
    const y = Number(blob.y);
    const radius = Number(blob.radius);
    const fill = String(blob.fill ?? "");
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(radius) ||
      !fill
    ) {
      return null;
    }

    return deepFreeze({
      x,
      y,
      radius,
      fill
    });
  });

  if (normalized.some((blob) => blob === null)) {
    return null;
  }

  return deepFreeze(normalized);
}

function normalizeHighlight(highlight) {
  if (!isObjectLike(highlight)) {
    return null;
  }

  const offsetX = Number(highlight.offsetX);
  const offsetY = Number(highlight.offsetY);
  const radius = Number(highlight.radius);
  const fill = String(highlight.fill ?? "");

  if (
    !Number.isFinite(offsetX) ||
    !Number.isFinite(offsetY) ||
    !Number.isFinite(radius) ||
    !fill
  ) {
    return null;
  }

  return deepFreeze({
    offsetX,
    offsetY,
    radius,
    fill
  });
}

function normalizeStyleConfig(styleConfig) {
  if (!isObjectLike(styleConfig)) {
    return null;
  }

  const thresholds = normalizeThresholds(styleConfig.thresholds);
  const clusterLayout = normalizeClusterLayout(styleConfig.clusterLayout);
  const blobLayout = normalizeBlobLayout(styleConfig.blobLayout);
  const highlight = normalizeHighlight(styleConfig.highlight);
  const supportedTreeTypes = Array.isArray(styleConfig.supportedTreeTypes)
    ? styleConfig.supportedTreeTypes.map((treeType) => String(treeType))
    : null;

  if (
    !thresholds ||
    !clusterLayout ||
    !blobLayout ||
    !highlight ||
    !supportedTreeTypes ||
    !supportedTreeTypes.length
  ) {
    return null;
  }

  if (!supportedTreeTypes.includes("park")) {
    return "TREE_STYLE_MAPPING_MISSING";
  }

  return deepFreeze({
    thresholds,
    clusterLayout,
    blobLayout,
    highlight,
    supportedTreeTypes: deepFreeze(supportedTreeTypes.slice())
  });
}

export function createGrowGoCustom25DTreesStyleConfig(overrides = {}) {
  return normalizeStyleConfig({
    thresholds: overrides.thresholds ?? {
      mediumDetailZoom: 16.5,
      highDetailZoom: 18,
      minimumProjectedSpan: 12
    },
    clusterLayout: overrides.clusterLayout ?? {
      mediumClusterCount: 3,
      highClusterCount: 5,
      mediumBaseScale: 0.72,
      mediumScaleStep: 0.05,
      highBaseScale: 0.9,
      highScaleStep: 0.08,
      xSeedStep: 17.3,
      ySeedStep: 29.7
    },
    blobLayout: overrides.blobLayout ?? [
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
    highlight: overrides.highlight ?? {
      offsetX: -1.4,
      offsetY: -3.2,
      radius: 1.8,
      fill: "rgba(228, 247, 206, 0.14)"
    },
    supportedTreeTypes: overrides.supportedTreeTypes ?? ["park"]
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
  if (normalized === "TREE_STYLE_MAPPING_MISSING") {
    return { ok: false, reasonCode: "TREE_STYLE_MAPPING_MISSING" };
  }

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
    "closePath",
    "clip",
    "arc",
    "fill"
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

function validateTreesInput(trees) {
  if (typeof trees === "undefined") {
    return { ok: false, reasonCode: "TREES_INPUT_MISSING" };
  }

  if (!Array.isArray(trees)) {
    return { ok: false, reasonCode: "TREES_INPUT_INVALID" };
  }

  return { ok: true, reasonCode: "TREES_INPUT_VALIDATED" };
}

function validateZoom(zoom, styleConfig) {
  const numericZoom = Number(zoom);
  if (!Number.isFinite(numericZoom)) {
    return { ok: false, reasonCode: "INVALID_FROZEN_ZOOM" };
  }

  if (numericZoom < styleConfig.thresholds.mediumDetailZoom) {
    return { ok: false, reasonCode: "TREE_ZOOM_BELOW_THRESHOLD" };
  }

  return { ok: true, reasonCode: "FROZEN_ZOOM_VALIDATED", zoom: numericZoom };
}

function validateTreeGeometry(tree, styleConfig) {
  if (!isObjectLike(tree)) {
    return { ok: false, reasonCode: "TREE_OBJECT_INVALID" };
  }

  if (!styleConfig.supportedTreeTypes.includes(String(tree.zoneType || ""))) {
    return { ok: true, reasonCode: "TREE_TYPE_UNSUPPORTED", skip: true };
  }

  if (!Array.isArray(tree.coords)) {
    return { ok: false, reasonCode: "TREE_GEOMETRY_INVALID" };
  }

  if (tree.coords.length < 3) {
    return { ok: false, reasonCode: "TREE_GEOMETRY_INVALID" };
  }

  for (const coordinate of tree.coords) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      return { ok: false, reasonCode: "TREE_GEOMETRY_INVALID" };
    }

    if (Array.isArray(coordinate[0])) {
      return { ok: false, reasonCode: "TREE_GEOMETRY_UNSUPPORTED" };
    }

    const latitude = Number(coordinate[0]);
    const longitude = Number(coordinate[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, reasonCode: "TREE_COORDINATE_INVALID" };
    }
  }

  return { ok: true, reasonCode: "TREE_GEOMETRY_VALIDATED" };
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

function projectTreePolygon(tree, viewportProjection, metrics) {
  const points = [];
  let insideViewport = false;

  for (const coordinate of tree.coords) {
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
    reasonCode: "TREE_POINTS_PROJECTED",
    points: deepFreeze(points.slice()),
    insideViewport
  };
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

function hashFeatureSeed(input) {
  const text = String(input || "");
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 1;
}

function drawTreeCluster(context, x, y, scale, styleConfig) {
  for (const blob of styleConfig.blobLayout) {
    context.fillStyle = blob.fill;
    context.beginPath();
    context.arc(
      x + blob.x * scale,
      y + blob.y * scale,
      blob.radius * scale,
      0,
      Math.PI * 2
    );
    context.fill();
  }

  context.fillStyle = styleConfig.highlight.fill;
  context.beginPath();
  context.arc(
    x + styleConfig.highlight.offsetX * scale,
    y + styleConfig.highlight.offsetY * scale,
    styleConfig.highlight.radius * scale,
    0,
    Math.PI * 2
  );
  context.fill();
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

function buildBaseMetrics({
  helperStatus,
  viewportValidated,
  zoom,
  treeInputCount = 0,
  eligibleTreeCount = 0,
  skippedTreeCount = 0,
  malformedTreeCount = 0,
  projectionRequestCount = 0,
  projectionSuccessCount = 0,
  projectionFailureCount = 0,
  drawAttemptCount = 0,
  completedTreeDrawCount = 0,
  contextValidated = false,
  styleConfigValidated = false,
  geometryValidated = false,
  contextSaveCount = 0,
  contextRestoreCount = 0,
  northWestLookupCount = 0,
  frozenTopLeftUsed = true
}) {
  return {
    helperStatus,
    viewportValidated,
    zoom,
    treeInputCount,
    eligibleTreeCount,
    skippedTreeCount,
    malformedTreeCount,
    projectionRequestCount,
    projectionSuccessCount,
    projectionFailureCount,
    drawAttemptCount,
    completedTreeDrawCount,
    contextValidated,
    styleConfigValidated,
    geometryValidated,
    contextSaveCount,
    contextRestoreCount,
    northWestLookupCount,
    frozenTopLeftUsed
  };
}

export function inspectGrowGoCustom25DTreesViewportDrawHelperSourceLock({
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
    drawCustom25DTreesFound: scriptSource.includes(
      "function drawCustom25DTrees(ctx, size, bounds) {"
    ),
    treeDataSourceFound: scriptSource.includes(
      "if (!Array.isArray(custom25DZoneFeatures) || !custom25DZoneFeatures.length) return;"
    ),
    zoomReadFound: scriptSource.includes("const zoom = map.getZoom();"),
    zoomThresholdFound: scriptSource.includes(
      "if (!shouldDrawZoneDetailsAtZoom(zoom, \"medium\")) return;"
    ),
    parkTypeFilterFound: scriptSource.includes(
      ".filter((feature) => feature.zoneType === \"park\")"
    ),
    geometryFilterFound: scriptSource.includes(
      ".filter((feature) => Array.isArray(feature.coords) && feature.coords.length >= 3)"
    ),
    viewportFilterFound: scriptSource.includes(
      ".filter((feature) => feature.coords.some(([lat, lng]) => bounds.contains([lat, lng])))"
    ),
    northWestLookupFound: scriptSource.includes(
      "projectCustom25DZonePoints(feature.coords, map.latLngToLayerPoint(bounds.getNorthWest()))"
    ),
    seedFound: scriptSource.includes(
      "const seed = hashFeatureSeed(feature.id);"
    ),
    clippedBoundsFound: scriptSource.includes(
      "const clippedBounds = getProjectedBounds(points);"
    ),
    saveRestoreFound:
      scriptSource.includes("ctx.save();") &&
      scriptSource.includes("ctx.restore();"),
    clusterCountFound: scriptSource.includes(
      "const clusterCount = zoom >= 18 ? 5 : 3;"
    )
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "SOURCE_LOCK_CONFIRMED" : "SOURCE_LOCK_MISMATCH",
    classification: "BLOCKED_BY_LIVE_CALLSITE_COUPLING",
    treeDataSource: "custom25DZoneFeatures",
    treeSchema: deepFreeze([
      "feature.id",
      "feature.zoneType",
      "feature.coords"
    ]),
    coordinateFormat: "polygon coords -> [latitude, longitude] tuples",
    supportedTreeTypes: deepFreeze(["park"]),
    zoomThresholds: deepFreeze({
      mediumDetailZoom: 16.5,
      highDetailZoom: 18
    }),
    filteringRules: deepFreeze([
      "zoneType === park",
      "coords length >= 3",
      "at least one coordinate inside bounds.contains(...)",
      "projected point count >= 3"
    ]),
    treeScaleFormula: deepFreeze({
      medium: "0.72 + ((i % 2) * 0.05)",
      high: "0.9 + ((i % 3) * 0.08)"
    }),
    northWestDependency: deepFreeze({
      classification: "redundant_with_frame_topLeft",
      reason:
        "live trees reuse projectCustom25DZonePoints(), which subtracts a caller-supplied topLeft, so drawCustom25DTrees() performs a second north-west lookup only to satisfy that legacy helper contract"
    }),
    drawOrder: deepFreeze([
      "clip polygon",
      "tree canopy blob 1",
      "tree canopy blob 2",
      "tree canopy blob 3",
      "tree highlight"
    ]),
    styleDependencies: deepFreeze([
      "rgba(64, 149, 77, 0.52)",
      "rgba(50, 133, 63, 0.58)",
      "rgba(228, 247, 206, 0.14)"
    ]),
    directGlobalReads: deepFreeze([
      "custom25DZoneFeatures",
      "map.getZoom()",
      "bounds.contains([lat, lng])",
      "map.latLngToLayerPoint(bounds.getNorthWest())",
      "projectCustom25DZonePoints(feature.coords, ...)"
    ])
  });
}

export function createGrowGoCustom25DTreesViewportDrawHelper({
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
        treeInputCount: metrics.treeInputCount ?? 0,
        eligibleTreeCount: metrics.eligibleTreeCount ?? 0,
        skippedTreeCount: metrics.skippedTreeCount ?? 0,
        malformedTreeCount: metrics.malformedTreeCount ?? 0,
        projectionRequestCount: metrics.projectionRequestCount ?? 0,
        projectionSuccessCount: metrics.projectionSuccessCount ?? 0,
        projectionFailureCount: metrics.projectionFailureCount ?? 0,
        drawAttemptCount: metrics.drawAttemptCount ?? 0,
        completedTreeDrawCount: metrics.completedTreeDrawCount ?? 0,
        contextValidated: metrics.contextValidated ?? false,
        styleConfigValidated:
          metrics.styleConfigValidated ?? currentStatus.styleConfigValidated,
        geometryValidated: metrics.geometryValidated ?? false,
        contextSaveCount: metrics.contextSaveCount ?? 0,
        contextRestoreCount: metrics.contextRestoreCount ?? 0,
        northWestLookupCount: 0,
        frozenTopLeftUsed: metrics.frozenTopLeftUsed ?? true
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
    drawTrees({ context, trees } = {}) {
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
        return failResult(viewportCheck.reasonCode, {
          frozenTopLeftUsed: false
        });
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
          styleConfigValidated: true
        });
      }

      const treesCheck = validateTreesInput(trees);
      if (!treesCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: treesCheck.reasonCode,
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(treesCheck.reasonCode, {
          zoom: zoomCheck.zoom,
          contextValidated: true,
          styleConfigValidated: true
        });
      }

      const metrics = buildBaseMetrics({
        helperStatus: "ready",
        viewportValidated: true,
        zoom: zoomCheck.zoom,
        treeInputCount: trees.length,
        eligibleTreeCount: 0,
        skippedTreeCount: 0,
        malformedTreeCount: 0,
        projectionRequestCount: 0,
        projectionSuccessCount: 0,
        projectionFailureCount: 0,
        drawAttemptCount: 0,
        completedTreeDrawCount: 0,
        contextValidated: true,
        styleConfigValidated: true,
        geometryValidated: true,
        contextSaveCount: 0,
        contextRestoreCount: 0,
        northWestLookupCount: 0,
        frozenTopLeftUsed: true
      });

      const instrumentedContext = createInstrumentedContext(context, metrics);

      for (const tree of trees) {
        const geometryCheck = validateTreeGeometry(tree, styleCheck.styleConfig);
        if (!geometryCheck.ok) {
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode: geometryCheck.reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          metrics.malformedTreeCount += 1;
          metrics.geometryValidated = false;
          return failResult(geometryCheck.reasonCode, metrics);
        }

        if (geometryCheck.skip === true) {
          metrics.skippedTreeCount += 1;
          continue;
        }

        const projection = projectTreePolygon(
          tree,
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

        if (!projection.insideViewport || projection.points.length < 3) {
          metrics.skippedTreeCount += 1;
          continue;
        }

        const projectedBounds = getProjectedBounds(projection.points);
        const width = Math.max(
          styleCheck.styleConfig.thresholds.minimumProjectedSpan,
          projectedBounds.maxX - projectedBounds.minX
        );
        const height = Math.max(
          styleCheck.styleConfig.thresholds.minimumProjectedSpan,
          projectedBounds.maxY - projectedBounds.minY
        );

        const clusterCount =
          zoomCheck.zoom >= styleCheck.styleConfig.thresholds.highDetailZoom
            ? styleCheck.styleConfig.clusterLayout.highClusterCount
            : styleCheck.styleConfig.clusterLayout.mediumClusterCount;

        metrics.eligibleTreeCount += 1;
        metrics.drawAttemptCount += 1;

        try {
          const seed = hashFeatureSeed(tree.id);
          instrumentedContext.save();
          clipToProjectedPolygon(instrumentedContext, projection.points);

          for (let index = 0; index < clusterCount; index += 1) {
            const rx =
              Math.abs(
                Math.sin(
                  seed + index * styleCheck.styleConfig.clusterLayout.xSeedStep
                )
              ) % 1;
            const ry =
              Math.abs(
                Math.sin(
                  seed + index * styleCheck.styleConfig.clusterLayout.ySeedStep
                )
              ) % 1;
            const x = projectedBounds.minX + rx * width;
            const y = projectedBounds.minY + ry * height;
            const scale =
              zoomCheck.zoom >= styleCheck.styleConfig.thresholds.highDetailZoom
                ? styleCheck.styleConfig.clusterLayout.highBaseScale +
                  ((index % 3) * styleCheck.styleConfig.clusterLayout.highScaleStep)
                : styleCheck.styleConfig.clusterLayout.mediumBaseScale +
                  ((index % 2) * styleCheck.styleConfig.clusterLayout.mediumScaleStep);
            drawTreeCluster(instrumentedContext, x, y, scale, styleCheck.styleConfig);
          }

          instrumentedContext.restore();
        } catch (error) {
          const reasonCode = toReasonCode(error, "TREE_DRAW_FAILED");
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          return failResult(reasonCode, metrics);
        }

        metrics.completedTreeDrawCount += 1;
      }

      currentStatus = freezeStatus({
        ...currentStatus,
        helperStatus: "ready",
        reasonCode: "TREES_DRAW_READY",
        viewportValidated: true,
        styleConfigValidated: true
      });

      return createResult({
        outcome: "success",
        reasonCode: "TREES_DRAW_READY",
        ...metrics
      });
    }
  });
}
