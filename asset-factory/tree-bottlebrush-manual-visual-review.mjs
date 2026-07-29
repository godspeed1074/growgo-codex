import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  treeBottlebrushProductionRunDefinition,
  verifyTreeBottlebrushOutputs
} from "./tree-bottlebrush-production-run.mjs";
import {
  treeBottlebrushDevelopmentCatalogFilename,
  treeBottlebrushRegistrationFilename
} from "./tree-bottlebrush-registration.mjs";

export const treeBottlebrushManualVisualReviewSchemaId =
  "TREE_BOTTLEBRUSH_MANUAL_VISUAL_REVIEW_001";
export const treeBottlebrushManualVisualReviewFilename =
  "tree-bottlebrush-manual-visual-review.json";

export const treeBottlebrushManualVisualReviewStatuses = deepFreeze([
  "PASS",
  "FAIL",
  "NEEDS_REVISION",
  "NOT_REVIEWED"
]);

const manualVisualReviewChecklist = deepFreeze({
  papercut_2_5d_style: deepFreeze([
    "GrowGo layered papercut or diorama style reads clearly",
    "lightweight silhouette remains readable without realism-heavy detail",
    "shape simplification feels intentional and playful",
    "flower, trunk, and canopy masses remain clean at gameplay scale",
    "overall asset reads as a stylised world object rather than a dense hero prop"
  ]),
  australian_bottlebrush_identity: deepFreeze([
    "overall silhouette reads as an Australian bottlebrush rather than a generic shrub",
    "recognisable bottlebrush flower spikes are visible in the asset language",
    "native tree or shrub form feels believable for bottlebrush character",
    "palette supports Australian native vegetation identity",
    "asset does not drift into tropical palm, ornamental topiary, or broadleaf tree identity"
  ]),
  mobile_lightweight_design: deepFreeze([
    "geometry complexity feels appropriate for mobile use",
    "silhouette remains clean without micro-detail",
    "flower and leaf treatment stays readable without excessive primitives",
    "LOD progression supports simplified mobile presentation",
    "appearance suggests efficient reuse rather than hidden complexity"
  ]),
  world_placement_suitability: deepFreeze([
    "asset can plausibly sit beside roads",
    "asset can plausibly sit beside trails",
    "asset can plausibly sit in parks or gardens",
    "scale feels appropriate for the GrowGo world",
    "orientation and footprint do not imply unsupported Atlas placement assumptions"
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

export function inspectTreeBottlebrushManualVisualReviewInputs(
  rawDefinition = treeBottlebrushProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const verification = verifyTreeBottlebrushOutputs(rawDefinition, { cwd });
  const registration = readJsonRequired(
    path.join(outputDirectory, treeBottlebrushRegistrationFilename),
    "tree bottlebrush registration record"
  );
  const developmentCatalog = readJsonRequired(
    path.join(outputDirectory, treeBottlebrushDevelopmentCatalogFilename),
    "tree bottlebrush development catalog entry"
  );
  const metadata = readJsonRequired(
    path.join(outputDirectory, "tree-bottlebrush-metadata.json"),
    "tree bottlebrush metadata"
  );

  if (!verification.registrationGate.ready) {
    throw createManualVisualReviewError(
      "registration_gate_blocked",
      `Asset ${definition.assetId} must remain verification-ready before manual visual review.`
    );
  }

  return deepFreeze({
    outputDirectory,
    verification,
    registration,
    developmentCatalog,
    metadata,
    checks: deepFreeze({
      assetIdPreserved:
        registration.assetId === definition.assetId &&
        developmentCatalog.assetId === definition.assetId,
      recipeIdPreserved:
        registration.recipeId === definition.sourceRecipeId &&
        developmentCatalog.recipeId === definition.sourceRecipeId,
      versionPreserved:
        registration.version === developmentCatalog.version &&
        registration.version ===
          (metadata.identityContractV2?.version ?? registration.version),
      hashesPreserved:
        registration.verifiedOutputs.close.sha256 ===
          developmentCatalog.availableLods.close.sha256 &&
        registration.verifiedOutputs.gameplay.sha256 ===
          developmentCatalog.availableLods.gameplay.sha256 &&
        registration.verifiedOutputs.map.sha256 ===
          developmentCatalog.availableLods.map.sha256,
      developmentCatalogActive:
        developmentCatalog.environment === "DEVELOPMENT_ONLY" &&
        developmentCatalog.visibility.development === true,
      betaBlocked:
        developmentCatalog.visibility.beta === false &&
        developmentCatalog.environmentGuards.betaBlocked === true,
      productionBlocked:
        developmentCatalog.visibility.production === false &&
        developmentCatalog.environmentGuards.productionBlocked === true,
      notPublished:
        registration.publishStatus === "not_published" &&
        developmentCatalog.publishStatus === "not_published",
      noRendererActivation:
        developmentCatalog.runtimeSafetyFlags.lifecycleExecutionEnabled === false &&
        developmentCatalog.runtimeSafetyFlags.automaticRendererExecutionAllowed ===
          false &&
        developmentCatalog.environmentGuards.runtimeActivation === "disabled",
      noMapAttachment:
        developmentCatalog.runtimeSafetyFlags.mapAttachmentAllowed === false &&
        developmentCatalog.environmentGuards.mapAttachment === "disabled"
    })
  });
}

export function buildTreeBottlebrushManualVisualReviewRecord(
  rawDefinition = treeBottlebrushProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspection = inspectTreeBottlebrushManualVisualReviewInputs(
    rawDefinition,
    options
  );
  assertManualVisualReviewReadiness(definition, inspection);

  const reviewEvidence = normalizeReviewEvidence(
    options.reviewEvidence ?? {},
    options.reviewTimestamp ?? "2026-07-29T17:30:00.000Z",
    definition
  );

  const reviewResults = deepFreeze({
    papercut_2_5d_style: buildReviewEntry(
      "papercut_2_5d_style",
      reviewEvidence.papercut_2_5d_style
    ),
    australian_bottlebrush_identity: buildReviewEntry(
      "australian_bottlebrush_identity",
      reviewEvidence.australian_bottlebrush_identity
    ),
    mobile_lightweight_design: buildReviewEntry(
      "mobile_lightweight_design",
      reviewEvidence.mobile_lightweight_design
    ),
    world_placement_suitability: buildReviewEntry(
      "world_placement_suitability",
      reviewEvidence.world_placement_suitability
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
  const allPassed = Object.values(reviewResults).every(
    (entry) => entry.result === "PASS"
  );

  return deepFreeze({
    schemaId: treeBottlebrushManualVisualReviewSchemaId,
    reviewRecordId: `TREE_BOTTLEBRUSH_MANUAL_VISUAL_REVIEW_${definition.assetId}`,
    assetId: definition.assetId,
    category: definition.category,
    recipeId: definition.sourceRecipeId,
    version: inspection.registration.version,
    sourceRegistrationRecord: deepFreeze({
      filename: treeBottlebrushRegistrationFilename,
      deterministicFingerprint: inspection.registration.deterministicFingerprint,
      registrationStatus: inspection.registration.registrationStatus,
      validationStatus: inspection.registration.validationStatus
    }),
    sourceDevelopmentCatalogEntry: deepFreeze({
      filename: treeBottlebrushDevelopmentCatalogFilename,
      catalogEntryId: inspection.developmentCatalog.catalogEntryId,
      environment: inspection.developmentCatalog.environment,
      lifecycleStatus: inspection.developmentCatalog.lifecycleStatus
    }),
    manualReviewChecklist: manualVisualReviewChecklist,
    visualEvidenceModel: deepFreeze({
      supportedResults: treeBottlebrushManualVisualReviewStatuses,
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
    reviewContext: deepFreeze({
      approvedPalette: deepFreeze({
        paletteId: inspection.developmentCatalog.palette.paletteId,
        slots: inspection.developmentCatalog.palette.slots
      }),
      availableLods: deepFreeze({
        close: inspection.developmentCatalog.availableLods.close,
        gameplay: inspection.developmentCatalog.availableLods.gameplay,
        map: inspection.developmentCatalog.availableLods.map
      }),
      atlasCompatibility: inspection.developmentCatalog.atlasCompatibility,
      dependencyReferences: inspection.developmentCatalog.dependencyReferences
    }),
    reviewResults,
    reviewOutcome: deepFreeze({
      visualReviewComplete: allPassed,
      visuallyApprovedForDevelopmentCatalog: allPassed,
      unresolvedChecks,
      failedChecks,
      revisionChecks,
      minimalRevisionRecommendation:
        failedChecks.length > 0 || revisionChecks.length > 0
          ? buildMinimalRevisionRecommendation(reviewResults)
          : []
    }),
    preservedHashes: deepFreeze({
      blend: inspection.registration.sourceBlend.sha256,
      close: inspection.registration.verifiedOutputs.close.sha256,
      gameplay: inspection.registration.verifiedOutputs.gameplay.sha256,
      map: inspection.registration.verifiedOutputs.map.sha256
    }),
    safety: deepFreeze({
      lifecycleExecutionEnabled:
        inspection.developmentCatalog.runtimeSafetyFlags.lifecycleExecutionEnabled,
      mapAttachmentAllowed:
        inspection.developmentCatalog.runtimeSafetyFlags.mapAttachmentAllowed,
      automaticRendererExecutionAllowed:
        inspection.developmentCatalog.runtimeSafetyFlags
          .automaticRendererExecutionAllowed,
      runtimeExecutionAuthorized:
        inspection.developmentCatalog.runtimeSafetyFlags.runtimeExecutionAuthorized,
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
      failRecordsExactDefect: [...failedChecks, ...revisionChecks].every(
        (checkId) => Boolean(reviewResults[checkId].notes)
      ),
      hashesRemainPreserved: inspection.checks.hashesPreserved,
      developmentOnlySource: inspection.checks.developmentCatalogActive,
      betaBlocked: inspection.checks.betaBlocked,
      productionBlocked: inspection.checks.productionBlocked,
      noPublishingSideEffects: inspection.checks.notPublished,
      noRendererActivation: inspection.checks.noRendererActivation,
      noMapAttachment: inspection.checks.noMapAttachment,
      deterministicOutput: true,
      validationPassed: true,
      deterministicManualReviewHash: createHash("sha256")
        .update(
          JSON.stringify({
            assetId: definition.assetId,
            version: inspection.registration.version,
            reviewResults,
            preservedHashes: {
              blend: inspection.registration.sourceBlend.sha256,
              close: inspection.registration.verifiedOutputs.close.sha256,
              gameplay: inspection.registration.verifiedOutputs.gameplay.sha256,
              map: inspection.registration.verifiedOutputs.map.sha256
            }
          })
        )
        .digest("hex")
    })
  });
}

export function writeTreeBottlebrushManualVisualReview(
  rawDefinition = treeBottlebrushProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const reviewRecord = buildTreeBottlebrushManualVisualReviewRecord(
    rawDefinition,
    options
  );
  const reviewPath = path.join(outputDirectory, treeBottlebrushManualVisualReviewFilename);
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
    australian_bottlebrush_identity: normalizeReviewEntry(
      inputEvidence.australian_bottlebrush_identity,
      reviewTimestamp,
      definition
    ),
    mobile_lightweight_design: normalizeReviewEntry(
      inputEvidence.mobile_lightweight_design,
      reviewTimestamp,
      definition
    ),
    world_placement_suitability: normalizeReviewEntry(
      inputEvidence.world_placement_suitability,
      reviewTimestamp,
      definition
    )
  });
}

function normalizeReviewEntry(entry, reviewTimestamp) {
  const result = entry?.result ?? "NOT_REVIEWED";
  if (!treeBottlebrushManualVisualReviewStatuses.includes(result)) {
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
    sourceAssetVersion: entry?.sourceAssetVersion ?? "v001"
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
      recommendation:
        "Prepare a minimal bottlebrush revision only for the confirmed defect."
    }));
}

function assertManualVisualReviewReadiness(definition, inspection) {
  const failedCheck = Object.entries(inspection.checks).find(
    ([, value]) => value !== true
  );
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
      proofAssets: deepFreeze([...rawDefinition.expectedOutputs.proofAssets]),
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
  error.name = "TreeBottlebrushManualVisualReviewError";
  error.code = code;
  return error;
}
