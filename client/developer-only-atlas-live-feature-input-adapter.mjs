const STATUS_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_LIVE_FEATURE_INPUT_ADAPTER_STATUS_001";
const RESULT_SCHEMA_ID =
  "GROWGO_DEVELOPER_ONLY_ATLAS_LIVE_FEATURE_INPUT_ADAPTER_RESULT_001";

const FEATURE_CLASSES = Object.freeze([
  "vegetation_area",
  "park",
  "reserve",
  "coastal_green",
  "roadside_green",
  "civic_site",
  "sports_ground",
  "building_footprint",
  "unsupported"
]);

const DEFAULT_PREVIEW_BUDGET = Object.freeze({
  maxExtractedFeatures: 64,
  maxNormalizedFeatures: 48,
  maxPopulationCommands: 24
});

const FORBIDDEN_REFERENCE_KEYS = new Set([
  "map",
  "canvas",
  "pane",
  "leaflet",
  "renderer",
  "window",
  "document",
  "callback",
  "listener",
  "domNode",
  "element"
]);

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested, seen);
    }
  }
  return Object.freeze(value);
}

function canonicalSafetyFlags() {
  return deepFreeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function unavailable(reasonCode) {
  const fn = () => {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  };
  fn.__growgoUnavailable = true;
  return fn;
}

function isAvailableFunction(value) {
  return typeof value === "function" && value.__growgoUnavailable !== true;
}

function sanitizeString(value) {
  return value == null ? null : String(value);
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

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function ensurePlainObject(value, reasonCode) {
  if (!isPlainObject(value)) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return value;
}

function assertFiniteNumber(value, reasonCode) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
  return normalized;
}

function stableSerialize(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashString(input) {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let index = 0; index < input.length; index += 1) {
    const charCode = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ charCode, 2654435761);
    h2 = Math.imul(h2 ^ charCode, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, "0")}${(h1 >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function createClassificationCounts() {
  return {
    vegetation_area: 0,
    park: 0,
    reserve: 0,
    coastal_green: 0,
    roadside_green: 0,
    civic_site: 0,
    sports_ground: 0,
    building_footprint: 0,
    unsupported: 0
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    adapterReady: state.adapterReady,
    featureSourceAvailable: state.featureSourceAvailable,
    viewportIdentity: state.viewportIdentity,
    sourceFeatureCount: state.sourceFeatureCount,
    normalizedFeatureCount: state.normalizedFeatureCount,
    rejectedFeatureCount: state.rejectedFeatureCount,
    unsupportedFeatureCount: state.unsupportedFeatureCount,
    truncatedFeatureCount: state.truncatedFeatureCount,
    classificationCounts: deepFreeze({ ...state.classificationCounts }),
    populationPlanId: state.populationPlanId,
    batchId: state.batchId,
    submittedCommandCount: state.submittedCommandCount,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function normalizeBudget(budget = {}) {
  return deepFreeze({
    maxExtractedFeatures: Math.max(
      1,
      Number(budget.maxExtractedFeatures ?? DEFAULT_PREVIEW_BUDGET.maxExtractedFeatures)
    ),
    maxNormalizedFeatures: Math.max(
      1,
      Number(budget.maxNormalizedFeatures ?? DEFAULT_PREVIEW_BUDGET.maxNormalizedFeatures)
    ),
    maxPopulationCommands: Math.max(
      1,
      Number(budget.maxPopulationCommands ?? DEFAULT_PREVIEW_BUDGET.maxPopulationCommands)
    )
  });
}

function validateCoordinatePair(pair) {
  if (!Array.isArray(pair) || pair.length < 2) {
    throw Object.assign(new Error("RAW_FEATURE_COORDINATES_INVALID"), {
      reasonCode: "RAW_FEATURE_COORDINATES_INVALID"
    });
  }
  return deepFreeze([
    Number(assertFiniteNumber(pair[0], "RAW_FEATURE_COORDINATES_INVALID").toFixed(6)),
    Number(assertFiniteNumber(pair[1], "RAW_FEATURE_COORDINATES_INVALID").toFixed(6))
  ]);
}

function validateCoordinatePairs(coords) {
  if (!Array.isArray(coords)) {
    throw Object.assign(new Error("RAW_FEATURE_COORDINATES_INVALID"), {
      reasonCode: "RAW_FEATURE_COORDINATES_INVALID"
    });
  }
  return deepFreeze(coords.map(validateCoordinatePair));
}

function validateOptionalPoint(point) {
  if (point == null) {
    return null;
  }
  const normalized = ensurePlainObject(point, "RAW_LEAFLET_REFERENCE_DETECTED");
  for (const key of Object.keys(normalized)) {
    if (FORBIDDEN_REFERENCE_KEYS.has(key)) {
      throw Object.assign(new Error("RAW_LEAFLET_REFERENCE_DETECTED"), {
        reasonCode: "RAW_LEAFLET_REFERENCE_DETECTED"
      });
    }
  }
  const latitude = Number(normalized.latitude ?? normalized.lat);
  const longitude = Number(normalized.longitude ?? normalized.lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw Object.assign(new Error("RAW_FEATURE_COORDINATES_INVALID"), {
      reasonCode: "RAW_FEATURE_COORDINATES_INVALID"
    });
  }
  return deepFreeze({
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6))
  });
}

function assertNoUnexpectedRawFields(value, allowedKeys, reasonCode) {
  for (const [key, entry] of Object.entries(value)) {
    if (allowedKeys.has(key)) {
      continue;
    }
    if (FORBIDDEN_REFERENCE_KEYS.has(key)) {
      throw Object.assign(new Error(reasonCode), { reasonCode });
    }
    if (
      entry != null &&
      (typeof entry === "object" || typeof entry === "function")
    ) {
      throw Object.assign(new Error(reasonCode), { reasonCode });
    }
  }
}

function validateFeatureSource(featureSource) {
  const normalized = ensurePlainObject(
    featureSource,
    "FEATURE_SOURCE_UNAVAILABLE"
  );
  const zoneAllowedKeys = new Set([
    "id",
    "zoneType",
    "coords",
    "closed",
    "leisure",
    "landuse",
    "natural",
    "waterway",
    "boundary"
  ]);
  const buildingAllowedKeys = new Set([
    "id",
    "coords",
    "center",
    "buildingType",
    "shopTag",
    "amenity",
    "office",
    "cuisine",
    "tourism",
    "leisure",
    "landuse",
    "buildingArea",
    "nearCoast"
  ]);
  const roadAllowedKeys = new Set(["id", "highway", "coords"]);
  const zoneFeatures = Array.isArray(normalized.zoneFeatures)
    ? normalized.zoneFeatures.map((feature) => {
        const safe = ensurePlainObject(feature, "RAW_OSM_FEATURE_DETECTED");
        assertNoUnexpectedRawFields(
          safe,
          zoneAllowedKeys,
          "RAW_OSM_FEATURE_DETECTED"
        );
        return deepFreeze({
          id: sanitizeString(safe.id),
          zoneType: sanitizeString(safe.zoneType),
          coords: validateCoordinatePairs(safe.coords ?? []),
          closed: safe.closed === true,
          leisure: sanitizeString(safe.leisure),
          landuse: sanitizeString(safe.landuse),
          natural: sanitizeString(safe.natural),
          waterway: sanitizeString(safe.waterway),
          boundary: sanitizeString(safe.boundary)
        });
      })
    : [];
  const buildingFeatures = Array.isArray(normalized.buildingFeatures)
    ? normalized.buildingFeatures.map((feature) => {
        const safe = ensurePlainObject(feature, "RAW_OSM_FEATURE_DETECTED");
        assertNoUnexpectedRawFields(
          safe,
          buildingAllowedKeys,
          "RAW_OSM_FEATURE_DETECTED"
        );
        return deepFreeze({
          id: sanitizeString(safe.id),
          coords: validateCoordinatePairs(safe.coords ?? []),
          center: validateOptionalPoint(safe.center),
          buildingType: sanitizeString(safe.buildingType),
          shopTag: sanitizeString(safe.shopTag),
          amenity: sanitizeString(safe.amenity),
          office: sanitizeString(safe.office),
          cuisine: sanitizeString(safe.cuisine),
          tourism: sanitizeString(safe.tourism),
          leisure: sanitizeString(safe.leisure),
          landuse: sanitizeString(safe.landuse),
          buildingArea:
            safe.buildingArea == null
              ? null
              : Number(assertFiniteNumber(safe.buildingArea, "RAW_OSM_FEATURE_DETECTED")),
          nearCoast: safe.nearCoast === true
        });
      })
    : [];
  const roadWays = Array.isArray(normalized.roadWays)
    ? normalized.roadWays.map((feature) => {
        const safe = ensurePlainObject(feature, "RAW_OSM_FEATURE_DETECTED");
        assertNoUnexpectedRawFields(
          safe,
          roadAllowedKeys,
          "RAW_OSM_FEATURE_DETECTED"
        );
        return deepFreeze({
          id: sanitizeString(safe.id),
          highway: sanitizeString(safe.highway),
          coords: validateCoordinatePairs(safe.coords ?? [])
        });
      })
    : [];

  return deepFreeze({
    schemaId:
      sanitizeString(normalized.schemaId) ??
      "GROWGO_CUSTOM25D_CURRENT_VIEWPORT_FEATURE_SOURCE_001",
    zoneFeatures: deepFreeze(zoneFeatures),
    buildingFeatures: deepFreeze(buildingFeatures),
    roadWays: deepFreeze(roadWays)
  });
}

function validateViewportSnapshot(viewportSnapshot) {
  const safe = ensurePlainObject(viewportSnapshot, "INVALID_VIEWPORT");
  const bounds = ensurePlainObject(safe.bounds, "INVALID_VIEWPORT");
  const north = assertFiniteNumber(bounds.north, "INVALID_VIEWPORT");
  const south = assertFiniteNumber(bounds.south, "INVALID_VIEWPORT");
  const east = assertFiniteNumber(bounds.east, "INVALID_VIEWPORT");
  const west = assertFiniteNumber(bounds.west, "INVALID_VIEWPORT");
  const viewportIdentity = sanitizeString(safe.viewportIdentity);
  if (!viewportIdentity) {
    throw Object.assign(new Error("STALE_VIEWPORT_IDENTITY"), {
      reasonCode: "STALE_VIEWPORT_IDENTITY"
    });
  }
  return deepFreeze({
    viewportIdentity,
    mapIdentityId: sanitizeString(safe.mapIdentityId),
    regionId: sanitizeString(safe.regionId),
    packageId: sanitizeString(safe.packageId),
    recipeId: sanitizeString(safe.recipeId),
    selectorSeed: sanitizeString(safe.selectorSeed),
    zoom:
      safe.zoom == null ? null : Number(assertFiniteNumber(safe.zoom, "INVALID_VIEWPORT")),
    bounds: deepFreeze({
      north: Math.max(north, south),
      south: Math.min(north, south),
      east: Math.max(east, west),
      west: Math.min(east, west)
    })
  });
}

function validateIdentity(identity) {
  const safe = ensurePlainObject(identity, "ATLAS_IDENTITY_UNAVAILABLE");
  const normalized = deepFreeze({
    mapIdentityId: sanitizeString(safe.mapIdentityId),
    regionId: sanitizeString(safe.regionId),
    packageId: sanitizeString(safe.packageId),
    recipeId: sanitizeString(safe.recipeId),
    selectorSeed: sanitizeString(safe.selectorSeed)
  });
  if (!normalized.mapIdentityId) {
    throw Object.assign(new Error("STALE_VIEWPORT_IDENTITY"), {
      reasonCode: "STALE_VIEWPORT_IDENTITY"
    });
  }
  if (!normalized.regionId) {
    throw Object.assign(new Error("INVALID_REGION_ID"), {
      reasonCode: "INVALID_REGION_ID"
    });
  }
  if (!normalized.packageId) {
    throw Object.assign(new Error("INVALID_PACKAGE_ID"), {
      reasonCode: "INVALID_PACKAGE_ID"
    });
  }
  if (!normalized.recipeId) {
    throw Object.assign(new Error("INVALID_RECIPE_ID"), {
      reasonCode: "INVALID_RECIPE_ID"
    });
  }
  if (!normalized.selectorSeed) {
    throw Object.assign(new Error("SELECTOR_SEED_MISMATCH"), {
      reasonCode: "SELECTOR_SEED_MISMATCH"
    });
  }
  return normalized;
}

function ensureViewportIdentityMatches(viewport, identity) {
  if (viewport.mapIdentityId !== identity.mapIdentityId) {
    throw Object.assign(new Error("STALE_VIEWPORT_IDENTITY"), {
      reasonCode: "STALE_VIEWPORT_IDENTITY"
    });
  }
  if (viewport.regionId !== identity.regionId) {
    throw Object.assign(new Error("REGION_IDENTITY_MISMATCH"), {
      reasonCode: "REGION_IDENTITY_MISMATCH"
    });
  }
  if (viewport.packageId !== identity.packageId) {
    throw Object.assign(new Error("PACKAGE_IDENTITY_MISMATCH"), {
      reasonCode: "PACKAGE_IDENTITY_MISMATCH"
    });
  }
  if (viewport.recipeId !== identity.recipeId) {
    throw Object.assign(new Error("RECIPE_IDENTITY_MISMATCH"), {
      reasonCode: "RECIPE_IDENTITY_MISMATCH"
    });
  }
  if (viewport.selectorSeed !== identity.selectorSeed) {
    throw Object.assign(new Error("SELECTOR_SEED_MISMATCH"), {
      reasonCode: "SELECTOR_SEED_MISMATCH"
    });
  }
}

function pointInsideBounds(point, bounds) {
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  return (
    latitude <= bounds.north &&
    latitude >= bounds.south &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
}

function coordsIntersectBounds(coords, bounds) {
  return coords.some(([latitude, longitude]) =>
    pointInsideBounds({ latitude, longitude }, bounds)
  );
}

function coordsCentroid(coords) {
  const total = coords.reduce(
    (acc, [latitude, longitude]) => ({
      latitude: acc.latitude + latitude,
      longitude: acc.longitude + longitude
    }),
    { latitude: 0, longitude: 0 }
  );

  return deepFreeze({
    latitude: Number((total.latitude / coords.length).toFixed(6)),
    longitude: Number((total.longitude / coords.length).toFixed(6))
  });
}

function estimateArea(coords) {
  if (!Array.isArray(coords) || coords.length < 3) {
    return null;
  }

  const averageLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
  const metersPerDegLat = 111320;
  const metersPerDegLng = Math.cos((averageLat * Math.PI) / 180) * 111320;
  let area = 0;

  for (let index = 0; index < coords.length; index += 1) {
    const [lat1, lng1] = coords[index];
    const [lat2, lng2] = coords[(index + 1) % coords.length];
    const x1 = lng1 * metersPerDegLng;
    const y1 = lat1 * metersPerDegLat;
    const x2 = lng2 * metersPerDegLng;
    const y2 = lat2 * metersPerDegLat;
    area += x1 * y2 - x2 * y1;
  }

  return Number(Math.abs(area * 0.5).toFixed(2));
}

function estimateFootprint(coords) {
  if (!Array.isArray(coords) || coords.length < 2) {
    return deepFreeze({ width: null, height: null, orientationHint: null });
  }

  const latitudes = coords.map(([latitude]) => latitude);
  const longitudes = coords.map(([, longitude]) => longitude);
  const averageLat = latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length;
  const metersPerDegLat = 111320;
  const metersPerDegLng = Math.cos((averageLat * Math.PI) / 180) * 111320;
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const width = Number(((maxLng - minLng) * metersPerDegLng).toFixed(2));
  const height = Number(((maxLat - minLat) * metersPerDegLat).toFixed(2));

  let longestDistance = 0;
  let orientationHint = 0;
  for (let index = 0; index < coords.length; index += 1) {
    const [lat1, lng1] = coords[index];
    const [lat2, lng2] = coords[(index + 1) % coords.length];
    const dx = (lng2 - lng1) * metersPerDegLng;
    const dy = (lat2 - lat1) * metersPerDegLat;
    const distance = Math.hypot(dx, dy);
    if (distance > longestDistance) {
      longestDistance = distance;
      orientationHint = Number((Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(2));
    }
  }

  return deepFreeze({
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
    orientationHint
  });
}

function minimumRoadDistanceMeters(point, roadWays) {
  const latScale = 111320;
  const lngScale = Math.cos((point.latitude * Math.PI) / 180) * 111320;
  let minimum = Number.POSITIVE_INFINITY;

  for (const road of roadWays) {
    for (const [latitude, longitude] of road.coords) {
      const dx = (longitude - point.longitude) * lngScale;
      const dy = (latitude - point.latitude) * latScale;
      minimum = Math.min(minimum, Math.hypot(dx, dy));
    }
  }

  return minimum;
}

function minimumWaterDistanceMeters(point, zones) {
  const candidates = zones.filter((zone) =>
    ["water", "beach", "wetland"].includes(zone.zoneType)
  );
  const latScale = 111320;
  const lngScale = Math.cos((point.latitude * Math.PI) / 180) * 111320;
  let minimum = Number.POSITIVE_INFINITY;

  for (const zone of candidates) {
    const centroid = coordsCentroid(zone.coords);
    const dx = (centroid.longitude - point.longitude) * lngScale;
    const dy = (centroid.latitude - point.latitude) * latScale;
    minimum = Math.min(minimum, Math.hypot(dx, dy));
  }

  return minimum;
}

function classifyZoneFeature(feature, context) {
  const centroid = coordsCentroid(feature.coords);
  const nearRoad =
    minimumRoadDistanceMeters(centroid, context.roadWays) <= 28;
  const nearCoast =
    minimumWaterDistanceMeters(centroid, context.zoneFeatures) <= 180;

  if (feature.leisure === "nature_reserve" || feature.boundary === "national_park") {
    return { featureClass: "reserve", sourceClassification: "leisure:nature_reserve", sourceConfidence: 0.98 };
  }
  if (feature.leisure === "pitch" || feature.leisure === "sports_centre") {
    return { featureClass: "sports_ground", sourceClassification: `leisure:${feature.leisure}`, sourceConfidence: 0.98 };
  }
  if (feature.leisure === "park" || feature.leisure === "garden" || feature.leisure === "common") {
    if (nearCoast) {
      return { featureClass: "coastal_green", sourceClassification: `leisure:${feature.leisure}:near_coast`, sourceConfidence: 0.83 };
    }
    return { featureClass: "park", sourceClassification: `leisure:${feature.leisure}`, sourceConfidence: 0.96 };
  }
  if (
    feature.natural === "grassland" ||
    ["grass", "meadow", "village_green", "recreation_ground"].includes(feature.landuse)
  ) {
    if (nearRoad) {
      return { featureClass: "roadside_green", sourceClassification: "green:near_road", sourceConfidence: 0.77 };
    }
    if (nearCoast) {
      return { featureClass: "coastal_green", sourceClassification: "green:near_coast", sourceConfidence: 0.8 };
    }
    return { featureClass: "vegetation_area", sourceClassification: "green_area", sourceConfidence: 0.91 };
  }
  return { featureClass: "unsupported", sourceClassification: feature.zoneType ?? "unknown_zone", sourceConfidence: 0.25 };
}

function classifyBuildingFeature(feature) {
  const amenity = feature.amenity ?? "";
  const leisure = feature.leisure ?? "";
  if (["school", "community_centre", "townhall", "library", "civic"].includes(amenity)) {
    return { featureClass: "civic_site", sourceClassification: `amenity:${amenity}`, sourceConfidence: 0.9 };
  }
  if (["sports_centre", "stadium"].includes(leisure) || ["sports_centre"].includes(amenity)) {
    return { featureClass: "sports_ground", sourceClassification: leisure ? `leisure:${leisure}` : `amenity:${amenity}`, sourceConfidence: 0.88 };
  }
  if (feature.buildingType) {
    return { featureClass: "building_footprint", sourceClassification: `building:${feature.buildingType}`, sourceConfidence: 0.95 };
  }
  return { featureClass: "unsupported", sourceClassification: "building:unknown", sourceConfidence: 0.25 };
}

function toNormalizedZoneFeature(feature, viewportIdentity, context) {
  const classification = classifyZoneFeature(feature, context);
  const centroid = coordsCentroid(feature.coords);
  return deepFreeze({
    featureId: sanitizeString(feature.id),
    featureClass: classification.featureClass,
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    centroid,
    area: estimateArea(feature.coords),
    footprintWidth: null,
    footprintHeight: null,
    orientationHint: null,
    deterministicFeatureIdentity: `${viewportIdentity}:${sanitizeString(feature.id)}`,
    sourceClassification: classification.sourceClassification,
    sourceConfidence: classification.sourceConfidence,
    viewportIdentity
  });
}

function toNormalizedBuildingFeature(feature, viewportIdentity) {
  const classification = classifyBuildingFeature(feature);
  const centroid = feature.center ?? coordsCentroid(feature.coords);
  const footprint = estimateFootprint(feature.coords);
  return deepFreeze({
    featureId: sanitizeString(feature.id),
    featureClass: classification.featureClass,
    latitude: centroid.latitude,
    longitude: centroid.longitude,
    centroid,
    area:
      feature.buildingArea == null
        ? estimateArea(feature.coords)
        : Number(feature.buildingArea),
    footprintWidth: footprint.width,
    footprintHeight: footprint.height,
    orientationHint: footprint.orientationHint,
    deterministicFeatureIdentity: `${viewportIdentity}:${sanitizeString(feature.id)}`,
    sourceClassification: classification.sourceClassification,
    sourceConfidence: classification.sourceConfidence,
    viewportIdentity
  });
}

function byDeterministicIdentity(left, right) {
  const byIdentity = left.deterministicFeatureIdentity.localeCompare(
    right.deterministicFeatureIdentity
  );
  if (byIdentity !== 0) {
    return byIdentity;
  }
  return left.featureId.localeCompare(right.featureId);
}

function validateNoRawReferences(value, path = "normalizedFeature") {
  if (value == null) {
    return;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      validateNoRawReferences(entry, `${path}[${index}]`)
    );
    return;
  }
  if (!isPlainObject(value)) {
    throw Object.assign(new Error("RAW_BROWSER_REFERENCE_DETECTED"), {
      reasonCode: "RAW_BROWSER_REFERENCE_DETECTED"
    });
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_REFERENCE_KEYS.has(key)) {
      throw Object.assign(new Error("RAW_BROWSER_REFERENCE_DETECTED"), {
        reasonCode: "RAW_BROWSER_REFERENCE_DETECTED"
      });
    }
    validateNoRawReferences(nested, `${path}.${key}`);
  }
}

function toPlannerFeature(feature) {
  return deepFreeze({
    featureId: feature.featureId,
    featureClass: feature.featureClass,
    coordinate: deepFreeze({
      latitude: feature.latitude,
      longitude: feature.longitude
    }),
    area: feature.area,
    footprintScalars:
      feature.footprintWidth == null || feature.footprintHeight == null
        ? null
        : deepFreeze({
            width: feature.footprintWidth,
            height: feature.footprintHeight
          }),
    orientationHint: feature.orientationHint,
    deterministicFeatureIdentity: feature.deterministicFeatureIdentity
  });
}

export function createDeveloperOnlyAtlasLiveFeatureInputAdapter({
  featureSourceProvider = unavailable("FEATURE_SOURCE_UNAVAILABLE"),
  viewportProvider = unavailable("INVALID_VIEWPORT"),
  identityProvider = unavailable("ATLAS_IDENTITY_UNAVAILABLE")
} = {}) {
  const state = {
    adapterReady: false,
    featureSourceAvailable: false,
    viewportIdentity: null,
    sourceFeatureCount: 0,
    normalizedFeatureCount: 0,
    rejectedFeatureCount: 0,
    unsupportedFeatureCount: 0,
    truncatedFeatureCount: 0,
    classificationCounts: createClassificationCounts(),
    populationPlanId: null,
    batchId: null,
    submittedCommandCount: 0,
    lastFailureReason: null
  };

  try {
    state.adapterReady =
      isAvailableFunction(featureSourceProvider) &&
      isAvailableFunction(viewportProvider) &&
      isAvailableFunction(identityProvider);
  } catch {
    state.adapterReady = false;
  }

  return Object.freeze({
    __growgoDeveloperOnlyAtlasLiveFeatureInputAdapter: true,
    __state: state,
    __deps: {
      featureSourceProvider,
      viewportProvider,
      identityProvider
    }
  });
}

function requireAdapter(adapter) {
  if (
    !adapter?.__growgoDeveloperOnlyAtlasLiveFeatureInputAdapter ||
    !adapter.__state ||
    !adapter.__deps
  ) {
    throw Object.assign(
      new Error("ATLAS_LIVE_FEATURE_INPUT_ADAPTER_UNAVAILABLE"),
      { reasonCode: "ATLAS_LIVE_FEATURE_INPUT_ADAPTER_UNAVAILABLE" }
    );
  }
  return adapter;
}

export function extractDeveloperOnlyAtlasLiveViewportFeatures(
  adapter,
  { budget } = {}
) {
  requireAdapter(adapter);
  const state = adapter.__state;
  const deps = adapter.__deps;

  if (
    !isAvailableFunction(deps.featureSourceProvider) ||
    !isAvailableFunction(deps.viewportProvider) ||
    !isAvailableFunction(deps.identityProvider)
  ) {
    state.adapterReady = false;
    state.lastFailureReason = "ATLAS_LIVE_FEATURE_INPUT_ADAPTER_UNAVAILABLE";
    throw Object.assign(
      new Error("ATLAS_LIVE_FEATURE_INPUT_ADAPTER_UNAVAILABLE"),
      { reasonCode: "ATLAS_LIVE_FEATURE_INPUT_ADAPTER_UNAVAILABLE" }
    );
  }

  const normalizedBudget = normalizeBudget(budget);
  const featureSource = validateFeatureSource(deps.featureSourceProvider());
  const viewport = validateViewportSnapshot(deps.viewportProvider());
  const identity = validateIdentity(deps.identityProvider());
  ensureViewportIdentityMatches(viewport, identity);

  const sourceCandidates = [];
  for (const zone of featureSource.zoneFeatures) {
    if (coordsIntersectBounds(zone.coords, viewport.bounds)) {
      sourceCandidates.push(deepFreeze({ kind: "zone", feature: zone }));
    }
  }
  for (const building of featureSource.buildingFeatures) {
    if (coordsIntersectBounds(building.coords, viewport.bounds)) {
      sourceCandidates.push(deepFreeze({ kind: "building", feature: building }));
    }
  }

  const orderedCandidates = sourceCandidates.sort((left, right) =>
    sanitizeString(left.feature.id).localeCompare(sanitizeString(right.feature.id))
  );
  const extracted = orderedCandidates.slice(0, normalizedBudget.maxExtractedFeatures);
  const truncatedExtractedCount = Math.max(
    0,
    orderedCandidates.length - extracted.length
  );

  const normalizedFeatures = extracted.map((entry) =>
    entry.kind === "zone"
      ? toNormalizedZoneFeature(entry.feature, viewport.viewportIdentity, {
          zoneFeatures: featureSource.zoneFeatures,
          roadWays: featureSource.roadWays
        })
      : toNormalizedBuildingFeature(entry.feature, viewport.viewportIdentity)
  );

  normalizedFeatures.forEach((feature) => validateNoRawReferences(feature));

  const orderedNormalized = normalizedFeatures.sort(byDeterministicIdentity);
  const truncatedNormalized = orderedNormalized.slice(
    0,
    normalizedBudget.maxNormalizedFeatures
  );
  const truncatedNormalizedCount = Math.max(
    0,
    orderedNormalized.length - truncatedNormalized.length
  );

  const classificationCounts = createClassificationCounts();
  for (const feature of truncatedNormalized) {
    classificationCounts[feature.featureClass] += 1;
  }

  const plannerFeatures = truncatedNormalized
    .filter((feature) => feature.featureClass !== "unsupported")
    .map(toPlannerFeature);

  state.adapterReady = true;
  state.featureSourceAvailable = true;
  state.viewportIdentity = viewport.viewportIdentity;
  state.sourceFeatureCount = orderedCandidates.length;
  state.normalizedFeatureCount = truncatedNormalized.length;
  state.rejectedFeatureCount = truncatedExtractedCount + truncatedNormalizedCount;
  state.unsupportedFeatureCount = classificationCounts.unsupported;
  state.truncatedFeatureCount = truncatedExtractedCount + truncatedNormalizedCount;
  state.classificationCounts = classificationCounts;
  state.lastFailureReason = null;

  return deepFreeze({
    schemaId: RESULT_SCHEMA_ID,
    adapterReady: true,
    featureSourceAvailable: true,
    viewportIdentity: viewport.viewportIdentity,
    sourceFeatureCount: orderedCandidates.length,
    normalizedFeatureCount: truncatedNormalized.length,
    rejectedFeatureCount: state.rejectedFeatureCount,
    unsupportedFeatureCount: classificationCounts.unsupported,
    truncatedFeatureCount: state.truncatedFeatureCount,
    classificationCounts: deepFreeze({ ...classificationCounts }),
    budget: normalizedBudget,
    normalizedFeatures: deepFreeze(truncatedNormalized),
    plannerFeatures: deepFreeze(plannerFeatures),
    relationshipContext: deepFreeze({
      roadWays: featureSource.roadWays
    }),
    lastFailureReason: null,
    canonicalSafetyFlags: canonicalSafetyFlags(),
    deterministicSignature: hashString(
      stableSerialize({
        viewportIdentity: viewport.viewportIdentity,
        normalizedFeatures: truncatedNormalized
      })
    )
  });
}

export function getDeveloperOnlyAtlasLiveFeatureInputAdapterStatus(adapter) {
  if (!adapter?.__growgoDeveloperOnlyAtlasLiveFeatureInputAdapter) {
    return freezeStatus({
      adapterReady: false,
      featureSourceAvailable: false,
      viewportIdentity: null,
      sourceFeatureCount: 0,
      normalizedFeatureCount: 0,
      rejectedFeatureCount: 0,
      unsupportedFeatureCount: 0,
      truncatedFeatureCount: 0,
      classificationCounts: createClassificationCounts(),
      populationPlanId: null,
      batchId: null,
      submittedCommandCount: 0,
      lastFailureReason: "ATLAS_LIVE_FEATURE_INPUT_ADAPTER_UNAVAILABLE"
    });
  }

  return freezeStatus(adapter.__state);
}

export function refreshDeveloperOnlyAtlasLiveFeatureInputAdapter(
  adapter,
  { budget } = {}
) {
  requireAdapter(adapter);
  try {
    return extractDeveloperOnlyAtlasLiveViewportFeatures(adapter, { budget });
  } catch (error) {
    const state = adapter.__state;
    state.featureSourceAvailable = false;
    state.sourceFeatureCount = 0;
    state.normalizedFeatureCount = 0;
    state.rejectedFeatureCount = 0;
    state.unsupportedFeatureCount = 0;
    state.truncatedFeatureCount = 0;
    state.classificationCounts = createClassificationCounts();
    state.populationPlanId = null;
    state.batchId = null;
    state.submittedCommandCount = 0;
    state.lastFailureReason = toReasonCode(
      error,
      "ATLAS_LIVE_FEATURE_INPUT_REFRESH_FAILED"
    );
    return null;
  }
}

export function updateDeveloperOnlyAtlasLiveFeatureInputAdapterSubmissionState(
  adapter,
  { populationPlanId = null, batchId = null, submittedCommandCount = 0 } = {}
) {
  requireAdapter(adapter);
  adapter.__state.populationPlanId = sanitizeString(populationPlanId);
  adapter.__state.batchId = sanitizeString(batchId);
  adapter.__state.submittedCommandCount = Number(submittedCommandCount ?? 0);
  return getDeveloperOnlyAtlasLiveFeatureInputAdapterStatus(adapter);
}
