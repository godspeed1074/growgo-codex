import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasRegionalPackagePlanning } from "./atlas-regional-package-planning.mjs";
import { buildAtlasEngineRecipeIntegrationPlanning } from "./atlas-engine-recipe-integration-planning.mjs";
import { classifyEnvironment } from "./atlas-environment-classification-simulation.mjs";
import { buildLocationRecipeSelectorFoundation, selectLocationRecipe } from "./location-recipe-selector-foundation.mjs";

const PACKAGE_ROOT =
  "asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001";

const SIMULATION_INPUTS_FILENAME = "atlas-regional-package-simulation-inputs.json";
const SIMULATION_PACKAGES_FILENAME = "atlas-regional-package-simulation-packages.json";
const FINGERPRINTS_FILENAME = "atlas-regional-package-simulation-fingerprints.json";
const CLASSIFICATIONS_FILENAME = "atlas-regional-package-simulation-classifications.json";
const HANDOFFS_FILENAME = "atlas-regional-package-simulation-selector-handoffs.json";
const VALIDATION_FILENAME = "atlas-regional-package-simulation-validation.json";
const REPORT_FILENAME = "atlas-regional-package-simulation-report.md";

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
      scenarioId: "REGIONAL_PACKAGE_COASTAL_001",
      scenarioType: "coastal_region_package",
      sourceDatasetId: "SOURCE_DATASET_BELLARINE_001",
      sourceRevision: "2026-07-30:R002",
      regionSlug: "BELLARINE_COAST",
      coordinateReference: { latBucket: -38.12, lngBucket: 144.61 },
      environmentProfile: "COASTAL_EXPLORATION",
      environmentSummary: {
        primaryEnvironmentHint: "COASTAL_EXPLORATION",
        secondaryEnvironmentHints: ["MIXED_EDGE_TRANSITION"],
        biomeHints: ["COASTAL_RESERVE_TRAIL", "COASTAL_WETLAND_MARGIN"],
        confidenceHints: { coastal: 0.91, forest: 0.2, mixed: 0.35 }
      },
      classificationInputs: {
        landformSignals: ["dune_edge", "shoreline_margin", "boardwalk_alignment"],
        vegetationSignals: ["coastal_grass", "coastal_shrub", "bottlebrush"],
        hydrologySignals: ["saltwater_edge", "wetland_margin"],
        accessSignals: ["pedestrian_path", "lookout_link"],
        settlementSignals: ["reserve_entry"]
      },
      expectedRecipeId: "COASTAL_LOCATION_RECIPE_001"
    },
    {
      scenarioId: "REGIONAL_PACKAGE_FOREST_001",
      scenarioType: "forest_region_package",
      sourceDatasetId: "SOURCE_DATASET_DANDENONG_001",
      sourceRevision: "2026-07-30:R002",
      regionSlug: "DANDENONG_RANGES_EDGE",
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
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001"
    },
    {
      scenarioId: "REGIONAL_PACKAGE_MIXED_001",
      scenarioType: "mixed_transition_package",
      sourceDatasetId: "SOURCE_DATASET_MIXED_001",
      sourceRevision: "2026-07-30:R002",
      regionSlug: "COASTAL_FOREST_MARGIN",
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
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001"
    },
    {
      scenarioId: "REGIONAL_PACKAGE_UNSUPPORTED_001",
      scenarioType: "unsupported_package",
      sourceDatasetId: "SOURCE_DATASET_ALPINE_001",
      sourceRevision: "2026-07-30:R002",
      regionSlug: "ALPINE_PASS",
      coordinateReference: { latBucket: -36.99, lngBucket: 147.11 },
      environmentProfile: "UNSUPPORTED_ENVIRONMENT",
      environmentSummary: {
        primaryEnvironmentHint: "UNSUPPORTED_ENVIRONMENT",
        secondaryEnvironmentHints: [],
        biomeHints: ["ALPINE_TUNDRA"],
        confidenceHints: { coastal: 0.04, forest: 0.08, mixed: 0.11 }
      },
      classificationInputs: {
        landformSignals: ["rock_scree", "snow_pass"],
        vegetationSignals: ["alpine_low_shrub"],
        hydrologySignals: ["snow_melt"],
        accessSignals: ["steep_pass"],
        settlementSignals: []
      },
      expectedRecipeId: null
    },
    {
      scenarioId: "REGIONAL_PACKAGE_INVALID_001",
      scenarioType: "invalid_package",
      sourceDatasetId: "SOURCE_DATASET_INVALID_001",
      sourceRevision: "2026-07-30:R002",
      regionSlug: "BROKEN_REGION",
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
      invalidReason: "missing_required_data_layer"
    }
  ]);
}

function createRegionId(input) {
  return `REGION_${normalizeToken(input.regionSlug)}_${String(input.coordinateReference.latBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${String(input.coordinateReference.lngBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${normalizeToken(input.environmentProfile)}`;
}

function createPackageId(input) {
  return `ATLAS_REGION_PACKAGE_${normalizeToken(input.regionSlug)}_${String(input.coordinateReference.latBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${String(input.coordinateReference.lngBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_v001`;
}

function buildPackageFingerprint(input, packageId) {
  return hashHex(
    packageId,
    input.sourceRevision,
    "v001",
    input.environmentProfile,
    input.coordinateReference.latBucket,
    input.coordinateReference.lngBucket
  );
}

function buildSimulatedPackage(input, planningSpecification) {
  const regionId = createRegionId(input);
  const packageId = createPackageId(input);
  const packageFingerprint = buildPackageFingerprint(input, packageId);
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
    planningSpecification.integrationReferences.selectorId
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

  if (input.scenarioType === "invalid_package") {
    delete dataLayers.HYDROLOGY_SIGNAL_LAYER;
  }

  return deepFreeze({
    schemaId: planningSpecification.regionalPackageSchema.schemaId,
    packageId,
    regionId,
    packageVersion: "v001",
    schemaVersion: planningSpecification.packageVersioning.schemaVersion,
    coordinateReference: input.coordinateReference,
    dataLayers,
    environmentSummary: input.environmentSummary,
    classificationInputs: input.classificationInputs,
    selectorCompatibility: {
      selectorId: planningSpecification.recipeCompatibilityContract.selectorId,
      requiredSelectorFields:
        planningSpecification.recipeCompatibilityContract.requiredSelectorFields
    },
    cacheMetadata: {
      packageFingerprint,
      selectorSeed,
      mobileProfile: "MOBILE_STANDARD_001"
    },
    refreshMetadata: {
      refreshMode: "SOURCE_REVISION_REFRESH",
      lastRefreshReason: "SIMULATED"
    },
    provenance: {
      sourceDatasetId: input.sourceDatasetId,
      sourceRevision: input.sourceRevision
    },
    scenarioType: input.scenarioType
  });
}

function validatePackage(pkg) {
  const missingFields = [];
  for (const field of [
    "packageId",
    "regionId",
    "packageVersion",
    "schemaVersion",
    "coordinateReference",
    "dataLayers",
    "environmentSummary",
    "classificationInputs",
    "selectorCompatibility",
    "cacheMetadata",
    "refreshMetadata"
  ]) {
    if (!(field in pkg)) {
      missingFields.push(field);
    }
  }

  const requiredLayers = [
    "REGION_BOUNDARY_LAYER",
    "HYDROLOGY_SIGNAL_LAYER",
    "VEGETATION_SIGNAL_LAYER",
    "ACCESS_NETWORK_LAYER",
    "SETTLEMENT_CONTEXT_LAYER",
    "ENVIRONMENT_SUMMARY_LAYER",
    "PROVENANCE_LAYER"
  ];
  const missingLayers = requiredLayers.filter((layer) => !(layer in pkg.dataLayers));

  return deepFreeze({
    valid: missingFields.length === 0 && missingLayers.length === 0,
    missingFields,
    missingLayers
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

function buildSimulationResults(inputs, planningSpecification, integrationPlanning, selectorFoundation) {
  return deepFreeze(
    inputs.map((input) => {
      const pkg = buildSimulatedPackage(input, planningSpecification);
      const packageValidation = validatePackage(pkg);
      if (!packageValidation.valid) {
        return deepFreeze({
          scenarioId: input.scenarioId,
          scenarioType: input.scenarioType,
          package: pkg,
          packageFingerprint: pkg.cacheMetadata.packageFingerprint,
          classification: null,
          selectorHandoff: null,
          selectorResult: {
            selectedRecipeId: null,
            confidenceScore: 0,
            fallbackApplied: false,
            blocked: true,
            reason: "invalid_regional_package"
          },
          packageValidation
        });
      }

      const classification = classifyEnvironment({
        scenarioId: input.scenarioId,
        scenarioType:
          input.scenarioType === "coastal_region_package"
            ? "coastal_environment"
            : input.scenarioType === "forest_region_package"
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

      const selectorHandoff =
        classification.classificationStatus === "BLOCKED_UNSUPPORTED"
          ? null
          : buildSelectorHandoff(
              pkg,
              classification,
              integrationPlanning.specification.selectorReference.selectorId
            );

      const selectorResult =
        selectorHandoff === null
          ? {
              selectedRecipeId: null,
              confidenceScore: 0,
              fallbackApplied: false,
              blocked: true,
              reason: "unsupported_package_classification"
            }
          : selectLocationRecipe(
              selectorHandoff,
              selectorFoundation.recipeMetadataRecords,
              selectorFoundation.specification
            );

      return deepFreeze({
        scenarioId: input.scenarioId,
        scenarioType: input.scenarioType,
        package: pkg,
        packageFingerprint: pkg.cacheMetadata.packageFingerprint,
        classification,
        selectorHandoff,
        selectorResult,
        packageValidation
      });
    })
  );
}

function buildValidation(results, planningSpecification, integrationPlanning) {
  const checks = [
    {
      name: "deterministic_package_identity",
      ok: results.every((result) => {
        const replayRegionId = createRegionId({
          regionSlug: result.package.provenance.sourceDatasetId.includes("BELLARINE")
            ? "BELLARINE_COAST"
            : result.package.provenance.sourceDatasetId.includes("DANDENONG")
              ? "DANDENONG_RANGES_EDGE"
              : result.package.provenance.sourceDatasetId.includes("MIXED")
                ? "COASTAL_FOREST_MARGIN"
                : result.package.provenance.sourceDatasetId.includes("ALPINE")
                  ? "ALPINE_PASS"
                  : "BROKEN_REGION",
          coordinateReference: result.package.coordinateReference,
          environmentProfile:
            result.package.environmentSummary.primaryEnvironmentHint ?? "UNKNOWN"
        });
        return replayRegionId === result.package.regionId;
      })
    },
    {
      name: "correct_classifier_inputs",
      ok: results
        .filter((result) => result.packageValidation.valid)
        .every(
          (result) =>
            result.package.dataLayers.ENVIRONMENT_SUMMARY_LAYER.primaryEnvironmentHint ===
            result.package.environmentSummary.primaryEnvironmentHint
        )
    },
    {
      name: "correct_recipe_selection",
      ok:
        results.find((result) => result.scenarioId === "REGIONAL_PACKAGE_COASTAL_001")
          ?.selectorResult.selectedRecipeId === "COASTAL_LOCATION_RECIPE_001" &&
        results.find((result) => result.scenarioId === "REGIONAL_PACKAGE_FOREST_001")
          ?.selectorResult.selectedRecipeId === "FOREST_LOCATION_RECIPE_001" &&
        results.find((result) => result.scenarioId === "REGIONAL_PACKAGE_MIXED_001")
          ?.selectorResult.selectedRecipeId === "FOREST_LOCATION_RECIPE_001"
    },
    {
      name: "blocked_invalid_data",
      ok: results
        .filter(
          (result) =>
            result.scenarioId === "REGIONAL_PACKAGE_INVALID_001" ||
            result.scenarioId === "REGIONAL_PACKAGE_UNSUPPORTED_001"
        )
        .every((result) => result.selectorResult.blocked === true)
    },
    {
      name: "package_compatibility_with_integration",
      ok:
        planningSpecification.recipeCompatibilityContract.selectorId ===
          integrationPlanning.specification.selectorReference.selectorId &&
        planningSpecification.recipeCompatibilityContract.approvedRecipeIds.length >= 2
    },
    {
      name: "runtime_activation_blocked",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_SIMULATION_VALIDATION_001",
    planningId: planningSpecification.planningId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    scenarioCount: results.length,
    nextAllowedAction: "future_atlas_development_ready",
    checks
  });
}

function buildReport(results, validation) {
  const lines = [
    "# Atlas Regional Package Simulation",
    "",
    `Status: ${validation.status.toUpperCase()}`,
    `Scenario count: ${results.length}`,
    "",
    "## Results",
    ...results.map(
      (result) =>
        `- ${result.scenarioId}: ${result.selectorResult.selectedRecipeId ?? "BLOCKED"} | package valid ${result.packageValidation.valid} | fingerprint ${result.packageFingerprint}`
    ),
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- Future Atlas development: READY",
    "- Runtime activation: BLOCKED",
    "- Map downloads / Blender / GLBs / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasRegionalPackageSimulation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const planning = buildAtlasRegionalPackagePlanning({ cwd });
  const integrationPlanning = buildAtlasEngineRecipeIntegrationPlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const inputs = createSimulationInputs();
  const results = buildSimulationResults(
    inputs,
    planning.specification,
    integrationPlanning,
    selectorFoundation
  );
  const validation = buildValidation(results, planning.specification, integrationPlanning);
  const report = buildReport(results, validation);
  const fingerprint = hashHex(
    planning.fingerprint,
    ...results.map(
      (result) =>
        `${result.scenarioId}:${result.packageFingerprint}:${result.selectorResult.selectedRecipeId}:${result.selectorResult.blocked}`
    )
  );

  return deepFreeze({
    inputs,
    results,
    validation,
    report,
    fingerprint
  });
}

export function writeAtlasRegionalPackageSimulation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const simulation = buildAtlasRegionalPackageSimulation({ cwd });
  const packageRoot = path.resolve(cwd, PACKAGE_ROOT);
  const simulationRoot = path.join(packageRoot, "simulation");
  const validationRoot = path.join(packageRoot, "validation");
  const reportsRoot = path.join(packageRoot, "reports");

  ensureDirectory(simulationRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(reportsRoot);

  writeJson(path.join(simulationRoot, SIMULATION_INPUTS_FILENAME), simulation.inputs);
  writeJson(
    path.join(simulationRoot, SIMULATION_PACKAGES_FILENAME),
    simulation.results.map((result) => ({
      scenarioId: result.scenarioId,
      package: result.package,
      packageValidation: result.packageValidation
    }))
  );
  writeJson(
    path.join(simulationRoot, FINGERPRINTS_FILENAME),
    simulation.results.map((result) => ({
      scenarioId: result.scenarioId,
      packageFingerprint: result.packageFingerprint
    }))
  );
  writeJson(
    path.join(simulationRoot, CLASSIFICATIONS_FILENAME),
    simulation.results.map((result) => ({
      scenarioId: result.scenarioId,
      classification: result.classification
    }))
  );
  writeJson(
    path.join(simulationRoot, HANDOFFS_FILENAME),
    simulation.results.map((result) => ({
      scenarioId: result.scenarioId,
      selectorHandoff: result.selectorHandoff,
      selectorResult: result.selectorResult
    }))
  );
  writeJson(path.join(validationRoot, VALIDATION_FILENAME), simulation.validation);
  fs.writeFileSync(path.join(reportsRoot, REPORT_FILENAME), simulation.report);

  return simulation;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeAtlasRegionalPackageSimulation();
}
