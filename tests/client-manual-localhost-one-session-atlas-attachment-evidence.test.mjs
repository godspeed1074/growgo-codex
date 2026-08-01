import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_9_MANUAL_LOCALHOST_ONE_SESSION_ATLAS_ATTACHMENT_VERIFICATION.md"
);

test("phase 211.9 evidence record preserves completed Safari closeout truth", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(
    source,
    /feat\(atlas\): add one-session developer attachment authorization/
  );
  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"developmentPageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(source, /AUTHORIZE_ATLAS_ONE_SESSION/);
  assert.match(source, /"executionStatus": "PASS"/);
  assert.match(source, /overall Phase 211\.9: `PASS`/);
  assert.match(source, /application implementation changes for Phase 211\.10 closeout: `none`/i);
  assert.match(source, /real browser evidence recorded: `yes`/i);
});

test("phase 211.9 evidence record captures the verified one-session attach flow", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"reasonCode": "MAP_ATTACHMENT_NOT_AUTHORIZED"/);
  assert.match(source, /"reasonCode": "INVALID_CONFIRMATION"/);
  assert.match(source, /"reasonCode": "AUTHORIZED_ONE_SESSION"/);
  assert.match(source, /"reasonCode": "ATTACHED"/);
  assert.match(source, /"reasonCode": "ALREADY_ATTACHED"/);
  assert.match(source, /"listenerEventName": "moveend"/);
  assert.match(source, /"ownedListenerCount": 1/);
  assert.match(source, /"diagnosticInvocationCount": 42/);
  assert.match(source, /"diagnosticInvocationCount": 43/);
  assert.match(source, /"lastDiagnosticStatus": "resolved"/);
  assert.match(source, /"lastReasonCode": "RESOLVED"/);
  assert.match(source, /"diagnosticStatus": "blocked"/);
  assert.match(source, /"reasonCode": "REGION_OUT_OF_SCOPE"/);
  assert.match(source, /"diagnosticStatus": "resolved"/);
  assert.match(
    source,
    /REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION/
  );
  assert.match(
    source,
    /ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001/
  );
  assert.match(source, /"recipeId": "COASTAL_LOCATION_RECIPE_001"/);
  assert.match(source, /"confidenceScore": 100/);
  assert.match(source, /"fallbackApplied": false/);
  assert.match(source, /"reasonCode": "DETACHED"/);
  assert.match(source, /"reasonCode": "ALREADY_DETACHED"/);
});

test("phase 211.9 evidence record preserves canonical false flags and post-reload lock state", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
  assert.match(source, /"authorizationSource": "canonical"/);
  assert.match(source, /"effectiveMapAttachmentAllowed": false/);
  assert.match(source, /"attachAllowed": false/);
  assert.match(source, /"attached": false/);
  assert.match(source, /"ownedListenerCount": 0/);
  assert.match(source, /"livePageDetachedByDefault": true/);
  assert.match(source, /"rendererActivity": false/);
  assert.match(source, /"overlayActivity": false/);
  assert.match(source, /"networkActivity": false/);
  assert.match(source, /"pollingOrTimerActivity": false/);
  assert.match(source, /authorizationDidNotPersist": true/);
  assert.match(source, /pageReloadRestoredFreshUnauthorizedState": true/);
  assert.match(
    source,
    /one emitted `moveend` event, while the controller continued to own exactly one listener/i
  );
});
