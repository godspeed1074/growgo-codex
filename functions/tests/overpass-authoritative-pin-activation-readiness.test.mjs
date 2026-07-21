import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/infrastructure/pins/overpassAuthoritativePinActivationReadiness.js"
    )
  );
}

async function loadRuntimeConfigModule() {
  return import(path.join(repoRoot, "functions/lib/config/runtimeConfig.js"));
}

test("overpass activation readiness report remains passive, frozen, serializable, and production-denying", async () => {
  const module = await loadModule();
  const runtime = await loadRuntimeConfigModule();
  const before = JSON.stringify(runtime.runtimeConfig.authoritativeSourceAcquisition);
  const report = module.getOverpassAuthoritativePinActivationReadinessReport();
  const serialized = JSON.parse(JSON.stringify(report));

  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.blockers), true);
  assert.equal(Object.isFrozen(report.satisfiedChecks), true);
  assert.equal(report.readyForManualEmulatorActivation, false);
  assert.equal(report.productionActivationAllowed, false);
  assert.equal(report.liveHttpClientPresent, false);
  assert.equal(report.endpointConfigured, false);
  assert.equal(report.remoteTransportEnabled, false);
  assert.equal(report.timeoutMilliseconds, 5000);
  assert.equal(report.maximumRequestsPerInvocation, 1);
  assert.equal(report.automaticRetries, 0);
  assert.equal(serialized.productionActivationAllowed, false);
  assert.match(JSON.stringify(report), /manual-activation-not-authorized/);
  assert.ok(report.blockers.includes("manual-activation-not-authorized"));
  assert.ok(report.blockers.includes("live-http-client-absent"));
  assert.ok(report.blockers.includes("endpoint-not-configured"));
  assert.ok(report.satisfiedChecks.includes("parser-available"));
  assert.ok(
    report.satisfiedChecks.includes("deterministic-exact-way-query-available")
  );
  assert.equal(
    JSON.stringify(runtime.runtimeConfig.authoritativeSourceAcquisition),
    before
  );
});

test("overpass activation readiness report fails closed for malformed options and never activates anything", async () => {
  const module = await loadModule();

  for (const options of [
    "true",
    1,
    { liveHttpClientPresent: true, endpointConfigured: true },
    { clientData: { activate: true } },
    { player: { activateTransport: true } }
  ]) {
    const report = module.getOverpassAuthoritativePinActivationReadinessReport(
      options
    );
    assert.equal(report.productionActivationAllowed, false);
    assert.equal(report.liveHttpClientPresent, false);
    assert.equal(report.endpointConfigured, false);
    assert.equal(report.remoteTransportEnabled, false);
    assert.equal(report.readyForManualEmulatorActivation, false);
  }
});
