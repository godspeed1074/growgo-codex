import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/config/developmentBackendRuntimeConsumerAuthorization.js"
    )
  );
}

function buildPrerequisites(overrides = {}) {
  return {
    phase2ContractComplete: true,
    evaluatorAvailable: true,
    developmentEnvironmentIdentityContractAvailable: true,
    betaDenied: true,
    productionDenied: true,
    authGuardPresent: true,
    idempotencyReservationImplemented: true,
    idempotencyEmulatorCoverageComplete: true,
    futureImplementationAuthorizationRecorded: false,
    ...overrides
  };
}

function read(filePath) {
  return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
}

test("unknown consumer denies", async () => {
  const module = await loadModule();
  const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
    capability: "authentication",
    consumer: "missingCallable",
    prerequisites: buildPrerequisites()
  });

  assert.equal(report.status, "not_applicable");
  assert.equal(report.reason, "unknown_consumer");
});

test("unknown capability denies", async () => {
  const module = await loadModule();
  const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
    capability: "quests",
    consumer: "bootstrapPlayerCallable",
    prerequisites: buildPrerequisites()
  });

  assert.equal(report.status, "not_applicable");
  assert.equal(report.reason, "unknown_capability");
});

test("missing prerequisite blocks", async () => {
  const module = await loadModule();
  const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
    capability: "player_snapshot",
    consumer: "getPlayerSnapshotCallable",
    prerequisites: buildPrerequisites({
      evaluatorAvailable: false
    })
  });

  assert.equal(report.status, "authorization_blocked");
  assert.equal(report.reason, "evaluator_unavailable");
});

test("incomplete idempotency blocks pin-capture wiring", async () => {
  const module = await loadModule();
  const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
    capability: "pin_capture",
    consumer: "capturePinCallable",
    prerequisites: buildPrerequisites({
      idempotencyReservationImplemented: false,
      idempotencyEmulatorCoverageComplete: false
    })
  });

  assert.equal(report.status, "authorization_blocked");
  assert.equal(report.reason, "idempotency_reservation_incomplete");
});

test("existing auth guard presence is required", async () => {
  const module = await loadModule();
  const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
    capability: "authentication",
    consumer: "bootstrapPlayerCallable",
    prerequisites: buildPrerequisites({
      authGuardPresent: false
    })
  });

  assert.equal(report.status, "authorization_blocked");
  assert.equal(report.reason, "auth_guard_missing");
});

test("production and beta remain ineligible", async () => {
  const module = await loadModule();
  const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
    capability: "authentication",
    consumer: "getPlayerSnapshotCallable",
    prerequisites: buildPrerequisites({
      betaDenied: false
    })
  });

  assert.equal(report.status, "authorization_blocked");
  assert.equal(report.reason, "environment_scope_not_fail_closed");
  assert.equal(report.betaEligible, false);
  assert.equal(report.productionEligible, false);
});

test("evaluator availability alone does not authorize wiring", async () => {
  const module = await loadModule();
  const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
    capability: "authentication",
    consumer: "bootstrapPlayerCallable",
    prerequisites: buildPrerequisites({
      futureImplementationAuthorizationRecorded: false
    })
  });

  assert.equal(report.status, "candidate_identified");
  assert.equal(report.reason, "future_implementation_authorization_missing");
  assert.equal(report.runtimeActivationAuthorized, false);
});

test("candidate consumer may be marked ready only for future implementation", async () => {
  const module = await loadModule();
  const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
    capability: "player_snapshot",
    consumer: "getPlayerSnapshotCallable",
    prerequisites: buildPrerequisites({
      futureImplementationAuthorizationRecorded: true
    })
  });

  assert.equal(report.status, "ready_for_future_wiring");
  assert.equal(report.reason, "ready_for_future_wiring");
  assert.equal(report.runtimeActivationAuthorized, false);
  assert.equal(report.evaluatorWiringPresent, false);
  assert.equal(report.mayBeWiredInPhase4OrLater, true);
});

test("no state can be active", async () => {
  const module = await loadModule();

  assert.deepEqual(module.developmentBackendRuntimeConsumerAuthorizationStatuses, [
    "not_applicable",
    "candidate_identified",
    "authorization_blocked",
    "ready_for_future_wiring"
  ]);
  assert.equal(
    module.developmentBackendRuntimeConsumerAuthorizationStatuses.includes(
      "active"
    ),
    false
  );
});

test("no Firebase initialization or network access occurs", async () => {
  const module = await loadModule();
  const originalFetch = globalThis.fetch;
  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error("unexpected network activity");
  };

  try {
    const report = module.evaluateDevelopmentBackendRuntimeConsumerAuthorization({
      capability: "authoritative_pin_acquisition",
      consumer: "authoritativePinAcquisitionService",
      prerequisites: buildPrerequisites()
    });

    assert.equal(fetchCalled, false);
    assert.equal(report.status, "candidate_identified");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("no runtime module imports the helper", async () => {
  void (await loadModule());

  for (const filePath of [
    "functions/src/index.ts",
    "functions/src/api/bootstrapPlayer.ts",
    "functions/src/api/getPlayerSnapshot.ts",
    "functions/src/api/capturePin.ts"
  ]) {
    const source = read(filePath);
    assert.doesNotMatch(
      source,
      /developmentBackendRuntimeConsumerAuthorization/
    );
  }
});

test("no callable behavior changes are required by the passive helper contract", async () => {
  void (await loadModule());

  assert.match(
    read("functions/src/api/bootstrapPlayer.ts"),
    /requireAuthenticated\(request\)/
  );
  assert.match(
    read("functions/src/api/getPlayerSnapshot.ts"),
    /requireAuthenticated\(request\)/
  );
  assert.match(
    read("functions/src/api/capturePin.ts"),
    /createCapturePinHandler\(defaultCapturePinDependencies\)/
  );
});
