/**
 * Normal player levelling is deliberately slower than crafting.  Keep this
 * curve in one server-owned place so every reward path calculates the same
 * level from a player's total XP.
 */
export const PLAYER_LEVEL_XP_MULTIPLIER = 1.5 as const;
const PLAYER_LEVEL_BASE_XP = 100;
const PLAYER_LEVEL_GROWTH_MULTIPLIER = 1.2;

export function getPlayerLevelXpNeeded(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.round(
    PLAYER_LEVEL_BASE_XP * PLAYER_LEVEL_XP_MULTIPLIER *
    Math.pow(PLAYER_LEVEL_GROWTH_MULTIPLIER, safeLevel - 1)
  );
}

/**
 * Total XP required to be at the beginning of a level. This is deliberately
 * shared by the migration safeguard and the normal level calculation so an
 * existing alpha player can keep their earned level when the curve changes.
 */
export function getPlayerTotalXpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  let totalXp = 0;

  for (let currentLevel = 1; currentLevel < safeLevel; currentLevel += 1) {
    totalXp += getPlayerLevelXpNeeded(currentLevel);
  }

  return totalXp;
}

export function getPlayerLevelForTotalXp(totalXp: number): number {
  const safeTotalXp = Math.max(0, Math.floor(totalXp));
  let level = 1;

  while (level < 1_000) {
    if (safeTotalXp < getPlayerTotalXpForLevel(level + 1)) return level;
    level += 1;
  }

  return level;
}

/** Do not reduce an existing alpha player's level when the curve changes. */
export function getPlayerLevelAfterXpGain(params: {
  currentLevel: number;
  totalXp: number;
}): number {
  return Math.max(
    Math.max(1, Math.floor(params.currentLevel)),
    getPlayerLevelForTotalXp(params.totalXp)
  );
}
