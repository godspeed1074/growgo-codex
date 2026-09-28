import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createPinLoadAhead } from "../client/pin-load-ahead.mjs";
import { createMapAreaDelivery, isMapDeliveryPreviewEnabled } from "../client/map-area-delivery.mjs";

const M = 111_195;
const settle = () => new Promise(setImmediate);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function harness(options = {}) {
  let time = 100_000;
  const calls = [], applied = [], errors = [];
  const context = { uid: "a", day: "2026-09-09", revision: {}, enabled: true,
    visible: true, online: true, zoom: 18, player: null };
  const move = (metres, north = 0, halfWidth = 100) => {
    context.center = { lat: north / M, lng: metres / M };
    context.player = { ...context.center, accuracy: 10 };
    context.bounds = { south: (north - halfWidth) / M, north: (north + halfWidth) / M,
      west: (metres - halfWidth) / M, east: (metres + halfWidth) / M };
    context.key = `${Math.round(metres / 100)}|${Math.round(north / 100)}`;
  };
  move(0);
  const loader = createPinLoadAhead({ getContext: () => context, now: () => time,
    fetchPins: payload => new Promise((resolve, reject) => calls.push({ payload, resolve, reject })),
    apply: (response, center, key) => applied.push({ response, center, key }), onError: error => errors.push(error), ...options });
  const respond = async (index, count = 1, extra = {}) => {
    calls[index].resolve({ pins: Array.from({ length: count }, (_, id) => ({ id })), ...extra });
    await settle();
  };
  return { loader, context, calls, applied, errors, move, respond, now: () => time, tick: ms => time += ms };
}

function deliveryMetadata(payload, now, stale = false) {
  const lat = payload.latitude, lng = payload.longitude;
  const y = Math.min(44999, Math.max(0, Math.floor((lat + 90) / 0.004)));
  const x = Math.min(89999, Math.max(0, Math.floor((lng + 180) / 0.004)));
  const south = y * 0.004 - 90, west = x * 0.004 - 180;
  const radius = Math.min(0.018, 0.006 / Math.max(0.25, Math.cos(Math.max(Math.abs(south), Math.abs(south + 0.004)) * Math.PI / 180)));
  const fetchedAt = stale ? now - 86_400_000 : now;
  return { version: 1, cellKey: `v1-${y}-${x}`, fetchedAt, expiresAt: fetchedAt + 30 * 86_400_000,
    refreshNeeded: stale, retryAfter: 0,
    coverage: { south: south - 0.006000001, north: south + 0.010000001,
      west: west - radius - 1e-9, east: west + 0.004 + radius + 1e-9 } };
}

test("wide viewport reuses its own slow request instead of spending the escape slot twice", async () => {
  const h = harness();
  h.move(0, 0, 1000); // Wider than the server query, as on a zoomed-out map.
  h.loader.update(); await settle();
  h.tick(2000);
  for (let i = 0; i < 10; i++) h.loader.update();
  await settle();
  assert.equal(h.calls.length, 1, "the identical view already has a pending response");
  await h.respond(0);
  assert.equal(h.applied.length, 1);
  h.loader.dispose();
});

test("wide viewport still follows an account-state change with a fresh response", async () => {
  const h = harness(); h.move(0, 0, 1000);
  h.loader.update(); await settle(); h.tick(2000);
  h.context.revision = {}; h.loader.update({ force: true }); await settle();
  assert.equal(h.calls.length, 2);
  await h.respond(1, 1, { label: "fresh" }); await h.respond(0, 1, { label: "old" });
  assert.deepEqual(h.applied.map(a => a.response.label), ["fresh"]);
  h.loader.dispose();
});

test("delivery gate cannot enable a production/candidate host and is opt-in locally", () => {
  for (const url of ["https://growgo-account-profile.vercel.app/?mapDelivery=1",
    "https://growgo-account-profile-abc-grow-go.vercel.app/?mapDelivery=1", "http://localhost:8765/", "invalid"]) {
    assert.equal(isMapDeliveryPreviewEnabled(url), false);
  }
  assert.equal(isMapDeliveryPreviewEnabled("http://localhost:8765/?mapDelivery=1"), true);
  assert.equal(isMapDeliveryPreviewEnabled("file:///tmp/index.html?mapDelivery=1"), true);
});

test("saved geography displays before a separate static refresh; captures never wait for that refresh", async () => {
  const h = harness({ deliveryPreview: true });
  h.loader.update(); await settle();
  assert.equal(h.calls[0].payload.delivery, "interactive");
  await h.respond(0, 1, { mapDelivery: deliveryMetadata(h.calls[0].payload, h.now(), true) });
  assert.equal(h.applied.length, 1, "display is complete before the refresh resolves");
  assert.equal(h.calls[1].payload.delivery, "prepare");
  h.context.revision = {}; h.loader.update({ force: true }); await settle();
  assert.equal(h.calls.length, 3, "interactive request bypasses the pending static refresh");
  assert.equal(h.calls[2].payload.delivery, "interactive");
  await h.respond(2, 1, { label: "fresh capture state" });
  h.calls[1].resolve({ ok: true, pins: [{ capturedToday: false }],
    mapDelivery: deliveryMetadata(h.calls[1].payload, h.now()) });
  await settle();
  assert.equal(h.applied.length, 2, "preparation data never enters the gameplay merge");
  assert.equal(h.applied.at(-1).response.label, "fresh capture state");
  assert.ok(h.loader.getDiagnostics().maxConcurrent <= 2);
  h.loader.dispose();
});

test("static preparation can lead further ahead, but cannot pretend fresh player state has been downloaded", async () => {
  const h = harness({ deliveryPreview: true }); h.loader.update(); await settle();
  await h.respond(0, 1, { mapDelivery: deliveryMetadata(h.calls[0].payload, h.now()) });
  h.tick(2000); h.move(55.5556); h.loader.update(); await settle();
  h.tick(2000); h.move(111.1112); h.loader.update(); await settle();
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].payload.delivery, "prepare");
  assert.ok(h.calls[1].payload.longitude * M > 1200, "roughly 40 seconds of travel lead");
  h.calls[1].resolve({ ok: true, mapDelivery: deliveryMetadata(h.calls[1].payload, h.now()) }); await settle();
  assert.equal(h.applied.length, 1);
  assert.equal(h.loader.getDiagnostics().coverageAreas, 1, "static readiness is not gameplay coverage");
  h.tick(20000); h.move(667); h.loader.update(); await settle();
  assert.equal(h.calls[2].payload.delivery, "interactive", "arrival still reads current captures/crops/fish");
  await h.respond(2); h.loader.dispose();
});

test("an old or preview-disabled backend falls back once without breaking normal map loading", async () => {
  for (const error of [{ code: "functions/invalid-argument" },
    { code: "functions/failed-precondition", details: { reason: "map-delivery-disabled" } }]) {
    const h = harness({ deliveryPreview: true }); h.loader.update(); await settle();
    h.calls[0].reject(error); await settle();
    assert.equal(h.calls.length, 2);
    assert.equal(h.calls[1].payload.delivery, undefined);
    await h.respond(1);
    assert.equal(h.applied.length, 1);
    assert.equal(h.loader.getDiagnostics().deliveryPreviewEnabled, false);
    assert.equal(h.errors.length, 0);
    h.loader.dispose();
  }
});

test("cached fallback stays visible but triggers only one delayed fresh-map retry", async () => {
  const h = harness({ fallbackRetryMs: 5 });
  h.loader.update(); await settle();
  await h.respond(0, 2, { mapPinsFallback: true });
  assert.equal(h.applied.length, 1, "known fallback pins remain visible");
  assert.equal(h.applied[0].key, null, "fallback does not mark a viewport complete");
  assert.equal(h.loader.getDiagnostics().coverageAreas, 0);
  assert.equal(h.loader.getDiagnostics().fallbackRetries, 1);
  await wait(15); await settle();
  assert.equal(h.calls.length, 2, "one bounded retry is issued after the cooldown");
  await h.respond(1, 2);
  assert.equal(h.applied.length, 2);
  assert.ok(h.applied[1].key, "fresh geometry completes the viewport");
  assert.equal(h.loader.getDiagnostics().coverageAreas, 1);
  h.loader.dispose();
});

test("repeated cached fallback does not create a retry loop", async () => {
  const h = harness({ fallbackRetryMs: 5 });
  h.loader.update(); await settle();
  await h.respond(0, 2, { mapPinsFallback: true });
  await wait(15); await settle();
  assert.equal(h.calls.length, 2);
  await h.respond(1, 2, { mapPinsFallback: true });
  await wait(15); await settle();
  assert.equal(h.calls.length, 2, "a second fallback stops automatic retries");
  assert.equal(h.errors.length, 1, "the map reports that fresh pins are still unavailable");
  h.loader.dispose();
});

test("hidden/offline/account/day changes discard preparation, without marking the map ready", async () => {
  for (const field of ["uid", "day", "visible", "online"]) {
    const h = harness({ deliveryPreview: true }); h.loader.update(); await settle();
    await h.respond(0, 1, { mapDelivery: deliveryMetadata(h.calls[0].payload, h.now(), true) });
    h.context[field] = field === "uid" ? "b" : field === "day" ? "new-day" : false;
    h.loader.update();
    h.calls[1].resolve({ ok: true, mapDelivery: deliveryMetadata(h.calls[1].payload, h.now()) }); await settle();
    assert.equal(h.loader.getDiagnostics().prepared, 0, field);
    assert.equal(h.applied.length, 1);
    h.loader.dispose();
    for (const call of h.calls.slice(2)) call.resolve({ pins: [] });
    await settle();
  }
});

test("preparation budget, cooldown, expiry and malformed metadata fail closed", () => {
  let time = 100000;
  const d = createMapAreaDelivery({ now: () => time });
  const c = { enabled: true, visible: true, online: true, uid: "a", zoom: 18 };
  for (let i = 0; i < 30; i++) {
    c.center = { lat: 0, lng: i * 1000 / M }; c.player = { ...c.center, accuracy: 10 };
    c.bounds = { south: -100/M, north: 100/M, west: c.center.lng-100/M, east: c.center.lng+100/M };
    const direction = { x: 1, y: 0, speed: 25, at: time };
    const p = d.target(c, direction); assert.ok(p, `attempt ${i}`);
    d.started(p, c); d.failed(p);
    assert.equal(d.target(c, direction), null, "no immediate retry");
    time += 20001;
  }
  assert.equal(d.target(c, { x: 1, y: 0, speed: 25, at: time }), null);
  assert.equal(d.diagnostics().preparationAttempts, 30);
  const p = { latitude: 0, longitude: 0 };
  const m = deliveryMetadata(p, time);
  for (const broken of [{ ...m, version: 2 }, { ...m, expiresAt: time - 1 },
    { ...m, fetchedAt: time + 60_001 }, { ...m, cellKey: "v1-0-0" }, { ...m, coverage: null }]) {
    assert.equal(d.observe({ mapDelivery: broken }, { lat: 0, lng: 0 }), false);
  }
  assert.equal(d.observe({ mapDelivery: m }, { lat: 0, lng: 0 }), true);
  time += 24 * 60 * 60 * 1000;
  c.center = { lat: 0, lng: 30000 / M }; c.player = { ...c.center, accuracy: 10 };
  const direction = { x: 1, y: 0, speed: 25, at: time };
  assert.ok(d.target(c, direction), "old readiness and rolling budget both expire");
});

test("slow moving-area response is reused rather than abandoned and restarted", async () => {
  const h = harness();
  h.loader.update(); await settle();
  for (let metres = 10; metres <= 200; metres += 10) {
    h.tick(5_000); h.move(metres); h.loader.update();
  }
  assert.equal(h.calls.length, 1, "20 moving callbacks share the original request");
  await h.respond(0);
  assert.equal(h.applied.length, 1);
  assert.equal(h.calls.length, 1, "response already covers the player's new location");
  assert.equal(h.loader.getDiagnostics().discarded, 0);
});

test("one area ahead becomes reusable coverage; duplicates and stationary callbacks do not fetch", async () => {
  const h = harness(); h.loader.update(); await settle(); await h.respond(0);
  h.tick(60_000); h.move(400); h.loader.update(); await settle();
  assert.equal(h.calls.length, 2);
  assert.ok(Math.abs(h.calls[1].payload.longitude * M - 750) < 1);
  assert.equal(h.loader.getDiagnostics().ahead, 1);
  for (let i = 0; i < 20; i++) h.loader.update();
  assert.equal(h.calls.length, 2);
  await h.respond(1);
  h.tick(20_000); h.move(700); h.loader.update(); await settle();
  assert.equal(h.calls.length, 2, "entering the prefetched area needs no new request");
  for (let i = 0; i < 20; i++) { h.tick(30_000); h.loader.update(); }
  await settle(); assert.equal(h.calls.length, 2, "no time-driven stationary prefetch");
});

test("look-ahead budget stops at four per 15 minutes without stopping necessary foreground loads", async () => {
  const h = harness(); h.loader.update(); await settle(); await h.respond(0);
  for (let metres = 400; metres <= 7400; metres += 100) {
    h.tick(9_000); h.move(metres); h.loader.update(); await settle();
    if (h.loader.getDiagnostics().inFlight) await h.respond(h.calls.length - 1);
  }
  const counts = h.loader.getDiagnostics();
  assert.equal(counts.ahead, 4);
  assert.ok(counts.foreground > 1, "budget must never block loading a new visible area");
});

test("350-pin dense replies do not create false full-area coverage or trigger speculative loads", async () => {
  const h = harness(); h.loader.update(); await settle(); await h.respond(0, 350);
  assert.equal(h.loader.getDiagnostics().coverageAreas, 0);
  h.tick(60_000); h.move(40); h.loader.update(); await settle();
  assert.equal(h.calls.length, 1);
  h.move(400); h.loader.update(); await settle(); await h.respond(1, 350);
  assert.equal(h.loader.getDiagnostics().ahead, 0);
});

test("foreground movement waits for the real callable to finish; no pretending abort cancels server work", async () => {
  const h = harness(); h.loader.update(); await settle();
  h.move(2000); h.loader.update(); h.move(4000); h.loader.update();
  assert.equal(h.calls.length, 1);
  await h.respond(0);
  assert.equal(h.applied.length, 0, "far-away obsolete data is not applied");
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].payload.longitude, 4000 / M);
  await h.respond(1);
  assert.equal(h.applied.length, 1);
});

test("forced refresh and captures/crop mutations discard stale replies, then load fresh once", async () => {
  for (const change of [h => { h.context.revision = {}; }, h => { h.loader.update({ force: true }); h.loader.update({ force: true }); }]) {
    const h = harness(); h.loader.update(); await settle(); change(h);
    await h.respond(0, 1, { label: "before-capture" });
    assert.equal(h.applied.length, 0);
    assert.equal(h.calls.length, 2);
    await h.respond(1, 1, { label: "after-capture" });
    assert.equal(h.applied[0].response.label, "after-capture");
    assert.equal(h.calls.length, 2);
  }
});

test("account/day changes and hidden/offline states cannot apply old responses", async () => {
  for (const field of ["uid", "day", "visible", "online", "enabled"]) {
    const h = harness(); h.loader.update(); await settle();
    h.context[field] = field === "uid" ? "b" : field === "day" ? "2026-09-10" : false;
    h.loader.update(); await h.respond(0);
    assert.equal(h.applied.length, 0, field);
    if (["uid", "day"].includes(field)) { assert.equal(h.calls.length, 2); await h.respond(1); }
    else assert.equal(h.calls.length, 1);
  }
});

test("stationary, inaccurate GPS, implausible GPS jumps and a map panned away from the player do not prefetch", async () => {
  for (const option of ["stationary", "inaccurate", "jump", "panned"]) {
    const h = harness(); h.loader.update(); await settle(); await h.respond(0);
    h.tick(option === "jump" ? 1_000 : 60_000);
    if (option !== "stationary") h.move(400);
    if (option === "inaccurate") h.context.player.accuracy = 100;
    if (option === "panned") h.context.center = { lat: 0, lng: 0 };
    h.loader.update(); await settle();
    assert.equal(h.loader.getDiagnostics().ahead, 0, option);
  }
});

test("100 km/h gets a 550m lead after stable samples and reuses the area on arrival", async () => {
  const h = harness(); h.loader.update(); await settle(); await h.respond(0);
  // Two agreeing samples are necessary for high-speed prediction.
  h.tick(2_000); h.move(55.5556); h.loader.update(); await settle();
  assert.equal(h.calls.length, 1);
  h.tick(2_000); h.move(111.1112); h.loader.update(); await settle();
  h.tick(2_000); h.move(166.6668); h.loader.update(); await settle();
  assert.equal(h.calls.length, 2);
  assert.ok(Math.abs(h.calls[1].payload.longitude * M - 716.6668) < 0.01);
  assert.equal(h.loader.getDiagnostics().ahead, 1);
  h.tick(10_000); h.move(444.4446); h.loader.update(); await h.respond(1);
  h.tick(16_400); h.move(900); h.loader.update(); await settle();
  assert.equal(h.calls.length, 2, "enter the warmed region with no extra call");
  assert.equal(h.loader.getDiagnostics().discarded, 0);
});

test("slow walking keeps its 350m lead even when meaningful samples are over 30 seconds apart", async () => {
  const h = harness(); h.loader.update(); await settle(); await h.respond(0);
  for (let metres = 35; metres <= 350; metres += 35) {
    h.tick(50_000); h.move(metres); h.loader.update(); await settle();
  }
  assert.equal(h.calls.length, 2);
  assert.ok(Math.abs(h.calls[1].payload.longitude * M - 700) < 0.001);
  await h.respond(1); h.loader.dispose();
});

test("high-speed prediction stops for bad GPS, large jumps, zoom-out, panning and stale motion", async () => {
  for (const option of ["inaccurate", "negative-accuracy", "jump", "zoom", "pan", "stopped"]) {
    const h = harness(); h.loader.update(); await settle(); await h.respond(0);
    for (const metres of [40, 80]) { h.tick(1_440); h.move(metres); h.loader.update(); }
    h.tick(option === "jump" ? 100 : option === "stopped" ? 31_000 : 1_440);
    h.move(option === "stopped" ? 80 : 120);
    if (option === "inaccurate") h.context.player.accuracy = 100;
    if (option === "negative-accuracy") h.context.player.accuracy = -1;
    if (option === "zoom") h.context.zoom = 14;
    if (option === "pan") h.context.player.lng -= 400 / M;
    h.loader.update({ force: true }); await settle();
    if (option === "zoom") assert.equal(h.calls.length, 1);
    else {
      assert.equal(h.calls[1].payload.longitude, h.context.center.lng, option);
      await h.respond(1);
    }
    assert.equal(h.loader.getDiagnostics().ahead, 0);
    assert.equal(h.loader.getDiagnostics().shiftedForeground, 0);
    h.loader.dispose();
  }
});

test("a 30-second cold reply cannot create an endless trailing-request loop at 100 km/h", async () => {
  const h = harness(); h.loader.update(); await settle();
  const speed = 100 / 3.6;
  for (let second = 2; second <= 30; second += 2) {
    h.tick(2_000); h.move(second * speed); h.loader.update();
  }
  assert.equal(h.calls.length, 1);
  await h.respond(0);
  assert.equal(h.applied.length, 0, "first cold result is now behind the screen");
  assert.equal(h.calls.length, 2);
  assert.ok(h.calls[1].payload.longitude * M < 30 * speed + 550, "escape request starts before the old 30s reply finishes");
  assert.ok(h.calls[1].payload.longitude * M > 20 * speed + 500);
  assert.equal(h.loader.getDiagnostics().priorityBypasses, 1);
  for (let second = 32; second <= 60; second += 2) {
    h.tick(2_000); h.move(second * speed); h.loader.update();
  }
  await h.respond(1);
  assert.equal(h.applied.length, 1, "next slow response covers the passenger's new position");
  assert.equal(h.calls.length, 2, "no restart storm or speculative background chain");
  assert.equal(h.loader.getDiagnostics().shiftedForeground, 1);
});

test("a turn or reversal removes prediction until another sample confirms the direction", async () => {
  for (const reverse of [false, true]) {
    const h = harness(); h.loader.update(); await settle(); await h.respond(0);
    for (const metres of [40, 80]) { h.tick(1_440); h.move(metres); h.loader.update(); }
    // Force a necessary foreground query immediately after changing direction.
    h.tick(1_440); h.move(reverse ? 40 : 80, reverse ? 0 : 40);
    h.loader.update({ force: true }); await settle();
    assert.equal(h.calls[1].payload.longitude, h.context.center.lng);
    assert.equal(h.calls[1].payload.latitude, h.context.center.lat);
    await h.respond(1);
    h.tick(1_440); h.move(reverse ? 0 : 80, reverse ? 0 : 80);
    h.loader.update({ force: true }); await settle();
    const call = h.calls[2].payload;
    if (reverse) assert.ok(call.longitude < h.context.center.lng - 500 / M);
    else assert.ok(call.latitude > h.context.center.lat + 500 / M);
    await h.respond(2); h.loader.dispose();
  }
});

test("a high-speed shifted query always retains the original viewport and backs off in dense areas", async () => {
  for (const halfWidth of [100, 500, 800]) {
    const h = harness(); h.loader.update(); await settle(); await h.respond(0);
    h.tick(2_160); h.move(60); h.loader.update();
    h.tick(2_160); h.move(120, 0, halfWidth); h.loader.update({ force: true }); await settle();
    const center = h.calls[1].payload.longitude * M;
    if (halfWidth > 0.006 * M) assert.ok(Math.abs(center - 120) < 0.001, "wide views remain centred");
    else {
      assert.ok(center - 0.006 * M <= 120 - halfWidth);
      assert.ok(center + 0.006 * M >= 120 + halfWidth);
    }
    await h.respond(1, 350);
    if (halfWidth < 0.006 * M) {
      assert.equal(h.applied[1].key, null, "truncation must not falsely fulfil a shifted view");
      assert.equal(h.calls.length, 3);
      assert.equal(h.calls[2].payload.longitude, h.context.center.lng, "fallback queries at player, not ahead");
      await h.respond(2, 350);
      assert.equal(h.calls.length, 3, "one fallback only");
      h.loader.update({ force: true }); await settle();
      assert.equal(h.calls[3].payload.longitude, h.context.center.lng, "brief density hint prevents repeated double loads");
      await h.respond(3, 350);
    } else assert.equal(h.calls.length, 2);
    h.loader.dispose();
  }
});

test("fast-travel reply cannot bypass capture, crop, reset, account or visibility safeguards", async () => {
  for (const change of [
    h => { h.context.revision = {}; }, h => { h.loader.update({ force: true }); },
    h => { h.context.uid = "other"; h.loader.update(); },
    h => { h.context.day = "2026-09-10"; h.loader.update(); },
    h => { h.context.visible = false; h.loader.update(); },
    h => { h.context.online = false; h.loader.update(); }
  ]) {
    const h = harness(); h.loader.update(); await settle(); await h.respond(0);
    for (const metres of [60, 120, 180]) { h.tick(2_160); h.move(metres); h.loader.update(); }
    await settle(); assert.equal(h.calls.length, 2);
    change(h); await h.respond(1, 1, { label: "stale-high-speed-reply" });
    assert.equal(h.applied.length, 1, "no old payload reaches merge or rewards");
    h.loader.dispose();
    if (h.calls.length === 3) await h.respond(2);
  }
});

async function drive({ predictive = true, seconds = 900, latency = 10 } = {}) {
  const h = harness(), due = new Map();
  let maxPending = 0;
  for (let second = 0; second <= seconds; second += 2) {
    h.move(second * 100 / 3.6);
    if (!predictive) h.context.player = null; // Same single-flight loader, centred requests only.
    h.loader.update(); await settle();
    h.calls.forEach((call, index) => { if (!due.has(index)) due.set(index, { at: second + latency, done: false }); });
    maxPending = Math.max(maxPending, [...due.values()].filter(item => !item.done).length);
    for (const [index, item] of due) {
      if (!item.done && second >= item.at) { item.done = true; await h.respond(index); }
    }
    h.tick(2_000);
  }
  const counts = h.loader.getDiagnostics();
  h.loader.dispose();
  for (let index = 0; index < h.calls.length; index++) if (!due.get(index)?.done) await h.respond(index);
  return { ...counts, calls: h.calls.length, maxPending };
}

test("15-minute 100 km/h simulation keeps four-ahead budget, one real call, and bounded request count", async t => {
  const predictive = await drive(), centred = await drive({ predictive: false });
  assert.equal(predictive.maxPending, 1);
  assert.ok(predictive.ahead <= 4);
  assert.ok(predictive.foreground > 4, "necessary route loads continue after speculative budget is exhausted");
  assert.ok(predictive.shiftedForeground > 0);
  assert.equal(predictive.discarded, 0);
  assert.ok(predictive.calls <= centred.calls, "test route must not raise total requests");
  t.diagnostic(JSON.stringify({ predictive, centred }));
});

test("high-speed requests stay within two foreground slots on slow connections without increasing the ahead budget", async t => {
  for (const latency of [20, 30]) {
    const result = await drive({ seconds: 300, latency });
    assert.ok(result.maxPending <= 2);
    assert.ok(result.ahead <= 4);
    assert.ok(result.applied >= 3, "slow replies still catch up to the travelling viewport");
    assert.ok(result.discarded <= 1, "only initial unpredicted cold request may arrive behind the player");
    t.diagnostic(JSON.stringify({ latencySeconds: latency, ...result }));
  }
});

async function deliveryDrive(deliveryPreview) {
  const h = harness({ deliveryPreview }), due = new Map(), prepared = new Set();
  let coldGameplayLoads = 0, maxPending = 0, uncoveredSeconds = 0;
  for (let second = 0; second <= 900; second++) {
    const position = second * 100 / 3.6;
    h.move(position); h.loader.update(); await settle();
    h.calls.forEach((call, i) => {
      if (due.has(i)) return;
      const cell = deliveryMetadata(call.payload, h.now()).cellKey;
      const cold = !prepared.has(cell);
      if (cold && call.payload.delivery !== "prepare") coldGameplayLoads++;
      due.set(i, { at: second + (cold ? 10 : 1), done: false, cell });
    });
    maxPending = Math.max(maxPending, [...due.values()].filter(item => !item.done).length);
    for (const [index, item] of due) {
      if (item.done || second < item.at) continue;
      item.done = true; prepared.add(item.cell);
      const call = h.calls[index];
      const metadata = deliveryMetadata(call.payload, h.now());
      if (call.payload.delivery === "prepare") {
        call.resolve({ ok: true, mapDelivery: metadata }); await settle();
      } else await h.respond(index, 1, call.payload.delivery ? { mapDelivery: metadata } : {});
    }
    if (second > 10 && !h.applied.some(a => Math.abs(a.center.lng * M - position) <= 0.006 * M - 100)) uncoveredSeconds++;
    h.tick(1000);
  }
  const counts = h.loader.getDiagnostics();
  h.loader.dispose();
  h.calls.forEach((call, i) => { if (!due.get(i)?.done) call.resolve({ pins: [] }); }); await settle();
  return { coldGameplayLoads, maxPending, uncoveredSeconds, foreground: counts.foreground,
    background: counts.ahead, prepared: counts.prepared, calls: h.calls.length };
}

test("static-first delivery reduces cold foreground waits in a synthetic 15-minute passenger trip", async t => {
  const legacy = await deliveryDrive(false), preview = await deliveryDrive(true);
  assert.ok(preview.maxPending <= 2);
  assert.ok(preview.background <= 30);
  assert.ok(preview.prepared > 0);
  assert.ok(preview.coldGameplayLoads < legacy.coldGameplayLoads, "prepared centres avoid repeated cold gameplay loads");
  assert.ok(preview.uncoveredSeconds < legacy.uncoveredSeconds, "less time outside delivered coverage");
  assert.ok(preview.uncoveredSeconds <= 20, "the controlled route retains only initial/cold catch-up gaps");
  assert.ok(preview.foreground <= legacy.foreground + legacy.background + 5, "limit additional full-state reads in this fixture");
  t.diagnostic(JSON.stringify({ simulationOnly: true, coldSeconds: 10, warmSeconds: 1, legacy, preview }));
});

test("an obsolete off-screen load cannot block the current viewport, and late cleanup cannot clear it", async () => {
  const h = harness(); h.loader.update(); await settle();
  h.tick(1_600); h.move(2000); h.loader.update(); await settle();
  assert.equal(h.calls.length, 2, "new view starts while the old request is still running");
  for(let i=0;i<20;i++) h.loader.update();
  assert.equal(h.calls.length, 2, "callbacks do not fill more escape slots");
  await h.respond(1, 1, { label: "current" });
  assert.equal(h.applied.length, 1);
  assert.equal(h.loader.getDiagnostics().activeRequests, 1, "old real call is still accounted for");
  await h.respond(0, 1, { label: "obsolete" });
  assert.equal(h.applied.length, 1);
  assert.equal(h.calls.length, 2);
  assert.equal(h.loader.getDiagnostics().maxConcurrent, 2);
});

test("two competing replies cannot overwrite newer data even if the player pans back", async () => {
  const h = harness(); h.loader.update(); await settle();
  h.tick(1_600); h.move(600); h.loader.update(); await settle();
  assert.equal(h.calls.length, 2);
  await h.respond(1, 1, { label: "newer" });
  h.move(300); h.loader.update(); await h.respond(0, 1, { label: "older" });
  assert.deepEqual(h.applied.map(item=>item.response.label), ["newer"]);
  assert.equal(h.loader.getDiagnostics().activeRequests, 0);
});

test("capture revision changes re-read the just-warmed cell instead of moving into another cold cell", async () => {
  const h = harness(); h.loader.update(); await settle();
  for(const metres of [40,80]){h.tick(1_440);h.move(metres);h.loader.update();}
  h.context.revision = {}; // A legitimate capture/harvest changed the snapshot.
  await h.respond(0);
  assert.equal(h.applied.length, 0, "old capture/crop state stays rejected");
  assert.equal(h.calls.length, 2);
  assert.deepEqual(h.calls[1].payload, h.calls[0].payload, "same warmed geometry, fresh dynamic state");
  await h.respond(1);
  assert.equal(h.applied.length, 1);
  assert.equal(h.loader.getDiagnostics().warmRetries, 1);
});

test("a blocked stationary camera gets one scheduled escape without waiting for another GPS update", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const h=harness(); h.loader.update(); await settle();
  h.move(2000); h.loader.update();
  assert.equal(h.calls.length,1);
  h.tick(1_500); t.mock.timers.tick(1_500); await settle();
  assert.equal(h.calls.length,2);
  h.loader.dispose();
  await h.respond(0); await h.respond(1);
  t.mock.timers.tick(30_000); await settle();
  assert.equal(h.calls.length,2,"dispose removes the one-shot wake-up");
});

test("foreground wake-up is cancelled when hidden, and resumed reads cannot mix accounts", async t => {
  t.mock.timers.enable({apis:["setTimeout"]});
  const h=harness(); h.loader.update(); await settle();
  h.move(2000); h.loader.update(); h.context.visible=false; h.loader.update();
  h.tick(2_000); t.mock.timers.tick(2_000); await settle();
  assert.equal(h.calls.length,1);
  h.context.visible=true; h.context.uid="other"; // Account change observed at completion, before another GPS update.
  await h.respond(0);
  assert.equal(h.applied.length,0);
  assert.equal(h.calls.length,2);
  await h.respond(1);
  assert.equal(h.applied.length,1);
  assert.equal(h.calls.length,2,"no repeated discard loop with the old account scope");
  h.loader.dispose();
});

test("failures back off, invalid/expired results never mark coverage, and dispose prevents later work", async () => {
  const h = harness(); h.loader.update(); await settle();
  h.calls[0].reject(Error("offline")); await settle();
  for (let i = 0; i < 20; i++) h.loader.update();
  assert.equal(h.calls.length, 1);
  h.tick(15_000); h.loader.update(); await settle();
  await h.respond(1, 1, { fishCycle: { expiresAt: "1970-01-01T00:00:01Z" } });
  assert.equal(h.applied.length, 0);
  assert.equal(h.loader.getDiagnostics().coverageAreas, 0);
  h.loader.dispose(); h.tick(30_000); h.loader.update(); await settle();
  assert.equal(h.calls.length, 2);
});

test("approved production gate defaults on, supports an immediate off switch, and limits preview opt-in", () => {
  const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");
  const start = source.indexOf("function isPinLoadAheadPreviewEnabled(");
  const code = source.slice(start, source.indexOf("\n}", start) + 2);
  for (const [href, expected] of [
    ["https://growgo-account-profile.vercel.app/", true],
    ["https://growgo-account-profile-grow-go.vercel.app/", true],
    ["https://growgo-account-profile.vercel.app/?pinLookAhead=1", true],
    ["https://growgo-account-profile.vercel.app/?pinLookAhead=0", false],
    ["https://growgo-account-profile-fixture-grow-go.vercel.app/", false],
    ["https://growgo-account-profile-fixture-grow-go.vercel.app/?pinLookAhead=1", true],
    ["http://growgo-account-profile.vercel.app/", false],
    ["https://other.example/?pinLookAhead=1", false], ["http://localhost:8765/", false],
    ["http://localhost:8765/?pinLookAhead=1", true], ["file:///tmp/index.html?pinLookAhead=1", true]
  ]) {
    const context = vm.createContext({ URL, roadLoadAheadUnavailable: false, window: { location: { href } } });
    vm.runInContext(code, context);
    assert.equal(context.isPinLoadAheadPreviewEnabled(), expected, href);
    context.roadLoadAheadUnavailable = true;
    assert.equal(context.isPinLoadAheadPreviewEnabled(), false, "startup failure forces legacy fallback");
  }
});

test("module startup failure falls back to existing map loading instead of leaving pins blank", async () => {
  const source = readFileSync(new URL("../script.js", import.meta.url), "utf8");
  const start = source.indexOf("function requestPreviewRoadPins(");
  const code = source.slice(start, source.indexOf("\n}", start) + 2)
    .replace('import("./client/pin-load-ahead.mjs?v=cold-map-latency-20260909")', 'Promise.reject(new Error("fixture-module-unavailable"))');
  const legacy = [];
  const context = vm.createContext({
    roadLoadAheadPreview: null, roadLoadAheadPreviewPromise: null,
    roadLoadAheadPreviewForcePending: false, roadLoadAheadUnavailable: false,
    console: { warn() {} }, requestRoadPinsForCurrentView: force => legacy.push(force)
  });
  vm.runInContext(code, context);
  context.requestPreviewRoadPins(false);
  context.requestPreviewRoadPins(true);
  await settle();
  assert.deepEqual(legacy, [true], "one fallback preserves a queued explicit refresh");
  assert.equal(context.roadLoadAheadUnavailable, true);
  assert.equal(context.roadLoadAheadPreviewPromise, null);
});
