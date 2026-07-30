import fs from "node:fs";
import path from "node:path";

const OUTPUT_LOCATION =
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/export";
const VALIDATION_LOCATION =
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/validation";
const SOURCE_LOCATION =
  "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source";

const REGISTRATION_FILENAME = "coastal-boardwalk-registration.json";
const CATALOG_FILENAME = "coastal-boardwalk-development-catalog-entry.json";
const VERSION_FILENAME = "coastal-boardwalk-v001-version-record.json";
const PROMOTION_FILENAME = "coastal-boardwalk-v001-promotion.json";
const VISUAL_APPROVAL_FILENAME = "coastal-boardwalk-visual-approval.json";
const EXPORT_VALIDATION_FILENAME = "coastal-boardwalk-export-validation.json";
const EXPORT_MANIFEST_FILENAME = "coastal-boardwalk-export-manifest.json";
const SOURCE_VERIFICATION_FILENAME = "coastal-boardwalk-source-verification.json";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }
  return Object.freeze(value);
}

export function buildCoastalBoardwalkV001Promotion(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, OUTPUT_LOCATION);
  const validationDirectory = path.resolve(cwd, VALIDATION_LOCATION);
  const sourceDirectory = path.resolve(cwd, SOURCE_LOCATION);

  const registration = readJson(path.join(outputDirectory, REGISTRATION_FILENAME));
  const catalog = readJson(path.join(outputDirectory, CATALOG_FILENAME));
  const versionRecord = readJson(path.join(outputDirectory, VERSION_FILENAME));
  const visualApproval = readJson(path.join(outputDirectory, VISUAL_APPROVAL_FILENAME));
  const exportValidation = readJson(
    path.join(validationDirectory, EXPORT_VALIDATION_FILENAME)
  );
  const exportManifest = readJson(path.join(outputDirectory, EXPORT_MANIFEST_FILENAME));
  const sourceVerification = readJson(
    path.join(sourceDirectory, SOURCE_VERIFICATION_FILENAME)
  );

  assertPromotionPreconditions({
    registration,
    catalog,
    versionRecord,
    visualApproval,
    exportValidation,
    exportManifest,
    sourceVerification
  });

  const promotedRegistration = deepFreeze({
    ...registration,
    promotionStatus: "active_development_revision",
    currentDevelopmentRevision: true,
    verification: {
      ...registration.verification,
      promotedToActiveDevelopmentRevision: true
    }
  });

  const promotedCatalog = deepFreeze({
    ...catalog,
    lifecycleStatus: "ACTIVE_DEVELOPMENT_REVISION",
    sourcePromotionRecord: {
      filename: PROMOTION_FILENAME,
      currentDevelopmentVersion: "v001"
    },
    validation: {
      ...catalog.validation,
      promotionApplied: true
    }
  });

  const promotedVersionRecord = deepFreeze({
    ...versionRecord,
    v001: {
      ...versionRecord.v001,
      status: "active_development_revision",
      current: true,
      promotionRecord: PROMOTION_FILENAME
    },
    promotionPerformed: true
  });

  const promotionRecord = deepFreeze({
    schemaId: "COASTAL_BOARDWALK_V001_CATALOG_PROMOTION_001",
    assetId: "COASTAL_BOARDWALK_001",
    previousDevelopmentVersion: null,
    currentDevelopmentVersion: "v001",
    promotedOn: options.promotedOn ?? "2026-07-30",
    before: {
      registrationPromotionStatus: "approved/current candidate",
      developmentCatalogLifecycleStatus: "APPROVED_CURRENT_CANDIDATE",
      versionRecordStatus: "approved/current candidate"
    },
    after: {
      registrationPromotionStatus: "active_development_revision",
      developmentCatalogLifecycleStatus: "ACTIVE_DEVELOPMENT_REVISION",
      versionRecordStatus: "active_development_revision"
    },
    v001: {
      status: "active_development_revision",
      current: true,
      visualApprovalRecord: VISUAL_APPROVAL_FILENAME,
      validationRecord: EXPORT_VALIDATION_FILENAME,
      registrationRecord: REGISTRATION_FILENAME,
      developmentCatalogRecord: CATALOG_FILENAME
    },
    scope: "ASSET_FACTORY_CATALOG_ONLY",
    published: false,
    runtimeActivated: false,
    registrationReplaced: false,
    visualApprovalReplaced: false,
    rollbackCapability: {
      available: true,
      candidateStateCanBeRestored: "approved/current candidate",
      historicalRecordsPreserved: true,
      requiredRecords: [REGISTRATION_FILENAME, CATALOG_FILENAME, VERSION_FILENAME]
    },
    noOtherAssetsModified: true
  });

  return deepFreeze({
    outputDirectory,
    registration: promotedRegistration,
    catalog: promotedCatalog,
    versionRecord: promotedVersionRecord,
    promotionRecord
  });
}

export function writeCoastalBoardwalkV001Promotion(options = {}) {
  const promotion = buildCoastalBoardwalkV001Promotion(options);
  fs.writeFileSync(
    path.join(promotion.outputDirectory, REGISTRATION_FILENAME),
    `${JSON.stringify(promotion.registration, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(promotion.outputDirectory, CATALOG_FILENAME),
    `${JSON.stringify(promotion.catalog, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(promotion.outputDirectory, VERSION_FILENAME),
    `${JSON.stringify(promotion.versionRecord, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(promotion.outputDirectory, PROMOTION_FILENAME),
    `${JSON.stringify(promotion.promotionRecord, null, 2)}\n`
  );
  return promotion;
}

function assertPromotionPreconditions({
  registration,
  catalog,
  versionRecord,
  visualApproval,
  exportValidation,
  exportManifest,
  sourceVerification
}) {
  const checks = [
    [registration.assetId === "COASTAL_BOARDWALK_001", "registration identity mismatch"],
    [catalog.assetId === "COASTAL_BOARDWALK_001", "catalog identity mismatch"],
    [versionRecord.assetId === "COASTAL_BOARDWALK_001", "version identity mismatch"],
    [visualApproval.assetId === "COASTAL_BOARDWALK_001", "visual approval identity mismatch"],
    [exportValidation.assetId === "COASTAL_BOARDWALK_001", "export validation identity mismatch"],
    [exportManifest.assetId === "COASTAL_BOARDWALK_001", "export manifest identity mismatch"],
    [sourceVerification.assetId === "COASTAL_BOARDWALK_001", "source verification identity mismatch"],
    [registration.recipeId === "COASTAL_BOARDWALK_RECIPE_001", "registration recipe mismatch"],
    [catalog.recipeId === "COASTAL_BOARDWALK_RECIPE_001", "catalog recipe mismatch"],
    [exportManifest.recipeId === "COASTAL_BOARDWALK_RECIPE_001", "export manifest recipe mismatch"],
    [
      ["approved/current candidate", "active_development_revision"].includes(
        registration.promotionStatus
      ),
      "registration is neither a current candidate nor already active"
    ],
    [
      ["APPROVED_CURRENT_CANDIDATE", "ACTIVE_DEVELOPMENT_REVISION"].includes(
        catalog.lifecycleStatus
      ),
      "catalog is neither a current candidate nor already active"
    ],
    [
      ["approved/current candidate", "active_development_revision"].includes(
        versionRecord.v001.status
      ),
      "version record is neither a current candidate nor already active"
    ],
    [visualApproval.approvalStatus === "approved", "visual approval missing"],
    [exportValidation.exportStatus === "VERIFIED_COMPLETE", "export validation not complete"],
    [registration.verification.manifestConsistency.ok === true, "manifest consistency failed"],
    [
      registration.verification.manifestConsistency.checks.every((check) => check.ok === true),
      "manifest consistency checks failed"
    ],
    [
      sourceVerification.sourceIdentityVerification.assetSpecificBlendFilesPresentInExport === false,
      "source/export separation violated"
    ]
  ];

  const failed = checks.find(([ok]) => !ok);
  if (failed) {
    throw new Error(`Boardwalk promotion blocked: ${failed[1]}.`);
  }
}

function readJson(filename) {
  if (!fs.existsSync(filename)) {
    throw new Error(`Boardwalk promotion blocked: missing ${filename}.`);
  }
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}
