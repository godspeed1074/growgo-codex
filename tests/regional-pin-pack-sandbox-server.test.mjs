import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegionalPinPackPreview, createMemoryRegionalPinStorage} from '../client/regional-pin-pack-preview.mjs';
import {createRegionalPinPackSandboxTransport} from '../client/regional-pin-pack-sandbox-transport.mjs';
import {createRegionalPinPackSandboxServer, createSandboxOverpassLoader} from '../scripts/regional-pin-pack-sandbox-server.mjs';

test('local Overpass loader uses the reachable public endpoint and canonical extractor', async () => {
  let request;
  const expected = {pins: [{pinId: 'canonical-test', latitude: -38.1, longitude: 145.2, type: 'base'}]};
  const loader = createSandboxOverpassLoader({fetchImpl: async (url, options) => {
    request = {url: String(url), options};
    return new Response(JSON.stringify({elements: []}), {status: 200,
      headers: {'content-type': 'application/json'}});
  }, extractPins: (payload, center, bounds, options) => {
    assert.deepEqual(payload, {elements: []});
    assert.equal(center.latitude, -38.1);
    assert.equal(options.maxPins, 20_000);
    return expected;
  }});
  const bounds = {south: -38.11, west: 145.19, north: -38.09, east: 145.21};
  assert.equal(await loader({center: {latitude: -38.1, longitude: 145.2}, bounds, maxPins: 20_000}), expected);
  assert.equal(request.url, 'https://overpass-api.de/api/interpreter');
  assert.equal(request.options.method, 'POST');
  assert.match(request.options.body, /way\["highway"/);
  assert.match(request.options.body, /\["natural"="water"\]/);
  assert.ok(request.options.signal.aborted === false);
});

test('local Overpass loader rejects oversized radius-independent response payloads', async () => {
  const loader = createSandboxOverpassLoader({fetchImpl: async () => new Response('x'.repeat(12 * 1024 * 1024 + 1)),
    extractPins: () => ({pins: []})});
  await assert.rejects(loader({center: {latitude: -38.1, longitude: 145.2},
    bounds: {south: -38.11, west: 145.19, north: -38.09, east: 145.21}, maxPins: 100}), /12 MB sandbox limit/);
});

test('local sandbox serves canonical-style pins, reusable shards, and empty delta cursors', async () => {
  const loads = [];
  const service = createRegionalPinPackSandboxServer({port: 0, loadPins: async args => {
    loads.push(args);
    return {pins: [
      {pinId: 'canonical-a', latitude: -37.9005, longitude: 145.2005, type: 'base'},
      {pinId: 'canonical-b', latitude: -37.8995, longitude: 145.1995, type: 'water'},
      {pinId: 'outside', latitude: -37.91, longitude: 145.2, type: 'base'}
    ]};
  }});
  const address = await service.listen();
  try {
    const transport = createRegionalPinPackSandboxTransport({baseUrl: `http://127.0.0.1:${address.port}`});
    const blockedOrigin = await fetch(`http://127.0.0.1:${address.port}/health`, {headers: {origin: 'https://untrusted.example'}});
    assert.equal(blockedOrigin.status, 403);
    const storage = createMemoryRegionalPinStorage();
    const pack = createRegionalPinPackPreview({storage, transport});
    const center = {lat: -37.9, lng: 145.2};
    const summary = await pack.sync(center, {radiusKm: 1});
    assert.equal(summary.shardsDownloaded, 1);
    assert.equal(loads.length, 1);
    assert.equal(loads[0].maxPins, 20_000);
    assert.ok(loads[0].bounds.south < center.lat && loads[0].bounds.north > center.lat);
    const shardId = (await storage.getManifest()).shards[0].id;
    const pins = await pack.getPins(shardId);
    assert.deepEqual(pins.map(pin => pin.pinId), ['canonical-a', 'canonical-b']);
    assert.equal(pins[0].worldState, null);
    assert.equal((await pack.syncDelta(shardId)).reset, true);
    assert.equal((await pack.getPins(shardId))[0].worldState, null);
    const repeated = await pack.sync(center, {radiusKm: 1});
    assert.equal(repeated.shardsReused, 1);
    assert.equal(loads.length, 1);
    await assert.rejects(pack.sync(center, {radiusKm: 2.1}), /radius exceeds 2 km sandbox cap/);
  } finally {
    await service.close();
  }
});

test('sandbox transport refuses remote endpoints', () => {
  assert.throws(() => createRegionalPinPackSandboxTransport({baseUrl: 'https://example.com'}), /loopback/);
  assert.throws(() => createRegionalPinPackSandboxTransport({baseUrl: 'http://10.0.0.4:57531'}), /loopback/);
});
