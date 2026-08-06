const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_LIVE_ADAPTER_STATUS_001";

const IDENTITY_KEYS = [
  "mapIdentity",
  "regionId",
  "packageId",
  "packageVersion",
  "packageFingerprint",
  "recipeId",
  "recipeVersion",
  "selectorSeed",
  "sessionId"
];

const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];
const FORBIDDEN_EVENTS = ["move", "drag", "mousemove", "touchmove"];

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

function isFunction(value) {
  return typeof value === "function";
}

function isAvailableFunction(value) {
  return isFunction(value) && value.__growgoUnavailable !== true;
}

function immutableSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
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
  const sanitized = {};

  for (const key of IDENTITY_KEYS) {
    const value = identity?.[key];
    sanitized[key] = value == null ? null : String(value);
  }

  return sanitized;
}

function identitiesEqual(left, right) {
  const a = sanitizeIdentity(left);
  const b = sanitizeIdentity(right);
  return IDENTITY_KEYS.every((key) => a[key] === b[key]);
}

function coreIdentityEqual(left, right) {
  const a = sanitizeIdentity(left);
  const b = sanitizeIdentity(right);

  for (const key of [
    "regionId",
    "packageId",
    "packageVersion",
    "packageFingerprint",
    "recipeId",
    "recipeVersion"
  ]) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

function hasMissingIdentityField(identity) {
  const sanitized = sanitizeIdentity(identity);
  return IDENTITY_KEYS.some((key) => sanitized[key] == null);
}

function createDefaultCandidateSeams() {
  return {
    rawMapProvider: {
      resolveRawMap: unavailable("RAW_MAP_PROVIDER_UNAVAILABLE")
    },
    readinessProvider: {
      getPersistentAttachmentReadiness: unavailable("READINESS_PROVIDER_UNAVAILABLE")
    },
    authorizationStatusProvider: {
      getPersistentAuthorizationStatus: unavailable(
        "AUTHORIZATION_STATUS_PROVIDER_UNAVAILABLE"
      )
    },
    identitySnapshotProvider: {
      getPersistentAttachmentIdentity: unavailable("IDENTITY_SNAPSHOT_PROVIDER_UNAVAILABLE")
    },
    retainedSurfaceProvider: {
      preparePersistentSurface: unavailable("RETAINED_SURFACE_PROVIDER_UNAVAILABLE")
    },
    retainedLifecycleOwnerProvider: {
      createLifecycleOwner: unavailable("RETAINED_LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE")
    },
    frameSnapshotProvider: {
      createPersistentSnapshot: unavailable("FRAME_SNAPSHOT_PROVIDER_UNAVAILABLE")
    },
    frameDrawProvider: {
      drawPersistentFrame: unavailable("FRAME_DRAW_PROVIDER_UNAVAILABLE")
    },
    animationFrameScheduler: unavailable("ANIMATION_FRAME_SCHEDULER_UNAVAILABLE"),
    animationFrameCanceller: unavailable("ANIMATION_FRAME_CANCELLER_UNAVAILABLE"),
    approvedListenerRegistrar: unavailable("APPROVED_LISTENER_REGISTRAR_UNAVAILABLE"),
    approvedListenerRemover: unavailable("APPROVED_LISTENER_REMOVER_UNAVAILABLE"),
    retainedCleanupProvider: {
      cleanupPersistentAttachment: unavailable("RETAINED_CLEANUP_PROVIDER_UNAVAILABLE")
    }
  };
}

function normalizeCandidateSeams(input = {}) {
  const defaults = createDefaultCandidateSeams();
  return {
    ...defaults,
    ...(input.rawMapProvider
      ? { rawMapProvider: { ...defaults.rawMapProvider, ...input.rawMapProvider } }
      : {}),
    ...(input.readinessProvider
      ? { readinessProvider: { ...defaults.readinessProvider, ...input.readinessProvider } }
      : {}),
    ...(input.authorizationStatusProvider
      ? {
          authorizationStatusProvider: {
            ...defaults.authorizationStatusProvider,
            ...input.authorizationStatusProvider
          }
        }
      : {}),
    ...(input.identitySnapshotProvider
      ? {
          identitySnapshotProvider: {
            ...defaults.identitySnapshotProvider,
            ...input.identitySnapshotProvider
          }
        }
      : {}),
    ...(input.retainedSurfaceProvider
      ? {
          retainedSurfaceProvider: {
            ...defaults.retainedSurfaceProvider,
            ...input.retainedSurfaceProvider
          }
        }
      : {}),
    ...(input.retainedLifecycleOwnerProvider
      ? {
          retainedLifecycleOwnerProvider: {
            ...defaults.retainedLifecycleOwnerProvider,
            ...input.retainedLifecycleOwnerProvider
          }
        }
      : {}),
    ...(input.frameSnapshotProvider
      ? {
          frameSnapshotProvider: {
            ...defaults.frameSnapshotProvider,
            ...input.frameSnapshotProvider
          }
        }
      : {}),
    ...(input.frameDrawProvider
      ? {
          frameDrawProvider: {
            ...defaults.frameDrawProvider,
            ...input.frameDrawProvider
          }
        }
      : {}),
    animationFrameScheduler:
      Object.prototype.hasOwnProperty.call(input, "animationFrameScheduler")
        ? input.animationFrameScheduler
        : defaults.animationFrameScheduler,
    animationFrameCanceller:
      Object.prototype.hasOwnProperty.call(input, "animationFrameCanceller")
        ? input.animationFrameCanceller
        : defaults.animationFrameCanceller,
    approvedListenerRegistrar:
      Object.prototype.hasOwnProperty.call(input, "approvedListenerRegistrar")
        ? input.approvedListenerRegistrar
        : defaults.approvedListenerRegistrar,
    approvedListenerRemover:
      Object.prototype.hasOwnProperty.call(input, "approvedListenerRemover")
        ? input.approvedListenerRemover
        : defaults.approvedListenerRemover,
    ...(input.retainedCleanupProvider
      ? {
          retainedCleanupProvider: {
            ...defaults.retainedCleanupProvider,
            ...input.retainedCleanupProvider
          }
        }
      : {})
  };
}

function validateCandidateSeams(seams) {
  const problems = [];

  if (!isAvailableFunction(seams?.rawMapProvider?.resolveRawMap)) {
    problems.push("RAW_MAP_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.readinessProvider?.getPersistentAttachmentReadiness)) {
    problems.push("READINESS_PROVIDER_INVALID");
  }
  if (
    !isAvailableFunction(
      seams?.authorizationStatusProvider?.getPersistentAuthorizationStatus
    )
  ) {
    problems.push("AUTHORIZATION_STATUS_PROVIDER_INVALID");
  }
  if (
    !isAvailableFunction(
      seams?.identitySnapshotProvider?.getPersistentAttachmentIdentity
    )
  ) {
    problems.push("IDENTITY_SNAPSHOT_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.retainedSurfaceProvider?.preparePersistentSurface)) {
    problems.push("RETAINED_SURFACE_PROVIDER_INVALID");
  }
  if (
    !isAvailableFunction(
      seams?.retainedLifecycleOwnerProvider?.createLifecycleOwner
    )
  ) {
    problems.push("RETAINED_LIFECYCLE_OWNER_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.frameSnapshotProvider?.createPersistentSnapshot)) {
    problems.push("FRAME_SNAPSHOT_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.frameDrawProvider?.drawPersistentFrame)) {
    problems.push("FRAME_DRAW_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.animationFrameScheduler)) {
    problems.push("ANIMATION_FRAME_SCHEDULER_INVALID");
  }
  if (!isAvailableFunction(seams?.animationFrameCanceller)) {
    problems.push("ANIMATION_FRAME_CANCELLER_INVALID");
  }
  if (!isAvailableFunction(seams?.approvedListenerRegistrar)) {
    problems.push("APPROVED_LISTENER_REGISTRAR_INVALID");
  }
  if (!isAvailableFunction(seams?.approvedListenerRemover)) {
    problems.push("APPROVED_LISTENER_REMOVER_INVALID");
  }
  if (
    !isAvailableFunction(
      seams?.retainedCleanupProvider?.cleanupPersistentAttachment
    )
  ) {
    problems.push("RETAINED_CLEANUP_PROVIDER_INVALID");
  }

  return problems;
}

export function createControlledPersistentAtlasLiveAdapter(candidateSeams = {}) {
  const seams = normalizeCandidateSeams(candidateSeams);
  const validationProblems = validateCandidateSeams(seams);

  const internal = {
    dependenciesCreated: false,
    rawMapResult: null,
    readinessResult: null,
    authorizationResult: null,
    identityResult: null,
    lastSnapshotResult: null,
    lastDrawRuntimeStateCreated: false,
    lastResolvedMapIdentityId: null,
    lastFailureReason: validationProblems[0] ?? null
  };

  const state = {
    rawMapResolved: false,
    readinessResolved: false,
    authorizationResolved: false,
    identityResolved: false,
    retainedSurfaceResolved: false,
    lifecycleOwnerResolved: false,
    snapshotResolved: false,
    drawResolved: false
  };

  function setFailure(reasonCode) {
    internal.lastFailureReason = reasonCode;
    return reasonCode;
  }

  function getPersistentLiveAdapterStatus() {
    return deepFreeze({
      schemaId: STATUS_SCHEMA_ID,
      adapterReady: validationProblems.length === 0,
      dependenciesCreated: internal.dependenciesCreated,
      mapSeamAvailable: isAvailableFunction(seams.rawMapProvider.resolveRawMap),
      readinessSeamAvailable: isAvailableFunction(
        seams.readinessProvider.getPersistentAttachmentReadiness
      ),
      authorizationSeamAvailable: isAvailableFunction(
        seams.authorizationStatusProvider.getPersistentAuthorizationStatus
      ),
      identitySeamAvailable: isAvailableFunction(
        seams.identitySnapshotProvider.getPersistentAttachmentIdentity
      ),
      surfaceSeamAvailable: isAvailableFunction(
        seams.retainedSurfaceProvider.preparePersistentSurface
      ),
      lifecycleOwnerSeamAvailable: isAvailableFunction(
        seams.retainedLifecycleOwnerProvider.createLifecycleOwner
      ),
      snapshotSeamAvailable: isAvailableFunction(
        seams.frameSnapshotProvider.createPersistentSnapshot
      ),
      drawSeamAvailable: isAvailableFunction(seams.frameDrawProvider.drawPersistentFrame),
      schedulerSeamAvailable: isAvailableFunction(seams.animationFrameScheduler),
      cancellerSeamAvailable: isAvailableFunction(seams.animationFrameCanceller),
      listenerRegistrarSeamAvailable: isAvailableFunction(
        seams.approvedListenerRegistrar
      ),
      listenerRemoverSeamAvailable: isAvailableFunction(
        seams.approvedListenerRemover
      ),
      cleanupSeamAvailable: isAvailableFunction(
        seams.retainedCleanupProvider.cleanupPersistentAttachment
      ),
      rawMapResolved: state.rawMapResolved,
      readinessResolved: state.readinessResolved,
      authorizationResolved: state.authorizationResolved,
      identityResolved: state.identityResolved,
      retainedSurfaceResolved: state.retainedSurfaceResolved,
      lifecycleOwnerResolved: state.lifecycleOwnerResolved,
      snapshotResolved: state.snapshotResolved,
      drawResolved: state.drawResolved,
      forbiddenGlobalLookupDetected: false,
      windowAccessDetected: false,
      documentAccessDetected: false,
      realMapAccessDetected: false,
      realCanvasAccessDetected: false,
      realListenerAccessDetected: false,
      realSchedulerAccessDetected: false,
      realRendererAccessDetected: false,
      lastFailureReason: internal.lastFailureReason,
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  function ensureReady() {
    if (validationProblems.length > 0) {
      throw Object.assign(new Error(validationProblems[0]), {
        reasonCode: validationProblems[0]
      });
    }
  }

  function resolveMap() {
    ensureReady();
    const result = seams.rawMapProvider.resolveRawMap();
    const map = result?.map ?? result?.rawMap ?? null;
    const mapIdentityId = String(
      result?.mapIdentityId ??
        result?.identity?.mapIdentity ??
        result?.mapIdentity ??
        ""
    );

    if (!map || !mapIdentityId) {
      throw Object.assign(new Error("RAW_MAP_UNRESOLVED"), {
        reasonCode: setFailure("RAW_MAP_UNRESOLVED")
      });
    }

    if (
      internal.lastResolvedMapIdentityId &&
      internal.lastResolvedMapIdentityId !== mapIdentityId
    ) {
      throw Object.assign(new Error("STALE_MAP_IDENTITY"), {
        reasonCode: setFailure("STALE_MAP_IDENTITY")
      });
    }

    internal.lastResolvedMapIdentityId = mapIdentityId;
    internal.rawMapResult = { map, mapIdentityId };
    state.rawMapResolved = true;
    return internal.rawMapResult;
  }

  function resolveAuthorization() {
    ensureReady();
    const result =
      seams.authorizationStatusProvider.getPersistentAuthorizationStatus();

    const normalized = deepFreeze({
      localDevelopment: result?.localDevelopment === true,
      sessionId:
        result?.sessionId == null ? null : String(result.sessionId),
      authorizedIdentity: sanitizeIdentity(result?.authorizedIdentity ?? {})
    });

    if (!normalized.localDevelopment) {
      throw Object.assign(new Error("LOCAL_DEVELOPMENT_ONLY"), {
        reasonCode: setFailure("LOCAL_DEVELOPMENT_ONLY")
      });
    }

    if (!normalized.sessionId || hasMissingIdentityField(normalized.authorizedIdentity)) {
      throw Object.assign(new Error("AUTHORIZATION_STATUS_INVALID"), {
        reasonCode: setFailure("AUTHORIZATION_STATUS_INVALID")
      });
    }

    internal.authorizationResult = normalized;
    state.authorizationResolved = true;
    return normalized;
  }

  function resolveIdentity({ map } = {}) {
    ensureReady();
    const rawIdentity = seams.identitySnapshotProvider.getPersistentAttachmentIdentity({
      map: map ?? internal.rawMapResult?.map ?? null
    });
    const identity = sanitizeIdentity(rawIdentity);

    if (hasMissingIdentityField(identity)) {
      throw Object.assign(new Error("IDENTITY_SNAPSHOT_INVALID"), {
        reasonCode: setFailure("IDENTITY_SNAPSHOT_INVALID")
      });
    }

    const frozen = deepFreeze(identity);
    internal.identityResult = frozen;
    state.identityResolved = true;
    return frozen;
  }

  function resolveReadiness({ map } = {}) {
    ensureReady();
    const authorization = internal.authorizationResult ?? resolveAuthorization();
    const readiness =
      seams.readinessProvider.getPersistentAttachmentReadiness({
        map: map ?? internal.rawMapResult?.map ?? null
      }) ?? {};

    if (readiness.approved !== true) {
      throw Object.assign(new Error("READINESS_REJECTED"), {
        reasonCode: setFailure(readiness.reasonCode ?? "READINESS_REJECTED")
      });
    }

    const readinessIdentity = sanitizeIdentity(readiness.identity ?? {});
    if (hasMissingIdentityField(readinessIdentity)) {
      throw Object.assign(new Error("READINESS_IDENTITY_INVALID"), {
        reasonCode: setFailure("READINESS_IDENTITY_INVALID")
      });
    }

    if (!coreIdentityEqual(readinessIdentity, authorization.authorizedIdentity)) {
      throw Object.assign(new Error("STALE_REGION_PACKAGE_RECIPE_IDENTITY"), {
        reasonCode: setFailure("STALE_REGION_PACKAGE_RECIPE_IDENTITY")
      });
    }

    internal.readinessResult = deepFreeze({
      approved: true,
      reasonCode: String(readiness.reasonCode ?? "READINESS_APPROVED"),
      identity: readinessIdentity
    });
    state.readinessResolved = true;
    return internal.readinessResult;
  }

  function acquireRetainedSurface({ map, identity, lifecycleOwner } = {}) {
    ensureReady();
    const result =
      seams.retainedSurfaceProvider.preparePersistentSurface({
        map,
        identity,
        lifecycleOwner
      }) ?? {};

    const panes = Array.isArray(result.panes)
      ? result.panes.filter(Boolean)
      : result.pane
        ? [result.pane]
        : [];
    const canvases = Array.isArray(result.canvases)
      ? result.canvases.filter(Boolean)
      : result.canvas
        ? [result.canvas]
        : [];

    if (canvases.length !== 1) {
      throw Object.assign(new Error("RETAINED_SURFACE_CANVAS_COUNT_INVALID"), {
        reasonCode: setFailure("RETAINED_SURFACE_CANVAS_COUNT_INVALID")
      });
    }

    if (panes.length > 1) {
      throw Object.assign(new Error("RETAINED_SURFACE_PANE_COUNT_INVALID"), {
        reasonCode: setFailure("RETAINED_SURFACE_PANE_COUNT_INVALID")
      });
    }

    const surfaceOwnerId = String(
      result.surfaceOwnerId ?? result.ownerId ?? identity?.sessionId ?? ""
    );
    const lifecycleOwnerId = String(
      result.lifecycleOwnerId ?? lifecycleOwner?.ownerId ?? lifecycleOwner?.id ?? ""
    );

    if (!surfaceOwnerId || !lifecycleOwnerId) {
      throw Object.assign(new Error("RETAINED_SURFACE_OWNER_IDS_REQUIRED"), {
        reasonCode: setFailure("RETAINED_SURFACE_OWNER_IDS_REQUIRED")
      });
    }

    state.retainedSurfaceResolved = true;
    return {
      pane: panes[0] ?? null,
      canvas: canvases[0],
      cleanupOwner: result.cleanupOwner ?? lifecycleOwner,
      surfaceOwnerId,
      lifecycleOwnerId
    };
  }

  function acquireLifecycleOwner({ map, identity } = {}) {
    ensureReady();
    const result =
      seams.retainedLifecycleOwnerProvider.createLifecycleOwner({
        map,
        identity
      }) ?? {};

    const owners = Array.isArray(result.lifecycleOwners)
      ? result.lifecycleOwners.filter(Boolean)
      : result.lifecycleOwner
        ? [result.lifecycleOwner]
        : result.kind || result.ownerId || result.id
          ? [result]
          : [];

    if (owners.length !== 1) {
      throw Object.assign(new Error("DUPLICATE_LIFECYCLE_OWNER"), {
        reasonCode: setFailure("DUPLICATE_LIFECYCLE_OWNER")
      });
    }

    const owner = owners[0];
    const ownerId = String(
      result.lifecycleOwnerId ?? owner.ownerId ?? owner.id ?? ""
    );

    if (!ownerId) {
      throw Object.assign(new Error("LIFECYCLE_OWNER_ID_REQUIRED"), {
        reasonCode: setFailure("LIFECYCLE_OWNER_ID_REQUIRED")
      });
    }

    state.lifecycleOwnerResolved = true;
    return {
      ...result,
      owner,
      lifecycleOwnerId: ownerId
    };
  }

  function createFrameSnapshot({ map, identity, reason } = {}) {
    ensureReady();
    const snapshot =
      seams.frameSnapshotProvider.createPersistentSnapshot({
        map,
        identity,
        reason
      }) ?? null;

    if (!snapshot || !Object.isFrozen(snapshot) || !immutableSerializable(snapshot)) {
      throw Object.assign(new Error("IMMUTABLE_SNAPSHOT_REQUIRED"), {
        reasonCode: setFailure("IMMUTABLE_SNAPSHOT_REQUIRED")
      });
    }

    internal.lastSnapshotResult = snapshot;
    state.snapshotResolved = true;
    return snapshot;
  }

  function drawFrame({
    map,
    identity,
    pane,
    canvas,
    lifecycleOwner,
    snapshot,
    reason
  } = {}) {
    ensureReady();

    if (!snapshot || !Object.isFrozen(snapshot)) {
      throw Object.assign(new Error("IMMUTABLE_SNAPSHOT_REQUIRED"), {
        reasonCode: setFailure("IMMUTABLE_SNAPSHOT_REQUIRED")
      });
    }

    const runtimeDrawState = {
      drawAttemptId: `${String(reason ?? "draw")}:${String(Date.now())}`
    };

    seams.frameDrawProvider.drawPersistentFrame({
      map,
      identity,
      pane,
      canvas,
      lifecycleOwner,
      snapshot,
      reason,
      runtimeDrawState
    });

    internal.lastDrawRuntimeStateCreated = true;
    state.drawResolved = true;
  }

  function scheduleFrame(callback) {
    ensureReady();
    return seams.animationFrameScheduler(callback);
  }

  function cancelFrame(handle) {
    ensureReady();
    return seams.animationFrameCanceller(handle);
  }

  function registerApprovedListeners(listenerMap) {
    ensureReady();
    const registrations = [];

    for (const eventName of APPROVED_EVENTS) {
      if (!Object.prototype.hasOwnProperty.call(listenerMap ?? {}, eventName)) {
        throw Object.assign(new Error("APPROVED_LISTENER_SET_INCOMPLETE"), {
          reasonCode: setFailure("APPROVED_LISTENER_SET_INCOMPLETE")
        });
      }

      const callback = listenerMap[eventName];
      if (!isFunction(callback)) {
        throw Object.assign(new Error("APPROVED_LISTENER_CALLBACK_INVALID"), {
          reasonCode: setFailure("APPROVED_LISTENER_CALLBACK_INVALID")
        });
      }

      const registration = seams.approvedListenerRegistrar(eventName, callback);
      const registeredEventName =
        registration?.eventName && String(registration.eventName)
          ? String(registration.eventName)
          : eventName;

      if (
        !APPROVED_EVENTS.includes(registeredEventName) ||
        FORBIDDEN_EVENTS.includes(registeredEventName)
      ) {
        throw Object.assign(new Error("FORBIDDEN_LISTENER_EVENT"), {
          reasonCode: setFailure("FORBIDDEN_LISTENER_EVENT")
        });
      }

      registrations.push(registration);
    }

    return registrations;
  }

  function registerApprovedListener(eventName, callback) {
    ensureReady();

    if (!APPROVED_EVENTS.includes(eventName) || FORBIDDEN_EVENTS.includes(eventName)) {
      throw Object.assign(new Error("FORBIDDEN_LISTENER_EVENT"), {
        reasonCode: setFailure("FORBIDDEN_LISTENER_EVENT")
      });
    }

    if (!isFunction(callback)) {
      throw Object.assign(new Error("APPROVED_LISTENER_CALLBACK_INVALID"), {
        reasonCode: setFailure("APPROVED_LISTENER_CALLBACK_INVALID")
      });
    }

    const registration = seams.approvedListenerRegistrar(eventName, callback);
    const registeredEventName =
      registration?.eventName && String(registration.eventName)
        ? String(registration.eventName)
        : eventName;

    if (
      !APPROVED_EVENTS.includes(registeredEventName) ||
      FORBIDDEN_EVENTS.includes(registeredEventName)
    ) {
      throw Object.assign(new Error("FORBIDDEN_LISTENER_EVENT"), {
        reasonCode: setFailure("FORBIDDEN_LISTENER_EVENT")
      });
    }

    return registration;
  }

  function removeApprovedListeners(registrations = []) {
    ensureReady();
    for (const registration of registrations) {
      seams.approvedListenerRemover(registration);
    }
  }

  function cleanupRetainedResources(payload = {}) {
    ensureReady();
    const result =
      seams.retainedCleanupProvider.cleanupPersistentAttachment(payload) ?? {};

    if (result.cleanupCompleted === false) {
      throw Object.assign(new Error(result.reasonCode ?? "CLEANUP_FAILED"), {
        reasonCode: setFailure(result.reasonCode ?? "CLEANUP_FAILED")
      });
    }

    return result;
  }

  const adapter = {
    resolveMap,
    resolveReadiness,
    resolveAuthorization,
    resolveIdentity,
    acquireRetainedSurface,
    acquireLifecycleOwner,
    createFrameSnapshot,
    drawFrame,
    scheduleFrame,
    cancelFrame,
    registerApprovedListeners,
    removeApprovedListeners,
    cleanupRetainedResources,
    __markDependenciesCreated() {
      internal.dependenciesCreated = true;
    },
    __registerApprovedListener: registerApprovedListener,
    getPersistentLiveAdapterStatus
  };

  return adapter;
}

export function createPersistentControllerDependencies(adapter) {
  const status = adapter.getPersistentLiveAdapterStatus();
  if (status.adapterReady !== true) {
    throw Object.assign(new Error(status.lastFailureReason ?? "ADAPTER_NOT_READY"), {
      reasonCode: status.lastFailureReason ?? "ADAPTER_NOT_READY"
    });
  }

  let lastAuthorization = null;

  function resolveBundle() {
    const { map } = adapter.resolveMap();
    const authorization = adapter.resolveAuthorization();
    const identity = adapter.resolveIdentity({ map });
    const readiness = adapter.resolveReadiness({ map });

    if (
      !identitiesEqual(identity, authorization.authorizedIdentity) ||
      !identitiesEqual(identity, readiness.identity)
    ) {
      throw Object.assign(new Error("IDENTITY_MISMATCH"), {
        reasonCode: "IDENTITY_MISMATCH"
      });
    }

    lastAuthorization = authorization;

    return {
      map,
      identity,
      authorization,
      readiness
    };
  }

  const dependencies = {
    mapProvider: {
      getMap() {
        return resolveBundle().map;
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness({ map } = {}) {
        return adapter.resolveReadiness({
          map: map ?? resolveBundle().map
        });
      }
    },
    authorizationProvider: {
      isLocalDevelopment() {
        return adapter.resolveAuthorization().localDevelopment === true;
      },
      createPersistentSession() {
        const authorization = adapter.resolveAuthorization();
        lastAuthorization = authorization;
        return {
          sessionId: authorization.sessionId,
          authorizedIdentity: { ...authorization.authorizedIdentity }
        };
      }
    },
    identityProvider: {
      getPersistentAttachmentIdentity({ map } = {}) {
        return {
          ...adapter.resolveIdentity({
            map: map ?? resolveBundle().map
          })
        };
      }
    },
    surfaceProvider: {
      preparePersistentSurface({ map, identity, lifecycleOwner }) {
        return adapter.acquireRetainedSurface({
          map,
          identity,
          lifecycleOwner
        });
      }
    },
    lifecycleOwnerProvider: {
      createLifecycleOwner({ map, identity }) {
        const result = adapter.acquireLifecycleOwner({ map, identity });
        return result.owner;
      }
    },
    snapshotProvider: {
      createPersistentSnapshot({ map, identity, reason }) {
        return adapter.createFrameSnapshot({ map, identity, reason });
      }
    },
    drawProvider: {
      drawPersistentFrame(payload) {
        return adapter.drawFrame(payload);
      }
    },
    animationFrameScheduler: {
      schedule(callback) {
        return adapter.scheduleFrame(callback);
      },
      cancel(handle) {
        return adapter.cancelFrame(handle);
      }
    },
    listenerRegistrar(eventName, callback) {
      return adapter.__registerApprovedListener(eventName, callback);
    },
    listenerRemover(registration) {
      return adapter.removeApprovedListeners([registration]);
    },
    cleanupProvider: {
      cleanupPersistentAttachment(payload) {
        return adapter.cleanupRetainedResources({
          ...payload,
          authorizedIdentity: lastAuthorization?.authorizedIdentity ?? null
        });
      }
    }
  };

  adapter.__markDependenciesCreated?.();
  return dependencies;
}

export function getPersistentLiveAdapterStatus(adapter) {
  return adapter.getPersistentLiveAdapterStatus();
}
