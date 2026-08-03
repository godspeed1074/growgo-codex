import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_50F_LIVE_DIAGNOSTICS_AVAILABILITY_VERIFICATION.md"
);

test("phase 211.50f evidence anchors the correct branch, checkpoint, pending status, and localhost Safari target", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(
    source,
    /feature\/atlas-phase-211-6-gated-map-attachment-controller/
  );
  assert.match(
    source,
    /GROWGO_SESSION_211_50E_SNAPSHOT_BRIDGE_RECURSION_FIX\.md/
  );
  assert.match(
    source,
    /5ca08be fix\(atlas\): remove actual Safari one-frame recursion/
  );
  assert.match(source, /`SNAPSHOT_BRIDGE_RECURSION_FIXED`/);
  assert.match(source, /`88 passed`|focused Phase 211 diagnostics \/ bridge \/ command \/ attachment regression band:\s+- `PASS`/);
  assert.match(source, /browser: `Safari`/);
  assert.match(source, /page: `http:\/\/127\.0\.0\.1:8000`/);
  assert.match(source, /executionStatus = PENDING_MANUAL_OPERATOR_EVIDENCE/);
  assert.match(source, /do \*\*not\*\* mark `PASS`/i);
});

test("phase 211.50f evidence requires the exact diagnostics namespace and function-surface checks", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /typeof window\.GrowGoDeveloperDiagnostics/);
  assert.match(source, /Object\.keys\(window\.GrowGoDeveloperDiagnostics\)/);
  assert.match(source, /"GrowGoDeveloperDiagnostics" in window/);
  assert.match(
    source,
    /window\.GrowGoDeveloperDiagnostics === globalThis\.GrowGoDeveloperDiagnostics/
  );
  assert.match(source, /getGrowGoMap/);
  assert.match(source, /getAtlasRendererHandoffReadiness/);
  assert.match(source, /authorizeAtlasRendererHandoffSession/);
  assert.match(source, /getAtlasRendererHandoffAuthorizationStatus/);
  assert.match(source, /getAtlasMapAttachmentStatus/);
  assert.match(source, /runAuthorizedAtlasCustom25DOneFrame/);
  assert.match(
    source,
    /\["function", "function", "function", "function", "function", "function"\]/
  );
});

test("phase 211.50f evidence requires live map, detached attachment status, Bellarine readiness, and no execution", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /const map = window\.GrowGoDeveloperDiagnostics\.getGrowGoMap\(\);/);
  assert.match(source, /hasMap = true/);
  assert.match(source, /hasGetCenter = true/);
  assert.match(source, /hasSetView = true/);
  assert.match(source, /hasOn = true/);
  assert.match(source, /hasOff = true/);
  assert.match(source, /getAtlasMapAttachmentStatus\(\)/);
  assert.match(source, /attached = false/);
  assert.match(source, /ownedListenerCount = 0/);
  assert.match(source, /rendererActivity = false/);
  assert.match(source, /overlayActivity = false/);
  assert.match(source, /networkActivity = false/);
  assert.match(source, /pollingOrTimerActivity = false/);
  assert.match(source, /setView\(\s*\[-38\.12,\s*144\.61\],\s*15,\s*\{\s*animate:\s*false\s*\}\s*\)/);
  assert.match(source, /diagnosticStatus = "resolved"/);
  assert.match(source, /reasonCode = "RESOLVED"/);
  assert.match(source, /rendererHandoffStatus = "ready_for_future_renderer_attachment"/);
  assert.match(source, /Do \*\*not\*\* run:[\s\S]*runAuthorizedAtlasCustom25DOneFrame/);
  assert.match(source, /Do \*\*not\*\* authorize a handoff session in this phase\./);
});

test("phase 211.50f evidence preserves canonical false safety flags and final manual-only classifications", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /runtimeExecutionEnabled = false/);
  assert.match(source, /mapAttachmentAllowed = false/);
  assert.match(source, /automaticRendererExecutionAllowed = false/);
  assert.match(source, /lifecycleExecutionEnabled = false/);
  assert.match(
    source,
    /LIVE_DIAGNOSTICS_AVAILABLE_FOR_FINAL_SAFARI_RETEST/
  );
  assert.match(source, /BLOCKED_BY_DIAGNOSTICS_NAMESPACE/);
  assert.match(source, /BLOCKED_BY_MAP_PROVIDER/);
  assert.match(source, /BLOCKED_BY_BROWSER_BOOTSTRAP/);
  assert.match(source, /final classification is pending genuine manual Safari evidence/i);
  assert.doesNotMatch(source, /overall Phase 211\.50f:\s+- `PASS`/i);
});
