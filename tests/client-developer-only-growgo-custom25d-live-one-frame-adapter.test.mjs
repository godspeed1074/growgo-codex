import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

const moduleUnderTest = await import(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-live-one-frame-adapter.mjs"
  )
);

function extractFunctionBody(name) {
  const marker = `function ${name}(`;
  const start = scriptSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} should exist in script.js`);

  const paramsStart = scriptSource.indexOf("(", start);
  assert.notEqual(paramsStart, -1, `${name} should have parameter parentheses`);

  let paramDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < scriptSource.length; index += 1) {
    const character = scriptSource[index];
    if (character === "(") paramDepth += 1;
    if (character === ")") paramDepth -= 1;
    if (paramDepth === 0) {
      paramsEnd = index;
      break;
    }
  }

  assert.notEqual(paramsEnd, -1, `${name} should have a closing parenthesis`);

  const bodyStart = scriptSource.indexOf("{", paramsEnd);
  assert.notEqual(bodyStart, -1, `${name} should have an opening brace`);

  let depth = 0;
  for (let index = bodyStart; index < scriptSource.length; index += 1) {
    const character = scriptSource[index];
    if (character === "{") depth += 1;
    if (character === "}") depth -= 1;
    if (depth === 0) {
      return scriptSource.slice(start, index + 1);
    }
  }

  assert.fail(`${name} should have a closing brace`);
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

const bridgeSnapshotBody = extractFunctionBody(
  "createCustom25DFrameViewportSnapshotForOneFrame"
);
const bridgeDrawBody = extractFunctionBody("drawCustom25DOneFrameFromSnapshot");
const bridgeGetterBody = extractFunctionBody("getCustom25DOneFrameBridge");
const strippedBridgeGetterBody = stripComments(bridgeGetterBody);
const strippedBridgeSnapshotBody = stripComments(bridgeSnapshotBody);
const strippedBridgeDrawBody = stripComments(bridgeDrawBody);

function createImmutableSnapshot() {
  const north = -38.12;
  const south = -38.28;
  const east = 145.13;
  const west = 144.98;
  const snapshot = {
    schemaId: "GROWGO_CUSTOM25D_FRAME_VIEWPORT_SNAPSHOT_001",
    logicalWidth: 640,
    logicalHeight: 360,
    backingWidth: 1280,
    backingHeight: 720,
    devicePixelRatio: 2,
    bounds: Object.freeze({ north, south, east, west }),
    northWestCoordinate: Object.freeze({
      latitude: north,
      longitude: west
    }),
    canvasLayerPosition: Object.freeze({ x: 12, y: 34 }),
    zoom: 16.5
  };
  return Object.freeze(snapshot);
}

function compileBridgeEnvironment(options = {}) {
  const calls = {
    snapshot: 0,
    draw: 0
  };

  const evaluationSource = `
const createCustom25DFrameViewportSnapshotPrivateImplementation =
  createCustom25DFrameViewportSnapshot;
const drawCustom25DMapCanvasWithFrameSnapshotPrivateImplementation =
  drawCustom25DMapCanvasWithFrameSnapshot;
${bridgeSnapshotBody}
${bridgeDrawBody}
${bridgeGetterBody}
module.exports = {
  createCustom25DFrameViewportSnapshotForOneFrame,
  drawCustom25DOneFrameFromSnapshot,
  getCustom25DOneFrameBridge
};
`;

  const context = {
    module: { exports: {} },
    exports: {},
    Object,
    map: null,
    traceAtlasOneFrameCall(functionName, callback) {
      return callback();
    },
    createCustom25DFrameViewportSnapshot(input = {}) {
      calls.snapshot += 1;
      if (options.snapshotThrows) {
        throw options.snapshotThrows;
      }
      if (!input.map || !input.canvas) {
        throw new Error("FRAME_VIEWPORT_MAP_INVALID");
      }
      return createImmutableSnapshot();
    },
    drawCustom25DMapCanvasWithFrameSnapshot(input = {}) {
      calls.draw += 1;
      if (options.drawResult) {
        return options.drawResult;
      }
      return {
        outcome: "drawn",
        reasonCode: "FRAME_DRAW_COMPLETED",
        inputMode: input && input.canvas ? "snapshot-aware" : "invalid"
      };
    }
  };

  vm.createContext(context);
  vm.runInContext(evaluationSource, context);

  return {
    calls,
    bridgeModule: context.module.exports
  };
}

function createFakeAdapterEnvironment(overrides = {}) {
  const calls = {
    mapProvider: 0,
    rawLeafletMapProvider: 0,
    leafletProvider: 0,
    devicePixelRatioProvider: 0,
    surfaceOperationsFactory: 0,
    lifecycleTranslationFactory: 0,
    lifecycleOwnerFactory: 0,
    frameSnapshotProvider: 0,
    drawBridgeProvider: 0,
    drawOperationFactory: 0,
    surfacePrepare: 0,
    surfaceRollback: 0,
    lifecycleRegister: 0,
    frameSnapshotBridge: 0,
    drawBridge: 0,
    drawOperation: 0,
    cleanup: 0
  };

  const map =
    Object.prototype.hasOwnProperty.call(overrides, "map")
      ? overrides.map
      : { id: "fake-live-map" };
  const pane = overrides.pane ?? { dataset: { owner: "custom25DMapPane" } };
  const canvas =
    overrides.canvas ??
    {
      className: "custom-25d-map-canvas",
      style: {},
      parentNode: pane
    };

  const surface =
    overrides.surface ??
    {
      schemaId: "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001",
      map,
      pane,
      canvas,
      paneName: "custom25DMapPane",
      canvasClassName: "custom-25d-map-canvas",
      paneReused: true,
      paneCreated: false,
      paneOwnedByOperation: false,
      canvasOwnedByOperation: true,
      canvasAppended: true,
      cleanupRequired: true,
      rollbackAvailable: true,
      listenerAdded: false,
      retentionWritten: false,
      drawRequested: false
    };

  const snapshot = overrides.frameViewportSnapshot ?? createImmutableSnapshot();

  const lifecycleOwner =
    overrides.lifecycleOwner ??
    {
      registerOwnedResources(bundle) {
        calls.lifecycleRegister += 1;
        if (overrides.registerFailure) {
          return {
            outcome: "failed_closed",
            reasonCode: overrides.registerFailure,
            status: { ownershipRegistered: false }
          };
        }
        return {
          outcome: "registered",
          reasonCode: "OWNERSHIP_REGISTERED",
          status: { ownershipRegistered: true }
        };
      },
      disposeOwnedResources() {
        calls.cleanup += 1;
        if (overrides.cleanupFailure) {
          return {
            outcome: "failed_closed",
            reasonCode: overrides.cleanupFailure,
            status: {
              cleanupCompleted: false,
              cleanupFailed: true,
              cleanupFailureReasons: [overrides.cleanupFailure]
            }
          };
        }
        return {
          outcome: "disposed",
          reasonCode: "CLEANUP_COMPLETED",
          status: {
            cleanupCompleted: true,
            cleanupFailed: false,
            cleanupFailureReasons: []
          }
        };
      },
      getLifecycleOwnerStatus() {
        return { cleanupCompleted: calls.cleanup > 0 };
      }
    };

  const environment = {
    calls,
    adapter: moduleUnderTest.createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
      mapProvider:
        overrides.omitMapProvider === true
          ? null
          : () => {
              calls.mapProvider += 1;
              if (overrides.mapProviderThrows) {
                throw overrides.mapProviderThrows;
              }
              return map;
            },
      rawLeafletMapProvider:
        overrides.omitRawLeafletMapProvider === true
          ? null
          : () => {
              calls.rawLeafletMapProvider += 1;
              if (overrides.rawLeafletMapProviderThrows) {
                throw overrides.rawLeafletMapProviderThrows;
              }
              return map;
            },
      leafletProvider:
        overrides.omitLeafletProvider === true
          ? null
          : () => {
              calls.leafletProvider += 1;
              if (overrides.leafletProviderThrows) {
                throw overrides.leafletProviderThrows;
              }
              return overrides.leaflet ?? {
                DomUtil: {
                  create() {},
                  setPosition() {}
                }
              };
            },
      devicePixelRatioProvider:
        overrides.omitDevicePixelRatioProvider === true
          ? null
          : () => {
              calls.devicePixelRatioProvider += 1;
              return overrides.devicePixelRatio ?? 2;
            },
      surfaceOperationsFactory:
        overrides.omitSurfaceOperationsFactory === true
          ? null
          : () => {
              calls.surfaceOperationsFactory += 1;
              return {
                prepareOneFrameSurface() {
                  calls.surfacePrepare += 1;
                  if (overrides.surfacePrepareThrows) {
                    throw overrides.surfacePrepareThrows;
                  }
                  if (overrides.surfacePrepareFailure) {
                    return {
                      outcome: "failed_closed",
                      reasonCode: overrides.surfacePrepareFailure
                    };
                  }
                  return {
                    outcome: "prepared",
                    reasonCode: "LIVE_SURFACE_PREPARED",
                    surface
                  };
                },
                rollbackPreparedSurface() {
                  calls.surfaceRollback += 1;
                  if (overrides.surfaceRollbackFailure) {
                    return {
                      outcome: "failed_closed",
                      reasonCode: overrides.surfaceRollbackFailure,
                      rollbackCompleted: false,
                      rollbackFailureReason: overrides.surfaceRollbackFailure
                    };
                  }
                  return {
                    outcome: "rolled_back",
                    reasonCode: "ROLLBACK_COMPLETED",
                    rollbackCompleted: true,
                    rollbackFailureReason: null
                  };
                }
              };
            },
      lifecycleTranslationFactory:
        overrides.omitLifecycleTranslationFactory === true
          ? null
          : () => {
              calls.lifecycleTranslationFactory += 1;
              return {
                translatePreparedSurfaceToLifecycleBundle({
                  preparedSurface,
                  lifecycleOwner: owner
                }) {
                  if (overrides.translationFailure) {
                    return {
                      outcome: "failed_closed",
                      reasonCode: overrides.translationFailure,
                      lifecycleRegistrationSucceeded: false
                    };
                  }
                  const lifecycleBundle = {
                    schemaId:
                      "GROWGO_CUSTOM25D_ONE_FRAME_LIFECYCLE_REGISTRATION_BUNDLE_001",
                    ownershipMode: "ONE_FRAME_SURFACE_ONLY",
                    map: preparedSurface.map,
                    pane: preparedSurface.pane,
                    canvas: preparedSurface.canvas,
                    paneName: "custom25DMapPane",
                    canvasClassName: "custom-25d-map-canvas",
                    paneOwned: false,
                    paneOwnershipProven: false,
                    canvasOwned: true,
                    listenerOwned: false,
                    listenerEventNames: [],
                    listenerFunction: null,
                    redrawCallback: null,
                    retentionSlot: "custom25DMapLayer",
                    retentionWritten: false,
                    retentionValue: null,
                    retentionResetRequired: false,
                    clearRetentionSlot: null,
                    cleanupRequired: true,
                    canvasRemovalRequired: true,
                    paneRemovalEligible: false,
                    unrelatedResourcesPreserved: true
                  };
                  const registrationResult =
                    owner.registerOwnedResources(lifecycleBundle);
                  if (registrationResult.outcome !== "registered") {
                    return {
                      outcome: "failed_closed",
                      reasonCode:
                        registrationResult.reasonCode ?? "OWNERSHIP_REGISTRATION_FAILED",
                      lifecycleRegistrationSucceeded: false
                    };
                  }
                  return {
                    outcome: "translated",
                    reasonCode: "ONE_FRAME_LIFECYCLE_BUNDLE_TRANSLATED",
                    lifecycleRegistrationAttempted: true,
                    lifecycleRegistrationSucceeded: true,
                    lifecycleBundle
                  };
                }
              };
            },
      lifecycleOwnerFactory:
        overrides.omitLifecycleOwnerFactory === true
          ? null
          : () => {
              calls.lifecycleOwnerFactory += 1;
              if (overrides.lifecycleOwnerFactoryThrows) {
                throw overrides.lifecycleOwnerFactoryThrows;
              }
              return lifecycleOwner;
            },
      frameSnapshotProvider:
        overrides.omitFrameSnapshotProvider === true
          ? null
          : () => {
              calls.frameSnapshotProvider += 1;
              if (overrides.frameSnapshotProviderThrows) {
                throw overrides.frameSnapshotProviderThrows;
              }
              if (
                Object.prototype.hasOwnProperty.call(
                  overrides,
                  "frameSnapshotProviderNonFunction"
                )
              ) {
                return overrides.frameSnapshotProviderNonFunction;
              }
              return () => {
                calls.frameSnapshotBridge += 1;
                if (overrides.frameSnapshotBridgeThrows) {
                  throw overrides.frameSnapshotBridgeThrows;
                }
                if (overrides.invalidSnapshotResult) {
                  return overrides.invalidSnapshotResult;
                }
                return {
                  outcome: "snapshot_created",
                  reasonCode: "FRAME_VIEWPORT_SNAPSHOT_CREATED",
                  frameViewportSnapshot: snapshot
                };
              };
            },
      drawFunctionProvider:
        overrides.omitDrawFunctionProvider === true
          ? null
          : () => {
              calls.drawBridgeProvider += 1;
              if (overrides.drawBridgeProviderThrows) {
                throw overrides.drawBridgeProviderThrows;
              }
              if (
                Object.prototype.hasOwnProperty.call(
                  overrides,
                  "drawBridgeProviderNonFunction"
                )
              ) {
                return overrides.drawBridgeProviderNonFunction;
              }
              return () => {
                calls.drawBridge += 1;
                if (overrides.drawBridgeThrows) {
                  throw overrides.drawBridgeThrows;
                }
                if (overrides.drawBridgeResult) {
                  return overrides.drawBridgeResult;
                }
                return {
                  outcome: "drawn",
                  reasonCode: "FRAME_DRAW_COMPLETED"
                };
              };
            },
      drawOperationFactory:
        overrides.omitDrawOperationFactory === true
          ? null
          : ({ drawFunctionProvider }) => {
              calls.drawOperationFactory += 1;
              if (overrides.drawOperationFactoryThrows) {
                throw overrides.drawOperationFactoryThrows;
              }
              if (overrides.drawOperationFactoryResult) {
                return overrides.drawOperationFactoryResult;
              }
              return {
                drawPreparedSurfaceExactlyOnce(input) {
                  calls.drawOperation += 1;
                  const drawOperation = drawFunctionProvider();
                  try {
                    const bridgeResult = drawOperation(input);
                    if (bridgeResult?.outcome === "drawn") {
                      return {
                        outcome: "completed",
                        reasonCode: "LIVE_ONE_FRAME_DRAW_COMPLETED",
                        drawAttemptCount: 1,
                        completedFrameCount: 1
                      };
                    }
                    return {
                      outcome: "failed_closed",
                      reasonCode:
                        bridgeResult?.reasonCode ?? "DRAW_BRIDGE_FAILED",
                      drawAttemptCount: 1,
                      completedFrameCount: 0
                    };
                  } catch (error) {
                    return {
                      outcome: "failed_closed",
                      reasonCode:
                        typeof error?.message === "string"
                          ? error.message
                              .trim()
                              .replace(/\s+/g, "_")
                              .toUpperCase()
                          : "DRAW_BRIDGE_EXCEPTION",
                      drawAttemptCount: 1,
                      completedFrameCount: 0
                    };
                  }
                }
              };
            }
    })
  };

  return environment;
}

test("module import has no side effects, factory exists, and construction reads no live resources", () => {
  assert.equal(
    typeof moduleUnderTest.createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter,
    "function"
  );

  const env = createFakeAdapterEnvironment();
  const status = env.adapter.getAdapterStatus();

  assert.equal(status.adapterReady, true);
  assert.equal(status.adapterStatus, "ready");
  assert.equal(status.liveInvocationPerformed, false);
  assert.equal(status.surfacePrepared, false);
  assert.equal(status.lifecycleRegistered, false);
  assert.equal(status.frameSnapshotCreated, false);
  assert.equal(status.drawAttemptCount, 0);
  assert.equal(status.cleanupAttemptCount, 0);
  assert.equal(status.permanentlyClosed, false);
  assert.equal(status.browserActivationExposed, false);
  assert.equal(status.automaticInvocation, false);

  for (const count of Object.values(env.calls)) {
    assert.equal(count, 0);
  }
});

test("narrow script bridge exists, exposes snapshot creation and snapshot-aware draw only, and performs no action on exposure", () => {
  assert.match(scriptSource, /getCustom25DOneFrameBridge/);
  assert.match(scriptSource, /createCustom25DFrameViewportSnapshotForOneFrame/);
  assert.match(scriptSource, /drawCustom25DOneFrameFromSnapshot/);
  assert.match(
    strippedBridgeSnapshotBody,
    /createCustom25DFrameViewportSnapshotPrivateImplementation\(\s*\{\s*map,\s*canvas\s*\}\s*\)/
  );
  assert.match(
    strippedBridgeDrawBody,
    /drawCustom25DMapCanvasWithFrameSnapshotPrivateImplementation\(\s*\{\s*canvas,\s*frameViewportSnapshot\s*\}\s*\)/
  );
  assert.doesNotMatch(
    strippedBridgeSnapshotBody,
    /const frameViewportSnapshot =\s*createCustom25DFrameViewportSnapshotForOneFrame\(\s*\{/
  );
  assert.doesNotMatch(
    strippedBridgeDrawBody,
    /const drawResult =\s*drawCustom25DOneFrameFromSnapshot\(\s*\{/
  );
  assert.doesNotMatch(
    strippedBridgeGetterBody,
    /initCustom25DMapExperiment|custom25DMapLayer|consumeAuthorizedRendererHandoffAttempt|authorizeAtlasRendererHandoffSession/
  );

  const { calls, bridgeModule } = compileBridgeEnvironment();
  const bridge = bridgeModule.getCustom25DOneFrameBridge();

  assert.deepEqual(Object.keys(bridge).sort(), [
    "createCustom25DFrameViewportSnapshotForOneFrame",
    "drawCustom25DOneFrameFromSnapshot",
    "rawLeafletMapReference"
  ]);
  assert.equal(bridge.rawLeafletMapReference, null);
  assert.equal(calls.snapshot, 0);
  assert.equal(calls.draw, 0);

  const snapshotBlocked =
    bridge.createCustom25DFrameViewportSnapshotForOneFrame();
  assert.equal(snapshotBlocked.outcome, "blocked");
  assert.equal(snapshotBlocked.frameViewportSnapshot, null);

  const snapshotCreated =
    bridge.createCustom25DFrameViewportSnapshotForOneFrame({
      map: { id: "fake-map" },
      canvas: { id: "fake-canvas" }
    });
  assert.equal(snapshotCreated.outcome, "snapshot_created");
  assert.equal(snapshotCreated.frameViewportSnapshot.logicalWidth, 640);

  const drawCreated = bridge.drawCustom25DOneFrameFromSnapshot({
    canvas: { id: "fake-canvas" },
    frameViewportSnapshot: createImmutableSnapshot()
  });
  assert.equal(drawCreated.outcome, "drawn");
  assert.equal(calls.snapshot, 2);
  assert.equal(calls.draw, 1);
});

test("one isolated fake execution completes with one surface, one registration, one snapshot, one draw, one cleanup, reference release, and permanent closure", () => {
  const env = createFakeAdapterEnvironment();

  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const status = env.adapter.getAdapterStatus();

  assert.equal(result.outcome, "completed");
  assert.equal(result.reasonCode, "LIVE_ONE_FRAME_DRAW_COMPLETED");
  assert.equal(result.surfacePrepared, true);
  assert.equal(result.lifecycleRegistered, true);
  assert.equal(result.frameSnapshotCreated, true);
  assert.equal(result.drawAttemptCount, 1);
  assert.equal(result.completedFrameCount, 1);
  assert.equal(result.cleanupAttemptCount, 1);
  assert.equal(result.cleanupCompleted, true);
  assert.equal(result.referencesReleased, true);
  assert.equal(result.permanentlyClosed, true);
  assert.equal(result.ownershipMode, "ONE_FRAME_SURFACE_ONLY");

  assert.equal(env.calls.mapProvider, 0);
  assert.equal(env.calls.rawLeafletMapProvider, 1);
  assert.equal(env.calls.leafletProvider, 1);
  assert.equal(env.calls.surfaceOperationsFactory, 1);
  assert.equal(env.calls.lifecycleTranslationFactory, 1);
  assert.equal(env.calls.lifecycleOwnerFactory, 1);
  assert.equal(env.calls.frameSnapshotProvider, 1);
  assert.equal(env.calls.drawBridgeProvider, 1);
  assert.equal(env.calls.drawOperationFactory, 1);
  assert.equal(env.calls.surfacePrepare, 1);
  assert.equal(env.calls.surfaceRollback, 0);
  assert.equal(env.calls.lifecycleRegister, 1);
  assert.equal(env.calls.frameSnapshotBridge, 1);
  assert.equal(env.calls.drawOperation, 1);
  assert.equal(env.calls.drawBridge, 1);
  assert.equal(env.calls.cleanup, 1);

  assert.equal(status.adapterStatus, "completed");
  assert.equal(status.permanentlyClosed, true);
  assert.equal(status.referencesReleased, true);
});

test("deferred cleanup mode keeps one completed frame available until explicit cleanup release", () => {
  const env = createFakeAdapterEnvironment();

  const drawResult = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter({
    deferCleanupUntilRelease: true
  });
  const midStatus = env.adapter.getAdapterStatus();

  assert.equal(drawResult.outcome, "pending_cleanup");
  assert.equal(drawResult.reasonCode, "DEFERRED_CLEANUP_PENDING");
  assert.equal(drawResult.completedFrameCount, 1);
  assert.equal(drawResult.cleanupAttemptCount, 0);
  assert.equal(drawResult.cleanupCompleted, false);
  assert.equal(drawResult.referencesReleased, false);
  assert.equal(drawResult.permanentlyClosed, false);

  assert.equal(midStatus.adapterStatus, "awaiting_cleanup_release");
  assert.equal(env.calls.cleanup, 0);

  const cleanupResult = env.adapter.completeDeferredCleanup();
  const finalStatus = env.adapter.getAdapterStatus();

  assert.equal(cleanupResult.outcome, "completed");
  assert.equal(cleanupResult.cleanupAttemptCount, 1);
  assert.equal(cleanupResult.cleanupCompleted, true);
  assert.equal(cleanupResult.referencesReleased, true);
  assert.equal(cleanupResult.permanentlyClosed, true);
  assert.equal(env.calls.cleanup, 1);

  assert.equal(finalStatus.adapterStatus, "completed");
  assert.equal(finalStatus.permanentlyClosed, true);
});

test("second invocation is blocked after the first execution closes the adapter", () => {
  const env = createFakeAdapterEnvironment();

  const first = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const second = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();

  assert.equal(first.outcome, "completed");
  assert.equal(second.outcome, "blocked");
  assert.equal(second.reasonCode, "ADAPTER_ALREADY_CLOSED");
  assert.equal(second.secondInvocationBlocked, true);
});

test("every missing provider or missing live capability fails closed", () => {
  const cases = [
    {
      label: "missing map provider",
      overrides: { omitMapProvider: true, omitRawLeafletMapProvider: true },
      reasonCode: "MISSING_MAP_PROVIDER"
    },
    {
      label: "missing map",
      overrides: { map: null },
      reasonCode: "MAP_UNAVAILABLE"
    },
    {
      label: "missing Leaflet provider",
      overrides: { omitLeafletProvider: true },
      reasonCode: "MISSING_LEAFLET_PROVIDER"
    },
    {
      label: "invalid Leaflet",
      overrides: { leaflet: {} },
      reasonCode: "LEAFLET_PROVIDER_INVALID"
    },
    {
      label: "missing surface operations factory",
      overrides: { omitSurfaceOperationsFactory: true },
      reasonCode: "MISSING_SURFACE_OPERATIONS_FACTORY"
    },
    {
      label: "missing lifecycle translation factory",
      overrides: { omitLifecycleTranslationFactory: true },
      reasonCode: "MISSING_LIFECYCLE_TRANSLATION_FACTORY"
    },
    {
      label: "missing lifecycle owner factory",
      overrides: { omitLifecycleOwnerFactory: true },
      reasonCode: "MISSING_LIFECYCLE_OWNER_FACTORY"
    },
    {
      label: "missing frame snapshot bridge provider",
      overrides: { omitFrameSnapshotProvider: true },
      reasonCode: "MISSING_FRAME_SNAPSHOT_BRIDGE_PROVIDER"
    },
    {
      label: "missing draw bridge provider",
      overrides: { omitDrawFunctionProvider: true },
      reasonCode: "MISSING_DRAW_BRIDGE_PROVIDER"
    },
    {
      label: "missing draw operation factory",
      overrides: { omitDrawOperationFactory: true },
      reasonCode: "MISSING_DRAW_OPERATION_FACTORY"
    },
    {
      label: "missing frame snapshot bridge function",
      overrides: { frameSnapshotProviderNonFunction: null },
      reasonCode: "FRAME_SNAPSHOT_BRIDGE_UNAVAILABLE"
    },
    {
      label: "missing draw bridge function",
      overrides: { drawBridgeProviderNonFunction: null },
      reasonCode: "DRAW_BRIDGE_UNAVAILABLE"
    }
  ];

  for (const { label, overrides, reasonCode } of cases) {
    const env = createFakeAdapterEnvironment(overrides);
    const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
    assert.equal(result.outcome, "failed_closed", label);
    assert.equal(result.reasonCode, reasonCode, label);
    assert.equal(result.permanentlyClosed, true, label);
    assert.equal(result.referencesReleased, true, label);
  }
});

test("snapshot failure, draw failure, draw exception, and cleanup failure all preserve cleanup behavior precisely", () => {
  const snapshotFailure = createFakeAdapterEnvironment({
    invalidSnapshotResult: {
      outcome: "blocked",
      reasonCode: "FRAME_VIEWPORT_SNAPSHOT_VALUES_INVALID",
      frameViewportSnapshot: null
    }
  });
  const snapshotFailureResult =
    snapshotFailure.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  assert.equal(
    snapshotFailureResult.reasonCode,
    "FRAME_VIEWPORT_SNAPSHOT_VALUES_INVALID"
  );
  assert.equal(snapshotFailureResult.cleanupAttemptCount, 1);
  assert.equal(snapshotFailureResult.cleanupCompleted, true);

  const drawFailure = createFakeAdapterEnvironment({
    drawBridgeResult: {
      outcome: "blocked",
      reasonCode: "FRAME_DRAW_CONTEXT_INVALID"
    }
  });
  const drawFailureResult =
    drawFailure.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  assert.equal(drawFailureResult.reasonCode, "FRAME_DRAW_CONTEXT_INVALID");
  assert.equal(drawFailureResult.cleanupAttemptCount, 1);
  assert.equal(drawFailureResult.cleanupCompleted, true);

  const drawException = createFakeAdapterEnvironment({
    drawBridgeThrows: new Error("draw bridge exploded")
  });
  const drawExceptionResult =
    drawException.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  assert.equal(drawExceptionResult.reasonCode, "DRAW_BRIDGE_EXPLODED");
  assert.equal(drawExceptionResult.cleanupAttemptCount, 1);
  assert.equal(drawExceptionResult.cleanupCompleted, true);

  const cleanupFailure = createFakeAdapterEnvironment({
    cleanupFailure: "CANVAS_REMOVAL_FAILED"
  });
  const cleanupFailureResult =
    cleanupFailure.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  assert.equal(cleanupFailureResult.outcome, "failed_closed");
  assert.equal(cleanupFailureResult.reasonCode, "CANVAS_REMOVAL_FAILED");
  assert.equal(cleanupFailureResult.cleanupAttemptCount, 1);
  assert.equal(cleanupFailureResult.cleanupCompleted, false);
  assert.equal(cleanupFailureResult.cleanupFailed, true);
  assert.deepEqual(cleanupFailureResult.cleanupFailureReasons, [
    "CANVAS_REMOVAL_FAILED"
  ]);
});

test("manual command remains outside script.js, the adapter stays disconnected from startup and movement wiring, and no real renderer action occurs during tests", () => {
  assert.doesNotMatch(
    scriptSource,
    /runAuthorizedAtlasCustom25DOneFrame|executeGatedLiveOneFrameIntegration/
  );
  assert.match(
    developmentAlphaAppSource,
    /installDeveloperOnlyAtlasCustom25DOneFrameCommand/
  );
  assert.match(
    developmentAlphaAppSource,
    /createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter/
  );
  assert.match(
    developmentAlphaAppSource,
    /rawLeafletMapProviderFromBridgeReference/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /executeGatedLiveOneFrameIntegration|moveend zoomend|initCustom25DMapExperiment\(/
  );
  assert.match(scriptSource, /getCustom25DOneFrameBridge/);
  assert.match(scriptSource, /getGrowGoMap/);
  assert.match(scriptSource, /map\.on\("moveend zoomend", redraw\);/);
  assert.match(scriptSource, /custom25DMapLayer = \{ canvas, redraw \};/);
  assert.doesNotMatch(
    bridgeGetterBody,
    /redraw\(|map\.on\(|createPane|DomUtil\.create|setInterval|setTimeout|requestAnimationFrame|fetch\(|XMLHttpRequest|WebSocket/
  );
});

test("all four canonical safety flags remain false and fake execution reports no real renderer side effects", () => {
  const env = createFakeAdapterEnvironment();
  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();

  for (const key of [
    "runtimeExecutionEnabled",
    "mapAttachmentAllowed",
    "automaticRendererExecutionAllowed",
    "lifecycleExecutionEnabled"
  ]) {
    assert.equal(result.canonicalSafetyFlagSnapshot[key], false);
  }

  assert.equal(result.browserActivationExposed, false);
  assert.equal(result.realCanvasCreated, false);
  assert.equal(result.realPaneCreated, false);
  assert.equal(result.realDrawFunctionCalled, false);
  assert.equal(result.realListenerAdded, false);
  assert.equal(result.retentionWritten, false);
});
