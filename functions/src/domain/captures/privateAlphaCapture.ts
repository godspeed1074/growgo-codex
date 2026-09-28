import { createHash } from "node:crypto";

import { HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import {
  GROWGO_CAPTURE_RADIUS_METRES,
  type CanonicalBasePin
} from "../pins/basePinTypes";
import { calculateHaversineDistanceMetres } from "../pins/canonicalPinGenerator";
import { getAdminFirestore } from "../../firebaseAdmin";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../players/playerStore";
import { getPlayerLevelAfterXpGain } from "../players/playerLeveling";
import {
  calculateCoinsWithActiveBuff,
  calculatePointsWithActiveBuff,
  calculateXpWithBestAvailableBonus,
  getActivePlayerCaptureRadiusMultiplier
} from "../players/playerBuffs";
import {
  resolvePartyXpBonusForReward,
  serializePartyXpBonus
} from "../parties/partyBonus";
import {
  completeStarterQuestState,
  readStarterQuestState,
  serializeStarterQuestState,
  STARTER_QUEST_REWARD_COINS
} from "../quests/starterQuest";
import {
  getGrowGoSeasonAt,
  getGrowGoUtcDayKey
} from "../leaderboards/leaderboardPeriods";
import {
  buildLeaderboardScoreDocument,
  readLeaderboardScoreDocument
} from "../leaderboards/leaderboardScoreStore";
import {
  getWaterPinCaptureRewards,
  WATER_PIN_FISH_XP,
  type WaterPinCaptureRewards
} from "../pins/waterPinRewards";
import {
  BASE_PIN_STARTING_POINTS,
  buildBasePinCaptureValueState,
  getBasePinPointValue,
  readBasePinCaptureValueState,
  SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION
} from "../pins/basePinValue";
import {
  buildCapturedWaterFishState,
  buildReplacementWaterFishState,
  getWaterFishCycle,
  getWaterFishStateRef,
  readWaterFishReplacementCandidates,
  resolveWaterFishActivity,
  WATER_FISH_SPAWN_CHANCE
} from "../pins/waterFishSpawns";
import {
  getWaterFishSpawnMultiplier,
  readOfficialEventSchedule
} from "../events/officialEvents";
import {
  MARKET_INVENTORY_SCHEMA_VERSION,
  readMarketInventory
} from "../market/marketCatalog";
import {
  ALBERT_PARK_GRAND_PRIX_CIRCUIT_ACHIEVEMENT_POINTS,
  buildAlbertParkGrandPrixCircuitProgressStorage,
  getAlbertParkGrandPrixCircuitProgressRef,
  isAlbertParkGrandPrixCircuitSpecialPin,
  readAlbertParkGrandPrixCircuitProgress,
  recordAlbertParkGrandPrixCircuitCaptures,
  serializeAlbertParkGrandPrixCircuitProgress
} from "../routes/albertParkGrandPrixCircuit";
import {
  GREAT_OCEAN_ROAD_ACHIEVEMENT_POINTS,
  buildGreatOceanRoadProgressStorage,
  getGreatOceanRoadProgressRef,
  isGreatOceanRoadSpecialPin,
  readGreatOceanRoadProgress,
  recordGreatOceanRoadCaptures,
  serializeGreatOceanRoadProgress
} from "../routes/greatOceanRoad";
import {
  buildPlayerAchievementRecordsStorage,
  completeAchievementRecord,
  getPlayerAchievementRecordsRef,
  readStoredPlayerAchievementRecords
} from "../achievements/achievementRecords";
import {
  buildWorldFirstAnnouncementStorage,
  buildFirstWorldFirstAchievementStorage,
  buildSharedWorldFirstAchievementUpdate,
  getCurrentWorldFirstAnnouncementRef,
  getWorldFirstAchievementRef,
  isWorldFirstEligibleAchievement,
  readStoredWorldFirstAchievement,
  resolveWorldFirstAward
} from "../achievements/worldFirsts";
import {
  SHARED_BASE_PIN_STATES_COLLECTION,
  readSharedBasePinState,
  sharedWorldDocumentId
} from "../world/sharedWorld";
import { isCropHarvestActive } from "../world/cropLifecycle";
import type { NormalizedCapturePinRequest } from "./captureTypes";

export const PRIVATE_ALPHA_CAPTURE_ENABLED_ENV =
  "GROWGO_PRIVATE_ALPHA_CAPTURE_ENABLED" as const;
// Mobile GPS is often less precise than the former 65m threshold, especially
// around buildings. Keep it aligned with the visible 100m capture radius for
// the invite-only alpha.
export const PRIVATE_ALPHA_CAPTURE_MAX_ACCURACY_METRES = 100 as const;
// Ordinary base pins use their shared value, beginning at five. This alias
// remains for callers that need the reset value after a base-pin capture.
export const PRIVATE_ALPHA_CAPTURE_POINTS = BASE_PIN_STARTING_POINTS;
export const PRIVATE_ALPHA_WATER_CAPTURE_POINTS = 10 as const;
export const PRIVATE_ALPHA_CAPTURE_COINS = 1 as const;
export const PRIVATE_ALPHA_CAPTURE_MAX_RADIUS_METRES =
  GROWGO_CAPTURE_RADIUS_METRES * 1.5;

interface AlphaCaptureEvidence {
  pinLatitude: number;
  pinLongitude: number;
}

export function isPrivateAlphaCaptureEnabled(
  env: Readonly<Record<string, string | undefined>> = process.env
): boolean {
  return env[PRIVATE_ALPHA_CAPTURE_ENABLED_ENV] === "true";
}

export function validateAlphaCaptureEvidence(payload: Record<string, unknown>): AlphaCaptureEvidence {
  const pinLatitude = payload.pinLatitude;
  const pinLongitude = payload.pinLongitude;

  if (!Number.isFinite(pinLatitude) || (pinLatitude as number) < -90 || (pinLatitude as number) > 90) {
    throw new HttpsError("invalid-argument", "pinLatitude is invalid.");
  }

  if (!Number.isFinite(pinLongitude) || (pinLongitude as number) < -180 || (pinLongitude as number) > 180) {
    throw new HttpsError("invalid-argument", "pinLongitude is invalid.");
  }

  return {
    pinLatitude: Number((pinLatitude as number).toFixed(7)),
    pinLongitude: Number((pinLongitude as number).toFixed(7))
  };
}

export function assertPrivateAlphaCaptureEligible(params: {
  request: NormalizedCapturePinRequest;
  canonicalPin: CanonicalBasePin;
  evidence: AlphaCaptureEvidence;
  now: Date;
  captureRadiusMetres?: number;
}): void {
  if (params.request.accuracyMetres > PRIVATE_ALPHA_CAPTURE_MAX_ACCURACY_METRES) {
    throw new HttpsError(
      "failed-precondition",
      "Your location accuracy is too low to capture this pin. Move to an open area and try again."
    );
  }

  const submittedPinDistance = calculateHaversineDistanceMetres(
    { latitude: params.evidence.pinLatitude, longitude: params.evidence.pinLongitude },
    { latitude: params.canonicalPin.latitude, longitude: params.canonicalPin.longitude }
  );
  if (submittedPinDistance > 1) {
    throw new HttpsError("failed-precondition", "This pin could not be verified.");
  }

  const playerDistance = calculateHaversineDistanceMetres(
    { latitude: params.request.latitude, longitude: params.request.longitude },
    { latitude: params.canonicalPin.latitude, longitude: params.canonicalPin.longitude }
  );
  const requestedRadius = Number(params.captureRadiusMetres);
  const captureRadiusMetres = Number.isFinite(requestedRadius)
    ? Math.min(
        PRIVATE_ALPHA_CAPTURE_MAX_RADIUS_METRES,
        Math.max(GROWGO_CAPTURE_RADIUS_METRES, requestedRadius)
      )
    : PRIVATE_ALPHA_CAPTURE_MAX_RADIUS_METRES;
  if (playerDistance > captureRadiusMetres) {
    throw new HttpsError("failed-precondition", "You are too far away to capture this pin.");
  }

  const submittedAt = Date.parse(params.request.clientCapturedAt);
  const ageMilliseconds = params.now.getTime() - submittedAt;
  if (!Number.isFinite(submittedAt) || ageMilliseconds < -30_000 || ageMilliseconds > 5 * 60_000) {
    throw new HttpsError("failed-precondition", "Use a fresh location reading to capture this pin.");
  }
}

export async function acceptPrivateAlphaCapture(params: {
  uid: string;
  request: NormalizedCapturePinRequest;
  canonicalPin: CanonicalBasePin;
  evidence: AlphaCaptureEvidence;
}) {
  const now = new Date();
  assertPrivateAlphaCaptureEligible({
    request: params.request,
    canonicalPin: params.canonicalPin,
    evidence: params.evidence,
    now
  });

  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(params.uid);
  const isCircuitSpecialPin = isAlbertParkGrandPrixCircuitSpecialPin(
    params.request.pinId
  );
  const isGreatOceanRoadSpecial = isGreatOceanRoadSpecialPin(
    params.request.pinId
  );
  const circuitProgressRef = getAlbertParkGrandPrixCircuitProgressRef(db, params.uid);
  const greatOceanRoadProgressRef = getGreatOceanRoadProgressRef(db, params.uid);
  const achievementRecordsRef = getPlayerAchievementRecordsRef(db, params.uid);
  const possibleWorldFirstAchievementIds = [
    ...(isCircuitSpecialPin ? ["achievement-albert-park-grand-prix-circuit"] : []),
    ...(isGreatOceanRoadSpecial ? ["achievement-great-ocean-road"] : [])
  ].filter(isWorldFirstEligibleAchievement);
  const possibleWorldFirstAchievementRefs = possibleWorldFirstAchievementIds.map((achievementId) => ({
    achievementId,
    ref: getWorldFirstAchievementRef(db, achievementId)
  }));
  const marketInventoryRef = db.collection("playerMarketInventories").doc(params.uid);
  const captureRef = db
    .collection("playerCaptureStates")
    .doc(params.uid)
    .collection("pins")
    .doc(hashValue(params.request.pinId));
  const harvestRecaptureOverrideRef = db
    .collection("playerHarvestRecaptureOverrides")
    .doc(params.uid)
    .collection("pins")
    .doc(hashValue(params.request.pinId));
  const sharedBasePinStateRef = db
    .collection(SHARED_BASE_PIN_STATES_COLLECTION)
    .doc(sharedWorldDocumentId(params.request.pinId));
  const cropHarvestRef = db
    .collection("sharedBasePinHarvests")
    .doc(sharedWorldDocumentId(params.request.pinId))
    .collection("players")
    .doc(params.uid);
  const requestRef = db
    .collection("privateAlphaCaptureRequests")
    .doc(hashValue(`${params.uid}|${params.request.requestId}`));
  const questStateRef = db.collection("playerQuestStates").doc(params.uid);
  const leaderboardScoreRef = db.collection("playerLeaderboardScores").doc(params.uid);
  const waterPinStateRef = db
    .collection("authoritativeWaterPinStates")
    .doc(params.request.pinId);
  const basePinValueRef = db
    .collection(SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION)
    .doc(sharedWorldDocumentId(params.request.pinId));
  const fishCycle = getWaterFishCycle(now);
  const officialEvents = await readOfficialEventSchedule(db, now);
  const waterFishSpawnChance = WATER_FISH_SPAWN_CHANCE * getWaterFishSpawnMultiplier(officialEvents, now);
  const waterFishStateRef = getWaterFishStateRef(
    db,
    fishCycle,
    params.request.pinId
  );
  const fingerprint = hashValue(
    JSON.stringify({
      uid: params.uid,
      requestId: params.request.requestId,
      pinId: params.request.pinId,
      playerLatitude: params.request.latitude,
      playerLongitude: params.request.longitude,
      pinLatitude: params.evidence.pinLatitude,
      pinLongitude: params.evidence.pinLongitude,
      accuracyMetres: params.request.accuracyMetres,
      clientCapturedAt: params.request.clientCapturedAt
    })
  );
  const captureDay = now.toISOString().slice(0, 10);
  const activeSeason = getGrowGoSeasonAt(now);
  const nextCaptureAt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  ).toISOString();

  // We only query the global water pool when this pin is presently a fish.
  // The transaction below rechecks the fish record before granting a reward.
  const preflightWaterPinSnapshot = await waterPinStateRef.get();
  const preflightIsWater =
    preflightWaterPinSnapshot.exists &&
    preflightWaterPinSnapshot.data()?.pinId === params.request.pinId &&
    preflightWaterPinSnapshot.data()?.type === "water";
  const preflightWaterFishSnapshot = preflightIsWater ? await waterFishStateRef.get() : null;
  const preflightFishActive = preflightIsWater &&
    resolveWaterFishActivity({
      pinId: params.request.pinId,
      cycle: fishCycle,
      value: preflightWaterFishSnapshot?.data(),
      spawnChance: waterFishSpawnChance
    }).active;
  const replacementCandidates = preflightFishActive
    ? await readWaterFishReplacementCandidates({
        db,
        now,
        excludedPinIds: [params.request.pinId],
        seed: `${params.uid}|${params.request.requestId}`,
        spawnChance: waterFishSpawnChance
      })
    : [];
  const replacementFishStateRefs = replacementCandidates.map((candidate) =>
    getWaterFishStateRef(db, fishCycle, candidate.pinId)
  );

  return db.runTransaction(async (transaction) => {
    // A confirmed retry needs only its receipt, not reward/quest state again.
    // Authentication and canonical verification still run in the caller.
    const requestSnapshot = await transaction.get(requestRef);
    if (requestSnapshot.exists) {
      const stored = requestSnapshot.data();
      if (stored?.fingerprint !== fingerprint || !stored?.response) {
        throw new HttpsError(
          "already-exists",
          "This capture request has already been used for another action."
        );
      }
      return { ...stored.response, replayed: true };
    }
    const [
      playerSnapshot,
      captureSnapshot,
      sharedBasePinStateSnapshot,
      questStateSnapshot,
      leaderboardScoreSnapshot,
      waterPinStateSnapshot,
      basePinValueSnapshot,
      circuitProgressSnapshot,
      greatOceanRoadProgressSnapshot,
      achievementRecordsSnapshot,
      worldFirstAchievementSnapshots
    ] = await Promise.all([
      transaction.get(playerRef),
      transaction.get(captureRef),
      transaction.get(sharedBasePinStateRef),
      transaction.get(questStateRef),
      transaction.get(leaderboardScoreRef),
      transaction.get(waterPinStateRef),
      transaction.get(basePinValueRef),
      isCircuitSpecialPin
        ? transaction.get(circuitProgressRef)
        : Promise.resolve(null),
      isGreatOceanRoadSpecial
        ? transaction.get(greatOceanRoadProgressRef)
        : Promise.resolve(null),
      (isCircuitSpecialPin || isGreatOceanRoadSpecial)
        ? transaction.get(achievementRecordsRef)
        : Promise.resolve(null),
      Promise.all(possibleWorldFirstAchievementRefs.map(({ ref }) => transaction.get(ref)))
    ]);

    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Player bootstrap is required before capturing.");
    }

    const capturedToday =
      captureSnapshot.exists && captureSnapshot.data()?.captureDay === captureDay;
    const harvestRecaptureOverrideSnapshot = capturedToday
      ? await transaction.get(harvestRecaptureOverrideRef) : null;
    const harvestRecaptureOverride = harvestRecaptureOverrideSnapshot?.data();
    const usingHarvestRecapture =
      capturedToday &&
      harvestRecaptureOverride?.pinId === params.request.pinId &&
      harvestRecaptureOverride?.captureDay === captureDay &&
      harvestRecaptureOverride?.used !== true;

    if (capturedToday && !usingHarvestRecapture) {
      throw new HttpsError("already-exists", "This pin has already been captured today.");
    }

    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError(
        "failed-precondition",
        "Complete your player profile before capturing pins."
      );
    }
    assertPrivateAlphaCaptureEligible({
      request: params.request,
      canonicalPin: params.canonicalPin,
      evidence: params.evidence,
      now,
      captureRadiusMetres:
        GROWGO_CAPTURE_RADIUS_METRES * getActivePlayerCaptureRadiusMultiplier(player, now)
    });
    const storedStarterQuest = readStarterQuestState(questStateSnapshot.data());
    const completedStarterQuest = storedStarterQuest?.starterTutorial.status === "active";
    const nextStarterQuest = completedStarterQuest && storedStarterQuest
      ? completeStarterQuestState(storedStarterQuest, Timestamp.fromDate(now))
      : storedStarterQuest;
    const starterQuestCoins = completedStarterQuest ? STARTER_QUEST_REWARD_COINS : 0;
    const verifiedWaterPin =
      waterPinStateSnapshot.exists &&
      waterPinStateSnapshot.data()?.pinId === params.request.pinId &&
      waterPinStateSnapshot.data()?.type === "water";
    const sharedBasePinState = readSharedBasePinState(sharedBasePinStateSnapshot.data());
    const harvestEligible = !verifiedWaterPin && !!sharedBasePinState?.plant &&
      isCropHarvestActive(sharedBasePinState.plant, now);
    // Branch only on records read inside this transaction, not preflight or
    // client labels. All optional reads still precede every transaction write.
    const [waterFishStateSnapshot, cropHarvestSnapshot, replacementFishStateSnapshots] = await Promise.all([
      verifiedWaterPin ? transaction.get(waterFishStateRef) : Promise.resolve(null),
      harvestEligible ? transaction.get(cropHarvestRef) : Promise.resolve(null),
      verifiedWaterPin
        ? Promise.all(replacementFishStateRefs.map(ref => transaction.get(ref)))
        : Promise.resolve([])
    ]);
    const activeWaterFish = verifiedWaterPin
      ? resolveWaterFishActivity({
          pinId: params.request.pinId,
          cycle: fishCycle,
          value: waterFishStateSnapshot?.data(),
          spawnChance: waterFishSpawnChance
        })
      : null;
    const waterRewards: WaterPinCaptureRewards | null = verifiedWaterPin
      ? getWaterPinCaptureRewards(activeWaterFish?.active === true)
      : null;
    const existingCropHarvest = cropHarvestSnapshot?.data();
    const cropHarvestItemId =
      !verifiedWaterPin &&
      sharedBasePinState?.plant &&
      isCropHarvestActive(sharedBasePinState.plant, now) &&
      existingCropHarvest?.harvestDay !== captureDay
        ? getCropHarvestItemId(sharedBasePinState.plant.seedId)
        : null;
    const basePinValueState = readBasePinCaptureValueState(basePinValueSnapshot.data());
    const basePinPoints = verifiedWaterPin
      ? PRIVATE_ALPHA_WATER_CAPTURE_POINTS
      : getBasePinPointValue({
          lastCapturedAt: basePinValueState?.lastCapturedAt,
          now
        });
    const replacementCandidate = waterRewards?.fish
      ? replacementCandidates.find((candidate, index) =>
          !resolveWaterFishActivity({
            pinId: candidate.pinId,
            cycle: fishCycle,
            value: replacementFishStateSnapshots[index]?.data(),
            spawnChance: waterFishSpawnChance
          }).active
        ) ?? null
      : null;
    const marketInventorySnapshot = waterRewards || cropHarvestItemId
      ? await transaction.get(marketInventoryRef) : null;
    const marketInventory = readMarketInventory(marketInventorySnapshot?.data());
    const nextMarketInventory = waterRewards || cropHarvestItemId
      ? {
        ...marketInventory,
        ...(waterRewards
          ? {
              water: Math.min(10_000, marketInventory.water + waterRewards.water),
              fish: Math.min(10_000, marketInventory.fish + (waterRewards.fish ? 1 : 0))
            }
          : {}),
        ...(cropHarvestItemId
          ? {
              [cropHarvestItemId]: Math.min(
                10_000,
                Number(marketInventory[cropHarvestItemId] || 0) + 1
              )
            }
          : {})
      }
      : marketInventory;
    const fishXp = waterRewards?.fish ? WATER_PIN_FISH_XP : 0;
    const partyXpBonus = await resolvePartyXpBonusForReward({
      db,
      transaction,
      uid: params.uid,
      now,
      currentLocation: {
        latitude: params.request.latitude,
        longitude: params.request.longitude,
        accuracyMetres: params.request.accuracyMetres
      }
    });
    const capturePoints = calculatePointsWithActiveBuff({
      player,
      basePoints: basePinPoints,
      now
    });
    const captureXp = calculateXpWithBestAvailableBonus({
      player,
      baseXp: capturePoints.points + fishXp,
      now,
      partyMultiplier: partyXpBonus.multiplier
    });
    const captureCoins = calculateCoinsWithActiveBuff({
      player,
      baseCoins: PRIVATE_ALPHA_CAPTURE_COINS,
      now
    });
    const nextXp = player.xp + captureXp.xp;
    const nextCoins = player.coins + captureCoins.coins + starterQuestCoins;
    const nextLevel = getPlayerLevelAfterXpGain({ currentLevel: player.level, totalXp: nextXp });
    const capturedAt = Timestamp.fromDate(now);
    const storedLeaderboardScores = readLeaderboardScoreDocument(
      leaderboardScoreSnapshot.data()
    );
    const nextCircuitRoute = isCircuitSpecialPin
      ? recordAlbertParkGrandPrixCircuitCaptures({
          progress: readAlbertParkGrandPrixCircuitProgress(
            circuitProgressSnapshot?.data()
          ),
          pinIds: [params.request.pinId],
          now
        })
      : null;
    const circuitAchievementPoints = nextCircuitRoute?.completedNow
      ? ALBERT_PARK_GRAND_PRIX_CIRCUIT_ACHIEVEMENT_POINTS
      : 0;
    const nextGreatOceanRoad = isGreatOceanRoadSpecial
      ? recordGreatOceanRoadCaptures({
          progress: readGreatOceanRoadProgress(greatOceanRoadProgressSnapshot?.data()),
          pinIds: [params.request.pinId],
          now
        })
      : null;
    const greatOceanRoadAchievementPoints = nextGreatOceanRoad?.completedNow
      ? GREAT_OCEAN_ROAD_ACHIEVEMENT_POINTS
      : 0;
    const completedAchievementIds = [
      ...(nextCircuitRoute?.completedNow
        ? ["achievement-albert-park-grand-prix-circuit"]
        : []),
      ...(nextGreatOceanRoad?.completedNow
        ? ["achievement-great-ocean-road"]
        : [])
    ];
    const worldFirstAwards = new Map();
    completedAchievementIds.forEach((achievementId) => {
      const index = possibleWorldFirstAchievementIds.indexOf(achievementId);
      const snapshot = index >= 0 ? worldFirstAchievementSnapshots[index] : null;
      const stored = snapshot
        ? readStoredWorldFirstAchievement(achievementId, snapshot.data())
        : null;
      const award = resolveWorldFirstAward({
        achievementId,
        uid: params.uid,
        now,
        stored
      });
      if (award) worldFirstAwards.set(achievementId, { award, stored });
    });
    let nextAchievementRecords = achievementRecordsSnapshot
      ? readStoredPlayerAchievementRecords(achievementRecordsSnapshot.data())
      : null;
    if (nextAchievementRecords && nextCircuitRoute?.completedNow) {
      nextAchievementRecords = completeAchievementRecord({
        records: nextAchievementRecords,
        achievementId: "achievement-albert-park-grand-prix-circuit",
        completedAt: now,
        source: "server",
        worldFirst: worldFirstAwards.get("achievement-albert-park-grand-prix-circuit")?.award || null
      });
    }
    if (nextAchievementRecords && nextGreatOceanRoad?.completedNow) {
      nextAchievementRecords = completeAchievementRecord({
        records: nextAchievementRecords,
        achievementId: "achievement-great-ocean-road",
        completedAt: now,
        source: "server",
        worldFirst: worldFirstAwards.get("achievement-great-ocean-road")?.award || null
      });
    }
    const nextDailyPoints =
      storedLeaderboardScores.daily.key === getGrowGoUtcDayKey(now)
        ? storedLeaderboardScores.daily.points + capturePoints.points
        : capturePoints.points;
    // Closed-alpha captures made before this live leaderboard update all took
    // place in the current season. Seed an untracked legacy player from their
    // verified total once, then only add server-approved capture points.
    const nextSeasonalPoints =
      storedLeaderboardScores.seasonal.key === activeSeason.key
        ? storedLeaderboardScores.seasonal.points + capturePoints.points
        : storedLeaderboardScores.seasonal.key === null
          ? player.xp + capturePoints.points
          : capturePoints.points;
    const nextPlayer = {
      ...player,
      level: nextLevel,
      xp: nextXp,
      coins: nextCoins,
      updatedAt: now
    };
    const response = {
      ok: true as const,
      accepted: true as const,
      replayed: false,
      rewardGranted: true as const,
      status: "captured" as const,
      requestId: params.request.requestId,
      pinId: params.request.pinId,
      capture: {
        points: capturePoints.points,
        basePoints: capturePoints.basePoints,
        bonusPoints: capturePoints.bonusPoints,
        pointValue: basePinPoints,
        nextPointValue: verifiedWaterPin
          ? PRIVATE_ALPHA_WATER_CAPTURE_POINTS
          : BASE_PIN_STARTING_POINTS,
        lastValueCaptureAt: now.toISOString(),
        xp: captureXp.xp,
        baseXp: captureXp.baseXp,
        bonusXp: captureXp.bonusXp,
        partyBonus: serializePartyXpBonus(
          partyXpBonus,
          captureXp.partyApplied,
          captureXp.partyBonusXp
        ),
        activeBuffApplied: Boolean(captureXp.buff || capturePoints.buff || captureCoins.buff || captureXp.partyApplied),
        coins: captureCoins.coins + starterQuestCoins,
        baseCoins: captureCoins.baseCoins,
        bonusCoins: captureCoins.bonusCoins,
        capturedAt: now.toISOString(),
        nextCaptureAt
      },
      waterRewards: waterRewards
        ? {
            water: waterRewards.water,
            fish: waterRewards.fish
              ? {
                  type: waterRewards.fish,
                  itemId: "fish",
                  label: "Blue Fish",
                  xp: WATER_PIN_FISH_XP
                }
              : null
          }
        : null,
      harvest: cropHarvestItemId
        ? { itemId: cropHarvestItemId, harvestDay: captureDay }
        : null,
      inventory: waterRewards || cropHarvestItemId
        ? { items: nextMarketInventory }
        : null,
      starterQuest: nextStarterQuest
        ? {
            quest: serializeStarterQuestState(nextStarterQuest),
            completedNow: completedStarterQuest,
            rewardGranted: nextStarterQuest.starterTutorial.status === "completed"
          }
        : null,
      circuitRoute: nextCircuitRoute
        ? serializeAlbertParkGrandPrixCircuitProgress(nextCircuitRoute)
        : null,
      greatOceanRoad: nextGreatOceanRoad
        ? serializeGreatOceanRoadProgress(nextGreatOceanRoad)
        : null,
      worldFirstAwards: Array.from(worldFirstAwards.entries()).map(([achievementId, value]) => ({
        achievementId,
        kind: value.award.kind,
        firstCompletedAt: value.award.firstCompletedAt.toISOString(),
        sharedWindowEndsAt: value.award.sharedWindowEndsAt.toISOString()
      })),
      player: serializePlayerSnapshot(nextPlayer)
    };

    transaction.update(playerRef, {
      level: nextLevel,
      xp: nextXp,
      coins: nextCoins,
      updatedAt: capturedAt
    });
    transaction.set(captureRef, {
      schemaVersion: 1,
      pinId: params.request.pinId,
      captureDay,
      capturedAt
    });
    if (!verifiedWaterPin) {
      transaction.set(
        basePinValueRef,
        buildBasePinCaptureValueState({
          pinId: params.request.pinId,
          capturedAt: now
        })
      );
    }
    transaction.set(
      leaderboardScoreRef,
      buildLeaderboardScoreDocument({
        daily: {
          key: getGrowGoUtcDayKey(now),
          points: nextDailyPoints
        },
        seasonal: {
          key: activeSeason.key,
          points: nextSeasonalPoints
        },
        achievementPoints:
          storedLeaderboardScores.achievementPoints +
          circuitAchievementPoints +
          greatOceanRoadAchievementPoints,
        updatedAt: capturedAt
      })
    );
    if (nextCircuitRoute) {
      transaction.set(
        circuitProgressRef,
        buildAlbertParkGrandPrixCircuitProgressStorage(nextCircuitRoute)
      );
    }
    if (nextGreatOceanRoad) {
      transaction.set(
        greatOceanRoadProgressRef,
        buildGreatOceanRoadProgressStorage(nextGreatOceanRoad)
      );
    }
    if (nextAchievementRecords && (nextCircuitRoute?.completedNow || nextGreatOceanRoad?.completedNow)) {
      transaction.set(
        achievementRecordsRef,
        buildPlayerAchievementRecordsStorage({ records: nextAchievementRecords, updatedAt: now })
      );
    }
    worldFirstAwards.forEach(({ award, stored }, achievementId) => {
      const worldFirstRef = getWorldFirstAchievementRef(db, achievementId);
      if (award.kind === "first") {
        transaction.create(
          worldFirstRef,
          buildFirstWorldFirstAchievementStorage({
            achievementId,
            uid: params.uid,
            now,
            award
          })
        );
        return;
      }
      if (stored) {
        transaction.update(
          worldFirstRef,
          buildSharedWorldFirstAchievementUpdate({ stored, now })
        );
      }
    });
    worldFirstAwards.forEach(({ award }, achievementId) => {
      if (award.kind !== "first") return;
      transaction.set(
        getCurrentWorldFirstAnnouncementRef(db),
        buildWorldFirstAnnouncementStorage({
          achievementId,
          winnerName: player.displayName || "A GrowGo player",
          now,
          award
        })
      );
    });
    if ((waterRewards && (waterRewards.water > 0 || waterRewards.fish)) || cropHarvestItemId) {
      transaction.set(
        marketInventoryRef,
        {
          schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
          items: nextMarketInventory,
          updatedAt: capturedAt,
          ...(marketInventorySnapshot?.exists
            ? {}
            : { initializedAt: capturedAt, import: "capture-reward-v2" })
        },
        { merge: true }
      );
    }
    if (cropHarvestItemId && sharedBasePinState?.plant) {
      transaction.set(cropHarvestRef, {
        schemaVersion: 1,
        pinId: params.request.pinId,
        harvestDay: captureDay,
        harvestedAt: capturedAt,
        cropPlantedAt: Timestamp.fromDate(sharedBasePinState.plant.plantedAt)
      });
    }
    if (waterRewards?.fish) {
      transaction.set(
        waterFishStateRef,
        buildCapturedWaterFishState({
          pinId: params.request.pinId,
          cycle: fishCycle,
          now,
          uid: params.uid
        })
      );
      if (replacementCandidate) {
        transaction.set(
          getWaterFishStateRef(db, fishCycle, replacementCandidate.pinId),
          buildReplacementWaterFishState({
            pinId: replacementCandidate.pinId,
            replacedPinId: params.request.pinId,
            cycle: fishCycle,
            now
          })
        );
      }
    }
    if (usingHarvestRecapture) {
      transaction.set(
        harvestRecaptureOverrideRef,
        {
          used: true,
          usedAt: capturedAt
        },
        { merge: true }
      );
    }
    if (nextStarterQuest && completedStarterQuest) {
      transaction.set(questStateRef, nextStarterQuest);
    }
    transaction.create(requestRef, {
      schemaVersion: 1,
      fingerprint,
      response,
      createdAt: capturedAt
    });

    return response;
  });
}

function hashValue(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Every harvest-ready crop grants exactly one matching resource per player/day. */
export function getCropHarvestItemId(seedId: string): string | null {
  return {
    wheat_seed: "wheat",
    corn_seed: "corn",
    sugar_cane_seed: "sugar_cane",
    tomato_seed: "tomato",
    cocoa_bean_seed: "cocoa_beans"
  }[seedId] ?? null;
}
