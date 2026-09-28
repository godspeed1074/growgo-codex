import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parseSafeFirestoreEmulatorHost } = require("../lib/infrastructure/pins/firestoreEmulatorHost.js");

test("local Firebase: due-only crop maintenance preserves lifecycle and seed transactions", async (t) => {
  const host = parseSafeFirestoreEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
  if (!host) { t.skip("Requires localhost Firestore; never connects to a cloud project."); return; }
  process.env.FIRESTORE_EMULATOR_HOST = host.normalizedHostPort;
  process.env.GCLOUD_PROJECT = "demo-growgo-crop-maintenance";
  const { initializeApp, deleteApp } = require("firebase-admin/app");
  const { getFirestore } = require("firebase-admin/firestore");
  const app = initializeApp({ projectId: "demo-growgo-crop-maintenance" }, `crop-maintenance-${process.pid}`);
  const db = getFirestore(app);
  t.after(async () => { await db.terminate(); await deleteApp(app); });
  const { advanceCropLifecyclesAt } = require("../lib/api/advanceCropLifecycles.js");
  const { readMarketInventory } = require("../lib/domain/market/marketCatalog.js");
  const { serializeSharedBasePinStateForStorage: serialize, sharedWorldDocumentId } = require("../lib/domain/world/sharedWorld.js");
  const day = 86_400_000;
  const now = new Date("2026-09-08T12:00:00.000Z");
  const ago = days => new Date(now.getTime() - days * day);
  const plot = (id, changes = {}) => ({
    pinId: id, ownerUid: "crop-owner", ownerName: "Crop test", ownerAvatarUrl: null,
    latitude: -38.45, longitude: 145.23, ownedAt: ago(60), updatedAt: ago(1),
    level: 1, replantEnabled: false,
    plant: { seedId: "corn_seed", plantedAt: ago(1), miracleGrownAt: null }, ...changes
  });
  const plotRef = id => db.collection("sharedBasePinStates").doc(sharedWorldDocumentId(id));
  const seed = async plots => {
    for (let offset = 0; offset < plots.length; offset += 400) {
      const batch = db.batch();
      plots.slice(offset, offset + 400).forEach(state => batch.set(plotRef(state.pinId), serialize(state)));
      await batch.commit();
    }
  };
  // Only these two collections in the validated synthetic emulator are cleared.
  const reset = () => Promise.all([
    db.recursiveDelete(db.collection("sharedBasePinStates")),
    db.recursiveDelete(db.collection("playerMarketInventories"))
  ]);

  await t.test("200 growing crops open no maintenance transactions", async (s) => {
    await reset();
    await seed(Array.from({ length: 200 }, (_, i) => plot(`young-${i}`)));
    let transactions = 0;
    const original = db.runTransaction.bind(db);
    s.mock.method(db, "runTransaction", (...args) => { transactions++; return original(...args); });
    assert.deepEqual(await advanceCropLifecyclesAt(now), { replanted: 0, cleared: 0, skipped: 0 });
    assert.equal(transactions, 0, "young crops must not be reread inside transactions every 15 minutes");
    assert.equal((await plotRef("young-0").get()).data().plant.seedId, "corn_seed");
  });

  await t.test("200 younger normal crops cannot hide an expired legacy Miracle Grow crop", async () => {
    await reset();
    await seed([
      ...Array.from({ length: 200 }, (_, i) => plot(`growing-${i}`, {
        plant: { seedId: "corn_seed", plantedAt: ago(20), miracleGrownAt: null }
      })),
      plot("legacy-miracle-due", {
        plant: { seedId: "wheat_seed", plantedAt: ago(8), miracleGrownAt: ago(7) }
      })
    ]);
    const result = await advanceCropLifecyclesAt(now);
    assert.equal(result.cleared, 1);
    assert.equal((await plotRef("legacy-miracle-due").get()).data().plant, null);
    assert.ok((await plotRef("growing-0").get()).data().plant);
  });

  await t.test("normal and Miracle Grow expiry preserve harvest boundaries, ownership and seed balances", async () => {
    await reset();
    const inventoryRef = db.collection("playerMarketInventories").doc("crop-owner");
    await inventoryRef.set({ schemaVersion: 1, items: {
      corn_seed: 2, sugar_cane_seed: 1, wheat_seed: 2, tomato_seed: 0, cocoa_bean_seed: 5, corn: 11
    } });
    const crops = [
      plot("normal-replant", { replantEnabled: true, plant: { seedId: "corn_seed", plantedAt: ago(28), miracleGrownAt: null } }),
      plot("miracle-replant", { replantEnabled: true, plant: { seedId: "sugar_cane_seed", plantedAt: ago(28), miracleGrownAt: ago(7) } }),
      plot("legacy-miracle-replant", { replantEnabled: true, plant: { seedId: "wheat_seed", plantedAt: ago(8), miracleGrownAt: ago(7) } }),
      plot("no-seeds", { replantEnabled: true, plant: { seedId: "tomato_seed", plantedAt: ago(28), miracleGrownAt: null } }),
      plot("replant-disabled", { plant: { seedId: "cocoa_bean_seed", plantedAt: ago(28), miracleGrownAt: null } }),
      plot("legacy-normal", { plant: { seedId: "corn_seed", plantedAt: ago(28), miracleGrownAt: null } }),
      plot("normal-active", { plant: { seedId: "corn_seed", plantedAt: new Date(ago(28).getTime() + 1), miracleGrownAt: null } }),
      plot("miracle-active", { plant: { seedId: "corn_seed", plantedAt: ago(8), miracleGrownAt: new Date(ago(7).getTime() + 1) } }),
      plot("old-plant-fresh-miracle", { plant: { seedId: "corn_seed", plantedAt: ago(40), miracleGrownAt: ago(1) } }),
      plot("future", { plant: { seedId: "corn_seed", plantedAt: ago(-1), miracleGrownAt: null } }),
      plot("empty", { plant: null })
    ];
    await seed(crops);
    const legacy = serialize(crops.find(crop => crop.pinId === "legacy-normal"));
    delete legacy.plant.miracleGrownAt;
    await plotRef("legacy-normal").set(legacy);
    const malformed = serialize(plot("malformed", { plant: { seedId: "corn_seed", plantedAt: ago(40), miracleGrownAt: null } }));
    malformed.plant.seedId = "unsupported_seed";
    await plotRef("malformed").set(malformed);
    const preservedIds = ["normal-active", "miracle-active", "old-plant-fresh-miracle", "future", "empty", "malformed"];
    const before = await Promise.all(preservedIds.map(async id => (await plotRef(id).get()).data()));

    assert.deepEqual(await advanceCropLifecyclesAt(now), { replanted: 3, cleared: 3, skipped: 0 });
    for (const id of ["normal-replant", "miracle-replant", "legacy-miracle-replant"]) {
      const value = (await plotRef(id).get()).data();
      assert.equal(value.plant.plantedAt.toMillis(), now.getTime());
      assert.equal(value.plant.miracleGrownAt, null);
      assert.equal(value.plant.seedId, crops.find(crop => crop.pinId === id).plant.seedId);
      assert.equal(value.ownerUid, "crop-owner");
      assert.equal(value.ownerName, "Crop test");
      assert.equal(value.latitude, -38.45);
      assert.equal(value.longitude, 145.23);
      assert.equal(value.replantEnabled, true);
    }
    for (const id of ["no-seeds", "replant-disabled", "legacy-normal"]) {
      assert.equal((await plotRef(id).get()).data().plant, null);
    }
    assert.deepEqual((await inventoryRef.get()).data().items, readMarketInventory({ items: {
      corn_seed: 1, sugar_cane_seed: 0, wheat_seed: 1, tomato_seed: 0, cocoa_bean_seed: 5, corn: 11
    } }));
    assert.deepEqual(await Promise.all(preservedIds.map(async id => (await plotRef(id).get()).data())), before);
    const balance = (await inventoryRef.get()).data();
    assert.deepEqual(await advanceCropLifecyclesAt(now), { replanted: 0, cleared: 0, skipped: 0 });
    assert.deepEqual((await inventoryRef.get()).data(), balance);
  });

  await t.test("simultaneous maintenance runs consume only one seed per expired plot", async () => {
    await reset();
    await seed([plot("concurrent", { replantEnabled: true, plant: { seedId: "corn_seed", plantedAt: ago(28), miracleGrownAt: null } })]);
    const inventoryRef = db.collection("playerMarketInventories").doc("crop-owner");
    await inventoryRef.set({ schemaVersion: 1, items: { corn_seed: 2 } });
    const results = await Promise.all([advanceCropLifecyclesAt(now), advanceCropLifecyclesAt(now)]);
    assert.equal(results.reduce((sum, result) => sum + result.replanted, 0), 1);
    assert.equal(results.reduce((sum, result) => sum + result.cleared, 0), 0);
    assert.equal((await inventoryRef.get()).data().items.corn_seed, 1);
    assert.equal((await plotRef("concurrent").get()).data().plant.plantedAt.toMillis(), now.getTime());
  });

  await t.test("a crop changed after candidate selection is rechecked before any seed is consumed", async (s) => {
    await reset();
    await seed([plot("race", { replantEnabled: true, plant: { seedId: "corn_seed", plantedAt: ago(28), miracleGrownAt: null } })]);
    const inventoryRef = db.collection("playerMarketInventories").doc("crop-owner");
    await inventoryRef.set({ schemaVersion: 1, items: { corn_seed: 2 } });
    const original = db.runTransaction.bind(db);
    let changed = false;
    s.mock.method(db, "runTransaction", async (...args) => {
      if (!changed) {
        changed = true;
        await seed([plot("race", { replantEnabled: true, plant: { seedId: "wheat_seed", plantedAt: now, miracleGrownAt: null } })]);
      }
      return original(...args);
    });
    assert.deepEqual(await advanceCropLifecyclesAt(now), { replanted: 0, cleared: 0, skipped: 1 });
    assert.equal((await inventoryRef.get()).data().items.corn_seed, 2);
    assert.equal((await plotRef("race").get()).data().plant.seedId, "wheat_seed");
  });

  await t.test("an expired backlog advances at most 200 plots per run and continues next time", async () => {
    await reset();
    await seed(Array.from({ length: 205 }, (_, i) => plot(`backlog-${i}`, {
      plant: { seedId: "corn_seed", plantedAt: ago(29), miracleGrownAt: ago(8) }
    })));
    assert.deepEqual(await advanceCropLifecyclesAt(now), { replanted: 0, cleared: 200, skipped: 0 });
    assert.deepEqual(await advanceCropLifecyclesAt(now), { replanted: 0, cleared: 5, skipped: 0 });
    assert.deepEqual(await advanceCropLifecyclesAt(now), { replanted: 0, cleared: 0, skipped: 0 });
  });
});
