import { createHash } from "node:crypto";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  achievementDefinitions,
  buildPlayerAchievementRecordsStorage,
  completeAchievementRecord,
  getAchievementDefinition,
  getPlayerAchievementRecordsRef,
  readStoredPlayerAchievementRecords,
  serializeAchievementCompletion,
  type StoredPlayerAchievementRecords
} from "../domain/achievements/achievementRecords";
import {
  getGrowGoSeasonAt,
  getGrowGoUtcDayKey
} from "../domain/leaderboards/leaderboardPeriods";
import {
  buildLeaderboardScoreDocument,
  readLeaderboardScoreDocument,
  type LeaderboardScoreDocument
} from "../domain/leaderboards/leaderboardScoreStore";
import { calculateHaversineDistanceMetres } from "../domain/pins/canonicalPinGenerator";
import { verifyActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument } from "../domain/players/playerStore";
import {
  getAlbertParkGrandPrixCircuitProgressRef,
  readAlbertParkGrandPrixCircuitProgress
} from "../domain/routes/albertParkGrandPrixCircuit";
import {
  getGreatOceanRoadProgressRef,
  readGreatOceanRoadProgress
} from "../domain/routes/greatOceanRoad";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireDevelopmentBackendCapabilityAccess } from "../security/developmentBackendCapabilityGuard";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireFiniteNumber,
  requireRequestId,
  requireString
} from "../validation/requestValidation";

const FARMER_MARKETS_COLLECTION = "farmerMarkets";
const FARMER_MARKET_SCHEMA_VERSION = 1;
const FARMER_MARKET_ACHIEVEMENT_DEPLOYMENTS_COLLECTION = "farmerMarketAchievementDeployments";
const FARMER_MARKET_ACHIEVEMENT_CAPTURE_STATES_COLLECTION = "playerFarmerMarketAchievementCaptureStates";
const FARMER_MARKET_ACHIEVEMENT_DEPLOYMENT_STATES_COLLECTION = "playerFarmerMarketAchievementDeploymentStates";
const FARMER_MARKET_ACHIEVEMENT_REQUESTS_COLLECTION = "farmerMarketAchievementRequests";
const FARMER_MARKET_ACHIEVEMENT_SCHEMA_VERSION = 1;
const FARMER_MARKET_ACHIEVEMENT_CAPTURE_RADIUS_METRES = 200;
const FARMER_MARKET_ACHIEVEMENT_MAX_ACCURACY_METRES = 100;
const FARMER_MARKET_ACHIEVEMENT_DEPLOY_WINDOW_MS = 7 * 24 * 60 * 60 * 1_000;
const FARMER_MARKET_ACHIEVEMENT_POST_EVENT_MS = 2 * 60 * 60 * 1_000;
const FARMER_MARKET_ACHIEVEMENT_SNAPSHOT_LIMIT = 500;
const LEGACY_ALPHA_ACHIEVEMENT_LIMIT = achievementDefinitions.length;

type AchievementPinSize = "small" | "medium" | "large" | "mega";

interface DeploymentLocation {
  latitude: number;
  longitude: number;
  accuracyMetres: number;
}

interface StoredDeployment {
  id: string;
  marketId: string;
  achievementId: string;
  achievementTitle: string;
  points: number;
  size: AchievementPinSize;
  deployerUid: string;
  deployerName: string;
  deployerAvatarUrl: string | null;
  deployedAt: Date;
  expiresAt: Date;
}

interface StoredDeploymentWeekState {
  weeklyResetKey: string;
  achievementIds: string[];
}

function hashValue(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function marketRef(marketId: string) {
  return getAdminFirestore().collection(FARMER_MARKETS_COLLECTION).doc(marketId);
}

function deploymentRef(deploymentId: string) {
  return getAdminFirestore()
    .collection(FARMER_MARKET_ACHIEVEMENT_DEPLOYMENTS_COLLECTION)
    .doc(deploymentId);
}

function captureStateRef(uid: string, deploymentId: string) {
  return getAdminFirestore()
    .collection(FARMER_MARKET_ACHIEVEMENT_CAPTURE_STATES_COLLECTION)
    .doc(uid)
    .collection("pins")
    .doc(deploymentId);
}

function deploymentWeekStateRef(uid: string) {
  return getAdminFirestore()
    .collection(FARMER_MARKET_ACHIEVEMENT_DEPLOYMENT_STATES_COLLECTION)
    .doc(uid);
}

function requestRef(uid: string, kind: string, requestId: string) {
  return getAdminFirestore()
    .collection(FARMER_MARKET_ACHIEVEMENT_REQUESTS_COLLECTION)
    .doc(hashValue(`${uid}|${kind}|${requestId}`));
}

function normalizeMarketId(value: unknown): string {
  const marketId = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (!/^FM[A-F0-9]{14}$/.test(marketId)) {
    throw new HttpsError("invalid-argument", "That Farmer Market is not valid.");
  }
  return marketId;
}

function normalizeDeploymentId(value: unknown): string {
  const deploymentId = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!/^[a-f0-9]{64}$/.test(deploymentId)) {
    throw new HttpsError("invalid-argument", "That achievement pin is not valid.");
  }
  return deploymentId;
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

function readStoredMarket(value: DocumentData | undefined): DocumentData {
  if (!value || value.schemaVersion !== FARMER_MARKET_SCHEMA_VERSION) {
    throw new HttpsError("internal", "Stored Farmer Market data is invalid.");
  }
  return value;
}

function readLocation(payload: Record<string, unknown>): DeploymentLocation {
  return {
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    accuracyMetres: requireFiniteNumber(
      payload.accuracyMetres,
      "accuracyMetres",
      0,
      FARMER_MARKET_ACHIEVEMENT_MAX_ACCURACY_METRES
    )
  };
}

function getAchievementPinSize(points: number): AchievementPinSize {
  if (points >= 50) return "mega";
  if (points >= 31) return "large";
  if (points >= 11) return "medium";
  return "small";
}

/** Monday 00:00 UTC matches GrowGo's established weekly reset. */
function getWeeklyResetKey(now: Date): string {
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const day = new Date(utcMidnight).getUTCDay();
  const mondayOffset = (day + 6) % 7;
  return new Date(utcMidnight - mondayOffset * 24 * 60 * 60 * 1_000)
    .toISOString()
    .slice(0, 10);
}

async function requireAchievementPinPlayer(request: CallableRequest<unknown>, deviceId?: string) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  requireDevelopmentBackendCapabilityAccess({ capability: "player_snapshot" });
  await verifyActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId });

  const snapshot = await getPlayerDocumentRef(authContext.uid).get();
  if (!snapshot.exists) {
    throw new HttpsError("failed-precondition", "Create your GrowGo profile before using Achievement Pins.");
  }
  const player = readStoredPlayerDocument(snapshot.data());
  if (!player.profileComplete || !player.displayName) {
    throw new HttpsError("failed-precondition", "Complete your GrowGo profile before using Achievement Pins.");
  }
  return { uid: authContext.uid, player };
}

function serializeDeployment(
  deployment: StoredDeployment,
  captured: boolean,
  viewerUid?: string,
  viewerAvatarUrl?: string | null
) {
  return {
    id: deployment.id,
    marketId: deployment.marketId,
    achievementId: deployment.achievementId,
    achievementTitle: deployment.achievementTitle,
    points: deployment.points,
    size: deployment.size,
    deployerName: deployment.deployerName,
    // A pin placed before an alpha player's local picture completed its
    // server migration still shows that player's current public profile
    // picture to them immediately, without an expensive global avatar scan.
    deployerAvatarUrl: viewerUid === deployment.deployerUid && viewerAvatarUrl
      ? viewerAvatarUrl
      : deployment.deployerAvatarUrl,
    deployedAt: deployment.deployedAt.toISOString(),
    expiresAt: deployment.expiresAt.toISOString(),
    isDeployer: viewerUid === deployment.deployerUid,
    captured
  };
}

function readStoredDeploymentWeekState(
  value: DocumentData | undefined,
  weeklyResetKey: string
): StoredDeploymentWeekState {
  if (!value || value.weeklyResetKey !== weeklyResetKey || !Array.isArray(value.achievementIds)) {
    return { weeklyResetKey, achievementIds: [] };
  }
  const achievementIds = [...new Set(value.achievementIds)]
    .filter((id): id is string => typeof id === "string" && getAchievementDefinition(id) !== null);
  return { weeklyResetKey, achievementIds };
}

function readStoredDeployment(id: string, value: DocumentData | undefined): StoredDeployment | null {
  if (!value || value.schemaVersion !== FARMER_MARKET_ACHIEVEMENT_SCHEMA_VERSION) return null;
  const definition = typeof value.achievementId === "string" ? getAchievementDefinition(value.achievementId) : null;
  const deployedAt = readDate(value.deployedAt);
  const expiresAt = readDate(value.expiresAt);
  const marketId = typeof value.marketId === "string" ? value.marketId : "";
  const deployerUid = typeof value.deployerUid === "string" ? value.deployerUid : "";
  if (!definition || !deployedAt || !expiresAt || !/^FM[A-F0-9]{14}$/.test(marketId) || !deployerUid) return null;

  return {
    id,
    marketId,
    achievementId: definition.id,
    achievementTitle: definition.title,
    points: definition.points,
    size: getAchievementPinSize(definition.points),
    deployerUid,
    deployerName: typeof value.deployerName === "string" && value.deployerName.trim()
      ? value.deployerName.trim()
      : "GrowGo player",
    deployerAvatarUrl: typeof value.deployerAvatarUrl === "string" ? value.deployerAvatarUrl : null,
    deployedAt,
    expiresAt
  };
}

function serializeAchievements(records: StoredPlayerAchievementRecords) {
  return Object.entries(records.achievements)
    .flatMap(([achievementId, record]) => {
      const serialized = serializeAchievementCompletion({ achievementId, record });
      return serialized ? [serialized] : [];
    })
    .sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt));
}

function readLegacyAchievementIds(payload: Record<string, unknown>): string[] {
  const raw = payload.achievementIds;
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > LEGACY_ALPHA_ACHIEVEMENT_LIMIT) {
    throw new HttpsError("invalid-argument", "Legacy achievements are not valid.");
  }
  const ids = [...new Set(raw.map((value) => typeof value === "string" ? value.trim() : ""))]
    .filter((id) => getAchievementDefinition(id) !== null);
  if (ids.length !== raw.length) {
    throw new HttpsError("invalid-argument", "One or more legacy achievements are not recognised.");
  }
  return ids;
}

/**
 * Alpha achievement completions originally lived only on the device.  This
 * one-time bridge is intentionally narrow: the signed-in player can bring
 * their current alpha completions into their protected server record once.
 * Keeping it here as well as in the startup migration means a slow startup
 * request can never make a completed achievement's Deploy button look dead.
 */
function applyLegacyAlphaAchievementImport(params: {
  records: StoredPlayerAchievementRecords;
  achievementIds: readonly string[];
  now: Date;
}): StoredPlayerAchievementRecords {
  if (params.records.legacyMigrationAppliedAt || params.achievementIds.length === 0) {
    return params.records;
  }

  let records = params.records;
  params.achievementIds.forEach((achievementId) => {
    records = completeAchievementRecord({
      records,
      achievementId,
      completedAt: params.now,
      source: "legacy-alpha"
    });
  });
  return { ...records, legacyMigrationAppliedAt: params.now };
}

function addVerifiedRouteAchievements(params: {
  records: StoredPlayerAchievementRecords;
  albertParkCompleted: boolean;
  albertParkCompletedAt: Date | null;
  greatOceanRoadCompleted: boolean;
  greatOceanRoadCompletedAt: Date | null;
  now: Date;
}): StoredPlayerAchievementRecords {
  let records = params.records;
  if (params.albertParkCompleted) {
    records = completeAchievementRecord({
      records,
      achievementId: "achievement-albert-park-grand-prix-circuit",
      completedAt: params.albertParkCompletedAt || params.now,
      source: "server"
    });
  }
  if (params.greatOceanRoadCompleted) {
    records = completeAchievementRecord({
      records,
      achievementId: "achievement-great-ocean-road",
      completedAt: params.greatOceanRoadCompletedAt || params.now,
      source: "server"
    });
  }
  return records;
}

function nextLeaderboardScores(params: {
  scores: LeaderboardScoreDocument;
  points: number;
  now: Date;
}) {
  const season = getGrowGoSeasonAt(params.now);
  return buildLeaderboardScoreDocument({
    daily: {
      key: getGrowGoUtcDayKey(params.now),
      points: params.scores.daily.key === getGrowGoUtcDayKey(params.now)
        ? params.scores.daily.points + params.points
        : params.points
    },
    seasonal: {
      key: season.key,
      points: params.scores.seasonal.key === season.key
        ? params.scores.seasonal.points + params.points
        : params.points
    },
    achievementPoints: params.scores.achievementPoints,
    updatedAt: Timestamp.fromDate(params.now)
  });
}

export async function migrateLegacyAlphaAchievementRecordsHandler(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "migrateLegacyAlphaAchievementRecords payload");
  assertAllowedKeys(payload, ["deviceId", "achievementIds"], "migrateLegacyAlphaAchievementRecords payload");
  const legacyAchievementIds = readLegacyAchievementIds(payload);
  const context = await requireAchievementPinPlayer(
    request,
    typeof payload.deviceId === "string" ? payload.deviceId : undefined
  );
  const db = getAdminFirestore();
  const now = new Date();
  const recordsRef = getPlayerAchievementRecordsRef(db, context.uid);
  const albertRef = getAlbertParkGrandPrixCircuitProgressRef(db, context.uid);
  const greatOceanRef = getGreatOceanRoadProgressRef(db, context.uid);

  return db.runTransaction(async (transaction) => {
    const [recordsSnapshot, albertSnapshot, greatOceanSnapshot] = await Promise.all([
      transaction.get(recordsRef),
      transaction.get(albertRef),
      transaction.get(greatOceanRef)
    ]);
    let records = readStoredPlayerAchievementRecords(recordsSnapshot.data());
    const albert = readAlbertParkGrandPrixCircuitProgress(albertSnapshot.data());
    const greatOcean = readGreatOceanRoadProgress(greatOceanSnapshot.data());

    records = addVerifiedRouteAchievements({
      records,
      albertParkCompleted: albert.completedAt !== null,
      albertParkCompletedAt: albert.completedAt,
      greatOceanRoadCompleted: greatOcean.completedAt !== null,
      greatOceanRoadCompletedAt: greatOcean.completedAt,
      now
    });

    // Alpha used local-only progress for these achievements. The signed-in
    // player can import that legacy list once, after which all deploy rights
    // live on the server. New completion paths must use server records.
    records = applyLegacyAlphaAchievementImport({
      records,
      achievementIds: legacyAchievementIds,
      now
    });
    // A startup migration with nothing to import is still complete. Marking
    // it prevents a no-achievement account from repeating a Firestore write
    // on every later snapshot refresh.
    if (!records.legacyMigrationAppliedAt) {
      records = { ...records, legacyMigrationAppliedAt: now };
    }

    transaction.set(recordsRef, buildPlayerAchievementRecordsStorage({ records, updatedAt: now }));
    return {
      ok: true,
      achievements: serializeAchievements(records),
      legacyMigrationApplied: true
    };
  });
}

export async function getFarmerMarketAchievementSnapshotHandler(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "getFarmerMarketAchievementSnapshot payload");
  assertAllowedKeys(payload, ["deviceId"], "getFarmerMarketAchievementSnapshot payload");
  const context = await requireAchievementPinPlayer(
    request,
    typeof payload.deviceId === "string" ? payload.deviceId : undefined
  );
  const db = getAdminFirestore();
  const now = new Date();
  const weeklyResetKey = getWeeklyResetKey(now);
  const [recordsSnapshot, deploymentSnapshot, captureSnapshot, deploymentWeekStateSnapshot] = await Promise.all([
    getPlayerAchievementRecordsRef(db, context.uid).get(),
    db.collection(FARMER_MARKET_ACHIEVEMENT_DEPLOYMENTS_COLLECTION)
      .where("expiresAt", ">", Timestamp.fromDate(now))
      .orderBy("expiresAt", "asc")
      .limit(FARMER_MARKET_ACHIEVEMENT_SNAPSHOT_LIMIT)
      .get(),
    db.collection(FARMER_MARKET_ACHIEVEMENT_CAPTURE_STATES_COLLECTION)
      .doc(context.uid)
      .collection("pins")
      .where("expiresAt", ">", Timestamp.fromDate(now))
      .limit(FARMER_MARKET_ACHIEVEMENT_SNAPSHOT_LIMIT)
      .get(),
    deploymentWeekStateRef(context.uid).get()
  ]);
  const capturedDeploymentIds = new Set(captureSnapshot.docs.map((document) => document.id));
  const deploymentWeekState = readStoredDeploymentWeekState(
    deploymentWeekStateSnapshot.data(),
    weeklyResetKey
  );
  const deployedAchievementIds = new Set(deploymentWeekState.achievementIds);
  const activeDeployments = deploymentSnapshot.docs
    .flatMap((document) => {
      const deployment = readStoredDeployment(document.id, document.data());
      if (!deployment) return [];
      if (deployment.deployerUid === context.uid) {
        deployedAchievementIds.add(deployment.achievementId);
      }
      return [{ document, deployment }];
    });

  // Early alpha achievement pins could have been deployed before their
  // player's photo was saved to the shared profile. Resolve only those
  // missing portraits, then persist them once so every player sees the same
  // avatar without paying these reads again on later map refreshes.
  const unresolvedDeployerUids = [...new Set(
    activeDeployments
      .filter(({ deployment }) => !deployment.deployerAvatarUrl)
      .map(({ deployment }) => deployment.deployerUid)
  )];
  const resolvedAvatarUrls = new Map<string, string>();
  if (unresolvedDeployerUids.length > 0) {
    const profileSnapshots = await Promise.all(
      unresolvedDeployerUids.map(async (uid) => ({
        uid,
        snapshot: await getPlayerDocumentRef(uid).get()
      }))
    );
    profileSnapshots.forEach(({ uid, snapshot }) => {
      if (!snapshot.exists) return;
      const avatarUrl = readStoredPlayerDocument(snapshot.data()).avatarUrl;
      if (avatarUrl) resolvedAvatarUrls.set(uid, avatarUrl);
    });

    const backfill = db.batch();
    let backfillCount = 0;
    activeDeployments.forEach(({ document, deployment }) => {
      const avatarUrl = resolvedAvatarUrls.get(deployment.deployerUid);
      if (!avatarUrl || deployment.deployerAvatarUrl) return;
      deployment.deployerAvatarUrl = avatarUrl;
      backfill.update(document.ref, {
        deployerAvatarUrl: avatarUrl,
        updatedAt: Timestamp.fromDate(now)
      });
      backfillCount += 1;
    });
    if (backfillCount > 0) await backfill.commit();
  }

  const deployments = activeDeployments.map(({ document, deployment }) => (
    serializeDeployment(
      deployment,
      capturedDeploymentIds.has(document.id),
      context.uid,
      context.player.avatarUrl
    )
  ));

  return {
    ok: true,
    generatedAt: now.toISOString(),
    achievements: serializeAchievements(readStoredPlayerAchievementRecords(recordsSnapshot.data())),
    deployments,
    deployedAchievementIds: Array.from(deployedAchievementIds)
  };
}

export async function deployFarmerMarketAchievementPinHandler(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "deployFarmerMarketAchievementPin payload");
  assertAllowedKeys(
    payload,
    ["deviceId", "requestId", "marketId", "achievementId", "achievementIds"],
    "deployFarmerMarketAchievementPin payload"
  );
  const requestId = requireRequestId(payload.requestId);
  const marketId = normalizeMarketId(payload.marketId);
  const achievementId = requireString(payload.achievementId, "achievementId", 1, 100).trim();
  const legacyAchievementIds = readLegacyAchievementIds(payload);
  const definition = getAchievementDefinition(achievementId);
  if (!definition) throw new HttpsError("invalid-argument", "That achievement cannot be deployed.");
  const context = await requireAchievementPinPlayer(
    request,
    typeof payload.deviceId === "string" ? payload.deviceId : undefined
  );
  const db = getAdminFirestore();
  const now = new Date();
  const weeklyResetKey = getWeeklyResetKey(now);
  const deploymentId = hashValue(`${context.uid}|${achievementId}|${weeklyResetKey}`);
  const recordsRef = getPlayerAchievementRecordsRef(db, context.uid);
  const deploymentWeekStateDocumentRef = deploymentWeekStateRef(context.uid);
  const requestDocumentRef = requestRef(context.uid, "deploy", requestId);
  const selectedMarketRef = marketRef(marketId);
  const selectedDeploymentRef = deploymentRef(deploymentId);

  return db.runTransaction(async (transaction) => {
    const [requestSnapshot, recordsSnapshot, marketSnapshot, deploymentSnapshot, deploymentWeekStateSnapshot] = await Promise.all([
      transaction.get(requestDocumentRef),
      transaction.get(recordsRef),
      transaction.get(selectedMarketRef),
      transaction.get(selectedDeploymentRef),
      transaction.get(deploymentWeekStateDocumentRef)
    ]);
    if (requestSnapshot.exists) {
      const replay = requestSnapshot.data()?.response;
      if (replay && typeof replay === "object") return { ...(replay as object), replayed: true };
      throw new HttpsError("already-exists", "This achievement deployment request has already been used.");
    }
    if (deploymentSnapshot.exists) {
      throw new HttpsError("already-exists", "This achievement has already been deployed this week.");
    }
    const deploymentWeekState = readStoredDeploymentWeekState(
      deploymentWeekStateSnapshot.data(),
      weeklyResetKey
    );
    if (deploymentWeekState.achievementIds.includes(achievementId)) {
      throw new HttpsError("already-exists", "This achievement has already been deployed this week.");
    }
    if (!marketSnapshot.exists) throw new HttpsError("not-found", "This Farmer Market is no longer available.");
    const market = readStoredMarket(marketSnapshot.data());
    const startsAt = readDate(market.startsAt);
    const endsAt = readDate(market.endsAt);
    if (!startsAt || !endsAt || endsAt.getTime() <= now.getTime()) {
      throw new HttpsError("failed-precondition", "This Farmer Market has already ended.");
    }
    if (startsAt.getTime() - now.getTime() > FARMER_MARKET_ACHIEVEMENT_DEPLOY_WINDOW_MS) {
      throw new HttpsError("failed-precondition", "Achievement Pins unlock for this market seven days before it begins.");
    }

    let records = readStoredPlayerAchievementRecords(recordsSnapshot.data());
    const importedLegacyAchievements = !records.legacyMigrationAppliedAt && legacyAchievementIds.length > 0;
    records = applyLegacyAlphaAchievementImport({
      records,
      achievementIds: legacyAchievementIds,
      now
    });
    if (!records.achievements[achievementId]) {
      throw new HttpsError("failed-precondition", "Complete this achievement before deploying its pin.");
    }

    const expiresAt = new Date(endsAt.getTime() + FARMER_MARKET_ACHIEVEMENT_POST_EVENT_MS);
    const deployment: StoredDeployment = {
      id: deploymentId,
      marketId,
      achievementId,
      achievementTitle: definition.title,
      points: definition.points,
      size: getAchievementPinSize(definition.points),
      deployerUid: context.uid,
      deployerName: context.player.displayName || "GrowGo player",
      deployerAvatarUrl: context.player.avatarUrl || null,
      deployedAt: now,
      expiresAt
    };
    const storedDeployment = {
      schemaVersion: FARMER_MARKET_ACHIEVEMENT_SCHEMA_VERSION,
      marketId: deployment.marketId,
      achievementId: deployment.achievementId,
      deployerUid: deployment.deployerUid,
      deployerName: deployment.deployerName,
      deployerAvatarUrl: deployment.deployerAvatarUrl,
      weeklyResetKey,
      deployedAt: Timestamp.fromDate(deployment.deployedAt),
      expiresAt: Timestamp.fromDate(deployment.expiresAt),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    };
    const response = {
      ok: true,
      deployment: serializeDeployment(deployment, false, context.uid),
      achievements: serializeAchievements(records),
      deployedAchievementIds: [...deploymentWeekState.achievementIds, achievementId]
    };
    if (importedLegacyAchievements) {
      transaction.set(recordsRef, buildPlayerAchievementRecordsStorage({ records, updatedAt: now }));
    }
    transaction.create(selectedDeploymentRef, storedDeployment);
    transaction.set(deploymentWeekStateDocumentRef, {
      schemaVersion: FARMER_MARKET_ACHIEVEMENT_SCHEMA_VERSION,
      weeklyResetKey,
      achievementIds: response.deployedAchievementIds,
      updatedAt: Timestamp.fromDate(now)
    });
    transaction.create(requestDocumentRef, {
      schemaVersion: FARMER_MARKET_ACHIEVEMENT_SCHEMA_VERSION,
      requestId,
      response,
      createdAt: Timestamp.fromDate(now)
    });
    return response;
  });
}

export async function captureFarmerMarketAchievementPinHandler(request: CallableRequest<unknown>) {
  const payload = asObject(request.data, "captureFarmerMarketAchievementPin payload");
  assertAllowedKeys(
    payload,
    ["deviceId", "requestId", "deploymentId", "latitude", "longitude", "accuracyMetres"],
    "captureFarmerMarketAchievementPin payload"
  );
  const requestId = requireRequestId(payload.requestId);
  const deploymentId = normalizeDeploymentId(payload.deploymentId);
  const location = readLocation(payload);
  const context = await requireAchievementPinPlayer(
    request,
    typeof payload.deviceId === "string" ? payload.deviceId : undefined
  );
  const db = getAdminFirestore();
  const now = new Date();
  const requestDocumentRef = requestRef(context.uid, "capture", requestId);
  const selectedDeploymentRef = deploymentRef(deploymentId);
  const selectedCaptureStateRef = captureStateRef(context.uid, deploymentId);

  return db.runTransaction(async (transaction) => {
    const requestSnapshot = await transaction.get(requestDocumentRef);
    if (requestSnapshot.exists) {
      const replay = requestSnapshot.data()?.response;
      if (replay && typeof replay === "object") return { ...(replay as object), replayed: true };
      throw new HttpsError("already-exists", "This achievement capture request has already been used.");
    }
    const deploymentSnapshot = await transaction.get(selectedDeploymentRef);
    if (!deploymentSnapshot.exists) throw new HttpsError("not-found", "This Achievement Pin is no longer available.");
    const deployment = readStoredDeployment(deploymentId, deploymentSnapshot.data());
    if (!deployment) throw new HttpsError("internal", "Stored Achievement Pin data is invalid.");
    const selectedMarketRef = marketRef(deployment.marketId);
    const deployerPlayerRef = getPlayerDocumentRef(deployment.deployerUid);
    const capturingPlayerRef = getPlayerDocumentRef(context.uid);
    const deployerScoreRef = db.collection("playerLeaderboardScores").doc(deployment.deployerUid);
    const capturingScoreRef = db.collection("playerLeaderboardScores").doc(context.uid);
    const [captureStateSnapshot, marketSnapshot, deployerPlayerSnapshot, capturingPlayerSnapshot, deployerScoreSnapshot, capturingScoreSnapshot] = await Promise.all([
      transaction.get(selectedCaptureStateRef),
      transaction.get(selectedMarketRef),
      transaction.get(deployerPlayerRef),
      transaction.get(capturingPlayerRef),
      transaction.get(deployerScoreRef),
      transaction.get(capturingScoreRef)
    ]);
    if (captureStateSnapshot.exists) {
      throw new HttpsError("already-exists", "You have already captured this Achievement Pin.");
    }
    if (deployment.deployerUid === context.uid) {
      throw new HttpsError("failed-precondition", "You cannot capture your own Achievement Pin.");
    }
    if (deployment.expiresAt.getTime() <= now.getTime()) {
      throw new HttpsError("failed-precondition", "This Achievement Pin has expired.");
    }
    if (!marketSnapshot.exists) throw new HttpsError("not-found", "This Farmer Market is no longer available.");
    const market = readStoredMarket(marketSnapshot.data());
    const latitude = Number(market.latitude);
    const longitude = Number(market.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new HttpsError("internal", "This Farmer Market location is invalid.");
    }
    const distanceMetres = calculateHaversineDistanceMetres(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude, longitude }
    );
    if (distanceMetres > FARMER_MARKET_ACHIEVEMENT_CAPTURE_RADIUS_METRES) {
      throw new HttpsError("failed-precondition", "Move within 200 m of this Farmer Market to capture this Achievement Pin.");
    }
    if (!deployerPlayerSnapshot.exists || !capturingPlayerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "A player profile needed for this capture is unavailable.");
    }
    const splitPoints = Math.ceil(deployment.points / 2);
    const deployerScores = readLeaderboardScoreDocument(deployerScoreSnapshot.data());
    const capturingScores = readLeaderboardScoreDocument(capturingScoreSnapshot.data());
    const expiresAt = Timestamp.fromDate(deployment.expiresAt);
    const response = {
      ok: true,
      captured: true,
      deploymentId,
      achievement: {
        id: deployment.achievementId,
        title: deployment.achievementTitle,
        points: deployment.points
      },
      pointsAwarded: splitPoints,
      deployerPointsAwarded: splitPoints,
      coinsAwarded: 0,
      expiresAt: deployment.expiresAt.toISOString()
    };
    transaction.create(selectedCaptureStateRef, {
      schemaVersion: FARMER_MARKET_ACHIEVEMENT_SCHEMA_VERSION,
      deploymentId,
      marketId: deployment.marketId,
      capturedAt: Timestamp.fromDate(now),
      expiresAt
    });
    transaction.set(deployerScoreRef, nextLeaderboardScores({ scores: deployerScores, points: splitPoints, now }));
    transaction.set(capturingScoreRef, nextLeaderboardScores({ scores: capturingScores, points: splitPoints, now }));
    transaction.create(requestDocumentRef, {
      schemaVersion: FARMER_MARKET_ACHIEVEMENT_SCHEMA_VERSION,
      requestId,
      response,
      createdAt: Timestamp.fromDate(now)
    });
    return response;
  });
}

export const migrateLegacyAlphaAchievementRecords = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  migrateLegacyAlphaAchievementRecordsHandler
);

export const getFarmerMarketAchievementSnapshot = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  getFarmerMarketAchievementSnapshotHandler
);

export const deployFarmerMarketAchievementPin = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  deployFarmerMarketAchievementPinHandler
);

export const captureFarmerMarketAchievementPin = onCall(
  { region: runtimeConfig.region, enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable },
  captureFarmerMarketAchievementPinHandler
);
