import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/config/developmentBackendOperationalSafeguards.js"
    )
  );
}

function buildEnv(overrides = {}) {
  return {
    GROWGO_BACKEND_ENVIRONMENT: "development",
    GROWGO_BACKEND_PROJECT_ID: "growgo-development",
    GROWGO_DEVELOPMENT_BACKEND_ENABLED: "true",
    GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED: "true",
    GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED: "false",
    GROWGO_DEVELOPMENT_PIN_CAPTURE_ENABLED: "false",
    GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED: "true",
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "false",
    GROWGO_DEVELOPMENT_BACKEND_EMERGENCY_DISABLED: "false",
    GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_EMERGENCY_DISABLED: "false",
    GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: undefined,
    GROWGO_DEVELOPMENT_BACKEND_LOGGING_LEVEL: "off",
    ...overrides
  };
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("missing operational safeguards flag denies with safe bounded defaults", async () => {
  const module = await loadModule();
  const decision = module.evaluateDevelopmentBackendOperationalSafeguardAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: undefined,
      GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled"
    }),
    operation: "player_snapshot",
    uid: "player-001"
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "operational_safeguards_disabled");
  assert.equal(decision.rateLimitPolicy.maxRequests, 12);
  assert.equal(decision.rateLimitPolicy.windowSeconds, 60);
});

test("invalid or missing rollback state fails closed to passive safe behavior", async () => {
  const module = await loadModule();

  const missing = module.evaluateDevelopmentBackendOperationalSafeguardAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
      GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: undefined
    }),
    operation: "player_snapshot",
    uid: "player-001"
  });
  const invalid = module.evaluateDevelopmentBackendOperationalSafeguardAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
      GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "enabled-now"
    }),
    operation: "player_snapshot",
    uid: "player-001"
  });

  assert.equal(missing.allowed, false);
  assert.equal(missing.rollbackState, "normal_fail_closed");
  assert.equal(missing.reason, "rollback_state_active");
  assert.equal(invalid.allowed, false);
  assert.equal(invalid.rollbackState, "normal_fail_closed");
  assert.equal(invalid.reason, "rollback_state_active");
});

test("global emergency disable overrides otherwise-true development flags", async () => {
  const module = await loadModule();
  const decision = module.evaluateDevelopmentBackendOperationalSafeguardAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
      GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled",
      GROWGO_DEVELOPMENT_BACKEND_EMERGENCY_DISABLED: "true"
    }),
    operation: "player_snapshot",
    uid: "player-001"
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "emergency_disable_active");
  assert.equal(decision.eventName, "emergency_disable_active");
});

test("snapshot-specific emergency disable overrides otherwise-true development flags", async () => {
  const module = await loadModule();
  const decision = module.evaluateDevelopmentBackendOperationalSafeguardAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
      GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled",
      GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_EMERGENCY_DISABLED: "true"
    }),
    operation: "player_snapshot",
    uid: "player-001"
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "emergency_disable_active");
});

test("same player eventually exceeds the bounded snapshot polling limit", async () => {
  const module = await loadModule();
  const limiter = module.createInMemoryDevelopmentBackendOperationalRateLimiter();
  const env = buildEnv({
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
    GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled"
  });
  let denied = null;

  for (let index = 0; index < 13; index += 1) {
    denied = module.evaluateDevelopmentBackendOperationalSafeguardAccess({
      env,
      operation: "player_snapshot",
      uid: "player-001",
      limiter,
      now: new Date("2026-07-22T10:00:00.000Z")
    });
  }

  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, "rate_limit_exceeded");
  assert.equal(denied.rateLimitPolicy.maxRequests, 12);
});

test("different players remain isolated by the process-local per-operation limiter", async () => {
  const module = await loadModule();
  const limiter = module.createInMemoryDevelopmentBackendOperationalRateLimiter();
  const env = buildEnv({
    GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
    GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled"
  });

  for (let index = 0; index < 12; index += 1) {
    const firstPlayerDecision =
      module.evaluateDevelopmentBackendOperationalSafeguardAccess({
        env,
        operation: "player_snapshot",
        uid: "player-001",
        limiter,
        now: new Date("2026-07-22T10:00:00.000Z")
      });
    assert.equal(firstPlayerDecision.allowed, true);
  }

  const secondPlayerDecision =
    module.evaluateDevelopmentBackendOperationalSafeguardAccess({
      env,
      operation: "player_snapshot",
      uid: "player-002",
      limiter,
      now: new Date("2026-07-22T10:00:00.000Z")
    });

  assert.equal(secondPlayerDecision.allowed, true);
  assert.equal(secondPlayerDecision.rateLimitRecord.remaining, 11);
});

test("rate-limit uncertainty fails closed", async () => {
  const module = await loadModule();
  const decision = module.evaluateDevelopmentBackendOperationalSafeguardAccess({
    env: buildEnv({
      GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED: "true",
      GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE: "development_enabled"
    }),
    operation: "player_snapshot",
    uid: "player-001",
    limiter: {
      consume() {
        return null;
      }
    }
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "rate_limit_state_unavailable");
});

test("rate-limit storage decision stays process-local and introduces no hot Firestore document", async () => {
  const module = await loadModule();
  const source = read(
    "functions/src/config/developmentBackendOperationalSafeguards.ts"
  );

  assert.equal(
    module.developmentBackendRateLimitStorageDecision.storageKind,
    "process_local_secondary_safeguard"
  );
  assert.equal(
    module.developmentBackendRateLimitStorageDecision.globalHotDocumentIntroduced,
    false
  );
  assert.doesNotMatch(source, /getAdminFirestore|firebase-admin|collection\(/);
});

test("per-operation cost budgets stay exact and bounded", async () => {
  const module = await loadModule();

  assert.equal(
    module.developmentBackendOperationalCostBudgets.player_snapshot.deniedPath.reads,
    0
  );
  assert.equal(
    module.developmentBackendOperationalCostBudgets.player_snapshot.firstRequest.reads,
    1
  );
  assert.equal(
    module.developmentBackendOperationalCostBudgets.pin_capture.firstRequest.writes,
    2
  );
  assert.equal(
    module.developmentBackendOperationalCostBudgets.pin_capture.duplicateOrReplayRequest.writes,
    0
  );
  assert.equal(
    module.developmentBackendOperationalCostBudgets.pin_capture.conflictingRequest.writes,
    0
  );
  assert.equal(
    module.developmentBackendOperationalCostBudgets.authoritative_pin_acquisition.firstRequest.transportAttempts,
    1
  );
  assert.equal(
    module.developmentBackendOperationalCostBudgets.authoritative_pin_acquisition.automaticRetryCount,
    0
  );
  assert.equal(
    module.developmentBackendOperationalCostBudgets.authoritative_pin_acquisition.timeoutMilliseconds,
    5000
  );
});

test("observability event names and reason codes are stable", async () => {
  const module = await loadModule();

  assert.deepEqual(module.developmentBackendObservabilityEventNames, [
    "capability_denied",
    "authentication_rejected",
    "snapshot_allowed",
    "snapshot_denied",
    "capture_deferred",
    "capture_replayed",
    "capture_conflict",
    "rate_limit_denied",
    "authoritative_cache_hit",
    "authoritative_cache_miss",
    "authoritative_transport_blocked",
    "emergency_disable_active",
    "rollback_state_active"
  ]);
  assert.deepEqual(module.developmentBackendOperationalSafeguardReasonCodes, [
    "allowed",
    "development_access_denied",
    "operational_safeguards_disabled",
    "emergency_disable_active",
    "rollback_state_active",
    "rate_limit_exceeded",
    "rate_limit_state_unavailable"
  ]);
});

test("structured log events redact secrets, raw fingerprints, and precise coordinates while remaining bounded", async () => {
  const module = await loadModule();
  const event = module.buildDevelopmentBackendStructuredLogEvent({
    eventName: "capture_conflict",
    operation: "pin_capture",
    reason: "conflict",
    loggingLevel: "redacted",
    uid: "player-001",
    authToken: "secret-token",
    secret: "top-secret",
    rawFingerprint: "abcdef0123456789",
    latitude: -38.45,
    longitude: 145.24,
    payload: {
      nested: "value"
    }
  });

  assert.deepEqual(Object.keys(event).sort(), [
    "eventName",
    "loggingLevel",
    "operation",
    "reason",
    "schemaVersion",
    "uidHash"
  ]);
  assert.equal(event.uidHash.length, 12);
  assert.equal(
    Buffer.byteLength(JSON.stringify(event), "utf8") <=
      module.DEVELOPMENT_BACKEND_OPERATIONAL_LOG_EVENT_MAX_BYTES,
    true
  );
  assert.doesNotMatch(JSON.stringify(event), /secret-token|top-secret|abcdef0123456789|-38\.45|145\.24/);
});

test("replay observability emission gate suppresses noisy repeated replay logging within the same window", async () => {
  const module = await loadModule();
  const gate = module.createInMemoryDevelopmentBackendObservabilityEmissionGate();
  const firstNow = new Date("2026-07-22T10:00:00.000Z");
  const secondNow = new Date("2026-07-22T10:00:30.000Z");
  const laterNow = new Date("2026-07-22T10:01:01.000Z");

  assert.equal(
    gate.shouldEmit({
      eventName: "capture_replayed",
      dedupeKey: "player-001:capture-test-001",
      now: firstNow
    }),
    true
  );
  assert.equal(
    gate.shouldEmit({
      eventName: "capture_replayed",
      dedupeKey: "player-001:capture-test-001",
      now: secondNow
    }),
    false
  );
  assert.equal(
    gate.shouldEmit({
      eventName: "capture_replayed",
      dedupeKey: "player-001:capture-test-001",
      now: laterNow
    }),
    true
  );
});
