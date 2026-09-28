import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { readSharedCache } = require("../lib/infrastructure/sharedReadCache.js");
const { createPlayerDailyCaptureCache } = require("../lib/infrastructure/pins/playerDailyCaptureCache.js");
const { personalizeMarketDirectory } = require("../lib/api/farmerMarkets.js");
const { readMapViewport } = require("../lib/domain/world/mapDirectoryReads.js");

function cacheHarness() {
  const data = new Map();
  const counts = { reads: 0, writes: 0, loads: 0 };
  let clock = 1000;
  const db = { collection: () => ({ doc: (key) => ({
    get: async () => { counts.reads++; return { data: () => data.get(key) }; },
    set: async (value) => { counts.writes++; data.set(key, value); }
  }) }) };
  const params = { db, key: "board", ttlMs: 1000, now: () => clock,
    validate: (value) => Array.isArray(value) && value.every(Number.isFinite),
    load: async () => { counts.loads++; return [counts.loads]; } };
  return { db, params, data, counts, time: (value) => { clock = value; } };
}

test("50 simultaneous readers coalesce; later readers reuse one compressed source snapshot", async () => {
  const h = cacheHarness();
  const values = await Promise.all(Array.from({ length: 50 }, () => readSharedCache(h.params)));
  assert.ok(values.every((value) => value.value[0] === 1));
  assert.deepEqual(h.counts, { reads: 1, writes: 1, loads: 1 });
  assert.equal((await readSharedCache(h.params)).value[0], 1);
  assert.deepEqual(h.counts, { reads: 2, writes: 1, loads: 1 });
  assert.ok(Buffer.isBuffer([...h.data.values()][0].data));
});

test("expiry and server revision changes invalidate snapshots without sliding their lifetime", async () => {
  const h = cacheHarness();
  const first = await readSharedCache({ ...h.params, revision: "day-1" });
  h.time(1900);
  assert.equal((await readSharedCache({ ...h.params, revision: "day-1" })).expiresAt, first.expiresAt);
  assert.equal((await readSharedCache({ ...h.params, revision: "day-2" })).value[0], 2);
  h.time(2900);
  assert.equal((await readSharedCache({ ...h.params, revision: "day-2" })).value[0], 3);
});

test("corrupt, future-dated, wrong-key and oversize cache records rebuild safely", async () => {
  const h = cacheHarness();
  for (const mutate of [
    (r) => { r.data = Buffer.from("broken"); },
    (r) => { r.loadedAt = 9000; r.expiresAt = 10000; },
    (r) => { r.key = "another-player"; },
    (r) => { r.data = Buffer.alloc(700001); }
  ]) {
    await readSharedCache(h.params);
    mutate([...h.data.values()][0]);
    const before = h.counts.loads;
    await readSharedCache(h.params);
    assert.equal(h.counts.loads, before + 1);
  }
});

test("cache read/write failures preserve source reads; a source failure is not hidden by expired data", async () => {
  const h = cacheHarness();
  h.db.collection = () => ({ doc: () => ({ get: async () => { throw Error("offline cache"); }, set: async () => { throw Error("full cache"); } }) });
  assert.deepEqual((await readSharedCache(h.params)).value, [1]);
  await assert.rejects(readSharedCache({ ...h.params, load: async () => { throw Error("source unavailable"); } }), /source unavailable/);
});

test("rollback reads the source without reading or writing shared cache data", async () => {
  const h = cacheHarness();
  await readSharedCache({ ...h.params, enabled: false });
  assert.deepEqual(h.counts, { reads: 0, writes: 0, loads: 1 });
});

function captureHarness() {
  let reads = 0;
  let documents = 0;
  const rows = new Map();
  const db = { collection: () => ({ doc: (uid) => ({ collection: () => {
    const query = (ids = []) => ({
      where: (field, op, value) => {
        assert.equal(field, "pinId");
        assert.equal(op, "in");
        assert.ok(value.length > 0 && value.length <= 30);
        return query(value);
      },
      get: async () => {
        reads++;
        const docs = (rows.get(uid) ?? []).filter((r) => ids.includes(r.pinId)).map((r) => ({ id: r.id, data: () => r }));
        documents += docs.length;
        return { docs, size: docs.length };
      }
    });
    return query();
  } }) }) };
  return { db, rows, reads: () => reads, documents: () => documents };
}

test("daily capture reuse is isolated by player and invalidated by commit revision or UTC reset", async () => {
  const h = captureHarness();
  const read = createPlayerDailyCaptureCache();
  const params = { db: h.db, uid: "a", day: "2026-09-07", pinIds: ["pin-1", "pin-2"], revision: "commit-1", now: Date.parse("2026-09-07T23:59:40Z"), enabled: true };
  h.rows.set("a", [{ id: "1", pinId: "pin-1", captureDay: params.day }]);
  assert.deepEqual([...(await read(params)).ids], ["pin-1"]);
  await read(params);
  assert.equal(h.reads(), 1);
  assert.equal((await read({ ...params, uid: "b" })).ids.size, 0);
  h.rows.set("a", [{ id: "2", pinId: "pin-2", captureDay: params.day }]);
  assert.deepEqual([...(await read({ ...params, revision: "commit-2" })).ids], ["pin-2"]);
  assert.equal((await read({ ...params, now: Date.parse("2026-09-08T00:00:00Z"), day: "2026-09-08" })).ids.size, 0);
});

test("busy players read only map pins, reuse identical selections and refresh on expiry or bypass", async () => {
  const h = captureHarness();
  const read = createPlayerDailyCaptureCache();
  const params = { db: h.db, uid: "busy", day: "2026-09-07", pinIds: Array.from({length: 61}, (_, i) => `pin-${i}`), revision: "v1", now: Date.parse("2026-09-07T12:00:00Z"), enabled: true };
  h.rows.set("busy", Array.from({ length: 1201 }, (_, i) => ({ id: String(i).padStart(5, "0"), pinId: `pin-${i}`, captureDay: params.day })));
  assert.equal((await read(params)).ids.size, 61);
  assert.equal(h.documents(), 61);
  assert.equal(h.reads(), 3);
  for (let i = 0; i < 20; i++) assert.equal((await read({...params, pinIds: [...params.pinIds].reverse()})).ids.size, 61);
  assert.equal(h.reads(), 3);
  await read({ ...params, now: params.now + 90_000 });
  assert.equal(h.reads(), 6);
  await read({ ...params, enabled: false });
  assert.equal(h.reads(), 9);
  assert.deepEqual([...(await read({...params, pinIds: ["pin-1200"]})).ids], ["pin-1200"]);
  assert.equal(h.documents(), 184);
  assert.equal((await read({...params, pinIds: []})).ids.size, 0);
  assert.equal(h.reads(), 10);
});

test("repeated capture revisions never reread the offscreen daily history", async () => {
  const h = captureHarness();
  const read = createPlayerDailyCaptureCache();
  const params = { db: h.db, uid: "a", day: "2026-09-07", pinIds: ["pin-4999", "old-pin"], now: Date.parse("2026-09-07T12:00:00Z"), enabled: true };
  h.rows.set("a", [...Array.from({length: 5000}, (_, i) => ({pinId: `pin-${i}`, captureDay: params.day})), {pinId: "old-pin", captureDay: "2026-09-06"}]);
  for (let i = 0; i < 20; i++) {
    assert.deepEqual([...(await read({...params, revision: `commit-${i}`})).ids], ["pin-4999"]);
  }
  assert.equal(h.documents(), 40); // Not 100,000 daily-history documents.
});

test("failed capture queries are not cached as uncaptured and concurrent requests share work", async () => {
  const read = createPlayerDailyCaptureCache();
  let calls = 0;
  const db = {collection: () => ({doc: () => ({collection: () => ({where: () => ({get: async () => {
    calls++;
    if (calls === 1) throw new Error("unavailable");
    return {docs: [{data: () => ({pinId: "p", captureDay: "2026-09-07"})}]};
  }})})})})};
  const params = {db, uid: "a", day: "2026-09-07", pinIds: ["p", "p"], revision: "1", now: Date.parse("2026-09-07T12:00:00Z"), enabled: true};
  await assert.rejects(read(params), /unavailable/);
  const results = await Promise.all([read(params), read(params)]);
  assert.equal(calls, 2);
  for (const result of results) assert.deepEqual([...result.ids], ["p"]);
});

test("market catalog never shares a viewer's RSVP/check-in/host state and expires on time", () => {
  const market = { id: "market", name: "Market", startsAt: "2026-09-07T12:00:00Z", endsAt: "2026-09-07T16:00:00Z", tier: 1,
    isHost: true, checkedIn: true, willAttend: true, status: "upcoming", tierUpgradeAvailable: true };
  const rows = [{ market, hostUid: "host" }];
  const viewer = { uid: "guest", now: new Date("2026-09-07T11:59:59Z"), checkedInMarketIds: new Set(), willAttendMarketIds: new Set() };
  const guest = personalizeMarketDirectory(rows, viewer)[0];
  assert.equal(guest.isHost, false); assert.equal(guest.checkedIn, false); assert.equal(guest.willAttend, false);
  assert.equal("hostUid" in guest, false);
  assert.equal(personalizeMarketDirectory(rows, { ...viewer, uid: "host" })[0].willAttend, true);
  const atStart = personalizeMarketDirectory(rows, { ...viewer, uid: "host", now: new Date(market.startsAt) })[0];
  assert.equal(atStart.status, "active"); assert.equal(atStart.tierUpgradeAvailable, false);
  assert.equal(personalizeMarketDirectory(rows, { ...viewer, now: new Date(market.endsAt) }).length, 0);
  assert.equal(market.status, "upcoming"); // Caller-specific overlays must not mutate shared rows.
});

test("viewport validation allows the dateline, preserves legacy calls and rejects malformed bounds", () => {
  assert.equal(readMapViewport(undefined), null);
  assert.deepEqual(readMapViewport({ north: 10, south: -10, west: 179, east: -179 }), { north: 10, south: -10, west: 179, east: -179 });
  assert.throws(() => readMapViewport({ north: 1, south: 2, west: 0, east: 1 }));
  assert.throws(() => readMapViewport({ north: 10, south: -10, west: 0, east: Infinity }));
  assert.throws(() => readMapViewport({ north: 10, south: -10, west: 0, east: 1, uid: "other" }));
});
