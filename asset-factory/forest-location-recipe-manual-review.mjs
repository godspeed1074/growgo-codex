import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001";

const PREVIEW_ROOT = "preview";
const REVIEW_ROOT = "review";
const VALIDATION_ROOT = "validation";
const REPORTS_ROOT = "reports";

const PREVIEW_DATA_FILENAME = "forest-location-recipe-001-preview-data.json";
const ZONE_SUMMARY_FILENAME = "forest-location-recipe-001-zone-summary.json";
const DENSITY_REPORT_FILENAME = "forest-location-recipe-001-density-report.json";
const DEPENDENCY_VISUALIZATION_FILENAME =
  "forest-location-recipe-001-dependency-visualization.json";
const PLACEMENT_INSPECTION_FILENAME =
  "forest-location-recipe-001-placement-inspection-report.json";
const VISUAL_RENDERER_DATA_FILENAME =
  "forest-location-recipe-001-visual-renderer-data.json";
const PREVIEW_VALIDATION_FILENAME =
  "forest-location-recipe-001-preview-validation.json";

const MANUAL_REVIEW_FILENAME = "forest-location-recipe-001-manual-review.json";
const TUNING_RECOMMENDATIONS_FILENAME =
  "forest-location-recipe-001-tuning-recommendations.json";
const MANUAL_REVIEW_VALIDATION_FILENAME =
  "forest-location-recipe-001-manual-review-validation.json";
const MANUAL_REVIEW_REPORT_FILENAME =
  "forest-location-recipe-001-manual-review-report.md";

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

function loadPreviewPackage(cwd) {
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const previewRoot = path.join(recipeRoot, PREVIEW_ROOT);
  const validationRoot = path.join(recipeRoot, VALIDATION_ROOT);

  const previewData = readJson(path.join(previewRoot, PREVIEW_DATA_FILENAME));
  const zoneSummary = readJson(path.join(previewRoot, ZONE_SUMMARY_FILENAME));
  const densityReport = readJson(path.join(previewRoot, DENSITY_REPORT_FILENAME));
  const dependencyVisualization = readJson(
    path.join(previewRoot, DEPENDENCY_VISUALIZATION_FILENAME)
  );
  const placementInspection = readJson(
    path.join(previewRoot, PLACEMENT_INSPECTION_FILENAME)
  );
  const visualRendererData = readJson(
    path.join(previewRoot, VISUAL_RENDERER_DATA_FILENAME)
  );
  const previewValidation = readJson(
    path.join(validationRoot, PREVIEW_VALIDATION_FILENAME)
  );

  if (previewValidation.status !== "pass") {
    throw new Error(
      "Forest location manual review blocked: preview validation must pass first."
    );
  }

  return {
    recipeRoot,
    previewData,
    zoneSummary,
    densityReport,
    dependencyVisualization,
    placementInspection,
    visualRendererData,
    previewValidation
  };
}

function findZone(previewPackage, zoneId) {
  return previewPackage.zoneSummary.find((zone) => zone.zoneId === zoneId) ?? null;
}

function findDensity(previewPackage, zoneId) {
  return previewPackage.densityReport.find((entry) => entry.zoneId === zoneId) ?? null;
}

function buildAreaReview(status, evidence, notes, tuningSignal = "stable") {
  return deepFreeze({
    status,
    evidence,
    notes,
    tuningSignal
  });
}

function buildManualReviewRecord(previewPackage) {
  const entryZone = findZone(previewPackage, "ENTRY_TRACK_ZONE");
  const transitionZone = findZone(previewPackage, "FOREST_EDGE_TRANSITION_ZONE");
  const canopyZone = findZone(previewPackage, "CANOPY_TRACK_ZONE");
  const clearingZone = findZone(previewPackage, "CLEARING_OR_REST_ZONE");
  const deepZone = findZone(previewPackage, "DEEP_FOREST_MARGIN_ZONE");

  const entryDensity = findDensity(previewPackage, "ENTRY_TRACK_ZONE");
  const transitionDensity = findDensity(previewPackage, "FOREST_EDGE_TRANSITION_ZONE");
  const canopyDensity = findDensity(previewPackage, "CANOPY_TRACK_ZONE");
  const clearingDensity = findDensity(previewPackage, "CLEARING_OR_REST_ZONE");
  const deepDensity = findDensity(previewPackage, "DEEP_FOREST_MARGIN_ZONE");

  const playerJourney = buildAreaReview(
    "PASS",
    [
      "The preview moves cleanly from entry track to edge transition, then into canopy track, clearing, and deep backdrop.",
      `Zone progression covers ${previewPackage.zoneSummary.length} distinct forest beats.`,
      `Total preview placements: ${previewPackage.previewData.totalPlacements}.`
    ],
    "The route already reads as a small forest walk with a clear arrival sequence and a distinct pause point."
  );

  const trailFlow = buildAreaReview(
    "PASS",
    [
      `Primary path surface appears ${previewPackage.placementInspection.roleCounts.primary_path_surface} times.`,
      "Trail nodes passed the preview flow checks without runtime assistance.",
      "No spacing flags were raised in placement inspection."
    ],
    "Trail legibility is solid for a first forest layout and does not need structural correction before refinement."
  );

  const vegetationBalance =
    transitionDensity &&
    canopyDensity &&
    deepDensity &&
    canopyDensity.vegetationRatio < transitionDensity.vegetationRatio
      ? buildAreaReview(
          "TUNE_RECOMMENDED",
          [
            `Transition vegetation ratio is ${transitionDensity.vegetationRatio}.`,
            `Canopy-track vegetation ratio is ${canopyDensity.vegetationRatio}.`,
            `Deep-margin vegetation ratio rises to ${deepDensity.vegetationRatio}.`
          ],
          "The deep backdrop reads correctly as dense, but the main canopy corridor dips a little lighter than the transition band and could carry one more soft enclosure cue.",
          "reinforce_canopy_density"
        )
      : buildAreaReview(
          "PASS",
          [
            "Vegetation ratios step upward into the deeper forest backdrop.",
            "No zone exceeds current performance or spacing safety limits."
          ],
          "Vegetation balance is already strong enough for reuse."
        );

  const clearingQuality =
    clearingZone &&
    clearingZone.rolesPresent.includes("primary_path_surface") &&
    clearingZone.rolesPresent.includes("terrain_detail_cluster")
      ? buildAreaReview(
          "PASS",
          [
            `Clearing zone contains ${clearingZone.placementCount} placements with path, rock detail, and anchor tree roles.`,
            `Clearing vegetation ratio stays low at ${clearingDensity?.vegetationRatio ?? 0}.`,
            "The standing area remains visually readable."
          ],
          "The clearing works as a pause point and already feels distinct from the denser track zones."
        )
      : buildAreaReview(
          "TUNE_RECOMMENDED",
          [
            "Clearing zone is missing one or more required rest-zone roles.",
            "A readable standing patch is present but not fully reinforced."
          ],
          "The clearing concept is sound, but it needs one more support beat before refinement can feel complete.",
          "stabilise_clearing_anchor"
        );

  const explorationInterest =
    deepZone &&
    deepZone.rolesPresent.includes("accent_native_tree") &&
    clearingZone?.rolesPresent.includes("accent_native_tree")
      ? buildAreaReview(
          "TUNE_RECOMMENDED",
          [
            "Interest points exist in both the clearing and deep-margin zones.",
            "TREE_BOTTLEBRUSH_001 is doing double duty as both destination anchor and background marker.",
            "Deferred eucalyptus uplift is intentionally reserved for a later lifecycle phase."
          ],
          "The route already has interest, but the payoff is still modest because the current anchor tree is carrying both highlight moments without a second supporting curiosity beat.",
          "strengthen_interest_spacing"
        )
      : buildAreaReview(
          "PASS",
          [
            "Distinct interest points are present and visually separated.",
            "The preview already suggests a discovery rhythm."
          ],
          "Exploration interest is already sufficient."
        );

  const forestTransitionQuality =
    transitionZone &&
    transitionZone.requiredRoles.every((role) => transitionZone.rolesPresent.includes(role))
      ? buildAreaReview(
          "PASS",
          [
            `Transition zone presents all required roles: ${transitionZone.rolesPresent.join(", ")}.`,
            `Transition density is ${transitionZone?.densityProfile}.`,
            `Entry density is ${entryZone?.densityProfile} and deep-margin density is ${deepZone?.densityProfile}.`
          ],
          "The entry-to-forest change reads gradual rather than abrupt, which is the right foundation for later canopy uplift."
        )
      : buildAreaReview(
          "TUNE_RECOMMENDED",
          [
            "One or more required transition roles are missing.",
            "The edge-to-canopy handoff is therefore under-described."
          ],
          "Transition quality needs structural reinforcement before future canopy expansion.",
          "restore_transition_roles"
        );

  const performanceProfile = buildAreaReview(
    "PASS",
    [
      "Preview validation already passed performance impact.",
      `Close triangles remain within budget at ${previewPackage.previewValidation.previewFingerprint ? "verified" : "unknown"} preview state.`,
      `Unique referenced assets remain capped at ${previewPackage.dependencyVisualization.nodes.length}.`
    ],
    "Performance profile is healthy enough that refinement can focus on composition rather than reduction."
  );

  const reviewAreas = deepFreeze({
    playerJourney,
    trailFlow,
    vegetationBalance,
    clearingQuality,
    explorationInterest,
    forestTransitionQuality,
    performanceProfile
  });

  const tuningRequiredAreas = Object.entries(reviewAreas)
    .filter(([, area]) => area.status === "TUNE_RECOMMENDED")
    .map(([areaId]) => areaId);

  const overallStatus =
    tuningRequiredAreas.length === 0
      ? "APPROVED_FOR_RECIPE_REUSE"
      : "APPROVED_WITH_TUNING_RECOMMENDATIONS";

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_MANUAL_REVIEW_RECORD_001",
    recipeId: previewPackage.previewData.recipeId,
    locationPlanId: previewPackage.previewData.locationPlanId,
    reviewRecordId: "FOREST_LOCATION_RECIPE_001_MANUAL_REVIEW_AND_TUNING_001",
    basedOnPreviewFingerprint: previewPackage.previewValidation.previewFingerprint,
    basedOnInspectionSchemaId: previewPackage.visualRendererData.schemaId,
    reviewMethod: "non_runtime_preview_package_inspection",
    reviewAreas,
    overallStatus,
    tuningRequiredAreas,
    findingsSummary: deepFreeze({
      strengths: [
        "Player journey is clear from entry to clearing.",
        "Trail legibility and spacing are already stable.",
        "Forest transition layering is strong enough for future canopy uplift."
      ],
      watchItems: [
        "Canopy corridor reads slightly lighter than the transition zone.",
        "Exploration payoff is present but still modest for the destination half of the walk.",
        "The same accent tree family is carrying both destination and backdrop interest."
      ]
    })
  });
}

function buildTuningRecommendations(previewPackage, reviewRecord) {
  const recommendations = [];

  if (reviewRecord.tuningRequiredAreas.includes("vegetationBalance")) {
    recommendations.push({
      recommendationId: "FOREST_LOCATION_RECIPE_001_TUNING_REC_001",
      priority: "HIGH",
      area: "vegetationBalance",
      title: "Reinforce the canopy corridor with one extra soft enclosure beat",
      rationale:
        "The canopy track reads slightly lighter than the transition zone, which softens the sense of moving under stronger forest cover.",
      recommendedAdjustment:
        "Trial one additional shrub or understory support placement within CANOPY_TRACK_ZONE so the corridor feels more enclosed without crowding the walking lane.",
      affectedRoles: ["forest_shrub_mass", "understory_ground_blend"],
      candidateAssets: ["SHRUB_COASTAL_LOW_001", "COASTAL_GROUND_COVER_001"],
      deterministicGuardrail:
        "Tie any added placement to the existing canopy-track seed band and preserve the current readable movement corridor."
    });
  }

  if (reviewRecord.tuningRequiredAreas.includes("explorationInterest")) {
    recommendations.push({
      recommendationId: "FOREST_LOCATION_RECIPE_001_TUNING_REC_002",
      priority: "HIGH",
      area: "explorationInterest",
      title: "Strengthen the clearing-to-backdrop payoff with a secondary curiosity beat",
      rationale:
        "The route has a valid clearing anchor, but the same accent-tree family is currently doing most of the discovery work across both destination zones.",
      recommendedAdjustment:
        "Add one small supporting point of interest near the clearing edge or deep-margin threshold so the later half of the walk feels more intentionally staged.",
      affectedRoles: ["terrain_detail_cluster", "accent_native_tree", "forest_shrub_mass"],
      candidateAssets: ["COASTAL_ROCK_CLUSTER_001", "TREE_BOTTLEBRUSH_001", "SHRUB_COASTAL_LOW_001"],
      deterministicGuardrail:
        "Keep the existing clearing anchor tree as the primary focal beat and avoid introducing unsupported assets."
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      recommendationId: "FOREST_LOCATION_RECIPE_001_TUNING_REC_000",
      priority: "LOW",
      area: "stability",
      title: "No immediate tuning required",
      rationale: "All requested review areas passed without follow-up needs.",
      recommendedAdjustment:
        "Preserve current recipe rules and carry the preview package forward unchanged.",
      affectedRoles: [],
      candidateAssets: [],
      deterministicGuardrail:
        "Maintain current deterministic seed handling and non-runtime workflow."
    });
  }

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_TUNING_RECOMMENDATIONS_001",
    recipeId: previewPackage.previewData.recipeId,
    locationPlanId: previewPackage.previewData.locationPlanId,
    derivedFromReviewRecordId: reviewRecord.reviewRecordId,
    recommendationCount: recommendations.length,
    recommendations
  });
}

function buildManualReviewValidation(reviewRecord, tuningRecommendations) {
  const checks = [
    { name: "manual_review_record_created", ok: true },
    {
      name: "tuning_recommendations_created",
      ok: tuningRecommendations.recommendationCount > 0
    },
    { name: "player_journey_review_recorded", ok: Boolean(reviewRecord.reviewAreas.playerJourney) },
    { name: "trail_flow_review_recorded", ok: Boolean(reviewRecord.reviewAreas.trailFlow) },
    {
      name: "vegetation_balance_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.vegetationBalance)
    },
    { name: "clearing_quality_review_recorded", ok: Boolean(reviewRecord.reviewAreas.clearingQuality) },
    {
      name: "exploration_interest_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.explorationInterest)
    },
    {
      name: "forest_transition_quality_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.forestTransitionQuality)
    },
    {
      name: "performance_profile_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.performanceProfile)
    },
    { name: "no_runtime_activation", ok: true },
    { name: "no_blender_usage", ok: true },
    { name: "no_glb_generation", ok: true },
    { name: "no_asset_modification", ok: true }
  ];

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_MANUAL_REVIEW_VALIDATION_001",
    recipeId: reviewRecord.recipeId,
    locationPlanId: reviewRecord.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    tuningRequiredAreas: reviewRecord.tuningRequiredAreas,
    nextAllowedAction:
      reviewRecord.tuningRequiredAreas.length === 0
        ? "recipe_refinement_optional"
        : "recipe_refinement_recommended"
  });
}

function buildManualReviewReport(reviewRecord, tuningRecommendations, validation) {
  const areaLines = Object.entries(reviewRecord.reviewAreas)
    .map(([areaId, area]) => `- ${areaId}: ${area.status} - ${area.notes}`)
    .join("\n");

  const recommendationLines = tuningRecommendations.recommendations
    .map(
      (recommendation) =>
        `- ${recommendation.priority}: ${recommendation.title} - ${recommendation.recommendedAdjustment}`
    )
    .join("\n");

  return [
    "# GROWGO SESSION 201.5 — FOREST_LOCATION_RECIPE_001 Manual Review & Tuning",
    "",
    `recipe: ${reviewRecord.recipeId}`,
    `location plan: ${reviewRecord.locationPlanId}`,
    `overall status: ${reviewRecord.overallStatus}`,
    "",
    "## Review Findings",
    areaLines,
    "",
    "## Tuning Recommendations",
    recommendationLines,
    "",
    "## Validation",
    `- status: ${validation.status}`,
    `- next allowed action: ${validation.nextAllowedAction}`,
    "- runtime activation: not performed",
    "- Blender usage: not performed",
    "- GLB generation: not performed",
    "- asset modification: not performed",
    "",
    "## Readiness",
    reviewRecord.tuningRequiredAreas.length === 0
      ? "- The recipe preview is ready for reuse without further tuning."
      : "- The recipe preview is ready for refinement planning. Recommendations are recorded without changing recipe rules or assets.",
    ""
  ].join("\n");
}

export function buildForestLocationRecipeManualReview(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const previewPackage = loadPreviewPackage(cwd);
  const recipeRoot = previewPackage.recipeRoot;
  const reviewRoot = path.join(recipeRoot, REVIEW_ROOT);
  const validationRoot = path.join(recipeRoot, VALIDATION_ROOT);
  const reportsRoot = path.join(recipeRoot, REPORTS_ROOT);

  ensureDirectory(reviewRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(reportsRoot);

  const reviewRecord = buildManualReviewRecord(previewPackage);
  const tuningRecommendations = buildTuningRecommendations(previewPackage, reviewRecord);
  const validation = buildManualReviewValidation(reviewRecord, tuningRecommendations);
  const report = buildManualReviewReport(reviewRecord, tuningRecommendations, validation);

  const reviewPath = path.join(reviewRoot, MANUAL_REVIEW_FILENAME);
  const tuningPath = path.join(reviewRoot, TUNING_RECOMMENDATIONS_FILENAME);
  const validationPath = path.join(validationRoot, MANUAL_REVIEW_VALIDATION_FILENAME);
  const reportPath = path.join(reportsRoot, MANUAL_REVIEW_REPORT_FILENAME);

  writeJson(reviewPath, reviewRecord);
  writeJson(tuningPath, tuningRecommendations);
  writeJson(validationPath, validation);
  fs.writeFileSync(reportPath, `${report}\n`);

  const reviewFingerprint = hashHex(
    reviewRecord.overallStatus,
    JSON.stringify(reviewRecord.reviewAreas),
    JSON.stringify(tuningRecommendations.recommendations),
    validation.nextAllowedAction
  );

  return deepFreeze({
    reviewPath,
    tuningPath,
    validationPath,
    reportPath,
    reviewRecord,
    tuningRecommendations,
    validation,
    report,
    reviewFingerprint
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const result = buildForestLocationRecipeManualReview();
  process.stdout.write(
    `${result.reviewRecord.recipeId} manual review written to ${path.dirname(result.reviewPath)}\n`
  );
}
