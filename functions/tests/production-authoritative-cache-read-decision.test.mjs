import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/productionAuthoritativeCacheReadDecision.js"
    )
  );
}

async function loadRuntimeConfigModule() {
  return import(path.join(repoRoot, "functions/lib/config/runtimeConfig.js"));
}

test("production authoritative cache-read decision remains passive, frozen, serializable, and not authorized by default", async () => {
  const module = await loadModule();
  const runtime = await loadRuntimeConfigModule();
  const before = JSON.stringify(runtime.runtimeConfig.authoritativeSourceAcquisition);
  const report = module.getProductionAuthoritativeCacheReadDecisionReport();
  const serialized = JSON.parse(JSON.stringify(report));

  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.blockers), true);
  assert.equal(Object.isFrozen(report.satisfiedChecks), true);
  assert.equal(report.decision, "not-authorized");
  assert.equal(report.productionCacheReadsAllowed, false);
  assert.equal(report.productionCacheWritesAllowed, false);
  assert.equal(report.productionRemoteTransportAllowed, false);
  assert.equal(report.captureAcceptanceAllowed, false);
  assert.equal(report.rewardsAllowed, false);
  assert.equal(report.emulatorRuntimeEvidenceAvailable, false);
  assert.equal(report.adapterUnitEvidenceAvailable, true);
  assert.equal(report.deterministicDocumentIdentityConfirmed, true);
  assert.equal(report.readValidationConfirmed, true);
  assert.equal(report.operationBoundConfirmed, true);
  assert.equal(report.nextAuthorizedAction, "backend-section-closeout");
  assert.equal(serialized.decision, "not-authorized");
  assert.equal(serialized.productionCacheReadsAllowed, false);
  assert.ok(
    report.blockers.includes("production-activation-not-authorized")
  );
  assert.ok(
    report.blockers.includes(
      "production-cache-reads-remain-disabled-by-locked-runtime-config"
    )
  );
  assert.ok(
    report.blockers.includes("local-emulator-runtime-evidence-still-pending")
  );
  assert.ok(
    report.satisfiedChecks.includes(
      "deterministic-cache-document-identity-confirmed"
    )
  );
  assert.ok(
    report.satisfiedChecks.includes(
      "production-cache-reads-remain-disabled"
    )
  );
  assert.equal(
    JSON.stringify(runtime.runtimeConfig.authoritativeSourceAcquisition),
    before
  );
});

test("production authoritative cache-read decision fails closed for malformed options and cannot be activated by supplied values", async () => {
  const module = await loadModule();

  for (const options of [
    true,
    "true",
    1,
    "enabled",
    { productionCacheReadsAllowed: true },
    { productionCacheWritesAllowed: true },
    { productionRemoteTransportAllowed: true },
    { captureAcceptanceAllowed: true },
    { rewardsAllowed: true },
    { clientData: { activate: true } },
    { playerData: { activate: true } },
    { env: { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8088" } },
    { requestData: { activate: true } },
    { emulatorRuntimeEvidenceAvailable: "true" },
    { emulatorRuntimeEvidenceAvailable: 1 }
  ]) {
    const report =
      module.getProductionAuthoritativeCacheReadDecisionReport(options);

    assert.equal(report.decision, "not-authorized");
    assert.equal(report.productionCacheReadsAllowed, false);
    assert.equal(report.productionCacheWritesAllowed, false);
    assert.equal(report.productionRemoteTransportAllowed, false);
    assert.equal(report.captureAcceptanceAllowed, false);
    assert.equal(report.rewardsAllowed, false);
    assert.equal(report.emulatorRuntimeEvidenceAvailable, false);
    assert.equal(report.nextAuthorizedAction, "backend-section-closeout");
  }
});

test("production authoritative cache-read decision can record runtime evidence without authorizing any production behavior", async () => {
  const module = await loadModule();

  const report = module.getProductionAuthoritativeCacheReadDecisionReport({
    emulatorRuntimeEvidenceAvailable: true
  });

  assert.equal(report.decision, "not-authorized");
  assert.equal(report.productionCacheReadsAllowed, false);
  assert.equal(report.productionCacheWritesAllowed, false);
  assert.equal(report.productionRemoteTransportAllowed, false);
  assert.equal(report.captureAcceptanceAllowed, false);
  assert.equal(report.rewardsAllowed, false);
  assert.equal(report.emulatorRuntimeEvidenceAvailable, true);
  assert.equal(
    report.blockers.includes("local-emulator-runtime-evidence-still-pending"),
    false
  );
  assert.equal(report.nextAuthorizedAction, "backend-section-closeout");
});
