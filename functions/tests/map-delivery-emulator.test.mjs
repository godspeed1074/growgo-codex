import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("local Firebase delivery: prepare is static-only, interactive reuses it, guards stay enforced", async t => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) { t.skip("Requires localhost Firestore; never connects to production."); return; }
  Object.assign(process.env, {
    FIRESTORE_EMULATOR_HOST: host.normalizedHostPort,
    GROWGO_BACKEND_ENVIRONMENT: "development", GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true", GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED: "true",
    GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false", GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "false",
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true", GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled",
    GCLOUD_PROJECT: "demo-growgo-map-delivery", GROWGO_SHARED_MAP_CACHE_ENABLED: "true",
    GROWGO_MAP_DELIVERY_PREVIEW_ENABLED: "true", GROWGO_PRIVATE_ALPHA_OVERPASS_ENDPOINT: "https://synthetic.overpass.test/api/interpreter"
  });
  const { initializeApp, deleteApp } = require("firebase-admin/app");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-map-delivery" }, `delivery-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const time = Date.parse("2026-09-09T10:00:00Z");
  t.mock.timers.enable({ apis: ["Date"], now: time });
  const { getNearbyBasePinsHandler: load, validateNearbyBasePinRequest } = require("../lib/api/getNearbyBasePins.js");
  const { getMapGeometryCell, SHARED_MAP_GEOMETRY_COLLECTION } = require("../lib/infrastructure/pins/sharedMapGeometryCache.js");
  const { AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME } = require("../lib/infrastructure/pins/firestoreAuthoritativePinCache.js");
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const uid = `delivery-test-${process.pid}`;
  const center = { latitude: -37.82, longitude: 144.98 };
  const playerRef = db.collection("players").doc(uid);
  await playerRef.set({ ...buildDefaultPlayerDocument(Timestamp.now()), profileComplete: true,
    displayName: "Local delivery fixture", region: "oceania", country: "Australia", state: "Victoria", gender: "male" });
  await db.collection(SHARED_MAP_GEOMETRY_COLLECTION).doc(getMapGeometryCell(center).key).delete();
  const before = await playerRef.get();
  let providerCalls = 0;
  t.mock.method(globalThis, "fetch", async url => {
    assert.match(String(url), /overpass/); providerCalls++;
    return { ok: true, json: async () => ({ elements: [{ type: "way", id: 998811221,
      tags: { highway: "residential" }, geometry: [
        { lat: -37.835, lon: 144.98 }, { lat: -37.805, lon: 144.98 }
      ] }] }) };
  });
  const request = delivery => ({ auth: { uid, token: {} }, data: { ...center, delivery } });
  const collections = [];
  let staticOnly = true;
  const originalCollection = db.collection.bind(db);
  const allowed = new Set(["players", "playerModeration", SHARED_MAP_GEOMETRY_COLLECTION, AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME, "authoritativeWaterPinStates"]);
  t.mock.method(db, "collection", name => {
    if (staticOnly) { collections.push(name); assert.ok(allowed.has(name), `static preparation must not read ${name}`); }
    return originalCollection(name);
  });
  const prepared = await load(request("prepare"));
  assert.equal(prepared.ok, true);
  assert.equal(prepared.mapDelivery.refreshNeeded, false);
  assert.equal(prepared.pins, undefined);
  assert.equal(prepared.fishCycle, undefined);
  assert.equal(providerCalls, 1);
  assert.ok((await playerRef.get()).updateTime.isEqual(before.updateTime), "preparation cannot change the player");
  await load(request("prepare"));
  assert.equal(providerCalls, 1, "another preparation reuses the saved area");
  assert.ok(collections.every(name => allowed.has(name)));
  staticOnly = false;
  const interactive = await load(request("interactive"));
  assert.ok(interactive.pins.length > 0);
  assert.ok(interactive.pins.every(p => p.captureStateKnown && p.capturedToday === false));
  assert.equal(providerCalls, 1, "arrival does not fetch outside geography again");
  const legacy = await load({ auth: { uid, token: {} }, data: center });
  assert.deepEqual(legacy.pins, interactive.pins);
  assert.equal(legacy.mapDelivery, undefined, "legacy wire response is unchanged");
  t.mock.timers.setTime(time + 25 * 60 * 60 * 1000);
  const stale = await load(request("interactive"));
  assert.equal(stale.mapDelivery.refreshNeeded, true);
  assert.equal(providerCalls, 1, "stale display does not trigger an external refresh");
  staticOnly = true;
  const refreshed = await load(request("prepare"));
  assert.equal(refreshed.mapDelivery.refreshNeeded, false);
  assert.equal(providerCalls, 2);
  assert.deepEqual((await playerRef.get()).data(), before.data());
  await assert.rejects(load({ data: { ...center, delivery: "prepare" } }), e => e.code === "unauthenticated");
  assert.throws(() => validateNearbyBasePinRequest({ data: { ...center, delivery: "anything" } }), e => e.code === "invalid-argument");
  process.env.GROWGO_MAP_DELIVERY_PREVIEW_ENABLED = "false";
  await assert.rejects(load(request("prepare")), e => e.details?.reason === "map-delivery-disabled");
  await assert.rejects(load(request("interactive")), e => e.details?.reason === "map-delivery-disabled");
  process.env.GROWGO_MAP_DELIVERY_PREVIEW_ENABLED = "true";
  process.env.GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED = "false";
  await assert.rejects(load(request("prepare")), e => e.code === "failed-precondition");
  t.diagnostic(`Preparation used only: ${[...new Set(collections)].join(", ")}. No gameplay collections.`);
});
