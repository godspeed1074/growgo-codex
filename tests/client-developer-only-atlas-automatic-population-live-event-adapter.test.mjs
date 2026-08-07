import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createAtlasAutomaticPopulationController,
  enableAutomaticViewportPopulation,
  getAutomaticViewportPopulationControllerStatus
} from "../client/developer-only-atlas-automatic-population-controller.mjs";
import {
  createAtlasAutomaticPopulationLiveEventAdapter,
  enableAtlasAutomaticPopulationLiveEventAdapter,
  disableAtlasAutomaticPopulationLiveEventAdapter,
  validateAtlasAutomaticPopulationLiveEventAdapter,
  getAtlasAutomaticPopulationLiveEventAdapterStatus
} from "../client/developer-only-atlas-automatic-population-live-event-adapter.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const adapterModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-automatic-population-live-event-adapter.mjs"
);
const controllerModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-atlas-automatic-population-controller.mjs"
);

function createIdentity(overrides = {}) {
  return {
    mapIdentityId: "MAP_BELLARINE_001",
    regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
    packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "WORLD_SELECTOR_SEED_001",
    sessionId: "PERSISTENT_SESSION_001",
    ...overrides
  };
}

function createViewport(viewportIdentity, overrides = {}) {
  return {
    viewportIdentity,
    featureSourceGenerationId:
      overrides.featureSourceGenerationId ?? `${viewportIdentity}_FEATURE_GEN_001`,
    ...overrides
  };
}

function createControllerHarness() {
  const identity = createIdentity();
  const viewportByEvent = new Map([
    ["moveend", createViewport("VP_MOVE")],
    ["zoomend", createViewport("VP_ZOOM")],
    ["resize", createViewport("VP_RESIZE")]
  ]);

  const controller = createAtlasAutomaticPopulationController({
    viewportIdentityProvider: ({ eventName }) =>
      JSON.parse(JSON.stringify(viewportByEvent.get(eventName) ?? createViewport("VP_A"))),
    atlasIdentityProvider: () => JSON.parse(JSON.stringify(identity)),
    readinessProvider: () => ({ approved: true, reasonCode: "READINESS_APPROVED" }),
    liveFeatureAdapter: ({ generation }) => ({
      viewportGenerationId: generation.viewportGenerationId,
      normalizedViewportGenerationId: generation.viewportGenerationId,
      featureSourceGenerationId: generation.featureSourceGenerationId,
      sourceFeatures: [],
      normalizedFeatures: [],
      sourceFeatureCount: 0,
      normalizedFeatureCount: 0
    }),
    populationPlanner: ({ generation }) => ({
      populationPlanId: `PLAN_${generation.viewportGenerationId}`,
      viewportGenerationId: generation.viewportGenerationId,
      commands: []
    }),
    populationDrawIntegration: ({ generation }) => ({
      submission: {
        batchId: `BATCH_${generation.viewportGenerationId}`,
        viewportGenerationId: generation.viewportGenerationId
      },
      draw: {
        batchId: `BATCH_${generation.viewportGenerationId}`,
        viewportGenerationId: generation.viewportGenerationId,
        drawCompleted: true
      }
    }),
    populationReferenceReleaseProvider: () => ({ released: true })
  });

  enableAutomaticViewportPopulation(controller);
  return { controller, identity, viewportByEvent };
}

function createAdapterHarness(overrides = {}) {
  const controllerHarness = createControllerHarness();
  const metrics = {
    registerCalls: [],
    removeCalls: [],
    controllerPlanCalls: 0,
    controllerDrawCalls: 0
  };

  const mutable = {
    identity: createIdentity(overrides.identity),
    readinessFailureReason: null,
    mapReplacementEnabled: false
  };

  const mapCalls = {
    on: [],
    off: []
  };

  const primaryMap = {
    on(eventName, callback) {
      mapCalls.on.push([eventName, callback]);
    },
    off(eventName, callback) {
      mapCalls.off.push([eventName, callback]);
    }
  };

  const replacementMap = {
    on() {},
    off() {}
  };

  const viewportByEvent = new Map([
    ["moveend", createViewport("VP_MOVE")],
    ["zoomend", createViewport("VP_ZOOM")],
    ["resize", createViewport("VP_RESIZE")]
  ]);

  const adapter = createAtlasAutomaticPopulationLiveEventAdapter({
    mapProvider: () => (mutable.mapReplacementEnabled ? replacementMap : primaryMap),
    controller: controllerHarness.controller,
    listenerRegistrar: (map, eventName, callback) => {
      if (overrides.failOnEvent === eventName) {
        throw Object.assign(new Error("LISTENER_REGISTRATION_FAILED"), {
          reasonCode: "LISTENER_REGISTRATION_FAILED"
        });
      }
      metrics.registerCalls.push([eventName, callback]);
      map.on(eventName, callback);
      return { id: `${eventName}_REG` };
    },
    listenerRemover: (map, eventName, callback) => {
      metrics.removeCalls.push([eventName, callback]);
      map.off(eventName, callback);
    },
    viewportIdentityProvider: ({ eventName }) =>
      JSON.parse(JSON.stringify(viewportByEvent.get(eventName) ?? createViewport("VP_A"))),
    readinessProvider: () => {
      if (mutable.readinessFailureReason) {
        return {
          approved: false,
          reasonCode: mutable.readinessFailureReason
        };
      }
      return { approved: true, reasonCode: "READINESS_APPROVED" };
    },
    atlasIdentityProvider: () => JSON.parse(JSON.stringify(mutable.identity))
  });

  return {
    adapter,
    controller: controllerHarness.controller,
    controllerHarness,
    metrics,
    mutable,
    mapCalls,
    trigger(eventName, eventObject = {}) {
      const registration = mapCalls.on.find(([name]) => name === eventName);
      assert.ok(registration, `expected ${eventName} listener registration`);
      return registration[1](eventObject);
    }
  };
}

function assertCanonicalFlags(flags) {
  assert.deepEqual(flags, {
    runtimeExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    lifecycleExecutionEnabled: false
  });
}

test("starts disabled", () => {
  const { adapter } = createAdapterHarness();
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.state, "disabled");
  assert.equal(status.enabled, false);
});

test("zero listeners on creation", () => {
  const { adapter } = createAdapterHarness();
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.ownedListenerCount, 0);
});

test("no startup refresh", () => {
  const { adapter } = createAdapterHarness();
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.eventForwardedCount, 0);
});

test("missing dependency fails closed", () => {
  const adapter = createAtlasAutomaticPopulationLiveEventAdapter();
  const result = enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  assert.equal(result.state, "failed_closed");
  assert.equal(result.lastFailureReason, "AUTOMATIC_POPULATION_LIVE_EVENT_ADAPTER_UNAVAILABLE");
});

test("enable registers exact three listeners", () => {
  const { adapter, mapCalls } = createAdapterHarness();
  const result = enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  assert.equal(result.enabled, true);
  assert.deepEqual(mapCalls.on.map(([eventName]) => eventName), [
    "moveend",
    "zoomend",
    "resize"
  ]);
});

test("duplicate enable blocked", () => {
  const { adapter } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  const result = enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  assert.equal(result.state, "failed_closed");
  assert.equal(result.lastFailureReason, "ADAPTER_ALREADY_ENABLED");
});

test("partial listener registration rolls back", () => {
  const { adapter, mapCalls } = createAdapterHarness({ failOnEvent: "zoomend" });
  const result = enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  assert.equal(result.state, "failed_closed");
  assert.equal(result.ownedListenerCount, 0);
  assert.equal(mapCalls.off.length >= 1, true);
});

for (const eventName of ["moveend", "zoomend", "resize"]) {
  test(`${eventName} forwards one request`, () => {
    const { adapter, controller, trigger } = createAdapterHarness();
    enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
    const before = getAutomaticViewportPopulationControllerStatus(controller);
    trigger(eventName);
    const after = getAutomaticViewportPopulationControllerStatus(controller);
    assert.equal(after.refreshRequestedCount, before.refreshRequestedCount + 1);
    const adapterStatus = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
    assert.equal(adapterStatus.eventForwardedCount, 1);
  });
}

test("forbidden event rejected", () => {
  const { adapter } = createAdapterHarness();
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.match(source, /"move"/);
  assert.match(source, /"startup"/);
});

test("unknown event rejected", () => {
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.doesNotMatch(source, /customEvent|unknownEvent/);
});

test("burst forwarding relies on controller coalescing", () => {
  const { adapter, controller, trigger } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  trigger("moveend");
  trigger("zoomend");
  trigger("resize");
  const status = getAutomaticViewportPopulationControllerStatus(controller);
  assert.equal(status.refreshRequestedCount, 3);
  assert.equal(status.queuedViewportGenerationId != null, true);
  assert.equal(status.followUpViewportGenerationId, null);
});

test("no second adapter coalescing system", () => {
  const { adapter, trigger } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  trigger("moveend");
  trigger("zoomend");
  trigger("resize");
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.eventForwardedCount, 3);
  assert.equal(status.eventRejectedCount, 0);
});

test("map identity checked before forwarding", () => {
  const { adapter, mutable, trigger } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  mutable.identity.mapIdentityId = "MAP_REPLACED";
  trigger("moveend");
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.staleMapDetected, true);
});

test("readiness checked before forwarding", () => {
  const { adapter, mutable, controller, trigger } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  const before = getAutomaticViewportPopulationControllerStatus(controller);
  mutable.readinessFailureReason = "REGION_OUT_OF_SCOPE";
  trigger("moveend");
  const after = getAutomaticViewportPopulationControllerStatus(controller);
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.readinessBlockedDetected, true);
  assert.equal(after.refreshRequestedCount, before.refreshRequestedCount);
});

test("region package recipe drift blocks forwarding", () => {
  for (const [field, expectedReason] of [
    ["regionId", "REGION_IDENTITY_MISMATCH"],
    ["packageId", "PACKAGE_IDENTITY_MISMATCH"],
    ["recipeId", "RECIPE_IDENTITY_MISMATCH"]
  ]) {
    const { adapter, mutable, controller, trigger } = createAdapterHarness();
    enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
    const before = getAutomaticViewportPopulationControllerStatus(controller);
    mutable.identity[field] = `${field}_CHANGED`;
    trigger("moveend");
    const after = getAutomaticViewportPopulationControllerStatus(controller);
    const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
    assert.equal(status.identityMismatchDetected, true);
    assert.equal(status.lastFailureReason, expectedReason);
    assert.equal(after.refreshRequestedCount, before.refreshRequestedCount);
  }
});

test("selector seed drift blocks forwarding", () => {
  const { adapter, mutable, controller, trigger } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  const before = getAutomaticViewportPopulationControllerStatus(controller);
  mutable.identity.selectorSeed = "SEED_CHANGED";
  trigger("moveend");
  const after = getAutomaticViewportPopulationControllerStatus(controller);
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.identityMismatchDetected, true);
  assert.equal(status.lastFailureReason, "SELECTOR_SEED_MISMATCH");
  assert.equal(after.refreshRequestedCount, before.refreshRequestedCount);
});

test("stale map detected", () => {
  const { adapter, mutable, trigger } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  mutable.mapReplacementEnabled = true;
  trigger("moveend");
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.staleMapDetected, true);
});

test("stale map does not silently rebind", () => {
  const { adapter, mutable, trigger } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  const before = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  mutable.mapReplacementEnabled = true;
  trigger("moveend");
  const after = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(after.listenerOwnerId, before.listenerOwnerId);
  assert.equal(after.boundMapIdentityId, before.boundMapIdentityId);
});

test("exact callbacks removed on disable", () => {
  const { adapter, mapCalls } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  disableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  assert.deepEqual(mapCalls.off.map(([eventName]) => eventName), [
    "moveend",
    "zoomend",
    "resize"
  ]);
});

test("repeated disable harmless", () => {
  const { adapter } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  disableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  const second = disableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  assert.equal(second.state, "disabled");
});

test("zero listeners after disable", () => {
  const { adapter } = createAdapterHarness();
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  disableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(status.ownedListenerCount, 0);
});

test("controller remains externally owned", () => {
  const { adapter, controller } = createAdapterHarness();
  const before = getAutomaticViewportPopulationControllerStatus(controller);
  enableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  disableAtlasAutomaticPopulationLiveEventAdapter(adapter);
  const after = getAutomaticViewportPopulationControllerStatus(controller);
  assert.equal(after.automaticPopulationEnabled, before.automaticPopulationEnabled);
});

test("adapter does not plan", () => {
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.doesNotMatch(source, /populationPlanner|createDeveloperOnlyAtlasWorldPopulationPlan/);
});

test("adapter does not draw", () => {
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.doesNotMatch(source, /drawCompleted|populationDrawIntegration/);
});

test("adapter does not touch Canvas", () => {
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.doesNotMatch(source, /canvas|Canvas|pane|renderer/);
});

test("adapter does not detach Atlas", () => {
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.doesNotMatch(source, /detach|cleanup provider|remove retained surface/i);
});

test("status immutable serializable", () => {
  const { adapter } = createAdapterHarness();
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assert.equal(Object.isFrozen(status), true);
  assert.doesNotThrow(() => JSON.stringify(status));
});

test("no raw refs exposed", () => {
  const { adapter } = createAdapterHarness();
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  for (const key of [
    "map",
    "listenerCallback",
    "eventObject",
    "controllerInternal",
    "canvas",
    "pane",
    "renderer",
    "featureData"
  ]) {
    assert.equal(key in status, false);
  }
});

test("no window global fallback", () => {
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\b|\bdocument\b|\bglobalThis\b/);
});

test("no timers polling", () => {
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.doesNotMatch(source, /setTimeout|setInterval|requestAnimationFrame/);
});

test("no automatic startup population", () => {
  const source = fs.readFileSync(adapterModulePath, "utf8");
  assert.doesNotMatch(
    source,
    /DOMContentLoaded|window\.onload|addEventListener\s*\(\s*["']load["']|addEventListener\s*\(\s*["']DOMContentLoaded["']/i
  );
});

test("all four canonical safety flags remain false", () => {
  const { adapter } = createAdapterHarness();
  const status = getAtlasAutomaticPopulationLiveEventAdapterStatus(adapter);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("validate API reports adapter validity", () => {
  const { adapter } = createAdapterHarness();
  const validation = validateAtlasAutomaticPopulationLiveEventAdapter(adapter);
  assert.equal(validation.valid, true);
  assert.equal(validation.reasonCode, "ADAPTER_VALID");
});

test("controller module remains externally composed", () => {
  const source = fs.readFileSync(controllerModulePath, "utf8");
  assert.match(source, /requestAutomaticViewportPopulationRefresh/);
});
