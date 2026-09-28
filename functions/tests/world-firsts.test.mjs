import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadWorldFirstModule() {
  return import(path.join(repoRoot, "functions/lib/domain/achievements/worldFirsts.js"));
}

test("the first high-value completion opens a shared sixty-second World First window", async () => {
  const worldFirsts = await loadWorldFirstModule();
  const now = new Date("2026-09-06T00:00:00.000Z");
  const award = worldFirsts.resolveWorldFirstAward({
    achievementId: "achievement-great-ocean-road",
    uid: "first-player",
    now,
    stored: null
  });

  assert.equal(award?.kind, "first");
  assert.equal(award?.firstCompletedAt.getTime(), now.getTime());
  assert.equal(award?.sharedWindowEndsAt.getTime(), now.getTime() + 60_000);
});

test("other players completing inside the sixty-second window share the World First", async () => {
  const worldFirsts = await loadWorldFirstModule();
  const firstCompletedAt = new Date("2026-09-06T00:00:00.000Z");
  const sharedWindowEndsAt = new Date(firstCompletedAt.getTime() + 60_000);
  const stored = {
    achievementId: "achievement-great-ocean-road",
    firstPlayerUid: "first-player",
    firstCompletedAt,
    sharedWindowEndsAt,
    recipientCount: 1
  };

  const shared = worldFirsts.resolveWorldFirstAward({
    achievementId: "achievement-great-ocean-road",
    uid: "second-player",
    now: new Date(firstCompletedAt.getTime() + 60_000),
    stored
  });
  const tooLate = worldFirsts.resolveWorldFirstAward({
    achievementId: "achievement-great-ocean-road",
    uid: "third-player",
    now: new Date(firstCompletedAt.getTime() + 60_001),
    stored
  });

  assert.equal(shared?.kind, "shared");
  assert.equal(tooLate, null);
});

test("World Firsts retain the approved fifty-point minimum", async () => {
  const worldFirsts = await loadWorldFirstModule();
  const award = worldFirsts.resolveWorldFirstAward({
    achievementId: "poi-discover-1",
    uid: "player",
    now: new Date("2026-09-06T00:00:00.000Z"),
    stored: null
  });

  assert.equal(award, null);
});

test("only the first recipient creates the public-safe live announcement", async () => {
  const worldFirsts = await loadWorldFirstModule();
  const now = new Date("2026-09-06T00:00:00.000Z");
  const firstAward = worldFirsts.resolveWorldFirstAward({
    achievementId: "achievement-albert-park-grand-prix-circuit",
    uid: "winner",
    now,
    stored: null
  });

  const announcement = worldFirsts.buildWorldFirstAnnouncementStorage({
    achievementId: "achievement-albert-park-grand-prix-circuit",
    winnerName: "  Fast   Farmer  ",
    now,
    award: firstAward
  });

  assert.equal(announcement.eventId, "achievement-albert-park-grand-prix-circuit:2026-09-06T00:00:00.000Z");
  assert.equal(announcement.achievementTitle, "Albert Park Grand Prix Circuit");
  assert.equal(announcement.winnerName, "Fast Farmer");
  assert.equal("firstPlayerUid" in announcement, false);
});
