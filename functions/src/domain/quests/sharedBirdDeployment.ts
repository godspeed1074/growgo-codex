import { hasCropHarvestWindowEnded } from "../world/cropLifecycle";
import type { readSharedBasePinState } from "../world/sharedWorld";

export const SHARED_DOVE_DOCUMENT = "alpha-dove-pilot";
export const SHARED_DOVE_COLLECTION = "birdQuestDeployments";
export interface SharedDoveDeployment {
  schemaVersion: 1; id: string; birdId: string; ownerUid: string; ownerName: string;
  landing: { id: string; lat: number; lng: number };
  createdAt: number; expiresAt: number;
  status: "deployed" | "departed" | "recalled";
  nextLandingAttemptAt?: number;
}

export function eligibleBirdPlot(plot: ReturnType<typeof readSharedBasePinState>, _birdOwnerUid: string, now: Date) {
  // A growing or harvest-ready owned plot may host anyone's bird, including
  // its owner's. The host pin's daily capture/harvest lockout is independent.
  return Boolean(plot?.ownerUid && plot.plant
    && plot.plant.plantedAt <= now && !hasCropHarvestWindowEnded(plot.plant, now));
}

export function eligibleDeployedBirdPlot(plot: ReturnType<typeof readSharedBasePinState>, deployment: SharedDoveDeployment, now: Date) {
  return isActiveBirdDeployment(deployment, now.getTime()) && eligibleBirdPlot(plot, deployment.ownerUid, now);
}

export function isActiveBirdDeployment(value: SharedDoveDeployment | null | undefined, now = Date.now()): value is SharedDoveDeployment {
  return Boolean(value?.schemaVersion === 1 && value.status === "deployed" && value.expiresAt > now
    && value.createdAt <= now && typeof value.id === "string" && typeof value.ownerUid === "string"
    && value.landing && Number.isFinite(value.landing.lat) && Number.isFinite(value.landing.lng));
}

export function isExpiredBirdDeployment(value: SharedDoveDeployment | null | undefined, now = Date.now()): value is SharedDoveDeployment {
  return Boolean(value?.schemaVersion === 1 && value.status === "deployed"
    && Number.isFinite(value.createdAt) && Number.isFinite(value.expiresAt)
    && value.expiresAt > value.createdAt && value.expiresAt <= now
    && typeof value.id === "string" && value.id.length > 0
    && typeof value.ownerUid === "string" && value.ownerUid.length > 0
    && typeof value.birdId === "string" && value.birdId.length > 0
    && value.landing && typeof value.landing.id === "string"
    && Number.isFinite(value.landing.lat) && Number.isFinite(value.landing.lng));
}

export function shouldMoveExpiredBird(value: SharedDoveDeployment | null | undefined, now = Date.now()) {
  return isExpiredBirdDeployment(value, now)
    && (!Number.isFinite(value.nextLandingAttemptAt) || value.nextLandingAttemptAt! <= now);
}

export function publicBirdDeployment(value: SharedDoveDeployment) {
  // Never expose account email, private quest choices, inventory or receipts.
  return { id: value.id, birdId: value.birdId, ownerName: value.ownerName, name: "Test Dove", level: 1,
    landing: value.landing, expiresAt: value.expiresAt };
}
