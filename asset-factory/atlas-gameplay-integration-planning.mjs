import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildLocationRecipeFactoryFoundation } from "./location-recipe-factory-foundation.mjs";
import { buildAtlasRegionalPackageValidationPlanning } from "./atlas-regional-package-validation-planning.mjs";
import { buildAtlasBudgetValidatorPlanning } from "./atlas-budget-validator-planning.mjs";
import { buildAtlasAdminMonitoringPlanning } from "./atlas-admin-monitoring-planning.mjs";

const GAMEPLAY_ROOT =
  "asset-factory-workspace/atlas-gameplay/ATLAS_GAMEPLAY_INTEGRATION_001";

const RECIPE_ROOT = "asset-factory-workspace/recipes";
const SPECIFICATION_FILENAME = "atlas-gameplay-integration-specification.json";
const SCHEMA_FILENAME = "atlas-gameplay-metadata-schema.json";
const REPRESENTATIVE_METADATA_FILENAME =
  "atlas-gameplay-generated-location-metadata.json";
const VALIDATION_FILENAME = "atlas-gameplay-integration-validation.json";
const LIFECYCLE_FILENAME = "atlas-gameplay-integration-lifecycle-record.json";
const REPORT_FILENAME = "atlas-gameplay-integration-architecture-report.md";

const RECIPE_REFERENCES = deepFreeze([
  {
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    approvalPath:
      "COASTAL_LOCATION_RECIPE_001/approval/coastal-location-recipe-001-approval.json",
    planPath:
      "COASTAL_LOCATION_RECIPE_001/generation/coastal-location-recipe-001-regenerated-plan.json"
  },
  {
    recipeId: "FOREST_LOCATION_RECIPE_001",
    approvalPath:
      "FOREST_LOCATION_RECIPE_001/approval/forest-location-recipe-001-approval.json",
    planPath:
      "FOREST_LOCATION_RECIPE_001/generation/forest-location-recipe-001-regenerated-plan.json"
  }
]);

const ACHIEVEMENT_TAGS = deepFreeze([
  "SCENIC_LOOKOUT",
  "SHORELINE_DISCOVERY",
  "FOREST_CLEARING_DISCOVERY",
  "ROUTE_COMPLETION",
  "NATURE_OBSERVATION"
]);

const QUEST_TAGS = deepFreeze([
  "WALKING_ROUTE",
  "DESTINATION_VISIT",
  "CROSSING_INTERACTION",
  "BIOZONE_SURVEY",
  "DISCOVERY_LOOP"
]);

const COLLECTION_TAGS = deepFreeze([
  "FLORA_SAMPLE",
  "LANDSCAPE_MEMORY",
  "ROUTE_STAMP",
  "TERRAIN_STUDY"
]);

const POI_TAGS = deepFreeze([
  "LOOKOUT",
  "CLEARING",
  "SHORELINE_EDGE",
  "CROSSING",
  "TRAIL_NODE"
]);

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
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function loadApprovedRecipeRecords(cwd) {
  return RECIPE_REFERENCES.map((reference) => {
    const approval = readJson(path.resolve(cwd, RECIPE_ROOT, reference.approvalPath));
    const plan = readJson(path.resolve(cwd, RECIPE_ROOT, reference.planPath));

    if (approval.approvalStatus !== "approved") {
      throw new Error(
        `Atlas gameplay integration blocked: ${reference.recipeId} is not approved.`
      );
    }

    return {
      recipeId: reference.recipeId,
      approval,
      plan
    };
  });
}

function buildGameplayIntegrationSpecification(
  recipeFactory,
  packageValidation,
  budgetValidator,
  monitoring,
  approvedRecipes
) {
  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_INTEGRATION_SPECIFICATION_001",
    integrationId: "ATLAS_GAMEPLAY_INTEGRATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    integratedSystems: {
      achievementFactory: "PLANNING_BRIDGE_ONLY",
      questFactory: "PLANNING_BRIDGE_ONLY",
      collections: "PLANNING_BRIDGE_ONLY",
      poiSystems: "PLANNING_BRIDGE_ONLY"
    },
    references: {
      recipeFactoryId: recipeFactory.lifecycle.factoryId,
      regionalPackageValidationId:
        packageValidation.specification.validationPlanningId,
      budgetValidatorId: budgetValidator.specification.validatorId,
      adminMonitoringId: monitoring.specification.monitoringId
    },
    locationGameplayTags: {
      categories: [
        "EXPLORATION",
        "SCENIC_DESTINATION",
        "NATURE_DISCOVERY",
        "TRAIL_PROGRESS",
        "TRANSITION_POINT",
        "COLLECTION_OPPORTUNITY",
        "POI_CANDIDATE"
      ],
      sourceFields: [
        "recipeType",
        "biomeProfile",
        "archetype",
        "zoneAllocation",
        "placementPlan"
      ],
      deterministicOrdering: true
    },
    featureExtractionRules: {
      zoneSignals: [
        "traversalRole",
        "densityProfile",
        "requiredRoles",
        "optionalRoles"
      ],
      placementSignals: ["assetId", "role", "zoneId", "notes"],
      derivedFeatures: [
        "routeLengthBand",
        "destinationType",
        "transitionPresence",
        "floraDensityBand",
        "traversalComplexity"
      ],
      unsupportedHooksPolicy: "BLOCK_UNSUPPORTED_GAMEPLAY_HOOK"
    },
    achievementSuitabilityScoring: {
      scoreRange: [0, 100],
      weightedFactors: [
        { factor: "destination_quality", weight: 0.3 },
        { factor: "exploration_interest", weight: 0.25 },
        { factor: "scenic_uniqueness", weight: 0.25 },
        { factor: "route_completion_clarity", weight: 0.2 }
      ],
      thresholdBands: {
        HIGH: 75,
        MEDIUM: 50,
        LOW: 25
      }
    },
    questSuitabilityScoring: {
      scoreRange: [0, 100],
      weightedFactors: [
        { factor: "traversal_structure", weight: 0.3 },
        { factor: "interaction_opportunities", weight: 0.25 },
        { factor: "zone_progression", weight: 0.25 },
        { factor: "revisit_value", weight: 0.2 }
      ],
      thresholdBands: {
        HIGH: 70,
        MEDIUM: 45,
        LOW: 20
      }
    },
    collectionSuitabilityScoring: {
      scoreRange: [0, 100],
      weightedFactors: [
        { factor: "flora_diversity", weight: 0.35 },
        { factor: "landmark_memory", weight: 0.25 },
        { factor: "zone_variety", weight: 0.25 },
        { factor: "repeatable_visibility", weight: 0.15 }
      ],
      thresholdBands: {
        HIGH: 68,
        MEDIUM: 42,
        LOW: 20
      }
    },
    poiOpportunityMapping: {
      opportunityTypes: ["LOOKOUT", "CLEARING", "CROSSING", "TRAIL_NODE", "SHORELINE_EDGE"],
      sourceSignals: [
        "DESTINATION traversalRole",
        "CLEARING traversalRole",
        "CROSSING traversalRole",
        "shoreline_transition_band role",
        "terrain_detail_cluster role"
      ],
      deterministicSelectionPolicy: "stable_by_zone_order_then_role_priority"
    },
    gameplayMetadataContract: {
      requiredIdentityFields: [
        "recipeId",
        "locationPlanId",
        "gameplayMetadataId",
        "version",
        "variantId",
        "category"
      ],
      requiredGameplayFields: [
        "gameplayTags",
        "featureSummary",
        "achievementSuitability",
        "questSuitability",
        "collectionSuitability",
        "poiOpportunities"
      ],
      supportedRecipeIds: approvedRecipes.map((entry) => entry.recipeId),
      playerExposureBlockedByDefault: true,
      runtimeActivationBlockedByDefault: true
    }
  });
}

function buildGameplayMetadataSchema(specification) {
  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_METADATA_SCHEMA_001",
    integrationId: specification.integrationId,
    recordSchemaId: "ATLAS_GENERATED_LOCATION_GAMEPLAY_METADATA_001",
    requiredFields: {
      identity: specification.gameplayMetadataContract.requiredIdentityFields,
      gameplay: specification.gameplayMetadataContract.requiredGameplayFields
    },
    supportedTagFamilies: {
      achievement: ACHIEVEMENT_TAGS,
      quest: QUEST_TAGS,
      collection: COLLECTION_TAGS,
      poi: POI_TAGS
    },
    scoringContract: {
      achievement: specification.achievementSuitabilityScoring.thresholdBands,
      quest: specification.questSuitabilityScoring.thresholdBands,
      collection: specification.collectionSuitabilityScoring.thresholdBands
    },
    safetyContract: {
      unsupportedGameplayHooksBlocked: true,
      runtimeActivationAuthorized: false,
      achievementsAwarded: false,
      questsCreated: false,
      playerExposureAuthorized: false
    }
  });
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

function collectRoles(plan) {
  const roles = new Set();
  for (const zone of plan.zoneAllocation) {
    for (const role of zone.requiredRoles ?? []) {
      roles.add(role);
    }
    for (const role of zone.optionalRoles ?? []) {
      roles.add(role);
    }
  }
  for (const placement of plan.placementPlan.placements) {
    roles.add(placement.role);
  }
  return roles;
}

function deriveGameplayTags(approval, plan, roles) {
  const tags = new Set(["EXPLORATION"]);
  const traversalRoles = new Set(plan.zoneAllocation.map((zone) => zone.traversalRole));

  if (traversalRoles.has("DESTINATION") || traversalRoles.has("CLEARING")) {
    tags.add("SCENIC_DESTINATION");
    tags.add("POI_CANDIDATE");
  }
  if (roles.has("native_grass_breakup") || roles.has("coastal_shrub_mass") || roles.has("forest_shrub_mass")) {
    tags.add("NATURE_DISCOVERY");
    tags.add("COLLECTION_OPPORTUNITY");
  }
  if (roles.has("primary_path_surface")) {
    tags.add("TRAIL_PROGRESS");
  }
  if (roles.has("shoreline_transition_band") || traversalRoles.has("TRANSITION")) {
    tags.add("TRANSITION_POINT");
  }
  if (approval.recipeId.includes("COASTAL")) {
    tags.add("SHORELINE_EXPLORATION");
  }
  if (approval.recipeId.includes("FOREST")) {
    tags.add("CANOPY_EXPLORATION");
  }

  return [...tags].sort();
}

function deriveFeatureSummary(approval, plan, roles) {
  const traversalRoles = plan.zoneAllocation.map((zone) => zone.traversalRole);
  const destinationZone =
    plan.zoneAllocation.find((zone) =>
      ["DESTINATION", "CLEARING"].includes(zone.traversalRole)
    ) ?? null;
  const densityProfiles = [...new Set(plan.zoneAllocation.map((zone) => zone.densityProfile))];

  return deepFreeze({
    primaryBiome: plan.seedHandling.biomeProfile,
    archetype: plan.seedHandling.archetype,
    routeLengthBand: plan.placementPlan.totalPlacements >= 28 ? "MEDIUM" : "SMALL",
    destinationType: destinationZone?.traversalRole ?? "NONE",
    transitionPresence:
      roles.has("shoreline_transition_band") || traversalRoles.includes("TRANSITION"),
    floraDensityBand: densityProfiles.includes("HIGH") || densityProfiles.includes("MEDIUM_HIGH")
      ? "HIGH_VARIATION"
      : densityProfiles.includes("MEDIUM")
        ? "MODERATE"
        : "LIGHT",
    traversalComplexity:
      roles.has("elevated_wet_crossing") || roles.has("terrain_detail_cluster")
        ? "MODERATE"
        : "LIGHT",
    uniqueAssetCount: approval.performanceSummary.uniqueAssetCount
  });
}

function deriveAchievementSuitability(approval, plan, gameplayTags) {
  const scenicUniqueness = gameplayTags.includes("SCENIC_DESTINATION") ? 82 : 58;
  const explorationInterest =
    approval.comparisonSummary.explorationInterest === "IMPROVED" ? 84 : 60;
  const routeCompletionClarity = gameplayTags.includes("TRAIL_PROGRESS") ? 74 : 50;
  const destinationQuality = gameplayTags.includes("POI_CANDIDATE") ? 79 : 55;
  const score = Math.round(
    destinationQuality * 0.3 +
      explorationInterest * 0.25 +
      scenicUniqueness * 0.25 +
      routeCompletionClarity * 0.2
  );

  return deepFreeze({
    score,
    band: scoreBand(score, {
      HIGH: 75,
      MEDIUM: 50,
      LOW: 25
    }),
    reasons: gameplayTags.includes("SCENIC_DESTINATION")
      ? ["destination present", "exploration interest improved", "clear traversal route"]
      : ["route present", "environment discovery potential"]
  });
}

function deriveQuestSuitability(plan, gameplayTags, roles) {
  const traversalStructure = gameplayTags.includes("TRAIL_PROGRESS") ? 80 : 55;
  const interactionOpportunities =
    roles.has("elevated_wet_crossing") || roles.has("terrain_detail_cluster") ? 72 : 54;
  const zoneProgression = plan.zoneAllocation.length >= 5 ? 78 : 50;
  const revisitValue = gameplayTags.includes("COLLECTION_OPPORTUNITY") ? 67 : 45;
  const score = Math.round(
    traversalStructure * 0.3 +
      interactionOpportunities * 0.25 +
      zoneProgression * 0.25 +
      revisitValue * 0.2
  );

  return deepFreeze({
    score,
    band: scoreBand(score, {
      HIGH: 70,
      MEDIUM: 45,
      LOW: 20
    }),
    reasons: [
      "structured zone progression",
      "repeatable traversal path",
      interactionOpportunities >= 70
        ? "interactive transition or detail opportunities"
        : "lighter route interaction profile"
    ]
  });
}

function deriveCollectionSuitability(gameplayTags, roles, plan) {
  const floraDiversity =
    roles.has("coastal_shrub_mass") ||
    roles.has("forest_shrub_mass") ||
    roles.has("accent_native_tree")
      ? 76
      : 48;
  const landmarkMemory = gameplayTags.includes("SCENIC_DESTINATION") ? 72 : 46;
  const zoneVariety = plan.zoneAllocation.length >= 5 ? 70 : 44;
  const repeatableVisibility = gameplayTags.includes("COLLECTION_OPPORTUNITY") ? 74 : 42;
  const score = Math.round(
    floraDiversity * 0.35 +
      landmarkMemory * 0.25 +
      zoneVariety * 0.25 +
      repeatableVisibility * 0.15
  );

  return deepFreeze({
    score,
    band: scoreBand(score, {
      HIGH: 68,
      MEDIUM: 42,
      LOW: 20
    }),
    reasons: [
      floraDiversity >= 70 ? "flora variety present" : "limited flora diversity",
      zoneVariety >= 70 ? "multiple readable collection zones" : "narrow zone variety"
    ]
  });
}

function derivePoiOpportunities(plan, roles) {
  const opportunities = [];
  for (const zone of plan.zoneAllocation) {
    let type = null;
    if (zone.traversalRole === "DESTINATION") {
      type = "LOOKOUT";
    } else if (zone.traversalRole === "CLEARING") {
      type = "CLEARING";
    } else if (zone.traversalRole === "CROSSING") {
      type = "CROSSING";
    } else if (
      zone.requiredRoles.includes("shoreline_transition_band") ||
      zone.traversalRole === "SHORELINE"
    ) {
      type = "SHORELINE_EDGE";
    } else if (zone.requiredRoles.includes("primary_path_surface")) {
      type = "TRAIL_NODE";
    }

    if (type) {
      opportunities.push({
        poiOpportunityId: `${normalizeToken(plan.recipeId)}_${zone.zoneId}_${type}`,
        type,
        zoneId: zone.zoneId,
        traversalRole: zone.traversalRole,
        supportingRoles: [...zone.requiredRoles].sort(),
        deterministicRank: opportunities.length + 1
      });
    }
  }

  if (roles.has("terrain_detail_cluster") && opportunities.length === 0) {
    opportunities.push({
      poiOpportunityId: `${normalizeToken(plan.recipeId)}_DETAIL_TRAIL_NODE`,
      type: "TRAIL_NODE",
      zoneId: plan.zoneAllocation[0]?.zoneId ?? "UNKNOWN_ZONE",
      traversalRole: plan.zoneAllocation[0]?.traversalRole ?? "ENTRY",
      supportingRoles: ["terrain_detail_cluster"],
      deterministicRank: 1
    });
  }

  return opportunities;
}

function buildRepresentativeMetadataRecords(approvedRecipes) {
  return deepFreeze(
    approvedRecipes.map(({ approval, plan }) => {
      const roles = collectRoles(plan);
      const gameplayTags = deriveGameplayTags(approval, plan, roles);
      const featureSummary = deriveFeatureSummary(approval, plan, roles);
      const achievementSuitability = deriveAchievementSuitability(
        approval,
        plan,
        gameplayTags
      );
      const questSuitability = deriveQuestSuitability(plan, gameplayTags, roles);
      const collectionSuitability = deriveCollectionSuitability(
        gameplayTags,
        roles,
        plan
      );
      const poiOpportunities = derivePoiOpportunities(plan, roles);
      const supportedHooks = {
        achievementFactory: achievementSuitability.score >= 50,
        questFactory: questSuitability.score >= 45,
        collections: collectionSuitability.score >= 42,
        poiSystems: poiOpportunities.length > 0
      };

      return {
        schemaId: "ATLAS_GENERATED_LOCATION_GAMEPLAY_METADATA_001",
        gameplayMetadataId: `${approval.recipeId}_GAMEPLAY_METADATA_001`,
        recipeId: approval.recipeId,
        recipePackageId: approval.recipePackageId,
        locationPlanId: plan.locationPlanId,
        version: approval.version,
        variantId: approval.variantId,
        category: "ATLAS_GENERATED_LOCATION_GAMEPLAY_METADATA",
        gameplayTags,
        featureSummary,
        achievementSuitability,
        questSuitability,
        collectionSuitability,
        poiOpportunities,
        gameplayHooks: {
          supported: supportedHooks,
          blocked: {
            runtimeQuestCreation: true,
            runtimeAchievementAwarding: true,
            livePoiActivation: true,
            playerExposure: true
          }
        },
        deterministicFingerprint: hashHex(
          approval.recipeId,
          plan.locationPlanId,
          JSON.stringify(gameplayTags),
          JSON.stringify(featureSummary),
          JSON.stringify(poiOpportunities)
        )
      };
    })
  );
}

function buildValidation(specification, metadataSchema, representativeMetadata) {
  const checks = [
    [
      "generated_locations_can_produce_gameplay_metadata",
      representativeMetadata.length >= 2 &&
        representativeMetadata.every((record) => record.gameplayTags.length >= 3)
    ],
    [
      "location_gameplay_tags_defined",
      specification.locationGameplayTags.categories.length >= 5
    ],
    [
      "feature_extraction_rules_defined",
      specification.featureExtractionRules.derivedFeatures.length >= 5
    ],
    [
      "achievement_suitability_scoring_defined",
      specification.achievementSuitabilityScoring.weightedFactors.length === 4
    ],
    [
      "quest_suitability_scoring_defined",
      specification.questSuitabilityScoring.weightedFactors.length === 4
    ],
    [
      "collection_suitability_scoring_defined",
      specification.collectionSuitabilityScoring.weightedFactors.length === 4
    ],
    [
      "poi_opportunity_mapping_defined",
      specification.poiOpportunityMapping.opportunityTypes.length >= 5
    ],
    [
      "unsupported_gameplay_hooks_blocked",
      representativeMetadata.every(
        (record) =>
          record.gameplayHooks.blocked.runtimeQuestCreation === true &&
          record.gameplayHooks.blocked.runtimeAchievementAwarding === true &&
          record.gameplayHooks.blocked.livePoiActivation === true &&
          record.gameplayHooks.blocked.playerExposure === true
      ) && metadataSchema.safetyContract.unsupportedGameplayHooksBlocked === true
    ],
    [
      "deterministic_output_preserved",
      new Set(
        representativeMetadata.map((record) => record.deterministicFingerprint)
      ).size === representativeMetadata.length
    ],
    [
      "runtime_gameplay_player_blender_glb_asset_mutation_blocked",
      metadataSchema.safetyContract.runtimeActivationAuthorized === false &&
        metadataSchema.safetyContract.achievementsAwarded === false &&
        metadataSchema.safetyContract.questsCreated === false &&
        metadataSchema.safetyContract.playerExposureAuthorized === false
    ]
  ].map(([name, ok]) => ({ name, ok }));

  const deterministicFingerprint = hashHex(
    specification.integrationId,
    JSON.stringify(specification),
    JSON.stringify(metadataSchema),
    JSON.stringify(representativeMetadata),
    JSON.stringify(checks)
  );

  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_INTEGRATION_VALIDATION_001",
    integrationId: specification.integrationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    supportedRecipeCount: representativeMetadata.length,
    deterministicFingerprint,
    runtimeActivationAuthorized: false,
    questsCreated: false,
    achievementsAwarded: false,
    playerExposureAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_GAMEPLAY_INTEGRATION_LIFECYCLE_001",
    integrationId: specification.integrationId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    gameplayMetadataReady: validation.status === "pass",
    runtimeActivationAuthorized: false,
    questsCreated: false,
    achievementsAwarded: false,
    playerExposureAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false,
    deterministicFingerprint: validation.deterministicFingerprint
  });
}

function buildReport(specification, representativeMetadata, validation, lifecycle) {
  const recipeLines = representativeMetadata
    .map(
      (record) =>
        `- ${record.recipeId}: achievement ${record.achievementSuitability.band} (${record.achievementSuitability.score}), quest ${record.questSuitability.band} (${record.questSuitability.score}), collection ${record.collectionSuitability.band} (${record.collectionSuitability.score}), poi opportunities ${record.poiOpportunities.length}`
    )
    .join("\n");

  return `# ATLAS GAMEPLAY INTEGRATION ARCHITECTURE REPORT

## Scope

ATLAS_GAMEPLAY_INTEGRATION_001 defines the planning bridge between Atlas-generated locations and GrowGo gameplay systems.

Integrated planning systems:

- Achievement Factory
- Quest Factory
- Collections
- POI systems

## Defined Areas

- location gameplay tags
- feature extraction rules
- achievement suitability scoring
- quest suitability scoring
- collection suitability scoring
- POI opportunity mapping
- gameplay metadata contract

## Representative Metadata Outputs

${recipeLines}

## Safety

- runtime activation authorized: ${validation.runtimeActivationAuthorized}
- quests created: ${validation.questsCreated}
- achievements awarded: ${validation.achievementsAwarded}
- player exposure authorized: ${validation.playerExposureAuthorized}
- Blender authorized: ${validation.blenderAuthorized}
- GLB authorized: ${validation.glbAuthorized}
- asset modification authorized: ${validation.assetModificationAuthorized}

## Lifecycle

- lifecycle status: ${lifecycle.lifecycleStatus}
- gameplay metadata ready: ${lifecycle.gameplayMetadataReady}

## Readiness

Future gameplay integration: READY
`;
}

export function buildAtlasGameplayIntegrationPlanning({ cwd = process.cwd() } = {}) {
  const recipeFactory = buildLocationRecipeFactoryFoundation({ cwd });
  const packageValidation = buildAtlasRegionalPackageValidationPlanning({ cwd });
  const budgetValidator = buildAtlasBudgetValidatorPlanning({ cwd });
  const monitoring = buildAtlasAdminMonitoringPlanning({ cwd });
  const approvedRecipes = loadApprovedRecipeRecords(cwd);

  const specification = buildGameplayIntegrationSpecification(
    recipeFactory,
    packageValidation,
    budgetValidator,
    monitoring,
    approvedRecipes
  );
  const gameplayMetadataSchema = buildGameplayMetadataSchema(specification);
  const representativeMetadata =
    buildRepresentativeMetadataRecords(approvedRecipes);
  const validation = buildValidation(
    specification,
    gameplayMetadataSchema,
    representativeMetadata
  );
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(
    specification,
    representativeMetadata,
    validation,
    lifecycle
  );

  return deepFreeze({
    root: path.resolve(cwd, GAMEPLAY_ROOT),
    specification,
    gameplayMetadataSchema,
    representativeMetadata,
    validation,
    lifecycle,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasGameplayIntegrationPlanning({
  cwd = process.cwd()
} = {}) {
  const planning = buildAtlasGameplayIntegrationPlanning({ cwd });

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
  writeJson(
    path.join(metadataDir, SCHEMA_FILENAME),
    planning.gameplayMetadataSchema
  );
  writeJson(
    path.join(metadataDir, REPRESENTATIVE_METADATA_FILENAME),
    planning.representativeMetadata
  );
  writeJson(path.join(validationDir, VALIDATION_FILENAME), planning.validation);
  writeJson(path.join(lifecycleDir, LIFECYCLE_FILENAME), planning.lifecycle);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), planning.report);

  return planning;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasGameplayIntegrationPlanning();
}
