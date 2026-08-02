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
  "GROWGO_CUSTOM25D_LANDMARKS_VIEWPORT_DRAW_HELPER_RESULT_001";
const STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LANDMARKS_VIEWPORT_DRAW_HELPER_STATUS_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_LANDMARKS_VIEWPORT_DRAW_HELPER_SOURCE_LOCK_001";

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
    reasonCode: "LANDMARKS_HELPER_IDLE",
    viewportValidated: false,
    styleConfigValidated: false,
    disposed: false,
    listenerAdded: false,
    retentionWritten: false,
    globalMapReadPerformed: false,
    globalLandmarkDataReadPerformed: false,
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
    operation: "drawLandmarks",
    outcome: overrides.outcome,
    reasonCode: overrides.reasonCode,
    helperStatus: overrides.helperStatus,
    viewportValidated: overrides.viewportValidated,
    zoom: overrides.zoom,
    landmarkInputCount: overrides.landmarkInputCount,
    eligibleLandmarkCount: overrides.eligibleLandmarkCount,
    skippedLandmarkCount: overrides.skippedLandmarkCount,
    malformedLandmarkCount: overrides.malformedLandmarkCount,
    layerProjectionRequestCount: overrides.layerProjectionRequestCount,
    layerProjectionSuccessCount: overrides.layerProjectionSuccessCount,
    canvasProjectionRequestCount: overrides.canvasProjectionRequestCount,
    canvasProjectionSuccessCount: overrides.canvasProjectionSuccessCount,
    projectionFailureCount: overrides.projectionFailureCount,
    drawAttemptCount: overrides.drawAttemptCount,
    completedLandmarkDrawCount: overrides.completedLandmarkDrawCount,
    contextValidated: overrides.contextValidated,
    styleConfigValidated: overrides.styleConfigValidated,
    geometryValidated: overrides.geometryValidated,
    coordinateSpaceUsed: overrides.coordinateSpaceUsed,
    frozenTopLeftUsed: overrides.frozenTopLeftUsed,
    contextSaveCount: overrides.contextSaveCount,
    contextRestoreCount: overrides.contextRestoreCount,
    globalMapReadPerformed: false,
    globalLandmarkDataReadPerformed: false,
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

function cloneRecipes(recipes) {
  if (!isObjectLike(recipes)) {
    return null;
  }

  const normalized = {};
  for (const [key, recipe] of Object.entries(recipes)) {
    if (!isObjectLike(recipe)) {
      return null;
    }

    const ring = String(recipe.ring ?? "");
    const ringShadow = String(recipe.ringShadow ?? "");
    const innerTop = String(recipe.innerTop ?? "");
    const innerBottom = String(recipe.innerBottom ?? "");
    const glyph = String(recipe.glyph ?? "");
    const glow = String(recipe.glow ?? "");

    if (!ring || !ringShadow || !innerTop || !innerBottom || !glyph || !glow) {
      return null;
    }

    normalized[key] = deepFreeze({
      ring,
      ringShadow,
      innerTop,
      innerBottom,
      glyph,
      glow
    });
  }

  return deepFreeze(normalized);
}

function normalizeFoundationGeometry(geometry) {
  if (!isObjectLike(geometry)) {
    return null;
  }

  const outerRadius = Number(geometry.outerRadius);
  const innerRadius = Number(geometry.innerRadius);
  const glowRadius = Number(geometry.glowRadius);
  const gradientInnerOffsetY = Number(geometry.gradientInnerOffsetY);
  const gradientInnerStartRadius = Number(geometry.gradientInnerStartRadius);
  const outerInsetRadius = Number(geometry.outerInsetRadius);
  const highlightOffsetY = Number(geometry.highlightOffsetY);
  const highlightInnerRadius = Number(geometry.highlightInnerRadius);
  const glyphSizeMultiplier = Number(geometry.glyphSizeMultiplier);
  const shadowBlur = Number(geometry.shadowBlur);
  const shadowOffsetY = Number(geometry.shadowOffsetY);
  const highlightLineWidth = Number(geometry.highlightLineWidth);

  if (
    !Number.isFinite(outerRadius) ||
    !Number.isFinite(innerRadius) ||
    !Number.isFinite(glowRadius) ||
    !Number.isFinite(gradientInnerOffsetY) ||
    !Number.isFinite(gradientInnerStartRadius) ||
    !Number.isFinite(outerInsetRadius) ||
    !Number.isFinite(highlightOffsetY) ||
    !Number.isFinite(highlightInnerRadius) ||
    !Number.isFinite(glyphSizeMultiplier) ||
    !Number.isFinite(shadowBlur) ||
    !Number.isFinite(shadowOffsetY) ||
    !Number.isFinite(highlightLineWidth)
  ) {
    return null;
  }

  return deepFreeze({
    outerRadius,
    innerRadius,
    glowRadius,
    gradientInnerOffsetY,
    gradientInnerStartRadius,
    outerInsetRadius,
    highlightOffsetY,
    highlightInnerRadius,
    glyphSizeMultiplier,
    shadowBlur,
    shadowOffsetY,
    highlightLineWidth
  });
}

function normalizeStyleConfig(styleConfig) {
  if (!isObjectLike(styleConfig)) {
    return null;
  }

  const recipes = cloneRecipes(styleConfig.recipes);
  const foundationGeometry = normalizeFoundationGeometry(
    styleConfig.foundationGeometry
  );

  if (!recipes || !foundationGeometry || !recipes.generic) {
    return null;
  }

  return deepFreeze({
    recipes,
    foundationGeometry
  });
}

export function createGrowGoCustom25DLandmarksStyleConfig(overrides = {}) {
  return normalizeStyleConfig({
    recipes: overrides.recipes ?? {
      generic: {
        ring: "rgba(201, 160, 74, 0.92)",
        ringShadow: "rgba(108, 82, 38, 0.18)",
        innerTop: "rgba(252, 247, 231, 0.94)",
        innerBottom: "rgba(232, 221, 188, 0.9)",
        glyph: "rgba(134, 98, 38, 0.88)",
        glow: "rgba(255, 232, 170, 0.12)"
      },
      dinosaur: {
        ring: "rgba(206, 166, 82, 0.92)",
        ringShadow: "rgba(108, 82, 38, 0.18)",
        innerTop: "rgba(250, 245, 227, 0.94)",
        innerBottom: "rgba(229, 220, 187, 0.9)",
        glyph: "rgba(120, 88, 44, 0.88)",
        glow: "rgba(241, 220, 152, 0.12)"
      },
      film: {
        ring: "rgba(201, 160, 74, 0.92)",
        ringShadow: "rgba(108, 82, 38, 0.18)",
        innerTop: "rgba(251, 246, 231, 0.94)",
        innerBottom: "rgba(232, 221, 190, 0.9)",
        glyph: "rgba(110, 82, 48, 0.88)",
        glow: "rgba(243, 223, 168, 0.1)"
      },
      music: {
        ring: "rgba(205, 164, 78, 0.92)",
        ringShadow: "rgba(108, 82, 38, 0.18)",
        innerTop: "rgba(252, 246, 232, 0.94)",
        innerBottom: "rgba(231, 220, 189, 0.9)",
        glyph: "rgba(124, 86, 49, 0.88)",
        glow: "rgba(245, 223, 164, 0.1)"
      },
      waterfall: {
        ring: "rgba(194, 156, 74, 0.92)",
        ringShadow: "rgba(100, 78, 42, 0.18)",
        innerTop: "rgba(249, 245, 231, 0.94)",
        innerBottom: "rgba(226, 218, 191, 0.9)",
        glyph: "rgba(90, 108, 133, 0.88)",
        glow: "rgba(188, 225, 250, 0.1)"
      },
      beach: {
        ring: "rgba(198, 157, 76, 0.92)",
        ringShadow: "rgba(104, 80, 40, 0.18)",
        innerTop: "rgba(252, 246, 231, 0.94)",
        innerBottom: "rgba(235, 224, 192, 0.9)",
        glyph: "rgba(162, 122, 66, 0.88)",
        glow: "rgba(244, 223, 161, 0.1)"
      },
      historic: {
        ring: "rgba(204, 163, 82, 0.92)",
        ringShadow: "rgba(109, 84, 41, 0.18)",
        innerTop: "rgba(252, 247, 232, 0.94)",
        innerBottom: "rgba(233, 223, 191, 0.9)",
        glyph: "rgba(127, 95, 56, 0.88)",
        glow: "rgba(243, 222, 164, 0.1)"
      }
    },
    foundationGeometry: overrides.foundationGeometry ?? {
      outerRadius: 13,
      innerRadius: 9.2,
      glowRadius: 16.5,
      gradientInnerOffsetY: -1.5,
      gradientInnerStartRadius: 2,
      outerInsetRadius: 2.2,
      highlightOffsetY: -0.6,
      highlightInnerRadius: 1.25,
      glyphSizeMultiplier: 1.5,
      shadowBlur: 6,
      shadowOffsetY: 1.5,
      highlightLineWidth: 1
    }
  });
}

function validateViewportProjection(viewportProjection) {
  if (!isObjectLike(viewportProjection)) {
    return { ok: false, reasonCode: "VIEWPORT_PROJECTION_MISSING" };
  }

  if (typeof viewportProjection.projectCoordinateToLayerPoint !== "function") {
    return {
      ok: false,
      reasonCode: "VIEWPORT_PROJECT_COORDINATE_TO_LAYER_POINT_MISSING"
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
    "arc",
    "fill",
    "stroke",
    "moveTo",
    "lineTo",
    "rect",
    "quadraticCurveTo",
    "createRadialGradient"
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

function validateLandmarksInput(landmarks) {
  if (typeof landmarks === "undefined") {
    return { ok: false, reasonCode: "LANDMARKS_INPUT_MISSING" };
  }

  if (!Array.isArray(landmarks)) {
    return { ok: false, reasonCode: "LANDMARKS_INPUT_INVALID" };
  }

  return { ok: true, reasonCode: "LANDMARKS_INPUT_VALIDATED" };
}

function validateLandmark(landmark) {
  if (!isObjectLike(landmark)) {
    return { ok: false, reasonCode: "LANDMARK_OBJECT_INVALID" };
  }

  const latitude = Number(landmark.lat);
  const longitude = Number(landmark.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, reasonCode: "LANDMARK_COORDINATE_INVALID" };
  }

  const rendererCategory = String(
    landmark.rendererCategory || landmark.category || "generic"
  ).trim() || "generic";

  return {
    ok: true,
    reasonCode: "LANDMARK_GEOMETRY_VALIDATED",
    latitude,
    longitude,
    rendererCategory
  };
}

function normalizeLayerProjectionResult(projection) {
  if (!isObjectLike(projection) || !isObjectLike(projection.layerPoint)) {
    return null;
  }

  const x = Number(projection.layerPoint.x);
  const y = Number(projection.layerPoint.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return {
    x,
    y,
    insideSnapshotBounds: projection.insideSnapshotBounds === true
  };
}

function getLandmarkVisualRecipe(category, styleConfig) {
  return (
    styleConfig.recipes[category] ||
    styleConfig.recipes.generic
  );
}

function drawLandmarkPreviewGlyph(context, x, y, size, category, color) {
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(0.75, size * 0.08);

  if (category === "dinosaur") {
    context.beginPath();
    context.arc(x - size * 0.02, y + size * 0.02, size * 0.16, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(x - size * 0.04, y + size * 0.12);
    context.lineTo(x + size * 0.18, y - size * 0.08);
    context.stroke();
  } else if (category === "film") {
    context.beginPath();
    context.rect(x - size * 0.18, y - size * 0.12, size * 0.36, size * 0.24);
    context.stroke();
    context.beginPath();
    context.moveTo(x - size * 0.1, y - size * 0.12);
    context.lineTo(x - size * 0.1, y + size * 0.12);
    context.moveTo(x, y - size * 0.12);
    context.lineTo(x, y + size * 0.12);
    context.stroke();
  } else if (category === "music") {
    context.beginPath();
    context.moveTo(x - size * 0.02, y - size * 0.18);
    context.lineTo(x - size * 0.02, y + size * 0.08);
    context.lineTo(x + size * 0.16, y + size * 0.02);
    context.lineTo(x + size * 0.16, y - size * 0.16);
    context.stroke();
    context.beginPath();
    context.arc(x - size * 0.06, y + size * 0.14, size * 0.07, 0, Math.PI * 2);
    context.arc(x + size * 0.12, y + size * 0.08, size * 0.07, 0, Math.PI * 2);
    context.fill();
  } else if (category === "waterfall") {
    context.beginPath();
    context.moveTo(x - size * 0.14, y - size * 0.14);
    context.quadraticCurveTo(
      x - size * 0.04,
      y - size * 0.02,
      x - size * 0.08,
      y + size * 0.18
    );
    context.moveTo(x + size * 0.05, y - size * 0.14);
    context.quadraticCurveTo(
      x + size * 0.15,
      y - size * 0.02,
      x + size * 0.1,
      y + size * 0.18
    );
    context.stroke();
  } else if (category === "beach") {
    context.beginPath();
    context.arc(x - size * 0.02, y + size * 0.02, size * 0.07, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(x - size * 0.02, y + size * 0.02);
    context.lineTo(x + size * 0.12, y - size * 0.16);
    context.stroke();
  } else if (category === "historic") {
    context.beginPath();
    context.moveTo(x - size * 0.16, y + size * 0.12);
    context.lineTo(x + size * 0.16, y + size * 0.12);
    context.moveTo(x - size * 0.12, y + size * 0.12);
    context.lineTo(x - size * 0.12, y - size * 0.08);
    context.moveTo(x, y + size * 0.12);
    context.lineTo(x, y - size * 0.08);
    context.moveTo(x + size * 0.12, y + size * 0.12);
    context.lineTo(x + size * 0.12, y - size * 0.08);
    context.moveTo(x - size * 0.18, y - size * 0.08);
    context.lineTo(x, y - size * 0.18);
    context.lineTo(x + size * 0.18, y - size * 0.08);
    context.stroke();
  } else {
    context.beginPath();
    context.arc(x, y, size * 0.1, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(x, y - size * 0.18);
    context.lineTo(x, y - size * 0.03);
    context.stroke();
  }

  context.restore();
}

function drawSpecialPoiFoundation(context, point, recipe, category, styleConfig) {
  const geometry = styleConfig.foundationGeometry;
  const gradient = context.createRadialGradient(
    point.x,
    point.y + geometry.gradientInnerOffsetY,
    geometry.gradientInnerStartRadius,
    point.x,
    point.y,
    geometry.innerRadius
  );
  gradient.addColorStop(0, recipe.innerTop);
  gradient.addColorStop(1, recipe.innerBottom);

  context.save();
  context.shadowColor = recipe.ringShadow;
  context.shadowBlur = geometry.shadowBlur;
  context.shadowOffsetY = geometry.shadowOffsetY;

  context.fillStyle = recipe.glow;
  context.beginPath();
  context.arc(point.x, point.y, geometry.glowRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = recipe.ring;
  context.beginPath();
  context.arc(point.x, point.y, geometry.outerRadius, 0, Math.PI * 2);
  context.fill();

  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;

  context.fillStyle = "rgba(255,255,255,0.96)";
  context.beginPath();
  context.arc(
    point.x,
    point.y,
    geometry.outerRadius - geometry.outerInsetRadius,
    0,
    Math.PI * 2
  );
  context.fill();

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(point.x, point.y, geometry.innerRadius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(255,255,255,0.32)";
  context.lineWidth = geometry.highlightLineWidth;
  context.beginPath();
  context.arc(
    point.x,
    point.y + geometry.highlightOffsetY,
    geometry.innerRadius - geometry.highlightInnerRadius,
    Math.PI * 1.08,
    Math.PI * 1.9
  );
  context.stroke();

  drawLandmarkPreviewGlyph(
    context,
    point.x,
    point.y,
    geometry.innerRadius * geometry.glyphSizeMultiplier,
    category,
    recipe.glyph
  );
  context.restore();
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
  landmarkInputCount = 0,
  eligibleLandmarkCount = 0,
  skippedLandmarkCount = 0,
  malformedLandmarkCount = 0,
  layerProjectionRequestCount = 0,
  layerProjectionSuccessCount = 0,
  canvasProjectionRequestCount = 0,
  canvasProjectionSuccessCount = 0,
  projectionFailureCount = 0,
  drawAttemptCount = 0,
  completedLandmarkDrawCount = 0,
  contextValidated = false,
  styleConfigValidated = false,
  geometryValidated = false,
  coordinateSpaceUsed = "layerPoint",
  frozenTopLeftUsed = false,
  contextSaveCount = 0,
  contextRestoreCount = 0
}) {
  return {
    helperStatus,
    viewportValidated,
    zoom,
    landmarkInputCount,
    eligibleLandmarkCount,
    skippedLandmarkCount,
    malformedLandmarkCount,
    layerProjectionRequestCount,
    layerProjectionSuccessCount,
    canvasProjectionRequestCount,
    canvasProjectionSuccessCount,
    projectionFailureCount,
    drawAttemptCount,
    completedLandmarkDrawCount,
    contextValidated,
    styleConfigValidated,
    geometryValidated,
    coordinateSpaceUsed,
    frozenTopLeftUsed,
    contextSaveCount,
    contextRestoreCount
  };
}

export function inspectGrowGoCustom25DLandmarksViewportDrawHelperSourceLock({
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
    landmarkLayerFound: scriptSource.includes(
      "function renderCustomLandmarkLayer(ctx, bounds) {"
    ),
    liveCallsiteFound: scriptSource.includes(
      "drawCustom25DLandmarkFoundation(ctx, bounds, topLeft);"
    ),
    activeLandmarkDataReadFound: scriptSource.includes(
      "const activeLandmarks = getActiveCustom25DLandmarkData();"
    ),
    testMarkerReadFound: scriptSource.includes(
      "const testMarkers = getCustom25DLandmarkTestMarkers(bounds);"
    ),
    projectionFound: scriptSource.includes(
      "const point = map.latLngToLayerPoint([marker.lat, marker.lng]);"
    ),
    boundsFilterFound: scriptSource.includes(
      "if (!bounds.contains([marker.lat, marker.lng])) return;"
    ),
    categoryFallbackFound: scriptSource.includes(
      "const rendererCategory = marker.rendererCategory || marker.category || \"generic\";"
    ),
    foundationFanoutFound: scriptSource.includes(
      "drawSpecialPoiFoundation(ctx, point, getLandmarkVisualRecipe(rendererCategory), rendererCategory);"
    ),
    topLeftUnusedAtFoundationFound: scriptSource.includes(
      "function drawCustom25DLandmarkFoundation(ctx, bounds) {"
    ),
    zonesMigrationFound: scriptSource.includes(
      "drawCustom25DZonesLiveCallsite(ctx, bounds, topLeft);"
    ),
    buildingsMigrationFound: scriptSource.includes(
      "drawCustom25DBuildingsLiveCallsite(ctx, bounds, topLeft);"
    ),
    roadsMigrationFound: scriptSource.includes(
      "drawCustom25DRoadsLiveCallsite(ctx, bounds, topLeft);"
    ),
    treesMigrationFound: scriptSource.includes(
      "drawCustom25DTreesLiveCallsite(ctx, bounds, topLeft);"
    )
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "SOURCE_LOCK_CONFIRMED" : "SOURCE_LOCK_MISMATCH",
    classification: "BLOCKED_BY_LIVE_CALLSITE_COUPLING",
    landmarkDataSource: "getActiveCustom25DLandmarkData() + getCustom25DLandmarkTestMarkers(bounds)",
    landmarkSchema: deepFreeze([
      "marker.lat",
      "marker.lng",
      "marker.rendererCategory",
      "marker.category"
    ]),
    coordinateFormat: "point -> marker.lat / marker.lng",
    supportedLandmarkTypes: deepFreeze([
      "generic",
      "dinosaur",
      "film",
      "music",
      "waterfall",
      "beach",
      "historic",
      "unknown categories fall back to generic"
    ]),
    zoomThresholds: deepFreeze({
      minimum: null,
      maximum: null,
      zoomReadRequired: false
    }),
    filteringRules: deepFreeze([
      "project first through map.latLngToLayerPoint(...)",
      "skip when bounds.contains([marker.lat, marker.lng]) is false"
    ]),
    coordinateSpace: deepFreeze({
      classification: "raw_layer_point",
      topLeftDependency: "none in current landmark path",
      reason:
        "renderCustomLandmarkLayer() passes map.latLngToLayerPoint(...) directly into drawSpecialPoiFoundation() and never subtracts the frame topLeft"
    }),
    drawOrder: deepFreeze([
      "glow fill",
      "ring fill",
      "white inset fill",
      "inner gradient fill",
      "highlight stroke",
      "glyph draw"
    ]),
    styleDependencies: deepFreeze([
      "CUSTOM_25D_LANDMARK_VISUAL_RECIPES",
      "outerRadius 13",
      "innerRadius 9.2",
      "glowRadius 16.5",
      "glyph size innerRadius * 1.5"
    ]),
    helperFanout: deepFreeze([
      "getLandmarkVisualRecipe",
      "drawSpecialPoiFoundation",
      "drawLandmarkPreviewGlyph"
    ]),
    directGlobalReads: deepFreeze([
      "getActiveCustom25DLandmarkData()",
      "getCustom25DLandmarkTestMarkers(bounds)",
      "map.latLngToLayerPoint([marker.lat, marker.lng])",
      "bounds.contains([marker.lat, marker.lng])"
    ])
  });
}

export function createGrowGoCustom25DLandmarksViewportDrawHelper({
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
        zoom: null,
        landmarkInputCount: metrics.landmarkInputCount ?? 0,
        eligibleLandmarkCount: metrics.eligibleLandmarkCount ?? 0,
        skippedLandmarkCount: metrics.skippedLandmarkCount ?? 0,
        malformedLandmarkCount: metrics.malformedLandmarkCount ?? 0,
        layerProjectionRequestCount: metrics.layerProjectionRequestCount ?? 0,
        layerProjectionSuccessCount: metrics.layerProjectionSuccessCount ?? 0,
        canvasProjectionRequestCount: 0,
        canvasProjectionSuccessCount: 0,
        projectionFailureCount: metrics.projectionFailureCount ?? 0,
        drawAttemptCount: metrics.drawAttemptCount ?? 0,
        completedLandmarkDrawCount: metrics.completedLandmarkDrawCount ?? 0,
        contextValidated: metrics.contextValidated ?? false,
        styleConfigValidated:
          metrics.styleConfigValidated ?? currentStatus.styleConfigValidated,
        geometryValidated: metrics.geometryValidated ?? false,
        coordinateSpaceUsed: "layerPoint",
        frozenTopLeftUsed: false,
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
    drawLandmarks({ context, landmarks } = {}) {
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
          styleConfigValidated: true
        });
      }

      const landmarksCheck = validateLandmarksInput(landmarks);
      if (!landmarksCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: landmarksCheck.reasonCode,
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(landmarksCheck.reasonCode, {
          contextValidated: true,
          styleConfigValidated: true
        });
      }

      const metrics = {
        landmarkInputCount: landmarks.length,
        eligibleLandmarkCount: 0,
        skippedLandmarkCount: 0,
        malformedLandmarkCount: 0,
        layerProjectionRequestCount: 0,
        layerProjectionSuccessCount: 0,
        projectionFailureCount: 0,
        drawAttemptCount: 0,
        completedLandmarkDrawCount: 0,
        contextSaveCount: 0,
        contextRestoreCount: 0
      };

      const instrumentedContext = createInstrumentedContext(context, metrics);

      for (const landmark of landmarks) {
        const landmarkCheck = validateLandmark(landmark);
        if (!landmarkCheck.ok) {
          metrics.malformedLandmarkCount += 1;
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode: landmarkCheck.reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          return failResult(landmarkCheck.reasonCode, {
            ...metrics,
            contextValidated: true,
            styleConfigValidated: true,
            geometryValidated: false
          });
        }

        metrics.layerProjectionRequestCount += 1;

        let projection;
        try {
          projection = mutableViewportProjection.projectCoordinateToLayerPoint({
            latitude: landmarkCheck.latitude,
            longitude: landmarkCheck.longitude
          });
        } catch (error) {
          metrics.projectionFailureCount += 1;
          const reasonCode = toReasonCode(error, "PROJECTION_FAILURE");
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          return failResult(reasonCode, {
            ...metrics,
            contextValidated: true,
            styleConfigValidated: true,
            geometryValidated: true
          });
        }

        const normalizedProjection = normalizeLayerProjectionResult(projection);
        if (!normalizedProjection) {
          metrics.projectionFailureCount += 1;
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode: "PROJECTION_FAILURE",
            viewportValidated: true,
            styleConfigValidated: true
          });
          return failResult("PROJECTION_FAILURE", {
            ...metrics,
            contextValidated: true,
            styleConfigValidated: true,
            geometryValidated: true
          });
        }

        metrics.layerProjectionSuccessCount += 1;

        if (!normalizedProjection.insideSnapshotBounds) {
          metrics.skippedLandmarkCount += 1;
          continue;
        }

        metrics.eligibleLandmarkCount += 1;
        metrics.drawAttemptCount += 1;

        const point = freezePoint(normalizedProjection);
        const recipe = getLandmarkVisualRecipe(
          landmarkCheck.rendererCategory,
          styleCheck.styleConfig
        );

        drawSpecialPoiFoundation(
          instrumentedContext,
          point,
          recipe,
          landmarkCheck.rendererCategory,
          styleCheck.styleConfig
        );
        metrics.completedLandmarkDrawCount += 1;
      }

      currentStatus = freezeStatus({
        ...currentStatus,
        helperStatus: "ready",
        reasonCode: "LANDMARKS_DRAW_READY",
        viewportValidated: true,
        styleConfigValidated: true
      });

      return createResult({
        outcome: "success",
        reasonCode: "LANDMARKS_DRAW_READY",
        ...buildBaseMetrics({
          helperStatus: currentStatus.helperStatus,
          viewportValidated: true,
          zoom: null,
          landmarkInputCount: metrics.landmarkInputCount,
          eligibleLandmarkCount: metrics.eligibleLandmarkCount,
          skippedLandmarkCount: metrics.skippedLandmarkCount,
          malformedLandmarkCount: metrics.malformedLandmarkCount,
          layerProjectionRequestCount: metrics.layerProjectionRequestCount,
          layerProjectionSuccessCount: metrics.layerProjectionSuccessCount,
          canvasProjectionRequestCount: 0,
          canvasProjectionSuccessCount: 0,
          projectionFailureCount: metrics.projectionFailureCount,
          drawAttemptCount: metrics.drawAttemptCount,
          completedLandmarkDrawCount: metrics.completedLandmarkDrawCount,
          contextValidated: true,
          styleConfigValidated: true,
          geometryValidated: true,
          coordinateSpaceUsed: "layerPoint",
          frozenTopLeftUsed: false,
          contextSaveCount: metrics.contextSaveCount,
          contextRestoreCount: metrics.contextRestoreCount
        })
      });
    }
  });
}
