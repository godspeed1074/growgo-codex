import { createControlledPersistentAtlasController } from "./developer-only-controlled-persistent-atlas-controller.mjs";

const STATUS_SCHEMA_ID =
  "GROWGO_CONTROLLED_PERSISTENT_ATLAS_ADAPTER_COMPOSITION_STATUS_001";

const APPROVED_EVENTS = ["moveend", "zoomend", "resize"];

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
  return isFunction(value) && value.__growgoUnavailable !== true;
}

function isFunction(value) {
  return typeof value === "function";
}

function immutableSerializable(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function createDefaultSeams() {
  return {
    mapProvider: { getMap: unavailable("MAP_PROVIDER_UNAVAILABLE") },
    readinessProvider: {
      getPersistentAttachmentReadiness: unavailable("READINESS_PROVIDER_UNAVAILABLE")
    },
    authorizationProvider: {
      isLocalDevelopment: () => false,
      createPersistentSession: unavailable("AUTHORIZATION_PROVIDER_UNAVAILABLE")
    },
    identityProvider: {
      getPersistentAttachmentIdentity: unavailable("IDENTITY_PROVIDER_UNAVAILABLE")
    },
    surfaceProvider: {
      preparePersistentSurface: unavailable("SURFACE_PROVIDER_UNAVAILABLE")
    },
    lifecycleOwnerProvider: {
      createLifecycleOwner: unavailable("LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE")
    },
    snapshotProvider: {
      createPersistentSnapshot: unavailable("SNAPSHOT_PROVIDER_UNAVAILABLE")
    },
    drawProvider: {
      drawPersistentFrame: unavailable("DRAW_PROVIDER_UNAVAILABLE")
    },
    animationFrameScheduler: unavailable("ANIMATION_FRAME_SCHEDULER_UNAVAILABLE"),
    animationFrameCanceller: () => {},
    listenerRegistrar: unavailable("LISTENER_REGISTRAR_UNAVAILABLE"),
    listenerRemover: () => {},
    cleanupProvider: {
      cleanupPersistentAttachment: () => ({ cleanupCompleted: true })
    }
  };
}

function validateSeams(seams) {
  const problems = [];

  if (!isAvailableFunction(seams?.mapProvider?.getMap)) {
    problems.push("MAP_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.readinessProvider?.getPersistentAttachmentReadiness)) {
    problems.push("READINESS_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.authorizationProvider?.isLocalDevelopment)) {
    problems.push("AUTHORIZATION_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.authorizationProvider?.createPersistentSession)) {
    problems.push("AUTHORIZATION_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.identityProvider?.getPersistentAttachmentIdentity)) {
    problems.push("IDENTITY_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.surfaceProvider?.preparePersistentSurface)) {
    problems.push("SURFACE_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.lifecycleOwnerProvider?.createLifecycleOwner)) {
    problems.push("LIFECYCLE_OWNER_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.snapshotProvider?.createPersistentSnapshot)) {
    problems.push("SNAPSHOT_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.drawProvider?.drawPersistentFrame)) {
    problems.push("DRAW_PROVIDER_INVALID");
  }
  if (!isAvailableFunction(seams?.animationFrameScheduler)) {
    problems.push("SCHEDULER_INVALID");
  }
  if (!isAvailableFunction(seams?.animationFrameCanceller)) {
    problems.push("CANCELLER_INVALID");
  }
  if (!isAvailableFunction(seams?.listenerRegistrar)) {
    problems.push("LISTENER_REGISTRAR_INVALID");
  }
  if (!isAvailableFunction(seams?.listenerRemover)) {
    problems.push("LISTENER_REMOVER_INVALID");
  }
  if (!isAvailableFunction(seams?.cleanupProvider?.cleanupPersistentAttachment)) {
    problems.push("CLEANUP_PROVIDER_INVALID");
  }

  return problems;
}

export function createControlledPersistentAtlasAdapterComposition({
  mapProvider,
  readinessProvider,
  authorizationProvider,
  identityProvider,
  surfaceProvider,
  lifecycleOwnerProvider,
  snapshotProvider,
  drawProvider,
  animationFrameScheduler,
  animationFrameCanceller,
  listenerRegistrar,
  listenerRemover,
  cleanupProvider
} = {}) {
  const defaults = createDefaultSeams();
  const hasOwn = (value, key) =>
    !!value && Object.prototype.hasOwnProperty.call(value, key);
  const seams = {
    ...defaults,
    ...(mapProvider ? { mapProvider: { ...defaults.mapProvider, ...mapProvider } } : {}),
    ...(readinessProvider
      ? { readinessProvider: { ...defaults.readinessProvider, ...readinessProvider } }
      : {}),
    ...(authorizationProvider
      ? {
          authorizationProvider: {
            ...defaults.authorizationProvider,
            ...authorizationProvider
          }
        }
      : {}),
    ...(identityProvider
      ? { identityProvider: { ...defaults.identityProvider, ...identityProvider } }
      : {}),
    ...(surfaceProvider
      ? { surfaceProvider: { ...defaults.surfaceProvider, ...surfaceProvider } }
      : {}),
    ...(lifecycleOwnerProvider
      ? {
          lifecycleOwnerProvider: {
            ...defaults.lifecycleOwnerProvider,
            ...lifecycleOwnerProvider
          }
        }
      : {}),
    ...(snapshotProvider
      ? { snapshotProvider: { ...defaults.snapshotProvider, ...snapshotProvider } }
      : {}),
    ...(drawProvider
      ? { drawProvider: { ...defaults.drawProvider, ...drawProvider } }
      : {}),
    animationFrameScheduler: hasOwn(arguments[0] ?? {}, "animationFrameScheduler")
      ? animationFrameScheduler
      : defaults.animationFrameScheduler,
    animationFrameCanceller: hasOwn(arguments[0] ?? {}, "animationFrameCanceller")
      ? animationFrameCanceller
      : defaults.animationFrameCanceller,
    listenerRegistrar: hasOwn(arguments[0] ?? {}, "listenerRegistrar")
      ? listenerRegistrar
      : defaults.listenerRegistrar,
    listenerRemover: hasOwn(arguments[0] ?? {}, "listenerRemover")
      ? listenerRemover
      : defaults.listenerRemover,
    ...(cleanupProvider
      ? { cleanupProvider: { ...defaults.cleanupProvider, ...cleanupProvider } }
      : {})
  };

  const validationProblems = validateSeams(seams);
  let controller = null;
  let lastFailureReason =
    validationProblems.length > 0 ? validationProblems[0] : null;

  function getStatus() {
    return deepFreeze({
      schemaId: STATUS_SCHEMA_ID,
      compositionReady: validationProblems.length === 0,
      controllerCreated: !!controller,
      mapProviderAvailable: isAvailableFunction(seams.mapProvider.getMap),
      readinessProviderAvailable: isAvailableFunction(
        seams.readinessProvider.getPersistentAttachmentReadiness
      ),
      authorizationProviderAvailable:
        isAvailableFunction(seams.authorizationProvider.isLocalDevelopment) &&
        isAvailableFunction(seams.authorizationProvider.createPersistentSession),
      identityProviderAvailable: isAvailableFunction(
        seams.identityProvider.getPersistentAttachmentIdentity
      ),
      surfaceProviderAvailable: isAvailableFunction(
        seams.surfaceProvider.preparePersistentSurface
      ),
      lifecycleOwnerProviderAvailable: isAvailableFunction(
        seams.lifecycleOwnerProvider.createLifecycleOwner
      ),
      snapshotProviderAvailable: isAvailableFunction(
        seams.snapshotProvider.createPersistentSnapshot
      ),
      drawProviderAvailable: isAvailableFunction(seams.drawProvider.drawPersistentFrame),
      schedulerAvailable: isAvailableFunction(seams.animationFrameScheduler),
      cancellerAvailable: isAvailableFunction(seams.animationFrameCanceller),
      listenerRegistrarAvailable: isAvailableFunction(seams.listenerRegistrar),
      listenerRemoverAvailable: isAvailableFunction(seams.listenerRemover),
      cleanupProviderAvailable: isAvailableFunction(
        seams.cleanupProvider.cleanupPersistentAttachment
      ),
      forbiddenGlobalLookupDetected: false,
      windowAccessDetected: false,
      realMapAccessDetected: false,
      realCanvasAccessDetected: false,
      realListenerAccessDetected: false,
      realRendererAccessDetected: false,
      lastFailureReason,
      canonicalSafetyFlags: canonicalSafetyFlags()
    });
  }

  function createControllerFromComposition() {
    if (controller) {
      return controller;
    }

    if (validationProblems.length > 0) {
      throw Object.assign(new Error(validationProblems[0]), {
        reasonCode: validationProblems[0]
      });
    }

    const wrappedListenerRegistrar = (eventName, handler) => {
      if (!APPROVED_EVENTS.includes(eventName)) {
        throw Object.assign(new Error("FORBIDDEN_LISTENER_EVENT"), {
          reasonCode: "FORBIDDEN_LISTENER_EVENT"
        });
      }

      const registration = seams.listenerRegistrar(eventName, handler);
      const actualEvent =
        typeof registration?.eventName === "string" && registration.eventName
          ? registration.eventName
          : eventName;

      if (!APPROVED_EVENTS.includes(actualEvent)) {
        throw Object.assign(new Error("FORBIDDEN_LISTENER_EVENT"), {
          reasonCode: "FORBIDDEN_LISTENER_EVENT"
        });
      }

      return registration;
    };

    const wrappedIdentityProvider = {
      getPersistentAttachmentIdentity(args) {
        const identity = seams.identityProvider.getPersistentAttachmentIdentity(args);
        if (!immutableSerializable(identity)) {
          throw Object.assign(new Error("IDENTITY_NOT_SERIALIZABLE"), {
            reasonCode: "IDENTITY_NOT_SERIALIZABLE"
          });
        }
        return deepFreeze({ ...identity });
      }
    };

    const wrappedReadinessProvider = {
      getPersistentAttachmentReadiness(args) {
        const readiness =
          seams.readinessProvider.getPersistentAttachmentReadiness(args);
        if (!readiness || typeof readiness !== "object") {
          throw Object.assign(new Error("READINESS_RESULT_INVALID"), {
            reasonCode: "READINESS_RESULT_INVALID"
          });
        }
        if (!immutableSerializable(readiness)) {
          throw Object.assign(new Error("READINESS_NOT_SERIALIZABLE"), {
            reasonCode: "READINESS_NOT_SERIALIZABLE"
          });
        }
        return deepFreeze({
          ...readiness,
          identity: readiness.identity ? { ...readiness.identity } : undefined
        });
      }
    };

    const wrappedSnapshotProvider = {
      createPersistentSnapshot(args) {
        const snapshot = seams.snapshotProvider.createPersistentSnapshot(args);
        if (!immutableSerializable(snapshot)) {
          throw Object.assign(new Error("SNAPSHOT_NOT_SERIALIZABLE"), {
            reasonCode: "SNAPSHOT_NOT_SERIALIZABLE"
          });
        }
        return deepFreeze({ ...snapshot });
      }
    };

    controller = createControlledPersistentAtlasController({
      mapProvider: seams.mapProvider,
      readinessProvider: wrappedReadinessProvider,
      authorizationProvider: seams.authorizationProvider,
      identityProvider: wrappedIdentityProvider,
      surfaceProvider: seams.surfaceProvider,
      lifecycleOwnerProvider: seams.lifecycleOwnerProvider,
      snapshotProvider: wrappedSnapshotProvider,
      drawProvider: seams.drawProvider,
      animationFrameScheduler: {
        schedule(callback) {
          return seams.animationFrameScheduler(callback);
        },
        cancel(handle) {
          return seams.animationFrameCanceller(handle);
        }
      },
      listenerRegistrar: wrappedListenerRegistrar,
      listenerRemover: seams.listenerRemover,
      cleanupProvider: seams.cleanupProvider
    });

    return controller;
  }

  return deepFreeze({
    createPersistentControllerFromComposition: createControllerFromComposition,
    getPersistentAdapterCompositionStatus: getStatus
  });
}

export function createPersistentControllerFromComposition(composition) {
  return composition.createPersistentControllerFromComposition();
}

export function getPersistentAdapterCompositionStatus(composition) {
  return composition.getPersistentAdapterCompositionStatus();
}
