import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_17_MANUAL_LOCALHOST_RENDERER_HANDOFF_AUTHORIZATION_VERIFICATION.md"
);

test("phase 211.17 evidence record honestly preserves the discovered Safari defect", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(
    source,
    /feat\(atlas\): add one-session developer renderer handoff authorization/
  );
  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"developmentPageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(source, /"executionStatus": "FAIL — READINESS_DRIFT_PERMISSION_RESTORED"/);
  assert.match(source, /ATLAS_RENDERER_HANDOFF_ONE_SESSION_001/);
  assert.match(source, /overall Phase 211\.17:\s+- `FAIL — READINESS_DRIFT_PERMISSION_RESTORED`/);
});

test("phase 211.17 evidence record preserves the exact defect progression", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"authorizationActive": true/);
  assert.match(source, /"authorizationConsumed": false/);
  assert.match(source, /"currentReadinessMatchesAuthorization": true/);
  assert.match(source, /"currentReadinessReasonCode": "READINESS_MATCHED"/);
  assert.match(source, /"rendererInitializationAllowed": true/);
  assert.match(source, /"rendererAttachmentAllowed": true/);
  assert.match(source, /"drawAllowed": true/);
  assert.match(source, /REGION_OUT_OF_SCOPE/);
  assert.match(source, /sessionIdStillActive/);
  assert.match(source, /Fresh Safari Retest Still Needed/i);
});

test("phase 211.17 evidence record preserves canonical false flags and marks the failed attempt as requiring retest", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
  assert.match(source, /"firstSafariAttemptDiscoveredDefect": true/);
  assert.match(source, /"freshSafariRetestRequiredAfterPhase21117a": true/);
  assert.match(source, /defect preserved:\s+- `YES`/);
  assert.match(source, /fresh Safari retest required:\s+- `YES`/);
});
