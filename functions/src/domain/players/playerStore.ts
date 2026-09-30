import { HttpsError } from "firebase-functions/v2/https";
import {
  Timestamp,
  type DocumentData,
  type DocumentReference
} from "firebase-admin/firestore";

import { getAdminFirestore } from "../../firebaseAdmin";
import {
  growGoGenders,
  growGoRegions,
  type PlayerActiveBuff,
  type PlayerDocument,
  type SafePlayerActiveBuff,
  type SafePlayerOnboarding,
  type SafePlayerSnapshot
} from "./playerTypes";
import { FOOD_BUFF_DEFINITIONS } from "./playerBuffs";
import { getPlayerTotalXpForLevel } from "./playerLeveling";

export const PLAYER_SCHEMA_VERSION = 1 as const;

export function getPlayerDocumentRef(uid: string): DocumentReference<DocumentData> {
  return getAdminFirestore().collection("players").doc(uid);
}

export function buildDefaultPlayerDocument(now: Timestamp): PlayerDocument {
  return {
    schemaVersion: PLAYER_SCHEMA_VERSION,
    publicCode: null,
    displayName: null,
    avatarUrl: null,
    region: null,
    country: null,
    state: null,
    gender: null,
    profileComplete: false,
    level: 1,
    xp: 0,
    craftingLevel: 1,
    craftingXp: 0,
    coins: 0,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    lastLoginAt: now.toDate()
  };
}

export function serializePlayerSnapshot(
  player: PlayerDocument
): SafePlayerSnapshot {
  return {
    schemaVersion: player.schemaVersion,
    publicCode: player.publicCode,
    displayName: player.displayName,
    avatarUrl: player.avatarUrl,
    region: player.region,
    country: player.country,
    state: player.state,
    gender: player.gender,
    profileComplete: player.profileComplete,
    ...(player.onboarding ? { onboarding: serializePlayerOnboarding(player.onboarding) } : {}),
    level: player.level,
    xp: player.xp,
    craftingLevel: player.craftingLevel,
    craftingXp: player.craftingXp,
    coins: player.coins,
    ...(player.activeBuff ? { activeBuff: serializeActiveBuff(player.activeBuff) } : {}),
    ...(player.testUnlimitedCaptureRangeExpiresAt
      ? { testUnlimitedCaptureRangeExpiresAt: player.testUnlimitedCaptureRangeExpiresAt.toISOString() }
      : {}),
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    lastLoginAt: player.lastLoginAt.toISOString()
  };
}

function serializePlayerOnboarding(playerOnboarding: PlayerDocument["onboarding"]): SafePlayerOnboarding {
  if (!playerOnboarding) {
    throw new HttpsError("internal", "Stored player onboarding is missing.");
  }

  return {
    interfaceTutorial: playerOnboarding.interfaceTutorial
  };
}

function serializeActiveBuff(buff: PlayerActiveBuff): SafePlayerActiveBuff {
  return {
    type: "food",
    sourceItemId: buff.sourceItemId,
    xpMultiplier: buff.xpMultiplier,
    coinBonus: buff.coinBonus,
    radiusMultiplier: buff.radiusMultiplier,
    pointsMultiplier: buff.pointsMultiplier,
    autoCapture: buff.autoCapture,
    activatedAt: buff.activatedAt.toISOString(),
    expiresAt: buff.expiresAt.toISOString()
  };
}

export function readStoredPlayerDocument(data: DocumentData | undefined): PlayerDocument {
  if (!data || typeof data !== "object") {
    throw new HttpsError("internal", "Stored player document is missing.");
  }

  const createdAt = asDate(data.createdAt, "createdAt");
  const updatedAt = asDate(data.updatedAt, "updatedAt");
  const lastLoginAt = asDate(data.lastLoginAt, "lastLoginAt");

  if (data.schemaVersion !== PLAYER_SCHEMA_VERSION) {
    throw new HttpsError("internal", "Stored player schemaVersion is invalid.");
  }

  const publicCode = typeof data.publicCode === "string" && /^GG[A-Z0-9]{6}$/.test(data.publicCode.toUpperCase())
    ? data.publicCode.toUpperCase()
    : null;

  if (data.displayName !== null && typeof data.displayName !== "string") {
    throw new HttpsError("internal", "Stored player displayName is invalid.");
  }

  if (data.avatarUrl !== null && typeof data.avatarUrl !== "string") {
    throw new HttpsError("internal", "Stored player avatarUrl is invalid.");
  }

  const region = readNullableEnum(data.region ?? null, growGoRegions, "region");
  const country = readNullableString(data.country ?? null, "country");
  const state = readNullableString(data.state ?? null, "state");
  const gender = readNullableEnum(data.gender ?? null, growGoGenders, "gender");
  const profileComplete = data.profileComplete === true;
  const onboarding = readPlayerOnboarding(data.onboarding);

  if (
    profileComplete !==
    Boolean(data.displayName && region && country && state && gender)
  ) {
    throw new HttpsError("internal", "Stored player profile completion is invalid.");
  }

  const level = readPositiveSafeInteger(data.level, "level");
  const storedXp = readNonNegativeSafeInteger(data.xp, "xp");
  // The level curve was increased during closed alpha. Existing players keep
  // their earned level, so lift only a legacy total that sits below the start
  // of that level. This prevents new XP from being invisible while it tries to
  // fill an old, now-impossible gap. The adjusted total is written back by the
  // next normal server-authoritative player update.
  const xp = Math.max(storedXp, getPlayerTotalXpForLevel(level));
  // Alpha players created before persistent crafting used browser-only
  // progress. Treat absent values as a clean level-one state so the migration
  // is backwards compatible rather than rejecting their profile.
  const craftingLevel = data.craftingLevel === undefined
    ? 1
    : readPositiveSafeInteger(data.craftingLevel, "craftingLevel");
  const craftingXp = data.craftingXp === undefined
    ? 0
    : readNonNegativeSafeInteger(data.craftingXp, "craftingXp");
  const coins = readNonNegativeSafeInteger(data.coins, "coins");
  const activeBuff = readActiveBuff(data.activeBuff ?? null);
  const testUnlimitedCaptureRangeExpiresAt = readOptionalDate(data.testUnlimitedCaptureRangeExpiresAt);

  return {
    schemaVersion: PLAYER_SCHEMA_VERSION,
    publicCode,
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
    region,
    country,
    state,
    gender,
    profileComplete,
    ...(onboarding ? { onboarding } : {}),
    level,
    xp,
    craftingLevel,
    craftingXp,
    coins,
    activeBuff,
    testUnlimitedCaptureRangeExpiresAt,
    createdAt,
    updatedAt,
    lastLoginAt
  };
}

function readOptionalDate(value: unknown): Date | null {
  if (value === undefined || value === null) return null;
  try {
    const date = asDate(value, "testUnlimitedCaptureRangeExpiresAt");
    return Number.isFinite(date.getTime()) ? date : null;
  } catch {
    // Invalid test metadata must fail closed without blocking a player's login.
    return null;
  }
}

function readPlayerOnboarding(value: unknown): PlayerDocument["onboarding"] {
  // Profiles created before this onboarding flow intentionally have no
  // record. They are treated as established players and continue normally.
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("internal", "Stored player onboarding is invalid.");
  }

  const record = value as Record<string, unknown>;
  const interfaceTutorial = record.interfaceTutorial;
  if (interfaceTutorial !== "pending" && interfaceTutorial !== "completed") {
    throw new HttpsError("internal", "Stored player onboarding is invalid.");
  }

  if (interfaceTutorial === "pending") {
    return { interfaceTutorial };
  }

  return {
    interfaceTutorial,
    ...(record.interfaceTutorialCompletedAt === undefined
      ? {}
      : { interfaceTutorialCompletedAt: asDate(record.interfaceTutorialCompletedAt, "onboarding.interfaceTutorialCompletedAt") })
  };
}

function readActiveBuff(value: unknown): PlayerActiveBuff | null {
  // Food effects are temporary. A record written by an older alpha build must
  // never prevent the rest of a player's permanent profile from loading. An
  // unrecognised buff is therefore treated as expired and grants no effect.
  try {
    return readKnownActiveBuff(value);
  } catch {
    return null;
  }
}

function readKnownActiveBuff(value: unknown): PlayerActiveBuff | null {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("internal", "Stored player activeBuff is invalid.");
  }

  const record = value as Record<string, unknown>;
  const activatedAt = asDate(record.activatedAt, "activeBuff.activatedAt");
  const expiresAt = asDate(record.expiresAt, "activeBuff.expiresAt");
  if (expiresAt.getTime() <= activatedAt.getTime()) {
    throw new HttpsError("internal", "Stored player activeBuff is invalid.");
  }

  if (record.type === "food" && typeof record.sourceItemId === "string") {
    const definition = FOOD_BUFF_DEFINITIONS[record.sourceItemId as keyof typeof FOOD_BUFF_DEFINITIONS];
    const isPreviousBatteredFishBuff = record.sourceItemId === "battered_fish" &&
      record.xpMultiplier === 1.5 &&
      record.coinBonus === 0 &&
      record.radiusMultiplier === 1.5 &&
      record.pointsMultiplier === 1 &&
      record.autoCapture === false;

    if (!definition ||
      !isPreviousBatteredFishBuff && (
      record.xpMultiplier !== definition.xpMultiplier ||
      record.coinBonus !== definition.coinBonus ||
      record.radiusMultiplier !== definition.radiusMultiplier ||
      record.pointsMultiplier !== definition.pointsMultiplier ||
      record.autoCapture !== definition.autoCapture
      )
    ) {
      throw new HttpsError("internal", "Stored player activeBuff is invalid.");
    }
    return {
      type: "food",
      sourceItemId: record.sourceItemId as PlayerActiveBuff["sourceItemId"],
      xpMultiplier: definition.xpMultiplier,
      coinBonus: definition.coinBonus,
      radiusMultiplier: definition.radiusMultiplier,
      pointsMultiplier: definition.pointsMultiplier,
      autoCapture: definition.autoCapture,
      activatedAt,
      expiresAt
    };
  }

  // Earlier alpha builds used single-purpose records. Keep them readable for
  // their remaining duration so a deployment never strands an active tester.
  if (record.type === "xp" && record.sourceItemId === "energy_bar" && record.multiplier === 1.5) {
    return { type: "food", sourceItemId: "energy_bar", ...FOOD_BUFF_DEFINITIONS.energy_bar, activatedAt, expiresAt };
  }
  if (record.type === "coins" && record.sourceItemId === "sweet_corn_snack" && record.multiplier === 2) {
    return {
      type: "food",
      sourceItemId: "sweet_corn_snack",
      ...FOOD_BUFF_DEFINITIONS.sweet_corn_snack,
      // Preserve the previously live double-coin effect until it expires.
      xpMultiplier: 1,
      coinBonus: 1,
      activatedAt,
      expiresAt
    };
  }
  if (record.type === "fairy_bread" && record.sourceItemId === "fairy_bread" && record.multiplier === 1.5) {
    return {
      type: "food",
      sourceItemId: "fairy_bread",
      ...FOOD_BUFF_DEFINITIONS.fairy_bread,
      xpMultiplier: 1,
      coinBonus: 0,
      radiusMultiplier: 1.5,
      pointsMultiplier: 1.5,
      activatedAt,
      expiresAt
    };
  }
  if (record.type === "auto_capture" && record.sourceItemId === "battered_fish" && record.multiplier === 1) {
    return {
      type: "food",
      sourceItemId: "battered_fish",
      ...FOOD_BUFF_DEFINITIONS.battered_fish,
      activatedAt,
      expiresAt
    };
  }

  throw new HttpsError("internal", "Stored player activeBuff is invalid.");
}

function readNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value === "string" && value.trim().length > 0) return value;
  throw new HttpsError("internal", `Stored player ${label} is invalid.`);
}

function readNullableEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string
): T | null {
  if (value === null) return null;
  if (typeof value === "string" && allowed.includes(value as T)) return value as T;
  throw new HttpsError("internal", `Stored player ${label} is invalid.`);
}

function asDate(value: unknown, label: string): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  throw new HttpsError("internal", `Stored player ${label} is invalid.`);
}

function readPositiveSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new HttpsError("internal", `Stored player ${label} is invalid.`);
  }

  return value as number;
}

function readNonNegativeSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new HttpsError("internal", `Stored player ${label} is invalid.`);
  }

  return value as number;
}
