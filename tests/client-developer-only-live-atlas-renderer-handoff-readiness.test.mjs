import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const readinessModule = await import(
  path.join(repoRoot, "client", "developer-only-live-atlas-renderer-handoff-readiness.mjs")
);
const handoffModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-renderer-zero-draw-handoff.mjs")
);
const authorizationModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-map-attachment-authorization.mjs")
);
const controllerModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-map-attachment-controller.mjs")
);
const bridgeModule = await import(
  path.join(repoRoot, "client", "developer-only-live-map-centre-atlas-bridge.mjs")
);

const readinessSource = fs.readFileSync(
  path.join(repoRoot, "client", "developer-only-live-atlas-renderer-handoff-readiness.mjs"),
  "utf8"
);
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createMapStub(initialCentre = { lat: -38.12436167080344, lng: 144.609432220459 }) {
  let centre = initialCentre;
  const listeners = new Map();

  return {
    getCenter() {
      return centre;
    },
    setCenter(nextCentre) {
      centre = nextCentre;
    },
    on(eventName, handler) {
      const handlers = listeners.get(eventName) ?? [];
      handlers.push(handler);
      listeners.set(eventName, handlers);
      return this;
    },
    off(eventName, handler) {
      const handlers = listeners.get(eventName) ?? [];
      listeners.set(
        eventName,
        handlers.filter((candidate) => candidate !== handler)
      );
      return this;
    },
    emit(eventName) {
      for (const handler of listeners.get(eventName) ?? []) {
        handler();
      }
    },
    listenerCount(eventName) {
      return (listeners.get(eventName) ?? []).length;
    }
  };
}

function buildIntegratedNamespace({ mapPresent = true, centre, rendererDescriptor } = {}) {
  const map = mapPresent ? createMapStub(centre) : null;
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => map
  });
  const authorization =
    authorizationModule.createControlledOneSessionDeveloperMapAttachmentAuthorization({
      getHostname: () => "localhost",
      getSafetyFlags() {
        return bridge.getSafetyFlags();
      }
    });
  const controller = controllerModule.createGatedDeveloperOnlyAtlasMapAttachmentController({
    getGrowGoMap: () => map,
    runAtlasDiagnostic: bridge.getAtlasDiagnosticForCurrentMapCentre,
    getAuthorizationState() {
      return authorization.readAttachmentAuthorizationStateForController();
    }
  });
  const readiness = readinessModule.createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre: bridge.getAtlasDiagnosticForCurrentMapCentre,
    getRendererConsumerDescriptor:
      rendererDescriptor ??
      (() => handoffModule.createDiscoveredGrowGoCustom25DRendererConsumerDescriptor())
  });

  const globalObject = {
    GrowGoDeveloperDiagnostics: {}
  };

  controllerModule.installGatedDeveloperOnlyAtlasMapAttachmentController({
    globalObject,
    controller
  });
  authorizationModule.installControlledOneSessionDeveloperMapAttachmentAuthorization({
    globalObject,
    authorization,
    controller
  });
  readinessModule.installDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    globalObject,
    readiness
  });

  return {
    map,
    bridge,
    controller,
    authorization,
    diagnostics: globalObject.GrowGoDeveloperDiagnostics
  };
}

test("browser interface exists and is explicit-only", () => {
  const { diagnostics } = buildIntegratedNamespace();

  assert.equal(typeof diagnostics.getAtlasRendererHandoffReadiness, "function");
  assert.doesNotMatch(readinessSource, /addEventListener/);
  assert.doesNotMatch(readinessSource, /\.on\(/);
  assert.doesNotMatch(readinessSource, /setInterval\(/);
  assert.doesNotMatch(readinessSource, /setTimeout\(/);
});

test("approved Bellarine centre resolves successfully with preserved identities and zero-draw safety", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const result = diagnostics.getAtlasRendererHandoffReadiness();

  assert.equal(
    result.schemaId,
    "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001"
  );
  assert.equal(result.diagnosticStatus, "resolved");
  assert.equal(result.reasonCode, "RESOLVED");
  assert.equal(
    result.resolvedRegion.regionId,
    "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
  );
  assert.equal(
    result.resolvedPackage.packageId,
    "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001"
  );
  assert.equal(result.resolvedPackage.packageVersion, "v001");
  assert.equal(
    result.resolvedPackage.packageFingerprint,
    "94c447ae7b3c888b3df618ad2f1f45cf3ea9e7d0282cd49c2d56ed94fff06aed"
  );
  assert.equal(result.resolvedRecipe.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(result.resolvedRecipe.selectedVersion, "v001");
  assert.equal(
    result.selectorSeed,
    "baf38e127eee1e320570e2f02fc889cd1aaec4b9dfd7bee85bba4f10f30b6da0"
  );
  assert.equal(
    result.rendererHandoffStatus,
    "ready_for_future_renderer_attachment"
  );
  assert.equal(result.rendererConsumerAvailable, true);
  assert.equal(result.rendererIdentityValidated, true);
  assert.equal(result.rendererInitializationRequested, false);
  assert.equal(result.rendererAttached, false);
  assert.equal(result.drawRequested, false);
  assert.equal(result.canvasCreated, false);
  assert.equal(result.webglContextCreated, false);
  assert.equal(result.overlayCreated, false);
  assert.equal(result.listenerAdded, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(result.automaticInvocation, false);
  assert.equal(result.safetyFlagSnapshot.runtimeExecutionEnabled, false);
  assert.equal(result.safetyFlagSnapshot.mapAttachmentAllowed, false);
  assert.equal(result.safetyFlagSnapshot.automaticRendererExecutionAllowed, false);
  assert.equal(result.safetyFlagSnapshot.lifecycleExecutionEnabled, false);
});

test("blocked cases fail closed precisely", () => {
  const outOfScope = buildIntegratedNamespace({
    centre: { lat: -38.9, lng: 145.5 }
  }).diagnostics.getAtlasRendererHandoffReadiness();
  const missingMap = buildIntegratedNamespace({
    mapPresent: false
  }).diagnostics.getAtlasRendererHandoffReadiness();
  const invalidDiagnostic = readinessModule.createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre() {
      return Object.freeze({
        schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
        diagnosticStatus: "resolved",
        reasonCode: "RESOLVED",
        coordinate: Object.freeze({
          latitude: -38.12,
          longitude: 144.61,
          latBucket: -38.12,
          lngBucket: 144.61
        }),
        resolvedRegion: Object.freeze({
          regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
        }),
        resolvedPackage: null,
        resolvedRecipe: null,
        selectorSeed: null,
        safetyFlags: Object.freeze({
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false,
          lifecycleExecutionEnabled: false
        })
      });
    },
    getRendererConsumerDescriptor() {
      return handoffModule.createDiscoveredGrowGoCustom25DRendererConsumerDescriptor();
    }
  }).getAtlasRendererHandoffReadiness();
  const rendererUnavailable = readinessModule.createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre() {
      return bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
        getGrowGoMap: () => createMapStub()
      }).getAtlasDiagnosticForCurrentMapCentre();
    },
    getRendererConsumerDescriptor() {
      return null;
    }
  }).getAtlasRendererHandoffReadiness();
  const identityMismatch = readinessModule.createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre() {
      return bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
        getGrowGoMap: () => createMapStub()
      }).getAtlasDiagnosticForCurrentMapCentre();
    },
    getRendererConsumerDescriptor() {
      return handoffModule.createDiscoveredGrowGoCustom25DRendererConsumerDescriptor();
    }
  });
  const identityMismatchResult = readinessModule.createDeveloperOnlyLiveAtlasRendererHandoffReadiness({
    getAtlasDiagnosticForCurrentMapCentre() {
      return bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
        getGrowGoMap: () => createMapStub()
      }).getAtlasDiagnosticForCurrentMapCentre();
    },
    getRendererConsumerDescriptor() {
      return {
        ...handoffModule.createDiscoveredGrowGoCustom25DRendererConsumerDescriptor(),
        drawEntryPoint: "drawSomethingElse"
      };
    }
  }).getAtlasRendererHandoffReadiness();

  assert.equal(outOfScope.diagnosticStatus, "blocked");
  assert.equal(outOfScope.reasonCode, "REGION_OUT_OF_SCOPE");
  assert.equal(outOfScope.rendererHandoffStatus, "blocked");
  assert.equal(missingMap.reasonCode, "LIVE_MAP_UNAVAILABLE");
  assert.equal(missingMap.rendererHandoffStatus, "blocked");
  assert.equal(invalidDiagnostic.reasonCode, "RESOLVED");
  assert.equal(invalidDiagnostic.rendererHandoff.reasonCode, "INVALID_DIAGNOSTIC");
  assert.equal(rendererUnavailable.rendererHandoff.reasonCode, "RENDERER_CONSUMER_UNAVAILABLE");
  assert.equal(identityMismatchResult.rendererHandoff.reasonCode, "RENDERER_IDENTITY_MISMATCH");
  void identityMismatch;
});

test("repeated calls are safe deeply immutable and do not change attachment counters or authorization state", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const authBefore = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const attachBefore = diagnostics.getAtlasMapAttachmentStatus();
  const first = diagnostics.getAtlasRendererHandoffReadiness();
  const second = diagnostics.getAtlasRendererHandoffReadiness();
  const authAfter = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const attachAfter = diagnostics.getAtlasMapAttachmentStatus();

  assert.equal(first.diagnosticStatus, second.diagnosticStatus);
  assert.equal(first.reasonCode, second.reasonCode);
  assert.notEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(second), true);
  assert.equal(authBefore.authorizationActive, authAfter.authorizationActive);
  assert.equal(authBefore.sessionId, authAfter.sessionId);
  assert.equal(attachBefore.ownedListenerCount, attachAfter.ownedListenerCount);
  assert.equal(
    attachBefore.diagnosticInvocationCount,
    attachAfter.diagnosticInvocationCount
  );
});

test("no renderer initialization draw canvas webgl overlay listener timer network or startup invocation occurs", () => {
  const calls = {
    initialize: 0,
    drawFrame: 0,
    createCanvas: 0,
    createWebGLContext: 0,
    createOverlay: 0,
    addListener: 0,
    timer: 0,
    network: 0,
    download: 0
  };

  const { diagnostics, map } = buildIntegratedNamespace({
    rendererDescriptor: () =>
      Object.freeze({
        ...handoffModule.createDiscoveredGrowGoCustom25DRendererConsumerDescriptor(),
        initialize() {
          calls.initialize += 1;
        },
        drawFrame() {
          calls.drawFrame += 1;
        },
        createCanvas() {
          calls.createCanvas += 1;
        },
        createWebGLContext() {
          calls.createWebGLContext += 1;
        },
        createOverlay() {
          calls.createOverlay += 1;
        },
        addListener() {
          calls.addListener += 1;
        },
        startTimer() {
          calls.timer += 1;
        },
        requestNetwork() {
          calls.network += 1;
        },
        downloadAssets() {
          calls.download += 1;
        }
      })
  });

  const listenerCountBefore = map.listenerCount("moveend");
  const result = diagnostics.getAtlasRendererHandoffReadiness();
  const listenerCountAfter = map.listenerCount("moveend");

  assert.equal(result.rendererInitializationRequested, false);
  assert.equal(result.drawRequested, false);
  assert.equal(result.canvasCreated, false);
  assert.equal(result.webglContextCreated, false);
  assert.equal(result.overlayCreated, false);
  assert.equal(result.networkRequested, false);
  assert.equal(result.assetDownloadRequested, false);
  assert.equal(listenerCountBefore, listenerCountAfter);
  assert.deepEqual(calls, {
    initialize: 0,
    drawFrame: 0,
    createCanvas: 0,
    createWebGLContext: 0,
    createOverlay: 0,
    addListener: 0,
    timer: 0,
    network: 0,
    download: 0
  });
  assert.match(
    developmentAlphaAppSource,
    /installDeveloperOnlyLiveAtlasRendererHandoffReadiness/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /window\.GrowGoDeveloperDiagnostics\.getAtlasRendererHandoffReadiness\(\)/
  );
  assert.doesNotMatch(readinessSource, /fetch\(/);
  assert.doesNotMatch(readinessSource, /XMLHttpRequest/);
  assert.doesNotMatch(readinessSource, /setInterval\(/);
  assert.doesNotMatch(readinessSource, /setTimeout\(/);
  assert.doesNotMatch(readinessSource, /createElement/);
  assert.doesNotMatch(readinessSource, /appendChild/);
});
