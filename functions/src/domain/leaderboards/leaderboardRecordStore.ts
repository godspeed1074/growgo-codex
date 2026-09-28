import { createHash } from "node:crypto";

import { Timestamp, type DocumentData } from "firebase-admin/firestore";

export const LEADERBOARD_RECORD_PERFORMANCES_COLLECTION =
  "leaderboardRecordPerformances" as const;

export type LeaderboardRecordKind = "daily" | "seasonal" | "all-time";

export interface LeaderboardRecordPerformance {
  kind: LeaderboardRecordKind;
  periodKey: string;
  periodLabel: string;
  playerUid: string;
  name: string;
  avatarUrl: string | null;
  country: string;
  region: string;
  score: number;
  achievedAt: Date;
}

export function leaderboardRecordDocumentId(params: {
  kind: LeaderboardRecordKind;
  periodKey: string;
  playerUid: string;
}): string {
  return createHash("sha256")
    .update(`${params.kind}|${params.periodKey}|${params.playerUid}`, "utf8")
    .digest("hex");
}

export function buildLeaderboardRecordPerformanceDocument(
  value: LeaderboardRecordPerformance
) {
  return {
    schemaVersion: 1,
    kind: value.kind,
    periodKey: value.periodKey,
    periodLabel: value.periodLabel,
    playerUid: value.playerUid,
    name: value.name,
    avatarUrl: value.avatarUrl,
    country: value.country,
    region: value.region,
    score: value.score,
    achievedAt: Timestamp.fromDate(value.achievedAt),
    updatedAt: Timestamp.fromDate(value.achievedAt)
  };
}

export function readLeaderboardRecordPerformance(
  data: DocumentData | undefined
): LeaderboardRecordPerformance | null {
  if (!data || typeof data !== "object") return null;
  if (
    !isRecordKind(data.kind) ||
    typeof data.periodKey !== "string" ||
    typeof data.periodLabel !== "string" ||
    typeof data.playerUid !== "string" ||
    typeof data.name !== "string" ||
    typeof data.country !== "string" ||
    typeof data.region !== "string" ||
    !Number.isSafeInteger(data.score) ||
    data.score < 0 ||
    !(data.achievedAt instanceof Timestamp)
  ) return null;

  return {
    kind: data.kind,
    periodKey: data.periodKey,
    periodLabel: data.periodLabel,
    playerUid: data.playerUid,
    name: data.name,
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
    country: data.country,
    region: data.region,
    score: data.score,
    achievedAt: data.achievedAt.toDate()
  };
}

function isRecordKind(value: unknown): value is LeaderboardRecordKind {
  return value === "daily" || value === "seasonal" || value === "all-time";
}
