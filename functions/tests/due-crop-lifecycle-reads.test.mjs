import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Timestamp } = require("firebase-admin/firestore");
const { readDueCropLifecycleStates: read } = require("../lib/infrastructure/dueCropLifecycleReads.js");
const { serializeSharedBasePinStateForStorage: serialize } = require("../lib/domain/world/sharedWorld.js");
const now = new Date("2026-09-08T12:00:00.000Z");
const day = 86_400_000;
const ago = days => new Date(now.getTime() - days * day);
const record = (id, plantedDays = 28, miracleDays = null) => ({ id, data: () => serialize({
  pinId: id, ownerUid: "test-owner", ownerName: "Test owner", ownerAvatarUrl: null,
  latitude: -38.45, longitude: 145.23, ownedAt: ago(60), updatedAt: ago(1),
  level: 1, replantEnabled: false,
  plant: { seedId: "corn_seed", plantedAt: ago(plantedDays), miracleGrownAt: miracleDays === null ? null : ago(miracleDays) }
}) });

function database(rows = []) {
  const calls = [];
  const fixture = { rows, calls, failure: null, collection(name) {
    assert.equal(name, "sharedBasePinStates");
    const query = (filters = [], field = null, cap = null) => ({
      where(key, operator, value) { return query([...filters, { key, operator, value }], field, cap); },
      orderBy(key, direction) { assert.equal(direction, "asc"); return query(filters, key, cap); },
      limit(value) { assert.ok(value > 0 && value <= 200); return query(filters, field, value); },
      async get() {
        assert.equal(filters.length, 2);
        assert.ok(filters.every(filter => filter.key === field));
        assert.deepEqual(filters.map(filter => filter.operator), [">=", "<="]);
        assert.equal(filters[0].value.toDate().toISOString(), "0001-01-01T00:00:00.000Z");
        if (fixture.failure === field) throw new Error("Synthetic query failure");
        const value = row => row.data().plant?.[field.split(".")[1]];
        const selected = fixture.rows.filter(row => value(row) instanceof Timestamp &&
          value(row).toMillis() >= filters[0].value.toMillis() &&
          value(row).toMillis() <= filters[1].value.toMillis())
          .sort((a, b) => value(a).toMillis() - value(b).toMillis() || a.id.localeCompare(b.id)).slice(0, cap);
        calls.push({ field, limit: cap, returned: selected.length });
        return { docs: selected };
      }
    });
    return query();
  } };
  return fixture;
}
const ids = rows => rows.map(row => row.id);

test("200 healthy crops require two empty queries and no transaction candidates", async () => {
  const db = database(Array.from({ length: 200 }, (_, i) => record(`healthy-${i}`, 20)));
  assert.deepEqual(await read(db, now), []);
  assert.equal(db.calls.length, 2);
  assert.equal(db.calls.reduce((sum, call) => sum + call.returned, 0), 0);
  // Document-read model only: each empty query has its minimum cost; no bill prediction.
  const oldDailyReads = 200 * 2 * 96;
  const newDailyReads = db.calls.reduce((sum, call) => sum + Math.max(1, call.returned), 0) * 96;
  assert.equal(oldDailyReads, 38_400);
  assert.equal(newDailyReads, 192);
});

test("normal and Miracle Grow crops expire exactly at their existing boundaries", async () => {
  const db = database([
    record("normal-due"), record("normal-still-harvestable", 28 - 1 / day),
    record("legacy-miracle-due", 8, 7), record("miracle-still-harvestable", 8, 7 - 1 / day),
    record("old-plant-recent-miracle", 40, 1), record("future", -1)
  ]);
  assert.deepEqual(ids(await read(db, now)), ["legacy-miracle-due", "normal-due"]);
});

test("backdated Miracle Grow found by both queries is returned only once", async () => {
  const db = database([record("miracle", 28, 7)]);
  assert.deepEqual(ids(await read(db, now)), ["miracle"]);
  assert.deepEqual(db.calls.map(call => call.returned), [1, 1]);
});

test("empty and malformed crops are skipped; a legacy normal crop without Miracle Grow date still expires", async () => {
  const legacy = record("legacy-normal").data();
  delete legacy.plant.miracleGrownAt;
  const broken = record("broken").data();
  broken.plant.seedId = "unknown_seed";
  const invalidOwner = record("invalid-owner").data();
  delete invalidOwner.ownerUid;
  const empty = record("empty").data();
  empty.plant = null;
  const db = database([legacy, broken, invalidOwner, empty].map(value => ({ id: value.pinId, data: () => value })));
  assert.deepEqual(ids(await read(db, now)), ["legacy-normal"]);
});

test("the combined result is bounded and ordered by actual expiry, with deterministic ties", async () => {
  const db = database([
    record("normal", 29), record("miracle-oldest", 10, 10),
    record("a-tie", 8, 8), record("z-tie", 8, 8)
  ]);
  assert.deepEqual(ids(await read(db, now, 3)), ["miracle-oldest", "a-tie", "normal"]);
  assert.ok(db.calls.every(call => call.limit === 3 && call.returned <= 3));
  const backlog = database(Array.from({ length: 450 }, (_, i) => record(`due-${i}`, 29, 8)));
  const result = await read(backlog, now);
  assert.equal(result.length, 200);
  assert.equal(new Set(ids(result)).size, 200);
  assert.ok(backlog.calls.every(call => call.returned === 200 && call.limit === 200));
});

test("either query failure propagates, and the next request can recover", async () => {
  for (const field of ["plant.plantedAt", "plant.miracleGrownAt"]) {
    const db = database([record("due")]);
    db.failure = field;
    await assert.rejects(read(db, now), /Synthetic query failure/);
    db.failure = null;
    assert.deepEqual(ids(await read(db, now)), ["due"]);
  }
});

test("crop changes are read fresh without lifecycle state caching", async () => {
  const db = database([record("crop")]);
  assert.deepEqual(ids(await read(db, now)), ["crop"]);
  db.rows = [record("crop", 0)];
  assert.deepEqual(await read(db, now), []);
  db.rows = [];
  assert.deepEqual(await read(db, now), []);
});

test("invalid limits and dates cannot launch broad queries", async () => {
  const db = database();
  for (const limit of [0, -1, 1.5, 201, Infinity, NaN]) {
    await assert.rejects(read(db, now, limit), /Invalid crop lifecycle/);
  }
  await assert.rejects(read(db, new Date(NaN)), /Invalid crop lifecycle/);
  assert.equal(db.calls.length, 0);
});
