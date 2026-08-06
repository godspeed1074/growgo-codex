import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createPersistentAtlasCleanupProvider,
  preparePersistentAtlasCleanup,
  executePersistentAtlasCleanup,
  resumePersistentAtlasCleanup,
  validatePersistentAtlasCleanupCompletion,
  getPersistentAtlasCleanupStatus
} from "../client/developer-only-persistent-atlas-cleanup-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-cleanup-provider.mjs"
);
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const scriptPath = path.join(repoRoot, "script.js");

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function baseIdentity(overrides = {}) {
  return {
    cleanupOwnerId: "CLEANUP_OWNER_A",
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    lifecycleOwnerId: "LIFECYCLE_OWNER_A",
    lifecycleGenerationId: "GEN_A",
    surfaceOwnerId: "SURFACE_OWNER_A",
    schedulerOwnerId: "SCHED_OWNER_A",
    listenerOwnerId: "LISTENER_OWNER_A",
    authorizationSessionId: "AUTH_SESSION_A",
    queuedFrameCount: 1,
    ownedListenerCount: 3,
    drawReferenceCount: 1,
    snapshotReferenceCount: 1,
    ownedCanvasCount: 1,
    ownedPaneCount: 1,
    ownedLifecycleOwnerCount: 1,
    mapReferenceCount: 1,
    sessionReferenceCount: 1,
    referencesReleased: false,
    authorizationClosed: false,
    ...overrides
  };
}

function createHarness(failures = {}) {
  const state = {
    identity: baseIdentity(),
    order: [],
    failures: { ...failures }
  };

  const provider = createPersistentAtlasCleanupProvider({
    redrawBlockProvider() {
      state.order.push("redraw_block");
      if (state.failures.redraw_block) throw Object.assign(new Error(state.failures.redraw_block), { reasonCode: state.failures.redraw_block });
    },
    frameCancellationProvider() {
      state.order.push("frame_cancel");
      if (state.failures.frame_cancel) throw Object.assign(new Error(state.failures.frame_cancel), { reasonCode: state.failures.frame_cancel });
      state.identity.queuedFrameCount = 0;
    },
    listenerRemovalProvider() {
      state.order.push("listener_remove");
      if (state.failures.listener_remove) throw Object.assign(new Error(state.failures.listener_remove), { reasonCode: state.failures.listener_remove });
      state.identity.ownedListenerCount = 0;
    },
    drawStateReleaseProvider() {
      state.order.push("draw_state_release");
      if (state.failures.draw_state_release) throw Object.assign(new Error(state.failures.draw_state_release), { reasonCode: state.failures.draw_state_release });
      state.identity.drawReferenceCount = 0;
    },
    snapshotReleaseProvider() {
      state.order.push("snapshot_release");
      if (state.failures.snapshot_release) throw Object.assign(new Error(state.failures.snapshot_release), { reasonCode: state.failures.snapshot_release });
      state.identity.snapshotReferenceCount = 0;
    },
    retainedSurfaceReleaseProvider({ target }) {
      state.order.push(target === "canvas" ? "canvas_release" : "pane_release");
      if (target === "canvas") {
        if (state.failures.canvas_release) throw Object.assign(new Error(state.failures.canvas_release), { reasonCode: state.failures.canvas_release });
        state.identity.ownedCanvasCount = 0;
      } else {
        if (state.failures.pane_release) throw Object.assign(new Error(state.failures.pane_release), { reasonCode: state.failures.pane_release });
        state.identity.ownedPaneCount = 0;
      }
    },
    lifecycleOwnerReleaseProvider() {
      state.order.push("lifecycle_owner_release");
      if (state.failures.lifecycle_owner_release) throw Object.assign(new Error(state.failures.lifecycle_owner_release), { reasonCode: state.failures.lifecycle_owner_release });
      state.identity.ownedLifecycleOwnerCount = 0;
    },
    authorizationInvalidationProvider() {
      state.order.push("authorization_close");
      if (state.failures.authorization_close) throw Object.assign(new Error(state.failures.authorization_close), { reasonCode: state.failures.authorization_close });
      state.identity.authorizationClosed = true;
    },
    mapIdentityReleaseProvider() {
      state.order.push("map_identity_release");
      if (state.failures.map_identity_release) throw Object.assign(new Error(state.failures.map_identity_release), { reasonCode: state.failures.map_identity_release });
      state.identity.mapReferenceCount = 0;
    },
    sessionIdentityReleaseProvider() {
      state.order.push("session_identity_release");
      if (state.failures.session_identity_release) throw Object.assign(new Error(state.failures.session_identity_release), { reasonCode: state.failures.session_identity_release });
      state.identity.sessionReferenceCount = 0;
    },
    referenceReleaseProvider() {
      state.order.push("reference_release");
      if (state.failures.reference_release) throw Object.assign(new Error(state.failures.reference_release), { reasonCode: state.failures.reference_release });
      state.identity.referencesReleased = true;
    },
    cleanupIdentityProvider() {
      return state.identity;
    },
    timeProvider() {
      return "2026-08-06T12:00:00.000Z";
    }
  });

  return { provider, state };
}

test("1. defaults unavailable", () => {
  const provider = createPersistentAtlasCleanupProvider();
  assert.throws(() => preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" }), (e) => e.reasonCode === "CLEANUP_PROVIDER_UNAVAILABLE");
});

test("2. wrong dependency types rejected", () => {
  const provider = createPersistentAtlasCleanupProvider({
    redrawBlockProvider: 1
  });
  assert.throws(() => preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" }), (e) => e.reasonCode === "CLEANUP_PROVIDER_UNAVAILABLE");
});

test("3. valid cleanup preparation succeeds", () => {
  const { provider } = createHarness();
  const status = preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  assert.equal(status.cleanupPrepared, true);
});

test("4. unknown cleanup mode rejected", () => {
  const { provider } = createHarness();
  assert.throws(() => preparePersistentAtlasCleanup(provider, { cleanupMode: "bad" }), (e) => e.reasonCode === "INVALID_CLEANUP_MODE");
});

test("5. incomplete identity rejected", () => {
  const { provider, state } = createHarness();
  state.identity.cleanupOwnerId = null;
  assert.throws(() => preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" }), (e) => e.reasonCode === "CLEANUP_IDENTITY_INCOMPLETE");
});

test("6. cleanup owner mismatch rejected", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  state.identity.cleanupOwnerId = "OTHER";
  assert.throws(() => resumePersistentAtlasCleanup(provider), (e) => e.reasonCode === "CLEANUP_OWNER_MISMATCH");
});

test("7. second cleanup owner blocked", () => {
  const { provider } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  assert.throws(() => preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" }), (e) => e.reasonCode === "CLEANUP_ALREADY_IN_PROGRESS");
});

test("8. exact cleanup order enforced", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.deepEqual(state.order, [
    "redraw_block",
    "frame_cancel",
    "listener_remove",
    "draw_state_release",
    "snapshot_release",
    "canvas_release",
    "pane_release",
    "lifecycle_owner_release",
    "authorization_close",
    "map_identity_release",
    "session_identity_release",
    "reference_release"
  ]);
});

test("9. redraw blocked first", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.equal(state.order[0], "redraw_block");
});

test("10. frame cancelled before listeners", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.indexOf("frame_cancel") < state.order.indexOf("listener_remove"));
});

test("11. listeners removed before draw/snapshot release", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.indexOf("listener_remove") < state.order.indexOf("draw_state_release"));
  assert.ok(state.order.indexOf("listener_remove") < state.order.indexOf("snapshot_release"));
});

test("12. draw state released before snapshot", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.indexOf("draw_state_release") < state.order.indexOf("snapshot_release"));
});

test("13. snapshot released before surface", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.indexOf("snapshot_release") < state.order.indexOf("canvas_release"));
});

test("14. Canvas released before pane", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.indexOf("canvas_release") < state.order.indexOf("pane_release"));
});

test("15. pane released before lifecycle owner", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.indexOf("pane_release") < state.order.indexOf("lifecycle_owner_release"));
});

test("16. lifecycle released before identity clearing", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.indexOf("lifecycle_owner_release") < state.order.indexOf("map_identity_release"));
});

test("17. map identity cleared before session identity", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.indexOf("map_identity_release") < state.order.indexOf("session_identity_release"));
});

test("18. final references released last", () => {
  const { provider, state } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.equal(state.order.at(-1), "reference_release");
});

test("19. successful cleanup reaches zero ownership", () => {
  const { provider } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.equal(status.cleanupComplete, true);
  assert.equal(status.zeroOwnershipVerified, true);
});

test("20. repeated completed cleanup harmless", () => {
  const { provider } = createHarness();
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  const resumed = resumePersistentAtlasCleanup(provider);
  assert.equal(resumed.cleanupComplete, true);
});

test("21. frame-cancel failure recorded", () => {
  const { provider } = createHarness({ frame_cancel: "FRAME_CANCELLATION_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("FRAME_CANCELLATION_FAILED"));
});

test("22. listener-removal failure recorded", () => {
  const { provider } = createHarness({ listener_remove: "LISTENER_REMOVAL_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("LISTENER_REMOVAL_FAILED"));
});

test("23. draw-state failure recorded", () => {
  const { provider } = createHarness({ draw_state_release: "DRAW_STATE_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("DRAW_STATE_RELEASE_FAILED"));
});

test("24. snapshot-release failure recorded", () => {
  const { provider } = createHarness({ snapshot_release: "SNAPSHOT_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("SNAPSHOT_RELEASE_FAILED"));
});

test("25. Canvas-release failure recorded", () => {
  const { provider } = createHarness({ canvas_release: "CANVAS_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("CANVAS_RELEASE_FAILED"));
});

test("26. pane-release failure recorded", () => {
  const { provider } = createHarness({ pane_release: "PANE_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("PANE_RELEASE_FAILED"));
});

test("27. lifecycle-release failure recorded", () => {
  const { provider } = createHarness({ lifecycle_owner_release: "LIFECYCLE_OWNER_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("LIFECYCLE_OWNER_RELEASE_FAILED"));
});

test("28. authorization-close failure recorded", () => {
  const { provider } = createHarness({ authorization_close: "AUTHORIZATION_CLOSE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("AUTHORIZATION_CLOSE_FAILED"));
});

test("29. identity-release failure recorded", () => {
  const { provider } = createHarness({ map_identity_release: "MAP_IDENTITY_RELEASE_FAILED", session_identity_release: "SESSION_IDENTITY_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("MAP_IDENTITY_RELEASE_FAILED"));
  assert.ok(status.cleanupFailureReasons.includes("SESSION_IDENTITY_RELEASE_FAILED"));
});

test("30. reference-release failure recorded", () => {
  const { provider } = createHarness({ reference_release: "REFERENCE_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.ok(status.cleanupFailureReasons.includes("REFERENCE_RELEASE_FAILED"));
});

test("31. later safe steps continue after failure", () => {
  const { provider, state } = createHarness({ frame_cancel: "FRAME_CANCELLATION_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  assert.ok(state.order.includes("listener_remove"));
  assert.ok(state.order.includes("reference_release"));
});

test("32. partial cleanup resumable", () => {
  const { provider, state } = createHarness({ canvas_release: "CANVAS_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const partial = executePersistentAtlasCleanup(provider);
  assert.equal(partial.cleanupPartial, true);
  delete state.failures.canvas_release;
  const completed = resumePersistentAtlasCleanup(provider);
  assert.equal(completed.cleanupComplete, true);
});

test("33. completed steps not duplicated unsafely", () => {
  const { provider, state } = createHarness({ canvas_release: "CANVAS_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  executePersistentAtlasCleanup(provider);
  const orderBefore = state.order.filter((x) => x === "redraw_block").length;
  delete state.failures.canvas_release;
  resumePersistentAtlasCleanup(provider);
  const orderAfter = state.order.filter((x) => x === "redraw_block").length;
  assert.equal(orderBefore, orderAfter);
});

test("34. originating failure preserved separately", () => {
  const { provider } = createHarness({ frame_cancel: "FRAME_CANCELLATION_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "redraw_failure", originatingFailureReason: "DRAW_EXECUTION_FAILED" });
  const status = executePersistentAtlasCleanup(provider);
  assert.equal(status.originatingFailureReason, "DRAW_EXECUTION_FAILED");
});

test("35. remaining ownership exposed accurately", () => {
  const { provider } = createHarness({ canvas_release: "CANVAS_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.equal(status.ownedCanvasCount, 1);
});

test("36. false completion blocked while ownership remains", () => {
  const { provider } = createHarness({ canvas_release: "CANVAS_RELEASE_FAILED" });
  preparePersistentAtlasCleanup(provider, { cleanupMode: "detach" });
  const status = executePersistentAtlasCleanup(provider);
  assert.equal(status.cleanupComplete, false);
  assert.equal(status.cleanupPartial, true);
});

test("37. status immutable and serializable", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasCleanupStatus(provider);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("38. no raw references exposed", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasCleanupStatus(provider);
  assert.equal("map" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
  assert.equal("snapshot" in status, false);
});

test("39. no window/document/global fallback", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\./);
  assert.doesNotMatch(source, /\bdocument\./);
  assert.doesNotMatch(source, /\bglobalThis\b(?!["'])/);
  assert.doesNotMatch(source, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(source, /getGrowGoMap/);
});

test("40. no live controller or adapter connection", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /createControlledPersistentAtlasController/);
  assert.doesNotMatch(source, /live-one-frame-adapter/i);
});

test("41. no automatic detach or startup wiring", () => {
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-cleanup-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-cleanup-provider/);
});

test("42. no renderer invocation", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /drawCustom25DMapCanvasWithFrameSnapshot/);
  assert.doesNotMatch(source, /createAtlasRenderer/i);
});

test("43. all four canonical safety flags remain false", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasCleanupStatus(provider);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});
