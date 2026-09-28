import { createHash, randomUUID } from "node:crypto";
import { readLeonardBirdhouseEntry } from '../domain/quests/leonardBirdhouse';
import { planBirdRewardTarget } from '../domain/quests/birdRewardTarget';
import { birdDeploymentDocument, changeOwnedBirdDeployment } from '../domain/quests/ownedBirdDeployment';
import { Timestamp, type DocumentData, type Transaction } from "firebase-admin/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { runtimeConfig } from "../config/runtimeConfig";
import { getAdminFirestore } from "../firebaseAdmin";
import { requireAuthenticated, requireAppCheckIfEnabled } from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import { requireActiveDeviceSessionIfEnabled } from "../domain/players/activeDeviceSession";
import { getPlayerDocumentRef, readStoredPlayerDocument, serializePlayerSnapshot } from "../domain/players/playerStore";
import { getPlayerLevelAfterXpGain } from "../domain/players/playerLeveling";
import { getActivePlayerCaptureRadiusMultiplier } from "../domain/players/playerBuffs";
import { readMarketInventory, MARKET_MAX_ITEM_QUANTITY } from "../domain/market/marketCatalog";
import { readLeaderboardScoreDocument, buildLeaderboardScoreDocument } from "../domain/leaderboards/leaderboardScoreStore";
import { getGrowGoSeasonAt, getGrowGoUtcDayKey } from "../domain/leaderboards/leaderboardPeriods";
import { readSharedBasePinState, SHARED_BASE_PIN_STATES_COLLECTION, SHARED_POI_PINS_COLLECTION, sharedWorldDocumentId } from "../domain/world/sharedWorld";
import { hasCropHarvestWindowEnded, isCropHarvestActive } from "../domain/world/cropLifecycle";
import { calculateHaversineDistanceMetres } from "../domain/pins/canonicalPinGenerator";
import { verifyAuthoritativeCanonicalPin } from "../domain/pins/authoritativePinVerifier";
import { createFirestoreAuthoritativeSourceCache, AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME } from "../infrastructure/pins/firestoreAuthoritativePinCache";
import type { AuthoritativePinSourceProvider } from "../domain/pins/authoritativePinSource";
import { isDailyGreenPoi } from "./captureDailyPoi";
import { isAlbertParkGrandPrixCircuitSpecialPin } from "../domain/routes/albertParkGrandPrixCircuit";
import { isGreatOceanRoadSpecialPin } from "../domain/routes/greatOceanRoad";
import { asObject, assertAllowedKeys, requireFiniteNumber, requireString } from "../validation/requestValidation";
import { DOVE_PILOT_EMAIL, DOVE_ENCOUNTER_MS, chooseT1Offers, getT1Quest, rollT1Reward, advanceBirdRun, type BirdRun, type VerifiedBirdAction } from "../domain/quests/t1BirdQuests";
import { SHARED_DOVE_COLLECTION, SHARED_DOVE_DOCUMENT, eligibleBirdPlot, eligibleDeployedBirdPlot, isActiveBirdDeployment, isExpiredBirdDeployment, shouldMoveExpiredBird, publicBirdDeployment, type SharedDoveDeployment } from "../domain/quests/sharedBirdDeployment";
import { chooseGlobalBirdLanding } from "../domain/quests/globalBirdLanding";
import { moveExpiredBirdVisit } from "../domain/quests/expiredBirdTravel";
import {automaticLeonardEnabled,leonardPlayerEnabled,leonardTestPlayers} from '../domain/quests/leonardAccess';

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const stateRef = (uid: string) => getAdminFirestore().collection("birdQuestPlayers").doc(uid);
const deploymentRef = () => getAdminFirestore().collection(SHARED_DOVE_COLLECTION).doc(SHARED_DOVE_DOCUMENT);
const leonardOwner = 'LkR8ugTK6lXGFfUlLvKSiqMoMBh1';
const leonardBird = 'leonard-introduction-dove';
const allLeonardEnabled = () => process.env.GROWGO_LEONARD_ALL_PLAYERS_ENABLED === 'true';
const leonardEnabled = () => allLeonardEnabled() || process.env.GROWGO_LEONARD_PILOT_ENABLED === 'true';
const earnedDeploymentRef = (uid=leonardOwner) => getAdminFirestore().collection(SHARED_DOVE_COLLECTION).doc(birdDeploymentDocument(uid, leonardBird));
// Bounded two-bird pilot, not a world collection scan.
const visibleDeploymentRefs = () => [deploymentRef(), ...[...new Set([...(leonardEnabled()?[leonardOwner]:[]),...leonardTestPlayers()])].map(uid=>earnedDeploymentRef(uid))];
async function selectedDeployment(tx: Transaction, visitId: string) {
  if(allLeonardEnabled()){
    const docs=await tx.get(getAdminFirestore().collection(SHARED_DOVE_COLLECTION).where('id','==',visitId).limit(2));
    if(docs.size!==1)return null;
    const doc=docs.docs[0],data=doc.data() as SharedDoveDeployment;
    if(!data.ownerUid||!data.birdId||doc.id!==birdDeploymentDocument(data.ownerUid,data.birdId))return null;
    return (await readDeploymentAvailability(tx,doc.ref)).active;
  }
  for (const ref of visibleDeploymentRefs()) {
    const value = (await readDeploymentAvailability(tx, ref)).active;
    if (value?.id === visitId) return value;
  }
  return null;
}
const millis = (value: unknown) => value instanceof Timestamp ? value.toMillis() : 0;
const isRoute = (id: string) => isAlbertParkGrandPrixCircuitSpecialPin(id) || isGreatOceanRoadSpecialPin(id);
interface Candidate { id: string; lat: number; lng: number }
interface Location { latitude: number; longitude: number; accuracyMetres: number }
interface PilotState {
  schemaVersion: 1; uid: string; bird: null | { id: string; name: string; level: 1; xp: number; questsCompleted: number };
  activeRunId: string | null; offer: null | { id: string; origin: Location; landing: Candidate; expiresAt: number; questIds: string[]; candidates: Candidate[]; deploymentId?: string; birdId?: string; birdOwnerUid?: string };
  pendingMailCount?: number;
  cardCounts: Record<string, number>; updatedAt: Timestamp;
}
function readPilot(data: DocumentData | undefined, uid: string): PilotState | null {
  if (!data) return null;
  if (data.schemaVersion !== 1 || data.uid !== uid || (data.bird !== null && (data.bird?.id !== `alpha-dove-${uid}`
    || data.bird?.level !== 1 || !Number.isSafeInteger(data.bird?.xp) || !Number.isSafeInteger(data.bird?.questsCompleted)))
    || (data.activeRunId !== null && typeof data.activeRunId !== "string")) {
    throw new HttpsError("failed-precondition", "Your test dove needs support. Other gameplay is unaffected.");
  }
  return data as PilotState;
}
function requireLocation(payload: Record<string, unknown>): Location {
  return {
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    accuracyMetres: requireFiniteNumber(payload.accuracyMetres, "accuracyMetres", 0, 100)
  };
}
function readCandidates(value: unknown): Candidate[] {
  if (!Array.isArray(value) || value.length > 48) throw new HttpsError("invalid-argument", "Choose at most 48 nearby pins.");
  const seen = new Set<string>();
  return value.map(raw => {
    const item = asObject(raw, "pin"); assertAllowedKeys(item, ["id", "lat", "lng"], "pin");
    const id = requireString(item.id, "pin id", 1, 160);
    if (seen.has(id)) throw new HttpsError("invalid-argument", "Duplicate pin in offer request.");
    seen.add(id);
    return { id, lat: requireFiniteNumber(item.lat, "lat", -90, 90), lng: requireFiniteNumber(item.lng, "lng", -180, 180) };
  });
}
function distance(origin: Location, pin: Candidate) {
  return calculateHaversineDistanceMetres(origin, { latitude: pin.lat, longitude: pin.lng });
}

/** Cached, canonical evidence only. Never starts map generation or contacts OSM. */
async function verifyOfferTargets(uid: string, location: Location, candidates: Candidate[], tx?: Transaction, sharedOwnerUid?: string) {
  const db = getAdminFirestore();
  const now = new Date(); const day = getGrowGoUtcDayKey(now);
  const read = (ref: FirebaseFirestore.DocumentReference) => tx ? tx.get(ref) : ref.get();
  const cache = createFirestoreAuthoritativeSourceCache({ firestore: db, collectionName: AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME, readsEnabled: true, writesEnabled: false });
  const sourcePromises = new Map<string, ReturnType<AuthoritativePinSourceProvider["getSourceGeometry"]>>();
  const provider: AuthoritativePinSourceProvider = { getSourceGeometry(reference) {
    const key = JSON.stringify(reference);
    if (!sourcePromises.has(key)) sourcePromises.set(key, cache.read(reference).then(record => record?.kind === "positive" ? record.source : null));
    return sourcePromises.get(key)!;
  } };
  const available: Record<string, string[]> = { base: [], harvest: [], park: [], church: [], water: [] };
  const landings: Candidate[] = [];
  await Promise.all(candidates.filter(pin => distance(location, pin) <= 1000).map(async pin => {
    const poiSnap = await read(db.collection(SHARED_POI_PINS_COLLECTION).doc(sharedWorldDocumentId(pin.id)));
    const poi = poiSnap.data();
    if (isDailyGreenPoi(poi, pin.id)) {
      if (calculateHaversineDistanceMetres({ latitude: pin.lat, longitude: pin.lng }, { latitude: Number(poi.lat), longitude: Number(poi.lng) }) > 1) return;
      const capture = await read(db.collection("playerDailyPoiCaptures").doc(uid).collection("pins").doc(hash(pin.id)));
      const icon = String(poiSnap.data()?.icon);
      if (capture.data()?.captureDay !== day && ["park", "church"].includes(icon)) available[icon].push(pin.id);
      return;
    }
    const canonical = await verifyAuthoritativeCanonicalPin({ input: { pinId: pin.id, submittedLatitude: pin.lat, submittedLongitude: pin.lng }, provider });
    if (!canonical.ok) return;
    const [shared, captured, water, harvested] = await Promise.all([
      read(db.collection(SHARED_BASE_PIN_STATES_COLLECTION).doc(sharedWorldDocumentId(pin.id))),
      read(db.collection("playerCaptureStates").doc(uid).collection("pins").doc(hash(pin.id))),
      read(db.collection("authoritativeWaterPinStates").doc(pin.id)),
      read(db.collection("sharedBasePinHarvests").doc(sharedWorldDocumentId(pin.id)).collection("players").doc(uid))
    ]);
    const plot = readSharedBasePinState(shared.data());
    const isWater = water.data()?.pinId === pin.id && water.data()?.type === "water";
    if (captured.data()?.captureDay !== day && !isRoute(pin.id)) available[isWater ? "water" : "base"].push(pin.id);
    if (!isWater && plot?.plant && !hasCropHarvestWindowEnded(plot.plant, now)) {
      // Shared visits allow the bird owner's plot too. The original private
      // pilot's fallback landing remains scoped to the requesting player's plots.
      if (sharedOwnerUid ? eligibleBirdPlot(plot, sharedOwnerUid, now) : plot.ownerUid === uid) landings.push(pin);
      if (isCropHarvestActive(plot.plant, now) && harvested.data()?.harvestDay !== day) available.harvest.push(pin.id);
    }
  }));
  return { available, landings: landings.sort((a, b) => distance(location, a) - distance(location, b)) };
}

async function readDeploymentAvailability(tx?: Transaction, visitRef = deploymentRef()): Promise<{ active: SharedDoveDeployment | null; waiting: SharedDoveDeployment | null }> {
  const read = (ref: FirebaseFirestore.DocumentReference) => tx ? tx.get(ref) : ref.get();
  let deployment = (await read(visitRef)).data() as SharedDoveDeployment | undefined | null;
  // Do not write inside an offer/acceptance transaction: those must finish their
  // own reads first and reject expired offers. Map/snapshot reads advance travel.
  if (!tx && shouldMoveExpiredBird(deployment)) deployment = visitRef.id === SHARED_DOVE_DOCUMENT
    ? await moveExpiredBirdVisit(getAdminFirestore(), deployment!.id)
    : await changeOwnedBirdDeployment(getAdminFirestore(), { uid: deployment!.ownerUid, birdId: deployment!.birdId, action: 'relocate', expectedVisitId: deployment!.id });
  const waiting = isExpiredBirdDeployment(deployment) ? deployment : null;
  if (!isActiveBirdDeployment(deployment)) return { active: null, waiting };
  const plot = readSharedBasePinState((await read(getAdminFirestore().collection(SHARED_BASE_PIN_STATES_COLLECTION)
    .doc(sharedWorldDocumentId(deployment.landing.id)))).data());
  return { active: eligibleDeployedBirdPlot(plot, deployment, new Date()) ? deployment : null, waiting: null };
}

async function readActiveDeployment(tx?: Transaction) {
  return (await readDeploymentAvailability(tx)).active;
}

async function snapshot(uid: string, canDeploy = false) {
  const db = getAdminFirestore(); const state = readPilot((await stateRef(uid).get()).data(), uid);
  const earned = leonardPlayerEnabled(uid)
    ? readLeonardBirdhouseEntry((await db.collection('playerBirdhouses').doc(uid).collection('birds').doc('leonard-introduction-dove').get()).data(), uid) : null;
  const earnedVisit = earned ? await readDeploymentAvailability(undefined, earnedDeploymentRef(uid)) : null;
  const earnedBirds = earned ? [{ ...earned, canDeploy: leonardPlayerEnabled(uid),
    deployment: earnedVisit?.active ? publicBirdDeployment(earnedVisit.active) : null,
    waitingDeployment: earnedVisit?.waiting ? { id: earnedVisit.waiting.id } : null,
    status: earnedVisit?.active ? 'Deployed' : earnedVisit?.waiting ? 'Finding a planted plot' : 'Not deployed' }] : [];
  if (!state) return { ok: true, leonardAvailable:leonardPlayerEnabled(uid), eligible: true, canDeploy, earnedBirds, bird: null, run: null, offer: null, cardCounts: {} };
  const run = state.activeRunId ? (await stateRef(uid).collection("runs").doc(state.activeRunId).get()).data() as BirdRun : null;
  const availability = state.bird ? await readDeploymentAvailability() : null;
  const deployment = availability?.active;
  return { ok: true, leonardAvailable:leonardPlayerEnabled(uid), eligible: true, canDeploy, earnedBirds, bird: state.bird, cardCounts: state.cardCounts,
    deployment: deployment?.ownerUid === uid ? publicBirdDeployment(deployment) : null,
    waitingDeployment: availability?.waiting?.ownerUid === uid ? { id: availability.waiting.id } : null,
    pendingMailCount: state.pendingMailCount || 0,
    offer: state.offer && state.offer.expiresAt > Date.now() ? { id: state.offer.id, deploymentId: state.offer.deploymentId || null, landing: state.offer.landing, expiresAt: state.offer.expiresAt, quests: state.offer.questIds.map(getT1Quest) } : null,
    run: run ? { ...run, definition: getT1Quest(run.questId) } : null };
}

/** Read only successful, user-scoped server receipts. Client quantities/rewards ignored. */
async function verifiedActions(uid: string, raw: unknown): Promise<{ actions: VerifiedBirdAction[]; resolved: string[] }> {
  if (!Array.isArray(raw) || raw.length > 30) throw new HttpsError("invalid-argument", "Send at most 30 action receipts.");
  const db = getAdminFirestore(); const output: VerifiedBirdAction[] = []; const resolved: string[] = [];
  await Promise.all(raw.map(async value => {
    const proof = asObject(value, "receipt"); assertAllowedKeys(proof, ["kind", "id"], "receipt");
    const kind = requireString(proof.kind, "receipt kind", 1, 12);
    const id = requireString(proof.id, "receipt id", 1, 160);
    const add = (type: VerifiedBirdAction["kind"], pinId: string, at: number, recipeId?: string) => output.push({ uid, id: pinId, at, kind: type, ...(recipeId ? { recipeId } : {}) });
    if (kind === "poi") {
      const [capture, poi] = await Promise.all([
        db.collection("playerDailyPoiCaptures").doc(uid).collection("pins").doc(hash(id)).get(),
        db.collection(SHARED_POI_PINS_COLLECTION).doc(sharedWorldDocumentId(id)).get()
      ]);
      if (capture.exists) resolved.push(`${kind}:${id}`);
      if (capture.data()?.pinId === id && isDailyGreenPoi(poi.data(), id)) add(poi.data()?.icon, id, millis(capture.data()?.capturedAt));
    } else if (["capture", "craft", "beam"].includes(kind)) {
      const collection = { capture: "privateAlphaCaptureRequests", craft: "marketplaceRequests", beam: "privateAlphaPewPewShots" }[kind]!;
      const stored = (await db.collection(collection).doc(hash(`${uid}|${id}`)).get()).data();
      if (stored) resolved.push(`${kind}:${id}`);
      if (!stored || stored.response?.ok !== true) return;
      const at = millis(stored.createdAt), result = stored.response;
      if (kind === "capture" && result.accepted === true && result.rewardGranted === true && result.status === "captured") {
        if (!isRoute(result.pinId)) add(result.waterRewards ? "water" : "base", result.pinId, at);
        if (result.harvest?.itemId) add("harvest", result.pinId, at);
      }
      if (kind === "craft" && stored.fingerprint === JSON.stringify({ action: "craft", recipeId: "flour" }) && result.craftedItemId === "flour") add("craft", id, at, "flour");
      if (kind === "beam" && Array.isArray(result.hits)) for (const hit of result.hits) {
        if (hit.points > 0 && ["base", "water"].includes(hit.type)) {
          if (!isRoute(hit.pinId)) add(hit.type, hit.pinId, at); if (hit.harvestResource) add("harvest", hit.pinId, at);
        }
      }
    } else throw new HttpsError("invalid-argument", "Unknown action receipt.");
  }));
  return { actions: output, resolved };
}

export async function birdQuestsHandler(request: CallableRequest<unknown>) {
  const { uid } = requireAuthenticated(request); requireAppCheckIfEnabled(request); requireInvitedUserAccess(request);
  const p = asObject(request.data, "birdQuests");
  assertAllowedKeys(p, ["action", "deviceId", "latitude", "longitude", "accuracyMetres", "candidates", "offerId", "questId", "runId", "receipts", "deploymentId", "birdId"], "birdQuests");
  const action = requireString(p.action, "action", 1, 24);
  if (request.auth?.token.email_verified !== true) throw new HttpsError("permission-denied", "Verify your account before using bird quests.");
  const canDeploy = String(request.auth?.token.email || "").toLowerCase() === DOVE_PILOT_EMAIL;
  const earnedAction = automaticLeonardEnabled(uid) && p.birdId === leonardBird && ['deploy','recall'].includes(action);
  if (!earnedAction && (["claim-test-dove", "deploy", "recall"].includes(action) || (action === "offer" && !p.deploymentId)) && !canDeploy)
    throw new HttpsError("permission-denied", "Only Rubberlips owns the test dove. You can talk to it when it visits a planted plot.");
  if (process.env.GROWGO_BIRD_QUESTS_PAUSED === "true") throw new HttpsError("unavailable", "Bird quests are temporarily paused. Your progress is safe.");
  await requireActiveDeviceSessionIfEnabled({ uid, deviceId: typeof p.deviceId === "string" ? p.deviceId : undefined });
  const db = getAdminFirestore(), ref = stateRef(uid), playerRef = getPlayerDocumentRef(uid);
  const currentSnapshot = () => snapshot(uid, canDeploy);
  if (action === "snapshot") return currentSnapshot();
  if (action === "nearby") {
    if(allLeonardEnabled()){
      const location=requireLocation(p);
      const docs=await db.collection(SHARED_DOVE_COLLECTION).where('landing.lat','>=',Math.max(-90,location.latitude-0.01)).where('landing.lat','<=',Math.min(90,location.latitude+0.01)).limit(129).get();
      if(docs.size>128)throw new HttpsError('resource-exhausted','Bird area is busy. Please try again later.');
      const active:SharedDoveDeployment[]=[];
      for(const doc of docs.docs){
        const d=doc.data() as SharedDoveDeployment;
        if(!isActiveBirdDeployment(d)&&!isExpiredBirdDeployment(d))continue;
        if(!d.ownerUid||!d.birdId||doc.id!==birdDeploymentDocument(d.ownerUid,d.birdId)||distance(location,d.landing)>1000)continue;
        const visit=(await readDeploymentAvailability(undefined,doc.ref)).active;
        if(visit&&distance(location,visit.landing)<=1000)active.push(visit);
      }
      return {ok:true,birds:active.map(publicBirdDeployment),ownDeployments:active.filter(d=>d.ownerUid===uid).map(publicBirdDeployment)};
    }
    const location = requireLocation(p), availability = await readDeploymentAvailability(), deployment = availability.active;
    const extras=await Promise.all(visibleDeploymentRefs().slice(1).map(ref=>readDeploymentAvailability(undefined,ref)));
    const active = [deployment, ...extras.map(v=>v.active)].filter((d): d is SharedDoveDeployment => Boolean(d));
    return { ok: true, birds: active.filter(d => distance(location, d.landing) <= 1000).map(publicBirdDeployment),
      ownDeployments: active.filter(d => d.ownerUid === uid).map(publicBirdDeployment),
      ...(canDeploy ? { ownDeployment: deployment?.ownerUid === uid ? publicBirdDeployment(deployment) : null,
        ownWaitingDeployment: availability.waiting?.ownerUid === uid ? { id: availability.waiting.id } : null } : {}) };
  }
  if ((action === 'deploy' || action === 'recall') && p.birdId) {
    const birdId = requireString(p.birdId, 'birdId', 1, 160);
    if (!leonardPlayerEnabled(uid) || birdId !== leonardBird)
      throw new HttpsError('permission-denied', 'This companion deployment is not enabled.');
    const profile = readStoredPlayerDocument((await playerRef.get()).data());
    if (!profile.profileComplete) throw new HttpsError('failed-precondition', 'Finish your profile first.');
    await changeOwnedBirdDeployment(db, { uid, birdId, action,
      ...(action === 'recall' ? { expectedVisitId: requireString(p.deploymentId, 'deploymentId', 1, 80) } : {}) });
    return currentSnapshot();
  }
  if (action === "claim-test-dove") {
    await db.runTransaction(async tx => {
      const [existing, profile] = await Promise.all([tx.get(ref), tx.get(playerRef)]);
      const player = readStoredPlayerDocument(profile.data());
      if (!player.profileComplete || player.displayName?.trim().toLowerCase() !== "rubberlips") throw new HttpsError("permission-denied", "This test dove is reserved for Rubberlips.");
      if (existing.exists) { if (!readPilot(existing.data(), uid)?.bird) throw new HttpsError("failed-precondition", "Your dove grant needs support."); return; }
      tx.create(ref, { schemaVersion: 1, uid, bird: { id: `alpha-dove-${uid}`, name: "Test Dove", level: 1, xp: 0, questsCompleted: 0 }, activeRunId: null, offer: null, cardCounts: {}, updatedAt: Timestamp.now() });
    });
    return currentSnapshot();
  }
  if (action === "deploy") {
    // Deployment is worldwide and server-selected. Older clients may still send
    // nearby candidates/GPS, but neither can influence the landing destination.
    const id = randomUUID();
    await db.runTransaction(async tx => {
      const [stored, profile] = await Promise.all([tx.get(ref), tx.get(playerRef)]);
      const state = readPilot(stored.data(), uid), player = readStoredPlayerDocument(profile.data());
      if (!state?.bird) throw new HttpsError("failed-precondition", "Claim your test dove first.");
      if (await readActiveDeployment(tx)) return;
      const previous = (await tx.get(deploymentRef())).data() as SharedDoveDeployment | undefined;
      const landing = await chooseGlobalBirdLanding({ db, tx, ownerUid: uid, now: new Date(),
        ...(isExpiredBirdDeployment(previous) ? { excludePinId: previous.landing.id } : {}) });
      if (!landing) throw new HttpsError("failed-precondition", "No suitable planted plot was found this time. Your dove is safe in the Birdhouse; try deploying again.");
      const now = Date.now();
      tx.set(deploymentRef(), { schemaVersion: 1, id, birdId: state.bird.id, ownerUid: uid, ownerName: player.displayName || "Dove owner",
        landing, createdAt: now, expiresAt: now + DOVE_ENCOUNTER_MS, status: "deployed" } satisfies SharedDoveDeployment);
    });
    return currentSnapshot();
  }
  if (action === "recall") {
    const deploymentId = requireString(p.deploymentId, "deploymentId", 1, 80);
    await db.runTransaction(async tx => {
      const deployment = (await tx.get(deploymentRef())).data() as SharedDoveDeployment | undefined;
      if (!deployment || deployment.ownerUid !== uid) throw new HttpsError("permission-denied", "This is not your dove.");
      if (deployment.id !== deploymentId) throw new HttpsError("failed-precondition", "The dove has moved. Refresh before recalling it.");
      if (deployment.status === "deployed") tx.update(deploymentRef(), { status: "recalled" });
    });
    return currentSnapshot();
  }
  if (action === "offer") {
    const location = requireLocation(p); const candidates = readCandidates(p.candidates);
    const deploymentId = p.deploymentId ? requireString(p.deploymentId, "deploymentId", 1, 80) : null;
    const id = randomUUID();
    await db.runTransaction(async tx => {
      const [stored, profile] = await Promise.all([tx.get(ref), tx.get(playerRef)]);
      const state = readPilot(stored.data(), uid) || { schemaVersion: 1 as const, uid, bird: null, activeRunId: null, offer: null, cardCounts: {}, updatedAt: Timestamp.now() };
      if (!deploymentId && !state.bird) throw new HttpsError("failed-precondition", "Claim your test dove first.");
      if (state.activeRunId) throw new HttpsError("failed-precondition", "Finish the current test quest first.");
      const player = readStoredPlayerDocument(profile.data());
      if (!player.profileComplete) throw new HttpsError("failed-precondition", "Finish creating your player profile first.");
      const deployment = deploymentId ? await selectedDeployment(tx, deploymentId) : null;
      if (deploymentId && (!deployment || deployment.id !== deploymentId)) throw new HttpsError("failed-precondition", "This dove has flown away. Refresh the nearby birds.");
      if (deployment && distance(location, deployment.landing) > 100 * getActivePlayerCaptureRadiusMultiplier(player, new Date()))
        throw new HttpsError("failed-precondition", "Move within capture range of the dove first.");
      if (state.offer && state.offer.expiresAt > Date.now() && (state.offer.deploymentId || null) === deploymentId) return;
      const targets = await verifyOfferTargets(uid, location, candidates, tx);
      const landing = deployment?.landing || targets.landings[0];
      if (!landing) throw new HttpsError("failed-precondition", "Load a nearby owned plot with a growing or harvest-ready crop, then try again. Empty plots cannot host the dove.");
      const quests = chooseT1Offers(targets.available, player.craftingLevel >= 1);
      if (!quests.length) throw new HttpsError("unavailable", "No suitable quests could be verified yet. Let the nearby pins load and try again.");
      tx.set(ref, { ...state, offer: { id, origin: location, landing, expiresAt: deployment?.expiresAt || Date.now() + DOVE_ENCOUNTER_MS, questIds: quests.map(q => q.id), candidates,
        ...(deployment ? { deploymentId: deployment.id, birdId: deployment.birdId, birdOwnerUid: deployment.ownerUid } : {}) }, updatedAt: Timestamp.now() });
    });
    return currentSnapshot();
  }
  if (action === "accept" || action === "reject") {
    const offerId = requireString(p.offerId, "offerId", 1, 80); const location = requireLocation(p);
    const quest = action === "accept" ? getT1Quest(p.questId) : null;
    await db.runTransaction(async tx => {
      const [stored, profile] = await Promise.all([tx.get(ref), tx.get(playerRef)]);
      const state = readPilot(stored.data(), uid); if (!state) throw new HttpsError("not-found", "Test dove not found.");
      // Stable run ID makes an acceptance retry safe even after the bird leaves.
      const runRef = ref.collection("runs").doc(offerId);
      const existingRun = await tx.get(runRef);
      if (existingRun.exists) {
        if (quest && existingRun.data()?.questId === quest.id) return;
        throw new HttpsError("already-exists", "That bird already gave you a different quest.");
      }
      const offer = state.offer;
      if (!offer || offer.id !== offerId || offer.expiresAt <= Date.now()) throw new HttpsError("failed-precondition", "That bird offer has ended. Reopen the dove.");
      const player = readStoredPlayerDocument(profile.data());
      if (distance(location, offer.landing) > 100 * getActivePlayerCaptureRadiusMultiplier(player, new Date())) throw new HttpsError("failed-precondition", "Move within capture range of the dove first.");
      if (quest) {
        if (state.activeRunId || !offer.questIds.includes(quest.id)) throw new HttpsError("failed-precondition", "Choose one of this dove's available quests.");
        const deployment = offer.deploymentId ? await selectedDeployment(tx, offer.deploymentId) : null;
        if (offer.deploymentId && (!deployment || deployment.id !== offer.deploymentId || deployment.ownerUid !== offer.birdOwnerUid
          || deployment.birdId !== offer.birdId)) throw new HttpsError("failed-precondition", "Another player accepted this visit, or the dove has moved. Refresh nearby birds.");
        const targets = await verifyOfferTargets(uid, location, offer.candidates, tx);
        const stillEligible = quest.kind === "craft" ? player.craftingLevel >= 1 : new Set(targets.available[quest.kind]).size >= quest.target;
        if ((!deployment && !targets.landings.some(pin => pin.id === offer.landing.id)) || !stillEligible) throw new HttpsError("failed-precondition", "Nearby availability changed. Reject this offer and try again after the nearby pins load.");
        const birdId = deployment?.birdId || state.bird?.id;
        if (!birdId) throw new HttpsError("failed-precondition", "This bird offer needs support.");
        const run: BirdRun = { schemaVersion: 1, id: offerId, questId: quest.id, uid, birdId,
          ...(deployment ? { birdOwnerUid: deployment.ownerUid, deploymentId: deployment.id } : {}),
          acceptedAt: Date.now(), status: "active", seen: [], completedAt: null, reward: null };
        tx.create(runRef, run); tx.update(ref, { offer: null, activeRunId: offerId, updatedAt: Timestamp.now() });
        if (deployment) tx.update(db.collection(SHARED_DOVE_COLLECTION).doc(birdDeploymentDocument(deployment.ownerUid, deployment.birdId)), { status: "departed" });
      } else tx.update(ref, { offer: null, updatedAt: Timestamp.now() });
    });
    return currentSnapshot();
  }
  if (action === "sync") {
    const runId = requireString(p.runId, "runId", 1, 80);
    const verified = await verifiedActions(uid, p.receipts);
    await db.runTransaction(async tx => {
      const runRef = ref.collection("runs").doc(runId); const stored = await tx.get(runRef);
      if (!stored.exists || stored.data()?.uid !== uid) throw new HttpsError("not-found", "Bird quest not found.");
      const run = stored.data() as BirdRun, next = advanceBirdRun(run, verified.actions, Date.now());
      if (next.status === "reward-pending" && !next.reward) next.reward = rollT1Reward();
      if (JSON.stringify(next) !== JSON.stringify(run)) tx.set(runRef, next);
    });
    return { ...(await currentSnapshot()), resolvedReceipts: verified.resolved };
  }
  if (action === "claim") {
    const runId = requireString(p.runId, "runId", 1, 80);
    const result = await db.runTransaction(async tx => {
      const runRef = ref.collection("runs").doc(runId), inventoryRef = db.collection("playerMarketInventories").doc(uid), scoreRef = db.collection("playerLeaderboardScores").doc(uid);
      const [stateDoc, runDoc, profile, bag, scoreDoc] = await Promise.all([tx.get(ref), tx.get(runRef), tx.get(playerRef), tx.get(inventoryRef), tx.get(scoreRef)]);
      const state = readPilot(stateDoc.data(), uid), run = runDoc.data() as BirdRun;
      if (!state || !run || run.uid !== uid) throw new HttpsError("not-found", "Bird quest not found.");
      const player = readStoredPlayerDocument(profile.data()), items = readMarketInventory(bag.data());
      if (run.status === "completed") return { claimedNow: false, reward: run.reward, player: serializePlayerSnapshot(player), inventory: { items } };
      if (state.activeRunId !== run.id || run.status !== "reward-pending" || new Set(run.seen).size < getT1Quest(run.questId).target) throw new HttpsError("failed-precondition", "Complete the quest requirements first.");
      // Roll saved with completion, before any inventory-capacity error. A retry
      // or full inventory cannot reroll the card or the resource mix.
      const reward = run.reward;
      if (!reward) throw new HttpsError("failed-precondition", "This quest reward needs support. It has not been discarded.");
      const ownerUid = run.birdOwnerUid || uid, ownerRef = stateRef(ownerUid);
      const owner = ownerUid === uid ? state : readPilot((await tx.get(ownerRef)).data(), ownerUid);
      if (!/^[A-Za-z0-9_-]{1,160}$/.test(run.birdId)) throw new HttpsError("failed-precondition", "Invalid saved bird identity. Your quest reward is saved.");
      const earnedRef = db.collection('playerBirdhouses').doc(ownerUid).collection('birds').doc(run.birdId);
      const earned = owner?.bird?.id === run.birdId ? undefined : (await tx.get(earnedRef)).data();
      let birdReward;
      try { birdReward = planBirdRewardTarget(ownerUid, run.birdId, owner, earned, reward.xp); }
      catch { throw new HttpsError("failed-precondition", "The dove's reward delivery needs support. Your quest reward is saved."); }
      for (const [item, quantity] of Object.entries(reward.items)) {
        if (Number(items[item] || 0) + quantity > MARKET_MAX_ITEM_QUANTITY) throw new HttpsError("failed-precondition", "Make space in your inventory, then claim this quest reward.");
        items[item] = Number(items[item] || 0) + quantity;
      }
      const now = new Date(), at = Timestamp.fromDate(now), day = getGrowGoUtcDayKey(now), season = getGrowGoSeasonAt(now).key;
      const scores = readLeaderboardScoreDocument(scoreDoc.data());
      const xp = player.xp + reward.xp, nextPlayer = { ...player, xp, level: getPlayerLevelAfterXpGain({ currentLevel: player.level, totalXp: xp }), updatedAt: now };
      const cardCounts = { ...state.cardCounts };
      if (reward.card) { const key = `${reward.card.cardId}:${reward.card.rarity}`; cardCounts[key] = Number(cardCounts[key] || 0) + 1; }
      tx.update(playerRef, { xp, level: nextPlayer.level, updatedAt: at });
      tx.set(inventoryRef, { schemaVersion: 1, items, updatedAt: at }, { merge: true });
      tx.set(scoreRef, buildLeaderboardScoreDocument({ daily: { key: day, points: (scores.daily.key === day ? scores.daily.points : 0) + reward.points }, seasonal: { key: season, points: (scores.seasonal.key === season ? scores.seasonal.points : scores.seasonal.key === null ? player.xp : 0) + reward.points }, achievementPoints: scores.achievementPoints, updatedAt: at }));
      tx.update(runRef, { status: "completed", reward, completedAt: now.getTime() });
      const bird = birdReward.bird;
      if (!birdReward.legacy) tx.update(earnedRef, { ...birdReward.stats, updatedAt: at });
      tx.update(ref, { activeRunId: null, cardCounts, ...(ownerUid === uid && birdReward.legacy ? { bird } : {}), updatedAt: at });
      if (ownerUid !== uid) {
        // A single transaction pays the visitor, advances the bird and writes
        // matching non-card owner mail. No direct inventory grant to the owner.
        tx.create(ownerRef.collection("mail").doc(run.id), { schemaVersion: 1, runId: run.id, birdId: run.birdId,
          questId: run.questId, completedBy: uid, status: "unclaimed", createdAt: at,
          reward: { points: reward.points, xp: reward.xp, items: reward.items } });
        tx.update(ownerRef, { ...(birdReward.legacy ? { bird } : {}), pendingMailCount: (owner?.pendingMailCount || 0) + 1, updatedAt: at });
      }
      return { claimedNow: true, reward, player: serializePlayerSnapshot(nextPlayer), inventory: { items } };
    });
    return { ...(await currentSnapshot()), ...result };
  }
  throw new HttpsError("invalid-argument", "Unknown bird quest action.");
}

export const birdQuests = onCall({ region: runtimeConfig.region, maxInstances: 1, minInstances: 0,
  enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable }, birdQuestsHandler);
