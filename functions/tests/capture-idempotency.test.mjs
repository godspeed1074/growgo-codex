import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadCaptureStoreModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/captures/captureRequestStore.js")
  );
}

async function loadIdempotencyModule() {
  return import(path.join(repoRoot, "functions/lib/idempotency/idempotency.js"));
}

test("capture request key is stable for identical uid and requestId", async () => {
  const store = await loadCaptureStoreModule();
  const first = store.buildCaptureRequestKey("uid-a", "request-1");
  const second = store.buildCaptureRequestKey("uid-a", "request-1");
  assert.equal(first, second);
});

test("capture request key changes when uid or requestId changes", async () => {
  const store = await loadCaptureStoreModule();
  assert.notEqual(
    store.buildCaptureRequestKey("uid-a", "request-1"),
    store.buildCaptureRequestKey("uid-b", "request-1")
  );
  assert.notEqual(
    store.buildCaptureRequestKey("uid-a", "request-1"),
    store.buildCaptureRequestKey("uid-a", "request-2")
  );
});

test("capture fingerprint is stable for identical normalized input and changes with evidence", async () => {
  const store = await loadCaptureStoreModule();
  const base = {
    requestId: "capture-001",
    pinId: "pin-001",
    latitude: -38.45,
    longitude: 145.24,
    accuracyMetres: 10,
    clientCapturedAt: "2026-07-21T00:00:00.000Z"
  };
  const normalized = store.normalizeCapturePinRequest(base);

  const stableA = store.buildCaptureRequestFingerprint("uid-a", normalized);
  const stableB = store.buildCaptureRequestFingerprint("uid-a", normalized);
  assert.equal(stableA, stableB);

  assert.notEqual(
    stableA,
    store.buildCaptureRequestFingerprint("uid-a", {
      ...normalized,
      pinId: "pin-002"
    })
  );
  assert.notEqual(
    stableA,
    store.buildCaptureRequestFingerprint("uid-a", {
      ...normalized,
      latitude: -38.451
    })
  );
  assert.notEqual(
    stableA,
    store.buildCaptureRequestFingerprint("uid-a", {
      ...normalized,
      clientCapturedAt: "2026-07-21T00:00:01.000Z"
    })
  );
});

test("capture fingerprint remains stable regardless of source object key order", async () => {
  const store = await loadCaptureStoreModule();
  const first = store.normalizeCapturePinRequest({
    requestId: "capture-ordered-001",
    pinId: "pin-001",
    latitude: -38.45,
    longitude: 145.24,
    accuracyMetres: 10,
    clientCapturedAt: "2026-07-21T00:00:00.000Z"
  });
  const second = store.normalizeCapturePinRequest({
    clientCapturedAt: "2026-07-21T00:00:00.000Z",
    accuracyMetres: 10,
    longitude: 145.24,
    latitude: -38.45,
    pinId: "pin-001",
    requestId: "capture-ordered-001"
  });

  assert.equal(
    store.buildCaptureRequestFingerprint("uid-a", first),
    store.buildCaptureRequestFingerprint("uid-a", second)
  );
});

test("capture eligibility remains explicitly deferred and grants no reward", async () => {
  const store = await loadCaptureStoreModule();
  const decision = store.buildDeferredEligibilityDecision();
  const response = store.buildInitialDeferredCaptureResponse({
    requestId: "capture-001",
    pinId: "pin-001",
    latitude: -38.45,
    longitude: 145.24,
    accuracyMetres: 10,
    clientCapturedAt: "2026-07-21T00:00:00.000Z"
  });

  assert.deepEqual(decision, {
    outcome: "deferred",
    code: "authoritative-pin-verification-unavailable",
    message:
      "The capture request was recorded safely, but GrowGo cannot accept or reward it until authoritative pin identity and proximity verification are available."
  });

  assert.equal(response.accepted, false);
  assert.equal(response.rewardGranted, false);
  assert.equal(response.status, "eligibility-deferred");
  assert.equal(response.code, "authoritative-pin-verification-unavailable");
});

test("idempotency reservation key is deterministic and isolated by uid and operation scope", async () => {
  const idempotency = await loadIdempotencyModule();
  const captureA = idempotency.buildIdempotencyReservationKey({
    requestId: "shared-key-001",
    operation: "capturePin",
    uid: "uid-a"
  });
  const captureB = idempotency.buildIdempotencyReservationKey({
    requestId: "shared-key-001",
    operation: "capturePin",
    uid: "uid-a"
  });
  const captureOtherUser = idempotency.buildIdempotencyReservationKey({
    requestId: "shared-key-001",
    operation: "capturePin",
    uid: "uid-b"
  });
  const bootstrapSameUser = idempotency.buildIdempotencyReservationKey({
    requestId: "shared-key-001",
    operation: "bootstrapPlayer",
    uid: "uid-a"
  });

  assert.equal(captureA, captureB);
  assert.notEqual(captureA, captureOtherUser);
  assert.notEqual(captureA, bootstrapSameUser);
});

test("invalid idempotency key rejects", async () => {
  const idempotency = await loadIdempotencyModule();

  assert.throws(
    () =>
      idempotency.buildIdempotencyReservationKey({
        requestId: "",
        operation: "capturePin",
        uid: "uid-a"
      }),
    (error) => error && error.code === "invalid-argument"
  );
});

test("deferred capture reservation classification returns exact replay for identical fingerprint", async () => {
  const idempotency = await loadIdempotencyModule();
  const response = {
    ok: false,
    accepted: false,
    replayed: false,
    rewardGranted: false,
    status: "eligibility-deferred",
    code: "authoritative-pin-verification-unavailable",
    message:
      "The capture request was recorded safely, but GrowGo cannot accept or reward it until authoritative pin identity and proximity verification are available.",
    requestId: "capture-reservation-001",
    pinId: "ggpin:v1:osm-way:123456789:0"
  };
  const storedReservation =
    idempotency.buildDeferredCaptureIdempotencyReservationDocument({
      envelope: {
        requestId: "capture-reservation-001",
        operation: "capturePin",
        uid: "uid-a"
      },
      requestFingerprint: "a".repeat(64),
      captureRequestKey: "capture-request-key-001",
      response,
      now: {
        toDate() {
          return new Date("2026-07-22T00:00:00.000Z");
        }
      }
    });

  const decision = idempotency.classifyDeferredCaptureIdempotencyReservation({
    storedReservation,
    envelope: {
      requestId: "capture-reservation-001",
      operation: "capturePin",
      uid: "uid-a"
    },
    requestFingerprint: "a".repeat(64)
  });

  assert.equal(decision.classification, "exact-replay");
  assert.equal(decision.response.replayed, true);
  assert.equal(decision.response.rewardGranted, false);
});

test("deferred capture reservation classification rejects conflicting fingerprint safely", async () => {
  const idempotency = await loadIdempotencyModule();
  const response = {
    ok: false,
    accepted: false,
    replayed: false,
    rewardGranted: false,
    status: "eligibility-deferred",
    code: "authoritative-pin-verification-unavailable",
    message:
      "The capture request was recorded safely, but GrowGo cannot accept or reward it until authoritative pin identity and proximity verification are available.",
    requestId: "capture-reservation-002",
    pinId: "ggpin:v1:osm-way:123456789:0"
  };
  const storedReservation =
    idempotency.buildDeferredCaptureIdempotencyReservationDocument({
      envelope: {
        requestId: "capture-reservation-002",
        operation: "capturePin",
        uid: "uid-a"
      },
      requestFingerprint: "b".repeat(64),
      captureRequestKey: "capture-request-key-002",
      response,
      now: {
        toDate() {
          return new Date("2026-07-22T00:00:00.000Z");
        }
      }
    });

  assert.throws(
    () =>
      idempotency.classifyDeferredCaptureIdempotencyReservation({
        storedReservation,
        envelope: {
          requestId: "capture-reservation-002",
          operation: "capturePin",
          uid: "uid-a"
        },
        requestFingerprint: "c".repeat(64)
      }),
    (error) => error && error.code === "already-exists"
  );
});
