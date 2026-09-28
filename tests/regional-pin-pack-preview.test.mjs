import test from 'node:test';
import assert from 'node:assert/strict';
import {createIndexedDbRegionalPinStorage, createMemoryRegionalPinStorage, createRegionalPinPackPreview} from '../client/regional-pin-pack-preview.mjs';

const center = {lat: -37.9, lng: 145.2};
const pins = [
  {pinId: 'base-b', latitude: -37.901, longitude: 145.201, type: 'base'},
  {pinId: 'base-a', latitude: -37.9, longitude: 145.2, type: 'base'}
];
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` :
  value && typeof value === 'object' ? `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}` : JSON.stringify(value);
async function hash(value) {
  const bytes = new TextEncoder().encode(canonical(value));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
}
async function makeFixture() {
  const normalized = pins.map(({pinId, latitude, longitude, type}) => ({pinId, latitude, longitude, type})).sort((a,b)=>a.pinId.localeCompare(b.pinId));
  const sha256 = await hash(normalized);
  const descriptor = {id: 'shard-1', revision: 'r1', sha256, byteSize: new TextEncoder().encode(canonical(normalized)).byteLength};
  let manifestRevision = 'manifest-1', descriptorNow = descriptor, deltaResponse = null;
  const downloads = [];
  const transport = {
    async getManifest(request) {
      assert.deepEqual(request.center, center);
      return {schemaVersion: 1, catalogVersion: 'catalog-1', revision: manifestRevision,
        center, radiusKm: request.radiusKm, shards: [descriptorNow]};
    },
    async getShard(request) {
      downloads.push(request);
      return {id: descriptorNow.id, revision: descriptorNow.revision, catalogVersion: 'catalog-1',
        sha256: descriptorNow.sha256, pins};
    },
    async getDelta(request) {
      if (deltaResponse) return deltaResponse;
      return {catalogVersion: 'catalog-1', baseCursor: request.cursor, nextCursor: 'cursor-1', changes: []};
    }
  };
  return {transport, downloads, descriptor, setDescriptor(value) { descriptorNow = value; },
    setRevision(value) { manifestRevision = value; }, setDelta(value) { deltaResponse = value; }};
}

function fakeIndexedDB() {
  const databases = new Map();
  const clone = value => value == null ? value : structuredClone(value);
  class Store {
    constructor(map, keyPath, tx) { Object.assign(this, {map, keyPath, tx}); }
    get(key) { return this.tx.request(() => clone(this.map.get(key))); }
    getAll() { return this.tx.request(() => [...this.map.values()].map(clone)); }
    put(value) { return this.tx.request(() => { this.map.set(value[this.keyPath], clone(value)); return value[this.keyPath]; }); }
    delete(key) { return this.tx.request(() => this.map.delete(key)); }
    clear() { return this.tx.request(() => this.map.clear()); }
  }
  class Tx {
    constructor(db, names) { this.db = db; this.names = names; this.pending = 0; }
    objectStore(name) {
      if (!this.names.includes(name)) throw new Error(`Store ${name} is outside this transaction.`);
      return new Store(this.db.stores.get(name), this.db.keyPaths.get(name), this);
    }
    request(run) {
      const request = {};
      this.pending++;
      queueMicrotask(() => {
        try { request.result = run(); request.onsuccess?.({target: request}); }
        catch (error) { request.error = error; request.onerror?.({target: request}); }
        this.pending--;
        if (this.pending === 0) setTimeout(() => this.oncomplete?.(), 0);
      });
      return request;
    }
  }
  return {open(name) {
    const request = {};
    setTimeout(() => {
      let db = databases.get(name);
      if (!db) {
        const names = new Set();
        db = {stores: new Map(), keyPaths: new Map(), objectStoreNames: {contains: key => names.has(key)},
          createObjectStore(key, options) { names.add(key); db.keyPaths.set(key, options.keyPath); db.stores.set(key, new Map()); }, close() {}};
        db.transaction = (list) => new Tx(db, list);
        databases.set(name, db);
        request.result = db; request.onupgradeneeded?.({target: request});
      } else request.result = db;
      request.onsuccess?.({target: request});
    }, 0);
    return request;
  }};
}

test('downloads a verified bounded pack, then reuses the unchanged shard', async () => {
  const fixture = await makeFixture(), storage = createMemoryRegionalPinStorage();
  const pack = createRegionalPinPackPreview({storage, transport: fixture.transport, now: () => 1234});
  assert.deepEqual(await pack.sync(center), {revision: 'manifest-1', catalogVersion: 'catalog-1',
    shardsDownloaded: 1, shardsReused: 0, bytesDownloaded: fixture.descriptor.byteSize, radiusKm: 100});
  fixture.setRevision('manifest-2');
  const second = await pack.sync(center);
  assert.equal(second.shardsDownloaded, 0);
  assert.equal(second.shardsReused, 1);
  assert.equal(fixture.downloads.length, 1);
  assert.equal((await pack.diagnostics()).bytes, fixture.descriptor.byteSize);
});

test('rejects integrity failures without replacing the last good manifest or shard', async () => {
  const fixture = await makeFixture(), storage = createMemoryRegionalPinStorage();
  const pack = createRegionalPinPackPreview({storage, transport: fixture.transport});
  await pack.sync(center);
  fixture.setDescriptor({...fixture.descriptor, revision: 'r2', sha256: '0'.repeat(64)});
  fixture.setRevision('manifest-2');
  await assert.rejects(pack.sync(center), /integrity check/);
  assert.equal((await storage.getManifest()).revision, 'manifest-1');
  assert.equal((await storage.getShard('shard-1')).revision, 'r1');
});

test('rejects oversized radius and storage budget before evicting cached content', async () => {
  const fixture = await makeFixture(), storage = createMemoryRegionalPinStorage();
  const pack = createRegionalPinPackPreview({storage, transport: fixture.transport, maxPackBytes: 1});
  await assert.rejects(pack.sync(center), /storage budget/);
  assert.equal(await storage.getManifest(), null);
  await assert.rejects(pack.sync(center, {radiusKm: 100.1}), /between 0 and 100/);
});

test('keeps changing world state separate, applies cursor deltas and tombstones', async () => {
  const fixture = await makeFixture(), storage = createMemoryRegionalPinStorage();
  const pack = createRegionalPinPackPreview({storage, transport: fixture.transport});
  await pack.sync(center);
  fixture.setDelta({catalogVersion: 'catalog-1', baseCursor: null, nextCursor: 'cursor-1', changes: [
    {pinId: 'base-a', state: {capturedToday: true, cropStage: 2}},
    {pinId: 'base-b', state: {ownerDisplay: 'Tester'}},
    {pinId: 'not-in-shard', state: {capturedToday: true}}
  ]});
  assert.equal((await pack.syncDelta('shard-1')).changesApplied, 3);
  let current = await pack.getPins('shard-1');
  assert.equal(current.find(pin => pin.pinId === 'base-a').worldState.cropStage, 2);
  assert.equal(current.find(pin => pin.pinId === 'base-a').latitude, -37.9);
  assert.equal(current.find(pin => pin.pinId === 'base-a').playerId, undefined);
  fixture.setDelta({catalogVersion: 'catalog-1', baseCursor: 'cursor-1', nextCursor: 'cursor-2', changes: [
    {pinId: 'base-a', deleted: true}
  ]});
  await pack.syncDelta('shard-1');
  current = await pack.getPins('shard-1');
  assert.equal(current.find(pin => pin.pinId === 'base-a').worldState, null);
});

test('rejects stale delta cursors and private/unapproved state fields', async () => {
  const fixture = await makeFixture(), storage = createMemoryRegionalPinStorage();
  const pack = createRegionalPinPackPreview({storage, transport: fixture.transport});
  await pack.sync(center);
  fixture.setDelta({catalogVersion: 'catalog-1', baseCursor: 'wrong', nextCursor: 'cursor-1', changes: []});
  await assert.rejects(pack.syncDelta('shard-1'), /out of sequence/);
  fixture.setDelta({catalogVersion: 'catalog-1', baseCursor: null, nextCursor: 'cursor-1', changes: [
    {pinId: 'base-a', state: {email: 'private@example.test'}}
  ]});
  await assert.rejects(pack.syncDelta('shard-1'), /unsupported fields/);
});

test('a full-snapshot delta resets old overlay state', async () => {
  const fixture = await makeFixture(), storage = createMemoryRegionalPinStorage();
  const pack = createRegionalPinPackPreview({storage, transport: fixture.transport});
  await pack.sync(center);
  fixture.setDelta({catalogVersion: 'catalog-1', baseCursor: null, nextCursor: 'cursor-1', changes:[
    {pinId: 'base-a', state: {capturedToday: true}}
  ]});
  await pack.syncDelta('shard-1');
  fixture.setDelta({catalogVersion: 'catalog-1', baseCursor: 'cursor-1', nextCursor: 'cursor-2', reset: true, changes: []});
  await pack.syncDelta('shard-1');
  assert.equal((await pack.getPins('shard-1')).find(pin => pin.pinId === 'base-a').worldState, null);
});

test('IndexedDB storage persists across instances and atomically clears stale deltas on shard revision', async () => {
  const fixture = await makeFixture(), idb = fakeIndexedDB();
  const storage = createIndexedDbRegionalPinStorage({indexedDB: idb, name: 'regional-pack-test'});
  const pack = createRegionalPinPackPreview({storage, transport: fixture.transport});
  await pack.sync(center);
  fixture.setDelta({catalogVersion: 'catalog-1', baseCursor: null, nextCursor: 'cursor-1', changes: [
    {pinId: 'base-a', state: {capturedToday: true}}
  ]});
  await pack.syncDelta('shard-1');
  assert.equal((await pack.getPins('shard-1')).find(pin => pin.pinId === 'base-a').worldState.capturedToday, true);

  fixture.setDescriptor({...fixture.descriptor, revision: 'r2'});
  fixture.setRevision('manifest-2');
  await pack.sync(center);
  const reopened = createIndexedDbRegionalPinStorage({indexedDB: idb, name: 'regional-pack-test'});
  assert.equal((await reopened.getManifest()).revision, 'manifest-2');
  assert.equal((await reopened.getShard('shard-1')).revision, 'r2');
  assert.equal(await reopened.getDelta('shard-1'), null);
  await reopened.clear();
  assert.equal(await reopened.getManifest(), null);
  await storage.close(); await reopened.close();
});
