import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import {
  buildLocationRecipeSelectorFoundation,
  selectLocationRecipe
} from "./location-recipe-selector-foundation.mjs";

const SELECTOR_ROOT =
  "asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001";
const INTEGRATION_ROOT =
  "asset-factory-workspace/atlas-integration/ATLAS_ENGINE_RECIPE_INTEGRATION_001";

const SELECTOR_SPECIFICATION_FILENAME =
  "location-recipe-selector-specification.json";
const SELECTOR_LIBRARY_FILENAME = "location-recipe-selector-library.json";
const SELECTOR_VALIDATION_FILENAME = "location-recipe-selector-validation.json";
const SELECTOR_SIMULATION_VALIDATION_FILENAME =
  "location-recipe-selector-simulation-validation.json";

const SPECIFICATION_FILENAME = "atlas-engine-recipe-integration-specification.json";
const VALIDATION_FILENAME = "atlas-engine-recipe-integration-validation.json";
const LIFECYCLE_FILENAME = "atlas-engine-recipe-integration-lifecycle-record.json";
const REPORT_FILENAME = "atlas-engine-recipe-integration-architecture-report.md";

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

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function loadSelectorInputs(cwd) {
  const selectorRoot = path.resolve(cwd, SELECTOR_ROOT);
  const selectorSpecification = readJson(
    path.join(selectorRoot, "specification", SELECTOR_SPECIFICATION_FILENAME)
  );
  const selectorLibrary = readJson(
    path.join(selectorRoot, "metadata", SELECTOR_LIBRARY_FILENAME)
  );
  const selectorValidation = readJson(
    path.join(selectorRoot, "validation", SELECTOR_VALIDATION_FILENAME)
  );
  const selectorSimulationValidation = readJson(
    path.join(selectorRoot, "validation", SELECTOR_SIMULATION_VALIDATION_FILENAME)
  );

  if (selectorValidation.status !== "pass") {
    throw new Error(
      "Atlas Engine recipe integration planning blocked: selector validation must pass."
    );
  }
  if (selectorSimulationValidation.status !== "pass") {
    throw new Error(
      "Atlas Engine recipe integration planning blocked: selector simulation validation must pass."
    );
  }

  return {
    selectorRoot,
    selectorSpecification,
    selectorLibrary,
    selectorValidation,
    selectorSimulationValidation
  };
}

function buildEnvironmentClassificationSchema() {
  return deepFreeze({
    schemaId: "ATLAS_ENVIRONMENT_CLASSIFICATION_SCHEMA_001",
    classifierId: "ATLAS_ENVIRONMENT_CLASSIFIER_001",
    sourceTruthPolicy: "REAL_WORLD_ENVIRONMENT_DATA_IS_AUTHORITATIVE",
    requiredInputFields: [
      "regionPackageId",
      "worldContextId",
      "coordinateReference",
      "landformSignals",
      "vegetationSignals",
      "hydrologySignals",
      "accessSignals",
      "settlementSignals"
    ],
    classificationFields: [
      "primaryEnvironmentType",
      "secondaryEnvironmentType",
      "primaryBiomeTag",
      "secondaryBiomeTags",
      "navigationProfile",
      "archetypeHint",
      "environmentConfidence"
    ],
    supportedEnvironmentTypes: [
      "COASTAL_EXPLORATION",
      "FOREST_EXPLORATION",
      "MIXED_EDGE_TRANSITION"
    ],
    unsupportedEnvironmentHandling: {
      mode: "BLOCK_SELECTION",
      reasonCode: "UNSUPPORTED_ENVIRONMENT_CLASSIFICATION"
    }
  });
}

function buildBiomeTaggingRules() {
  return deepFreeze({
    schemaId: "ATLAS_BIOME_TAGGING_RULES_001",
    primaryBiomeResolutionOrder: [
      "water_edge_and_dune_signals",
      "forest_canopy_and_understory_signals",
      "mixed_transition_signals"
    ],
    tagMappings: [
      {
        environmentType: "COASTAL_EXPLORATION",
        allowedBiomeTags: [
          "COASTAL_DUNE_EDGE",
          "COASTAL_WETLAND_MARGIN",
          "COASTAL_RESERVE_TRAIL",
          "COASTAL_CLIFF_LOOKOUT",
          "COASTAL_CREEK_MOUTH"
        ],
        preferredRecipes: ["COASTAL_LOCATION_RECIPE_001"]
      },
      {
        environmentType: "FOREST_EXPLORATION",
        allowedBiomeTags: [
          "TEMPERATE_FOREST_EDGE",
          "FOREST_TRACK_CLEARING",
          "WOODLAND_RESERVE_LOOP"
        ],
        preferredRecipes: ["FOREST_LOCATION_RECIPE_001"]
      },
      {
        environmentType: "MIXED_EDGE_TRANSITION",
        allowedBiomeTags: [
          "COASTAL_WETLAND_MARGIN",
          "TEMPERATE_FOREST_COASTAL_MARGIN",
          "FOREST_EDGE_TRANSITION"
        ],
        preferredRecipes: [
          "COASTAL_LOCATION_RECIPE_001",
          "FOREST_LOCATION_RECIPE_001"
        ]
      }
    ],
    disallowedBiomeTags: ["ALPINE_TUNDRA", "INLAND_FARMLAND", "URBAN_MAIN_STREET"]
  });
}

function buildSelectorInputContract(selectorSpecification) {
  return deepFreeze({
    schemaId: "ATLAS_SELECTOR_INPUT_CONTRACT_001",
    selectorId: selectorSpecification.selectorId,
    requiredFields: selectorSpecification.selectionInputSchema.requiredFields,
    mappedFromEnvironmentClassification: {
      worldContextId: "region_package.worldContextId",
      environment: "environment_separation.currentEnvironment",
      biomeProfile: "environment_classification.primaryBiomeTag",
      routeMode: "navigation_profile.routeMode",
      archetype: "environment_classification.archetypeHint",
      desiredFeatures: "environment_feature_inference.desiredFeatures",
      seed: "coordinate_seed_contract.selectorSeed"
    },
    optionalFields: {
      selectorVersion: selectorSpecification.selectorId,
      preferredRecipeId: "environment_feature_inference.preferredRecipeId"
    },
    preconditions: [
      "environment must be DEVELOPMENT_ONLY",
      "recipe selector validation must pass",
      "recipe selector simulation validation must pass",
      "runtime activation remains false"
    ]
  });
}

function buildConfidenceThresholds() {
  return deepFreeze({
    schemaId: "ATLAS_RECIPE_SELECTION_CONFIDENCE_THRESHOLDS_001",
    directSelectionMinimum: 60,
    approvedFallbackMinimum: 35,
    ambiguityReviewBand: {
      min: 35,
      max: 84
    },
    unsupportedBelow: 35,
    interpretation: {
      highConfidence: "Direct biome/archetype alignment. Safe to choose approved recipe without manual review.",
      mediumConfidence:
        "Approved fallback allowed. Selection is deterministic but should be visible in preview planning.",
      lowConfidence: "Block selection and require new recipe or classifier update."
    }
  });
}

function buildFallbackStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_RECIPE_SELECTION_FALLBACK_STRATEGY_001",
    approvedRecipesOnly: true,
    fallbackOrder: [
      "same_biome_tag",
      "same_biome_family",
      "highest_confidence_approved_recipe"
    ],
    blockedWhen: [
      "confidence below approvedFallbackMinimum",
      "environment not DEVELOPMENT_ONLY",
      "recipe not APPROVED_CURRENT",
      "selector version incompatibility",
      "runtime activation requested"
    ],
    supportedOutcomes: [
      "DIRECT_RECIPE_SELECTION",
      "APPROVED_RECIPE_FALLBACK",
      "BLOCK_UNSUPPORTED_CONTEXT"
    ]
  });
}

function buildCoordinateSeedRules() {
  return deepFreeze({
    schemaId: "ATLAS_COORDINATE_RECIPE_SEED_RULES_001",
    seedPolicy: "DETERMINISTIC_COORDINATE_HASH",
    requiredSeedInputs: [
      "regionPackageId",
      "worldContextId",
      "coordinateReference.latBucket",
      "coordinateReference.lngBucket",
      "primaryBiomeTag",
      "archetypeHint",
      "selectorVersion"
    ],
    formula:
      "hash(regionPackageId, worldContextId, latBucket, lngBucket, primaryBiomeTag, archetypeHint, selectorVersion)",
    replayGuarantees: [
      "same region package and coordinate bucket yield same selector seed",
      "same selector seed yields same approved recipe result",
      "seed changes only when classification-relevant context changes"
    ],
    coordinateBucketing: {
      latBucketPrecisionDegrees: 0.01,
      lngBucketPrecisionDegrees: 0.01,
      bucketPurpose: "stabilize recipe selection against insignificant coordinate jitter"
    }
  });
}

function buildRegionalPackageCompatibility() {
  return deepFreeze({
    schemaId: "ATLAS_REGION_PACKAGE_COMPATIBILITY_001",
    acceptedSources: [
      "GROWGO_REGION_IMPORT_PACKAGE_001",
      "future_runtime_region_packages",
      "prepared_real_world_region_packages"
    ],
    requiredPackageFields: [
      "regionPackageId",
      "packageVersion",
      "coordinateReference",
      "environmentSummary",
      "classificationInputs"
    ],
    packageBoundaryRules: [
      "Atlas may classify and choose approved recipes",
      "Atlas must not modify package geometry",
      "Atlas must not invent map features",
      "Atlas must not activate runtime rendering from planning phase"
    ]
  });
}

function buildIntegrationBoundaries() {
  return deepFreeze({
    schemaId: "ATLAS_ENGINE_RECIPE_INTEGRATION_BOUNDARIES_001",
    planningLayerOnly: true,
    allowedResponsibilities: [
      "classify environment",
      "derive biome tags",
      "construct selector input contract",
      "choose approved recipe deterministically",
      "record confidence and fallback state"
    ],
    blockedResponsibilities: [
      "runtime activation",
      "map attachment",
      "renderer execution",
      "asset modification",
      "recipe mutation",
      "package geometry mutation"
    ],
    futureAtlasBoundary: {
      integrationPoint: "selector_input_contract_to_LOCATION_RECIPE_SELECTOR_001",
      outputProduct: "approved_recipe_selection_plan",
      runtimeStillBlocked: true
    }
  });
}

function buildIntegrationSpecification(selectorInputs, selectorFoundation) {
  const environmentClassificationSchema = buildEnvironmentClassificationSchema();
  const biomeTaggingRules = buildBiomeTaggingRules();
  const selectorInputContract = buildSelectorInputContract(
    selectorInputs.selectorSpecification
  );
  const confidenceThresholds = buildConfidenceThresholds();
  const fallbackStrategy = buildFallbackStrategy();
  const coordinateSeedRules = buildCoordinateSeedRules();
  const regionalPackageCompatibility = buildRegionalPackageCompatibility();
  const integrationBoundaries = buildIntegrationBoundaries();

  return deepFreeze({
    schemaId: "ATLAS_ENGINE_RECIPE_INTEGRATION_SPECIFICATION_001",
    integrationId: "ATLAS_ENGINE_RECIPE_INTEGRATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    selectorReference: {
      selectorId: selectorInputs.selectorSpecification.selectorId,
      approvedRecipeCount: selectorInputs.selectorLibrary.recipeCount,
      approvedRecipeIds: selectorFoundation.recipeMetadataRecords.map(
        (metadata) => metadata.recipeId
      )
    },
    environmentClassificationSchema,
    biomeTaggingRules,
    selectorInputContract,
    confidenceThresholds,
    fallbackStrategy,
    coordinateSeedRules,
    regionalPackageCompatibility,
    futureAtlasEngineIntegrationBoundaries: integrationBoundaries
  });
}

function classifyRepresentativeContexts(specification) {
  const scenarios = [
    {
      scenarioId: "ATLAS_COASTAL_CONTEXT_001",
      packageId: "REGION_PACKAGE_COASTAL_001",
      coordinateReference: { latBucket: -38.12, lngBucket: 144.61 },
      primaryEnvironmentType: "COASTAL_EXPLORATION",
      primaryBiomeTag: "COASTAL_RESERVE_TRAIL",
      routeMode: "pedestrian_exploration",
      archetypeHint: "RESERVE_LOOP",
      desiredFeatures: ["shoreline_transition", "wet_crossing", "loop_route"],
      expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
      expectedFallback: false
    },
    {
      scenarioId: "ATLAS_FOREST_CONTEXT_001",
      packageId: "REGION_PACKAGE_FOREST_001",
      coordinateReference: { latBucket: -37.84, lngBucket: 145.29 },
      primaryEnvironmentType: "FOREST_EXPLORATION",
      primaryBiomeTag: "TEMPERATE_FOREST_EDGE",
      routeMode: "pedestrian_exploration",
      archetypeHint: "FOREST_EDGE_LOOP",
      desiredFeatures: ["canopy_enclosure", "clearing_destination", "loop_route"],
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001",
      expectedFallback: false
    },
    {
      scenarioId: "ATLAS_MIXED_EDGE_CONTEXT_001",
      packageId: "REGION_PACKAGE_MIXED_EDGE_001",
      coordinateReference: { latBucket: -38.02, lngBucket: 145.01 },
      primaryEnvironmentType: "MIXED_EDGE_TRANSITION",
      primaryBiomeTag: "TEMPERATE_FOREST_COASTAL_MARGIN",
      routeMode: "pedestrian_exploration",
      archetypeHint: "RESERVE_TRACK_OUT_AND_BACK",
      desiredFeatures: ["canopy_enclosure", "clearing_destination"],
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001",
      expectedFallback: true
    }
  ];

  return deepFreeze(
    scenarios.map((scenario) => {
      const selectorSeed = hashHex(
        scenario.packageId,
        scenario.scenarioId,
        scenario.coordinateReference.latBucket,
        scenario.coordinateReference.lngBucket,
        scenario.primaryBiomeTag,
        scenario.archetypeHint,
        specification.selectorReference.selectorId
      );
      return {
        ...scenario,
        selectorInput: {
          worldContextId: scenario.scenarioId,
          environment: "DEVELOPMENT_ONLY",
          biomeProfile: scenario.primaryBiomeTag,
          routeMode: scenario.routeMode,
          archetype: scenario.archetypeHint,
          desiredFeatures: scenario.desiredFeatures,
          seed: selectorSeed,
          selectorVersion: specification.selectorReference.selectorId
        },
        selectorSeed
      };
    })
  );
}

function buildValidation(specification, selectorInputs, selectorFoundation, scenarioResults) {
  const thresholds = specification.confidenceThresholds;
  const checks = [
    {
      name: "selector_validation_passed",
      ok:
        selectorInputs.selectorValidation.status === "pass" &&
        selectorInputs.selectorSimulationValidation.status === "pass"
    },
    {
      name: "approved_recipes_only",
      ok: selectorFoundation.recipeMetadataRecords.every(
        (metadata) =>
          metadata.approvalStatus === "approved" &&
          metadata.lifecycleStatus === "APPROVED_CURRENT"
      )
    },
    {
      name: "environment_schema_covers_supported_recipes",
      ok:
        specification.environmentClassificationSchema.supportedEnvironmentTypes.length >= 2 &&
        specification.selectorReference.approvedRecipeCount === 2
    },
    {
      name: "coordinate_seed_rules_deterministic",
      ok: scenarioResults.every((scenario) => {
        const replaySeed = hashHex(
          scenario.packageId,
          scenario.scenarioId,
          scenario.coordinateReference.latBucket,
          scenario.coordinateReference.lngBucket,
          scenario.primaryBiomeTag,
          scenario.archetypeHint,
          specification.selectorReference.selectorId
        );
        return replaySeed === scenario.selectorSeed;
      })
    },
    {
      name: "confidence_thresholds_match_selector_behavior",
      ok: scenarioResults.every((scenario) => {
        const confidence = scenario.selectionResult.confidenceScore;
        if (scenario.selectionResult.blocked) {
          return confidence < thresholds.approvedFallbackMinimum;
        }
        if (scenario.selectionResult.fallbackApplied) {
          return (
            confidence >= thresholds.approvedFallbackMinimum &&
            confidence <= thresholds.ambiguityReviewBand.max
          );
        }
        return confidence >= thresholds.directSelectionMinimum;
      })
    },
    {
      name: "regional_package_compatibility_read_only",
      ok:
        specification.regionalPackageCompatibility.packageBoundaryRules.includes(
          "Atlas must not modify package geometry"
        ) &&
        specification.futureAtlasEngineIntegrationBoundaries.planningLayerOnly === true
    },
    {
      name: "future_atlas_boundary_runtime_blocked",
      ok:
        specification.futureAtlasEngineIntegrationBoundaries.futureAtlasBoundary
          .runtimeStillBlocked === true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ENGINE_RECIPE_INTEGRATION_VALIDATION_001",
    integrationId: specification.integrationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    scenarioCount: scenarioResults.length,
    nextAllowedAction: "future_atlas_engine_development_ready",
    checks
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_ENGINE_RECIPE_INTEGRATION_LIFECYCLE_RECORD_001",
    integrationId: specification.integrationId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    selectorId: specification.selectorReference.selectorId,
    approvedRecipeCount: specification.selectorReference.approvedRecipeCount,
    supportedEnvironmentTypes:
      specification.environmentClassificationSchema.supportedEnvironmentTypes,
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(specification, validation, lifecycle, scenarioResults) {
  const lines = [
    "# ATLAS_ENGINE_RECIPE_INTEGRATION_001",
    "",
    `Status: ${lifecycle.lifecycleStatus}`,
    `Selector reference: ${specification.selectorReference.selectorId}`,
    `Approved recipes available: ${specification.selectorReference.approvedRecipeCount}`,
    "",
    "## Integration Scope",
    "- Real-world environment data is classified into selector-ready context.",
    "- LOCATION_RECIPE_SELECTOR_001 remains the only recipe chooser.",
    "- Runtime, map attachment, and renderer activation remain blocked.",
    "",
    "## Representative Planning Scenarios",
    ...scenarioResults.map(
      (scenario) =>
        `- ${scenario.scenarioId}: ${scenario.selectionResult.selectedRecipeId ?? "BLOCKED"} | confidence ${scenario.selectionResult.confidenceScore} | fallback ${scenario.selectionResult.fallbackApplied}`
    ),
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- Future Atlas Engine development: READY",
    "- Runtime activation: BLOCKED",
    "- Blender / GLB / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasEngineRecipeIntegrationPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const selectorInputs = loadSelectorInputs(cwd);
  const selectorFoundationBase = buildLocationRecipeSelectorFoundation({ cwd });
  const specification = buildIntegrationSpecification(
    selectorInputs,
    selectorFoundationBase
  );
  const scenarioResults = classifyRepresentativeContexts(specification).map((scenario) => {
    const selectionResult = selectLocationRecipe(
      scenario.selectorInput,
      selectorFoundationBase.recipeMetadataRecords,
      selectorFoundationBase.specification
    );
    return deepFreeze({
      ...scenario,
      selectionResult
    });
  });
  const validation = buildValidation(
    specification,
    selectorInputs,
    selectorFoundationBase,
    scenarioResults
  );
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(specification, validation, lifecycle, scenarioResults);
  const fingerprint = hashHex(
    specification.integrationId,
    validation.status,
    ...scenarioResults.map(
      (scenario) =>
        `${scenario.scenarioId}:${scenario.selectionResult.selectedRecipeId}:${scenario.selectionResult.confidenceScore}:${scenario.selectionResult.fallbackApplied}`
    )
  );

  return deepFreeze({
    specification,
    validation,
    lifecycle,
    report,
    scenarioResults,
    fingerprint
  });
}

export async function writeAtlasEngineRecipeIntegrationPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const planning = buildAtlasEngineRecipeIntegrationPlanning({ cwd });
  const integrationRoot = path.resolve(cwd, INTEGRATION_ROOT);
  const specificationRoot = path.join(integrationRoot, "specification");
  const validationRoot = path.join(integrationRoot, "validation");
  const lifecycleRoot = path.join(integrationRoot, "lifecycle");
  const reportsRoot = path.join(integrationRoot, "reports");

  for (const directory of [
    specificationRoot,
    validationRoot,
    lifecycleRoot,
    reportsRoot
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationRoot, SPECIFICATION_FILENAME), planning.specification);
  writeJson(path.join(validationRoot, VALIDATION_FILENAME), planning.validation);
  writeJson(path.join(lifecycleRoot, LIFECYCLE_FILENAME), planning.lifecycle);
  fs.writeFileSync(path.join(reportsRoot, REPORT_FILENAME), planning.report);

  return planning;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeAtlasEngineRecipeIntegrationPlanning();
}
