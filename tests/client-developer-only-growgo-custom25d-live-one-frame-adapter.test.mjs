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
const bridgeReferenceTypeBody = extractFunctionBody(
  "describeCustom25DOneFrameBridgeReferenceType"
);
const bridgeFactoryBody = extractFunctionBody("createFrozenCustom25DOneFrameBridge");
const bridgeReaderBody = extractFunctionBody("readStableCustom25DOneFrameBridge");
const bridgeDebugBody = extractFunctionBody("getCustom25DOneFrameBridgeDebug");
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
function getGrowGoMap() {
  return map ?? null;
}
function traceCustom25DOneFrameSnapshotBoundary(functionName, callback) {
  return callback();
}
function traceCustom25DOneFrameSnapshotHandoff(functionName, callback) {
  return callback();
}
function markCustom25DOneFrameSnapshotHandoffTraceMilestone() {}
function markCustom25DOneFrameSnapshotBoundaryTraceMilestone() {}
const CUSTOM_25D_ONE_FRAME_BRIDGE_SOURCE =
  "phase-211.50m-freeze-raw-leaflet-map-object";
let custom25DOneFrameBridgeBootstrapMapGetterCalls = 0;
let custom25DOneFrameBridgeRuntimeMapGetterCalls = 0;
let custom25DOneFrameBridgeSingleton = null;
let custom25DOneFrameBridgeDebugSnapshot = Object.freeze({
  bridgeSource: CUSTOM_25D_ONE_FRAME_BRIDGE_SOURCE,
  bridgeCreationTimestamp: null,
  hasRawLeafletMapReference: false,
  rawLeafletMapReferenceType: "null",
  rawLeafletMapReferenceIdentity: null,
  usesRawLeafletMapReference: true,
  usesPublicGetGrowGoMap: false,
  usesRawLeafletMapProvider: false,
  runtimeMapGetterCalls: 0,
  bootstrapMapGetterCalls: 0
});
${bridgeSnapshotBody}
${bridgeDrawBody}
${bridgeReferenceTypeBody}
${bridgeFactoryBody}
${bridgeReaderBody}
${bridgeDebugBody}
${bridgeGetterBody}
module.exports = {
  createCustom25DFrameViewportSnapshotForOneFrame,
  drawCustom25DOneFrameFromSnapshot,
  getCustom25DOneFrameBridge,
  getCustom25DOneFrameBridgeDebug
};
`;

  const context = {
    module: { exports: {} },
    exports: {},
    Object,
    Date,
    map: options.mapValue ?? null,
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
      rawLeafletMapReference:
        overrides.omitRawLeafletMapReference === true ? undefined : map,
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
            },
      postDrawOperationContinuationHooks: overrides.postDrawOperationContinuationHooks,
      postLifecycleOwnerContinuationHooks:
        overrides.postLifecycleOwnerContinuationHooks
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
  assert.equal(status.hasBridge, true);
  assert.equal(status.adapterBridgeAvailable, false);
  assert.equal(status.commandBridgeAvailable, false);
  assert.equal(status.bridgeSource, null);
  assert.equal(status.adapterReceivedBridge, false);
  assert.equal(status.adapterBridgeResolutionFunction, null);
  assert.equal(status.hasRawLeafletMapReference, false);
  assert.equal(status.mapObjectType, "unresolved");
  assert.equal(status.mapValidationResult, "unresolved");
  assert.equal(status.mapValidationFailureReason, null);
  assert.equal(status.mapAvailabilityFailureFunction, null);
  assert.equal(status.surfacePreparationInputReady, false);

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

test("script bridge is memoized after raw map capture and debug confirms the raw reference path", () => {
  const ownedMap = { id: "leaflet-map-instance" };
  const { bridgeModule } = compileBridgeEnvironment({
    mapValue: ownedMap
  });

  const firstBridge = bridgeModule.getCustom25DOneFrameBridge();
  const secondBridge = bridgeModule.getCustom25DOneFrameBridge();
  const debug = bridgeModule.getCustom25DOneFrameBridgeDebug();

  assert.equal(firstBridge, secondBridge);
  assert.equal(firstBridge.rawLeafletMapReference, ownedMap);
  assert.equal(debug.hasRawLeafletMapReference, true);
  assert.equal(debug.rawLeafletMapReferenceIdentity, ownedMap);
  assert.equal(debug.liveLeafletMapReferenceIdentity, ownedMap);
  assert.equal(debug.rawLeafletMapReferenceMatchesCurrentMap, true);
  assert.equal(debug.usesPublicGetGrowGoMap, false);
  assert.equal(debug.usesRawLeafletMapReference, true);
  assert.equal(debug.usesRawLeafletMapProvider, false);
  assert.equal(debug.runtimeMapGetterCalls, 0);
  assert.equal(debug.bootstrapMapGetterCalls, 1);
  assert.equal(typeof debug.bridgeCreationTimestamp, "string");
});

test("one isolated fake execution completes with one surface, one registration, one snapshot, one draw, one cleanup, reference release, and permanent closure", () => {
  const env = createFakeAdapterEnvironment();

  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const status = env.adapter.getAdapterStatus();
  const identity = env.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

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
  assert.equal(result.hasBridge, true);
  assert.equal(result.adapterBridgeAvailable, false);
  assert.equal(result.commandBridgeAvailable, false);
  assert.equal(result.bridgeSource, null);
  assert.equal(result.adapterReceivedBridge, false);
  assert.equal(
    result.adapterBridgeResolutionFunction,
    "adapter.resolveRuntimeOneFrameBridge"
  );
  assert.equal(result.hasRawLeafletMapReference, true);
  assert.equal(result.mapObjectType, "object:Object");
  assert.equal(result.mapValidationResult, "present");
  assert.equal(result.mapValidationFailureReason, null);
  assert.equal(result.mapAvailabilityFailureFunction, null);
  assert.equal(result.surfacePreparationInputReady, true);

  assert.equal(env.calls.mapProvider, 0);
  assert.equal(env.calls.rawLeafletMapProvider, 0);
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

  assert.equal(identity.drawInvocationEntered, true);
  assert.equal(
    identity.drawInvocationFunctionName,
    "drawOperation.drawPreparedSurfaceExactlyOnce"
  );
  assert.equal(identity.drawOperationExecutionEntered, true);
  assert.equal(identity.drawOperationExecutionReturned, true);
  assert.equal(identity.drawMutationAttempted, true);
  assert.equal(identity.drawMutationCompleted, true);
  assert.equal(
    identity.drawMutationPropertyName,
    "canvasLayerPosition.x/y → mutable local copy"
  );
  assert.equal(identity.drawMutationTargetFrozen, true);
  assert.equal(identity.drawMutationPropertyDescriptorPresent, true);
  assert.equal(identity.drawMutationPropertyWritable, false);
  assert.equal(identity.drawMutationPropertyHasSetter, false);
  assert.equal(
    identity.drawLastCompletedFunction,
    "drawOperation.drawPreparedSurfaceExactlyOnce"
  );
  assert.equal(
    identity.drawNextExpectedFunction,
    "lifecycleOwner.disposeOwnedResources"
  );
  assert.equal(identity.drawFailureFunction, null);
  assert.equal(identity.drawExceptionReasonCode, null);

  assert.equal(status.adapterStatus, "completed");
  assert.equal(status.permanentlyClosed, true);
  assert.equal(status.referencesReleased, true);
});

test("late runtime raw map provider is accepted even when no raw map reference existed at adapter construction", () => {
  const lateMap = {
    id: "late-live-map",
    getPane() {
      return { dataset: { owner: "custom25DMapPane" } };
    },
    createPane() {
      return { dataset: { owner: "custom25DMapPane" } };
    },
    getSize() {
      return { x: 640, y: 360 };
    },
    getBounds() {
      return {
        getNorthWest() {
          return { lat: -38.1, lng: 145.2 };
        }
      };
    },
    latLngToLayerPoint() {
      return { x: 12, y: 34 };
    },
    getZoom() {
      return 16;
    }
  };

  const env = createFakeAdapterEnvironment({
    omitRawLeafletMapReference: true,
    map: lateMap
  });

  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();

  assert.equal(result.outcome, "completed");
  assert.equal(result.reasonCode, "LIVE_ONE_FRAME_DRAW_COMPLETED");
  assert.equal(result.hasRawLeafletMapReference, true);
  assert.equal(result.mapValidationResult, "present");
  assert.equal(result.mapValidationFailureReason, null);
  assert.equal(result.mapAvailabilityFailureFunction, null);
  assert.equal(env.calls.rawLeafletMapProvider, 1);
});

test("injected runtime bridge restores lost adapter bridge handoff for map, snapshot, and draw", () => {
  const previousNamespace = globalThis.GrowGoDeveloperDiagnostics;
  try {
    const lateMap = {
      id: "bridge-map",
      getPane() {
        return { dataset: { owner: "custom25DMapPane" } };
      },
      createPane() {
        return { dataset: { owner: "custom25DMapPane" } };
      },
      getSize() {
        return { x: 640, y: 360 };
      },
      getBounds() {
        return {
          getNorthWest() {
            return { lat: -38.1, lng: 145.2 };
          }
        };
      },
      latLngToLayerPoint() {
        return { x: 12, y: 34 };
      },
      getZoom() {
        return 16;
      }
    };

    let snapshotCalls = 0;
    let drawCalls = 0;

    globalThis.GrowGoDeveloperDiagnostics = {
      getCustom25DOneFrameBridge() {
        return {
          rawLeafletMapReference: lateMap,
          createCustom25DFrameViewportSnapshotForOneFrame() {
            snapshotCalls += 1;
            return {
              outcome: "snapshot_created",
              reasonCode: "FRAME_VIEWPORT_SNAPSHOT_CREATED",
              frameViewportSnapshot: createImmutableSnapshot()
            };
          },
          drawCustom25DOneFrameFromSnapshot() {
            drawCalls += 1;
            return {
              outcome: "drawn",
              reasonCode: "FRAME_DRAW_COMPLETED"
            };
          }
        };
      },
      getCustom25DOneFrameBridgeDebug() {
        return {
          bridgeSource: "phase-211.50m-freeze-raw-leaflet-map-object"
        };
      }
    };

    const adapter = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
      rawLeafletMapReference: undefined,
      rawLeafletMapProvider: () => null,
      leafletProvider: () => ({
        DomUtil: {
          create() {},
          setPosition() {}
        }
      }),
      surfaceOperationsFactory: () => ({
        prepareOneFrameSurface() {
          return {
            outcome: "prepared",
            reasonCode: "LIVE_SURFACE_PREPARED",
            surface: {
              map: lateMap,
              pane: { dataset: { owner: "custom25DMapPane" } },
              canvas: { className: "custom-25d-map-canvas" }
            }
          };
        },
        rollbackPreparedSurface() {
          return {
            outcome: "rolled_back",
            reasonCode: "ROLLBACK_COMPLETED",
            rollbackCompleted: true,
            rollbackFailureReason: null
          };
        }
      }),
      lifecycleTranslationFactory: () => ({
        translatePreparedSurfaceToLifecycleBundle({ preparedSurface }) {
          return {
            outcome: "translated",
            reasonCode: "ONE_FRAME_LIFECYCLE_BUNDLE_TRANSLATED",
            lifecycleRegistrationAttempted: true,
            lifecycleRegistrationSucceeded: true,
            lifecycleBundle: {
              ownershipMode: "ONE_FRAME_SURFACE_ONLY",
              map: preparedSurface.map,
              pane: preparedSurface.pane,
              canvas: preparedSurface.canvas
            }
          };
        }
      }),
      lifecycleOwnerFactory: () => ({
        registerOwnedResources() {
          return {
            outcome: "registered",
            reasonCode: "OWNERSHIP_REGISTERED",
            status: { ownershipRegistered: true }
          };
        },
        disposeOwnedResources() {
          return {
            outcome: "disposed",
            reasonCode: "CLEANUP_COMPLETED",
            status: {
              cleanupCompleted: true,
              cleanupFailed: false,
              cleanupFailureReasons: []
            }
          };
        }
      }),
      frameSnapshotProvider: () => null,
      drawFunctionProvider: () => null,
      drawOperationFactory: ({ drawFunctionProvider }) => ({
        drawPreparedSurfaceExactlyOnce(input) {
          const draw = drawFunctionProvider();
          const bridgeResult = draw(input);
          return {
            outcome: bridgeResult?.outcome === "drawn" ? "completed" : "failed_closed",
            reasonCode:
              bridgeResult?.outcome === "drawn"
                ? "LIVE_ONE_FRAME_DRAW_COMPLETED"
                : bridgeResult?.reasonCode ?? "DRAW_BRIDGE_FAILED",
            drawAttemptCount: 1,
            completedFrameCount: bridgeResult?.outcome === "drawn" ? 1 : 0
          };
        }
      })
    });

    const bridge = globalThis.GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridge();
    const result = adapter.executeDeveloperOnlyLiveOneFrameAdapter({
      bridge,
      bridgeSource: "phase-211.50m-freeze-raw-leaflet-map-object",
      hasRawLeafletMapReference: true
    });

    assert.equal(result.outcome, "completed");
    assert.equal(result.reasonCode, "LIVE_ONE_FRAME_DRAW_COMPLETED");
    assert.equal(result.adapterBridgeAvailable, true);
    assert.equal(result.commandBridgeAvailable, true);
    assert.equal(
      result.bridgeSource,
      "phase-211.50m-freeze-raw-leaflet-map-object"
    );
    assert.equal(result.adapterReceivedBridge, true);
    assert.equal(
      result.adapterBridgeResolutionFunction,
      "adapter.resolveInjectedRuntimeOneFrameBridge"
    );
    assert.equal(result.hasRawLeafletMapReference, true);
    assert.equal(result.mapValidationResult, "present");
    assert.equal(result.surfacePreparationInputReady, true);
    assert.equal(snapshotCalls, 1);
    assert.equal(drawCalls, 1);
  } finally {
    if (previousNamespace === undefined) {
      delete globalThis.GrowGoDeveloperDiagnostics;
    } else {
      globalThis.GrowGoDeveloperDiagnostics = previousNamespace;
    }
  }
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
      overrides: {
        omitMapProvider: true,
        omitRawLeafletMapProvider: true,
        omitRawLeafletMapReference: true
      },
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

test("MAP_UNAVAILABLE result records developer-only raw map availability diagnostics", () => {
  const env = createFakeAdapterEnvironment({ map: null });

  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const status = env.adapter.getAdapterStatus();

  assert.equal(result.reasonCode, "MAP_UNAVAILABLE");
  assert.equal(result.hasBridge, true);
  assert.equal(result.adapterBridgeAvailable, false);
  assert.equal(result.commandBridgeAvailable, false);
  assert.equal(result.bridgeSource, null);
  assert.equal(result.adapterReceivedBridge, false);
  assert.equal(
    result.adapterBridgeResolutionFunction,
    "adapter.resolveRuntimeOneFrameBridge"
  );
  assert.equal(result.hasRawLeafletMapReference, false);
  assert.equal(result.mapObjectType, "null");
  assert.equal(result.mapValidationResult, "missing");
  assert.equal(result.mapValidationFailureReason, "MAP_REFERENCE_MISSING");
  assert.equal(
    result.mapAvailabilityFailureFunction,
    "adapter.resolveRuntimeRawLeafletMapReference"
  );
  assert.equal(result.surfacePreparationInputReady, false);
  assert.equal(status.mapValidationResult, "missing");
});

test("snapshot handoff trace captures the pre-assignment failure boundary when snapshot creation overflows", () => {
  const previousTrace = globalThis.__GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE__;
  try {
    let traceState = {
      currentDepth: 0,
      maxObservedDepth: 0,
      last100Calls: [],
      last100FunctionNames: [],
      totalEntryCount: 0,
      totalExitCount: 0,
      totalExceptionCount: 0,
      lastFailedFunctionName: null,
      previousFunctionNameBeforeFailure: null,
      lastExceptionName: null,
      lastExceptionMessage: null,
      lastExceptionReasonCode: null,
      stackOverflowDetected: false,
      reachedSurfacePreparationCompletion: false,
      reachedSnapshotHandoffCall: false,
      reachedCreateCustom25DFrameViewportSnapshotForOneFrame: false,
      reachedCreateCustom25DFrameViewportSnapshotPrivateImplementation: false,
      reachedCreateCustom25DFrameViewportSnapshot: false,
      reachedSnapshotReturn: false,
      reachedFrameSnapshotCreatedAssignment: false,
      reasonCode: "TEST_PREP"
    };

    globalThis.__GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE__ = {
      enter(functionName, detail = null) {
        traceState.currentDepth += 1;
        traceState.maxObservedDepth = Math.max(
          traceState.maxObservedDepth,
          traceState.currentDepth
        );
        traceState.totalEntryCount += 1;
        traceState.last100Calls.push({
          phase: "entry",
          functionName,
          depth: traceState.currentDepth,
          detail
        });
        traceState.last100FunctionNames.push(functionName);
      },
      exit(functionName, detail = null) {
        traceState.last100Calls.push({
          phase: "exit",
          functionName,
          depth: traceState.currentDepth,
          detail
        });
        traceState.currentDepth = Math.max(0, traceState.currentDepth - 1);
        traceState.totalExitCount += 1;
      },
      exception(functionName, error, detail = null) {
        traceState.last100Calls.push({
          phase: "exception",
          functionName,
          depth: traceState.currentDepth,
          detail,
          reasonCode: error?.message ?? "ERROR"
        });
        traceState.previousFunctionNameBeforeFailure =
          traceState.last100FunctionNames[traceState.last100FunctionNames.length - 1] ??
          null;
        traceState.lastFailedFunctionName = functionName;
        traceState.lastExceptionName = error?.name ?? "Error";
        traceState.lastExceptionMessage = error?.message ?? null;
        traceState.lastExceptionReasonCode = error?.message ?? "ERROR";
        traceState.stackOverflowDetected = /maximum call stack size exceeded/i.test(
          String(error?.message ?? "")
        );
        traceState.currentDepth = Math.max(0, traceState.currentDepth - 1);
        traceState.totalExitCount += 1;
        traceState.totalExceptionCount += 1;
      },
      mark(name) {
        traceState[name] = true;
      },
      reset(reasonCode = "RESET") {
        traceState = {
          ...traceState,
          currentDepth: 0,
          maxObservedDepth: 0,
          last100Calls: [],
          last100FunctionNames: [],
          totalEntryCount: 0,
          totalExitCount: 0,
          totalExceptionCount: 0,
          lastFailedFunctionName: null,
          previousFunctionNameBeforeFailure: null,
          lastExceptionName: null,
          lastExceptionMessage: null,
          lastExceptionReasonCode: null,
          stackOverflowDetected: false,
          reachedSurfacePreparationCompletion: false,
          reachedSnapshotHandoffCall: false,
          reachedCreateCustom25DFrameViewportSnapshotForOneFrame: false,
          reachedCreateCustom25DFrameViewportSnapshotPrivateImplementation: false,
          reachedCreateCustom25DFrameViewportSnapshot: false,
          reachedSnapshotReturn: false,
          reachedFrameSnapshotCreatedAssignment: false,
          reasonCode
        };
      },
      getSnapshot() {
        return traceState;
      }
    };

    const env = createFakeAdapterEnvironment({
      frameSnapshotBridgeThrows: new RangeError("Maximum call stack size exceeded")
    });
    const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
    const trace = globalThis.__GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE__.getSnapshot();

    assert.equal(result.outcome, "failed_closed");
    assert.equal(result.reasonCode, "MAXIMUM_CALL_STACK_SIZE_EXCEEDED");
    assert.equal(result.surfacePrepared, true);
    assert.equal(result.frameSnapshotCreated, false);
    assert.equal(trace.reachedSurfacePreparationCompletion, true);
    assert.equal(trace.reachedSnapshotHandoffCall, true);
    assert.equal(trace.reachedFrameSnapshotCreatedAssignment, false);
    assert.equal(trace.lastFailedFunctionName, "adapter.invokeFrameSnapshotBridge");
    assert.equal(trace.lastExceptionName, "RangeError");
    assert.equal(trace.lastExceptionReasonCode, "Maximum call stack size exceeded");
    assert.equal(trace.stackOverflowDetected, true);
  } finally {
    if (previousTrace === undefined) {
      delete globalThis.__GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE__;
    } else {
      globalThis.__GROWGO_CUSTOM25D_ONE_FRAME_SNAPSHOT_HANDOFF_TRACE__ = previousTrace;
    }
  }
});

test("pre-snapshot handoff trace records handoff creation attempt and required field presence before snapshot invocation", () => {
  const previousTrace = globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__;
  try {
    let traceState = {
      currentDepth: 0,
      maxObservedDepth: 0,
      last100Calls: [],
      last100FunctionNames: [],
      totalEntryCount: 0,
      totalExitCount: 0,
      totalExceptionCount: 0,
      lastFailedFunctionName: null,
      previousFunctionNameBeforeFailure: null,
      lastExceptionName: null,
      lastExceptionMessage: null,
      lastExceptionReasonCode: null,
      stackOverflowDetected: false,
      reasonCode: "TEST_HANDOFF_CREATION",
      adapterPostCallbackResolutionNextStep: null,
      adapterEarlyReturnReason: null,
      adapterExecutionCompletionReason: null,
      payloadAssemblyEntryMarked: false,
      payloadAssemblyEntryFunction: null,
      payloadAssemblyNotReachedBranchReason: null,
      payloadAssemblyNotReachedReturnReason: null,
      postDrawBridgeNextFunction: null,
      handoffPayloadAssemblyStarted: false,
      handoffPayloadAssemblyFunction: null,
      surfaceInputPresent: false,
      surfaceInputHasCanvas: false,
      surfaceInputHasMap: false,
      surfaceInputHasViewport: false,
      handoffMapAssigned: false,
      handoffCanvasAssigned: false,
      handoffViewportAssigned: false,
      handoffSnapshotCallbackAssigned: false,
      handoffDrawCallbackAssigned: false,
      handoffCreationBranchEntered: false,
      handoffCreationSkippedReason: null,
      handoffCreationAttempted: false,
      handoffCreationSucceeded: false,
      handoffCreationFailureReason: null,
      handoffCreationFunction: null,
      handoffRequiredMapPresent: false,
      handoffRequiredCanvasPresent: false,
      handoffRequiredSnapshotCallbackPresent: false,
      handoffRequiredDrawCallbackPresent: false,
      handoffViewportDataPresent: false,
      handoffObjectCreated: false,
      handoffObjectHasMap: false,
      handoffObjectHasCanvas: false,
      handoffObjectHasFrameSnapshot: false,
      handoffObjectHasViewportData: false,
      handoffObjectHasCallbacks: false
    };

    globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__ = {
      enter(functionName, detail = null) {
        traceState.currentDepth += 1;
        traceState.maxObservedDepth = Math.max(
          traceState.maxObservedDepth,
          traceState.currentDepth
        );
        traceState.totalEntryCount += 1;
        traceState.last100FunctionNames.push(functionName);
        traceState.last100Calls.push({
          phase: "enter",
          functionName,
          depth: traceState.currentDepth,
          detail
        });
        if (traceState.last100Calls.length > 100) {
          traceState.last100Calls.shift();
        }
        if (traceState.last100FunctionNames.length > 100) {
          traceState.last100FunctionNames.shift();
        }
      },
      exit(functionName, detail = null) {
        traceState.last100Calls.push({
          phase: "exit",
          functionName,
          depth: traceState.currentDepth,
          detail
        });
        if (traceState.last100Calls.length > 100) {
          traceState.last100Calls.shift();
        }
        traceState.currentDepth = Math.max(0, traceState.currentDepth - 1);
        traceState.totalExitCount += 1;
      },
      exception(functionName, error, detail = null) {
        traceState.last100Calls.push({
          phase: "exception",
          functionName,
          depth: traceState.currentDepth,
          detail,
          reasonCode: error?.message ?? "ERROR"
        });
        if (traceState.last100Calls.length > 100) {
          traceState.last100Calls.shift();
        }
        traceState.previousFunctionNameBeforeFailure =
          traceState.last100FunctionNames[traceState.last100FunctionNames.length - 1] ??
          null;
        traceState.lastFailedFunctionName = functionName;
        traceState.lastExceptionName = error?.name ?? "Error";
        traceState.lastExceptionMessage = error?.message ?? null;
        traceState.lastExceptionReasonCode = error?.message ?? "ERROR";
        traceState.stackOverflowDetected = /maximum call stack size exceeded/i.test(
          String(error?.message ?? "")
        );
        traceState.currentDepth = Math.max(0, traceState.currentDepth - 1);
        traceState.totalExitCount += 1;
        traceState.totalExceptionCount += 1;
      },
      update(patch = {}) {
        traceState = {
          ...traceState,
          ...patch
        };
      },
      getSnapshot() {
        return traceState;
      }
    };

    const env = createFakeAdapterEnvironment();
    const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
    const trace =
      globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__.getSnapshot();

    assert.equal(result.outcome, "completed");
    assert.equal(result.frameSnapshotCreated, true);
    assert.equal(
      trace.adapterPostCallbackResolutionNextStep,
      "adapter.invokeSnapshotCallback"
    );
    assert.equal(trace.adapterEarlyReturnReason, null);
    assert.equal(
      trace.adapterExecutionCompletionReason,
      "SNAPSHOT_INVOCATION_REACHED"
    );
    assert.equal(trace.payloadAssemblyEntryMarked, true);
    assert.equal(
      trace.payloadAssemblyEntryFunction,
      "adapter.assembleSnapshotHandoffPayload"
    );
    assert.equal(trace.payloadAssemblyNotReachedBranchReason, null);
    assert.equal(trace.payloadAssemblyNotReachedReturnReason, null);
    assert.equal(
      trace.postDrawBridgeNextFunction,
      "adapter.resolveSnapshotCompatibleMap"
    );
    assert.equal(trace.handoffPayloadAssemblyStarted, true);
    assert.equal(
      trace.handoffPayloadAssemblyFunction,
      "adapter.assembleSnapshotHandoffPayload"
    );
    assert.equal(trace.surfaceInputPresent, true);
    assert.equal(trace.surfaceInputHasCanvas, true);
    assert.equal(trace.surfaceInputHasMap, true);
    assert.equal(trace.surfaceInputHasViewport, false);
    assert.equal(trace.handoffMapAssigned, true);
    assert.equal(trace.handoffCanvasAssigned, true);
    assert.equal(trace.handoffViewportAssigned, true);
    assert.equal(trace.handoffSnapshotCallbackAssigned, true);
    assert.equal(trace.handoffDrawCallbackAssigned, true);
    assert.equal(trace.handoffCreationBranchEntered, true);
    assert.equal(trace.handoffCreationSkippedReason, null);
    assert.equal(trace.handoffCreationFunction, "adapter.createSnapshotBridgeInput");
    assert.equal(trace.handoffCreationAttempted, true);
    assert.equal(trace.handoffCreationSucceeded, true);
    assert.equal(trace.handoffCreationFailureReason, null);
    assert.equal(trace.handoffRequiredMapPresent, true);
    assert.equal(trace.handoffRequiredCanvasPresent, true);
    assert.equal(trace.handoffRequiredSnapshotCallbackPresent, true);
    assert.equal(trace.handoffRequiredDrawCallbackPresent, true);
    assert.equal(trace.handoffViewportDataPresent, true);
    assert.equal(trace.handoffObjectCreated, true);
    assert.equal(trace.handoffObjectHasMap, true);
    assert.equal(trace.handoffObjectHasCanvas, true);
    assert.equal(trace.handoffObjectHasFrameSnapshot, false);
    assert.equal(trace.handoffObjectHasViewportData, true);
    assert.equal(trace.handoffObjectHasCallbacks, true);
    assert.equal(trace.totalExceptionCount, 0);
    assert.equal(
      trace.last100FunctionNames.includes("adapter.createSnapshotBridgeInput"),
      true
    );
    assert.equal(
      trace.last100FunctionNames.includes("adapter.invokeSnapshotCallback"),
      true
    );
  } finally {
    if (previousTrace === undefined) {
      delete globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__;
    } else {
      globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__ = previousTrace;
    }
  }
});

test("pre-snapshot handoff trace records skipped handoff payload assembly when required payload is missing", () => {
  const previousTrace = globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__;
  try {
    let traceState = {
      currentDepth: 0,
      maxObservedDepth: 0,
      last100Calls: [],
      last100FunctionNames: [],
      totalEntryCount: 0,
      totalExitCount: 0,
      totalExceptionCount: 0,
      lastFailedFunctionName: null,
      previousFunctionNameBeforeFailure: null,
      lastExceptionName: null,
      lastExceptionMessage: null,
      lastExceptionReasonCode: null,
      stackOverflowDetected: false,
      reasonCode: "TEST_HANDOFF_SKIP",
      adapterPostCallbackResolutionNextStep: null,
      adapterEarlyReturnReason: null,
      adapterExecutionCompletionReason: null,
      payloadAssemblyEntryMarked: false,
      payloadAssemblyEntryFunction: null,
      payloadAssemblyNotReachedBranchReason: null,
      payloadAssemblyNotReachedReturnReason: null,
      postDrawBridgeNextFunction: null,
      handoffPayloadAssemblyStarted: false,
      handoffPayloadAssemblyFunction: null,
      surfaceInputPresent: false,
      surfaceInputHasCanvas: false,
      surfaceInputHasMap: false,
      surfaceInputHasViewport: false,
      handoffMapAssigned: false,
      handoffCanvasAssigned: false,
      handoffViewportAssigned: false,
      handoffSnapshotCallbackAssigned: false,
      handoffDrawCallbackAssigned: false,
      handoffCreationBranchEntered: false,
      handoffCreationSkippedReason: null,
      handoffCreationAttempted: false,
      handoffCreationSucceeded: false,
      handoffCreationFailureReason: null,
      handoffCreationFunction: null,
      handoffRequiredMapPresent: false,
      handoffRequiredCanvasPresent: false,
      handoffRequiredSnapshotCallbackPresent: false,
      handoffRequiredDrawCallbackPresent: false,
      handoffViewportDataPresent: false,
      handoffObjectCreated: false,
      handoffObjectHasMap: false,
      handoffObjectHasCanvas: false,
      handoffObjectHasFrameSnapshot: false,
      handoffObjectHasViewportData: false,
      handoffObjectHasCallbacks: false
    };

    globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__ = {
      enter(functionName, detail = null) {
        traceState.currentDepth += 1;
        traceState.maxObservedDepth = Math.max(
          traceState.maxObservedDepth,
          traceState.currentDepth
        );
        traceState.totalEntryCount += 1;
        traceState.last100FunctionNames.push(functionName);
        traceState.last100Calls.push({
          phase: "enter",
          functionName,
          depth: traceState.currentDepth,
          detail
        });
        if (traceState.last100Calls.length > 100) {
          traceState.last100Calls.shift();
        }
        if (traceState.last100FunctionNames.length > 100) {
          traceState.last100FunctionNames.shift();
        }
      },
      exit(functionName, detail = null) {
        traceState.last100Calls.push({
          phase: "exit",
          functionName,
          depth: traceState.currentDepth,
          detail
        });
        if (traceState.last100Calls.length > 100) {
          traceState.last100Calls.shift();
        }
        traceState.currentDepth = Math.max(0, traceState.currentDepth - 1);
        traceState.totalExitCount += 1;
      },
      exception(functionName, error, detail = null) {
        traceState.last100Calls.push({
          phase: "exception",
          functionName,
          depth: traceState.currentDepth,
          detail,
          reasonCode: error?.message ?? "ERROR"
        });
        if (traceState.last100Calls.length > 100) {
          traceState.last100Calls.shift();
        }
        traceState.previousFunctionNameBeforeFailure =
          traceState.last100FunctionNames[traceState.last100FunctionNames.length - 1] ??
          null;
        traceState.lastFailedFunctionName = functionName;
        traceState.lastExceptionName = error?.name ?? "Error";
        traceState.lastExceptionMessage = error?.message ?? null;
        traceState.lastExceptionReasonCode = error?.message ?? "ERROR";
        traceState.stackOverflowDetected = /maximum call stack size exceeded/i.test(
          String(error?.message ?? "")
        );
        traceState.currentDepth = Math.max(0, traceState.currentDepth - 1);
        traceState.totalExitCount += 1;
        traceState.totalExceptionCount += 1;
      },
      update(patch = {}) {
        traceState = {
          ...traceState,
          ...patch
        };
      },
      getSnapshot() {
        return traceState;
      }
    };

    const env = createFakeAdapterEnvironment({
      surface: {
        map: { id: "fake-live-map" },
        pane: { dataset: { owner: "custom25DMapPane" } },
        canvas: null
      }
    });
    const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
    const trace =
      globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__.getSnapshot();

    assert.equal(result.outcome, "failed_closed");
    assert.equal(result.reasonCode, "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED");
    assert.equal(result.frameSnapshotCreated, false);
    assert.equal(
      trace.adapterPostCallbackResolutionNextStep,
      "adapter.assembleSnapshotHandoffPayload"
    );
    assert.equal(
      trace.adapterEarlyReturnReason,
      "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED"
    );
    assert.equal(
      trace.adapterExecutionCompletionReason,
      "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED"
    );
    assert.equal(trace.payloadAssemblyEntryMarked, true);
    assert.equal(
      trace.payloadAssemblyEntryFunction,
      "adapter.assembleSnapshotHandoffPayload"
    );
    assert.equal(trace.payloadAssemblyNotReachedBranchReason, null);
    assert.equal(trace.payloadAssemblyNotReachedReturnReason, null);
    assert.equal(
      trace.postDrawBridgeNextFunction,
      "adapter.resolveSnapshotCompatibleMap"
    );
    assert.equal(trace.handoffPayloadAssemblyStarted, true);
    assert.equal(
      trace.handoffPayloadAssemblyFunction,
      "adapter.assembleSnapshotHandoffPayload"
    );
    assert.equal(trace.surfaceInputPresent, true);
    assert.equal(trace.surfaceInputHasCanvas, false);
    assert.equal(trace.surfaceInputHasMap, true);
    assert.equal(trace.handoffMapAssigned, true);
    assert.equal(trace.handoffCanvasAssigned, false);
    assert.equal(trace.handoffViewportAssigned, true);
    assert.equal(trace.handoffSnapshotCallbackAssigned, true);
    assert.equal(trace.handoffDrawCallbackAssigned, true);
    assert.equal(trace.handoffCreationBranchEntered, false);
    assert.equal(
      trace.handoffCreationSkippedReason,
      "SURFACE_INPUT_CANVAS_MISSING"
    );
    assert.equal(trace.handoffCreationAttempted, false);
    assert.equal(trace.handoffCreationSucceeded, false);
    assert.equal(
      trace.handoffCreationFailureReason,
      "SURFACE_INPUT_CANVAS_MISSING"
    );
    assert.equal(trace.handoffObjectCreated, false);
    assert.equal(trace.handoffObjectHasCanvas, false);
    assert.equal(trace.totalExceptionCount, 0);
    assert.equal(
      trace.last100FunctionNames.includes("adapter.assembleSnapshotHandoffPayload"),
      true
    );
    assert.equal(
      trace.last100FunctionNames.includes("adapter.createSnapshotBridgeInput"),
      false
    );
  } finally {
    if (previousTrace === undefined) {
      delete globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__;
    } else {
      globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__ = previousTrace;
    }
  }
});

test("pre-snapshot handoff trace records the exact not-reached branch when execution returns before payload assembly begins", () => {
  const previousTrace = globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__;
  try {
    let traceState = {
      currentDepth: 0,
      maxObservedDepth: 0,
      last100Calls: [],
      last100FunctionNames: [],
      totalEntryCount: 0,
      totalExitCount: 0,
      totalExceptionCount: 0,
      lastFailedFunctionName: null,
      previousFunctionNameBeforeFailure: null,
      lastExceptionName: null,
      lastExceptionMessage: null,
      lastExceptionReasonCode: null,
      stackOverflowDetected: false,
      reasonCode: "TEST_NOT_REACHED",
      adapterPostCallbackResolutionNextStep: null,
      adapterEarlyReturnReason: null,
      adapterExecutionCompletionReason: null,
      payloadAssemblyEntryMarked: false,
      payloadAssemblyEntryFunction: null,
      payloadAssemblyNotReachedBranchReason: null,
      payloadAssemblyNotReachedReturnReason: null,
      postDrawBridgeNextFunction: null
    };

    globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__ = {
      enter(functionName, detail = null) {
        traceState.currentDepth += 1;
        traceState.maxObservedDepth = Math.max(
          traceState.maxObservedDepth,
          traceState.currentDepth
        );
        traceState.totalEntryCount += 1;
        traceState.last100FunctionNames.push(functionName);
        traceState.last100Calls.push({
          phase: "enter",
          functionName,
          depth: traceState.currentDepth,
          detail
        });
        if (traceState.last100Calls.length > 100) traceState.last100Calls.shift();
        if (traceState.last100FunctionNames.length > 100) {
          traceState.last100FunctionNames.shift();
        }
      },
      exit(functionName, detail = null) {
        traceState.last100Calls.push({
          phase: "exit",
          functionName,
          depth: traceState.currentDepth,
          detail
        });
        if (traceState.last100Calls.length > 100) traceState.last100Calls.shift();
        traceState.currentDepth = Math.max(0, traceState.currentDepth - 1);
        traceState.totalExitCount += 1;
      },
      exception(functionName, error, detail = null) {
        traceState.last100Calls.push({
          phase: "exception",
          functionName,
          depth: traceState.currentDepth,
          detail,
          reasonCode: error?.message ?? "ERROR"
        });
        if (traceState.last100Calls.length > 100) traceState.last100Calls.shift();
        traceState.previousFunctionNameBeforeFailure =
          traceState.last100FunctionNames[traceState.last100FunctionNames.length - 1] ??
          null;
        traceState.lastFailedFunctionName = functionName;
        traceState.lastExceptionName = error?.name ?? "Error";
        traceState.lastExceptionMessage = error?.message ?? null;
        traceState.lastExceptionReasonCode = error?.message ?? "ERROR";
        traceState.stackOverflowDetected = /maximum call stack size exceeded/i.test(
          String(error?.message ?? "")
        );
        traceState.currentDepth = Math.max(0, traceState.currentDepth - 1);
        traceState.totalExitCount += 1;
        traceState.totalExceptionCount += 1;
      },
      update(patch = {}) {
        traceState = {
          ...traceState,
          ...patch
        };
      },
      getSnapshot() {
        return traceState;
      }
    };

    const env = createFakeAdapterEnvironment({
      drawOperationFactoryResult: {}
    });
    const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
    const trace =
      globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__.getSnapshot();

    assert.equal(result.outcome, "failed_closed");
    assert.equal(result.reasonCode, "DRAW_OPERATION_UNAVAILABLE");
    assert.equal(
      trace.adapterPostCallbackResolutionNextStep,
      "adapter.createDrawOperation"
    );
    assert.equal(trace.adapterEarlyReturnReason, "DRAW_OPERATION_UNAVAILABLE");
    assert.equal(
      trace.adapterExecutionCompletionReason,
      "DRAW_OPERATION_UNAVAILABLE"
    );
    assert.equal(trace.payloadAssemblyEntryMarked, false);
    assert.equal(
      trace.payloadAssemblyEntryFunction,
      "adapter.assembleSnapshotHandoffPayload"
    );
    assert.equal(
      trace.payloadAssemblyNotReachedBranchReason,
      "DRAW_OPERATION_UNAVAILABLE"
    );
    assert.equal(
      trace.payloadAssemblyNotReachedReturnReason,
      "DRAW_OPERATION_UNAVAILABLE"
    );
    assert.equal(trace.postDrawBridgeNextFunction, "adapter.createDrawOperation");
    assert.equal(
      trace.last100FunctionNames.includes("adapter.resolveDrawBridge"),
      true
    );
    assert.equal(
      trace.last100FunctionNames.includes("adapter.assembleSnapshotHandoffPayload"),
      false
    );
    assert.equal(trace.totalExceptionCount, 0);
  } finally {
    if (previousTrace === undefined) {
      delete globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__;
    } else {
      globalThis.__GROWGO_ATLAS_ONE_FRAME_PRE_SNAPSHOT_HANDOFF_TRACE__ = previousTrace;
    }
  }
});

test("post-draw-operation continuation completes refs assignments, surface preparation, status write, and payload entry on the normal path", () => {
  const env = createFakeAdapterEnvironment();

  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const identity = env.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(result.outcome, "completed");
  assert.equal(identity.createDrawOperationReturned, true);
  assert.equal(identity.postDrawOperationContinuationEntered, true);
  assert.equal(identity.drawOperationLocalAssignmentAttempted, true);
  assert.equal(identity.drawOperationLocalAssignmentCompleted, true);
  assert.equal(identity.currentRefsMapAssignmentAttempted, true);
  assert.equal(identity.currentRefsMapAssignmentCompleted, true);
  assert.equal(identity.currentRefsLifecycleOwnerAssignmentAttempted, true);
  assert.equal(identity.currentRefsLifecycleOwnerAssignmentCompleted, true);
  assert.equal(identity.currentRefsDrawOperationAssignmentAttempted, true);
  assert.equal(identity.currentRefsDrawOperationAssignmentCompleted, true);
  assert.equal(identity.prepareOneFrameSurfaceSelected, true);
  assert.equal(identity.prepareOneFrameSurfaceCallAttempted, true);
  assert.equal(identity.prepareOneFrameSurfaceCallEntered, true);
  assert.equal(identity.prepareOneFrameSurfaceCallReturned, true);
  assert.equal(identity.prepareOneFrameSurfaceResultType, "object:Object");
  assert.equal(identity.surfacePreparationInputReadyStatusWriteAttempted, true);
  assert.equal(identity.surfacePreparationInputReadyStatusWriteCompleted, true);
  assert.equal(
    identity.postDrawOperationLastCompletedStep,
    "surfaceOperations.prepareOneFrameSurface returned"
  );
  assert.equal(identity.postDrawOperationNextExpectedStep, "payload assembly entry");
  assert.equal(identity.postDrawOperationFailureFunction, null);
  assert.equal(identity.postDrawOperationExceptionName, null);
  assert.equal(identity.preparedSurfaceLocalAssignmentAttempted, true);
  assert.equal(identity.preparedSurfaceLocalAssignmentCompleted, true);
  assert.equal(identity.preparedSurfacePresent, true);
  assert.equal(identity.preparedSurfaceType, "object:Object");
  assert.deepEqual(identity.preparedSurfaceKeys, ["outcome", "reasonCode", "surface"]);
  assert.equal(identity.preparedSurfaceStatusReadAttempted, true);
  assert.equal(identity.preparedSurfaceStatusReadCompleted, true);
  assert.equal(identity.preparedSurfaceStatusValue, "prepared");
  assert.equal(identity.preparedSurfaceReasonReadAttempted, true);
  assert.equal(identity.preparedSurfaceReasonReadCompleted, true);
  assert.equal(identity.preparedSurfaceReasonValue, "LIVE_SURFACE_PREPARED");
  assert.equal(identity.preparedSurfaceCanvasReadAttempted, true);
  assert.equal(identity.preparedSurfaceCanvasReadCompleted, true);
  assert.equal(identity.preparedSurfaceCanvasPresent, true);
  assert.equal(identity.preparedSurfaceMapReadAttempted, true);
  assert.equal(identity.preparedSurfaceMapReadCompleted, true);
  assert.equal(identity.preparedSurfaceMapPresent, true);
  assert.equal(identity.postPreparedSurfaceMapReadContinuationEntered, true);
  assert.equal(
    identity.postPreparedSurfaceMapReadNextFunction,
    "payload entry marker write"
  );
  assert.equal(identity.preparedSurfacePayloadLocalCreationAttempted, true);
  assert.equal(identity.preparedSurfacePayloadLocalCreationCompleted, true);
  assert.equal(identity.preparedSurfacePayloadLocalType, "object:Object");
  assert.equal(identity.preparedSurfaceMapLocalAssignmentAttempted, true);
  assert.equal(identity.preparedSurfaceMapLocalAssignmentCompleted, true);
  assert.equal(identity.preparedSurfaceCanvasLocalAssignmentAttempted, true);
  assert.equal(identity.preparedSurfaceCanvasLocalAssignmentCompleted, true);
  assert.equal(identity.preparedSurfaceOwnerLocalAssignmentAttempted, true);
  assert.equal(identity.preparedSurfaceOwnerLocalAssignmentCompleted, true);
  assert.equal(identity.payloadEntryTraceMutationAttempted, true);
  assert.equal(identity.payloadEntryTraceMutationCompleted, true);
  assert.equal(
    identity.postMapReadLastCompletedStatement,
    "payload entry trace mutation"
  );
  assert.equal(
    identity.postMapReadNextExpectedStatement,
    "payload entry marker write"
  );
  assert.equal(identity.postMapReadFailureFunction, null);
  assert.equal(identity.postMapReadExceptionName, null);
  assert.equal(identity.postMapReadExceptionMessage, null);
  assert.equal(identity.postMapReadExceptionReasonCode, null);
  assert.equal(identity.postMapReadObjectSpreadInvoked, true);
  assert.equal(identity.postMapReadStructuredCloneInvoked, false);
  assert.equal(identity.postMapReadObjectFreezeInvoked, false);
  assert.equal(identity.postMapReadJsonSerializationInvoked, false);
  assert.equal(identity.postMapReadPropertyEnumerationInvoked, false);
  assert.equal(identity.postMapReadGetterInvoked, false);
  assert.equal(identity.postMapReadSetterInvoked, false);
  assert.equal(identity.postMapReadProxyTrapInvoked, false);
  assert.equal(identity.postMapReadRecursiveCallbackInvoked, false);
  assert.equal(identity.postMapReadDiagnosticsLookupInvoked, false);
  assert.equal(identity.lifecycleRegistrationStateAssignmentAttempted, true);
  assert.equal(identity.lifecycleRegistrationStateAssignmentCompleted, true);
  assert.equal(identity.lifecycleRegistrationStateValue, true);
  assert.equal(identity.lifecycleTranslationGateEntered, true);
  assert.equal(identity.lifecycleTranslationGateOperandOneEvaluated, true);
  assert.equal(identity.lifecycleTranslationGateOperandOneValue, false);
  assert.equal(identity.lifecycleTranslationGateOperandTwoEvaluated, true);
  assert.equal(identity.lifecycleTranslationGateOperandTwoValue, false);
  assert.equal(identity.lifecycleTranslationObjectSpreadAttempted, true);
  assert.equal(identity.lifecycleTranslationObjectSpreadCompleted, true);
  assert.equal(identity.lifecycleTranslationFunctionSelected, true);
  assert.equal(identity.lifecycleTranslationFunctionEntered, true);
  assert.equal(identity.lifecycleTranslationFunctionReturned, true);
  assert.equal(identity.lifecycleTranslationResultType, "object:Object");
  assert.equal(identity.lifecycleTranslationResultStatus, "translated");
  assert.equal(identity.lifecycleRegisteredStatusWriteAttempted, true);
  assert.equal(identity.lifecycleRegisteredStatusWriteCompleted, true);
  assert.equal(
    identity.lifecycleGateLastCompletedStep,
    "lifecycleRegistered status write"
  );
  assert.equal(
    identity.lifecycleGateNextExpectedStep,
    "payload-entry trace mutation"
  );
  assert.equal(identity.lifecycleGateFailureFunction, null);
  assert.equal(identity.lifecycleGateExceptionName, null);
  assert.equal(identity.lifecycleGateExceptionMessage, null);
  assert.equal(identity.lifecycleGateExceptionReasonCode, null);
  assert.equal(identity.lifecycleGateObjectSpreadInvoked, true);
  assert.equal(identity.lifecycleGateGetterInvoked, false);
  assert.equal(identity.lifecycleGateSetterInvoked, false);
  assert.equal(identity.lifecycleGateProxyTrapInvoked, false);
  assert.equal(identity.lifecycleGateRecursiveCallbackInvoked, false);
  assert.equal(identity.lifecycleGateDiagnosticsLookupInvoked, false);
  assert.equal(identity.lifecycleGateJsonSerializationInvoked, false);
  assert.equal(identity.lifecycleGateObjectFreezeInvoked, false);
  assert.equal(identity.lifecycleGateStructuredCloneInvoked, false);
  assert.equal(identity.preparedSurfaceLifecycleOwnerReadAttempted, true);
  assert.equal(identity.preparedSurfaceLifecycleOwnerReadCompleted, true);
  assert.equal(identity.preparedSurfaceLifecycleOwnerPresent, false);
  assert.equal(identity.preparedSurfaceLifecycleOwnerSource, null);
  assert.equal(identity.preparedSurfaceLifecycleOwnerPropertyName, null);
  assert.equal(identity.preparedSurfaceNestedLifecycleOwnerPresent, false);
  assert.equal(identity.currentRefsLifecycleOwnerPresentAfterSurfacePreparation, true);
  assert.equal(identity.payloadLifecycleOwnerResolved, true);
  assert.equal(
    identity.payloadLifecycleOwnerResolutionSource,
    "currentRefs.lifecycleOwner"
  );
  assert.equal(identity.payloadLifecycleOwnerResolutionFailureReason, null);
  assert.equal(identity.resolvedLifecycleOwnerLocalAssignmentAttempted, true);
  assert.equal(identity.resolvedLifecycleOwnerLocalAssignmentCompleted, true);
  assert.equal(identity.resolvedLifecycleOwnerMatchesCurrentRefs, true);
  assert.equal(identity.resolvedLifecycleOwnerIdentityType, "object:Object");
  assert.equal(identity.postLifecycleOwnerContinuationEntered, true);
  assert.equal(identity.payloadEntryMarkerWriteAttempted, true);
  assert.equal(identity.payloadEntryMarkerWriteCompleted, true);
  assert.equal(identity.payloadContextConstructorSelected, true);
  assert.equal(identity.payloadContextConstructorEntered, true);
  assert.equal(identity.payloadContextConstructorReturned, true);
  assert.equal(identity.payloadContextConstructorResultType, "object:Object");
  assert.equal(
    identity.postLifecycleOwnerLastCompletedStep,
    "payload guard evaluation entered"
  );
  assert.equal(
    identity.postLifecycleOwnerNextExpectedStep,
    "payload guard evaluation completed"
  );
  assert.equal(identity.postLifecycleOwnerFailureFunction, null);
  assert.equal(identity.postLifecycleOwnerExceptionName, null);
  assert.equal(identity.postLifecycleOwnerExceptionMessage, null);
  assert.equal(identity.postLifecycleOwnerExceptionReasonCode, null);
  assert.equal(identity.postLifecycleOwnerGetterInvoked, false);
  assert.equal(identity.postLifecycleOwnerSetterInvoked, false);
  assert.equal(identity.postLifecycleOwnerProxyTrapInvoked, false);
  assert.equal(identity.postLifecycleOwnerRecursiveCallbackInvoked, false);
  assert.equal(identity.postLifecycleOwnerDiagnosticsLookupInvoked, false);
  assert.equal(identity.payloadAssemblyEntryAttempted, true);
  assert.equal(identity.payloadAssemblyEntryCompleted, true);
  assert.equal(
    identity.preparedSurfaceContinuationLastCompletedStep,
    "payload assembly entry"
  );
  assert.equal(
    identity.preparedSurfaceContinuationNextExpectedStep,
    "payload assembly guard evaluation"
  );
  assert.equal(identity.preparedSurfaceContinuationFailureFunction, null);
  assert.equal(identity.preparedSurfaceContinuationExceptionName, null);
  assert.equal(identity.preparedSurfaceContinuationExceptionMessage, null);
  assert.equal(identity.preparedSurfaceContinuationExceptionReasonCode, null);
  assert.equal(identity.preparedSurfaceGetterInvoked, false);
  assert.equal(identity.preparedSurfaceProxyTrapInvoked, false);
  assert.equal(identity.preparedSurfaceRecursiveCallbackInvoked, false);
  assert.equal(identity.preparedSurfaceDiagnosticsLookupInvoked, false);
  assert.equal(
    identity.payloadAssemblyEntryFunction,
    "adapter.assembleSnapshotHandoffPayload"
  );
  assert.equal(identity.payloadAssemblyContextCreationAttempted, true);
  assert.equal(identity.payloadAssemblyContextCreationCompleted, true);
  assert.equal(identity.payloadGuardEvaluationAttempted, true);
  assert.equal(identity.payloadGuardEvaluationCompleted, true);
  assert.equal(identity.payloadGuardResult, true);
  assert.equal(identity.payloadGuardFailureReason, null);
  assert.equal(identity.payloadContextHasMap, true);
  assert.equal(identity.payloadContextHasCanvas, true);
  assert.equal(identity.payloadContextHasViewport, true);
  assert.equal(identity.payloadContextHasDrawOperation, true);
  assert.equal(identity.payloadContextHasCallbacks, true);
  assert.equal(identity.handoffCreationAfterGuardAttempted, true);
  assert.equal(identity.handoffCreationAfterGuardCompleted, true);
  assert.equal(identity.payloadAssemblyNextFunction, "snapshot callback invocation");
  assert.equal(identity.payloadAssemblyLastCompletedStep, "handoff object creation");
  assert.equal(identity.payloadAssemblyFailureFunction, null);
  assert.equal(identity.payloadAssemblyExceptionName, null);
  assert.equal(identity.payloadAssemblyExceptionMessage, null);
  assert.equal(identity.payloadAssemblyExceptionReasonCode, null);
  assert.equal(identity.payloadAssemblyGetterInvoked, false);
  assert.equal(identity.payloadAssemblyProxyTrapInvoked, false);
  assert.equal(identity.payloadAssemblyRecursiveCallbackInvoked, false);
  assert.equal(identity.payloadAssemblyDiagnosticsLookupInvoked, false);
  assert.equal(identity.payloadAssemblyGuardEvaluated, true);
  assert.equal(identity.payloadAssemblyInstrumentationEntered, true);
  assert.equal(result.canonicalSafetyFlagSnapshot.runtimeExecutionEnabled, false);
  assert.equal(result.canonicalSafetyFlagSnapshot.mapAttachmentAllowed, false);
  assert.equal(
    result.canonicalSafetyFlagSnapshot.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(result.canonicalSafetyFlagSnapshot.lifecycleExecutionEnabled, false);
});

test("prepared surface continuation records explicit missing canvas and missing map signals before payload assembly", () => {
  const missingCanvasEnv = createFakeAdapterEnvironment({
    surface: {
      id: "missing-canvas-surface",
      map: { id: "surface-map" },
      pane: { dataset: { owner: "custom25DMapPane" } }
    }
  });
  const missingCanvasResult =
    missingCanvasEnv.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const missingCanvasIdentity =
    missingCanvasEnv.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(missingCanvasResult.outcome, "failed_closed");
  assert.equal(missingCanvasResult.reasonCode, "HANDOFF_PAYLOAD_ASSEMBLY_SKIPPED");
  assert.equal(missingCanvasIdentity.preparedSurfaceCanvasReadCompleted, true);
  assert.equal(missingCanvasIdentity.preparedSurfaceCanvasPresent, false);
  assert.equal(missingCanvasIdentity.currentRefsLifecycleOwnerPresentAfterSurfacePreparation, true);
  assert.equal(missingCanvasIdentity.payloadLifecycleOwnerResolved, true);
  assert.equal(
    missingCanvasIdentity.payloadLifecycleOwnerResolutionSource,
    "currentRefs.lifecycleOwner"
  );
  assert.equal(missingCanvasIdentity.resolvedLifecycleOwnerMatchesCurrentRefs, true);
  assert.equal(missingCanvasIdentity.payloadAssemblyEntryCompleted, true);
  assert.equal(
    missingCanvasIdentity.payloadAssemblyEntryFunction,
    "adapter.assembleSnapshotHandoffPayload"
  );
  assert.equal(missingCanvasIdentity.payloadAssemblyContextCreationAttempted, true);
  assert.equal(missingCanvasIdentity.payloadAssemblyContextCreationCompleted, true);
  assert.equal(missingCanvasIdentity.payloadGuardEvaluationAttempted, true);
  assert.equal(missingCanvasIdentity.payloadAssemblyGuardEvaluated, true);
  assert.equal(missingCanvasIdentity.payloadGuardEvaluationCompleted, true);
  assert.equal(missingCanvasIdentity.payloadAssemblyGuardResult, false);
  assert.equal(
    missingCanvasIdentity.payloadGuardFailureReason,
    "SURFACE_INPUT_CANVAS_MISSING"
  );
  assert.equal(missingCanvasIdentity.payloadContextHasMap, true);
  assert.equal(missingCanvasIdentity.payloadContextHasCanvas, false);
  assert.equal(missingCanvasIdentity.payloadContextHasViewport, true);
  assert.equal(missingCanvasIdentity.payloadContextHasDrawOperation, true);
  assert.equal(missingCanvasIdentity.payloadContextHasCallbacks, true);
  assert.equal(missingCanvasIdentity.handoffCreationAfterGuardAttempted, true);
  assert.equal(missingCanvasIdentity.handoffCreationAfterGuardCompleted, false);
  assert.equal(
    missingCanvasIdentity.payloadAssemblyLastCompletedStep,
    "payload guard evaluation"
  );
  assert.equal(
    missingCanvasIdentity.payloadAssemblyNextFunction,
    "handoff skipped after payload guard"
  );
  assert.equal(
    missingCanvasIdentity.payloadAssemblySkippedReason,
    "SURFACE_INPUT_CANVAS_MISSING"
  );
  assert.equal(
    missingCanvasIdentity.preparedSurfaceContinuationLastCompletedStep,
    "payload assembly entry"
  );

  const missingMapEnv = createFakeAdapterEnvironment({
    surface: {
      id: "missing-map-surface",
      canvas: {
        className: "custom-25d-map-canvas",
        style: {},
        parentNode: { dataset: { owner: "custom25DMapPane" } }
      },
      pane: { dataset: { owner: "custom25DMapPane" } }
    }
  });
  const missingMapResult =
    missingMapEnv.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const missingMapIdentity =
    missingMapEnv.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(missingMapResult.outcome, "completed");
  assert.equal(missingMapIdentity.preparedSurfaceMapReadCompleted, true);
  assert.equal(missingMapIdentity.preparedSurfaceMapPresent, false);
  assert.equal(missingMapIdentity.currentRefsLifecycleOwnerPresentAfterSurfacePreparation, true);
  assert.equal(missingMapIdentity.payloadLifecycleOwnerResolved, true);
  assert.equal(
    missingMapIdentity.payloadLifecycleOwnerResolutionSource,
    "currentRefs.lifecycleOwner"
  );
  assert.equal(missingMapIdentity.resolvedLifecycleOwnerMatchesCurrentRefs, true);
  assert.equal(missingMapIdentity.payloadAssemblyEntryCompleted, true);
  assert.equal(missingMapIdentity.payloadAssemblyContextCreationAttempted, true);
  assert.equal(missingMapIdentity.payloadAssemblyContextCreationCompleted, true);
  assert.equal(missingMapIdentity.payloadGuardEvaluationAttempted, true);
  assert.equal(missingMapIdentity.payloadAssemblyGuardEvaluated, true);
  assert.equal(missingMapIdentity.payloadGuardEvaluationCompleted, true);
  assert.equal(missingMapIdentity.payloadAssemblyGuardResult, true);
  assert.equal(missingMapIdentity.payloadContextHasMap, true);
  assert.equal(missingMapIdentity.payloadContextHasCanvas, true);
  assert.equal(missingMapIdentity.payloadContextHasViewport, true);
  assert.equal(missingMapIdentity.handoffCreationAfterGuardAttempted, true);
  assert.equal(missingMapIdentity.handoffCreationAfterGuardCompleted, true);
});

test("prepared surface continuation identifies the exact property read when a prepared surface getter fails", () => {
  const env = createFakeAdapterEnvironment({
    surface: {
      get canvas() {
        throw new Error("PREPARED_SURFACE_CANVAS_GETTER_EXPLODED");
      },
      map: { id: "surface-map" },
      pane: { dataset: { owner: "custom25DMapPane" } }
    }
  });

  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const identity = env.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(result.outcome, "failed_closed");
  assert.equal(result.reasonCode, "PREPARED_SURFACE_CANVAS_READ_EXCEPTION");
  assert.equal(
    identity.preparedSurfaceContinuationFailureFunction,
    "preparedSurface.surface.canvas read"
  );
  assert.equal(
    identity.preparedSurfaceContinuationExceptionReasonCode,
    "PREPARED_SURFACE_CANVAS_READ_EXCEPTION"
  );
  assert.equal(identity.preparedSurfaceGetterInvoked, true);
  assert.equal(identity.payloadAssemblyEntryAttempted, false);
  assert.equal(identity.payloadAssemblyContextCreationAttempted, false);
  assert.equal(identity.payloadGuardEvaluationAttempted, false);
});

test("payload lifecycle owner resolves from currentRefs when the prepared surface contract omits it, without creating a duplicate owner", () => {
  const lifecycleOwner = {
    disposeCount: 0,
    registerCount: 0,
    registerOwnedResources() {
      this.registerCount += 1;
      return {
        outcome: "registered",
        reasonCode: "OWNERSHIP_REGISTERED",
        status: { ownershipRegistered: true }
      };
    },
    disposeOwnedResources() {
      this.disposeCount += 1;
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
      return { cleanupCompleted: this.disposeCount > 0 };
    }
  };

  const env = createFakeAdapterEnvironment({ lifecycleOwner });
  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const identity = env.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(result.outcome, "completed");
  assert.equal(identity.preparedSurfaceCanvasPresent, true);
  assert.equal(identity.preparedSurfaceMapPresent, true);
  assert.equal(identity.preparedSurfaceLifecycleOwnerPresent, false);
  assert.equal(identity.currentRefsLifecycleOwnerPresentAfterSurfacePreparation, true);
  assert.equal(identity.payloadLifecycleOwnerResolved, true);
  assert.equal(
    identity.payloadLifecycleOwnerResolutionSource,
    "currentRefs.lifecycleOwner"
  );
  assert.equal(identity.payloadAssemblyEntryAttempted, true);
  assert.equal(identity.payloadAssemblyEntryCompleted, true);
  assert.equal(identity.payloadAssemblyContextCreationAttempted, true);
  assert.equal(identity.payloadGuardEvaluationAttempted, true);
  assert.equal(env.calls.lifecycleOwnerFactory, 1);
  assert.equal(lifecycleOwner.registerCount, 1);
  assert.equal(lifecycleOwner.disposeCount, 1);
});

test("post-lifecycle-owner continuation identifies payload entry marker and payload context constructor boundaries", () => {
  const markerWriteEnv = createFakeAdapterEnvironment({
    postLifecycleOwnerContinuationHooks: {
      beforePayloadEntryMarkerWrite() {
        throw new Error("PAYLOAD_ENTRY_MARKER_WRITE_EXCEPTION");
      }
    }
  });
  const markerWriteResult =
    markerWriteEnv.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const markerWriteIdentity =
    markerWriteEnv.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(markerWriteResult.outcome, "failed_closed");
  assert.equal(
    markerWriteResult.reasonCode,
    "PAYLOAD_ENTRY_MARKER_WRITE_EXCEPTION"
  );
  assert.equal(markerWriteIdentity.payloadEntryMarkerWriteAttempted, true);
  assert.equal(markerWriteIdentity.payloadEntryMarkerWriteCompleted, false);
  assert.equal(
    markerWriteIdentity.postLifecycleOwnerFailureFunction,
    "payload entry marker write"
  );
  assert.equal(
    markerWriteIdentity.postLifecycleOwnerExceptionReasonCode,
    "PAYLOAD_ENTRY_MARKER_WRITE_EXCEPTION"
  );
  assert.equal(markerWriteIdentity.payloadContextConstructorEntered, false);
  assert.equal(markerWriteIdentity.payloadGuardEvaluationAttempted, false);

  const payloadContextEnv = createFakeAdapterEnvironment({
    postLifecycleOwnerContinuationHooks: {
      beforePayloadContextConstructor() {
        throw new Error("PAYLOAD_CONTEXT_CREATION_EXCEPTION");
      }
    }
  });
  const payloadContextResult =
    payloadContextEnv.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const payloadContextIdentity =
    payloadContextEnv.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(payloadContextResult.outcome, "failed_closed");
  assert.equal(
    payloadContextResult.reasonCode,
    "PAYLOAD_CONTEXT_CREATION_EXCEPTION"
  );
  assert.equal(payloadContextIdentity.payloadEntryMarkerWriteCompleted, true);
  assert.equal(payloadContextIdentity.payloadContextConstructorSelected, true);
  assert.equal(payloadContextIdentity.payloadContextConstructorEntered, false);
  assert.equal(payloadContextIdentity.payloadContextConstructorReturned, false);
  assert.equal(
    payloadContextIdentity.payloadAssemblyFailureFunction,
    "payload context creation"
  );
  assert.equal(
    payloadContextIdentity.payloadAssemblyExceptionReasonCode,
    "PAYLOAD_CONTEXT_CREATION_EXCEPTION"
  );
  assert.equal(payloadContextIdentity.payloadGuardEvaluationAttempted, false);
});

test("post-map-read continuation identifies complex object spread and trace/status mutation boundaries before payload entry marker", () => {
  const complexSpreadEnv = createFakeAdapterEnvironment({
    postLifecycleOwnerContinuationHooks: {
      beforePayloadEntryTraceMutation() {
        throw new Error("COMPLEX_OBJECT_SPREAD_EXCEPTION");
      }
    }
  });
  const complexSpreadResult =
    complexSpreadEnv.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const complexSpreadIdentity =
    complexSpreadEnv.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(complexSpreadResult.outcome, "failed_closed");
  assert.equal(complexSpreadResult.reasonCode, "COMPLEX_OBJECT_SPREAD_EXCEPTION");
  assert.equal(complexSpreadIdentity.preparedSurfaceMapReadCompleted, true);
  assert.equal(complexSpreadIdentity.payloadEntryTraceMutationAttempted, true);
  assert.equal(complexSpreadIdentity.payloadEntryTraceMutationCompleted, false);
  assert.equal(
    complexSpreadIdentity.postMapReadFailureFunction,
    "payload entry trace mutation"
  );
  assert.equal(
    complexSpreadIdentity.postMapReadExceptionReasonCode,
    "COMPLEX_OBJECT_SPREAD_EXCEPTION"
  );
  assert.equal(complexSpreadIdentity.payloadEntryMarkerWriteAttempted, false);

  const traceMutationEnv = createFakeAdapterEnvironment({
    postLifecycleOwnerContinuationHooks: {
      beforePayloadEntryTraceMutation() {
        throw new Error("TRACE_STATUS_MUTATION_EXCEPTION");
      }
    }
  });
  const traceMutationResult =
    traceMutationEnv.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const traceMutationIdentity =
    traceMutationEnv.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(traceMutationResult.outcome, "failed_closed");
  assert.equal(traceMutationResult.reasonCode, "TRACE_STATUS_MUTATION_EXCEPTION");
  assert.equal(traceMutationIdentity.payloadEntryTraceMutationAttempted, true);
  assert.equal(traceMutationIdentity.payloadEntryTraceMutationCompleted, false);
  assert.equal(
    traceMutationIdentity.postMapReadFailureFunction,
    "payload entry trace mutation"
  );
  assert.equal(
    traceMutationIdentity.postMapReadExceptionReasonCode,
    "TRACE_STATUS_MUTATION_EXCEPTION"
  );
  assert.equal(traceMutationIdentity.payloadEntryMarkerWriteAttempted, false);
});

test("lifecycle translation gate traces operands, translation return, and lifecycleRegistered status write", () => {
  const env = createFakeAdapterEnvironment();
  const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const identity = env.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(result.outcome, "completed");
  assert.equal(identity.lifecycleRegistrationStateAssignmentAttempted, true);
  assert.equal(identity.lifecycleRegistrationStateAssignmentCompleted, true);
  assert.equal(identity.lifecycleRegistrationStateValue, true);
  assert.equal(identity.lifecycleTranslationGateEntered, true);
  assert.equal(identity.lifecycleTranslationGateOperandOneEvaluated, true);
  assert.equal(identity.lifecycleTranslationGateOperandOneValue, false);
  assert.equal(identity.lifecycleTranslationGateOperandTwoEvaluated, true);
  assert.equal(identity.lifecycleTranslationGateOperandTwoValue, false);
  assert.equal(identity.lifecycleTranslationObjectSpreadAttempted, true);
  assert.equal(identity.lifecycleTranslationObjectSpreadCompleted, true);
  assert.equal(identity.lifecycleTranslationFunctionSelected, true);
  assert.equal(identity.lifecycleTranslationFunctionEntered, true);
  assert.equal(identity.lifecycleTranslationFunctionReturned, true);
  assert.equal(identity.lifecycleTranslationResultType, "object:Object");
  assert.equal(identity.lifecycleTranslationResultStatus, "translated");
  assert.equal(identity.lifecycleRegisteredStatusWriteAttempted, true);
  assert.equal(identity.lifecycleRegisteredStatusWriteCompleted, true);
  assert.equal(identity.payloadEntryTraceMutationAttempted, true);
});

test("lifecycle translation gate isolates operand and object-spread failures", () => {
  const translationFailureEnv = createFakeAdapterEnvironment({
    translationFailure: "LIFECYCLE_TRANSLATION_FAILED_BY_TEST"
  });
  const translationFailureResult =
    translationFailureEnv.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const translationFailureIdentity =
    translationFailureEnv.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(translationFailureResult.outcome, "failed_closed");
  assert.equal(
    translationFailureResult.reasonCode,
    "LIFECYCLE_TRANSLATION_FAILED_BY_TEST"
  );
  assert.equal(translationFailureIdentity.lifecycleTranslationGateEntered, true);
  assert.equal(
    translationFailureIdentity.lifecycleTranslationGateOperandOneValue,
    true
  );
  assert.equal(
    translationFailureIdentity.lifecycleGateFailureFunction,
    "lifecycle translation gate"
  );
  assert.equal(
    translationFailureIdentity.lifecycleGateExceptionReasonCode,
    "LIFECYCLE_TRANSLATION_FAILED_BY_TEST"
  );
  assert.equal(
    translationFailureIdentity.lifecycleRegisteredStatusWriteAttempted,
    false
  );

  const objectSpreadEnv = createFakeAdapterEnvironment({
    translationFailure: "LIFECYCLE_OBJECT_SPREAD_EXCEPTION"
  });
  const objectSpreadResult =
    objectSpreadEnv.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const objectSpreadIdentity =
    objectSpreadEnv.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(objectSpreadResult.outcome, "failed_closed");
  assert.equal(
    objectSpreadIdentity.lifecycleTranslationObjectSpreadAttempted,
    true
  );
  assert.equal(
    objectSpreadIdentity.lifecycleGateObjectSpreadInvoked,
    true
  );
});

test("cyclic browser-shaped lifecycle translation returns once, captures the repeated helper chain, and keeps one cleanup owner", () => {
  const map = { id: "cyclic-map" };
  const pane = { dataset: { owner: "custom25DMapPane" } };
  const canvas = {
    className: "custom-25d-map-canvas",
    style: {},
    parentNode: pane
  };
  map.pane = pane;
  pane.canvas = canvas;
  canvas.map = map;
  map.self = map;

  const preparedSurface = {
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

  let disposeCount = 0;
  const lifecycleOwner = {
    registerOwnedResources() {
      return {
        outcome: "registered",
        reasonCode: "OWNERSHIP_REGISTERED",
        status: { ownershipRegistered: true }
      };
    },
    disposeOwnedResources() {
      disposeCount += 1;
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
      return { cleanupCompleted: disposeCount > 0 };
    }
  };

  const adapter = moduleUnderTest.createDeveloperOnlyGrowGoCustom25DLiveOneFrameAdapter({
    mapProvider: () => map,
    rawLeafletMapProvider: () => map,
    rawLeafletMapReference: map,
    leafletProvider: () => ({
      DomUtil: {
        create() {},
        setPosition() {}
      }
    }),
    devicePixelRatioProvider: () => 2,
    surfaceOperationsFactory: () => ({
      prepareOneFrameSurface() {
        return {
          outcome: "prepared",
          reasonCode: "LIVE_SURFACE_PREPARED",
          surface: preparedSurface
        };
      },
      rollbackPreparedSurface() {
        return {
          outcome: "rolled_back",
          reasonCode: "ROLLBACK_COMPLETED",
          rollbackCompleted: true,
          rollbackFailureReason: null
        };
      }
    }),
    lifecycleOwnerFactory: () => lifecycleOwner,
    frameSnapshotProvider: () => () => ({
      outcome: "snapshot_created",
      reasonCode: "FRAME_VIEWPORT_SNAPSHOT_CREATED",
      frameViewportSnapshot: createImmutableSnapshot()
    }),
    drawFunctionProvider: () => () => ({
      outcome: "drawn",
      reasonCode: "FRAME_DRAW_COMPLETED"
    }),
    drawOperationFactory: ({ drawFunctionProvider }) => ({
      drawPreparedSurfaceExactlyOnce(input) {
        const drawResult = drawFunctionProvider()(input);
        return drawResult?.outcome === "drawn"
          ? {
              outcome: "completed",
              reasonCode: "LIVE_ONE_FRAME_DRAW_COMPLETED",
              drawAttemptCount: 1,
              completedFrameCount: 1
            }
          : {
              outcome: "failed_closed",
              reasonCode: drawResult?.reasonCode ?? "DRAW_BRIDGE_FAILED",
              drawAttemptCount: 1,
              completedFrameCount: 0
            };
      }
    }),
    snapshotMapNormalizer: (value) => value
  });

  const result = adapter.executeDeveloperOnlyLiveOneFrameAdapter();
  const identity = adapter.getCustom25DOneFrameAdapterExecutionIdentity();

  assert.equal(result.outcome, "completed");
  assert.equal(identity.lifecycleTranslationFunctionEntered, true);
  assert.equal(identity.lifecycleTranslationFunctionReturned, true);
  assert.equal(identity.lifecycleTranslationResultType, "object:Object");
  assert.equal(identity.lifecycleTranslationResultStatus, "translated");
  assert.equal(identity.lifecycleTranslationTraceEntered, true);
  assert.equal(identity.lifecycleTranslationTraceExited, true);
  assert.equal(identity.lifecycleTranslationRecursionDetected, true);
  assert.equal(identity.lifecycleTranslationOverflowPrevented, true);
  assert.deepEqual(identity.lifecycleTranslationRepeatedCallChain, [
    "translatePreparedSurfaceToLifecycleBundle",
    "createResult",
    "deepFreeze",
    "deepFreeze"
  ]);
  assert.equal(identity.lifecycleRegisteredStatusWriteAttempted, true);
  assert.equal(identity.lifecycleRegisteredStatusWriteCompleted, true);
  assert.equal(identity.payloadEntryTraceMutationAttempted, true);
  assert.equal(disposeCount, 1);
});

test("post-draw-operation continuation reports exact simulated assignment, status-write, and surface-preparation boundaries", () => {
  const cases = [
    {
      label: "map assignment",
      hookName: "beforeCurrentRefsMapAssignment",
      reasonCode: "CURRENT_REFS_MAP_ASSIGNMENT_EXCEPTION",
      failureFunction: "currentRefs.map assignment"
    },
    {
      label: "lifecycle assignment",
      hookName: "beforeCurrentRefsLifecycleOwnerAssignment",
      reasonCode: "CURRENT_REFS_LIFECYCLE_ASSIGNMENT_EXCEPTION",
      failureFunction: "currentRefs.lifecycleOwner assignment"
    },
    {
      label: "draw operation assignment",
      hookName: "beforeCurrentRefsDrawOperationAssignment",
      reasonCode: "CURRENT_REFS_DRAW_OPERATION_ASSIGNMENT_EXCEPTION",
      failureFunction: "currentRefs.drawOperation assignment"
    },
    {
      label: "status write",
      hookName: "beforeSurfacePreparationInputReadyStatusWrite",
      reasonCode: "SURFACE_PREPARATION_STATUS_WRITE_EXCEPTION",
      failureFunction: "updateStatus(surfacePreparationInputReady)"
    },
    {
      label: "surface preparation entry",
      hookName: "beforePrepareOneFrameSurface",
      reasonCode: "SURFACE_PREPARATION_EXCEPTION",
      failureFunction: "adapter.prepareOneFrameSurface"
    }
  ];

  for (const testCase of cases) {
    const env = createFakeAdapterEnvironment({
      postDrawOperationContinuationHooks: {
        [testCase.hookName]() {
          throw new Error(testCase.reasonCode);
        }
      }
    });

    const result = env.adapter.executeDeveloperOnlyLiveOneFrameAdapter();
    const identity = env.adapter.getCustom25DOneFrameAdapterExecutionIdentity();

    assert.equal(result.outcome, "failed_closed", testCase.label);
    assert.equal(result.reasonCode, testCase.reasonCode, testCase.label);
    assert.equal(
      identity.postDrawOperationFailureFunction,
      testCase.failureFunction,
      testCase.label
    );
    assert.equal(
      identity.postDrawOperationExceptionReasonCode,
      testCase.reasonCode,
      testCase.label
    );
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
    /rawLeafletMapReferenceFromBridge/
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
