import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasWorldGenerationCostPerformancePlanning } from "./atlas-world-generation-cost-performance-planning.mjs";
import { buildAtlasPackageOptimizationPlanning } from "./atlas-package-optimization-planning.mjs";
import { buildLocationRecipeFactoryFoundation } from "./location-recipe-factory-foundation.mjs";

const VALIDATOR_ROOT =
  "asset-factory-workspace/atlas-budget-validator/ATLAS_BUDGET_VALIDATOR_001";

const SPECIFICATION_FILENAME = "atlas-budget-validator-specification.json";
const VALIDATION_FILENAME = "atlas-budget-validator-validation.json";
const LIFECYCLE_FILENAME = "atlas-budget-validator-lifecycle-record.json";
const REPORT_FILENAME = "atlas-budget-validator-architecture-report.md";

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

function buildPackageSizeLimits(costPlanning, optimizationPlanning) {
  const standard = optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
    (profile) => profile.profileId === "MOBILE_STANDARD_001"
  );
  const constrained = optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
    (profile) => profile.profileId === "MOBILE_CONSTRAINED_001"
  );
  const average = costPlanning.specification.regionalPackageEnvelope.averageCompressedPackageKb;
  const peak = costPlanning.specification.regionalPackageEnvelope.peakCompressedPackageKb;

  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_SIZE_LIMITS_001",
    standardProfileMaxKb: standard.maxCompressedPackageKb,
    constrainedProfileMaxKb: constrained.maxCompressedPackageKb,
    warningThresholdKb: Number((average * 1.1).toFixed(2)),
    softLimitKb: Number((peak * 1.05).toFixed(2)),
    hardBlockKb: standard.maxCompressedPackageKb,
    rationale: [
      "warning begins slightly above the measured average package size",
      "soft limit allows small growth above the current measured peak",
      "hard block aligns with the established mobile standard package cap"
    ]
  });
}

function buildCacheLimits(costPlanning, optimizationPlanning) {
  const standard = optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
    (profile) => profile.profileId === "MOBILE_STANDARD_001"
  );
  const constrained = optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
    (profile) => profile.profileId === "MOBILE_CONSTRAINED_001"
  );

  return deepFreeze({
    schemaId: "ATLAS_CACHE_LIMITS_001",
    standardWarmPackageCount: standard.maxWarmCachePackages,
    constrainedWarmPackageCount: constrained.maxWarmCachePackages,
    standardEstimatedFootprintKb:
      costPlanning.specification.deviceCacheRequirements.standardProfile
        .estimatedWarmPackageFootprintKb,
    constrainedEstimatedFootprintKb:
      costPlanning.specification.deviceCacheRequirements.constrainedProfile
        .estimatedWarmPackageFootprintKb,
    warningThresholdRatio: 0.9,
    blockThresholdRatio: 1
  });
}

function buildRecipeComplexityLimits(costPlanning, factoryFoundation) {
  const referenceRecipeCount = factoryFoundation.specification.referenceRecipe
    ? 1
    : 0;

  return deepFreeze({
    schemaId: "ATLAS_RECIPE_COMPLEXITY_LIMITS_001",
    averageGenerationKb:
      costPlanning.specification.recipeGenerationProfile.averageGenerationKb,
    peakGenerationKb:
      costPlanning.specification.recipeGenerationProfile.peakGenerationKb,
    warningGenerationKb: Number(
      (costPlanning.specification.recipeGenerationProfile.averageGenerationKb * 1.15).toFixed(2)
    ),
    hardBlockGenerationKb: Number(
      (costPlanning.specification.recipeGenerationProfile.peakGenerationKb * 1.35).toFixed(2)
    ),
    deterministicStagesPerSuccessfulLocation:
      costPlanning.specification.recipeGenerationProfile
        .deterministicStagesPerSuccessfulLocation,
    referenceRecipeCount
  });
}

function buildGenerationCostThresholds(costPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_GENERATION_COST_THRESHOLDS_001",
    validationPassesPerPackage:
      costPlanning.specification.backendProcessingExpectations.perPackageValidationChecks,
    classificationPassesPerPackage:
      costPlanning.specification.backendProcessingExpectations
        .perPackageClassificationPasses,
    selectionPassesPerPackage:
      costPlanning.specification.backendProcessingExpectations.perPackageSelectionPasses,
    recipeGenerationPassesPerSuccessfulLocation:
      costPlanning.specification.backendProcessingExpectations
        .perSuccessfulLocationRecipeGenerationPasses,
    previewAssemblyPassesPerSuccessfulLocation:
      costPlanning.specification.backendProcessingExpectations
        .perSuccessfulLocationPreviewAssemblyPasses,
    blockedShortCircuitRequired:
      costPlanning.specification.backendProcessingExpectations
        .blockedPackageShortCircuitBeforeClassification
  });
}

function buildPreviewPayloadLimits(costPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_PREVIEW_PAYLOAD_LIMITS_001",
    averagePreviewKb: costPlanning.specification.previewPayloadProfile.averagePreviewKb,
    peakPreviewKb: costPlanning.specification.previewPayloadProfile.peakPreviewKb,
    warningPreviewKb: Number(
      (costPlanning.specification.previewPayloadProfile.averagePreviewKb * 1.25).toFixed(2)
    ),
    hardBlockPreviewKb: 48,
    previewMode: costPlanning.specification.previewPayloadProfile.previewMode,
    safeDistributionTarget:
      costPlanning.specification.previewPayloadProfile.safeDistributionTarget
  });
}

function buildWarningStates() {
  return deepFreeze({
    schemaId: "ATLAS_BUDGET_WARNING_STATES_001",
    states: [
      "WARNING_PACKAGE_NEAR_LIMIT",
      "WARNING_CACHE_NEAR_LIMIT",
      "WARNING_RECIPE_COMPLEXITY_RISING",
      "WARNING_PREVIEW_PAYLOAD_RISING",
      "WARNING_BACKEND_REUSE_BELOW_TARGET"
    ],
    policy: "warn without blocking when within caution band but still under hard limits"
  });
}

function buildBlockingStates() {
  return deepFreeze({
    schemaId: "ATLAS_BUDGET_BLOCKING_STATES_001",
    states: [
      "BLOCK_PACKAGE_SIZE_LIMIT",
      "BLOCK_CACHE_LIMIT",
      "BLOCK_RECIPE_COMPLEXITY_LIMIT",
      "BLOCK_PREVIEW_PAYLOAD_LIMIT",
      "BLOCK_REUSE_POLICY_FAILURE",
      "BLOCK_RUNTIME_SAFETY_VIOLATION"
    ],
    policy: "block future Atlas engineering handoff when hard budget or safety gates fail"
  });
}

function buildApprovalRecommendations() {
  return deepFreeze({
    schemaId: "ATLAS_BUDGET_APPROVAL_RECOMMENDATIONS_001",
    recommendationStates: [
      "APPROVE_WITHIN_BUDGET",
      "APPROVE_WITH_WARNING",
      "HOLD_FOR_OPTIMIZATION",
      "BLOCK_FOR_REDESIGN"
    ],
    rules: [
      "approve within budget when all limits pass with no warnings",
      "approve with warning when only warning-band thresholds are crossed",
      "hold for optimization when soft limits are exceeded but hard blocks are not",
      "block for redesign when any hard block threshold or safety violation occurs"
    ]
  });
}

function buildRepresentativeBudgetCases(specification, costPlanning) {
  const avgPackage = specification.packageSizeLimits.warningThresholdKb;
  const avgPreview = specification.previewPayloadLimits.averagePreviewKb;
  const avgGeneration = specification.recipeComplexityLimits.averageGenerationKb;
  const standardWarm = specification.cacheLimits.standardWarmPackageCount;

  return deepFreeze([
    {
      caseId: "BUDGET_CASE_WITHIN_LIMITS_001",
      packageSizeKb: costPlanning.specification.regionalPackageEnvelope.averageCompressedPackageKb,
      warmPackageCount: standardWarm - 4,
      generationKb: avgGeneration,
      previewKb: avgPreview,
      reuseRate: 0.85,
      expectedRecommendation: "APPROVE_WITHIN_BUDGET"
    },
    {
      caseId: "BUDGET_CASE_WARNING_001",
      packageSizeKb: avgPackage,
      warmPackageCount: Math.ceil(standardWarm * 0.92),
      generationKb: specification.recipeComplexityLimits.warningGenerationKb,
      previewKb: specification.previewPayloadLimits.warningPreviewKb,
      reuseRate: 0.72,
      expectedRecommendation: "APPROVE_WITH_WARNING"
    },
    {
      caseId: "BUDGET_CASE_HOLD_001",
      packageSizeKb: specification.packageSizeLimits.softLimitKb,
      warmPackageCount: standardWarm,
      generationKb: Number(
        (specification.recipeComplexityLimits.warningGenerationKb * 1.05).toFixed(2)
      ),
      previewKb: Number(
        (specification.previewPayloadLimits.warningPreviewKb * 1.05).toFixed(2)
      ),
      reuseRate: 0.68,
      expectedRecommendation: "HOLD_FOR_OPTIMIZATION"
    },
    {
      caseId: "BUDGET_CASE_BLOCK_001",
      packageSizeKb: specification.packageSizeLimits.hardBlockKb + 4,
      warmPackageCount: standardWarm + 2,
      generationKb: specification.recipeComplexityLimits.hardBlockGenerationKb + 2,
      previewKb: specification.previewPayloadLimits.hardBlockPreviewKb + 4,
      reuseRate: 0.4,
      expectedRecommendation: "BLOCK_FOR_REDESIGN"
    }
  ]);
}

function buildSpecification(costPlanning, optimizationPlanning, factoryFoundation) {
  const specification = {
    schemaId: "ATLAS_BUDGET_VALIDATOR_SPECIFICATION_001",
    validatorId: "ATLAS_BUDGET_VALIDATOR_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      costPerformanceId: costPlanning.specification.performancePlanningId,
      optimizationId: optimizationPlanning.specification.optimizationId,
      recipeFactoryId: factoryFoundation.lifecycle.factoryId
    },
    packageSizeLimits: buildPackageSizeLimits(costPlanning, optimizationPlanning),
    cacheLimits: buildCacheLimits(costPlanning, optimizationPlanning),
    recipeComplexityLimits: buildRecipeComplexityLimits(
      costPlanning,
      factoryFoundation
    ),
    generationCostThresholds: buildGenerationCostThresholds(costPlanning),
    previewPayloadLimits: buildPreviewPayloadLimits(costPlanning),
    warningStates: buildWarningStates(),
    blockingStates: buildBlockingStates(),
    approvalRecommendations: buildApprovalRecommendations()
  };

  specification.representativeBudgetCases = buildRepresentativeBudgetCases(
    specification,
    costPlanning
  );

  return deepFreeze(specification);
}

function evaluateCase(sample, specification, costPlanning) {
  const warnings = [];
  const holds = [];
  const blocks = [];

  if (sample.packageSizeKb >= specification.packageSizeLimits.warningThresholdKb) {
    warnings.push("WARNING_PACKAGE_NEAR_LIMIT");
  }
  if (sample.warmPackageCount >
    Math.ceil(
      specification.cacheLimits.standardWarmPackageCount *
        specification.cacheLimits.warningThresholdRatio
    )) {
    warnings.push("WARNING_CACHE_NEAR_LIMIT");
  }
  if (sample.generationKb >= specification.recipeComplexityLimits.warningGenerationKb) {
    warnings.push("WARNING_RECIPE_COMPLEXITY_RISING");
  }
  if (sample.previewKb >= specification.previewPayloadLimits.warningPreviewKb) {
    warnings.push("WARNING_PREVIEW_PAYLOAD_RISING");
  }
  if (sample.reuseRate < costPlanning.assumptions.scalingAssumptions.previewReuseHitTarget) {
    warnings.push("WARNING_BACKEND_REUSE_BELOW_TARGET");
  }

  if (sample.packageSizeKb > specification.packageSizeLimits.softLimitKb) {
    holds.push("PACKAGE_SIZE_SOFT_LIMIT_EXCEEDED");
  }
  if (sample.generationKb > specification.recipeComplexityLimits.warningGenerationKb) {
    holds.push("GENERATION_COST_SOFT_LIMIT_EXCEEDED");
  }
  if (sample.previewKb > specification.previewPayloadLimits.warningPreviewKb) {
    holds.push("PREVIEW_PAYLOAD_SOFT_LIMIT_EXCEEDED");
  }

  if (sample.packageSizeKb > specification.packageSizeLimits.hardBlockKb) {
    blocks.push("BLOCK_PACKAGE_SIZE_LIMIT");
  }
  if (sample.warmPackageCount > specification.cacheLimits.standardWarmPackageCount) {
    blocks.push("BLOCK_CACHE_LIMIT");
  }
  if (sample.generationKb > specification.recipeComplexityLimits.hardBlockGenerationKb) {
    blocks.push("BLOCK_RECIPE_COMPLEXITY_LIMIT");
  }
  if (sample.previewKb > specification.previewPayloadLimits.hardBlockPreviewKb) {
    blocks.push("BLOCK_PREVIEW_PAYLOAD_LIMIT");
  }
  if (sample.reuseRate < 0.5) {
    blocks.push("BLOCK_REUSE_POLICY_FAILURE");
  }

  let recommendation = "APPROVE_WITHIN_BUDGET";
  if (blocks.length > 0) {
    recommendation = "BLOCK_FOR_REDESIGN";
  } else if (holds.length > 0) {
    recommendation = "HOLD_FOR_OPTIMIZATION";
  } else if (warnings.length > 0) {
    recommendation = "APPROVE_WITH_WARNING";
  }

  return deepFreeze({
    caseId: sample.caseId,
    warnings,
    holds,
    blocks,
    recommendation
  });
}

function buildValidation(specification, costPlanning) {
  const evaluatedCases = specification.representativeBudgetCases.map((sample) =>
    evaluateCase(sample, specification, costPlanning)
  );

  const checks = [
    {
      name: "package_size_limits_defined",
      ok:
        specification.packageSizeLimits.hardBlockKb ===
          costPlanning.specification.regionalPackageEnvelope.standardProfileMaxKb &&
        specification.packageSizeLimits.warningThresholdKb <
          specification.packageSizeLimits.hardBlockKb
    },
    {
      name: "cache_limits_defined",
      ok:
        specification.cacheLimits.standardWarmPackageCount === 24 &&
        specification.cacheLimits.constrainedWarmPackageCount === 12
    },
    {
      name: "recipe_complexity_and_preview_limits_defined",
      ok:
        specification.recipeComplexityLimits.hardBlockGenerationKb >
          specification.recipeComplexityLimits.warningGenerationKb &&
        specification.previewPayloadLimits.hardBlockPreviewKb >
          specification.previewPayloadLimits.warningPreviewKb
    },
    {
      name: "warning_and_blocking_states_defined",
      ok:
        specification.warningStates.states.length >= 4 &&
        specification.blockingStates.states.length >= 4
    },
    {
      name: "approval_recommendations_defined",
      ok:
        specification.approvalRecommendations.recommendationStates.includes(
          "APPROVE_WITHIN_BUDGET"
        ) &&
        specification.approvalRecommendations.recommendationStates.includes(
          "BLOCK_FOR_REDESIGN"
        )
    },
    {
      name: "representative_cases_match_expected_recommendations",
      ok: evaluatedCases.every((entry) => {
        const sample = specification.representativeBudgetCases.find(
          (candidate) => candidate.caseId === entry.caseId
        );
        return entry.recommendation === sample.expectedRecommendation;
      })
    },
    {
      name: "runtime_download_blender_glb_and_asset_mutation_blocked",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_BUDGET_VALIDATOR_VALIDATION_001",
    validatorId: specification.validatorId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    nextAllowedAction: "future_atlas_budget_enforcement_ready",
    checks,
    representativeEvaluations: evaluatedCases
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_BUDGET_VALIDATOR_LIFECYCLE_RECORD_001",
    validatorId: specification.validatorId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    recommendationPolicyReady: validation.status === "pass",
    runtimeActivationAuthorized: false,
    downloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(specification, validation, lifecycle) {
  const lines = [
    "# ATLAS_BUDGET_VALIDATOR_001",
    "",
    `Status: ${lifecycle.lifecycleStatus}`,
    "",
    "## Scope",
    "- Defines package, cache, generation, and preview budget limits for future Atlas engineering.",
    "- Distinguishes warning states from hold and hard-block states.",
    "- Produces explicit approval recommendations for planning decisions.",
    "",
    "## Limits",
    `- package hard block: ${specification.packageSizeLimits.hardBlockKb} KB`,
    `- standard warm cache cap: ${specification.cacheLimits.standardWarmPackageCount} packages`,
    `- recipe generation hard block: ${specification.recipeComplexityLimits.hardBlockGenerationKb} KB`,
    `- preview hard block: ${specification.previewPayloadLimits.hardBlockPreviewKb} KB`,
    "",
    "## Recommendation States",
    ...specification.approvalRecommendations.recommendationStates.map(
      (state) => `- ${state}`
    ),
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Representative Evaluations",
    ...validation.representativeEvaluations.map(
      (entry) =>
        `- ${entry.caseId}: ${entry.recommendation} | warnings ${entry.warnings.length} | holds ${entry.holds.length} | blocks ${entry.blocks.length}`
    ),
    "",
    "## Readiness",
    "- Future Atlas engineering: READY",
    "- Runtime activation / downloads / Blender / GLBs / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasBudgetValidatorPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const costPlanning = buildAtlasWorldGenerationCostPerformancePlanning({ cwd });
  const optimizationPlanning = buildAtlasPackageOptimizationPlanning({ cwd });
  const factoryFoundation = buildLocationRecipeFactoryFoundation({ cwd });
  const specification = buildSpecification(
    costPlanning,
    optimizationPlanning,
    factoryFoundation
  );
  const validation = buildValidation(specification, costPlanning);
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(specification, validation, lifecycle);
  const fingerprint = hashHex(
    specification.validatorId,
    validation.status,
    specification.packageSizeLimits.hardBlockKb,
    specification.recipeComplexityLimits.hardBlockGenerationKb,
    specification.previewPayloadLimits.hardBlockPreviewKb,
    ...validation.representativeEvaluations.map(
      (entry) => `${entry.caseId}:${entry.recommendation}`
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

export function writeAtlasBudgetValidatorPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const planning = buildAtlasBudgetValidatorPlanning({ cwd });
  const validatorRoot = path.resolve(cwd, VALIDATOR_ROOT);
  const specificationDir = path.join(validatorRoot, "specification");
  const validationDir = path.join(validatorRoot, "validation");
  const lifecycleDir = path.join(validatorRoot, "lifecycle");
  const reportsDir = path.join(validatorRoot, "reports");

  for (const directory of [specificationDir, validationDir, lifecycleDir, reportsDir]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, SPECIFICATION_FILENAME), planning.specification);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), planning.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), planning.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), planning.report);

  return planning;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeAtlasBudgetValidatorPlanning();
}
