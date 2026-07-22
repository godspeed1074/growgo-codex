import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

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

async function loadCaptureModule() {
  return import(path.join(repoRoot, "functions/lib/api/capturePin.js"));
}

async function loadStoreModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/captures/captureRequestStore.js")
  );
}

async function loadRuntimeConfigModule() {
  return import(path.join(repoRoot, "functions/lib/config/runtimeConfig.js"));
}

function buildReference() {
  return {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789"
  };
}

function buildPolicy() {
  return {
    positiveFreshDurationSeconds: 604800,
    positiveStaleLifetimeSeconds: 2592000,
    negativeCacheDurationSeconds: 21600,
    rateLimitedMinimumRetryAfterSeconds: 60,
    rateLimitedMaximumRetryAfterSeconds: 21600,
    maxTransportRequestsPerInvocation: 1,
    automaticRetryCount: 0
  };
}

function createFakeClock(now = "2026-07-21T00:00:00.000Z") {
  return { now: () => new Date(now) };
}

function createFakeCache(initialRecord = null) {
  let stored = initialRecord;
  const calls = { read: 0, write: 0 };
  return {
    cache: {
      async read() {
        calls.read += 1;
        return stored;
      },
      async write(_reference, record) {
        calls.write += 1;
        stored = record;
      }
    },
    calls
  };
}

function createFakeTransport(resultFactory) {
  const calls = [];
  return {
    transport: {
      async fetchSource(reference) {
        calls.push(reference);
        return resultFactory(reference);
      }
    },
    calls
  };
}

function createFakePersistence(storeModule) {
  const requestDocuments = new Map();
  const reservations = new Map();
  return {
    persistence: {
      async ensurePlayerExists() {},
      async reserveDeferredRequest({ uid, requestFingerprint, request }) {
        const requestKey = storeModule.buildCaptureRequestKey(
          uid,
          request.requestId
        );
        const reservationKey = JSON.stringify({
          uid,
          operation: "capturePin",
          requestId: request.requestId
        });
        const existingReservation = reservations.get(reservationKey) ?? null;

        if (existingReservation) {
          if (existingReservation.requestFingerprint !== requestFingerprint) {
            const { HttpsError } = await import(
              path.join(
                repoRoot,
                "functions/node_modules/firebase-functions/lib/common/providers/https.js"
              )
            );
            throw new HttpsError(
              "already-exists",
              "A different capture request already used this requestId for the authenticated player."
            );
          }

          return {
            classification: "exact-replay",
            reservationKey,
            captureRequestKey: requestKey,
            requestFingerprint,
            response: {
              ...storeModule.buildInitialDeferredCaptureResponse(request),
              replayed: true,
              message:
                "The original deferred result was returned without applying any additional write or reward."
            }
          };
        }

        requestDocuments.set(
          requestKey,
          storeModule.buildDeferredCaptureRequestDocument({
            uid,
            requestFingerprint,
            request,
            now: { toDate: () => new Date("2026-07-21T00:00:00.000Z") }
          })
        );
        reservations.set(reservationKey, { requestFingerprint });

        return {
          classification: "first-request",
          reservationKey,
          captureRequestKey: requestKey,
          requestFingerprint,
          response: storeModule.buildInitialDeferredCaptureResponse(request)
        };
      }
    }
  };
}

test("production gates default false, malformed config fails closed, and runtime mutation is not supported", async () => {
  const runtime = await loadRuntimeConfigModule();
  assert.equal(runtime.runtimeConfig.authoritativeSourceAcquisition.enabled, false);
  assert.equal(runtime.runtimeConfig.authoritativeSourceAcquisition.cacheReadsEnabled, false);
  assert.equal(runtime.runtimeConfig.authoritativeSourceAcquisition.cacheWritesEnabled, false);
  assert.equal(runtime.runtimeConfig.authoritativeSourceAcquisition.remoteTransportEnabled, false);
  assert.equal(runtime.runtimeConfig.authoritativeSourceAcquisition.allowStaleFallback, false);
  assert.equal(Object.isFrozen(runtime.runtimeConfig.authoritativeSourceAcquisition), true);

  const malformed = runtime.validateAuthoritativeSourceAcquisitionConfig({
    enabled: "true",
    cacheReadsEnabled: 1,
    cacheWritesEnabled: "true",
    remoteTransportEnabled: 1,
    allowStaleFallback: "true"
  });
  assert.equal(malformed.enabled, false);
  assert.equal(malformed.cacheReadsEnabled, false);
  assert.equal(malformed.cacheWritesEnabled, false);
  assert.equal(malformed.remoteTransportEnabled, false);
  assert.equal(malformed.allowStaleFallback, false);
});

test("disabled production-style acquisition performs zero cache and zero transport activity, while enabled test gates allow one read and one transport request", async () => {
  const acquisition = await loadAcquisitionModule();
  const disabledCache = createFakeCache(null);
  const disabledTransport = createFakeTransport(() => {
    throw new Error("transport-should-not-run");
  });

  const disabled = await acquisition.acquireAuthoritativePinSource({
    reference: buildReference(),
    cache: disabledCache.cache,
    transport: disabledTransport.transport,
    clock: createFakeClock(),
    policy: buildPolicy(),
    gates: {
      enabled: false,
      cacheReadsEnabled: false,
      cacheWritesEnabled: false,
      remoteTransportEnabled: false,
      allowStaleFallback: false
    }
  });
  assert.equal(disabled.ok, false);
  assert.equal(disabledCache.calls.read, 0);
  assert.equal(disabledCache.calls.write, 0);
  assert.equal(disabledTransport.calls.length, 0);

  const enabledCache = createFakeCache(null);
  const enabledTransport = createFakeTransport((reference) => ({
    ok: true,
    source: {
      ...reference,
      orderedCoordinates: [
        { latitude: 0, longitude: 0 },
        { latitude: 0.000449661, longitude: 0 }
      ],
      spacingMetres: 50,
      fetchedAt: "2026-07-21T00:00:00.000Z"
    }
  }));

  const enabled = await acquisition.acquireAuthoritativePinSource({
    reference: buildReference(),
    cache: enabledCache.cache,
    transport: enabledTransport.transport,
    clock: createFakeClock(),
    policy: buildPolicy(),
    gates: {
      enabled: true,
      cacheReadsEnabled: true,
      cacheWritesEnabled: true,
      remoteTransportEnabled: true,
      allowStaleFallback: false
    }
  });
  assert.equal(enabled.ok, true);
  assert.equal(enabled.cacheStatus, "transport-refresh");
  assert.equal(enabledCache.calls.read, 1);
  assert.equal(enabledCache.calls.write, 1);
  assert.equal(enabledTransport.calls.length, 1);
});

test("production-style capture path with acquisition disabled still performs zero adapter activity and remains deferred", async () => {
  const sourceModule = await loadSourceModule();
  const captureModule = await loadCaptureModule();
  const storeModule = await loadStoreModule();
  const fakePersistence = createFakePersistence(storeModule);
  const cache = createFakeCache(null);
  const transport = createFakeTransport(() => ({
    ok: true,
    source: {
      ...buildReference(),
      orderedCoordinates: [
        { latitude: 0, longitude: 0 },
        { latitude: 0.000449661, longitude: 0 }
      ],
      spacingMetres: 50,
      fetchedAt: "2026-07-21T00:00:00.000Z"
    }
  }));

  const provider = sourceModule.createAuthoritativePinSourceProvider({
    acquisitionGates: {
      enabled: false,
      cacheReadsEnabled: false,
      cacheWritesEnabled: false,
      remoteTransportEnabled: false,
      allowStaleFallback: false
    },
    cache: cache.cache,
    transport: transport.transport,
    clock: createFakeClock(),
    policy: buildPolicy()
  });

  const response = await captureModule.processValidatedCapturePinRequest({
    uid: "uid-test",
    normalizedRequest: storeModule.normalizeCapturePinRequest({
      requestId: "capture-infra-001",
      pinId: "ggpin:v1:osm-way:123456789:0",
      latitude: 0,
      longitude: 0,
      accuracyMetres: 10,
      clientCapturedAt: "2026-07-21T00:00:00.000Z"
    }),
    dependencies: {
      authoritativePinSourceProvider: provider,
      persistence: fakePersistence.persistence
    }
  });

  assert.equal(response.status, "eligibility-deferred");
  assert.equal(response.accepted, false);
  assert.equal(response.rewardGranted, false);
  assert.equal(cache.calls.read, 0);
  assert.equal(cache.calls.write, 0);
  assert.equal(transport.calls.length, 0);
});

test("enabled provider plus fake transport preserves coordinate order through verifier while still not accepting capture", async () => {
  const sourceModule = await loadSourceModule();
  const verifierModule = await loadVerifierModule();

  const cache = createFakeCache(null);
  const transport = createFakeTransport((reference) => ({
    ok: true,
    source: {
      ...reference,
      orderedCoordinates: [
        { latitude: -38.45, longitude: 145.24 },
        { latitude: -38.4495503, longitude: 145.24 }
      ],
      spacingMetres: 50,
      fetchedAt: "2026-07-21T00:00:00.000Z"
    }
  }));

  const provider = sourceModule.createAuthoritativePinSourceProvider({
    acquisitionGates: {
      enabled: true,
      cacheReadsEnabled: true,
      cacheWritesEnabled: false,
      remoteTransportEnabled: true,
      allowStaleFallback: false
    },
    cache: cache.cache,
    transport: transport.transport,
    clock: createFakeClock(),
    policy: buildPolicy()
  });

  const verification = await verifierModule.verifyAuthoritativeCanonicalPin({
    input: {
      pinId: "ggpin:v1:osm-way:123456789:0",
      submittedLatitude: -38.45,
      submittedLongitude: 145.24
    },
    provider
  });

  assert.equal(verification.ok, true);
  assert.deepEqual(verification.canonicalPin.latitude, -38.45);
  assert.deepEqual(verification.canonicalPin.longitude, 145.24);
  assert.equal(transport.calls.length, 1);
});
