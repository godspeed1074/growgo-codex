import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/authoritativePinBackendSectionCloseout.js"
    )
  );
}

async function loadRuntimeConfigModule() {
  return import(path.join(repoRoot, "functions/lib/config/runtimeConfig.js"));
}

test("authoritative pin backend closeout report is closed-passive, serializable, immutable, and hands work back to Custom 2.5D", async () => {
  const module = await loadModule();
  const runtime = await loadRuntimeConfigModule();
  const before = JSON.stringify(runtime.runtimeConfig.authoritativeSourceAcquisition);
  const report = module.getAuthoritativePinBackendSectionCloseoutReport();
  const serialized = JSON.parse(JSON.stringify(report));

  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.verifiedCapabilities), true);
  assert.equal(Object.isFrozen(report.deferredProductionDecisions), true);
  assert.equal(Object.isFrozen(report.safetyInvariants), true);
  assert.equal(report.status, "closed-passive");
  assert.equal(report.implementationCompleteForCurrentSection, true);
  assert.equal(report.productionActivationAuthorized, false);
  assert.equal(report.productionAcquisitionEnabled, false);
  assert.equal(report.productionCacheReadsEnabled, false);
  assert.equal(report.productionCacheWritesEnabled, false);
  assert.equal(report.productionRemoteTransportEnabled, false);
  assert.equal(report.productionStaleFallbackEnabled, false);
  assert.equal(report.captureAcceptanceEnabled, false);
  assert.equal(report.rewardsEnabled, false);
  assert.equal(report.additionalBackendPhaseAuthorized, false);
  assert.equal(report.nextProjectArea, "custom-2.5d-renderer");
  assert.equal(report.canonicalContract.spacingMetres, 50);
  assert.equal(report.canonicalContract.captureRadiusMetres, 100);
  assert.equal(report.canonicalContract.coordinateToleranceMetres, 1);
  assert.equal(report.cacheContract.schemaVersion, 1);
  assert.equal(report.cacheContract.collectionName, "authoritativePinSourcesV1");
  assert.equal(report.transportContract.timeoutMilliseconds, 5000);
  assert.equal(report.transportContract.maximumRequestsPerInvocation, 1);
  assert.equal(report.transportContract.automaticRetries, 0);
  assert.equal(report.testEvidence.focusedTestsPassed, 54);
  assert.equal(report.testEvidence.focusedTestsFailed, 0);
  assert.equal(report.testEvidence.emulatorRuntimeExecuted, false);
  assert.equal(report.testEvidence.emulatorRuntimeSafelySkipped, true);
  assert.equal(serialized.status, "closed-passive");
  assert.equal(serialized.additionalBackendPhaseAuthorized, false);
  assert.ok(
    report.deferredProductionDecisions.includes("production-cache-read-activation")
  );
  assert.ok(
    report.deferredProductionDecisions.includes("deployment-and-staged-rollout")
  );
  assert.ok(
    report.safetyInvariants.includes("capture-remains-eligibility-deferred")
  );
  assert.ok(
    report.verifiedCapabilities.includes("production-fail-closed-wiring")
  );
  assert.equal(
    JSON.stringify(runtime.runtimeConfig.authoritativeSourceAcquisition),
    before
  );
});

test("authoritative pin backend closeout report fails closed for malformed options and cannot authorize production or another backend phase", async () => {
  const module = await loadModule();

  for (const options of [
    true,
    "true",
    1,
    "enabled",
    { productionActivationAuthorized: true },
    { productionCacheReadsEnabled: true },
    { productionCacheWritesEnabled: true },
    { productionRemoteTransportEnabled: true },
    { captureAcceptanceEnabled: true },
    { rewardsEnabled: true },
    { additionalBackendPhaseAuthorized: true },
    { clientData: { activate: true } },
    { playerData: { activate: true } },
    { env: { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8088" } }
  ]) {
    const report = module.getAuthoritativePinBackendSectionCloseoutReport(
      options
    );

    assert.equal(report.status, "closed-passive");
    assert.equal(report.productionActivationAuthorized, false);
    assert.equal(report.productionAcquisitionEnabled, false);
    assert.equal(report.productionCacheReadsEnabled, false);
    assert.equal(report.productionCacheWritesEnabled, false);
    assert.equal(report.productionRemoteTransportEnabled, false);
    assert.equal(report.captureAcceptanceEnabled, false);
    assert.equal(report.rewardsEnabled, false);
    assert.equal(report.additionalBackendPhaseAuthorized, false);
    assert.equal(report.nextProjectArea, "custom-2.5d-renderer");
  }
});
