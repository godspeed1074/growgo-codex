import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "asset-factory",
  "shrub-coastal-low-visual-review-evidence.mjs"
);

const reviewModule = await import(modulePath);

test("shrub visual review evidence module builds a pending human-review package", () => {
  const result = reviewModule.buildShrubCoastalLowVisualReviewEvidence({ cwd: repoRoot });

  assert.equal(result.evidence.assetId, "SHRUB_COASTAL_LOW_001");
  assert.equal(result.evidence.humanVisualApproval.required, true);
  assert.equal(result.evidence.humanVisualApproval.readyForHumanReview, true);
  assert.equal(result.evidence.humanVisualApproval.approved, false);
  assert.equal(result.evidence.approvalChecklist.approvalBlockedUntilHumanReview, true);
});

test("shrub visual review evidence captures the real LOD metrics and preserved hashes", () => {
  const result = reviewModule.buildShrubCoastalLowVisualReviewEvidence({ cwd: repoRoot });

  assert.deepEqual(result.evidence.lodComparisonSummary.lods.close, {
    filename: "SHRUB_COASTAL_LOW_001_LOD_CLOSE.glb",
    triangleCount: 301,
    meshCount: 16,
    materialCount: 4,
    sizeBytes: 109300
  });
  assert.deepEqual(result.evidence.lodComparisonSummary.lods.gameplay, {
    filename: "SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb",
    triangleCount: 181,
    meshCount: 10,
    materialCount: 4,
    sizeBytes: 72628
  });
  assert.deepEqual(result.evidence.lodComparisonSummary.lods.map, {
    filename: "SHRUB_COASTAL_LOW_001_LOD_MAP.glb",
    triangleCount: 61,
    meshCount: 4,
    materialCount: 3,
    sizeBytes: 33332
  });
  assert.equal(
    result.evidence.previewMetadata.sourceBlend.sha256,
    "a4b2e6c55784cdbd268bafa3a216fc03b63da8b5fd5bfd85f61c46f0bb66ab0a"
  );
  assert.equal(
    result.evidence.previewMetadata.reviewPreviewAssets.close.sha256,
    "def3627ff0c2f76ee471307184136b103ff9b4d72550c25a1521dbf111b582ef"
  );
});

test("shrub visual review evidence report clearly separates automated and human review sections", () => {
  const result = reviewModule.buildShrubCoastalLowVisualReviewEvidence({ cwd: repoRoot });

  assert.match(result.reportMarkdown, /## Automated Validation Results/);
  assert.match(result.reportMarkdown, /## Human Visual Approval Requirements/);
  assert.match(result.reportMarkdown, /approval remains blocked until a human reviewer completes the visual checklist/i);
});

test("written shrub review evidence files exist in validation and reports folders", () => {
  const built = reviewModule.buildShrubCoastalLowVisualReviewEvidence({ cwd: repoRoot });
  const filePaths = [
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/reports/shrub-coastal-low-visual-review-report.md"
    ),
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/shrub-coastal-low-preview-metadata.json"
    ),
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/shrub-coastal-low-lod-comparison-summary.json"
    ),
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/shrub-coastal-low-performance-summary.json"
    ),
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/shrub-coastal-low-approval-checklist.json"
    )
  ];

  for (const filePath of filePaths) {
    assert.equal(fs.existsSync(filePath), true, `${path.basename(filePath)} should exist`);
  }

  const previewMetadata = JSON.parse(fs.readFileSync(filePaths[1], "utf8"));
  const approvalChecklist = JSON.parse(fs.readFileSync(filePaths[4], "utf8"));
  const report = fs.readFileSync(filePaths[0], "utf8");

  assert.deepEqual(previewMetadata, built.evidence.previewMetadata);
  assert.deepEqual(approvalChecklist, built.evidence.approvalChecklist);
  assert.equal(report, built.reportMarkdown);
});
