import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  ".."
);

async function loadPlayerBuffs() {
  return import(path.join(repoRoot, "functions/lib/domain/players/playerBuffs.js"));
}

test("Energy Bar grants exactly +50% XP for five minutes", async () => {
  const {
    ENERGY_BAR_DURATION_MILLISECONDS,
    createEnergyBarXpBuff,
    calculateXpWithActiveBuff
  } = await loadPlayerBuffs();
  const now = new Date("2026-08-29T00:00:00.000Z");
  const activeBuff = createEnergyBarXpBuff(now);

  assert.equal(activeBuff.xpMultiplier, 1.5);
  assert.equal(
    activeBuff.expiresAt.getTime() - activeBuff.activatedAt.getTime(),
    ENERGY_BAR_DURATION_MILLISECONDS
  );
  assert.deepEqual(
    calculateXpWithActiveBuff({ player: { activeBuff }, baseXp: 10, now }),
    { baseXp: 10, xp: 15, bonusXp: 5, buff: activeBuff }
  );
});

test("expired food buffs never increase capture XP", async () => {
  const { createEnergyBarXpBuff, calculateXpWithActiveBuff } = await loadPlayerBuffs();
  const activatedAt = new Date("2026-08-29T00:00:00.000Z");
  const activeBuff = createEnergyBarXpBuff(activatedAt);
  const afterExpiry = new Date(activeBuff.expiresAt.getTime() + 1);

  assert.deepEqual(
    calculateXpWithActiveBuff({ player: { activeBuff }, baseXp: 60, now: afterExpiry }),
    { baseXp: 60, xp: 60, bonusXp: 0, buff: null }
  );
});

test("Sweet Corn Snack grants its original 1–9 XP and coin boost for five minutes", async () => {
  const {
    createPlayerFoodBuff,
    calculateXpWithActiveBuff,
    calculateCoinsWithActiveBuff
  } = await loadPlayerBuffs();
  const now = new Date("2026-08-29T00:00:00.000Z");
  const activeBuff = createPlayerFoodBuff("sweet_corn_snack", now);

  assert.equal(activeBuff.type, "food");
  assert.equal(activeBuff.xpMultiplier, 1.5);
  assert.equal(activeBuff.coinBonus, 1);
  assert.equal(activeBuff.expiresAt.getTime() - activeBuff.activatedAt.getTime(), 5 * 60 * 1_000);
  assert.deepEqual(
    calculateXpWithActiveBuff({ player: { activeBuff }, baseXp: 5, now }),
    { baseXp: 5, xp: 8, bonusXp: 3, buff: activeBuff }
  );
  assert.deepEqual(
    calculateCoinsWithActiveBuff({ player: { activeBuff }, baseCoins: 3, now }),
    { baseCoins: 3, coins: 4, bonusCoins: 1, buff: activeBuff }
  );
});

test("Fairy Bread uses the former Pancakes buff at Level 16", async () => {
  const {
    createPlayerFoodBuff,
    calculateCoinsWithActiveBuff,
    calculateXpWithActiveBuff
  } = await loadPlayerBuffs();
  const now = new Date("2026-08-29T00:00:00.000Z");
  const activeBuff = createPlayerFoodBuff("fairy_bread", now);

  assert.equal(activeBuff.sourceItemId, "fairy_bread");
  assert.equal(activeBuff.xpMultiplier, 1.75);
  assert.equal(activeBuff.coinBonus, 2);
  assert.equal(activeBuff.expiresAt.getTime() - activeBuff.activatedAt.getTime(), 10 * 60 * 1_000);
  assert.deepEqual(
    calculateXpWithActiveBuff({ player: { activeBuff }, baseXp: 8, now }),
    { baseXp: 8, xp: 14, bonusXp: 6, buff: activeBuff }
  );
  assert.deepEqual(
    calculateCoinsWithActiveBuff({ player: { activeBuff }, baseCoins: 1, now }),
    { baseCoins: 1, coins: 3, bonusCoins: 2, buff: activeBuff }
  );
});

test("Battered Fish creates a five-minute auto-capture buff with normal coin rewards", async () => {
  const {
    createPlayerFoodBuff,
    calculateCoinsWithActiveBuff,
    getActivePlayerCaptureRadiusMultiplier
  } = await loadPlayerBuffs();
  const now = new Date("2026-08-29T00:00:00.000Z");
  const activeBuff = createPlayerFoodBuff("battered_fish", now);

  assert.equal(activeBuff.autoCapture, true);
  assert.equal(activeBuff.xpMultiplier, 1);
  assert.equal(getActivePlayerCaptureRadiusMultiplier({ activeBuff }, now), 1);
  assert.equal(activeBuff.expiresAt.getTime() - activeBuff.activatedAt.getTime(), 5 * 60 * 1_000);
  assert.deepEqual(
    calculateCoinsWithActiveBuff({ player: { activeBuff }, baseCoins: 1, now }),
    { baseCoins: 1, coins: 1, bonusCoins: 0, buff: activeBuff }
  );
});

test("Energy Drink grants points and capture radius, not XP or coins", async () => {
  const {
    createPlayerFoodBuff,
    calculateCoinsWithActiveBuff,
    calculatePointsWithActiveBuff,
    calculateXpWithActiveBuff,
    getActivePlayerCaptureRadiusMultiplier
  } = await loadPlayerBuffs();
  const now = new Date("2026-08-30T00:00:00.000Z");
  const activeBuff = createPlayerFoodBuff("energy_drink", now);

  assert.equal(activeBuff.xpMultiplier, 1);
  assert.equal(activeBuff.coinBonus, 0);
  assert.equal(activeBuff.pointsMultiplier, 1.5);
  assert.equal(getActivePlayerCaptureRadiusMultiplier({ activeBuff }, now), 1.5);
  assert.deepEqual(
    calculateXpWithActiveBuff({ player: { activeBuff }, baseXp: 10, now }),
    { baseXp: 10, xp: 10, bonusXp: 0, buff: null }
  );
  assert.deepEqual(
    calculateCoinsWithActiveBuff({ player: { activeBuff }, baseCoins: 3, now }),
    { baseCoins: 3, coins: 3, bonusCoins: 0, buff: null }
  );
  assert.deepEqual(
    calculatePointsWithActiveBuff({ player: { activeBuff }, basePoints: 10, now }),
    { basePoints: 10, points: 15, bonusPoints: 5, buff: activeBuff }
  );
});

test("Battered Trout creates the ten-minute auto-capture buff", async () => {
  const { createPlayerFoodBuff, calculateCoinsWithActiveBuff } = await loadPlayerBuffs();
  const now = new Date("2026-08-29T00:00:00.000Z");
  const activeBuff = createPlayerFoodBuff("battered_trout", now);

  assert.equal(activeBuff.autoCapture, true);
  assert.equal(activeBuff.expiresAt.getTime() - activeBuff.activatedAt.getTime(), 10 * 60 * 1_000);
  assert.deepEqual(
    calculateCoinsWithActiveBuff({ player: { activeBuff }, baseCoins: 1, now }),
    { baseCoins: 1, coins: 0, bonusCoins: 0, buff: activeBuff }
  );
});
