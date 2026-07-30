import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasBudgetValidatorPlanning } from "./atlas-budget-validator-planning.mjs";
import { buildAtlasRegionalPackageValidationPlanning } from "./atlas-regional-package-validation-planning.mjs";
import { buildLocationRecipeSelectorFoundation } from "./location-recipe-selector-foundation.mjs";
import { buildLocationRecipeFactoryFoundation } from "./location-recipe-factory-foundation.mjs";
import { buildAtlasWorldGenerationCostPerformancePlanning } from "./atlas-world-generation-cost-performance-planning.mjs";
import { buildAtlasFullPipelineSimulation } from "./atlas-full-pipeline-simulation.mjs";

const MONITORING_ROOT =
  "asset-factory-workspace/atlas-monitoring/ATLAS_ADMIN_MONITORING_001";

const SPECIFICATION_FILENAME = "atlas-admin-monitoring-specification.json";
const DATA_MODEL_FILENAME = "atlas-admin-monitoring-data-model.json";
const VALIDATION_FILENAME = "atlas-admin-monitoring-validation.json";
const LIFECYCLE_FILENAME = "atlas-admin-monitoring-lifecycle-record.json";
const REPORT_FILENAME = "atlas-admin-monitoring-architecture-report.md";

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

function countPassed(checks) {
  return checks.filter((check) => check.ok).length;
}

function buildMonitoringSpecification(
  budgetValidator,
  packageValidation,
  selectorFoundation,
  recipeFactory,
  costPlanning,
  pipelineSimulation
) {
  const pipelineReady = pipelineSimulation.pipelineOutputs.filter(
    (output) => output.finalStage === "PREVIEW_READY"
  );
  const pipelineBlocked = pipelineSimulation.pipelineOutputs.filter(
    (output) => output.finalStage !== "PREVIEW_READY"
  );
  const budgetWarnings = budgetValidator.validation.representativeEvaluations.reduce(
    (total, evaluation) => total + evaluation.warnings.length,
    0
  );
  const budgetBlocks = budgetValidator.validation.representativeEvaluations.reduce(
    (total, evaluation) => total + evaluation.blocks.length,
    0
  );

  return deepFreeze({
    schemaId: "ATLAS_ADMIN_MONITORING_SPECIFICATION_001",
    monitoringId: "ATLAS_ADMIN_MONITORING_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      budgetValidatorId: budgetValidator.specification.validatorId,
      regionalPackageValidationId:
        packageValidation.specification.validationPlanningId,
      selectorId: selectorFoundation.specification.selectorId,
      recipeFactoryId: recipeFactory.lifecycle.factoryId,
      costPerformanceId: costPlanning.specification.performancePlanningId,
      pipelineSimulationId: pipelineSimulation.lifecycle.simulationId
    },
    atlasDashboardMetrics: {
      totalApprovedRecipes: selectorFoundation.specification.approvedRecipeCount,
      selectorRequiredFields:
        selectorFoundation.specification.selectionInputSchema.requiredFields.length,
      packageValidationChecks: packageValidation.validation.checks.length,
      budgetValidationChecks: budgetValidator.validation.checks.length,
      pipelineScenarioCount: pipelineSimulation.validation.scenarioCount,
      pipelinePreviewReadyCount: pipelineReady.length,
      pipelineBlockedCount: pipelineBlocked.length
    },
    packageHealthMonitoring: {
      healthStates: ["HEALTHY", "WARNING", "BLOCKED"],
      integrityPassCount: countPassed(packageValidation.validation.checks),
      integrityTotalCount: packageValidation.validation.checks.length,
      mobileSuitabilityCheckPresent: packageValidation.validation.checks.some(
        (check) => check.name === "mobile_package_suitability"
      ),
      schemaAndRollbackCoveragePresent: packageValidation.validation.checks.some(
        (check) => check.name === "corruption_and_rollback_coverage_defined"
      )
    },
    recipeUsageAnalytics: {
      approvedRecipeIds: selectorFoundation.library.recipes.map(
        (recipe) => recipe.recipeId
      ),
      usageByRecipeId: selectorFoundation.library.recipes.map((recipe) => ({
        recipeId: recipe.recipeId,
        previewReadySelections: pipelineReady.filter(
          (output) => output.selectedRecipeId === recipe.recipeId
        ).length
      })),
      fallbackSelections: pipelineSimulation.results.filter(
        (result) => result.selectionResult.fallbackApplied === true
      ).length
    },
    budgetWarnings: {
      warningStateCount: budgetValidator.specification.warningStates.states.length,
      totalRepresentativeWarnings: budgetWarnings,
      recommendationStates:
        budgetValidator.specification.approvalRecommendations.recommendationStates
    },
    validationFailures: {
      pipelineBlockedCount: pipelineBlocked.length,
      invalidPackageBlocks: pipelineSimulation.pipelineOutputs.filter(
        (output) => output.scenarioType === "invalid_package"
      ).length,
      incompatibleVersionBlocks: pipelineSimulation.pipelineOutputs.filter(
        (output) => output.scenarioType === "incompatible_version_package"
      ).length,
      budgetBlockSignals: budgetBlocks
    },
    generationStatistics: {
      averageGenerationKb:
        costPlanning.specification.recipeGenerationProfile.averageGenerationKb,
      peakGenerationKb:
        costPlanning.specification.recipeGenerationProfile.peakGenerationKb,
      successfulLocationConfidenceAverage:
        costPlanning.specification.recipeGenerationProfile
          .averageValidLocationConfidence,
      deterministicStagesPerSuccessfulLocation:
        costPlanning.specification.recipeGenerationProfile
          .deterministicStagesPerSuccessfulLocation
    },
    backendWorkloadIndicators: {
      validationPassesPerPackage:
        costPlanning.specification.backendProcessingExpectations
          .perPackageValidationChecks,
      classificationPassesPerPackage:
        costPlanning.specification.backendProcessingExpectations
          .perPackageClassificationPasses,
      selectionPassesPerPackage:
        costPlanning.specification.backendProcessingExpectations
          .perPackageSelectionPasses,
      blockedPackageShortCircuit:
        costPlanning.specification.backendProcessingExpectations
          .blockedPackageShortCircuitBeforeClassification,
      computeClasses: costPlanning.assumptions.backendProcessingAssumptions
    },
    costVisibility: {
      averagePerRegionStorageKb:
        costPlanning.assumptions.storageAssumptions.averagePerRegionStorageKb,
      averagePerGeneratedLocationArtifactKb:
        costPlanning.assumptions.storageAssumptions
          .averagePerGeneratedLocationArtifactKb,
      standardRegionFetchKb:
        costPlanning.assumptions.bandwidthAssumptions.standardRegionFetchKb,
      successfulEndToEndLocationPrepKb:
        costPlanning.assumptions.bandwidthAssumptions
          .successfulEndToEndLocationPrepKb,
      firebaseCostPressureDrivers:
        costPlanning.assumptions.firebaseBackendConsiderations.costPressureDrivers
    }
  });
}

function derivePanelStatus({ blockedCount, warningCount }) {
  if (blockedCount > 0) {
    return "BLOCKED";
  }
  if (warningCount > 0) {
    return "WARNING";
  }
  return "HEALTHY";
}

function buildAdminDataModel(specification, budgetValidator, pipelineSimulation) {
  const packageWarningCount =
    budgetValidator.validation.representativeEvaluations.filter(
      (entry) => entry.recommendation === "APPROVE_WITH_WARNING"
    ).length;
  const packageBlockedCount =
    pipelineSimulation.pipelineOutputs.filter(
      (output) => output.finalStage === "VALIDATION_BLOCKED"
    ).length;
  const recipeWarningCount = specification.recipeUsageAnalytics.fallbackSelections;
  const recipeBlockedCount = 0;
  const budgetWarningCount = specification.budgetWarnings.totalRepresentativeWarnings;
  const budgetBlockedCount = specification.validationFailures.budgetBlockSignals;
  const backendWarningCount =
    specification.backendWorkloadIndicators.blockedPackageShortCircuit ? 0 : 1;

  return deepFreeze({
    schemaId: "ATLAS_ADMIN_MONITORING_DATA_MODEL_001",
    monitoringId: specification.monitoringId,
    dashboardCards: [
      {
        cardId: "PACKAGE_HEALTH",
        title: "Package Health",
        status: derivePanelStatus({
          blockedCount: packageBlockedCount,
          warningCount: packageWarningCount
        }),
        metrics: {
          integrityChecksPassed:
            specification.packageHealthMonitoring.integrityPassCount,
          integrityChecksTotal:
            specification.packageHealthMonitoring.integrityTotalCount,
          blockedPipelines: packageBlockedCount
        }
      },
      {
        cardId: "RECIPE_USAGE",
        title: "Recipe Usage",
        status: derivePanelStatus({
          blockedCount: recipeBlockedCount,
          warningCount: recipeWarningCount
        }),
        metrics: {
          approvedRecipeCount: specification.atlasDashboardMetrics.totalApprovedRecipes,
          previewReadySelections:
            specification.atlasDashboardMetrics.pipelinePreviewReadyCount,
          fallbackSelections:
            specification.recipeUsageAnalytics.fallbackSelections
        }
      },
      {
        cardId: "BUDGET_STATUS",
        title: "Budget Status",
        status: derivePanelStatus({
          blockedCount: budgetBlockedCount,
          warningCount: budgetWarningCount
        }),
        metrics: {
          warningSignals: budgetWarningCount,
          blockSignals: budgetBlockedCount,
          recommendationStates:
            specification.budgetWarnings.recommendationStates.length
        }
      },
      {
        cardId: "BACKEND_LOAD",
        title: "Backend Load",
        status: derivePanelStatus({
          blockedCount: 0,
          warningCount: backendWarningCount
        }),
        metrics: {
          validationPassesPerPackage:
            specification.backendWorkloadIndicators.validationPassesPerPackage,
          classificationPassesPerPackage:
            specification.backendWorkloadIndicators.classificationPassesPerPackage,
          successfulLocationPrepKb:
            specification.costVisibility.successfulEndToEndLocationPrepKb
        }
      }
    ],
    tables: {
      recipeUsage: specification.recipeUsageAnalytics.usageByRecipeId,
      budgetRecommendations:
        budgetValidator.validation.representativeEvaluations.map((entry) => ({
          caseId: entry.caseId,
          recommendation: entry.recommendation,
          warningCount: entry.warnings.length,
          holdCount: entry.holds.length,
          blockCount: entry.blocks.length
        })),
      blockedScenarios: pipelineSimulation.pipelineOutputs
        .filter((output) => output.finalStage !== "PREVIEW_READY")
        .map((output) => ({
          scenarioId: output.scenarioId,
          scenarioType: output.scenarioType,
          finalStage: output.finalStage
        }))
    }
  });
}

function buildValidation(specification, dataModel) {
  const checks = [
    {
      name: "atlas_dashboard_metrics_defined",
      ok:
        specification.atlasDashboardMetrics.totalApprovedRecipes >= 2 &&
        specification.atlasDashboardMetrics.pipelineScenarioCount === 5
    },
    {
      name: "package_health_monitoring_defined",
      ok:
        specification.packageHealthMonitoring.healthStates.includes("HEALTHY") &&
        specification.packageHealthMonitoring.healthStates.includes("BLOCKED")
    },
    {
      name: "recipe_usage_analytics_defined",
      ok:
        specification.recipeUsageAnalytics.usageByRecipeId.length >= 2 &&
        specification.recipeUsageAnalytics.approvedRecipeIds.length >= 2
    },
    {
      name: "budget_and_failure_visibility_defined",
      ok:
        specification.budgetWarnings.warningStateCount >= 4 &&
        specification.validationFailures.pipelineBlockedCount >= 1
    },
    {
      name: "generation_and_backend_indicators_defined",
      ok:
        specification.generationStatistics.averageGenerationKb > 0 &&
        specification.backendWorkloadIndicators.validationPassesPerPackage >= 1
    },
    {
      name: "admin_data_model_defined",
      ok:
        dataModel.dashboardCards.length >= 4 &&
        dataModel.tables.recipeUsage.length >= 2
    },
    {
      name: "runtime_download_blender_glb_and_asset_mutation_blocked",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ADMIN_MONITORING_VALIDATION_001",
    monitoringId: specification.monitoringId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    nextAllowedAction: "future_atlas_operations_visibility_ready",
    checks
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_ADMIN_MONITORING_LIFECYCLE_RECORD_001",
    monitoringId: specification.monitoringId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    dashboardReadOnly: true,
    runtimeActivationAuthorized: false,
    downloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(specification, dataModel, validation, lifecycle) {
  const lines = [
    "# ATLAS_ADMIN_MONITORING_001",
    "",
    `Status: ${lifecycle.lifecycleStatus}`,
    "",
    "## Scope",
    "- Defines a read-only Atlas admin visibility layer for future development and operations.",
    "- Surfaces package health, recipe usage, budget pressure, validation failures, generation stats, backend load, and cost visibility.",
    "",
    "## Dashboard Cards",
    ...dataModel.dashboardCards.map(
      (card) => `- ${card.title}: ${card.status}`
    ),
    "",
    "## Core Monitoring Areas",
    "- Atlas dashboard metrics",
    "- package health monitoring",
    "- recipe usage analytics",
    "- budget warnings",
    "- validation failures",
    "- generation statistics",
    "- backend workload indicators",
    "- cost visibility",
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- Future Atlas operations: READY",
    "- Runtime activation / downloads / Blender / GLBs / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasAdminMonitoringPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const budgetValidator = buildAtlasBudgetValidatorPlanning({ cwd });
  const packageValidation = buildAtlasRegionalPackageValidationPlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const recipeFactory = buildLocationRecipeFactoryFoundation({ cwd });
  const costPlanning = buildAtlasWorldGenerationCostPerformancePlanning({ cwd });
  const pipelineSimulation = buildAtlasFullPipelineSimulation({ cwd });

  const specification = buildMonitoringSpecification(
    budgetValidator,
    packageValidation,
    selectorFoundation,
    recipeFactory,
    costPlanning,
    pipelineSimulation
  );
  const dataModel = buildAdminDataModel(
    specification,
    budgetValidator,
    pipelineSimulation
  );
  const validation = buildValidation(specification, dataModel);
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(specification, dataModel, validation, lifecycle);
  const fingerprint = hashHex(
    specification.monitoringId,
    validation.status,
    specification.atlasDashboardMetrics.pipelineScenarioCount,
    specification.validationFailures.pipelineBlockedCount,
    specification.budgetWarnings.totalRepresentativeWarnings
  );

  return deepFreeze({
    specification,
    dataModel,
    validation,
    lifecycle,
    report,
    fingerprint
  });
}

export function writeAtlasAdminMonitoringPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const planning = buildAtlasAdminMonitoringPlanning({ cwd });
  const monitoringRoot = path.resolve(cwd, MONITORING_ROOT);
  const specificationDir = path.join(monitoringRoot, "specification");
  const dataModelDir = path.join(monitoringRoot, "data-model");
  const validationDir = path.join(monitoringRoot, "validation");
  const lifecycleDir = path.join(monitoringRoot, "lifecycle");
  const reportsDir = path.join(monitoringRoot, "reports");

  for (const directory of [
    specificationDir,
    dataModelDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, SPECIFICATION_FILENAME), planning.specification);
  writeJson(path.join(dataModelDir, DATA_MODEL_FILENAME), planning.dataModel);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), planning.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), planning.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), planning.report);

  return planning;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeAtlasAdminMonitoringPlanning();
}
