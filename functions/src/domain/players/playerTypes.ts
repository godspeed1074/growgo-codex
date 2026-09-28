export const serverAuthoritativePlayerFields = [
  "xp",
  "coins",
  "points",
  "level",
  "inventory",
  "captureHistory",
  "rewards",
  "questProgress",
  "cardOwnership",
  "birdProgress",
  "plotOwnership",
  "marketplaceOwnership"
] as const;

export type ServerAuthoritativePlayerField =
  (typeof serverAuthoritativePlayerFields)[number];

export interface PlayerBootstrapRequest {
  requestId: string;
}

export interface PlayerSnapshotRequest {}

export const growGoRegions = ["north-america", "europe", "oceania"] as const;
export type GrowGoRegion = (typeof growGoRegions)[number];

export const growGoGenders = ["male", "female"] as const;
export type GrowGoGender = (typeof growGoGenders)[number];

export interface CompletePlayerProfileRequest {
  requestId: string;
  avatarName: string;
  region: GrowGoRegion;
  country: string;
  state: string;
  gender: GrowGoGender;
}

export const foodBuffItemIds = [
  "energy_bar",
  "sweet_corn_snack",
  "battered_fish",
  "buttered_corn",
  "milk_chocolate_bar",
  "fairy_bread",
  "energy_drink",
  "chocolate_energy_drink",
  "battered_trout"
] as const;

export type FoodBuffItemId = (typeof foodBuffItemIds)[number];

/**
 * Food buffs deliberately live in one exclusive slot.  The individual effect
 * fields allow a recipe to bundle XP, coins, radius, or auto-capture without
 * making unrelated foods stack together.
 */
export interface PlayerActiveBuff {
  type: "food";
  sourceItemId: FoodBuffItemId;
  xpMultiplier: number;
  coinBonus: number;
  radiusMultiplier: number;
  pointsMultiplier: number;
  autoCapture: boolean;
  activatedAt: Date;
  expiresAt: Date;
}

/**
 * New accounts complete the controls walkthrough before Bingles begins the
 * starter quest. The field is optional so existing alpha players remain on
 * their current quest progress and are never put back into onboarding.
 */
export interface PlayerOnboarding {
  interfaceTutorial: "pending" | "completed";
  interfaceTutorialCompletedAt?: Date;
}

export interface SafePlayerOnboarding {
  interfaceTutorial: "pending" | "completed";
}

export interface SafePlayerActiveBuff {
  type: "food";
  sourceItemId: FoodBuffItemId;
  xpMultiplier: number;
  coinBonus: number;
  radiusMultiplier: number;
  pointsMultiplier: number;
  autoCapture: boolean;
  activatedAt: string;
  expiresAt: string;
}

export interface PlayerDocument {
  schemaVersion: 1;
  /** A server-reserved, public QR code. It is never a Firebase uid. */
  publicCode: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  region: GrowGoRegion | null;
  country: string | null;
  state: string | null;
  gender: GrowGoGender | null;
  profileComplete: boolean;
  onboarding?: PlayerOnboarding;
  level: number;
  xp: number;
  craftingLevel: number;
  craftingXp: number;
  coins: number;
  activeBuff?: PlayerActiveBuff | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface SafePlayerSnapshot {
  schemaVersion: 1;
  publicCode: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  region: GrowGoRegion | null;
  country: string | null;
  state: string | null;
  gender: GrowGoGender | null;
  profileComplete: boolean;
  onboarding?: SafePlayerOnboarding;
  level: number;
  xp: number;
  craftingLevel: number;
  craftingXp: number;
  coins: number;
  activeBuff?: SafePlayerActiveBuff | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface CallableScaffoldResponse {
  ok: false;
  accepted: false;
  status: "not-implemented";
  message: string;
  requestId: string;
  playerId: string;
}
