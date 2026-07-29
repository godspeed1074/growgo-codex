import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  buildingCivicSportsPavilionProductionRunDefinition
} from "./building-civic-sports-pavilion-production-run.mjs";
import {
  buildingCivicSportsPavilionDevelopmentPreviewInspectionFilename,
  buildingCivicSportsPavilionStaticPreviewDescriptorFilename
} from "./building-civic-sports-pavilion-development-preview-inspection.mjs";
import {
  buildingCivicSportsPavilionDevelopmentPublishRecordFilename
} from "./building-civic-sports-pavilion-development-publish-execution.mjs";

export const buildingCivicSportsPavilionManualVisualReviewSchemaId =
  "ASSET_MANUAL_VISUAL_REVIEW_001";
export const buildingCivicSportsPavilionManualVisualReviewFilename =
  "building-civic-sports-pavilion-manual-visual-review.json";

export const buildingCivicSportsPavilionManualVisualReviewStatuses = deepFreeze([
  "PASS",
  "FAIL",
  "NEEDS_REVISION",
  "NOT_REVIEWED"
]);

const manualVisualReviewChecklist = deepFreeze({
  papercut_2_5d_style: deepFreeze([
    "simple readable forms",
    "layered 2.5D appearance",
    "bright but sensible civic palette",
    "no unnecessary realism",
    "no excessive geometry detail"
  ]),
  no_interior: deepFreeze([
    "no furnished rooms",
    "no hidden interior geometry",
    "no internal decorative detail",
    "openings do not expose unintended interior content"
  ]),
  road_facing_orientation: deepFreeze([
    "front entry is clearly identifiable",
    "signage and main frontage face the intended road side",
    "rear/service side is distinguishable",
    "orientation metadata matches the visible model"
  ])
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const key of Reflect.ownKeys(value)) {
    const nestedValue = value[key];
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }
  return Object.freeze(value);
}

export function inspectBuildingCivicSportsPavilionManualVisualReviewInputs(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const developmentPublishRecord = readJsonRequired(
    path.join(outputDirectory, buildingCivicSportsPavilionDevelopmentPublishRecordFilename),
    "development publish record"
  );
  const developmentInspection = readJsonRequired(
    path.join(outputDirectory, buildingCivicSportsPavilionDevelopmentPreviewInspectionFilename),
    "development preview inspection record"
  );
  const staticPreviewDescriptor = readJsonRequired(
    path.join(outputDirectory, buildingCivicSportsPavilionStaticPreviewDescriptorFilename),
    "static preview descriptor"
  );
  const approval = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-approval.json"),
    "approval record"
  );
  const registration = readJsonRequired(
    path.join(outputDirectory, "building-civic-sports-pavilion-registration.json"),
    "registration record"
  );

  if (developmentPublishRecord.publishStatus !== "PUBLISHED_DEVELOPMENT") {
    throw createManualVisualReviewError(
      "development_publish_missing",
      `Asset ${definition.assetId} is not development-published.`
    );
  }

  return deepFreeze({
    outputDirectory,
    developmentPublishRecord,
    developmentInspection,
    staticPreviewDescriptor,
    approval,
    registration,
    checks: deepFreeze({
      assetIdPreserved:
        developmentPublishRecord.assetId === definition.assetId &&
        developmentInspection.assetId === definition.assetId,
      versionPreserved:
        developmentPublishRecord.version === "1.0.0" &&
        developmentInspection.version === "1.0.0",
      hashesPreserved:
        developmentPublishRecord.verifiedHashes.close ===
          developmentInspection.verifiedHashes.close &&
        developmentPublishRecord.verifiedHashes.gameplay ===
          developmentInspection.verifiedHashes.gameplay &&
        developmentPublishRecord.verifiedHashes.map ===
          developmentInspection.verifiedHashes.map,
      noPublishingSideEffects:
        developmentPublishRecord.visibility.beta === false &&
        developmentPublishRecord.visibility.production === false,
      noRendererActivation:
        developmentPublishRecord.runtimeSafetyFlags.automaticRendererExecutionAllowed ===
          false &&
        staticPreviewDescriptor.restrictions.liveRendererImportAllowed === false,
      noMapAttachment:
        developmentPublishRecord.runtimeSafetyFlags.mapAttachmentAllowed === false &&
        staticPreviewDescriptor.restrictions.mapAttachmentAllowed === false
    })
  });
}

export function buildBuildingCivicSportsPavilionManualVisualReviewRecord(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspection = inspectBuildingCivicSportsPavilionManualVisualReviewInputs(
    rawDefinition,
    options
  );
  assertManualVisualReviewReadiness(definition, inspection);

  const reviewEvidence = normalizeReviewEvidence(
    options.reviewEvidence ?? {},
    options.reviewTimestamp ?? "2026-07-29T12:30:00.000Z",
    definition
  );

  const reviewResults = deepFreeze({
    papercut_2_5d_style: buildReviewEntry(
      "papercut_2_5d_style",
      reviewEvidence.papercut_2_5d_style
    ),
    no_interior: buildReviewEntry("no_interior", reviewEvidence.no_interior),
    road_facing_orientation: buildReviewEntry(
      "road_facing_orientation",
      reviewEvidence.road_facing_orientation
    )
  });

  const unresolvedChecks = Object.entries(reviewResults)
    .filter(([, entry]) => entry.result === "NOT_REVIEWED")
    .map(([checkId]) => checkId);
  const failedChecks = Object.entries(reviewResults)
    .filter(([, entry]) => entry.result === "FAIL")
    .map(([checkId]) => checkId);
  const revisionChecks = Object.entries(reviewResults)
    .filter(([, entry]) => entry.result === "NEEDS_REVISION")
    .map(([checkId]) => checkId);
  const allPassed = Object.values(reviewResults).every((entry) => entry.result === "PASS");

  return deepFreeze({
    schemaId: buildingCivicSportsPavilionManualVisualReviewSchemaId,
    reviewRecordId: `ASSET_MANUAL_VISUAL_REVIEW_${definition.assetId}`,
    assetId: definition.assetId,
    recipeId: definition.recipeId,
    sourceAssetVersion: inspection.developmentPublishRecord.version,
    sourceDevelopmentPublishRecord: deepFreeze({
      filename: buildingCivicSportsPavilionDevelopmentPublishRecordFilename,
      publishRecordId: inspection.developmentPublishRecord.publishRecordId,
      publishStatus: inspection.developmentPublishRecord.publishStatus
    }),
    sourceDevelopmentPreviewInspection: deepFreeze({
      filename: buildingCivicSportsPavilionDevelopmentPreviewInspectionFilename,
      inspectionRecordId: inspection.developmentInspection.inspectionRecordId
    }),
    sourceStaticPreviewDescriptor: deepFreeze({
      filename: buildingCivicSportsPavilionStaticPreviewDescriptorFilename,
      previewDescriptorId: inspection.staticPreviewDescriptor.previewDescriptorId
    }),
    manualReviewChecklist: manualVisualReviewChecklist,
    visualEvidenceModel: deepFreeze({
      supportedResults: buildingCivicSportsPavilionManualVisualReviewStatuses,
      passRequiresExplicitEvidence: true,
      fields: [
        "result",
        "reviewerEvidence",
        "screenshotReferenceOrConfirmation",
        "notes",
        "timestamp",
        "sourceAssetVersion"
      ]
    }),
    reviewResults,
    reviewOutcome: deepFreeze({
      visualReviewComplete: allPassed,
      visuallyApprovedForDevelopmentPreview: allPassed,
      unresolvedChecks,
      failedChecks,
      revisionChecks,
      minimalRevisionRecommendation:
        failedChecks.length > 0 || revisionChecks.length > 0
          ? buildMinimalRevisionRecommendation(reviewResults)
          : []
    }),
    preservedHashes: inspection.developmentPublishRecord.verifiedHashes,
    safety: deepFreeze({
      lifecycleExecutionEnabled:
        inspection.developmentPublishRecord.runtimeSafetyFlags.lifecycleExecutionEnabled,
      mapAttachmentAllowed:
        inspection.developmentPublishRecord.runtimeSafetyFlags.mapAttachmentAllowed,
      automaticRendererExecutionAllowed:
        inspection.developmentPublishRecord.runtimeSafetyFlags
          .automaticRendererExecutionAllowed,
      runtimeExecutionAuthorized:
        inspection.developmentPublishRecord.runtimeSafetyFlags.runtimeExecutionAuthorized,
      canvasCreated: false,
      webglCreated: false,
      mapAttached: false,
      betaPublished: false,
      productionPublished: false,
      releaseCreated: false
    }),
    validation: deepFreeze({
      passRequiresExplicitEvidence: Object.values(reviewResults)
        .filter((entry) => entry.result === "PASS")
        .every(
          (entry) =>
            Boolean(entry.reviewerEvidence) &&
            Boolean(entry.screenshotReferenceOrConfirmation)
        ),
      unresolvedChecksRemainUnresolvedWithoutEvidence: unresolvedChecks.every(
        (checkId) => reviewResults[checkId].reviewerEvidence === null
      ),
      failRecordsExactDefect: [...failedChecks, ...revisionChecks].every((checkId) =>
        Boolean(reviewResults[checkId].notes)
      ),
      hashesRemainPreserved: inspection.checks.hashesPreserved,
      noPublishingSideEffects: inspection.checks.noPublishingSideEffects,
      noRendererActivation: inspection.checks.noRendererActivation,
      noMapAttachment: inspection.checks.noMapAttachment,
      deterministicOutput: true,
      validationPassed: true,
      deterministicManualReviewHash: createHash("sha256")
        .update(
          JSON.stringify({
            assetId: definition.assetId,
            version: inspection.developmentPublishRecord.version,
            reviewResults,
            preservedHashes: inspection.developmentPublishRecord.verifiedHashes
          })
        )
        .digest("hex")
    })
  });
}

export function writeBuildingCivicSportsPavilionManualVisualReview(
  rawDefinition = buildingCivicSportsPavilionProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const reviewRecord = buildBuildingCivicSportsPavilionManualVisualReviewRecord(
    rawDefinition,
    options
  );
  const reviewPath = path.join(
    outputDirectory,
    buildingCivicSportsPavilionManualVisualReviewFilename
  );
  fs.writeFileSync(reviewPath, `${JSON.stringify(reviewRecord, null, 2)}\n`);

  return deepFreeze({
    reviewPath,
    reviewRecord
  });
}

function buildReviewEntry(checkId, evidence) {
  if (evidence.result === "PASS") {
    assertExplicitEvidence(checkId, evidence);
  }
  if (evidence.result === "FAIL" || evidence.result === "NEEDS_REVISION") {
    if (!evidence.notes) {
      throw createManualVisualReviewError(
        "missing_defect_notes",
        `Manual visual review ${checkId} requires defect notes for result ${evidence.result}.`
      );
    }
  }
  return deepFreeze({
    result: evidence.result,
    reviewerEvidence: evidence.reviewerEvidence,
    screenshotReferenceOrConfirmation: evidence.screenshotReferenceOrConfirmation,
    notes: evidence.notes,
    timestamp: evidence.timestamp,
    sourceAssetVersion: evidence.sourceAssetVersion
  });
}

function normalizeReviewEvidence(inputEvidence, reviewTimestamp, definition) {
  return deepFreeze({
    papercut_2_5d_style: normalizeReviewEntry(
      inputEvidence.papercut_2_5d_style,
      reviewTimestamp,
      definition
    ),
    no_interior: normalizeReviewEntry(
      inputEvidence.no_interior,
      reviewTimestamp,
      definition
    ),
    road_facing_orientation: normalizeReviewEntry(
      inputEvidence.road_facing_orientation,
      reviewTimestamp,
      definition
    )
  });
}

function normalizeReviewEntry(entry, reviewTimestamp, definition) {
  const result = entry?.result ?? "NOT_REVIEWED";
  if (!buildingCivicSportsPavilionManualVisualReviewStatuses.includes(result)) {
    throw createManualVisualReviewError(
      "invalid_review_status",
      `Unsupported manual visual review status: ${result}.`
    );
  }
  return deepFreeze({
    result,
    reviewerEvidence: entry?.reviewerEvidence ?? null,
    screenshotReferenceOrConfirmation:
      entry?.screenshotReferenceOrConfirmation ?? null,
    notes: entry?.notes ?? null,
    timestamp: entry?.timestamp ?? reviewTimestamp,
    sourceAssetVersion: entry?.sourceAssetVersion ?? "1.0.0"
  });
}

function assertExplicitEvidence(checkId, evidence) {
  if (!evidence.reviewerEvidence || !evidence.screenshotReferenceOrConfirmation) {
    throw createManualVisualReviewError(
      "pass_requires_explicit_evidence",
      `Manual visual review ${checkId} cannot pass without explicit evidence and confirmation.`
    );
  }
}

function buildMinimalRevisionRecommendation(reviewResults) {
  return Object.entries(reviewResults)
    .filter(([, entry]) => entry.result === "FAIL" || entry.result === "NEEDS_REVISION")
    .map(([checkId, entry]) => ({
      checkId,
      issue: entry.notes,
      recommendation: "Prepare a minimal pavilion revision only for the confirmed defect."
    }));
}

function assertManualVisualReviewReadiness(definition, inspection) {
  const failedCheck = Object.entries(inspection.checks).find(([, value]) => value !== true);
  if (failedCheck) {
    const [failedKey] = failedCheck;
    throw createManualVisualReviewError(
      "manual_review_input_check_failed",
      `Manual visual review requirements failed for ${definition.assetId}: ${failedKey}.`
    );
  }
}

function normalizeDefinition(rawDefinition) {
  return deepFreeze({
    ...rawDefinition,
    expectedOutputs: deepFreeze({
      ...rawDefinition.expectedOutputs,
      proofAsset: deepFreeze([...rawDefinition.expectedOutputs.proofAsset]),
      metadataFiles: deepFreeze([...rawDefinition.expectedOutputs.metadataFiles])
    })
  });
}

function readJsonRequired(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw createManualVisualReviewError(
      "missing_required_record",
      `Missing ${label} at ${filePath}.`
    );
  }
  return deepFreeze(JSON.parse(fs.readFileSync(filePath, "utf8")));
}

function createManualVisualReviewError(code, message) {
  const error = new Error(message);
  error.name = "BuildingCivicSportsPavilionManualVisualReviewError";
  error.code = code;
  return error;
}
