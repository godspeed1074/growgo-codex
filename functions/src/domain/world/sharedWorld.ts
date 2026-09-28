import { createHash } from "node:crypto";

import { HttpsError } from "firebase-functions/v2/https";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";

export const SHARED_BASE_PIN_STATES_COLLECTION = "sharedBasePinStates" as const;
export const SHARED_POI_PINS_COLLECTION = "sharedPoiPins" as const;

export const SHARED_CROP_SEED_IDS = [
  "corn_seed",
  "sugar_cane_seed",
  "wheat_seed",
  "tomato_seed",
  "cocoa_bean_seed"
] as const;

export type SharedCropSeedId = (typeof SHARED_CROP_SEED_IDS)[number];

export interface SharedBasePinPlant {
  seedId: SharedCropSeedId;
  plantedAt: Date;
  miracleGrownAt: Date | null;
}

export interface SharedBasePinState {
  pinId: string;
  latitude: number;
  longitude: number;
  ownerUid: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  ownedAt: Date;
  level: number;
  replantEnabled: boolean;
  plant: SharedBasePinPlant | null;
  updatedAt: Date;
}

interface SharedBasePinOwnerProfile {
  displayName?: unknown;
  avatarUrl?: unknown;
}

export function sharedWorldDocumentId(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function assertSharedCropSeedId(value: unknown): asserts value is SharedCropSeedId {
  if (typeof value !== "string" || !SHARED_CROP_SEED_IDS.includes(value as SharedCropSeedId)) {
    throw new HttpsError("invalid-argument", "That seed is not available for base pins.");
  }
}

export function serializeSharedBasePinState(
  value: SharedBasePinState | null,
  viewerUid: string
) {
  if (!value) return null;

  return {
    ownerId: value.ownerUid,
    ownerName: value.ownerName,
    ownerAvatarUrl: value.ownerAvatarUrl,
    ownedAt: value.ownedAt.toISOString(),
    level: value.level,
    replantEnabled: value.ownerUid === viewerUid ? value.replantEnabled : false,
    plant: value.plant
      ? {
          seedId: value.plant.seedId,
          plantedAt: value.plant.plantedAt.toISOString(),
          miracleGrownAt: value.plant.miracleGrownAt?.toISOString() ?? null
        }
      : null
  };
}

/** Server-only Firestore representation of a shared base pin. */
export function serializeSharedBasePinStateForStorage(value: SharedBasePinState) {
  return {
    schemaVersion: 1,
    pinId: value.pinId,
    latitude: value.latitude,
    longitude: value.longitude,
    ownerUid: value.ownerUid,
    ownerName: value.ownerName,
    ownerAvatarUrl: value.ownerAvatarUrl,
    ownedAt: Timestamp.fromDate(value.ownedAt),
    level: value.level,
    replantEnabled: value.replantEnabled,
    plant: value.plant
      ? {
          seedId: value.plant.seedId,
          plantedAt: Timestamp.fromDate(value.plant.plantedAt),
          miracleGrownAt: value.plant.miracleGrownAt
            ? Timestamp.fromDate(value.plant.miracleGrownAt)
            : null
        }
      : null,
    updatedAt: Timestamp.fromDate(value.updatedAt)
  };
}

/**
 * Player profiles own the visible name and avatar. The fields on a pin are a
 * cached snapshot so the map can load efficiently, and older alpha records
 * can occasionally retain a stale snapshot. Reconcile the cache before it is
 * returned so a pin can never display another player's old label.
 */
export function reconcileSharedBasePinOwnerProfile(
  value: SharedBasePinState,
  profile: SharedBasePinOwnerProfile | null | undefined
): SharedBasePinState {
  const displayName = typeof profile?.displayName === "string"
    ? profile.displayName.trim()
    : "";
  if (!displayName) return value;

  const avatarUrl = typeof profile?.avatarUrl === "string"
    ? profile.avatarUrl
    : profile?.avatarUrl === null
      ? null
      : value.ownerAvatarUrl;

  if (value.ownerName === displayName && value.ownerAvatarUrl === avatarUrl) {
    return value;
  }

  return {
    ...value,
    ownerName: displayName,
    ownerAvatarUrl: avatarUrl
  };
}

export function readSharedBasePinState(data: DocumentData | undefined): SharedBasePinState | null {
  if (!data || typeof data !== "object") return null;
  if (
    typeof data.pinId !== "string" ||
    !Number.isFinite(data.latitude) ||
    !Number.isFinite(data.longitude) ||
    typeof data.ownerUid !== "string" ||
    typeof data.ownerName !== "string" ||
    !(data.ownedAt instanceof Timestamp) ||
    !(data.updatedAt instanceof Timestamp)
  ) return null;
  const plant = data.plant && typeof data.plant === "object" &&
    typeof data.plant.seedId === "string" &&
    SHARED_CROP_SEED_IDS.includes(data.plant.seedId as SharedCropSeedId) &&
    data.plant.plantedAt instanceof Timestamp
    ? {
        seedId: data.plant.seedId as SharedCropSeedId,
        plantedAt: data.plant.plantedAt.toDate(),
        miracleGrownAt: data.plant.miracleGrownAt instanceof Timestamp
          ? data.plant.miracleGrownAt.toDate()
          : null
      }
    : null;
  return {
    pinId: data.pinId,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    ownerUid: data.ownerUid,
    ownerName: data.ownerName,
    ownerAvatarUrl: typeof data.ownerAvatarUrl === "string" ? data.ownerAvatarUrl : null,
    ownedAt: data.ownedAt.toDate(),
    level: Number.isSafeInteger(data.level) && data.level > 0 ? data.level : 1,
    replantEnabled: data.replantEnabled === true,
    plant,
    updatedAt: data.updatedAt.toDate()
  };
}
