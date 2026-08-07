import { createDevelopmentAlphaController } from "./development-alpha-controller.mjs";
import { createDevelopmentAlphaFirebaseRuntime } from "./development-alpha-runtime.mjs";
import {
  createControlledOneSessionDeveloperMapAttachmentAuthorization,
  installControlledOneSessionDeveloperMapAttachmentAuthorization
} from "./developer-only-atlas-map-attachment-authorization.mjs";
import {
  createControlledOneSessionDeveloperRendererHandoffAuthorization,
  installControlledOneSessionDeveloperRendererHandoffAuthorization
} from "./developer-only-atlas-renderer-handoff-authorization.mjs";
import {
  createGatedDeveloperOnlyAtlasMapAttachmentController,
  installGatedDeveloperOnlyAtlasMapAttachmentController
} from "./developer-only-atlas-map-attachment-controller.mjs";
import {
  createDeveloperOnlyLiveMapCentreAtlasBridge,
  installDeveloperOnlyLiveMapCentreAtlasDiagnosticBridge
} from "./developer-only-live-map-centre-atlas-bridge.mjs";
import {
  createDeveloperOnlyLiveAtlasRendererHandoffReadiness,
  installDeveloperOnlyLiveAtlasRendererHandoffReadiness
} from "./developer-only-live-atlas-renderer-handoff-readiness.mjs";
import {
  createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter
} from "./developer-only-growgo-custom25d-live-one-frame-adapter.mjs?v=atlas21150am";
import {
  createDeveloperOnlyAtlasCustom25DOneFrameCommand,
  installDeveloperOnlyAtlasCustom25DOneFrameCommand
} from "./developer-only-atlas-custom25d-one-frame-command.mjs";
import {
  createControlledPersistentAtlasContractIntegration
} from "./developer-only-controlled-persistent-atlas-contract-integration.mjs";
import {
  createDeveloperOnlyControlledPersistentAtlasManualCommand,
  installDeveloperOnlyControlledPersistentAtlasManualCommand
} from "./developer-only-controlled-persistent-atlas-manual-command.mjs";
import {
  createDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace,
  installDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace
} from "./developer-only-atlas-custom25d-one-frame-execution-trace.mjs";
import {
  createDiscoveredGrowGoCustom25DRendererConsumerDescriptor
} from "./developer-only-atlas-renderer-zero-draw-handoff.mjs";
import {
  createGrowGoCustom25DLiveOneFrameSurfaceOperations
} from "./growgo-custom25d-live-one-frame-surface-operations.mjs";
import {
  normalizePersistentAtlasFrameSnapshotForContract,
  toOneFrameViewportSnapshotContract
} from "./developer-only-persistent-atlas-frame-snapshot-provider.mjs";

const CLIENT_CONFIG_GLOBAL = "__GROWGO_DEVELOPMENT_ALPHA_CLIENT_CONFIG__";
const atlasCustom25DOneFrameExecutionTrace =
  createDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace();

installDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace({
  globalObject: globalThis,
  trace: atlasCustom25DOneFrameExecutionTrace
});

function readDiagnosticsNamespace() {
  const namespace = globalThis?.GrowGoDeveloperDiagnostics;
  return namespace && typeof namespace === "object" ? namespace : null;
}

function captureDiagnosticsFunction(functionName) {
  const namespace = readDiagnosticsNamespace();
  const candidate = namespace?.[functionName];
  return typeof candidate === "function" ? candidate.bind(namespace) : null;
}

function createCapturedRawLeafletMapProvider(mapGetter) {
  const capturedMapGetter = typeof mapGetter === "function" ? mapGetter : null;

  return atlasCustom25DOneFrameExecutionTrace.wrap(
    "rawLeafletMapProvider",
    () => capturedMapGetter?.() ?? null
  );
}

function createCapturedOneFrameBridgeProvider(bridgeGetter) {
  const capturedBridgeGetter = typeof bridgeGetter === "function" ? bridgeGetter : null;
  let cachedBridge = undefined;

  return atlasCustom25DOneFrameExecutionTrace.wrap(
    "capturedOneFrameBridgeProvider",
    () => {
      if (cachedBridge !== undefined) {
        return cachedBridge;
      }

      cachedBridge = capturedBridgeGetter?.() ?? null;
      return cachedBridge;
    }
  );
}

const getGrowGoMapFromScriptDiagnostics = captureDiagnosticsFunction("getGrowGoMap");
const getCustom25DOneFrameBridgeFromScriptDiagnostics = captureDiagnosticsFunction(
  "getCustom25DOneFrameBridge"
);
const capturedOneFrameBridgeProviderFromScriptDiagnostics =
  createCapturedOneFrameBridgeProvider(getCustom25DOneFrameBridgeFromScriptDiagnostics);
const capturedOneFrameBridgeFromScriptDiagnostics =
  capturedOneFrameBridgeProviderFromScriptDiagnostics();
const createCustom25DFrameViewportSnapshotForOneFrameFromScriptDiagnostics =
  typeof capturedOneFrameBridgeFromScriptDiagnostics
    ?.createCustom25DFrameViewportSnapshotForOneFrame === "function"
    ? capturedOneFrameBridgeFromScriptDiagnostics.createCustom25DFrameViewportSnapshotForOneFrame.bind(
        capturedOneFrameBridgeFromScriptDiagnostics
      )
    : null;
const drawCustom25DOneFrameFromSnapshotFromScriptDiagnostics =
  typeof capturedOneFrameBridgeFromScriptDiagnostics?.drawCustom25DOneFrameFromSnapshot ===
  "function"
    ? capturedOneFrameBridgeFromScriptDiagnostics.drawCustom25DOneFrameFromSnapshot.bind(
        capturedOneFrameBridgeFromScriptDiagnostics
      )
    : null;
const rawLeafletMapReferenceFromBridge = capturedOneFrameBridgeFromScriptDiagnostics
  ?.rawLeafletMapReference ?? null;

const rawLeafletMapProviderFromScriptDiagnostics =
  createCapturedRawLeafletMapProvider(getGrowGoMapFromScriptDiagnostics);

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

const persistentMapIdentityTokens = new WeakMap();
let persistentMapIdentityCounter = 0;
let persistentSessionCandidateCounter = 0;
let persistentSessionCandidateId = null;
let persistentSnapshotCounter = 0;
const persistentSnapshotDiagnosticsState = {
  lastFailureReason: null,
  rawReferenceDetected: false,
  rawReferenceFieldPath: null,
  rawReferenceType: null,
  rawReferenceConstructorName: null,
  snapshotCreateAttemptCount: 0,
  snapshotCreateCompletedCount: 0,
  snapshotValidationAttemptCount: 0,
  snapshotValidationCompletedCount: 0
};
let persistentPreparedSurface = null;
let persistentLifecycleOwner = null;
let persistentLifecycleOwnerId = null;
let persistentLifecycleGenerationId = null;
let persistentSurfaceOwnerId = null;

function readPersistentBridgeMapReference(bridge) {
  return bridge?.rawLeafletMapReference ?? null;
}

function resolvePersistentAuthoritativeMapReference(preferredMap = null) {
  const bridgeFromCapturedProvider =
    capturedOneFrameBridgeProviderFromScriptDiagnostics?.() ?? null;
  const bridgeFromDirectGetter =
    typeof getCustom25DOneFrameBridgeFromScriptDiagnostics === "function"
      ? getCustom25DOneFrameBridgeFromScriptDiagnostics() ?? null
      : null;

  const capturedBridgeMap = readPersistentBridgeMapReference(
    bridgeFromCapturedProvider
  );
  const directBridgeMap = readPersistentBridgeMapReference(bridgeFromDirectGetter);
  const authoritativeBridgeMap = capturedBridgeMap ?? directBridgeMap ?? null;

  if (
    preferredMap &&
    authoritativeBridgeMap &&
    preferredMap !== authoritativeBridgeMap
  ) {
    throw Object.assign(new Error("STALE_MAP_REFERENCE"), {
      reasonCode: "STALE_MAP_REFERENCE"
    });
  }

  const resolvedMap = preferredMap ?? authoritativeBridgeMap ?? null;

  if (!resolvedMap || typeof resolvedMap !== "object") {
    throw Object.assign(new Error("MAP_UNAVAILABLE"), {
      reasonCode: "MAP_UNAVAILABLE"
    });
  }

  return resolvedMap;
}

function resolvePersistentMapIdentityId(map) {
  const authoritativeMap = resolvePersistentAuthoritativeMapReference(map);

  if (!persistentMapIdentityTokens.has(authoritativeMap)) {
    persistentMapIdentityCounter += 1;
    persistentMapIdentityTokens.set(
      authoritativeMap,
      `LIVE_PERSISTENT_ATLAS_MAP_${String(persistentMapIdentityCounter).padStart(3, "0")}`
    );
  }

  return persistentMapIdentityTokens.get(authoritativeMap);
}

function ensurePersistentSessionCandidateId() {
  if (persistentSessionCandidateId) {
    return persistentSessionCandidateId;
  }

  persistentSessionCandidateCounter += 1;
  persistentSessionCandidateId = `LIVE_PERSISTENT_ATLAS_SESSION_${String(
    persistentSessionCandidateCounter
  ).padStart(3, "0")}`;
  return persistentSessionCandidateId;
}

function clearPersistentRuntimeReferences() {
  persistentPreparedSurface = null;
  persistentLifecycleOwner = null;
  persistentLifecycleOwnerId = null;
  persistentLifecycleGenerationId = null;
  persistentSurfaceOwnerId = null;
}

function createPersistentSnapshotIdentifiers() {
  persistentSnapshotCounter += 1;
  const sequence = String(persistentSnapshotCounter).padStart(3, "0");

  return {
    snapshotId: `PERSISTENT_ATLAS_SNAPSHOT_${sequence}`,
    snapshotGenerationId: `PERSISTENT_ATLAS_SNAPSHOT_GENERATION_${sequence}`,
    snapshotCreatedAt: "2026-08-06T00:00:00.000Z"
  };
}

function readPersistentSnapshotDiagnosticsStatus() {
  return Object.freeze({
    lastFailureReason: persistentSnapshotDiagnosticsState.lastFailureReason,
    rawReferenceDetected:
      persistentSnapshotDiagnosticsState.rawReferenceDetected === true,
    rawReferenceFieldPath:
      persistentSnapshotDiagnosticsState.rawReferenceFieldPath,
    rawReferenceType: persistentSnapshotDiagnosticsState.rawReferenceType,
    rawReferenceConstructorName:
      persistentSnapshotDiagnosticsState.rawReferenceConstructorName,
    snapshotCreateAttemptCount:
      persistentSnapshotDiagnosticsState.snapshotCreateAttemptCount,
    snapshotCreateCompletedCount:
      persistentSnapshotDiagnosticsState.snapshotCreateCompletedCount,
    snapshotValidationAttemptCount:
      persistentSnapshotDiagnosticsState.snapshotValidationAttemptCount,
    snapshotValidationCompletedCount:
      persistentSnapshotDiagnosticsState.snapshotValidationCompletedCount
  });
}

function readApprovedPersistentReadinessIdentity(map) {
  const readiness = atlasRendererHandoffReadiness.getAtlasRendererHandoffReadiness();

  if (!readiness || readiness.diagnosticStatus === "blocked") {
    throw Object.assign(
      new Error(
        readiness?.rendererHandoff?.reasonCode ??
          readiness?.reasonCode ??
          "READINESS_REJECTED"
      ),
      {
        reasonCode:
          readiness?.rendererHandoff?.reasonCode ??
          readiness?.reasonCode ??
          "READINESS_REJECTED"
      }
    );
  }

  if (
    readiness.schemaId !== "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001" ||
    readiness.diagnosticStatus !== "resolved" ||
    readiness.reasonCode !== "RESOLVED" ||
    readiness.rendererHandoffStatus !== "ready_for_future_renderer_attachment"
  ) {
    throw Object.assign(new Error("READINESS_REJECTED"), {
      reasonCode:
        readiness?.rendererHandoff?.reasonCode ??
        readiness?.reasonCode ??
        "READINESS_REJECTED"
    });
  }

  const authoritativeMap = resolvePersistentAuthoritativeMapReference(map);

  const identity = Object.freeze({
    sessionId: ensurePersistentSessionCandidateId(),
    mapIdentityId: resolvePersistentMapIdentityId(authoritativeMap),
    regionId: readiness?.resolvedRegion?.regionId ?? null,
    packageId: readiness?.resolvedPackage?.packageId ?? null,
    packageVersion: readiness?.resolvedPackage?.packageVersion ?? null,
    packageFingerprint: readiness?.resolvedPackage?.packageFingerprint ?? null,
    recipeId: readiness?.resolvedRecipe?.recipeId ?? null,
    recipeVersion: readiness?.resolvedRecipe?.selectedVersion ?? null,
    selectorSeed: readiness?.selectorSeed ?? null
  });

  if (Object.values(identity).some((value) => value == null)) {
    throw Object.assign(new Error("READINESS_IDENTITY_INVALID"), {
      reasonCode: "READINESS_IDENTITY_INVALID"
    });
  }

  return identity;
}

const atlasLiveMapCentreBridge = createDeveloperOnlyLiveMapCentreAtlasBridge({
  getGrowGoMap: rawLeafletMapProviderFromScriptDiagnostics
});

installDeveloperOnlyLiveMapCentreAtlasDiagnosticBridge({
  globalObject: globalThis,
  bridge: atlasLiveMapCentreBridge
});

const atlasMapAttachmentAuthorization =
  createControlledOneSessionDeveloperMapAttachmentAuthorization({
    getSafetyFlags() {
      return atlasLiveMapCentreBridge.getSafetyFlags();
    }
  });

const atlasMapAttachmentController =
  createGatedDeveloperOnlyAtlasMapAttachmentController({
    getGrowGoMap: rawLeafletMapProviderFromScriptDiagnostics,
    runAtlasDiagnostic() {
      const diagnosticFunction =
        globalThis?.GrowGoDeveloperDiagnostics?.getAtlasDiagnosticForCurrentMapCentre;

      return typeof diagnosticFunction === "function" ? diagnosticFunction() : null;
    },
    getAuthorizationState() {
      return atlasMapAttachmentAuthorization.readAttachmentAuthorizationStateForController();
    }
  });

installGatedDeveloperOnlyAtlasMapAttachmentController({
  globalObject: globalThis,
  controller: atlasMapAttachmentController
});

installControlledOneSessionDeveloperMapAttachmentAuthorization({
  globalObject: globalThis,
  authorization: atlasMapAttachmentAuthorization,
  controller: atlasMapAttachmentController
});

const atlasRendererHandoffReadiness =
  createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre() {
      const diagnosticFunction =
        globalThis?.GrowGoDeveloperDiagnostics?.getAtlasDiagnosticForCurrentMapCentre;

      return typeof diagnosticFunction === "function" ? diagnosticFunction() : null;
    },
    getRendererConsumerDescriptor() {
      return createDiscoveredGrowGoCustom25DRendererConsumerDescriptor();
    }
  });

installDeveloperOnlyLiveAtlasRendererHandoffReadiness({
  globalObject: globalThis,
  readiness: atlasRendererHandoffReadiness
});

const atlasRendererHandoffAuthorization =
  createControlledOneSessionDeveloperRendererHandoffAuthorization({
    getCurrentReadiness() {
      return atlasRendererHandoffReadiness.getAtlasRendererHandoffReadiness();
    }
  });

installControlledOneSessionDeveloperRendererHandoffAuthorization({
  globalObject: globalThis,
  authorization: atlasRendererHandoffAuthorization
});

const growGoCustom25DLiveOneFrameAdapter =
  createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
    rawLeafletMapReference: rawLeafletMapReferenceFromBridge,
    frameSnapshotProvider: () =>
      atlasCustom25DOneFrameExecutionTrace.wrap(
        "createCustom25DFrameViewportSnapshotForOneFrame",
        (input) =>
          createCustom25DFrameViewportSnapshotForOneFrameFromScriptDiagnostics?.(
            input
          ) ?? null
      ),
    drawFunctionProvider: () =>
      atlasCustom25DOneFrameExecutionTrace.wrap(
        "drawCustom25DOneFrameFromSnapshot",
        (input) =>
          drawCustom25DOneFrameFromSnapshotFromScriptDiagnostics?.(input) ?? null
      )
  });

const atlasCustom25DOneFrameCommand =
  createDeveloperOnlyAtlasCustom25DOneFrameCommand({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    readinessProvider: () =>
      atlasRendererHandoffReadiness.getAtlasRendererHandoffReadiness(),
    authorizationStatusProvider: () =>
      atlasRendererHandoffAuthorization.getAtlasRendererHandoffAuthorizationStatus(),
    authorizationConsume: () =>
      atlasRendererHandoffAuthorization.consumeAuthorizedRendererHandoffAttempt(),
    adapterProvider: () => growGoCustom25DLiveOneFrameAdapter,
    animationFrameProvider: (callback) => globalThis?.requestAnimationFrame?.(callback)
  });

installDeveloperOnlyAtlasCustom25DOneFrameCommand({
  globalObject: globalThis,
  command: atlasCustom25DOneFrameCommand
});

const persistentOneFrameSurfaceOperations =
  createGrowGoCustom25DLiveOneFrameSurfaceOperations({
    leafletProvider: globalThis?.L ?? null,
    devicePixelRatioProvider: () => globalThis?.devicePixelRatio ?? 1
  });

const controlledPersistentAtlasIntegration =
  createControlledPersistentAtlasContractIntegration({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    rawMapProvider: {
      resolveRawMap() {
        const map = resolvePersistentAuthoritativeMapReference();

        return {
          map,
          mapIdentityId: resolvePersistentMapIdentityId(map)
        };
      }
    },
    readinessProvider: {
      getPersistentAttachmentReadiness({ map } = {}) {
        try {
          return {
            approved: true,
            reasonCode: "READINESS_APPROVED",
            identity: readApprovedPersistentReadinessIdentity(map)
          };
        } catch (error) {
          return {
            approved: false,
            reasonCode: toReasonCode(error, "READINESS_REJECTED"),
            identity: null
          };
        }
      }
    },
    identitySnapshotProvider: {
      getPersistentAttachmentIdentity({ map } = {}) {
        return readApprovedPersistentReadinessIdentity(map);
      }
    },
    retainedSurfaceProvider: {
      preparePersistentSurface({ map, identity } = {}) {
        const prepared = persistentOneFrameSurfaceOperations.prepareOneFrameSurface({
          map
        });

        if (prepared?.outcome !== "prepared" || !prepared?.surface) {
          throw Object.assign(
            new Error(prepared?.reasonCode ?? "RETAINED_SURFACE_PROVIDER_FAILED"),
            {
              reasonCode:
                prepared?.reasonCode ?? "RETAINED_SURFACE_PROVIDER_FAILED"
            }
          );
        }

        persistentPreparedSurface = prepared.surface;
        persistentSurfaceOwnerId = `LIVE_PERSISTENT_SURFACE_${identity?.sessionId ?? "UNKNOWN"}`;
        persistentLifecycleOwnerId = `LIVE_PERSISTENT_LIFECYCLE_${identity?.sessionId ?? "UNKNOWN"}`;
        persistentLifecycleGenerationId = `${persistentLifecycleOwnerId}_GEN_001`;

        return {
          pane: prepared.surface.pane,
          canvas: prepared.surface.canvas,
          surfaceOwnerId: persistentSurfaceOwnerId,
          lifecycleOwnerId: persistentLifecycleOwnerId
        };
      }
    },
    retainedLifecycleOwnerProvider: {
      createLifecycleOwner({ identity } = {}) {
        if (!persistentPreparedSurface) {
          throw Object.assign(new Error("MISSING_PREPARED_SURFACE"), {
            reasonCode: "MISSING_PREPARED_SURFACE"
          });
        }

        if (!persistentLifecycleOwner) {
          const ownerId =
            persistentLifecycleOwnerId ??
            `LIVE_PERSISTENT_LIFECYCLE_${identity?.sessionId ?? "UNKNOWN"}`;
          const generationId =
            persistentLifecycleGenerationId ?? `${ownerId}_GEN_001`;
          const surfaceOwnerId =
            persistentSurfaceOwnerId ??
            `LIVE_PERSISTENT_SURFACE_${identity?.sessionId ?? "UNKNOWN"}`;

          persistentLifecycleOwnerId = ownerId;
          persistentLifecycleGenerationId = generationId;
          persistentSurfaceOwnerId = surfaceOwnerId;

          persistentLifecycleOwner = {
            ownerId,
            id: ownerId,
            registerOwnedResources() {
              return true;
            },
            disposeOwnedResources() {
              return true;
            },
            getLifecycleOwnerStatus() {
              return Object.freeze({
                lifecycleOwnerId: ownerId,
                lifecycleGenerationId: generationId,
                surfaceOwnerId
              });
            }
          };
        }

        return {
          lifecycleOwner: persistentLifecycleOwner,
          lifecycleOwnerId: persistentLifecycleOwnerId,
          ownerId: persistentLifecycleOwnerId,
          lifecycleGenerationId: persistentLifecycleGenerationId,
          surfaceOwnerId: persistentSurfaceOwnerId
        };
      }
    },
    frameSnapshotProvider: {
      createPersistentSnapshot({ map, identity, reason } = {}) {
        persistentSnapshotDiagnosticsState.snapshotCreateAttemptCount += 1;

        if (!persistentPreparedSurface?.canvas) {
          persistentSnapshotDiagnosticsState.lastFailureReason =
            "PERSISTENT_SURFACE_CANVAS_UNAVAILABLE";
          throw Object.assign(new Error("PERSISTENT_SURFACE_CANVAS_UNAVAILABLE"), {
            reasonCode: "PERSISTENT_SURFACE_CANVAS_UNAVAILABLE"
          });
        }

        try {
          const snapshotResult =
            createCustom25DFrameViewportSnapshotForOneFrameFromScriptDiagnostics?.({
              map,
              canvas: persistentPreparedSurface.canvas
            }) ?? null;

          if (
            !snapshotResult ||
            typeof snapshotResult !== "object" ||
            snapshotResult.outcome === "blocked" ||
            !snapshotResult.frameViewportSnapshot
          ) {
            persistentSnapshotDiagnosticsState.lastFailureReason =
              snapshotResult?.reasonCode ?? "SNAPSHOT_PROVIDER_FAILED";
            throw Object.assign(new Error("SNAPSHOT_PROVIDER_FAILED"), {
              reasonCode: snapshotResult?.reasonCode ?? "SNAPSHOT_PROVIDER_FAILED"
            });
          }

          const identifiers = createPersistentSnapshotIdentifiers();
          const snapshot = normalizePersistentAtlasFrameSnapshotForContract({
            rawSnapshot: snapshotResult.frameViewportSnapshot,
            map,
            identity,
            lifecycleIdentity: {
              lifecycleOwnerId: persistentLifecycleOwnerId,
              lifecycleGenerationId: persistentLifecycleGenerationId,
              surfaceOwnerId: persistentSurfaceOwnerId
            },
            redrawReason: reason,
            ...identifiers
          });

          persistentSnapshotDiagnosticsState.lastFailureReason = null;
          persistentSnapshotDiagnosticsState.rawReferenceDetected = false;
          persistentSnapshotDiagnosticsState.rawReferenceFieldPath = null;
          persistentSnapshotDiagnosticsState.rawReferenceType = null;
          persistentSnapshotDiagnosticsState.rawReferenceConstructorName = null;
          persistentSnapshotDiagnosticsState.snapshotCreateCompletedCount += 1;

          return snapshot;
        } catch (error) {
          const reasonCode =
            typeof error?.reasonCode === "string"
              ? error.reasonCode
              : "SNAPSHOT_PROVIDER_FAILED";
          persistentSnapshotDiagnosticsState.lastFailureReason = reasonCode;
          persistentSnapshotDiagnosticsState.rawReferenceDetected =
            reasonCode === "RAW_REFERENCE_DETECTED";
          persistentSnapshotDiagnosticsState.rawReferenceFieldPath =
            reasonCode === "RAW_REFERENCE_DETECTED" &&
            typeof error?.rawReferenceFieldPath === "string"
              ? error.rawReferenceFieldPath
              : null;
          persistentSnapshotDiagnosticsState.rawReferenceType =
            reasonCode === "RAW_REFERENCE_DETECTED" &&
            typeof error?.rawReferenceType === "string"
              ? error.rawReferenceType
              : null;
          persistentSnapshotDiagnosticsState.rawReferenceConstructorName =
            reasonCode === "RAW_REFERENCE_DETECTED" &&
            typeof error?.rawReferenceConstructorName === "string"
              ? error.rawReferenceConstructorName
              : null;
          throw error;
        }
      }
    },
    frameDrawProvider: {
      drawPersistentFrame({ canvas, snapshot } = {}) {
        const frameViewportSnapshot =
          toOneFrameViewportSnapshotContract(snapshot);
        const drawResult =
          drawCustom25DOneFrameFromSnapshotFromScriptDiagnostics?.({
            canvas: canvas ?? persistentPreparedSurface?.canvas ?? null,
            frameViewportSnapshot
          }) ?? null;

        if (
          !drawResult ||
          (drawResult.outcome === "blocked" &&
            typeof drawResult.reasonCode === "string")
        ) {
          throw Object.assign(
            new Error(drawResult?.reasonCode ?? "DRAW_PROVIDER_FAILED"),
            {
              reasonCode: drawResult?.reasonCode ?? "DRAW_PROVIDER_FAILED"
            }
          );
        }

        return drawResult;
      }
    },
    animationFrameScheduler(callback) {
      return globalThis?.requestAnimationFrame?.(() => callback());
    },
    animationFrameCanceller(handle) {
      globalThis?.cancelAnimationFrame?.(handle);
    },
    approvedListenerRegistrar(eventName, callback) {
      const map = resolvePersistentAuthoritativeMapReference();

      if (!map || typeof map.on !== "function") {
        throw Object.assign(new Error("LISTENER_REGISTRATION_FAILED"), {
          reasonCode: "LISTENER_REGISTRATION_FAILED"
        });
      }

      map.on(eventName, callback);
      return {
        map,
        eventName,
        callback
      };
    },
    approvedListenerRemover(registration) {
      registration?.map?.off?.(registration?.eventName, registration?.callback);
    },
    retainedCleanupProvider: {
      cleanupPersistentAttachment({ lifecycleOwner } = {}) {
        const cleanupFailureReasons = [];

        if (persistentPreparedSurface) {
          const rollback =
            persistentOneFrameSurfaceOperations.rollbackPreparedSurface({
              surface: persistentPreparedSurface
            });

          if (
            rollback?.outcome === "failed_closed" &&
            typeof rollback?.reasonCode === "string"
          ) {
            cleanupFailureReasons.push(rollback.reasonCode);
          }
        }

        try {
          lifecycleOwner?.disposeOwnedResources?.();
        } catch (error) {
          cleanupFailureReasons.push(
            toReasonCode(error, "LIFECYCLE_OWNER_RELEASE_FAILED")
          );
        }

        clearPersistentRuntimeReferences();

        return {
          cleanupCompleted: cleanupFailureReasons.length === 0,
          reasonCode:
            cleanupFailureReasons[0] ?? "CONTROLLED_PERSISTENT_ATLAS_CLEANUP_COMPLETED",
          cleanupFailureReasons,
          referencesReleased: cleanupFailureReasons.length === 0
        };
      }
    }
  });

const controlledPersistentAtlasManualCommand =
  createDeveloperOnlyControlledPersistentAtlasManualCommand({
    hostnameProvider: () => globalThis?.location?.hostname ?? "",
    integrationProvider: () => controlledPersistentAtlasIntegration,
    compositionStatusProvider: () =>
      Object.freeze({
        schemaId:
          "GROWGO_CONTROLLED_PERSISTENT_ATLAS_LIVE_MANUAL_COMMAND_COMPOSITION_STATUS_001",
        state: "developer_only_manual_command_ready",
        bridgeSource:
          "captured_one_frame_bridge_and_renderer_handoff_readiness",
        rootSeamsMapped: true,
        startupInvocationPrevented: true,
        snapshotStatus: readPersistentSnapshotDiagnosticsStatus()
      })
  });

installDeveloperOnlyControlledPersistentAtlasManualCommand({
  globalObject: globalThis,
  command: controlledPersistentAtlasManualCommand
});

const diagnosticsNamespace =
  globalThis?.GrowGoDeveloperDiagnostics &&
  typeof globalThis.GrowGoDeveloperDiagnostics === "object"
    ? globalThis.GrowGoDeveloperDiagnostics
    : null;

if (diagnosticsNamespace) {
  diagnosticsNamespace.getCustom25DOneFrameAdapterRuntimeIdentity = () =>
    growGoCustom25DLiveOneFrameAdapter.getCustom25DOneFrameAdapterRuntimeIdentity?.() ??
    null;
  diagnosticsNamespace.getCustom25DOneFrameLifecycleTranslationRuntimeIdentity = () =>
    growGoCustom25DLiveOneFrameAdapter.getCustom25DOneFrameLifecycleTranslationRuntimeIdentity?.() ??
    null;
  diagnosticsNamespace.getCustom25DOneFrameAdapterExecutionIdentity = () =>
    growGoCustom25DLiveOneFrameAdapter.getCustom25DOneFrameAdapterExecutionIdentity?.() ??
    null;
}

const panel = buildPanel();
const elements = bindPanelElements(panel);

const controller = createDevelopmentAlphaController({
  readConfig() {
    return globalThis[CLIENT_CONFIG_GLOBAL] ?? null;
  },
  async createRuntime(runtimeContract) {
    return createDevelopmentAlphaFirebaseRuntime(runtimeContract);
  },
  render(state) {
    renderPanel(elements, state);
  },
  toClientSafeError(error) {
    if (error && typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }

    return "The development backend is unavailable right now.";
  },
  isUnauthorizedError(error) {
    return (
      error?.code === "permission-denied" ||
      error?.code === "functions/permission-denied"
    );
  },
  createRequestId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
});

elements.signInButton.addEventListener("click", () => {
  controller.signIn().catch(() => {});
});
elements.signOutButton.addEventListener("click", () => {
  controller.signOut().catch(() => {});
});
elements.refreshButton.addEventListener("click", () => {
  controller.refreshSnapshot().catch(() => {});
});

controller.ensureInitialized().catch(() => {});

function buildPanel() {
  const panel = document.createElement("section");
  panel.id = "developmentAlphaStatusPanel";
  panel.setAttribute("aria-live", "polite");
  panel.style.position = "fixed";
  panel.style.left = "12px";
  panel.style.bottom = "12px";
  panel.style.zIndex = "5000";
  panel.style.width = "min(320px, calc(100vw - 24px))";
  panel.style.background = "rgba(7, 20, 33, 0.92)";
  panel.style.color = "#f4f8ff";
  panel.style.border = "1px solid rgba(148, 178, 220, 0.35)";
  panel.style.borderRadius = "8px";
  panel.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.35)";
  panel.style.padding = "12px";
  panel.style.fontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px;">
      <div>
        <div style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;opacity:0.72;">Development backend</div>
        <strong style="font-size:15px;">Private alpha status</strong>
      </div>
      <div id="developmentAlphaStatusBadge" style="font-size:11px;padding:4px 6px;border-radius:999px;background:#243447;">Blocked</div>
    </div>
    <div id="developmentAlphaSummary" style="font-size:13px;line-height:1.4;margin-bottom:8px;"></div>
    <div id="developmentAlphaSnapshot" style="font-size:12px;line-height:1.5;opacity:0.9;margin-bottom:10px;"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button id="developmentAlphaSignInButton" type="button" style="${buttonStyle("#5f7cff")}">Sign in</button>
      <button id="developmentAlphaRefreshButton" type="button" style="${buttonStyle("#1f7a5c")}">Refresh</button>
      <button id="developmentAlphaSignOutButton" type="button" style="${buttonStyle("#5c6470")}">Sign out</button>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

function bindPanelElements(panel) {
  return {
    badge: panel.querySelector("#developmentAlphaStatusBadge"),
    summary: panel.querySelector("#developmentAlphaSummary"),
    snapshot: panel.querySelector("#developmentAlphaSnapshot"),
    signInButton: panel.querySelector("#developmentAlphaSignInButton"),
    refreshButton: panel.querySelector("#developmentAlphaRefreshButton"),
    signOutButton: panel.querySelector("#developmentAlphaSignOutButton")
  };
}

function renderPanel(elements, state) {
  elements.badge.textContent = summarizeBadge(state);
  elements.summary.innerHTML = [
    line("Environment", state.environment),
    line("Connection", state.connectionMode ?? "blocked"),
    line("Auth", state.authStatus),
    line("Invite", state.invitedStatus)
  ].join("");

  if (state.playerSnapshot) {
    elements.snapshot.innerHTML = [
      line("UID", state.user?.uid ?? "n/a"),
      line("Email", state.user?.email ?? "n/a"),
      line("Level", String(state.playerSnapshot.level)),
      line("XP", String(state.playerSnapshot.xp)),
      line("Coins", String(state.playerSnapshot.coins))
    ].join("");
  } else if (state.genericError) {
    elements.snapshot.textContent = state.genericError;
  } else if (state.blockedReasons.length > 0) {
    elements.snapshot.textContent = `Blocked: ${state.blockedReasons.join(", ")}`;
  } else {
    elements.snapshot.textContent =
      "No backend snapshot loaded. Sign in to the invited development alpha.";
  }

  elements.signInButton.disabled =
    state.initializationStatus !== "initialized" ||
    state.authStatus === "signed-in" ||
    state.authStatus === "signing-in";
  elements.signOutButton.disabled = state.authStatus !== "signed-in";
  elements.refreshButton.disabled =
    state.authStatus !== "signed-in" ||
    state.snapshotStatus === "loading" ||
    state.bootstrapStatus === "pending";
}

function summarizeBadge(state) {
  if (state.authStatus === "signed-in" && state.playerSnapshot) {
    return "Connected";
  }

  if (state.authStatus === "unauthorized") {
    return "Denied";
  }

  if (state.initializationStatus === "initialized") {
    return "Ready";
  }

  if (state.initializationStatus === "initializing") {
    return "Starting";
  }

  return "Blocked";
}

function line(label, value) {
  return `<div><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`;
}

function buttonStyle(background) {
  return [
    "appearance:none",
    "border:none",
    "border-radius:6px",
    "padding:8px 10px",
    "font:inherit",
    "font-size:12px",
    "font-weight:600",
    "cursor:pointer",
    "color:#fff",
    `background:${background}`
  ].join(";");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
