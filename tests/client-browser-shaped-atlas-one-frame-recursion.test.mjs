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
const adapterModule = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-live-one-frame-adapter.mjs"
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

function createBoundsStub() {
  return {
    getNorthWest() {
      return { lat: -38.0, lng: 144.5 };
    },
    getNorth() {
      return -38.0;
    },
    getSouth() {
      return -38.2;
    },
    getEast() {
      return 144.7;
    },
    getWest() {
      return 144.5;
    }
  };
}

function createMapStub() {
  const panes = new Map();

  function createPane(paneName) {
    const pane = {
      dataset: { owner: paneName },
      childElementCount: 0,
      remove() {}
    };

    panes.set(paneName, pane);
    return pane;
  }

  return {
    getCenter() {
      return { lat: -38.12, lng: 144.61 };
    },
    getPane(paneName) {
      return panes.get(paneName) ?? null;
    },
    createPane,
    off() {},
    getSize() {
      return { x: 640, y: 360 };
    },
    getBounds() {
      return createBoundsStub();
    },
    latLngToLayerPoint() {
      return { x: 12, y: 24 };
    },
    getZoom() {
      return 15;
    }
  };
}

function createLeafletStub() {
  return {
    DomUtil: {
      create(tagName, className) {
        const canvas = {
          tagName,
          className,
          style: {},
          width: 0,
          height: 0,
          getContext() {
            return {
              setTransform() {},
              clearRect() {}
            };
          },
          remove() {}
        };

        return canvas;
      },
      setPosition(canvas, point) {
        canvas.__leafletPosition = { x: point.x, y: point.y };
      }
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

function createSnapshotResult({ map, canvas, mapStub } = {}) {
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
}

function installNamespaceHarness({
  recursiveSnapshotBridge = false,
  recursiveSnapshotMapProxy = false,
  recursivePublicGetGrowGoMap = false,
  useStableRawLeafletMapProvider = true,
  useBridgeRawLeafletMapReference = false,
  forceRecursiveSnapshotMapForBridge = false,
  explicitReturnWrapper = true,
  snapshotMapNormalizer
} = {}) {
  const trace =
    traceModule.createDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace({
      maxDepth: 8
    });
  trace.reset("TRACE_RESET_FOR_BROWSER_HARNESS");

  const mapStub = createMapStub();
  const leafletStub = createLeafletStub();
  const bridgeState = {
    snapshotCount: 0,
    drawCount: 0
  };

  const namespace = {
    getGrowGoMap: trace.wrap("getGrowGoMap", () => mapStub)
  };

  const globalObject = {
    location: { hostname: "127.0.0.1" },
    requestAnimationFrame(callback) {
      callback(16);
      return 1;
    },
    devicePixelRatio: 2,
    L: leafletStub,
    GrowGoDeveloperDiagnostics: namespace
  };

  const createCustom25DFrameViewportSnapshot = ({ map, canvas } = {}) =>
    trace.wrap("createCustom25DFrameViewportSnapshot", () => {
      if (!map || typeof map.getSize !== "function") {
        throw new Error("FRAME_VIEWPORT_MAP_INVALID");
      }

      if (!canvas || typeof canvas.getContext !== "function") {
        throw new Error("FRAME_VIEWPORT_CANVAS_INVALID");
      }

      const logicalSize = map.getSize();
      const bounds = map.getBounds();
      const northWestCoordinate = bounds.getNorthWest();
      const layerPoint = map.latLngToLayerPoint(northWestCoordinate);
      const zoom = map.getZoom();
      const logicalWidth = Number(logicalSize?.x);
      const logicalHeight = Number(logicalSize?.y);

      return Object.freeze({
        logicalWidth,
        logicalHeight,
        backingWidth: logicalWidth * (globalObject.devicePixelRatio || 1),
        backingHeight: logicalHeight * (globalObject.devicePixelRatio || 1),
        devicePixelRatio: globalObject.devicePixelRatio || 1,
        bounds: Object.freeze({
          north: Number(bounds.getNorth()),
          south: Number(bounds.getSouth()),
          east: Number(bounds.getEast()),
          west: Number(bounds.getWest())
        }),
        northWestCoordinate: Object.freeze({
          latitude: Number(northWestCoordinate?.lat),
          longitude: Number(northWestCoordinate?.lng)
        }),
        canvasLayerPosition: Object.freeze({
          x: Number(layerPoint?.x),
          y: Number(layerPoint?.y)
        }),
        zoom: Number(zoom),
        mapIdentityValidated: map === mapStub,
        canvasIdentityValidated: !!canvas,
        snapshotCreated: true
      });
    })();

  const createCustom25DFrameViewportSnapshotPrivateImplementation = ({
    map,
    canvas
  } = {}) =>
    trace.wrap("createCustom25DFrameViewportSnapshotPrivateImplementation", () =>
      createCustom25DFrameViewportSnapshot({ map, canvas })
    )();

  const scriptBridge = {
    createCustom25DFrameViewportSnapshotForOneFrame: trace.wrap(
      "createCustom25DFrameViewportSnapshotForOneFrame",
      ({ map, canvas } = {}) => {
        bridgeState.snapshotCount += 1;
        return Object.freeze({
          outcome: "snapshot_created",
          reasonCode: "FRAME_VIEWPORT_SNAPSHOT_CREATED",
          frameViewportSnapshot:
            createCustom25DFrameViewportSnapshotPrivateImplementation({
              map,
              canvas
            })
        });
      }
    ),
    drawCustom25DOneFrameFromSnapshot: trace.wrap(
      "drawCustom25DOneFrameFromSnapshot",
      ({ canvas, frameViewportSnapshot } = {}) => {
        bridgeState.drawCount += 1;
        return Object.freeze({
          outcome: canvas && frameViewportSnapshot ? "drawn" : "blocked",
          reasonCode: canvas && frameViewportSnapshot
            ? "FRAME_DRAW_COMPLETED"
            : "FRAME_DRAW_RESULT_INVALID"
        });
      }
    )
  };

  Object.defineProperty(scriptBridge, "rawLeafletMapReference", {
    enumerable: true,
    get:
      recursivePublicGetGrowGoMap && useBridgeRawLeafletMapReference
        ? trace.wrap("bridgePublicGetGrowGoMap", () =>
            globalObject.GrowGoDeveloperDiagnostics.getGrowGoMap()
          )
        : () => mapStub
  });

  Object.freeze(scriptBridge);

  namespace.getCustom25DOneFrameBridge = trace.wrap(
    "getCustom25DOneFrameBridge",
    () => scriptBridge
  );

  traceModule.installDeveloperOnlyAtlasCustom25DOneFrameExecutionTrace({
    globalObject,
    trace
  });

  const scriptGetGrowGoMap = namespace.getGrowGoMap.bind(namespace);
  const scriptGetBridge = namespace.getCustom25DOneFrameBridge.bind(namespace);
  let recursiveMapProxy = null;
  const snapshotStagePublicGetGrowGoMap = trace.wrap(
    "publicGetGrowGoMap",
    () => recursiveMapProxy
  );
  const capturedBridge = scriptGetBridge();
  const capturedSnapshot =
    capturedBridge.createCustom25DFrameViewportSnapshotForOneFrame.bind(
      capturedBridge
    );
  const capturedDraw =
    capturedBridge.drawCustom25DOneFrameFromSnapshot.bind(capturedBridge);

  if (recursiveSnapshotBridge) {
    globalObject.GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridge = trace.wrap(
      "reboundPublicBridgeGetter",
      () => globalObject.GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridge()
    );
  }

  if (recursivePublicGetGrowGoMap) {
    globalObject.GrowGoDeveloperDiagnostics.getGrowGoMap = trace.wrap(
      "reboundPublicGetGrowGoMap",
      () => globalObject.GrowGoDeveloperDiagnostics.getGrowGoMap()
    );
  }

  if (recursiveSnapshotMapProxy) {
    recursiveMapProxy = {
      __growgoRawLeafletMap: mapStub,
      getSize: trace.wrap("proxyGetSize", () =>
        snapshotStagePublicGetGrowGoMap().getSize()
      ),
      getBounds: trace.wrap("proxyGetBounds", () =>
        snapshotStagePublicGetGrowGoMap().getBounds()
      ),
      latLngToLayerPoint: trace.wrap("proxyLatLngToLayerPoint", (coordinate) =>
        snapshotStagePublicGetGrowGoMap().latLngToLayerPoint(coordinate)
      ),
      getZoom: trace.wrap("proxyGetZoom", () =>
        snapshotStagePublicGetGrowGoMap().getZoom()
      )
    };
  }

  const capturedMapGetter = trace.wrap("capturedScriptGetGrowGoMap", () =>
    scriptGetGrowGoMap()
  );
  const capturedRawLeafletMapProvider = trace.wrap("rawLeafletMapProvider", () =>
    capturedMapGetter()
  );

  const liveBridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: capturedRawLeafletMapProvider,
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
    completeDeferredCleanupCount: 0
  };
  const effectiveSnapshotMapNormalizer =
    typeof snapshotMapNormalizer === "function"
      ? snapshotMapNormalizer
      : forceRecursiveSnapshotMapForBridge
        ? () => recursiveMapProxy
        : undefined;
  const publicDiagnosticsMapProvider = trace.wrap("getGrowGoMap", () =>
    globalObject.GrowGoDeveloperDiagnostics.getGrowGoMap()
  );
  const bridgeRawLeafletMapProvider = trace.wrap(
    "bridge.rawLeafletMapReference",
    () => capturedBridge.rawLeafletMapReference
  );

  const adapterMapInput = useStableRawLeafletMapProvider
    ? recursivePublicGetGrowGoMap
      ? {
          rawLeafletMapProvider: useBridgeRawLeafletMapReference
            ? bridgeRawLeafletMapProvider
            : capturedRawLeafletMapProvider
        }
      : {
          rawLeafletMapReference: useBridgeRawLeafletMapReference
            ? bridgeRawLeafletMapProvider()
            : capturedRawLeafletMapProvider()
        }
    : {
        rawLeafletMapProvider: publicDiagnosticsMapProvider
      };

  const realAdapter =
    adapterModule.createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
      ...adapterMapInput,
      leafletProvider: () => globalObject.L,
      devicePixelRatioProvider: () => globalObject.devicePixelRatio,
      snapshotMapNormalizer: effectiveSnapshotMapNormalizer,
      frameSnapshotProvider: recursiveSnapshotBridge
        ? () =>
            trace.wrap("lazySnapshotBridgeProvider", (input) => {
              try {
                return globalObject.GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridge()
                  .createCustom25DFrameViewportSnapshotForOneFrame(input);
              } catch (error) {
                return Object.freeze({
                  outcome: "blocked",
                  reasonCode:
                    typeof error?.reasonCode === "string" && error.reasonCode
                      ? error.reasonCode
                      : "TRACE_MAX_DEPTH_EXCEEDED",
                  frameViewportSnapshot: Object.freeze({})
                });
              }
            })
        : () =>
            trace.wrap(
              "capturedSnapshotBridgeInvocation",
              (input) => {
                try {
                  return capturedSnapshot(input);
                } catch (error) {
                  if (error?.reasonCode === "TRACE_MAX_DEPTH_EXCEEDED") {
                    throw new Error("MAXIMUM_CALL_STACK_SIZE_EXCEEDED");
                  }

                  throw error;
                }
              }
            ),
      drawFunctionProvider: () =>
        trace.wrap("drawCustom25DOneFrameFromSnapshot", (input) => capturedDraw(input))
    });

  const adapter = {
    getAdapterStatus() {
      return realAdapter.getAdapterStatus();
    },
    executeDeveloperOnlyLiveOneFrameAdapter: trace.wrap(
      "adapterInvocation",
      (options) => realAdapter.executeDeveloperOnlyLiveOneFrameAdapter(options)
    ),
    completeDeferredCleanup: trace.wrap("completeDeferredCleanup", (...args) => {
      adapterState.completeDeferredCleanupCount += 1;
      return realAdapter.completeDeferredCleanup(...args);
    })
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
    namespace: globalObject.GrowGoDeveloperDiagnostics,
    bridgeState,
    adapterState
  };
}

test("browser-shaped lazy public snapshot bridge wiring reproduces the old recursion boundary and trace catches the repeated chain", async () => {
  const harness = installNamespaceHarness({
    recursiveSnapshotBridge: true
  });

  const result = await harness.namespace.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "TRACE_MAX_DEPTH_EXCEEDED");
  assert.equal(result.surfacePrepared, true);
  assert.equal(result.frameSnapshotCreated, false);
  assert.equal(result.drawAttemptCount, 0);
  assert.equal(result.completedFrameCount, 0);
  assert.equal(result.realDrawFunctionCalled, false);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.referencesReleased, true);
  assert.equal(harness.bridgeState.snapshotCount, 0);
  assert.equal(harness.bridgeState.drawCount, 0);

  const traceSnapshot =
    harness.namespace.getAtlasCustom25DOneFrameExecutionTrace();

  assert.equal(traceSnapshot.recursionDetected, true);
  assert.equal(traceSnapshot.overflowPrevented, true);
  assert.equal(traceSnapshot.repeatedCallChain.length >= 2, true);
  assert.equal(
    traceSnapshot.repeatedCallChain.every(
      (name) => name === "reboundPublicBridgeGetter"
    ),
    true
  );
  assert.equal(
    traceSnapshot.last50FunctionNames.includes("lazySnapshotBridgeProvider"),
    true
  );
});

test("browser-shaped snapshot-stage map proxy recursion reproduces surface prepared then stack overflow before snapshot creation with bounded trace evidence", async () => {
  const harness = installNamespaceHarness({
    recursiveSnapshotMapProxy: true,
    forceRecursiveSnapshotMapForBridge: true
  });

  const result = await harness.namespace.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "MAXIMUM_CALL_STACK_SIZE_EXCEEDED");
  assert.equal(result.surfacePrepared, true);
  assert.equal(result.frameSnapshotCreated, false);
  assert.equal(result.drawAttemptCount, 0);
  assert.equal(result.completedFrameCount, 0);
  assert.equal(result.realDrawFunctionCalled, false);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.referencesReleased, true);
  assert.equal(harness.bridgeState.snapshotCount, 1);
  assert.equal(harness.bridgeState.drawCount, 0);

  const traceSnapshot =
    harness.namespace.getAtlasCustom25DOneFrameExecutionTrace();

  assert.equal(traceSnapshot.recursionDetected, true);
  assert.equal(traceSnapshot.overflowPrevented, true);
  assert.equal(Array.isArray(traceSnapshot.last50Calls), true);
  assert.equal(traceSnapshot.last50Calls.length > 0, true);
  assert.equal(
    traceSnapshot.last50FunctionNames.includes(
      "createCustom25DFrameViewportSnapshotForOneFrame"
    ),
    true
  );
  assert.equal(
    traceSnapshot.last50FunctionNames.includes(
      "createCustom25DFrameViewportSnapshotPrivateImplementation"
    ),
    true
  );
  assert.equal(
    traceSnapshot.last50FunctionNames.includes(
      "createCustom25DFrameViewportSnapshot"
    ),
    true
  );
  assert.equal(traceSnapshot.last50FunctionNames.includes("proxyGetSize"), true);
  assert.equal(
    traceSnapshot.last50FunctionNames.includes("publicGetGrowGoMap"),
    true
  );
  assert.equal(
    traceSnapshot.last50Calls.some(
      (event, index, events) =>
        event.phase === "entry" &&
        event.functionName === "proxyGetSize" &&
        events[index + 1]?.phase === "entry" &&
        events[index + 1]?.functionName === "publicGetGrowGoMap"
    ),
    true
  );
});

test("browser-shaped stable bridge capture completes one snapshot, one draw, one cleanup, and returns the real command result object", async () => {
  const harness = installNamespaceHarness({
    recursiveSnapshotBridge: false,
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
  assert.equal(harness.bridgeState.snapshotCount, 1);
  assert.equal(harness.bridgeState.drawCount, 1);
  assert.equal(harness.adapterState.completeDeferredCleanupCount, 1);
  assert.equal(result.canonicalSafetyFlagSnapshot.runtimeExecutionEnabled, false);
  assert.equal(result.canonicalSafetyFlagSnapshot.mapAttachmentAllowed, false);
  assert.equal(
    result.canonicalSafetyFlagSnapshot.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(result.canonicalSafetyFlagSnapshot.lifecycleExecutionEnabled, false);

  const traceSnapshot =
    harness.namespace.getAtlasCustom25DOneFrameExecutionTrace();
  assert.equal(traceSnapshot.overflowPrevented, false);
  assert.equal(traceSnapshot.maxObservedDepth > 0, true);
  assert.equal(
    traceSnapshot.last50FunctionNames.includes(
      "createCustom25DFrameViewportSnapshotForOneFrame"
    ),
    true
  );
  assert.equal(
    traceSnapshot.last50FunctionNames.includes("proxyGetSize"),
    false
  );
});

test("browser-shaped snapshot-stage raw-map normalization unwraps a recursive diagnostics proxy and restores one snapshot one draw one cleanup", async () => {
  const harness = installNamespaceHarness({
    recursiveSnapshotMapProxy: true
  });

  const result = await harness.namespace.runAuthorizedAtlasCustom25DOneFrame({
    confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
  });

  assert.equal(result.outcome, "completed");
  assert.equal(result.surfacePrepared, true);
  assert.equal(result.frameSnapshotCreated, true);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.referencesReleased, true);
  assert.equal(harness.bridgeState.snapshotCount, 1);
  assert.equal(harness.bridgeState.drawCount, 1);

  const traceSnapshot =
    harness.namespace.getAtlasCustom25DOneFrameExecutionTrace();
  assert.equal(traceSnapshot.overflowPrevented, false);
  assert.equal(
    traceSnapshot.last50FunctionNames.includes("proxyGetSize"),
    false
  );
});

test("browser-shaped public getGrowGoMap recursion is reproducible before the fix and eliminated by the stable raw Leaflet map provider", async () => {
  const brokenHarness = installNamespaceHarness({
    recursivePublicGetGrowGoMap: true,
    useStableRawLeafletMapProvider: false
  });
  const fixedHarness = installNamespaceHarness({
    recursivePublicGetGrowGoMap: true,
    useStableRawLeafletMapProvider: true
  });

  const brokenResult =
    await brokenHarness.namespace.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });

  assert.equal(brokenResult.outcome, "failed_closed");
  assert.equal(brokenResult.reasonCode, "TRACE_MAX_DEPTH_EXCEEDED");
  assert.equal(brokenResult.surfacePrepared, false);
  assert.equal(brokenResult.frameSnapshotCreated, false);
  assert.equal(brokenResult.drawAttemptCount, 0);
  assert.equal(brokenResult.cleanupAttemptCount, 0);

  const brokenTrace =
    brokenHarness.namespace.getAtlasCustom25DOneFrameExecutionTrace();
  assert.equal(brokenTrace.recursionDetected, true);
  assert.equal(brokenTrace.overflowPrevented, true);
  assert.equal(
    brokenTrace.last50FunctionNames.includes("getGrowGoMap"),
    true
  );

  const fixedResult =
    await fixedHarness.namespace.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });

  assert.equal(fixedResult.outcome, "completed");
  assert.equal(fixedResult.surfacePrepared, true);
  assert.equal(fixedResult.frameSnapshotCreated, true);
  assert.equal(fixedResult.drawAttemptCount, 1);
  assert.equal(fixedResult.completedFrameCount, 1);
  assert.equal(fixedResult.cleanupAttemptCount, 1);
  assert.equal(fixedResult.cleanupCompleted, true);
  assert.equal(fixedResult.referencesReleased, true);

  const fixedTrace =
    fixedHarness.namespace.getAtlasCustom25DOneFrameExecutionTrace();
  assert.equal(fixedTrace.overflowPrevented, false);
  assert.equal(
    fixedTrace.last50FunctionNames.includes("reboundPublicGetGrowGoMap"),
    false
  );
  assert.equal(
    fixedTrace.repeatedCallChain.includes("getGrowGoMap"),
    false
  );
});

test("browser-shaped bridge raw map reference reproduces bridge to public getGrowGoMap recursion before the fix and completes through bridge raw map reference after the fix", async () => {
  const brokenHarness = installNamespaceHarness({
    recursivePublicGetGrowGoMap: true,
    useStableRawLeafletMapProvider: true,
    useBridgeRawLeafletMapReference: true
  });
  const fixedHarness = installNamespaceHarness({
    recursivePublicGetGrowGoMap: false,
    useStableRawLeafletMapProvider: true,
    useBridgeRawLeafletMapReference: true
  });

  const brokenResult =
    await brokenHarness.namespace.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });

  assert.equal(brokenResult.outcome, "failed_closed");
  assert.equal(brokenResult.reasonCode, "TRACE_MAX_DEPTH_EXCEEDED");

  const brokenTrace =
    brokenHarness.namespace.getAtlasCustom25DOneFrameExecutionTrace();
  assert.equal(brokenTrace.recursionDetected, true);
  assert.equal(
    brokenTrace.last50FunctionNames.slice(0, 4).includes("getCustom25DOneFrameBridge"),
    true
  );
  assert.equal(
    brokenTrace.last50FunctionNames.includes("bridgePublicGetGrowGoMap"),
    true
  );
  assert.equal(
    brokenTrace.repeatedCallChain.every((name) => name === "reboundPublicGetGrowGoMap"),
    true
  );

  const fixedResult =
    await fixedHarness.namespace.runAuthorizedAtlasCustom25DOneFrame({
      confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"
    });

  assert.equal(fixedResult.outcome, "completed");
  assert.equal(fixedResult.surfacePrepared, true);
  assert.equal(fixedResult.frameSnapshotCreated, true);
  assert.equal(fixedResult.drawAttemptCount, 1);
  assert.equal(fixedResult.completedFrameCount, 1);
  assert.equal(fixedResult.cleanupAttemptCount, 1);
  assert.equal(fixedResult.cleanupCompleted, true);
  assert.equal(fixedResult.referencesReleased, true);

  const fixedTrace =
    fixedHarness.namespace.getAtlasCustom25DOneFrameExecutionTrace();
  assert.equal(fixedTrace.overflowPrevented, false);
  assert.equal(
    fixedTrace.last50FunctionNames.includes("bridge.rawLeafletMapReference"),
    true
  );
  assert.equal(
    fixedTrace.repeatedCallChain.includes("getGrowGoMap"),
    false
  );
});

test("browser-shaped namespace wrapper must return the underlying one-frame command promise result instead of undefined", async () => {
  const harness = installNamespaceHarness({
    recursiveSnapshotBridge: false,
    explicitReturnWrapper: true
  });
  const brokenHarness = installNamespaceHarness({
    recursiveSnapshotBridge: false,
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
