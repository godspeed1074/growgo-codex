import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createPersistentAtlasRetainedSurfaceProvider,
  acquirePersistentAtlasRetainedSurface,
  validatePersistentAtlasRetainedSurface,
  reusePersistentAtlasRetainedSurface,
  releasePersistentAtlasRetainedSurface,
  getPersistentAtlasRetainedSurfaceStatus
} from "../client/developer-only-persistent-atlas-retained-surface-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-retained-surface-provider.mjs"
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

function createIdentity(overrides = {}) {
  return {
    mapIdentityId: "MAP_A",
    sessionId: "SESSION_A",
    regionId: "BELLARINE",
    packageId: "atlas-bellarine",
    packageVersion: "2026.08.06",
    packageFingerprint: "fingerprint-a",
    recipeId: "coastal-default",
    recipeVersion: "recipe-v001",
    selectorSeed: "seed-a",
    ...overrides
  };
}

function createHarness({
  withPane = true,
  canvasCount = 1,
  paneCount = withPane ? 1 : 0,
  removalFailures = {},
  surfaceObjectFactory = null
} = {}) {
  const state = {
    identity: createIdentity(),
    canvasObjects: Array.from({ length: canvasCount }, (_, index) => ({ kind: "canvas", id: `canvas-${index}` })),
    paneObjects: Array.from({ length: paneCount }, (_, index) => ({ kind: "pane", id: `pane-${index}` })),
    surfaceOwnerId: "SURFACE_OWNER_A",
    surfaceCreateCount: 0,
    removalCalls: [],
    referenceReleaseCount: 0,
    surfaceReference: null,
    removalFailures: { ...removalFailures }
  };

  const provider = createPersistentAtlasRetainedSurfaceProvider({
    oneFrameSurfaceProvider() {
      state.surfaceCreateCount += 1;
      const surface =
        surfaceObjectFactory?.(state) ??
        {
          kind: "surface",
          id: `surface-${state.surfaceCreateCount}`
        };
      state.surfaceReference = surface;
      return surface;
    },
    paneProvider() {
      if (state.paneObjects.length === 0) {
        return null;
      }
      if (state.paneObjects.length === 1) {
        return state.paneObjects[0];
      }
      return state.paneObjects;
    },
    canvasProvider() {
      if (state.canvasObjects.length === 1) {
        return state.canvasObjects[0];
      }
      return state.canvasObjects;
    },
    surfaceIdentityProvider() {
      return {
        surfaceOwnerId: state.surfaceOwnerId
      };
    },
    mapIdentityProvider() {
      return state.identity;
    },
    removalProvider({ kind }) {
      state.removalCalls.push(kind);
      if (state.removalFailures[kind]) {
        throw Object.assign(new Error(state.removalFailures[kind]), {
          reasonCode: state.removalFailures[kind]
        });
      }
    },
    referenceReleaseProvider() {
      state.referenceReleaseCount += 1;
      if (state.removalFailures.references) {
        throw Object.assign(new Error(state.removalFailures.references), {
          reasonCode: state.removalFailures.references
        });
      }
    }
  });

  return { provider, state };
}

test("1. defaults unavailable", () => {
  const provider = createPersistentAtlasRetainedSurfaceProvider();
  assert.throws(
    () => acquirePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "RETAINED_SURFACE_PROVIDER_UNAVAILABLE"
  );
});

test("2. wrong dependency types rejected", () => {
  const provider = createPersistentAtlasRetainedSurfaceProvider({
    oneFrameSurfaceProvider: 1,
    paneProvider: 2,
    canvasProvider: 3,
    surfaceIdentityProvider: 4,
    mapIdentityProvider: 5,
    removalProvider: 6,
    referenceReleaseProvider: 7
  });
  assert.throws(
    () => acquirePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "RETAINED_SURFACE_PROVIDER_UNAVAILABLE"
  );
});

test("3. one Canvas acquisition succeeds", () => {
  const { provider } = createHarness();
  const result = acquirePersistentAtlasRetainedSurface(provider);
  assert.equal(result.ownedCanvasCount, 1);
});

test("4. zero-pane surface allowed", () => {
  const { provider } = createHarness({ withPane: false });
  const result = acquirePersistentAtlasRetainedSurface(provider);
  assert.equal(result.ownedPaneCount, 0);
});

test("5. one-pane surface allowed", () => {
  const { provider } = createHarness({ withPane: true });
  const result = acquirePersistentAtlasRetainedSurface(provider);
  assert.equal(result.ownedPaneCount, 1);
});

test("6. missing Canvas rejected", () => {
  const { provider, state } = createHarness();
  state.canvasObjects = [];
  assert.throws(
    () => acquirePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "MISSING_CANVAS"
  );
});

test("7. duplicate Canvas rejected", () => {
  const { provider } = createHarness({ canvasCount: 2 });
  assert.throws(
    () => acquirePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "DUPLICATE_CANVAS"
  );
});

test("8. duplicate pane rejected", () => {
  const { provider } = createHarness({ paneCount: 2 });
  assert.throws(
    () => acquirePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "DUPLICATE_PANE"
  );
});

test("9. duplicate acquisition blocked", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  assert.throws(
    () => acquirePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "DUPLICATE_SURFACE_ACQUISITION"
  );
});

test("10. stable Canvas reused", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  const first = reusePersistentAtlasRetainedSurface(provider);
  const second = reusePersistentAtlasRetainedSurface(provider);
  assert.equal(first.surfaceOwnerId, second.surfaceOwnerId);
});

test("11. stable pane reused", () => {
  const { provider } = createHarness({ withPane: true });
  acquirePersistentAtlasRetainedSurface(provider);
  const result = reusePersistentAtlasRetainedSurface(provider);
  assert.equal(result.ownedPaneCount, 1);
});

test("12. no new surface created during reuse", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  reusePersistentAtlasRetainedSurface(provider);
  reusePersistentAtlasRetainedSurface(provider);
  assert.equal(state.surfaceCreateCount, 1);
});

test("13. owner mismatch rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  state.surfaceOwnerId = "SURFACE_OWNER_B";
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "SURFACE_OWNER_MISMATCH"
  );
});

test("14. map mismatch rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  state.identity = createIdentity({ mapIdentityId: "MAP_B" });
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "MAP_IDENTITY_MISMATCH"
  );
});

test("15. session mismatch rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  state.identity = createIdentity({ sessionId: "SESSION_B" });
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "SESSION_IDENTITY_MISMATCH"
  );
});

test("16. package fingerprint drift rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  state.identity = createIdentity({ packageFingerprint: "fingerprint-b" });
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "PACKAGE_IDENTITY_MISMATCH"
  );
});

test("17. recipe drift rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  state.identity = createIdentity({ recipeVersion: "recipe-v002" });
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "RECIPE_IDENTITY_MISMATCH"
  );
});

test("18. selector-seed drift rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  state.identity = createIdentity({ selectorSeed: "seed-b" });
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "SELECTOR_SEED_MISMATCH"
  );
});

test("19. Canvas identity replacement rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  state.canvasObjects = [{ kind: "canvas", id: "canvas-replaced" }];
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "CANVAS_IDENTITY_MISMATCH"
  );
});

test("20. pane identity replacement rejected", () => {
  const { provider, state } = createHarness({ withPane: true });
  acquirePersistentAtlasRetainedSurface(provider);
  state.paneObjects = [{ kind: "pane", id: "pane-replaced" }];
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "PANE_IDENTITY_MISMATCH"
  );
});

test("21. Canvas missing rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  state.canvasObjects = [];
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "CANVAS_MISSING"
  );
});

test("22. pane missing rejected", () => {
  const { provider, state } = createHarness({ withPane: true });
  acquirePersistentAtlasRetainedSurface(provider);
  state.paneObjects = [];
  assert.throws(
    () => validatePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "PANE_MISSING"
  );
});

test("23. release blocks reuse", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  const releasePromise = releasePersistentAtlasRetainedSurface(provider);
  assert.equal(releasePromise.released, true);
  assert.throws(
    () => reusePersistentAtlasRetainedSurface(provider),
    (error) =>
      error.reasonCode === "INVALID_SURFACE_SHAPE" ||
      error.reasonCode === "SURFACE_RELEASE_IN_PROGRESS"
  );
});

test("24. Canvas removal occurs", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  releasePersistentAtlasRetainedSurface(provider);
  assert.ok(state.removalCalls.includes("canvas"));
});

test("25. pane removal occurs", () => {
  const { provider, state } = createHarness({ withPane: true });
  acquirePersistentAtlasRetainedSurface(provider);
  releasePersistentAtlasRetainedSurface(provider);
  assert.ok(state.removalCalls.includes("pane"));
});

test("26. references clear after removals", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  releasePersistentAtlasRetainedSurface(provider);
  assert.equal(state.referenceReleaseCount, 1);
});

test("27. repeated release harmless", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  const first = releasePersistentAtlasRetainedSurface(provider);
  const second = releasePersistentAtlasRetainedSurface(provider);
  assert.equal(first.released, true);
  assert.equal(second.released, true);
});

test("28. partial release resumable", () => {
  const { provider, state } = createHarness({
    removalFailures: {
      canvas: "CANVAS_REMOVAL_FAILED"
    }
  });
  acquirePersistentAtlasRetainedSurface(provider);
  assert.throws(
    () => releasePersistentAtlasRetainedSurface(provider),
    (error) => error.reasonCode === "CANVAS_REMOVAL_FAILED"
  );
  state.removalFailures = {};
  const result = releasePersistentAtlasRetainedSurface(provider);
  assert.equal(result.released, true);
});

test("29. cleanup failures collected", () => {
  const { provider } = createHarness({
    removalFailures: {
      canvas: "CANVAS_REMOVAL_FAILED",
      pane: "PANE_REMOVAL_FAILED",
      references: "REFERENCE_RELEASE_FAILED"
    }
  });
  acquirePersistentAtlasRetainedSurface(provider);
  try {
    releasePersistentAtlasRetainedSurface(provider);
  } catch {}
  const status = getPersistentAtlasRetainedSurfaceStatus(provider);
  assert.ok(status.cleanupFailureReasons.length >= 1);
});

test("30. zero ownership after successful release", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasRetainedSurface(provider);
  releasePersistentAtlasRetainedSurface(provider);
  const status = getPersistentAtlasRetainedSurfaceStatus(provider);
  assert.equal(status.ownedCanvasCount, 0);
  assert.equal(status.ownedPaneCount, 0);
});

test("31. status immutable and serializable", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasRetainedSurfaceStatus(provider);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("32. no raw references exposed", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasRetainedSurfaceStatus(provider);
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
  assert.equal("surface" in status, false);
  assert.equal("map" in status, false);
});

test("33. no window/document/global fallback", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\b/);
  assert.doesNotMatch(source, /\bdocument\b/);
  assert.doesNotMatch(source, /\bglobalThis\b/);
  assert.doesNotMatch(source, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(source, /getGrowGoMap/);
});

test("34. no live attachment", () => {
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-retained-surface-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-retained-surface-provider/);
});

test("35. no scheduler/listener/controller connection", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /createControlledPersistentAtlasController/);
  assert.doesNotMatch(source, /requestAnimationFrame/);
  assert.doesNotMatch(source, /\.on\(/);
});

test("36. no renderer invocation", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /drawPersistentFrame/);
  assert.doesNotMatch(source, /drawCustom25DMapCanvasWithFrameSnapshot/);
  assert.doesNotMatch(source, /createAtlasRenderer/i);
});

test("37. all four canonical safety flags remain false", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasRetainedSurfaceStatus(provider);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});
