import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("shared dove: two-player deployment, races, saved owner rewards, expiry and isolation", async t => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) { t.skip("Local emulator required; never accesses real accounts."); return; }
  Object.assign(process.env, { FIRESTORE_EMULATOR_HOST: host.normalizedHostPort, GCLOUD_PROJECT: "demo-growgo-bird-shared",
    GROWGO_BACKEND_ENVIRONMENT: "development", GROWGO_BACKEND_PROJECT_ID: "growgo-development", GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
    GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false", GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "false",
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true", GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled" });
  const { initializeApp, deleteApp } = require("firebase-admin/app"), { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-bird-shared" }, `shared-${process.pid}`), db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const { birdQuestsHandler: handle } = require("../lib/api/birdQuests.js");
  const { craftRecipeHandler } = require("../lib/api/marketplace.js");
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { generateCanonicalPinsForWay } = require("../lib/domain/pins/canonicalPinGenerator.js");
  const { createFirestoreAuthoritativeSourceCache, AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME } = require("../lib/infrastructure/pins/firestoreAuthoritativePinCache.js");
  const { serializeSharedBasePinStateForStorage, sharedWorldDocumentId } = require("../lib/domain/world/sharedWorld.js");
  const owner = `owner-${process.pid}`, visitor = `visitor-${process.pid}`, competitor = `competitor-${process.pid}`;
  const auth = uid => ({ uid, token: { email: uid === owner ? "godspeed1074@gmail.com" : `${uid}@example.test`, email_verified: true } });
  const call = (uid, data) => handle({ auth: auth(uid), data });
  const now = new Date(), location = { latitude: -38.45, longitude: 145.24, accuracyMetres: 5 };
  const profile = { ...buildDefaultPlayerDocument(Timestamp.now()), profileComplete: true, displayName: "Rubberlips", gender: "male", country: "Australia", region: "oceania", state: "Victoria", coins: 123, xp: 50 };
  for (const uid of [owner, visitor, competitor]) {
    await db.collection("players").doc(uid).set({ ...profile, displayName: uid === owner ? "Rubberlips" : uid });
    await db.collection("playerMarketInventories").doc(uid).set({ schemaVersion: 1, items: { wheat: 10 } });
  }
  const source = { generatorVersion: 1, sourceType: "osm-way", sourceId: "98989997", spacingMetres: 50,
    orderedCoordinates: [{ latitude: location.latitude, longitude: location.longitude }, { latitude: -38.442, longitude: 145.24 }], fetchedAt: now.toISOString() };
  const pins = generateCanonicalPinsForWay(source), pin = pins[0];
  const cache = createFirestoreAuthoritativeSourceCache({ firestore: db, collectionName: AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME, readsEnabled: true, writesEnabled: true });
  await cache.write(source, { kind: "positive", source, cachedAt: now.toISOString(), expiresAt: new Date(+now + 86400000).toISOString() });
  const plotRef = db.collection("sharedBasePinStates").doc(sharedWorldDocumentId(pin.pinId));
  const classificationRef = db.collection("authoritativeWaterPinStates").doc(pin.pinId);
  await classificationRef.set({ pinId: pin.pinId, type: "base", latitude: pin.latitude, longitude: pin.longitude });
  const plantedAt = new Date(+now - 86400000);
  const plot = { pinId: pin.pinId, latitude: pin.latitude, longitude: pin.longitude, ownerUid: visitor, ownerName: "Visitor", ownerAvatarUrl: null,
    ownedAt: plantedAt, level: 1, replantEnabled: false, plant: { seedId: "wheat_seed", plantedAt, miracleGrownAt: null }, updatedAt: now };
  const setPlot = changes => plotRef.set(serializeSharedBasePinStateForStorage({ ...plot, ...changes }));
  await setPlot({});
  const candidates = [{ id: pin.pinId, lat: pin.latitude, lng: pin.longitude }];
  const depRef = db.collection("birdQuestDeployments").doc("alpha-dove-pilot");
  await depRef.delete(); // Validated local demo project only, exact test document.
  let deployment, winner, run;

  await t.test("only owner can grant/deploy; visitors do not receive birds", async () => {
    await call(owner, { action: "claim-test-dove" });
    assert.equal((await call(visitor, { action: "snapshot" })).canDeploy, false);
    assert.equal((await call(visitor, { action: "snapshot" })).bird, null);
    for (const action of ["claim-test-dove", "deploy", "recall"]) await assert.rejects(call(visitor, { action, ...location, candidates }), { code: "permission-denied" });
    await assert.rejects(handle({ auth: { uid: visitor, token: { email_verified: false } }, data: { action: "snapshot" } }), { code: "permission-denied" });
  });
  await t.test("empty, unowned, expired and fabricated plots are rejected", async () => {
    for (const changes of [{ plant: null }, { ownerUid: null }, { plant: { ...plot.plant, plantedAt: new Date(+now - 40 * 86400000) } }]) {
      await setPlot(changes);
      await assert.rejects(call(owner, { action: "deploy", ...location, candidates }), { code: "failed-precondition" });
    }
    await setPlot({});
    await classificationRef.update({type:"water"});
    await assert.rejects(call(owner, { action: "deploy", ...location, candidates: [{ id: "made-up", lat: location.latitude, lng: location.longitude }] }), { code: "failed-precondition" });
    await classificationRef.update({type:"base"});
  });
  await t.test("one shared landing; retries do not create another; nearby respects distance", async () => {
    const [a, b] = await Promise.all([call(owner, { action: "deploy" }), call(owner, { action: "deploy", latitude: 51.5, longitude: -0.1, accuracyMetres: 5, candidates: [] })]);
    deployment = a.deployment; assert.equal(a.deployment.id, b.deployment.id);
    assert.equal((await call(visitor, { action: "nearby", ...location })).birds[0].id, deployment.id);
    assert.deepEqual((await call(visitor, { action: "nearby", ...location, latitude: -37 })).birds, []);
    assert.equal((await depRef.get()).data().expiresAt - (await depRef.get()).data().createdAt, 21600000);
    const serialized = JSON.stringify((await call(visitor, { action: "nearby", ...location })).birds);
    assert.equal(serialized.includes("gmail"), false); assert.equal(serialized.includes("ownerUid"), false);
    assert.equal((await plotRef.get()).data().ownerUid, visitor);
  });
  await t.test("owner and visitors can look; just one can accept; far and stale offers fail", async () => {
    assert.equal((await call(owner, { action: "offer", deploymentId: deployment.id, ...location, candidates })).offer.deploymentId, deployment.id);
    await assert.rejects(call(visitor, { action: "offer", deploymentId: deployment.id, ...location, latitude: -38.44, candidates }), { code: "failed-precondition" });
    const offers = await Promise.all([visitor, competitor].map(uid => call(uid, { action: "offer", deploymentId: deployment.id, ...location, candidates })));
    assert.equal((await call(visitor, { action: "snapshot" })).offer.id, offers[0].offer.id);
    const accepted = await Promise.allSettled([visitor, competitor].map((uid, i) => call(uid, { action: "accept", ...location, offerId: offers[i].offer.id, questId: "dove-1-flour-power" })));
    assert.equal(accepted.filter(a => a.status === "fulfilled").length, 1);
    const index = accepted.findIndex(a => a.status === "fulfilled"); winner = [visitor, competitor][index]; run = accepted[index].value.run;
    const staleOwnerOffer = (await call(owner, { action: "snapshot" })).offer;
    await assert.rejects(call(owner, { action: "accept", offerId: staleOwnerOffer.id, questId: "dove-1-flour-power", ...location }), { code: "failed-precondition" });
    assert.equal(run.birdOwnerUid, owner); assert.equal(run.birdId, (await call(owner, { action: "snapshot" })).bird.id);
    assert.deepEqual((await call(visitor, { action: "nearby", ...location })).birds, []);
    assert.equal((await call(winner, { action: "accept", ...location, offerId: run.id, questId: run.questId })).run.id, run.id);
    await assert.rejects(call(winner === visitor ? competitor : visitor, { action: "claim", runId: run.id }), { code: "not-found" });
  });
  await t.test("real craft advances; full inventory/retries cannot duplicate visitor reward, bird XP or mail", async () => {
    const requestId = `shared-flour-${process.pid}`;
    await craftRecipeHandler({ auth: auth(winner), data: { requestId, recipeId: "flour" } });
    const ready = await call(winner, { action: "sync", runId: run.id, receipts: [{ kind: "craft", id: requestId }] });
    assert.equal(ready.run.status, "reward-pending");
    const ownerRef = db.collection("birdQuestPlayers").doc(owner), bag = db.collection("playerMarketInventories").doc(winner);
    const reward = ready.run.reward, original = (await bag.get()).data().items, item = Object.keys(reward.items)[0];
    await bag.set({ items: { ...original, [item]: 10000 } });
    await assert.rejects(call(winner, { action: "claim", runId: run.id }), { code: "failed-precondition" });
    assert.equal((await ownerRef.collection("mail").get()).size, 0);
    assert.equal((await call(owner, { action: "snapshot" })).bird.xp, 0);
    await bag.set({ items: original });
    const results = await Promise.all([call(winner, { action: "claim", runId: run.id }), call(winner, { action: "claim", runId: run.id })]);
    assert.equal(results.filter(r => r.claimedNow).length, 1);
    const ownerState = await call(owner, { action: "snapshot" });
    assert.equal(ownerState.bird.xp, 100); assert.equal(ownerState.bird.questsCompleted, 1); assert.equal(ownerState.pendingMailCount, 1);
    assert.equal((await call(winner, { action: "snapshot" })).bird, null);
    assert.equal((await db.collection("players").doc(winner).get()).data().xp, 150);
    assert.equal((await db.collection("players").doc(owner).get()).data().xp, 50);
    assert.deepEqual((await db.collection("playerMarketInventories").doc(owner).get()).data().items, { wheat: 10 });
    const mail = (await ownerRef.collection("mail").doc(run.id).get()).data();
    assert.equal(mail.status, "unclaimed"); assert.equal(mail.reward.card, undefined);
    assert.deepEqual(mail.reward.items, reward.items); assert.equal(mail.reward.points, 100); assert.equal(mail.reward.xp, 100);
    assert.equal((await ownerRef.collection("mail").get()).size, 1);
  });
  for (const lockoutTiming of ["before offer", "before acceptance"]) {
    await t.test(`host captured and harvested today ${lockoutTiming} still allows dove interaction without extra rewards`, async () => {
      const uid = `locked-${lockoutTiming.replaceAll(" ", "-")}-${process.pid}`;
      const playerRef = db.collection("players").doc(uid), bagRef = db.collection("playerMarketInventories").doc(uid);
      await playerRef.set({ ...profile, displayName: uid, craftingLevel: 1 });
      await bagRef.set({ schemaVersion: 1, items: { wheat: 10 } });
      await setPlot({ plant: { ...plot.plant, miracleGrownAt: new Date(+now - 3600000) } });
      deployment = (await call(owner, { action: "deploy", ...location, candidates })).deployment;
      const captureRef = db.collection("playerCaptureStates").doc(uid).collection("pins").doc(sharedWorldDocumentId(pin.pinId));
      const harvestRef = db.collection("sharedBasePinHarvests").doc(sharedWorldDocumentId(pin.pinId)).collection("players").doc(uid);
      let captureBefore, harvestBefore;
      const lockHostForToday = async () => {
        const at = Timestamp.now(), day = at.toDate().toISOString().slice(0, 10);
        await captureRef.set({ schemaVersion: 1, pinId: pin.pinId, captureDay: day, capturedAt: at });
        await harvestRef.set({ schemaVersion: 1, pinId: pin.pinId, harvestDay: day, harvestedAt: at, cropPlantedAt: Timestamp.fromDate(plantedAt) });
        captureBefore = (await captureRef.get()).data(); harvestBefore = (await harvestRef.get()).data();
      };
      const ownerRef = db.collection("birdQuestPlayers").doc(owner);
      const unchangedRefs = [playerRef, bagRef, plotRef, ownerRef,
        db.collection("playerLeaderboardScores").doc(uid), db.collection("playerLeaderboardScores").doc(owner),
        db.collection("players").doc(owner), db.collection("playerMarketInventories").doc(owner)];
      const before = await Promise.all(unchangedRefs.map(async ref => (await ref.get()).data()));
      const mailBefore = (await ownerRef.collection("mail").get()).docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (lockoutTiming === "before offer") await lockHostForToday();
      assert.equal((await call(uid, { action: "nearby", ...location })).birds[0].id, deployment.id);
      const offer = (await call(uid, { action: "offer", deploymentId: deployment.id, ...location, candidates })).offer;
      // A single host cannot satisfy capture/harvest counts; crafting is independently eligible.
      assert.deepEqual(offer.quests.map(quest => quest.id), ["dove-1-flour-power"]);
      assert.equal(offer.landing.id, pin.pinId);
      if (lockoutTiming === "before acceptance") await lockHostForToday();
      assert.equal((await call(uid, { action: "nearby", ...location })).birds[0].id, deployment.id);
      const accepted = await call(uid, { action: "accept", ...location, offerId: offer.id, questId: "dove-1-flour-power" });
      assert.equal(accepted.run.status, "active"); assert.equal(accepted.run.reward, null);
      assert.deepEqual(accepted.run.seen, []); assert.equal(accepted.offer, null); assert.deepEqual(accepted.cardCounts, {});
      assert.equal(accepted.run.deploymentId, deployment.id);
      assert.equal((await depRef.get()).data().status, "departed");
      assert.deepEqual((await captureRef.get()).data(), captureBefore);
      assert.deepEqual((await harvestRef.get()).data(), harvestBefore);
      assert.deepEqual(await Promise.all(unchangedRefs.map(async ref => (await ref.get()).data())), before);
      assert.deepEqual((await ownerRef.collection("mail").get()).docs.map(doc => ({ id: doc.id, ...doc.data() })), mailBefore);
      await setPlot({});
    });
  }
  await t.test("recall, expired visit and harvested-out plot remove shared visibility", async () => {
    deployment = (await call(owner, { action: "deploy", ...location, candidates })).deployment;
    await assert.rejects(call(visitor, { action: "recall", deploymentId: deployment.id }), { code: "permission-denied" });
    await setPlot({ plant: null });
    assert.deepEqual((await call(visitor, { action: "nearby", ...location })).birds, []);
    await setPlot({});
    await call(owner, { action: "recall", deploymentId: deployment.id });
    assert.deepEqual((await call(visitor, { action: "nearby", ...location })).birds, []);
    deployment = (await call(owner, { action: "deploy", ...location, candidates })).deployment;
    await depRef.update({ expiresAt: Date.now() - 1 });
    assert.deepEqual((await call(visitor, { action: "nearby", ...location })).birds, []);
    assert.equal((await call(owner, { action: "snapshot" })).deployment, null);
  });
});
