import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const productionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
);
const recoveryPath = path.join(
  productionRoot,
  "validation/coastal-ground-cover-v002-source-recovery-verification.json"
);
const reportPath = path.join(
  productionRoot,
  "reports/coastal-ground-cover-v002-canonical-source-recovery-report.md"
);

test("ground cover v002 source recovery verification records the canonical source and preserved quarantine evidence", () => {
  const recovery = JSON.parse(fs.readFileSync(recoveryPath, "utf8"));

  assert.equal(recovery.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(recovery.version, "v002");
  assert.equal(recovery.status, "pass");
  assert.equal(
    recovery.chosenCanonicalSource.relativePath,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GROUND_COVER_001_v002.blend"
  );
  assert.equal(
    recovery.chosenCanonicalSource.sha256,
    "0fed203648976371d5ec8d750061bfed70332cd74628218a59226474212137a6"
  );
  assert.equal(
    recovery.preservedQuarantineEvidence.relativePath,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/reports/quarantine/COASTAL_GROUND_COVER_001_v002.blend1"
  );
  assert.equal(
    recovery.preservedQuarantineEvidence.sha256,
    "aa3148ce79b94a71ce81f83c311a2cb0461330223868bc8447e0bd79870babc6"
  );
  assert.equal(recovery.sourceExportSeparation.canonicalSourceInSourceFolder, true);
  assert.equal(recovery.sourceExportSeparation.noBlendFilesRemainInExport, true);
  assert.equal(recovery.recoveryAction.physicalMoveRequired, false);
});

test("ground cover v002 source recovery leaves source and quarantine intact with export free of blend files", () => {
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "source/COASTAL_GROUND_COVER_001_v002.blend")
    ),
    true
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "reports/quarantine/COASTAL_GROUND_COVER_001_v002.blend1")
    ),
    true
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_GROUND_COVER_001_v002.blend")
    ),
    false
  );
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "export/COASTAL_GROUND_COVER_001_v002.blend1")
    ),
    false
  );
});

test("ground cover v002 source recovery report documents the canonical source hash and quarantine preservation", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Canonical Source Recovery Report/);
  assert.match(report, /0fed203648976371d5ec8d750061bfed70332cd74628218a59226474212137a6/);
  assert.match(report, /aa3148ce79b94a71ce81f83c311a2cb0461330223868bc8447e0bd79870babc6/);
  assert.match(report, /No additional file move or copy was required during this phase\./);
});
