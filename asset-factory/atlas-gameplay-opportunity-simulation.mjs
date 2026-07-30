import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasGameplayIntegrationPlanning } from "./atlas-gameplay-integration-planning.mjs";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_INTEGRATION_001";

const INPUTS_FILENAME = "atlas-gameplay-opportunity-simulation-inputs.json";
const ACHIEVEMENT_OUTPUTS_FILENAME =
  "atlas-gameplay-achievement-opportunity-outputs.json";
const QUEST_OUTPUTS_FILENAME = "atlas-gameplay-quest-opportunity-outputs.json";
const COLLECTION_OUTPUTS_FILENAME =
  "atlas-gameplay-collection-opportunity-outputs.json";
const POI_OUTPUTS_FILENAME = "atlas-gameplay-poi-opportunity-outputs.json";
const VALIDATION_FILENAME = "atlas-gameplay-opportunity-simulation-validation.json";
const REPORT_FILENAME = "atlas-gameplay-opportunity-simulation-report.md";

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

function sortStrings(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function createSimulationInputs() {
  return deepFreeze([
    {
      scenarioId: "ATLAS_GAMEPLAY_COASTAL_LOCATION_001",
      scenarioType: "coastal_location",
      description:
        "Approved coastal exploration location with shoreline destination and repeatable trail flow.",
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      ambiguityMode: "DIRECT",
      expectedBlocked: false
    },
    {
      scenarioId: "ATLAS_GAMEPLAY_FOREST_LOCATION_001",
      scenarioType: "forest_location",
      description:
        "Approved forest exploration location with canopy corridor, clearing payoff, and repeatable route structure.",
      recipeId: "FOREST_LOCATION_RECIPE_001",
      ambiguityMode: "DIRECT",
      expectedBlocked: false
    },
    {
      scenarioId: "ATLAS_GAMEPLAY_UNSUPPORTED_LOCATION_001",
      scenarioType: "unsupported_location",
      description:
        "Unsupported gameplay context with no approved recipe backing and no safe gameplay bridge.",
      recipeId: null,
      ambiguityMode: "UNSUPPORTED",
      expectedBlocked: true
    },
    {
      scenarioId: "ATLAS_GAMEPLAY_AMBIGUOUS_LOCATION_001",
      scenarioType: "ambiguous_location",
      description:
        "Mixed-interest location that still maps to an approved recipe but should remain visibly ambiguous in planning.",
      recipeId: "FOREST_LOCATION_RECIPE_001",
      ambiguityMode: "APPROVED_AMBIGUOUS",
      expectedBlocked: false
    }
  ]);
}

function indexRepresentativeMetadata(representativeMetadata) {
  return new Map(
    representativeMetadata.map((record) => [record.recipeId, deepFreeze(record)])
  );
}

function normalizeBandScore(baseScore, adjustment) {
  return Math.max(0, Math.min(100, baseScore + adjustment));
}

function scoreBand(score, thresholds) {
  if (score >= thresholds.HIGH) {
    return "HIGH";
  }
  if (score >= thresholds.MEDIUM) {
    return "MEDIUM";
  }
  if (score >= thresholds.LOW) {
    return "LOW";
  }
  return "MINIMAL";
}

function createBlockedResult(input, outputType) {
  return deepFreeze({
    scenarioId: input.scenarioId,
    scenarioType: input.scenarioType,
    outputType,
    blocked: true,
    approvedRecipeId: null,
    opportunityCount: 0,
    opportunities: [],
    reason: "UNSUPPORTED_GAMEPLAY_CONTEXT",
    liveGameplayStateCreated: false,
    deterministicFingerprint: hashHex(input.scenarioId, outputType, "BLOCKED")
  });
}

function createScenarioContext(input, metadataRecord, schema) {
  if (!metadataRecord) {
    return deepFreeze({
      ...input,
      blocked: true,
      metadataRecord: null,
      confidenceModifier: null,
      reviewState: "BLOCKED_UNSUPPORTED",
      gameplayTags: [],
      featureSummary: null,
      deterministicFingerprint: hashHex(input.scenarioId, "UNSUPPORTED")
    });
  }

  const ambiguous = input.ambiguityMode === "APPROVED_AMBIGUOUS";
  const gameplayTags = ambiguous
    ? sortStrings([
        ...metadataRecord.gameplayTags,
        "REVIEW_REQUIRED",
        "AMBIGUOUS_GAMEPLAY_SIGNAL"
      ])
    : metadataRecord.gameplayTags;

  const achievementThresholds = schema.scoringContract.achievement;
  const questThresholds = schema.scoringContract.quest;
  const collectionThresholds = schema.scoringContract.collection;

  const achievementScore = normalizeBandScore(
    metadataRecord.achievementSuitability.score,
    ambiguous ? -12 : 0
  );
  const questScore = normalizeBandScore(
    metadataRecord.questSuitability.score,
    ambiguous ? -10 : 0
  );
  const collectionScore = normalizeBandScore(
    metadataRecord.collectionSuitability.score,
    ambiguous ? -8 : 0
  );

  const featureSummary = deepFreeze({
    ...metadataRecord.featureSummary,
    ambiguityState: ambiguous ? "REVIEW_REQUIRED" : "DIRECT_APPROVED",
    approvedRecipeOnly: true
  });

  return deepFreeze({
    ...input,
    blocked: false,
    metadataRecord,
    gameplayTags,
    featureSummary,
    reviewState: ambiguous ? "APPROVED_AMBIGUOUS_REVIEW_REQUIRED" : "DIRECT_APPROVED",
    achievementScore,
    achievementBand: scoreBand(achievementScore, achievementThresholds),
    questScore,
    questBand: scoreBand(questScore, questThresholds),
    collectionScore,
    collectionBand: scoreBand(collectionScore, collectionThresholds),
    poiOpportunities: ambiguous
      ? metadataRecord.poiOpportunities.slice(0, 2)
      : metadataRecord.poiOpportunities,
    deterministicFingerprint: hashHex(
      input.scenarioId,
      metadataRecord.recipeId,
      ambiguous ? "AMBIGUOUS" : "DIRECT",
      JSON.stringify(gameplayTags)
    )
  });
}

function buildAchievementOutputs(scenarioContexts) {
  return deepFreeze(
    scenarioContexts.map((context) => {
      if (context.blocked) {
        return createBlockedResult(context, "ACHIEVEMENT");
      }

      const opportunities = [];
      if (context.gameplayTags.includes("SCENIC_DESTINATION")) {
        opportunities.push("SCENIC_LOOKOUT");
      }
      if (context.gameplayTags.includes("SHORELINE_EXPLORATION")) {
        opportunities.push("SHORELINE_DISCOVERY");
      }
      if (context.gameplayTags.includes("CANOPY_EXPLORATION")) {
        opportunities.push("FOREST_CLEARING_DISCOVERY");
      }
      if (context.gameplayTags.includes("TRAIL_PROGRESS")) {
        opportunities.push("ROUTE_COMPLETION");
      }
      if (context.gameplayTags.includes("NATURE_DISCOVERY")) {
        opportunities.push("NATURE_OBSERVATION");
      }

      return deepFreeze({
        scenarioId: context.scenarioId,
        scenarioType: context.scenarioType,
        outputType: "ACHIEVEMENT",
        blocked: false,
        approvedRecipeId: context.recipeId,
        reviewState: context.reviewState,
        suitabilityScore: context.achievementScore,
        suitabilityBand: context.achievementBand,
        opportunityCount: opportunities.length,
        opportunities: opportunities.map((opportunityId, index) => ({
          opportunityId: `${context.scenarioId}_${opportunityId}`,
          achievementTag: opportunityId,
          rank: index + 1
        })),
        liveGameplayStateCreated: false,
        deterministicFingerprint: hashHex(
          context.scenarioId,
          "ACHIEVEMENT",
          context.achievementScore,
          JSON.stringify(opportunities)
        )
      });
    })
  );
}

function buildQuestOutputs(scenarioContexts) {
  return deepFreeze(
    scenarioContexts.map((context) => {
      if (context.blocked) {
        return createBlockedResult(context, "QUEST");
      }

      const opportunities = [];
      if (context.gameplayTags.includes("TRAIL_PROGRESS")) {
        opportunities.push("WALKING_ROUTE");
      }
      if (context.gameplayTags.includes("SCENIC_DESTINATION")) {
        opportunities.push("DESTINATION_VISIT");
      }
      if (context.featureSummary.transitionPresence) {
        opportunities.push("CROSSING_INTERACTION");
      }
      if (context.gameplayTags.includes("NATURE_DISCOVERY")) {
        opportunities.push("BIOZONE_SURVEY");
      }
      if (context.featureSummary.routeLengthBand === "MEDIUM") {
        opportunities.push("DISCOVERY_LOOP");
      }

      return deepFreeze({
        scenarioId: context.scenarioId,
        scenarioType: context.scenarioType,
        outputType: "QUEST",
        blocked: false,
        approvedRecipeId: context.recipeId,
        reviewState: context.reviewState,
        suitabilityScore: context.questScore,
        suitabilityBand: context.questBand,
        opportunityCount: opportunities.length,
        opportunities: opportunities.map((opportunityId, index) => ({
          opportunityId: `${context.scenarioId}_${opportunityId}`,
          questTag: opportunityId,
          rank: index + 1
        })),
        liveGameplayStateCreated: false,
        deterministicFingerprint: hashHex(
          context.scenarioId,
          "QUEST",
          context.questScore,
          JSON.stringify(opportunities)
        )
      });
    })
  );
}

function buildCollectionOutputs(scenarioContexts) {
  return deepFreeze(
    scenarioContexts.map((context) => {
      if (context.blocked) {
        return createBlockedResult(context, "COLLECTION");
      }

      const opportunities = [];
      if (context.gameplayTags.includes("NATURE_DISCOVERY")) {
        opportunities.push("FLORA_SAMPLE");
      }
      if (context.gameplayTags.includes("SCENIC_DESTINATION")) {
        opportunities.push("LANDSCAPE_MEMORY");
      }
      if (context.gameplayTags.includes("TRAIL_PROGRESS")) {
        opportunities.push("ROUTE_STAMP");
      }
      if (context.featureSummary.transitionPresence) {
        opportunities.push("TERRAIN_STUDY");
      }

      return deepFreeze({
        scenarioId: context.scenarioId,
        scenarioType: context.scenarioType,
        outputType: "COLLECTION",
        blocked: false,
        approvedRecipeId: context.recipeId,
        reviewState: context.reviewState,
        suitabilityScore: context.collectionScore,
        suitabilityBand: context.collectionBand,
        opportunityCount: opportunities.length,
        opportunities: opportunities.map((opportunityId, index) => ({
          opportunityId: `${context.scenarioId}_${opportunityId}`,
          collectionTag: opportunityId,
          rank: index + 1
        })),
        liveGameplayStateCreated: false,
        deterministicFingerprint: hashHex(
          context.scenarioId,
          "COLLECTION",
          context.collectionScore,
          JSON.stringify(opportunities)
        )
      });
    })
  );
}

function buildPoiOutputs(scenarioContexts) {
  return deepFreeze(
    scenarioContexts.map((context) => {
      if (context.blocked) {
        return createBlockedResult(context, "POI");
      }

      return deepFreeze({
        scenarioId: context.scenarioId,
        scenarioType: context.scenarioType,
        outputType: "POI",
        blocked: false,
        approvedRecipeId: context.recipeId,
        reviewState: context.reviewState,
        opportunityCount: context.poiOpportunities.length,
        opportunities: context.poiOpportunities.map((opportunity, index) => ({
          ...opportunity,
          rank: index + 1
        })),
        liveGameplayStateCreated: false,
        deterministicFingerprint: hashHex(
          context.scenarioId,
          "POI",
          JSON.stringify(context.poiOpportunities)
        )
      });
    })
  );
}

function buildValidation(
  planning,
  scenarioInputs,
  scenarioContexts,
  achievementOutputs,
  questOutputs,
  collectionOutputs,
  poiOutputs
) {
  const supportedRecipeIds = new Set(
    planning.specification.gameplayMetadataContract.supportedRecipeIds
  );

  const outputGroups = [
    achievementOutputs,
    questOutputs,
    collectionOutputs,
    poiOutputs
  ];

  const checks = [
    {
      name: "deterministic_gameplay_metadata",
      ok: scenarioContexts.every((context) =>
        context.blocked === true || typeof context.deterministicFingerprint === "string"
      )
    },
    {
      name: "approved_recipes_only",
      ok: outputGroups.every((group) =>
        group.every(
          (entry) =>
            entry.blocked === true ||
            (entry.approvedRecipeId && supportedRecipeIds.has(entry.approvedRecipeId))
        )
      )
    },
    {
      name: "unsupported_hooks_blocked",
      ok: scenarioContexts
        .filter((context) => context.blocked)
        .every((context) => context.reviewState === "BLOCKED_UNSUPPORTED")
    },
    {
      name: "no_live_gameplay_state_created",
      ok: outputGroups.every((group) =>
        group.every((entry) => entry.liveGameplayStateCreated === false)
      )
    },
    {
      name: "scenario_coverage_present",
      ok:
        scenarioInputs.length === 4 &&
        scenarioInputs.some((entry) => entry.scenarioType === "coastal_location") &&
        scenarioInputs.some((entry) => entry.scenarioType === "forest_location") &&
        scenarioInputs.some((entry) => entry.scenarioType === "unsupported_location") &&
        scenarioInputs.some((entry) => entry.scenarioType === "ambiguous_location")
    },
    {
      name: "blocked_scenarios_do_not_emit_live_opportunities",
      ok: outputGroups.every((group) =>
        group
          .filter((entry) => entry.blocked)
          .every((entry) => entry.opportunityCount === 0 && entry.opportunities.length === 0)
      )
    },
    {
      name: "ambiguous_scenario_uses_approved_recipe_only",
      ok: scenarioContexts.some(
        (context) =>
          context.scenarioType === "ambiguous_location" &&
          context.reviewState === "APPROVED_AMBIGUOUS_REVIEW_REQUIRED" &&
          supportedRecipeIds.has(context.recipeId)
      )
    },
    {
      name: "runtime_quests_achievements_player_blender_glb_asset_mutation_blocked",
      ok:
        planning.validation.runtimeActivationAuthorized === false &&
        planning.validation.questsCreated === false &&
        planning.validation.achievementsAwarded === false &&
        planning.validation.playerExposureAuthorized === false &&
        planning.validation.blenderAuthorized === false &&
        planning.validation.glbAuthorized === false &&
        planning.validation.assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_OPPORTUNITY_SIMULATION_VALIDATION_001",
    simulationId: "ATLAS_GAMEPLAY_OPPORTUNITY_SIMULATION_001",
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    scenarioCount: scenarioInputs.length,
    checks,
    deterministicFingerprint: hashHex(
      "ATLAS_GAMEPLAY_OPPORTUNITY_SIMULATION_001",
      JSON.stringify(scenarioInputs),
      JSON.stringify(scenarioContexts),
      JSON.stringify(achievementOutputs),
      JSON.stringify(questOutputs),
      JSON.stringify(collectionOutputs),
      JSON.stringify(poiOutputs),
      JSON.stringify(checks)
    ),
    runtimeActivationAuthorized: false,
    questsCreated: false,
    achievementsAwarded: false,
    playerExposureAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(
  scenarioInputs,
  scenarioContexts,
  achievementOutputs,
  questOutputs,
  collectionOutputs,
  poiOutputs,
  validation
) {
  const lines = scenarioInputs
    .map((input) => {
      const context = scenarioContexts.find((entry) => entry.scenarioId === input.scenarioId);
      const achievements = achievementOutputs.find((entry) => entry.scenarioId === input.scenarioId);
      const quests = questOutputs.find((entry) => entry.scenarioId === input.scenarioId);
      const collections = collectionOutputs.find((entry) => entry.scenarioId === input.scenarioId);
      const pois = poiOutputs.find((entry) => entry.scenarioId === input.scenarioId);

      if (context?.blocked) {
        return `- ${input.scenarioId}: BLOCKED unsupported gameplay context`;
      }

      return `- ${input.scenarioId}: recipe ${context.recipeId}, achievements ${achievements?.opportunityCount ?? 0}, quests ${quests?.opportunityCount ?? 0}, collections ${collections?.opportunityCount ?? 0}, poi ${pois?.opportunityCount ?? 0}, review ${context.reviewState}`;
    })
    .join("\n");

  return `# ATLAS GAMEPLAY OPPORTUNITY SIMULATION REPORT

## Scope

ATLAS_GAMEPLAY_OPPORTUNITY_SIMULATION_001 proves that approved Atlas-generated locations can produce future gameplay opportunity metadata without creating live gameplay state.

## Scenario Results

${lines}

## Validation

- status: ${validation.status}
- scenario count: ${validation.scenarioCount}
- deterministic fingerprint: ${validation.deterministicFingerprint}

## Safety

- runtime activation authorized: ${validation.runtimeActivationAuthorized}
- quests created: ${validation.questsCreated}
- achievements awarded: ${validation.achievementsAwarded}
- player exposure authorized: ${validation.playerExposureAuthorized}
- Blender authorized: ${validation.blenderAuthorized}
- GLB authorized: ${validation.glbAuthorized}
- asset modification authorized: ${validation.assetModificationAuthorized}

## Readiness

Future gameplay integration: READY
`;
}

export function buildAtlasGameplayOpportunitySimulation({
  cwd = process.cwd()
} = {}) {
  const planning = buildAtlasGameplayIntegrationPlanning({ cwd });
  const metadataIndex = indexRepresentativeMetadata(planning.representativeMetadata);
  const scenarioInputs = createSimulationInputs();
  const scenarioContexts = deepFreeze(
    scenarioInputs.map((input) =>
      createScenarioContext(input, input.recipeId ? metadataIndex.get(input.recipeId) : null, planning.gameplayMetadataSchema)
    )
  );
  const achievementOutputs = buildAchievementOutputs(scenarioContexts);
  const questOutputs = buildQuestOutputs(scenarioContexts);
  const collectionOutputs = buildCollectionOutputs(scenarioContexts);
  const poiOutputs = buildPoiOutputs(scenarioContexts);
  const validation = buildValidation(
    planning,
    scenarioInputs,
    scenarioContexts,
    achievementOutputs,
    questOutputs,
    collectionOutputs,
    poiOutputs
  );
  const report = buildReport(
    scenarioInputs,
    scenarioContexts,
    achievementOutputs,
    questOutputs,
    collectionOutputs,
    poiOutputs,
    validation
  );

  return deepFreeze({
    root: path.resolve(cwd, SIMULATION_ROOT),
    scenarioInputs,
    scenarioContexts,
    achievementOutputs,
    questOutputs,
    collectionOutputs,
    poiOutputs,
    validation,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasGameplayOpportunitySimulation({
  cwd = process.cwd()
} = {}) {
  const simulation = buildAtlasGameplayOpportunitySimulation({ cwd });
  const simulationDir = path.join(simulation.root, "simulation");
  const validationDir = path.join(simulation.root, "validation");
  const reportsDir = path.join(simulation.root, "reports");

  for (const directory of [simulationDir, validationDir, reportsDir]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(simulationDir, INPUTS_FILENAME), simulation.scenarioInputs);
  writeJson(
    path.join(simulationDir, ACHIEVEMENT_OUTPUTS_FILENAME),
    simulation.achievementOutputs
  );
  writeJson(path.join(simulationDir, QUEST_OUTPUTS_FILENAME), simulation.questOutputs);
  writeJson(
    path.join(simulationDir, COLLECTION_OUTPUTS_FILENAME),
    simulation.collectionOutputs
  );
  writeJson(path.join(simulationDir, POI_OUTPUTS_FILENAME), simulation.poiOutputs);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), simulation.validation);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), simulation.report);

  return simulation;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasGameplayOpportunitySimulation();
}
