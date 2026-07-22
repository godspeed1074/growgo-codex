import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { Timestamp } from "firebase-admin/firestore";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadBootstrapModule() {
  return import(path.join(repoRoot, "functions/lib/api/bootstrapPlayer.js"));
}

async function loadCaptureModule() {
  return import(path.join(repoRoot, "functions/lib/api/capturePin.js"));
}

async function loadPlayerStoreModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/players/playerStore.js")
  );
}

async function loadPlayerTypesModule() {
  return import(
    path.join(repoRoot, "functions/lib/domain/players/playerTypes.js")
  );
}

async function loadIdempotencyModule() {
  return import(path.join(repoRoot, "functions/lib/idempotency/idempotency.js"));
}

function buildAuthenticatedCallableRequest(overrides = {}) {
  return {
    auth: {
      uid: "phase5-player-001"
    },
    app: null,
    data: {},
    ...overrides
  };
}

function createNoopCaptureDependencies() {
  return {
    authoritativePinSourceProvider: {
      async getSourceGeometry() {
        throw new Error("authoritative provider should not be called");
      }
    },
    persistence: {
      async ensurePlayerExists() {
        throw new Error("player lookup should not be called");
      },
      async reserveDeferredRequest() {
        throw new Error("request reservation should not be called");
      }
    }
  };
}

test("bootstrapPlayer unauthenticated request rejects before idempotency reservation and player transaction", async () => {
  const bootstrapModule = await loadBootstrapModule();
  let reserveCalled = false;
  let transactionCalled = false;
  const handler = bootstrapModule.createBootstrapPlayerHandler({
    async reserveIdempotency() {
      reserveCalled = true;
      throw new Error("reservation should not run");
    },
    async runBootstrapTransaction() {
      transactionCalled = true;
      throw new Error("transaction should not run");
    }
  });

  await assert.rejects(
    handler(
      buildAuthenticatedCallableRequest({
        auth: null,
        data: { requestId: "bootstrap-auth-phase5-001" }
      })
    ),
    (error) => {
      assert.equal(error.code, "unauthenticated");
      assert.equal(
        error.message,
        "Firebase Authentication is required for this callable scaffold."
      );
      return true;
    }
  );

  assert.equal(reserveCalled, false);
  assert.equal(transactionCalled, false);
});

test("bootstrapPlayer authenticated request preserves the existing response shape while idempotency remains unsupported", async () => {
  const bootstrapModule = await loadBootstrapModule();
  const playerStore = await loadPlayerStoreModule();
  const playerTypes = await loadPlayerTypesModule();
  const now = Timestamp.fromDate(new Date("2026-07-22T00:00:00.000Z"));
  let reserveCalls = 0;
  let transactionCalls = 0;
  const handler = bootstrapModule.createBootstrapPlayerHandler({
    async reserveIdempotency({ requestId, uid }) {
      reserveCalls += 1;
      assert.equal(requestId, "bootstrap-auth-phase5-002");
      assert.equal(uid, "phase5-player-001");
      return {
        supported: false,
        strategy: "firestore-transaction-todo",
        reservationState: "not-attempted",
        duplicateRequestDetected: false
      };
    },
    async runBootstrapTransaction(uid) {
      transactionCalls += 1;
      assert.equal(uid, "phase5-player-001");
      return {
        created: true,
        player: playerStore.buildDefaultPlayerDocument(now)
      };
    }
  });

  const response = await handler(
    buildAuthenticatedCallableRequest({
      data: { requestId: "bootstrap-auth-phase5-002" }
    })
  );

  assert.equal(reserveCalls, 1);
  assert.equal(transactionCalls, 1);
  assert.deepEqual(response, {
    ok: true,
    created: true,
    player: {
      schemaVersion: 1,
      displayName: null,
      avatarUrl: null,
      level: 1,
      xp: 0,
      coins: 0,
      createdAt: "2026-07-22T00:00:00.000Z",
      updatedAt: "2026-07-22T00:00:00.000Z",
      lastLoginAt: "2026-07-22T00:00:00.000Z"
    },
    idempotency: {
      requestId: "bootstrap-auth-phase5-002",
      operation: "bootstrapPlayer",
      uid: "phase5-player-001"
    },
    idempotencyReservation: {
      supported: false,
      strategy: "firestore-transaction-todo",
      reservationState: "not-attempted",
      duplicateRequestDetected: false
    },
    appCheck: {
      prepared: true,
      enforced: false,
      verified: false
    },
    serverAuthoritativeFieldsRejectedFromClient:
      playerTypes.serverAuthoritativePlayerFields.slice(),
    rewardAuthority: "server-only"
  });
});

test("capturePin unauthenticated request rejects before validation, persistence, or authoritative verification", async () => {
  const captureModule = await loadCaptureModule();
  let providerCalled = false;
  let ensurePlayerCalled = false;
  let reserveCalled = false;
  const handler = captureModule.createCapturePinHandler({
    authoritativePinSourceProvider: {
      async getSourceGeometry() {
        providerCalled = true;
        throw new Error("authoritative provider should not run");
      }
    },
    persistence: {
      async ensurePlayerExists() {
        ensurePlayerCalled = true;
      },
      async reserveDeferredRequest() {
        reserveCalled = true;
        throw new Error("reservation should not run");
      }
    }
  });

  await assert.rejects(
    handler(
      buildAuthenticatedCallableRequest({
        auth: null,
        data: {
          requestId: "capture-auth-phase5-001",
          pinId: "ggpin:v1:osm-way:123456789:0",
          latitude: 0,
          longitude: 0,
          accuracyMetres: 10,
          clientCapturedAt: "2026-07-21T00:00:00.000Z"
        }
      })
    ),
    (error) => {
      assert.equal(error.code, "unauthenticated");
      assert.equal(
        error.message,
        "Firebase Authentication is required for this callable scaffold."
      );
      return true;
    }
  );

  assert.equal(providerCalled, false);
  assert.equal(ensurePlayerCalled, false);
  assert.equal(reserveCalled, false);
});

test("capturePin malformed payload rejects before persistence and authoritative verification", async () => {
  const captureModule = await loadCaptureModule();
  let providerCalled = false;
  let ensurePlayerCalled = false;
  let reserveCalled = false;
  const handler = captureModule.createCapturePinHandler({
    authoritativePinSourceProvider: {
      async getSourceGeometry() {
        providerCalled = true;
        throw new Error("authoritative provider should not run");
      }
    },
    persistence: {
      async ensurePlayerExists() {
        ensurePlayerCalled = true;
      },
      async reserveDeferredRequest() {
        reserveCalled = true;
        throw new Error("reservation should not run");
      }
    }
  });

  await assert.rejects(
    handler(
      buildAuthenticatedCallableRequest({
        data: {
          requestId: "capture-auth-phase5-002",
          pinId: "ggpin:v1:osm-way:123456789:0",
          latitude: 0,
          longitude: 0
        }
      })
    ),
    (error) => {
      assert.equal(error.code, "invalid-argument");
      assert.match(error.message, /accuracyMetres/);
      return true;
    }
  );

  assert.equal(providerCalled, false);
  assert.equal(ensurePlayerCalled, false);
  assert.equal(reserveCalled, false);
});

test("bootstrapPlayer idempotency path remains unchanged while capture reservation support is now available separately", async () => {
  const idempotencyModule = await loadIdempotencyModule();
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("unexpected network activity");
  };

  try {
    const envelope = idempotencyModule.buildIdempotencyEnvelope({
      requestId: "phase5-idempotency-001",
      operation: "capturePin",
      uid: "phase5-player-001"
    });
    const reservation = await idempotencyModule.reserveIdempotencySlot(envelope);

    assert.deepEqual(envelope, {
      requestId: "phase5-idempotency-001",
      operation: "capturePin",
      uid: "phase5-player-001"
    });
    assert.deepEqual(
      idempotencyModule.buildIdempotencyReservationKey(envelope),
      idempotencyModule.buildIdempotencyReservationKey({
        requestId: "phase5-idempotency-001",
        operation: "capturePin",
        uid: "phase5-player-001"
      })
    );
    assert.deepEqual(reservation, {
      supported: false,
      strategy: "firestore-transaction-todo",
      reservationState: "not-attempted",
      duplicateRequestDetected: false
    });
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Phase 5 verification seam preserves that capturePin remains unguarded by the development backend capability gate", async () => {
  const captureModule = await loadCaptureModule();
  const handler = captureModule.createCapturePinHandler(
    createNoopCaptureDependencies()
  );

  await assert.rejects(
    handler(
      buildAuthenticatedCallableRequest({
        data: {}
      })
    ),
    (error) => {
      assert.equal(error.code, "invalid-argument");
      assert.match(error.message, /requestId/);
      return true;
    }
  );
});
