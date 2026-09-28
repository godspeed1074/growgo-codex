import {
  HttpsError,
  onCall,
  type CallableRequest
} from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  requireDevelopmentBackendOperationalSafeguardAccess
} from "../config/developmentBackendOperationalSafeguards";
import {
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument
} from "../domain/players/playerStore";
import type { PlayerDocument } from "../domain/players/playerTypes";
import {
  getGrowGoSeasonAt,
  getGrowGoUtcDayKey,
  leaderboardPeriods,
  type LeaderboardPeriod
} from "../domain/leaderboards/leaderboardPeriods";
import {
  readLeaderboardScoreDocument,
  type LeaderboardScoreDocument
} from "../domain/leaderboards/leaderboardScoreStore";
import {
  LEADERBOARD_RECORD_PERFORMANCES_COLLECTION,
  readLeaderboardRecordPerformance,
  type LeaderboardRecordKind,
  type LeaderboardRecordPerformance
} from "../domain/leaderboards/leaderboardRecordStore";
import { getAdminFirestore } from "../firebaseAdmin";
import { FieldPath, type Firestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { readSharedCache, readOptimizationEnabled } from "../infrastructure/sharedReadCache";
import {
  requireDevelopmentBackendCapabilityAccess
} from "../security/developmentBackendCapabilityGuard";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys
} from "../validation/requestValidation";

export const leaderboardScopes = ["local", "regional", "global"] as const;
export type LeaderboardScope = (typeof leaderboardScopes)[number];
export const leaderboardMetrics = ["points", "achievements", "records"] as const;
export type LeaderboardMetric = (typeof leaderboardMetrics)[number];

const MAX_PLAYER_SCAN = 1_000;
const MAX_LEADERBOARD_ENTRIES = 100;

interface LeaderboardRequest {
  metric: LeaderboardMetric;
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  deviceId: string | undefined;
}

interface LeaderboardCandidate {
  uid: string;
  player: Pick<PlayerDocument, "displayName" | "avatarUrl" | "country" | "region" | "xp">;
  scores: LeaderboardScoreDocument;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl?: string;
  score: number;
  me: boolean;
  recordPeriodLabel?: string;
  achievedAt?: string;
}

export interface LeaderboardResult {
  metric: LeaderboardMetric;
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  periodKey: string;
  periodLabel: string;
  entries: LeaderboardEntry[];
  currentPlayer: LeaderboardEntry;
  refreshedAt: string;
}

export function validateLeaderboardRequest(
  request: CallableRequest<unknown>
): LeaderboardRequest {
  const payload = asObject(request.data, "getLeaderboard payload");
  assertAllowedKeys(payload, ["metric", "scope", "period", "deviceId"], "getLeaderboard payload");

  if (typeof payload.scope !== "string" || !leaderboardScopes.includes(payload.scope as LeaderboardScope)) {
    throw new HttpsError("invalid-argument", "scope is invalid.");
  }

  const period = payload.period === undefined ? "all-time" : payload.period;
  if (typeof period !== "string" || !leaderboardPeriods.includes(period as LeaderboardPeriod)) {
    throw new HttpsError("invalid-argument", "period is invalid.");
  }

  return {
    metric: payload.metric === undefined ? "points" : readLeaderboardMetric(payload.metric),
    scope: payload.scope as LeaderboardScope,
    period: period as LeaderboardPeriod,
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  };
}

function readLeaderboardMetric(value: unknown): LeaderboardMetric {
  if (typeof value !== "string" || !leaderboardMetrics.includes(value as LeaderboardMetric)) {
    throw new HttpsError("invalid-argument", "metric is invalid.");
  }
  return value as LeaderboardMetric;
}

export async function getLeaderboardHandler(
  request: CallableRequest<unknown>
): Promise<LeaderboardResult> {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  requireDevelopmentBackendOperationalSafeguardAccess({
    operation: "player_snapshot",
    uid: authContext.uid
  });

  const input = validateLeaderboardRequest(request);
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: input.deviceId
  });

  const db = getAdminFirestore();
  const currentPlayerSnapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!currentPlayerSnapshot.exists) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before viewing leaders.");
  }

  const currentPlayer = readStoredPlayerDocument(currentPlayerSnapshot.data());
  if (!currentPlayer.profileComplete) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before viewing leaders.");
  }

  if (input.metric === "records") {
    const now = new Date();
    const board = await readSharedCache({
      db, key: JSON.stringify(["leaderboard-records-v1", input.scope, input.period,
        input.scope === "local" ? currentPlayer.country : input.scope === "regional" ? currentPlayer.region : "world"]),
      revision: `${getGrowGoUtcDayKey(now)}:${getGrowGoSeasonAt(now).key}`,
      ttlMs: 30_000, enabled: readOptimizationEnabled("LEADERBOARDS"),
      load: async () => {
        // Keep the historical rule: live fallback only before ANY archive for
        // this period exists, not merely because this local region has none.
        const anyArchive = await db.collection(LEADERBOARD_RECORD_PERFORMANCES_COLLECTION)
          .where("kind", "==", input.period).limit(1).get();
        const records = anyArchive.empty
          ? buildLiveLeaderboardRecordsFromCandidates({ period: input.period, refreshedAt: now,
              candidates: await readScopedLeaderboardCandidates(db, currentPlayer, input.scope, input.period !== "all-time") })
          : await readScopedArchivedRecords(db, currentPlayer, input.scope, input.period);
        return records.map((record) => ({ ...record, achievedAt: record.achievedAt.toISOString() }));
      },
      validate: (value): value is Array<Omit<LeaderboardRecordPerformance, "achievedAt"> & { achievedAt: string }> =>
        Array.isArray(value) && value.every((record) => typeof record?.playerUid === "string" &&
          typeof record.name === "string" && Number.isSafeInteger(record.score) && record.score >= 0 &&
          Number.isFinite(Date.parse(record.achievedAt)))
    });
    const records = board.value.map((record) => ({ ...record, achievedAt: new Date(record.achievedAt) }));

    return buildRecordsLeaderboardResult({
      scope: input.scope,
      period: input.period,
      currentPlayerId: authContext.uid,
      currentPlayer,
      records,
      refreshedAt: new Date(board.loadedAt).toISOString()
    });
  }

  const now = new Date();
  const needScores = input.metric === "achievements" || input.period !== "all-time";
  const board = await readSharedCache({
    db,
    key: JSON.stringify(["leaderboard-candidates-v1", input.scope,
      input.scope === "local" ? currentPlayer.country : input.scope === "regional" ? currentPlayer.region : "world",
      needScores]),
    revision: `${getGrowGoUtcDayKey(now)}:${getGrowGoSeasonAt(now).key}`,
    ttlMs: 30_000,
    enabled: readOptimizationEnabled("LEADERBOARDS"),
    load: () => readScopedLeaderboardCandidates(db, currentPlayer, input.scope, needScores),
    validate: isCachedLeaderboardCandidates
  });
  // Cached public standings are shared, but the caller's verified score/profile
  // is fresh. Never share a response containing another caller's `me` flags.
  const ownScores = needScores
    ? readLeaderboardScoreDocument((await db.collection("playerLeaderboardScores").doc(authContext.uid).get()).data())
    : readLeaderboardScoreDocument(undefined);
  const candidates = board.value.filter((candidate) => candidate.uid !== authContext.uid);
  candidates.push({ uid: authContext.uid, player: currentPlayer, scores: ownScores });

  return buildLeaderboardResult({
    metric: input.metric,
    scope: input.scope,
    period: input.period,
    currentPlayerId: authContext.uid,
    currentPlayer,
    candidates,
    refreshedAt: new Date(board.loadedAt).toISOString()
  });
}

export async function readScopedLeaderboardCandidates(
  db: Firestore, currentPlayer: PlayerDocument, scope: LeaderboardScope, needScores: boolean
): Promise<LeaderboardCandidate[]> {
  let query = db.collection("players").where("profileComplete", "==", true);
  if (scope === "local") query = query.where("country", "==", currentPlayer.country);
  if (scope === "regional") query = query.where("region", "==", currentPlayer.region);
  const paged = query.orderBy(FieldPath.documentId()).limit(250);
  const candidates: LeaderboardCandidate[] = [];
  let cursor: QueryDocumentSnapshot | undefined;
  for (;;) {
    const page = await (cursor ? paged.startAfter(cursor) : paged).get();
    for (const doc of page.docs) {
      try {
        const player = readStoredPlayerDocument(doc.data());
        candidates.push({ uid: doc.id, player: {
          displayName: player.displayName, avatarUrl: player.avatarUrl,
          country: player.country, region: player.region, xp: player.xp
        }, scores: readLeaderboardScoreDocument(undefined) });
      } catch { /* One malformed profile must not block the board. */ }
    }
    if (page.size < 250) break;
    cursor = page.docs.at(-1);
  }
  // All-time points live on the player: no score-document reads are needed.
  if (needScores) {
    for (let i = 0; i < candidates.length; i += 30) {
      const batch = candidates.slice(i, i + 30);
      const result = await db.collection("playerLeaderboardScores")
        .where(FieldPath.documentId(), "in", batch.map((row) => row.uid)).get();
      const scores = new Map(result.docs.map((doc) => [doc.id, readLeaderboardScoreDocument(doc.data())]));
      for (const candidate of batch) candidate.scores = scores.get(candidate.uid) ?? candidate.scores;
    }
  }
  return candidates;
}

function isCachedLeaderboardCandidates(value: unknown): value is LeaderboardCandidate[] {
  return Array.isArray(value) && value.every((row) => typeof row?.uid === "string" &&
    row.player && Number.isSafeInteger(row.player.xp) && row.player.xp >= 0 &&
    (row.player.displayName === null || typeof row.player.displayName === "string") &&
    (row.player.avatarUrl === null || typeof row.player.avatarUrl === "string") &&
    (row.player.country === null || typeof row.player.country === "string") &&
    (row.player.region === null || typeof row.player.region === "string") &&
    JSON.stringify(readLeaderboardScoreDocument(row.scores)) === JSON.stringify(row.scores));
}

async function readScopedArchivedRecords(db: Firestore, player: PlayerDocument, scope: LeaderboardScope, period: LeaderboardPeriod) {
  let query = db.collection(LEADERBOARD_RECORD_PERFORMANCES_COLLECTION).where("kind", "==", period);
  if (scope === "local") query = query.where("country", "==", player.country);
  if (scope === "regional") query = query.where("region", "==", player.region);
  const paged = query.orderBy(FieldPath.documentId()).limit(250);
  const records: LeaderboardRecordPerformance[] = [];
  let cursor: QueryDocumentSnapshot | undefined;
  for (;;) {
    const page = await (cursor ? paged.startAfter(cursor) : paged).get();
    for (const doc of page.docs) {
      const record = readLeaderboardRecordPerformance(doc.data());
      if (record) records.push(record);
    }
    if (page.size < 250) break;
    cursor = page.docs.at(-1);
  }
  return records;
}

export const getLeaderboard = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  getLeaderboardHandler
);

export function buildLeaderboardResult(params: {
  metric?: Exclude<LeaderboardMetric, "records">;
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  currentPlayerId: string;
  currentPlayer: PlayerDocument;
  candidates: readonly LeaderboardCandidate[];
  refreshedAt: string;
}): LeaderboardResult {
  const metric = params.metric ?? "points";
  const refreshedAt = new Date(params.refreshedAt);
  const dailyKey = getGrowGoUtcDayKey(refreshedAt);
  const activeSeason = getGrowGoSeasonAt(refreshedAt);
  const matchingCandidates = params.candidates
    .filter(({ player }) => matchesScope(player, params.currentPlayer, params.scope))
    .sort((left, right) => {
      const scoreDifference = getLeaderboardPoints(right, metric, params.period, dailyKey, activeSeason.key) -
        getLeaderboardPoints(left, metric, params.period, dailyKey, activeSeason.key);
      if (scoreDifference !== 0) return scoreDifference;
      const nameDifference = String(left.player.displayName).localeCompare(String(right.player.displayName));
      return nameDifference || left.uid.localeCompare(right.uid);
    });

  const rankedEntries: LeaderboardEntry[] = [];
  let previousScore: number | null = null;
  let currentRank = 0;

  matchingCandidates.forEach((candidate, index) => {
    const score = getLeaderboardPoints(candidate, metric, params.period, dailyKey, activeSeason.key);
    if (score !== previousScore) {
      currentRank = index + 1;
      previousScore = score;
    }

    rankedEntries.push({
      rank: currentRank,
      name: candidate.player.displayName || "GrowGo player",
      ...(candidate.player.avatarUrl ? { avatarUrl: candidate.player.avatarUrl } : {}),
      score,
      me: candidate.uid === params.currentPlayerId
    });
  });

  const currentPlayer = rankedEntries.find((entry) => entry.me) ?? {
    rank: rankedEntries.length + 1,
    name: params.currentPlayer.displayName || "GrowGo player",
    ...(params.currentPlayer.avatarUrl ? { avatarUrl: params.currentPlayer.avatarUrl } : {}),
    score: getLeaderboardPoints(
      {
        uid: params.currentPlayerId,
        player: params.currentPlayer,
        scores: readLeaderboardScoreDocument(undefined)
      },
      metric,
      params.period,
      dailyKey,
      activeSeason.key
    ),
    me: true
  };

  return {
    metric,
    scope: params.scope,
    period: params.period,
    periodKey: params.period === "daily"
      ? dailyKey
      : params.period === "seasonal"
        ? activeSeason.key
        : "all-time",
    periodLabel: params.period === "daily"
      ? dailyKey
      : params.period === "seasonal"
        ? activeSeason.label
        : "All-Time",
    entries: rankedEntries.slice(0, MAX_LEADERBOARD_ENTRIES),
    currentPlayer,
    refreshedAt: params.refreshedAt
  };
}

export function buildRecordsLeaderboardResult(params: {
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  currentPlayerId: string;
  currentPlayer: PlayerDocument;
  records: readonly LeaderboardRecordPerformance[];
  refreshedAt: string;
}): LeaderboardResult {
  const matchingRecords = params.records
    .filter((record) => matchesRecordScope(record, params.currentPlayer, params.scope))
    .sort((left, right) => {
      const scoreDifference = right.score - left.score;
      if (scoreDifference !== 0) return scoreDifference;
      const achievedDifference = left.achievedAt.getTime() - right.achievedAt.getTime();
      if (achievedDifference !== 0) return achievedDifference;
      return left.playerUid.localeCompare(right.playerUid);
    });

  let previousScore: number | null = null;
  let currentRank = 0;
  const entries = matchingRecords.map((record, index) => {
    if (record.score !== previousScore) {
      currentRank = index + 1;
      previousScore = record.score;
    }
    return {
      rank: currentRank,
      name: record.name,
      ...(record.avatarUrl ? { avatarUrl: record.avatarUrl } : {}),
      score: record.score,
      me: record.playerUid === params.currentPlayerId,
      recordPeriodLabel: record.periodLabel,
      achievedAt: record.achievedAt.toISOString()
    };
  });
  const currentPlayer = entries.find((entry) => entry.me) ?? {
    rank: entries.length + 1,
    name: params.currentPlayer.displayName || "GrowGo player",
    ...(params.currentPlayer.avatarUrl ? { avatarUrl: params.currentPlayer.avatarUrl } : {}),
    score: 0,
    me: true
  };
  const refreshedAt = new Date(params.refreshedAt);
  const activeSeason = getGrowGoSeasonAt(refreshedAt);
  const periodKey = params.period === "daily"
    ? "completed-days"
    : params.period === "seasonal"
      ? "completed-seasons"
      : "all-time";
  const periodLabel = params.period === "daily"
    ? "Completed GrowGo Days"
    : params.period === "seasonal"
      ? `Completed Seasons through ${activeSeason.label}`
      : "All-Time";

  return {
    metric: "records",
    scope: params.scope,
    period: params.period,
    periodKey,
    periodLabel,
    entries: entries.slice(0, MAX_LEADERBOARD_ENTRIES),
    currentPlayer,
    refreshedAt: params.refreshedAt
  };
}

export async function buildLiveLeaderboardRecords(params: {
  db: FirebaseFirestore.Firestore;
  period: LeaderboardPeriod;
  refreshedAt: Date;
}): Promise<LeaderboardRecordPerformance[]> {
  const playerSnapshots = await params.db
    .collection("players")
    .where("profileComplete", "==", true)
    .limit(MAX_PLAYER_SCAN)
    .get();
  const playerCandidates: Array<Omit<LeaderboardCandidate, "scores">> = [];

  for (const snapshot of playerSnapshots.docs) {
    try {
      const player = readStoredPlayerDocument(snapshot.data());
      if (player.profileComplete) {
        playerCandidates.push({ uid: snapshot.id, player });
      }
    } catch {
      // Ignore malformed player records; no one malformed profile can block
      // the shared Records board.
    }
  }

  const scoreSnapshots = playerCandidates.length > 0
    ? await params.db.getAll(
      ...playerCandidates.map(({ uid }) => params.db.collection("playerLeaderboardScores").doc(uid))
    )
    : [];
  const scoresByPlayerId = new Map(
    scoreSnapshots.map((snapshot) => [
      snapshot.id,
      readLeaderboardScoreDocument(snapshot.data())
    ])
  );
  const candidates: LeaderboardCandidate[] = playerCandidates.map((candidate) => ({
    ...candidate,
    scores: scoresByPlayerId.get(candidate.uid) ?? readLeaderboardScoreDocument(undefined)
  }));
  return buildLiveLeaderboardRecordsFromCandidates({
    period: params.period,
    refreshedAt: params.refreshedAt,
    candidates
  });
}

export function buildLiveLeaderboardRecordsFromCandidates(params: {
  period: LeaderboardPeriod;
  refreshedAt: Date;
  candidates: readonly LeaderboardCandidate[];
}): LeaderboardRecordPerformance[] {
  const dailyKey = getGrowGoUtcDayKey(params.refreshedAt);
  const season = getGrowGoSeasonAt(params.refreshedAt);
  const periodKey = params.period === "daily"
    ? dailyKey
    : params.period === "seasonal"
      ? season.key
      : "all-time";
  const periodLabel = params.period === "daily"
    ? `Live ${dailyKey}`
    : params.period === "seasonal"
      ? `Live ${season.label}`
      : "Live All-Time";

  return params.candidates.flatMap((candidate) => {
    const score = getLeaderboardPoints(
      candidate,
      "points",
      params.period,
      dailyKey,
      season.key
    );
    if (score <= 0) return [];

    return [{
      kind: params.period as LeaderboardRecordKind,
      periodKey,
      periodLabel,
      playerUid: candidate.uid,
      name: candidate.player.displayName || "GrowGo player",
      avatarUrl: candidate.player.avatarUrl,
      country: candidate.player.country || "",
      region: candidate.player.region || "",
      score,
      achievedAt: params.refreshedAt
    }];
  });
}

function getLeaderboardPoints(
  candidate: LeaderboardCandidate,
  metric: Exclude<LeaderboardMetric, "records">,
  period: LeaderboardPeriod,
  dailyKey: string,
  seasonKey: string
): number {
  if (metric === "achievements") return candidate.scores.achievementPoints;
  if (period === "all-time") return candidate.player.xp;
  if (period === "daily") {
    return candidate.scores.daily.key === dailyKey
      ? candidate.scores.daily.points
      : 0;
  }

  if (candidate.scores.seasonal.key === seasonKey) {
    return candidate.scores.seasonal.points;
  }

  // All currently stored alpha XP was earned during the current opening
  // season. Until a player makes their first capture after this feature is
  // deployed, use that verified total as the one-time seasonal baseline.
  return candidate.scores.seasonal.key === null ? candidate.player.xp : 0;
}

function matchesScope(
  candidate: Pick<PlayerDocument, "region" | "country">,
  currentPlayer: PlayerDocument,
  scope: LeaderboardScope
): boolean {
  if (scope === "global") return true;
  if (scope === "regional") return candidate.region === currentPlayer.region;
  return candidate.country === currentPlayer.country;
}

function matchesRecordScope(
  record: LeaderboardRecordPerformance,
  currentPlayer: PlayerDocument,
  scope: LeaderboardScope
): boolean {
  if (scope === "global") return true;
  if (scope === "regional") return record.region === currentPlayer.region;
  return record.country === currentPlayer.country;
}
