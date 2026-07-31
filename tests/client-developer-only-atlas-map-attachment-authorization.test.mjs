import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const authorizationModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-map-attachment-authorization.mjs")
);
const controllerModule = await import(
  path.join(repoRoot, "client", "developer-only-atlas-map-attachment-controller.mjs")
);
const bridgeModule = await import(
  path.join(repoRoot, "client", "developer-only-live-map-centre-atlas-bridge.mjs")
);

const authorizationSource = fs.readFileSync(
  path.join(repoRoot, "client", "developer-only-atlas-map-attachment-authorization.mjs"),
  "utf8"
);
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);

function createMapStub(initialCentre = { lat: -38.12, lng: 144.61 }) {
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

function buildIntegratedNamespace({ hostname = "localhost", centre = { lat: -38.12, lng: 144.61 } } = {}) {
  const map = createMapStub(centre);
  const bridge = bridgeModule.createDeveloperOnlyLiveMapCentreAtlasBridge({
    getGrowGoMap: () => map
  });
  let controllerRef = null;
  const authorization =
    authorizationModule.createControlledOneSessionDeveloperMapAttachmentAuthorization({
      getHostname: () => hostname,
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
  controllerRef = controller;

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

  return {
    map,
    bridge,
    authorization,
    controller,
    diagnostics: globalObject.GrowGoDeveloperDiagnostics
  };
}

test("interfaces exist", () => {
  const { diagnostics } = buildIntegratedNamespace();

  assert.equal(typeof diagnostics.authorizeAtlasMapAttachmentSession, "function");
  assert.equal(typeof diagnostics.revokeAtlasMapAttachmentSession, "function");
  assert.equal(typeof diagnostics.getAtlasMapAttachmentAuthorizationStatus, "function");
});

test("default state is unauthorized with no effective permission no attachment and zero listeners", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const authStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const attachStatus = diagnostics.getAtlasMapAttachmentStatus();

  assert.equal(authStatus.authorizationActive, false);
  assert.equal(authStatus.effectiveMapAttachmentAllowed, false);
  assert.equal(attachStatus.attached, false);
  assert.equal(attachStatus.ownedListenerCount, 0);
  assert.equal(attachStatus.diagnosticInvocationCount, 0);
});

test("incorrect confirmation blocked and missing confirmation blocked", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const missing = diagnostics.authorizeAtlasMapAttachmentSession();
  const incorrect = diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "WRONG"
  });

  assert.equal(missing.reasonCode, "MISSING_CONFIRMATION");
  assert.equal(incorrect.reasonCode, "INVALID_CONFIRMATION");
});

test("non-local host blocked", () => {
  const { diagnostics } = buildIntegratedNamespace({
    hostname: "growgo.example.com"
  });

  const result = diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });

  assert.equal(result.reasonCode, "LOCAL_DEVELOPMENT_HOST_REQUIRED");
});

test("exact local confirmation accepted and authorization status is immutable", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const result = diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  const status = diagnostics.getAtlasMapAttachmentAuthorizationStatus();

  assert.equal(result.outcome, "authorized");
  assert.equal(status.authorizationActive, true);
  assert.equal(status.authorizationSource, "developer-one-session-local");
  assert.equal(status.localDevelopmentHost, true);
  assert.equal(status.confirmationAccepted, true);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(status), true);
});

test("no canonical flag mutation and no persistent storage", () => {
  const { diagnostics } = buildIntegratedNamespace();

  diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });

  const authStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const attachStatus = diagnostics.getAtlasMapAttachmentStatus();

  assert.equal(authStatus.canonicalMapAttachmentAllowed, false);
  assert.equal(authStatus.storageUsed, false);
  assert.equal(authStatus.safetyFlags.runtimeExecutionEnabled, false);
  assert.equal(authStatus.safetyFlags.mapAttachmentAllowed, false);
  assert.equal(authStatus.safetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(authStatus.safetyFlags.lifecycleExecutionEnabled, false);
  assert.equal(attachStatus.safetyFlags.mapAttachmentAllowed, false);
});

test("one active session only and exactly one successful attachment consumption", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const first = diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  const second = diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  const attached = diagnostics.attachAtlasMapDiagnostic();
  const authStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();

  assert.equal(first.reasonCode, "AUTHORIZED_ONE_SESSION");
  assert.equal(second.reasonCode, "ALREADY_AUTHORIZED");
  assert.equal(attached.reasonCode, "ATTACHED");
  assert.equal(authStatus.successfulAttachmentConsumed, true);
});

test("authorized state gives effective permission true and installs exactly one moveend listener", () => {
  const { diagnostics, map } = buildIntegratedNamespace();

  diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  const attachResult = diagnostics.attachAtlasMapDiagnostic();
  const authStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();

  assert.equal(authStatus.authorizationSource, "developer-one-session-local");
  assert.equal(authStatus.canonicalMapAttachmentAllowed, false);
  assert.equal(authStatus.effectiveMapAttachmentAllowed, true);
  assert.equal(attachResult.status.listenerEventName, "moveend");
  assert.equal(attachResult.status.ownedListenerCount, 1);
  assert.equal(map.listenerCount("moveend"), 1);
});

test("duplicate attach installs no second listener and moveend uses existing bridge", () => {
  const { diagnostics, map } = buildIntegratedNamespace();

  diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  diagnostics.attachAtlasMapDiagnostic();
  const duplicate = diagnostics.attachAtlasMapDiagnostic();
  map.emit("moveend");
  map.emit("moveend");

  const attachStatus = diagnostics.getAtlasMapAttachmentStatus();
  assert.equal(duplicate.reasonCode, "ALREADY_ATTACHED");
  assert.equal(attachStatus.ownedListenerCount, 1);
  assert.equal(attachStatus.diagnosticInvocationCount, 2);
  assert.equal(attachStatus.lastDiagnosticStatus, "resolved");
  assert.equal(attachStatus.lastReasonCode, "RESOLVED");
});

test("detach removes listener automatically revokes authorization and reattach is blocked", () => {
  const { diagnostics, map } = buildIntegratedNamespace();

  diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  diagnostics.attachAtlasMapDiagnostic();
  const detached = diagnostics.detachAtlasMapDiagnostic();
  const authStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const reattach = diagnostics.attachAtlasMapDiagnostic();

  assert.equal(detached.reasonCode, "DETACHED");
  assert.equal(map.listenerCount("moveend"), 0);
  assert.equal(authStatus.authorizationActive, false);
  assert.equal(reattach.reasonCode, "MAP_ATTACHMENT_NOT_AUTHORIZED");
});

test("explicit revoke while detached is safe and fresh instance starts unauthorized", () => {
  const { diagnostics } = buildIntegratedNamespace();

  const revoke = diagnostics.revokeAtlasMapAttachmentSession();
  const fresh = buildIntegratedNamespace().diagnostics.getAtlasMapAttachmentAuthorizationStatus();

  assert.equal(revoke.reasonCode, "ALREADY_REVOKED");
  assert.equal(fresh.authorizationActive, false);
  assert.equal(fresh.sessionId, null);
});

test("explicit revoke while attached removes owned listener and revokes authorization", () => {
  const { diagnostics, map } = buildIntegratedNamespace();

  diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  diagnostics.attachAtlasMapDiagnostic();

  const revoke = diagnostics.revokeAtlasMapAttachmentSession();
  const authStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const attachStatus = diagnostics.getAtlasMapAttachmentStatus();

  assert.equal(revoke.reasonCode, "REVOKED");
  assert.equal(revoke.detachedActiveAttachment.reasonCode, "DETACHED");
  assert.equal(map.listenerCount("moveend"), 0);
  assert.equal(authStatus.authorizationActive, false);
  assert.equal(attachStatus.attached, false);
});

test("unrelated listeners remain untouched", () => {
  const { diagnostics, map } = buildIntegratedNamespace();
  map.on("moveend", () => {});

  diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  diagnostics.attachAtlasMapDiagnostic();
  diagnostics.detachAtlasMapDiagnostic();

  assert.equal(map.listenerCount("moveend"), 1);
});

test("no startup authorization no startup attachment and no timers renderer overlay network or storage APIs", () => {
  assert.doesNotMatch(authorizationSource, /localStorage/);
  assert.doesNotMatch(authorizationSource, /sessionStorage/);
  assert.doesNotMatch(authorizationSource, /indexedDB/i);
  assert.doesNotMatch(authorizationSource, /document\.cookie/);
  assert.doesNotMatch(authorizationSource, /setInterval\(/);
  assert.doesNotMatch(authorizationSource, /setTimeout\(/);
  assert.doesNotMatch(authorizationSource, /fetch\(/);
  assert.doesNotMatch(authorizationSource, /XMLHttpRequest/);
  assert.doesNotMatch(authorizationSource, /createElement/);
  assert.doesNotMatch(authorizationSource, /appendChild/);
  assert.match(
    developmentAlphaAppSource,
    /installControlledOneSessionDeveloperMapAttachmentAuthorization/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /authorizeAtlasMapAttachmentSession\(\)/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /attachAtlasMapDiagnostic\(\)/
  );
});
