import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadCapturePolicy() {
  return import(
    path.join(repoRoot, "functions/lib/domain/captures/privateAlphaCapture.js")
  );
}

const canonicalPin = Object.freeze({
  pinId: "ggpin:v1:osm-way:100:0",
  generatorVersion: 1,
  sourceType: "osm-way",
  sourceId: "100",
  positionIndex: 0,
  segmentIndex: 0,
  latitude: -38.2667,
  longitude: 145.364,
  distanceAlongWayMetres: 0
});

function buildRequest(overrides = {}) {
  return {
    requestId: "capture-request-0001",
    pinId: canonicalPin.pinId,
    latitude: canonicalPin.latitude,
    longitude: canonicalPin.longitude,
    accuracyMetres: 12,
    clientCapturedAt: "2026-08-27T00:00:00.000Z",
    ...overrides
  };
}

test("private-alpha capture accepts only fresh, accurate, nearby canonical base-pin evidence", async () => {
  const capturePolicy = await loadCapturePolicy();
  const now = new Date("2026-08-27T00:03:00.000Z");

  assert.doesNotThrow(() =>
    capturePolicy.assertPrivateAlphaCaptureEligible({
      request: buildRequest(),
      canonicalPin,
      evidence: {
        pinLatitude: canonicalPin.latitude,
        pinLongitude: canonicalPin.longitude
      },
      now
    })
  );

  assert.throws(
    () =>
      capturePolicy.assertPrivateAlphaCaptureEligible({
        request: buildRequest({ accuracyMetres: 101 }),
        canonicalPin,
        evidence: {
          pinLatitude: canonicalPin.latitude,
          pinLongitude: canonicalPin.longitude
        },
        now
      }),
    { code: "failed-precondition" }
  );

  assert.throws(
    () =>
      capturePolicy.assertPrivateAlphaCaptureEligible({
        request: buildRequest({ latitude: -38.263, longitude: 145.364 }),
        canonicalPin,
        evidence: {
          pinLatitude: canonicalPin.latitude,
          pinLongitude: canonicalPin.longitude
        },
        now
      }),
    { code: "failed-precondition" }
  );

  assert.throws(
    () =>
      capturePolicy.assertPrivateAlphaCaptureEligible({
        request: buildRequest({ clientCapturedAt: "2026-08-27T00:09:00.000Z" }),
        canonicalPin,
        evidence: {
          pinLatitude: canonicalPin.latitude,
          pinLongitude: canonicalPin.longitude
        },
        now
      }),
    { code: "failed-precondition" }
  );
});

test("test range bypasses distance only; pin verification, GPS accuracy and freshness still apply", async () => {
  const capturePolicy = await loadCapturePolicy();
  const now = new Date("2026-08-27T00:03:00.000Z");
  const canonicalEvidence = {
    pinLatitude: canonicalPin.latitude,
    pinLongitude: canonicalPin.longitude
  };
  const farRequest = buildRequest({ latitude: canonicalPin.latitude - 0.02 });

  assert.throws(() => capturePolicy.assertPrivateAlphaCaptureEligible({
    request: farRequest,
    canonicalPin,
    evidence: canonicalEvidence,
    now
  }), { code: "failed-precondition" });

  assert.doesNotThrow(() => capturePolicy.assertPrivateAlphaCaptureEligible({
    request: farRequest,
    canonicalPin,
    evidence: canonicalEvidence,
    now,
    unlimitedCaptureRange: true
  }));

  assert.throws(() => capturePolicy.assertPrivateAlphaCaptureEligible({
    request: buildRequest({ latitude: canonicalPin.latitude - 0.02, accuracyMetres: 101 }),
    canonicalPin,
    evidence: canonicalEvidence,
    now,
    unlimitedCaptureRange: true
  }), { code: "failed-precondition" });

  assert.throws(() => capturePolicy.assertPrivateAlphaCaptureEligible({
    request: farRequest,
    canonicalPin,
    evidence: { ...canonicalEvidence, pinLongitude: canonicalPin.longitude + 0.01 },
    now,
    unlimitedCaptureRange: true
  }), { code: "failed-precondition" });

  assert.throws(() => capturePolicy.assertPrivateAlphaCaptureEligible({
    request: buildRequest({ latitude: canonicalPin.latitude - 0.02, clientCapturedAt: "2026-08-27T00:09:00.000Z" }),
    canonicalPin,
    evidence: canonicalEvidence,
    now,
    unlimitedCaptureRange: true
  }), { code: "failed-precondition" });
});
