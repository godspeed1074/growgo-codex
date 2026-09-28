import { Timestamp, type DocumentData } from "firebase-admin/firestore";

export interface LeaderboardPeriodScore {
  key: string | null;
  points: number;
}

export interface LeaderboardScoreDocument {
  daily: LeaderboardPeriodScore;
  seasonal: LeaderboardPeriodScore;
  /** A permanent total; Achievement Points do not reset by period. */
  achievementPoints: number;
}

export function readLeaderboardScoreDocument(
  data: DocumentData | undefined
): LeaderboardScoreDocument {
  return {
    daily: readPeriodScore(data?.daily),
    seasonal: readPeriodScore(data?.seasonal),
    achievementPoints: readAchievementPoints(data?.achievementPoints)
  };
}

export function buildLeaderboardScoreDocument(params: {
  daily: LeaderboardPeriodScore;
  seasonal: LeaderboardPeriodScore;
  achievementPoints: number;
  updatedAt: Timestamp;
}) {
  return {
    schemaVersion: 1,
    daily: params.daily,
    seasonal: params.seasonal,
    achievementPoints: readAchievementPoints(params.achievementPoints),
    updatedAt: params.updatedAt
  };
}

function readPeriodScore(value: unknown): LeaderboardPeriodScore {
  if (!value || typeof value !== "object") {
    return { key: null, points: 0 };
  }

  const candidate = value as Record<string, unknown>;
  return {
    key: typeof candidate.key === "string" && candidate.key.length > 0
      ? candidate.key
      : null,
    points: Number.isSafeInteger(candidate.points) && (candidate.points as number) >= 0
      ? candidate.points as number
      : 0
  };
}

function readAchievementPoints(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? value as number
    : 0;
}
