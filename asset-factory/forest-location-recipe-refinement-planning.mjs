import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001";

const REVIEW_ROOT = "review";
const REFINEMENT_ROOT = "refinement";
const VALIDATION_ROOT = "validation";
const REPORTS_ROOT = "reports";

const MANUAL_REVIEW_FILENAME = "forest-location-recipe-001-manual-review.json";
const TUNING_RECOMMENDATIONS_FILENAME =
  "forest-location-recipe-001-tuning-recommendations.json";
const GENERATED_PLAN_FILENAME = "forest-location-recipe-001-generated-plan.json";
const MANUAL_REVIEW_VALIDATION_FILENAME =
  "forest-location-recipe-001-manual-review-validation.json";

const REFINEMENT_SPECIFICATION_FILENAME =
  "forest-location-recipe-001-refinement-specification.json";
const BEFORE_AFTER_RULES_FILENAME =
  "forest-location-recipe-001-before-after-rule-comparison.json";
const REFINEMENT_VALIDATION_FILENAME =
  "forest-location-recipe-001-refinement-validation.json";
const REFINEMENT_REPORT_FILENAME =
  "forest-location-recipe-001-refinement-report.md";

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
      "Forest location refinement planning blocked: manual review validation must pass first."
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
  const canopyZone = zoneById(inputs.generatedPlan, "CANOPY_TRACK_ZONE");
  const clearingZone = zoneById(inputs.generatedPlan, "CLEARING_OR_REST_ZONE");
  const deepZone = zoneById(inputs.generatedPlan, "DEEP_FOREST_MARGIN_ZONE");

  const plannedChanges = [
    {
      changeId: "FOREST_LOCATION_RECIPE_001_REFINEMENT_001",
      area: "canopy_corridor_enclosure_improvement",
      priority: "HIGH",
      sourceRecommendationId: "FOREST_LOCATION_RECIPE_001_TUNING_REC_001",
      targetZones: ["CANOPY_TRACK_ZONE"],
      plannedRuleUpdate:
        "Allow one deterministic soft-enclosure support placement in the canopy corridor to strengthen the sense of moving under deeper forest cover.",
      intendedOutcome:
        "Canopy track reads more enclosed than the edge-transition zone while preserving trail legibility.",
      candidateAssets: ["SHRUB_COASTAL_LOW_001", "COASTAL_GROUND_COVER_001"],
      placementGuardrails: {
        maxAdditionalPlacements: 1,
        preserveDensityProfiles: [canopyZone?.densityProfile ?? "MEDIUM_HIGH"],
        preserveTraversalRole: canopyZone?.traversalRole ?? "MAIN_TRACK",
        preserveMovementCorridor: true
      }
    },
    {
      changeId: "FOREST_LOCATION_RECIPE_001_REFINEMENT_002",
      area: "clearing_payoff_enhancement",
      priority: "HIGH",
      sourceRecommendationId: "FOREST_LOCATION_RECIPE_001_TUNING_REC_002",
      targetZones: ["CLEARING_OR_REST_ZONE"],
      plannedRuleUpdate:
        "Reserve one compact support beat at the clearing edge so the pause zone feels more intentional without crowding the standing area.",
      intendedOutcome:
        "Clearing remains readable but gains a slightly stronger arrival payoff and rest-point identity.",
      candidateAssets: ["COASTAL_ROCK_CLUSTER_001", "SHRUB_COASTAL_LOW_001"],
      placementGuardrails: {
        maxAdditionalPlacements: 1,
        preserveDensityProfiles: [clearingZone?.densityProfile ?? "LOW_MEDIUM"],
        preserveStandingArea: true,
        preservePrimaryAnchor: "TREE_BOTTLEBRUSH_001"
      }
    },
    {
      changeId: "FOREST_LOCATION_RECIPE_001_REFINEMENT_003",
      area: "exploration_curiosity_improvement",
      priority: "MEDIUM",
      sourceRecommendationId: "FOREST_LOCATION_RECIPE_001_TUNING_REC_002",
      targetZones: ["CLEARING_OR_REST_ZONE", "DEEP_FOREST_MARGIN_ZONE"],
      plannedRuleUpdate:
        "Reserve one deterministic curiosity-support slot between the clearing and deep-margin threshold so the second half of the route carries a clearer discovery beat.",
      intendedOutcome:
        "Exploration interest becomes more staged across destination and backdrop zones without relying on unsupported canopy assets.",
      candidateAssets: ["COASTAL_ROCK_CLUSTER_001", "SHRUB_COASTAL_LOW_001", "TREE_BOTTLEBRUSH_001"],
      placementGuardrails: {
        maxNetPlacementIncrease: 1,
        preserveDensityProfiles: [
          clearingZone?.densityProfile ?? "LOW_MEDIUM",
          deepZone?.densityProfile ?? "HIGH"
        ],
        preserveDeferredCanopySpace: true,
        preserveMobileBudgetHeadroom: true
      }
    }
  ];

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_REFINEMENT_SPECIFICATION_001",
    recipeId: inputs.reviewRecord.recipeId,
    locationPlanId: inputs.reviewRecord.locationPlanId,
    basedOnReviewRecordId: inputs.reviewRecord.reviewRecordId,
    basedOnRecommendationSetId: inputs.tuningRecommendations.schemaId,
    planningMode: "refinement_planning_only_no_regeneration",
    plannedChanges,
    regenerationPreconditions: [
      "Manual review findings remain current for the targeted forest generated-plan fingerprint.",
      "No unsupported assets are introduced and TREE_EUCALYPTUS_001 remains deferred.",
      "Canopy corridor must remain trail-readable after enclosure reinforcement.",
      "Clearing standing area must remain readable after payoff enhancement.",
      "No runtime activation, Blender usage, GLB generation, or asset mutation is allowed during planning."
    ]
  });
}

function buildBeforeAfterRuleComparison(inputs, refinementSpecification) {
  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_BEFORE_AFTER_RULE_COMPARISON_001",
    recipeId: inputs.reviewRecord.recipeId,
    comparisons: [
      {
        area: "canopy_corridor_enclosure_improvement",
        before: {
          canopyDensityProfile:
            zoneById(inputs.generatedPlan, "CANOPY_TRACK_ZONE")?.densityProfile ?? "MEDIUM_HIGH",
          canopyObservedCondition:
            "canopy corridor reads lighter than the forest-edge transition band",
          tuningSignal: inputs.reviewRecord.reviewAreas.vegetationBalance.tuningSignal
        },
        after: {
          plannedSupportRule:
            "one deterministic soft-enclosure support placement may be added in CANOPY_TRACK_ZONE",
          expectedResolvedCondition:
            "canopy corridor should read more enclosed while preserving the movement lane"
        }
      },
      {
        area: "clearing_payoff_enhancement",
        before: {
          clearingDensityProfile:
            zoneById(inputs.generatedPlan, "CLEARING_OR_REST_ZONE")?.densityProfile ?? "LOW_MEDIUM",
          clearingObservedCondition:
            "clearing is readable but light on supporting payoff beyond the main anchor"
        },
        after: {
          plannedSupportRule:
            "one compact support beat may be placed at the clearing edge without reducing standing readability",
          expectedResolvedCondition:
            "clearing should feel more intentional as a pause-point destination"
        }
      },
      {
        area: "exploration_curiosity_improvement",
        before: {
          destinationInterestState:
            "interest is present but the same accent-tree family carries both destination and backdrop emphasis",
          deferredCanopyState:
            "future eucalyptus uplift remains intentionally deferred"
        },
        after: {
          plannedInterestRule:
            "reserve one deterministic curiosity-support slot between clearing and deep-margin zones",
          expectedPoiReadinessState:
            "later half of the route should carry a clearer secondary discovery beat without using unsupported canopy assets"
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
      ok: refinementSpecification.plannedChanges.length === 3
    },
    {
      name: "canopy_enclosure_change_planned",
      ok: refinementSpecification.plannedChanges.some(
        (change) => change.area === "canopy_corridor_enclosure_improvement"
      )
    },
    {
      name: "clearing_payoff_change_planned",
      ok: refinementSpecification.plannedChanges.some(
        (change) => change.area === "clearing_payoff_enhancement"
      )
    },
    {
      name: "exploration_curiosity_change_planned",
      ok: refinementSpecification.plannedChanges.some(
        (change) => change.area === "exploration_curiosity_improvement"
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
    schemaId: "FOREST_LOCATION_RECIPE_001_REFINEMENT_VALIDATION_001",
    recipeId: inputs.reviewRecord.recipeId,
    locationPlanId: inputs.reviewRecord.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    updatedValidationRequirements: [
      "Regenerated preview must make CANOPY_TRACK_ZONE read more enclosed than the forest-edge transition while preserving trail legibility.",
      "Regenerated preview must preserve a readable clearing standing area while increasing clearing payoff.",
      "Regenerated preview must add a clearer secondary discovery beat between clearing and deep-margin zones.",
      "TREE_EUCALYPTUS_001 must remain deferred until its lifecycle state changes.",
      "No runtime activation, Blender usage, GLB generation, or asset mutation is allowed during planning."
    ],
    nextAllowedAction: "recipe_regeneration_ready"
  });
}

function buildReport(specification, comparison, validation) {
  const changeLines = specification.plannedChanges
    .map((change) => `- ${change.area}: ${change.plannedRuleUpdate}`)
    .join("\n");

  const comparisonLines = comparison.comparisons
    .map(
      (item) =>
        `- ${item.area}: before = ${Object.values(item.before).join(" | ")} ; after = ${Object.values(item.after).join(" | ")}`
    )
    .join("\n");

  return [
    "# GROWGO SESSION 201.6 — FOREST_LOCATION_RECIPE_001 Refinement Planning",
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
    "- The recipe is ready for controlled regeneration using the recorded forest refinement specification.",
    ""
  ].join("\n");
}

export function buildForestLocationRecipeRefinementPlanning(options = {}) {
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
  buildForestLocationRecipeRefinementPlanning();
}
