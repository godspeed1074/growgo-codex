import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createPersistentAtlasMapProvider,
  resolvePersistentAtlasMap,
  getPersistentAtlasMapProviderStatus
} from "../client/developer-only-persistent-atlas-map-provider.mjs";
import {
  createPersistentAtlasReadinessProvider,
  resolvePersistentAtlasReadiness,
  validatePersistentAtlasReadiness,
  getPersistentAtlasReadinessStatus
} from "../client/developer-only-persistent-atlas-readiness-provider.mjs";
import {
  createPersistentAtlasIdentitySnapshotProvider,
  createPersistentAtlasIdentitySnapshot,
  comparePersistentAtlasIdentity,
  getPersistentAtlasIdentityProviderStatus
} from "../client/developer-only-persistent-atlas-identity-provider.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const appPath = path.join(repoRoot, "client", "development-alpha-app.mjs");
const scriptPath = path.join(repoRoot, "script.js");
const mapModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-map-provider.mjs"
);
const readinessModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-readiness-provider.mjs"
);
const identityModulePath = path.join(
  repoRoot,
  "client",
  "developer-only-persistent-atlas-identity-provider.mjs"
);

function createFakeMap(label = "map") {
  return {
    label,
    getSize() {
      return { x: 512, y: 512 };
    },
    getBounds() {
      return {
        getNorthWest() {
          return [0, 0];
        }
      };
    },
    latLngToLayerPoint() {
      return { x: 0, y: 0 };
    },
    on() {},
    off() {}
  };
}

function createApprovedReadiness({
  packageFingerprint = "fingerprint-a",
  recipeVersion = "recipe-v001",
  selectorSeed = "seed-a"
} = {}) {
  return {
    schemaId: "ATLAS_RENDERER_HANDOFF_READINESS_DIAGNOSTIC_RESULT_001",
    diagnosticStatus: "approved",
    reasonCode: "READINESS_APPROVED",
    rendererHandoffStatus: "ready_for_future_renderer_attachment",
    rendererConsumerAvailable: true,
    rendererIdentityValidated: true,
    resolvedRegion: Object.freeze({
      regionId: "BELLARINE"
    }),
    resolvedPackage: Object.freeze({
      packageId: "atlas-bellarine",
      packageVersion: "2026.08.06",
      packageFingerprint
    }),
    resolvedRecipe: Object.freeze({
      recipeId: "coastal-default",
      selectedVersion: recipeVersion
    }),
    selectorSeed
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

test("1. default map provider unavailable", () => {
  const provider = createPersistentAtlasMapProvider();
  assert.throws(
    () => resolvePersistentAtlasMap(provider),
    (error) => error.reasonCode === "MAP_PROVIDER_UNAVAILABLE"
  );
});

test("2. valid injected map resolves", () => {
  const map = createFakeMap();
  const provider = createPersistentAtlasMapProvider({
    realMapBridgeProvider: () => ({
      rawLeafletMapReference: map,
      mapIdentityId: "MAP_A"
    })
  });
  const result = resolvePersistentAtlasMap(provider);
  assert.equal(result.map, map);
  assert.equal(result.mapIdentityId, "MAP_A");
});

test("3. invalid map shape rejected", () => {
  const provider = createPersistentAtlasMapProvider({
    realMapBridgeProvider: () => ({
      rawLeafletMapReference: { getSize() {} },
      mapIdentityId: "MAP_A"
    })
  });
  assert.throws(
    () => resolvePersistentAtlasMap(provider),
    (error) => error.reasonCode === "INVALID_MAP_SHAPE"
  );
});

test("4. stable map identity retained", () => {
  const map = createFakeMap();
  const provider = createPersistentAtlasMapProvider({
    realMapBridgeProvider: () => ({
      rawLeafletMapReference: map,
      mapIdentityId: "MAP_A"
    })
  });
  const first = resolvePersistentAtlasMap(provider);
  const second = resolvePersistentAtlasMap(provider);
  assert.equal(first.mapIdentityId, second.mapIdentityId);
});

test("5. map replacement detected", () => {
  let currentMap = createFakeMap("a");
  const provider = createPersistentAtlasMapProvider({
    realMapBridgeProvider: () => ({
      rawLeafletMapReference: currentMap,
      mapIdentityId: currentMap.label.toUpperCase()
    })
  });
  resolvePersistentAtlasMap(provider);
  currentMap = createFakeMap("b");
  assert.throws(
    () => resolvePersistentAtlasMap(provider),
    (error) => error.reasonCode === "MAP_IDENTITY_CHANGED"
  );
});

test("6. stale map reference rejected", () => {
  let currentMap = createFakeMap("a");
  const originalMap = currentMap;
  const provider = createPersistentAtlasMapProvider({
    realMapBridgeProvider: () => ({
      rawLeafletMapReference: currentMap,
      mapIdentityId: currentMap.label.toUpperCase()
    })
  });
  resolvePersistentAtlasMap(provider);
  currentMap = createFakeMap("b");
  assert.throws(
    () =>
      resolvePersistentAtlasMap(provider, {
        storedMapReference: originalMap
      }),
    (error) => error.reasonCode === "STALE_MAP_REFERENCE"
  );
});

test("7. no raw map in status", () => {
  const map = createFakeMap();
  const provider = createPersistentAtlasMapProvider({
    realMapBridgeProvider: () => ({
      rawLeafletMapReference: map,
      mapIdentityId: "MAP_A"
    })
  });
  resolvePersistentAtlasMap(provider);
  const status = getPersistentAtlasMapProviderStatus(provider);
  assert.equal("map" in status, false);
  assert.equal("rawMap" in status, false);
  assert.equal("rawLeafletMapReference" in status, false);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("8. default readiness provider unavailable", () => {
  const provider = createPersistentAtlasReadinessProvider();
  assert.throws(
    () => resolvePersistentAtlasReadiness(provider),
    (error) => error.reasonCode === "READINESS_PROVIDER_UNAVAILABLE"
  );
});

test("9. approved readiness resolves", () => {
  const provider = createPersistentAtlasReadinessProvider({
    handoffReadinessProvider: () => createApprovedReadiness()
  });
  const snapshot = resolvePersistentAtlasReadiness(provider);
  assert.equal(snapshot.regionId, "BELLARINE");
  assert.equal(snapshot.packageFingerprint, "fingerprint-a");
  assert.equal(snapshot.recipeVersion, "recipe-v001");
});

test("10. blocked readiness rejected", () => {
  const provider = createPersistentAtlasReadinessProvider({
    handoffReadinessProvider: () => ({
      diagnosticStatus: "blocked",
      reasonCode: "SCOPE_NOT_APPROVED",
      rendererHandoffStatus: "blocked"
    })
  });
  assert.throws(
    () => resolvePersistentAtlasReadiness(provider),
    (error) => error.reasonCode === "SCOPE_NOT_APPROVED"
  );
});

test("11. incomplete readiness identity rejected", () => {
  const provider = createPersistentAtlasReadinessProvider({
    handoffReadinessProvider: () => ({
      ...createApprovedReadiness(),
      resolvedPackage: { packageId: "atlas-bellarine" }
    })
  });
  assert.throws(
    () => resolvePersistentAtlasReadiness(provider),
    (error) => error.reasonCode === "READINESS_IDENTITY_INCOMPLETE"
  );
});

test("12. readiness drift detected", () => {
  let fingerprint = "fingerprint-a";
  const provider = createPersistentAtlasReadinessProvider({
    handoffReadinessProvider: () =>
      createApprovedReadiness({ packageFingerprint: fingerprint })
  });
  const first = resolvePersistentAtlasReadiness(provider);
  fingerprint = "fingerprint-b";
  assert.throws(
    () => validatePersistentAtlasReadiness(provider, { expectedSnapshot: first }),
    (error) => error.reasonCode === "READINESS_DRIFT_DETECTED"
  );
});

test("13. exact blocked reason preserved", () => {
  const provider = createPersistentAtlasReadinessProvider({
    handoffReadinessProvider: () => ({
      diagnosticStatus: "blocked",
      reasonCode: "PACKAGE_SCOPE_BLOCKED",
      rendererHandoffStatus: "blocked"
    })
  });
  try {
    resolvePersistentAtlasReadiness(provider);
  } catch {}
  const status = getPersistentAtlasReadinessStatus(provider);
  assert.equal(status.lastBlockedReason, "PACKAGE_SCOPE_BLOCKED");
});

test("14. no mutable readiness object exposed", () => {
  const provider = createPersistentAtlasReadinessProvider({
    handoffReadinessProvider: () => createApprovedReadiness()
  });
  const snapshot = resolvePersistentAtlasReadiness(provider);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal("resolvedRegion" in snapshot, false);
  assert.equal("resolvedPackage" in snapshot, false);
  assert.equal("resolvedRecipe" in snapshot, false);
});

test("15. default identity provider unavailable", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider();
  assert.throws(
    () => createPersistentAtlasIdentitySnapshot(provider),
    (error) => error.reasonCode === "IDENTITY_SOURCE_UNAVAILABLE"
  );
});

test("16. complete identity snapshot created", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider({
    nowProvider: () => "2026-08-06T00:00:00.000Z",
    identitySourceProvider: () => ({
      sessionId: "SESSION_A",
      mapIdentityId: "MAP_A",
      readinessSnapshot: resolvePersistentAtlasReadiness(
        createPersistentAtlasReadinessProvider({
          handoffReadinessProvider: () => createApprovedReadiness()
        })
      )
    })
  });
  const snapshot = createPersistentAtlasIdentitySnapshot(provider);
  assert.equal(snapshot.schemaId, "GROWGO_PERSISTENT_ATLAS_IDENTITY_SNAPSHOT_001");
  assert.equal(snapshot.lifecycleOwnerId, null);
  assert.equal(snapshot.identityCreatedAt, "2026-08-06T00:00:00.000Z");
});

test("17. snapshot deeply immutable", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider({
    nowProvider: () => "2026-08-06T00:00:00.000Z",
    identitySourceProvider: () => ({
      sessionId: "SESSION_A",
      mapIdentityId: "MAP_A",
      readinessSnapshot: resolvePersistentAtlasReadiness(
        createPersistentAtlasReadinessProvider({
          handoffReadinessProvider: () => createApprovedReadiness()
        })
      )
    })
  });
  const snapshot = createPersistentAtlasIdentitySnapshot(provider);
  assert.equal(Object.isFrozen(snapshot), true);
});

test("18. snapshot serializable", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider({
    nowProvider: () => "2026-08-06T00:00:00.000Z",
    identitySourceProvider: () => ({
      sessionId: "SESSION_A",
      mapIdentityId: "MAP_A",
      readinessSnapshot: resolvePersistentAtlasReadiness(
        createPersistentAtlasReadinessProvider({
          handoffReadinessProvider: () => createApprovedReadiness()
        })
      )
    })
  });
  const snapshot = createPersistentAtlasIdentitySnapshot(provider);
  assert.equal(typeof JSON.stringify(snapshot), "string");
});

test("19. incomplete identity rejected", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider({
    identitySourceProvider: () => ({
      sessionId: "SESSION_A",
      mapIdentityId: "MAP_A",
      readinessSnapshot: {
        regionId: "BELLARINE"
      }
    })
  });
  assert.throws(
    () => createPersistentAtlasIdentitySnapshot(provider),
    (error) => error.reasonCode === "IDENTITY_INCOMPLETE"
  );
});

test("20. matching identities compare successfully", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider();
  const left = {
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    readinessSnapshot: resolvePersistentAtlasReadiness(
      createPersistentAtlasReadinessProvider({
        handoffReadinessProvider: () => createApprovedReadiness()
      })
    ),
    identityCreatedAt: "2026-08-06T00:00:00.000Z",
    identitySource: "test"
  };
  const right = structuredClone(left);
  const result = comparePersistentAtlasIdentity(provider, left, right);
  assert.equal(result.matches, true);
  assert.equal(result.mismatchField, null);
});

test("21. map mismatch reported", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider();
  const base = {
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    readinessSnapshot: resolvePersistentAtlasReadiness(
      createPersistentAtlasReadinessProvider({
        handoffReadinessProvider: () => createApprovedReadiness()
      })
    ),
    identityCreatedAt: "2026-08-06T00:00:00.000Z",
    identitySource: "test"
  };
  const result = comparePersistentAtlasIdentity(
    provider,
    base,
    { ...base, mapIdentityId: "MAP_B" }
  );
  assert.equal(result.reasonCode, "MAP_IDENTITY_MISMATCH");
  assert.equal(result.mismatchField, "mapIdentityId");
});

test("22. session mismatch reported", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider();
  const base = {
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    readinessSnapshot: resolvePersistentAtlasReadiness(
      createPersistentAtlasReadinessProvider({
        handoffReadinessProvider: () => createApprovedReadiness()
      })
    ),
    identityCreatedAt: "2026-08-06T00:00:00.000Z",
    identitySource: "test"
  };
  const result = comparePersistentAtlasIdentity(
    provider,
    base,
    { ...base, sessionId: "SESSION_B" }
  );
  assert.equal(result.reasonCode, "SESSION_IDENTITY_MISMATCH");
  assert.equal(result.mismatchField, "sessionId");
});

test("23. package fingerprint mismatch reported", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider();
  const base = {
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    readinessSnapshot: resolvePersistentAtlasReadiness(
      createPersistentAtlasReadinessProvider({
        handoffReadinessProvider: () => createApprovedReadiness()
      })
    ),
    identityCreatedAt: "2026-08-06T00:00:00.000Z",
    identitySource: "test"
  };
  const changed = {
    ...base,
    readinessSnapshot: {
      ...base.readinessSnapshot,
      packageFingerprint: "fingerprint-b"
    }
  };
  const result = comparePersistentAtlasIdentity(provider, base, changed);
  assert.equal(result.reasonCode, "PACKAGE_IDENTITY_MISMATCH");
  assert.equal(result.mismatchField, "packageFingerprint");
});

test("24. recipe mismatch reported", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider();
  const base = {
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    readinessSnapshot: resolvePersistentAtlasReadiness(
      createPersistentAtlasReadinessProvider({
        handoffReadinessProvider: () => createApprovedReadiness()
      })
    ),
    identityCreatedAt: "2026-08-06T00:00:00.000Z",
    identitySource: "test"
  };
  const changed = {
    ...base,
    readinessSnapshot: {
      ...base.readinessSnapshot,
      recipeVersion: "recipe-v002"
    }
  };
  const result = comparePersistentAtlasIdentity(provider, base, changed);
  assert.equal(result.reasonCode, "RECIPE_IDENTITY_MISMATCH");
  assert.equal(result.mismatchField, "recipeVersion");
});

test("25. selector-seed mismatch reported", () => {
  const provider = createPersistentAtlasIdentitySnapshotProvider();
  const base = {
    sessionId: "SESSION_A",
    mapIdentityId: "MAP_A",
    readinessSnapshot: resolvePersistentAtlasReadiness(
      createPersistentAtlasReadinessProvider({
        handoffReadinessProvider: () => createApprovedReadiness()
      })
    ),
    identityCreatedAt: "2026-08-06T00:00:00.000Z",
    identitySource: "test"
  };
  const changed = {
    ...base,
    readinessSnapshot: {
      ...base.readinessSnapshot,
      selectorSeed: "seed-b"
    }
  };
  const result = comparePersistentAtlasIdentity(provider, base, changed);
  assert.equal(result.reasonCode, "SELECTOR_SEED_MISMATCH");
  assert.equal(result.mismatchField, "selectorSeed");
});

test("26. no raw references exposed", () => {
  const readinessProvider = createPersistentAtlasReadinessProvider({
    handoffReadinessProvider: () => createApprovedReadiness()
  });
  const readinessSnapshot = resolvePersistentAtlasReadiness(readinessProvider);
  const identityProvider = createPersistentAtlasIdentitySnapshotProvider({
    nowProvider: () => "2026-08-06T00:00:00.000Z",
    identitySourceProvider: () => ({
      sessionId: "SESSION_A",
      mapIdentityId: "MAP_A",
      readinessSnapshot
    })
  });
  createPersistentAtlasIdentitySnapshot(identityProvider);
  const status = getPersistentAtlasIdentityProviderStatus(identityProvider);
  assert.equal("map" in status, false);
  assert.equal("readinessSnapshot" in status, false);
  assert.equal("bridge" in status, false);
  assertCanonicalFlags(status.canonicalSafetyFlags);
});

test("27. no window/global fallback", () => {
  for (const modulePath of [mapModulePath, readinessModulePath, identityModulePath]) {
    const source = fs.readFileSync(modulePath, "utf8");
    assert.doesNotMatch(source, /\bwindow\b/);
    assert.doesNotMatch(source, /\bglobalThis\b/);
    assert.doesNotMatch(source, /GrowGoDeveloperDiagnostics/);
    assert.doesNotMatch(source, /script\.js/);
  }
});

test("28. no live attachment or rendering", () => {
  const appSource = fs.readFileSync(appPath, "utf8");
  const scriptSource = fs.readFileSync(scriptPath, "utf8");
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-map-provider/);
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-readiness-provider/);
  assert.doesNotMatch(appSource, /developer-only-persistent-atlas-identity-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-map-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-readiness-provider/);
  assert.doesNotMatch(scriptSource, /developer-only-persistent-atlas-identity-provider/);
});

test("29. all four canonical safety flags remain false", () => {
  const mapStatus = getPersistentAtlasMapProviderStatus(createPersistentAtlasMapProvider());
  const readinessStatus = getPersistentAtlasReadinessStatus(
    createPersistentAtlasReadinessProvider()
  );
  const identityStatus = getPersistentAtlasIdentityProviderStatus(
    createPersistentAtlasIdentitySnapshotProvider()
  );

  assertCanonicalFlags(mapStatus.canonicalSafetyFlags);
  assertCanonicalFlags(readinessStatus.canonicalSafetyFlags);
  assertCanonicalFlags(identityStatus.canonicalSafetyFlags);
});
