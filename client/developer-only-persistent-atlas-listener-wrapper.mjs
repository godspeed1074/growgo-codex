const STATUS_SCHEMA_ID =
  "GROWGO_PERSISTENT_ATLAS_LISTENER_WRAPPER_STATUS_001";
const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];
const FORBIDDEN_EVENTS = [
  "move",
  "drag",
  "mousemove",
  "touchmove",
  "wheel",
  "zoom",
  "zoomstart",
  "polling",
  "timers",
  "startup"
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

function sanitizeIdentity(identity = {}) {
  return {
    mapIdentityId:
      identity?.mapIdentityId == null ? null : String(identity.mapIdentityId),
    sessionId: identity?.sessionId == null ? null : String(identity.sessionId),
    listenerOwnerId:
      identity?.listenerOwnerId == null ? null : String(identity.listenerOwnerId)
  };
}

function freezeStatus(state) {
  return deepFreeze({
    schemaId: STATUS_SCHEMA_ID,
    wrapperReady: state.wrapperReady,
    listenersRegistered: state.listenersRegistered,
    ownedListenerCount: state.ownedListenerCount,
    moveendRegistered: state.moveendRegistered,
    zoomendRegistered: state.zoomendRegistered,
    resizeRegistered: state.resizeRegistered,
    listenerOwnerId: state.listenerOwnerId,
    mapIdentityId: state.mapIdentityId,
    sessionId: state.sessionId,
    registrationAttemptCount: state.registrationAttemptCount,
    registrationCompletedCount: state.registrationCompletedCount,
    removalAttemptCount: state.removalAttemptCount,
    removalCompletedCount: state.removalCompletedCount,
    partialRollbackAttemptCount: state.partialRollbackAttemptCount,
    partialRollbackCompletedCount: state.partialRollbackCompletedCount,
    duplicateRegistrationDetected: state.duplicateRegistrationDetected,
    forbiddenEventDetected: state.forbiddenEventDetected,
    staleListenerSetDetected: state.staleListenerSetDetected,
    lastFailureReason: state.lastFailureReason,
    canonicalSafetyFlags: canonicalSafetyFlags()
  });
}

function validateMapShape(map) {
  return Boolean(
    map &&
      typeof map.on === "function" &&
      typeof map.off === "function"
  );
}

export function createPersistentAtlasListenerWrapper({
  mapProvider = unavailable("LISTENER_WRAPPER_UNAVAILABLE"),
  listenerRegistrar = unavailable("LISTENER_WRAPPER_UNAVAILABLE"),
  listenerRemover = unavailable("LISTENER_WRAPPER_UNAVAILABLE"),
  identityProvider = unavailable("LISTENER_WRAPPER_UNAVAILABLE")
} = {}) {
  const state = {
    wrapperReady: false,
    listenersRegistered: false,
    ownedListenerCount: 0,
    moveendRegistered: false,
    zoomendRegistered: false,
    resizeRegistered: false,
    listenerOwnerId: null,
    mapIdentityId: null,
    sessionId: null,
    registrationAttemptCount: 0,
    registrationCompletedCount: 0,
    removalAttemptCount: 0,
    removalCompletedCount: 0,
    partialRollbackAttemptCount: 0,
    partialRollbackCompletedCount: 0,
    duplicateRegistrationDetected: false,
    forbiddenEventDetected: false,
    staleListenerSetDetected: false,
    lastFailureReason: null
  };

  const internal = {
    boundMap: null,
    registrations: {
      moveend: null,
      zoomend: null,
      resize: null
    },
    callbacks: {
      moveend: null,
      zoomend: null,
      resize: null
    }
  };

  return Object.freeze({
    __growgoPersistentAtlasListenerWrapper: true,
    __state: state,
    __internal: internal,
    __mapProvider: mapProvider,
    __listenerRegistrar: listenerRegistrar,
    __listenerRemover: listenerRemover,
    __identityProvider: identityProvider
  });
}

function assertWrapper(wrapper) {
  const state = wrapper?.__state;
  if (!state) {
    throw Object.assign(new Error("LISTENER_WRAPPER_UNAVAILABLE"), {
      reasonCode: "LISTENER_WRAPPER_UNAVAILABLE"
    });
  }

  return state;
}

function readDependencies(wrapper) {
  const state = assertWrapper(wrapper);
  const ready =
    isAvailableFunction(wrapper.__mapProvider) &&
    isAvailableFunction(wrapper.__listenerRegistrar) &&
    isAvailableFunction(wrapper.__listenerRemover) &&
    isAvailableFunction(wrapper.__identityProvider);

  state.wrapperReady = ready;
  if (!ready) {
    state.lastFailureReason = "LISTENER_WRAPPER_UNAVAILABLE";
    throw Object.assign(new Error("LISTENER_WRAPPER_UNAVAILABLE"), {
      reasonCode: "LISTENER_WRAPPER_UNAVAILABLE"
    });
  }

  return state;
}

function syncState(wrapper) {
  const state = wrapper.__state;
  const internal = wrapper.__internal;
  state.moveendRegistered = !!internal.registrations.moveend;
  state.zoomendRegistered = !!internal.registrations.zoomend;
  state.resizeRegistered = !!internal.registrations.resize;
  state.ownedListenerCount = APPROVED_EVENTS.reduce(
    (count, eventName) => count + (internal.registrations[eventName] ? 1 : 0),
    0
  );
  state.listenersRegistered = state.ownedListenerCount > 0;
}

function currentIdentity(wrapper) {
  return sanitizeIdentity(wrapper.__identityProvider());
}

function validateIdentityMatch(wrapper, expectedIdentity) {
  const state = wrapper.__state;
  const current = currentIdentity(wrapper);
  const expected = sanitizeIdentity(expectedIdentity);

  if (
    expected.mapIdentityId != null &&
    current.mapIdentityId !== expected.mapIdentityId
  ) {
    state.staleListenerSetDetected = true;
    state.lastFailureReason = "MAP_IDENTITY_MISMATCH";
    throw Object.assign(new Error("MAP_IDENTITY_MISMATCH"), {
      reasonCode: "MAP_IDENTITY_MISMATCH"
    });
  }

  if (
    expected.sessionId != null &&
    current.sessionId !== expected.sessionId
  ) {
    state.staleListenerSetDetected = true;
    state.lastFailureReason = "SESSION_IDENTITY_MISMATCH";
    throw Object.assign(new Error("SESSION_IDENTITY_MISMATCH"), {
      reasonCode: "SESSION_IDENTITY_MISMATCH"
    });
  }

  if (
    expected.listenerOwnerId != null &&
    current.listenerOwnerId !== expected.listenerOwnerId
  ) {
    state.staleListenerSetDetected = true;
    state.lastFailureReason = "LISTENER_OWNER_MISMATCH";
    throw Object.assign(new Error("LISTENER_OWNER_MISMATCH"), {
      reasonCode: "LISTENER_OWNER_MISMATCH"
    });
  }

  return current;
}

export function validatePersistentAtlasListenerIdentity(wrapper, expectedIdentity = null) {
  readDependencies(wrapper);
  const state = wrapper.__state;
  if (!expectedIdentity) {
    return deepFreeze({
      valid: true,
      identity: sanitizeIdentity({
        mapIdentityId: state.mapIdentityId,
        sessionId: state.sessionId,
        listenerOwnerId: state.listenerOwnerId
      })
    });
  }

  validateIdentityMatch(wrapper, expectedIdentity);
  state.staleListenerSetDetected = false;
  state.lastFailureReason = null;
  return deepFreeze({
    valid: true,
    identity: sanitizeIdentity(expectedIdentity)
  });
}

export function registerPersistentAtlasListeners(
  wrapper,
  {
    eventCallbacks = {},
    identity = null
  } = {}
) {
  readDependencies(wrapper);
  const state = wrapper.__state;
  const internal = wrapper.__internal;
  state.registrationAttemptCount += 1;

  if (state.listenersRegistered) {
    state.duplicateRegistrationDetected = true;
    state.lastFailureReason = "LISTENER_SET_ALREADY_REGISTERED";
    throw Object.assign(new Error("LISTENER_SET_ALREADY_REGISTERED"), {
      reasonCode: "LISTENER_SET_ALREADY_REGISTERED"
    });
  }

  const map = wrapper.__mapProvider();
  if (!validateMapShape(map)) {
    state.lastFailureReason = "LISTENER_REGISTRATION_FAILED";
    throw Object.assign(new Error("LISTENER_REGISTRATION_FAILED"), {
      reasonCode: "LISTENER_REGISTRATION_FAILED"
    });
  }

  const boundIdentity = sanitizeIdentity(identity ?? currentIdentity(wrapper));
  if (
    !boundIdentity.mapIdentityId ||
    !boundIdentity.sessionId ||
    !boundIdentity.listenerOwnerId
  ) {
    state.lastFailureReason = "LISTENER_REGISTRATION_FAILED";
    throw Object.assign(new Error("LISTENER_REGISTRATION_FAILED"), {
      reasonCode: "LISTENER_REGISTRATION_FAILED"
    });
  }

  const requestedEvents = Object.keys(eventCallbacks);
  for (const eventName of requestedEvents) {
    if (FORBIDDEN_EVENTS.includes(eventName)) {
      state.forbiddenEventDetected = true;
      state.lastFailureReason = "FORBIDDEN_EVENT_NAME";
      throw Object.assign(new Error("FORBIDDEN_EVENT_NAME"), {
        reasonCode: "FORBIDDEN_EVENT_NAME"
      });
    }

    if (!APPROVED_EVENTS.includes(eventName)) {
      state.lastFailureReason = "INVALID_EVENT_NAME";
      throw Object.assign(new Error("INVALID_EVENT_NAME"), {
        reasonCode: "INVALID_EVENT_NAME"
      });
    }
  }

  for (const eventName of APPROVED_EVENTS) {
    if (typeof eventCallbacks[eventName] !== "function") {
      state.lastFailureReason = "LISTENER_REGISTRATION_FAILED";
      throw Object.assign(new Error("LISTENER_REGISTRATION_FAILED"), {
        reasonCode: "LISTENER_REGISTRATION_FAILED"
      });
    }
  }

  const addedEvents = [];

  try {
    for (const eventName of APPROVED_EVENTS) {
      if (internal.registrations[eventName]) {
        state.duplicateRegistrationDetected = true;
        throw Object.assign(new Error("DUPLICATE_LISTENER_REGISTRATION"), {
          reasonCode: "DUPLICATE_LISTENER_REGISTRATION"
        });
      }

      const callback = eventCallbacks[eventName];
      const registration =
        wrapper.__listenerRegistrar(map, eventName, callback, boundIdentity) ?? {
          eventName
        };
      internal.callbacks[eventName] = callback;
      internal.registrations[eventName] = registration;
      addedEvents.push(eventName);
    }
  } catch (error) {
    state.partialRollbackAttemptCount += 1;
    for (const eventName of addedEvents) {
      try {
        wrapper.__listenerRemover(
          map,
          eventName,
          internal.callbacks[eventName],
          internal.registrations[eventName]
        );
      } catch {}
      internal.callbacks[eventName] = null;
      internal.registrations[eventName] = null;
    }
    internal.boundMap = null;
    syncState(wrapper);
    state.partialRollbackCompletedCount += 1;
    state.lastFailureReason =
      addedEvents.length > 0
        ? "PARTIAL_LISTENER_REGISTRATION_FAILED"
        : toReasonCode(error, "LISTENER_REGISTRATION_FAILED");
    throw Object.assign(new Error(state.lastFailureReason), {
      reasonCode: state.lastFailureReason
    });
  }

  internal.boundMap = map;
  state.listenerOwnerId = boundIdentity.listenerOwnerId;
  state.mapIdentityId = boundIdentity.mapIdentityId;
  state.sessionId = boundIdentity.sessionId;
  syncState(wrapper);
  state.registrationCompletedCount += 1;
  state.lastFailureReason = null;
  return deepFreeze({
    registeredEvents: [...APPROVED_EVENTS],
    listenerOwnerId: state.listenerOwnerId
  });
}

export function removePersistentAtlasListeners(wrapper, expectedIdentity = null) {
  readDependencies(wrapper);
  const state = wrapper.__state;
  const internal = wrapper.__internal;
  state.removalAttemptCount += 1;

  const failures = [];
  let staleReason = null;

  if (expectedIdentity) {
    try {
      validateIdentityMatch(wrapper, expectedIdentity);
    } catch (error) {
      staleReason = error.reasonCode;
    }
  }

  const map = internal.boundMap;

  for (const eventName of APPROVED_EVENTS) {
    const registration = internal.registrations[eventName];
    const callback = internal.callbacks[eventName];
    if (!registration || !callback || !map) {
      internal.registrations[eventName] = null;
      internal.callbacks[eventName] = null;
      continue;
    }

    try {
      wrapper.__listenerRemover(map, eventName, callback, registration);
      state.removalCompletedCount += 1;
    } catch (error) {
      failures.push(toReasonCode(error, "LISTENER_REMOVAL_FAILED"));
    }

    internal.registrations[eventName] = null;
    internal.callbacks[eventName] = null;
  }

  internal.boundMap = null;
  syncState(wrapper);

  if (failures.length > 0) {
    state.lastFailureReason = failures[0];
    throw Object.assign(new Error(failures[0]), {
      reasonCode: failures[0]
    });
  }

  if (staleReason) {
    state.lastFailureReason = "STALE_LISTENER_SET";
    throw Object.assign(new Error("STALE_LISTENER_SET"), {
      reasonCode: "STALE_LISTENER_SET",
      staleReason
    });
  }

  state.lastFailureReason = null;
  return deepFreeze({
    removed: true,
    ownedListenerCount: state.ownedListenerCount
  });
}

export function getPersistentAtlasListenerStatus(wrapper) {
  const state = wrapper?.__state;

  if (!state) {
    return freezeStatus({
      wrapperReady: false,
      listenersRegistered: false,
      ownedListenerCount: 0,
      moveendRegistered: false,
      zoomendRegistered: false,
      resizeRegistered: false,
      listenerOwnerId: null,
      mapIdentityId: null,
      sessionId: null,
      registrationAttemptCount: 0,
      registrationCompletedCount: 0,
      removalAttemptCount: 0,
      removalCompletedCount: 0,
      partialRollbackAttemptCount: 0,
      partialRollbackCompletedCount: 0,
      duplicateRegistrationDetected: false,
      forbiddenEventDetected: false,
      staleListenerSetDetected: false,
      lastFailureReason: "LISTENER_WRAPPER_UNAVAILABLE"
    });
  }

  return freezeStatus(state);
}
