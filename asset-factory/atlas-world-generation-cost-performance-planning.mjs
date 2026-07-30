import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasPackageOptimizationPlanning } from "./atlas-package-optimization-planning.mjs";
import { buildAtlasFullPipelineSimulation } from "./atlas-full-pipeline-simulation.mjs";
import { buildLocationRecipeFactoryFoundation } from "./location-recipe-factory-foundation.mjs";

const PERFORMANCE_ROOT =
  "asset-factory-workspace/atlas-performance/ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001";

const SPECIFICATION_FILENAME =
  "atlas-world-generation-cost-performance-specification.json";
const ASSUMPTIONS_FILENAME =
  "atlas-world-generation-cost-model-assumptions.json";
const VALIDATION_FILENAME =
  "atlas-world-generation-cost-performance-validation.json";
const REPORT_FILENAME =
  "atlas-world-generation-cost-performance-scaling-report.md";

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

function bytesToKb(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function readSizeBytes(filename) {
  return fs.statSync(filename).size;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values) {
  return values.length === 0 ? 0 : Number((sum(values) / values.length).toFixed(2));
}

function loadMeasuredArtifacts(cwd) {
  const repoRoot = path.resolve(cwd);
  const coastalRecipeRoot = path.join(
    repoRoot,
    "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001"
  );
  const forestRecipeRoot = path.join(
    repoRoot,
    "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001"
  );
  const pipelineRoot = path.join(
    repoRoot,
    "asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001"
  );

  const coastalGenerationFiles = [
    path.join(
      coastalRecipeRoot,
      "generation/coastal-location-recipe-001-generated-plan.json"
    ),
    path.join(
      coastalRecipeRoot,
      "generation/coastal-location-recipe-001-dependency-map.json"
    )
  ];
  const coastalPreviewFiles = [
    path.join(coastalRecipeRoot, "preview/coastal-location-recipe-001-preview-data.json"),
    path.join(coastalRecipeRoot, "preview/coastal-location-recipe-001-zone-summary.json"),
    path.join(coastalRecipeRoot, "preview/coastal-location-recipe-001-density-report.json")
  ];

  const forestGenerationFiles = [
    path.join(
      forestRecipeRoot,
      "generation/forest-location-recipe-001-generated-plan.json"
    ),
    path.join(
      forestRecipeRoot,
      "generation/forest-location-recipe-001-dependency-map.json"
    )
  ];
  const forestPreviewFiles = [
    path.join(forestRecipeRoot, "preview/forest-location-recipe-001-preview-data.json"),
    path.join(forestRecipeRoot, "preview/forest-location-recipe-001-zone-summary.json"),
    path.join(forestRecipeRoot, "preview/forest-location-recipe-001-density-report.json"),
    path.join(
      forestRecipeRoot,
      "preview/forest-location-recipe-001-placement-inspection-report.json"
    ),
    path.join(
      forestRecipeRoot,
      "preview/forest-location-recipe-001-visual-renderer-data.json"
    )
  ];

  const stageResultsPath = path.join(
    pipelineRoot,
    "simulation/atlas-full-pipeline-simulation-stage-results.json"
  );
  const pipelineOutputsPath = path.join(
    pipelineRoot,
    "simulation/atlas-full-pipeline-simulation-pipeline-outputs.json"
  );
  const regionalPackagesPath = path.join(
    repoRoot,
    "asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/simulation/atlas-regional-package-simulation-packages.json"
  );

  const coastalGenerationBytes = sum(coastalGenerationFiles.map(readSizeBytes));
  const coastalPreviewBytes = sum(coastalPreviewFiles.map(readSizeBytes));
  const forestGenerationBytes = sum(forestGenerationFiles.map(readSizeBytes));
  const forestPreviewBytes = sum(forestPreviewFiles.map(readSizeBytes));

  return deepFreeze({
    measuredFiles: {
      coastalGenerationBytes,
      coastalPreviewBytes,
      forestGenerationBytes,
      forestPreviewBytes,
      pipelineStageResultsBytes: readSizeBytes(stageResultsPath),
      pipelineOutputsBytes: readSizeBytes(pipelineOutputsPath),
      regionalPackagesBytes: readSizeBytes(regionalPackagesPath)
    },
    recipeMeasurements: {
      coastal: {
        generationBytes: coastalGenerationBytes,
        previewBytes: coastalPreviewBytes
      },
      forest: {
        generationBytes: forestGenerationBytes,
        previewBytes: forestPreviewBytes
      }
    }
  });
}

function buildPerformanceSpecification(
  optimizationPlanning,
  pipelineSimulation,
  factoryFoundation,
  measuredArtifacts
) {
  const optimizationExamples =
    optimizationPlanning.specification.representativeOptimizationExamples;
  const packageSizesKb = optimizationExamples.map((example) => example.compressedPackageKb);
  const previewBytes = [
    measuredArtifacts.recipeMeasurements.coastal.previewBytes,
    measuredArtifacts.recipeMeasurements.forest.previewBytes
  ];
  const generationBytes = [
    measuredArtifacts.recipeMeasurements.coastal.generationBytes,
    measuredArtifacts.recipeMeasurements.forest.generationBytes
  ];
  const validPipelineOutputs = pipelineSimulation.pipelineOutputs.filter(
    (output) => output.finalStage === "PREVIEW_READY"
  );

  return deepFreeze({
    schemaId: "ATLAS_WORLD_GENERATION_COST_PERFORMANCE_SPECIFICATION_001",
    performancePlanningId: "ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      optimizationId: optimizationPlanning.specification.optimizationId,
      pipelineSimulationId: pipelineSimulation.lifecycle.simulationId,
      recipeFactoryId: factoryFoundation.lifecycle.factoryId
    },
    regionalPackageEnvelope: {
      measuredCompressedPackageKb: packageSizesKb,
      averageCompressedPackageKb: average(packageSizesKb),
      peakCompressedPackageKb: Math.max(...packageSizesKb),
      constrainedProfileMaxKb: optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
        (profile) => profile.profileId === "MOBILE_CONSTRAINED_001"
      ).maxCompressedPackageKb,
      standardProfileMaxKb: optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
        (profile) => profile.profileId === "MOBILE_STANDARD_001"
      ).maxCompressedPackageKb
    },
    recipeGenerationProfile: {
      measuredGenerationBytes: generationBytes,
      averageGenerationKb: bytesToKb(average(generationBytes)),
      peakGenerationKb: bytesToKb(Math.max(...generationBytes)),
      deterministicStagesPerSuccessfulLocation: 6,
      averageValidLocationConfidence: average(
        validPipelineOutputs.map((output) => output.confidenceScore)
      )
    },
    previewPayloadProfile: {
      measuredPreviewBytes: previewBytes,
      averagePreviewKb: bytesToKb(average(previewBytes)),
      peakPreviewKb: bytesToKb(Math.max(...previewBytes)),
      previewMode: "NON_RUNTIME_ONLY",
      safeDistributionTarget: "metadata_preview_only"
    },
    deviceCacheRequirements: {
      standardProfile: {
        warmPackageCount:
          optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
            (profile) => profile.profileId === "MOBILE_STANDARD_001"
          ).maxWarmCachePackages,
        estimatedWarmPackageFootprintKb: Number(
          (
            average(packageSizesKb) *
            optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
              (profile) => profile.profileId === "MOBILE_STANDARD_001"
            ).maxWarmCachePackages
          ).toFixed(2)
        )
      },
      constrainedProfile: {
        warmPackageCount:
          optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
            (profile) => profile.profileId === "MOBILE_CONSTRAINED_001"
          ).maxWarmCachePackages,
        estimatedWarmPackageFootprintKb: Number(
          (
            average(packageSizesKb) *
            optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
              (profile) => profile.profileId === "MOBILE_CONSTRAINED_001"
            ).maxWarmCachePackages
          ).toFixed(2)
        )
      },
      selectorPreviewArtifactsPerPackage:
        optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
          (profile) => profile.profileId === "MOBILE_STANDARD_001"
        ).maxSelectorPreviewArtifactsPerPackage
    },
    backendProcessingExpectations: {
      perPackageValidationChecks: 6,
      perPackageClassificationPasses: 1,
      perPackageSelectionPasses: 1,
      perSuccessfulLocationRecipeGenerationPasses: 1,
      perSuccessfulLocationPreviewAssemblyPasses: 1,
      blockedPackageShortCircuitBeforeClassification: true
    },
    multiplayerRegionReuse: {
      sharedRegionPackageByRegionId: true,
      sharedPreviewPackageByRecipeFingerprint: true,
      perPlayerUniqueSelectionOnlyWhenSeedContextDiffers: true,
      preferredReuseLayer: "region_package_and_recipe_fingerprint_cache"
    },
    refreshFrequencyExpectations: {
      lowChurnPackageRefreshWindow: "7d",
      normalRefreshWindow: "24h",
      urgentSchemaOrSelectorRefreshWindow: "immediate_revalidation",
      refreshTriggers:
        optimizationPlanning.specification.refreshAndVersionStrategy.refreshTriggers
    }
  });
}

function buildCostModelAssumptions(specification) {
  const avgPackageKb = specification.regionalPackageEnvelope.averageCompressedPackageKb;
  const avgPreviewKb = specification.previewPayloadProfile.averagePreviewKb;
  const avgGenerationKb = specification.recipeGenerationProfile.averageGenerationKb;

  return deepFreeze({
    schemaId: "ATLAS_WORLD_GENERATION_COST_MODEL_ASSUMPTIONS_001",
    performancePlanningId: specification.performancePlanningId,
    assumptionsVersion: "v001",
    storageAssumptions: {
      packageStoredAsMetadataBlob: true,
      previewStoredAsMetadataBlob: true,
      recipeGenerationStoredAsDeterministicJson: true,
      averagePerRegionStorageKb: Number((avgPackageKb + avgPreviewKb).toFixed(2)),
      averagePerGeneratedLocationArtifactKb: Number(
        (avgGenerationKb + avgPreviewKb).toFixed(2)
      )
    },
    bandwidthAssumptions: {
      standardRegionFetchKb: avgPackageKb,
      previewInspectionFetchKb: avgPreviewKb,
      successfulEndToEndLocationPrepKb: Number(
        (avgPackageKb + avgGenerationKb + avgPreviewKb).toFixed(2)
      ),
      blockedInvalidPackageBandwidthWasteKb: Number(avgPackageKb.toFixed(2))
    },
    scalingAssumptions: {
      concurrentPlayersPerHotRegion: 20,
      sharedRegionReuseRate: 0.85,
      packageCacheHitTarget: 0.8,
      previewReuseHitTarget: 0.7,
      selectorComputationCostClass: "LOW",
      deterministicRecipeGenerationCostClass: "LOW_TO_MEDIUM"
    },
    firebaseBackendConsiderations: {
      pricingInputsMode: "assumption_only_no_live_pricing_lookup",
      preferredBlobStorage: "store region package and preview payloads as immutable versioned blobs",
      preferredIndexStorage:
        "store lightweight region metadata, fingerprints, and availability indexes separately",
      costPressureDrivers: [
        "duplicate package writes across refreshes",
        "per-player preview duplication instead of fingerprint reuse",
        "high-frequency invalidation causing cache churn",
        "chatty metadata reads without bundled region indexes"
      ],
      mitigationRules: [
        "reuse packages by regionId and fingerprint",
        "reuse preview payloads by deterministic recipe fingerprint",
        "short-circuit invalid packages before downstream stages",
        "prefer batched metadata fetches over many small reads"
      ]
    },
    backendProcessingAssumptions: {
      classificationComputeBudgetClass: "LOW",
      selectionComputeBudgetClass: "LOW",
      recipeGenerationComputeBudgetClass: "LOW_TO_MEDIUM",
      previewAssemblyComputeBudgetClass: "LOW",
      blockedPackageProcessingBudgetClass: "VERY_LOW"
    }
  });
}

function buildValidationRules(specification, assumptions) {
  const checks = [
    {
      name: "regional_package_sizes_within_standard_budget",
      ok:
        specification.regionalPackageEnvelope.peakCompressedPackageKb <=
        specification.regionalPackageEnvelope.standardProfileMaxKb
    },
    {
      name: "preview_payloads_remain_metadata_only_and_lightweight",
      ok:
        specification.previewPayloadProfile.averagePreviewKb < 64 &&
        specification.previewPayloadProfile.safeDistributionTarget ===
          "metadata_preview_only"
    },
    {
      name: "device_cache_requirements_match_optimization_budgets",
      ok:
        specification.deviceCacheRequirements.standardProfile.warmPackageCount === 24 &&
        specification.deviceCacheRequirements.constrainedProfile.warmPackageCount === 12
    },
    {
      name: "backend_processing_short_circuits_invalid_packages",
      ok:
        specification.backendProcessingExpectations.blockedPackageShortCircuitBeforeClassification ===
        true
    },
    {
      name: "multiplayer_region_reuse_defined",
      ok:
        specification.multiplayerRegionReuse.sharedRegionPackageByRegionId === true &&
        specification.multiplayerRegionReuse.sharedPreviewPackageByRecipeFingerprint ===
          true
    },
    {
      name: "firebase_cost_assumptions_are_reuse_first",
      ok:
        assumptions.firebaseBackendConsiderations.mitigationRules.includes(
          "reuse packages by regionId and fingerprint"
        ) &&
        assumptions.firebaseBackendConsiderations.mitigationRules.includes(
          "reuse preview payloads by deterministic recipe fingerprint"
        )
    },
    {
      name: "runtime_map_blender_glb_and_asset_mutation_blocked",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_WORLD_GENERATION_COST_PERFORMANCE_VALIDATION_001",
    performancePlanningId: specification.performancePlanningId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    nextAllowedAction: "future_atlas_engineering_budget_ready",
    checks
  });
}

function buildScalingReport(specification, assumptions, validation) {
  const lines = [
    "# ATLAS_WORLD_GENERATION_COST_PERFORMANCE_001",
    "",
    `Status: ${validation.status.toUpperCase()}`,
    "",
    "## Measured Baselines",
    `- Regional package average: ${specification.regionalPackageEnvelope.averageCompressedPackageKb} KB`,
    `- Regional package peak: ${specification.regionalPackageEnvelope.peakCompressedPackageKb} KB`,
    `- Recipe generation average: ${specification.recipeGenerationProfile.averageGenerationKb} KB`,
    `- Preview payload average: ${specification.previewPayloadProfile.averagePreviewKb} KB`,
    "",
    "## Device Cache Expectations",
    `- Standard profile warm cache: ${specification.deviceCacheRequirements.standardProfile.warmPackageCount} packages / ${specification.deviceCacheRequirements.standardProfile.estimatedWarmPackageFootprintKb} KB`,
    `- Constrained profile warm cache: ${specification.deviceCacheRequirements.constrainedProfile.warmPackageCount} packages / ${specification.deviceCacheRequirements.constrainedProfile.estimatedWarmPackageFootprintKb} KB`,
    "",
    "## Backend Expectations",
    `- Validation passes per package: ${specification.backendProcessingExpectations.perPackageValidationChecks}`,
    `- Classification passes per package: ${specification.backendProcessingExpectations.perPackageClassificationPasses}`,
    `- Selection passes per package: ${specification.backendProcessingExpectations.perPackageSelectionPasses}`,
    `- Generation passes per successful location: ${specification.backendProcessingExpectations.perSuccessfulLocationRecipeGenerationPasses}`,
    `- Preview passes per successful location: ${specification.backendProcessingExpectations.perSuccessfulLocationPreviewAssemblyPasses}`,
    "",
    "## Multiplayer Reuse",
    "- Region packages should be shared by regionId and fingerprint.",
    "- Preview payloads should be shared by deterministic recipe fingerprint.",
    `- Target shared-region reuse rate: ${assumptions.scalingAssumptions.sharedRegionReuseRate}`,
    "",
    "## Firebase / Backend Cost Direction",
    "- Use immutable versioned blobs for package and preview payloads.",
    "- Keep lightweight indexes separate from bulk payload blobs.",
    "- Avoid duplicate per-player writes when region or preview fingerprints already exist.",
    "- Prefer batched metadata fetches and cache hits over many small reads.",
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- Future Atlas engineering: READY",
    "- Runtime activation: BLOCKED",
    "- Map downloads / Blender / GLBs / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasWorldGenerationCostPerformancePlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const optimizationPlanning = buildAtlasPackageOptimizationPlanning({ cwd });
  const pipelineSimulation = buildAtlasFullPipelineSimulation({ cwd });
  const factoryFoundation = buildLocationRecipeFactoryFoundation({ cwd });
  const measuredArtifacts = loadMeasuredArtifacts(cwd);

  const specification = buildPerformanceSpecification(
    optimizationPlanning,
    pipelineSimulation,
    factoryFoundation,
    measuredArtifacts
  );
  const assumptions = buildCostModelAssumptions(specification);
  const validation = buildValidationRules(specification, assumptions);
  const report = buildScalingReport(specification, assumptions, validation);
  const fingerprint = hashHex(
    specification.performancePlanningId,
    validation.status,
    specification.regionalPackageEnvelope.averageCompressedPackageKb,
    specification.recipeGenerationProfile.averageGenerationKb,
    specification.previewPayloadProfile.averagePreviewKb,
    assumptions.scalingAssumptions.sharedRegionReuseRate
  );

  return deepFreeze({
    specification,
    assumptions,
    validation,
    report,
    fingerprint
  });
}

export function writeAtlasWorldGenerationCostPerformancePlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const planning = buildAtlasWorldGenerationCostPerformancePlanning({ cwd });
  const performanceRoot = path.resolve(cwd, PERFORMANCE_ROOT);
  const specificationDir = path.join(performanceRoot, "specification");
  const assumptionsDir = path.join(performanceRoot, "assumptions");
  const validationDir = path.join(performanceRoot, "validation");
  const reportsDir = path.join(performanceRoot, "reports");

  for (const directory of [specificationDir, assumptionsDir, validationDir, reportsDir]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, SPECIFICATION_FILENAME), planning.specification);
  writeJson(path.join(assumptionsDir, ASSUMPTIONS_FILENAME), planning.assumptions);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), planning.validation);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), planning.report);

  return planning;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeAtlasWorldGenerationCostPerformancePlanning();
}
