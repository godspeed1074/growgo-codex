import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const productionRoot = path.join(
  repoRoot,
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
);
const verificationPath = path.join(
  productionRoot,
  "validation/coastal-ground-cover-v002-source-location-verification.json"
);
const reportPath = path.join(
  productionRoot,
  "reports/coastal-ground-cover-v002-source-lane-cleanup-report.md"
);

test("ground cover v002 source location verification records the chosen canonical source", () => {
  const verification = JSON.parse(fs.readFileSync(verificationPath, "utf8"));

  assert.equal(verification.assetId, "COASTAL_GROUND_COVER_001");
  assert.equal(verification.version, "v002");
  assert.equal(verification.status, "pass");
  assert.equal(
    verification.chosenSourceCandidate.relativePath,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source/COASTAL_GROUND_COVER_001_v002.blend"
  );
  assert.equal(
    verification.chosenSourceCandidate.sha256,
    "0fed203648976371d5ec8d750061bfed70332cd74628218a59226474212137a6"
  );
  assert.equal(verification.checks.every((check) => check.ok === true), true);
});

test("ground cover v002 cleanup leaves export free of blend candidates and quarantines backup", () => {
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "source/COASTAL_GROUND_COVER_001_v002.blend")
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
  assert.equal(
    fs.existsSync(
      path.join(productionRoot, "reports/quarantine/COASTAL_GROUND_COVER_001_v002.blend1")
    ),
    true
  );
});

test("ground cover v002 cleanup report documents the chosen source and quarantine outcome", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Source Lane Cleanup Report/);
  assert.match(report, /0fed203648976371d5ec8d750061bfed70332cd74628218a59226474212137a6/);
  assert.match(report, /aa3148ce79b94a71ce81f83c311a2cb0461330223868bc8447e0bd79870babc6/);
  assert.match(report, /No `COASTAL_GROUND_COVER_001_v002\*\.blend\*` source candidates remain in `export\/`/);
});
