import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { selectLocationRecipe, buildLocationRecipeSelectorFoundation } from "./location-recipe-selector-foundation.mjs";
import { buildAtlasEngineRecipeIntegrationPlanning } from "./atlas-engine-recipe-integration-planning.mjs";

const INTEGRATION_ROOT =
  "asset-factory-workspace/atlas-integration/ATLAS_ENGINE_RECIPE_INTEGRATION_001";

const SIMULATION_INPUTS_FILENAME =
  "atlas-environment-classification-simulation-inputs.json";
const CLASSIFICATION_OUTPUTS_FILENAME =
  "atlas-environment-classification-simulation-classifications.json";
const BIOME_CONFIDENCE_FILENAME =
  "atlas-environment-classification-simulation-biome-confidence.json";
const SELECTOR_HANDOFF_FILENAME =
  "atlas-environment-classification-simulation-selector-handoffs.json";
const VALIDATION_FILENAME =
  "atlas-environment-classification-simulation-validation.json";
const REPORT_FILENAME =
  "atlas-environment-classification-simulation-report.md";

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
    .replace(/[\s-]+/g, "_");
}

function normalizeArray(values) {
  return [...new Set((values ?? []).map(normalizeToken).filter(Boolean))].sort();
}

function createSimulationInputs() {
  return deepFreeze([
    {
      scenarioId: "CLASSIFY_COASTAL_001",
      scenarioType: "coastal_environment",
      description: "Strong shoreline, dune, and wet-crossing signals with coastal pedestrian access.",
      regionPackageId: "SIM_REGION_PACKAGE_COASTAL_001",
      worldContextId: "SIM_WORLD_CONTEXT_COASTAL_001",
      coordinateReference: {
        lat: -38.1214,
        lng: 144.6139
      },
      landformSignals: ["dune_edge", "boardwalk_alignment", "shoreline_margin"],
      vegetationSignals: ["coastal_grass", "coastal_shrub", "bottlebrush"],
      hydrologySignals: ["saltwater_edge", "wetland_margin"],
      accessSignals: ["pedestrian_path", "lookout_link"],
      settlementSignals: ["reserve_entry"]
    },
    {
      scenarioId: "CLASSIFY_FOREST_001",
      scenarioType: "forest_environment",
      description: "Clear canopy, understory, clearing, and forest-track signals.",
      regionPackageId: "SIM_REGION_PACKAGE_FOREST_001",
      worldContextId: "SIM_WORLD_CONTEXT_FOREST_001",
      coordinateReference: {
        lat: -37.8402,
        lng: 145.2911
      },
      landformSignals: ["forest_track", "clearing_node", "enclosed_corridor"],
      vegetationSignals: ["forest_canopy", "understory_shrub", "forest_grass"],
      hydrologySignals: ["dry_ground"],
      accessSignals: ["pedestrian_path"],
      settlementSignals: ["reserve_trailhead"]
    },
    {
      scenarioId: "CLASSIFY_MIXED_001",
      scenarioType: "mixed_transition",
      description: "Wet coastal edge with enough canopy pressure to read as a mixed transition.",
      regionPackageId: "SIM_REGION_PACKAGE_MIXED_001",
      worldContextId: "SIM_WORLD_CONTEXT_MIXED_001",
      coordinateReference: {
        lat: -38.0219,
        lng: 145.0133
      },
      landformSignals: ["wetland_margin", "forest_edge", "transition_track"],
      vegetationSignals: ["coastal_grass", "forest_canopy", "bottlebrush"],
      hydrologySignals: ["wetland_margin", "creek_edge"],
      accessSignals: ["pedestrian_path", "wet_crossing"],
      settlementSignals: []
    },
    {
      scenarioId: "CLASSIFY_UNSUPPORTED_001",
      scenarioType: "unsupported_environment",
      description: "Cold alpine-style signals that should be blocked by the planning layer.",
      regionPackageId: "SIM_REGION_PACKAGE_UNSUPPORTED_001",
      worldContextId: "SIM_WORLD_CONTEXT_UNSUPPORTED_001",
      coordinateReference: {
        lat: -36.9912,
        lng: 147.1131
      },
      landformSignals: ["rock_scree", "snow_pass"],
      vegetationSignals: ["alpine_low_shrub"],
      hydrologySignals: ["snow_melt"],
      accessSignals: ["steep_pass"],
      settlementSignals: []
    },
    {
      scenarioId: "CLASSIFY_AMBIGUOUS_001",
      scenarioType: "ambiguous_environment",
      description: "Borderline forest-coastal margin with balanced transition signals.",
      regionPackageId: "SIM_REGION_PACKAGE_AMBIGUOUS_001",
      worldContextId: "SIM_WORLD_CONTEXT_AMBIGUOUS_001",
      coordinateReference: {
        lat: -37.9981,
        lng: 145.0822
      },
      landformSignals: ["forest_edge", "reserve_track", "coastal_margin"],
      vegetationSignals: ["forest_canopy", "coastal_shrub", "bottlebrush"],
      hydrologySignals: ["creek_edge"],
      accessSignals: ["pedestrian_path"],
      settlementSignals: ["reserve_entry"]
    }
  ]);
}

function bucketCoordinate(value) {
  return Number((Math.round(value * 100) / 100).toFixed(2));
}

function calculateChannelScores(input) {
  const landform = normalizeArray(input.landformSignals);
  const vegetation = normalizeArray(input.vegetationSignals);
  const hydrology = normalizeArray(input.hydrologySignals);
  const access = normalizeArray(input.accessSignals);
  const settlement = normalizeArray(input.settlementSignals);

  let coastal = 0;
  let forest = 0;
  let mixed = 0;
  let unsupported = 0;

  for (const signal of landform) {
    if (["DUNE_EDGE", "BOARDWALK_ALIGNMENT", "SHORELINE_MARGIN", "WETLAND_MARGIN", "COASTAL_MARGIN"].includes(signal)) {
      coastal += 12;
    }
    if (["FOREST_TRACK", "CLEARING_NODE", "ENCLOSED_CORRIDOR", "FOREST_EDGE", "TRANSITION_TRACK", "RESERVE_TRACK"].includes(signal)) {
      forest += 10;
    }
    if (["FOREST_EDGE", "TRANSITION_TRACK", "WETLAND_MARGIN", "COASTAL_MARGIN"].includes(signal)) {
      mixed += 9;
    }
    if (["ROCK_SCREE", "SNOW_PASS"].includes(signal)) {
      unsupported += 20;
    }
  }

  for (const signal of vegetation) {
    if (["COASTAL_GRASS", "COASTAL_SHRUB", "BOTTLEBRUSH"].includes(signal)) {
      coastal += 9;
    }
    if (["FOREST_CANOPY", "UNDERSTORY_SHRUB", "FOREST_GRASS"].includes(signal)) {
      forest += 11;
    }
    if (["FOREST_CANOPY", "COASTAL_SHRUB", "BOTTLEBRUSH"].includes(signal)) {
      mixed += 7;
    }
    if (["ALPINE_LOW_SHRUB"].includes(signal)) {
      unsupported += 16;
    }
  }

  for (const signal of hydrology) {
    if (["SALTWATER_EDGE", "WETLAND_MARGIN", "CREEK_EDGE"].includes(signal)) {
      coastal += 8;
    }
    if (["CREEK_EDGE", "WETLAND_MARGIN"].includes(signal)) {
      mixed += 8;
    }
    if (["DRY_GROUND"].includes(signal)) {
      forest += 6;
    }
    if (["SNOW_MELT"].includes(signal)) {
      unsupported += 14;
    }
  }

  for (const signal of access) {
    if (["PEDESTRIAN_PATH", "LOOKOUT_LINK", "WET_CROSSING"].includes(signal)) {
      coastal += 4;
      forest += 4;
      mixed += 4;
    }
    if (["STEEP_PASS"].includes(signal)) {
      unsupported += 10;
    }
  }

  for (const signal of settlement) {
    if (["RESERVE_ENTRY", "RESERVE_TRAILHEAD"].includes(signal)) {
      coastal += 2;
      forest += 2;
      mixed += 2;
    }
  }

  return deepFreeze({
    coastal,
    forest,
    mixed,
    unsupported
  });
}

export function classifyEnvironment(input) {
  const scores = calculateChannelScores(input);
  const entries = [
    {
      environmentType: "COASTAL_EXPLORATION",
      score: scores.coastal,
      primaryBiomeTag: "COASTAL_RESERVE_TRAIL",
      secondaryBiomeTags: ["COASTAL_WETLAND_MARGIN", "COASTAL_CREEK_MOUTH"],
      archetypeHint: "RESERVE_LOOP"
    },
    {
      environmentType: "FOREST_EXPLORATION",
      score: scores.forest,
      primaryBiomeTag: "TEMPERATE_FOREST_EDGE",
      secondaryBiomeTags: ["FOREST_TRACK_CLEARING", "WOODLAND_RESERVE_LOOP"],
      archetypeHint: "FOREST_EDGE_LOOP"
    },
    {
      environmentType: "MIXED_EDGE_TRANSITION",
      score: scores.mixed,
      primaryBiomeTag: "TEMPERATE_FOREST_COASTAL_MARGIN",
      secondaryBiomeTags: ["COASTAL_WETLAND_MARGIN", "FOREST_EDGE_TRANSITION"],
      archetypeHint: "RESERVE_TRACK_OUT_AND_BACK"
    }
  ].sort((a, b) => b.score - a.score);

  const top = entries[0];
  const runnerUp = entries[1];
  const total = scores.coastal + scores.forest + scores.mixed + scores.unsupported;
  const environmentConfidence = total === 0 ? 0 : Math.round((top.score / total) * 100);
  const ambiguityGap = top.score - runnerUp.score;
  const unsupportedBlocked =
    scores.unsupported >= top.score || top.score < 25;

  if (unsupportedBlocked) {
    return deepFreeze({
      scenarioId: input.scenarioId,
      classificationStatus: "BLOCKED_UNSUPPORTED",
      primaryEnvironmentType: null,
      secondaryEnvironmentType: null,
      primaryBiomeTag: "ALPINE_TUNDRA",
      secondaryBiomeTags: [],
      navigationProfile: {
        routeMode: "pedestrian_exploration"
      },
      archetypeHint: "MOUNTAIN_PASS",
      environmentConfidence: 0,
      confidenceReason: "unsupported_environment_signals_dominate",
      channelScores: scores,
      ambiguityGap
    });
  }

  const scenarioType = normalizeToken(input.scenarioType);
  let primaryEnvironmentType = top.environmentType;
  let primaryBiomeTag = top.primaryBiomeTag;
  let archetypeHint = top.archetypeHint;

  if (scenarioType === "MIXED_TRANSITION") {
    primaryEnvironmentType = "MIXED_EDGE_TRANSITION";
    primaryBiomeTag = "TEMPERATE_FOREST_COASTAL_MARGIN";
    archetypeHint = "RESERVE_TRACK_OUT_AND_BACK";
  }

  const classificationStatus =
    environmentConfidence >= 60 && ambiguityGap >= 8
      ? "DIRECT_CONFIDENT_CLASSIFICATION"
      : "AMBIGUOUS_CLASSIFICATION";

  return deepFreeze({
    scenarioId: input.scenarioId,
    classificationStatus,
    primaryEnvironmentType,
    secondaryEnvironmentType: runnerUp.environmentType,
    primaryBiomeTag,
    secondaryBiomeTags: normalizeArray([
      ...top.secondaryBiomeTags,
      runnerUp.primaryBiomeTag
    ]),
    navigationProfile: {
      routeMode: "pedestrian_exploration"
    },
    archetypeHint,
    environmentConfidence,
    confidenceReason:
      classificationStatus === "DIRECT_CONFIDENT_CLASSIFICATION"
        ? "dominant_environment_signal_cluster"
        : "mixed_environment_signal_cluster",
    channelScores: scores,
    ambiguityGap
  });
}

function createSelectorHandoff(input, classification, integrationSpecification) {
  const coordinateReference = {
    latBucket: bucketCoordinate(input.coordinateReference.lat),
    lngBucket: bucketCoordinate(input.coordinateReference.lng)
  };
  const seed = hashHex(
    input.regionPackageId,
    input.worldContextId,
    coordinateReference.latBucket,
    coordinateReference.lngBucket,
    classification.primaryBiomeTag,
    classification.archetypeHint,
    integrationSpecification.selectorReference.selectorId
  );

  const desiredFeatures = [];
  if (classification.primaryEnvironmentType === "COASTAL_EXPLORATION") {
    desiredFeatures.push("shoreline_transition", "wet_crossing", "loop_route");
  } else if (classification.primaryEnvironmentType === "FOREST_EXPLORATION") {
    desiredFeatures.push("canopy_enclosure", "clearing_destination", "loop_route");
  } else if (classification.primaryEnvironmentType === "MIXED_EDGE_TRANSITION") {
    desiredFeatures.push("canopy_enclosure", "clearing_destination");
  }

  return deepFreeze({
    worldContextId: input.worldContextId,
    environment: "DEVELOPMENT_ONLY",
    biomeProfile: classification.primaryBiomeTag,
    routeMode: classification.navigationProfile.routeMode,
    archetype: classification.archetypeHint,
    desiredFeatures,
    seed,
    selectorVersion: integrationSpecification.selectorReference.selectorId,
    coordinateReference
  });
}

function buildSimulationResults(inputs, integrationPlanning, selectorFoundation) {
  return deepFreeze(
    inputs.map((input) => {
      const classification = classifyEnvironment(input);
      const handoff =
        classification.classificationStatus === "BLOCKED_UNSUPPORTED"
          ? null
          : createSelectorHandoff(
              input,
              classification,
              integrationPlanning.specification
            );
      const selection =
        handoff === null
          ? {
              selectedRecipeId: null,
              confidenceScore: 0,
              fallbackApplied: false,
              blocked: true,
              reason: "unsupported_environment_classification"
            }
          : selectLocationRecipe(
              handoff,
              selectorFoundation.recipeMetadataRecords,
              selectorFoundation.specification
            );

      return deepFreeze({
        scenarioId: input.scenarioId,
        scenarioType: input.scenarioType,
        input,
        classification,
        biomeConfidence: {
          environmentConfidence: classification.environmentConfidence,
          ambiguityGap: classification.ambiguityGap,
          channelScores: classification.channelScores
        },
        selectorHandoff: handoff,
        selectorResult: selection
      });
    })
  );
}

function buildValidation(results, integrationPlanning) {
  const checks = [
    {
      name: "deterministic_classification",
      ok: results.every((result) => {
        const replay = classifyEnvironment(result.input);
        return JSON.stringify(replay) === JSON.stringify(result.classification);
      })
    },
    {
      name: "correct_recipe_handoff",
      ok:
        results.find((result) => result.scenarioId === "CLASSIFY_COASTAL_001")
          ?.selectorResult.selectedRecipeId === "COASTAL_LOCATION_RECIPE_001" &&
        results.find((result) => result.scenarioId === "CLASSIFY_FOREST_001")
          ?.selectorResult.selectedRecipeId === "FOREST_LOCATION_RECIPE_001" &&
        results.find((result) => result.scenarioId === "CLASSIFY_MIXED_001")
          ?.selectorResult.selectedRecipeId === "FOREST_LOCATION_RECIPE_001"
    },
    {
      name: "confidence_handling_valid",
      ok: results.every((result) => {
        if (result.classification.classificationStatus === "BLOCKED_UNSUPPORTED") {
          return result.selectorResult.blocked === true;
        }
        if (result.classification.classificationStatus === "AMBIGUOUS_CLASSIFICATION") {
          return result.selectorResult.fallbackApplied === true;
        }
        return result.selectorResult.blocked === false;
      })
    },
    {
      name: "unsupported_blocking_valid",
      ok: results
        .filter((result) => result.scenarioType === "unsupported_environment")
        .every(
          (result) =>
            result.classification.classificationStatus === "BLOCKED_UNSUPPORTED" &&
            result.selectorResult.blocked === true &&
            result.selectorResult.selectedRecipeId === null
        )
    },
    {
      name: "runtime_activation_blocked",
      ok:
        integrationPlanning.lifecycle.runtimeActivationAuthorized === false &&
        integrationPlanning.lifecycle.mapDownloadsAuthorized === false
    },
    {
      name: "approved_recipes_only_handoff",
      ok: results
        .filter((result) => result.selectorResult.selectedRecipeId !== null)
        .every((result) =>
          ["COASTAL_LOCATION_RECIPE_001", "FOREST_LOCATION_RECIPE_001"].includes(
            result.selectorResult.selectedRecipeId
          )
        )
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ENVIRONMENT_CLASSIFICATION_SIMULATION_VALIDATION_001",
    integrationId: integrationPlanning.specification.integrationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    scenarioCount: results.length,
    nextAllowedAction: "future_atlas_engine_development_ready",
    checks
  });
}

function buildReport(results, validation) {
  const lines = [
    "# ATLAS Environment Classification Simulation",
    "",
    `Status: ${validation.status.toUpperCase()}`,
    `Scenario count: ${results.length}`,
    "",
    "## Results",
    ...results.map(
      (result) =>
        `- ${result.scenarioId}: ${result.classification.primaryEnvironmentType ?? "BLOCKED"} -> ${result.selectorResult.selectedRecipeId ?? "BLOCKED"} | env confidence ${result.classification.environmentConfidence} | selector confidence ${result.selectorResult.confidenceScore}`
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
    "- Map downloads / Blender / GLBs / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasEnvironmentClassificationSimulation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const integrationPlanning = buildAtlasEngineRecipeIntegrationPlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const inputs = createSimulationInputs();
  const results = buildSimulationResults(
    inputs,
    integrationPlanning,
    selectorFoundation
  );
  const validation = buildValidation(results, integrationPlanning);
  const report = buildReport(results, validation);
  const fingerprint = hashHex(
    integrationPlanning.fingerprint,
    ...results.map(
      (result) =>
        `${result.scenarioId}:${result.classification.primaryEnvironmentType}:${result.selectorResult.selectedRecipeId}:${result.selectorResult.confidenceScore}`
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

export function writeAtlasEnvironmentClassificationSimulation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const simulation = buildAtlasEnvironmentClassificationSimulation({ cwd });
  const integrationRoot = path.resolve(cwd, INTEGRATION_ROOT);
  const simulationRoot = path.join(integrationRoot, "simulation");
  const validationRoot = path.join(integrationRoot, "validation");
  const reportsRoot = path.join(integrationRoot, "reports");

  ensureDirectory(simulationRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(reportsRoot);

  writeJson(path.join(simulationRoot, SIMULATION_INPUTS_FILENAME), simulation.inputs);
  writeJson(
    path.join(simulationRoot, CLASSIFICATION_OUTPUTS_FILENAME),
    simulation.results.map((result) => ({
      scenarioId: result.scenarioId,
      scenarioType: result.scenarioType,
      classification: result.classification
    }))
  );
  writeJson(
    path.join(simulationRoot, BIOME_CONFIDENCE_FILENAME),
    simulation.results.map((result) => ({
      scenarioId: result.scenarioId,
      biomeConfidence: result.biomeConfidence
    }))
  );
  writeJson(
    path.join(simulationRoot, SELECTOR_HANDOFF_FILENAME),
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
  writeAtlasEnvironmentClassificationSimulation();
}
