import { onSchedule } from "firebase-functions/v2/scheduler";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  getGrowGoSeasonAt,
  getGrowGoUtcDayKey
} from "../domain/leaderboards/leaderboardPeriods";
import {
  LEADERBOARD_RECORD_PERFORMANCES_COLLECTION,
  buildLeaderboardRecordPerformanceDocument,
  leaderboardRecordDocumentId,
  readLeaderboardRecordPerformance,
  type LeaderboardRecordKind
} from "../domain/leaderboards/leaderboardRecordStore";
import { readLeaderboardScoreDocument } from "../domain/leaderboards/leaderboardScoreStore";
import { readStoredPlayerDocument } from "../domain/players/playerStore";
import { getAdminFirestore } from "../firebaseAdmin";

const MAX_PLAYER_SCAN = 1_000;

export async function archiveLeaderboardRecordsAt(
  now: Date = new Date()
): Promise<{ daily: number; seasonal: number; allTime: number }> {
  const db = getAdminFirestore();
  const playerSnapshots = await db
    .collection("players")
    .where("profileComplete", "==", true)
    .limit(MAX_PLAYER_SCAN)
    .get();
  const players = playerSnapshots.docs.flatMap((snapshot) => {
    try {
      const player = readStoredPlayerDocument(snapshot.data());
      return player.profileComplete ? [{ uid: snapshot.id, player }] : [];
    } catch {
      return [];
    }
  });
  const scoreSnapshots = players.length > 0
    ? await db.getAll(
      ...players.map(({ uid }) => db.collection("playerLeaderboardScores").doc(uid))
    )
    : [];
  const scoresByUid = new Map(scoreSnapshots.map((snapshot) => [
    snapshot.id,
    readLeaderboardScoreDocument(snapshot.data())
  ]));
  const allTimeRefs = players.map(({ uid }) =>
    db.collection(LEADERBOARD_RECORD_PERFORMANCES_COLLECTION).doc(
      leaderboardRecordDocumentId({ kind: "all-time", periodKey: "all-time", playerUid: uid })
    )
  );
  const allTimeSnapshots = allTimeRefs.length > 0 ? await db.getAll(...allTimeRefs) : [];
  const allTimeByUid = new Map(allTimeSnapshots.flatMap((snapshot) => {
    const record = readLeaderboardRecordPerformance(snapshot.data());
    return record ? [[record.playerUid, record] as const] : [];
  }));
  const yesterday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - 1
  ));
  const dailyKey = getGrowGoUtcDayKey(yesterday);
  const currentSeason = getGrowGoSeasonAt(now);
  const previousSeason = getGrowGoSeasonAt(new Date(now.getTime() - 1));
  const isSeasonRollover = currentSeason.key !== previousSeason.key;
  const batch = db.batch();
  let daily = 0;
  let seasonal = 0;
  let allTime = 0;

  for (const [playerIndex, { uid, player }] of players.entries()) {
    const scores = scoresByUid.get(uid) ?? readLeaderboardScoreDocument(undefined);
    if (scores.daily.key === dailyKey && scores.daily.points > 0) {
      writeRecord(batch, {
        kind: "daily",
        periodKey: dailyKey,
        periodLabel: dailyKey,
        uid,
        player,
        score: scores.daily.points,
        now
      });
      daily += 1;
    }
    if (
      isSeasonRollover &&
      scores.seasonal.key === previousSeason.key &&
      scores.seasonal.points > 0
    ) {
      writeRecord(batch, {
        kind: "seasonal",
        periodKey: previousSeason.key,
        periodLabel: previousSeason.label,
        uid,
        player,
        score: scores.seasonal.points,
        now
      });
      seasonal += 1;
    }
    if (player.xp > 0) {
      const recordRef = allTimeRefs[playerIndex];
      const existing = allTimeByUid.get(uid);
      if (!existing || player.xp > existing.score) {
        batch.set(recordRef, buildLeaderboardRecordPerformanceDocument({
          kind: "all-time",
          periodKey: "all-time",
          periodLabel: "All-Time",
          playerUid: uid,
          name: player.displayName || "GrowGo player",
          avatarUrl: player.avatarUrl,
          country: player.country || "",
          region: player.region || "",
          score: player.xp,
          achievedAt: now
        }));
        allTime += 1;
      }
    }
  }
  if (daily || seasonal || allTime) await batch.commit();
  return { daily, seasonal, allTime };
}

export const archiveLeaderboardRecords = onSchedule(
  {
    region: runtimeConfig.region,
    schedule: "0 0 * * *",
    timeZone: "Etc/UTC"
  },
  async () => {
    const result = await archiveLeaderboardRecordsAt(new Date());
    console.info("Leaderboard records archived", result);
  }
);

function writeRecord(
  batch: FirebaseFirestore.WriteBatch,
  params: {
    kind: Exclude<LeaderboardRecordKind, "all-time">;
    periodKey: string;
    periodLabel: string;
    uid: string;
    player: ReturnType<typeof readStoredPlayerDocument>;
    score: number;
    now: Date;
  }
) {
  const recordRef = getAdminFirestore()
    .collection(LEADERBOARD_RECORD_PERFORMANCES_COLLECTION)
    .doc(leaderboardRecordDocumentId({
      kind: params.kind,
      periodKey: params.periodKey,
      playerUid: params.uid
    }));
  batch.set(recordRef, buildLeaderboardRecordPerformanceDocument({
    kind: params.kind,
    periodKey: params.periodKey,
    periodLabel: params.periodLabel,
    playerUid: params.uid,
    name: params.player.displayName || "GrowGo player",
    avatarUrl: params.player.avatarUrl,
    country: params.player.country || "",
    region: params.player.region || "",
    score: params.score,
    achievedAt: params.now
  }));
}
