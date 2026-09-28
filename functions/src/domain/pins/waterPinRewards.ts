// Water is the guaranteed base reward for every water-pin capture. A fish is
// awarded only when this exact water pin currently carries a server-managed
// fish spawn.
export const WATER_PIN_RESOURCE_DROP_CHANCE = 1;
export const WATER_PIN_FISH_TYPE = "blue" as const;
export const WATER_PIN_FISH_XP = 50;

export interface WaterPinCaptureRewards {
  water: number;
  fish: typeof WATER_PIN_FISH_TYPE | null;
}

export function getWaterPinCaptureRewards(
  fishIsPresent: boolean
): WaterPinCaptureRewards {
  return {
    water: 1,
    fish: fishIsPresent ? WATER_PIN_FISH_TYPE : null
  };
}
