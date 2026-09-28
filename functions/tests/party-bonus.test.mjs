import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("party XP tiers match the approved two-to-eight-player rewards", async () => {
  const partyBonus = await import(path.join(repoRoot, "functions/lib/domain/parties/partyBonus.js"));

  assert.deepEqual(partyBonus.getPartyXpBonusForEligibleMemberCount(1), {
    eligibleMemberCount: 1,
    bonusPercent: 0,
    multiplier: 1
  });
  assert.deepEqual(partyBonus.getPartyXpBonusForEligibleMemberCount(2), {
    eligibleMemberCount: 2,
    bonusPercent: 50,
    multiplier: 1.5
  });
  assert.deepEqual(partyBonus.getPartyXpBonusForEligibleMemberCount(3), {
    eligibleMemberCount: 3,
    bonusPercent: 75,
    multiplier: 1.75
  });
  assert.deepEqual(partyBonus.getPartyXpBonusForEligibleMemberCount(8), {
    eligibleMemberCount: 8,
    bonusPercent: 100,
    multiplier: 2
  });
});

test("party XP takes the highest eligible multiplier instead of stacking with food", async () => {
  const playerBuffs = await import(path.join(repoRoot, "functions/lib/domain/players/playerBuffs.js"));
  const now = new Date("2026-09-04T00:00:00.000Z");

  const partyWins = playerBuffs.calculateXpWithBestAvailableBonus({
    player: { activeBuff: null },
    baseXp: 5,
    now,
    partyMultiplier: 1.5
  });
  assert.equal(partyWins.xp, 8);
  assert.equal(partyWins.partyBonusXp, 3);
  assert.equal(partyWins.partyApplied, true);

  const foodWins = playerBuffs.calculateXpWithBestAvailableBonus({
    player: {
      activeBuff: {
        type: "food",
        sourceItemId: "buttered_corn",
        xpMultiplier: 1.75,
        coinBonus: 2,
        radiusMultiplier: 1,
        pointsMultiplier: 1,
        autoCapture: false,
        activatedAt: new Date(now.getTime() - 1_000),
        expiresAt: new Date(now.getTime() + 1_000)
      }
    },
    baseXp: 4,
    now,
    partyMultiplier: 1.5
  });
  assert.equal(foodWins.xp, 7);
  assert.equal(foodWins.partyBonusXp, 0);
  assert.equal(foodWins.partyApplied, false);
});
