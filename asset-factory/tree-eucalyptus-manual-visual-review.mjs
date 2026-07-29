import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import {
  treeEucalyptusProductionRunDefinition,
  verifyTreeEucalyptusOutputs
} from "./tree-eucalyptus-production-run.mjs";
import {
  treeEucalyptusDevelopmentCatalogFilename,
  treeEucalyptusRegistrationFilename
} from "./tree-eucalyptus-registration.mjs";

export const treeEucalyptusManualVisualReviewSchemaId =
  "TREE_EUCALYPTUS_MANUAL_VISUAL_REVIEW_001";
export const treeEucalyptusManualVisualReviewFilename =
  "tree-eucalyptus-manual-visual-review.json";

export const treeEucalyptusManualVisualReviewStatuses = deepFreeze([
  "PASS",
  "FAIL",
  "NEEDS_REVISION",
  "NOT_REVIEWED"
]);

const manualVisualReviewChecklist = deepFreeze({
  papercut_2_5d_style: deepFreeze([
    "simple readable layered forms",
    "stylised 2.5D silhouette rather than realistic rendering",
    "clean shape language with limited fine detail",
    "palette reads as bright but grounded nature art",
    "branch and canopy masses remain easy to read at gameplay scale"
  ]),
  australian_eucalyptus_identity: deepFreeze([
    "overall silhouette reads as eucalyptus rather than generic tree",
    "trunk and branch structure suggest Australian gum tree character",
    "canopy clustering feels appropriate for eucalyptus foliage",
    "palette supports native eucalyptus tones",
    "asset does not visually drift into tropical palm or dense broadleaf identity"
  ]),
  mobile_lightweight_design: deepFreeze([
    "geometry remains lightweight for mobile use",
    "shared material usage appears restrained and intentional",
    "LOD progression visibly simplifies the tree",
    "no unnecessary micro-detail or hidden complexity",
    "asset remains readable without needing dense geometry"
  ]),
  world_placement_suitability: deepFreeze([
    "asset can plausibly sit in coastal, parkland, suburban, or forest-edge placement",
    "upright orientation and footprint feel sensible for Atlas placement",
    "base and canopy proportions do not create obvious placement issues",
    "tree reads well as a reusable world object rather than a one-off scene prop",
    "no visible assumptions conflict with Atlas real-world placement rules"
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

export function inspectTreeEucalyptusManualVisualReviewInputs(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const verification = verifyTreeEucalyptusOutputs(rawDefinition, { cwd });
  const registration = readJsonRequired(
    path.join(outputDirectory, treeEucalyptusRegistrationFilename),
    "tree eucalyptus registration record"
  );
  const developmentCatalog = readJsonRequired(
    path.join(outputDirectory, treeEucalyptusDevelopmentCatalogFilename),
    "tree eucalyptus development catalog entry"
  );
  const metadata = readJsonRequired(
    path.join(outputDirectory, "tree-eucalyptus-metadata.json"),
    "tree eucalyptus metadata"
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
        registration.version === (metadata.identityContractV2?.version ?? registration.version),
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
        developmentCatalog.runtimeSafetyFlags.automaticRendererExecutionAllowed === false &&
        developmentCatalog.environmentGuards.runtimeActivation === "disabled",
      noMapAttachment:
        developmentCatalog.runtimeSafetyFlags.mapAttachmentAllowed === false &&
        developmentCatalog.environmentGuards.mapAttachment === "disabled"
    })
  });
}

export function buildTreeEucalyptusManualVisualReviewRecord(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const inspection = inspectTreeEucalyptusManualVisualReviewInputs(rawDefinition, options);
  assertManualVisualReviewReadiness(definition, inspection);

  const reviewEvidence = normalizeReviewEvidence(
    options.reviewEvidence ?? {},
    options.reviewTimestamp ?? "2026-07-29T14:30:00.000Z",
    definition
  );

  const reviewResults = deepFreeze({
    papercut_2_5d_style: buildReviewEntry(
      "papercut_2_5d_style",
      reviewEvidence.papercut_2_5d_style
    ),
    australian_eucalyptus_identity: buildReviewEntry(
      "australian_eucalyptus_identity",
      reviewEvidence.australian_eucalyptus_identity
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
  const allPassed = Object.values(reviewResults).every((entry) => entry.result === "PASS");

  return deepFreeze({
    schemaId: treeEucalyptusManualVisualReviewSchemaId,
    reviewRecordId: `TREE_EUCALYPTUS_MANUAL_VISUAL_REVIEW_${definition.assetId}`,
    assetId: definition.assetId,
    category: definition.category,
    recipeId: definition.sourceRecipeId,
    version: inspection.registration.version,
    sourceRegistrationRecord: deepFreeze({
      filename: treeEucalyptusRegistrationFilename,
      deterministicFingerprint: inspection.registration.deterministicFingerprint,
      registrationStatus: inspection.registration.registrationStatus,
      validationStatus: inspection.registration.validationStatus
    }),
    sourceDevelopmentCatalogEntry: deepFreeze({
      filename: treeEucalyptusDevelopmentCatalogFilename,
      catalogEntryId: inspection.developmentCatalog.catalogEntryId,
      environment: inspection.developmentCatalog.environment,
      lifecycleStatus: inspection.developmentCatalog.lifecycleStatus
    }),
    manualReviewChecklist: manualVisualReviewChecklist,
    visualEvidenceModel: deepFreeze({
      supportedResults: treeEucalyptusManualVisualReviewStatuses,
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
        inspection.developmentCatalog.runtimeSafetyFlags.automaticRendererExecutionAllowed,
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
      failRecordsExactDefect: [...failedChecks, ...revisionChecks].every((checkId) =>
        Boolean(reviewResults[checkId].notes)
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

export function writeTreeEucalyptusManualVisualReview(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  fs.mkdirSync(outputDirectory, { recursive: true });

  const reviewRecord = buildTreeEucalyptusManualVisualReviewRecord(rawDefinition, options);
  const reviewPath = path.join(outputDirectory, treeEucalyptusManualVisualReviewFilename);
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
    australian_eucalyptus_identity: normalizeReviewEntry(
      inputEvidence.australian_eucalyptus_identity,
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
  if (!treeEucalyptusManualVisualReviewStatuses.includes(result)) {
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
      recommendation: "Prepare a minimal eucalyptus revision only for the confirmed defect."
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
      proofAssets: deepFreeze([...rawDefinition.expectedOutputs.proofAssets]),
      metadataFiles: deepFreeze([...rawDefinition.expectedOutputs.metadataFiles]),
      legacyOutputs: deepFreeze([...rawDefinition.expectedOutputs.legacyOutputs])
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
  error.name = "TreeEucalyptusManualVisualReviewError";
  error.code = code;
  return error;
}
