import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadNamePolicy() {
  return import(
    path.join(repoRoot, "functions/lib/domain/players/playerNamePolicy.js")
  );
}

async function loadDeviceSession() {
  return import(
    path.join(repoRoot, "functions/lib/domain/players/activeDeviceSession.js")
  );
}

test("player-name policy preserves a normal name while normalizing harmless formatting", async () => {
  const policy = await loadNamePolicy();
  const decision = policy.evaluatePlayerNameSafety("  Willow   Walker  ");

  assert.deepEqual(decision, {
    allowed: true,
    normalizedDisplayName: "Willow Walker",
    normalizedJoinedName: "willowwalker",
    reason: "allowed"
  });
});

test("player-name policy blocks reserved titles and obvious disguised abusive names", async () => {
  const policy = await loadNamePolicy();

  assert.equal(policy.evaluatePlayerNameSafety("Queen of Maps").allowed, false);
  assert.equal(policy.evaluatePlayerNameSafety("f.u.c.k").allowed, false);
  assert.equal(policy.evaluatePlayerNameSafety("f.u.c.k-tard").allowed, false);
});

test("private deployment denylist additions receive the same normalization", async () => {
  const policy = await loadNamePolicy();
  const decision = policy.evaluatePlayerNameSafety("Spoiler Guy", {
    additionalBlockedTerms: ["sp0iler guy"]
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "blocked-term");
});

test("active-device gate stays disabled until the explicit private-alpha switch is set", async () => {
  const sessions = await loadDeviceSession();

  assert.equal(sessions.isActiveDeviceSessionEnforced({}), false);
  assert.equal(
    sessions.isActiveDeviceSessionEnforced({
      GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "true"
    }),
    true
  );
});

test("device identifiers must be opaque high-entropy values and are stored only as hashes", async () => {
  const sessions = await loadDeviceSession();
  const deviceId = "A".repeat(24);

  assert.equal(sessions.requireDeviceId(deviceId), deviceId);
  assert.equal(sessions.hashDeviceId(deviceId).length, 64);
  assert.throws(() => sessions.requireDeviceId("too-short"), {
    code: "invalid-argument"
  });
});
