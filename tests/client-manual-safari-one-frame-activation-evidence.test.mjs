import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_50_MANUAL_SAFARI_ONE_FRAME_ACTIVATION_VERIFICATION.md"
);

test("phase 211.50 evidence record preserves the correct branch commit failed first-run status and Safari target", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(
    source,
    /f7dc8fa feat\(atlas\): add manual-gated one-frame activation command/
  );
  assert.match(
    source,
    /MANUAL_GATED_ONE_FRAME_COMMAND_READY_FOR_SAFARI_VERIFICATION/
  );
  assert.match(source, /focused Phase 211\.18 through 211\.49 regression band:\s+- `PASS`/);
  assert.match(source, /"executionStatus": "FAIL — MAXIMUM_CALL_STACK_SIZE_EXCEEDED"/);
  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"developmentPageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(source, /overall Phase 211\.50:\s+- `FAIL — MAXIMUM_CALL_STACK_SIZE_EXCEEDED`/);
});

test("phase 211.50 evidence record preserves the exact manual command procedure and the failed first live execution facts", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /runAuthorizedAtlasCustom25DOneFrame\(\{\s*[\s\S]*confirmation: "RUN_AUTHORIZED_ATLAS_CUSTOM25D_ONE_FRAME"/
  );
  assert.match(
    source,
    /authorizeAtlasRendererHandoffSession\(\{\s*[\s\S]*confirmation: "AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION"/
  );
  assert.match(source, /one temporary Atlas custom 2\.5D frame appeared/);
  assert.match(source, /second invocation is blocked/);
  assert.match(source, /authorization state is fresh and inactive again/);
  assert.match(source, /MAXIMUM_CALL_STACK_SIZE_EXCEEDED/);
  assert.match(source, /"surfacePrepared": true/);
  assert.match(source, /"frameSnapshotCreated": false/);
  assert.match(source, /"drawAttemptCount": 0/);
  assert.match(source, /"cleanupCompleted": true/);
  assert.match(source, /fresh Safari retest required after fix/i);
  assert.doesNotMatch(source, /overall Phase 211\.50:\s+- `PASS`/);
});

test("phase 211.50 evidence record preserves canonical false flags and forbids fabricated Safari recovery claims", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
  assert.match(source, /Do \*\*not\*\* claim yet that Phase 211\.50 has been corrected in Safari\./);
  assert.match(source, /first genuine Safari live command output recorded:\s+- `yes`/i);
  assert.match(source, /first genuine Safari live command passed:\s+- `no`/i);
  assert.match(source, /failed first Safari evidence preserved:\s+- `yes`/i);
});
