const STATUS_SCHEMA_ID = "GROWGO_PERSISTENT_ATLAS_MAP_PROVIDER_STATUS_001";

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

function isMapShaped(map) {
  return Boolean(
    map &&
      typeof map.getSize === "function" &&
      typeof map.getBounds === "function" &&
      typeof map.latLngToLayerPoint === "function" &&
      typeof map.on === "function" &&
      typeof map.off === "function"
  );
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    providerReady: state.providerReady,
    mapResolved: state.mapResolved,
    mapShapeValid: state.mapShapeValid,
    mapIdentityId: state.mapIdentityId,
    staleReferenceDetected: state.staleReferenceDetected,
    replacementDetected: state.replacementDetected,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

export function createPersistentAtlasMapProvider({
  realMapBridgeProvider = unavailable("MAP_PROVIDER_UNAVAILABLE")
} = {}) {
  const identityTokens = new WeakMap();
  let identityCounter = 0;

  const state = {
    providerReady: isAvailableFunction(realMapBridgeProvider),
    mapResolved: false,
    mapShapeValid: false,
    mapIdentityId: null,
    staleReferenceDetected: false,
    replacementDetected: false,
    lastFailureReason: null
  };

  const internal = {
    bridgeProvider: realMapBridgeProvider,
    boundMapReference: null,
    boundMapIdentityId: null
  };

  function assignIdentity(map, providerResult) {
    const providedIdentity =
      providerResult?.mapIdentityId ??
      providerResult?.identity?.mapIdentityId ??
      providerResult?.identity?.mapIdentity ??
      providerResult?.mapIdentity ??
      null;

    if (providedIdentity != null) {
      return String(providedIdentity);
    }

    if (!identityTokens.has(map)) {
      identityCounter += 1;
      identityTokens.set(map, `PERSISTENT_ATLAS_MAP_${String(identityCounter).padStart(3, "0")}`);
    }

    return identityTokens.get(map);
  }

  return Object.freeze({
    __growgoPersistentAtlasMapProvider: true,
    __internal: internal,
    __state: state,
    __assignIdentity: assignIdentity
  });
}

export function resolvePersistentAtlasMap(
  provider,
  {
    storedMapReference = null,
    expectedMapIdentityId = null
  } = {}
) {
  const internal = provider?.__internal;
  const state = provider?.__state;

  if (!internal || !state) {
    throw Object.assign(new Error("MAP_PROVIDER_UNAVAILABLE"), {
      reasonCode: "MAP_PROVIDER_UNAVAILABLE"
    });
  }

  state.providerReady = isAvailableFunction(internal.bridgeProvider);
  state.staleReferenceDetected = false;
  state.replacementDetected = false;

  if (!state.providerReady) {
    state.lastFailureReason = "MAP_PROVIDER_UNAVAILABLE";
    throw Object.assign(new Error("MAP_PROVIDER_UNAVAILABLE"), {
      reasonCode: "MAP_PROVIDER_UNAVAILABLE"
    });
  }

  let providerResult;
  try {
    providerResult = internal.bridgeProvider();
  } catch (error) {
    const reasonCode = toReasonCode(error, "MAP_UNAVAILABLE");
    state.lastFailureReason = reasonCode;
    throw Object.assign(new Error(reasonCode), { reasonCode });
  }

  const map =
    providerResult?.rawLeafletMapReference ??
    providerResult?.map ??
    providerResult?.rawMap ??
    null;

  if (!map) {
    state.lastFailureReason = "MAP_UNAVAILABLE";
    throw Object.assign(new Error("MAP_UNAVAILABLE"), {
      reasonCode: "MAP_UNAVAILABLE"
    });
  }

  if (!isMapShaped(map)) {
    state.mapShapeValid = false;
    state.lastFailureReason = "INVALID_MAP_SHAPE";
    throw Object.assign(new Error("INVALID_MAP_SHAPE"), {
      reasonCode: "INVALID_MAP_SHAPE"
    });
  }

  state.mapShapeValid = true;

  const mapIdentityId = provider.__assignIdentity(map, providerResult);

  if (storedMapReference && storedMapReference !== map) {
    state.staleReferenceDetected = true;
    state.replacementDetected = internal.boundMapReference
      ? internal.boundMapReference !== map
      : false;
    state.lastFailureReason = "STALE_MAP_REFERENCE";
    throw Object.assign(new Error("STALE_MAP_REFERENCE"), {
      reasonCode: "STALE_MAP_REFERENCE"
    });
  }

  if (expectedMapIdentityId != null && String(expectedMapIdentityId) !== mapIdentityId) {
    state.replacementDetected = true;
    state.lastFailureReason = "MAP_IDENTITY_CHANGED";
    throw Object.assign(new Error("MAP_IDENTITY_CHANGED"), {
      reasonCode: "MAP_IDENTITY_CHANGED"
    });
  }

  if (
    internal.boundMapReference &&
    internal.boundMapReference !== map
  ) {
    state.replacementDetected = true;
    state.lastFailureReason = "MAP_IDENTITY_CHANGED";
    throw Object.assign(new Error("MAP_IDENTITY_CHANGED"), {
      reasonCode: "MAP_IDENTITY_CHANGED"
    });
  }

  if (
    internal.boundMapIdentityId &&
    internal.boundMapIdentityId !== mapIdentityId
  ) {
    state.replacementDetected = true;
    state.lastFailureReason = "MAP_IDENTITY_CHANGED";
    throw Object.assign(new Error("MAP_IDENTITY_CHANGED"), {
      reasonCode: "MAP_IDENTITY_CHANGED"
    });
  }

  internal.boundMapReference = map;
  internal.boundMapIdentityId = mapIdentityId;

  state.mapResolved = true;
  state.mapIdentityId = mapIdentityId;
  state.lastFailureReason = null;

  return {
    map,
    mapIdentityId
  };
}

export function getPersistentAtlasMapProviderStatus(provider) {
  const state = provider?.__state;

  if (!state) {
    return freezeStatus({
      providerReady: false,
      mapResolved: false,
      mapShapeValid: false,
      mapIdentityId: null,
      staleReferenceDetected: false,
      replacementDetected: false,
      lastFailureReason: "MAP_PROVIDER_UNAVAILABLE"
    });
  }

  return freezeStatus(state);
}
