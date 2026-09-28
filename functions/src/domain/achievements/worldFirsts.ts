import { Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";

import { getAchievementDefinition } from "./achievementRecords";

export const WORLD_FIRST_ACHIEVEMENTS_COLLECTION = "worldFirstAchievements" as const;
export const WORLD_FIRST_ANNOUNCEMENTS_COLLECTION = "worldFirstAnnouncements" as const;
export const WORLD_FIRST_CURRENT_ANNOUNCEMENT_ID = "current" as const;
export const WORLD_FIRST_SCHEMA_VERSION = 1 as const;
export const WORLD_FIRST_SHARED_WINDOW_MS = 60 * 1_000;

export type WorldFirstAwardKind = "first" | "shared";

export interface StoredWorldFirstAchievement {
  achievementId: string;
  firstPlayerUid: string;
  firstCompletedAt: Date;
  sharedWindowEndsAt: Date;
  recipientCount: number;
}

export interface WorldFirstAward {
  kind: WorldFirstAwardKind;
  firstCompletedAt: Date;
  sharedWindowEndsAt: Date;
}

export function getWorldFirstAchievementRef(db: Firestore, achievementId: string) {
  return db.collection(WORLD_FIRST_ACHIEVEMENTS_COLLECTION).doc(achievementId);
}

export function getCurrentWorldFirstAnnouncementRef(db: Firestore) {
  return db
    .collection(WORLD_FIRST_ANNOUNCEMENTS_COLLECTION)
    .doc(WORLD_FIRST_CURRENT_ANNOUNCEMENT_ID);
}

/**
 * World Firsts are reserved for the high-value achievements that receive a
 * global announcement. This preserves the existing 50-point minimum rule.
 */
export function isWorldFirstEligibleAchievement(achievementId: string): boolean {
  const definition = getAchievementDefinition(achievementId);
  return Boolean(definition && definition.points >= 50);
}

export function readStoredWorldFirstAchievement(
  achievementId: string,
  value: DocumentData | undefined
): StoredWorldFirstAchievement | null {
  if (!value || value.schemaVersion !== WORLD_FIRST_SCHEMA_VERSION || value.achievementId !== achievementId) {
    return null;
  }

  const firstCompletedAt = readDate(value.firstCompletedAt);
  const sharedWindowEndsAt = readDate(value.sharedWindowEndsAt);
  const firstPlayerUid = typeof value.firstPlayerUid === "string" ? value.firstPlayerUid.trim() : "";
  const recipientCount = Math.max(1, Math.floor(Number(value.recipientCount) || 1));

  if (!firstCompletedAt || !sharedWindowEndsAt || !firstPlayerUid) return null;

  return {
    achievementId,
    firstPlayerUid,
    firstCompletedAt,
    sharedWindowEndsAt,
    recipientCount
  };
}

export function resolveWorldFirstAward(params: {
  achievementId: string;
  uid: string;
  now: Date;
  stored: StoredWorldFirstAchievement | null;
}): WorldFirstAward | null {
  if (!isWorldFirstEligibleAchievement(params.achievementId)) return null;

  if (!params.stored) {
    return {
      kind: "first",
      firstCompletedAt: params.now,
      sharedWindowEndsAt: new Date(params.now.getTime() + WORLD_FIRST_SHARED_WINDOW_MS)
    };
  }

  if (params.now.getTime() <= params.stored.sharedWindowEndsAt.getTime()) {
    return {
      kind: "shared",
      firstCompletedAt: params.stored.firstCompletedAt,
      sharedWindowEndsAt: params.stored.sharedWindowEndsAt
    };
  }

  return null;
}

export function buildFirstWorldFirstAchievementStorage(params: {
  achievementId: string;
  uid: string;
  now: Date;
  award: WorldFirstAward;
}) {
  return {
    schemaVersion: WORLD_FIRST_SCHEMA_VERSION,
    achievementId: params.achievementId,
    firstPlayerUid: params.uid,
    firstCompletedAt: Timestamp.fromDate(params.award.firstCompletedAt),
    sharedWindowEndsAt: Timestamp.fromDate(params.award.sharedWindowEndsAt),
    recipientCount: 1,
    updatedAt: Timestamp.fromDate(params.now)
  };
}

export function buildSharedWorldFirstAchievementUpdate(params: {
  stored: StoredWorldFirstAchievement;
  now: Date;
}) {
  return {
    recipientCount: params.stored.recipientCount + 1,
    updatedAt: Timestamp.fromDate(params.now)
  };
}

/**
 * This single, public-safe document is the low-cost live broadcast channel.
 * It contains no UID or account data, and is replaced only by a new World
 * First—not when a player shares the existing 60-second result.
 */
export function buildWorldFirstAnnouncementStorage(params: {
  achievementId: string;
  winnerName: string;
  now: Date;
  award: WorldFirstAward;
}) {
  const definition = getAchievementDefinition(params.achievementId);
  if (!definition || params.award.kind !== "first") {
    throw new Error("Only a new eligible World First can create an announcement.");
  }

  return {
    schemaVersion: WORLD_FIRST_SCHEMA_VERSION,
    eventId: `${definition.id}:${params.award.firstCompletedAt.toISOString()}`,
    achievementId: definition.id,
    achievementTitle: definition.title,
    achievementPoints: definition.points,
    winnerName: sanitizeWinnerName(params.winnerName),
    completedAt: Timestamp.fromDate(params.award.firstCompletedAt),
    createdAt: Timestamp.fromDate(params.now)
  };
}

function readDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    const date = (value as { toDate(): Date }).toDate();
    return Number.isFinite(date.getTime()) ? date : null;
  }
  if (typeof value === "string") {
    const time = Date.parse(value);
    return Number.isFinite(time) ? new Date(time) : null;
  }
  return null;
}

function sanitizeWinnerName(value: string): string {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  return normalized.slice(0, 24) || "A GrowGo player";
}
