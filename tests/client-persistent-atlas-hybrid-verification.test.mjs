import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

import {
  AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION,
  createControlledPersistentAtlasAuthorization
} from "../client/developer-only-controlled-persistent-atlas-authorization.mjs";
import {
  createPersistentAtlasRealSeamComposition,
  createPersistentAtlasControllerDependenciesFromRealSeams,
  validatePersistentAtlasRealSeamComposition,
  getPersistentAtlasRealSeamCompositionStatus
} from "../client/developer-only-persistent-atlas-real-seam-composition.mjs";
import {
  createPersistentAtlasReadinessProvider,
  resolvePersistentAtlasReadiness
} from "../client/developer-only-persistent-atlas-readiness-provider.mjs";
import {
  createDiscoveredGrowGoCustom25DRendererConsumerDescriptor
} from "../client/developer-only-atlas-renderer-zero-draw-handoff.mjs";
import {
  createDeveloperOnlyLiveAtlasRendererHandoffReadiness
} from "../client/developer-only-live-atlas-renderer-handoff-readiness.mjs";
import { createDeveloperOnlyCustom25DOneFrameSurfacePreparation } from "../client/developer-only-growgo-custom25d-one-frame-surface-preparation.mjs";
import { createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner } from "../client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs";
import { createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation } from "../client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs";
import { createGrowGoCustom25DDrawMapSnapshotProvider } from "../client/growgo-custom25d-live-draw-map-snapshot.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const appSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

const ALLOWED_CLASSIFICATIONS = new Set([
  "COMPATIBLE",
  "COMPATIBLE_WITH_NARROW_NORMALIZATION",
  "COMPATIBLE_WITH_TEST_ONLY_FIXTURE",
  "BLOCKED_BY_REAL_SEAM_MISMATCH",
  "BLOCKED_BY_BROWSER_OWNERSHIP",
  "NOT_EXERCISED"
]);

const ALLOWED_RECOMMENDATIONS = new Set([
  "READY_FOR_DEVELOPER_ONLY_MANUAL_COMMAND",
  "READY_AFTER_NARROW_COMPATIBILITY_FIX",
  "BLOCKED_BY_HYBRID_SEAM_FAILURE",
  "BLOCKED_BY_CLEANUP_FAILURE",
  "BLOCKED_BY_BROWSER_OWNERSHIP_GAP"
]);

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

class FakePoint {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class FakeLatLng {
  constructor(lat, lng) {
    this.lat = lat;
    this.lng = lng;
  }
}

class FakeBounds {
  constructor(nw, se) {
    this.nw = nw;
    this.se = se;
  }

  getNorthWest() {
    return this.nw;
  }

  getSouthEast() {
    return this.se;
  }

  getNorth() {
    return this.nw.lat;
  }

  getSouth() {
    return this.se.lat;
  }

  getEast() {
    return this.se.lng;
  }

  getWest() {
    return this.nw.lng;
  }
}

function createFakeMap(id = "MAP_A") {
  return {
    id,
    getSize() {
      return new FakePoint(640, 360);
    },
    getBounds() {
      return new FakeBounds(new FakeLatLng(-38.1, 144.5), new FakeLatLng(-38.2, 144.7));
    },
    getCenter() {
      return new FakeLatLng(-38.15, 144.6);
    },
    getPixelOrigin() {
      return new FakePoint(100, 200);
    },
    getZoom() {
      return 14;
    },
    latLngToLayerPoint(latlng) {
      return new FakePoint(latlng.lng * 10, latlng.lat * -10);
    },
    on() {},
    off() {}
  };
}

function createApprovedDiagnostic() {
  return Object.freeze({
    schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "resolved",
    reasonCode: "RESOLVED",
    coordinate: Object.freeze({
      latitude: -38.12436167080344,
      longitude: 144.609432220459,
      latBucket: -38.12,
      lngBucket: 144.61
    }),
    approvedScope: Object.freeze({
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      internalDeveloperOnly: true
    }),
    resolvedRegion: Object.freeze({
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      environmentProfile: "COASTAL_EXPLORATION"
    }),
    resolvedPackage: Object.freeze({
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      packageVersion: "v001",
      packageFingerprint: "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
    }),
    resolvedRecipe: Object.freeze({
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      selectedVersion: "v001",
      confidenceScore: 100,
      fallbackApplied: false
    }),
    selectorSeed: "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0",
    safetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createBlockedDiagnostic(reasonCode = "REGION_OUT_OF_SCOPE") {
  return Object.freeze({
    schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "blocked",
    reasonCode,
    coordinate: Object.freeze({
      latitude: -38.9,
      longitude: 145.5,
      latBucket: -38.9,
      lngBucket: 145.5
    }),
    approvedScope: Object.freeze({
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      internalDeveloperOnly: true
    }),
    resolvedRegion: null,
    resolvedPackage: null,
    resolvedRecipe: null,
    safetyFlags: Object.freeze({
      runtimeExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      lifecycleExecutionEnabled: false
    })
  });
}

function createApprovedReadiness() {
  return createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre: () => createApprovedDiagnostic(),
    getRendererConsumerDescriptor: () =>
      createDiscoveredGrowGoCustom25DRendererConsumerDescriptor()
  }).getAtlasRendererHandoffReadiness();
}

function createBlockedReadiness(reasonCode = "REGION_OUT_OF_SCOPE") {
  return createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre: () => createBlockedDiagnostic(reasonCode),
    getRendererConsumerDescriptor: () =>
      createDiscoveredGrowGoCustom25DRendererConsumerDescriptor()
  }).getAtlasRendererHandoffReadiness();
}

function normalizeReadinessForPersistentWrapper(readiness) {
  if (!readiness || typeof readiness !== "object") {
    return readiness;
  }

  const approved =
    readiness.rendererHandoffStatus === "ready_for_future_renderer_attachment" &&
    readiness.rendererConsumerAvailable === true &&
    readiness.rendererIdentityValidated === true;

  if (!approved) {
    return readiness;
  }

  return Object.freeze({
    ...readiness,
    diagnosticStatus: "approved"
  });
}

function extractFunctionBody(name) {
  const marker = `function ${name}(`;
  const start = scriptSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} should exist in script.js`);
  const paramsStart = scriptSource.indexOf("(", start);
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
  assert.notEqual(paramsEnd, -1, `${name} should close parameter list`);
  const bodyStart = scriptSource.indexOf("{", paramsEnd);
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

const normalizeDevicePixelRatioBody = extractFunctionBody(
  "normalizeCustom25DDevicePixelRatio"
);
const freezeFrameViewportSnapshotBody = extractFunctionBody(
  "freezeCustom25DFrameViewportSnapshot"
);
const normalizeSnapshotForDrawBody = extractFunctionBody(
  "normalizeCustom25DFrameViewportSnapshotForDraw"
);
const describeDrawMutationTargetTypeBody = extractFunctionBody(
  "describeCustom25DDrawMutationTargetType"
);
const toDrawMutationReasonCodeBody = extractFunctionBody(
  "toCustom25DDrawMutationReasonCode"
);
const resetDrawMutationTraceBody = extractFunctionBody(
  "resetCustom25DDrawMutationTrace"
);
const updateDrawMutationTraceBody = extractFunctionBody(
  "updateCustom25DDrawMutationTrace"
);
const traceDrawMutationBody = extractFunctionBody(
  "traceCustom25DDrawMutation"
);
const applyCanvasPositionFallbackBody = extractFunctionBody(
  "applyCustom25DCanvasPositionWithLeafletFallback"
);
const drawWithSnapshotBody = extractFunctionBody(
  "drawCustom25DMapCanvasWithFrameSnapshot"
);

function createLayerRecorder() {
  const calls = [];
  return {
    calls,
    background(ctx, size, bounds) {
      calls.push({ name: "background", ctx, size, bounds });
    },
    zones(ctx, bounds, topLeft) {
      calls.push({ name: "zones", ctx, bounds, topLeft });
    },
    buildings(ctx, bounds, topLeft) {
      calls.push({ name: "buildings", ctx, bounds, topLeft });
    },
    roads(ctx, bounds, topLeft) {
      calls.push({ name: "roads", ctx, bounds, topLeft });
    },
    trees(ctx, bounds, topLeft) {
      calls.push({ name: "trees", ctx, bounds, topLeft });
    },
    landmarks(ctx, bounds) {
      calls.push({ name: "landmarks", ctx, bounds });
    }
  };
}

function compileSnapshotAwareHelpers({
  recorder,
  readonlyLeafletPosition = false
} = {}) {
  const evaluationSource = `
const CUSTOM_25D_FRAME_VIEWPORT_SNAPSHOT_SCHEMA_ID =
  "GROWGO_CUSTOM25D_FRAME_VIEWPORT_SNAPSHOT_001";
let custom25DDrawMutationTraceState = Object.freeze({
  drawMutationSequenceStarted: false,
  drawMutationSequenceCompleted: false,
  drawMutationIndex: 0,
  drawMutationFunctionName: null,
  drawMutationTargetLabel: null,
  drawMutationTargetType: null,
  drawMutationPropertyName: null,
  drawMutationValueType: null,
  drawMutationTargetFrozen: null,
  drawMutationTargetSealed: null,
  drawMutationTargetExtensible: null,
  drawMutationPropertyDescriptorPresent: null,
  drawMutationPropertyWritable: null,
  drawMutationPropertyHasSetter: null,
  drawMutationAttempted: false,
  drawMutationCompleted: false,
  drawMutationLastCompletedIndex: 0,
  drawMutationNextExpectedIndex: 1,
  drawMutationFailureFunction: null,
  drawMutationExceptionName: null,
  drawMutationExceptionMessage: null,
  drawMutationExceptionReasonCode: null
});
${normalizeDevicePixelRatioBody}
${freezeFrameViewportSnapshotBody}
${normalizeSnapshotForDrawBody}
${describeDrawMutationTargetTypeBody}
${toDrawMutationReasonCodeBody}
${resetDrawMutationTraceBody}
${updateDrawMutationTraceBody}
${traceDrawMutationBody}
${applyCanvasPositionFallbackBody}
${drawWithSnapshotBody}
module.exports = {
  drawCustom25DMapCanvasWithFrameSnapshot,
  getCustom25DDrawMutationTrace() {
    return custom25DDrawMutationTraceState;
  }
};
`;

  const context = {
    module: { exports: {} },
    exports: {},
    Object,
    Number,
    Math,
    Error,
    window: { devicePixelRatio: 2 },
    L: {
      DomUtil: {
        setPosition(canvas, point) {
          context.__lastLeafletPositionPoint = point;
          if (readonlyLeafletPosition) {
            throw new TypeError("Attempted to assign to readonly property.");
          }
          canvas.position = { x: point.x, y: point.y };
        }
      }
    },
    drawCustom25DBackground: recorder?.background ?? (() => {}),
    drawCustom25DZonesLiveCallsite: recorder?.zones ?? (() => {}),
    drawCustom25DBuildingsLiveCallsite: recorder?.buildings ?? (() => {}),
    drawCustom25DRoadsLiveCallsite: recorder?.roads ?? (() => {}),
    drawCustom25DTreesLiveCallsite: recorder?.trees ?? (() => {}),
    renderCustomLandmarkLayerLiveCallsite: recorder?.landmarks ?? (() => {})
  };

  vm.createContext(context);
  vm.runInContext(evaluationSource, context);
  return {
    helpers: context.module.exports,
    context
  };
}

function createFakeContext2D() {
  const calls = [];
  return {
    calls,
    setTransform(...args) {
      calls.push({ name: "setTransform", args });
    },
    clearRect(...args) {
      calls.push({ name: "clearRect", args });
    }
  };
}

function createFakeCanvas(context2d = createFakeContext2D()) {
  return {
    className: "custom-25d-map-canvas",
    width: 0,
    height: 0,
    position: null,
    style: {
      width: "0px",
      height: "0px",
      transform: ""
    },
    getContext(type) {
      return type === "2d" ? context2d : null;
    }
  };
}

function toFrameViewportSnapshot(snapshot) {
  const north = snapshot.projectedViewportBounds.northWestLatitude;
  const south = snapshot.projectedViewportBounds.southEastLatitude;
  const west = snapshot.projectedViewportBounds.northWestLongitude;
  const east = snapshot.projectedViewportBounds.southEastLongitude;
  const result = {
    schemaId: "GROWGO_CUSTOM25D_FRAME_VIEWPORT_SNAPSHOT_001",
    logicalWidth: snapshot.viewportWidth,
    logicalHeight: snapshot.viewportHeight,
    backingWidth: Math.round(snapshot.viewportWidth * snapshot.pixelRatio),
    backingHeight: Math.round(snapshot.viewportHeight * snapshot.pixelRatio),
    devicePixelRatio: snapshot.pixelRatio,
    bounds: Object.freeze({ north, south, east, west }),
    northWestCoordinate: Object.freeze({
      latitude: north,
      longitude: west
    }),
    canvasLayerPosition: Object.freeze({
      x: snapshot.canvasLayerPositionX,
      y: snapshot.canvasLayerPositionY
    }),
    zoom: snapshot.zoom,
    mapIdentityValidated: true,
    canvasIdentityValidated: true,
    snapshotCreated: true,
    drawRequested: false,
    listenerAdded: false,
    retentionWritten: false,
    contains([latitude, longitude]) {
      return (
        Number(latitude) <= north &&
        Number(latitude) >= south &&
        Number(longitude) <= east &&
        Number(longitude) >= west
      );
    },
    getNorthWest() {
      return { lat: north, lng: west };
    },
    getCenter() {
      return {
        lat: (north + south) / 2,
        lng: (east + west) / 2
      };
    }
  };
  return Object.freeze(result);
}

function createHybridHarness({
  readiness = createApprovedReadiness(),
  readonlyLeafletPosition = false,
  drawFailureReason = null,
  snapshotFailureReason = null
} = {}) {
  const state = {
    map: createFakeMap("MAP_A"),
    readiness,
    attached: false,
    listeners: [],
    queuedFrames: [],
    scheduleCount: 0,
    cancelCount: 0,
    cleanupCalls: [],
    surfaceReleaseTargets: [],
    referenceReleaseCount: 0,
    authorizationInvalidations: 0,
    mapIdentityReleases: 0,
    sessionIdentityReleases: 0,
    drawStateReleaseCount: 0,
    snapshotReleaseCount: 0,
    lifecycleReleaseCount: 0,
    lifecycleReferenceReleaseCount: 0,
    surfaceReferenceReleaseCount: 0,
    fakeOwnership: {
      ownedCanvasCount: 0,
      ownedPaneCount: 0,
      ownedLifecycleOwnerCount: 0,
      queuedFrameCount: 0,
      ownedListenerCount: 0,
      drawReferenceCount: 0,
      snapshotReferenceCount: 0,
      mapReferenceCount: 1,
      sessionReferenceCount: 1,
      authorizationClosed: false,
      referencesReleased: false
    },
    lastPreparedSurface: null,
    lastLifecycleTranslationResult: null,
    lastDrawTrace: null,
    lastFrameSnapshot: null,
    currentCanvas: null,
    currentPane: null,
    context2d: createFakeContext2D(),
    drawRecorder: createLayerRecorder(),
    nowTick: 0,
    lifecycleOwnerMeta: new WeakMap()
  };

  const drawRuntime = compileSnapshotAwareHelpers({
    recorder: state.drawRecorder,
    readonlyLeafletPosition
  });

  const contract = createControlledPersistentAtlasAuthorization({
    hostnameProvider: () => "127.0.0.1",
    identityProvider: () => {
      const normalizedReadiness = normalizeReadinessForPersistentWrapper(state.readiness);
      return {
        sessionId: "SESSION_A",
        mapIdentityId: "MAP_A",
        regionId:
          normalizedReadiness?.regionId ??
          normalizedReadiness?.resolvedRegion?.regionId ??
          "UNKNOWN_REGION",
        packageId:
          normalizedReadiness?.packageId ??
          normalizedReadiness?.resolvedPackage?.packageId ??
          "UNKNOWN_PACKAGE",
        packageVersion:
          normalizedReadiness?.packageVersion ??
          normalizedReadiness?.resolvedPackage?.packageVersion ??
          "UNKNOWN_VERSION",
        packageFingerprint:
          normalizedReadiness?.packageFingerprint ??
          normalizedReadiness?.resolvedPackage?.packageFingerprint ??
          "UNKNOWN_FP",
        recipeId:
          normalizedReadiness?.recipeId ??
          normalizedReadiness?.resolvedRecipe?.recipeId ??
          "UNKNOWN_RECIPE",
        recipeVersion:
          normalizedReadiness?.recipeVersion ??
          normalizedReadiness?.resolvedRecipe?.selectedVersion ??
          normalizedReadiness?.resolvedRecipe?.recipeVersion ??
          "UNKNOWN_RECIPE_VERSION",
        selectorSeed: normalizedReadiness?.selectorSeed ?? "UNKNOWN_SEED"
      };
    },
    readinessProvider: () => ({
      approved:
        state.readiness.rendererHandoffStatus === "ready_for_future_renderer_attachment" &&
        state.readiness.rendererConsumerAvailable === true &&
        state.readiness.rendererIdentityValidated === true,
      reasonCode: state.readiness.reasonCode
    }),
    controllerAttachmentStateProvider: () => ({ attached: state.attached }),
    lifecycleOwnerStateProvider: () => ({ matches: true, reasonCode: null }),
    nowProvider: () => "2026-08-06T12:00:00.000Z",
    createSessionId: () => "SESSION_A"
  });

  const seams = {
    mapBridgeProvider() {
      return {
        rawLeafletMapReference: state.map,
        mapIdentityId: state.map.id
      };
    },
    readinessBridgeProvider() {
      return normalizeReadinessForPersistentWrapper(state.readiness);
    },
    persistentAuthorizationContract: contract,
    browserFrameScheduler(callback) {
      state.scheduleCount += 1;
      state.fakeOwnership.queuedFrameCount += 1;
      state.queuedFrames.push(callback);
      return { id: `FRAME_${state.scheduleCount}` };
    },
    browserFrameCanceller() {
      state.cancelCount += 1;
      state.fakeOwnership.queuedFrameCount = 0;
    },
    listenerRegistrar(map, eventName, callback) {
      state.listeners.push({ map, eventName, callback });
      state.fakeOwnership.ownedListenerCount = state.listeners.length;
      return { eventName, callback };
    },
    listenerRemover() {
      state.listeners = [];
      state.fakeOwnership.ownedListenerCount = 0;
    },
    oneFrameSurfaceProvider() {
      const pane = {
        dataset: { owner: "custom25DMapPane" },
        childElementCount: 0
      };
      const canvas = createFakeCanvas(state.context2d);
      state.currentPane = pane;
      state.currentCanvas = canvas;
      const helper = createDeveloperOnlyCustom25DOneFrameSurfacePreparation({
        paneLookup: () => pane,
        paneCreate: () => pane,
        canvasCreate: () => canvas,
        canvasAppend: () => {
          pane.childElementCount += 1;
        },
        canvasRemove: () => {
          pane.childElementCount = Math.max(0, pane.childElementCount - 1);
        },
        mapSizeProvider: () => ({ width: 640, height: 360 }),
        mapTopLeftProvider: () => ({ x: 12, y: 34 }),
        applyCanvasSize(targetCanvas, size) {
          targetCanvas.width = size.width;
          targetCanvas.height = size.height;
          targetCanvas.style.width = `${size.width}px`;
          targetCanvas.style.height = `${size.height}px`;
        },
        applyCanvasPosition(targetCanvas, position) {
          targetCanvas.intendedPosition = { x: position.x, y: position.y };
        }
      });
      const result = helper.prepareOneFrameSurface({
        map: state.map,
        paneName: "custom25DMapPane"
      });
      const preparedSurface = Object.freeze({
        schemaId: "GROWGO_CUSTOM25D_LIVE_ONE_FRAME_SURFACE_BUNDLE_001",
        map: state.map,
        pane,
        canvas,
        paneName: result.paneName,
        canvasClassName: result.canvasClassName,
        paneReused: result.paneReused,
        paneCreated: result.paneCreated,
        paneOwnedByOperation: result.paneCreated,
        canvasOwnedByOperation: result.canvasCreated,
        canvasAppended: result.canvasAppended,
        cssWidth: result.canvasWidth,
        cssHeight: result.canvasHeight,
        backingWidth: result.canvasWidth * 2,
        backingHeight: result.canvasHeight * 2,
        devicePixelRatio: 2,
        canvasPosition: result.canvasPosition,
        cleanupRequired: result.cleanupRequired,
        rollbackAvailable: true,
        listenerAdded: result.listenerAdded,
        retentionWritten: result.retentionWritten,
        drawRequested: result.drawRequested,
        automaticInvocation: false,
        surfaceOwnerId: "SURFACE_OWNER_A"
      });
      state.lastPreparedSurface = preparedSurface;
      state.fakeOwnership.ownedCanvasCount = 1;
      state.fakeOwnership.ownedPaneCount = 1;
      state.referencesReleased = false;
      return preparedSurface;
    },
    surfaceIdentityProvider(surface) {
      return {
        surfaceOwnerId: surface.surfaceOwnerId ?? "SURFACE_OWNER_A"
      };
    },
    surfaceRemovalProvider({ target }) {
      state.surfaceReleaseTargets.push(target);
      if (target === "canvas") {
        state.currentCanvas = null;
        state.fakeOwnership.ownedCanvasCount = 0;
      }
      if (target === "pane") {
        state.currentPane = null;
        state.fakeOwnership.ownedPaneCount = 0;
      }
    },
    surfaceReferenceReleaseProvider() {
      state.surfaceReferenceReleaseCount += 1;
    },
    lifecycleOwnerProvider() {
      const owner = createDeveloperOnlyGrowGoCustom25DRendererLifecycleOwner({
        expectedPaneName: "custom25DMapPane",
        expectedRetentionSlot: "custom25DMapLayer",
        removeCanvas: () => {},
        removePaneIfEmpty: () => ({ ok: true, removed: true })
      });
      const metadata = {
        lifecycleOwnerId: "LIFECYCLE_OWNER_A",
        lifecycleGenerationId: "GEN_A",
        surfaceOwnerId: "SURFACE_OWNER_A"
      };
      state.lifecycleOwnerMeta.set(owner, metadata);
      state.fakeOwnership.ownedLifecycleOwnerCount = 1;
      return {
        lifecycleOwner: owner,
        ...metadata
      };
    },
    lifecycleTranslationProvider({ lifecycleOwner, metadata }) {
      const translator = createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation({
        expectedPaneName: "custom25DMapPane",
        expectedRetentionSlot: "custom25DMapLayer"
      });
      const translationResult = translator.translatePreparedSurfaceToLifecycleBundle({
        preparedSurface: state.lastPreparedSurface,
        lifecycleOwner
      });
      state.lastLifecycleTranslationResult = translationResult;
      return {
        lifecycleOwnerId: metadata.lifecycleOwnerId,
        lifecycleGenerationId: metadata.lifecycleGenerationId,
        surfaceOwnerId: metadata.surfaceOwnerId,
        translationStatus: translationResult.translationStatus,
        lifecycleState: translationResult.lifecycleState,
        ownershipMode: translationResult.ownershipMode,
        cleanupRequired: translationResult.cleanupRequired,
        canvasRemovalRequired: translationResult.canvasRemovalRequired,
        paneRemovalEligible: translationResult.paneRemovalEligible,
        retentionWritten: translationResult.retentionWritten,
        listenerOwned: false,
        scalarOnly: true
      };
    },
    lifecycleIdentityProvider(owner) {
      return state.lifecycleOwnerMeta.get(owner) ?? {
        lifecycleOwnerId: "LIFECYCLE_OWNER_A",
        lifecycleGenerationId: "GEN_A",
        surfaceOwnerId: "SURFACE_OWNER_A"
      };
    },
    lifecycleReleaseProvider({ lifecycleOwner } = {}) {
      state.lifecycleReleaseCount += 1;
      lifecycleOwner?.disposeOwnedResources?.();
      state.fakeOwnership.ownedLifecycleOwnerCount = 0;
    },
    lifecycleReferenceReleaseProvider() {
      state.lifecycleReferenceReleaseCount += 1;
    },
    oneFrameSnapshotProvider({ map }) {
      if (snapshotFailureReason) {
        throw Object.assign(new Error(snapshotFailureReason), {
          reasonCode: snapshotFailureReason
        });
      }
      const provider = createGrowGoCustom25DDrawMapSnapshotProvider({
        mapProvider: () => map,
        devicePixelRatioProvider: () => 2
      });
      const snapshot = provider.getDrawMapSnapshot();
      state.lastFrameSnapshot = snapshot;
      return snapshot;
    },
    snapshotReleaseProvider() {
      state.snapshotReleaseCount += 1;
      state.fakeOwnership.snapshotReferenceCount = 0;
    },
    snapshotAwareDrawProvider({ snapshot, canvas }) {
      if (drawFailureReason) {
        throw Object.assign(new Error(drawFailureReason), {
          reasonCode: drawFailureReason
        });
      }
      const frameViewportSnapshot = toFrameViewportSnapshot(snapshot);
      const result = drawRuntime.helpers.drawCustom25DMapCanvasWithFrameSnapshot({
        canvas,
        frameViewportSnapshot
      });
      state.lastDrawTrace = drawRuntime.helpers.getCustom25DDrawMutationTrace();
      return { reasonCode: result.reasonCode };
    },
    mutableDrawStateProvider({ snapshotScalars, drawGenerationId, redrawReason }) {
      state.fakeOwnership.drawReferenceCount = 1;
      return {
        drawGenerationId,
        redrawReason,
        snapshotScalars,
        canvasLayerPosition: {
          x: snapshotScalars.canvasLayerPosition.x,
          y: snapshotScalars.canvasLayerPosition.y
        }
      };
    },
    canvasPositionAdapter() {
      return { positionAdapterPath: "hybrid_pre_draw_noop" };
    },
    drawStateReleaseProvider() {
      state.drawStateReleaseCount += 1;
      state.fakeOwnership.drawReferenceCount = 0;
    },
    redrawBlockProvider() {
      state.cleanupCalls.push("redraw_block");
    },
    authorizationInvalidationProvider() {
      state.authorizationInvalidations += 1;
      state.fakeOwnership.authorizationClosed = true;
    },
    mapIdentityReleaseProvider() {
      state.mapIdentityReleases += 1;
      state.fakeOwnership.mapReferenceCount = 0;
    },
    sessionIdentityReleaseProvider() {
      state.sessionIdentityReleases += 1;
      state.fakeOwnership.sessionReferenceCount = 0;
    },
    referenceReleaseProvider() {
      state.referenceReleaseCount += 1;
      state.fakeOwnership.queuedFrameCount = 0;
      state.fakeOwnership.ownedListenerCount = 0;
      state.fakeOwnership.drawReferenceCount = 0;
      state.fakeOwnership.snapshotReferenceCount = 0;
      state.fakeOwnership.ownedCanvasCount = 0;
      state.fakeOwnership.ownedPaneCount = 0;
      state.fakeOwnership.ownedLifecycleOwnerCount = 0;
      state.fakeOwnership.mapReferenceCount = 0;
      state.fakeOwnership.sessionReferenceCount = 0;
      state.fakeOwnership.authorizationClosed = true;
      state.fakeOwnership.referencesReleased = true;
    },
    cleanupIdentitySeedProvider: () => ({ ...state.fakeOwnership }),
    timeProvider() {
      const timestamps = [
        "2026-08-06T12:00:00.000Z",
        "2026-08-06T12:00:00.010Z",
        "2026-08-06T12:00:00.020Z",
        "2026-08-06T12:00:00.030Z",
        "2026-08-06T12:00:00.040Z"
      ];
      return timestamps[Math.min(state.nowTick++, timestamps.length - 1)];
    }
  };

  return {
    state,
    contract,
    seams,
    authorize() {
      return contract.authorizePersistentAtlasSession({
        confirmation: AUTHORIZE_CONTROLLED_PERSISTENT_ATLAS_ONE_SESSION
      });
    },
    createComposition() {
      return createPersistentAtlasRealSeamComposition(seams);
    }
  };
}

function completeHybridSetup(harness) {
  harness.authorize();
  const composition = harness.createComposition();
  const validationStatus = validatePersistentAtlasRealSeamComposition(composition);
  const exported = createPersistentAtlasControllerDependenciesFromRealSeams(composition);
  const mapResult = exported.resolveMap();
  const readiness = exported.resolveReadiness();
  const authorization = exported.resolveAuthorization();
  const identity = exported.createIdentitySnapshot();
  exported.consumeAttachPermission();
  harness.state.attached = true;
  const surface = exported.acquireSurface();
  const lifecycle = exported.acquireLifecycleOwner();
  return {
    composition,
    exported,
    validationStatus,
    mapResult,
    readiness,
    authorization,
    identity,
    surface,
    lifecycle
  };
}

const compatibilityMatrix = Object.freeze([
  {
    seam: "map_bridge_and_identity",
    wrapper: "createPersistentAtlasMapProvider",
    source: "existing frozen bridge/raw Leaflet map path",
    boundary: "rawLeafletMapReference -> stable identity -> replacement detection",
    mode: "real+fake-owned map object",
    classification: "COMPATIBLE"
  },
  {
    seam: "readiness_identity_normalization",
    wrapper: "createPersistentAtlasReadinessProvider + createPersistentAtlasIdentitySnapshotProvider",
    source: "validateAtlasRendererZeroDrawHandoff",
    boundary: "approved/blocked readiness -> frozen persistent identity snapshot",
    mode: "real passive readiness",
    classification: "COMPATIBLE"
  },
  {
    seam: "lifecycle_translation",
    wrapper: "createPersistentAtlasLifecycleOwnerProvider",
    source: "createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation",
    boundary: "prepared-surface bundle -> scalar-only lifecycle translation",
    mode: "real passive translation with narrow scalar normalization",
    classification: "COMPATIBLE_WITH_NARROW_NORMALIZATION"
  },
  {
    seam: "snapshot_creation",
    wrapper: "createPersistentAtlasFrameSnapshotProvider",
    source: "createGrowGoCustom25DDrawMapSnapshotProvider",
    boundary: "Leaflet-shaped map reads -> immutable scalar snapshot",
    mode: "real passive snapshot logic",
    classification: "COMPATIBLE"
  },
  {
    seam: "snapshot_aware_draw",
    wrapper: "createPersistentAtlasFrameDrawProvider",
    source: "script.js drawCustom25DMapCanvasWithFrameSnapshot",
    boundary: "persistent snapshot -> test-only frame snapshot adapter -> fake Canvas draw",
    mode: "real draw logic with fake Canvas/context",
    classification: "COMPATIBLE_WITH_TEST_ONLY_FIXTURE"
  },
  {
    seam: "browser_ownership",
    wrapper: "persistent composition ownership boundaries",
    source: "fake pane/canvas/listener/frame scheduler seams",
    boundary: "DOM/listeners/window/startup all disconnected",
    mode: "fake/disconnected",
    classification: "BLOCKED_BY_BROWSER_OWNERSHIP"
  }
]);

const overallRecommendation = "READY_FOR_DEVELOPER_ONLY_MANUAL_COMMAND";

test("1. approved real readiness is compatible and creates a frozen persistent identity", () => {
  const harness = createHybridHarness();
  const { readiness, identity, validationStatus, composition } = completeHybridSetup(harness);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);

  assert.equal(readiness.reasonCode, "RESOLVED");
  assert.equal(identity.regionId, readiness.regionId);
  assert.equal(identity.packageFingerprint, readiness.packageFingerprint);
  assert.equal(identity.recipeVersion, readiness.recipeVersion);
  assert.equal(validationStatus.compositionValid, true);
  assert.equal(Object.isFrozen(identity), true);
  assert.doesNotThrow(() => JSON.stringify(identity));
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("2. blocked readiness preserves the exact blocked reason and composition remains disconnected", () => {
  const readinessProvider = createPersistentAtlasReadinessProvider({
    handoffReadinessProvider: () => createBlockedReadiness("REGION_OUT_OF_SCOPE")
  });

  assert.throws(
    () => resolvePersistentAtlasReadiness(readinessProvider),
    (error) => error.reasonCode === "REGION_OUT_OF_SCOPE"
  );

  const harness = createHybridHarness({
    readiness: createBlockedReadiness("REGION_OUT_OF_SCOPE")
  });
  const composition = harness.createComposition();
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);
  assert.equal(status.realListenerRegistered, false);
  assert.equal(status.realFrameScheduled, false);
  assert.equal(harness.state.listeners.length, 0);
  assert.equal(harness.state.queuedFrames.length, 0);
});

test("3. stable map identity stays compatible and replacement fails closed", () => {
  const harness = createHybridHarness();
  const { exported, identity } = completeHybridSetup(harness);

  const first = exported.resolveMap();
  const second = exported.resolveMap();
  assert.equal(first.mapIdentityId, second.mapIdentityId);
  assert.equal(first.mapIdentityId, identity.mapIdentityId);

  harness.state.map = createFakeMap("MAP_B");
  assert.throws(
    () => exported.resolveMap(),
    (error) =>
      error.reasonCode === "STALE_MAP_REFERENCE" ||
      error.reasonCode === "MAP_IDENTITY_CHANGED"
  );
});

test("4. readiness drift detects exact package fingerprint mismatch", () => {
  const harness = createHybridHarness();
  const { exported } = completeHybridSetup(harness);
  exported.createSnapshot({ redrawReason: "initial_attach" });
  harness.state.readiness = Object.freeze({
    ...createApprovedReadiness(),
    resolvedPackage: Object.freeze({
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      packageVersion: "v001",
      packageFingerprint: "DIFFERENT_FINGERPRINT"
    })
  });
  exported.resolveReadiness();

  assert.throws(
    () => exported.validateRedrawAuthorization(),
    (error) => error.reasonCode === "READINESS_IDENTITY_MISMATCH"
  );
});

test("5. lifecycle translation uses the real cycle-safe translator and remains scalar-only", () => {
  const harness = createHybridHarness();
  const { lifecycle } = completeHybridSetup(harness);
  const translation = harness.state.lastLifecycleTranslationResult;

  assert.equal(lifecycle.lifecycleOwnerId, "LIFECYCLE_OWNER_A");
  assert.equal(translation.translationStatus, "translated");
  assert.equal(translation.lifecycleBundleSnapshot.listenerOwned, false);
  assert.equal(translation.lifecycleBundleSnapshot.retentionWritten, false);
  assert.doesNotThrow(() => JSON.stringify(translation.lifecycleBundleSnapshot));
  assert.equal(
    Object.prototype.hasOwnProperty.call(translation.lifecycleBundleSnapshot, "map"),
    false
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(translation.lifecycleBundleSnapshot, "canvas"),
    false
  );
});

test("6. fresh real-shaped snapshots are immutable serializable and expose no raw map reference", () => {
  const harness = createHybridHarness();
  const { exported } = completeHybridSetup(harness);
  const first = exported.createSnapshot({ redrawReason: "initial_attach" });
  const second = exported.createSnapshot({ redrawReason: "moveend" });
  const snapshotStatus = getPersistentAtlasRealSeamCompositionStatus(harness.createComposition?.composition ?? undefined);

  assert.notEqual(first.snapshotGenerationId, second.snapshotGenerationId);
  assert.notEqual(first.snapshotId, second.snapshotId);
  assert.equal(Object.isFrozen(harness.state.lastFrameSnapshot), true);
  assert.doesNotThrow(() => JSON.stringify(harness.state.lastFrameSnapshot));
  assert.equal("map" in harness.state.lastFrameSnapshot, false);
  assert.equal(harness.state.lastFrameSnapshot.snapshotStatus, "ready");
  assert.equal(harness.state.lastFrameSnapshot.reasonCode, "DRAW_MAP_SNAPSHOT_READY");
  void snapshotStatus;
});

test("7. sequential fake-Canvas draw succeeds, reuses one Canvas, and does not mutate the frozen snapshot", () => {
  const harness = createHybridHarness();
  const { exported } = completeHybridSetup(harness);
  const firstSnapshot = exported.createSnapshot({ redrawReason: "initial_attach" });
  const snapshotBefore = JSON.stringify(firstSnapshot);
  const firstDraw = exported.drawFrame({ drawGenerationId: "DRAW_GEN_001" });
  const sameCanvas = harness.state.currentCanvas;
  const secondSnapshot = exported.createSnapshot({ redrawReason: "moveend" });
  const secondDraw = exported.drawFrame({ drawGenerationId: "DRAW_GEN_002" });

  assert.equal(firstDraw.drawCompleted, true);
  assert.equal(secondDraw.drawCompleted, true);
  assert.equal(firstDraw.drawReason, "initial_attach");
  assert.equal(secondDraw.drawReason, "moveend");
  assert.equal(harness.state.currentCanvas, sameCanvas);
  assert.equal(harness.state.currentCanvas.width > 0, true);
  assert.equal(harness.state.currentCanvas.style.width, "640px");
  assert.equal(harness.state.currentCanvas.style.height, "360px");
  assert.equal(JSON.stringify(firstSnapshot), snapshotBefore);
  const composed = completeHybridSetup;
  void composed;
});

test("8. readonly Leaflet position fallback succeeds and preserves the frozen snapshot", () => {
  const harness = createHybridHarness({ readonlyLeafletPosition: true });
  const { exported } = completeHybridSetup(harness);
  const snapshot = exported.createSnapshot({ redrawReason: "initial_attach" });
  const before = JSON.stringify(snapshot);
  const draw = exported.drawFrame({ drawGenerationId: "DRAW_GEN_001" });
  const trace = harness.state.lastDrawTrace;

  assert.equal(draw.drawCompleted, true);
  assert.equal(trace?.drawMutationFailureFunction ?? null, null);
  assert.equal(harness.state.currentCanvas.width > 0, true);
  assert.equal(harness.state.currentCanvas.position ?? null, null);
  assert.equal(JSON.stringify(snapshot), before);
});

test("9. snapshot failure hands the originating reason to cleanup and ends with zero fake ownership", () => {
  const harness = createHybridHarness({
    snapshotFailureReason: "HYBRID_SNAPSHOT_FAILURE"
  });
  const { exported } = completeHybridSetup(harness);

  assert.throws(
    () => exported.createSnapshot({ redrawReason: "initial_attach" }),
    (error) => error.reasonCode === "HYBRID_SNAPSHOT_FAILURE"
  );

  const prepared = exported.prepareCleanup({
    cleanupMode: "redraw_failure",
    originatingFailureReason: "HYBRID_SNAPSHOT_FAILURE"
  });
  const completed = exported.executeCleanup();

  assert.equal(prepared.originatingFailureReason, "HYBRID_SNAPSHOT_FAILURE");
  assert.equal(completed.cleanupComplete, true);
  assert.equal(completed.cleanupFailureReasons.length, 0);
  assert.equal(harness.state.fakeOwnership.ownedCanvasCount, 0);
  assert.equal(harness.state.fakeOwnership.ownedPaneCount, 0);
  assert.equal(harness.state.fakeOwnership.ownedLifecycleOwnerCount, 0);
  assert.equal(harness.state.fakeOwnership.referencesReleased, true);
});

test("10. draw failure hands off separately from cleanup failure tracking", () => {
  const harness = createHybridHarness({
    drawFailureReason: "HYBRID_DRAW_FAILURE"
  });
  const { exported } = completeHybridSetup(harness);
  exported.createSnapshot({ redrawReason: "initial_attach" });

  assert.throws(
    () => exported.drawFrame({ drawGenerationId: "DRAW_GEN_001" }),
    (error) => error.reasonCode === "HYBRID_DRAW_FAILURE"
  );

  const prepared = exported.prepareCleanup({
    cleanupMode: "redraw_failure",
    originatingFailureReason: "HYBRID_DRAW_FAILURE"
  });
  const completed = exported.executeCleanup();

  assert.equal(prepared.originatingFailureReason, "HYBRID_DRAW_FAILURE");
  assert.equal(completed.originatingFailureReason, "HYBRID_DRAW_FAILURE");
  assert.deepEqual(completed.cleanupFailureReasons, []);
  assert.equal(completed.cleanupComplete, true);
});

test("11. runtime identity, status immutability, no raw references, and no startup wiring changes remain protected", () => {
  const translator = createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation({
    expectedPaneName: "custom25DMapPane",
    expectedRetentionSlot: "custom25DMapLayer"
  });
  const runtimeIdentity =
    translator.getCustom25DOneFrameLifecycleTranslationRuntimeIdentity();

  assert.equal(runtimeIdentity.translationVersionTag, "atlas21150al");
  assert.equal(runtimeIdentity.cycleSafeDeepFreezeInstalled, true);
  assert.equal(runtimeIdentity.weakSetCycleProtectionInstalled, true);
  assert.match(indexSource, /<script src="script\.js\?v=atlas21150an"><\/script>/);
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs\?v=atlas21150am"><\/script>/
  );
  assert.match(
    appSource,
    /from "\.\/developer-only-growgo-custom25d-live-one-frame-adapter\.mjs\?v=atlas21150am"/
  );
  assert.doesNotMatch(appSource, /developer-only-controlled-persistent-atlas-live-adapter/);
  assert.doesNotMatch(scriptSource, /authorizePersistentAtlasSession|attachPersistentAtlasRenderer/);
  assert.equal(Object.isFrozen(compatibilityMatrix), true);
  for (const row of compatibilityMatrix) {
    assert.equal(ALLOWED_CLASSIFICATIONS.has(row.classification), true);
  }
});

test("12. overall recommendation uses one allowed value and all four canonical safety flags remain false", () => {
  assert.equal(ALLOWED_RECOMMENDATIONS.has(overallRecommendation), true);
  for (const row of compatibilityMatrix) {
    assert.equal(typeof row.wrapper, "string");
    assert.equal(typeof row.source, "string");
  }

  const harness = createHybridHarness();
  const { composition } = completeHybridSetup(harness);
  const status = getPersistentAtlasRealSeamCompositionStatus(composition);

  assertCanonicalFlags(status.canonicalSafetyFlags);
  assert.equal(status.realListenerRegistered, false);
  assert.equal(status.realFrameScheduled, false);
  assert.equal(status.realRendererInvoked, false);
  assert.equal(status.realWindowExposureAdded ?? false, false);
  assert.equal(typeof harness.state.currentCanvas?.getContext, "function");
});
