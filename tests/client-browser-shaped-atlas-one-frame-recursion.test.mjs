import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const traceModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-execution-trace.mjs"
  )
);
const commandModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-one-frame-command.mjs"
  )
);
const bridgeModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-live-map-centre-atlas-bridge.mjs"
  )
);
function createSafetyFlags() {
  return Object.freeze({
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function createMapStub() {
  return {
    getCenter() {
      return { lat: -38.12, lng: 144.61 };
    }
  };
}

function createReadinessAdapter() {
  return {
    getSafetyFlags() {
      return createSafetyFlags();
    },
    getAtlasMapDiagnostic({ latitude, longitude }) {
      return Object.freeze({
        diagnosticStatus: "resolved",
        reasonCode: "RESOLVED",
        coordinate: Object.freeze({ latitude, longitude }),
        approvedScope: "developer_only_manual_one_frame",
        resolvedRegion: Object.freeze({ regionId: "REGION_001" }),
        resolvedPackage: Object.freeze({
          packageId: "PACKAGE_001",
          packageVersion: "v001",
          packageFingerprint: "fingerprint-001"
        }),
        resolvedRecipe: Object.freeze({
          recipeId: "RECIPE_001",
          selectedVersion: "v001"
        }),
        selectorSeed: "seed-001",
        safetyFlags: createSafetyFlags(),
        executionBoundaries: Object.freeze({})
      });
    }
  };
}

function createAuthorization() {
  let consumed = false;
  return {
    getAtlasRendererHandoffAuthorizationStatus() {
      return Object.freeze({
        schemaId: "ATLAS_RENDERER_HANDOFF_AUTHORIZATION_STATUS_001",
        authorizationActive: !consumed,
        authorizationConsumed: consumed,
        authorizationInvalidated: false,
        approvedReadinessBound: true,
        currentReadinessMatchesAuthorization: true,
        sessionId: "AUTH_SESSION_001",
        boundRegionId: "REGION_001",
        boundPackageId: "PACKAGE_001",
        boundPackageVersion: "v001",
        boundPackageFingerprint: "fingerprint-001",
        boundRecipeId: "RECIPE_001",
        boundRecipeVersion: "v001",
        boundSelectorSeed: "seed-001",
        canonicalRuntimeExecutionEnabled: false,
        canonicalMapAttachmentAllowed: false,
        canonicalAutomaticRendererExecutionAllowed: false,
        canonicalLifecycleExecutionEnabled: false
      });
    },
    consumeAuthorizedRendererHandoffAttempt() {
      consumed = true;
      return Object.freeze({
        operation: "consume",
        outcome: "consumed",
        reasonCode: "CONSUMED"
      });
    }
  };
}

function installNamespaceHarness({
  recursivePublicGetter = false,
  explicitReturnWrapper = true
} = {}) {
  const trace =
    traceModule.createDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace({
      maxDepth: 8
    });
  trace.reset("TRACE_RESET_FOR_BROWSER_HARNESS");

  const mapStub = createMapStub();
  const namespace = {
    getGrowGoMap() {
      return mapStub;
    },
    getCustom25DOneFrameBridge() {
      return Object.freeze({
        createCustom25DFrameViewportSnapshotForOneFrame({ map, canvas } = {}) {
          return Object.freeze({
            outcome: "snapshot_created",
            reasonCode: "FRAME_VIEWPORT_SNAPSHOT_CREATED",
            frameViewportSnapshot: Object.freeze({
              logicalWidth: 640,
              logicalHeight: 360,
              backingWidth: 1280,
              backingHeight: 720,
              devicePixelRatio: 2,
              bounds: Object.freeze({
                north: -38.0,
                south: -38.2,
                east: 144.7,
                west: 144.5
              }),
              northWestCoordinate: Object.freeze({
                latitude: -38.0,
                longitude: 144.5
              }),
              canvasLayerPosition: Object.freeze({ x: 12, y: 24 }),
              zoom: 15,
              mapIdentityValidated: map === mapStub,
              canvasIdentityValidated: !!canvas,
              snapshotCreated: true
            })
          });
        },
        drawCustom25DOneFrameFromSnapshot() {
          return Object.freeze({
            outcome: "drawn",
            reasonCode: "FRAME_DRAW_COMPLETED"
          });
        }
      });
    }
  };

  const globalObject = {
    location: { hostname: "127.0.0.1" },
    requestAnimationFrame(callback) {
      callback(16);
      return 1;
    },
    GrowGoDeveloperDiagnostics: namespace
  };

  traceModule.installDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace({
    globalObject,
    trace
  });

  const scriptGetGrowGoMap = namespace.getGrowGoMap.bind(namespace);
  const scriptGetBridge = namespace.getCustom25DOneFrameBridge.bind(namespace);

  const reboundPublicMapGetter = trace.wrap(
    "reboundGrowGoMapGetter",
    () => globalObject.GrowGoDeveloperDiagnostics.getGrowGoMap()
  );

  if (recursivePublicGetter) {
    globalObject.GrowGoDeveloperDiagnostics.getGrowGoMap = reboundPublicMapGetter;
  }

  const capturedMapGetter = trace.wrap(
    "capturedScriptGetGrowGoMap",
    () => scriptGetGrowGoMap()
  );
  const publicMapGetter = trace.wrap(
    "publicDiagnosticsGetGrowGoMap",
    () => globalObject.GrowGoDeveloperDiagnostics.getGrowGoMap()
  );
  const resolvedMapGetter = recursivePublicGetter ? publicMapGetter : capturedMapGetter;

  const liveBridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: resolvedMapGetter,
    atlasAdapter: createReadinessAdapter()
  });

  bridgeModule.installDeveloperOnlyLiveMapCentreAtlasDiagnosticBridge({
    globalObject,
    bridge: liveBridge
  });

  globalObject.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffReadiness =
    trace.wrap("getAtlasRendererHandoffReadiness", () => {
      const atlasDiagnostic =
        globalObject.GrowGoDeveloperDiagnostics.getAtlasDiagnosticForCurrentMapCentre();

      return Object.freeze({
        schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
        diagnosticStatus: atlasDiagnostic.diagnosticStatus,
        reasonCode: atlasDiagnostic.reasonCode,
        coordinate: atlasDiagnostic.coordinate,
        approvedDeveloperOnlyScope: atlasDiagnostic.approvedScope,
        resolvedRegion: atlasDiagnostic.resolvedRegion,
        resolvedPackage: atlasDiagnostic.resolvedPackage,
        resolvedRecipe: atlasDiagnostic.resolvedRecipe,
        selectorSeed: atlasDiagnostic.selectorSeed,
        rendererHandoffStatus: "ready_for_future_renderer_attachment",
        rendererConsumerAvailable: true,
        rendererIdentityValidated: true,
        rendererInitializationRequested: false,
        rendererAttached: false,
        drawRequested: false,
        canvasCreated: false,
        webglContextCreated: false,
        overlayCreated: false,
        listenerAdded: false,
        networkRequested: false,
        assetDownloadRequested: false,
        automaticInvocation: false,
        safetyFlagSnapshot: createSafetyFlags(),
        atlasDiagnostic,
        rendererHandoff: Object.freeze({
          handoffStatus: "ready_for_future_renderer_attachment",
          rendererConsumerAvailable: true,
          rendererIdentityValidated: true,
          rendererInitializationRequested: false,
          rendererAttached: false,
          drawRequested: false,
          canvasCreated: false,
          webglContextCreated: false,
          overlayCreated: false,
          networkRequested: false,
          assetDownloadRequested: false,
          safetyFlagSnapshot: createSafetyFlags()
        })
      });
    });

  const authorization = createAuthorization();
  globalObject.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffAuthorizationStatus =
    authorization.getAtlasRendererHandoffAuthorizationStatus;

  const adapterState = {
    snapshotCount: 0,
    drawCount: 0,
    cleanupCount: 0
  };

  const adapter = {
    getAdapterStatus() {
      return {
        adapterReady: true,
        schemaId: "GROWGO_CUSTOM25D_DEVELOPER_ONLY_LIVE_ONE_FRAME_ADAPTER_STATUS_001"
      };
    },
    executeDeveloperOnlyLiveOneFrameAdapter() {
      const resolvedMap = resolvedMapGetter();
      const bridge = recursivePublicGetter
        ? globalObject.GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridge()
        : scriptGetBridge();
      const canvas = {
        className: "custom-25d-map-canvas",
        style: {},
        getContext() {
          return {
            setTransform() {},
            clearRect() {}
          };
        }
      };

      const snapshotResult = trace.wrap(
        "createCustom25DFrameViewportSnapshotForOneFrame",
        bridge.createCustom25DFrameViewportSnapshotForOneFrame
      )({
        map: resolvedMap,
        canvas
      });
      adapterState.snapshotCount += 1;

      const drawResult = trace.wrap(
        "drawCustom25DOneFrameFromSnapshot",
        bridge.drawCustom25DOneFrameFromSnapshot
      )({
        canvas,
        frameViewportSnapshot: snapshotResult.frameViewportSnapshot
      });
      adapterState.drawCount += 1;

      return {
        outcome: "pending_cleanup",
        reasonCode: "DEFERRED_CLEANUP_PENDING",
        surfacePrepared: true,
        lifecycleRegistered: true,
        frameSnapshotCreated:
          snapshotResult.outcome === "snapshot_created" &&
          drawResult.outcome === "drawn",
        drawAttemptCount: 1,
        completedFrameCount: drawResult.outcome === "drawn" ? 1 : 0,
        cleanupAttemptCount: 0,
        cleanupCompleted: false,
        referencesReleased: false,
        permanentlyClosed: false
      };
    },
    completeDeferredCleanup() {
      adapterState.cleanupCount += 1;
      return {
        outcome: "completed",
        reasonCode: "LIVE_ONE_FRAME_DRAW_COMPLETED",
        cleanupAttemptCount: 1,
        cleanupCompleted: true,
        cleanupFailed: false,
        cleanupFailureReasons: [],
        referencesReleased: true,
        permanentlyClosed: true
      };
    }
  };

  const command = commandModule.createDeveloperOnlyAtlasCustom25DOneFrameCommand({
    hostnameProvider: () => globalObject.location.hostname,
    readinessProvider: () =>
      globalObject.GrowGoDeveloperDiagnostics.getAtlasRendererHandoffReadiness(),
    authorizationStatusProvider:
      authorization.getAtlasRendererHandoffAuthorizationStatus,
    authorizationConsume: authorization.consumeAuthorizedRendererHandoffAttempt,
    adapterProvider: trace.wrap("adapterProvider", () => adapter),
    animationFrameProvider: globalObject.requestAnimationFrame,
    commandIdGenerator: () => "ATLAS_CUSTOM25D_ONE_FRAME_COMMAND_RESULT_001"
  });

  const installedNamespace =
    commandModule.installDeveloperOnlyAtlasCustom25DOneFrameCommand({
      globalObject,
      command
    });

  if (!explicitReturnWrapper) {
    installedNamespace.runAuthorizedAtlasCustom25DOneFrame = (input) => {
      command.runAuthorizedAtlasCustom25DOneFrame(input);
    };
  }

  return {
    trace,
    namespace: globalObject.GrowGoDeveloperDiagnostics,
    adapterState
  };
}

test("browser-shaped rebound public getter wiring reproduces the old recursion chain and trace catches the repeated calls", async () => {
  const harness = installNamespaceHarness({
    recursivePublicGetter: true
  });

  await assert.rejects(
    () =>
      harness.namespace.runAuthorizedAtlasCustom25DOneFrame({
        confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
      }),
    /TRACE_MAX_DEPTH_EXCEEDED/
  );

  const traceSnapshot =
    harness.namespace.getAtlasCustom25DOneFrameExecutionTrace();

  assert.equal(traceSnapshot.recursionDetected, true);
  assert.equal(traceSnapshot.overflowPrevented, true);
  assert.equal(traceSnapshot.repeatedCallChain.length >= 3, true);
  for (const name of traceSnapshot.repeatedCallChain) {
    assert.equal(name, "reboundGrowGoMapGetter");
  }
  assert.equal(traceSnapshot.last30FunctionNames.length > 0, true);
});

test("browser-shaped captured script getter wiring completes one snapshot, one draw, one cleanup, and returns the real command result object", async () => {
  const harness = installNamespaceHarness({
    recursivePublicGetter: false,
    explicitReturnWrapper: true
  });

  const result = await harness.namespace.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });

  assert.equal(result.commandId, "ATLAS_CUSTOM25D_ONE_FRAME_COMMAND_RESULT_001");
  assert.equal(result.outcome, "completed");
  assert.equal(result.frameSnapshotCreated, true);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.referencesReleased, true);
  assert.equal(harness.adapterState.snapshotCount, 1);
  assert.equal(harness.adapterState.drawCount, 1);
  assert.equal(harness.adapterState.cleanupCount, 1);
  assert.equal(result.canonicalSafetyFlagSnapshot.runtimeExecutionEnabled, false);
  assert.equal(result.canonicalSafetyFlagSnapshot.mapAttachmentAllowed, false);
  assert.equal(
    result.canonicalSafetyFlagSnapshot.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(result.canonicalSafetyFlagSnapshot.lifecycleExecutionEnabled, false);

  const traceSnapshot =
    harness.namespace.getAtlasCustom25DOneFrameExecutionTrace();
  assert.equal(traceSnapshot.recursionDetected, false);
  assert.equal(traceSnapshot.maxObservedDepth > 0, true);
});

test("browser-shaped namespace wrapper must return the underlying one-frame command promise result instead of undefined", async () => {
  const harness = installNamespaceHarness({
    recursivePublicGetter: false,
    explicitReturnWrapper: true
  });
  const brokenHarness = installNamespaceHarness({
    recursivePublicGetter: false,
    explicitReturnWrapper: false
  });

  const result = await harness.namespace.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });
  const brokenResult =
    await brokenHarness.namespace.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });

  assert.equal(result.commandId, "ATLAS_CUSTOM25D_ONE_FRAME_COMMAND_RESULT_001");
  assert.equal(brokenResult, undefined);
});
