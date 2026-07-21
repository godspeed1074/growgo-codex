import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

test("capture request key is stable for identical uid and requestId", async () => {
  const store = await import(path.join(repoRoot, "functions/lib/domain/captures/captureRequestStore.js"));
  const first = store.buildCaptureRequestKey("uid-a", "request-1");
  const second = store.buildCaptureRequestKey("uid-a", "request-1");
  assert.equal(first, second);
});

test("capture request key changes when uid or requestId changes", async () => {
  const store = await import(path.join(repoRoot, "functions/lib/domain/captures/captureRequestStore.js"));
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
  const store = await import(path.join(repoRoot, "functions/lib/domain/captures/captureRequestStore.js"));
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

test("capture eligibility remains explicitly deferred and grants no reward", async () => {
  const store = await import(path.join(repoRoot, "functions/lib/domain/captures/captureRequestStore.js"));
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
