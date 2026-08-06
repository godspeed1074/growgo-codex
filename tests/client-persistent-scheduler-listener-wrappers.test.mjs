import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createPersistentAtlasAnimationFrameWrapper,
  schedulePersistentAtlasFrame,
  cancelPersistentAtlasFrame,
  invalidatePersistentAtlasFrameGeneration,
  getPersistentAtlasAnimationFrameStatus
} from "../client/developer-only-persistent-atlas-animation-frame-wrapper.mjs";
import {
  createPersistentAtlasListenerWrapper,
  registerPersistentAtlasListeners,
  removePersistentAtlasListeners,
  validatePersistentAtlasListenerIdentity,
  getPersistentAtlasListenerStatus
} from "../client/developer-only-persistent-atlas-listener-wrapper.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const scriptPath = path.join(repoRoot, "script.js");
const schedulerModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-animation-frame-wrapper.mjs"
);
const listenerModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-listener-wrapper.mjs"
);

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

function createSchedulerHarness({
  schedulerOwnerId = "OWNER_A",
  cancellerOwnerId = "OWNER_A",
  generationId = "GEN_A",
  cancelThrows = null
} = {}) {
  const frames = [];
  const cancelled = [];
  const state = {
    generationId
  };

  const wrapper = createPersistentAtlasAnimationFrameWrapper({
    requestAnimationFrameProvider(callback) {
      const handle = { id: frames.length + 1, callback };
      frames.push(handle);
      return handle;
    },
    cancelAnimationFrameProvider(handle) {
      if (cancelThrows) {
        throw cancelThrows;
      }
      cancelled.push(handle.id);
    },
    generationProvider() {
      return state.generationId;
    },
    identityProvider() {
      return {
        schedulerOwnerId,
        cancellerOwnerId
      };
    }
  });

  return { wrapper, state, frames, cancelled };
}

function createListenerHarness() {
  const state = {
    mapIdentityId: "MAP_A",
    sessionId: "SESSION_A",
    listenerOwnerId: "LISTENER_OWNER_A",
    failOnEvent: null,
    removeThrows: null
  };

  const mapCalls = {
    on: [],
    off: []
  };

  const map = {
    on(eventName, callback) {
      mapCalls.on.push([eventName, callback]);
    },
    off(eventName, callback) {
      mapCalls.off.push([eventName, callback]);
    }
  };

  const wrapper = createPersistentAtlasListenerWrapper({
    mapProvider() {
      return map;
    },
    listenerRegistrar(boundMap, eventName, callback) {
      if (state.failOnEvent === eventName) {
        throw Object.assign(new Error("LISTENER_REGISTRATION_FAILED"), {
          reasonCode: "LISTENER_REGISTRATION_FAILED"
        });
      }
      boundMap.on(eventName, callback);
      return { eventName, id: `${eventName}_REG` };
    },
    listenerRemover(boundMap, eventName, callback) {
      if (state.removeThrows === eventName) {
        throw Object.assign(new Error("LISTENER_REMOVAL_FAILED"), {
          reasonCode: "LISTENER_REMOVAL_FAILED"
        });
      }
      boundMap.off(eventName, callback);
    },
    identityProvider() {
      return {
        mapIdentityId: state.mapIdentityId,
        sessionId: state.sessionId,
        listenerOwnerId: state.listenerOwnerId
      };
    }
  });

  const callbacks = {
    moveend() {},
    zoomend() {},
    resize() {}
  };

  return { wrapper, state, map, mapCalls, callbacks };
}

test("1. scheduler defaults unavailable", () => {
  const wrapper = createPersistentAtlasAnimationFrameWrapper();
  assert.throws(
    () => schedulePersistentAtlasFrame(wrapper, () => {}),
    (error) => error.reasonCode === "FRAME_SCHEDULER_UNAVAILABLE"
  );
});

test("2. scheduler wrong dependency types rejected", () => {
  const wrapper = createPersistentAtlasAnimationFrameWrapper({
    requestAnimationFrameProvider: 1,
    cancelAnimationFrameProvider: 2,
    generationProvider: 3,
    identityProvider: 4
  });
  assert.throws(
    () => schedulePersistentAtlasFrame(wrapper, () => {}),
    (error) => error.reasonCode === "FRAME_SCHEDULER_UNAVAILABLE"
  );
});

test("3. scheduler/canceller mismatch rejected", () => {
  const { wrapper } = createSchedulerHarness({
    schedulerOwnerId: "OWNER_A",
    cancellerOwnerId: "OWNER_B"
  });
  assert.throws(
    () => schedulePersistentAtlasFrame(wrapper, () => {}),
    (error) => error.reasonCode === "SCHEDULER_CANCELLER_MISMATCH"
  );
});

test("4. one frame schedules", () => {
  const { wrapper } = createSchedulerHarness();
  const result = schedulePersistentAtlasFrame(wrapper, () => {});
  assert.equal(result.schedulerOwnerId, "OWNER_A");
});

test("5. second queued frame blocked", () => {
  const { wrapper } = createSchedulerHarness();
  schedulePersistentAtlasFrame(wrapper, () => {});
  assert.throws(
    () => schedulePersistentAtlasFrame(wrapper, () => {}),
    (error) => error.reasonCode === "FRAME_ALREADY_QUEUED"
  );
});

test("6. callback executes once", () => {
  const { wrapper, frames } = createSchedulerHarness();
  let count = 0;
  schedulePersistentAtlasFrame(wrapper, () => {
    count += 1;
  });
  frames[0].callback();
  frames[0].callback();
  assert.equal(count, 1);
});

test("7. stale generation ignored", () => {
  const { wrapper, state, frames } = createSchedulerHarness();
  let count = 0;
  schedulePersistentAtlasFrame(wrapper, () => {
    count += 1;
  });
  state.generationId = "GEN_B";
  frames[0].callback();
  assert.equal(count, 0);
  const status = getPersistentAtlasAnimationFrameStatus(wrapper);
  assert.equal(status.staleCallbackIgnoredCount, 1);
});

test("8. cancellation succeeds", () => {
  const { wrapper, cancelled } = createSchedulerHarness();
  schedulePersistentAtlasFrame(wrapper, () => {});
  const result = cancelPersistentAtlasFrame(wrapper);
  assert.equal(result.cancelled, true);
  assert.deepEqual(cancelled, [1]);
});

test("9. repeated cancellation harmless", () => {
  const { wrapper } = createSchedulerHarness();
  schedulePersistentAtlasFrame(wrapper, () => {});
  cancelPersistentAtlasFrame(wrapper);
  const second = cancelPersistentAtlasFrame(wrapper);
  assert.equal(second.cancelled, false);
});

test("10. cancellation failure reported", () => {
  const { wrapper } = createSchedulerHarness({
    cancelThrows: Object.assign(new Error("FRAME_CANCEL_FAILED"), {
      reasonCode: "FRAME_CANCEL_FAILED"
    })
  });
  schedulePersistentAtlasFrame(wrapper, () => {});
  assert.throws(
    () => cancelPersistentAtlasFrame(wrapper),
    (error) => error.reasonCode === "FRAME_CANCEL_FAILED"
  );
});

test("11. no timers", () => {
  const source = fs.readFileSync(schedulerModulePath, "utf8");
  assert.doesNotMatch(source, /setTimeout/);
  assert.doesNotMatch(source, /setInterval/);
});

test("12. no polling", () => {
  const source = fs.readFileSync(schedulerModulePath, "utf8");
  assert.doesNotMatch(source, /setInterval/);
  assert.doesNotMatch(source, /setTimeout/);
});

test("13. no window/global fallback", () => {
  const source = fs.readFileSync(schedulerModulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\b/);
  assert.doesNotMatch(source, /\bglobalThis\b/);
});

test("14. scheduler status immutable and serializable", () => {
  const { wrapper } = createSchedulerHarness();
  const status = getPersistentAtlasAnimationFrameStatus(wrapper);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("15. no raw frame handle exposed", () => {
  const { wrapper } = createSchedulerHarness();
  const status = getPersistentAtlasAnimationFrameStatus(wrapper);
  assert.equal("activeHandle" in status, false);
  assert.equal("frameHandle" in status, false);
});

test("16. listener defaults unavailable", () => {
  const wrapper = createPersistentAtlasListenerWrapper();
  assert.throws(
    () => registerPersistentAtlasListeners(wrapper),
    (error) => error.reasonCode === "LISTENER_WRAPPER_UNAVAILABLE"
  );
});

test("17. exact whitelist registers", () => {
  const { wrapper, callbacks, mapCalls } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  assert.deepEqual(
    mapCalls.on.map(([eventName]) => eventName),
    ["moveend", "zoomend", "resize"]
  );
});

test("18. forbidden event rejected", () => {
  const { wrapper, callbacks } = createListenerHarness();
  assert.throws(
    () =>
      registerPersistentAtlasListeners(wrapper, {
        eventCallbacks: {
          ...callbacks,
          move() {}
        }
      }),
    (error) => error.reasonCode === "FORBIDDEN_EVENT_NAME"
  );
});

test("19. unknown event rejected", () => {
  const { wrapper, callbacks } = createListenerHarness();
  assert.throws(
    () =>
      registerPersistentAtlasListeners(wrapper, {
        eventCallbacks: {
          ...callbacks,
          custom() {}
        }
      }),
    (error) => error.reasonCode === "INVALID_EVENT_NAME"
  );
});

test("20. duplicate registration blocked", () => {
  const { wrapper, callbacks } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  assert.throws(
    () => registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks }),
    (error) => error.reasonCode === "LISTENER_SET_ALREADY_REGISTERED"
  );
});

test("21. second listener set blocked", () => {
  const { wrapper, callbacks } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  assert.throws(
    () =>
      registerPersistentAtlasListeners(wrapper, {
        eventCallbacks: {
          moveend() {},
          zoomend() {},
          resize() {}
        }
      }),
    (error) => error.reasonCode === "LISTENER_SET_ALREADY_REGISTERED"
  );
});

test("22. partial registration rolls back", () => {
  const { wrapper, callbacks, state } = createListenerHarness();
  state.failOnEvent = "zoomend";
  assert.throws(
    () => registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks }),
    (error) => error.reasonCode === "PARTIAL_LISTENER_REGISTRATION_FAILED"
  );
  const status = getPersistentAtlasListenerStatus(wrapper);
  assert.equal(status.ownedListenerCount, 0);
  assert.equal(status.partialRollbackCompletedCount, 1);
});

test("23. exact callbacks removed", () => {
  const { wrapper, callbacks, mapCalls } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  removePersistentAtlasListeners(wrapper);
  assert.deepEqual(
    mapCalls.off.map(([, callback]) => callback),
    [callbacks.moveend, callbacks.zoomend, callbacks.resize]
  );
});

test("24. repeated removal harmless", () => {
  const { wrapper, callbacks } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  removePersistentAtlasListeners(wrapper);
  const second = removePersistentAtlasListeners(wrapper);
  assert.equal(second.removed, true);
});

test("25. map identity drift detected", () => {
  const { wrapper, callbacks, state } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  state.mapIdentityId = "MAP_B";
  assert.throws(
    () =>
      validatePersistentAtlasListenerIdentity(wrapper, {
        mapIdentityId: "MAP_A",
        sessionId: "SESSION_A",
        listenerOwnerId: "LISTENER_OWNER_A"
      }),
    (error) => error.reasonCode === "MAP_IDENTITY_MISMATCH"
  );
});

test("26. session mismatch detected", () => {
  const { wrapper, callbacks, state } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  state.sessionId = "SESSION_B";
  assert.throws(
    () =>
      validatePersistentAtlasListenerIdentity(wrapper, {
        mapIdentityId: "MAP_A",
        sessionId: "SESSION_A",
        listenerOwnerId: "LISTENER_OWNER_A"
      }),
    (error) => error.reasonCode === "SESSION_IDENTITY_MISMATCH"
  );
});

test("27. listener owner mismatch detected", () => {
  const { wrapper, callbacks, state } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  state.listenerOwnerId = "LISTENER_OWNER_B";
  assert.throws(
    () =>
      validatePersistentAtlasListenerIdentity(wrapper, {
        mapIdentityId: "MAP_A",
        sessionId: "SESSION_A",
        listenerOwnerId: "LISTENER_OWNER_A"
      }),
    (error) => error.reasonCode === "LISTENER_OWNER_MISMATCH"
  );
});

test("28. removal failure reported", () => {
  const { wrapper, callbacks, state } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  state.removeThrows = "zoomend";
  assert.throws(
    () => removePersistentAtlasListeners(wrapper),
    (error) => error.reasonCode === "LISTENER_REMOVAL_FAILED"
  );
});

test("29. zero listeners after success", () => {
  const { wrapper, callbacks } = createListenerHarness();
  registerPersistentAtlasListeners(wrapper, { eventCallbacks: callbacks });
  removePersistentAtlasListeners(wrapper);
  const status = getPersistentAtlasListenerStatus(wrapper);
  assert.equal(status.ownedListenerCount, 0);
});

test("30. listener status immutable and serializable", () => {
  const { wrapper } = createListenerHarness();
  const status = getPersistentAtlasListenerStatus(wrapper);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("31. no raw map/callback/listener refs exposed", () => {
  const { wrapper } = createListenerHarness();
  const status = getPersistentAtlasListenerStatus(wrapper);
  assert.equal("map" in status, false);
  assert.equal("callbacks" in status, false);
  assert.equal("registrations" in status, false);
});

test("32. no live adapter composition", () => {
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-animation-frame-wrapper/);
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-listener-wrapper/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-animation-frame-wrapper/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-listener-wrapper/);
});

test("33. no controller connection", () => {
  const schedulerSource = fs.readFileSync(schedulerModulePath, "utf8");
  const listenerSource = fs.readFileSync(listenerModulePath, "utf8");
  assert.doesNotMatch(schedulerSource, /createControlledPersistentAtlasController/);
  assert.doesNotMatch(listenerSource, /createControlledPersistentAtlasController/);
});

test("34. no real Canvas", () => {
  const schedulerSource = fs.readFileSync(schedulerModulePath, "utf8");
  const listenerSource = fs.readFileSync(listenerModulePath, "utf8");
  assert.doesNotMatch(schedulerSource, /canvas/i);
  assert.doesNotMatch(listenerSource, /canvas/i);
});

test("35. no renderer invocation", () => {
  const schedulerSource = fs.readFileSync(schedulerModulePath, "utf8");
  const listenerSource = fs.readFileSync(listenerModulePath, "utf8");
  assert.doesNotMatch(schedulerSource, /drawPersistentFrame/);
  assert.doesNotMatch(listenerSource, /drawPersistentFrame/);
});

test("36. no startup behavior", () => {
  const schedulerSource = fs.readFileSync(schedulerModulePath, "utf8");
  const listenerSource = fs.readFileSync(listenerModulePath, "utf8");
  assert.doesNotMatch(schedulerSource, /startup/i);
  assert.doesNotMatch(listenerSource, /startup listeners/i);
});

test("37. all four canonical safety flags remain false", () => {
  const schedulerStatus = getPersistentAtlasAnimationFrameStatus(
    createPersistentAtlasAnimationFrameWrapper()
  );
  const listenerStatus = getPersistentAtlasListenerStatus(
    createPersistentAtlasListenerWrapper()
  );
  assertCanonicalFlags(schedulerStatus.canonicalSafetyFlags);
  assertCanonicalFlags(listenerStatus.canonicalSafetyFlags);
});
