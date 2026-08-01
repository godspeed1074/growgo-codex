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
const authorizationSource = fs.readFileSync(
  path.join(repoRoot, "client", "developer-only-atlas-map-attachment-authorization.mjs"),
  "utf8"
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

function createDiagnosticStub() {
  return () =>
    Object.freeze({
      schemaId: "ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001",
      diagnosticStatus: "resolved",
      reasonCode: "RESOLVED"
    });
}

function buildIntegratedNamespace({ hostname = "localhost" } = {}) {
  const map = createMapStub();
  const diagnostic = createDiagnosticStub();
  const authorization =
    authorizationModule.createControlledOneSessionDeveloperMapAttachmentAuthorization({
      getHostname: () => hostname,
      getSafetyFlags() {
        return {
          runtimeExecutionEnabled: false,
          mapAttachmentAllowed: false,
          automaticRendererExecutionAllowed: false,
          lifecycleExecutionEnabled: false
        };
      }
    });

  const controller = controllerModule.createGatedDeveloperOnlyAtlasMapAttachmentController({
    getGrowGoMap: () => map,
    runAtlasDiagnostic: diagnostic,
    getAuthorizationState() {
      return authorization.readAttachmentAuthorizationStateForController();
    }
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

  return {
    map,
    controller,
    authorization,
    diagnostics: globalObject.GrowGoDeveloperDiagnostics
  };
}

test("fresh default state is unauthorized detached and owns zero listeners", () => {
  const { diagnostics, map } = buildIntegratedNamespace();

  const authStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const attachStatus = diagnostics.getAtlasMapAttachmentStatus();

  assert.equal(authStatus.authorizationActive, false);
  assert.equal(authStatus.sessionId, null);
  assert.equal(authStatus.successfulAttachmentConsumed, false);
  assert.equal(authStatus.storageUsed, false);
  assert.equal(attachStatus.attached, false);
  assert.equal(attachStatus.ownedListenerCount, 0);
  assert.equal(attachStatus.diagnosticInvocationCount, 0);
  assert.equal(map.listenerCount("moveend"), 0);
  assert.equal(attachStatus.safetyFlags.runtimeExecutionEnabled, false);
  assert.equal(attachStatus.safetyFlags.mapAttachmentAllowed, false);
  assert.equal(attachStatus.safetyFlags.automaticRendererExecutionAllowed, false);
  assert.equal(attachStatus.safetyFlags.lifecycleExecutionEnabled, false);
  assert.equal(Object.isFrozen(authStatus), true);
  assert.equal(Object.isFrozen(attachStatus), true);
});

test("session A authorizes attaches runs one controlled event detaches and blocks reattach", () => {
  const { diagnostics, map } = buildIntegratedNamespace();

  const authorizationResult = diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  const sessionAId = authorizationResult.authorizationStatus.sessionId;
  const attachResult = diagnostics.attachAtlasMapDiagnostic();
  const attachedListenerCount = map.listenerCount("moveend");

  map.emit("moveend");

  const postEventStatus = diagnostics.getAtlasMapAttachmentStatus();
  const detachResult = diagnostics.detachAtlasMapDiagnostic();
  const postDetachAuthStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const reattachResult = diagnostics.attachAtlasMapDiagnostic();

  assert.equal(authorizationResult.reasonCode, "AUTHORIZED_ONE_SESSION");
  assert.match(sessionAId, /^ATLAS_ONE_SESSION_001$/);
  assert.equal(attachResult.reasonCode, "ATTACHED");
  assert.equal(attachResult.status.ownedListenerCount, 1);
  assert.equal(attachedListenerCount, 1);
  assert.equal(postEventStatus.diagnosticInvocationCount, 1);
  assert.equal(postEventStatus.lastDiagnosticStatus, "resolved");
  assert.equal(postEventStatus.lastReasonCode, "RESOLVED");
  assert.equal(detachResult.reasonCode, "DETACHED");
  assert.equal(map.listenerCount("moveend"), 0);
  assert.equal(postDetachAuthStatus.authorizationActive, false);
  assert.equal(postDetachAuthStatus.sessionId, null);
  assert.equal(reattachResult.reasonCode, "MAP_ATTACHMENT_NOT_AUTHORIZED");
});

test("session B gets a distinct session identity with no leaked listener and revoke while attached cleans up exactly the owned listener", () => {
  const { diagnostics, map } = buildIntegratedNamespace();
  map.on("moveend", () => {});

  diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  diagnostics.attachAtlasMapDiagnostic();
  map.emit("moveend");
  diagnostics.detachAtlasMapDiagnostic();

  const sessionBAuthorize = diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  const sessionBId = sessionBAuthorize.authorizationStatus.sessionId;
  const attachResult = diagnostics.attachAtlasMapDiagnostic();
  const duplicateAttach = diagnostics.attachAtlasMapDiagnostic();
  const attachedListenerCount = map.listenerCount("moveend");

  map.emit("moveend");

  const postEventStatus = diagnostics.getAtlasMapAttachmentStatus();
  const revokeResult = diagnostics.revokeAtlasMapAttachmentSession();
  const postRevokeAuthStatus = diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const postRevokeAttachStatus = diagnostics.getAtlasMapAttachmentStatus();
  const postRevokeAttachAttempt = diagnostics.attachAtlasMapDiagnostic();

  assert.match(sessionBId, /^ATLAS_ONE_SESSION_002$/);
  assert.notEqual(sessionBId, "ATLAS_ONE_SESSION_001");
  assert.equal(attachResult.reasonCode, "ATTACHED");
  assert.equal(attachResult.status.ownedListenerCount, 1);
  assert.equal(attachedListenerCount, 2);
  assert.equal(duplicateAttach.reasonCode, "ALREADY_ATTACHED");
  assert.equal(duplicateAttach.status.ownedListenerCount, 1);
  assert.equal(postEventStatus.diagnosticInvocationCount, 2);
  assert.equal(postEventStatus.lastDiagnosticStatus, "resolved");
  assert.equal(postEventStatus.lastReasonCode, "RESOLVED");
  assert.equal(revokeResult.reasonCode, "REVOKED");
  assert.equal(revokeResult.detachedActiveAttachment.reasonCode, "DETACHED");
  assert.equal(map.listenerCount("moveend"), 1);
  assert.equal(postRevokeAuthStatus.authorizationActive, false);
  assert.equal(postRevokeAttachStatus.attached, false);
  assert.equal(postRevokeAttachStatus.ownedListenerCount, 0);
  assert.equal(postRevokeAttachStatus.diagnosticInvocationCount, 2);
  assert.equal(postRevokeAttachAttempt.reasonCode, "MAP_ATTACHMENT_NOT_AUTHORIZED");
  assert.equal(Object.isFrozen(revokeResult), true);
  assert.equal(Object.isFrozen(revokeResult.attachmentStatus), true);
});

test("fresh page instance resets authorization listener ownership and diagnostic counter with no persistence", () => {
  const firstPage = buildIntegratedNamespace();
  firstPage.diagnostics.authorizeAtlasMapAttachmentSession({
    confirmation: "AUTHORIZE_ATLAS_ONE_SESSION"
  });
  firstPage.diagnostics.attachAtlasMapDiagnostic();
  firstPage.map.emit("moveend");

  const samePageStatusAfterDetach = firstPage.diagnostics.detachAtlasMapDiagnostic().status;
  const freshPage = buildIntegratedNamespace();
  const freshAuthStatus = freshPage.diagnostics.getAtlasMapAttachmentAuthorizationStatus();
  const freshAttachStatus = freshPage.diagnostics.getAtlasMapAttachmentStatus();

  assert.equal(samePageStatusAfterDetach.diagnosticInvocationCount, 1);
  assert.equal(samePageStatusAfterDetach.lastDiagnosticStatus, "resolved");
  assert.equal(freshAuthStatus.authorizationActive, false);
  assert.equal(freshAuthStatus.sessionId, null);
  assert.equal(freshAuthStatus.successfulAttachmentConsumed, false);
  assert.equal(freshAuthStatus.storageUsed, false);
  assert.equal(freshAttachStatus.attached, false);
  assert.equal(freshAttachStatus.ownedListenerCount, 0);
  assert.equal(freshAttachStatus.diagnosticInvocationCount, 0);
  assert.equal(freshAttachStatus.lastDiagnosticStatus, null);
  assert.equal(freshAttachStatus.lastReasonCode, null);
  assert.equal(freshPage.map.listenerCount("moveend"), 0);
});

test("no stale references duplicate exposure automatic behavior renderer overlay network or persistence are introduced by the session boundary flow", () => {
  const { diagnostics } = buildIntegratedNamespace();

  assert.equal(typeof diagnostics.authorizeAtlasMapAttachmentSession, "function");
  assert.equal(typeof diagnostics.revokeAtlasMapAttachmentSession, "function");
  assert.equal(typeof diagnostics.attachAtlasMapDiagnostic, "function");
  assert.equal(typeof diagnostics.detachAtlasMapDiagnostic, "function");
  assert.equal(typeof diagnostics.getAtlasMapAttachmentStatus, "function");
  assert.equal(typeof diagnostics.getAtlasMapAttachmentAuthorizationStatus, "function");
  assert.doesNotMatch(authorizationSource, /localStorage/);
  assert.doesNotMatch(authorizationSource, /sessionStorage/);
  assert.doesNotMatch(authorizationSource, /indexedDB/i);
  assert.doesNotMatch(authorizationSource, /document\.cookie/);
  assert.doesNotMatch(controllerSource, /setInterval\(/);
  assert.doesNotMatch(controllerSource, /setTimeout\(/);
  assert.doesNotMatch(controllerSource, /fetch\(/);
  assert.doesNotMatch(controllerSource, /XMLHttpRequest/);
  assert.doesNotMatch(controllerSource, /createElement/);
  assert.doesNotMatch(controllerSource, /appendChild/);
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
