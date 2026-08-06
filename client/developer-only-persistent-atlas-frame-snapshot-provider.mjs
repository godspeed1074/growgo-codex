const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_FRAME_SNAPSHOT_PROVIDER_STATUS_001";
const SNAPSHOT_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_FRAME_SNAPSHOT_001";

const SUPPORTED_REDRAW_REASONS = new Set([
  "initial_attach",
  "moveend",
  "zoomend",
  "resize",
  "manual_redraw",
  "follow_up_redraw"
]);

const FORBIDDEN_REFERENCE_KEYS = new Set([
  "map",
  "canvas",
  "pane",
  "domNode",
  "element",
  "listener",
  "listeners",
  "callback",
  "callbacks",
  "scheduler",
  "schedulerHandle",
  "animationFrameHandle",
  "renderer",
  "rendererState",
  "lifecycleOwner",
  "bridge",
  "window",
  "document"
]);

const IDENTITY_KEYS = [
  "sessionId",
  "mapIdentityId",
  "lifecycleOwnerId",
  "lifecycleGenerationId",
  "surfaceOwnerId",
  "regionId",
  "packageId",
  "packageVersion",
  "packageFingerprint",
  "recipeId",
  "recipeVersion",
  "selectorSeed"
];

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

function isPointLike(value) {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.x === "number" &&
    typeof value.y === "number"
  );
}

function isLatLngLike(value) {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.lat === "number" &&
    typeof value.lng === "number"
  );
}

function isBoundsLike(value) {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.getNorthWest === "function" &&
    typeof value.getSouthEast === "function"
  );
}

function isDeeplyFrozen(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object") {
    return true;
  }

  if (seen.has(value)) {
    return true;
  }

  if (!Object.isFrozen(value)) {
    return false;
  }

  seen.add(value);
  return Object.values(value).every((nested) => isDeeplyFrozen(nested, seen));
}

function isSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function sanitizeScalarString(value) {
  return value == null ? null : String(value);
}

function sanitizeIdentityBundle({
  identitySnapshot = {},
  lifecycleIdentity = {}
} = {}) {
  return {
    sessionId: sanitizeScalarString(identitySnapshot.sessionId),
    mapIdentityId: sanitizeScalarString(identitySnapshot.mapIdentityId),
    lifecycleOwnerId: sanitizeScalarString(lifecycleIdentity.lifecycleOwnerId),
    lifecycleGenerationId: sanitizeScalarString(
      lifecycleIdentity.lifecycleGenerationId
    ),
    surfaceOwnerId: sanitizeScalarString(lifecycleIdentity.surfaceOwnerId),
    regionId: sanitizeScalarString(identitySnapshot.regionId),
    packageId: sanitizeScalarString(identitySnapshot.packageId),
    packageVersion: sanitizeScalarString(identitySnapshot.packageVersion),
    packageFingerprint: sanitizeScalarString(identitySnapshot.packageFingerprint),
    recipeId: sanitizeScalarString(identitySnapshot.recipeId),
    recipeVersion: sanitizeScalarString(identitySnapshot.recipeVersion),
    selectorSeed: sanitizeScalarString(identitySnapshot.selectorSeed)
  };
}

function identityComplete(identity) {
  return IDENTITY_KEYS.every(
    (key) => identity[key] != null && identity[key] !== ""
  );
}

function normalizeSnapshotValue(value) {
  if (value == null) {
    return value;
  }

  const valueType = typeof value;
  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return value;
  }

  if (valueType === "function" || valueType === "symbol") {
    throw Object.assign(new Error("RAW_REFERENCE_DETECTED"), {
      reasonCode: "RAW_REFERENCE_DETECTED"
    });
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSnapshotValue(entry));
  }

  if (isPointLike(value)) {
    return {
      x: Number(value.x),
      y: Number(value.y)
    };
  }

  if (isLatLngLike(value)) {
    return {
      lat: Number(value.lat),
      lng: Number(value.lng)
    };
  }

  if (isBoundsLike(value)) {
    return {
      northWest: normalizeSnapshotValue(value.getNorthWest()),
      southEast: normalizeSnapshotValue(value.getSouthEast())
    };
  }

  if (!isPlainObject(value)) {
    throw Object.assign(new Error("RAW_REFERENCE_DETECTED"), {
      reasonCode: "RAW_REFERENCE_DETECTED"
    });
  }

  const normalized = {};
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_REFERENCE_KEYS.has(key)) {
      throw Object.assign(new Error("RAW_REFERENCE_DETECTED"), {
        reasonCode: "RAW_REFERENCE_DETECTED"
      });
    }
    normalized[key] = normalizeSnapshotValue(nested);
  }
  return normalized;
}

function readDeps(provider, required = []) {
  const state = provider.__state;
  const deps = provider.__deps;
  const availability = required.every((name) => isAvailableFunction(deps[name]));
  state.providerReady = availability;

  if (!availability) {
    state.lastFailureReason = "SNAPSHOT_PROVIDER_UNAVAILABLE";
    throw Object.assign(new Error("SNAPSHOT_PROVIDER_UNAVAILABLE"), {
      reasonCode: "SNAPSHOT_PROVIDER_UNAVAILABLE"
    });
  }

  return deps;
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    state: state.state,
    providerReady: state.providerReady,
    snapshotPresent: state.snapshotPresent,
    snapshotValidated: state.snapshotValidated,
    released: state.released,
    failedClosed: state.failedClosed,
    snapshotId: state.snapshotId,
    snapshotGenerationId: state.snapshotGenerationId,
    sessionId: state.sessionId,
    mapIdentityId: state.mapIdentityId,
    lifecycleOwnerId: state.lifecycleOwnerId,
    lifecycleGenerationId: state.lifecycleGenerationId,
    surfaceOwnerId: state.surfaceOwnerId,
    redrawReason: state.redrawReason,
    snapshotCreateAttemptCount: state.snapshotCreateAttemptCount,
    snapshotCreateCompletedCount: state.snapshotCreateCompletedCount,
    snapshotValidationAttemptCount: state.snapshotValidationAttemptCount,
    snapshotValidationCompletedCount: state.snapshotValidationCompletedCount,
    snapshotReleaseAttemptCount: state.snapshotReleaseAttemptCount,
    snapshotReleaseCompletedCount: state.snapshotReleaseCompletedCount,
    freshSnapshotRequired: state.freshSnapshotRequired,
    priorSnapshotReuseDetected: state.priorSnapshotReuseDetected,
    rawReferenceDetected: state.rawReferenceDetected,
    readinessDriftDetected: state.readinessDriftDetected,
    identityMismatchDetected: state.identityMismatchDetected,
    lastMismatchField: state.lastMismatchField,
    lastFailureReason: state.lastFailureReason,
    referencesReleased: state.referencesReleased,
    boundRegionId: state.boundRegionId,
    boundPackageId: state.boundPackageId,
    boundPackageVersion: state.boundPackageVersion,
    boundPackageFingerprint: state.boundPackageFingerprint,
    boundRecipeId: state.boundRecipeId,
    boundRecipeVersion: state.boundRecipeVersion,
    boundSelectorSeed: state.boundSelectorSeed,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function syncState(provider) {
  const state = provider.__state;
  const internal = provider.__internal;
  state.snapshotPresent = !!internal.currentSnapshot;
  state.referencesReleased =
    internal.currentSnapshot == null &&
    internal.currentSnapshotReleased === true;
}

function setState(provider, next) {
  const state = provider.__state;
  state.state = next;
  state.snapshotValidated = next === "validated";
  state.released = next === "released";
  state.failedClosed = next === "failed_closed";
  syncState(provider);
}

function clearBindings(provider) {
  const state = provider.__state;
  state.snapshotId = null;
  state.snapshotGenerationId = null;
  state.sessionId = null;
  state.mapIdentityId = null;
  state.lifecycleOwnerId = null;
  state.lifecycleGenerationId = null;
  state.surfaceOwnerId = null;
  state.redrawReason = null;
  state.boundRegionId = null;
  state.boundPackageId = null;
  state.boundPackageVersion = null;
  state.boundPackageFingerprint = null;
  state.boundRecipeId = null;
  state.boundRecipeVersion = null;
  state.boundSelectorSeed = null;
}

function bindState(provider, snapshot) {
  const state = provider.__state;
  state.snapshotId = snapshot.snapshotId;
  state.snapshotGenerationId = snapshot.snapshotGenerationId;
  state.sessionId = snapshot.sessionId;
  state.mapIdentityId = snapshot.mapIdentityId;
  state.lifecycleOwnerId = snapshot.lifecycleOwnerId;
  state.lifecycleGenerationId = snapshot.lifecycleGenerationId;
  state.surfaceOwnerId = snapshot.surfaceOwnerId;
  state.redrawReason = snapshot.redrawReason;
  state.boundRegionId = snapshot.regionId;
  state.boundPackageId = snapshot.packageId;
  state.boundPackageVersion = snapshot.packageVersion;
  state.boundPackageFingerprint = snapshot.packageFingerprint;
  state.boundRecipeId = snapshot.recipeId;
  state.boundRecipeVersion = snapshot.recipeVersion;
  state.boundSelectorSeed = snapshot.selectorSeed;
}

function validateReadrawReason(reason) {
  const normalized = sanitizeScalarString(reason);
  if (!normalized || !SUPPORTED_REDRAW_REASONS.has(normalized)) {
    throw Object.assign(new Error("INVALID_REDRAW_REASON"), {
      reasonCode: "INVALID_REDRAW_REASON"
    });
  }
  return normalized;
}

function normalizeReadinessSnapshot(readinessSnapshot = {}) {
  return {
    diagnosticStatus: sanitizeScalarString(readinessSnapshot.diagnosticStatus),
    reasonCode: sanitizeScalarString(readinessSnapshot.reasonCode),
    regionId: sanitizeScalarString(readinessSnapshot.regionId),
    packageId: sanitizeScalarString(readinessSnapshot.packageId),
    packageVersion: sanitizeScalarString(readinessSnapshot.packageVersion),
    packageFingerprint: sanitizeScalarString(readinessSnapshot.packageFingerprint),
    recipeId: sanitizeScalarString(readinessSnapshot.recipeId),
    recipeVersion: sanitizeScalarString(readinessSnapshot.recipeVersion),
    selectorSeed: sanitizeScalarString(readinessSnapshot.selectorSeed)
  };
}

function ensureReadinessApproved(readinessSnapshot) {
  const normalized = normalizeReadinessSnapshot(readinessSnapshot);
  if (normalized.diagnosticStatus !== "approved") {
    throw Object.assign(
      new Error(normalized.reasonCode || "READINESS_BLOCKED"),
      {
        reasonCode: normalized.reasonCode || "READINESS_BLOCKED"
      }
    );
  }
  return normalized;
}

function readinessMatchesSnapshot(snapshot, readinessSnapshot) {
  return (
    readinessSnapshot.regionId === snapshot.regionId &&
    readinessSnapshot.packageId === snapshot.packageId &&
    readinessSnapshot.packageVersion === snapshot.packageVersion &&
    readinessSnapshot.packageFingerprint === snapshot.packageFingerprint &&
    readinessSnapshot.recipeId === snapshot.recipeId &&
    readinessSnapshot.recipeVersion === snapshot.recipeVersion &&
    readinessSnapshot.selectorSeed === snapshot.selectorSeed
  );
}

function determineMismatch(snapshot, currentIdentity, currentLifecycleIdentity) {
  if (currentIdentity.mapIdentityId !== snapshot.mapIdentityId) {
    return ["mapIdentityId", "MAP_IDENTITY_MISMATCH"];
  }
  if (currentIdentity.sessionId !== snapshot.sessionId) {
    return ["sessionId", "SESSION_IDENTITY_MISMATCH"];
  }
  if (currentLifecycleIdentity.lifecycleOwnerId !== snapshot.lifecycleOwnerId) {
    return ["lifecycleOwnerId", "LIFECYCLE_OWNER_MISMATCH"];
  }
  if (
    currentLifecycleIdentity.lifecycleGenerationId !==
    snapshot.lifecycleGenerationId
  ) {
    return ["lifecycleGenerationId", "LIFECYCLE_GENERATION_MISMATCH"];
  }
  if (currentLifecycleIdentity.surfaceOwnerId !== snapshot.surfaceOwnerId) {
    return ["surfaceOwnerId", "SURFACE_OWNER_MISMATCH"];
  }
  if (currentIdentity.regionId !== snapshot.regionId) {
    return ["regionId", "REGION_IDENTITY_MISMATCH"];
  }
  if (
    currentIdentity.packageId !== snapshot.packageId ||
    currentIdentity.packageVersion !== snapshot.packageVersion ||
    currentIdentity.packageFingerprint !== snapshot.packageFingerprint
  ) {
    return ["packageFingerprint", "PACKAGE_IDENTITY_MISMATCH"];
  }
  if (
    currentIdentity.recipeId !== snapshot.recipeId ||
    currentIdentity.recipeVersion !== snapshot.recipeVersion
  ) {
    return ["recipeVersion", "RECIPE_IDENTITY_MISMATCH"];
  }
  if (currentIdentity.selectorSeed !== snapshot.selectorSeed) {
    return ["selectorSeed", "SELECTOR_SEED_MISMATCH"];
  }
  return [null, null];
}

function buildNormalizedSnapshot({
  rawSnapshot,
  map,
  identity,
  lifecycleIdentity,
  redrawReason,
  snapshotId,
  snapshotGenerationId,
  snapshotCreatedAt
}) {
  const normalizedRawSnapshot = normalizeSnapshotValue(rawSnapshot);
  const bounds =
    normalizedRawSnapshot.projectedViewportBounds ??
    normalizedRawSnapshot.bounds ??
    (typeof map.getBounds === "function" ? map.getBounds() : null);
  const normalizedBounds = normalizeSnapshotValue(bounds);
  const normalizedSize =
    normalizedRawSnapshot.viewportSize != null ||
    normalizedRawSnapshot.size != null
      ? normalizeSnapshotValue(
          normalizedRawSnapshot.viewportSize ?? normalizedRawSnapshot.size
        )
      : Number.isFinite(Number(normalizedRawSnapshot.logicalWidth)) &&
          Number.isFinite(Number(normalizedRawSnapshot.logicalHeight))
        ? {
            x: Number(normalizedRawSnapshot.logicalWidth),
            y: Number(normalizedRawSnapshot.logicalHeight)
          }
        : normalizeSnapshotValue(
            typeof map.getSize === "function" ? map.getSize() : null
          );
  const normalizedCenter =
    normalizedRawSnapshot.center != null
      ? normalizeSnapshotValue(normalizedRawSnapshot.center)
      : normalizedBounds?.northWest != null &&
          normalizedBounds?.southEast != null
        ? {
            lat:
              (Number(normalizedBounds.northWest.lat) +
                Number(normalizedBounds.southEast.lat)) /
              2,
            lng:
              (Number(normalizedBounds.northWest.lng) +
                Number(normalizedBounds.southEast.lng)) /
              2
          }
        : normalizeSnapshotValue(
            typeof map.getCenter === "function" ? map.getCenter() : null
          );
  const normalizedPixelOrigin = normalizeSnapshotValue(
    normalizedRawSnapshot.pixelOrigin ??
      (typeof map.getPixelOrigin === "function" ? map.getPixelOrigin() : null)
  );
  const zoom =
    normalizedRawSnapshot.zoom ??
    (typeof map.getZoom === "function" ? map.getZoom() : null);
  const normalizedCanvasLayerPosition = normalizeSnapshotValue(
    normalizedRawSnapshot.canvasLayerPosition ??
      normalizedRawSnapshot.canvasPosition ??
      null
  );
  const normalizedProjectedViewportBounds =
    normalizedBounds == null
      ? null
      : normalizedBounds.northWest != null && normalizedBounds.southEast != null
        ? {
            northWestLatitude: normalizedBounds.northWest.lat ?? null,
            northWestLongitude: normalizedBounds.northWest.lng ?? null,
            southEastLatitude: normalizedBounds.southEast.lat ?? null,
            southEastLongitude: normalizedBounds.southEast.lng ?? null
          }
        : normalizedBounds.north != null &&
            normalizedBounds.south != null &&
            normalizedBounds.east != null &&
            normalizedBounds.west != null
          ? {
              northWestLatitude: normalizedBounds.north ?? null,
              northWestLongitude: normalizedBounds.west ?? null,
              southEastLatitude: normalizedBounds.south ?? null,
              southEastLongitude: normalizedBounds.east ?? null
            }
          : null;

  return deepFreeze({
    schemaId: SNAPSHOT_SCHEMA_ID,
    snapshotId,
    snapshotGenerationId,
    sessionId: identity.sessionId,
    mapIdentityId: identity.mapIdentityId,
    lifecycleOwnerId: lifecycleIdentity.lifecycleOwnerId,
    lifecycleGenerationId: lifecycleIdentity.lifecycleGenerationId,
    surfaceOwnerId: lifecycleIdentity.surfaceOwnerId,
    regionId: identity.regionId,
    packageId: identity.packageId,
    packageVersion: identity.packageVersion,
    packageFingerprint: identity.packageFingerprint,
    recipeId: identity.recipeId,
    recipeVersion: identity.recipeVersion,
    selectorSeed: identity.selectorSeed,
    redrawReason,
    snapshotCreatedAt,
    viewportWidth: normalizedSize?.x ?? null,
    viewportHeight: normalizedSize?.y ?? null,
    pixelRatio:
      normalizedRawSnapshot.pixelRatio == null &&
      normalizedRawSnapshot.devicePixelRatio == null
        ? null
        : Number(
            normalizedRawSnapshot.pixelRatio ??
              normalizedRawSnapshot.devicePixelRatio
          ),
    zoom: zoom == null ? null : Number(zoom),
    centerLatitude: normalizedCenter?.lat ?? null,
    centerLongitude: normalizedCenter?.lng ?? null,
    pixelOriginX: normalizedPixelOrigin?.x ?? null,
    pixelOriginY: normalizedPixelOrigin?.y ?? null,
    canvasLayerPositionX: normalizedCanvasLayerPosition?.x ?? null,
    canvasLayerPositionY: normalizedCanvasLayerPosition?.y ?? null,
    projectedViewportBounds:
      normalizedProjectedViewportBounds == null
        ? null
        : deepFreeze({
            northWestLatitude:
              normalizedProjectedViewportBounds.northWestLatitude ?? null,
            northWestLongitude:
              normalizedProjectedViewportBounds.northWestLongitude ?? null,
            southEastLatitude:
              normalizedProjectedViewportBounds.southEastLatitude ?? null,
            southEastLongitude:
              normalizedProjectedViewportBounds.southEastLongitude ?? null
          }),
    scalarPayload: normalizedRawSnapshot.scalarPayload ?? {}
  });
}

export function normalizePersistentAtlasFrameSnapshotForContract(args) {
  return buildNormalizedSnapshot(args);
}

export function toOneFrameViewportSnapshotContract(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw Object.assign(new Error("FRAME_VIEWPORT_SNAPSHOT_INVALID"), {
      reasonCode: "FRAME_VIEWPORT_SNAPSHOT_INVALID"
    });
  }

  const northLatitude = Number(
    snapshot.projectedViewportBounds?.northWestLatitude
  );
  const southLatitude = Number(
    snapshot.projectedViewportBounds?.southEastLatitude
  );
  const westLongitude = Number(
    snapshot.projectedViewportBounds?.northWestLongitude
  );
  const eastLongitude = Number(
    snapshot.projectedViewportBounds?.southEastLongitude
  );
  const north = Math.max(northLatitude, southLatitude);
  const south = Math.min(northLatitude, southLatitude);
  const west = Math.min(westLongitude, eastLongitude);
  const east = Math.max(westLongitude, eastLongitude);
  const logicalWidth = Number(snapshot.viewportWidth);
  const logicalHeight = Number(snapshot.viewportHeight);
  const devicePixelRatio = Number(snapshot.pixelRatio);
  const zoom = Number(snapshot.zoom);
  const canvasLayerPositionX = Number(snapshot.canvasLayerPositionX);
  const canvasLayerPositionY = Number(snapshot.canvasLayerPositionY);

  return deepFreeze({
    schemaId: "GROWGO_CUSTOM25D_FRAME_VIEWPORT_SNAPSHOT_001",
    logicalWidth,
    logicalHeight,
    backingWidth: Math.round(logicalWidth * devicePixelRatio),
    backingHeight: Math.round(logicalHeight * devicePixelRatio),
    devicePixelRatio,
    bounds: deepFreeze({ north, south, east, west }),
    northWestCoordinate: deepFreeze({
      latitude: north,
      longitude: west
    }),
    canvasLayerPosition: deepFreeze({
      x: canvasLayerPositionX,
      y: canvasLayerPositionY
    }),
    zoom,
    mapIdentityValidated: true,
    canvasIdentityValidated: true,
    snapshotCreated: true,
    drawRequested: false,
    listenerAdded: false,
    retentionWritten: false
  });
}

export function createPersistentAtlasFrameSnapshotProvider({
  oneFrameSnapshotProvider = unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE"),
  mapProvider = unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE"),
  readinessProvider = unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE"),
  identityProvider = unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE"),
  lifecycleIdentityProvider = unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE"),
  snapshotReleaseProvider = unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE"),
  timeProvider = unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE")
} = {}) {
  const state = {
    state: "empty",
    providerReady: false,
    snapshotPresent: false,
    snapshotValidated: false,
    released: false,
    failedClosed: false,
    snapshotId: null,
    snapshotGenerationId: null,
    sessionId: null,
    mapIdentityId: null,
    lifecycleOwnerId: null,
    lifecycleGenerationId: null,
    surfaceOwnerId: null,
    redrawReason: null,
    snapshotCreateAttemptCount: 0,
    snapshotCreateCompletedCount: 0,
    snapshotValidationAttemptCount: 0,
    snapshotValidationCompletedCount: 0,
    snapshotReleaseAttemptCount: 0,
    snapshotReleaseCompletedCount: 0,
    freshSnapshotRequired: true,
    priorSnapshotReuseDetected: false,
    rawReferenceDetected: false,
    readinessDriftDetected: false,
    identityMismatchDetected: false,
    lastMismatchField: null,
    lastFailureReason: null,
    referencesReleased: true,
    boundRegionId: null,
    boundPackageId: null,
    boundPackageVersion: null,
    boundPackageFingerprint: null,
    boundRecipeId: null,
    boundRecipeVersion: null,
    boundSelectorSeed: null
  };

  const internal = {
    generationCounter: 0,
    snapshotCounter: 0,
    currentSnapshot: null,
    currentSnapshotReleased: true,
    releasedSnapshotIds: new Set()
  };

  return Object.freeze({
    __growgoPersistentAtlasFrameSnapshotProvider: true,
    __state: state,
    __internal: internal,
    __deps: {
      oneFrameSnapshotProvider,
      mapProvider,
      readinessProvider,
      identityProvider,
      lifecycleIdentityProvider,
      snapshotReleaseProvider,
      timeProvider
    }
  });
}

export function createPersistentAtlasFrameSnapshot(
  provider,
  { redrawReason } = {}
) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("SNAPSHOT_PROVIDER_UNAVAILABLE"), {
      reasonCode: "SNAPSHOT_PROVIDER_UNAVAILABLE"
    });
  }

  state.snapshotCreateAttemptCount += 1;
  state.priorSnapshotReuseDetected = false;
  state.rawReferenceDetected = false;
  state.readinessDriftDetected = false;
  state.identityMismatchDetected = false;
  state.lastMismatchField = null;

  const deps = readDeps(provider, [
    "oneFrameSnapshotProvider",
    "mapProvider",
    "readinessProvider",
    "identityProvider",
    "lifecycleIdentityProvider",
    "snapshotReleaseProvider",
    "timeProvider"
  ]);

  setState(provider, "creating");

  try {
    const normalizedReason = validateReadrawReason(redrawReason);
    const mapResult = deps.mapProvider();
    const map = mapResult?.map ?? mapResult?.rawLeafletMapReference ?? null;
    const mapIdentityId = sanitizeScalarString(mapResult?.mapIdentityId);
    if (!map || !mapIdentityId) {
      throw Object.assign(new Error("SNAPSHOT_CREATION_FAILED"), {
        reasonCode: "SNAPSHOT_CREATION_FAILED"
      });
    }

    const readinessSnapshot = ensureReadinessApproved(deps.readinessProvider());
    const identity = sanitizeIdentityBundle({
      identitySnapshot: deps.identityProvider()
    });
    const lifecycleIdentity = sanitizeIdentityBundle({
      lifecycleIdentity: deps.lifecycleIdentityProvider()
    });
    const combinedIdentity = {
      ...identity,
      lifecycleOwnerId: lifecycleIdentity.lifecycleOwnerId,
      lifecycleGenerationId: lifecycleIdentity.lifecycleGenerationId,
      surfaceOwnerId: lifecycleIdentity.surfaceOwnerId,
      mapIdentityId
    };

    if (!identityComplete(combinedIdentity)) {
      throw Object.assign(new Error("SNAPSHOT_IDENTITY_INCOMPLETE"), {
        reasonCode: "SNAPSHOT_IDENTITY_INCOMPLETE"
      });
    }

    internal.generationCounter += 1;
    internal.snapshotCounter += 1;
    const snapshotGenerationId = `SNAPSHOT_GENERATION_${String(
      internal.generationCounter
    ).padStart(3, "0")}`;
    const snapshotId = `PERSISTENT_ATLAS_SNAPSHOT_${String(
      internal.snapshotCounter
    ).padStart(3, "0")}`;
    const snapshotCreatedAt = sanitizeScalarString(deps.timeProvider());

    const rawSnapshot = deps.oneFrameSnapshotProvider({
      map,
      mapIdentityId,
      readinessSnapshot,
      identitySnapshot: combinedIdentity,
      lifecycleIdentity,
      redrawReason: normalizedReason,
      snapshotId,
      snapshotGenerationId,
      snapshotCreatedAt
    });

    if (!rawSnapshot || typeof rawSnapshot !== "object") {
      throw Object.assign(new Error("INVALID_SNAPSHOT_SHAPE"), {
        reasonCode: "INVALID_SNAPSHOT_SHAPE"
      });
    }

    const snapshot = buildNormalizedSnapshot({
      rawSnapshot,
      map,
      identity: combinedIdentity,
      lifecycleIdentity,
      redrawReason: normalizedReason,
      snapshotId,
      snapshotGenerationId,
      snapshotCreatedAt
    });

    if (!isSerializable(snapshot)) {
      throw Object.assign(new Error("SNAPSHOT_NOT_SERIALIZABLE"), {
        reasonCode: "SNAPSHOT_NOT_SERIALIZABLE"
      });
    }

    internal.currentSnapshot = snapshot;
    internal.currentSnapshotReleased = false;
    bindState(provider, snapshot);
    state.snapshotCreateCompletedCount += 1;
    state.freshSnapshotRequired = false;
    state.lastFailureReason = null;
    setState(provider, "snapshot_ready");
    return snapshot;
  } catch (error) {
    const reasonCode = toReasonCode(error, "SNAPSHOT_CREATION_FAILED");
    state.rawReferenceDetected = reasonCode === "RAW_REFERENCE_DETECTED";
    state.lastFailureReason = reasonCode;
    setState(provider, "failed_closed");
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
}

export function validatePersistentAtlasFrameSnapshot(provider, snapshot) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("SNAPSHOT_PROVIDER_UNAVAILABLE"), {
      reasonCode: "SNAPSHOT_PROVIDER_UNAVAILABLE"
    });
  }

  state.snapshotValidationAttemptCount += 1;
  state.priorSnapshotReuseDetected = false;
  state.rawReferenceDetected = false;
  state.readinessDriftDetected = false;
  state.identityMismatchDetected = false;
  state.lastMismatchField = null;

  if (state.failedClosed) {
    state.lastFailureReason = "SNAPSHOT_WRAPPER_FAILED_CLOSED";
    throw Object.assign(new Error("SNAPSHOT_WRAPPER_FAILED_CLOSED"), {
      reasonCode: "SNAPSHOT_WRAPPER_FAILED_CLOSED"
    });
  }

  const deps = readDeps(provider, [
    "mapProvider",
    "readinessProvider",
    "identityProvider",
    "lifecycleIdentityProvider"
  ]);

  setState(provider, "validating");

  if (!snapshot || snapshot.schemaId !== SNAPSHOT_SCHEMA_ID) {
    state.lastFailureReason = "INVALID_SNAPSHOT_SHAPE";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("INVALID_SNAPSHOT_SHAPE"), {
      reasonCode: "INVALID_SNAPSHOT_SHAPE"
    });
  }

  if (!isDeeplyFrozen(snapshot)) {
    state.lastFailureReason = "SNAPSHOT_NOT_IMMUTABLE";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("SNAPSHOT_NOT_IMMUTABLE"), {
      reasonCode: "SNAPSHOT_NOT_IMMUTABLE"
    });
  }

  if (!isSerializable(snapshot)) {
    state.lastFailureReason = "SNAPSHOT_NOT_SERIALIZABLE";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("SNAPSHOT_NOT_SERIALIZABLE"), {
      reasonCode: "SNAPSHOT_NOT_SERIALIZABLE"
    });
  }

  validateReadrawReason(snapshot.redrawReason);

  if (internal.releasedSnapshotIds.has(snapshot.snapshotId)) {
    state.lastFailureReason = "SNAPSHOT_ALREADY_RELEASED";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("SNAPSHOT_ALREADY_RELEASED"), {
      reasonCode: "SNAPSHOT_ALREADY_RELEASED"
    });
  }

  if (!internal.currentSnapshot) {
    state.lastFailureReason = "SNAPSHOT_GENERATION_MISMATCH";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("SNAPSHOT_GENERATION_MISMATCH"), {
      reasonCode: "SNAPSHOT_GENERATION_MISMATCH"
    });
  }

  if (snapshot.snapshotId !== internal.currentSnapshot.snapshotId) {
    state.priorSnapshotReuseDetected = true;
    state.lastFailureReason = "SNAPSHOT_REUSE_DETECTED";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("SNAPSHOT_REUSE_DETECTED"), {
      reasonCode: "SNAPSHOT_REUSE_DETECTED"
    });
  }

  if (
    snapshot.snapshotGenerationId !==
    internal.currentSnapshot.snapshotGenerationId
  ) {
    state.lastFailureReason = "SNAPSHOT_GENERATION_MISMATCH";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("SNAPSHOT_GENERATION_MISMATCH"), {
      reasonCode: "SNAPSHOT_GENERATION_MISMATCH"
    });
  }

  const readinessSnapshot = ensureReadinessApproved(deps.readinessProvider());
  if (!readinessMatchesSnapshot(snapshot, readinessSnapshot)) {
    state.readinessDriftDetected = true;
    state.lastFailureReason = "READINESS_DRIFT_DETECTED";
    setState(provider, "failed_closed");
    throw Object.assign(new Error("READINESS_DRIFT_DETECTED"), {
      reasonCode: "READINESS_DRIFT_DETECTED"
    });
  }

  const mapResult = deps.mapProvider();
  const currentIdentity = {
    ...sanitizeIdentityBundle({
      identitySnapshot: deps.identityProvider()
    }),
    mapIdentityId: sanitizeScalarString(mapResult?.mapIdentityId)
  };
  const currentLifecycleIdentity = sanitizeIdentityBundle({
    lifecycleIdentity: deps.lifecycleIdentityProvider()
  });

  const [mismatchField, mismatchReason] = determineMismatch(
    snapshot,
    currentIdentity,
    currentLifecycleIdentity
  );
  if (mismatchReason) {
    state.identityMismatchDetected = true;
    state.lastMismatchField = mismatchField;
    state.lastFailureReason = mismatchReason;
    setState(provider, "failed_closed");
    throw Object.assign(new Error(mismatchReason), {
      reasonCode: mismatchReason
    });
  }

  state.snapshotValidationCompletedCount += 1;
  state.lastFailureReason = null;
  bindState(provider, snapshot);
  setState(provider, "validated");
  return snapshot;
}

export function releasePersistentAtlasFrameSnapshot(provider, snapshot = null) {
  const state = provider?.__state;
  const internal = provider?.__internal;
  if (!state || !internal) {
    throw Object.assign(new Error("SNAPSHOT_PROVIDER_UNAVAILABLE"), {
      reasonCode: "SNAPSHOT_PROVIDER_UNAVAILABLE"
    });
  }

  state.snapshotReleaseAttemptCount += 1;

  const targetSnapshot = snapshot ?? internal.currentSnapshot;
  if (!targetSnapshot) {
    state.lastFailureReason = null;
    return deepFreeze({
      released: true,
      reasonCode: "RELEASED"
    });
  }

  if (internal.releasedSnapshotIds.has(targetSnapshot.snapshotId)) {
    state.lastFailureReason = null;
    return deepFreeze({
      released: true,
      reasonCode: "RELEASED"
    });
  }

  const deps = readDeps(provider, ["snapshotReleaseProvider"]);
  setState(provider, "releasing");

  try {
    deps.snapshotReleaseProvider({
      snapshotId: targetSnapshot.snapshotId,
      snapshotGenerationId: targetSnapshot.snapshotGenerationId,
      redrawReason: targetSnapshot.redrawReason
    });
    internal.releasedSnapshotIds.add(targetSnapshot.snapshotId);

    if (
      internal.currentSnapshot &&
      internal.currentSnapshot.snapshotId === targetSnapshot.snapshotId
    ) {
      internal.currentSnapshot = null;
      internal.currentSnapshotReleased = true;
      clearBindings(provider);
    }

    state.snapshotReleaseCompletedCount += 1;
    state.freshSnapshotRequired = true;
    state.lastFailureReason = null;
    setState(provider, "released");
    return deepFreeze({
      released: true,
      reasonCode: "RELEASED"
    });
  } catch (error) {
    const reasonCode = toReasonCode(error, "SNAPSHOT_RELEASE_FAILED");
    state.lastFailureReason = reasonCode;
    setState(provider, "failed_closed");
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }
}

export function getPersistentAtlasFrameSnapshotStatus(provider) {
  const state = provider?.__state;
  if (!state) {
    return freezeStatus({
      state: "unavailable",
      providerReady: false,
      snapshotPresent: false,
      snapshotValidated: false,
      released: false,
      failedClosed: true,
      snapshotId: null,
      snapshotGenerationId: null,
      sessionId: null,
      mapIdentityId: null,
      lifecycleOwnerId: null,
      lifecycleGenerationId: null,
      surfaceOwnerId: null,
      redrawReason: null,
      snapshotCreateAttemptCount: 0,
      snapshotCreateCompletedCount: 0,
      snapshotValidationAttemptCount: 0,
      snapshotValidationCompletedCount: 0,
      snapshotReleaseAttemptCount: 0,
      snapshotReleaseCompletedCount: 0,
      freshSnapshotRequired: true,
      priorSnapshotReuseDetected: false,
      rawReferenceDetected: false,
      readinessDriftDetected: false,
      identityMismatchDetected: false,
      lastMismatchField: null,
      lastFailureReason: "SNAPSHOT_PROVIDER_UNAVAILABLE",
      referencesReleased: false,
      boundRegionId: null,
      boundPackageId: null,
      boundPackageVersion: null,
      boundPackageFingerprint: null,
      boundRecipeId: null,
      boundRecipeVersion: null,
      boundSelectorSeed: null
    });
  }

  syncState(provider);
  return freezeStatus(state);
}
