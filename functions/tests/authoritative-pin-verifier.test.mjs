import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const earthRadiusMetres = 6371008.8;

async function loadVerifierModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/pins/authoritativePinVerifier.js")
  );
}

function metresToLatitudeDegrees(metres) {
  return (metres / earthRadiusMetres) * (180 / Math.PI);
}

function makeNorthingCoordinate(origin, northMetres) {
  return {
    latitude: origin.latitude + metresToLatitudeDegrees(northMetres),
    longitude: origin.longitude
  };
}

function buildGeometry({ sourceId, coordinates }) {
  return {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId,
    orderedCoordinates: coordinates,
    spacingMetres: 50
  };
}

function createFakeProvider(resolver) {
  const calls = [];

  return {
    provider: {
      async getSourceGeometry(reference) {
        calls.push(reference);
        return resolver(reference);
      }
    },
    calls
  };
}

test("authoritative verifier proves a valid canonical pin and uses only parsed canonical source identity for provider lookup", async () => {
  const module = await loadVerifierModule();
  const origin = { latitude: 0, longitude: 0 };
  const fake = createFakeProvider((reference) =>
    buildGeometry({
      sourceId: reference.sourceId,
      coordinates: [origin, makeNorthingCoordinate(origin, 100)]
    })
  );

  const result = await module.verifyAuthoritativeCanonicalPin({
    input: {
      pinId: "ggpin:v1:osm-way:123456789:1",
      submittedLatitude: makeNorthingCoordinate(origin, 50).latitude,
      submittedLongitude: origin.longitude
    },
    provider: fake.provider
  });

  assert.equal(result.ok, true);
  assert.equal(result.code, "verified");
  assert.equal(result.canonicalPin.pinId, "ggpin:v1:osm-way:123456789:1");
  assert.equal(result.canonicalPin.positionIndex, 1);
  assert.ok(result.submittedCoordinateErrorMetres <= 0.01);
  assert.deepEqual(fake.calls, [
    {
      generatorVersion: 1,
      sourceType: "osm-way",
      sourceId: "123456789"
    }
  ]);
});

test("authoritative verifier rejects legacy, malformed, unsupported, and out-of-range canonical identities safely", async () => {
  const module = await loadVerifierModule();
  const origin = { latitude: 0, longitude: 0 };
  const fake = createFakeProvider((reference) =>
    buildGeometry({
      sourceId: reference.sourceId,
      coordinates: [origin, makeNorthingCoordinate(origin, 50)]
    })
  );

  assert.equal(
    (
      await module.verifyAuthoritativeCanonicalPin({
        input: {
          pinId: "-38.450000,145.240000",
          submittedLatitude: origin.latitude,
          submittedLongitude: origin.longitude
        },
        provider: fake.provider
      })
    ).code,
    "invalid-canonical-pin-id"
  );

  assert.equal(
    (
      await module.verifyAuthoritativeCanonicalPin({
        input: {
          pinId: "ggpin:v2:osm-way:123456789:0",
          submittedLatitude: origin.latitude,
          submittedLongitude: origin.longitude
        },
        provider: fake.provider
      })
    ).code,
    "unsupported-generator-version"
  );

  assert.equal(
    (
      await module.verifyAuthoritativeCanonicalPin({
        input: {
          pinId: "ggpin:v1:osm-relation:123456789:0",
          submittedLatitude: origin.latitude,
          submittedLongitude: origin.longitude
        },
        provider: fake.provider
      })
    ).code,
    "unsupported-source-type"
  );

  assert.equal(
    (
      await module.verifyAuthoritativeCanonicalPin({
        input: {
          pinId: "ggpin:v1:osm-way:123456789:4",
          submittedLatitude: origin.latitude,
          submittedLongitude: origin.longitude
        },
        provider: fake.provider
      })
    ).code,
    "position-index-out-of-range"
  );
});

test("authoritative verifier distinguishes unavailable, mismatched, invalid, and failing provider behavior", async () => {
  const module = await loadVerifierModule();
  const origin = { latitude: 0, longitude: 0 };
  const validInput = {
    pinId: "ggpin:v1:osm-way:123456789:0",
    submittedLatitude: origin.latitude,
    submittedLongitude: origin.longitude
  };

  const unavailable = createFakeProvider(() => null);
  assert.equal(
    (
      await module.verifyAuthoritativeCanonicalPin({
        input: validInput,
        provider: unavailable.provider
      })
    ).code,
    "authoritative-source-unavailable"
  );

  const mismatched = createFakeProvider(() =>
    buildGeometry({
      sourceId: "987654321",
      coordinates: [origin, makeNorthingCoordinate(origin, 50)]
    })
  );
  assert.equal(
    (
      await module.verifyAuthoritativeCanonicalPin({
        input: validInput,
        provider: mismatched.provider
      })
    ).code,
    "authoritative-source-mismatch"
  );

  const invalid = createFakeProvider((reference) => ({
    ...buildGeometry({
      sourceId: reference.sourceId,
      coordinates: []
    }),
    orderedCoordinates: []
  }));
  assert.equal(
    (
      await module.verifyAuthoritativeCanonicalPin({
        input: validInput,
        provider: invalid.provider
      })
    ).code,
    "authoritative-source-invalid"
  );

  const failing = createFakeProvider(() => {
    throw new Error("boom");
  });
  assert.equal(
    (
      await module.verifyAuthoritativeCanonicalPin({
        input: validInput,
        provider: failing.provider
      })
    ).code,
    "authoritative-provider-failed"
  );
});

test("authoritative verifier applies a separate exact 1 metre submitted-coordinate tolerance", async () => {
  const module = await loadVerifierModule();
  const origin = { latitude: 0, longitude: 0 };
  const fake = createFakeProvider((reference) =>
    buildGeometry({
      sourceId: reference.sourceId,
      coordinates: [origin, makeNorthingCoordinate(origin, 100)]
    })
  );
  const canonicalSeed = await module.verifyAuthoritativeCanonicalPin({
    input: {
      pinId: "ggpin:v1:osm-way:123456789:1",
      submittedLatitude: makeNorthingCoordinate(origin, 50).latitude,
      submittedLongitude: origin.longitude
    },
    provider: fake.provider
  });
  assert.equal(canonicalSeed.ok, true);
  const canonicalLatitude = canonicalSeed.canonicalPin.latitude;

  const exact = await module.verifyAuthoritativeCanonicalPin({
    input: {
      pinId: "ggpin:v1:osm-way:123456789:1",
      submittedLatitude: canonicalLatitude,
      submittedLongitude: origin.longitude
    },
    provider: fake.provider
  });
  assert.equal(exact.ok, true);

  const withinTolerance = await module.verifyAuthoritativeCanonicalPin({
    input: {
      pinId: "ggpin:v1:osm-way:123456789:1",
      submittedLatitude:
        canonicalLatitude + metresToLatitudeDegrees(0.999),
      submittedLongitude: origin.longitude
    },
    provider: fake.provider
  });
  assert.equal(withinTolerance.ok, true);

  const atTolerance = await module.verifyAuthoritativeCanonicalPin({
    input: {
      pinId: "ggpin:v1:osm-way:123456789:1",
      submittedLatitude:
        canonicalLatitude + metresToLatitudeDegrees(1),
      submittedLongitude: origin.longitude
    },
    provider: fake.provider
  });
  assert.equal(atTolerance.ok, true);

  const aboveTolerance = await module.verifyAuthoritativeCanonicalPin({
    input: {
      pinId: "ggpin:v1:osm-way:123456789:1",
      submittedLatitude:
        canonicalLatitude + metresToLatitudeDegrees(1.01),
      submittedLongitude: origin.longitude
    },
    provider: fake.provider
  });
  assert.equal(aboveTolerance.ok, false);
  assert.equal(aboveTolerance.code, "submitted-coordinate-mismatch");
  assert.ok(
    aboveTolerance.details.submittedCoordinateErrorMetres >
      module.AUTHORITATIVE_PIN_SUBMITTED_COORDINATE_TOLERANCE_METRES
  );
});
