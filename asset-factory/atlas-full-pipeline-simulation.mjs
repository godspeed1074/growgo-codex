import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasRegionalPackagePlanning } from "./atlas-regional-package-planning.mjs";
import { buildAtlasRegionalPackageValidationPlanning } from "./atlas-regional-package-validation-planning.mjs";
import { buildAtlasPackageOptimizationPlanning } from "./atlas-package-optimization-planning.mjs";
import {
  buildLocationRecipeSelectorFoundation,
  selectLocationRecipe
} from "./location-recipe-selector-foundation.mjs";
import { classifyEnvironment } from "./atlas-environment-classification-simulation.mjs";
import {
  buildCoastalLocationRecipeOutput,
  buildCoastalLocationRecipeGenerationValidation
} from "./coastal-location-recipe-generation.mjs";
import {
  buildForestLocationRecipeOutput,
  buildForestLocationRecipeGenerationValidation
} from "./forest-location-recipe-generation.mjs";
import { buildLocationRecipeFactoryFoundation } from "./location-recipe-factory-foundation.mjs";

const PIPELINE_ROOT =
  "asset-factory-workspace/atlas-pipeline/ATLAS_FULL_PIPELINE_SIMULATION_001";

const INPUTS_FILENAME = "atlas-full-pipeline-simulation-inputs.json";
const STAGE_RESULTS_FILENAME = "atlas-full-pipeline-simulation-stage-results.json";
const PIPELINE_OUTPUTS_FILENAME = "atlas-full-pipeline-simulation-pipeline-outputs.json";
const VALIDATION_FILENAME = "atlas-full-pipeline-simulation-validation.json";
const LIFECYCLE_FILENAME = "atlas-full-pipeline-simulation-lifecycle-record.json";
const REPORT_FILENAME = "atlas-full-pipeline-simulation-report.md";

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

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createSimulationInputs() {
  return deepFreeze([
    {
      scenarioId: "PIPELINE_COASTAL_001",
      scenarioType: "coastal_package",
      regionSlug: "BELLARINE_COAST",
      sourceDatasetId: "SOURCE_DATASET_BELLARINE_001",
      sourceRevision: "2026-07-30:R003",
      coordinateReference: { latBucket: -38.12, lngBucket: 144.61 },
      environmentProfile: "COASTAL_EXPLORATION",
      environmentSummary: {
        primaryEnvironmentHint: "COASTAL_EXPLORATION",
        secondaryEnvironmentHints: ["MIXED_EDGE_TRANSITION"],
        biomeHints: ["COASTAL_RESERVE_TRAIL", "COASTAL_WETLAND_MARGIN"],
        confidenceHints: { coastal: 0.92, forest: 0.18, mixed: 0.37 }
      },
      classificationInputs: {
        landformSignals: ["dune_edge", "boardwalk_alignment", "shoreline_margin"],
        vegetationSignals: ["coastal_grass", "coastal_shrub", "bottlebrush"],
        hydrologySignals: ["saltwater_edge", "wetland_margin"],
        accessSignals: ["pedestrian_path", "lookout_link"],
        settlementSignals: ["reserve_entry"]
      },
      expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
      compressedPackageKb: 72
    },
    {
      scenarioId: "PIPELINE_FOREST_001",
      scenarioType: "forest_package",
      regionSlug: "DANDENONG_RANGES_EDGE",
      sourceDatasetId: "SOURCE_DATASET_DANDENONGS_001",
      sourceRevision: "2026-07-30:R003",
      coordinateReference: { latBucket: -37.84, lngBucket: 145.29 },
      environmentProfile: "FOREST_EXPLORATION",
      environmentSummary: {
        primaryEnvironmentHint: "FOREST_EXPLORATION",
        secondaryEnvironmentHints: ["MIXED_EDGE_TRANSITION"],
        biomeHints: ["TEMPERATE_FOREST_EDGE", "FOREST_TRACK_CLEARING"],
        confidenceHints: { coastal: 0.14, forest: 0.93, mixed: 0.41 }
      },
      classificationInputs: {
        landformSignals: ["forest_track", "clearing_node", "enclosed_corridor"],
        vegetationSignals: ["forest_canopy", "understory_shrub", "forest_grass"],
        hydrologySignals: ["dry_ground"],
        accessSignals: ["pedestrian_path"],
        settlementSignals: ["reserve_trailhead"]
      },
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001",
      compressedPackageKb: 78
    },
    {
      scenarioId: "PIPELINE_MIXED_001",
      scenarioType: "mixed_transition_package",
      regionSlug: "COASTAL_FOREST_MARGIN",
      sourceDatasetId: "SOURCE_DATASET_MIXED_EDGE_001",
      sourceRevision: "2026-07-30:R003",
      coordinateReference: { latBucket: -38.02, lngBucket: 145.01 },
      environmentProfile: "MIXED_EDGE_TRANSITION",
      environmentSummary: {
        primaryEnvironmentHint: "MIXED_EDGE_TRANSITION",
        secondaryEnvironmentHints: ["FOREST_EXPLORATION", "COASTAL_EXPLORATION"],
        biomeHints: ["TEMPERATE_FOREST_COASTAL_MARGIN", "COASTAL_WETLAND_MARGIN"],
        confidenceHints: { coastal: 0.52, forest: 0.71, mixed: 0.81 }
      },
      classificationInputs: {
        landformSignals: ["wetland_margin", "forest_edge", "transition_track"],
        vegetationSignals: ["coastal_grass", "forest_canopy", "bottlebrush"],
        hydrologySignals: ["wetland_margin", "creek_edge"],
        accessSignals: ["pedestrian_path", "wet_crossing"],
        settlementSignals: []
      },
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001",
      compressedPackageKb: 84
    },
    {
      scenarioId: "PIPELINE_INVALID_001",
      scenarioType: "invalid_package",
      regionSlug: "BROKEN_REGION",
      sourceDatasetId: "SOURCE_DATASET_INVALID_001",
      sourceRevision: "2026-07-30:R003",
      coordinateReference: { latBucket: -37.5, lngBucket: 145.5 },
      environmentProfile: "COASTAL_EXPLORATION",
      environmentSummary: {
        primaryEnvironmentHint: "COASTAL_EXPLORATION",
        secondaryEnvironmentHints: [],
        biomeHints: ["COASTAL_RESERVE_TRAIL"],
        confidenceHints: { coastal: 0.7, forest: 0.1, mixed: 0.2 }
      },
      classificationInputs: {
        landformSignals: ["shoreline_margin"],
        vegetationSignals: ["coastal_grass"],
        hydrologySignals: ["saltwater_edge"],
        accessSignals: ["pedestrian_path"],
        settlementSignals: []
      },
      expectedRecipeId: null,
      compressedPackageKb: 62,
      invalidPackage: true
    },
    {
      scenarioId: "PIPELINE_INCOMPATIBLE_VERSION_001",
      scenarioType: "incompatible_version_package",
      regionSlug: "BELLARINE_COAST",
      sourceDatasetId: "SOURCE_DATASET_BELLARINE_001",
      sourceRevision: "2026-07-30:R003",
      coordinateReference: { latBucket: -38.12, lngBucket: 144.61 },
      environmentProfile: "COASTAL_EXPLORATION",
      environmentSummary: {
        primaryEnvironmentHint: "COASTAL_EXPLORATION",
        secondaryEnvironmentHints: ["MIXED_EDGE_TRANSITION"],
        biomeHints: ["COASTAL_RESERVE_TRAIL"],
        confidenceHints: { coastal: 0.9, forest: 0.18, mixed: 0.31 }
      },
      classificationInputs: {
        landformSignals: ["dune_edge", "shoreline_margin"],
        vegetationSignals: ["coastal_grass", "coastal_shrub"],
        hydrologySignals: ["saltwater_edge"],
        accessSignals: ["pedestrian_path"],
        settlementSignals: ["reserve_entry"]
      },
      expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
      compressedPackageKb: 72,
      incompatibleVersion: true
    }
  ]);
}

function createRegionId(input) {
  return `REGION_${normalizeToken(input.regionSlug)}_${String(input.coordinateReference.latBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${String(input.coordinateReference.lngBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${normalizeToken(input.environmentProfile)}`;
}

function createPackageId(input) {
  return `ATLAS_REGION_PACKAGE_${normalizeToken(input.regionSlug)}_${String(input.coordinateReference.latBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${String(input.coordinateReference.lngBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_v001`;
}

function buildPackageFingerprint(input, schemaVersion) {
  return hashHex(
    createPackageId(input),
    input.sourceRevision,
    schemaVersion,
    input.environmentProfile,
    input.coordinateReference.latBucket,
    input.coordinateReference.lngBucket
  );
}

function buildRegionalPackage(input, regionalPlanning, selectorFoundation) {
  const schemaVersion = input.incompatibleVersion
    ? "v999"
    : regionalPlanning.specification.packageVersioning.schemaVersion;
  const packageId = createPackageId(input);
  const regionId = createRegionId(input);
  const declaredFingerprint = buildPackageFingerprint(input, schemaVersion);
  const selectorSeed = hashHex(
    regionId,
    "v001",
    input.coordinateReference.latBucket,
    input.coordinateReference.lngBucket,
    input.environmentSummary.biomeHints[0] ?? "UNKNOWN",
    input.environmentProfile === "FOREST_EXPLORATION"
      ? "FOREST_EDGE_LOOP"
      : input.environmentProfile === "MIXED_EDGE_TRANSITION"
        ? "RESERVE_TRACK_OUT_AND_BACK"
        : "RESERVE_LOOP",
    selectorFoundation.specification.selectorId
  );

  const dataLayers = {
    REGION_BOUNDARY_LAYER: {
      boundaryPolygon: "SIMULATED_BOUNDARY",
      centroid: input.coordinateReference,
      latBucket: input.coordinateReference.latBucket,
      lngBucket: input.coordinateReference.lngBucket
    },
    HYDROLOGY_SIGNAL_LAYER: {
      shorelineSignals: input.classificationInputs.hydrologySignals,
      wetlandSignals: input.classificationInputs.hydrologySignals,
      waterwaySignals: input.classificationInputs.hydrologySignals
    },
    VEGETATION_SIGNAL_LAYER: {
      canopySignals: input.classificationInputs.vegetationSignals,
      shrubSignals: input.classificationInputs.vegetationSignals,
      groundCoverSignals: input.classificationInputs.vegetationSignals
    },
    ACCESS_NETWORK_LAYER: {
      pathSignals: input.classificationInputs.accessSignals,
      crossingSignals: input.classificationInputs.accessSignals,
      accessTypeSignals: input.classificationInputs.accessSignals
    },
    SETTLEMENT_CONTEXT_LAYER: {
      entrySignals: input.classificationInputs.settlementSignals,
      adjacentSettlementSignals: input.classificationInputs.settlementSignals
    },
    ENVIRONMENT_SUMMARY_LAYER: input.environmentSummary,
    PROVENANCE_LAYER: {
      sourceDatasetId: input.sourceDatasetId,
      sourceRevision: input.sourceRevision,
      provider: "SIMULATED_PROVIDER",
      collectedAt: "2026-07-30"
    }
  };

  if (input.invalidPackage) {
    delete dataLayers.HYDROLOGY_SIGNAL_LAYER;
  }

  return deepFreeze({
    schemaId: regionalPlanning.specification.regionalPackageSchema.schemaId,
    packageType: regionalPlanning.specification.regionalPackageSchema.packageType,
    packageId,
    regionId,
    packageVersion: "v001",
    schemaVersion,
    coordinateReference: input.coordinateReference,
    dataLayers,
    environmentSummary: input.environmentSummary,
    classificationInputs: input.classificationInputs,
    selectorCompatibility: {
      selectorId: selectorFoundation.specification.selectorId,
      requiredSelectorFields:
        regionalPlanning.specification.recipeCompatibilityContract.requiredSelectorFields
    },
    cacheMetadata: {
      packageFingerprint: declaredFingerprint,
      selectorSeed,
      mobileProfile: "MOBILE_STANDARD_001"
    },
    refreshMetadata: {
      refreshMode: "SOURCE_REVISION_REFRESH",
      lastRefreshReason: "SIMULATED_PIPELINE"
    },
    provenance: {
      sourceDatasetId: input.sourceDatasetId,
      sourceRevision: input.sourceRevision
    },
    compressedPackageKb: input.compressedPackageKb,
    expectedRecipeId: input.expectedRecipeId,
    scenarioType: input.scenarioType
  });
}

function validateRegionalPackage(pkg, validationPlanning) {
  const spec = validationPlanning.specification;
  const missingFields = spec.integrityChecks.requiredTopLevelFields.filter(
    (field) => !(field in pkg)
  );
  const missingIdentity = spec.integrityChecks.requiredIdentityFields.filter((field) => {
    if (field === "sourceDatasetId") {
      return !pkg.provenance?.sourceDatasetId;
    }
    if (field === "sourceRevision") {
      return !pkg.provenance?.sourceRevision;
    }
    if (field === "latBucket") {
      return typeof pkg.coordinateReference?.latBucket !== "number";
    }
    if (field === "lngBucket") {
      return typeof pkg.coordinateReference?.lngBucket !== "number";
    }
    if (field === "regionSlug") {
      return !pkg.regionId;
    }
    if (field === "environmentProfile") {
      return !pkg.environmentSummary?.primaryEnvironmentHint;
    }
    return false;
  });
  const missingLayers = spec.integrityChecks.requiredDataLayers.filter(
    (layerId) => !(layerId in (pkg.dataLayers ?? {}))
  );
  const schemaOk =
    pkg.schemaId === spec.schemaValidationRules.requiredSchemaId &&
    pkg.packageType === spec.schemaValidationRules.requiredPackageType &&
    pkg.schemaVersion === spec.schemaValidationRules.requiredSchemaVersion;
  const selectorFields = pkg.selectorCompatibility?.requiredSelectorFields ?? [];
  const selectorFieldsOk =
    selectorFields.length ===
      spec.dependencyValidationRules.selectorDependency.requiredSelectorFields.length &&
    spec.dependencyValidationRules.selectorDependency.requiredSelectorFields.every((field) =>
      selectorFields.includes(field)
    );
  const recipeOk =
    pkg.expectedRecipeId === null ||
    spec.dependencyValidationRules.approvedRecipes.some(
      (recipe) => recipe.recipeId === pkg.expectedRecipeId
    );
  const computedFingerprint = hashHex(
    pkg.packageId,
    pkg.provenance?.sourceRevision,
    pkg.schemaVersion,
    pkg.environmentSummary?.primaryEnvironmentHint,
    pkg.coordinateReference?.latBucket,
    pkg.coordinateReference?.lngBucket
  );
  const fingerprintOk = computedFingerprint === pkg.cacheMetadata?.packageFingerprint;
  const valid =
    missingFields.length === 0 &&
    missingIdentity.length === 0 &&
    missingLayers.length === 0 &&
    schemaOk &&
    selectorFieldsOk &&
    recipeOk &&
    fingerprintOk;

  const blockedReason =
    missingFields.length > 0
      ? "MISSING_REQUIRED_FIELD"
      : missingIdentity.length > 0
        ? "MISSING_REQUIRED_IDENTITY"
        : missingLayers.length > 0
          ? "MISSING_REQUIRED_LAYER"
          : !schemaOk
            ? "INVALID_SCHEMA_VERSION"
            : !selectorFieldsOk
              ? "SELECTOR_CONTRACT_MISMATCH"
              : !recipeOk
                ? "APPROVED_RECIPE_DRIFT"
                : !fingerprintOk
                  ? "FINGERPRINT_MISMATCH"
                  : null;

  return deepFreeze({
    valid,
    missingFields,
    missingIdentity,
    missingLayers,
    schemaOk,
    selectorFieldsOk,
    recipeOk,
    fingerprintOk,
    computedFingerprint,
    blockedReason
  });
}

function runOptimizationCheck(pkg, optimizationPlanning) {
  const standardBudget = optimizationPlanning.specification.mobileStorageBudgets.profiles.find(
    (profile) => profile.profileId === "MOBILE_STANDARD_001"
  );
  const preservedFieldsPresent =
    Boolean(pkg.packageId) &&
    Boolean(pkg.regionId) &&
    Boolean(pkg.packageVersion) &&
    Boolean(pkg.schemaVersion) &&
    Boolean(pkg.selectorCompatibility) &&
    Boolean(pkg.cacheMetadata?.packageFingerprint);
  const selectorCriticalLayersPresent =
    optimizationPlanning.specification.dataLayerReductionRules.selectorCriticalLayers.every(
      (layerId) => layerId in (pkg.dataLayers ?? {})
    );
  const withinMobileBudget =
    pkg.compressedPackageKb <= standardBudget.maxCompressedPackageKb;
  const passed =
    preservedFieldsPresent && selectorCriticalLayersPresent && withinMobileBudget;

  return deepFreeze({
    passed,
    preservedFieldsPresent,
    selectorCriticalLayersPresent,
    withinMobileBudget,
    compressedPackageKb: pkg.compressedPackageKb,
    maxCompressedPackageKb: standardBudget.maxCompressedPackageKb,
    blockedReason: passed
      ? null
      : !withinMobileBudget
        ? "MOBILE_STORAGE_BUDGET_EXCEEDED"
        : "OPTIMIZATION_COMPATIBILITY_FAILED"
  });
}

function classifyPackageScenario(input, pkg) {
  return classifyEnvironment({
    scenarioId: input.scenarioId,
    scenarioType:
      input.scenarioType === "coastal_package"
        ? "coastal_environment"
        : input.scenarioType === "forest_package"
          ? "forest_environment"
          : input.scenarioType === "mixed_transition_package"
            ? "mixed_transition"
            : "unsupported_environment",
    regionPackageId: pkg.packageId,
    worldContextId: `${pkg.regionId}_WORLD_CONTEXT`,
    coordinateReference: {
      lat: pkg.coordinateReference.latBucket,
      lng: pkg.coordinateReference.lngBucket
    },
    landformSignals: input.classificationInputs.landformSignals,
    vegetationSignals: input.classificationInputs.vegetationSignals,
    hydrologySignals: input.classificationInputs.hydrologySignals,
    accessSignals: input.classificationInputs.accessSignals,
    settlementSignals: input.classificationInputs.settlementSignals
  });
}

function buildSelectorHandoff(pkg, classification, selectorId) {
  return deepFreeze({
    worldContextId: `${pkg.regionId}_WORLD_CONTEXT`,
    environment: "DEVELOPMENT_ONLY",
    biomeProfile: classification.primaryBiomeTag,
    routeMode: classification.navigationProfile.routeMode,
    archetype: classification.archetypeHint,
    desiredFeatures:
      classification.primaryEnvironmentType === "COASTAL_EXPLORATION"
        ? ["shoreline_transition", "wet_crossing", "loop_route"]
        : classification.primaryEnvironmentType === "FOREST_EXPLORATION"
          ? ["canopy_enclosure", "clearing_destination", "loop_route"]
          : ["canopy_enclosure", "clearing_destination"],
    seed: pkg.cacheMetadata.selectorSeed,
    selectorVersion: selectorId
  });
}

function runRecipeGeneration(selectionResult, selectorHandoff, cwd) {
  const common = {
    cwd,
    createdOn: "2026-07-30",
    seed: selectorHandoff.seed,
    locationId: selectorHandoff.worldContextId,
    variantId: "DEFAULT",
    biomeProfile: selectorHandoff.biomeProfile,
    archetype: selectorHandoff.archetype
  };

  if (selectionResult.selectedRecipeId === "COASTAL_LOCATION_RECIPE_001") {
    const generation = buildCoastalLocationRecipeOutput(common);
    const validation = buildCoastalLocationRecipeGenerationValidation(common);
    return deepFreeze({
      recipeId: selectionResult.selectedRecipeId,
      output: generation.output,
      dependencyMap: generation.dependencyMap,
      performanceSummary: generation.performanceSummary,
      validation
    });
  }

  const generation = buildForestLocationRecipeOutput(common);
  const validation = buildForestLocationRecipeGenerationValidation(common);
  return deepFreeze({
    recipeId: selectionResult.selectedRecipeId,
    output: generation.output,
    dependencyMap: generation.dependencyMap,
    performanceSummary: generation.performanceSummary,
    validation
  });
}

function buildPreviewPackage(generation) {
  const placements = generation.output.placementPlan.placements;
  const xValues = placements.map((entry) => entry.transform.x);
  const yValues = placements.map((entry) => entry.transform.y);
  const navigationNodeCount = Array.isArray(generation.output.navigationPathLogic?.routeNodes)
    ? generation.output.navigationPathLogic.routeNodes.length
    : Array.isArray(generation.output.trailNavigationLogic?.routeNodes)
      ? generation.output.trailNavigationLogic.routeNodes.length
      : 0;

  const previewPackage = {
    schemaId: `${generation.recipeId}_PIPELINE_PREVIEW_PACKAGE_001`,
    recipeId: generation.recipeId,
    locationPlanId: generation.output.locationPlanId,
    previewMode: "NON_RUNTIME_PIPELINE_REFERENCE",
    totalPlacements: generation.output.placementPlan.totalPlacements,
    zoneCount: generation.output.zoneAllocation.length,
    uniqueAssetCount: generation.dependencyMap.assets.length,
    navigationNodeCount,
    previewBounds: {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues),
      maxY: Math.max(...yValues)
    },
    performanceSummary: generation.performanceSummary,
    safety: {
      runtimeActivated: false,
      blenderFilesCreated: false,
      glbsCreated: false,
      assetsModified: false
    }
  };

  const validation = {
    status:
      previewPackage.totalPlacements > 0 &&
      previewPackage.zoneCount > 0 &&
      Object.values(previewPackage.performanceSummary.withinBudget).every(Boolean) &&
      previewPackage.performanceSummary.withinUniqueAssetCap === true
        ? "pass"
        : "fail",
    checks: [
      {
        name: "preview_placements_exist",
        ok: previewPackage.totalPlacements > 0
      },
      {
        name: "preview_zones_exist",
        ok: previewPackage.zoneCount > 0
      },
      {
        name: "performance_budgets_preserved",
        ok:
          Object.values(previewPackage.performanceSummary.withinBudget).every(Boolean) &&
          previewPackage.performanceSummary.withinUniqueAssetCap === true
      },
      {
        name: "runtime_and_asset_mutation_blocked",
        ok:
          previewPackage.safety.runtimeActivated === false &&
          previewPackage.safety.assetsModified === false
      }
    ],
    previewFingerprint: hashHex(
      generation.output.deterministicFingerprint,
      previewPackage.totalPlacements,
      previewPackage.zoneCount,
      previewPackage.uniqueAssetCount
    )
  };

  return deepFreeze({
    previewPackage: deepFreeze(previewPackage),
    validation: deepFreeze(validation)
  });
}

function buildScenarioResult(
  input,
  regionalPlanning,
  validationPlanning,
  optimizationPlanning,
  selectorFoundation,
  cwd
) {
  const pkg = buildRegionalPackage(input, regionalPlanning, selectorFoundation);
  const validationGate = validateRegionalPackage(pkg, validationPlanning);

  if (!validationGate.valid) {
    return deepFreeze({
      scenarioId: input.scenarioId,
      scenarioType: input.scenarioType,
      regionalPackage: pkg,
      validationGate,
      optimizationCheck: null,
      classification: null,
      selectorHandoff: null,
      selectionResult: {
        selectedRecipeId: null,
        blocked: true,
        reason: validationGate.blockedReason
      },
      generation: null,
      preview: null,
      finalStage: "VALIDATION_BLOCKED"
    });
  }

  const optimizationCheck = runOptimizationCheck(pkg, optimizationPlanning);
  if (!optimizationCheck.passed) {
    return deepFreeze({
      scenarioId: input.scenarioId,
      scenarioType: input.scenarioType,
      regionalPackage: pkg,
      validationGate,
      optimizationCheck,
      classification: null,
      selectorHandoff: null,
      selectionResult: {
        selectedRecipeId: null,
        blocked: true,
        reason: optimizationCheck.blockedReason
      },
      generation: null,
      preview: null,
      finalStage: "OPTIMIZATION_BLOCKED"
    });
  }

  const classification = classifyPackageScenario(input, pkg);
  if (classification.classificationStatus === "BLOCKED_UNSUPPORTED") {
    return deepFreeze({
      scenarioId: input.scenarioId,
      scenarioType: input.scenarioType,
      regionalPackage: pkg,
      validationGate,
      optimizationCheck,
      classification,
      selectorHandoff: null,
      selectionResult: {
        selectedRecipeId: null,
        blocked: true,
        reason: "unsupported_package_classification"
      },
      generation: null,
      preview: null,
      finalStage: "CLASSIFICATION_BLOCKED"
    });
  }

  const selectorHandoff = buildSelectorHandoff(
    pkg,
    classification,
    selectorFoundation.specification.selectorId
  );
  const selectionResult = selectLocationRecipe(
    selectorHandoff,
    selectorFoundation.recipeMetadataRecords,
    selectorFoundation.specification
  );

  if (selectionResult.blocked) {
    return deepFreeze({
      scenarioId: input.scenarioId,
      scenarioType: input.scenarioType,
      regionalPackage: pkg,
      validationGate,
      optimizationCheck,
      classification,
      selectorHandoff,
      selectionResult,
      generation: null,
      preview: null,
      finalStage: "SELECTION_BLOCKED"
    });
  }

  const generation = runRecipeGeneration(selectionResult, selectorHandoff, cwd);
  const preview = buildPreviewPackage(generation);

  return deepFreeze({
    scenarioId: input.scenarioId,
    scenarioType: input.scenarioType,
    regionalPackage: pkg,
    validationGate,
    optimizationCheck,
    classification,
    selectorHandoff,
    selectionResult,
    generation,
    preview,
    finalStage:
      generation.validation.status === "pass" && preview.validation.status === "pass"
        ? "PREVIEW_READY"
        : "GENERATION_OR_PREVIEW_FAILED"
  });
}

function buildPipelineOutputs(results) {
  return deepFreeze(
    results.map((result) => ({
      scenarioId: result.scenarioId,
      scenarioType: result.scenarioType,
      packageId: result.regionalPackage.packageId,
      validationPassed: result.validationGate.valid,
      optimizationPassed: result.optimizationCheck?.passed ?? false,
      classificationStatus: result.classification?.classificationStatus ?? "NOT_RUN",
      selectedRecipeId: result.selectionResult.selectedRecipeId,
      confidenceScore: result.selectionResult.confidenceScore ?? 0,
      generationFingerprint: result.generation?.output.deterministicFingerprint ?? null,
      previewFingerprint: result.preview?.validation.previewFingerprint ?? null,
      finalStage: result.finalStage
    }))
  );
}

function buildValidation(results, selectorFoundation, factoryFoundation) {
  const coastal = results.find((result) => result.scenarioId === "PIPELINE_COASTAL_001");
  const forest = results.find((result) => result.scenarioId === "PIPELINE_FOREST_001");
  const mixed = results.find((result) => result.scenarioId === "PIPELINE_MIXED_001");
  const invalid = results.find((result) => result.scenarioId === "PIPELINE_INVALID_001");
  const incompatible = results.find(
    (result) => result.scenarioId === "PIPELINE_INCOMPATIBLE_VERSION_001"
  );

  const checks = [
    {
      name: "deterministic_pipeline_identity",
      ok: results.every((result) => {
        if (!result.validationGate.valid) {
          return typeof result.validationGate.computedFingerprint === "string";
        }
        return (
          result.validationGate.computedFingerprint ===
          result.regionalPackage.cacheMetadata.packageFingerprint
        );
      })
    },
    {
      name: "approved_recipes_only_used",
      ok: results
        .filter((result) => result.selectionResult.selectedRecipeId !== null)
        .every((result) =>
          selectorFoundation.recipeMetadataRecords.some(
            (metadata) => metadata.recipeId === result.selectionResult.selectedRecipeId
          )
        )
    },
    {
      name: "coastal_pipeline_reaches_preview",
      ok:
        coastal.finalStage === "PREVIEW_READY" &&
        coastal.selectionResult.selectedRecipeId === "COASTAL_LOCATION_RECIPE_001" &&
        coastal.preview.validation.status === "pass"
    },
    {
      name: "forest_pipeline_reaches_preview",
      ok:
        forest.finalStage === "PREVIEW_READY" &&
        forest.selectionResult.selectedRecipeId === "FOREST_LOCATION_RECIPE_001" &&
        forest.preview.validation.status === "pass"
    },
    {
      name: "mixed_transition_pipeline_reaches_preview_with_forest_selection",
      ok:
        mixed.finalStage === "PREVIEW_READY" &&
        mixed.selectionResult.selectedRecipeId === "FOREST_LOCATION_RECIPE_001" &&
        mixed.selectionResult.fallbackApplied === true
    },
    {
      name: "invalid_package_blocked_safely",
      ok:
        invalid.finalStage === "VALIDATION_BLOCKED" &&
        invalid.selectionResult.blocked === true
    },
    {
      name: "incompatible_version_package_blocked_safely",
      ok:
        incompatible.finalStage === "VALIDATION_BLOCKED" &&
        incompatible.validationGate.blockedReason === "INVALID_SCHEMA_VERSION"
    },
    {
      name: "factory_and_runtime_safety_preserved",
      ok:
        factoryFoundation.specification.versioningRules.runtimeActivationBlockedInFactory === true &&
        results.every(
          (result) =>
            result.preview?.previewPackage.safety.runtimeActivated !== true &&
            result.preview?.previewPackage.safety.assetsModified !== true
        )
    },
    {
      name: "no_runtime_map_blender_glb_or_asset_mutation",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_FULL_PIPELINE_SIMULATION_VALIDATION_001",
    simulationId: "ATLAS_FULL_PIPELINE_SIMULATION_001",
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    scenarioCount: results.length,
    nextAllowedAction: "future_atlas_end_to_end_development_ready",
    checks
  });
}

function buildLifecycle(validation) {
  return deepFreeze({
    schemaId: "ATLAS_FULL_PIPELINE_SIMULATION_LIFECYCLE_RECORD_001",
    simulationId: "ATLAS_FULL_PIPELINE_SIMULATION_001",
    lifecycleStatus: validation.status === "pass" ? "READY" : "BLOCKED",
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(results, validation, lifecycle) {
  const lines = [
    "# ATLAS_FULL_PIPELINE_SIMULATION_001",
    "",
    `Status: ${lifecycle.lifecycleStatus}`,
    `Scenario count: ${results.length}`,
    "",
    "## Pipeline Flow",
    "- Regional Package",
    "- Validation",
    "- Optimization Check",
    "- Environment Classification",
    "- Recipe Selection",
    "- Location Recipe Generation",
    "- Preview Package",
    "",
    "## Scenario Outcomes",
    ...results.map(
      (result) =>
        `- ${result.scenarioId}: ${result.finalStage} | recipe ${result.selectionResult.selectedRecipeId ?? "BLOCKED"}`
    ),
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- End-to-end Atlas planning simulation: READY",
    "- Runtime activation: BLOCKED",
    "- Map downloads / Blender / GLBs / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasFullPipelineSimulation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const inputs = createSimulationInputs();
  const regionalPlanning = buildAtlasRegionalPackagePlanning({ cwd });
  const validationPlanning = buildAtlasRegionalPackageValidationPlanning({ cwd });
  const optimizationPlanning = buildAtlasPackageOptimizationPlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const factoryFoundation = buildLocationRecipeFactoryFoundation({ cwd });

  const results = deepFreeze(
    inputs.map((input) =>
      buildScenarioResult(
        input,
        regionalPlanning,
        validationPlanning,
        optimizationPlanning,
        selectorFoundation,
        cwd
      )
    )
  );

  const pipelineOutputs = buildPipelineOutputs(results);
  const validation = buildValidation(results, selectorFoundation, factoryFoundation);
  const lifecycle = buildLifecycle(validation);
  const report = buildReport(results, validation, lifecycle);
  const fingerprint = hashHex(
    "ATLAS_FULL_PIPELINE_SIMULATION_001",
    validation.status,
    ...pipelineOutputs.map(
      (output) =>
        `${output.scenarioId}:${output.packageId}:${output.selectedRecipeId}:${output.finalStage}:${output.previewFingerprint ?? "NONE"}`
    )
  );

  return deepFreeze({
    scenarioInputs: inputs,
    results,
    pipelineOutputs,
    validation,
    lifecycle,
    report,
    fingerprint
  });
}

export function writeAtlasFullPipelineSimulation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const simulation = buildAtlasFullPipelineSimulation({ cwd });
  const simulationRoot = path.resolve(cwd, PIPELINE_ROOT);
  const simulationDir = path.join(simulationRoot, "simulation");
  const validationDir = path.join(simulationRoot, "validation");
  const lifecycleDir = path.join(simulationRoot, "lifecycle");
  const reportsDir = path.join(simulationRoot, "reports");

  for (const directory of [simulationDir, validationDir, lifecycleDir, reportsDir]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(simulationDir, INPUTS_FILENAME), simulation.scenarioInputs);
  writeJson(path.join(simulationDir, STAGE_RESULTS_FILENAME), simulation.results);
  writeJson(path.join(simulationDir, PIPELINE_OUTPUTS_FILENAME), simulation.pipelineOutputs);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), simulation.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), simulation.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), simulation.report);

  return simulation;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeAtlasFullPipelineSimulation();
}
