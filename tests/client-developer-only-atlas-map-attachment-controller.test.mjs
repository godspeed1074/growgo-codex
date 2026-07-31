import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const controllerModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-map-attachment-controller.mjs")
);
const bridgeModule = await import(
  path.join(repoRoot, "client", "developer-only-live-map-centre-atlas-bridge.mjs")
);

const controllerSource = fs.readFileSync(
  path.join(repoRoot, "client", "developer-only-atlas-map-attachment-controller.mjs"),
  "utf8"
);
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createMapStub(initialCentre = { lat: -38.12, lng: 144.61 }) {
  let centre = initialCentre;
  const listeners = new Map();
  const onCalls = [];
  const offCalls = [];

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
      onCalls.push({ eventName, handler });
      return this;
    },
    off(eventName, handler) {
      const handlers = listeners.get(eventName) ?? [];
      listeners.set(
        eventName,
        handlers.filter((candidate) => candidate !== handler)
      );
      offCalls.push({ eventName, handler });
      return this;
    },
    emit(eventName) {
      for (const handler of listeners.get(eventName) ?? []) {
        handler();
      }
    },
    listenerCount(eventName) {
      return (listeners.get(eventName) ?? []).length;
    },
    totalListenerCount() {
      return [...listeners.values()].reduce((sum, handlers) => sum + handlers.length, 0);
    },
    get onCalls() {
      return onCalls.slice();
    },
    get offCalls() {
      return offCalls.slice();
    }
  };
}

function createAuthorizedController({
  map,
  diagnosticFunction,
  atlasAdapter
}) {
  return controllerModule.createGatedDeveloperOnlyAtlasMapAttachmentController({
    getGrowGoMap: () => map,
    getAtlasDiagnosticForCurrentMapCentre: diagnosticFunction,
    atlasAdapter,
    getAuthorizationState() {
      return {
        source: "isolated-test-seam",
        mapAttachmentAllowed: true
      };
    }
  });
}

test("attach detach and status functions exist", () => {
  const controller = controllerModule.createGatedDeveloperOnlyAtlasMapAttachmentController();

  assert.equal(typeof controller.attachAtlasMapDiagnostic, "function");
  assert.equal(typeof controller.detachAtlasMapDiagnostic, "function");
  assert.equal(typeof controller.getAtlasMapAttachmentStatus, "function");
});

test("canonical real configuration denies attachment and installs zero listeners", () => {
  const map = createMapStub();
  const controller = controllerModule.createGatedDeveloperOnlyAtlasMapAttachmentController({
    getGrowGoMap: () => map
  });

  const result = controller.attachAtlasMapDiagnostic();

  assert.equal(result.outcome, "blocked");
  assert.equal(result.reasonCode, "MAP_ATTACHMENT_NOT_AUTHORIZED");
  assert.equal(result.status.attached, false);
  assert.equal(result.status.ownedListenerCount, 0);
  assert.equal(map.listenerCount("moveend"), 0);
});

test("missing map fails closed", () => {
  const controller = controllerModule.createGatedDeveloperOnlyAtlasMapAttachmentController({
    getGrowGoMap: () => null,
    getAuthorizationState() {
      return {
        source: "isolated-test-seam",
        mapAttachmentAllowed: true
      };
    }
  });

  const result = controller.attachAtlasMapDiagnostic();
  assert.equal(result.reasonCode, "LIVE_MAP_UNAVAILABLE");
  assert.equal(result.status.ownedListenerCount, 0);
});

test("isolated authorized seam installs exactly one moveend listener", () => {
  const map = createMapStub();
  const controller = createAuthorizedController({
    map,
    diagnosticFunction: () => ({ diagnosticStatus: "resolved", reasonCode: "RESOLVED" })
  });

  const result = controller.attachAtlasMapDiagnostic();
  assert.equal(result.reasonCode, "ATTACHED");
  assert.equal(result.status.listenerEventName, "moveend");
  assert.equal(result.status.ownedListenerCount, 1);
  assert.equal(map.listenerCount("moveend"), 1);
});

test("duplicate attach installs no second listener", () => {
  const map = createMapStub();
  const controller = createAuthorizedController({
    map,
    diagnosticFunction: () => ({ diagnosticStatus: "resolved", reasonCode: "RESOLVED" })
  });

  controller.attachAtlasMapDiagnostic();
  const second = controller.attachAtlasMapDiagnostic();

  assert.equal(second.reasonCode, "ALREADY_ATTACHED");
  assert.equal(second.status.ownedListenerCount, 1);
  assert.equal(map.listenerCount("moveend"), 1);
});

test("one moveend event performs one diagnostic and repeated events increase invocation count only", () => {
  const map = createMapStub();
  let diagnosticInvocationCount = 0;
  const controller = createAuthorizedController({
    map,
    diagnosticFunction: () => {
      diagnosticInvocationCount += 1;
      return { diagnosticStatus: "resolved", reasonCode: "RESOLVED" };
    }
  });

  controller.attachAtlasMapDiagnostic();
  map.emit("moveend");
  let status = controller.getAtlasMapAttachmentStatus();
  assert.equal(diagnosticInvocationCount, 1);
  assert.equal(status.diagnosticInvocationCount, 1);
  assert.equal(status.ownedListenerCount, 1);

  map.emit("moveend");
  status = controller.getAtlasMapAttachmentStatus();
  assert.equal(diagnosticInvocationCount, 2);
  assert.equal(status.diagnosticInvocationCount, 2);
  assert.equal(status.ownedListenerCount, 1);
});

test("approved coordinates resolve correctly through the existing live-map-centre diagnostic bridge", () => {
  const map = createMapStub({ lat: -38.12, lng: 144.61 });
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => map
  });
  const controller = createAuthorizedController({
    map,
    diagnosticFunction: bridge.getAtlasDiagnosticForCurrentMapCentre
  });

  controller.attachAtlasMapDiagnostic();
  map.emit("moveend");

  const status = controller.getAtlasMapAttachmentStatus();
  assert.equal(status.lastDiagnosticStatus, "resolved");
  assert.equal(status.lastReasonCode, "RESOLVED");
});

test("unsupported coordinates remain fail-closed through the existing live-map-centre diagnostic bridge", () => {
  const map = createMapStub({ lat: -38.13, lng: 144.62 });
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => map
  });
  const controller = createAuthorizedController({
    map,
    diagnosticFunction: bridge.getAtlasDiagnosticForCurrentMapCentre
  });

  controller.attachAtlasMapDiagnostic();
  map.emit("moveend");

  const status = controller.getAtlasMapAttachmentStatus();
  assert.equal(status.lastDiagnosticStatus, "blocked");
  assert.equal(status.lastReasonCode, "REGION_OUT_OF_SCOPE");
});

test("detach removes the exact owned listener and repeated detach is safe", () => {
  const map = createMapStub();
  const controller = createAuthorizedController({
    map,
    diagnosticFunction: () => ({ diagnosticStatus: "resolved", reasonCode: "RESOLVED" })
  });

  controller.attachAtlasMapDiagnostic();
  const detached = controller.detachAtlasMapDiagnostic();
  const repeated = controller.detachAtlasMapDiagnostic();

  assert.equal(detached.reasonCode, "DETACHED");
  assert.equal(detached.status.ownedListenerCount, 0);
  assert.equal(map.listenerCount("moveend"), 0);
  assert.equal(repeated.reasonCode, "ALREADY_DETACHED");
});

test("unrelated listeners remain untouched", () => {
  const map = createMapStub();
  const unrelatedListener = () => {};
  map.on("moveend", unrelatedListener);

  const controller = createAuthorizedController({
    map,
    diagnosticFunction: () => ({ diagnosticStatus: "resolved", reasonCode: "RESOLVED" })
  });

  controller.attachAtlasMapDiagnostic();
  controller.detachAtlasMapDiagnostic();

  assert.equal(map.listenerCount("moveend"), 1);
});

test("status accurately reports current controller state and canonical safety flags remain false", () => {
  const map = createMapStub();
  const controller = createAuthorizedController({
    map,
    diagnosticFunction: () => ({ diagnosticStatus: "resolved", reasonCode: "RESOLVED" })
  });

  controller.attachAtlasMapDiagnostic();
  map.emit("moveend");

  const status = controller.getAtlasMapAttachmentStatus();
  assert.equal(status.schemaId, "ATLAS_MAP_ATTACHMENT_CONTROLLER_STATUS_001");
  assert.equal(status.attached, true);
  assert.equal(status.authorizationState.attachAllowed, true);
  assert.equal(status.authorizationState.canonicalMapAttachmentAllowed, false);
  assert.equal(status.safetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.safetyFlags.mapAttachmentAllowed, false);
  assert.equal(status.safetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(status.safetyFlags.lifecycleExecutionEnabled, false);
  assert.equal(
    status.approvedDeveloperOnlyScope.regionId,
    "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION"
  );
});

test("returned results are deeply immutable", () => {
  const map = createMapStub();
  const controller = createAuthorizedController({
    map,
    diagnosticFunction: () => ({ diagnosticStatus: "resolved", reasonCode: "RESOLVED" })
  });

  const result = controller.attachAtlasMapDiagnostic();
  const status = controller.getAtlasMapAttachmentStatus();

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.status), true);
  assert.equal(Object.isFrozen(result.status.authorizationState), true);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(Object.isFrozen(status.approvedDeveloperOnlyScope), true);
});

test("controller installs developer-only interfaces without automatic startup attachment", () => {
  const globalObject = {
    GrowGoDeveloperDiagnostics: {}
  };
  const controller = controllerModule.createGatedDeveloperOnlyAtlasMapAttachmentController();

  const namespace =
    controllerModule.installGatedDeveloperOnlyAtlasMapAttachmentController({
      globalObject,
      controller
    });

  assert.equal(namespace, globalObject.GrowGoDeveloperDiagnostics);
  assert.equal(typeof namespace.attachAtlasMapDiagnostic, "function");
  assert.equal(typeof namespace.detachAtlasMapDiagnostic, "function");
  assert.equal(typeof namespace.getAtlasMapAttachmentStatus, "function");
  assert.match(
    developmentAlphaAppSource,
    /installGatedDeveloperOnlyAtlasMapAttachmentController/
  );
  assert.doesNotMatch(developmentAlphaAppSource, /attachAtlasMapDiagnostic\(\)/);
});

test("controller adds no polling interval timeout renderer overlay or non-moveend listeners", () => {
  assert.doesNotMatch(controllerSource, /setInterval\(/);
  assert.doesNotMatch(controllerSource, /setTimeout\(/);
  assert.doesNotMatch(controllerSource, /fetch\(/);
  assert.doesNotMatch(controllerSource, /XMLHttpRequest/);
  assert.doesNotMatch(controllerSource, /resize/);
  assert.doesNotMatch(controllerSource, /zoomend/);
  assert.doesNotMatch(controllerSource, /tap/);
  assert.doesNotMatch(controllerSource, /gps/i);
  assert.doesNotMatch(controllerSource, /document\.createElement/);
  assert.doesNotMatch(controllerSource, /appendChild/);
  assert.match(controllerSource, /const listenerEventName = "moveend"/);
});
