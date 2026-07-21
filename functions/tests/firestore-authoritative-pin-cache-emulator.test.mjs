import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const localProjectId = "growgo-authoritative-cache-emulator-test";

async function loadCacheModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/firestoreAuthoritativePinCache.js"
    )
  );
}

async function loadHostModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/firestoreEmulatorHost.js"
    )
  );
}

function buildReference(sourceId) {
  return {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId
  };
}

function buildPositiveRecord(sourceId) {
  return {
    kind: "positive",
    source: {
      generatorVersion: 1,
      sourceType: "osm-way",
      sourceId,
      orderedCoordinates: [
        { latitude: -38.45, longitude: 145.24 },
        { latitude: -38.4495503, longitude: 145.24 }
      ],
      spacingMetres: 50,
      fetchedAt: "2026-07-21T00:00:00.000Z"
    },
    cachedAt: "2026-07-21T00:00:00.000Z",
    expiresAt: "2026-08-20T00:00:00.000Z"
  };
}

function buildNegativeRecord() {
  return {
    kind: "negative",
    code: "not-found",
    retryable: false,
    cachedAt: "2026-07-21T00:00:00.000Z",
    expiresAt: "2026-07-21T06:00:00.000Z"
  };
}

test("firestore authoritative source cache emulator integration stays localhost-only and skips safely when no safe emulator host is configured", async (t) => {
  const hostModule = await loadHostModule();
  const parsedHost = hostModule.parseSafeFirestoreEmulatorHost(
    process.env.FIRESTORE_EMULATOR_HOST
  );

  if (!parsedHost) {
    t.skip(
      "Local Firestore emulator unavailable or not safely configured via FIRESTORE_EMULATOR_HOST."
    );
    return;
  }

  process.env.FIRESTORE_EMULATOR_HOST = parsedHost.normalizedHostPort;
  process.env.GCLOUD_PROJECT = localProjectId;
  process.env.GOOGLE_CLOUD_PROJECT = localProjectId;

  const admin = require("firebase-admin");
  const cacheModule = await loadCacheModule();
  const appName = `authoritative-cache-emulator-${process.pid}-${Date.now()}`;
  const app = admin.initializeApp({ projectId: localProjectId }, appName);
  const firestore = admin.firestore(app);

  const positiveReference = buildReference("900000000000000001");
  const negativeReference = buildReference("900000000000000002");
  const malformedReference = buildReference("900000000000000003");
  const mismatchedReference = buildReference("900000000000000004");
  const schemaMismatchReference = buildReference("900000000000000005");
  const disabledWriteReference = buildReference("900000000000000006");

  const positiveDocumentId =
    cacheModule.buildAuthoritativeSourceCacheDocumentId(positiveReference);
  const negativeDocumentId =
    cacheModule.buildAuthoritativeSourceCacheDocumentId(negativeReference);
  const malformedDocumentId =
    cacheModule.buildAuthoritativeSourceCacheDocumentId(malformedReference);
  const mismatchedDocumentId =
    cacheModule.buildAuthoritativeSourceCacheDocumentId(mismatchedReference);
  const schemaMismatchDocumentId =
    cacheModule.buildAuthoritativeSourceCacheDocumentId(schemaMismatchReference);
  const disabledWriteDocumentId =
    cacheModule.buildAuthoritativeSourceCacheDocumentId(disabledWriteReference);

  const documentIds = [
    positiveDocumentId,
    negativeDocumentId,
    malformedDocumentId,
    mismatchedDocumentId,
    schemaMismatchDocumentId,
    disabledWriteDocumentId
  ];

  try {
    await cleanupKnownDocuments(firestore, cacheModule, documentIds);

    const readWriteCache = cacheModule.createFirestoreAuthoritativeSourceCache({
      firestore,
      collectionName: cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
      readsEnabled: true,
      writesEnabled: true
    });

    const positiveRecord = buildPositiveRecord(positiveReference.sourceId);
    await readWriteCache.write(positiveReference, positiveRecord);
    const positiveRead = await readWriteCache.read(positiveReference);
    assert.deepEqual(positiveRead, positiveRecord);

    const positiveSnapshot = await firestore
      .collection(cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME)
      .doc(positiveDocumentId)
      .get();
    assert.equal(positiveSnapshot.exists, true);

    const negativeRecord = buildNegativeRecord();
    await readWriteCache.write(negativeReference, negativeRecord);
    const negativeRead = await readWriteCache.read(negativeReference);
    assert.deepEqual(negativeRead, negativeRecord);

    const disabledReadCache = cacheModule.createFirestoreAuthoritativeSourceCache({
      firestore,
      collectionName: cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
      readsEnabled: false,
      writesEnabled: true
    });
    assert.equal(await disabledReadCache.read(positiveReference), null);

    const disabledWriteCache =
      cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore,
        collectionName:
          cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
        readsEnabled: true,
        writesEnabled: false
      });
    await disabledWriteCache.write(
      disabledWriteReference,
      buildPositiveRecord(disabledWriteReference.sourceId)
    );
    const disabledWriteSnapshot = await firestore
      .collection(cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME)
      .doc(disabledWriteDocumentId)
      .get();
    assert.equal(disabledWriteSnapshot.exists, false);

    await firestore
      .collection(cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME)
      .doc(malformedDocumentId)
      .set({
        storageSchemaVersion:
          cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
        cacheRecord: {
          ...buildPositiveRecord(malformedReference.sourceId),
          source: {
            ...buildPositiveRecord(malformedReference.sourceId).source,
            orderedCoordinates: [{ latitude: "bad", longitude: 145.24 }]
          }
        }
      });
    assert.equal(await readWriteCache.read(malformedReference), null);

    await firestore
      .collection(cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME)
      .doc(mismatchedDocumentId)
      .set({
        storageSchemaVersion:
          cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
        cacheRecord: {
          ...buildPositiveRecord(mismatchedReference.sourceId),
          source: {
            ...buildPositiveRecord(mismatchedReference.sourceId).source,
            sourceId: "900000000000000099"
          }
        }
      });
    assert.equal(await readWriteCache.read(mismatchedReference), null);

    await firestore
      .collection(cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME)
      .doc(schemaMismatchDocumentId)
      .set({
        storageSchemaVersion: 999,
        cacheRecord: buildPositiveRecord(schemaMismatchReference.sourceId)
      });
    assert.equal(await readWriteCache.read(schemaMismatchReference), null);
  } finally {
    await cleanupKnownDocuments(firestore, cacheModule, documentIds);
    await app.delete();
  }
});

async function cleanupKnownDocuments(firestore, cacheModule, documentIds) {
  for (const documentId of documentIds) {
    await firestore
      .collection(cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME)
      .doc(documentId)
      .delete();
  }
}
