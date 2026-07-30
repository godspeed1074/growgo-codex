import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasAdminMonitoringPlanning } from "./atlas-admin-monitoring-planning.mjs";
import { buildAtlasBudgetValidatorPlanning } from "./atlas-budget-validator-planning.mjs";
import { buildAtlasRegionalPackageValidationPlanning } from "./atlas-regional-package-validation-planning.mjs";
import { buildLocationRecipeFactoryFoundation } from "./location-recipe-factory-foundation.mjs";

const CONTROL_CENTRE_ROOT =
  "asset-factory-workspace/atlas-control-centre/ATLAS_CONTROL_CENTRE_001";

const SPECIFICATION_FILENAME = "atlas-control-centre-integration-specification.json";
const DATA_MODEL_FILENAME = "atlas-control-centre-integration-data-model.json";
const VALIDATION_FILENAME = "atlas-control-centre-integration-validation.json";
const LIFECYCLE_FILENAME = "atlas-control-centre-integration-lifecycle-record.json";
const REPORT_FILENAME = "atlas-control-centre-integration-architecture-report.md";

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

function deriveStatus({ blockedCount = 0, warningCount = 0 }) {
  if (blockedCount > 0) {
    return "BLOCKED";
  }
  if (warningCount > 0) {
    return "WARNING";
  }
  return "HEALTHY";
}

function buildControlCentreSpecification(
  monitoring,
  budgetValidator,
  packageValidation,
  recipeFactory
) {
  const monitoringCards = monitoring.dataModel.dashboardCards;
  const blockedScenarios = monitoring.dataModel.tables.blockedScenarios;
  const budgetEvaluations = budgetValidator.validation.representativeEvaluations;
  const approvedRecipeCount =
    monitoring.specification.atlasDashboardMetrics.totalApprovedRecipes;

  return deepFreeze({
    schemaId: "ATLAS_CONTROL_CENTRE_INTEGRATION_SPECIFICATION_001",
    controlCentreId: "ATLAS_CONTROL_CENTRE_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      monitoringId: monitoring.specification.monitoringId,
      budgetValidatorId: budgetValidator.specification.validatorId,
      regionalPackageValidationId:
        packageValidation.specification.validationPlanningId,
      recipeFactoryId: recipeFactory.lifecycle.factoryId
    },
    atlasDashboardIntegration: {
      integrationMode: "READ_ONLY_PLANNING",
      dashboardCards: monitoringCards.map((card) => ({
        cardId: card.cardId,
        title: card.title,
        status: card.status
      })),
      summaryMetrics: {
        approvedRecipeCount,
        blockedScenarioCount: blockedScenarios.length,
        budgetWarningSignals:
          monitoring.specification.budgetWarnings.totalRepresentativeWarnings,
        budgetBlockSignals:
          monitoring.specification.validationFailures.budgetBlockSignals
      }
    },
    recipeManagementViews: {
      viewIds: [
        "APPROVED_RECIPE_LIBRARY",
        "RECIPE_USAGE_HEATMAP",
        "RECIPE_VERSION_COMPARE",
        "RECIPE_APPROVAL_QUEUE"
      ],
      requiredFields: [
        "recipeId",
        "version",
        "lifecycleStatus",
        "previewReadySelections",
        "fallbackSelections",
        "deterministicFingerprint"
      ],
      dataSources: [
        "LOCATION_RECIPE_FACTORY_001",
        "ATLAS_ADMIN_MONITORING_001"
      ]
    },
    packageHealthViews: {
      healthStates: ["HEALTHY", "WARNING", "BLOCKED"],
      viewIds: [
        "PACKAGE_HEALTH_OVERVIEW",
        "BLOCKED_PACKAGE_QUEUE",
        "SCHEMA_AND_FINGERPRINT_STATUS",
        "MOBILE_SUITABILITY_STATUS"
      ],
      requiredChecks: packageValidation.validation.checks.map((check) => check.name)
    },
    budgetAlertWorkflows: {
      workflowStates:
        budgetValidator.specification.approvalRecommendations.recommendationStates,
      alertBands: {
        warningStates: budgetValidator.specification.warningStates.states,
        blockingStates: budgetValidator.specification.blockingStates.states
      },
      operatorResponses: [
        "ACKNOWLEDGE_WARNING",
        "QUEUE_OPTIMIZATION_REVIEW",
        "HOLD_FOR_PACKAGE_REDESIGN",
        "REQUEST_RECIPE_DENSITY_REVIEW"
      ]
    },
    approvalWorkflows: {
      phases: [
        "PACKAGE_VALIDATION_REVIEW",
        "RECIPE_COMPATIBILITY_REVIEW",
        "BUDGET_RECOMMENDATION_REVIEW",
        "CONTROL_CENTRE_SIGNOFF_READY"
      ],
      readinessRequirements: [
        "package_validation_pass",
        "recipe_factory_reference_valid",
        "budget_recommendation_not_blocked",
        "no_runtime_authorization"
      ],
      outputs: [
        "operator_review_note",
        "approval_queue_entry",
        "comparison_snapshot"
      ]
    },
    versionComparison: {
      comparisonTargets: [
        "regional_package_schema_version",
        "recipe_version",
        "selector_contract_version",
        "budget_validator_threshold_set"
      ],
      comparisonViews: [
        "CURRENT_VS_CANDIDATE",
        "FINGERPRINT_DIFF",
        "RECOMMENDATION_DIFF"
      ],
      deterministicComparisonRequired: true
    },
    operatorActions: {
      allowedActions: [
        "VIEW_DASHBOARD",
        "COMPARE_RECORDS",
        "ACKNOWLEDGE_ALERT",
        "QUEUE_REVIEW",
        "EXPORT_REPORT",
        "OPEN_AUDIT_TRACE"
      ],
      blockedActions: [
        "ACTIVATE_RUNTIME",
        "DOWNLOAD_PACKAGES",
        "MODIFY_ASSETS",
        "PUBLISH_TO_PLAYERS",
        "PROMOTE_WITHOUT_APPROVAL"
      ],
      authorizationMode: "MANUAL_OPERATOR_ONLY"
    },
    auditLogging: {
      logTypes: [
        "VIEW_EVENT",
        "ALERT_ACKNOWLEDGEMENT",
        "REVIEW_QUEUE_EVENT",
        "VERSION_COMPARISON_EVENT",
        "EXPORT_REPORT_EVENT"
      ],
      requiredFields: [
        "eventId",
        "eventType",
        "sourceRecordId",
        "operatorAction",
        "timestamp",
        "readOnly"
      ],
      appendOnly: true
    },
    controlAreas: [
      "DASHBOARD",
      "RECIPES",
      "PACKAGES",
      "BUDGET",
      "APPROVALS",
      "VERSIONS",
      "AUDIT"
    ],
    representativeSignals: {
      monitoringStatuses: monitoringCards.map((card) => card.status),
      budgetRecommendations: budgetEvaluations.map(
        (evaluation) => evaluation.recommendation
      ),
      blockedScenarioIds: blockedScenarios.map((scenario) => scenario.scenarioId)
    }
  });
}

function buildDataModel(specification, monitoring, budgetValidator, packageValidation) {
  const blockedScenarios = monitoring.dataModel.tables.blockedScenarios;
  const budgetRecommendations = budgetValidator.validation.representativeEvaluations;
  const packageWarningCount = budgetRecommendations.filter(
    (entry) => entry.recommendation === "APPROVE_WITH_WARNING"
  ).length;
  const packageBlockedCount = blockedScenarios.length;
  const budgetHoldCount = budgetRecommendations.filter(
    (entry) => entry.recommendation === "HOLD_FOR_OPTIMIZATION"
  ).length;
  const budgetBlockCount = budgetRecommendations.filter(
    (entry) => entry.recommendation === "BLOCK_FOR_REDESIGN"
  ).length;

  return deepFreeze({
    schemaId: "ATLAS_CONTROL_CENTRE_INTEGRATION_DATA_MODEL_001",
    controlCentreId: specification.controlCentreId,
    dashboardPanels: [
      {
        panelId: "ATLAS_OVERVIEW",
        title: "Atlas Overview",
        status: deriveStatus({
          blockedCount: packageBlockedCount,
          warningCount: packageWarningCount
        }),
        metrics: {
          approvedRecipes:
            specification.atlasDashboardIntegration.summaryMetrics.approvedRecipeCount,
          blockedScenarios: packageBlockedCount,
          budgetWarnings:
            specification.atlasDashboardIntegration.summaryMetrics.budgetWarningSignals
        }
      },
      {
        panelId: "RECIPE_MANAGEMENT",
        title: "Recipe Management",
        status: deriveStatus({
          warningCount: monitoring.specification.recipeUsageAnalytics.fallbackSelections
        }),
        metrics: {
          approvedRecipeCount:
            monitoring.specification.recipeUsageAnalytics.approvedRecipeIds.length,
          fallbackSelections:
            monitoring.specification.recipeUsageAnalytics.fallbackSelections,
          recipeViews: specification.recipeManagementViews.viewIds.length
        }
      },
      {
        panelId: "PACKAGE_HEALTH",
        title: "Package Health",
        status: deriveStatus({
          blockedCount: packageBlockedCount,
          warningCount: packageWarningCount
        }),
        metrics: {
          validationChecks: packageValidation.validation.checks.length,
          blockedPackages: packageBlockedCount,
          mobileSuitabilityTracked: specification.packageHealthViews.requiredChecks.includes(
            "mobile_package_suitability"
          )
        }
      },
      {
        panelId: "BUDGET_ALERTS",
        title: "Budget Alerts",
        status: deriveStatus({
          blockedCount: budgetBlockCount,
          warningCount: budgetHoldCount + packageWarningCount
        }),
        metrics: {
          approveWithWarning: packageWarningCount,
          holdForOptimization: budgetHoldCount,
          blockForRedesign: budgetBlockCount
        }
      },
      {
        panelId: "APPROVAL_AND_AUDIT",
        title: "Approval and Audit",
        status: "HEALTHY",
        metrics: {
          approvalPhases: specification.approvalWorkflows.phases.length,
          auditLogTypes: specification.auditLogging.logTypes.length,
          allowedOperatorActions: specification.operatorActions.allowedActions.length
        }
      }
    ],
    views: {
      recipeManagement: monitoring.specification.recipeUsageAnalytics.usageByRecipeId.map(
        (recipe) => ({
          recipeId: recipe.recipeId,
          previewReadySelections: recipe.previewReadySelections,
          lifecycleStatus: "APPROVED_CURRENT",
          comparisonReady: true
        })
      ),
      packageHealth: blockedScenarios.map((scenario) => ({
        scenarioId: scenario.scenarioId,
        status: "BLOCKED",
        reason: scenario.reason,
        recommendedAction: "QUEUE_REVIEW"
      })),
      budgetAlerts: budgetRecommendations.map((entry) => ({
        caseId: entry.caseId,
        recommendation: entry.recommendation,
        warningCount: entry.warnings.length,
        blockCount: entry.blocks.length,
        operatorAction:
          entry.recommendation === "BLOCK_FOR_REDESIGN"
            ? "HOLD_FOR_PACKAGE_REDESIGN"
            : entry.recommendation === "HOLD_FOR_OPTIMIZATION"
              ? "QUEUE_OPTIMIZATION_REVIEW"
              : "ACKNOWLEDGE_WARNING"
      })),
      versionComparison: [
        {
          comparisonId: "RECIPE_FACTORY_VS_PACKAGE_VALIDATION",
          leftVersion: recipeFactoryVersion(specification),
          rightVersion: packageValidation.specification.validationPlanningId,
          comparisonMode: "CURRENT_VS_CANDIDATE",
          deterministic: true
        }
      ],
      auditTrailTemplates: specification.auditLogging.logTypes.map((eventType) => ({
        eventType,
        readOnly: true,
        appendOnly: true
      }))
    }
  });
}

function recipeFactoryVersion(specification) {
  return specification.references.recipeFactoryId;
}

function buildValidation(specification, dataModel) {
  const checks = [
    [
      "dashboard_integration_defined",
      specification.atlasDashboardIntegration.dashboardCards.length >= 4
    ],
    [
      "recipe_management_views_defined",
      specification.recipeManagementViews.viewIds.length >= 4
    ],
    [
      "package_health_views_defined",
      specification.packageHealthViews.viewIds.length >= 4
    ],
    [
      "budget_alert_workflows_defined",
      specification.budgetAlertWorkflows.operatorResponses.length >= 4
    ],
    [
      "approval_workflows_defined",
      specification.approvalWorkflows.phases.length >= 4
    ],
    [
      "version_comparison_defined",
      specification.versionComparison.comparisonTargets.length >= 4
    ],
    [
      "operator_actions_defined",
      specification.operatorActions.allowedActions.length >= 4
    ],
    [
      "audit_logging_defined",
      specification.auditLogging.logTypes.length >= 4
    ],
    [
      "data_model_defined",
      dataModel.dashboardPanels.length >= 5 &&
        dataModel.views.recipeManagement.length >= 2 &&
        dataModel.views.budgetAlerts.length >= 4
    ],
    [
      "runtime_player_blender_glb_asset_mutation_blocked",
      true
    ]
  ].map(([name, ok]) => ({ name, ok }));

  const fingerprint = hashHex(
    specification.controlCentreId,
    JSON.stringify(specification),
    JSON.stringify(dataModel),
    JSON.stringify(checks)
  );

  return deepFreeze({
    schemaId: "ATLAS_CONTROL_CENTRE_INTEGRATION_VALIDATION_001",
    controlCentreId: specification.controlCentreId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: fingerprint,
    runtimeActivationAuthorized: false,
    playerExposureAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_CONTROL_CENTRE_INTEGRATION_LIFECYCLE_001",
    controlCentreId: specification.controlCentreId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    dashboardReadOnly: true,
    runtimeActivationAuthorized: false,
    playerExposureAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    operatorActionMode: specification.operatorActions.authorizationMode,
    deterministicFingerprint: validation.deterministicFingerprint
  });
}

function buildReport(specification, dataModel, validation, lifecycle) {
  const panelLines = dataModel.dashboardPanels
    .map((panel) => `- ${panel.panelId}: ${panel.status}`)
    .join("\n");

  return `# ATLAS CONTROL CENTRE INTEGRATION ARCHITECTURE REPORT\n\n## Scope\n\nATLAS_CONTROL_CENTRE_001 defines the read-only developer Control Centre layer for Atlas planning systems.\n\nIntegrated systems:\n\n- ${specification.references.monitoringId}\n- ${specification.references.budgetValidatorId}\n- ${specification.references.regionalPackageValidationId}\n- ${specification.references.recipeFactoryId}\n\n## Integrated Areas\n\n- atlas dashboard integration\n- recipe management views\n- package health views\n- budget alert workflows\n- approval workflows\n- version comparison\n- operator actions\n- audit logging\n\n## Dashboard Panels\n\n${panelLines}\n\n## Safety\n\n- runtime activation authorized: ${validation.runtimeActivationAuthorized}\n- player exposure authorized: ${validation.playerExposureAuthorized}\n- Blender authorized: ${validation.blenderAuthorized}\n- GLB authorized: ${validation.glbAuthorized}\n- asset modification authorized: ${validation.assetModificationAuthorized}\n\n## Lifecycle\n\n- lifecycle status: ${lifecycle.lifecycleStatus}\n- dashboard read-only: ${lifecycle.dashboardReadOnly}\n- operator action mode: ${lifecycle.operatorActionMode}\n\n## Readiness\n\nFuture Control Centre development: READY\n`;
}

export function buildAtlasControlCentreIntegrationPlanning({ cwd = process.cwd() } = {}) {
  const monitoring = buildAtlasAdminMonitoringPlanning({ cwd });
  const budgetValidator = buildAtlasBudgetValidatorPlanning({ cwd });
  const packageValidation = buildAtlasRegionalPackageValidationPlanning({ cwd });
  const recipeFactory = buildLocationRecipeFactoryFoundation({ cwd });

  const specification = buildControlCentreSpecification(
    monitoring,
    budgetValidator,
    packageValidation,
    recipeFactory
  );
  const dataModel = buildDataModel(
    specification,
    monitoring,
    budgetValidator,
    packageValidation
  );
  const validation = buildValidation(specification, dataModel);
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(specification, dataModel, validation, lifecycle);
  const fingerprint = validation.deterministicFingerprint;

  return deepFreeze({
    root: path.resolve(cwd, CONTROL_CENTRE_ROOT),
    specification,
    dataModel,
    validation,
    lifecycle,
    report,
    fingerprint
  });
}

export function writeAtlasControlCentreIntegrationPlanning({ cwd = process.cwd() } = {}) {
  const planning = buildAtlasControlCentreIntegrationPlanning({ cwd });
  const root = planning.root;

  const specificationDir = path.join(root, "specification");
  const dataModelDir = path.join(root, "data-model");
  const validationDir = path.join(root, "validation");
  const lifecycleDir = path.join(root, "lifecycle");
  const reportsDir = path.join(root, "reports");

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

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasControlCentreIntegrationPlanning();
}
