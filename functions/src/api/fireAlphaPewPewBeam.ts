import { createHash } from "node:crypto";

import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  ALPHA_PEW_PEW_TEST_KIT_ID,
  getNextUtcReset,
  getPewPewChargeState,
  PEW_PEW_DAILY_TEST_CHARGES
} from "./alphaPewPewTestKit";
import {
  FARMER_MARKET_EVENT_PEW_PEW_CHARGES,
  getActiveFarmerMarketEventPewPewPass,
  getFarmerMarketEventPewPewPassRef
} from "./farmerMarkets";
import {
  acquireAuthoritativePins,
  cacheNearbyPinClassifications,
  cacheNearbyPinSources
} from "./getNearbyBasePins";
import {
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import {
  getCropHarvestItemId,
  isPrivateAlphaCaptureEnabled,
  PRIVATE_ALPHA_CAPTURE_COINS,
  PRIVATE_ALPHA_CAPTURE_MAX_ACCURACY_METRES,
  PRIVATE_ALPHA_WATER_CAPTURE_POINTS
} from "../domain/captures/privateAlphaCapture";
import {
  getGrowGoSeasonAt,
  getGrowGoUtcDayKey
} from "../domain/leaderboards/leaderboardPeriods";
import {
  buildLeaderboardScoreDocument,
  readLeaderboardScoreDocument
} from "../domain/leaderboards/leaderboardScoreStore";
import {
  getPlayerDocumentRef,
  readStoredPlayerDocument,
  serializePlayerSnapshot
} from "../domain/players/playerStore";
import { getPlayerLevelAfterXpGain } from "../domain/players/playerLeveling";
import {
  calculateCoinsWithActiveBuff,
  calculatePointsWithActiveBuff,
  calculateXpWithBestAvailableBonus
} from "../domain/players/playerBuffs";
import {
  resolvePartyXpBonusForReward,
  serializePartyXpBonus
} from "../domain/parties/partyBonus";
import {
  getWaterPinCaptureRewards,
  WATER_PIN_FISH_XP
} from "../domain/pins/waterPinRewards";
import {
  BASE_PIN_STARTING_POINTS,
  buildBasePinCaptureValueState,
  getBasePinPointValue,
  readBasePinCaptureValueState,
  SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION
} from "../domain/pins/basePinValue";
import {
  buildCapturedWaterFishState,
  buildReplacementWaterFishState,
  getWaterFishCycle,
  getWaterFishStateRef,
  readWaterFishActivitiesForPins,
  readWaterFishReplacementCandidates,
  resolveWaterFishActivity,
  type WaterFishCandidate,
  WATER_FISH_SPAWN_CHANCE
} from "../domain/pins/waterFishSpawns";
import {
  getWaterFishSpawnMultiplier,
  readOfficialEventSchedule
} from "../domain/events/officialEvents";
import {
  MARKET_INVENTORY_SCHEMA_VERSION,
  readMarketInventory
} from "../domain/market/marketCatalog";
import {
  ALBERT_PARK_GRAND_PRIX_CIRCUIT_ACHIEVEMENT_POINTS,
  buildAlbertParkGrandPrixCircuitProgressStorage,
  getAlbertParkGrandPrixCircuitProgressRef,
  isAlbertParkGrandPrixCircuitSpecialPin,
  readAlbertParkGrandPrixCircuitProgress,
  recordAlbertParkGrandPrixCircuitCaptures,
  serializeAlbertParkGrandPrixCircuitProgress
} from "../domain/routes/albertParkGrandPrixCircuit";
import {
  GREAT_OCEAN_ROAD_ACHIEVEMENT_POINTS,
  buildGreatOceanRoadProgressStorage,
  getGreatOceanRoadProgressRef,
  isGreatOceanRoadSpecialPin,
  readGreatOceanRoadProgress,
  recordGreatOceanRoadCaptures,
  serializeGreatOceanRoadProgress
} from "../domain/routes/greatOceanRoad";
import {
  buildPlayerAchievementRecordsStorage,
  completeAchievementRecord,
  getPlayerAchievementRecordsRef,
  readStoredPlayerAchievementRecords
} from "../domain/achievements/achievementRecords";
import {
  buildWorldFirstAnnouncementStorage,
  buildFirstWorldFirstAchievementStorage,
  buildSharedWorldFirstAchievementUpdate,
  getCurrentWorldFirstAnnouncementRef,
  getWorldFirstAchievementRef,
  isWorldFirstEligibleAchievement,
  readStoredWorldFirstAchievement,
  resolveWorldFirstAward
} from "../domain/achievements/worldFirsts";
import {
  readSharedBasePinState,
  SHARED_BASE_PIN_STATES_COLLECTION,
  sharedWorldDocumentId,
  type SharedBasePinPlant
} from "../domain/world/sharedWorld";
import { isCropHarvestActive } from "../domain/world/cropLifecycle";
import { getAdminFirestore } from "../firebaseAdmin";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireFiniteNumber,
  requireIsoTimestamp,
  requireRequestId
} from "../validation/requestValidation";

const PEW_PEW_BEAM_LENGTH_METRES = 2_000;
const PEW_PEW_BEAM_HALF_WIDTH_METRES = 100;
const PEW_PEW_BEAM_BOUNDARY_PADDING_METRES = 60;
const PEW_PEW_MAX_HITS_PER_SHOT = 100;
const PEW_PEW_CACHED_PIN_SCAN_LIMIT = 1_500;
const PEW_PEW_CLIENT_FIRED_MAX_AGE_MILLISECONDS = 5 * 60 * 1_000;

interface FirePewPewRequest {
  requestId: string;
  latitude: number;
  longitude: number;
  accuracyMetres: number;
  clientFiredAt: string;
  aimAngleDegrees: number;
  deviceId?: string;
}

interface BeamCandidate {
  pinId: string;
  latitude: number;
  longitude: number;
  type: "base" | "water";
}

export function validateFireAlphaPewPewBeamRequest(
  request: CallableRequest<unknown>
): FirePewPewRequest {
  const payload = asObject(request.data, "fireAlphaPewPewBeam payload");
  assertAllowedKeys(
    payload,
    [
      "requestId",
      "latitude",
      "longitude",
      "accuracyMetres",
      "clientFiredAt",
      "aimAngleDegrees",
      "deviceId"
    ],
    "fireAlphaPewPewBeam payload"
  );

  return {
    requestId: requireRequestId(payload.requestId),
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    accuracyMetres: requireFiniteNumber(payload.accuracyMetres, "accuracyMetres", 0, 10_000),
    clientFiredAt: requireIsoTimestamp(payload.clientFiredAt, "clientFiredAt"),
    aimAngleDegrees: requireFiniteNumber(payload.aimAngleDegrees, "aimAngleDegrees", -180, 180),
    deviceId: typeof payload.deviceId === "string" ? payload.deviceId : undefined
  };
}

export async function fireAlphaPewPewBeamHandler(request: CallableRequest<unknown>) {
  const authContext = requireAuthenticated(request);
  requireAppCheckIfEnabled(request);
  requireInvitedUserAccess(request);
  if (!isPrivateAlphaCaptureEnabled()) {
    throw new HttpsError("failed-precondition", "The Pew-Pew alpha test is not active.");
  }

  const input = validateFireAlphaPewPewBeamRequest(request);
  await requireActiveDeviceSessionIfEnabled({
    uid: authContext.uid,
    deviceId: input.deviceId
  });

  const now = new Date();
  assertFreshAndAccurateLocation(input, now);
  const candidates = await acquireBeamCandidates(input);
  await Promise.all([
    cacheNearbyPinSources(candidates.sources),
    cacheNearbyPinClassifications(candidates.classificationPins)
  ]);
  const db = getAdminFirestore();
  const officialEvents = await readOfficialEventSchedule(db, now);
  const waterFishSpawnChance = WATER_FISH_SPAWN_CHANCE * getWaterFishSpawnMultiplier(officialEvents, now);
  const waterFishByPinId = await readWaterFishActivitiesForPins({
    db,
    pinIds: candidates.pins
      .filter((candidate) => candidate.type === "water")
      .map((candidate) => candidate.pinId),
    now,
    spawnChance: waterFishSpawnChance
  });
  const activeFishPinIds = candidates.pins
    .filter((candidate) => waterFishByPinId.get(candidate.pinId)?.active)
    .map((candidate) => candidate.pinId);
  const replacementCandidates = activeFishPinIds.length > 0
    ? await readWaterFishReplacementCandidates({
        db,
        now,
        excludedPinIds: candidates.pins.map((candidate) => candidate.pinId),
        seed: `${authContext.uid}|${input.requestId}`,
        limit: Math.max(12, activeFishPinIds.length * 12),
        spawnChance: waterFishSpawnChance
      })
    : [];

  return captureBeamCandidates({
    uid: authContext.uid,
    input,
    candidates: candidates.pins,
    replacementCandidates,
    waterFishSpawnChance,
    now
  });
}

async function acquireBeamCandidates(input: FirePewPewRequest) {
  const bounds = getBeamBounds(input);
  // Pins displayed on the live map are already server-verified and cached.
  // Prefer those immediately so a momentary Overpass outage cannot turn a
  // valid Pew-Pew shot into a zero-capture shot. The live lookup below still
  // supplements the cache with pins farther along the two-kilometre beam.
  const cachedPins = await readCachedBeamCandidates(bounds, input);
  let sourceResult: Awaited<ReturnType<typeof acquireAuthoritativePins>> | null = null;

  try {
    sourceResult = await acquireAuthoritativePins({
      center: { latitude: input.latitude, longitude: input.longitude },
      bounds,
      maxPins: PEW_PEW_MAX_HITS_PER_SHOT,
      pinFilter: (pin) => isPinInsideBeam(pin, input)
    });
  } catch (error) {
    if (cachedPins.length === 0) throw error;
  }

  const pins = mergeBeamCandidates(cachedPins, sourceResult?.pins ?? [], input);

  return {
    sources: sourceResult?.sources ?? [],
    pins,
    // Only fresh provider results need caching; cached candidates are already
    // stored in authoritativeWaterPinStates.
    classificationPins: sourceResult?.pins ?? []
  };
}

async function readCachedBeamCandidates(
  bounds: ReturnType<typeof getBeamBounds>,
  input: FirePewPewRequest
): Promise<BeamCandidate[]> {
  const snapshot = await getAdminFirestore()
    .collection("authoritativeWaterPinStates")
    .where("latitude", ">=", bounds.south)
    .where("latitude", "<=", bounds.north)
    .limit(PEW_PEW_CACHED_PIN_SCAN_LIMIT)
    .get();

  return snapshot.docs.flatMap((document) => {
    const value = document.data();
    const pinId = typeof value.pinId === "string" ? value.pinId : "";
    const latitude = Number(value.latitude);
    const longitude = Number(value.longitude);
    const type = value.type === "water" ? "water" : value.type === "base" ? "base" : null;
    if (!pinId || !type || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return [];
    }

    const pin = { pinId, latitude, longitude, type } satisfies BeamCandidate;
    return isPinInsideBeam(pin, input) ? [pin] : [];
  });
}

function mergeBeamCandidates(
  cachedPins: readonly BeamCandidate[],
  livePins: readonly BeamCandidate[],
  input: FirePewPewRequest
): BeamCandidate[] {
  const byId = new Map<string, BeamCandidate>();
  [...cachedPins, ...livePins].forEach((pin) => byId.set(pin.pinId, pin));

  return [...byId.values()]
    .filter((pin) => isPinInsideBeam(pin, input))
    .sort((left, right) => distanceAlongBeam(left, input) - distanceAlongBeam(right, input))
    .slice(0, PEW_PEW_MAX_HITS_PER_SHOT);
}

function distanceAlongBeam(pin: { latitude: number; longitude: number }, input: FirePewPewRequest) {
  const direction = getBeamDirection(input.aimAngleDegrees);
  const latitudeRadians = (input.latitude * Math.PI) / 180;
  const metresPerLatitudeDegree = 111_320;
  const metresPerLongitudeDegree = Math.max(1, Math.cos(latitudeRadians) * metresPerLatitudeDegree);
  const east = (pin.longitude - input.longitude) * metresPerLongitudeDegree;
  const north = (pin.latitude - input.latitude) * metresPerLatitudeDegree;
  return east * direction.east + north * direction.north;
}

function assertFreshAndAccurateLocation(input: FirePewPewRequest, now: Date) {
  if (input.accuracyMetres > PRIVATE_ALPHA_CAPTURE_MAX_ACCURACY_METRES) {
    throw new HttpsError("failed-precondition", "Your location accuracy is too low to fire the Pew-Pew 2-2.");
  }

  const clientFiredAt = Date.parse(input.clientFiredAt);
  const ageMilliseconds = now.getTime() - clientFiredAt;
  if (
    !Number.isFinite(clientFiredAt) ||
    ageMilliseconds < -30_000 ||
    ageMilliseconds > PEW_PEW_CLIENT_FIRED_MAX_AGE_MILLISECONDS
  ) {
    throw new HttpsError("failed-precondition", "Use a fresh location reading before firing the Pew-Pew 2-2.");
  }
}

function getBeamBounds(input: FirePewPewRequest) {
  const direction = getBeamDirection(input.aimAngleDegrees);
  const latitudeRadians = (input.latitude * Math.PI) / 180;
  const metresPerLatitudeDegree = 111_320;
  const metresPerLongitudeDegree = Math.max(1, Math.cos(latitudeRadians) * metresPerLatitudeDegree);
  const endLatitude = input.latitude + (direction.north * PEW_PEW_BEAM_LENGTH_METRES) / metresPerLatitudeDegree;
  const endLongitude = input.longitude + (direction.east * PEW_PEW_BEAM_LENGTH_METRES) / metresPerLongitudeDegree;
  const latitudePadding = (PEW_PEW_BEAM_HALF_WIDTH_METRES + PEW_PEW_BEAM_BOUNDARY_PADDING_METRES) / metresPerLatitudeDegree;
  const longitudePadding = (PEW_PEW_BEAM_HALF_WIDTH_METRES + PEW_PEW_BEAM_BOUNDARY_PADDING_METRES) / metresPerLongitudeDegree;

  return {
    south: Math.max(-90, Math.min(input.latitude, endLatitude) - latitudePadding),
    west: Math.max(-180, Math.min(input.longitude, endLongitude) - longitudePadding),
    north: Math.min(90, Math.max(input.latitude, endLatitude) + latitudePadding),
    east: Math.min(180, Math.max(input.longitude, endLongitude) + longitudePadding)
  };
}

function isPinInsideBeam(pin: { latitude: number; longitude: number }, input: FirePewPewRequest) {
  const direction = getBeamDirection(input.aimAngleDegrees);
  const latitudeRadians = (input.latitude * Math.PI) / 180;
  const metresPerLatitudeDegree = 111_320;
  const metresPerLongitudeDegree = Math.max(1, Math.cos(latitudeRadians) * metresPerLatitudeDegree);
  const east = (pin.longitude - input.longitude) * metresPerLongitudeDegree;
  const north = (pin.latitude - input.latitude) * metresPerLatitudeDegree;
  const distanceAlongBeam = east * direction.east + north * direction.north;
  const distanceFromBeamCentre = Math.abs(east * direction.north - north * direction.east);

  return (
    distanceAlongBeam >= 0 &&
    distanceAlongBeam <= PEW_PEW_BEAM_LENGTH_METRES &&
    distanceFromBeamCentre <= PEW_PEW_BEAM_HALF_WIDTH_METRES
  );
}

function getBeamDirection(aimAngleDegrees: number) {
  const bearingRadians = ((aimAngleDegrees + 90) * Math.PI) / 180;
  return {
    east: Math.sin(bearingRadians),
    north: Math.cos(bearingRadians)
  };
}

export async function captureBeamCandidates(params: {
  uid: string;
  input: FirePewPewRequest;
  candidates: readonly BeamCandidate[];
  replacementCandidates: readonly WaterFishCandidate[];
  waterFishSpawnChance: number;
  now: Date;
}) {
  const db = getAdminFirestore();
  const playerRef = getPlayerDocumentRef(params.uid);
  const playerInventoryRef = db.collection("playerMarketInventories").doc(params.uid);
  const kitRewardRef = db
    .collection("playerRewardGrants")
    .doc(params.uid)
    .collection("rewards")
    .doc(ALPHA_PEW_PEW_TEST_KIT_ID);
  const chargeStateRef = db
    .collection("playerToyChargeStates")
    .doc(params.uid)
    .collection("toys")
    .doc("pew-pew-2-2");
  const eventPewPewPassRef = getFarmerMarketEventPewPewPassRef(params.uid);
  const shotRef = db
    .collection("privateAlphaPewPewShots")
    .doc(hashValue(`${params.uid}|${params.input.requestId}`));
  const leaderboardScoreRef = db.collection("playerLeaderboardScores").doc(params.uid);
  const circuitProgressRef = getAlbertParkGrandPrixCircuitProgressRef(db, params.uid);
  const greatOceanRoadProgressRef = getGreatOceanRoadProgressRef(db, params.uid);
  const achievementRecordsRef = getPlayerAchievementRecordsRef(db, params.uid);
  const hasCircuitCandidate = params.candidates.some((candidate) =>
    isAlbertParkGrandPrixCircuitSpecialPin(candidate.pinId)
  );
  const hasGreatOceanRoadCandidate = params.candidates.some((candidate) =>
    isGreatOceanRoadSpecialPin(candidate.pinId)
  );
  const possibleWorldFirstAchievementIds = [
    ...(hasCircuitCandidate ? ["achievement-albert-park-grand-prix-circuit"] : []),
    ...(hasGreatOceanRoadCandidate ? ["achievement-great-ocean-road"] : [])
  ].filter(isWorldFirstEligibleAchievement);
  const possibleWorldFirstAchievementRefs = possibleWorldFirstAchievementIds.map((achievementId) => ({
    achievementId,
    ref: getWorldFirstAchievementRef(db, achievementId)
  }));
  const captureDay = getGrowGoUtcDayKey(params.now);
  const captureRefs = params.candidates.map((candidate) =>
    db.collection("playerCaptureStates").doc(params.uid).collection("pins").doc(hashValue(candidate.pinId))
  );
  const sharedStateRefs = params.candidates.map((candidate) =>
    db.collection(SHARED_BASE_PIN_STATES_COLLECTION).doc(sharedWorldDocumentId(candidate.pinId))
  );
  const cropHarvestRefs = params.candidates.map((candidate) =>
    db.collection("sharedBasePinHarvests").doc(sharedWorldDocumentId(candidate.pinId))
      .collection("players").doc(params.uid)
  );
  const basePinValueStateRefs = params.candidates.map((candidate) =>
    db.collection(SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION).doc(sharedWorldDocumentId(candidate.pinId))
  );
  const fishCycle = getWaterFishCycle(params.now);
  const waterFishStateRefs = params.candidates.map((candidate) =>
    getWaterFishStateRef(db, fishCycle, candidate.pinId)
  );
  const replacementFishStateRefs = params.replacementCandidates.map((candidate) =>
    getWaterFishStateRef(db, fishCycle, candidate.pinId)
  );

  return db.runTransaction(async (transaction) => {
    const [
      shotSnapshot,
      playerSnapshot,
      kitRewardSnapshot,
      chargeStateSnapshot,
      eventPewPewPassSnapshot,
      leaderboardScoreSnapshot,
      inventorySnapshot,
      captureSnapshots,
      sharedStateSnapshots,
      basePinValueStateSnapshots,
      waterFishStateSnapshots,
      replacementFishStateSnapshots,
      circuitProgressSnapshot,
      greatOceanRoadProgressSnapshot,
      achievementRecordsSnapshot,
      worldFirstAchievementSnapshots
    ] = await Promise.all([
      transaction.get(shotRef),
      transaction.get(playerRef),
      transaction.get(kitRewardRef),
      transaction.get(chargeStateRef),
      transaction.get(eventPewPewPassRef),
      transaction.get(leaderboardScoreRef),
      transaction.get(playerInventoryRef),
      Promise.all(captureRefs.map((ref) => transaction.get(ref))),
      Promise.all(sharedStateRefs.map((ref) => transaction.get(ref))),
      Promise.all(basePinValueStateRefs.map((ref) => transaction.get(ref))),
      Promise.all(waterFishStateRefs.map((ref) => transaction.get(ref))),
      Promise.all(replacementFishStateRefs.map((ref) => transaction.get(ref))),
      transaction.get(circuitProgressRef),
      hasGreatOceanRoadCandidate
        ? transaction.get(greatOceanRoadProgressRef)
        : Promise.resolve(null),
      hasCircuitCandidate || hasGreatOceanRoadCandidate
        ? transaction.get(achievementRecordsRef)
        : Promise.resolve(null),
      Promise.all(possibleWorldFirstAchievementRefs.map(({ ref }) => transaction.get(ref)))
    ]);

    if (shotSnapshot.exists) {
      const stored = shotSnapshot.data();
      if (stored?.response) return { ...stored.response, replayed: true };
      throw new HttpsError("already-exists", "This Pew-Pew shot has already been used.");
    }
    if (!playerSnapshot.exists) {
      throw new HttpsError("failed-precondition", "Create your GrowGo profile before firing the Pew-Pew 2-2.");
    }
    const player = readStoredPlayerDocument(playerSnapshot.data());
    if (!player.profileComplete) {
      throw new HttpsError("failed-precondition", "Complete your player profile before firing the Pew-Pew 2-2.");
    }
    const eventPewPewPass = getActiveFarmerMarketEventPewPewPass(
      eventPewPewPassSnapshot.data(),
      params.now
    );
    if (!kitRewardSnapshot.exists && !eventPewPewPass) {
      throw new HttpsError("failed-precondition", "The Pew-Pew 2-2 test kit is not available on this account.");
    }

    const chargeState = kitRewardSnapshot.exists
      ? getPewPewChargeState(chargeStateSnapshot.data(), captureDay)
      : { dayKey: captureDay, chargesAvailable: 0, bonusCharges: 0 };
    const useEventPewPewCharge = eventPewPewPass !== null;
    if (!useEventPewPewCharge && chargeState.chargesAvailable <= 0) {
      throw new HttpsError("resource-exhausted", "All Pew-Pew charges have been used. They reset at 00:00 UTC.");
    }

    const capturedCandidates = params.candidates.filter((candidate, index) => {
      const capture = captureSnapshots[index];
      return !(capture.exists && capture.data()?.captureDay === captureDay);
    });
    // Only harvest-ready, uncaptured base crops need the extra daily-receipt
    // read. Keep it inside this transaction so concurrent harvests still
    // conflict safely, without adding reads for every ordinary beam hit.
    const harvestCandidateIndexes = capturedCandidates.flatMap((candidate) => {
      if (candidate.type !== "base") return [];
      const index = params.candidates.indexOf(candidate);
      const state = readSharedBasePinState(sharedStateSnapshots[index]?.data());
      return state?.plant && isCropHarvestActive(state.plant, params.now) ? [index] : [];
    });
    const cropHarvestSnapshots = new Map(await Promise.all(
      harvestCandidateIndexes.map(async (index) =>
        [index, await transaction.get(cropHarvestRefs[index])] as const)
    ));
    const captureCoins = calculateCoinsWithActiveBuff({
      player,
      baseCoins: PRIVATE_ALPHA_CAPTURE_COINS,
      now: params.now
    });
    const resources: Record<string, number> = {};
    let fishCount = 0;
    const capturedFishPinIds: string[] = [];
    const hits = capturedCandidates.map((candidate) => {
      const candidateIndex = params.candidates.indexOf(candidate);
      const sharedState = readSharedBasePinState(sharedStateSnapshots[candidateIndex]?.data());
      const basePinValueState = readBasePinCaptureValueState(
        basePinValueStateSnapshots[candidateIndex]?.data()
      );
      const pointValue = candidate.type === "base"
        ? getBasePinPointValue({
            lastCapturedAt: basePinValueState?.lastCapturedAt,
            now: params.now
          })
        : PRIVATE_ALPHA_WATER_CAPTURE_POINTS;
      const capturePoints = calculatePointsWithActiveBuff({
        player,
        basePoints: pointValue,
        now: params.now
      });
      const activeWaterFish = candidate.type === "water"
        ? resolveWaterFishActivity({
            pinId: candidate.pinId,
            cycle: fishCycle,
            value: waterFishStateSnapshots[candidateIndex]?.data(),
            spawnChance: params.waterFishSpawnChance
          })
        : null;
      const waterRewards = candidate.type === "water"
        ? getWaterPinCaptureRewards(activeWaterFish?.active === true)
        : null;
      if (waterRewards?.water) addResource(resources, "water", waterRewards.water);
      if (waterRewards?.fish) {
        addResource(resources, "fish", 1);
        fishCount += 1;
        capturedFishPinIds.push(candidate.pinId);
      }

      const harvestResource = candidate.type === "base"
        ? getPewPewCropHarvestResource(
            sharedState?.plant ?? null,
            params.now,
            cropHarvestSnapshots.get(candidateIndex)?.data()?.harvestDay
          )
        : null;
      if (harvestResource) addResource(resources, harvestResource, 1);

      return {
        pinId: candidate.pinId,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        type: candidate.type,
        points: capturePoints.points,
        basePoints: capturePoints.basePoints,
        bonusPoints: capturePoints.bonusPoints,
        pointValue,
        nextPointValue: candidate.type === "base"
          ? BASE_PIN_STARTING_POINTS
          : PRIVATE_ALPHA_WATER_CAPTURE_POINTS,
        lastValueCaptureAt: params.now.toISOString(),
        coins: captureCoins.coins,
        waterRewards: waterRewards
          ? { water: waterRewards.water, fish: waterRewards.fish }
          : null,
        harvestResource,
        harvest: harvestResource && sharedState?.plant
          ? {
              itemId: harvestResource,
              harvestDay: captureDay,
              cropPlantedAt: sharedState.plant.plantedAt.toISOString()
            }
          : null
      };
    });

    const totalPoints = hits.reduce((total, hit) => total + hit.points, 0);
    const totalBasePoints = hits.reduce((total, hit) => total + hit.basePoints, 0);
    const totalBonusPoints = hits.reduce((total, hit) => total + hit.bonusPoints, 0);
    const totalCoins = hits.length * captureCoins.coins;
    const partyXpBonus = await resolvePartyXpBonusForReward({
      db,
      transaction,
      uid: params.uid,
      now: params.now,
      currentLocation: {
        latitude: params.input.latitude,
        longitude: params.input.longitude,
        accuracyMetres: params.input.accuracyMetres
      }
    });
    const xpResult = calculateXpWithBestAvailableBonus({
      player,
      baseXp: totalPoints + fishCount * WATER_PIN_FISH_XP,
      now: params.now,
      partyMultiplier: partyXpBonus.multiplier
    });
    const totalXp = xpResult.xp;
    const activeSeason = getGrowGoSeasonAt(params.now);
    const storedLeaderboardScores = readLeaderboardScoreDocument(leaderboardScoreSnapshot.data());
    const nextCircuitRoute = recordAlbertParkGrandPrixCircuitCaptures({
      progress: readAlbertParkGrandPrixCircuitProgress(circuitProgressSnapshot.data()),
      pinIds: capturedCandidates
        .map((candidate) => candidate.pinId)
        .filter(isAlbertParkGrandPrixCircuitSpecialPin),
      now: params.now
    });
    const circuitAchievementPoints = nextCircuitRoute.completedNow
      ? ALBERT_PARK_GRAND_PRIX_CIRCUIT_ACHIEVEMENT_POINTS
      : 0;
    const nextGreatOceanRoad = hasGreatOceanRoadCandidate
      ? recordGreatOceanRoadCaptures({
          progress: readGreatOceanRoadProgress(greatOceanRoadProgressSnapshot?.data()),
          pinIds: capturedCandidates
            .map((candidate) => candidate.pinId)
            .filter(isGreatOceanRoadSpecialPin),
          now: params.now
        })
      : null;
    const greatOceanRoadAchievementPoints = nextGreatOceanRoad?.completedNow
      ? GREAT_OCEAN_ROAD_ACHIEVEMENT_POINTS
      : 0;
    const completedAchievementIds = [
      ...(nextCircuitRoute.completedNow
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
        now: params.now,
        stored
      });
      if (award) worldFirstAwards.set(achievementId, { award, stored });
    });
    let nextAchievementRecords = achievementRecordsSnapshot
      ? readStoredPlayerAchievementRecords(achievementRecordsSnapshot.data())
      : null;
    if (nextAchievementRecords && nextCircuitRoute.completedNow) {
      nextAchievementRecords = completeAchievementRecord({
        records: nextAchievementRecords,
        achievementId: "achievement-albert-park-grand-prix-circuit",
        completedAt: params.now,
        source: "server",
        worldFirst: worldFirstAwards.get("achievement-albert-park-grand-prix-circuit")?.award || null
      });
    }
    if (nextAchievementRecords && nextGreatOceanRoad?.completedNow) {
      nextAchievementRecords = completeAchievementRecord({
        records: nextAchievementRecords,
        achievementId: "achievement-great-ocean-road",
        completedAt: params.now,
        source: "server",
        worldFirst: worldFirstAwards.get("achievement-great-ocean-road")?.award || null
      });
    }
    const marketInventory = readMarketInventory(inventorySnapshot.data());
    const nextMarketInventory = Object.entries(resources).reduce(
      (inventory, [itemId, quantity]) => ({
        ...inventory,
        [itemId]: Math.min(10_000, Number(inventory[itemId] || 0) + Number(quantity || 0))
      }),
      { ...marketInventory }
    );
    const nextPlayer = {
      ...player,
      xp: player.xp + totalXp,
      coins: player.coins + totalCoins,
      level: getPlayerLevelAfterXpGain({
        currentLevel: player.level,
        totalXp: player.xp + totalXp
      }),
      updatedAt: params.now
    };
    const nextChargeState = {
      ...chargeState,
      chargesAvailable: useEventPewPewCharge
        ? chargeState.chargesAvailable
        : chargeState.chargesAvailable - 1
    };
    const nextEventPasses = eventPewPewPassSnapshot.data()?.passes;
    const safeNextEventPasses = nextEventPasses && typeof nextEventPasses === "object" && !Array.isArray(nextEventPasses)
      ? { ...(nextEventPasses as Record<string, unknown>) }
      : {};
    if (useEventPewPewCharge && eventPewPewPass) {
      const currentPass = safeNextEventPasses[eventPewPewPass.marketId];
      safeNextEventPasses[eventPewPewPass.marketId] = {
        ...(currentPass && typeof currentPass === "object" && !Array.isArray(currentPass)
          ? currentPass as Record<string, unknown>
          : {}),
        marketId: eventPewPewPass.marketId,
        marketName: eventPewPewPass.marketName,
        endsAt: Timestamp.fromDate(eventPewPewPass.endsAt),
        chargesAvailable: Math.max(0, eventPewPewPass.chargesAvailable - 1)
      };
    }
    const nextEventPewPewPass = getActiveFarmerMarketEventPewPewPass(
      { passes: safeNextEventPasses },
      params.now
    );
    const nextEventChargesAvailable = nextEventPewPewPass?.chargesAvailable || 0;
    const nextDailyPoints = storedLeaderboardScores.daily.key === captureDay
      ? storedLeaderboardScores.daily.points + totalPoints
      : totalPoints;
    const nextSeasonalPoints = storedLeaderboardScores.seasonal.key === activeSeason.key
      ? storedLeaderboardScores.seasonal.points + totalPoints
      : storedLeaderboardScores.seasonal.key === null
        ? player.xp + totalPoints
        : totalPoints;
    const capturedAt = Timestamp.fromDate(params.now);
    const usedReplacementPinIds = new Set<string>();
    const fishReplacements = capturedFishPinIds.flatMap((capturedPinId) => {
      const candidateIndex = params.replacementCandidates.findIndex((candidate, index) =>
        !usedReplacementPinIds.has(candidate.pinId) &&
        !resolveWaterFishActivity({
          pinId: candidate.pinId,
          cycle: fishCycle,
          value: replacementFishStateSnapshots[index]?.data(),
          spawnChance: params.waterFishSpawnChance
        }).active
      );
      if (candidateIndex < 0) return [];
      const candidate = params.replacementCandidates[candidateIndex];
      usedReplacementPinIds.add(candidate.pinId);
      return [{ capturedPinId, replacementPinId: candidate.pinId }];
    });
    const response = {
      ok: true,
      replayed: false,
      shot: {
        captureCount: hits.length,
        points: totalPoints,
        basePoints: totalBasePoints,
        bonusPoints: totalBonusPoints,
        xp: totalXp,
        baseXp: xpResult.baseXp,
        bonusXp: xpResult.bonusXp,
        partyBonus: serializePartyXpBonus(
          partyXpBonus,
          xpResult.partyApplied,
          xpResult.partyBonusXp
        ),
        activeBuffApplied: Boolean(xpResult.buff || totalBonusPoints > 0 || captureCoins.buff || xpResult.partyApplied),
        coins: totalCoins,
        baseCoins: hits.length * captureCoins.baseCoins,
        bonusCoins: hits.length * captureCoins.bonusCoins,
        capturedAt: params.now.toISOString(),
        nextCaptureAt: getNextUtcReset(params.now)
      },
      hits,
      resources,
      chargesAvailable: nextEventChargesAvailable + nextChargeState.chargesAvailable,
      eventChargesAvailable: nextEventChargesAvailable,
      regularChargesAvailable: nextChargeState.chargesAvailable,
      dailyCharges: kitRewardSnapshot.exists ? PEW_PEW_DAILY_TEST_CHARGES : 0,
      bonusCharges: nextChargeState.bonusCharges,
      eventPass: nextEventPewPewPass
        ? {
            marketId: nextEventPewPewPass.marketId,
            marketName: nextEventPewPewPass.marketName,
            endsAt: nextEventPewPewPass.endsAt.toISOString(),
            chargesAvailable: nextEventPewPewPass.chargesAvailable,
            maximumCharges: FARMER_MARKET_EVENT_PEW_PEW_CHARGES
          }
        : null,
      mode: nextEventChargesAvailable > 0 ? "farmer-market" : "live-alpha",
      resetsAt: getNextUtcReset(params.now),
      circuitRoute: serializeAlbertParkGrandPrixCircuitProgress(nextCircuitRoute),
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
      xp: nextPlayer.xp,
      coins: nextPlayer.coins,
      level: nextPlayer.level,
      updatedAt: capturedAt
    });
    if (kitRewardSnapshot.exists) {
      transaction.set(chargeStateRef, {
        schemaVersion: 1,
        toyId: "pew_pew_2_2",
        ...nextChargeState,
        updatedAt: capturedAt
      }, { merge: true });
    }
    if (useEventPewPewCharge) {
      transaction.set(eventPewPewPassRef, {
        schemaVersion: 1,
        passes: safeNextEventPasses,
        updatedAt: capturedAt
      }, { merge: true });
    }
    transaction.set(
      leaderboardScoreRef,
      buildLeaderboardScoreDocument({
        daily: { key: captureDay, points: nextDailyPoints },
        seasonal: { key: activeSeason.key, points: nextSeasonalPoints },
        achievementPoints:
          storedLeaderboardScores.achievementPoints +
          circuitAchievementPoints +
          greatOceanRoadAchievementPoints,
        updatedAt: capturedAt
      })
    );
    if (nextCircuitRoute.capturedCount > 0) {
      transaction.set(
        circuitProgressRef,
        buildAlbertParkGrandPrixCircuitProgressStorage(nextCircuitRoute)
      );
    }
    if (nextGreatOceanRoad && nextGreatOceanRoad.capturedCount > 0) {
      transaction.set(
        greatOceanRoadProgressRef,
        buildGreatOceanRoadProgressStorage(nextGreatOceanRoad)
      );
    }
    if (nextAchievementRecords && (nextCircuitRoute.completedNow || nextGreatOceanRoad?.completedNow)) {
      transaction.set(
        achievementRecordsRef,
        buildPlayerAchievementRecordsStorage({ records: nextAchievementRecords, updatedAt: params.now })
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
            now: params.now,
            award
          })
        );
        return;
      }
      if (stored) {
        transaction.update(
          worldFirstRef,
          buildSharedWorldFirstAchievementUpdate({ stored, now: params.now })
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
          now: params.now,
          award
        })
      );
    });
    if (Object.keys(resources).length > 0) {
      transaction.set(
        playerInventoryRef,
        {
          schemaVersion: MARKET_INVENTORY_SCHEMA_VERSION,
          items: nextMarketInventory,
          updatedAt: capturedAt,
          ...(inventorySnapshot.exists
            ? {}
            : { initializedAt: capturedAt, import: "pew-pew-resource-capture-v1" })
        },
        { merge: true }
      );
    }
    hits.forEach((hit) => {
      const candidateIndex = params.candidates.findIndex((candidate) => candidate.pinId === hit.pinId);
      transaction.set(captureRefs[candidateIndex], {
        schemaVersion: 1,
        pinId: hit.pinId,
        captureDay,
        capturedAt,
        source: "pew-pew-2-2"
      });
      if (hit.type === "base") {
        transaction.set(
          basePinValueStateRefs[candidateIndex],
          buildBasePinCaptureValueState({
            pinId: hit.pinId,
            capturedAt: params.now
          })
        );
      }
      if (hit.harvest) {
        // Use the same per-player receipt as ordinary capture and harvest.
        // Nearby reads then retain this crop's daily lock after refresh.
        transaction.set(cropHarvestRefs[candidateIndex], {
          schemaVersion: 1,
          pinId: hit.pinId,
          harvestDay: hit.harvest.harvestDay,
          harvestedAt: capturedAt,
          cropPlantedAt: Timestamp.fromDate(new Date(hit.harvest.cropPlantedAt))
        });
      }
    });
    capturedFishPinIds.forEach((pinId) => {
      const candidateIndex = params.candidates.findIndex((candidate) => candidate.pinId === pinId);
      transaction.set(
        waterFishStateRefs[candidateIndex],
        buildCapturedWaterFishState({
          pinId,
          cycle: fishCycle,
          now: params.now,
          uid: params.uid
        })
      );
    });
    fishReplacements.forEach(({ capturedPinId, replacementPinId }) => {
      transaction.set(
        getWaterFishStateRef(db, fishCycle, replacementPinId),
        buildReplacementWaterFishState({
          pinId: replacementPinId,
          replacedPinId: capturedPinId,
          cycle: fishCycle,
          now: params.now
        })
      );
    });
    transaction.create(shotRef, {
      schemaVersion: 1,
      requestId: params.input.requestId,
      response,
      createdAt: capturedAt
    });

    return response;
  });
}

export function getPewPewCropHarvestResource(
  plant: SharedBasePinPlant | null,
  now: Date,
  previousHarvestDay?: unknown
) {
  // Match the normal capture writer's one-resource-per-player/UTC-day rule,
  // including legacy receipts without cropPlantedAt. A replant is not a way
  // to collect a second resource from the same plot on the same day.
  if (!plant || !isCropHarvestActive(plant, now) || previousHarvestDay === getGrowGoUtcDayKey(now)) {
    return null;
  }
  return getCropHarvestItemId(plant.seedId);
}

function addResource(resources: Record<string, number>, itemId: string, quantity: number) {
  resources[itemId] = (resources[itemId] ?? 0) + quantity;
}

function hashValue(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export const fireAlphaPewPewBeam = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  fireAlphaPewPewBeamHandler
);
