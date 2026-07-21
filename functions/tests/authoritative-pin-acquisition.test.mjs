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

function createFakeClock(nowIsoString = "2026-07-21T00:00:00.000Z") {
  const now = new Date(nowIsoString);
  return {
    now() {
      return new Date(now);
    }
  };
}

function createFakeCache(initialRecord = null) {
  const writes = [];
  return {
    cache: {
      async read() {
        return initialRecord;
      },
      async write(reference, record) {
        writes.push({ reference, record });
      }
    },
    writes
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

function buildReference() {
  return {
    generatorVersion: 1,
    sourceType: "osm-way",
    sourceId: "123456789"
  };
}

function buildTransportedSource(reference = buildReference()) {
  return {
    ...reference,
    orderedCoordinates: [
      { latitude: 0, longitude: 0 },
      { latitude: 0.000449661, longitude: 0 }
    ],
    spacingMetres: 50,
    fetchedAt: "2026-07-21T00:00:00.000Z"
  };
}

test("authoritative acquisition serves a fresh positive cache hit without transport", async () => {
  const acquisitionModule = await loadAcquisitionModule();
  const reference = buildReference();
  const source = buildTransportedSource(reference);
  const cache = createFakeCache({
    kind: "positive",
    source,
    cachedAt: "2026-07-21T00:00:00.000Z",
    expiresAt: "2026-07-22T00:00:00.000Z"
  });
  const transport = createFakeTransport(() => {
    throw new Error("transport should not be called");
  });

  const result = await acquisitionModule.acquireAuthoritativePinSource({
    reference,
    transport: transport.transport,
    cache: cache.cache,
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

  assert.equal(result.ok, true);
  assert.equal(result.cacheStatus, "positive-hit");
  assert.equal(result.source.sourceId, reference.sourceId);
  assert.equal(transport.calls.length, 0);
  assert.equal(cache.writes.length, 0);
});

test("authoritative acquisition validates transported source completeness and writes bounded negative cache failures deterministically", async () => {
  const acquisitionModule = await loadAcquisitionModule();
  const reference = buildReference();
  const cache = createFakeCache(null);
  const transport = createFakeTransport((resolvedReference) => ({
    ok: true,
    source: {
      ...resolvedReference,
      orderedCoordinates: [{ latitude: 0, longitude: 0 }],
      spacingMetres: 50,
      fetchedAt: "2026-07-21T00:00:00.000Z"
    }
  }));

  const result = await acquisitionModule.acquireAuthoritativePinSource({
    reference,
    transport: transport.transport,
    cache: cache.cache,
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

  assert.equal(result.ok, false);
  assert.equal(result.code, "source-incomplete");
  assert.equal(result.retryable, false);
  assert.equal(cache.writes.length, 1);
  assert.equal(cache.writes[0].record.kind, "negative");
  assert.equal(cache.writes[0].record.code, "source-incomplete");
});

test("authoritative acquisition respects cached rate limits and production provider stays disabled without transport", async () => {
  const acquisitionModule = await loadAcquisitionModule();
  const sourceModule = await loadSourceModule();
  const reference = buildReference();
  const rateLimitedCache = createFakeCache({
    kind: "negative",
    code: "rate-limited",
    retryable: true,
    retryAfterSeconds: 120,
    cachedAt: "2026-07-21T00:00:00.000Z",
    expiresAt: "2026-07-21T00:02:00.000Z"
  });
  const transport = createFakeTransport(() => ({
    ok: true,
    source: buildTransportedSource(reference)
  }));

  const cachedResult = await acquisitionModule.acquireAuthoritativePinSource({
    reference,
    transport: transport.transport,
    cache: rateLimitedCache.cache,
    clock: createFakeClock("2026-07-21T00:01:00.000Z"),
    policy: buildPolicy(),
    gates: {
      enabled: true,
      cacheReadsEnabled: true,
      cacheWritesEnabled: true,
      remoteTransportEnabled: true,
      allowStaleFallback: false
    }
  });

  assert.equal(cachedResult.ok, false);
  assert.equal(cachedResult.code, "rate-limited");
  assert.equal(cachedResult.cacheStatus, "negative-hit");
  assert.equal(transport.calls.length, 0);

  const disabledProvider = sourceModule.createAuthoritativePinSourceProvider({
    acquisitionGates: {
      enabled: false,
      cacheReadsEnabled: false,
      cacheWritesEnabled: false,
      remoteTransportEnabled: false,
      allowStaleFallback: false
    },
    transport: transport.transport,
    cache: rateLimitedCache.cache,
    clock: createFakeClock(),
    policy: buildPolicy()
  });

  const disabledResult = await disabledProvider.getSourceGeometry(reference);
  assert.equal(disabledResult, null);
  assert.equal(transport.calls.length, 0);
});
