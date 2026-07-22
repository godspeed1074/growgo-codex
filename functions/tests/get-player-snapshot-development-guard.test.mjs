import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getApps } from "firebase-admin/app";
import { Timestamp } from "firebase-admin/firestore";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadGuardModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/security/developmentBackendCapabilityGuard.js"
    )
  );
}

async function loadSnapshotModule() {
  return import(
    path.join(repoRoot, "functions/lib/api/getPlayerSnapshot.js")
  );
}

async function loadPlayerStoreModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/players/playerStore.js")
  );
}

function buildEnv(overrides = {}) {
  return {
    GROWGO_BACKEND_ENVIRONMENT: "development",
    GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "false",
    GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "false",
    ...overrides
  };
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function buildCallableRequest(overrides = {}) {
  return {
    auth: {
      uid: "test-player-001"
    },
    app: null,
    data: {},
    ...overrides
  };
}

test("unauthenticated request is rejected before activation evaluation", async () => {
  const snapshotModule = await loadSnapshotModule();
  let guardCalled = false;
  let readCalled = false;
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {
      guardCalled = true;
    },
    requireOperationalSafeguardAccess() {},
    async readPlayer() {
      readCalled = true;
      throw new Error("read should not occur");
    }
  });

  await assert.rejects(
    handler(buildCallableRequest({ auth: null })),
    (error) => {
      assert.equal(error.code, "unauthenticated");
      assert.equal(
        error.message,
        "Firebase Authentication is required for this callable scaffold."
      );
      return true;
    }
  );

  assert.equal(guardCalled, false);
  assert.equal(readCalled, false);
});

test("missing environment denies", async () => {
  const guardModule = await loadGuardModule();
  const decision =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({ GROWGO_BACKEND_ENVIRONMENT: undefined })
    });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReason, "environment_missing");
});

test("unknown environment denies", async () => {
  const guardModule = await loadGuardModule();
  const decision =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({ GROWGO_BACKEND_ENVIRONMENT: "staging" })
    });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReason, "environment_unknown");
});

test("project mismatch denies", async () => {
  const guardModule = await loadGuardModule();
  const decision =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({ GROWGO_BACKEND_PROJECT_ID: "growgo-beta" })
    });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReason, "project_mismatch");
});

test("beta denies even with all flags true", async () => {
  const guardModule = await loadGuardModule();
  const decision =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({
        GROWGO_BACKEND_ENVIRONMENT: "beta",
        GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
        GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
      })
    });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReason, "environment_not_development");
});

test("production denies even with all flags true", async () => {
  const guardModule = await loadGuardModule();
  const decision =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({
        GROWGO_BACKEND_ENVIRONMENT: "production",
        GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
        GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
      })
    });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReason, "environment_not_development");
});

test("global backend flag false denies", async () => {
  const guardModule = await loadGuardModule();
  const decision =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({
        GROWGO_DEVELOPMENT_BACKEND_ENABLED: "false",
        GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
      })
    });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReason, "backend_flag_disabled");
});

test("snapshot capability flag false denies", async () => {
  const guardModule = await loadGuardModule();
  const decision =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({
        GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
        GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "false"
      })
    });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReason, "capability_flag_disabled");
});

test("invalid boolean values deny", async () => {
  const guardModule = await loadGuardModule();
  const decision =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({
        GROWGO_DEVELOPMENT_BACKEND_ENABLED: "TRUE",
        GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "1"
      })
    });

  assert.equal(decision.allowed, false);
  assert.equal(decision.internalReason, "backend_flag_disabled");
});

test("valid development identity plus both required flags allows the callable to reach existing snapshot logic", async () => {
  const snapshotModule = await loadSnapshotModule();
  const playerStore = await loadPlayerStoreModule();
  const now = Timestamp.fromDate(new Date("2026-07-22T00:00:00.000Z"));
  let readCallCount = 0;
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {},
    requireOperationalSafeguardAccess() {},
    async readPlayer(uid) {
      readCallCount += 1;
      assert.equal(uid, "test-player-001");
      return playerStore.buildDefaultPlayerDocument(now);
    }
  });

  const response = await handler(buildCallableRequest());

  assert.equal(readCallCount, 1);
  assert.deepEqual(response, {
    ok: true,
    player: {
      schemaVersion: 1,
      displayName: null,
      avatarUrl: null,
      level: 1,
      xp: 0,
      coins: 0,
      createdAt: "2026-07-22T00:00:00.000Z",
      updatedAt: "2026-07-22T00:00:00.000Z",
      lastLoginAt: "2026-07-22T00:00:00.000Z"
    },
    appCheck: {
      prepared: true,
      enforced: false,
      verified: false
    }
  });
});

test("denial occurs before any Firestore read", async () => {
  const snapshotModule = await loadSnapshotModule();
  const guardModule = await loadGuardModule();
  let readCallCount = 0;
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {
      guardModule.requireDevelopmentBackendCapabilityAccess({
        capability: "player_snapshot",
        env: buildEnv({
          GROWGO_DEVELOPMENT_BACKEND_ENABLED: "false",
          GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
        })
      });
    },
    requireOperationalSafeguardAccess() {},
    async readPlayer() {
      readCallCount += 1;
      throw new Error("read should not occur");
    }
  });

  await assert.rejects(
    handler(buildCallableRequest()),
    (error) => {
      assert.equal(error.code, "failed-precondition");
      return true;
    }
  );

  assert.equal(readCallCount, 0);
});

test("allowed execution preserves the existing response shape", async () => {
  const snapshotModule = await loadSnapshotModule();
  const playerStore = await loadPlayerStoreModule();
  const now = Timestamp.fromDate(new Date("2026-07-22T01:00:00.000Z"));
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {},
    requireOperationalSafeguardAccess() {},
    async readPlayer() {
      return playerStore.buildDefaultPlayerDocument(now);
    }
  });

  const response = await handler(buildCallableRequest());

  assert.deepEqual(Object.keys(response).sort(), ["appCheck", "ok", "player"]);
  assert.deepEqual(Object.keys(response.player).sort(), [
    "avatarUrl",
    "coins",
    "createdAt",
    "displayName",
    "lastLoginAt",
    "level",
    "schemaVersion",
    "updatedAt",
    "xp"
  ]);
});

test("client error does not expose environment or flag details", async () => {
  const guardModule = await loadGuardModule();

  await assert.rejects(
    async () => {
      guardModule.requireDevelopmentBackendCapabilityAccess({
        capability: "player_snapshot",
        env: buildEnv({
          GROWGO_BACKEND_PROJECT_ID: "growgo-beta",
          GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
          GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
        })
      });
    },
    (error) => {
      assert.equal(error.code, "failed-precondition");
      assert.equal(
        error.message,
        "This development backend capability is not available in the current environment."
      );
      assert.doesNotMatch(error.message, /GROWGO_DEVELOPMENT_BACKEND_ENABLED/);
      assert.doesNotMatch(error.message, /GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED/);
      assert.doesNotMatch(error.message, /growgo-development/);
      assert.doesNotMatch(error.message, /growgo-beta/);
      assert.equal("details" in error && error.details != null, false);
      return true;
    }
  );
});

test("emulator mode still requires loopback identity and flags", async () => {
  const guardModule = await loadGuardModule();
  const denied =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({
        FIRESTORE_EMULATOR_HOST: "10.0.0.1:8088",
        GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
        GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
      })
    });
  const allowed =
    guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
      capability: "player_snapshot",
      env: buildEnv({
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8088",
        GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
        GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
      })
    });

  assert.equal(denied.allowed, false);
  assert.equal(denied.internalReason, "emulator_host_invalid");
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.internalReason, "allowed");
});

test("no metadata-service lookup or Firebase initialization occurs in the guard", async () => {
  const guardModule = await loadGuardModule();
  const firebaseAppCountBefore = getApps().length;
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("unexpected network activity");
  };

  try {
    const decision =
      guardModule.evaluateDevelopmentBackendCapabilityGuardDecision({
        capability: "player_snapshot",
        env: buildEnv({
          GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
          GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
        })
      });

    assert.equal(decision.allowed, true);
    assert.equal(fetchCalled, false);
    assert.equal(getApps().length, firebaseAppCountBefore);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("no live Firebase project is contacted by the denied callable path", async () => {
  const snapshotModule = await loadSnapshotModule();
  const guardModule = await loadGuardModule();
  let readCallCount = 0;
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {
      guardModule.requireDevelopmentBackendCapabilityAccess({
        capability: "player_snapshot",
        env: buildEnv({
          GROWGO_DEVELOPMENT_BACKEND_ENABLED: "false",
          GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true"
        })
      });
    },
    requireOperationalSafeguardAccess() {},
    async readPlayer() {
      readCallCount += 1;
      throw new Error("live read should not occur");
    }
  });

  await assert.rejects(handler(buildCallableRequest()));
  assert.equal(readCallCount, 0);
});

test("no other callable imports or consumes the guard", async () => {
  void (await loadGuardModule());

  assert.match(
    read("functions/src/api/getPlayerSnapshot.ts"),
    /developmentBackendCapabilityGuard/
  );
  assert.doesNotMatch(
    read("functions/src/api/bootstrapPlayer.ts"),
    /developmentBackendCapabilityGuard/
  );
  assert.doesNotMatch(
    read("functions/src/api/capturePin.ts"),
    /developmentBackendCapabilityGuard/
  );
  assert.doesNotMatch(
    read("functions/src/index.ts"),
    /developmentBackendCapabilityGuard/
  );
});

test("capturePin remains unchanged and authoritative-pin acquisition remains inactive", async () => {
  const capturePinSource = read("functions/src/api/capturePin.ts");
  const acquisitionSource = read(
    "functions/src/domain/pins/authoritativePinAcquisition.ts"
  );
  const runtimeConfigSource = read("functions/src/config/runtimeConfig.ts");

  assert.match(
    capturePinSource,
    /createCapturePinHandler\(defaultCapturePinDependencies\)/
  );
  assert.match(
    capturePinSource,
    /createDisabledAuthoritativeSourceTransport\(\)/
  );
  assert.match(
    acquisitionSource,
    /if \(!params\.gates\.enabled\)/
  );
  assert.match(
    runtimeConfigSource,
    /enabled: false/
  );
});
