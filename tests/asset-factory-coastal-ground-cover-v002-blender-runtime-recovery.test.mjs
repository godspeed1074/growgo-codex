import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const diagnosisPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-ground-cover-v002-blender-runtime-diagnosis.json"
);
const reportPath = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/reports/coastal-ground-cover-v002-blender-runtime-diagnosis-report.md"
);

test("ground cover v002 runtime diagnosis records an environment-level Blender startup blocker", () => {
  const diagnosis = JSON.parse(fs.readFileSync(diagnosisPath, "utf8"));

  assert.equal(diagnosis.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(diagnosis.version, "v002");
  assert.equal(
    diagnosis.runtimeTarget.executablePath,
    "/Applications/Blender-4.2-LTS.app/Contents/MacOS/Blender"
  );
  assert.equal(diagnosis.runtimeTarget.version, "4.2.23 LTS");
  assert.equal(diagnosis.runtimeTarget.headlessStartupHealthy, false);
  assert.equal(diagnosis.causeAnalysis.assetRelated, false);
  assert.equal(diagnosis.causeAnalysis.exporterRelated, false);
  assert.equal(diagnosis.causeAnalysis.environmentRelated, true);
  assert.equal(
    diagnosis.crashEvidence.crashStage,
    "startup_gpu_backend_initialization"
  );
  assert.equal(diagnosis.recoveryRecommendation.exportCanResumeNow, false);
});

test("ground cover v002 runtime diagnosis report documents the Metal startup crash and recovery gate", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /- Blender version:\s+`4\.2\.23 LTS`/);
  assert.match(report, /MTLBackend::metal_is_supported/);
  assert.match(report, /environment-related, not asset-related/i);
  assert.match(report, /should not resume until Blender can start headlessly without crashing/i);
});
