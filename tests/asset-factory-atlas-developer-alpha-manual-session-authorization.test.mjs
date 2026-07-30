import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const authorizationRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-developer-alpha-manual-authorization/ATLAS_DEVELOPER_ALPHA_MANUAL_SESSION_AUTHORIZATION_001"
);

const authorizationRecordPath = path.join(
  authorizationRoot,
  "authorization/atlas-developer-alpha-manual-session-authorization-record.json"
);
const operatorAuthorizationPath = path.join(
  authorizationRoot,
  "operators/atlas-developer-alpha-manual-operator-authorization-record.json"
);
const scopeConfirmationPath = path.join(
  authorizationRoot,
  "scope/atlas-developer-alpha-manual-session-scope-confirmation.json"
);
const validationPath = path.join(
  authorizationRoot,
  "validation/atlas-developer-alpha-manual-session-authorization-validation.json"
);
const lifecyclePath = path.join(
  authorizationRoot,
  "lifecycle/atlas-developer-alpha-manual-session-authorization-lifecycle.json"
);
const reportPath = path.join(
  authorizationRoot,
  "reports/atlas-developer-alpha-manual-session-authorization-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-developer-alpha-manual-session-authorization.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas developer alpha manual session authorization is deterministic", () => {
  const first = moduleUnderTest.buildAtlasDeveloperAlphaManualSessionAuthorization({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasDeveloperAlphaManualSessionAuthorization({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.authorizationRecord, second.authorizationRecord);
  assert.deepEqual(first.operatorAuthorization, second.operatorAuthorization);
  assert.deepEqual(first.scopeConfirmation, second.scopeConfirmation);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycle, second.lifecycle);
});

test("atlas developer alpha manual session authorization confirms scope, authorized users, preconditions, and review expiry", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaManualSessionAuthorization({
    cwd: repoRoot
  });

  assert.equal(
    result.authorizationRecord.authorizationState,
    "AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION"
  );
  assert.deepEqual(result.authorizationRecord.authorizedUsers, [
    "atlas_operator",
    "internal_developer_reviewer"
  ]);
  assert.equal(result.scopeConfirmation.environment, "DEVELOPMENT_ONLY");
  assert.equal(result.scopeConfirmation.durationLimitMinutes, 30);
  assert.equal(result.authorizationRecord.preconditions.length >= 7, true);
  assert.equal(result.authorizationRecord.authorizationReview.expiresOn, "2026-08-06");
});

test("atlas developer alpha manual session authorization preserves blocked runtime, map, renderer, blender, glb, and asset mutation state", () => {
  const result = moduleUnderTest.buildAtlasDeveloperAlphaManualSessionAuthorization({
    cwd: repoRoot
  });

  assert.equal(result.validation.runtimeExecutionEnabled, false);
  assert.equal(result.validation.mapAttachmentAllowed, false);
  assert.equal(result.validation.automaticRendererExecutionAllowed, false);
  assert.equal(result.validation.rendererAttachmentAuthorized, false);
  assert.equal(result.validation.mapDownloadsAuthorized, false);
  assert.equal(result.validation.blenderAuthorized, false);
  assert.equal(result.validation.glbAuthorized, false);
  assert.equal(result.validation.assetModificationAuthorized, false);
});

test("atlas developer alpha manual session authorization writes records and reaches authorized lifecycle state", () => {
  moduleUnderTest.writeAtlasDeveloperAlphaManualSessionAuthorization({
    cwd: repoRoot
  });

  const authorizationRecord = readJson(authorizationRecordPath);
  const operatorAuthorization = readJson(operatorAuthorizationPath);
  const scopeConfirmation = readJson(scopeConfirmationPath);
  const validation = readJson(validationPath);
  const lifecycle = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(authorizationRecord.authorizedOn, "2026-07-30");
  assert.equal(operatorAuthorization.authorizedUsers.length, 2);
  assert.equal(scopeConfirmation.permittedRegion.expectedRecipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(validation.status, "pass");
  assert.equal(
    lifecycle.lifecycleStatus,
    "MANUAL_SESSION_AUTHORIZED_PENDING_FUTURE_MANUAL_DEVELOPER_EXECUTION"
  );
  assert.match(
    report,
    /Developer alpha manual session authorization state: AUTHORIZED_FOR_FUTURE_MANUAL_DEVELOPER_ALPHA_SESSION/
  );
});
