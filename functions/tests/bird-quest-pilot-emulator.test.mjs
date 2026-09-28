import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");
test("test-dove end-to-end, local database only", async t => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) { t.skip("Local emulator required; no live account access."); return; }
  Object.assign(process.env, { FIRESTORE_EMULATOR_HOST: host.normalizedHostPort, GCLOUD_PROJECT: "demo-growgo-bird-pilot",
    GROWGO_BACKEND_ENVIRONMENT: "development", GROWGO_BACKEND_PROJECT_ID: "growgo-development", GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
    GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false", GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "false",
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true", GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled" });
  const { initializeApp, deleteApp } = require("firebase-admin/app"), { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-bird-pilot" }, `birds-${process.pid}`), db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const { birdQuestsHandler: handle } = require("../lib/api/birdQuests.js");
  const { captureDailyPoiHandler } = require("../lib/api/captureDailyPoi.js");
  const { craftRecipeHandler } = require("../lib/api/marketplace.js");
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { generateCanonicalPinsForWay } = require("../lib/domain/pins/canonicalPinGenerator.js");
  const { createFirestoreAuthoritativeSourceCache, AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME } = require("../lib/infrastructure/pins/firestoreAuthoritativePinCache.js");
  const { serializeSharedBasePinStateForStorage, sharedWorldDocumentId: hashPin } = require("../lib/domain/world/sharedWorld.js");
  const hash = x => createHash("sha256").update(x).digest("hex");
  const uid = `bird-test-${process.pid}`, other = `bird-other-${process.pid}`, now = new Date();
  const profile = { ...buildDefaultPlayerDocument(Timestamp.now()), profileComplete: true, displayName: "Rubberlips", gender: "male", country: "Australia", region: "oceania", state: "Victoria", coins: 123, xp: 50 };
  for (const id of [uid, other]) await db.collection("players").doc(id).set(profile);
  const ref = db.collection("birdQuestPlayers").doc(uid), bag = db.collection("playerMarketInventories").doc(uid);
  await bag.set({ schemaVersion: 1, items: { wheat: 6, corn: 9 } });
  const auth = { uid, token: { email: "godspeed1074@gmail.com", email_verified: true } };
  const request = data => ({ auth, data });
  const call = data => handle(request(data));
  const location = { latitude: -38.45, longitude: 145.24, accuracyMetres: 5 };
  const source = { generatorVersion: 1, sourceType: "osm-way", sourceId: "98989999", spacingMetres: 50,
    orderedCoordinates: [{ latitude: location.latitude, longitude: location.longitude }, { latitude: -38.442, longitude: 145.24 }], fetchedAt: now.toISOString() };
  const pins = generateCanonicalPinsForWay(source);
  const cache = createFirestoreAuthoritativeSourceCache({ firestore: db, collectionName: AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME, readsEnabled: true, writesEnabled: true });
  await cache.write(source, { kind: "positive", source, cachedAt: now.toISOString(), expiresAt: new Date(+now + 86400000).toISOString() });
  const plantedAt = new Date(+now - 86400000);
  await db.collection("sharedBasePinStates").doc(hashPin(pins[0].pinId)).set(serializeSharedBasePinStateForStorage({
    pinId: pins[0].pinId, latitude: pins[0].latitude, longitude: pins[0].longitude, ownerUid: uid, ownerName: "Rubberlips", ownerAvatarUrl: null,
    ownedAt: plantedAt, level: 1, replantEnabled: false, plant: { seedId: "wheat_seed", plantedAt, miracleGrownAt: null }, updatedAt: now }));
  const parkId = `poi:bird-park-${process.pid}`;
  await db.collection("sharedPoiPins").doc(hashPin(parkId)).set({ id: parkId, type: "poi", name: "Test park", icon: "park", category: "Places", subcategory: "Park", rarity: "normal", lat: location.latitude, lng: location.longitude });
  const candidates = [{ id: pins[0].pinId, lat: pins[0].latitude, lng: pins[0].longitude }, { id: parkId, lat: location.latitude, lng: location.longitude }];
  let offer, runId;
  await t.test("grant exactly one dove; ordinary and unverified accounts denied", async () => {
    const [a, b] = await Promise.all([call({ action: "claim-test-dove" }), call({ action: "claim-test-dove" })]);
    assert.equal(a.bird.id, b.bird.id);
    // Repeated test runs may leave other synthetic accounts in this demo DB.
    assert.equal((await db.collection("birdQuestPlayers").where("uid", "==", uid).get()).size, 1);
    assert.equal((await db.collection("birdQuestPlayers").doc(other).get()).exists, false);
    for (const token of [{ email: "other@example.test", email_verified: true }, { email: "godspeed1074@gmail.com", email_verified: false }]) {
      await assert.rejects(handle({ auth: { uid: other, token }, data: { action: "claim-test-dove" } }), { code: "permission-denied" });
    }
    assert.equal((await db.collection("players").doc(other).get()).data().xp, 50);
  });
  await t.test("offer persists through reopen without acceptance; two eligible choices", async () => {
    offer = (await call({ action: "offer", ...location, candidates })).offer;
    assert.deepEqual(offer.quests.map(q => q.kind), ["park", "craft"]);
    assert.equal((await call({ action: "snapshot" })).offer.id, offer.id);
    assert.equal((await call({ action: "offer", ...location, candidates })).offer.id, offer.id);
    await assert.rejects(call({ action: "accept", ...location, latitude: -38.44, offerId: offer.id, questId: offer.quests[0].id }), { code: "failed-precondition" });
  });
  await t.test("accept one quest once, remove bird, reject old receipts, use real park capture", async () => {
    const payload = { action: "accept", ...location, offerId: offer.id, questId: offer.quests[0].id };
    const a = await call(payload), b = await call(payload); runId = a.run.id;
    assert.equal(a.offer, null); assert.equal(b.run.id, runId);
    await assert.rejects(call({ ...payload, questId: offer.quests[1].id }), { code: "already-exists" });
    assert.equal((await call({ action: "sync", runId, receipts: [{ kind: "capture", id: "invented" }] })).run.seen.length, 0);
    const capture = await captureDailyPoiHandler(request({ ...location, pinId: parkId }));
    assert.equal(capture.accepted, true);
    const result = await call({ action: "sync", runId, receipts: [{ kind: "poi", id: parkId }] });
    assert.equal(result.run.status, "reward-pending"); assert.ok(result.run.reward);
    assert.equal((await call({ action: "snapshot" })).run.status, "reward-pending");
  });
  await t.test("full inventory holds fixed reward; retry and concurrent claims pay only once", async () => {
    const before = await call({ action: "snapshot" }), reward = before.run.reward;
    const fullItem = Object.keys(reward.items)[0], original = (await bag.get()).data().items;
    await bag.set({ items: { ...original, [fullItem]: 10000 } });
    await assert.rejects(call({ action: "claim", runId }), { code: "failed-precondition" });
    assert.deepEqual((await call({ action: "snapshot" })).run.reward, reward);
    await bag.set({ items: original });
    const xpBefore = (await db.collection("players").doc(uid).get()).data().xp;
    const claims = await Promise.all([call({ action: "claim", runId }), call({ action: "claim", runId })]);
    assert.equal(claims.filter(x => x.claimedNow).length, 1);
    assert.equal((await db.collection("players").doc(uid).get()).data().xp, xpBefore + 100);
    assert.equal((await db.collection("players").doc(uid).get()).data().coins, 133);
    assert.equal((await call({ action: "snapshot" })).bird.questsCompleted, 1);
    assert.equal((await call({ action: "snapshot" })).run, null);
    const items = (await bag.get()).data().items;
    for (const [id, amount] of Object.entries(reward.items)) assert.equal(items[id], (original[id] || 0) + amount);
    assert.equal((await db.collection("playerLeaderboardScores").doc(uid).get()).data().daily.points, 120);
  });
  await t.test("next quest: normal crafting consumes wheat, keeps flour, recovers queued proof after reconnect", async () => {
    offer = (await call({ action: "offer", ...location, candidates })).offer;
    assert.deepEqual(offer.quests.map(q => q.kind), ["craft"]);
    const accepted = await call({ action: "accept", ...location, offerId: offer.id, questId: offer.quests[0].id });
    runId = accepted.run.id;
    const id = `bird-flour-${process.pid}`;
    const unresolved = await call({ action: "sync", runId, receipts: [{ kind: "craft", id }] });
    assert.deepEqual(unresolved.resolvedReceipts, []);
    const wheatBefore = (await bag.get()).data().items.wheat;
    const crafted = await craftRecipeHandler(request({ requestId: id, recipeId: "flour" }));
    assert.equal(crafted.craftedItemId, "flour");
    assert.equal((await bag.get()).data().items.wheat, wheatBefore - 2);
    const synced = await call({ action: "sync", runId, receipts: [{ kind: "craft", id }, { kind: "craft", id }] });
    assert.equal(synced.run.seen.length, 1); assert.equal(synced.run.status, "reward-pending");
    await call({ action: "claim", runId });
    assert.equal((await bag.get()).data().items.flour, 1);
    assert.equal((await call({ action: "snapshot" })).bird.questsCompleted, 2);
    assert.equal((await db.collection("marketplaceRequests").doc(hash(`${uid}|${id}`)).get()).exists, true);
  });
});
