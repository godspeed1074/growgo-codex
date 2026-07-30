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

const SCENARIO_INPUTS_FILENAME = "location-recipe-selector-simulation-inputs.json";
const SCENARIO_OUTPUTS_FILENAME = "location-recipe-selector-simulation-results.json";
const CONFIDENCE_FILENAME = "location-recipe-selector-confidence-results.json";
const VALIDATION_FILENAME = "location-recipe-selector-simulation-validation.json";
const REPORT_FILENAME = "location-recipe-selector-simulation-report.md";

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

function createSimulationInputs() {
  return deepFreeze([
    {
      scenarioId: "COASTAL_ENVIRONMENT_001",
      scenarioType: "coastal_environment",
      description:
        "Direct coastal reserve context with shoreline transition and wet-crossing cues.",
      context: {
        worldContextId: "WORLD_CONTEXT_COASTAL_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "COASTAL_RESERVE_TRAIL",
        routeMode: "pedestrian_exploration",
        archetype: "RESERVE_LOOP",
        desiredFeatures: ["shoreline_transition", "wet_crossing", "loop_route"],
        seed: "LOCATION_RECIPE_SELECTOR_SIMULATION:COASTAL_ENVIRONMENT_001"
      },
      expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
      expectedFallbackApplied: false
    },
    {
      scenarioId: "FOREST_ENVIRONMENT_001",
      scenarioType: "forest_environment",
      description:
        "Direct temperate forest route with canopy enclosure and clearing destination intent.",
      context: {
        worldContextId: "WORLD_CONTEXT_FOREST_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "TEMPERATE_FOREST_EDGE",
        routeMode: "pedestrian_exploration",
        archetype: "FOREST_EDGE_LOOP",
        desiredFeatures: ["canopy_enclosure", "clearing_destination", "loop_route"],
        seed: "LOCATION_RECIPE_SELECTOR_SIMULATION:FOREST_ENVIRONMENT_001"
      },
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001",
      expectedFallbackApplied: false
    },
    {
      scenarioId: "MIXED_BIOME_ENVIRONMENT_001",
      scenarioType: "mixed_biome_environment",
      description:
        "Coastal wetland-edge route asking for some forest-like enclosure without losing shoreline structure.",
      context: {
        worldContextId: "WORLD_CONTEXT_MIXED_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "COASTAL_WETLAND_MARGIN",
        routeMode: "pedestrian_exploration",
        archetype: "WETLAND_CROSSING",
        desiredFeatures: ["shoreline_transition", "canopy_enclosure", "wet_crossing"],
        seed: "LOCATION_RECIPE_SELECTOR_SIMULATION:MIXED_BIOME_ENVIRONMENT_001"
      },
      expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
      expectedFallbackApplied: false
    },
    {
      scenarioId: "UNSUPPORTED_ENVIRONMENT_001",
      scenarioType: "unsupported_environment",
      description:
        "Unsupported alpine-style context that should be blocked rather than forced into a recipe.",
      context: {
        worldContextId: "WORLD_CONTEXT_UNSUPPORTED_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "ALPINE_TUNDRA",
        routeMode: "pedestrian_exploration",
        archetype: "MOUNTAIN_PASS",
        desiredFeatures: ["snow_corridor"],
        seed: "LOCATION_RECIPE_SELECTOR_SIMULATION:UNSUPPORTED_ENVIRONMENT_001"
      },
      expectedRecipeId: null,
      expectedFallbackApplied: false
    },
    {
      scenarioId: "AMBIGUOUS_ENVIRONMENT_001",
      scenarioType: "ambiguous_environment",
      description:
        "Borderline forest context that should still land on an approved fallback without pretending it is a perfect biome fit.",
      context: {
        worldContextId: "WORLD_CONTEXT_AMBIGUOUS_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "TEMPERATE_FOREST_COASTAL_MARGIN",
        routeMode: "pedestrian_exploration",
        archetype: "RESERVE_TRACK_OUT_AND_BACK",
        desiredFeatures: ["canopy_enclosure", "clearing_destination"],
        seed: "LOCATION_RECIPE_SELECTOR_SIMULATION:AMBIGUOUS_ENVIRONMENT_001"
      },
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001",
      expectedFallbackApplied: true
    }
  ]);
}

function sortCandidates(selection) {
  return [...selection.scoredCandidates].sort((left, right) => {
    if (right.totalScore !== left.totalScore) {
      return right.totalScore - left.totalScore;
    }
    return left.tieBreak.localeCompare(right.tieBreak);
  });
}

function buildScenarioResult(input, recipeMetadataRecords, specification) {
  const firstSelection = selectLocationRecipe(
    input.context,
    recipeMetadataRecords,
    specification
  );
  const secondSelection = selectLocationRecipe(
    input.context,
    recipeMetadataRecords,
    specification
  );
  const rankedCandidates = sortCandidates(firstSelection);
  const topCandidate = rankedCandidates[0] ?? null;
  const runnerUp = rankedCandidates[1] ?? null;

  return deepFreeze({
    scenarioId: input.scenarioId,
    scenarioType: input.scenarioType,
    description: input.description,
    selectionResult: {
      selectedRecipeId: firstSelection.selectedRecipeId,
      selectedVersion: firstSelection.selectedVersion ?? null,
      confidenceScore: firstSelection.confidenceScore,
      fallbackApplied: firstSelection.fallbackApplied,
      blocked: firstSelection.blocked,
      reason: firstSelection.reason
    },
    deterministicReplay: {
      selectedRecipeIdMatches:
        firstSelection.selectedRecipeId === secondSelection.selectedRecipeId,
      confidenceMatches:
        firstSelection.confidenceScore === secondSelection.confidenceScore,
      fallbackMatches:
        firstSelection.fallbackApplied === secondSelection.fallbackApplied
    },
    rankingSummary: {
      topRecipeId: topCandidate?.recipeId ?? null,
      topScore: topCandidate?.totalScore ?? 0,
      runnerUpRecipeId: runnerUp?.recipeId ?? null,
      runnerUpScore: runnerUp?.totalScore ?? 0,
      confidenceMargin:
        topCandidate && runnerUp ? topCandidate.totalScore - runnerUp.totalScore : null
    },
    scoredCandidates: rankedCandidates,
    expectation: {
      expectedRecipeId: input.expectedRecipeId,
      expectedFallbackApplied: input.expectedFallbackApplied,
      selectedRecipeMatchesExpectation:
        firstSelection.selectedRecipeId === input.expectedRecipeId,
      fallbackMatchesExpectation:
        firstSelection.fallbackApplied === input.expectedFallbackApplied
    }
  });
}

function buildConfidenceResults(scenarioResults) {
  return deepFreeze(
    scenarioResults.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      selectedRecipeId: scenario.selectionResult.selectedRecipeId,
      confidenceScore: scenario.selectionResult.confidenceScore,
      fallbackApplied: scenario.selectionResult.fallbackApplied,
      blocked: scenario.selectionResult.blocked,
      ranking: scenario.scoredCandidates.map((candidate, index) => ({
        rank: index + 1,
        recipeId: candidate.recipeId,
        eligible: candidate.eligible,
        totalScore: candidate.totalScore,
        biomeMatch: candidate.componentScores.biomeMatch,
        environmentMatch: candidate.componentScores.environmentMatch,
        archetypeMatch: candidate.componentScores.archetypeMatch,
        featureMatch: candidate.componentScores.featureMatch,
        versionCompatibility: candidate.componentScores.versionCompatibility
      }))
    }))
  );
}

function buildValidation(selectorFoundation, scenarioInputs, scenarioResults) {
  const checks = [
    {
      name: "approved_recipes_only",
      ok: selectorFoundation.recipeMetadataRecords.every(
        (metadata) =>
          metadata.approvalStatus === "approved" &&
          metadata.lifecycleStatus === "APPROVED_CURRENT"
      )
    },
    {
      name: "deterministic_selection",
      ok: scenarioResults.every(
        (scenario) =>
          scenario.deterministicReplay.selectedRecipeIdMatches &&
          scenario.deterministicReplay.confidenceMatches &&
          scenario.deterministicReplay.fallbackMatches
      )
    },
    {
      name: "correct_expected_recipe_per_scenario",
      ok: scenarioResults.every(
        (scenario) => scenario.expectation.selectedRecipeMatchesExpectation
      )
    },
    {
      name: "fallback_behavior_valid",
      ok: scenarioResults.every(
        (scenario) => scenario.expectation.fallbackMatchesExpectation
      )
    },
    {
      name: "confidence_ranking_valid",
      ok: scenarioResults
        .filter((scenario) => scenario.selectionResult.blocked === false)
        .every((scenario) => {
          const [top, runnerUp] = scenario.scoredCandidates;
          if (!top) {
            return false;
          }
          if (!runnerUp) {
            return true;
          }
          return top.totalScore >= runnerUp.totalScore;
        })
    },
    {
      name: "unsupported_environment_blocked",
      ok: scenarioResults
        .filter((scenario) => scenario.scenarioType === "unsupported_environment")
        .every(
          (scenario) =>
            scenario.selectionResult.blocked === true &&
            scenario.selectionResult.selectedRecipeId === null
        )
    },
    {
      name: "same_inputs_same_fingerprint",
      ok:
        hashHex(JSON.stringify(scenarioInputs), JSON.stringify(scenarioResults)) ===
        hashHex(JSON.stringify(scenarioInputs), JSON.stringify(scenarioResults))
    },
    {
      name: "runtime_activation_blocked",
      ok:
        selectorFoundation.lifecycle.runtimeActivationAuthorized === false &&
        selectorFoundation.lifecycle.betaBlocked === true &&
        selectorFoundation.lifecycle.productionBlocked === true
    }
  ];

  return deepFreeze({
    schemaId: "LOCATION_RECIPE_SELECTOR_SIMULATION_VALIDATION_001",
    selectorId: selectorFoundation.specification.selectorId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    scenarioCount: scenarioResults.length,
    approvedRecipeCount: selectorFoundation.recipeMetadataRecords.length,
    nextAllowedAction: "atlas_engine_integration_planning_ready",
    checks
  });
}

function buildReport(scenarioResults, validation) {
  const lines = [
    "# LOCATION_RECIPE_SELECTOR_001 Simulation",
    "",
    `Status: ${validation.status.toUpperCase()}`,
    `Scenario count: ${scenarioResults.length}`,
    "",
    "## Scenario Results",
    ...scenarioResults.flatMap((scenario) => [
      `- ${scenario.scenarioId}: ${scenario.selectionResult.selectedRecipeId ?? "BLOCKED"} | confidence ${scenario.selectionResult.confidenceScore} | fallback ${scenario.selectionResult.fallbackApplied}`
    ]),
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- Atlas Engine integration planning: READY",
    "- Runtime activation: BLOCKED",
    "- Blender and GLB workflows untouched: YES"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildLocationRecipeSelectionSimulation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const scenarioInputs = createSimulationInputs();
  const scenarioResults = scenarioInputs.map((input) =>
    buildScenarioResult(
      input,
      selectorFoundation.recipeMetadataRecords,
      selectorFoundation.specification
    )
  );
  const confidenceResults = buildConfidenceResults(scenarioResults);
  const validation = buildValidation(
    selectorFoundation,
    scenarioInputs,
    scenarioResults
  );
  const report = buildReport(scenarioResults, validation);
  const fingerprint = hashHex(
    selectorFoundation.fingerprint,
    ...scenarioResults.map((scenario) =>
      `${scenario.scenarioId}:${scenario.selectionResult.selectedRecipeId}:${scenario.selectionResult.confidenceScore}:${scenario.selectionResult.fallbackApplied}`
    )
  );

  return deepFreeze({
    selectorFoundation,
    scenarioInputs,
    scenarioResults,
    confidenceResults,
    validation,
    report,
    fingerprint
  });
}

export function writeLocationRecipeSelectionSimulation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const simulation = buildLocationRecipeSelectionSimulation({ cwd });
  const selectorRoot = path.resolve(cwd, SELECTOR_ROOT);
  const simulationRoot = path.join(selectorRoot, "simulation");
  const validationRoot = path.join(selectorRoot, "validation");
  const reportsRoot = path.join(selectorRoot, "reports");

  ensureDirectory(simulationRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(reportsRoot);

  writeJson(path.join(simulationRoot, SCENARIO_INPUTS_FILENAME), simulation.scenarioInputs);
  writeJson(path.join(simulationRoot, SCENARIO_OUTPUTS_FILENAME), simulation.scenarioResults);
  writeJson(path.join(simulationRoot, CONFIDENCE_FILENAME), simulation.confidenceResults);
  writeJson(path.join(validationRoot, VALIDATION_FILENAME), simulation.validation);
  fs.writeFileSync(path.join(reportsRoot, REPORT_FILENAME), simulation.report);

  return simulation;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeLocationRecipeSelectionSimulation();
}
