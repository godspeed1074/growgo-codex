import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_14_MANUAL_SAFARI_ZERO_DRAW_RENDERER_HANDOFF_READINESS_VERIFICATION.md"
);

test("phase 211.14 evidence template is present and honestly marked pending", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(
    source,
    /feat\(atlas\): expose explicit zero-draw renderer handoff readiness diagnostic/
  );
  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"developmentPageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(source, /"executionStatus": "PENDING_MANUAL_OPERATOR_EVIDENCE"/);
  assert.match(source, /overall Phase 211\.14:\s+- `PENDING_MANUAL_OPERATOR_EVIDENCE`/);
  assert.match(source, /application implementation changes made in Phase 211\.14:\s+- `none`/);
});

test("phase 211.14 evidence template preserves canonical false safety and detached precondition", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
  assert.match(source, /"attached": false/);
  assert.match(source, /"ownedListenerCount": 0/);
  assert.match(source, /"diagnosticInvocationCount": 0/);
  assert.match(source, /"listenerEventName": "moveend"/);
  assert.match(source, /"rendererActivity": false/);
  assert.match(source, /"overlayActivity": false/);
  assert.match(source, /"networkActivity": false/);
  assert.match(source, /"pollingOrTimerActivity": false/);
  assert.match(source, /"attachAllowed": false/);
});

test("phase 211.14 evidence template requires approved and unsupported readiness capture", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /window\.GrowGoDeveloperDiagnostics\.getAtlasRendererHandoffReadiness\(\)/
  );
  assert.match(
    source,
    /REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION/
  );
  assert.match(
    source,
    /ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001/
  );
  assert.match(source, /COASTAL_LOCATION_RECIPE_001/);
  assert.match(source, /rendererHandoffStatus = "ready_for_future_renderer_attachment"/);
  assert.match(source, /reasonCode = "REGION_OUT_OF_SCOPE"/);
  assert.match(source, /rendererHandoffStatus = "blocked"/);
  assert.match(source, /"approvedReadinessResult": "PENDING_MANUAL_OPERATOR_EVIDENCE"/);
  assert.match(source, /"unsupportedReadinessResult": "PENDING_MANUAL_OPERATOR_EVIDENCE"/);
  assert.match(source, /"operatorConfirmation": "PENDING_MANUAL_OPERATOR_EVIDENCE"/);
});
