import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadCacheModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/firestoreAuthoritativePinCache.js"
    )
  );
}

function buildReference() {
  return {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789"
  };
}

function buildPositiveRecord() {
  return {
    kind: "positive",
    source: {
      generatorVersion: 1,
      sourceType: "osm-way",
      sourceId: "123456789",
      orderedCoordinates: [
        { latitude: 0, longitude: 0 },
        { latitude: 0.000449661, longitude: 0 }
      ],
      spacingMetres: 50,
      fetchedAt: "2026-07-21T00:00:00.000Z"
    },
    cachedAt: "2026-07-21T00:00:00.000Z",
    expiresAt: "2026-08-20T00:00:00.000Z"
  };
}

function createFakeFirestore(storedValue, options = {}) {
  const calls = {
    collection: 0,
    doc: 0,
    get: 0,
    set: 0
  };

  return {
    firestore: {
      collection(name) {
        calls.collection += 1;
        return {
          doc(id) {
            calls.doc += 1;
            calls.lastCollectionName = name;
            calls.lastDocumentId = id;
            return {
              async get() {
                calls.get += 1;
                if (options.throwOnGet) {
                  throw new Error("get-failed");
                }

                return {
                  exists: storedValue !== null,
                  data() {
                    return storedValue;
                  }
                };
              },
              async set(value) {
                calls.set += 1;
                if (options.throwOnSet) {
                  throw new Error("set-failed");
                }

                calls.lastSetValue = value;
              }
            };
          }
        };
      }
    },
    calls
  };
}

test("document id is deterministic, lowercase hex based, and safe for Firestore paths", async () => {
  const module = await loadCacheModule();
  const first = module.buildAuthoritativeSourceCacheDocumentId(buildReference());
  const second = module.buildAuthoritativeSourceCacheDocumentId(buildReference());
  const different = module.buildAuthoritativeSourceCacheDocumentId({
    ...buildReference(),
    sourceId: "987654321"
  });

  assert.equal(first, second);
  assert.notEqual(first, different);
  assert.equal(
    first,
    "osm-way-v1-e0f910e6c992bfc860c63b4b049471a083f0e6e5"
  );
  assert.doesNotMatch(first, /\//);
  assert.doesNotMatch(first, /\s/);
  assert.ok(first.length <= 52);
});

test("disabled read/write use zero Firestore operations", async () => {
  const module = await loadCacheModule();
  const fake = createFakeFirestore(null);
  const cache = module.createFirestoreAuthoritativeSourceCache({
    firestore: fake.firestore,
    collectionName: module.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
    readsEnabled: false,
    writesEnabled: false
  });

  assert.equal(await cache.read(buildReference()), null);
  await cache.write(buildReference(), buildPositiveRecord());
  assert.deepEqual(fake.calls, {
    collection: 0,
    doc: 0,
    get: 0,
    set: 0
  });
});

test("enabled read/write use one direct document operation and reject malformed stored records safely", async () => {
  const module = await loadCacheModule();
  const fake = createFakeFirestore({
    storageSchemaVersion:
      module.AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
    cacheRecord: buildPositiveRecord()
  });
  const cache = module.createFirestoreAuthoritativeSourceCache({
    firestore: fake.firestore,
    collectionName: module.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
    readsEnabled: true,
    writesEnabled: true
  });

  const readResult = await cache.read(buildReference());
  assert.equal(readResult.kind, "positive");
  assert.equal(fake.calls.get, 1);
  assert.equal(fake.calls.set, 0);

  await cache.write(buildReference(), buildPositiveRecord());
  assert.equal(fake.calls.set, 1);
  assert.equal(
    fake.calls.lastSetValue.storageSchemaVersion,
    module.AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION
  );

  const malformed = createFakeFirestore({
    storageSchemaVersion:
      module.AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
    cacheRecord: {
      ...buildPositiveRecord(),
      source: {
        ...buildPositiveRecord().source,
        sourceId: "999"
      }
    }
  });
  const malformedCache = module.createFirestoreAuthoritativeSourceCache({
    firestore: malformed.firestore,
    collectionName: module.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
    readsEnabled: true,
    writesEnabled: true
  });

  assert.equal(await malformedCache.read(buildReference()), null);
});
