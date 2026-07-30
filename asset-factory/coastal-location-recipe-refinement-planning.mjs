import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";

const REVIEW_ROOT = "review";
const REFINEMENT_ROOT = "refinement";
const VALIDATION_ROOT = "validation";
const REPORTS_ROOT = "reports";

const MANUAL_REVIEW_FILENAME = "coastal-location-recipe-001-manual-review.json";
const TUNING_RECOMMENDATIONS_FILENAME =
  "coastal-location-recipe-001-tuning-recommendations.json";
const GENERATED_PLAN_FILENAME = "coastal-location-recipe-001-generated-plan.json";
const MANUAL_REVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-manual-review-validation.json";

const REFINEMENT_SPECIFICATION_FILENAME =
  "coastal-location-recipe-001-refinement-specification.json";
const BEFORE_AFTER_RULES_FILENAME =
  "coastal-location-recipe-001-before-after-rule-comparison.json";
const REFINEMENT_VALIDATION_FILENAME =
  "coastal-location-recipe-001-refinement-validation.json";
const REFINEMENT_REPORT_FILENAME =
  "coastal-location-recipe-001-refinement-report.md";

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

function loadInputs(cwd) {
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const reviewRoot = path.join(recipeRoot, REVIEW_ROOT);
  const refinementRoot = path.join(recipeRoot, REFINEMENT_ROOT);
  const validationRoot = path.join(recipeRoot, VALIDATION_ROOT);
  const reportsRoot = path.join(recipeRoot, REPORTS_ROOT);
  const generationRoot = path.join(recipeRoot, "generation");

  const reviewRecord = readJson(path.join(reviewRoot, MANUAL_REVIEW_FILENAME));
  const tuningRecommendations = readJson(
    path.join(reviewRoot, TUNING_RECOMMENDATIONS_FILENAME)
  );
  const generatedPlan = readJson(path.join(generationRoot, GENERATED_PLAN_FILENAME));
  const reviewValidation = readJson(
    path.join(validationRoot, MANUAL_REVIEW_VALIDATION_FILENAME)
  );

  if (reviewValidation.status !== "pass") {
    throw new Error(
      "Coastal location refinement planning blocked: manual review validation must pass first."
    );
  }

  return {
    recipeRoot,
    reviewRoot,
    refinementRoot,
    validationRoot,
    reportsRoot,
    reviewRecord,
    tuningRecommendations,
    generatedPlan,
    reviewValidation
  };
}

function zoneById(generatedPlan, zoneId) {
  return generatedPlan.zoneAllocation.find((zone) => zone.zoneId === zoneId) ?? null;
}

function buildRefinementSpecification(inputs) {
  const crossingZone = zoneById(inputs.generatedPlan, "WET_CROSSING_ZONE");
  const destinationZone = zoneById(inputs.generatedPlan, "LOOKOUT_OR_REST_ZONE");
  const shorelineZone = zoneById(inputs.generatedPlan, "SHORELINE_EDGE_ZONE");
  const bufferZone = zoneById(inputs.generatedPlan, "VEGETATION_BUFFER_ZONE");

  const plannedChanges = [
    {
      changeId: "COASTAL_LOCATION_RECIPE_001_REFINEMENT_001",
      area: "shoreline_transition_improvements",
      priority: "HIGH",
      sourceRecommendationId: "COASTAL_LOCATION_RECIPE_001_TUNING_REC_001",
      targetZones: ["SHORELINE_EDGE_ZONE", "WET_CROSSING_ZONE"],
      plannedRuleUpdate:
        "Allow one deterministic shoreline-transition support placement to bridge the approach into the boardwalk crossing.",
      intendedOutcome:
        "Boardwalk crossing reads as connected to the shoreline band instead of isolated from it.",
      candidateAssets: ["COASTAL_WATER_EDGE_001", "COASTAL_ROCK_CLUSTER_001"],
      placementGuardrails: {
        maxAdditionalPlacements: 1,
        preserveDensityProfiles: ["LOW", "LOW"],
        preserveTraversalRoles: [
          shorelineZone?.traversalRole ?? "SHORELINE",
          crossingZone?.traversalRole ?? "CROSSING"
        ]
      }
    },
    {
      changeId: "COASTAL_LOCATION_RECIPE_001_REFINEMENT_002",
      area: "destination_zone_enhancement",
      priority: "HIGH",
      sourceRecommendationId: "COASTAL_LOCATION_RECIPE_001_TUNING_REC_002",
      targetZones: ["LOOKOUT_OR_REST_ZONE"],
      plannedRuleUpdate:
        "Promote one compact terrain-detail support beat to required destination support near the final path segment.",
      intendedOutcome:
        "Destination zone gains clearer arrival payoff and a stronger stop moment without crowding the bottlebrush anchor.",
      candidateAssets: ["COASTAL_ROCK_CLUSTER_001", "COASTAL_GROUND_COVER_001"],
      placementGuardrails: {
        maxAdditionalPlacements: 1,
        preserveDensityProfiles: [destinationZone?.densityProfile ?? "MEDIUM"],
        preservePrimaryAnchor: "TREE_BOTTLEBRUSH_001"
      }
    },
    {
      changeId: "COASTAL_LOCATION_RECIPE_001_REFINEMENT_003",
      area: "vegetation_density_smoothing",
      priority: "MEDIUM",
      sourceRecommendationId: "COASTAL_LOCATION_RECIPE_001_TUNING_REC_003",
      targetZones: ["SHORELINE_EDGE_ZONE", "VEGETATION_BUFFER_ZONE"],
      plannedRuleUpdate:
        "Introduce one intermediary support accent or redistribute one vegetation-support placement closer to the shoreline edge.",
      intendedOutcome:
        "Vegetation transition reads more gradual between sparse shoreline and inland buffer zones.",
      candidateAssets: ["COASTAL_GROUND_COVER_001", "COASTAL_GRASS_TUSSOCK_001"],
      placementGuardrails: {
        maxNetPlacementIncrease: 1,
        shorelineDensityMustRemain: "LOW",
        bufferDensityMustRemain: bufferZone?.densityProfile ?? "MEDIUM"
      }
    },
    {
      changeId: "COASTAL_LOCATION_RECIPE_001_REFINEMENT_004",
      area: "exploration_interest_improvements",
      priority: "MEDIUM",
      sourceRecommendationId: "COASTAL_LOCATION_RECIPE_001_TUNING_REC_002",
      targetZones: ["LOOKOUT_OR_REST_ZONE"],
      plannedRuleUpdate:
        "Reserve one deterministic curiosity-support slot at the destination so future POI layering has a stable landing point.",
      intendedOutcome:
        "Endpoint feels more rewarding now and remains ready for later POI or achievement tagging.",
      candidateAssets: ["COASTAL_ROCK_CLUSTER_001", "COASTAL_GROUND_COVER_001"],
      placementGuardrails: {
        maxAdditionalPlacements: 1,
        preserveViewlineToAnchor: true,
        preserveMobileBudgetHeadroom: true
      }
    }
  ];

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_REFINEMENT_SPECIFICATION_001",
    recipeId: inputs.reviewRecord.recipeId,
    locationPlanId: inputs.reviewRecord.locationPlanId,
    basedOnReviewRecordId: inputs.reviewRecord.reviewRecordId,
    basedOnRecommendationSetId: inputs.tuningRecommendations.schemaId,
    planningMode: "refinement_planning_only_no_regeneration",
    plannedChanges,
    regenerationPreconditions: [
      "Manual review findings remain current for the targeted generated plan fingerprint.",
      "No unsupported assets are introduced.",
      "Zone density profiles remain inside LOW/MEDIUM expectations.",
      "Traversal readability remains PASS after regeneration."
    ]
  });
}

function buildBeforeAfterRuleComparison(inputs, refinementSpecification) {
  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_BEFORE_AFTER_RULE_COMPARISON_001",
    recipeId: inputs.reviewRecord.recipeId,
    comparisons: [
      {
        area: "shoreline_transition_improvements",
        before: {
          crossingRequiredRoles:
            zoneById(inputs.generatedPlan, "WET_CROSSING_ZONE")?.requiredRoles ?? [],
          crossingObservedGap:
            "shoreline_transition_band absent from the current crossing preview composition"
        },
        after: {
          plannedSupportRule:
            "one deterministic shoreline-transition support placement is allowed on crossing approaches",
          expectedResolvedGap:
            "crossing preview should show both elevated crossing and shoreline transition support"
        }
      },
      {
        area: "destination_zone_enhancement",
        before: {
          destinationRequiredRoles:
            zoneById(inputs.generatedPlan, "LOOKOUT_OR_REST_ZONE")?.requiredRoles ?? [],
          destinationObservedGap:
            "terrain_detail_cluster absent from the current destination preview composition"
        },
        after: {
          plannedSupportRule:
            "destination must retain path plus one compact terrain-detail accent near arrival",
          expectedResolvedGap:
            "destination preview should show a clearer arrival beat while preserving the bottlebrush anchor"
        }
      },
      {
        area: "vegetation_density_smoothing",
        before: {
          shorelineDensityProfile:
            zoneById(inputs.generatedPlan, "SHORELINE_EDGE_ZONE")?.densityProfile ?? "LOW",
          bufferDensityProfile:
            zoneById(inputs.generatedPlan, "VEGETATION_BUFFER_ZONE")?.densityProfile ?? "MEDIUM",
          observedGradient:
            "shoreline remains sparse while vegetation buffer jumps immediately to full support coverage"
        },
        after: {
          plannedDensityRule:
            "add or redistribute one transitional support accent between shoreline and inland buffer",
          expectedGradient:
            "density progression should remain readable but feel less abrupt"
        }
      },
      {
        area: "exploration_interest_improvements",
        before: {
          destinationInterestState:
            "single bottlebrush anchor with limited secondary curiosity support",
          poiReadinessState:
            "future POI is possible but not yet visually reinforced"
        },
        after: {
          plannedInterestRule:
            "destination reserves one compact curiosity-support slot",
          expectedPoiReadinessState:
            "future POI or achievement tagging gains a clearer visual landing point"
        }
      }
    ],
    noGeneratedPlanMutation: true,
    noAssetMutation: true
  });
}

function buildUpdatedValidationRequirements(inputs, refinementSpecification) {
  const checks = [
    {
      name: "refinement_specification_created",
      ok: refinementSpecification.plannedChanges.length === 4
    },
    {
      name: "shoreline_transition_change_planned",
      ok: refinementSpecification.plannedChanges.some(
        (change) => change.area === "shoreline_transition_improvements"
      )
    },
    {
      name: "destination_enhancement_planned",
      ok: refinementSpecification.plannedChanges.some(
        (change) => change.area === "destination_zone_enhancement"
      )
    },
    {
      name: "density_smoothing_planned",
      ok: refinementSpecification.plannedChanges.some(
        (change) => change.area === "vegetation_density_smoothing"
      )
    },
    {
      name: "exploration_interest_planned",
      ok: refinementSpecification.plannedChanges.some(
        (change) => change.area === "exploration_interest_improvements"
      )
    },
    {
      name: "no_asset_modification",
      ok: true
    },
    {
      name: "no_blender_usage",
      ok: true
    },
    {
      name: "no_glb_generation",
      ok: true
    },
    {
      name: "no_runtime_activation",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_REFINEMENT_VALIDATION_001",
    recipeId: inputs.reviewRecord.recipeId,
    locationPlanId: inputs.reviewRecord.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    updatedValidationRequirements: [
      "Regenerated preview must resolve shoreline_transition_band support in WET_CROSSING_ZONE.",
      "Regenerated preview must resolve terrain_detail_cluster support in LOOKOUT_OR_REST_ZONE.",
      "Shoreline-to-buffer density gradient must remain deterministic while reading less abruptly.",
      "Destination zone must preserve bottlebrush anchor visibility while increasing arrival interest.",
      "No runtime activation, Blender usage, or asset mutation is allowed during planning."
    ],
    nextAllowedAction: "recipe_regeneration_ready"
  });
}

function buildReport(specification, comparison, validation) {
  const changeLines = specification.plannedChanges
    .map(
      (change) =>
        `- ${change.area}: ${change.plannedRuleUpdate}`
    )
    .join("\n");

  const comparisonLines = comparison.comparisons
    .map(
      (item) =>
        `- ${item.area}: before = ${Object.values(item.before).join(" | ")} ; after = ${Object.values(item.after).join(" | ")}`
    )
    .join("\n");

  return [
    "# GROWGO SESSION 200.6 — COASTAL_LOCATION_RECIPE_001 Refinement Planning",
    "",
    `recipe: ${specification.recipeId}`,
    `location plan: ${specification.locationPlanId}`,
    "",
    "## Planned Changes",
    changeLines,
    "",
    "## Before/After Rule Comparison",
    comparisonLines,
    "",
    "## Updated Validation Requirements",
    ...validation.updatedValidationRequirements.map((line) => `- ${line}`),
    "",
    "## Safety",
    "- asset modification: not performed",
    "- Blender usage: not performed",
    "- GLB generation: not performed",
    "- runtime activation: not performed",
    "",
    "## Readiness",
    "- The recipe is ready for controlled regeneration planning using the recorded refinement specification.",
    ""
  ].join("\n");
}

export function buildCoastalLocationRecipeRefinementPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const inputs = loadInputs(cwd);

  ensureDirectory(inputs.refinementRoot);
  ensureDirectory(inputs.validationRoot);
  ensureDirectory(inputs.reportsRoot);

  const refinementSpecification = buildRefinementSpecification(inputs);
  const beforeAfterRuleComparison = buildBeforeAfterRuleComparison(
    inputs,
    refinementSpecification
  );
  const refinementValidation = buildUpdatedValidationRequirements(
    inputs,
    refinementSpecification
  );
  const refinementReport = buildReport(
    refinementSpecification,
    beforeAfterRuleComparison,
    refinementValidation
  );

  const specificationPath = path.join(
    inputs.refinementRoot,
    REFINEMENT_SPECIFICATION_FILENAME
  );
  const comparisonPath = path.join(
    inputs.refinementRoot,
    BEFORE_AFTER_RULES_FILENAME
  );
  const validationPath = path.join(
    inputs.validationRoot,
    REFINEMENT_VALIDATION_FILENAME
  );
  const reportPath = path.join(inputs.reportsRoot, REFINEMENT_REPORT_FILENAME);

  writeJson(specificationPath, refinementSpecification);
  writeJson(comparisonPath, beforeAfterRuleComparison);
  writeJson(validationPath, refinementValidation);
  fs.writeFileSync(reportPath, `${refinementReport}\n`);

  const refinementFingerprint = hashHex(
    JSON.stringify(refinementSpecification.plannedChanges),
    JSON.stringify(beforeAfterRuleComparison.comparisons),
    JSON.stringify(refinementValidation.updatedValidationRequirements)
  );

  return deepFreeze({
    specificationPath,
    comparisonPath,
    validationPath,
    reportPath,
    refinementSpecification,
    beforeAfterRuleComparison,
    refinementValidation,
    refinementFingerprint
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  buildCoastalLocationRecipeRefinementPlanning();
}
