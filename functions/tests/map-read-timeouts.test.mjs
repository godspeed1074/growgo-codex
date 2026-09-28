import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { getEventListeners } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const require = createRequire(import.meta.url);
const { withMapReadDeadline, waitForMapOperation, MapReadTimeoutError } = require("../lib/infrastructure/pins/mapReadDeadline.js");
const { createNearbyMapProvider, fetchNearbyMapGeometry, MAP_PROVIDER_TOTAL_MS, MAP_PROVIDER_ATTEMPT_MS, MAP_PROVIDER_BACKUP_DELAY_MS } = require("../lib/infrastructure/pins/nearbyMapProvider.js");
const { MAP_GEOMETRY_LOOKUP_MS, normalizeStaticMapGeometry } = require("../lib/infrastructure/pins/sharedMapGeometryCache.js");
const never = () => new Promise(() => {});
const geometry = { elements: [] };
const response = (payload = geometry) => ({ ok: true, json: async () => payload });
const options = (fetch, overrides = {}) => ({
  endpoints: ["https://first.test", "https://second.test", "https://third.test"],
  body: "fixture query", userAgent: "GrowGo-test", normalize: normalizeStaticMapGeometry,
  totalMs: 500, attemptMs: 30, fetch, ...overrides
});

test("production budgets leave room before the live 60-second request limit", () => {
  assert.equal(MAP_PROVIDER_ATTEMPT_MS, 8_000);
  assert.equal(MAP_PROVIDER_BACKUP_DELAY_MS, 1_500);
  assert.equal(MAP_PROVIDER_TOTAL_MS, 20_000);
  assert.equal(MAP_GEOMETRY_LOOKUP_MS, 30_000);
});

test("a non-cooperative operation times out, aborts its signal and removes its listener", async () => {
  let signal;
  await assert.rejects(withMapReadDeadline(30, (current) => { signal = current; return never(); }), MapReadTimeoutError);
  assert.equal(signal.aborted, true);
  assert.equal(getEventListeners(signal, "abort").length, 0);
});

test("an already cancelled request starts no work; successful work cleans up parent listeners", async () => {
  const parent = new AbortController();
  const reason = new Error("caller stopped");
  parent.abort(reason);
  let calls = 0;
  await assert.rejects(withMapReadDeadline(100, async () => { calls++; }, parent.signal), (error) => error === reason);
  assert.equal(calls, 0);
  const live = new AbortController();
  assert.equal(await withMapReadDeadline(100, async () => 42, live.signal), 42);
  assert.equal(getEventListeners(live.signal, "abort").length, 0);
});

test("late database rejection is observed after the caller has stopped waiting", async () => {
  const controller = new AbortController();
  let rejectOperation;
  const work = waitForMapOperation(controller.signal, () => new Promise((_, reject) => { rejectOperation = reject; }));
  await Promise.resolve();
  controller.abort(new Error("cancelled"));
  await assert.rejects(work, /cancelled/);
  rejectOperation(new Error("late database rejection"));
  await delay(0); // node:test also fails if this becomes an unhandled rejection.
  assert.equal(getEventListeners(controller.signal, "abort").length, 0);
});

test("a hanging first provider is aborted and the next provider can succeed", async () => {
  const calls = [];
  const result = await fetchNearbyMapGeometry(options(async (url, request) => {
    calls.push({ url, request });
    return calls.length === 1 ? never() : response();
  }));
  assert.deepEqual(result, geometry);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].request.signal.aborted, true);
  assert.equal(calls[0].request.method, "POST");
  assert.equal(calls[0].request.body, "fixture query");
  assert.equal(calls[0].request.headers["user-agent"], "GrowGo-test");
});

test("the time budget includes a hanging response body; late payloads are not normalized", async () => {
  let finishBody;
  let calls = 0;
  const normalized = [];
  const result = await fetchNearbyMapGeometry(options(async () => {
    calls++;
    return calls === 1
      ? { ok: true, json: () => new Promise((resolve) => { finishBody = resolve; }) }
      : response();
  }, { normalize: (payload) => { normalized.push(payload); return payload; } }));
  assert.deepEqual(result, geometry);
  finishBody({ elements: [], late: true });
  await delay(0);
  assert.deepEqual(normalized, [geometry]);
  assert.equal(calls, 2);
});

test("the total deadline stops the mirror loop even if every provider ignores cancellation", async () => {
  const signals = [];
  await assert.rejects(fetchNearbyMapGeometry(options(async (_, request) => {
    signals.push(request.signal);
    return never();
  }, { totalMs: 75, attemptMs: 50 })), MapReadTimeoutError);
  assert.equal(signals.length, 2);
  assert.ok(signals.every((signal) => signal.aborted));
  await delay(70);
  assert.equal(signals.length, 2, "no third provider starts after total timeout");
});

test("a parent cancellation prevents any further provider attempts", async () => {
  const parent = new AbortController();
  let calls = 0;
  await assert.rejects(fetchNearbyMapGeometry(options(async () => {
    calls++;
    parent.abort(new Error("stale geometry is ready"));
    return never();
  }, { signal: parent.signal })), /stale geometry is ready/);
  await delay(40);
  assert.equal(calls, 1);
});

test("HTTP errors close unused bodies and incomplete success payloads try another mirror", async () => {
  let calls = 0;
  let closed = false;
  const result = await fetchNearbyMapGeometry(options(async () => {
    calls++;
    if (calls === 1) return { ok: false, body: { cancel: async () => { closed = true; } } };
    if (calls === 2) return response({ elements: [], remark: "runtime error: partial response" });
    return response();
  }));
  assert.deepEqual(result, geometry);
  assert.equal(calls, 3);
  assert.equal(closed, true);
});

test("failed providers reject instead of returning a successful empty map", async () => {
  await assert.rejects(fetchNearbyMapGeometry(options(async () => { throw new Error("offline"); })), /No map provider/);
});

test("short stale refreshes move past a known stalled mirror next time; primary can recover", async () => {
  let now = 1_000;
  const provider = createNearbyMapProvider(() => now, 60_000);
  const calls = [];
  let primaryHealthy = false;
  const transport = async (url) => {
    calls.push(url);
    if (url === "https://first.test" && !primaryHealthy) return never();
    return response();
  };
  // The stale-cache deadline is intentionally shorter than a provider attempt.
  await assert.rejects(withMapReadDeadline(30, (signal) => provider(options(transport, { signal, attemptMs: 200 }))), MapReadTimeoutError);
  await delay(0);
  assert.deepEqual(await provider(options(transport)), geometry);
  assert.deepEqual(calls, ["https://first.test", "https://second.test"]);
  now += 60_001;
  primaryHealthy = true;
  assert.deepEqual(await provider(options(transport)), geometry);
  assert.equal(calls.at(-1), "https://second.test", "keep the known working mirror first briefly");
  now += 300_001;
  assert.deepEqual(await provider(options(transport)), geometry);
  assert.equal(calls.at(-1), "https://first.test", "cooldown does not permanently exclude a recovered mirror");
});

test("delayed backup wins without waiting for the first mirror's full timeout", async () => {
  const calls = [], failures = [];
  const value = await fetchNearbyMapGeometry(options(async (url, request) => {
    calls.push({ url, signal: request.signal });
    return calls.length === 1 ? never() : response();
  }, { attemptMs: 400, backupDelayMs: 10, onAttemptFailure: endpoint => failures.push(endpoint) }));
  assert.deepEqual(value, geometry);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].signal.aborted, true, "losing HTTP transport is cancelled");
  assert.deepEqual(failures, [], "losing a race is not a provider failure");
  await delay(20);
  assert.equal(calls.length, 2, "no third mirror after success");
});

test("a fast primary uses one provider, and duplicate endpoints never create duplicate requests", async () => {
  let calls = 0;
  const result = await fetchNearbyMapGeometry(options(async () => { calls++; return response(); }, { backupDelayMs: 5 }));
  assert.deepEqual(result, geometry);
  await delay(15);
  assert.equal(calls, 1);
  const unique = [];
  await assert.rejects(fetchNearbyMapGeometry(options(async url => { unique.push(url); throw Error("offline"); },
    { endpoints: ["https://one.test", "https://one.test", "https://two.test"] })), /No map provider/);
  assert.deepEqual(unique, ["https://one.test", "https://two.test"]);
});

test("only two transports overlap, and incomplete payloads cannot win the race", async () => {
  const signals = [];
  let concurrent = 0, maximum = 0, calls = 0;
  const result = await fetchNearbyMapGeometry(options(async (_, request) => {
    calls++; concurrent++; maximum = Math.max(maximum, concurrent);
    signals.push(request.signal);
    let open = true;
    const close = () => { if(open){open=false; concurrent--; } request.signal.removeEventListener("abort", close); };
    request.signal.addEventListener("abort", close, { once: true });
    if(calls === 1) return never();
    const payload = calls === 2 ? { elements: [], remark: "partial data" } : geometry;
    return { ok:true, json:async()=>{close();return payload;} };
  }, { attemptMs: 40, backupDelayMs: 5 }));
  assert.deepEqual(result, geometry);
  assert.equal(calls, 3);
  assert.ok(signals[0].aborted);
  assert.equal(maximum, 2);
  assert.equal(concurrent, 0);
});

test("parent cancellation during a provider race cleans up both requests and its delayed backup", async () => {
  const parent = new AbortController(), signals = [];
  const work = fetchNearbyMapGeometry(options(async (_, request) => {
    signals.push(request.signal);
    if(signals.length === 2) setTimeout(() => parent.abort(Error("cancelled")), 0);
    return never();
  }, { signal: parent.signal, attemptMs: 400, backupDelayMs: 5 }));
  await assert.rejects(work, /cancelled/);
  assert.equal(signals.length, 2);
  assert.ok(signals.every(signal => signal.aborted));
  await delay(20);
  assert.equal(signals.length, 2);
});

test("if every mirror is marked slow, recovery attempts are still allowed", async () => {
  const provider = createNearbyMapProvider(() => 1_000);
  let calls = 0;
  await assert.rejects(provider(options(async () => { calls++; throw new Error("offline"); })), /No map provider/);
  assert.equal(calls, 3);
  assert.deepEqual(await provider(options(async () => { calls++; return response(); })), geometry);
  assert.equal(calls, 4);
});
