// Sandbox-only contract for the regional pin-pack experiment.
// Not imported by the live map and never authoritative for captures/rewards.

const MAX_RADIUS_KM = 100;
const MAX_SHARDS = 2_000;
const MAX_PACK_BYTES = 50 * 1024 * 1024;
const MAX_PINS_PER_SHARD = 100_000;
const DYNAMIC_FIELDS = new Set([
  "capturedToday", "ownerDisplay", "cropStage", "temporaryExpiresAt", "mailWaiting"
]);

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);

function validateCenter(center) {
  if (!isRecord(center) || !Number.isFinite(center.lat) || !Number.isFinite(center.lng) ||
      Math.abs(center.lat) > 85 || Math.abs(center.lng) > 180) {
    throw new TypeError("Invalid map-pack center.");
  }
}

function validateManifest(manifest, center, radiusKm) {
  if (!isRecord(manifest) || manifest.schemaVersion !== 1 ||
      typeof manifest.catalogVersion !== "string" || !manifest.catalogVersion ||
      typeof manifest.revision !== "string" || !manifest.revision ||
      !Array.isArray(manifest.shards) || manifest.shards.length > MAX_SHARDS ||
      manifest.radiusKm !== radiusKm ||
      !isRecord(manifest.center) || manifest.center.lat !== center.lat || manifest.center.lng !== center.lng) {
    throw new TypeError("Invalid regional pin-pack manifest.");
  }
  const ids = new Set();
  for (const descriptor of manifest.shards) {
    if (!isRecord(descriptor) || typeof descriptor.id !== "string" || !descriptor.id ||
        ids.has(descriptor.id) || typeof descriptor.revision !== "string" || !descriptor.revision ||
        !/^[a-f0-9]{64}$/i.test(descriptor.sha256) ||
        !Number.isSafeInteger(descriptor.byteSize) || descriptor.byteSize < 0 || descriptor.byteSize > MAX_PACK_BYTES) {
      throw new TypeError("Invalid pin-pack shard descriptor.");
    }
    ids.add(descriptor.id);
  }
  return manifest;
}

function normalizePins(pins) {
  if (!Array.isArray(pins) || pins.length > MAX_PINS_PER_SHARD) throw new TypeError("Invalid pin shard.");
  const ids = new Set();
  return pins.map(pin => {
    if (!isRecord(pin) || typeof pin.pinId !== "string" || !pin.pinId || ids.has(pin.pinId) ||
        !Number.isFinite(pin.latitude) || Math.abs(pin.latitude) > 90 ||
        !Number.isFinite(pin.longitude) || Math.abs(pin.longitude) > 180 ||
        typeof pin.type !== "string" || !pin.type || pin.type.length > 40) {
      throw new TypeError("Invalid static pin record.");
    }
    ids.add(pin.pinId);
    // Whitelist static fields; player/world state belongs to the delta layer.
    return Object.freeze({pinId: pin.pinId, latitude: pin.latitude, longitude: pin.longitude, type: pin.type});
  }).sort((a, b) => a.pinId.localeCompare(b.pinId));
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

async function sha256(text) {
  if (!globalThis.crypto?.subtle) throw new Error("SHA-256 verification is unavailable in this browser.");
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
}

function validateDelta(delta, {catalogVersion, cursor}) {
  if (!isRecord(delta) || delta.catalogVersion !== catalogVersion ||
      typeof delta.nextCursor !== "string" || !delta.nextCursor ||
      (delta.reset !== true && delta.baseCursor !== cursor) || !Array.isArray(delta.changes)) {
    throw new Error("Pin-state delta is out of sequence; fetch a fresh snapshot.");
  }
  const changes = delta.changes.map(change => {
    if (!isRecord(change) || typeof change.pinId !== "string" || !change.pinId) throw new TypeError("Invalid pin-state change.");
    if (change.deleted === true) return Object.freeze({pinId: change.pinId, deleted: true});
    if (!isRecord(change.state) || Object.keys(change.state).some(key => !DYNAMIC_FIELDS.has(key)))
      throw new TypeError("Pin-state delta contains unsupported fields.");
    return Object.freeze({pinId: change.pinId, state: Object.freeze({...change.state})});
  });
  return {nextCursor: delta.nextCursor, reset: delta.reset === true, changes};
}

/**
 * Storage adapter methods: getManifest, listShards/getShard, putDelta/getDelta,
 * clear. Transport methods: getManifest, getShard, getDelta. The IndexedDB
 * adapter below is for the sandbox prototype only; it is not connected to live
 * map code.
 */
export function createRegionalPinPackPreview({storage, transport, now = Date.now, maxPackBytes = MAX_PACK_BYTES}) {
  if (!storage || !transport || typeof storage.getManifest !== "function" ||
      typeof storage.listShards !== "function" || typeof transport.getManifest !== "function" ||
      typeof transport.getShard !== "function" || typeof transport.getDelta !== "function") {
    throw new TypeError("Regional pin-pack storage and transport adapters are required.");
  }
  if (!Number.isSafeInteger(maxPackBytes) || maxPackBytes <= 0 || maxPackBytes > MAX_PACK_BYTES)
    throw new TypeError("Invalid local pack storage budget.");

  async function sync(center, {radiusKm = MAX_RADIUS_KM} = {}) {
    validateCenter(center);
    if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > MAX_RADIUS_KM)
      throw new RangeError("Regional pin-pack radius must be between 0 and 100 km.");
    const previous = await storage.getManifest();
    const manifest = validateManifest(await transport.getManifest({center, radiusKm,
      knownRevision: previous?.revision ?? null}), center, radiusKm);
    const local = new Map((await storage.listShards()).map(shard => [shard.id, shard]));
    const staged = [];
    let bytesDownloaded = 0, shardsReused = 0;

    for (const descriptor of manifest.shards) {
      const cached = local.get(descriptor.id);
      if (cached?.catalogVersion === manifest.catalogVersion && cached.revision === descriptor.revision &&
          cached.sha256 === descriptor.sha256) {
        shardsReused++;
        continue;
      }
      const shard = await transport.getShard({id: descriptor.id, revision: descriptor.revision});
      if (!isRecord(shard) || shard.id !== descriptor.id || shard.revision !== descriptor.revision ||
          shard.catalogVersion !== manifest.catalogVersion) throw new Error("Downloaded shard does not match its manifest.");
      const pins = normalizePins(shard.pins);
      const text = canonicalJson(pins);
      const actualHash = await sha256(text);
      if (actualHash.toLowerCase() !== descriptor.sha256.toLowerCase() || shard.sha256 !== descriptor.sha256)
        throw new Error("Downloaded shard failed its integrity check.");
      const actualBytes = new TextEncoder().encode(text).byteLength;
      if (actualBytes !== descriptor.byteSize) throw new Error("Downloaded shard size does not match its manifest.");
      bytesDownloaded += actualBytes;
      staged.push({id: descriptor.id, revision: descriptor.revision, catalogVersion: manifest.catalogVersion,
        sha256: actualHash, pins, savedAt: now()});
    }

    const retainedBytes = (await storage.listShards()).filter(shard =>
      !staged.some(next => next.id === shard.id) && manifest.shards.some(item => item.id === shard.id &&
        item.revision === shard.revision && item.sha256 === shard.sha256)).reduce((sum, shard) => {
      return sum + new TextEncoder().encode(canonicalJson(shard.pins)).byteLength;
    }, 0);
    if (retainedBytes + bytesDownloaded > maxPackBytes) throw new RangeError("Regional pack exceeds the local storage budget.");

    // Validate every shard before committing the new catalog. IndexedDB storage
    // swaps the manifest/shards/tombstone cleanup in one read-write transaction.
    const removeIds = [...local.values()].filter(shard => shard.catalogVersion !== manifest.catalogVersion ||
      !manifest.shards.some(item => item.id === shard.id && item.revision === shard.revision && item.sha256 === shard.sha256))
      .map(shard => shard.id);
    const savedManifest = {...manifest, downloadedAt: now()};
    if (typeof storage.commitPack === "function") {
      await storage.commitPack({manifest: savedManifest, shards: staged, removeIds});
    } else {
      for (const id of removeIds) await storage.removeShard(id);
      for (const shard of staged) await storage.putShard(shard);
      await storage.putManifest(savedManifest);
    }
    return Object.freeze({revision: manifest.revision, catalogVersion: manifest.catalogVersion,
      shardsDownloaded: staged.length, shardsReused, bytesDownloaded, radiusKm});
  }

  async function syncDelta(shardId) {
    if (typeof shardId !== "string" || !shardId) throw new TypeError("A shard ID is required.");
    const manifest = await storage.getManifest();
    const shard = await storage.getShard(shardId);
    if (!manifest || !shard || shard.catalogVersion !== manifest.catalogVersion)
      throw new Error("Static shard is not available for this catalog.");
    const current = await storage.getDelta(shardId) ?? {cursor: null, states: {}};
    const checked = validateDelta(await transport.getDelta({shardId, catalogVersion: manifest.catalogVersion,
      cursor: current.cursor}), {catalogVersion: manifest.catalogVersion, cursor: current.cursor});
    const states = checked.reset ? {} : {...current.states};
    for (const change of checked.changes) {
      if (!shard.pins.some(pin => pin.pinId === change.pinId)) continue;
      if (change.deleted) delete states[change.pinId]; else states[change.pinId] = change.state;
    }
    await storage.putDelta(shardId, {catalogVersion: manifest.catalogVersion, cursor: checked.nextCursor, states});
    return Object.freeze({shardId, cursor: checked.nextCursor, changesApplied: checked.changes.length,
      reset: checked.reset});
  }

  async function getPins(shardId) {
    const shard = await storage.getShard(shardId);
    if (!shard) return [];
    const delta = await storage.getDelta(shardId);
    return shard.pins.map(pin => Object.freeze({...pin, worldState: delta?.states?.[pin.pinId] ?? null}));
  }

  return Object.freeze({sync, syncDelta, getPins,
    clear: () => storage.clear(),
    diagnostics: async () => {
      const manifest = await storage.getManifest();
      const shards = await storage.listShards();
      const bytes = shards.reduce((sum, shard) => sum + new TextEncoder().encode(canonicalJson(shard.pins)).byteLength, 0);
      return Object.freeze({catalogVersion: manifest?.catalogVersion ?? null, revision: manifest?.revision ?? null,
        shardCount: shards.length, bytes, maxPackBytes});
    }});
}

export function createMemoryRegionalPinStorage() {
  let manifest = null;
  const shards = new Map(), deltas = new Map();
  return {
    async getManifest() { return manifest; },
    async putManifest(value) { manifest = value; },
    async listShards() { return [...shards.values()]; },
    async getShard(id) { return shards.get(id) ?? null; },
    async putShard(value) { shards.set(value.id, value); },
    async removeShard(id) { shards.delete(id); deltas.delete(id); },
    async getDelta(id) { return deltas.get(id) ?? null; },
    async putDelta(id, value) { deltas.set(id, value); },
    async clear() { manifest = null; shards.clear(); deltas.clear(); }
  };
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local pin storage request failed."));
  });
}

function idbTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Local pin storage transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Local pin storage transaction aborted."));
  });
}

/** Persistent device storage for the sandbox pack prototype. */
export function createIndexedDbRegionalPinStorage({indexedDB = globalThis.indexedDB,
  name = "growgo-regional-pin-pack-preview", version = 1} = {}) {
  if (!indexedDB || typeof indexedDB.open !== "function") throw new Error("IndexedDB is not available.");
  const opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("shards")) db.createObjectStore("shards", {keyPath: "id"});
      if (!db.objectStoreNames.contains("deltas")) db.createObjectStore("deltas", {keyPath: "shardId"});
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", {keyPath: "key"});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local pin storage."));
    request.onblocked = () => reject(new Error("Local pin storage upgrade is blocked by another tab."));
  });

  async function read(storeName, key) {
    const db = await opening;
    const transaction = db.transaction([storeName], "readonly");
    const done = idbTransaction(transaction);
    const value = await idbRequest(transaction.objectStore(storeName).get(key));
    await done;
    return value;
  }

  return {
    async getManifest() { return (await read("meta", "manifest"))?.value ?? null; },
    async putManifest(value) {
      const db = await opening, tx = db.transaction(["meta"], "readwrite"), done = idbTransaction(tx);
      tx.objectStore("meta").put({key: "manifest", value}); await done;
    },
    async listShards() {
      const db = await opening, tx = db.transaction(["shards"], "readonly"), done = idbTransaction(tx);
      const values = await idbRequest(tx.objectStore("shards").getAll()); await done; return values;
    },
    async getShard(id) { return (await read("shards", id)) ?? null; },
    async putShard(value) {
      const db = await opening, tx = db.transaction(["shards"], "readwrite"), done = idbTransaction(tx);
      tx.objectStore("shards").put(value); await done;
    },
    async removeShard(id) {
      const db = await opening, tx = db.transaction(["shards", "deltas"], "readwrite"), done = idbTransaction(tx);
      tx.objectStore("shards").delete(id); tx.objectStore("deltas").delete(id); await done;
    },
    async getDelta(id) { return (await read("deltas", id))?.value ?? null; },
    async putDelta(id, value) {
      const db = await opening, tx = db.transaction(["deltas"], "readwrite"), done = idbTransaction(tx);
      tx.objectStore("deltas").put({shardId: id, value}); await done;
    },
    async commitPack({manifest, shards, removeIds}) {
      const db = await opening, tx = db.transaction(["meta", "shards", "deltas"], "readwrite"), done = idbTransaction(tx);
      const shardStore = tx.objectStore("shards"), deltaStore = tx.objectStore("deltas");
      for (const id of removeIds) { shardStore.delete(id); deltaStore.delete(id); }
      for (const shard of shards) shardStore.put(shard);
      tx.objectStore("meta").put({key: "manifest", value: manifest});
      await done;
    },
    async clear() {
      const db = await opening, tx = db.transaction(["meta", "shards", "deltas"], "readwrite"), done = idbTransaction(tx);
      tx.objectStore("meta").clear(); tx.objectStore("shards").clear(); tx.objectStore("deltas").clear(); await done;
    },
    async close() { (await opening).close(); }
  };
}
