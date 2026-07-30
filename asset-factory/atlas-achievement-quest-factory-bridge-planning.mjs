import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasGameplayIntegrationPlanning } from "./atlas-gameplay-integration-planning.mjs";
import { buildAtlasGameplayOpportunitySimulation } from "./atlas-gameplay-opportunity-simulation.mjs";

const BRIDGE_ROOT =
  "asset-factory-workspace/atlas-gameplay/ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_001";

const SPECIFICATION_FILENAME =
  "atlas-achievement-quest-factory-bridge-specification.json";
const CONTRACTS_FILENAME =
  "atlas-achievement-quest-factory-bridge-metadata-contracts.json";
const VALIDATION_FILENAME =
  "atlas-achievement-quest-factory-bridge-validation.json";
const LIFECYCLE_FILENAME =
  "atlas-achievement-quest-factory-bridge-lifecycle-boundaries.json";
const REPORT_FILENAME =
  "atlas-achievement-quest-factory-bridge-architecture-report.md";

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

function getByScenarioId(records, scenarioId) {
  return records.find((record) => record.scenarioId === scenarioId) ?? null;
}

function buildBridgeSpecification(gameplayPlanning, gameplaySimulation) {
  return deepFreeze({
    schemaId: "ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_SPECIFICATION_001",
    bridgeId: "ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      gameplayIntegrationId: gameplayPlanning.specification.integrationId,
      gameplayOpportunitySimulationId:
        gameplaySimulation.validation.simulationId,
      achievementFactory: "ACHIEVEMENT_FACTORY_PLANNING_TARGET",
      questFactory: "QUEST_FACTORY_PLANNING_TARGET"
    },
    opportunityToAchievementMapping: {
      sourceOutputType: "ACHIEVEMENT",
      requiredFields: [
        "scenarioId",
        "approvedRecipeId",
        "suitabilityScore",
        "suitabilityBand",
        "opportunities"
      ],
      mappingRules: [
        "SCENIC_LOOKOUT -> scenic_discovery_achievement_candidate",
        "SHORELINE_DISCOVERY -> coastal_progress_achievement_candidate",
        "FOREST_CLEARING_DISCOVERY -> forest_discovery_achievement_candidate",
        "ROUTE_COMPLETION -> traversal_completion_achievement_candidate",
        "NATURE_OBSERVATION -> observation_achievement_candidate"
      ],
      blockedWhen: [
        "scenario blocked unsupported",
        "approvedRecipeId missing",
        "live gameplay requested"
      ]
    },
    opportunityToQuestMapping: {
      sourceOutputType: "QUEST",
      requiredFields: [
        "scenarioId",
        "approvedRecipeId",
        "suitabilityScore",
        "suitabilityBand",
        "opportunities"
      ],
      mappingRules: [
        "WALKING_ROUTE -> route_following_quest_candidate",
        "DESTINATION_VISIT -> destination_visit_quest_candidate",
        "CROSSING_INTERACTION -> transition_interaction_quest_candidate",
        "BIOZONE_SURVEY -> ecology_survey_quest_candidate",
        "DISCOVERY_LOOP -> exploration_loop_quest_candidate"
      ],
      blockedWhen: [
        "scenario blocked unsupported",
        "review state unresolved",
        "quest creation requested"
      ]
    },
    collectionHookMapping: {
      sourceOutputType: "COLLECTION",
      hookTargets: [
        "flora_sample_collection_hook",
        "landscape_memory_collection_hook",
        "route_stamp_collection_hook",
        "terrain_study_collection_hook"
      ],
      requiredFields: ["scenarioId", "collectionTag", "rank"],
      deterministicOrdering: true
    },
    poiHookMapping: {
      sourceOutputType: "POI",
      hookTargets: [
        "poi_preview_candidate",
        "poi_discovery_candidate",
        "poi_route_anchor_candidate"
      ],
      requiredFields: ["scenarioId", "type", "zoneId", "rank"],
      deterministicOrdering: true
    },
    difficultyEstimation: {
      bands: ["VERY_LIGHT", "LIGHT", "MODERATE", "HIGH"],
      inputs: [
        "quest suitability score",
        "achievement suitability score",
        "routeLengthBand",
        "traversalComplexity",
        "reviewState"
      ],
      estimationRules: [
        "blocked scenarios do not produce difficulty",
        "ambiguous review state caps difficulty at MODERATE planning confidence",
        "moderate traversal complexity increases quest difficulty band"
      ]
    },
    rewardPlanningInputs: {
      supportedRewardInputs: [
        "rewardTheme",
        "rewardRarityHint",
        "collectionWeight",
        "discoveryWeight",
        "traversalWeight"
      ],
      sourceSignals: [
        "opportunity type",
        "suitability score",
        "featureSummary.destinationType",
        "featureSummary.floraDensityBand"
      ],
      rewardsCreatedByBridge: false
    },
    validationRules: {
      approvedRecipesOnly: true,
      deterministicMappingsRequired: true,
      unsupportedContextsBlocked: true,
      liveGameplayStateBlocked: true
    },
    lifecycleBoundaries: {
      allowedStates: [
        "PLANNING_ONLY",
        "FACTORY_INPUT_READY",
        "REVIEW_REQUIRED"
      ],
      blockedStates: [
        "QUEST_CREATED",
        "ACHIEVEMENT_CREATED",
        "REWARD_GRANTED",
        "RUNTIME_ACTIVATED",
        "PLAYER_VISIBLE"
      ]
    }
  });
}

function deriveDifficultyBand({ questScore, achievementScore, traversalComplexity, reviewState }) {
  const base = Math.round((questScore + achievementScore) / 2);
  if (reviewState === "APPROVED_AMBIGUOUS_REVIEW_REQUIRED") {
    return base >= 70 ? "MODERATE" : "LIGHT";
  }
  if (traversalComplexity === "MODERATE") {
    if (base >= 75) {
      return "HIGH";
    }
    if (base >= 55) {
      return "MODERATE";
    }
    return "LIGHT";
  }
  if (base >= 70) {
    return "MODERATE";
  }
  if (base >= 45) {
    return "LIGHT";
  }
  return "VERY_LIGHT";
}

function deriveRewardTheme({ scenarioType, featureSummary, reviewState }) {
  if (reviewState === "APPROVED_AMBIGUOUS_REVIEW_REQUIRED") {
    return "REVIEW_GATED_DISCOVERY";
  }
  if (scenarioType === "coastal_location") {
    return featureSummary.destinationType === "DESTINATION"
      ? "COASTAL_LOOKOUT_DISCOVERY"
      : "COASTAL_TRAIL_PROGRESS";
  }
  if (scenarioType === "forest_location") {
    return featureSummary.destinationType === "CLEARING"
      ? "FOREST_CLEARING_DISCOVERY"
      : "FOREST_TRACK_PROGRESS";
  }
  return "UNSUPPORTED";
}

function deriveRewardRarityHint(score) {
  if (score >= 80) {
    return "HIGH";
  }
  if (score >= 60) {
    return "MEDIUM";
  }
  return "LOW";
}

function buildMetadataContracts(gameplayPlanning, gameplaySimulation) {
  const supportedScenarios = gameplaySimulation.scenarioContexts.filter(
    (context) => !context.blocked
  );

  const achievementFactoryInputs = supportedScenarios.map((context) => {
    const achievementOutput = getByScenarioId(
      gameplaySimulation.achievementOutputs,
      context.scenarioId
    );
    return {
      schemaId: "ATLAS_ACHIEVEMENT_FACTORY_INPUT_001",
      scenarioId: context.scenarioId,
      approvedRecipeId: context.recipeId,
      reviewState: context.reviewState,
      difficultyBand: deriveDifficultyBand({
        questScore: context.questScore,
        achievementScore: context.achievementScore,
        traversalComplexity: context.featureSummary.traversalComplexity,
        reviewState: context.reviewState
      }),
      rewardPlanningInput: {
        rewardTheme: deriveRewardTheme(context),
        rewardRarityHint: deriveRewardRarityHint(
          achievementOutput?.suitabilityScore ?? 0
        ),
        collectionWeight: context.collectionScore,
        discoveryWeight: context.achievementScore,
        traversalWeight: context.questScore
      },
      mappedAchievements: (achievementOutput?.opportunities ?? []).map(
        (opportunity) => ({
          sourceOpportunityId: opportunity.opportunityId,
          achievementCandidateType: opportunity.achievementTag,
          planningOnly: true
        })
      ),
      deterministicFingerprint: hashHex(
        context.scenarioId,
        context.recipeId,
        "ACHIEVEMENT_FACTORY_INPUT",
        JSON.stringify(achievementOutput?.opportunities ?? [])
      )
    };
  });

  const questFactoryInputs = supportedScenarios.map((context) => {
    const questOutput = getByScenarioId(
      gameplaySimulation.questOutputs,
      context.scenarioId
    );
    return {
      schemaId: "ATLAS_QUEST_FACTORY_INPUT_001",
      scenarioId: context.scenarioId,
      approvedRecipeId: context.recipeId,
      reviewState: context.reviewState,
      difficultyBand: deriveDifficultyBand({
        questScore: context.questScore,
        achievementScore: context.achievementScore,
        traversalComplexity: context.featureSummary.traversalComplexity,
        reviewState: context.reviewState
      }),
      rewardPlanningInput: {
        rewardTheme: deriveRewardTheme(context),
        rewardRarityHint: deriveRewardRarityHint(questOutput?.suitabilityScore ?? 0),
        collectionWeight: context.collectionScore,
        discoveryWeight: context.achievementScore,
        traversalWeight: context.questScore
      },
      mappedQuests: (questOutput?.opportunities ?? []).map((opportunity) => ({
        sourceOpportunityId: opportunity.opportunityId,
        questCandidateType: opportunity.questTag,
        planningOnly: true
      })),
      deterministicFingerprint: hashHex(
        context.scenarioId,
        context.recipeId,
        "QUEST_FACTORY_INPUT",
        JSON.stringify(questOutput?.opportunities ?? [])
      )
    };
  });

  const collectionHooks = supportedScenarios.map((context) => {
    const collectionOutput = getByScenarioId(
      gameplaySimulation.collectionOutputs,
      context.scenarioId
    );
    return {
      schemaId: "ATLAS_COLLECTION_HOOK_INPUT_001",
      scenarioId: context.scenarioId,
      approvedRecipeId: context.recipeId,
      reviewState: context.reviewState,
      hooks: (collectionOutput?.opportunities ?? []).map((opportunity) => ({
        sourceOpportunityId: opportunity.opportunityId,
        collectionHookType: opportunity.collectionTag,
        planningOnly: true
      })),
      deterministicFingerprint: hashHex(
        context.scenarioId,
        context.recipeId,
        "COLLECTION_HOOK_INPUT",
        JSON.stringify(collectionOutput?.opportunities ?? [])
      )
    };
  });

  const poiHooks = supportedScenarios.map((context) => {
    const poiOutput = getByScenarioId(
      gameplaySimulation.poiOutputs,
      context.scenarioId
    );
    return {
      schemaId: "ATLAS_POI_HOOK_INPUT_001",
      scenarioId: context.scenarioId,
      approvedRecipeId: context.recipeId,
      reviewState: context.reviewState,
      hooks: (poiOutput?.opportunities ?? []).map((opportunity) => ({
        sourceOpportunityId: opportunity.poiOpportunityId,
        poiHookType: opportunity.type,
        zoneId: opportunity.zoneId,
        planningOnly: true
      })),
      deterministicFingerprint: hashHex(
        context.scenarioId,
        context.recipeId,
        "POI_HOOK_INPUT",
        JSON.stringify(poiOutput?.opportunities ?? [])
      )
    };
  });

  return deepFreeze({
    schemaId: "ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_METADATA_CONTRACTS_001",
    bridgeId: "ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_001",
    gameplayIntegrationReference: gameplayPlanning.specification.integrationId,
    achievementFactoryInputs,
    questFactoryInputs,
    collectionHooks,
    poiHooks
  });
}

function buildValidation(specification, contracts, gameplayPlanning, gameplaySimulation) {
  const checks = [
    {
      name: "opportunity_to_achievement_mapping_defined",
      ok: specification.opportunityToAchievementMapping.mappingRules.length >= 5
    },
    {
      name: "opportunity_to_quest_mapping_defined",
      ok: specification.opportunityToQuestMapping.mappingRules.length >= 5
    },
    {
      name: "collection_hook_mapping_defined",
      ok: specification.collectionHookMapping.hookTargets.length >= 4
    },
    {
      name: "poi_hook_mapping_defined",
      ok: specification.poiHookMapping.hookTargets.length >= 3
    },
    {
      name: "difficulty_estimation_defined",
      ok: specification.difficultyEstimation.inputs.length >= 5
    },
    {
      name: "reward_planning_inputs_defined",
      ok: specification.rewardPlanningInputs.supportedRewardInputs.length >= 5
    },
    {
      name: "approved_recipes_only",
      ok:
        contracts.achievementFactoryInputs.every((entry) =>
          gameplayPlanning.specification.gameplayMetadataContract.supportedRecipeIds.includes(
            entry.approvedRecipeId
          )
        ) &&
        contracts.questFactoryInputs.every((entry) =>
          gameplayPlanning.specification.gameplayMetadataContract.supportedRecipeIds.includes(
            entry.approvedRecipeId
          )
        )
    },
    {
      name: "unsupported_simulation_scenarios_remain_blocked",
      ok: gameplaySimulation.achievementOutputs
        .filter((entry) => entry.blocked)
        .every((entry) => entry.approvedRecipeId === null)
    },
    {
      name: "no_quests_achievements_rewards_runtime_or_player_state_created",
      ok:
        gameplayPlanning.validation.questsCreated === false &&
        gameplayPlanning.validation.achievementsAwarded === false &&
        gameplayPlanning.validation.runtimeActivationAuthorized === false &&
        gameplayPlanning.validation.playerExposureAuthorized === false &&
        specification.rewardPlanningInputs.rewardsCreatedByBridge === false
    },
    {
      name: "deterministic_bridge_outputs",
      ok:
        contracts.achievementFactoryInputs.every(
          (entry) => typeof entry.deterministicFingerprint === "string"
        ) &&
        contracts.questFactoryInputs.every(
          (entry) => typeof entry.deterministicFingerprint === "string"
        ) &&
        contracts.collectionHooks.every(
          (entry) => typeof entry.deterministicFingerprint === "string"
        ) &&
        contracts.poiHooks.every(
          (entry) => typeof entry.deterministicFingerprint === "string"
        )
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_VALIDATION_001",
    bridgeId: specification.bridgeId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      specification.bridgeId,
      JSON.stringify(specification),
      JSON.stringify(contracts),
      JSON.stringify(checks)
    ),
    questsCreated: false,
    achievementsCreated: false,
    rewardsCreated: false,
    runtimeActivationAuthorized: false,
    playerExposureAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildLifecycle(specification, validation, contracts) {
  return deepFreeze({
    schemaId: "ATLAS_ACHIEVEMENT_QUEST_FACTORY_BRIDGE_LIFECYCLE_001",
    bridgeId: specification.bridgeId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    allowedStates: specification.lifecycleBoundaries.allowedStates,
    blockedStates: specification.lifecycleBoundaries.blockedStates,
    achievementFactoryInputCount: contracts.achievementFactoryInputs.length,
    questFactoryInputCount: contracts.questFactoryInputs.length,
    collectionHookCount: contracts.collectionHooks.length,
    poiHookCount: contracts.poiHooks.length,
    questsCreated: false,
    achievementsCreated: false,
    rewardsCreated: false,
    runtimeActivationAuthorized: false,
    playerExposureAuthorized: false,
    deterministicFingerprint: validation.deterministicFingerprint
  });
}

function buildReport(specification, contracts, validation, lifecycle) {
  const achievementLines = contracts.achievementFactoryInputs
    .map(
      (entry) =>
        `- ${entry.scenarioId}: ${entry.mappedAchievements.length} achievement candidates, difficulty ${entry.difficultyBand}, reward theme ${entry.rewardPlanningInput.rewardTheme}`
    )
    .join("\n");

  const questLines = contracts.questFactoryInputs
    .map(
      (entry) =>
        `- ${entry.scenarioId}: ${entry.mappedQuests.length} quest candidates, difficulty ${entry.difficultyBand}, reward hint ${entry.rewardPlanningInput.rewardRarityHint}`
    )
    .join("\n");

  return `# ATLAS ACHIEVEMENT & QUEST FACTORY BRIDGE ARCHITECTURE REPORT

## Scope

${specification.bridgeId} defines the planning bridge between Atlas gameplay opportunities and future Achievement Factory / Quest Factory systems.

## Defined Areas

- opportunity to achievement mapping
- opportunity to quest mapping
- collection hook mapping
- POI hook mapping
- difficulty estimation
- reward planning inputs
- validation rules
- lifecycle boundaries

## Achievement Factory Inputs

${achievementLines}

## Quest Factory Inputs

${questLines}

## Safety

- quests created: ${validation.questsCreated}
- achievements created: ${validation.achievementsCreated}
- rewards created: ${validation.rewardsCreated}
- runtime activation authorized: ${validation.runtimeActivationAuthorized}
- player exposure authorized: ${validation.playerExposureAuthorized}
- Blender authorized: ${validation.blenderAuthorized}
- GLB authorized: ${validation.glbAuthorized}
- asset modification authorized: ${validation.assetModificationAuthorized}

## Lifecycle

- lifecycle status: ${lifecycle.lifecycleStatus}
- achievement factory input count: ${lifecycle.achievementFactoryInputCount}
- quest factory input count: ${lifecycle.questFactoryInputCount}
- collection hook count: ${lifecycle.collectionHookCount}
- poi hook count: ${lifecycle.poiHookCount}

## Readiness

Future gameplay factory integration: READY
`;
}

export function buildAtlasAchievementQuestFactoryBridgePlanning({
  cwd = process.cwd()
} = {}) {
  const gameplayPlanning = buildAtlasGameplayIntegrationPlanning({ cwd });
  const gameplaySimulation = buildAtlasGameplayOpportunitySimulation({ cwd });
  const specification = buildBridgeSpecification(
    gameplayPlanning,
    gameplaySimulation
  );
  const contracts = buildMetadataContracts(
    gameplayPlanning,
    gameplaySimulation
  );
  const validation = buildValidation(
    specification,
    contracts,
    gameplayPlanning,
    gameplaySimulation
  );
  const lifecycle = buildLifecycle(specification, validation, contracts);
  const report = buildReport(specification, contracts, validation, lifecycle);

  return deepFreeze({
    root: path.resolve(cwd, BRIDGE_ROOT),
    specification,
    contracts,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasAchievementQuestFactoryBridgePlanning({
  cwd = process.cwd()
} = {}) {
  const bridge = buildAtlasAchievementQuestFactoryBridgePlanning({ cwd });
  const specificationDir = path.join(bridge.root, "specification");
  const metadataDir = path.join(bridge.root, "metadata");
  const validationDir = path.join(bridge.root, "validation");
  const lifecycleDir = path.join(bridge.root, "lifecycle");
  const reportsDir = path.join(bridge.root, "reports");

  for (const directory of [
    specificationDir,
    metadataDir,
    validationDir,
    lifecycleDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(specificationDir, SPECIFICATION_FILENAME),
    bridge.specification
  );
  writeJson(path.join(metadataDir, CONTRACTS_FILENAME), bridge.contracts);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), bridge.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), bridge.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), bridge.report);

  return bridge;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasAchievementQuestFactoryBridgePlanning();
}
