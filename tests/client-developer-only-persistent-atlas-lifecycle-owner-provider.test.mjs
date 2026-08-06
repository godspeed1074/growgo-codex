import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  acquirePersistentAtlasLifecycleOwner,
  createPersistentAtlasLifecycleOwnerProvider,
  getPersistentAtlasLifecycleOwnerStatus,
  releasePersistentAtlasLifecycleOwner,
  reusePersistentAtlasLifecycleOwner,
  validatePersistentAtlasLifecycleOwner
} from "../client/developer-only-persistent-atlas-lifecycle-owner-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-lifecycle-owner-provider.mjs"
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
  ownerResultFactory = null,
  ownerId = "LIFECYCLE_OWNER_A",
  lifecycleGenerationId = "GEN_A",
  surfaceOwnerId = "SURFACE_OWNER_A",
  translationFactory = null,
  releaseFailures = {}
} = {}) {
  const lifecycleOwner = { kind: "lifecycle-owner", id: ownerId };
  const state = {
    identity: createIdentity(),
    lifecycleOwner,
    ownerId,
    lifecycleGenerationId,
    surfaceOwnerId,
    acquireCalls: 0,
    translationCalls: 0,
    lifecycleReleaseCalls: 0,
    referenceReleaseCalls: 0,
    releaseFailures: { ...releaseFailures }
  };

  const provider = createPersistentAtlasLifecycleOwnerProvider({
    oneFrameLifecycleOwnerProvider() {
      state.acquireCalls += 1;
      if (ownerResultFactory) {
        return ownerResultFactory(state);
      }
      return {
        lifecycleOwner: state.lifecycleOwner,
        lifecycleOwnerId: state.ownerId,
        lifecycleGenerationId: state.lifecycleGenerationId,
        surfaceOwnerId: state.surfaceOwnerId
      };
    },
    lifecycleTranslationProvider({ lifecycleOwner }) {
      state.translationCalls += 1;
      if (translationFactory) {
        return translationFactory(state, lifecycleOwner);
      }
      return {
        lifecycleOwnerId: state.ownerId,
        lifecycleGenerationId: state.lifecycleGenerationId,
        surfaceOwnerId: state.surfaceOwnerId,
        translationStatus: "scalar_only",
        lifecycleState: "retained"
      };
    },
    lifecycleIdentityProvider() {
      return {
        lifecycleOwnerId: state.ownerId,
        lifecycleGenerationId: state.lifecycleGenerationId,
        surfaceOwnerId: state.surfaceOwnerId
      };
    },
    lifecycleReleaseProvider() {
      state.lifecycleReleaseCalls += 1;
      if (state.releaseFailures.lifecycle) {
        throw Object.assign(new Error(state.releaseFailures.lifecycle), {
          reasonCode: state.releaseFailures.lifecycle
        });
      }
      return { released: true };
    },
    referenceReleaseProvider() {
      state.referenceReleaseCalls += 1;
      if (state.releaseFailures.references) {
        throw Object.assign(new Error(state.releaseFailures.references), {
          reasonCode: state.releaseFailures.references
        });
      }
      return { released: true };
    },
    mapIdentityProvider() {
      return state.identity;
    }
  });

  return { provider, state };
}

test("1. defaults unavailable", () => {
  const provider = createPersistentAtlasLifecycleOwnerProvider();
  assert.throws(
    () => acquirePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "LIFECYCLE_OWNER_PROVIDER_UNAVAILABLE"
  );
});

test("2. one fake lifecycle owner acquires successfully", () => {
  const { provider } = createHarness();
  const result = acquirePersistentAtlasLifecycleOwner(provider);
  assert.equal(result.lifecycleOwnerId, "LIFECYCLE_OWNER_A");
  assert.equal(result.ownedLifecycleOwnerCount, 1);
});

test("3. duplicate owner bundle is rejected", () => {
  const { provider } = createHarness({
    ownerResultFactory: () => ({
      lifecycleOwners: [{ id: "A" }, { id: "B" }]
    })
  });
  assert.throws(
    () => acquirePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "DUPLICATE_LIFECYCLE_OWNER"
  );
});

test("4. missing lifecycle owner is rejected", () => {
  const { provider } = createHarness({
    ownerResultFactory: () => null
  });
  assert.throws(
    () => acquirePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "MISSING_LIFECYCLE_OWNER"
  );
});

test("5. invalid lifecycle owner shape is rejected", () => {
  const { provider } = createHarness({
    ownerResultFactory: () => ({
      lifecycleOwner: "bad",
      lifecycleOwnerId: null,
      lifecycleGenerationId: null,
      surfaceOwnerId: null
    })
  });
  assert.throws(
    () => acquirePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "INVALID_LIFECYCLE_OWNER_SHAPE"
  );
});

test("6. duplicate acquisition is rejected", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  assert.throws(
    () => acquirePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "DUPLICATE_LIFECYCLE_OWNER_ACQUISITION"
  );
});

test("7. unchanged owner validates and reuses", () => {
  const { provider, state } = createHarness();
  const acquired = acquirePersistentAtlasLifecycleOwner(provider);
  const validated = validatePersistentAtlasLifecycleOwner(provider);
  const reused = reusePersistentAtlasLifecycleOwner(provider);
  assert.equal(acquired.lifecycleOwnerId, validated.lifecycleOwnerId);
  assert.equal(validated.lifecycleGenerationId, reused.lifecycleGenerationId);
  assert.equal(state.acquireCalls, 1);
});

test("8. owner id mismatch is rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  state.ownerId = "LIFECYCLE_OWNER_B";
  assert.throws(
    () => validatePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "LIFECYCLE_OWNER_ID_MISMATCH"
  );
});

test("9. generation mismatch is rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  state.lifecycleGenerationId = "GEN_B";
  assert.throws(
    () => validatePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "LIFECYCLE_GENERATION_MISMATCH"
  );
});

test("10. surface owner mismatch is rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  state.surfaceOwnerId = "SURFACE_OWNER_B";
  assert.throws(
    () => validatePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "SURFACE_OWNER_MISMATCH"
  );
});

test("11. map identity mismatch is rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  state.identity = createIdentity({ mapIdentityId: "MAP_B" });
  assert.throws(
    () => validatePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "MAP_IDENTITY_MISMATCH"
  );
});

test("12. session mismatch is rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  state.identity = createIdentity({ sessionId: "SESSION_B" });
  assert.throws(
    () => validatePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "SESSION_IDENTITY_MISMATCH"
  );
});

test("13. package mismatch is rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  state.identity = createIdentity({ packageFingerprint: "fingerprint-b" });
  assert.throws(
    () => validatePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "PACKAGE_IDENTITY_MISMATCH"
  );
});

test("14. recipe mismatch is rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  state.identity = createIdentity({ recipeVersion: "recipe-v002" });
  assert.throws(
    () => validatePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "RECIPE_IDENTITY_MISMATCH"
  );
});

test("15. selector mismatch is rejected", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  state.identity = createIdentity({ selectorSeed: "seed-b" });
  assert.throws(
    () => validatePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "SELECTOR_SEED_MISMATCH"
  );
});

test("16. translation identity mismatch is rejected", () => {
  const { provider } = createHarness({
    translationFactory: () => ({
      lifecycleOwnerId: "WRONG",
      lifecycleGenerationId: "GEN_A",
      surfaceOwnerId: "SURFACE_OWNER_A"
    })
  });
  assert.throws(
    () => acquirePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "LIFECYCLE_TRANSLATION_IDENTITY_MISMATCH"
  );
});

test("17. forbidden raw browser references are rejected", () => {
  const { provider } = createHarness({
    translationFactory: () => ({
      lifecycleOwnerId: "LIFECYCLE_OWNER_A",
      lifecycleGenerationId: "GEN_A",
      surfaceOwnerId: "SURFACE_OWNER_A",
      canvas: { nodeName: "CANVAS" }
    })
  });
  assert.throws(
    () => acquirePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "RAW_BROWSER_REFERENCE_DETECTED"
  );
});

test("18. translation with function callback is rejected", () => {
  const { provider } = createHarness({
    translationFactory: () => ({
      lifecycleOwnerId: "LIFECYCLE_OWNER_A",
      lifecycleGenerationId: "GEN_A",
      surfaceOwnerId: "SURFACE_OWNER_A",
      callback: () => {}
    })
  });
  assert.throws(
    () => acquirePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "RAW_BROWSER_REFERENCE_DETECTED"
  );
});

test("19. scalar translation is frozen and serializable", () => {
  const { provider } = createHarness({
    translationFactory: () => ({
      lifecycleOwnerId: "LIFECYCLE_OWNER_A",
      lifecycleGenerationId: "GEN_A",
      surfaceOwnerId: "SURFACE_OWNER_A",
      summary: {
        phase: "persistent",
        mode: "scalar"
      }
    })
  });
  acquirePersistentAtlasLifecycleOwner(provider);
  const status = getPersistentAtlasLifecycleOwnerStatus(provider);
  assert.equal(status.cycleSafeTranslationUsed, true);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("20. cyclic browser-shaped source can still translate safely through scalar boundary", () => {
  const { provider } = createHarness({
    translationFactory: (_state, lifecycleOwner) => {
      const cycle = { owner: lifecycleOwner };
      cycle.self = cycle;
      return {
        lifecycleOwnerId: "LIFECYCLE_OWNER_A",
        lifecycleGenerationId: "GEN_A",
        surfaceOwnerId: "SURFACE_OWNER_A",
        summary: {
          cycleDetectedAtSource: true
        }
      };
    }
  });
  const result = acquirePersistentAtlasLifecycleOwner(provider);
  assert.equal(result.lifecycleGenerationId, "GEN_A");
});

test("21. lifecycle release runs once on success", () => {
  const { provider, state } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  const released = releasePersistentAtlasLifecycleOwner(provider);
  assert.equal(released.released, true);
  assert.equal(state.lifecycleReleaseCalls, 1);
  assert.equal(state.referenceReleaseCalls, 1);
});

test("22. repeated release is harmless", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  const first = releasePersistentAtlasLifecycleOwner(provider);
  const second = releasePersistentAtlasLifecycleOwner(provider);
  assert.equal(first.released, true);
  assert.equal(second.released, true);
});

test("23. partial release is resumable", () => {
  const { provider, state } = createHarness({
    releaseFailures: {
      lifecycle: "LIFECYCLE_OWNER_RELEASE_FAILED"
    }
  });
  acquirePersistentAtlasLifecycleOwner(provider);
  assert.throws(
    () => releasePersistentAtlasLifecycleOwner(provider),
    (error) => error.reasonCode === "LIFECYCLE_OWNER_RELEASE_FAILED"
  );
  state.releaseFailures = {};
  const result = releasePersistentAtlasLifecycleOwner(provider);
  assert.equal(result.released, true);
});

test("24. release failures are collected in status", () => {
  const { provider } = createHarness({
    releaseFailures: {
      lifecycle: "LIFECYCLE_OWNER_RELEASE_FAILED",
      references: "REFERENCE_RELEASE_FAILED"
    }
  });
  acquirePersistentAtlasLifecycleOwner(provider);
  try {
    releasePersistentAtlasLifecycleOwner(provider);
  } catch {}
  const status = getPersistentAtlasLifecycleOwnerStatus(provider);
  assert.ok(status.cleanupFailureReasons.length >= 1);
});

test("25. released status clears ownership", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  releasePersistentAtlasLifecycleOwner(provider);
  const status = getPersistentAtlasLifecycleOwnerStatus(provider);
  assert.equal(status.ownedLifecycleOwnerCount, 0);
  assert.equal(status.lifecycleOwnerPresent, false);
  assert.equal(status.lifecycleTranslationPresent, false);
});

test("26. no raw references exposed in diagnostics", () => {
  const { provider } = createHarness();
  acquirePersistentAtlasLifecycleOwner(provider);
  const status = getPersistentAtlasLifecycleOwnerStatus(provider);
  assert.equal("lifecycleOwner" in status, false);
  assert.equal("translation" in status, false);
  assert.equal("map" in status, false);
  assert.equal("canvas" in status, false);
  assert.equal("pane" in status, false);
});

test("27. status is frozen and serializable", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasLifecycleOwnerStatus(provider);
  assert.equal(Object.isFrozen(status), true);
  assert.equal(typeof JSON.stringify(status), "string");
});

test("28. module has no browser or diagnostics fallbacks", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /\bwindow\./);
  assert.doesNotMatch(source, /\bdocument\./);
  assert.doesNotMatch(source, /\bglobalThis\b(?!["'])/);
  assert.doesNotMatch(source, /GrowGoDeveloperDiagnostics/);
  assert.doesNotMatch(source, /getGrowGoMap/);
});

test("29. module is not wired into startup or script", () => {
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-lifecycle-owner-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-lifecycle-owner-provider/);
});

test("30. no scheduler listener or draw wiring exists here", () => {
  const source = fs.readFileSync(modulePath, "utf8");
  assert.doesNotMatch(source, /requestAnimationFrame/);
  assert.doesNotMatch(source, /\.on\(/);
  assert.doesNotMatch(source, /drawCustom25DMapCanvasWithFrameSnapshot/);
});

test("31. all canonical safety flags remain false", () => {
  const { provider } = createHarness();
  const status = getPersistentAtlasLifecycleOwnerStatus(provider);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});
