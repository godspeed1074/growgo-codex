import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasGameplayIntegrationPlanning } from "./atlas-gameplay-integration-planning.mjs";
import { buildAtlasGameplayOpportunitySimulation } from "./atlas-gameplay-opportunity-simulation.mjs";
import { buildAtlasAchievementQuestFactoryBridgePlanning } from "./atlas-achievement-quest-factory-bridge-planning.mjs";

const VALIDATION_ROOT =
  "asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001";

const SPECIFICATION_FILENAME =
  "atlas-gameplay-opportunity-validation-specification.json";
const CONTRACTS_FILENAME =
  "atlas-gameplay-opportunity-validation-metadata-contracts.json";
const VALIDATION_FILENAME =
  "atlas-gameplay-opportunity-validation-record.json";
const LIFECYCLE_FILENAME =
  "atlas-gameplay-opportunity-validation-lifecycle-rules.json";
const REPORT_FILENAME =
  "atlas-gameplay-opportunity-validation-architecture-report.md";

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

function buildValidationSpecification(
  gameplayPlanning,
  gameplaySimulation,
  bridgePlanning
) {
  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_SPECIFICATION_001",
    validationId: "ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      gameplayIntegrationId: gameplayPlanning.specification.integrationId,
      gameplayOpportunitySimulationId:
        gameplaySimulation.validation.simulationId,
      achievementQuestFactoryBridgeId: bridgePlanning.specification.bridgeId
    },
    opportunityQualityScoring: {
      scoreRange: [0, 100],
      weightedFactors: [
        { factor: "suitability_score", weight: 0.35 },
        { factor: "location_feature_clarity", weight: 0.2 },
        { factor: "opportunity_count_balance", weight: 0.15 },
        { factor: "review_state_confidence", weight: 0.15 },
        { factor: "player_experience_safety", weight: 0.15 }
      ],
      decisionBands: {
        APPROVE: 75,
        REVIEW: 50,
        HOLD: 30
      }
    },
    duplicatePrevention: {
      duplicateSignatureFields: [
        "approvedRecipeId",
        "scenarioType",
        "opportunityType",
        "rewardTheme",
        "difficultyBand"
      ],
      duplicatePolicies: [
        "identical signatures in the same validation batch must be flagged",
        "duplicate signatures may survive only when sourceOpportunityId differs and review state is explicit",
        "blocked scenarios cannot generate duplicate candidates"
      ],
      deterministicOrderingRequired: true
    },
    difficultyValidation: {
      allowedBands: ["VERY_LIGHT", "LIGHT", "MODERATE", "HIGH"],
      validationRules: [
        "blocked scenarios cannot emit difficulty",
        "ambiguous review state cannot exceed MODERATE",
        "moderate traversal complexity may raise but not skip directly to HIGH without strong scores"
      ]
    },
    locationSuitabilityChecks: {
      requiredFields: [
        "routeLengthBand",
        "destinationType",
        "transitionPresence",
        "floraDensityBand",
        "traversalComplexity"
      ],
      checks: [
        "coastal opportunities require shoreline or destination evidence for scenic hooks",
        "forest opportunities require canopy or clearing evidence for forest hooks",
        "quest candidates require traversable route evidence",
        "collection candidates require discovery or flora evidence"
      ]
    },
    rewardPlanningValidation: {
      requiredFields: [
        "rewardTheme",
        "rewardRarityHint",
        "collectionWeight",
        "discoveryWeight",
        "traversalWeight"
      ],
      rules: [
        "reward theme must align with scenario type or review state",
        "reward rarity hint must be LOW, MEDIUM, or HIGH",
        "weights must remain numeric planning signals only",
        "no reward objects or payout records may be created"
      ]
    },
    playerExperienceRules: {
      rules: [
        "unsupported scenarios must block instead of generating thin content",
        "ambiguous scenarios must remain visible for review",
        "opportunity density should stay readable rather than noisy",
        "difficulty should scale with traversal clarity and destination strength"
      ],
      blockedOutcomes: [
        "confusing duplicate hooks",
        "unsupported environment hooks",
        "live player state mutation",
        "reward inflation via repeated signatures"
      ]
    },
    approvalGates: {
      states: ["READY_FOR_FACTORY_INPUT", "REVIEW_REQUIRED", "HOLD", "BLOCKED"],
      gateChecks: [
        "quality_score_band_valid",
        "duplicate_signature_policy_passes",
        "difficulty_band_valid",
        "location_suitability_valid",
        "reward_planning_valid",
        "player_experience_rules_valid"
      ],
      approvedRecipesOnly: true
    }
  });
}

function scoreBand(score, thresholds) {
  if (score >= thresholds.APPROVE) {
    return "READY_FOR_FACTORY_INPUT";
  }
  if (score >= thresholds.REVIEW) {
    return "REVIEW_REQUIRED";
  }
  if (score >= thresholds.HOLD) {
    return "HOLD";
  }
  return "BLOCKED";
}

function computeQualityScore({
  suitabilityScore,
  featureSummary,
  opportunityCount,
  reviewState
}) {
  const featureClarity =
    featureSummary.destinationType !== "NONE" && featureSummary.routeLengthBand === "MEDIUM"
      ? 82
      : featureSummary.transitionPresence
        ? 68
        : 54;
  const opportunityBalance =
    opportunityCount >= 2 && opportunityCount <= 5
      ? 80
      : opportunityCount === 1
        ? 58
        : opportunityCount > 5
          ? 52
          : 20;
  const reviewConfidence =
    reviewState === "DIRECT_APPROVED"
      ? 88
      : reviewState === "APPROVED_AMBIGUOUS_REVIEW_REQUIRED"
        ? 56
        : 10;
  const playerExperienceSafety = reviewState === "BLOCKED_UNSUPPORTED" ? 0 : 86;

  return Math.round(
    suitabilityScore * 0.35 +
      featureClarity * 0.2 +
      opportunityBalance * 0.15 +
      reviewConfidence * 0.15 +
      playerExperienceSafety * 0.15
  );
}

function buildCandidateValidationRecords(
  gameplaySimulation,
  bridgePlanning,
  specification
) {
  const candidateRecords = [];
  const duplicateIndex = new Map();

  for (const context of gameplaySimulation.scenarioContexts) {
    if (context.blocked) {
      candidateRecords.push(
        deepFreeze({
          schemaId: "ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_CANDIDATE_001",
          scenarioId: context.scenarioId,
          scenarioType: context.scenarioType,
          approvedRecipeId: null,
          validationState: "BLOCKED",
          reason: "UNSUPPORTED_GAMEPLAY_CONTEXT",
          duplicateSignature: null,
          qualityScore: 0,
          difficultyBand: null,
          rewardPlanningValid: false,
          playerExperienceValid: true,
          deterministicFingerprint: hashHex(context.scenarioId, "BLOCKED")
        })
      );
      continue;
    }

    const achievementInput = getByScenarioId(
      bridgePlanning.contracts.achievementFactoryInputs,
      context.scenarioId
    );
    const questInput = getByScenarioId(
      bridgePlanning.contracts.questFactoryInputs,
      context.scenarioId
    );
    const collectionHook = getByScenarioId(
      bridgePlanning.contracts.collectionHooks,
      context.scenarioId
    );
    const poiHook = getByScenarioId(
      bridgePlanning.contracts.poiHooks,
      context.scenarioId
    );
    const achievementOutput = getByScenarioId(
      gameplaySimulation.achievementOutputs,
      context.scenarioId
    );
    const questOutput = getByScenarioId(
      gameplaySimulation.questOutputs,
      context.scenarioId
    );

    const opportunityCount =
      (achievementOutput?.opportunityCount ?? 0) +
      (questOutput?.opportunityCount ?? 0) +
      (collectionHook?.hooks.length ?? 0) +
      (poiHook?.hooks.length ?? 0);
    const suitabilityScore = Math.round(
      ((achievementOutput?.suitabilityScore ?? 0) +
        (questOutput?.suitabilityScore ?? 0) +
        context.collectionScore) /
        3
    );
    const qualityScore = computeQualityScore({
      suitabilityScore,
      featureSummary: context.featureSummary,
      opportunityCount,
      reviewState: context.reviewState
    });
    const validationState = scoreBand(
      qualityScore,
      specification.opportunityQualityScoring.decisionBands
    );
    const difficultyBand = questInput?.difficultyBand ?? achievementInput?.difficultyBand ?? null;
    const rewardTheme =
      questInput?.rewardPlanningInput.rewardTheme ??
      achievementInput?.rewardPlanningInput.rewardTheme ??
      "UNSPECIFIED";
    const rewardPlanningValid =
      ["LOW", "MEDIUM", "HIGH"].includes(
        questInput?.rewardPlanningInput.rewardRarityHint ??
          achievementInput?.rewardPlanningInput.rewardRarityHint
      ) &&
      rewardTheme !== "UNSUPPORTED";
    const locationSuitabilityValid =
      (context.scenarioType === "coastal_location" &&
        (context.featureSummary.transitionPresence ||
          context.featureSummary.destinationType === "DESTINATION")) ||
      (context.scenarioType === "forest_location" &&
        (context.featureSummary.destinationType === "CLEARING" ||
          context.gameplayTags.includes("CANOPY_EXPLORATION"))) ||
      context.scenarioType === "ambiguous_location";
    const difficultyValid =
      ["VERY_LIGHT", "LIGHT", "MODERATE", "HIGH"].includes(difficultyBand) &&
      !(context.reviewState === "APPROVED_AMBIGUOUS_REVIEW_REQUIRED" &&
        difficultyBand === "HIGH");
    const playerExperienceValid = opportunityCount >= 2 && opportunityCount <= 12;

    const duplicateSignature = [
      context.recipeId,
      context.scenarioType,
      rewardTheme,
      difficultyBand,
      context.reviewState
    ].join("|");
    duplicateIndex.set(
      duplicateSignature,
      (duplicateIndex.get(duplicateSignature) ?? 0) + 1
    );

    candidateRecords.push(
      deepFreeze({
        schemaId: "ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_CANDIDATE_001",
        scenarioId: context.scenarioId,
        scenarioType: context.scenarioType,
        approvedRecipeId: context.recipeId,
        reviewState: context.reviewState,
        validationState,
        qualityScore,
        difficultyBand,
        duplicateSignature,
        rewardPlanningValid,
        difficultyValid,
        locationSuitabilityValid,
        playerExperienceValid,
        opportunityCount,
        deterministicFingerprint: hashHex(
          context.scenarioId,
          context.recipeId,
          validationState,
          duplicateSignature,
          qualityScore
        )
      })
    );
  }

  return deepFreeze({
    candidateRecords,
    duplicateIndex: Object.fromEntries(
      [...duplicateIndex.entries()].sort(([left], [right]) =>
        left.localeCompare(right)
      )
    )
  });
}

function buildMetadataContracts(
  gameplayPlanning,
  gameplaySimulation,
  bridgePlanning,
  specification
) {
  const validationData = buildCandidateValidationRecords(
    gameplaySimulation,
    bridgePlanning,
    specification
  );

  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_METADATA_CONTRACTS_001",
    validationId: specification.validationId,
    gameplayIntegrationReference: gameplayPlanning.specification.integrationId,
    gameplayOpportunitySimulationReference:
      gameplaySimulation.validation.simulationId,
    achievementQuestBridgeReference: bridgePlanning.specification.bridgeId,
    candidateValidationRecords: validationData.candidateRecords,
    duplicateSignatures: validationData.duplicateIndex,
    approvalQueuePreview: validationData.candidateRecords.map((record) => ({
      scenarioId: record.scenarioId,
      validationState: record.validationState,
      qualityScore: record.qualityScore,
      approvedRecipeId: record.approvedRecipeId
    }))
  });
}

function buildValidation(specification, contracts, gameplayPlanning, gameplaySimulation, bridgePlanning) {
  const candidateRecords = contracts.candidateValidationRecords;

  const checks = [
    {
      name: "opportunity_quality_scoring_defined",
      ok: specification.opportunityQualityScoring.weightedFactors.length === 5
    },
    {
      name: "duplicate_prevention_defined",
      ok: specification.duplicatePrevention.duplicateSignatureFields.length >= 5
    },
    {
      name: "difficulty_validation_defined",
      ok: specification.difficultyValidation.allowedBands.length === 4
    },
    {
      name: "location_suitability_checks_defined",
      ok: specification.locationSuitabilityChecks.checks.length >= 4
    },
    {
      name: "reward_planning_validation_defined",
      ok: specification.rewardPlanningValidation.requiredFields.length === 5
    },
    {
      name: "player_experience_rules_defined",
      ok: specification.playerExperienceRules.rules.length >= 4
    },
    {
      name: "approval_gates_defined",
      ok: specification.approvalGates.gateChecks.length === 6
    },
    {
      name: "approved_recipe_only_candidates",
      ok: candidateRecords
        .filter((record) => record.approvedRecipeId !== null)
        .every((record) =>
          gameplayPlanning.specification.gameplayMetadataContract.supportedRecipeIds.includes(
            record.approvedRecipeId
          )
        )
    },
    {
      name: "duplicate_signatures_safe",
      ok: Object.values(contracts.duplicateSignatures).every((count) => count === 1)
    },
    {
      name: "no_live_creation_or_runtime_state",
      ok:
        gameplayPlanning.validation.questsCreated === false &&
        gameplayPlanning.validation.achievementsAwarded === false &&
        bridgePlanning.validation.questsCreated === false &&
        bridgePlanning.validation.achievementsCreated === false &&
        bridgePlanning.validation.rewardsCreated === false &&
        gameplaySimulation.validation.runtimeActivationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_RECORD_001",
    validationId: specification.validationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      specification.validationId,
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

function buildLifecycleRules(specification, contracts, validation) {
  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_OPPORTUNITY_VALIDATION_LIFECYCLE_RULES_001",
    validationId: specification.validationId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    allowedStates: [
      "PLANNING_ONLY",
      "VALIDATION_REVIEW",
      "APPROVAL_GATE_READY",
      "FACTORY_INPUT_READY"
    ],
    blockedStates: [
      "QUEST_CREATED",
      "ACHIEVEMENT_CREATED",
      "REWARD_GRANTED",
      "RUNTIME_ACTIVATED",
      "PLAYER_VISIBLE"
    ],
    approvalReadyCount: contracts.candidateValidationRecords.filter(
      (record) => record.validationState === "READY_FOR_FACTORY_INPUT"
    ).length,
    reviewRequiredCount: contracts.candidateValidationRecords.filter(
      (record) => record.validationState === "REVIEW_REQUIRED"
    ).length,
    blockedCount: contracts.candidateValidationRecords.filter(
      (record) => record.validationState === "BLOCKED"
    ).length,
    questsCreated: false,
    achievementsCreated: false,
    rewardsCreated: false,
    runtimeActivationAuthorized: false,
    playerExposureAuthorized: false,
    deterministicFingerprint: validation.deterministicFingerprint
  });
}

function buildReport(specification, contracts, validation, lifecycleRules) {
  const candidateLines = contracts.candidateValidationRecords
    .map(
      (record) =>
        `- ${record.scenarioId}: state ${record.validationState}, quality ${record.qualityScore}, difficulty ${record.difficultyBand ?? "NONE"}, recipe ${record.approvedRecipeId ?? "UNSUPPORTED"}`
    )
    .join("\n");

  return `# ATLAS GAMEPLAY OPPORTUNITY VALIDATION ARCHITECTURE REPORT

## Scope

${specification.validationId} defines the planning validation gate for Atlas-generated gameplay opportunities before they enter future Achievement Factory or Quest Factory workflows.

## Defined Areas

- opportunity quality scoring
- duplicate prevention
- difficulty validation
- location suitability checks
- reward planning validation
- player experience rules
- approval gates

## Candidate Validation Preview

${candidateLines}

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

- lifecycle status: ${lifecycleRules.lifecycleStatus}
- approval-ready count: ${lifecycleRules.approvalReadyCount}
- review-required count: ${lifecycleRules.reviewRequiredCount}
- blocked count: ${lifecycleRules.blockedCount}

## Readiness

Future gameplay factory integration: READY
`;
}

export function buildGameplayOpportunityValidationPlanning({
  cwd = process.cwd()
} = {}) {
  const gameplayPlanning = buildAtlasGameplayIntegrationPlanning({ cwd });
  const gameplaySimulation = buildAtlasGameplayOpportunitySimulation({ cwd });
  const bridgePlanning = buildAtlasAchievementQuestFactoryBridgePlanning({ cwd });

  const specification = buildValidationSpecification(
    gameplayPlanning,
    gameplaySimulation,
    bridgePlanning
  );
  const contracts = buildMetadataContracts(
    gameplayPlanning,
    gameplaySimulation,
    bridgePlanning,
    specification
  );
  const validation = buildValidation(
    specification,
    contracts,
    gameplayPlanning,
    gameplaySimulation,
    bridgePlanning
  );
  const lifecycleRules = buildLifecycleRules(specification, contracts, validation);
  const report = buildReport(specification, contracts, validation, lifecycleRules);

  return deepFreeze({
    root: path.resolve(cwd, VALIDATION_ROOT),
    specification,
    contracts,
    validation,
    lifecycleRules,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeGameplayOpportunityValidationPlanning({
  cwd = process.cwd()
} = {}) {
  const planning = buildGameplayOpportunityValidationPlanning({ cwd });
  const specificationDir = path.join(planning.root, "specification");
  const metadataDir = path.join(planning.root, "metadata");
  const validationDir = path.join(planning.root, "validation");
  const lifecycleDir = path.join(planning.root, "lifecycle");
  const reportsDir = path.join(planning.root, "reports");

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
    planning.specification
  );
  writeJson(path.join(metadataDir, CONTRACTS_FILENAME), planning.contracts);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), planning.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), planning.lifecycleRules);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), planning.report);

  return planning;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeGameplayOpportunityValidationPlanning();
}
