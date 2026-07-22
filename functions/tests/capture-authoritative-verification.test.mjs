import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadCapturePinModule() {
  return import(path.join(repoRoot, "functions/lib/api/capturePin.js"));
}

async function loadCaptureStoreModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/captures/captureRequestStore.js")
  );
}

function createFakePersistence(storeModule) {
  const playerIds = new Set(["uid-test"]);
  const requestDocuments = new Map();
  const reservations = new Map();

  return {
    persistence: {
      async ensurePlayerExists(uid) {
        if (!playerIds.has(uid)) {
          const { HttpsError } = await import(
            path.join(
              repoRoot,
              "functions/node_modules/firebase-functions/lib/common/providers/https.js"
            )
          );
          throw new HttpsError(
            "failed-precondition",
            "Player bootstrap is required before capture requests can be recorded."
          );
        }
      },
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
        const initialResponse = storeModule.buildInitialDeferredCaptureResponse(
          request
        );

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
              ...initialResponse,
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
            now: {
              toDate() {
                return new Date("2026-07-21T00:00:00.000Z");
              }
            }
          })
        );

        reservations.set(reservationKey, {
          requestFingerprint
        });

        return {
          classification: "first-request",
          reservationKey,
          captureRequestKey: requestKey,
          requestFingerprint,
          response: initialResponse
        };
      }
    },
    requestDocuments,
    reservations
  };
}

function createCountingProvider(resultFactory) {
  const calls = [];

  return {
    provider: {
      async getSourceGeometry(reference) {
        calls.push(reference);
        return resultFactory(reference);
      }
    },
    calls
  };
}

test("first request stores one deferred response, and identical replay returns the stored deferred outcome deterministically", async () => {
  const capturePinModule = await loadCapturePinModule();
  const storeModule = await loadCaptureStoreModule();
  const fakePersistence = createFakePersistence(storeModule);
  const provider = createCountingProvider((reference) => ({
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: reference.sourceId,
    orderedCoordinates: [
      { latitude: 0, longitude: 0 },
      { latitude: 0.000449661, longitude: 0 }
    ],
    spacingMetres: 50
  }));

  const normalizedRequest = storeModule.normalizeCapturePinRequest({
    requestId: "capture-auth-001",
    pinId: "ggpin:v1:osm-way:123456789:0",
    latitude: 0,
    longitude: 0,
    accuracyMetres: 10,
    clientCapturedAt: "2026-07-21T00:00:00.000Z"
  });

  const first = await capturePinModule.processValidatedCapturePinRequest({
    uid: "uid-test",
    normalizedRequest,
    dependencies: {
      authoritativePinSourceProvider: provider.provider,
      persistence: fakePersistence.persistence
    }
  });

  assert.equal(first.accepted, false);
  assert.equal(first.rewardGranted, false);
  assert.equal(first.status, "eligibility-deferred");
  assert.equal(first.code, "authoritative-pin-verification-unavailable");
  assert.equal(provider.calls.length, 1);
  assert.equal(fakePersistence.requestDocuments.size, 1);
  assert.equal(fakePersistence.reservations.size, 1);

  const replay = await capturePinModule.processValidatedCapturePinRequest({
    uid: "uid-test",
    normalizedRequest,
    dependencies: {
      authoritativePinSourceProvider: provider.provider,
      persistence: fakePersistence.persistence
    }
  });

  assert.equal(replay.replayed, true);
  assert.equal(replay.accepted, false);
  assert.equal(replay.rewardGranted, false);
  assert.equal(provider.calls.length, 2);
  assert.equal(fakePersistence.requestDocuments.size, 1);
  assert.equal(fakePersistence.reservations.size, 1);
});

test("conflicting requestId reuse rejects safely and leaves the original reservation unchanged", async () => {
  const capturePinModule = await loadCapturePinModule();
  const storeModule = await loadCaptureStoreModule();
  const fakePersistence = createFakePersistence(storeModule);
  const provider = createCountingProvider((reference) => ({
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: reference.sourceId,
    orderedCoordinates: [
      { latitude: 0, longitude: 0 },
      { latitude: 0.000449661, longitude: 0 }
    ],
    spacingMetres: 50
  }));

  const firstRequest = storeModule.normalizeCapturePinRequest({
    requestId: "capture-auth-002",
    pinId: "ggpin:v1:osm-way:123456789:0",
    latitude: 0,
    longitude: 0,
    accuracyMetres: 10,
    clientCapturedAt: "2026-07-21T00:00:00.000Z"
  });

  await capturePinModule.processValidatedCapturePinRequest({
    uid: "uid-test",
    normalizedRequest: firstRequest,
    dependencies: {
      authoritativePinSourceProvider: provider.provider,
      persistence: fakePersistence.persistence
    }
  });

  const conflictingRequest = storeModule.normalizeCapturePinRequest({
    ...firstRequest,
    pinId: "ggpin:v1:osm-way:123456789:1"
  });

  await assert.rejects(
    () =>
      capturePinModule.processValidatedCapturePinRequest({
        uid: "uid-test",
        normalizedRequest: conflictingRequest,
        dependencies: {
          authoritativePinSourceProvider: provider.provider,
          persistence: fakePersistence.persistence
        }
      }),
    (error) =>
      error &&
      error.code === "already-exists" &&
      provider.calls.length === 2 &&
      fakePersistence.requestDocuments.size === 1 &&
      fakePersistence.reservations.size === 1
  );
});

test("internal authoritative verification can succeed while outward capture remains safely deferred and unrewarded", async () => {
  const capturePinModule = await loadCapturePinModule();
  const storeModule = await loadCaptureStoreModule();

  const evidence =
    await capturePinModule.resolveCapturePinVerificationEvidence({
      normalizedRequest: storeModule.normalizeCapturePinRequest({
        requestId: "capture-auth-003",
        pinId: "ggpin:v1:osm-way:123456789:0",
        latitude: 0,
        longitude: 0,
        accuracyMetres: 10,
        clientCapturedAt: "2026-07-21T00:00:00.000Z"
      }),
      authoritativePinSourceProvider: {
        async getSourceGeometry(reference) {
          return {
            generatorVersion: 1,
            sourceType: "osm-way",
            sourceId: reference.sourceId,
            orderedCoordinates: [
              { latitude: 0, longitude: 0 },
              { latitude: 0.000449661, longitude: 0 }
            ],
            spacingMetres: 50
          };
        }
      }
    });

  assert.equal(evidence.verification.ok, true);
  assert.equal(
    evidence.internalReason,
    "authoritative-pin-verified-proximity-not-evaluated"
  );
});
