import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_17B_MANUAL_SAFARI_RENDERER_HANDOFF_AUTHORIZATION_DRIFT_RETEST.md"
);

test("phase 211.17b evidence template accepts d342055 by verified content and stays honestly pending", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(source, /accepted Phase 211\.17a checkpoint:\s+- `d342055`/);
  assert.match(source, /checkpoint acceptance basis:\s+- verified by content, not by commit message/i);
  assert.match(source, /history rewritten:\s+- `no`/i);
  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"developmentPageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(source, /"executionStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE"/);
  assert.match(source, /overall Phase 211\.17b:\s+- `PENDING_MANUAL_OPERATOR_EVIDENCE`/);
  assert.match(source, /application implementation changes made in Phase 211\.17b:\s+- `none`/);
});

test("phase 211.17b evidence template preserves the drift-spoil contract and fresh-session retest flow", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /authorizationInvalidated/);
  assert.match(source, /invalidationReasonCode = "REGION_OUT_OF_SCOPE"/);
  assert.match(source, /invalidatedAtReadinessReasonCode = "REGION_OUT_OF_SCOPE"/);
  assert.match(source, /the same session ID still exists until revoke/i);
  assert.match(source, /permission did \*\*not\*\* heal automatically/i);
  assert.match(source, /new session ID differs from the first one/i);
  assert.match(source, /Session 1 still-invalid status after return/);
  assert.match(source, /Session 2 authorization result/);
  assert.match(source, /Session 2 fresh status/);
  assert.match(source, /post-reload authorization status/);
});

test("phase 211.17b evidence template preserves canonical false flags and renderer inactivity requirements", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
  assert.match(source, /no renderer initialization occurred/i);
  assert.match(source, /no renderer attachment occurred/i);
  assert.match(source, /no draw occurred/i);
  assert.match(source, /no canvas appeared/i);
  assert.match(source, /no WebGL surface appeared/i);
  assert.match(source, /no DOM overlay appeared/i);
  assert.match(source, /no listener was added/i);
  assert.match(source, /no polling or timer activity appeared/i);
  assert.match(source, /no network request occurred/i);
  assert.match(source, /no asset download occurred/i);
});
