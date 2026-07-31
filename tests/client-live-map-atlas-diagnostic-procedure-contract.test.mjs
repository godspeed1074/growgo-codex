import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const procedurePath = path.join(
  repoRoot,
  "GROWGO_SESSION_211_4_MANUAL_LIVE_PAGE_ATLAS_DIAGNOSTIC_VERIFICATION_PROCEDURE.md"
);
const harnessPath = path.join(
  repoRoot,
  "tests",
  "live-map-atlas-diagnostic-manual-webkit-check.js"
);
const packageJsonPath = path.join(repoRoot, "package.json");

test("manual verification procedure documents the exact developer diagnostic calls", () => {
  const source = fs.readFileSync(procedurePath, "utf8");

  assert.match(source, /window\.GrowGoDeveloperDiagnostics\.getGrowGoMap\(\)/);
  assert.match(
    source,
    /window\.GrowGoDeveloperDiagnostics\.getAtlasDiagnosticForCurrentMapCentre\(\)/
  );
  assert.match(source, /REGION_OUT_OF_SCOPE/);
  assert.match(source, /runtimeExecutionEnabled = false/);
  assert.match(source, /mapAttachmentAllowed = false/);
  assert.match(source, /automaticRendererExecutionAllowed = false/);
  assert.match(source, /lifecycleExecutionEnabled = false/);
});

test("manual browser harness stays explicit-only and uses the existing repository localhost pattern", () => {
  const source = fs.readFileSync(harnessPath, "utf8");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  assert.match(source, /http:\/\/localhost:8000/);
  assert.match(source, /getAtlasDiagnosticForCurrentMapCentre\(\)/);
  assert.match(source, /map\.panTo\(\[-38\.13, 144\.62\]/);
  assert.doesNotMatch(source, /addEventListener/);
  assert.doesNotMatch(source, /setInterval\(/);
  assert.equal(typeof packageJson.scripts["test:custom25d:webkit"], "string");
});
