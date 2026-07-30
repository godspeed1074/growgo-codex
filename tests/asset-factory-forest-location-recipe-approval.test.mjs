import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001"
);

const approvalPath = path.join(
  recipeRoot,
  "approval/forest-location-recipe-001-approval.json"
);
const catalogPath = path.join(
  recipeRoot,
  "catalog/forest-location-recipe-001-approved-catalog-entry.json"
);
const versionPath = path.join(
  recipeRoot,
  "version/forest-location-recipe-001-v001-version-record.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/forest-location-recipe-001-approval-report.md"
);

const approvalModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "forest-location-recipe-approval.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("forest location recipe approval builders derive consistent records", () => {
  const built = approvalModule.buildForestLocationRecipeApprovalPackage({
    cwd: repoRoot
  });

  assert.equal(built.approvalRecord.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(built.catalogEntry.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(built.versionRecord.recipeId, "FOREST_LOCATION_RECIPE_001");
});

test("forest location recipe approval record marks the refined recipe approved", () => {
  const approval = readJson(approvalPath);

  assert.equal(approval.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(approval.approvalStatus, "approved");
  assert.equal(approval.lifecycleStatus, "APPROVED_CURRENT");
  assert.equal(
    approval.approvedFromRegeneratedFingerprint,
    "3be53b84ead3a3368055d1c0c2def863217b43a03fadbdc6ec2f966a51a837f1"
  );
  assert.equal(approval.verification.status, "pass");
  assert.equal(approval.verification.checks.every((check) => check.ok === true), true);
});

test("forest location recipe approved catalog entry stays development-only and blocks runtime", () => {
  const catalog = readJson(catalogPath);

  assert.equal(catalog.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(catalog.lifecycleStatus, "APPROVED_CURRENT");
  assert.equal(catalog.environment, "DEVELOPMENT_ONLY");
  assert.equal(catalog.visibility.development, true);
  assert.equal(catalog.visibility.beta, false);
  assert.equal(catalog.visibility.production, false);
  assert.equal(catalog.runtimeSafetyFlags.runtimeExecutionAuthorized, false);
});

test("forest location recipe version record tracks v001 as current approved recipe", () => {
  const versionRecord = readJson(versionPath);

  assert.equal(versionRecord.recipeId, "FOREST_LOCATION_RECIPE_001");
  assert.equal(versionRecord.currentApprovedVersion, "v001");
  assert.equal(versionRecord.v001.status, "APPROVED_CURRENT");
  assert.equal(versionRecord.v001.current, true);
  assert.equal(versionRecord.published, false);
  assert.equal(versionRecord.runtimeActivated, false);
});

test("forest location recipe approval report documents final approved state and safety", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Refined forest location recipe approved/);
  assert.match(report, /lifecycle: APPROVED_CURRENT/);
  assert.match(report, /development visibility: true/);
  assert.match(
    report,
    /No Blender, GLBs, asset modification, or runtime activation were performed/i
  );
});
