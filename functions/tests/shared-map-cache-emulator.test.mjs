import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { gunzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("local Firebase: cached geometry preserves per-player captures, crop harvests, weekly values and fish resets", async (t) => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) {
    t.skip("Requires a localhost Firestore emulator; never connects to a cloud project.");
    return;
  }
  process.env.FIRESTORE_EMULATOR_HOST = host.normalizedHostPort;
  process.env.GROWGO_BACKEND_ENVIRONMENT = "development";
  process.env.GROWGO_BACKEND_PROJECT_ID = "growgo-development";
  process.env.GROWGO_DEVELOPMENT_BACKEND_ENABLED = "true";
  process.env.GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED = "true";
  process.env.GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED = "false";
  process.env.GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED = "false";
  process.env.GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED = "true";
  process.env.GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE = "development_enabled";
  process.env.GCLOUD_PROJECT = "demo-growgo-map-cache";
  process.env.GROWGO_SHARED_MAP_CACHE_ENABLED = "true";
  const deliveryPreview = process.env.GROWGO_TEST_MAP_DELIVERY === "true";
  if (deliveryPreview) process.env.GROWGO_MAP_DELIVERY_PREVIEW_ENABLED = "true";
  process.env.GROWGO_PRIVATE_ALPHA_OVERPASS_ENDPOINT = "https://primary.overpass.test/api/interpreter";
  process.env.GROWGO_PRIVATE_ALPHA_OVERPASS_FALLBACK_ENDPOINT = "https://secondary.overpass.test/api/interpreter";
  const { initializeApp, deleteApp } = require("firebase-admin/app");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-map-cache" }, `map-cache-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });

  // Set the clock before importing the module-level cache; it captures Date.now.
  // Otherwise the second-instance check sees a future-dated record from the
  // real clock, rather than testing a valid shared cache hit.
  const firstTime = Date.parse("2026-09-07T23:59:40Z");
  t.mock.timers.enable({ apis: ["Date"], now: firstTime });
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const { getNearbyBasePinsHandler, extractCanonicalPins, createBounds } = require("../lib/api/getNearbyBasePins.js");
  const { getMapGeometryCell, createSharedMapGeometryCache, SHARED_MAP_GEOMETRY_COLLECTION } = require("../lib/infrastructure/pins/sharedMapGeometryCache.js");
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { buildBasePinCaptureValueState, SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION } = require("../lib/domain/pins/basePinValue.js");
  const { sharedWorldDocumentId, serializeSharedBasePinStateForStorage } = require("../lib/domain/world/sharedWorld.js");
  const { getWaterFishCycle, getWaterFishStateRef, buildReplacementWaterFishState, buildCapturedWaterFishState } = require("../lib/domain/pins/waterFishSpawns.js");
  const center = { latitude: -38.4537, longitude: 145.2381 };
  const bounds = createBounds(center);
  await db.collection(SHARED_MAP_GEOMETRY_COLLECTION).doc(getMapGeometryCell(center).key).delete();
  const payload = { elements: [
    { type: "way", id: 123456789, tags: { highway: "residential" }, geometry: [{ lat: -38.465, lon: 145.2381 }, { lat: -38.435, lon: 145.2381 }] },
    { type: "way", id: 123456790, tags: { highway: "motorway" }, geometry: [{ lat: -38.465, lon: 145.24 }, { lat: -38.435, lon: 145.24 }] },
    { type: "way", id: 123456791, tags: { waterway: "stream" }, geometry: [{ lat: -38.465, lon: 145.2382 }, { lat: -38.435, lon: 145.2382 }] }
  ] };
  let fetches = 0;
  let attempts = 0;
  let firstAttemptSignal;
  let providerOffline = false;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.match(String(url), /overpass/);
    attempts++;
    if (providerOffline) throw new Error("Synthetic provider outage");
    // Exercise the real API wiring and delayed backup. No network
    // traffic leaves this fixture, even when the transport ignores cancellation.
    if (attempts === 1) {
      firstAttemptSignal = options.signal;
      return new Promise(() => {});
    }
    fetches++;
    return { ok: true, json: async () => payload };
  });
  const uidA = `map-cache-a-${process.pid}`;
  const uidB = `map-cache-b-${process.pid}`;
  const pins = extractCanonicalPins(payload, center, bounds).pins;
  const base = pins.find((pin) => pin.type === "base");
  const water = pins.find((pin) => pin.type === "water");
  assert.ok(base && water);
  const baseId = sharedWorldDocumentId(base.pinId);
  const plantedAt = new Date(now.getTime() - 22 * 24 * 60 * 60 * 1_000);
  const sharedState = {
    pinId: base.pinId, latitude: base.latitude, longitude: base.longitude,
    ownerUid: uidB, ownerName: "Old name", ownerAvatarUrl: null,
    ownedAt: plantedAt, level: 1, replantEnabled: true,
    plant: { seedId: "wheat_seed", plantedAt, miracleGrownAt: null }, updatedAt: now
  };
  // More than 500 earlier-sorting captures elsewhere must not hide a nearby
  // church's daily lockout. Use the same hashed document IDs as the writer.
  let churchId;
  for (let i = 0; !churchId; i++) {
    const candidate = `poi:church:map-read-${i}`;
    if (sharedWorldDocumentId(candidate).startsWith("f")) churchId = candidate;
  }
  const parkId = "poi:park:map-read";
  const specialId = "poi:museum:map-read";
  const churchKey = sharedWorldDocumentId(churchId);
  const remoteCaptures = [];
  for (let i = 0; remoteCaptures.length < 501; i++) {
    const pinId = `poi:remote:map-read-${i}`;
    const id = sharedWorldDocumentId(pinId);
    if (id < churchKey) remoteCaptures.push({ pinId, id });
  }
  for (let offset = 0; offset < remoteCaptures.length; offset += 400) {
    const batch = db.batch();
    remoteCaptures.slice(offset, offset + 400).forEach(({ pinId, id }) =>
      batch.set(db.collection("playerDailyPoiCaptures").doc(uidA).collection("pins").doc(id),
        { pinId, captureDay: day }));
    await batch.commit();
  }
  await Promise.all([
    ...[uidA, uidB].map((uid, index) => db.collection("players").doc(uid).set({
      ...buildDefaultPlayerDocument(Timestamp.fromDate(now)),
      profileComplete: true, displayName: `Test ${index}`, avatarUrl: `https://example.test/${index}.png`,
      region: "oceania", country: "Australia", state: "Victoria", gender: "male"
    })),
    db.collection("sharedBasePinStates").doc(baseId).set(serializeSharedBasePinStateForStorage(sharedState)),
    ...[
      { id: churchId, name: "Test church", category: "Places", subcategory: "Church", icon: "church" },
      { id: parkId, name: "Test park", category: "Places", subcategory: "Park", icon: "park" },
      { id: specialId, name: "Test museum", category: "Special POIs", subcategory: "Major Museum", icon: "museum", isSpecial: true, cardRewardSetId: "dinosaur-discoveries" }
    ].map(poi => db.collection("sharedPoiPins").doc(sharedWorldDocumentId(poi.id)).set({
      ...poi, type: "poi", lat: center.latitude, lng: center.longitude, rarity: poi.isSpecial ? "special" : "normal"
    })),
    db.collection("playerDailyPoiCaptures").doc(uidA).collection("pins").doc(churchKey).set({ pinId: churchId, captureDay: day }),
    db.collection("playerDailyPoiCaptures").doc(uidA).collection("pins").doc(sharedWorldDocumentId(parkId)).set({ pinId: parkId, captureDay: "2026-09-06" }),
    db.collection("playerCaptureStates").doc(uidA).collection("pins").doc(baseId).set({ pinId: base.pinId, captureDay: day }),
    db.collection("sharedBasePinHarvests").doc(baseId).collection("players").doc(uidA).set({ harvestDay: day, cropPlantedAt: Timestamp.fromDate(plantedAt) }),
    db.collection(SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION).doc(baseId).set(buildBasePinCaptureValueState({ pinId: base.pinId, capturedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000) })),
    getWaterFishStateRef(db, getWaterFishCycle(now), water.pinId).set(buildReplacementWaterFishState({ pinId: water.pinId, replacedPinId: "fixture", cycle: getWaterFishCycle(now), now }))
  ]);
  const request = (uid) => ({ auth: { uid, token: {} }, data: { ...center,
    ...(deliveryPreview && process.env.GROWGO_SHARED_MAP_CACHE_ENABLED !== "false" ? { delivery: "interactive" } : {}) } });
  const loadStarted = performance.now();
  const firstA = await getNearbyBasePinsHandler(request(uidA));
  const coldLoadMs = performance.now() - loadStarted;
  t.diagnostic(`Full cold map handler with a stalled primary: ${Math.round(coldLoadMs)}ms (local emulator / synthetic provider).`);
  assert.ok(coldLoadMs < 5_000, "cold fixture should finish without waiting for the eight-second primary timeout");
  assert.equal(firstAttemptSignal.aborted, true);
  assert.equal(attempts, 2, "a stalled mirror falls through to the next one");
  const firstB = await getNearbyBasePinsHandler(request(uidB));
  const find = (response, id = base.pinId) => response.pins.find((pin) => pin.pinId === id);
  const findPoi = (response, id) => response.poiPins.find(poi => poi.id === id);
  assert.equal(findPoi(firstA, churchId).capturedToday, true, "nearby POI capture must not disappear behind the old 500-record cutoff");
  assert.equal(findPoi(firstA, churchId).dailyCaptureDay, day);
  assert.equal(findPoi(firstB, churchId).capturedToday, false);
  assert.equal(findPoi(firstA, parkId).capturedToday, false);
  assert.equal(findPoi(firstA, specialId).capturedToday, undefined);
  assert.equal(find(firstA).capturedToday, true);
  assert.equal(find(firstA).harvestedToday, true);
  assert.equal(find(firstB).capturedToday, false);
  assert.equal(find(firstB).harvestedToday, false);
  assert.equal(find(firstA).replantEnabled, false);
  assert.equal(find(firstB).replantEnabled, true);
  assert.equal(find(firstA).ownerName, "Test 1");
  assert.equal(find(firstA).pointValue, 6);
  assert.ok(find(firstA, water.pinId).fish);
  assert.equal(fetches, 1);

  // A real commit invalidates the player's display immediately, even with
  // identical request coordinates and no elapsed cache time.
  await db.runTransaction(async (tx) => {
    tx.set(db.collection("playerCaptureStates").doc(uidB).collection("pins").doc(baseId),
      { pinId: base.pinId, captureDay: day });
    tx.update(db.collection("players").doc(uidB), { xp: 5 });
  });
  const immediatelyAfterCommit = await getNearbyBasePinsHandler(request(uidB));
  assert.equal(find(immediatelyAfterCommit).capturedToday, true);
  assert.equal(find(immediatelyAfterCommit).harvestedToday, false);
  assert.equal(fetches, 1);

  // A crop collected after today's base capture must invalidate a warm nearby
  // response without awarding capture XP/coins again or touching shared crops.
  const { mutateWorldBasePinHandler } = require("../lib/api/mutateWorldBasePin.js");
  const directHarvestRequest = { auth: { uid: uidB, token: {} }, data: {
    action: "harvest", pinId: base.pinId
  } };
  const playerRef = db.collection("players").doc(uidB);
  const cropRef = db.collection("sharedBasePinStates").doc(baseId);
  const leaderboardRef = db.collection("playerLeaderboardScores").doc(uidB);
  const inventoryRef = db.collection("playerMarketInventories").doc(uidB);
  const beforeDirectHarvest = await playerRef.get();
  const cropBeforeDirectHarvest = (await cropRef.get()).data();
  const leaderboardBeforeDirectHarvest = (await leaderboardRef.get()).data();
  const directHarvest = await mutateWorldBasePinHandler(directHarvestRequest);
  const afterDirectHarvest = await playerRef.get();
  assert.equal(directHarvest.harvest.itemId, "wheat");
  assert.equal(directHarvest.inventory.items.wheat, 1);
  assert.notDeepEqual(afterDirectHarvest.updateTime, beforeDirectHarvest.updateTime);
  assert.ok(afterDirectHarvest.data().updatedAt.toMillis() > beforeDirectHarvest.data().updatedAt.toMillis(),
    "harvesting in the same millisecond must still change the player's map revision");
  assert.equal(directHarvest.player.updatedAt, afterDirectHarvest.data().updatedAt.toDate().toISOString());
  const { updatedAt: beforeHarvestUpdatedAt, ...beforeHarvestFields } = beforeDirectHarvest.data();
  const { updatedAt: afterHarvestUpdatedAt, ...afterHarvestFields } = afterDirectHarvest.data();
  assert.deepEqual(afterHarvestFields, beforeHarvestFields, "a direct harvest must preserve every gameplay field");
  assert.deepEqual((await cropRef.get()).data(), cropBeforeDirectHarvest);
  assert.deepEqual((await leaderboardRef.get()).data(), leaderboardBeforeDirectHarvest);
  const immediatelyAfterHarvest = await getNearbyBasePinsHandler(request(uidB));
  assert.equal(find(immediatelyAfterHarvest).capturedToday, true);
  assert.equal(find(immediatelyAfterHarvest).harvestedToday, true);
  assert.equal(find(immediatelyAfterHarvest).harvestDay, day);
  assert.equal(fetches, 1, "player invalidation must retain the shared geometry cache");
  await assert.rejects(mutateWorldBasePinHandler(directHarvestRequest), { code: "already-exists" });
  assert.equal((await inventoryRef.get()).data().items.wheat, 1);
  assert.deepEqual((await playerRef.get()).data(), afterDirectHarvest.data());

  // Exercise the unchanged real daily-POI writer, not just a seeded record:
  // one reward, immediate map lockout through the player revision, no replay.
  const { captureDailyPoiHandler } = require("../lib/api/captureDailyPoi.js");
  const poiRequest = { auth: { uid: uidB, token: {} }, data: {
    pinId: parkId, ...center, accuracyMetres: 5
  } };
  const beforePoiCapture = (await db.collection("players").doc(uidB).get()).data();
  const poiCapture = await captureDailyPoiHandler(poiRequest);
  assert.equal(poiCapture.accepted, true);
  assert.equal(poiCapture.capture.points, 20);
  assert.equal(poiCapture.capture.coins, 10);
  const afterPoiCapture = await getNearbyBasePinsHandler(request(uidB));
  assert.equal(findPoi(afterPoiCapture, parkId).capturedToday, true);
  assert.equal(findPoi(afterPoiCapture, parkId).dailyCaptureDay, day);
  assert.equal(findPoi(afterPoiCapture, churchId).capturedToday, false);
  await assert.rejects(captureDailyPoiHandler(poiRequest), error => error.code === "already-exists");
  const afterRejectedReplay = (await db.collection("players").doc(uidB).get()).data();
  assert.equal(afterRejectedReplay.coins, beforePoiCapture.coins + 10);
  assert.equal(findPoi(await getNearbyBasePinsHandler(request(uidA)), parkId).capturedToday, false);

  // Real Firestore Buffer round-trip, then a new cache instance (cold server).
  const cell = getMapGeometryCell(center);
  const stored = (await db.collection(SHARED_MAP_GEOMETRY_COLLECTION).doc(cell.key).get()).data();
  assert.ok(Buffer.isBuffer(stored.data));
  const json = gunzipSync(stored.data).toString();
  assert.doesNotMatch(json, /Test 1|capturedToday|harvestDay|wheat_seed|ownerUid/);
  const freshServer = createSharedMapGeometryCache({
    read: async (key) => (await db.collection(SHARED_MAP_GEOMETRY_COLLECTION).doc(key).get()).data(),
    write: async () => assert.fail("Shared cache hit must not write"),
    fetch: async () => assert.fail("Shared cache hit must not call the provider"),
    prepare: async () => assert.fail("Shared cache hit must not reread all pin registrations"),
    extract: (data, camera, viewport) => extractCanonicalPins(data, camera, viewport)
  });
  assert.deepEqual((await freshServer.get(center, bounds)).pins, pins);

  // Twenty seconds after the first response is still inside its old 90s TTL.
  t.mock.timers.setTime(Date.parse("2026-09-08T00:00:00Z"));
  const resetA = await getNearbyBasePinsHandler(request(uidA));
  assert.equal(findPoi(resetA, churchId).capturedToday, false);
  assert.equal(findPoi(resetA, churchId).dailyCaptureDay, null);
  const resetB = await getNearbyBasePinsHandler(request(uidB));
  assert.equal(findPoi(resetB, parkId).capturedToday, false);
  assert.equal(findPoi(resetB, parkId).dailyCaptureDay, null);
  assert.equal(find(resetA).capturedToday, false);
  assert.equal(find(resetA).harvestedToday, false);
  assert.equal(find(resetA).harvestDay, null);
  assert.equal(find(resetA).pointValue, 6);
  assert.notEqual(resetA.fishCycle.expiresAt, firstA.fishCycle.expiresAt);
  assert.equal(fetches, 1);

  // Authoritative state changes remain visible without rebuilding the map cell.
  const current = new Date();
  await Promise.all([
    db.collection(SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION).doc(baseId).set(buildBasePinCaptureValueState({ pinId: base.pinId, capturedAt: current })),
    db.collection("playerCaptureStates").doc(uidA).collection("pins").doc(baseId).set({ pinId: base.pinId, captureDay: "2026-09-08" }),
    db.collection("sharedBasePinHarvests").doc(baseId).collection("players").doc(uidA).set({ harvestDay: "2026-09-08", cropPlantedAt: Timestamp.fromDate(plantedAt) }),
    getWaterFishStateRef(db, getWaterFishCycle(current), water.pinId).set(buildCapturedWaterFishState({ pinId: water.pinId, cycle: getWaterFishCycle(current), now: current, uid: uidA }))
  ]);
  t.mock.timers.setTime(current.getTime() + 91_000);
  const afterCapture = await getNearbyBasePinsHandler(request(uidA));
  assert.equal(find(afterCapture).pointValue, 5);
  assert.equal(find(afterCapture).capturedToday, true);
  assert.equal(find(afterCapture).harvestedToday, true);
  assert.equal(find(afterCapture, water.pinId).fish, null);

  // Replanting is fresh world data, not part of the shared geometry bundle.
  await db.collection("sharedBasePinStates").doc(baseId).set(serializeSharedBasePinStateForStorage({
    ...sharedState, plant: { seedId: "corn_seed", plantedAt: new Date(), miracleGrownAt: null }
  }));
  t.mock.timers.setTime(current.getTime() + 182_000);
  const replanted = await getNearbyBasePinsHandler(request(uidA));
  assert.equal(find(replanted).plant.seedId, "corn_seed");
  assert.equal(find(replanted).harvestedToday, false);
  assert.equal(fetches, 1);

  // Even the rollback/direct path has bounded provider work and retains the
  // server-authored pin fallback. Unexplored areas fail explicitly, not as an
  // apparently successful empty map that clients could keep caching.
  process.env.GROWGO_SHARED_MAP_CACHE_ENABLED = "false";
  providerOffline = true;
  t.mock.timers.setTime(current.getTime() + 273_000);
  const [fallback, fallbackB] = await Promise.all([
    getNearbyBasePinsHandler(request(uidA)), getNearbyBasePinsHandler(request(uidB))
  ]);
  assert.equal(fallback.mapPinsFallback, true, "clients can distinguish a cached subset from fresh map geometry");
  assert.equal(fallbackB.mapPinsFallback, true);
  assert.deepEqual(new Set(fallback.pins.map((pin) => pin.pinId)), new Set(replanted.pins.map((pin) => pin.pinId)));
  assert.equal(find(fallback).capturedToday, true);
  assert.equal(find(fallback).plant.seedId, "corn_seed");
  assert.equal(find(fallback).pointValue, 5);
  assert.equal(find(fallback, water.pinId).fish, null);
  assert.equal(find(fallbackB).capturedToday, false, "sharing static fallback pins must not share another player's capture state");
  assert.equal(find(fallbackB).ownerName, "Test 1");
  assert.equal(find(fallbackB).plant.seedId, "corn_seed");
  assert.equal(find(fallbackB).pointValue, 5);
  await assert.rejects(getNearbyBasePinsHandler({ ...request(uidA), data: { latitude: 0, longitude: 0 } }),
    (error) => error.code === "unavailable");
  process.env.GROWGO_SHARED_MAP_CACHE_ENABLED = "true";
});
