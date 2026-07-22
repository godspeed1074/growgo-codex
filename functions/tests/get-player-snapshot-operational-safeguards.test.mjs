import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Timestamp } from "firebase-admin/firestore";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadOperationalModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/config/developmentBackendOperationalSafeguards.js"
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

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function buildEnv(overrides = {}) {
  return {
    GROWGO_BACKEND_ENVIRONMENT: "development",
    GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
    GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true",
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
    GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled",
    GROWGO_DEVELOPMENT_BACKEND_LOGGING_LEVEL: "redacted",
    ...overrides
  };
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

test("unauthenticated request is rejected before development or operational safeguard evaluation", async () => {
  const snapshotModule = await loadSnapshotModule();
  let capabilityGuardCalled = false;
  let operationalGuardCalled = false;
  let readCalled = false;
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {
      capabilityGuardCalled = true;
    },
    requireOperationalSafeguardAccess() {
      operationalGuardCalled = true;
    },
    async readPlayer() {
      readCalled = true;
      throw new Error("read should not occur");
    }
  });

  await assert.rejects(
    handler(buildCallableRequest({ auth: null })),
    (error) => error && error.code === "unauthenticated"
  );

  assert.equal(capabilityGuardCalled, false);
  assert.equal(operationalGuardCalled, false);
  assert.equal(readCalled, false);
});

test("operational safeguard emergency disable denies before any player read", async () => {
  const snapshotModule = await loadSnapshotModule();
  const operationalModule = await loadOperationalModule();
  let readCalled = false;
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {},
    requireOperationalSafeguardAccess({ uid }) {
      operationalModule.requireDevelopmentBackendOperationalSafeguardAccess({
        env: buildEnv({
          GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_EMERGENCY_DISABLED: "true"
        }),
        operation: "player_snapshot",
        uid
      });
    },
    async readPlayer() {
      readCalled = true;
      throw new Error("read should not occur");
    }
  });

  await assert.rejects(
    handler(buildCallableRequest()),
    (error) => error && error.code === "failed-precondition"
  );
  assert.equal(readCalled, false);
});

test("operational safeguard rate-limit denial occurs before any player read", async () => {
  const snapshotModule = await loadSnapshotModule();
  const operationalModule = await loadOperationalModule();
  const playerStore = await loadPlayerStoreModule();
  const limiter = operationalModule.createInMemoryDevelopmentBackendOperationalRateLimiter();
  let readCallCount = 0;
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {},
    requireOperationalSafeguardAccess({ uid }) {
      operationalModule.requireDevelopmentBackendOperationalSafeguardAccess({
        env: buildEnv(),
        operation: "player_snapshot",
        uid,
        limiter,
        now: new Date("2026-07-22T12:00:00.000Z")
      });
    },
    async readPlayer() {
      readCallCount += 1;
      return playerStore.buildDefaultPlayerDocument(
        Timestamp.fromDate(new Date("2026-07-22T12:00:00.000Z"))
      );
    }
  });

  for (let index = 0; index < 12; index += 1) {
    await handler(buildCallableRequest());
  }

  await assert.rejects(
    handler(buildCallableRequest()),
    (error) => error && error.code === "failed-precondition"
  );
  assert.equal(readCallCount, 12);
});

test("allowed operational safeguard execution preserves the existing snapshot response shape", async () => {
  const snapshotModule = await loadSnapshotModule();
  const playerStore = await loadPlayerStoreModule();
  const operationalModule = await loadOperationalModule();
  const limiter = operationalModule.createInMemoryDevelopmentBackendOperationalRateLimiter();
  const now = Timestamp.fromDate(new Date("2026-07-22T01:00:00.000Z"));
  const handler = snapshotModule.createGetPlayerSnapshotHandler({
    requireDevelopmentCapabilityAccess() {},
    requireOperationalSafeguardAccess({ uid }) {
      operationalModule.requireDevelopmentBackendOperationalSafeguardAccess({
        env: buildEnv(),
        operation: "player_snapshot",
        uid,
        limiter,
        now: new Date("2026-07-22T01:00:00.000Z")
      });
    },
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

test("only getPlayerSnapshot imports the operational safeguard module", async () => {
  void (await loadOperationalModule());

  assert.match(
    read("functions/src/api/getPlayerSnapshot.ts"),
    /developmentBackendOperationalSafeguards/
  );
  assert.doesNotMatch(
    read("functions/src/api/bootstrapPlayer.ts"),
    /developmentBackendOperationalSafeguards/
  );
  assert.doesNotMatch(
    read("functions/src/api/capturePin.ts"),
    /developmentBackendOperationalSafeguards/
  );
  assert.doesNotMatch(
    read("functions/src/index.ts"),
    /developmentBackendOperationalSafeguards/
  );
});
