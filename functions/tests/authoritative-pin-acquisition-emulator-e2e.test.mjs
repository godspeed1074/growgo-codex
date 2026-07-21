import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const localProjectId = "growgo-authoritative-acquisition-emulator-e2e";
const fixedNowIso = "2026-07-21T00:00:00.000Z";
const fixedNow = new Date(fixedNowIso);
const overpassEndpoint = "https://example.invalid/overpass";
const collectionName = "authoritativePinSourcesV1";

const successfulSourceFixture = Object.freeze({
  sourceId: "900000000000001111",
  orderedCoordinates: Object.freeze([
    Object.freeze({ latitude: -38.45, longitude: 145.24 }),
    Object.freeze({ latitude: -38.4495503, longitude: 145.24 }),
    Object.freeze({ latitude: -38.4491006, longitude: 145.2404 })
  ])
});

const captureSourceFixture = Object.freeze({
  sourceId: "900000000000009111",
  orderedCoordinates: Object.freeze([
    Object.freeze({ latitude: -38.451, longitude: 145.241 }),
    Object.freeze({ latitude: -38.4505503, longitude: 145.241 }),
    Object.freeze({ latitude: -38.4501006, longitude: 145.2414 })
  ])
});

async function loadAcquisitionModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/domain/pins/authoritativePinAcquisition.js"
    )
  );
}

async function loadSourceModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/authoritativePinSource.js")
  );
}

async function loadVerifierModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/authoritativePinVerifier.js")
  );
}

async function loadGeneratorModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/canonicalPinGenerator.js")
  );
}

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

async function loadTransportModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/overpassAuthoritativePinTransport.js"
    )
  );
}

async function loadCaptureModule() {
  return import(path.join(repoRoot, "functions/lib/api/capturePin.js"));
}

async function loadStoreModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/captures/captureRequestStore.js")
  );
}

function buildReference(sourceId) {
  return {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId
  };
}

function createFixedClock() {
  return {
    now() {
      return new Date(fixedNowIso);
    }
  };
}

function buildPolicy() {
  return {
    positiveFreshDurationSeconds: 7 * 24 * 60 * 60,
    positiveStaleLifetimeSeconds: 30 * 24 * 60 * 60,
    negativeCacheDurationSeconds: 6 * 60 * 60,
    rateLimitedMinimumRetryAfterSeconds: 60,
    rateLimitedMaximumRetryAfterSeconds: 6 * 60 * 60,
    maxTransportRequestsPerInvocation: 1,
    automaticRetryCount: 0
  };
}

function buildGates(overrides = {}) {
  return {
    enabled: true,
    cacheReadsEnabled: true,
    cacheWritesEnabled: true,
    remoteTransportEnabled: true,
    allowStaleFallback: false,
    ...overrides
  };
}

function buildSuccessOverpassBody(sourceId, orderedCoordinates) {
  return {
    elements: [
      {
        type: "way",
        id: Number(sourceId),
        geometry: orderedCoordinates.map((coordinate) => ({
          lat: coordinate.latitude,
          lon: coordinate.longitude
        }))
      }
    ]
  };
}

function createFakeHttpClient(routeMap) {
  const calls = [];

  return {
    httpClient: {
      async request(input) {
        calls.push(input);
        const sourceId = extractWayIdFromQuery(input.body);
        const route = routeMap.get(sourceId);

        if (!route) {
          throw new Error(`Missing fake HTTP route for sourceId ${sourceId}.`);
        }

        if (route.throwError) {
          throw route.throwError;
        }

        return route.response;
      }
    },
    calls
  };
}

function extractWayIdFromQuery(body) {
  const match = /^.*way\((\d+)\);/m.exec(String(body));
  if (!match) {
    throw new Error(`Unable to extract Overpass sourceId from body: ${body}`);
  }

  return match[1];
}

function createCountingFirestoreAdapter(firestore) {
  const counts = {
    reads: 0,
    writes: 0
  };

  return {
    firestore: {
      collection(name) {
        return {
          doc(documentId) {
            const directDocument = firestore.collection(name).doc(documentId);

            return {
              async get() {
                counts.reads += 1;
                return directDocument.get();
              },
              async set(value) {
                counts.writes += 1;
                return directDocument.set(value);
              }
            };
          }
        };
      }
    },
    counts
  };
}

function createCountingProvider(provider) {
  const calls = [];

  return {
    provider: {
      async getSourceGeometry(reference) {
        calls.push(reference);
        return provider.getSourceGeometry(reference);
      }
    },
    calls
  };
}

function createFakePersistence(storeModule) {
  const requestDocuments = new Map();
  const counts = {
    ensurePlayerExists: 0,
    getStoredRequest: 0,
    createDeferredRequest: 0
  };

  return {
    persistence: {
      async ensurePlayerExists() {
        counts.ensurePlayerExists += 1;
      },
      async getStoredRequest(requestKey) {
        counts.getStoredRequest += 1;
        return requestDocuments.get(requestKey) ?? null;
      },
      async createDeferredRequest({ uid, requestFingerprint, request }) {
        counts.createDeferredRequest += 1;
        const requestKey = storeModule.buildCaptureRequestKey(
          uid,
          request.requestId
        );

        if (requestDocuments.has(requestKey)) {
          const error = new Error("already exists");
          error.code = 6;
          throw error;
        }

        requestDocuments.set(
          requestKey,
          storeModule.buildDeferredCaptureRequestDocument({
            uid,
            requestFingerprint,
            request,
            now: {
              toDate() {
                return new Date(fixedNowIso);
              }
            }
          })
        );
      }
    },
    requestDocuments,
    counts
  };
}

function buildPositiveCacheRecord(sourceFixture, options = {}) {
  return {
    kind: "positive",
    source: {
      ...buildReference(sourceFixture.sourceId),
      orderedCoordinates: sourceFixture.orderedCoordinates,
      spacingMetres: 50,
      fetchedAt: options.fetchedAt ?? fixedNowIso
    },
    cachedAt: options.cachedAt ?? fixedNowIso,
    expiresAt: options.expiresAt ?? "2026-08-20T00:00:00.000Z"
  };
}

async function deleteKnownCacheDocument(firestore, documentId) {
  await firestore.collection(collectionName).doc(documentId).delete();
}

async function readCacheDocument(firestore, documentId) {
  return firestore.collection(collectionName).doc(documentId).get();
}

test("authoritative acquisition emulator end-to-end stays local, preserves deferred capture semantics, and skips safely without a loopback emulator", async (t) => {
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
  const acquisitionModule = await loadAcquisitionModule();
  const sourceModule = await loadSourceModule();
  const verifierModule = await loadVerifierModule();
  const generatorModule = await loadGeneratorModule();
  const cacheModule = await loadCacheModule();
  const transportModule = await loadTransportModule();
  const captureModule = await loadCaptureModule();
  const storeModule = await loadStoreModule();

  const policy = buildPolicy();
  const clock = createFixedClock();
  const appName = `authoritative-acquisition-e2e-${process.pid}-${Date.now()}`;
  const app = admin.initializeApp({ projectId: localProjectId }, appName);
  const firestore = admin.firestore(app);

  const caseDocumentIds = [
    successfulSourceFixture.sourceId,
    "900000000000001112",
    "900000000000001113",
    "900000000000001114",
    "900000000000001115",
    captureSourceFixture.sourceId
  ].map((sourceId) =>
    cacheModule.buildAuthoritativeSourceCacheDocumentId(buildReference(sourceId))
  );

  try {
    for (const documentId of caseDocumentIds) {
      await deleteKnownCacheDocument(firestore, documentId);
    }

    await t.test("case 1: cache miss uses one fake transport request and writes one deterministic cache record", async () => {
      const reference = buildReference(successfulSourceFixture.sourceId);
      const documentId =
        cacheModule.buildAuthoritativeSourceCacheDocumentId(reference);
      const fakeHttp = createFakeHttpClient(
        new Map([
          [
            successfulSourceFixture.sourceId,
            {
              response: {
                status: 200,
                headers: {},
                body: buildSuccessOverpassBody(
                  successfulSourceFixture.sourceId,
                  successfulSourceFixture.orderedCoordinates
                )
              }
            }
          ]
        ])
      );
      const countingFirestore = createCountingFirestoreAdapter(firestore);
      const cache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: countingFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: true
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: fakeHttp.httpClient,
        endpoint: overpassEndpoint,
        enabled: true,
        clock,
        timeoutMilliseconds:
          transportModule.OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS
      });

      const result = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache,
        clock,
        policy,
        gates: buildGates()
      });

      assert.equal(result.ok, true);
      assert.equal(result.cacheStatus, "transport-refresh");
      assert.equal(countingFirestore.counts.reads, 1);
      assert.equal(countingFirestore.counts.writes, 1);
      assert.equal(fakeHttp.calls.length, 1);
      assert.equal(
        fakeHttp.calls[0].body,
        "[out:json][timeout:5];\nway(900000000000001111);\nout geom;"
      );
      assert.deepEqual(result.source.orderedCoordinates, [
        ...successfulSourceFixture.orderedCoordinates
      ]);

      const snapshot = await readCacheDocument(firestore, documentId);
      assert.equal(snapshot.exists, true);
      assert.deepEqual(snapshot.data(), {
        storageSchemaVersion:
          cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
        cacheRecord: buildPositiveCacheRecord(successfulSourceFixture)
      });
    });

    await t.test("case 2: fresh cache hit performs zero additional HTTP requests and zero extra writes", async () => {
      const reference = buildReference(successfulSourceFixture.sourceId);
      const fakeHttp = createFakeHttpClient(
        new Map([
          [
            successfulSourceFixture.sourceId,
            {
              response: {
                status: 200,
                headers: {},
                body: buildSuccessOverpassBody(
                  successfulSourceFixture.sourceId,
                  successfulSourceFixture.orderedCoordinates
                )
              }
            }
          ]
        ])
      );
      const countingFirestore = createCountingFirestoreAdapter(firestore);
      const cache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: countingFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: true
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: fakeHttp.httpClient,
        endpoint: overpassEndpoint,
        enabled: true,
        clock,
        timeoutMilliseconds:
          transportModule.OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS
      });

      const result = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache,
        clock,
        policy,
        gates: buildGates()
      });

      assert.equal(result.ok, true);
      assert.equal(result.cacheStatus, "positive-hit");
      assert.equal(countingFirestore.counts.reads, 1);
      assert.equal(countingFirestore.counts.writes, 0);
      assert.equal(fakeHttp.calls.length, 0);
      assert.deepEqual(result.source.orderedCoordinates, [
        ...successfulSourceFixture.orderedCoordinates
      ]);
    });

    await t.test("case 3: real provider, real generator, and real verifier succeed without reordering coordinates", async () => {
      const reference = buildReference(successfulSourceFixture.sourceId);
      const countingFirestore = createCountingFirestoreAdapter(firestore);
      const cache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: countingFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: false
      });
      const provider = sourceModule.createAuthoritativePinSourceProvider({
        acquisitionGates: buildGates({
          cacheWritesEnabled: false,
          remoteTransportEnabled: false
        }),
        cache,
        transport: acquisitionModule.createDisabledAuthoritativeSourceTransport(),
        clock,
        policy
      });

      const geometry = await provider.getSourceGeometry(reference);
      assert.notEqual(geometry, null);
      assert.deepEqual(geometry.orderedCoordinates, [
        ...successfulSourceFixture.orderedCoordinates
      ]);

      const canonicalPins = generatorModule.generateCanonicalPinsForWay(geometry);
      const canonicalPin = canonicalPins[1];
      assert.ok(canonicalPin);

      const verification = await verifierModule.verifyAuthoritativeCanonicalPin({
        input: {
          pinId: canonicalPin.pinId,
          submittedLatitude: canonicalPin.latitude,
          submittedLongitude: canonicalPin.longitude
        },
        provider
      });

      assert.equal(verification.ok, true);
      assert.equal(verification.canonicalPin.sourceId, reference.sourceId);
      assert.equal(verification.canonicalPin.positionIndex, 1);
      assert.ok(
        verification.submittedCoordinateErrorMetres <=
          verifierModule.AUTHORITATIVE_PIN_SUBMITTED_COORDINATE_TOLERANCE_METRES
      );
      assert.equal(countingFirestore.counts.reads, 2);
      assert.equal(countingFirestore.counts.writes, 0);
    });

    await t.test("case 4: cached positive source succeeds with remote transport disabled", async () => {
      const reference = buildReference(successfulSourceFixture.sourceId);
      const countingFirestore = createCountingFirestoreAdapter(firestore);
      const cache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: countingFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: false
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: createFakeHttpClient(new Map()).httpClient,
        endpoint: overpassEndpoint,
        enabled: false,
        clock,
        timeoutMilliseconds:
          transportModule.OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS
      });

      const result = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache,
        clock,
        policy,
        gates: buildGates({
          cacheWritesEnabled: false,
          remoteTransportEnabled: false
        })
      });

      assert.equal(result.ok, true);
      assert.equal(result.cacheStatus, "positive-hit");
      assert.equal(countingFirestore.counts.reads, 1);
      assert.equal(countingFirestore.counts.writes, 0);
    });

    await t.test("case 5: disabled acquisition performs zero cache and zero HTTP activity", async () => {
      const reference = buildReference("900000000000001112");
      const fakeHttp = createFakeHttpClient(
        new Map([
          [
            reference.sourceId,
            {
              response: {
                status: 200,
                headers: {},
                body: buildSuccessOverpassBody(
                  reference.sourceId,
                  successfulSourceFixture.orderedCoordinates
                )
              }
            }
          ]
        ])
      );
      const countingFirestore = createCountingFirestoreAdapter(firestore);
      const cache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: countingFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: true
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: fakeHttp.httpClient,
        endpoint: overpassEndpoint,
        enabled: true,
        clock,
        timeoutMilliseconds: 5000
      });

      const result = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache,
        clock,
        policy,
        gates: buildGates({
          enabled: false,
          cacheReadsEnabled: false,
          cacheWritesEnabled: false,
          remoteTransportEnabled: false
        })
      });

      assert.equal(result.ok, false);
      assert.equal(result.code, "transport-failed");
      assert.equal(result.cacheStatus, "budget-blocked");
      assert.equal(countingFirestore.counts.reads, 0);
      assert.equal(countingFirestore.counts.writes, 0);
      assert.equal(fakeHttp.calls.length, 0);
    });

    await t.test("case 6: cache miss with remote transport disabled reads at most once and writes nothing", async () => {
      const reference = buildReference("900000000000001113");
      const fakeHttp = createFakeHttpClient(new Map());
      const countingFirestore = createCountingFirestoreAdapter(firestore);
      const cache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: countingFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: false
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: fakeHttp.httpClient,
        endpoint: overpassEndpoint,
        enabled: false,
        clock,
        timeoutMilliseconds: 5000
      });

      const result = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache,
        clock,
        policy,
        gates: buildGates({
          cacheWritesEnabled: false,
          remoteTransportEnabled: false
        })
      });

      assert.equal(result.ok, false);
      assert.equal(result.code, "transport-failed");
      assert.equal(result.cacheStatus, "budget-blocked");
      assert.equal(countingFirestore.counts.reads, 1);
      assert.equal(countingFirestore.counts.writes, 0);
      assert.equal(fakeHttp.calls.length, 0);
    });

    await t.test("case 7: not-found response writes one negative cache record and the second acquisition stays local", async () => {
      const reference = buildReference("900000000000001114");
      const documentId =
        cacheModule.buildAuthoritativeSourceCacheDocumentId(reference);
      const fakeHttp = createFakeHttpClient(
        new Map([
          [
            reference.sourceId,
            {
              response: {
                status: 404,
                headers: {},
                body: { elements: [] }
              }
            }
          ]
        ])
      );
      const firstFirestore = createCountingFirestoreAdapter(firestore);
      const firstCache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: firstFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: true
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: fakeHttp.httpClient,
        endpoint: overpassEndpoint,
        enabled: true,
        clock,
        timeoutMilliseconds: 5000
      });

      const firstResult = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache: firstCache,
        clock,
        policy,
        gates: buildGates()
      });

      assert.equal(firstResult.ok, false);
      assert.equal(firstResult.code, "not-found");
      assert.equal(firstFirestore.counts.reads, 1);
      assert.equal(firstFirestore.counts.writes, 1);
      assert.equal(fakeHttp.calls.length, 1);

      const negativeSnapshot = await readCacheDocument(firestore, documentId);
      assert.equal(negativeSnapshot.exists, true);
      assert.equal(negativeSnapshot.data().cacheRecord.kind, "negative");
      assert.equal(negativeSnapshot.data().cacheRecord.code, "not-found");
      assert.equal(
        Object.hasOwn(negativeSnapshot.data().cacheRecord, "source"),
        false
      );
      assert.equal(
        Object.hasOwn(negativeSnapshot.data().cacheRecord, "body"),
        false
      );

      const secondFirestore = createCountingFirestoreAdapter(firestore);
      const secondCache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: secondFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: true
      });
      const secondResult = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache: secondCache,
        clock,
        policy,
        gates: buildGates()
      });

      assert.equal(secondResult.ok, false);
      assert.equal(secondResult.code, "not-found");
      assert.equal(secondResult.cacheStatus, "negative-hit");
      assert.equal(secondFirestore.counts.reads, 1);
      assert.equal(secondFirestore.counts.writes, 0);
      assert.equal(fakeHttp.calls.length, 1);
    });

    await t.test("case 8: malformed or incomplete geometry writes only a negative cache record and does not retry", async () => {
      const reference = buildReference("900000000000001115");
      const documentId =
        cacheModule.buildAuthoritativeSourceCacheDocumentId(reference);
      const fakeHttp = createFakeHttpClient(
        new Map([
          [
            reference.sourceId,
            {
              response: {
                status: 200,
                headers: {},
                body: {
                  elements: [
                    {
                      type: "way",
                      id: Number(reference.sourceId),
                      geometry: [{ lat: -38.45, lon: 145.24 }]
                    }
                  ]
                }
              }
            }
          ]
        ])
      );
      const firstFirestore = createCountingFirestoreAdapter(firestore);
      const firstCache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: firstFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: true
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: fakeHttp.httpClient,
        endpoint: overpassEndpoint,
        enabled: true,
        clock,
        timeoutMilliseconds: 5000
      });

      const firstResult = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache: firstCache,
        clock,
        policy,
        gates: buildGates()
      });

      assert.equal(firstResult.ok, false);
      assert.equal(firstResult.code, "source-incomplete");
      assert.equal(firstFirestore.counts.reads, 1);
      assert.equal(firstFirestore.counts.writes, 1);
      assert.equal(fakeHttp.calls.length, 1);

      const negativeSnapshot = await readCacheDocument(firestore, documentId);
      assert.equal(negativeSnapshot.exists, true);
      assert.equal(negativeSnapshot.data().cacheRecord.kind, "negative");
      assert.equal(negativeSnapshot.data().cacheRecord.code, "source-incomplete");
      assert.equal(
        Object.hasOwn(negativeSnapshot.data().cacheRecord, "source"),
        false
      );

      const secondFirestore = createCountingFirestoreAdapter(firestore);
      const secondCache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: secondFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: true
      });
      const secondResult = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache: secondCache,
        clock,
        policy,
        gates: buildGates()
      });

      assert.equal(secondResult.ok, false);
      assert.equal(secondResult.code, "source-incomplete");
      assert.equal(secondResult.cacheStatus, "negative-hit");
      assert.equal(secondFirestore.counts.reads, 1);
      assert.equal(secondFirestore.counts.writes, 0);
      assert.equal(fakeHttp.calls.length, 1);
    });

    await t.test("case 9: stale fallback remains disabled by default and works only when explicitly enabled in test gates", async () => {
      const reference = buildReference("900000000000001116");
      const documentId =
        cacheModule.buildAuthoritativeSourceCacheDocumentId(reference);
      const staleRecord = buildPositiveCacheRecord(
        {
          sourceId: reference.sourceId,
          orderedCoordinates: successfulSourceFixture.orderedCoordinates
        },
        {
          cachedAt: "2026-07-10T00:00:00.000Z",
          expiresAt: "2026-08-09T00:00:00.000Z",
          fetchedAt: "2026-07-10T00:00:00.000Z"
        }
      );

      await firestore.collection(collectionName).doc(documentId).set({
        storageSchemaVersion:
          cacheModule.AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
        cacheRecord: staleRecord
      });

      const timeoutHttp = createFakeHttpClient(
        new Map([
          [
            reference.sourceId,
            {
              response: {
                status: 408,
                headers: {},
                body: {}
              }
            }
          ]
        ])
      );

      const disabledFirestore = createCountingFirestoreAdapter(firestore);
      const disabledCache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: disabledFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: false
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: timeoutHttp.httpClient,
        endpoint: overpassEndpoint,
        enabled: true,
        clock,
        timeoutMilliseconds: 5000
      });

      const disabledResult = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache: disabledCache,
        clock,
        policy,
        gates: buildGates({
          cacheWritesEnabled: false,
          allowStaleFallback: false
        })
      });

      assert.equal(disabledResult.ok, false);
      assert.equal(disabledResult.code, "timeout");
      assert.equal(disabledFirestore.counts.reads, 1);
      assert.equal(disabledFirestore.counts.writes, 0);
      assert.equal(timeoutHttp.calls.length, 1);

      const enabledFirestore = createCountingFirestoreAdapter(firestore);
      const enabledCache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: enabledFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: false
      });
      const enabledResult = await acquisitionModule.acquireAuthoritativePinSource({
        reference,
        transport,
        cache: enabledCache,
        clock,
        policy,
        gates: buildGates({
          cacheWritesEnabled: false,
          allowStaleFallback: true
        })
      });

      assert.equal(enabledResult.ok, true);
      assert.equal(enabledResult.cacheStatus, "stale-fallback");
      assert.equal(enabledFirestore.counts.reads, 1);
      assert.equal(enabledFirestore.counts.writes, 0);
      assert.equal(timeoutHttp.calls.length, 2);

      await deleteKnownCacheDocument(firestore, documentId);
    });

    await t.test("capturePin regression: verified authoritative evidence still stores only a deferred unrewarded result and replay stays local", async () => {
      const reference = buildReference(captureSourceFixture.sourceId);
      const documentId =
        cacheModule.buildAuthoritativeSourceCacheDocumentId(reference);
      const fakeHttp = createFakeHttpClient(
        new Map([
          [
            reference.sourceId,
            {
              response: {
                status: 200,
                headers: {},
                body: buildSuccessOverpassBody(
                  captureSourceFixture.sourceId,
                  captureSourceFixture.orderedCoordinates
                )
              }
            }
          ]
        ])
      );
      const countingFirestore = createCountingFirestoreAdapter(firestore);
      const cache = cacheModule.createFirestoreAuthoritativeSourceCache({
        firestore: countingFirestore.firestore,
        collectionName,
        readsEnabled: true,
        writesEnabled: true
      });
      const transport = transportModule.createOverpassAuthoritativePinTransport({
        httpClient: fakeHttp.httpClient,
        endpoint: overpassEndpoint,
        enabled: true,
        clock,
        timeoutMilliseconds: 5000
      });
      const realProvider = sourceModule.createAuthoritativePinSourceProvider({
        acquisitionGates: buildGates(),
        cache,
        transport,
        clock,
        policy
      });
      const countingProvider = createCountingProvider(realProvider);
      const fakePersistence = createFakePersistence(storeModule);

      const canonicalPins = generatorModule.generateCanonicalPinsForWay({
        generatorVersion: 1,
        sourceType: "osm-way",
        sourceId: captureSourceFixture.sourceId,
        orderedCoordinates: captureSourceFixture.orderedCoordinates,
        spacingMetres: 50
      });
      const canonicalPin = canonicalPins[1];
      const normalizedRequest = storeModule.normalizeCapturePinRequest({
        requestId: "capture-authoritative-emulator-001",
        pinId: canonicalPin.pinId,
        latitude: canonicalPin.latitude,
        longitude: canonicalPin.longitude,
        accuracyMetres: 10,
        clientCapturedAt: fixedNowIso
      });

      const firstResponse =
        await captureModule.processValidatedCapturePinRequest({
          uid: "uid-authoritative-emulator",
          normalizedRequest,
          dependencies: {
            authoritativePinSourceProvider: countingProvider.provider,
            persistence: fakePersistence.persistence
          }
        });

      assert.equal(firstResponse.ok, false);
      assert.equal(firstResponse.accepted, false);
      assert.equal(firstResponse.rewardGranted, false);
      assert.equal(firstResponse.status, "eligibility-deferred");
      assert.equal(
        firstResponse.code,
        "authoritative-pin-verification-unavailable"
      );
      assert.equal(fakeHttp.calls.length, 1);
      assert.equal(countingFirestore.counts.reads, 1);
      assert.equal(countingFirestore.counts.writes, 1);
      assert.equal(countingProvider.calls.length, 1);
      assert.equal(fakePersistence.requestDocuments.size, 1);
      assert.equal(
        Object.hasOwn(firstResponse, "xp") ||
          Object.hasOwn(firstResponse, "coins") ||
          Object.hasOwn(firstResponse, "level") ||
          Object.hasOwn(firstResponse, "inventory") ||
          Object.hasOwn(firstResponse, "ownership") ||
          Object.hasOwn(firstResponse, "captureEvents") ||
          Object.hasOwn(firstResponse, "pinStates"),
        false
      );

      const storedRequest = fakePersistence.requestDocuments.values().next().value;
      assert.equal(storedRequest.accepted, false);
      assert.equal(storedRequest.rewardGranted, false);
      assert.equal(storedRequest.status, "eligibility-deferred");
      assert.equal(Object.hasOwn(storedRequest, "xp"), false);
      assert.equal(Object.hasOwn(storedRequest, "inventory"), false);
      assert.equal(Object.hasOwn(storedRequest, "captureEvents"), false);
      assert.equal(Object.hasOwn(storedRequest, "pinStates"), false);

      const evidence = await captureModule.resolveCapturePinVerificationEvidence({
        normalizedRequest,
        authoritativePinSourceProvider: countingProvider.provider
      });

      assert.equal(evidence.verification.ok, true);
      assert.equal(
        evidence.internalReason,
        captureModule.CAPTURE_PIN_INTERNAL_REASON_VERIFIED_PROXIMITY_NOT_EVALUATED
      );

      const afterEvidenceHttpCalls = fakeHttp.calls.length;
      const afterEvidenceReads = countingFirestore.counts.reads;
      const afterEvidenceWrites = countingFirestore.counts.writes;
      const afterEvidenceProviderCalls = countingProvider.calls.length;

      const replayResponse =
        await captureModule.processValidatedCapturePinRequest({
          uid: "uid-authoritative-emulator",
          normalizedRequest,
          dependencies: {
            authoritativePinSourceProvider: countingProvider.provider,
            persistence: fakePersistence.persistence
          }
        });

      assert.equal(replayResponse.replayed, true);
      assert.equal(replayResponse.accepted, false);
      assert.equal(replayResponse.rewardGranted, false);
      assert.equal(fakeHttp.calls.length, afterEvidenceHttpCalls);
      assert.equal(countingFirestore.counts.reads, afterEvidenceReads);
      assert.equal(countingFirestore.counts.writes, afterEvidenceWrites);
      assert.equal(countingProvider.calls.length, afterEvidenceProviderCalls);

      const conflictingRequest = storeModule.normalizeCapturePinRequest({
        ...normalizedRequest,
        pinId: `${canonicalPin.pinId.slice(0, -1)}2`
      });

      await assert.rejects(
        () =>
          captureModule.processValidatedCapturePinRequest({
            uid: "uid-authoritative-emulator",
            normalizedRequest: conflictingRequest,
            dependencies: {
              authoritativePinSourceProvider: countingProvider.provider,
              persistence: fakePersistence.persistence
            }
          }),
        (error) =>
          error &&
          error.code === "already-exists" &&
          fakeHttp.calls.length === afterEvidenceHttpCalls &&
          countingFirestore.counts.reads === afterEvidenceReads &&
          countingFirestore.counts.writes === afterEvidenceWrites &&
          countingProvider.calls.length === afterEvidenceProviderCalls
      );

      const snapshot = await readCacheDocument(firestore, documentId);
      assert.equal(snapshot.exists, true);
    });
  } finally {
    for (const documentId of caseDocumentIds) {
      await deleteKnownCacheDocument(firestore, documentId);
    }

    await app.delete();
  }
});
