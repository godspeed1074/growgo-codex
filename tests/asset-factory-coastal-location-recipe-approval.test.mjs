import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const recipeRoot = path.join(
  repoRoot,
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
);

const approvalPath = path.join(
  recipeRoot,
  "approval/coastal-location-recipe-001-approval.json"
);
const catalogPath = path.join(
  recipeRoot,
  "catalog/coastal-location-recipe-001-approved-catalog-entry.json"
);
const versionPath = path.join(
  recipeRoot,
  "version/coastal-location-recipe-001-v001-version-record.json"
);
const reportPath = path.join(
  recipeRoot,
  "reports/coastal-location-recipe-001-approval-report.md"
);

const approvalModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "coastal-location-recipe-approval.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("coastal location recipe approval builders derive consistent records", () => {
  const built = approvalModule.buildCoastalLocationRecipeApprovalPackage({
    cwd: repoRoot
  });

  assert.equal(built.approvalRecord.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(built.catalogEntry.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(built.versionRecord.recipeId, "COASTAL_LOCATION_RECIPE_001");
});

test("coastal location recipe approval record marks the refined recipe approved", () => {
  const approval = readJson(approvalPath);

  assert.equal(approval.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(approval.approvalStatus, "approved");
  assert.equal(approval.lifecycleStatus, "APPROVED_CURRENT");
  assert.equal(
    approval.approvedFromRegeneratedFingerprint,
    "c475a001c080048255059dcf60ed1f370763ef584275effdeaa53f593877c5ed"
  );
  assert.equal(approval.verification.status, "pass");
  assert.equal(approval.verification.checks.every((check) => check.ok === true), true);
});

test("coastal location recipe approved catalog entry stays development-only and blocks runtime", () => {
  const catalog = readJson(catalogPath);

  assert.equal(catalog.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(catalog.lifecycleStatus, "APPROVED_CURRENT");
  assert.equal(catalog.environment, "DEVELOPMENT_ONLY");
  assert.equal(catalog.visibility.development, true);
  assert.equal(catalog.visibility.beta, false);
  assert.equal(catalog.visibility.production, false);
  assert.equal(catalog.runtimeSafetyFlags.runtimeExecutionAuthorized, false);
});

test("coastal location recipe version record tracks v001 as current approved recipe", () => {
  const versionRecord = readJson(versionPath);

  assert.equal(versionRecord.recipeId, "COASTAL_LOCATION_RECIPE_001");
  assert.equal(versionRecord.currentApprovedVersion, "v001");
  assert.equal(versionRecord.v001.status, "APPROVED_CURRENT");
  assert.equal(versionRecord.v001.current, true);
  assert.equal(versionRecord.published, false);
  assert.equal(versionRecord.runtimeActivated, false);
});

test("coastal location recipe approval report documents final approved state and safety", () => {
  const report = fs.readFileSync(reportPath, "utf8");

  assert.match(report, /Refined coastal location recipe approved/);
  assert.match(report, /lifecycle: APPROVED_CURRENT/);
  assert.match(report, /development visibility: true/);
  assert.match(
    report,
    /No Blender, GLBs, asset modification, or runtime activation were performed/i
  );
});
