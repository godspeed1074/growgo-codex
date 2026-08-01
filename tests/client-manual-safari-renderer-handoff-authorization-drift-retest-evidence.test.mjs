import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_17B_MANUAL_SAFARI_RENDERER_HANDOFF_AUTHORIZATION_DRIFT_RETEST.md"
);

test("phase 211.17b evidence closeout accepts d342055 by verified content and records genuine Safari PASS evidence", () => {
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
  assert.match(source, /"executionStatus": "PASS"/);
  assert.match(source, /"http429Observed": true/);
  assert.match(source, /"classification": "NON_BLOCKING_SUPPORTING_ENVIRONMENT_WARNING"/);
  assert.match(source, /overall Phase 211\.17b:\s+- `PASS`/);
  assert.match(source, /application implementation changes made in Phase 211\.17b:\s+- `none`/);
});

test("phase 211.17b evidence closeout preserves the irreversible drift-spoil contract and clean Session 2 recovery", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"sessionId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_001"/);
  assert.match(source, /"reasonCode": "REGION_OUT_OF_SCOPE"/);
  assert.match(source, /"authorizationInvalidated": true/);
  assert.match(source, /"currentReadinessMatchesAuthorization": false/);
  assert.match(source, /"invalidationReasonCode": "REGION_OUT_OF_SCOPE"/);
  assert.match(source, /"invalidatedAtReadinessReasonCode": "REGION_OUT_OF_SCOPE"/);
  assert.match(source, /Returning to the approved Bellarine coordinate restored readiness but did not repair Session 1/i);
  assert.match(source, /"outcome": "noop"/);
  assert.match(source, /"replacementSessionCreated": false/);
  assert.match(source, /"sessionTwoId": "ATLAS_RENDERER_HANDOFF_ONE_SESSION_002"/);
  assert.match(source, /"distinctIdentity": true/);
  assert.match(source, /"inheritedInvalidation": false/);
  assert.match(source, /"persistentAuthorization": false/);
  assert.match(source, /"storageUsed": false/);
});

test("phase 211.17b evidence closeout preserves canonical false flags, detached map state, and full renderer inactivity", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
  assert.match(source, /"rendererInitialized": false/);
  assert.match(source, /"rendererAttached": false/);
  assert.match(source, /"drawRequested": false/);
  assert.match(source, /"canvasCreated": false/);
  assert.match(source, /"webglContextCreated": false/);
  assert.match(source, /"overlayCreated": false/);
  assert.match(source, /"listenerAdded": false/);
  assert.match(source, /"networkRequested": false/);
  assert.match(source, /"assetDownloadRequested": false/);
  assert.match(source, /"attached": false/);
  assert.match(source, /"ownedListenerCount": 0/);
  assert.match(source, /"diagnosticInvocationCount": 0/);
  assert.match(source, /"lastDiagnosticStatus": null/);
  assert.match(source, /"lastReasonCode": null/);
  assert.match(source, /"automaticStartupAttachment": false/);
  assert.match(source, /"livePageDetachedByDefault": true/);
  assert.match(source, /"rendererActivity": false/);
  assert.match(source, /"overlayActivity": false/);
  assert.match(source, /"pollingOrTimerActivity": false/);
});
