import { createHash } from "node:crypto";

import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { calculateHaversineDistanceMetres } from "../domain/pins/canonicalPinGenerator";
import {
  calculateCoinsWithActiveBuff,
  getActivePlayerCaptureRadiusMultiplier,
  calculatePointsWithActiveBuff,
  calculateXpWithBestAvailableBonus
} from "../domain/players/playerBuffs";
import {
  resolvePartyXpBonusForReward,
  serializePartyXpBonus
} from "../domain/parties/partyBonus";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import { getPlayerLevelAfterXpGain } from "../domain/players/playerLeveling";
import { getGrowGoSeasonAt, getGrowGoUtcDayKey } from "../domain/leaderboards/leaderboardPeriods";
import {
  buildLeaderboardScoreDocument,
  readLeaderboardScoreDocument
} from "../domain/leaderboards/leaderboardScoreStore";
import { SHARED_POI_PINS_COLLECTION, sharedWorldDocumentId } from "../domain/world/sharedWorld";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireAppCheckIfEnabled, requireAuthenticated } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireFiniteNumber,
  requireString
} from "../validation/requestValidation";

/** Green church and park POIs have a smaller repeatable daily reward. */
export const DAILY_GREEN_POI_POINTS = 20;
export const DAILY_GREEN_POI_COINS = 10;
export const DAILY_GREEN_POI_CAPTURE_RADIUS_METRES = 304.8;
const MAX_LOCATION_ACCURACY_METRES = 100;

interface DailyPoiCaptureRequest {
  pinId: string;
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  deviceId: string | undefined;
}

export function validateDailyPoiCaptureRequest(
  request: CallableRequest<unknown>
): DailyPoiCaptureRequest {
  const payload = asObject(request.data, "captureDailyPoi payload");
  assertAllowedKeys(
    payload,
    ["pinId", "latitude", "longitude", "accuracyMetres", "deviceId"],
    "captureDailyPoi payload"
  );

  return {
    pinId: requireString(payload.pinId, "pinId", 1, 160),
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    accuracyMetres: requireFiniteNumber(payload.accuracyMetres, "accuracyMetres", 0, 10_000),
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  };
}

export async function captureDailyPoiHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  const input = validateDailyPoiCaptureRequest(request);
  await requireActiveDeviceSessionIfEnabled({ uid: authContext.uid, deviceId: input.deviceId });

  if (input.accuracyMetres > MAX_LOCATION_ACCURACY_METRES) {
    throw new HttpsError("failed-precondition", "Your location accuracy is too low to capture this POI.");
  }

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(authContext.uid);
  const poiRef = db.collection(SHARED_POI_PINS_COLLECTION).doc(sharedWorldDocumentId(input.pinId));
  const captureRef = db
    .collection("playerDailyPoiCaptures")
    .doc(authContext.uid)
    .collection("pins")
    .doc(hashValue(input.pinId));
  const leaderboardScoreRef = db.collection("playerLeaderboardScores").doc(authContext.uid);
  const now = new Date();
  const captureDay = getGrowGoUtcDayKey(now);
  const activeSeason = getGrowGoSeasonAt(now);
  const capturedAt = Timestamp.fromDate(now);

  return db.runTransaction(async (transaction) => {
    const [playerSnapshot, poiSnapshot, captureSnapshot, leaderboardSnapshot] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(poiRef),
      transaction.get(captureRef),
      transaction.get(leaderboardScoreRef)
    ]);
    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before capturing POIs.");
    }
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Complete your GrowGo profile before capturing POIs.");
    }

    const poi = poiSnapshot.data();
    if (!isDailyGreenPoi(poi, input.pinId)) {
      throw new HttpsError("failed-precondition", "Only daily green church and park POIs can be captured this way.");
    }
    const distance = calculateHaversineDistanceMetres(
      { latitude: input.latitude, longitude: input.longitude },
      { latitude: Number(poi.lat), longitude: Number(poi.lng) }
    );
    const captureRadiusMetres = DAILY_GREEN_POI_CAPTURE_RADIUS_METRES *
      getActivePlayerCaptureRadiusMultiplier(player, now);
    if (distance > captureRadiusMetres) {
      throw new HttpsError("failed-precondition", "You are too far away to capture this POI.");
    }
    if (captureSnapshot.data()?.captureDay === captureDay) {
      throw new HttpsError("already-exists", "This green POI has already been captured today.");
    }

    const pointReward = calculatePointsWithActiveBuff({
      player,
      basePoints: DAILY_GREEN_POI_POINTS,
      now
    });
    const partyXpBonus = await resolvePartyXpBonusForReward({
      db,
      transaction,
      uid: authContext.uid,
      now,
      currentLocation: {
        latitude: input.latitude,
        longitude: input.longitude,
        accuracyMetres: input.accuracyMetres
      }
    });
    const xpReward = calculateXpWithBestAvailableBonus({
      player,
      baseXp: pointReward.points,
      now,
      partyMultiplier: partyXpBonus.multiplier
    });
    const coinReward = calculateCoinsWithActiveBuff({
      player,
      baseCoins: DAILY_GREEN_POI_COINS,
      now
    });
    const nextXp = player.xp + xpReward.xp;
    const nextCoins = player.coins + coinReward.coins;
    const nextPlayer = {
      ...player,
      level: getPlayerLevelAfterXpGain({ currentLevel: player.level, totalXp: nextXp }),
      xp: nextXp,
      coins: nextCoins,
      updatedAt: now
    };
    const storedScores = readLeaderboardScoreDocument(leaderboardSnapshot.data());
    const nextDailyPoints = storedScores.daily.key === captureDay
      ? storedScores.daily.points + pointReward.points
      : pointReward.points;
    const nextSeasonalPoints = storedScores.seasonal.key === activeSeason.key
      ? storedScores.seasonal.points + pointReward.points
      : storedScores.seasonal.key === null
        ? player.xp + pointReward.points
        : pointReward.points;

    transaction.update(playerRef, {
      level: nextPlayer.level,
      xp: nextPlayer.xp,
      coins: nextPlayer.coins,
      updatedAt: capturedAt
    });
    transaction.set(captureRef, {
      schemaVersion: 1,
      pinId: input.pinId,
      captureDay,
      capturedAt
    });
    transaction.set(
      leaderboardScoreRef,
      buildLeaderboardScoreDocument({
        daily: { key: captureDay, points: nextDailyPoints },
        seasonal: { key: activeSeason.key, points: nextSeasonalPoints },
        achievementPoints: storedScores.achievementPoints,
        updatedAt: capturedAt
      })
    );

    return {
      ok: true as const,
      accepted: true as const,
      pinId: input.pinId,
      captureDay,
      capturedAt: now.toISOString(),
      capture: {
        points: pointReward.points,
        basePoints: pointReward.basePoints,
        bonusPoints: pointReward.bonusPoints,
        xp: xpReward.xp,
        bonusXp: xpReward.bonusXp,
        partyBonus: serializePartyXpBonus(
          partyXpBonus,
          xpReward.partyApplied,
          xpReward.partyBonusXp
        ),
        coins: coinReward.coins,
        baseCoins: coinReward.baseCoins,
        bonusCoins: coinReward.bonusCoins,
        nextCaptureAt: new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
        ).toISOString()
      },
      player: serializePlayerSnapshot(nextPlayer)
    };
  });
}

/**
 * Churches and parks are the only repeatable green POIs. Early shared POIs
 * were saved before `rarity: "normal"` was written, so a missing rarity must
 * continue to count as the same normal green POI.
 */
export function isDailyGreenPoi(value: unknown, pinId: string): value is { lat: number; lng: number } {
  const poi = value as Record<string, unknown> | undefined;
  return Boolean(
    poi &&
    poi.id === pinId &&
    poi.type === "poi" &&
    poi.category === "Places" &&
    poi.rarity !== "special" &&
    ((poi.subcategory === "Church" && poi.icon === "church") ||
      (poi.subcategory === "Park" && poi.icon === "park")) &&
    Number.isFinite(poi.lat) &&
    Number.isFinite(poi.lng)
  );
}

function hashValue(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export const captureDailyPoi = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  captureDailyPoiHandler
);
