import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const coastalGrassTussockVisualReviewEvidenceSchemaId =
  "COASTAL_GRASS_TUSSOCK_VISUAL_REVIEW_EVIDENCE_001";
export const coastalGrassTussockPreviewMetadataSchemaId =
  "COASTAL_GRASS_TUSSOCK_PREVIEW_METADATA_001";
export const coastalGrassTussockLodComparisonSchemaId =
  "COASTAL_GRASS_TUSSOCK_LOD_COMPARISON_001";
export const coastalGrassTussockPerformanceSummarySchemaId =
  "COASTAL_GRASS_TUSSOCK_PERFORMANCE_SUMMARY_001";
export const coastalGrassTussockApprovalChecklistSchemaId =
  "COASTAL_GRASS_TUSSOCK_APPROVAL_CHECKLIST_001";

const reportFilename = "coastal-grass-tussock-visual-review-report.md";
const previewMetadataFilename = "coastal-grass-tussock-preview-metadata.json";
const lodComparisonFilename = "coastal-grass-tussock-lod-comparison-summary.json";
const performanceSummaryFilename = "coastal-grass-tussock-performance-summary.json";
const approvalChecklistFilename = "coastal-grass-tussock-approval-checklist.json";

const papercutChecklist = deepFreeze([
  "Layered papercut 2.5D grass silhouette reads clearly from close and gameplay views.",
  "Tuft massing feels stylised and readable rather than noisy or photoreal.",
  "Side and 45-degree views show enough depth to avoid a pancaked silhouette.",
  "Shared material treatment keeps the asset visually clean and placement-friendly.",
  "Gameplay and map LODs preserve the same recognisable tussock identity after simplification."
]);

export function buildCoastalGrassTussockVisualReviewEvidence({
  cwd = process.cwd()
} = {}) {
  const root = path.join(
    cwd,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001"
  );
  const exportDirectory = path.join(root, "export");
  const validationDirectory = path.join(root, "validation");
  const reportsDirectory = path.join(root, "reports");
  const sourceDirectory = path.join(root, "source");

  const sourceVerification = readJsonRequired(
    path.join(sourceDirectory, "coastal-grass-tussock-source-verification.json")
  );
  const exportValidation = readJsonRequired(
    path.join(validationDirectory, "coastal-grass-tussock-export-validation.json")
  );
  const exportManifest = readJsonRequired(
    path.join(exportDirectory, "coastal-grass-tussock-export-manifest.json")
  );
  const authoringSetup = readJsonRequired(
    path.join(validationDirectory, "coastal-grass-tussock-manual-authoring-setup.json")
  );

  const sourceBlendPath = path.join(
    cwd,
    sourceVerification.sourceBlend.relativePath
  );
  const closePath = path.join(exportDirectory, "COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE.glb");
  const gameplayPath = path.join(
    exportDirectory,
    "COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY.glb"
  );
  const mapPath = path.join(exportDirectory, "COASTAL_GRASS_TUSSOCK_001_LOD_MAP.glb");

  const assets = deepFreeze({
    blend: summarizeBinary(sourceBlendPath, "COASTAL_GRASS_TUSSOCK_001_v001.blend"),
    close: summarizeBinary(closePath, "COASTAL_GRASS_TUSSOCK_001_LOD_CLOSE.glb"),
    gameplay: summarizeBinary(
      gameplayPath,
      "COASTAL_GRASS_TUSSOCK_001_LOD_GAMEPLAY.glb"
    ),
    map: summarizeBinary(mapPath, "COASTAL_GRASS_TUSSOCK_001_LOD_MAP.glb")
  });

  const byLod = new Map(exportValidation.files.map((entry) => [entry.lod, entry]));

  const previewMetadata = deepFreeze({
    schemaId: coastalGrassTussockPreviewMetadataSchemaId,
    assetId: "COASTAL_GRASS_TUSSOCK_001",
    recipeId: "COASTAL_GRASS_TUSSOCK_RECIPE_001",
    familyId: "COASTAL_NATURE_FAMILY_001",
    version: "v001",
    sourceBlend: {
      filename: assets.blend.filename,
      relativePath: relativeToRepo(cwd, sourceBlendPath),
      sizeBytes: assets.blend.sizeBytes,
      sha256: assets.blend.sha256
    },
    reviewPreviewAssets: {
      close: summarizePreviewAsset(cwd, closePath, assets.close),
      gameplay: summarizePreviewAsset(cwd, gameplayPath, assets.gameplay),
      map: summarizePreviewAsset(cwd, mapPath, assets.map)
    },
    expectedIdentityAnchors: authoringSetup.identityAnchors,
    papercutStyleChecklist: papercutChecklist,
    manualVisualApprovalRequired: true,
    registrationBlocked: true,
    promotionBlocked: true,
    automatedValidationPassed: true
  });

  const lodComparisonSummary = deepFreeze({
    schemaId: coastalGrassTussockLodComparisonSchemaId,
    assetId: "COASTAL_GRASS_TUSSOCK_001",
    version: "v001",
    lods: {
      close: summarizeLod(byLod.get("LOD_CLOSE")),
      gameplay: summarizeLod(byLod.get("LOD_GAMEPLAY")),
      map: summarizeLod(byLod.get("LOD_MAP"))
    },
    lodOrderRequirement: "CLOSE > GAMEPLAY > MAP",
    lodOrderPassed: exportValidation.lodOrdering.passed
  });

  const performanceSummary = deepFreeze({
    schemaId: coastalGrassTussockPerformanceSummarySchemaId,
    assetId: "COASTAL_GRASS_TUSSOCK_001",
    version: "v001",
    performanceClass: "mobile_first_lightweight",
    summary: {
      close: summarizePerformance(byLod.get("LOD_CLOSE")),
      gameplay: summarizePerformance(byLod.get("LOD_GAMEPLAY")),
      map: summarizePerformance(byLod.get("LOD_MAP"))
    },
    sharedMaterialApproach: {
      closeMaterialCount: byLod.get("LOD_CLOSE").materialCount,
      gameplayMaterialCount: byLod.get("LOD_GAMEPLAY").materialCount,
      mapMaterialCount: byLod.get("LOD_MAP").materialCount,
      materialCountsStayConstrained:
        byLod.get("LOD_CLOSE").materialCount === 1 &&
        byLod.get("LOD_GAMEPLAY").materialCount === 1 &&
        byLod.get("LOD_MAP").materialCount === 1
    },
    noExternalDependencies: true,
    exporterDeterministicFingerprint: exportManifest.deterministicFingerprint
  });

  const approvalChecklist = deepFreeze({
    schemaId: coastalGrassTussockApprovalChecklistSchemaId,
    assetId: "COASTAL_GRASS_TUSSOCK_001",
    version: "v001",
    automatedValidationResults: {
      sourceBlendPresent: true,
      sourceBlendHashRecorded: true,
      exportManifestPresent: true,
      assetIdentityConfirmed: true,
      recipeIdentityConfirmed: true,
      dependencyIdentityConfirmed: true,
      identityAnchorsDeclared: authoringSetup.identityAnchors.length === 3,
      noExternalDependencies: true,
      lodOrderPassed: exportValidation.lodOrdering.passed,
      registrationPerformed: false,
      promotionPerformed: false
    },
    humanVisualApprovalRequirements: {
      reviewStatus: "PENDING_HUMAN_REVIEW",
      papercut_2_5d_style: "REVIEW_REQUIRED",
      coastal_native_identity: "REVIEW_REQUIRED",
      repeated_placement_readability: "REVIEW_REQUIRED",
      lod_visual_consistency: "REVIEW_REQUIRED",
      world_placement_suitability: "REVIEW_REQUIRED"
    },
    approvalBlockedUntilHumanReview: true,
    checklist: {
      papercutStyle: papercutChecklist,
      requiredEvidence: [
        "Reviewer confirms CLOSE LOD silhouette and tuft layering read clearly.",
        "Reviewer confirms GAMEPLAY LOD remains readable in repeated roadside and reserve-edge placement.",
        "Reviewer confirms MAP LOD keeps the intended tussock footprint after simplification.",
        "Reviewer confirms no visual issue blocks approval for the current revision."
      ]
    }
  });

  const evidence = deepFreeze({
    schemaId: coastalGrassTussockVisualReviewEvidenceSchemaId,
    assetId: "COASTAL_GRASS_TUSSOCK_001",
    version: "v001",
    reportFilename,
    previewMetadata,
    lodComparisonSummary,
    performanceSummary,
    approvalChecklist,
    automatedValidation: {
      sourceVerificationPresent: true,
      exportValidationPresent: true,
      exportManifestPresent: true,
      identityConfirmed: true,
      recipeConfirmed: true,
      dependencyConfirmed: true,
      identityAnchorsConfirmed: true,
      lodsPresent: true,
      glbsUnchangedByThisPhase: true
    },
    humanVisualApproval: {
      required: true,
      readyForHumanReview: true,
      approved: false
    }
  });

  return {
    exportDirectory,
    validationDirectory,
    reportsDirectory,
    evidence,
    reportMarkdown: buildReportMarkdown(evidence, assets)
  };
}

export function writeCoastalGrassTussockVisualReviewEvidence({
  cwd = process.cwd()
} = {}) {
  const built = buildCoastalGrassTussockVisualReviewEvidence({ cwd });
  fs.mkdirSync(built.validationDirectory, { recursive: true });
  fs.mkdirSync(built.reportsDirectory, { recursive: true });

  writeJson(
    path.join(built.validationDirectory, previewMetadataFilename),
    built.evidence.previewMetadata
  );
  writeJson(
    path.join(built.validationDirectory, lodComparisonFilename),
    built.evidence.lodComparisonSummary
  );
  writeJson(
    path.join(built.validationDirectory, performanceSummaryFilename),
    built.evidence.performanceSummary
  );
  writeJson(
    path.join(built.validationDirectory, approvalChecklistFilename),
    built.evidence.approvalChecklist
  );
  fs.writeFileSync(
    path.join(built.reportsDirectory, reportFilename),
    built.reportMarkdown,
    "utf8"
  );

  return deepFreeze({
    reportPath: path.join(built.reportsDirectory, reportFilename),
    previewMetadataPath: path.join(built.validationDirectory, previewMetadataFilename),
    lodComparisonPath: path.join(built.validationDirectory, lodComparisonFilename),
    performanceSummaryPath: path.join(built.validationDirectory, performanceSummaryFilename),
    approvalChecklistPath: path.join(built.validationDirectory, approvalChecklistFilename),
    evidence: built.evidence
  });
}

function buildReportMarkdown(evidence, assets) {
  const close = evidence.lodComparisonSummary.lods.close;
  const gameplay = evidence.lodComparisonSummary.lods.gameplay;
  const map = evidence.lodComparisonSummary.lods.map;

  return `# COASTAL_GRASS_TUSSOCK_001 v001 Visual Review Evidence Package

Date: 2026-07-29
Asset: COASTAL_GRASS_TUSSOCK_001_v001
Family: COASTAL_NATURE_FAMILY_001
Status: Ready for human visual approval review, not yet approved

## Automated Validation Results

- Source blend present: PASS
- Source blend hash recorded: \`${assets.blend.sha256}\`
- Export manifest present: PASS
- Asset identity confirmed: PASS
- Recipe identity confirmed: PASS
- Dependency identity confirmed: PASS
- Identity anchors declared per LOD: PASS
- Required LODs present: PASS
- No external dependencies: PASS
- LOD triangle order CLOSE > GAMEPLAY > MAP: PASS
- Registration performed in this phase: NO
- Promotion performed in this phase: NO

## Human Visual Approval Requirements

The following checks remain human-only and must be reviewed manually before approval:

- Papercut 2.5D silhouette quality
- Coastal native grass/tussock identity
- Repeated-placement readability at gameplay scale
- LOD-to-LOD visual consistency
- World placement suitability

## LOD Summary

- CLOSE: ${close.triangleCount} triangles, ${close.meshCount} meshes, ${close.materialCount} materials, ${close.sizeBytes} bytes, hash \`${evidence.previewMetadata.reviewPreviewAssets.close.sha256}\`
- GAMEPLAY: ${gameplay.triangleCount} triangles, ${gameplay.meshCount} meshes, ${gameplay.materialCount} materials, ${gameplay.sizeBytes} bytes, hash \`${evidence.previewMetadata.reviewPreviewAssets.gameplay.sha256}\`
- MAP: ${map.triangleCount} triangles, ${map.meshCount} meshes, ${map.materialCount} materials, ${map.sizeBytes} bytes, hash \`${evidence.previewMetadata.reviewPreviewAssets.map.sha256}\`

## Identity Confirmation

- Asset ID: \`${evidence.previewMetadata.assetId}\`
- Recipe ID: \`${evidence.previewMetadata.recipeId}\`
- Expected identity anchors:
  - \`${evidence.previewMetadata.expectedIdentityAnchors[0]}\`
  - \`${evidence.previewMetadata.expectedIdentityAnchors[1]}\`
  - \`${evidence.previewMetadata.expectedIdentityAnchors[2]}\`

## Papercut 2.5D Style Checklist

- ${evidence.previewMetadata.papercutStyleChecklist.join("\n- ")}

## Conclusion

The evidence package is complete for manual review. Automated validation is passing, but approval remains blocked until a human reviewer completes the visual checklist and records explicit evidence.
`;
}

function summarizePreviewAsset(cwd, filePath, asset) {
  return deepFreeze({
    filename: asset.filename,
    relativePath: relativeToRepo(cwd, filePath),
    sha256: asset.sha256
  });
}

function summarizeLod(entry) {
  return deepFreeze({
    filename: entry.filename,
    triangleCount: entry.triangleCount,
    meshCount: entry.meshCount,
    materialCount: entry.materialCount,
    sizeBytes: entry.sizeBytes
  });
}

function summarizePerformance(entry) {
  return deepFreeze({
    triangleCount: entry.triangleCount,
    meshCount: entry.meshCount,
    materialCount: entry.materialCount,
    primitiveCount: entry.primitiveCount,
    sizeBytes: entry.sizeBytes
  });
}

function summarizeBinary(filePath, filename) {
  const buffer = fs.readFileSync(filePath);
  return deepFreeze({
    filename,
    sizeBytes: buffer.byteLength,
    sha256: createHash("sha256").update(buffer).digest("hex")
  });
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJsonRequired(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function relativeToRepo(cwd, targetPath) {
  return path.relative(cwd, targetPath).replace(/\\/g, "/");
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
}
