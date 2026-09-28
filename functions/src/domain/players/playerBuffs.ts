import type {
  FoodBuffItemId,
  PlayerActiveBuff,
  PlayerDocument
} from "./playerTypes";

export type { FoodBuffItemId } from "./playerTypes";

const MINUTE = 60 * 1_000;

export const FOOD_BUFF_DEFINITIONS: Readonly<Record<FoodBuffItemId, {
  xpMultiplier: number;
  coinBonus: number;
  radiusMultiplier: number;
  pointsMultiplier: number;
  autoCapture: boolean;
  durationMilliseconds: number;
}>> = Object.freeze({
  energy_bar: {
    xpMultiplier: 1.5,
    coinBonus: 0,
    radiusMultiplier: 1,
    pointsMultiplier: 1,
    autoCapture: false,
    durationMilliseconds: 5 * MINUTE
  },
  sweet_corn_snack: {
    xpMultiplier: 1.5,
    coinBonus: 1,
    radiusMultiplier: 1,
    pointsMultiplier: 1,
    autoCapture: false,
    durationMilliseconds: 5 * MINUTE
  },
  battered_fish: {
    xpMultiplier: 1,
    coinBonus: 0,
    radiusMultiplier: 1,
    pointsMultiplier: 1,
    autoCapture: true,
    durationMilliseconds: 5 * MINUTE
  },
  buttered_corn: {
    xpMultiplier: 1.75,
    coinBonus: 2,
    radiusMultiplier: 1,
    pointsMultiplier: 1,
    autoCapture: false,
    durationMilliseconds: 10 * MINUTE
  },
  milk_chocolate_bar: {
    xpMultiplier: 1.75,
    coinBonus: 0,
    radiusMultiplier: 1.75,
    pointsMultiplier: 1,
    autoCapture: false,
    durationMilliseconds: 10 * MINUTE
  },
  fairy_bread: {
    xpMultiplier: 1.75,
    coinBonus: 2,
    radiusMultiplier: 1,
    pointsMultiplier: 1,
    autoCapture: false,
    durationMilliseconds: 10 * MINUTE
  },
  energy_drink: {
    xpMultiplier: 1,
    coinBonus: 0,
    radiusMultiplier: 1.5,
    pointsMultiplier: 1.5,
    autoCapture: false,
    durationMilliseconds: 5 * MINUTE
  },
  chocolate_energy_drink: {
    xpMultiplier: 1.75,
    coinBonus: 2,
    radiusMultiplier: 1.75,
    pointsMultiplier: 1,
    autoCapture: false,
    durationMilliseconds: 10 * MINUTE
  },
  battered_trout: {
    xpMultiplier: 1,
    coinBonus: 0,
    radiusMultiplier: 1,
    pointsMultiplier: 1,
    autoCapture: true,
    durationMilliseconds: 10 * MINUTE
  }
});

// Retained for the original Level 1–9 Energy Bar contract and tests.
export const ENERGY_BAR_XP_MULTIPLIER = 1.5 as const;
export const ENERGY_BAR_DURATION_MILLISECONDS = 5 * MINUTE;

export function isFoodBuffItemId(value: unknown): value is FoodBuffItemId {
  return typeof value === "string" && value in FOOD_BUFF_DEFINITIONS;
}

export function createPlayerFoodBuff(
  itemId: FoodBuffItemId,
  now: Date,
  durationMultiplier: number = 1
): PlayerActiveBuff {
  const definition = FOOD_BUFF_DEFINITIONS[itemId];
  const activatedAt = new Date(now);
  const safeDurationMultiplier = Number.isFinite(durationMultiplier)
    ? Math.max(1, Math.min(2, durationMultiplier))
    : 1;
  return {
    type: "food",
    sourceItemId: itemId,
    xpMultiplier: definition.xpMultiplier,
    coinBonus: definition.coinBonus,
    radiusMultiplier: definition.radiusMultiplier,
    pointsMultiplier: definition.pointsMultiplier,
    autoCapture: definition.autoCapture,
    activatedAt,
    expiresAt: new Date(activatedAt.getTime() + definition.durationMilliseconds * safeDurationMultiplier)
  };
}

export function createEnergyBarXpBuff(now: Date): PlayerActiveBuff {
  return createPlayerFoodBuff("energy_bar", now);
}

export function getActivePlayerFoodBuff(
  player: Pick<PlayerDocument, "activeBuff">,
  now: Date
): PlayerActiveBuff | null {
  const buff = player.activeBuff;
  return buff && buff.expiresAt.getTime() > now.getTime() ? buff : null;
}

export function getActivePlayerXpBuff(
  player: Pick<PlayerDocument, "activeBuff">,
  now: Date
): PlayerActiveBuff | null {
  const buff = getActivePlayerFoodBuff(player, now);
  return buff && buff.xpMultiplier > 1 ? buff : null;
}

export function getActivePlayerCaptureRadiusMultiplier(
  player: Pick<PlayerDocument, "activeBuff">,
  now: Date
): number {
  return getActivePlayerFoodBuff(player, now)?.radiusMultiplier ?? 1;
}

export function calculateXpWithActiveBuff(params: {
  player: Pick<PlayerDocument, "activeBuff">;
  baseXp: number;
  now: Date;
}) {
  const baseXp = Math.max(0, Math.floor(params.baseXp));
  const buff = getActivePlayerXpBuff(params.player, params.now);
  const xp = buff ? Math.ceil(baseXp * buff.xpMultiplier) : baseXp;

  return { baseXp, xp, bonusXp: Math.max(0, xp - baseXp), buff };
}

/**
 * Food and Party XP increases do not stack. The single highest eligible
 * multiplier wins for an event, with an equal party multiplier counted as a
 * party reward so active parties are visible to players.
 */
export function calculateXpWithBestAvailableBonus(params: {
  player: Pick<PlayerDocument, "activeBuff">;
  baseXp: number;
  now: Date;
  partyMultiplier?: number;
}) {
  const baseXp = Math.max(0, Math.floor(params.baseXp));
  const buff = getActivePlayerXpBuff(params.player, params.now);
  const foodMultiplier = buff?.xpMultiplier ?? 1;
  const requestedPartyMultiplier = Number(params.partyMultiplier);
  const partyMultiplier = Number.isFinite(requestedPartyMultiplier)
    ? Math.max(1, Math.min(2, requestedPartyMultiplier))
    : 1;
  const multiplier = Math.max(foodMultiplier, partyMultiplier);
  const xp = Math.ceil(baseXp * multiplier);
  const partyApplied = partyMultiplier > 1 && partyMultiplier >= foodMultiplier;

  return {
    baseXp,
    xp,
    bonusXp: Math.max(0, xp - baseXp),
    partyBonusXp: partyApplied ? Math.max(0, xp - baseXp) : 0,
    partyApplied,
    buff: foodMultiplier > partyMultiplier ? buff : null
  };
}

export function calculateCoinsWithActiveBuff(params: {
  player: Pick<PlayerDocument, "activeBuff">;
  baseCoins: number;
  now: Date;
}) {
  const baseCoins = Math.max(0, Math.floor(params.baseCoins));
  const buff = getActivePlayerFoodBuff(params.player, params.now);
  // Battered Fish is the introductory auto-capture buff: it retains normal
  // coin rewards. Battered Trout remains the later, no-coin auto-capture.
  const autoCaptureWithoutCoins = buff?.autoCapture === true && buff.sourceItemId !== "battered_fish";
  const coins = autoCaptureWithoutCoins ? 0 : baseCoins + (buff?.coinBonus ?? 0);

  return {
    baseCoins,
    coins,
    bonusCoins: Math.max(0, coins - baseCoins),
    buff: buff && (buff.coinBonus > 0 || buff.autoCapture) ? buff : null
  };
}

export function calculatePointsWithActiveBuff(params: {
  player: Pick<PlayerDocument, "activeBuff">;
  basePoints: number;
  now: Date;
}) {
  const basePoints = Math.max(0, Math.floor(params.basePoints));
  const buff = getActivePlayerFoodBuff(params.player, params.now);
  const multiplier = buff?.pointsMultiplier ?? 1;
  const points = Math.ceil(basePoints * multiplier);

  return {
    basePoints,
    points,
    bonusPoints: Math.max(0, points - basePoints),
    buff: multiplier > 1 ? buff : null
  };
}
