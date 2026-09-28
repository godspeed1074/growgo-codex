import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("local Firebase: wheat harvest adds to the persistent inventory exactly once per day", async (t) => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) { t.skip("Requires localhost Firestore; never accesses live player data."); return; }
  Object.assign(process.env, {
    FIRESTORE_EMULATOR_HOST: host.normalizedHostPort,
    GCLOUD_PROJECT: "demo-growgo-wheat-harvest",
    GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "false",
    GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false"
  });
  const { initializeApp, deleteApp } = require("firebase-admin/app");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-wheat-harvest" }, `wheat-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { acceptPrivateAlphaCapture } = require("../lib/domain/captures/privateAlphaCapture.js");
  const { mutateWorldBasePinHandler } = require("../lib/api/mutateWorldBasePin.js");
  const { serializeSharedBasePinStateForStorage, sharedWorldDocumentId } = require("../lib/domain/world/sharedWorld.js");
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const ago = days => new Date(now.getTime() - days * 86_400_000);
  const hash = value => createHash("sha256").update(value).digest("hex");
  const uid = `wheat-owner-${process.pid}`;
  const guest = `wheat-guest-${process.pid}`;
  const inventoryRef = id => db.collection("playerMarketInventories").doc(id);
  const quantity = async id => (await inventoryRef(id).get()).data().items.wheat;
  for (const id of [uid, guest]) {
    await db.collection("players").doc(id).set({ ...buildDefaultPlayerDocument(Timestamp.now()),
      displayName: "Wheat test", profileComplete: true, country: "Australia", region: "oceania", state: "Victoria", gender: "male" });
    await inventoryRef(id).set({ schemaVersion: 2, items: { wheat: 5, wheat_seed: 3, corn: 11 } });
  }
  let index = 0;
  async function seedCrop(plant) {
    const pinId = `ggpin:v1:osm-way:${900000000 + process.pid}:${index++}`;
    const canonicalPin = { pinId, latitude: -38.45, longitude: 145.24, generatorVersion: 1,
      sourceType: "osm-way", sourceId: String(900000000 + process.pid), positionIndex: index - 1,
      segmentIndex: 0, distanceAlongWayMetres: 0 };
    const state = { pinId, latitude: canonicalPin.latitude, longitude: canonicalPin.longitude,
      ownerUid: uid, ownerName: "Wheat test", ownerAvatarUrl: null, ownedAt: ago(30), updatedAt: now,
      level: 1, replantEnabled: false, plant };
    await db.collection("sharedBasePinStates").doc(sharedWorldDocumentId(pinId)).set(serializeSharedBasePinStateForStorage(state));
    await db.collection("authoritativeWaterPinStates").doc(pinId).set({ pinId, type: "base", latitude: state.latitude, longitude: state.longitude });
    return canonicalPin;
  }
  function capture(pin, id = uid, requestId = `wheat-${index}-${Date.now()}-${Math.random()}`) {
    return acceptPrivateAlphaCapture({ uid: id, canonicalPin: pin,
      evidence: { pinLatitude: pin.latitude, pinLongitude: pin.longitude },
      request: { requestId, pinId: pin.pinId, latitude: pin.latitude, longitude: pin.longitude,
        accuracyMetres: 5, clientCapturedAt: new Date().toISOString() } });
  }

  await t.test("ordinary ripe wheat awards +1, persists, and leaves other resources and seeds untouched", async () => {
    const pin = await seedCrop({ seedId: "wheat_seed", plantedAt: ago(22), miracleGrownAt: null });
    const result = await capture(pin);
    assert.equal(result.harvest.itemId, "wheat");
    assert.equal(result.inventory.items.wheat, 6);
    assert.equal(await quantity(uid), 6);
    assert.equal(result.inventory.items.wheat_seed, 3);
    assert.equal(result.inventory.items.corn, 11);
    const receipt = await db.collection("sharedBasePinHarvests").doc(sharedWorldDocumentId(pin.pinId)).collection("players").doc(uid).get();
    assert.equal(receipt.data().harvestDay, day);
    await assert.rejects(capture(pin), { code: "already-exists" });
    assert.equal(await quantity(uid), 6);
    const other = await capture(pin, guest);
    assert.equal(other.inventory.items.wheat, 6);
    assert.equal(await quantity(guest), 6);
  });

  await t.test("Miracle-Grown wheat awards the resource immediately", async () => {
    const pin = await seedCrop({ seedId: "wheat_seed", plantedAt: ago(1), miracleGrownAt: ago(0.01) });
    const before = await quantity(uid);
    const result = await capture(pin);
    assert.equal(result.harvest.itemId, "wheat");
    assert.equal(await quantity(uid), before + 1);
  });

  await t.test("a crop ripening after today's base capture can still award wheat once", async () => {
    const plantedAt = ago(1);
    const pin = await seedCrop({ seedId: "wheat_seed", plantedAt, miracleGrownAt: ago(0.01) });
    await db.collection("playerCaptureStates").doc(uid).collection("pins").doc(hash(pin.pinId)).set({ pinId: pin.pinId, captureDay: day });
    const before = await quantity(uid);
    const playerRef = db.collection("players").doc(uid);
    const leaderboardRef = db.collection("playerLeaderboardScores").doc(uid);
    const playerBefore = await playerRef.get();
    const leaderboardBefore = (await leaderboardRef.get()).data();
    const req = { auth: { uid, token: {} }, data: { action: "harvest", pinId: pin.pinId } };
    const result = await mutateWorldBasePinHandler(req);
    assert.equal(result.harvest.itemId, "wheat");
    assert.equal(await quantity(uid), before + 1);
    const playerAfter = await playerRef.get();
    assert.notDeepEqual(playerAfter.updateTime, playerBefore.updateTime);
    const { updatedAt: beforeUpdatedAt, ...beforeFields } = playerBefore.data();
    const { updatedAt: afterUpdatedAt, ...afterFields } = playerAfter.data();
    assert.ok(afterUpdatedAt.toMillis() > beforeUpdatedAt.toMillis());
    assert.equal(result.player.updatedAt, afterUpdatedAt.toDate().toISOString());
    assert.deepEqual(afterFields, beforeFields, "direct crop rewards must not change XP, coins, crafting, or profile fields");
    assert.deepEqual((await leaderboardRef.get()).data(), leaderboardBefore, "no duplicate leaderboard points");
    await assert.rejects(mutateWorldBasePinHandler(req), error => {
      assert.equal(error.code, "already-exists");
      assert.deepEqual(error.details, {
        reason: "crop-already-harvested", pinId: pin.pinId,
        harvestDay: day, cropPlantedAt: plantedAt.toISOString()
      });
      return true;
    });
    assert.equal(await quantity(uid), before + 1);
    assert.deepEqual((await playerRef.get()).data(), playerAfter.data());
    assert.deepEqual((await leaderboardRef.get()).data(), leaderboardBefore);
  });

  await t.test("same-day legacy or mismatched receipts reject without confirming the current crop", async () => {
    const plantedAt = ago(1);
    const pin = await seedCrop({ seedId: "wheat_seed", plantedAt, miracleGrownAt: ago(0.01) });
    await db.collection("playerCaptureStates").doc(uid).collection("pins").doc(hash(pin.pinId)).set({ pinId: pin.pinId, captureDay: day });
    const harvestRef = db.collection("sharedBasePinHarvests").doc(sharedWorldDocumentId(pin.pinId)).collection("players").doc(uid);
    const playerBefore = (await db.collection("players").doc(uid).get()).data();
    const before = await quantity(uid);
    for (const receipt of [
      { pinId: pin.pinId, harvestDay: day },
      { harvestDay: day, cropPlantedAt: Timestamp.fromDate(plantedAt) },
      { pinId: "different-pin", harvestDay: day, cropPlantedAt: Timestamp.fromDate(plantedAt) },
      { pinId: pin.pinId, harvestDay: day, cropPlantedAt: Timestamp.fromDate(ago(2)) }
    ]) {
      await harvestRef.set(receipt);
      await assert.rejects(mutateWorldBasePinHandler({ auth: { uid, token: {} }, data: {
        action: "harvest", pinId: pin.pinId
      } }), error => {
        assert.equal(error.code, "already-exists");
        assert.equal(error.details, undefined, "an unproven receipt must not grey a different or unknown crop");
        return true;
      });
      assert.equal(await quantity(uid), before);
      assert.deepEqual((await db.collection("players").doc(uid).get()).data(), playerBefore);
    }
  });

  await t.test("growing and expired wheat do not claim a harvest or change resources", async () => {
    for (const days of [1, 8, 15, 29]) {
      const pin = await seedCrop({ seedId: "wheat_seed", plantedAt: ago(days), miracleGrownAt: null });
      const before = await quantity(uid);
      const result = await capture(pin);
      assert.equal(result.harvest, null);
      assert.equal(await quantity(uid), before);
    }
  });
});
