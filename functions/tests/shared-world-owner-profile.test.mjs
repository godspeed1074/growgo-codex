import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadSharedWorldModule() {
  return import(path.join(repoRoot, "functions/lib/domain/world/sharedWorld.js"));
}

function createState(overrides = {}) {
  return {
    pinId: "canonical-base-v1:way:501:0",
    latitude: -38.45,
    longitude: 145.24,
    ownerUid: "obi-cal-account",
    ownerName: "rubberlips",
    ownerAvatarUrl: null,
    ownedAt: new Date("2026-08-28T00:00:00.000Z"),
    level: 1,
    replantEnabled: false,
    plant: null,
    updatedAt: new Date("2026-08-28T00:00:00.000Z"),
    ...overrides
  };
}

test("shared pins use the current account profile for visible owner details", async () => {
  const { reconcileSharedBasePinOwnerProfile } = await loadSharedWorldModule();
  const state = createState();

  const corrected = reconcileSharedBasePinOwnerProfile(state, {
    displayName: "obi-cal",
    avatarUrl: "https://example.com/obi-cal.png"
  });

  assert.equal(corrected.ownerUid, "obi-cal-account");
  assert.equal(corrected.ownerName, "obi-cal");
  assert.equal(corrected.ownerAvatarUrl, "https://example.com/obi-cal.png");
});

test("missing profiles never overwrite a stored owner label", async () => {
  const { reconcileSharedBasePinOwnerProfile } = await loadSharedWorldModule();
  const state = createState();

  assert.equal(reconcileSharedBasePinOwnerProfile(state, null), state);
});
