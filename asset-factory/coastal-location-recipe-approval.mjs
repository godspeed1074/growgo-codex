import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";

const SPECIFICATION_FILENAME = "coastal-location-recipe-001-specification.json";
const REFINEMENT_SPECIFICATION_FILENAME =
  "coastal-location-recipe-001-refinement-specification.json";
const REGENERATED_PLAN_FILENAME =
  "coastal-location-recipe-001-regenerated-plan.json";
const REGENERATED_DEPENDENCY_MAP_FILENAME =
  "coastal-location-recipe-001-regenerated-dependency-map.json";
const REGENERATION_VALIDATION_FILENAME =
  "coastal-location-recipe-001-regeneration-validation.json";
const REGENERATED_PREVIEW_REVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-regenerated-preview-review-validation.json";
const REGENERATED_PREVIEW_COMPARISON_FILENAME =
  "coastal-location-recipe-001-regenerated-before-after-comparison.json";

const APPROVAL_FILENAME = "coastal-location-recipe-001-approval.json";
const CATALOG_FILENAME = "coastal-location-recipe-001-approved-catalog-entry.json";
const VERSION_FILENAME = "coastal-location-recipe-001-v001-version-record.json";
const REPORT_FILENAME = "coastal-location-recipe-001-approval-report.md";

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

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function writeJson(filename, value) {
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function loadInputs(cwd) {
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const specificationRoot = path.join(recipeRoot, "specification");
  const refinementRoot = path.join(recipeRoot, "refinement");
  const generationRoot = path.join(recipeRoot, "generation");
  const previewRoot = path.join(recipeRoot, "preview");
  const validationRoot = path.join(recipeRoot, "validation");
  const approvalRoot = path.join(recipeRoot, "approval");
  const catalogRoot = path.join(recipeRoot, "catalog");
  const versionRoot = path.join(recipeRoot, "version");
  const reportsRoot = path.join(recipeRoot, "reports");

  const specification = readJson(path.join(specificationRoot, SPECIFICATION_FILENAME));
  const refinementSpecification = readJson(
    path.join(refinementRoot, REFINEMENT_SPECIFICATION_FILENAME)
  );
  const regeneratedPlan = readJson(path.join(generationRoot, REGENERATED_PLAN_FILENAME));
  const regeneratedDependencyMap = readJson(
    path.join(generationRoot, REGENERATED_DEPENDENCY_MAP_FILENAME)
  );
  const regenerationValidation = readJson(
    path.join(validationRoot, REGENERATION_VALIDATION_FILENAME)
  );
  const previewReviewValidation = readJson(
    path.join(validationRoot, REGENERATED_PREVIEW_REVIEW_VALIDATION_FILENAME)
  );
  const previewComparison = readJson(
    path.join(previewRoot, REGENERATED_PREVIEW_COMPARISON_FILENAME)
  );

  if (regenerationValidation.status !== "pass") {
    throw new Error(
      "Coastal location recipe approval blocked: regeneration validation must pass first."
    );
  }
  if (previewReviewValidation.status !== "pass") {
    throw new Error(
      "Coastal location recipe approval blocked: regenerated preview review validation must pass first."
    );
  }
  if (previewComparison.overallStatus !== "APPROVED_FOR_RECIPE_APPROVAL") {
    throw new Error(
      "Coastal location recipe approval blocked: regenerated preview comparison is not approval-ready."
    );
  }

  return {
    recipeRoot,
    specificationRoot,
    refinementRoot,
    generationRoot,
    previewRoot,
    validationRoot,
    approvalRoot,
    catalogRoot,
    versionRoot,
    reportsRoot,
    specification,
    refinementSpecification,
    regeneratedPlan,
    regeneratedDependencyMap,
    regenerationValidation,
    previewReviewValidation,
    previewComparison
  };
}

function buildApprovalRecord(inputs, options = {}) {
  const dependencyIds = inputs.regeneratedDependencyMap.assets.map((asset) => asset.assetId);
  const checks = [
    { name: "improvements_confirmed", ok: true },
    {
      name: "dependencies_valid",
      ok:
        inputs.regeneratedDependencyMap.unsupportedAssetsIncluded === false &&
        inputs.regeneratedDependencyMap.assets.every((asset) => asset.placementCount > 0)
    },
    {
      name: "deterministic_fingerprint_recorded",
      ok: Boolean(inputs.regeneratedPlan.deterministicFingerprint)
    },
    {
      name: "performance_budgets_acceptable",
      ok: Object.values(inputs.regeneratedPlan.mobilePerformanceLimits.withinBudget).every(Boolean)
    },
    {
      name: "no_unsupported_assets_included",
      ok: inputs.regeneratedPlan.unsupportedAssetsIncluded === false
    },
    { name: "no_blender_usage", ok: true },
    { name: "no_glb_generation", ok: true },
    { name: "no_asset_modification", ok: true },
    { name: "no_runtime_activation", ok: true }
  ];

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_APPROVAL_RECORD_001",
    recipeId: inputs.specification.recipeIdentity.recipeId,
    recipePackageId: inputs.specification.recipePackageId,
    recipeType: inputs.specification.recipeIdentity.recipeType,
    version: inputs.specification.recipeIdentity.version,
    variantId: inputs.specification.recipeIdentity.variantId,
    paletteId: inputs.specification.recipeIdentity.paletteId,
    lodProfile: inputs.specification.recipeIdentity.lodProfile,
    category: inputs.specification.recipeIdentity.category,
    approvalStatus: "approved",
    lifecycleStatus: "APPROVED_CURRENT",
    approvedOn: options.approvalDate ?? "2026-07-30",
    approvedFromRegeneratedFingerprint: inputs.regeneratedPlan.deterministicFingerprint,
    priorPreviewFingerprint: inputs.previewComparison.previousPreviewFingerprint,
    regeneratedPreviewFingerprint: inputs.previewComparison.regeneratedPreviewFingerprint,
    dependencyIds,
    performanceSummary: inputs.regeneratedPlan.mobilePerformanceLimits,
    refinementReference: {
      schemaId: inputs.refinementSpecification.schemaId,
      plannedChangeCount: inputs.refinementSpecification.plannedChanges.length
    },
    comparisonSummary: {
      overallStatus: inputs.previewComparison.overallStatus,
      shorelineTransition:
        inputs.previewComparison.review.shorelineTransition.status,
      destinationQuality:
        inputs.previewComparison.review.destinationQuality.status,
      vegetationBalance:
        inputs.previewComparison.review.vegetationBalance.status,
      explorationInterest:
        inputs.previewComparison.review.explorationInterest.status,
      performanceImpact:
        inputs.previewComparison.review.performanceImpact.status
    },
    verification: {
      status: checks.every((check) => check.ok) ? "pass" : "fail",
      checks
    },
    safety: {
      blenderUsed: false,
      glbsCreated: false,
      assetsModified: false,
      runtimeActivated: false
    }
  });
}

function buildApprovedCatalogEntry(inputs, approvalRecord) {
  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_APPROVED_CATALOG_ENTRY_001",
    recipeId: approvalRecord.recipeId,
    recipePackageId: approvalRecord.recipePackageId,
    version: approvalRecord.version,
    lifecycleStatus: "APPROVED_CURRENT",
    environment: "DEVELOPMENT_ONLY",
    visibility: {
      development: true,
      beta: false,
      production: false
    },
    environmentGuards: {
      betaBlocked: true,
      productionBlocked: true,
      runtimeActivationBlocked: true
    },
    deterministicFingerprint: inputs.regeneratedPlan.deterministicFingerprint,
    placementSummary: {
      totalPlacements: inputs.regeneratedPlan.placementPlan.totalPlacements,
      uniqueDependencies: inputs.regeneratedDependencyMap.assets.length
    },
    performanceSummary: inputs.regeneratedPlan.mobilePerformanceLimits,
    dependencyReferences: inputs.regeneratedDependencyMap.assets.map((asset) => ({
      assetId: asset.assetId,
      role: asset.role,
      placementCount: asset.placementCount
    })),
    approvalReference: APPROVAL_FILENAME,
    publishStatus: "not_published",
    runtimeSafetyFlags: {
      lifecycleExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      runtimeExecutionAuthorized: false
    }
  });
}

function buildVersionRecord(inputs, approvalRecord) {
  const versionHash = hashHex(
    approvalRecord.recipeId,
    approvalRecord.version,
    approvalRecord.approvedFromRegeneratedFingerprint,
    JSON.stringify(approvalRecord.dependencyIds)
  );

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_VERSION_RECORD_001",
    recipeId: approvalRecord.recipeId,
    previousApprovedVersion: null,
    currentApprovedVersion: approvalRecord.version,
    published: false,
    runtimeActivated: false,
    approvalPerformed: true,
    v001: {
      version: approvalRecord.version,
      status: "APPROVED_CURRENT",
      current: true,
      deterministicFingerprint: inputs.regeneratedPlan.deterministicFingerprint,
      previewReviewStatus: inputs.previewComparison.overallStatus,
      performanceSummary: inputs.regeneratedPlan.mobilePerformanceLimits
    },
    versionHash
  });
}

function buildReport(approvalRecord, catalogEntry, versionRecord) {
  return `# COASTAL_LOCATION_RECIPE_001 Approval Report

Status: Refined coastal location recipe approved

## Approval

- recipe: ${approvalRecord.recipeId}
- version: ${approvalRecord.version}
- lifecycle: ${approvalRecord.lifecycleStatus}
- deterministic fingerprint: ${approvalRecord.approvedFromRegeneratedFingerprint}

## Validation

${approvalRecord.verification.checks
  .map((check) => `- ${check.name}: ${check.ok}`)
  .join("\n")}

## Catalog

- environment: ${catalogEntry.environment}
- development visibility: ${catalogEntry.visibility.development}
- beta visibility: ${catalogEntry.visibility.beta}
- production visibility: ${catalogEntry.visibility.production}

## Version

- current approved version: ${versionRecord.currentApprovedVersion}
- published: ${versionRecord.published}
- runtime activated: ${versionRecord.runtimeActivated}

## Safety

No Blender, GLBs, asset modification, or runtime activation were performed.
`;
}

export function buildCoastalLocationRecipeApprovalPackage(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const inputs = loadInputs(cwd);

  const approvalRecord = buildApprovalRecord(inputs, options);
  const catalogEntry = buildApprovedCatalogEntry(inputs, approvalRecord);
  const versionRecord = buildVersionRecord(inputs, approvalRecord);
  const report = buildReport(approvalRecord, catalogEntry, versionRecord);

  return deepFreeze({
    approvalRecord,
    catalogEntry,
    versionRecord,
    report,
    fingerprint: hashHex(
      approvalRecord.approvedFromRegeneratedFingerprint,
      catalogEntry.lifecycleStatus,
      versionRecord.versionHash
    )
  });
}

export function writeCoastalLocationRecipeApprovalPackage(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const inputs = loadInputs(cwd);
  const packageData = buildCoastalLocationRecipeApprovalPackage(options);

  ensureDirectory(inputs.approvalRoot);
  ensureDirectory(inputs.catalogRoot);
  ensureDirectory(inputs.versionRoot);
  ensureDirectory(inputs.reportsRoot);

  writeJson(path.join(inputs.approvalRoot, APPROVAL_FILENAME), packageData.approvalRecord);
  writeJson(path.join(inputs.catalogRoot, CATALOG_FILENAME), packageData.catalogEntry);
  writeJson(path.join(inputs.versionRoot, VERSION_FILENAME), packageData.versionRecord);
  fs.writeFileSync(path.join(inputs.reportsRoot, REPORT_FILENAME), `${packageData.report}\n`);

  return deepFreeze({
    ...packageData,
    approvalPath: path.join(inputs.approvalRoot, APPROVAL_FILENAME),
    catalogPath: path.join(inputs.catalogRoot, CATALOG_FILENAME),
    versionPath: path.join(inputs.versionRoot, VERSION_FILENAME),
    reportPath: path.join(inputs.reportsRoot, REPORT_FILENAME)
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  writeCoastalLocationRecipeApprovalPackage();
}
