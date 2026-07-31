import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const evidencePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_5_MANUAL_DEVELOPER_EXECUTION_EVIDENCE_CAPTURE.md"
);

test("phase 211.5 evidence capture document preserves verified manual-evidence truth", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /overall phase: `PASS`/);
  assert.match(source, /approved live diagnostic: `VERIFIED`/);
  assert.match(source, /unsupported live diagnostic: `VERIFIED`/);
  assert.match(source, /no-automatic-invocation observation: `VERIFIED`/);
  assert.match(source, /application code changes in Phase 211\.5: `NO`/);
  assert.match(source, /Do not fabricate browser results/i);
  assert.match(source, /"executionStatus": "PASS"/);
  assert.match(source, /"browserUsed": "Safari"/);
  assert.match(source, /"developmentPageAddress": "http:\/\/127\.0\.0\.1:8000"/);
  assert.match(source, /"operatorConfirmation": "YES"/);
});

test("phase 211.5 evidence capture document includes the exact operator paste-back contract", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /window\.GrowGoDeveloperDiagnostics\.getGrowGoMap\(\)/);
  assert.match(
    source,
    /window\.GrowGoDeveloperDiagnostics\s*\n?\s*\.getAtlasDiagnosticForCurrentMapCentre\(\)/
  );
  assert.match(source, /-38\.12/);
  assert.match(source, /144\.61/);
  assert.match(
    source,
    /REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION/
  );
  assert.match(
    source,
    /ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001/
  );
  assert.match(source, /COASTAL_LOCATION_RECIPE_001/);
  assert.match(source, /REGION_OUT_OF_SCOPE/);
  assert.match(source, /ATLAS_LIVE_MAP_CENTRE_DIAGNOSTIC_RESULT_001/);
  assert.match(source, /"confidenceScore": 100/);
  assert.match(source, /"fallbackApplied": false/);
});

test("phase 211.5 evidence capture document preserves atlas safety flags as false", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /"runtimeExecutionEnabled": false/);
  assert.match(source, /"mapAttachmentAllowed": false/);
  assert.match(source, /"automaticRendererExecutionAllowed": false/);
  assert.match(source, /"lifecycleExecutionEnabled": false/);
});

test("phase 211.5 evidence capture document classifies supporting-service and network errors as non-blocking observations", () => {
  const source = fs.readFileSync(evidencePath, "utf8");

  assert.match(source, /Non-Blocking External \/ Local Environment Observations/);
  assert.match(source, /127\.0\.0\.1:9099/);
  assert.match(source, /127\.0\.0\.1:5003/);
  assert.match(source, /429 Too Many Requests/);
  assert.match(source, /zoom `20` returned `400`/);
  assert.match(source, /favicon\.ico/);
  assert.match(source, /did not prevent:/);
  assert.match(source, /No Atlas or map application code changes are required/);
});
