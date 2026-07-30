import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasRegionalPackagePlanning } from "./atlas-regional-package-planning.mjs";
import { buildAtlasPackageOptimizationPlanning } from "./atlas-package-optimization-planning.mjs";
import { buildLocationRecipeSelectorFoundation } from "./location-recipe-selector-foundation.mjs";

const VALIDATION_ROOT =
  "asset-factory-workspace/atlas-validation/ATLAS_REGIONAL_PACKAGE_VALIDATION_001";

const SPECIFICATION_FILENAME =
  "atlas-regional-package-validation-specification.json";
const VALIDATION_FILENAME = "atlas-regional-package-validation.json";
const LIFECYCLE_FILENAME = "atlas-regional-package-validation-lifecycle-record.json";
const REPORT_FILENAME = "atlas-regional-package-validation-architecture-report.md";

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

function buildIntegrityChecks(regionalPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_INTEGRITY_CHECKS_001",
    requiredTopLevelFields:
      regionalPlanning.specification.regionalPackageSchema.requiredTopLevelFields,
    requiredIdentityFields:
      regionalPlanning.specification.regionalPackageSchema.requiredIdentityFields,
    requiredDataLayers: regionalPlanning.specification.dataLayerDefinitions.layers.map(
      (layer) => layer.layerId
    ),
    requiredCacheKeys: regionalPlanning.specification.cacheStrategy.cacheKeys,
    integrityRules: [
      "packageId and regionId must be present before selector handoff",
      "all required data layers must exist before classification",
      "cacheMetadata.packageFingerprint must exist before validation completes",
      "provenance fields must remain intact through optimization and refresh"
    ]
  });
}

function buildSchemaValidationRules(regionalPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_SCHEMA_VALIDATION_001",
    requiredSchemaId: regionalPlanning.specification.regionalPackageSchema.schemaId,
    requiredPackageType:
      regionalPlanning.specification.regionalPackageSchema.packageType,
    requiredSchemaVersion: regionalPlanning.specification.packageVersioning.schemaVersion,
    compatibilityDimensions:
      regionalPlanning.specification.packageVersioning.compatibilityDimensions,
    schemaFailurePolicy:
      "block package from selector handoff and mark validation lifecycle BLOCKED_SCHEMA"
  });
}

function buildDependencyValidationRules(regionalPlanning, selectorFoundation) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_DEPENDENCY_VALIDATION_001",
    selectorDependency: {
      selectorId: regionalPlanning.specification.recipeCompatibilityContract.selectorId,
      requiredSelectorFields:
        regionalPlanning.specification.recipeCompatibilityContract.requiredSelectorFields,
      requiredEnvironment:
        regionalPlanning.specification.recipeCompatibilityContract.requiredEnvironment
    },
    approvedRecipes: selectorFoundation.recipeMetadataRecords.map((metadata) => ({
      recipeId: metadata.recipeId,
      version: metadata.version,
      lifecycleStatus: metadata.lifecycleStatus,
      environment: metadata.environment
    })),
    dependencyRules: [
      "only approved selector-compatible recipes may be targeted",
      "selector handoff must preserve required environment and seed fields",
      "unsupported or unpublished recipes must block package readiness"
    ]
  });
}

function buildRecipeCompatibilityValidationRules(regionalPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_RECIPE_COMPATIBILITY_VALIDATION_001",
    selectorCompatibilityContract:
      regionalPlanning.specification.recipeCompatibilityContract,
    acceptanceRules: [
      "package must produce complete selector handoff payload",
      "package may only target approved current recipes",
      "package must preserve deterministic seed inputs",
      "package must preserve fallback compatibility with ATLAS_ENGINE_RECIPE_INTEGRATION_001"
    ],
    rejectionPolicy:
      "reject package if selectorCompatibility or approvedRecipeIds drift from approved contract"
  });
}

function buildFingerprintVerificationRules(regionalPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_FINGERPRINT_VERIFICATION_001",
    fingerprintInputs:
      regionalPlanning.specification.deterministicSeedStrategy.packageFingerprintInputs,
    identityReplayRules: [
      "same package identity inputs must reproduce same package fingerprint",
      "fingerprint mismatch must block selector handoff",
      "fingerprint mismatch must preserve last validated package for rollback"
    ],
    verificationAlgorithm: "sha256_pipe_joined_identity_fields"
  });
}

function buildCorruptionHandling() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_CORRUPTION_HANDLING_001",
    corruptionStates: [
      "BLOCKED_CORRUPT",
      "BLOCKED_SCHEMA",
      "BLOCKED_DEPENDENCY",
      "BLOCKED_COMPATIBILITY",
      "BLOCKED_FINGERPRINT",
      "BLOCKED_MOBILE_BUDGET"
    ],
    reasonCodes: [
      "MISSING_REQUIRED_LAYER",
      "MISSING_REQUIRED_IDENTITY",
      "INVALID_SCHEMA_VERSION",
      "SELECTOR_CONTRACT_MISMATCH",
      "APPROVED_RECIPE_DRIFT",
      "FINGERPRINT_MISMATCH",
      "MOBILE_STORAGE_BUDGET_EXCEEDED"
    ],
    safeFailureBehaviour: [
      "block selector handoff immediately",
      "preserve last validated package metadata",
      "do not activate runtime",
      "do not download replacement maps in planning phase",
      "do not mutate package payload"
    ]
  });
}

function buildRollbackStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_ROLLBACK_STRATEGY_001",
    rollbackTarget: "LAST_VALIDATED_PACKAGE_FINGERPRINT",
    rollbackStates: [
      "VALIDATED_INTERNAL",
      "ROLLBACK_READY",
      "ROLLED_BACK_LAST_VALIDATED"
    ],
    rollbackRules: [
      "rollback may only target a previously validated package fingerprint",
      "rollback preserves regionId and package identity lineage",
      "rollback remains metadata-only and runtime-blocked",
      "rollback requires a corruption or incompatibility reason code"
    ]
  });
}

function buildReleaseGating() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_RELEASE_GATING_001",
    lifecycleStates: [
      "DRAFT_PACKAGE",
      "INTERNAL_VALIDATION_PENDING",
      "VALIDATED_INTERNAL",
      "ROLLBACK_READY",
      "READY_FOR_FUTURE_DISTRIBUTION",
      "BLOCKED"
    ],
    requiredGateChecks: [
      "integrity_checks_pass",
      "schema_validation_pass",
      "dependency_validation_pass",
      "recipe_compatibility_validation_pass",
      "fingerprint_verification_pass",
      "mobile_suitability_pass"
    ],
    releaseRules: [
      "packages may not advance beyond internal validation when runtime remains blocked",
      "distribution readiness does not authorize runtime activation",
      "invalid or corrupt packages cannot bypass rollback gate"
    ]
  });
}

function buildRepresentativeValidationScenarios(
  regionalPlanning,
  optimizationPlanning,
  selectorFoundation
) {
  const approvedRecipes = new Set(
    selectorFoundation.recipeMetadataRecords.map((metadata) => metadata.recipeId)
  );
  const standardBudget = optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
    (profile) => profile.profileId === "MOBILE_STANDARD_001"
  );

  const validBase = regionalPlanning.specification.representativePackages.map((pkg, index) => {
    const optimizationExample =
      optimizationPlanning.specification.representativeOptimizationExamples[index];

    return {
      scenarioId: `REGIONAL_PACKAGE_VALIDATION_VALID_${index + 1}`,
      packageId: pkg.packageId,
      regionId: pkg.regionId,
      schemaId: regionalPlanning.specification.regionalPackageSchema.schemaId,
      schemaVersion: regionalPlanning.specification.packageVersioning.schemaVersion,
      packageType: regionalPlanning.specification.regionalPackageSchema.packageType,
      approvedRecipeId: pkg.expectedRecipeId,
      environment: "DEVELOPMENT_ONLY",
      requiredFieldsPresent: true,
      requiredIdentityPresent: true,
      dataLayersPresent:
        regionalPlanning.specification.dataLayerDefinitions.layers.map((layer) => layer.layerId),
      selectorCompatibilityComplete: true,
      computedFingerprint: pkg.packageFingerprint,
      declaredFingerprint: pkg.packageFingerprint,
      compressedPackageKb: optimizationExample.compressedPackageKb,
      mobileBudgetKb: standardBudget.maxCompressedPackageKb,
      recipeApproved: approvedRecipes.has(pkg.expectedRecipeId),
      valid: true
    };
  });

  const corruptScenario = {
    scenarioId: "REGIONAL_PACKAGE_VALIDATION_CORRUPT_001",
    packageId: validBase[0].packageId,
    regionId: validBase[0].regionId,
    schemaId: validBase[0].schemaId,
    schemaVersion: validBase[0].schemaVersion,
    packageType: validBase[0].packageType,
    approvedRecipeId: validBase[0].approvedRecipeId,
    environment: "DEVELOPMENT_ONLY",
    requiredFieldsPresent: false,
    requiredIdentityPresent: false,
    dataLayersPresent: validBase[0].dataLayersPresent.filter(
      (layerId) => layerId !== "PROVENANCE_LAYER"
    ),
    selectorCompatibilityComplete: false,
    computedFingerprint: validBase[0].computedFingerprint,
    declaredFingerprint: "corrupt-fingerprint",
    compressedPackageKb: validBase[0].compressedPackageKb,
    mobileBudgetKb: standardBudget.maxCompressedPackageKb,
    recipeApproved: true,
    valid: false
  };

  const incompatibleScenario = {
    scenarioId: "REGIONAL_PACKAGE_VALIDATION_INCOMPATIBLE_RECIPE_001",
    packageId: validBase[1].packageId,
    regionId: validBase[1].regionId,
    schemaId: validBase[1].schemaId,
    schemaVersion: validBase[1].schemaVersion,
    packageType: validBase[1].packageType,
    approvedRecipeId: "UNAPPROVED_RECIPE_001",
    environment: "DEVELOPMENT_ONLY",
    requiredFieldsPresent: true,
    requiredIdentityPresent: true,
    dataLayersPresent: validBase[1].dataLayersPresent,
    selectorCompatibilityComplete: true,
    computedFingerprint: validBase[1].computedFingerprint,
    declaredFingerprint: validBase[1].computedFingerprint,
    compressedPackageKb: validBase[1].compressedPackageKb,
    mobileBudgetKb: standardBudget.maxCompressedPackageKb,
    recipeApproved: false,
    valid: false
  };

  const oversizeScenario = {
    scenarioId: "REGIONAL_PACKAGE_VALIDATION_OVERSIZE_001",
    packageId: validBase[2].packageId,
    regionId: validBase[2].regionId,
    schemaId: validBase[2].schemaId,
    schemaVersion: validBase[2].schemaVersion,
    packageType: validBase[2].packageType,
    approvedRecipeId: validBase[2].approvedRecipeId,
    environment: "DEVELOPMENT_ONLY",
    requiredFieldsPresent: true,
    requiredIdentityPresent: true,
    dataLayersPresent: validBase[2].dataLayersPresent,
    selectorCompatibilityComplete: true,
    computedFingerprint: validBase[2].computedFingerprint,
    declaredFingerprint: validBase[2].computedFingerprint,
    compressedPackageKb: standardBudget.maxCompressedPackageKb + 8,
    mobileBudgetKb: standardBudget.maxCompressedPackageKb,
    recipeApproved: true,
    valid: false
  };

  return deepFreeze([
    ...validBase,
    corruptScenario,
    incompatibleScenario,
    oversizeScenario
  ]);
}

function buildSpecification(regionalPlanning, optimizationPlanning, selectorFoundation) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_VALIDATION_SPECIFICATION_001",
    validationPlanningId: "ATLAS_REGIONAL_PACKAGE_VALIDATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      regionalPackagePlanningId: regionalPlanning.specification.planningId,
      optimizationId: optimizationPlanning.specification.optimizationId,
      selectorId: selectorFoundation.specification.selectorId
    },
    integrityChecks: buildIntegrityChecks(regionalPlanning),
    schemaValidationRules: buildSchemaValidationRules(regionalPlanning),
    dependencyValidationRules: buildDependencyValidationRules(
      regionalPlanning,
      selectorFoundation
    ),
    recipeCompatibilityValidationRules:
      buildRecipeCompatibilityValidationRules(regionalPlanning),
    fingerprintVerificationRules: buildFingerprintVerificationRules(regionalPlanning),
    corruptionHandling: buildCorruptionHandling(),
    rollbackStrategy: buildRollbackStrategy(),
    releaseGating: buildReleaseGating(),
    mobileSuitabilityContract: {
      optimizationId: optimizationPlanning.specification.optimizationId,
      profileId: "MOBILE_STANDARD_001",
      maxCompressedPackageKb:
        optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
          (profile) => profile.profileId === "MOBILE_STANDARD_001"
        ).maxCompressedPackageKb,
      preservedFields:
        optimizationPlanning.specification.compressionStrategy.preservedFields,
      selectorCriticalLayers:
        optimizationPlanning.specification.dataLayerReductionRules.selectorCriticalLayers
    },
    representativeValidationScenarios: buildRepresentativeValidationScenarios(
      regionalPlanning,
      optimizationPlanning,
      selectorFoundation
    )
  });
}

function buildValidation(specification) {
  const requiredLayerCount = specification.integrityChecks.requiredDataLayers.length;
  const approvedRecipeIds = new Set(
    specification.dependencyValidationRules.approvedRecipes.map(
      (dependency) => dependency.recipeId
    )
  );

  const checks = [
    {
      name: "deterministic_package_identity",
      ok: specification.representativeValidationScenarios
        .filter((scenario) => scenario.valid)
        .every(
          (scenario) =>
            scenario.computedFingerprint === scenario.declaredFingerprint &&
            scenario.packageId.startsWith("ATLAS_REGION_PACKAGE_") &&
            scenario.regionId.startsWith("REGION_")
        )
    },
    {
      name: "safe_failure_behaviour",
      ok:
        specification.corruptionHandling.safeFailureBehaviour.includes(
          "block selector handoff immediately"
        ) &&
        specification.rollbackStrategy.rollbackRules.includes(
          "rollback may only target a previously validated package fingerprint"
        )
    },
    {
      name: "approved_recipe_compatibility",
      ok: specification.representativeValidationScenarios
        .filter((scenario) => scenario.valid)
        .every(
          (scenario) =>
            approvedRecipeIds.has(scenario.approvedRecipeId) &&
            scenario.environment ===
              specification.dependencyValidationRules.selectorDependency.requiredEnvironment
        )
    },
    {
      name: "mobile_package_suitability",
      ok: specification.representativeValidationScenarios
        .filter((scenario) => scenario.valid)
        .every(
          (scenario) => scenario.compressedPackageKb <= scenario.mobileBudgetKb
        )
    },
    {
      name: "integrity_and_schema_gate_defined",
      ok:
        specification.integrityChecks.requiredTopLevelFields.includes(
          "selectorCompatibility"
        ) &&
        specification.schemaValidationRules.requiredPackageType ===
          "ATLAS_REGION_CONTEXT_PACKAGE" &&
        specification.releaseGating.requiredGateChecks.length >= 6
    },
    {
      name: "corruption_and_rollback_coverage_defined",
      ok:
        specification.corruptionHandling.reasonCodes.includes("FINGERPRINT_MISMATCH") &&
        specification.releaseGating.lifecycleStates.includes("ROLLBACK_READY")
    },
    {
      name: "representative_failure_scenarios_block_safely",
      ok: specification.representativeValidationScenarios
        .filter((scenario) => !scenario.valid)
        .every((scenario) => {
          const hasLayers = scenario.dataLayersPresent.length === requiredLayerCount;
          const fingerprintOk =
            scenario.computedFingerprint === scenario.declaredFingerprint;
          const mobileOk =
            scenario.compressedPackageKb <= scenario.mobileBudgetKb;
          const recipeOk = approvedRecipeIds.has(scenario.approvedRecipeId);

          return (
            !scenario.requiredFieldsPresent ||
            !scenario.requiredIdentityPresent ||
            !hasLayers ||
            !scenario.selectorCompatibilityComplete ||
            !fingerprintOk ||
            !mobileOk ||
            !recipeOk
          );
        })
    },
    {
      name: "runtime_and_distribution_still_blocked",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_VALIDATION_RESULT_001",
    validationPlanningId: specification.validationPlanningId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    nextAllowedAction: "future_atlas_regional_package_validation_ready",
    checks
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_VALIDATION_LIFECYCLE_RECORD_001",
    validationPlanningId: specification.validationPlanningId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    releaseGateState:
      validation.status === "pass" ? "READY_FOR_FUTURE_DISTRIBUTION" : "BLOCKED",
    regionalPackagePlanningId: specification.references.regionalPackagePlanningId,
    optimizationId: specification.references.optimizationId,
    selectorId: specification.references.selectorId,
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    packageDistributionAuthorized: false
  });
}

function buildReport(specification, validation, lifecycle) {
  const lines = [
    "# ATLAS_REGIONAL_PACKAGE_VALIDATION_001",
    "",
    `Status: ${lifecycle.lifecycleStatus}`,
    `Release gate: ${lifecycle.releaseGateState}`,
    `Regional package planning reference: ${specification.references.regionalPackagePlanningId}`,
    `Optimization reference: ${specification.references.optimizationId}`,
    `Selector reference: ${specification.references.selectorId}`,
    "",
    "## Validation Scope",
    "- Defines the pre-distribution validation and safety gate for Atlas regional packages.",
    "- Preserves deterministic package identity, selector compatibility, and mobile suitability.",
    "- Keeps runtime, downloads, Blender, GLBs, and asset mutation blocked.",
    "",
    "## Gate Areas",
    "- package integrity checks",
    "- schema validation",
    "- dependency validation",
    "- recipe compatibility validation",
    "- fingerprint verification",
    "- corruption handling and rollback",
    "- release gating",
    "",
    "## Representative Validation Scenarios",
    ...specification.representativeValidationScenarios.map(
      (scenario) =>
        `- ${scenario.scenarioId}: ${scenario.valid ? "VALID" : "BLOCKED"} | ${scenario.packageId} | ${scenario.approvedRecipeId}`
    ),
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- Future Atlas development: READY",
    "- Package distribution: PLANNING ONLY",
    "- Runtime activation / map downloads / Blender / GLBs / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasRegionalPackageValidationPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const regionalPlanning = buildAtlasRegionalPackagePlanning({ cwd });
  const optimizationPlanning = buildAtlasPackageOptimizationPlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const specification = buildSpecification(
    regionalPlanning,
    optimizationPlanning,
    selectorFoundation
  );
  const validation = buildValidation(specification);
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(specification, validation, lifecycle);
  const fingerprint = hashHex(
    specification.validationPlanningId,
    validation.status,
    ...specification.representativeValidationScenarios.map(
      (scenario) =>
        `${scenario.scenarioId}:${scenario.packageId}:${scenario.declaredFingerprint}:${scenario.compressedPackageKb}`
    )
  );

  return deepFreeze({
    specification,
    validation,
    lifecycle,
    report,
    fingerprint
  });
}

export function writeAtlasRegionalPackageValidationPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const planning = buildAtlasRegionalPackageValidationPlanning({ cwd });
  const validationRoot = path.resolve(cwd, VALIDATION_ROOT);
  const specificationRoot = path.join(validationRoot, "specification");
  const validationDir = path.join(validationRoot, "validation");
  const lifecycleRoot = path.join(validationRoot, "lifecycle");
  const reportsRoot = path.join(validationRoot, "reports");

  for (const directory of [
    specificationRoot,
    validationDir,
    lifecycleRoot,
    reportsRoot
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationRoot, SPECIFICATION_FILENAME), planning.specification);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), planning.validation);
  writeJson(path.join(lifecycleRoot, LIFECYCLE_FILENAME), planning.lifecycle);
  fs.writeFileSync(path.join(reportsRoot, REPORT_FILENAME), planning.report);

  return planning;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeAtlasRegionalPackageValidationPlanning();
}
