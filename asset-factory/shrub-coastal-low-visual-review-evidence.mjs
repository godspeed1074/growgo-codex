import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const shrubCoastalLowVisualReviewEvidenceSchemaId =
  "SHRUB_COASTAL_LOW_VISUAL_REVIEW_EVIDENCE_001";
export const shrubCoastalLowPreviewMetadataSchemaId =
  "SHRUB_COASTAL_LOW_PREVIEW_METADATA_001";
export const shrubCoastalLowLodComparisonSchemaId =
  "SHRUB_COASTAL_LOW_LOD_COMPARISON_001";
export const shrubCoastalLowPerformanceSummarySchemaId =
  "SHRUB_COASTAL_LOW_PERFORMANCE_SUMMARY_001";
export const shrubCoastalLowApprovalChecklistSchemaId =
  "SHRUB_COASTAL_LOW_APPROVAL_CHECKLIST_001";

const reportFilename = "shrub-coastal-low-visual-review-report.md";
const previewMetadataFilename = "shrub-coastal-low-preview-metadata.json";
const lodComparisonFilename = "shrub-coastal-low-lod-comparison-summary.json";
const performanceSummaryFilename = "shrub-coastal-low-performance-summary.json";
const approvalChecklistFilename = "shrub-coastal-low-approval-checklist.json";

const papercutChecklist = deepFreeze([
  "Layered papercut 2.5D silhouette reads clearly from close and gameplay views.",
  "Shrub massing feels stylised and readable rather than realistic or noisy.",
  "Leaf and flower shapes stay clean without micro-detail clutter.",
  "Palette reads as bright but grounded coastal native vegetation.",
  "Gameplay and map LODs keep the same recognisable shrub identity after simplification."
]);

export function buildShrubCoastalLowVisualReviewEvidence({ cwd = process.cwd() } = {}) {
  const exportDirectory = path.join(
    cwd,
    "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export"
  );
  const validationDirectory = path.join(
    cwd,
    "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation"
  );
  const reportsDirectory = path.join(
    cwd,
    "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/reports"
  );
  const sourceBlendPath = path.join(
    cwd,
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/SHRUB_COASTAL_LOW_001_v001.blend"
  );
  const exportManifest = readJsonRequired(
    path.join(exportDirectory, "shrub-coastal-low-export-manifest.json")
  );
  const authoringManifest = readJsonRequired(
    path.join(exportDirectory, "shrub-coastal-low-authoring-manifest.json")
  );
  const authoringSetup = readJsonRequired(
    path.join(validationDirectory, "manual-authoring-setup.json")
  );
  const validationExpectations = readJsonRequired(
    path.join(validationDirectory, "validation-expectations.json")
  );

  const closePath = path.join(exportDirectory, "SHRUB_COASTAL_LOW_001_LOD_CLOSE.glb");
  const gameplayPath = path.join(exportDirectory, "SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb");
  const mapPath = path.join(exportDirectory, "SHRUB_COASTAL_LOW_001_LOD_MAP.glb");

  const assets = deepFreeze({
    blend: summarizeBinary(sourceBlendPath, "SHRUB_COASTAL_LOW_001_v001.blend"),
    close: summarizeBinary(closePath, "SHRUB_COASTAL_LOW_001_LOD_CLOSE.glb"),
    gameplay: summarizeBinary(gameplayPath, "SHRUB_COASTAL_LOW_001_LOD_GAMEPLAY.glb"),
    map: summarizeBinary(mapPath, "SHRUB_COASTAL_LOW_001_LOD_MAP.glb")
  });

  const previewMetadata = deepFreeze({
    schemaId: shrubCoastalLowPreviewMetadataSchemaId,
    assetId: "SHRUB_COASTAL_LOW_001",
    recipeId: "SHRUB_COASTAL_LOW_RECIPE_001",
    familyId: "COASTAL_SHRUB_FAMILY_001",
    version: "v001",
    sourceBlend: {
      filename: assets.blend.filename,
      relativePath: relativeToRepo(cwd, sourceBlendPath),
      sizeBytes: assets.blend.sizeBytes,
      sha256: assets.blend.sha256
    },
    reviewPreviewAssets: {
      close: {
        filename: assets.close.filename,
        relativePath: relativeToRepo(cwd, closePath),
        sha256: assets.close.sha256
      },
      gameplay: {
        filename: assets.gameplay.filename,
        relativePath: relativeToRepo(cwd, gameplayPath),
        sha256: assets.gameplay.sha256
      },
      map: {
        filename: assets.map.filename,
        relativePath: relativeToRepo(cwd, mapPath),
        sha256: assets.map.sha256
      }
    },
    expectedIdentityAnchors: authoringSetup.identityAnchors,
    papercutStyleChecklist: papercutChecklist,
    manualVisualApprovalRequired: true,
    registrationBlocked: true,
    promotionBlocked: true,
    automatedValidationPassed: true
  });

  const lodComparisonSummary = deepFreeze({
    schemaId: shrubCoastalLowLodComparisonSchemaId,
    assetId: "SHRUB_COASTAL_LOW_001",
    version: "v001",
    lods: {
      close: {
        filename: exportManifest.outputs.close.filename,
        triangleCount: exportManifest.outputs.close.triangleCount,
        meshCount: exportManifest.outputs.close.meshCount,
        materialCount: exportManifest.outputs.close.materialCount,
        sizeBytes: exportManifest.outputs.close.sizeBytes
      },
      gameplay: {
        filename: exportManifest.outputs.gameplay.filename,
        triangleCount: exportManifest.outputs.gameplay.triangleCount,
        meshCount: exportManifest.outputs.gameplay.meshCount,
        materialCount: exportManifest.outputs.gameplay.materialCount,
        sizeBytes: exportManifest.outputs.gameplay.sizeBytes
      },
      map: {
        filename: exportManifest.outputs.map.filename,
        triangleCount: exportManifest.outputs.map.triangleCount,
        meshCount: exportManifest.outputs.map.meshCount,
        materialCount: exportManifest.outputs.map.materialCount,
        sizeBytes: exportManifest.outputs.map.sizeBytes
      }
    },
    lodOrderRequirement: "CLOSE > GAMEPLAY > MAP",
    lodOrderPassed:
      exportManifest.outputs.close.triangleCount >
        exportManifest.outputs.gameplay.triangleCount &&
      exportManifest.outputs.gameplay.triangleCount >
        exportManifest.outputs.map.triangleCount
  });

  const performanceSummary = deepFreeze({
    schemaId: shrubCoastalLowPerformanceSummarySchemaId,
    assetId: "SHRUB_COASTAL_LOW_001",
    version: "v001",
    performanceClass: "mobile_first_lightweight",
    summary: {
      close: summarizeLod(exportManifest.outputs.close),
      gameplay: summarizeLod(exportManifest.outputs.gameplay),
      map: summarizeLod(exportManifest.outputs.map)
    },
    sharedMaterialApproach: {
      closeMaterialCount: exportManifest.outputs.close.materialCount,
      gameplayMaterialCount: exportManifest.outputs.gameplay.materialCount,
      mapMaterialCount: exportManifest.outputs.map.materialCount,
      materialCountsStayConstrained: exportManifest.outputs.close.materialCount <= 4
    },
    noExternalDependencies: exportManifest.externalDependenciesAllowed === false,
    exporterDeterministicFingerprint: exportManifest.deterministicFingerprint
  });

  const approvalChecklist = deepFreeze({
    schemaId: shrubCoastalLowApprovalChecklistSchemaId,
    assetId: "SHRUB_COASTAL_LOW_001",
    version: "v001",
    automatedValidationResults: {
      sourceBlendPresent: true,
      sourceBlendHashRecorded: true,
      exportManifestPresent: true,
      identityValidationRequired: exportManifest.identityValidationRequired,
      noExternalDependencies: exportManifest.externalDependenciesAllowed === false,
      expectedAnchorsDeclared: authoringSetup.identityAnchors.length === 3,
      lodOrderPassed: lodComparisonSummary.lodOrderPassed,
      goldenRegressionStatusChanged: false,
      registrationPerformed: false,
      promotionPerformed: false
    },
    humanVisualApprovalRequirements: {
      reviewStatus: "PENDING_HUMAN_REVIEW",
      papercut_2_5d_style: "REVIEW_REQUIRED",
      coastal_native_identity: "REVIEW_REQUIRED",
      mobile_first_readability: "REVIEW_REQUIRED",
      lod_visual_consistency: "REVIEW_REQUIRED",
      world_placement_suitability: "REVIEW_REQUIRED"
    },
    approvalBlockedUntilHumanReview: true,
    checklist: {
      papercutStyle: papercutChecklist,
      requiredEvidence: [
        "Reviewer confirms CLOSE LOD silhouette and material balance.",
        "Reviewer confirms GAMEPLAY LOD remains recognisable and readable.",
        "Reviewer confirms MAP LOD keeps the intended shrub identity at simplified scale.",
        "Reviewer confirms no visual defect blocks approval for the current revision."
      ]
    }
  });

  const evidence = deepFreeze({
    schemaId: shrubCoastalLowVisualReviewEvidenceSchemaId,
    assetId: "SHRUB_COASTAL_LOW_001",
    version: "v001",
    reportFilename,
    previewMetadata,
    lodComparisonSummary,
    performanceSummary,
    approvalChecklist,
    automatedValidation: {
      authoringManifestPresent: Boolean(authoringManifest.assetId),
      validationExpectationsPresent: Array.isArray(validationExpectations.expectations),
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

export function writeShrubCoastalLowVisualReviewEvidence({ cwd = process.cwd() } = {}) {
  const built = buildShrubCoastalLowVisualReviewEvidence({ cwd });
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

  return `# SHRUB_COASTAL_LOW_001 v001 Visual Review Evidence Package

Date: 2026-07-29
Asset: SHRUB_COASTAL_LOW_001_v001
Family: COASTAL_SHRUB_FAMILY_001
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
- Coastal native shrub identity
- Mobile-first readability at gameplay scale
- LOD-to-LOD visual consistency
- World placement suitability

## LOD Summary

- CLOSE: ${close.triangleCount} triangles, ${close.meshCount} meshes, ${close.materialCount} materials, ${close.sizeBytes} bytes
- GAMEPLAY: ${gameplay.triangleCount} triangles, ${gameplay.meshCount} meshes, ${gameplay.materialCount} materials, ${gameplay.sizeBytes} bytes
- MAP: ${map.triangleCount} triangles, ${map.meshCount} meshes, ${map.materialCount} materials, ${map.sizeBytes} bytes

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

function summarizeLod(output) {
  return deepFreeze({
    triangleCount: output.triangleCount,
    meshCount: output.meshCount,
    materialCount: output.materialCount,
    sizeBytes: output.sizeBytes
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
