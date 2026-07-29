import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "asset-factory",
  "asset-factory-v1-lockdown.mjs"
);
const workflowDocPath = path.join(
  repoRoot,
  "asset-factory",
  "asset-factory-v1-workflow.md"
);
const templateRoot = path.join(
  repoRoot,
  "asset-factory-workspace",
  "templates",
  "ASSET_FACTORY_V1_ASSET_TEMPLATE",
  "asset-name"
);

const lockdownModule = await import(modulePath);

test("Asset Factory v1 workflow documentation exists and states the locked lifecycle", () => {
  const workflow = fs.readFileSync(workflowDocPath, "utf8");

  assert.match(workflow, /# Asset Factory v1 Production Workflow/);
  assert.match(workflow, /Specification/);
  assert.match(workflow, /Authoring Setup/);
  assert.match(workflow, /Universal Export/);
  assert.match(workflow, /Visual Review/);
  assert.match(workflow, /Promotion/);
  assert.match(workflow, /Recipe Ready/);
});

test("Asset Factory v1 template exists with the required locked folders", () => {
  const folders = ["specification", "source", "export", "validation", "reports"];

  for (const folderName of folders) {
    const folderPath = path.join(templateRoot, folderName);
    assert.equal(fs.existsSync(folderPath), true, `${folderName} folder should exist`);
    assert.equal(
      fs.existsSync(path.join(folderPath, "README.md")),
      true,
      `${folderName} README should exist`
    );
  }
});

test("Asset Factory v1 lockdown definition validates and defines preflight requirements", () => {
  const definition = lockdownModule.createAssetFactoryV1LockdownDefinition({
    cwd: repoRoot
  });
  const validation = lockdownModule.validateAssetFactoryV1LockdownDefinition(definition);

  assert.equal(validation.ok, true);
  assert.equal(definition.preflightRequirements.length, 8);
  assert.deepEqual(
    definition.preflightRequirements.map((entry) => entry.key),
    [
      "asset_identity_exists",
      "recipe_identity_exists",
      "dependency_identity_exists",
      "identity_anchors_exist",
      "required_lods_exist",
      "naming_conventions_valid",
      "metadata_exists",
      "folder_structure_correct"
    ]
  );
});

test("golden asset regression set is registered and tied to the proven baseline assets", () => {
  const definition = lockdownModule.createAssetFactoryV1LockdownDefinition({
    cwd: repoRoot
  });
  const golden = definition.goldenAssetSet.registeredGoldenAssets;
  const byAssetId = new Map(golden.map((entry) => [entry.assetId, entry]));

  assert.deepEqual(
    golden.map((entry) => `${entry.assetId}_${entry.version}`),
    [
      "TREE_EUCALYPTUS_001_v001",
      "TREE_BOTTLEBRUSH_001_v002",
      "SHRUB_COASTAL_LOW_001_v001"
    ]
  );

  for (const entry of golden) {
    assert.equal(entry.goldenBaselineRegistered, true);
    assert.equal(entry.universalExportManifestExists, true);
  }

  assert.equal(byAssetId.get("TREE_EUCALYPTUS_001").productionRegistrationExists, true);
  assert.equal(byAssetId.get("TREE_BOTTLEBRUSH_001").productionRegistrationExists, true);
  assert.equal(byAssetId.get("TREE_BOTTLEBRUSH_001").promotionRecordExists, true);
  assert.equal(byAssetId.get("SHRUB_COASTAL_LOW_001").productionRegistrationExists, false);
  assert.equal(byAssetId.get("SHRUB_COASTAL_LOW_001").sourceSetupExists, true);
});
