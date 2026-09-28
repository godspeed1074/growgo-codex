import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadPlayerLeveling() {
  return import(path.join(repoRoot, "functions/lib/domain/players/playerLeveling.js"));
}

test("normal player levels require fifty percent more XP while crafting stays separate", async () => {
  const {
    PLAYER_LEVEL_XP_MULTIPLIER,
    getPlayerLevelForTotalXp,
    getPlayerLevelXpNeeded,
    getPlayerTotalXpForLevel
  } = await loadPlayerLeveling();

  assert.equal(PLAYER_LEVEL_XP_MULTIPLIER, 1.5);
  assert.equal(getPlayerLevelXpNeeded(1), 150);
  assert.equal(getPlayerLevelXpNeeded(2), 180);
  assert.equal(getPlayerLevelXpNeeded(10), 774);
  assert.equal(getPlayerLevelForTotalXp(149), 1);
  assert.equal(getPlayerLevelForTotalXp(150), 2);
  assert.equal(getPlayerTotalXpForLevel(21), 28_002);
  assert.equal(getPlayerLevelForTotalXp(getPlayerTotalXpForLevel(21)), 21);
});

test("an existing alpha player never loses a level when the player curve changes", async () => {
  const { getPlayerLevelAfterXpGain } = await loadPlayerLeveling();

  assert.equal(
    getPlayerLevelAfterXpGain({ currentLevel: 20, totalXp: 15_475 }),
    20
  );
});
