import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadTransportModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/overpassAuthoritativePinTransport.js"
    )
  );
}

async function loadParserModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/overpassAuthoritativePinParser.js"
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

function createFakeHttpClient(responseFactory) {
  const calls = [];
  return {
    httpClient: {
      async request(input) {
        calls.push(input);
        return responseFactory(input);
      }
    },
    calls
  };
}

test("overpass query is exact and malformed source ids are rejected", async () => {
  const parser = await loadParserModule();
  assert.equal(
    parser.buildOverpassWayQuery({
      sourceId: "123456789",
      timeoutMilliseconds: 5000
    }),
    "[out:json][timeout:5];\nway(123456789);\nout geom;"
  );

  for (const invalidSourceId of [
    "",
    "-1",
    "1.5",
    "1e6",
    " 123 ",
    "123/456",
    "1;out body;"
  ]) {
    assert.throws(() =>
      parser.buildOverpassWayQuery({
        sourceId: invalidSourceId,
        timeoutMilliseconds: 5000
      })
    );
  }
});

test("overpass parser preserves order and validates one exact matching way only", async () => {
  const parser = await loadParserModule();
  const valid = parser.parseOverpassAuthoritativeWayResponse({
    reference: buildReference(),
    body: {
      elements: [
        {
          type: "way",
          id: 123456789,
          geometry: [
            { lat: -38.45, lon: 145.24 },
            { lat: -38.4505, lon: 145.2405 }
          ]
        }
      ]
    }
  });

  assert.equal(valid.ok, true);
  assert.deepEqual(valid.geometry.orderedCoordinates, [
    { latitude: -38.45, longitude: 145.24 },
    { latitude: -38.4505, longitude: 145.2405 }
  ]);

  assert.equal(
    parser.parseOverpassAuthoritativeWayResponse({
      reference: buildReference(),
      body: { elements: [] }
    }).code,
    "not-found"
  );
});

test("transport disabled performs zero HTTP calls and enabled transport performs exactly one bounded POST", async () => {
  const transportModule = await loadTransportModule();
  const clock = { now: () => new Date("2026-07-21T00:00:00.000Z") };

  const disabledFake = createFakeHttpClient(() => {
    throw new Error("should-not-run");
  });
  const disabled = transportModule.createOverpassAuthoritativePinTransport({
    httpClient: disabledFake.httpClient,
    endpoint: null,
    enabled: false,
    clock,
    timeoutMilliseconds:
      transportModule.OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS
  });

  const disabledResult = await disabled.fetchSource(buildReference());
  assert.equal(disabledResult.ok, false);
  assert.equal(disabledFake.calls.length, 0);

  const successFake = createFakeHttpClient(() => ({
    status: 200,
    headers: {},
    body: {
      elements: [
        {
          type: "way",
          id: 123456789,
          geometry: [
            { lat: 0, lon: 0 },
            { lat: 0.000449661, lon: 0 }
          ]
        }
      ]
    }
  }));
  const enabled = transportModule.createOverpassAuthoritativePinTransport({
    httpClient: successFake.httpClient,
    endpoint: "https://example.invalid/overpass",
    enabled: true,
    clock,
    timeoutMilliseconds:
      transportModule.OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS
  });

  const success = await enabled.fetchSource(buildReference());
  assert.equal(success.ok, true);
  assert.equal(successFake.calls.length, 1);
  assert.equal(successFake.calls[0].method, "POST");
  assert.equal(successFake.calls[0].timeoutMilliseconds, 5000);
  assert.equal(
    successFake.calls[0].body,
    "[out:json][timeout:5];\nway(123456789);\nout geom;"
  );

  const rateLimitedFake = createFakeHttpClient(() => ({
    status: 429,
    headers: { "retry-after": "999999" },
    body: {}
  }));
  const rateLimitedTransport =
    transportModule.createOverpassAuthoritativePinTransport({
      httpClient: rateLimitedFake.httpClient,
      endpoint: "https://example.invalid/overpass",
      enabled: true,
      clock,
      timeoutMilliseconds: 5000
    });
  const limited = await rateLimitedTransport.fetchSource(buildReference());
  assert.equal(limited.ok, false);
  assert.equal(limited.code, "rate-limited");
  assert.equal(limited.retryAfterSeconds, 21600);
});
