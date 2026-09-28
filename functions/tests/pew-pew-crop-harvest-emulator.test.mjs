import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("local Firebase: beam harvest receipts survive nearby refresh without duplicate crop rewards", async (t) => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) {
    t.skip("Requires localhost Firestore; never accesses live player data.");
    return;
  }
  // This fixture freezes time and changes its synthetic OSM way each run.
  // Isolate the entire saved geometry cache as well as the player records;
  // otherwise a prior run's still-fresh cell contains different pin IDs.
  const projectId = `demo-beam-crop-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  Object.assign(process.env, {
    FIRESTORE_EMULATOR_HOST: host.normalizedHostPort,
    GCLOUD_PROJECT: projectId,
    GROWGO_BACKEND_ENVIRONMENT: "development",
    GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
    GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED: "true",
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
    GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled",
    GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "false",
    GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false",
    GROWGO_SHARED_MAP_CACHE_ENABLED: "true",
    GROWGO_PRIVATE_ALPHA_OVERPASS_ENDPOINT: "https://pew-pew.overpass.test/api/interpreter"
  });
  t.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-09-12T12:00:00Z") });
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const ago = days => new Date(now.getTime() - days * 86_400_000);
  const { initializeApp, deleteApp } = require("firebase-admin/app");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId }, `beam-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const harvestReceiptReads = [];
  const runTransaction = db.runTransaction.bind(db);
  t.mock.method(db, "runTransaction", (callback, ...options) => runTransaction(async transaction => {
    const get = transaction.get.bind(transaction);
    t.mock.method(transaction, "get", (ref, ...readOptions) => {
      if (ref?.path?.startsWith("sharedBasePinHarvests/")) harvestReceiptReads.push(ref.path);
      return get(ref, ...readOptions);
    });
    return callback(transaction);
  }, ...options));
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { captureBeamCandidates } = require("../lib/api/fireAlphaPewPewBeam.js");
  const { ALPHA_PEW_PEW_TEST_KIT_ID } = require("../lib/api/alphaPewPewTestKit.js");
  const { mutateWorldBasePinHandler } = require("../lib/api/mutateWorldBasePin.js");
  const { acceptPrivateAlphaCapture } = require("../lib/domain/captures/privateAlphaCapture.js");
  const { getNearbyBasePinsHandler, extractCanonicalPins, createBounds } = require("../lib/api/getNearbyBasePins.js");
  const { serializeSharedBasePinStateForStorage, sharedWorldDocumentId } = require("../lib/domain/world/sharedWorld.js");
  const center = { latitude: -38.4537, longitude: 145.2381 };
  const mapPayload = { elements: [{ type: "way", id: 890000000 + process.pid,
    tags: { highway: "residential" },
    geometry: [{ lat: -38.465, lon: center.longitude }, { lat: -38.435, lon: center.longitude }]
  }] };
  t.mock.method(globalThis, "fetch", async url => {
    assert.match(String(url), /overpass/);
    return { ok: true, json: async () => mapPayload };
  });
  const uid = `beam-crop-owner-${process.pid}`;
  const guest = `beam-crop-guest-${process.pid}`;
  const inventoryRef = id => db.collection("playerMarketInventories").doc(id);
  const receiptRef = (pinId, id = uid) => db.collection("sharedBasePinHarvests")
    .doc(sharedWorldDocumentId(pinId)).collection("players").doc(id);
  for (const id of [uid, guest]) {
    await db.collection("players").doc(id).set({ ...buildDefaultPlayerDocument(Timestamp.fromDate(now)),
      displayName: "Beam crop test", profileComplete: true, country: "Australia",
      region: "oceania", state: "Victoria", gender: "male" });
    await inventoryRef(id).set({ schemaVersion: 2,
      items: { wheat: 5, corn: 5, cocoa_beans: 5, wheat_seed: 3, water: 8 } });
    await db.collection("playerRewardGrants").doc(id).collection("rewards")
      .doc(ALPHA_PEW_PEW_TEST_KIT_ID).set({ grantedAt: Timestamp.fromDate(now) });
  }
  const plants = [
    { seedId: "wheat_seed", plantedAt: ago(22), miracleGrownAt: null },
    { seedId: "corn_seed", plantedAt: now, miracleGrownAt: now },
    { seedId: "cocoa_bean_seed", plantedAt: ago(22), miracleGrownAt: null },
    { seedId: "sugar_cane_seed", plantedAt: ago(1), miracleGrownAt: null },
    { seedId: "tomato_seed", plantedAt: ago(8), miracleGrownAt: null },
    { seedId: "wheat_seed", plantedAt: ago(15), miracleGrownAt: null },
    { seedId: "sugar_cane_seed", plantedAt: ago(29), miracleGrownAt: null },
    { seedId: "wheat_seed", plantedAt: ago(22), miracleGrownAt: null },
    { seedId: "tomato_seed", plantedAt: ago(22), miracleGrownAt: ago(7) }
  ];
  const candidates = extractCanonicalPins(mapPayload, center, createBounds(center)).pins.slice(0, plants.length);
  assert.equal(candidates.length, plants.length);
  for (const [index, pin] of candidates.entries()) {
    await db.collection("sharedBasePinStates").doc(sharedWorldDocumentId(pin.pinId))
      .set(serializeSharedBasePinStateForStorage({
        pinId: pin.pinId, latitude: pin.latitude, longitude: pin.longitude,
        ownerUid: uid, ownerName: "Beam crop test", ownerAvatarUrl: null,
        ownedAt: ago(30), updatedAt: now, level: 1, replantEnabled: false, plant: plants[index]
      }));
    await db.collection("authoritativeWaterPinStates").doc(pin.pinId).set({
      pinId: pin.pinId, type: "base", latitude: pin.latitude, longitude: pin.longitude
    });
  }
  await receiptRef(candidates[2].pinId).set({ harvestDay: "2026-09-11",
    cropPlantedAt: Timestamp.fromDate(plants[2].plantedAt) });
  // A legacy same-day receipt must still prevent another resource grant.
  await receiptRef(candidates[7].pinId).set({ harvestDay: day });
  const fire = (id, requestId, pins = candidates) => captureBeamCandidates({
    uid: id, input: { ...center, requestId, accuracyMetres: 5,
      clientFiredAt: now.toISOString(), aimAngleDegrees: 0 },
    candidates: pins, replacementCandidates: [], waterFishSpawnChance: 0, now
  });
  const nearbyRequest = id => ({ auth: { uid: id, token: {} }, data: center });
  const initialMap = await getNearbyBasePinsHandler(nearbyRequest(uid));
  const find = (map, index = 0) => {
    const pin = map.pins.find(value => value.pinId === candidates[index].pinId);
    assert.ok(pin, `Nearby response must include this run's synthetic pin ${candidates[index].pinId}`);
    return pin;
  };
  assert.equal(find(initialMap).harvestedToday, false);
  const beforePlayer = (await db.collection("players").doc(uid).get()).data();
  const result = await fire(uid, "beam-crops-first");
  assert.deepEqual(harvestReceiptReads, [0, 1, 2, 7].map(index => receiptRef(candidates[index].pinId).path),
    "read receipts only for active crops; growing and expired crops add no reads");
  assert.deepEqual(result.resources, { wheat: 1, corn: 1, cocoa_beans: 1 });
  assert.equal(result.shot.captureCount, candidates.length, "growth stages do not alter the base capture reward");
  assert.equal(result.chargesAvailable, 4);
  const inventory = (await inventoryRef(uid).get()).data().items;
  assert.equal(inventory.wheat, 6);
  assert.equal(inventory.corn, 6);
  assert.equal(inventory.cocoa_beans, 6);
  assert.equal(inventory.wheat_seed, 3);
  assert.equal(inventory.water, 8);
  const afterPlayer = (await db.collection("players").doc(uid).get()).data();
  assert.equal(afterPlayer.coins - beforePlayer.coins, result.shot.coins);
  assert.equal(afterPlayer.xp - beforePlayer.xp, result.shot.xp);
  for (const index of [0, 1, 2]) {
    const receipt = (await receiptRef(candidates[index].pinId).get()).data();
    assert.equal(receipt.harvestDay, day);
    assert.equal(receipt.cropPlantedAt.toMillis(), plants[index].plantedAt.getTime());
    assert.equal(result.hits[index].harvest.harvestDay, day);
    assert.equal(result.hits[index].harvest.cropPlantedAt, plants[index].plantedAt.toISOString());
  }
  for (const index of [3, 4, 5, 6, 8]) {
    assert.equal(result.hits[index].harvestResource, null);
    assert.equal(result.hits[index].harvest, null);
    assert.equal((await receiptRef(candidates[index].pinId).get()).exists, false);
  }
  assert.equal(result.hits[7].harvest, null);
  const afterMap = await getNearbyBasePinsHandler(nearbyRequest(uid));
  for (const index of [0, 1, 2]) {
    assert.equal(find(afterMap, index).capturedToday, true);
    assert.equal(find(afterMap, index).harvestedToday, true);
    assert.equal(find(afterMap, index).harvestDay, day);
  }
  assert.equal(find(await getNearbyBasePinsHandler(nearbyRequest(guest))).harvestedToday, false);

  harvestReceiptReads.length = 0;
  const replay = await fire(uid, "beam-crops-first");
  assert.equal(replay.replayed, true);
  assert.equal(harvestReceiptReads.length, 0, "shot replay adds no harvest receipt reads");
  assert.deepEqual((await inventoryRef(uid).get()).data().items, inventory);
  const repeat = await fire(uid, "beam-crops-repeat");
  assert.equal(harvestReceiptReads.length, 0, "already captured crops add no harvest receipt reads");
  assert.equal(repeat.shot.captureCount, 0);
  assert.deepEqual(repeat.resources, {});
  assert.deepEqual((await inventoryRef(uid).get()).data().items, inventory);
  await assert.rejects(mutateWorldBasePinHandler({ auth: { uid, token: {} },
    data: { action: "harvest", pinId: candidates[0].pinId } }), { code: "already-exists" });
  const canonicalPin = candidates[0];
  await assert.rejects(acceptPrivateAlphaCapture({ uid, canonicalPin,
    evidence: { pinLatitude: canonicalPin.latitude, pinLongitude: canonicalPin.longitude },
    request: { requestId: "beam-crops-normal-repeat", pinId: canonicalPin.pinId,
      latitude: canonicalPin.latitude, longitude: canonicalPin.longitude,
      accuracyMetres: 5, clientCapturedAt: now.toISOString() }
  }), { code: "already-exists" });
  assert.deepEqual((await inventoryRef(uid).get()).data().items, inventory);
  const guestResult = await fire(guest, "beam-crops-guest", [candidates[0]]);
  assert.equal(guestResult.resources.wheat, 1, "harvesting is per player, not global");
  assert.equal((await receiptRef(candidates[0].pinId, guest).get()).data().harvestDay, day);

  const emptyPin = { ...candidates[0], pinId: `beam-empty-${process.pid}` };
  const waterPin = { ...candidates[0], pinId: `beam-water-${process.pid}`, type: "water" };
  harvestReceiptReads.length = 0;
  const nonCropResult = await fire(guest, "beam-non-crop-cost", [emptyPin, waterPin]);
  assert.equal(nonCropResult.shot.captureCount, 2);
  assert.equal(harvestReceiptReads.length, 0, "unplanted and water pins add no harvest receipt reads");
});
