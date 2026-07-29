import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(
  repoRoot,
  "asset-factory",
  "coastal-grass-tussock-visual-review-evidence.mjs"
);

const reviewModule = await import(modulePath);

test("grass tussock visual review evidence module builds a pending human-review package", () => {
  const result = reviewModule.buildCoastalGrassTussockVisualReviewEvidence({
    cwd: repoRoot
  });

  assert.equal(result.evidence.assetId, "COASTAL_GRASS_TUSSOCK_001");
  assert.equal(result.evidence.humanVisualApproval.required, true);
  assert.equal(result.evidence.humanVisualApproval.readyForHumanReview, true);
  assert.equal(result.evidence.humanVisualApproval.approved, false);
  assert.equal(result.evidence.approvalChecklist.approvalBlockedUntilHumanReview, true);
});

test("grass tussock visual review evidence captures the real LOD metrics and preserved hashes", () => {
  const result = reviewModule.buildCoastalGrassTussockVisualReviewEvidence({
    cwd: repoRoot
  });

  assert.deepEqual(result.evidence.lodComparisonSummary.lods.close, {
    filename: "COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE.glb",
    triangleCount: 133,
    meshCount: 10,
    materialCount: 1,
    sizeBytes: 57160
  });
  assert.deepEqual(result.evidence.lodComparisonSummary.lods.gameplay, {
    filename: "COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY.glb",
    triangleCount: 89,
    meshCount: 7,
    materialCount: 1,
    sizeBytes: 41228
  });
  assert.deepEqual(result.evidence.lodComparisonSummary.lods.map, {
    filename: "COASTAL_GRASS_TUSSOCK_001_LOD_MAP.glb",
    triangleCount: 65,
    meshCount: 5,
    materialCount: 1,
    sizeBytes: 30988
  });
  assert.equal(
    result.evidence.previewMetadata.sourceBlend.sha256,
    "d9566ddd944f244ab34e638d3016761c27875992d8e3552bd9d550011ee24b3e"
  );
  assert.equal(
    result.evidence.previewMetadata.reviewPreviewAssets.close.sha256,
    "135561384dd2a11f625be3fa6d0048189b35193ead308a10537c4774f3773d2f"
  );
});

test("grass tussock visual review evidence report clearly separates automated and human review sections", () => {
  const result = reviewModule.buildCoastalGrassTussockVisualReviewEvidence({
    cwd: repoRoot
  });

  assert.match(result.reportMarkdown, /## Automated Validation Results/);
  assert.match(result.reportMarkdown, /## Human Visual Approval Requirements/);
  assert.match(
    result.reportMarkdown,
    /approval remains blocked until a human reviewer completes the visual checklist/i
  );
});

test("written grass tussock review evidence files exist in validation and reports folders", () => {
  const built = reviewModule.buildCoastalGrassTussockVisualReviewEvidence({
    cwd: repoRoot
  });
  const filePaths = [
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/reports/coastal-grass-tussock-visual-review-report.md"
    ),
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-grass-tussock-preview-metadata.json"
    ),
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-grass-tussock-lod-comparison-summary.json"
    ),
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-grass-tussock-performance-summary.json"
    ),
    path.join(
      repoRoot,
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation/coastal-grass-tussock-approval-checklist.json"
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
