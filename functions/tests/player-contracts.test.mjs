import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("bootstrapPlayer only accepts requestId and rejects unsupported authority fields", () => {
  const source = read("functions/src/api/bootstrapPlayer.ts");
  assert.match(source, /assertAllowedKeys\(payload, \["requestId"\], "bootstrapPlayer payload"\)/);
  assert.doesNotMatch(source, /displayName/);
  assert.doesNotMatch(source, /avatarSeed/);
  assert.doesNotMatch(source, /clientBootstrappedAt/);
});

test("getPlayerSnapshot accepts only an empty object", () => {
  const source = read("functions/src/api/getPlayerSnapshot.ts");
  assert.match(source, /assertAllowedKeys\(payload, \[\], "getPlayerSnapshot payload"\)/);
  assert.doesNotMatch(source, /requireRequestId/);
});

test("player defaults and safe snapshot fields stay pinned to the phase contract", async () => {
  const playerStore = await import(path.join(repoRoot, "functions/lib/domain/players/playerStore.js"));
  const { Timestamp } = await import(path.join(repoRoot, "functions/node_modules/firebase-admin/lib/firestore/index.js"));

  const now = Timestamp.fromDate(new Date("2026-07-21T00:00:00.000Z"));
  const player = playerStore.buildDefaultPlayerDocument(now);
  const snapshot = playerStore.serializePlayerSnapshot(player);

  assert.deepEqual(player, {
    schemaVersion: 1,
    displayName: null,
    avatarUrl: null,
    level: 1,
    xp: 0,
    coins: 0,
    createdAt: new Date("2026-07-21T00:00:00.000Z"),
    updatedAt: new Date("2026-07-21T00:00:00.000Z"),
    lastLoginAt: new Date("2026-07-21T00:00:00.000Z")
  });

  assert.deepEqual(snapshot, {
    schemaVersion: 1,
    displayName: null,
    avatarUrl: null,
    level: 1,
    xp: 0,
    coins: 0,
    createdAt: "2026-07-21T00:00:00.000Z",
    updatedAt: "2026-07-21T00:00:00.000Z",
    lastLoginAt: "2026-07-21T00:00:00.000Z"
  });

  assert.equal("playerId" in snapshot, false);
  assert.equal("profileStatus" in snapshot, false);
  assert.equal("progressionVisibility" in snapshot, false);
});
