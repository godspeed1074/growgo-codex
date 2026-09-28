import type { SharedBasePinPlant } from "./sharedWorld";

/** Every crop stage, including the harvest window, lasts seven UTC days. */
export const CROP_STAGE_MILLISECONDS = 7 * 24 * 60 * 60 * 1_000;

export interface CropHarvestWindow {
  opensAt: Date;
  closesAt: Date;
}

/**
 * Level four is the crop's harvest window. Miracle Grow starts that window
 * immediately; normally it begins after the first three seven-day stages.
 */
export function getCropHarvestWindow(plant: SharedBasePinPlant): CropHarvestWindow {
  const opensAt = plant.miracleGrownAt
    ? plant.miracleGrownAt
    : new Date(plant.plantedAt.getTime() + (CROP_STAGE_MILLISECONDS * 3));

  return {
    opensAt,
    closesAt: new Date(opensAt.getTime() + CROP_STAGE_MILLISECONDS)
  };
}

export function isCropHarvestActive(plant: SharedBasePinPlant, now: Date): boolean {
  const { opensAt, closesAt } = getCropHarvestWindow(plant);
  return now.getTime() >= opensAt.getTime() && now.getTime() < closesAt.getTime();
}

export function hasCropHarvestWindowEnded(plant: SharedBasePinPlant, now: Date): boolean {
  return now.getTime() >= getCropHarvestWindow(plant).closesAt.getTime();
}
