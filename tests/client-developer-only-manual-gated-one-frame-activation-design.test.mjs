import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");
const developmentAlphaSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const adapterSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-growgo-custom25d-live-one-frame-adapter.mjs"
  ),
  "utf8"
);
const integrationContractSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-custom25d-gated-live-one-frame-integration-contract.mjs"
  ),
  "utf8"
);
const authorizationSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-atlas-renderer-handoff-authorization.mjs"
  ),
  "utf8"
);
const readinessSource = fs.readFileSync(
  path.join(
    repoRoot,
    "client",
    "developer-only-live-atlas-renderer-handoff-readiness.mjs"
  ),
  "utf8"
);
const sessionDesignSource = fs.readFileSync(
  path.join(
    repoRoot,
    "GROWGO_SESSION_211_48_MANUAL_GATED_ONE_FRAME_ACTIVATION_COMMAND_DESIGN.md"
  ),
  "utf8"
);

const FUTURE_COMMAND_NAME = "runAuthorizedAtlasCustom25DOneFrame";
const REQUIRED_CONFIRMATION = "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME";

test("phase 211.48 design record exists and captures the exact future command contract", () => {
  assert.match(
    sessionDesignSource,
    /GROWGO Session 211\.48 — Manual-Gated One-Frame Activation Command Design/
  );
  assert.match(
    sessionDesignSource,
    /window\.GrowGoDeveloperDiagnostics\.runAuthorizedAtlasCustom25DOneFrame\(\{/
  );
  assert.match(
    sessionDesignSource,
    /confirmation:\s*"RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"/
  );
  assert.match(sessionDesignSource, /local-development hosts only/);
  assert.match(sessionDesignSource, /one invocation attempt only/);
  assert.match(sessionDesignSource, /one authorization session only/);
  assert.match(sessionDesignSource, /one frame only/);
  assert.match(sessionDesignSource, /mandatory cleanup/);
  assert.match(sessionDesignSource, /permanent closure/);
});

test("phase 211.48 design source-locks the required ordering blocked cases and result fields", () => {
  for (const phrase of [
    "Confirm local host.",
    "Validate exact confirmation phrase.",
    "Read current Atlas renderer-handoff readiness.",
    "Read renderer-handoff authorization status.",
    "Validate that the Phase 211.47 live one-frame adapter is ready.",
    "Re-read readiness.",
    "Block on any drift.",
    "Only then allow the internal authorization-consumption seam to be used.",
    "Invoke the adapter exactly once.",
    "Permanently close the command.",
    "Block second execution."
  ]) {
    assert.match(sessionDesignSource, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  for (const field of [
    "schemaId",
    "operation",
    "outcome",
    "reasonCode",
    "commandState",
    "confirmationAccepted",
    "executionAttemptCount",
    "readinessReadCount",
    "readinessRevalidationCount",
    "authorizationValidated",
    "authorizationSessionId",
    "authorizationConsumed",
    "adapterReady",
    "adapterInvoked",
    "surfacePrepared",
    "lifecycleRegistered",
    "frameSnapshotCreated",
    "drawAttemptCount",
    "completedFrameCount",
    "cleanupAttemptCount",
    "cleanupCompleted",
    "cleanupFailureReasons",
    "referencesReleased",
    "permanentlyClosed",
    "secondExecutionBlocked",
    "boundRegionId",
    "boundPackageId",
    "boundPackageVersion",
    "boundPackageFingerprint",
    "boundRecipeId",
    "boundRecipeVersion",
    "boundSelectorSeed",
    "realRendererInvoked",
    "realDrawFunctionCalled",
    "realCanvasCreated",
    "realPaneCreated",
    "realWebglContextCreated",
    "realOverlayCreated",
    "realListenerAdded",
    "retentionWritten",
    "networkRequested",
    "assetDownloadRequested",
    "automaticInvocation"
  ]) {
    assert.match(sessionDesignSource, new RegExp(`- ${field}`));
  }

  for (const blockedCase of [
    "non-local host",
    "missing confirmation",
    "incorrect confirmation",
    "command already used",
    "missing readiness",
    "out-of-scope readiness",
    "renderer consumer unavailable",
    "renderer identity mismatch",
    "inactive authorization",
    "invalidated authorization",
    "consumed authorization",
    "readiness mismatch",
    "any bound identity mismatch",
    "adapter unavailable",
    "adapter not ready",
    "readiness drift before execution"
  ]) {
    assert.match(sessionDesignSource, new RegExp(blockedCase));
  }
});

test("phase 211.48 preserves the command boundary by keeping script.js passive and raw live seams unexposed", () => {
  assert.doesNotMatch(scriptSource, new RegExp(FUTURE_COMMAND_NAME));
  assert.doesNotMatch(scriptSource, new RegExp(REQUIRED_CONFIRMATION));
  assert.doesNotMatch(developmentAlphaSource, new RegExp(REQUIRED_CONFIRMATION));

  assert.doesNotMatch(
    scriptSource,
    /consumeAuthorizedRendererHandoffAttempt|executeDeveloperOnlyLiveOneFrameAdapter/
  );

  assert.match(scriptSource, /getCustom25DOneFrameBridge/);
  assert.match(
    developmentAlphaSource,
    /installDeveloperOnlyAtlasCustom25DOneFrameCommand/
  );
  assert.doesNotMatch(
    developmentAlphaSource,
    /GrowGoDeveloperDiagnostics\.[\s\S]*consumeAuthorizedRendererHandoffAttempt|GrowGoDeveloperDiagnostics\.[\s\S]*executeDeveloperOnlyLiveOneFrameAdapter|GrowGoDeveloperDiagnostics\.[\s\S]*completeDeferredCleanup/
  );
  assert.match(adapterSource, /executeDeveloperOnlyLiveOneFrameAdapter/);
  assert.match(authorizationSource, /consumeAuthorizedRendererHandoffAttempt/);
  assert.match(readinessSource, /getAtlasRendererHandoffReadiness/);
  assert.match(
    integrationContractSource,
    /revalidateReadinessBeforeConsumption|readinessRevalidation/
  );
});

test("phase 211.48 defines a visible one-frame cleanup decision without using timers or polling", () => {
  assert.match(
    sessionDesignSource,
    /The frame should remain visible for exactly one post-draw browser paint/
  );
  assert.match(
    sessionDesignSource,
    /single `requestAnimationFrame` cleanup boundary/
  );
  assert.match(sessionDesignSource, /do not use `setTimeout`/);
  assert.match(sessionDesignSource, /do not use `setInterval`/);
  assert.match(sessionDesignSource, /do not use polling/);
  assert.match(sessionDesignSource, /confirm no listener remains/);
  assert.match(sessionDesignSource, /confirm authorization is consumed/);
  assert.match(sessionDesignSource, /confirm second command attempt is blocked/);
  assert.match(sessionDesignSource, /confirm page reload restores a clean state/);
});

test("all four canonical safety flags remain false in the documented and implemented command prerequisites", () => {
  for (const source of [
    sessionDesignSource,
    authorizationSource,
    integrationContractSource,
    adapterSource
  ]) {
    assert.match(source, /runtimeExecutionEnabled[^a-zA-Z0-9]+false/);
    assert.match(source, /mapAttachmentAllowed[^a-zA-Z0-9]+false/);
    assert.match(source, /automaticRendererExecutionAllowed[^a-zA-Z0-9]+false/);
    assert.match(source, /lifecycleExecutionEnabled[^a-zA-Z0-9]+false/);
  }

  assert.match(readinessSource, /safetyFlagSnapshot/);
  assert.match(readinessSource, /automaticInvocation:\s*false/);
});
