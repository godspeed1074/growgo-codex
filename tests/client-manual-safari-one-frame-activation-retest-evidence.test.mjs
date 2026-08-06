import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_50B_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_RETEST.md"
);

test("phase 211.50b evidence preserves the correct branch checkpoint and the second failed Safari retest honestly", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(source, /verified by committed contents at `HEAD`/i);
  assert.match(
    source,
    /GROWGO_SESSION_211_50A_LIVE_ONE_FRAME_STACK_RECURSION_FIX\.md/
  );
  assert.match(source, /focused one-frame command \/ adapter \/ bridge \/ snapshot \/ lifecycle suites:\s+- `PASS`/);
  assert.match(source, /full filtered Phase 211\.18 through 211\.50 regression band:\s+- `PASS`/);
  assert.match(source, /"executionStatus": "FAIL"/);
  assert.match(source, /"browser": "Safari"/);
  assert.match(source, /"pageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(source, /MAXIMUM_CALL_STACK_SIZE_EXCEEDED/);
  assert.match(source, /overall Phase 211\.50b:\s+- `FAIL`/);
});

test("phase 211.50b evidence prep preserves the exact Safari retest procedure and forbids wrong-confirmation testing in the same page instance", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /typeof window\.GrowGoDeveloperDiagnostics[\s\S]*runAuthorizedAtlasCustom25DOneFrame/
  );
  assert.match(
    source,
    /setView\(\s*\[-38\.12,\s*144\.61\],\s*15,\s*\{\s*animate:\s*false\s*\}\s*\)/
  );
  assert.match(
    source,
    /authorizeAtlasRendererHandoffSession\(\{[\s\S]*AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION/
  );
  assert.match(
    source,
    /runAuthorizedAtlasCustom25DOneFrame\(\{[\s\S]*RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME/
  );
  assert.match(source, /Do \*\*not\*\* test the wrong command confirmation in this page instance\./);
  assert.match(source, /COMMAND_ALREADY_USED/);
  assert.match(source, /FAILED_CLOSED_MAXIMUM_CALL_STACK_SIZE_EXCEEDED/);
  assert.match(source, /SURFACE_PREPARED_ONLY/);
});

test("phase 211.50b evidence source-locks the failed Safari result and preserved safety expectations", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /browser: `Safari`/);
  assert.match(source, /page: `http:\/\/127\.0\.0\.1:8000`/);
  assert.match(source, /diagnosticStatus = resolved/);
  assert.match(source, /rendererHandoffStatus = ready_for_future_renderer_attachment/);
  assert.match(source, /authorizationActive = true/);
  assert.match(source, /authorizationConsumed = false/);
  assert.match(source, /frameSnapshotCreated = false/);
  assert.match(source, /drawAttemptCount = 0/);
  assert.match(source, /completedFrameCount = 0/);
  assert.match(source, /cleanupAttemptCount = 1/);
  assert.match(source, /cleanupCompleted = true/);
  assert.match(source, /runtimeExecutionEnabled": false/);
  assert.match(source, /mapAttachmentAllowed": false/);
  assert.match(source, /automaticRendererExecutionAllowed": false/);
  assert.match(source, /lifecycleExecutionEnabled": false/);
  assert.match(source, /authorizationConsumed = true/);
  assert.match(source, /no persistent Canvas, listener, pane, or overlay remained/);
  assert.match(
    source,
    /GROWGO_SESSION_211_50AQ_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_CLOSEOUT\.md/
  );
  assert.match(source, /Historical Closeout Addendum/);
  assert.doesNotMatch(source, /overall Phase 211\.50b:\s+- `PASS`/);
});
