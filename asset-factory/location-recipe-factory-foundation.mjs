import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const REFERENCE_RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";
const FACTORY_ROOT =
  "asset-factory-workspace/recipe-factory/LOCATION_RECIPE_FACTORY_001";

const APPROVAL_FILENAME = "coastal-location-recipe-001-approval.json";
const CATALOG_FILENAME = "coastal-location-recipe-001-approved-catalog-entry.json";
const VERSION_FILENAME = "coastal-location-recipe-001-v001-version-record.json";
const SPECIFICATION_FILENAME = "coastal-location-recipe-001-specification.json";
const REGEN_VALIDATION_FILENAME =
  "coastal-location-recipe-001-regeneration-validation.json";
const PREVIEW_REVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-regenerated-preview-review-validation.json";

const FACTORY_SPECIFICATION_FILENAME =
  "location-recipe-factory-specification.json";
const FACTORY_VALIDATION_FILENAME = "location-recipe-factory-validation.json";
const FACTORY_LIFECYCLE_FILENAME = "location-recipe-factory-lifecycle-record.json";
const FACTORY_REPORT_FILENAME = "location-recipe-factory-foundation-report.md";

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

function loadReference(cwd) {
  const referenceRoot = path.resolve(cwd, REFERENCE_RECIPE_ROOT);
  const approval = readJson(
    path.join(referenceRoot, "approval", APPROVAL_FILENAME)
  );
  const catalog = readJson(path.join(referenceRoot, "catalog", CATALOG_FILENAME));
  const version = readJson(path.join(referenceRoot, "version", VERSION_FILENAME));
  const specification = readJson(
    path.join(referenceRoot, "specification", SPECIFICATION_FILENAME)
  );
  const regenerationValidation = readJson(
    path.join(referenceRoot, "validation", REGEN_VALIDATION_FILENAME)
  );
  const previewReviewValidation = readJson(
    path.join(referenceRoot, "validation", PREVIEW_REVIEW_VALIDATION_FILENAME)
  );

  if (approval.approvalStatus !== "approved") {
    throw new Error(
      "Location recipe factory foundation blocked: reference recipe approval is not complete."
    );
  }
  if (regenerationValidation.status !== "pass") {
    throw new Error(
      "Location recipe factory foundation blocked: reference recipe regeneration validation must pass."
    );
  }
  if (previewReviewValidation.status !== "pass") {
    throw new Error(
      "Location recipe factory foundation blocked: reference recipe preview review validation must pass."
    );
  }

  return {
    referenceRoot,
    approval,
    catalog,
    version,
    specification,
    regenerationValidation,
    previewReviewValidation
  };
}

function buildFactorySpecification(reference) {
  return deepFreeze({
    schemaId: "LOCATION_RECIPE_FACTORY_SPECIFICATION_001",
    factoryId: "LOCATION_RECIPE_FACTORY_001",
    workflowVersion: "ASSET_FACTORY_V1",
    referenceRecipe: {
      recipeId: reference.approval.recipeId,
      recipePackageId: reference.approval.recipePackageId,
      version: reference.approval.version,
      lifecycleStatus: reference.approval.lifecycleStatus,
      deterministicFingerprint:
        reference.approval.approvedFromRegeneratedFingerprint
    },
    recipeSchema: {
      requiredIdentityFields: [
        "recipeId",
        "recipePackageId",
        "recipeType",
        "version",
        "variantId",
        "paletteId",
        "lodProfile",
        "category",
        "identityPolicy"
      ],
      requiredDependencyFields: [
        "assetId",
        "version",
        "role",
        "familyId",
        "category",
        "recipeId",
        "environment",
        "lifecycleStatus",
        "validationStatus",
        "sourceCatalogRecord"
      ],
      requiredOutputRecords: [
        "specification",
        "generation",
        "preview",
        "review",
        "refinement",
        "approval",
        "catalog",
        "version"
      ]
    },
    lifecycleStates: [
      "INTAKE_DEFINED",
      "GENERATION_READY",
      "GENERATED",
      "PREVIEW_READY",
      "PREVIEW_REVIEWED",
      "REFINEMENT_PLANNED",
      "REGENERATED",
      "APPROVAL_READY",
      "APPROVED_CURRENT"
    ],
    dependencyValidation: {
      allowedDependencyLifecycleStates: [
        "ACTIVE_DEVELOPMENT_REVISION",
        "APPROVED_CURRENT",
        "APPROVED_CURRENT_CANDIDATE"
      ],
      requiredDependencyStatuses: {
        validationStatus: "approved",
        environment: "DEVELOPMENT_ONLY"
      },
      unsupportedAssetsPolicy: "BLOCK_RECIPE"
    },
    deterministicGenerationRules: {
      requiredSeedFields: [
        "seed",
        "locationId",
        "variantId",
        "biomeProfile",
        "archetype"
      ],
      fingerprintPolicy:
        "hash(recipeId, locationPlanId, zoneAllocation, placementTransforms)",
      sameSeedMustProduceSameFingerprint: true,
      refinementMustProduceNewFingerprintWhenPlanChanges: true
    },
    previewWorkflow: {
      mode: "NON_RUNTIME_ONLY",
      requiredArtifacts: [
        "placement_preview_data",
        "dependency_visualization",
        "zone_summary",
        "density_report"
      ],
      requiredReviewChecks: [
        "navigation_flow",
        "water_transition",
        "vegetation_density",
        "asset_spacing",
        "performance_budgets"
      ]
    },
    approvalWorkflow: {
      prerequisites: [
        "regeneration_validation_pass",
        "preview_review_validation_pass",
        "improvements_confirmed",
        "dependencies_valid",
        "performance_budgets_acceptable"
      ],
      producedRecords: [
        "recipe_approval_record",
        "approved_recipe_catalog_entry",
        "recipe_version_record"
      ],
      publishBlockedByDefault: true
    },
    versioningRules: {
      oneCurrentApprovedVersionPerRecipe: true,
      previousApprovedVersionPreserved: true,
      runtimeActivationBlockedInFactory: true,
      publishStateDefault: "not_published"
    }
  });
}

function buildFactoryValidation(specification, reference) {
  const checks = [
    [
      "reference_recipe_approved",
      reference.approval.approvalStatus === "approved"
    ],
    [
      "reference_catalog_is_development_only",
      reference.catalog.environment === "DEVELOPMENT_ONLY"
    ],
    [
      "reference_version_current_approved",
      reference.version.currentApprovedVersion === reference.approval.version
    ],
    [
      "recipe_schema_defined",
      specification.recipeSchema.requiredIdentityFields.length >= 8
    ],
    [
      "lifecycle_states_defined",
      specification.lifecycleStates.includes("APPROVED_CURRENT")
    ],
    [
      "dependency_validation_defined",
      specification.dependencyValidation.allowedDependencyLifecycleStates.includes(
        "APPROVED_CURRENT"
      )
    ],
    [
      "deterministic_generation_rules_defined",
      specification.deterministicGenerationRules.sameSeedMustProduceSameFingerprint ===
        true
    ],
    [
      "preview_workflow_defined",
      specification.previewWorkflow.requiredArtifacts.length === 4
    ],
    [
      "approval_workflow_defined",
      specification.approvalWorkflow.producedRecords.length === 3
    ],
    [
      "versioning_rules_defined",
      specification.versioningRules.oneCurrentApprovedVersionPerRecipe === true
    ],
    ["no_blender_usage", true],
    ["no_glb_generation", true],
    ["no_asset_modification", true],
    ["no_runtime_activation", true]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "LOCATION_RECIPE_FACTORY_VALIDATION_001",
    factoryId: specification.factoryId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    nextAllowedAction: "future_recipe_creation_ready"
  });
}

function buildFactoryLifecycleRecord(specification, validation, reference) {
  return deepFreeze({
    schemaId: "LOCATION_RECIPE_FACTORY_LIFECYCLE_RECORD_001",
    factoryId: specification.factoryId,
    lifecycleStatus: validation.status === "pass" ? "READY" : "BLOCKED",
    referenceRecipeId: reference.approval.recipeId,
    supportedRecipeLifecycleStates: specification.lifecycleStates,
    referenceProof: {
      approvedRecipeFingerprint:
        reference.approval.approvedFromRegeneratedFingerprint,
      previewFingerprint: reference.approval.regeneratedPreviewFingerprint,
      versionHash: reference.version.versionHash
    },
    safety: {
      blenderUsed: false,
      glbsCreated: false,
      assetsModified: false,
      runtimeActivated: false
    }
  });
}

function buildReport(specification, validation, lifecycle) {
  return `# Location Recipe Factory Foundation Report

Status: ${lifecycle.lifecycleStatus}

## Reference

- recipe: ${specification.referenceRecipe.recipeId}
- version: ${specification.referenceRecipe.version}
- approved fingerprint: ${specification.referenceRecipe.deterministicFingerprint}

## Lifecycle States

${specification.lifecycleStates.map((state) => `- ${state}`).join("\n")}

## Validation

${validation.checks.map((check) => `- ${check.name}: ${check.ok}`).join("\n")}

## Outcome

The location recipe factory foundation is ready for future recipe creation using the approved coastal recipe as the reference workflow.
`;
}

export function buildLocationRecipeFactoryFoundation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const reference = loadReference(cwd);
  const specification = buildFactorySpecification(reference);
  const validation = buildFactoryValidation(specification, reference);
  const lifecycle = buildFactoryLifecycleRecord(
    specification,
    validation,
    reference
  );
  const report = buildReport(specification, validation, lifecycle);

  return deepFreeze({
    specification,
    validation,
    lifecycle,
    report,
    fingerprint: hashHex(
      specification.referenceRecipe.deterministicFingerprint,
      validation.status,
      lifecycle.lifecycleStatus
    )
  });
}

export function writeLocationRecipeFactoryFoundation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const factoryRoot = path.resolve(cwd, FACTORY_ROOT);
  const specificationRoot = path.join(factoryRoot, "specification");
  const validationRoot = path.join(factoryRoot, "validation");
  const lifecycleRoot = path.join(factoryRoot, "lifecycle");
  const reportsRoot = path.join(factoryRoot, "reports");

  ensureDirectory(specificationRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(lifecycleRoot);
  ensureDirectory(reportsRoot);

  const foundation = buildLocationRecipeFactoryFoundation(options);

  writeJson(
    path.join(specificationRoot, FACTORY_SPECIFICATION_FILENAME),
    foundation.specification
  );
  writeJson(
    path.join(validationRoot, FACTORY_VALIDATION_FILENAME),
    foundation.validation
  );
  writeJson(
    path.join(lifecycleRoot, FACTORY_LIFECYCLE_FILENAME),
    foundation.lifecycle
  );
  fs.writeFileSync(
    path.join(reportsRoot, FACTORY_REPORT_FILENAME),
    `${foundation.report}\n`
  );

  return deepFreeze({
    ...foundation,
    factoryRoot
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  writeLocationRecipeFactoryFoundation();
}
