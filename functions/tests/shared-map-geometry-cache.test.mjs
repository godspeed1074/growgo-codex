import test from "node:test";
import assert from "node:assert/strict";
import { gzipSync, gunzipSync } from "node:zlib";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const {
  createSharedMapGeometryCache, getMapGeometryCell, normalizeStaticMapGeometry,
  SHARED_MAP_GEOMETRY_VERSION, MAP_GEOMETRY_FRESH_MS, MAP_GEOMETRY_STALE_MS,
  EMPTY_MAP_GEOMETRY_FRESH_MS, MAX_MAP_GEOMETRY_BYTES
} = require("../lib/infrastructure/pins/sharedMapGeometryCache.js");
const { extractCanonicalPins, createBounds, isSharedMapCacheEnabled } = require("../lib/api/getNearbyBasePins.js");

const center = { latitude: -38.4537, longitude: 145.2381 };
const bounds = createBounds(center);
const startTime = Date.parse("2026-09-07T23:59:40Z");

function geometry() {
  return {
    elements: [
      {
        type: "way", id: 123456789,
        tags: { highway: "residential", name: "Unneeded road name" },
        geometry: [
          { lat: -38.465, lon: 145.2381 }, { lat: -38.435, lon: 145.2381 }
        ]
      },
      {
        type: "way", id: 123456790,
        tags: { highway: "motorway" },
        geometry: [
          { lat: -38.465, lon: 145.24 }, { lat: -38.435, lon: 145.24 }
        ]
      },
      {
        type: "way", id: 123456791,
        tags: { waterway: "stream" },
        geometry: [
          { lat: -38.465, lon: 145.2382 }, { lat: -38.435, lon: 145.2382 }
        ]
      }
    ]
  };
}

function harness(overrides = {}) {
  let time = startTime;
  const stored = new Map();
  const calls = { reads: 0, writes: 0, fetches: 0, preparations: [], events: [] };
  const deps = {
    now: () => time,
    read: async (key) => { calls.reads++; return stored.get(key); },
    write: async (key, value) => { calls.writes++; stored.set(key, value); },
    fetch: async () => { calls.fetches++; return geometry(); },
    extract: (payload, camera, viewport) => extractCanonicalPins(payload, camera, viewport),
    prepare: async (pins) => { calls.preparations.push(pins); },
    report: (event) => calls.events.push(event),
    ...overrides
  };
  return { stored, calls, deps, instance: () => createSharedMapGeometryCache(deps), advance: (ms) => { time += ms; } };
}

test("another server reuses one persisted map bundle with zero provider requests or pin registration reads", async () => {
  const h = harness();
  const first = await h.instance().get(center, bounds);
  assert.ok(first.pins.length > 0);
  assert.ok(first.pins.some((pin) => pin.type === "water"));
  assert.ok(first.pins.some((pin) => pin.type === "base"));
  const next = h.instance();
  assert.deepEqual(await next.get(center, bounds), first);
  assert.deepEqual(await next.get(center, bounds), first);
  assert.equal(h.calls.reads, 2);
  assert.equal(h.calls.writes, 1);
  assert.equal(h.calls.fetches, 1);
  assert.equal(h.calls.preparations.length, 1);
  assert.ok(h.calls.events.includes("shared_hit"));
  assert.ok(h.calls.events.includes("memory_hit"));
});

test("small pans keep exact canonical IDs, coordinates, water classification and viewport selection", async () => {
  const h = harness();
  const cache = h.instance();
  await cache.get(center, bounds);
  const camera = { ...center, latitude: center.latitude + 0.0015 };
  const viewport = createBounds(camera);
  assert.equal(getMapGeometryCell(camera).key, getMapGeometryCell(center).key);
  const result = await cache.get(camera, viewport);
  assert.deepEqual(result, extractCanonicalPins(normalizeStaticMapGeometry(geometry()), camera, viewport));
  assert.equal(h.calls.fetches, 1);
  const firstIds = new Set(h.calls.preparations[0].pins.map((pin) => pin.pinId));
  assert.ok(h.calls.preparations[1].pins.length > 0);
  assert.ok(h.calls.preparations[1].pins.every((pin) => !firstIds.has(pin.pinId)));
  assert.equal(h.calls.preparations[1].sources.length, 0);
});

test("fixed cells cover every view near cell edges, equator, poles and dateline", () => {
  for (const latitude of [-90, -89.9999, -38.45601, -38.456, -38.452001, -0.00001, 0, 0.004, 51.5, 89.9999, 90]) {
    for (const longitude of [-180, -179.9999, -0.00001, 0, 145.239999, 145.24, 179.9999, 180]) {
      const camera = { latitude, longitude };
      const cell = getMapGeometryCell(camera);
      const viewport = createBounds(camera);
      assert.ok(cell.bounds.south <= viewport.south && cell.bounds.north >= viewport.north);
      assert.ok(cell.bounds.west <= viewport.west && cell.bounds.east >= viewport.east);
      assert.match(cell.key, /^v1-\d+-\d+$/);
    }
  }
});

test("parallel requests on a cold server share one fetch and registration", async () => {
  const h = harness();
  const cache = h.instance();
  const results = await Promise.all(Array.from({ length: 12 }, () => cache.get(center, bounds)));
  results.forEach((result) => assert.deepEqual(result, results[0]));
  assert.equal(h.calls.fetches, 1);
  assert.equal(h.calls.writes, 1);
  assert.equal(h.calls.preparations.length, 1);
});

test("expiry refreshes geometry and capture evidence once; outage serves bounded stale geometry", async () => {
  const h = harness();
  const first = await h.instance().get(center, bounds);
  h.advance(MAP_GEOMETRY_FRESH_MS);
  await h.instance().get(center, bounds);
  assert.equal(h.calls.fetches, 2);
  const fetchedAt = JSON.parse(gunzipSync([...h.stored.values()][0].data)).fetchedAt;
  h.advance(MAP_GEOMETRY_FRESH_MS);
  h.deps.fetch = async () => { throw new Error("provider offline"); };
  assert.deepEqual(await h.instance().get(center, bounds), first);
  assert.ok(h.calls.events.includes("stale_fallback"));
  assert.equal(JSON.parse(gunzipSync([...h.stored.values()][0].data)).fetchedAt, fetchedAt);
  h.advance(MAP_GEOMETRY_STALE_MS);
  await assert.rejects(h.instance().get(center, bounds), /provider offline/);
});

test("empty geometry expires quickly and cannot mask an unavailable provider", async () => {
  const h = harness({ fetch: async () => ({ elements: [] }) });
  assert.equal((await h.instance().get(center, bounds)).pins.length, 0);
  h.advance(EMPTY_MAP_GEOMETRY_FRESH_MS);
  h.deps.fetch = async () => { throw new Error("offline"); };
  await assert.rejects(h.instance().get(center, bounds), /offline/);
});

test("a provider outage shares a short retry cooldown without renewing the geometry age", async () => {
  const h = harness();
  await h.instance().get(center, bounds);
  h.advance(MAP_GEOMETRY_FRESH_MS);
  let attempts = 0;
  h.deps.fetch = async () => { attempts++; throw new Error("offline"); };
  await h.instance().get(center, bounds);
  await h.instance().get(center, bounds);
  assert.equal(attempts, 1);
  assert.equal(JSON.parse(gunzipSync([...h.stored.values()][0].data)).fetchedAt, startTime);
  h.advance(60_000);
  await h.instance().get(center, bounds);
  assert.equal(attempts, 2);
});

test("HTTP-success provider timeout/partial responses are never cached", async () => {
  const h = harness({ fetch: async () => ({ elements: geometry().elements, remark: "runtime error: timed out" }) });
  await assert.rejects(h.instance().get(center, bounds), /Incomplete/);
  assert.equal(h.stored.size, 0);
  for (const payload of [{}, null, { elements: null }]) {
    assert.throws(() => normalizeStaticMapGeometry(payload), /Incomplete/);
  }
});

test("a corrupt, mismatched, future-dated or oversized record rebuilds safely", async () => {
  const h = harness();
  await h.instance().get(center, bounds);
  const key = getMapGeometryCell(center).key;
  const original = h.stored.get(key);
  const decoded = JSON.parse(gunzipSync(original.data));
  for (const damaged of [
    { ...original, version: 999 }, { ...original, cellKey: "other-area" },
    { ...original, data: Buffer.from("broken") },
    { ...original, data: Buffer.alloc(MAX_MAP_GEOMETRY_BYTES + 1) },
    { ...original, data: gzipSync(JSON.stringify({ ...decoded, fetchedAt: startTime + 1_000 })) },
    { ...original, data: gzipSync(JSON.stringify({ ...decoded, payload: null })) }
  ]) {
    h.stored.set(key, damaged);
    assert.ok((await h.instance().get(center, bounds)).pins.length > 0);
  }
  assert.equal(h.calls.fetches, 7);
});

test("cache storage failure leaves direct discovery usable", async () => {
  const h = harness({
    read: async () => { throw new Error("read unavailable"); },
    write: async () => { throw new Error("write unavailable"); }
  });
  const cache = h.instance();
  const result = await cache.get(center, bounds);
  assert.ok(result.pins.length > 0);
  assert.deepEqual(await cache.get(center, bounds), result);
  assert.equal(h.calls.fetches, 1);
  assert.ok(h.calls.events.includes("read_failed"));
  assert.ok(h.calls.events.includes("write_failed"));
});

test("failed authoritative registration never publishes a prepared cache bundle", async () => {
  const h = harness({ prepare: async () => { throw new Error("registration failed"); } });
  await assert.rejects(h.instance().get(center, bounds), /registration failed/);
  assert.equal(h.stored.size, 0);
  h.deps.prepare = async () => {};
  assert.ok((await h.instance().get(center, bounds)).pins.length > 0);
});

test("shared data strips player state and stays static across the UTC reset and fish cycle", async () => {
  const payload = geometry();
  payload.uid = "private-player";
  payload.capturedToday = true;
  payload.elements[0].fish = { active: true };
  payload.elements[0].plant = { level: 4 };
  const h = harness({ fetch: async () => payload });
  const result = await h.instance().get(center, bounds);
  h.advance(60_000); // A new UTC day/fish cycle must not be baked into geometry.
  assert.deepEqual(await h.instance().get(center, bounds), result);
  const json = gunzipSync([...h.stored.values()][0].data).toString();
  assert.doesNotMatch(json, /private-player|capturedToday|plant|fish|Unneeded road name/);
  assert.equal(JSON.parse(json).version, SHARED_MAP_GEOMETRY_VERSION);
});

test("rollback flag disables shared geometry and sparse value reads", () => {
  const previous = process.env.GROWGO_SHARED_MAP_CACHE_ENABLED;
  try {
    process.env.GROWGO_SHARED_MAP_CACHE_ENABLED = "false";
    assert.equal(isSharedMapCacheEnabled(), false);
    process.env.GROWGO_SHARED_MAP_CACHE_ENABLED = "true";
    assert.equal(isSharedMapCacheEnabled(), true);
  } finally {
    if (previous === undefined) delete process.env.GROWGO_SHARED_MAP_CACHE_ENABLED;
    else process.env.GROWGO_SHARED_MAP_CACHE_ENABLED = previous;
  }
});

test("50 concurrent failures share one lookup, not 50 sequential provider retries", async () => {
  let attempts = 0;
  const failure = new Error("provider offline");
  const h = harness({ fetch: async () => { attempts++; await delay(10); throw failure; } });
  const cache = h.instance();
  const results = await Promise.allSettled(Array.from({ length: 50 }, () => cache.get(center, bounds)));
  results.forEach((result) => {
    assert.equal(result.status, "rejected");
    assert.equal(result.reason, failure);
  });
  assert.equal(attempts, 1);
  assert.equal(h.calls.reads, 1);
  assert.equal(h.calls.writes, 0);
  assert.equal(h.calls.preparations.length, 0);
  await assert.rejects(cache.get(center, bounds), /offline/);
  assert.equal(attempts, 1, "immediate retries share a short cooldown");
  assert.ok(h.calls.events.includes("retry_cooldown"));
  h.advance(5_001);
  h.deps.fetch = async () => { attempts++; return geometry(); };
  assert.ok((await cache.get(center, bounds)).pins.length > 0);
  assert.equal(attempts, 2, "provider recovery is not permanently cached as an empty area");
});

test("concurrent different cameras in one cell each receive their own viewport", async () => {
  const h = harness();
  const cache = h.instance();
  const cameras = [center, { ...center, latitude: center.latitude + 0.0015 }, center];
  const results = await Promise.all(cameras.map((camera) => cache.get(camera, createBounds(camera))));
  cameras.forEach((camera, index) => {
    assert.equal(getMapGeometryCell(camera).key, getMapGeometryCell(center).key);
    assert.deepEqual(results[index], extractCanonicalPins(normalizeStaticMapGeometry(geometry()), camera, createBounds(camera)));
  });
  assert.notDeepEqual(results[0].pins, results[1].pins);
  assert.equal(h.calls.fetches, 1);
});

test("a hung cold cell times out all waiters, allows other cells and then recovers", async () => {
  let attempts = 0;
  let hungSignal;
  const coldCell = getMapGeometryCell(center);
  const h = harness({
    timeouts: { lookupMs: 150 },
    fetch: async (area, signal) => {
      attempts++;
      if (area.south === coldCell.bounds.south) {
        hungSignal = signal;
        return new Promise(() => {});
      }
      return geometry();
    }
  });
  const cache = h.instance();
  const resultsPromise = Promise.allSettled(Array.from({ length: 20 }, () => cache.get(center, bounds)));
  const otherCamera = { ...center, latitude: center.latitude + 0.02 };
  assert.ok(await cache.get(otherCamera, createBounds(otherCamera)));
  const results = await resultsPromise;
  assert.ok(results.every((result) => result.status === "rejected" && result.reason.name === "MapReadTimeoutError"));
  assert.equal(hungSignal.aborted, true);
  assert.equal(attempts, 2);
  h.advance(5_001);
  h.deps.fetch = async () => { attempts++; return geometry(); };
  assert.ok((await cache.get(center, bounds)).pins.length > 0);
  assert.equal(attempts, 3, "timed-out work did not leave a blocked pending entry");
});

test("a hanging refresh serves usable stale geometry on the shorter deadline without renewing its age", async () => {
  const h = harness({ timeouts: { lookupMs: 500, staleRefreshMs: 30 } });
  const first = await h.instance().get(center, bounds);
  h.advance(MAP_GEOMETRY_FRESH_MS);
  let finishFetch;
  let signal;
  h.deps.fetch = async (_, current) => {
    signal = current;
    return new Promise((resolve) => { finishFetch = resolve; });
  };
  const cache = h.instance();
  assert.deepEqual(await cache.get(center, bounds), first);
  assert.equal(signal.aborted, true);
  assert.ok(h.calls.events.includes("stale_fallback"));
  const record = () => JSON.parse(gunzipSync([...h.stored.values()][0].data));
  assert.equal(record().fetchedAt, startTime);
  const writes = h.calls.writes;
  finishFetch({ elements: [] });
  await delay(10);
  assert.deepEqual(await cache.get(center, bounds), first);
  assert.equal(h.calls.writes, writes, "late refresh cannot replace usable pins with an empty result");
  assert.equal(record().fetchedAt, startTime);
});

test("stalled cache reads and writes do not block direct discovery or the next memory hit", async () => {
  const h = harness({
    timeouts: { lookupMs: 500, cacheIoMs: 30 },
    read: () => new Promise(() => {}),
    write: () => new Promise(() => {})
  });
  const cache = h.instance();
  const result = await cache.get(center, bounds);
  assert.ok(result.pins.length > 0);
  assert.deepEqual(await cache.get(center, bounds), result);
  assert.equal(h.calls.fetches, 1);
  assert.equal(h.calls.preparations.length, 1);
  assert.ok(h.calls.events.includes("read_failed"));
  assert.ok(h.calls.events.includes("write_failed"));
});

test("late authoritative registration never publishes prepared cache data after the lookup expires", async () => {
  let finishPreparation;
  let signal;
  const h = harness({
    timeouts: { lookupMs: 100 },
    prepare: (_, current) => {
      signal = current;
      return new Promise((resolve) => { finishPreparation = resolve; });
    }
  });
  const cache = h.instance();
  await assert.rejects(cache.get(center, bounds), { name: "MapReadTimeoutError" });
  assert.equal(signal.aborted, true);
  finishPreparation();
  await delay(10);
  assert.equal(h.calls.writes, 0);
  assert.equal(h.stored.size, 0);
  h.deps.prepare = async () => {};
  assert.ok((await cache.get(center, bounds)).pins.length > 0);
  assert.equal(h.calls.fetches, 2);
});

test("interactive delivery serves a stale saved cell without any provider request or cache write", async () => {
  const h = harness();
  const first = await h.instance().get(center, bounds);
  h.advance(MAP_GEOMETRY_FRESH_MS + 1);
  h.deps.fetch = async () => { throw new Error("must not refresh inside foreground"); };
  const result = await h.instance().getForDelivery(center, bounds);
  assert.deepEqual(result.pins, first.pins);
  assert.deepEqual(result.sources, first.sources);
  assert.equal(result.delivery.refreshNeeded, true);
  assert.equal(result.delivery.fetchedAt, startTime);
  assert.equal(h.calls.writes, 1);
  assert.equal(h.calls.fetches, 1);
  assert.equal(h.calls.preparations.length, 1);
  assert.ok(h.calls.events.includes("immediate_hit"));
});

test("foreground is not blocked by an active refresh; the new snapshot cannot be overwritten by the old reader", async () => {
  const h = harness();
  const old = await h.instance().get(center, bounds);
  h.advance(MAP_GEOMETRY_FRESH_MS);
  let finish, started;
  const entered = new Promise(resolve => { started = resolve; });
  h.deps.fetch = () => { started(); return new Promise(resolve => { finish = resolve; }); };
  const cache = h.instance();
  const refreshing = cache.getForDelivery(center, bounds, true);
  await entered;
  const immediateResult = await cache.getForDelivery(center, bounds);
  assert.deepEqual(immediateResult.pins, old.pins);
  assert.equal(immediateResult.delivery.refreshNeeded, true);
  finish(geometry());
  const refreshed = await refreshing;
  assert.equal(refreshed.delivery.refreshNeeded, false);
  assert.equal(refreshed.delivery.fetchedAt, startTime + MAP_GEOMETRY_FRESH_MS);
  const fresh = await cache.getForDelivery(center, bounds);
  assert.equal(fresh.delivery.fetchedAt, refreshed.delivery.fetchedAt);
  assert.equal(JSON.parse(gunzipSync([...h.stored.values()][0].data)).fetchedAt, refreshed.delivery.fetchedAt);
});

test("delivery prepares newly exposed pins, and refuses unregistered or expired evidence", async () => {
  const h = harness();
  const cache = h.instance();
  await cache.get(center, bounds);
  const camera = { ...center, latitude: center.latitude + 0.0015 };
  const result = await cache.getForDelivery(camera, createBounds(camera));
  assert.deepEqual(result.pins, extractCanonicalPins(geometry(), camera, createBounds(camera)).pins);
  assert.equal(h.calls.preparations.length, 2);
  await cache.getForDelivery(camera, createBounds(camera));
  assert.equal(h.calls.preparations.length, 2, "verified new viewport hints are reused in memory");
  h.deps.prepare = async () => { throw new Error("registration failed"); };
  await assert.rejects(h.instance().getForDelivery(camera, createBounds(camera)), /registration failed/);
  h.advance(MAP_GEOMETRY_STALE_MS);
  h.deps.fetch = async () => { throw new Error("expired and offline"); };
  await assert.rejects(cache.getForDelivery(center, bounds), /expired and offline/);
});

test("cost baseline: sequential cold instances repeat newly exposed viewport preparation", async () => {
  const h = harness();
  await h.instance().get(center, bounds);
  const camera = { ...center, latitude: center.latitude + 0.0015 };
  const viewport = createBounds(camera);
  const initialWrites = h.calls.writes;
  const initialFetches = h.calls.fetches;
  const instances = 5;
  for (let i = 0; i < instances; i++) {
    const server = h.instance();
    const response = await server.getForDelivery(camera, viewport);
    assert.deepEqual(response.pins, extractCanonicalPins(geometry(), camera, viewport).pins);
    await server.getForDelivery(camera, viewport);
  }
  const repeated = h.calls.preparations.slice(1);
  assert.equal(repeated.length, instances, "one repeat per cold instance, not per warm request");
  assert.ok(repeated[0].pins.length > 0);
  for (const batch of repeated) assert.deepEqual(batch, repeated[0]);
  assert.equal(h.calls.writes, initialWrites, "hot-path hints were not persisted");
  assert.equal(h.calls.fetches, initialFetches, "provider geometry was already shared");
  // This is a baseline reproduction, not a fix or actual bill measurement.
});

function preparedHintHarness() {
  const h = harness({extract: (_, camera) => ({pins: Array.from({length:32}, (_,i) => ({
    pinId:`fixture-${camera.latitude}-${i}`,type:'base',latitude:camera.latitude,longitude:camera.longitude
  })),sources:[]})});
  let attempts=0;
  h.deps.persistPrepared = async (key, expected, next, signal) => {
    signal.throwIfAborted();attempts++;
    if (!h.stored.get(key)?.data.equals(expected.data)) return false;
    h.stored.set(key,next);return true;
  };
  return {...h,attempts:()=>attempts};
}
test('optional durable hints eliminate repeated preparation across sequential instances',async()=>{
  const h=preparedHintHarness();await h.instance().get(center,bounds);
  const camera={...center,latitude:center.latitude+0.0015};
  for(let i=0;i<5;i++)await h.instance().getForDelivery(camera,createBounds(camera));
  assert.equal(h.calls.preparations.length,2); // initial view + new view, not six
  assert.equal(h.attempts(),1);assert.equal(h.calls.fetches,1);
});
test('tiny preparation changes do not add persistence reads or writes',async()=>{
  const h=preparedHintHarness(),extract=h.deps.extract;
  h.deps.extract=(p,c,b)=>({...extract(p,c,b),pins:extract(p,c,b).pins.slice(0,1)});
  await h.instance().get(center,bounds);
  const camera={...center,latitude:center.latitude+0.0015};
  await h.instance().getForDelivery(camera,createBounds(camera));
  assert.equal(h.attempts(),0);
});
test('conditional hint persistence refuses a changed stored snapshot',async()=>{
  const h=preparedHintHarness();await h.instance().get(center,bounds);
  const original=h.deps.persistPrepared;
  let replacement;
  h.deps.persistPrepared=async(key,expected,next,signal)=>{
    const record=JSON.parse(gunzipSync(expected.data));record.fetchedAt+=1;
    replacement={...expected,data:gzipSync(JSON.stringify(record))};h.stored.set(key,replacement);
    return original(key,expected,next,signal);
  };
  const camera={...center,latitude:center.latitude+0.0015};
  await h.instance().getForDelivery(camera,createBounds(camera));
  assert.equal([...h.stored.values()][0],replacement);
});
test('failed preparation never saves durable hints; persistence failure remains recoverable',async()=>{
  const h=preparedHintHarness();await h.instance().get(center,bounds);
  const camera={...center,latitude:center.latitude+0.0015};
  const prepare=h.deps.prepare;h.deps.prepare=async()=>{throw Error('evidence failed');};
  await assert.rejects(h.instance().getForDelivery(camera,createBounds(camera)),/evidence failed/);
  assert.equal(h.attempts(),0);h.deps.prepare=prepare;
  h.deps.persistPrepared=async()=>{throw Error('conditional write failed');};
  await h.instance().getForDelivery(camera,createBounds(camera));
  await h.instance().getForDelivery(camera,createBounds(camera));
  assert.equal(h.calls.preparations.length,3);assert.ok(h.calls.events.includes('write_failed'));
});
test("empty or invalid delivery records cannot pretend an unprepared area is ready", async () => {
  const h = harness({ fetch: async () => ({ elements: [] }) });
  const cache = h.instance();
  const result = await cache.getForDelivery(center, bounds);
  assert.equal(result.delivery.expiresAt, startTime + EMPTY_MAP_GEOMETRY_FRESH_MS);
  h.advance(EMPTY_MAP_GEOMETRY_FRESH_MS);
  h.deps.fetch = async () => { throw new Error("offline"); };
  await assert.rejects(cache.getForDelivery(center, bounds), /offline/);
});

test("parallel interactive delivery shares one saved-cell read and never starts a refresh", async () => {
  const h = harness();
  await h.instance().get(center, bounds);
  h.advance(MAP_GEOMETRY_FRESH_MS);
  const cache = h.instance();
  const all = await Promise.all(Array.from({ length: 30 }, () => cache.getForDelivery(center, bounds)));
  assert.equal(h.calls.reads, 2);
  assert.equal(h.calls.fetches, 1);
  all.forEach(result => assert.deepEqual(result, all[0]));
});
