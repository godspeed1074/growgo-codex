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
  "GROWGO_CUSTOM25D_BUILDINGS_VIEWPORT_DRAW_HELPER_RESULT_001";
const STATUS_SCHEMA_ID =
  "GROWGO_CUSTOM25D_BUILDINGS_VIEWPORT_DRAW_HELPER_STATUS_001";
const SOURCE_LOCK_SCHEMA_ID =
  "GROWGO_CUSTOM25D_BUILDINGS_VIEWPORT_DRAW_HELPER_SOURCE_LOCK_001";

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
    reasonCode: "BUILDINGS_HELPER_IDLE",
    viewportValidated: false,
    styleConfigValidated: false,
    disposed: false,
    listenerAdded: false,
    retentionWritten: false,
    globalMapReadPerformed: false,
    globalBuildingDataReadPerformed: false,
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
    operation: "drawBuildings",
    outcome: overrides.outcome,
    reasonCode: overrides.reasonCode,
    helperStatus: overrides.helperStatus,
    viewportValidated: overrides.viewportValidated,
    zoom: overrides.zoom,
    buildingInputCount: overrides.buildingInputCount,
    eligibleBuildingCount: overrides.eligibleBuildingCount,
    skippedBuildingCount: overrides.skippedBuildingCount,
    malformedBuildingCount: overrides.malformedBuildingCount,
    projectionRequestCount: overrides.projectionRequestCount,
    projectionSuccessCount: overrides.projectionSuccessCount,
    projectionFailureCount: overrides.projectionFailureCount,
    drawAttemptCount: overrides.drawAttemptCount,
    completedBuildingDrawCount: overrides.completedBuildingDrawCount,
    contextValidated: overrides.contextValidated,
    styleConfigValidated: overrides.styleConfigValidated,
    geometryValidated: overrides.geometryValidated,
    contextSaveCount: overrides.contextSaveCount,
    contextRestoreCount: overrides.contextRestoreCount,
    globalMapReadPerformed: false,
    globalBuildingDataReadPerformed: false,
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

function cloneDeep(value) {
  if (Array.isArray(value)) {
    return value.map(cloneDeep);
  }

  if (isObjectLike(value)) {
    const clone = {};
    for (const [key, nested] of Object.entries(value)) {
      clone[key] = cloneDeep(nested);
    }
    return clone;
  }

  return value;
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

  const buildingMinimumZoom = Number(thresholds.buildingMinimumZoom);
  const shopMinimumZoom = Number(thresholds.shopMinimumZoom);
  const shopDetailMinimumZoom = Number(thresholds.shopDetailMinimumZoom);
  const highDetailZoom = Number(thresholds.highDetailZoom);
  const midDetailZoom = Number(thresholds.midDetailZoom);
  const highZoomCap = Number(thresholds.highZoomCap);
  const mediumZoomCap = Number(thresholds.mediumZoomCap);
  const lowZoomCap = Number(thresholds.lowZoomCap);

  if (
    !Number.isFinite(buildingMinimumZoom) ||
    !Number.isFinite(shopMinimumZoom) ||
    !Number.isFinite(shopDetailMinimumZoom) ||
    !Number.isFinite(highDetailZoom) ||
    !Number.isFinite(midDetailZoom) ||
    !Number.isFinite(highZoomCap) ||
    !Number.isFinite(mediumZoomCap) ||
    !Number.isFinite(lowZoomCap)
  ) {
    return null;
  }

  return deepFreeze({
    buildingMinimumZoom,
    shopMinimumZoom,
    shopDetailMinimumZoom,
    highDetailZoom,
    midDetailZoom,
    highZoomCap,
    mediumZoomCap,
    lowZoomCap
  });
}

function normalizeShopRecipes(recipes) {
  if (!isObjectLike(recipes)) {
    return null;
  }

  const normalized = {};
  for (const [key, recipe] of Object.entries(recipes)) {
    if (!isObjectLike(recipe) || !isObjectLike(recipe.palette)) {
      return null;
    }

    const roofTop = String(recipe.palette.roof?.top ?? "");
    const roofSide = String(recipe.palette.roof?.side ?? "");
    const wallFront = String(recipe.palette.wall?.front ?? "");
    const wallSide = String(recipe.palette.wall?.side ?? "");
    const awning = String(recipe.palette.awning ?? "");
    const sign = String(recipe.palette.sign ?? "");
    const window = String(recipe.palette.window ?? "");
    const icon = String(recipe.icon ?? "");
    const outside = String(recipe.outside ?? "");
    const awningType = String(recipe.awning ?? "");
    const sizeBias = Number(recipe.sizeBias);

    if (
      !roofTop ||
      !roofSide ||
      !wallFront ||
      !wallSide ||
      !awning ||
      !sign ||
      !window ||
      !icon ||
      !outside ||
      !awningType ||
      !Number.isFinite(sizeBias)
    ) {
      return null;
    }

    normalized[key] = deepFreeze({
      key: String(recipe.key ?? key),
      palette: deepFreeze({
        roof: deepFreeze({ top: roofTop, side: roofSide }),
        wall: deepFreeze({ front: wallFront, side: wallSide }),
        awning,
        sign,
        window
      }),
      awning: awningType,
      icon,
      outside,
      sizeBias
    });
  }

  return deepFreeze(normalized);
}

function normalizeStyleConfig(styleConfig) {
  if (!isObjectLike(styleConfig)) {
    return null;
  }

  const thresholds = normalizeThresholds(styleConfig.thresholds);
  const shopRecipes = normalizeShopRecipes(styleConfig.shopRecipes);
  if (!thresholds || !shopRecipes) {
    return null;
  }

  return deepFreeze({
    thresholds,
    shopRecipes
  });
}

export function createGrowGoCustom25DBuildingsStyleConfig(overrides = {}) {
  return normalizeStyleConfig({
    thresholds: {
      buildingMinimumZoom:
        overrides.thresholds?.buildingMinimumZoom ?? 16.2,
      shopMinimumZoom: overrides.thresholds?.shopMinimumZoom ?? 16.8,
      shopDetailMinimumZoom:
        overrides.thresholds?.shopDetailMinimumZoom ?? 18.2,
      highDetailZoom: overrides.thresholds?.highDetailZoom ?? 18,
      midDetailZoom: overrides.thresholds?.midDetailZoom ?? 17,
      highZoomCap: overrides.thresholds?.highZoomCap ?? 120,
      mediumZoomCap: overrides.thresholds?.mediumZoomCap ?? 80,
      lowZoomCap: overrides.thresholds?.lowZoomCap ?? 45
    },
    shopRecipes: overrides.shopRecipes ?? {
      bakery: {
        key: "bakery",
        palette: {
          roof: {
            top: "rgba(183, 108, 92, 0.86)",
            side: "rgba(149, 84, 71, 0.9)"
          },
          wall: {
            front: "rgba(238, 224, 196, 0.86)",
            side: "rgba(212, 194, 166, 0.9)"
          },
          awning: "rgba(197, 101, 82, 0.92)",
          sign: "rgba(131, 72, 52, 0.94)",
          window: "rgba(88, 64, 51, 0.34)"
        },
        awning: "striped",
        icon: "bread",
        outside: "crate",
        sizeBias: 0.98
      },
      cafe: {
        key: "cafe",
        palette: {
          roof: {
            top: "rgba(145, 122, 101, 0.84)",
            side: "rgba(113, 95, 79, 0.88)"
          },
          wall: {
            front: "rgba(229, 214, 194, 0.84)",
            side: "rgba(198, 183, 163, 0.88)"
          },
          awning: "rgba(120, 153, 124, 0.9)",
          sign: "rgba(93, 74, 58, 0.9)",
          window: "rgba(63, 73, 80, 0.38)"
        },
        awning: "flat",
        icon: "cup",
        outside: "table",
        sizeBias: 0.96
      },
      surfShop: {
        key: "surfShop",
        palette: {
          roof: {
            top: "rgba(109, 152, 188, 0.86)",
            side: "rgba(82, 122, 156, 0.9)"
          },
          wall: {
            front: "rgba(225, 237, 233, 0.84)",
            side: "rgba(196, 209, 205, 0.88)"
          },
          awning: "rgba(72, 170, 176, 0.92)",
          sign: "rgba(58, 108, 140, 0.94)",
          window: "rgba(67, 107, 125, 0.32)"
        },
        awning: "curved",
        icon: "surfboard",
        outside: "rack",
        sizeBias: 1.02
      },
      fishAndChips: {
        key: "fishAndChips",
        palette: {
          roof: {
            top: "rgba(116, 150, 182, 0.86)",
            side: "rgba(84, 118, 146, 0.9)"
          },
          wall: {
            front: "rgba(232, 239, 241, 0.86)",
            side: "rgba(201, 212, 216, 0.9)"
          },
          awning: "rgba(77, 128, 170, 0.92)",
          sign: "rgba(53, 90, 132, 0.95)",
          window: "rgba(52, 87, 122, 0.28)"
        },
        awning: "striped",
        icon: "fish",
        outside: "crate",
        sizeBias: 1
      },
      pharmacy: {
        key: "pharmacy",
        palette: {
          roof: {
            top: "rgba(173, 186, 180, 0.84)",
            side: "rgba(137, 149, 143, 0.88)"
          },
          wall: {
            front: "rgba(242, 245, 238, 0.88)",
            side: "rgba(217, 221, 214, 0.9)"
          },
          awning: "rgba(101, 176, 111, 0.9)",
          sign: "rgba(69, 139, 83, 0.95)",
          window: "rgba(93, 127, 107, 0.2)"
        },
        awning: "flat",
        icon: "cross",
        outside: "none",
        sizeBias: 0.94
      },
      realEstate: {
        key: "realEstate",
        palette: {
          roof: {
            top: "rgba(150, 151, 165, 0.84)",
            side: "rgba(114, 116, 130, 0.88)"
          },
          wall: {
            front: "rgba(231, 229, 224, 0.84)",
            side: "rgba(203, 201, 196, 0.88)"
          },
          awning: "rgba(122, 139, 164, 0.88)",
          sign: "rgba(84, 99, 124, 0.92)",
          window: "rgba(79, 96, 115, 0.26)"
        },
        awning: "flat",
        icon: "house",
        outside: "signboard",
        sizeBias: 0.98
      },
      bottleShop: {
        key: "bottleShop",
        palette: {
          roof: {
            top: "rgba(104, 96, 118, 0.86)",
            side: "rgba(76, 70, 92, 0.9)"
          },
          wall: {
            front: "rgba(197, 191, 205, 0.8)",
            side: "rgba(170, 164, 178, 0.86)"
          },
          awning: "rgba(102, 89, 133, 0.92)",
          sign: "rgba(73, 63, 100, 0.95)",
          window: "rgba(57, 52, 72, 0.34)"
        },
        awning: "flat",
        icon: "bottle",
        outside: "crate",
        sizeBias: 0.98
      },
      newsagent: {
        key: "newsagent",
        palette: {
          roof: {
            top: "rgba(166, 149, 121, 0.84)",
            side: "rgba(129, 115, 92, 0.88)"
          },
          wall: {
            front: "rgba(234, 224, 210, 0.84)",
            side: "rgba(207, 194, 178, 0.88)"
          },
          awning: "rgba(214, 121, 78, 0.92)",
          sign: "rgba(174, 92, 56, 0.96)",
          window: "rgba(76, 88, 98, 0.26)"
        },
        awning: "striped",
        icon: "paper",
        outside: "stand",
        sizeBias: 0.95
      },
      hardware: {
        key: "hardware",
        palette: {
          roof: {
            top: "rgba(151, 131, 109, 0.86)",
            side: "rgba(118, 102, 84, 0.9)"
          },
          wall: {
            front: "rgba(223, 214, 201, 0.84)",
            side: "rgba(195, 185, 171, 0.88)"
          },
          awning: "rgba(216, 134, 73, 0.92)",
          sign: "rgba(149, 91, 49, 0.96)",
          window: "rgba(88, 94, 92, 0.24)"
        },
        awning: "shed",
        icon: "hammer",
        outside: "crate",
        sizeBias: 1
      },
      supermarket: {
        key: "supermarket",
        palette: {
          roof: {
            top: "rgba(124, 137, 156, 0.84)",
            side: "rgba(95, 108, 126, 0.88)"
          },
          wall: {
            front: "rgba(227, 232, 229, 0.84)",
            side: "rgba(198, 204, 200, 0.88)"
          },
          awning: "rgba(106, 152, 118, 0.9)",
          sign: "rgba(72, 116, 86, 0.94)",
          window: "rgba(78, 111, 99, 0.22)"
        },
        awning: "wide",
        icon: "basket",
        outside: "cart",
        sizeBias: 1.08
      }
    }
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

  const requiredMethods = [
    "save",
    "restore",
    "beginPath",
    "moveTo",
    "lineTo",
    "closePath",
    "fill",
    "stroke",
    "quadraticCurveTo",
    "roundRect",
    "arc",
    "ellipse",
    "rect",
    "fillRect",
    "strokeRect"
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

function validateBuildingsInput(buildings) {
  if (typeof buildings === "undefined" || buildings === null) {
    return { ok: false, reasonCode: "BUILDINGS_INPUT_MISSING" };
  }

  if (!Array.isArray(buildings)) {
    return { ok: false, reasonCode: "BUILDINGS_INPUT_INVALID" };
  }

  return { ok: true, reasonCode: "BUILDINGS_INPUT_VALIDATED" };
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

function hashFeatureSeed(input) {
  const text = String(input || "");
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 1;
}

function getBuildingVariantFromSeed(seed) {
  const roofPalette = [
    { top: "rgba(185, 130, 118, 0.84)", side: "rgba(154, 104, 95, 0.88)" },
    { top: "rgba(184, 151, 122, 0.84)", side: "rgba(148, 120, 95, 0.88)" },
    { top: "rgba(145, 160, 173, 0.82)", side: "rgba(112, 127, 139, 0.86)" },
    { top: "rgba(165, 165, 170, 0.8)", side: "rgba(131, 131, 138, 0.84)" }
  ];
  const wallPalette = [
    { front: "rgba(231, 221, 204, 0.82)", side: "rgba(202, 189, 172, 0.86)" },
    { front: "rgba(224, 214, 198, 0.82)", side: "rgba(193, 181, 164, 0.86)" },
    { front: "rgba(214, 209, 216, 0.78)", side: "rgba(185, 178, 187, 0.82)" },
    { front: "rgba(207, 214, 207, 0.8)", side: "rgba(177, 184, 177, 0.84)" }
  ];

  const roofIndex = seed % roofPalette.length;
  const wallIndex = Math.floor(seed / 7) % wallPalette.length;

  return {
    roof: roofPalette[roofIndex],
    wall: wallPalette[wallIndex],
    height: 3.9 + ((seed % 4) * 0.72),
    roofLift: 1.2 + (seed % 2) * 0.6,
    shadowAlpha: 0.052 + ((seed % 4) * 0.015),
    skew: ((seed % 5) - 2) * 0.12,
    inset: 0.875 + ((seed % 3) * 0.02),
    depthX: 1.7 + ((Math.floor(seed / 3) % 4) * 0.34),
    depthY: 3.1 + ((Math.floor(seed / 11) % 4) * 0.44),
    roofScale: 1.014 + ((seed % 3) * 0.004),
    roofInsetScale: 0.9 + ((seed % 2) * 0.025),
    roofHighlightAlpha: 0.07 + ((seed % 3) * 0.018),
    wallHighlightAlpha: 0.045 + ((seed % 2) * 0.012),
    sideShadeAlpha: 0.07 + ((seed % 3) * 0.012),
    shadowOffsetX: 1.8 + ((seed % 3) * 0.28),
    shadowOffsetY: 2.15 + ((seed % 4) * 0.22),
    shadowBlur: 5.2 + ((seed % 4) * 0.8)
  };
}

function getBuildingStyleForFeature(feature, zoom) {
  const seed = hashFeatureSeed(
    [
      feature?.id,
      feature?.center?.lat?.toFixed?.(6),
      feature?.center?.lng?.toFixed?.(6),
      feature?.buildingType,
      feature?.zoneType
    ]
      .filter(Boolean)
      .join(":")
  );
  const variant = getBuildingVariantFromSeed(seed);
  const detail = zoom >= 18;

  return {
    ...variant,
    seed,
    detail,
    roofLineWidth: detail ? 1.34 : 0.94,
    bodyLineWidth: detail ? 1.08 : 0.82,
    cornerRadius: detail ? 3.6 : 2.8
  };
}

function shouldDrawBuildingAtZoom(zoom, styleConfig) {
  return zoom >= styleConfig.thresholds.buildingMinimumZoom;
}

function shouldDrawShopAtZoom(zoom, styleConfig) {
  return zoom >= styleConfig.thresholds.shopMinimumZoom;
}

function shouldDrawShopDetailsAtZoom(zoom, styleConfig) {
  return zoom >= styleConfig.thresholds.shopDetailMinimumZoom;
}

function getMaxBuildingsForZoom(zoom, styleConfig) {
  if (zoom >= styleConfig.thresholds.highDetailZoom) {
    return styleConfig.thresholds.highZoomCap;
  }

  if (zoom >= styleConfig.thresholds.midDetailZoom) {
    return styleConfig.thresholds.mediumZoomCap;
  }

  return styleConfig.thresholds.lowZoomCap;
}

function getShopTagHint(feature) {
  const shopTag = String(feature?.shopTag || "").toLowerCase();
  const amenity = String(feature?.amenity || "").toLowerCase();
  const cuisine = String(feature?.cuisine || "").toLowerCase();
  const office = String(feature?.office || "").toLowerCase();
  const buildingType = String(feature?.buildingType || "").toLowerCase();

  if (shopTag === "bakery") return "bakery";
  if (shopTag === "supermarket" || buildingType === "supermarket") {
    return "supermarket";
  }
  if (shopTag === "newsagent") return "newsagent";
  if (shopTag === "pharmacy" || amenity === "pharmacy") return "pharmacy";
  if (shopTag === "doityourself" || shopTag === "hardware") return "hardware";
  if (
    shopTag === "alcohol" ||
    shopTag === "beverages" ||
    shopTag === "wine"
  ) {
    return "bottleShop";
  }
  if (
    shopTag === "estate_agent" ||
    office === "estate_agent" ||
    office === "real_estate_agent"
  ) {
    return "realEstate";
  }
  if (shopTag === "sports" || shopTag === "surf") return "surfShop";
  if (shopTag === "seafood") return "fishAndChips";
  if (amenity === "cafe") return "cafe";
  if (amenity === "fast_food" || amenity === "restaurant") {
    if (cuisine.includes("fish") || cuisine.includes("seafood")) {
      return "fishAndChips";
    }
    return "cafe";
  }

  return null;
}

function isCommercialFeature(feature) {
  if (!feature) return false;

  const buildingType = String(feature.buildingType || "").toLowerCase();
  const shopTag = String(feature.shopTag || "").toLowerCase();
  const amenity = String(feature.amenity || "").toLowerCase();
  const office = String(feature.office || "").toLowerCase();

  return Boolean(
    shopTag ||
      ["commercial", "retail", "supermarket", "kiosk", "shop"].includes(
        buildingType
      ) ||
      [
        "cafe",
        "pharmacy",
        "fast_food",
        "restaurant",
        "bar",
        "pub"
      ].includes(amenity) ||
      ["estate_agent", "real_estate_agent"].includes(office)
  );
}

function getShopVariantFromSeed(seed, shopKey) {
  const stripeFlip = seed % 2 === 0;
  const awningDepth = 0.9 + ((seed % 4) * 0.18);
  const signHeight = 0.75 + ((seed % 3) * 0.18);
  const windowCols = 1 + (seed % 3);
  const doorwayOffset = ((seed % 5) - 2) * 0.06;

  return {
    key: shopKey,
    stripeFlip,
    awningDepth,
    signHeight,
    windowCols,
    doorwayOffset,
    detailVariant: Math.floor(seed / 13) % 3
  };
}

function getShopRecipeForFeature(feature, zoom, styleConfig) {
  if (!shouldDrawShopAtZoom(zoom, styleConfig)) return null;
  if (!isCommercialFeature(feature)) return null;

  const seed = hashFeatureSeed(
    [
      feature?.id,
      feature?.center?.lat?.toFixed?.(6),
      feature?.center?.lng?.toFixed?.(6),
      feature?.buildingType,
      feature?.shopTag,
      feature?.amenity,
      feature?.office
    ]
      .filter(Boolean)
      .join(":")
  );

  const hintedKey = getShopTagHint(feature);
  if (hintedKey && styleConfig.shopRecipes[hintedKey]) {
    return {
      recipe: styleConfig.shopRecipes[hintedKey],
      variant: getShopVariantFromSeed(seed, hintedKey),
      seed
    };
  }

  const buildingType = String(feature?.buildingType || "").toLowerCase();
  const baseChance =
    feature?.buildingArea > 900
      ? 0.42
      : feature?.buildingArea > 550
        ? 0.28
        : 0.16;
  const zoomBoost = zoom >= 18.4 ? 0.12 : zoom >= 17.6 ? 0.04 : 0;
  const roadBoost = ["retail", "commercial", "supermarket"].includes(buildingType)
    ? 0.12
    : 0;
  const coastBoost = feature?.nearCoast ? 0.06 : 0;
  const conversionChance = Math.min(
    0.58,
    baseChance + zoomBoost + roadBoost + coastBoost
  );
  const chanceRoll = (seed % 1000) / 1000;
  if (chanceRoll > conversionChance) return null;

  const defaults = feature?.nearCoast
    ? ["surfShop", "fishAndChips", "cafe", "newsagent"]
    : ["cafe", "bakery", "newsagent", "realEstate"];
  const largerDefaults =
    feature?.buildingArea > 700
      ? ["supermarket", "hardware", "supermarket", "hardware"]
      : defaults;
  const pool = largerDefaults.filter((key) => styleConfig.shopRecipes[key]);
  if (!pool.length) return null;

  const selectedKey = pool[seed % pool.length];
  return {
    recipe: styleConfig.shopRecipes[selectedKey],
    variant: getShopVariantFromSeed(seed, selectedKey),
    seed
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

function getBuildingCentroid(points) {
  const total = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length
  };
}

function offsetBuildingPoints(points, centroid, shiftX, shiftY, scale = 1) {
  return points.map((point) => ({
    x: centroid.x + (point.x - centroid.x) * scale + shiftX,
    y: centroid.y + (point.y - centroid.y) * scale + shiftY
  }));
}

function getSoftBuildingCornerRadius(points, softness = 0.16, maxRadius = 5.5) {
  const bounds = getProjectedBounds(points);
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  return Math.min(maxRadius, Math.max(1.1, Math.min(width, height) * softness));
}

function drawRoundedPolygonPath(context, points, radius = 2.2) {
  if (!Array.isArray(points) || points.length < 3) return;

  const total = points.length;
  context.beginPath();

  for (let index = 0; index < total; index += 1) {
    const previous = points[(index - 1 + total) % total];
    const current = points[index];
    const next = points[(index + 1) % total];
    const inDx = current.x - previous.x;
    const inDy = current.y - previous.y;
    const outDx = next.x - current.x;
    const outDy = next.y - current.y;
    const inLen = Math.max(0.001, Math.hypot(inDx, inDy));
    const outLen = Math.max(0.001, Math.hypot(outDx, outDy));
    const cornerRadius = Math.min(radius, inLen * 0.33, outLen * 0.33);
    const startX = current.x - (inDx / inLen) * cornerRadius;
    const startY = current.y - (inDy / inLen) * cornerRadius;
    const endX = current.x + (outDx / outLen) * cornerRadius;
    const endY = current.y + (outDy / outLen) * cornerRadius;

    if (index === 0) context.moveTo(startX, startY);
    else context.lineTo(startX, startY);
    context.quadraticCurveTo(current.x, current.y, endX, endY);
  }

  context.closePath();
}

function getSimplifiedBuildingShape(points, style) {
  const bounds = getProjectedBounds(points);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const area = width * height;
  const useToyRect =
    points.length !== 4 ||
    area < 420 ||
    width > height * 2.6 ||
    height > width * 2.6;

  if (!useToyRect) {
    return offsetBuildingPoints(
      points,
      getBuildingCentroid(points),
      0,
      0,
      style.inset
    );
  }

  const insetX = Math.max(2, width * (1 - style.inset) * 0.5);
  const insetY = Math.max(2, height * (1 - style.inset) * 0.5);
  return [
    { x: bounds.minX + insetX, y: bounds.minY + insetY },
    { x: bounds.maxX - insetX, y: bounds.minY + insetY },
    { x: bounds.maxX - insetX, y: bounds.maxY - insetY },
    { x: bounds.minX + insetX, y: bounds.maxY - insetY }
  ];
}

function getEdgeKey(startIndex, endIndex) {
  return `${startIndex}:${endIndex}`;
}

function getDominantBuildingEdge(points, axis = "y", excludedEdge = null) {
  if (!Array.isArray(points) || points.length < 2) {
    return { startIndex: 0, endIndex: 0 };
  }

  const excludedKey = excludedEdge
    ? getEdgeKey(excludedEdge.startIndex, excludedEdge.endIndex)
    : "";
  let bestEdge = { startIndex: 0, endIndex: 1 };
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    const edgeKey = getEdgeKey(index, nextIndex);
    if (edgeKey === excludedKey) continue;
    const score = (points[index][axis] + points[nextIndex][axis]) * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestEdge = { startIndex: index, endIndex: nextIndex };
    }
  }

  return bestEdge;
}

function getBuildingDepth(style, zoom, emphasis = 1) {
  const zoomFactor = zoom >= 18.4 ? 1.08 : zoom >= 17.4 ? 1.02 : 0.96;
  return {
    x: (style.depthX || 1.9) * emphasis * zoomFactor,
    y: (style.depthY || style.height || 3.8) * emphasis * zoomFactor
  };
}

function getBuildingTone(color, alpha = 0.12) {
  return color.replace(/rgba\(([^)]+),\s*([0-9.]+)\)/, (_match, rgb, existingAlpha) => {
    const mixedAlpha = Math.min(0.95, Number(existingAlpha) + alpha);
    return `rgba(${rgb}, ${mixedAlpha.toFixed(2)})`;
  });
}

function getBuildingGeometry(points, style, scale = 1) {
  const basePoints = getSimplifiedBuildingShape(points, style).map((point) => ({
    ...point
  }));
  const centroid = getBuildingCentroid(basePoints);
  const scaledBasePoints =
    scale === 1
      ? basePoints
      : offsetBuildingPoints(basePoints, centroid, 0, 0, scale);
  const roofPoints = offsetBuildingPoints(
    scaledBasePoints,
    centroid,
    style.depthX ?? style.skew + 1.8,
    -(style.depthY ?? style.height),
    style.roofScale || 1.02
  );
  const shadowPoints = offsetBuildingPoints(
    scaledBasePoints,
    centroid,
    style.shadowOffsetX ?? style.skew + 2.2,
    style.shadowOffsetY ?? 2.4 + style.height * 0.24,
    1.018
  );
  const bounds = getProjectedBounds(scaledBasePoints);
  const frontEdge = getDominantBuildingEdge(scaledBasePoints, "y");
  const sideEdge = getDominantBuildingEdge(scaledBasePoints, "x", frontEdge);

  return {
    centroid,
    bounds,
    basePoints: scaledBasePoints,
    roofPoints,
    shadowPoints,
    frontEdge,
    sideEdge
  };
}

function createInstrumentedContext(context, metrics) {
  return {
    save(...args) {
      metrics.contextSaveCount += 1;
      return context.save(...args);
    },
    restore(...args) {
      metrics.contextRestoreCount += 1;
      return context.restore(...args);
    },
    beginPath(...args) {
      return context.beginPath(...args);
    },
    moveTo(...args) {
      return context.moveTo(...args);
    },
    lineTo(...args) {
      return context.lineTo(...args);
    },
    closePath(...args) {
      return context.closePath(...args);
    },
    fill(...args) {
      return context.fill(...args);
    },
    stroke(...args) {
      return context.stroke(...args);
    },
    quadraticCurveTo(...args) {
      return context.quadraticCurveTo(...args);
    },
    roundRect(...args) {
      return context.roundRect(...args);
    },
    arc(...args) {
      return context.arc(...args);
    },
    ellipse(...args) {
      return context.ellipse(...args);
    },
    rect(...args) {
      return context.rect(...args);
    },
    fillRect(...args) {
      return context.fillRect(...args);
    },
    strokeRect(...args) {
      return context.strokeRect(...args);
    },
    get fillStyle() {
      return context.fillStyle;
    },
    set fillStyle(value) {
      context.fillStyle = value;
    },
    get strokeStyle() {
      return context.strokeStyle;
    },
    set strokeStyle(value) {
      context.strokeStyle = value;
    },
    get lineWidth() {
      return context.lineWidth;
    },
    set lineWidth(value) {
      context.lineWidth = value;
    },
    get lineCap() {
      return context.lineCap;
    },
    set lineCap(value) {
      context.lineCap = value;
    },
    get lineJoin() {
      return context.lineJoin;
    },
    set lineJoin(value) {
      context.lineJoin = value;
    },
    get shadowBlur() {
      return context.shadowBlur;
    },
    set shadowBlur(value) {
      context.shadowBlur = value;
    },
    get shadowColor() {
      return context.shadowColor;
    },
    set shadowColor(value) {
      context.shadowColor = value;
    },
    get shadowOffsetX() {
      return context.shadowOffsetX;
    },
    set shadowOffsetX(value) {
      context.shadowOffsetX = value;
    },
    get shadowOffsetY() {
      return context.shadowOffsetY;
    },
    set shadowOffsetY(value) {
      context.shadowOffsetY = value;
    }
  };
}

function drawBuildingShadow(context, shadowPoints, style, zoom, cornerRadius) {
  context.shadowColor = `rgba(68, 57, 46, ${Math.max(
    0.05,
    style.shadowAlpha
  ).toFixed(2)})`;
  context.shadowBlur =
    zoom >= 18
      ? style.shadowBlur || 7.8
      : Math.max(4.8, (style.shadowBlur || 7.8) - 1.4);
  context.shadowOffsetY = style.shadowOffsetY || 2.2;
  context.shadowOffsetX = style.shadowOffsetX || 1.8;
  context.fillStyle = `rgba(68, 57, 46, ${(
    style.shadowAlpha * 0.82
  ).toFixed(2)})`;
  drawRoundedPolygonPath(context, shadowPoints, cornerRadius);
  context.fill();
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
}

function drawBuildingVerticalFace(
  context,
  facePoints,
  fill,
  stroke,
  lineWidth,
  cornerRadius,
  innerAlpha = 0.06
) {
  context.fillStyle = fill;
  drawRoundedPolygonPath(context, facePoints, cornerRadius);
  context.fill();

  context.fillStyle = `rgba(255,255,255,${innerAlpha.toFixed(2)})`;
  drawRoundedPolygonPath(
    context,
    offsetBuildingPoints(
      facePoints,
      getBuildingCentroid(facePoints),
      0,
      0,
      0.95
    ),
    Math.max(1.1, cornerRadius * 0.84)
  );
  context.fill();

  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;
  drawRoundedPolygonPath(context, facePoints, cornerRadius);
  context.stroke();
}

function drawBuildingRoof(context, roofPoints, style, roofCornerRadius) {
  context.fillStyle = style.roof.top;
  drawRoundedPolygonPath(context, roofPoints, roofCornerRadius);
  context.fill();

  const roofHighlightPoints = offsetBuildingPoints(
    roofPoints,
    getBuildingCentroid(roofPoints),
    0,
    0,
    style.roofInsetScale || 0.92
  );
  context.fillStyle = `rgba(255,255,255,${(
    style.roofHighlightAlpha || 0.08
  ).toFixed(2)})`;
  drawRoundedPolygonPath(
    context,
    roofHighlightPoints,
    Math.max(1.1, roofCornerRadius * 0.78)
  );
  context.fill();

  context.strokeStyle = style.roof.side;
  context.lineWidth = style.roofLineWidth;
  drawRoundedPolygonPath(context, roofPoints, roofCornerRadius);
  context.stroke();
}

function drawGeneric25DBuilding(context, points, style, zoom, geometry = null) {
  if (!Array.isArray(points) || points.length < 3) return;

  const buildingGeometry = geometry || getBuildingGeometry(points, style);
  const { basePoints, roofPoints, shadowPoints, frontEdge, sideEdge } =
    buildingGeometry;
  const baseCornerRadius = getSoftBuildingCornerRadius(
    basePoints,
    0.15,
    style.cornerRadius || 4
  );
  const roofCornerRadius = getSoftBuildingCornerRadius(
    roofPoints,
    0.13,
    Math.max(1.6, (style.cornerRadius || 4) - 0.4)
  );
  const faceRadius = Math.max(1.35, baseCornerRadius * 0.58);
  const frontFace = [
    basePoints[frontEdge.startIndex],
    basePoints[frontEdge.endIndex],
    roofPoints[frontEdge.endIndex],
    roofPoints[frontEdge.startIndex]
  ];
  const sideFace = [
    basePoints[sideEdge.startIndex],
    basePoints[sideEdge.endIndex],
    roofPoints[sideEdge.endIndex],
    roofPoints[sideEdge.startIndex]
  ];

  context.save();
  drawBuildingShadow(context, shadowPoints, style, zoom, baseCornerRadius);

  drawBuildingVerticalFace(
    context,
    sideFace,
    getBuildingTone(
      style.wall.side,
      Math.max(0.03, (style.sideShadeAlpha || 0.08) - 0.025)
    ),
    "rgba(102, 92, 84, 0.08)",
    style.bodyLineWidth,
    Math.max(1.25, faceRadius * 0.98),
    0.018
  );

  drawBuildingVerticalFace(
    context,
    frontFace,
    style.wall.front,
    "rgba(122, 110, 100, 0.08)",
    style.bodyLineWidth,
    Math.max(1.3, faceRadius * 1.02),
    Math.max(0.022, (style.wallHighlightAlpha || 0.05) - 0.012)
  );

  drawBuildingRoof(context, roofPoints, style, roofCornerRadius);

  if (zoom >= 18) {
    const roofRidge = getDominantBuildingEdge(roofPoints, "y", frontEdge);
    context.strokeStyle = "rgba(255,255,255,0.08)";
    context.lineWidth = 0.62;
    context.beginPath();
    context.moveTo(
      roofPoints[roofRidge.startIndex].x,
      roofPoints[roofRidge.startIndex].y
    );
    context.lineTo(
      roofPoints[roofRidge.endIndex].x,
      roofPoints[roofRidge.endIndex].y
    );
    context.stroke();
  }

  context.restore();
}

function drawShopIcon25D(context, x, y, width, height, iconKey, color) {
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = Math.max(0.8, width * 0.08);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (iconKey === "bread") {
    context.beginPath();
    context.roundRect(
      x - width * 0.3,
      y - height * 0.16,
      width * 0.6,
      height * 0.32,
      height * 0.16
    );
    context.stroke();
    context.beginPath();
    context.moveTo(x - width * 0.16, y - height * 0.14);
    context.lineTo(x - width * 0.08, y + height * 0.12);
    context.moveTo(x, y - height * 0.15);
    context.lineTo(x + width * 0.06, y + height * 0.12);
    context.moveTo(x + width * 0.14, y - height * 0.12);
    context.lineTo(x + width * 0.18, y + height * 0.12);
    context.stroke();
  } else if (iconKey === "cup") {
    context.beginPath();
    context.moveTo(x - width * 0.22, y - height * 0.1);
    context.lineTo(x + width * 0.16, y - height * 0.1);
    context.lineTo(x + width * 0.1, y + height * 0.18);
    context.lineTo(x - width * 0.16, y + height * 0.18);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(
      x + width * 0.2,
      y + height * 0.02,
      width * 0.08,
      -Math.PI * 0.5,
      Math.PI * 0.5
    );
    context.stroke();
  } else if (iconKey === "surfboard") {
    context.beginPath();
    context.ellipse(x, y, width * 0.12, height * 0.26, 0.28, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y - height * 0.2);
    context.lineTo(x, y + height * 0.22);
    context.stroke();
  } else if (iconKey === "fish") {
    context.beginPath();
    context.ellipse(x, y, width * 0.17, height * 0.12, 0, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(x + width * 0.17, y);
    context.lineTo(x + width * 0.28, y - height * 0.1);
    context.lineTo(x + width * 0.28, y + height * 0.1);
    context.closePath();
    context.stroke();
  } else if (iconKey === "cross") {
    context.fillRect(
      x - width * 0.05,
      y - height * 0.22,
      width * 0.1,
      height * 0.44
    );
    context.fillRect(
      x - width * 0.22,
      y - height * 0.05,
      width * 0.44,
      height * 0.1
    );
  } else if (iconKey === "house") {
    context.beginPath();
    context.moveTo(x - width * 0.22, y + height * 0.12);
    context.lineTo(x - width * 0.22, y - height * 0.02);
    context.lineTo(x, y - height * 0.22);
    context.lineTo(x + width * 0.22, y - height * 0.02);
    context.lineTo(x + width * 0.22, y + height * 0.12);
    context.closePath();
    context.stroke();
  } else if (iconKey === "bottle") {
    context.beginPath();
    context.roundRect(
      x - width * 0.08,
      y - height * 0.2,
      width * 0.16,
      height * 0.4,
      width * 0.06
    );
    context.stroke();
    context.fillRect(
      x - width * 0.03,
      y - height * 0.26,
      width * 0.06,
      height * 0.06
    );
  } else if (iconKey === "paper") {
    context.beginPath();
    context.rect(
      x - width * 0.18,
      y - height * 0.18,
      width * 0.32,
      height * 0.34
    );
    context.stroke();
    context.beginPath();
    context.moveTo(x - width * 0.12, y - height * 0.06);
    context.lineTo(x + width * 0.08, y - height * 0.06);
    context.moveTo(x - width * 0.12, y + 0.01);
    context.lineTo(x + width * 0.08, y + 0.01);
    context.stroke();
  } else if (iconKey === "hammer") {
    context.beginPath();
    context.moveTo(x - width * 0.18, y + height * 0.14);
    context.lineTo(x + width * 0.08, y - height * 0.12);
    context.stroke();
    context.beginPath();
    context.moveTo(x - width * 0.04, y - height * 0.14);
    context.lineTo(x + width * 0.16, y - height * 0.14);
    context.lineTo(x + width * 0.12, y - height * 0.02);
    context.lineTo(x - width * 0.08, y - height * 0.02);
    context.closePath();
    context.fill();
  } else if (iconKey === "basket") {
    context.beginPath();
    context.moveTo(x - width * 0.18, y - height * 0.02);
    context.lineTo(x - width * 0.12, y + height * 0.18);
    context.lineTo(x + width * 0.12, y + height * 0.18);
    context.lineTo(x + width * 0.18, y - height * 0.02);
    context.closePath();
    context.stroke();
    context.beginPath();
    context.arc(x, y - height * 0.04, width * 0.12, Math.PI, 0);
    context.stroke();
  }

  context.restore();
}

function drawShopOutsideDetail(context, x, y, size, detailKey, color) {
  if (!detailKey || detailKey === "none") return;

  context.save();
  context.fillStyle = color;
  context.strokeStyle = "rgba(76, 66, 58, 0.34)";
  context.lineWidth = 0.8;

  if (detailKey === "table") {
    context.beginPath();
    context.arc(x, y, size * 0.12, 0, Math.PI * 2);
    context.fill();
    context.fillRect(x - size * 0.02, y, size * 0.04, size * 0.14);
  } else if (detailKey === "signboard") {
    context.fillRect(x - size * 0.04, y - size * 0.1, size * 0.08, size * 0.22);
    context.fillRect(x - size * 0.12, y - size * 0.18, size * 0.24, size * 0.1);
  } else if (detailKey === "stand") {
    context.fillRect(x - size * 0.14, y - size * 0.1, size * 0.28, size * 0.16);
  } else if (detailKey === "cart") {
    context.beginPath();
    context.rect(x - size * 0.14, y - size * 0.1, size * 0.22, size * 0.12);
    context.stroke();
    context.beginPath();
    context.arc(x - size * 0.08, y + size * 0.05, size * 0.03, 0, Math.PI * 2);
    context.arc(x + size * 0.04, y + size * 0.05, size * 0.03, 0, Math.PI * 2);
    context.fill();
  } else if (detailKey === "rack") {
    context.strokeRect(x - size * 0.05, y - size * 0.18, size * 0.1, size * 0.3);
  } else if (detailKey === "crate") {
    context.fillRect(x - size * 0.08, y - size * 0.08, size * 0.16, size * 0.1);
  }

  context.restore();
}

function drawShop25D(context, points, style, zoom, recipeBundle, styleConfig) {
  if (!recipeBundle?.recipe) {
    drawGeneric25DBuilding(context, points, style, zoom);
    return;
  }

  const { recipe, variant } = recipeBundle;
  const compactScale = Math.min(0.94, recipe.sizeBias || 0.96);
  const softenedStyle = {
    ...style,
    height: Math.max(3.1, style.height * 0.86),
    skew: style.skew * 0.72,
    depthX: getBuildingDepth(style, zoom, 1.12).x,
    depthY: getBuildingDepth(style, zoom, 1.12).y,
    roofScale: Math.max(style.roofScale || 1.02, 1.022),
    roofInsetScale: Math.min(0.95, (style.roofInsetScale || 0.92) + 0.015),
    roofHighlightAlpha: Math.max(style.roofHighlightAlpha || 0.08, 0.086),
    shadowAlpha: Math.max(style.shadowAlpha || 0.06, 0.068),
    shadowOffsetX: Math.max(style.shadowOffsetX || 1.8, 2.05),
    shadowOffsetY: Math.max(style.shadowOffsetY || 2.2, 2.35),
    shadowBlur: Math.max(style.shadowBlur || 6.4, 6.9),
    cornerRadius: (style.cornerRadius || 3.2) + 0.55
  };
  const geometry = getBuildingGeometry(points, { ...softenedStyle }, compactScale);
  const { basePoints, bounds } = geometry;
  const centroid = getBuildingCentroid(basePoints);
  const frontTop = Math.min(
    basePoints[0].y,
    basePoints[1].y,
    basePoints[2].y,
    basePoints[3].y
  );
  const frontBottom = Math.max(
    basePoints[0].y,
    basePoints[1].y,
    basePoints[2].y,
    basePoints[3].y
  );
  const width = Math.max(12, bounds.maxX - bounds.minX);
  const height = Math.max(12, frontBottom - frontTop);

  context.save();
  drawGeneric25DBuilding(
    context,
    points,
    {
      ...softenedStyle,
      roof: recipe.palette.roof,
      wall: recipe.palette.wall,
      shadowAlpha: Math.max(style.shadowAlpha, 0.06)
    },
    zoom,
    geometry
  );

  const signHeight = Math.max(2.55, height * 0.088 * variant.signHeight);
  const signY = frontTop + height * 0.1;
  const signWidth = width * 0.49;
  const signX = centroid.x - signWidth * 0.5;

  context.fillStyle = "rgba(62, 53, 45, 0.10)";
  context.beginPath();
  context.roundRect(
    signX + 0.5,
    signY + 0.8,
    signWidth,
    signHeight,
    signHeight * 0.56
  );
  context.fill();

  context.fillStyle = recipe.palette.sign;
  context.beginPath();
  context.roundRect(signX, signY, signWidth, signHeight, signHeight * 0.56);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.05)";
  context.beginPath();
  context.roundRect(
    signX + signWidth * 0.08,
    signY + signHeight * 0.12,
    signWidth * 0.78,
    signHeight * 0.28,
    signHeight * 0.32
  );
  context.fill();

  const awningY = signY + signHeight + height * 0.04;
  const awningHeight = Math.max(3.05, height * 0.128 * variant.awningDepth);
  const awningInset = width * 0.12;
  const awningWidth = width - awningInset * 2;
  const awningX = bounds.minX + awningInset;

  context.fillStyle = "rgba(61, 52, 44, 0.06)";
  context.beginPath();
  context.moveTo(awningX + 0.5, awningY + 0.8);
  context.lineTo(awningX + awningWidth - 0.5, awningY + 0.8);
  context.lineTo(awningX + awningWidth * 0.94, awningY + awningHeight + 0.9);
  context.lineTo(awningX + awningWidth * 0.06, awningY + awningHeight + 0.9);
  context.closePath();
  context.fill();

  context.fillStyle = recipe.palette.awning;

  if (recipe.awning === "curved") {
    context.beginPath();
    context.moveTo(awningX, awningY);
    context.quadraticCurveTo(
      centroid.x,
      awningY + awningHeight,
      awningX + awningWidth,
      awningY
    );
    context.lineTo(awningX + awningWidth, awningY + awningHeight * 0.45);
    context.quadraticCurveTo(
      centroid.x,
      awningY + awningHeight * 1.25,
      awningX,
      awningY + awningHeight * 0.45
    );
    context.closePath();
    context.fill();
  } else {
    const topLift = recipe.awning === "shed" ? -awningHeight * 0.18 : 0;
    context.beginPath();
    context.moveTo(awningX, awningY + topLift);
    context.lineTo(awningX + awningWidth, awningY + topLift);
    context.lineTo(awningX + awningWidth * 0.95, awningY + awningHeight);
    context.lineTo(awningX + awningWidth * 0.05, awningY + awningHeight);
    context.closePath();
    context.fill();
  }
  context.fillStyle = "rgba(255,255,255,0.05)";
  context.fillRect(
    awningX + awningWidth * 0.08,
    awningY + awningHeight * 0.16,
    awningWidth * 0.74,
    Math.max(0.85, awningHeight * 0.15)
  );

  if (recipe.awning === "striped" && shouldDrawShopDetailsAtZoom(zoom, styleConfig)) {
    const stripeCount = 3 + (variant.detailVariant % 2);
    context.fillStyle = "rgba(255,255,255,0.22)";
    for (let index = 0; index < stripeCount; index += 1) {
      const stripeWidth = awningWidth / stripeCount;
      const stripeIndex = variant.stripeFlip ? index : stripeCount - index - 1;
      context.fillRect(
        awningX + stripeIndex * stripeWidth + stripeWidth * 0.18,
        awningY + awningHeight * 0.12,
        stripeWidth * 0.24,
        awningHeight * 0.62
      );
    }
  }

  const windowTop = awningY + awningHeight + height * 0.04;
  const windowBottom = frontBottom - height * 0.1;
  const windowHeight = Math.max(4, windowBottom - windowTop);
  const windowWidth = Math.max(4.5, (width * 0.62) / variant.windowCols);
  const windowGap = width * 0.035;
  const totalWindowWidth =
    variant.windowCols * windowWidth +
    Math.max(0, variant.windowCols - 1) * windowGap;
  const windowX = centroid.x - totalWindowWidth * 0.5;
  const doorWidth = Math.max(3.6, width * 0.14);
  const doorHeight = Math.max(5.8, height * 0.22);
  const doorX = centroid.x + width * variant.doorwayOffset - doorWidth * 0.5;
  const doorY = frontBottom - doorHeight - height * 0.035;

  context.fillStyle = recipe.palette.window;
  for (let index = 0; index < variant.windowCols; index += 1) {
    const x = windowX + index * (windowWidth + windowGap);
    if (x + windowWidth > doorX - 2 && x < doorX + doorWidth + 2) continue;
    context.beginPath();
    context.roundRect(
      x,
      windowTop,
      windowWidth,
      windowHeight,
      Math.min(4.5, windowWidth * 0.24)
    );
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.045)";
    context.beginPath();
    context.roundRect(
      x + windowWidth * 0.08,
      windowTop + windowHeight * 0.1,
      windowWidth * 0.32,
      windowHeight * 0.22,
      Math.min(2.4, windowWidth * 0.12)
    );
    context.fill();
    context.fillStyle = recipe.palette.window;
  }

  context.fillStyle = "rgba(62, 58, 57, 0.43)";
  context.beginPath();
  context.roundRect(
    doorX,
    doorY,
    doorWidth,
    doorHeight,
    Math.min(4.5, doorWidth * 0.24)
  );
  context.fill();

  if (shouldDrawShopDetailsAtZoom(zoom, styleConfig)) {
    drawShopIcon25D(
      context,
      centroid.x,
      signY + signHeight * 0.54,
      signWidth * 0.72,
      signHeight * 1.55,
      recipe.icon,
      "rgba(255, 252, 240, 0.84)"
    );

    drawShopOutsideDetail(
      context,
      bounds.minX + width * 0.16,
      frontBottom - height * 0.01,
      Math.min(width, height) * 0.7,
      recipe.outside,
      "rgba(119, 112, 92, 0.48)"
    );
  }

  context.restore();
}

function validateBuildingGeometry(feature) {
  if (!isObjectLike(feature)) {
    return { ok: false, reasonCode: "BUILDING_OBJECT_INVALID" };
  }

  if (Object.prototype.hasOwnProperty.call(feature, "geometryType")) {
    const geometryType = String(feature.geometryType || "").toLowerCase();
    if (geometryType && geometryType !== "polygon") {
      return { ok: false, reasonCode: "BUILDING_GEOMETRY_UNSUPPORTED" };
    }
  }

  if (!Array.isArray(feature.coords)) {
    return { ok: false, reasonCode: "BUILDING_GEOMETRY_INVALID" };
  }

  if (feature.coords.length < 3) {
    return { ok: false, reasonCode: "BUILDING_GEOMETRY_INVALID" };
  }

  for (const coordinate of feature.coords) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      return { ok: false, reasonCode: "BUILDING_GEOMETRY_INVALID" };
    }

    if (Array.isArray(coordinate[0])) {
      return { ok: false, reasonCode: "BUILDING_GEOMETRY_UNSUPPORTED" };
    }

    const latitude = Number(coordinate[0]);
    const longitude = Number(coordinate[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, reasonCode: "BUILDING_COORDINATE_INVALID" };
    }
  }

  return { ok: true, reasonCode: "BUILDING_GEOMETRY_VALIDATED" };
}

function validateZoom(zoom, styleConfig) {
  const numericZoom = Number(zoom);
  if (!Number.isFinite(numericZoom)) {
    return { ok: false, reasonCode: "INVALID_FROZEN_ZOOM" };
  }

  if (!shouldDrawBuildingAtZoom(numericZoom, styleConfig)) {
    return { ok: false, reasonCode: "UNSUPPORTED_CURRENT_ZOOM" };
  }

  return { ok: true, reasonCode: "FROZEN_ZOOM_VALIDATED", zoom: numericZoom };
}

function projectBuildingPoints(feature, viewportProjection, metrics) {
  const points = [];
  let insideViewport = false;

  for (const coordinate of feature.coords) {
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
    reasonCode: "BUILDING_POINTS_PROJECTED",
    points: deepFreeze(points.slice()),
    insideViewport
  };
}

function buildBaseMetrics({
  helperStatus,
  viewportValidated,
  zoom,
  buildingInputCount = 0,
  eligibleBuildingCount = 0,
  skippedBuildingCount = 0,
  malformedBuildingCount = 0,
  projectionRequestCount = 0,
  projectionSuccessCount = 0,
  projectionFailureCount = 0,
  drawAttemptCount = 0,
  completedBuildingDrawCount = 0,
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
    buildingInputCount,
    eligibleBuildingCount,
    skippedBuildingCount,
    malformedBuildingCount,
    projectionRequestCount,
    projectionSuccessCount,
    projectionFailureCount,
    drawAttemptCount,
    completedBuildingDrawCount,
    contextValidated,
    styleConfigValidated,
    geometryValidated,
    contextSaveCount,
    contextRestoreCount
  };
}

export function inspectGrowGoCustom25DBuildingsViewportDrawHelperSourceLock({
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
    drawCustom25DBuildingsFound: scriptSource.includes(
      "function drawCustom25DBuildings(ctx, bounds, topLeft) {"
    ),
    zoomGateFound: scriptSource.includes(
      "if (!shouldDrawBuildingAtZoom(map.getZoom())) return;"
    ),
    buildingSourceFound: scriptSource.includes(
      "if (!Array.isArray(custom25DBuildingFeatures) || !custom25DBuildingFeatures.length) return;"
    ),
    mapZoomReadFound: scriptSource.includes("const zoom = map.getZoom();"),
    viewportFilterFound: scriptSource.includes(
      "if (!feature.coords.some(([lat, lng]) => bounds.contains([lat, lng]))) return;"
    ),
    projectionFound: scriptSource.includes(
      "const points = projectCustom25DBuildingPoints(feature.coords, topLeft);"
    ),
    latLngToLayerPointFound: scriptSource.includes(
      "const point = map.latLngToLayerPoint([lat, lng]);"
    ),
    shopRecipeGlobalZoomFound:
      scriptSource.includes("const zoom = map?.getZoom?.() || 0;") ||
      scriptSource.includes(
        "const zoom = Number(zoomOverride) || 0;"
      ),
    drawOrderFound:
      scriptSource.includes("const style = getBuildingStyleForFeature(feature, zoom);") &&
      scriptSource.includes("const shopRecipe = getShopRecipeForFeature(feature);") &&
      scriptSource.includes("drawShop25D(ctx, points, style, zoom, shopRecipe);") &&
      scriptSource.includes("drawGeneric25DBuilding(ctx, points, style, zoom);")
  });

  const ok = Object.values(checks).every(Boolean);

  return deepFreeze({
    schemaId: SOURCE_LOCK_SCHEMA_ID,
    ok,
    reasonCode: ok ? "SOURCE_LOCK_CONFIRMED" : "SOURCE_LOCK_MISMATCH",
    classification: ok
      ? "BLOCKED_BY_LIVE_CALLSITE_COUPLING"
      : "BLOCKED_BY_BUILDING_GEOMETRY_CONTRACT_GAP",
    buildingDataSource: "custom25DBuildingFeatures",
    buildingSchema: deepFreeze([
      "feature.id",
      "feature.coords",
      "feature.center.lat",
      "feature.center.lng",
      "feature.buildingType",
      "feature.zoneType",
      "feature.shopTag",
      "feature.amenity",
      "feature.office",
      "feature.buildingArea",
      "feature.nearCoast"
    ]),
    geometryFormat: "polygon coords -> [latitude, longitude] tuples",
    zoomThresholds: deepFreeze({
      buildingMinimumZoom: 16.2,
      shopMinimumZoom: 16.8,
      shopDetailMinimumZoom: 18.2
    }),
    detailHelperDependencies: deepFreeze([
      "getBuildingStyleForFeature(feature, zoom)",
      "getShopRecipeForFeature(feature)",
      "drawGeneric25DBuilding(ctx, points, style, zoom)",
      "drawShop25D(ctx, points, style, zoom, shopRecipe)"
    ]),
    directGlobalReads: deepFreeze([
      "custom25DBuildingFeatures",
      "map.getZoom()",
      "bounds.contains([lat, lng])",
      "projectCustom25DBuildingPoints(feature.coords, topLeft)",
      "map.latLngToLayerPoint([lat, lng])",
      "getShopRecipeForFeature(feature) -> global-or-injected zoom fallback"
    ])
  });
}

export function createGrowGoCustom25DBuildingsViewportDrawHelper({
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
        buildingInputCount: metrics.buildingInputCount ?? 0,
        eligibleBuildingCount: metrics.eligibleBuildingCount ?? 0,
        skippedBuildingCount: metrics.skippedBuildingCount ?? 0,
        malformedBuildingCount: metrics.malformedBuildingCount ?? 0,
        projectionRequestCount: metrics.projectionRequestCount ?? 0,
        projectionSuccessCount: metrics.projectionSuccessCount ?? 0,
        projectionFailureCount: metrics.projectionFailureCount ?? 0,
        drawAttemptCount: metrics.drawAttemptCount ?? 0,
        completedBuildingDrawCount: metrics.completedBuildingDrawCount ?? 0,
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
    drawBuildings({ context, buildings } = {}) {
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

      const buildingsCheck = validateBuildingsInput(buildings);
      if (!buildingsCheck.ok) {
        currentStatus = freezeStatus({
          ...currentStatus,
          helperStatus: "failed_closed",
          reasonCode: buildingsCheck.reasonCode,
          viewportValidated: true,
          styleConfigValidated: true
        });
        return failResult(buildingsCheck.reasonCode, {
          zoom: zoomCheck.zoom,
          contextValidated: true,
          styleConfigValidated: true
        });
      }

      const metrics = buildBaseMetrics({
        helperStatus: "ready",
        viewportValidated: true,
        zoom: zoomCheck.zoom,
        buildingInputCount: buildings.length,
        eligibleBuildingCount: 0,
        skippedBuildingCount: 0,
        malformedBuildingCount: 0,
        projectionRequestCount: 0,
        projectionSuccessCount: 0,
        projectionFailureCount: 0,
        drawAttemptCount: 0,
        completedBuildingDrawCount: 0,
        contextValidated: true,
        styleConfigValidated: true,
        geometryValidated: true,
        contextSaveCount: 0,
        contextRestoreCount: 0
      });

      const instrumentedContext = createInstrumentedContext(context, metrics);
      const maxBuildings = getMaxBuildingsForZoom(zoomCheck.zoom, styleCheck.styleConfig);
      let drawn = 0;

      for (const feature of buildings) {
        if (drawn >= maxBuildings) {
          metrics.skippedBuildingCount += 1;
          continue;
        }

        const geometryCheck = validateBuildingGeometry(feature);
        if (!geometryCheck.ok) {
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode: geometryCheck.reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          metrics.malformedBuildingCount += 1;
          metrics.geometryValidated = false;
          return failResult(geometryCheck.reasonCode, metrics);
        }

        const projection = projectBuildingPoints(
          feature,
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
          metrics.skippedBuildingCount += 1;
          continue;
        }

        metrics.eligibleBuildingCount += 1;
        metrics.drawAttemptCount += 1;

        try {
          const style = getBuildingStyleForFeature(feature, zoomCheck.zoom);
          const shopRecipe = getShopRecipeForFeature(
            feature,
            zoomCheck.zoom,
            styleCheck.styleConfig
          );
          if (shopRecipe) {
            drawShop25D(
              instrumentedContext,
              projection.points,
              style,
              zoomCheck.zoom,
              shopRecipe,
              styleCheck.styleConfig
            );
          } else {
            drawGeneric25DBuilding(
              instrumentedContext,
              projection.points,
              style,
              zoomCheck.zoom
            );
          }
        } catch (error) {
          const reasonCode = toReasonCode(error, "BUILDING_DRAW_FAILED");
          currentStatus = freezeStatus({
            ...currentStatus,
            helperStatus: "failed_closed",
            reasonCode,
            viewportValidated: true,
            styleConfigValidated: true
          });
          return failResult(reasonCode, metrics);
        }

        metrics.completedBuildingDrawCount += 1;
        drawn += 1;
      }

      currentStatus = freezeStatus({
        ...currentStatus,
        helperStatus: "ready",
        reasonCode: "BUILDINGS_DRAW_READY",
        viewportValidated: true,
        styleConfigValidated: true
      });

      return createResult({
        outcome: "success",
        reasonCode: "BUILDINGS_DRAW_READY",
        ...metrics
      });
    }
  });
}
