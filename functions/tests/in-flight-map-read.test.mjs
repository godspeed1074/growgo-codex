import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
const require = createRequire(import.meta.url);
const { createInFlightMapRead } = require("../lib/infrastructure/pins/inFlightMapRead.js");
const { MapReadTimeoutError } = require("../lib/infrastructure/pins/mapReadDeadline.js");
const scope = {};
const key = JSON.stringify([-38.45, 145.23]);

test("50 simultaneous fallback readers use one query and receive the same complete static result", async () => {
  const readShared = createInFlightMapRead(500);
  const rows = Array.from({ length: 350 }, (_, i) => ({ pinId: `pin-${i}`, type: "base" }));
  let reads = 0;
  const load = async () => { reads++; await delay(10); return { pins: rows, sources: [] }; };
  const results = await Promise.all(Array.from({ length: 50 }, () => readShared(scope, key, load)));
  assert.equal(reads, 1);
  assert.ok(results.every(result => result.pins.length === 350));
  results.forEach(result => assert.deepEqual(result, { pins: rows, sources: [] }));
});

test("settled results are not cached; later reads can see newly available pins", async () => {
  const readShared = createInFlightMapRead(500);
  let reads = 0;
  const load = async () => ++reads;
  assert.equal(await readShared(scope, key, load), 1);
  assert.equal(await readShared(scope, key, load), 2);
});

test("failure is shared only while in flight and never cached as a successful empty map", async () => {
  const readShared = createInFlightMapRead(500);
  const failure = new Error("database unavailable");
  let reads = 0;
  const results = await Promise.allSettled(Array.from({ length: 30 }, () => readShared(scope, key, async () => {
    reads++;
    throw failure;
  })));
  assert.equal(reads, 1);
  assert.ok(results.every(result => result.status === "rejected" && result.reason === failure));
  assert.deepEqual(await readShared(scope, key, async () => ({ pins: ["recovered"] })), { pins: ["recovered"] });
});

test("an empty result does not hide a subsequently populated area", async () => {
  const readShared = createInFlightMapRead(500);
  assert.deepEqual(await readShared(scope, key, async () => []), []);
  assert.deepEqual(await readShared(scope, key, async () => ["new-pin"]), ["new-pin"]);
});

test("nearby-but-different cameras and different databases never share a read", async () => {
  const readShared = createInFlightMapRead(500);
  let reads = 0;
  const load = async () => ++reads;
  const results = await Promise.all([
    readShared(scope, key, load),
    readShared(scope, JSON.stringify([-38.4500001, 145.23]), load),
    readShared(scope, JSON.stringify([-38.45, 145.2300001]), load),
    readShared({}, key, load)
  ]);
  assert.equal(reads, 4);
  assert.equal(new Set(results).size, 4);
});

test("a stalled read times out all waiters and does not leave the area permanently blocked", async () => {
  const readShared = createInFlightMapRead(30);
  let reads = 0;
  const results = await Promise.allSettled(Array.from({ length: 20 }, () => readShared(scope, key, () => {
    reads++;
    return new Promise(() => {});
  })));
  assert.equal(reads, 1);
  assert.ok(results.every(result => result.reason instanceof MapReadTimeoutError));
  assert.equal(await readShared(scope, key, async () => "recovered"), "recovered");
});

test("late completion of an expired read cannot clear or overwrite the replacement read", async () => {
  const readShared = createInFlightMapRead(100);
  let finishOld;
  const old = readShared(scope, key, () => new Promise(resolve => { finishOld = resolve; }));
  await assert.rejects(old, MapReadTimeoutError);
  let finishCurrent;
  const current = readShared(scope, key, () => new Promise(resolve => { finishCurrent = resolve; }));
  await Promise.resolve();
  await Promise.resolve();
  finishOld("old");
  await delay(0);
  const joined = readShared(scope, key, async () => assert.fail("must join replacement"));
  finishCurrent("new");
  assert.equal(await current, "new");
  assert.equal(await joined, "new");
});

test("late rejection after timeout is observed without an unhandled rejection", async () => {
  const readShared = createInFlightMapRead(30);
  let rejectOld;
  await assert.rejects(readShared(scope, key, () => new Promise((_, reject) => { rejectOld = reject; })), MapReadTimeoutError);
  rejectOld(new Error("late failure"));
  await delay(0);
  assert.equal(await readShared(scope, key, async () => 1), 1);
});

test("bounded memory does not evict a running shared read or disable other areas", async () => {
  const readShared = createInFlightMapRead(500, 1);
  let finish;
  const active = readShared(scope, key, () => new Promise(resolve => { finish = resolve; }));
  assert.equal(await readShared(scope, "other-area", async () => "other"), "other");
  const joined = readShared(scope, key, async () => assert.fail("active read must not be evicted"));
  finish("original");
  assert.equal(await active, "original");
  assert.equal(await joined, "original");
});
