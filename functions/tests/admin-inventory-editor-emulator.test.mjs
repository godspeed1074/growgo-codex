import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("local Firebase: inventory editor requires admin access and logs atomic adjustments", async t => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) { t.skip("Requires localhost emulator; never accesses live players."); return; }
  Object.assign(process.env, {
    FIRESTORE_EMULATOR_HOST: host.normalizedHostPort, GCLOUD_PROJECT: "demo-growgo-admin-inventory",
    GROWGO_BACKEND_ENVIRONMENT: "development", GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true", GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false",
    GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true", GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED: "false",
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true", GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled"
  });
  const { initializeApp, deleteApp } = require("firebase-admin/app");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-admin-inventory" }, `inventory-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const { buildDefaultPlayerDocument } = require("../lib/domain/players/playerStore.js");
  const { buildAdminAccountDocument } = require("../lib/domain/admin/adminAccounts.js");
  const { adjustAdminPlayerInventoryHandler: adjust } = require("../lib/api/adminPlayerTools.js");
  const owner = `owner-test-${process.pid}`, admin = `admin-test-${process.pid}`, target = `target-test-${process.pid}`;
  const stamp = Timestamp.now();
  for (const [uid, name] of [[owner, "Test owner"], [admin, "Test admin"], [target, "Test player"]]) {
    await db.collection("players").doc(uid).set({ ...buildDefaultPlayerDocument(stamp), displayName: name,
      profileComplete: true, gender: "male", country: "Australia", region: "oceania", state: "Victoria", coins: 200 });
  }
  for (const [uid, role] of [[owner, "owner"], [admin, "admin"]]) {
    await db.collection("adminAccounts").doc(uid).set(buildAdminAccountDocument({ uid, role, assignedByUid: owner, now: stamp }));
  }
  const inventoryRef = db.collection("playerMarketInventories").doc(target);
  const historyRef = db.collection("players").doc(target).collection("adminHistory");
  await inventoryRef.set({ schemaVersion: 2, items: { wheat: 5, corn: 11, wheat_seed: 3, bingles_scarecrow: 0 } });
  const request = (uid, data = {}) => ({ auth: { uid, token: {} }, data: {
    targetUid: target, itemId: "wheat", direction: "grant", quantity: 5, ...data
  } });

  await t.test("owner grants wheat and records who changed it, before/after and reason", async () => {
    const result = await adjust(request(owner, { note: "Correct missing harvest" }));
    assert.equal(result.adjustment.previousQuantity, 5);
    assert.equal(result.adjustment.nextQuantity, 10);
    const items = (await inventoryRef.get()).data().items;
    assert.equal(items.wheat, 10); assert.equal(items.corn, 11); assert.equal(items.wheat_seed, 3);
    const rows = await historyRef.get();
    assert.equal(rows.size, 1);
    const log = rows.docs[0].data();
    assert.equal(log.actorUid, owner); assert.equal(log.actorName, "Test owner");
    assert.equal(log.note, "Correct missing harvest"); assert.equal(log.previousQuantity, 5); assert.equal(log.nextQuantity, 10);
    assert.equal((await db.collection("players").doc(target).get()).data().coins, 200);
  });
  await t.test("admin can remove items and grant supported zero-count account-bound items", async () => {
    const removed = await adjust(request(admin, { direction: "remove", quantity: 3 }));
    assert.equal(removed.adjustment.nextQuantity, 7);
    await adjust(request(admin, { itemId: "bingles_scarecrow", quantity: 1 }));
    const items = (await inventoryRef.get()).data().items;
    assert.equal(items.wheat, 7); assert.equal(items.bingles_scarecrow, 1);
    assert.equal((await historyRef.get()).size, 3);
  });
  await t.test("ordinary and disabled-admin accounts cannot modify inventory", async () => {
    await assert.rejects(adjust(request(target)), { code: "permission-denied" });
    await db.collection("adminAccounts").doc(admin).update({ enabled: false });
    await assert.rejects(adjust(request(admin)), { code: "permission-denied" });
    assert.equal((await inventoryRef.get()).data().items.wheat, 7);
    assert.equal((await historyRef.get()).size, 3);
  });
  await t.test("invalid item IDs, directions and amounts never change inventory", async () => {
    for (const data of [{ quantity: 0 }, { quantity: -1 }, { quantity: 1.5 }, { quantity: 10001 }, { itemId: "not-a-server-item" }, { direction: "set" }]) {
      await assert.rejects(adjust(request(owner, data)), { code: "invalid-argument" });
    }
    assert.equal((await inventoryRef.get()).data().items.wheat, 7);
    assert.equal((await historyRef.get()).size, 3);
  });
  await t.test("simultaneous admin grants do not lose quantities or history entries", async () => {
    await Promise.all([adjust(request(owner, { quantity: 1 })), adjust(request(owner, { quantity: 2 }))]);
    assert.equal((await inventoryRef.get()).data().items.wheat, 10);
    assert.equal((await historyRef.get()).size, 5);
    assert.equal((await db.collection("moderationEmailQueue").get()).size, 0, "inventory edits do not email the player");
  });
});
