import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasAchievementQuestFactoryBridgePlanning } from "./atlas-achievement-quest-factory-bridge-planning.mjs";
import { buildGameplayOpportunityValidationPlanning } from "./gameplay-opportunity-validation-planning.mjs";

const HANDOFF_ROOT =
  "asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_001";

const SPECIFICATION_FILENAME =
  "atlas-gameplay-factory-template-handoff-specification.json";
const CONTRACTS_FILENAME =
  "atlas-gameplay-factory-template-handoff-metadata-contracts.json";
const LIFECYCLE_FILENAME =
  "atlas-gameplay-factory-template-handoff-lifecycle-rules.json";
const REPORT_FILENAME =
  "atlas-gameplay-factory-template-handoff-architecture-report.md";

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

function buildHandoffSpecification(validationPlanning, bridgePlanning) {
  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_SPECIFICATION_001",
    handoffId: "ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      gameplayOpportunityValidationId:
        validationPlanning.specification.validationId,
      achievementQuestFactoryBridgeId: bridgePlanning.specification.bridgeId,
      achievementFactory: "ACHIEVEMENT_FACTORY_PLANNING_TARGET",
      questFactory: "QUEST_FACTORY_PLANNING_TARGET",
      collections: "COLLECTIONS_PLANNING_TARGET",
      poiSystems: "POI_SYSTEMS_PLANNING_TARGET"
    },
    opportunityTemplateContracts: {
      contractFamilies: [
        "ACHIEVEMENT_TEMPLATE_INPUT",
        "QUEST_TEMPLATE_INPUT",
        "COLLECTION_TEMPLATE_INPUT",
        "POI_TEMPLATE_INPUT"
      ],
      requiredSharedFields: [
        "scenarioId",
        "approvedRecipeId",
        "handoffState",
        "validationState",
        "difficultyBand",
        "rewardPlanningInput",
        "sourceValidationFingerprint"
      ],
      supportedHandoffStates: [
        "HANDOFF_READY",
        "HANDOFF_REVIEW_REQUIRED",
        "HANDOFF_BLOCKED"
      ]
    },
    achievementInputSchema: {
      schemaId: "ATLAS_ACHIEVEMENT_TEMPLATE_INPUT_001",
      requiredFields: [
        "scenarioId",
        "approvedRecipeId",
        "achievementCandidateType",
        "difficultyBand",
        "rewardPlanningInput",
        "validationState"
      ],
      handoffRules: [
        "READY_FOR_FACTORY_INPUT becomes HANDOFF_READY",
        "REVIEW_REQUIRED becomes HANDOFF_REVIEW_REQUIRED",
        "BLOCKED remains HANDOFF_BLOCKED",
        "planningOnly flag must stay true"
      ]
    },
    questInputSchema: {
      schemaId: "ATLAS_QUEST_TEMPLATE_INPUT_001",
      requiredFields: [
        "scenarioId",
        "approvedRecipeId",
        "questCandidateType",
        "difficultyBand",
        "rewardPlanningInput",
        "validationState"
      ],
      handoffRules: [
        "quest candidates require validated traversal or destination structure",
        "planningOnly flag must stay true",
        "review-required candidates may hand off only as template-review items"
      ]
    },
    collectionInputSchema: {
      schemaId: "ATLAS_COLLECTION_TEMPLATE_INPUT_001",
      requiredFields: [
        "scenarioId",
        "approvedRecipeId",
        "collectionHookType",
        "validationState",
        "handoffState"
      ],
      handoffRules: [
        "collection hooks may not create collection rewards",
        "unsupported or blocked scenarios may not hand off hooks"
      ]
    },
    poiInputSchema: {
      schemaId: "ATLAS_POI_TEMPLATE_INPUT_001",
      requiredFields: [
        "scenarioId",
        "approvedRecipeId",
        "poiHookType",
        "zoneId",
        "validationState",
        "handoffState"
      ],
      handoffRules: [
        "poi hooks remain planning-only and preview-safe",
        "review-required candidates must remain review-visible"
      ]
    },
    difficultyHandoff: {
      supportedBands: ["VERY_LIGHT", "LIGHT", "MODERATE", "HIGH"],
      rules: [
        "difficulty is copied from validated bridge inputs",
        "blocked scenarios do not hand off difficulty",
        "review-required scenarios preserve their lower-confidence difficulty band"
      ]
    },
    rewardPlanningHandoff: {
      requiredFields: [
        "rewardTheme",
        "rewardRarityHint",
        "collectionWeight",
        "discoveryWeight",
        "traversalWeight"
      ],
      rules: [
        "reward inputs are planning hints only",
        "no reward grant record may be emitted",
        "reward theme must match scenario or review state"
      ]
    },
    validationHandoff: {
      requiredFields: [
        "validationState",
        "qualityScore",
        "duplicateSignature",
        "locationSuitabilityValid",
        "rewardPlanningValid",
        "playerExperienceValid"
      ],
      rules: [
        "handoff must preserve source validation state exactly",
        "handoff must preserve duplicate signature traceability",
        "handoff must expose whether a candidate was review-required or blocked"
      ]
    }
  });
}

function mapValidationStateToHandoffState(validationState) {
  if (validationState === "READY_FOR_FACTORY_INPUT") {
    return "HANDOFF_READY";
  }
  if (validationState === "REVIEW_REQUIRED" || validationState === "HOLD") {
    return "HANDOFF_REVIEW_REQUIRED";
  }
  return "HANDOFF_BLOCKED";
}

function buildMetadataContracts(validationPlanning, bridgePlanning) {
  const validationByScenario = new Map(
    validationPlanning.contracts.candidateValidationRecords.map((record) => [
      record.scenarioId,
      record
    ])
  );

  const achievementTemplates = bridgePlanning.contracts.achievementFactoryInputs.map(
    (input) => {
      const validationRecord = validationByScenario.get(input.scenarioId);
      return deepFreeze({
        schemaId: "ATLAS_ACHIEVEMENT_TEMPLATE_INPUT_001",
        scenarioId: input.scenarioId,
        approvedRecipeId: input.approvedRecipeId,
        handoffState: mapValidationStateToHandoffState(
          validationRecord?.validationState
        ),
        validationState: validationRecord?.validationState ?? "BLOCKED",
        difficultyBand: input.difficultyBand,
        rewardPlanningInput: input.rewardPlanningInput,
        validationTrace: {
          qualityScore: validationRecord?.qualityScore ?? 0,
          duplicateSignature: validationRecord?.duplicateSignature ?? null,
          locationSuitabilityValid:
            validationRecord?.locationSuitabilityValid ?? false,
          rewardPlanningValid: validationRecord?.rewardPlanningValid ?? false,
          playerExperienceValid:
            validationRecord?.playerExperienceValid ?? false
        },
        templateCandidates: input.mappedAchievements.map((candidate) => ({
          ...candidate,
          handoffTemplateType: "ACHIEVEMENT_TEMPLATE_CANDIDATE",
          planningOnly: true
        })),
        sourceValidationFingerprint:
          validationRecord?.deterministicFingerprint ?? null,
        deterministicFingerprint: hashHex(
          input.scenarioId,
          input.approvedRecipeId,
          "ACHIEVEMENT_TEMPLATE_INPUT",
          JSON.stringify(input.mappedAchievements),
          validationRecord?.validationState ?? "BLOCKED"
        )
      });
    }
  );

  const questTemplates = bridgePlanning.contracts.questFactoryInputs.map((input) => {
    const validationRecord = validationByScenario.get(input.scenarioId);
    return deepFreeze({
      schemaId: "ATLAS_QUEST_TEMPLATE_INPUT_001",
      scenarioId: input.scenarioId,
      approvedRecipeId: input.approvedRecipeId,
      handoffState: mapValidationStateToHandoffState(
        validationRecord?.validationState
      ),
      validationState: validationRecord?.validationState ?? "BLOCKED",
      difficultyBand: input.difficultyBand,
      rewardPlanningInput: input.rewardPlanningInput,
      validationTrace: {
        qualityScore: validationRecord?.qualityScore ?? 0,
        duplicateSignature: validationRecord?.duplicateSignature ?? null,
        locationSuitabilityValid:
          validationRecord?.locationSuitabilityValid ?? false,
        rewardPlanningValid: validationRecord?.rewardPlanningValid ?? false,
        playerExperienceValid:
          validationRecord?.playerExperienceValid ?? false
      },
      templateCandidates: input.mappedQuests.map((candidate) => ({
        ...candidate,
        handoffTemplateType: "QUEST_TEMPLATE_CANDIDATE",
        planningOnly: true
      })),
      sourceValidationFingerprint:
        validationRecord?.deterministicFingerprint ?? null,
      deterministicFingerprint: hashHex(
        input.scenarioId,
        input.approvedRecipeId,
        "QUEST_TEMPLATE_INPUT",
        JSON.stringify(input.mappedQuests),
        validationRecord?.validationState ?? "BLOCKED"
      )
    });
  });

  const collectionTemplates = bridgePlanning.contracts.collectionHooks.map((input) => {
    const validationRecord = validationByScenario.get(input.scenarioId);
    return deepFreeze({
      schemaId: "ATLAS_COLLECTION_TEMPLATE_INPUT_001",
      scenarioId: input.scenarioId,
      approvedRecipeId: input.approvedRecipeId,
      handoffState: mapValidationStateToHandoffState(
        validationRecord?.validationState
      ),
      validationState: validationRecord?.validationState ?? "BLOCKED",
      validationTrace: {
        qualityScore: validationRecord?.qualityScore ?? 0,
        duplicateSignature: validationRecord?.duplicateSignature ?? null
      },
      templateHooks: input.hooks.map((hook) => ({
        ...hook,
        handoffTemplateType: "COLLECTION_TEMPLATE_HOOK",
        planningOnly: true
      })),
      sourceValidationFingerprint:
        validationRecord?.deterministicFingerprint ?? null,
      deterministicFingerprint: hashHex(
        input.scenarioId,
        input.approvedRecipeId,
        "COLLECTION_TEMPLATE_INPUT",
        JSON.stringify(input.hooks),
        validationRecord?.validationState ?? "BLOCKED"
      )
    });
  });

  const poiTemplates = bridgePlanning.contracts.poiHooks.map((input) => {
    const validationRecord = validationByScenario.get(input.scenarioId);
    return deepFreeze({
      schemaId: "ATLAS_POI_TEMPLATE_INPUT_001",
      scenarioId: input.scenarioId,
      approvedRecipeId: input.approvedRecipeId,
      handoffState: mapValidationStateToHandoffState(
        validationRecord?.validationState
      ),
      validationState: validationRecord?.validationState ?? "BLOCKED",
      validationTrace: {
        qualityScore: validationRecord?.qualityScore ?? 0,
        duplicateSignature: validationRecord?.duplicateSignature ?? null
      },
      templateHooks: input.hooks.map((hook) => ({
        ...hook,
        handoffTemplateType: "POI_TEMPLATE_HOOK",
        planningOnly: true
      })),
      sourceValidationFingerprint:
        validationRecord?.deterministicFingerprint ?? null,
      deterministicFingerprint: hashHex(
        input.scenarioId,
        input.approvedRecipeId,
        "POI_TEMPLATE_INPUT",
        JSON.stringify(input.hooks),
        validationRecord?.validationState ?? "BLOCKED"
      )
    });
  });

  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_METADATA_CONTRACTS_001",
    handoffId: "ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_001",
    achievementTemplates,
    questTemplates,
    collectionTemplates,
    poiTemplates
  });
}

function buildLifecycleRules(contracts) {
  const countByState = (records, state) =>
    records.filter((record) => record.handoffState === state).length;

  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_LIFECYCLE_RULES_001",
    handoffId: "ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_001",
    lifecycleStatus: "PLANNING_READY",
    allowedStates: [
      "PLANNING_ONLY",
      "HANDOFF_REVIEW_REQUIRED",
      "HANDOFF_READY"
    ],
    blockedStates: [
      "QUEST_CREATED",
      "ACHIEVEMENT_CREATED",
      "REWARD_GRANTED",
      "RUNTIME_ACTIVATED",
      "PLAYER_VISIBLE"
    ],
    handoffStateSummary: {
      achievementReady: countByState(contracts.achievementTemplates, "HANDOFF_READY"),
      achievementReview: countByState(
        contracts.achievementTemplates,
        "HANDOFF_REVIEW_REQUIRED"
      ),
      questReady: countByState(contracts.questTemplates, "HANDOFF_READY"),
      questReview: countByState(contracts.questTemplates, "HANDOFF_REVIEW_REQUIRED"),
      collectionReady: countByState(
        contracts.collectionTemplates,
        "HANDOFF_READY"
      ),
      poiReady: countByState(contracts.poiTemplates, "HANDOFF_READY")
    },
    questsCreated: false,
    achievementsCreated: false,
    rewardsCreated: false,
    runtimeActivationAuthorized: false,
    playerExposureAuthorized: false
  });
}

function buildValidation(specification, contracts, validationPlanning) {
  const checks = [
    {
      name: "opportunity_template_contracts_defined",
      ok: specification.opportunityTemplateContracts.contractFamilies.length === 4
    },
    {
      name: "achievement_input_schema_defined",
      ok: specification.achievementInputSchema.requiredFields.length >= 6
    },
    {
      name: "quest_input_schema_defined",
      ok: specification.questInputSchema.requiredFields.length >= 6
    },
    {
      name: "collection_input_schema_defined",
      ok: specification.collectionInputSchema.requiredFields.length >= 5
    },
    {
      name: "poi_input_schema_defined",
      ok: specification.poiInputSchema.requiredFields.length >= 6
    },
    {
      name: "difficulty_handoff_defined",
      ok: specification.difficultyHandoff.supportedBands.length === 4
    },
    {
      name: "reward_planning_handoff_defined",
      ok: specification.rewardPlanningHandoff.requiredFields.length === 5
    },
    {
      name: "validation_handoff_defined",
      ok: specification.validationHandoff.requiredFields.length === 6
    },
    {
      name: "ready_and_review_states_preserved",
      ok:
        contracts.achievementTemplates.some(
          (record) => record.handoffState === "HANDOFF_READY"
        ) &&
        contracts.achievementTemplates.some(
          (record) => record.handoffState === "HANDOFF_REVIEW_REQUIRED"
        )
    },
    {
      name: "no_live_creation_or_runtime_state",
      ok:
        validationPlanning.validation.questsCreated === false &&
        validationPlanning.validation.achievementsCreated === false &&
        validationPlanning.validation.rewardsCreated === false &&
        validationPlanning.validation.runtimeActivationAuthorized === false &&
        validationPlanning.validation.playerExposureAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_FACTORY_TEMPLATE_HANDOFF_VALIDATION_001",
    handoffId: specification.handoffId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      specification.handoffId,
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

function buildReport(specification, contracts, validation, lifecycleRules) {
  const lines = contracts.achievementTemplates
    .map(
      (record) =>
        `- ${record.scenarioId}: ${record.handoffState}, achievement templates ${record.templateCandidates.length}, difficulty ${record.difficultyBand}`
    )
    .join("\n");

  return `# ATLAS GAMEPLAY FACTORY TEMPLATE HANDOFF ARCHITECTURE REPORT

## Scope

${specification.handoffId} defines the handoff layer between validated Atlas gameplay opportunities and future gameplay factories.

## Defined Areas

- opportunity template contracts
- achievement input schema
- quest input schema
- collection input schema
- POI input schema
- difficulty handoff
- reward planning handoff
- validation handoff

## Template Handoff Preview

${lines}

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
- achievement ready: ${lifecycleRules.handoffStateSummary.achievementReady}
- achievement review: ${lifecycleRules.handoffStateSummary.achievementReview}
- quest ready: ${lifecycleRules.handoffStateSummary.questReady}
- quest review: ${lifecycleRules.handoffStateSummary.questReview}

## Readiness

Future gameplay factory integration: READY
`;
}

export function buildGameplayFactoryTemplateHandoffPlanning({
  cwd = process.cwd()
} = {}) {
  const validationPlanning = buildGameplayOpportunityValidationPlanning({ cwd });
  const bridgePlanning = buildAtlasAchievementQuestFactoryBridgePlanning({ cwd });
  const specification = buildHandoffSpecification(
    validationPlanning,
    bridgePlanning
  );
  const contracts = buildMetadataContracts(
    validationPlanning,
    bridgePlanning
  );
  const lifecycleRules = buildLifecycleRules(contracts);
  const validation = buildValidation(
    specification,
    contracts,
    validationPlanning
  );
  const report = buildReport(specification, contracts, validation, lifecycleRules);

  return deepFreeze({
    root: path.resolve(cwd, HANDOFF_ROOT),
    specification,
    contracts,
    lifecycleRules,
    validation,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeGameplayFactoryTemplateHandoffPlanning({
  cwd = process.cwd()
} = {}) {
  const planning = buildGameplayFactoryTemplateHandoffPlanning({ cwd });
  const specificationDir = path.join(planning.root, "specification");
  const metadataDir = path.join(planning.root, "metadata");
  const lifecycleDir = path.join(planning.root, "lifecycle");
  const validationDir = path.join(planning.root, "validation");
  const reportsDir = path.join(planning.root, "reports");

  for (const directory of [
    specificationDir,
    metadataDir,
    lifecycleDir,
    validationDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(specificationDir, SPECIFICATION_FILENAME),
    planning.specification
  );
  writeJson(path.join(metadataDir, CONTRACTS_FILENAME), planning.contracts);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), planning.lifecycleRules);
  writeJson(path.join(validationDir, "atlas-gameplay-factory-template-handoff-validation.json"), planning.validation);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), planning.report);

  return planning;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeGameplayFactoryTemplateHandoffPlanning();
}
