import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const impactModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-impact-analysis.mjs")
);
const changeModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-change-management.mjs")
);
const dependencyModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-dependency-management.mjs")
);
const versioningModule = await import(
  path.resolve(import.meta.dirname, "..", "asset-factory", "asset-versioning.mjs")
);

test("direct impact analysis records recipe dependency consequences for changed asset", () => {
  const layer = impactModule.createAssetImpactAnalysisLayer();
  const report = layer.createImpactReport({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.equal(report.changedAsset.assetId, "GROUND_BEACH_SAND_001");
  assert.ok(report.affectedRecipes.includes("BEACH_ENVIRONMENT_RECIPE_001"));
  assert.ok(
    report.analysisEntries.some(
      (entry) =>
        entry.analysisType === "DIRECT_DEPENDENCY_IMPACT" &&
        entry.targetId === "BEACH_ENVIRONMENT_RECIPE_001"
    )
  );
});

test("recipe impact analysis captures inbound recipe ownership and sibling asset exposure", () => {
  const layer = impactModule.createAssetImpactAnalysisLayer();
  const report = layer.createImpactReport({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.ok(
    report.analysisEntries.some(
      (entry) =>
        entry.analysisType === "RECIPE_IMPACT" &&
        entry.relationship === "INCOMING" &&
        entry.sourceId === "BEACH_ENVIRONMENT_RECIPE_001"
    )
  );
});

test("environment impact analysis captures affected environment rules", () => {
  const layer = impactModule.createAssetImpactAnalysisLayer();
  const report = layer.createImpactReport({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.ok(report.affectedEnvironments.includes("ENVIRONMENT::BEACH_GROUND_COVER"));
  assert.ok(
    report.analysisEntries.some(
      (entry) =>
        entry.analysisType === "ENVIRONMENT_IMPACT" &&
        entry.targetId === "ENVIRONMENT::BEACH_GROUND_COVER"
    )
  );
});

test("Atlas impact analysis captures downstream Atlas system usage", () => {
  const layer = impactModule.createAssetImpactAnalysisLayer();
  const report = layer.createImpactReport({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.ok(report.affectedAtlasSystems.includes("ATLAS::BEACH"));
  assert.ok(
    report.analysisEntries.some(
      (entry) =>
        entry.analysisType === "ATLAS_IMPACT" && entry.targetId === "ATLAS::BEACH"
    )
  );
});

test("severity calculation escalates for broad Atlas and environment usage", () => {
  const layer = impactModule.createAssetImpactAnalysisLayer();
  const report = layer.createImpactReport({
    assetId: "GROUND_BEACH_SAND_001",
    changeCategory: "BUG_FIX"
  });

  assert.equal(report.impactSeverity, "CRITICAL");
  assert.equal(report.validation.severityDeterministic, true);
});

test("same input produces deterministic same impact report", () => {
  const layer = impactModule.createAssetImpactAnalysisLayer();
  const first = layer.createImpactReport({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const second = layer.createImpactReport({
    assetId: "GROUND_BEACH_SAND_001"
  });

  assert.deepEqual(first, second);
  assert.equal(
    first.validation.deterministicImpactHash,
    second.validation.deterministicImpactHash
  );
});

test("explicit impact validation passes contract checks", () => {
  const changeLayer = changeModule.createAssetChangeManagementLayer();
  const dependencyLayer = dependencyModule.createAssetDependencyManagementLayer();
  const versioningLayer = versioningModule.createAssetVersioningLayer();
  const layer = impactModule.createAssetImpactAnalysisLayer(
    changeLayer,
    dependencyLayer,
    versioningLayer
  );
  const report = layer.createImpactReport({
    assetId: "GROUND_BEACH_SAND_001"
  });
  const validation = impactModule.validateAssetImpactReport(report);

  assert.equal(validation.ok, true);
  assert.equal(validation.assetImpactReport.validation.sourceRecordsExist, true);
  assert.equal(validation.assetImpactReport.validation.dependencyChainValid, true);
  assert.equal(validation.assetImpactReport.validation.noSourceMutation, true);
});
